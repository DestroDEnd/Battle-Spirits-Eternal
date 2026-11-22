/**
 * engine/conditions.js
 *
 * Structured Condition Representation, Shared Condition Primitives,
 * and Deterministic Evaluator (TRUE | FALSE | UNSUPPORTED).
 */

import { computeEffectiveBP } from './continuous.js';
import { hasTeam, extractCardTeams } from './prerequisites.js';

export const CONDITION_RESULT = {
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  UNSUPPORTED: 'UNSUPPORTED',
  INVALID_CONTEXT: 'INVALID_CONTEXT'
};

export const CONDITION_TYPES = {
  CONTROL_CARD: 'CONTROL_CARD',
  COUNTER_THRESHOLD: 'COUNTER_THRESHOLD',
  SOUL_CORE_ON_SPIRIT: 'SOUL_CORE_ON_SPIRIT',
  BURST_OR_MIRAGE_SET: 'BURST_OR_MIRAGE_SET',
  LIFE_THRESHOLD: 'LIFE_THRESHOLD',
  BATTLING_STATE: 'BATTLING_STATE',
  BP_ZERO: 'BP_ZERO',
  SOUL_STATE: 'SOUL_STATE',
  TURN_STEP_STATE: 'TURN_STEP_STATE',
  COLOR_SYMBOL: 'COLOR_SYMBOL',
  HAND_SIZE_THRESHOLD: 'HAND_SIZE_THRESHOLD',
  CARD_ZONE_STATE: 'CARD_ZONE_STATE',
  TURN_HISTORY: 'TURN_HISTORY',
  CARD_RESULT: 'CARD_RESULT',
  FIELD_COMPOSITION: 'FIELD_COMPOSITION',
  BRAVE_STACK_STATE: 'BRAVE_STACK_STATE',
  PREVIOUS_OP_SUCCESS: 'PREVIOUS_OP_SUCCESS',
  RESERVE_CORE_THRESHOLD: 'RESERVE_CORE_THRESHOLD',
  STACK_STATE: 'STACK_STATE',
  ATTACKING_OR_BLOCKING_SPIRIT: 'ATTACKING_OR_BLOCKING_SPIRIT',
  ZONE_CARD_COUNT: 'ZONE_CARD_COUNT',
  SPIRIT_STAT_THRESHOLD: 'SPIRIT_STAT_THRESHOLD',
  SOUL_CORE_LOCATION: 'SOUL_CORE_LOCATION',
  TEAM_PRESENCE: 'TEAM_PRESENCE',
  PRE_ADVENT_CARD: 'PRE_ADVENT_CARD',
  ACTIVATION_ORIGIN: 'ACTIVATION_ORIGIN',
  OP_RULE_CONDITION: 'OP_RULE_CONDITION',
  COMPOUND: 'COMPOUND',
  LEGACY_CONTEXT_CONDITION: 'LEGACY_CONTEXT_CONDITION'
};

const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
};

export function parseConditionNumber(token) {
  if (typeof token === 'number' && Number.isFinite(token)) return token;
  const raw = String(token || '').trim().toLowerCase();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);
  if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, raw)) return NUMBER_WORDS[raw];
  return null;
}

// ============================================================================
// Shared Condition Primitives
// ============================================================================

export function compareNumeric(actual, operator, expected) {
  if (typeof actual !== 'number' || !Number.isFinite(actual)) return false;
  if (typeof expected !== 'number' || !Number.isFinite(expected)) return false;
  switch (operator) {
    case 'EQ': return actual === expected;
    case 'GT': return actual > expected;
    case 'GTE': return actual >= expected;
    case 'LT': return actual < expected;
    case 'LTE': return actual <= expected;
    default: return false;
  }
}

export function resolveTargetSides(side = 'self', context = null) {
  const controller = (context && context.controller) || 'player';
  const oppSide = controller === 'player' ? 'opponent' : 'player';
  if (side === 'both') return ['player', 'opponent'];
  if (side === 'opponent' || side === 'opp') return [oppSide];
  if (side === 'player') return ['player'];
  return [controller];
}

export function getStackController(stack, fallbackSide) {
  return (stack && (stack.owner || stack.top?.currentOwner || stack.top?.owner)) || fallbackSide;
}

export function cardMatchesType(card, targetType) {
  if (!card || !targetType) return false;
  const t = String(card.type || '').toLowerCase();
  const want = String(targetType).toLowerCase();
  if (want === 'spirit') return t === 'spirit' || t.includes('spirit');
  if (want === 'ultimate') return t === 'ultimate' || t.includes('ultimate');
  if (want === 'nexus') return t === 'nexus' || t.includes('nexus');
  if (want === 'grandwalker nexus') {
    const fams = Array.isArray(card.families) ? card.families : (card.family ? [card.family] : []);
    return t.includes('nexus') && (t.includes('grandwalker') || fams.some(f => String(f).toLowerCase().includes('grandwalker')));
  }
  if (want === 'brave') return t === 'brave' || t.includes('brave');
  return t === want;
}

export function cardMatchesFamily(card, family) {
  if (!card || !family) return false;
  const want = String(family).toLowerCase();
  const fams = Array.isArray(card.families)
    ? card.families
    : (card.family ? [card.family] : []);
  return fams.some(f => String(f || '').toLowerCase() === want || String(f || '').toLowerCase().includes(want));
}

export function cardMatchesName(card, nameQuery, exact = false) {
  if (!card || !nameQuery) return false;
  const actual = String(card.name || '').toLowerCase();
  const want = String(nameQuery).toLowerCase();
  return exact ? actual === want : actual.includes(want);
}

export function cardMatchesColor(card, color) {
  if (!card || !color) return false;
  const want = String(color).toLowerCase();
  const cols = Array.isArray(card.colors) ? card.colors : (card.color ? [card.color] : []);
  return cols.some(c => String(c || '').toLowerCase() === want);
}

export function cardHasKeyword(card, stack, keyword) {
  if (!card || !keyword) return false;
  const want = String(keyword).trim().toLowerCase();
  if (want === 'during advent' && stack && Array.isArray(stack.under) && stack.under.length > 0) return true;
  const kws = Array.isArray(card.keywords) ? card.keywords : [];
  if (kws.some(k => String(typeof k === 'string' ? k : k?.name || '').toLowerCase() === want)) return true;
  const irKws = Array.isArray(card.compiledIr?.keywords) ? card.compiledIr.keywords : [];
  if (irKws.some(k => String(typeof k === 'string' ? k : k?.name || '').toLowerCase() === want)) return true;
  return String(card.effect || '').toLowerCase().includes(`[${want}]`);
}

function getCardSymbolCount(card, colorFilter = null) {
  if (!card) return 0;
  const want = colorFilter ? String(colorFilter).toLowerCase() : null;
  if (Array.isArray(card.symbols) && card.symbols.length > 0) {
    return want ? card.symbols.filter(s => String(s || '').toLowerCase() === want).length : card.symbols.length;
  }
  if (card.symbols && typeof card.symbols === 'object' && !Array.isArray(card.symbols) && Object.keys(card.symbols).length > 0) {
    let sum = 0;
    for (const [k, v] of Object.entries(card.symbols)) {
      if (typeof v === 'number' && (!want || String(k).toLowerCase() === want)) sum += v;
    }
    return sum;
  }
  return (!want || cardMatchesColor(card, want)) ? 1 : 0;
}

export function cardMatchesFilterSpec(card, stack = null, filter = {}, state = null, context = null) {
  if (!card) return false;
  if (filter.excludeSelf) {
    const srcCard = context?.sourceCard || context?.sourceStack?.top || null;
    if (stack && context?.sourceStack && (stack === context.sourceStack || (stack.id && stack.id === context.sourceStack.id))) return false;
    if (srcCard && card.id && srcCard.id === card.id) return false;
  }
  if (filter.cardType && !cardMatchesType(card, filter.cardType)) return false;
  if (filter.excludeCardType && cardMatchesType(card, filter.excludeCardType)) return false;
  if (filter.sagaBrave && !(card.isSaga || /saga/i.test(String(card.subType || card.type || '')) || cardMatchesFamily(card, 'Saga') || cardHasKeyword(card, stack, 'Saga'))) {
    return false;
  }
  if (Array.isArray(filter.cardTypes) && filter.cardTypes.length > 0) {
    if (!filter.cardTypes.some(t => cardMatchesType(card, t))) return false;
  }
  if (filter.isBraveSpirit && !(stack && Array.isArray(stack.braves) && stack.braves.length > 0)) return false;
  if (filter.family && !cardMatchesFamily(card, filter.family)) return false;
  if (filter.secondFamily && !cardMatchesFamily(card, filter.secondFamily)) return false;
  if (Array.isArray(filter.families) && filter.families.length > 0) {
    if (!filter.families.some(f => cardMatchesFamily(card, f))) return false;
  }
  if (filter.name && !cardMatchesName(card, filter.name, Boolean(filter.exactName))) return false;
  if (Array.isArray(filter.names) && filter.names.length > 0) {
    if (!filter.names.some(n => cardMatchesName(card, n, Boolean(filter.exactName)))) return false;
  }
  if (filter.team && !hasTeam(card, filter.team, state, stack)) return false;
  if (Array.isArray(filter.teams) && filter.teams.length > 0) {
    if (!filter.teams.some(tm => hasTeam(card, tm, state, stack))) return false;
  }
  if (filter.hasTiming) {
    const abs = card.compiledIr?.abilities || card.abilities || [];
    const wantTiming = String(filter.hasTiming).toUpperCase();
    const hasT = abs.some(ab => ab?.header?.timing === wantTiming || (ab?.header?.timings || []).includes(wantTiming));
    if (!hasT) return false;
  }
  if (filter.bravedWithFamily) {
    const braves = Array.isArray(stack?.braves) ? stack.braves : [];
    if (!braves.some(b => cardMatchesFamily(b, filter.bravedWithFamily))) return false;
  }
  if (filter.color && !cardMatchesColor(card, filter.color)) return false;
  if (Array.isArray(filter.colors) && filter.colors.length > 0) {
    if (!filter.colors.some(c => cardMatchesColor(card, c))) return false;
  }
  if (filter.singleColorOnly) {
    const cols = Array.isArray(card.colors) ? card.colors : (card.color ? [card.color] : []);
    if (cols.length !== 1) return false;
  }
  if (filter.keyword && !cardHasKeyword(card, stack, filter.keyword)) return false;
  if (Array.isArray(filter.keywords) && filter.keywords.length > 0) {
    if (!filter.keywords.some(kw => cardHasKeyword(card, stack, kw))) return false;
  }
  if (filter.noPrintedEffects && String(card.effect || '').trim().length > 0) return false;
  const cost = Number(card.cost ?? 0);
  if (typeof filter.costGte === 'number' && cost < filter.costGte) return false;
  if (typeof filter.costLte === 'number' && cost > filter.costLte) return false;
  if (Array.isArray(filter.allowedCosts) && !filter.allowedCosts.includes(cost)) return false;
  if (typeof filter.bpGte === 'number' || typeof filter.bpLte === 'number') {
    const bp = (state && stack?.top) ? computeEffectiveBP(state, stack) : Number(card.bp ?? 0);
    if (typeof filter.bpGte === 'number' && bp < filter.bpGte) return false;
    if (typeof filter.bpLte === 'number' && bp > filter.bpLte) return false;
  }
  if (typeof filter.minSymbols === 'number' && getCardSymbolCount(card) < filter.minSymbols) return false;
  if (filter.hasTeam && extractCardTeams(card, state, stack).length === 0) return false;
  if (typeof filter.minBraves === 'number' && (!Array.isArray(stack?.braves) || stack.braves.length < filter.minBraves)) return false;
  if (filter.isFaceUp && !(card.faceUp === true || card.revealed === true)) return false;
  if (filter.contractSpirit && !(card.isContract || /contract/i.test(String(card.subType || card.type || '')) || cardMatchesFamily(card, 'Contract') || cardHasKeyword(card, stack, 'Contract Field') || /Contract Spirit|Partner/i.test(String(card.name || '')))) return false;
  if (filter.stackState === 'EXHAUSTED' && stack && stack.state !== 'EXHAUSTED' && stack.state !== 'HEAVY_EXHAUSTED') return false;
  if (filter.stackState === 'REFRESHED' && stack && stack.state !== 'REFRESHED') return false;
  return true;
}

export function countControlledMatchingCards(state, side, filter = {}, context = null) {
  const sides = resolveTargetSides(side, context);
  let count = 0;
  for (const s of sides) {
    const p = state?.players?.[s];
    if (!p || !Array.isArray(p.field)) return null;
    for (const stack of p.field) {
      if (!stack || !stack.top) continue;
      // Distinguish control (stack.owner / currentOwner) from original printed owner
      const stackCtrl = getStackController(stack, s);
      if (stackCtrl !== s) continue;
      if (cardMatchesFilterSpec(stack.top, stack, filter, state, context)) {
        count++;
      }
      if (filter.includeAttachedBraves && Array.isArray(stack.braves)) {
        for (const braveCard of stack.braves) {
          if (braveCard && cardMatchesFilterSpec(braveCard, stack, filter, state, context)) {
            count++;
          }
        }
      }
    }
    const wantsNexus = !filter.cardType && !Array.isArray(filter.cardTypes)
      ? true
      : (
        (filter.cardType && String(filter.cardType).toLowerCase().includes('nexus')) ||
        (Array.isArray(filter.cardTypes) && filter.cardTypes.some(t => String(t).toLowerCase().includes('nexus')))
      );
    if (wantsNexus && Array.isArray(p.nexus)) {
      for (const nex of p.nexus) {
        if (!nex) continue;
        if ((nex.currentOwner || nex.owner || s) !== s) continue;
        if (!cardMatchesFilterSpec(nex, null, filter, state, context)) continue;
        count++;
      }
    }
  }
  return count;
}

export function hasSoulCoreOnStack(stack) {
  return Boolean(stack && stack.cores && Number(stack.cores.soul || 0) > 0);
}

export function findSoulCoreStackOnField(state, side, filter = {}, context = null) {
  const sides = resolveTargetSides(side, context);
  for (const s of sides) {
    const p = state?.players?.[s];
    if (!p || !Array.isArray(p.field)) return null;
    for (const stack of p.field) {
      if (!stack || !stack.top) continue;
      if (getStackController(stack, s) !== s) continue;
      if (filter.cardType && !cardMatchesType(stack.top, filter.cardType)) continue;
      if (filter.family && !cardMatchesFamily(stack.top, filter.family)) continue;
      if (hasSoulCoreOnStack(stack)) return stack;
    }
  }
  return false;
}

// ============================================================================
// Parser: Raw Condition String -> Typed Structured Condition (or null)
// ============================================================================

function parseThresholdOperator(tailText) {
  const t = tailText.toLowerCase();
  if (/\b(?:or more|at least)\b/.test(t)) return 'GTE';
  if (/\b(?:or less|or fewer|at most)\b/.test(t)) return 'LTE';
  if (/\b(?:more than|greater than|over)\b/.test(t)) return 'GT';
  if (/\b(?:fewer than|less than|under)\b/.test(t)) return 'LT';
  if (/\bexactly\b/.test(t)) return 'EQ';
  return null;
}

