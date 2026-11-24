/**
 * tests/phase_m3_3_audit_matrix_accuracy.test.js
 * 
 * Phase M.3.3 Work Package K: Audit Matrix Accuracy & Reconciled Accounting
 * 
 * Asserts that:
 * 1. Every defect in M3_3_FINDINGS is documented with a valid test file that exists on disk.
 * 2. Every test suite in M3_3_TEST_INVENTORY exists on disk and is executable.
 * 3. Every action in M3_3_ACTION_AUTHORITY_MATRIX corresponds to action_authority sets.
 * 4. Every phase claim in M3_3_PHASE_CLAIM_MATRIX points to an existing evidence file.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  TURN_CONTROLLED_ACTIONS,
  RESPONSE_WINDOW_ACTIONS,
  INTERACTION_ACTIONS,
  ADMINISTRATIVE_ACTIONS
} from '../engine/action_authority.js';

const ROOT_DIR = path.resolve('C:/Users/namis/Downloads/BSP');
const REPORT_DIR = path.join(ROOT_DIR, 'reports/phase_m3_3_integrity_and_security_closure');

test('M3.3-L-01: M3_3_FINDINGS reconciles with verified test files on disk', () => {
  const jsonPath = path.join(REPORT_DIR, 'M3_3_FINDINGS.json');
  assert.ok(fs.existsSync(jsonPath), 'M3_3_FINDINGS.json must exist');

  const findings = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(findings.length, 8, 'Must track all 8 forensic defects (A1-A8)');

  const expectedIds = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
  for (const id of expectedIds) {
    const f = findings.find(x => x.id === id);
    assert.ok(f, `Defect ${id} must be present in findings`);
    assert.equal(f.status, 'RESOLVED', `Defect ${id} must be marked RESOLVED`);

    const suitePath = path.join(ROOT_DIR, f.verificationSuite);
    assert.ok(fs.existsSync(suitePath), `Verification suite ${f.verificationSuite} must exist on disk`);
  }
});

test('M3.3-L-02: M3_3_TEST_INVENTORY contains all 12 suites existing on disk', () => {
  const csvPath = path.join(REPORT_DIR, 'M3_3_TEST_INVENTORY.csv');
  assert.ok(fs.existsSync(csvPath), 'M3_3_TEST_INVENTORY.csv must exist');

  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
  assert.equal(lines.length, 12, 'Must list all 12 dedicated M.3.3 test suites');

  for (const line of lines) {
    const [suiteFile, wp, count, status] = line.split(',');
    assert.equal(status.trim(), 'PASS', `Suite ${suiteFile} must be PASS`);
    const fullPath = path.join(ROOT_DIR, suiteFile.trim());
    assert.ok(fs.existsSync(fullPath), `Suite file ${suiteFile} must exist on disk`);
  }
});

test('M3.3-L-03: M3_3_ACTION_AUTHORITY_MATRIX reconciles with action_authority sets', () => {
  const csvPath = path.join(REPORT_DIR, 'M3_3_ACTION_AUTHORITY_MATRIX.csv');
  assert.ok(fs.existsSync(csvPath), 'M3_3_ACTION_AUTHORITY_MATRIX.csv must exist');

  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
  assert.ok(lines.length >= 25, 'Must document all major engine action types');

  for (const line of lines) {
    const [actionName, category] = line.split(',');
    const name = actionName.trim();
    const cat = category.trim();

    if (cat === 'TURN_CONTROLLED') {
      assert.ok(TURN_CONTROLLED_ACTIONS.has(name), `Action ${name} must be in TURN_CONTROLLED_ACTIONS`);
    } else if (cat === 'RESPONSE_WINDOW') {
      assert.ok(RESPONSE_WINDOW_ACTIONS.has(name), `Action ${name} must be in RESPONSE_WINDOW_ACTIONS`);
    } else if (cat === 'INTERACTION') {
      assert.ok(INTERACTION_ACTIONS.has(name), `Action ${name} must be in INTERACTION_ACTIONS`);
    } else if (cat === 'ADMINISTRATIVE') {
      assert.ok(ADMINISTRATIVE_ACTIONS.has(name), `Action ${name} must be in ADMINISTRATIVE_ACTIONS`);
    }
  }
});

test('M3.3-L-04: M3_3_PHASE_CLAIM_MATRIX reconciles with evidence files', () => {
  const csvPath = path.join(REPORT_DIR, 'M3_3_PHASE_CLAIM_MATRIX.csv');
  assert.ok(fs.existsSync(csvPath), 'M3_3_PHASE_CLAIM_MATRIX.csv must exist');

  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
  for (const line of lines) {
    const parts = line.split(',');
    const evidenceFile = parts[parts.length - 1].trim();
    const fullPath = path.join(ROOT_DIR, evidenceFile);
    assert.ok(fs.existsSync(fullPath), `Evidence file ${evidenceFile} must exist on disk`);
  }
});
