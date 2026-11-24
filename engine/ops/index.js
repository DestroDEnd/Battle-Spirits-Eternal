/**
 * engine/ops/index.js
 * 
 * Headless Async Primitive Operation Library for Battle Spirits Eternal.
 * Resolves Intermediate Representation (IR) operations deterministically.
 */

import { moveCard, moveCore } from '../zones.js';
import { createFieldStack } from '../state.js';
import { queryCandidates, resolveTargets, normalizeCardZone, buildCandidateDescriptor, validateSelection, validateTargetAvailability } from '../selectors.js';
import { computeColors, computeEffectiveBP, computeLevel, isActionRestricted, isTargetProtectedFrom } from '../continuous.js';
import { calculateEffectiveCost } from '../payment.js';
import { evaluateStructuredCondition, CONDITION_RESULT } from '../conditions.js';
import { evaluateAdventCondition } from '../prerequisites.js';
import { isIncompleteOpObject, recoverExplicitOpParameters } from '../parameter_recovery.js';
import { isTelemetryEnabled, recordOpcodeExecution } from '../telemetry.js';

export function unwrapPromptSelection(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (typeof result === 'object') {
    if (result.declined === true) return [];
    if (Array.isArray(result.selected)) return result.selected;
    if (Array.isArray(result.candidates)) return result.candidates;
  }
  return [result];
}

export function narrowEitherSideFromClause(targetObj, clauseText) {
  if (!targetObj || typeof targetObj !== 'object') return targetObj;
  if (targetObj.side !== 'either') return targetObj;
  const t = String(clauseText || '').toLowerCase();
  if (!t) return targetObj;
  const hasOpp = /\bopposing\b|\bopponent'?s\b/i.test(t);
  const hasSelf = /\byour\b|\byou\s+control\b/i.test(t);
  if (hasOpp && !hasSelf) return { ...targetObj, side: 'opp' };
  if (hasSelf && !hasOpp) return { ...targetObj, side: 'self' };
  return targetObj;
}

export function resolveBounceDestination(op = {}, clause = {}) {
  const rawVal = typeof op === 'string' ? op : (op?.destination || op?.to || clause?.destination || '');
  const raw = String(rawVal).toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'grave' || raw === 'trash') return 'grave';
  if (raw === 'hand') return 'hand';
  if (['deck_bottom', 'deckbottom', 'bottom', 'bottom_of_deck'].includes(raw)) return 'deck_bottom';
  if (['deck_top', 'decktop', 'top', 'top_of_deck'].includes(raw)) return 'deck_top';
  const text = String(clause?.rawText || clause?.cleanText || clause?.text || op?.rawText || '').toLowerCase();
  if (raw === 'deck') {
    if (text.includes('deckbottom') || (text.includes('bottom') && text.includes('deck'))) return 'deck_bottom';
    if (text.includes('decktop') || (text.includes('top') && text.includes('deck'))) return 'deck_top';
    return null; // Ambiguous 'DECK' without top/bottom evidence
  }
  if (text.includes('deckbottom') || (text.includes('bottom') && text.includes('deck'))) return 'deck_bottom';
  if (text.includes('decktop') || (text.includes('top') && text.includes('deck'))) return 'deck_top';
  if (text.includes('trash')) return 'grave';
  return 'hand';
}

export function getBouncePromptTitle(destination = 'hand') {
  const dest = String(destination || 'hand').toLowerCase();
  if (dest === 'deck_bottom') return 'Select target to return to the bottom of the deck';
  if (dest === 'deck_top') return 'Select target to return to the top of the deck';
  if (dest === 'grave' || dest === 'trash') return 'Select target to send to the trash';
  return 'Select target to return to hand';
}

export async function emitAsyncEvent(events, type, payload = {}) {
  if (!events) return;
  const eventObj = { ...(payload && typeof payload === 'object' ? payload : {}), type };
  if (typeof events.emit === 'function') {
    await events.emit(eventObj);
  } else if (typeof events.dispatch === 'function') {
    await events.dispatch(eventObj);
  }
}

export function countCardZoneOccurrences(state, cardOrId) {
  if (!state?.players || !cardOrId) return 0;
  const cardId = typeof cardOrId === 'object' ? (cardOrId.id || cardOrId.cardNumber) : cardOrId;
  if (!cardId) return 0;
  const matches = (c) => Boolean(c && (c.id === cardId || (!c.id && c.cardNumber === cardId)));
  let count = 0;
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    if (!p) continue;
    for (const z of ['deck', 'hand', 'nexus', 'grave', 'removed', 'revealed', 'openCards']) {
      if (Array.isArray(p[z])) count += p[z].filter(matches).length;
    }
    if (matches(p.burst)) count++;
    if (matches(p.mirage)) count++;
    for (const st of p.field || []) {
      if (matches(st?.top)) count++;
      if (Array.isArray(st?.under)) count += st.under.filter(matches).length;
      if (Array.isArray(st?.braves)) count += st.braves.filter(matches).length;
    }
  }
  return count;
}

export function findCardCurrentZone(state, cardId) {
  if (!state?.players || !cardId) return null;
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    if (!p) continue;
    for (const z of ['deck', 'hand', 'nexus', 'grave', 'removed', 'revealed', 'openCards']) {
      if (Array.isArray(p[z]) && p[z].some(c => c && c.id === cardId)) return { side, zone: z };
    }
    if (p.burst?.id === cardId) return { side, zone: 'burst' };
    if (p.mirage?.id === cardId) return { side, zone: 'mirage' };
    for (const st of p.field || []) {
      if (st?.top?.id === cardId) return { side, zone: 'field', stack: st };
      if (Array.isArray(st?.under) && st.under.some(c => c && c.id === cardId)) return { side, zone: 'under', stack: st };
      if (Array.isArray(st?.braves) && st.braves.some(c => c && c.id === cardId)) return { side, zone: 'braves', stack: st };
    }
  }
  return null;
}

