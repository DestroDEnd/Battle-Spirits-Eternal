/**
 * engine/payment.js
 * 
 * Cost calculation, mandatory symbol reduction, and transactional core payment resolution.
 * Tracks Soul Core usage for conditional card effects.
 *
 * Payment Transaction Semantics (Phase 4C.3.3.1.1):
 * - Phase 1 (Preflight): Validates all payment sources cumulatively before any mutation.
 *   Rejected payments return `{ success: false, committed: false, status: 'PAYMENT_REJECTED', ... }`
 *   with zero state mutation and zero emitted events.
 * - Phase 2 (Synchronous Commit): Applies all core deductions and Core Trash credits
 *   synchronously with no intermediate await points, records `transactionId` in
 *   non-enumerable `state._committedPaymentTxIds` to block duplicate/re-entrant commits.
 * - Phase 3 (Post-Commit Event Dispatch): Emits `CORE_MOVED` notifications (tagged with
 *   shared `transactionId` and `paymentCommitted: true`) only after commitment.
 *   Committed payments are NEVER rolled back if a post-commit event handler throws;
 *   instead, a structured `PaymentEventDispatchError` (`committed: true`,
 *   `status: 'COMMITTED_WITH_EVENT_FAILURE'`) is thrown.
 */

import { computeFieldSymbols } from './continuous.js';

let nextPaymentTxSeq = 1;

export class PaymentEventDispatchError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'PaymentEventDispatchError';
    this.committed = true;
    this.eventDispatchFailed = true;
    this.status = 'COMMITTED_WITH_EVENT_FAILURE';
    this.transactionId = details.transactionId || null;
    this.soulCoreUsed = Boolean(details.soulCoreUsed);
    this.failedEventIndex = details.failedEventIndex ?? 0;
    this.cause = details.cause || null;
  }
}

