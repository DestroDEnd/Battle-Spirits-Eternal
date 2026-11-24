/**
 * tests/phase_m3_flash_priority.test.js
 * 
 * Battle Spirits Eternal — Phase M.3 Work Package B:
 * Rules-Driven Flash Priority Alternation & 17.0 Compliance Tests.
 * 
 * Verifies:
 * 1. Defender Priority 1: Defending player always receives first priority in Flash 1 and Flash 2.
 * 2. Alternating Priority: After each legal response action or pass, priority alternates.
 * 3. Non-Forfeiture of Priority: Passing does NOT surrender future priority; if opponent acts,
 *    consecutive passes resets to 0 and the passing player gets priority again.
 * 4. Two Consecutive Passes: A Flash window closes ONLY when both players pass consecutively.
 * 5. Flash Action Execution: Magic, abilities, or Accel reset consecutive passes to 0.
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

test('PHASE-M3-FLASH-01: Defending player ALWAYS receives first priority in Flash 1', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player'; // Attacker = player, Defender = opponent

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent'
  });

  assert.equal(win.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(win.priorityPlayer, 'opponent', 'Defending player must hold priority 1 in Flash 1');
  assert.equal(game.windows.getPriorityPlayer(), 'opponent');
});

test('PHASE-M3-FLASH-02: Priority alternates after each Pass', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent'
  });

  // Turn 1: Opponent (Defender) passes
  const pass1 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(pass1.success, true);
  assert.equal(pass1.closed, false);
  assert.equal(pass1.nextPriority, 'player', 'Priority must alternate to attacking player');
  assert.equal(win.consecutivePasses, 1);

  // Attempting to act out of priority rejects
  const illegalAct = game.windows.canPerformAction('PASS', 'opponent');
  assert.equal(illegalAct.allowed, false);
  assert.equal(illegalAct.reason, 'NOT_PRIORITY_PLAYER');
});

test('PHASE-M3-FLASH-03: Two consecutive passes close Flash window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';

  let closedCaptured = false;
  game.events.on('RESPONSE_WINDOW_CLOSED', (e) => {
    if (e.windowType === RESPONSE_WINDOW_TYPES.FLASH_1) {
      closedCaptured = true;
    }
  });

  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent'
  });

  // Defender passes
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  // Attacker passes
  const pass2 = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });

  assert.equal(pass2.success, true);
  assert.equal(pass2.closed, true, 'Flash 1 window must close on 2 consecutive passes');
  assert.equal(closedCaptured, true, 'RESPONSE_WINDOW_CLOSED event must be emitted');

  // Next window in lifecycle opens: BLOCK_DECLARATION
  const nextWin = game.windows.getCurrentWindow();
  assert.ok(nextWin);
  assert.equal(nextWin.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);
});

test('PHASE-M3-FLASH-04: Flash action resets consecutive passes to 0 and passes priority back', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';

  // Give attacker a flash magic card in hand
  const flashMagic = createCardInstance({
    name: 'Spark Shot',
    type: 'Magic',
    cost: 1,
    compiledIr: {
      abilities: [
        {
          header: { isFlash: true, timing: 'FLASH' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');
  state.players.player.hand.push(flashMagic);
  state.players.player.reserve = { normal: 5, soul: 0 };

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent'
  });

  // 1. Defender passes -> consecutivePasses = 1, priority = player
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(win.consecutivePasses, 1);
  assert.equal(win.priorityPlayer, 'player');

  // 2. Attacker casts flash magic -> consecutivePasses MUST reset to 0, priority switches back to defender
  const actRes = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: flashMagic.id
  }, { responder: 'player' });

  assert.equal(actRes.success, true);
  assert.equal(actRes.consecutivePasses, 0, 'Consecutive passes must reset to 0 after flash action');
  assert.equal(win.consecutivePasses, 0);
  assert.equal(win.priorityPlayer, 'opponent', 'Priority must alternate to opponent after flash action');

  // 3. Defender passes again -> consecutivePasses = 1 (Window does NOT close!)
  const passAfterAction = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(passAfterAction.closed, false, 'Window must NOT close after only 1 pass following a flash action');
  assert.equal(win.consecutivePasses, 1);
  assert.equal(win.priorityPlayer, 'player');

  // 4. Attacker passes -> consecutivePasses = 2 -> NOW window closes
  const passClose = await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });
  assert.equal(passClose.closed, true);
});
