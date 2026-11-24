/**
 * engine/state.js
 * 
 * Game State and Card Instance representations for Battle Spirits Eternal.
 */

import { ETERNAL_RULES } from './rules/eternal.js';
import { createMatchContext, MatchContext, EXECUTION_MODES, PLAYER_CONTROL_TYPES } from './session_mode.js';
export { MatchContext, EXECUTION_MODES, PLAYER_CONTROL_TYPES, createMatchContext };

let nextInstanceId = 1;
let nextPlacementId = 1;

export function resetInstanceIdCounter() {
  nextInstanceId = 1;
}

export function resetPlacementIdCounter() {
  nextPlacementId = 1;
}

export function createCardInstance(cardData, owner = 'player') {
  const id = `inst_${nextInstanceId++}`;
  const family = cardData.family || (Array.isArray(cardData.families) ? cardData.families.join(' ') : '');
  const type = cardData.type || 'Spirit';
  const isContractPartner = Boolean(
    cardData.is_contract_partner ||
    cardData.isContractPartner ||
    type === 'Contract Nexus' ||
    (type.includes('Contract') && family.toLowerCase().includes('flag'))
  );
  return {
    id,
    cardNumber: cardData.card_number || cardData.cardNumber || cardData.id || 'UNKNOWN',
    name: cardData.name || 'Unknown',
    type,
    family,
    cost: typeof cardData.cost === 'number' ? cardData.cost : parseInt(cardData.cost || '0', 10),
    colors: cardData.colors || [cardData.color || 'Red'],
    symbols: cardData.symbols || [cardData.color || 'Red'],
    reduction: cardData.reduction || {},
    levels: cardData.levels || { 1: { cost: 1, bp: 1000 } },
    effect: cardData.effect || cardData.raw_effect || '',
    keywords: cardData.keywords || null,
    face: cardData.face || ((cardData.card_number || cardData.cardNumber || '').includes('-A') ? 'B' : (cardData.card_number || cardData.cardNumber || '').endsWith('B') ? 'B' : 'A'),
    compiledIr: cardData.compiledIr || null,
    owner,
    currentOwner: owner,
    isVanilla: Boolean(cardData.is_vanilla),
    isContractPartner,
    burst: cardData.burst || null,
    isBurst: Boolean(cardData.isBurst || cardData.burst),
    backSide: cardData.backSide || null,
    frontSide: cardData.frontSide || null,
    isAccelRemoved: Boolean(cardData.isAccelRemoved),
    fromAccel: Boolean(cardData.fromAccel),
    canSummonFromRemoved: Boolean(cardData.canSummonFromRemoved),
    faceUp: Boolean(cardData.faceUp)
  };
}

export function createFieldStack(topCard, initialCores = { normal: 1, soul: 0 }, initialBraves = [], options = {}) {
  const stackId = `stack_${topCard.id}`;
  const initialFace = topCard.face || 'A';
  const placementId = options.placementId || `p_${nextPlacementId++}`;
  if (topCard && typeof topCard === 'object') {
    topCard.placementId = placementId;
    if (!topCard.type) {
      topCard.type = 'Spirit';
    }
  }
  return {
    id: stackId,
    placementId,
    top: topCard,
    under: [], // Cards stacked beneath (e.g. Pre-Advent)
    braves: initialBraves, // Braved Brave cards
    cores: {
      normal: initialCores.normal || 0,
      soul: initialCores.soul ? 1 : 0
    },
    state: 'REFRESHED', // REFRESHED | EXHAUSTED | HEAVY_EXHAUSTED
    owner: topCard.owner,
    standby: null, // null or { type, previousLevel, by, cause, sourceCard }
    isSoulState: false,
    currentFace: initialFace,
    isFlipped: initialFace === 'B'
  };
}

export function createInitialPlayerState(playerId, deckCards = []) {
  return {
    id: playerId,
    life: ETERNAL_RULES.setup.initialLife,
    reserve: {
      normal: ETERNAL_RULES.setup.initialReserveCores - 1, // 3 normal
      soul: 1 // 1 Soul Core
    },
    trash: {
      normal: 0,
      soul: 0
    },
    voidCores: { normal: 0, soul: 0 },
    counters: 0,
    burst: null,
    mirage: null,
    deck: [...deckCards],
    hand: [],
    field: [], // Array of field stacks
    nexus: [], // Nexuses placed on field
    grave: [], // Card graveyard
    removed: [], // Removed / Open Zone
    hasUsedMulligan: false,
    burstSetThisTurn: false,
    mirageSetThisTurn: false,
    combatDamageTakenThisTurn: 0
  };
}

export function createEmptyTurnHistory() {
  const mk = () => ({
    lifeReduced: 0,
    attacksDeclared: 0,
    adventsPerformed: 0,
    soulCoreBanished: 0,
    soulCoreUsed: 0,
    burstsActivated: [],
    summonedMechanics: []
  });
  return { player: mk(), opponent: mk() };
}