function getCommittedTxSet(state) {
  if (!state || typeof state !== 'object') return null;
  if (!state._committedPaymentTxIds) {
    Object.defineProperty(state, '_committedPaymentTxIds', {
      value: new Set(),
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
  return state._committedPaymentTxIds;
}

export function calculateEffectiveCost(state, card, playerSide = 'player', precomputedFieldSymbols = null) {
  if (!card) return 0;
  let baseCost = typeof card.cost === 'number' ? card.cost : parseInt(card.cost || '0', 10);

  // Apply COST_MODIFIER and TREAT_RULE (cost overrides / deltas)
  let hasSymbolModifier = false;
  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      if (mod.type === 'SYMBOL_MODIFIER') {
        hasSymbolModifier = true;
        continue;
      }
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

  const reduction = card.reduction && typeof card.reduction === 'object' ? { ...card.reduction } : {};
  const hasBaseReduction = Object.values(reduction).some(v => Number(v) > 0);
  if (!hasBaseReduction && !hasSymbolModifier) {
    return Math.max(0, baseCost);
  }

  const fieldSymbols = precomputedFieldSymbols ? { ...precomputedFieldSymbols } : computeFieldSymbols(state, playerSide);

  // Apply SYMBOL_MODIFIER (e.g., grant Magic cards additional color reduction symbols)
  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      if (mod.type !== 'SYMBOL_MODIFIER') continue;
      if (mod.side && mod.side !== 'both' && mod.side !== playerSide) continue;
      const targetType = mod.cardType || 'Magic';
      if (targetType && String(card.type || '').toLowerCase() !== String(targetType).toLowerCase()) continue;
      const syms = mod.symbols || (mod.color ? { [mod.color]: mod.count || 1 } : {});
      for (const [col, addCount] of Object.entries(syms)) {
        reduction[col] = (reduction[col] || 0) + Number(addCount || 1);
      }
    }
  }

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

  // Count available field cores
  let fieldCores = 0;
  for (const stack of p.field || []) {
    fieldCores += (stack.cores.normal || 0) + (stack.cores.soul ? 1 : 0);
  }

  return (reserveCores + fieldCores) >= effectiveCost;
}

/**
 * Builds an atomic payment plan for `effectiveCost` from `reserve` (normal first, then soul)
 * and, if needed and permitted, from `field` stacks. Returns null if unaffordable.
 */
export function buildPaymentPlan(state, effectiveCost, playerSide = 'player', options = {}) {
  if (!Number.isInteger(effectiveCost) || effectiveCost < 0) return null;
  if (effectiveCost === 0) return [];

  const p = state?.players?.[playerSide];
  if (!p) return null;

  const plan = [];
  let remaining = effectiveCost;

  const resNormal = p.reserve?.normal || 0;
  if (resNormal > 0 && remaining > 0) {
    const take = Math.min(resNormal, remaining);
    plan.push({ zone: 'reserve', isSoulCore: false, count: take });
    remaining -= take;
  }

  const resSoul = p.reserve?.soul || 0;
  if (resSoul > 0 && remaining > 0 && !options.excludeSoulCore) {
    plan.push({ zone: 'reserve', isSoulCore: true, count: 1 });
    remaining -= 1;
  }

  if (remaining > 0 && !options.reserveOnly) {
    for (const stack of p.field || []) {
      if (remaining <= 0) break;
      const stNormal = stack.cores?.normal || 0;
      if (stNormal > 0) {
        const take = Math.min(stNormal, remaining);
        plan.push({ zone: 'field', stackId: stack.id, isSoulCore: false, count: take });
        remaining -= take;
      }
      if (remaining > 0 && (stack.cores?.soul || 0) > 0 && !options.excludeSoulCore) {
        plan.push({ zone: 'field', stackId: stack.id, isSoulCore: true, count: 1 });
        remaining -= 1;
      }
    }
  }

  return remaining === 0 ? plan : null;
}

export async function payCost(state, effectiveCost, paymentSources, playerSide = 'player', events = null, options = {}) {
  const transactionId = options.transactionId || `pay_tx_${nextPaymentTxSeq++}`;
  const committedTxSet = getCommittedTxSet(state);

  if (committedTxSet && committedTxSet.has(transactionId)) {
    return {
      success: false,
      committed: false,
      duplicateTransaction: true,
      status: 'DUPLICATE_TRANSACTION',
      reason: 'TRANSACTION_ALREADY_COMMITTED',
      soulCoreUsed: false,
      transactionId
    };
  }

  if (!Number.isInteger(effectiveCost) || effectiveCost < 0) {
    return {
      success: false,
      committed: false,
      status: 'PAYMENT_REJECTED',
      reason: 'INVALID_COST',
      soulCoreUsed: false,
      transactionId
    };
  }

  const p = state?.players?.[playerSide];
  if (!p || !p.reserve || typeof p.reserve !== 'object' || !p.trash || typeof p.trash !== 'object') {
    return {
      success: false,
      committed: false,
      status: 'PAYMENT_REJECTED',
      reason: 'INVALID_PLAYER_CORE_ZONES',
      soulCoreUsed: false,
      transactionId
    };
  }

  if (effectiveCost === 0) {
    if (committedTxSet) committedTxSet.add(transactionId);
    return {
      success: true,
      committed: true,
      status: 'COMMITTED',
      soulCoreUsed: false,
      transactionId,
      eventDispatchFailed: false
    };
  }

  if (!Array.isArray(paymentSources) || paymentSources.length === 0) {
    return {
      success: false,
      committed: false,
      status: 'PAYMENT_REJECTED',
      reason: 'INSUFFICIENT_PAYMENT_SOURCES',
      soulCoreUsed: false,
      transactionId
    };
  }

  // Phase 1: Preflight cumulative validation across all sources BEFORE any state mutation
  let plannedTotal = 0;
  let simReserveNormal = p.reserve.normal;
  let simReserveSoul = p.reserve.soul;
  if (!Number.isInteger(simReserveNormal) || simReserveNormal < 0 || !Number.isInteger(simReserveSoul) || simReserveSoul < 0) {
    return {
      success: false,
      committed: false,
      status: 'PAYMENT_REJECTED',
      reason: 'INVALID_RESERVE_CORE_STATE',
      soulCoreUsed: false,
      transactionId
    };
  }

  const stackMap = new Map();
  const simFieldNormal = new Map();
  const simFieldSoul = new Map();
  for (const st of p.field || []) {
    if (!st || !st.id || !st.cores || typeof st.cores !== 'object') continue;
    stackMap.set(st.id, st);
    simFieldNormal.set(st.id, st.cores.normal || 0);
    simFieldSoul.set(st.id, st.cores.soul || 0);
  }

  const validatedSteps = [];
  let remaining = effectiveCost;
  let soulCoreCount = 0;

  for (const source of paymentSources) {
    if (remaining <= 0) break;
    if (!source || typeof source !== 'object') {
      return {
        success: false,
        committed: false,
        status: 'PAYMENT_REJECTED',
        reason: 'MALFORMED_PAYMENT_SOURCE',
        soulCoreUsed: false,
        transactionId
      };
    }

    const zone = source.zone || source.from;
    if (zone !== 'reserve' && zone !== 'field') {
      return {
        success: false,
        committed: false,
        status: 'PAYMENT_REJECTED',
        reason: 'INVALID_PAYMENT_SOURCE_ZONE',
        soulCoreUsed: false,
        transactionId
      };
    }

    if (source.side && source.side !== playerSide) {
      return {
        success: false,
        committed: false,
        status: 'PAYMENT_REJECTED',
        reason: 'INVALID_PAYMENT_SOURCE_OWNERSHIP',
        soulCoreUsed: false,
        transactionId
      };
    }

    const rawCount = source.count ?? 1;
    if (!Number.isInteger(rawCount) || rawCount <= 0) {
      return {
        success: false,
        committed: false,
        status: 'PAYMENT_REJECTED',
        reason: 'INVALID_PAYMENT_COUNT',
        soulCoreUsed: false,
        transactionId
      };
    }

    const countToPay = Math.min(rawCount, remaining);
    const isSoul = Boolean(source.isSoulCore);
    if (isSoul && countToPay !== 1) {
      return {
        success: false,
        committed: false,
        status: 'PAYMENT_REJECTED',
        reason: 'INVALID_SOUL_CORE_COUNT',
        soulCoreUsed: false,
        transactionId
      };
    }

    if (isSoul) {
      soulCoreCount++;
      if (soulCoreCount > 1) {
        return {
          success: false,
          committed: false,
          status: 'PAYMENT_REJECTED',
          reason: 'MULTIPLE_SOUL_CORES_NOT_ALLOWED',
          soulCoreUsed: false,
          transactionId
        };
      }
    }

    if (zone === 'reserve') {
      if (isSoul) {
        if (simReserveSoul < 1) {
          return {
            success: false,
            committed: false,
            status: 'PAYMENT_REJECTED',
            reason: 'INSUFFICIENT_SOUL_CORE',
            soulCoreUsed: false,
            transactionId
          };
        }
        simReserveSoul -= 1;
      } else {
        if (simReserveNormal < countToPay) {
          return {
            success: false,
            committed: false,
            status: 'PAYMENT_REJECTED',
            reason: 'INSUFFICIENT_RESERVE_CORES',
            soulCoreUsed: false,
            transactionId
          };
        }
        simReserveNormal -= countToPay;
      }
    } else if (zone === 'field') {
      if (!source.stackId || !simFieldNormal.has(source.stackId)) {
        return {
          success: false,
          committed: false,
          status: 'PAYMENT_REJECTED',
          reason: 'PAYMENT_STACK_NOT_FOUND',
          soulCoreUsed: false,
          transactionId
        };
      }
      if (isSoul) {
        if ((simFieldSoul.get(source.stackId) || 0) < 1) {
          return {
            success: false,
            committed: false,
            status: 'PAYMENT_REJECTED',
            reason: 'INSUFFICIENT_STACK_SOUL_CORE',
            soulCoreUsed: false,
            transactionId
          };
        }
        simFieldSoul.set(source.stackId, 0);
      } else {
        const avail = simFieldNormal.get(source.stackId) || 0;
        if (avail < countToPay) {
          return {
            success: false,
            committed: false,
            status: 'PAYMENT_REJECTED',
            reason: 'INSUFFICIENT_STACK_CORES',
            soulCoreUsed: false,
            transactionId
          };
        }
        simFieldNormal.set(source.stackId, avail - countToPay);
      }
    }

    validatedSteps.push({
      zone,
      stackId: source.stackId || null,
      countToPay,
      isSoul
    });
    plannedTotal += countToPay;
    remaining -= countToPay;
  }

  if (plannedTotal < effectiveCost || remaining !== 0) {
    return {
      success: false,
      committed: false,
      status: 'PAYMENT_REJECTED',
      reason: 'INSUFFICIENT_PAYMENT_SOURCES',
      soulCoreUsed: false,
      transactionId
    };
  }

  const soulCoreUsed = soulCoreCount === 1;

  // Phase 2: Synchronous atomic state commit (zero intermediate await points)
  for (const step of validatedSteps) {
    if (step.zone === 'reserve') {
      if (step.isSoul) {
        p.reserve.soul -= 1;
        p.trash.soul += 1;
      } else {
        p.reserve.normal -= step.countToPay;
        p.trash.normal += step.countToPay;
      }
    } else if (step.zone === 'field') {
      const stack = stackMap.get(step.stackId);
      if (step.isSoul) {
        stack.cores.soul -= 1;
        p.trash.soul += 1;
      } else {
        stack.cores.normal -= step.countToPay;
        p.trash.normal += step.countToPay;
      }
    }
  }

  // Record transactionId as committed BEFORE emitting events to prevent re-entrant double commit
  if (committedTxSet) {
    committedTxSet.add(transactionId);
  }

  // Phase 3: Post-commit CORE_MOVED event dispatch.
  // Payment is already committed and MUST NOT be rolled back if a handler throws.
  if (events) {
    for (let i = 0; i < validatedSteps.length; i++) {
      const step = validatedSteps[i];
      try {
        await events.emit({
          type: 'CORE_MOVED',
          transactionId,
          paymentCommitted: true,
          stepIndex: i,
          count: step.countToPay,
          isSoulCore: step.isSoul,
          fromZone: step.zone,
          fromSide: playerSide,
          toZone: 'trash',
          toSide: playerSide,
          cause: 'cost_payment',
          by: 'self',
          sourceCard: null
        });
      } catch (err) {
        throw new PaymentEventDispatchError(
          `Payment ${transactionId} committed, but CORE_MOVED handler failed at step ${i}: ${err?.message || err}`,
          {
            transactionId,
            soulCoreUsed,
            failedEventIndex: i,
            cause: err
          }
        );
      }
    }
  }

  return {
    success: true,
    committed: true,
    status: 'COMMITTED',
    soulCoreUsed,
    transactionId,
    eventDispatchFailed: false
  };
}

/**
 * E2: Grandwalker God Core Payment
 * Deducts `count` cores directly from a Grandwalker Nexus stack and sends them to Void.
 */
export async function payGodCores(state, stackId, count = 1, playerSide = 'player', events = null, options = {}) {
  const p = state?.players?.[playerSide];
  if (!p) return { success: false, committed: false, reason: 'INVALID_PLAYER', count: 0 };
  const stack = p.field?.find(st => st.id === stackId);
  if (!stack) return { success: false, committed: false, reason: 'STACK_NOT_FOUND', count: 0 };
  const needed = typeof count === 'number' && count > 0 ? count : 1;
  if ((stack.cores?.normal || 0) < needed) {
    return { success: false, committed: false, reason: 'INSUFFICIENT_GOD_CORES', available: stack.cores?.normal || 0, count: 0 };
  }
  stack.cores.normal -= needed;
  p.voidCores = p.voidCores || { normal: 0, soul: 0 };
  p.voidCores.normal += needed;
  if (events) {
    await events.emit({
      type: 'GOD_CORES_PAID',
      player: playerSide,
      count: needed,
      stackId,
      remaining: stack.cores.normal
    });
  }
  return { success: true, committed: true, count: needed, remaining: stack.cores.normal };
}
