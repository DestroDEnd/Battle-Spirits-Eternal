/**
 * tests/m2_core_ops.test.js
 * 
 * Milestone 2 Core Primitive Operations Test Suite:
 * - Search & Decktop: REVEAL_DECKTOP, ADD_TO_HAND, DISCARD_REVEALED, RETURN_REVEALED_BOTTOM
 * - Multi-Zone Summoning & Deployment: SUMMON, SUMMON_THIS_CARD, DEPLOY_NEXUS, SUMMON_RESERVE_ONLY
 * - Life Operations: RECOVER_LIFE, PREVENT_LIFE_LOSS
 * - Hand & Burst Manipulation: SALVAGE, DISCARD_BURST
 * - Filter Matching: matchesCardFilter
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, createCardInstance } from '../engine/state.js';
import { EventBus } from '../engine/events.js';
import { executeOp, matchesCardFilter } from '../engine/ops/index.js';
import { createGame } from '../engine/index.js';
import { moveCard } from '../engine/zones.js';

describe('Milestone 2 Core Operations Suite', () => {

  const dummyPromptResolver = {
    async choose(req) {
      if (req.candidates && req.candidates.length > 0) {
        return req.candidates.slice(0, req.count || 1);
      }
      return [];
    }
  };

  test('M2.1 - REVEAL_DECKTOP reveals cards from deck to revealed array and emits event', async () => {
    const deck = [
      createCardInstance({ card_number: 'C01', name: 'Card 1', type: 'Spirit', cost: 3 }),
      createCardInstance({ card_number: 'C02', name: 'Card 2', type: 'Magic', cost: 4 }),
      createCardInstance({ card_number: 'C03', name: 'Card 3', type: 'Nexus', cost: 2 }),
      createCardInstance({ card_number: 'C04', name: 'Card 4', type: 'Spirit', cost: 5 })
    ];
    const state = createGameState(deck, []);
    const events = new EventBus();
    const emittedEvents = [];
    events.on('CARDS_REVEALED', async (ev) => emittedEvents.push(ev));

    const op = { op: 'REVEAL_DECKTOP', count: 3 };
    const context = { controller: 'player' };

    const res = await executeOp(state, op, context, dummyPromptResolver, events);
    assert.equal(res.success, true);
    assert.equal(res.count, 3);
    assert.equal(state.players.player.deck.length, 1);
    assert.equal(state.players.player.deck[0].cardNumber, 'C04');
    assert.equal(state.players.player.revealed.length, 3);
    assert.equal(context.revealedCards.length, 3);
    assert.equal(emittedEvents.length, 1);
    assert.equal(emittedEvents[0].count, 3);
  });

  test('M2.2 - ADD_TO_HAND adds matching revealed card to hand and cleans revealed', async () => {
    const c1 = createCardInstance({ card_number: 'C01', name: 'Flame Dragon', type: 'Spirit', color: 'Red', cost: 3 });
    const c2 = createCardInstance({ card_number: 'C02', name: 'Holy Elixir', type: 'Magic', color: 'Yellow', cost: 1 });
    const state = createGameState([], []);
    state.players.player.revealed = [c1, c2];
    const context = { controller: 'player', revealedCards: [c1, c2] };

    const op = {
      op: 'ADD_TO_HAND',
      count: 1,
      filter: { types: ['Spirit'], color: 'Red' }
    };

    const res = await executeOp(state, op, context, dummyPromptResolver);
    assert.equal(res.success, true);
    assert.equal(res.addedCount, 1);
    assert.equal(state.players.player.hand.length, 1);
    assert.equal(state.players.player.hand[0].cardNumber, 'C01');
    assert.equal(state.players.player.revealed.length, 1);
    assert.equal(state.players.player.revealed[0].cardNumber, 'C02');
  });

  test('M2.3 - DISCARD_REVEALED sends all unchosen revealed cards to grave', async () => {
    const c1 = createCardInstance({ card_number: 'C01', name: 'Card 1', type: 'Spirit' });
    const c2 = createCardInstance({ card_number: 'C02', name: 'Card 2', type: 'Nexus' });
    const state = createGameState([], []);
    state.players.player.revealed = [c1, c2];
    const context = { controller: 'player', revealedCards: [c1, c2] };

    const op = { op: 'DISCARD_REVEALED' };
    const res = await executeOp(state, op, context, dummyPromptResolver);

    assert.equal(res.success, true);
    assert.equal(res.count, 2);
    assert.equal(state.players.player.grave.length, 2);
    assert.equal(state.players.player.revealed.length, 0);
    assert.equal(context.revealedCards.length, 0);
  });

  test('M2.4 - RETURN_REVEALED_BOTTOM returns cards to bottom of deck', async () => {
    const existing = createCardInstance({ card_number: 'EXISTING', name: 'Deck Bottom Existing', type: 'Spirit' });
    const c1 = createCardInstance({ card_number: 'C01', name: 'Card 1', type: 'Spirit' });
    const c2 = createCardInstance({ card_number: 'C02', name: 'Card 2', type: 'Magic' });
    const state = createGameState([existing], []);
    state.players.player.revealed = [c1, c2];
    const context = { controller: 'player', revealedCards: [c1, c2] };

    const op = { op: 'RETURN_REVEALED_BOTTOM' };
    const res = await executeOp(state, op, context, dummyPromptResolver);

    assert.equal(res.success, true);
    assert.equal(res.count, 2);
    assert.equal(state.players.player.deck.length, 3);
    assert.equal(state.players.player.deck[0].cardNumber, 'EXISTING');
    assert.equal(state.players.player.deck[1].cardNumber, 'C01');
    assert.equal(state.players.player.deck[2].cardNumber, 'C02');
    assert.equal(state.players.player.revealed.length, 0);
  });

  test('M2.5 - SUMMON creates field stack, moves LV1 core from reserve, and emits SUMMONED', async () => {
    const spiritCard = createCardInstance({ card_number: 'BS01-001', name: 'Test Spirit', type: 'Spirit', cost: 2 });
    const state = createGameState([], []);
    state.players.player.hand = [spiritCard];
    state.players.player.reserve.normal = 3;
    const events = new EventBus();
    const summonedEvents = [];
    events.on('SUMMONED', async (ev) => summonedEvents.push(ev));

    const op = { op: 'SUMMON', free: true };
    const context = { controller: 'player' };

    const res = await executeOp(state, op, context, dummyPromptResolver, events);
    assert.equal(res.success, true);
    assert.equal(state.players.player.field.length, 1);
    const stack = state.players.player.field[0];
    assert.equal(stack.top.cardNumber, 'BS01-001');
    assert.equal(stack.cores.normal, 1);
    assert.equal(state.players.player.reserve.normal, 2);
    assert.equal(state.players.player.hand.length, 0);
    assert.equal(summonedEvents.length, 1);
    assert.equal(summonedEvents[0].card.cardNumber, 'BS01-001');
  });

  test('M2.6 - SUMMON_THIS_CARD summons the source card itself', async () => {
    const sourceCard = createCardInstance({ card_number: 'SD01-001', name: 'Partner Spirit', type: 'Spirit', cost: 1 });
    const state = createGameState([], []);
    state.players.player.hand = [sourceCard];
    state.players.player.reserve.normal = 2;

    const op = { op: 'SUMMON_THIS_CARD' };
    const context = { controller: 'player', sourceCard };

    const res = await executeOp(state, op, context, dummyPromptResolver);
    assert.equal(res.success, true);
    assert.equal(state.players.player.field.length, 1);
    assert.equal(state.players.player.field[0].top.cardNumber, 'SD01-001');
    assert.equal(state.players.player.hand.length, 0);
  });

  test('M2.7 - DEPLOY_NEXUS deploys Nexus card to field and nexus lists with 0 core base', async () => {
    const nexusCard = createCardInstance({ card_number: 'BS01-090', name: 'Temple of Dawn', type: 'Nexus', cost: 3 });
    const state = createGameState([], []);
    state.players.player.hand = [nexusCard];
    const events = new EventBus();
    const deployEvents = [];
    events.on('DEPLOYED', async (ev) => deployEvents.push(ev));

    const op = { op: 'DEPLOY_NEXUS', free: true };
    const context = { controller: 'player' };

    const res = await executeOp(state, op, context, dummyPromptResolver, events);
    assert.equal(res.success, true);
    assert.equal(state.players.player.field.length, 1);
    assert.equal(state.players.player.nexus.length, 1);
    assert.equal(state.players.player.field[0].top.cardNumber, 'BS01-090');
    assert.equal(state.players.player.field[0].cores.normal, 0);
    assert.equal(state.players.player.hand.length, 0);
    assert.equal(deployEvents.length, 1);
  });

  test('M2.8 - SUMMON_RESERVE_ONLY strictly requires cores from reserve', async () => {
    const spiritCard = createCardInstance({ card_number: 'SD35-001', name: 'Reserve Spirit', type: 'Spirit', cost: 2 });
    const state = createGameState([], []);
    state.players.player.hand = [spiritCard];
    state.players.player.reserve.normal = 0;
    state.players.player.reserve.soul = 0;

    const op = { op: 'SUMMON_RESERVE_ONLY' };
    const context = { controller: 'player', sourceCard: spiritCard };

    // Should fail when reserve is empty
    const failRes = await executeOp(state, op, context, dummyPromptResolver);
    assert.equal(failRes.success, false);
    assert.equal(failRes.reason, 'NO_RESERVE_CORES');

    // Supply reserve core and retry
    state.players.player.reserve.normal = 1;
    const okRes = await executeOp(state, op, context, dummyPromptResolver);
    assert.equal(okRes.success, true);
    assert.equal(state.players.player.field.length, 1);
    assert.equal(state.players.player.reserve.normal, 0);
  });

  test('M2.9 - RECOVER_LIFE moves core from void to life and emits LIFE_RECOVERED', async () => {
    const state = createGameState([], []);
    state.players.player.life = 3;
    const events = new EventBus();
    const lifeEvents = [];
    events.on('LIFE_RECOVERED', async (ev) => lifeEvents.push(ev));

    const op = { op: 'RECOVER_LIFE', count: 1 };
    const context = { controller: 'player' };

    const res = await executeOp(state, op, context, dummyPromptResolver, events);
    assert.equal(res.success, true);
    assert.equal(res.recoveredCount, 1);
    assert.equal(state.players.player.life, 4);
    assert.equal(lifeEvents.length, 1);
    assert.equal(lifeEvents[0].recovered, 1);
  });

  test('M2.10 - PREVENT_LIFE_LOSS blocks combat damage and effect life reduction', async () => {
    const game = createGame();
    const state = game.state;
    state.players.opponent.life = 4;
    state.combat = { attacker: 'player', target: 'opponent' };

    // Register PREVENT_LIFE_LOSS for opponent
    const op = { op: 'PREVENT_LIFE_LOSS', duration: 'THIS_TURN', side: 'opp' };
    const res = await executeOp(state, op, { controller: 'player' }, dummyPromptResolver);
    assert.equal(res.success, true);

    // Direct hit in combat should be prevented
    const hitRes = await game.resolveDirectHit('player');
    assert.equal(hitRes.success, true);
    assert.equal(hitRes.prevented, true);
    assert.equal(state.players.opponent.life, 4); // Life preserved!
  });

  test('M2.11 - SALVAGE retrieves matching card from grave into hand', async () => {
    const spell = createCardInstance({ card_number: 'BS01-114', name: 'Buster Spear', type: 'Magic', color: 'Red' });
    const spirit = createCardInstance({ card_number: 'BS01-002', name: 'Gark', type: 'Spirit', color: 'Red' });
    const state = createGameState([], []);
    state.players.player.grave = [spell, spirit];

    const op = {
      op: 'SALVAGE',
      cardType: 'Magic',
      count: 1
    };
    const context = { controller: 'player' };

    const res = await executeOp(state, op, context, dummyPromptResolver);
    assert.equal(res.success, true);
    assert.equal(res.count, 1);
    assert.equal(state.players.player.hand.length, 1);
    assert.equal(state.players.player.hand[0].cardNumber, 'BS01-114');
    assert.equal(state.players.player.grave.length, 1);
    assert.equal(state.players.player.grave[0].cardNumber, 'BS01-002');
  });

  test('M2.12 - DISCARD_BURST discards opposing set burst card to grave', async () => {
    const burstCard = createCardInstance({ card_number: 'BS14-X01', name: 'Sieg-Yamato-Fried', type: 'Spirit' });
    const state = createGameState([], []);
    state.players.opponent.burst = burstCard;
    const events = new EventBus();
    const burstEvents = [];
    events.on('BURST_DISCARDED', async (ev) => burstEvents.push(ev));

    const op = { op: 'DISCARD_BURST', side: 'opp' };
    const context = { controller: 'player' };

    const res = await executeOp(state, op, context, dummyPromptResolver, events);
    assert.equal(res.success, true);
    assert.equal(state.players.opponent.burst, null);
    assert.equal(state.players.opponent.grave.length, 1);
    assert.equal(state.players.opponent.grave[0].cardNumber, 'BS14-X01');
    assert.equal(burstEvents.length, 1);
    assert.equal(burstEvents[0].player, 'opponent');
  });

  test('M2.13 - matchesCardFilter evaluates types, colors, single-color, and families accurately', () => {
    const card = {
      type: 'Grandwalker Nexus',
      colors: ['Yellow'],
      family: 'Olymp',
      families: ['Olymp', 'Song Bird'],
      cost: 2,
      name: 'Grandwalker Lilia'
    };

    assert.equal(matchesCardFilter(card, { types: ['Nexus'] }), true);
    assert.equal(matchesCardFilter(card, { types: ['Spirit'] }), false);
    assert.equal(matchesCardFilter(card, { color: 'Yellow' }), true);
    assert.equal(matchesCardFilter(card, { color: 'Red' }), false);
    assert.equal(matchesCardFilter(card, { singleColorOnly: true }), true);
    assert.equal(matchesCardFilter(card, { family: 'Olymp' }), true);
    assert.equal(matchesCardFilter(card, { family: 'Dragon' }), false);
    assert.equal(matchesCardFilter(card, { costLte: 3 }), true);
    assert.equal(matchesCardFilter(card, { costLte: 1 }), false);
  });
});
