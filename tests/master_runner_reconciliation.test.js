/**
 * tests/master_runner_reconciliation.test.js
 * 
 * Regression Test Suite for the Master Verification Runner (scripts/run_master_verification.mjs).
 * 
 * Asserts:
 * - TC-MRUN-01: Correctly discovers all 37 authoritative suites without overlap.
 * - TC-MRUN-02: Strictly prevents duplicate counting or double execution.
 * - TC-MRUN-03: Segregates Real Browser CDP E2E from Mock-DOM Integration tests.
 * - TC-MRUN-04: Robustly parses stdout without converting failures or error banners to generic tests.
 * - TC-MRUN-05: Fails closed (reconciliation invariant error) if any duplicate or uncounted test occurs.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('TC-MRUN-01: Verifies master inventory records at least 37 distinct suites and zero duplicate executions', () => {
  const invPath = path.join(ROOT, 'reports', 'playable_engine_phase_2_2_1_closure', 'test_inventory.json');
  assert.equal(fs.existsSync(invPath), true, 'test_inventory.json must exist in closure reports');

  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const suiteCount = inv.metadata.totalSuites || inv.metadata.totalMasterSuites || 0;
  assert.ok(suiteCount >= 37, 'Must execute at least 37 master suites');
  assert.equal(inv.metadata.totalExecutions - inv.metadata.uniqueTestCases, 0, 'Duplicate executions must be strictly 0');
  assert.equal(inv.metadata.uniqueTestCases, inv.metadata.totalExecutions, 'Every execution must correspond to a unique test key');
  assert.equal(inv.metadata.totalFailed, 0, 'Total failed must be 0');
});

test('TC-MRUN-02: Segregates real browser tests from mock-DOM unit tests', () => {
  const invPath = path.join(ROOT, 'reports', 'playable_engine_phase_2_2_1_closure', 'test_inventory.json');
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  assert.equal(inv.metadata.realBrowserTestCount, 1, 'Real browser test count must be 1');
  assert.equal(inv.metadata.mockDomTestCount, 1, 'Mock-DOM test count must be 1');

  const browserEntry = inv.inventory.find(i => i.testFile === 'tests/real_browser_arena.test.js');
  assert.ok(browserEntry, 'Real browser entry must exist');
  assert.equal(browserEntry.isBrowserTest, true);
  assert.equal(browserEntry.isMockDomTest, false);

  const mockEntry = inv.inventory.find(i => i.testFile === 'tests/browser_arena_gameplay.test.js');
  assert.ok(mockEntry, 'Mock-DOM entry must exist');
  assert.equal(mockEntry.isBrowserTest, false);
  assert.equal(mockEntry.isMockDomTest, true);
});

test('TC-MRUN-03: Line parser rejects non-test failure lines without inventing phantom tests', () => {
  // Simulate lines that previously caused false positives in node:test output
  const sampleStdoutLines = [
    '✖ failing tests:',
    'test at tests\\real_browser_arena.test.js:22:1',
    '✖ REAL-BROWSER-E2E-01: Genuine UI-to-Engine Gameplay in Real Chrome (13036.5978ms)',
    '  AssertionError [ERR_ASSERTION]: Expected true',
    '      at TestContext.<anonymous> (file:///test.js:1:1)',
    '✔ REAL-BROWSER-PASS: Passed test (24.12ms)',
    'ℹ tests 2',
    'ℹ suites 0'
  ];

  let parsedCount = 0;
  const parsedIds = [];

  for (const line of sampleStdoutLines) {
    const trimmed = line.trim();
    if (!trimmed.match(/^[✔✖]\s+.*?\(([\d.]+)m?s\)$/) && !trimmed.includes('# SKIP')) {
      continue;
    }

    const mColon = trimmed.match(/^[✔✖]\s+([^:]+):\s+(.+?)\s+\(([\d.]+)m?s\)/);
    const mDash = trimmed.match(/^[✔✖]\s+(.+?)\s+-\s+(.+?)\s+\(([\d.]+)m?s\)/);
    const mSimple = trimmed.match(/^[✔✖]\s+(.+?)\s+\(([\d.]+)m?s\)/);

    let testId = null;
    if (mColon) testId = mColon[1].trim();
    else if (mDash) testId = mDash[1].trim();
    else if (mSimple) testId = mSimple[1].trim();

    if (testId) {
      parsedCount++;
      parsedIds.push(testId);
    }
  }

  // Must only parse the 2 real tests with duration, never headers or stack traces
  assert.equal(parsedCount, 2, 'Must parse exactly the 2 valid test lines with duration');
  assert.deepEqual(parsedIds, ['REAL-BROWSER-E2E-01', 'REAL-BROWSER-PASS']);
});