export function resetTurnHistory(state) {
  if (!state) return;
  state.turnHistory = createEmptyTurnHistory();
}

export function createGameState(playerDeck = [], opponentDeck = [], firstPlayer = 'player', options = {}) {
  const matchCtx = options.matchContext || (options.mode ? createMatchContext(options) : createMatchContext({ mode: options.executionMode || EXECUTION_MODES.HEADLESS_SIMULATION }));
  return {
    turnNumber: 1,
    activePlayer: firstPlayer,
    firstPlayer,
    step: 'START',
    winner: null,
    winReason: null,
    executionMode: matchCtx.mode,
    matchContext: matchCtx,
    matchId: matchCtx.matchId,
    players: {
      player: createInitialPlayerState('player', playerDeck),
      opponent: createInitialPlayerState('opponent', opponentDeck)
    },
    combat: null,
    modifiers: [], // Dynamic continuous modifiers
    pendingPrompts: [], // Active decisions awaiting player input (legacy)
    pendingInteractions: [], // Formal pending interaction protocol requests
    pendingExecutions: [], // Serializable suspended resolver continuations
    resolvingCards: [], // Cards currently mid-resolution (e.g. Magic awaiting interaction)
    abilityUses: {}, // Legacy turn-scoped activation limits mirror
    turnHistory: createEmptyTurnHistory(),
    restrictions: {
      counters: {}, // Authoritative restriction counters
      meta: {},     // Restriction metadata
      reservations: {}, // Active capacity reservations
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 } // Lifecycle generation tracking
    }
  };
}

const VALID_STEPS = new Set(['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END']);
const VALID_SIDES = new Set(['player', 'opponent']);

/**
 * Computes total normal cores and soul cores currently held by a player
 * across all core-bearing zones: Life, Reserve, Core Trash, Void, and Field stacks.
 *
 * Note: Void cores are included so cross-zone core transfers (e.g., Core Step,
 * Void-sending effects, Soul Drive) preserve total core conservation across the
 * player's complete core pool.
 */
export function getTotalPlayerCores(state, side) {
  const p = state?.players?.[side];
  if (!p) {
    return {
      normal: 0,
      soul: 0,
      total: 0,
      byZone: { life: 0, reserve: 0, trash: 0, voidCores: 0, field: 0 }
    };
  }

  const lifeNormal = Number.isInteger(p.life) ? p.life : 0;
  const reserveNormal = Number.isInteger(p.reserve?.normal) ? p.reserve.normal : 0;
  const reserveSoul = Number.isInteger(p.reserve?.soul) ? p.reserve.soul : 0;
  const trashNormal = Number.isInteger(p.trash?.normal) ? p.trash.normal : 0;
  const trashSoul = Number.isInteger(p.trash?.soul) ? p.trash.soul : 0;
  const voidNormal = Number.isInteger(p.voidCores?.normal) ? p.voidCores.normal : 0;
  const voidSoul = Number.isInteger(p.voidCores?.soul) ? p.voidCores.soul : 0;

  let fieldNormal = 0;
  let fieldSoul = 0;
  for (const stack of p.field || []) {
    fieldNormal += Number.isInteger(stack?.cores?.normal) ? stack.cores.normal : 0;
    fieldSoul += Number.isInteger(stack?.cores?.soul) ? stack.cores.soul : 0;
  }

  const normal = lifeNormal + reserveNormal + trashNormal + voidNormal + fieldNormal;
  const soul = reserveSoul + trashSoul + voidSoul + fieldSoul;

  return {
    normal,
    soul,
    total: normal + soul,
    byZone: {
      life: lifeNormal,
      reserve: reserveNormal + reserveSoul,
      trash: trashNormal + trashSoul,
      voidCores: voidNormal + voidSoul,
      field: fieldNormal + fieldSoul
    }
  };
}

