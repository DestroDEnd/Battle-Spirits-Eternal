/**
 * tests/phase_m3_3_universal_engine_authority.test.js
 * 
 * Phase M.3.3 Work Package F: Universal Action Authorization Across Direct Engine Methods
 * 
 * Asserts that:
 * 1. Direct engine methods invoke authorizeAction() before mutating state.
 * 2. Active response windows block direct invocation of non-eligible ordinary actions.
 * 3. Non-priority players cannot execute direct actions during response windows.
 * 4. Non-active player cannot execute direct turn-controlled actions outside response windows.
 * 5. Game-over state rejects all direct actions with GAME_ALREADY_OVER.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { TimingWindowManager, RESPONSE_WINDOW_TYPES } from '../engine/windows.js';

test('M3.3-F-01: Direct engine methods are blocked when response window is active', async () => {
  const game = createGame();
  const windows = new TimingWindowManager(game);
  game.windows = windows;

  game.state.activePlayer = 'player';
  game.state.step = 'ATTACK';

  // Open FLASH_1 with defender (opponent) holding priority
  await windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  const normalSpirit = createCardInstance({ name: 'Ordinary Spirit', type: 'Spirit', cost: 1 }, 'player');
  game.state.players.player.hand = [normalSpirit];
  game.state.players.player.reserve = { normal: 5, soul: 1 };

  // 1. Direct playCard (non-flash) must be blocked
  const playRes = await game.playCard(normalSpirit.id, [], 'player');
  assert.equal(playRes.success, false);
  assert.equal(playRes.reason, 'RESPONSE_WINDOW_ACTIVE');

  // 2. Direct setBurst must be blocked
  const burstRes = await game.setBurst(normalSpirit.id, 'player');
  assert.equal(burstRes.success, false);
  assert.equal(burstRes.reason, 'RESPONSE_WINDOW_ACTIVE');

  // 3. Direct transferCore must be blocked
  const transferRes = await game.transferCore(1, { zone: 'reserve', side: 'player' }, { zone: 'reserve', side: 'player' }, 'player');
  assert.equal(transferRes.success, false);
  assert.equal(transferRes.reason, 'RESPONSE_WINDOW_ACTIVE');

  // 4. Direct setMirage must be blocked
  const mirageRes = await game.setMirage(normalSpirit.id, 'player');
  assert.equal(mirageRes.success, false);
  assert.equal(mirageRes.reason, 'RESPONSE_WINDOW_ACTIVE');

  // 5. Direct separateBrave must be blocked
  const braveRes = await game.separateBrave('stack_any', null, 1, 'player');
  assert.equal(braveRes.success, false);
  assert.equal(braveRes.reason, 'RESPONSE_WINDOW_ACTIVE');
});

test('M3.3-F-02: Flash action during response window requires priority ownership', async () => {
  const game = createGame();
  const windows = new TimingWindowManager(game);
  game.windows = windows;

  game.state.activePlayer = 'player';
  game.state.step = 'ATTACK';

  // Open FLASH_1 with defender (opponent) holding priority
  await windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  const flashSpell = createCardInstance({
    name: 'Flash Spell',
    type: 'Magic',
    cost: 1,
    effect: '[Flash] Deal 1000 damage.'
  }, 'player');

  game.state.players.player.hand = [flashSpell];
  game.state.players.player.reserve = { normal: 5, soul: 1 };

  // Attacker (player) does NOT hold priority in Flash 1 initial window
  const flashRes = await game.playCard(flashSpell.id, [], 'player', { timing: 'FLASH' });
  assert.equal(flashRes.success, false);
  assert.equal(flashRes.reason, 'NOT_PRIORITY_PLAYER');
});

test('M3.3-F-03: Non-active player cannot execute direct turn-controlled actions outside response windows', async () => {
  const game = createGame();
  game.state.activePlayer = 'player';
  game.state.step = 'MAIN';

  const spirit = createCardInstance({ name: 'Opponent Spirit', type: 'Spirit', cost: 1 }, 'opponent');
  game.state.players.opponent.hand = [spirit];
  game.state.players.opponent.reserve = { normal: 5, soul: 1 };

  // Opponent cannot play card during player's turn
  const playRes = await game.playCard(spirit.id, [], 'opponent');
  assert.equal(playRes.success, false);
  assert.equal(playRes.reason, 'NOT_ACTIVE_PLAYER');

  // Opponent cannot set burst during player's turn
  const burstRes = await game.setBurst(spirit.id, 'opponent');
  assert.equal(burstRes.success, false);
  assert.equal(burstRes.reason, 'NOT_ACTIVE_PLAYER');

  // Opponent cannot transfer cores during player's turn
  const transferRes = await game.transferCore(1, { zone: 'reserve', side: 'opponent' }, { zone: 'reserve', side: 'opponent' }, 'opponent');
  assert.equal(transferRes.success, false);
  assert.equal(transferRes.reason, 'NOT_ACTIVE_PLAYER');
});

test('M3.3-F-04: Game over state rejects all direct actions with GAME_ALREADY_OVER', async () => {
  const game = createGame();
  game.state.winner = 'player';
  game.state.winReason = 'LIFE_REDUCED_TO_ZERO';

  const card = createCardInstance({ name: 'Spell', type: 'Magic', cost: 1 }, 'player');
  game.state.players.player.hand = [card];

  assert.equal((await game.playCard(card.id, [], 'player')).reason, 'GAME_ALREADY_OVER');
  assert.equal((await game.setBurst(card.id, 'player')).reason, 'GAME_ALREADY_OVER');
  assert.equal((await game.transferCore(1, {}, {}, 'player')).reason, 'GAME_ALREADY_OVER');
  assert.equal((await game.setMirage(card.id, 'player')).reason, 'GAME_ALREADY_OVER');
});
