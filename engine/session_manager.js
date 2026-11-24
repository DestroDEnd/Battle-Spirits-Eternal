/**
 * engine/session_manager.js
 * 
 * Battle Session Manager for Battle Spirits Eternal (Phase M).
 * Implements Pokémon Showdown-style match lifecycle, persistent match ownership,
 * server-authoritative 4-minute turn clock with 1-minute visual countdown warning,
 * disconnection/reconnection policies, and complete engine restoration.
 */

import { getDefaultSessionStore, hashToken, SessionStore } from './session_store.js';
import { serializeGameState, deserializeGameState, redactGameStateForViewer, scrubCredentials } from './state_serialization.js';
import { createCardInstance, createFieldStack } from './state.js';
import { createGame } from './index.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES, generateSecureToken, MatchContext } from './session_mode.js';
import { INTERACTION_STATUS } from './interaction.js';
import { authorizeAction, RESPONSE_WINDOW_ACTIONS } from './action_authority.js';
import { validateCardPathway, ACTION_PATHWAYS } from './card_types.js';
const responseWindowActions = RESPONSE_WINDOW_ACTIONS;

export const SESSION_STATUS = Object.freeze({
  WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
  ACTIVE: 'ACTIVE',
  AWAITING_PLAYER: 'AWAITING_PLAYER',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  SUSPENDED: 'SUSPENDED',
  COMPLETED: 'COMPLETED',
  FORFEITED: 'FORFEITED',
  CANCELLED: 'CANCELLED'
});

export const TURN_CLOCK_MS = 240000; // 4 minutes (240 seconds)
export const WARNING_THRESHOLD_MS = 60000; // 1 minute (60 seconds)

/**
 * Produces a deterministic canonical representation of an action payload
 * across all execution-relevant semantic fields for robust idempotency hashing.
 */
export function normalizeActionPayload(action = {}, participant = null) {
  const semantic = {};

  if (participant) {
    semantic.participant = String(participant);
  }

  semantic.type = action.type ? String(action.type).trim() : '';

  if (action.cardId !== undefined) {
    semantic.cardId = String(action.cardId);
  } else if (action.card !== undefined) {
    if (typeof action.card === 'object' && action.card !== null) {
      semantic.cardId = String(action.card.id || action.card.cardNumber || action.card.name || '');
    } else {
      semantic.cardId = String(action.card);
    }
  }

  if (action.abilityId !== undefined) {
    semantic.abilityId = String(action.abilityId);
  } else if (action.abilityIndex !== undefined) {
    semantic.abilityIndex = Number(action.abilityIndex);
  }

  if (action.stackId !== undefined) semantic.stackId = String(action.stackId);
  if (action.targetStackId !== undefined) semantic.targetStackId = String(action.targetStackId);
  if (action.targetId !== undefined) semantic.targetId = String(action.targetId);
  if (action.swapStackId !== undefined) semantic.swapStackId = String(action.swapStackId);
  if (action.braveCardId !== undefined) semantic.braveCardId = String(action.braveCardId);

  if (action.cores !== undefined) semantic.cores = Number(action.cores);
  if (action.coresFromReserve !== undefined) semantic.coresFromReserve = Number(action.coresFromReserve);
  if (action.count !== undefined) semantic.count = Number(action.count);
  if (action.from !== undefined) semantic.from = String(action.from);
  if (action.to !== undefined) semantic.to = String(action.to);
  if (action.fromZone !== undefined) semantic.fromZone = String(action.fromZone);

  if (action.payment !== undefined) {
    semantic.payment = Array.isArray(action.payment) ? [...action.payment].sort() : action.payment;
  }
  if (action.costReduction !== undefined) {
    semantic.costReduction = Array.isArray(action.costReduction) ? [...action.costReduction].sort() : action.costReduction;
  }

  if (action.response !== undefined) {
    if (typeof action.response === 'object' && action.response !== null) {
      const resp = {};
      for (const k of Object.keys(action.response).sort()) {
        resp[k] = action.response[k];
      }
      semantic.response = resp;
    } else {
      semantic.response = action.response;
    }
  }

  if (action.step !== undefined) semantic.step = String(action.step);
  if (action.interactionId !== undefined) semantic.interactionId = String(action.interactionId);

  if (action.options && typeof action.options === 'object') {
    const opts = {};
    for (const k of Object.keys(action.options).sort()) {
      opts[k] = action.options[k];
    }
    semantic.options = opts;
  }

  const sortedKeys = Object.keys(semantic).sort();
  const sorted = {};
  for (const k of sortedKeys) {
    sorted[k] = semantic[k];
  }

  return JSON.stringify(sorted);
}

export class BattleSessionManager {
  constructor(options = {}) {
    this.store = options.store || getDefaultSessionStore();
    this.activeGames = new Map(); // matchId -> { game, session, clock, eventSeq }
    this.heartbeats = new Map(); // matchId -> { player: timestamp, opponent: timestamp }
    this.listeners = new Map(); // matchId -> Set of { viewerSide, callback }
    this.transportTickets = new Map(); // ticketId -> { matchId, viewerSide, tokenHash, expiresAt, used }
    this.timeProvider = options.timeProvider || (() => Date.now());
  }

  issueTransportTicket(matchId, authToken) {
    if (!authToken) {
      const err = new Error('AUTHENTICATION_REQUIRED: Missing authentication token');
      err.code = 'AUTHENTICATION_REQUIRED';
      throw err;
    }
    const session = this.store.loadSession(matchId);
    if (!session) {
      const err = new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
      err.code = 'MATCH_NOT_FOUND';
      throw err;
    }
    const tokenH = hashToken(authToken);
    let viewerSide = null;
    if (session.player1.tokenHash === tokenH) viewerSide = 'player';
    else if (session.player2.tokenHash === tokenH) viewerSide = 'opponent';

    if (!viewerSide) {
      const err = new Error('INVALID_AUTH_TOKEN: Provided token does not match authorized participant');
      err.code = 'INVALID_AUTH_TOKEN';
      throw err;
    }

    const ticket = generateSecureToken('tkt');
    this.transportTickets.set(ticket, {
      matchId,
      viewerSide,
      tokenHash: tokenH,
      expiresAt: this.now() + 60000,
      used: false
    });

    return { ticket, expiresIn: 60 };
  }

  redeemTransportTicket(ticket, matchId) {
    if (!ticket) return null;
    const data = this.transportTickets.get(ticket);
    if (!data) return null;
    if (data.used) return null;
    if (data.expiresAt < this.now()) {
      this.transportTickets.delete(ticket);
      return null;
    }
    if (matchId && data.matchId !== matchId) return null;
    data.used = true;
    this.transportTickets.delete(ticket);
    return data;
  }

  now() {
    return this.timeProvider();
  }

  /**
   * Subscribes a listener to real-time events for a match.
   */
  subscribe(matchId, viewerSide, callback) {
    let matchSubs = this.listeners.get(matchId);
    if (!matchSubs) {
      matchSubs = new Set();
      this.listeners.set(matchId, matchSubs);
    }
    const entry = { viewerSide, callback };
    matchSubs.add(entry);
    return () => {
      matchSubs.delete(entry);
      if (matchSubs.size === 0) {
        this.listeners.delete(matchId);
      }
    };
  }

  /**
   * Broadcasts a match event to all active real-time subscribers with viewer-specific redaction.
   */
  broadcastEvent(matchId, event) {
    const matchSubs = this.listeners.get(matchId);
    if (!matchSubs || matchSubs.size === 0) return;
    for (const sub of matchSubs) {
      try {
        const redacted = this.redactEventsForViewer([event], sub.viewerSide);
        if (redacted.length > 0) {
          sub.callback(redacted[0]);
        }
      } catch (err) {
        console.error('[SessionManager] Event broadcast error:', err.message);
      }
    }
  }

