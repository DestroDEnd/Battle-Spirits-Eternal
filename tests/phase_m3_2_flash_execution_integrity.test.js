/**
 * tests/phase_m3_2_flash_execution_integrity.test.js
 * 
 * Phase M.3.2 Work Package L4: Flash Action Execution Integrity Tests
 * 
 * Verifies that:
 * 1. A successful Flash action resets consecutive passes to 0 and alternates priority.
 * 2. A failed Flash action does NOT reset consecutive passes, does NOT alternate priority,
 *    and does not mutate player state (cores, cards).
 * 3. Insufficient cost fails safely with state rollback and unchanged priority.
 * 4. An unresolvable/illegal ability preserves priority and window state.
 * 5. Invalid candidate IDs do not alter the window.
 * 6. Failed actions do not emit false FLASH_ACTION_RESOLVED events.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';

test('M3.2-L4-01: Successful Flash resets passes to 0, alternates priority, and emits event', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const flashCard = createCardInstance({
    name: 'Flash Strike',
    type: 'Magic',
    cost: 1,
    compiledIr: { abilities: [{ header: { isFlash: true, timing: 'FLASH' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }] }
  }, 'opponent');
  state.players.opponent.hand = [flashCard];
  state.players.opponent.deck = [createCardInstance({ name: 'Deck Card' }, 'opponent')];
  state.players.opponent.reserve = { normal: 3, soul: 0 };

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Defender passes once -> consecutivePasses = 1, priority = player
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(win.consecutivePasses, 1);
  assert.equal(win.priorityPlayer, 'player');

  // Player passes once -> wait, we want player to cast flash so passes reset from 1 to 0!
  const playerFlash = createCardInstance({
    name: 'Attacker Flash',
    type: 'Magic',
    cost: 1,
    compiledIr: { abilities: [{ header: { isFlash: true, timing: 'FLASH' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }] }
  }, 'player');
  state.players.player.hand = [playerFlash];
  state.players.player.deck = [createCardInstance({ name: 'Player Deck' }, 'player')];
  state.players.player.reserve = { normal: 3, soul: 0 };

  const eventsList = [];
  game.events.on('FLASH_ACTION_RESOLVED', ev => eventsList.push(ev));

  const res = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: playerFlash.id
  }, { responder: 'player' });

  assert.equal(res.success, true);
  assert.equal(res.consecutivePasses, 0, 'Consecutive passes must reset to 0 after successful Flash');
  assert.equal(win.consecutivePasses, 0);
  assert.equal(win.priorityPlayer, 'opponent', 'Priority must alternate to opponent');
  assert.equal(eventsList.length, 1);
  assert.equal(eventsList[0].action, 'CAST_FLASH_MAGIC');
});

test('M3.2-L4-02: Failed Flash (insufficient cost) preserves priority, pass count, and reserves', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  // Cost 5 magic, but player only has 1 core in reserve!
  const expensiveMagic = createCardInstance({
    name: 'Mega Flare',
    type: 'Magic',
    cost: 5,
    compiledIr: { abilities: [{ header: { isFlash: true, timing: 'FLASH' }, clauses: [{ op: { op: 'BP_BUFF', amount: 5000 } }] }] }
  }, 'opponent');
  state.players.opponent.hand = [expensiveMagic];
  state.players.opponent.reserve = { normal: 1, soul: 0 };

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  win.consecutivePasses = 1; // Prior pass recorded
  const eventsList = [];
  game.events.on('FLASH_ACTION_RESOLVED', ev => eventsList.push(ev));

  const res = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: expensiveMagic.id
  }, { responder: 'opponent' });

  // Must report failure
  assert.equal(res.success, false);
  assert.ok(res.reason.includes('CANNOT_AFFORD') || res.reason.includes('COST') || res.reason.includes('INSUFFICIENT_CORES'));

  // Priority and passes must NOT change!
  assert.equal(win.priorityPlayer, 'opponent', 'Priority must remain with opponent');
  assert.equal(win.consecutivePasses, 1, 'Consecutive passes must remain unchanged');

  // Card must remain in hand and cores preserved!
  assert.equal(state.players.opponent.hand.some(c => c.id === expensiveMagic.id), true);
  assert.equal(state.players.opponent.reserve.normal, 1);
  assert.equal(eventsList.length, 0, 'No FLASH_ACTION_RESOLVED event emitted on failure');
});

test('M3.2-L4-03: Invalid candidate ID or missing card does not mutate response window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  const res = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: 'non_existent_card_id'
  }, { responder: 'opponent' });

  assert.equal(res.success, false);
  assert.equal(win.priorityPlayer, 'opponent');
  assert.equal(win.consecutivePasses, 0);
});

test('M3.2-L4-04: Non-priority player flash attempt does not mutate window or reset passes', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const playerMagic = createCardInstance({
    name: 'Fast Spell',
    type: 'Magic',
    cost: 1,
    compiledIr: { abilities: [{ header: { isFlash: true, timing: 'FLASH' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }] }
  }, 'player');
  state.players.player.hand = [playerMagic];
  state.players.player.reserve = { normal: 5, soul: 0 };

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent' // Defender holds priority!
  });

  win.consecutivePasses = 1;

  // Attacker tries to submit flash while defender holds priority
  const res = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: playerMagic.id
  }, { responder: 'player' });

  assert.equal(res.success, false);
  assert.equal(res.reason, 'NOT_PRIORITY_PLAYER');
  assert.equal(win.priorityPlayer, 'opponent');
  assert.equal(win.consecutivePasses, 1);
});
