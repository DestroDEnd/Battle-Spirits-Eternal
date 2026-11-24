/**
 * tests/phase_m3_3_1_combat_internal_authority.test.js
 * 
 * Phase M.3.3.1 Work Package A: Close the Internal BP Comparison Bypass
 * 
 * Asserts that:
 * 1. Calling the old internal method name directly cannot execute BP comparison.
 * 2. Direct resolution during Flash 2 fails.
 * 3. Calling the public method with an arbitrary forged closed-window object fails.
 * 4. Calling the public method with a stale window fails.
 * 5. Legitimate two-pass Flash 2 closure resolves BP comparison.
 * 6. BP comparison executes exactly once.
 * 7. A second resolution attempt cannot mutate combat state.
 * 8. Blocker and attacker references must match the actual battle.
 * 9. Flash 2 remains active after an unauthorized attempt.
 * 10. Failed calls preserve the entire relevant combat and response-window state.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { RESPONSE_WINDOW_TYPES, RESPONSE_WINDOW_STATUS, resetWindowCounter } from '../engine/windows.js';

test('M3.3.1-A-01: Calling _internalResolveBattleComparison directly cannot execute BP comparison', async () => {
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

  // DIRECT CALL TO OLD INTERNAL METHOD NAME
  const bypassRes = await game.windows._internalResolveBattleComparison(flash2Win);

  assert.equal(bypassRes.success, false);
  assert.equal(bypassRes.code, 'UNAUTHORIZED_INTERNAL_RESOLUTION');

  // Must NOT destroy any units
  assert.equal(state.players.player.field.length, 1, 'Attacker remains on field');
  assert.equal(state.players.opponent.field.length, 1, 'Blocker remains on field');
  assert.equal(bpCompareEmitted, false, 'No BP_COMPARE event emitted');

  // Flash 2 window remains active
  assert.equal(game.windows.isResponseWindowActive(), true);
  assert.equal(state.combat._comparisonResolved, undefined);
});

test('M3.3.1-A-02: Direct resolution during Flash 2 fails and preserves window & combat state', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Atk' }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Blk' }, 'opponent'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
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

  const res = await game.windows.resolveBattleComparison(flash2Win);
  assert.equal(res.success, false);
  assert.equal(res.reason, 'FLASH_TIMING_NOT_CLOSED');
  assert.equal(game.windows.isResponseWindowActive(), true);
});

test('M3.3.1-A-03: Calling public method with arbitrary forged closed-window object fails', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Atk' }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Blk' }, 'opponent'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.players.opponent.field = [blkStack];

  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: blkStack.id,
    blockerSide: 'opponent',
    stage: 'FLASH_2'
  };

  // Forged fake closed window
  const forgedWindow = {
    windowId: 'win_forged_999',
    windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
    status: RESPONSE_WINDOW_STATUS.CLOSED,
    resolutionStatus: RESPONSE_WINDOW_STATUS.CLOSED,
    _closedViaTwoPasses: true,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent'
  };

  const res = await game.windows.resolveBattleComparison(forgedWindow);
  assert.equal(res.success, false);
  assert.equal(res.code, 'UNAUTHORIZED_WINDOW_TOKEN');
  assert.equal(state.players.opponent.field.length, 1);
});

test('M3.3.1-A-04: Calling public method with stale window from prior combat fails', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Atk' }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Blk' }, 'opponent'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.players.opponent.field = [blkStack];

  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: blkStack.id,
    blockerSide: 'opponent',
    stage: 'FLASH_2'
  };

  const staleWindow = {
    windowId: 'win_stale_1',
    windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
    status: RESPONSE_WINDOW_STATUS.CLOSED,
    _closedViaTwoPasses: true,
    _resolutionToken: Symbol('stale_token'),
    attackerStackId: 'old_attacker_id',
    blockerStackId: 'old_blocker_id'
  };

  const res = await game.windows.resolveBattleComparison(staleWindow);
  assert.equal(res.success, false);
  assert.ok(res.code === 'UNAUTHORIZED_WINDOW_TOKEN' || res.code === 'BATTLE_ENTITY_MISMATCH');
});

test('M3.3.1-A-05: Legitimate two-pass Flash 2 closure resolves BP comparison exactly once', async () => {
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

  // Pass 1: Opponent passes
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  // Pass 2: Player passes -> Flash 2 closes naturally
  const pass2 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });

  assert.equal(pass2.success, true);
  assert.equal(pass2.closed, true);
  assert.equal(bpCompareCount, 1, 'BP Comparison executed exactly once');
  assert.equal(state.players.opponent.field.length, 0, 'Blocker destroyed in battle');

  // Attempt second resolution on already resolved combat
  const secondAttempt = await game.windows.resolveBattleComparison(flash2Win);
  assert.equal(secondAttempt.success, false);
  assert.ok(secondAttempt.code === 'NOT_IN_COMBAT' || secondAttempt.code === 'BATTLE_ALREADY_RESOLVED' || secondAttempt.code === 'UNAUTHORIZED_WINDOW_TOKEN');
});

test('M3.3.1-A-06: Blocker and attacker references must match current combat', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Atk' }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Blk' }, 'opponent'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.players.opponent.field = [blkStack];

  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: blkStack.id,
    blockerSide: 'opponent',
    stage: 'FLASH_2'
  };

  const token = Symbol('token');
  game.windows._trustedResolutionToken = token;

  const mismatchWin = {
    windowId: 'win_mismatch',
    windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
    status: RESPONSE_WINDOW_STATUS.CLOSED,
    _closedViaTwoPasses: true,
    _resolutionToken: token,
    attackerStackId: 'completely_different_attacker',
    blockerStackId: blkStack.id
  };

  const res = await game.windows.resolveBattleComparison(mismatchWin);
  assert.equal(res.success, false);
  assert.equal(res.code, 'BATTLE_ENTITY_MISMATCH');
});