  /**
   * Records an event in storage and broadcasts to subscribers.
   */
  _recordAndBroadcastEvent(matchId, seq, type, payload) {
    const cleanPayload = scrubCredentials(payload ? JSON.parse(JSON.stringify(payload)) : {});
    this.store.recordEvent(matchId, seq, type, cleanPayload);
    this.broadcastEvent(matchId, {
      seq,
      type,
      payload: cleanPayload,
      createdAt: this.now()
    });
  }

  /**
   * Creates a new persistent battle match session.
   */
  async createMatch(options = {}) {
    const matchId = options.matchId || generateSecureToken('match');
    const mode = options.mode || EXECUTION_MODES.HUMAN_VS_AI;
    const firstPlayer = options.firstPlayer || 'player';

    // Generate cryptographically secure auth tokens
    const p1Token = options.player1?.authToken || generateSecureToken('p1');
    const p2Token = options.player2?.authToken || generateSecureToken('p2');

    const p1Control = options.player1?.controlType ||
      (mode === EXECUTION_MODES.HUMAN_VS_HUMAN || mode === EXECUTION_MODES.HUMAN_VS_AI ? PLAYER_CONTROL_TYPES.HUMAN : PLAYER_CONTROL_TYPES.AI);
    const p2Control = options.player2?.controlType ||
      (mode === EXECUTION_MODES.HUMAN_VS_HUMAN ? PLAYER_CONTROL_TYPES.HUMAN : (mode === EXECUTION_MODES.HEADLESS_SIMULATION ? PLAYER_CONTROL_TYPES.SIMULATION : PLAYER_CONTROL_TYPES.AI));

    const p1 = {
      id: options.player1?.id || 'player',
      name: options.player1?.name || 'Player 1',
      controlType: p1Control,
      authToken: p1Token,
      tokenHash: hashToken(p1Token),
      connected: true,
      lastHeartbeat: this.now()
    };

    const p2 = {
      id: options.player2?.id || 'opponent',
      name: options.player2?.name || (p2Control === PLAYER_CONTROL_TYPES.HUMAN ? 'Player 2' : 'AI Champion'),
      controlType: p2Control,
      authToken: p2Token,
      tokenHash: hashToken(p2Token),
      connected: Boolean(options.player2?.connected || options.player2?.autoJoined || p2Control !== PLAYER_CONTROL_TYPES.HUMAN),
      lastHeartbeat: this.now()
    };

    // Initialize game
    const game = createGame({
      playerDeck: options.playerDeck || options.player1?.deck || [],
      opponentDeck: options.opponentDeck || options.player2?.deck || [],
      firstPlayer,
      strictRules: Boolean(options.strictRules),
      mode,
      matchId,
      interactive: true,
      usePromptManager: true,
      suspendOnInteraction: true,
      requireAuth: options.requireAuth !== false,
      players: {
        player: { id: p1.id, name: p1.name, controlType: p1.controlType },
        opponent: { id: p2.id, name: p2.name, controlType: p2.controlType }
      }
    });

    const initialStatus = (p2Control === PLAYER_CONTROL_TYPES.HUMAN && !options.player2?.autoJoined)
      ? SESSION_STATUS.WAITING_FOR_PLAYERS
      : SESSION_STATUS.ACTIVE;

    const serializedState = serializeGameState(game.state);

    const sessionData = {
      id: matchId,
      mode,
      status: initialStatus,
      player1: p1,
      player2: p2,
      state: serializedState,
      version: 1,
      activePlayer: game.state.activePlayer,
      turnNumber: game.state.turnNumber,
      phase: game.state.step,
      createdAt: this.now(),
      updatedAt: this.now()
    };

    this.store.saveSession(sessionData);

    // Initialize turn clock
    const turnStart = this.now();
    const clockData = {
      matchId,
      activePlayer: game.state.activePlayer,
      turnNumber: game.state.turnNumber,
      turnDurationMs: options.turnDurationMs || TURN_CLOCK_MS,
      turnStartMs: turnStart,
      deadlineMs: turnStart + (options.turnDurationMs || TURN_CLOCK_MS),
      remainingMs: options.turnDurationMs || TURN_CLOCK_MS,
      paused: initialStatus === SESSION_STATUS.WAITING_FOR_PLAYERS,
      pauseReason: initialStatus === SESSION_STATUS.WAITING_FOR_PLAYERS ? 'WAITING_FOR_OPPONENT' : null,
      accumulatedPauseMs: 0,
      lastTickMs: turnStart,
      warningThresholdMs: options.warningThresholdMs || WARNING_THRESHOLD_MS,
      timeoutProcessed: false
    };

    this.store.saveClock(matchId, clockData);

    // Record MATCH_CREATED event
    this._recordAndBroadcastEvent(matchId, 1, 'MATCH_CREATED', {
      matchId,
      mode,
      firstPlayer,
      status: initialStatus
    });

    // Cache active instance
    this.activeGames.set(matchId, {
      game,
      session: sessionData,
      clock: clockData,
      eventSeq: 1
    });

    return {
      matchId,
      status: initialStatus,
      player1Token: p1Token,
      player2Token: (initialStatus === SESSION_STATUS.WAITING_FOR_PLAYERS) ? undefined : p2Token,
      activePlayer: game.state.activePlayer,
      clock: clockData
    };
  }

  /**
   * Joins a waiting match (e.g. Player 2 in PvP).
   * Atomically persists Player 2's identity, name, controlType, and tokenHash.
   */
  async joinMatch(matchId, playerInfo = {}) {
    const session = this.store.loadSession(matchId);
    if (!session) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
    }

    if (session.status !== SESSION_STATUS.WAITING_FOR_PLAYERS) {
      if (session.status === SESSION_STATUS.ACTIVE) {
        throw new Error(`MATCH_ALREADY_FULL: Match "${matchId}" is already active with 2 participants`);
      }
      throw new Error(`MATCH_UNAVAILABLE: Match "${matchId}" is in status "${session.status}"`);
    }

    const p2Token = generateSecureToken('p2');
    const p2TokenHash = hashToken(p2Token);
    const p2 = {
      id: playerInfo.id || 'opponent',
      name: playerInfo.name || 'Player 2',
      controlType: PLAYER_CONTROL_TYPES.HUMAN,
      authToken: p2Token,
      tokenHash: p2TokenHash,
      connected: true,
      lastHeartbeat: this.now()
    };

    const now = this.now();
    const updated = this.store.updateSessionState(matchId, session.state, session.version, {
      status: SESSION_STATUS.ACTIVE,
      player2Id: p2.id,
      player2Name: p2.name,
      player2Control: p2.controlType,
      player2TokenHash: p2TokenHash,
      player2Connected: true,
      player2LastHeartbeat: now
    });

    // Resume clock
    const clock = this.store.loadClock(matchId);
    if (clock && clock.paused) {
      clock.paused = false;
      clock.pauseReason = null;
      clock.turnStartMs = now;
      clock.deadlineMs = now + clock.remainingMs;
      clock.lastTickMs = now;
      this.store.saveClock(matchId, clock);
    }

    // Refresh memory cache
    const active = this.activeGames.get(matchId);
    if (active) {
      active.session = updated;
      active.clock = clock;
      if (active.game && active.game.state) {
        const prevContext = active.game.state.matchContext;
        active.game.state.matchContext = new MatchContext({
          mode: prevContext ? prevContext.mode : session.mode,
          matchId,
          requireAuth: true,
          players: {
            player: prevContext ? prevContext.players.player : session.player1,
            opponent: {
              id: p2.id,
              name: p2.name,
              controlType: p2.controlType
            }
          }
        });
      }
    }

