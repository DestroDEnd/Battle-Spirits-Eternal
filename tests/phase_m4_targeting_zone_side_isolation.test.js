import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { queryCandidates, validateTargetAvailability, executeTargeting } from '../engine/selectors.js';
import { createInteractionRequest, validateInteractionResponse } from '../engine/interaction.js';
import { createEngineStateFromLegacy, resolveLegacyAbility } from '../engine/legacy_bridge.js';
import { executeOp } from '../engine/ops/index.js';

test('M4-TGT-01: Hand targeting and DISCARD_HAND strictly isolate player hand and unwrap { selected } objects', async () => {
  const game = createGame({ interactive: true, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const p = state.players.player;
  const opp = state.players.opponent;

  const handCard = createCardInstance({ id: 'h_card_1', card_number: 'M4-H1', name: 'Hand Card', type: 'Spirit' }, 'player');
  const deckCard = createCardInstance({ id: 'd_card_1', card_number: 'M4-D1', name: 'Deck Card', type: 'Spirit' }, 'player');
  const graveCard = createCardInstance({ id: 'g_card_1', card_number: 'M4-G1', name: 'Grave Card', type: 'Spirit' }, 'player');
  const oppHandCard = createCardInstance({ id: 'oh_card_1', card_number: 'M4-OH1', name: 'Opp Hand Card', type: 'Spirit' }, 'opponent');

  p.hand.push(handCard);
  p.deck.push(deckCard);
  p.grave.push(graveCard);
  opp.hand.push(oppHandCard);

  const candidates = queryCandidates(state, { zone: 'hand', side: 'self', types: ['Any'] }, { controller: 'player' });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].card.id, handCard.id);
  assert.equal(candidates[0].zone, 'hand');
  assert.equal(candidates[0].side, 'player');

  const promptResolver = {
    async choose(data) {
      assert.equal(data.candidates.length, 1);
      assert.equal(data.candidates[0].zone, 'hand');
      return { accepted: true, selected: [data.candidates[0].candidateId] };
    }
  };

  const res = await executeOp(
    state,
    { op: 'DISCARD_HAND', count: 1, side: 'self' },
    { controller: 'player' },
    promptResolver,
    game.events
  );
  assert.equal(res.success, true);
  assert.equal(res.discardedCount, 1);
  assert.equal(p.hand.length, 0);
  assert.ok(p.grave.some(c => c.id === handCard.id));
  assert.equal(p.deck.length, 1, 'Deck card must remain untouched');
  assert.equal(opp.hand.length, 1, 'Opponent hand must remain untouched');
});

test('M4-TGT-02: Salvage/grave targeting never leaks deck, hand, or stale context.revealedCards', async () => {
  const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const p = state.players.player;

  const graveCard = createCardInstance({ id: 'salv_g1', card_number: 'M4-SG1', name: 'Grave Spirit', type: 'Spirit' }, 'player');
  const deckCard = createCardInstance({ id: 'salv_d1', card_number: 'M4-SD1', name: 'Deck Spirit', type: 'Spirit' }, 'player');
  p.grave.push(graveCard);
  p.deck.push(deckCard);

  // Simulate leftover revealedCards from an earlier ability (e.g., card already in deck)
  const ctx = { controller: 'player', revealedCards: [deckCard] };
  const cands = queryCandidates(state, { zone: 'grave', side: 'self', types: ['Spirit'] }, ctx);
  assert.equal(cands.length, 1);
  assert.equal(cands[0].card.id, graveCard.id);
  assert.equal(cands[0].zone, 'grave');

  const res = await executeOp(state, { op: 'SALVAGE', count: 1, from: 'grave', types: ['Spirit'] }, ctx, null, game.events);
  assert.equal(res.success, true);
  assert.equal(res.salvagedCount ?? res.count ?? res.addedCount, 1);
  assert.ok(p.hand.some(c => c.id === graveCard.id));
  assert.ok(p.deck.some(c => c.id === deckCard.id), 'Deck card must never be salvaged from grave');
});

test('M4-TGT-03: Physical side isolation ignores card.owner on stolen/controlled cards', () => {
  const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  // Borrowed card originally owned by opponent, physically in player hand
  const borrowedCard = createCardInstance({ id: 'borrowed_1', card_number: 'M4-B1', name: 'Borrowed', type: 'Spirit' }, 'opponent');
  state.players.player.hand.push(borrowedCard);

  const playerCands = queryCandidates(state, { zone: 'hand', side: 'self', types: ['Any'] }, { controller: 'player' });
  assert.equal(playerCands.length, 1);
  assert.equal(playerCands[0].side, 'player');

  const oppCands = queryCandidates(state, { zone: 'hand', side: 'opp', types: ['Any'] }, { controller: 'player' });
  assert.equal(oppCands.length, 0, 'Opponent hand must not include card physically in player hand');

  const req = createInteractionRequest({
    type: 'SELECT_CARDS',
    decisionOwner: 'player',
    candidates: playerCands
  });
  assert.equal(req.candidates[0].side, 'player', 'Interaction candidate side must reflect physical side, not card.owner');
  assert.equal(req.candidates[0].zone, 'hand');
});

