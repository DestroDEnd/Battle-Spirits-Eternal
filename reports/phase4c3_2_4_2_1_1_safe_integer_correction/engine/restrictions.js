/**
 * engine/restrictions.js
 * 
 * Deterministic Runtime Activation-Limit Enforcement Engine for Battle Spirits Eternal.
 * 
 * Architectural Guarantees:
 * - Authoritative, serializable plain-JSON restriction state (`state.restrictions`).
 * - Stage 4 Atomic Commitment: restrictions consume upon commitment, not declaration or display.
 * - Ordinary [Once per turn]: Scoped to physical placement (`placementId`) and ability instance (`physicalAbilityId`).
 * - [Once per turn: Same Name]: Scoped to player, canonical card name, and semantic ability identity (`semanticAbilityId`).
 * - Ordinary [Once per game]: Scoped to persistent `card.id` budget counter (engine convention).
 * - [Once per game: Same Name]: Scoped to player, canonical card name, and semantic ability identity for the match.
 * - Scoped lifecycle resets: TURN, STEP, BATTLE, ATTACK.
 * - Strict validation: Rejection of malformed/missing identity and unknown restriction types.
 * - Zero non-serializable structures in authoritative state (no Map, Set, functions, symbols, or circular references).
 */

import { types } from 'node:util';

function isProxy(v) {
  try {
    return Boolean(types && typeof types.isProxy === 'function' && types.isProxy(v));
  } catch {
    return false;
  }
}

export const RESTRICTION_STATUS = {
  ALLOWED: 'ALLOWED',
  LIMIT_REACHED: 'LIMIT_REACHED',
  INVALID_IDENTITY: 'INVALID_IDENTITY',
  UNSUPPORTED_RESTRICTION: 'UNSUPPORTED_RESTRICTION',
  INVALID_RESTRICTION_STATE: 'INVALID_RESTRICTION_STATE',
  DUPLICATE_COMMIT: 'DUPLICATE_COMMIT',
  RESERVATION_INVALIDATED: 'RESERVATION_INVALIDATED'
};

export const RESTRICTION_TYPE = {
  NONE: 'NONE',
  ONCE_PER_TURN: 'ONCE_PER_TURN',
  ONCE_PER_TURN_SAME_NAME: 'ONCE_PER_TURN_SAME_NAME',
  ONCE_PER_GAME: 'ONCE_PER_GAME',
  ONCE_PER_GAME_SAME_NAME: 'ONCE_PER_GAME_SAME_NAME',
  ONCE_PER_STEP: 'ONCE_PER_STEP',
  ONCE_PER_BATTLE: 'ONCE_PER_BATTLE',
  ONCE_PER_ATTACK: 'ONCE_PER_ATTACK',
  UNKNOWN: 'UNKNOWN'
};

export const RESTRICTION_SCOPE = {
  TURN: 'TURN',
  GAME: 'GAME',
  STEP: 'STEP',
  BATTLE: 'BATTLE',
  ATTACK: 'ATTACK'
};

export const VALID_TYPES = new Set([
  RESTRICTION_TYPE.NONE,
  RESTRICTION_TYPE.ONCE_PER_TURN,
  RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME,
  RESTRICTION_TYPE.ONCE_PER_GAME,
  RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME,
  RESTRICTION_TYPE.ONCE_PER_STEP,
  RESTRICTION_TYPE.ONCE_PER_BATTLE,
  RESTRICTION_TYPE.ONCE_PER_ATTACK
]);

export const VALID_SCOPES = new Set([
  RESTRICTION_SCOPE.TURN,
  RESTRICTION_SCOPE.GAME,
  RESTRICTION_SCOPE.STEP,
  RESTRICTION_SCOPE.BATTLE,
  RESTRICTION_SCOPE.ATTACK
]);

export const VALID_TYPE_SCOPE_MAP = Object.freeze({
  [RESTRICTION_TYPE.ONCE_PER_TURN]: RESTRICTION_SCOPE.TURN,
  [RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME]: RESTRICTION_SCOPE.TURN,
  [RESTRICTION_TYPE.ONCE_PER_GAME]: RESTRICTION_SCOPE.GAME,
  [RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME]: RESTRICTION_SCOPE.GAME,
  [RESTRICTION_TYPE.ONCE_PER_STEP]: RESTRICTION_SCOPE.STEP,
  [RESTRICTION_TYPE.ONCE_PER_BATTLE]: RESTRICTION_SCOPE.BATTLE,
  [RESTRICTION_TYPE.ONCE_PER_ATTACK]: RESTRICTION_SCOPE.ATTACK
});

/**
 * Checks whether a value is a strict plain JavaScript object with
 * Object.prototype or null prototype (rejecting arrays, class instances, functions, etc.).
 * 
 * @param {unknown} val
 * @returns {boolean}
 */