/**
 * Validates authoritative game state invariants:
 * - Valid activePlayer, step, turnNumber, and combat object (if active)
 * - Card instance ID uniqueness across all zones
 * - Card ownership validity
 * - Core non-negativity, integer integrity, missing core-zone detection, and Soul Core conservation (<= 1 per player)
 *
 * Reports defects without silently repairing state.
 *
 * @param {object} state
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateGameState(state) {
  const errors = [];
  if (!state || typeof state !== 'object') {
    return { valid: false, errors: ['State is null or not an object'] };
  }

  if (!VALID_SIDES.has(state.activePlayer)) {
    errors.push(`Invalid activePlayer: ${String(state.activePlayer)}`);
  }
  if (!VALID_STEPS.has(state.step)) {
    errors.push(`Invalid step: ${String(state.step)}`);
  }
  if (!Number.isInteger(state.turnNumber) || state.turnNumber < 1) {
    errors.push(`Invalid turnNumber: ${String(state.turnNumber)}`);
  }
  if (state.combat !== null && state.combat !== undefined) {
    if (typeof state.combat !== 'object' || !state.combat.attackerStackId) {
      errors.push('Invalid combat object: missing attackerStackId');
    }
  }

  const seenCardIds = new Map();
  const seenStackIds = new Set();

  const recordCard = (card, location) => {
    if (!card || typeof card !== 'object') {
      errors.push(`Null or invalid card at ${location}`);
      return;
    }
    if (!card.id) {
      errors.push(`Card missing id at ${location}`);
      return;
    }
    if (seenCardIds.has(card.id)) {
      errors.push(`Duplicate card instance ${card.id} in ${location} and ${seenCardIds.get(card.id)}`);
    } else {
      seenCardIds.set(card.id, location);
    }
    if (card.owner && !VALID_SIDES.has(card.owner)) {
      errors.push(`Invalid card owner ${card.owner} on ${card.id} at ${location}`);
    }
  };

  if (Array.isArray(state.resolvingCards)) {
    for (let i = 0; i < state.resolvingCards.length; i++) {
      recordCard(state.resolvingCards[i], `resolvingCards[${i}]`);
    }
  }

  for (const side of ['player', 'opponent']) {
    const p = state.players?.[side];
    if (!p || typeof p !== 'object') {
      errors.push(`Missing player state: ${side}`);
      continue;
    }

    // Required core-zone object checks
    if (!p.reserve || typeof p.reserve !== 'object') {
      errors.push(`Missing core zone: ${side}.reserve`);
    }
    if (!p.trash || typeof p.trash !== 'object') {
      errors.push(`Missing core zone: ${side}.trash`);
    }
    if (!p.voidCores || typeof p.voidCores !== 'object') {
      errors.push(`Missing core zone: ${side}.voidCores`);
    }

    // Core non-negativity and integer checks
    for (const [label, val] of [
      [`${side}.life`, p.life],
      [`${side}.reserve.normal`, p.reserve?.normal],
      [`${side}.reserve.soul`, p.reserve?.soul],
      [`${side}.trash.normal`, p.trash?.normal],
      [`${side}.trash.soul`, p.trash?.soul],
      [`${side}.voidCores.normal`, p.voidCores?.normal],
      [`${side}.voidCores.soul`, p.voidCores?.soul]
    ]) {
      if (!Number.isInteger(val) || val < 0) {
        errors.push(`Invalid core count at ${label}: ${String(val)}`);
      }
    }

    let soulCoreCount = (Number.isInteger(p.reserve?.soul) ? p.reserve.soul : 0) +
      (Number.isInteger(p.trash?.soul) ? p.trash.soul : 0) +
      (Number.isInteger(p.voidCores?.soul) ? p.voidCores.soul : 0);

    for (const zoneName of ['deck', 'hand', 'grave', 'removed', 'nexus']) {
      if (!Array.isArray(p[zoneName])) {
        errors.push(`Missing or non-array zone: ${side}.${zoneName}`);
        continue;
      }
      const list = p[zoneName];
      for (let i = 0; i < list.length; i++) {
        recordCard(list[i], `${side}.${zoneName}[${i}]`);
      }
    }

    if (p.burst) recordCard(p.burst, `${side}.burst`);
    if (p.mirage) recordCard(p.mirage, `${side}.mirage`);

    if (!Array.isArray(p.field)) {
      errors.push(`Missing or non-array zone: ${side}.field`);
      continue;
    }

    for (let i = 0; i < p.field.length; i++) {
      const st = p.field[i];
      if (!st || typeof st !== 'object' || !st.id) {
        errors.push(`Invalid stack at ${side}.field[${i}]`);
        continue;
      }
      if (seenStackIds.has(st.id)) {
        errors.push(`Duplicate stack id ${st.id}`);
      } else {
        seenStackIds.add(st.id);
      }
      if (st.owner && !VALID_SIDES.has(st.owner)) {
        errors.push(`Invalid stack owner ${st.owner} on ${st.id}`);
      }
      if (!st.cores || typeof st.cores !== 'object') {
        errors.push(`Missing cores object on stack ${st.id}`);
      } else {
        const sn = st.cores.normal;
        const ss = st.cores.soul;
        if (!Number.isInteger(sn) || sn < 0 || !Number.isInteger(ss) || ss < 0 || ss > 1) {
          errors.push(`Invalid stack cores on ${st.id}: normal=${String(sn)}, soul=${String(ss)}`);
        } else {
          soulCoreCount += ss;
        }
      }

      recordCard(st.top, `${side}.field[${i}].top`);
      for (let u = 0; u < (st.under || []).length; u++) {
        recordCard(st.under[u], `${side}.field[${i}].under[${u}]`);
      }
      for (let b = 0; b < (st.braves || []).length; b++) {
        recordCard(st.braves[b], `${side}.field[${i}].braves[${b}]`);
      }
    }

    if (soulCoreCount > 1) {
      errors.push(`Soul Core conservation violated for ${side}: found ${soulCoreCount} Soul Cores`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Creates a detached, deep clone of authoritative game state.
 * Guaranteed zero shared references or prototype contamination.
 */
export function cloneGameState(state) {
  if (!state || typeof state !== 'object') return null;
  return structuredClone(state);
}
