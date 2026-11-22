import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateTargetAvailability, queryCandidates, normalizeCardZone } from '../engine/selectors.js';

function createMockState() {
  return {
    players: {
      player: {
        field: [],
        hand: [],
        grave: [],
        deck: [],
        removed: [],
        revealed: [],
        nexus: [],
        burst: null,
        reserve: { normal: 4, soul: 1 },
        trash: { normal: 0, soul: 0 }
      },
      opponent: {
        field: [],
        hand: [],
        grave: [],
        deck: [],
        removed: [],
        revealed: [],
        nexus: [],
        burst: null,
        reserve: { normal: 4, soul: 1 },
        trash: { normal: 0, soul: 0 }
      }
    }
  };
}

describe('Phase K.1 Work Package D: Target-Side & Zone Validation Adversarial Battery', () => {

  it('1. Player target, player grave: accepts legal friendly grave card', () => {
    const state = createMockState();
    const card = { id: 'CARD_P1', name: 'Friendly Spirit', type: 'Spirit', owner: 'player' };
    state.players.player.grave.push(card);

    const target = { id: 'CARD_P1', card, side: 'player', zone: 'grave' };
    const valid = validateTargetAvailability(state, target, 'grave');
    assert.equal(valid, true, 'Friendly card in player grave must be accepted for side: player');
  });

  it('2. Player target, opponent grave: strictly rejects opponent card when side: player is requested', () => {
    const state = createMockState();
    const card = { id: 'CARD_OPP1', name: 'Enemy Spirit', type: 'Spirit', owner: 'opponent' };
    state.players.opponent.grave.push(card);

    const target = { id: 'CARD_OPP1', card, side: 'player', zone: 'grave' };
    const valid = validateTargetAvailability(state, target, 'grave');
    assert.equal(valid, false, 'Opponent grave card must be rejected when target specifies side: player');
  });

  it('3. Opponent target, opponent grave: accepts legal enemy grave card', () => {
    const state = createMockState();
    const card = { id: 'CARD_OPP2', name: 'Enemy Spirit', type: 'Spirit', owner: 'opponent' };
    state.players.opponent.grave.push(card);

    const target = { id: 'CARD_OPP2', card, side: 'opponent', zone: 'grave' };
    const valid = validateTargetAvailability(state, target, 'grave');
    assert.equal(valid, true, 'Enemy card in opponent grave must be accepted for side: opponent');
  });

  it('4. Opponent target, player grave: strictly rejects friendly card when side: opponent is requested', () => {
    const state = createMockState();
    const card = { id: 'CARD_P2', name: 'Friendly Spirit', type: 'Spirit', owner: 'player' };
    state.players.player.grave.push(card);

    const target = { id: 'CARD_P2', card, side: 'opponent', zone: 'grave' };
    const valid = validateTargetAvailability(state, target, 'grave');
    assert.equal(valid, false, 'Player grave card must be rejected when target specifies side: opponent');
  });

  it('5. Both-side targeting: accepts valid cards from either player or opponent side', () => {
    const state = createMockState();
    const pCard = { id: 'CARD_P3', name: 'Friendly', type: 'Spirit', owner: 'player' };
    const oCard = { id: 'CARD_O3', name: 'Enemy', type: 'Spirit', owner: 'opponent' };
    state.players.player.hand.push(pCard);
    state.players.opponent.hand.push(oCard);

    const targetP = { id: 'CARD_P3', card: pCard, side: 'both', zone: 'hand' };
    const targetO = { id: 'CARD_O3', card: oCard, side: 'both', zone: 'hand' };

    assert.equal(validateTargetAvailability(state, targetP, 'hand'), true, 'Side: both must accept player card');
    assert.equal(validateTargetAvailability(state, targetO, 'hand'), true, 'Side: both must accept opponent card');
  });

  it('6. Explicit side with missing card: rejects when card does not exist in requested side', () => {
    const state = createMockState();
    const target = { id: 'NON_EXISTENT_ID', side: 'player', zone: 'field' };
    const valid = validateTargetAvailability(state, target, 'field');
    assert.equal(valid, false, 'Non-existent card must be rejected');
  });

  it('7. Explicit zone with card in another zone: rejects card residing in different physical zone', () => {
    const state = createMockState();
    const card = { id: 'CARD_HAND1', name: 'Hand Spirit', type: 'Spirit', owner: 'player' };
    state.players.player.hand.push(card);

    // Requested in grave, but card is actually in hand!
    const target = { id: 'CARD_HAND1', card, side: 'player', zone: 'grave' };
    const valid = validateTargetAvailability(state, target, 'grave');
    assert.equal(valid, false, 'Card residing in hand must be rejected when expectedZone is grave');
  });

  it('8. Card changing zones between candidate generation and validation: rejects stale target', () => {
    const state = createMockState();
    const card = { id: 'CARD_FIELD1', name: 'Field Spirit', type: 'Spirit', owner: 'player' };
    state.players.player.field.push({ id: 'stack_1', top: card, cores: { normal: 1, soul: 0 } });

    // Step 1: Card is on field
    const target = { id: 'CARD_FIELD1', card, side: 'player', zone: 'field' };
    assert.equal(validateTargetAvailability(state, target, 'field'), true, 'Must be valid on field initially');

    // Step 2: Card moves from field to grave before resolution
    state.players.player.field = [];
    state.players.player.grave.push(card);

    // Step 3: Re-validation with expectedZone: field must now reject the stale target!
    assert.equal(validateTargetAvailability(state, target, 'field'), false, 'Stale target that left field must be rejected');
  });

  it('9. Duplicate IDs across zones: rejects ambiguous/corrupted state where single ID appears in multiple zones', () => {
    const state = createMockState();
    const cardA = { id: 'CORRUPTED_DUP_ID', name: 'Glitch Spirit', type: 'Spirit', owner: 'player' };
    const cardB = { id: 'CORRUPTED_DUP_ID', name: 'Duplicate Glitch', type: 'Spirit', owner: 'player' };

    state.players.player.hand.push(cardA);
    state.players.player.grave.push(cardB);

    const target = { id: 'CORRUPTED_DUP_ID', card: cardA, side: 'player', zone: 'hand' };
    const valid = validateTargetAvailability(state, target, 'hand');
    assert.equal(valid, false, 'Duplicate card instance across zones must be rejected to prevent ambiguity');
  });

  it('10. Owner/controller differing from physical side: strictly enforces physical side over ownership metadata', () => {
    const state = createMockState();
    // Card belongs to player originally, but is physically held in opponent field/grave (e.g. mind control or captured)
    const stolenCard = { id: 'STOLEN_CARD', name: 'Captured Spirit', type: 'Spirit', owner: 'player', controller: 'opponent' };
    state.players.opponent.grave.push(stolenCard);

    // Target requests physical player side, but card is physically on opponent side
    const targetPlayerSide = { id: 'STOLEN_CARD', card: stolenCard, side: 'player', zone: 'grave' };
    assert.equal(validateTargetAvailability(state, targetPlayerSide, 'grave'), false, 'Must reject because card is physically on opponent side');

    // Target requests physical opponent side
    const targetOppSide = { id: 'STOLEN_CARD', card: stolenCard, side: 'opponent', zone: 'grave' };
    assert.equal(validateTargetAvailability(state, targetOppSide, 'grave'), true, 'Must accept because card is physically on opponent side');
  });
});
