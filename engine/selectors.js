/**
 * engine/selectors.js
 * 
 * Deterministic target selection and validation based on compiled IR selectors.
 * Enforces Armor / Heavy Armor protection (Rule 3.1: any effect affecting a card targets it).
 */

import { computeEffectiveBP, isImmune, computeLevel, computeSymbols, computeFieldSymbols, isTargetProtectedFrom } from './continuous.js';
import { calculateEffectiveCost } from './payment.js';
import { hasTeam } from './prerequisites.js';

const SUPPORTED_COMP_PROPS = new Set(['BP', 'COST', 'CORES', 'LEVEL', 'SYMBOLS']);
const SUPPORTED_COMP_REFS = new Set(['self', 'target', 'previous_target', 'battling', 'effect_card', 'allied_spirit']);
const SUPPORTED_COMP_OPS = new Set(['LTE', 'LT', 'GTE', 'GT', 'EQ', 'NEQ']);

export function evaluateComparisonStrict(state, comp, candidate, context = {}) {
  if (!comp) return 'TRUE';
  if (typeof comp !== 'object') return 'UNSUPPORTED';

  const prop = String(comp.property || '').trim().toUpperCase();
  const op = String(comp.operator || '').trim().toUpperCase();
  const ref = String(comp.reference || '').trim().toLowerCase();

  if (!SUPPORTED_COMP_PROPS.has(prop) || !SUPPORTED_COMP_OPS.has(op) || !SUPPORTED_COMP_REFS.has(ref)) {
    return 'UNSUPPORTED';
  }
  if (!state || !state.players || !candidate) {
    return 'FALSE';
  }

  let refValue = null;

  if (ref === 'self') {
    const srcStack = context.sourceStack || (context.controller && state.players[context.controller]?.field?.find(st => (st.top?.id || st.id) === (context.sourceCard?.id || context.sourceCard))) || (context.controller && state.players[context.controller]?.nexus?.find(st => (st.top?.id || st.id) === (context.sourceCard?.id || context.sourceCard)));
    if (srcStack) {
      if (prop === 'BP') refValue = computeEffectiveBP(state, srcStack);
      else if (prop === 'COST') refValue = calculateEffectiveCost(state, srcStack.top || srcStack.card, context.controller);
      else if (prop === 'CORES') refValue = typeof srcStack.cores === 'number' ? srcStack.cores : ((srcStack.cores?.normal || 0) + (srcStack.cores?.soul ? 1 : 0));
      else if (prop === 'LEVEL') refValue = computeLevel(srcStack, state);
      else if (prop === 'SYMBOLS') refValue = computeSymbols(state, srcStack).length;
    } else if (context.sourceCard) {
      const card = context.sourceCard;
      if (prop === 'BP') refValue = card.bp ?? null;
      else if (prop === 'COST') refValue = card.cost ?? null;
      else if (prop === 'CORES') refValue = 0;
      else if (prop === 'LEVEL') refValue = 1;
      else if (prop === 'SYMBOLS') refValue = Array.isArray(card.symbols) ? card.symbols.length : (card.color ? 1 : null);
    }
  } else if (ref === 'target' || ref === 'previous_target') {
    const prev = context.previousTarget?.stack || context.previousTarget?.card || context.previousTarget;
    if (prev) {
      if (prev.top || prev.cores !== undefined) {
        if (prop === 'BP') refValue = computeEffectiveBP(state, prev);
        else if (prop === 'COST') refValue = calculateEffectiveCost(state, prev.top || prev.card, prev.controller || prev.owner);
        else if (prop === 'CORES') refValue = typeof prev.cores === 'number' ? prev.cores : ((prev.cores?.normal || 0) + (prev.cores?.soul ? 1 : 0));
        else if (prop === 'LEVEL') refValue = computeLevel(prev, state);
        else if (prop === 'SYMBOLS') refValue = computeSymbols(state, prev).length;
      } else {
        if (prop === 'BP') refValue = prev.bp ?? null;
        else if (prop === 'COST') refValue = prev.cost ?? null;
        else if (prop === 'CORES') refValue = 0;
        else if (prop === 'LEVEL') refValue = 1;
        else if (prop === 'SYMBOLS') refValue = Array.isArray(prev.symbols) ? prev.symbols.length : (prev.color ? 1 : null);
      }
    }
  } else if (ref === 'battling') {
    const bId = state.combat ? (state.combat.attackerSide === context.controller ? state.combat.attackerStackId : state.combat.blockerStackId) : null;
    const bStack = bId ? (state.players[context.controller]?.field || []).find(st => st.id === bId) : null;
    if (bStack) {
      if (prop === 'BP') refValue = computeEffectiveBP(state, bStack);
      else if (prop === 'COST') refValue = calculateEffectiveCost(state, bStack.top, context.controller);
      else if (prop === 'CORES') refValue = typeof bStack.cores === 'number' ? bStack.cores : ((bStack.cores?.normal || 0) + (bStack.cores?.soul ? 1 : 0));
      else if (prop === 'LEVEL') refValue = computeLevel(bStack, state);
      else if (prop === 'SYMBOLS') refValue = computeSymbols(state, bStack).length;
    }
  } else if (ref === 'effect_card') {
    const effCard = context.effectCard || context.previousResult?.cards?.[0] || context.previousResult?.card || context.discardedCards?.[0];
    if (effCard) {
      if (prop === 'COST') refValue = effCard.cost ?? null;
      else if (prop === 'BP') refValue = effCard.bp ?? null;
      else if (prop === 'LEVEL') refValue = 1;
      else if (prop === 'CORES') refValue = 0;
      else if (prop === 'SYMBOLS') refValue = Array.isArray(effCard.symbols) ? effCard.symbols.length : (effCard.color ? 1 : null);
    }
  } else if (ref === 'allied_spirit') {
    const spirits = (state.players[context.controller]?.field || []).filter(st => st.top?.type === 'Spirit');
    if (spirits.length > 0) {
      const vals = spirits.map(st => {
        if (prop === 'COST') return calculateEffectiveCost(state, st.top, context.controller);
        if (prop === 'BP') return computeEffectiveBP(state, st);
        if (prop === 'LEVEL') return computeLevel(st, state);
        if (prop === 'CORES') return typeof st.cores === 'number' ? st.cores : ((st.cores?.normal || 0) + (st.cores?.soul ? 1 : 0));
        if (prop === 'SYMBOLS') return computeSymbols(state, st).length;
        return null;
      }).filter(v => typeof v === 'number' && Number.isFinite(v));
      if (vals.length > 0) refValue = Math.max(...vals);
    }
  }

  if (typeof refValue !== 'number' || !Number.isFinite(refValue)) {
    return 'FALSE';
  }

  let candValue = null;
  const stack = candidate.stack;
  const card = candidate.card || stack?.top || candidate;

  if (prop === 'BP') {
    candValue = candidate.bp !== undefined ? candidate.bp : (stack ? computeEffectiveBP(state, stack) : (card?.bp ?? null));
  } else if (prop === 'COST') {
    candValue = candidate.cost !== undefined ? candidate.cost : (card ? calculateEffectiveCost(state, card, candidate.side || 'opponent') : null);
  } else if (prop === 'CORES') {
    candValue = stack ? (typeof stack.cores === 'number' ? stack.cores : ((stack.cores?.normal || 0) + (stack.cores?.soul ? 1 : 0))) : null;
  } else if (prop === 'LEVEL') {
    candValue = stack ? computeLevel(stack, state) : null;
  } else if (prop === 'SYMBOLS') {
    candValue = stack ? computeSymbols(state, stack).length : (Array.isArray(card?.symbols) ? card.symbols.length : (card?.color ? 1 : null));
  }

  if (typeof candValue !== 'number' || !Number.isFinite(candValue)) {
    return 'FALSE';
  }

  if (op === 'LTE') return candValue <= refValue ? 'TRUE' : 'FALSE';
  if (op === 'LT') return candValue < refValue ? 'TRUE' : 'FALSE';
  if (op === 'GTE') return candValue >= refValue ? 'TRUE' : 'FALSE';
  if (op === 'GT') return candValue > refValue ? 'TRUE' : 'FALSE';
  if (op === 'EQ') return candValue === refValue ? 'TRUE' : 'FALSE';
  if (op === 'NEQ') return candValue !== refValue ? 'TRUE' : 'FALSE';

  return 'UNSUPPORTED';
}

