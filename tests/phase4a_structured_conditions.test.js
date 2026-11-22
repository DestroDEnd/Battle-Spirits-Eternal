/**
 * tests/phase4a_structured_conditions.test.js
 *
 * Automated regression test suite for Phase 4A: Structured Condition Evaluator.
 * Tests all 5 high-priority condition families + legacy conditions + unsupported safety:
 * 1. COND_CONTROL_CARD_TYPE_OR_FAMILY
 * 2. COND_COUNTER_THRESHOLD
 * 3. COND_SOUL_CORE_ON_SPIRIT
 * 4. COND_BURST_OR_MIRAGE_SET
 * 5. COND_LIFE_THRESHOLD
 * 6. Legacy Context Conditions & Deterministic Safety Contract
 * 7. End-to-End AsyncResolver Integration with actual game-state mutations
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateCondition,
  CONDITION_RESULT,
  AsyncResolver
} from '../engine/resolver.js';

import {
  parseConditionToStructured,
  evaluateStructuredCondition,
  CONDITION_TYPES
} from '../engine/conditions.js';

import {
  createGameState,
  createCardInstance,
  createFieldStack
} from '../engine/state.js';

function makeCard(overrides = {}) {
  return {
    id: 'test_card_1',
    card_number: 'TEST-001',
    name: 'Test Combatant',
    type: 'Spirit',
    family: 'Dragon',
    cost: 3,
    colors: ['Red'],
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 3000 } },
    ...overrides
  };
}

// ============================================================================
// 1. COND_CONTROL_CARD_TYPE_OR_FAMILY
// ============================================================================
test('1. COND_CONTROL_CARD_TYPE_OR_FAMILY: parses and evaluates field presence, type, family, name, color, and counts', () => {
  const state = createGameState([], []);
  const p = state.players.player;

  // Initially field is empty
  const evalEmpty = evaluateCondition(state, 'If you control any Spirit', { controller: 'player' });
  assert.equal(evalEmpty.result, CONDITION_RESULT.FALSE);
  assert.equal(evalEmpty.actual, 0);

  // Add a Red Dragon Spirit
  const spirit = createCardInstance(makeCard({ type: 'Spirit', family: 'Dragon', colors: ['Red'], name: '50th Dragon' }), 'player');
  const stack = createFieldStack(spirit, { normal: 1, soul: 0 });
  p.field.push(stack);

  // Test type filter: Spirit (TRUE) vs Ultimate (FALSE)
  const evalSpirit = evaluateCondition(state, 'If you control any Spirit', { controller: 'player' });
  assert.equal(evalSpirit.result, CONDITION_RESULT.TRUE);
  assert.equal(evalSpirit.actual, 1);

  const evalUlt = evaluateCondition(state, 'If you control any Ultimate', { controller: 'player' });
  assert.equal(evalUlt.result, CONDITION_RESULT.FALSE);

  // Test family filter: "Dragon" (TRUE) vs "Galaxian" (FALSE)
  const evalFamTrue = evaluateCondition(state, 'if you control any "Dragon" family Spirit', { controller: 'player' });
  assert.equal(evalFamTrue.result, CONDITION_RESULT.TRUE);

  const evalFamFalse = evaluateCondition(state, 'if you control any "Galaxian" family Spirit', { controller: 'player' });
  assert.equal(evalFamFalse.result, CONDITION_RESULT.FALSE);

  // Test name filter: "50th" (TRUE) vs "Zeus" (FALSE)
  const evalNameTrue = evaluateCondition(state, 'While you control any "50th"-named Spirit', { controller: 'player' });
  assert.equal(evalNameTrue.result, CONDITION_RESULT.TRUE);

  const evalNameFalse = evaluateCondition(state, 'While you control any "Zeus"-named Spirit', { controller: 'player' });
  assert.equal(evalNameFalse.result, CONDITION_RESULT.FALSE);

  // Test color filter: Red Spirit (TRUE) vs Blue Spirit (FALSE)
  const evalColorTrue = evaluateCondition(state, 'If you control any Red Spirit', { controller: 'player' });
  assert.equal(evalColorTrue.result, CONDITION_RESULT.TRUE);

  const evalColorFalse = evaluateCondition(state, 'If you control any Blue Spirit', { controller: 'player' });
  assert.equal(evalColorFalse.result, CONDITION_RESULT.FALSE);

  // Test count thresholds: "two or more" (FALSE with 1), "two or less" (TRUE with 1)
  const evalCountGTE = evaluateCondition(state, 'While you control two or more Spirits', { controller: 'player' });
  assert.equal(evalCountGTE.result, CONDITION_RESULT.FALSE);

  const evalCountLTE = evaluateCondition(state, 'While you control two or less Spirits', { controller: 'player' });
  assert.equal(evalCountLTE.result, CONDITION_RESULT.TRUE);

  // Test negation: "control no spirits" (FALSE with 1 on field)
  const evalNoSpirits = evaluateCondition(state, 'If you control no Spirits', { controller: 'player' });
  assert.equal(evalNoSpirits.result, CONDITION_RESULT.FALSE);

  // Opponent perspective: opponent has 0 spirits
  const evalOppHas = evaluateCondition(state, 'if the opponent controls any Spirit', { controller: 'player' });
  assert.equal(evalOppHas.result, CONDITION_RESULT.FALSE);

  const evalOppNone = evaluateCondition(state, "If the opponent doesn't control any Spirit", { controller: 'player' });
  assert.equal(evalOppNone.result, CONDITION_RESULT.TRUE);

  // Missing field context -> safely returns FALSE
  const evalMissingCtx = evaluateCondition({}, 'If you control any Spirit', { controller: 'player' });
  assert.equal(evalMissingCtx.result, CONDITION_RESULT.FALSE);
  assert.equal(evalMissingCtx.reason, 'MISSING_PLAYER_FIELD_CONTEXT');
});

// ============================================================================
// 2. COND_COUNTER_THRESHOLD
// ============================================================================
test('2. COND_COUNTER_THRESHOLD: evaluates counter thresholds, boundary conditions, and ownership', () => {
  const state = createGameState([], []);
  state.players.player.counters = 5;
  state.players.opponent.counters = 2;

  // 1. GTE: "six counters or more" (5 counters -> FALSE)
  const eval6GTE_false = evaluateCondition(state, 'If you have six counters or more', { controller: 'player' });
  assert.equal(eval6GTE_false.result, CONDITION_RESULT.FALSE);
  assert.equal(eval6GTE_false.actual, 5);

  // Boundary check: increment to 6 -> TRUE
  state.players.player.counters = 6;
  const eval6GTE_true = evaluateCondition(state, 'If you have six counters or more', { controller: 'player' });
  assert.equal(eval6GTE_true.result, CONDITION_RESULT.TRUE);
  assert.equal(eval6GTE_true.actual, 6);

  // Exceeding threshold: 7 counters -> TRUE
  state.players.player.counters = 7;
  const eval6GTE_over = evaluateCondition(state, 'If you have six counters or more', { controller: 'player' });
  assert.equal(eval6GTE_over.result, CONDITION_RESULT.TRUE);

  // "or more counters" syntax variant
  const evalAltSyntax = evaluateCondition(state, 'While you have five or more counters', { controller: 'player' });
  assert.equal(evalAltSyntax.result, CONDITION_RESULT.TRUE);

  // LTE: "four or less counters" (7 counters -> FALSE)
  const eval4LTE_false = evaluateCondition(state, 'While you have four or less counters', { controller: 'player' });
  assert.equal(eval4LTE_false.result, CONDITION_RESULT.FALSE);

  // Opponent side check: opponent has 2 counters <= 4 -> TRUE
  const evalOppCounters = evaluateCondition(state, 'While the opponent has four or less counters', { controller: 'player' });
  assert.equal(evalOppCounters.result, CONDITION_RESULT.TRUE);
  assert.equal(evalOppCounters.actual, 2);

  // Opponent side check with GTE: opponent has 2 counters < 5 -> FALSE
  const evalOppGTE = evaluateCondition(state, 'If the opponent has five or more counters', { controller: 'player' });
  assert.equal(evalOppGTE.result, CONDITION_RESULT.FALSE);

  // Missing context safety
  const evalMissingCounters = evaluateCondition({ players: { player: {} } }, 'If you have six counters or more', { controller: 'player' });
  assert.equal(evalMissingCounters.result, CONDITION_RESULT.FALSE);
  assert.equal(evalMissingCounters.reason, 'MISSING_PLAYER_COUNTERS_CONTEXT');
});

// ============================================================================
// 3. COND_SOUL_CORE_ON_SPIRIT
// ============================================================================
test('3. COND_SOUL_CORE_ON_SPIRIT: checks soul core on source stack and field stacks with side validation', () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ type: 'Spirit' }), 'player');
  const stackWithoutSoul = createFieldStack(spirit, { normal: 2, soul: 0 });
  const stackWithSoul = createFieldStack(spirit, { normal: 1, soul: 1 });

  state.players.player.field.push(stackWithoutSoul);

  // Context without soul core on source stack -> FALSE
  const evalNoSoul = evaluateCondition(state, 'While [Soul Core] is on this Spirit', {
    controller: 'player',
    sourceStack: stackWithoutSoul
  });
  assert.equal(evalNoSoul.result, CONDITION_RESULT.FALSE);

  // Context with soul core on source stack -> TRUE
  const evalWithSoul = evaluateCondition(state, 'While [Soul Core] is on this Spirit', {
    controller: 'player',
    sourceStack: stackWithSoul
  });
  assert.equal(evalWithSoul.result, CONDITION_RESULT.TRUE);

  // Raw syntax variants: "While [Soul Core] (Soul Core) is on this Spirit", "While this Spirit has [Soul Core] on it"
  const evalParens = evaluateCondition(state, 'While [Soul Core] (Soul Core) is on this Spirit', {
    controller: 'player',
    sourceStack: stackWithSoul
  });
  assert.equal(evalParens.result, CONDITION_RESULT.TRUE);

  const evalHasOnIt = evaluateCondition(state, 'While this Spirit has [Soul Core] on it', {
    controller: 'player',
    sourceStack: stackWithSoul
  });
  assert.equal(evalHasOnIt.result, CONDITION_RESULT.TRUE);

  // Stack controller mismatch (opponent controlling sourceStack)
  const oppStack = createFieldStack(createCardInstance(makeCard(), 'opponent'), { normal: 1, soul: 1 });
  oppStack.owner = 'opponent';
  const evalWrongOwner = evaluateCondition(state, 'While [Soul Core] is on this Spirit', {
    controller: 'player',
    sourceStack: oppStack
  });
  assert.equal(evalWrongOwner.result, CONDITION_RESULT.FALSE);

  // Missing sourceStack context -> FALSE (never silently TRUE)
  const evalMissingStack = evaluateCondition(state, 'While [Soul Core] is on this Spirit', {
    controller: 'player'
  });
  assert.equal(evalMissingStack.result, CONDITION_RESULT.FALSE);
  assert.equal(evalMissingStack.reason, 'MISSING_SOURCE_STACK_CONTEXT');
});

// ============================================================================
// 4. COND_BURST_OR_MIRAGE_SET
// ============================================================================
test('4. COND_BURST_OR_MIRAGE_SET: evaluates Burst, Mirage, negation, color qualification, and OR combinator', () => {
  const state = createGameState([], []);
  const p = state.players.player;

  // 1. Empty state
  assert.equal(evaluateCondition(state, 'While you have a Burst set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, 'if you don\'t have a Burst set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'if you have a Mirage set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, 'if you don\'t have a Mirage set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // 2. Set Red Burst
  p.burst = createCardInstance(makeCard({ type: 'Magic', colors: ['Red'] }), 'player');
  assert.equal(evaluateCondition(state, 'While you have a Burst set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'While you have a set Burst', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'if you don\'t have a Burst set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // Burst or Mirage OR combinator: TRUE when only Burst is set
  assert.equal(evaluateCondition(state, 'While you have a Burst or Mirage set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // 3. Set Purple Mirage
  p.mirage = createCardInstance(makeCard({ type: 'Nexus', colors: ['Purple'] }), 'player');
  assert.equal(evaluateCondition(state, 'if you have a Mirage set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'if you don\'t have a Mirage set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // Color qualified checks: Purple Mirage (TRUE) vs White Mirage (FALSE)
  assert.equal(evaluateCondition(state, 'if you have a Purple Mirage set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'While you have a White Mirage set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // Opponent checks: opponent has nothing set
  assert.equal(evaluateCondition(state, 'If the opponent has a Burst set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, "While the opponent doesn't have a Burst set", { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // Opponent sets Burst
  state.players.opponent.burst = createCardInstance(makeCard({ type: 'Magic', colors: ['White'] }), 'opponent');
  assert.equal(evaluateCondition(state, 'If the opponent has a Burst set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // Missing player context
  assert.equal(evaluateCondition({}, 'While you have a Burst set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
});

// ============================================================================
// 5. COND_LIFE_THRESHOLD
// ============================================================================
test('5. COND_LIFE_THRESHOLD: evaluates life comparisons, LTE/GTE boundaries, and opposing life', () => {
  const state = createGameState([], []);
  state.players.player.life = 3;
  state.players.opponent.life = 5;

  // LTE: "three or less" (life = 3 -> TRUE)
  const eval3LTE = evaluateCondition(state, 'If your Life is at three or less', { controller: 'player' });
  assert.equal(eval3LTE.result, CONDITION_RESULT.TRUE);
  assert.equal(eval3LTE.actual, 3);

  // LTE: "two or less" (life = 3 -> FALSE)
  const eval2LTE = evaluateCondition(state, 'If your Life is two or less', { controller: 'player' });
  assert.equal(eval2LTE.result, CONDITION_RESULT.FALSE);

  // Boundary change: life reduced to 2 -> TRUE
  state.players.player.life = 2;
  assert.equal(evaluateCondition(state, 'If your Life is two or less', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // GTE: "two or more" (life = 2 -> TRUE)
  assert.equal(evaluateCondition(state, 'While your Life is at two or more', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // Life reduced to 1: fails "two or more"
  state.players.player.life = 1;
  assert.equal(evaluateCondition(state, 'While your Life is at two or more', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // Opposing life check: opponent life is 5 (fails "three or less")
  const evalOppLifeLTE = evaluateCondition(state, 'If the opposing Life is at three or less', { controller: 'player' });
  assert.equal(evalOppLifeLTE.result, CONDITION_RESULT.FALSE);
  assert.equal(evalOppLifeLTE.actual, 5);

  // Reduce opponent life to 3 -> TRUE
  state.players.opponent.life = 3;
  assert.equal(evaluateCondition(state, 'If the opposing Life is at three or less', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // Missing life context
  const evalMissingLife = evaluateCondition({ players: { player: {} } }, 'If your Life is at three or less', { controller: 'player' });
  assert.equal(evalMissingLife.result, CONDITION_RESULT.FALSE);
  assert.equal(evalMissingLife.reason, 'MISSING_PLAYER_LIFE_CONTEXT');
});

// ============================================================================
// 6. Legacy Context Conditions & Deterministic Safety Contract
// ============================================================================
test('6. Legacy Context Conditions & UNSUPPORTED Safety Contract', () => {
  const state = createGameState([], []);

  // 1. destroyed_by_opponent
  assert.equal(evaluateCondition(state, 'destroyed_by_opponent', { wasDestroyedByOpponent: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'destroyed_by_opponent', { wasDestroyedByOpponent: false }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, 'destroyed_by_opponent', {}).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, 'destroyed_by_opponent', null).reason, 'MISSING_CONTEXT_DESTROYED_BY_OPPONENT');

  // 2. summoned_from_removed
  assert.equal(evaluateCondition(state, 'summoned_from_removed', { summonFromRemoved: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'summoned_from_removed', { summonFromRemoved: false }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, 'summoned_from_removed', {}).reason, 'MISSING_CONTEXT_SUMMONED_FROM_REMOVED');

  // 3. soul core used / cost
  assert.equal(evaluateCondition(state, 'If [Soul Core] was used to pay the summon cost', { soulCoreUsed: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'If [Soul Core] was used to pay the summon cost', { soulCoreUsed: false }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, 'If [Soul Core] was used to pay the summon cost', {}).reason, 'MISSING_CONTEXT_SOUL_CORE_USED');

  // 4. Truly unsupported complex clauses return UNSUPPORTED and do NOT crash
  const unsup1 = evaluateCondition(state, 'If you banish the [Soul Core] on this Ultimate from the game', { controller: 'player' });
  assert.equal(unsup1.result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(unsup1.reason, 'UNSUPPORTED_CONDITION');

  const unsup2 = evaluateCondition(state, 'When this Spirit is returned to hand by opponent', { controller: 'player' });
  assert.equal(unsup2.result, CONDITION_RESULT.UNSUPPORTED);

  // 5. Empty or null condition is always TRUE (unconditional)
  assert.equal(evaluateCondition(state, null).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, '').result, CONDITION_RESULT.TRUE);
});

// ============================================================================
// 7. End-to-End AsyncResolver Integration with Real State Mutations
// ============================================================================
test('7. End-to-End AsyncResolver: Condition TRUE executes ops, FALSE skips, UNSUPPORTED blocks', async () => {
  const resolver = new AsyncResolver();

  // Scenario A: Condition TRUE -> DRAW operation executes and increments hand count
  const stateA = createGameState([createCardInstance(makeCard(), 'player')], []);
  stateA.players.player.counters = 6;
  const initialDeckLen = stateA.players.player.deck.length;

  const abilityA = {
    id: 'ab_counter_draw',
    clauses: [
      {
        condition: 'If you have six counters or more',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };

  const resA = await resolver.resolveAbility(stateA, abilityA, { controller: 'player' });
  assert.equal(resA.success, true);
  assert.equal(resA.hasUnsupported, false);
  assert.equal(resA.results[0].success, true);
  assert.equal(stateA.players.player.hand.length, 1, 'Card was drawn into hand');
  assert.equal(stateA.players.player.deck.length, initialDeckLen - 1, 'Card removed from deck');

  // Scenario B: Condition FALSE (insufficient counters) -> DRAW is skipped, state unchanged
  const stateB = createGameState([createCardInstance(makeCard(), 'player')], []);
  stateB.players.player.counters = 5;

  const resB = await resolver.resolveAbility(stateB, abilityA, { controller: 'player' });
  assert.equal(resB.hasUnsupported, false);
  assert.equal(resB.results[0].skipped, true);
  assert.equal(resB.results[0].conditionResult, CONDITION_RESULT.FALSE);
  assert.equal(stateB.players.player.hand.length, 0, 'No card drawn when condition is false');
  assert.equal(stateB.players.player.deck.length, 1, 'Deck unchanged');

  // Scenario C: Condition UNSUPPORTED -> Dependent effect never executes
  const stateC = createGameState([createCardInstance(makeCard(), 'player')], []);
  const abilityC = {
    id: 'ab_unsupported',
    clauses: [
      {
        condition: 'If you banish the [Soul Core] on this Ultimate from the game',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };

  const resC = await resolver.resolveAbility(stateC, abilityC, { controller: 'player' });
  assert.equal(resC.success, false);
  assert.equal(resC.hasUnsupported, true, 'Reports unsupported to caller');
  assert.equal(resC.results[0].conditionResult, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(stateC.players.player.hand.length, 0, 'Dependent effect was blocked');
  assert.equal(stateC.players.player.deck.length, 1, 'Deck unchanged');

  // Scenario D: Multi-clause ability with condition on second clause (link: 'then')
  const stateD = createGameState([
    createCardInstance(makeCard(), 'player'),
    createCardInstance(makeCard(), 'player')
  ], []);
  stateD.players.player.life = 2; // Satisfies "Life is at three or less"
  const abilityD = {
    id: 'ab_multi_clause',
    clauses: [
      {
        op: { op: 'DRAW', count: 1 }
      },
      {
        link: 'then',
        condition: 'If your Life is at three or less',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };

  const resD = await resolver.resolveAbility(stateD, abilityD, { controller: 'player' });
  assert.equal(resD.success, true);
  assert.equal(stateD.players.player.hand.length, 2, 'Both clauses executed');
});

// ============================================================================
// 8. Immutability, Core Precision & Burst/Mirage Disjointness Verification
// ============================================================================
test('8. Verification: State immutability, Soul Core precision, and Burst/Mirage isolation', () => {
  // 1. Soul Core Precision: 5 normal cores + 0 soul core MUST evaluate to FALSE for Soul Core condition
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard(), 'player');
  const stackWithNormalOnly = createFieldStack(spirit, { normal: 5, soul: 0 });
  state.players.player.field.push(stackWithNormalOnly);

  const evalNormalOnly = evaluateCondition(state, 'While [Soul Core] is on this Spirit', {
    controller: 'player',
    sourceStack: stackWithNormalOnly
  });
  assert.equal(evalNormalOnly.result, CONDITION_RESULT.FALSE, '5 normal cores must not satisfy Soul Core condition');

  // 2. Burst vs Mirage Isolation:
  // Having only Mirage must be FALSE for Burst
  state.players.player.mirage = createCardInstance(makeCard({ type: 'Nexus' }), 'player');
  state.players.player.burst = null;
  assert.equal(evaluateCondition(state, 'While you have a Burst set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateCondition(state, 'While you have a Mirage set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // Having only Burst must be FALSE for Mirage
  state.players.player.mirage = null;
  state.players.player.burst = createCardInstance(makeCard({ type: 'Magic' }), 'player');
  assert.equal(evaluateCondition(state, 'While you have a Burst set', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'While you have a Mirage set', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // 3. State Immutability: Deep freeze verification
  const snapshotBefore = JSON.stringify(state);
  evaluateCondition(state, 'If you control any Spirit', { controller: 'player' });
  evaluateCondition(state, 'If you have six counters or more', { controller: 'player' });
  evaluateCondition(state, 'If your Life is at three or less', { controller: 'player' });
  evaluateCondition(state, 'While you have a Burst or Mirage set', { controller: 'player' });
  evaluateCondition(state, 'While [Soul Core] is on this Spirit', { controller: 'player', sourceStack: stackWithNormalOnly });
  const snapshotAfter = JSON.stringify(state);
  assert.equal(snapshotBefore, snapshotAfter, 'Condition evaluation must be strictly read-only and never mutate game state');
});
