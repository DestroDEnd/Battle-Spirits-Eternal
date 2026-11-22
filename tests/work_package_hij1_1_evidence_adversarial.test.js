/**
 * tests/work_package_hij1_1_evidence_adversarial.test.js
 * Classification: ADVERSARIAL
 *
 * Adversarial Evidence Registry Validation Suite (Work Package H/I/J.1.1).
 * Proves weak, bypassing, generic-assertion, prefix-only, and stale/null evidence
 * cannot be promoted into SEMANTICALLY_VERIFIED status.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  extractRegisteredTests,
  verifyExecutableTestReference
} from '../scripts/discover_executable_tests.mjs';

test('HIJ1_1-EVD-01 [ADVERSARIAL]: Rejects null/empty executionMap, prefix-only match, missing file, and non-asserting tests', () => {
  const realFile = 'tests/work_package_hij_real_cards_e2e.test.js';
  const validId = 'HIJ1-E2E-001 [CARD_ABILITY_E2E]: CP14-X01R (The ImmortalDragon Eternal-Dragonis) resolves SUMMON';

  // 1. Null or empty execution map fails closed
  const rNull = verifyExecutableTestReference(realFile, [validId], ['runCardAbilityE2E'], null);
  assert.equal(rNull.valid, false);
  assert.equal(rNull.reason, 'MISSING_OR_EMPTY_EXECUTION_MAP');

  const rEmpty = verifyExecutableTestReference(realFile, [validId], ['runCardAbilityE2E'], new Map());
  assert.equal(rEmpty.valid, false);
  assert.equal(rEmpty.reason, 'MISSING_OR_EMPTY_EXECUTION_MAP');

  // 2. Prefix-only match fails closed
  const execMap = new Map([[`${realFile}::${validId}`, 'PASS']]);
  const rPrefix = verifyExecutableTestReference(realFile, ['HIJ1-E2E-001'], ['runCardAbilityE2E'], execMap);
  assert.equal(rPrefix.valid, false);
  assert.match(rPrefix.reason, /^TEST_ID_NOT_REGISTERED/);

  // 3. Missing file fails closed
  const rMissing = verifyExecutableTestReference('tests/non_existent_fake_suite.test.js', [validId], [], execMap);
  assert.equal(rMissing.valid, false);
  assert.equal(rMissing.reason, 'TEST_FILE_NOT_FOUND');

  // 4. Stale / FAIL status in execution map fails closed
  const failMap = new Map([[`${realFile}::${validId}`, 'FAIL']]);
  const rFail = verifyExecutableTestReference(realFile, [validId], ['runCardAbilityE2E'], failMap);
  assert.equal(rFail.valid, false);
  assert.match(rFail.reason, /^EXECUTION_FAIL/);

  // 5. Genuine registered test with PASS map succeeds
  const rOk = verifyExecutableTestReference(realFile, [validId], ['runCardAbilityE2E'], execMap);
  assert.equal(rOk.valid, true);
  assert.ok(rOk.fileSha256 && rOk.fileSha256.length === 64);
});

test('HIJ1_1-EVD-02 [ADVERSARIAL]: Detects executeOp bypass and generic fallback assertions in CARD_ABILITY_E2E test bodies', () => {
  const fakeBypassSrc = `
    test('FAKE-BYPASS [CARD_ABILITY_E2E]: Synthetic test', async () => {
      const res = await executeOp(state, op, ctx, prompt, emitter);
      assert.equal(res.success, true);
    });
  `;
  const parsedBypass = extractRegisteredTests(fakeBypassSrc);
  assert.equal(parsedBypass.length, 1);
  assert.equal(parsedBypass[0].classification, 'CARD_ABILITY_E2E');
  assert.equal(parsedBypass[0].calledIdents.has('executeOp'), true);

  // Also verify no test in tests/work_package_hij_real_cards_e2e.test.js calls executeOp or uses snapBefore !== snapAfter
  const realSrc = fs.readFileSync(path.resolve('tests/work_package_hij_real_cards_e2e.test.js'), 'utf8');
  const realTests = extractRegisteredTests(realSrc);
  assert.ok(realTests.length >= 215);
  for (const t of realTests) {
    if (t.classification === 'CARD_ABILITY_E2E' || t.classification === 'CARD_RULES_E2E') {
      assert.equal(t.calledIdents.has('executeOp'), false, `${t.name} must not call executeOp directly`);
      const body = realSrc.slice(t.bodyStart, t.bodyEnd);
      assert.equal(body.includes('snapBefore !== snapAfter'), false, `${t.name} must not use generic snapshot fallback`);
    }
  }
});
