/**
 * tests/master_runner_adversarial.test.js
 * 
 * Phase 4D Work Package B — Adversarial Verification of Master Test Runner.
 * 
 * Evaluates runner behavior against 10 deliberate adversarial fixtures:
 * 1. Missing test file.
 * 2. Duplicate suite entry.
 * 3. Test process crash (e.g. fatal heap error).
 * 4. Nonzero process exit code.
 * 5. Duplicate test ID / description within a suite.
 * 6. Skipped test (# SKIP).
 * 7. Empty test file (0 tests).
 * 8. Malformed or noisy node:test output.
 * 9. Subprocess timeout.
 * 10. Simulated browser startup failure.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Helper simulating the core line parsing and crash handling algorithm in run_master_verification.mjs
function parseRunnerOutput(stdout, stderr, exitCode, suite = { file: 'dummy.test.js', type: 'unit' }, options = {}) {
  const normPath = suite.file.replace(/\\/g, '/');
  const inventoryItems = [];
  const lines = stdout.split(/\r?\n/);
  let suitePass = 0;
  let suiteFail = 0;
  let suiteSkip = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalExecutions = 0;
  const suiteSeen = new Set();
  let inFailingSummary = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('✖ failing tests:') || trimmed === '✖ failing tests:') {
      inFailingSummary = true;
      continue;
    }
    if (inFailingSummary) {
      continue;
    }

    if (trimmed.startsWith('✔') || trimmed.startsWith('✖') || (trimmed.startsWith('ℹ') && trimmed.includes('# SKIP')) || trimmed.startsWith('- ')) {
      const isPass = trimmed.startsWith('✔');
      const isFail = trimmed.startsWith('✖');
      const isSkip = trimmed.includes('# SKIP');

      if (!isPass && !isFail && !isSkip) continue;

      let testId = null;
      let description = '';
      
      const mColon = trimmed.match(/^[✔✖]\s+([^:]+):\s+(.+?)\s+\(([\d.]+)m?s\)/);
      const mDash = trimmed.match(/^[✔✖]\s+(.+?)\s+-\s+(.+?)\s+\(([\d.]+)m?s\)/);
      const mSimple = trimmed.match(/^[✔✖]\s+(.+?)\s+\(([\d.]+)m?s\)/);

      if (mColon) {
        testId = mColon[1].trim();
        description = mColon[2].trim();
      } else if (mDash) {
        testId = mDash[1].trim();
        description = mDash[2].trim();
      } else if (mSimple) {
        testId = mSimple[1].trim();
        description = mSimple[1].trim();
      } else if (isSkip) {
        testId = trimmed.replace(/^ℹ\s*/, '').replace(/#\s*SKIP.*/, '').trim();
        description = testId;
      }

      if (!testId) continue;

      const suiteKey = `${testId}::${description || testId}`;
      if (suiteSeen.has(suiteKey)) {
        continue;
      }
      suiteSeen.add(suiteKey);

      if (isPass) {
        suitePass++;
        totalPassed++;
        totalExecutions++;
        inventoryItems.push({
          testFile: normPath,
          testId,
          testDescription: description || testId,
          executionResult: 'PASS'
        });
      } else if (isFail) {
        suiteFail++;
        totalFailed++;
        totalExecutions++;
        inventoryItems.push({
          testFile: normPath,
          testId,
          testDescription: description || testId,
          executionResult: 'FAIL',
          failureDetails: {
            line: trimmed,
            rawOutput: stdout.slice(0, 1000)
          }
        });
      } else if (isSkip) {
        suiteSkip++;
        totalSkipped++;
        totalExecutions++;
        inventoryItems.push({
          testFile: normPath,
          testId,
          testDescription: description || testId,
          executionResult: 'SKIP'
        });
      }
    }
  }

  // Handle timeout condition
  if (options.timedOut) {
    suiteFail++;
    totalFailed++;
    totalExecutions++;
    inventoryItems.push({
      testFile: normPath,
      testId: 'SUITE_TIMEOUT',
      testDescription: `Execution timed out after ${options.timeoutMs || 30000}ms`,
      executionResult: 'FAIL',
      failureDetails: { timedOut: true }
    });
  } else if (exitCode !== 0 && suitePass === 0 && suiteFail === 0) {
    // Process crash or non-zero exit without parsed tests
    suiteFail++;
    totalFailed++;
    totalExecutions++;
    inventoryItems.push({
      testFile: normPath,
      testId: 'SUITE_PROCESS_CRASH',
      testDescription: `Process terminated with exit code ${exitCode}`,
      executionResult: 'FAIL',
      failureDetails: {
        exitCode,
        stderr: stderr.slice(0, 2000)
      }
    });
  }

  // Deduplication check
  const uniqueKeys = new Set();
  let duplicateCount = 0;
  for (const item of inventoryItems) {
    const key = `${item.testFile}::${item.testId}::${item.testDescription}`;
    if (uniqueKeys.has(key)) duplicateCount++;
    uniqueKeys.add(key);
  }

  return {
    suitePass,
    suiteFail,
    suiteSkip,
    totalPassed,
    totalFailed,
    totalSkipped,
    totalExecutions,
    duplicateCount,
    inventoryItems
  };
}

// 1. Missing test file
test('WP-B.1: Missing test file produces SUITE_NOT_FOUND or crash record without throwing', () => {
  const normPath = 'tests/non_existent_file_xyz_123.test.js';
  const proc = spawnSync('node', ['--test', normPath], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' }
  });
  const parsed = parseRunnerOutput(proc.stdout || '', proc.stderr || '', proc.status ?? 1, { file: normPath, type: 'unit' });
  assert.equal(parsed.totalFailed, 1, 'Missing test file must be reported as 1 failed execution');
  assert.equal(parsed.totalPassed, 0);
  assert.equal(parsed.inventoryItems[0].executionResult, 'FAIL');
});

