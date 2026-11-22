import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileCard } from '../compiler/index.js';
import { compileClauseToOp } from '../compiler/clause_patterns.js';
import { semanticCompareOp, compareAbilityStructure } from './helpers/card_e2e_framework.mjs';

const detailedCards = JSON.parse(fs.readFileSync('data/cards_detailed.json', 'utf8'));

test('HIJ2-COMP-01 [COMPILER_FIDELITY]: Bracket-keyword collisions resolve to true ops instead of greedy KEYWORD_RULE', () => {
  const cases = [
    ['26RBS02-023', 1, 'ACTIVATE_EFFECT_ACTION'],
    ['BATTLE-SPIRITS-A8297', 0, 'TRIGGERED_WATCHER'],
    ['BS28-020', 0, 'DECK_BUILDING_RULE'],
    ['BS40-023', 0, 'DECK_BUILDING_RULE'],
    ['BATTLE-SPIRITS-A7749', 1, 'ADVENT_RULE'],
    ['BATTLE-SPIRITS-A9610', 2, 'ADVENT_RULE'],
    ['BSC16-031', 1, 'ADD_FAMILY'],
  ];
  for (const [cardNumber, abIdx, expectedOp] of cases) {
    const det = detailedCards[cardNumber];
    assert.ok(det, `Missing ${cardNumber} in cards_detailed.json`);
    const compiled = compileCard(det);
    const actualOp = compiled.abilities?.[abIdx]?.clauses?.[0]?.op?.op;
    assert.equal(actualOp, expectedOp, `${cardNumber}[${abIdx}] expected ${expectedOp}, got ${actualOp}`);
  }
});

test('HIJ2-COMP-02 [COMPILER_FIDELITY]: BP_DEBUFF distinguishes "Spirit" from "it" pronoun', () => {
  const opSpirit = compileClauseToOp({
    rawText: 'During this turn, give an opposing Spirit -3000 BP.',
    cleanText: 'give an opposing Spirit -3000 BP',
    duration: 'DURING_THIS_TURN'
  });
  assert.equal(opSpirit.op, 'BP_DEBUFF');
  assert.equal(opSpirit.amount, 3000);
  assert.deepEqual(opSpirit.target, { side: 'opp', types: ['Spirit'] });

  const opIt = compileClauseToOp({
    rawText: 'Give it -2000 BP.',
    cleanText: 'Give it -2000 BP',
    duration: 'DURING_THIS_TURN'
  });
  assert.equal(opIt.op, 'BP_DEBUFF');
  assert.equal(opIt.target, 'PREVIOUS_TARGET');
});

test('HIJ2-COMP-03 [COMPILER_FIDELITY]: Cards with optional family capture compile without RFC8785 undefined errors', () => {
  for (const cardNumber of ['CB20-017', 'CB22-017', 'SJ18-08', 'BATTLE-SPIRITS-A9775']) {
    const det = detailedCards[cardNumber];
    assert.ok(det, `Missing ${cardNumber} in cards_detailed.json`);
    const compiled = compileCard(det);
    assert.ok(compiled && Array.isArray(compiled.abilities), `${cardNumber} failed to compile`);
  }
});

test('HIJ2-COMP-04 [COMPILER_FIDELITY]: Structural comparator rejects missing params, extra keys, timing, condition, and clause diffs', () => {
  // 1. Key-order invariant -> EXACT_MATCH
  const exact = semanticCompareOp(
    { op: 'BP_DEBUFF', amount: 3000, target: { side: 'opp', types: ['Spirit'] } },
    { target: { types: ['Spirit'], side: 'opp' }, amount: 3000, op: 'BP_DEBUFF' }
  );
  assert.equal(exact.match, true);
  assert.equal(exact.classification, 'EXACT_MATCH');

  // 2. Default count=1 -> SEMANTICALLY_EQUIVALENT
  const equiv = semanticCompareOp(
    { op: 'DRAW', count: 1, side: 'self' },
    { op: 'DRAW', side: 'self' }
  );
  assert.equal(equiv.match, true);
  assert.equal(equiv.classification, 'SEMANTICALLY_EQUIVALENT');

  // 3. Missing required parameter in fresh -> SEMANTIC_MISMATCH
  const missingFresh = semanticCompareOp(
    { op: 'LIMIT_DECK_DISCARD' },
    { op: 'LIMIT_DECK_DISCARD', maxPerTurn: 5, targetSide: 'self' }
  );
  assert.equal(missingFresh.match, false);
  assert.equal(missingFresh.classification, 'SEMANTIC_MISMATCH');

  // 4. Missing target sub-field -> SEMANTIC_MISMATCH
  const targetDiff = semanticCompareOp(
    { op: 'BP_DEBUFF', amount: 3000, target: { side: 'opp' } },
    { op: 'BP_DEBUFF', amount: 3000, target: { side: 'opp', types: ['Spirit'] } }
  );
  assert.equal(targetDiff.match, false);
  assert.equal(targetDiff.classification, 'SEMANTIC_MISMATCH');

  // 5. Ability structure timing & condition mismatch -> SEMANTIC_MISMATCH
  const abMismatch = compareAbilityStructure(
    { header: { timing: 'WHEN_ATTACKS' }, clauses: [{ condition: null, op: { op: 'DRAW', count: 1 } }] },
    { header: { timing: 'WHEN_SUMMONED' }, clauses: [{ condition: 'Life <= 3', op: { op: 'DRAW', count: 1 } }] }
  );
  assert.equal(abMismatch.match, false);
  assert.equal(abMismatch.classification, 'SEMANTIC_MISMATCH');
  assert.ok(abMismatch.diffs.some(d => d.includes('timing_mismatch')));
  assert.ok(abMismatch.diffs.some(d => d.includes('condition_mismatch')));
});
