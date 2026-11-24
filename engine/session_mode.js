/**
 * engine/session_mode.js
 * 
 * Centralized Execution Mode and Player Decision Ownership Architecture
 * for Battle Spirits Eternal (Phase L.1).
 * 
 * Enforces strict separation between human players, AI providers, and headless
 * simulation environments. Guarantees that in HUMAN_VS_HUMAN PvP, neither player's
 * decisions can be made autonomously by the engine or AI.
 */

import crypto from 'node:crypto';

export const EXECUTION_MODES = Object.freeze({
  HUMAN_VS_HUMAN: 'HUMAN_VS_HUMAN',
  HUMAN_VS_AI: 'HUMAN_VS_AI',
  AI_VS_AI: 'AI_VS_AI',
  HEADLESS_SIMULATION: 'HEADLESS_SIMULATION'
});

export const PLAYER_CONTROL_TYPES = Object.freeze({
  HUMAN: 'HUMAN',
  AI: 'AI',
  SIMULATION: 'SIMULATION'
});

let matchIdCounter = 1;

export function resetMatchCounter() {
  matchIdCounter = 1;
}

export function generateSecureToken(prefix = 'tok') {
  const webCrypto = (typeof globalThis !== 'undefined' && globalThis.crypto) || (typeof window !== 'undefined' && window.crypto);
  if (webCrypto) {
    if (typeof webCrypto.randomBytes === 'function') {
      return `${prefix}_${webCrypto.randomBytes(24).toString('hex')}`;
    }
    if (typeof webCrypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(24);
      webCrypto.getRandomValues(bytes);
      return `${prefix}_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomBytes === 'function') {
      return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      return `${prefix}_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  const err = new Error('CRYPTOGRAPHIC_FAILURE: Cryptographically secure random generation is unavailable in this environment');
  err.code = 'CRYPTOGRAPHIC_FAILURE';
  throw err;
}

/**
 * Authoritative session and match context managing player identities,
 * control configurations, execution modes, and security tokens.
 */
export class MatchContext {
  constructor(config = {}) {
    if (config.mode !== undefined && !Object.values(EXECUTION_MODES).includes(config.mode)) {
      throw new Error(`INVALID_EXECUTION_MODE: "${config.mode}" is not a valid execution mode`);
    }

    // Default mode: HEADLESS_SIMULATION if omitted in headless test environments,
    // or explicit mode from config.
    this.mode = config.mode || EXECUTION_MODES.HEADLESS_SIMULATION;
    this.matchId = config.matchId || `match_${matchIdCounter++}_${Date.now()}`;
    this.requireAuth = Boolean(config.requireAuth !== false && config.mode !== EXECUTION_MODES.HEADLESS_SIMULATION);

    const defaultControls = this._getDefaultControls(this.mode);
    const playerConfigs = config.players || {};

    this.players = {};

    const sides = ['player', 'opponent'];
    for (const side of sides) {
      const explicit = playerConfigs[side] || {};
      const controlType = explicit.controlType || defaultControls[side];

      if (!Object.values(PLAYER_CONTROL_TYPES).includes(controlType)) {
        throw new Error(`INVALID_PLAYER_CONTROL_TYPE: "${controlType}" for player side "${side}"`);
      }

      const playerId = explicit.id || explicit.playerId || side;
      const playerName = explicit.name || (side === 'player' ? 'Player 1' : 'Player 2');

      this.players[side] = Object.freeze({
        id: playerId,
        name: playerName,
        side,
        controlType
      });
    }

    // Allow lookup by side ('player' / 'opponent') or by custom ID
    this._idToSide = new Map();
    for (const side of sides) {
      this._idToSide.set(side, side);
      this._idToSide.set(this.players[side].id, side);
    }

    // Immutable configuration lock: mode and player control types cannot be mutated after creation
    Object.freeze(this.players);
    Object.freeze(this);
  }

  _getDefaultControls(mode) {
    switch (mode) {
      case EXECUTION_MODES.HUMAN_VS_HUMAN:
        return { player: PLAYER_CONTROL_TYPES.HUMAN, opponent: PLAYER_CONTROL_TYPES.HUMAN };
      case EXECUTION_MODES.HUMAN_VS_AI:
        return { player: PLAYER_CONTROL_TYPES.HUMAN, opponent: PLAYER_CONTROL_TYPES.AI };
      case EXECUTION_MODES.AI_VS_AI:
        return { player: PLAYER_CONTROL_TYPES.AI, opponent: PLAYER_CONTROL_TYPES.AI };
      case EXECUTION_MODES.HEADLESS_SIMULATION:
      default:
        return { player: PLAYER_CONTROL_TYPES.SIMULATION, opponent: PLAYER_CONTROL_TYPES.SIMULATION };
    }
  }

  resolveSide(playerSideOrId) {
    if (!playerSideOrId) return null;
    return this._idToSide.get(playerSideOrId) || null;
  }

  getPlayerConfig(playerSideOrId) {
    const side = this.resolveSide(playerSideOrId);
    return side ? this.players[side] : null;
  }

  getControlType(playerSideOrId) {
    const cfg = this.getPlayerConfig(playerSideOrId);
    return cfg ? cfg.controlType : null;
  }

  isHuman(playerSideOrId) {
    return this.getControlType(playerSideOrId) === PLAYER_CONTROL_TYPES.HUMAN;
  }

  isAi(playerSideOrId) {
    return this.getControlType(playerSideOrId) === PLAYER_CONTROL_TYPES.AI;
  }

  isSimulation(playerSideOrId) {
    return this.getControlType(playerSideOrId) === PLAYER_CONTROL_TYPES.SIMULATION;
  }

  /**
   * Asserts whether an AI decision provider may be invoked for this player.
   * STRICT INVARIANT: Always returns FALSE in HUMAN_VS_HUMAN mode.
   */
  canAiDecide(playerSideOrId) {
    if (this.mode === EXECUTION_MODES.HUMAN_VS_HUMAN) {
      return false;
    }
    return this.isAi(playerSideOrId);
  }

  /**
   * Asserts whether headless simulation auto-fallbacks are permitted.
   * STRICT INVARIANT: Only permitted when mode is explicitly HEADLESS_SIMULATION.
   */
  canSimulate(playerSideOrId) {
    return this.mode === EXECUTION_MODES.HEADLESS_SIMULATION && this.isSimulation(playerSideOrId);
  }

  /**
   * Validates responder authentication and authorization against the match context.
   */
  validateAuth(decisionOwner, authContext) {
    const ownerSide = this.resolveSide(decisionOwner);
    if (!ownerSide) {
      return { valid: false, reason: `UNKNOWN_DECISION_OWNER: "${decisionOwner}" is not a registered player` };
    }

    if (!authContext || typeof authContext !== 'object') {
      if (this.requireAuth) {
        return { valid: false, reason: 'AUTHENTICATION_REQUIRED: Response must include valid authentication context' };
      }
      return { valid: true };
    }

    // Match ID validation
    if (authContext.matchId && authContext.matchId !== this.matchId) {
      return {
        valid: false,
        reason: `MATCH_MISMATCH: Response match "${authContext.matchId}" does not match active match "${this.matchId}"`
      };
    }

    // Responder identity check
    const responder = authContext.responder || authContext.player || authContext.decisionOwner;
    const responderSide = this.resolveSide(responder);
    if (!responderSide && this.requireAuth) {
      return {
        valid: false,
        reason: 'UNAUTHORIZED_RESPONDER: Missing or invalid responder identity in authentication context'
      };
    }
    if (responderSide && responderSide !== ownerSide) {
      return {
        valid: false,
        reason: `UNAUTHORIZED_RESPONDER: Responder "${responder}" (side: ${responderSide}) cannot respond for decision owner "${decisionOwner}" (side: ${ownerSide})`
      };
    }

    return { valid: true, side: ownerSide, player: this.players[ownerSide] };
  }
}

export function createMatchContext(config = {}) {
  return new MatchContext(config);
}
