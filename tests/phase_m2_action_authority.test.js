/**
 * tests/phase_m2_action_authority.test.js
 * 
 * Phase M.2 Work Package B: Strict Action Authority & Player Authorization Invariants.
 * Verifies that all action submissions are strictly authorized based on:
 * - Authoritative server-authenticated identity (never client-supplied claims).
 * - Active turn player for turn-controlled actions.
 * - Decision owner for pending interaction choices.
 * - Strict candidate pool bounds and constraints.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES, createMatchContext } from '../engine/session_mode.js';
import { createGame } from '../engine/index.js';
import { INTERACTION_STATUS } from '../engine/interaction.js';

test('WP-B Scenario 1: Wrong player cannot advance the current turn', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // Turn player is 'player'. Bob (opponent) attempts STEP_ADVANCE
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN'
    }, { authToken: match.player2Token }),
    (err) => err.code === 'NOT_ACTIVE_PLAYER' || err.message.includes('NOT_ACTIVE_PLAYER')
  );
});

test('WP-B Scenario 2: Active player can perform a legal turn-controlled action', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const res = await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  assert.equal(res.success, true);
  assert.ok(res.result.step);
});

test('WP-B Scenario 3: Opponent cannot impersonate the active player', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // Bob sends an action claiming to be Alice / 'player'
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN',
      player: 'player' // Spoofed claim
    }, { authToken: match.player2Token }),
    (err) => err.code === 'IMPERSONATION_ATTEMPT_DETECTED' || err.message.includes('IMPERSONATION_ATTEMPT_DETECTED')
  );
});

test('WP-B Scenario 4: Opponent can make an authorized pending interaction decision', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  active.game.interactionController.request({
    matchId: match.matchId,
    decisionOwner: 'opponent',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 't1' }]
  });

  const interactionId = active.game.state.pendingInteractions[0].id;

  // Bob (opponent) answers his own interaction
  const res = await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    interactionId,
    response: { selected: ['t1'] }
  }, { authToken: match.player2Token });

  assert.equal(res.success, true);
});

test('WP-B Scenario 5: Player 1 cannot answer Player 2 interaction', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  active.game.interactionController.request({
    matchId: match.matchId,
    decisionOwner: 'opponent',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 't1' }]
  });

  const interactionId = active.game.state.pendingInteractions[0].id;

  // Alice tries to answer Bob's interaction
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      interactionId,
      response: { selected: ['t1'] }
    }, { authToken: match.player1Token }),
    (err) => err.code === 'UNAUTHORIZED_DECISION_OWNER' || err.message.includes('UNAUTHORIZED_DECISION_OWNER')
  );
});

test('WP-B Scenario 6: Player 2 cannot answer Player 1 interaction', async () => {
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
    candidates: [{ candidateId: 't1' }]
  });

  const interactionId = active.game.state.pendingInteractions[0].id;

  // Bob tries to answer Alice's interaction
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      interactionId,
      response: { selected: ['t1'] }
    }, { authToken: match.player2Token }),
    (err) => err.code === 'UNAUTHORIZED_DECISION_OWNER' || err.message.includes('UNAUTHORIZED_DECISION_OWNER')
  );
});

test('WP-B Scenario 7: Forged responder is rejected or ignored', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN',
      responder: 'player' // Forged claim while using opponent token
    }, { authToken: match.player2Token }),
    (err) => err.code === 'IMPERSONATION_ATTEMPT_DETECTED' || err.message.includes('IMPERSONATION')
  );
});

test('WP-B Scenario 8: Forged decisionOwner is rejected or ignored', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN',
      decisionOwner: 'player' // Forged claim while using opponent token
    }, { authToken: match.player2Token }),
    (err) => err.code === 'IMPERSONATION_ATTEMPT_DETECTED' || err.message.includes('IMPERSONATION')
  );
});

test('WP-B Scenario 9: Forged authenticatedSide is rejected or ignored', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN',
      authenticatedSide: 'player' // Forged claim while using opponent token
    }, { authToken: match.player2Token }),
    (err) => err.code === 'IMPERSONATION_ATTEMPT_DETECTED' || err.message.includes('IMPERSONATION')
  );
});

test('WP-B Scenario 10: Stale interaction response is rejected', async () => {
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
    candidates: [{ candidateId: 't1' }]
  });

  const interactionId = active.game.state.pendingInteractions[0].id;

  // Resolve it once
  await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    actionId: 'act_resolve_1',
    interactionId,
    response: { selected: ['t1'] }
  }, { authToken: match.player1Token });

  // Try to submit another response with a new action ID to the now-resolved interaction
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      actionId: 'act_stale_retry_2',
      interactionId,
      response: { selected: ['t1'] }
    }, { authToken: match.player1Token }),
    (err) => err.code === 'INTERACTION_NOT_FOUND' || err.code === 'INTERACTION_NOT_PENDING' || err.message.includes('not exist or has already resolved')
  );
});

test('WP-B Scenario 11: Duplicate interaction response does not resolve twice', async () => {
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
    candidates: [{ candidateId: 't1' }]
  });

  const interactionId = active.game.state.pendingInteractions[0].id;

  const res1 = await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    actionId: 'act_single_resolve_1',
    interactionId,
    response: { selected: ['t1'] }
  }, { authToken: match.player1Token });

  assert.equal(res1.success, true);

  // Exact duplicate submission
  const res2 = await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    actionId: 'act_single_resolve_1',
    interactionId,
    response: { selected: ['t1'] }
  }, { authToken: match.player1Token });

  assert.equal(res2.duplicate, true);
  assert.equal(res2.version, res1.version, 'Duplicate must not increment version');
});

test('WP-B Scenario 12: A player cannot act in an invalid match phase', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  // Put a pending interaction in place
  active.game.interactionController.request({
    matchId: match.matchId,
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 't1' }]
  });

  // Cannot advance step while interaction is pending
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN'
    }, { authToken: match.player1Token }),
    (err) => err.code === 'PENDING_INTERACTION_ACTIVE' || err.message.includes('PENDING_INTERACTION_ACTIVE')
  );
});

test('WP-B Scenario 13: A player cannot bypass candidate selection constraints', async () => {
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
    candidates: [{ candidateId: 'legal_target_1' }, { candidateId: 'legal_target_2' }],
    min: 1,
    max: 1
  });

  const interactionId = active.game.state.pendingInteractions[0].id;

  // Selected candidate not in pool
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      interactionId,
      response: { selected: ['illegal_fabricated_target'] }
    }, { authToken: match.player1Token }),
    (err) => err.code === 'INVALID_CANDIDATE' || err.message.includes('INVALID_CANDIDATE')
  );

  // Selected count exceeds max
  await assert.rejects(
    async () => await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      interactionId,
      response: { selected: ['legal_target_1', 'legal_target_2'] }
    }, { authToken: match.player1Token }),
    (err) => err.code === 'SELECTION_COUNT_INVALID' || err.message.includes('SELECTION_COUNT_INVALID') || err.message.includes('EXCESS_SELECTIONS')
  );
});

test('WP-B Scenario 14: AI-controlled decisions remain restricted to the AI provider', () => {
  const ctx = createMatchContext({ mode: EXECUTION_MODES.HUMAN_VS_AI });
  assert.equal(ctx.canAiDecide('player'), false);
  assert.equal(ctx.canAiDecide('opponent'), true);
});

test('WP-B Scenario 15: Human-vs-human decisions never silently fall back to AI', () => {
  const ctx = createMatchContext({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });
  assert.equal(ctx.canAiDecide('player'), false);
  assert.equal(ctx.canAiDecide('opponent'), false);
  assert.equal(ctx.canSimulate('player'), false);
  assert.equal(ctx.canSimulate('opponent'), false);
});

test('WP-B Scenario 16: Headless simulation remains functional', () => {
  const ctx = createMatchContext({ mode: EXECUTION_MODES.HEADLESS_SIMULATION });
  assert.equal(ctx.canSimulate('player'), true);
  assert.equal(ctx.canSimulate('opponent'), true);
});
