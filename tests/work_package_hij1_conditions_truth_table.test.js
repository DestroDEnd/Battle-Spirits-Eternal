/**
 * tests/work_package_hij1_conditions_truth_table.test.js
 * Classification: CONDITION_SEMANTICS
 *
 * Truth-table tests for LEGACY_CONTEXT_CONDITION and all H/I/J.1 parsed condition forms
 * across TRUE, FALSE, UNSUPPORTED, missing context, contradictory context, and 3-valued logic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createFieldStack } from '../engine/state.js';
import {
  CONDITION_RESULT,
  CONDITION_TYPES,
  parseConditionToStructured,
  evaluateStructuredCondition
} from '../engine/conditions.js';

function baseState() {
  const g = createGame();
  g.state.turnHistory = { player: { lifeReduced: 0 }, opponent: { lifeReduced: 0 } };
  return g.state;
}

test('HIJ1-COND-01 [CONDITION_SEMANTICS]: LEGACY_CONTEXT_CONDITION evaluates soul_core_used, destroyed_by_opponent, summoned_from_removed with TRUE/FALSE', () => {
  const state = baseState();

  const cSoul = 'If [Soul Core] (Soul Core) was used to pay the summon cost';
  assert.equal(parseConditionToStructured(cSoul)?.type, CONDITION_TYPES.LEGACY_CONTEXT_CONDITION);
  assert.equal(evaluateStructuredCondition(state, cSoul, { soulCoreUsed: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, cSoul, { usedSoulCoreToPay: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, cSoul, { sourceCard: { summonedWithSoulCore: true } }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, cSoul, { soulCoreUsed: false }).result, CONDITION_RESULT.FALSE);

  const cDest = 'destroyed_by_opponent';
  assert.equal(evaluateStructuredCondition(state, cDest, { wasDestroyedByOpponent: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, cDest, { wasDestroyedByOpponent: false }).result, CONDITION_RESULT.FALSE);

  const cRem = 'summoned_from_removed';
  assert.equal(evaluateStructuredCondition(state, cRem, { summonFromRemoved: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, cRem, { summonFromRemoved: false }).result, CONDITION_RESULT.FALSE);
});

test('HIJ1-COND-02 [CONDITION_SEMANTICS]: Self LV, Life-reduced turn history, Attack Step parens, and counter typo evaluate TRUE/FALSE/UNSUPPORTED', () => {
  const state = baseState();
  const st = createFieldStack({ id: 'SP1', name: 'Tester', type: 'Spirit', owner: 'player' }, { normal: 3, soul: 0 });
  st.level = 3;
  state.players.player.field.push(st);

  const lvCond = 'If this Spirit is at LV3';
  assert.equal(parseConditionToStructured(lvCond)?.type, CONDITION_TYPES.SPIRIT_STAT_THRESHOLD);
  assert.equal(evaluateStructuredCondition(state, lvCond, { controller: 'player', sourceStack: st }).result, CONDITION_RESULT.TRUE);
  st.level = 2;
  assert.equal(evaluateStructuredCondition(state, lvCond, { controller: 'player', sourceStack: st }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, lvCond, { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);

  const lifeCond = 'If your Life was reduced during this turn';
  assert.equal(evaluateStructuredCondition(state, lifeCond, { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  state.turnHistory.player.lifeReduced = 1;
  assert.equal(evaluateStructuredCondition(state, lifeCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, lifeCond, { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);

  const stepCond = "if it's (Opposing Attack Step)";
  state.step = 'ATTACK';
  state.activePlayer = 'opponent';
  assert.equal(evaluateStructuredCondition(state, stepCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.activePlayer = 'player';
  assert.equal(evaluateStructuredCondition(state, stepCond, { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  const cntCond = 'if your have five or more counters';
  state.players.player.counters = 5;
  assert.equal(evaluateStructuredCondition(state, cntCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.players.player.counters = 4;
  assert.equal(evaluateStructuredCondition(state, cntCond, { controller: 'player' }).result, CONDITION_RESULT.FALSE);
});

test('HIJ1-COND-03 [CONDITION_SEMANTICS]: Multi-color Mirage, negated Soul Core location, braved count, removed facedown count, Song Magic, and CARD_RESULT families', () => {
  const state = baseState();

  const mirCond = 'if you have a Purple/White Mirage set';
  state.players.player.mirage = { id: 'M1', color: 'White', colors: ['White'] };
  assert.equal(evaluateStructuredCondition(state, mirCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.players.player.mirage = { id: 'M2', color: 'Red', colors: ['Red'] };
  assert.equal(evaluateStructuredCondition(state, mirCond, { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  const scNeg = "While the opposing [Soul Core] isn't in the Reserve";
  state.players.opponent.reserve = { normal: 3, soul: 0 };
  assert.equal(evaluateStructuredCondition(state, scNeg, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.players.opponent.reserve.soul = 1;
  assert.equal(evaluateStructuredCondition(state, scNeg, { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  const brvCond = 'while braved to two Braves';
  const st = createFieldStack({ id: 'SP2', type: 'Spirit', owner: 'player' }, { normal: 1, soul: 0 });
  st.braves = [{ id: 'B1', type: 'Brave' }, { id: 'B2', type: 'Brave' }];
  assert.equal(evaluateStructuredCondition(state, brvCond, { controller: 'player', sourceStack: st }).result, CONDITION_RESULT.TRUE);
  st.braves = [{ id: 'B1', type: 'Brave' }];
  assert.equal(evaluateStructuredCondition(state, brvCond, { controller: 'player', sourceStack: st }).result, CONDITION_RESULT.FALSE);

  const remCond = 'if there are three or more facedown cards on your Removed Zone';
  state.players.player.removed = [
    { id: 'R1', facedown: true },
    { id: 'R2', facedown: true },
    { id: 'R3', facedown: true }
  ];
  assert.equal(evaluateStructuredCondition(state, remCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.players.player.removed.pop();
  assert.equal(evaluateStructuredCondition(state, remCond, { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  const songCond = 'If you have any [Song] Magic card on your Field';
  const magSt = createFieldStack({ id: 'MG1', type: 'Magic', families: ['Song'], owner: 'player' }, { normal: 1, soul: 0 });
  state.players.player.field.push(magSt);
  assert.equal(evaluateStructuredCondition(state, songCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  const famCond = 'If all those cards have "Devotee"/"Machine" family';
  assert.equal(
    evaluateStructuredCondition(state, famCond, {
      previousOpResult: { cards: [{ families: ['Devotee'] }, { families: ['Machine'] }] }
    }).result,
    CONDITION_RESULT.TRUE
  );
  assert.equal(
    evaluateStructuredCondition(state, famCond, {
      previousOpResult: { cards: [{ families: ['Devotee'] }, { families: ['Dragon'] }] }
    }).result,
    CONDITION_RESULT.FALSE
  );
  assert.equal(evaluateStructuredCondition(state, famCond, {}).result, CONDITION_RESULT.UNSUPPORTED);
});

test('HIJ1-COND-04 [CONDITION_SEMANTICS]: Kleene 3-valued NOT/AND/OR and contradictory/truncated conditions fail closed to UNSUPPORTED', () => {
  const state = baseState();
  const unsupportedRaw = 'While this Spirit';
  assert.equal(evaluateStructuredCondition(state, unsupportedRaw, { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);

  const notUnsup = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'NOT', conditions: [unsupportedRaw] };
  assert.equal(evaluateStructuredCondition(state, notUnsup, { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);

  const andFalseUnsup = {
    kind: 'STRUCTURED_CONDITION',
    type: CONDITION_TYPES.COMPOUND,
    combinator: 'AND',
    conditions: ['If this Spirit is at LV3', unsupportedRaw]
  };
  const st = createFieldStack({ id: 'SP3', type: 'Spirit', owner: 'player' }, { normal: 1, soul: 0 });
  st.level = 1;
  assert.equal(evaluateStructuredCondition(state, andFalseUnsup, { controller: 'player', sourceStack: st }).result, CONDITION_RESULT.FALSE);
  st.level = 3;
  assert.equal(evaluateStructuredCondition(state, andFalseUnsup, { controller: 'player', sourceStack: st }).result, CONDITION_RESULT.UNSUPPORTED);

  // Contradictory sourceStack vs sourceCard fails closed to UNSUPPORTED
  const otherCard = { id: 'DIFFERENT_CARD', type: 'Spirit' };
  assert.equal(
    evaluateStructuredCondition(state, 'If this Spirit is at LV3', { controller: 'player', sourceStack: st, sourceCard: otherCard }).result,
    CONDITION_RESULT.UNSUPPORTED
  );
});