export function evaluateComparison(state, comp, candidate, context = {}) {
  return evaluateComparisonStrict(state, comp, candidate, context) === 'TRUE';
}

export const CANONICAL_ZONES = Object.freeze({
  DECK: 'deck',
  HAND: 'hand',
  FIELD: 'field',
  NEXUS: 'nexus',
  GRAVE: 'grave',
  REMOVED: 'removed',
  REVEALED: 'revealed',
  BURST: 'burst',
  MIRAGE: 'mirage',
  UNDER: 'under',
  BRAVES: 'braves'
});

export function buildCandidateDescriptor({ type = 'card', stack = null, card = null, side = 'player', zone = 'field', bp = undefined, cost = undefined }) {
  const cardObj = card || stack?.top || null;
  const cardId = cardObj?.id || null;
  const stackId = stack?.id || null;
  const normZone = normalizeCardZone(zone) || zone || 'field';
  const idPart = cardId || cardObj?.uid || stackId || cardObj?.cardNumber || 'unknown';
  const candidateId = `${side}:${normZone}:${stackId || ''}:${idPart}`;
  return {
    candidateId,
    type,
    ...(stack ? { stack, stackId } : { stackId: null }),
    card: cardObj,
    cardId,
    cardNumber: cardObj?.cardNumber || cardObj?.card_number || null,
    cardType: cardObj?.type || null,
    uid: cardObj?.uid || stack?.uid || stackId || cardId,
    id: stackId || cardId || cardObj?.uid || candidateId,
    name: cardObj?.name || null,
    side,
    zone: normZone,
    owner: cardObj?.owner || side,
    controller: stack?.owner || side,
    ...(bp !== undefined ? { bp } : {}),
    ...(cost !== undefined ? { cost } : {})
  };
}

function matchesCommonCardFilters(card, cost, state, s, targetTypes, filters, selector, context) {
  if (!card) return false;
  if (targetTypes.length > 0 && !targetTypes.includes('Any') && !targetTypes.includes('Card')) {
    const matchedType = targetTypes.some(t => {
      const lowT = String(t).toLowerCase();
      const cardT = String(card.type || 'Spirit').toLowerCase();
      if (lowT === 'grandwalker nexus') {
        const fams = Array.isArray(card.families) ? card.families : [card.family].filter(Boolean);
        return cardT.includes('grandwalker') || (cardT.includes('nexus') && fams.some(f => String(f).toLowerCase().includes('grandwalker')));
      }
      return cardT === lowT || cardT.includes(lowT);
    });
    if (!matchedType) return false;
  }
  if (filters.costLte !== undefined && cost > filters.costLte) return false;
  if (filters.costGte !== undefined && cost < filters.costGte) return false;
  if (filters.costLt !== undefined && cost >= filters.costLt) return false;
  if (filters.costGt !== undefined && cost <= filters.costGt) return false;
  if (filters.costEq !== undefined && cost !== filters.costEq) return false;
  if (selector.maxTotalCost !== undefined && cost > selector.maxTotalCost) return false;
  if (filters.bpLte !== undefined && (card.bp || 0) > filters.bpLte) return false;
  if (filters.bpGte !== undefined && (card.bp || 0) < filters.bpGte) return false;
  if (filters.family || filters.families) {
    const famQuery = String(filters.family || filters.families).toLowerCase();
    const fams = card.families || (card.family ? [card.family] : []);
    if (!fams.some(f => String(f).toLowerCase().includes(famQuery))) return false;
  }
  if (filters.color || filters.colors) {
    const colorQuery = String(filters.color || filters.colors).toLowerCase();
    const cols = card.colors || (card.color ? [card.color] : []);
    if (!cols.some(c => String(c).toLowerCase() === colorQuery)) return false;
  }
  if (filters.nameIncludes && !String(card.name || '').toLowerCase().includes(String(filters.nameIncludes).toLowerCase())) return false;
  if (filters.name && !String(card.name || '').toLowerCase().includes(String(filters.name).toLowerCase())) return false;
  if (filters.exactName && String(card.name || '').toLowerCase() !== String(filters.exactName).toLowerCase()) return false;
  if (filters.team || filters.teams) {
    const teamQueries = Array.isArray(filters.teams) ? filters.teams : [filters.team || filters.teams];
    if (!teamQueries.some(tq => hasTeam(card, tq, state, null))) return false;
  }
  if (filters.comparison && !evaluateComparison(state, filters.comparison, { card, cost, side: s }, context)) return false;
  return true;
}

function cardExistsOutsideZone(state, cardId, allowedZone, allowedSide) {
  if (!state?.players || !cardId) return false;
  for (const s of ['player', 'opponent']) {
    const p = state.players[s];
    if (!p) continue;
    for (const z of ['deck', 'hand', 'nexus', 'grave', 'removed', 'revealed']) {
      if (s === allowedSide && z === allowedZone) continue;
      if (Array.isArray(p[z]) && p[z].some(c => c && c.id === cardId)) return true;
    }
    if (!(s === allowedSide && allowedZone === 'burst') && p.burst?.id === cardId) return true;
    if (!(s === allowedSide && allowedZone === 'mirage') && p.mirage?.id === cardId) return true;
    for (const st of p.field || []) {
      if (!(s === allowedSide && allowedZone === 'field') && st?.top?.id === cardId) return true;
      if (!(s === allowedSide && allowedZone === 'under') && Array.isArray(st?.under) && st.under.some(c => c && c.id === cardId)) return true;
      if (!(s === allowedSide && allowedZone === 'braves') && Array.isArray(st?.braves) && st.braves.some(c => c && c.id === cardId)) return true;
    }
  }
  return false;
}