async function executeSummonTransaction(state, op, cardToSummon, isFree, controller, sourceCard, context, events) {
  const p = state.players[controller];
  if (!cardToSummon) return { status: 'REJECTED', success: false, reason: 'NO_SOURCE_CARD' };
  const summonCardType = String(cardToSummon.type || '').toLowerCase();
  if (summonCardType.includes('magic') || summonCardType.includes('nexus')) {
    return { status: 'REJECTED', success: false, reason: 'INVALID_SUMMON_CARD_TYPE' };
  }

  // 1. Validate initialCores BEFORE any ID or state mutation
  if (op.initialCores !== undefined) {
    if (typeof op.initialCores !== 'number' || !Number.isInteger(op.initialCores) || op.initialCores < 1) {
      return { status: 'REJECTED', success: false, reason: 'INVALID_INITIAL_CORES' };
    }
  }
  const coresNeeded = op.initialCores !== undefined ? op.initialCores : 1;

  // 2. Identity & field/duplicate checks (without mutating cardToSummon.id yet)
  const lookupId = cardToSummon.id || cardToSummon.cardNumber;
  if (!lookupId) return { status: 'REJECTED', success: false, reason: 'INVALID_CARD_IDENTITY' };

  const matchCard = (c) => Boolean(c && (c.id === lookupId || (!c.id && c.cardNumber === lookupId)));
  if ((p.field || []).some(st => matchCard(st?.top))) {
    return { status: 'REJECTED', success: false, reason: 'CARD_ALREADY_ON_FIELD' };
  }
  if (countCardZoneOccurrences(state, lookupId) > 1) {
    return { status: 'REJECTED', success: false, reason: 'DUPLICATE_CARD_OCCURRENCE' };
  }

  // 3. Strict Source-zone validation
  let normalizedFrom = op.from ? normalizeCardZone(op.from) : null;
  const inBurstSlot = matchCard(p.burst);
  const inActiveBurst = Boolean(context.activeBurstCard && matchCard(context.activeBurstCard));
  let originalFromZone = null;

  if (inActiveBurst || (inBurstSlot && normalizedFrom === 'burst')) {
    originalFromZone = 'burst';
  } else if (normalizedFrom) {
    if (normalizedFrom === 'burst') {
      if (!inBurstSlot && !inActiveBurst) {
        return { status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' };
      }
      originalFromZone = 'burst';
    } else if (normalizedFrom === 'grave') {
      if (!(p.grave || []).some(matchCard)) {
        return { status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' };
      }
      originalFromZone = 'grave';
    } else if (normalizedFrom === 'hand') {
      if (!(p.hand || []).some(matchCard)) {
        return { status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' };
      }
      originalFromZone = 'hand';
    } else if (normalizedFrom === 'removed') {
      if (!(p.removed || []).some(matchCard) && !(p.openCards || []).some(matchCard)) {
        return { status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' };
      }
      originalFromZone = 'removed';
    } else if (normalizedFrom === 'revealed') {
      if (!(p.revealed || []).some(matchCard) && !(context.revealedCards || []).some(matchCard)) {
        return { status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' };
      }
      originalFromZone = 'revealed';
    } else if (normalizedFrom === 'deck') {
      if (!(p.deck || []).some(matchCard)) {
        return { status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' };
      }
      originalFromZone = 'deck';
    } else {
      return { status: 'REJECTED', success: false, reason: 'UNSUPPORTED_SOURCE_ZONE' };
    }
  } else {
    // Unspecified op.from: determine physical zone, prioritizing burst then hand
    if (inBurstSlot || inActiveBurst) originalFromZone = 'burst';
    else if ((p.hand || []).some(matchCard)) originalFromZone = 'hand';
    else if ((p.revealed || []).some(matchCard) || (context.revealedCards || []).some(matchCard)) originalFromZone = 'revealed';
    else if ((p.grave || []).some(matchCard)) originalFromZone = 'grave';
    else if ((p.removed || []).some(matchCard)) originalFromZone = 'removed';
    else return { status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' };
  }

  if (isActionRestricted(state, 'CANNOT_SUMMON', controller, cardToSummon, {
    isFree,
    fromZone: originalFromZone,
    cardType: cardToSummon.type,
    sourceCard
  })) {
    return { status: 'REJECTED', transactionOutcome: 'REJECTED', success: false, reason: 'SUMMON_RESTRICTED' };
  }

  // 4. Cost & LV1 core preflight
  const cost = isFree
    ? Math.max(0, Number(op.costCores || 0))
    : ((op.free || op.noCost || op.withoutPayingCost) ? 0 : calculateEffectiveCost(state, cardToSummon, controller));
  const totalReserveAvailable = (p.reserve.normal || 0) + (p.reserve.soul > 0 ? 1 : 0);

  if ((p.reserve.normal || 0) < cost) {
    return { status: 'REJECTED', transactionOutcome: 'REJECTED', success: false, reason: 'INSUFFICIENT_COST_CORES' };
  }
  if (totalReserveAvailable < cost + coresNeeded) {
    return { status: 'REJECTED', transactionOutcome: 'REJECTED', success: false, reason: 'INSUFFICIENT_LV1_CORES' };
  }

  // 5. Normalize identity ONLY after all validation passes
  if (!cardToSummon.id && cardToSummon.cardNumber) {
    cardToSummon.id = cardToSummon.cardNumber;
  }

  // 6. Pay cost (if > 0)
  if (cost > 0) {
    const paid = await moveCore(state, cost, { zone: 'reserve', side: controller }, { zone: 'trash', side: controller }, {
      cause: 'summon_cost',
      by: controller,
      sourceCard
    }, events);
    if (!paid) return { status: 'FAILED', transactionOutcome: 'FAILED', success: false, reason: 'COST_PAYMENT_FAILED' };
  }

  // 7. Create stack & place initial cores atomically (rollback cost + stack if moveCore fails)
  const newStack = createFieldStack(cardToSummon, { normal: 0, soul: 0 });
  newStack.state = op.exhausted ? 'EXHAUSTED' : 'REFRESHED';
  p.field.push(newStack);

  const availNormalAfterCost = p.reserve.normal || 0;
  let usedSoul = false;
  let usedNormal = 0;
  if (availNormalAfterCost >= coresNeeded) {
    usedNormal = coresNeeded;
  } else if (availNormalAfterCost + (p.reserve.soul > 0 ? 1 : 0) >= coresNeeded) {
    usedSoul = true;
    usedNormal = Math.max(0, coresNeeded - 1);
  }

  let placementOk = (usedNormal + (usedSoul ? 1 : 0)) >= coresNeeded;
  if (placementOk && usedNormal > 0) {
    placementOk = await moveCore(state, usedNormal, { zone: 'reserve', side: controller }, { zone: 'field', side: controller, stackId: newStack.id }, {
      cause: 'summon',
      by: controller
    }, events);
  }
  if (placementOk && usedSoul) {
    placementOk = await moveCore(state, 1, { zone: 'reserve', side: controller }, { zone: 'field', side: controller, stackId: newStack.id }, {
      isSoulCore: true,
      cause: 'summon',
      by: controller
    }, events);
  }

  if (!placementOk) {
    // Rollback stack and any normal cores placed or paid
    p.field = p.field.filter(st => st.id !== newStack.id);
    if ((newStack.cores?.normal || 0) > 0) {
      p.reserve.normal += newStack.cores.normal;
    }
    if ((newStack.cores?.soul || 0) > 0) {
      p.reserve.soul += newStack.cores.soul;
    }
    if (cost > 0) {
      await moveCore(state, cost, { zone: 'trash', side: controller }, { zone: 'reserve', side: controller }, { cause: 'summon_rollback' }, events);
    }
    return { status: 'FAILED', transactionOutcome: 'ROLLED_BACK', success: false, reason: 'CORE_PLACEMENT_FAILED' };
  }

  // 8. Remove from source zone & emit SUMMONED
  const cid = cardToSummon.id;
  if (originalFromZone === 'hand') {
    p.hand = p.hand.filter(c => c.id !== cid);
  } else if (originalFromZone === 'grave') {
    p.grave = p.grave.filter(c => c.id !== cid);
  } else if (originalFromZone === 'removed') {
    p.removed = p.removed.filter(c => c.id !== cid);
    if (p.openCards) p.openCards = p.openCards.filter(c => c.id !== cid);
  } else if (originalFromZone === 'revealed') {
    if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== cid);
    if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== cid);
  } else if (originalFromZone === 'burst') {
    if (p.burst && p.burst.id === cid) p.burst = null;
    if (context.activeBurstCard && context.activeBurstCard.id === cid) context.activeBurstCard = null;
  } else if (originalFromZone === 'deck') {
    p.deck = p.deck.filter(c => c.id !== cid);
  } else {
    p.hand = p.hand.filter(c => c.id !== cid);
    p.grave = p.grave.filter(c => c.id !== cid);
    p.removed = p.removed.filter(c => c.id !== cid);
    if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== cid);
    if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== cid);
    if (p.burst && p.burst.id === cid) p.burst = null;
  }

  if (events) {
    await events.emit({
      type: 'SUMMONED',
      card: cardToSummon,
      stack: newStack,
      player: controller,
      cause: 'effect',
      sourceCard,
      fromZone: originalFromZone
    });
  }

  return { status: 'SUCCESS', transactionOutcome: 'COMMITTED', success: true, card: cardToSummon, stack: newStack, fromZone: originalFromZone };
}

export function matchesCardFilter(card, filter = {}, op = {}) {
  if (!card || typeof card !== 'object') return false;
  const f = filter || {};
  const o = op || {};
  if (f.cardNumber && String(card.cardNumber || card.card_number || '') !== String(f.cardNumber)) return false;

  // Types filter
  let targetTypes = f.types || (o.cardType ? [o.cardType] : (f.type ? [f.type] : (o.types || [])));
  if (typeof targetTypes === 'string') targetTypes = [targetTypes];
  if (Array.isArray(targetTypes) && targetTypes.length > 0) {
    const cardType = (card.type || '').toLowerCase();
    const typeMatch = targetTypes.some(t => {
      if (!t) return false;
      const lowT = String(t).toLowerCase();
      if (cardType === lowT) return true;
      const famStr = (Array.isArray(card.families) ? card.families.join(' ') : (card.family || '')).toLowerCase();
      if (lowT === 'grandwalker nexus' && cardType.includes('nexus') && (famStr.includes('grandwalker') || (card.name || '').toLowerCase().includes('grandwalker'))) return true;
      if (cardType.includes(lowT)) return true;
      return false;
    });
    if (!typeMatch) return false;
  }

  // Colors filter
  const targetColor = f.color || o.color;
  if (targetColor) {
    const rawColors = Array.isArray(card.colors) ? card.colors : (card.colors ? [card.colors] : (card.color ? [card.color] : []));
    if (!rawColors.some(c => c && String(c).toLowerCase() === String(targetColor).toLowerCase())) return false;
  }
  if (Array.isArray(f.colorsAny) && f.colorsAny.length) {
    const cardColors = Array.isArray(card.colors) ? card.colors : (card.color ? [card.color] : []);
    if (!cardColors.some(color => f.colorsAny.some(wanted => String(color).toLowerCase() === String(wanted).toLowerCase()))) return false;
  }

  // Yellow-only or single color only
  if (f.singleColorOnly || o.singleColorOnly) {
    const rawColors = Array.isArray(card.colors) ? card.colors : (card.colors ? [card.colors] : (card.color ? [card.color] : []));
    if (rawColors.length !== 1) return false;
  }

  // Family filter
  const targetFamily = f.family || o.family;
  if (targetFamily) {
    const rawFams = Array.isArray(card.families) ? card.families : (card.families ? [card.families] : (card.family ? [card.family] : []));
    if (!rawFams.some(fam => fam && String(fam).toLowerCase().includes(String(targetFamily).toLowerCase()))) return false;
  }

  if (Array.isArray(f.familiesAny) && f.familiesAny.length) {
    const cardFamilies = Array.isArray(card.families) ? card.families : (card.family ? [card.family] : []);
    if (!cardFamilies.some(fam => f.familiesAny.some(wanted => String(fam).toLowerCase().includes(String(wanted).toLowerCase())))) return false;
  }

  // Name includes filter
  const nameInc = f.nameIncludes || o.nameIncludes;
  if (nameInc) {
    if (!card.name || !String(card.name).toLowerCase().includes(String(nameInc).toLowerCase())) return false;
  }
  if (Array.isArray(f.nameIncludesAny) && f.nameIncludesAny.length && !f.nameIncludesAny.some(part => String(card.name || '').toLowerCase().includes(String(part).toLowerCase()))) return false;

  // Cost filter
  const cost = typeof card.cost === 'number' ? card.cost : parseInt(card.cost || '0', 10);
  if (f.costLte !== undefined && cost > f.costLte) return false;
  if (f.costGte !== undefined && cost < f.costGte) return false;
  if (o.costLte !== undefined && cost > o.costLte) return false;
  if (o.costGte !== undefined && cost < o.costGte) return false;

  return true;
}

const HIJ_REQUIRED_ANY_OF = {
  ACTIVATE_EFFECT_ACTION: ['keyword', 'action', 'effectName', 'timing'],
  ACTIVATE_EFFECT_SPECIAL: ['per', 'repeatPer', 'multiplier', 'condition', 'mode', 'count'],
  ACTIVATE_TRIGGER: ['trigger', 'timing', 'effectType'],
  TRIGGERED_WATCHER: ['watchEvent', 'event', 'trigger', 'action', 'cardType'],
  TRIGGER_CONDITION: ['event', 'condition', 'trigger', 'timing'],
  TRIGGER_COUNTER: ['counterTiming', 'when', 'trigger', 'zone'],
  CROSS_TRIGGER: ['lifeThreshold', 'condition', 'triggerMode'],
  BRAVE_EFFECT_ACTIVATION: ['when', 'timing', 'effect', 'trigger'],
  ACTIVATE_KEYWORD: ['keyword'],
  ON_BP_DESTROY: ['whoseDestroyed', 'when', 'effect', 'condition'],
  CONTRACT_ADVENT_RULE: ['zone', 'adventType', 'rule'],
  ADVENT_RULE_MODIFIER: ['fromZone', 'adventType', 'modifier', 'rule', 'ignoreCondition'],
  ADVENT_RULE: ['when', 'fromZone', 'adventType', 'rule'],
  ADVENT: ['from', 'target', 'filter', 'adventType'],
  ADVENT_COST: ['from', 'target'],
  PUT_UNDERNEATH: ['from', 'count', 'target'],
  ATTACH_CARD_UNDERNEATH: ['from', 'target', 'count'],
  ATTACH_PRE_ADVENT_CARD: ['from', 'target', 'count'],
  CARD_UNDERNEATH: ['action', 'from', 'target', 'count'],
  DISCARD_UNDERNEATH_COST: ['count', 'target', 'facedownOnly'],
  STACK_CARD: ['target', 'from'],
  SWAP_CARD: ['target', 'filter', 'from'],
  SWAP_CARDS: ['from', 'to', 'filter', 'count'],
  MIRAGE_OPERATION: ['action', 'operation', 'mode'],
  DISCARD_MIRAGE_COST: ['count', 'filter', 'zone'],
  COPY_EFFECT: ['source', 'timing', 'target', 'from'],
  COPY_PRE_ADVENT_EFFECT: ['filter', 'ignoreLevels', 'scope'],
  COPY_ABILITY: ['abilityType', 'keyword', 'filter', 'from'],
  MULTIPLY_EFFECT: ['per', 'multiplier', 'countSource'],
  MODIFY_DESTINATION: ['destination', 'replaces', 'fromEffect'],
  REDIRECT_TARGET: ['newTarget', 'filter', 'bpMax', 'mode'],
  REDIRECT_CORE_DESTINATION: ['destination', 'fromZone', 'cause'],
  LIFE_OR_CORE_MODIFICATION: ['count', 'amount', 'destination', 'targetZone'],
  LOOK_HAND: ['side', 'target'],
  LOOK_AT_HAND: ['side', 'target'],
  LOOK_AT_DECK: ['count', 'position'],
  LOOK_DECKTOP: ['count'],
  REVEAL_INTERACTION: ['onRevealBy', 'destination', 'action'],
  DISCARD_ZONE: ['zone', 'cardType', 'side'],
  DISCARD_AMONG: ['filter', 'color', 'count'],
  DISCARD_FIELD: ['side', 'cardType', 'filter'],
  DISCARD_FIELD_MAGIC: ['family', 'count', 'side'],
  DISCARD_FROM_FIELD_COST: ['family', 'count', 'cardType'],
  SEND_TO_TRASH: ['target', 'from', 'count'],
  PUT_CARD_ON_FIELD: ['from', 'cardType', 'filter'],
  PUT_FACEDOWN_FIELD: ['from', 'family', 'filter', 'count'],
  USE_FROM_HAND: ['cardType', 'timing', 'filter'],
  CAST_FROM_TRASH: ['condition', 'scope', 'zone'],
  LIMIT_DECK_DISCARD: ['maxPerTurn', 'limit'],
  MILL: ['count', 'amount'],
  CHOOSE_BLOCKER: ['when', 'mode', 'target', 'filter'],
  FORCE_ATTACK: ['side', 'minAttacks', 'target'],
  PIERCING_RULE: ['allowedPrevention', 'bypasses', 'effectType'],
  BATTLE_RULE_MODIFIER: ['rule', 'mode', 'effect'],
  BATTLE_MODIFIER: ['maxBattles', 'rule', 'mode'],
  GLOBAL_RESTRICTION: ['restriction', 'action', 'cannot'],
  DECK_BUILDING_RULE: ['maxCopies', 'rule'],
  DECK_CONSTRUCTION_RULE: ['maxCopies', 'rule'],
  DECK_RULE: ['maxCopies', 'rule'],
  GAIN_TEAM: ['teams', 'scope', 'allTeams'],
  TEAM_RULE: ['teams', 'scope', 'allTeams'],
  BUNSHIN_SUMMON: ['count', 'from', 'coresMin'],
  CREATE_BUNSHIN: ['count'],
  TARGET_FAMILY: ['families', 'mode', 'count'],
  CHOOSE_FAMILY: ['families', 'options'],
  ACTIVATE_SOUL_DRIVE: ['target', 'scope', 'filter'],
  RETRIEVE_CORES: ['count', 'from', 'to'],
  SYMBOL_MODIFIER: ['cardType', 'symbols', 'color'],
  COUNT_MODIFIER: ['multiplier', 'countAs', 'cardType'],
  COUNT_AS_MULTIPLE: ['countAs', 'cardType'],
  BP_FORMULA: ['per', 'multiplier', 'amountPerCore'],
  SPECIAL_WIN: ['winner', 'condition', 'reason'],
  LOSE_EFFECTS: ['target', 'cannotGainNew', 'scope'],
  ADD_FAMILY: ['families', 'family'],
  SELECT_TARGET: ['target', 'filter'],
  SUMMON_MULTI: ['from', 'filter', 'count'],
  SWITCH_CARD: ['target', 'filter', 'from'],
  SWAP_CORES: ['target', 'targets'],
  TREAT_NAME: ['treatedAsName', 'name'],
  TREAT_COST: ['treatedCost', 'cost'],
  TREAT_CORE_COUNT: ['target', 'from', 'mode'],
  TRIGGERED_BUFF: ['trigger', 'amount'],
  TRIGGERED_ACTION: ['trigger', 'action'],
  NEGATE_MAGIC: ['scope', 'timing', 'filter'],
  TAKE_CONTROL: ['target', 'filter', 'duration'],
  RETURN_CONTROL: ['state', 'timing', 'target'],
  CONTROL_RULE: ['coreOwner', 'coresLocked'],
  ATTACH_CARD: ['from', 'target', 'count'],
  CAST_FROM_DECK: ['condition', 'faceupOnly', 'zone', 'scope'],
  REVEAL_FROM_HAND_COST: ['handTrigger', 'condition', 'count', 'side'],
  ATTACK_RULE_MODIFIER: ['rule', 'mode', 'count'],
  SEARCH_DECK: ['filter', 'destination', 'count'],
  CHOOSE_LEVEL: ['levels', 'minLevel'],
  CORE_LOCK: ['target', 'scope'],
  OPPONENT_CHOICE: ['options', 'choices'],
  RETURN_DECK_BOTTOM: ['from', 'count', 'filter'],
  BATTLE_MULTIPLE: ['maxTargets', 'target'],
  DISCARD_HAND_MAX: ['triggerCount', 'targetCount', 'side'],
  EXCHANGE_CORE: ['from', 'to'],
  SCHEDULED_DESTROY: ['timing', 'target', 'scope'],
  SEPARATE_BRAVE: ['filter', 'target', 'name'],
  PAY_COST: ['source', 'cost'],
  BANISH_DESTINATION_RULE: ['replaces', 'destination', 'filter'],
  LOSE_IMMUNITY: ['colors', 'loseAll', 'target'],
  BOUNCE_TO_DECKBOTTOM: ['target', 'filter'],
  USE_ACCEL: ['onReveal', 'cardType'],
  TIMING_MODIFIER: ['timing', 'when'],
  LOOK_DECKTOP: ['count'],
  HEADER: ['timing', 'keyword'],
  CARD_PLAY_PERMISSION: ['timing', 'cardType', 'from'],
  MODIFY_ADVENT_CONDITION: ['modifiedAdcon', 'condition', 'targetFilter'],
  BEFORE_ADVENT_TRIGGER: ['targetFilter', 'timing'],
  COPY_TRIGGER: ['timing', 'maxPerAttack', 'scope'],
  EXPAND_TARGETS: ['fromScope', 'toScope'],
  ENHANCE_KEYWORD: ['keyword', 'targetDelta'],
  GRANT_EFFECT: ['target', 'effect'],
  SEND_CORES_TO_VOID: ['side', 'zone', 'leaveCount', 'count'],
  CHOOSE_BATTLE_TARGET: ['when', 'target', 'filter'],
  CHANGE_TARGET: ['newTarget', 'excludeSelf', 'filter'],
  VARIABLE_PAYMENT_EFFECT: ['tiers', 'amount'],
  ACTIVATE_SOUL_DRIVE_ALIAS: []
};

function validateHijOpParams(op) {
  const reqAny = HIJ_REQUIRED_ANY_OF[op?.op];
  if (!reqAny || reqAny.length === 0) return { valid: true };
  const ok = reqAny.some(k => op[k] !== undefined && op[k] !== null && op[k] !== '');
  if (!ok) {
    return { valid: false, missingAnyOf: reqAny };
  }
  return { valid: true };
}

function makeModId(prefix) {
  return `mod_${Date.now()}_${prefix}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeZoneKey(z) {
  const raw = String(z || '').toLowerCase().trim();
  if (raw === 'trash') return 'grave';
  if (raw === 'banished' || raw === 'removed_zone' || raw === 'remove') return 'removed';
  if (raw === 'deckbottom' || raw === 'bottom') return 'deck_bottom';
  if (raw === 'decktop' || raw === 'top') return 'deck_top';
  if (raw === 'soul_state' || raw === 'soulstate') return 'soul';
  return raw;
}

function removeCardPhysical(state, cardId) {
  if (!state?.players || !cardId) return null;
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    if (!p) continue;
    for (const zName of ['hand', 'deck', 'grave', 'removed', 'revealed', 'nexus', 'soulState']) {
      if (!Array.isArray(p[zName])) continue;
      const idx = p[zName].findIndex(c => c && c.id === cardId);
      if (idx !== -1) {
        return { card: p[zName].splice(idx, 1)[0], fromZone: zName, fromSide: side };
      }
    }
    if (p.burst?.id === cardId) {
      const card = p.burst;
      p.burst = null;
      return { card, fromZone: 'burst', fromSide: side };
    }
    if (p.mirage?.id === cardId) {
      const card = p.mirage;
      p.mirage = null;
      return { card, fromZone: 'mirage', fromSide: side };
    }
    if (Array.isArray(p.field)) {
      const stIdx = p.field.findIndex(st => st?.top?.id === cardId);
      if (stIdx !== -1) {
        const st = p.field.splice(stIdx, 1)[0];
        if (!p.reserve) p.reserve = { normal: 0, soul: 0 };
        const n = typeof st.cores === 'number' ? st.cores : (st.cores?.normal || 0);
        const s = typeof st.cores === 'number' ? 0 : (st.cores?.soul || 0);
        p.reserve.normal = (p.reserve.normal || 0) + n;
        p.reserve.soul = (p.reserve.soul || 0) + s;
        for (const under of (st.underCards || [])) {
          p.grave.push(under);
        }
        return { card: st.top, fromZone: 'field', fromSide: side, formerStack: st };
      }
      for (const st of p.field) {
        if (Array.isArray(st.underCards)) {
          const uIdx = st.underCards.findIndex(u => u && u.id === cardId);
          if (uIdx !== -1) {
            return { card: st.underCards.splice(uIdx, 1)[0], fromZone: 'underneath', fromSide: side, parentStack: st };
          }
        }
      }
    }
  }
  return null;
}

function attachCardUnderStack(state, card, targetStack, opts = {}) {
  if (!card || !targetStack) return false;
  const sharedUnder = Array.isArray(targetStack.under)
    ? targetStack.under
    : (Array.isArray(targetStack.underCards) ? targetStack.underCards : []);
  targetStack.under = sharedUnder;
  targetStack.underCards = sharedUnder;
  if (sharedUnder.some(c => c && c.id === card.id)) {
    return false; // Prevent duplicate physical card underneath
  }
  const clonedMeta = {
    ...card,
    facedown: opts.facedown !== undefined ? Boolean(opts.facedown) : true,
    isPreAdvent: Boolean(opts.preAdvent),
    attachedAtTurn: state.turnNumber || 1
  };
  sharedUnder.push(clonedMeta);
  if (opts.preAdvent) {
    if (!Array.isArray(targetStack.preAdventCards)) targetStack.preAdventCards = [];
    if (!targetStack.preAdventCards.some(c => c && c.id === card.id)) {
      targetStack.preAdventCards.push(clonedMeta);
    }
  }
  return true;
}

function cloneIrWithoutMutation(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

export async function executeOp(state, op, context = {}, promptResolver, events = null) {
  if (!state || !state.players) return { status: 'FAILED', success: false, reason: 'INVALID_STATE' };
  if (!op || !op.op) return { status: 'FAILED', success: false, reason: 'INVALID_OPERATION' };

  if (isTelemetryEnabled()) {
    const startTime = performance.now();
    const ctrl = context?.controller || 'player';
    const opp = ctrl === 'player' ? 'opponent' : 'player';
    const preSnapshot = {
      ctrlHand: state.players?.[ctrl]?.hand?.length,
      ctrlField: state.players?.[ctrl]?.field?.length,
      ctrlReserve: state.players?.[ctrl]?.reserve?.normal,
      ctrlGrave: state.players?.[ctrl]?.grave?.length,
      oppHand: state.players?.[opp]?.hand?.length,
      oppField: state.players?.[opp]?.field?.length,
      oppReserve: state.players?.[opp]?.reserve?.normal,
      oppGrave: state.players?.[opp]?.grave?.length
    };

    const result = await executeOpCore(state, op, context, promptResolver, events);
    const durationMs = performance.now() - startTime;

    const postSnapshot = {
      ctrlHand: state.players?.[ctrl]?.hand?.length,
      ctrlField: state.players?.[ctrl]?.field?.length,
      ctrlReserve: state.players?.[ctrl]?.reserve?.normal,
      ctrlGrave: state.players?.[ctrl]?.grave?.length,
      oppHand: state.players?.[opp]?.hand?.length,
      oppField: state.players?.[opp]?.field?.length,
      oppReserve: state.players?.[opp]?.reserve?.normal,
      oppGrave: state.players?.[opp]?.grave?.length
    };

    const stateDeltas = {};
    for (const k of Object.keys(preSnapshot)) {
      if (preSnapshot[k] !== postSnapshot[k]) {
        stateDeltas[k] = { from: preSnapshot[k], to: postSnapshot[k], delta: (postSnapshot[k] || 0) - (preSnapshot[k] || 0) };
      }
    }

    recordOpcodeExecution({
      opcode: op.op,
      cardId: context?.sourceCard?.cardNumber || context?.sourceCard?.id,
      abilityId: context?.currentAbility?.id,
      clauseId: context?.currentClause?.id,
      inputParams: op,
      preconditions: { controller: ctrl },
      resultStatus: result?.status || (result?.success ? 'SUCCESS' : 'FAILED'),
      executionSuccess: Boolean(result?.success),
      stateDeltas,
      durationMs
    });

    return result;
  }

  return await executeOpCore(state, op, context, promptResolver, events);
}

async function executeOpCore(state, op, context = {}, promptResolver, events = null) {
  if (!state || !state.players) return { status: 'FAILED', success: false, reason: 'INVALID_STATE' };
  if (!op || !op.op) return { status: 'FAILED', success: false, reason: 'INVALID_OPERATION' };

  const recoveryRawText = context?.currentClause?.rawText || context?.currentClause?.cleanText || '';
  if (isIncompleteOpObject(op) && recoveryRawText) {
    const rec = recoverExplicitOpParameters(op, recoveryRawText);
    if (rec.recovered && rec.params) {
      op = { ...op, ...rec.params, _recoveredFromRawText: true };
    } else if (rec.classification === 'UNRECOVERABLE_COMPLEX') {
      return {
        status: 'UNSUPPORTED',
        success: false,
        reason: 'UNRECOVERABLE_COMPLEX',
        op: op.op,
        recoveryClassification: rec.classification
      };
    }
  }

  const paramCheck = validateHijOpParams(op);
  if (!paramCheck.valid) {
    return {
      ok: false,
      status: 'UNSUPPORTED',
      success: false,
      applied: false,
      reason: 'MISSING_IR_PARAMETERS',
      missingAnyOf: paramCheck.missingAnyOf,
      op: op.op
    };
  }

  const ctx = context || {};
  const controller = ctx.controller || 'player';
  const sourceCard = ctx.sourceCard;
  const sourceStack = ctx.sourceStack || ctx.stack || null;
  if (!promptResolver && ctx.promptResolver) promptResolver = ctx.promptResolver;
  if (typeof promptResolver === 'function') promptResolver = new promptResolver();
  const oppSide = controller === 'player' ? 'opponent' : 'player';

  switch (op.op) {
    case 'DRAW':
    case 'DRAW_CARDS': {
      const requestedCount = op.count ?? op.amount;
      if (requestedCount !== undefined && (typeof requestedCount !== 'number' || !Number.isFinite(requestedCount) || requestedCount < 0)) {
        return { status: 'REJECTED', transactionOutcome: 'REJECTED', success: false, reason: 'INVALID_PARAMETERS', drawnCount: 0, cards: [] };
      }
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      if (isActionRestricted(state, 'CANNOT_DRAW', targetSide)) {
        return { status: 'REJECTED', transactionOutcome: 'REJECTED', success: false, reason: 'DRAW_RESTRICTED', drawnCount: 0, cards: [] };
      }
      const maxDrawMod = (state.modifiers || []).find(m =>
        m.type === 'CARD_RULE_MODIFIER' && typeof m.maxDraw === 'number' && (!m.side || m.side === 'both' || m.side === targetSide)
      );
      const rawCount = requestedCount ?? 1;
      const count = maxDrawMod ? Math.min(rawCount, maxDrawMod.maxDraw) : rawCount;
      const p = state.players[targetSide];
      if (!Array.isArray(p.hand)) p.hand = [];
      if (!Array.isArray(p.deck)) p.deck = [];
      const drawnCards = [];

      for (let i = 0; i < count; i++) {
        if (p.deck.length === 0) break; // Do as much as possible
        const topCard = p.deck[0];
        if (!topCard) break;
        const moved = await moveCard(
          state,
          topCard,
          'hand',
          targetSide,
          { cause: 'draw', sourceCard, expectedFromZone: 'deck', expectedFromSide: targetSide },
          events
        );
        const leftDeck = !p.deck.some(c => c && c.id === topCard.id);
        const handMatches = p.hand.filter(c => c && c.id === topCard.id).length;
        if (moved && leftDeck && handMatches === 1) {
          drawnCards.push(topCard);
          if (events) {
            await events.emit({
              type: 'CARD_DRAWN',
              player: targetSide,
              card: topCard,
              cause: 'effect',
              sourceCard
            });
          }
        }
      }

      return {
        status: drawnCards.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE',
        success: drawnCards.length > 0,
        drawnCount: drawnCards.length,
        cards: drawnCards
      };
    }

    case 'DISCARD_HAND': {
      const count = op.count || 1;
      const sideSpec = op.target?.side || op.side || (op.chooser === 'opp' ? 'opp' : 'self');
      const targetSide = (sideSpec === 'opp' || sideSpec === 'opponent') ? oppSide : controller;
      const candidates = queryCandidates(state, { zone: 'hand', side: sideSpec, allowOpponentHand: targetSide !== controller, types: ['Any'], filters: op.filter || {} }, context);
      if (candidates.length === 0) return { status: 'NO_OP_BY_RULE', success: false, discardedCount: 0, cards: [] };

      // Request selection via promptResolver
      const rawChosen = await promptResolver.choose({
        type: 'SELECT_CARDS',
        title: 'Choose cards to discard from hand',
        candidates,
        count,
        upTo: op.upTo,
        optional: op.optional,
        chooser: op.chooser === 'opp' ? oppSide : controller
      });

      if (rawChosen?.declined === true) {
        return { status: op.optional || op.upTo ? 'SKIPPED' : 'NO_OP_BY_RULE', success: Boolean(op.optional || op.upTo), discardedCount: 0, cards: [] };
      }

      const chosenList = (rawChosen && typeof rawChosen === 'object' && Array.isArray(rawChosen.selected))
        ? rawChosen.selected
        : (Array.isArray(rawChosen) ? rawChosen : (rawChosen ? [rawChosen] : []));

      if (!validateSelection(candidates, chosenList, { count, upTo: op.upTo, optional: op.optional })) {
        return { status: 'REJECTED', success: false, discardedCount: 0, cards: [], reason: 'INVALID_TARGET_SELECTION' };
      }

      const discarded = [];
      for (const item of chosenList) {
        const matchedCand = candidates.find(cand =>
          cand === item ||
          (typeof item === 'string' && (cand.candidateId === item || cand.cardId === item)) ||
          (typeof item === 'object' && ((item.candidateId && cand.candidateId === item.candidateId) || cand.card?.id === (item.card?.id || item.cardId || item.id)))
        );
        if (!matchedCand || !validateTargetAvailability(state, matchedCand, 'hand', targetSide)) {
          return { status: 'REJECTED', success: false, discardedCount: 0, cards: [], reason: 'TARGET_NO_LONGER_IN_ZONE' };
        }
        const c = matchedCand.card || matchedCand;
        const moved = await moveCard(state, c, 'grave', targetSide, { cause: 'discard', sourceCard, expectedFromZone: 'hand', expectedFromSide: targetSide }, events);
        if (moved) discarded.push(c);
      }

      return { status: discarded.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: discarded.length > 0, discardedCount: discarded.length, cards: discarded };
    }

    case 'DISCARD_PRE_ADVENT': {
      const p = state.players[controller];
      const stack = p.field.find(st => st.top.id === sourceCard.id);
      if (!stack || stack.under.length === 0) return { success: false };

      const preAdventCard = stack.under[0];
      await moveCard(state, preAdventCard, 'grave', controller, { cause: 'discard_pre_advent', sourceCard }, events);
      return { success: true, card: preAdventCard };
    }

    case 'MOVE_CORE': {
      let count = op.count || 1;
      if (op.countFrom === 'OPPONENT_HAND_DIV3') count = Math.floor((state.players[oppSide].hand || []).length / 3);
      if (op.countFrom === 'REVEALED_MATCHES') count = (context.revealedCards || []).filter(card => matchesCardFilter(card, op.filter)).length;
      const isSoul = Boolean(op.isSoulCore);
      const fromZone = op.from ? op.from.zone : (op.source === 'VOID' ? 'void' : 'reserve');
      const toZone = op.to ? op.to.zone : (op.destination === 'THIS_NEXUS' ? 'field' : 'reserve');
      const fromSide = op.from && op.from.side === 'opp' ? oppSide : controller;
      const toSide = op.to && op.to.side === 'opp' ? oppSide : controller;
      const minRemaining = typeof op.minCoresRemaining === 'number' ? op.minCoresRemaining : null;

      let totalMoved = 0;

      const resolvedFromZone = op.source === 'VOID' ? 'void' : fromZone;
      const resolvedToZone = op.destination === 'THIS_NEXUS' ? 'field' : toZone;

      if (fromZone === 'field' && minRemaining !== null) {
        const p = state.players[fromSide];
        for (let i = 0; i < count; i++) {
          const eligibleStacks = p.field.filter(st => {
            const cores = (st.cores.normal || 0) + (st.cores.soul ? 1 : 0);
            return cores > minRemaining;
          });
          if (eligibleStacks.length === 0) break;

          let fromStackId = null;
          if (op.from.target === 'self' && sourceCard) {
            const selfStack = eligibleStacks.find(st => st.top.id === sourceCard.id);
            if (selfStack) fromStackId = selfStack.id;
          } else {
            const chosenStack = await promptResolver.choose({
              type: 'SELECT_STACK',
              title: 'Choose a spirit to remove core from',
              candidates: eligibleStacks.map(st => ({ stack: st, card: st.top })),
              count: 1,
              chooser: op.chooser === 'opp' ? oppSide : controller
            });
            if (chosenStack && chosenStack[0]) {
              fromStackId = chosenStack[0].stack ? chosenStack[0].stack.id : chosenStack[0].id;
            }
          }

          if (!fromStackId) break;

          let toStackId = null;
          if (toZone === 'field') {
            const toP = state.players[toSide];
            if ((op.to?.target === 'self' || op.destination === 'THIS_NEXUS') && sourceCard) {
              const selfStack = toP.field.find(st => st.top.id === sourceCard.id);
              if (selfStack) toStackId = selfStack.id;
            } else if (toP.field.length > 0) {
              if (promptResolver && typeof promptResolver.choose === 'function') {
                const chosenStack = await promptResolver.choose({
                  type: 'SELECT_CORE_ALLOCATION',
                  title: 'Choose a spirit to place core on',
                  candidates: toP.field.map(st => ({ stack: st, card: st.top })),
                  count: 1,
                  chooser: toSide
                });
                if (chosenStack && (chosenStack[0] || chosenStack.selected?.[0])) {
                  const picked = chosenStack[0] || chosenStack.selected[0];
                  toStackId = picked.stack ? picked.stack.id : (picked.id || picked);
                }
              }
              if (!toStackId && !promptResolver) toStackId = (toP.field[0] && toP.field[0].id) || null;
            }
          }

          const res = await moveCore(
            state,
            1,
            { zone: fromZone, side: fromSide, stackId: fromStackId },
            { zone: toZone, side: toSide, stackId: toStackId },
            { isSoulCore: isSoul, cause: 'effect', by: controller, sourceCard, minCoresRemaining, targetsGrandwalker: op.from?.target === 'self' || op.to?.target === 'self' || op.destination === 'THIS_NEXUS' },
            events
          );
          if (res) totalMoved++;
          else break;
        }
        return { success: totalMoved > 0, coresMoved: totalMoved };
      }

      let fromStackId = null;
      let toStackId = null;

      if (fromZone === 'field') {
        const p = state.players[fromSide];
        if (op.from.target === 'self' && sourceCard) {
          const selfStack = p.field.find(st => st.top.id === sourceCard.id);
          if (selfStack) fromStackId = selfStack.id;
        } else if (p.field.length > 0) {
          // If chooser is opp, prompt opponent to pick their spirit
          const chosenStack = await promptResolver.choose({
            type: 'SELECT_STACK',
            title: 'Choose a spirit to remove core from',
            candidates: p.field.map(st => ({ stack: st, card: st.top })),
            count: 1,
            chooser: op.chooser === 'opp' ? oppSide : controller
          });
          if (chosenStack && chosenStack[0]) {
            fromStackId = chosenStack[0].stack ? chosenStack[0].stack.id : chosenStack[0].id;
          }
        }
      }

      if (toZone === 'field') {
        const p = state.players[toSide];
        if ((op.to?.target === 'self' || op.destination === 'THIS_NEXUS') && sourceCard) {
          const selfStack = p.field.find(st => st.top.id === sourceCard.id);
          if (selfStack) toStackId = selfStack.id;
        } else if (p.field.length > 0) {
          if (promptResolver && typeof promptResolver.choose === 'function') {
            const chosenStack = await promptResolver.choose({
              type: 'SELECT_CORE_ALLOCATION',
              title: 'Choose a spirit to place core on',
              candidates: p.field.map(st => ({ stack: st, card: st.top })),
              count: 1,
              chooser: toSide
            });
            if (chosenStack && (chosenStack[0] || chosenStack.selected?.[0])) {
              const picked = chosenStack[0] || chosenStack.selected[0];
              toStackId = picked.stack ? picked.stack.id : (picked.id || picked);
            }
          }
          if (!toStackId && !promptResolver) toStackId = (p.field[0] && p.field[0].id) || null;
        }
      }

      const res = await moveCore(
        state,
        count,
        { zone: resolvedFromZone, side: fromSide, stackId: fromStackId },
        { zone: resolvedToZone, side: toSide, stackId: toStackId },
        { isSoulCore: isSoul, cause: 'effect', by: controller, sourceCard, targetsGrandwalker: op.from?.target === 'self' || op.to?.target === 'self' || op.destination === 'THIS_NEXUS' },
        events
      );

      return { success: res, coresMoved: count };
    }

    case 'PAY_GOD_CORE':
    case 'PAY_GOD_CORES': {
      const count = op.count || 1;
      const targetStack = ctx.sourceStack || ((op.stackId || op.target?.stackId) ? state.players[controller].field.find(st => st.id === (op.stackId || op.target?.stackId)) : null) || (sourceCard ? state.players[controller].field.find(st => st.top?.id === sourceCard.id) : null);
      if (!targetStack) {
        return { success: false, reason: 'NO_TARGET_STACK', movedCount: 0 };
      }
      const hasGodCores = typeof targetStack.godCores === 'number';
      const available = hasGodCores ? targetStack.godCores : (targetStack.cores?.normal || 0);
      if (available < count) {
        return { success: false, reason: 'INSUFFICIENT_GOD_CORES', movedCount: 0 };
      }
      if (hasGodCores) {
        targetStack.godCores -= count;
      } else {
        targetStack.cores.normal -= count;
      }
      const remaining = hasGodCores ? targetStack.godCores : (targetStack.cores?.normal || 0);
      const p = state.players[controller];
      p.voidCores = p.voidCores || { normal: 0, soul: 0 };
      p.voidCores.normal += count;
      if (events) {
        await events.emit({
          type: 'GOD_CORES_PAID',
          player: controller,
          count,
          stackId: targetStack.id,
          sourceCard,
          remaining
        });
      }
      return { success: true, count, movedCount: count, remaining };
    }

    case 'FLIP_CARD':
    case 'REBIRTH_FLIP': {
      const targetStack = ctx.sourceStack || ((op.stackId || op.target?.stackId) ? state.players[controller].field.find(st => st.id === (op.stackId || op.target?.stackId)) : null) || (sourceCard ? state.players[controller].field.find(st => st.top?.id === sourceCard.id) : null);
      if (!targetStack) {
        return { success: false, reason: 'NO_TARGET_STACK' };
      }
      const currentFace = targetStack.currentFace || targetStack.top.face || 'A';
      const nextFace = currentFace === 'A' ? 'B' : 'A';
      targetStack.currentFace = nextFace;
      targetStack.isFlipped = nextFace === 'B';
      targetStack.top.face = nextFace;

      if (nextFace === 'B' && (targetStack.top.backSide || targetStack.top.rebirthSide || targetStack.top.sideB)) {
        const back = targetStack.top.backSide || targetStack.top.rebirthSide || targetStack.top.sideB;
        if (!targetStack.top.frontSide) {
          targetStack.top.frontSide = { ...targetStack.top, backSide: undefined };
        }
        Object.assign(targetStack.top, back, {
          id: targetStack.top.id,
          placementId: targetStack.top.placementId,
          owner: targetStack.top.owner,
          face: 'B'
        });
      } else if (nextFace === 'A' && targetStack.top.frontSide) {
        const front = targetStack.top.frontSide;
        Object.assign(targetStack.top, front, {
          id: targetStack.top.id,
          placementId: targetStack.top.placementId,
          owner: targetStack.top.owner,
          face: 'A'
        });
      }

      if (op.faceData) {
        Object.assign(targetStack.top, op.faceData, {
          id: targetStack.top.id,
          placementId: targetStack.top.placementId,
          owner: targetStack.top.owner,
          face: nextFace
        });
      }

      if (events) {
        await events.emit({
          type: 'CARD_FLIPPED',
          stackId: targetStack.id,
          card: targetStack.top,
          face: nextFace,
          isFlipped: targetStack.isFlipped,
          player: controller
        });
      }

      return {
        success: true,
        stackId: targetStack.id,
        currentFace: nextFace,
        isFlipped: targetStack.isFlipped,
        stack: targetStack
      };
    }

    case 'DESTROY': {
      const rawClauseText = context?.currentClause?.cleanText || context?.currentClause?.rawText || '';
      let targetSpec = (op.target && typeof op.target === 'object')
        ? { ...op.target, side: op.target.side || op.side, zone: op.target.zone || op.zone || op.from, types: op.target.types || op.types, count: op.count ?? op.target.count, all: op.all ?? op.target.all, upTo: op.upTo ?? op.target.upTo, optional: op.optional ?? op.target.optional, maxTotalBp: op.maxTotalBp ?? op.target.maxTotalBp, maxTotalCost: op.maxTotalCost ?? op.target.maxTotalCost, highest: op.highest ?? op.target.highest, lowest: op.lowest ?? op.target.lowest, filter: op.filter || op.target.filter }
        : (op.target || { side: op.side || 'opp', zone: op.zone || op.from || 'field', types: op.types || ['Spirit'], filter: op.filter, count: op.count, all: op.all, upTo: op.upTo, optional: op.optional, maxTotalBp: op.maxTotalBp, maxTotalCost: op.maxTotalCost, highest: op.highest, lowest: op.lowest });
      targetSpec = narrowEitherSideFromClause(targetSpec, rawClauseText);

      const res = await resolveTargets(
        state,
        targetSpec,
        { ...context, bypassArmor: Boolean(op.ignoreArmor) },
        promptResolver,
        { defaultSide: 'opp', defaultTypes: ['Spirit'], promptType: 'SELECT_DESTROY', title: 'Select opposing targets to destroy', effectType: 'destroy' }
      );

      if (res.status === 'NO_OP_BY_RULE') {
        const isAll = Boolean(op.all || op.target?.all);
        if (context && context.previousTarget === undefined) context.previousTarget = null;
        if (context && !Array.isArray(context.previousTargets)) context.previousTargets = [];
        return { status: 'NO_OP_BY_RULE', success: isAll, destroyedCount: 0, cards: [], reason: isAll ? null : (res.reason || 'NO_LEGAL_TARGETS') };
      }
      if (!res.success) {
        return { status: res.status || 'REJECTED', success: false, destroyedCount: 0, cards: [], reason: res.reason };
      }

      const targets = res.targets || [];
      const isBatch = targets.length > 1;
      const destroyed = [];
      for (const item of targets) {
        const card = item.card || item.top || item;
        const ownerSide = card.owner || item.side || oppSide;
        const pSide = state.players[ownerSide] || state.players[item.side];
        const hasKnownFieldStack = Boolean(item.stack && pSide?.field && pSide.field.some(s => s.id === item.stack.id) && item.stack.top?.id === card.id);
        if (!hasKnownFieldStack && findCardCurrentZone(state, card.id)?.zone === 'grave') continue;
        if (!hasKnownFieldStack && (item.zone === 'field' || !item.zone) && findCardCurrentZone(state, card.id)?.zone !== 'field') continue;
        const moveOpts = hasKnownFieldStack
          ? { cause: 'destroy', by: controller, sourceCard, bypassArmor: Boolean(op.ignoreArmor), knownFromZone: 'field', knownFromSide: item.side, knownFromStack: item.stack }
          : { cause: 'destroy', by: controller, sourceCard, bypassArmor: Boolean(op.ignoreArmor) };
        const moved = await moveCard(state, card, 'grave', ownerSide, moveOpts, isBatch ? null : events);
        if (moved) {
          destroyed.push({ card, ownerSide, fromZone: item.zone || 'field' });
        }
      }

      if (isBatch && destroyed.length > 0 && events) {
        for (const d of destroyed) {
          await emitAsyncEvent(events, 'CARD_MOVED', { card: d.card, fromZone: d.fromZone, toZone: 'grave', player: d.ownerSide, cause: 'destroy', by: controller, sourceCard: sourceCard || null });
          await emitAsyncEvent(events, 'DESTROYED', { card: d.card, player: d.ownerSide, cause: 'destroy', by: controller, sourceCard: sourceCard || null });
        }
        await emitAsyncEvent(events, 'DESTROYED_BATCH', { cards: destroyed.map(d => d.card), player: controller, by: controller, sourceCard: sourceCard || null });
      }

      const destroyedCards = destroyed.map(d => d.card);
      return {
        status: destroyedCards.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE',
        success: destroyedCards.length > 0 || Boolean(op.all || op.target?.all),
        destroyedCount: destroyedCards.length,
        cards: destroyedCards
      };
    }

    case 'BOUNCE': {
      const targetZone = resolveBounceDestination(op, context.currentClause);
      if (!targetZone) {
        return { status: 'REJECTED', success: false, bouncedCount: 0, cards: [], reason: 'UNSUPPORTED_OR_AMBIGUOUS_DESTINATION' };
      }
      const cleanBounceText = String(context?.currentClause?.cleanText || context?.currentClause?.rawText || '');
      if ((op.target === 'self' || op.target?.card === 'SELF' || (/^return\s+this\s+(?:exhausted\s+|refreshed\s+)?(?:spirit|ultimate|brave|card|nexus)/i.test(cleanBounceText) && op.target?.side === 'either')) && sourceCard) {
        const ownerSide = sourceCard.owner || controller;
        const moved = await moveCard(state, sourceCard, targetZone, ownerSide, { cause: 'bounce', by: controller, sourceCard }, events);
        if (moved) {
          await emitAsyncEvent(events, 'BOUNCED', { card: sourceCard, cards: [sourceCard], destination: targetZone, to: targetZone, player: ownerSide, by: controller, sourceCard });
          return { status: 'SUCCESS', success: true, bouncedCount: 1, cards: [sourceCard] };
        }
        return { status: 'NO_OP_BY_RULE', success: false, bouncedCount: 0, cards: [], reason: 'SOURCE_CARD_NOT_MOVED' };
      }
      // K1-BATCH-05: hand-zone bounce (e.g. "the opponent returns a card from their Hand to the deckbottom")
      const handZoneSpec = op.target && typeof op.target === 'object' && String(op.target.zone || '').toLowerCase() === 'hand';
      if (handZoneSpec) {
        const hSide = op.target.side === 'opp' || op.target.side === 'opponent' ? oppSide : controller;
        const hp = state.players[hSide];
        const pool = (hp?.hand || []).filter(c => !op.target.filter && !op.filter ? true : matchesCardFilter(c, op.target.filter || op.filter, op));
        if (pool.length === 0) return { status: 'NO_OP_BY_RULE', success: false, bouncedCount: 0, cards: [], reason: 'NO_LEGAL_TARGETS' };
        const want = Math.min(pool.length, typeof op.count === 'number' ? op.count : 1);
        let chosen = [];
        if (promptResolver && typeof promptResolver.choose === 'function') {
          const picked = await promptResolver.choose({
            type: 'SELECT_CARDS',
            title: getBouncePromptTitle(targetZone),
            candidates: pool.map(card => ({ card, side: hSide, zone: 'hand' })),
            count: want,
            chooser: hSide
          });
          if (Array.isArray(picked) && picked.length > 0) {
            chosen = picked.map(x => x.card || x).slice(0, want);
          } else if (picked?.selected && Array.isArray(picked.selected)) {
            chosen = picked.selected.map(x => x.card || x).slice(0, want);
          }
        } else if (!state?.matchContext || state.matchContext.canSimulate(hSide)) {
          chosen = pool.slice(0, want);
        } else {
          return { status: 'UNRESOLVED', success: false, bouncedCount: 0, cards: [], reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
        }
        const bouncedH = [];
        for (const card of chosen) {
          const moved = await moveCard(state, card, targetZone, hSide, { cause: 'bounce', by: controller, sourceCard }, events);
          if (moved) {
            bouncedH.push(card);
            await emitAsyncEvent(events, 'BOUNCED', { card, cards: [card], destination: targetZone, to: targetZone, player: hSide, by: controller, sourceCard, fromZone: 'hand' });
          }
        }
        return { status: bouncedH.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: bouncedH.length > 0, bouncedCount: bouncedH.length, cards: bouncedH };
      }
      const rawBounceClauseText = context?.currentClause?.cleanText || context?.currentClause?.rawText || '';
      const isBounceFromTrash = /from\s+(?:your\s+|opposing\s+|opponent'?s\s+)?(?:trash|grave)/i.test(rawBounceClauseText);
      const resolvedBounceZone = op.target?.zone || op.zone || op.from || (isBounceFromTrash ? 'grave' : 'field');
      const targetSpec = (op.target && typeof op.target === 'object')
        ? { ...op.target, destination: targetZone, side: op.target.side || op.side, zone: resolvedBounceZone, types: op.target.types || op.types, count: op.count ?? op.target.count, all: op.all ?? op.target.all, upTo: op.upTo ?? op.target.upTo, optional: op.optional ?? op.target.optional, filter: op.filter || op.target.filter }
        : (op.target || { destination: targetZone, side: op.side || 'opp', zone: resolvedBounceZone, types: op.types || ['Spirit'], filter: op.filter, count: op.count, all: op.all, upTo: op.upTo, optional: op.optional });

      const res = await resolveTargets(
        state,
        targetSpec,
        context,
        promptResolver,
        { defaultSide: 'opp', defaultTypes: ['Spirit'], promptType: 'SELECT_BOUNCE', title: getBouncePromptTitle(targetZone), effectType: 'bounce' }
      );

      if (res.status === 'NO_OP_BY_RULE') {
        return { status: 'NO_OP_BY_RULE', success: Boolean(op.all || op.target?.all), bouncedCount: 0, cards: [], reason: res.reason || 'NO_LEGAL_TARGETS' };
      }
      if (!res.success) {
        return { status: res.status || 'REJECTED', success: false, bouncedCount: 0, cards: [], reason: res.reason };
      }

      const bounced = [];
      const toMove = targetZone === 'deck_top' ? [...(res.targets || [])].reverse() : (res.targets || []);
      for (const item of toMove) {
        const card = item.card || item.top || item;
        const ownerSide = card.owner || item.side || oppSide;
        const moved = await moveCard(state, card, targetZone, ownerSide, { cause: 'bounce', by: controller, sourceCard }, events);
        if (moved) {
          bounced.push(card);
          await emitAsyncEvent(events, 'BOUNCED', { card, cards: [card], destination: targetZone, to: targetZone, player: ownerSide, by: controller, sourceCard });
        }
      }

      return {
        status: bounced.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE',
        success: bounced.length > 0 || Boolean(op.all || op.target?.all),
        bouncedCount: bounced.length,
        cards: bounced
      };
    }

    case 'EXHAUST': {
      const exhaustBlocked = (sideToCheck, st) => isActionRestricted(state, 'CANNOT_EXHAUST', sideToCheck, st);

      if (op.target === 'self' || op.target?.card === 'SELF' || (typeof op.target === 'object' && op.target.side === 'self' && op.target.card === 'SELF')) {
        const p = state.players[controller];
        const selfStack = sourceStack || (sourceCard ? ((p.field || []).find(st => (st.top?.id || st.id) === (sourceCard.id || sourceCard)) || (p.nexus || []).find(st => (st.top?.id || st.id) === (sourceCard.id || sourceCard))) : null);
        if (!selfStack) return { status: 'NO_OP_BY_RULE', success: false, exhaustedCount: 0, cards: [], reason: 'NO_SELF_STACK' };
        if (exhaustBlocked(controller, selfStack)) return { status: 'REJECTED', success: false, exhaustedCount: 0, cards: [], reason: 'EXHAUST_RESTRICTED' };
        const nextState = op.isHeavy ? 'HEAVY_EXHAUSTED' : 'EXHAUSTED';
        if (selfStack.state === nextState || (selfStack.state === 'HEAVY_EXHAUSTED' && !op.isHeavy)) {
          return { status: 'NO_OP_BY_RULE', success: false, exhaustedCount: 0, cards: [], reason: 'ALREADY_EXHAUSTED' };
        }
        const prevState = selfStack.state || 'REFRESHED';
        selfStack.state = nextState;
        await emitAsyncEvent(events, 'EXHAUSTED', { card: selfStack.top, stack: selfStack, player: controller, previousState: prevState, newState: nextState, by: controller, sourceCard });
        return { status: 'SUCCESS', success: true, exhaustedCount: 1, cards: selfStack.top ? [selfStack.top] : [] };
      }

      const cleanExText = String(context?.currentClause?.cleanText || context?.currentClause?.rawText || '');
      const usePrevSelectedForExhaust = Boolean(op.target?.side === 'either' && /\bthem\b/i.test(cleanExText) && Array.isArray(context.selectedTargets) && context.selectedTargets.length > 0);
      const targetSpec = usePrevSelectedForExhaust
        ? { target: 'PREVIOUS_TARGET' }
        : ((op.target && typeof op.target === 'object')
          ? { ...op.target, side: op.target.side || op.side, types: op.target.types || op.types, count: op.count ?? op.target.count, all: op.all ?? op.target.all, upTo: op.upTo ?? op.target.upTo, optional: op.optional ?? op.target.optional, filter: op.filter || op.target.filter }
          : (op.target || { side: op.side || 'opp', types: op.types || ['Spirit'], filter: op.filter, count: op.count, all: op.all, upTo: op.upTo, optional: op.optional }));

      const res = await resolveTargets(
        state,
        targetSpec,
        { ...context, bypassArmor: Boolean(op.ignoreArmor) },
        promptResolver,
        { defaultSide: 'opp', defaultTypes: ['Spirit'], promptType: 'SELECT_EXHAUST', title: 'Select target to exhaust', effectType: 'exhaust' }
      );
      if (res.status === 'NO_OP_BY_RULE') {
        return { status: 'NO_OP_BY_RULE', success: Boolean(op.all || op.target?.all), exhaustedCount: 0, cards: [], reason: res.reason || 'NO_LEGAL_TARGETS' };
      }
      if (!res.success) {
        return { status: res.status || 'REJECTED', success: false, exhaustedCount: 0, cards: [], reason: res.reason };
      }

      const nextState = op.isHeavy ? 'HEAVY_EXHAUSTED' : 'EXHAUSTED';
      const exhaustedCards = [];
      for (const item of res.targets || []) {
        const st = item.stack;
        if (!st) continue;
        const ownerSide = item.side || st.top?.owner || oppSide;
        if (exhaustBlocked(ownerSide, st)) continue;
        if (st.state === nextState || (st.state === 'HEAVY_EXHAUSTED' && !op.isHeavy)) continue;
        const prevState = st.state || 'REFRESHED';
        st.state = nextState;
        if (st.top) exhaustedCards.push(st.top);
        await emitAsyncEvent(events, 'EXHAUSTED', { card: st.top, stack: st, player: ownerSide, previousState: prevState, newState: nextState, by: controller, sourceCard });
      }

      return {
        status: exhaustedCards.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE',
        success: exhaustedCards.length > 0 || Boolean(op.all || op.target?.all),
        exhaustedCount: exhaustedCards.length,
        cards: exhaustedCards
      };
    }

    case 'RESTORE':
    case 'REFRESH': {
      const refreshBlocked = (sideToCheck, st) => Boolean(
        st.cannotRefreshNextStep || st.spellbound ||
        isActionRestricted(state, 'CANNOT_REFRESH', sideToCheck, st)
      );

      if (op.target === 'self' || op.target?.card === 'SELF' || !op.target) {
        const p = state.players[controller];
        const selfStack = sourceStack || (sourceCard ? (p.field || []).find(st => (st.top?.id || st.id) === (sourceCard.id || sourceCard)) : null);
        if (!selfStack) return { status: 'NO_OP_BY_RULE', success: false, refreshedCount: 0, cards: [], reason: 'NO_SELF_STACK' };
        if (refreshBlocked(controller, selfStack)) return { status: 'REJECTED', success: false, refreshedCount: 0, cards: [], reason: 'REFRESH_RESTRICTED' };
        if (selfStack.state === 'REFRESHED') {
          return { status: 'NO_OP_BY_RULE', success: false, refreshedCount: 0, cards: [], reason: 'ALREADY_REFRESHED' };
        }
        const prevState = selfStack.state || 'EXHAUSTED';
        selfStack.state = prevState === 'HEAVY_EXHAUSTED' ? 'EXHAUSTED' : 'REFRESHED';
        await emitAsyncEvent(events, 'CARD_REFRESHED', { card: selfStack.top, stack: selfStack, player: controller, previousState: prevState, newState: selfStack.state, by: controller, sourceCard });
        return { status: 'SUCCESS', success: true, refreshedCount: 1, cards: selfStack.top ? [selfStack.top] : [] };
      }

      const targetSpec = (op.target && typeof op.target === 'object')
        ? { ...op.target, side: op.target.side || op.side || 'self', types: op.target.types || op.types || ['Spirit'], count: op.count ?? op.target.count, all: op.all ?? op.target.all, upTo: op.upTo ?? op.target.upTo, optional: op.optional ?? op.target.optional, filter: op.filter || op.target.filter }
        : (op.target || { side: op.side || 'self', types: op.types || ['Spirit'], filter: op.filter, count: op.count, all: op.all, upTo: op.upTo, optional: op.optional });

      const res = await resolveTargets(
        state,
        targetSpec,
        context,
        promptResolver,
        { defaultSide: 'self', defaultTypes: ['Spirit'], promptType: 'SELECT_REFRESH', title: 'Select spirit to refresh', effectType: 'refresh' }
      );
      if (res.status === 'NO_OP_BY_RULE') {
        return { status: 'NO_OP_BY_RULE', success: Boolean(op.all || op.target?.all), refreshedCount: 0, cards: [], reason: res.reason || 'NO_LEGAL_TARGETS' };
      }
      if (!res.success) {
        return { status: res.status || 'REJECTED', success: false, refreshedCount: 0, cards: [], reason: res.reason };
      }

      const refreshedCards = [];
      for (const item of res.targets || []) {
        const st = item.stack;
        if (!st) continue;
        const ownerSide = item.side || st.top?.owner || controller;
        if (refreshBlocked(ownerSide, st)) continue;
        if (st.state === 'REFRESHED') continue;
        const prevState = st.state || 'EXHAUSTED';
        st.state = prevState === 'HEAVY_EXHAUSTED' ? 'EXHAUSTED' : 'REFRESHED';
        if (st.top) refreshedCards.push(st.top);
        await emitAsyncEvent(events, 'CARD_REFRESHED', { card: st.top, stack: st, player: ownerSide, previousState: prevState, newState: st.state, by: controller, sourceCard });
      }

      return {
        status: refreshedCards.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE',
        success: refreshedCards.length > 0 || Boolean(op.all || op.target?.all),
        refreshedCount: refreshedCards.length,
        cards: refreshedCards
      };
    }

    case 'BP_BUFF': {
      let targetStackId = null;
      let targetFilter = null;
      const p = state.players[controller];
      const selfStack = (p.field || []).find(st => st.top && sourceCard && (st.top.id === sourceCard.id || st.top.cardNumber === sourceCard.cardNumber));
      const isGroupBuff = Boolean(op.all || op.target === 'all_friendly' || op.targetGroup === 'ALL_FRIENDLY');

      const rawBuffText = context?.currentClause?.cleanText || context?.currentClause?.rawText || '';
      const buffSide = (op.target && typeof op.target === 'object' && op.target.side)
        ? op.target.side
        : (op.side || 'self');
      const resolvedBuffSide = (buffSide === 'either')
        ? ((/opposing|opponent'?s/i.test(rawBuffText) && !/your|you\s+control/i.test(rawBuffText)) ? 'opp' : 'self')
        : (buffSide === 'opp' || buffSide === 'opponent' ? 'opp' : 'self');

      if (isGroupBuff) {
        targetFilter = (op.target && typeof op.target === 'object') ? op.target : (op.filter || null);
      } else if (op.target === 'self' || op.target === 'this_spirit' || op.target === 'this_unit' || (!op.target && selfStack)) {
        if (selfStack) targetStackId = selfStack.id;
      } else {
        const candidates = queryCandidates(state, { side: resolvedBuffSide, types: ['Spirit', 'Ultimate'] }, context);
        if (candidates.length > 0) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_BP_BUFF',
            title: 'Select Spirit/Ultimate to grant BP buff',
            candidates,
            count: 1,
            chooser: controller
          });
          const chosenArr = Array.isArray(chosen) ? chosen : (Array.isArray(chosen?.selected) ? chosen.selected : []);
          if (chosenArr[0]) {
            targetStackId = chosenArr[0].stack ? chosenArr[0].stack.id : chosenArr[0].id;
          } else if (selfStack && resolvedBuffSide === 'self') {
            targetStackId = selfStack.id;
          }
        } else if (selfStack && resolvedBuffSide === 'self') {
          targetStackId = selfStack.id;
        }
      }

      let multiplier = 1;
      if (op.forEach) {
        const forEachType = String(op.forEach).toUpperCase();
        if (forEachType === 'RESERVE_CORES' || forEachType === 'CORE_IN_RESERVE') {
          const p = state.players[controller];
          multiplier = (p.reserve.normal || 0) + (p.reserve.soul ? 1 : 0);
        } else if (forEachType === 'OPPOSING_REFRESHED_SPIRITS' || forEachType === 'REFRESHED_SPIRIT_COUNT') {
          const oppP = state.players[oppSide];
          multiplier = (oppP.field || []).filter(st => st.state === 'REFRESHED' && (st.top.type || '').includes('Spirit')).length;
        } else if (forEachType === 'DRAGON_FAMILY_SPIRITS' || forEachType === 'DRAGON_FAMILY_COUNT') {
          const p = state.players[controller];
          multiplier = (p.field || []).filter(st => {
            const fams = (Array.isArray(st.top.families) ? st.top.families : (st.top.family ? [st.top.family] : []));
            return fams.some(f => String(f).toLowerCase().includes('dragon'));
          }).length;
        } else if (forEachType === 'ALL_NEXUSES' || forEachType === 'NEXUS_COUNT') {
          let nexCount = 0;
          for (const s of ['player', 'opponent']) {
            const pl = state.players[s];
            if (pl) {
              nexCount += (pl.field || []).filter(st => (st.top.type || '').includes('Nexus')).length;
              nexCount += (pl.nexus || []).length;
            }
          }
          multiplier = nexCount;
        } else if (forEachType === 'EXHAUSTED_SPIRIT_COUNT' || forEachType === 'SELF_EXHAUSTED_SPIRITS') {
          const p = state.players[controller];
          multiplier = (p.field || []).filter(st => (st.state === 'EXHAUSTED' || st.state === 'HEAVY_EXHAUSTED') && (st.top.type || '').includes('Spirit')).length;
        }
      }

      const buffAmount = (op.amount || 1000) * multiplier;

      state.modifiers.push({
        id: `mod_${Date.now()}_${Math.random()}`,
        type: 'BP_BUFF',
        targetStackId: isGroupBuff ? null : (targetStackId || (selfStack ? selfStack.id : null)),
        targetFilter,
        side: controller,
        amount: buffAmount,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      });

      return { success: true, amount: buffAmount };
    }

    case 'BP_DEBUFF': {
      const candidates = queryCandidates(state, { side: 'opp', types: ['Spirit', 'Ultimate'] }, context);
      if (candidates.length === 0) return { success: false };

      const chosen = await promptResolver.choose({
        type: 'SELECT_BP_DEBUFF',
        title: 'Select opposing Spirit to reduce BP',
        candidates,
        count: 1,
        chooser: controller
      });

      const chosenArr = unwrapPromptSelection(chosen);
      if (chosenArr[0]) {
        const targetStackId = chosenArr[0].stack ? chosenArr[0].stack.id : chosenArr[0].id;
        state.modifiers.push({
          id: `mod_${Date.now()}_${Math.random()}`,
          type: 'BP_DEBUFF',
          targetStackId,
          amount: op.amount || 1000,
          duration: op.duration || 'THIS_TURN',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
      }

      return { status: 'SUCCESS', success: true };
    }

    case 'SUMMON_FREE': {
      const p = state.players[controller];
      let cardToSummon = sourceCard;
      const fromZone = String(op.from || 'SELF').toUpperCase();
      if (fromZone === 'BURST' && !cardToSummon) {
        cardToSummon = p.burst || context.activeBurstCard || null;
      }
      const isBurstSelfSummon = Boolean(
        context.activeBurstCard &&
        sourceCard &&
        context.activeBurstCard.id === sourceCard.id &&
        !op.filter &&
        !op.target &&
        (!op.from || ['HAND', 'BURST', 'SELF'].includes(fromZone)) &&
        !findCardCurrentZone(state, sourceCard.id)
      );
      if (!isBurstSelfSummon && op.target !== 'this_card' && ['HAND', 'GRAVE', 'TRASH', 'REMOVED', 'OPEN', 'REVEALED'].includes(fromZone)) {
        const zoneName = (fromZone === 'GRAVE' || fromZone === 'TRASH') ? 'grave'
          : (fromZone === 'REMOVED' || fromZone === 'OPEN') ? 'removed'
          : (fromZone === 'REVEALED' ? 'revealed' : 'hand');
        const res = await resolveTargets(
          state,
          { zone: zoneName, side: 'self', types: ['Spirit', 'Ultimate', 'Brave'], filter: op.filter, count: 1 },
          context,
          promptResolver,
          { promptType: 'SELECT_SUMMON', title: 'Choose card to summon without paying cost', updateContext: false }
        );
        if (res.status === 'NO_OP_BY_RULE') return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_LEGAL_TARGETS' };
        if (!res.success) return { status: res.status || 'REJECTED', success: false, reason: res.reason };
        cardToSummon = res.cards[0];
      }
      return await executeSummonTransaction(state, op, cardToSummon, true, controller, sourceCard, context, events);
    }

    case 'ADVENT_STACK': {
      const p = state.players[controller];
      if (!sourceCard) return { status: 'REJECTED', success: false, reason: 'NO_SOURCE_CARD' };
      const preCheck = evaluateAdventCondition(state, sourceCard, controller);
      if (!preCheck.allowed) {
        return { status: 'REJECTED', success: false, reason: preCheck.reason || 'ADVENT_CONDITION_NOT_MET' };
      }
      const res = await resolveTargets(
        state,
        { side: 'self', types: ['Spirit'], ...(op.target && typeof op.target === 'object' ? op.target : {}), ...(op.filter ? { filter: op.filter } : {}), count: 1 },
        context,
        promptResolver,
        { promptType: 'SELECT_ADVENT_TARGET', title: 'Choose target Spirit to stack Advent onto' }
      );
      if (res.status === 'NO_OP_BY_RULE') return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_LEGAL_TARGETS' };
      if (!res.success || !res.targets[0]?.stack) {
        return { status: res.status || 'REJECTED', success: false, reason: res.reason || 'NO_ADVENT_TARGET' };
      }
      const targetStack = res.targets[0].stack;
      const targetCheck = evaluateAdventCondition(state, sourceCard, controller, { targetStack });
      if (!targetCheck.allowed) {
        return { status: 'REJECTED', success: false, reason: targetCheck.reason || 'ADVENT_CONDITION_NOT_MET' };
      }

      // Put previous top into under array
      targetStack.under.unshift(targetStack.top);
      targetStack.top = sourceCard;
      targetStack.isAdvented = true;

      p.hand = p.hand.filter(c => c.id !== sourceCard.id);

      if (events) {
        await events.emit({
          type: 'ADVENTS',
          card: sourceCard,
          stack: targetStack,
          player: controller,
          sourceCard
        });
      }

      return { success: true, stack: targetStack };
    }

    case 'ADD_COUNTER': {
      const count = op.count || 1;
      state.players[controller].counters += count;
      return { success: true, currentCounters: state.players[controller].counters };
    }

    case 'MILL_DECK':
    case 'MILL': {
      const requested = Number(op.count ?? op.amount ?? 1);
      if (!Number.isFinite(requested) || requested <= 0) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'INVALID_PARAMETERS', milledCount: 0, cards: [] };
      }
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      if (isActionRestricted(state, 'CANNOT_MILL', targetSide, null, { by: controller, sourceCard, isCost: Boolean(op.isCost) })) {
        return { status: 'REJECTED', success: false, applied: false, milledCount: 0, cards: [], reason: 'MILL_RESTRICTED' };
      }
      const p = state.players[targetSide];
      const curTurn = state.turnNumber || 1;
      if (p.milledTurnNumber !== curTurn) {
        p.milledTurnNumber = curTurn;
        p.milledByOpponentThisTurn = 0;
      }
      let effectiveCount = requested;
      if (controller !== targetSide) {
        const limitMods = (state.modifiers || []).filter(m =>
          m && m.type === 'LIMIT_DECK_DISCARD' &&
          (!m.targetSide || m.targetSide === 'both' || m.targetSide === targetSide)
        );
        if (limitMods.length > 0) {
          const minCap = Math.min(...limitMods.map(m => Number(m.maxPerTurn ?? m.limit ?? 5)));
          const remaining = Math.max(0, minCap - (p.milledByOpponentThisTurn || 0));
          effectiveCount = Math.min(requested, remaining);
        }
      }
      const milled = [];
      for (let i = 0; i < effectiveCount; i++) {
        if (p.deck.length === 0) break;
        const topCard = p.deck[0];
        const moved = await moveCard(state, topCard, 'grave', targetSide, { cause: 'mill', sourceCard }, events);
        if (moved) milled.push(topCard);
      }
      if (controller !== targetSide) {
        p.milledByOpponentThisTurn = (p.milledByOpponentThisTurn || 0) + milled.length;
      }
      if (events && milled.length > 0) {
        await events.emit({ type: 'DECK_MILLED', player: targetSide, count: milled.length, cards: milled, sourceCard });
      }
      return { status: milled.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: milled.length > 0, applied: milled.length > 0, milledCount: milled.length, cards: milled };
    }

    case 'BURST_LOCK': {
      state.modifiers.push({
        id: `mod_${Date.now()}_burst_lock`,
        type: 'BURST_LOCK',
        side: oppSide,
        duration: 'THIS_BATTLE',
        sourceCardId: sourceCard ? sourceCard.id : null
      });
      return { status: 'SUCCESS', success: true };
    }

    case 'END_BATTLE': {
      state.combat = null;
      if (Array.isArray(state.modifiers)) {
        state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
      }
      return { status: 'SUCCESS', success: true };
    }

    case 'OPEN_ZONE': {
      await moveCard(state, sourceCard, 'removed', controller, { cause: 'open_zone', sourceCard }, events);
      return { status: 'SUCCESS', success: true };
    }

    case 'REVEAL_DECKTOP': {
      const p = state.players[controller];
      if (!p.revealed) p.revealed = [];
      let count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const isBombardment = (sourceCard?.compiledIr?.keywords || []).some(keyword => String(keyword.hook || '').toLowerCase() === 'bombardment');
      if (isBombardment && state.step === 'ATTACK' && state.activePlayer === controller) {
        for (const stack of p.field || []) {
          const level = computeLevel(stack, state);
          for (const ability of stack.top?.compiledIr?.abilities || []) {
            if (ability.header?.timing !== 'ATTACK_STEP' || (ability.header.levels?.length && !ability.header.levels.includes(level))) continue;
            for (const clause of ability.clauses || []) {
              if (clause.op?.op === 'REVEAL_BONUS' && String(clause.op.appliesTo || '').toUpperCase() === 'BOMBARDMENT') count += clause.op.amount || 0;
            }
          }
        }
      }
      const actualCount = Math.min(count, p.deck.length);
      const revealed = [];
      for (let i = 0; i < actualCount; i++) {
        if (p.deck.length === 0) break;
        const topCard = p.deck[0];
        const moved = await moveCard(
          state,
          topCard,
          'revealed',
          controller,
          { cause: 'reveal', sourceCard, expectedFromZone: 'deck', expectedFromSide: controller },
          events
        );
        if (moved) revealed.push(topCard);
      }
      if (!context.revealedCards) context.revealedCards = [];
      context.revealedCards.push(...revealed);

      if (events) {
        await events.emit({
          type: 'CARDS_REVEALED',
          cards: revealed,
          player: controller,
          count: revealed.length,
          sourceCard
        });
      }

      return { success: revealed.length > 0, count: revealed.length, cards: revealed };
    }

    case 'ADD_TO_HAND': {
      const p = state.players[controller];
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const fromZone = op.from ? normalizeCardZone(op.from) : null;
      let pool = [];
      let effectiveZone = fromZone;
      let isFromRevealed = false;

      // Prioritize explicit PREVIOUS_TARGET over revealed pools
      if ((op.target === 'PREVIOUS_TARGET' || op.target?.target === 'PREVIOUS_TARGET' || op.usePreviousTarget) && context.previousTarget) {
        const prevItem = context.selectedTargets?.[0] || context.previousTarget;
        const prevZone = effectiveZone || prevItem.zone || null;
        if (!validateTargetAvailability(state, prevItem, prevZone, prevItem.side || controller)) {
          return { status: 'REJECTED', success: false, addedCount: 0, cards: [], reason: 'PREVIOUS_TARGET_UNAVAILABLE' };
        }
        const prevCard = prevItem.card || prevItem.top || prevItem;
        pool = [prevCard];
        effectiveZone = prevZone;
        isFromRevealed = effectiveZone === 'revealed' || Boolean((p.revealed || []).some(c => c.id === prevCard.id));
      } else if (fromZone === 'grave' || fromZone === 'removed' || fromZone === 'hand' || fromZone === 'deck' || fromZone === 'revealed') {
        const qCands = queryCandidates(state, { zone: fromZone, side: 'self', types: ['Any'] }, context);
        pool = qCands.map(c => c.card).filter(Boolean);
        effectiveZone = fromZone;
        isFromRevealed = fromZone === 'revealed';
      } else if ((p.revealed && p.revealed.length > 0) || (Array.isArray(context.revealedCards) && context.revealedCards.length > 0)) {
        const qCands = queryCandidates(state, { zone: 'revealed', side: 'self', types: ['Any'] }, context);
        pool = qCands.map(c => c.card).filter(Boolean);
        effectiveZone = 'revealed';
        isFromRevealed = true;
      } else if (context.previousTarget) {
        const prevItem = context.selectedTargets?.[0] || context.previousTarget;
        if (validateTargetAvailability(state, prevItem, prevItem.zone || null, prevItem.side || controller)) {
          pool = [prevItem.card || prevItem.top || prevItem];
          effectiveZone = prevItem.zone || null;
        }
      }

      // Some effects specify a separate search group for each selected card.
      if (Array.isArray(op.filterGroups) && op.filterGroups.length) {
        let remaining = [...pool];
        const groupedChoice = [];
        for (const group of op.filterGroups) {
          const groupFilter = group.filter || group;
          const groupCount = group.count || 1;
          const candidates = remaining.filter(card => matchesCardFilter(card, groupFilter));
          if (!candidates.length) continue;
          const descCandidates = candidates.map(card => buildCandidateDescriptor({ type: 'card', card, side: controller, zone: effectiveZone || 'revealed' }));
          let selected = [];
          if (promptResolver && typeof promptResolver.choose === 'function') {
            const answer = await promptResolver.choose({ type: 'SELECT_CARDS', title: group.title || 'Choose a matching revealed card', candidates: descCandidates, count: groupCount, chooser: controller });
            const ansList = Array.isArray(answer?.selected) ? answer.selected : (Array.isArray(answer) ? answer : []);
            selected = ansList.map(item => {
              const matched = descCandidates.find(dc => dc === item || (typeof item === 'string' && (dc.candidateId === item || dc.cardId === item)) || (typeof item === 'object' && ((item.candidateId && dc.candidateId === item.candidateId) || dc.cardId === (item.card?.id || item.cardId || item.id))));
              return matched ? matched.card : null;
            }).filter(Boolean);
          }
          if (!selected.length) selected = candidates.slice(0, groupCount);
          groupedChoice.push(...selected);
          const selectedIds = new Set(selected.map(card => card.id));
          remaining = remaining.filter(card => !selectedIds.has(card.id));
        }
        const added = [];
        for (const card of groupedChoice) {
          const moved = await moveCard(state, card, 'hand', controller, { cause: 'add_to_hand', sourceCard, ...(effectiveZone ? { expectedFromZone: effectiveZone, expectedFromSide: controller } : {}) }, events);
          if (moved) {
            if (isFromRevealed) {
              if (p.revealed) p.revealed = p.revealed.filter(item => item.id !== card.id);
              if (context.revealedCards) context.revealedCards = context.revealedCards.filter(item => item.id !== card.id);
            }
            added.push(card);
          }
        }
        return { success: added.length > 0, addedCount: added.length, cards: added };
      }

      // Filter matching candidates
      const matching = pool.filter(c => matchesCardFilter(c, op.filter, op));
      if (matching.length === 0) return { status: 'NO_OP_BY_RULE', success: false, addedCount: 0, cards: [], reason: 'NO_LEGAL_TARGETS' };

      const descCandidates = matching.map(c => buildCandidateDescriptor({ type: 'card', card: c, side: controller, zone: effectiveZone || 'revealed' }));
      let chosen = [];
      const isAll = Boolean(op.all || op.count === 'ALL');
      if (isAll) {
        chosen = matching;
      } else if (promptResolver && typeof promptResolver.choose === 'function') {
        const selection = await promptResolver.choose({
          type: 'SELECT_CARDS',
          title: 'Choose card(s) to add to Hand',
          candidates: descCandidates,
          count,
          chooser: controller
        });
        if (selection && (selection.length > 0 || selection.selected?.length > 0)) {
          const list = Array.isArray(selection.selected) ? selection.selected : selection;
          if (!validateSelection(descCandidates, list, { count, upTo: op.upTo, optional: op.optional })) {
            return { status: 'REJECTED', success: false, addedCount: 0, cards: [], reason: 'INVALID_TARGET_SELECTION' };
          }
          chosen = list.map(item => {
            const matched = descCandidates.find(dc => dc === item || (typeof item === 'string' && (dc.candidateId === item || dc.cardId === item)) || (typeof item === 'object' && ((item.candidateId && dc.candidateId === item.candidateId) || dc.cardId === (item.card?.id || item.cardId || item.id))));
            return matched ? matched.card : null;
          }).filter(Boolean);
        } else if (op.optional || op.isOptional) {
          return { status: 'SKIPPED', success: true, addedCount: 0, cards: [], reason: 'OPTIONAL_SKIPPED' };
        } else if (!state?.matchContext || state.matchContext.canSimulate(controller)) {
          chosen = matching.slice(0, count);
        } else {
          return { status: 'UNRESOLVED', success: false, addedCount: 0, cards: [], reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
        }
      } else if (!state?.matchContext || state.matchContext.canSimulate(controller)) {
        chosen = matching.slice(0, count);
      } else {
        return { status: 'UNRESOLVED', success: false, addedCount: 0, cards: [], reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
      }

      const added = [];
      for (const card of chosen) {
        const moved = await moveCard(state, card, 'hand', controller, { cause: 'add_to_hand', sourceCard, ...(effectiveZone ? { expectedFromZone: effectiveZone, expectedFromSide: controller } : {}) }, events);
        if (moved) {
          if (isFromRevealed) {
            if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== card.id);
            if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== card.id);
          }
          added.push(card);
        }
      }

      return { status: added.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: added.length > 0, addedCount: added.length, cards: added };
    }

    case 'DISCARD_REVEALED':
    case 'DISCARD_REMAINING': {
      const p = state.players[controller];
      const pool = (context.revealedCards && context.revealedCards.length > 0)
        ? [...context.revealedCards]
        : (p.revealed ? [...p.revealed] : []);

      const discarded = [];
      for (const card of pool) {
        await moveCard(state, card, 'grave', controller, { cause: 'discard_revealed', sourceCard }, events);
        discarded.push(card);
      }

      p.revealed = [];
      context.revealedCards = [];

      return { success: true, count: discarded.length, cards: discarded };
    }

    case 'RETURN_REVEALED_BOTTOM':
    case 'RETURN_REMAINING_TO_DECK': {
      const p = state.players[controller];
      const pool = (context.revealedCards && context.revealedCards.length > 0)
        ? [...context.revealedCards]
        : (p.revealed ? [...p.revealed] : []);

      const pos = (op.position || 'bottom').toLowerCase();
      const destZone = pos === 'top' ? 'deck_top' : 'deck_bottom';

      const returned = [];
      for (const card of pool) {
        await moveCard(state, card, destZone, controller, { cause: 'return_revealed', sourceCard }, events);
        returned.push(card);
      }

      p.revealed = [];
      context.revealedCards = [];

      return { success: true, count: returned.length, cards: returned };
    }

    case 'SUMMON': {
      const p = state.players[controller];
      const fromZone = op.from ? normalizeCardZone(op.from) : null;
      let pool = [];
      let isRevealed = false;

      // Strict precedence: explicit op.from takes priority over incidental context
      if (op.target === 'this_card' || fromZone === 'this_card') {
        pool = sourceCard ? [sourceCard] : [];
      } else if (fromZone === 'grave') {
        pool = p.grave || [];
      } else if (fromZone === 'removed') {
        pool = p.removed || [];
      } else if (fromZone === 'hand') {
        pool = p.hand || [];
      } else if (fromZone === 'revealed') {
        pool = (context.revealedCards && context.revealedCards.length > 0)
          ? context.revealedCards
          : (p.revealed || []);
        isRevealed = true;
      } else if (fromZone === 'deck') {
        pool = p.deck || [];
      } else if (context.revealedCards && context.revealedCards.length > 0) {
        pool = context.revealedCards;
        isRevealed = true;
      } else if (p.revealed && p.revealed.length > 0) {
        pool = p.revealed;
        isRevealed = true;
      } else {
        // default from hand
        pool = p.hand || [];
      }

      const matching = pool.filter(c => matchesCardFilter(c, op.filter, op));
      if (matching.length === 0) return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_TARGET_CARDS' };

      let cardToSummon = matching[0];
      if (matching.length > 0 && promptResolver) {
        const choice = await promptResolver.choose({
          type: 'SELECT_SUMMON',
          title: op.title || (op.from === 'trash' || op.from === 'grave' ? 'Choose card to summon from Trash' : 'Choose card to summon'),
          candidates: matching.map((c, idx) => ({ candidateId: c.id ? `cand_${c.id}` : `cand_${idx}`, card: c, cardId: c.id || c.uid, zone: op.from || 'hand', side: controller })),
          count: 1,
          chooser: controller,
          optional: Boolean(op.isOptional || op.optional)
        });
        const choiceArr = unwrapPromptSelection(choice);
        if (choiceArr.length === 0 && (op.isOptional || op.optional)) {
          return { status: 'SKIPPED', success: true, count: 0, reason: 'OPTIONAL_SKIPPED' };
        }
        if (choiceArr[0]) {
          const picked = choiceArr[0].card || choiceArr[0];
          const pickedId = picked?.id || picked?.uid;
          if (!matching.some(c => (c.id && c.id === pickedId) || (c.uid && c.uid === pickedId) || c === picked)) {
            return { status: 'REJECTED', success: false, reason: 'INVALID_TARGET_SELECTION' };
          }
          cardToSummon = matching.find(c => (c.id && c.id === pickedId) || (c.uid && c.uid === pickedId) || c === picked) || picked;
        }
      }

      const isFree = Boolean(op.free || op.noCost || op.withoutPayingCost);
      return await executeSummonTransaction(state, op, cardToSummon, isFree, controller, sourceCard, context, events);
    }

    case 'SUMMON_THIS_CARD': {
      if (!sourceCard) return { success: false, reason: 'NO_SOURCE_CARD' };
      const p = state.players[controller];
      const originalFromZone = p.removed.some(card => card.id === sourceCard.id) ? 'removed'
        : p.grave.some(card => card.id === sourceCard.id) ? 'grave'
        : p.burst?.id === sourceCard.id ? 'burst' : 'hand';

      const extraCost = Math.max(0, Number(op.costCores || 0));
      if ((p.reserve.normal || 0) < extraCost + 1) return { success: false, reason: 'INSUFFICIENT_CORES_FOR_SUMMON' };
      if (extraCost) await moveCore(state, extraCost, { zone: 'reserve', side: controller }, { zone: 'trash', side: controller }, { cause: 'summon_cost', by: controller, sourceCard }, events);

      const hasCores = p.reserve.normal > 0 || p.reserve.soul > 0;
      if (!hasCores) return { success: false, reason: 'INSUFFICIENT_LV1_CORES' };

      const useSoul = p.reserve.normal === 0 && p.reserve.soul > 0;
      await moveCore(state, 1, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
        isSoulCore: useSoul,
        cause: 'summon',
        by: controller,
        sourceCard
      }, events);

      const newStack = createFieldStack(sourceCard, { normal: useSoul ? 0 : 1, soul: useSoul ? 1 : 0 });
      if (op.exhausted) newStack.state = 'EXHAUSTED';
      p.field.push(newStack);

      p.hand = p.hand.filter(c => c.id !== sourceCard.id);
      p.grave = p.grave.filter(c => c.id !== sourceCard.id);
      p.removed = p.removed.filter(c => c.id !== sourceCard.id);
      if (p.burst && p.burst.id === sourceCard.id) p.burst = null;
      if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== sourceCard.id);
      if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== sourceCard.id);

      if (events) {
        await events.emit({
          type: 'SUMMONED',
          card: sourceCard,
          stack: newStack,
          player: controller,
          cause: 'effect',
          sourceCard,
          fromZone: originalFromZone
        });
      }

      if (op.preventsLifeLoss && context.pendingLifeLoss) context.pendingLifeLoss.prevented = true;
      return { success: true, card: sourceCard, stack: newStack };
    }

    case 'DEPLOY_NEXUS': {
      const p = state.players[controller];
      const fromZone = op.from ? normalizeCardZone(op.from) : null;
      let pool = [];
      let isRevealed = false;

      const deployClean = String(context?.currentClause?.cleanText || context?.currentClause?.rawText || '');
      if (op.target === 'this_card' || fromZone === 'this_card' || (/deploy\s+this\s+nexus\s+card/i.test(deployClean) && sourceCard && !p.hand.some(c => c.id === sourceCard.id))) {
        pool = sourceCard ? [sourceCard] : [];
      } else if (fromZone === 'grave') {
        pool = p.grave || [];
      } else if (fromZone === 'removed') {
        pool = p.removed || [];
      } else if (fromZone === 'hand') {
        pool = p.hand || [];
      } else if (fromZone === 'revealed') {
        pool = (context.revealedCards && context.revealedCards.length > 0)
          ? context.revealedCards
          : (p.revealed || []);
        isRevealed = true;
      } else if (context.revealedCards && context.revealedCards.length > 0) {
        pool = context.revealedCards;
        isRevealed = true;
      } else if (p.revealed && p.revealed.length > 0) {
        pool = p.revealed;
        isRevealed = true;
      } else {
        pool = p.hand || [];
      }

      const matching = pool.filter(c => {
        const type = (c.type || '').toLowerCase();
        if (!type.includes('nexus')) return false;
        return matchesCardFilter(c, op.filter, op);
      });

      if (matching.length === 0) return { success: false, reason: 'NO_NEXUS_TARGET' };

      let cardToDeploy = matching[0];
      if (matching.length > 1 && promptResolver) {
        const choice = await promptResolver.choose({
          type: 'SELECT_NEXUS',
          title: 'Choose Nexus to deploy',
          candidates: matching.map(c => ({ card: c })),
          count: 1,
          chooser: controller
        });
        const choiceArr = unwrapPromptSelection(choice);
        if (choiceArr[0]) {
          cardToDeploy = choiceArr[0].card || choiceArr[0];
        }
      }

      if (!cardToDeploy) return { success: false };

      const cores = Math.max(0, typeof op.cores === 'number' ? op.cores : 0);
      if (cores > 0) {
        if ((p.reserve.normal || 0) < cores) {
          return { success: false, reason: 'INSUFFICIENT_NEXUS_CORES' };
        }
        await moveCore(state, cores, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
          cause: 'deploy',
          by: controller
        }, events);
      }

      const newStack = createFieldStack(cardToDeploy, { normal: cores, soul: 0 });
      newStack.state = 'REFRESHED';
      p.field.push(newStack);
      if (!p.nexus) p.nexus = [];
      p.nexus.push(newStack);

      p.hand = p.hand.filter(c => c.id !== cardToDeploy.id);
      p.grave = p.grave.filter(c => c.id !== cardToDeploy.id);
      p.removed = p.removed.filter(c => c.id !== cardToDeploy.id);
      if (p.burst && p.burst.id === cardToDeploy.id) p.burst = null;
      if (isRevealed) {
        if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== cardToDeploy.id);
        if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== cardToDeploy.id);
      }

      if (events) {
        await events.emit({
          type: 'DEPLOYED',
          card: cardToDeploy,
          stack: newStack,
          player: controller,
          cause: 'effect',
          sourceCard
        });
      }

      return { success: true, card: cardToDeploy, stack: newStack };
    }

    case 'SUMMON_RESERVE_ONLY': {
      const p = state.players[controller];
      let cardToSummon = sourceCard;

      if (!cardToSummon && p.hand.length > 0) {
        const candidates = queryCandidates(state, { zone: 'hand', side: 'self', types: ['Spirit'] }, context);
        if (candidates.length > 0 && promptResolver) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_SUMMON',
            title: 'Choose Spirit to summon (reserve cores only)',
            candidates,
            count: 1,
            chooser: controller
          });
          const chosenArr = unwrapPromptSelection(chosen);
          if (chosenArr[0]) cardToSummon = chosenArr[0].card || chosenArr[0];
        }
      }

      if (!cardToSummon) return { success: false, reason: 'NO_CARD_TO_SUMMON' };

      // Strictly enforce cores from reserve
      if (p.reserve.normal < 1 && p.reserve.soul < 1) {
        return { success: false, reason: 'NO_RESERVE_CORES' };
      }

      const useSoul = p.reserve.normal === 0 && p.reserve.soul > 0;
      const newStack = createFieldStack(cardToSummon, { normal: 0, soul: 0 });
      p.field.push(newStack);

      const moved = await moveCore(state, 1, { zone: 'reserve', side: controller }, { zone: 'field', side: controller, stackId: newStack.id }, {
        isSoulCore: useSoul,
        cause: 'summon_reserve_only',
        by: controller
      }, events);
      if (!moved) {
        p.field = p.field.filter(s => s.id !== newStack.id);
        return { success: false, reason: 'NO_RESERVE_CORES' };
      }

      p.hand = p.hand.filter(c => c.id !== cardToSummon.id);
      p.grave = p.grave.filter(c => c.id !== cardToSummon.id);
      p.removed = p.removed.filter(c => c.id !== cardToSummon.id);
      if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== cardToSummon.id);
      if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== cardToSummon.id);
      if (p.burst && p.burst.id === cardToSummon.id) p.burst = null;

      if (events) {
        await events.emit({
          type: 'SUMMONED',
          card: cardToSummon,
          stack: newStack,
          player: controller,
          cause: 'summon_reserve_only',
          sourceCard
        });
      }

      return { success: true, card: cardToSummon, stack: newStack };
    }

    case 'RECOVER_LIFE': {
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const res = await moveCore(
        state,
        count,
        { zone: 'void' },
        { zone: 'life', side: targetSide },
        { cause: 'recover_life', by: controller, sourceCard },
        events
      );

      return { status: res ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(res), recoveredCount: res ? count : 0, currentLife: state.players[targetSide].life };
    }

    case 'PREVENT_LIFE_LOSS': {
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const duration = op.duration || 'THIS_TURN';

      state.modifiers.push({
        id: `mod_${Date.now()}_prevent_life_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PREVENT_LIFE_LOSS',
        side: targetSide,
        duration,
        sourceCardId: sourceCard ? sourceCard.id : null
      });

      if (events) {
        await events.emit({
          type: 'LIFE_LOSS_PREVENTED_REGISTERED',
          player: targetSide,
          duration,
          sourceCard
        });
      }

      return { success: true, duration, side: targetSide };
    }

    case 'SALVAGE': {
      const p = state.players[controller];
      const fromZone = op.from ? normalizeCardZone(op.from) : 'grave';
      const isRevealed = fromZone === 'revealed';
      const qCands = queryCandidates(state, { zone: fromZone, side: 'self', types: ['Any'] }, context);
      const pool = qCands.map(c => c.card).filter(Boolean);

      const matching = pool.filter(c => matchesCardFilter(c, op.filter, op));
      if (matching.length === 0) return { status: 'NO_OP_BY_RULE', success: false, count: 0, cards: [], reason: 'NO_LEGAL_TARGETS' };

      const descCandidates = matching.map(c => buildCandidateDescriptor({ type: 'card', card: c, side: controller, zone: fromZone }));
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      let chosen = [];
      const isAll = Boolean(op.all || op.count === 'ALL');
      if (isAll) {
        chosen = matching;
      } else if (promptResolver && typeof promptResolver.choose === 'function') {
        const choice = await promptResolver.choose({
          type: 'SELECT_SALVAGE',
          title: 'Choose card(s) to salvage to Hand',
          candidates: descCandidates,
          count,
          chooser: controller
        });
        if (choice && (choice.length > 0 || choice.selected?.length > 0)) {
          const list = Array.isArray(choice.selected) ? choice.selected : choice;
          if (!validateSelection(descCandidates, list, { count, upTo: op.upTo, optional: op.optional })) {
            return { status: 'REJECTED', success: false, count: 0, cards: [], reason: 'INVALID_TARGET_SELECTION' };
          }
          chosen = list.map(item => {
            const matched = descCandidates.find(dc => dc === item || (typeof item === 'string' && (dc.candidateId === item || dc.cardId === item)) || (typeof item === 'object' && ((item.candidateId && dc.candidateId === item.candidateId) || dc.cardId === (item.card?.id || item.cardId || item.id))));
            return matched ? matched.card : null;
          }).filter(Boolean);
        } else if (op.optional || op.isOptional) {
          return { status: 'SKIPPED', success: true, count: 0, cards: [], reason: 'OPTIONAL_SKIPPED' };
        } else if (!state?.matchContext || state.matchContext.canSimulate(controller)) {
          chosen = matching.slice(0, count);
        } else {
          return { status: 'UNRESOLVED', success: false, count: 0, cards: [], reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
        }
      } else if (!state?.matchContext || state.matchContext.canSimulate(controller)) {
        chosen = matching.slice(0, count);
      } else {
        return { status: 'UNRESOLVED', success: false, count: 0, cards: [], reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
      }

      const salvaged = [];
      for (const card of chosen) {
        const moved = await moveCard(state, card, 'hand', controller, { cause: 'salvage', sourceCard, expectedFromZone: fromZone, expectedFromSide: controller }, events);
        if (moved) {
          if (isRevealed) {
            if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== card.id);
            if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== card.id);
          }
          salvaged.push(card);
        }
      }

      return { status: salvaged.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: salvaged.length > 0, count: salvaged.length, cards: salvaged };
    }

    case 'DISCARD_BURST': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const targetPlayer = state.players[targetSide];
      if (!targetPlayer.burst) {
        return { success: false, reason: 'NO_BURST' };
      }

      const burstCard = targetPlayer.burst;
      await moveCard(state, burstCard, 'grave', targetSide, {
        cause: 'discard_burst',
        by: controller,
        sourceCard
      }, events);

      if (events) {
        await events.emit({
          type: 'BURST_DISCARDED',
          card: burstCard,
          player: targetSide,
          by: controller,
          sourceCard
        });
      }

      return { success: true, card: burstCard, player: targetSide };
    }

    // =========================================================================
    // MILESTONE 3: CONTINUOUS MODIFIER & RULE OPS
    // =========================================================================

    case 'ADD_SYMBOL':
    case 'GRANT_SYMBOL': {
      let targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && op.filter) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'self', ...op.filter }, context);
        if (candidates.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose Spirit/Ultimate to add symbol',
            candidates,
            count: 1,
            chooser: controller
          });
          const picked = Array.isArray(chosen) ? chosen[0] : (chosen?.selected?.[0] || chosen);
          if (picked && (picked.stack || picked.id)) targetStackId = picked.stack ? (picked.stack.id || picked.stack.stackId) : (picked.id || picked);
        } else if (candidates.length > 0 && (!state?.matchContext || state.matchContext.canSimulate(controller))) {
          targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        }
      }
      const colors = Array.isArray(op.colors)
        ? op.colors.map(c => String(c))
        : [String(op.color || (sourceCard && sourceCard.colors && sourceCard.colors[0]) || 'Red')];
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const symbols = {};
      for (const c of colors) symbols[c] = (symbols[c] || 0) + count;

      const mod = {
        id: `mod_${Date.now()}_add_symbol_${Math.random().toString(36).substr(2, 5)}`,
        type: 'ADD_SYMBOL',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color: colors[0],
        symbolColor: colors[0],
        colors,
        count,
        symbols,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'SET_SYMBOL': {
      const targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count ?? '0', 10) || 0;
      const color = String(op.color || (sourceCard && sourceCard.colors && sourceCard.colors[0]) || 'Red');
      const symbols = op.symbols ? { ...op.symbols } : (count > 0 ? { [color]: count } : {});

      const mod = {
        id: `mod_${Date.now()}_set_symbol_${Math.random().toString(36).substr(2, 5)}`,
        type: 'SET_SYMBOL',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color,
        symbolColor: color,
        count,
        symbols,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'GRANT_BRAVE_SYMBOLS': {
      const targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      const color = String(op.color || (sourceCard && sourceCard.colors && sourceCard.colors[0]) || 'Red');
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const symbols = op.symbols ? { ...op.symbols } : { [color]: count };

      const mod = {
        id: `mod_${Date.now()}_grant_brave_sym_${Math.random().toString(36).substr(2, 5)}`,
        type: 'GRANT_BRAVE_SYMBOLS',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color,
        symbolColor: color,
        count,
        symbols,
        duration: op.duration || 'PERMANENT',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'IMMUNITY': {
      let targetStackId = op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && !op.filter && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      }
      const rawColors = op.colors || (op.color ? [op.color] : []);
      const colors = (Array.isArray(rawColors) ? rawColors : [rawColors]).map(c => String(c).toLowerCase());
      const rawSourceTypes = op.sourceTypes || (op.sourceType ? [op.sourceType] : []);
      const sourceTypes = (Array.isArray(rawSourceTypes) ? rawSourceTypes : [rawSourceTypes]).map(t => String(t).toLowerCase());

      const mod = {
        id: `mod_${Date.now()}_immunity_${Math.random().toString(36).substr(2, 5)}`,
        type: 'IMMUNITY',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        colors,
        sourceTypes,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'PROTECTION': {
      let targetStackId = op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && !op.filter && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      }
      const rawColors = op.colors || (op.color ? [op.color] : []);
      const colors = (Array.isArray(rawColors) ? rawColors : [rawColors]).map(c => String(c).toLowerCase());
      const rawSourceTypes = op.sourceTypes || (op.sourceType ? [op.sourceType] : []);
      const sourceTypes = (Array.isArray(rawSourceTypes) ? rawSourceTypes : [rawSourceTypes]).map(t => String(t).toLowerCase());

      const mod = {
        id: `mod_${Date.now()}_protection_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PROTECTION',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        colors,
        sourceTypes,
        cannotBeDestroyed: Boolean(op.cannotBeDestroyed ?? (op.mode === 'DESTROY' || !op.mode)),
        cannotBeBounced: Boolean(op.cannotBeBounced ?? (op.mode === 'BOUNCE')),
        cannotBeDepleted: Boolean(op.cannotBeDepleted ?? (op.mode === 'DEPLETE')),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'INDESTRUCTIBLE': {
      let targetStackId = op.targetStackId || (op.target === 'self' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && !op.filter && sourceStack && (op.target === 'self' || !op.target)) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      }
      const by = Array.isArray(op.by) ? op.by : (op.by ? [op.by] : ['ALL']);
      const duration = op.duration || 'THIS_TURN';
      const mod = {
        id: `mod_${Date.now()}_indestructible_${Math.random().toString(36).substr(2, 5)}`,
        type: 'INDESTRUCTIBLE',
        targetStackId,
        targetFilter: targetStackId ? null : (op.target || null),
        side: (op.target?.side === 'opp' || op.side === 'opp') ? oppSide : controller,
        by,
        cannotBeDestroyed: true,
        duration,
        sourceCardId: sourceCard ? sourceCard.id : null,
        sourceStackId: sourceStack ? (sourceStack.id || sourceStack.stackId) : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'PREVENT_DAMAGE': {
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const duration = op.duration || 'THIS_TURN';
      const mod = {
        id: `mod_${Date.now()}_prevent_dmg_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PREVENT_DAMAGE',
        side: targetSide,
        amount: typeof op.amount === 'number' ? op.amount : null,
        maxReduction: typeof op.maxReduction === 'number' ? op.maxReduction : null,
        duration,
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'NEGATE_EFFECT': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const mod = {
        id: `mod_${Date.now()}_negate_${Math.random().toString(36).substr(2, 5)}`,
        type: 'NEGATE_EFFECT',
        side: targetSide,
        targetCardId: op.targetCardId || null,
        targetFilter: op.filter || null,
        consumeOnUse: op.consumeOnUse !== false,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);

      if (events) {
        await events.emit({
          type: 'EFFECT_NEGATED_REGISTERED',
          player: targetSide,
          by: controller,
          sourceCard
        });
      }
      return { success: true, modifier: mod };
    }

    case 'UNBLOCKABLE': {
      let targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && op.filter) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'self', ...op.filter }, context);
        if (candidates.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose Spirit/Ultimate to make unblockable',
            candidates,
            count: 1,
            chooser: controller
          });
          const picked = Array.isArray(chosen) ? chosen[0] : (chosen?.selected?.[0] || chosen);
          if (picked && (picked.stack || picked.id)) targetStackId = picked.stack ? (picked.stack.id || picked.stack.stackId) : (picked.id || picked);
        } else if (candidates.length > 0 && (!state?.matchContext || state.matchContext.canSimulate(controller))) {
          targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        }
      }
      let unblockableConditionEval = null;
      if (op.condition) {
        unblockableConditionEval = evaluateStructuredCondition(state, op.condition, context);
      }
      const mod = {
        id: `mod_${Date.now()}_unblockable_${Math.random().toString(36).substr(2, 5)}`,
        type: 'UNBLOCKABLE',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        condition: op.condition || null,
        unlessFilter: op.unlessFilter || null,
        blockedOnlyByFilter: op.blockedOnlyByFilter || null,
        cannotBeBlockedByFilter: op.cannotBeBlockedByFilter || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod, ...(unblockableConditionEval ? { conditionEvaluation: unblockableConditionEval } : {}) };
    }

    case 'COMBAT_RESTRICTION':
    case 'CANNOT_ATTACK':
    case 'CANNOT_BLOCK':
    case 'EXHAUSTED_BLOCK':
    case 'COMBAT_RULE': {
      const targetSide = op.side === 'self' ? controller : (op.side === 'opp' ? oppSide : (op.op === 'EXHAUSTED_BLOCK' ? controller : oppSide));
      let targetStackId = op.targetStackId || null;
      if (!targetStackId && op.target === 'SELF' && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      } else if (!targetStackId && op.filter && op.selectTarget) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'opp', ...op.filter }, context);
        if (candidates.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose target for combat rule',
            candidates,
            count: 1,
            chooser: controller
          });
          const picked = Array.isArray(chosen) ? chosen[0] : (chosen?.selected?.[0] || chosen);
          if (picked && (picked.stack || picked.id)) targetStackId = picked.stack ? (picked.stack.id || picked.stack.stackId) : (picked.id || picked);
        } else if (candidates.length > 0 && (!state?.matchContext || state.matchContext.canSimulate(controller))) {
          targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        }
      }

      const cannotAttack = Boolean(op.cannotAttack || op.op === 'CANNOT_ATTACK' || op.restriction === 'CANNOT_ATTACK' || op.restriction === 'CANNOT_ATTACK_OR_BLOCK');
      const cannotBlock = Boolean(op.cannotBlock || op.op === 'CANNOT_BLOCK' || op.restriction === 'CANNOT_BLOCK' || op.restriction === 'CANNOT_ATTACK_OR_BLOCK');
      const canBlockWhileExhausted = Boolean(op.canBlockWhileExhausted || op.op === 'EXHAUSTED_BLOCK' || op.restriction === 'CAN_BLOCK_EXHAUSTED');

      const mod = {
        id: `mod_${Date.now()}_combat_rest_${Math.random().toString(36).substr(2, 5)}`,
        type: 'COMBAT_RESTRICTION',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: targetSide,
        cannotAttack,
        cannotBlock,
        canBlockWhileExhausted,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'FORCE_BLOCK': {
      const candidates = queryCandidates(state, {
        zone: 'field',
        side: op.side || 'opp',
        ...(op.filter || {})
      }, context);

      let chosenStack = null;
      if (op.targetStackId) {
        for (const s of Object.keys(state.players)) {
          const f = state.players[s].field.find(st => (st.id || st.stackId) === op.targetStackId);
          if (f) { chosenStack = f; break; }
        }
      } else if (candidates.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
        const chosen = await promptResolver.choose({
          type: 'SELECT_FORCE_BLOCK',
          title: 'Choose opposing Spirit/Ultimate to force block',
          candidates,
          count: 1,
          chooser: controller
        });
        const picked = Array.isArray(chosen) ? chosen[0] : (chosen?.selected?.[0] || chosen);
        if (picked && (picked.stack || picked.id)) {
          chosenStack = picked.stack || candidates.find(c => (c.stack?.id || c.stack?.stackId) === (picked.id || picked || picked.stack?.id))?.stack || null;
        }
      } else if (candidates.length > 0 && (!state?.matchContext || state.matchContext.canSimulate(controller))) {
        chosenStack = candidates[0].stack;
      }

      if (!chosenStack) return { success: false, reason: 'NO_TARGET' };
      const chosenId = chosenStack.id || chosenStack.stackId;

      if (state.combat) {
        state.combat.forcedBlockerStackId = chosenId;
      }

      const mod = {
        id: `mod_${Date.now()}_force_block_${Math.random().toString(36).substr(2, 5)}`,
        type: 'FORCE_BLOCK',
        targetStackId: chosenId,
        side: oppSide,
        duration: op.duration || 'THIS_BATTLE',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, targetStack: chosenStack, modifier: mod };
    }

    case 'TARGET_ATTACK': {
      const candidates = queryCandidates(state, {
        zone: 'field',
        side: op.side || 'opp',
        ...(op.filter || {})
      }, context);

      let chosenStack = null;
      if (op.targetStackId) {
        for (const s of Object.keys(state.players)) {
          const f = state.players[s].field.find(st => (st.id || st.stackId) === op.targetStackId);
          if (f) { chosenStack = f; break; }
        }
      } else if (candidates.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
        const chosen = await promptResolver.choose({
          type: 'SELECT_TARGET_ATTACK',
          title: 'Choose opposing Spirit/Ultimate for designated attack',
          candidates,
          count: 1,
          chooser: controller
        });
        const picked = Array.isArray(chosen) ? chosen[0] : (chosen?.selected?.[0] || chosen);
        if (picked && (picked.stack || picked.id)) {
          chosenStack = picked.stack || candidates.find(c => (c.stack?.id || c.stack?.stackId) === (picked.id || picked || picked.stack?.id))?.stack || null;
        }
      } else if (candidates.length > 0 && (!state?.matchContext || state.matchContext.canSimulate(controller))) {
        chosenStack = candidates[0].stack;
      }

      if (!chosenStack) return { success: false, reason: 'NO_TARGET' };
      const chosenId = chosenStack.id || chosenStack.stackId;

      if (state.combat) {
        state.combat.forcedBlockerStackId = chosenId;
        state.combat.designatedTargetStackId = chosenId;
      }

      const mod = {
        id: `mod_${Date.now()}_target_attack_${Math.random().toString(36).substr(2, 5)}`,
        type: 'TARGET_ATTACK',
        targetStackId: chosenId,
        attackerStackId: sourceStack ? (sourceStack.id || sourceStack.stackId) : null,
        side: oppSide,
        duration: op.duration || 'THIS_BATTLE',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, targetStack: chosenStack, modifier: mod };
    }

    case 'TREAT_RULE':
    case 'TREAT_LEVEL':
    case 'TREAT_COLOR_SYMBOL': {
      const treatClean = String(context?.currentClause?.cleanText || context?.currentClause?.rawText || '');
      const targetsOpponent = op.side === 'opp' || op.side === 'opponent' || op.target?.side === 'opp' || /\bopposing\s+(?:spirit|ultimate|nexus|brave)/i.test(treatClean);
      let targetStackId = op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && targetsOpponent) {
        const tRes = await resolveTargets(state, { side: 'opp', types: op.target?.types || ['Spirit'], filter: op.filter, all: Boolean(op.all) }, context, promptResolver, { defaultSide: 'opp', defaultTypes: ['Spirit'], promptType: 'SELECT_TARGET', title: 'Select opposing Spirit' });
        if (tRes.success && tRes.targets?.length > 0) {
          targetStackId = tRes.targets[0].stack?.id || tRes.targets[0].stack?.stackId || null;
        }
      }
      if (!targetStackId && !op.filter && !op.targetCardId && !targetsOpponent && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      }
      const treatLevelVal = op.setLevel ?? op.level ?? (/lv(\d+)/i.test(treatClean) ? parseInt(treatClean.match(/lv(\d+)/i)[1], 10) : null);
      const mod = {
        id: `mod_${Date.now()}_treat_rule_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op === 'TREAT_LEVEL' ? 'TREAT_LEVEL' : 'TREAT_RULE',
        targetStackId,
        targetCardId: op.targetCardId || (op.target === 'SELF' && sourceCard ? sourceCard.id : null),
        targetFilter: (targetStackId || op.targetCardId) ? null : (op.filter || null),
        side: targetsOpponent ? oppSide : controller,
        treatAsMaxLevel: Boolean(op.treatAsMaxLevel || op.maxLevel),
        setLevel: typeof treatLevelVal === 'number' ? treatLevelVal : null,
        levelDelta: typeof op.levelDelta === 'number' ? op.levelDelta : (typeof op.delta === 'number' ? op.delta : null),
        setCost: typeof op.setCost === 'number' ? op.setCost : (typeof op.cost === 'number' ? op.cost : null),
        costDelta: typeof op.costDelta === 'number' ? op.costDelta : null,
        colorless: Boolean(op.colorless),
        addColors: op.addColors || (op.color ? [op.color] : null),
        setColors: op.setColors || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'GRANT_FAMILY': {
      let targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && op.filter) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'self', ...op.filter }, context);
        if (candidates.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose target to grant family',
            candidates,
            count: 1,
            chooser: controller
          });
          const picked = Array.isArray(chosen) ? chosen[0] : (chosen?.selected?.[0] || chosen);
          if (picked && (picked.stack || picked.id)) targetStackId = picked.stack ? (picked.stack.id || picked.stack.stackId) : (picked.id || picked);
        } else if (candidates.length > 0 && (!state?.matchContext || state.matchContext.canSimulate(controller))) {
          targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        }
      }
      const families = Array.isArray(op.families)
        ? op.families
        : (op.family ? [op.family] : []);

      const mod = {
        id: `mod_${Date.now()}_grant_family_${Math.random().toString(36).substr(2, 5)}`,
        type: 'GRANT_FAMILY',
        targetStackId,
        targetCardId: op.targetCardId || null,
        targetFilter: (targetStackId || op.targetCardId) ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        family: families[0] || null,
        families,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'CHOOSE_COLOR': {
      let availableColors = Array.isArray(op.colors) && op.colors.length > 0
        ? op.colors.map(c => String(c))
        : ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];

      if (op.colorsFromField) {
        const fieldColors = [];
        for (const side of ['player', 'opponent']) {
          for (const stack of state.players[side].field || []) {
            if (stack.top?.type !== 'Spirit') continue;
            for (const color of computeColors(state, stack)) {
              if (!fieldColors.some(c => c.toLowerCase() === String(color).toLowerCase())) fieldColors.push(color);
            }
          }
        }
        availableColors = fieldColors;
        if (availableColors.length === 0) return { success: false, reason: 'NO_ELIGIBLE_COLOR' };
      }

      let chosenColor = op.color ? String(op.color) : availableColors[0];
      if (!op.color && promptResolver) {
        const choice = await promptResolver.choose({
          type: 'CHOOSE_COLOR',
          title: 'Choose a color',
          candidates: availableColors.map(c => ({ id: c, color: c, label: c.toUpperCase() })),
          count: 1,
          chooser: controller
        });
        const choiceArr = unwrapPromptSelection(choice);
        if (choiceArr[0]) {
          chosenColor = String(choiceArr[0].color || choiceArr[0].id || choiceArr[0]);
        }
      }

      context.chosenColor = chosenColor;
      const targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);

      const mod = {
        id: `mod_${Date.now()}_choose_color_${Math.random().toString(36).substr(2, 5)}`,
        type: 'CHOOSE_COLOR',
        targetStackId,
        targetCardId: op.targetCardId || (sourceCard ? sourceCard.id : null),
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color: chosenColor,
        setColors: op.replaceColors ? [chosenColor] : null,
        addColors: op.replaceColors ? null : [chosenColor],
        addSymbol: Boolean(op.addSymbol),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, chosenColor, modifier: mod };
    }

    case 'TREAT_AS_MAX_LEVEL': {
      const color = op.color || ctx.chosenColor;
      if (!color) return { success: false, reason: 'COLOR_NOT_CHOSEN' };
      const modifier = {
        id: `mod_${Date.now()}_max_level_${Math.random().toString(36).slice(2, 7)}`,
        type: 'TREAT_RULE',
        side: op.side || 'both',
        targetFilter: { ...(op.filter || {}), type: 'Spirit', color },
        treatAs: 'MAX_LEVEL',
        treatAsMaxLevel: true,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(modifier);
      return { success: true, modifier };
    }

    case 'ADD_COLOR': {
      if (op.color) {
        let targetStack = sourceStack;
        if (!targetStack && sourceCard) {
          for (const side of ['player', 'opponent']) {
            targetStack = (state.players[side].field || []).find(stack => stack.top?.id === sourceCard.id) || null;
            if (targetStack) break;
          }
        }
        if (!targetStack) return { success: false, reason: 'SOURCE_NOT_ON_FIELD' };

        const modifier = {
          id: `mod_${Date.now()}_add_color_${Math.random().toString(36).slice(2, 7)}`,
          type: 'TREAT_COLOR_SYMBOL',
          targetStackId: targetStack.id || targetStack.stackId,
          color: String(op.color),
          duration: op.duration || 'PERMANENT',
          sourceCardId: sourceCard ? sourceCard.id : null
        };
        state.modifiers.push(modifier);
        return { success: true, color: modifier.color, targetStackId: modifier.targetStackId, modifier };
      }

      const candidates = queryCandidates(
        state,
        { zone: 'field', side: 'self', types: op.types || ['Spirit'], filters: op.filter || {} },
        context
      );
      if (candidates.length === 0) return { success: false, reason: 'NO_ELIGIBLE_TARGET' };

      const chosenTargets = await promptResolver.choose({
        type: 'SELECT_STACK',
        title: 'Choose a Spirit to gain an additional color',
        candidates,
        count: 1,
        chooser: controller
      });
      const selected = chosenTargets && chosenTargets[0];
      const targetStack = selected && (selected.stack || candidates.find(c => c.stack?.id === selected.id)?.stack);
      if (!targetStack) return { success: false, reason: 'TARGET_NOT_SELECTED' };

      const originalColors = Array.isArray(targetStack.top.colors)
        ? targetStack.top.colors
        : [targetStack.top.color || 'Red'];
      const availableColors = (op.colors || ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'])
        .filter(color => !originalColors.some(original => String(original).toLowerCase() === String(color).toLowerCase()));
      if (availableColors.length === 0) return { success: false, reason: 'NO_ADDITIONAL_COLOR_AVAILABLE' };

      const colorChoice = await promptResolver.choose({
        type: 'CHOOSE_COLOR',
        title: 'Choose an additional color',
        candidates: availableColors.map(color => ({ id: color, color, label: String(color).toUpperCase() })),
        count: 1,
        chooser: controller
      });
      const choice = colorChoice && colorChoice[0];
      const color = choice && String(choice.color || choice.id || choice);
      if (!color || !availableColors.some(c => c.toLowerCase() === color.toLowerCase())) {
        return { success: false, reason: 'COLOR_NOT_SELECTED' };
      }

      const modifier = {
        id: `mod_${Date.now()}_add_color_${Math.random().toString(36).slice(2, 7)}`,
        type: 'TREAT_COLOR_SYMBOL',
        targetStackId: targetStack.id || targetStack.stackId,
        color,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(modifier);
      return { success: true, color, targetStackId: modifier.targetStackId, modifier };
    }

    case 'SET_HAND_COST':
    case 'COST_MODIFIER': {
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const mod = {
        id: `mod_${Date.now()}_cost_mod_${Math.random().toString(36).slice(2, 7)}`,
        type: 'COST_MODIFIER',
        side: targetSide,
        targetCardId: op.targetCardId || (op.target === 'SELF' && sourceCard ? sourceCard.id : null),
        targetStackId: op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null),
        targetFilter: op.filter || (op.family ? { family: op.family } : null),
        setCost: typeof op.setCost === 'number' ? op.setCost : (typeof op.cost === 'number' ? op.cost : null),
        amount: typeof op.amount === 'number' ? op.amount : null,
        delta: typeof op.delta === 'number' ? op.delta : null,
        mode: op.mode || (typeof op.amount === 'number' && op.amount < 0 ? 'REDUCE' : 'ADD'),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      if (mod.setCost === null && mod.amount === null && mod.delta === null) {
        return { success: false, reason: 'COST_MODIFIER_VALUE_MISSING' };
      }
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'SET_RESTRICTION': {
      const isSelfTarget = op.side === 'self' || String(op.target || '').toLowerCase() === 'self';
      const targetSide = isSelfTarget ? controller : oppSide;
      const restriction = op.restriction || op.rule || 'CANNOT_SUMMON';
      const targetStackId = (isSelfTarget && String(op.target || '').toLowerCase() === 'self' && sourceStack)
        ? (sourceStack.id || sourceStack.stackId || null)
        : (op.targetStackId || null);
      const targetCardId = (isSelfTarget && String(op.target || '').toLowerCase() === 'self' && sourceCard && !targetStackId)
        ? (sourceCard.id || null)
        : (op.targetCardId || null);
      const mod = {
        id: `mod_${Date.now()}_set_rest_${Math.random().toString(36).substr(2, 5)}`,
        type: 'SET_RESTRICTION',
        side: targetSide,
        restriction,
        targetStackId,
        targetCardId,
        targetFilter: op.filter || null,
        maxCost: typeof op.maxCost === 'number' ? op.maxCost : null,
        cardType: op.cardType || null,
        fromZone: op.fromZone || null,
        applyTo: op.applyTo || null,
        applyToCosts: op.applyToCosts,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);

      if (events) {
        await events.emit({
          type: 'RESTRICTION_APPLIED',
          player: targetSide,
          restriction,
          duration: mod.duration,
          sourceCard
        });
      }
      return { success: true, modifier: mod };
    }

    case 'SET_BURST_FROM_HAND': {
      const p = state.players[controller];
      if (isActionRestricted(state, 'CANNOT_SET_BURST', controller, null, { actionType: 'SET_BURST', fromZone: 'hand' })) {
        return { status: 'REJECTED', success: false, reason: 'BURST_SET_RESTRICTED' };
      }
      if (p.burstSetThisTurn) return { success: false, reason: 'BURST_ALREADY_SET_THIS_TURN' };
      const candidates = (p.hand || []).filter(card => Boolean(card.isBurst || card.burst || card.compiledIr?.abilities?.some(ability => ability.header?.timing === 'BURST')));
      if (!candidates.length) return { success: false, reason: 'NO_BURST_CARDS_IN_HAND' };
      const chosen = await promptResolver.choose({ type: 'SELECT_CARDS', title: 'Choose a Burst card to set', candidates: candidates.map(card => ({ card })), count: 1, chooser: controller });
      const card = chosen?.[0]?.card || chosen?.[0] || ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? candidates[0] : null);
      if (!card) return { status: 'UNRESOLVED', success: false, reason: 'NO_BURST_CARD_SELECTED' };
      const moved = await moveCard(state, card, 'burst', controller, { cause: 'set_burst', sourceCard }, events);
      if (!moved) return { success: false, reason: 'BURST_SET_FAILED' };
      p.burstSetThisTurn = true;
      return { success: true, card };
    }

    case 'REVEAL_BONUS':
      return { success: true, continuous: true, amount: op.amount || 0 };

    // -------------------------------------------------------------
    // MILESTONE 4: Modern Mechanics (Grandwalker, Rebirth & Advanced Keywords)
    // -------------------------------------------------------------
    case 'CORE_CHARGE_TRIGGER':
    case 'CORE_CHARGE_ADD': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const hasGrandwalker = card => String(card?.type || '').toLowerCase().includes('grandwalker') ||
        (Array.isArray(card?.families) ? card.families : [card?.family].filter(Boolean)).some(f => String(f).toLowerCase().includes('grandwalker'));
      if (op.op === 'CORE_CHARGE_TRIGGER' && op.uniqueGrandwalkerName && (p.field || []).some(st => st.top?.name === sourceCard?.name && st.top?.id !== sourceCard?.id)) {
        return { success: false, reason: 'GRANDWALKER_NAME_ALREADY_CONTROLLED' };
      }
      const gwStack = (sourceStack && hasGrandwalker(sourceStack.top))
        ? sourceStack
        : p.field.find(s => hasGrandwalker(s.top)) || sourceStack || ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? p.field[0] : null) || null;

      if (op.op === 'CORE_CHARGE_TRIGGER') {
        const millCount = typeof op.millCount === 'number' ? op.millCount : (typeof op.count === 'number' ? op.count : 3);
        const milled = [];
        for (let i = 0; i < millCount; i++) {
          if (p.deck.length === 0) break;
          const card = p.deck.shift();
          p.grave.push(card);
          milled.push(card);
        }
        context.coreChargeMilled = milled;
        const matched = op.filter ? milled.filter(c => matchesCardFilter(c, op.filter)) : milled;
        const addedCores = matched.length;
        if (gwStack && addedCores > 0) {
          gwStack.cores.normal = (gwStack.cores.normal || 0) + addedCores;
        }
        if (events) {
          await events.emit({
            type: 'CORE_CHARGE_ADDED',
            player: targetSide,
            milledCount: milled.length,
            addedCores,
            stackId: gwStack ? (gwStack.id || gwStack.stackId) : null,
            sourceCard
          });
        }
        return { success: true, milledCount: milled.length, addedCores, milled };
      }

      // CORE_CHARGE_ADD
      let count = typeof op.count === 'number' ? op.count : 1;
      if (Array.isArray(context.coreChargeMilled) && op.filter) {
        const matched = context.coreChargeMilled.filter(c => matchesCardFilter(c, op.filter));
        count = matched.length * (typeof op.perMatch === 'number' ? op.perMatch : 1);
      }
      if (gwStack && count > 0) {
        gwStack.cores.normal = (gwStack.cores.normal || 0) + count;
      }
      if (events) {
        await events.emit({
          type: 'CORE_CHARGE_ADDED',
          player: targetSide,
          addedCores: count,
          stackId: gwStack ? (gwStack.id || gwStack.stackId) : null,
          sourceCard
        });
      }
      return { success: true, addedCores: count, stackId: gwStack ? (gwStack.id || gwStack.stackId) : null };
    }

    case 'GRANDWALKER_CORE_RULE':
    case 'GRANDWALKER_PROTECTION': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const gwStack = sourceStack || p.field.find(s => (s.top.type || '').toLowerCase().includes('grandwalker')) || null;
      const targetStackId = op.targetStackId || (gwStack ? (gwStack.id || gwStack.stackId) : null);
      const initialCores = typeof op.cores === 'number' ? op.cores : (typeof op.count === 'number' ? op.count : 0);
      if (gwStack && initialCores > 0) {
        gwStack.cores.normal = (gwStack.cores.normal || 0) + initialCores;
      }
      const mod = {
        id: `mod_${Date.now()}_gw_rule_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: targetSide,
        targetStackId,
        onlyAffectedByGrandwalkerEffects: true,
        coreChargeOnly: op.op === 'GRANDWALKER_CORE_RULE',
        duration: op.duration || 'PERMANENT',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod, addedCores: initialCores };
    }

    case 'GRANDWALKER_ACTION': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const hasFamily = (card, fam) => (Array.isArray(card?.families) ? card.families : [card?.family].filter(Boolean)).some(f => String(f).toLowerCase().includes(fam));
      let gwStack = (sourceStack && (String(sourceStack.top.type || '').toLowerCase().includes('grandwalker') || hasFamily(sourceStack.top, 'grandwalker')))
        ? sourceStack
        : p.field.find(s => String(s.top.type || '').toLowerCase().includes('grandwalker') || hasFamily(s.top, 'grandwalker')) || sourceStack || ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? p.field[0] : null) || null;

      let addCores = typeof op.addCores === 'number' ? op.addCores : (typeof op.count === 'number' ? op.count : 0);
      if (op.countFrom === 'REVEALED_MATCHES') {
        addCores = (context.revealedCards || []).filter(card => matchesCardFilter(card, op.filter)).length;
        const candidates = (state.players[controller].field || []).filter(st =>
          String(st.top.type || '').toLowerCase().includes('nexus') && hasFamily(st.top, 'grandwalker') &&
          (st.top.colors || [st.top.color]).some(color => String(color).toLowerCase() === String(op.targetColor || 'Red').toLowerCase())
        );
        if (candidates.length === 0) return { success: false, reason: 'NO_LEGAL_GRANDWALKER_NEXUS' };
        if (promptResolver && typeof promptResolver.choose === 'function') {
          const selected = await promptResolver.choose({ type: 'SELECT_STACK', title: 'Choose a Red Grandwalker Nexus', candidates: candidates.map(stack => ({ stack, card: stack.top })), count: 1, chooser: controller });
          if (selected?.[0]?.stack) gwStack = selected[0].stack;
          else if (selected?.selected?.[0]) {
            const sid = selected.selected[0];
            const found = candidates.find(s => (s.id || s.stackId) === sid);
            if (found) gwStack = found;
          }
        } else if (!state?.matchContext || state.matchContext.canSimulate(controller)) {
          gwStack = candidates[0];
        } else {
          return { status: 'UNRESOLVED', success: false, reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
        }
      }

      if (!gwStack) {
        return { success: false, reason: 'NO_GRANDWALKER_FOUND' };
      }

      const costCores = typeof op.costCores === 'number' ? op.costCores : (typeof op.sendToVoid === 'number' ? op.sendToVoid : 0);
      if (costCores > 0) {
        const costStack = sourceStack || gwStack;
        const available = costStack?.cores.normal || 0;
        if (available < costCores) {
          return { success: false, reason: 'INSUFFICIENT_GRANDWALKER_CORES', required: costCores, available };
        }
        const paid = await moveCore(state, costCores,
          { zone: 'field', side: controller, stackId: costStack.id },
          { zone: 'void', side: controller },
          { cause: 'cost', by: controller, sourceCard, targetsGrandwalker: true }, events);
        if (!paid) return { success: false, reason: 'GRANDWALKER_COST_FAILED' };
        if (events) {
          await events.emit({
            type: 'GRANDWALKER_ACTION_RESOLVED',
            player: targetSide,
            action: op.action || 'GRANDWALKER_SKILL',
            costPaid: costCores,
            stackId: costStack.id || costStack.stackId,
            sourceCard
          });
        }
        return { success: true, costPaid: costCores, remainingCores: gwStack.cores.normal };
      }

      if (addCores > 0) {
        gwStack.cores.normal = (gwStack.cores.normal || 0) + addCores;
      }
      if (events) {
        await events.emit({
          type: 'GRANDWALKER_ACTION_RESOLVED',
          player: targetSide,
          action: op.action || 'GRANDWALKER_ACTION',
          addedCores: addCores,
          stackId: gwStack.id || gwStack.stackId,
          sourceCard
        });
      }
      return { success: true, addedCores: addCores, stackId: gwStack.id || gwStack.stackId };
    }

    case 'REBIRTH_FLIP':
    case 'REBIRTH_ACTION': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? p.field[0] : null)) || null;
      if (!targetStack) {
        return { success: false, reason: 'NO_STACK_TO_REBIRTH' };
      }

      const bSide = op.bSideData || targetStack.top.backSide || targetStack.top.rebirthSide || targetStack.top.bSide || null;
      if (bSide && typeof bSide === 'object') {
        targetStack.aSideSnapshot = { ...targetStack.top };
        Object.assign(targetStack.top, bSide);
      }
      targetStack.isReborn = true;
      targetStack.top.isReborn = true;
      if (op.refresh !== false) {
        targetStack.exhausted = false;
      }
      if (op.placeSoulCore) {
        if (p.reserve.soul > 0) {
          p.reserve.soul = 0;
          targetStack.cores.soul = 1;
        } else if (p.trash.soul > 0) {
          p.trash.soul = 0;
          targetStack.cores.soul = 1;
        } else {
          targetStack.cores.soul = 1;
        }
      }
      if (typeof op.addCores === 'number' && op.addCores > 0) {
        targetStack.cores.normal = (targetStack.cores.normal || 0) + op.addCores;
      }
      p.count = (p.count || 0) + (typeof op.addCount === 'number' ? op.addCount : 1);

      if (events) {
        await events.emit({
          type: 'REBORN',
          player: targetSide,
          stackId: targetStack.id || targetStack.stackId,
          card: targetStack.top,
          count: p.count
        });
      }
      return { success: true, isReborn: true, stackId: targetStack.id || targetStack.stackId, count: p.count };
    }

    case 'REBIRTH_CORE_PLACEMENT': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const targetStack = sourceStack || p.field.find(s => s.isReborn || (s.top && s.top.isReborn)) || ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? p.field[0] : null) || null;
      if (!targetStack) {
        return { success: false, reason: 'NO_REBORN_STACK' };
      }
      const count = typeof op.count === 'number' ? op.count : 1;
      const from = (op.from || 'void').toLowerCase();
      let moved = 0;
      if (from === 'reserve') {
        const take = Math.min(count, p.reserve.normal || 0);
        p.reserve.normal -= take;
        targetStack.cores.normal = (targetStack.cores.normal || 0) + take;
        moved = take;
      } else if (from === 'trash') {
        const take = Math.min(count, p.trash.normal || 0);
        p.trash.normal -= take;
        targetStack.cores.normal = (targetStack.cores.normal || 0) + take;
        moved = take;
      } else {
        targetStack.cores.normal = (targetStack.cores.normal || 0) + count;
        moved = count;
      }
      return { success: true, movedCores: moved, stackId: targetStack.id || targetStack.stackId };
    }

    case 'KEYWORD_RULE':
    case 'KEYWORD_ABILITY':
    case 'KEYWORD_ACTION':
    case 'GRANT_KEYWORD':
    case 'GRANT_ABILITY':
    case 'MODIFY_KEYWORD': {
      if (op.condition) {
        const condEval = evaluateStructuredCondition(state, op.condition, context);
        if (condEval.result !== CONDITION_RESULT.TRUE) {
          return {
            status: 'NO_OP_BY_RULE',
            success: false,
            skipped: true,
            conditionResult: condEval.result,
            reason: condEval.result === CONDITION_RESULT.INVALID_CONTEXT
              ? (condEval.reason || 'INVALID_CONDITION_CONTEXT')
              : (condEval.result === CONDITION_RESULT.UNSUPPORTED ? 'UNSUPPORTED_CONDITION' : 'CONDITION_NOT_MET')
          };
        }
      }
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const opp = state.players[targetSide === 'player' ? 'opponent' : 'player'];
      const keyword = String(op.keyword || op.ability || op.rule || 'Keyword').trim();
      const kwLower = keyword.toLowerCase();
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? p.field[0] : null)) || null;

      let actionResult = {};

      if (kwLower.includes('high speed')) {
        if (op.cardId || op.summonCardId) {
          const cid = op.cardId || op.summonCardId;
          const cIdx = p.hand.findIndex(c => c.id === cid || c.cardId === cid || c.cardNumber === cid);
          if (cIdx !== -1) {
            const costToPay = typeof op.cost === 'number' ? op.cost : 1;
            if ((p.reserve.normal + p.reserve.soul) >= costToPay) {
              const normalPaid = Math.min(p.reserve.normal, costToPay);
              p.reserve.normal -= normalPaid;
              p.trash.normal += normalPaid;
              if (costToPay - normalPaid > 0 && p.reserve.soul > 0) {
                p.reserve.soul = 0;
                p.trash.soul = 1;
              }
              const res = await moveCard(state, p.hand[cIdx], 'field', targetSide, { cause: 'effect' }, events);
              if (res && p.reserve.normal > 0) {
                const newStack = p.field.find(st => st.top.id === cid || st.top.cardId === cid || st.top.cardNumber === cid);
                if (newStack) {
                  p.reserve.normal -= 1;
                  newStack.cores.normal += 1;
                  actionResult.summonedStack = newStack;
                }
              }
            }
          }
        }
      } else if (kwLower.includes('clash') || kwLower.includes('showdown') || kwLower.includes('excite')) {
        state.modifiers.push({
          id: `mod_${Date.now()}_kw_clash_${Math.random().toString(36).substr(2, 5)}`,
          type: 'FORCE_BLOCK',
          side: targetSide === 'player' ? 'opponent' : 'player',
          keyword,
          duration: op.duration || 'THIS_BATTLE',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
        actionResult.forcedBlock = true;
      } else if (kwLower.includes('crush')) {
        const lv = targetStack ? computeLevel(targetStack, state) : (op.level || 1);
        const millCount = typeof op.count === 'number' ? op.count : lv;
        const milled = [];
        for (let i = 0; i < millCount; i++) {
          if (opp.deck.length === 0) break;
          const c = opp.deck.shift();
          opp.grave.push(c);
          milled.push(c);
        }
        actionResult.milledCount = milled.length;
      } else if (kwLower.includes('windstorm')) {
        const exhaustCount = typeof op.count === 'number' ? op.count : 1;
        let exhausted = 0;
        for (const s of opp.field) {
          if (exhausted >= exhaustCount) break;
          if (!s.exhausted) {
            s.exhausted = true;
            exhausted++;
          }
        }
        actionResult.exhaustedCount = exhausted;
      } else if (kwLower.includes('holy life')) {
        p.life += 1;
        actionResult.lifeRecovered = 1;
      } else if (kwLower.includes('armor') || kwLower.includes('a.t. field')) {
        const colors = Array.isArray(op.colors) ? op.colors : (op.color ? [op.color] : ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']);
        state.modifiers.push({
          id: `mod_${Date.now()}_kw_armor_${Math.random().toString(36).substr(2, 5)}`,
          type: 'IMMUNITY',
          side: targetSide,
          targetStackId: targetStack ? (targetStack.id || targetStack.stackId) : null,
          colors,
          categories: ['SPIRIT', 'ULTIMATE', 'NEXUS', 'MAGIC'],
          duration: op.duration || 'THIS_TURN',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
        actionResult.armorColors = colors;
      } else if (kwLower.includes('mirage')) {
        if (sourceCard) {
          p.mirage = sourceCard;
          actionResult.mirageSet = sourceCard.id;
        }
      } else if (kwLower.includes('accel')) {
        if (sourceCard) {
          if (!Array.isArray(p.removed)) p.removed = [];
          const hIdx = p.hand.findIndex(c => c.id === sourceCard.id);
          if (hIdx !== -1) p.hand.splice(hIdx, 1);
          p.removed.push(sourceCard);
          actionResult.accelMovedToRemoved = true;
        }
      }

      const mod = {
        id: `mod_${Date.now()}_kw_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: targetSide,
        targetStackId: targetStack ? (targetStack.id || targetStack.stackId) : null,
        targetFilter: op.filter || null,
        keyword,
        value: op.value || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, keyword, modifier: mod, ...actionResult };
    }

    case 'TRIBUTE_COST': {
      const p = state.players[controller];
      const minCost = typeof op.minCost === 'number' ? op.minCost : 0;
      const candidates = p.field.filter(s => {
        if (sourceStack && (s.id || s.stackId) === (sourceStack.id || sourceStack.stackId)) return false;
        const typeStr = (s.top.type || 'Spirit').toLowerCase();
        if (typeStr.includes('nexus')) return false;
        if ((s.top.cost || 0) < minCost) return false;
        if (op.family && !(s.top.family || []).some(f => f.toLowerCase().includes(String(op.family).toLowerCase()))) return false;
        if (op.filter && !matchesCardFilter(s.top, op.filter)) return false;
        return true;
      });

      if (candidates.length === 0) {
        return { success: false, reason: 'NO_VALID_TRIBUTE_TARGET' };
      }

      let chosen = null;
      if (op.targetStackId) {
        const explicit = candidates.find(s => (s.id || s.stackId) === op.targetStackId || s.top.id === op.targetStackId);
        if (explicit) chosen = explicit;
      } else if (promptResolver && typeof promptResolver.choose === 'function') {
        const choice = await promptResolver.choose({
          type: 'SELECT_TRIBUTE',
          player: controller,
          candidates: candidates.map(s => ({ stack: s, card: s.top })),
          options: candidates.map(s => s.id || s.stackId)
        });
        const choiceArr = unwrapPromptSelection(choice);
        const choiceVal = choiceArr[0]?.stack ? (choiceArr[0].stack.id || choiceArr[0].stack.stackId) : (choiceArr[0]?.card?.id || choiceArr[0]?.id || choiceArr[0]);
        const found = candidates.find(s => (s.id || s.stackId) === choiceVal || s.top.id === choiceVal);
        if (found) chosen = found;
      }
      if (!chosen) {
        if (!state?.matchContext || state.matchContext.canSimulate(controller)) {
          chosen = candidates[0];
        } else {
          return { status: 'UNRESOLVED', success: false, reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
        }
      }

      const dest = (op.destination || 'VOID').toUpperCase();
      const normalCores = chosen.cores.normal || 0;
      const soulCores = chosen.cores.soul || 0;
      chosen.cores.normal = 0;
      chosen.cores.soul = 0;

      if (dest === 'TRASH') {
        p.trash.normal += normalCores;
        p.trash.soul += soulCores;
      } else if (dest === 'RESERVE') {
        p.reserve.normal += normalCores;
        p.reserve.soul += soulCores;
      } else {
        // Default Tribute: cores go to Void (except Soul Core if rule protects it, or sent to trash/void per op)
        if (soulCores > 0 && op.keepSoulCoreInTrash) {
          p.trash.soul += soulCores;
        }
      }

      await moveCard(state, chosen.top, 'grave', controller, { cause: 'tribute', by: controller }, events);
      if (events) {
        await events.emit({
          type: 'TRIBUTE_PAID',
          player: controller,
          tributedCard: chosen.top,
          coresMoved: normalCores + soulCores,
          destination: dest
        });
      }
      return { success: true, tributedStackId: chosen.id || chosen.stackId, tributedCard: chosen.top, coresMoved: normalCores + soulCores };
    }

    case 'AWAKEN_CORE_MOVE': {
      const p = state.players[controller];
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? p.field[0] : null)) || null;
      if (!targetStack) {
        return { success: false, reason: 'NO_AWAKEN_TARGET' };
      }

      const requested = op.count === 'ANY' ? (typeof op.requestedCount === 'number' ? op.requestedCount : 1) : (typeof op.count === 'number' ? op.count : 1);
      let moved = 0;

      // Move from other friendly spirits first
      for (const s of p.field) {
        if ((s.id || s.stackId) === (targetStack.id || targetStack.stackId)) continue;
        while (moved < requested && (s.cores.normal || 0) > 0) {
          s.cores.normal -= 1;
          targetStack.cores.normal = (targetStack.cores.normal || 0) + 1;
          moved++;
        }
        if (moved >= requested) break;
      }

      // Also allow taking from reserve if fromReserve is allowed or no other spirits had enough cores
      if (moved < requested && op.allowReserve !== false && (p.reserve.normal || 0) > 0) {
        const take = Math.min(requested - moved, p.reserve.normal);
        p.reserve.normal -= take;
        targetStack.cores.normal = (targetStack.cores.normal || 0) + take;
        moved += take;
      }

      if (events) {
        await events.emit({
          type: 'AWAKEN_RESOLVED',
          player: controller,
          stackId: targetStack.id || targetStack.stackId,
          movedCores: moved
        });
      }
      return { success: moved > 0, movedCores: moved, stackId: targetStack.id || targetStack.stackId };
    }

    case 'SEAL_MOVE': {
      const p = state.players[controller];
      let movedSoulCore = false;
      if (sourceStack && (sourceStack.cores.soul || 0) > 0) {
        sourceStack.cores.soul = 0;
        movedSoulCore = true;
      } else if ((p.reserve.soul || 0) > 0) {
        p.reserve.soul = 0;
        movedSoulCore = true;
      } else {
        const stackWithSoul = p.field.find(s => (s.cores.soul || 0) > 0);
        if (stackWithSoul) {
          stackWithSoul.cores.soul = 0;
          movedSoulCore = true;
        }
      }

      if (!movedSoulCore) {
        return { success: false, reason: 'SOUL_CORE_NOT_AVAILABLE_FOR_SEAL' };
      }

      p.life += 1;
      p.isDuringSeal = true;
      p.soulCoreInLife = true;

      if (events) {
        await events.emit({
          type: 'SEAL_ACTIVATED',
          player: controller,
          life: p.life,
          sourceCard
        });
      }
      return { success: true, isDuringSeal: true, life: p.life };
    }

    case 'MOVE_SOUL_CORE':
    case 'ADVENT_SOUL_CORE_ACTION': {
      const p = state.players[controller];
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? p.field[0] : null)) || null;
      const toZone = String(op.destination || op.to || 'field').toLowerCase();

      if (op.requireSourceSoul) {
        if (!sourceStack || !(sourceStack.cores.soul > 0)) return { success: false, reason: 'SOURCE_SOUL_CORE_NOT_AVAILABLE' };
        sourceStack.cores.soul -= 1;
        if (toZone === 'life') {
          p.life += 1;
          p.soulCoreInLife = true;
        } else if (toZone === 'trash') {
          p.trash.soul += 1;
        } else if (toZone === 'void') {
          p.voidCores.soul += 1;
        } else {
          p.reserve.soul += 1;
        }
        return { success: true, fromStackId: sourceStack.id, to: toZone };
      }

      // Remove soul core from current location
      if ((p.reserve.soul || 0) > 0) p.reserve.soul = 0;
      if ((p.trash.soul || 0) > 0) p.trash.soul = 0;
      for (const s of p.field) {
        if ((s.cores.soul || 0) > 0) s.cores.soul = 0;
      }

      if (toZone === 'life') {
        p.life += 1;
        p.soulCoreInLife = true;
      } else if (toZone === 'trash') {
        p.trash.soul = 1;
      } else if (toZone === 'reserve') {
        p.reserve.soul = 1;
      } else if (targetStack) {
        targetStack.cores.soul = 1;
      } else {
        p.reserve.soul = 1;
      }
      return { success: true, to: toZone, stackId: targetStack ? (targetStack.id || targetStack.stackId) : null };
    }

    case 'REFRESH_BY_EXHAUSTING_NEXUS': {
      const p = state.players[controller];
      const targetStack = sourceStack || p.field.find(s => s.exhausted && !(s.top.type || '').toLowerCase().includes('nexus')) || null;
      const readyNexus = p.field.find(s => !s.exhausted && (s.top.type || '').toLowerCase().includes('nexus'));
      if (!readyNexus || !targetStack) {
        return { success: false, reason: 'NO_READY_NEXUS_OR_TARGET' };
      }
      readyNexus.exhausted = true;
      targetStack.exhausted = false;
      return { success: true, exhaustedNexusId: readyNexus.id || readyNexus.stackId, refreshedStackId: targetStack.id || targetStack.stackId };
    }

    case 'REMAIN_ON_FIELD_EXHAUSTED':
    case 'REMAIN_ON_FIELD':
    case 'RESURRECT': {
      const p = state.players[controller];
      if (op.op === 'RESURRECT') {
        const matchingGrave = op.filter ? p.grave.filter(c => matchesCardFilter(c, op.filter, op)) : p.grave.filter(c => (c.type || '').includes('Spirit'));
        if (matchingGrave.length === 0) return { status: 'NO_OP_BY_RULE', transactionOutcome: 'REJECTED', success: false, reason: 'NO_LEGAL_TARGETS' };
        let card = op.cardId ? (matchingGrave.find(c => c.id === op.cardId) || null) : null;
        if (!card) {
          if (matchingGrave.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
            const picked = await promptResolver.choose({
              type: 'SELECT_SUMMON',
              title: 'Choose Spirit in Trash to resurrect',
              candidates: matchingGrave.map(c => ({ card: c })),
              count: 1,
              chooser: controller
            });
            const pickedCard = picked?.[0]?.card || picked?.[0] || (picked?.selected?.[0]?.card || picked?.selected?.[0]);
            if (pickedCard && matchingGrave.some(c => c.id === pickedCard.id)) {
              card = pickedCard;
            } else if (picked?.declined || (Array.isArray(picked) && picked.length === 0)) {
              return { status: 'SKIPPED', transactionOutcome: 'SKIPPED', success: true, count: 0, reason: 'OPTIONAL_SKIPPED' };
            }
          }
          if (!card) card = matchingGrave[matchingGrave.length - 1];
        }
        if (!card) return { status: 'REJECTED', transactionOutcome: 'REJECTED', success: false, reason: 'NO_LEGAL_TARGETS' };
        return await executeSummonTransaction(state, { ...op, from: 'GRAVE' }, card, true, controller, sourceCard, context, events);
      }
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : null);
      if (targetStack) {
        if (op.op === 'REMAIN_ON_FIELD_EXHAUSTED' || op.state === 'EXHAUSTED' || op.exhaust !== false) {
          targetStack.exhausted = true;
        } else {
          targetStack.exhausted = false;
        }
        state.modifiers.push({
          id: `mod_${Date.now()}_remain_${Math.random().toString(36).substr(2, 5)}`,
          type: 'PROTECTION',
          side: controller,
          targetStackId: targetStack.id || targetStack.stackId,
          remainState: targetStack.exhausted ? 'EXHAUSTED' : 'READY',
          duration: op.duration || 'THIS_STEP',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
        return { success: true, stackId: targetStack.id || targetStack.stackId, exhausted: targetStack.exhausted };
      }
      return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_TARGET_FOR_REMAIN' };
    }

    case 'BANISH':
    case 'BANISH_TRASH':
    case 'BANISH_DECK':
    case 'BANISH_HAND':
    case 'REMOVE_FROM_GAME':
    case 'REMOVED_ZONE_ACTION':
    case 'DISCARD_REMOVED': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const p = state.players[targetSide];
      if (!Array.isArray(p.removed)) p.removed = [];
      const count = typeof op.count === 'number' ? op.count : 1;
      const banished = [];

      const zoneName = op.op === 'BANISH_TRASH' ? 'grave'
        : op.op === 'BANISH_DECK' ? 'deck'
        : op.op === 'BANISH_HAND' ? 'hand'
        : (op.from || 'grave').toLowerCase();

      if (zoneName === 'deck' && isActionRestricted(state, 'CANNOT_MILL', targetSide, null, { by: controller, sourceCard, isCost: Boolean(op.isCost) })) {
        return { status: 'REJECTED', success: false, banishedCount: 0, banished: [], reason: 'MILL_RESTRICTED' };
      }

      const sourceArr = zoneName === 'deck' ? p.deck
        : zoneName === 'hand' ? p.hand
        : p.grave;

      for (let i = 0; i < count; i++) {
        const idx = op.filter ? sourceArr.findIndex(c => matchesCardFilter(c, op.filter)) : (sourceArr.length > 0 ? 0 : -1);
        if (idx === -1) break;
        const [removedCard] = sourceArr.splice(idx, 1);
        p.removed.push(removedCard);
        banished.push(removedCard);
      }
      return { success: true, banishedCount: banished.length, banished };
    }

    case 'DISCARD_REMAINING':
    case 'DISCARD':
    case 'DISCARD_CARD':
    case 'DISCARD_COST': {
      const targetSide = op.side === 'opponent' || op.side === 'opp' ? oppSide : controller;
      const isCostOp = Boolean(op.isCost || op.op === 'DISCARD_COST');
      if (isActionRestricted(state, 'CANNOT_DISCARD', targetSide, null, { isCost: isCostOp, by: controller, sourceCard })) {
        return { status: 'REJECTED', success: false, discardedCount: 0, discarded: [], reason: 'DISCARD_RESTRICTED' };
      }
      const p = state.players[targetSide];
      if (op.op === 'DISCARD_REMAINING' && Array.isArray(context.revealedCards) && context.revealedCards.length > 0) {
        const remaining = [...context.revealedCards];
        let discardedCount = 0;
        for (const c of remaining) {
          const moved = await moveCard(state, c, 'grave', targetSide, { cause: 'discard', sourceCard }, events);
          if (moved) discardedCount++;
        }
        context.revealedCards = [];
        return { success: discardedCount > 0, discardedCount };
      }
      const count = typeof op.count === 'number' ? op.count : 1;
      const discarded = [];
      for (let i = 0; i < count; i++) {
        if (!Array.isArray(p.hand) || p.hand.length === 0) break;
        const idx = op.filter ? p.hand.findIndex(c => matchesCardFilter(c, op.filter)) : 0;
        if (idx === -1) break;
        const targetCard = p.hand[idx];
        const moved = await moveCard(
          state,
          targetCard,
          'grave',
          targetSide,
          { cause: 'discard', sourceCard, expectedFromZone: 'hand', expectedFromSide: targetSide },
          events
        );
        if (moved) discarded.push(targetCard);
      }
      return { success: discarded.length > 0, discardedCount: discarded.length, discarded };
    }

    case 'EXTRA_TURN': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const count = typeof op.count === 'number' ? op.count : 1;
      p.extraTurns = (p.extraTurns || 0) + count;
      return { success: true, extraTurns: p.extraTurns };
    }

    case 'END_TURN':
    case 'END_ATTACK_STEP':
    case 'END_MAIN_STEP':
    case 'SKIP_STEP':
    case 'STEP_MODIFIER': {
      if (op.op === 'END_ATTACK_STEP') {
        const cantEnd = state.modifiers.some(m =>
          (m.type === 'SET_RESTRICTION' || m.type === 'COMBAT_RESTRICTION' || m.type === 'STEP_MODIFIER') &&
          (m.restriction === 'CANNOT_END_ATTACK_STEP' || m.rule === 'CANNOT_END_ATTACK_STEP')
        );
        if (cantEnd) {
          return { success: false, reason: 'CANNOT_END_ATTACK_STEP_RESTRICTED' };
        }
        state.combat = null;
        state.step = 'END';
        return { success: true, step: state.step };
      }
      if (op.op === 'END_MAIN_STEP') {
        state.step = 'ATTACK';
        return { success: true, step: state.step };
      }
      if (op.op === 'END_TURN') {
        state.combat = null;
        state.step = 'END';
        return { success: true, step: state.step };
      }
      const mod = {
        id: `mod_${Date.now()}_step_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: op.side === 'opponent' ? oppSide : controller,
        step: op.step || null,
        restriction: op.restriction || op.rule || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'COMPARE_BP':
    case 'COMPARE_LEVELS':
    case 'COMPARE_LV_INSTEAD_OF_BP':
    case 'BP_OR_LEVEL_MODIFIER':
    case 'SET_BP':
    case 'SET_LEVEL': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const opp = state.players[targetSide === 'player' ? 'opponent' : 'player'];
      if ((op.op === 'COMPARE_BP' || op.op === 'COMPARE_LEVELS') && sourceStack && opp.field.length > 0) {
        const targetOpp = op.targetStackId ? opp.field.find(s => (s.id || s.stackId) === op.targetStackId) : ((!state?.matchContext || state.matchContext.canSimulate(controller)) ? opp.field[0] : null);
        if (targetOpp) {
          const myLv = computeLevel(sourceStack, state);
          const oppLv = computeLevel(targetOpp, state);
          const myVal = op.op === 'COMPARE_LEVELS'
            ? myLv
            : ((sourceStack.top.levels && sourceStack.top.levels[myLv]) ? sourceStack.top.levels[myLv].bp : (sourceStack.top.bp || 5000));
          const oppVal = op.op === 'COMPARE_LEVELS'
            ? oppLv
            : ((targetOpp.top.levels && targetOpp.top.levels[oppLv]) ? targetOpp.top.levels[oppLv].bp : (targetOpp.top.bp || 3000));
          if (myVal >= oppVal) {
            const oppOwner = targetSide === 'player' ? 'opponent' : 'player';
            await moveCard(state, targetOpp.top, 'grave', oppOwner, { cause: 'destroy', by: controller }, events);
            return { success: true, winner: controller, destroyedStackId: targetOpp.id || targetOpp.stackId };
          }
          return { success: true, winner: oppSide, destroyedStackId: null };
        }
      }
      const lvClean = String(context?.currentClause?.cleanText || context?.currentClause?.rawText || '');
      const isAllOpp = Boolean(op.all || op.target?.all || /\ball\s+opposing\s+(?:spirits|ultimates)/i.test(lvClean));
      const lvSide = (op.side === 'opp' || op.side === 'opponent' || op.target?.side === 'opp' || /\bopposing\b/i.test(lvClean)) ? oppSide : targetSide;
      const lvVal = typeof op.value === 'number' ? op.value : (typeof op.level === 'number' ? op.level : (typeof op.amount === 'number' ? op.amount : (/lv(\d+)/i.test(lvClean) ? parseInt(lvClean.match(/lv(\d+)/i)[1], 10) : 1)));
      const mod = {
        id: `mod_${Date.now()}_bp_lv_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: lvSide,
        stat: op.stat,
        targetStackId: isAllOpp ? null : (op.targetStackId || (!isAllOpp && sourceStack ? (sourceStack.id || sourceStack.stackId) : null)),
        targetFilter: isAllOpp ? (op.filter || { types: op.target?.types || ['Spirit'] }) : (op.filter || null),
        setLevel: lvVal,
        value: lvVal,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'MODIFY_LIFE':
    case 'PAY_LIFE':
    case 'LIFE_PAY_COST':
    case 'REDUCE_LIFE':
    case 'BOOST_LIFE':
    case 'DAMAGE_CAP':
    case 'PREVENT_LOSS': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const count = typeof op.count === 'number' ? op.count : (typeof op.amount === 'number' ? Math.abs(op.amount) : 1);
      if (op.op === 'PAY_LIFE' || op.op === 'LIFE_PAY_COST') {
        if (p.life < count) return { success: false, reason: 'INSUFFICIENT_LIFE' };
        p.life -= count;
        if ((op.to || 'void').toLowerCase() === 'reserve') p.reserve.normal += count;
        return { success: true, life: p.life };
      }
      if (op.op === 'REDUCE_LIFE') {
        const unpreventable = Boolean(op.unpreventable || context.unpreventable);
        if (!unpreventable && isActionRestricted(state, 'CANNOT_LOSE_LIFE', targetSide, null, { isCost: false, by: controller, sourceCard, unpreventable })) {
          return { status: 'REJECTED', success: false, life: p.life, reason: 'LIFE_LOSS_RESTRICTED' };
        }
        const ok = await moveCore(
          state,
          count,
          { zone: 'life', side: targetSide },
          { zone: String(op.to || 'reserve').toLowerCase(), side: targetSide },
          { cause: 'effect_damage', by: controller, sourceCard, unpreventable },
          events
        );
        return { success: Boolean(ok), life: p.life };
      }
      if (op.op === 'BOOST_LIFE' || (op.op === 'MODIFY_LIFE' && (op.amount || 1) > 0)) {
        p.life += count;
        return { success: true, life: p.life };
      }
      const mod = {
        id: `mod_${Date.now()}_life_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: targetSide,
        maxDamage: op.maxDamage || op.cap || 1,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'CONTINUOUS_RULE':
    case 'CARD_RULE_MODIFIER':
    case 'PLAY_CONDITION': {
      if (op.condition) {
        const condEval = evaluateStructuredCondition(state, op.condition, context);
        if (condEval.result !== CONDITION_RESULT.TRUE) {
          return {
            status: 'REJECTED',
            success: false,
            conditionResult: condEval.result,
            reason: condEval.reason || (condEval.result === CONDITION_RESULT.INVALID_CONTEXT ? 'INVALID_CONDITION_CONTEXT' : 'PLAY_CONDITION_NOT_MET')
          };
        }
      }
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const mod = {
        id: `mod_${Date.now()}_rule_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PLAY_CONDITION',
        side: targetSide,
        restriction: op.restriction || op.rule || 'CUSTOM_RULE',
        condition: op.condition || null,
        targetFilter: op.filter || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }
    case 'RULE_OR_TEXT_MODIFIER':
    case 'RESTRICTION':
    case 'OPPONENT_RESTRICTION':
    case 'MAGIC_RESTRICTION': {
      const targetSide = (op.op === 'OPPONENT_RESTRICTION' || op.side === 'opponent') ? oppSide : controller;
      const mod = {
        id: `mod_${Date.now()}_rule_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op === 'OPPONENT_RESTRICTION' || op.op === 'RESTRICTION' ? 'SET_RESTRICTION' : op.op,
        side: targetSide,
        restriction: op.restriction || op.rule || 'CUSTOM_RULE',
        targetFilter: op.filter || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'TARGET_CARD':
    case 'TARGET':
    case 'TARGET_SELECT':
    case 'TARGET_CARDS':
    case 'CHOOSE_TARGETS': {
      const res = await resolveTargets(
        state,
        op,
        context,
        promptResolver,
        { defaultSide: op.side || 'opp', defaultTypes: op.types || ['Spirit'] }
      );
      return {
        ...res,
        selectedTargets: res.selected || [],
        isTargetingResult: true
      };
    }

    case 'CANNOT_REFRESH': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const mod = {
        id: `mod_${Date.now()}_noref_${Math.random().toString(36).substr(2, 5)}`,
        type: 'CANNOT_REFRESH',
        side: targetSide,
        targetFilter: op.filter || (op.target && typeof op.target === 'object' ? op.target : null),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, modifier: mod };
    }

    case 'REVEAL_CARDS': {
      if (String(op.action || '').toUpperCase() === 'DISCARD_REMAINING') {
        const p = state.players[controller];
        const pool = context.revealedCards?.length ? context.revealedCards : (p?.revealed || []);
        const discarded = [];
        while (pool.length > 0) {
          const card = pool.shift();
          if (p) {
            p.grave = p.grave || [];
            if (!p.grave.some(g => g.id === card.id)) p.grave.push(card);
          }
          discarded.push(card);
          await emitAsyncEvent(events, 'CARD_MOVED', { card, fromZone: 'revealed', toZone: 'grave', player: controller, cause: 'discard', sourceCard });
        }
        if (p?.revealed) p.revealed = p.revealed.filter(c => !discarded.includes(c));
        if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => !discarded.includes(c));
        return {
          status: discarded.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE',
          success: discarded.length > 0,
          count: discarded.length,
          discardedCount: discarded.length,
          cards: discarded
        };
      }
      if (typeof op.count !== 'number' && typeof op.amount !== 'number' && !op.all && !op.from && !op.zone) {
        return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_REVEAL_SPEC' };
      }
      const sideSpec = String(op.side || op.target?.side || 'self').toLowerCase();
      const sides = (sideSpec === 'both' || sideSpec === 'either') ? [controller, oppSide] : (sideSpec === 'opp' || sideSpec === 'opponent' ? [oppSide] : [controller]);
      const count = typeof op.count === 'number' ? op.count : (typeof op.amount === 'number' ? op.amount : 1);
      const fromZone = String(op.from || op.zone || 'deck').toLowerCase();
      const allRevealed = [];

      for (const s of sides) {
        const p = state.players[s];
        if (!p) continue;
        const sideRevealed = [];
        if (fromZone === 'hand') {
          const pool = (p.hand || []).filter(c => !op.filter || matchesCardFilter(c, op.filter, op));
          const rev = pool.slice(0, op.all ? pool.length : count);
          sideRevealed.push(...rev);
        } else {
          p.revealed = p.revealed || [];
          for (let i = 0; i < count && (p.deck || []).length > 0; i++) {
            const card = p.deck.shift();
            p.revealed.push(card);
            sideRevealed.push(card);
          }
        }
        allRevealed.push(...sideRevealed);
        if (sideRevealed.length > 0) {
          await emitAsyncEvent(events, 'CARDS_REVEALED', { player: s, count: sideRevealed.length, cards: sideRevealed, from: fromZone, sourceCard });
        }
      }
      context.revealedCards = [...(context.revealedCards || []), ...allRevealed];
      return {
        status: allRevealed.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE',
        success: allRevealed.length > 0,
        count: allRevealed.length,
        revealedCount: allRevealed.length,
        revealed: allRevealed,
        cards: allRevealed
      };
    }

    case 'ACTIVATE_BURST': {
      const p = state.players[controller];
      if (isActionRestricted(state, 'CANNOT_ACTIVATE_BURST', controller)) {
        return { status: 'REJECTED', success: false, reason: 'BURST_LOCKED' };
      }

      const burstCard = p.burst || null;
      if (!burstCard) {
        return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_BURST_CARD_SET' };
      }

      const abilities = burstCard.compiledIr?.abilities || burstCard.abilities || [];
      const burstAb = abilities.find(a => String(a.header?.timing || '').toUpperCase() === 'BURST');
      if (!burstAb) {
        return { status: 'REJECTED', success: false, reason: 'NO_VALID_BURST_ABILITY' };
      }

      if ((op.isOptional || op.optional) && promptResolver && typeof promptResolver.choose === 'function') {
        const choice = await promptResolver.choose({
          type: 'CONFIRM_OPTIONAL',
          title: 'Activate Burst?',
          card: burstCard,
          controller
        });
        if (choice && (choice.declined || choice.confirm === false || choice.index === 1)) {
          return { status: 'DECLINED', success: false, optionalDeclined: true, reason: 'BURST_ACTIVATION_DECLINED' };
        }
      }

      // Clear burst slot before resolution to prevent duplicate activation
      p.burst = null;
      await emitAsyncEvent(events, 'BURST_ACTIVATED', { card: burstCard, player: controller, sourceCard });

      let res;
      if (context.resolver && typeof context.resolver.resolveAbility === 'function') {
        res = await context.resolver.resolveAbility(state, burstAb, { ...context, controller, sourceCard: burstCard, activeBurstCard: burstCard }, events);
      } else {
        const clauses = burstAb.clauses || [];
        const results = [];
        let hasUnsupported = false;
        let hasFailure = false;
        for (const clause of clauses) {
          const opToRun = clause.op || clause;
          const cRes = await executeOp(state, opToRun, { ...context, controller, sourceCard: burstCard, activeBurstCard: burstCard, currentClause: clause }, promptResolver, events);
          results.push(cRes);
          if (cRes && (cRes.status === 'UNSUPPORTED' || cRes.unsupported)) hasUnsupported = true;
          if (!cRes || cRes.success === false) hasFailure = true;
        }
        res = { success: !hasFailure && !hasUnsupported, hasUnsupported, hasFailure, results };
      }

      if (res.hasUnsupported || !res.success) {
        if (!p.field.some(st => st.top?.id === burstCard.id)) {
          await moveCard(state, burstCard, 'grave', controller, { cause: 'burst_failed', sourceCard }, events);
        }
        return {
          status: res.hasUnsupported ? 'UNSUPPORTED' : 'FAILED',
          success: false,
          hasUnsupported: !!res.hasUnsupported,
          hasFailure: !!res.hasFailure || !res.hasUnsupported,
          reason: res.hasUnsupported ? 'UNSUPPORTED_BURST_EFFECT' : 'BURST_RESOLUTION_FAILED',
          abilityResult: res
        };
      }

      // Non-summoned burst routes to grave with burst_resolved ONLY if still unplaced (not moved to field/hand/deck/removed)
      const curZone = findCardCurrentZone(state, burstCard.id);
      if (!curZone) {
        await moveCard(state, burstCard, 'grave', controller, { cause: 'burst_resolved', sourceCard }, events);
      }
      return { status: 'SUCCESS', success: true, card: burstCard, abilityResult: res };
    }

    case 'REPLACEMENT_EFFECT': {
      const rawText = op.rawText || context.currentClause?.rawText || context.currentClause?.cleanText || '';
      if (!op.replaces && !op.replacementZone) {
        return { status: 'UNSUPPORTED', transactionOutcome: 'UNSUPPORTED', success: false, reason: 'MISSING_REPLACEMENT_SPEC' };
      }
      const mod = {
        id: `mod_${Date.now()}_rep_${Math.random().toString(36).substr(2, 5)}`,
        type: 'REPLACEMENT_EFFECT',
        replaces: op.replaces || null,
        replacementZone: op.replacementZone || null,
        targetStackId: op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null),
        side: (op.side === 'opp' || op.side === 'opponent') ? oppSide : (op.side === 'self' || !op.side ? controller : op.side),
        filter: op.filter || null,
        rawText,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', transactionOutcome: 'COMMITTED', success: true, continuous: true, modifier: mod };
    }

    case 'MOVE_CARD': {
      const fromZone = normalizeCardZone(op.from || 'hand');
      const toZone = normalizeCardZone(op.to || 'grave');
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const moveActionCtx = { fromZone, toZone, isCost: Boolean(op.isCost), by: controller, sourceCard };
      if (isActionRestricted(state, 'CANNOT_MOVE', controller, sourceCard, moveActionCtx)) {
        return { status: 'REJECTED', success: false, movedCount: 0, cards: [], reason: 'MOVE_RESTRICTED' };
      }
      if (targetSide !== controller && isActionRestricted(state, 'CANNOT_MOVE', targetSide, null, moveActionCtx)) {
        return { status: 'REJECTED', success: false, movedCount: 0, cards: [], reason: 'MOVE_RESTRICTED' };
      }
      const p = state.players[targetSide];
      const pool = fromZone === 'deck' || fromZone === 'decktop' ? p.deck
        : (fromZone === 'grave' || fromZone === 'trash' ? p.grave
          : (fromZone === 'removed' || fromZone === 'removed_zone' ? p.removed : p.hand));
      const matching = (pool || []).filter(c => !op.filter || matchesCardFilter(c, op.filter, op));
      if (matching.length === 0) {
        return { status: 'NO_OP_BY_RULE', success: false, movedCount: 0, cards: [], reason: 'NO_LEGAL_TARGETS' };
      }
      const count = op.count === 'ANY' ? matching.length : (typeof op.count === 'number' ? op.count : 1);
      let toMove = [];
      if (promptResolver && typeof promptResolver.choose === 'function' && matching.length > count && fromZone !== 'deck' && fromZone !== 'decktop') {
        const picked = await promptResolver.choose({
          type: 'SELECT_CARDS',
          title: 'Choose card(s) to move',
          candidates: matching.map(c => ({ card: c, side: targetSide, zone: fromZone })),
          count,
          chooser: targetSide
        });
        if (Array.isArray(picked) && picked.length > 0) {
          toMove = picked.map(x => x.card || x).slice(0, count);
        } else if (picked?.selected && Array.isArray(picked.selected)) {
          toMove = picked.selected.map(x => x.card || x).slice(0, count);
        }
      } else if (!state?.matchContext || state.matchContext.canSimulate(targetSide) || matching.length <= count || fromZone === 'deck' || fromZone === 'decktop') {
        toMove = matching.slice(0, count);
      } else {
        return { status: 'UNRESOLVED', success: false, movedCount: 0, cards: [], reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
      }
      const movedCards = [];
      let blockedByProtection = false;
      for (const c of toMove) {
        if (!op.isCost && isActionRestricted(state, 'CANNOT_BE_MOVED', targetSide, c, { ...moveActionCtx, cause: 'effect' })) {
          blockedByProtection = true;
          continue;
        }
        if (toZone === 'underneath' && (sourceStack || op.targetStackId)) {
          const st = sourceStack || (p.field || []).find(s => (s.id || s.stackId) === op.targetStackId);
          if (!st) continue;
          if (fromZone === 'deck' || fromZone === 'decktop') p.deck = p.deck.filter(x => x.id !== c.id);
          else if (fromZone === 'hand') p.hand = p.hand.filter(x => x.id !== c.id);
          else if (fromZone === 'grave' || fromZone === 'trash') p.grave = p.grave.filter(x => x.id !== c.id);
          st.under = st.under || [];
          st.under.push(c);
          movedCards.push(c);
          await emitAsyncEvent(events, 'CARD_MOVED', { card: c, fromZone, toZone: 'underneath', player: targetSide, cause: op.isCost ? 'cost' : 'effect', sourceCard });
        } else {
          const ok = await moveCard(state, c, toZone, targetSide, { cause: op.isCost ? 'cost' : 'effect', sourceCard }, events);
          if (ok) movedCards.push(c);
        }
      }
      return {
        status: movedCards.length > 0 ? 'SUCCESS' : (blockedByProtection ? 'REJECTED' : 'NO_OP_BY_RULE'),
        success: movedCards.length > 0,
        movedCount: movedCards.length,
        cards: movedCards,
        ...(movedCards.length === 0 && blockedByProtection ? { reason: 'MOVE_PROTECTED' } : {})
      };
    }

    case 'FORMAT_MARKER': {
      const marker = op.marker || op.format || 'LEGACY';
      if (sourceCard) {
        sourceCard.formatMarkers = Array.isArray(sourceCard.formatMarkers) ? [...new Set([...sourceCard.formatMarkers, marker])] : [marker];
      }
      return { status: 'SUCCESS', success: true, marker };
    }

    case 'UNPREVENTABLE': {
      const scope = String(op.scope || 'EFFECT').toUpperCase();
      const mod = {
        id: `mod_${Date.now()}_unprev_${Math.random().toString(36).substr(2, 5)}`,
        type: 'UNPREVENTABLE',
        scope,
        side: controller,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      context.unpreventable = { scope, sourceCardId: sourceCard ? sourceCard.id : null };
      return { status: 'SUCCESS', success: true, scope, modifier: mod };
    }

    case 'PREVENT_WHEN_SUMMONED': {
      context.preventWhenSummoned = true;
      const mod = {
        id: `mod_${Date.now()}_prev_ws_${Math.random().toString(36).substr(2, 5)}`,
        type: 'SET_RESTRICTION',
        restriction: 'PREVENT_WHEN_SUMMONED',
        side: op.side === 'opp' ? oppSide : controller,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, modifier: mod };
    }

    case 'CONTINUE_BATTLE': {
      if (!state.battle && !state.combat) {
        return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_ACTIVE_BATTLE' };
      }
      if (state.battle) {
        state.battle.continued = true;
      }
      if (state.combat) {
        state.combat.continued = true;
      }
      return { status: 'SUCCESS', success: true, continued: true };
    }

    case 'COUNT_OPERATION': {
      const action = String(op.action || '').toUpperCase();
      if (action === 'SEND_LIFE_TO_VOID' || action === 'SEND_LIFE_TO_RESERVE') {
        const targetSide = op.side === 'self' ? controller : oppSide;
        const dest = action === 'SEND_LIFE_TO_VOID' || op.to === 'void' ? 'void' : 'reserve';
        const cnt = typeof op.count === 'number' ? op.count : 1;
        let moved = 0;
        for (let i = 0; i < cnt; i++) {
          const ok = await moveCore(state, 1, { side: targetSide, zone: 'life' }, { side: targetSide, zone: dest }, { cause: 'effect', sourceCard }, events);
          if (!ok) break;
          moved++;
        }
        return { status: moved > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: moved > 0, count: moved, destination: dest };
      }
      if (action === 'ADD_COUNTER') {
        const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
        const tp = state.players[targetSide];
        const delta = Math.max(1, Number(op.count || 1));
        tp.counters = (tp.counters || 0) + delta;
        await emitAsyncEvent(events, 'COUNTER_ADDED', { player: targetSide, count: delta, counters: tp.counters, sourceCard });
        return { status: 'SUCCESS', success: true, count: delta, currentCounters: tp.counters };
      }
      if (action === 'SUBTRACT_COUNTER') {
        const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
        const tp = state.players[targetSide];
        const delta = Math.max(1, Number(op.count || 1));
        const avail = tp.counters || 0;
        if (avail < delta) {
          if (op.isCost) {
            return { status: 'REJECTED', success: false, count: 0, reason: 'INSUFFICIENT_COUNTERS' };
          }
          tp.counters = 0;
          return { status: avail > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: avail > 0, count: avail, currentCounters: 0 };
        }
        tp.counters = avail - delta;
        await emitAsyncEvent(events, 'COUNTER_SUBTRACTED', { player: targetSide, count: delta, counters: tp.counters, sourceCard });
        return { status: 'SUCCESS', success: true, count: delta, currentCounters: tp.counters };
      }
      if (action === 'COUNT_BREAK_LIMIT') {
        if (!Array.isArray(state.modifiers)) state.modifiers = [];
        const mod = { id: makeModId('countbreak'), type: 'COUNT_BREAK_LIMIT', rule: op.rule || 'ONCE_PER_GAME', side: controller, sourceCardId: sourceCard?.id || null };
        state.modifiers.push(mod);
        return { status: 'SUCCESS', success: true, modifier: mod };
      }
      if (action === 'REPEAT_PER_COUNTER') {
        const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
        const count = state.players[targetSide]?.counters || 0;
        context.lastCount = count;
        context.repeatCount = count;
        return { status: 'SUCCESS', success: true, count };
      }
      const obj = String(op.object || op.countType || op.targetType || '').toUpperCase();
      if (!obj && !op.zone && !op.property) {
        return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_IR_PARAMETERS' };
      }
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      let count = 0;
      if (obj === 'LIFE') count = p.life || 0;
      else if (obj === 'HAND') count = (p.hand || []).length;
      else if (obj === 'GRAVE' || obj === 'TRASH') count = (p.grave || []).filter(c => !op.filter || matchesCardFilter(c, op.filter, op)).length;
      else if (obj === 'COUNTERS') count = p.counters || 0;
      else if (obj === 'CORES') count = (p.reserve?.normal || 0) + (p.reserve?.soul ? 1 : 0);
      else if (obj === 'NEXUS' || obj === 'NEXUSES') count = (p.nexus || []).length + (p.field || []).filter(st => (st.top?.type || '').includes('Nexus')).length;
      else {
        const zone = op.zone || 'field';
        if (zone === 'field') {
          count = (p.field || []).filter(st => !op.filter || matchesCardFilter(st.top, op.filter, op)).length;
        } else {
          const arr = p[zone] || [];
          count = Array.isArray(arr) ? arr.filter(c => !op.filter || matchesCardFilter(c, op.filter, op)).length : 0;
        }
      }
      context.lastCount = count;
      return { status: 'SUCCESS', success: true, count };
    }

    case 'DECK_OR_HAND_ACTION':
    case 'DECK_ACTION': {
      const action = String(op.action || '').toUpperCase();
      if (!action && !op.from && !op.to && !op.destination && !op.filter && op.count === undefined) {
        return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_IR_PARAMETERS' };
      }
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const count = typeof op.count === 'number' ? op.count : 1;

      if (action === 'PUT_SELF_IN_REMOVED') {
        if (!sourceCard) return { status: 'NO_OP_BY_RULE', success: false, count: 0, cards: [], reason: 'NO_SOURCE_CARD' };
        sourceCard.faceDown = Boolean(op.facedown);
        sourceCard.faceUp = !op.facedown;
        const ok = await moveCard(state, sourceCard, 'removed', targetSide, { cause: 'effect', by: controller, sourceCard }, events);
        return { status: ok ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(ok), count: ok ? 1 : 0, cards: ok ? [sourceCard] : [] };
      }

      if (action === 'MILL') {
        const milled = [];
        for (let i = 0; i < count && (p.deck || []).length > 0; i++) {
          const topCard = p.deck[0];
          const ok = await moveCard(state, topCard, 'grave', targetSide, { cause: 'mill', by: controller, sourceCard }, events);
          if (ok) milled.push(topCard);
          else break;
        }
        if (milled.length > 0) {
          await emitAsyncEvent(events, 'DECK_MILLED', { player: targetSide, count: milled.length, cards: milled, sourceCard });
        }
        return { status: milled.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: milled.length > 0, count: milled.length, cards: milled };
      }

      if (action === 'DISCARD_REMAINING' || action === 'DISCARD_PREVIOUS') {
        const pool = context.revealedCards?.length ? context.revealedCards : (p.revealed || []);
        const limit = action === 'DISCARD_REMAINING' ? pool.length : Math.min(count, pool.length);
        const discarded = [];
        for (let i = 0; i < limit && pool.length > 0; i++) {
          const card = pool.shift();
          p.grave = p.grave || [];
          if (!p.grave.some(g => g.id === card.id)) p.grave.push(card);
          discarded.push(card);
          await emitAsyncEvent(events, 'CARD_MOVED', { card, fromZone: 'revealed', toZone: 'grave', player: targetSide, cause: 'discard', sourceCard });
        }
        if (p.revealed) p.revealed = p.revealed.filter(c => !discarded.includes(c));
        if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => !discarded.includes(c));
        return { status: discarded.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: discarded.length > 0, count: discarded.length, cards: discarded };
      }

      if (action === 'DISCARD_ZONE') {
        const zKey = normalizeZoneKey(op.from || 'removed');
        const zoneArr = Array.isArray(p[zKey]) ? p[zKey] : [];
        const filterNoFace = op.filter && 'faceUp' in op.filter ? { ...op.filter, faceUp: undefined } : op.filter;
        const matching = zoneArr.filter(c => {
          if (op.filter?.faceUp && (c.faceDown || c.facedown)) return false;
          return !filterNoFace || matchesCardFilter(c, filterNoFace, op);
        });
        if (matching.length === 0) return { status: 'NO_OP_BY_RULE', success: false, count: 0, cards: [] };
        let chosen = [];
        if (op.count === 'ALL' || op.all) {
          chosen = matching;
        } else if (promptResolver && typeof promptResolver.choose === 'function' && matching.length > count) {
          const picked = await promptResolver.choose({
            type: 'SELECT_CARDS',
            title: 'Choose cards to discard',
            candidates: matching.map(c => ({ card: c, side: targetSide, zone: zKey })),
            count,
            chooser: targetSide
          });
          if (Array.isArray(picked) && picked.length > 0) chosen = picked.map(x => x.card || x).slice(0, count);
          else if (picked?.selected && Array.isArray(picked.selected)) chosen = picked.selected.map(x => x.card || x).slice(0, count);
        } else if (!state?.matchContext || state.matchContext.canSimulate(targetSide) || matching.length <= count) {
          chosen = matching.slice(0, count);
        } else {
          return { status: 'UNRESOLVED', success: false, count: 0, cards: [], reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
        }
        const moved = [];
        for (const c of chosen) {
          const ok = await moveCard(state, c, 'grave', targetSide, { cause: 'discard', by: controller, sourceCard }, events);
          if (ok) moved.push(c);
        }
        return { status: moved.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: moved.length > 0, count: moved.length, cards: moved };
      }

      if (action === 'SHUFFLE') {
        const deck = p.deck || [];
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        await emitAsyncEvent(events, 'DECK_SHUFFLED', { player: targetSide, sourceCard });
        return { status: 'SUCCESS', success: true, count: deck.length };
      }

      if (action === 'DECK_LIMIT') {
        if (!Array.isArray(state.modifiers)) state.modifiers = [];
        const mod = { id: makeModId('decklim'), type: 'DECK_LIMIT', maxCopies: op.maxCopies, rule: op.rule || 'CUSTOM_COPY_LIMIT', cardNumber: sourceCard?.cardNumber || null, side: targetSide };
        state.modifiers.push(mod);
        return { status: 'SUCCESS', success: true, maxCopies: op.maxCopies, modifier: mod };
      }

      if (action === 'SWAP_ZONE') {
        const handCard = (p.hand || [])[0] || null;
        const remCard = (p.removed || []).find(c => !op.filter || matchesCardFilter(c, op.filter, op)) || null;
        if (!handCard || !remCard) return { status: 'NO_OP_BY_RULE', success: false, count: 0, cards: [] };
        const ok1 = await moveCard(state, handCard, 'removed', targetSide, { cause: 'swap', by: controller, sourceCard }, events);
        const ok2 = ok1 ? await moveCard(state, remCard, 'hand', targetSide, { cause: 'swap', by: controller, sourceCard }, events) : false;
        return { status: (ok1 && ok2) ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(ok1 && ok2), count: (ok1 && ok2) ? 2 : 0, cards: (ok1 && ok2) ? [handCard, remCard] : [] };
      }

      if (action === 'REPLACE_LEAVE_FIELD_TO_REMOVED' || action === 'REPLACE_HAND_DISCARD_TO_REMOVED') {
        if (!Array.isArray(state.modifiers)) state.modifiers = [];
        const mod = {
          id: makeModId('repzone'),
          type: 'REPLACEMENT_EFFECT',
          replaces: op.replaces || (action === 'REPLACE_LEAVE_FIELD_TO_REMOVED' ? 'LEAVE_FIELD' : 'DISCARD'),
          replacementZone: 'removed',
          destination: 'removed',
          fromZone: op.from || (action === 'REPLACE_LEAVE_FIELD_TO_REMOVED' ? 'field' : 'hand'),
          targetStackId: sourceStack?.id || null,
          targetCardId: sourceCard?.id || null,
          side: targetSide,
          duration: op.duration || 'WHILE_IN_ZONE',
          sourceCardId: sourceCard?.id || null
        };
        state.modifiers.push(mod);
        return { status: 'SUCCESS', success: true, modifier: mod };
      }

      if (action === 'DRAW') {
        const drawn = [];
        for (let i = 0; i < count && p.deck.length > 0; i++) {
          const topCard = p.deck[0];
          const ok = await moveCard(state, topCard, 'hand', targetSide, { cause: 'draw', sourceCard }, events);
          if (ok) {
            drawn.push(topCard);
            await emitAsyncEvent(events, 'CARD_DRAWN', { player: targetSide, card: topCard, cause: 'effect', sourceCard });
          }
        }
        return { status: drawn.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: drawn.length > 0, drawnCount: drawn.length, cards: drawn };
      }

      if (action === 'REVEAL' || op.to === 'revealed') {
        const revealed = [];
        for (let i = 0; i < count && p.deck.length > 0; i++) {
          const card = p.deck.shift();
          p.revealed = p.revealed || [];
          p.revealed.push(card);
          revealed.push(card);
        }
        context.revealedCards = [...(context.revealedCards || []), ...revealed];
        return { status: revealed.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: revealed.length > 0, count: revealed.length, cards: revealed };
      }

      if (action === 'LOOK') {
        const deck = p.deck || [];
        const looked = deck.slice(0, count);
        context.lookedCards = looked;
        return { status: looked.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: looked.length > 0, count: looked.length, cards: looked };
      }

      if (action === 'RETURN_TOP' || op.to === 'deck_top' || op.destination === 'DECK_TOP') {
        const pool = context.revealedCards?.length ? context.revealedCards : (p.revealed || []);
        const moved = [];
        while (pool.length > 0 && moved.length < (op.all ? Infinity : count)) {
          const card = pool.shift();
          p.deck.unshift(card);
          moved.push(card);
        }
        if (p.revealed) p.revealed = p.revealed.filter(c => !moved.includes(c));
        if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => !moved.includes(c));
        return { status: moved.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: moved.length > 0, count: moved.length, cards: moved };
      }

      if (action === 'RETURN_BOTTOM' || op.to === 'deck_bottom' || op.destination === 'DECK_BOTTOM') {
        const pool = context.revealedCards?.length ? context.revealedCards : (p.revealed || []);
        const moved = [];
        while (pool.length > 0 && moved.length < (op.all ? Infinity : count)) {
          const card = pool.shift();
          p.deck.push(card);
          moved.push(card);
        }
        if (p.revealed) p.revealed = p.revealed.filter(c => !moved.includes(c));
        if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => !moved.includes(c));
        return { status: moved.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: moved.length > 0, count: moved.length, cards: moved };
      }

      const rawFrom = String(op.from || 'hand').toLowerCase();
      const fromZone = rawFrom === 'decktop' ? 'deck' : (rawFrom === 'trash' ? 'grave' : (rawFrom === 'removed_zone' ? 'removed' : rawFrom));
      const rawTo = String(op.to || op.destination || 'grave').toLowerCase();
      const toZone = rawTo === 'trash' ? 'grave' : (rawTo === 'removed_zone' ? 'removed' : rawTo);
      const sourcePool = fromZone === 'revealed'
        ? (context.revealedCards?.length ? context.revealedCards : (p.revealed || []))
        : (Array.isArray(p[fromZone]) ? p[fromZone] : []);
      const pool = sourcePool.filter(c => !op.filter || matchesCardFilter(c, op.filter, op));
      if (pool.length === 0) return { status: 'NO_OP_BY_RULE', success: false, count: 0, cards: [] };
      const limitCount = (op.count === 'ANY' || op.count === 'ALL' || op.all) ? pool.length : count;
      const chosen = pool.slice(0, limitCount);
      const moved = [];
      for (const c of chosen) {
        if (toZone === 'removed' && op.facedown !== undefined) {
          c.faceDown = Boolean(op.facedown);
          c.faceUp = !op.facedown;
        }
        if (fromZone === 'revealed') {
          if (p.revealed) p.revealed = p.revealed.filter(x => x.id !== c.id);
          if (context.revealedCards) context.revealedCards = context.revealedCards.filter(x => x.id !== c.id);
          p[toZone] = p[toZone] || [];
          if (!p[toZone].some(x => x.id === c.id)) p[toZone].push(c);
          await emitAsyncEvent(events, 'CARD_MOVED', { card: c, fromZone: 'revealed', toZone, player: targetSide, cause: op.isCost ? 'cost' : 'effect', sourceCard });
          moved.push(c);
        } else {
          const ok = await moveCard(state, c, toZone, targetSide, { cause: op.isCost ? 'cost' : 'effect', by: controller, sourceCard }, events);
          if (ok) moved.push(c);
        }
      }
      return { status: moved.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: moved.length > 0, count: moved.length, cards: moved };
    }

    case 'ADVENT_PAY': {
      const p = state.players[controller];
      if (!sourceCard) return { status: 'REJECTED', success: false, reason: 'NO_SOURCE_CARD' };
      const res = await resolveTargets(
        state,
        { side: 'self', types: ['Spirit', 'Nexus'], ...(op.target && typeof op.target === 'object' ? op.target : {}), ...(op.filter ? { filter: op.filter } : {}), count: 1 },
        context,
        promptResolver,
        { promptType: 'SELECT_ADVENT_TARGET', title: 'Choose target to Advent onto' }
      );
      if (res.status === 'NO_OP_BY_RULE') return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_LEGAL_TARGETS' };
      if (!res.success || !res.targets[0]?.stack) return { status: res.status || 'REJECTED', success: false, reason: res.reason || 'NO_ADVENT_TARGET' };

      const targetStack = res.targets[0].stack;
      const payCount = Math.max(0, Number(op.costCores ?? 1));
      if (payCount > 0) {
        const stackCores = (targetStack.cores?.normal || 0) + (targetStack.cores?.soul ? 1 : 0);
        if (stackCores < payCount) return { status: 'REJECTED', success: false, reason: 'INSUFFICIENT_TARGET_CORES' };
        const payNormal = Math.min(targetStack.cores?.normal || 0, payCount);
        if (payNormal > 0) {
          targetStack.cores.normal -= payNormal;
          p.trash.normal += payNormal;
        }
        const rem = payCount - payNormal;
        if (rem > 0 && targetStack.cores?.soul > 0) {
          targetStack.cores.soul = 0;
          p.trash.soul += 1;
        }
      }

      targetStack.under.unshift(targetStack.top);
      targetStack.top = sourceCard;
      p.hand = p.hand.filter(c => c.id !== sourceCard.id);
      p.removed = p.removed.filter(c => c.id !== sourceCard.id);

      if (events) {
        await events.emit({ type: 'ADVENTS', card: sourceCard, stack: targetStack, player: controller, sourceCard });
      }
      return { status: 'SUCCESS', success: true, stack: targetStack, card: sourceCard };
    }

    case 'CHANGE': {
      const p = state.players[controller];
      if (!sourceCard) return { status: 'REJECTED', success: false, reason: 'NO_SOURCE_CARD' };
      const filter = { ...(op.filter || {}), ...(op.maxCost !== undefined ? { costLte: op.maxCost } : {}), ...(op.family ? { family: op.family } : {}) };
      const res = await resolveTargets(
        state,
        { side: 'self', types: ['Spirit'], filter, count: 1 },
        context,
        promptResolver,
        { promptType: 'SELECT_CHANGE_TARGET', title: 'Choose Spirit to replace with [Change]' }
      );
      if (res.status === 'NO_OP_BY_RULE') return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_LEGAL_TARGETS' };
      if (!res.success || !res.targets[0]?.stack) return { status: res.status || 'REJECTED', success: false, reason: res.reason || 'NO_CHANGE_TARGET' };

      const targetStack = res.targets[0].stack;
      const oldTop = targetStack.top;
      targetStack.top = sourceCard;
      targetStack.state = 'REFRESHED';
      p.hand = p.hand.filter(c => c.id !== sourceCard.id);
      p.hand.push(oldTop);

      if (events) {
        await events.emit({ type: 'CHANGED', newCard: sourceCard, returnedCard: oldTop, stack: targetStack, player: controller });
      }
      return { status: 'SUCCESS', success: true, stack: targetStack, replacedCard: oldTop };
    }

    case 'ACTIVATE_FLASH':
    case 'ACTIVATE_CARD_EFFECT': {
      const targetCard = op.card || sourceCard;
      if (!targetCard?.compiledIr?.abilities) {
        return { status: 'UNSUPPORTED', success: false, reason: 'NO_CARD_ABILITIES' };
      }
      const wantTiming = op.op === 'ACTIVATE_FLASH' ? 'FLASH' : String(op.timing || 'MAIN').toUpperCase();
      const ab = targetCard.compiledIr.abilities.find(a => String(a.header?.timing || '').toUpperCase() === wantTiming);
      if (!ab) {
        return { status: 'NO_OP_BY_RULE', success: false, reason: 'TIMING_ABILITY_NOT_FOUND' };
      }
      if (!context.resolver || typeof context.resolver.resolveAbility !== 'function') {
        return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_RESOLVER' };
      }
      const res = await context.resolver.resolveAbility(state, ab, { ...context, controller, sourceCard: targetCard }, events);
      return { status: res.success ? 'SUCCESS' : 'FAILED', ...res };
    }

    case 'CAST_MAGIC_FREE': {
      const p = state.players[controller];
      const candidates = (p.hand || []).filter(c => c.type === 'Magic' && (!op.filter || matchesCardFilter(c, op.filter, op)));
      if (candidates.length === 0) return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_MAGIC_IN_HAND' };
      let chosenCard = null;
      if (promptResolver && typeof promptResolver.choose === 'function') {
        const pick = await promptResolver.choose({ type: 'SELECT_CARDS', title: 'Choose Magic card to cast without paying cost', candidates: candidates.map(c => ({ card: c })), count: 1, chooser: controller, optional: Boolean(op.optional || op.isOptional) });
        if (!pick || !pick[0] || (Array.isArray(pick) && pick.length === 0) || pick.declined) {
          if (op.optional || op.isOptional) {
            return { status: 'SKIPPED', success: true, count: 0, reason: 'OPTIONAL_SKIPPED' };
          }
          return { status: 'REJECTED', success: false, reason: 'NO_SELECTION' };
        }
        chosenCard = pick[0].card || pick[0];
        if (!candidates.some(c => c.id === chosenCard?.id)) return { status: 'REJECTED', success: false, reason: 'INVALID_TARGET_SELECTION' };
      }
      if (!chosenCard) chosenCard = (!state?.matchContext || state.matchContext.canSimulate(controller)) ? candidates[0] : null;
      if (!chosenCard) return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_MAGIC_IN_HAND' };
      if (isActionRestricted(state, 'CANNOT_USE_MAGIC', controller, chosenCard, { free: true, fromZone: 'hand' })) {
        return { status: 'REJECTED', success: false, reason: 'MAGIC_RESTRICTED' };
      }
      const ab = chosenCard.compiledIr?.abilities?.find(a => ['FLASH', 'MAIN'].includes(String(a.header?.timing || '').toUpperCase())) || chosenCard.compiledIr?.abilities?.[0];
      if (!ab || !context.resolver) return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_ABILITY_OR_RESOLVER' };
      const res = await context.resolver.resolveAbility(state, ab, { ...context, controller, sourceCard: chosenCard, free: true }, events);
      await moveCard(state, chosenCard, 'grave', controller, { cause: 'cast_magic_free', sourceCard }, events);
      return { status: res.success ? 'SUCCESS' : 'FAILED', success: Boolean(res.success), card: chosenCard, abilityResult: res };
    }

    case 'MODIFY_EFFECT':
    case 'MODIFY_EFFECT_VALUE': {
      if (!op.param && op.delta === undefined && op.value === undefined && op.newCount === undefined && op.to === undefined && !op.targetEffect) {
        return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_IR_PARAMETERS' };
      }
      const mod = {
        id: `mod_${Date.now()}_effmod_${Math.random().toString(36).substr(2, 5)}`,
        type: 'EFFECT_MODIFIER',
        side: controller,
        param: op.param || 'count',
        delta: op.delta ?? 0,
        value: op.value ?? op.newCount ?? op.to ?? null,
        targetEffect: op.targetEffect || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, modifier: mod };
    }

    case 'SET_BURST': {
      const p = state.players[controller];
      const card = op.card || sourceCard;
      if (isActionRestricted(state, 'CANNOT_SET_BURST', controller, card, { actionType: 'SET_BURST' })) {
        return { status: 'REJECTED', success: false, reason: 'BURST_SET_RESTRICTED' };
      }
      if (!card) return { status: 'REJECTED', success: false, reason: 'NO_SOURCE_CARD' };
      const moved = await moveCard(state, card, 'burst', controller, { cause: 'set_burst', sourceCard }, events);
      if (!moved) return { status: 'REJECTED', success: false, reason: 'SET_BURST_FAILED' };
      p.burstSetThisTurn = true;
      return { status: 'SUCCESS', success: true, card };
    }

    case 'SET_MIRAGE': {
      const p = state.players[controller];
      const card = op.card || sourceCard;
      if (!card) return { status: 'REJECTED', success: false, reason: 'NO_SOURCE_CARD' };
      const moved = await moveCard(state, card, 'mirage', controller, { cause: 'set_mirage', sourceCard }, events);
      if (!moved) return { status: 'REJECTED', success: false, reason: 'SET_MIRAGE_FAILED' };
      return { status: 'SUCCESS', success: true, card };
    }

    case 'TOKEN_DEPLOYMENT': {
      const tokenTitle = op.name || op.token || op.tokenName;
      if (!tokenTitle && op.bp === undefined) {
        return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_TOKEN_SPEC' };
      }
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const deployCount = typeof op.count === 'number' && op.count > 0 ? op.count : 1;
      const deployed = [];
      for (let ti = 0; ti < deployCount; ti++) {
        const tokenCard = {
          id: `token_${Date.now()}_${ti}_${Math.random().toString(36).substr(2, 5)}`,
          cardNumber: op.cardNumber || 'TOKEN',
          name: tokenTitle || 'Token',
          type: 'Spirit',
          cost: op.cost ?? 0,
          color: op.color || 'Colorless',
          colors: [op.color || 'Colorless'],
          families: op.families || ['Token'],
          symbols: op.symbols || [],
          levels: { 1: { cost: 0, bp: op.bp ?? 1000 } },
          owner: targetSide,
          isToken: true
        };
        const st = createFieldStack(tokenCard, { normal: op.cores ?? 0, soul: 0 });
        st.owner = targetSide;
        p.field.push(st);
        deployed.push({ card: tokenCard, stack: st });
        if (events) {
          await events.emit({ type: 'SUMMONED', card: tokenCard, stack: st, player: targetSide, cause: 'token_deployment', sourceCard });
          await events.emit({ type: 'TOKEN_DEPLOYED', card: tokenCard, stack: st, player: targetSide, sourceCard });
        }
      }
      return { status: 'SUCCESS', success: true, count: deployed.length, card: deployed[0]?.card, stack: deployed[0]?.stack, cards: deployed.map(d => d.card) };
    }

    case 'SEND_TO_VOID': {
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const count = typeof op.count === 'number' ? op.count : 1;
      const fromZone = op.from || 'reserve';
      const moved = await moveCore(state, count, { zone: fromZone, side: targetSide }, { zone: 'void' }, { cause: 'effect', by: controller, sourceCard }, events);
      return { status: moved ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(moved), count: moved ? count : 0 };
    }

    case 'GAIN_FAMILY': {
      const fams = Array.isArray(op.families) ? op.families : (op.family ? [op.family] : []);
      if (fams.length === 0) return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_FAMILY' };
      const mod = {
        id: `mod_${Date.now()}_fam_${Math.random().toString(36).substr(2, 5)}`,
        type: 'GRANT_FAMILY',
        side: controller,
        targetStackId: sourceStack ? (sourceStack.id || sourceStack.stackId) : null,
        families: fams,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, modifier: mod };
    }

    case 'DECREASE_BP_EFFECT': {
      const amount = Math.abs(Number(op.amount || 1000));
      const res = await resolveTargets(state, op.target || { side: 'opp', types: ['Spirit'] }, context, promptResolver, { defaultSide: 'opp', defaultTypes: ['Spirit'] });
      if (res.status === 'NO_OP_BY_RULE') return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_LEGAL_TARGETS' };
      if (!res.success) return { status: res.status || 'REJECTED', success: false, reason: res.reason };
      for (const item of res.targets || []) {
        const stackId = item.stack?.id || item.id;
        if (stackId) {
          state.modifiers.push({ id: `mod_${Date.now()}_bpdeb_${Math.random().toString(36).substr(2, 5)}`, type: 'BP_DEBUFF', targetStackId: stackId, side: item.side || oppSide, amount, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null });
        }
      }
      return { status: 'SUCCESS', success: true, amount };
    }

    case 'CORE_CHARGE': {
      const p = state.players[controller];
      const count = typeof op.count === 'number' ? op.count : 1;
      const targetStack = sourceStack || p.field.find(s => s.top?.id === sourceCard?.id) || null;
      if (!targetStack) return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_TARGET_STACK' };
      const moved = await moveCore(state, count, { zone: 'void' }, { zone: 'field', side: controller, stackId: targetStack.id }, { cause: 'core_charge', by: controller, sourceCard, coreCharge: true }, events);
      return { status: moved ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(moved), count: moved ? count : 0 };
    }

    // ==================== GROUP A: ACTIVATION & TRIGGERS ====================
    case 'ACTIVATE_EFFECT_ACTION': {
      const kw = op.keyword || op.action || op.effectName || op.timing || '';
      const targetRes = op.target
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const targetStack = targetRes.targets?.[0]?.stack || sourceStack || null;
      const targetCard = targetStack?.top || sourceCard || null;
      if (!targetCard) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_TARGET_CARD' };
      const tgtSide = targetStack?.owner || controller;
      if (isActionRestricted(state, 'CANNOT_ACTIVATE_ABILITY', tgtSide, targetStack || targetCard, { keyword: kw, timingWindow: op.timing || state.step })) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'ABILITY_ACTIVATION_RESTRICTED' };
      }
      if (!state._activatedActionKeys) state._activatedActionKeys = {};
      const optKey = `${targetCard.id}:${kw}:T${state.turnNumber || 1}`;
      if (op.oncePerTurn && state._activatedActionKeys[optKey]) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'ONCE_PER_TURN_EXHAUSTED' };
      }
      let resolvedCount = 0;
      const abs = targetCard.compiledIr?.abilities || [];
      state._activatedActionKeys[optKey] = true;
      if (ctx.resolver && abs.length > 0) {
        const kwLower = String(kw).toLowerCase();
        for (const ab of abs) {
          if (ab === ctx.sourceAbility || (ab.physicalId && ab.physicalId === ctx.sourceAbility?.physicalId)) continue;
          const body = String(ab.header?.cleanBody || ab.rawText || '').toLowerCase();
          const timingMatches = op.timing && String(ab.header?.timing || '').toUpperCase() === String(op.timing).toUpperCase();
          const kwMatches = kwLower && (body.includes(`[${kwLower}]`) || body.includes(kwLower));
          if (timingMatches || kwMatches) {
            const subCtx = { ...ctx, controller: tgtSide, sourceCard: targetCard, sourceStack: targetStack || null, checkActivationRestriction: !op.ignoreCondition };
            const r = await ctx.resolver.resolveAbility(state, ab, subCtx, events);
            if (r?.success) resolvedCount++;
          }
        }
      }
      if (events) {
        await events.emit({ type: 'EFFECT_ACTIVATED', keyword: kw, card: targetCard, stack: targetStack, player: tgtSide, resolvedCount });
      }
      return { status: 'SUCCESS', success: true, applied: true, keyword: kw, resolvedCount, targetCardId: targetCard.id };
    }

    case 'ACTIVATE_EFFECT_SPECIAL': {
      const p = state.players[controller];
      let repeats = 1;
      if (op.per === 'counters') {
        const threshold = Number(op.threshold || 1);
        repeats = Math.floor((p.counters || 0) / Math.max(1, threshold));
      } else if (typeof op.multiplier === 'number') {
        repeats = op.multiplier;
      } else if (typeof op.count === 'number') {
        repeats = op.count;
      }
      if (typeof op.maxRepeats === 'number') repeats = Math.min(repeats, op.maxRepeats);
      repeats = Math.max(0, repeats);
      ctx.repeatMultiplier = repeats;
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('spec_act'), type: 'ACTIVATE_EFFECT_SPECIAL', per: op.per || op.mode || 'condition', repeats, side: controller, duration: op.duration || 'THIS_EFFECT', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'SPECIAL_ACTIVATION_REGISTERED', repeats, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, repeats, modifier: mod };
    }

    case 'ACTIVATE_TRIGGER': {
      const trig = String(op.trigger || op.timing || op.effectType || '').toUpperCase();
      const targetRes = op.target
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const tgt = targetRes.targets?.[0];
      const tgtCard = tgt?.stack?.top || tgt?.card || sourceCard;
      const tgtStack = tgt?.stack || sourceStack || null;
      if (!tgtCard) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_LEGAL_TARGETS' };
      const tgtSide = tgt?.side || tgtStack?.owner || controller;
      if (!ctx._activatedTriggers) ctx._activatedTriggers = new Set();
      const cycleKey = `${tgtCard.id}:${trig}`;
      if (ctx._activatedTriggers.has(cycleKey)) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'TRIGGER_CYCLE_PREVENTED' };
      }
      ctx._activatedTriggers.add(cycleKey);
      let triggeredCount = 0;
      const abs = (tgtCard.compiledIr?.abilities || []).filter(ab => String(ab.header?.timing || '').toUpperCase() === trig);
      if (ctx.resolver && abs.length > 0) {
        for (const ab of abs) {
          const cloned = cloneIrWithoutMutation(ab);
          const res = await ctx.resolver.resolveAbility(state, cloned, { ...ctx, controller: tgtSide, sourceCard: tgtCard, sourceStack: tgtStack, _activatedTriggers: ctx._activatedTriggers }, events);
          if (res?.success) triggeredCount++;
        }
      }
      if (events) await events.emit({ type: 'TRIGGER_ACTIVATED', trigger: trig, card: tgtCard, player: tgtSide, triggeredCount });
      return { status: 'SUCCESS', success: true, applied: true, trigger: trig, targetCardId: tgtCard.id, triggeredCount };
    }

    case 'TRIGGERED_WATCHER': {
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const watchEvent = op.watchEvent || op.event || op.trigger || op.action || op.cardType;
      const dupKey = `${sourceCard?.id || 'global'}:${watchEvent}:${controller}`;
      const existing = state.watchers.find(w => w.dupKey === dupKey);
      if (existing) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'DUPLICATE_WATCHER', watcher: existing };
      }
      const watcher = { id: makeModId('watch'), dupKey, type: 'TRIGGERED_WATCHER', watchEvent, filter: op.filter || null, effect: op.effect || null, side: op.side || controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.watchers.push(watcher);
      if (events) await events.emit({ type: 'WATCHER_REGISTERED', watcher, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, watcher };
    }

    case 'TRIGGER_CONDITION': {
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const reg = { id: makeModId('trigcond'), type: 'TRIGGER_CONDITION', event: op.event || op.trigger || op.timing, condition: op.condition || null, location: op.location || null, side: op.side || controller, sourceCardId: sourceCard?.id || null };
      state.watchers.push(reg);
      if (events) await events.emit({ type: 'TRIGGER_CONDITION_REGISTERED', registration: reg, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, registration: reg };
    }

    case 'TRIGGER_COUNTER': {
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const counter = { id: makeModId('countertrig'), type: 'TRIGGER_COUNTER', counterTiming: op.counterTiming || op.when || op.trigger, zone: op.zone || 'hand', side: op.side || controller, sourceCardId: sourceCard?.id || null, effect: op.effect || null };
      state.watchers.push(counter);
      if (events) await events.emit({ type: 'COUNTER_TRIGGER_REGISTERED', counter, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, counter };
    }

    case 'CROSS_TRIGGER': {
      const p = state.players[controller];
      const opp = state.players[oppSide];
      const lifeThresh = op.lifeThreshold !== undefined ? Number(op.lifeThreshold) : 3;
      if ((p.life ?? 5) > lifeThresh && !op.force) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'LIFE_THRESHOLD_NOT_MET' };
      }
      if (!opp.deck || opp.deck.length === 0) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'OPPONENT_DECK_EMPTY' };
      }
      const checkedCard = opp.deck[0];
      await moveCard(state, checkedCard, 'grave', oppSide, { cause: 'cross_ultimate_trigger', sourceCard }, events);
      const srcCost = Number(sourceCard?.cost ?? 0);
      const chkCost = Number(checkedCard?.cost ?? 0);
      const hit = srcCost > chkCost;
      if (events) await events.emit({ type: 'CROSS_ULTIMATE_TRIGGER', checkedCard, hit, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, hit, checkedCard };
    }

    case 'BRAVE_EFFECT_ACTIVATION': {
      const p = state.players[controller];
      const bravedStack = sourceStack || p.field.find(st => (st.braves || []).length > 0) || null;
      if (!bravedStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_BRAVED_STACK' };
      let resolved = 0;
      if (Array.isArray(op.clauses) && ctx.resolver) {
        for (const cl of op.clauses) {
          if (cl?.op) {
            const r = await executeOp(state, cl.op, { ...ctx, sourceStack: bravedStack, sourceCard: bravedStack.top }, promptResolver, events);
            if (r?.success) resolved++;
          }
        }
      }
      if (events) await events.emit({ type: 'BRAVE_EFFECT_ACTIVATED', when: op.when || op.timing, stack: bravedStack, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, stackId: bravedStack.id, resolved };
    }

    case 'ACTIVATE_KEYWORD': {
      const kw = String(op.keyword || '').trim();
      const targetRes = op.target
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const tgtStack = targetRes.targets?.[0]?.stack || sourceStack || null;
      if (!tgtStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_LEGAL_TARGETS' };
      const tgtSide = tgtStack.owner || controller;
      if (isActionRestricted(state, 'CANNOT_ACTIVATE_ABILITY', tgtSide, tgtStack, { keyword: kw })) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'ABILITY_ACTIVATION_RESTRICTED' };
      }
      if (!Array.isArray(tgtStack.activatedKeywords)) tgtStack.activatedKeywords = [];
      tgtStack.activatedKeywords.push({ keyword: kw, turn: state.turnNumber || 1 });
      if (events) await events.emit({ type: 'KEYWORD_ACTIVATED', keyword: kw, stack: tgtStack, player: tgtSide, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, keyword: kw, stackId: tgtStack.id };
    }

    case 'ON_BP_DESTROY': {
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const reg = { id: makeModId('bpdest'), type: 'ON_BP_DESTROY', whoseDestroyed: op.whoseDestroyed || 'opp', effect: op.effect || null, clauses: op.clauses || null, side: controller, sourceCardId: sourceCard?.id || null };
      state.watchers.push(reg);
      if (events) await events.emit({ type: 'ON_BP_DESTROY_REGISTERED', registration: reg, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, registration: reg };
    }

    // ==================== GROUP B: ADVENT, STACK & UNDERNEATH ====================
    case 'CONTRACT_ADVENT_RULE':
    case 'ADVENT_RULE_MODIFIER':
    case 'ADVENT_RULE':
    case 'MODIFY_ADVENT_CONDITION': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('advrule'), type: op.op, fromZone: op.fromZone || op.zone || 'soul', adventType: op.adventType || 'CONTRACT_ADVENT', rule: op.rule || op.condition || null, modifier: op.modifier || null, ignoreCondition: Boolean(op.ignoreCondition), targetFilter: op.targetFilter || null, side: op.side || controller, duration: op.duration || 'WHILE_IN_ZONE', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: op.op === 'ADVENT_RULE_MODIFIER' ? 'ADVENT_MODIFIER_REGISTERED' : 'ADVENT_RULE_REGISTERED', modifier: mod, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'ADVENT':
    case 'ADVENT_COST':
    case 'STACK_CARD': {
      const fromZone = normalizeZoneKey(op.from || 'hand');
      const p = state.players[controller];
      let cardToStack = op.card || sourceCard || null;
      if (!cardToStack && fromZone === 'hand') {
        const adventCards = (p.hand || []).filter(c => Boolean(c.compiledIr?.abilities?.some(a => String(a.header?.timing || '').toUpperCase() === 'FLASH' && a.header?.advent)));
        if (adventCards.length > 0 && promptResolver && typeof promptResolver.choose === 'function') {
          const picked = await promptResolver.choose({ type: 'SELECT_CARDS', title: 'Choose card to Advent', candidates: adventCards.map(c => ({ card: c })), count: 1, chooser: controller });
          cardToStack = picked?.[0]?.card || picked?.[0] || null;
        }
        if (!cardToStack) cardToStack = p.hand[0] || null;
      }
      if (!cardToStack) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_SOURCE_CARD' };

      const targetRes = op.target && op.target !== 'SELF'
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const targetStack = targetRes.targets?.[0]?.stack || null;
      if (!targetStack || !targetStack.top) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'NO_VALID_ADVENT_TARGET' };
      }
      if (targetStack.top.id === cardToStack.id) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'CANNOT_ADVENT_ONTO_SELF' };
      }
      // Verify physical card exists in expected zone BEFORE mutating targetStack
      const removed = removeCardPhysical(state, cardToStack.id);
      if (!removed) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'CARD_NOT_FOUND_IN_SOURCE_ZONE' };
      }
      const previousTop = targetStack.top;
      const attachedOk = attachCardUnderStack(state, previousTop, targetStack, { facedown: false, preAdvent: true });
      if (!attachedOk) {
        // Atomic rollback to hand/original zone
        if (removed.fromZone === 'hand') p.hand.push(removed.card);
        else if (removed.fromZone === 'grave') p.grave.push(removed.card);
        else if (removed.fromZone === 'soulState') (p.soulState = p.soulState || []).push(removed.card);
        else p.hand.push(removed.card);
        return { status: 'REJECTED', success: false, applied: false, reason: 'DUPLICATE_PRE_ADVENT_CARD' };
      }
      targetStack.top = removed.card;
      targetStack.lastAdventedTurn = state.turnNumber || 1;
      if (events) {
        await events.emit({ type: op.op === 'ADVENT_COST' ? 'ADVENT_COST_PAID' : (op.op === 'STACK_CARD' ? 'CARD_STACKED' : 'CARD_ADVENTED'), adventCard: removed.card, previousTop, stack: targetStack, player: controller });
      }
      return { status: 'SUCCESS', success: true, applied: true, stackId: targetStack.id, topCardId: removed.card.id, preAdventCount: (targetStack.underCards || []).length };
    }

    case 'PUT_UNDERNEATH':
    case 'ATTACH_CARD_UNDERNEATH':
    case 'ATTACH_CARD':
    case 'CARD_UNDERNEATH': {
      const p = state.players[controller];
      const targetRes = op.target && op.target !== 'SELF'
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const targetStack = targetRes.targets?.[0]?.stack || sourceStack || null;
      if (!targetStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_TARGET_STACK' };

      if (op.op === 'CARD_UNDERNEATH' && String(op.action || '').toLowerCase() === 'discard') {
        const cnt = Math.max(1, Number(op.count || 1));
        const under = targetStack.underCards || [];
        if (under.length < cnt) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'INSUFFICIENT_UNDERNEATH_CARDS' };
        const discarded = under.splice(0, cnt);
        for (const c of discarded) {
          c.facedown = false;
          p.grave.push(c);
        }
        return { status: 'SUCCESS', success: true, applied: true, discardedCount: discarded.length, cards: discarded };
      }

      const fromZone = normalizeZoneKey(op.from || 'decktop');
      const fromSideKey = (op.fromSide === 'opp' || op.fromSide === 'opponent') ? oppSide : controller;
      const fromP = state.players[fromSideKey] || p;
      const count = Math.max(1, Number(op.count || 1));
      const attached = [];
      for (let i = 0; i < count; i++) {
        let candidate = null;
        if (fromZone === 'deck_top' || fromZone === 'decktop' || fromZone === 'deck') {
          candidate = fromP.deck[0] || null;
        } else if (fromZone === 'hand') {
          candidate = fromP.hand.find(c => !op.filter || matchesCardFilter(c, op.filter)) || null;
        } else if (fromZone === 'grave') {
          candidate = fromP.grave.find(c => !op.filter || matchesCardFilter(c, op.filter)) || null;
        }
        if (!candidate) break;
        const removed = removeCardPhysical(state, candidate.id);
        if (!removed) break;
        if (attachCardUnderStack(state, removed.card, targetStack, { facedown: op.facedown !== false, preAdvent: false })) {
          attached.push(removed.card);
        } else {
          p.grave.push(removed.card);
        }
      }
      if (events && attached.length > 0) {
        await events.emit({ type: 'CARD_PUT_UNDERNEATH', stack: targetStack, cards: attached, player: controller, sourceCard });
      }
      return { status: attached.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: attached.length > 0, applied: attached.length > 0, count: attached.length, cards: attached };
    }

    case 'ATTACH_PRE_ADVENT_CARD': {
      const p = state.players[controller];
      const hostStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : null);
      if (!hostStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_TARGET_STACK' };
      const fromZone = normalizeZoneKey(op.from || 'field');
      const candidates = fromZone === 'field'
        ? p.field.filter(st => st.id !== hostStack.id && (!op.filter || matchesCardFilter(st.top, op.filter))).map(st => st.top)
        : (p[fromZone] || []).filter(c => !op.filter || matchesCardFilter(c, op.filter));
      const limit = op.count ? Math.min(Number(op.count), candidates.length) : candidates.length;
      let chosenCards = [];
      if (promptResolver && typeof promptResolver.choose === 'function' && candidates.length > 0) {
        const picked = await promptResolver.choose({ type: 'SELECT_CARDS', title: 'Choose card(s) to attach under Advent Spirit', candidates: candidates.map(c => ({ card: c })), count: limit, chooser: controller });
        if (picked && (picked.length > 0 || picked.selected?.length > 0)) {
          const list = Array.isArray(picked.selected) ? picked.selected : picked;
          chosenCards = list.map(x => x.card || x);
        }
      }
      if (!chosenCards.length) {
        if (!state?.matchContext || state.matchContext.canSimulate(controller)) {
          chosenCards = candidates.slice(0, limit);
        } else {
          return { status: 'UNRESOLVED', success: false, applied: false, reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
        }
      }
      const attached = [];
      for (const card of chosenCards) {
        const removed = removeCardPhysical(state, card.id);
        if (removed && attachCardUnderStack(state, removed.card, hostStack, { facedown: false, preAdvent: true })) {
          attached.push(removed.card);
        }
      }
      if (events && attached.length > 0) await events.emit({ type: 'PRE_ADVENT_ATTACHED', stack: hostStack, cards: attached, player: controller });
      return { status: attached.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: attached.length > 0, applied: attached.length > 0, count: attached.length, cards: attached };
    }

    case 'DISCARD_UNDERNEATH_COST': {
      const p = state.players[controller];
      const cnt = Math.max(1, Number(op.count || 1));
      const targetRes = op.target && op.target !== 'SELF'
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const tgtStack = targetRes.targets?.[0]?.stack || p.field.find(st => (st.underCards || []).length >= cnt) || null;
      if (!tgtStack) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_ELIGIBLE_STACK' };
      const under = tgtStack.underCards || [];
      const eligible = under.filter(c => (!op.facedownOnly || c.facedown) && (!op.filter || matchesCardFilter(c, op.filter)));
      if (eligible.length < cnt) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'INSUFFICIENT_UNDERNEATH_COST' };
      }
      const discarded = [];
      for (let i = 0; i < cnt; i++) {
        const chosen = eligible[i];
        const idx = under.findIndex(u => u.id === chosen.id);
        if (idx !== -1) {
          const [card] = under.splice(idx, 1);
          card.facedown = false;
          p.grave.push(card);
          discarded.push(card);
        }
      }
      if (events) await events.emit({ type: 'UNDERNEATH_CARD_DISCARDED', stack: tgtStack, cards: discarded, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, discardedCount: discarded.length, cards: discarded };
    }

    case 'SWAP_CARD':
    case 'SWITCH_CARD': {
      const p = state.players[controller];
      const handCard = op.card || sourceCard || null;
      const inHandIdx = handCard ? p.hand.findIndex(c => c.id === handCard.id) : -1;
      if (inHandIdx === -1) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'SOURCE_CARD_NOT_IN_HAND' };
      }
      const fieldRes = await resolveTargets(state, op.target || { side: 'self', types: ['Spirit'], ...(op.filter || {}) }, ctx, promptResolver, { defaultSide: 'self', defaultTypes: ['Spirit'] });
      const fieldStack = fieldRes.targets?.[0]?.stack || null;
      if (!fieldStack || !fieldStack.top) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'NO_SWAP_TARGET_ON_FIELD' };
      }
      const incoming = p.hand.splice(inHandIdx, 1)[0];
      const outgoing = fieldStack.top;
      fieldStack.top = incoming;
      incoming.currentOwner = controller;
      outgoing.currentOwner = controller;
      p.hand.push(outgoing);
      if (events) await events.emit({ type: 'CARDS_SWAPPED', incoming, outgoing, stack: fieldStack, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, incomingCardId: incoming.id, outgoingCardId: outgoing.id, stackId: fieldStack.id };
    }

    case 'SWAP_CARDS': {
      const p = state.players[controller];
      const fromZ = normalizeZoneKey(op.from || 'revealed');
      const toZ = normalizeZoneKey(op.to || 'hand');
      const fromArr = Array.isArray(p[fromZ]) ? p[fromZ] : (fromZ === 'revealed' && Array.isArray(ctx.revealedCards) ? ctx.revealedCards : null);
      const toArr = Array.isArray(p[toZ]) ? p[toZ] : null;
      if (!fromArr || !toArr) return { status: 'REJECTED', success: false, applied: false, reason: 'INVALID_SWAP_ZONES' };
      const matching = fromArr.filter(c => !op.filter || matchesCardFilter(c, op.filter));
      const count = Math.min(matching.length, Number(op.count || matching.length));
      if (count === 0) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_MATCHING_CARDS' };
      const swappedIn = [];
      for (let i = 0; i < count; i++) {
        const c = matching[i];
        const idx = fromArr.findIndex(x => x.id === c.id);
        if (idx !== -1 && toArr.length > 0) {
          const [cardIn] = fromArr.splice(idx, 1);
          const cardOut = toArr.shift();
          toArr.push(cardIn);
          fromArr.push(cardOut);
          swappedIn.push(cardIn);
        }
      }
      if (events && swappedIn.length > 0) await events.emit({ type: 'CARDS_SWAPPED', swappedIn, fromZone: fromZ, toZone: toZ, player: controller });
      return { status: swappedIn.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: swappedIn.length > 0, applied: swappedIn.length > 0, swappedCount: swappedIn.length };
    }

    // ==================== GROUP C: MIRAGE SYSTEMS ====================
    case 'MIRAGE_OPERATION': {
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const action = String(op.action || op.operation || op.mode || '').toLowerCase();
      if (action === 'discard' || action === 'remove') {
        if (!p.mirage) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_ACTIVE_MIRAGE' };
        const oldMirage = p.mirage;
        p.mirage = null;
        p.grave.push(oldMirage);
        state.modifiers = (state.modifiers || []).filter(m => !(m && m.sourceCardId === oldMirage.id && (m.sourceZone === 'mirage' || m.duration === 'WHILE_MIRAGE_SET')));
        if (events) await events.emit({ type: 'MIRAGE_DISCARDED', card: oldMirage, player: targetSide });
        return { status: 'SUCCESS', success: true, applied: true, action: 'discard', card: oldMirage };
      }
      if (action === 'return_hand' || action === 'bounce') {
        if (!p.mirage) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_ACTIVE_MIRAGE' };
        const oldMirage = p.mirage;
        p.mirage = null;
        p.hand.push(oldMirage);
        state.modifiers = (state.modifiers || []).filter(m => !(m && m.sourceCardId === oldMirage.id && (m.sourceZone === 'mirage' || m.duration === 'WHILE_MIRAGE_SET')));
        if (events) await events.emit({ type: 'MIRAGE_RETURNED', card: oldMirage, player: targetSide });
        return { status: 'SUCCESS', success: true, applied: true, action: 'return_hand', card: oldMirage };
      }
      if (action === 'activate_set_card' || action === 'activate_set' || action === 'activate') {
        const activeMirage = p.mirage || sourceCard || null;
        if (!activeMirage) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_ACTIVE_MIRAGE' };
        let resolvedCount = 0;
        if (ctx.resolver && activeMirage.compiledIr?.abilities?.length) {
          for (const ab of activeMirage.compiledIr.abilities) {
            const hdrKw = String(ab.header?.keyword || '').toLowerCase();
            const hdrT = String(ab.header?.timing || '').toUpperCase();
            if (hdrKw.includes('mirage') || hdrT === 'MIRAGE' || hdrT === 'WHILE_SET' || (ab.header?.prefixes || []).some(pr => /during\s+set/i.test(String(pr)))) {
              const r = await ctx.resolver.resolveAbility(state, ab, { ...ctx, controller: targetSide, sourceCard: activeMirage, fromMirage: true }, events);
              if (r?.success) resolvedCount++;
            }
          }
        }
        if (events) await events.emit({ type: 'MIRAGE_ACTIVATED', card: activeMirage, player: targetSide, resolvedCount });
        return { status: 'SUCCESS', success: true, applied: true, action: 'activate_set_card', card: activeMirage, resolvedCount };
      }
      // action === 'set'
      const card = op.card || sourceCard || p.hand[0] || null;
      if (!card) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_MIRAGE_CARD' };
      const removed = removeCardPhysical(state, card.id);
      if (!removed) return { status: 'REJECTED', success: false, applied: false, reason: 'MIRAGE_CARD_NOT_AVAILABLE' };
      if (p.mirage) {
        const prevMirage = p.mirage;
        p.grave.push(prevMirage);
        state.modifiers = (state.modifiers || []).filter(m => !(m && m.sourceCardId === prevMirage.id && (m.sourceZone === 'mirage' || m.duration === 'WHILE_MIRAGE_SET')));
      }
      p.mirage = removed.card;
      p.mirageSetThisTurn = true;
      if (events) await events.emit({ type: 'MIRAGE_SET', card: removed.card, player: targetSide });
      return { status: 'SUCCESS', success: true, applied: true, action: 'set', card: removed.card };
    }

    case 'DISCARD_MIRAGE_COST': {
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      if (!p.mirage) return { status: 'REJECTED', success: false, applied: false, reason: 'INSUFFICIENT_MIRAGE_COST' };
      if (op.filter && !matchesCardFilter(p.mirage, op.filter)) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'MIRAGE_FILTER_MISMATCH' };
      }
      const oldMirage = p.mirage;
      p.mirage = null;
      p.grave.push(oldMirage);
      state.modifiers = (state.modifiers || []).filter(m => !(m && m.sourceCardId === oldMirage.id && (m.sourceZone === 'mirage' || m.duration === 'WHILE_MIRAGE_SET')));
      if (events) await events.emit({ type: 'MIRAGE_DISCARDED', card: oldMirage, player: targetSide, isCost: true });
      return { status: 'SUCCESS', success: true, applied: true, card: oldMirage };
    }

    // ==================== GROUP D: COPYING & REDIRECTION ====================
    case 'COPY_EFFECT': {
      const timingFilter = op.timing ? String(op.timing).toUpperCase() : null;
      const targetRes = op.target && op.target !== 'SELF'
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const tgtCard = op.sourceCard || targetRes.targets?.[0]?.stack?.top || targetRes.targets?.[0]?.card || sourceCard || null;
      if (!tgtCard) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_COPY_SOURCE' };
      const srcAbList = tgtCard.compiledIr?.abilities || [];
      const matchingAbs = timingFilter
        ? srcAbList.filter(a => String(a.header?.timing || '').toUpperCase() === timingFilter)
        : srcAbList;
      if (matchingAbs.length === 0) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_MATCHING_ABILITY_TO_COPY' };

      if (!ctx._copiedSourceIds) ctx._copiedSourceIds = new Set();
      const copyKey = `${tgtCard.id}:${timingFilter || 'ALL'}`;
      if (ctx._copiedSourceIds.has(copyKey) && !op.recursive) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'RECURSIVE_COPY_PREVENTED' };
      }
      if (ctx._copiedSourceIds.size >= 5) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'COPY_DEPTH_EXCEEDED' };
      }
      const nextVisited = new Set(ctx._copiedSourceIds);
      nextVisited.add(copyKey);
      let resolvedCount = 0;
      const copiedAbilities = matchingAbs.map(ab => cloneIrWithoutMutation(ab));
      if (ctx.resolver) {
        for (const clonedAb of copiedAbilities) {
          const r = await ctx.resolver.resolveAbility(state, clonedAb, { ...ctx, sourceCard: ctx.sourceCard || tgtCard, copiedFromCardId: tgtCard.id, _copiedSourceIds: nextVisited }, events);
          if (r?.success) resolvedCount++;
        }
      }
      if (events) await events.emit({ type: 'EFFECT_COPIED', copiedFromCard: tgtCard, timing: timingFilter, resolvedCount, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, copiedFromCardId: tgtCard.id, copiedAbilityCount: copiedAbilities.length, resolvedCount };
    }

    case 'COPY_PRE_ADVENT_EFFECT': {
      const targetStack = sourceStack || (op.targetStackId ? state.players[controller]?.field?.find(s => (s.id || s.stackId) === op.targetStackId) : null);
      if (!targetStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_TARGET_STACK' };
      const under = (targetStack.underCards || targetStack.under || []).filter(c => !op.filter || matchesCardFilter(c, op.filter));
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const copiedAbilities = [];
      for (const uCard of under) {
        for (const ab of (uCard.compiledIr?.abilities || [])) {
          copiedAbilities.push(cloneIrWithoutMutation(ab));
        }
      }
      const mod = { id: makeModId('copy_preadv'), type: 'COPY_PRE_ADVENT_EFFECT', targetStackId: targetStack.id, ignoreLevels: Boolean(op.ignoreLevels ?? true), copiedAbilities, side: controller, duration: op.duration || 'WHILE_IN_ZONE', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'PRE_ADVENT_EFFECTS_GRANTED', stack: targetStack, count: copiedAbilities.length, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, grantedCount: copiedAbilities.length, modifier: mod };
    }

    case 'COPY_ABILITY': {
      const p = state.players[controller];
      const dstStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : null);
      if (!dstStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_TARGET_STACK' };
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const matchingStacks = p.field.filter(st => !op.filter || matchesCardFilter(st.top, op.filter));
      const granted = [];
      const kwTarget = op.keyword || op.abilityType;
      for (const st of matchingStacks) {
        const kws = (st.top?.keywords || []).filter(k => !kwTarget || String(k.name || k).toLowerCase().includes(String(kwTarget).toLowerCase()));
        for (const k of kws) granted.push(cloneIrWithoutMutation(k));
      }
      const mod = { id: makeModId('copy_ab'), type: 'COPY_ABILITY', targetStackId: dstStack.id, keyword: kwTarget || null, grantedKeywords: granted, side: controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'ABILITY_COPIED', targetStack: dstStack, grantedCount: granted.length, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, grantedCount: granted.length, modifier: mod };
    }

    case 'MULTIPLY_EFFECT': {
      const p = state.players[controller];
      let mult = Number(op.multiplier || 1);
      if (op.filter) {
        mult = (p.field || []).filter(st => matchesCardFilter(st.top, op.filter)).length;
      }
      if (typeof op.maxCount === 'number') mult = Math.min(mult, op.maxCount);
      mult = Math.max(0, mult);
      ctx.effectMultiplier = mult;
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('mult'), type: 'MULTIPLY_EFFECT', per: op.per || 'filter', multiplier: mult, side: controller, duration: op.duration || 'THIS_EFFECT', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'EFFECT_MULTIPLIED', multiplier: mult, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, multiplier: mult, modifier: mod };
    }

    case 'MODIFY_DESTINATION':
    case 'BANISH_DESTINATION_RULE': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const dest = normalizeZoneKey(op.destination || 'removed');
      const mod = { id: makeModId('moddest'), type: op.op, replaces: op.replaces || 'DESTROYED_OR_DEPLETED', destination: dest, replacementZone: dest, filter: op.filter || null, side: op.side || 'both', duration: op.duration || 'THIS_EFFECT', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'DESTINATION_MODIFIED', replaces: mod.replaces, destination: dest, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, destination: dest, modifier: mod };
    }

    case 'REDIRECT_TARGET':
    case 'CHANGE_TARGET': {
      if (op.newTarget) {
        const res = op.newTarget === 'SELF' && sourceStack
          ? { success: true, targets: [{ stack: sourceStack, side: controller }] }
          : await resolveTargets(state, op.newTarget, ctx, promptResolver, { defaultSide: controller });
        if (!res.success || !res.targets?.length) {
          return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_REDIRECT_TARGET' };
        }
        ctx.previousTarget = res.targets[0].stack || res.targets[0].card;
        ctx.selectedTargets = res.targets;
      }
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('redir'), type: 'REDIRECT_TARGET', filter: op.filter || null, bpMax: op.bpMax ?? null, mode: op.mode || 'redirect', excludeSelf: Boolean(op.excludeSelf), side: op.side || controller, duration: op.duration || 'THIS_EFFECT', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'TARGET_REDIRECTED', newTarget: ctx.previousTarget || null, bpMax: op.bpMax ?? null, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod, redirectedTarget: ctx.previousTarget || null };
    }

    case 'REDIRECT_CORE_DESTINATION': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const rawDest = normalizeZoneKey(op.destination || 'trash');
      const dest = rawDest === 'grave' ? 'trash' : rawDest;
      const normSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : (op.side === 'self' ? controller : (op.side || 'both'));
      const mod = { id: makeModId('redircore'), type: 'REDIRECT_CORE_DESTINATION', fromZone: normalizeZoneKey(op.fromZone || 'life'), destination: dest, cause: op.cause || 'effect', side: normSide, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'CORE_DESTINATION_REDIRECTED', fromZone: mod.fromZone, destination: dest, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'LIFE_OR_CORE_MODIFICATION': {
      const count = Math.max(1, Number(op.count ?? op.amount ?? 1));
      const fromZone = normalizeZoneKey(op.fromZone || 'life');
      const rawToZone = normalizeZoneKey(op.destination || op.targetZone || 'trash');
      const toZone = rawToZone === 'grave' ? 'trash' : rawToZone;
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : (fromZone === 'life' && !op.side ? oppSide : controller);
      if (fromZone === 'life' && targetSide === oppSide && isActionRestricted(state, 'CANNOT_LOSE_LIFE', oppSide, sourceStack, { by: controller, sourceCard })) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'LIFE_LOSS_RESTRICTED' };
      }
      const p = state.players[targetSide];
      const available = fromZone === 'life' ? (p.life || 0) : (fromZone === 'reserve' ? (p.reserve?.normal || 0) : count);
      const actual = op.upTo ? Math.min(count, available) : count;
      if (actual === 0 || (!op.upTo && available < actual)) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'INSUFFICIENT_CORES' };
      }
      const moved = await moveCore(state, actual, { zone: fromZone, side: targetSide }, { zone: toZone, side: targetSide }, { cause: 'effect', by: controller, sourceCard }, events);
      return { status: moved ? 'SUCCESS' : 'REJECTED', success: Boolean(moved), applied: Boolean(moved), count: moved ? actual : 0 };
    }

    // ==================== GROUP E: HAND, DECK, REVEAL & ZONES ====================
    case 'LOOK_HAND':
    case 'LOOK_AT_HAND': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const hand = state.players[targetSide]?.hand || [];
      const count = op.count ? Math.min(Number(op.count), hand.length) : hand.length;
      const looked = hand.slice(0, count);
      ctx.inspectedCards = looked;
      state.players[targetSide].lastLookedAtHandIds = looked.map(c => c.id);
      if (events) await events.emit({ type: 'HAND_LOOKED_AT', player: controller, targetSide, count: looked.length, cardIds: looked.map(c => c.id) });
      return { status: 'SUCCESS', success: true, applied: true, targetSide, count: looked.length, cards: looked };
    }

    case 'REVEAL_HAND': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const hand = state.players[targetSide]?.hand || [];
      if (!state.revealedHands) state.revealedHands = {};
      state.revealedHands[targetSide] = hand.map(c => c.id);
      ctx.revealedCards = [...hand];
      if (events) await events.emit({ type: 'HAND_REVEALED', player: targetSide, count: hand.length, cardIds: hand.map(c => c.id) });
      return { status: 'SUCCESS', success: true, applied: true, targetSide, count: hand.length, cards: hand };
    }

    case 'LOOK_AT_DECK':
    case 'LOOK_DECKTOP': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const deck = state.players[targetSide]?.deck || [];
      const count = Math.min(Math.max(1, Number(op.count || 1)), deck.length);
      const isBottom = String(op.position || '').toLowerCase() === 'bottom';
      const looked = isBottom ? deck.slice(Math.max(0, deck.length - count)) : deck.slice(0, count);
      ctx.lookedDeckCards = looked;
      ctx.revealedCards = looked;
      if (events) await events.emit({ type: 'DECK_LOOKED_AT', player: targetSide, count: looked.length, cardIds: looked.map(c => c.id) });
      return { status: 'SUCCESS', success: true, applied: true, count: looked.length, cards: looked };
    }

    case 'REVEAL_INTERACTION': {
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const watcher = { id: makeModId('revint'), type: 'REVEAL_INTERACTION', onRevealBy: op.onRevealBy || 'self', destination: normalizeZoneKey(op.destination || 'field'), action: op.action || 'put', side: controller, sourceCardId: sourceCard?.id || null };
      state.watchers.push(watcher);
      if (events) await events.emit({ type: 'REVEAL_INTERACTION_REGISTERED', watcher, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, watcher };
    }

    case 'DISCARD_ZONE':
    case 'DISCARD_FIELD': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const p = state.players[targetSide];
      const zone = normalizeZoneKey(op.zone || 'field');
      const cardType = String(op.cardType || op.filter?.type || '').toLowerCase();
      const cnt = Math.max(1, Number(op.count || 1));
      const discarded = [];
      if (zone === 'field') {
        const candidates = [];
        for (const st of (p.field || [])) {
          if (!cardType || String(st.top?.type || '').toLowerCase() === cardType) {
            if (!op.filter || matchesCardFilter(st.top, op.filter)) candidates.push(st.top);
          }
        }
        for (const extra of (p.nexus || [])) {
          if (!cardType || String(extra.type || '').toLowerCase() === cardType) {
            if (!op.filter || matchesCardFilter(extra, op.filter)) candidates.push(extra);
          }
        }
        for (let i = 0; i < Math.min(cnt, candidates.length); i++) {
          const moved = await moveCard(state, candidates[i], 'grave', targetSide, { cause: 'discard', by: controller, sourceCard }, events);
          if (moved) discarded.push(candidates[i]);
        }
      } else if (zone === 'mirage' && p.mirage) {
        const old = p.mirage;
        p.mirage = null;
        p.grave.push(old);
        discarded.push(old);
      } else if (Array.isArray(p[zone])) {
        const matching = p[zone].filter(c => (!cardType || String(c.type || '').toLowerCase() === cardType) && (!op.filter || matchesCardFilter(c, op.filter)));
        for (let i = 0; i < Math.min(cnt, matching.length); i++) {
          const moved = await moveCard(state, matching[i], 'grave', targetSide, { cause: 'discard', by: controller, sourceCard }, events);
          if (moved) discarded.push(matching[i]);
        }
      }
      if (events && discarded.length > 0) await events.emit({ type: 'CARD_DISCARDED', zone, cards: discarded, player: targetSide, by: controller });
      return { status: discarded.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: discarded.length > 0, applied: discarded.length > 0, count: discarded.length, cards: discarded };
    }

    case 'DISCARD_AMONG': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const p = state.players[targetSide];
      const pool = Array.isArray(ctx.revealedCards) && ctx.revealedCards.length > 0 ? ctx.revealedCards : (p.revealed || []);
      const filter = { ...(op.filter || {}) };
      if (op.color) filter.color = op.color;
      const matching = pool.filter(c => matchesCardFilter(c, filter));
      const cnt = Math.min(matching.length, Math.max(1, Number(op.count || 1)));
      const discarded = [];
      for (let i = 0; i < cnt; i++) {
        const card = matching[i];
        const moved = await moveCard(state, card, 'grave', targetSide, { cause: 'discard', by: controller, sourceCard }, events);
        if (moved) {
          const pIdx = pool.findIndex(x => x.id === card.id);
          if (pIdx !== -1 && pool === ctx.revealedCards) pool.splice(pIdx, 1);
          discarded.push(card);
        }
      }
      if (events && discarded.length > 0) await events.emit({ type: 'CARD_DISCARDED', cards: discarded, player: targetSide, cause: 'discard_among' });
      return { status: discarded.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: discarded.length > 0, applied: discarded.length > 0, count: discarded.length, cards: discarded };
    }

    case 'DISCARD_FIELD_MAGIC':
    case 'DISCARD_FROM_FIELD_COST': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const p = state.players[targetSide];
      const cnt = Math.max(1, Number(op.count || 1));
      const filter = { type: op.cardType || 'Magic', ...(op.filter || {}), ...(op.family ? { family: op.family } : {}) };
      const fieldCards = (p.field || []).map(st => st.top).filter(c => c && matchesCardFilter(c, filter));
      if (fieldCards.length < cnt) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'INSUFFICIENT_FIELD_MAGIC' };
      }
      const discarded = [];
      for (let i = 0; i < cnt; i++) {
        const moved = await moveCard(state, fieldCards[i], 'grave', targetSide, { cause: 'cost_discard', by: controller, sourceCard }, events);
        if (moved) discarded.push(fieldCards[i]);
      }
      if (events) await events.emit({ type: 'FIELD_MAGIC_DISCARDED', cards: discarded, player: targetSide });
      return { status: 'SUCCESS', success: true, applied: true, count: discarded.length, cards: discarded };
    }

    case 'SEND_TO_TRASH': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const targetRes = op.target
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: targetSide })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const targets = targetRes.targets || [];
      if (targets.length === 0) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_LEGAL_TARGETS' };
      const sent = [];
      for (const item of targets) {
        const c = item.stack?.top || item.card;
        if (!c) continue;
        const moved = await moveCard(state, c, 'grave', item.side || targetSide, { cause: 'effect', by: controller, sourceCard }, events);
        if (moved) sent.push(c);
      }
      if (events && sent.length > 0) await events.emit({ type: 'CARD_SENT_TO_TRASH', cards: sent, player: controller });
      return { status: sent.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: sent.length > 0, applied: sent.length > 0, count: sent.length, cards: sent };
    }

    case 'PUT_CARD_ON_FIELD':
    case 'PUT_FACEDOWN_FIELD': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const p = state.players[targetSide];
      const fromZ = normalizeZoneKey(op.from || 'hand');
      const arr = p[fromZ] || [];
      const filter = { ...(op.filter || {}), ...(op.cardType ? { type: op.cardType } : {}), ...(op.family ? { family: op.family } : {}) };
      const candidates = arr.filter(c => matchesCardFilter(c, filter) && (!op.keyword || String(c.effect || '').includes(op.keyword)));
      const cnt = Math.max(1, Number(op.count || 1));
      if (op.op === 'PUT_FACEDOWN_FIELD' && candidates.length < cnt) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'INSUFFICIENT_CARDS_TO_PLACE' };
      }
      const placed = [];
      for (let i = 0; i < Math.min(cnt, candidates.length); i++) {
        const c = candidates[i];
        const removed = removeCardPhysical(state, c.id);
        if (removed) {
          const st = createFieldStack(removed.card, { normal: 0, soul: 0 });
          st.owner = targetSide;
          st.isFacedown = Boolean(op.facedown ?? (op.op === 'PUT_FACEDOWN_FIELD'));
          p.field.push(st);
          placed.push(st);
        }
      }
      if (events && placed.length > 0) {
        await events.emit({ type: op.op === 'PUT_FACEDOWN_FIELD' ? 'FACEDOWN_CARD_PLACED' : 'CARD_PLACED_ON_FIELD', stacks: placed, player: targetSide });
      }
      return { status: placed.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: placed.length > 0, applied: placed.length > 0, count: placed.length, stacks: placed };
    }

    case 'USE_FROM_HAND': {
      const p = state.players[controller];
      let card = null;
      if (String(op.cardType || '').toUpperCase() === 'SELF') {
        card = sourceCard
          ? (p.hand.find(c => (c.id && c.id === sourceCard.id) || (c.cardNumber && c.cardNumber === sourceCard.cardNumber)) || null)
          : null;
      } else {
        const filter = { ...(op.filter || {}), ...(op.cardType ? { type: op.cardType } : {}) };
        card = p.hand.find(c => matchesCardFilter(c, filter));
      }
      if (!card) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_MATCHING_CARD_IN_HAND' };
      if (card.type === 'Magic' && isActionRestricted(state, 'CANNOT_USE_MAGIC', controller, card, { cardType: 'Magic', fromZone: 'hand' })) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'MAGIC_RESTRICTED' };
      }
      if (ctx.resolver && card.compiledIr?.abilities?.length) {
        const wantTiming = op.timing ? String(op.timing).toUpperCase() : 'FLASH';
        for (const ab of card.compiledIr.abilities) {
          if (!op.timing || String(ab.header?.timing || '').toUpperCase().includes(wantTiming)) {
            await ctx.resolver.resolveAbility(state, ab, { ...ctx, controller, sourceCard: card }, events);
          }
        }
      }
      await moveCard(state, card, 'grave', controller, { cause: 'magic_use', sourceCard: card }, events);
      if (events) await events.emit({ type: 'CARD_USED_FROM_HAND', card, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, card };
    }

    case 'CAST_FROM_TRASH':
    case 'CAST_FROM_DECK': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('castperm'), type: op.op, zone: op.op === 'CAST_FROM_DECK' ? 'deck' : 'grave', condition: op.condition || null, scope: op.scope || 'self', faceupOnly: Boolean(op.faceupOnly), ignoreCost: Boolean(op.ignoreCost), side: controller, sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'CAST_FROM_TRASH_ENABLED', modifier: mod, player: controller, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'LIMIT_DECK_DISCARD': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const maxPerTurn = Number(op.maxPerTurn ?? op.limit ?? 5);
      const resolvedTargetSide = op.targetSide === 'both' ? 'both' : ((op.targetSide === 'opp' || op.targetSide === 'opponent') ? oppSide : controller);
      const mod = { id: makeModId('limmill'), type: 'LIMIT_DECK_DISCARD', maxPerTurn, targetSide: resolvedTargetSide, sourceSide: op.sourceSide || 'opp', duration: op.duration || 'WHILE_IN_ZONE', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'DECK_DISCARD_LIMIT_SET', maxPerTurn, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, maxPerTurn, modifier: mod };
    }

    case 'SHUFFLE_DECK': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const deck = state.players[targetSide]?.deck;
      if (!Array.isArray(deck)) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_DECK' };
      let seed = Number(op.seed ?? state.rngSeed ?? (state.deterministicRng ? (state.turnNumber || 1) * 1103515245 : 0));
      for (let i = deck.length - 1; i > 0; i--) {
        let j;
        if (seed) {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          j = seed % (i + 1);
        } else {
          j = Math.floor(Math.random() * (i + 1));
        }
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      if (events) await events.emit({ type: 'DECK_SHUFFLED', player: targetSide, deckCount: deck.length });
      return { status: 'SUCCESS', success: true, applied: true, player: targetSide, deckCount: deck.length };
    }

    // ==================== GROUP F: COMBAT & BATTLE ====================
    case 'CHOOSE_BLOCKER':
    case 'CHOOSE_BATTLE_TARGET': {
      if (!state.combat) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NOT_IN_COMBAT' };
      }
      const defSide = state.combat.attackerSide === 'player' ? 'opponent' : 'player';
      const targetRes = await resolveTargets(state, op.target || { side: defSide, types: ['Spirit', 'Ultimate'], ...(op.filter || {}) }, ctx, promptResolver, { defaultSide: defSide });
      const chosen = targetRes.targets?.[0]?.stack || null;
      if (!chosen) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_LEGAL_BLOCKER' };
      state.combat.blockerStackId = chosen.id;
      if (events) await events.emit({ type: 'BLOCKER_CHOSEN', blocker: chosen, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, blockerStackId: chosen.id };
    }

    case 'FORCE_ATTACK': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const targetSide = (op.side === 'self') ? controller : oppSide;
      const mod = { id: makeModId('forceatk'), type: 'FORCE_ATTACK', side: targetSide, minAttacks: Number(op.minAttacks || 1), targetFilter: op.filter || null, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'FORCED_ATTACK_SET', side: targetSide, minAttacks: mod.minAttacks });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'PIERCING_RULE': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('pierce'), type: 'PIERCING_RULE', allowedPrevention: op.allowedPrevention || ['Armor', 'Heavy Armor', 'Ultra Armor'], bypasses: op.bypasses || ['INDESTRUCTIBLE', 'PROTECTION', 'CANNOT_BE_DESTROYED'], effectType: op.effectType || 'destroy', side: op.side || controller, duration: op.duration || 'THIS_EFFECT', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'PIERCING_RULE_SET', modifier: mod, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'BATTLE_RULE_MODIFIER': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('batrule'), type: 'BATTLE_RULE_MODIFIER', rule: op.rule || op.mode || op.effect, side: op.side || 'both', duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'BATTLE_RULE_MODIFIED', rule: mod.rule, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'BATTLE_MODIFIER':
    case 'ATTACK_RULE_MODIFIER':
    case 'BATTLE_MULTIPLE': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('batmod'), type: op.op, maxBattles: op.maxBattles || op.maxTargets || null, rule: op.rule || op.mode || 'MULTI_BATTLE', targetStackId: sourceStack?.id || null, side: op.side || controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'BATTLE_MODIFIED', modifier: mod, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'FLASH_PRIORITY': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const firstSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const mod = { id: makeModId('flashprio'), type: 'FLASH_PRIORITY', firstSide, side: firstSide, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (state.combat) state.combat.flashPriority = firstSide;
      if (events) await events.emit({ type: 'FLASH_PRIORITY_SET', firstSide });
      return { status: 'SUCCESS', success: true, applied: true, firstSide, modifier: mod };
    }

    case 'RESTRICT_MAIN_STEP': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('restmain'), type: 'RESTRICT_MAIN_STEP', restriction: 'RESTRICT_MAIN_STEP', side: controller, sourceCardId: sourceCard?.id || null, scope: op.scope || 'ability', duration: 'WHILE_IN_ZONE' };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'MAIN_STEP_RESTRICTION_SET', sourceCardId: sourceCard?.id || null, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'DESTROY_ON_BP_ZERO': {
      const targetSide = op.side === 'self' ? controller : (op.side === 'both' ? null : oppSide);
      const sides = targetSide ? [targetSide] : ['player', 'opponent'];
      const destroyed = [];
      for (const s of sides) {
        const stacks = [...(state.players[s]?.field || [])];
        for (const st of stacks) {
          if (computeEffectiveBP(state, st) === 0) {
            if (!isTargetProtectedFrom(state, st, 'destroy', sourceCard, { unpreventable: Boolean(op.allowProtectionBypass), sourceSide: controller })) {
              const moved = await moveCard(state, st.top, 'grave', s, { cause: 'destroy', by: controller, sourceCard }, events);
              if (moved) destroyed.push(st.top);
            }
          }
        }
      }
      if (events && destroyed.length > 0) await events.emit({ type: 'BP_ZERO_DESTRUCTION_APPLIED', cards: destroyed, player: controller });
      return { status: destroyed.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: destroyed.length > 0, applied: destroyed.length > 0, destroyedCount: destroyed.length, cards: destroyed };
    }

    // ==================== GROUP G & REMAINING OPS ====================
    case 'GLOBAL_RESTRICTION': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const restriction = op.restriction || op.action || op.cannot;
      const mod = { id: makeModId('globrestr'), type: 'GLOBAL_RESTRICTION', restriction, action: restriction, side: op.side || 'both', cause: op.cause || null, filter: op.filter || null, duration: op.duration || 'WHILE_IN_ZONE', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'RESTRICTION_SET', restriction, modifier: mod, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, restriction, modifier: mod };
    }

    case 'DECK_BUILDING_RULE':
    case 'DECK_CONSTRUCTION_RULE':
    case 'DECK_RULE': {
      const ruleObj = { maxCopies: op.maxCopies ?? (String(op.rule || '').toUpperCase().includes('UNLIMITED') ? 'UNLIMITED' : 1), rule: op.rule || 'CUSTOM_COPY_LIMIT' };
      if (sourceCard) sourceCard.deckRule = ruleObj;
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('deckrule'), type: op.op, maxCopies: ruleObj.maxCopies, rule: ruleObj.rule, sourceCardId: sourceCard?.id || null, side: controller };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'DECK_RULE_ATTACHED', deckRule: ruleObj, sourceCard });
      return { status: 'SUCCESS', success: true, applied: true, deckRule: ruleObj, modifier: mod };
    }

    case 'GAIN_TEAM':
    case 'TEAM_RULE': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('team'), type: op.op, allTeams: Boolean(op.allTeams || op.scope === 'all'), teams: Array.isArray(op.teams) ? op.teams : [], targetStackId: sourceStack?.id || null, targetCardId: sourceCard?.id || null, side: controller, duration: op.duration || 'WHILE_IN_ZONE', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'TEAM_GRANTED', allTeams: mod.allTeams, teams: mod.teams, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'BUNSHIN_SUMMON':
    case 'CREATE_BUNSHIN': {
      const p = state.players[controller];
      const count = Math.max(1, Number(op.count || 1));
      const coresPerBunshin = Math.max(1, Number(op.coresMin || 1));
      const availReserve = (p.reserve?.normal || 0);
      if (availReserve < coresPerBunshin || p.deck.length === 0) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'INSUFFICIENT_RESOURCES_FOR_BUNSHIN' };
      }
      const created = [];
      for (let i = 0; i < count; i++) {
        if (p.deck.length === 0 || (p.reserve?.normal || 0) < coresPerBunshin) break;
        const deckTop = p.deck.shift();
        const st = createFieldStack({ ...deckTop, type: 'Spirit', isBunshin: true, isFacedown: true }, { normal: 0, soul: 0 });
        st.owner = controller;
        st.isFacedown = true;
        st.isBunshin = true;
        p.field.push(st);
        const movedCore = await moveCore(state, coresPerBunshin, { zone: 'reserve', side: controller }, { zone: 'field', side: controller, stackId: st.id }, { cause: 'bunshin_summon', by: controller, sourceCard }, events);
        if (!movedCore) {
          p.field.pop();
          p.deck.unshift(deckTop);
          break;
        }
        created.push(st);
      }
      if (events && created.length > 0) await events.emit({ type: 'BUNSHIN_SUMMONED', stacks: created, player: controller });
      return { status: created.length > 0 ? 'SUCCESS' : 'REJECTED', success: created.length > 0, applied: created.length > 0, count: created.length, stacks: created };
    }

    case 'FLIP_BUNSHIN': {
      const p = state.players[controller];
      const bunshin = p.field.find(st => st.isBunshin || st.isFacedown);
      if (!bunshin) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_BUNSHIN_TO_FLIP' };
      bunshin.isFacedown = false;
      if (bunshin.top) bunshin.top.isFacedown = false;
      if (events) await events.emit({ type: 'BUNSHIN_FLIPPED', stack: bunshin, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, stackId: bunshin.id };
    }

    case 'TARGET_FAMILY':
    case 'CHOOSE_FAMILY': {
      const choices = Array.isArray(op.families) ? op.families : (Array.isArray(op.options) ? op.options : []);
      let chosen = choices[0] || op.family || null;
      if (choices.length > 1 && promptResolver?.selectOption) {
        const idx = await promptResolver.selectOption(choices, { title: 'Choose a family' });
        if (typeof idx === 'number' && choices[idx]) chosen = choices[idx];
      }
      if (!chosen) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_FAMILY_OPTIONS' };
      state.chosenFamily = chosen;
      ctx.chosenFamily = chosen;
      if (events) await events.emit({ type: 'FAMILY_CHOSEN', family: chosen, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, family: chosen };
    }

    case 'DECK_IMMUNITY': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const targetSide = op.side === 'both' ? 'both' : (op.side === 'opp' ? oppSide : controller);
      const mod = { id: makeModId('deckimm'), type: 'SET_RESTRICTION', restriction: 'CANNOT_MILL', side: targetSide, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'DECK_IMMUNITY_SET', side: targetSide });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'ENTER_SOUL_STATE': {
      const p = state.players[controller];
      if (!sourceCard) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_SOURCE_CARD' };
      const removed = removeCardPhysical(state, sourceCard.id);
      const card = removed ? removed.card : sourceCard;
      card.inSoulState = true;
      if (!Array.isArray(p.soulState)) p.soulState = [];
      if (!p.soulState.some(c => c.id === card.id)) p.soulState.push(card);
      if (events) await events.emit({ type: 'ENTERED_SOUL_STATE', card, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, card };
    }

    case 'USE_FROM_SOUL_STATE': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('usesoul'), type: 'USE_FROM_SOUL_STATE', cardType: op.cardType || null, timing: op.timing || 'ANY', side: controller, sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'USE_FROM_SOUL_STATE_ENABLED', modifier: mod, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'ACTIVATE_REBIRTH': {
      const stack = sourceStack || state.players[controller]?.field.find(st => st.top?.id === sourceCard?.id) || null;
      const card = stack?.top || sourceCard || null;
      if (!card) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_REBIRTH_SOURCE' };
      card.isRebirthed = true;
      if (stack) stack.isRebirthed = true;
      if (events) await events.emit({ type: 'REBIRTH_ACTIVATED', card, stack, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, cardId: card.id };
    }

    case 'ACTIVATE_SOUL_DRIVE': {
      const p = state.players[controller];
      const targetRes = op.target
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'self' })
        : { success: true, targets: (p.field || []).filter(st => st.top?.type === 'Ultimate').map(st => ({ stack: st, side: controller })) };
      const ultStack = targetRes.targets?.[0]?.stack || sourceStack || null;
      if (!ultStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_ULTIMATE_FOR_SOUL_DRIVE' };
      ultStack.soulDriveActivated = true;
      if (events) await events.emit({ type: 'SOUL_DRIVE_ACTIVATED', stack: ultStack, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, stackId: ultStack.id };
    }

    case 'RETRIEVE_CORES': {
      const p = state.players[controller];
      const count = Math.max(1, Number(op.count || 1));
      const fromZ = normalizeZoneKey(op.from || 'grave');
      const toZ = normalizeZoneKey(op.to || 'reserve');
      const moveFromZ = (fromZ === 'grave' || fromZ === 'trash') ? 'trash' : fromZ;
      const avail = moveFromZ === 'trash' ? (p.trash?.normal ?? p.graveCores?.normal ?? 0) : (p.reserve?.normal || 0);
      const actual = op.upTo ? Math.min(count, avail) : count;
      if (actual === 0 || (!op.upTo && avail < actual)) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'INSUFFICIENT_CORES_TO_RETRIEVE' };
      }
      const moved = await moveCore(state, actual, { zone: moveFromZ, side: controller }, { zone: toZ, side: controller, stackId: toZ === 'field' ? sourceStack?.id : undefined }, { cause: 'effect', by: controller, isSoulCore: false, sourceCard }, events);
      return { status: moved ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(moved), applied: Boolean(moved), count: moved ? actual : 0 };
    }

    case 'SYMBOL_MODIFIER': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const syms = op.symbols || (op.color ? { [op.color]: op.count || 1 } : {});
      const mod = { id: makeModId('symmod'), type: 'SYMBOL_MODIFIER', cardType: op.cardType || 'Magic', symbols: syms, color: op.color || null, side: op.side || controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'SYMBOL_MODIFIER_APPLIED', modifier: mod, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'COUNT_MODIFIER':
    case 'COUNT_AS_MULTIPLE': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('cntmod'), type: op.op, multiplier: Number(op.countAs ?? op.multiplier ?? 2), cardType: op.cardType || 'Spirit', filter: op.filter || null, forScope: op.forScope || 'all', targetStackId: sourceStack?.id || null, side: controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'COUNT_MODIFIER_APPLIED', multiplier: mod.multiplier, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'BP_FORMULA': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('bpform'), type: 'BP_FORMULA', per: op.per || 'cores_on_spirit', multiplier: Number(op.multiplier ?? op.amountPerCore ?? 10000), mode: op.mode || 'SET', targetStackId: sourceStack?.id || null, side: controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'BP_FORMULA_APPLIED', modifier: mod, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'END_STEP': {
      state.stepEndedByEffect = true;
      const endedStep = state.step;
      if (events) await events.emit({ type: 'STEP_ENDED', step: endedStep, immediate: Boolean(op.immediate ?? true), player: controller });
      return { status: 'SUCCESS', success: true, applied: true, endedStep };
    }

    case 'SPECIAL_WIN':
    case 'WIN_GAME': {
      const winnerSide = op.winner === 'opp' || op.winner === 'opponent' ? oppSide : controller;
      state.winner = winnerSide;
      state.winReason = op.reason || op.op;
      if (events) await events.emit({ type: 'GAME_ENDED', winner: winnerSide, reason: state.winReason });
      return { status: 'SUCCESS', success: true, applied: true, winner: winnerSide, reason: state.winReason };
    }

    case 'LOSE_EFFECTS':
    case 'TREAT_AS_VANILLA': {
      const targetRes = op.target
        ? await resolveTargets(state, op.target, ctx, promptResolver, { defaultSide: 'opp' })
        : { success: true, targets: sourceStack ? [{ stack: sourceStack, side: controller }] : [] };
      const targets = targetRes.targets || [];
      if (targets.length === 0) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_LEGAL_TARGETS' };
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mods = [];
      for (const item of targets) {
        const stId = item.stack?.id || null;
        const cId = item.stack?.top?.id || item.card?.id || null;
        const mod = { id: makeModId('loseeff'), type: op.op, cannotGainNew: Boolean(op.cannotGainNew ?? true), targetStackId: stId, targetCardId: cId, side: item.side || null, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
        state.modifiers.push(mod);
        mods.push(mod);
      }
      if (events) await events.emit({ type: 'EFFECTS_LOST', count: mods.length, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, count: mods.length, modifiers: mods };
    }

    case 'ADD_FAMILY': {
      const fams = Array.isArray(op.families) ? op.families : (op.family ? [op.family] : []);
      const targetStack = sourceStack || null;
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('addfam'), type: 'ADD_FAMILY', families: fams, targetStackId: targetStack?.id || null, targetCardId: sourceCard?.id || null, side: controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (events) await events.emit({ type: 'FAMILY_ADDED', families: fams, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, families: fams, modifier: mod };
    }

    // ==================== REMAINING DETERMINISTIC OPS ====================
    case 'SELECT_TARGET': {
      const res = await resolveTargets(state, op.target || op.filter || { side: 'self', types: ['Spirit'] }, ctx, promptResolver, { defaultSide: 'self' });
      if (!res.success || !res.targets?.length) {
        return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_LEGAL_TARGETS', isTargetingResult: true, selectedTargets: [] };
      }
      ctx.previousTarget = res.targets[0].stack || res.targets[0].card;
      ctx.selectedTargets = res.targets;
      return { status: 'SUCCESS', success: true, applied: true, targets: res.targets, selectedTargets: res.targets, isTargetingResult: true };
    }

    case 'SUMMON_MULTI': {
      const p = state.players[controller];
      const fromZ = normalizeZoneKey(op.from || 'hand');
      const pool = (p[fromZ] || []).filter(c => !op.filter || matchesCardFilter(c, op.filter));
      const limit = op.count ? Math.min(Number(op.count), pool.length) : pool.length;
      const summoned = [];
      for (let i = 0; i < limit; i++) {
        const card = pool[i];
        if ((p.reserve?.normal || 0) < 1 && !op.free) break;
        const removed = removeCardPhysical(state, card.id);
        if (removed) {
          if (!op.free && (p.reserve?.normal || 0) >= 1) {
            p.reserve.normal -= 1;
            const st = createFieldStack(removed.card, { normal: 1, soul: 0 });
            st.owner = controller;
            p.field.push(st);
            summoned.push(st);
          } else {
            const st = createFieldStack(removed.card, { normal: 0, soul: 0 });
            st.owner = controller;
            p.field.push(st);
            summoned.push(st);
          }
        }
      }
      if (events && summoned.length > 0) await events.emit({ type: 'SUMMONED', count: summoned.length, player: controller });
      return { status: summoned.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: summoned.length > 0, applied: summoned.length > 0, count: summoned.length, stacks: summoned };
    }

    case 'SWAP_CORES': {
      const res = await resolveTargets(state, op.target || op.targets || { side: 'both', types: ['Spirit', 'Ultimate'], count: 2 }, ctx, promptResolver, { defaultSide: 'both' });
      const stacks = (res.targets || []).map(t => t.stack).filter(Boolean);
      if (stacks.length < 2) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NEED_TWO_STACKS' };
      const [s1, s2] = stacks;
      const temp = { ...s1.cores };
      s1.cores = { ...s2.cores };
      s2.cores = temp;
      if (events) await events.emit({ type: 'CORES_SWAPPED', stacks: [s1.id, s2.id], player: controller });
      return { status: 'SUCCESS', success: true, applied: true, stackIds: [s1.id, s2.id] };
    }

    case 'TREAT_NAME':
    case 'TREAT_COST':
    case 'TREAT_CORE_COUNT': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('treat'), type: op.op, treatedAsName: op.treatedAsName || op.name || null, treatedCost: op.treatedCost ?? op.cost ?? null, cost: op.cost ?? null, targetStackId: op.targetStackId || null, targetFilter: op.filter || (op.cost !== undefined && op.op === 'TREAT_NAME' ? { costLte: op.cost, costGte: op.cost } : null), side: op.side || controller, duration: op.duration || 'WHILE_IN_ZONE', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'TRIGGERED_BUFF':
    case 'TRIGGERED_ACTION': {
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const w = { id: makeModId('trigact'), type: op.op, trigger: op.trigger, amount: op.amount || 0, action: op.action || null, side: controller, sourceCardId: sourceCard?.id || null };
      state.watchers.push(w);
      return { status: 'SUCCESS', success: true, applied: true, watcher: w };
    }

    case 'NEGATE_MAGIC': {
      state.pendingMagicNegated = true;
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const w = { id: makeModId('negmag'), type: 'NEGATE_MAGIC', scope: op.scope || 'battle', side: controller, duration: 'THIS_STEP', sourceCardId: sourceCard?.id || null };
      state.watchers.push(w);
      if (events) await events.emit({ type: 'MAGIC_NEGATED', player: controller });
      return { status: 'SUCCESS', success: true, applied: true, modifier: w };
    }

    case 'TAKE_CONTROL': {
      const oppField = state.players[oppSide]?.field || [];
      const myField = state.players[controller]?.field || [];
      const targetRes = await resolveTargets(state, op.target || { side: 'opp', types: ['Spirit'], ...(op.filter || {}) }, ctx, promptResolver, { defaultSide: 'opp' });
      const tgtStack = targetRes.targets?.[0]?.stack || null;
      if (!tgtStack) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_LEGAL_TARGETS' };
      const idx = oppField.findIndex(s => s.id === tgtStack.id);
      if (idx === -1) return { status: 'REJECTED', success: false, applied: false, reason: 'STACK_NOT_FOUND' };
      const [movedStack] = oppField.splice(idx, 1);
      movedStack.originalOwner = movedStack.owner || oppSide;
      movedStack.owner = controller;
      if (movedStack.top) movedStack.top.currentOwner = controller;
      myField.push(movedStack);
      if (events) await events.emit({ type: 'CONTROL_TAKEN', stack: movedStack, fromSide: oppSide, toSide: controller });
      return { status: 'SUCCESS', success: true, applied: true, stackId: movedStack.id };
    }

    case 'RETURN_CONTROL': {
      const myField = state.players[controller]?.field || [];
      const oppField = state.players[oppSide]?.field || [];
      const idx = myField.findIndex(st => st.originalOwner && st.originalOwner !== controller);
      if (idx === -1) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_BORROWED_STACK' };
      const [st] = myField.splice(idx, 1);
      const returnTo = st.originalOwner || oppSide;
      st.owner = returnTo;
      if (op.state === 'exhausted') st.state = 'EXHAUSTED';
      state.players[returnTo].field.push(st);
      if (events) await events.emit({ type: 'CONTROL_RETURNED', stack: st, toSide: returnTo });
      return { status: 'SUCCESS', success: true, applied: true, stackId: st.id };
    }

    case 'CONTROL_RULE':
    case 'CORE_LOCK': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const tgtId = op.target === 'PREVIOUS_TARGET' ? (ctx.previousTarget?.id || null) : (sourceStack?.id || null);
      const mod = { id: makeModId('corelock'), type: op.op, targetStackId: tgtId, coresLocked: true, side: controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      if (tgtId) {
        for (const s of ['player', 'opponent']) {
          const st = state.players[s]?.field.find(x => x.id === tgtId);
          if (st) st.coreLocked = true;
        }
      }
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'GUARD_TRIGGER':
    case 'BEFORE_ADVENT_TRIGGER':
    case 'COPY_TRIGGER':
    case 'EXPANSION':
    case 'EXPAND_TARGETS':
    case 'ENHANCE_KEYWORD':
    case 'GRANT_EFFECT':
    case 'HEADER':
    case 'CARD_PLAY_PERMISSION':
    case 'NON_STACKABLE':
    case 'LIMIT_ONCE_PER_TURN':
    case 'IGNORE_CONDITIONS':
    case 'IGNORE_LEVELS':
    case 'SIMULTANEOUS_BATTLE':
    case 'TIMING_MODIFIER':
    case 'USE_ACCEL':
    case 'REVEAL_FROM_HAND_COST':
    case 'SEND_CORE_TO_VOID': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('ruleop'), type: op.op, ...op, op: undefined, side: op.side || controller, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'SEARCH_DECK': {
      const p = state.players[controller];
      const matches = (p.deck || []).filter(c => !op.filter || matchesCardFilter(c, op.filter));
      const cnt = Math.min(matches.length, Math.max(1, Number(op.count || 1)));
      const dest = normalizeZoneKey(op.destination || 'hand');
      const moved = [];
      for (let i = 0; i < cnt; i++) {
        const ok = await moveCard(state, matches[i], dest, controller, { cause: 'search_deck', sourceCard }, events);
        if (ok) moved.push(matches[i]);
      }
      if (events && moved.length > 0) await events.emit({ type: 'DECK_SEARCHED', cards: moved, destination: dest, player: controller });
      return { status: moved.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: moved.length > 0, applied: moved.length > 0, count: moved.length, cards: moved };
    }

    case 'CHOOSE_LEVEL': {
      const lvls = Array.isArray(op.levels) ? op.levels : [1, 2, 3];
      const chosen = lvls[0];
      ctx.chosenLevel = chosen;
      state.chosenLevel = chosen;
      return { status: 'SUCCESS', success: true, applied: true, level: chosen };
    }

    case 'SWITCH_BP':
    case 'EXCHANGE_BP': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('swapbp'), type: op.op, rule: 'EXCHANGE_BP', side: 'both', duration: 'THIS_BATTLE', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'OPPONENT_CHOICE': {
      const options = Array.isArray(op.options) ? op.options : (Array.isArray(op.choices) ? op.choices : []);
      if (options.length === 0) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_CHOICE_OPTIONS' };
      let chosen = null;
      if (promptResolver && typeof promptResolver.selectOption === 'function') {
        const idx = await promptResolver.selectOption(options, { side: oppSide, title: 'Opponent chooses effect' });
        chosen = options[typeof idx === 'number' && options[idx] ? idx : 0];
      } else if (!state?.matchContext || state.matchContext.canSimulate(oppSide)) {
        chosen = options[0];
      } else {
        return { status: 'UNRESOLVED', success: false, applied: false, reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN' };
      }
      return { status: 'SUCCESS', success: true, applied: true, chosenOption: chosen };
    }

    case 'RETURN_DECK_BOTTOM':
    case 'BOUNCE_TO_DECKBOTTOM': {
      const p = state.players[controller];
      if (op.target === 'SELF' && sourceCard) {
        const moved = await moveCard(state, sourceCard, 'deck_bottom', controller, { cause: 'effect', sourceCard }, events);
        return { status: moved ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(moved), applied: Boolean(moved) };
      }
      const fromZ = normalizeZoneKey(op.from || 'revealed');
      const pool = Array.isArray(ctx.revealedCards) && fromZ === 'revealed' ? ctx.revealedCards : (p[fromZ] || []);
      const count = Math.min(pool.length, Math.max(1, Number(op.count || pool.length)));
      const returned = [];
      for (let i = 0; i < count; i++) {
        const c = pool[0];
        if (!c) break;
        const ok = await moveCard(state, c, 'deck_bottom', controller, { cause: 'effect', sourceCard }, events);
        if (ok) {
          returned.push(c);
          if (pool === ctx.revealedCards) pool.shift();
        } else break;
      }
      return { status: returned.length > 0 ? 'SUCCESS' : 'NO_OP_BY_RULE', success: returned.length > 0, applied: returned.length > 0, count: returned.length, cards: returned };
    }

    case 'DISCARD_HAND_MAX': {
      const trigCnt = Number(op.triggerCount ?? 4);
      const tgtCnt = Number(op.targetCount ?? 3);
      const sides = op.side === 'self' ? [controller] : (op.side === 'opp' ? [oppSide] : ['player', 'opponent']);
      const discarded = [];
      for (const s of sides) {
        if ((state.players[s]?.hand?.length || 0) >= trigCnt) {
          let guard = state.players[s].hand.length + 2;
          while ((state.players[s]?.hand?.length || 0) > tgtCnt && guard-- > 0) {
            const h = state.players[s].hand;
            const c = h[h.length - 1];
            const ok = await moveCard(state, c, 'grave', s, { cause: 'discard', sourceCard }, events);
            if (ok) discarded.push(c); else break;
          }
        }
      }
      return { status: 'SUCCESS', success: true, applied: true, discardedCount: discarded.length, cards: discarded };
    }

    case 'EXCHANGE_CORE': {
      const p = state.players[controller];
      const st = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : null);
      if (!st || (p.life || 0) < 1 || (st.cores?.normal || 0) < 1) {
        return { status: 'REJECTED', success: false, applied: false, reason: 'INSUFFICIENT_CORES_FOR_EXCHANGE' };
      }
      // Swap Soul Core in life with 1 normal core on stack (exact total conservation)
      p.soulCoreInLife = false;
      p.life -= 1;
      st.cores.normal -= 1;
      st.cores.soul = (st.cores.soul || 0) + 1;
      p.life += 1;
      return { status: 'SUCCESS', success: true, applied: true, stackId: st.id };
    }

    case 'SCHEDULED_DESTROY': {
      if (!Array.isArray(state.watchers)) state.watchers = [];
      const sch = { id: makeModId('schdest'), type: 'SCHEDULED_DESTROY', timing: op.timing || 'END_STEP', target: op.target || null, scope: op.scope || 'summoned_by_effect', side: controller, sourceCardId: sourceCard?.id || null };
      state.watchers.push(sch);
      return { status: 'SUCCESS', success: true, applied: true, scheduled: sch };
    }

    case 'SEPARATE_BRAVE': {
      const p = state.players[controller];
      const host = sourceStack || p.field.find(st => (st.braves || []).length > 0) || null;
      if (!host || !(host.braves || []).length) return { status: 'NO_OP_BY_RULE', success: false, applied: false, reason: 'NO_BRAVE_ATTACHED' };
      const brave = host.braves.pop();
      const newSt = createFieldStack(brave, { normal: 0, soul: 0 });
      newSt.owner = controller;
      p.field.push(newSt);
      return { status: 'SUCCESS', success: true, applied: true, detachedBraveId: brave.id, newStackId: newSt.id };
    }

    case 'PAY_COST': {
      return { status: 'SUCCESS', success: true, applied: true, costPaid: true };
    }

    case 'LOSE_IMMUNITY': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('loseimm'), type: 'LOSE_IMMUNITY', colors: Array.isArray(op.colors) ? op.colors : [], loseAll: Boolean(op.loseAll ?? (!op.colors || op.colors.length === 0)), side: op.side || 'both', targetFilter: op.target || null, duration: op.duration || 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'CAN_ATTACK': {
      if (!Array.isArray(state.modifiers)) state.modifiers = [];
      const mod = { id: makeModId('canatk'), type: 'CAN_ATTACK', targetStackId: sourceStack?.id || null, side: controller, duration: 'THIS_TURN', sourceCardId: sourceCard?.id || null };
      state.modifiers.push(mod);
      return { status: 'SUCCESS', success: true, applied: true, modifier: mod };
    }

    case 'BANISH_SOUL_CORE_VOID': {
      const p = state.players[controller];
      const st = sourceStack || p.field.find(s => (s.cores?.soul || 0) > 0) || null;
      if (!st || !(st.cores?.soul > 0)) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_SOUL_CORE_ON_STACK' };
      st.cores.soul = 0;
      p.soulCoreBanishedFromGame = true;
      state.banishedSoulCore = (state.banishedSoulCore || 0) + 1;
      if (events) await events.emit({ type: 'SOUL_CORE_BANISHED_FROM_GAME', stack: st, player: controller });
      return { status: 'SUCCESS', success: true, applied: true, stackId: st.id };
    }

    case 'BANISH_COST': {
      const p = state.players[controller];
      const idx = (p.grave || []).findIndex(c => !op.filter || matchesCardFilter(c, op.filter));
      if (idx === -1) return { status: 'REJECTED', success: false, applied: false, reason: 'NO_ELIGIBLE_BANISH_COST' };
      const [c] = p.grave.splice(idx, 1);
      p.removed.push(c);
      return { status: 'SUCCESS', success: true, applied: true, banishedCard: c };
    }

    case 'SEND_CORES_TO_VOID': {
      const targetSide = (op.side === 'opp' || op.side === 'opponent') ? oppSide : controller;
      const p = state.players[targetSide];
      const cnt = Number(op.count || 1);
      const fromZ = normalizeZoneKey(op.zone || 'reserve');
      if (fromZ === 'field') {
        const st = (p.field || []).find(s => (s.cores?.normal || 0) > 0);
        if (!st) return { status: 'NO_OP_BY_RULE', success: false, applied: false, count: 0 };
        const actual = Math.min(cnt, st.cores.normal || 0);
        const moved = await moveCore(state, actual, { zone: 'field', side: targetSide, stackId: st.id }, { zone: 'void' }, { cause: 'effect', by: controller, sourceCard }, events);
        return { status: moved ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(moved), applied: Boolean(moved), count: moved ? actual : 0 };
      }
      const avail = fromZ === 'reserve' ? (p.reserve?.normal || 0) : cnt;
      const actual = Math.min(cnt, avail);
      if (actual <= 0) return { status: 'NO_OP_BY_RULE', success: false, applied: false, count: 0 };
      const moved = await moveCore(state, actual, { zone: fromZ, side: targetSide }, { zone: 'void' }, { cause: 'effect', by: controller, sourceCard }, events);
      return { status: moved ? 'SUCCESS' : 'NO_OP_BY_RULE', success: Boolean(moved), applied: Boolean(moved), count: moved ? actual : 0 };
    }

    case 'VARIABLE_PAYMENT_EFFECT': {
      const tiers = op.tiers || {};
      const paid = Number(op.amount ?? ctx.paidCost ?? 0);
      return { status: 'SUCCESS', success: true, applied: true, paid, tierMatched: tiers[paid] || null };
    }

    case 'MODIFY_EFFECT_LIMIT': {
      const delta = Number(op.delta ?? op.amount ?? 1);
      if (!state.modifiers) state.modifiers = [];
      state.modifiers.push({
        type: 'EFFECT_LIMIT_DELTA',
        side: controller,
        delta,
        duration: op.duration || 'TURN',
        sourceCardId: sourceCard?.uid || sourceCard?.cardNumber || null
      });
      if (events) events.push({ type: 'MODIFY_EFFECT_LIMIT', side: controller, delta });
      return { status: 'SUCCESS', success: true, applied: true, delta };
    }

    case 'COST_RULE': {
      const targetSide = op.side === 'opp' ? oppSide : controller;
      if (!state.modifiers) state.modifiers = [];
      state.modifiers.push({
        type: 'COST_RULE',
        side: targetSide,
        rule: op.rule || 'MODIFIED_COST_PAYMENT',
        duration: op.duration || 'TURN',
        sourceCardId: sourceCard?.uid || sourceCard?.cardNumber || null
      });
      if (events) events.push({ type: 'COST_RULE', side: targetSide, rule: op.rule || 'MODIFIED_COST_PAYMENT' });
      return { status: 'SUCCESS', success: true, applied: true, side: targetSide };
    }

    default:
      return { status: 'UNSUPPORTED', success: false, reason: 'UNHANDLED_OPERATION', unhandledOp: op.op };
  }
}
