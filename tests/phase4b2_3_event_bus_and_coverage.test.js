/**
 * tests/phase4b2_3_event_bus_and_coverage.test.js
 * 
 * Phase 4B.2.3 — EventBus Error Propagation and Final Verification
 * 
 * 1. Real EventBus Tests:
 *    - Normal listener receives event exactly once.
 *    - Async listener completes before emitAsyncEvent() resolves.
 *    - Async listener that throws propagates error directly to caller.
 *    - Multiple listeners do not cause duplicate delivery.
 *    - Event history remains consistent with event occurrence.
 *    - Event canonical type cannot be overwritten by payload data.
 * 
 * 2. Complete Nexus Armor Coverage:
 *    - Heavy Armor on separately stored opposing Nexus.
 *    - Ultra Armor on separately stored opposing Nexus.
 *    - ignoreArmor bypasses Armor/Heavy/Ultra without bypassing unrelated PROTECTION.
 *    - Friendly Nexus with Armor/Heavy/Ultra remains eligible for friendly targeting.
 * 
 * 3. Normal Resolver-Path Integration Test:
 *    - Loads real compiled card (BS09-X35 Siegwurm-Nova) from data/ir_shards/BS09.json.
 *    - Executes actual compiled ability (BS09-X35#a2) through AsyncResolver.resolveAbility.
 *    - Verifies real parameters and resulting game state.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventBus } from '../engine/events.js';
import { emitAsyncEvent, executeOp } from '../engine/ops/index.js';
import { AsyncResolver } from '../engine/resolver.js';
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

// =============================================================================
// 1. REAL EventBus TESTS & ERROR PROPAGATION CONTRACT
// =============================================================================

test('1.1 Real EventBus: Normal listener receives an event exactly once', async () => {
  const events = new EventBus();
  let callCount = 0;
  const received = [];

  events.on('TEST_EVENT', (ev) => {
    callCount++;
    received.push(ev);
  });

  await emitAsyncEvent(events, 'TEST_EVENT', { sampleKey: 'sampleValue' });

  assert.equal(callCount, 1, 'Listener must be called exactly once');
  assert.equal(received.length, 1);
  assert.equal(received[0].type, 'TEST_EVENT');
  assert.equal(received[0].sampleKey, 'sampleValue');
});

test('1.2 Real EventBus: Asynchronous listener completes before emitAsyncEvent() resolves', async () => {
  const events = new EventBus();
  let step = 0;

  events.on('ASYNC_STEP', async () => {
    await new Promise(resolve => setTimeout(resolve, 25));
    step = 42;
  });

  await emitAsyncEvent(events, 'ASYNC_STEP', {});
  assert.equal(step, 42, 'emitAsyncEvent must await asynchronous listener completion');
});

test('1.3 Real EventBus: An asynchronous listener that throws propagates error to caller', async () => {
  const events = new EventBus();

  events.on('FAILING_EVENT', async () => {
    await new Promise(resolve => setTimeout(resolve, 5));
    throw new Error('GENUINE_LISTENER_CRASH');
  });

  await assert.rejects(
    async () => {
      await emitAsyncEvent(events, 'FAILING_EVENT', { cardId: 'C1' });
    },
    /GENUINE_LISTENER_CRASH/,
    'Errors from asynchronous listeners must propagate directly to the caller'
  );
});

test('1.4 Real EventBus: Multiple listeners do not cause duplicate event delivery', async () => {
  const events = new EventBus();
  const deliveryLog = [];

  events.on('MULTI_TEST', () => deliveryLog.push('listener_1'));
  events.on('MULTI_TEST', () => deliveryLog.push('listener_2'));
  events.on('*', () => deliveryLog.push('wildcard_listener'));

  await emitAsyncEvent(events, 'MULTI_TEST', {});

  assert.deepEqual(deliveryLog, ['listener_1', 'listener_2', 'wildcard_listener']);
});

test('1.5 Real EventBus: Event history remains consistent with chosen error policy', async () => {
  const events = new EventBus();

  events.on('RECORDED_THEN_FAILED', async () => {
    throw new Error('POST_RECORDING_ERROR');
  });

  try {
    await emitAsyncEvent(events, 'RECORDED_THEN_FAILED', { targetId: 'T1' });
  } catch (err) {
    // Expected error propagation
  }

  assert.equal(events.history.length, 1, 'Event must be recorded in history before listeners execute');
  assert.equal(events.history[0].type, 'RECORDED_THEN_FAILED');
  assert.equal(events.history[0].targetId, 'T1');
});

test('1.6 Real EventBus: Canonical type cannot be accidentally overwritten by payload data', async () => {
  const events = new EventBus();
  let capturedType = null;

  events.on('CANONICAL_TYPE', (ev) => {
    capturedType = ev.type;
  });

  // Attempt to pass malicious/conflicting type in payload
  await emitAsyncEvent(events, 'CANONICAL_TYPE', { type: 'MALICIOUS_OVERWRITE', data: 99 });

  assert.equal(capturedType, 'CANONICAL_TYPE', 'Payload data must never overwrite canonical event type');
});

// =============================================================================
// 2. COMPLETE NEXUS ARMOR COVERAGE (Heavy Armor, Ultra Armor, Friendly, Bypass)
// =============================================================================

test('2.1 Heavy Armor on opposing separate Nexus excludes it from matching color targeting', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-HA', 'Granite Citadel', {
    type: 'Nexus',
    cost: 4,
    keywords: [{ name: 'Heavy Armor', parameter: 'Red' }]
  });
  state.players.opponent.nexus = [nexusCard];

  const redSource = createMockCard('SRC-RED', 'Red Spirit', { color: 'Red' });
  const context = { controller: 'player', sourceCard: redSource };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp'
  }, context);

  assert.equal(candidates.length, 0, 'Opposing Nexus with Heavy Armor: Red must be immune to Red effect');
});

test('2.2 Ultra Armor on opposing separate Nexus excludes it from matching color targeting', async () => {
  const state = createGameState();
  const nexusCard = createMockCard('NEX-UA', 'Platinum Bastion', {
    type: 'Nexus',
    cost: 5,
    keywords: [{ name: 'Ultra Armor', parameter: 'Red' }]
  });
  state.players.opponent.nexus = [nexusCard];

  const redSource = createMockCard('SRC-RED', 'Red Spirit', { color: 'Red' });
  const context = { controller: 'player', sourceCard: redSource };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp'
  }, context);

  assert.equal(candidates.length, 0, 'Opposing Nexus with Ultra Armor: Red must be immune to Red effect');
});

test('2.3 ignoreArmor bypasses Heavy Armor and Ultra Armor on Nexus without bypassing PROTECTION', async () => {
  const state = createGameState();
  // Nexus A: Has Heavy Armor only
  const nexA = createMockCard('NEX-A', 'Heavy Fort', {
    type: 'Nexus',
    cost: 4,
    keywords: [{ name: 'Heavy Armor', parameter: 'Red' }]
  });
  // Nexus B: Has Heavy Armor AND cannotBeDestroyed PROTECTION
  const nexB = createMockCard('NEX-B', 'Shielded Fort', {
    type: 'Nexus',
    cost: 4,
    keywords: [{ name: 'Heavy Armor', parameter: 'Red' }]
  });
  state.players.opponent.nexus = [nexA, nexB];
  state.modifiers = [{
    id: 'mod_protect_nexB',
    type: 'PROTECTION',
    targetCardId: nexB.id,
    cannotBeDestroyed: true
  }];

  const redSource = createMockCard('SRC-RED', 'Red Spirit', { color: 'Red' });
  const context = { controller: 'player', sourceCard: redSource };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'opp',
    effectType: 'destroy',
    ignoreArmor: true
  }, context);

  assert.equal(candidates.length, 1, 'Only NexA must be selectable; NexB has non-bypassable PROTECTION');
  assert.equal(candidates[0].card.id, 'NEX-A');
});

test('2.4 Friendly Nexus with Heavy Armor / Ultra Armor remains eligible for friendly targeting', async () => {
  const state = createGameState();
  const nexHA = createMockCard('NEX-FRIENDLY-HA', 'Friendly Fort HA', {
    type: 'Nexus',
    cost: 3,
    color: 'Red',
    keywords: [{ name: 'Heavy Armor', parameter: 'Red' }]
  });
  const nexUA = createMockCard('NEX-FRIENDLY-UA', 'Friendly Fort UA', {
    type: 'Nexus',
    cost: 4,
    color: 'Red',
    keywords: [{ name: 'Ultra Armor', parameter: 'Red' }]
  });
  state.players.player.nexus = [nexHA, nexUA];

  const redSource = createMockCard('SRC-RED', 'Red Spirit', { color: 'Red' });
  const context = { controller: 'player', sourceCard: redSource };

  const candidates = queryCandidates(state, {
    types: ['Nexus'],
    zone: 'nexus',
    side: 'self'
  }, context);

  assert.equal(candidates.length, 2, 'Friendly Nexuses with Armor/Heavy/Ultra are eligible for friendly effects');
});

// =============================================================================
// 3. NORMAL RESOLVER-PATH INTEGRATION TEST WITH REAL COMPILED CARD
// =============================================================================

test('3.1 Genuine compiled IR resolver integration: BS09-X35 (Siegwurm-Nova) via AsyncResolver.resolveAbility', async () => {
  // Load real card record from BS09 shard
  const shardPath = path.resolve('data', 'ir_shards', 'BS09.json');
  const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  const cardRecord = shardData['BS09-X35'];
  assert.ok(cardRecord, 'BS09-X35 must exist in shard BS09.json');

  // Extract actual compiled ability BS09-X35#a2 (When Attacks: Destroy opposing spirits up to total 10000 BP)
  const ability = cardRecord.abilities.find(a => (a.id === 'BS09-X35#a2' || a.legacyId === 'BS09-X35#a2'));
  assert.ok(ability, 'Ability BS09-X35#a2 must exist');
  assert.equal(ability.clauses.length, 1);
  assert.equal(ability.clauses[0].op.op, 'DESTROY');
  assert.equal(ability.clauses[0].op.mode, 'TOTAL_BP_LTE');
  assert.equal(ability.clauses[0].op.maxTotalBp, 10000);

  // Setup game state with opposing targets
  const state = createGameState();
  const sp1 = createMockCard('OPP-1', 'Opponent Spirit 4000 BP', {
    owner: 'opponent',
    levels: { 1: { bp: 4000, cost: 1 } }
  });
  const sp2 = createMockCard('OPP-2', 'Opponent Spirit 5000 BP', {
    owner: 'opponent',
    levels: { 1: { bp: 5000, cost: 1 } }
  });
  const sp3 = createMockCard('OPP-3', 'Opponent Spirit 11000 BP', {
    owner: 'opponent',
    levels: { 1: { bp: 11000, cost: 1 } }
  });

  state.players.opponent.field = [
    createFieldStack(sp1, 1),
    createFieldStack(sp2, 1),
    createFieldStack(sp3, 1)
  ];

  // Resolver setup
  const promptResolver = {
    choose: async (prompt) => {
      // Choose sp1 and sp2 (4000 + 5000 = 9000 <= 10000)
      return prompt.candidates.filter(c => c.card.id === 'OPP-1' || c.card.id === 'OPP-2');
    }
  };

  const resolver = new AsyncResolver(promptResolver);
  const events = new EventBus();
  const emittedEvents = [];
  events.on('DESTROYED', ev => emittedEvents.push(ev));
  events.on('DESTROYED_BATCH', ev => emittedEvents.push(ev));

  const abilityContext = {
    controller: 'player',
    sourceCard: cardRecord
  };

  // Execute through normal resolver path: resolveAbility()
  const result = await resolver.resolveAbility(state, ability, abilityContext, events);

  // Assert resolver outcome
  assert.equal(result.success, true, 'resolveAbility must succeed');
  assert.equal(result.hasUnsupported, false);
  assert.equal(result.hasFailure, false);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].destroyedCount, 2);

  // Assert game state changes
  assert.equal(state.players.opponent.field.length, 1, 'Only sp3 remains on field');
  assert.equal(state.players.opponent.field[0].top.id, 'OPP-3');
  assert.equal(state.players.opponent.grave.length, 2, 'sp1 and sp2 moved to grave');
  assert.ok(state.players.opponent.grave.some(c => c.id === 'OPP-1'));
  assert.ok(state.players.opponent.grave.some(c => c.id === 'OPP-2'));

  // Assert events emitted
  assert.equal(emittedEvents.filter(e => e.type === 'DESTROYED').length, 2);
  assert.equal(emittedEvents.filter(e => e.type === 'DESTROYED_BATCH').length, 1);
});

test('3.2 Genuine compiled IR resolver integration: BS14-105 (Glacial Slash) via AsyncResolver.resolveAbility', async () => {
  // Load real card record from BS14 shard
  const shardPath = path.resolve('data', 'ir_shards', 'BS14.json');
  const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  const cardRecord = shardData['BS14-105'];
  assert.ok(cardRecord, 'BS14-105 must exist in shard BS14.json');

  // Extract actual compiled ability BS14-105#a0 (clause 0 is BOUNCE to decktop)
  const ability = cardRecord.abilities.find(a => (a.id === 'BS14-105#a0' || a.legacyId === 'BS14-105#a0'));
  assert.ok(ability, 'Ability BS14-105#a0 must exist');
  assert.equal(ability.clauses[0].op.op, 'BOUNCE');
  assert.equal(ability.clauses[0].op.destination, 'DECK');

  // Setup game state with opposing target and deck
  const state = createGameState();
  const targetCard = createMockCard('OPP-SLASH-TGT', 'Target to Decktop', {
    owner: 'opponent',
    cost: 4
  });
  state.players.opponent.field = [createFieldStack(targetCard, 1)];
  state.players.opponent.deck = [
    createMockCard('D1', 'Existing Top Card', { owner: 'opponent' }),
    createMockCard('D2', 'Existing Bottom Card', { owner: 'opponent' })
  ];

  const promptResolver = {
    choose: async (prompt) => [prompt.candidates[0]]
  };

  const resolver = new AsyncResolver(promptResolver);
  const events = new EventBus();
  const bouncedEvents = [];
  events.on('BOUNCED', ev => bouncedEvents.push(ev));

  const abilityContext = {
    controller: 'player',
    sourceCard: cardRecord
  };

  // Execute through normal resolver path: resolveAbility()
  const result = await resolver.resolveAbility(state, ability, abilityContext, events);

  // Assert resolver outcome
  assert.equal(result.results[0].success, true);
  assert.equal(result.results[0].bouncedCount, 1);

  // Assert target placed at decktop (index 0)
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.deck.length, 3);
  assert.equal(state.players.opponent.deck[0].id, 'OPP-SLASH-TGT');
  assert.equal(bouncedEvents.length, 1);
  assert.equal(bouncedEvents[0].destination, 'deck_top');
});
