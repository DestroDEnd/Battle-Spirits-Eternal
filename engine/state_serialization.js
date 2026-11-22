/**
 * engine/state_serialization.js
 * 
 * Complete Engine State Serialization, Deserialization, Restoration & Redaction
 * for Battle Spirits Eternal (Phase M).
 * 
 * Guarantees that matches can be saved and restored at any point of execution
 * without duplicating effects, losing pending interactions, or corrupting
 * core conservation or card zones.
 */

import {
  createGameState,
  createCardInstance,
  createFieldStack,
  validateGameState,
  createEmptyTurnHistory
} from './state.js';
import { MatchContext, EXECUTION_MODES, PLAYER_CONTROL_TYPES } from './session_mode.js';
import { restoreRestrictionState } from './restrictions.js';

/**
 * Serializes a card instance into a clean JSON-safe object.
 */
export function serializeCard(card) {
  if (!card || typeof card !== 'object') return null;
  return {
    id: card.id,
    cardNumber: card.cardNumber || card.card_number || card.id || 'UNKNOWN',
    name: card.name || 'Unknown',
    type: card.type || 'Spirit',
    family: card.family || '',
    cost: typeof card.cost === 'number' ? card.cost : parseInt(card.cost || '0', 10),
    colors: Array.isArray(card.colors) ? [...card.colors] : [card.color || 'Red'],
    symbols: Array.isArray(card.symbols) ? [...card.symbols] : [card.color || 'Red'],
    reduction: card.reduction ? { ...card.reduction } : {},
    levels: card.levels ? JSON.parse(JSON.stringify(card.levels)) : { 1: { cost: 1, bp: 1000 } },
    effect: card.effect || card.raw_effect || '',
    keywords: card.keywords ? [...card.keywords] : null,
    face: card.face || 'A',
    compiledIr: card.compiledIr ? JSON.parse(JSON.stringify(card.compiledIr)) : null,
    owner: card.owner || 'player',
    currentOwner: card.currentOwner || card.owner || 'player',
    isVanilla: Boolean(card.isVanilla || card.is_vanilla),
    isContractPartner: Boolean(card.isContractPartner || card.is_contract_partner),
    burst: card.burst ? JSON.parse(JSON.stringify(card.burst)) : null,
    isBurst: Boolean(card.isBurst || card.burst),
    backSide: card.backSide ? serializeCard(card.backSide) : null,
    frontSide: card.frontSide ? serializeCard(card.frontSide) : null,
    isAccelRemoved: Boolean(card.isAccelRemoved),
    fromAccel: Boolean(card.fromAccel),
    canSummonFromRemoved: Boolean(card.canSummonFromRemoved),
    faceUp: Boolean(card.faceUp),
    placementId: card.placementId || null
  };
}

/**
 * Serializes a field stack.
 */
export function serializeFieldStack(stack) {
  if (!stack || typeof stack !== 'object') return null;
  return {
    id: stack.id,
    placementId: stack.placementId || stack.id,
    top: serializeCard(stack.top),
    under: Array.isArray(stack.under) ? stack.under.map(serializeCard).filter(Boolean) : [],
    braves: Array.isArray(stack.braves) ? stack.braves.map(serializeCard).filter(Boolean) : [],
    cores: {
      normal: Number.isInteger(stack.cores?.normal) ? stack.cores.normal : 0,
      soul: stack.cores?.soul ? 1 : 0
    },
    state: stack.state || 'REFRESHED',
    owner: stack.owner || (stack.top ? stack.top.owner : 'player'),
    standby: stack.standby ? JSON.parse(JSON.stringify(stack.standby)) : null,
    isSoulState: Boolean(stack.isSoulState),
    currentFace: stack.currentFace || 'A',
    isFlipped: Boolean(stack.isFlipped)
  };
}

/**
 * Serializes a player's complete state.
 */
