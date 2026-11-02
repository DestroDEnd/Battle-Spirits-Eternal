/**
 * engine/selectors.js
 * 
 * Deterministic target selection and validation based on compiled IR selectors.
 * Enforces Armor / Heavy Armor protection (Rule 3.1: any effect affecting a card targets it).
 */

import { computeEffectiveBP, isImmune } from './continuous.js';

export function queryCandidates(state, selector = {}, context = {}) {
  const side = selector.side || 'opp';
  const targetSides = side === 'both' ? ['player', 'opponent'] : [side === 'opp' ? (context.controller === 'player' ? 'opponent' : 'player') : context.controller];
  const targetTypes = selector.types || ['Spirit'];
  const filters = selector.filters || {};
  const zone = selector.zone || 'field';

  const results = [];

  for (const s of targetSides) {
    const p = state.players[s];

    if (zone === 'field') {
      for (const stack of p.field || []) {
        const top = stack.top;
        if (!top) continue;

        // Type match (Rule: Ultimates are not Spirits)
        if (!targetTypes.includes(top.type)) continue;

        // Armor / Heavy Armor immunity check
        if (context.sourceCard && isImmune(state, stack, context.sourceCard)) {
          continue;
        }

        // BP filter
        const bp = computeEffectiveBP(state, stack);
        if (filters.bpLte !== undefined && bp > filters.bpLte) continue;
        if (filters.bpGte !== undefined && bp < filters.bpGte) continue;

        // Cost filter
        const cost = top.cost || 0;
        if (filters.costLte !== undefined && cost > filters.costLte) continue;
        if (filters.costGte !== undefined && cost < filters.costGte) continue;

        // State filter (e.g. EXHAUSTED)
        if (filters.state && stack.state !== filters.state) continue;

        // Symbol count filter
        if (filters.symbolCount !== undefined) {
          const syms = top.symbols || [top.color || 'Red'];
          if (syms.length !== filters.symbolCount) continue;
        }

        // Family filter
        if (filters.family) {
          const fams = top.families || (top.family ? [top.family] : []);
          if (!fams.some(f => f.toLowerCase() === filters.family.toLowerCase())) continue;
        }

        // Name filter
        if (filters.nameIncludes) {
          if (!top.name.toLowerCase().includes(filters.nameIncludes.toLowerCase())) continue;
        }

        results.push({
          type: 'stack',
          stack,
          card: top,
          side: s,
          bp,
          cost
        });
      }
    } else if (zone === 'hand') {
      for (const card of p.hand || []) {
        if (targetTypes.length > 0 && !targetTypes.includes(card.type)) continue;
        if (filters.nameIncludes && !card.name.toLowerCase().includes(filters.nameIncludes.toLowerCase())) continue;
        results.push({
          type: 'card',
          card,
          side: s
        });
      }
    }
  }

  return results;
}

export function validateSelection(candidates, chosen, selector = {}) {
  if (!Array.isArray(chosen)) return false;

  // Verify all chosen are in candidates
  for (const c of chosen) {
    const valid = candidates.some(cand => 
      (cand.stack && cand.stack.id === (c.stack ? c.stack.id : c.id)) ||
      (cand.card && cand.card.id === (c.card ? c.card.id : c.id))
    );
    if (!valid) return false;
  }

  // TOTAL_BP_LTE mode (e.g. Evil Flame up to total 5000 BP)
  if (selector.mode === 'TOTAL_BP_LTE' && selector.maxTotalBp) {
    const totalBp = chosen.reduce((sum, item) => sum + (item.bp || 0), 0);
    return totalBp <= selector.maxTotalBp;
  }

  // TOTAL_COST_LTE mode (e.g. Siegfrieden XV up to total cost 9)
  if (selector.mode === 'TOTAL_COST_LTE' && selector.maxTotalCost) {
    const totalCost = chosen.reduce((sum, item) => sum + (item.cost || 0), 0);
    return totalCost <= selector.maxTotalCost;
  }

  // Exact or Up To count
  const count = selector.count || 1;
  if (selector.upTo) {
    return chosen.length <= count;
  }

  return chosen.length === Math.min(count, candidates.length);
}
