/**
 * tests/phase_m3_3_combat_resolution_authority.test.js
 * 
 * Phase M.3.3 Work Package C: Direct Combat Resolution Authority
 * 
 * Asserts that:
 * 1. resolveBattleComparison() cannot be invoked directly while Flash 2 is active.
 * 2. resolveBattleComparison() fails if Flash 2 has not closed through 2 consecutive passes.
 * 3. Combat state, unit positions, and response window remain unchanged on failed call.
 * 4. Legitimate 2-pass closure invokes BP comparison exactly once.
 * 5. Replay of resolveBattleComparison() on already-resolved combat is rejected.
 * 6. declareBlock() and resolveDirectHit() cannot bypass active response windows.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';

test('M3.3-C-01: Direct resolveBattleComparison() fails while Flash 2 is active and preserves state', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Atk Dragon', bp: 5000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];

  const blkCard = createCardInstance({ name: 'Blk Golem', bp: 2000, type: 'Spirit' }, 'opponent');
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  state.players.opponent.field = [blkStack];

  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: blkStack.id,
    blockerSide: 'opponent',
    stage: 'FLASH_2'
  };

  const flash2Win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  let bpCompareEmitted = false;
  game.events.on('BP_COMPARE', () => { bpCompareEmitted = true; });

  // Direct invocation while Flash 2 is OPEN
  const directRes = await game.windows.resolveBattleComparison(flash2Win);

  assert.equal(directRes.success, false);
  assert.equal(directRes.reason, 'FLASH_TIMING_NOT_CLOSED');

  // Both units MUST still remain on field
  assert.equal(state.players.player.field.length, 1, 'Attacker remains on field');
  assert.equal(state.players.opponent.field.length, 1, 'Blocker remains on field (not destroyed)');

  // No BP compare event was emitted
  assert.equal(bpCompareEmitted, false, 'BP_COMPARE event was not emitted');

  // Flash 2 window remains active and open
  assert.equal(game.windows.isResponseWindowActive(), true, 'Flash 2 response window remains active');
  assert.equal(game.windows.getCurrentWindow()?.windowId, flash2Win.windowId);
});

test('M3.3-C-02: Legitimate 2-pass closure executes BP comparison exactly once', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Atk Dragon', bp: 5000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];

  const blkCard = createCardInstance({ name: 'Blk Golem', bp: 2000, type: 'Spirit' }, 'opponent');
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  state.players.opponent.field = [blkStack];

  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: blkStack.id,
    blockerSide: 'opponent',
    stage: 'FLASH_2'
  };

  const flash2Win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  let bpCompareCount = 0;
  game.events.on('BP_COMPARE', () => { bpCompareCount++; });

  // Pass 1: Defender (Bob) passes
  const pass1 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(pass1.success, true);
  assert.equal(pass1.closed, false);
  assert.equal(game.windows.isResponseWindowActive(), true);

  // Pass 2: Attacker (Alice) passes -> Flash 2 closes legitimately and executes comparison
  const pass2 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });
  assert.equal(pass2.success, true);
  assert.equal(pass2.closed, true);

  // Blocker was destroyed (2000 BP < 5000 BP)
  assert.equal(state.players.opponent.field.length, 0, 'Blocker destroyed by BP comparison');
  assert.equal(state.players.opponent.grave.length, 1, 'Blocker placed in graveyard');
  assert.equal(bpCompareCount, 1, 'BP_COMPARE emitted exactly once');

  // Attempt replayed direct call: must fail
  const replayRes = await game.windows.resolveBattleComparison(flash2Win);
  assert.equal(replayRes.success, false);
  assert.ok(replayRes.reason === 'NOT_IN_COMBAT' || replayRes.reason === 'BATTLE_ALREADY_RESOLVED');
});

test('M3.3-C-03: declareBlock cannot bypass active Flash 1 window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Attacker' }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Blocker' }, 'opponent'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.players.opponent.field = [blkStack];

  await game.declareAttack(atkStack.id, 'player');
  assert.equal(game.windows.getCurrentWindow()?.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);

  const blkRes = await game.declareBlock(blkStack.id, 'opponent');
  assert.equal(blkRes.success, false);
  assert.equal(blkRes.reason, 'FLASH_TIMING_NOT_CLOSED');
  assert.equal(game.windows.getCurrentWindow()?.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
});

test('M3.3-C-04: resolveDirectHit cannot bypass active Flash 1 or Block Declaration window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Attacker' }, 'player'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.players.opponent.life = 5;

  await game.declareAttack(atkStack.id, 'player');
  assert.equal(game.windows.getCurrentWindow()?.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);

  const dhRes = await game.resolveDirectHit('player');
  assert.equal(dhRes.success, false);
  assert.equal(dhRes.reason, 'BLOCK_DECISION_REQUIRED');
  assert.equal(state.players.opponent.life, 5, 'Defender life must not be damaged');
});