export function serializePlayerState(player) {
  if (!player || typeof player !== 'object') return null;
  return {
    id: player.id,
    life: Number.isInteger(player.life) ? player.life : 5,
    reserve: {
      normal: Number.isInteger(player.reserve?.normal) ? player.reserve.normal : 0,
      soul: player.reserve?.soul ? 1 : 0
    },
    trash: {
      normal: Number.isInteger(player.trash?.normal) ? player.trash.normal : 0,
      soul: player.trash?.soul ? 1 : 0
    },
    voidCores: {
      normal: Number.isInteger(player.voidCores?.normal) ? player.voidCores.normal : 0,
      soul: player.voidCores?.soul ? 1 : 0
    },
    counters: Number.isInteger(player.counters) ? player.counters : 0,
    burst: serializeCard(player.burst),
    mirage: serializeCard(player.mirage),
    deck: Array.isArray(player.deck) ? player.deck.map(serializeCard).filter(Boolean) : [],
    hand: Array.isArray(player.hand) ? player.hand.map(serializeCard).filter(Boolean) : [],
    field: Array.isArray(player.field) ? player.field.map(serializeFieldStack).filter(Boolean) : [],
    nexus: Array.isArray(player.nexus) ? player.nexus.map(serializeFieldStack).filter(Boolean) : [],
    grave: Array.isArray(player.grave) ? player.grave.map(serializeCard).filter(Boolean) : [],
    removed: Array.isArray(player.removed) ? player.removed.map(serializeCard).filter(Boolean) : [],
    hasUsedMulligan: Boolean(player.hasUsedMulligan),
    burstSetThisTurn: Boolean(player.burstSetThisTurn),
    mirageSetThisTurn: Boolean(player.mirageSetThisTurn),
    combatDamageTakenThisTurn: Number(player.combatDamageTakenThisTurn) || 0
  };
}

/**
 * Recursively removes sensitive credential fields from any data structure.
 */
export function scrubCredentials(obj, visited = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return obj;
  if (visited.has(obj)) return obj;
  visited.add(obj);

  const sensitiveKeys = new Set([
    'authToken',
    'player1Token',
    'player2Token',
    'tokenHash',
    'player1_token_hash',
    'player2_token_hash',
    'secret',
    'password',
    'recoveryToken'
  ]);

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        scrubCredentials(obj[i], visited);
      }
    }
  } else {
    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.has(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        scrubCredentials(obj[key], visited);
      }
    }
  }
  return obj;
}

/**
 * Serializes the complete authoritative GameState into a JSON-safe snapshot.
 */
export function serializeGameState(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('SERIALIZATION_ERROR: State must be a non-null object');
  }

  const matchCtx = state.matchContext;
  const serializedMatchCtx = matchCtx ? {
    mode: matchCtx.mode,
    matchId: matchCtx.matchId,
    requireAuth: matchCtx.requireAuth,
    players: {
      player: matchCtx.players?.player ? {
        id: matchCtx.players.player.id,
        name: matchCtx.players.player.name,
        side: matchCtx.players.player.side,
        controlType: matchCtx.players.player.controlType
      } : null,
      opponent: matchCtx.players?.opponent ? {
        id: matchCtx.players.opponent.id,
        name: matchCtx.players.opponent.name,
        side: matchCtx.players.opponent.side,
        controlType: matchCtx.players.opponent.controlType
      } : null
    }
  } : null;

  // Clean pending interactions
  const pendingInteractions = Array.isArray(state.pendingInteractions)
    ? state.pendingInteractions.map(i => {
        const copy = { ...i };
        // Delete non-serializable promise handlers or DOM references if any
        delete copy.resolve;
        delete copy.reject;
        return JSON.parse(JSON.stringify(copy));
      })
    : [];

  return {
    version: 1,
    serializedAt: Date.now(),
    matchId: state.matchId || (matchCtx ? matchCtx.matchId : 'local_match'),
    executionMode: state.executionMode || (matchCtx ? matchCtx.mode : EXECUTION_MODES.HEADLESS_SIMULATION),
    matchContext: serializedMatchCtx,
    turnNumber: Number.isInteger(state.turnNumber) ? state.turnNumber : 1,
    activePlayer: state.activePlayer || 'player',
    firstPlayer: state.firstPlayer || 'player',
    step: state.step || 'START',
    winner: state.winner || null,
    winReason: state.winReason || null,
    strictRules: Boolean(state.strictRules),
    deckValidation: state.deckValidation ? JSON.parse(JSON.stringify(state.deckValidation)) : null,
    players: {
      player: serializePlayerState(state.players?.player),
      opponent: serializePlayerState(state.players?.opponent)
    },
    combat: state.combat ? JSON.parse(JSON.stringify(state.combat)) : null,
    modifiers: Array.isArray(state.modifiers)
      ? state.modifiers.map(m => {
          // Serialize modifier descriptors
          return {
            id: m.id,
            layer: m.layer,
            type: m.type,
            value: m.value,
            duration: m.duration,
            sourceId: m.sourceId,
            filter: typeof m.filter === 'object' && m.filter !== null ? JSON.parse(JSON.stringify(m.filter)) : null
          };
        })
      : [],
    pendingInteractions,
    pendingPrompts: [...pendingInteractions],
    turnHistory: state.turnHistory ? JSON.parse(JSON.stringify(state.turnHistory)) : createEmptyTurnHistory(),
    restrictions: state.restrictions ? JSON.parse(JSON.stringify(state.restrictions)) : {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    },
    resolverContinuation: state.resolverContinuation ? JSON.parse(JSON.stringify(state.resolverContinuation)) : null
  };

  return scrubCredentials(serialized);
}

