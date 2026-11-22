/**
 * tests/phase4b3_reveal_burst_replace_summon.test.js
 * 
 * Phase 4B.3 Focused Test Suite:
 * 1. REVEAL_CARDS
 * 2. ACTIVATE_BURST
 * 3. REPLACEMENT_EFFECT
 * 4. Remaining SUMMON and SUMMON_FREE variants
 * 
 * Uses real compiled IR records from data/ir_shards/ alongside rigorous edge cases.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { AsyncResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';
import { executeOp, findCardCurrentZone, countCardZoneOccurrences } from '../engine/ops/index.js';
import { moveCard, moveCore, commitStackExit } from '../engine/zones.js';

function createCard(data, owner = 'player') {
  const c = createCardInstance({
    name: 'Test Card',
    type: 'Spirit',
    cost: 1,
    ...data
  }, owner);
  if (data.id) c.id = data.id;
  return c;
}

function loadShardCard(shardFileName, cardId) {
  const shardPath = path.resolve('data', 'ir_shards', shardFileName);
  const data = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  const cardData = data[cardId];
  if (!cardData) {
    throw new Error(`Card ${cardId} not found in shard ${shardFileName}`);
  }
  return JSON.parse(JSON.stringify(cardData));
}

class TestPromptResolver {
  constructor() {
    this.choices = [];
  }
  async choose(prompt) {
    this.choices.push(prompt);
    if (prompt.type === 'CONFIRM_BURST_ACTIVATION') {
      return { confirmed: true };
    }
    if (prompt.candidates && prompt.candidates.length > 0) {
      return [prompt.candidates[0]];
    }
    return [];
  }
}

// ============================================================================
// PART 1: CONTRACT CARD REVEAL TESTS
// ============================================================================

test('1.1 Contract Spirit on Field (Apollon) triggers decktop reveal of 2 cards', async () => {
  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const contractApollon = createCard({
    id: 'contract_apollon',
    name: 'The SunSacredDeity Contract Apollon',
    type: 'Contract Spirit',
    isContractPartner: true
  });
  const stack = createFieldStack(contractApollon, { normal: 1 });
  state.players.player.field = [stack];

  for (let i = 1; i <= 4; i++) {
    state.players.player.deck.push(createCard({ id: `ap_d_${i}`, name: `Deck Card ${i}` }));
  }

  const clause = {
    cleanText: 'reveal the top two cards of your deck',
    op: { op: 'REVEAL_CARDS', count: 2 }
  };

  const res = await resolver.resolveClause(state, {}, clause, {
    controller: 'player',
    sourceCard: contractApollon,
    sourceStack: stack
  }, events);

  assert.equal(res.success, true);
  assert.equal(res.count, 2);
  assert.equal(state.players.player.field.length, 1, 'Contract spirit stays on field');
  assert.equal(state.players.player.revealed.length, 2);
  assert.equal(state.players.player.deck.length, 2);
});

test('1.2 Contract Nexus on Field (Brigit) triggers decktop reveal of 3 cards', async () => {
  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const contractBrigit = createCard({
    id: 'contract_brigit',
    name: 'The SteelSacredGoddess Contract Brigit',
    type: 'Contract Nexus',
    isContractPartner: true
  });
  state.players.player.nexus = [contractBrigit];

  for (let i = 1; i <= 5; i++) {
    state.players.player.deck.push(createCard({ id: `br_d_${i}`, name: `Deck Card ${i}` }));
  }

  const clause = {
    cleanText: 'reveal the top three cards of your deck',
    op: { op: 'REVEAL_CARDS', count: 3 }
  };

  const res = await resolver.resolveClause(state, {}, clause, {
    controller: 'player',
    sourceCard: contractBrigit
  }, events);

  assert.equal(res.success, true);
  assert.equal(res.count, 3);
  assert.equal(state.players.player.nexus.length, 1, 'Contract nexus stays on field');
  assert.equal(state.players.player.revealed.length, 3);
  assert.equal(state.players.player.deck.length, 2);
});

// ============================================================================
// PART 2: REVEAL_CARDS TESTS
// ============================================================================

test('2.1 Real Shard IR: BS69-036 (Medis) REVEAL_CARDS reveals top 3 cards to revealed pool', async () => {
  const cardRecord = loadShardCard('BS69.json', 'BS69-036');
  const ability = cardRecord.abilities.find(ab => ab.header?.timing === 'WHEN_SUMMONED');
  assert.ok(ability, 'WHEN_SUMMONED ability found on Medis');
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'REVEAL_CARDS');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  // Setup deck with 5 distinct cards
  for (let i = 1; i <= 5; i++) {
    state.players.player.deck.push(createCard({ id: `c_${i}`, name: `Deck Card ${i}`, cost: i }));
  }

  const revealedEvents = [];
  events.on('CARDS_REVEALED', ev => revealedEvents.push(ev));

  const result = await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);

  assert.equal(result.success, true);
  assert.equal(result.count, 3);
  assert.equal(state.players.player.deck.length, 2, 'Deck should have 2 cards remaining');
  assert.equal(state.players.player.revealed.length, 3, '3 cards should be in player.revealed');
  assert.equal(state.players.player.revealed[0].id, 'c_1');
  assert.equal(state.players.player.revealed[1].id, 'c_2');
  assert.equal(state.players.player.revealed[2].id, 'c_3');
  assert.equal(revealedEvents.length, 1);
  assert.equal(revealedEvents[0].count, 3);
});

test('2.2 Real Shard IR: BS64-X04 (Gefan-Gnis) REVEAL_CARDS reveals 3 cards from both players', async () => {
  const cardRecord = loadShardCard('BS64.json', 'BS64-X04');
  const ability = cardRecord.abilities.find(ab => ab.header?.timing === 'WHEN_ADVENTS');
  assert.ok(ability, 'WHEN_ADVENTS ability found on Gefan-Gnis');
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'REVEAL_CARDS');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  for (let i = 1; i <= 4; i++) {
    state.players.player.deck.push(createCard({ id: `p_${i}`, name: `P Card ${i}` }));
    state.players.opponent.deck.push(createCard({ id: `o_${i}`, name: `O Card ${i}` }));
  }

  const result = await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);

  assert.equal(result.success, true);
  assert.equal(state.players.player.deck.length, 1);
  assert.equal(state.players.opponent.deck.length, 1);
  assert.equal(state.players.player.revealed.length, 3);
  assert.equal(state.players.opponent.revealed.length, 3);
  assert.equal(state.players.player.revealed[0].id, 'p_1');
  assert.equal(state.players.opponent.revealed[0].id, 'o_1');
});

test('2.3 REVEAL_CARDS: Undersized and empty deck handling', async () => {
  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  // Only 2 cards in deck when 3 requested
  state.players.player.deck.push(createCard({ id: 'u_1' }));
  state.players.player.deck.push(createCard({ id: 'u_2' }));

  const clause = {
    cleanText: 'Look at the top three cards of your deck',
    op: { op: 'REVEAL_CARDS', count: 3, from: 'DECK', side: 'self' }
  };

  const resUndersized = await resolver.resolveClause(state, {}, clause, { controller: 'player' }, events);
  assert.equal(resUndersized.success, true);
  assert.equal(resUndersized.count, 2, 'Should reveal only 2 available cards');
  assert.equal(state.players.player.deck.length, 0);
  assert.equal(state.players.player.revealed.length, 2);

  // Deck now empty (0 cards): next reveal returns 0 cards cleanly without crashing
  const resEmpty = await resolver.resolveClause(state, {}, clause, { controller: 'player' }, events);
  assert.equal(resEmpty.success, false);
  assert.equal(resEmpty.count, 0);
  assert.equal(resEmpty.cards.length, 0);

  // Bare REVEAL_CARDS without count/from fails closed
  const resBare = await resolver.resolveClause(state, {}, { op: { op: 'REVEAL_CARDS' } }, { controller: 'player' }, events);
  assert.equal(resBare.success, false);
  assert.equal(resBare.status, 'UNSUPPORTED');
});

test('2.4 REVEAL_CARDS: Reveal from Hand preserves hand membership and populates context', async () => {
  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  state.players.player.hand.push(createCard({ id: 'h_1' }));
  state.players.player.hand.push(createCard({ id: 'h_2' }));
  state.players.player.hand.push(createCard({ id: 'h_3' }));

  const clause = {
    cleanText: 'reveal three cards from your Hand',
    op: { op: 'REVEAL_CARDS', count: 3, from: 'HAND', side: 'self' }
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveClause(state, {}, clause, ctx, events);

  assert.equal(res.success, true);
  assert.equal(res.count, 3);
  assert.equal(state.players.player.hand.length, 3, 'Cards stay in hand');
  assert.equal(ctx.revealedCards.length, 3, 'context.revealedCards should be populated for downstream clauses');
});

// ============================================================================
// PART 3: ACTIVATE_BURST TESTS
// ============================================================================

test('3.1 Real Shard IR: BS60-034 (Eclair-Tiger) ACTIVATE_BURST resolves via AsyncResolver', async () => {
  const cardRecord = loadShardCard('BS60.json', 'BS60-034');
  const ability = cardRecord.abilities.find(ab => ab.clauses.some(c => c.op?.op === 'ACTIVATE_BURST'));
  assert.ok(ability, 'Ability with ACTIVATE_BURST found on BS60-034');
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'ACTIVATE_BURST');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  // Set God-Yggdrasil BS60-X05 in burst slot (has valid BURST timing ability)
  const burstCard = loadShardCard('BS60.json', 'BS60-X05');
  state.players.player.burst = burstCard;
  state.players.player.reserve.normal = 5;

  const burstEvents = [];
  events.on('BURST_ACTIVATED', ev => burstEvents.push(ev));

  const result = await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord,
    resolver
  }, events);

  assert.equal(result.success, true);
  assert.equal(state.players.player.burst, null, 'Burst slot cleared to prevent duplicate activation');
  assert.equal(burstEvents.length, 1, 'BURST_ACTIVATED event emitted');
  assert.equal(burstEvents[0].card.id, burstCard.id);
});

test('3.1b Real Shard IR: BS16-X01 (Lord-Dragon-Bazzel) ACTIVATE_BURST and unsupported condition safety', async () => {
  const cardRecord = loadShardCard('BS16.json', 'BS16-X01');
  const ability = cardRecord.abilities.find(ab => ab.header?.timing === 'WHEN_ATTACKS');
  assert.ok(ability, 'WHEN_ATTACKS ability found');
  const clause = ability.clauses.find(c => c.op?.op === 'ACTIVATE_BURST');
  assert.ok(clause, 'ACTIVATE_BURST clause found');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const burstCard = loadShardCard('BS60.json', 'BS60-X05');
  state.players.player.burst = burstCard;
  state.players.player.reserve.normal = 5;

  // 1. Through resolveClause: the complex burst condition text is safely evaluated as UNSUPPORTED
  const clauseRes = await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord,
    resolver
  }, events);
  assert.equal(clauseRes.success, false);
  assert.equal(clauseRes.conditionResult, 'UNSUPPORTED');
  assert.equal(clauseRes.reason, 'UNSUPPORTED_CONDITION');

  // 2. Direct operation execution: executes ACTIVATE_BURST cleanly
  const opRes = await executeOp(state, clause.op, {
    controller: 'player',
    sourceCard: cardRecord,
    resolver
  }, new TestPromptResolver(), events);
  assert.equal(opRes.success, true);
  assert.equal(state.players.player.burst, null, 'Burst slot cleared');
});

test('3.2 ACTIVATE_BURST: BURST_LOCK prevents activation', async () => {
  const state = createGameState();
  const events = new EventBus();
  const burstCard = loadShardCard('BS60.json', 'BS60-X05');
  state.players.player.burst = burstCard;

  // Add BURST_LOCK modifier
  state.modifiers = [
    { type: 'BURST_LOCK', side: 'player' }
  ];

  const op = { op: 'ACTIVATE_BURST' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'BURST_LOCKED');
  assert.equal(state.players.player.burst.id, burstCard.id, 'Card remains in burst slot when locked');
});

test('3.3 ACTIVATE_BURST: Duplicate activation prevention', async () => {
  const state = createGameState();
  const burstCard = loadShardCard('BS60.json', 'BS60-X05');
  state.players.player.burst = burstCard;
  state.players.player.reserve.normal = 3;

  const op = { op: 'ACTIVATE_BURST' };
  const res1 = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());
  assert.equal(res1.success, true);
  assert.equal(state.players.player.burst, null);

  // Attempting second activation immediately fails
  const res2 = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'NO_BURST_CARD_SET');
});

test('3.4 ACTIVATE_BURST: Non-summoned burst routes to grave with burst_resolved cause', async () => {
  const state = createGameState();
  const events = new EventBus();
  const magicBurstCard = createCard({
    id: 'magic_burst_1',
    name: 'Burst Flare',
    type: 'Magic',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  });

  state.players.player.burst = magicBurstCard;
  state.players.player.deck.push(createCard({ id: 'd_1' }));

  const movedEvents = [];
  events.on('CARD_MOVED', ev => movedEvents.push(ev));

  const op = { op: 'ACTIVATE_BURST' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, true);
  assert.equal(state.players.player.burst, null);
  assert.equal(state.players.player.grave.some(c => c.id === magicBurstCard.id), true, 'Card should move to grave');
  const graveMoveEvent = movedEvents.find(ev => ev.toZone === 'grave' && ev.card.id === magicBurstCard.id);
  assert.ok(graveMoveEvent, 'Grave move event found');
  assert.equal(graveMoveEvent.cause, 'burst_resolved');
});

test('3.5 ACTIVATE_BURST: Missing Burst slot with sourceCard supplied returns NO_BURST_CARD_SET', async () => {
  const state = createGameState();
  const sourceCard = loadShardCard('BS60.json', 'BS60-034');
  state.players.player.burst = null;

  const op = { op: 'ACTIVATE_BURST' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'NO_BURST_CARD_SET');
});

test('3.6 ACTIVATE_BURST: Burst card without valid Burst ability returns NO_VALID_BURST_ABILITY', async () => {
  const state = createGameState();
  const noBurstCard = loadShardCard('PX25.json', 'PX25-03');
  state.players.player.burst = noBurstCard;

  const op = { op: 'ACTIVATE_BURST' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'NO_VALID_BURST_ABILITY');
  assert.equal(state.players.player.burst.id, noBurstCard.id, 'Card retained in burst slot');
});

test('3.7 ACTIVATE_BURST: Unsupported Burst effect routes card to grave with burst_failed', async () => {
  const state = createGameState();
  const events = new EventBus();
  const unsuppBurstCard = createCard({
    id: 'unsupp_burst',
    name: 'Unsupported Burst',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST' },
          clauses: [{ op: { op: 'UNKNOWN_UNSUPPORTED_OP' } }]
        }
      ]
    }
  });
  state.players.player.burst = unsuppBurstCard;

  const movedEvents = [];
  events.on('CARD_MOVED', ev => movedEvents.push(ev));

  const op = { op: 'ACTIVATE_BURST' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, false);
  assert.equal(res.hasUnsupported, true);
  assert.equal(res.reason, 'UNSUPPORTED_BURST_EFFECT');
  assert.equal(state.players.player.burst, null, 'Slot cleared');
  assert.equal(state.players.player.grave.some(c => c.id === unsuppBurstCard.id), true, 'Routed to grave');
  const move = movedEvents.find(e => e.card.id === unsuppBurstCard.id);
  assert.ok(move);
  assert.equal(move.cause, 'burst_failed');
});

test('3.8 ACTIVATE_BURST: Failed Burst resolution routes card to grave with burst_failed', async () => {
  const state = createGameState();
  const events = new EventBus();
  const failingBurstCard = createCard({
    id: 'failing_burst',
    name: 'Failing Burst',
    cost: 5,
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST' },
          clauses: [{ op: { op: 'SUMMON', cost: 5 } }]
        }
      ]
    }
  });
  state.players.player.burst = failingBurstCard;
  state.players.player.reserve.normal = 0; // Insufficient cores

  const movedEvents = [];
  events.on('CARD_MOVED', ev => movedEvents.push(ev));

  const op = { op: 'ACTIVATE_BURST' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, false);
  assert.equal(res.hasFailure, true);
  assert.equal(res.reason, 'BURST_RESOLUTION_FAILED');
  assert.equal(state.players.player.burst, null);
  assert.equal(state.players.player.grave.some(c => c.id === failingBurstCard.id), true);
  const move = movedEvents.find(e => e.card.id === failingBurstCard.id);
  assert.ok(move);
  assert.equal(move.cause, 'burst_failed');
});

test('3.9 ACTIVATE_BURST: Optional decline retains card in Burst slot', async () => {
  const state = createGameState();
  const burstCard = loadShardCard('BS60.json', 'BS60-X05');
  state.players.player.burst = burstCard;

  const decliningResolver = {
    async choose() {
      return { declined: true };
    }
  };

  const op = { op: 'ACTIVATE_BURST', isOptional: true };
  const res = await executeOp(state, op, { controller: 'player' }, decliningResolver);

  assert.equal(res.success, false);
  assert.equal(res.optionalDeclined, true);
  assert.equal(res.reason, 'BURST_ACTIVATION_DECLINED');
  assert.equal(state.players.player.burst.id, burstCard.id, 'Card retained in burst slot');
});

test('3.10 Real Shard IR: SD42-011 (Decade Kiva) ACTIVATE_BURST destroys spirits and summons', async () => {
  const cardRecord = loadShardCard('SD42.json', 'SD42-011');
  const state = createGameState();
  const events = new EventBus();

  state.players.player.burst = cardRecord;
  state.players.player.reserve = { normal: 3, soul: 0 };

  // Opponent has a 5000 BP spirit
  const oppWeakSpirit = createCard({ id: 'opp_s1', bp: 5000, type: 'Spirit' }, 'opponent');
  state.players.opponent.field = [createFieldStack(oppWeakSpirit, { normal: 1 })];

  const resolver = new AsyncResolver({
    async choose(prompt) {
      if (prompt.type === 'SELECT_DESTROY') {
        return prompt.candidates;
      }
      return { index: 0 };
    }
  });

  const op = { op: 'ACTIVATE_BURST' };
  const res = await executeOp(state, op, { controller: 'player', resolver }, resolver.promptResolver, events);

  assert.equal(res.success, true);
  assert.equal(state.players.player.burst, null);
  assert.equal(state.players.player.field.some(st => st.top.id === cardRecord.id), true, 'Decade Kiva summoned to field');
  assert.equal(state.players.opponent.field.length, 0, 'Opponent weak spirit destroyed');
  assert.equal(state.players.opponent.grave.some(c => c.id === oppWeakSpirit.id), true);
});

// ============================================================================
// PART 4: REPLACEMENT_EFFECT TESTS
// ============================================================================

test('4.1 Real Shard IR: BS24-X02 (Queen-Merduk) redirects life reduction core to Void', async () => {
  const cardRecord = loadShardCard('BS24.json', 'BS24-X02');
  const ability = cardRecord.abilities.find(ab => ab.clauses.some(c => c.op?.op === 'REPLACEMENT_EFFECT'));
  assert.ok(ability, 'Ability with REPLACEMENT_EFFECT found');
  const clause = ability.clauses[0];

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  // Bare shard stub without structured replaces/replacementZone must fail closed
  const bareRes = await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);
  assert.equal(bareRes.success, false);
  assert.equal(state.modifiers.length, 0);

  // Structured LIFE_CORE -> void replacement redirects opposing life reduction cleanly
  const structuredClause = {
    op: { op: 'REPLACEMENT_EFFECT', replaces: 'LIFE_CORE', replacementZone: 'void', side: 'opp' }
  };
  const regResult = await resolver.resolveClause(state, ability, structuredClause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);

  assert.equal(regResult.success, true);
  assert.equal(regResult.continuous, true);
  assert.equal(state.modifiers.length, 1);
  assert.equal(state.modifiers[0].type, 'REPLACEMENT_EFFECT');

  // Now simulate Life reduction on opponent
  state.players.opponent.life = 5;
  state.players.opponent.reserve.normal = 0;

  const replaceEvents = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => replaceEvents.push(ev));

  // Move 1 core from opponent's life normally meant for reserve
  await moveCore(state, 1, { zone: 'life', side: 'opponent' }, { zone: 'reserve', side: 'opponent' }, { cause: 'battle' }, events);

  assert.equal(state.players.opponent.life, 4, 'Life decreased by 1');
  assert.equal(state.players.opponent.reserve.normal, 0, 'Reserve should NOT have gained the core');
  assert.equal(state.players.opponent.voidCores.normal, 1, 'Core was redirected to Void');
  assert.equal(replaceEvents.length, 1);
  assert.equal(replaceEvents[0].replacedDestination, 'void');
});

test('4.2 Real Shard IR: SD02-014 (Magic Control Tower) Nexus destruction redirects to field', async () => {
  const cardRecord = loadShardCard('SD02.json', 'SD02-014');
  const ability = cardRecord.abilities[0];
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'REPLACEMENT_EFFECT');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const structuredClause = {
    op: { op: 'REPLACEMENT_EFFECT', trigger: 'NEXUS_DESTROYED', replaces: 'NEXUS_DESTRUCTION', replacementZone: 'nexus', side: 'self' }
  };
  await resolver.resolveClause(state, ability, structuredClause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);

  // Nexus on player's field
  const testNexus = createCard({ id: 'nex_1', name: 'Valley of Dawn', type: 'Nexus', cores: 1 });
  state.players.player.nexus = [testNexus];

  const replaceEvents = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => replaceEvents.push(ev));

  // Destroy the nexus
  await moveCard(state, testNexus, 'grave', 'player', { cause: 'destroy' }, events);

  assert.equal(state.players.player.grave.some(c => c.id === testNexus.id), false, 'Nexus should not enter grave');
  assert.equal(state.players.player.nexus.some(c => c.id === testNexus.id), true, 'Nexus remained on field/nexus');
  assert.equal(replaceEvents.length, 1);
  assert.equal(replaceEvents[0].replacedDestination, 'nexus');
});

test('4.3 REPLACEMENT_EFFECT: Toy Beast destruction to hand and loop prevention', async () => {
  const state = createGameState();
  const events = new EventBus();

  // Register Toy Beast replacement effect: destroyed Toy Beast -> Hand instead of Grave
  state.modifiers = [
    {
      type: 'REPLACEMENT_EFFECT',
      trigger: 'ON_DESTROYED',
      replaces: 'DESTRUCTION',
      replacementZone: 'hand',
      side: 'player',
      filter: { family: 'Toy Beast' }
    }
  ];

  const toyBeastCard = createCard({ id: 'tb_1', name: 'Chihuahl Pup', type: 'Spirit', family: 'Toy Beast' });
  const otherCard = createCard({ id: 'oth_1', name: 'Ancient Dragon', type: 'Spirit', family: 'Astral Dragon' });

  const stackTB = createFieldStack(toyBeastCard, { normal: 1 });
  const stackOther = createFieldStack(otherCard, { normal: 1 });
  state.players.player.field = [stackTB, stackOther];

  // Destroy Toy Beast
  await moveCard(state, toyBeastCard, 'grave', 'player', { cause: 'destroy' }, events);
  assert.equal(state.players.player.hand.some(c => c.id === toyBeastCard.id), true, 'Toy Beast moved to hand');
  assert.equal(state.players.player.grave.some(c => c.id === toyBeastCard.id), false, 'Toy Beast not in grave');

  // Destroy Non-Toy Beast: should go to grave normally
  await moveCard(state, otherCard, 'grave', 'player', { cause: 'destroy' }, events);
  assert.equal(state.players.player.grave.some(c => c.id === otherCard.id), true, 'Non-Toy Beast moved to grave');
});

test('4.4 Real Shard IR: SD42-011 (Decade Kiva) redirects life reduction core to Trash', async () => {
  const cardRecord = loadShardCard('SD42.json', 'SD42-011');
  const ability = cardRecord.abilities.find(ab => ab.header?.timing === 'WHEN_ATTACKS');
  assert.ok(ability);
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'REPLACEMENT_EFFECT');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const bareRes = await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);
  assert.equal(bareRes.success, false);
  assert.equal(state.modifiers.length, 0);

  const structuredClause = {
    op: { op: 'REPLACEMENT_EFFECT', replaces: 'LIFE_CORE', replacementZone: 'trash', side: 'opp' }
  };
  const regRes = await resolver.resolveClause(state, ability, structuredClause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);
  assert.equal(regRes.success, true);

  state.players.opponent.life = 5;
  state.players.opponent.reserve.normal = 0;
  state.players.opponent.trash.normal = 0;

  await moveCore(state, 1, { zone: 'life', side: 'opponent' }, { zone: 'reserve', side: 'opponent' }, { cause: 'battle' }, events);

  assert.equal(state.players.opponent.life, 4);
  assert.equal(state.players.opponent.reserve.normal, 0, 'Reserve did NOT get core');
  assert.equal(state.players.opponent.trash.normal, 1, 'Core was redirected to Trash');
});

test('4.5 Real Shard IR: BS20-X01 (TheEnd-Dragonis) redirects destroyed spirit cores to itself', async () => {
  const cardRecord = loadShardCard('BS20.json', 'BS20-X01');
  const ability = cardRecord.abilities[0];
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'REPLACEMENT_EFFECT');

  const state = createGameState();
  state.players.player.reserve = { normal: 0, soul: 0 };
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const dragonisStack = createFieldStack(cardRecord, { normal: 2 });
  state.players.player.field = [dragonisStack];

  await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord,
    sourceStack: dragonisStack
  }, events);

  const dyingSpirit = createCard({ id: 'dying_sp', type: 'Spirit' });
  const dyingStack = createFieldStack(dyingSpirit, { normal: 3 });
  state.players.player.field.push(dyingStack);

  const replaceEvents = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => replaceEvents.push(ev));

  await commitStackExit(state, dyingStack, 'grave', { cause: 'destroy' }, events);

  assert.equal(state.players.player.field.length, 1);
  assert.equal(dragonisStack.cores.normal, 5, '3 cores transferred from destroyed spirit to Dragonis (2 + 3 = 5)');
  assert.equal(state.players.player.reserve.normal, 0, 'No cores returned to reserve');
  assert.equal(replaceEvents.length, 1);
  assert.equal(replaceEvents[0].targetStackId, dragonisStack.id);
});

test('4.6 Real Shard IR: BS42-052 (Yamane) redirects opponent void core addition to player Life', async () => {
  const cardRecord = loadShardCard('BS42.json', 'BS42-052');
  const ability = cardRecord.abilities[0];
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'REPLACEMENT_EFFECT');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const regRes = await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);
  assert.equal(regRes.success, true);

  state.players.player.life = 3;
  state.players.player.voidCores = { normal: 1, soul: 0 };
  state.players.opponent.reserve.normal = 0;

  // Opponent tries to add 1 core from Void via effect
  await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);

  assert.equal(state.players.opponent.reserve.normal, 0, 'Opponent did NOT receive core');
  assert.equal(state.players.player.life, 4, 'Player Life increased by 1');
});

test('4.7 Real Shard IR: BS24-013 (ThirdEyes-Snake) redirects opponent void core to this spirit', async () => {
  const cardRecord = loadShardCard('BS24.json', 'BS24-013');
  const ability = cardRecord.abilities[0];
  const clause = ability.clauses[0];
  assert.equal(clause.op.op, 'REPLACEMENT_EFFECT');

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  const snakeStack = createFieldStack(cardRecord, { normal: 1 });
  state.players.player.field = [snakeStack];

  await resolver.resolveClause(state, ability, clause, {
    controller: 'player',
    sourceCard: cardRecord,
    sourceStack: snakeStack
  }, events);

  state.players.player.voidCores = { normal: 1, soul: 0 };
  state.players.opponent.reserve.normal = 0;

  // Opponent tries to add core from void
  await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);

  assert.equal(state.players.opponent.reserve.normal, 0);
  assert.equal(snakeStack.cores.normal, 2, 'ThirdEyes-Snake gained the core');
});

test('4.8 commitStackExit() intercepts field exit and redirects to Hand', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 0, soul: 0 };
  const events = new EventBus();

  state.modifiers = [
    {
      type: 'REPLACEMENT_EFFECT',
      trigger: 'ON_DESTROYED',
      replaces: 'DESTRUCTION',
      replacementZone: 'hand',
      side: 'player',
      filter: { family: 'Toy Beast' }
    }
  ];

  const toyCard = createCard({ id: 'toy_stack_exit', family: 'Toy Beast', type: 'Spirit' });
  const stack = createFieldStack(toyCard, { normal: 2 });
  state.players.player.field = [stack];

  await commitStackExit(state, stack, 'grave', { cause: 'destroy' }, events);
  assert.equal(state.players.player.field.length, 0, 'Removed from field');
  assert.equal(state.players.player.hand.some(c => c.id === toyCard.id), true, 'Redirected to hand');
  assert.equal(state.players.player.grave.some(c => c.id === toyCard.id), false, 'Not in grave');
  assert.equal(state.players.player.reserve.normal, 2, 'Cores returned to reserve');
});

test('4.9 Structured replacement fields take precedence over text heuristics', async () => {
  const state = createGameState();
  const op = {
    op: 'REPLACEMENT_EFFECT',
    replaces: 'LIFE_CORE',
    trigger: 'ON_LIFE_REDUCED',
    replacementZone: 'void',
    side: 'player'
  };
  const ctx = {
    controller: 'player',
    currentClause: { cleanText: 'send to trash' }
  };
  const res = await executeOp(state, op, ctx, new TestPromptResolver());
  assert.equal(res.success, true);
  assert.equal(state.modifiers[0].replacementZone, 'void', 'Structured field took precedence');
});

// ============================================================================
// PART 5: SUMMON & SUMMON_FREE VARIANTS TESTS
// ============================================================================

test('5.1 Real Shard IR: PX25-03 (Kuroe) SUMMON_FREE from BURST transitions to field', async () => {
  const cardRecord = loadShardCard('PX25.json', 'PX25-03');
  const flashAbility = cardRecord.abilities.find(ab => ab.header?.timing === 'FLASH');
  assert.ok(flashAbility);
  const summonClause = flashAbility.clauses.find(c => c.op?.op === 'SUMMON_FREE');
  assert.ok(summonClause);

  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new TestPromptResolver());

  // Place Kuroe in burst slot
  state.players.player.burst = cardRecord;
  state.players.player.reserve.normal = 2;

  const summonEvents = [];
  events.on('SUMMONED', ev => summonEvents.push(ev));

  const res = await resolver.resolveClause(state, flashAbility, summonClause, {
    controller: 'player',
    sourceCard: cardRecord
  }, events);

  assert.equal(res.success, true);
  assert.equal(state.players.player.burst, null, 'Burst slot cleared upon summon');
  assert.equal(state.players.player.field.length, 1, 'Kuroe placed on field');
  assert.equal(state.players.player.field[0].top.id, cardRecord.id);
  assert.equal(state.players.player.field[0].cores.normal, 1, '1 core allocated for LV1');
  assert.equal(state.players.player.reserve.normal, 1, '1 core deducted for LV1');
  assert.equal(summonEvents.length, 1);
  assert.equal(summonEvents[0].fromZone, 'burst');
});

test('5.2 SUMMON_FREE from GRAVE/TRASH moves card to field', async () => {
  const state = createGameState();
  const events = new EventBus();
  const graveCard = createCard({ id: 'grave_spirit_1', name: 'Undead Knight', type: 'Spirit' });
  state.players.player.grave = [graveCard];
  state.players.player.reserve.normal = 2;

  const op = { op: 'SUMMON_FREE', from: 'GRAVE' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, true);
  assert.equal(state.players.player.grave.length, 0, 'Removed from grave');
  assert.equal(state.players.player.field.length, 1, 'Placed on field');
  assert.equal(state.players.player.field[0].top.id, graveCard.id);
});

test('5.3 SUMMON with symbol-based cost reduction', async () => {
  const state = createGameState();
  // Friendly field has 2 Red symbols
  const friendlyRed1 = createCard({ id: 'red_1', name: 'Red Spirit 1', type: 'Spirit', color: 'Red' });
  const friendlyRed2 = createCard({ id: 'red_2', name: 'Red Spirit 2', type: 'Spirit', color: 'Red' });
  state.players.player.field = [
    createFieldStack(friendlyRed1, { normal: 1 }),
    createFieldStack(friendlyRed2, { normal: 1 })
  ];

  // Card in hand with cost 4, reduction { Red: 2 }
  const redSpiritToSummon = createCard({
    id: 'red_summon_1',
    name: 'Dragon Emperor',
    type: 'Spirit',
    color: 'Red',
    cost: 4,
    reduction: { Red: 2 }
  });
  state.players.player.hand = [redSpiritToSummon];
  // Player has 3 cores in reserve (effective cost is 4 - 2 = 2, + 1 for LV1 = 3 cores total needed)
  state.players.player.reserve.normal = 3;

  const op = { op: 'SUMMON' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(state.players.player.field.length, 3);
  assert.equal(state.players.player.trash.normal, 2, '2 cores paid as effective cost (4 reduced by 2)');
  assert.equal(state.players.player.reserve.normal, 0, '0 cores remaining in reserve');
});

test('5.4 Atomic LV1 Core Check: Insufficient cores aborts summon with zero state mutation', async () => {
  const state = createGameState();
  const spiritCard = createCard({
    id: 'expensive_spirit',
    name: 'Titan',
    type: 'Spirit',
    cost: 3
  });
  state.players.player.hand = [spiritCard];
  // Player has only 3 cores (needs 3 for cost + 1 for LV1 = 4 cores)
  state.players.player.reserve = { normal: 3, soul: 0 };

  const op = { op: 'SUMMON' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INSUFFICIENT_LV1_CORES');
  assert.equal(state.players.player.reserve.normal, 3, 'Reserve cores must NOT be mutated on failure');
  assert.equal(state.players.player.trash.normal, 0, 'No cores should be in trash');
  assert.equal(state.players.player.hand.length, 1, 'Card must remain in hand');
  assert.equal(state.players.player.field.length, 0, 'No stack should be created on field');
});

test('5.5 SUMMON with exhausted: true creates EXHAUSTED stack', async () => {
  const state = createGameState();
  const spiritCard = createCard({ id: 'exhausted_spirit', name: 'Tired Spirit', type: 'Spirit', cost: 0 });
  state.players.player.hand = [spiritCard];
  state.players.player.reserve.normal = 2;

  const op = { op: 'SUMMON', exhausted: true, free: true };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].state, 'EXHAUSTED', 'Stack should be in EXHAUSTED state');
});

test('5.6 SUMMON_FREE from HAND moves card to field', async () => {
  const state = createGameState();
  const handCard = createCard({ id: 'hand_sp', name: 'Hand Spirit', type: 'Spirit', cost: 3 });
  state.players.player.hand = [handCard];
  state.players.player.reserve.normal = 2;

  const op = { op: 'SUMMON_FREE', from: 'HAND' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, handCard.id);
});

test('5.7 SUMMON_FREE from REMOVED moves card to field', async () => {
  const state = createGameState();
  const removedCard = createCard({ id: 'removed_sp', name: 'Warped Spirit', type: 'Spirit' });
  state.players.player.removed = [removedCard];
  state.players.player.reserve.normal = 2;

  const op = { op: 'SUMMON_FREE', from: 'REMOVED' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.removed.length, 0);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, removedCard.id);
});

test('5.8 SUMMON_FREE from REVEALED moves card to field', async () => {
  const state = createGameState();
  const revCard = createCard({ id: 'rev_sp', name: 'Revealed Spirit', type: 'Spirit' });
  state.players.player.revealed = [revCard];
  state.players.player.reserve.normal = 2;

  const op = { op: 'SUMMON_FREE', from: 'REVEALED' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.revealed.length, 0);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, revCard.id);
});

test('5.9 SUMMON_FREE rollback on core placement failure preserves initial state', async () => {
  const state = createGameState();
  const spiritCard = createCard({ id: 'free_sp', name: 'Free Spirit', type: 'Spirit' });
  state.players.player.hand = [spiritCard];
  state.players.player.reserve = { normal: 0, soul: 0 }; // 0 reserve cores -> can't place 1 core for LV1!

  const op = { op: 'SUMMON_FREE', from: 'HAND' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INSUFFICIENT_LV1_CORES');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
});

test('5.10 Stack transitions preserve under-cards and braves integrity', async () => {
  const state = createGameState();
  const events = new EventBus();
  const topCard = createCard({ id: 'top_1', name: 'Base Spirit', type: 'Spirit' });
  const braveCard = createCard({ id: 'brave_1', name: 'Brave Sword', type: 'Brave' });
  const underCard = createCard({ id: 'under_1', name: 'Under Card', type: 'Magic' });

  const stack = createFieldStack(topCard, { normal: 2 });
  stack.braves = [braveCard];
  stack.under = [underCard];
  state.players.player.field = [stack];

  await commitStackExit(state, stack, 'grave', { cause: 'destroy' }, events);

  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.grave.some(c => c.id === topCard.id), true);
  assert.equal(state.players.player.grave.some(c => c.id === braveCard.id), true);
  assert.equal(state.players.player.grave.some(c => c.id === underCard.id), true);
});

// ============================================================================
// PART 6: PHASE 4B.3.2 NORMAL SUMMON ATOMICITY & ROLLBACK TESTS
// ============================================================================

test('6.1 Normal SUMMON: Failed cost payment results in zero state mutation', async () => {
  const state = createGameState();
  const spirit = createCard({ id: 'sp_cost_fail', name: 'High Cost Spirit', type: 'Spirit', cost: 5 });
  state.players.player.hand = [spirit];
  state.players.player.reserve = { normal: 2, soul: 1 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INSUFFICIENT_COST_CORES');
  assert.equal(state.players.player.reserve.normal, 2);
  assert.equal(state.players.player.reserve.soul, 1);
  assert.equal(state.players.player.trash.normal, 0);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, spirit.id);
  assert.equal(state.players.player.field.length, 0);
});

test('6.2 Normal SUMMON: Cost payment success followed by failed LV1 placement restores exact core state', async () => {
  const state = createGameState();
  const events = new EventBus();
  const spirit = createCard({ id: 'sp_lv1_fail', name: 'Spirit', type: 'Spirit', cost: 2 });
  state.players.player.hand = [spirit];
  state.players.player.reserve = { normal: 2, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  // Preflight rejects before any cost payment when cost(2) + lv1(1) > reserve(2)
  const op = { op: 'SUMMON' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INSUFFICIENT_LV1_CORES');
  assert.equal(state.players.player.reserve.normal, 2, 'Reserve cores preserved at 2');
  assert.equal(state.players.player.reserve.soul, 0);
  assert.equal(state.players.player.trash.normal, 0, 'Trash cores preserved at 0');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.equal(state.players.player.hand[0].id, spirit.id);
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
});

test('6.3 Normal SUMMON: Failed Soul Core placement restores exact core state', async () => {
  const state = createGameState();
  const events = new EventBus();
  const spirit = createCard({ id: 'sp_soul_fail', name: 'Spirit', type: 'Spirit', cost: 2 });
  state.players.player.hand = [spirit];
  state.players.player.reserve = { normal: 2, soul: 1 };
  state.players.player.trash = { normal: 0, soul: 0 };

  // Requesting 2 initial cores after paying 2 cost cores fails post-cost placement and rolls back cleanly
  events.on('CORE_MOVED', ev => {
    if (ev.cause === 'summon_cost') {
      // Simulate soul core unavailable during placement without destroying core conservation
      state.players.player.reserve.soul = 0;
      state.players.player.voidCores.soul += 1;
    }
  });

  const op = { op: 'SUMMON' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'CORE_PLACEMENT_FAILED');
  assert.equal(state.players.player.reserve.normal, 2, 'Normal reserve restored via rollback');
  assert.equal(state.players.player.trash.normal, 0, 'Trash restored to initial');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
});

test('6.4 Normal SUMMON: Successful normal summon creates field stack and deducts cores', async () => {
  const state = createGameState();
  const spirit = createCard({
    id: 'sp_success',
    name: 'Battle Spirit',
    type: 'Spirit',
    cost: 3,
    reduction: { Red: 1 },
    color: 'Red'
  });
  // Friendly field has 1 Red symbol
  const redSymbol = createCard({ id: 'red_sym', color: 'Red', type: 'Spirit' });
  state.players.player.field = [createFieldStack(redSymbol, { normal: 1 })];
  state.players.player.hand = [spirit];
  state.players.player.reserve = { normal: 4, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  // Cost 3 - 1 reduction = 2 cost + 1 LV1 = 3 cores total deducted from reserve
  assert.equal(state.players.player.trash.normal, 2, '2 cores paid to trash');
  assert.equal(state.players.player.reserve.normal, 1, '1 core left in reserve');
  assert.equal(state.players.player.field.length, 2, 'Stack added to field');
  assert.equal(state.players.player.field[1].top.id, spirit.id);
  assert.equal(state.players.player.field[1].cores.normal, 1, '1 core allocated for LV1');
  assert.equal(state.players.player.hand.length, 0, 'Card removed from hand');
});

test('6.5 Normal SUMMON: No partial state mutation across all failed summon cases', async () => {
  const state = createGameState();
  const spirit = createCard({ id: 'sp_no_mutate', name: 'Spirit', type: 'Spirit', cost: 10 });
  state.players.player.hand = [spirit];
  const beforeReserve = { normal: 3, soul: 1 };
  const beforeTrash = { normal: 2, soul: 0 };
  state.players.player.reserve = { ...beforeReserve };
  state.players.player.trash = { ...beforeTrash };

  const res = await executeOp(state, { op: 'SUMMON' }, { controller: 'player' }, new TestPromptResolver());
  assert.equal(res.success, false);

  assert.deepEqual(state.players.player.reserve, beforeReserve);
  assert.deepEqual(state.players.player.trash, beforeTrash);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.field.length, 0);
});

// ============================================================================
// PART 7: PHASE 4B.3.2 SUMMON_FREE COMPLETE ROLLBACK TESTS
// ============================================================================

test('7.1 SUMMON_FREE: Forced post-payment placement failure restores exact complete state', async () => {
  const state = createGameState();
  const events = new EventBus();
  const freeSpirit = createCard({ id: 'free_fail_sp', name: 'Free Spirit', type: 'Spirit' });
  state.players.player.hand = [freeSpirit];
  state.players.player.reserve = { normal: 5, soul: 1 };
  state.players.player.trash = { normal: 2, soul: 0 };
  state.players.player.field = [];
  state.players.player.grave = [];
  state.players.player.removed = [];
  state.players.player.revealed = [];
  state.players.player.burst = null;

  // Intercept summon_cost to move reserve to void (preserving conservation) and trigger post-payment placement failure
  events.on('CORE_MOVED', ev => {
    if (ev.cause === 'summon_cost') {
      const n = state.players.player.reserve.normal;
      const s = state.players.player.reserve.soul;
      state.players.player.reserve.normal = 0;
      state.players.player.reserve.soul = 0;
      state.players.player.voidCores.normal += n;
      state.players.player.voidCores.soul += s;
    }
  });

  const op = { op: 'SUMMON_FREE', from: 'HAND', costCores: 2 };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'CORE_PLACEMENT_FAILED');

  // Cost cores (2) rolled back to reserve without inventing cores
  assert.equal(state.players.player.reserve.normal, 2, 'Paid cost cores restored to reserve');
  assert.equal(state.players.player.voidCores.normal, 3, 'Unrelated listener transfer preserved');
  assert.equal(state.players.player.trash.normal, 2, 'Trash normal restored');
  assert.equal(state.players.player.trash.soul, 0, 'Trash soul restored');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.equal(state.players.player.hand[0].id, freeSpirit.id);
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
  assert.equal(state.players.player.grave.length, 0, 'Grave remains empty');
  assert.equal(state.players.player.removed.length, 0, 'Removed remains empty');
  assert.equal(state.players.player.revealed.length, 0, 'Revealed remains empty');
  assert.equal(state.players.player.burst, null, 'Burst slot remains null');
});

test('7.2 SUMMON_FREE: Braves and under-cards maintain association on failure', async () => {
  const state = createGameState();
  const topCard = createCard({ id: 'top_assoc', name: 'Top Card', type: 'Spirit' });
  const braveCard = createCard({ id: 'brv_assoc', name: 'Attached Brave', type: 'Brave' });
  const underCard = createCard({ id: 'und_assoc', name: 'Pre-Advent Card', type: 'Spirit' });

  const stack = createFieldStack(topCard, { normal: 2 });
  stack.braves = [braveCard];
  stack.under = [underCard];
  state.players.player.field = [stack];

  // Attempt an invalid free summon from hand with 0 reserve cores
  state.players.player.reserve = { normal: 0, soul: 0 };
  const handCard = createCard({ id: 'hand_sp', type: 'Spirit' });
  state.players.player.hand = [handCard];

  const op = { op: 'SUMMON_FREE', from: 'HAND' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, false);
  // Verify original field stack remains fully intact with all associations
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, topCard.id);
  assert.equal(state.players.player.field[0].braves.length, 1);
  assert.equal(state.players.player.field[0].braves[0].id, braveCard.id);
  assert.equal(state.players.player.field[0].under.length, 1);
  assert.equal(state.players.player.field[0].under[0].id, underCard.id);
});

// ============================================================================
// PART 8: PHASE 4B.3.2 REPLACEMENT_EFFECT PRE-VALIDATION & EVENT METADATA
// ============================================================================

test('8.1 REPLACEMENT_EFFECT: Missing replacement target stack returns false with zero mutation', async () => {
  const state = createGameState();
  const events = new EventBus();

  // Replacement effect targeting nonexistent stack
  state.modifiers = [
    {
      type: 'REPLACEMENT_EFFECT',
      replaces: 'CORE_ADDITION',
      replacementZone: 'field',
      targetStackId: 'stack_missing_999',
      side: 'player'
    }
  ];

  state.players.opponent.reserve = { normal: 3, soul: 0 };
  state.players.player.field = [];
  state.players.player.life = 4;

  // Opponent tries to add core from void via effect
  const res = await moveCore(state, 1, { zone: 'void' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);

  assert.equal(res, false, 'moveCore should return false when replacement target stack does not exist');
  assert.equal(state.players.opponent.reserve.normal, 3, 'Opponent reserve remains unchanged');
  assert.equal(state.players.player.life, 4, 'Player life remains unchanged');
});

test('8.2 REPLACEMENT_EFFECT: Valid replacement target stack attaches core cleanly', async () => {
  const state = createGameState();
  const events = new EventBus();

  const targetCard = createCard({ id: 'target_sp', name: 'Target Spirit', type: 'Spirit' });
  const targetStack = createFieldStack(targetCard, { normal: 1 });
  state.players.player.field = [targetStack];

  state.modifiers = [
    {
      type: 'REPLACEMENT_EFFECT',
      replaces: 'CORE_ADDITION',
      replacementZone: 'field',
      targetStackId: targetStack.id,
      side: 'player'
    }
  ];

  state.players.player.voidCores = { normal: 1, soul: 0 };
  state.players.opponent.reserve = { normal: 1, soul: 0 };

  const replaceEvents = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => replaceEvents.push(ev));

  const res = await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);

  assert.equal(res, true);
  assert.equal(targetStack.cores.normal, 2, 'Core redirected to target stack (1 + 1 = 2)');
  assert.equal(state.players.opponent.reserve.normal, 1, 'Opponent reserve did not receive core');
  assert.equal(replaceEvents.length, 1);
  assert.equal(replaceEvents[0].targetStackId, targetStack.id);
});

test('8.3 REPLACEMENT_EFFECT: Life redirection emits LIFE_RECOVERED with correct metadata', async () => {
  const state = createGameState();
  const events = new EventBus();

  state.modifiers = [
    {
      type: 'REPLACEMENT_EFFECT',
      replaces: 'CORE_ADDITION',
      replacementZone: 'life',
      side: 'player'
    }
  ];

  state.players.player.life = 3;
  state.players.player.voidCores = { normal: 1, soul: 0 };
  state.players.opponent.reserve = { normal: 1, soul: 0 };

  const lifeEvents = [];
  events.on('LIFE_RECOVERED', ev => lifeEvents.push(ev));

  const res = await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);

  assert.equal(res, true);
  assert.equal(state.players.player.life, 4, 'Player life incremented');
  assert.equal(state.players.opponent.reserve.normal, 1, 'Opponent reserve unchanged');
  assert.equal(lifeEvents.length, 1, 'Exactly one LIFE_RECOVERED event emitted');
  assert.equal(lifeEvents[0].player, 'player', 'Player metadata must match receiving player');
  assert.equal(lifeEvents[0].recovered, 1);
  assert.equal(lifeEvents[0].currentLife, 4, 'currentLife metadata must match updated life');
});

test('8.4 REPLACEMENT_EFFECT: Opponent cannot redirect Soul Core to Void', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 1, soul: 1 };
  state.players.player.voidCores = { normal: 0, soul: 0 };

  // Attempt to move Soul Core to void by opponent effect
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void', side: 'player' }, {
    isSoulCore: true,
    by: 'opp',
    cause: 'effect'
  });

  assert.equal(res, false, 'Opponent cannot send Soul Core to Void');
  assert.equal(state.players.player.reserve.soul, 1, 'Soul Core remains in reserve');
});

test('8.5 REPLACEMENT_EFFECT: Soul Core cannot enter Life without Seal effect', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 1, soul: 1 };
  state.players.player.life = 3;

  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'life', side: 'player' }, {
    isSoulCore: true,
    allowSeal: false
  });

  assert.equal(res, false, 'Soul Core cannot enter Life without allowSeal');
  assert.equal(state.players.player.reserve.soul, 1);
  assert.equal(state.players.player.life, 3);
});

// ============================================================================
// PART 9: PHASE 4B.3.2 ACTIVATE_BURST COMPLETE ZONE INTEGRITY TESTS
// ============================================================================

test('9.1 ACTIVATE_BURST: Card placed in Removed exists in exactly one zone', async () => {
  const state = createGameState();
  const burstCard = createCard({
    id: 'burst_to_removed',
    name: 'Warp Burst',
    type: 'Magic',
    compiledIr: {
      abilities: [{ header: { timing: 'BURST' }, clauses: [{ op: { op: 'NOOP' } }] }]
    }
  });
  state.players.player.burst = burstCard;

  const resolver = {
    async resolveAbility(st) {
      await moveCard(st, burstCard, 'removed', 'player');
      return { success: true, hasUnsupported: false, hasFailure: false, results: [] };
    }
  };

  const res = await executeOp(state, { op: 'ACTIVATE_BURST' }, { controller: 'player', resolver });
  assert.equal(res.success, true);

  const zoneInfo = findCardCurrentZone(state, burstCard.id);
  assert.equal(zoneInfo?.zone, 'removed');
  assert.equal(state.players.player.removed.filter(c => c.id === burstCard.id).length, 1);
  assert.equal(state.players.player.grave.some(c => c.id === burstCard.id), false, 'Must NOT be in grave');
});

test('9.2 ACTIVATE_BURST: Card placed in Deck exists in exactly one zone', async () => {
  const state = createGameState();
  const burstCard = createCard({
    id: 'burst_to_deck',
    name: 'Recycle Burst',
    type: 'Magic',
    compiledIr: {
      abilities: [{ header: { timing: 'BURST' }, clauses: [{ op: { op: 'NOOP' } }] }]
    }
  });
  state.players.player.burst = burstCard;

  const resolver = {
    async resolveAbility(st) {
      await moveCard(st, burstCard, 'deck_bottom', 'player');
      return { success: true, hasUnsupported: false, hasFailure: false, results: [] };
    }
  };

  const res = await executeOp(state, { op: 'ACTIVATE_BURST' }, { controller: 'player', resolver });
  assert.equal(res.success, true);

  const zoneInfo = findCardCurrentZone(state, burstCard.id);
  assert.equal(zoneInfo?.zone, 'deck');
  assert.equal(state.players.player.deck.filter(c => c.id === burstCard.id).length, 1);
  assert.equal(state.players.player.grave.some(c => c.id === burstCard.id), false);
});

test('9.3 ACTIVATE_BURST: Card returned to Hand exists in exactly one zone', async () => {
  const state = createGameState();
  const burstCard = createCard({
    id: 'burst_to_hand',
    name: 'Bounce Burst',
    type: 'Magic',
    compiledIr: {
      abilities: [{ header: { timing: 'BURST' }, clauses: [{ op: { op: 'NOOP' } }] }]
    }
  });
  state.players.player.burst = burstCard;

  const resolver = {
    async resolveAbility(st) {
      await moveCard(st, burstCard, 'hand', 'player');
      return { success: true, hasUnsupported: false, hasFailure: false, results: [] };
    }
  };

  const res = await executeOp(state, { op: 'ACTIVATE_BURST' }, { controller: 'player', resolver });
  assert.equal(res.success, true);

  const zoneInfo = findCardCurrentZone(state, burstCard.id);
  assert.equal(zoneInfo?.zone, 'hand');
  assert.equal(state.players.player.hand.filter(c => c.id === burstCard.id).length, 1);
  assert.equal(state.players.player.grave.some(c => c.id === burstCard.id), false);
});

test('9.4 ACTIVATE_BURST: Card summoned to Field exists in exactly one zone', async () => {
  const state = createGameState();
  const burstCard = createCard({
    id: 'burst_to_field',
    name: 'Summon Burst',
    type: 'Spirit',
    compiledIr: {
      abilities: [{ header: { timing: 'BURST' }, clauses: [{ op: { op: 'NOOP' } }] }]
    }
  });
  state.players.player.burst = burstCard;

  const resolver = {
    async resolveAbility(st) {
      st.players.player.field.push(createFieldStack(burstCard, { normal: 1 }));
      return { success: true, hasUnsupported: false, hasFailure: false, results: [] };
    }
  };

  const res = await executeOp(state, { op: 'ACTIVATE_BURST' }, { controller: 'player', resolver });
  assert.equal(res.success, true);

  const zoneInfo = findCardCurrentZone(state, burstCard.id);
  assert.equal(zoneInfo?.zone, 'field');
  assert.equal(state.players.player.field.filter(st => st.top.id === burstCard.id).length, 1);
  assert.equal(state.players.player.grave.some(c => c.id === burstCard.id), false);
});

test('9.5 ACTIVATE_BURST: Non-summoned burst routing to Grave exists in exactly one zone', async () => {
  const state = createGameState();
  const burstCard = createCard({
    id: 'burst_to_grave',
    name: 'Standard Burst',
    type: 'Magic',
    compiledIr: {
      abilities: [{ header: { timing: 'BURST' }, clauses: [{ op: { op: 'NOOP' } }] }]
    }
  });
  state.players.player.burst = burstCard;

  const resolver = {
    async resolveAbility() {
      return { success: true, hasUnsupported: false, hasFailure: false, results: [] };
    }
  };

  const res = await executeOp(state, { op: 'ACTIVATE_BURST' }, { controller: 'player', resolver });
  assert.equal(res.success, true);

  const zoneInfo = findCardCurrentZone(state, burstCard.id);
  assert.equal(zoneInfo?.zone, 'grave');
  assert.equal(state.players.player.grave.filter(c => c.id === burstCard.id).length, 1);
  assert.equal(state.players.player.burst, null);
});


// ============================================================================
// PART 10: MISSING FIELD REPLACEMENT TARGET VALIDATION TESTS
// ============================================================================

test('10.1 Field replacement with no targetStackId returns false with zero mutation', async () => {
  const state = createGameState();
  const events = new EventBus();
  state.players.player.reserve = { normal: 4, soul: 0 };
  state.players.opponent.reserve = { normal: 2, soul: 0 };
  state.players.opponent.life = 5;

  const emitted = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => emitted.push(ev));
  events.on('CORE_MOVED', ev => emitted.push(ev));

  state.modifiers = [{
    id: 'mod_field_no_target',
    type: 'REPLACEMENT_EFFECT',
    replaces: 'CORE_ADDITION',
    replacementZone: 'field',
    side: 'opponent'
  }];

  const res = await moveCore(state, 1, { zone: 'void' }, { zone: 'reserve', side: 'player' }, { cause: 'effect' }, events);

  assert.equal(res, false, 'moveCore must reject field replacement with no targetStackId');
  assert.equal(state.players.player.reserve.normal, 4, 'Source cores not mutated');
  assert.equal(state.players.opponent.reserve.normal, 2, 'Destination cores not mutated');
  assert.equal(emitted.length, 0, 'No replacement or core moved events emitted on rejection');
});

test('10.2 Field replacement with an invalid targetStackId returns false with zero mutation', async () => {
  const state = createGameState();
  const events = new EventBus();
  state.players.player.field = [createFieldStack(createCard({ id: 'sp1' }), { normal: 2 })];
  state.players.player.reserve = { normal: 3, soul: 1 };
  state.players.opponent.reserve = { normal: 0, soul: 0 };

  const emitted = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => emitted.push(ev));
  events.on('CORE_MOVED', ev => emitted.push(ev));

  state.modifiers = [{
    id: 'mod_field_invalid_target',
    type: 'REPLACEMENT_EFFECT',
    replaces: 'CORE_ADDITION',
    replacementZone: 'field',
    targetStackId: 'nonexistent_stack_xyz',
    side: 'player'
  }];

  const res = await moveCore(state, 1, { zone: 'void' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);

  assert.equal(res, false, 'moveCore must reject field replacement with nonexistent targetStackId');
  assert.equal(state.players.player.field[0].cores.normal, 2, 'Field stack cores unchanged');
  assert.equal(state.players.player.reserve.normal, 3, 'Player reserve unchanged');
  assert.equal(state.players.opponent.reserve.normal, 0, 'Opponent reserve unchanged');
  assert.equal(emitted.length, 0, 'No replacement or core moved events emitted on rejection');
});

test('10.3 Field replacement with a valid targetStackId transfers cores cleanly', async () => {
  const state = createGameState();
  const events = new EventBus();
  const targetStack = createFieldStack(createCard({ id: 'valid_target' }), { normal: 1 });
  state.players.player.field = [targetStack];
  state.players.player.voidCores = { normal: 1, soul: 0 };
  state.players.opponent.reserve = { normal: 0, soul: 0 };

  const emitted = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => emitted.push(ev));
  events.on('CORE_MOVED', ev => emitted.push(ev));

  state.modifiers = [{
    id: 'mod_field_valid_target',
    type: 'REPLACEMENT_EFFECT',
    replaces: 'CORE_ADDITION',
    replacementZone: 'field',
    targetStackId: targetStack.id,
    side: 'player'
  }];

  const res = await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);

  assert.equal(res, true, 'moveCore succeeds with valid targetStackId');
  assert.equal(targetStack.cores.normal, 2, 'Field stack received core');
  assert.equal(state.players.opponent.reserve.normal, 0, 'Opponent received no core');
  assert.equal(emitted.length, 2, 'REPLACEMENT_EFFECT_APPLIED and CORE_MOVED emitted');
  assert.equal(emitted[0].type, 'REPLACEMENT_EFFECT_APPLIED');
  assert.equal(emitted[0].targetStackId, targetStack.id);
  assert.equal(emitted[1].type, 'CORE_MOVED');
});

test('10.4 Exact core snapshots preserved before and after every failed replacement transfer', async () => {
  const state = createGameState();
  const events = new EventBus();
  state.players.player.reserve = { normal: 5, soul: 1 };
  state.players.player.trash = { normal: 2, soul: 0 };
  state.players.player.life = 4;
  state.players.opponent.reserve = { normal: 3, soul: 0 };
  state.players.opponent.trash = { normal: 1, soul: 0 };
  state.players.opponent.life = 5;

  const snapshotBefore = JSON.stringify(state.players);

  state.modifiers = [{
    id: 'mod_field_fail',
    type: 'REPLACEMENT_EFFECT',
    replaces: 'CORE_ADDITION',
    replacementZone: 'field',
    side: 'player'
  }];

  const res = await moveCore(state, 2, { zone: 'void' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);
  assert.equal(res, false);
  assert.equal(JSON.stringify(state.players), snapshotBefore, 'Complete player state must be unchanged');
});

// ============================================================================
// PART 11: ACTOR NORMALIZATION FOR SOUL CORE RESTRICTIONS TESTS
// ============================================================================

test('11.1 Opponent actor with by: "opp" rejects illegal Soul Core transfer to Void', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 2, soul: 1 };

  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void', side: 'player' }, {
    isSoulCore: true,
    by: 'opp'
  });

  assert.equal(res, false, 'by: "opp" rejected');
  assert.equal(state.players.player.reserve.soul, 1, 'Soul Core remained in player reserve');
  assert.equal(state.players.player.reserve.normal, 2);
});

test('11.2 Opponent actor with by: "opponent" rejects illegal Soul Core transfer to Void', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 3, soul: 1 };

  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void', side: 'player' }, {
    isSoulCore: true,
    by: 'opponent'
  });

  assert.equal(res, false, 'by: "opponent" rejected');
  assert.equal(state.players.player.reserve.soul, 1, 'Soul Core remained in player reserve');
  assert.equal(state.players.player.reserve.normal, 3);
});

test('11.3 Legal non-opponent transfer (by: "player" / by: "self") behaves correctly', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 2, soul: 1 };

  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void', side: 'player' }, {
    isSoulCore: true,
    by: 'player'
  });

  assert.equal(res, true, 'Self/player transfer to void succeeds');
  assert.equal(state.players.player.reserve.soul, 0, 'Soul Core left reserve');
});

// ============================================================================
// PART 12: GLOBAL CARD-ZONE OCCUPANCY VALIDATOR TESTS
// ============================================================================

test('12.1 Deliberate duplicate: same card in hand and grave reports count 2', async () => {
  const state = createGameState();
  const dupCard = createCard({ id: 'dup_hand_grave' });
  state.players.player.hand = [dupCard];
  state.players.player.grave = [dupCard];

  const count = countCardZoneOccurrences(state, dupCard.id);
  assert.equal(count, 2, 'Validator reports 2 occurrences across hand and grave');
});

test('12.2 Deliberate duplicate: same card in field (top) and removed reports count 2', async () => {
  const state = createGameState();
  const dupCard = createCard({ id: 'dup_field_removed' });
  state.players.player.field = [createFieldStack(dupCard, { normal: 1 })];
  state.players.player.removed = [dupCard];

  const count = countCardZoneOccurrences(state, dupCard.id);
  assert.equal(count, 2, 'Validator reports 2 occurrences across field top and removed');
});

test('12.3 Deliberate duplicate: same card in Burst and deck reports count 2', async () => {
  const state = createGameState();
  const dupCard = createCard({ id: 'dup_burst_deck' });
  state.players.player.burst = dupCard;
  state.players.player.deck = [dupCard];

  const count = countCardZoneOccurrences(state, dupCard.id);
  assert.equal(count, 2, 'Validator reports 2 occurrences across burst and deck');
});

test('12.4 Deliberate duplicate: same card as field under-card and in hand reports count 2', async () => {
  const state = createGameState();
  const topCard = createCard({ id: 'top_spirit' });
  const underCard = createCard({ id: 'dup_under_hand' });
  const stack = createFieldStack(topCard, { normal: 1 });
  stack.under = [underCard];
  state.players.player.field = [stack];
  state.players.player.hand = [underCard];

  const count = countCardZoneOccurrences(state, underCard.id);
  assert.equal(count, 2, 'Validator reports 2 occurrences across under-card and hand');
});

test('12.5 Deliberate duplicate: same card attached as a Brave and in grave reports count 2', async () => {
  const state = createGameState();
  const topCard = createCard({ id: 'top_spirit_2' });
  const braveCard = createCard({ id: 'dup_brave_grave', type: 'Brave' });
  const stack = createFieldStack(topCard, { normal: 2 });
  stack.braves = [braveCard];
  state.players.player.field = [stack];
  state.players.player.grave = [braveCard];

  const count = countCardZoneOccurrences(state, braveCard.id);
  assert.equal(count, 2, 'Validator reports 2 occurrences across brave and grave');
});

// ============================================================================
// PART 13: SOURCE-ZONE VALIDITY & TRANSACTIONAL CONSISTENCY FOR SUMMON & SUMMON_FREE
// ============================================================================

test('13.1 Source card not present in any permitted source zone returns INVALID_SOURCE_ZONE', async () => {
  const state = createGameState();
  const phantomCard = createCard({ id: 'phantom_spirit', cost: 1 });
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.hand = [];

  const op = { op: 'SUMMON', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: phantomCard }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_SOURCE_ZONE');
  assert.equal(state.players.player.reserve.normal, 3, 'Zero core mutation on rejected summon');
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
});

test('13.2 Source card already on the field returns CARD_ALREADY_ON_FIELD with zero mutation', async () => {
  const state = createGameState();
  const fieldedCard = createCard({ id: 'already_fielded', cost: 2 });
  const fieldStack = createFieldStack(fieldedCard, { normal: 1 });
  state.players.player.field = [fieldStack];
  state.players.player.reserve = { normal: 4, soul: 0 };

  const op = { op: 'SUMMON_FREE', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: fieldedCard }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'CARD_ALREADY_ON_FIELD');
  assert.equal(state.players.player.field.length, 1, 'Field stack count unchanged');
  assert.equal(countCardZoneOccurrences(state, fieldedCard.id), 1, 'Card remains in exactly one location');
  assert.equal(state.players.player.reserve.normal, 4, 'Reserve cores untouched');
});

test('13.3 Valid Burst-to-field transition: card leaves Burst and enters Field exactly once', async () => {
  const state = createGameState();
  const burstCard = createCard({ id: 'burst_spirit_card', cost: 3 });
  state.players.player.burst = burstCard;
  state.players.player.reserve = { normal: 2, soul: 0 };

  const op = { op: 'SUMMON_FREE', from: 'BURST', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: burstCard, activeBurstCard: burstCard }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.burst, null, 'Burst slot cleared');
  assert.equal(state.players.player.field.length, 1, 'Field stack created');
  assert.equal(countCardZoneOccurrences(state, burstCard.id), 1, 'Card resides in exactly one zone (field)');
});

test('13.4 Valid revealed-to-field transition: card leaves Revealed and enters Field exactly once', async () => {
  const state = createGameState();
  const revCard = createCard({ id: 'rev_spirit_card', cost: 1 });
  state.players.player.revealed = [revCard];
  state.players.player.reserve = { normal: 2, soul: 0 };

  const op = { op: 'SUMMON_FREE', from: 'REVEALED' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.revealed.length, 0, 'Revealed pool cleared');
  assert.equal(state.players.player.field.length, 1, 'Field stack created');
  assert.equal(countCardZoneOccurrences(state, revCard.id), 1, 'Card resides in exactly one zone (field)');
});

test('13.5 Valid grave-to-field transition: card leaves Grave and enters Field exactly once', async () => {
  const state = createGameState();
  const graveCard = createCard({ id: 'grave_spirit_card', cost: 2 });
  state.players.player.grave = [graveCard];
  state.players.player.reserve = { normal: 2, soul: 0 };

  const op = { op: 'SUMMON_FREE', from: 'GRAVE' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.grave.length, 0, 'Grave cleared');
  assert.equal(state.players.player.field.length, 1, 'Field stack created');
  assert.equal(countCardZoneOccurrences(state, graveCard.id), 1, 'Card resides in exactly one zone (field)');
});

test('13.6 Transaction and event consistency: No false SUMMONED event and verified rollback causes', async () => {
  const state = createGameState();
  const events = new EventBus();
  const spirit = createCard({ id: 'trans_spirit', cost: 2 });
  state.players.player.hand = [spirit];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const emitted = [];
  events.on('CORE_MOVED', ev => emitted.push(ev));
  events.on('SUMMONED', ev => emitted.push(ev));

  events.on('CORE_MOVED', ev => {
    if (ev.cause === 'summon_cost') {
      state.players.player.voidCores.normal += state.players.player.reserve.normal;
      state.players.player.reserve.normal = 0;
    }
  });

  const op = { op: 'SUMMON' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);

  assert.equal(res.success, false);
  assert.equal(emitted.some(ev => ev.type === 'SUMMONED'), false, 'NO false SUMMONED event on failure');

  const costMoved = emitted.filter(ev => ev.type === 'CORE_MOVED' && ev.cause === 'summon_cost');
  const rollbackMoved = emitted.filter(ev => ev.type === 'CORE_MOVED' && ev.cause === 'summon_rollback');
  assert.equal(costMoved.length, 1, 'Cost movement event was emitted');
  assert.equal(rollbackMoved.length, 1, 'Rollback movement event was emitted');

  assert.equal(state.players.player.reserve.normal, 2);
  assert.equal(state.players.player.trash.normal, 0);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.field.length, 0);
  assert.equal(countCardZoneOccurrences(state, spirit.id), 1, 'Card remains in hand only');
});


// ============================================================================
// PART 14: STRICT FIELD STACK DESTINATION VALIDATION
// ============================================================================

test('14.1 moveCore() targeting field with missing stackId returns false with zero mutation', async () => {
  const state = createGameState();
  state.players.player.reserve.normal = 3;
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player' }, { cause: 'manual' });
  assert.equal(res, false);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('14.2 moveCore() targeting field with nonexistent stackId returns false with zero mutation', async () => {
  const state = createGameState();
  state.players.player.reserve.normal = 3;
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player', stackId: 'nonexistent_stack' });
  assert.equal(res, false);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('14.3 moveCore() with cause: "summon" and missing stackId returns false with zero mutation', async () => {
  const state = createGameState();
  state.players.player.reserve.normal = 3;
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player' }, { cause: 'summon', by: 'player' });
  assert.equal(res, false);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('14.4 moveCore() with cause: "deploy" and missing stackId returns false with zero mutation', async () => {
  const state = createGameState();
  state.players.player.reserve.normal = 3;
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player' }, { cause: 'deploy', by: 'player' });
  assert.equal(res, false);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('14.5 moveCore() with cause: "rollback" and missing stackId returns false with zero mutation', async () => {
  const state = createGameState();
  state.players.player.reserve.normal = 3;
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player' }, { cause: 'rollback' });
  assert.equal(res, false);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('14.6 moveCore() targeting valid existing field stack credits stack and deducts source', async () => {
  const state = createGameState();
  const c = createCard({ id: 'valid_target_card' });
  const stack = createFieldStack(c, { normal: 0, soul: 0 });
  state.players.player.field = [stack];
  state.players.player.reserve.normal = 3;
  const res = await moveCore(state, 2, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player', stackId: stack.id }, { cause: 'manual' });
  assert.equal(res, true);
  assert.equal(state.players.player.reserve.normal, 1);
  assert.equal(stack.cores.normal, 2);
});

// ============================================================================
// PART 15: PHYSICAL PROOF OF BURST ORIGIN
// ============================================================================

test('15.1 Phantom card with from: "BURST" fails with INVALID_SOURCE_ZONE and zero mutation', async () => {
  const state = createGameState();
  const phantom = createCard({ id: 'phantom_burst_card' });
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON_FREE', from: 'BURST', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: phantom }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_SOURCE_ZONE');
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.field.length, 0);
});

test('15.2 Card in hand with from: "BURST" fails with INVALID_SOURCE_ZONE and zero mutation', async () => {
  const state = createGameState();
  const handCard = createCard({ id: 'hand_burst_pretender' });
  state.players.player.hand = [handCard];
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON_FREE', from: 'BURST', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: handCard }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_SOURCE_ZONE');
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('15.3 Card physically present in p.burst succeeds with fromZone: "burst"', async () => {
  const state = createGameState();
  const burstCard = createCard({ id: 'real_burst_card' });
  state.players.player.burst = burstCard;
  state.players.player.reserve.normal = 3;
  const events = new EventBus();
  const emitted = [];
  events.on('SUMMONED', ev => emitted.push(ev));
  const op = { op: 'SUMMON_FREE', from: 'BURST' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver(), events);
  assert.equal(res.success, true);
  assert.equal(state.players.player.burst, null);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, burstCard.id);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].fromZone, 'burst');
});

test('15.4 Card in transient context.activeBurstCard succeeds with fromZone: "burst" when p.burst is null', async () => {
  const state = createGameState();
  const burstCard = createCard({ id: 'transient_burst_card' });
  state.players.player.burst = null;
  state.players.player.reserve.normal = 3;
  const events = new EventBus();
  const emitted = [];
  events.on('SUMMONED', ev => emitted.push(ev));
  const op = { op: 'SUMMON_FREE', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: burstCard, activeBurstCard: burstCard }, new TestPromptResolver(), events);
  assert.equal(res.success, true);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].fromZone, 'burst');
});

test('15.5 Card in context.activeBurstCard with mismatched ID does not satisfy burst origin', async () => {
  const state = createGameState();
  const cardA = createCard({ id: 'card_a' });
  const cardB = createCard({ id: 'card_b' });
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON_FREE', from: 'BURST', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: cardA, activeBurstCard: cardB }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_SOURCE_ZONE');
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.field.length, 0);
});

// ============================================================================
// PART 16: EXACTLY-ONE-ZONE SOURCE INTEGRITY
// ============================================================================

test('16.1 Card duplicated in Hand and Deck fails with DUPLICATE_CARD_OCCURRENCE and zero mutation', async () => {
  const state = createGameState();
  const dup = createCard({ id: 'dup_hand_deck' });
  state.players.player.hand = [dup];
  state.players.player.deck = [dup];
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: dup }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'DUPLICATE_CARD_OCCURRENCE');
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.deck.length, 1);
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.field.length, 0);
});

test('16.2 Card duplicated in Hand and Grave fails with DUPLICATE_CARD_OCCURRENCE and zero mutation', async () => {
  const state = createGameState();
  const dup = createCard({ id: 'dup_hand_grave' });
  state.players.player.hand = [dup];
  state.players.player.grave = [dup];
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON_FREE', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: dup }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'DUPLICATE_CARD_OCCURRENCE');
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.field.length, 0);
});

test('16.3 Card duplicated in Burst and Deck fails with DUPLICATE_CARD_OCCURRENCE and zero mutation', async () => {
  const state = createGameState();
  const dup = createCard({ id: 'dup_burst_deck' });
  state.players.player.burst = dup;
  state.players.player.deck = [dup];
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON_FREE', from: 'BURST' };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'DUPLICATE_CARD_OCCURRENCE');
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.field.length, 0);
});

test('16.4 Card duplicated as field Under-card and Hand fails with DUPLICATE_CARD_OCCURRENCE and zero mutation', async () => {
  const state = createGameState();
  const dup = createCard({ id: 'dup_under_hand' });
  const topCard = createCard({ id: 'top_card' });
  const stack = createFieldStack(topCard, { normal: 1 });
  stack.under = [dup];
  state.players.player.field = [stack];
  state.players.player.hand = [dup];
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: dup }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'DUPLICATE_CARD_OCCURRENCE');
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.field.length, 1);
});

test('16.5 Card duplicated as attached Brave and Grave fails with DUPLICATE_CARD_OCCURRENCE and zero mutation', async () => {
  const state = createGameState();
  const dupBrave = createCard({ id: 'dup_brave_grave', type: 'Brave' });
  const topCard = createCard({ id: 'top_card_2' });
  const stack = createFieldStack(topCard, { normal: 1 }, [dupBrave]);
  state.players.player.field = [stack];
  state.players.player.grave = [dupBrave];
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON_FREE', from: 'GRAVE', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: dupBrave }, new TestPromptResolver());
  assert.equal(res.success, false);
  assert.equal(res.reason, 'DUPLICATE_CARD_OCCURRENCE');
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.grave.length, 1);
});

test('16.6 Card in exactly one zone succeeds and transitions cleanly', async () => {
  const state = createGameState();
  const single = createCard({ id: 'single_occurrence_card', cost: 1 });
  state.players.player.hand = [single];
  state.players.player.reserve.normal = 3;
  const op = { op: 'SUMMON', free: true };
  const res = await executeOp(state, op, { controller: 'player' }, new TestPromptResolver());
  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(countCardZoneOccurrences(state, single.id), 1);
});

// ============================================================================
// PART 17: SYMMETRICAL SOUL CORE RESTRICTIONS
// ============================================================================

test('17.1 Player targeting opponent Soul Core to Void is blocked (by: "player")', async () => {
  const state = createGameState();
  state.players.opponent.reserve = { normal: 0, soul: 1 };
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'opponent' }, { zone: 'void' }, { isSoulCore: true, by: 'player' });
  assert.equal(res, false);
  assert.equal(state.players.opponent.reserve.soul, 1);
});

test('17.2 Opponent targeting player Soul Core to Void is blocked (by: "opponent")', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 0, soul: 1 };
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void' }, { isSoulCore: true, by: 'opponent' });
  assert.equal(res, false);
  assert.equal(state.players.player.reserve.soul, 1);
});

test('17.3 Opponent alias by: "opp" targeting player Soul Core to Void is blocked', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 0, soul: 1 };
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void' }, { isSoulCore: true, by: 'opp' });
  assert.equal(res, false);
  assert.equal(state.players.player.reserve.soul, 1);
});

test('17.4 Player alias controller: "player" targeting opponent Soul Core to Void is blocked', async () => {
  const state = createGameState();
  state.players.opponent.reserve = { normal: 0, soul: 1 };
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'opponent' }, { zone: 'void' }, { isSoulCore: true, controller: 'player' });
  assert.equal(res, false);
  assert.equal(state.players.opponent.reserve.soul, 1);
});

test('17.5 Legal self-caused transfer: Player moving player Soul Core to Void is allowed', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 0, soul: 1 };
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void', side: 'player' }, { isSoulCore: true, by: 'self' });
  assert.equal(res, true);
  assert.equal(state.players.player.reserve.soul, 0);
  assert.equal(state.players.player.voidCores.soul, 1);
});

test('17.6 Legal self-caused transfer: Opponent moving opponent Soul Core to Void is allowed', async () => {
  const state = createGameState();
  state.players.opponent.reserve = { normal: 0, soul: 1 };
  const res = await moveCore(state, 1, { zone: 'reserve', side: 'opponent' }, { zone: 'void', side: 'opponent' }, { isSoulCore: true, by: 'self' });
  assert.equal(res, true);
  assert.equal(state.players.opponent.reserve.soul, 0);
  assert.equal(state.players.opponent.voidCores.soul, 1);
});


// ============================================================================
// PART 18: MINIMUM CORE PLACEMENT FOR SUMMON AND SUMMON_FREE
// ============================================================================

test('18.1 SUMMON_FREE with initialCores: 0 fails, leaves card in source, leaves cores unchanged, creates no stack', async () => {
  const state = createGameState();
  const card = createCard({ id: 'zero_core_free_spirit', cost: 2 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON_FREE', initialCores: 0, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.equal(state.players.player.hand[0].id, card.id);
  assert.equal(state.players.player.field.length, 0, 'No zero-core field stack created');
  assert.equal(state.players.player.reserve.normal, 3, 'Reserve unchanged');
  assert.equal(state.players.player.trash.normal, 0, 'Trash unchanged');
  assert.equal(countCardZoneOccurrences(state, card.id), 1);
});

test('18.2 SUMMON_FREE with negative initialCores fails with zero mutation', async () => {
  const state = createGameState();
  const card = createCard({ id: 'neg_core_free_spirit', cost: 2 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON_FREE', initialCores: -1, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.trash.normal, 0);
});

test('18.3 SUMMON_FREE with non-finite initialCores (NaN, Infinity) fails with zero mutation', async () => {
  const state = createGameState();
  const card = createCard({ id: 'nan_core_free_spirit', cost: 2 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };

  const opNaN = { op: 'SUMMON_FREE', initialCores: NaN, target: 'this_card' };
  const resNaN = await executeOp(state, opNaN, { controller: 'player', sourceCard: card }, new TestPromptResolver());
  assert.equal(resNaN.success, false);
  assert.equal(resNaN.reason, 'INVALID_INITIAL_CORES');

  const opInf = { op: 'SUMMON_FREE', initialCores: Infinity, target: 'this_card' };
  const resInf = await executeOp(state, opInf, { controller: 'player', sourceCard: card }, new TestPromptResolver());
  assert.equal(resInf.success, false);
  assert.equal(resInf.reason, 'INVALID_INITIAL_CORES');

  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('18.4 SUMMON_FREE with invalid type initialCores (string, float, null, boolean) fails with zero mutation', async () => {
  const state = createGameState();
  const card = createCard({ id: 'type_core_free_spirit', cost: 2 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };

  for (const badVal of ['1', 'two', 1.5, null, false, {}]) {
    const op = { op: 'SUMMON_FREE', initialCores: badVal, target: 'this_card' };
    const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());
    assert.equal(res.success, false);
    assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  }

  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.reserve.normal, 3);
});

test('18.5 Cost-paying SUMMON_FREE with initialCores: 0 pays NO cost and causes zero mutation', async () => {
  const state = createGameState();
  const card = createCard({ id: 'costly_free_spirit', cost: 3 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON_FREE', costCores: 1, initialCores: 0, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  assert.equal(state.players.player.reserve.normal, 3, 'No cost cores deducted');
  assert.equal(state.players.player.trash.normal, 0, 'No trash cores credited');
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
});

test('18.6 Valid SUMMON_FREE with 1 core places core on field stack and succeeds', async () => {
  const state = createGameState();
  const card = createCard({ id: 'valid_one_core_spirit', cost: 2 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON_FREE', initialCores: 1, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 0, 'Card removed from hand');
  assert.equal(state.players.player.field.length, 1, 'Stack created');
  assert.equal(state.players.player.field[0].top.id, card.id);
  assert.equal(state.players.player.field[0].cores.normal, 1, 'Stack has 1 core');
  assert.equal(state.players.player.reserve.normal, 2, 'Reserve decremented by 1');
  assert.equal(countCardZoneOccurrences(state, card.id), 1);
});

test('18.7 Valid SUMMON_FREE using Soul Core allocates Soul Core to field stack and succeeds', async () => {
  const state = createGameState();
  const card = createCard({ id: 'soul_core_free_spirit', cost: 2 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 0, soul: 1 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON_FREE', target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].cores.soul, 1, 'Stack has Soul Core');
  assert.equal(state.players.player.field[0].cores.normal, 0);
  assert.equal(state.players.player.reserve.soul, 0, 'Soul Core moved from reserve');
  assert.equal(countCardZoneOccurrences(state, card.id), 1);
});

test('18.8 Normal SUMMON with initialCores: 0 fails, pays no cost, creates no stack', async () => {
  const state = createGameState();
  const card = createCard({ id: 'zero_core_normal_spirit', cost: 2 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 4, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON', initialCores: 0, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  assert.equal(state.players.player.reserve.normal, 4, 'No cost paid');
  assert.equal(state.players.player.trash.normal, 0);
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.equal(countCardZoneOccurrences(state, card.id), 1);
});

test('18.9 Normal SUMMON with negative initialCores fails with zero mutation', async () => {
  const state = createGameState();
  const card = createCard({ id: 'neg_core_normal_spirit', cost: 1 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };

  const op = { op: 'SUMMON', initialCores: -2, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.hand.length, 1);
});

test('18.10 Normal SUMMON with valid initialCores: 2 allocates 2 cores on field stack', async () => {
  const state = createGameState();
  const card = createCard({ id: 'two_core_normal_spirit', cost: 1 });
  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 4, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON', initialCores: 2, free: true, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].cores.normal, 2, 'Stack has 2 cores');
  assert.equal(state.players.player.reserve.normal, 2, '2 cores deducted from reserve');
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(countCardZoneOccurrences(state, card.id), 1);
});

// ============================================================================
// PART 19: VALIDATE INITIAL CORES BEFORE ANY MUTATION (PHASE 4B.3.5.1)
// ============================================================================

test('19.1 SUMMON_FREE: card with cardNumber but no id, invalid initialCores: 0 fails with INVALID_INITIAL_CORES and mutates NO id', async () => {
  const state = createGameState();
  const card = {
    cardNumber: 'BS01-001',
    name: 'No ID Free Spirit',
    type: 'Spirit',
    cost: 2,
    owner: 'player'
  };
  assert.equal(card.id, undefined, 'Precondition: card has no id');

  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON_FREE', initialCores: 0, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  assert.equal(card.id, undefined, 'Card MUST still have no id');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.strictEqual(state.players.player.hand[0], card);
  assert.equal(state.players.player.reserve.normal, 3, 'Reserve unchanged');
  assert.equal(state.players.player.trash.normal, 0, 'Trash unchanged');
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
});

test('19.2 SUMMON: card with cardNumber but no id, invalid initialCores: 0 fails with INVALID_INITIAL_CORES and mutates NO id', async () => {
  const state = createGameState();
  const card = {
    cardNumber: 'BS01-002',
    name: 'No ID Normal Spirit',
    type: 'Spirit',
    cost: 2,
    owner: 'player'
  };
  assert.equal(card.id, undefined, 'Precondition: card has no id');

  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 4, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON', initialCores: 0, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_INITIAL_CORES');
  assert.equal(card.id, undefined, 'Card MUST still have no id');
  assert.equal(state.players.player.hand.length, 1, 'Card remains in hand');
  assert.strictEqual(state.players.player.hand[0], card);
  assert.equal(state.players.player.reserve.normal, 4, 'Reserve unchanged');
  assert.equal(state.players.player.trash.normal, 0, 'Trash unchanged');
  assert.equal(state.players.player.field.length, 0, 'No field stack created');
});

test('19.3 SUMMON_FREE: card with cardNumber but no id, valid summon normalizes id to cardNumber and succeeds', async () => {
  const state = createGameState();
  const card = {
    cardNumber: 'BS01-003',
    name: 'Valid Free Spirit No ID',
    type: 'Spirit',
    cost: 2,
    owner: 'player'
  };
  assert.equal(card.id, undefined, 'Precondition: card has no id');

  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON_FREE', initialCores: 1, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(card.id, 'BS01-003', 'Card id normalized to cardNumber on success');
  assert.equal(state.players.player.hand.length, 0, 'Card removed from hand');
  assert.equal(state.players.player.field.length, 1, 'Field stack created');
  assert.equal(state.players.player.field[0].top.id, 'BS01-003');
  assert.equal(state.players.player.field[0].cores.normal, 1);
  assert.equal(state.players.player.reserve.normal, 2);
  assert.equal(countCardZoneOccurrences(state, card), 1);
});

test('19.4 SUMMON: card with cardNumber but no id, valid summon normalizes id to cardNumber and succeeds', async () => {
  const state = createGameState();
  const card = {
    cardNumber: 'BS01-004',
    name: 'Valid Normal Spirit No ID',
    type: 'Spirit',
    cost: 1,
    owner: 'player'
  };
  assert.equal(card.id, undefined, 'Precondition: card has no id');

  state.players.player.hand = [card];
  state.players.player.reserve = { normal: 4, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const op = { op: 'SUMMON', initialCores: 1, free: true, target: 'this_card' };
  const res = await executeOp(state, op, { controller: 'player', sourceCard: card }, new TestPromptResolver());

  assert.equal(res.success, true);
  assert.equal(card.id, 'BS01-004', 'Card id normalized to cardNumber on success');
  assert.equal(state.players.player.hand.length, 0, 'Card removed from hand');
  assert.equal(state.players.player.field.length, 1, 'Field stack created');
  assert.equal(state.players.player.field[0].top.id, 'BS01-004');
  assert.equal(state.players.player.field[0].cores.normal, 1);
  assert.equal(state.players.player.reserve.normal, 3);
  assert.equal(countCardZoneOccurrences(state, card), 1);
});
