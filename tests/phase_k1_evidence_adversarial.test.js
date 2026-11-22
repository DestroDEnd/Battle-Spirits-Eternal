/**
 * tests/phase_k1_evidence_adversarial.test.js
 * 
 * Battle Spirits Eternal — Phase K.1 Adversarial Evidence Integrity Test Suite.
 * Validates that all 16 adversarial conditions from Work Package J.5 are strictly rejected.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVIDENCE_SCHEMA_VERSION,
  EVIDENCE_CLASSIFICATIONS,
  createEvidenceRecord,
  validateEvidenceRecord
} from '../engine/evidence.js';

function makeValidRecord(overrides = {}) {
  const base = createEvidenceRecord({
    opcode: 'DESTROY',
    cardId: 'BS42-082',
    cardInstanceId: 'inst_BS42-082_1',
    abilityId: 'SEM#BS42-082#a0',
    executionId: 'EXEC-2026-TEST-001',
    sourceZone: 'field',
    targetZone: 'trash',
    targetSide: 'opponent',
    targetCardInstanceId: 'inst_OPP_SPIRIT_1',
    beforeState: {
      zones: {
        field: ['inst_BS42-082_1', 'inst_OPP_SPIRIT_1']
      },
      playerSides: {
        'inst_BS42-082_1': 'player',
        'inst_OPP_SPIRIT_1': 'opponent'
      }
    },
    afterState: {
      zones: {
        field: ['inst_BS42-082_1'],
        trash: ['inst_OPP_SPIRIT_1']
      }
    },
    expectedResult: {
      success: true,
      targetCardInstanceId: 'inst_OPP_SPIRIT_1'
    },
    actualResult: {
      executionId: 'EXEC-2026-TEST-001',
      targetCardInstanceId: 'inst_OPP_SPIRIT_1'
    },
    assertionOutcome: {
      passed: true,
      assertions: ['target_removed_from_field', 'target_placed_in_trash']
    },
    resolverOutcome: {
      executionId: 'EXEC-2026-TEST-001',
      success: true,
      status: 'SUCCESS'
    },
    evidenceClassification: EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED,
    provenance: {
      testSuite: 'tests/real_card_semantic_validation.test.js',
      testName: 'BS42-082 semantic destroy test',
      executionPath: 'PRODUCTION_ENGINE',
      engineVersion: '2.0.0-eternal'
    }
  });

  return { ...base, ...overrides };
}

test('ADV-K1-00: Baseline valid Schema 1.0.0 record passes validation with zero errors', () => {
  const rec = makeValidRecord();
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, true, 'Valid record must pass');
  assert.equal(res.errors.length, 0);
});

test('ADV-K1-01: Reject cross-event mismatch (successful status in one event, delta in another)', () => {
  const rec = makeValidRecord({
    executionId: 'EXEC-ALPHA',
    actualResult: { executionId: 'EXEC-BETA' } // Cross-event execution ID mismatch
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('CROSS_EVENT_MISMATCH')));
});

test('ADV-K1-02: Reject unrelated card ID (cardInstanceId does not match cardId)', () => {
  const rec = makeValidRecord({
    cardId: 'BS42-082',
    cardInstanceId: 'inst_BS01-001_99' // Belonging to another card
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('UNRELATED_CARD_ID')));
});

test('ADV-K1-03: Reject unrelated ability ID (ability does not belong to card)', () => {
  const rec = makeValidRecord({
    cardId: 'BS42-082',
    abilityId: 'SEM#BS01-001#a0' // Belonging to BS01-001, not BS42-082
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('UNRELATED_ABILITY_ID')));
});

test('ADV-K1-04: Reject unrelated test name (testId does not reconcile with testName)', () => {
  const rec = makeValidRecord({
    testId: 'suite_unrelated.test.js::other_test',
    provenance: {
      testSuite: 'tests/real_card_semantic_validation.test.js',
      testName: 'BS42-082 semantic destroy test',
      executionPath: 'PRODUCTION_ENGINE'
    }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('UNRELATED_TEST_NAME')));
});

test('ADV-K1-05: Reject opcode telemetry without semantic assertions for SEMANTICALLY_VERIFIED', () => {
  const rec = makeValidRecord({
    evidenceClassification: EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED,
    assertionOutcome: {
      passed: true,
      assertions: [] // Empty assertions
    }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('OPCODE_TELEMETRY_WITHOUT_ASSERTIONS')));
});

test('ADV-K1-06: Reject state changes caused by direct test mutation', () => {
  const rec = makeValidRecord({
    provenance: {
      testSuite: 'tests/real_card_semantic_validation.test.js',
      testName: 'BS42-082 semantic destroy test',
      executionPath: 'PRODUCTION_ENGINE',
      directStateMutation: true // Direct test mutation flagged
    }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('DIRECT_TEST_MUTATION')));
});

test('ADV-K1-07: Reject legacy execution mislabeled as production execution', () => {
  const rec = makeValidRecord({
    provenance: {
      testSuite: 'tests/real_card_semantic_validation.test.js',
      testName: 'BS42-082 semantic destroy test',
      executionPath: 'LEGACY_RESOLVER',
      mislabeledProduction: true // Claiming production while using legacy
    }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('MISLABELED_EXECUTION_PATH')));
});

test('ADV-K1-08: Reject missing target identity on targeting operations (DESTROY)', () => {
  const rec = makeValidRecord({
    targetCardInstanceId: null,
    actualResult: { targetCardInstanceId: null },
    expectedResult: { targetRequired: true }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('MISSING_TARGET_IDENTITY')));
});

test('ADV-K1-09: Reject incorrect source zone (card not in sourceZone in beforeState)', () => {
  const rec = makeValidRecord({
    sourceZone: 'trash', // Claims trash, but card is in field
    beforeState: {
      zones: {
        field: ['inst_BS42-082_1'],
        trash: []
      }
    }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('INCORRECT_SOURCE_ZONE')));
});

test('ADV-K1-10: Reject incorrect target side (targetSide opponent but card belongs to player)', () => {
  const rec = makeValidRecord({
    targetSide: 'opponent',
    targetCardInstanceId: 'inst_TARGET_1',
    beforeState: {
      playerSides: {
        'inst_TARGET_1': 'player' // Actually belongs to player!
      }
    }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('INCORRECT_TARGET_SIDE')));
});

test('ADV-K1-11: Reject contradictory before/after states (target not destroyed)', () => {
  const rec = makeValidRecord({
    opcode: 'DESTROY',
    targetCardInstanceId: 'inst_OPP_SPIRIT_1',
    afterState: {
      zones: {
        field: ['inst_BS42-082_1', 'inst_OPP_SPIRIT_1'] // Target still in field!
      }
    }
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('CONTRADICTORY_BEFORE_AFTER_STATES')));
});

test('ADV-K1-12: Reject duplicate evidence IDs', () => {
  const seenIds = new Set();
  const rec1 = makeValidRecord({ evidenceId: 'EVID-TEST-DUP-001' });
  const res1 = validateEvidenceRecord(rec1, seenIds);
  assert.equal(res1.valid, true);

  const rec2 = makeValidRecord({ evidenceId: 'EVID-TEST-DUP-001' });
  const res2 = validateEvidenceRecord(rec2, seenIds);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.some(e => e.includes('DUPLICATE_EVIDENCE_ID')));
});

test('ADV-K1-13: Reject invalid schema versions', () => {
  const rec = makeValidRecord({
    schemaVersion: '0.9.0-draft'
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('INVALID_SCHEMA_VERSION')));
});

test('ADV-K1-14: Reject missing provenance', () => {
  const rec = makeValidRecord({
    provenance: null
  });
  const res = validateEvidenceRecord(rec);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('MISSING_PROVENANCE')));
});

test('ADV-K1-15: Reject stale evidence from a previous run or timestamp', () => {
  const rec = makeValidRecord({
    runId: 'RUN-2024-OLD',
    timestamp: '2024-01-01T00:00:00.000Z'
  });
  const res = validateEvidenceRecord(rec, new Set(), {
    activeRunId: 'RUN-2026-ACTIVE',
    minTimestamp: '2026-01-01T00:00:00.000Z'
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('STALE_EVIDENCE')));
});

test('ADV-K1-16: Reject evidence generated by a failed test or execution', () => {
  const recFailedAssert = makeValidRecord({
    assertionOutcome: { passed: false, assertions: ['target_removed'] }
  });
  const res1 = validateEvidenceRecord(recFailedAssert);
  assert.equal(res1.valid, false);
  assert.ok(res1.errors.some(e => e.includes('FAILED_TEST_EVIDENCE')));

  const recFailedExec = makeValidRecord({
    resolverOutcome: { success: false, status: 'FAILED', reason: 'ZONE_LOCKED' }
  });
  const res2 = validateEvidenceRecord(recFailedExec);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.some(e => e.includes('FAILED_TEST_EVIDENCE')));
});