/**
 * Deserializes and reconstitutes a complete GameState from a serialized snapshot.
 */
export function deserializeGameState(data, options = {}) {
  if (!data || typeof data !== 'object') {
    throw new Error('DESERIALIZATION_ERROR: Snapshot data must be an object');
  }

  const raw = typeof data === 'string' ? JSON.parse(data) : data;

  // Reconstitute MatchContext
  let matchContext = null;
  if (raw.matchContext) {
    matchContext = new MatchContext({
      mode: raw.matchContext.mode || raw.executionMode,
      matchId: raw.matchContext.matchId || raw.matchId,
      requireAuth: raw.matchContext.requireAuth,
      players: raw.matchContext.players
    });
  } else {
    matchContext = new MatchContext({
      mode: raw.executionMode || EXECUTION_MODES.HEADLESS_SIMULATION,
      matchId: raw.matchId || 'restored_match'
    });
  }

  // Helper to revive card instance
  const reviveCard = (c, defaultOwner) => {
    if (!c) return null;
    return createCardInstance(c, c.owner || defaultOwner);
  };

  // Helper to revive field stack
  const reviveStack = (s, defaultOwner) => {
    if (!s) return null;
    const top = reviveCard(s.top, s.owner || defaultOwner);
    const under = Array.isArray(s.under) ? s.under.map(c => reviveCard(c, s.owner || defaultOwner)).filter(Boolean) : [];
    const braves = Array.isArray(s.braves) ? s.braves.map(c => reviveCard(c, s.owner || defaultOwner)).filter(Boolean) : [];
    const stack = createFieldStack(top, s.cores, braves, { placementId: s.placementId });
    stack.id = s.id || stack.id;
    stack.under = under;
    stack.state = s.state || 'REFRESHED';
    stack.owner = s.owner || defaultOwner;
    stack.standby = s.standby || null;
    stack.isSoulState = Boolean(s.isSoulState);
    stack.currentFace = s.currentFace || 'A';
    stack.isFlipped = Boolean(s.isFlipped);
    return stack;
  };

  // Helper to revive player
  const revivePlayer = (pData, side) => {
    if (!pData) {
      return {
        id: side,
        life: 5,
        reserve: { normal: 4, soul: 1 },
        trash: { normal: 0, soul: 0 },
        voidCores: { normal: 0, soul: 0 },
        counters: 0,
        burst: null,
        mirage: null,
        deck: [],
        hand: [],
        field: [],
        nexus: [],
        grave: [],
        removed: [],
        hasUsedMulligan: false,
        burstSetThisTurn: false,
        mirageSetThisTurn: false,
        combatDamageTakenThisTurn: 0
      };
    }
    return {
      id: pData.id || side,
      life: pData.life ?? 5,
      reserve: {
        normal: pData.reserve?.normal ?? 4,
        soul: pData.reserve?.soul ?? 1
      },
      trash: {
        normal: pData.trash?.normal ?? 0,
        soul: pData.trash?.soul ?? 0
      },
      voidCores: {
        normal: pData.voidCores?.normal ?? 0,
        soul: pData.voidCores?.soul ?? 0
      },
      counters: pData.counters ?? 0,
      burst: reviveCard(pData.burst, side),
      mirage: reviveCard(pData.mirage, side),
      deck: Array.isArray(pData.deck) ? pData.deck.map(c => reviveCard(c, side)).filter(Boolean) : [],
      hand: Array.isArray(pData.hand) ? pData.hand.map(c => reviveCard(c, side)).filter(Boolean) : [],
      field: Array.isArray(pData.field) ? pData.field.map(s => reviveStack(s, side)).filter(Boolean) : [],
      nexus: Array.isArray(pData.nexus) ? pData.nexus.map(s => reviveStack(s, side)).filter(Boolean) : [],
      grave: Array.isArray(pData.grave) ? pData.grave.map(c => reviveCard(c, side)).filter(Boolean) : [],
      removed: Array.isArray(pData.removed) ? pData.removed.map(c => reviveCard(c, side)).filter(Boolean) : [],
      hasUsedMulligan: Boolean(pData.hasUsedMulligan),
      burstSetThisTurn: Boolean(pData.burstSetThisTurn),
      mirageSetThisTurn: Boolean(pData.mirageSetThisTurn),
      combatDamageTakenThisTurn: Number(pData.combatDamageTakenThisTurn) || 0
    };
  };

  const state = {
    turnNumber: raw.turnNumber || 1,
    activePlayer: raw.activePlayer || 'player',
    firstPlayer: raw.firstPlayer || 'player',
    step: raw.step || 'START',
    winner: raw.winner || null,
    winReason: raw.winReason || null,
    executionMode: raw.executionMode || matchContext.mode,
    matchContext,
    matchId: raw.matchId || matchContext.matchId,
    strictRules: Boolean(raw.strictRules),
    deckValidation: raw.deckValidation || null,
    players: {
      player: revivePlayer(raw.players?.player, 'player'),
      opponent: revivePlayer(raw.players?.opponent, 'opponent')
    },
    combat: raw.combat || null,
    modifiers: Array.isArray(raw.modifiers) ? [...raw.modifiers] : [],
    pendingPrompts: Array.isArray(raw.pendingInteractions) ? [...raw.pendingInteractions] : [],
    pendingInteractions: Array.isArray(raw.pendingInteractions) ? [...raw.pendingInteractions] : [],
    turnHistory: raw.turnHistory || createEmptyTurnHistory(),
    restrictions: raw.restrictions || {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    },
    resolverContinuation: raw.resolverContinuation || null
  };

  // Restore restriction transient reservations
  restoreRestrictionState(state);

  // Validate state invariants
  const validation = validateGameState(state);
  if (!validation.valid) {
    const err = new Error(`RESTORED_STATE_INVALID: ${validation.errors.join('; ')}`);
    err.code = 'RESTORED_STATE_INVALID';
    err.errors = validation.errors;
    throw err;
  }

  return state;
}

