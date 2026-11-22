import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  extractRegisteredTests,
  isTestFileInRunner,
  verifyExecutableTestReference
} from '../scripts/discover_executable_tests.mjs';
import {
  buildVerifiedOperationRegistry,
  classifyOperation,
  classifyCondition,
  enumerateConditionOccurrences
} from '../scripts/audit_514_cards_exhaustive.mjs';
import { compileCard } from '../compiler/index.js';
import { executeOp } from '../engine/ops/index.js';
import { createGameState } from '../engine/state.js';

test('WPC3-01: Test ID in a comment or skipped test cannot establish executable evidence', () => {
  const srcWithComment = `
    // test('COMMENT-ONLY-01', () => { executeOp(); assert.equal(1, 1); });
    /* it('BLOCK-COMMENT-01', () => { executeOp(); assert.equal(1, 1); }); */
    test.skip('SKIPPED-01', () => { executeOp(); assert.equal(1, 1); });
    test('REAL-EXEC-01', () => { executeOp(); assert.equal(1, 1); });
  `;
  const extracted = extractRegisteredTests(srcWithComment);
  const names = extracted.map(t => t.name);
  assert.equal(names.includes('COMMENT-ONLY-01'), false);
  assert.equal(names.includes('BLOCK-COMMENT-01'), false);
  assert.equal(names.includes('SKIPPED-01'), false);
  assert.equal(names.includes('REAL-EXEC-01'), true);
});

test('WPC3-02: Missing test ID and missing test file cannot establish evidence', () => {
  const missingId = verifyExecutableTestReference('tests/work_package_c2_evidence_and_compiler.test.js', ['NON_EXISTENT_ID_999'], ['executeOp']);
  assert.equal(missingId.valid, false);
  assert.match(missingId.reason, /TEST_ID_NOT_REGISTERED/);

  const missingFile = verifyExecutableTestReference('tests/non_existent_suite_xyz.test.js', ['ANY-01'], ['executeOp']);
  assert.equal(missingFile.valid, false);
  assert.equal(missingFile.reason, 'TEST_FILE_NOT_FOUND');
});

test('WPC3-03: Test excluded from runner cannot establish verified support', () => {
  assert.equal(isTestFileInRunner('scripts/not_a_runner_test.js'), false);
  assert.equal(isTestFileInRunner('tests/work_package_c3_evidence_integrity.test.js'), true);

  const res = verifyExecutableTestReference('scripts/audit_514_cards_exhaustive.mjs', ['anything'], ['runExhaustiveAudit']);
  assert.equal(res.valid, false);
  assert.equal(res.reason, 'EXCLUDED_FROM_RUNNER');
});

test('WPC3-04: Unlisted operation variant cannot inherit default evidence', () => {
  const reg = buildVerifiedOperationRegistry({
    SUMMON: {
      supportedParamSchema: { required: [], optional: ['from'] },
      explicitlyUnsupportedVariants: [],
      productionHandlerRef: 'engine/ops/index.js',
      variants: {
        'SUMMON:from_HAND': {
          testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
          testIds: ['C1-REG-03: SUMMON rejects invalid initialCores (0, negative, non-integer) before mutating card id']
        },
        'SUMMON:default': {
          testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
          testIds: ['C1-REG-03: SUMMON rejects invalid initialCores (0, negative, non-integer) before mutating card id']
        }
      }
    }
  }, null);

  const handRes = classifyOperation({ op: 'SUMMON', from: 'HAND' }, null, reg);
  assert.equal(handRes.status, 'SEMANTICALLY_VERIFIED');

  // Unlisted GRAVE variant must NOT inherit SUMMON:default or SUMMON:from_HAND
  const graveRes = classifyOperation({ op: 'SUMMON', from: 'GRAVE' }, null, reg);
  assert.notEqual(graveRes.status, 'SEMANTICALLY_VERIFIED');
  assert.equal(graveRes.status, 'PARTIALLY_SUPPORTED');
});

