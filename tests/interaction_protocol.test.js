import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInteractionRequest,
  validateInteractionResponse,
  InteractionController,
  INTERACTION_TYPES,
  INTERACTION_STATUS
} from '../engine/interaction.js';
import { createGame } from '../engine/index.js';
import { createGameState, createFieldStack, createCardInstance } from '../engine/state.js';
import { EventBus } from '../engine/events.js';
import { AsyncResolver } from '../engine/resolver.js';

test('INTERACTION-01: createInteractionRequest establishes normalized schema, candidate pool, and selection bounds', () => {
  const req = createInteractionRequest({
    type: INTERACTION_TYPES.SELECT_CARDS,
    player: 'player',
    title: 'Choose 1 opposing spirit to destroy',
    candidates: [
      { id: 'c1', name: 'Spirit A', zone: 'field' },
      { id: 'c2', name: 'Spirit B', zone: 'field' }
    ],
    count: 1,
    optional: false
  });

  assert.ok(req.id.startsWith('interaction_'));
  assert.equal(req.type, 'SELECT_CARDS');
  assert.equal(req.player, 'player');
  assert.equal(req.candidates.length, 2);
  assert.equal(req.minSelections, 1);
  assert.equal(req.maxSelections, 1);
  assert.equal(req.optional, false);
  assert.equal(req.status, INTERACTION_STATUS.WAITING_FOR_PLAYER);
});

test('INTERACTION-02: validateInteractionResponse enforces candidate legality, bounds, and optionality', () => {
  const req = createInteractionRequest({
    type: INTERACTION_TYPES.SELECT_CARDS,
    player: 'player',
    candidates: [
      { id: 'card_1', name: 'Alpha' },
      { id: 'card_2', name: 'Beta' }
    ],
    minSelections: 1,
    maxSelections: 1,
    optional: false
  });

  // Valid selection
  const validRes = validateInteractionResponse(req, { selected: ['card_1'] });
  assert.equal(validRes.valid, true);

  // Illegal candidate
  const illegalRes = validateInteractionResponse(req, { selected: ['card_999'] });
  assert.equal(illegalRes.valid, false);
  assert.ok(illegalRes.reason.includes('ILLEGAL_CANDIDATE_SELECTED'));

  // Insufficient count
  const fewRes = validateInteractionResponse(req, { selected: [] });
  assert.equal(fewRes.valid, false);
  assert.ok(fewRes.reason.includes('INSUFFICIENT_SELECTIONS'));

  // Excess count
  const excessRes = validateInteractionResponse(req, { selected: ['card_1', 'card_2'] });
  assert.equal(excessRes.valid, false);
  assert.ok(excessRes.reason.includes('EXCESS_SELECTIONS'));

  // Cannot cancel mandatory interaction
  const cancelRes = validateInteractionResponse(req, { declined: true });
  assert.equal(cancelRes.valid, false);
  assert.equal(cancelRes.reason, 'CANNOT_CANCEL_MANDATORY_INTERACTION');

  // Optional interaction CAN be declined
  const optReq = createInteractionRequest({
    type: INTERACTION_TYPES.CONFIRM_ACTION,
    player: 'player',
    optional: true
  });
  const optCancel = validateInteractionResponse(optReq, { declined: true });
  assert.equal(optCancel.valid, true);
  assert.equal(optCancel.value.declined, true);
});

test('INTERACTION-03: InteractionController pauses resolution, registers in state, and resumes upon valid response', async () => {
  const state = createGameState();
  const events = new EventBus();
  const controller = new InteractionController(state, events);

  let eventFired = false;
  events.on('INTERACTION_REQUESTED', (ev) => {
    eventFired = true;
    assert.equal(ev.interaction.type, 'SELECT_CARDS');
  });

  const requestPromise = controller.request({
    type: INTERACTION_TYPES.SELECT_CARDS,
    player: 'player',
    candidates: [{ id: 'cand_A' }, { id: 'cand_B' }],
    count: 1
  });

  // Verify interaction is active and stored in state
  assert.equal(eventFired, true);
  assert.equal(state.pendingInteractions.length, 1);
  const active = controller.getActiveInteraction();
  assert.ok(active !== null);
  assert.equal(active.status, INTERACTION_STATUS.WAITING_FOR_PLAYER);

  // Respond with valid selection
  const respondRes = await controller.respond(active.id, { selected: ['cand_A'] });
  assert.equal(respondRes.success, true);

  // Await the resumed promise
  const resolvedValue = await requestPromise;
  assert.equal(resolvedValue.accepted, true);
  assert.deepEqual(resolvedValue.selected, ['cand_A']);

  // Verify removed from pending
  assert.equal(state.pendingInteractions.length, 0);
  assert.equal(controller.getActiveInteraction(), null);
});

