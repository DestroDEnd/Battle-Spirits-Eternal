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
import { createGame } from './index.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES, generateSecureToken, MatchContext } from './session_mode.js';
import { INTERACTION_STATUS } from './interaction.js';

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

export class BattleSessionManager {
  constructor(options = {}) {
    this.store = options.store || getDefaultSessionStore();
    this.activeGames = new Map(); // matchId -> { game, session, clock, eventSeq }
    this.heartbeats = new Map(); // matchId -> { player: timestamp, opponent: timestamp }
    this.listeners = new Map(); // matchId -> Set of { viewerSide, callback }
    this.timeProvider = options.timeProvider || (() => Date.now());
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
      playerDeck: options.playerDeck || [],
      opponentDeck: options.opponentDeck || [],
      firstPlayer,
      strictRules: Boolean(options.strictRules),
      mode,
      matchId,
      interactive: true,
      usePromptManager: true,
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
  async recordHeartbeat(matchId, authToken) {
    if (!authToken) {
      const err = new Error('AUTHENTICATION_REQUIRED: Missing authentication token for heartbeat');
      err.code = 'AUTHENTICATION_REQUIRED';
      throw err;
    }

    const session = this.store.loadSession(matchId);
    if (!session) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
    }

    const tokenH = hashToken(authToken);
    let playerSide = null;
    if (session.player1.tokenHash === tokenH) playerSide = 'player';
    else if (session.player2.tokenHash === tokenH) playerSide = 'opponent';

    if (!playerSide) {
      const err = new Error('INVALID_AUTH_TOKEN: Token does not match any registered participant in this match');
      err.code = 'INVALID_AUTH_TOKEN';
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
  async getEvents(matchId, sinceSeq = 0, authToken = null) {
    if (!authToken) {
      const err = new Error('AUTHENTICATION_REQUIRED: Authentication token required to access match events');
      err.code = 'AUTHENTICATION_REQUIRED';
      throw err;
    }

    const session = this.store.loadSession(matchId);
    if (!session) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
    }

    const tokenH = hashToken(authToken);
    let viewerSide = null;
    if (session.player1.tokenHash === tokenH) viewerSide = 'player';
    else if (session.player2.tokenHash === tokenH) viewerSide = 'opponent';

    if (!viewerSide) {
      const err = new Error('INVALID_AUTH_TOKEN: Provided token does not match any authorized participant for this match');
      err.code = 'INVALID_AUTH_TOKEN';
      throw err;
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
    const authToken = authContext.authToken;
    if (!authToken) {
      throw new Error('AUTHENTICATION_REQUIRED: Missing mandatory authentication token');
    }

    const tokenH = hashToken(authToken);
    let authenticatedSide = null;
    let authenticatedPlayer = null;

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

    // Anti-Impersonation Check
    const claimedResponder = action.responder || action.player || action.decisionOwner;
    if (claimedResponder && claimedResponder !== authenticatedSide && claimedResponder !== authenticatedPlayer.id) {
      throw new Error(`IMPERSONATION_ATTEMPT_DETECTED: Claimed player "${claimedResponder}" does not match authenticated participant "${authenticatedSide}"`);
    }

    // 3. Idempotency Check
    const actionId = action.actionId || generateSecureToken('act');
    try {
      this.store.recordAction(matchId, actionId, authenticatedPlayer.id, action.type, action, session.version);
    } catch (err) {
      if (err.code === 'DUPLICATE_ACTION_ID') {
        return { success: false, duplicate: true, reason: err.message };
      }
      throw err;
    }

    // 4. Ensure Game is Loaded in Memory
    const active = await this.ensureActiveGame(matchId);
    const game = active.game;

    let actionResult = null;

    // 5. Execute Action by Type
    if (action.type === 'INTERACTION_RESPONSE') {
      const interactionId = action.interactionId;
      const responsePayload = action.response;

      const res = game.interactionController.respond(interactionId, responsePayload, {
        authToken,
        responder: authenticatedSide,
        matchId
      });

      if (!res.success) {
        throw new Error(`INTERACTION_REJECTED: ${res.reason || 'Invalid interaction response'}`);
      }
      actionResult = res;

    } else if (action.type === 'STEP_ADVANCE') {
      // Step advancement
      const targetStep = action.step;
      const prevActive = game.state.activePlayer;

      if (typeof game.flow?.advanceStep === 'function') {
        await game.flow.advanceStep(targetStep);
      } else {
        game.state.step = targetStep || 'MAIN';
      }

      // If active player changed on step/turn advance, reset turn clock to full 240s!
      if (game.state.activePlayer !== prevActive) {
        this._startTurnClock(matchId, game.state.activePlayer, game.state.turnNumber);
      }
      actionResult = { success: true, step: game.state.step, activePlayer: game.state.activePlayer };

    } else if (action.type === 'FORFEIT') {
      return await this.forfeitMatch(matchId, authToken, action.reason || 'PLAYER_SURRENDER');
    } else {
      actionResult = { success: true, action: action.type };
    }

    // 6. Check Win/Loss conditions
    if (game.state.winner) {
      return await this.endMatch(matchId, game.state.winner, game.state.winReason || 'LIFE_REDUCED_TO_ZERO');
    }

    // 7. Persist Updated Engine State Atomically
    const nextSerialized = serializeGameState(game.state);
    const updatedSession = this.store.updateSessionState(matchId, nextSerialized, session.version, {
      activePlayer: game.state.activePlayer,
      turnNumber: game.state.turnNumber,
      phase: game.state.step,
      lastActionId: actionId
    });

    active.session = updatedSession;

    // 8. Record Event
    active.eventSeq = (active.eventSeq || 1) + 1;
    this._recordAndBroadcastEvent(matchId, active.eventSeq, `ACTION_${action.type}`, {
      actionId,
      player: authenticatedSide,
      result: actionResult
    });

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
  async forfeitMatch(matchId, authToken, reason = 'FORFEIT') {
    const session = this.store.loadSession(matchId);
    if (!session) throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);

    const tokenH = hashToken(authToken);
    let forfeitingSide = null;

    if (session.player1.tokenHash === tokenH) forfeitingSide = 'player';
    if (session.player2.tokenHash === tokenH) forfeitingSide = 'opponent';

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

  getActiveMatches(playerId = null) {
    return this.store.listActiveSessions(playerId);
  }

  getMatchHistory(limit = 50, playerId = null) {
    return this.store.listSessionHistory(limit, playerId);
  }
}

let defaultManager = null;

export function getDefaultSessionManager() {
  if (!defaultManager) {
    defaultManager = new BattleSessionManager();
  }
  return defaultManager;
}
