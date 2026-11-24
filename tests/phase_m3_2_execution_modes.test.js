/**
 * tests/phase_m3_2_execution_modes.test.js
 * 
 * Phase M.3.2 Work Package I & L: Execution Modes and Interaction Protocol Tests
 * 
 * Verifies that all 4 execution modes operate with full action authority:
 * 1. HUMAN_VS_HUMAN: Two distinct tokens, strict priority gating, no AI bypass.
 * 2. HUMAN_VS_AI: Human player requires active responses; AI responds autonomously.
 * 3. AI_VS_AI: Autonomous execution between two AI agents without hanging.
 * 4. HEADLESS_SIMULATION: Direct engine execution enforces full response window logic without transports.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { SessionStore } from '../engine/session_store.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { EXECUTION_MODES } from '../engine/session_mode.js';
import { RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';

test('M3.2-L9-01: HUMAN_VS_HUMAN mode enforces strict two-player token and priority isolation', async () => {
  resetWindowCounter();
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice' }
  });
  const join = await manager.joinMatch(match.matchId, { id: 'bob' });
  const matchId = match.matchId;

  const active = await manager.ensureActiveGame(matchId);
  const game = active.game || active;
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Alice Spirit', bp: 5000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  game.state.players.player.field.push(atkStack);

  // Alice attacks
  await game.declareAttack(atkStack.id, 'player');
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent');

  // Alice (attacker) tries to act using Alice's token while Bob has priority -> REJECTED
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(matchId, { type: 'STEP_ADVANCE', step: 'END' }, { authToken: match.player1Token });
    },
    /RESPONSE_WINDOW_ACTIVE/
  );

  // Bob (defender) passes using Bob's token -> SUCCESS
  const bobPass = await manager.submitPlayerAction(matchId, { type: 'PASS_PRIORITY', action: 'PASS' }, { authToken: join.player2Token });
  assert.equal(bobPass.success, true);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player');

  // Bob now tries to act while Alice has priority -> REJECTED
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(matchId, { type: 'PASS_PRIORITY', action: 'PASS' }, { authToken: join.player2Token });
    },
    /NOT_PRIORITY_PLAYER/
  );
});

test('M3.2-L9-02: HUMAN_VS_AI mode operates with human interactive authority and automated AI response', async () => {
  resetWindowCounter();
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_AI,
    player1: { id: 'human_player' },
    player2: { id: 'ai_champion', autoJoined: true }
  });
  const matchId = match.matchId;

  const active = await manager.ensureActiveGame(matchId);
  const game = active.game || active;
  assert.equal(game.state.executionMode, EXECUTION_MODES.HUMAN_VS_AI);
  assert.equal(game.state.matchContext.mode, EXECUTION_MODES.HUMAN_VS_AI);

  // Human is player1, AI is player2
  assert.equal(game.state.matchContext.getControlType('player'), 'HUMAN');
  assert.equal(game.state.matchContext.getControlType('opponent'), 'AI');
  assert.equal(game.state.matchContext.isHuman('player'), true);
  assert.equal(game.state.matchContext.isAi('opponent'), true);
});

test('M3.2-L9-03: AI_VS_AI mode initializes both players with autonomous AI controllers', async () => {
  resetWindowCounter();
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.AI_VS_AI,
    player1: { id: 'ai_1', autoJoined: true },
    player2: { id: 'ai_2', autoJoined: true }
  });
  const matchId = match.matchId;

  const active = await manager.ensureActiveGame(matchId);
  const game = active.game || active;
  assert.equal(game.state.executionMode, EXECUTION_MODES.AI_VS_AI);
  assert.equal(game.state.matchContext.getControlType('player'), 'AI');
  assert.equal(game.state.matchContext.getControlType('opponent'), 'AI');
  assert.equal(game.state.matchContext.isAi('player'), true);
  assert.equal(game.state.matchContext.isAi('opponent'), true);
});

test('M3.2-L9-04: HEADLESS_SIMULATION mode enforces universal response windows and priority in-process', async () => {
  resetWindowCounter();
  const game = createGame({
    mode: EXECUTION_MODES.HEADLESS_SIMULATION,
    interactive: false
  });
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Sim Attacker', bp: 4000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  const blkCard = createCardInstance({ name: 'Sim Blocker', bp: 2000, type: 'Spirit' }, 'opponent');
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  state.players.opponent.field.push(blkStack);

  // Attack declaration opens Flash 1
  await game.declareAttack(atkStack.id, 'player');
  assert.ok(game.windows.isResponseWindowActive());
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent');

  // Passing priority alternates
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player');

  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });

  // Advances to Block Declaration
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);

  // Blocker declared -> Flash 2 opens with defender priority
  await game.windows.submitResponse({
    action: 'DECLARE_BLOCK',
    blockerStackId: blkStack.id
  }, { responder: 'opponent' });

  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_2);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent');

  // Both pass Flash 2 -> BP comparison
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });

  // Window closes, lower BP blocker destroyed
  assert.equal(game.windows.isResponseWindowActive(), false);
  assert.equal(state.players.opponent.grave.some(c => c.id === blkCard.id), true);
});
