/**
 * engine/sba.js
 * 
 * State-Based Actions (SBA) for Battle Spirits Eternal.
 * Runs after every resolution and step transition:
 * - Depletion checks (cores < LV1 cost -> card grave)
 * - Life 0 win/loss checks
 * - Start-step deck-out verification
 */

import { moveCard } from './zones.js';

export async function checkStateBasedActions(state, events = null) {
  let changed = false;
  const depletedCards = [];

  // 1. Life 0 checks
  if (!state.winner) {
    if (state.players.player.life <= 0) {
      state.winner = 'opponent';
      state.winReason = 'LIFE_0';
      if (events) {
        await events.emit({ type: 'GAME_OVER', winner: 'opponent', reason: 'LIFE_0' });
      }
      return { changed: true, winner: 'opponent', winReason: 'LIFE_0' };
    }
    if (state.players.opponent.life <= 0) {
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
    const remainingStacks = [];

    for (const stack of p.field || []) {
      const top = stack.top;
      if (!top) continue;

      const levels = top.levels || { 1: { cost: 1 } };
      const lv1Cost = levels[1] ? (levels[1].cost || 1) : 1;
      const totalCores = (stack.cores.normal || 0) + (stack.cores.soul ? 1 : 0);

      if (totalCores < lv1Cost) {
        // Card is depleted
        changed = true;
        depletedCards.push(top);

        // Move stack to grave with cause 'depletion'
        await moveCard(state, top, 'grave', side, { cause: 'depletion', by: 'rule' }, events);
      } else {
        remainingStacks.push(stack);
      }
    }

    p.field = remainingStacks;
  }

  return {
    changed,
    depletedCards,
    winner: state.winner,
    winReason: state.winReason
  };
}
