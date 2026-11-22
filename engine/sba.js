/**
 * engine/sba.js
 *
 * State-Based Actions (SBA) & State Stabilization Loop for Battle Spirits Eternal.
 * Runs after every resolution and step transition:
 * - Simultaneous and single-player Life 0 win/loss/draw checks
 * - Depletion checks (cores < LV1 cost -> card grave; Nexuses LV1=0 exempt)
 * - Source-dependent modifier pruning & standby stack flushing
 * - Bounded stabilization loop with infinite-loop protection
 */

import { ETERNAL_RULES } from './rules/eternal.js';
import { flushStandbyStacks, commitStackExit } from './zones.js';
import { computeLevel, pruneExpiredModifiers, parseLevelMap } from './continuous.js';

export class StabilizationLoopError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'StabilizationLoopError';
    this.code = 'MAX_STABILIZATION_PASSES_EXCEEDED';
    this.passes = details.passes ?? 0;
    this.maxPasses = details.maxPasses ?? 20;
  }
}

export async function checkStateBasedActions(state, events = null, options = {}) {
  let changed = false;
  const depletedCards = [];
  const stageOnly = Boolean(options.stageOnly);

  // 1. Life 0 checks (including simultaneous Life 0 draw per ETERNAL_RULES)
  const isLossPrevented = side => (state.modifiers || []).some(
    m => m.type === 'PREVENT_LOSS' && (!m.side || m.side === 'both' || m.side === side)
  );
  if (!state.winner) {
    const playerLost = state.players.player.life <= 0 && !isLossPrevented('player');
    const opponentLost = state.players.opponent.life <= 0 && !isLossPrevented('opponent');

    if (playerLost && opponentLost && ETERNAL_RULES.winLoss.simultaneousLife0Draw) {
      state.winner = 'DRAW';
      state.winReason = 'SIMULTANEOUS_LIFE_0';
      if (events) {
        await events.emit({ type: 'GAME_OVER', winner: 'DRAW', reason: 'SIMULTANEOUS_LIFE_0' });
      }
      return { changed: true, winner: 'DRAW', winReason: 'SIMULTANEOUS_LIFE_0' };
    }

    if (playerLost) {
      state.winner = 'opponent';
      state.winReason = 'LIFE_0';
      if (events) {
        await events.emit({ type: 'GAME_OVER', winner: 'opponent', reason: 'LIFE_0' });
      }
      return { changed: true, winner: 'opponent', winReason: 'LIFE_0' };
    }

    if (opponentLost) {
      state.winner = 'player';
      state.winReason = 'LIFE_0';
      if (events) {
        await events.emit({ type: 'GAME_OVER', winner: 'player', reason: 'LIFE_0' });
      }
      return { changed: true, winner: 'player', winReason: 'LIFE_0' };
    }
  }

  // 2. Field Depletion Checks: Any stack with total cores < LV1 cost requirement
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    const stacksToProcess = [...(p.field || [])];

    for (const stack of stacksToProcess) {
      if (stack.isSoulState) continue; // Soul State cards do not deplete

      const top = stack.top;
      if (!top) continue;
      if (String(top.type || '').includes('Nexus')) continue; // Nexuses have LV1 cost 0 and do not deplete from 0 cores

      const levelMap = parseLevelMap(top.levels || { 1: { cost: 1 } });
      const lv1Entry = levelMap.get(1);
      const lv1Cost = lv1Entry ? (lv1Entry.cost ?? 1) : 1;
      const totalCores = (stack.cores.normal || 0) + (stack.cores.soul ? 1 : 0);

      if (totalCores < lv1Cost) {
        // Card is depleted
        changed = true;
        depletedCards.push(top);

        const prevLevel = stack.standby?.previousLevel || stack.lastActiveLevel || computeLevel(stack);

        if (stageOnly) {
          // Rule 40: Bounce/banish standby preserves its destination even if depleted
          const targetZone = (stack.standby && (stack.standby.type === 'bounce' || stack.standby.type === 'banish'))
            ? stack.standby.destZone
            : 'grave';

          stack.standby = {
            type: 'depletion',
            previousLevel: prevLevel,
            by: 'self',
            cause: 'depletion',
            destZone: targetZone
          };
        } else {
          // If already in standby, mark as depletion by self before commit
          if (stack.standby) {
            stack.standby.type = 'depletion';
            stack.standby.by = 'self';
          }
          await commitStackExit(state, stack, 'grave', { cause: 'depletion', by: 'rule' }, events);
        }
      }
    }
  }

  return {
    changed,
    depletedCards,
    winner: state.winner,
    winReason: state.winReason
  };
}

/**
 * Runs deterministic state stabilization until no further SBA/standby/modifier-expiration
 * changes occur, or throws StabilizationLoopError if maxPasses is exceeded.
 */
export async function stabilizeGameState(state, events = null, options = {}) {
  const maxPasses = options.maxPasses ?? 20;
  let passes = 0;
  let totalDepleted = [];
  let totalFlushed = 0;
  let totalPrunedModifiers = 0;

  while (passes < maxPasses) {
    passes++;
    const pruned = pruneExpiredModifiers(state, 'SOURCE_DEPARTURE');
    totalPrunedModifiers += pruned;

    const flushed = options.stageOnly ? 0 : await flushStandbyStacks(state, events);
    totalFlushed += flushed;

    const sbaRes = await checkStateBasedActions(state, events, options);
    if (Array.isArray(sbaRes.depletedCards) && sbaRes.depletedCards.length > 0) {
      totalDepleted = totalDepleted.concat(sbaRes.depletedCards);
    }

    if (state.winner || (!sbaRes.changed && flushed === 0 && pruned === 0)) {
      return {
        stabilized: true,
        passes,
        totalDepleted,
        totalFlushed,
        totalPrunedModifiers,
        winner: state.winner,
        winReason: state.winReason
      };
    }
  }

  throw new StabilizationLoopError(
    `State failed to stabilize after ${maxPasses} SBA passes`,
    { passes, maxPasses }
  );
}
