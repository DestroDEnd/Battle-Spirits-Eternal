/**
 * tests/phase4b2_2_final_fixes.test.js
 * 
 * Comprehensive Test Suite for Phase 4B.2.2:
 * 1. Correct emitAsyncEvent() — single invocation, async completion, error propagation
 * 2. Armor/Immunity rules on separate Nexus candidates (p.nexus)
 * 3. Actual compiled-IR integration tests from data/ir_shards (BS14-105, BS15-080, BS09-X35, BS32-X06)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { executeOp, emitAsyncEvent } from '../engine/ops/index.js';
import { EventBus } from '../engine/events.js';
import { createFieldStack } from '../engine/state.js';
import { queryCandidates } from '../engine/selectors.js';

function createGameState() {
  return {
    turn: 1,
    step: 'MAIN',
    activePlayer: 'player',
    players: {
      player: {
        id: 'p1',
        life: 5,
        field: [],
        hand: [],
        deck: [],
        grave: [],
        trash: [],
        removed: [],
        reserve: { normal: 10, soul: false },
        nexus: []
      },
      opponent: {
        id: 'p2',
        life: 5,
        field: [],
        hand: [],
        deck: [],
        grave: [],
        trash: [],
        removed: [],
        reserve: { normal: 10, soul: false },
        nexus: []
      }
    },
    modifiers: []
  };
}

function createMockCard(id, name, overrides = {}) {
  return {
    id,
    name,
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    colors: ['Red'],
    symbols: ['Red'],
    levels: { 1: { bp: 3000, cost: 1 }, 2: { bp: 5000, cost: 2 } },
    ...overrides
  };
}

// Helper to load actual compiled card record from data/ir_shards
function loadShardCard(shardName, cardNumber) {
  const shardPath = path.resolve('data', 'ir_shards', `${shardName}.json`);
  const data = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  const card = data[cardNumber];
  if (!card) {
    throw new Error(`Card ${cardNumber} not found in shard ${shardName}`);
  }
  return card;
}

// =============================================================================
// 1. emitAsyncEvent() CONTRACT & ASYNC COMPLETION
// =============================================================================

test('1.1 emitAsyncEvent dispatches each event exactly once with canonical eventObj', async () => {
  const events = new EventBus();
  let invocationCount = 0;
  const receivedEvents = [];

  events.on('BOUNCED', (ev) => {
    invocationCount++;
    receivedEvents.push(ev);
  });

  await emitAsyncEvent(events, 'BOUNCED', {
    cards: [{ id: 'C1' }],
    destination: 'hand',
    player: 'player'
  });

  assert.equal(invocationCount, 1, 'Event listener must be invoked exactly once');
  assert.equal(receivedEvents.length, 1);
  assert.equal(receivedEvents[0].type, 'BOUNCED');
  assert.equal(receivedEvents[0].destination, 'hand');
  assert.equal(receivedEvents[0].player, 'player');
});

test('1.2 emitAsyncEvent preserves asynchronous listener completion before resolving', async () => {
  const events = new EventBus();
  let step = 0;

  events.on('TEST_ASYNC', async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
    step = 1;
  });

  await emitAsyncEvent(events, 'TEST_ASYNC', { data: 123 });
  assert.equal(step, 1, 'emitAsyncEvent must await async listener completion');
});

test('1.3 emitAsyncEvent propagates genuine handler errors if bus rethrows or rejects', async () => {
  const throwingBus = {
    emit: async (eventObj) => {
      throw new Error('HANDLER_FAILURE: ' + eventObj.type);
    }
  };

  await assert.rejects(
    async () => {
      await emitAsyncEvent(throwingBus, 'CARD_MOVED', { id: 'C1' });
    },
    /HANDLER_FAILURE: CARD_MOVED/,
    'Genuine event bus failures must propagate rather than be silently ignored'
  );
});

// =============================================================================
// 2. ARMOR & IMMUNITY ON SEPARATE NEXUS CANDIDATES (p.nexus)
// =============================================================================

test('2.1 Opposing separate Nexus with Armor: Red is immune to Red effect and excluded from candidates', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-ARMOR', 'Ruby Shrine', {
    type: 'Nexus',
    cost: 3,
    color: 'Red',
    keywords: [{ name: 'Armor', parameter: 'Red' }]
  });
  state.players.opponent.nexus = [nexusCard];

  const redSource = createMockCard('SRC-RED', 'Red Dragon', { color: 'Red' });
  const context = { controller: 'player', sourceCard: redSource };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp'
  }, context);

  assert.equal(candidates.length, 0, 'Opposing Nexus with Armor: Red must be immune to Red effect');
});

test('2.2 Opposing separate Nexus with Armor: Red is selectable when ignoreArmor is true', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-ARMOR', 'Ruby Shrine', {
    type: 'Nexus',
    cost: 3,
    color: 'Red',
    keywords: [{ name: 'Armor', parameter: 'Red' }]
  });
  state.players.opponent.nexus = [nexusCard];

  const redSource = createMockCard('SRC-RED', 'Red Dragon', { color: 'Red' });
  const context = { controller: 'player', sourceCard: redSource };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp',
    ignoreArmor: true
  }, context);

  assert.equal(candidates.length, 1, 'ignoreArmor must bypass Armor immunity on Nexus');
  assert.equal(candidates[0].card.id, 'NEX-ARMOR');
});

test('2.3 Opposing separate Nexus with PROTECTION (cannotBeDestroyed) is excluded from DESTROY targeting', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-PROT', 'Iron Bastion', {
    type: 'Nexus',
    cost: 3
  });
  state.players.opponent.nexus = [nexusCard];
  state.modifiers = [{
    id: 'mod_prot_dest',
    type: 'PROTECTION',
    targetCardId: nexusCard.id,
    cannotBeDestroyed: true
  }];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp',
    effectType: 'destroy'
  }, context);

  assert.equal(candidates.length, 0, 'Nexus with cannotBeDestroyed must be excluded from destroy candidates');
});

test('2.4 Opposing separate Nexus with PROTECTION (cannotBeBounced) is excluded from BOUNCE targeting', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-BOUNCE-PROT', 'Stone Citadel', {
    type: 'Nexus',
    cost: 4
  });
  state.players.opponent.nexus = [nexusCard];
  state.modifiers = [{
    id: 'mod_prot_bounce',
    type: 'PROTECTION',
    targetCardId: nexusCard.id,
    cannotBeBounced: true
  }];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp',
    effectType: 'bounce'
  }, context);

  assert.equal(candidates.length, 0, 'Nexus with cannotBeBounced must be excluded from bounce candidates');
});

test('2.5 ignoreArmor does NOT bypass unrelated PROTECTION modifiers on Nexus', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-INDES', 'Indestructible Gate', {
    type: 'Nexus',
    cost: 4
  });
  state.players.opponent.nexus = [nexusCard];
  state.modifiers = [{
    id: 'mod_indes',
    type: 'PROTECTION',
    targetCardId: nexusCard.id,
    cannotBeDestroyed: true
  }];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp',
    effectType: 'destroy',
    ignoreArmor: true
  }, context);

  assert.equal(candidates.length, 0, 'ignoreArmor must not bypass non-Armor protection modifiers');
});

test('2.6 Friendly separate Nexus with Armor is eligible for friendly targeting (opposing check)', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-FRIENDLY', 'Holy Altar', {
    type: 'Nexus',
    cost: 2,
    color: 'Red',
    keywords: [{ name: 'Armor', parameter: 'Red' }]
  });
  state.players.player.nexus = [nexusCard];

  const redSource = createMockCard('SRC-RED', 'Red Dragon', { color: 'Red' });
  const context = { controller: 'player', sourceCard: redSource };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'self'
  }, context);

  assert.equal(candidates.length, 1, 'Friendly Nexus with Armor is not immune to own effects');
  assert.equal(candidates[0].card.id, 'NEX-FRIENDLY');
});

// =============================================================================
// 3. ACTUAL COMPILED-IR INTEGRATION TESTS (BS14-105, BS15-080, BS09-X35, BS32-X06)
// =============================================================================

test('3.1 Genuine compiled IR integration: BS14-105 (Glacial Slash) bounces to decktop', async () => {
  const cardRecord = loadShardCard('BS14', 'BS14-105');
  assert.equal(cardRecord.cardNumber, 'BS14-105');
  
  // Extract ability BS14-105#a0, clause 0
  const ability = cardRecord.abilities.find(a => (a.id === 'BS14-105#a0' || a.legacyId === 'BS14-105#a0'));
  assert.ok(ability, 'Ability BS14-105#a0 must exist');
  const clause = ability.clauses[0];
  assert.ok(clause, 'Clause 0 must exist');
  assert.equal(clause.op.op, 'BOUNCE');
  assert.equal(clause.op.destination, 'DECK');
  assert.ok(clause.cleanText.toLowerCase().includes('decktop'));

  // Setup game state with target
  const state = createGameState();
  const targetCard = createMockCard('OPP-SP-01', 'Opposing Spirit', { cost: 4 });
  const targetStack = createFieldStack(targetCard, 1);
  state.players.opponent.field = [targetStack];
  state.players.opponent.deck = [
    createMockCard('D1', 'Deck Card 1'),
    createMockCard('D2', 'Deck Card 2')
  ];

  const context = {
    controller: 'player',
    sourceCard: cardRecord,
    currentClause: clause
  };
  const promptResolver = {
    choose: async (prompt) => [prompt.candidates[0]]
  };

  const res = await executeOp(state, clause.op, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.bouncedCount, 1);
  assert.equal(state.players.opponent.field.length, 0, 'Target removed from field');
  assert.equal(state.players.opponent.deck.length, 3, 'Deck size increased by 1');
  assert.equal(state.players.opponent.deck[0].id, 'OPP-SP-01', 'Target placed on decktop (index 0)');
});

test('3.2 Genuine compiled IR integration: BS15-080 (Triple Stab) bounces to deckbottom', async () => {
  const cardRecord = loadShardCard('BS15', 'BS15-080');
  assert.equal(cardRecord.cardNumber, 'BS15-080');

  // Extract ability BS15-080#a1, clause 0
  const ability = cardRecord.abilities.find(a => (a.id === 'BS15-080#a1' || a.legacyId === 'BS15-080#a1'));
  assert.ok(ability, 'Ability BS15-080#a1 must exist');
  const clause = ability.clauses[0];
  assert.ok(clause, 'Clause 0 must exist');
  assert.equal(clause.op.op, 'BOUNCE');
  assert.equal(clause.op.destination, 'DECK');
  assert.ok(clause.cleanText.toLowerCase().includes('deckbottom'));

  // Setup game state with target
  const state = createGameState();
  const targetCard = createMockCard('OPP-SP-02', 'Opposing Spirit 2', { cost: 5 });
  const targetStack = createFieldStack(targetCard, 1);
  state.players.opponent.field = [targetStack];
  state.players.opponent.deck = [
    createMockCard('D1', 'Deck Card 1'),
    createMockCard('D2', 'Deck Card 2')
  ];

  const context = {
    controller: 'player',
    sourceCard: cardRecord,
    currentClause: clause
  };
  const promptResolver = {
    choose: async (prompt) => [prompt.candidates[0]]
  };

  const res = await executeOp(state, clause.op, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.bouncedCount, 1);
  assert.equal(state.players.opponent.field.length, 0, 'Target removed from field');
  assert.equal(state.players.opponent.deck.length, 3, 'Deck size increased by 1');
  assert.equal(state.players.opponent.deck[state.players.opponent.deck.length - 1].id, 'OPP-SP-02', 'Target placed on deckbottom (last index)');
});

test('3.3 Genuine compiled IR integration: BS09-X35 (Siegwurm-Nova) TOTAL_BP_LTE up to 10000 BP', async () => {
  const cardRecord = loadShardCard('BS09', 'BS09-X35');
  assert.equal(cardRecord.cardNumber, 'BS09-X35');

  // Extract ability BS09-X35#a2, clause 0
  const ability = cardRecord.abilities.find(a => (a.id === 'BS09-X35#a2' || a.legacyId === 'BS09-X35#a2'));
  assert.ok(ability, 'Ability BS09-X35#a2 must exist');
  const clause = ability.clauses[0];
  assert.ok(clause, 'Clause 0 must exist');
  assert.equal(clause.op.op, 'DESTROY');
  assert.equal(clause.op.mode, 'TOTAL_BP_LTE');
  assert.equal(clause.op.maxTotalBp, 10000);

  // Setup game state with opposing targets summing to 10000 BP (4000 + 6000)
  const state = createGameState();
  const sp1 = createMockCard('OPP-BP-4K', 'Spirit 4000 BP', {
    levels: { 1: { bp: 4000, cost: 1 } }
  });
  const sp2 = createMockCard('OPP-BP-6K', 'Spirit 6000 BP', {
    levels: { 1: { bp: 6000, cost: 1 } }
  });
  const sp3 = createMockCard('OPP-BP-12K', 'Spirit 12000 BP', {
    levels: { 1: { bp: 12000, cost: 1 } }
  });
  state.players.opponent.field = [
    createFieldStack(sp1, 1),
    createFieldStack(sp2, 1),
    createFieldStack(sp3, 1)
  ];

  const context = {
    controller: 'player',
    sourceCard: cardRecord,
    currentClause: clause
  };
  const promptResolver = {
    choose: async (prompt) => {
      // Choose sp1 and sp2 (4000 + 6000 = 10000 <= 10000)
      return prompt.candidates.filter(c => c.card.id === 'OPP-BP-4K' || c.card.id === 'OPP-BP-6K');
    }
  };

  const res = await executeOp(state, clause.op, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 1, 'Only sp3 remains on field');
  assert.equal(state.players.opponent.field[0].top.id, 'OPP-BP-12K');
  assert.equal(state.players.opponent.grave.length, 2, 'Two spirits destroyed to grave');
});

test('3.4 Genuine compiled IR integration: BS32-X06 (Senju) TOTAL_COST_LTE up to total cost 10', async () => {
  const cardRecord = loadShardCard('BS32', 'BS32-X06');
  assert.equal(cardRecord.cardNumber, 'BS32-X06');

  // Extract ability BS32-X06#a0, clause 2
  const ability = cardRecord.abilities.find(a => (a.id === 'BS32-X06#a0' || a.legacyId === 'BS32-X06#a0'));
  assert.ok(ability, 'Ability BS32-X06#a0 must exist');
  const clause = ability.clauses[2];
  assert.ok(clause, 'Clause 2 must exist');
  assert.equal(clause.op.op, 'DESTROY');
  assert.equal(clause.op.mode, 'TOTAL_COST_LTE');
  assert.equal(clause.op.maxTotalCost, 10);

  // Setup game state with opposing targets summing to cost 10 (Cost 4 + Cost 6)
  const state = createGameState();
  const sp1 = createMockCard('OPP-C4', 'Spirit Cost 4', { cost: 4 });
  const sp2 = createMockCard('OPP-C6', 'Spirit Cost 6', { cost: 6 });
  const sp3 = createMockCard('OPP-C8', 'Spirit Cost 8', { cost: 8 });
  state.players.opponent.field = [
    createFieldStack(sp1, 1),
    createFieldStack(sp2, 1),
    createFieldStack(sp3, 1)
  ];

  const context = {
    controller: 'player',
    sourceCard: cardRecord,
    currentClause: clause
  };
  const promptResolver = {
    choose: async (prompt) => {
      // Choose sp1 and sp2 (4 + 6 = 10 <= 10)
      return prompt.candidates.filter(c => c.card.id === 'OPP-C4' || c.card.id === 'OPP-C6');
    }
  };

  const res = await executeOp(state, clause.op, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 1, 'Only sp3 remains on field');
  assert.equal(state.players.opponent.field[0].top.id, 'OPP-C8');
  assert.equal(state.players.opponent.grave.length, 2, 'Two cards destroyed to grave');
});
