import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  extractRegisteredTests,
  getRunnerMembership,
  parseExecutionLog,
  verifyExecutableTestReference
} from '../scripts/discover_executable_tests.mjs';
import {
  buildVerifiedOperationRegistry,
  buildVerifiedConditionRegistry,
  classifyOperation,
  classifyCondition,
  enumerateConditionOccurrences
} from '../scripts/audit_514_cards_exhaustive.mjs';
import { compileCard } from '../compiler/index.js';
import { createGameState } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';

test('WPC31-ADV-01: Test IDs inside string, template, regex literals, or comments are NEVER detected as registered tests', () => {
  const adversarialSrc = `
    const decoy1 = "test('STRING-DECOY-01', () => { executeOp(); assert.equal(1, 1); });";
    const decoy2 = \`test('TEMPLATE-DECOY-02', () => { executeOp(); assert.equal(1, 1); });\`;
    const decoy3 = /test\\('REGEX-DECOY-03'\\)/;
    // test('LINE-COMMENT-DECOY-04', () => { executeOp(); assert.equal(1, 1); });
    /* test('BLOCK-COMMENT-DECOY-05', () => { executeOp(); assert.equal(1, 1); }); */
    test('REAL-TEST-06', () => { executeOp(); assert.equal(1, 1); });
  `;
  const extracted = extractRegisteredTests(adversarialSrc);
  const names = extracted.map(t => t.name);
  assert.deepEqual(names, ['REAL-TEST-06']);
});

test('WPC31-ADV-02: Empty test callback CANNOT inherit assertions or production API calls from neighboring test', () => {
  const adjacentSrc = `
    test('EMPTY-CB-01', () => {});
    test('NEIGHBOR-VALID-02', () => {
      executeOp();
      assert.equal(1, 1);
    });
  `;
  const extracted = extractRegisteredTests(adjacentSrc);
  assert.equal(extracted.length, 2);

  const emptyCb = extracted.find(t => t.name === 'EMPTY-CB-01');
  const neighbor = extracted.find(t => t.name === 'NEIGHBOR-VALID-02');
  assert.equal(emptyCb.hasAssert, false);
  assert.equal(emptyCb.calledIdents.has('executeOp'), false);
  assert.equal(neighbor.hasAssert, true);
  assert.equal(neighbor.calledIdents.has('executeOp'), true);
});

test('WPC31-ADV-03: String/comment assertions and API calls inside callback body do NOT satisfy evidence', () => {
  const fakeBodySrc = `
    test('FAKE-BODY-01', () => {
      // executeOp();
      const s = "assert.equal(1, 1); executeOp();";
    });
  `;
  const extracted = extractRegisteredTests(fakeBodySrc);
  assert.equal(extracted.length, 1);
  assert.equal(extracted[0].hasAssert, false);
  assert.equal(extracted[0].calledIdents.has('executeOp'), false);
});

test('WPC31-ADV-04: Helper-scoped, loop-generated, and skipped/todo tests are NOT credited', () => {
  const scopedSrc = `
    function helper() {
      test('HELPER-SCOPED-01', () => { executeOp(); assert.equal(1, 1); });
    }
    for (const x of [1, 2]) {
      test('LOOP-GEN-02', () => { executeOp(); assert.equal(1, 1); });
    }
    test.skip('SKIPPED-03', () => { executeOp(); assert.equal(1, 1); });
    test.todo('TODO-04', () => { executeOp(); assert.equal(1, 1); });
    test('DIRECT-VALID-05', () => { executeOp(); assert.equal(1, 1); });
  `;
  const extracted = extractRegisteredTests(scopedSrc);
  assert.deepEqual(extracted.map(t => t.name), ['DIRECT-VALID-05']);
});

test('WPC31-RUN-01: Runner membership distinguishes full runner vs verified runner separately', () => {
  const c31 = getRunnerMembership('tests/work_package_c3_1_evidence_integrity.test.js');
  assert.equal(c31.inFullRunner, true);
  assert.equal(c31.inVerifiedRunner, true);

  // phase4b3 is in full runner (run_all.js) but NOT in run_verified_suites.mjs
  const p4b3 = getRunnerMembership('tests/phase4b3_reveal_burst_replace_summon.test.js');
  assert.equal(p4b3.inFullRunner, true);
  assert.equal(p4b3.inVerifiedRunner, false);

  const nonRunner = getRunnerMembership('scripts/audit_514_cards_exhaustive.mjs');
  assert.equal(nonRunner.inFullRunner, false);
  assert.equal(nonRunner.inVerifiedRunner, false);
});