export function queryCandidates(state, selector = {}, context = {}) {
  const side = selector.side || 'opp';
  const targetSides = (side === 'both' || side === 'either')
    ? ['player', 'opponent']
    : [(side === 'opp' || side === 'opponent')
        ? (context.controller === 'opponent' ? 'player' : 'opponent')
        : (context.controller || 'player')];

  const rawZones = Array.isArray(selector.zones) && selector.zones.length > 0
    ? selector.zones
    : [selector.zone || selector.from || 'field'];
  const targetZones = Array.from(new Set(rawZones.map(z => normalizeCardZone(z) || String(z).toLowerCase()).filter(Boolean)));
  const isNonFieldDefault = targetZones.every(z => z !== 'field' && z !== 'nexus');

  const rawTypes = selector.types || (selector.filter?.cardType ? [selector.filter.cardType] : (selector.cardType ? [selector.cardType] : (isNonFieldDefault ? ['Any'] : ['Spirit'])));
  const targetTypes = Array.isArray(rawTypes) ? rawTypes : [rawTypes];
  const filters = {
    ...(selector.filters || {}),
    ...(selector.filter || {}),
    ...(selector.comparison ? { comparison: selector.comparison } : {})
  };
  if (selector.maxBp !== undefined && filters.bpLte === undefined) filters.bpLte = selector.maxBp;
  if (selector.maxCost !== undefined && filters.costLte === undefined) filters.costLte = selector.maxCost;
  if (selector.cost !== undefined && filters.costEq === undefined && typeof selector.cost === 'number') filters.costEq = selector.cost;
  if (filters.cost !== undefined && filters.costEq === undefined && typeof filters.cost === 'number') filters.costEq = filters.cost;
  if (filters.maxBp !== undefined && filters.bpLte === undefined) filters.bpLte = filters.maxBp;
  if (filters.maxCost !== undefined && filters.costLte === undefined) filters.costLte = filters.maxCost;

  const results = [];
  const seenKeys = new Set();
  const pushResult = (desc) => {
    const dedupKey = `${desc.side}:${desc.zone}:${desc.cardId || desc.uid || desc.stackId || ''}`;
    if (desc.cardId || desc.uid || desc.stackId) {
      if (seenKeys.has(dedupKey)) return;
      seenKeys.add(dedupKey);
    }
    results.push(desc);
  };

  for (const s of targetSides) {
    const p = state?.players?.[s] || state?.[s];
    if (!p) continue;
    let cachedFieldSymbols = null;
    const getEffectiveCardCost = (c) => {
      if (!cachedFieldSymbols) cachedFieldSymbols = computeFieldSymbols(state, s);
      return calculateEffectiveCost(state, c, s, cachedFieldSymbols);
    };
    const needsCostInLoop = filters.costLte !== undefined || filters.costGte !== undefined || filters.costLt !== undefined || filters.costGt !== undefined || filters.costEq !== undefined || selector.maxTotalCost !== undefined || selector.mode === 'TOTAL_COST_LTE' || filters.comparison?.property === 'COST';

    const isOpposing = context.controller ? (s !== context.controller) : true;

    for (const zone of targetZones) {
    // 1. FIELD / NEXUS ZONE (Stacks, Braves, and Field Nexuses)
    if (zone === 'field' || zone === 'nexus') {
      // 1a. Field Stacks
      if (zone === 'field' || targetTypes.some(t => String(t).toLowerCase().includes('nexus'))) {
        for (const stack of p.field || []) {
          const top = stack.top || stack.card || stack;
          if (!top) continue;
          const wantedStackId = selector.stackId || filters.stackId;
          const sId = stack.id || stack.uid;
          if (wantedStackId && sId !== wantedStackId && stack.id !== wantedStackId) continue;

          // Type match (Rule: Ultimates are not Spirits)
          const isGrandwalker = (String(top.type || '').toLowerCase().includes('nexus') || String(top.type || '').toLowerCase().includes('grandwalker')) &&
            (String(top.type || '').toLowerCase().includes('grandwalker') || (Array.isArray(top.families) ? top.families : [top.family].filter(Boolean)).some(f => String(f).toLowerCase().includes('grandwalker')));

          const matchesType = targetTypes.length === 0 || targetTypes.includes('Any') || targetTypes.includes('Card') ||
            targetTypes.some(t => {
              const lowT = String(t).toLowerCase();
              const topT = String(top.type || 'Spirit').toLowerCase();
              if (lowT === 'grandwalker nexus' && isGrandwalker) return true;
              return topT === lowT || topT.includes(lowT);
            });
          if (!matchesType) continue;

          // Armor / Heavy Armor immunity check
          const targetedGrandwalker = isGrandwalker && (
            targetTypes.some(type => String(type).toLowerCase() === 'grandwalker nexus') ||
            String(filters.family || '').toLowerCase().includes('grandwalker')
          );
          const effectType = selector.effectType || context.effectType || 'effect';
          const protOpts = { bypassArmor: Boolean(context.bypassArmor || selector.ignoreArmor || filters.ignoreArmor), targetedGrandwalker };
          if (isOpposing && context.sourceCard && (isImmune(state, stack, context.sourceCard, effectType, protOpts) || isTargetProtectedFrom(state, stack, 'target', context.sourceCard, protOpts))) {
            continue;
          }

          // BP filter
          const bp = computeEffectiveBP(state, stack);
          if (filters.bpLte !== undefined && bp > filters.bpLte) continue;
          if (filters.bpGte !== undefined && bp < filters.bpGte) continue;
          if (filters.bpLt !== undefined && bp >= filters.bpLt) continue;
          if (filters.bpGt !== undefined && bp <= filters.bpGt) continue;
          if (filters.bpEq !== undefined && bp !== filters.bpEq) continue;
          if (selector.maxTotalBp !== undefined && bp > selector.maxTotalBp) continue;

          // Cost filter
          const cost = needsCostInLoop ? getEffectiveCardCost(top) : (typeof top.cost === 'number' ? top.cost : 0);
          if (filters.costLte !== undefined && cost > filters.costLte) continue;
          if (filters.costGte !== undefined && cost < filters.costGte) continue;
          if (filters.costLt !== undefined && cost >= filters.costLt) continue;
          if (filters.costGt !== undefined && cost <= filters.costGt) continue;
          if (filters.costEq !== undefined && cost !== filters.costEq) continue;
          if (selector.maxTotalCost !== undefined && cost > selector.maxTotalCost) continue;

          // Level filter
          const level = stack.level || 1;
          if (filters.levelLte !== undefined && level > filters.levelLte) continue;
          if (filters.levelGte !== undefined && level < filters.levelGte) continue;
          if (filters.level !== undefined && level !== filters.level) continue;

          // State filter (e.g. EXHAUSTED, BATTLING)
          if (filters.state) {
            if (String(filters.state).toUpperCase() === 'BATTLING') {
              const isBattling = Boolean(
                (state?.combat && (state.combat.attackerStackId === stack.id || state.combat.blockerStackId === stack.id)) ||
                (state?.battle && (state.battle.attacker?.id === stack.id || state.battle.blocker?.id === stack.id))
              );
              if (!isBattling) continue;
            } else if (String(stack.state || '').toUpperCase() !== String(filters.state).toUpperCase()) {
              continue;
            }
          }

          // Symbol count filter
          if (filters.symbolCount !== undefined) {
            const syms = top.symbols || [top.color || 'Red'];
            if (syms.length !== filters.symbolCount) continue;
          }

          // Family filter
          if (filters.family || filters.families) {
            const famQuery = String(filters.family || filters.families).toLowerCase();
            const fams = top.families || (top.family ? [top.family] : []);
            if (!fams.some(f => String(f).toLowerCase().includes(famQuery))) continue;
          }

          // Team filter
          if (filters.team || filters.teams) {
            const teamQueries = Array.isArray(filters.teams) ? filters.teams : [filters.team || filters.teams];
            if (!teamQueries.some(tq => hasTeam(top, tq, state, stack))) continue;
          }

          // Color filter
          if (filters.color || filters.colors) {
            const colorQuery = String(filters.color || filters.colors).toLowerCase();
            const cols = top.colors || (top.color ? [top.color] : []);
            if (!cols.some(c => String(c).toLowerCase() === colorQuery)) continue;
          }

          // Same family as previous
          if (filters.sameFamilyAsPrevious) {
            const previous = context.previousTarget?.card || context.previousTarget;
            const previousFamilies = Array.isArray(previous?.families)
              ? previous.families
              : (previous?.family ? [previous.family] : []);
            const targetFamilies = Array.isArray(top.families)
              ? top.families
              : (top.family ? [top.family] : []);
            if (!previousFamilies.some(f => targetFamilies.some(t => String(t).toLowerCase() === String(f).toLowerCase()))) continue;
          }

          // Name filters
          if (filters.nameIncludes && !top.name.toLowerCase().includes(filters.nameIncludes.toLowerCase())) continue;
          if (filters.name && !top.name.toLowerCase().includes(filters.name.toLowerCase())) continue;
          if (filters.exactName && top.name.toLowerCase() !== filters.exactName.toLowerCase()) continue;

          // Relative comparison filter
          if (filters.comparison && !evaluateComparison(state, filters.comparison, { stack, card: top, bp, cost, side: s }, context)) continue;

          const reportedZone = (zone === 'nexus' && String(top.type || '').toLowerCase().includes('nexus')) ? 'nexus' : 'field';
          pushResult(buildCandidateDescriptor({
            type: 'stack',
            stack,
            card: top,
            side: s,
            zone: reportedZone,
            bp,
            cost
          }));
        }
      }

      // 1b. Field Braves
      if (zone === 'field') {
        for (const stack of p.field || []) {
          for (const brave of stack.braves || []) {
            if (!targetTypes.includes('Any') && !targetTypes.includes('Card') && !targetTypes.includes('Brave') && !targetTypes.includes(brave.type)) continue;
            if (filters.bpLte !== undefined && (brave.bp || 0) > filters.bpLte) continue;
            if (filters.bpGte !== undefined && (brave.bp || 0) < filters.bpGte) continue;
            if (selector.maxTotalBp !== undefined && (brave.bp || 0) > selector.maxTotalBp) continue;
            const braveCost = calculateEffectiveCost(state, brave, s);
            if (filters.costLte !== undefined && braveCost > filters.costLte) continue;
            if (filters.costGte !== undefined && braveCost < filters.costGte) continue;
            if (selector.maxTotalCost !== undefined && braveCost > selector.maxTotalCost) continue;
            if (filters.comparison && !evaluateComparison(state, filters.comparison, { stack, card: brave, bp: brave.bp || 0, cost: braveCost, side: s }, context)) continue;
            pushResult(buildCandidateDescriptor({ type: 'brave', stack, card: brave, side: s, zone: 'field', bp: brave.bp || 0, cost: braveCost }));
          }
        }
      }

      // 1c. Separate p.nexus list on field
      if (Array.isArray(p.nexus) && (zone === 'nexus' || targetTypes.some(t => String(t).toLowerCase().includes('nexus')) || targetTypes.includes('Any') || targetTypes.includes('Card'))) {
        for (const nexItem of p.nexus) {
          if (!nexItem) continue;
          const nex = nexItem.top || nexItem;
          // Skip if already enumerated via p.field stack
          if (nex.id && seenKeys.has(`${s}:field:${nex.id}`)) continue;
          if (nex.id && seenKeys.has(`${s}:nexus:${nex.id}`)) continue;

          // Armor / Heavy Armor / Immunity check for separate Nexus
          const nexCores = typeof nexItem.cores === 'number'
            ? { normal: nexItem.cores, soul: false }
            : (nexItem.cores || { normal: 0, soul: false });
          const nexStack = nexItem.top ? nexItem : {
            id: nex.id,
            top: nex,
            owner: s,
            cores: nexCores,
            field: [],
            level: nex.level || 1,
            state: nex.state || 'REFRESHED'
          };
          const isGrandwalker = Boolean(
            String(nex.type || '').toLowerCase().includes('grandwalker') ||
            (Array.isArray(nex.families) ? nex.families : [nex.family].filter(Boolean)).some(f => String(f).toLowerCase().includes('grandwalker'))
          );
          const targetedGrandwalker = isGrandwalker && (
            targetTypes.some(type => String(type).toLowerCase() === 'grandwalker nexus') ||
            String(filters.family || '').toLowerCase().includes('grandwalker')
          );
          const effectType = selector.effectType || context.effectType || 'effect';
          const bypassArmor = Boolean(context.bypassArmor || selector.ignoreArmor || filters.ignoreArmor);
          if (isOpposing && context.sourceCard && isImmune(state, nexStack, context.sourceCard, effectType, { bypassArmor, targetedGrandwalker })) {
            continue;
          }

          const nexCost = calculateEffectiveCost(state, nex, s);
          if (filters.costLte !== undefined && nexCost > filters.costLte) continue;
          if (filters.costGte !== undefined && nexCost < filters.costGte) continue;
          if (selector.maxTotalCost !== undefined && nexCost > selector.maxTotalCost) continue;
          if (filters.nameIncludes && !nex.name.toLowerCase().includes(filters.nameIncludes.toLowerCase())) continue;
          if (filters.name && !nex.name.toLowerCase().includes(filters.name.toLowerCase())) continue;
          if (filters.team || filters.teams) {
            const teamQueries = Array.isArray(filters.teams) ? filters.teams : [filters.team || filters.teams];
            if (!teamQueries.some(tq => hasTeam(nex, tq, state, nexStack))) continue;
          }
          if (filters.comparison && !evaluateComparison(state, filters.comparison, { stack: nexStack, card: nex, cost: nexCost, side: s }, context)) continue;
          pushResult(buildCandidateDescriptor({ type: 'card', card: nex, side: s, zone: 'nexus', cost: nexCost }));
        }
      }
    }

    // 2. HAND ZONE
    else if (zone === 'hand') {
      // Hidden information protection: do not enumerate opponent hand unless explicitly authorized
      if (context.controller && s !== context.controller && !selector.allowOpponentHand && !selector.opponentHand) {
        continue;
      }
      for (const card of p.hand || []) {
        if (!card) continue;
        const handCost = needsCostInLoop ? getEffectiveCardCost(card) : (typeof card.cost === 'number' ? card.cost : 0);
        if (!matchesCommonCardFilters(card, handCost, state, s, targetTypes, filters, selector, context)) continue;
        pushResult(buildCandidateDescriptor({ type: 'card', card, side: s, zone: 'hand', cost: handCost }));
      }
    }

    // 3. GRAVE / TRASH ZONE
    else if (zone === 'grave') {
      const graveCards = Array.isArray(p.grave) ? p.grave : [];
      for (const card of graveCards) {
        if (!card) continue;
        const graveCost = needsCostInLoop ? getEffectiveCardCost(card) : (typeof card.cost === 'number' ? card.cost : 0);
        if (!matchesCommonCardFilters(card, graveCost, state, s, targetTypes, filters, selector, context)) continue;
        pushResult(buildCandidateDescriptor({ type: 'card', card, side: s, zone: 'grave', cost: graveCost }));
      }
    }

    // 4. DECK ZONE
    else if (zone === 'deck') {
      for (const card of p.deck || []) {
        if (!card) continue;
        const deckCost = needsCostInLoop ? getEffectiveCardCost(card) : (typeof card.cost === 'number' ? card.cost : 0);
        if (!matchesCommonCardFilters(card, deckCost, state, s, targetTypes, filters, selector, context)) continue;
        pushResult(buildCandidateDescriptor({ type: 'card', card, side: s, zone: 'deck', cost: deckCost }));
      }
    }

    // 5. REVEALED ZONE (Strictly authoritative p.revealed; contextual fallback only when unmoved & same controller)
    else if (zone === 'revealed') {
      const physRevealed = Array.isArray(p.revealed) ? p.revealed : [];
      const activeCtrl = context.controller || 'player';
      let revealedCards = physRevealed;
      if (physRevealed.length === 0 && s === activeCtrl && Array.isArray(context.revealedCards) && context.revealedCards.length > 0) {
        revealedCards = context.revealedCards.filter(c => c && !cardExistsOutsideZone(state, c.id, 'revealed', s));
      }
      for (const card of revealedCards) {
        if (!card) continue;
        const revCost = needsCostInLoop ? getEffectiveCardCost(card) : (typeof card.cost === 'number' ? card.cost : 0);
        if (!matchesCommonCardFilters(card, revCost, state, s, targetTypes, filters, selector, context)) continue;
        pushResult(buildCandidateDescriptor({ type: 'card', card, side: s, zone: 'revealed', cost: revCost }));
      }
    }

    // 6. REMOVED / OPEN ZONE
    else if (zone === 'removed') {
      const seenRemoved = new Set();
      const removedCards = [];
      for (const list of [p.removed || [], p.openCards || []]) {
        for (const c of list) {
          if (!c) continue;
          if (c.id && seenRemoved.has(c.id)) continue;
          if (c.id) seenRemoved.add(c.id);
          removedCards.push(c);
        }
      }
      for (const card of removedCards) {
        const remCost = needsCostInLoop ? getEffectiveCardCost(card) : (typeof card.cost === 'number' ? card.cost : 0);
        if (!matchesCommonCardFilters(card, remCost, state, s, targetTypes, filters, selector, context)) continue;
        pushResult(buildCandidateDescriptor({ type: 'card', card, side: s, zone: 'removed', cost: remCost }));
      }
    }

    // 7. BURST ZONE
    else if (zone === 'burst') {
      if (p.burst) {
        const burstCost = needsCostInLoop ? getEffectiveCardCost(p.burst) : (typeof p.burst.cost === 'number' ? p.burst.cost : 0);
        if (matchesCommonCardFilters(p.burst, burstCost, state, s, targetTypes, filters, selector, context)) {
          pushResult(buildCandidateDescriptor({ type: 'card', card: p.burst, side: s, zone: 'burst', cost: burstCost }));
        }
      }
    }

    // 8. MIRAGE ZONE
    else if (zone === 'mirage') {
      if (p.mirage) {
        const mirageCost = needsCostInLoop ? getEffectiveCardCost(p.mirage) : (typeof p.mirage.cost === 'number' ? p.mirage.cost : 0);
        if (matchesCommonCardFilters(p.mirage, mirageCost, state, s, targetTypes, filters, selector, context)) {
          pushResult(buildCandidateDescriptor({ type: 'card', card: p.mirage, side: s, zone: 'mirage', cost: mirageCost }));
        }
      }
    }

    // 9. UNDER / BRAVES SUB-ZONES ON FIELD STACKS
    else if (zone === 'under' || zone === 'braves') {
      for (const stack of p.field || []) {
        const subList = zone === 'under' ? (stack.under || []) : (stack.braves || []);
        for (const subCard of subList) {
          if (!subCard) continue;
          const subCost = needsCostInLoop ? getEffectiveCardCost(subCard) : (typeof subCard.cost === 'number' ? subCard.cost : 0);
          if (!matchesCommonCardFilters(subCard, subCost, state, s, targetTypes, filters, selector, context)) continue;
          pushResult(buildCandidateDescriptor({
            type: zone === 'braves' ? 'brave' : 'under',
            stack,
            card: subCard,
            side: s,
            zone,
            bp: subCard.bp || 0,
            cost: subCost
          }));
        }
      }
    }
    }
  }

  return results;
}