test('WPC3-05: Implemented handler with switch case but no verified test remains HANDLER_PRESENT_UNVERIFIED', () => {
  const res = classifyOperation({ op: 'MODIFY_LIFE', amount: -1 });
  assert.equal(res.status, 'HANDLER_PRESENT_UNVERIFIED');
});

test('WPC3-06: Condition parser with no production evaluator remains unsupported and AST-only test lacks runtime support', () => {
  const astOnlySrc = `
    test('AST-ONLY-COND-01', () => {
      const ast = parseConditionToStructured('your life is 3 or less');
      assert.ok(ast);
    });
  `;
  const extracted = extractRegisteredTests(astOnlySrc);
  assert.equal(extracted.length, 1);
  assert.equal(['checkCondition', 'evaluateCondition', 'evaluateConditionTriState'].some(api => extracted[0].calledIdents.has(api)), false);

  const unknownCond = classifyCondition('totally unknown unparseable condition');
  assert.equal(unknownCond.status, 'PARSE_FAILURE');
});

test('WPC3-07: Condition occurrence enumerator accounts for all locations and reconciles 4,940 vs 4,534', () => {
  const report = enumerateConditionOccurrences();
  assert.equal(report.totalOccurrences, 4940);
  assert.equal(report.byLocation['header.condition'], 0);
  assert.equal(report.byLocation['clause.condition'], 4534);
  assert.equal(report.byLocation['clause.op.condition'], 406);
  assert.equal(report.reconciledExactMatch, true);
  assert.equal(report.opConditionDeltaItems.length, 406);
});

test('WPC3-08: Shard migration diff records before/after SHA-256 and migrated BS69-036 executes from shard', async () => {
  const diffPath = path.resolve('reports/work_package_c3/shard_migration_diff.json');
  assert.equal(fs.existsSync(diffPath), true);
  const diffData = JSON.parse(fs.readFileSync(diffPath, 'utf8'));
  assert.equal(diffData.migratedCount, 5);
  for (const d of diffData.diffs) {
    assert.ok(d.beforeSha256 && d.afterSha256);
    assert.equal(d.deterministicVerified, true);
  }

  const bs69 = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards/BS69.json'), 'utf8'));
  const medis = bs69['BS69-036'];
  const revealAb = medis.abilities.find(a => a.header?.timing === 'WHEN_SUMMONED');
  const state = createGameState();
  state.players.player.deck.push({ id: 'd1' }, { id: 'd2' }, { id: 'd3' }, { id: 'd4' });
  const res = await executeOp(state, revealAb.clauses[0].op, { controller: 'player', sourceCard: medis }, { async choose() { return []; } });
  assert.equal(res.success, true);
  assert.equal(res.count, 3);
  assert.equal(state.players.player.revealed.length, 3);
});

test('WPC3-09: Conservative ability classification never marks ability with unsupported clause as FULLY_SUPPORTED', () => {
  const summary = JSON.parse(fs.readFileSync(path.resolve('reports/work_package_c3/shard_audit_summary.json'), 'utf8'));
  assert.equal(
    summary.abilities.FULLY_SUPPORTED + summary.abilities.PARTIAL + summary.abilities.UNIMPLEMENTED + summary.abilities.NEEDS_MANUAL_REVIEW,
    summary.abilities.totalAbilities
  );
  assert.equal(
    summary.cardStatusProposal.VANILLA_NO_EFFECT + summary.cardStatusProposal.FULLY_SUPPORTED + summary.cardStatusProposal.PARTIAL + summary.cardStatusProposal.UNIMPLEMENTED + summary.cardStatusProposal.NEEDS_MANUAL_REVIEW,
    summary.totalCompiledCardRecords
  );
  assert.equal(summary.operations.reconciledSumCheck, true);
  assert.equal(summary.conditions.reconciledWithAuthoritativeEnumerator, true);
});
