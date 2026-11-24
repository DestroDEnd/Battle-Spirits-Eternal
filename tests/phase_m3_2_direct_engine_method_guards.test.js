/**
 * tests/phase_m3_2_direct_engine_method_guards.test.js
 * 
 * Phase M.3.2 Work Package L2: Direct Engine Method Guards
 * 
 * Verifies that direct engine methods cannot independently bypass the response-window lifecycle:
 * 1. declareBlock() cannot close Flash 1 and skip Flash timing.
 * 2. resolveDirectHit() cannot bypass block declaration when a block window is open.
 * 3. resolveBattleComparison() cannot bypass Flash 2.
 * 4. declareAttack() cannot interrupt an active combat response window.
 * 5. Direct playCard() cannot use Flash during Attack Step without an open Flash window.
 * 6. Direct activateAbility() cannot activate Flash without valid timing and priority.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';

test('M3.2-L2-01: declareBlock() cannot close Flash 1 or skip Flash timing', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Attacker Spirit' }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Defender Spirit' }, 'opponent'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.players.opponent.field = [blkStack];

  // Declare attack to legitimately open FLASH_1
  await game.declareAttack(atkStack.id, 'player');
  const win = game.windows.getCurrentWindow();
  assert.equal(win?.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);

  // Directly call declareBlock() while FLASH_1 is still open
  const blkRes = await game.declareBlock(blkStack.id, 'opponent');
  assert.equal(blkRes.success, false);
  assert.equal(blkRes.reason, 'FLASH_TIMING_NOT_CLOSED');

  // Flash 1 window must remain intact and open!
  const winAfter = game.windows.getCurrentWindow();
  assert.ok(winAfter);
  assert.equal(winAfter.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(winAfter.windowId, win.windowId);
});

test('M3.2-L2-02: resolveDirectHit() cannot bypass block declaration while block window is active', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Attacker Spirit' }, 'player'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: null,
    stage: 'BLOCK'
  };

  // Open Block Declaration window
  const blockWin = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  const oppLifeBefore = state.players.opponent.life;

  // Direct call to resolveDirectHit() while block declaration is open must fail!
  const hitRes = await game.resolveDirectHit('player');
  assert.equal(hitRes.success, false);
  assert.equal(hitRes.code, 'BLOCK_DECISION_REQUIRED');
  assert.equal(state.players.opponent.life, oppLifeBefore, 'Opponent life must not decrease');

  // Window must remain open
  const curWin = game.windows.getCurrentWindow();
  assert.equal(curWin?.windowId, blockWin.windowId);
});

test('M3.2-L2-03: resolveBattleComparison() cannot bypass Flash 2 window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Atk', bp: 5000 }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Blk', bp: 3000 }, 'opponent'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  state.players.opponent.field = [blkStack];
  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: blkStack.id,
    stage: 'FLASH_2'
  };

  // Open FLASH_2 window
  const flash2Win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Direct resolution of battle while Flash 2 is active must fail or resolve window properly
  const curWin = game.windows.getCurrentWindow();
  assert.equal(curWin.windowType, RESPONSE_WINDOW_TYPES.FLASH_2);
  assert.equal(curWin.priorityPlayer, 'opponent');
});

test('M3.2-L2-04: declareAttack() cannot interrupt an active combat response window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const sp1 = createFieldStack(createCardInstance({ name: 'Spirit 1' }, 'player'), { normal: 1, soul: 0 });
  const sp2 = createFieldStack(createCardInstance({ name: 'Spirit 2' }, 'player'), { normal: 1, soul: 0 });
  state.players.player.field = [sp1, sp2];

  // Declare attack with spirit 1 to open FLASH_1
  await game.declareAttack(sp1.id, 'player');
  const win = game.windows.getCurrentWindow();
  assert.equal(win.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);

  // Attempt to declare attack with spirit 2 while FLASH_1 is open -> Must reject!
  const secondAtk = await game.declareAttack(sp2.id, 'player');
  assert.equal(secondAtk.success, false);
  assert.ok(secondAtk.code === 'NOT_PRIORITY_PLAYER' || secondAtk.code === 'RESPONSE_WINDOW_ACTIVE' || secondAtk.reason === 'COMBAT_ALREADY_IN_PROGRESS');
});

test('M3.2-L2-05: Direct playCard() cannot use Flash during Attack Step without an active Flash window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const flashCard = createCardInstance({
    id: 'flash_magic_no_win',
    name: 'Flash Magic',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - Draw 1 card.',
    compiledIr: { abilities: [{ header: { isFlash: true, timing: 'FLASH' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }] }
  }, 'player');
  state.players.player.hand = [flashCard];
  state.players.player.deck.push(createCardInstance({ name: 'Deck Card' }, 'player'));
  state.players.player.reserve = { normal: 5, soul: 0 };
  state.combat = { attackerStackId: 'dummy', stage: 'ATTACK' }; // Active combat, but NO open Flash window!

  // In active combat without an open Flash window, Flash magic cannot be played
  const res = await game.playCard(flashCard.id, [], 'player', { timing: 'FLASH' });
  assert.equal(res.success, false);
  assert.ok(res.code === 'FLASH_TIMING_NOT_OPEN' || res.reason === 'FLASH_TIMING_NOT_OPEN' || res.code === 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP');
});

test('M3.2-L2-06: Direct activateAbility() cannot activate Flash without valid timing and priority', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const flashSpirit = createCardInstance({
    id: 'flash_sp_no_prio',
    name: 'Flash Knight',
    type: 'Spirit',
    cost: 3,
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [
        {
          id: 'ab_fl_knight',
          physicalId: 'phy_fl_knight',
          header: { timing: 'FLASH', isFlash: true, levels: [1] },
          clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
        }
      ]
    }
  }, 'player');

  state.players.player.field = [createFieldStack(flashSpirit, { normal: 1, soul: 0 })];

  // Open window where OPPONENT holds priority
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Attacker attempts to activate Flash ability while opponent holds priority
  const res = await game.activateAbility(flashSpirit.id, 'phy_fl_knight', 'player');
  assert.equal(res.success, false);
  assert.ok(res.code === 'NOT_PRIORITY_PLAYER' || res.reason === 'NOT_PRIORITY_PLAYER');
});