function findMatchingCandidate(candidates, item) {
  if (!item || !Array.isArray(candidates)) return null;
  if (typeof item === 'object') {
    const direct = candidates.find(cand => cand === item);
    if (direct) return direct;
    if (item.candidateId) {
      const byCid = candidates.find(cand => cand.candidateId && cand.candidateId === item.candidateId);
      if (byCid) return byCid;
    }
  } else if (typeof item === 'string') {
    const byCid = candidates.find(cand => cand.candidateId && cand.candidateId === item);
    if (byCid) return byCid;
  }

  const stackKey = typeof item === 'object' ? (item.stack?.id || item.stackId || item.id) : item;
  const cardKey = typeof item === 'object' ? (item.card?.id || item.cardId || item.id || item.uid) : item;

  return candidates.find(cand =>
    (cand.stack && stackKey && cand.stack.id === stackKey) ||
    (cand.card && cardKey && cand.card.id === cardKey) ||
    (cand.cardId && cardKey && cand.cardId === cardKey) ||
    (cand.uid && cardKey && cand.uid === cardKey)
  ) || null;
}

export function validateSelection(candidates, chosen, selector = {}) {
  const isOptionalChoice = Boolean(selector.optional || selector.isOptional || selector.upTo || selector.mode === 'TOTAL_BP_LTE' || selector.mode === 'TOTAL_COST_LTE');
  if (!Array.isArray(chosen)) {
    if (isOptionalChoice && (chosen === null || chosen === undefined || chosen?.declined === true)) {
      return true;
    }
    return false;
  }

  if (chosen.length === 0) {
    return isOptionalChoice;
  }

  // Verify all chosen are in candidates and reject duplicates
  const seenKeys = new Set();
  for (const c of chosen) {
    if (!c) return false;
    const match = findMatchingCandidate(candidates, c);
    if (!match) return false;
    const key = match.candidateId || match.card?.id || match.stack?.id || match.id;
    if (key) {
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
    }
  }

  // TOTAL_BP_LTE mode (e.g. Evil Flame up to total 5000 BP)
  if (selector.mode === 'TOTAL_BP_LTE' || selector.maxTotalBp !== undefined) {
    const maxBp = selector.maxTotalBp !== undefined ? selector.maxTotalBp : Infinity;
    let totalBp = 0;
    for (const item of chosen) {
      const match = findMatchingCandidate(candidates, item);
      totalBp += (match?.bp !== undefined ? match.bp : (item.bp || 0));
    }
    if (totalBp > maxBp) return false;
  }

  // TOTAL_COST_LTE mode (e.g. Siegfrieden XV up to total cost 9)
  if (selector.mode === 'TOTAL_COST_LTE' || selector.maxTotalCost !== undefined) {
    const maxCost = selector.maxTotalCost !== undefined ? selector.maxTotalCost : Infinity;
    let totalCost = 0;
    for (const item of chosen) {
      const match = findMatchingCandidate(candidates, item);
      totalCost += (match?.cost !== undefined ? match.cost : (item.cost || 0));
    }
    if (totalCost > maxCost) return false;
  }

  // If in TOTAL_BP_LTE or TOTAL_COST_LTE, count is an upper bound if explicitly defined
  if (selector.mode === 'TOTAL_BP_LTE' || selector.mode === 'TOTAL_COST_LTE') {
    if (typeof selector.count === 'number' && selector.count !== Infinity && chosen.length > selector.count) {
      return false;
    }
    return true;
  }

  // Exact or Up To count
  const count = typeof selector.count === 'number' ? selector.count : 1;
  if (isOptionalChoice) {
    return chosen.length <= count;
  }

  return chosen.length === Math.min(count, candidates.length);
}

