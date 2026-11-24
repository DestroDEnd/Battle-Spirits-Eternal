/**
 * tests/phase_m3_response_window_manager.test.js
 * 
 * Battle Spirits Eternal — Phase M.3 Work Package A:
 * Response Window Manager Core Unit Tests.
 * 
 * Verifies:
 * 1. Window Stack Lifecycle (open, suspend parent, resume parent, close).
 * 2. Timing and Type taxonomy (FLASH_1, BLOCK_DECLARATION, FLASH_2, BURST, GENERAL_RESPONSE).
 * 3. Priority ownership and priority alternation on pass.
 * 4. Two consecutive passes required to close Flash windows.
 * 5. canPerformAction legality validation for priority player and allowed actions.
 * 6. InteractionController synchronization (state.pendingInteractions).
 * 7. Backward compatibility as TimingWindowManager.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import {
  ResponseWindowManager,
  TimingWindowManager,
  RESPONSE_WINDOW_TYPES,
  RESPONSE_WINDOW_STATUS,
  WINDOW_TYPES,
  WINDOW_STATUS,
  resetWindowCounter
} from '../engine/windows.js';

test('PHASE-M3-MGR-01: ResponseWindowManager initialization and backward compatibility alias', () => {
  resetWindowCounter();
  const game = createGame();
  const mgr = new ResponseWindowManager(game);

  assert.ok(mgr instanceof ResponseWindowManager, 'Must be instance of ResponseWindowManager');
  assert.equal(ResponseWindowManager, TimingWindowManager, 'TimingWindowManager must be an alias for ResponseWindowManager');
  assert.equal(mgr.getCurrentWindow(), null, 'Initially no active window');
  assert.equal(mgr.getPriorityPlayer(), null, 'Initially no priority player');
  assert.equal(mgr.isResponseWindowActive(), false, 'Initially response window not active');
});

test('PHASE-M3-MGR-02: Open, suspend, and resume nested timing windows', async () => {
  resetWindowCounter();
  const game = createGame();
  const mgr = new ResponseWindowManager(game);

  // 1. Open Flash 1 window (Attacker = player, Defender = opponent)
  const win1 = await mgr.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  assert.equal(win1.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(win1.priorityPlayer, 'opponent');
  assert.equal(win1.resolutionStatus, RESPONSE_WINDOW_STATUS.OPEN);
  assert.equal(mgr.getCurrentWindow().windowId, win1.windowId);
  assert.equal(mgr.getPriorityPlayer(), 'opponent');
  assert.equal(mgr.isResponseWindowActive(), true);

  // 2. Open nested Burst window while Flash 1 is open -> Flash 1 suspended
  const win2 = await mgr.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.BURST,
    priorityPlayer: 'opponent'
  });

  assert.equal(win2.windowType, RESPONSE_WINDOW_TYPES.BURST);
  assert.equal(win1.resolutionStatus, RESPONSE_WINDOW_STATUS.SUSPENDED);
  assert.equal(mgr.getCurrentWindow().windowId, win2.windowId);

  // 3. Close Burst window -> Flash 1 resumed to OPEN
  const closedBurst = await mgr.closeWindow(win2.windowId);
  assert.equal(closedBurst.resolutionStatus, RESPONSE_WINDOW_STATUS.CLOSED);
  assert.equal(win1.resolutionStatus, RESPONSE_WINDOW_STATUS.OPEN);
  assert.equal(mgr.getCurrentWindow().windowId, win1.windowId);
  assert.equal(mgr.getPriorityPlayer(), 'opponent');

  // 4. Close Flash 1 window
  const closedFlash1 = await mgr.closeWindow(win1.windowId);
  assert.equal(closedFlash1.resolutionStatus, RESPONSE_WINDOW_STATUS.CLOSED);
  assert.equal(mgr.getCurrentWindow(), null);
  assert.equal(mgr.isResponseWindowActive(), false);
});

test('PHASE-M3-MGR-03: canPerformAction validates priority player and eligible actions', async () => {
  resetWindowCounter();
  const game = createGame();
  const mgr = new ResponseWindowManager(game);

  await mgr.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Non-priority player (player) cannot act
  const checkAttacker = mgr.canPerformAction('PASS', 'player');
  assert.equal(checkAttacker.allowed, false);
  assert.equal(checkAttacker.reason, 'NOT_PRIORITY_PLAYER');

  // Priority player (opponent) can PASS
  const checkDefenderPass = mgr.canPerformAction('PASS', 'opponent');
  assert.equal(checkDefenderPass.allowed, true);

  // Priority player cannot perform an action not eligible in the window (e.g. STEP_ADVANCE)
  const checkDefenderStep = mgr.canPerformAction('STEP_ADVANCE', 'opponent');
  assert.equal(checkDefenderStep.allowed, false);
  assert.equal(checkDefenderStep.reason, 'ACTION_NOT_ELIGIBLE_IN_WINDOW');
});

test('PHASE-M3-MGR-04: Priority alternation and window closure after two consecutive passes', async () => {
  resetWindowCounter();
  const game = createGame();
  const mgr = new ResponseWindowManager(game);

  const win = await mgr.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  assert.equal(win.priorityPlayer, 'opponent');
  assert.equal(win.consecutivePasses, 0);

  // Pass 1: Opponent passes -> Priority switches to Player
  const pass1 = await mgr.passPriority('opponent');
  assert.equal(pass1.success, true);
  assert.equal(pass1.closed, false);
  assert.equal(pass1.nextPriority, 'player');
  assert.equal(win.priorityPlayer, 'player');
  assert.equal(win.consecutivePasses, 1);

  // Pass 2: Player passes -> 2 consecutive passes -> Flash 1 closes, Block Declaration opens
  const pass2 = await mgr.passPriority('player');
  assert.equal(pass2.success, true);
  assert.equal(pass2.closed, true);

  // Automatically advanced to BLOCK_DECLARATION via onWindowClosed
  const blockWin = mgr.getCurrentWindow();
  assert.ok(blockWin, 'Block Declaration window must be open');
  assert.equal(blockWin.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);
  assert.equal(blockWin.priorityPlayer, 'opponent', 'Defender must have priority in Block Declaration');
});

test('PHASE-M3-MGR-05: Interaction synchronization generates pendingInteractions request', async () => {
  resetWindowCounter();
  const game = createGame({ interactive: true });
  const mgr = new ResponseWindowManager(game);

  await mgr.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  const pending = game.state.pendingInteractions || [];
  assert.equal(pending.length, 1, 'Exactly one interaction request must be pending');
  const inter = pending[0];
  assert.equal(inter.decisionOwner, 'opponent');
  assert.equal(inter.timingWindow, 'FIRST_FLASH_TIMING');
  assert.ok(inter.candidates.some(c => c.action === 'PASS'), 'PASS action candidate must be present');
});
