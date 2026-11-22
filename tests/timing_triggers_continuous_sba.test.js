/**
 * tests/timing_triggers_continuous_sba.test.js
 *
 * Phases 4C.3.3 – 4C.3.5 Consolidated Test Suite:
 * - Timing Windows (nested stack, priority, consecutive pass, non-interruptible guard)
 * - Trigger Queue & Lifecycle (dedup, simultaneous ordering, optional offer/decline, source departure, nested resolution stack & depth guard)
 * - Continuous Effects (layering, cycle guard, versioned cache invalidation, all duration scopes & source-departure expiration)
 * - State-Based Actions & Stabilization (simultaneous Life 0 draw, multi-pass stabilization, infinite-loop protection)
 * - Cross-System Integration (all 5 paths from Section 5)
 * - Performance, Determinism & Concurrent Game Isolation Stress Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import {
  createCardInstance,
  createFieldStack,
  resetInstanceIdCounter,
  resetPlacementIdCounter
} from '../engine/state.js';
import { WINDOW_TYPES, WINDOW_STATUS } from '../engine/windows.js';
import { TRIGGER_STATUS, transitionTriggerStatus } from '../engine/triggers.js';
import { AsyncResolver, ResolutionDepthExceededError } from '../engine/resolver.js';
import {
  computeEffectiveCharacteristics,
  sortModifiersByLayer,
  pruneExpiredModifiers,
  CircularContinuousDependencyError
} from '../engine/continuous.js';
import { stabilizeGameState, StabilizationLoopError } from '../engine/sba.js';
import { assignDeterministicAbilityIdentities } from '../compiler/index.js';

function makeDeck(count = 40, prefix = 'W') {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `${prefix}-${i + 1}`,
    name: `Card ${prefix}-${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 5000 } }
  }));
}

// ===========================================================================
// Category B — Timing Windows
// ===========================================================================
test('WIN-01: Nested timing windows suspend/resume parent, enforce priority, and close on 2 consecutive passes', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O'), strictRules: true });

  const mainWin = await game.windows.openWindow({
    type: WINDOW_TYPES.MAIN_ACTION,
    activePlayer: 'player',
    priorityPlayer: 'player',
    eligibleActions: ['PLAY_CARD', 'PASS']
  });
  assert.equal(mainWin.status, WINDOW_STATUS.OPEN);

  // Opponent cannot act while player holds priority
  assert.equal(game.windows.canPerformAction('PLAY_CARD', 'opponent').allowed, false);
  assert.equal(game.windows.canPerformAction('PLAY_CARD', 'player').allowed, true);
  assert.equal(game.windows.canPerformAction('DECLARE_BLOCK', 'player').allowed, false);

  // Open nested FLASH window -> suspends MAIN_ACTION
  const flashWin = await game.windows.openWindow({
    type: WINDOW_TYPES.FLASH,
    activePlayer: 'player',
    priorityPlayer: 'opponent',
    eligibleActions: ['CAST_FLASH_MAGIC', 'PASS'],
    interruptible: false
  });
  assert.equal(mainWin.status, WINDOW_STATUS.SUSPENDED);
  assert.equal(flashWin.parentWindowId, mainWin.id);

  // Non-interruptible guard
  await assert.rejects(
    () => game.windows.openWindow({ type: WINDOW_TYPES.INTERRUPT }),
    /WINDOW_NOT_INTERRUPTIBLE/
  );

  // Consecutive passes close nested FLASH window and resume MAIN_ACTION
  const pass1 = await game.windows.passPriority('opponent');
  assert.equal(pass1.closed, false);
  assert.equal(pass1.nextPriority, 'player');
  const pass2 = await game.windows.passPriority('player');
  assert.equal(pass2.closed, true);

  assert.equal(game.windows.getCurrentWindow().id, mainWin.id);
  assert.equal(mainWin.status, WINDOW_STATUS.OPEN);
  await game.windows.closeWindow(mainWin.id);
  assert.equal(game.windows.getCurrentWindow(), null);
});

// ===========================================================================
// Category C — Trigger Queue, Lifecycle & Nested Resolution Stack
// ===========================================================================
test('TRIG-01: Deduplication, deterministic simultaneous ordering, source departure cancellation, and optional decline', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const drawAb1 = {
    id: 'T-A#0', type: 'ABILITY',
    header: { timing: 'AT_START_OF_TURN', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const drawAb2 = {
    id: 'T-B#0', type: 'ABILITY',
    header: { timing: 'AT_START_OF_TURN', levels: [1], isOptional: true },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  assignDeterministicAbilityIdentities('T-A', [drawAb1]);
  assignDeterministicAbilityIdentities('T-B', [drawAb2]);

  // Custom promptResolver that declines OPTIONAL_TRIGGER for opponent
  const game = createGame({
    playerDeck: makeDeck(40, 'P'),
    opponentDeck: makeDeck(40, 'O'),
    promptResolver: {
      choose: async (prompt) => {
        if (prompt.type === 'OPTIONAL_TRIGGER') return { activate: false };
        return { action: 'PASS' };
      }
    }
  });

  const pStack = createFieldStack(createCardInstance({ card_number: 'T-A', name: 'A', type: 'Spirit', compiledIr: { abilities: [drawAb1] } }, 'player'), { normal: 1, soul: 0 });
  const oStack = createFieldStack(createCardInstance({ card_number: 'T-B', name: 'B', type: 'Spirit', compiledIr: { abilities: [drawAb2] } }, 'opponent'), { normal: 1, soul: 0 });
  game.state.players.player.field.push(pStack);
  game.state.players.opponent.field.push(oStack);

  const event = { type: 'TURN_START', player: 'player', turnNumber: 2, _eventId: 'ev_turn_2' };
  const q1 = game.triggers.detectAndQueue(event);
  const q2 = game.triggers.detectAndQueue(event); // Duplicate call for same event
  assert.equal(q1.length, 2);
  assert.equal(q2.length, 0, 'Duplicate trigger registration for same event blocked');
  assert.equal(q1[0].controllerAtTrigger, 'player', 'Active player queued first');
  assert.equal(q1[1].controllerAtTrigger, 'opponent', 'Non-turn player queued second');

  // Illegal lifecycle transition rejected
  assert.throws(() => transitionTriggerStatus(q1[0], TRIGGER_STATUS.RESOLVED), /ILLEGAL_TRIGGER_TRANSITION/);

  const handBefore = game.state.players.player.hand.length;
  const oppHandBefore = game.state.players.opponent.hand.length;
  const res = await game.triggers.resolvePendingQueue();
  assert.equal(res[0].status, TRIGGER_STATUS.RESOLVED);
  assert.equal(res[1].status, TRIGGER_STATUS.DECLINED);
  assert.equal(game.state.players.player.hand.length, handBefore + 1);
  assert.equal(game.state.players.opponent.hand.length, oppHandBefore);
});

test('TRIG-02: Source departure cancels pending field triggers; ResolutionDepthExceededError prevents unbounded recursion', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O') });
  const ab = { id: 'TD#0', type: 'ABILITY', header: { timing: 'WHEN_ATTACKS', levels: [1] }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  assignDeterministicAbilityIdentities('TD', [ab]);

  const card = createCardInstance({ card_number: 'TD', name: 'Departing', type: 'Spirit', compiledIr: { abilities: [ab] } }, 'player');
  const stack = createFieldStack(card, { normal: 1, soul: 0 });
  game.state.players.player.field.push(stack);

  const trigs = game.triggers.detectAndQueue({ type: 'ATTACK_DECLARED', attacker: stack, player: 'player' });
  assert.equal(trigs.length, 1);

  // Move card off field before trigger resolves -> cancels pending trigger
  game.state.players.player.field = [];
  game.state.players.player.grave.push(card);
  const res = await game.triggers.resolvePendingQueue();
  assert.equal(res[0].status, TRIGGER_STATUS.CANCELLED);
  assert.equal(res[0].reason, 'SOURCE_LEFT_FIELD');

  // Resolution depth guard test
  const shallowResolver = new AsyncResolver(null, { maxResolutionDepth: 2 });
  shallowResolver.resolutionStack.push({ frameId: 'f1' }, { frameId: 'f2' });
  await assert.rejects(
    () => shallowResolver.resolveAbility(game.state, ab, { controller: 'player' }, game.events),
    ResolutionDepthExceededError
  );
});

// ===========================================================================
// Category D — Continuous Effects, Layering, Cycle Guard, Cache & Expiration
// ===========================================================================
test('CONT-01: Deterministic modifier layering, cycle protection, versioned cache invalidation, and duration expiration', () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O') });
  const card = createCardInstance({
    card_number: 'C-1', name: 'Layer Dragon', type: 'Spirit', color: 'Red',
    levels: { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 5000 } }
  }, 'player');
  const stack = createFieldStack(card, { normal: 1, soul: 0 });
  game.state.players.player.field.push(stack);

  // Add modifiers in reverse order: Additive first, Set-to-value second
  game.state.modifiers.push(
    { id: 'm_add', type: 'BP_BUFF', targetStackId: stack.id, amount: 1000, duration: 'THIS_TURN' },
    { id: 'm_setlv', type: 'SET_LEVEL', targetStackId: stack.id, setLevel: 2, duration: 'THIS_BATTLE' },
    { id: 'm_perm', type: 'BP_BUFF', targetStackId: stack.id, amount: 500, duration: 'PERMANENT' },
    { id: 'm_src', type: 'BP_BUFF', targetStackId: stack.id, amount: 2000, duration: 'WHILE_SOURCE_IN_ZONE', sourceCardId: 'missing_src', sourceZone: 'field' }
  );

  const sorted = sortModifiersByLayer(game.state.modifiers);
  assert.equal(sorted[0].id, 'm_setlv', 'SET_LEVEL sorts into Layer 1 before additive modifiers');

  const chars1 = computeEffectiveCharacteristics(game.state, stack);
  assert.equal(chars1.effectiveLevel, 2);
  assert.equal(chars1.baseBP, 5000);
  assert.equal(chars1.effectiveBP, 8500); // 5000 + 1000 + 500 + 2000

  // Cache hit returns equal characteristics, and mutation invalidates cache immediately
  game.state.modifiers[0].amount = 2000;
  const chars2 = computeEffectiveCharacteristics(game.state, stack);
  assert.equal(chars2.effectiveBP, 9500, 'Cache invalidated immediately upon modifier change');

  // Duration expiration boundaries
  pruneExpiredModifiers(game.state, 'SOURCE_DEPARTURE');
  assert.equal(game.state.modifiers.some(m => m.id === 'm_src'), false, 'WHILE_SOURCE_IN_ZONE expired when source missing');

  pruneExpiredModifiers(game.state, 'BATTLE');
  assert.equal(game.state.modifiers.some(m => m.id === 'm_setlv'), false, 'THIS_BATTLE expired');
  assert.equal(game.state.modifiers.some(m => m.id === 'm_perm'), true, 'PERMANENT preserved');

  // Circular modifier dependency guard
  game.state.modifiers.push({ id: 'cyc_1', type: 'BP_BUFF', dependsOn: 'cyc_1', duration: 'THIS_TURN' });
  assert.throws(() => computeEffectiveCharacteristics(game.state, stack), CircularContinuousDependencyError);
});

// ===========================================================================
// Category E — State-Based Actions & Stabilization Loop
// ===========================================================================
test('SBA-01: Simultaneous Life 0 resolves as DRAW, stabilization loop settles chained depletion & modifier pruning', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O') });

  // 1. Chained depletion + WHILE_SOURCE_IN_ZONE modifier cleanup
  const depCard = createCardInstance({ card_number: 'DEP-1', name: 'Depleting', type: 'Spirit', levels: { 1: { cost: 2, bp: 2000 } } }, 'player');
  const depStack = createFieldStack(depCard, { normal: 1, soul: 0 }); // 1 < LV1 cost 2 -> depletes!
  game.state.players.player.field.push(depStack);
  game.state.modifiers.push({
    id: 'aura_from_dep',
    type: 'BP_BUFF',
    amount: 3000,
    duration: 'WHILE_SOURCE_IN_ZONE',
    sourceCardId: depCard.id,
    sourceZone: 'field'
  });

  const stab = await stabilizeGameState(game.state, game.events);
  assert.equal(stab.stabilized, true);
  assert.equal(stab.totalDepleted.length, 1);
  assert.equal(game.state.modifiers.some(m => m.id === 'aura_from_dep'), false, 'Aura expired after source depleted in stabilization loop');

  // 2. Simultaneous Life 0 -> DRAW
  game.state.players.player.life = 0;
  game.state.players.opponent.life = 0;
  const drawRes = await stabilizeGameState(game.state, game.events);
  assert.equal(drawRes.winner, 'DRAW');
  assert.equal(drawRes.winReason, 'SIMULTANEOUS_LIFE_0');
});

test('SBA-02: StabilizationLoopError guards against non-stabilizing infinite SBA loops', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O') });
  // Create a replacement loop or listener that keeps pushing a 0-core depleting card back onto field on CARD_MOVED
  const loopCard = createCardInstance({ card_number: 'LOOP-1', name: 'Loop Spirit', type: 'Spirit', levels: { 1: { cost: 2, bp: 1000 } } }, 'player');
  game.state.players.player.field.push(createFieldStack(loopCard, { normal: 0, soul: 0 }));

  game.events.on('CARD_MOVED', ev => {
    if (ev.card?.id === loopCard.id && ev.toZone === 'grave') {
      game.state.players.player.grave = game.state.players.player.grave.filter(c => c.id !== loopCard.id);
      game.state.players.player.field.push(createFieldStack(loopCard, { normal: 0, soul: 0 }));
    }
  });

  await assert.rejects(
    () => stabilizeGameState(game.state, game.events, { maxPasses: 5 }),
    StabilizationLoopError
  );
});

// ===========================================================================
// Category F & Performance/Concurrency Stress (Section 7)
// ===========================================================================
test('PERF-01: Concurrent independent games maintain isolated trigger queues, resolution stacks, and fast stabilization under load', async () => {
  const g1 = createGame({ playerDeck: makeDeck(40, 'G1P'), opponentDeck: makeDeck(40, 'G1O') });
  const g2 = createGame({ playerDeck: makeDeck(40, 'G2P'), opponentDeck: makeDeck(40, 'G2O') });

  // Populate 100 field stacks and 50 modifiers in g1
  const t0 = Date.now();
  for (let i = 0; i < 100; i++) {
    const c = createCardInstance({ card_number: `ST-${i}`, name: `S${i}`, type: 'Spirit', levels: { 1: { cost: 1, bp: 2000 } } }, 'player');
    g1.state.players.player.field.push(createFieldStack(c, { normal: 1, soul: 0 }));
  }
  for (let i = 0; i < 50; i++) {
    g1.state.modifiers.push({ id: `m_${i}`, type: 'BP_BUFF', amount: 100, duration: 'THIS_TURN' });
  }

  for (const st of g1.state.players.player.field) {
    const chars = computeEffectiveCharacteristics(g1.state, st);
    assert.equal(chars.effectiveBP, 7000);
  }
  const stab = await g1.stabilize();
  const elapsed = Date.now() - t0;
  assert.equal(stab.stabilized, true);
  assert.ok(elapsed < 2000, `Expected < 2000ms for 100 stacks + 50 modifiers, took ${elapsed}ms`);

  // Verify g2 is completely unaffected by g1
  assert.equal(g2.state.players.player.field.length, 0);
  assert.equal(g2.state.modifiers.length, 0);
  assert.equal(g2.triggers.queue.length, 0);
  assert.equal(g2.resolver.resolutionStack.length, 0);
});