export function parseConditionToStructured(conditionInput) {
  if (!conditionInput) return null;
  if (typeof conditionInput === 'object') {
    if (conditionInput.kind === 'STRUCTURED_CONDITION') {
      return conditionInput;
    }
    if (typeof conditionInput.colorSymbol === 'string' && conditionInput.colorSymbol.trim()) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.COLOR_SYMBOL,
        side: conditionInput.side || 'self',
        color: conditionInput.colorSymbol.trim().toLowerCase(),
        rawText: JSON.stringify(conditionInput)
      };
    }
    return null;
  }
  if (typeof conditionInput !== 'string') return null;

  const raw = conditionInput.trim();
  const s = raw.toLowerCase();
  if (!s) return null;

  // Handle structured op-level rule tokens before generic string parsing
  if (raw === 'BOTH_PLAYERS_CONTROL_NEXUS' || raw === 'LEVEL_LTE') {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.OP_RULE_CONDITION,
      ruleKey: raw,
      rawText: raw
    };
  }

  // Note: "If you have Soul Core in your Trash" is a trash location check, not a cost-used legacy check
  if (/^if\s+you\s+have\s+(?:a\s+)?\[?soul\s+core\]?\s+in\s+your\s+trash$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SOUL_CORE_LOCATION, zone: 'trash', side: 'self', negated: false, rawText: raw };
  }

  // Preserve existing Phase 2A legacy context conditions
  if (s === 'destroyed_by_opponent' || s.includes('destroyed_by_opponent') || s.includes('destroyed by your opponent')) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LEGACY_CONTEXT_CONDITION, legacyKey: 'destroyed_by_opponent', rawText: raw };
  }
  if (s === 'summoned_from_removed' || s.includes('summoned_from_removed')) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LEGACY_CONTEXT_CONDITION, legacyKey: 'summoned_from_removed', rawText: raw };
  }
  if (s.includes('soul core') && (s.includes('pay') || s.includes('used') || s.includes('cost'))) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LEGACY_CONTEXT_CONDITION, legacyKey: 'soul_core_used', rawText: raw };
  }

  // Compound multi-condition strings with "not" / "and" / "or": only parse if subconditions parse cleanly
  const isExplicitBurstOrMirage = /\b(?:burst|mirage)\b.*\bor\b.*\b(?:burst|mirage)\b/i.test(s);
  const notMatch = raw.match(/^not\s+(.+)$/i);
  if (notMatch) {
    const inner = parseConditionToStructured(notMatch[1]);
    if (inner) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'NOT', conditions: [inner], rawText: raw };
    }
    return null;
  }
  if (!isExplicitBurstOrMirage) {
    // Split on top-level " and " / " or " outside quotes and brackets
    const splitOutsideQuotes = (text, sepRegex) => {
      const parts = [];
      let inQuote = false;
      let bracketDepth = 0;
      let curStart = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') inQuote = !inQuote;
        else if (!inQuote && ch === '[') bracketDepth++;
        else if (!inQuote && ch === ']' && bracketDepth > 0) bracketDepth--;
        if (!inQuote && bracketDepth === 0) {
          const slice = text.slice(i);
          const m = slice.match(sepRegex);
          if (m) {
            parts.push(text.slice(curStart, i).trim());
            curStart = i + m[0].length;
            i = curStart - 1;
          }
        }
      }
      parts.push(text.slice(curStart).trim());
      return parts.filter(Boolean);
    };

    if (/\sand\s/i.test(s)) {
      const andParts = splitOutsideQuotes(raw, /^\s+and\s+/i);
      if (andParts.length === 2) {
        const left = parseConditionToStructured(andParts[0]);
        const right = parseConditionToStructured(andParts[1]);
        if (left && right) {
          return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'AND', conditions: [left, right], rawText: raw };
        }
      }
    }
    if (/\sor\s/i.test(s)) {
      const orParts = splitOutsideQuotes(raw, /^\s+or\s+(?!more\b|less\b|fewer\b|the\s+opponent\b|equal\b|inferior\b|subsequent\b|higher\b)/i);
      if (orParts.length === 2) {
        const left = parseConditionToStructured(orParts[0]);
        const right = parseConditionToStructured(orParts[1]);
        if (left && right) {
          return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'OR', conditions: [left, right], rawText: raw };
        }
      }
    }
  }

  // 0a. BATTLING_STATE
  if (/^(?:(?:if|while)\s+)?(?:(?:the|this)\s+spirit\s+is\s+(?:currently\s+)?battling|during\s+battle)$/i.test(s)) {
    const requiresSelfStack = /\b(?:the|this)\s+spirit\b/i.test(s);
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BATTLING_STATE,
      requiresSelfStack,
      rawText: raw
    };
  }

  // 0b. BP_ZERO
  if (/^(?:if\s+)?(?:it|this\s+spirit)\s+has\s+0\s*bp$/i.test(s) || /^(?:if\s+)?(?:its|this\s+spirit's)\s+bp\s+is\s+0$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BP_ZERO,
      subject: /\bthis\s+spirit\b/i.test(s) ? 'SELF_STACK' : 'TARGET_OR_SELF',
      rawText: raw
    };
  }

  // 0c. SOUL_STATE
  if (/^(?:(?:if|while)\s+)?(?:this\s+card\s+is\s+)?in\s+soul\s+state$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.SOUL_STATE,
      rawText: raw
    };
  }

  // 0d. TURN_STEP_STATE
  const stepTurnMatch = s.match(/^(?:(?:if\s+it(?:'s|\s+is)|during)\s+)?(?:the\s+)?(your|the\s+opponent's|opponent's|opposing)?\s*(turn|start\s+step|core\s+step|draw\s+step|refresh\s+step|main\s+step|attack\s+step|end\s+step)$/i);
  if (stepTurnMatch && (stepTurnMatch[1] || stepTurnMatch[2].toLowerCase().includes('step'))) {
    const who = (stepTurnMatch[1] || '').toLowerCase();
    const side = !who ? 'any' : ((who.includes('opponent') || who.includes('opposing')) ? 'opponent' : 'self');
    const phaseToken = stepTurnMatch[2].toLowerCase().replace(/\s+/g, '_').replace(/_step$/, '').toUpperCase();
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TURN_STEP_STATE,
      side,
      step: phaseToken === 'TURN' ? null : phaseToken,
      rawText: raw
    };
  }

  // 0d2. HAND_SIZE_THRESHOLD
  const handMatch = s.match(/^(?:(?:if|while)\s+)?(?:the\s+)?(your|the\s+opponent's|opponent's|opposing)\s+hand\s+(?:is|has)\s+(at\s+least|more\s+than|greater\s+than|fewer\s+than|less\s+than|exactly)?\s*([a-z0-9]+)(?:\s+(or\s+more|or\s+less|or\s+fewer))?(?:\s+cards?)?$/i);
  if (handMatch) {
    const side = (handMatch[1].includes('opponent') || handMatch[1].includes('opposing')) ? 'opponent' : 'self';
    const num = parseConditionNumber(handMatch[3]);
    const op = parseThresholdOperator(`${handMatch[2] || ''} ${handMatch[4] || ''}`) || 'EQ';
    if (num !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.HAND_SIZE_THRESHOLD,
        side,
        operator: op,
        expected: num,
        rawText: raw
      };
    }
  }

  // 0d2b. TURN_HISTORY
  if (/^(?:if\s+)?your\s+life\s+(?:was|wasn't|was\s+not)\s+reduced\s+this\s+turn$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TURN_HISTORY,
      metric: 'lifeReduced',
      side: 'self',
      expectedBoolean: !/wasn't|was\s+not/i.test(s),
      rawText: raw
    };
  }
  if (/^(?:if\s+)?this\s+is\s+the\s+first\s+attack\s+of\s+your\s+turn$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TURN_HISTORY,
      metric: 'firstAttackOfTurn',
      side: 'self',
      rawText: raw
    };
  }
  if (/^(?:if\s+)?you\s+\[?advented\]?\s+(?:during\s+)?this\s+turn$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TURN_HISTORY,
      metric: 'adventsPerformed',
      side: 'self',
      expectedBoolean: true,
      rawText: raw
    };
  }
  if (/^(?:if\s+)?this\s+burst\s+was\s+activated\s+via\s+\[?([a-z0-9\s\-]+)\]?$/i.test(s)) {
    const m = raw.match(/via\s+\[?([^\]]+)\]?$/i);
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TURN_HISTORY,
      metric: 'burstMechanic',
      mechanic: m ? m[1].trim() : 'Catalyze',
      side: 'self',
      rawText: raw
    };
  }
  if (/^(?:if\s+)?summoned\s+(?:via|using)\s+\[?([a-z0-9\s\-]+)\]?$/i.test(s)) {
    const m = raw.match(/(?:via|using)\s+\[?([^\]]+)\]?$/i);
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TURN_HISTORY,
      metric: 'summonMechanic',
      mechanic: m ? m[1].trim() : 'Legacy',
      side: 'self',
      rawText: raw
    };
  }

  // 0d2c. CARD_RESULT
  if (/^if\s+returned$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'returned', rawText: raw };
  }
  const resTypeMatch = s.match(/^if\s+that(?:\s+card)?\s+is\s+(?:a|an)\s+(spirit|ultimate|nexus|brave|magic)(?:\s+card)?$/i);
  if (resTypeMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'cardType', cardType: resTypeMatch[1], rawText: raw };
  }
  const resFamMatch = raw.match(/^if\s+(?:that(?:'s|\s+is|\s+card\s+is)|the\s+(?:discarded|revealed|destroyed|returned)\s+card\s+(?:has|is))\s+(?:a|an|the)?\s*"([^"]+)"\s+family(?:\s+card)?$/i);
  if (resFamMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'family', family: resFamMatch[1], rawText: raw };
  }
  const resColorCostMatch = raw.match(/^if\s+the\s+(?:discarded|revealed|destroyed|returned)\s+card\s+is\s+(?:(red|purple|green|white|yellow|blue)|cost\s+([a-z0-9]+)\s+or\s+(more|less|fewer))$/i);
  if (resColorCostMatch) {
    if (resColorCostMatch[1]) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'composite', color: resColorCostMatch[1].toLowerCase(), rawText: raw };
    }
    const n = parseConditionNumber(resColorCostMatch[2]);
    if (n !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD,
        subject: 'TARGET',
        stat: 'COST',
        operator: resColorCostMatch[3].toLowerCase() === 'more' ? 'GTE' : 'LTE',
        expected: n,
        rawText: raw
      };
    }
  }
  if (/^if\s+that\s+card's\s+cost\s+is\s+an?\s+(odd|even)\s+number$/i.test(s)) {
    const parity = /\bodd\b/i.test(s) ? 'odd' : 'even';
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'costParity', parity, rawText: raw };
  }

  // 0d2d. BRAVE_STACK_STATE
  const bravedSpecificMatch = raw.match(/^(?:if|while)\s+(?:this\s+(?:spirit|ultimate)\s+is\s+)?braved(?:\s+to\s+a(?:n)?\s+(?:(saga)\s+brave|"([^"]+)"\s+family\s+brave|exactly-named\s+"([^"]+)"|brave\s+named\s+"([^"]+)"|"([^"]+)"|(red|purple|green|white|yellow|blue)\s+brave|brave))?$/i);
  if (bravedSpecificMatch) {
    let braveRequirement = null;
    if (bravedSpecificMatch[1]) braveRequirement = { sagaBrave: true };
    else if (bravedSpecificMatch[2]) braveRequirement = { family: bravedSpecificMatch[2] };
    else if (bravedSpecificMatch[3]) braveRequirement = { name: bravedSpecificMatch[3], exactName: true };
    else if (bravedSpecificMatch[4]) braveRequirement = { name: bravedSpecificMatch[4], exactName: false };
    else if (bravedSpecificMatch[5]) braveRequirement = { name: bravedSpecificMatch[5], exactName: false };
    else if (bravedSpecificMatch[6]) braveRequirement = { color: bravedSpecificMatch[6].toLowerCase() };
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BRAVE_STACK_STATE,
      check: 'isBraved',
      ...(braveRequirement ? { braveRequirement } : {}),
      rawText: raw
    };
  }
  if (/^if\s+\[?soul\s+core\]?\s+is\s+in\s+your\s+counter\s+area$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BRAVE_STACK_STATE, check: 'soulCoreInCounterArea', side: 'self', rawText: raw };
  }

  // 0d2e. FIELD_COMPOSITION (all your Spirits/Nexuses..., only <Color>..., or exactly-named)
  const exactNamedMatch = raw.match(/^(?:if|while)\s+there\s+is\s+any\s+exactly-named\s+"([^"]+)"\s+on\s+your\s+field$/i);
  if (exactNamedMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      subject: 'FIELD',
      property: 'controlledCardCount',
      operator: 'GTE',
      expected: 1,
      filter: { name: exactNamedMatch[1], exactName: true },
      rawText: raw
    };
  }
  const onlyColorFieldMatch = raw.match(/^(?:if|while)\s+you\s+have\s+only\s+(red|purple|green|white|yellow|blue)\s+(spirits\/nexuses|spirits|nexuses|ultimates)\s+on\s+your\s+field$/i);
  if (onlyColorFieldMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.FIELD_COMPOSITION,
      side: 'self',
      subject: onlyColorFieldMatch[2].toLowerCase(),
      onlyColor: onlyColorFieldMatch[1].toLowerCase(),
      rawText: raw
    };
  }
  const allMatch = raw.match(/^(?:if|while)\s+all\s+your\s+(spirits\s*\/\s*nexuses|spirits|nexuses|ultimates)\s+(?:are|have(?:\s+in)?)\s+(.+)$/i);
  if (allMatch) {
    const subj = allMatch[1].toLowerCase().replace(/\s+/g, '');
    const rest = allMatch[2].trim();
    const famPairM = rest.match(/^(?:the\s+)?"([^"]+)"\s*(?:\/|\bor\b)\s*"([^"]+)"(?:\s*(?:\/|\bor\b)\s*"([^"]+)")?\s+famil(?:y|ies)$/i);
    const famM = rest.match(/^(?:the\s+)?"([^"]+)"\s+famil(?:y|ies)$/i);
    const kwM = rest.match(/^\[([^\]]+)\]$/);
    const costFamM = rest.match(/^cost\s+([0-9/]+)\s+with\s+(?:the\s+)?"([^"]+)"\s+famil(?:y|ies)$/i);
    const costRangeM = rest.match(/^cost\s+([a-z0-9]+)\s+or\s+(more|less|fewer)$/i);
    if (famPairM || famM || kwM || costFamM || costRangeM) {
      const fams = famPairM ? [famPairM[1], famPairM[2], famPairM[3]].filter(Boolean) : null;
      const rangeNum = costRangeM ? parseConditionNumber(costRangeM[1]) : null;
      if (!costRangeM || rangeNum !== null) {
        return {
          kind: 'STRUCTURED_CONDITION',
          type: CONDITION_TYPES.FIELD_COMPOSITION,
          side: 'self',
          subject: subj,
          family: famM ? famM[1] : (costFamM ? costFamM[2] : null),
          ...(fams ? { families: fams } : {}),
          keyword: kwM ? kwM[1] : null,
          allowedCosts: costFamM ? costFamM[1].split('/').map(Number) : null,
          ...(costRangeM ? (costRangeM[2].toLowerCase() === 'more' ? { costGte: rangeNum } : { costLte: rangeNum }) : {}),
          rawText: raw
        };
      }
    }
  }

  // 0d3. CARD_ZONE_STATE (in the Trash / in the Removed Zone)
  const zoneStateMatch = s.match(/^(?:(?:if|while)\s+)?this\s+card\s+is\s+in\s+(?:the\s+)?(trash|grave|removed\s+zone|removed|hand)$/i);
  if (zoneStateMatch) {
    const z = zoneStateMatch[1].toLowerCase();
    const zone = (z === 'trash' || z === 'grave') ? 'grave' : (z.startsWith('removed') ? 'removed' : 'hand');
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CARD_ZONE_STATE,
      zone,
      rawText: raw
    };
  }

  // 0e. PREVIOUS_OP_SUCCESS
  if (/^(?:if\s+)?(?:you(?:'ve|\s+have)?\s+done\s+so|you\s+did|by\s+doing\s+so)$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.PREVIOUS_OP_SUCCESS,
      rawText: raw
    };
  }

  // 1. COND_SOUL_CORE_ON_SPIRIT (exclude banish/cost/move actions on Soul Core)
  if (/\[soul core\]|\bsoul core\b/i.test(s) && !/\b(?:banish|pay|used|cost|move|send|put|remove|trash|reserve|counter area)\b/i.test(s)) {
    const side = /\bopponent(?:'s)?\b/i.test(s) ? 'opponent' : 'self';
    if (/\bon this (?:spirit|ultimate|nexus|brave|card)\b/i.test(s) || /this (?:spirit|ultimate|nexus|brave|card) has \[?soul core\]? on it/i.test(s)) {
      const typeMatch = s.match(/(?:on this|this) (spirit|ultimate|nexus|brave|card)\b/i);
      const subjectType = typeMatch ? typeMatch[1].toLowerCase() : 'spirit';
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.SOUL_CORE_ON_SPIRIT,
        side,
        subject: 'SELF_STACK',
        property: 'soulCoreOnStack',
        operator: 'EQ',
        expected: true,
        cardType: subjectType === 'card' ? null : subjectType,
        rawText: raw
      };
    }
    if (/\bon (?:a|any) (spirit|ultimate|nexus)\b/i.test(s)) {
      const m = s.match(/\bon (?:a|any) (spirit|ultimate|nexus)\b/i);
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.SOUL_CORE_ON_SPIRIT,
        side,
        subject: 'ANY_CONTROLLED_STACK',
        property: 'soulCoreOnControlledStack',
        operator: 'EQ',
        expected: true,
        cardType: m[1].toLowerCase(),
        rawText: raw
      };
    }
  }

  // 2. COND_COUNTER_THRESHOLD
  const counterSlashMatch = s.match(/^(?:(?:if|while)\s+)?(you|the opponent|opponent)\s+(?:have|has)\s+([a-z0-9]+)\/([a-z0-9]+)\s+counters?$/i);
  if (counterSlashMatch) {
    const n1 = parseConditionNumber(counterSlashMatch[2]);
    const n2 = parseConditionNumber(counterSlashMatch[3]);
    if (n1 !== null && n2 !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.COUNTER_THRESHOLD,
        side: counterSlashMatch[1].includes('opponent') ? 'opponent' : 'self',
        subject: 'PLAYER',
        property: 'counters',
        operator: 'IN',
        allowedValues: [n1, n2],
        rawText: raw
      };
    }
  }
  const counterMatch = s.match(/^(?:(?:if|while)\s+)?(?:(?:(you|the opponent|opponent)\s+(?:have|has)|(your|the opponent's|opponent's)\s+counter\s+is)\s+)(at least|more than|greater than|fewer than|less than|exactly)?\s*([a-z0-9]+)\s*(?:(or more|or less|or fewer)\s+counters?|counters?(?:\s+(or more|or less|or fewer))?)$/i);
  if (counterMatch) {
    const sideToken = counterMatch[1] || counterMatch[2] || '';
    const side = sideToken.includes('opponent') ? 'opponent' : 'self';
    const num = parseConditionNumber(counterMatch[4]);
    const op = parseThresholdOperator(`${counterMatch[3] || ''} ${counterMatch[5] || ''} ${counterMatch[6] || ''}`) || 'EQ';
    if (num !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.COUNTER_THRESHOLD,
        side,
        subject: 'PLAYER',
        property: 'counters',
        operator: op,
        expected: num,
        rawText: raw
      };
    }
  }

  // 3. COND_LIFE_THRESHOLD
  const lifeMatch = s.match(/^(?:(?:if|while)\s+)?(?:(your|the opponent's|opponent's|the opposing|opposing)\s+)?life\s+is\s+(?:at\s+)?(at least|more than|greater than|fewer than|less than|exactly)?\s*([a-z0-9]+)(?:\s+(or more|or less|or fewer))?$/i);
  if (lifeMatch) {
    const sideToken = lifeMatch[1] || '';
    const side = (sideToken.includes('opponent') || sideToken.includes('opposing')) ? 'opponent' : 'self';
    const num = parseConditionNumber(lifeMatch[3]);
    const op = parseThresholdOperator(`${lifeMatch[2] || ''} ${lifeMatch[4] || ''}`) || 'EQ';
    if (num !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.LIFE_THRESHOLD,
        side,
        subject: 'PLAYER',
        property: 'life',
        operator: op,
        expected: num,
        rawText: raw
      };
    }
  }

  // 4. COND_BURST_OR_MIRAGE_SET
  const bmOrMatch = s.match(/^(?:(?:if|while)\s+)?(you|the opponent|opponent)\s+(have|has|don't have|doesn't have|do not have|does not have)\s+(?:a|an|any)?\s*(?:set\s+)?(burst|mirage)\s+or\s+(?:set\s+)?(burst|mirage)(?:\s+set)?$/i);
  if (bmOrMatch) {
    const side = bmOrMatch[1].includes('opponent') ? 'opponent' : 'self';
    const negated = /n't|\bnot\b/i.test(bmOrMatch[2]);
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BURST_OR_MIRAGE_SET,
      side,
      subject: 'PLAYER',
      property: 'burstOrMirageSet',
      operator: 'EQ',
      expected: !negated,
      checkBurst: true,
      checkMirage: true,
      combinator: 'OR',
      rawText: raw
    };
  }
  const bmMatch = s.match(/^(?:(?:if|while)\s+)?(you|the opponent|opponent)\s+(have|has|don't have|doesn't have|do not have|does not have)\s+(?:a|an|any)\s+(?:(red|purple|green|white|yellow|blue)\s+)?(?:(set\s+(?:burst|mirage))|((?:burst|mirage)\s+set))$/i);
  if (bmMatch) {
    const side = bmMatch[1].includes('opponent') ? 'opponent' : 'self';
    const negated = /n't|\bnot\b/i.test(bmMatch[2]);
    const color = bmMatch[3] ? bmMatch[3].toLowerCase() : null;
    const kindStr = (bmMatch[4] || bmMatch[5]).toLowerCase();
    const kind = kindStr.includes('burst') ? 'burst' : 'mirage';
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BURST_OR_MIRAGE_SET,
      side,
      subject: 'PLAYER',
      property: kind === 'burst' ? 'burstSet' : 'mirageSet',
      operator: 'EQ',
      expected: !negated,
      checkBurst: kind === 'burst',
      checkMirage: kind === 'mirage',
      color,
      combinator: 'SINGLE',
      rawText: raw
    };
  }

  // F5 & F/G.1 Extended Structured Condition Families (exact non-guessing patterns)
  const symCtrlMatch = s.match(/^(?:if|while)\s+you\s+(?:control|have)\s+(any|[a-z0-9]+)(?:\s+(or more|or less|or fewer|more than|fewer than|exactly))?\s*(red|purple|green|white|yellow|blue)\s+symbols?$/i);
  if (symCtrlMatch) {
    const qty = symCtrlMatch[1].toLowerCase();
    const num = qty === 'any' ? 1 : parseConditionNumber(qty);
    const op = qty === 'any' ? 'GTE' : (parseThresholdOperator(symCtrlMatch[2] || 'or more') || 'GTE');
    if (num !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.COLOR_SYMBOL,
        side: 'self',
        color: symCtrlMatch[3].toLowerCase(),
        operator: op,
        expected: num,
        rawText: raw
      };
    }
  }
  const onlySymMatch = s.match(/^(?:if|while)\s+there\s+(?:is|are)\s+only\s+(red|purple|green|white|yellow|blue)\s+symbols?\s+on\s+your\s+field$/i);
  if (onlySymMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.COLOR_SYMBOL,
      side: 'self',
      color: onlySymMatch[1].toLowerCase(),
      onlyThisColor: true,
      operator: 'GTE',
      expected: 1,
      rawText: raw
    };
  }
  const fieldSymThresholdMatch = s.match(/^(?:if|while)\s+there\s+(?:is|are)\s+([a-z0-9]+)\s+(or\s+more|or\s+less|or\s+fewer)\s+(red|purple|green|white|yellow|blue)\s+symbols?\s+on\s+(?:your|the\s+opposing|opponent'?s)\s+field$/i);
  if (fieldSymThresholdMatch) {
    const num = parseConditionNumber(fieldSymThresholdMatch[1]);
    const op = parseThresholdOperator(fieldSymThresholdMatch[2]) || 'GTE';
    const side = /opposing|opponent/.test(s) ? 'opponent' : 'self';
    if (num !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.COLOR_SYMBOL,
        side,
        color: fieldSymThresholdMatch[3].toLowerCase(),
        operator: op,
        expected: num,
        rawText: raw
      };
    }
  }

  const resCoreMatch = s.match(/^(?:if|while)\s+there\s+(?:are|is)\s+(any|[a-z0-9]+)(?:\s+(or more|or less|or fewer|more than|fewer than))?\s*cores?\s+in\s+(?:your|the\s+opposing|opponent'?s)\s+reserve$/i);
  if (resCoreMatch) {
    const qty = resCoreMatch[1].toLowerCase();
    const num = qty === 'any' ? 1 : parseConditionNumber(qty);
    const op = qty === 'any' ? 'GTE' : (parseThresholdOperator(resCoreMatch[2] || 'or more') || 'GTE');
    const side = /opposing|opponent/.test(s) ? 'opponent' : 'self';
    if (num !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.RESERVE_CORE_THRESHOLD,
        side,
        operator: op,
        expected: num,
        rawText: raw
      };
    }
  }

  if (/^(?:if\s+)?(?:it\s+is\s+)?(refreshed|exhausted)$/i.test(s) || /^(?:if|while)\s+(?:this|that)\s+spirit\s+is\s+in\s+(refreshed|exhausted)\s+state$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.STACK_STATE,
      expectedState: s.includes('exhausted') ? 'EXHAUSTED' : 'REFRESHED',
      rawText: raw
    };
  }
  if (/^while\s+this\s+spirit\s+is\s+\[during\s+advent\]$/i.test(s) || /^if\s+this\s+spirit\s+was\s+\[?advented\]?$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.STACK_STATE, expectedState: 'DURING_ADVENT', rawText: raw };
  }
  if (/^while\s+this\s+brave\s+is\s+in\s+spirit\s+condition$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.STACK_STATE, expectedState: 'BRAVE_SPIRIT_FORM', rawText: raw };
  }
  if (/^(?:if|while)\s+(?:this\s+spirit|it)\s+is\s+(?:blocked|being\s+blocked)(?:\s+by\s+a\s+spirit)?$/i.test(s) || /^if\s+(?:it\s+is\s+)?blocked\s+by\s+a\s+spirit$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT, role: 'BLOCKED', expectedBlocked: true, rawText: raw };
  }
  if (/^if\s+it\s+isn'?t\s+blocked$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT, role: 'BLOCKED', expectedBlocked: false, rawText: raw };
  }

  const handAltMatch = s.match(/^(?:if|while)\s+(you|the opponent|opponent)\s+(?:have|has)\s+([a-z0-9]+)\s+(or more|or less|or fewer)\s+cards?\s+in\s+(?:your\s+|their\s+)?(hand|deck)$/i);
  if (handAltMatch) {
    const num = parseConditionNumber(handAltMatch[2]);
    const op = parseThresholdOperator(handAltMatch[3]) || 'GTE';
    if (num !== null) {
      const z = handAltMatch[4].toLowerCase();
      if (z === 'deck') {
        return {
          kind: 'STRUCTURED_CONDITION',
          type: CONDITION_TYPES.ZONE_CARD_COUNT,
          side: handAltMatch[1].includes('opponent') ? 'opponent' : 'self',
          zone: 'deck',
          operator: op,
          expected: num,
          filter: {},
          rawText: raw
        };
      }
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.HAND_SIZE_THRESHOLD,
        side: handAltMatch[1].includes('opponent') ? 'opponent' : 'self',
        operator: op,
        expected: num,
        rawText: raw
      };
    }
  }
  if (/^if\s+you\s+have\s+a\s+card\s+set$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BURST_OR_MIRAGE_SET,
      side: 'self',
      expected: true,
      checkBurst: true,
      checkMirage: true,
      combinator: 'OR',
      rawText: raw
    };
  }

  const selfZoneMatch = s.match(/^(?:if|while)\s+this\s+(?:spirit|ultimate|magic|brave|nexus)?\s*card\s+is\s+in\s+(?:your|the)\s+(trash|grave|removed\s+zone|hand)$/i);
  if (selfZoneMatch) {
    const z = selfZoneMatch[1].toLowerCase();
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CARD_ZONE_STATE,
      zone: (z === 'trash' || z === 'grave') ? 'grave' : (z.startsWith('removed') ? 'removed' : 'hand'),
      rawText: raw
    };
  }

  if (/^if\s+they\s+have\s+0\s*bp$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BP_ZERO, side: 'either', rawText: raw };
  }
  if (/^if\s+this\s+is\s+the\s+first\s+attack(?:\/block)?\s+of\s+the\s+turn$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.TURN_HISTORY, side: 'self', metric: 'firstAttackOfTurn', rawText: raw };
  }
  if (/^(?:if|while)\s+this\s+is\s+the\s+second\s+or\s+subsequent\s+attack\s+of\s+the\s+turn$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.TURN_HISTORY, side: 'self', metric: 'attackCountGte', expected: 2, rawText: raw };
  }
  if (/^(?:if|when)\s+your\s+spirits?\s+attacked\s+this\s+turn$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.TURN_HISTORY, side: 'self', metric: 'attackCountGte', expected: 1, rawText: raw };
  }
  const madeAttacksMatch = s.match(/^(?:if|when)\s+you(?:'ve|\s+have)?\s+made\s+([a-z0-9]+)(?:\s+or\s+more)?\s+attacks?\s+this\s+turn$/i);
  if (madeAttacksMatch) {
    const num = parseConditionNumber(madeAttacksMatch[1]);
    if (num !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.TURN_HISTORY, side: 'self', metric: 'attackCountGte', expected: num, rawText: raw };
    }
  }
  const histCountMatch = s.match(/^if\s+you(?:'ve|\s+have)?\s+(summoned|attacked)\s+(?:for\s+)?(twice|two\s+times|[a-z0-9]+(?:\s+times)?)\s+or\s+more\s+(?:during\s+)?this\s+turn$/i);
  if (histCountMatch) {
    const kind = histCountMatch[1].toLowerCase();
    const numTok = histCountMatch[2].replace(/\s+times?$/, '').replace(/^twice$/, 'two').trim();
    const num = parseConditionNumber(numTok);
    if (num !== null) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.TURN_HISTORY,
        side: 'self',
        metric: kind === 'summoned' ? 'summonCountGte' : 'attackCountGte',
        expected: num,
        rawText: raw
      };
    }
  }
  const usedMagicMatch = raw.match(/^if\s+you\s+used\s+any\s+(?:"([^"]+)"\s+family|\[([^\]]+)\])\s+magic\s+card\s+this\s+turn$/i);
  if (usedMagicMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TURN_HISTORY,
      side: 'self',
      metric: 'usedMagicFamilyOrKeyword',
      family: usedMagicMatch[1] || null,
      keyword: usedMagicMatch[2] || null,
      rawText: raw
    };
  }

  if (/^if\s+(?:a\s+(?:spirit|nexus|card)\s+is\s+|two\s+cards\s+are\s+)?returned$/i.test(s) || /^if\s+(?:it\s+depletes|destroyed|discarded|you\s+discarded)$/i.test(s)) {
    const check = s.includes('returned') ? 'returned' : (s.includes('discarded') ? 'discarded' : (s.includes('depletes') ? 'depleted' : 'destroyed'));
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.PREVIOUS_OP_SUCCESS, check, rawText: raw };
  }

  if (/^if\s+it's\s+an?\s+(even|odd)\s+number$/i.test(s)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'costParity', parity: s.includes('odd') ? 'odd' : 'even', rawText: raw };
  }
  const cardResMatch = raw.match(/^if\s+(?:that's|that\s+is|it's|it\s+is|that\s+card\s+is)\s+(?:a|an)?\s*(?:(red|purple|green|white|yellow|blue)\s+)?(?:"([^"]+)"\s+family\s+)?(?:\[([^\]]+)\]\s+)?(?:(spirit|ultimate|nexus|brave|magic)(?:\s+card)?(?:\/(spirit|ultimate|nexus|brave|magic)(?:\s+card)?)?|card)$/i);
  if (cardResMatch && (cardResMatch[1] || cardResMatch[2] || cardResMatch[3] || cardResMatch[4])) {
    const types = [cardResMatch[4], cardResMatch[5]].filter(Boolean);
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CARD_RESULT,
      check: 'composite',
      color: cardResMatch[1] ? cardResMatch[1].toLowerCase() : null,
      family: cardResMatch[2] || null,
      keyword: cardResMatch[3] || null,
      cardTypes: types.length > 0 ? types : null,
      rawText: raw
    };
  }
  const exactCardNameResMatch = raw.match(/^if\s+that's\s+"([^"]+)"$/i);
  if (exactCardNameResMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'name', name: exactCardNameResMatch[1], rawText: raw };
  }

  // SPIRIT_STAT_THRESHOLD
  const selfBpMatch = s.match(/^(?:if|while)\s+(this|that|it|the)\s*(?:spirit|ultimate|brave|card)?\s+has\s+(\d+)\s*bp\s+or\s+(more|less)$/i);
  if (selfBpMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD,
      subject: selfBpMatch[1].toLowerCase() === 'this' ? 'SELF' : 'TARGET',
      stat: 'BP',
      operator: selfBpMatch[3].toLowerCase() === 'more' ? 'GTE' : 'LTE',
      expected: Number(selfBpMatch[2]),
      rawText: raw
    };
  }
  const statCostMatch = raw.match(/^(?:if|while)\s+(?:that's|that\s+is|it's|it\s+is|this\s+spirit\s+is|that\s+card\s+is|that\s+spirit\s+is)\s+(?:a\s+)?cost\s+(\d+(?:\/\d+)*)(?:\s+(or\s+more|or\s+less))?(?:\s+(red|purple|green|white|yellow|blue))?(?:\s+"([^"]+)"\s+family)?(?:\s+(spirit|ultimate|nexus|brave|magic))?(?:\s+card)?$/i);
  if (statCostMatch) {
    const vals = statCostMatch[1].split('/').map(Number);
    const mod = (statCostMatch[2] || '').toLowerCase();
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD,
      subject: /this\s+spirit/i.test(raw) ? 'SELF' : 'TARGET',
      stat: 'COST',
      operator: mod.includes('more') ? 'GTE' : (mod.includes('less') ? 'LTE' : 'EQ'),
      expected: vals[0],
      allowedValues: vals.length > 1 ? vals : null,
      filter: {
        ...(statCostMatch[3] ? { color: statCostMatch[3].toLowerCase() } : {}),
        ...(statCostMatch[4] ? { family: statCostMatch[4] } : {}),
        ...(statCostMatch[5] ? { cardType: statCostMatch[5] } : {})
      },
      rawText: raw
    };
  }

  // SOUL_CORE_LOCATION
  const noSoulOnSelfMatch = s.match(/^(?:if|while)\s+this\s+(spirit|ultimate|nexus|card)\s+has\s+no\s+\[?soul\s+core\]?\s+on\s+it$/i);
  if (noSoulOnSelfMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.SOUL_CORE_ON_SPIRIT,
      side: 'self',
      subject: 'SELF_STACK',
      property: 'soulCoreOnStack',
      operator: 'EQ',
      expected: false,
      cardType: noSoulOnSelfMatch[1] === 'card' ? null : noSoulOnSelfMatch[1].toLowerCase(),
      rawText: raw
    };
  }
  const soulLocMatch = s.match(/^(?:if|while)\s+(?:(?:there\s+is|there's|the)\s+)?\[?soul\s+core\]?\s+(?:is\s+)?in\s+(your|the\s+opposing|opponent's)\s+(trash|grave|reserve|life|field|counter\s+area)$/i);
  if (soulLocMatch) {
    const zRaw = soulLocMatch[2].toLowerCase().replace(/\s+/g, '_');
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.SOUL_CORE_LOCATION,
      side: /opposing|opponent/.test(soulLocMatch[1]) ? 'opponent' : 'self',
      zone: zRaw === 'trash' || zRaw === 'grave' ? 'trash' : (zRaw === 'counter_area' ? 'counterArea' : zRaw),
      rawText: raw
    };
  }

  // Shared helper for card filter phrases (CONTROL_CARD / ZONE_CARD_COUNT / ATTACKING_OR_BLOCKING_SPIRIT)
  const parseCardFilterPhrase = (phrase) => {
    let p = String(phrase || '').trim();
    if (!p) return null;
    const f = {};

    if (/^other\s+/i.test(p)) {
      f.excludeSelf = true;
      p = p.replace(/^other\s+/i, '').trim();
    }
    const stMatch = p.match(/^(exhausted|refreshed)\s+/i);
    if (stMatch) {
      f.stackState = stMatch[1].toUpperCase();
      p = p.replace(/^(exhausted|refreshed)\s+/i, '').trim();
    }
    const costRangeM = p.match(/^cost\s+(\d+)\s+or\s+(more|less)\s+/i);
    if (costRangeM) {
      if (costRangeM[2].toLowerCase() === 'more') f.costGte = Number(costRangeM[1]);
      else f.costLte = Number(costRangeM[1]);
      p = p.slice(costRangeM[0].length).trim();
    } else {
      const costListM = p.match(/^cost\s+(\d+(?:\/\d+)*)\s+/i);
      if (costListM) {
        f.allowedCosts = costListM[1].split('/').map(Number);
        p = p.slice(costListM[0].length).trim();
      }
    }
    const colSlashM = p.match(/^(red|purple|green|white|yellow|blue)\/(red|purple|green|white|yellow|blue)\s+/i);
    if (colSlashM) {
      f.colors = [colSlashM[1].toLowerCase(), colSlashM[2].toLowerCase()];
      p = p.slice(colSlashM[0].length).trim();
    } else {
      const colM = p.match(/^(red|purple|green|white|yellow|blue)(-only)?\s+/i);
      if (colM) {
        f.color = colM[1].toLowerCase();
        if (colM[2]) f.singleColorOnly = true;
        p = p.slice(colM[0].length).trim();
      }
    }
    const exactlyNamedM = p.match(/^exactly-named\s+"([^"]+)"(?:\s+(.*))?$/i);
    if (exactlyNamedM) {
      f.name = exactlyNamedM[1];
      f.exactName = true;
      p = (exactlyNamedM[2] || '').trim();
    }
    const famAndM = p.match(/^"([^"]+)"\s*&\s*"([^"]+)"\s+family(?:\s+(.*))?$/i);
    const famPairM = p.match(/^"([^"]+)"\s*\/\s*"([^"]+)"\s+family(?:\s+(.*))?$/i);
    if (famAndM) {
      f.family = famAndM[1];
      f.secondFamily = famAndM[2];
      p = (famAndM[3] || '').trim();
    } else if (famPairM) {
      f.families = [famPairM[1], famPairM[2]];
      p = (famPairM[3] || '').trim();
    } else {
      const famQuotedM = p.match(/^"([^"]+)"\s+family(?:\s+(.*))?$/i);
      if (famQuotedM) {
        f.family = famQuotedM[1];
        p = (famQuotedM[2] || '').trim();
      } else {
        const namedM = p.match(/^"([^"]+)"(?:-named)?(?:\s+(.*))?$/i);
        if (namedM) {
          f.name = namedM[1];
          p = (namedM[2] || '').trim();
        }
      }
    }
    const brKwM = p.match(/^\[([^\]]+)\](?:\s+(.*))?$/);
    if (brKwM) {
      f.keyword = brKwM[1].trim();
      p = (brKwM[2] || '').trim();
    }
    if (/^brave\s+/i.test(p)) {
      f.isBraveSpirit = true;
      p = p.replace(/^brave\s+/i, '').trim();
    }

    // Trailing "with ..." clause
    const withKwM = p.match(/^(.+?)\s+with\s+\[([^\]]+)\]$/i);
    if (withKwM) {
      f.keyword = withKwM[2].trim();
      p = withKwM[1].trim();
    } else {
      const withNoEffM = p.match(/^(.+?)\s+with\s+no\s+printed\s+effects$/i);
      if (withNoEffM) {
        f.noPrintedEffects = true;
        p = withNoEffM[1].trim();
      } else {
        const withBpM = p.match(/^(.+?)\s+with\s+(\d+)\s*bp\s+or\s+(more|less)$/i);
        if (withBpM) {
          if (withBpM[3].toLowerCase() === 'more') f.bpGte = Number(withBpM[2]);
          else f.bpLte = Number(withBpM[2]);
          p = withBpM[1].trim();
        } else {
          const withSymM = p.match(/^(.+?)\s+with\s+([a-z0-9]+)\s+or\s+more\s+symbols?$/i);
          if (withSymM) {
            const sn = parseConditionNumber(withSymM[2]);
            if (sn !== null) f.minSymbols = sn;
            p = withSymM[1].trim();
          }
        }
      }
    }

    // Remaining token must be a recognized card type, or empty when name/family/keyword already specified
    if (!p) return (f.name || f.keyword || f.family || f.families) ? f : null;
    const typeSegments = p.split(/\s*\/\s*/).map(t => t
      .replace(/\s+cards?$/i, '')
      .replace(/^cards?$/i, 'card')
      .replace(/^grandwalker\s+nexus(?:es)?$/i, 'grandwalker nexus')
      .replace(/^(spirit|ultimate|nexus|brave|magic)(?:es|s)?$/i, '$1')
      .trim().toLowerCase());
    const validTypes = new Set(['spirit', 'ultimate', 'nexus', 'grandwalker nexus', 'brave', 'magic', 'card']);
    if (!typeSegments.every(t => validTypes.has(t))) return null;
    if (typeSegments.length === 1) {
      if (typeSegments[0] !== 'card') f.cardType = typeSegments[0];
    } else {
      f.cardTypes = typeSegments.filter(t => t !== 'card');
    }
    return f;
  };

  // ATTACKING_OR_BLOCKING_SPIRIT
  const atkBlkMatch = raw.match(/^(?:if|while)\s+(your|an?\s+opposing|the\s+opposing|the\s+attacking\s+opposing|the|this)\s+(.+?)\s+(?:is|are)\s+(attacking|blocking|battling|in\s+refreshed\s+state|in\s+exhausted\s+state)$/i);
  if (atkBlkMatch) {
    const sideTok = atkBlkMatch[1].toLowerCase();
    const subjPhrase = atkBlkMatch[2].trim();
    const stateTok = atkBlkMatch[3].toLowerCase();
    const filter = parseCardFilterPhrase(subjPhrase);
    if (filter) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT,
        side: sideTok.includes('opposing') ? 'opponent' : 'self',
        role: stateTok === 'blocking' ? 'BLOCKER' : (stateTok === 'attacking' || sideTok.includes('attacking') ? 'ATTACKER' : 'BATTLING'),
        expectedState: stateTok.includes('refreshed') ? 'REFRESHED' : (stateTok.includes('exhausted') ? 'EXHAUSTED' : null),
        filter,
        rawText: raw
      };
    }
  }

  // ZONE_CARD_COUNT
  const allTrashMatch = raw.match(/^(?:if|while)\s+(?:every|all)\s+cards?\s+in\s+your\s+trash\s+(?:has|have|are)\s+(?:the\s+)?(?:(red|purple|green|white|yellow|blue)|"([^"]+)"\s+family)$/i);
  if (allTrashMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.ZONE_CARD_COUNT,
      side: 'self',
      zone: 'grave',
      matchAll: true,
      filter: {
        ...(allTrashMatch[1] ? { color: allTrashMatch[1].toLowerCase() } : {}),
        ...(allTrashMatch[2] ? { family: allTrashMatch[2] } : {})
      },
      rawText: raw
    };
  }
  const zoneThereIsMatch = raw.match(/^(?:if|while)\s+there\s+(?:is|are)\s+(any|no|[a-z0-9]+)(?:\s+(or\s+more|or\s+less|or\s+fewer))?\s+(.+?)\s+in\s+(your|the\s+opposing|opponent's)\s+(trash|grave|hand|removed\s+zone)$/i);
  if (zoneThereIsMatch) {
    const qty = zoneThereIsMatch[1].toLowerCase();
    const filter = parseCardFilterPhrase(zoneThereIsMatch[3]);
    if (filter) {
      const zTok = zoneThereIsMatch[5].toLowerCase();
      const expected = qty === 'no' ? 0 : (qty === 'any' ? 1 : parseConditionNumber(qty));
      if (expected !== null) {
        return {
          kind: 'STRUCTURED_CONDITION',
          type: CONDITION_TYPES.ZONE_CARD_COUNT,
          side: /opposing|opponent/.test(zoneThereIsMatch[4].toLowerCase()) ? 'opponent' : 'self',
          zone: (zTok === 'trash' || zTok === 'grave') ? 'grave' : (zTok.startsWith('removed') ? 'removed' : 'hand'),
          operator: qty === 'no' ? 'EQ' : (qty === 'any' ? 'GTE' : (parseThresholdOperator(zoneThereIsMatch[2] || 'or more') || 'GTE')),
          expected,
          filter,
          rawText: raw
        };
      }
    }
  }
  const zoneYouHaveMatch = raw.match(/^(?:if|while)\s+(you|the\s+opponent|opponent)\s+(?:have|has)\s+(no|[a-z0-9]+)(?:\s+(or\s+more|or\s+less|or\s+fewer))?\s+(.+?)\s+in\s+(?:your|their|the\s+opposing)?\s*(trash|grave|hand|removed\s+zone)$/i);
  if (zoneYouHaveMatch) {
    const qty = zoneYouHaveMatch[2].toLowerCase();
    const filter = parseCardFilterPhrase(zoneYouHaveMatch[4]);
    if (filter) {
      const zTok = zoneYouHaveMatch[5].toLowerCase();
      const expected = qty === 'no' ? 0 : (qty === 'any' ? 1 : parseConditionNumber(qty));
      if (expected !== null) {
        return {
          kind: 'STRUCTURED_CONDITION',
          type: CONDITION_TYPES.ZONE_CARD_COUNT,
          side: zoneYouHaveMatch[1].toLowerCase().includes('opponent') ? 'opponent' : 'self',
          zone: (zTok === 'trash' || zTok === 'grave') ? 'grave' : (zTok.startsWith('removed') ? 'removed' : 'hand'),
          operator: qty === 'no' ? 'EQ' : (qty === 'any' ? 'GTE' : (parseThresholdOperator(zoneYouHaveMatch[3] || 'or more') || 'GTE')),
          expected,
          filter,
          rawText: raw
        };
      }
    }
  }

  // FIELD_COMPOSITION onlyName ("If you control only "Zeus" as Nexuses")
  const onlyNexusMatch = raw.match(/^(?:if|while)\s+you\s+(?:control|have)\s+only\s+"([^"]+)"\s+as\s+nexuses$/i);
  if (onlyNexusMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.FIELD_COMPOSITION,
      side: 'self',
      subject: 'nexuses',
      onlyName: onlyNexusMatch[1],
      rawText: raw
    };
  }

  // 5. COND_CONTROL_CARD_TYPE_OR_FAMILY
  if (/^(?:if|while)\s+(?:you|the\s+opponent|opponent)\s+controls?\s+no\s+spirits$/i.test(s) || s === 'no spirits') {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: s.includes('opponent') ? 'opponent' : 'self',
      subject: 'FIELD',
      property: 'controlledCardCount',
      operator: 'EQ',
      expected: 0,
      filter: { cardType: 'Spirit' },
      rawText: raw
    };
  }
  const thereOnFieldMatch = raw.match(/^(?:if|while)\s+there\s+(?:is|are)\s+(any|no|[a-z0-9]+)(?:\s+(or\s+more|or\s+less|or\s+fewer))?\s+(.+?)\s+on\s+(your|the\s+opposing|opponent's)\s+field$/i);
  if (thereOnFieldMatch) {
    const qty = thereOnFieldMatch[1].toLowerCase();
    const filter = parseCardFilterPhrase(thereOnFieldMatch[3]);
    if (filter) {
      const expected = qty === 'no' ? 0 : (qty === 'any' ? 1 : parseConditionNumber(qty));
      if (expected !== null) {
        return {
          kind: 'STRUCTURED_CONDITION',
          type: CONDITION_TYPES.CONTROL_CARD,
          side: /opposing|opponent/.test(thereOnFieldMatch[4].toLowerCase()) ? 'opponent' : 'self',
          subject: 'FIELD',
          property: 'controlledCardCount',
          operator: qty === 'no' ? 'EQ' : (qty === 'any' ? 'GTE' : (parseThresholdOperator(thereOnFieldMatch[2] || 'or more') || 'GTE')),
          expected,
          filter,
          rawText: raw
        };
      }
    }
  }
  if (/^(?:if|while)\s+you\s+control\s+no\s+spirits\s+other\s+than\s+braves$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      subject: 'FIELD',
      property: 'controlledCardCount',
      operator: 'EQ',
      expected: 0,
      filter: { cardType: 'spirit', excludeCardType: 'brave' },
      rawText: raw
    };
  }
  if (/^(?:if|while)\s+you\s+control\s+(?:a|an|any)\s+saga\s+brave$/i.test(s)) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      subject: 'FIELD',
      property: 'controlledCardCount',
      operator: 'GTE',
      expected: 1,
      filter: { cardType: 'brave', sagaBrave: true, includeAttachedBraves: true },
      rawText: raw
    };
  }
  const ctrlBareQuotedMatch = raw.match(/^(?:if|while)\s+(you|the\s+opponent|your\s+opponent|opponent)\s+(control|controls|doesn't control|don't control|do not control|does not control)\s+(?:(?:a|an|any)\s+)?(?:(spirit|ultimate|grandwalker\s+nexus|nexus|brave)\s+named\s+)?"([^"]+)"(?:\s+on\s+(?:your|their)\s+field)?$/i);
  if (ctrlBareQuotedMatch) {
    const who = ctrlBareQuotedMatch[1].toLowerCase();
    const isNeg = /n't|\bnot\b/i.test(ctrlBareQuotedMatch[2]);
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: who.includes('opponent') ? 'opponent' : 'self',
      subject: 'FIELD',
      property: 'controlledCardCount',
      operator: isNeg ? 'EQ' : 'GTE',
      expected: isNeg ? 0 : 1,
      filter: {
        name: ctrlBareQuotedMatch[4],
        ...(ctrlBareQuotedMatch[3] ? { cardType: ctrlBareQuotedMatch[3].toLowerCase() } : {})
      },
      rawText: raw
    };
  }
  const ctrlMatch = raw.match(/^(?:if|while)\s+(you\s+or\s+the\s+opponent|either\s+player|you|the\s+opponent|your\s+opponent|opponent)\s+(control|controls|doesn't control|don't control|do not control|does not control)\s+(any|a|an|no|[a-z0-9]+)\s+(.+)$/i);
  if (ctrlMatch) {
    const who = ctrlMatch[1].toLowerCase();
    const side = (who.includes('you or') || who.includes('either')) ? 'both' : (who.includes('opponent') ? 'opponent' : 'self');
    const verb = ctrlMatch[2].toLowerCase();
    const isNegatedVerb = /n't|\bnot\b/.test(verb);
    const qtyToken = ctrlMatch[3].toLowerCase();
    let rest = ctrlMatch[4].trim();
    let operator = 'GTE';
    let expected = 1;

    if (isNegatedVerb || qtyToken === 'no') {
      operator = 'EQ';
      expected = 0;
    } else if (qtyToken !== 'any' && qtyToken !== 'a' && qtyToken !== 'an') {
      const num = parseConditionNumber(qtyToken);
      if (num !== null) {
        const modMatch = rest.match(/^(or more|or less|or fewer)\s+(.+)$/i);
        if (modMatch) {
          operator = parseThresholdOperator(modMatch[1]) || 'GTE';
          expected = num;
          rest = modMatch[2].trim();
        } else {
          operator = 'GTE';
          expected = num;
        }
      }
    }

    // Try simple filter forms first, then shared parseCardFilterPhrase
    let filter = parseCardFilterPhrase(rest);
    if (!filter) {
      const quotedMatch = rest.match(/^"([^"]+)"(?:-named)?(?:\s+family)?(?:\s+(spirit|ultimate|grandwalker nexus|nexus|brave))(?:es|s)?$/i);
      if (quotedMatch) {
        filter = {};
        if (rest.toLowerCase().includes('family')) filter.family = quotedMatch[1];
        else filter.name = quotedMatch[1];
        if (quotedMatch[2]) filter.cardType = quotedMatch[2];
      } else {
        const famTypeMatch = rest.match(/^([a-z0-9\-\s]+?)\s+family\s+(spirit|ultimate|grandwalker nexus|nexus|brave)(?:es|s)?$/i);
        if (famTypeMatch) {
          filter = { family: famTypeMatch[1].trim(), cardType: famTypeMatch[2] };
        }
      }
    }
    if (filter) {
      return {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.CONTROL_CARD,
        side,
        subject: 'FIELD',
        property: 'controlledCardCount',
        operator,
        expected,
        filter,
        rawText: raw
      };
    }
  }

  // Stage I3 Extended Condition Grammar Rules
  if (/^if\s+your\s+\[?soul\s+core\]?\s+is\s+banished$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SOUL_CORE_LOCATION, zone: 'banished_from_game', side: 'self', rawText: raw };
  }
  if (/^if\s+not$/i.test(raw) ||
      /^if\s+you\s+(?:don't|do\s+not)(?:\s+summon\s+it)?$/i.test(raw) ||
      /^if\s+not\s+summoning$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.PREVIOUS_OP_SUCCESS, check: 'negated', rawText: raw };
  }
  if (/^if\s+that\s+card'?s\s+cost\s+is\s+equal\s+(?:to\s+)?or\s+(?:inferior|less)\s+(?:to|than)\s+the\s+attacking\s+target'?s$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD, stat: 'COST', compareTo: 'ATTACK_TARGET', operator: 'LTE', rawText: raw };
  }
  if (/^if\s+(?:that|the)\s+(?:spirit|ultimate)\s+is\s+brought\s+to\s+0\s+bp(?:\s+by\s+this\s+effect|\s+for\s+the\s+first\s+time\s+this\s+turn)?$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD, stat: 'BP', operator: 'EQ', expected: 0, subject: 'PREVIOUS_TARGET', rawText: raw };
  }
  if (/^if\s+(?:it|this\s+(?:spirit|ultimate))\s+(?:was|is)\s+in\s+battle$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BATTLING_STATE, target: 'self', requiresSelfStack: false, rawText: raw };
  }
  if (/^if\s+the\s+lvs?\s+are\s+the\s+same$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD, stat: 'LEVEL', compareTo: 'OPPONENT_BATTLER', operator: 'EQ', rawText: raw };
  }
  const symColsMatch = raw.match(/^if\s+you\s+have\s+([a-z0-9]+)\s+or\s+more\s+symbol\s+colors$/i);
  if (symColsMatch) {
    const exp = parseConditionNumber(symColsMatch[1]);
    if (exp !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COLOR_SYMBOL, distinctColors: true, operator: 'GTE', expected: exp, side: 'self', rawText: raw };
    }
  }
  if (/^if\s+(?:there\s+are\s+no|you\s+have\s+no)\s+ex\s+symbols?\s+in\s+your\s+trash$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ZONE_CARD_COUNT, zone: 'grave', side: 'self', filter: { name: 'EX Symbol' }, operator: 'EQ', expected: 0, rawText: raw };
  }
  const oppHandMatch = raw.match(/^(?:if|when|while)\s+the\s+opponent\s+has\s+([a-z0-9]+)\s+or\s+(more|fewer|less)\s+cards\s+in\s+(?:the|their)\s+hand$/i);
  if (oppHandMatch) {
    const exp = parseConditionNumber(oppHandMatch[1]);
    if (exp !== null) {
      const op = /fewer|less/i.test(oppHandMatch[2]) ? 'LTE' : 'GTE';
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ZONE_CARD_COUNT, zone: 'hand', side: 'opponent', operator: op, expected: exp, filter: {}, rawText: raw };
    }
  }
  const braveFamMatch = raw.match(/^if\s+you\s+control\s+any\s+brave\s+spirit\s+that\s+is\s+braved\s+to\s+an?\s+"([^"]+)"\s+family\s+brave$/i);
  if (braveFamMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BRAVE_STACK_STATE, side: 'self', req: { family: braveFamMatch[1].trim() }, rawText: raw };
  }
  if (/^(?:if|when)\s+(?:any\s+opposing\s+(?:spirit|nexus)|your(?:\s+[a-z]+)?\s+spirits?)\s+(?:was|were|is)\s+(?:depleted\/)?destroyed(?:\s+by\s+.*effects?)?(?:\s+this\s+turn)?$/i.test(raw)) {
    const side = /opposing/i.test(raw) ? 'opponent' : 'self';
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.TURN_HISTORY, metric: 'destructionOccurred', side, rawText: raw };
  }
  if (/^if\s+this\s+card\s+was\s+used\s+from\s+the\s+trash$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_ZONE_STATE, zone: 'grave', rawText: raw };
  }
  if (/^if\s+this\s+spirit\s+can\s+attack$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.STACK_STATE, expectedState: 'CAN_ATTACK', rawText: raw };
  }
  const selfLvMatch = raw.match(/^(?:if|while)\s+this\s+spirit\s+is\s+(?:at\s+)?lv(\d+)(\s+or\s+higher|\+)?$/i);
  if (selfLvMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD, stat: 'LEVEL', subject: 'SELF', operator: selfLvMatch[2] ? 'GTE' : 'EQ', expected: parseInt(selfLvMatch[1], 10), rawText: raw };
  }
  if (/^if\s+your\s+life\s+was\s+reduced\s+(?:during\s+)?this\s+turn$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.TURN_HISTORY, metric: 'lifeReduced', side: 'self', expectedBoolean: true, rawText: raw };
  }
  const stepParenMatch = raw.match(/^(?:if\s+it['’]s|during)\s+\(?(opposing|your)\s+attack\s+step\)?$/i);
  if (stepParenMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.TURN_STEP_STATE, step: 'ATTACK', side: /opposing/i.test(stepParenMatch[1]) ? 'opponent' : 'self', rawText: raw };
  }
  const typoCounterMatch = raw.match(/^if\s+your\s+have\s+([a-z0-9]+)\s+or\s+more\s+counters?$/i);
  if (typoCounterMatch) {
    const exp = parseConditionNumber(typoCounterMatch[1]);
    if (exp !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COUNTER_THRESHOLD, side: 'self', operator: 'GTE', expected: exp, rawText: raw };
    }
  }
  const multiMirageMatch = raw.match(/^if\s+you\s+have\s+an?\s+(red|purple|green|white|yellow|blue)\/(red|purple|green|white|yellow|blue)\s+mirage\s+set$/i);
  if (multiMirageMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BURST_OR_MIRAGE_SET, side: 'self', checkMirage: true, colors: [multiMirageMatch[1], multiMirageMatch[2]], rawText: raw };
  }
  if (/^while\s+the\s+opposing\s+\[soul\s+core\]\s+isn['’]t\s+in\s+(?:the\s+)?reserve$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SOUL_CORE_LOCATION, side: 'opponent', zone: 'reserve', negated: true, rawText: raw };
  }
  const bravedCountMatch = raw.match(/^while\s+braved\s+to\s+(one|two|three|\d+)\s+(?:or\s+more\s+)?braves?$/i);
  if (bravedCountMatch) {
    const minB = parseConditionNumber(bravedCountMatch[1]);
    if (minB !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BRAVE_STACK_STATE, check: 'isBraved', minBraves: minB, rawText: raw };
    }
  }
  const facedownRemMatch = raw.match(/^if\s+there\s+are\s+(one|two|three|four|five|\d+)\s+or\s+more\s+facedown\s+cards?\s+(?:on|in)\s+your\s+removed\s+zone$/i);
  if (facedownRemMatch) {
    const exp = parseConditionNumber(facedownRemMatch[1]);
    if (exp !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ZONE_CARD_COUNT, zone: 'removed', side: 'self', filter: { facedown: true }, operator: 'GTE', expected: exp, rawText: raw };
    }
  }
  const songMagicFieldMatch = raw.match(/^if\s+you\s+have\s+any\s+\[([^\]]+)\]\s+magic\s+card\s+on\s+your\s+field$/i);
  if (songMagicFieldMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', filter: { family: songMagicFieldMatch[1].trim(), types: ['Magic'] }, operator: 'GTE', expected: 1, rawText: raw };
  }
  const famResultMatch = raw.match(/^if\s+(?:that['’]s\s+a|all\s+those\s+cards\s+have)\s+"([^"]+)"(?:\s*\/\s*"([^"]+)")?(?:\s*\/\s*"([^"]+)")?(?:\s*\/\s*"([^"]+)")?\s+family(?:\s+card)?$/i);
  if (famResultMatch) {
    const fams = [famResultMatch[1], famResultMatch[2], famResultMatch[3], famResultMatch[4]].filter(Boolean).map(s => s.trim());
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'families', families: fams, matchAll: /^if\s+all/i.test(raw), rawText: raw };
  }

  // K.1.5 Team Presence & Top Failure Pattern Remediation
  if (/^if\s+possible$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LEGACY_CONTEXT_CONDITION, legacyKey: 'if_possible', alwaysTrue: true, rawText: raw };
  }

  // Team conditions:
  // "If all your Spirits/Nexuses have [Red Stella]"
  const allTeamMatch = raw.match(/^if\s+all\s+(?:of\s+)?your\s+(spirits|spirits\/nexuses|spirits\/ultimates|nexuses)\s+have\s+\[([^\]]+)\]$/i);
  if (allTeamMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TEAM_PRESENCE,
      mode: 'ALL_CONTROLLED_HAVE_TEAM',
      subject: allTeamMatch[1].toLowerCase(),
      team: allTeamMatch[2].trim(),
      side: 'self',
      rawText: raw
    };
  }
  // "While you control three or more Spirits with different team names"
  const diffTeamMatch = raw.match(/^(?:if|while)\s+you\s+control\s+(two|three|four|\d+)\s+or\s+more\s+(?:spirits|cards)\s+with\s+different\s+team\s+names$/i);
  if (diffTeamMatch) {
    const minTeams = parseConditionNumber(diffTeamMatch[1]) || 3;
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TEAM_PRESENCE,
      mode: 'DISTINCT_TEAM_COUNT',
      minTeams,
      side: 'self',
      rawText: raw
    };
  }
  // "If/While you control [N or more] (exhausted) [Team] Spirits"
  const ctrlTeamCountMatch = raw.match(/^(?:if|while)\s+you\s+control\s+(?:(a|an|any|one|two|three|four|five|\d+)(?:\s+or\s+more)?\s+)?(?:(exhausted|refreshed)\s+)?\[([^\]]+)\]\s+(spirit|spirits|nexus|nexuses)/i);
  if (ctrlTeamCountMatch) {
    const numTok = (ctrlTeamCountMatch[1] || '1').toLowerCase();
    const minCount = (numTok === 'a' || numTok === 'an' || numTok === 'any') ? 1 : (parseConditionNumber(numTok) || 1);
    const stFilter = ctrlTeamCountMatch[2] ? ctrlTeamCountMatch[2].toUpperCase() : null;
    const typeStr = ctrlTeamCountMatch[4].toLowerCase().includes('nexus') ? 'Nexus' : 'Spirit';
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TEAM_PRESENCE,
      mode: 'CONTROL_TEAM_COUNT',
      team: ctrlTeamCountMatch[3].trim(),
      operator: 'GTE',
      expected: minCount,
      stackState: stFilter,
      cardType: typeStr,
      side: 'self',
      rawText: raw
    };
  }
  // "If this Spirit has [Team]"
  const selfTeamMatch = raw.match(/^(?:if|while)\s+this\s+(?:spirit|ultimate|brave|nexus)\s+has\s+\[([^\]]+)\]$/i);
  if (selfTeamMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.TEAM_PRESENCE,
      mode: 'SELF_HAS_TEAM',
      team: selfTeamMatch[1].trim(),
      side: 'self',
      rawText: raw
    };
  }

  // "While braved to/with ..." (quoted names, family Spirits, -named Spirits)
  const bravedFamSpiritMatch = raw.match(/^while\s+braved\s+(?:to|with)\s+(?:an?\s+)?"([^"]+)"\s+family\s+(?:spirit|ultimate)/i);
  if (bravedFamSpiritMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BRAVE_STACK_STATE,
      check: 'isBraved',
      checkBothHostAndBrave: true,
      braveRequirement: { family: bravedFamSpiritMatch[1].trim() },
      rawText: raw
    };
  }
  const bravedNameMatch = raw.match(/^while\s+braved\s+(?:to|with)\s+(?:an?\s+)?"([^"]+)"(?:-named(?:\s+(?:spirit|ultimate|brave))?)?$/i);
  if (bravedNameMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BRAVE_STACK_STATE,
      check: 'isBraved',
      checkBothHostAndBrave: true,
      braveRequirement: { name: bravedNameMatch[1].trim(), exactName: false },
      rawText: raw
    };
  }

  // Note: active cost-payment actions like "If you banish the [Soul Core] on this Ultimate from the game" remain intentionally UNSUPPORTED as passive conditions (COND-TRISTATE-01 / WPC-4C5-COND).

  // "While your "A"/"B"(/"C") is attacking" / "While this Spirit or your "X" family Spirit is attacking"
  const multiNameAttackMatch = raw.match(/^while\s+your\s+("[^"]+"(?:\s*\/\s*"[^"]+")*)\s+is\s+(attacking|blocking)$/i);
  if (multiNameAttackMatch) {
    const names = [...multiNameAttackMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT,
      role: multiNameAttackMatch[2].toUpperCase() === 'BLOCKING' ? 'BLOCKER' : 'ATTACKER',
      side: 'self',
      filter: { names },
      rawText: raw
    };
  }
  const selfOrFamAttackMatch = raw.match(/^while\s+this\s+(?:spirit|ultimate)\s+or\s+your\s+"([^"]+)"\s+family\s+(?:spirit|ultimate)\s+is\s+(attacking|blocking)$/i);
  if (selfOrFamAttackMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT,
      role: selfOrFamAttackMatch[2].toUpperCase() === 'BLOCKING' ? 'BLOCKER' : 'ATTACKER',
      side: 'self',
      allowSelfSource: true,
      filter: { family: selfOrFamAttackMatch[1].trim() },
      rawText: raw
    };
  }

  // "If/While you control any "A"/"B"(/"C")-named Spirit"
  const ctrlMultiNameMatch = raw.match(/^(?:if|while)\s+you\s+control\s+(?:an?\s+|any\s+|(one|two|three|\d+)\s+or\s+more\s+)?("[^"]+"(?:\s*\/\s*"[^"]+")*)-named\s+(spirit|ultimate|brave|nexus)s?$/i);
  if (ctrlMultiNameMatch) {
    const names = [...ctrlMultiNameMatch[2].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    const minC = ctrlMultiNameMatch[1] ? (parseConditionNumber(ctrlMultiNameMatch[1]) || 1) : 1;
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      operator: 'GTE',
      expected: minC,
      filter: { cardType: ctrlMultiNameMatch[3], names },
      rawText: raw
    };
  }

  // "If every Spirit/Ultimate you control has "X" family"
  const everyFamMatch = raw.match(/^if\s+every\s+(spirit|ultimate|spirit\/ultimate)\s+you\s+control\s+has\s+"([^"]+)"\s+family$/i);
  if (everyFamMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.FIELD_COMPOSITION,
      side: 'self',
      subject: everyFamMatch[1],
      family: everyFamMatch[2].trim(),
      rawText: raw
    };
  }

  // "If you control any Brave Spirit that is braved to an "X" family Brave"
  const braveFamCtrlMatch = raw.match(/^(?:if|while)\s+you\s+control\s+any\s+brave\s+spirit\s+that\s+is\s+braved\s+to\s+(?:an?\s+)?"([^"]+)"\s+family\s+brave$/i);
  if (braveFamCtrlMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      operator: 'GTE',
      expected: 1,
      filter: { cardType: 'Spirit', isBraveSpirit: true, bravedWithFamily: braveFamCtrlMatch[1].trim() },
      rawText: raw
    };
  }

  // "If you control any / N or more Spirit(s) with When Blocks effect(s)"
  const ctrlTimingMatch = raw.match(/^(?:if|while)\s+you\s+control\s+(?:any|(one|two|three|four|\d+)\s+or\s+more)\s+spirits?\s+with\s+when\s+(blocks|attacks|summoned)\s+effects?$/i);
  if (ctrlTimingMatch) {
    const exp = ctrlTimingMatch[1] ? (parseConditionNumber(ctrlTimingMatch[1]) || 1) : 1;
    const timingKey = `WHEN_${ctrlTimingMatch[2].toUpperCase()}`;
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      operator: 'GTE',
      expected: exp,
      filter: { cardType: 'Spirit', hasTiming: timingKey },
      rawText: raw
    };
  }

  // CARD_RESULT: "If that card has "X"(/"Y") family" / "If that('s| card is) "A"/"B"-named"
  const thatCardFamMatch = raw.match(/^if\s+that\s+card\s+has\s+("[^"]+"(?:\s*\/\s*"[^"]+")*)\s+family$/i);
  if (thatCardFamMatch) {
    const fams = [...thatCardFamMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'families', families: fams, matchAll: false, rawText: raw };
  }
  const thatCardNamesMatch = raw.match(/^if\s+(?:that['’]s|that\s+card\s+is)\s+("[^"]+"(?:\s*\/\s*"[^"]+")*)(?:-named)?$/i);
  if (thatCardNamesMatch) {
    const names = [...thatCardNamesMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'names', names, rawText: raw };
  }

  // "If this Spirit is "X""
  const selfNameMatch = raw.match(/^if\s+this\s+(?:spirit|ultimate|brave|nexus)\s+is\s+"([^"]+)"$/i);
  if (selfNameMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.STACK_STATE, check: 'selfName', expectedName: selfNameMatch[1].trim(), rawText: raw };
  }

  // K1-BATCH-02 Rule Extensions:
  // 1. PRE_ADVENT_CARD: "If/While there is any \"X\" (family) among this Spirit's/Ultimate's pre-advent cards"
  const preAdvMatch = raw.match(/^(?:if|while)\s+there\s+(?:is|are)\s+(?:any\s+)?"([^"]+)"(?:\s+family)?\s+(?:cards?\s+)?(?:among|beneath|under)\s+this\s+(?:spirit|ultimate)'?s?\s+pre-?advent\s+cards?(?:\s+beneath\s+this\s+(?:spirit|ultimate))?$/i);
  if (preAdvMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.PRE_ADVENT_CARD,
      check: raw.toLowerCase().includes('family') ? 'family' : 'name',
      expected: preAdvMatch[1].trim(),
      rawText: raw
    };
  }

  // 2. ACTIVATION_ORIGIN: summon/burst/use origin checks
  const summonedFromMatch = raw.match(/^if\s+(?:this\s+(?:spirit|ultimate|card)\s+(?:is|was)\s+)?summoned\s+from\s+(?:the\s+|your\s+)?(deck|trash|hand|removed zone)$/i);
  if (summonedFromMatch) {
    const zTok = summonedFromMatch[1].toLowerCase();
    const zone = zTok === 'trash' ? 'grave' : (zTok.includes('removed') ? 'removed' : zTok);
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ACTIVATION_ORIGIN, originType: 'SUMMON_ZONE', expectedZone: zone, rawText: raw };
  }
  const summonedByEffectMatch = raw.match(/^if\s+this\s+(?:spirit|ultimate|card)\s+was\s+summoned\s+by\s+the\s+effect\s+of\s+\[([^\]]+)\]$/i);
  if (summonedByEffectMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ACTIVATION_ORIGIN, originType: 'SUMMON_EFFECT_NAME', expectedName: summonedByEffectMatch[1].trim(), rawText: raw };
  }
  const usedViaMatch = raw.match(/^if\s+this\s+card\s+was\s+used\s+via\s+\[([^\]]+)\]$/i);
  if (usedViaMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ACTIVATION_ORIGIN, originType: 'USED_VIA_KEYWORD', expectedKeyword: usedViaMatch[1].trim(), rawText: raw };
  }
  const burstViaEffMatch = raw.match(/^if\s+this\s+burst\s+was\s+activated\s+via\s+(?:a\s+|an\s+)?"([^"]+)"-named\s+effect$/i);
  if (burstViaEffMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ACTIVATION_ORIGIN, originType: 'BURST_EFFECT_NAME', expectedName: burstViaEffMatch[1].trim(), rawText: raw };
  }
  const burstDestroyedFamMatch = raw.match(/^if\s+this\s+burst\s+was\s+activated\s+when\s+(?:an?\s+)?"([^"]+)"\s+family\s+(?:spirit|ultimate)\s+was\s+destroyed$/i);
  if (burstDestroyedFamMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ACTIVATION_ORIGIN, originType: 'BURST_DESTROYED_FAMILY', expectedFamily: burstDestroyedFamMatch[1].trim(), rawText: raw };
  }

  // 3. CONTROL_CARD extensions: multi-name without -named, another, both A and B, Contract Spirit, Rebirth, BP or less, differently named, braved to N+ Braves, except self & 1 named, typo trailing quote, Song Magic on Field
  const bothCtrlMatch = raw.match(/^(?:if|while)\s+you\s+control\s+both\s+"([^"]+)"\s+and\s+"([^"]+)"$/i);
  if (bothCtrlMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.COMPOUND,
      combinator: 'AND',
      conditions: [
        { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: 1, filter: { name: bothCtrlMatch[1].trim() }, rawText: raw },
        { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: 1, filter: { name: bothCtrlMatch[2].trim() }, rawText: raw }
      ],
      rawText: raw
    };
  }
  const anotherCtrlMatch = raw.match(/^(?:if|while)\s+you\s+control\s+another\s+("[^"]+"(?:\s*\/\s*"[^"]+")*)-named\s+(spirit|ultimate|brave|nexus)s?$/i);
  if (anotherCtrlMatch) {
    const names = [...anotherCtrlMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: 1, filter: { excludeSelf: true, cardType: anotherCtrlMatch[2], names }, rawText: raw };
  }
  const multiQuotedCtrlMatch = raw.match(/^(?:if|while)\s+you\s+control\s+(?:an?\s+|any\s+|(one|two|three|four|\d+)\s+or\s+more\s+)?("[^"]+"(?:\s*\/\s*"[^"]+")*)(?:\s+(spirit|ultimate|brave|nexus)s?)?$/i);
  if (multiQuotedCtrlMatch) {
    const names = [...multiQuotedCtrlMatch[2].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    const minC = multiQuotedCtrlMatch[1] ? (parseConditionNumber(multiQuotedCtrlMatch[1]) || 1) : 1;
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: minC, filter: { ...(multiQuotedCtrlMatch[3] ? { cardType: multiQuotedCtrlMatch[3] } : {}), names }, rawText: raw };
  }
  const contractCtrlMatch = raw.match(/^(?:if|while)\s+you\s+control\s+any\s+"([^"]+)"\s+contract\s+spirit$/i);
  if (contractCtrlMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: 1, filter: { cardType: 'Spirit', name: contractCtrlMatch[1].trim(), contractSpirit: true }, rawText: raw };
  }
  if (/^(?:if|while)\s+you\s+control\s+any\s+rebirth\s+spirit\/rebirth\s+nexus$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: 1, filter: { cardTypes: ['Spirit', 'Nexus'], keyword: 'Rebirth' }, rawText: raw };
  }
  const oppBpCtrlMatch = raw.match(/^(?:if|while)\s+(?:the\s+|your\s+)?opponent\s+controls?\s+any\s+(\d+)\s+bp\s+or\s+less\s+(spirit|ultimate|spirit\/ultimate)s?$/i);
  if (oppBpCtrlMatch) {
    const types = oppBpCtrlMatch[2].toLowerCase().includes('/') ? ['Spirit', 'Ultimate'] : [oppBpCtrlMatch[2]];
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'opponent', operator: 'GTE', expected: 1, filter: { cardTypes: types, bpLte: Number(oppBpCtrlMatch[1]) }, rawText: raw };
  }
  const minBravesCtrlMatch = raw.match(/^(?:if|while)\s+you\s+control\s+any\s+"([^"]+)"\s+that\s+is\s+braved\s+to\s+(one|two|three|\d+)\s+or\s+more\s+braves?$/i);
  if (minBravesCtrlMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: 1, filter: { name: minBravesCtrlMatch[1].trim(), minBraves: parseConditionNumber(minBravesCtrlMatch[2]) || 2 }, rawText: raw };
  }
  const exactNameCtrlTypoMatch = raw.match(/^(?:if|while)\s+you\s+control\s+any\s+exactly-named\s+"([^"]+)"?$/i);
  if (exactNameCtrlTypoMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: 1, filter: { name: exactNameCtrlTypoMatch[1].trim(), exactName: true }, rawText: raw };
  }
  const diffNamedMatch = raw.match(/^(?:if|while)\s+you\s+control\s+(one|two|three|four|five|six|\d+)\s+or\s+more\s+differently\s+named\s+\[([^\]]+)\]\s+(spirit|ultimate)s?$/i);
  if (diffNamedMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      operator: 'GTE',
      expected: parseConditionNumber(diffNamedMatch[1]) || 1,
      differentlyNamed: true,
      filter: { cardType: diffNamedMatch[3], family: diffNamedMatch[2].trim() },
      rawText: raw
    };
  }
  const exceptSelfAndOneMatch = raw.match(/^if\s+you\s+control\s+no\s+spirits?(?:\/ultimates?)?\s+except\s+this\s+one\s+and\s+one\s+"([^"]+)"$/i);
  if (exceptSelfAndOneMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.CONTROL_CARD,
      side: 'self',
      mode: 'EXCEPT_SELF_AND_ONE_NAMED',
      partnerName: exceptSelfAndOneMatch[1].trim(),
      rawText: raw
    };
  }
  const fieldMagicMatch = raw.match(/^if\s+you\s+have\s+(one|two|three|four|five|\d+)\s+or\s+more\s+\[([^\]]+)\]\s+magic\s+cards?\s+on\s+your\s+field$/i);
  if (fieldMagicMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CONTROL_CARD, side: 'self', operator: 'GTE', expected: parseConditionNumber(fieldMagicMatch[1]) || 1, filter: { cardType: 'Magic', keyword: fieldMagicMatch[2].trim() }, rawText: raw };
  }

  // 4. BRAVE_STACK_STATE extensions
  const bravedMultiFamMatch = raw.match(/^while\s+braved\s+(?:to|with)\s+(?:an?\s+)?("[^"]+"(?:\s*\/\s*"[^"]+")*)\s+family\s+(?:spirit|ultimate)$/i);
  if (bravedMultiFamMatch) {
    const fams = [...bravedMultiFamMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BRAVE_STACK_STATE, check: 'isBraved', checkBothHostAndBrave: true, braveRequirement: { families: fams }, rawText: raw };
  }
  if (/^while\s+braved\s+to\s+an?\s+imagine\s+brave$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BRAVE_STACK_STATE, check: 'isBraved', braveRequirement: { imagineBrave: true }, rawText: raw };
  }
  const bravedExactMatch = raw.match(/^while\s+braved\s+to\s+(?:any\s+)?exactly-named\s+"([^"]+)"$/i);
  if (bravedExactMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BRAVE_STACK_STATE, check: 'isBraved', checkBothHostAndBrave: true, braveRequirement: { name: bravedExactMatch[1].trim(), exactName: true }, rawText: raw };
  }
  const bravedCostMatch = raw.match(/^while\s+braved\s+to\s+an?\s+originally\s+cost\s+(\d+)\s+or\s+(less|more)\s+(?:spirit|ultimate)$/i);
  if (bravedCostMatch) {
    const bound = Number(bravedCostMatch[1]);
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.BRAVE_STACK_STATE,
      check: 'isBraved',
      checkBothHostAndBrave: true,
      braveRequirement: bravedCostMatch[2].toLowerCase() === 'less' ? { costLte: bound } : { costGte: bound },
      rawText: raw
    };
  }
  const hostOrigFamMatch = raw.match(/^if\s+the\s+(?:spirit|ultimate)\s+it\s+braved\s+to\s+is\s+originally\s+in\s+the\s+"([^"]+)"\s+family$/i);
  if (hostOrigFamMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.BRAVE_STACK_STATE, check: 'hostFamily', family: hostOrigFamMatch[1].trim(), rawText: raw };
  }

  // 5. COUNTER_THRESHOLD extensions (discrete set 1/3/5/7, odd or N+, singular counter)
  const counterSetMatch = raw.match(/^(?:if|while)\s+(?:you\s+have|your\s+number\s+of\s+counters\s+is)\s+(\d+(?:\s*\/\s*\d+)+)(?:\s+counters?)?$/i);
  if (counterSetMatch) {
    const vals = counterSetMatch[1].split('/').map(n => Number(n.trim())).filter(Number.isFinite);
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COUNTER_THRESHOLD, side: 'self', allowedValues: vals, rawText: raw };
  }
  const counterSingMatch = raw.match(/^(?:if|while)\s+(?:your\s+)?counters?\s+(?:is|are)\s+(zero|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+or\s+(more|less|fewer)$/i);
  if (counterSingMatch) {
    const val = parseConditionNumber(counterSingMatch[1]);
    if (val !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COUNTER_THRESHOLD, side: 'self', operator: counterSingMatch[2].toLowerCase() === 'more' ? 'GTE' : 'LTE', expected: val, rawText: raw };
    }
  }
  const oddOrCounterMatch = raw.match(/^if\s+your\s+number\s+of\s+counters\s+is\s+an\s+odd\s+number\s+or\s+(\d+)\s+or\s+more$/i);
  if (oddOrCounterMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COUNTER_THRESHOLD, side: 'self', mode: 'ODD_OR_GTE', expected: Number(oddOrCounterMatch[1]), rawText: raw };
  }

  // 6. HAND_SIZE_THRESHOLD & ZONE_CARD_COUNT extensions
  const opposingHandThresholdMatch = raw.match(/^if\s+(?:your\s+)?opposing\s+hand\s+is\s+(zero|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+or\s+(more|less|fewer)$/i);
  if (opposingHandThresholdMatch) {
    const val = parseConditionNumber(opposingHandThresholdMatch[1]);
    if (val !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.HAND_SIZE_THRESHOLD, side: 'opponent', operator: opposingHandThresholdMatch[2].toLowerCase() === 'more' ? 'GTE' : 'LTE', expected: val, rawText: raw };
    }
  }
  const oppHandRemMatch = raw.match(/^if\s+the\s+opponent\s+has\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?\s+or\s+(more|less|fewer)\s+in\s+their\s+hand\s*\+\s*removed\s+zone$/i);
  if (oppHandRemMatch) {
    const val = parseConditionNumber(oppHandRemMatch[1]);
    if (val !== null) {
      return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.HAND_SIZE_THRESHOLD, side: 'opponent', zones: ['hand', 'removed'], operator: oppHandRemMatch[2].toLowerCase() === 'more' ? 'GTE' : 'LTE', expected: val, rawText: raw };
    }
  }
  if (/^if\s+the\s+total\s+number\s+of\s+cards\s+in\s+your\s+hand\s+and\s+removed\s+zone\s+is\s+equal\s+to\s+or\s+less\s+than\s+the\s+opponent'?s$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.HAND_SIZE_THRESHOLD, side: 'self', zones: ['hand', 'removed'], compareToOpponent: true, operator: 'LTE', rawText: raw };
  }
  if (/^if\s+there\s+is\s+any\s+face-?up\s+card\s+in\s+your\s+deck$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.ZONE_CARD_COUNT, side: 'self', zone: 'deck', operator: 'GTE', expected: 1, filter: { isFaceUp: true }, rawText: raw };
  }

  // 7. CARD_RESULT & SPIRIT_STAT_THRESHOLD extensions
  const namedSpiritCardResMatch = raw.match(/^if\s+(?:that|the\s+discarded)\s+card\s+is\s+(?:a\s+)?"([^"]+)"-named(?:\s+(spirit|ultimate|brave|nexus|magic))?(?:\s+card)?$/i);
  if (namedSpiritCardResMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'composite', name: namedSpiritCardResMatch[1].trim(), ...(namedSpiritCardResMatch[2] ? { cardTypes: [namedSpiritCardResMatch[2]] } : {}), rawText: raw };
  }
  const simpleDiscardedNameMatch = raw.match(/^if\s+the\s+discarded\s+card\s+is\s+"([^"]+)"-named$/i);
  if (simpleDiscardedNameMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'names', names: [simpleDiscardedNameMatch[1].trim()], rawText: raw };
  }
  const cardResFamsCardMatch = raw.match(/^if\s+it'?s\s+a\s+("[^"]+"(?:\s*\/\s*"[^"]+")*)\s+family\s+card$/i);
  if (cardResFamsCardMatch) {
    const fams = [...cardResFamsCardMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1].trim());
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'families', families: fams, matchAll: false, rawText: raw };
  }
  const discardedCostSlashMatch = raw.match(/^if\s+the\s+discarded\s+card\s+is\s+cost\s+(\d+(?:\s*\/\s*\d+)+)$/i);
  if (discardedCostSlashMatch) {
    const allowedCosts = discardedCostSlashMatch[1].split('/').map(n => Number(n.trim())).filter(Number.isFinite);
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'allowedCosts', allowedCosts, rawText: raw };
  }
  const targetBpMatch = raw.match(/^if\s+the\s+target\s+has\s+(\d+)\s+bp\s+or\s+(more|less)$/i);
  if (targetBpMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD, stat: 'BP', operator: targetBpMatch[2].toLowerCase() === 'more' ? 'GTE' : 'LTE', expected: Number(targetBpMatch[1]), rawText: raw };
  }
  if (/^if\s+that\s+card'?s\s+cost\s+is\s+equal\s+or\s+inferior\s+to\s+the\s+attacking\s+(?:spirit|target)'?s$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.SPIRIT_STAT_THRESHOLD, stat: 'COST', compareTo: 'ATTACK_TARGET', operator: 'LTE', rawText: raw };
  }
  const thatTeamFamMatch = raw.match(/^if\s+that\s+is\s+"([^"]+)"\s+or\s+an?\s+"([^"]+)"\s+family\s+(?:spirit|ultimate)\s+card\s+with\s+a\s+team$/i);
  if (thatTeamFamMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'nameOrFamilyWithTeam', name: thatTeamFamMatch[1].trim(), family: thatTeamFamMatch[2].trim(), rawText: raw };
  }
  const thatEffNameMatch = raw.match(/^if\s+that'?s\s+a\s+card\s+with\s+"([^"]+)"-named\s+effects?$/i);
  if (thatEffNameMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.CARD_RESULT, check: 'effectNamed', keyword: thatEffNameMatch[1].trim(), rawText: raw };
  }

  // 8. FIELD_COMPOSITION / STACK_STATE / ATTACKING_OR_BLOCKING_SPIRIT extensions
  const allNamedCtrlMatch = raw.match(/^while\s+all\s+(spirits|ultimates)\s+you\s+control\s+are\s+"([^"]+)"-named$/i);
  if (allNamedCtrlMatch) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.FIELD_COMPOSITION, side: 'self', subject: allNamedCtrlMatch[1], onlyName: allNamedCtrlMatch[2].trim(), exactName: false, rawText: raw };
  }
  if (/^if\s+this\s+(?:spirit|ultimate)\s+is\s+\[?during\s+advent\]?$/i.test(raw)) {
    return { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.STACK_STATE, expectedState: 'DURING_ADVENT', rawText: raw };
  }
  const teamAtkMatch = raw.match(/^while\s+your\s+"([^"]+)"\s+family\s+spirit\s+with\s+a\s+team\s+is\s+(attacking|blocking)$/i);
  if (teamAtkMatch) {
    return {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT,
      role: teamAtkMatch[2].toUpperCase() === 'BLOCKING' ? 'BLOCKER' : 'ATTACKER',
      side: 'self',
      filter: { family: teamAtkMatch[1].trim(), hasTeam: true },
      rawText: raw
    };
  }

  return null;
}