export function normalizeCardZone(zone) {
  if (!zone) return null;
  const z = String(zone).trim().toLowerCase();
  if (z === 'trash' || z === 'grave' || z === 'graveyard') return 'grave';
  if (z === 'open' || z === 'open_zone' || z === 'opencards' || z === 'removed' || z === 'removed_zone' || z === 'removed_from_game' || z === 'banished') return 'removed';
  if (z === 'hand') return 'hand';
  if (z === 'deck' || z === 'deck_top' || z === 'deck_bottom' || z === 'decktop' || z === 'deckbottom') return 'deck';
  if (z === 'revealed' || z === 'revealedcards') return 'revealed';
  if (z === 'burst') return 'burst';
  if (z === 'mirage') return 'mirage';
  if (z === 'nexus') return 'nexus';
  if (z === 'under' || z === 'underneath' || z === 'pre_advent' || z === 'preadvent') return 'under';
  if (z === 'brave' || z === 'braves') return 'braves';
  if (z === 'field' || z === 'battlefield' || z === 'arena') return 'field';
  return z;
}

export function validateTargetAvailability(state, target, expectedZone = null, expectedSide = null) {
  if (!state || !state.players || !target) return false;
  const card = target.card || target.top || (target.id ? target : null);
  if (!card || !card.id) return false;
  const cardId = card.id;

  const rawZone = expectedZone || target.zone || null;
  const zoneToCheck = normalizeCardZone(rawZone);

  // Strict Target Side Resolution (No accidental fallthrough to the other player)
  let sides = [];
  const reqSide = (expectedSide || target.side) ? String(expectedSide || target.side).trim().toLowerCase() : null;
  if (reqSide === 'opponent' || reqSide === 'opp' || reqSide === 'opposing') {
    sides = ['opponent'];
  } else if (reqSide === 'player' || reqSide === 'self' || reqSide === 'friendly') {
    sides = ['player'];
  } else if (reqSide === 'both' || reqSide === 'either' || reqSide === 'all') {
    sides = ['player', 'opponent'];
  } else if (target.stack?.owner && (target.stack.owner === 'player' || target.stack.owner === 'opponent')) {
    sides = [target.stack.owner];
  } else {
    sides = ['player', 'opponent'];
  }

  // Duplicate instance check: A card instance ID must not exist in multiple distinct zones simultaneously
  let occurrences = 0;
  for (const s of ['player', 'opponent']) {
    const p = state.players[s];
    if (!p) continue;
    for (const z of ['deck', 'hand', 'nexus', 'grave', 'removed', 'revealed']) {
      if (Array.isArray(p[z])) occurrences += p[z].filter(c => c && c.id === cardId).length;
    }
    if (p.burst?.id === cardId) occurrences++;
    if (p.mirage?.id === cardId) occurrences++;
    for (const st of p.field || []) {
      if (st?.top?.id === cardId) occurrences++;
      if (Array.isArray(st?.under)) occurrences += st.under.filter(c => c && c.id === cardId).length;
      if (Array.isArray(st?.braves)) occurrences += st.braves.filter(c => c && c.id === cardId).length;
    }
  }
  if (occurrences > 1) {
    return false; // Ambiguous/corrupted duplicate instance across zones
  }

  for (const s of sides) {
    const p = state.players[s];
    if (!p) continue;

    // 1. Check field stacks and attached braves
    if (!zoneToCheck || zoneToCheck === 'field') {
      // 1a. If targeted specifically as an attached Brave:
      if (target.type === 'brave') {
        if (target.stack?.id || target.stackId) {
          const stId = target.stack?.id || target.stackId;
          const st = (p.field || []).find(st => st.id === stId);
          if (st) {
            return (st.braves || []).some(b => b && b.id === cardId);
          }
        } else {
          for (const st of p.field || []) {
            if ((st.braves || []).some(b => b && b.id === cardId)) return true;
          }
        }
      }

      // 1b. If targeted as a Spirit/Ultimate stack:
      else if (target.type === 'stack' || target.stack || target.stackId) {
        const targetStackId = target.stack?.id || target.stackId || target.id;
        const st = (p.field || []).find(st => st.id === targetStackId);
        if (st) {
          // Top card identity check: Must still be the current top card of that stack!
          return Boolean(st.top && st.top.id === cardId);
        }
      }

      // 1c. General field stack search by top card
      for (const st of p.field || []) {
        if (st.top && st.top.id === cardId) return true;
      }

      // 1d. Field Nexuses
      if ((p.nexus || []).some(n => n && (n.id === cardId || n.top?.id === cardId))) return true;
      for (const st of p.field || []) {
        if (st.top && (st.top.type || '').includes('Nexus') && st.top.id === cardId) return true;
      }
    }

    // 2. Check nexus zone
    if (zoneToCheck === 'nexus') {
      if ((p.nexus || []).some(n => n && (n.id === cardId || n.top?.id === cardId))) return true;
      for (const st of p.field || []) {
        if (st.top && (st.top.type || '').includes('Nexus') && st.top.id === cardId) return true;
      }
    }

    // 3. Check grave / trash
    if (zoneToCheck === 'grave') {
      if ((p.grave || []).some(c => c && c.id === cardId)) return true;
    }

    // 4. Check hand
    if (zoneToCheck === 'hand') {
      if ((p.hand || []).some(c => c && c.id === cardId)) return true;
    }

    // 5. Check deck
    if (zoneToCheck === 'deck') {
      if ((p.deck || []).some(c => c && c.id === cardId)) return true;
    }

    // 6. Check revealed
    if (zoneToCheck === 'revealed') {
      if ((p.revealed || []).some(c => c && c.id === cardId)) return true;
      if (Array.isArray(state.revealedCards) && state.revealedCards.some(c => c && c.id === cardId) && !cardExistsOutsideZone(state, cardId, 'revealed', s)) return true;
    }

    // 7. Check removed
    if (zoneToCheck === 'removed') {
      if ((p.removed || []).some(c => c && c.id === cardId)) return true;
      if ((p.openCards || []).some(c => c && c.id === cardId)) return true;
    }

    // 8. Check burst
    if (zoneToCheck === 'burst') {
      if (p.burst && p.burst.id === cardId) return true;
    }

    // 9. Check mirage
    if (zoneToCheck === 'mirage') {
      if (p.mirage && p.mirage.id === cardId) return true;
    }

    // 10. Check under / braves sub-zones
    if (zoneToCheck === 'under') {
      for (const st of p.field || []) {
        if ((st.under || []).some(c => c && c.id === cardId)) return true;
      }
    }
    if (zoneToCheck === 'braves') {
      for (const st of p.field || []) {
        if ((st.braves || []).some(b => b && b.id === cardId)) return true;
      }
    }

    // 11. If zoneToCheck is null (unconstrained zone query), check all non-deck zones on side s:
    if (!zoneToCheck) {
      if ((p.grave || []).some(c => c && c.id === cardId)) return true;
      if ((p.hand || []).some(c => c && c.id === cardId)) return true;
      if ((p.revealed || []).some(c => c && c.id === cardId)) return true;
      if ((p.removed || []).some(c => c && c.id === cardId)) return true;
      if (p.burst && p.burst.id === cardId) return true;
      if (p.mirage && p.mirage.id === cardId) return true;
    }
  }

  return false;
}

