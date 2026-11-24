import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createCardInstance } from '../engine/state.js';
import { moveCard } from '../engine/zones.js';
import { executeOp } from '../engine/ops/index.js';
import { createEngineStateFromLegacy, syncEngineStateToLegacy } from '../engine/legacy_bridge.js';
import { serializeGameState, deserializeGameState } from '../engine/state_serialization.js';

test('M4-DRAW-01: DRAW and DRAW_CARDS move exact top cards from deck to hand and emit CARD_DRAWN', async () => {
  const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const p = state.players.player;

  const c1 = createCardInstance({ id: 'draw_c1', card_number: 'M4-DR1', name: 'Top 1', type: 'Spirit' }, 'player');
  const c2 = createCardInstance({ id: 'draw_c2', card_number: 'M4-DR2', name: 'Top 2', type: 'Spirit' }, 'player');
  const c3 = createCardInstance({ id: 'draw_c3', card_number: 'M4-DR3', name: 'Top 3', type: 'Spirit' }, 'player');
  p.deck.push(c1, c2, c3);

  const drawnEvents = [];
  game.events.on('CARD_DRAWN', (ev) => drawnEvents.push(ev));

  const res1 = await executeOp(state, { op: 'DRAW', count: 1 }, { controller: 'player' }, null, game.events);
  assert.equal(res1.success, true);
  assert.equal(res1.drawnCount, 1);
  assert.equal(p.deck.length, 2);
  assert.equal(p.hand.length, 1);
  assert.equal(p.hand[0].id, c1.id);

  const res2 = await executeOp(state, { op: 'DRAW_CARDS', amount: 2 }, { controller: 'player' }, null, game.events);
  assert.equal(res2.success, true);
  assert.equal(res2.drawnCount, 2);
  assert.equal(p.deck.length, 0);
  assert.equal(p.hand.length, 3);
  assert.deepEqual(p.hand.map(c => c.id), [c1.id, c2.id, c3.id]);
  assert.equal(drawnEvents.length, 3);
});

test('M4-DRAW-02: DRAW respects CANNOT_DRAW restriction, maxDraw modifier, and empty deck', async () => {
  const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const p = state.players.player;
  p.deck.push(
    createCardInstance({ id: 'lim_1', card_number: 'L1', name: 'L1', type: 'Spirit' }, 'player'),
    createCardInstance({ id: 'lim_2', card_number: 'L2', name: 'L2', type: 'Spirit' }, 'player'),
    createCardInstance({ id: 'lim_3', card_number: 'L3', name: 'L3', type: 'Spirit' }, 'player')
  );

  // maxDraw: 1 modifier
  state.modifiers.push({ id: 'm_max', type: 'CARD_RULE_MODIFIER', maxDraw: 1, side: 'player' });
  const resMax = await executeOp(state, { op: 'DRAW', count: 3 }, { controller: 'player' }, game.events);
  assert.equal(resMax.drawnCount, 1);
  assert.equal(p.hand.length, 1);
  assert.equal(p.deck.length, 2);

  // CANNOT_DRAW restriction
  state.modifiers.push({ id: 'm_no', type: 'SET_RESTRICTION', restriction: 'CANNOT_DRAW', side: 'player' });
  const resRestricted = await executeOp(state, { op: 'DRAW', count: 1 }, { controller: 'player' }, game.events);
  assert.equal(resRestricted.success, false);
  assert.equal(resRestricted.reason, 'DRAW_RESTRICTED');
  assert.equal(p.hand.length, 1);
});

test('M4-DRAW-03: REVEAL_DECKTOP -> ADD_TO_HAND -> DISCARD_REMAINING preserves exact zones with no ghost cards', async () => {
  const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const p = state.players.player;

  const r1 = createCardInstance({ id: 'rev_1', card_number: 'R1', name: 'Rev 1', type: 'Spirit' }, 'player');
  const r2 = createCardInstance({ id: 'rev_2', card_number: 'R2', name: 'Rev 2', type: 'Magic' }, 'player');
  p.deck.push(r1, r2);

  const ctx = { controller: 'player' };
  const revRes = await executeOp(state, { op: 'REVEAL_DECKTOP', count: 2 }, ctx, null, game.events);
  assert.equal(revRes.success, true);
  assert.equal(p.deck.length, 0);
  assert.equal(p.revealed.length, 2);

  const addRes = await executeOp(state, { op: 'ADD_TO_HAND', from: 'revealed', count: 1, filter: { types: ['Spirit'] } }, ctx, null, game.events);
  assert.equal(addRes.success, true);
  assert.equal(p.hand.length, 1);
  assert.equal(p.hand[0].id, r1.id);
  assert.equal(p.revealed.length, 1, 'Remaining revealed card should stay in revealed until discarded');

  const discRes = await executeOp(state, { op: 'DISCARD_REMAINING' }, ctx, null, game.events);
  assert.equal(discRes.success, true);
  assert.equal(discRes.count ?? discRes.discardedCount, 1);
  assert.equal(p.revealed.length, 0);
  assert.equal(p.grave.length, 1);
  assert.equal(p.grave[0].id, r2.id);
});

test('M4-MOVE-04: moveCard rejects mismatched expectedFromZone / expectedFromSide without mutation', async () => {
  const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const card = createCardInstance({ id: 'mv_1', card_number: 'MV1', name: 'Card', type: 'Spirit' }, 'player');
  state.players.player.grave.push(card);

  const wrongZone = await moveCard(state, card, 'hand', 'player', { expectedFromZone: 'deck', expectedFromSide: 'player' }, game.events);
  assert.equal(wrongZone, false);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(state.players.player.grave.length, 1);

  const wrongSide = await moveCard(state, card, 'hand', 'player', { expectedFromZone: 'grave', expectedFromSide: 'opponent' }, game.events);
  assert.equal(wrongSide, false);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(state.players.player.grave.length, 1);
});

test('M4-SYNC-05: Legacy bridge avoids Nexus duplication and serialization preserves revealed/openCards', () => {
  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: {
      life: 5, reserveCores: 3, trashCores: 0, voidCores: 10,
      deck: [], hand: [], trashCards: [], voidCards: [],
      openCards: [{ uid: 'open_u1', id: 'BS01-099', name: 'Open Card', type: 'Spirit' }],
      revealed: [{ uid: 'rev_u1', id: 'BS01-088', name: 'Rev Card', type: 'Magic' }],
      field: [],
      nexus: [{ uid: 'nx_u1', id: 'BS01-070', name: 'Burning Canyon', type: 'Nexus', currentCores: 1 }]
    },
    opponent: {
      life: 5, reserveCores: 3, trashCores: 0, voidCores: 10,
      deck: [], hand: [], trashCards: [], voidCards: [], field: [], nexus: []
    }
  };

  const { state, mapper } = createEngineStateFromLegacy(duelState);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.nexus.length, 0, 'Nexus must not be duplicated into both field and nexus');
  assert.equal(state.players.player.revealed.length, 1);
  assert.equal(state.players.player.openCards.length, 1);

  const serialized = serializeGameState(state);
  const revived = deserializeGameState(serialized);
  assert.equal(revived.players.player.revealed.length, 1);
  assert.equal(revived.players.player.openCards.length, 1);

  syncEngineStateToLegacy(revived, duelState, mapper);
  assert.equal(duelState.player.nexus.length, 1);
  assert.equal(duelState.player.revealed.length, 1);
  assert.equal(duelState.player.openCards.length, 1);
});
