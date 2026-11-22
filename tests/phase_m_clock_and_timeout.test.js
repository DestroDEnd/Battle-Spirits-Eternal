/**
 * tests/phase_m_clock_and_timeout.test.js
 * 
 * Phase M Work Package F, G & H: Four-Minute Turn Clock, Disconnection/Pause Policy,
 * One-Minute Warning, and Timeout Handling.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { EXECUTION_MODES } from '../engine/session_mode.js';
import { INTERACTION_TYPES } from '../engine/interaction.js';

test('TC-M-C01: Verify new human turn starts at exactly 240 seconds (240,000ms)', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2', autoJoined: true }
  });

  const clock = manager.getClockState(match.matchId);
  assert.equal(clock.turnDurationMs, 240000);
  assert.equal(clock.remainingMs, 240000);
  assert.equal(clock.paused, false);
  assert.equal(clock.warningActive, false);
  assert.equal(clock.isExpired, false);
});

test('TC-M-C02: Verify clock resets only on genuine turn change, not on step changes within turn', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2', autoJoined: true }
  });

  // Advance 30s in Start step
  simTime += 30000;
  let clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 210000);

  // Advance step to MAIN (still Player 1's turn)
  await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  // Advance another 10s
  simTime += 10000;
  clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 200000, 'Step advance within same turn must NOT reset clock');
});

test('TC-M-C03: Verify nested interactions and prompts within same turn do not reset clock', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2', autoJoined: true }
  });

  simTime += 50000; // 190s left

  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;

  // Issue interaction request
  const prompt = game.interactionController.request({
    type: INTERACTION_TYPES.CONFIRM_ACTION,
    decisionOwner: 'player',
    optional: true
  });

  simTime += 15000; // 175s left
  let clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 175000, 'Issuing prompt must not reset clock');

  // Submit response
  await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    interactionId: game.state.pendingInteractions[0].id,
    response: { accepted: true }
  }, { authToken: match.player1Token });

  clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 175000, 'Resolving prompt must not reset clock');
});

test('TC-M-C04: Verify refresh and reconnect preserves exact remaining time', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_AI,
    player1: { id: 'p1', name: 'Player 1' }
  });

  simTime += 65000; // 175s left

  // Client simulates refreshing the page (queries reconnect)
  const reconnectData = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(reconnectData.clock.remainingMs, 175000);
  assert.equal(reconnectData.clock.turnDurationMs, 240000);
});

test('TC-M-C05: Verify 60-second warning flag activates at threshold (remaining <= 60000ms)', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2', autoJoined: true }
  });

  // At 70s remaining: warning is FALSE
  simTime += 170000;
  let clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 70000);
  assert.equal(clock.warningActive, false);

  // At exactly 60s remaining: warning is TRUE
  simTime += 10000;
  clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 60000);
  assert.equal(clock.warningActive, true, 'Warning must activate at 60s');

  // At 30s remaining: warning remains TRUE
  simTime += 30000;
  clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 30000);
  assert.equal(clock.warningActive, true);
});

test('TC-M-C06: Verify countdown reaches zero and triggers atomic timeout', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Fast forward past 240 seconds
  simTime += 240001;

  const clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 0);
  assert.equal(clock.isExpired, true);

  const session = await manager.getMatch(match.matchId);
  assert.equal(session.status, 'COMPLETED');
  assert.equal(session.winnerId, 'bob', 'Opponent must be declared winner when active player times out');
  assert.equal(session.finishReason, 'TIMEOUT');
});

test('TC-M-C07: Verify timeout is idempotent and cannot be processed twice', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  simTime += 250000;

  // First timeout check
  manager._checkTimeout(match.matchId);
  const session1 = store.loadSession(match.matchId);

  // Second timeout check
  const res2 = manager._checkTimeout(match.matchId);
  assert.equal(res2, false, 'Second check must return false because timeout was already processed');

  const session2 = store.loadSession(match.matchId);
  assert.equal(session1.version, session2.version, 'Version must not bump on redundant timeout check');
  assert.equal(session2.finishReason, 'TIMEOUT');
});

test('TC-M-C08: Verify action before deadline is accepted and action after deadline is rejected', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Action at 230 seconds (10s before deadline) -> ACCEPTED
  simTime += 230000;
  const actionRes = await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  }, { authToken: match.player1Token });
  assert.equal(actionRes.success, true);

  // Advance time past deadline
  simTime += 15000; // total 245s

  // Action after deadline -> REJECTED
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'STEP_ADVANCE',
        step: 'ATTACK'
      }, { authToken: match.player1Token });
    },
    /MATCH_TIMED_OUT/
  );
});

test('TC-M-C09: Active player clock continues running when only that player disconnects', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  simTime += 20000; // 220s left

  // Alice (active player) disconnects / leaves arena
  await manager.leaveArena(match.matchId, match.player1Token);

  let clock = manager.getClockState(match.matchId);
  assert.equal(clock.paused, false, 'Clock must NOT pause when only active player leaves');

  simTime += 30000; // 190s left
  clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 190000, 'Clock must continue elapsing for disconnected active player');
});

test('TC-M-C10: Clock pauses when both players disconnect and resumes on reconnect', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  simTime += 40000; // 200s left

  // Both players disconnect
  await manager.leaveArena(match.matchId, match.player1Token);
  await manager.leaveArena(match.matchId, match.player2Token);

  let clock = manager.getClockState(match.matchId);
  assert.equal(clock.paused, true, 'Clock must pause on dual disconnect');
  assert.equal(clock.remainingMs, 200000);

  // 10 hours pass
  simTime += 10 * 3600 * 1000;
  clock = manager.getClockState(match.matchId);
  assert.equal(clock.paused, true);
  assert.equal(clock.remainingMs, 200000);
  assert.equal(clock.isExpired, false);

  // Player 1 reconnects
  const p1Recon = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(p1Recon.clock.remainingMs, 200000);
});