export async function executeTargeting(state, op = {}, context = {}, promptResolver = null) {
  // Normalize selector combining op, op.selector, op.target, and op.filter
  const norm = {
    side: op.side || op.selector?.side || op.target?.side || 'opp',
    zone: op.zone || op.selector?.zone || op.target?.zone || op.from || 'field',
    types: op.types || op.selector?.types || op.target?.types || (op.filter?.cardType ? [op.filter.cardType] : (((op.zone && op.zone !== 'field' && op.zone !== 'nexus') || (op.from && op.from !== 'field' && op.from !== 'nexus')) ? ['Any'] : ['Spirit'])),
    filters: {
      ...(op.filter || {}),
      ...(op.filters || {}),
      ...(op.selector?.filter || {}),
      ...(op.selector?.filters || {}),
      ...(op.target?.filter || {}),
      ...(op.target?.filters || {}),
      ...(typeof op.cost === 'number' ? { costEq: op.cost } : {}),
      ...(typeof op.selector?.cost === 'number' ? { costEq: op.selector.cost } : {}),
      ...(typeof op.target?.cost === 'number' ? { costEq: op.target.cost } : {}),
      ...(op.state || op.selector?.state || op.target?.state ? { state: op.state || op.selector?.state || op.target?.state } : {}),
      ...(op.stackId || op.selector?.stackId || op.target?.stackId ? { stackId: op.stackId || op.selector?.stackId || op.target?.stackId } : {}),
      ...(op.comparison ? { comparison: op.comparison } : {}),
      ...(op.selector?.comparison ? { comparison: op.selector.comparison } : {}),
      ...(op.target?.comparison ? { comparison: op.target.comparison } : {})
    },
    stackId: op.stackId || op.selector?.stackId || op.target?.stackId,
    all: Boolean(op.all || op.selector?.all || op.target?.all),
    count: typeof op.count === 'number' ? op.count : (typeof op.selector?.count === 'number' ? op.selector.count : (typeof op.target?.count === 'number' ? op.target.count : 1)),
    upTo: Boolean(op.upTo || op.selector?.upTo || op.target?.upTo),
    optional: Boolean(op.optional || op.isOptional || op.selector?.optional || op.target?.optional),
    mode: op.mode || op.selector?.mode || op.target?.mode || (op.maxTotalBp !== undefined || op.selector?.maxTotalBp !== undefined || op.target?.maxTotalBp !== undefined ? 'TOTAL_BP_LTE' : (op.maxTotalCost !== undefined || op.selector?.maxTotalCost !== undefined || op.target?.maxTotalCost !== undefined ? 'TOTAL_COST_LTE' : undefined)),
    maxTotalBp: op.maxTotalBp !== undefined ? op.maxTotalBp : (op.selector?.maxTotalBp !== undefined ? op.selector.maxTotalBp : op.target?.maxTotalBp),
    maxTotalCost: op.maxTotalCost !== undefined ? op.maxTotalCost : (op.selector?.maxTotalCost !== undefined ? op.selector.maxTotalCost : op.target?.maxTotalCost),
    ignoreArmor: Boolean(op.ignoreArmor || op.selector?.ignoreArmor || op.target?.ignoreArmor),
    destination: op.destination || op.selector?.destination || op.target?.destination,
    effectType: op.effectType || op.selector?.effectType || (op.op ? String(op.op).toLowerCase() : undefined),
    title: op.title || op.selector?.title || 'Select target(s)',
    promptType: op.promptType || 'SELECT_TARGET',
    allowOpponentHand: Boolean(op.allowOpponentHand || op.opponentHand)
  };

  if (norm.mode === 'TOTAL_BP_LTE' || norm.mode === 'TOTAL_COST_LTE') {
    norm.upTo = true;
    if (op.count === undefined && op.selector?.count === undefined && op.target?.count === undefined) {
      norm.count = Infinity;
    }
  }

  // If selector explicitly references PREVIOUS_TARGET
  const isPrevious = op.target === 'PREVIOUS_TARGET' ||
    op.target?.target === 'PREVIOUS_TARGET' ||
    op.target === 'previous' ||
    Boolean(op.usePreviousTarget);

  if (isPrevious) {
    if (!context.previousTarget && (!context.selectedTargets || context.selectedTargets.length === 0)) {
      context.selectedTargets = [];
      context.previousTargets = [];
      context.previousTarget = null;
      return { success: false, reason: 'NO_PREVIOUS_TARGET', selected: [], cards: [], isTargetingResult: true };
    }
    const prevItems = context.selectedTargets?.length
      ? context.selectedTargets
      : (context.previousTargets?.length ? context.previousTargets : [context.previousTarget]);

    const valid = [];
    for (const item of prevItems) {
      const checkZone = (op.zone || op.selector?.zone || op.from) || item.zone || null;
      if (validateTargetAvailability(state, item, checkZone, item.side || null)) {
        valid.push(item);
      }
    }
    if (valid.length === 0) {
      context.selectedTargets = [];
      context.previousTargets = [];
      context.previousTarget = null;
      return { success: false, reason: 'PREVIOUS_TARGET_UNAVAILABLE', selected: [], cards: [], isTargetingResult: true };
    }
    const validCards = valid.map(item => item.card || item.top || item);
    context.previousTarget = validCards[0];
    context.previousTargets = validCards;
    context.selectedTargets = valid;
    return { success: true, count: valid.length, selected: valid, cards: validCards, isTargetingResult: true };
  }

  const candidates = queryCandidates(state, norm, context);
  if (candidates.length === 0) {
    context.selectedTargets = [];
    context.previousTargets = [];
    context.previousTarget = null;
    if (norm.all) {
      return {
        success: true,
        count: 0,
        candidates: [],
        selected: [],
        cards: [],
        isTargetingResult: true
      };
    }
    return {
      success: false,
      reason: 'NO_LEGAL_TARGETS',
      candidates: [],
      selected: [],
      cards: [],
      isTargetingResult: true
    };
  }

  // Simultaneous non-prompt targeting for all: true
  if (norm.all) {
    const selectedCandidates = [...candidates];
    const selectedCards = selectedCandidates.map(c => c.card || c.top || c);
    context.selectedTargets = selectedCandidates;
    context.previousTargets = selectedCards;
    context.previousTarget = selectedCards[0] || null;
    return {
      success: true,
      count: selectedCards.length,
      selected: selectedCandidates,
      cards: selectedCards,
      candidates,
      isTargetingResult: true
    };
  }

  if (!promptResolver || typeof promptResolver.choose !== 'function') {
    context.selectedTargets = [];
    context.previousTargets = [];
    context.previousTarget = null;
    return {
      success: false,
      reason: 'MISSING_PROMPT_RESOLVER',
      candidates,
      selected: [],
      cards: [],
      isTargetingResult: true
    };
  }

  const isOptionalChoice = norm.optional || norm.upTo;
  const prompt = {
    type: norm.promptType,
    title: norm.title,
    candidates,
    count: norm.count,
    upTo: Boolean(norm.upTo || norm.optional),
    optional: Boolean(norm.optional),
    mode: norm.mode,
    maxTotalBp: norm.maxTotalBp,
    maxTotalCost: norm.maxTotalCost,
    selector: norm,
    chooser: context.controller || 'player',
    context
  };

  const rawChosen = await promptResolver.choose(prompt);

  // Handle optional decline or empty selection
  if (rawChosen === null || rawChosen === undefined || rawChosen.declined === true || (Array.isArray(rawChosen) && rawChosen.length === 0)) {
    context.selectedTargets = [];
    context.previousTargets = [];
    context.previousTarget = null;
    if (isOptionalChoice) {
      return { success: true, declined: true, count: 0, selected: [], cards: [], candidates, isTargetingResult: true };
    }
    return { success: false, reason: 'MANDATORY_TARGET_DECLINED', selected: [], cards: [], candidates, isTargetingResult: true };
  }

  const chosenRaw = (rawChosen && typeof rawChosen === 'object' && Array.isArray(rawChosen.selected)) ? rawChosen.selected : rawChosen;
  const chosen = Array.isArray(chosenRaw) ? chosenRaw : [chosenRaw];
  const isValid = validateSelection(candidates, chosen, norm);
  if (!isValid) {
    context.selectedTargets = [];
    context.previousTargets = [];
    context.previousTarget = null;
    return { success: false, reason: 'INVALID_TARGET_SELECTION', candidates, selected: [], cards: [], isTargetingResult: true };
  }

  // Map to candidate objects with .stack and .card preserving selection order
  const selectedCandidates = chosen.map(ch => findMatchingCandidate(candidates, ch) || ch);

  // Resolution-time revalidation: verify each chosen target still exists in its expected physical side & zone
  for (const cand of selectedCandidates) {
    if (!validateTargetAvailability(state, cand, cand.zone || norm.zone, cand.side || null)) {
      context.selectedTargets = [];
      context.previousTargets = [];
      context.previousTarget = null;
      return {
        success: false,
        reason: 'TARGET_NO_LONGER_IN_ZONE',
        candidates,
        selected: [],
        cards: [],
        isTargetingResult: true
      };
    }
  }

  const selectedCards = selectedCandidates.map(c => c.card || c.top || c);

  // Set consistent context across clauses
  context.selectedTargets = selectedCandidates;
  context.previousTargets = selectedCards;
  context.previousTarget = selectedCards[0] || null;

  return {
    status: 'SUCCESS',
    success: true,
    count: selectedCards.length,
    selected: selectedCandidates,
    targets: selectedCandidates,
    cards: selectedCards,
    candidates,
    isTargetingResult: true
  };
}

