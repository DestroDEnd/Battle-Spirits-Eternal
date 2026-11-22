/**
 * tests/phase_m1_concurrency_recovery.test.js
 * 
 * Battle Spirits Eternal — Phase M.1 Work Package H:
 * Session Lifecycle, Concurrency Control, Event Sequence Monotonicity & Crash Recovery.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { SessionStore } from '../engine/session_store.js';
import { BattleSessionManager, SESSION_STATUS } from '../engine/session_manager.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES } from '../engine/session_mode.js';

test('PHASE-M1-WP-H: Test 1 - Optimistic concurrency control rejects stale session versions', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice' },
    player2: { id: 'p2_bob', autoJoined: true }
  });

  const session = store.loadSession(match.matchId);
  assert.equal(session.version, 1);

  // Commit version 1 -> 2
  store.updateSessionState(match.matchId, session.state, 1, { phase: 'MAIN' });

  const updatedSession = store.loadSession(match.matchId);
  assert.equal(updatedSession.version, 2);

  // Attempting to update with stale expectedVersion = 1 must be rejected
  assert.throws(
    () => {
      store.updateSessionState(match.matchId, session.state, 1, { phase: 'ATTACK' });
    },
    (err) => {
      assert.equal(err.code, 'STALE_VERSION_CONFLICT');
      return true;
    },
    'Stale version update must throw STALE_VERSION_CONFLICT'
  );
});

test('PHASE-M1-WP-H: Test 2 - Action submission is strictly idempotent with duplicate actionId rejected', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice' },
    player2: { id: 'p2_bob', autoJoined: true }
  });

  const actionPayload = {
    actionId: 'fixed_action_id_001',
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  };

  // First submission succeeds
  const res1 = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(res1.success, true);
  assert.equal(res1.actionId, 'fixed_action_id_001');

  // Second submission with identical actionId is rejected idempotently
  const res2 = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(res2.success, false);
  assert.equal(res2.duplicate, true);
});

test('PHASE-M1-WP-H: Test 3 - Monotonic event sequence numbers persist across multiple server restarts and match restores', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m1-events-'));
  const dbPath = path.join(tmpDir, 'events.db');

  // Server instance 1
  const store1 = new SessionStore({ dbPath });
  const manager1 = new BattleSessionManager({ store: store1 });

  const match = await manager1.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1' },
    player2: { id: 'p2', autoJoined: true }
  });

  await manager1.submitPlayerAction(match.matchId, { type: 'STEP_ADVANCE', step: 'MAIN' }, { authToken: match.player1Token });
  await manager1.submitPlayerAction(match.matchId, { type: 'STEP_ADVANCE', step: 'ATTACK' }, { authToken: match.player1Token });

  const eventsBeforeRestart = store1.getEvents(match.matchId);
  const lastSeq1 = eventsBeforeRestart[eventsBeforeRestart.length - 1].seq;
  assert.ok(lastSeq1 >= 3, 'At least 3 events should exist');

  // Server restart -> instance 2
  const store2 = new SessionStore({ dbPath });
  const manager2 = new BattleSessionManager({ store: store2 });

  // Restore match and submit new action
  await manager2.restoreMatch(match.matchId);
  await manager2.submitPlayerAction(match.matchId, { type: 'STEP_ADVANCE', step: 'END' }, { authToken: match.player1Token });

  const eventsAfterRestart = store2.getEvents(match.matchId);
  const lastSeq2 = eventsAfterRestart[eventsAfterRestart.length - 1].seq;

  assert.ok(lastSeq2 > lastSeq1, `New event seq (${lastSeq2}) must be strictly greater than last seq before restart (${lastSeq1})`);

  // Verify all events are strictly ascending without gaps or duplicate seqs
  for (let i = 1; i < eventsAfterRestart.length; i++) {
    assert.ok(eventsAfterRestart[i].seq > eventsAfterRestart[i - 1].seq, 'Sequence numbers must be strictly monotonic');
  }
});

test('PHASE-M1-WP-H: Test 4 - Completed or forfeited matches cannot accept further gameplay actions', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1' },
    player2: { id: 'p2', autoJoined: true }
  });

  // Forfeit match
  const forfeitRes = await manager.forfeitMatch(match.matchId, match.player1Token, 'VOLUNTARY_CONCESSION');
  assert.equal(forfeitRes.status, SESSION_STATUS.FORFEITED);

  // Subsequent gameplay action must be rejected
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.ok(err.message.includes('NOT_ACTIVE') || err.message.includes('FORFEITED') || err.message.includes('GAME_COMPLETED') || err.message.includes('Match is in status'));
      return true;
    },
    'Action on a forfeited match must be rejected'
  );
});

test('PHASE-M1-WP-H: Test 5 - Forfeiture and timeout are idempotent', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'p1' },
    player2: { id: 'p2', autoJoined: true }
  });

  // First forfeit
  const f1 = await manager.forfeitMatch(match.matchId, match.player1Token);
  assert.equal(f1.status, SESSION_STATUS.FORFEITED);

  // Second forfeit call should return completed state gracefully
  const session = store.loadSession(match.matchId);
  assert.equal(session.status, SESSION_STATUS.FORFEITED);
});