    // Record PLAYER_JOINED event
    const eventSeq = (active ? active.eventSeq : 1) + 1;
    if (active) active.eventSeq = eventSeq;
    this._recordAndBroadcastEvent(matchId, eventSeq, 'PLAYER_JOINED', {
      matchId,
      playerId: p2.id,
      name: p2.name,
      side: 'opponent'
    });

    return {
      matchId,
      status: SESSION_STATUS.ACTIVE,
      player2Token: p2Token,
      player2: {
        id: p2.id,
        name: p2.name,
        controlType: p2.controlType
      },
      clock
    };
  }

  /**
   * Retrieves match metadata and current status.
   */
  async getMatch(matchId) {
    this._checkTimeout(matchId);
    return this.store.loadSession(matchId);
  }

  /**
   * Verifies identity and restores authorized connection.
   */
  async reconnectToMatch(matchId, authToken) {
    if (!authToken) {
      throw new Error('AUTHENTICATION_REQUIRED: Missing authentication token');
    }

    const session = this.store.loadSession(matchId);
    if (!session) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
    }

    this._checkTimeout(matchId);

    const tokenH = hashToken(authToken);
    let playerSide = null;

    if (session.player1.tokenHash === tokenH) {
      playerSide = 'player';
    } else if (session.player2.tokenHash === tokenH) {
      playerSide = 'opponent';
    }

    if (!playerSide) {
      throw new Error('INVALID_AUTH_TOKEN: Token does not match any registered participant in this match');
    }

    // Update connection state
    const now = this.now();
    const wasSuspended = session.status === SESSION_STATUS.SUSPENDED || session.status === SESSION_STATUS.PLAYER_DISCONNECTED;
    
    let newStatus = session.status;
    let clock = this.store.loadClock(matchId);

    if (session.status !== SESSION_STATUS.COMPLETED && session.status !== SESSION_STATUS.FORFEITED && session.status !== SESSION_STATUS.CANCELLED) {
      const updates = {};
      if (playerSide === 'player') {
        updates.player1Connected = true;
        updates.player1LastHeartbeat = now;
      }
      if (playerSide === 'opponent') {
        updates.player2Connected = true;
        updates.player2LastHeartbeat = now;
      }

      // If was suspended and now resuming:
      if (wasSuspended) {
        newStatus = SESSION_STATUS.ACTIVE;
        updates.status = newStatus;
        if (clock && clock.paused) {
          clock.paused = false;
          clock.pauseReason = null;
          clock.deadlineMs = now + clock.remainingMs;
          clock.lastTickMs = now;
          this.store.saveClock(matchId, clock);
        }
      }

      this.store.updateSessionState(matchId, session.state, session.version, updates);
    }

    // Record & broadcast PLAYER_RECONNECTED event
    const active = this.activeGames.get(matchId);
    const eventSeq = (active ? active.eventSeq : 1) + 1;
    if (active) active.eventSeq = eventSeq;
    this._recordAndBroadcastEvent(matchId, eventSeq, 'PLAYER_RECONNECTED', {
      matchId,
      side: playerSide
    });

    // Load fresh game state
    const restoredGame = await this.restoreMatch(matchId);
    const sanitizedState = redactGameStateForViewer(restoredGame.state, playerSide);
    const updatedClock = this.getClockState(matchId);

    return {
      matchId,
      playerSide,
      status: newStatus,
      state: sanitizedState,
      clock: updatedClock,
      pendingInteractions: sanitizedState.pendingInteractions || []
    };
  }

  /**
   * Records a heartbeat from an authenticated participant to maintain active connection lease.
   */
  async recordHeartbeat(matchId, authTokenOrSide, options = {}) {
    let playerSide = null;
    const session = this.store.loadSession(matchId);
    if (!session) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
    }

    if (options.connectionPrincipal && options.connectionPrincipal.matchId === matchId) {
      playerSide = options.connectionPrincipal.authenticatedSide;
    } else if (authTokenOrSide === 'player' || authTokenOrSide === 'opponent') {
      playerSide = authTokenOrSide;
    } else if (authTokenOrSide) {
      const tokenH = hashToken(authTokenOrSide);
      if (session.player1.tokenHash === tokenH) playerSide = 'player';
      else if (session.player2.tokenHash === tokenH) playerSide = 'opponent';
      else {
        const err = new Error('INVALID_AUTH_TOKEN: Token does not match any registered participant in this match');
        err.code = 'INVALID_AUTH_TOKEN';
        throw err;
      }
    } else {
      const err = new Error('AUTHENTICATION_REQUIRED: Missing authentication token for heartbeat');
      err.code = 'AUTHENTICATION_REQUIRED';
      throw err;
    }

    const now = this.now();
    const updates = {};
    if (playerSide === 'player') {
      updates.player1Connected = true;
      updates.player1LastHeartbeat = now;
    } else {
      updates.player2Connected = true;
      updates.player2LastHeartbeat = now;
    }

    this.store.updateSessionState(matchId, session.state, session.version, updates);

    let hbMap = this.heartbeats.get(matchId);
    if (!hbMap) {
      hbMap = {};
      this.heartbeats.set(matchId, hbMap);
    }
    hbMap[playerSide] = now;

    return {
      success: true,
      matchId,
      side: playerSide,
      heartbeatMs: now,
      leaseRemainingMs: 15000
    };
  }

  /**
   * Checks connection leases across active sessions.
   * If a connected player has not sent a heartbeat for > leaseTimeoutMs,
   * transitions to DISCONNECTED and pauses or suspends as appropriate.
   */
  async checkConnectionLeases(now = this.now(), leaseTimeoutMs = 15000, suspectedTimeoutMs = 8000) {
    const active = this.store.listActiveSessions();
    const results = [];

    for (const item of active) {
      const session = this.store.loadSession(item.id);
      if (!session) continue;
      if (session.status !== SESSION_STATUS.ACTIVE && session.status !== SESSION_STATUS.WAITING_FOR_PLAYERS) continue;

      let changed = false;
      const updates = {};

      // Check player 1
      if (session.player1.controlType === PLAYER_CONTROL_TYPES.HUMAN && session.player1.connected) {
        const lastHb = session.player1.lastHeartbeat || session.createdAt;
        const elapsed = now - lastHb;
        if (elapsed > leaseTimeoutMs) {
          updates.player1Connected = false;
          changed = true;
          results.push({ matchId: session.id, side: 'player', action: 'LEASE_EXPIRED', elapsed });
        }
      }

      // Check player 2
      if (session.player2.controlType === PLAYER_CONTROL_TYPES.HUMAN && session.player2.connected) {
        const lastHb = session.player2.lastHeartbeat || session.createdAt;
        const elapsed = now - lastHb;
        if (elapsed > leaseTimeoutMs) {
          updates.player2Connected = false;
          changed = true;
          results.push({ matchId: session.id, side: 'opponent', action: 'LEASE_EXPIRED', elapsed });
        }
      }

      if (changed) {
        const p1Conn = updates.player1Connected !== undefined ? updates.player1Connected : session.player1.connected;
        const p2Conn = updates.player2Connected !== undefined ? updates.player2Connected : session.player2.connected;

        if (!p1Conn && !p2Conn) {
          updates.status = SESSION_STATUS.SUSPENDED;
          const clock = this.store.loadClock(session.id);
          if (clock && !clock.paused) {
            clock.remainingMs = Math.max(0, clock.deadlineMs - now);
            clock.paused = true;
            clock.pauseReason = 'BOTH_PLAYERS_DISCONNECTED';
            clock.lastTickMs = now;
            this.store.saveClock(session.id, clock);
          }
        } else if (!p1Conn || !p2Conn) {
          updates.status = SESSION_STATUS.PLAYER_DISCONNECTED;
        }

        this.store.updateSessionState(session.id, session.state, session.version, updates);

        const activeGame = this.activeGames.get(session.id);
        const eventSeq = (activeGame ? activeGame.eventSeq : 1) + 1;
        if (activeGame) activeGame.eventSeq = eventSeq;
        this._recordAndBroadcastEvent(session.id, eventSeq, 'CONNECTION_STATE_CHANGED', {
          matchId: session.id,
          player1Connected: p1Conn,
          player2Connected: p2Conn,
          status: updates.status || session.status,
          reason: 'LEASE_EXPIRED'
        });
      }
    }

    return results;
  }

  /**
   * Reconciles stale connections after a server restart.
   */
  async reconcileStaleConnections() {
    const active = this.store.listActiveSessions();
    for (const item of active) {
      const session = this.store.loadSession(item.id);
      if (!session) continue;
      const updates = {};
      let changed = false;

      if (session.player1.controlType === PLAYER_CONTROL_TYPES.HUMAN && session.player1.connected) {
        updates.player1Connected = false;
        changed = true;
      }
      if (session.player2.controlType === PLAYER_CONTROL_TYPES.HUMAN && session.player2.connected) {
        updates.player2Connected = false;
        changed = true;
      }

      if (changed) {
        updates.status = SESSION_STATUS.PLAYER_DISCONNECTED;
        this.store.updateSessionState(session.id, session.state, session.version, updates);
      }
    }
  }

  /**
   * Retrieves match events with authentication validation and viewer redaction.
   */
  async getEvents(matchId, sinceSeq = 0, authTokenOrSide = null) {
    if (!authTokenOrSide) {
      const err = new Error('AUTHENTICATION_REQUIRED: Authentication token required to access match events');
      err.code = 'AUTHENTICATION_REQUIRED';
      throw err;
    }

    const session = this.store.loadSession(matchId);
    if (!session) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
    }

    let viewerSide = null;
    if (authTokenOrSide === 'player' || authTokenOrSide === 'opponent') {
      viewerSide = authTokenOrSide;
    } else {
      const tokenH = hashToken(authTokenOrSide);
      if (session.player1.tokenHash === tokenH) viewerSide = 'player';
      else if (session.player2.tokenHash === tokenH) viewerSide = 'opponent';

      if (!viewerSide) {
        const err = new Error('INVALID_AUTH_TOKEN: Provided token does not match any authorized participant for this match');
        err.code = 'INVALID_AUTH_TOKEN';
        throw err;
      }
    }

    const rawEvents = this.store.getEvents(matchId, sinceSeq);
    return this.redactEventsForViewer(rawEvents, viewerSide);
  }

  /**
   * Redacts private card details and hidden state from event payloads.
   */
  redactEventsForViewer(events, viewerSide) {
    if (!Array.isArray(events)) return [];

    return events.map(evt => {
      if (!evt.payload || typeof evt.payload !== 'object') {
        return evt;
      }

      const p = scrubCredentials(JSON.parse(JSON.stringify(evt.payload)));

      // Mask opponent private card info if present in action result
      if (p.result && typeof p.result === 'object') {
        const res = { ...p.result };
        if (p.player && p.player !== viewerSide && res.drawnCards) {
          res.drawnCards = res.drawnCards.map(c => ({
            id: c.id,
            masked: true,
            name: 'Hidden Card',
            cardNumber: 'HIDDEN'
          }));
        }
        p.result = res;
      }

      return {
        ...evt,
        payload: p
      };
    });
  }

  /**
   * Suspends a match (e.g. when both players disconnect or on manual suspension).
   */
  async suspendMatch(matchId, reason = 'PLAYER_DISCONNECTED') {
    const session = this.store.loadSession(matchId);
    if (!session) throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);

    if (session.status === SESSION_STATUS.COMPLETED || session.status === SESSION_STATUS.FORFEITED) {
      return session;
    }

    const now = this.now();
    const clock = this.store.loadClock(matchId);

    if (clock && !clock.paused) {
      clock.remainingMs = Math.max(0, clock.deadlineMs - now);
      clock.paused = true;
      clock.pauseReason = reason;
      clock.lastTickMs = now;
      this.store.saveClock(matchId, clock);
    }

    const updated = this.store.updateSessionState(matchId, session.state, session.version, {
      status: SESSION_STATUS.SUSPENDED
    });

    return updated;
  }

  /**
   * Submits a player action into the authoritative engine.
   */
  async submitPlayerAction(matchId, action, authContext = {}) {
    if (!action || typeof action !== 'object') {
      throw new Error('INVALID_ACTION: Action must be an object');
    }

    // 1. Check timeout before processing action
    const isTimedOut = this._checkTimeout(matchId);
    if (isTimedOut) {
      throw new Error('MATCH_TIMED_OUT: The turn clock has expired');
    }

    const session = this.store.loadSession(matchId);
    if (!session) throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);

    if (session.status === SESSION_STATUS.COMPLETED || session.status === SESSION_STATUS.FORFEITED) {
      throw new Error(`MATCH_ALREADY_FINISHED: Match "${matchId}" is already ${session.status}`);
    }

    // 2. Validate Authentication
    const authToken = authContext.authToken || null;
    let authenticatedSide = null;
    let authenticatedPlayer = null;

    if (authContext.connectionPrincipal && authContext.connectionPrincipal.matchId === matchId) {
      authenticatedSide = authContext.connectionPrincipal.authenticatedSide;
      if (authenticatedSide === 'player') authenticatedPlayer = session.player1;
      else if (authenticatedSide === 'opponent') authenticatedPlayer = session.player2;
      else if (authenticatedSide === 'spectator') {
        const err = new Error('UNAUTHORIZED_SPECTATOR: Spectators cannot submit actions');
        err.code = 'UNAUTHORIZED_SPECTATOR';
        err.status = 403;
        throw err;
      }
    } else {
      if (!authToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Missing mandatory authentication token');
      }

      const tokenH = hashToken(authToken);
      if (session.player1.tokenHash === tokenH) {
        authenticatedSide = 'player';
        authenticatedPlayer = session.player1;
      } else if (session.player2.tokenHash === tokenH) {
        authenticatedSide = 'opponent';
        authenticatedPlayer = session.player2;
      }

      if (!authenticatedSide) {
        throw new Error('INVALID_AUTH_TOKEN: Provided token does not match authorized player');
      }
    }

    // Anti-Impersonation Check: Ignore/reject spoofed fields supplied by client
    const claimedResponder = action.responder || action.player || action.decisionOwner || action.authenticatedSide || action.owner;
    if (claimedResponder && claimedResponder !== authenticatedSide && claimedResponder !== authenticatedPlayer.id) {
      const err = new Error(`IMPERSONATION_ATTEMPT_DETECTED: Claimed player "${claimedResponder}" does not match authenticated participant "${authenticatedSide}"`);
      err.code = 'IMPERSONATION_ATTEMPT_DETECTED';
      throw err;
    }

    // 3. Idempotency Check: Verify if actionId is already committed
    const actionId = action.actionId || generateSecureToken('act');
    const existingAction = this.store.getAction(actionId);
    if (existingAction) {
      // Complete canonical payload normalization comparison
      const existingPlayer = existingAction.playerSide || (existingAction.playerId === authenticatedPlayer.id ? authenticatedSide : (existingAction.playerId || 'other_player'));
      const committedNormalized = normalizeActionPayload(existingAction.payload || existingAction, existingPlayer);
      const incomingNormalized = normalizeActionPayload(action, authenticatedSide);

      if (committedNormalized !== incomingNormalized) {
        const err = new Error(`ACTION_ID_PAYLOAD_CONFLICT: Action ID "${actionId}" was already processed with a conflicting payload`);
        err.code = 'PAYLOAD_CONFLICT';
        err.status = 409;
        throw err;
      }

      const restoredGame = await this.restoreMatch(matchId);
      return {
        success: false,
        duplicate: true,
        actionId,
        version: session.version,
        state: redactGameStateForViewer(restoredGame.state, authenticatedSide),
        clock: this.getClockState(matchId)
      };
    }

    // 4. Ensure Game is Loaded in Memory
    const active = await this.ensureActiveGame(matchId);
    const game = active.game;

    if (action.type === 'FORFEIT') {
      return await this.forfeitMatch(matchId, authenticatedSide, action.reason || 'PLAYER_SURRENDER');
    }

    // 5. Action Authorization Policies (Phase M.3.2 Centralized Action Authority)
    const auth = authorizeAction(game, authenticatedSide, action.type, action);
    if (!auth.allowed) {
      const err = new Error(`${auth.code || auth.reason}: ${auth.details || auth.reason}`);
      err.code = auth.code || auth.reason;
      err.status = auth.status || 403;
      err.details = auth.details;
      throw err;
    }
    const isWinActive = game.windows && typeof game.windows.isResponseWindowActive === 'function' && game.windows.isResponseWindowActive();
    const curWin = isWinActive ? game.windows.getCurrentWindow() : null;

    // B. Decision-controlled actions (INTERACTION_RESPONSE)
    if (action.type === 'INTERACTION_RESPONSE') {
      const interactionId = action.interactionId;
      const interaction = (game.state.pendingInteractions || []).find(i => i.id === interactionId || i.interactionId === interactionId);
      if (!interaction) {
        const err = new Error(`INTERACTION_NOT_FOUND: Interaction "${interactionId}" does not exist or has already resolved`);
        err.code = 'INTERACTION_NOT_FOUND';
        throw err;
      }
      const isPending = interaction.status === INTERACTION_STATUS.WAITING_FOR_PLAYER || interaction.status === 'pending';
      if (!isPending) {
        const err = new Error(`INTERACTION_NOT_PENDING: Interaction "${interactionId}" is no longer pending (status: ${interaction.status})`);
        err.code = 'INTERACTION_NOT_PENDING';
        throw err;
      }
      if (interaction.decisionOwner !== authenticatedSide) {
        const err = new Error(`UNAUTHORIZED_DECISION_OWNER: Interaction is owned by "${interaction.decisionOwner}", but caller is "${authenticatedSide}"`);
        err.code = 'UNAUTHORIZED_DECISION_OWNER';
        err.status = 403;
        throw err;
      }

      if (curWin && (curWin.originatingInteractionId === interactionId || interaction.context?.windowId === curWin.windowId)) {
        if (curWin.priorityPlayer !== authenticatedSide) {
          const err = new Error(`NOT_PRIORITY_PLAYER: Response window "${curWin.windowType}" priority is owned by "${curWin.priorityPlayer}", but caller is "${authenticatedSide}"`);
          err.code = 'NOT_PRIORITY_PLAYER';
          err.status = 403;
          throw err;
        }
      }

      // Candidate pool and count validation
      if (action.response && action.response.selected !== undefined) {
        const selections = Array.isArray(action.response.selected) ? action.response.selected : [action.response.selected];
        if (interaction.candidates && interaction.candidates.length > 0) {
          const validIds = new Set();
          for (const c of interaction.candidates) {
            if (c?.candidateId) validIds.add(c.candidateId);
            if (c?.id) validIds.add(c.id);
            if (c?.stackId) validIds.add(c.stackId);
            if (c?.cardId) validIds.add(c.cardId);
            if (c?.stack?.id) validIds.add(c.stack.id);
            if (c?.card?.id) validIds.add(c.card.id);
          }
          for (const sel of selections) {
            const selId = typeof sel === 'string' ? sel : (sel?.candidateId || sel?.id || sel?.stackId || sel?.cardId);
            if (!validIds.has(selId)) {
              const err = new Error(`INVALID_CANDIDATE: Selection "${selId}" is not in the candidate pool`);
              err.code = 'INVALID_CANDIDATE';
              throw err;
            }
          }
          const minCount = interaction.min !== undefined ? interaction.min : (interaction.optional ? 0 : 1);
          const maxCount = interaction.max !== undefined ? interaction.max : interaction.candidates.length;
          if (selections.length < minCount || selections.length > maxCount) {
            const err = new Error(`SELECTION_COUNT_INVALID: Selected count ${selections.length} is outside allowed range [${minCount}, ${maxCount}]`);
            err.code = 'SELECTION_COUNT_INVALID';
            throw err;
          }
        }
      }
    }

    // 6. Execute Action with in-memory state rollback on failure
    const stateBackup = JSON.parse(JSON.stringify(serializeGameState(game.state)));
    let actionResult = null;

    try {
      if (responseWindowActions.has(action.type)) {
        if (!curWin && action.type === 'ACTIVATE_FLASH_ABILITY') {
          // No active response window -> Execute Main Step Flash ability directly through activateAbility
          const cardId = action.cardId || action.stackId;
          const abilityId = action.abilityId ?? action.abilityIndex ?? 0;
          const res = await game.activateAbility(cardId, abilityId, authenticatedSide, action.options || {});
          if (!res || !res.success) {
            const err = new Error(`ACTIVATE_ABILITY_FAILED: ${res?.reason || 'Failed to activate ability'}`);
            err.code = res?.code || res?.reason || 'ACTIVATE_ABILITY_FAILED';
            err.status = 400;
            throw err;
          }
          actionResult = res;
        } else {
          const payload = action.payload || action.response || action;
          const normalizedAction = (action.type === 'BLOCK' || payload.action === 'BLOCK') ? 'DECLARE_BLOCK' : (payload.action || action.type);
          const res = await game.windows.submitResponse({ ...payload, action: normalizedAction }, { responder: authenticatedSide, matchId });
          if (!res.success) {
            const err = new Error(`RESPONSE_WINDOW_REJECTED: ${res.reason || 'Invalid response in active window'}`);
            err.code = res.reason || 'RESPONSE_WINDOW_REJECTED';
            throw err;
          }
          actionResult = res;
        }
      } else if (action.type === 'INTERACTION_RESPONSE') {
        let res = null;
        if (curWin && (curWin.originatingInteractionId === action.interactionId || (game.state.pendingInteractions || []).find(i => i.id === action.interactionId)?.context?.windowId === curWin.windowId)) {
          const respPayload = action.response || {};
          const winAction = respPayload.action || (curWin.windowType === 'BLOCK_DECLARATION' ? (respPayload.stackId ? 'DECLARE_BLOCK' : 'PASS_BLOCK') : 'PASS');
          res = await game.windows.submitResponse({ ...respPayload, action: winAction }, { responder: authenticatedSide, matchId });
          if (!res.success) {
            const err = new Error(`RESPONSE_WINDOW_REJECTED: ${res.reason || 'Invalid response in active window'}`);
            err.code = res.reason || 'RESPONSE_WINDOW_REJECTED';
            throw err;
          }
        } else {
          res = game.interactionController.respond(action.interactionId, action.response, {
            responder: authenticatedSide,
            matchId
          });
          if (!res.success) {
            const err = new Error(`INTERACTION_REJECTED: ${res.reason || 'Invalid interaction response'}`);
            err.code = 'INTERACTION_REJECTED';
            throw err;
          }
          if ((game.state.pendingExecutions || []).some(e => e.interactionId === action.interactionId)) {
            const resumeRes = await game.resumeExecution(action.interactionId, res.response);
            res = { ...res, ...resumeRes };
            if (!resumeRes.suspended && curWin && curWin.pendingFlashResponse && typeof game.windows?.finalizeSuspendedFlashAction === 'function') {
              await game.windows.finalizeSuspendedFlashAction();
            }
          }
        }
        actionResult = res;
      } else if (action.type === 'ATTACK' || action.type === 'DECLARE_ATTACK') {
        const stackId = action.stackId || action.attackerStackId;
        const res = await game.declareAttack(stackId, authenticatedSide);
        if (!res.success) {
          const err = new Error(`ATTACK_FAILED: ${res.reason || 'Failed to declare attack'}`);
          err.code = res.reason || 'ATTACK_FAILED';
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'ACTIVATE_ABILITY' || action.type === 'ACTIVATE_FIELD_ABILITY' || action.type === 'ACTIVATE_FLASH_ABILITY') {
        const cardId = action.cardId || action.stackId;
        const abilityId = action.abilityId ?? action.abilityIndex ?? 0;
        const res = await game.activateAbility(cardId, abilityId, authenticatedSide, action.options || {});
        if (!res || !res.success) {
          const err = new Error(`ACTIVATE_ABILITY_FAILED: ${res?.reason || 'Failed to activate ability'}`);
          err.code = res?.code || res?.reason || 'ACTIVATE_ABILITY_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'SET_BURST') {
        const cardId = action.cardId || (action.card && typeof action.card === 'object' ? action.card.id : action.card);
        const res = await game.setBurst(cardId, authenticatedSide);
        if (!res || !res.success) {
          const err = new Error(`SET_BURST_FAILED: ${res?.reason || 'Failed to set burst'}`);
          err.code = res?.code || res?.reason || 'SET_BURST_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'SET_MIRAGE') {
        const cardId = action.cardId || (action.card && typeof action.card === 'object' ? action.card.id : action.card);
        const res = await game.setMirage(cardId, authenticatedSide, action.options || {});
        if (!res || !res.success) {
          const err = new Error(`SET_MIRAGE_FAILED: ${res?.reason || 'Failed to set mirage'}`);
          err.code = res?.code || res?.reason || 'SET_MIRAGE_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'TRANSFER_CORE' || action.type === 'CORE_TRANSFER' || action.type === 'MOVE_CORE') {
        const count = action.count ?? action.cores ?? 1;
        const from = action.from;
        const to = action.to;
        const res = await game.transferCore(count, from, to, authenticatedSide);
        if (!res || !res.success) {
          const err = new Error(`TRANSFER_CORE_FAILED: ${res?.reason || 'Failed to transfer core'}`);
          err.code = res?.code || res?.reason || 'TRANSFER_CORE_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'SEPARATE_BRAVE') {
        const stackId = action.stackId || action.hostStackId;
        const braveCardId = action.braveCardId || action.cardId;
        const coresFromReserve = action.coresFromReserve ?? 1;
        const res = await game.separateBrave(stackId, braveCardId, coresFromReserve, authenticatedSide);
        if (!res || !res.success) {
          const err = new Error(`SEPARATE_BRAVE_FAILED: ${res?.reason || 'Failed to separate brave'}`);
          err.code = res?.code || res?.reason || 'SEPARATE_BRAVE_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'PERFORM_ADVENT') {
        const cardId = action.cardId;
        const targetStackId = action.targetStackId;
        const res = await game.performAdvent(authenticatedSide, cardId, targetStackId, action.options || {});
        if (!res || !res.success) {
          const err = new Error(`ADVENT_FAILED: ${res?.reason || 'Failed to perform advent'}`);
          err.code = res?.code || res?.reason || 'ADVENT_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'EXECUTE_ACCEL' || action.type === 'USE_ACCEL') {
        const cardId = action.cardId;
        const res = await game.executeAccel(authenticatedSide, cardId, action.options || {});
        if (!res || !res.success) {
          const err = new Error(`ACCEL_FAILED: ${res?.reason || 'Failed to execute accel'}`);
          err.code = res?.code || res?.reason || 'ACCEL_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'EXECUTE_CHANGE') {
        const cardId = action.cardId;
        const swapStackId = action.swapStackId || action.targetStackId;
        const res = await game.executeChange(authenticatedSide, cardId, swapStackId, action.options || {});
        if (!res || !res.success) {
          const err = new Error(`CHANGE_FAILED: ${res?.reason || 'Failed to execute change'}`);
          err.code = res?.code || res?.reason || 'CHANGE_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = res;
      } else if (action.type === 'END_TURN') {
        if (typeof game.flow?.advanceStep === 'function') {
          await game.flow.advanceStep('START');
        } else {
          game.state.step = 'START';
        }
        actionResult = { success: true, step: game.state.step, activePlayer: game.state.activePlayer };
      } else if (action.type === 'PLAY_CARD') {
        const cardId = action.cardId || (action.card && typeof action.card === 'object' ? action.card.id : action.card);
        const costReduction = action.costReduction || action.payment || [];
        const res = await game.playCard(cardId, costReduction, authenticatedSide, action.options || {});
        if (!res || !res.success) {
          const err = new Error(`PLAY_CARD_FAILED: ${res?.reason || 'Failed to play card'}`);
          err.code = res?.code || res?.reason || 'PLAY_CARD_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = { success: true, played: cardId, result: res };
      } else if (action.type === 'SUMMON') {
        const p = game.state.players[authenticatedSide];
        if (!p) {
          const err = new Error('SUMMON_FAILED: Invalid player');
          err.code = 'INVALID_PLAYER';
          err.status = 400;
          throw err;
        }
        const cardParam = action.cardId || action.card;
        const cardId = typeof cardParam === 'string' ? cardParam : (cardParam?.id || cardParam?.cardNumber);
        const cardName = typeof cardParam === 'object' ? cardParam?.name : null;
        if (!cardId && !cardName) {
          const err = new Error('SUMMON_FAILED: Missing cardId');
          err.code = 'INVALID_CARD_SOURCE';
          err.status = 400;
          throw err;
        }

        const findInList = (list) => (list || []).find(c => 
          (cardId && (c.id === cardId || c.cardNumber === cardId)) ||
          (cardName && c.name && c.name.toLowerCase() === cardName.toLowerCase())
        );

        const cardInHand = findInList(p.hand);
        const cardInRemoved = findInList(p.removed);
        const targetCard = cardInHand || cardInRemoved;
        if (!targetCard) {
          const err = new Error('SUMMON_FAILED: Card not in hand or eligible zone');
          err.code = 'CARD_NOT_IN_HAND';
          err.status = 400;
          throw err;
        }
        const pathwayCheck = validateCardPathway(targetCard, ACTION_PATHWAYS.SUMMON);
        if (!pathwayCheck.allowed) {
          const err = new Error(`SUMMON_FAILED: ${pathwayCheck.details}`);
          err.code = pathwayCheck.code || 'INVALID_CARD_TYPE';
          err.status = 400;
          throw err;
        }
        const costReduction = action.costReduction || action.payment || [];
        const res = await game.summonUnit(targetCard.id, costReduction, authenticatedSide, {
          cores: action.cores,
          fromZone: cardInHand ? 'hand' : 'removed',
          ...(action.options || {})
        });
        if (!res || !res.success) {
          const err = new Error(`SUMMON_FAILED: ${res?.reason || 'Failed to summon'}`);
          err.code = res?.code || res?.reason || 'SUMMON_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = { success: true, stackId: res.stackId || (res.stack && res.stack.id), card: res.card, result: res };
      } else if (action.type === 'DEPLOY_NEXUS') {
        const cardId = action.cardId || (action.card && typeof action.card === 'object' ? action.card.id : action.card);
        const costReduction = action.costReduction || action.payment || [];
        const res = await game.deployNexus(cardId, costReduction, authenticatedSide, action.options || {});
        if (!res || !res.success) {
          const err = new Error(`DEPLOY_NEXUS_FAILED: ${res?.reason || 'Failed to deploy Nexus'}`);
          err.code = res?.code || res?.reason || 'DEPLOY_NEXUS_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = { success: true, deployed: cardId, result: res };
      } else if (action.type === 'ACTIVATE_MAGIC' || action.type === 'CAST_MAGIC') {
        const cardId = action.cardId || (action.card && typeof action.card === 'object' ? action.card.id : action.card);
        const costReduction = action.costReduction || action.payment || [];
        const magicOpts = { ...(action.options || {}), ...(action.timing ? { timing: action.timing } : {}) };
        const res = await game.activateMagic(cardId, costReduction, authenticatedSide, magicOpts);
        if (!res || !res.success) {
          const err = new Error(`ACTIVATE_MAGIC_FAILED: ${res?.reason || 'Failed to activate Magic'}`);
          err.code = res?.code || res?.reason || 'ACTIVATE_MAGIC_FAILED';
          err.status = 400;
          throw err;
        }
        actionResult = { success: true, activated: cardId, suspended: Boolean(res.suspended), status: res.status || 'COMPLETED', interactionId: res.interactionId || null, result: res };
      } else if (action.type === 'STEP_ADVANCE' || action.type === 'ADVANCE_STEP') {
        const targetStep = action.step;
        const prevActive = game.state.activePlayer;

        if (typeof game.flow?.advanceStep === 'function') {
          await game.flow.advanceStep(targetStep);
        } else {
          game.state.step = targetStep || 'MAIN';
        }

        if (game.state.activePlayer !== prevActive) {
          this._startTurnClock(matchId, game.state.activePlayer, game.state.turnNumber);
        }
        actionResult = { success: true, step: game.state.step, activePlayer: game.state.activePlayer };
      } else {
        const err = new Error(`INVALID_ACTION_TYPE: Unrecognized action type "${action.type}"`);
        err.code = 'INVALID_ACTION_TYPE';
        err.status = 400;
        throw err;
      }
    } catch (execErr) {
      game.state = deserializeGameState(stateBackup);
      if (game.interactionController) {
        game.interactionController.state = game.state;
      }
      if (game.windows) {
        game.windows.windowStack = (game.state.responseWindowStack || (game.state.responseWindow ? [game.state.responseWindow] : [])).slice();
      }
      throw execErr;
    }

    // 7. Atomic Durable Persistence
    const nextEventSeq = (active.eventSeq || 1) + 1;
    const eventRecord = {
      seq: nextEventSeq,
      type: `ACTION_${action.type}`,
      payload: scrubCredentials({
        actionId,
        player: authenticatedSide,
        result: actionResult
      })
    };
    const actionRecord = {
      actionId,
      playerId: authenticatedPlayer.id,
      actionType: action.type,
      payload: scrubCredentials(JSON.parse(JSON.stringify(action)))
    };
    const nextSerialized = serializeGameState(game.state);

    let updatedSession;
    try {
      updatedSession = this.store.commitActionTransaction({
        matchId,
        expectedVersion: session.version,
        actionRecord,
        sessionUpdates: {
          activePlayer: game.state.activePlayer,
          turnNumber: game.state.turnNumber,
          phase: game.state.step,
          lastActionId: actionId
        },
        eventRecord,
        stateJson: nextSerialized
      });
    } catch (commitErr) {
      if (commitErr.code === 'DUPLICATE_ACTION_ID') {
        const restoredGame = await this.restoreMatch(matchId);
        return {
          success: false,
          duplicate: true,
          actionId,
          version: session.version,
          state: redactGameStateForViewer(restoredGame.state, authenticatedSide),
          clock: this.getClockState(matchId)
        };
      }
      throw commitErr;
    }

    active.session = updatedSession;
    active.eventSeq = nextEventSeq;

    // 8. Broadcast ONLY after durable commit succeeds!
    this.broadcastEvent(matchId, {
      seq: nextEventSeq,
      type: eventRecord.type,
      payload: eventRecord.payload,
      createdAt: this.now()
    });

    // 9. Check Win/Loss conditions
    if (game.state.winner) {
      return await this.endMatch(matchId, game.state.winner, game.state.winReason || 'LIFE_REDUCED_TO_ZERO');
    }

    const clockState = this.getClockState(matchId);

    return {
      success: true,
      actionId,
      version: updatedSession.version,
      state: redactGameStateForViewer(game.state, authenticatedSide),
      clock: clockState,
      result: actionResult
    };
  }

  /**
   * Forfeits match on behalf of authenticated player.
   */
  async forfeitMatch(matchId, authTokenOrSide, reason = 'FORFEIT') {
    const session = this.store.loadSession(matchId);
    if (!session) throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);

    let forfeitingSide = null;
    if (authTokenOrSide === 'player' || authTokenOrSide === 'opponent') {
      forfeitingSide = authTokenOrSide;
    } else if (authTokenOrSide) {
      const tokenH = hashToken(authTokenOrSide);
      if (session.player1.tokenHash === tokenH) forfeitingSide = 'player';
      if (session.player2.tokenHash === tokenH) forfeitingSide = 'opponent';
    }

    if (!forfeitingSide) {
      throw new Error('INVALID_AUTH_TOKEN: Token does not match any registered participant');
    }

    const winnerSide = forfeitingSide === 'player' ? 'opponent' : 'player';
    const winnerId = winnerSide === 'player' ? session.player1.id : session.player2.id;

    // Stop clock
    const clock = this.store.loadClock(matchId);
    if (clock) {
      clock.paused = true;
      clock.pauseReason = 'FORFEIT';
      this.store.saveClock(matchId, clock);
    }

    const updated = this.store.updateSessionState(matchId, session.state, session.version, {
      status: SESSION_STATUS.FORFEITED,
      winnerId,
      finishReason: reason
    });

    return {
      matchId,
      status: SESSION_STATUS.FORFEITED,
      winner: winnerSide,
      winnerId,
      reason
    };
  }

  /**
   * Marks a match completed.
   */
  async endMatch(matchId, winnerId, reason = 'GAME_COMPLETED') {
    const session = this.store.loadSession(matchId);
    if (!session) throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);

    const clock = this.store.loadClock(matchId);
    if (clock) {
      clock.paused = true;
      clock.pauseReason = reason;
      this.store.saveClock(matchId, clock);
    }

    const updated = this.store.updateSessionState(matchId, session.state, session.version, {
      status: SESSION_STATUS.COMPLETED,
      winnerId,
      finishReason: reason
    });

    return {
      matchId,
      status: SESSION_STATUS.COMPLETED,
      winnerId,
      finishReason: reason
    };
  }

  /**
   * Handles player leaving arena view without forfeiting.
   */
  async leaveArena(matchId, authToken) {
    const session = this.store.loadSession(matchId);
    if (!session) throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);

    const tokenH = hashToken(authToken);
    let leavingSide = null;
    if (session.player1.tokenHash === tokenH) leavingSide = 'player';
    if (session.player2.tokenHash === tokenH) leavingSide = 'opponent';

    if (!leavingSide) throw new Error('INVALID_AUTH_TOKEN: Unauthorized to leave match');

    const updates = {};
    if (leavingSide === 'player') updates.player1Connected = false;
    if (leavingSide === 'opponent') updates.player2Connected = false;

    // Check if both disconnected
    const otherConnected = leavingSide === 'player' ? session.player2.connected : session.player1.connected;
    if (!otherConnected) {
      // Both disconnected: pause clock!
      return await this.suspendMatch(matchId, 'ALL_PLAYERS_DISCONNECTED');
    } else {
      // One disconnected: clock continues running for active player!
      updates.status = SESSION_STATUS.PLAYER_DISCONNECTED;
      return this.store.updateSessionState(matchId, session.state, session.version, updates);
    }
  }

  /**
   * Restores a match cleanly from persistent storage.
   */
  async restoreMatch(matchId) {
    const session = this.store.loadSession(matchId);
    if (!session) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist in store`);
    }

    // Check if already in active memory
    const existing = this.activeGames.get(matchId);
    if (existing && existing.game?.state) {
      return existing.game;
    }

    // Reconstruct state
    const restoredState = deserializeGameState(session.state);
    if (session.turnNumber) restoredState.turnNumber = session.turnNumber;
    if (session.activePlayer) restoredState.activePlayer = session.activePlayer;
    if (session.phase) restoredState.step = session.phase;

    // Rebind game instance
    const game = createGame({
      state: restoredState,
      interactive: true,
      usePromptManager: true,
      suspendOnInteraction: true,
      requireAuth: true,
      mode: session.mode,
      matchId
    });

    const clock = this.store.loadClock(matchId);
    const maxSeq = this.store.getMaxEventSeq(matchId);

    this.activeGames.set(matchId, {
      game,
      session,
      clock,
      eventSeq: Math.max(1, maxSeq)
    });

    return game;
  }

  async ensureActiveGame(matchId) {
    let active = this.activeGames.get(matchId);
    if (!active || !active.game) {
      const game = await this.restoreMatch(matchId);
      active = this.activeGames.get(matchId);
    }
    return active;
  }

  /**
   * Starts or resets the 4-minute turn clock for the active player.
   */
  _startTurnClock(matchId, activePlayer, turnNumber) {
    const now = this.now();
    const clockData = {
      matchId,
      activePlayer,
      turnNumber,
      turnDurationMs: TURN_CLOCK_MS,
      turnStartMs: now,
      deadlineMs: now + TURN_CLOCK_MS,
      remainingMs: TURN_CLOCK_MS,
      paused: false,
      pauseReason: null,
      accumulatedPauseMs: 0,
      lastTickMs: now,
      warningThresholdMs: WARNING_THRESHOLD_MS,
      timeoutProcessed: false
    };

    this.store.saveClock(matchId, clockData);

    const active = this.activeGames.get(matchId);
    if (active) active.clock = clockData;

    return clockData;
  }

  /**
   * Checks whether the active player's clock has expired.
   * Atomically and idempotently processes timeout.
   */
  _checkTimeout(matchId) {
    const clock = this.store.loadClock(matchId);
    if (!clock || clock.paused || clock.timeoutProcessed) {
      return false;
    }

    const session = this.store.loadSession(matchId);
    if (!session || session.status === SESSION_STATUS.COMPLETED || session.status === SESSION_STATUS.FORFEITED) {
      return false;
    }

    const now = this.now();
    if (now >= clock.deadlineMs) {
      // Timeout reached! Active player loses by timeout!
      clock.timeoutProcessed = true;
      clock.remainingMs = 0;
      clock.paused = true;
      clock.pauseReason = 'TIMEOUT';
      this.store.saveClock(matchId, clock);

      const timedOutPlayer = clock.activePlayer;
      const winnerSide = timedOutPlayer === 'player' ? 'opponent' : 'player';
      const winnerId = winnerSide === 'player' ? session.player1.id : session.player2.id;

      this.store.updateSessionState(matchId, session.state, session.version, {
        status: SESSION_STATUS.COMPLETED,
        winnerId,
        finishReason: 'TIMEOUT'
      });

      return true;
    }

    return false;
  }

  /**
   * Gets synchronized clock state for clients with remaining time and 1-minute warning flag.
   */
  getClockState(matchId) {
    this._checkTimeout(matchId);
    const clock = this.store.loadClock(matchId);
    if (!clock) return null;

    const now = this.now();
    let remainingMs = clock.remainingMs;

    if (!clock.paused) {
      remainingMs = Math.max(0, clock.deadlineMs - now);
    }

    const warningActive = remainingMs <= clock.warningThresholdMs && remainingMs > 0;
    const isExpired = remainingMs === 0;

    return {
      matchId: clock.matchId,
      activePlayer: clock.activePlayer,
      turnNumber: clock.turnNumber,
      turnDurationMs: clock.turnDurationMs,
      deadlineMs: clock.deadlineMs,
      remainingMs,
      paused: clock.paused,
      pauseReason: clock.pauseReason,
      warningActive,
      warningThresholdMs: clock.warningThresholdMs,
      isExpired,
      serverTime: now
    };
  }

  /**
   * Returns sanitized player view of match state.
   */
  async getPlayerMatchState(matchId, authTokenOrSide) {
    const session = this.store.loadSession(matchId);
    if (!session) throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);

    this._checkTimeout(matchId);

    let viewerSide = null;
    if (authTokenOrSide === 'player' || authTokenOrSide === 'opponent') {
      viewerSide = authTokenOrSide;
    } else if (authTokenOrSide) {
      const tokenH = hashToken(authTokenOrSide);
      if (session.player1.tokenHash === tokenH) viewerSide = 'player';
      else if (session.player2.tokenHash === tokenH) viewerSide = 'opponent';
      else {
        const err = new Error('INVALID_AUTH_TOKEN: Provided token does not match any participant in this match');
        err.code = 'INVALID_AUTH_TOKEN';
        throw err;
      }
    }

    const game = await this.restoreMatch(matchId);
    const clock = this.getClockState(matchId);
    const sanitizedState = redactGameStateForViewer(game.state, viewerSide);

    return scrubCredentials({
      matchId,
      status: session.status,
      version: session.version,
      activePlayer: session.activePlayer,
      turnNumber: session.turnNumber,
      state: sanitizedState,
      clock,
      pendingInteractions: sanitizedState.pendingInteractions || []
    });
  }

  getActiveMatches(authToken = null, requestedPlayerId = null) {
    if (!authToken) {
      return this.store.listActiveSessions();
    }
    const tokenH = hashToken(authToken);
    let matches = this.store.listActiveSessionsByTokenHash(tokenH);
    if (!matches || matches.length === 0) {
      matches = this.store.listActiveSessions(authToken);
    }
    if (requestedPlayerId) {
      return matches.filter(m => m.player1_id === requestedPlayerId || m.player2_id === requestedPlayerId);
    }
    return matches;
  }

  getMatchHistory(limit = 50, authToken = null, requestedPlayerId = null) {
    if (!authToken) {
      return this.store.listSessionHistory(limit);
    }
    const tokenH = hashToken(authToken);
    let history = this.store.listSessionHistoryByTokenHash ? this.store.listSessionHistoryByTokenHash(limit, tokenH) : [];
    if (!history || history.length === 0) {
      history = this.store.listSessionHistory(limit, authToken);
    }
    if (requestedPlayerId) {
      return history.filter(m => m.player1_id === requestedPlayerId || m.player2_id === requestedPlayerId);
    }
    return history;
  }
}

let defaultManager = null;

export function getDefaultSessionManager() {
  if (!defaultManager) {
    defaultManager = new BattleSessionManager();
  }
  return defaultManager;
}
