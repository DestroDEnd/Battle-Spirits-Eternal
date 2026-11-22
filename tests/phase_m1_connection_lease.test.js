/**
 * tests/phase_m1_connection_lease.test.js
 * 
 * Battle Spirits Eternal — Phase M.1 Work Package E:
 * Server-Authoritative Connection Leases, Heartbeat Expiration & Disconnect Policy.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SessionStore } from '../engine/session_store.js';
import { BattleSessionManager, SESSION_STATUS } from '../engine/session_manager.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES } from '../engine/session_mode.js';

test('PHASE-M1-WP-E: Test 1 - Periodic heartbeats maintain active connection lease', async () => {
  let virtualTime = 100000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({
    store,
    timeProvider: () => virtualTime
  });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', controlType: PLAYER_CONTROL_TYPES.HUMAN }
  });
  const joinRes = await manager.joinMatch(match.matchId, { id: 'p2_bob' });

  // Both send heartbeat at t = 100000
  await manager.recordHeartbeat(match.matchId, match.player1Token);
  await manager.recordHeartbeat(match.matchId, joinRes.player2Token);

  // Advance time by 6 seconds (heartbeat interval is 5s)
  virtualTime += 6000;

  // Check leases: neither should expire (timeout is 15s)
  const expired = await manager.checkConnectionLeases(virtualTime);
  assert.equal(expired.length, 0, 'No leases should expire within 6 seconds');

  const session = store.loadSession(match.matchId);
  assert.equal(session.player1.connected, true);
  assert.equal(session.player2.connected, true);
});

test('PHASE-M1-WP-E: Test 2 - Lease expiration marks participant DISCONNECTED when heartbeats cease', async () => {
  let virtualTime = 100000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({
    store,
    timeProvider: () => virtualTime
  });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice' }
  });
  const joinRes = await manager.joinMatch(match.matchId, { id: 'p2_bob' });

  // Player 1 sends heartbeat, Player 2 stops sending heartbeats (e.g. closed browser tab)
  virtualTime += 16000; // 16s elapsed (> 15s lease timeout)
  await manager.recordHeartbeat(match.matchId, match.player1Token); // P1 is still active

  const expired = await manager.checkConnectionLeases(virtualTime);
  assert.equal(expired.length, 1, 'Player 2 lease must expire');
  assert.equal(expired[0].side, 'opponent');
  assert.equal(expired[0].action, 'LEASE_EXPIRED');

  const session = store.loadSession(match.matchId);
  assert.equal(session.player1.connected, true, 'Player 1 remains connected');
  assert.equal(session.player2.connected, false, 'Player 2 is marked disconnected');
  assert.equal(session.status, SESSION_STATUS.PLAYER_DISCONNECTED);
});

test('PHASE-M1-WP-E: Test 3 - Dual disconnect suspends match and pauses turn clock', async () => {
  let virtualTime = 100000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({
    store,
    timeProvider: () => virtualTime
  });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice' }
  });
  const joinRes = await manager.joinMatch(match.matchId, { id: 'p2_bob' });

  // Both players stop sending heartbeats for 20s
  virtualTime += 20000;

  const expired = await manager.checkConnectionLeases(virtualTime);
  assert.equal(expired.length, 2, 'Both player leases must expire');

  const session = store.loadSession(match.matchId);
  assert.equal(session.player1.connected, false);
  assert.equal(session.player2.connected, false);
  assert.equal(session.status, SESSION_STATUS.SUSPENDED);

  const clock = store.loadClock(match.matchId);
  assert.equal(clock.paused, true, 'Turn clock must be paused when both players are disconnected');
  assert.equal(clock.pauseReason, 'BOTH_PLAYERS_DISCONNECTED');
});

test('PHASE-M1-WP-E: Test 4 - Reconnection restores slot and unpauses clock without creating duplicate participants', async () => {
  let virtualTime = 100000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({
    store,
    timeProvider: () => virtualTime
  });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice' }
  });
  const joinRes = await manager.joinMatch(match.matchId, { id: 'p2_bob' });

  // Both disconnect -> match suspended
  virtualTime += 20000;
  await manager.checkConnectionLeases(virtualTime);

  // Alice reconnects
  virtualTime += 5000;
  const reconP1 = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(reconP1.playerSide, 'player');

  const sessionAfterP1 = store.loadSession(match.matchId);
  assert.equal(sessionAfterP1.player1.connected, true);
  assert.equal(sessionAfterP1.player2.connected, false);

  // Bob reconnects
  virtualTime += 2000;
  const reconP2 = await manager.reconnectToMatch(match.matchId, joinRes.player2Token);
  assert.equal(reconP2.playerSide, 'opponent');
  assert.equal(reconP2.status, SESSION_STATUS.ACTIVE, 'Match status resumes ACTIVE');

  const sessionFinal = store.loadSession(match.matchId);
  assert.equal(sessionFinal.player1.connected, true);
  assert.equal(sessionFinal.player2.connected, true);
  assert.equal(sessionFinal.status, SESSION_STATUS.ACTIVE);

  const clock = store.loadClock(match.matchId);
  assert.equal(clock.paused, false, 'Clock must unpause when match resumes active');
});

test('PHASE-M1-WP-E: Test 5 - Server restart reconciles stale connection flags', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager1 = new BattleSessionManager({ store });

  const match = await manager1.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice' }
  });
  await manager1.joinMatch(match.matchId, { id: 'p2_bob' });

  // Simulate server restart: new manager instance calls reconcileStaleConnections()
  const manager2 = new BattleSessionManager({ store });
  await manager2.reconcileStaleConnections();

  const sessionAfterRestart = store.loadSession(match.matchId);
  assert.equal(sessionAfterRestart.player1.connected, false, 'Stale Player 1 flag reset to false on restart');
  assert.equal(sessionAfterRestart.player2.connected, false, 'Stale Player 2 flag reset to false on restart');
  assert.equal(sessionAfterRestart.status, SESSION_STATUS.PLAYER_DISCONNECTED);
});

test('PHASE-M1-WP-E: Test 6 - Duplicate and frequent heartbeats are idempotent and harmless', async () => {
  let virtualTime = 100000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({
    store,
    timeProvider: () => virtualTime
  });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice' }
  });

  // Rapid burst of 10 heartbeats
  for (let i = 0; i < 10; i++) {
    virtualTime += 100;
    const res = await manager.recordHeartbeat(match.matchId, match.player1Token);
    assert.equal(res.success, true);
    assert.equal(res.side, 'player');
  }

  const session = store.loadSession(match.matchId);
  assert.equal(session.player1.connected, true);
});
