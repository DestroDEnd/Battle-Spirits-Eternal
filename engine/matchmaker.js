/**
 * engine/matchmaker.js
 * 
 * Random Battle Assorting & Matchmaking Subsystem for Battle Spirits Eternal (BSP).
 * Implements Pokémon Showdown-style Quick Matchmaking:
 * - In-memory queue of waiting duelists with automatic stale ticket pruning.
 * - Atomic pairing of any two searching players into a persistent HUMAN_VS_HUMAN match.
 * - Distinct token and role assignment (Player 1 vs Player 2).
 * - Self-pairing prevention and search cancellation.
 */

import { generateSecureToken, EXECUTION_MODES, PLAYER_CONTROL_TYPES } from './session_mode.js';
import { getDefaultSessionManager } from './session_manager.js';

export const MATCHMAKER_STATUS = Object.freeze({
  SEARCHING: 'SEARCHING',
  MATCHED: 'MATCHED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
});

export const DEFAULT_LEASE_MS = 20000; // 20 seconds lease for active polling
export const DEFAULT_MATCH_KEEP_MS = 60000; // 60 seconds retention for matched tickets

export class Matchmaker {
  constructor(options = {}) {
    this.sessionManager = options.sessionManager || getDefaultSessionManager();
    this.timeProvider = options.timeProvider || (() => Date.now());
    this.leaseMs = options.leaseMs || DEFAULT_LEASE_MS;
    this.matchKeepMs = options.matchKeepMs || DEFAULT_MATCH_KEEP_MS;

    this.queue = new Map(); // ticketId -> { ticketId, playerId, playerName, deckId, deck, queuedAt, lastSeen }
    this.matches = new Map(); // ticketId -> matchData
  }

  now() {
    return this.timeProvider();
  }

  /**
   * Prunes stale searchers who stopped polling, and cleans up expired matched records.
   */
  pruneStaleTickets() {
    const curTime = this.now();
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
   * If another duelist is waiting, immediately pairs both into a persistent match!
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

    // 1. Check if this player already has an active ticket in queue
    for (const [tId, ticket] of this.queue.entries()) {
      if (ticket.playerId === playerId) {
        ticket.lastSeen = this.now();
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

    // 2. Search for an eligible opponent in the waiting queue (different playerId)
    let waitingOpponent = null;
    for (const [tId, candidate] of this.queue.entries()) {
      if (candidate.playerId !== playerId) {
        waitingOpponent = candidate;
        break;
      }
    }

    // 3. If opponent found -> Pair immediately!
    if (waitingOpponent) {
      this.queue.delete(waitingOpponent.ticketId);

      const p1 = waitingOpponent;
      const p2 = {
        playerId,
        playerName,
        deckId,
        deck
      };

      const matchId = generateSecureToken('match');
      const firstPlayer = Math.random() < 0.5 ? 'player' : 'opponent';

      const matchResult = await this.sessionManager.createMatch({
        matchId,
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        firstPlayer,
        player1: {
          id: p1.playerId,
          name: p1.playerName,
          controlType: PLAYER_CONTROL_TYPES.HUMAN,
          deck: p1.deckId || p1.deck
        },
        player2: {
          id: p2.playerId,
          name: p2.playerName,
          controlType: PLAYER_CONTROL_TYPES.HUMAN,
          deck: p2.deckId || p2.deck,
          autoJoined: true
        }
      });

      const p2TicketId = generateSecureToken('mm');

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
        matchedAt: this.now()
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
        matchedAt: this.now()
      };

      this.matches.set(p1.ticketId, p1MatchData);
      this.matches.set(p2TicketId, p2MatchData);

      return p2MatchData;
    }

    // 4. No opponent waiting -> Add to queue
    const ticketId = generateSecureToken('mm');
    const newTicket = {
      ticketId,
      playerId,
      playerName,
      deckId,
      deck,
      queuedAt: this.now(),
      lastSeen: this.now()
    };
    this.queue.set(ticketId, newTicket);

    return {
      status: MATCHMAKER_STATUS.SEARCHING,
      ticketId,
      queueSize: this.queue.size
    };
  }

  /**
   * Polls matchmaking ticket status.
   */
  pollQueue(ticketId) {
    this.pruneStaleTickets();

    if (this.matches.has(ticketId)) {
      return this.matches.get(ticketId);
    }

    if (this.queue.has(ticketId)) {
      const ticket = this.queue.get(ticketId);
      ticket.lastSeen = this.now();
      return {
        status: MATCHMAKER_STATUS.SEARCHING,
        ticketId,
        queueSize: this.queue.size,
        elapsedMs: this.now() - ticket.queuedAt
      };
    }

    return {
      status: MATCHMAKER_STATUS.EXPIRED,
      ticketId,
      reason: 'TICKET_NOT_FOUND_OR_EXPIRED'
    };
  }

  /**
   * Cancels search and removes ticket from queue.
   */
  leaveQueue(ticketId) {
    if (this.queue.has(ticketId)) {
      this.queue.delete(ticketId);
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
    return {
      queueSize: this.queue.size,
      activeSearches: Array.from(this.queue.values()).map(t => ({
        ticketId: t.ticketId,
        playerName: t.playerName,
        elapsedSec: Math.floor((this.now() - t.queuedAt) / 1000)
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