function applyExtremeTieFilter(candidates, norm, state = null, context = {}) {
  const extreme = norm.highest ? 'highest' : (norm.lowest ? 'lowest' : null);
  const metric = norm.highest || norm.lowest;
  if (!extreme || !metric || candidates.length <= 1) return candidates;
  const key = String(metric).toLowerCase();
  const getVal = (c) => {
    const stack = c.stack || null;
    const card = c.card || stack?.top || c;
    const ownerSide = c.side || stack?.owner || card?.owner || context.controller || 'player';
    if (key === 'bp') {
      if (state && stack) return computeEffectiveBP(state, stack);
      return c.effectiveBp ?? c.bp ?? card?.bp ?? 0;
    }
    if (key === 'cost') {
      if (state && card) return calculateEffectiveCost(state, card, ownerSide);
      return c.cost ?? card?.cost ?? 0;
    }
    if (key === 'level') {
      if (state && stack) return computeLevel(stack, state);
      return c.level ?? 1;
    }
    return null;
  };
  const vals = candidates.map(getVal);
  if (vals.some(v => typeof v !== 'number' || !Number.isFinite(v))) return candidates;
  const targetVal = extreme === 'highest' ? Math.max(...vals) : Math.min(...vals);
  return candidates.filter((c, i) => vals[i] === targetVal);
}

/**
 * Unified targeting resolver for all effect operations.
 * Supports typed references ('self', 'PREVIOUS_TARGET', 'selected', 'battling', 'effect_card', 'all'),
 * structured filter/relative/tie-handling selectors, strict candidate validation,
 * explicit failure statuses ('SUCCESS', 'NO_OP_BY_RULE', 'REJECTED', 'UNSUPPORTED'),
 * and context propagation.
 */