// ============================================================================
// Deterministic Evaluator
// ============================================================================

function resolveSourceStackFromState(state, ctx) {
  if (ctx?.contradictoryContext) {
    return { stack: null, conflict: true, reason: 'CONTRADICTORY_CONTEXT_FLAG' };
  }
  const srcStack = ctx?.sourceStack || null;
  const srcCard = ctx?.sourceCard || null;
  if (srcStack && srcCard?.id) {
    const matchesTop = srcStack.top?.id === srcCard.id;
    const matchesStack = srcStack.id === srcCard.id;
    const matchesBrave = Array.isArray(srcStack.braves) && srcStack.braves.some(b => b && b.id === srcCard.id);
    const matchesUnder = Array.isArray(srcStack.under) && srcStack.under.some(u => u && u.id === srcCard.id);
    if (srcStack.top?.id && !matchesTop && !matchesStack && !matchesBrave && !matchesUnder) {
      return { stack: null, conflict: true, reason: 'CONTRADICTORY_SOURCE_STACK_AND_CARD' };
    }
  }
  if (srcStack) {
    return { stack: srcStack, conflict: false };
  }
  if (state?.players) {
    for (const sideKey of ['player', 'opponent']) {
      const field = state.players[sideKey]?.field;
      if (!Array.isArray(field)) continue;
      for (const st of field) {
        if (!st) continue;
        if (ctx?.sourceStackId && (st.id === ctx.sourceStackId || st.stackId === ctx.sourceStackId || st.top?.id === ctx.sourceStackId)) {
          return { stack: st, conflict: false };
        }
        if (ctx?.targetStackId && (st.id === ctx.targetStackId || st.stackId === ctx.targetStackId || st.top?.id === ctx.targetStackId)) {
          return { stack: st, conflict: false };
        }
        if (srcCard?.id && (st.top?.id === srcCard.id || st.id === srcCard.id ||
          (Array.isArray(st.braves) && st.braves.some(b => b && b.id === srcCard.id)) ||
          (Array.isArray(st.under) && st.under.some(u => u && u.id === srcCard.id)))) {
          return { stack: st, conflict: false };
        }
      }
    }
  }
  return { stack: null, conflict: false };
}