test('M4-TGT-04: validateInteractionResponse & executeTargeting reject stale/moved targets across all canonical zones', async () => {
  const game = createGame({ interactive: true, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const handCard = createCardInstance({ id: 'stale_h1', card_number: 'M4-SH1', name: 'Moved Hand Card', type: 'Spirit' }, 'player');
  state.players.player.hand.push(handCard);

  const cands = queryCandidates(state, { zone: 'hand', side: 'self', types: ['Any'] }, { controller: 'player' });
  const interaction = createInteractionRequest({
    type: 'SELECT_CARDS',
    decisionOwner: 'player',
    candidates: cands,
    minSelections: 1,
    maxSelections: 1
  });

  // Reject zone mismatch payload
  const mismatchRes = validateInteractionResponse(interaction, {
    selected: [{ candidateId: interaction.candidates[0].candidateId, zone: 'deck', side: 'player' }]
  }, state);
  assert.equal(mismatchRes.valid, false);
  assert.match(mismatchRes.reason, /CANDIDATE_ZONE_MISMATCH/);

  // Move card from hand to grave before response arrives
  state.players.player.hand = [];
  state.players.player.grave.push(handCard);

  const staleRes = validateInteractionResponse(interaction, {
    selected: [interaction.candidates[0].candidateId]
  }, state);
  assert.equal(staleRes.valid, false);
  assert.match(staleRes.reason, /CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE/);

  // Direct executeTargeting revalidation when card is moved during prompt choice
  state.players.player.grave = [];
  state.players.player.hand = [handCard];
  const stalePrompt = {
    async choose(data) {
      // Simulate card leaving hand while prompt is awaiting response
      state.players.player.hand = [];
      state.players.player.grave.push(handCard);
      return [data.candidates[0]];
    }
  };
  const tgtRes = await executeTargeting(state, { zone: 'hand', side: 'self', types: ['Any'], count: 1 }, { controller: 'player' }, stalePrompt);
  assert.equal(tgtRes.success, false);
  assert.equal(tgtRes.reason, 'TARGET_NO_LONGER_IN_ZONE');
});

test('M4-TGT-05: Consecutive resolveAbility calls sharing caller context do not bleed PREVIOUS_TARGET or revealedCards', async () => {
  const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;
  const oppSp = createCardInstance({ id: 'bleed_opp1', card_number: 'M4-BO1', name: 'Opp Target', type: 'Spirit' }, 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSp, { normal: 1, soul: 0 }));

  const sharedCallerContext = { controller: 'player' };
  const ab1 = {
    header: { timing: 'WHEN_SUMMONED' },
    clauses: [{ op: { op: 'DESTROY', target: { side: 'opp', types: ['Spirit'] } } }]
  };
  const r1 = await game.resolver.resolveAbility(state, ab1, sharedCallerContext);
  assert.equal(r1.success, true);
  assert.equal(sharedCallerContext.previousTarget, undefined, 'Caller context must not be mutated with previousTarget');
  assert.equal(sharedCallerContext.selectedTargets, undefined, 'Caller context must not be mutated with selectedTargets');

  // Second ability trying to use PREVIOUS_TARGET with the same caller context must not inherit ab1 target
  const ab2 = {
    header: { timing: 'WHEN_SUMMONED' },
    clauses: [{ op: { op: 'ADD_TO_HAND', target: 'PREVIOUS_TARGET', usePreviousTarget: true } }]
  };
  const r2 = await game.resolver.resolveAbility(state, ab2, sharedCallerContext);
  assert.equal(r2.results[0].addedCount, 0);
});

test('M4-TGT-06: Legacy bridgePrompt preserves candidateId/zone/side when resolving via legacy adapter', async () => {
  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: {
      life: 5, reserveCores: 3, trashCores: 0, voidCores: 10,
      deck: [{ uid: 'leg_d1', id: 'BS01-001', name: 'DeckMon', type: 'Spirit' }],
      hand: [{ uid: 'leg_h1', id: 'BS01-002', name: 'HandMon', type: 'Spirit' }],
      trashCards: [], voidCards: [], field: [], nexus: []
    },
    opponent: {
      life: 5, reserveCores: 3, trashCores: 0, voidCores: 10,
      deck: [], hand: [], trashCards: [], voidCards: [], field: [], nexus: []
    }
  };

  let capturedPrompt = null;
  const ability = {
    header: { timing: 'MAIN' },
    clauses: [{ op: { op: 'DISCARD_HAND', count: 1, side: 'self' } }]
  };
  const res = await resolveLegacyAbility(duelState, duelState.player.hand[0], ability, 'player', {
    promptResolver: {
      async choose(prompt) {
        capturedPrompt = prompt;
        return { accepted: true, selected: [prompt.candidates[0].candidateId] };
      }
    }
  });
  assert.equal(res.success, true);
  assert.equal(capturedPrompt.candidates.length, 1);
  assert.equal(capturedPrompt.candidates[0].zone, 'hand');
  assert.equal(capturedPrompt.candidates[0].side, 'player');
  assert.equal(duelState.player.hand.length, 0);
  assert.equal(duelState.player.trashCards.length, 1);
  assert.equal(duelState.player.deck.length, 1);
});