export async function resolveTargets(state, targetSpec = {}, context = {}, promptResolver = null, options = {}) {
  const updateContext = options.updateContext !== false;
  const controller = context.controller || 'player';
  const oppSide = controller === 'player' ? 'opponent' : 'player';

  const setCtx = (selectedCandidates) => {
    if (!updateContext) return;
    const selectedCards = selectedCandidates.map(c => c.card || c.top || c);
    context.selectedTargets = selectedCandidates;
    context.previousTargets = selectedCards;
    context.previousTarget = selectedCards[0] || null;
  };

  // Handle string targetSpec directly
  const rawTarget = typeof targetSpec === 'string'
    ? targetSpec
    : (typeof targetSpec?.target === 'string' ? targetSpec.target : null);

  if (rawTarget) {
    const key = rawTarget.trim();
    const lower = key.toLowerCase();

    if (lower === 'self') {
      const st = context.sourceStack || null;
      const card = context.sourceCard || st?.top || null;
      if (!st && !card) {
        return { status: 'REJECTED', success: false, reason: 'NO_SOURCE_CARD', targets: [], selected: [], cards: [], candidates: [] };
      }
      const item = st ? { stack: st, card, side: st.owner || controller, zone: 'field' } : { card, side: card.owner || controller, zone: card.zone || 'field' };
      setCtx([item]);
      return { status: 'SUCCESS', success: true, count: 1, targets: [item], selected: [item], cards: [card], candidates: [item] };
    }

    if (lower === 'effect_card') {
      const card = context.triggeringCard || context.effectCard || context.sourceCard || null;
      if (!card) {
        return { status: 'REJECTED', success: false, reason: 'NO_EFFECT_CARD', targets: [], selected: [], cards: [], candidates: [] };
      }
      const item = { card, side: card.owner || controller, zone: card.zone || 'field' };
      setCtx([item]);
      return { status: 'SUCCESS', success: true, count: 1, targets: [item], selected: [item], cards: [card], candidates: [item] };
    }

    if (lower === 'battling') {
      const battle = state?.battle;
      const combat = state?.combat;
      const participants = [];
      if (battle?.attacker) participants.push(battle.attacker);
      if (battle?.blocker) participants.push(battle.blocker);
      if (!battle && combat) {
        const atkSide = combat.attackerSide || 'player';
        const defSide = atkSide === 'player' ? 'opponent' : 'player';
        const atkSt = combat.attackerStackId ? (state?.players?.[atkSide]?.field || []).find(s => s.id === combat.attackerStackId) : null;
        const blkSt = combat.blockerStackId ? (state?.players?.[defSide]?.field || []).find(s => s.id === combat.blockerStackId) : null;
        if (atkSt) participants.push(atkSt);
        if (blkSt) participants.push(blkSt);
      }
      if (participants.length === 0) {
        return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_BATTLING_SPIRIT', targets: [], selected: [], cards: [], candidates: [] };
      }
      const sidePref = typeof targetSpec === 'object' ? (targetSpec.side || 'both') : 'both';
      const items = [];
      for (const st of participants) {
        if (!st) continue;
        if (sidePref === 'self' && st.owner !== controller) continue;
        if (sidePref === 'opp' && st.owner !== oppSide) continue;
        items.push({ stack: st, card: st.top || st.card || st, side: st.owner, zone: 'field' });
      }
      if (items.length === 0) {
        return { status: 'NO_OP_BY_RULE', success: false, reason: 'NO_LEGAL_TARGETS', targets: [], selected: [], cards: [], candidates: [] };
      }
      setCtx(items);
      return { status: 'SUCCESS', success: true, count: items.length, targets: items, selected: items, cards: items.map(i => i.card), candidates: items };
    }

    if (key === 'PREVIOUS_TARGET' || lower === 'previous' || lower === 'previous_target' || lower === 'target' || lower === 'selected') {
      const res = await executeTargeting(state, { ...(typeof targetSpec === 'object' ? targetSpec : {}), target: 'PREVIOUS_TARGET' }, context, promptResolver);
      return {
        ...res,
        status: res.success ? 'SUCCESS' : 'REJECTED',
        targets: res.selected || []
      };
    }

    if (lower === 'all') {
      const merged = typeof targetSpec === 'object' ? { ...targetSpec, target: undefined, all: true } : { all: true };
      const res = await executeTargeting(state, merged, context, promptResolver);
      return {
        ...res,
        status: (res.selected && res.selected.length > 0) ? 'SUCCESS' : 'NO_OP_BY_RULE',
        targets: res.selected || []
      };
    }

    return {
      status: 'UNSUPPORTED',
      success: false,
      reason: 'UNKNOWN_TARGET_REFERENCE',
      targetReference: rawTarget,
      targets: [],
      selected: [],
      cards: [],
      candidates: []
    };
  }

  const opSpec = typeof targetSpec === 'object' && targetSpec !== null ? { ...targetSpec } : {};
  if (opSpec.side === 'either') {
    const rawTxt = String(context.currentClause?.cleanText || context.currentClause?.rawText || context.clauseText || '').toLowerCase();
    if (rawTxt) {
      const hasOpp = /\bopposing\b|\bopponent(?:'?s|\s+controls?)?\b/i.test(rawTxt);
      const hasSelf = /\byou\s+control\b|\byour\b(?!\s+opponent)/i.test(rawTxt);
      if (hasOpp && !hasSelf) {
        opSpec.side = 'opp';
      } else if (hasSelf && !hasOpp) {
        opSpec.side = 'self';
      }
    }
  }
  if (options.defaultSide && !opSpec.side && !opSpec.selector?.side && !opSpec.target?.side) {
    opSpec.side = options.defaultSide;
  }
  if (options.defaultTypes && !opSpec.types && !opSpec.selector?.types && !opSpec.target?.types) {
    opSpec.types = options.defaultTypes;
  }
  if (options.promptType && !opSpec.promptType) {
    opSpec.promptType = options.promptType;
  }
  if (options.title && !opSpec.title) {
    opSpec.title = options.title;
  }
  if (options.effectType && !opSpec.effectType) {
    opSpec.effectType = options.effectType;
  }

  // Tie-handling for highest/lowest BP, cost, or level
  if (opSpec.highest || opSpec.lowest || opSpec.highestBp || opSpec.lowestBp) {
    const norm = {
      ...opSpec,
      highest: opSpec.highest || (opSpec.highestBp ? 'bp' : undefined),
      lowest: opSpec.lowest || (opSpec.lowestBp ? 'bp' : undefined)
    };
    const rawCandidates = queryCandidates(state, norm, context);
    const tied = applyExtremeTieFilter(rawCandidates, norm, state, context);
    if (tied.length === 0) {
      if (updateContext) setCtx([]);
      return { status: 'NO_OP_BY_RULE', success: Boolean(norm.all), reason: 'NO_LEGAL_TARGETS', targets: [], selected: [], cards: [], candidates: [] };
    }
    const count = typeof norm.count === 'number' ? norm.count : 1;
    if (norm.all) {
      if (updateContext) setCtx(tied);
      return { status: 'SUCCESS', success: true, count: tied.length, targets: tied, selected: tied, cards: tied.map(c => c.card || c.top || c), candidates: tied };
    }
    if (!promptResolver || typeof promptResolver.choose !== 'function') {
      const isHuman = state?.matchContext ? state.matchContext.isHuman(controller) : (state?.executionMode === 'HUMAN_VS_HUMAN');
      if (isHuman) {
        return { status: 'UNRESOLVED', success: false, reason: 'MISSING_PROMPT_RESOLVER_FOR_HUMAN', targets: [], selected: [], cards: [], candidates: tied };
      }
      if (tied.length <= count) {
        if (updateContext) setCtx(tied);
        return { status: 'SUCCESS', success: true, count: tied.length, targets: tied, selected: tied, cards: tied.map(c => c.card || c.top || c), candidates: tied };
      }
      return { status: 'UNSUPPORTED', success: false, reason: 'MISSING_PROMPT_RESOLVER', targets: [], selected: [], cards: [], candidates: tied };
    }
    const rawChosen = await promptResolver.choose({
      type: norm.promptType || 'SELECT_TARGET',
      title: norm.title || 'Select tied target(s)',
      candidates: tied,
      count,
      upTo: Boolean(norm.upTo || norm.optional),
      optional: Boolean(norm.optional),
      selector: norm,
      chooser: controller,
      context
    });
    const chosenRaw = (rawChosen && typeof rawChosen === 'object' && Array.isArray(rawChosen.selected)) ? rawChosen.selected : rawChosen;
    const chosen = Array.isArray(chosenRaw) ? chosenRaw : (chosenRaw ? [chosenRaw] : []);
    if (chosen.length === 0 || rawChosen?.declined) {
      if (norm.optional || norm.upTo) {
        if (updateContext) setCtx([]);
        return { status: 'SUCCESS', success: true, declined: true, count: 0, targets: [], selected: [], cards: [], candidates: tied };
      }
      return { status: 'REJECTED', success: false, reason: 'MANDATORY_TARGET_DECLINED', targets: [], selected: [], cards: [], candidates: tied };
    }
    if (!validateSelection(tied, chosen, norm)) {
      return { status: 'REJECTED', success: false, reason: 'INVALID_TARGET_SELECTION', targets: [], selected: [], cards: [], candidates: tied };
    }
    const selectedCandidates = chosen.map(ch => findMatchingCandidate(tied, ch) || ch);
    for (const cand of selectedCandidates) {
      if (!validateTargetAvailability(state, cand, cand.zone || norm.zone, cand.side || null)) {
        if (updateContext) setCtx([]);
        return { status: 'REJECTED', success: false, reason: 'TARGET_NO_LONGER_IN_ZONE', targets: [], selected: [], cards: [], candidates: tied };
      }
    }
    if (updateContext) setCtx(selectedCandidates);
    return { status: 'SUCCESS', success: true, count: selectedCandidates.length, targets: selectedCandidates, selected: selectedCandidates, cards: selectedCandidates.map(c => c.card || c.top || c), candidates: tied };
  }

  const execCtx = updateContext ? context : { ...context };
  const res = await executeTargeting(state, opSpec, execCtx, promptResolver);
  let status = 'SUCCESS';
  if (!res.success) {
    if (res.reason === 'NO_LEGAL_TARGETS') status = 'NO_OP_BY_RULE';
    else if (res.reason === 'MISSING_PROMPT_RESOLVER') status = 'UNSUPPORTED';
    else status = 'REJECTED';
  } else if ((res.selected || []).length === 0 && !res.declined) {
    status = 'NO_OP_BY_RULE';
  }
  return {
    ...res,
    status,
    targets: res.selected || []
  };
}
