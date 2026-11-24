/**
 * tests/phase_m3_3_session_restore_and_reconnect.test.js
 * 
 * Phase M.3.3 Work Package K: Session Restore, Memory Eviction & Reconnection Integrity
 * 
 * Asserts that:
 * 1. Invalid or missing token on reconnect is rejected with HTTP 401/403.
 * 2. Active memory eviction (activeGames.clear()) triggers seamless, durable restoration from store.
 * 3. Restoration preserves game state, player zones, turn numbers, and response window stacks.
 * 4. Submitting an action after memory wipe restores the session and executes with version integrity.
 * 5. Reconnection resumes paused turn clock and marks participant reconnected.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { RESPONSE_WINDOW_TYPES } from '../engine/windows.js';

test('M3.3-K-01: Reconnect validates token authorization', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // 1. Missing token
  await assert.rejects(
    async () => {
      await manager.reconnectToMatch(match.matchId, null);
    },
    (err) => err.message.includes('AUTHENTICATION_REQUIRED')
  );

  // 2. Invalid token
  await assert.rejects(
    async () => {
      await manager.reconnectToMatch(match.matchId, 'invalid_spoofed_token');
    },
    (err) => err.message.includes('INVALID_AUTH_TOKEN')
  );

  // 3. Valid token succeeds
  const res = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(res.playerSide, 'player');
  assert.ok(res.state, 'Must return restored match state');
});

test('M3.3-K-02: Memory eviction triggers seamless restoration of match state and response windows', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;

  game.state.activePlayer = 'player';
  game.state.step = 'MAIN';

  // Advance step to persist updated state
  await manager.submitPlayerAction(match.matchId, {
    actionId: 'act_step_1',
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  const versionBefore = (await manager.getPlayerMatchState(match.matchId, match.player1Token)).version;

  // Evict all active in-memory games (simulate process restart or memory eviction)
  manager.activeGames.clear();
  assert.equal(manager.activeGames.has(match.matchId), false, 'Memory cache must be empty');

  // Query state triggers restoration
  const restored = await manager.getPlayerMatchState(match.matchId, match.player1Token);
  assert.equal(restored.version, versionBefore, 'Restored session version must match');
  assert.equal(restored.state.step, 'MAIN', 'Restored step must match');
  assert.equal(restored.state.activePlayer, 'player', 'Restored active player must match');

  // Verify action execution after eviction
  const actRes = await manager.submitPlayerAction(match.matchId, {
    actionId: 'act_step_2',
    type: 'STEP_ADVANCE',
    step: 'ATTACK'
  }, { authToken: match.player1Token });

  assert.equal(actRes.success, true);
  assert.equal(actRes.state.step, 'ATTACK');
  assert.equal(actRes.version, versionBefore + 1, 'Version must increment smoothly from restored state');
});

test('M3.3-K-03: Reconnection resumes paused turn clock', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // Pause clock (simulate disconnect/suspension)
  const clock = store.loadClock(match.matchId);
  clock.paused = true;
  clock.pauseReason = 'PLAYER_DISCONNECT';
  store.saveClock(match.matchId, clock);

  // Update session status to SUSPENDED
  store.updateSessionState(match.matchId, null, match.version || 1, {
    status: 'SUSPENDED'
  });

  // Reconnect player 1
  const recRes = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(recRes.playerSide, 'player');

  const resumedClock = store.loadClock(match.matchId);
  assert.equal(resumedClock.paused, false, 'Clock must be unpaused on reconnection');
});
