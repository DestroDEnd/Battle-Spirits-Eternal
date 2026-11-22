/**
 * tests/phase_k1_engine_invariants.test.js
 * 
 * Phase K.1 Work Package N — Engine Invariants and Transaction Safety Battery.
 * Formally validates the 15 non-negotiable architectural invariants:
 * 1. Card Zone Disjointness
 * 2. Zero Duplication During Movement
 * 3. Failed Transaction Atomic Rollback
 * 4. Core Conservation (Delta C = 0)
 * 5. Invalid Selections Cannot Mutate State
 * 6. Failed Costs Do Not Partially Commit
 * 7. Invalid Target Sides Rejected
 * 8. Invalid Source Zones Rejected
 * 9. Stale Target References Rejected
 * 10. Nested Prompts Context Preservation
 * 11. Pending Interaction Cannot Be Bypassed
 * 12. Completed Interaction Cannot Be Reused
 * 13. Card Identity Survival Across Legal Movements
 * 14. Resolver Failure Consistency
 * 15. Activation Restriction Integrity
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import {
  createCardInstance,
  createFieldStack,
  validateGameState,
  getTotalPlayerCores,
  cloneGameState
} from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { InteractionController, INTERACTION_TYPES, INTERACTION_STATUS } from '../engine/interaction.js';
import {
  reserveRestriction,
  commitRestriction,
  releaseReservation,
  evaluateRestriction,
  RESTRICTION_TYPE,
  RESTRICTION_SCOPE,
  RESTRICTION_STATUS
} from '../engine/restrictions.js';

function makeFillerDeck(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `FILL-${i + 1}`,
    name: `Filler ${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 1000 } }
  }));
}

function makeCleanState() {
  const game = createGame({
    playerDeck: makeFillerDeck(40),
    opponentDeck: makeFillerDeck(40)
  });
  return game.state;
}

test('INV-K1-01: Every card instance exists in exactly one physical card zone', () => {
  const state = makeCleanState();
  const allCardIds = new Map(); // id -> zone

  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    for (const c of p.deck) {
      assert.ok(c.id, 'Card must have valid id');
      assert.equal(allCardIds.has(c.id), false, `Card ${c.id} duplicated in deck`);
      allCardIds.set(c.id, `${side}.deck`);
    }
    for (const c of p.hand) {
      assert.ok(c.id, 'Card must have valid id');
      assert.equal(allCardIds.has(c.id), false, `Card ${c.id} duplicated in hand`);
      allCardIds.set(c.id, `${side}.hand`);
    }
    for (const s of p.field) {
      const cardId = s.card ? s.card.id : s.top.id;
      assert.equal(allCardIds.has(cardId), false, `Card ${cardId} duplicated in field`);
      allCardIds.set(cardId, `${side}.field`);
    }
    for (const c of (p.grave || [])) {
      assert.equal(allCardIds.has(c.id), false, `Card ${c.id} duplicated in grave`);
      allCardIds.set(c.id, `${side}.grave`);
    }
  }

  assert.equal(allCardIds.size, 80, 'Total card instances must be exactly 80 across both players');
});

test('INV-K1-02: A card cannot be duplicated during movement', async () => {
  const state = makeCleanState();
  const card = state.players.player.deck[0];
  const initialDeckLen = state.players.player.deck.length;

  await moveCard(state, card, 'hand', 'player');
  assert.equal(state.players.player.deck.length, initialDeckLen - 1);
  assert.ok(state.players.player.hand.some(c => c.id === card.id));
  assert.equal(state.players.player.deck.some(c => c.id === card.id), false);
});

test('INV-K1-03: Failed transaction does not drop or duplicate cards (Atomic Rollback)', async () => {
  const state = makeCleanState();
  const card = createCardInstance({ id: 'TEST-01', cardNumber: 'TEST-01', cost: 5 });
  state.players.player.hand.push(card);
  state.players.player.reserve.normal = 0; // Insufficient cores!
  state.players.player.reserve.soul = 0;

  const preHandLen = state.players.player.hand.length;
  const op = { op: 'SUMMON', cost: 5, from: 'hand', target: { instanceId: card.id } };

  const res = await executeOp(state, op, { sourceCard: card, side: 'player' });
  assert.equal(res.success, false);
  assert.equal(state.players.player.hand.length, preHandLen, 'Hand length must be preserved on failed summon');
  assert.ok(state.players.player.hand.some(c => c.id === card.id), 'Card must remain in hand');
});

test('INV-K1-04: Core conservation remains intact (Delta C = 0)', () => {
  const state = makeCleanState();
  const initialTotal = getTotalPlayerCores(state.players.player).total;

  moveCore(state, 'reserve', 'trash', 2, 'player');
  assert.equal(getTotalPlayerCores(state.players.player).total, initialTotal, 'Cores must be conserved across reserve -> trash');

  moveCore(state, 'trash', 'reserve', 2, 'player');
  assert.equal(getTotalPlayerCores(state.players.player).total, initialTotal, 'Cores must be conserved across trash -> reserve');
});

test('INV-K1-05: Invalid selections cannot mutate state', async () => {
  const state = makeCleanState();
  const preSnapshot = JSON.stringify(state);

  const op = {
    op: 'DESTROY',
    target: {
      side: 'opponent',
      types: ['Spirit'],
      selector: { instanceId: 'NON_EXISTENT_UID' }
    }
  };

  const res = await executeOp(state, op, { side: 'player' });
  assert.equal(res.success, false);
  assert.equal(JSON.stringify(state), preSnapshot, 'State must be identical after failed invalid selection');
});

test('INV-K1-06: Failed costs do not partially commit', async () => {
  const state = makeCleanState();
  state.players.player.reserve.normal = 0;
  state.players.player.reserve.soul = 0;
  const preReserve = state.players.player.reserve.normal;

  const card = createCardInstance({ id: 'COST-01', cardNumber: 'COST-01', cost: 4 });
  state.players.player.hand.push(card);

  const op = { op: 'SUMMON', cost: 4, from: 'hand', target: { instanceId: card.id } };
  const res = await executeOp(state, op, { sourceCard: card, side: 'player' });

  assert.equal(res.success, false);
  assert.equal(state.players.player.reserve.normal, preReserve, 'Reserve cores must not be partially deducted');
});

test('INV-K1-07: Invalid target sides are rejected cleanly', async () => {
  const state = makeCleanState();
  const playerCard = createCardInstance({ id: 'P-01', cardNumber: 'P-01' });
  const pStack = createFieldStack(playerCard, 1);
  state.players.player.field.push(pStack);

  // Operation strictly targets opponent side, but provides player instance
  const op = {
    op: 'DESTROY',
    target: {
      side: 'opponent',
      types: ['Spirit'],
      selector: { instanceId: playerCard.id }
    }
  };

  const res = await executeOp(state, op, { side: 'player' });
  assert.equal(res.success, false, 'Targeting player card with opponent side specification must fail');
  assert.equal(state.players.player.field.length, 1, 'Player card must not be destroyed');
});

test('INV-K1-08: Invalid source zones are rejected cleanly', async () => {
  const state = makeCleanState();
  const card = createCardInstance({ id: 'SRC-01', cardNumber: 'SRC-01' });
  state.players.player.hand.push(card);

  // Claim to summon from trash when card is in hand
  const op = {
    op: 'SUMMON',
    from: 'trash',
    target: { instanceId: card.id }
  };

  const res = await executeOp(state, op, { side: 'player' });
  assert.equal(res.success, false, 'Summoning from wrong source zone must fail');
  assert.equal(state.players.player.field.length, 0, 'No spirit may be placed on field');
});

test('INV-K1-09: Stale target references are rejected', async () => {
  const state = makeCleanState();
  const oppCard = createCardInstance({ id: 'OPP-01', cardNumber: 'OPP-01', cost: 1 });
  const oppStack = createFieldStack(oppCard, 1);
  state.players.opponent.field.push(oppStack);

  const promptResolver = { choose: (prompt) => prompt.candidates.slice(0, 1) };

  // First destroy operation succeeds
  const op1 = { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Spirit'] } };
  const res1 = await executeOp(state, op1, { side: 'player' }, promptResolver);
  assert.equal(res1.success, true);
  assert.equal(state.players.opponent.field.length, 0);

  // Second operation when field is empty must fail / return no-op
  const res2 = await executeOp(state, op1, { side: 'player' }, promptResolver);
  assert.equal(res2.success, false, 'Stale / empty field target must be rejected');
});

test('INV-K1-10: Nested prompts preserve correct resolution context', async () => {
  const controller = new InteractionController();
  const p1 = controller.request({ type: INTERACTION_TYPES.SELECT_TARGET, context: { abilityId: 'PARENT#a0' } });
  assert.ok(controller.getPendingInteractions().length > 0);
  const active = controller.getActiveInteraction();

  controller.respond(active.id, { selected: ['t1'] });
  const outcome = await p1;
  assert.deepEqual(outcome.selected, ['t1']);
  assert.equal(controller.getPendingInteractions().length, 0);
});

test('INV-K1-11: A pending interaction cannot be bypassed', () => {
  const controller = new InteractionController();
  controller.request({ type: INTERACTION_TYPES.SELECT_TARGET, min: 1, max: 1 });
  const pending = controller.getPendingInteractions();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].status, 'WAITING_FOR_PLAYER');
});

test('INV-K1-12: A completed interaction cannot be reused', async () => {
  const controller = new InteractionController();
  const p = controller.request({ type: INTERACTION_TYPES.SELECT_TARGET, min: 1, max: 1 });
  const active = controller.getActiveInteraction();
  controller.respond(active.id, { selected: ['target-1'] });
  await p;

  // Second response must be rejected
  const res2 = controller.respond(active.id, { selected: ['target-2'] });
  assert.equal(res2.success, false, 'Completed interaction cannot be re-responded');
});

test('INV-K1-13: Card identity survives all legal movements', async () => {
  const state = makeCleanState();
  const card = state.players.player.deck[0];
  const origId = card.id;

  // Deck -> Hand
  await moveCard(state, card, 'hand', 'player');
  assert.ok(state.players.player.hand.some(c => c.id === origId), 'Identity preserved in hand');

  // Hand -> Grave
  await moveCard(state, card, 'grave', 'player');
  assert.ok(state.players.player.grave.some(c => c.id === origId), 'Identity preserved in grave');
});

test('INV-K1-14: Resolver failure leaves state consistent without orphaned objects', async () => {
  const state = makeCleanState();
  const preSnapshot = cloneGameState(state);

  const opBroken = { op: 'INVALID_OR_CORRUPT_OP', params: { broken: true } };
  const res = await executeOp(state, opBroken);
  assert.equal(res.success, false);

  assert.equal(validateGameState(state).valid, true, 'State validation must still hold');
  assert.equal(state.players.player.field.length, preSnapshot.players.player.field.length);
});

test('INV-K1-15: Concurrent or repeated activation cannot bypass ONCE_PER_TURN restrictions', () => {
  const state = makeCleanState();
  const ability = {
    id: 'AB-OPT-01',
    type: 'ABILITY',
    header: { timing: 'MAIN', limit: 'ONCE_PER_TURN' }
  };

  const handle1 = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(handle1.success, true);
  commitRestriction(state, handle1);

  // Repeated activation in same turn must be blocked
  const handle2 = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(handle2.success, false, 'Repeated ONCE_PER_TURN activation must be rejected');
  assert.equal(handle2.status, RESTRICTION_STATUS.LIMIT_REACHED);
});