test('INTERACTION-04: Protection against duplicate and stale resolution', async () => {
  const state = createGameState();
  const controller = new InteractionController(state);

  const reqPromise = controller.request({
    type: INTERACTION_TYPES.CONFIRM_ACTION,
    player: 'player',
    optional: true
  });

  const active = controller.getActiveInteraction();
  assert.ok(active !== null);

  // First resolution succeeds
  const firstRes = await controller.respond(active.id, { accepted: true });
  assert.equal(firstRes.success, true);
  await reqPromise;

  // Second duplicate resolution must fail cleanly
  const dupRes = await controller.respond(active.id, { accepted: true });
  assert.equal(dupRes.success, false);
  assert.equal(dupRes.reason, 'ALREADY_RESOLVED_OR_STALE');
});

test('INTERACTION-05: Integrated game interaction with production engine and AsyncResolver', async () => {
  const game = createGame({
    interactive: true
  });

  const state = game.state;
  const p1 = state.players.player;
  const p2 = state.players.opponent;

  // Add target spirits on opponent field
  const oppSpirit1 = createCardInstance({ id: 'opp_s1', card_number: 'OPP-1', name: 'Target Spirit 1', type: 'Spirit' }, 'opponent');
  const oppStack1 = createFieldStack(oppSpirit1, { normal: 1, soul: 0 });
  const oppSpirit2 = createCardInstance({ id: 'opp_s2', card_number: 'OPP-2', name: 'Target Spirit 2', type: 'Spirit' }, 'opponent');
  const oppStack2 = createFieldStack(oppSpirit2, { normal: 1, soul: 0 });
  p2.field.push(oppStack1, oppStack2);

  // Ability that requires selecting an opposing spirit to destroy
  const destroyAbility = {
    header: { timing: 'WHEN_SUMMONED' },
    clauses: [
      {
        op: {
          op: 'DESTROY',
          target: { side: 'opp', types: ['Spirit'] }
        }
      }
    ]
  };

  // Launch ability resolution asynchronously (it will pause waiting for target selection)
  let resolutionCompleted = false;
  const resolvePromise = game.resolver.resolveAbility(state, destroyAbility, { controller: 'player' }).then(res => {
    resolutionCompleted = true;
    return res;
  });

  // Give microtask tick to let resolver run until interaction prompt
  await new Promise(r => setImmediate(r));

  // Verify that an interaction request was generated and resolution paused
  assert.equal(resolutionCompleted, false, 'Ability resolution must be paused waiting for player input');
  const pending = game.getPendingInteractions('player');
  assert.equal(pending.length, 1);
  assert.equal(pending[0].status, INTERACTION_STATUS.WAITING_FOR_PLAYER);

  // Submit response choosing Target Spirit 2 (OPP-2)
  const targetCand = pending[0].candidates.find(c => c.cardNumber === 'OPP-2' || c.name === 'Target Spirit 2');
  assert.ok(targetCand !== undefined, 'Legal candidate for Target Spirit 2 must exist');

  const submitRes = await game.submitInteractionResponse(pending[0].id, {
    selected: [targetCand.candidateId]
  });
  assert.equal(submitRes.success, true);

  // Await the resumed ability resolution
  const finalRes = await resolvePromise;
  assert.equal(finalRes.success, true);
  assert.equal(resolutionCompleted, true);

  // Verify that the chosen spirit was destroyed to opponent grave
  assert.ok(p2.grave.some(c => c.cardNumber === 'OPP-2' || c.name === 'Target Spirit 2'), 'Selected opposing spirit must be destroyed to grave');
});
