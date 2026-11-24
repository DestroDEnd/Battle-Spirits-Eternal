/**
 * tests/phase_m3_2_response_window_lifecycle.test.js
 * 
 * Phase M.3.2 Work Package H & L: Response Window Priority and Lifecycle Tests
 * 
 * Verifies:
 * 1. Full blocked combat lifecycle:
 *    Attack Declaration -> FLASH_1 (Defender priority 1) -> Non-forfeiture Alternation ->
 *    2 consecutive passes -> BLOCK_DECLARATION -> Defender declares block ->
 *    FLASH_2 (Defender priority 1) -> 2 consecutive passes -> BP Comparison.
 * 2. Unblocked combat lifecycle:
 *    Attack Declaration -> FLASH_1 -> Pass Block (PASS_BLOCK) ->
 *    FLASH_2 skipped entirely -> Direct Hit life reduction.
 * 3. Strict lifecycle state machine: No out-of-order transitions or premature closures.
 * 4. Non-forfeiture rule: Passing priority does not surrender the ability to act after opponent acts.
 * 5. Two consecutive passes rule: Exactly 2 consecutive passes close the flash window.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import {
  RESPONSE_WINDOW_TYPES,
  RESPONSE_WINDOW_STATUS,
  resetWindowCounter
} from '../engine/windows.js';

test('M3.2-L6-01: Full Blocked Combat Lifecycle (Attack -> Flash 1 -> Block -> Flash 2 -> BP Compare)', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  // Attacker: BP 5000
  const atkCard = createCardInstance({ name: 'Siekwurm', bp: 5000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 2, soul: 0 });
  atkStack.state = 'REFRESHED';
  state.players.player.field.push(atkStack);

  // Blocker: BP 3000
  const blkCard = createCardInstance({ name: 'Shield Dragon', bp: 3000, type: 'Spirit' }, 'opponent');
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  blkStack.state = 'REFRESHED';
  state.players.opponent.field.push(blkStack);

  // Magic in attacker hand for Flash 1 test
  const flashMagic = createCardInstance({
    name: 'Flash Boost',
    type: 'Magic',
    cost: 1,
    compiledIr: {
      abilities: [{
        header: { timing: 'FLASH', isFlash: true },
        clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
      }]
    }
  }, 'player');
  state.players.player.hand.push(flashMagic);
  state.players.player.deck.push(createCardInstance({ name: 'Player Deck' }, 'player'));
  state.players.player.reserve = { normal: 5, soul: 0 };
  state.players.opponent.reserve = { normal: 5, soul: 0 };

  // 1. Declare Attack -> initiates combat & opens FLASH_1
  const atkRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkRes.success, true, 'Attack declaration must succeed');
  assert.ok(game.windows.isResponseWindowActive(), 'Response window must be active');
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent', 'Defender must receive first priority in FLASH_1');

  // 2. Defender passes priority -> Alternates to attacker, consecutivePasses = 1
  const pass1 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(pass1.success, true);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player');
  assert.equal(game.windows.activeWindow.consecutivePasses, 1);

  // 3. Attacker uses Flash Magic -> resets consecutivePasses to 0, alternates priority back to defender
  const flashRes = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: flashMagic.id
  }, { responder: 'player' });
  assert.equal(flashRes.success, true);
  assert.equal(game.windows.activeWindow.consecutivePasses, 0, 'Flash action must reset passes to 0');
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent', 'Priority must alternate back to defender');

  // 4. Defender passes -> passes = 1
  const pass2 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(pass2.success, true);
  assert.equal(game.windows.activeWindow.consecutivePasses, 1);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player');

  // 5. Attacker passes -> 2 consecutive passes -> FLASH_1 closes, BLOCK_DECLARATION opens
  const pass3 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });
  assert.equal(pass3.success, true);
  assert.ok(game.windows.isResponseWindowActive(), 'Block Declaration window must open');
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent', 'Defender must have priority to declare block');

  // 6. Defender declares block with Shield Dragon
  const blkRes = await game.windows.submitResponse({
    action: 'DECLARE_BLOCK',
    blockerStackId: blkStack.id
  }, { responder: 'opponent' });
  assert.equal(blkRes.success, true);
  assert.equal(blkStack.state, 'EXHAUSTED', 'Blocker must be exhausted');

  // 7. FLASH_2 is opened automatically, defender has first priority
  assert.ok(game.windows.isResponseWindowActive());
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_2);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent');

  // 8. Both pass in FLASH_2
  const f2Pass1 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(f2Pass1.success, true);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player');

  const f2Pass2 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });
  assert.equal(f2Pass2.success, true);

  // 9. FLASH_2 closes -> BP Comparison resolves automatically
  // Attacker 5000 BP vs Blocker 3000 BP -> Blocker destroyed to grave
  assert.equal(game.windows.isResponseWindowActive(), false, 'All combat windows must be closed');
  assert.equal(state.players.opponent.field.some(f => f.id === blkStack.id), false, 'Lower BP blocker must be removed from field');
  assert.equal(state.players.opponent.grave.some(c => c.id === blkCard.id), true, 'Destroyed blocker must be in grave');
  assert.equal(state.players.player.field.some(f => f.id === atkStack.id), true, 'Higher BP attacker must survive');
});

test('M3.2-L6-02: Unblocked Combat Lifecycle (Attack -> Flash 1 -> Pass Block -> Skip Flash 2 -> Direct Hit)', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Direct Attacker', bp: 4000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  atkStack.state = 'REFRESHED';
  state.players.player.field.push(atkStack);
  state.players.opponent.life = 5;

  // Declare attack -> Flash 1
  await game.declareAttack(atkStack.id, 'player');
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);

  // Both pass Flash 1
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });

  // Block Declaration window
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);

  // Defender chooses not to block (passes block)
  const passBlockRes = await game.windows.submitResponse({ action: 'PASS_BLOCK' }, { responder: 'opponent' });
  assert.equal(passBlockRes.success, true);

  // FLASH_2 must be completely skipped! Direct hit resolves!
  assert.equal(game.windows.isResponseWindowActive(), false, 'Response window must close after direct hit');
  assert.equal(state.players.opponent.life, 4, 'Defender life must be reduced by 1 direct hit');
  assert.equal(state.players.opponent.reserve.normal, 4, 'Lost life core must move to reserve');
});

test('M3.2-L6-03: Non-forfeiture rule: Passing does not forfeit future flash opportunities in same window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Attacker Spirit', bp: 3000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  const defFlashMagic = createCardInstance({
    name: 'Defender Flash Shield',
    type: 'Magic',
    cost: 1,
    compiledIr: {
      abilities: [{
        header: { timing: 'FLASH', isFlash: true },
        clauses: [{ op: { op: 'BP_BUFF', amount: 2000 } }]
      }]
    }
  }, 'opponent');
  state.players.opponent.hand.push(defFlashMagic);
  state.players.opponent.reserve = { normal: 3, soul: 0 };

  const atkFlashMagic = createCardInstance({
    name: 'Attacker Flash Sword',
    type: 'Magic',
    cost: 1,
    compiledIr: {
      abilities: [{
        header: { timing: 'FLASH', isFlash: true },
        clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
      }]
    }
  }, 'player');
  state.players.player.hand.push(atkFlashMagic);
  state.players.player.reserve = { normal: 3, soul: 0 };

  await game.declareAttack(atkStack.id, 'player');

  // Defender passes initially -> Priority alternates to player
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player');

  // Attacker plays flash -> Priority alternates back to opponent
  const atkActRes = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: atkFlashMagic.id
  }, { responder: 'player' });
  assert.equal(atkActRes.success, true);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent');

  // Defender who passed earlier can NOW legally play a flash effect!
  const defActRes = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: defFlashMagic.id
  }, { responder: 'opponent' });
  assert.equal(defActRes.success, true, 'Defender who passed earlier must NOT forfeit subsequent Flash timing');
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player', 'Priority must alternate after defender flash');
});

test('M3.2-L6-04: Cannot transition response windows out of order (State machine integrity)', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Order Spirit', bp: 3000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  await game.declareAttack(atkStack.id, 'player');
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);

  // Attempting to declare block while FLASH_1 is still open must fail
  const directBlock = await game.declareBlock('any_stack', 'opponent');
  assert.equal(directBlock.success, false);
  assert.equal(directBlock.reason, 'FLASH_TIMING_NOT_CLOSED');

  // Attempting to resolve direct hit while FLASH_1 is open must fail
  const directHit = await game.resolveDirectHit('player');
  assert.equal(directHit.success, false);
  assert.equal(directHit.code, 'BLOCK_DECISION_REQUIRED');
});

test('M3.2-L6-05: Exactly 2 consecutive passes close the flash window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Pass Spirit', bp: 3000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  await game.declareAttack(atkStack.id, 'player');
  const win = game.windows.activeWindow;
  assert.equal(win.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);

  // Pass 1: does NOT close window
  const pass1 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(pass1.closed, false);
  assert.equal(game.windows.activeWindow.id, win.id);

  // Pass 2: CLOSES window and advances to BLOCK_DECLARATION
  const pass2 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });
  assert.equal(pass2.closed, true);
  assert.notEqual(game.windows.activeWindow.id, win.id);
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);
});