/**
 * Creates a redacted view of the game state for a specific viewer (player, opponent, or spectator).
 * Guarantees that hidden private card data (opponent hand, face-down burst, deck order) is masked.
 */
export function redactGameStateForViewer(state, viewerSideOrToken = null) {
  if (!state) return null;

  // Determine viewer side
  let viewerSide = null;
  if (viewerSideOrToken === 'player' || viewerSideOrToken === 'opponent') {
    viewerSide = viewerSideOrToken;
  } else if (state.matchContext && typeof viewerSideOrToken === 'string') {
    if (state.matchContext.players?.player?.authToken === viewerSideOrToken) {
      viewerSide = 'player';
    } else if (state.matchContext.players?.opponent?.authToken === viewerSideOrToken) {
      viewerSide = 'opponent';
    }
  }

  // Create deep clone of serialized state
  const snapshot = serializeGameState(state);

  const maskCard = (card, side) => ({
    id: card.id,
    masked: true,
    owner: side,
    cardNumber: 'HIDDEN',
    name: 'Hidden Card',
    type: 'Card',
    cost: 0,
    colors: ['Colorless'],
    symbols: []
  });

  for (const side of ['player', 'opponent']) {
    const p = snapshot.players[side];
    if (!p) continue;

    const isOwner = viewerSide === side;

    if (!isOwner) {
      // Mask hand cards
      p.hand = p.hand.map(c => maskCard(c, side));

      // Mask deck cards (keep only count)
      p.deck = p.deck.map(c => maskCard(c, side));

      // Mask set Burst
      if (p.burst) {
        p.burst = {
          id: p.burst.id,
          masked: true,
          owner: side,
          isSet: true
        };
      }
    }
  }

  // Filter pending interaction candidates if they contain opponent private cards
  if (snapshot.pendingInteractions) {
    snapshot.pendingInteractions = snapshot.pendingInteractions.map(interaction => {
      if (interaction.decisionOwner !== viewerSide && viewerSide !== null) {
        // Not this viewer's decision, mask detailed candidate private info
        return {
          ...interaction,
          candidates: interaction.candidates.map(c => {
            if (c.zone === 'hand' && c.side !== viewerSide) {
              return { candidateId: c.candidateId, masked: true, zone: 'hand', side: c.side };
            }
            return c;
          })
        };
      }
      return interaction;
    });
  }

  return scrubCredentials(snapshot);
}
