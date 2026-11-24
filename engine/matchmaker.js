/**
 * engine/matchmaker.js
 * 
 * Shared Atomic Random Battle Assorting & Matchmaking Subsystem for Battle Spirits Eternal (BSP).
 * Backed by SQLite (SessionStore.db) with BEGIN IMMEDIATE atomic pairing so multiple
 * server processes/instances sharing the same DB_PATH share one authoritative queue,
 * with automatic fallback to in-memory Maps when no DB is attached.
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateSecureToken, EXECUTION_MODES, PLAYER_CONTROL_TYPES } from './session_mode.js';
import { getDefaultSessionManager } from './session_manager.js';

let _cachedStdDecks = null;
let _cachedCardsByName = null;

function resolveDeckCards(deckId, explicitDeck) {
  if (Array.isArray(explicitDeck) && explicitDeck.length > 0) return explicitDeck;
  try {
    if (!_cachedStdDecks) {
      const raw = JSON.parse(fs.readFileSync(path.resolve('standard_decks_data.json'), 'utf8'));
      _cachedStdDecks = raw?.decks || [];
    }
    if (!_cachedCardsByName) {
      const details = JSON.parse(fs.readFileSync(path.resolve('data/cards_detailed.json'), 'utf8'));
      _cachedCardsByName = new Map();
      for (const c of Object.values(details)) {
        if (c && c.name && !_cachedCardsByName.has(c.name.toLowerCase())) {
          _cachedCardsByName.set(c.name.toLowerCase(), c);
        }
      }
    }
    const norm = String(deckId || 'red').toLowerCase().replace(/^deck_std_/, 'std-');
    const matchedDeck = _cachedStdDecks.find(d =>
      String(d.id || '').toLowerCase() === norm ||
      String(d.color || '').toLowerCase() === norm.replace(/^std-/, '')
    ) || _cachedStdDecks[0];

    if (matchedDeck && Array.isArray(matchedDeck.cards)) {
      const list = [];
      for (const [name, qty] of matchedDeck.cards) {
        const def = _cachedCardsByName.get(String(name || '').toLowerCase()) || {
          card_number: `STD-${list.length + 1}`,
          name: String(name || 'Spirit'),
          type: 'Spirit',
          cost: 2,
          color: matchedDeck.color || 'Red',
          bp: 2000
        };
        const count = Math.max(1, Number(qty) || 1);
        for (let i = 0; i < count; i++) list.push({ ...def });
      }
      if (list.length > 0) return list;
    }
  } catch (_) {}
  return Array.from({ length: 40 }, (_, i) => ({
    card_number: `MM-STD-${i + 1}`,
    name: `Standard Spirit ${i + 1}`,
    type: 'Spirit',
    cost: 2,
    color: 'Red',
    bp: 2000
  }));
}

export const MATCHMAKER_STATUS = Object.freeze({
  SEARCHING: 'SEARCHING',
  MATCHED: 'MATCHED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
});

export const DEFAULT_LEASE_MS = 20000; // 20 seconds lease for active polling
export const DEFAULT_MATCH_KEEP_MS = 60000; // 60 seconds retention for matched/cancelled tickets

export class Matchmaker {
  constructor(options = {}) {
    this.sessionManager = options.sessionManager || getDefaultSessionManager();
    this.timeProvider = options.timeProvider || (() => Date.now());
    this.leaseMs = options.leaseMs || DEFAULT_LEASE_MS;
    this.matchKeepMs = options.matchKeepMs || DEFAULT_MATCH_KEEP_MS;

    // Fallback in-memory stores (used only if SessionStore has no db)
    this.queue = new Map();
    this.matches = new Map();
    this.cancelled = new Set();
  }

  get db() {
    return this.sessionManager?.store?.db || null;
  }

  now() {
    return this.timeProvider();
  }

  /**
   * Prunes stale searchers who stopped polling, and cleans up expired matched/cancelled records.
   */
  pruneStaleTickets() {
    const curTime = this.now();
    if (this.db) {
      const searchCutoff = curTime - this.leaseMs;
      const keepCutoff = curTime - this.matchKeepMs;
      this.db.prepare(
        `DELETE FROM matchmaking_tickets WHERE status IN ('SEARCHING', 'PAIRING') AND last_seen < ?`
      ).run(searchCutoff);
      this.db.prepare(
        `DELETE FROM matchmaking_tickets WHERE status IN ('MATCHED', 'CANCELLED', 'EXPIRED') AND COALESCE(matched_at, last_seen) < ?`
      ).run(keepCutoff);
      return;
    }

    for (const [tId, ticket] of this.queue.entries()) {
      if (curTime - ticket.lastSeen > this.leaseMs) {
        this.queue.delete(tId);
      }
    }
    for (const [tId, match] of this.matches.entries()) {
      if (curTime - match.matchedAt > this.matchKeepMs) {
        this.matches.delete(tId);
      }
    }
  }

  /**
   * Enters matchmaking queue.
   * Atomically pairs two distinct players into a single persistent HUMAN_VS_HUMAN match.
   */
  async enterQueue(playerInfo = {}) {
    this.pruneStaleTickets();

    const playerId = playerInfo.playerId || generateSecureToken('usr');
    const playerName = playerInfo.playerName || 'Challenger';
    let deckId = playerInfo.deckId || 'red';
    if (deckId === 'random') {
      const realmDecks = ['deck_std_red', 'deck_std_purple', 'deck_std_green', 'deck_std_white', 'deck_std_yellow', 'deck_std_blue'];
      deckId = realmDecks[Math.floor(Math.random() * realmDecks.length)];
    }
    const deck = playerInfo.deck || null;
    const curTime = this.now();

    if (this.db) {
      let claimedOpponent = null;
      let existingTicket = null;
      let p2TicketId = null;

      this.db.exec('BEGIN IMMEDIATE;');
      try {
        // 1. Check if this player already has an active SEARCHING ticket
        existingTicket = this.db.prepare(
          `SELECT * FROM matchmaking_tickets WHERE player_id = ? AND status = 'SEARCHING' LIMIT 1`
        ).get(playerId);

        if (existingTicket) {
          this.db.prepare(
            `UPDATE matchmaking_tickets SET last_seen = ?, player_name = ?, deck_id = ?, deck_json = ? WHERE ticket_id = ?`
          ).run(curTime, playerName, deckId, deck ? JSON.stringify(deck) : null, existingTicket.ticket_id);
          const countRow = this.db.prepare(`SELECT COUNT(*) AS cnt FROM matchmaking_tickets WHERE status = 'SEARCHING'`).get();
          this.db.exec('COMMIT;');
          return {
            status: MATCHMAKER_STATUS.SEARCHING,
            ticketId: existingTicket.ticket_id,
            queueSize: countRow ? countRow.cnt : 1
          };
        }

        // 2. Atomically claim the oldest eligible opponent ticket (different player_id)
        const candidate = this.db.prepare(
          `SELECT * FROM matchmaking_tickets WHERE status = 'SEARCHING' AND player_id != ? ORDER BY queued_at ASC LIMIT 1`
        ).get(playerId);

        if (candidate) {
          const claim = this.db.prepare(
            `UPDATE matchmaking_tickets SET status = 'PAIRING', last_seen = ? WHERE ticket_id = ? AND status = 'SEARCHING'`
          ).run(curTime, candidate.ticket_id);

          if (claim.changes === 1) {
            claimedOpponent = candidate;
            p2TicketId = generateSecureToken('mm');
            this.db.prepare(
              `INSERT INTO matchmaking_tickets (ticket_id, player_id, player_name, deck_id, deck_json, status, queued_at, last_seen)
               VALUES (?, ?, ?, ?, ?, 'PAIRING', ?, ?)`
            ).run(p2TicketId, playerId, playerName, deckId, deck ? JSON.stringify(deck) : null, curTime, curTime);
          }
        } else {
          // 4. No opponent waiting -> Insert new SEARCHING ticket
          const ticketId = generateSecureToken('mm');
          this.db.prepare(
            `INSERT INTO matchmaking_tickets (ticket_id, player_id, player_name, deck_id, deck_json, status, queued_at, last_seen)
             VALUES (?, ?, ?, ?, ?, 'SEARCHING', ?, ?)`
          ).run(ticketId, playerId, playerName, deckId, deck ? JSON.stringify(deck) : null, curTime, curTime);
          const countRow = this.db.prepare(`SELECT COUNT(*) AS cnt FROM matchmaking_tickets WHERE status = 'SEARCHING'`).get();
          this.db.exec('COMMIT;');
          return {
            status: MATCHMAKER_STATUS.SEARCHING,
            ticketId,
            queueSize: countRow ? countRow.cnt : 1
          };
        }
        this.db.exec('COMMIT;');
      } catch (err) {
        try { this.db.exec('ROLLBACK;'); } catch (_) {}
        throw err;
      }

      // 3. Create the single authoritative HUMAN_VS_HUMAN session outside the SQLite write lock
      if (claimedOpponent) {
        const p1Deck = claimedOpponent.deck_json ? JSON.parse(claimedOpponent.deck_json) : null;
        const matchId = generateSecureToken('match');
        const firstPlayer = Math.random() < 0.5 ? 'player' : 'opponent';

        try {
          const matchResult = await this.sessionManager.createMatch({
            matchId,
            mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
            firstPlayer,
            player1: {
              id: claimedOpponent.player_id,
              name: claimedOpponent.player_name,
              controlType: PLAYER_CONTROL_TYPES.HUMAN,
              deck: resolveDeckCards(claimedOpponent.deck_id, p1Deck),
              deckId: claimedOpponent.deck_id || null
            },
            player2: {
              id: playerId,
              name: playerName,
              controlType: PLAYER_CONTROL_TYPES.HUMAN,
              deck: resolveDeckCards(deckId, deck),
              deckId: deckId || null,
              autoJoined: true
            }
          });

          const matchedAt = this.now();
          this.db.exec('BEGIN IMMEDIATE;');
          try {
            this.db.prepare(
              `UPDATE matchmaking_tickets
               SET status = 'MATCHED', match_id = ?, auth_token = ?, player_side = 'player', opponent_name = ?, opponent_deck = ?, matched_at = ?, last_seen = ?
               WHERE ticket_id = ?`
            ).run(matchResult.matchId, matchResult.player1Token, playerName, deckId || null, matchedAt, matchedAt, claimedOpponent.ticket_id);

            this.db.prepare(
              `UPDATE matchmaking_tickets
               SET status = 'MATCHED', match_id = ?, auth_token = ?, player_side = 'opponent', opponent_name = ?, opponent_deck = ?, matched_at = ?, last_seen = ?
               WHERE ticket_id = ?`
            ).run(matchResult.matchId, matchResult.player2Token, claimedOpponent.player_name, claimedOpponent.deck_id || null, matchedAt, matchedAt, p2TicketId);
            this.db.exec('COMMIT;');
          } catch (updErr) {
            try { this.db.exec('ROLLBACK;'); } catch (_) {}
            throw updErr;
          }

          return {
            status: MATCHMAKER_STATUS.MATCHED,
            ticketId: p2TicketId,
            matchId: matchResult.matchId,
            authToken: matchResult.player2Token,
            playerSide: 'opponent',
            playerName,
            opponentName: claimedOpponent.player_name,
            playerDeck: deckId || deck,
            opponentDeck: claimedOpponent.deck_id || p1Deck,
            matchedAt
          };
        } catch (createErr) {
          // Roll back claimed opponent ticket to SEARCHING on failure
          try {
            this.db.prepare(`UPDATE matchmaking_tickets SET status = 'SEARCHING' WHERE ticket_id = ?`).run(claimedOpponent.ticket_id);
            this.db.prepare(`DELETE FROM matchmaking_tickets WHERE ticket_id = ?`).run(p2TicketId);
          } catch (_) {}
          throw createErr;
        }
      }
    }

    // In-memory fallback when no DB is attached
    for (const [tId, ticket] of this.queue.entries()) {
      if (ticket.playerId === playerId) {
        ticket.lastSeen = curTime;
        ticket.playerName = playerName;
        ticket.deckId = deckId;
        ticket.deck = deck;
        return {
          status: MATCHMAKER_STATUS.SEARCHING,
          ticketId: tId,
          queueSize: this.queue.size
        };
      }
    }

    let waitingOpponent = null;
    for (const candidate of this.queue.values()) {
      if (candidate.playerId !== playerId) {
        waitingOpponent = candidate;
        break;
      }
    }

    if (waitingOpponent) {
      this.queue.delete(waitingOpponent.ticketId);
      const p1 = waitingOpponent;
      const p2 = { playerId, playerName, deckId, deck };
      const matchId = generateSecureToken('match');
      const firstPlayer = Math.random() < 0.5 ? 'player' : 'opponent';

      const matchResult = await this.sessionManager.createMatch({
        matchId,
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        firstPlayer,
        player1: { id: p1.playerId, name: p1.playerName, controlType: PLAYER_CONTROL_TYPES.HUMAN, deck: resolveDeckCards(p1.deckId, p1.deck), deckId: p1.deckId || null },
        player2: { id: p2.playerId, name: p2.playerName, controlType: PLAYER_CONTROL_TYPES.HUMAN, deck: resolveDeckCards(p2.deckId, p2.deck), deckId: p2.deckId || null, autoJoined: true }
      });

      const p2TicketId = generateSecureToken('mm');
      const matchedAt = this.now();
      const p1MatchData = {
        status: MATCHMAKER_STATUS.MATCHED,
        ticketId: p1.ticketId,
        matchId: matchResult.matchId,
        authToken: matchResult.player1Token,
        playerSide: 'player',
        playerName: p1.playerName,
        opponentName: p2.playerName,
        playerDeck: p1.deckId || p1.deck,
        opponentDeck: p2.deckId || p2.deck,
        matchedAt
      };
      const p2MatchData = {
        status: MATCHMAKER_STATUS.MATCHED,
        ticketId: p2TicketId,
        matchId: matchResult.matchId,
        authToken: matchResult.player2Token,
        playerSide: 'opponent',
        playerName: p2.playerName,
        opponentName: p1.playerName,
        playerDeck: p2.deckId || p2.deck,
        opponentDeck: p1.deckId || p1.deck,
        matchedAt
      };
      this.matches.set(p1.ticketId, p1MatchData);
      this.matches.set(p2TicketId, p2MatchData);
      return p2MatchData;
    }

    const ticketId = generateSecureToken('mm');
    this.queue.set(ticketId, { ticketId, playerId, playerName, deckId, deck, queuedAt: curTime, lastSeen: curTime });
    return { status: MATCHMAKER_STATUS.SEARCHING, ticketId, queueSize: this.queue.size };
  }

  /**
   * Polls matchmaking ticket status.
   */
  pollQueue(ticketId) {
    this.pruneStaleTickets();
    const curTime = this.now();

    if (this.db) {
      const row = this.db.prepare(`SELECT * FROM matchmaking_tickets WHERE ticket_id = ?`).get(ticketId);
      if (!row) {
        return {
          status: MATCHMAKER_STATUS.EXPIRED,
          ticketId,
          reason: 'TICKET_NOT_FOUND_OR_EXPIRED'
        };
      }
      if (row.status === MATCHMAKER_STATUS.CANCELLED) {
        return { status: MATCHMAKER_STATUS.CANCELLED, ticketId };
      }
      if (row.status === MATCHMAKER_STATUS.MATCHED) {
        return {
          status: MATCHMAKER_STATUS.MATCHED,
          ticketId: row.ticket_id,
          matchId: row.match_id,
          authToken: row.auth_token,
          playerSide: row.player_side,
          playerName: row.player_name,
          opponentName: row.opponent_name,
          playerDeck: row.deck_id,
          opponentDeck: row.opponent_deck,
          matchedAt: row.matched_at
        };
      }
      this.db.prepare(`UPDATE matchmaking_tickets SET last_seen = ? WHERE ticket_id = ?`).run(curTime, ticketId);
      const countRow = this.db.prepare(`SELECT COUNT(*) AS cnt FROM matchmaking_tickets WHERE status = 'SEARCHING'`).get();
      return {
        status: MATCHMAKER_STATUS.SEARCHING,
        ticketId,
        queueSize: countRow ? countRow.cnt : 1,
        elapsedMs: curTime - row.queued_at
      };
    }

    if (this.cancelled.has(ticketId)) {
      return { status: MATCHMAKER_STATUS.CANCELLED, ticketId };
    }
    if (this.matches.has(ticketId)) {
      return this.matches.get(ticketId);
    }
    if (this.queue.has(ticketId)) {
      const ticket = this.queue.get(ticketId);
      ticket.lastSeen = curTime;
      return {
        status: MATCHMAKER_STATUS.SEARCHING,
        ticketId,
        queueSize: this.queue.size,
        elapsedMs: curTime - ticket.queuedAt
      };
    }
    return { status: MATCHMAKER_STATUS.EXPIRED, ticketId, reason: 'TICKET_NOT_FOUND_OR_EXPIRED' };
  }

  /**
   * Cancels search and prevents cancelled ticket from ever being paired afterward.
   */
  leaveQueue(ticketId) {
    const curTime = this.now();
    if (this.db) {
      this.db.prepare(
        `UPDATE matchmaking_tickets SET status = 'CANCELLED', last_seen = ? WHERE ticket_id = ? AND status = 'SEARCHING'`
      ).run(curTime, ticketId);
    } else {
      this.queue.delete(ticketId);
      this.cancelled.add(ticketId);
    }
    return {
      success: true,
      status: MATCHMAKER_STATUS.CANCELLED
    };
  }

  /**
   * Returns current matchmaking stats.
   */
  getQueueStats() {
    this.pruneStaleTickets();
    const curTime = this.now();
    if (this.db) {
      const rows = this.db.prepare(
        `SELECT ticket_id, player_name, queued_at FROM matchmaking_tickets WHERE status = 'SEARCHING' ORDER BY queued_at ASC`
      ).all();
      return {
        queueSize: rows.length,
        activeSearches: rows.map(t => ({
          ticketId: t.ticket_id,
          playerName: t.player_name,
          elapsedSec: Math.floor((curTime - t.queued_at) / 1000)
        }))
      };
    }
    return {
      queueSize: this.queue.size,
      activeSearches: Array.from(this.queue.values()).map(t => ({
        ticketId: t.ticketId,
        playerName: t.playerName,
        elapsedSec: Math.floor((curTime - t.queuedAt) / 1000)
      }))
    };
  }
}

let defaultMatchmaker = null;

export function getDefaultMatchmaker() {
  if (!defaultMatchmaker) {
    defaultMatchmaker = new Matchmaker();
  }
  return defaultMatchmaker;
}