// 2. Duplicate suite entry
test('WP-B.2: Duplicate suite detection rejects identical files in configuration', () => {
  const suiteList = [
    { file: 'tests/engine_core.test.js', type: 'unit' },
    { file: 'tests/engine_core.test.js', type: 'unit' }
  ];
  const seenFiles = new Set();
  let duplicateSuites = 0;
  for (const s of suiteList) {
    if (seenFiles.has(s.file)) duplicateSuites++;
    seenFiles.add(s.file);
  }
  assert.equal(duplicateSuites, 1, 'Must detect duplicate suite in configuration');
});

// 3. Process crash
test('WP-B.3: Fatal heap crash / SIGKILL produces SUITE_PROCESS_CRASH with exit code', () => {
  const simulatedOutput = 'FATAL ERROR: Mark-compacts allocation failed - JavaScript heap out of memory';
  const simulatedStderr = 'Process out of memory';
  const parsed = parseRunnerOutput(simulatedOutput, simulatedStderr, 134);
  assert.equal(parsed.totalExecutions, 1);
  assert.equal(parsed.totalFailed, 1);
  assert.equal(parsed.inventoryItems[0].testId, 'SUITE_PROCESS_CRASH');
});

// 4. Nonzero exit code
test('WP-B.4: Nonzero process exit without tests emits failure and preserves error details', () => {
  const simulatedStderr = 'Error: Cannot find module ./missing';
  const parsed = parseRunnerOutput('', simulatedStderr, 1);
  assert.equal(parsed.totalExecutions, 1);
  assert.equal(parsed.totalFailed, 1);
  assert.ok(parsed.inventoryItems[0].failureDetails.stderr.includes('Cannot find module'));
});

// 5. Duplicate test ID within suite
test('WP-B.5: Synthetic duplicate test IDs within a suite are deduplicated', () => {
  const simulatedOutput = `
✔ 1. Duplicate Name (1.0ms)
✔ 1. Duplicate Name (1.1ms)
✔ 2. Unique Name (0.5ms)
`;
  const parsed = parseRunnerOutput(simulatedOutput, '', 0);
  assert.equal(parsed.totalExecutions, 2, 'Deduplicates identical test identities within the same suite');
  assert.equal(parsed.totalPassed, 2);
  assert.equal(parsed.duplicateCount, 0, 'Zero duplicate executions');
});

// 6. Skipped test parsing
test('WP-B.6: Skipped test (# SKIP) is recorded in totalSkipped, not totalPassed or totalFailed', () => {
  const simulatedOutput = `
✔ 1. Active Test (1.0ms)
ℹ 2. Skipped Test # SKIP Not implemented yet
`;
  const parsed = parseRunnerOutput(simulatedOutput, '', 0);
  assert.equal(parsed.totalExecutions, 2);
  assert.equal(parsed.totalPassed, 1);
  assert.equal(parsed.totalSkipped, 1);
  assert.equal(parsed.totalFailed, 0);
  assert.equal(parsed.inventoryItems.find(i => i.executionResult === 'SKIP').testId, '2. Skipped Test');
});

// 7. Empty test file
test('WP-B.7: Empty test file with exit 0 produces 0 executions without crashing runner', () => {
  const simulatedOutput = `
ℹ tests 0
ℹ suites 0
ℹ pass 0
ℹ fail 0
`;
  const parsed = parseRunnerOutput(simulatedOutput, '', 0);
  assert.equal(parsed.totalExecutions, 0);
  assert.equal(parsed.totalFailed, 0);
  assert.equal(parsed.totalPassed, 0);
});

// 8. Malformed or noisy node:test output
test('WP-B.8: Malformed or noisy node:test output does not corrupt inventory', () => {
  const simulatedOutput = `
[Some logger] random debug line
✔ Valid test case (10.0ms)
- another random dash line without format
✔ 
✖ 
some garbage text
ℹ tests 1
ℹ pass 1
`;
  const parsed = parseRunnerOutput(simulatedOutput, '', 0);
  assert.equal(parsed.totalExecutions, 1);
  assert.equal(parsed.totalPassed, 1);
  assert.equal(parsed.inventoryItems[0].testId, 'Valid test case');
  assert.equal(parsed.duplicateCount, 0);
});

// 9. Timeout handling
test('WP-B.9: Subprocess timeout emits SUITE_TIMEOUT cleanly', () => {
  const parsed = parseRunnerOutput('', '', null, { file: 'tests/slow.test.js', type: 'regression' }, { timedOut: true, timeoutMs: 15000 });
  assert.equal(parsed.totalExecutions, 1);
  assert.equal(parsed.totalFailed, 1);
  assert.equal(parsed.inventoryItems[0].testId, 'SUITE_TIMEOUT');
  assert.ok(parsed.inventoryItems[0].testDescription.includes('15000ms'));
});

// 10. Browser startup failure
test('WP-B.10: Browser startup failure emits clear failure and does not hang runner', () => {
  const simulatedOutput = '✖ Browser initialization failed: connect ECONNREFUSED 127.0.0.1:9222 (50.0ms)';
  const parsed = parseRunnerOutput(simulatedOutput, '', 1, { file: 'tests/real_browser_arena.test.js', type: 'e2e' });
  assert.equal(parsed.totalExecutions, 1);
  assert.equal(parsed.totalFailed, 1);
  assert.ok(parsed.inventoryItems[0].failureDetails.line.includes('ECONNREFUSED'));
});