export function isPlainObject(val) {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    return false;
  }
  if (isProxy(val)) {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

/**
 * Checks whether a restriction key matches the required format for its lifecycle scope.
 * 
 * @param {string} key
 * @param {string} scope
 * @returns {boolean}
 */
export function isValidRestrictionKeyForScope(key, scope) {
  if (typeof key !== 'string' || key.trim() === '') return false;
  switch (scope) {
    case RESTRICTION_SCOPE.TURN:
      return key.startsWith('turn:') && key.split(':').length >= 3;
    case RESTRICTION_SCOPE.GAME:
      return key.startsWith('game:') && key.split(':').length >= 3;
    case RESTRICTION_SCOPE.STEP:
      return key.startsWith('step:') && key.split(':').length >= 4;
    case RESTRICTION_SCOPE.BATTLE:
      return key.startsWith('battle:') && key.split(':').length >= 4;
    case RESTRICTION_SCOPE.ATTACK:
      return key.startsWith('attack:') && key.split(':').length >= 4;
    default:
      return false;
  }
}

/**
 * Checks whether a restriction key is structurally valid under any canonical scope.
 * 
 * @param {string} key
 * @returns {boolean}
 */
export function isValidRestrictionKey(key) {
  if (typeof key !== 'string' || key.trim() === '') return false;
  return (
    isValidRestrictionKeyForScope(key, RESTRICTION_SCOPE.TURN) ||
    isValidRestrictionKeyForScope(key, RESTRICTION_SCOPE.GAME) ||
    isValidRestrictionKeyForScope(key, RESTRICTION_SCOPE.STEP) ||
    isValidRestrictionKeyForScope(key, RESTRICTION_SCOPE.BATTLE) ||
    isValidRestrictionKeyForScope(key, RESTRICTION_SCOPE.ATTACK)
  );
}

const CANONICAL_RESTRICTION_MAP = new Map([
  // None / unrestricted
  ['NONE', RESTRICTION_TYPE.NONE],
  ['UNRESTRICTED', RESTRICTION_TYPE.NONE],

  // Once per turn
  ['ONCE_PER_TURN', RESTRICTION_TYPE.ONCE_PER_TURN],
  ['[ONCE_PER_TURN]', RESTRICTION_TYPE.ONCE_PER_TURN],
  ['OPT', RESTRICTION_TYPE.ONCE_PER_TURN],
  ['TURN', RESTRICTION_TYPE.ONCE_PER_TURN],
  ['ターンに1回', RESTRICTION_TYPE.ONCE_PER_TURN],
  ['ターンに１回', RESTRICTION_TYPE.ONCE_PER_TURN],

  // Once per turn: Same Name
  ['ONCE_PER_TURN_SAME_NAME', RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME],
  ['[ONCE_PER_TURN_SAME_NAME]', RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME],
  ['ONCE_PER_TURN_(SAME_NAME)', RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME],
  ['OPT_SAME_NAME', RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME],
  ['同名ターンに1回', RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME],
  ['同名ターンに１回', RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME],

  // Once per game
  ['ONCE_PER_GAME', RESTRICTION_TYPE.ONCE_PER_GAME],
  ['[ONCE_PER_GAME]', RESTRICTION_TYPE.ONCE_PER_GAME],
  ['OPG', RESTRICTION_TYPE.ONCE_PER_GAME],
  ['GAME', RESTRICTION_TYPE.ONCE_PER_GAME],
  ['ゲームに1回', RESTRICTION_TYPE.ONCE_PER_GAME],
  ['ゲームに１回', RESTRICTION_TYPE.ONCE_PER_GAME],

  // Once per game: Same Name
  ['ONCE_PER_GAME_SAME_NAME', RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME],
  ['[ONCE_PER_GAME_SAME_NAME]', RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME],
  ['ONCE_PER_GAME_(SAME_NAME)', RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME],
  ['OPG_SAME_NAME', RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME],
  ['同名ゲームに1回', RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME],
  ['同名ゲームに１回', RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME],

  // Once per step
  ['ONCE_PER_STEP', RESTRICTION_TYPE.ONCE_PER_STEP],
  ['[ONCE_PER_STEP]', RESTRICTION_TYPE.ONCE_PER_STEP],
  ['OPS', RESTRICTION_TYPE.ONCE_PER_STEP],
  ['STEP', RESTRICTION_TYPE.ONCE_PER_STEP],
  ['ステップに1回', RESTRICTION_TYPE.ONCE_PER_STEP],
  ['ステップに１回', RESTRICTION_TYPE.ONCE_PER_STEP],

  // Once per battle
  ['ONCE_PER_BATTLE', RESTRICTION_TYPE.ONCE_PER_BATTLE],
  ['[ONCE_PER_BATTLE]', RESTRICTION_TYPE.ONCE_PER_BATTLE],
  ['OPB', RESTRICTION_TYPE.ONCE_PER_BATTLE],
  ['BATTLE', RESTRICTION_TYPE.ONCE_PER_BATTLE],
  ['バトルに1回', RESTRICTION_TYPE.ONCE_PER_BATTLE],
  ['バトルに１回', RESTRICTION_TYPE.ONCE_PER_BATTLE],

  // Once per attack
  ['ONCE_PER_ATTACK', RESTRICTION_TYPE.ONCE_PER_ATTACK],
  ['[ONCE_PER_ATTACK]', RESTRICTION_TYPE.ONCE_PER_ATTACK],
  ['OPA', RESTRICTION_TYPE.ONCE_PER_ATTACK],
  ['ATTACK', RESTRICTION_TYPE.ONCE_PER_ATTACK],
  ['アタックに1回', RESTRICTION_TYPE.ONCE_PER_ATTACK],
  ['アタックに１回', RESTRICTION_TYPE.ONCE_PER_ATTACK]
]);

/**
 * Normalizes raw limit string into a canonical RESTRICTION_TYPE.
 * Uses strict deterministic exact matching and documented aliases.
 * Rejects unknown substrings, non-strings, or malformed entries.
 * 
 * @param {string|null|undefined} limitStr
 * @returns {string} One of RESTRICTION_TYPE values
 */
export function normalizeRestrictionType(limitStr) {
  if (limitStr === null || limitStr === undefined) {
    return RESTRICTION_TYPE.NONE;
  }
  if (typeof limitStr !== 'string') {
    return RESTRICTION_TYPE.UNKNOWN;
  }

  const trimmed = limitStr.trim();
  if (trimmed === '') {
    return RESTRICTION_TYPE.UNKNOWN;
  }

  // Exact match against aliases
  if (CANONICAL_RESTRICTION_MAP.has(trimmed)) {
    return CANONICAL_RESTRICTION_MAP.get(trimmed);
  }

  // Match normalized uppercase underscore format
  const normalized = trimmed.toUpperCase().replace(/[\s\-:]+/g, '_');
  if (CANONICAL_RESTRICTION_MAP.has(normalized)) {
    return CANONICAL_RESTRICTION_MAP.get(normalized);
  }

  return RESTRICTION_TYPE.UNKNOWN;
}

/**
 * Validates the authoritative restriction state on a game state.
 * 
 * Strict Validation Rules:
 * - state, restrictions, counters, meta, reservations must be plain objects with Object.prototype or null prototype.
 * - Rejects arrays, class instances, null, or unexpected prototypes.
 * - Counter values and reservation values must be finite non-negative integers.
 * - Meta entries must be plain objects with valid limits and canonical types/scopes.
 * - Meta type and scope must strictly agree with VALID_TYPE_SCOPE_MAP.
 * 
 * @param {object} state
 * @returns {{ valid: boolean, error?: string, reason?: string }}
 */
export function validateRestrictionState(state) {
  if (!isPlainObject(state)) {
    return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'STATE_INVALID' };
  }
  if (!isPlainObject(state.restrictions)) {
    return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'RESTRICTIONS_NOT_OBJECT' };
  }
  const { counters, meta, reservations, generations } = state.restrictions;
  if (!isPlainObject(counters)) {
    return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'COUNTERS_NOT_OBJECT' };
  }
  if (!isPlainObject(meta)) {
    return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'META_NOT_OBJECT' };
  }
  if (reservations !== undefined && !isPlainObject(reservations)) {
    return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'RESERVATIONS_NOT_OBJECT' };
  }
  if (generations !== undefined) {
    if (!isPlainObject(generations)) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'GENERATIONS_NOT_OBJECT' };
    }
    for (const [genScope, genVal] of Object.entries(generations)) {
      if (!VALID_SCOPES.has(genScope)) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_GENERATION_SCOPE: ${genScope}` };
      }
      if (typeof genVal !== 'number' || !Number.isSafeInteger(genVal) || genVal < 1) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_LIFECYCLE_GENERATION: ${genScope}=${genVal}` };
      }
    }
  }

  for (const [key, val] of Object.entries(counters)) {
    if (typeof val !== 'number' || !Number.isSafeInteger(val) || val < 0) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_COUNTER: ${key}=${val}` };
    }
  }

  if (reservations) {
    for (const [key, val] of Object.entries(reservations)) {
      if (typeof val !== 'number' || !Number.isSafeInteger(val) || val <= 0) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESERVATION: ${key}=${val}` };
      }
      if (!isValidRestrictionKey(key)) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESERVATION_KEY: ${key}` };
      }
    }
  }

  // Validate ordinary metadata entries and special metadata namespaces
  for (const [key, m] of Object.entries(meta)) {
    if (key === '_ambiguousLegacy') {
      if (!isPlainObject(m)) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_META: _ambiguousLegacy' };
      }
      for (const [ambKey, ambVal] of Object.entries(m)) {
        if (typeof ambKey !== 'string' || ambKey.trim() === '') {
          return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_AMBIGUOUS_LEGACY_KEY' };
        }
        if (typeof ambVal !== 'number' && typeof ambVal !== 'boolean') {
          return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_AMBIGUOUS_LEGACY_VAL' };
        }
        if (typeof ambVal === 'number' && !Number.isSafeInteger(ambVal)) {
          return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_AMBIGUOUS_LEGACY_VAL' };
        }
      }
      continue;
    }
    if (key === '_reservations') {
      // Validated separately below in reservation records section
      continue;
    }
    if (key.startsWith('_')) {
      // Reject any undocumented or arbitrary underscore-prefixed metadata namespace (including _generations)
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `UNKNOWN_META_NAMESPACE: ${key}` };
    }

    // Ordinary restriction metadata entry validation
    if (!isPlainObject(m)) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_META: ${key}` };
    }
    if (Object.keys(m).length === 0) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `EMPTY_META_RECORD: ${key}` };
    }
    if (m.type === undefined) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `MISSING_META_TYPE: ${key}` };
    }
    if (!VALID_TYPES.has(m.type) || m.type === RESTRICTION_TYPE.NONE) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_META_TYPE: ${key}=${m.type}` };
    }
    if (m.scope === undefined) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `MISSING_META_SCOPE: ${key}` };
    }
    if (!VALID_SCOPES.has(m.scope)) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_META_SCOPE: ${key}=${m.scope}` };
    }
    const expectedScope = VALID_TYPE_SCOPE_MAP[m.type];
    if (m.scope !== expectedScope) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `TYPE_SCOPE_MISMATCH: ${key} type=${m.type} scope=${m.scope} expected=${expectedScope}` };
    }
    const effectiveLimit = m.limit !== undefined ? m.limit : m.maxLimit;
    if (effectiveLimit === undefined) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `MISSING_META_LIMIT: ${key}` };
    }
    if (typeof effectiveLimit !== 'number' || !Number.isSafeInteger(effectiveLimit) || effectiveLimit <= 0) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_META_LIMIT: ${key}` };
    }
    if (m.limit !== undefined && (typeof m.limit !== 'number' || !Number.isSafeInteger(m.limit) || m.limit <= 0)) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_META_LIMIT: ${key}` };
    }
    if (m.maxLimit !== undefined && (typeof m.maxLimit !== 'number' || !Number.isSafeInteger(m.maxLimit) || m.maxLimit <= 0)) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_META_LIMIT: ${key}` };
    }
    if (!isValidRestrictionKeyForScope(key, m.scope)) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESTRICTION_KEY: ${key}` };
    }
  }

  // Reservation Records Validation (meta._reservations)
  const activeRecordsByKey = {};
  if (meta._reservations !== undefined) {
    if (!isPlainObject(meta._reservations)) {
      return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_META: _reservations' };
    }
    for (const [resId, r] of Object.entries(meta._reservations)) {
      if (typeof resId !== 'string' || resId.trim() === '') {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_RESERVATION_ID' };
      }
      if (!isPlainObject(r)) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `MALFORMED_RESERVATION_RECORD: ${resId}` };
      }
      if (r.reservationId === undefined || typeof r.reservationId !== 'string') {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `MISSING_RESERVATION_ID: ${resId}` };
      }
      if (r.reservationId !== resId) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `RESERVATION_ID_MISMATCH: ${resId} !== ${r.reservationId}` };
      }
      if (!r.key || typeof r.key !== 'string') {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `MISSING_RESERVATION_KEY: ${resId}` };
      }
      if (!r.type || !VALID_TYPES.has(r.type) || r.type === RESTRICTION_TYPE.NONE) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESERVATION_TYPE: ${resId}` };
      }
      if (!r.scope || !VALID_SCOPES.has(r.scope)) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESERVATION_SCOPE: ${resId}` };
      }
      if (VALID_TYPE_SCOPE_MAP[r.type] !== r.scope) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `TYPE_SCOPE_MISMATCH: reservation ${resId}` };
      }
      if (!isValidRestrictionKeyForScope(r.key, r.scope)) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESERVATION_KEY: ${r.key}` };
      }
      if (typeof r.limit !== 'number' || !Number.isSafeInteger(r.limit) || r.limit <= 0) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESERVATION_LIMIT: ${resId}` };
      }
      if (r.generation === undefined || typeof r.generation !== 'number' || !Number.isSafeInteger(r.generation) || r.generation < 1) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_LIFECYCLE_GENERATION: ${resId}` };
      }

      // Generation check against current scope generation
      const currentScopeGen = (state.restrictions.generations && state.restrictions.generations[r.scope]) || 1;
      if (r.generation < currentScopeGen) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `STALE_RESERVATION_GENERATION: reservation ${resId} gen=${r.generation} current=${currentScopeGen}` };
      }
      if (r.generation > currentScopeGen) {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `FUTURE_RESERVATION_GENERATION: reservation ${resId} gen=${r.generation} current=${currentScopeGen}` };
      }

      // Explicit ACTIVE status requirement
      if (r.status !== 'ACTIVE') {
        return { valid: false, error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: `INVALID_RESERVATION_STATUS: ${resId}=${r.status}` };
      }

      // Check if active reservation contradicts existing ordinary restriction metadata
      if (meta[r.key]) {
        const ord = meta[r.key];
        const ordLimit = ord.limit !== undefined ? ord.limit : ord.maxLimit;
        if (ord.type !== r.type || ord.scope !== r.scope || (ordLimit !== undefined && ordLimit !== r.limit)) {
          return {
            valid: false,
            error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: `RESERVATION_META_CONTRADICTION: reservation ${resId} contradicts meta[${r.key}]`
          };
        }
      }

      activeRecordsByKey[r.key] = (activeRecordsByKey[r.key] || 0) + 1;
    }
  }

  // Cross-validation of active reservation records with reservations counter
  // Unconditionally executed (absent meta._reservations is treated as empty dictionary)
  const allReservationKeys = new Set([
    ...Object.keys(activeRecordsByKey),
    ...Object.keys(reservations || {})
  ]);

  for (const k of allReservationKeys) {
    const recordCount = activeRecordsByKey[k] || 0;
    const counterCount = reservations?.[k] || 0;
    if (recordCount !== counterCount) {
      return {
        valid: false,
        error: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
        reason: `RESERVATION_COUNT_MISMATCH: key=${k} recordCount=${recordCount} counterCount=${counterCount}`
      };
    }
  }

  return { valid: true };
}

/**
 * Initializes the authoritative restriction state on a game state if missing (undefined).
 * Does not overwrite or silently repair invalid existing state (e.g. null, arrays, class instances).
 * 
 * @param {object} state
 * @returns {object|null} Authoritative restrictions object or existing state value
 */
export function ensureRestrictionState(state) {
  if (!isPlainObject(state)) {
    throw new TypeError('Invalid state object provided to ensureRestrictionState');
  }

  if (state.restrictions === undefined) {
    state.restrictions = {
      counters: {},
      meta: {},
      reservations: {}
    };
  } else if (isPlainObject(state.restrictions)) {
    if (state.restrictions.counters === undefined) state.restrictions.counters = {};
    if (state.restrictions.meta === undefined) state.restrictions.meta = {};
    if (state.restrictions.reservations === undefined) state.restrictions.reservations = {};
  }

  if (state.abilityUses === undefined) {
    state.abilityUses = {};
  }

  return state.restrictions;
}

/**
 * Derives the deterministic storage key for an ability's restriction limit.
 * 
 * Key Templates:
 * - Ordinary OPT: turn:{turnNumber}:{player}:{placementId}:{physicalAbilityId}
 * - Same Name OPT: turn:{turnNumber}:{player}:same_name:{cardName}:{semanticAbilityId}
 * - Ordinary OPG: game:{player}:card:{cardId}:{physicalAbilityId}
 * - Same Name OPG: game:{player}:same_name:{cardName}:{semanticAbilityId}
 * - Step-scoped: step:{turnNumber}:{step}:{player}:{placementId}:{physicalAbilityId}
 * - Battle-scoped: battle:{turnNumber}:{combatId}:{player}:{placementId}:{physicalAbilityId}
 * - Attack-scoped: attack:{turnNumber}:{combatId}:{player}:{placementId}:{physicalAbilityId}
 * 
 * @param {object} state Game state
 * @param {object} ability Compiled ability AST
 * @param {object} context Resolution/activation context
 * @returns {{ valid: boolean, type: string, scope?: string, key?: string|null, error?: string }}
 */
export function buildRestrictionKey(state, ability, context = {}) {
  const rawLimit = ability?.header?.limit;
  const type = normalizeRestrictionType(rawLimit);

  if (type === RESTRICTION_TYPE.NONE) {
    return { valid: true, type: RESTRICTION_TYPE.NONE, key: null, scope: null, limit: Infinity };
  }

  if (type === RESTRICTION_TYPE.UNKNOWN) {
    return { valid: false, type: RESTRICTION_TYPE.UNKNOWN, error: RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION };
  }

  const maxLimit = ability?.header?.limitCount !== undefined ? ability.header.limitCount : 1;
  if (typeof maxLimit !== 'number' || !Number.isSafeInteger(maxLimit) || maxLimit <= 0) {
    return { valid: false, type: RESTRICTION_TYPE.UNKNOWN, error: RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION };
  }

  const player = context.controller || context.player || state?.activePlayer || 'player';
  const card = context.sourceCard || context.sourceStack?.top || null;
  const placementId = context.placementId || context.sourceStack?.placementId || card?.placementId || null;
  const physicalId = ability.physicalId || ability.id || null;
  const semanticId = ability.semanticId || null;
  const cardName = card?.name || context.cardName || null;
  const cardId = card?.id || context.cardId || null;
  const turnNumber = Number.isSafeInteger(state?.turnNumber) ? state.turnNumber : 1;

  switch (type) {
    case RESTRICTION_TYPE.ONCE_PER_TURN: {
      if (!physicalId || typeof physicalId !== 'string' || !placementId || typeof placementId !== 'string') {
        return { valid: false, type, error: RESTRICTION_STATUS.INVALID_IDENTITY };
      }
      return {
        valid: true,
        type,
        scope: RESTRICTION_SCOPE.TURN,
        key: `turn:${turnNumber}:${player}:${placementId}:${physicalId}`,
        limit: maxLimit
      };
    }

    case RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME: {
      if (!semanticId || typeof semanticId !== 'string' || !cardName || typeof cardName !== 'string') {
        return { valid: false, type, error: RESTRICTION_STATUS.INVALID_IDENTITY };
      }
      return {
        valid: true,
        type,
        scope: RESTRICTION_SCOPE.TURN,
        key: `turn:${turnNumber}:${player}:same_name:${cardName}:${semanticId}`,
        limit: maxLimit
      };
    }

    case RESTRICTION_TYPE.ONCE_PER_GAME: {
      if (!physicalId || typeof physicalId !== 'string' || !cardId || typeof cardId !== 'string') {
        return { valid: false, type, error: RESTRICTION_STATUS.INVALID_IDENTITY };
      }
      return {
        valid: true,
        type,
        scope: RESTRICTION_SCOPE.GAME,
        key: `game:${player}:card:${cardId}:${physicalId}`,
        limit: maxLimit
      };
    }

    case RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME: {
      if (!semanticId || typeof semanticId !== 'string' || !cardName || typeof cardName !== 'string') {
        return { valid: false, type, error: RESTRICTION_STATUS.INVALID_IDENTITY };
      }
      return {
        valid: true,
        type,
        scope: RESTRICTION_SCOPE.GAME,
        key: `game:${player}:same_name:${cardName}:${semanticId}`,
        limit: maxLimit
      };
    }

    case RESTRICTION_TYPE.ONCE_PER_STEP: {
      if (!physicalId || typeof physicalId !== 'string' || !placementId || typeof placementId !== 'string') {
        return { valid: false, type, error: RESTRICTION_STATUS.INVALID_IDENTITY };
      }
      const step = state?.step || 'MAIN';
      return {
        valid: true,
        type,
        scope: RESTRICTION_SCOPE.STEP,
        key: `step:${turnNumber}:${step}:${player}:${placementId}:${physicalId}`,
        limit: maxLimit
      };
    }

    case RESTRICTION_TYPE.ONCE_PER_BATTLE: {
      if (!physicalId || typeof physicalId !== 'string' || !placementId || typeof placementId !== 'string') {
        return { valid: false, type, error: RESTRICTION_STATUS.INVALID_IDENTITY };
      }
      const combatId = state?.combatId || (state?.combat ? 'active' : 'idle');
      return {
        valid: true,
        type,
        scope: RESTRICTION_SCOPE.BATTLE,
        key: `battle:${turnNumber}:${combatId}:${player}:${placementId}:${physicalId}`,
        limit: maxLimit
      };
    }

    case RESTRICTION_TYPE.ONCE_PER_ATTACK: {
      if (!physicalId || typeof physicalId !== 'string' || !placementId || typeof placementId !== 'string') {
        return { valid: false, type, error: RESTRICTION_STATUS.INVALID_IDENTITY };
      }
      const attackId = state?.combat?.attackerStackId || state?.combatId || 'attack';
      return {
        valid: true,
        type,
        scope: RESTRICTION_SCOPE.ATTACK,
        key: `attack:${turnNumber}:${attackId}:${player}:${placementId}:${physicalId}`,
        limit: maxLimit
      };
    }

    default:
      return { valid: false, type: RESTRICTION_TYPE.UNKNOWN, error: RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION };
  }
}

let _reservationCounter = 0;

/**
 * Safely inspects a property on an object without invoking user-defined getters or setters.
 * 
 * @param {object} obj
 * @param {string} prop
 * @returns {{ safe: boolean, exists?: boolean, value?: any, isAccessor?: boolean, reason?: string }}
 */
export function getSafeDataProperty(obj, prop) {
  if (!obj || typeof obj !== 'object') {
    return { safe: false, reason: 'NOT_AN_OBJECT' };
  }
  if (isProxy(obj)) {
    return { safe: false, reason: 'OBJECT_IS_PROXY' };
  }

  try {
    let current = obj;
    while (current) {
      if (isProxy(current)) {
        return { safe: false, reason: 'PROTOTYPE_IS_PROXY' };
      }
      const desc = Object.getOwnPropertyDescriptor(current, prop);
      if (desc) {
        if (desc.get !== undefined || desc.set !== undefined) {
          return { safe: false, isAccessor: true, reason: 'PROPERTY_IS_ACCESSOR' };
        }
        return { safe: true, exists: true, value: desc.value };
      }
      if (current === Object.prototype) break;
      current = Object.getPrototypeOf(current);
    }
    return { safe: true, exists: false, value: undefined };
  } catch {
    return { safe: false, reason: 'DESCRIPTOR_READ_EXCEPTION' };
  }
}

/**
 * Safely determines if a property on context can be assigned as a standard data property
 * without invoking accessors (getters or setters) or throwing due to frozen/sealed state,
 * non-extensibility, or non-writable descriptors.
 * 
 * Rejects:
 * - Accessor properties (getters or setters) on the object or its prototype chain.
 * - Non-writable data properties on the object or its prototype chain.
 * - Non-extensible objects if the property is not already an own writable data property.
 * - Proxies or objects that fail descriptor inspection.
 * 
 * @param {object} obj
 * @param {string} prop
 * @returns {boolean}
 */
export function isAssignableContextProperty(obj, prop) {
  if (isProxy(obj)) return false;
  if (!isPlainObject(obj)) return false;

  try {
    const ownDesc = Object.getOwnPropertyDescriptor(obj, prop);
    if (ownDesc) {
      // Reject any accessors (getters or setters). Must be a writable data property.
      if (ownDesc.get !== undefined || ownDesc.set !== undefined) return false;
      return ownDesc.writable === true;
    }

    // Property does not exist as own property: object must be extensible to accept new property
    if (!Object.isExtensible(obj)) return false;

    // Check prototype chain: reject if prototype has an accessor or non-writable property for prop
    let proto = Object.getPrototypeOf(obj);
    while (proto) {
      if (isProxy(proto)) return false;
      const pDesc = Object.getOwnPropertyDescriptor(proto, prop);
      if (pDesc) {
        if (pDesc.get !== undefined || pDesc.set !== undefined) return false;
        if (!pDesc.writable) return false;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Shared, strict helper to atomically finalize a capacity reservation record.
 * Supports both 'RELEASE' and 'COMMIT' actions.
 * 
 * Verifies 10 core integrity invariants before performing any state mutations:
 * 1. state.restrictions and meta._reservations are valid plain objects, and meta._reservations[reservationId] exists.
 * 2. rec is a valid plain object with status === 'ACTIVE'.
 * 3. rec.key is a non-empty string.
 * 4. rec.type, rec.scope, and rec.limit are valid per domain rules.
 * 5. rec.generation strictly matches current lifecycle generation, and expectedGen === null || expectedGen === rec.generation.
 * 6. state.restrictions.reservations is a plain object, and state.restrictions.reservations[rec.key] exists.
 * 7. state.restrictions.reservations[rec.key] is a finite positive integer (> 0).
 * 8. Active records count for rec.key across meta._reservations strictly equals state.restrictions.reservations[rec.key].
 * 9. The record being finalized is part of that active set.
 * 10. If meta[rec.key] exists, it does not contradict rec.
 * 
 * @param {object} state Game state
 * @param {string} reservationId
 * @param {'RELEASE'|'COMMIT'} action
 * @param {object} [context]
 * @param {object} [ability]
 * @param {number|null} [expectedGen]
 * @returns {{ success: boolean, status: string, key?: string|null, currentCount?: number, reason?: string }}
 */
export function _finalizeReservation(state, reservationId, action, context = {}, ability = null, expectedGen = null) {
  if (action !== 'RELEASE' && action !== 'COMMIT') {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_FINALIZATION_ACTION' };
  }

  // 1. Verify state and reservation record existence
  if (!isPlainObject(state) || !isPlainObject(state.restrictions)) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'STATE_NOT_OBJECT' };
  }

  const meta = state.restrictions.meta;
  if (!isPlainObject(meta) || !isPlainObject(meta._reservations) || !meta._reservations[reservationId]) {
    return { success: false, status: RESTRICTION_STATUS.RESERVATION_INVALIDATED, reason: 'RESERVATION_INVALIDATED' };
  }

  // 2. Verify record is plain object and ACTIVE
  const rec = meta._reservations[reservationId];
  if (!isPlainObject(rec) || rec.status !== 'ACTIVE') {
    return { success: false, status: RESTRICTION_STATUS.RESERVATION_INVALIDATED, reason: 'RESERVATION_INVALIDATED' };
  }

  // 3. Verify key is non-empty string
  if (typeof rec.key !== 'string' || rec.key.trim() === '') {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_RESERVATION_KEY' };
  }

  // 4. Verify type, scope, and limit
  if (!VALID_TYPES.has(rec.type) || rec.type === RESTRICTION_TYPE.NONE || rec.type === RESTRICTION_TYPE.UNKNOWN) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_RESERVATION_TYPE' };
  }
  if (!VALID_SCOPES.has(rec.scope)) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_SCOPE, reason: 'INVALID_RESERVATION_SCOPE' };
  }
  if (typeof rec.limit !== 'number' || !Number.isSafeInteger(rec.limit) || rec.limit <= 0) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_RESERVATION_LIMIT' };
  }

  // 5. Verify lifecycle generation
  const currentScopeGen = (state.restrictions.generations && state.restrictions.generations[rec.scope]) || 1;
  if (typeof rec.generation !== 'number' || !Number.isSafeInteger(rec.generation) || rec.generation !== currentScopeGen) {
    return { success: false, status: RESTRICTION_STATUS.RESERVATION_INVALIDATED, reason: 'RESERVATION_INVALIDATED' };
  }
  if (expectedGen !== null && (typeof expectedGen !== 'number' || !Number.isSafeInteger(expectedGen) || expectedGen !== currentScopeGen)) {
    return { success: false, status: RESTRICTION_STATUS.RESERVATION_INVALIDATED, reason: 'RESERVATION_INVALIDATED' };
  }

  // 6. Verify reservations counter object and existence
  if (!isPlainObject(state.restrictions.reservations) || state.restrictions.reservations[rec.key] === undefined) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'MISSING_RESERVATION_COUNTER' };
  }

  // 7. Verify reservations counter is a finite positive integer
  const counter = state.restrictions.reservations[rec.key];
  if (typeof counter !== 'number' || !Number.isSafeInteger(counter) || counter <= 0) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_RESERVATION_COUNTER' };
  }

  // 8 & 9. Cross-verify active records count for rec.key across meta._reservations
  let activeCountForKey = 0;
  for (const id of Object.keys(meta._reservations)) {
    const r = meta._reservations[id];
    if (isPlainObject(r) && r.status === 'ACTIVE' && r.key === rec.key) {
      activeCountForKey++;
    }
  }
  if (activeCountForKey !== counter) {
    return {
      success: false,
      status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
      reason: `RESERVATION_COUNT_MISMATCH: key=${rec.key} recordCount=${activeCountForKey} counterCount=${counter}`
    };
  }

  // 10. Check ordinary metadata contradiction
  if (meta[rec.key]) {
    const ord = meta[rec.key];
    if (!isPlainObject(ord)) {
      return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'INVALID_RESTRICTION_META' };
    }
    const ordLimit = ord.limit !== undefined ? ord.limit : ord.maxLimit;
    if (ord.type !== rec.type || ord.scope !== rec.scope || (ordLimit !== undefined && ordLimit !== rec.limit)) {
      return {
        success: false,
        status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
        reason: `RESERVATION_META_CONTRADICTION: reservation ${reservationId} contradicts meta[${rec.key}]`
      };
    }
  }

  // 11. Pre-mutation validation for COMMIT action
  let newCommitted = 1;
  let committedSet = null;
  let preparedCardId = null;
  const legacyMirrorKeys = [];

  if (action === 'COMMIT') {
    // 1. Validate counters container is a plain object
    if (!isPlainObject(state.restrictions.counters)) {
      return {
        success: false,
        status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
        reason: 'COUNTERS_NOT_OBJECT'
      };
    }

    // 2-4. Validate existing committed counter if present (or treat absent as 0)
    const rawPrev = state.restrictions.counters[rec.key];
    let prevCommitted = 0;
    if (rawPrev !== undefined) {
      if (
        typeof rawPrev !== 'number' ||
        !Number.isSafeInteger(rawPrev) ||
        rawPrev < 0
      ) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'INVALID_COMMITTED_COUNTER'
        };
      }
      prevCommitted = rawPrev;
    }

    // 5. Validate resulting committed count will remain a valid safe integer
    newCommitted = prevCommitted + 1;
    if (!Number.isSafeInteger(newCommitted) || newCommitted <= prevCommitted) {
      return {
        success: false,
        status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
        reason: 'INVALID_COMMITTED_COUNTER_OVERFLOW'
      };
    }

    // 6. Validate context structure if provided
    if (context !== null && context !== undefined) {
      if (isProxy(context)) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'CONTEXT_IS_PROXY'
        };
      }
      if (!isPlainObject(context)) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'INVALID_CONTEXT'
        };
      }

      // Check _committedKeys property safely without invoking getters
      const keysProp = getSafeDataProperty(context, '_committedKeys');
      if (!keysProp.safe) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'INVALID_CONTEXT_PROPERTY'
        };
      }

      if (keysProp.exists) {
        committedSet = keysProp.value;
        if (!committedSet || typeof committedSet !== 'object') {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'INVALID_COMMITTED_KEYS_CONTAINER'
          };
        }
        if (isProxy(committedSet)) {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'INVALID_COMMITTED_KEYS_CONTAINER'
          };
        }
        if (!(committedSet instanceof Set) || Object.prototype.toString.call(committedSet) !== '[object Set]') {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'INVALID_COMMITTED_KEYS_CONTAINER'
          };
        }
        if (Object.getPrototypeOf(committedSet) !== Set.prototype) {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'INVALID_COMMITTED_KEYS_CONTAINER'
          };
        }

        // Validate that no Set instance methods are overridden or custom accessors
        for (const method of ['has', 'add', 'delete', 'clear']) {
          const mDesc = Object.getOwnPropertyDescriptor(committedSet, method);
          if (mDesc) {
            return {
              success: false,
              status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
              reason: 'OVERRIDDEN_SET_METHOD'
            };
          }
        }
        if (committedSet.has !== Set.prototype.has || committedSet.add !== Set.prototype.add) {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'OVERRIDDEN_SET_METHOD'
          };
        }

        // Guard against duplicate commit in the same resolution context using safe intrinsic method
        let alreadyCommitted = false;
        try {
          alreadyCommitted = Set.prototype.has.call(committedSet, rec.key);
        } catch {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'SET_INTRINSIC_HAS_FAILED'
          };
        }

        if (alreadyCommitted) {
          return {
            success: false,
            status: RESTRICTION_STATUS.DUPLICATE_COMMIT,
            key: rec.key,
            currentCount: prevCommitted || 1,
            reason: 'DUPLICATE_COMMIT'
          };
        }
      } else {
        // _committedKeys will need to be created; verify context can accept the new property
        if (!isAssignableContextProperty(context, '_committedKeys')) {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'NON_EXTENSIBLE_CONTEXT'
          };
        }
      }

      // Verify isCommitted can be safely assigned without invoking setters
      if (!isAssignableContextProperty(context, 'isCommitted')) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'NON_WRITABLE_CONTEXT_PROPERTY'
        };
      }

      // Inspect sourceCard and sourceStack safely without invoking getters
      const sourceCardProp = getSafeDataProperty(context, 'sourceCard');
      if (!sourceCardProp.safe) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'INVALID_CONTEXT_PROPERTY'
        };
      }
      if (sourceCardProp.exists && sourceCardProp.value && typeof sourceCardProp.value === 'object') {
        const cardObj = sourceCardProp.value;
        if (isProxy(cardObj)) {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'INVALID_CONTEXT_PROPERTY'
          };
        }
        const idProp = getSafeDataProperty(cardObj, 'id');
        if (!idProp.safe) {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'INVALID_CONTEXT_PROPERTY'
          };
        }
        if (idProp.exists && typeof idProp.value === 'string' && idProp.value.trim() !== '') {
          preparedCardId = idProp.value;
        }
      }

      if (!preparedCardId) {
        const sourceStackProp = getSafeDataProperty(context, 'sourceStack');
        if (!sourceStackProp.safe) {
          return {
            success: false,
            status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
            reason: 'INVALID_CONTEXT_PROPERTY'
          };
        }
        if (sourceStackProp.exists && sourceStackProp.value && typeof sourceStackProp.value === 'object') {
          const stackObj = sourceStackProp.value;
          if (isProxy(stackObj)) {
            return {
              success: false,
              status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
              reason: 'INVALID_CONTEXT_PROPERTY'
            };
          }
          const topProp = getSafeDataProperty(stackObj, 'top');
          if (!topProp.safe) {
            return {
              success: false,
              status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
              reason: 'INVALID_CONTEXT_PROPERTY'
            };
          }
          if (topProp.exists && topProp.value && typeof topProp.value === 'object') {
            const topObj = topProp.value;
            if (isProxy(topObj)) {
              return {
                success: false,
                status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
                reason: 'INVALID_CONTEXT_PROPERTY'
              };
            }
            const topIdProp = getSafeDataProperty(topObj, 'id');
            if (!topIdProp.safe) {
              return {
                success: false,
                status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
                reason: 'INVALID_CONTEXT_PROPERTY'
              };
            }
            if (topIdProp.exists && typeof topIdProp.value === 'string' && topIdProp.value.trim() !== '') {
              preparedCardId = topIdProp.value;
            }
          }
        }
      }
    }

    // 7. Prepare legacy mirror keys and validate state.abilityUses
    const turn = (state && typeof state.turnNumber === 'number' && Number.isFinite(state.turnNumber)) ? state.turnNumber : 1;
    const canonId = ability ? (ability.physicalId || ability.id) : null;
    const legacyId = ability ? ability.legacyId : null;

    if (preparedCardId && canonId) {
      legacyMirrorKeys.push(`${turn}:${preparedCardId}:${canonId}`);
    }
    if (preparedCardId && legacyId) {
      legacyMirrorKeys.push(`${turn}:${preparedCardId}:${legacyId}`);
    }

    if (state.abilityUses !== undefined) {
      if (isProxy(state.abilityUses)) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'INVALID_ABILITY_USES'
        };
      }
      if (!isPlainObject(state.abilityUses)) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'INVALID_ABILITY_USES'
        };
      }
      if (!Object.isExtensible(state.abilityUses)) {
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          reason: 'INVALID_ABILITY_USES'
        };
      }
    }
  }

  // ALL PREFLIGHT CHECKS PASSED: Perform atomic state mutation

  // 1. Finalize reservation record and reservation counter
  delete meta._reservations[reservationId];
  if (Object.keys(meta._reservations).length === 0) {
    delete meta._reservations;
  }

  state.restrictions.reservations[rec.key] = counter - 1;
  if (state.restrictions.reservations[rec.key] === 0) {
    delete state.restrictions.reservations[rec.key];
  }

  if (action === 'RELEASE') {
    return {
      success: true,
      status: 'RELEASED',
      key: rec.key
    };
  }

  // 2. COMMIT: Increment committed counter and update metadata
  const turn = (state && typeof state.turnNumber === 'number' && Number.isFinite(state.turnNumber)) ? state.turnNumber : 1;
  state.restrictions.counters[rec.key] = newCommitted;

  state.restrictions.meta[rec.key] = {
    type: rec.type,
    scope: rec.scope,
    limit: rec.limit,
    lastTurn: turn,
    committedCount: newCommitted
  };

  // 3. Record committed key and commitment state using validated safe mechanism
  if (context !== null && context !== undefined) {
    let targetSet = committedSet;
    if (!targetSet) {
      targetSet = new Set();
      context._committedKeys = targetSet;
    }
    Set.prototype.add.call(targetSet, rec.key);
    context.isCommitted = true;
  }

  // 4. Synchronize prepared legacy mirror keys
  if (legacyMirrorKeys.length > 0) {
    if (!state.abilityUses) {
      state.abilityUses = {};
    }
    for (const lKey of legacyMirrorKeys) {
      state.abilityUses[lKey] = true;
    }
  }

  return {
    success: true,
    status: 'COMMITTED',
    key: rec.key,
    currentCount: newCommitted
  };
}

/**
 * Internal helper to atomically release a reservation record by its ID with strict lifecycle safety.
 * Used by both handle.release() and exported releaseReservation().
 * 
 * @param {object} state
 * @param {string} reservationId
 * @param {number} [expectedGen]
 * @returns {boolean} True if released; false if invalid, already finalized, or stale
 */
function _releaseReservationInternal(state, reservationId, expectedGen = null) {
  const res = _finalizeReservation(state, reservationId, 'RELEASE', null, null, expectedGen);
  return res.success;
}

/**
 * Evaluates whether an ability is currently permitted to activate under its restriction rules.
 * Factors in both committed counter values and active capacity reservations.
 * 
 * @param {object} state
 * @param {object} ability
 * @param {object} [context]
 * @returns {{ status: string, key?: string|null, currentCount?: number, limit?: number, reason?: string }}
 */
export function evaluateRestriction(state, ability, context = {}) {
  if (!state || typeof state !== 'object') {
    return { status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'STATE_NOT_OBJECT' };
  }

  ensureRestrictionState(state);

  const stateValidation = validateRestrictionState(state);
  if (!stateValidation.valid) {
    return { status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: stateValidation.reason };
  }

  const keyResult = buildRestrictionKey(state, ability, context);
  if (!keyResult.valid) {
    return { status: keyResult.error || RESTRICTION_STATUS.INVALID_IDENTITY, reason: keyResult.error };
  }

  // Unrestricted ability
  if (keyResult.type === RESTRICTION_TYPE.NONE || !keyResult.key) {
    return { status: RESTRICTION_STATUS.ALLOWED, key: null, currentCount: 0, limit: Infinity };
  }

  const committedCount = state.restrictions.counters[keyResult.key] || 0;
  const activeReservations = (state.restrictions.reservations && state.restrictions.reservations[keyResult.key]) || 0;
  const totalInFlight = committedCount + activeReservations;
  const maxLimit = keyResult.limit || 1;

  if (totalInFlight >= maxLimit) {
    return {
      status: RESTRICTION_STATUS.LIMIT_REACHED,
      key: keyResult.key,
      currentCount: committedCount,
      activeReservations,
      limit: maxLimit,
      reason: 'LIMIT_REACHED'
    };
  }

  return {
    status: RESTRICTION_STATUS.ALLOWED,
    key: keyResult.key,
    currentCount: committedCount,
    activeReservations,
    limit: maxLimit
  };
}

/**
 * Atomically reserves capacity for an ability activation before asynchronous cost payment or prompts.
 * Prevents concurrent activation race conditions from paying duplicate costs.
 * 
 * @param {object} state
 * @param {object} ability
 * @param {object} [context]
 * @returns {{ success: boolean, status: string, key?: string|null, reservationId?: string|null, limit?: number, release: Function, commit: Function, reason?: string }}
 */
export function reserveRestriction(state, ability, context = {}) {
  if (!isPlainObject(state)) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'STATE_NOT_OBJECT' };
  }

  ensureRestrictionState(state);

  const stateValidation = validateRestrictionState(state);
  if (!stateValidation.valid) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: stateValidation.reason };
  }

  const keyResult = buildRestrictionKey(state, ability, context);
  if (!keyResult.valid) {
    return { success: false, status: keyResult.error || RESTRICTION_STATUS.INVALID_IDENTITY, reason: keyResult.error };
  }

  // Unrestricted ability
  if (keyResult.type === RESTRICTION_TYPE.NONE || !keyResult.key) {
    return {
      success: true,
      status: RESTRICTION_STATUS.ALLOWED,
      key: null,
      type: RESTRICTION_TYPE.NONE,
      scope: null,
      limit: Infinity,
      reservationId: null,
      release: () => {},
      commit: () => ({ success: true, status: 'COMMITTED', key: null, currentCount: 0 })
    };
  }

  const key = keyResult.key;
  const committedCount = state.restrictions.counters[key] || 0;
  const activeReservations = (state.restrictions.reservations && state.restrictions.reservations[key]) || 0;
  const totalInFlight = committedCount + activeReservations;
  const maxLimit = keyResult.limit || 1;

  if (totalInFlight >= maxLimit) {
    return {
      success: false,
      status: RESTRICTION_STATUS.LIMIT_REACHED,
      key,
      currentCount: committedCount,
      activeReservations,
      limit: maxLimit,
      reason: 'LIMIT_REACHED'
    };
  }

  // Atomically increment active reservations
  if (!state.restrictions.reservations) {
    state.restrictions.reservations = {};
  }
  state.restrictions.reservations[key] = activeReservations + 1;

  if (!state.restrictions.meta._reservations) {
    state.restrictions.meta._reservations = {};
  }
  if (!state.restrictions.generations) {
    state.restrictions.generations = {
      TURN: 1,
      STEP: 1,
      BATTLE: 1,
      ATTACK: 1,
      GAME: 1
    };
  }
  if (state.restrictions.generations[keyResult.scope] === undefined) {
    state.restrictions.generations[keyResult.scope] = 1;
  }
  if (_reservationCounter >= Number.MAX_SAFE_INTEGER) {
    _reservationCounter = 0;
  }
  const reservationId = `res_${Date.now()}_${++_reservationCounter}_${Math.random().toString(36).substr(2, 5)}`;
  const currentGen = (state.restrictions.generations && state.restrictions.generations[keyResult.scope]) || 1;
  state.restrictions.meta._reservations[reservationId] = {
    reservationId,
    key,
    type: keyResult.type,
    scope: keyResult.scope,
    limit: maxLimit,
    generation: currentGen,
    status: 'ACTIVE',
    createdAt: Date.now()
  };

  let finalized = false;
  let isInvalidated = false;

  const handle = {
    success: true,
    status: RESTRICTION_STATUS.ALLOWED,
    key,
    type: keyResult.type,
    scope: keyResult.scope,
    limit: maxLimit,
    reservationId,
    generation: currentGen,
    get isInvalidated() {
      if (isInvalidated) return true;
      const gen = (state.restrictions?.generations && state.restrictions.generations[keyResult.scope]) || 1;
      const rec = state.restrictions?.meta?._reservations?.[reservationId];
      if (gen !== currentGen || !rec || rec.status !== 'ACTIVE' || rec.generation !== currentGen) {
        isInvalidated = true;
        return true;
      }
      return false;
    },
    release: () => {
      try {
        if (finalized) return false;
        finalized = true;

        const res = _finalizeReservation(state, reservationId, 'RELEASE', null, null, currentGen);
        if (!res.success) {
          isInvalidated = true;
        }
        return res.success;
      } catch {
        isInvalidated = true;
        return false;
      }
    },
    commit: (callContext) => {
      try {
        if (finalized) {
          return {
            success: false,
            status: RESTRICTION_STATUS.DUPLICATE_COMMIT,
            key,
            currentCount: state.restrictions?.counters?.[key] || 1,
            reason: 'DUPLICATE_COMMIT'
          };
        }
        finalized = true;

        const effectiveContext = callContext !== undefined ? callContext : context;
        const res = _finalizeReservation(state, reservationId, 'COMMIT', effectiveContext, ability, currentGen);
        if (!res.success) {
          isInvalidated = true;
        }
        return res;
      } catch (err) {
        isInvalidated = true;
        return {
          success: false,
          status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
          key,
          reason: `COMMIT_EXCEPTION: ${err?.message || String(err)}`
        };
      }
    }
  };

  return handle;
}

/**
 * Releases a capacity reservation by its reservationId.
 * Lifecycle-safe: verifies that the reservation exists, is active, and matches current lifecycle generation.
 * If the reservation is stale or expired, it does not decrement any counter and returns false.
 * 
 * @param {object} state
 * @param {string} reservationId
 * @returns {boolean} True if successfully released, false otherwise.
 */
export function releaseReservation(state, reservationId) {
  if (typeof reservationId !== 'string' || reservationId.trim() === '') {
    return false;
  }
  return _releaseReservationInternal(state, reservationId);
}

/**
 * Atomically commits the activation of an ability, consuming its restriction limit.
 * 
 * Stage 4 Atomic Commit:
 * - Enforces that pre-commit failures (condition FALSE, optional declined, cost unpaid, target cancelled) do not consume.
 * - Consumes exactly once per activation instance.
 * - Synchronously check-and-increments to prevent race conditions in concurrent activations.
 * - Synchronizes the legacy `state.abilityUses` compatibility mirror.
 * - Guards against duplicate commit callbacks within the same context.
 * 
 * @param {object} state
 * @param {object} ability
 * @param {object} context
 * @returns {{ success: boolean, status: string, key?: string|null, currentCount?: number, reason?: string }}
 */
export function commitRestriction(state, ability, context = {}) {
  if (!isPlainObject(state)) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'STATE_NOT_OBJECT' };
  }

  ensureRestrictionState(state);

  const stateValidation = validateRestrictionState(state);
  if (!stateValidation.valid) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: stateValidation.reason };
  }

  // If a reservation handle was passed on context, delegate to it
  if (context.reservation && typeof context.reservation.commit === 'function') {
    return context.reservation.commit();
  }

  const keyResult = buildRestrictionKey(state, ability, context);
  if (!keyResult.valid) {
    return { success: false, status: keyResult.error || RESTRICTION_STATUS.INVALID_IDENTITY, reason: keyResult.error };
  }

  if (keyResult.type === RESTRICTION_TYPE.NONE || !keyResult.key) {
    return { success: true, status: 'COMMITTED', key: null, currentCount: 0 };
  }

  // Guard against duplicate commit in the same resolution context
  if (context._committedKeys && context._committedKeys.has(keyResult.key)) {
    return {
      success: false,
      status: RESTRICTION_STATUS.DUPLICATE_COMMIT,
      key: keyResult.key,
      currentCount: state.restrictions.counters[keyResult.key] || 1,
      reason: 'DUPLICATE_COMMIT'
    };
  }

  const currentCount = state.restrictions.counters[keyResult.key] || 0;
  const activeReservations = (state.restrictions.reservations && state.restrictions.reservations[keyResult.key]) || 0;
  const maxLimit = keyResult.limit || 1;

  if (currentCount + activeReservations >= maxLimit) {
    return {
      success: false,
      status: RESTRICTION_STATUS.LIMIT_REACHED,
      key: keyResult.key,
      currentCount,
      limit: maxLimit,
      reason: 'LIMIT_REACHED'
    };
  }

  // Synchronous atomic check-and-increment
  const newCount = currentCount + 1;
  state.restrictions.counters[keyResult.key] = newCount;
  state.restrictions.meta[keyResult.key] = {
    type: keyResult.type,
    scope: keyResult.scope,
    limit: maxLimit,
    lastTurn: state.turnNumber || 1,
    committedCount: newCount
  };

  // Mark context as committed
  if (context && typeof context === 'object') {
    if (!context._committedKeys) {
      context._committedKeys = new Set();
    }
    Set.prototype.add.call(context._committedKeys, keyResult.key);
    context.isCommitted = true;
  }

  // Synchronize legacy abilityUses mirror without double-counting
  const cardId = context.sourceCard?.id || context.sourceStack?.top?.id;
  const turn = state.turnNumber || 1;
  const canonId = ability.physicalId || ability.id;

  if (cardId && canonId) {
    state.abilityUses[`${turn}:${cardId}:${canonId}`] = true;
  }
  if (cardId && ability.legacyId) {
    state.abilityUses[`${turn}:${cardId}:${ability.legacyId}`] = true;
  }

  return {
    success: true,
    status: 'COMMITTED',
    key: keyResult.key,
    currentCount: newCount
  };
}

/**
 * Resets restriction counters and capacity reservations according to lifecycle boundary scope.
 * 
 * Supported Scopes:
 * - TURN: Resets turn-scoped (turn:*), step-scoped (step:*), battle-scoped (battle:*), and attack-scoped (attack:*).
 *         Preserves game-scoped (game:*) counters 100% intact!
 * - STEP: Resets step-scoped (step:*) counters.
 * - BATTLE: Resets battle-scoped (battle:*) counters.
 * - ATTACK: Resets attack-scoped (attack:*) counters.
 * 
 * @param {object} state
 * @param {string} scope Lifecycle transition scope ('TURN'|'STEP'|'BATTLE'|'ATTACK')
 * @param {object} [options]
 */
export function resetRestrictions(state, scope, options = {}) {
  if (!state || typeof state !== 'object' || !state.restrictions || !state.restrictions.counters) {
    return;
  }

  const counters = state.restrictions.counters;
  const meta = state.restrictions.meta || {};
  const reservations = state.restrictions.reservations || {};
  const normalizedScope = String(scope || '').toUpperCase();

  const shouldResetKey = (key) => {
    if (normalizedScope === RESTRICTION_SCOPE.TURN) {
      return (
        key.startsWith('turn:') ||
        key.startsWith('step:') ||
        key.startsWith('battle:') ||
        key.startsWith('attack:')
      );
    }
    if (normalizedScope === RESTRICTION_SCOPE.STEP) return key.startsWith('step:');
    if (normalizedScope === RESTRICTION_SCOPE.BATTLE) return key.startsWith('battle:');
    if (normalizedScope === RESTRICTION_SCOPE.ATTACK) return key.startsWith('attack:');
    return false;
  };

  for (const key of Object.keys(counters)) {
    if (shouldResetKey(key)) {
      delete counters[key];
      delete meta[key];
    }
  }

  for (const key of Object.keys(reservations)) {
    if (shouldResetKey(key)) {
      delete reservations[key];
    }
  }

  if (meta._reservations) {
    for (const [resId, r] of Object.entries(meta._reservations)) {
      if (r?.key && shouldResetKey(r.key)) {
        delete meta._reservations[resId];
      }
    }
    if (Object.keys(meta._reservations).length === 0) {
      delete meta._reservations;
    }
  }

  // Lifecycle generation advance for deterministic invalidation of stale reservation handles
  if (!state.restrictions.generations) {
    state.restrictions.generations = {
      TURN: 1,
      STEP: 1,
      BATTLE: 1,
      ATTACK: 1,
      GAME: 1
    };
  }

  if (normalizedScope === RESTRICTION_SCOPE.TURN) {
    state.restrictions.generations.TURN = (state.restrictions.generations.TURN || 1) + 1;
    state.restrictions.generations.STEP = (state.restrictions.generations.STEP || 1) + 1;
    state.restrictions.generations.BATTLE = (state.restrictions.generations.BATTLE || 1) + 1;
    state.restrictions.generations.ATTACK = (state.restrictions.generations.ATTACK || 1) + 1;
  } else if (normalizedScope === RESTRICTION_SCOPE.STEP) {
    state.restrictions.generations.STEP = (state.restrictions.generations.STEP || 1) + 1;
  } else if (normalizedScope === RESTRICTION_SCOPE.BATTLE) {
    state.restrictions.generations.BATTLE = (state.restrictions.generations.BATTLE || 1) + 1;
  } else if (normalizedScope === RESTRICTION_SCOPE.ATTACK) {
    state.restrictions.generations.ATTACK = (state.restrictions.generations.ATTACK || 1) + 1;
  }

  if (normalizedScope === RESTRICTION_SCOPE.TURN) {
    // Synchronize legacy abilityUses mirror reset
    state.abilityUses = {};
  }
}

/**
 * Synchronizes legacy abilityUses dictionary into authoritative state.restrictions.
 * Used during legacy state import.
 * 
 * @param {object} state
 */
export function syncLegacyToRestrictions(state) {
  if (!state || !isPlainObject(state)) return;
  ensureRestrictionState(state);
  if (!state.abilityUses || typeof state.abilityUses !== 'object') return;

  for (const legacyKey of Object.keys(state.abilityUses)) {
    if (!state.abilityUses[legacyKey]) continue;

    // Format 1: `${turn}:${cardId}:${abilityId}`
    if (legacyKey.includes(':')) {
      const parts = legacyKey.split(':');
      if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
        const turn = parts[0];
        const cardId = parts[1];
        const abilityId = parts.slice(2).join(':');
        const mappedKey = `turn:${turn}:legacy:${cardId}:${abilityId}`;
        if (!state.restrictions.counters[mappedKey]) {
          state.restrictions.counters[mappedKey] = 1;
          state.restrictions.meta[mappedKey] = { type: RESTRICTION_TYPE.ONCE_PER_TURN, limit: 1, scope: RESTRICTION_SCOPE.TURN };
        }
        continue;
      }
    }

    // Format 2: `${cardId}_${abilityId}`
    if (legacyKey.includes('_')) {
      const parts = legacyKey.split('_');
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const cardId = parts[0];
        const abilityId = parts.slice(1).join('_');
        const turn = state.turnNumber || 1;
        const mappedKey = `turn:${turn}:legacy:${cardId}:${abilityId}`;
        if (!state.restrictions.counters[mappedKey]) {
          state.restrictions.counters[mappedKey] = 1;
          state.restrictions.meta[mappedKey] = { type: RESTRICTION_TYPE.ONCE_PER_TURN, limit: 1, scope: RESTRICTION_SCOPE.TURN };
        }
        continue;
      }
    }

    // Ambiguous legacy key format: isolate safely in metadata without creating a modern restriction key
    if (!state.restrictions.meta._ambiguousLegacy) {
      state.restrictions.meta._ambiguousLegacy = {};
    }
    state.restrictions.meta._ambiguousLegacy[legacyKey] = state.abilityUses[legacyKey];
  }
}

/**
 * Restores and sanitizes restriction state on game restoration (save/load).
 * Implements Option B (Invalidate Transient Reservations):
 * - Validates structural and semantic restriction integrity before any mutation.
 * - Rejects malformed or contradictory state safely, preserving input invariance on error.
 * - Preserves committed activation counters and restriction metadata 100% intact.
 * - Invalidates transient reservation records and active reservation counters.
 * - Advances lifecycle generations for affected scopes so stale pre-save handles cannot affect restored state.
 * 
 * @param {object} state
 * @returns {{ success: boolean, status: string, invalidatedReservationsCount?: number, reason?: string }}
 */
export function restoreRestrictionState(state) {
  if (!isPlainObject(state)) {
    return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: 'STATE_NOT_OBJECT' };
  }

  // 1. Pre-validation of structural and semantic restriction integrity
  // Validate BEFORE calling ensureRestrictionState to guarantee zero state mutation on failure!
  if (state.restrictions !== undefined) {
    const validation = validateRestrictionState(state);
    if (!validation.valid) {
      return { success: false, status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE, reason: validation.reason };
    }
  }

  const { meta, reservations, generations } = state.restrictions || {};

  // 2. Identify scopes with active reservations to invalidate (pure read-only inspection)
  const activeScopes = new Set();
  let invalidatedCount = 0;

  if (meta && isPlainObject(meta._reservations)) {
    for (const [resId, rec] of Object.entries(meta._reservations)) {
      if (isPlainObject(rec) && rec.status === 'ACTIVE') {
        invalidatedCount++;
        if (rec.scope && VALID_SCOPES.has(rec.scope)) {
          activeScopes.add(rec.scope);
        }
      }
    }
  }

  // Also check keys in reservations counter object
  if (reservations && isPlainObject(reservations)) {
    for (const [key, count] of Object.entries(reservations)) {
      if (typeof count === 'number' && count > 0) {
        for (const scope of VALID_SCOPES) {
          if (isValidRestrictionKeyForScope(key, scope)) {
            activeScopes.add(scope);
          }
        }
      }
    }
  }

  // 3. Overflow pre-check for generation advancement BEFORE ANY MUTATION
  // For every scope that will be advanced, verify that currentGen + 1 is a distinct safe integer
  for (const scope of activeScopes) {
    const currentGen = (generations && generations[scope] !== undefined) ? generations[scope] : 1;
    if (typeof currentGen !== 'number' || !Number.isSafeInteger(currentGen) || currentGen < 1) {
      return {
        success: false,
        status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
        reason: `INVALID_LIFECYCLE_GENERATION: ${scope}=${currentGen}`
      };
    }
    const nextGen = currentGen + 1;
    if (!Number.isSafeInteger(nextGen) || nextGen <= currentGen) {
      return {
        success: false,
        status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
        reason: `GENERATION_OVERFLOW: ${scope}`
      };
    }
  }

  // 4. Safe State Mutation (guaranteed atomicity after all pre-checks pass)
  ensureRestrictionState(state);

  if (!state.restrictions.generations || !isPlainObject(state.restrictions.generations)) {
    state.restrictions.generations = {
      TURN: 1,
      STEP: 1,
      BATTLE: 1,
      ATTACK: 1,
      GAME: 1
    };
  }

  for (const scope of VALID_SCOPES) {
    if (state.restrictions.generations[scope] === undefined) {
      state.restrictions.generations[scope] = 1;
    }
    if (activeScopes.has(scope)) {
      state.restrictions.generations[scope] += 1;
    }
  }

  // 5. Invalidate transient reservation records and counters
  if (state.restrictions.meta && isPlainObject(state.restrictions.meta._reservations)) {
    state.restrictions.meta._reservations = {};
  }
  if (state.restrictions.reservations && isPlainObject(state.restrictions.reservations)) {
    state.restrictions.reservations = {};
  }

  return {
    success: true,
    status: RESTRICTION_STATUS.ALLOWED,
    invalidatedReservationsCount: invalidatedCount
  };
}
