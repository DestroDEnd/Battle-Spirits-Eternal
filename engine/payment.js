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
  const baseCost = card.cost || 0;
  if (baseCost === 0) return 0;

  const reduction = card.reduction || {};
  const fieldSymbols = computeFieldSymbols(state, playerSide);

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