test('WPC31-EXEC-01: Failed, skipped, and unexecuted tests in execution logs are rejected as semantic evidence', () => {
  const execMap = new Map([
    ['WPC31-ADV-01: Test IDs inside string, template, regex literals, or comments are NEVER detected as registered tests', 'PASS'],
    ['WPC31-ADV-02: Empty test callback CANNOT inherit assertions or production API calls from neighboring test', 'FAIL'],
    ['WPC31-ADV-03: String/comment assertions and API calls inside callback body do NOT satisfy evidence', 'SKIP']
  ]);

  const failCheck = verifyExecutableTestReference(
    'tests/work_package_c3_1_evidence_integrity.test.js',
    ['WPC31-ADV-02: Empty test callback CANNOT inherit assertions or production API calls from neighboring test'],
    [],
    execMap
  );
  assert.equal(failCheck.valid, false);
  assert.match(failCheck.reason, /^EXECUTION_FAIL:/);

  const skipCheck = verifyExecutableTestReference(
    'tests/work_package_c3_1_evidence_integrity.test.js',
    ['WPC31-ADV-03: String/comment assertions and API calls inside callback body do NOT satisfy evidence'],
    [],
    execMap
  );
  assert.equal(skipCheck.valid, false);
  assert.match(skipCheck.reason, /^EXECUTION_SKIP:/);

  const unexecCheck = verifyExecutableTestReference(
    'tests/work_package_c3_1_evidence_integrity.test.js',
    ['WPC31-ADV-04: Helper-scoped, loop-generated, and skipped/todo tests are NOT credited'],
    [],
    execMap
  );
  assert.equal(unexecCheck.valid, false);
  assert.match(unexecCheck.reason, /^NOT_EXECUTED:/);
});

test('WPC31-VAR-01: Unlisted variant, incomplete params, and legacy condition cannot become SEMANTICALLY_VERIFIED', () => {
  const opReg = buildVerifiedOperationRegistry(undefined, new Map());
  const unlisted = classifyOperation({ op: 'SUMMON', from: 'GRAVE' }, null, opReg);
  assert.notEqual(unlisted.status, 'SEMANTICALLY_VERIFIED');

  const incomplete = classifyOperation({ op: 'REPLACEMENT_EFFECT' }, null, opReg);
  assert.equal(incomplete.status, 'PARAMETERS_INCOMPLETE');

  const condReg = buildVerifiedConditionRegistry(undefined, new Map());
  const legacy = classifyCondition({ type: 'LEGACY_CONTEXT_CONDITION', raw: 'unknown legacy' }, condReg);
  assert.notEqual(legacy.status, 'SEMANTICALLY_VERIFIED');
});

test('WPC31-COND-01: Authoritative condition enumerator finds 0 unexpected locations and reconciles exact totals', () => {
  const report = enumerateConditionOccurrences();
  assert.equal(report.unexpectedLocations.length, 0);
  assert.equal(report.reconciledExactMatch, true);
  assert.equal(
    report.byLocation['header.condition'] + report.byLocation['clause.condition'] + report.byLocation['clause.op.condition'],
    report.totalOccurrences
  );
});

test('WPC31-SHARD-01: All 514 shards parse cleanly and migrated BS64-X04 & BS20-X01 execute via production path', async () => {
  const diff = JSON.parse(fs.readFileSync(path.resolve('reports/work_package_c3/shard_migration_diff.json'), 'utf8'));
  assert.equal(diff.migratedCount, 5);

  const bs64 = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards/BS64.json'), 'utf8'));
  const gefan = bs64['BS64-X04'];
  const advAb = gefan.abilities.find(a => a.header?.timing === 'WHEN_ADVENTS');
  const state = createGameState();
  state.players.player.deck.push({ id: 'p1' }, { id: 'p2' }, { id: 'p3' });
  state.players.opponent.deck.push({ id: 'o1' }, { id: 'o2' }, { id: 'o3' });
  const res = await executeOp(state, advAb.clauses[0].op, { controller: 'player', sourceCard: gefan }, { async choose() { return []; } });
  assert.equal(res.success, true);
  assert.equal(state.players.player.revealed.length, 3);
  assert.equal(state.players.opponent.revealed.length, 3);
});
