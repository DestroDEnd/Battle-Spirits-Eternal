import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInteractionRequest,
  validateInteractionResponse,
  InteractionController,
  INTERACTION_TYPES,
  INTERACTION_STATUS
} from '../engine/interaction.js';

describe('Phase K.1 Work Package G: Interaction Protocol & Authority Battery', () => {

  it('1. Engine-Authoritative Request: produces structured interaction with zones, sides, bounds, and context', () => {
    const req = createInteractionRequest({
      type: INTERACTION_TYPES.SELECT_TARGET,
      player: 'player',
      sourceCardId: 'SRC_001',
      sourceAbilityId: 'ab_01',
      sourceZone: 'grave',
      targetSide: 'opponent',
      title: 'Select enemy Spirit to destroy',
      candidates: [
        { id: 'ENEMY_1', name: 'Dark Knight', zone: 'field', side: 'opponent' },
        { id: 'ENEMY_2', name: 'Shadow Mage', zone: 'field', side: 'opponent' }
      ],
      minSelections: 1,
      maxSelections: 1,
      optional: false,
      context: { turn: 3, phase: 'MAIN' }
    });

    assert.equal(req.player, 'player');
    assert.equal(req.sourceCardId, 'SRC_001');
    assert.equal(req.sourceZone, 'grave');
    assert.equal(req.targetSide, 'opponent');
    assert.equal(req.candidates.length, 2);
    assert.equal(req.minSelections, 1);
    assert.equal(req.maxSelections, 1);
    assert.equal(req.optional, false);
    assert.equal(req.status, INTERACTION_STATUS.WAITING_FOR_PLAYER);
  });

  it('2. Invalid ID & Bypass Rejection: rejects responses with unlisted candidate IDs', () => {
    const req = createInteractionRequest({
      type: INTERACTION_TYPES.SELECT_TARGET,
      player: 'player',
      candidates: [{ id: 'LEGAL_CAND_1', name: 'Legal Spirit' }],
      minSelections: 1,
      maxSelections: 1
    });

    const res = validateInteractionResponse(req, {
      selected: ['FORGED_CAND_ID']
    });

    assert.equal(res.valid, false);
    assert.match(res.reason, /ILLEGAL_CANDIDATE_SELECTED/);
  });

  it('3. Cardinality Bounds: rejects insufficient or excess selections', () => {
    const req = createInteractionRequest({
      type: INTERACTION_TYPES.SELECT_CARDS,
      player: 'player',
      candidates: [
        { id: 'CAND_1' },
        { id: 'CAND_2' },
        { id: 'CAND_3' }
      ],
      minSelections: 2,
      maxSelections: 2,
      optional: false
    });

    // Insufficient
    const resLow = validateInteractionResponse(req, { selected: ['CAND_1'] });
    assert.equal(resLow.valid, false);
    assert.match(resLow.reason, /INSUFFICIENT_SELECTIONS/);

    // Excess
    const resHigh = validateInteractionResponse(req, { selected: ['CAND_1', 'CAND_2', 'CAND_3'] });
    assert.equal(resHigh.valid, false);
    assert.match(resHigh.reason, /EXCESS_SELECTIONS/);

    // Exact
    const resOk = validateInteractionResponse(req, { selected: ['CAND_1', 'CAND_2'] });
    assert.equal(resOk.valid, true);
  });

  it('4. Optionality & Decline: mandatory interactions cannot be declined; optional can be declined', () => {
    const mandatoryReq = createInteractionRequest({
      type: INTERACTION_TYPES.SELECT_TARGET,
      player: 'player',
      candidates: [{ id: 'CAND_1' }],
      optional: false
    });

    const resMandatory = validateInteractionResponse(mandatoryReq, { declined: true });
    assert.equal(resMandatory.valid, false);
    assert.equal(resMandatory.reason, 'CANNOT_CANCEL_MANDATORY_INTERACTION');

    const optionalReq = createInteractionRequest({
      type: INTERACTION_TYPES.SELECT_TARGET,
      player: 'player',
      candidates: [{ id: 'CAND_1' }],
      optional: true
    });

    const resOptional = validateInteractionResponse(optionalReq, { declined: true });
    assert.equal(resOptional.valid, true);
    assert.equal(resOptional.value.declined, true);
  });

  it('5. Stale / Double Resolution Protection: an interaction cannot be resolved more than once', async () => {
    const controller = new InteractionController();
    const reqPromise = controller.request({
      type: INTERACTION_TYPES.SELECT_CARDS,
      player: 'player',
      candidates: [{ id: 'CARD_1' }]
    });

    const pending = Array.from(controller.pendingResolvers.values())[0];
    const interactionId = pending.interaction.id;

    // First resolution
    const firstRes = controller.respond(interactionId, { selected: ['CARD_1'] });
    assert.equal(firstRes.success, true);
    await reqPromise;

    // Second resolution attempt on resolved interaction
    const secondRes = controller.respond(interactionId, { selected: ['CARD_1'] });
    assert.equal(secondRes.success, false);
    assert.equal(secondRes.reason, 'ALREADY_RESOLVED_OR_STALE');
  });

  it('6. Sequential & Nested Prompts: maintains distinct interaction IDs and lifecycles', async () => {
    const controller = new InteractionController();
    const reqPromise1 = controller.request({
      type: INTERACTION_TYPES.SELECT_TARGET,
      player: 'player',
      candidates: [{ id: 'STEP1_CAND' }]
    });
    const reqPromise2 = controller.request({
      type: INTERACTION_TYPES.SELECT_TARGET,
      player: 'player',
      candidates: [{ id: 'STEP2_CAND' }]
    });

    const pendingList = Array.from(controller.pendingResolvers.values());
    const id1 = pendingList[0].interaction.id;
    const id2 = pendingList[1].interaction.id;

    assert.notEqual(id1, id2, 'Interactions must have distinct sequential IDs');

    // Resolve step 1
    const res1 = controller.respond(id1, { selected: ['STEP1_CAND'] });
    assert.equal(res1.success, true);
    await reqPromise1;

    // Resolve step 2
    const res2 = controller.respond(id2, { selected: ['STEP2_CAND'] });
    assert.equal(res2.success, true);
    await reqPromise2;
  });
});
