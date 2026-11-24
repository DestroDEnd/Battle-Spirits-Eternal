/**
 * tests/phase_m2_action_idempotency.test.js
 * 
 * Phase M.2 Work Package C: Action Idempotency, Duplicate Protection & Failed-Action Recovery.
 * Verifies that:
 * - Failed validation or execution does NOT consume or poison an action ID.
 * - Legitimate retries with the same action ID succeed.
 * - Committed actions are idempotent: duplicate submission returns original result without re-executing.
 * - Action ID payload conflicts are detected and rejected.
 * - Concurrency control prevents double commit.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';

test('WP-C Scenario 1 & 2: Failed validation does not consume action ID, corrected retry succeeds', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  active.game.interactionController.request({
    matchId: match.matchId,
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'valid_target' }]
  });

  const interactionId = active.game.state.pendingInteractions[0].id;
  const fixedActionId = 'act_fixed_retry_001';

  // 1. Invalid attempt
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      actionId: fixedActionId,
      interactionId,
      response: { selected: ['invalid_target'] }
    }, { authToken: match.player1Token }),
    (err) => err.code === 'INVALID_CANDIDATE' || err.message.includes('INVALID_CANDIDATE')
  );

  // 2. Corrected retry with same actionId succeeds
  const retryRes = await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    actionId: fixedActionId,
    interactionId,
    response: { selected: ['valid_target'] }
  }, { authToken: match.player1Token });

  assert.equal(retryRes.success, true);
  assert.equal(retryRes.actionId, fixedActionId);
});

test('WP-C Scenario 3 & 4: Successful duplicate does not re-execute and does not create another event', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const actionPayload = {
    type: 'STEP_ADVANCE',
    actionId: 'act_step_duplicate_001',
    step: 'MAIN'
  };

  const res1 = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(res1.success, true);

  const eventsBefore = store.getEvents(match.matchId, 0);

  // Duplicate submission
  const res2 = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(res2.duplicate, true);
  assert.equal(res2.version, res1.version, 'Duplicate must not increment version');

  const eventsAfter = store.getEvents(match.matchId, 0);
  assert.equal(eventsAfter.length, eventsBefore.length, 'Duplicate must not append additional events');
});

test('WP-C Scenario 5: Same ID with materially different payload is rejected', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const fixedActionId = 'act_payload_conflict_001';

  await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    actionId: fixedActionId,
    step: 'MAIN'
  }, { authToken: match.player1Token });

  // Conflicting action with same actionId but different action type
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      actionId: fixedActionId,
      interactionId: 'some_interaction',
      response: { selected: ['t1'] }
    }, { authToken: match.player1Token }),
    (err) => err.code === 'PAYLOAD_CONFLICT' || err.message.includes('ACTION_ID_PAYLOAD_CONFLICT')
  );
});

test('WP-C Scenario 6: Concurrent duplicate submissions commit only once', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const actionPayload = {
    type: 'STEP_ADVANCE',
    actionId: 'act_concurrent_dup_001',
    step: 'MAIN'
  };

  // Launch two concurrent requests with identical actionId
  const [resA, resB] = await Promise.all([
    manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token }),
    manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token })
  ]);

  const duplicates = [resA, resB].filter(r => r.duplicate);
  assert.equal(duplicates.length, 1, 'Exactly one of the concurrent identical requests must be marked duplicate');
});

test('WP-C Scenario 7: Two conflicting actions cannot both commit against the same state version', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // Directly test store commitActionTransaction with stale version
  const session = store.loadSession(match.matchId);

  // Commit version 1 -> 2
  store.commitActionTransaction({
    matchId: match.matchId,
    expectedVersion: session.version,
    actionRecord: { actionId: 'act_v1', playerId: 'alice', actionType: 'STEP_ADVANCE', payload: {} },
    sessionUpdates: { activePlayer: 'player', turnNumber: 1, phase: 'MAIN' },
    eventRecord: { seq: 2, type: 'ACTION_STEP_ADVANCE', payload: {} },
    stateJson: session.state
  });

  // Attempt to commit against stale version 1 again
  assert.throws(
    () => store.commitActionTransaction({
      matchId: match.matchId,
      expectedVersion: session.version, // Stale!
      actionRecord: { actionId: 'act_v1_conflict', playerId: 'alice', actionType: 'STEP_ADVANCE', payload: {} },
      sessionUpdates: { activePlayer: 'player', turnNumber: 1, phase: 'ATTACK' },
      eventRecord: { seq: 3, type: 'ACTION_STEP_ADVANCE', payload: {} },
      stateJson: session.state
    }),
    (err) => err.code === 'STALE_VERSION_CONFLICT' || err.message.includes('STALE_VERSION_CONFLICT')
  );
});

test('WP-C Scenario 8 & 9: Failed engine execution leaves match in last committed state without event seq jump', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const sessionBefore = store.loadSession(match.matchId);
  const eventsBefore = store.getEvents(match.matchId, 0);

  // Submit action that fails validation
  try {
    await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      actionId: 'act_fail_001',
      interactionId: 'non_existent_interaction',
      response: {}
    }, { authToken: match.player1Token });
  } catch (_) {}

  const sessionAfter = store.loadSession(match.matchId);
  const eventsAfter = store.getEvents(match.matchId, 0);

  assert.equal(sessionAfter.version, sessionBefore.version, 'Version must not increment on failed action');
  assert.equal(eventsAfter.length, eventsBefore.length, 'Event count must not increment on failed action');
});

test('WP-C Scenario 10: Server restart preserves successful idempotency records', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager1 = new BattleSessionManager({ store });

  const match = await manager1.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const actionPayload = {
    type: 'STEP_ADVANCE',
    actionId: 'act_persist_idempotent_001',
    step: 'MAIN'
  };

  await manager1.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });

  // Simulate server restart: create brand new manager on same store
  const manager2 = new BattleSessionManager({ store });

  // Resubmit same actionId to the new manager instance
  const res = await manager2.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(res.duplicate, true, 'Restarted server must recognize committed action as duplicate');
});

test('WP-C Scenario 11: A client retry after a lost response receives the original committed outcome', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const actionPayload = {
    type: 'STEP_ADVANCE',
    actionId: 'act_lost_response_001',
    step: 'MAIN'
  };

  const initial = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });

  // Client retries
  const retry = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(retry.duplicate, true);
  assert.equal(retry.version, initial.version);
});

test('WP-C Scenario 12: Invalid or unauthorized actions do not create committed action records', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const unauthorizedActionId = 'act_unauthorized_001';

  // Opponent tries to step advance while player is turn player
  try {
    await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      actionId: unauthorizedActionId,
      step: 'MAIN'
    }, { authToken: match.player2Token });
  } catch (_) {}

  const actionRow = store.getAction(unauthorizedActionId);
  assert.equal(actionRow, null, 'Unauthorized action must never be written to match_actions');
});