function matchesBraveRequirement(braveCard, stack, req) {
  if (!braveCard) return false;
  if (!req) return true;
  if (req.sagaBrave && !(braveCard.isSaga || /saga/i.test(String(braveCard.subType || braveCard.type || '')) || cardMatchesFamily(braveCard, 'Saga') || cardHasKeyword(braveCard, stack, 'Saga'))) {
    return false;
  }
  if (req.imagineBrave && !(braveCard.isImagine || /imagine/i.test(String(braveCard.subType || braveCard.type || '')) || cardMatchesFamily(braveCard, 'Imagine') || /imagine/i.test(String(braveCard.name || '')) || cardHasKeyword(braveCard, stack, 'Imagine'))) {
    return false;
  }
  if (req.family && !cardMatchesFamily(braveCard, req.family)) return false;
  if (Array.isArray(req.families) && req.families.length > 0 && !req.families.some(f => cardMatchesFamily(braveCard, f))) return false;
  if (req.name && !cardMatchesName(braveCard, req.name, Boolean(req.exactName))) return false;
  if (req.color && !cardMatchesColor(braveCard, req.color)) return false;
  if (typeof req.costLte === 'number' && (typeof braveCard.cost !== 'number' || braveCard.cost > req.costLte)) return false;
  if (typeof req.costGte === 'number' && (typeof braveCard.cost !== 'number' || braveCard.cost < req.costGte)) return false;
  return true;
}

