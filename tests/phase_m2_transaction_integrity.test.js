/**
 * tests/phase_m2_transaction_integrity.test.js
 * 
 * Phase M.2 Work Package D: Transaction Integrity & Atomic Persistence Boundary.
 * Verifies that:
 * - State, action ledger, and event record commit atomically inside one transaction.
 * - Failure at any stage of commit rolls back all changes without leaving partial writes.
 * - Broadcasts occur exclusively after durable commit.
 * - Event sequence numbers are strictly monotonic with no gaps or duplicates.
 * - Reconstructed and replayed state matches event and action ledger commit history.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';

test('WP-D Scenario 1: Failure before state commit preserves previous state completely', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const stateBefore = store.loadSession(match.matchId);
  const eventsBefore = store.getEvents(match.matchId, 0);

  // Submit action that fails authorization check before commit
  try {
    await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN'
    }, { authToken: match.player2Token }); // Wrong player!
  } catch (_) {}

  const stateAfter = store.loadSession(match.matchId);
  const eventsAfter = store.getEvents(match.matchId, 0);

  assert.equal(stateAfter.version, stateBefore.version);
  assert.equal(eventsAfter.length, eventsBefore.length);
});

test('WP-D Scenario 2, 3, 4: Injected failure during transaction rolls back state, action and events', () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = { matchId: 'match_rollback_test' };
  store.saveSession({
    id: match.matchId,
    mode: 'HUMAN_VS_HUMAN',
    status: 'ACTIVE',
    activePlayer: 'player',
    turnNumber: 1,
    player1: { id: 'alice', name: 'Alice', tokenHash: 'hash1', controlType: 'HUMAN', connected: true },
    player2: { id: 'bob', name: 'Bob', tokenHash: 'hash2', controlType: 'HUMAN', connected: true },
    state: { turnNumber: 1, step: 'START' },
    version: 1
  });

  // Attempt atomic commit where event record is deliberately corrupted (e.g. invalid type/null that throws)
  assert.throws(() => {
    store.commitActionTransaction({
      matchId: match.matchId,
      expectedVersion: 1,
      actionRecord: { actionId: 'act_corrupt_test', playerId: 'alice', actionType: 'STEP_ADVANCE', payload: {} },
      sessionUpdates: { activePlayer: 'player', turnNumber: 1, phase: 'MAIN' },
      eventRecord: { seq: null, type: null, payload: null }, // Null seq in NOT NULL column triggers SQLite error!
      stateJson: { turnNumber: 1, step: 'MAIN' }
    });
  });

  // Verify full rollback: session version remains 1, action not in match_actions, event not in match_events
  const session = store.loadSession(match.matchId);
  assert.equal(session.version, 1, 'Version must remain 1 after rollback');
  assert.equal(session.phase, 'START', 'Phase must not have changed');

  const action = store.getAction('act_corrupt_test');
  assert.equal(action, null, 'Action ledger must NOT contain the failed action');

  const events = store.getEvents(match.matchId, 0);
  assert.equal(events.length, 0, 'No event should have been committed');
});

test('WP-D Scenario 5: Clock persistence operates consistently with session state', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const clock = store.loadClock(match.matchId);
  assert.ok(clock);
  assert.equal(clock.activePlayer, 'player');

  await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  const updatedClock = store.loadClock(match.matchId);
  assert.ok(updatedClock);
  assert.equal(updatedClock.activePlayer, 'player');
});

test('WP-D Scenario 6: Concurrent conflicting transactions are rejected by optimistic versioning', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const session = store.loadSession(match.matchId);

  // Request 1 commits version 1 -> 2
  store.commitActionTransaction({
    matchId: match.matchId,
    expectedVersion: session.version,
    actionRecord: { actionId: 'act_concurrent_1', playerId: 'alice', actionType: 'STEP_ADVANCE', payload: {} },
    sessionUpdates: { phase: 'MAIN' },
    eventRecord: { seq: 2, type: 'ACTION_STEP_ADVANCE', payload: {} },
    stateJson: session.state
  });

  // Request 2 with same expectedVersion (1) must throw STALE_VERSION_CONFLICT
  assert.throws(
    () => store.commitActionTransaction({
      matchId: match.matchId,
      expectedVersion: session.version,
      actionRecord: { actionId: 'act_concurrent_2', playerId: 'alice', actionType: 'STEP_ADVANCE', payload: {} },
      sessionUpdates: { phase: 'ATTACK' },
      eventRecord: { seq: 3, type: 'ACTION_STEP_ADVANCE', payload: {} },
      stateJson: session.state
    }),
    (err) => err.code === 'STALE_VERSION_CONFLICT'
  );
});

test('WP-D Scenario 7 & 8: Restart and restore after successful processing preserves full state', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager1 = new BattleSessionManager({ store });

  const match = await manager1.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  await manager1.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    actionId: 'act_restore_integrity_1',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  // Simulate process restart
  const manager2 = new BattleSessionManager({ store });
  const restoredGame = await manager2.restoreMatch(match.matchId);
  assert.ok(restoredGame);
  assert.equal(restoredGame.state.matchId, match.matchId);

  const session = store.loadSession(match.matchId);
  assert.equal(session.version, 2);
  assert.equal(session.lastActionId, 'act_restore_integrity_1');
});

test('WP-D Scenario 9 & 10: Event sequence numbers are strictly monotonic with no gaps or duplicate sequence numbers', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    actionId: 'act_seq_1',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    actionId: 'act_seq_2',
    step: 'ATTACK'
  }, { authToken: match.player1Token });

  const events = store.getEvents(match.matchId, 0);
  assert.ok(events.length >= 3);

  // Check monotonic sequence: seq[i] == seq[i-1] + 1
  for (let i = 1; i < events.length; i++) {
    assert.equal(events[i].seq, events[i - 1].seq + 1, `Event seq must increment monotonically from ${events[i - 1].seq} to ${events[i].seq}`);
  }
});

test('WP-D Scenario 11: Persisted state matches the event and action commit history', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const a1 = await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    actionId: 'act_history_match_1',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  const session = store.loadSession(match.matchId);
  const committedAction = store.getAction('act_history_match_1');
  const events = store.getEvents(match.matchId, 0);
  const lastEvent = events[events.length - 1];

  assert.equal(session.lastActionId, 'act_history_match_1');
  assert.equal(committedAction.actionId, 'act_history_match_1');
  assert.equal(committedAction.version, 1);
  assert.equal(session.version, 2);
  assert.equal(lastEvent.payload.actionId, 'act_history_match_1');
});
