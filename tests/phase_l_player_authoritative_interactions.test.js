/**
 * tests/phase_l_player_authoritative_interactions.test.js
 * 
 * Phase L — Universal Player-Authoritative Effect Activation, Selection & Resolution Suite.
 * 
 * Verifies non-negotiable Player Autonomy requirements:
 * 1. Exactly 1 legal target MUST create an interaction prompt and require explicit confirmation.
 * 2. Zero silent auto-picks, zero .slice(0, count) truncations on human decisions.
 * 3. Legality is determined by the engine; choices are determined strictly by the player.
 * 4. Unauthorized player choices (Player B responding for Player A) are rejected.
 * 5. Replay protection and stale responses fail closed.
 * 6. Optional effects require explicit CONFIRM/DECLINE decisions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInteractionRequest,
  validateInteractionResponse,
  InteractionController,
  INTERACTION_TYPES,
  INTERACTION_STATUS
} from '../engine/interaction.js';
import { resolveTargets, executeTargeting } from '../engine/selectors.js';
import { executeOp } from '../engine/ops/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { EventBus } from '../engine/events.js';

function createMockState() {
  const state = createGameState();
  const c1 = createCardInstance({ id: 'card_sp1', name: 'Test Spirit 1', type: 'Spirit', cost: 3, bp: 3000, colors: ['Red'] }, 'opponent');
  const c2 = createCardInstance({ id: 'card_sp2', name: 'Test Spirit 2', type: 'Spirit', cost: 4, bp: 5000, colors: ['Red'] }, 'opponent');
  const p1 = createCardInstance({ id: 'card_friendly1', name: 'Friendly Spirit 1', type: 'Spirit', cost: 2, bp: 2000, colors: ['Red'] }, 'player');

  const st1 = createFieldStack(c1, { normal: 1, soul: 0 });
  const st2 = createFieldStack(c2, { normal: 2, soul: 0 });
  const stFriendly = createFieldStack(p1, { normal: 1, soul: 0 });

  state.players.opponent.field.push(st1, st2);
  state.players.player.field.push(stFriendly);
  state.players.player.reserve.normal = 5;
  state.players.player.reserve.soul = 1;
  return { state, st1, st2, stFriendly, c1, c2, p1 };
}

test('TC-L-01: Exactly one legal target exists -> creates prompt interaction, requires confirmation, does not auto-pick', async () => {
  const { state, st2 } = createMockState();
  // Filter for cost >= 4 matches ONLY st2 (exactly 1 candidate)
  let promptReceived = null;
  const mockResolver = {
    async choose(prompt) {
      promptReceived = prompt;
      assert.equal(prompt.candidates.length, 1, 'Should present exactly 1 candidate to player');
      return [prompt.candidates[0]];
    }
  };

  const res = await resolveTargets(
    state,
    { side: 'opp', types: ['Spirit'], filter: { costGte: 4 }, count: 1 },
    { controller: 'player' },
    mockResolver
  );

  assert.ok(promptReceived, 'Prompt must be triggered even when exactly 1 target exists');
  assert.equal(res.status, 'SUCCESS');
  assert.equal(res.targets.length, 1);
  assert.equal(res.targets[0].stack.id, st2.id);
});

test('TC-L-02: Multiple legal targets exist -> creates prompt interaction with all candidates, requires explicit selection', async () => {
  const { state, st1, st2 } = createMockState();
  let promptCandidates = [];
  const mockResolver = {
    async choose(prompt) {
      promptCandidates = prompt.candidates;
      // Explicitly select st1
      return [prompt.candidates.find(c => c.stack?.id === st1.id)];
    }
  };

  const res = await resolveTargets(
    state,
    { side: 'opp', types: ['Spirit'], count: 1 },
    { controller: 'player' },
    mockResolver
  );

  assert.equal(promptCandidates.length, 2, 'All eligible spirits must be presented');
  assert.equal(res.status, 'SUCCESS');
  assert.equal(res.targets.length, 1);
  assert.equal(res.targets[0].stack.id, st1.id);
});

test('TC-L-03: Zero legal targets exist -> returns NO_OP_BY_RULE without creating prompt', async () => {
  const { state } = createMockState();
  let promptCalled = false;
  const mockResolver = {
    async choose() {
      promptCalled = true;
      return [];
    }
  };

  const res = await resolveTargets(
    state,
    { side: 'opp', types: ['Nexus'], count: 1 },
    { controller: 'player' },
    mockResolver
  );

  assert.equal(promptCalled, false, 'Should not prompt player when 0 targets exist');
  assert.equal(res.status, 'NO_OP_BY_RULE');
  assert.equal(res.success, false);
});

test('TC-L-04: Optional effect -> creates SELECT_OPTIONAL_ACTION, player CONFIRM activates, player DECLINE skips', async () => {
  const state = createGameState();
  const controller = new InteractionController(state);

  // 1. Confirm optional action
  const confirmPromise = controller.request({
    type: INTERACTION_TYPES.SELECT_OPTIONAL_ACTION,
    title: 'Activate optional destruction effect?',
    decisionOwner: 'player',
    optional: true
  });

  const active1 = controller.getActiveInteraction('player');
  assert.ok(active1);
  assert.equal(active1.optional, true);
  assert.equal(active1.mandatory, false);

  const confirmRes = controller.respond(active1.id, { accepted: true });
  assert.equal(confirmRes.success, true);
  const val1 = await confirmPromise;
  assert.equal(val1.accepted, true);
  assert.equal(val1.declined, false);

  // 2. Decline optional action
  const declinePromise = controller.request({
    type: INTERACTION_TYPES.SELECT_OPTIONAL_ACTION,
    title: 'Activate optional second effect?',
    decisionOwner: 'player',
    optional: true
  });

  const active2 = controller.getActiveInteraction('player');
  const declineRes = controller.respond(active2.id, { declined: true });
  assert.equal(declineRes.success, true);
  const val2 = await declinePromise;
  assert.equal(val2.declined, true);
  assert.equal(val2.accepted, false);
});

test('TC-L-05: Mandatory effect with 1 candidate -> declining or empty selection is REJECTED', async () => {
  const state = createGameState();
  const controller = new InteractionController(state);

  const mandatoryPromise = controller.request({
    type: INTERACTION_TYPES.SELECT_TARGETS,
    title: 'Mandatory: Select 1 opposing Spirit to destroy',
    decisionOwner: 'player',
    candidates: [{ candidateId: 'target_1', name: 'Enemy Spirit' }],
    count: 1,
    minSelections: 1,
    maxSelections: 1,
    optional: false,
    mandatory: true
  });

  const active = controller.getActiveInteraction('player');
  // Attempt to decline mandatory interaction
  const declineAttempt = controller.respond(active.id, { declined: true });
  assert.equal(declineAttempt.success, false);
  assert.equal(declineAttempt.reason, 'CANNOT_CANCEL_MANDATORY_INTERACTION');

  // Attempt empty selection on mandatory interaction
  const emptyAttempt = controller.respond(active.id, { selected: [] });
  assert.equal(emptyAttempt.success, false);
  assert.match(emptyAttempt.reason, /INSUFFICIENT_SELECTIONS/);

  // Proper valid response
  const validAttempt = controller.respond(active.id, { selected: ['target_1'] });
  assert.equal(validAttempt.success, true);
  const resolved = await mandatoryPromise;
  assert.deepEqual(resolved.selected, ['target_1']);
});

test('TC-L-06: Unauthorized player response (Player B answering for Player A) -> REJECTED', () => {
  const interaction = createInteractionRequest({
    type: INTERACTION_TYPES.SELECT_TARGETS,
    decisionOwner: 'player',
    candidates: [{ candidateId: 'c1' }]
  });

  const res = validateInteractionResponse(interaction, {
    responder: 'opponent', // Opponent trying to choose for player
    selected: ['c1']
  });

  assert.equal(res.valid, false);
  assert.match(res.reason, /UNAUTHORIZED_DECISION_OWNER/);
});

test('TC-L-07: Stale or replay interaction response -> REJECTED with ALREADY_RESOLVED_OR_STALE', () => {
  const state = createGameState();
  const controller = new InteractionController(state);

  controller.request({
    id: 'interaction_fixed_id',
    type: INTERACTION_TYPES.CONFIRM_ACTION,
    decisionOwner: 'player',
    optional: true
  });

  const res1 = controller.respond('interaction_fixed_id', { accepted: true });
  assert.equal(res1.success, true);

  // Attempt to replay or send second response
  const res2 = controller.respond('interaction_fixed_id', { accepted: true });
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ALREADY_RESOLVED_OR_STALE');
});

test('TC-L-08: Core placement on field during MOVE_CORE -> prompts receiving controller via SELECT_CORE_ALLOCATION even with 1 spirit', async () => {
  const { state, stFriendly } = createMockState();
  const events = new EventBus();
  let coreAllocationPrompt = null;

  const mockResolver = {
    async choose(prompt) {
      coreAllocationPrompt = prompt;
      return [prompt.candidates[0]];
    }
  };

  const op = {
    op: 'MOVE_CORE',
    count: 1,
    from: { zone: 'reserve', side: 'self' },
    to: { zone: 'field', side: 'self' }
  };

  const res = await executeOp(state, op, { controller: 'player' }, mockResolver, events);
  assert.ok(coreAllocationPrompt, 'Should prompt controller for core placement on field');
  assert.equal(coreAllocationPrompt.type, 'SELECT_CORE_ALLOCATION');
  assert.equal(coreAllocationPrompt.chooser, 'player');
  assert.equal(res.success, true);
  assert.equal(stFriendly.cores.normal, 2, 'Core should be deposited on chosen spirit');
});

test('TC-L-09: Universal Decision Contract -> all 22 fields present and typed on InteractionRequest', () => {
  const req = createInteractionRequest({
    requestType: 'SELECT_TARGETS',
    requestingPlayer: 'player',
    decisionOwner: 'player',
    candidates: [{ candidateId: 'c1', name: 'Card 1' }],
    count: 1
  });

  const requiredFields = [
    'interactionId',
    'matchId',
    'requestType',
    'requestingPlayer',
    'decisionOwner',
    'sourceCardId',
    'sourceAbilityId',
    'physicalAbilityId',
    'effectId',
    'operationId',
    'timingWindow',
    'mandatory',
    'optional',
    'candidates',
    'selectionConstraints',
    'allowedActions',
    'defaultAction',
    'deadlinePolicy',
    'context',
    'status',
    'createdAt',
    'resolutionMetadata'
  ];

  for (const field of requiredFields) {
    assert.ok(field in req, `Missing field "${field}" in universal interaction request`);
  }
  assert.equal(req.status, INTERACTION_STATUS.WAITING_FOR_PLAYER);
});

test('TC-L-10: Resolver suspension and resumption -> engine pauses on WAITING_FOR_PLAYER until explicit Promise resolution', async () => {
  const state = createGameState();
  const controller = new InteractionController(state);

  let resumed = false;
  const promise = controller.request({
    type: INTERACTION_TYPES.CONFIRM_ACTION,
    title: 'Confirm battle declaration',
    decisionOwner: 'player',
    optional: true
  }).then(resp => {
    resumed = true;
    return resp;
  });

  const pending = controller.getActiveInteraction('player');
  assert.equal(resumed, false, 'Flow must remain paused while interaction is pending');
  assert.equal(pending.status, INTERACTION_STATUS.WAITING_FOR_PLAYER);

  // Resume asynchronously
  controller.respond(pending.id, { accepted: true });
  const result = await promise;
  assert.equal(resumed, true, 'Flow resumes immediately upon player response resolution');
  assert.equal(result.accepted, true);
});