export function evaluateStructuredCondition(state, conditionInput, context = null) {
  if (!conditionInput) {
    return { result: CONDITION_RESULT.TRUE, reason: 'NO_CONDITION', conditionType: null, requiredContext: [] };
  }
  if (typeof conditionInput === 'string' && !conditionInput.trim()) {
    return { result: CONDITION_RESULT.TRUE, reason: 'EMPTY_CONDITION', conditionType: null, requiredContext: [] };
  }
  if (context && typeof context === 'object' && context.invalidContext === true) {
    return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'EXPLICIT_INVALID_CONTEXT', condition: conditionInput, conditionType: null, requiredContext: [] };
  }

  const cond = parseConditionToStructured(conditionInput);
  if (!cond) {
    return {
      result: CONDITION_RESULT.UNSUPPORTED,
      reason: 'UNSUPPORTED_CONDITION',
      condition: conditionInput,
      conditionType: null,
      requiredContext: []
    };
  }

  const ctx = context && typeof context === 'object' ? context : null;

  switch (cond.type) {
    case CONDITION_TYPES.LEGACY_CONTEXT_CONDITION: {
      if (cond.legacyKey === 'destroyed_by_opponent') {
        if (!ctx || ctx.wasDestroyedByOpponent === undefined) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_CONTEXT_DESTROYED_BY_OPPONENT', conditionType: cond.type, requiredContext: ['wasDestroyedByOpponent'] };
        }
        return { result: ctx.wasDestroyedByOpponent ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['wasDestroyedByOpponent'] };
      }
      if (cond.legacyKey === 'summoned_from_removed') {
        if (!ctx || ctx.summonFromRemoved === undefined) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_CONTEXT_SUMMONED_FROM_REMOVED', conditionType: cond.type, requiredContext: ['summonFromRemoved'] };
        }
        return { result: ctx.summonFromRemoved ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['summonFromRemoved'] };
      }
      if (cond.legacyKey === 'soul_core_used') {
        const used = ctx?.soulCoreUsed ?? ctx?.usedSoulCoreToPay ?? ctx?.sourceCard?.summonedWithSoulCore;
        if (used === undefined) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_CONTEXT_SOUL_CORE_USED', conditionType: cond.type, requiredContext: ['soulCoreUsed'] };
        }
        return { result: used ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['soulCoreUsed'] };
      }
      if (cond.legacyKey === 'if_possible' || cond.alwaysTrue) {
        return { result: CONDITION_RESULT.TRUE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: [] };
      }
      return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_CONDITION', condition: conditionInput, conditionType: cond.type, requiredContext: [] };
    }

    case CONDITION_TYPES.CONTROL_CARD: {
      const [side] = resolveTargetSides(cond.side || 'self', ctx);
      const p = state?.players?.[side];
      if (cond.mode === 'EXCEPT_SELF_AND_ONE_NAMED') {
        if (!p || !Array.isArray(p.field)) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
        }
        const units = p.field.filter(st => st?.top && (cardMatchesType(st.top, 'Spirit') || cardMatchesType(st.top, 'Ultimate')));
        const selfId = ctx?.sourceStack?.id || ctx?.sourceCard?.id || null;
        const others = units.filter(st => !(selfId && (st.id === selfId || st.top?.id === selfId)));
        const ok = units.length === 2 && others.length === 1 && cardMatchesName(others[0].top, cond.partnerName, false);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: units.length };
      }
      if (cond.differentlyNamed) {
        if (!p || !Array.isArray(p.field)) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
        }
        const names = new Set();
        for (const st of p.field) {
          if (!st?.top || getStackController(st, side) !== side) continue;
          if (cardMatchesFilterSpec(st.top, st, cond.filter || {}, state, ctx)) {
            names.add(String(st.top.name || st.top.cardNumber || st.id).toLowerCase());
          }
        }
        const ok = compareNumeric(names.size, cond.operator || 'GTE', cond.expected ?? 1);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: names.size };
      }
      const count = countControlledMatchingCards(state, cond.side, cond.filter || {}, ctx);
      if (count === null) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
      }
      const ok = compareNumeric(count, cond.operator || 'GTE', cond.expected ?? 1);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: count };
    }

    case CONDITION_TYPES.COUNTER_THRESHOLD: {
      const [side] = resolveTargetSides(cond.side, ctx);
      const p = state?.players?.[side];
      if (!p || typeof p.counters !== 'number') {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_COUNTERS_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'counters'] };
      }
      let ok;
      if (cond.mode === 'ODD_OR_GTE') {
        ok = (p.counters % 2 === 1) || p.counters >= (cond.expected ?? 0);
      } else if (Array.isArray(cond.allowedValues)) {
        ok = cond.allowedValues.includes(p.counters);
      } else {
        ok = compareNumeric(p.counters, cond.operator || 'GTE', cond.expected ?? 0);
      }
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'counters'], actual: p.counters };
    }

    case CONDITION_TYPES.LIFE_THRESHOLD: {
      const [side] = resolveTargetSides(cond.side, ctx);
      const p = state?.players?.[side];
      if (!p || typeof p.life !== 'number') {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_LIFE_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'life'] };
      }
      const ok = compareNumeric(p.life, cond.operator || 'LTE', cond.expected ?? 0);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'life'], actual: p.life };
    }

    case CONDITION_TYPES.SOUL_CORE_ON_SPIRIT: {
      if (cond.subject === 'SELF_STACK') {
        let targetStack = ctx?.sourceStack || null;
        if (!targetStack && ctx?.targetStackId && state?.players) {
          for (const s of ['player', 'opponent']) {
            targetStack = (state.players[s]?.field || []).find(st => st.id === ctx.targetStackId) || null;
            if (targetStack) break;
          }
        }
        if (!targetStack) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_SOURCE_STACK_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
        const [expectedSide] = resolveTargetSides(cond.side, ctx);
        if (getStackController(targetStack, expectedSide) !== expectedSide) {
          return { result: CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
        const ok = hasSoulCoreOnStack(targetStack);
        const expected = cond.expected !== false;
        return { result: (ok === expected) ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      const found = findSoulCoreStackOnField(state, cond.side, { cardType: cond.cardType || 'spirit' }, ctx);
      if (found === null) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
      }
      return { result: found ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
    }

    case CONDITION_TYPES.BURST_OR_MIRAGE_SET: {
      const [side] = resolveTargetSides(cond.side, ctx);
      const p = state?.players?.[side];
      if (!p) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_CONTEXT', conditionType: cond.type, requiredContext: ['state.players'] };
      }
      const colorOk = card => Array.isArray(cond.colors) && cond.colors.length > 0
        ? cond.colors.some(c => cardMatchesColor(card, c))
        : (!cond.color || cardMatchesColor(card, cond.color));
      const hasBurst = Boolean(p.burst) && colorOk(p.burst);
      const hasMirage = Boolean(p.mirage) && colorOk(p.mirage);
      let hasSet = false;
      if (cond.combinator === 'OR') {
        hasSet = (cond.checkBurst && hasBurst) || (cond.checkMirage && hasMirage);
      } else if (cond.checkBurst) {
        hasSet = hasBurst;
      } else if (cond.checkMirage) {
        hasSet = hasMirage;
      }
      const ok = cond.expected === false ? !hasSet : hasSet;
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players'] };
    }

    case CONDITION_TYPES.BATTLING_STATE: {
      const battle = state?.battle;
      const combat = state?.combat;
      if ((!battle || (!battle.attacker && !battle.blocker)) && (!combat || !combat.attackerStackId)) {
        return { result: CONDITION_RESULT.FALSE, reason: 'NOT_IN_BATTLE', conditionType: cond.type, requiredContext: ['state.battle'] };
      }
      if (!cond.requiresSelfStack) {
        return { result: CONDITION_RESULT.TRUE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.battle'] };
      }
      const selfStack = ctx?.sourceStack || null;
      const selfCard = ctx?.sourceCard || selfStack?.top || null;
      if (!selfStack && !selfCard) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_SOURCE_STACK_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      const isBattling = [battle?.attacker, battle?.blocker].some(st => {
        if (!st) return false;
        if (selfStack && st === selfStack) return true;
        if (selfStack?.id && (st.id === selfStack.id || st.stackId === selfStack.id)) return true;
        if (selfCard?.id && st.top?.id === selfCard.id) return true;
        return false;
      });
      return { result: isBattling ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.battle', 'sourceStack'] };
    }

    case CONDITION_TYPES.BP_ZERO: {
      const targetObj = cond.subject === 'SELF_STACK'
        ? (ctx?.sourceStack || null)
        : (ctx?.selectedTargets?.[0]?.stack || ctx?.previousTarget || ctx?.sourceStack || null);
      if (!targetObj) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_TARGET_FOR_BP_CHECK', conditionType: cond.type, requiredContext: ['target'] };
      }
      const bp = (state && targetObj.top)
        ? computeEffectiveBP(state, targetObj)
        : (targetObj.effectiveBp ?? targetObj.bp ?? targetObj.top?.bp ?? null);
      if (bp === null || bp === undefined) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_BP_VALUE', conditionType: cond.type, requiredContext: ['bp'] };
      }
      return { result: bp === 0 ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['bp'], actual: bp };
    }

    case CONDITION_TYPES.SOUL_STATE: {
      if (ctx?.inSoulState !== undefined) {
        return { result: ctx.inSoulState ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['inSoulState'] };
      }
      const card = ctx?.sourceCard || ctx?.sourceStack?.top || null;
      if (!card) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_SOURCE_CARD_CONTEXT', conditionType: cond.type, requiredContext: ['sourceCard'] };
      }
      if (card.inSoulState !== undefined) {
        return { result: card.inSoulState ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceCard'] };
      }
      let foundUnder = false;
      if (state?.players) {
        for (const s of ['player', 'opponent']) {
          for (const st of state.players[s]?.field || []) {
            if (Array.isArray(st.under) && st.under.some(u => u && u.id === card.id)) {
              foundUnder = true;
              break;
            }
          }
        }
      }
      return { result: foundUnder ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'sourceCard'] };
    }

    case CONDITION_TYPES.TURN_STEP_STATE: {
      if (cond.side !== 'any') {
        const [expectedSide] = resolveTargetSides(cond.side, ctx);
        const turnOwner = state?.turnOwner || state?.activePlayer || null;
        if (!turnOwner) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_TURN_OWNER_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnOwner'] };
        }
        if (turnOwner !== expectedSide) {
          return { result: CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnOwner'] };
        }
      }
      if (cond.step) {
        const curStep = String(state?.step || '').toUpperCase();
        if (curStep !== cond.step) {
          return { result: CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.step'] };
        }
      }
      return { result: CONDITION_RESULT.TRUE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.step'] };
    }

    case CONDITION_TYPES.COLOR_SYMBOL: {
      const [side] = resolveTargetSides(cond.side, ctx);
      const p = state?.players?.[side];
      if (!p) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_CONTEXT', conditionType: cond.type, requiredContext: ['state.players'] };
      }
      if (cond.distinctColors) {
        const seenCols = new Set();
        for (const st of [...(p.field || []), ...(p.nexus || []).map(n => ({ top: n }))]) {
          const card = st?.top || st;
          if (!card) continue;
          for (const colName of ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']) {
            if (getCardSymbolCount(card, colName) > 0 || cardMatchesColor(card, colName)) {
              seenCols.add(colName.toLowerCase());
            }
          }
        }
        const ok = compareNumeric(seenCols.size, cond.operator || 'GTE', cond.expected ?? 1);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: seenCols.size };
      }
      const want = String(cond.color || '').toLowerCase();
      let symbolCount = 0;
      for (const st of [...(p.field || []), ...(p.nexus || []).map(n => ({ top: n }))]) {
        const card = st?.top || st;
        if (!card) continue;
        let matched = 0;
        const syms = Array.isArray(card.symbols) ? card.symbols : null;
        const symObj = (!syms && card.symbols && typeof card.symbols === 'object') ? card.symbols : null;
        if (syms && syms.length > 0) {
          matched += syms.filter(sym => String(sym || '').toLowerCase() === want).length;
        } else if (symObj && Object.keys(symObj).length > 0) {
          for (const [k, v] of Object.entries(symObj)) {
            if (String(k || '').toLowerCase() === want && typeof v === 'number') {
              matched += v;
            }
          }
        }
        if (matched === 0 && cardMatchesColor(card, want)) {
          matched += 1;
        }
        symbolCount += matched;
      }
      for (const mod of state.modifiers || []) {
        if ((mod.type === 'ADD_SYMBOL' || mod.type === 'GRANT_SYMBOL') && (!mod.side || mod.side === side) && String(mod.color || '').toLowerCase() === want) {
          symbolCount += typeof mod.count === 'number' ? mod.count : 1;
        }
      }
      if (cond.onlyThisColor) {
        const otherColors = ['red', 'purple', 'green', 'white', 'yellow', 'blue'].filter(c => c !== want);
        const hasOther = [...(p.field || []), ...(p.nexus || []).map(n => ({ top: n }))].some(st => {
          const card = st?.top || st;
          return card && otherColors.some(oc => getCardSymbolCount(card, oc) > 0);
        });
        const ok = symbolCount >= 1 && !hasOther;
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: symbolCount };
      }
      const ok = compareNumeric(symbolCount, cond.operator || 'GTE', cond.expected ?? 1);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: symbolCount };
    }

    case CONDITION_TYPES.HAND_SIZE_THRESHOLD: {
      const [side] = resolveTargetSides(cond.side, ctx);
      const p = state?.players?.[side];
      if (!p || !Array.isArray(p.hand)) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_HAND_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'hand'] };
      }
      const sumZones = (pl) => (Array.isArray(cond.zones) && cond.zones.length > 0)
        ? cond.zones.reduce((s, z) => s + (Array.isArray(pl?.[z]) ? pl[z].length : 0), 0)
        : pl.hand.length;
      const actualCount = sumZones(p);
      let expected = cond.expected ?? 0;
      if (cond.compareToOpponent) {
        const oppSide = side === 'player' ? 'opponent' : 'player';
        const oppP = state?.players?.[oppSide];
        if (!oppP || !Array.isArray(oppP.hand)) {
          return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_OPPONENT_HAND_CONTEXT', conditionType: cond.type, requiredContext: ['state.players'] };
        }
        expected = sumZones(oppP);
      }
      const ok = compareNumeric(actualCount, cond.operator || 'LTE', expected);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'hand'], actual: actualCount };
    }

    case CONDITION_TYPES.CARD_ZONE_STATE: {
      const card = ctx?.sourceCard || null;
      if (!card || !state?.players) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_SOURCE_CARD_CONTEXT', conditionType: cond.type, requiredContext: ['sourceCard', 'state.players'] };
      }
      const [side] = resolveTargetSides('self', ctx);
      const p = state.players[side];
      if (!p || !Array.isArray(p[cond.zone])) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_ZONE_CONTEXT', conditionType: cond.type, requiredContext: [`state.players.${cond.zone}`] };
      }
      const list = p[cond.zone];
      const inZone = list.some(c => c && c.id === card.id);
      return { result: inZone ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceCard', 'state.players'] };
    }

    case CONDITION_TYPES.PREVIOUS_OP_SUCCESS: {
      const prev = ctx?.previousOpResult ?? ctx?.lastOpResult ?? ctx?.previousResult ?? null;
      if (cond.check === 'returned') {
        if (!prev && ctx?.wasReturned === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PREVIOUS_OP_RESULT', conditionType: cond.type, requiredContext: ['previousOpResult'] };
        }
        const ok = Boolean(ctx?.wasReturned || (prev?.bouncedCount || 0) > 0);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousOpResult'] };
      }
      if (cond.check === 'destroyed' || cond.check === 'depleted') {
        if (!prev && ctx?.wasDestroyed === undefined && ctx?.wasDepleted === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PREVIOUS_OP_RESULT', conditionType: cond.type, requiredContext: ['previousOpResult'] };
        }
        const ok = Boolean((prev?.destroyedCount || 0) > 0 || (cond.check === 'destroyed' && ctx?.wasDestroyed) || (cond.check === 'depleted' && ctx?.wasDepleted));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousOpResult'] };
      }
      if (cond.check === 'discarded') {
        if (!prev && ctx?.wasDiscarded === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PREVIOUS_OP_RESULT', conditionType: cond.type, requiredContext: ['previousOpResult'] };
        }
        const ok = Boolean((prev?.discardedCount || 0) > 0 || ctx?.wasDiscarded);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousOpResult'] };
      }
      if (cond.check === 'negated') {
        if (!prev) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PREVIOUS_OP_RESULT', conditionType: cond.type, requiredContext: ['previousOpResult'] };
        }
        return { result: prev.success ? CONDITION_RESULT.FALSE : CONDITION_RESULT.TRUE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousOpResult'] };
      }
      if (!prev) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PREVIOUS_OP_RESULT', conditionType: cond.type, requiredContext: ['previousOpResult'] };
      }
      return { result: prev.success ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousOpResult'] };
    }

    case CONDITION_TYPES.TURN_HISTORY: {
      const [side] = resolveTargetSides(cond.side || 'self', ctx);
      const p = state?.players?.[side];
      const hist = state?.turnHistory?.[side] || null;
      if (cond.metric === 'lifeReduced') {
        if (!hist && typeof p?.combatDamageTakenThisTurn !== 'number') {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const reduced = (hist?.lifeReduced || 0) > 0 || (p?.combatDamageTakenThisTurn || 0) > 0;
        const ok = cond.expectedBoolean ? reduced : !reduced;
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
      }
      if (cond.metric === 'firstAttackOfTurn') {
        if (!hist && typeof p?.attacksThisTurn !== 'number' && typeof state?.turnAttackCount?.[side] !== 'number') {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const cnt = typeof p?.attacksThisTurn === 'number' ? p.attacksThisTurn : (typeof state?.turnAttackCount?.[side] === 'number' ? state.turnAttackCount[side] : (hist?.attacksDeclared ?? 0));
        const ok = cnt <= 1;
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
      }
      if (cond.metric === 'summonCountGte') {
        if (!hist) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const cnt = hist.summonedMechanics?.length || 0;
        const ok = cnt >= (cond.expected ?? 1);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'], actual: cnt };
      }
      if (cond.metric === 'attackCountGte') {
        const cnt = typeof p?.attacksThisTurn === 'number'
          ? p.attacksThisTurn
          : (typeof state?.turnAttackCount?.[side] === 'number'
            ? state.turnAttackCount[side]
            : (typeof hist?.attacksDeclared === 'number'
              ? hist.attacksDeclared
              : (typeof ctx?.attacksThisTurn === 'number' ? ctx.attacksThisTurn : null)));
        if (cnt === null) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_ATTACK_COUNT_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const ok = cnt >= (cond.expected ?? 1);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'], actual: cnt };
      }
      if (cond.metric === 'usedMagicFamilyOrKeyword') {
        if (!hist) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const used = hist.usedMagicCards || [];
        const ok = used.some(mc =>
          (cond.family && cardMatchesFamily(mc, cond.family)) ||
          (cond.keyword && cardHasKeyword(mc, null, cond.keyword))
        );
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
      }
      if (cond.metric === 'adventsPerformed') {
        if (!hist) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const ok = (hist.adventsPerformed || 0) > 0;
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
      }
      if (cond.metric === 'burstMechanic') {
        if (!hist && ctx?.burstMechanic === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const want = String(cond.mechanic || '').toLowerCase();
        const ctxMech = String(ctx?.burstMechanic || '').toLowerCase();
        const ok = ctxMech === want || (hist?.burstsActivated || []).some(m => String(m).toLowerCase() === want);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
      }
      if (cond.metric === 'summonMechanic') {
        if (!hist && ctx?.summonMechanic === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const want = String(cond.mechanic || '').toLowerCase();
        const ctxMech = String(ctx?.summonMechanic || '').toLowerCase();
        const ok = ctxMech === want || (hist?.summonedMechanics || []).some(m => String(m).toLowerCase() === want);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
      }
      if (cond.metric === 'destructionOccurred') {
        if (!hist && typeof p?.destroyedCountThisTurn !== 'number') {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TURN_HISTORY_CONTEXT', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
        }
        const ok = ((hist?.destroyedCount || 0) > 0) || ((p?.destroyedCountThisTurn || 0) > 0);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.turnHistory'] };
      }
      return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_CONDITION', condition: conditionInput, conditionType: cond.type, requiredContext: [] };
    }

    case CONDITION_TYPES.CARD_RESULT: {
      if (cond.check === 'returned') {
        if (!ctx?.previousOpResult && !ctx?.previousResult && ctx?.wasReturned === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PREVIOUS_OP_RESULT', conditionType: cond.type, requiredContext: ['previousOpResult'] };
        }
        const ok = Boolean(ctx?.wasReturned || (ctx?.previousOpResult?.bouncedCount || 0) > 0 || (ctx?.previousResult?.bouncedCount || 0) > 0);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousOpResult'] };
      }
      const card = ctx?.previousTarget?.card || ctx?.previousTarget?.top || ctx?.previousTarget || ctx?.previousOpResult?.cards?.[0] || ctx?.previousResult?.cards?.[0] || null;
      if (!card) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TARGET_CARD_CONTEXT', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'cardType') {
        const ok = cardMatchesType(card, cond.cardType);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'family') {
        const ok = cardMatchesFamily(card, cond.family);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'costParity') {
        if (typeof card.cost !== 'number' || !Number.isFinite(card.cost)) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_CARD_COST_CONTEXT', conditionType: cond.type, requiredContext: ['previousTarget'] };
        }
        const cost = Number(card.cost);
        const ok = cond.parity === 'odd' ? (cost % 2 === 1) : (cost % 2 === 0);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'name') {
        const ok = cardMatchesName(card, cond.name, true);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'composite') {
        const ok = cardMatchesFilterSpec(card, null, {
          ...(cond.name ? { name: cond.name } : {}),
          ...(cond.color ? { color: cond.color } : {}),
          ...(cond.family ? { family: cond.family } : {}),
          ...(cond.keyword ? { keyword: cond.keyword } : {}),
          ...(cond.cardTypes ? { cardTypes: cond.cardTypes } : {})
        }, state, ctx);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'families') {
        const cardsList = cond.matchAll
          ? (ctx?.previousOpResult?.cards || ctx?.previousResult?.cards || ctx?.revealedCards || (card ? [card] : []))
          : [card];
        if (!Array.isArray(cardsList) || cardsList.length === 0) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TARGET_CARD_CONTEXT', conditionType: cond.type, requiredContext: ['previousTarget'] };
        }
        const ok = cond.matchAll
          ? cardsList.every(c => cond.families.some(f => cardMatchesFamily(c, f)))
          : cond.families.some(f => cardMatchesFamily(card, f));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'names') {
        const ok = (cond.names || []).some(n => cardMatchesName(card, n, false));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'allowedCosts') {
        if (typeof card.cost !== 'number' || !Number.isFinite(card.cost)) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_CARD_COST_CONTEXT', conditionType: cond.type, requiredContext: ['previousTarget'] };
        }
        const ok = (cond.allowedCosts || []).includes(Number(card.cost));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'nameOrFamilyWithTeam') {
        const ok = cardMatchesName(card, cond.name, false) ||
          (cardMatchesFamily(card, cond.family) && extractCardTeams(card, state, null).length > 0);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      if (cond.check === 'effectNamed') {
        const effText = String(card.effect || card.rawText || '').toLowerCase();
        const kw = String(cond.keyword || '').toLowerCase();
        const ok = cardHasKeyword(card, null, cond.keyword) || effText.includes(kw);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['previousTarget'] };
      }
      return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_CONDITION', condition: conditionInput, conditionType: cond.type, requiredContext: [] };
    }

    case CONDITION_TYPES.BRAVE_STACK_STATE: {
      if (cond.check === 'hostFamily') {
        const resolved = resolveSourceStackFromState(state, ctx);
        if (!resolved.stack?.top) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_SOURCE_STACK_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
        const ok = cardMatchesFamily(resolved.stack.top, cond.family);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      if (cond.check === 'isBraved') {
        const resolved = resolveSourceStackFromState(state, ctx);
        if (resolved.conflict) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: resolved.reason || 'CONTRADICTORY_SOURCE_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
        const st = resolved.stack;
        if (!st) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_SOURCE_STACK_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
        if (!Array.isArray(st.braves)) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_BRAVES_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack.braves'] };
        }
        const ok = cond.braveRequirement
          ? (st.braves.some(b => matchesBraveRequirement(b, st, cond.braveRequirement)) ||
             (cond.checkBothHostAndBrave && st.braves.length > 0 && st.top && matchesBraveRequirement(st.top, st, cond.braveRequirement)))
          : st.braves.length >= (cond.minBraves ?? 1);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      if (cond.check === 'soulCoreInCounterArea') {
        const [side] = resolveTargetSides(cond.side || 'self', ctx);
        const p = state?.players?.[side];
        if ((!p || (!p.counterArea && p.soulCoreInCounterArea === undefined)) && ctx?.soulCoreInCounterArea === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_COUNTER_AREA_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'counterArea'] };
        }
        const ok = Boolean(ctx?.soulCoreInCounterArea || p?.soulCoreInCounterArea || (p?.counterArea?.soul || 0) > 0);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players'] };
      }
      return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_CONDITION', condition: conditionInput, conditionType: cond.type, requiredContext: [] };
    }

    case CONDITION_TYPES.FIELD_COMPOSITION: {
      const [side] = resolveTargetSides(cond.side || 'self', ctx);
      const p = state?.players?.[side];
      if (!p || !Array.isArray(p.field)) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PLAYER_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
      }
      const subjStr = String(cond.subject || 'spirits').toLowerCase();
      const includeNexuses = subjStr.includes('nexus');
      const includeUltimates = subjStr.includes('ultimate');
      const includeSpirits = subjStr.includes('spirit') || (!includeNexuses && !includeUltimates);
      const items = [
        ...(p.field || []).filter(st => {
          if (!st?.top) return false;
          if (includeSpirits && cardMatchesType(st.top, 'Spirit')) return true;
          if (includeUltimates && cardMatchesType(st.top, 'Ultimate')) return true;
          if (includeNexuses && cardMatchesType(st.top, 'Nexus')) return true;
          return false;
        }),
        ...(includeNexuses ? (p.nexus || []).map(n => ({ top: n })) : [])
      ];
      if (items.length === 0) return { result: CONDITION_RESULT.FALSE, reason: 'EMPTY_FIELD', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
      const ok = items.every(st => {
        const card = st.top;
        if (cond.onlyName && !cardMatchesName(card, cond.onlyName, cond.exactName !== false)) return false;
        if (cond.onlyColor && !cardMatchesColor(card, cond.onlyColor)) return false;
        if (cond.family && !cardMatchesFamily(card, cond.family)) return false;
        if (Array.isArray(cond.families) && cond.families.length > 0 && !cond.families.some(f => cardMatchesFamily(card, f))) return false;
        if (Array.isArray(cond.allowedCosts) && !cond.allowedCosts.includes(Number(card.cost))) return false;
        if (typeof cond.costGte === 'number' && Number(card.cost ?? 0) < cond.costGte) return false;
        if (typeof cond.costLte === 'number' && Number(card.cost ?? 0) > cond.costLte) return false;
        if (cond.keyword && !(cardHasKeyword(card, st, cond.keyword) || hasTeam(card, cond.keyword, state, st))) return false;
        return true;
      });
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
    }

    case CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT: {
      if (cond.role === 'BLOCKED') {
        if (!state?.battle && !state?.combat) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_BATTLE_CONTEXT', conditionType: cond.type, requiredContext: ['state.battle'] };
        }
        const isBlocked = Boolean(state?.battle?.blocker || state?.combat?.blockerStackId);
        const inCombat = Boolean(state?.battle?.attacker || state?.combat?.attackerStackId);
        if (!inCombat) return { result: CONDITION_RESULT.FALSE, reason: 'NOT_IN_BATTLE', conditionType: cond.type, requiredContext: ['state.battle'] };
        const ok = cond.expectedBlocked ? isBlocked : !isBlocked;
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.battle'] };
      }
      if (!state?.combat && !state?.battle && !state?.players) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_COMBAT_CONTEXT', conditionType: cond.type, requiredContext: ['state.battle', 'state.players'] };
      }
      const [wantSide] = resolveTargetSides(cond.side || 'self', ctx);
      const battle = state?.battle;
      const combat = state?.combat;
      const resolveStackById = (sId, prefSide) => {
        if (!sId) return null;
        return (state?.players?.[prefSide]?.field || []).find(st => st.id === sId || st.stackId === sId) || null;
      };
      const atkStack = battle?.attacker || resolveStackById(combat?.attackerStackId, combat?.attackerSide || wantSide);
      const blkStack = battle?.blocker || resolveStackById(combat?.blockerStackId, combat?.blockerSide || wantSide);
      const candidates = cond.role === 'ATTACKER' ? [atkStack] : (cond.role === 'BLOCKER' ? [blkStack] : [atkStack, blkStack]);
      const matching = candidates.some(st => {
        if (!st || !st.top) return false;
        if (getStackController(st, wantSide) !== wantSide) return false;
        if (cond.expectedState === 'REFRESHED' && st.state !== 'REFRESHED') return false;
        if (cond.expectedState === 'EXHAUSTED' && st.state !== 'EXHAUSTED' && st.state !== 'HEAVY_EXHAUSTED') return false;
        const selfCardId = ctx?.sourceCard?.id || ctx?.sourceStack?.top?.id;
        if (cond.allowSelfSource && selfCardId && st.top.id === selfCardId) return true;
        return cardMatchesFilterSpec(st.top, st, cond.filter || {}, state, ctx);
      });
      if (!atkStack && !blkStack) {
        return { result: CONDITION_RESULT.FALSE, reason: 'NOT_IN_BATTLE', conditionType: cond.type, requiredContext: ['state.battle'] };
      }
      return { result: matching ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.battle'] };
    }

    case CONDITION_TYPES.ZONE_CARD_COUNT: {
      const [side] = resolveTargetSides(cond.side || 'self', ctx);
      const p = state?.players?.[side];
      if (!p) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PLAYER_CONTEXT', conditionType: cond.type, requiredContext: ['state.players'] };
      const arr = Array.isArray(p[cond.zone]) ? p[cond.zone] : null;
      if (!arr) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_ZONE_CONTEXT', conditionType: cond.type, requiredContext: [`state.players.${cond.zone}`] };
      if (cond.matchAll) {
        const ok = arr.length > 0 && arr.every(c => cardMatchesFilterSpec(c, null, cond.filter || {}, state, ctx));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: [`state.players.${cond.zone}`] };
      }
      const matchedCount = arr.filter(c => cardMatchesFilterSpec(c, null, cond.filter || {}, state, ctx)).length;
      const ok = compareNumeric(matchedCount, cond.operator || 'GTE', cond.expected ?? 1);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: [`state.players.${cond.zone}`], actual: matchedCount };
    }

    case CONDITION_TYPES.SPIRIT_STAT_THRESHOLD: {
      let targetStack = null;
      let targetCard = null;
      if (cond.subject === 'SELF') {
        const resolved = resolveSourceStackFromState(state, ctx);
        if (resolved.conflict) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: resolved.reason || 'CONTRADICTORY_SOURCE_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
        targetStack = resolved.stack;
        targetCard = targetStack?.top || ctx?.sourceCard || null;
      } else {
        targetStack = ctx?.selectedTargets?.[0]?.stack || ctx?.previousTarget?.stack || (ctx?.previousTarget?.top ? ctx.previousTarget : null) || null;
        if (!targetStack) {
          const resolved = resolveSourceStackFromState(state, ctx);
          if (resolved.conflict) {
            return { result: CONDITION_RESULT.UNSUPPORTED, reason: resolved.reason || 'CONTRADICTORY_SOURCE_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
          }
          targetStack = resolved.stack;
        }
        targetCard = targetStack?.top || ctx?.previousTarget?.card || ctx?.previousTarget || ctx?.sourceCard || null;
      }
      if (!targetStack && !targetCard) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TARGET_STACK_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      if (cond.filter && Object.keys(cond.filter).length > 0 && !cardMatchesFilterSpec(targetCard, targetStack, cond.filter, state, ctx)) {
        return { result: CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      let actualVal = null;
      if (cond.stat === 'BP') {
        if (targetStack && state?.players) {
          actualVal = computeEffectiveBP(state, targetStack);
        } else if (typeof targetCard?.bp === 'number' && Number.isFinite(targetCard.bp)) {
          actualVal = targetCard.bp;
        } else {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_BP_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
      } else if (cond.stat === 'LEVEL') {
        actualVal = targetStack?.level ?? ctx?.sourceStackLevel ?? null;
        if (typeof actualVal !== 'number' || !Number.isFinite(actualVal)) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_LEVEL_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
        }
      } else {
        if (typeof targetCard?.cost !== 'number' || !Number.isFinite(targetCard.cost)) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_COST_CONTEXT', conditionType: cond.type, requiredContext: ['targetCard'] };
        }
        actualVal = Number(targetCard.cost);
      }
      let expectedThreshold = cond.expected ?? 0;
      if (cond.compareTo === 'ATTACK_TARGET' || cond.compareTo === 'OPPONENT_BATTLER') {
        const combat = state?.combat;
        const combatRef = combat
          ? ((state?.players?.[combat.attackerSide === 'player' ? 'opponent' : 'player']?.field || []).find(s => s.id === combat.blockerStackId) ||
             (state?.players?.[combat.attackerSide || 'player']?.field || []).find(s => s.id === combat.attackerStackId))
          : null;
        const refObj = ctx?.attackingTarget || state?.battle?.blocker || state?.battle?.attacker || combatRef || ctx?.opponentBattler || null;
        const refCard = refObj?.top || refObj;
        const refVal = cond.stat === 'LEVEL' ? (refObj?.level ?? null) : (typeof refCard?.cost === 'number' ? refCard.cost : null);
        if (typeof refVal !== 'number' || !Number.isFinite(refVal)) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_RELATIVE_TARGET_CONTEXT', conditionType: cond.type, requiredContext: ['attackingTarget'] };
        }
        expectedThreshold = refVal;
      }
      const ok = Array.isArray(cond.allowedValues)
        ? cond.allowedValues.includes(actualVal)
        : compareNumeric(actualVal, cond.operator || 'GTE', expectedThreshold);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'], actual: actualVal };
    }

    case CONDITION_TYPES.SOUL_CORE_LOCATION: {
      const [side] = resolveTargetSides(cond.side || 'self', ctx);
      const p = state?.players?.[side];
      if (!p) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PLAYER_CONTEXT', conditionType: cond.type, requiredContext: ['state.players'] };
      let hasSoul = false;
      if (cond.zone === 'banished_from_game') {
        if (p.soulCoreBanishedFromGame === undefined && state?.banishedSoulCore === undefined) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_SOUL_CORE_BANISH_CONTEXT', conditionType: cond.type, requiredContext: ['soulCoreBanishedFromGame'] };
        }
        hasSoul = Boolean(p.soulCoreBanishedFromGame || (state?.banishedSoulCore || 0) > 0);
      } else if (cond.zone === 'trash') {
        const tc = p.trash && typeof p.trash === 'object' ? p.trash : p.trashCores;
        if (!tc) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_TRASH_CONTEXT', conditionType: cond.type, requiredContext: ['state.players.trash'] };
        hasSoul = Number(tc.soul || 0) > 0;
      } else if (cond.zone === 'reserve') {
        if (!p.reserve || typeof p.reserve.soul !== 'number') return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_RESERVE_CONTEXT', conditionType: cond.type, requiredContext: ['state.players.reserve'] };
        hasSoul = Number(p.reserve.soul || 0) > 0;
      } else if (cond.zone === 'life') {
        if (typeof p.lifeSoul !== 'number' && typeof p.life !== 'number') return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_LIFE_CONTEXT', conditionType: cond.type, requiredContext: ['state.players.life'] };
        hasSoul = Number(p.lifeSoul || 0) > 0;
      } else if (cond.zone === 'counterArea') {
        if (!p.counterArea && ctx?.soulCoreInCounterArea === undefined) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_COUNTER_AREA_CONTEXT', conditionType: cond.type, requiredContext: ['state.players.counterArea'] };
        hasSoul = Number(p.counterArea?.soul || 0) > 0 || Boolean(ctx?.soulCoreInCounterArea);
      } else if (cond.zone === 'field') {
        if (!Array.isArray(p.field)) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['state.players.field'] };
        hasSoul = p.field.some(st => Number(st?.cores?.soul || 0) > 0);
      } else {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_SOUL_CORE_ZONE', conditionType: cond.type, requiredContext: [`state.players.${cond.zone}`] };
      }
      const ok = cond.negated ? !hasSoul : hasSoul;
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: [`state.players.${cond.zone}`] };
    }

    case CONDITION_TYPES.RESERVE_CORE_THRESHOLD: {
      const [side] = resolveTargetSides(cond.side || 'self', ctx);
      const p = state?.players?.[side];
      if (!p || !p.reserve || typeof p.reserve.normal !== 'number') {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_PLAYER_RESERVE_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'reserve'] };
      }
      const totalReserve = Number(p.reserve.normal || 0) + (Number(p.reserve.soul || 0) > 0 ? 1 : 0);
      const ok = compareNumeric(totalReserve, cond.operator || 'GTE', cond.expected ?? 1);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'reserve'], actual: totalReserve };
    }

    case CONDITION_TYPES.STACK_STATE: {
      const prevSt = ctx?.previousTarget?.stack || (ctx?.previousTarget?.state ? ctx.previousTarget : null);
      const resolved = resolveSourceStackFromState(state, ctx);
      if (!prevSt && resolved.conflict) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: resolved.reason || 'CONTRADICTORY_SOURCE_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      const st = prevSt || resolved.stack;
      if (!st) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_STACK_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      if (cond.expectedState === 'DURING_ADVENT') {
        const ok = Boolean(st.isAdvent || (Array.isArray(st.under) && st.under.length > 0));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      if (cond.expectedState === 'BRAVE_SPIRIT_FORM') {
        const ok = Boolean(st.top && cardMatchesType(st.top, 'Brave'));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      if (cond.check === 'selfName') {
        const ok = Boolean(st.top && cardMatchesName(st.top, cond.expectedName, false));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
      }
      if (typeof st.state !== 'string') {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'MISSING_STACK_STATE_FIELD', conditionType: cond.type, requiredContext: ['sourceStack.state'] };
      }
      const ok = cond.expectedState === 'EXHAUSTED'
        ? (st.state === 'EXHAUSTED' || st.state === 'HEAVY_EXHAUSTED')
        : (st.state === 'REFRESHED');
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack'] };
    }

    case CONDITION_TYPES.TEAM_PRESENCE: {
      const [side] = resolveTargetSides(cond.side || 'self', ctx);
      const p = state?.players?.[side];
      if (!p || !Array.isArray(p.field)) {
        return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_PLAYER_FIELD_CONTEXT', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
      }
      if (cond.mode === 'SELF_HAS_TEAM') {
        const resolved = resolveSourceStackFromState(state, ctx);
        const card = ctx?.sourceCard || resolved.stack?.top || null;
        if (!card) return { result: CONDITION_RESULT.FALSE, reason: 'MISSING_SOURCE_CARD_CONTEXT', conditionType: cond.type, requiredContext: ['sourceCard'] };
        const ok = hasTeam(card, cond.team, state, resolved.stack);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceCard'] };
      }
      if (cond.mode === 'ALL_CONTROLLED_HAVE_TEAM') {
        const subj = String(cond.subject || 'spirits').toLowerCase();
        const incSpirits = subj.includes('spirit');
        const incNexuses = subj.includes('nexus');
        const incUltimates = subj.includes('ultimate');
        const controlled = [];
        for (const st of p.field || []) {
          if (!st?.top) continue;
          const t = String(st.top.type || '').toLowerCase();
          if ((incSpirits && t.includes('spirit')) || (incNexuses && t.includes('nexus')) || (incUltimates && t.includes('ultimate'))) {
            controlled.push({ card: st.top, stack: st });
          }
        }
        if (incNexuses && Array.isArray(p.nexus)) {
          for (const nx of p.nexus) {
            if (nx) controlled.push({ card: nx, stack: null });
          }
        }
        if (controlled.length === 0) {
          return { result: CONDITION_RESULT.FALSE, reason: 'EMPTY_FIELD', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
        }
        const ok = controlled.every(item => hasTeam(item.card, cond.team, state, item.stack));
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'] };
      }
      if (cond.mode === 'DISTINCT_TEAM_COUNT') {
        const distinct = new Set();
        for (const st of p.field || []) {
          if (!st?.top || !cardMatchesType(st.top, 'Spirit')) continue;
          for (const tm of extractCardTeams(st.top, state, st)) {
            distinct.add(tm.toLowerCase());
          }
        }
        const ok = distinct.size >= (cond.minTeams || 3);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: distinct.size };
      }
      // CONTROL_TEAM_COUNT
      const count = countControlledMatchingCards(state, cond.side || 'self', {
        cardType: cond.cardType || 'Spirit',
        team: cond.team,
        ...(cond.stackState ? { stackState: cond.stackState } : {})
      }, ctx);
      const ok = compareNumeric(count ?? 0, cond.operator || 'GTE', cond.expected ?? 1);
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players', 'field'], actual: count };
    }

    case CONDITION_TYPES.PRE_ADVENT_CARD: {
      const resolved = resolveSourceStackFromState(state, ctx);
      if (resolved.conflict || !resolved.stack || !Array.isArray(resolved.stack.under)) {
        return {
          result: CONDITION_RESULT.INVALID_CONTEXT,
          reason: resolved.conflict ? (resolved.reason || 'CONTRADICTORY_SOURCE_CONTEXT') : 'MISSING_SOURCE_STACK_UNDER_CONTEXT',
          conditionType: cond.type,
          requiredContext: ['sourceStack.under']
        };
      }
      const ok = resolved.stack.under.some(u =>
        u && (cond.check === 'family' ? cardMatchesFamily(u, cond.expected) : cardMatchesName(u, cond.expected, false))
      );
      return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack.under'] };
    }

    case CONDITION_TYPES.ACTIVATION_ORIGIN: {
      if (cond.originType === 'SUMMON_ZONE') {
        const origin = ctx?.summonOrigin || ctx?.fromZone || ctx?.sourceCard?.summonOrigin || null;
        if (!origin) {
          return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'MISSING_SUMMON_ORIGIN_CONTEXT', conditionType: cond.type, requiredContext: ['summonOrigin'] };
        }
        const norm = String(origin).toLowerCase() === 'trash' ? 'grave' : String(origin).toLowerCase();
        return { result: norm === cond.expectedZone ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['summonOrigin'] };
      }
      if (cond.originType === 'SUMMON_EFFECT_NAME') {
        const effName = ctx?.summonEffectName || ctx?.sourceCard?.summonEffectName || null;
        if (!effName) {
          return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'MISSING_SUMMON_EFFECT_NAME_CONTEXT', conditionType: cond.type, requiredContext: ['summonEffectName'] };
        }
        const ok = String(effName).toLowerCase().includes(String(cond.expectedName || '').toLowerCase());
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['summonEffectName'] };
      }
      if (cond.originType === 'USED_VIA_KEYWORD') {
        const usedKw = ctx?.usedViaKeyword || ctx?.sourceCard?.usedViaKeyword || null;
        if (!usedKw) {
          return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'MISSING_USED_VIA_KEYWORD_CONTEXT', conditionType: cond.type, requiredContext: ['usedViaKeyword'] };
        }
        const ok = String(usedKw).toLowerCase() === String(cond.expectedKeyword || '').toLowerCase();
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['usedViaKeyword'] };
      }
      if (cond.originType === 'BURST_EFFECT_NAME') {
        const bEff = ctx?.burstActivatedByEffectName || ctx?.activatedByEffectName || null;
        if (!bEff) {
          return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'MISSING_BURST_EFFECT_CONTEXT', conditionType: cond.type, requiredContext: ['burstActivatedByEffectName'] };
        }
        const ok = String(bEff).toLowerCase().includes(String(cond.expectedName || '').toLowerCase());
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['burstActivatedByEffectName'] };
      }
      if (cond.originType === 'BURST_DESTROYED_FAMILY') {
        const dCard = ctx?.burstTriggerCard || ctx?.triggerEvent?.card || null;
        if (!dCard) {
          return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'MISSING_BURST_TRIGGER_CARD_CONTEXT', conditionType: cond.type, requiredContext: ['burstTriggerCard'] };
        }
        const ok = cardMatchesFamily(dCard, cond.expectedFamily);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['burstTriggerCard'] };
      }
      return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'UNKNOWN_ACTIVATION_ORIGIN', conditionType: cond.type, requiredContext: [] };
    }

    case CONDITION_TYPES.OP_RULE_CONDITION: {
      if (!state?.players?.player || !state?.players?.opponent) {
        return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'MISSING_PLAYERS_CONTEXT', conditionType: cond.type, requiredContext: ['state.players'] };
      }
      if (cond.ruleKey === 'BOTH_PLAYERS_CONTROL_NEXUS') {
        const hasNex = (pl) => (Array.isArray(pl.nexus) && pl.nexus.length > 0) ||
          (Array.isArray(pl.field) && pl.field.some(st => st?.top && cardMatchesType(st.top, 'Nexus')));
        const ok = hasNex(state.players.player) && hasNex(state.players.opponent);
        return { result: ok ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['state.players'] };
      }
      if (cond.ruleKey === 'LEVEL_LTE') {
        const atkLv = ctx?.sourceStack?.level ?? ctx?.attackerLevel ?? null;
        const blkLv = ctx?.blockerStack?.level ?? ctx?.targetStack?.level ?? ctx?.blockerLevel ?? null;
        if (typeof atkLv !== 'number' || typeof blkLv !== 'number') {
          return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'MISSING_BATTLE_LEVEL_CONTEXT', conditionType: cond.type, requiredContext: ['sourceStack.level', 'blockerStack.level'] };
        }
        return { result: blkLv <= atkLv ? CONDITION_RESULT.TRUE : CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: ['sourceStack.level', 'blockerStack.level'] };
      }
      return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_OP_RULE_CONDITION', conditionType: cond.type, requiredContext: [] };
    }

    case CONDITION_TYPES.COMPOUND: {
      const rawSub = Array.isArray(cond.conditions)
        ? cond.conditions
        : (Array.isArray(cond.subconditions)
          ? cond.subconditions
          : (Array.isArray(cond.operands) ? cond.operands : []));
      const subConds = rawSub.map(sc => (typeof sc === 'string' ? parseConditionToStructured(sc) || sc : sc));
      const comb = String(cond.combinator || cond.operator || cond.op || 'AND').toUpperCase();

      if (comb === 'NOT' || comb === '!') {
        if (subConds.length !== 1) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'INVALID_NOT_CONDITION', conditionType: cond.type, requiredContext: [] };
        const res = evaluateStructuredCondition(state, subConds[0], ctx);
        if (res.result === CONDITION_RESULT.INVALID_CONTEXT) return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'INVALID_SUBCONDITION_CONTEXT', conditionType: cond.type, requiredContext: res.requiredContext || [] };
        if (res.result === CONDITION_RESULT.UNSUPPORTED) return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_SUBCONDITION', conditionType: cond.type, requiredContext: [] };
        return { result: res.result === CONDITION_RESULT.TRUE ? CONDITION_RESULT.FALSE : CONDITION_RESULT.TRUE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: [] };
      }
      if (subConds.length === 0) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'EMPTY_COMPOUND_CONDITION', conditionType: cond.type, requiredContext: [] };
      }
      const evals = subConds.map(sc => evaluateStructuredCondition(state, sc, ctx));
      if (comb === 'OR' || comb === '||') {
        if (evals.some(e => e.result === CONDITION_RESULT.TRUE)) {
          return { result: CONDITION_RESULT.TRUE, reason: 'EVALUATED_OR_SHORT_CIRCUIT', conditionType: cond.type, requiredContext: [] };
        }
        const inv = evals.find(e => e.result === CONDITION_RESULT.INVALID_CONTEXT);
        if (inv) {
          return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'INVALID_SUBCONDITION_CONTEXT', conditionType: cond.type, requiredContext: inv.requiredContext || [] };
        }
        if (evals.some(e => e.result === CONDITION_RESULT.UNSUPPORTED)) {
          return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_SUBCONDITION', conditionType: cond.type, requiredContext: [] };
        }
        return { result: CONDITION_RESULT.FALSE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: [] };
      }
      // AND / &&
      if (evals.some(e => e.result === CONDITION_RESULT.FALSE)) {
        return { result: CONDITION_RESULT.FALSE, reason: 'EVALUATED_AND_SHORT_CIRCUIT', conditionType: cond.type, requiredContext: [] };
      }
      const invAnd = evals.find(e => e.result === CONDITION_RESULT.INVALID_CONTEXT);
      if (invAnd) {
        return { result: CONDITION_RESULT.INVALID_CONTEXT, reason: 'INVALID_SUBCONDITION_CONTEXT', conditionType: cond.type, requiredContext: invAnd.requiredContext || [] };
      }
      if (evals.some(e => e.result === CONDITION_RESULT.UNSUPPORTED)) {
        return { result: CONDITION_RESULT.UNSUPPORTED, reason: 'UNSUPPORTED_SUBCONDITION', conditionType: cond.type, requiredContext: [] };
      }
      return { result: CONDITION_RESULT.TRUE, reason: 'EVALUATED', conditionType: cond.type, requiredContext: [] };
    }

    default:
      return {
        result: CONDITION_RESULT.UNSUPPORTED,
        reason: 'UNSUPPORTED_CONDITION',
        condition: conditionInput,
        conditionType: cond.type || null,
        requiredContext: []
      };
  }
}
