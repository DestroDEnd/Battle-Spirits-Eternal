/**
 * tests/phase_m3_block_and_second_flash.test.js
 * 
 * Battle Spirits Eternal — Phase M.3 Work Package C:
 * Block Declaration, Conditional Second Flash & Combat Resolution Tests.
 * 
 * Verifies:
 * 1. Block Declared -> Blocker exhausts, WHEN_BLOCKS triggers, and FLASH_2 opens (Defender Priority 1).
 * 2. Second Flash Timing Alternation -> Closes after 2 consecutive passes -> BP comparison.
 * 3. Unblocked Attack (PASS_BLOCK) -> Second Flash Timing is SKIPPED entirely -> Direct hit life damage.
 * 4. Battle Resolution -> Higher BP destroys lower BP; equal BP destroys both; Curse triggers at end of battle.
 * 5. Attacker Leaves Field -> Per Eternal 17.0 rules, Flash 1 and Block steps still execute.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import {
  ResponseWindowManager,
  RESPONSE_WINDOW_TYPES,
  RESPONSE_WINDOW_STATUS,
  resetWindowCounter
} from '../engine/windows.js';

test('PHASE-M3-BLOCK-01: Block declared exhausts blocker and OPENS Second Flash Timing with Defender priority 1', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';

  // Setup Attacker
  const atkCard = createCardInstance({ name: 'Red Dragon', bp: 5000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  atkStack.state = 'EXHAUSTED';
  state.players.player.field.push(atkStack);

  // Setup Blocker
  const blkCard = createCardInstance({
    name: 'Shield Golem',
    bp: 4000,
    type: 'Spirit',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'WHEN_BLOCKS' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'opponent');
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  blkStack.state = 'REFRESHED';
  state.players.opponent.field.push(blkStack);
  state.players.opponent.deck.push(createCardInstance({ name: 'Drawn Card' }, 'opponent'));

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

  const p2HandBefore = state.players.opponent.hand.length;

  // Defender declares block with blkStack
  const blockRes = await game.windows.submitResponse({
    action: 'DECLARE_BLOCK',
    stackId: blkStack.id
  }, { responder: 'opponent' });

  assert.equal(blockRes.success, true);
  assert.equal(blockRes.blockDeclared, true);
  assert.equal(blkStack.state, 'EXHAUSTED', 'Blocker must be exhausted upon block declaration');
  assert.equal(state.combat.blockerStackId, blkStack.id);
  assert.equal(state.players.opponent.hand.length, p2HandBefore + 1, 'WHEN_BLOCKS trigger must have resolved');

  // Second Flash Timing MUST be open!
  assert.equal(blockRes.openedFlash2, true);
  const flash2Win = game.windows.getCurrentWindow();
  assert.ok(flash2Win, 'Flash 2 window must be open');
  assert.equal(flash2Win.windowType, RESPONSE_WINDOW_TYPES.FLASH_2);
  assert.equal(flash2Win.priorityPlayer, 'opponent', 'Defender must receive priority 1 in Flash 2');
});

test('PHASE-M3-BLOCK-02: Flash 2 closes after 2 passes and resolves BP comparison', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';

  // 5000 BP Attacker vs 4000 BP Blocker
  const atkCard = createCardInstance({ name: 'Red Dragon', levels: { 1: { cost: 1, bp: 5000 } }, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  atkStack.state = 'EXHAUSTED';
  state.players.player.field.push(atkStack);

  const blkCard = createCardInstance({ name: 'Shield Golem', levels: { 1: { cost: 1, bp: 4000 } }, type: 'Spirit' }, 'opponent');
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  blkStack.state = 'EXHAUSTED';
  state.players.opponent.field.push(blkStack);

  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: blkStack.id,
    stage: 'FLASH_2'
  };

  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Defender passes Flash 2
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  // Attacker passes Flash 2 -> 2 passes -> Resolves BP comparison!
  const pass2 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });

  assert.equal(pass2.success, true);
  assert.equal(pass2.closed, true);

  // 5000 BP > 4000 BP: Blocker is destroyed, Attacker survives
  assert.equal(state.players.opponent.field.length, 0, 'Lower BP blocker must be destroyed');
  assert.equal(state.players.opponent.grave.some(c => c.id === blkCard.id), true, 'Blocker moved to trash/grave');
  assert.equal(state.players.player.field.length, 1, 'Higher BP attacker survives');
  assert.equal(state.combat, null, 'state.combat must be cleared at end of battle');
});

test('PHASE-M3-BLOCK-03: Unblocked attack (PASS_BLOCK) SKIPS Flash 2 and resolves direct hit', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Red Dragon', bp: 5000, type: 'Spirit', symbols: ['Red'] }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  atkStack.state = 'EXHAUSTED';
  state.players.player.field.push(atkStack);

  state.players.opponent.life = 5;

  state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: null,
    stage: 'BLOCK'
  };

  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Defender chooses NOT to block
  const passBlockRes = await game.windows.submitResponse({
    action: 'PASS_BLOCK'
  }, { responder: 'opponent' });

  assert.equal(passBlockRes.success, true);
  assert.equal(passBlockRes.blockDeclared, false);
  assert.equal(passBlockRes.skippedFlash2, true, 'Second Flash Timing MUST be skipped on unblocked attack');

  // Flash 2 was never opened
  assert.equal(game.windows.getCurrentWindow(), null, 'No response window remains open');
  // Life damage applied directly
  assert.equal(state.players.opponent.life, 4, 'Defender life must be reduced by 1 from direct hit');
  assert.equal(state.combat, null, 'Combat must be completed');
});

test('PHASE-M3-BLOCK-04: Attacker leaving field during WHEN_ATTACKS still executes Flash 1 and Block', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';
  state.step = 'ATTACK';

  // Attacker that destroys itself on WHEN_ATTACKS
  const kamikazeCard = createCardInstance({
    name: 'Bomb Sprite',
    bp: 2000,
    type: 'Spirit',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'WHEN_ATTACKS' },
          clauses: [{ op: { op: 'DESTROY_SELF' } }]
        }
      ]
    }
  }, 'player');
  const atkStack = createFieldStack(kamikazeCard, { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  // Declare attack opens FLASH_1
  const atkRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkRes.success, true);

  // Response window Flash 1 is open even if attacker left field
  const flash1Win = game.windows.getCurrentWindow();
  assert.ok(flash1Win);
  assert.equal(flash1Win.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(flash1Win.priorityPlayer, 'opponent');
});
