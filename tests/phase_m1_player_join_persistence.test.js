/**
 * tests/phase_m1_player_join_persistence.test.js
 * 
 * Battle Spirits Eternal — Phase M.1 Work Package A:
 * Reproduce and Verify Player 2 Credential Persistence, Atomic Join & Authentication Invariants.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { SessionStore, hashToken } from '../engine/session_store.js';
import { BattleSessionManager, SESSION_STATUS } from '../engine/session_manager.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES } from '../engine/session_mode.js';

function createTempDb() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m1-join-'));
  const dbPath = path.join(tmpDir, 'test_join.db');
  const store = new SessionStore({ dbPath });
  return { store, dbPath, tmpDir };
}

test('PHASE-M1-WP-A: Test 1 - Player 2 token hash matches persisted hash in SQLite', async () => {
  const { store } = createTempDb();
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice', controlType: PLAYER_CONTROL_TYPES.HUMAN }
  });

  assert.equal(match.status, SESSION_STATUS.WAITING_FOR_PLAYERS, 'Should be waiting for Player 2');
  assert.equal(match.player2Token, undefined, 'Player 2 token must not leak to Player 1 on creation');

  const joinResult = await manager.joinMatch(match.matchId, {
    id: 'p2_bob',
    name: 'Bob'
  });

  assert.ok(joinResult.player2Token, 'Join must return a valid Player 2 auth token');
  assert.equal(joinResult.status, SESSION_STATUS.ACTIVE, 'Match must transition to ACTIVE');

  // Verify DB state
  const sessionInDb = store.loadSession(match.matchId);
  const expectedHash = hashToken(joinResult.player2Token);
  assert.equal(sessionInDb.player2.tokenHash, expectedHash, 'Persisted hash must match hash of returned Player 2 token');
  assert.equal(sessionInDb.player2.id, 'p2_bob', 'Persisted ID must match Bob');
  assert.equal(sessionInDb.player2.name, 'Bob', 'Persisted Name must match Bob');
  assert.equal(sessionInDb.player2.connected, true, 'Player 2 must be marked connected');
});

test('PHASE-M1-WP-A: Test 2 - Player 2 identity and credentials survive manager recreation', async () => {
  const { store, dbPath } = createTempDb();
  const manager1 = new BattleSessionManager({ store });

  const match = await manager1.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' }
  });

  const joinResult = await manager1.joinMatch(match.matchId, {
    id: 'p2_bob',
    name: 'Bob'
  });

  // Recreate SessionManager with a new instance connected to the same SQLite database
  const store2 = new SessionStore({ dbPath });
  const manager2 = new BattleSessionManager({ store: store2 });

  const reloaded = await manager2.getMatch(match.matchId);
  assert.equal(reloaded.player2.id, 'p2_bob', 'Player 2 ID survives manager recreation');
  assert.equal(reloaded.player2.name, 'Bob', 'Player 2 name survives manager recreation');
  assert.equal(reloaded.player2.tokenHash, hashToken(joinResult.player2Token), 'Player 2 token hash survives recreation');
});

test('PHASE-M1-WP-A: Test 3 - Player 2 reconnects successfully using the returned token after restart', async () => {
  const { dbPath } = createTempDb();
  const store1 = new SessionStore({ dbPath });
  const manager1 = new BattleSessionManager({ store: store1 });

  const match = await manager1.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' }
  });

  const joinResult = await manager1.joinMatch(match.matchId, {
    id: 'p2_bob',
    name: 'Bob'
  });

  // Simulate server restart: new store, new manager
  const store2 = new SessionStore({ dbPath });
  const manager2 = new BattleSessionManager({ store: store2 });

  // Reconnect with Player 2's token
  const reconnectResult = await manager2.reconnectToMatch(match.matchId, joinResult.player2Token);
  assert.equal(reconnectResult.playerSide, 'opponent', 'Must authenticate as opponent/Player 2');
  assert.equal(reconnectResult.status, SESSION_STATUS.ACTIVE, 'Match status must be ACTIVE');
  assert.ok(reconnectResult.state, 'Redacted state must be returned');
});

test('PHASE-M1-WP-A: Test 4 - Invalid Player 2 token is rejected with INVALID_AUTH_TOKEN', async () => {
  const { store } = createTempDb();
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' }
  });

  await manager.joinMatch(match.matchId, { id: 'p2_bob', name: 'Bob' });

  await assert.rejects(
    async () => await manager.reconnectToMatch(match.matchId, 'invalid_p2_token_12345'),
    (err) => {
      assert.equal(err.message.includes('INVALID_AUTH_TOKEN'), true);
      return true;
    },
    'Invalid token must be rejected'
  );
});

test('PHASE-M1-WP-A: Test 5 - Player 1 cannot impersonate Player 2 or use Player 2 token', async () => {
  const { store } = createTempDb();
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' }
  });

  const joinResult = await manager.joinMatch(match.matchId, { id: 'p2_bob', name: 'Bob' });

  // Player 1 attempts to submit an action claiming to be p2_bob using Player 1's token
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'STEP_ADVANCE',
        responder: 'opponent', // Claiming opponent side
        player: 'p2_bob'
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.equal(err.message.includes('IMPERSONATION_ATTEMPT_DETECTED'), true);
      return true;
    },
    'Impersonation of Player 2 with Player 1 credentials must be blocked'
  );
});

test('PHASE-M1-WP-A: Test 6 - A third participant cannot join a full match (MATCH_ALREADY_FULL)', async () => {
  const { store } = createTempDb();
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' }
  });

  await manager.joinMatch(match.matchId, { id: 'p2_bob', name: 'Bob' });

  // Third participant tries to join
  await assert.rejects(
    async () => {
      await manager.joinMatch(match.matchId, { id: 'p3_charlie', name: 'Charlie' });
    },
    (err) => {
      assert.equal(err.message.includes('MATCH_ALREADY_FULL'), true);
      return true;
    },
    'Third player must be rejected when match already has 2 participants'
  );
});

test('PHASE-M1-WP-A: Test 7 - Concurrent join attempts cannot create two Player 2 participants', async () => {
  const { store } = createTempDb();
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' }
  });

  // Fire two joins concurrently
  const join1Promise = manager.joinMatch(match.matchId, { id: 'p2_bob', name: 'Bob' });
  const join2Promise = manager.joinMatch(match.matchId, { id: 'p2_charlie', name: 'Charlie' });

  const results = await Promise.allSettled([join1Promise, join2Promise]);
  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Exactly one join attempt must succeed');
  assert.equal(rejected.length, 1, 'The losing concurrent join attempt must fail');
  assert.ok(
    rejected[0].reason.message.includes('MATCH_ALREADY_FULL') ||
    rejected[0].reason.message.includes('CONCURRENT_MODIFICATION') ||
    rejected[0].reason.message.includes('STALE_VERSION'),
    'Rejection reason must be concurrency or full match'
  );

  const finalSession = store.loadSession(match.matchId);
  assert.equal(finalSession.status, SESSION_STATUS.ACTIVE);
  assert.ok(finalSession.player2.id === 'p2_bob' || finalSession.player2.id === 'p2_charlie');
});

test('PHASE-M1-WP-A: Test 8 - Failed join transaction leaves the original WAITING_FOR_PLAYERS state intact', async () => {
  const { store } = createTempDb();
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' }
  });

  // Attempt to join with a non-existent matchId
  await assert.rejects(
    async () => await manager.joinMatch('non_existent_match_id', { id: 'p2_eve' }),
    (err) => err.message.includes('MATCH_NOT_FOUND')
  );

  // Original match is intact
  const orig = store.loadSession(match.matchId);
  assert.equal(orig.status, SESSION_STATUS.WAITING_FOR_PLAYERS);
  assert.equal(orig.version, 1);
  assert.equal(orig.player2.connected, false);
});
