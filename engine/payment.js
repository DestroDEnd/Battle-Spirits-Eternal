/**
 * engine/payment.js
 * 
 * Cost calculation, mandatory symbol reduction, and core payment resolution.
 * Tracks Soul Core usage for conditional card effects.
 */

import { computeFieldSymbols } from './continuous.js';
import { moveCore } from './zones.js';

export function calculateEffectiveCost(state, card, playerSide = 'player') {
  if (!card) return 0;
  let baseCost = typeof card.cost === 'number' ? card.cost : parseInt(card.cost || '0', 10);

  // Apply COST_MODIFIER and TREAT_RULE (cost overrides / deltas)
  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      if (mod.type === 'COST_MODIFIER' || (mod.type === 'TREAT_RULE' && (mod.setCost !== undefined || mod.costDelta !== undefined))) {
        if (mod.side && mod.side !== 'both' && mod.side !== playerSide) continue;
        if (mod.targetCardId && mod.targetCardId !== card.id) continue;
        if (mod.targetFilter) {
          const tf = mod.targetFilter;
          if (tf.type && card.type !== tf.type) continue;
          if (Array.isArray(tf.types) && tf.types.length > 0 && !tf.types.includes(card.type)) continue;
          if (tf.color) {
            const cols = Array.isArray(card.colors) ? card.colors : [card.color || 'Red'];
            if (!cols.some(c => c && c.toLowerCase() === tf.color.toLowerCase())) continue;
          }
          if (tf.family) {
            const fams = Array.isArray(card.families) ? card.families : (card.family ? [card.family] : []);
            if (!fams.some(f => f && f.toLowerCase().includes(tf.family.toLowerCase()))) continue;
          }
        }
        if (typeof mod.setCost === 'number') {
          baseCost = Math.max(0, mod.setCost);
        } else if (typeof mod.amount === 'number') {
          if (mod.mode === 'REDUCE' || mod.reduce) {
            baseCost = Math.max(0, baseCost - Math.abs(mod.amount));
          } else {
            baseCost = Math.max(0, baseCost + mod.amount);
          }
        } else if (typeof mod.delta === 'number') {
          baseCost = Math.max(0, baseCost + mod.delta);
        } else if (typeof mod.costDelta === 'number') {
          baseCost = Math.max(0, baseCost + mod.costDelta);
        }
      }
    }
  }

  if (baseCost === 0) return 0;

  const reduction = card.reduction || {};
  const fieldSymbols = computeFieldSymbols(state, playerSide);

  // If card is an Ultimate, add Spirit Soul symbols from friendly field
  if (card.type === 'Ultimate' && state.players && state.players[playerSide]) {
    const p = state.players[playerSide];
    for (const stack of p.field || []) {
      const effectText = stack.top?.effect || '';
      const matches = effectText.matchAll(/\[Spirit Soul(?:::|:)?\s*([^\]]*)\]/gi);
      for (const m of matches) {
        const col = (m[1] || stack.top?.color || 'Red').trim();
        if (fieldSymbols[col] !== undefined) {
          fieldSymbols[col]++;
        }
      }
    }
  }

  let totalReduction = 0;

  for (const [col, maxRed] of Object.entries(reduction)) {
    const available = fieldSymbols[col] || 0;
    const applied = Math.min(maxRed, available);
    totalReduction += applied;
  }

  const effectiveCost = Math.max(0, baseCost - totalReduction);
  return effectiveCost;
}

export function canAffordCost(state, effectiveCost, playerSide = 'player', options = {}) {
  const p = state.players[playerSide];
  const reserveCores = (p.reserve.normal || 0) + (p.reserve.soul ? 1 : 0);

  // If reserve only (e.g. Summoning from hand before placing)
  if (options.reserveOnly) {
    return reserveCores >= effectiveCost;
  }

  // Count available field cores (excluding the minimum 1 core to keep each spirit alive if specified)
  let fieldCores = 0;
  for (const stack of p.field || []) {
    fieldCores += (stack.cores.normal || 0) + (stack.cores.soul ? 1 : 0);
  }

  return (reserveCores + fieldCores) >= effectiveCost;
}

export async function payCost(state, effectiveCost, paymentSources, playerSide = 'player', events = null) {
  if (effectiveCost <= 0) {
    return { success: true, soulCoreUsed: false };
  }

  let remaining = effectiveCost;
  let soulCoreUsed = false;

  for (const source of paymentSources) {
    if (remaining <= 0) break;

    const countToPay = Math.min(source.count || 1, remaining);
    const isSoul = Boolean(source.isSoulCore);

    if (isSoul) soulCoreUsed = true;

    const fromObj = {
      zone: source.zone, // 'reserve' or 'field'
      side: playerSide,
      stackId: source.stackId
    };

    const toObj = {
      zone: 'trash', // Spent cores go to Core Trash
      side: playerSide
    };

    await moveCore(state, countToPay, fromObj, toObj, {
      isSoulCore: isSoul,
      cause: 'cost_payment',
      by: 'self'
    }, events);

    remaining -= countToPay;
  }

  return {
    success: remaining === 0,
    soulCoreUsed
  };
}
