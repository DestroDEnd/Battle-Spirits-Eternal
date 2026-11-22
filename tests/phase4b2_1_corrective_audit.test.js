/**
 * tests/phase4b2_1_corrective_audit.test.js
 * 
 * Corrective Audit & Regression Test Suite for Phase 4B.2.1:
 * 1. Separate Nexus-zone card movement (p.nexus)
 * 2. Simultaneous destruction batch semantics & trigger evaluation
 * 3. Awaiting asynchronous BOUNCED events (self & normal target)
 * 4. Generic deck destination semantics (real IR shards & ambiguous rejection)
 * 5. Aggregate BP & Cost semantics and zero-threshold handling (maxTotalBp: 0, maxTotalCost: 0)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, createFieldStack } from '../engine/state.js';
import { executeOp, resolveBounceDestination, getBouncePromptTitle } from '../engine/ops/index.js';
import { moveCard } from '../engine/zones.js';
import { executeTargeting, queryCandidates, validateSelection } from '../engine/selectors.js';
import { EventBus } from '../engine/events.js';

function createMockCard(id, name, overrides = {}) {
  const bpVal = overrides.bp !== undefined ? overrides.bp : 3000;
  return {
    id,
    name,
    card_number: id,
    cardNumber: id,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 3,
    level: 1,
    bp: bpVal,
    owner: 'opponent',
    currentOwner: 'opponent',
    levels: {
      1: { bp: bpVal, cost: 1 },
      2: { bp: bpVal + 2000, cost: 3 }
    },
    ap: {
      levels: [
        { level: 1, bp: bpVal, cost: 1 },
        { level: 2, bp: bpVal + 2000, cost: 3 }
      ]
    },
    ...overrides
  };
}

// =============================================================================
// 1. SEPARATE NEXUS-ZONE CARD MOVEMENT (p.nexus)
// =============================================================================

test('1.1 DESTROY of separately stored Nexus card moves it to grave and clears p.nexus', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-001', 'Volcanic Canyon', {
    type: 'Nexus',
    cost: 3,
    cores: 1
  });
  state.players.opponent.nexus = [nexusCard];
  state.players.opponent.reserve.normal = 0;

  const events = new EventBus();
  const emittedEvents = [];
  events.on('CARD_MOVED', ev => emittedEvents.push(ev));
  events.on('DESTROYED', ev => emittedEvents.push(ev));

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      assert.equal(prompt.candidates.length, 1);
      assert.equal(prompt.candidates[0].zone, 'nexus');
      return [prompt.candidates[0]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    types: ['Nexus'],
    zone: 'nexus'
  }, context, promptResolver, events);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 1);
  assert.equal(state.players.opponent.nexus.length, 0, 'Card must be removed from p.nexus');
  assert.equal(state.players.opponent.grave.length, 1, 'Card must be in grave exactly once');
  assert.equal(state.players.opponent.grave[0].id, 'NEX-001');
  assert.equal(state.players.opponent.reserve.normal, 1, 'Cores on nexus returned to reserve');

  const cardMoved = emittedEvents.find(e => e.type === 'CARD_MOVED');
  assert.ok(cardMoved);
  assert.equal(cardMoved.fromZone, 'nexus');
  assert.equal(cardMoved.toZone, 'grave');

  const destroyed = emittedEvents.find(e => e.type === 'DESTROYED');
  assert.ok(destroyed);
  assert.equal(destroyed.fromZone, 'nexus');
});

test('1.2 BOUNCE of separately stored Nexus card returns it to hand from p.nexus', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-002', 'Grand Canyon', {
    type: 'Nexus',
    cost: 4
  });
  state.players.opponent.nexus = [nexusCard];
  state.players.opponent.reserve.normal = 0;

  const events = new EventBus();
  const emittedEvents = [];
  events.on('CARD_MOVED', ev => emittedEvents.push(ev));
  events.on('BOUNCED', ev => emittedEvents.push(ev));

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (p) => [p.candidates[0]]
  };

  const res = await executeOp(state, {
    op: 'BOUNCE',
    types: ['Nexus'],
    zone: 'nexus',
    destination: 'hand'
  }, context, promptResolver, events);

  assert.equal(res.success, true);
  assert.equal(res.bouncedCount, 1);
  assert.equal(state.players.opponent.nexus.length, 0, 'Nexus removed from p.nexus');
  assert.equal(state.players.opponent.hand.length, 1, 'Nexus present in hand');
  assert.equal(state.players.opponent.hand[0].id, 'NEX-002');

  const cardMoved = emittedEvents.find(e => e.type === 'CARD_MOVED');
  assert.ok(cardMoved);
  assert.equal(cardMoved.fromZone, 'nexus');
  assert.equal(cardMoved.toZone, 'hand');
});

test('1.3 Failed movement of Nexus due to PROTECTION leaves p.nexus completely unmutated', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-003', 'Fortified Shrine', { type: 'Nexus', cost: 3 });
  state.players.opponent.nexus = [nexusCard];
  state.players.opponent.reserve.normal = 0;

  state.modifiers = [{
    id: 'prot_nex',
    type: 'PROTECTION',
    targetCardId: nexusCard.id,
    cannotBeDestroyed: true
  }];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (p) => [p.candidates[0]]
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    types: ['Nexus'],
    zone: 'nexus'
  }, context, promptResolver);

  assert.equal(res.destroyedCount, 0);
  assert.equal(state.players.opponent.nexus.length, 1, 'Nexus must remain in p.nexus');
  assert.equal(state.players.opponent.grave.length, 0);
});

// =============================================================================
// 2. SIMULTANEOUS DESTRUCTION BATCH SEMANTICS
// =============================================================================

test('2.1 Simultaneous destruction removes all batch cards from field before triggers evaluate', async () => {
  const state = createGameState();
  const c1 = createMockCard('BATCH-001', 'Spirit 1', { bp: 3000 });
  const c2 = createMockCard('BATCH-002', 'Spirit 2', { bp: 4000 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 })
  ];

  const events = new EventBus();
  const fieldSnapshotsAtDestruction = [];

  events.on('DESTROYED', ev => {
    // When DESTROYED event fires for either card, the opponent field must already have 0 spirits!
    fieldSnapshotsAtDestruction.push({
      destroyedCard: ev.card.id,
      remainingFieldCount: state.players.opponent.field.length,
      remainingGraveCount: state.players.opponent.grave.length
    });
  });

  let batchEventReceived = false;
  events.on('DESTROYED_BATCH', ev => {
    batchEventReceived = true;
    assert.equal(ev.cards.length, 2);
  });

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const res = await executeOp(state, {
    op: 'DESTROY',
    all: true
  }, context, { choose: async () => [] }, events);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(batchEventReceived, true);
  assert.equal(fieldSnapshotsAtDestruction.length, 2);

  // Crucial invariant: For BOTH destruction events, the field count must be 0!
  assert.equal(fieldSnapshotsAtDestruction[0].remainingFieldCount, 0, 'First trigger must see field already cleared');
  assert.equal(fieldSnapshotsAtDestruction[1].remainingFieldCount, 0, 'Second trigger must see field already cleared');
  assert.equal(fieldSnapshotsAtDestruction[0].remainingGraveCount, 2, 'First trigger must see both in grave');
  assert.equal(fieldSnapshotsAtDestruction[1].remainingGraveCount, 2, 'Second trigger must see both in grave');
});

// =============================================================================
// 3. AWAIT BOUNCED EVENTS
// =============================================================================

test('3.1 BOUNCE awaits asynchronous BOUNCED event processing before executeOp resolves (normal target)', async () => {
  const state = createGameState();
  const targetCard = createMockCard('TGT-001', 'Target Spirit');
  state.players.opponent.field = [createFieldStack(targetCard, { normal: 1, soul: 0 })];

  const events = new EventBus();
  let asyncWorkCompleted = false;

  events.on('BOUNCED', async (ev) => {
    // Simulate async pipeline work (e.g. prompt, network dispatch, animations)
    await new Promise(resolve => setTimeout(resolve, 30));
    asyncWorkCompleted = true;
  });

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (p) => [p.candidates[0]]
  };

  const res = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'hand'
  }, context, promptResolver, events);

  assert.equal(res.success, true);
  assert.equal(asyncWorkCompleted, true, 'executeOp must NOT resolve before async BOUNCED handler finishes');
});

test('3.2 BOUNCE awaits asynchronous BOUNCED event processing for self-target', async () => {
  const state = createGameState();
  const selfCard = createMockCard('SELF-001', 'Self Spirit', { owner: 'player' });
  state.players.player.field = [createFieldStack(selfCard, { normal: 1, soul: 0 })];

  const events = new EventBus();
  let selfBounceHandlerFinished = false;

  events.on('BOUNCED', async (ev) => {
    await new Promise(resolve => setTimeout(resolve, 30));
    selfBounceHandlerFinished = true;
  });

  const context = { controller: 'player', sourceCard: selfCard };
  const res = await executeOp(state, {
    op: 'BOUNCE',
    target: 'self',
    destination: 'hand'
  }, context, { choose: async () => [] }, events);

  assert.equal(res.success, true);
  assert.equal(selfBounceHandlerFinished, true, 'Self-bounce must await BOUNCED event before resolving');
  assert.equal(state.players.player.hand[0].id, 'SELF-001');
});

// =============================================================================
// 4. GENERIC DECK DESTINATION SEMANTICS
// =============================================================================

test('4.1 Real IR shard card: BS14-105 Glacial Slash routes destination DECK with text "decktop" to deck_top', () => {
  const clause = {
    cleanText: 'Return an opposing Spirit to the decktop',
    op: { op: 'BOUNCE', destination: 'DECK' }
  };
  const dest = resolveBounceDestination(clause.op, clause);
  assert.equal(dest, 'deck_top', 'BS14-105 text requires decktop routing');
});

test('4.2 Real IR shard card: BS15-080 Triple Stab routes destination DECK with text "deckbottom" to deck_bottom', () => {
  const clause = {
    cleanText: 'Return an opposing Spirit to the deckbottom',
    op: { op: 'BOUNCE', destination: 'DECK' }
  };
  const dest = resolveBounceDestination(clause.op, clause);
  assert.equal(dest, 'deck_bottom', 'BS15-080 text requires deckbottom routing');
});

test('4.3 Ambiguous deck destination without top/bottom evidence is safely rejected rather than guessing', async () => {
  const state = createGameState();
  const c = createMockCard('C-001', 'Target');
  state.players.opponent.field = [createFieldStack(c, { normal: 1, soul: 0 })];

  const context = {
    controller: 'player',
    sourceCard: createMockCard('SRC-001', 'Source'),
    currentClause: { cleanText: 'Return an opposing Spirit to the deck' } // Ambiguous!
  };

  const res = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'DECK'
  }, context, { choose: async (p) => [p.candidates[0]] });

  assert.equal(res.success, false);
  assert.equal(res.reason, 'UNSUPPORTED_OR_AMBIGUOUS_DESTINATION', 'Ambiguous destination must not silently guess');
  assert.equal(state.players.opponent.field.length, 1, 'Card must remain on field when destination is ambiguous');
});

// =============================================================================
// 5. AGGREGATE BP/COST & ZERO-THRESHOLD HANDLING
// =============================================================================

test('5.1 Real IR shard card: BS09-X35 Siegwurm-Nova (TOTAL_BP_LTE 10000 BP) allows multiple up to sum', async () => {
  const state = createGameState();
  const c1 = createMockCard('NOVA-001', 'Spirit 1', { bp: 4000 });
  const c2 = createMockCard('NOVA-002', 'Spirit 2', { bp: 6000 });
  const c3 = createMockCard('NOVA-003', 'Spirit 3', { bp: 3000 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 }),
    createFieldStack(c3, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Siegwurm-Nova') };
  const promptResolver = {
    choose: async (p) => {
      // Choose c1 (4000) + c2 (6000) = 10000 <= 10000
      return [p.candidates[0], p.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_BP_LTE',
    maxTotalBp: 10000
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 1);
});

test('5.2 Real IR shard card: BS32-X06 The LotusMonarch Senju (TOTAL_COST_LTE 10) allows multiple up to sum', async () => {
  const state = createGameState();
  const c1 = createMockCard('SENJU-001', 'Spirit 1', { cost: 4 });
  const c2 = createMockCard('SENJU-002', 'Spirit 2', { cost: 6 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Senju') };
  const promptResolver = {
    choose: async (p) => [p.candidates[0], p.candidates[1]]
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_COST_LTE',
    maxTotalCost: 10
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
});

test('5.3 Zero-threshold handling: maxTotalBp: 0 is NOT swallowed by || fallback and rejects BP > 0', async () => {
  const state = createGameState();
  const c1 = createMockCard('BP-POS', 'Positive BP Spirit', { bp: 3000 });
  state.players.opponent.field = [createFieldStack(c1, { normal: 1, soul: 0 })];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };

  // When maxTotalBp is 0, a 3000 BP spirit is not a legal candidate
  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_BP_LTE',
    maxTotalBp: 0
  }, context, { choose: async () => [] });

  assert.equal(res.success, false);
  assert.equal(res.reason, 'NO_LEGAL_TARGETS');
});

test('5.4 Zero-threshold handling: maxTotalCost: 0 allows Cost 0 and rejects Cost > 0', async () => {
  const state = createGameState();
  const cZero = createMockCard('COST-0', 'Cost 0 Spirit', { cost: 0 });
  const cPos = createMockCard('COST-3', 'Cost 3 Spirit', { cost: 3 });

  state.players.opponent.field = [
    createFieldStack(cZero, { normal: 1, soul: 0 }),
    createFieldStack(cPos, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (p) => {
      // Only 1 candidate should be available (the 0-cost spirit)
      assert.equal(p.candidates.length, 1);
      assert.equal(p.candidates[0].card.id, 'COST-0');
      return [p.candidates[0]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_COST_LTE',
    maxTotalCost: 0
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 1);
  assert.equal(state.players.opponent.grave[0].id, 'COST-0');
});
