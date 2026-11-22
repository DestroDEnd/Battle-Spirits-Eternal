/**
 * tests/phase_k_evidence_adversarial.test.js
 * 
 * Adversarial Evidence Integrity Test Suite for Phase K Work Package B4.
 * Formally proves that evidence records cannot be fabricated, combined, or falsely promoted.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVIDENCE_TIERS,
  generateEvidenceId,
  validateEvidenceRecord,
  classifyAbilitySupport,
  classifyCardSupport
} from '../engine/evidence.js';

test('ADV-EVID-01: Reject duplicate evidence IDs', () => {
  const seenIds = new Set();
  const id = generateEvidenceId('DESTROY', 'BS01-001', 1);

  const rec1 = {
    evidenceId: id,
    testId: 'TEST-1',
    testSuite: 'suite.test.js',
    cardNumber: 'BS01-001',
    physicalAbilityId: 'BS01-001#AB_1',
    opcode: 'DESTROY',
    controller: 'player',
    executionTimestamp: new Date().toISOString(),
    executionResult: { success: true, status: 'SUCCESS' },
    assertionResult: { passed: true, assertedProperties: ['destination_trash', 'target_removed'] },
    evidenceTier: EVIDENCE_TIERS.SEMANTICALLY_VERIFIED
  };

  const res1 = validateEvidenceRecord(rec1, seenIds);
  assert.equal(res1.valid, true, 'First registration must be valid');

  const rec2 = { ...rec1 };
  const res2 = validateEvidenceRecord(rec2, seenIds);
  assert.equal(res2.valid, false, 'Duplicate evidence ID must be rejected');
  assert.ok(res2.errors.some(e => e.includes('DUPLICATE_EVIDENCE_ID')));
});

test('ADV-EVID-02: Reject semantic promotion when assertionResult.passed is false', () => {
  const seenIds = new Set();
  const id = generateEvidenceId('DRAW', 'BS01-002', 1);

  const record = {
    evidenceId: id,
    testId: 'TEST-2',
    testSuite: 'suite.test.js',
    cardNumber: 'BS01-002',
    physicalAbilityId: 'BS01-002#AB_1',
    opcode: 'DRAW',
    controller: 'player',
    executionTimestamp: new Date().toISOString(),
    executionResult: { success: true, status: 'SUCCESS' },
    assertionResult: { passed: false, assertedProperties: ['cards_entered_hand'], failureDetails: 'Hand count mismatch' },
    evidenceTier: EVIDENCE_TIERS.SEMANTICALLY_VERIFIED
  };

  const res = validateEvidenceRecord(record, seenIds);
  assert.equal(res.valid, false, 'Failed assertion cannot produce SEMANTICALLY_VERIFIED evidence');
  assert.ok(res.errors.some(e => e.includes('INVALID_PROMOTION')));
});

test('ADV-EVID-03: Reject semantic promotion when executionResult.success is false', () => {
  const seenIds = new Set();
  const id = generateEvidenceId('MOVE_CORE', 'BS01-003', 1);

  const record = {
    evidenceId: id,
    testId: 'TEST-3',
    testSuite: 'suite.test.js',
    cardNumber: 'BS01-003',
    physicalAbilityId: 'BS01-003#AB_1',
    opcode: 'MOVE_CORE',
    controller: 'player',
    executionTimestamp: new Date().toISOString(),
    executionResult: { success: false, status: 'FAILED', reason: 'INSUFFICIENT_CORES' },
    assertionResult: { passed: true, assertedProperties: ['reserve_cores'] },
    evidenceTier: EVIDENCE_TIERS.SEMANTICALLY_VERIFIED
  };

  const res = validateEvidenceRecord(record, seenIds);
  assert.equal(res.valid, false, 'Failed execution cannot produce SEMANTICALLY_VERIFIED evidence');
  assert.ok(res.errors.some(e => e.includes('INVALID_PROMOTION')));
});

test('ADV-EVID-04: Reject semantic promotion with empty asserted properties (weak assertion)', () => {
  const seenIds = new Set();
  const id = generateEvidenceId('BOUNCE', 'BS01-004', 1);

  const record = {
    evidenceId: id,
    testId: 'TEST-4',
    testSuite: 'suite.test.js',
    cardNumber: 'BS01-004',
    physicalAbilityId: 'BS01-004#AB_1',
    opcode: 'BOUNCE',
    controller: 'player',
    executionTimestamp: new Date().toISOString(),
    executionResult: { success: true, status: 'SUCCESS' },
    assertionResult: { passed: true, assertedProperties: [] }, // No state asserted!
    evidenceTier: EVIDENCE_TIERS.SEMANTICALLY_VERIFIED
  };

  const res = validateEvidenceRecord(record, seenIds);
  assert.equal(res.valid, false, 'Empty assertions cannot produce SEMANTICALLY_VERIFIED evidence');
  assert.ok(res.errors.some(e => e.includes('weak assertion')));
});

test('ADV-EVID-05: DESTROY operation must assert target removal and destination', () => {
  const seenIds = new Set();
  const id = generateEvidenceId('DESTROY', 'BS01-005', 1);

  const record = {
    evidenceId: id,
    testId: 'TEST-5',
    testSuite: 'suite.test.js',
    cardNumber: 'BS01-005',
    physicalAbilityId: 'BS01-005#AB_1',
    opcode: 'DESTROY',
    controller: 'player',
    executionTimestamp: new Date().toISOString(),
    executionResult: { success: true, status: 'SUCCESS' },
    assertionResult: { passed: true, assertedProperties: ['generic_flag_checked'] }, // Missing trash/removal!
    evidenceTier: EVIDENCE_TIERS.SEMANTICALLY_VERIFIED
  };

  const res = validateEvidenceRecord(record, seenIds);
  assert.equal(res.valid, false, 'DESTROY without target removal / trash assertion must fail');
  assert.ok(res.errors.some(e => e.includes('SEMANTIC_INTEGRITY_FAIL: DESTROY')));
});

test('ADV-EVID-06: BP_BUFF operation must assert effective BP change', () => {
  const seenIds = new Set();
  const id = generateEvidenceId('BP_BUFF', 'BS01-006', 1);

  const record = {
    evidenceId: id,
    testId: 'TEST-6',
    testSuite: 'suite.test.js',
    cardNumber: 'BS01-006',
    physicalAbilityId: 'BS01-006#AB_1',
    opcode: 'BP_BUFF',
    controller: 'player',
    executionTimestamp: new Date().toISOString(),
    executionResult: { success: true, status: 'SUCCESS' },
    assertionResult: { passed: true, assertedProperties: ['event_dispatched'] }, // Missing BP assertion!
    evidenceTier: EVIDENCE_TIERS.SEMANTICALLY_VERIFIED
  };

  const res = validateEvidenceRecord(record, seenIds);
  assert.equal(res.valid, false, 'BP_BUFF without effective BP assertion must fail');
  assert.ok(res.errors.some(e => e.includes('SEMANTIC_INTEGRITY_FAIL: BP modifier')));
});

test('ADV-EVID-07: Multi-ability card is demoted if ANY constituent ability is incomplete', () => {
  const card = {
    cardNumber: 'CP14-X14R',
    name: 'Test Boss Spirit',
    abilities: [
      { id: 'ab1', clauses: [{ op: { op: 'SUMMON' } }] },
      { id: 'ab2', clauses: [{ op: { op: 'DRAW' } }] },
      { id: 'ab3', clauses: [{ op: { op: 'UNSUPPORTED_SPECIAL' } }] }
    ]
  };

  const abilityClassifications = [
    EVIDENCE_TIERS.SEMANTICALLY_VERIFIED,
    EVIDENCE_TIERS.SEMANTICALLY_VERIFIED,
    EVIDENCE_TIERS.HANDLER_PRESENT // Secondary ability unverified
  ];

  const cardTier = classifyCardSupport(card, abilityClassifications);
  assert.equal(cardTier, EVIDENCE_TIERS.HANDLER_PRESENT, 'Card must be demoted to HANDLER_PRESENT due to unverified secondary ability');
});

test('ADV-EVID-08: Card with blocked dependency is classified as BLOCKED_UNSUPPORTED_DEPENDENCY', () => {
  const braveCard = {
    cardNumber: 'BS10-062',
    name: 'Brave Falcon',
    type: 'Brave',
    effect: 'Braved condition: Cost 5 or more'
  };

  const tier = classifyCardSupport(braveCard, [EVIDENCE_TIERS.SEMANTICALLY_VERIFIED]);
  assert.equal(tier, EVIDENCE_TIERS.BLOCKED_UNSUPPORTED_DEPENDENCY, 'Brave card with unhandled braved condition must be BLOCKED');
});

test('ADV-EVID-09: Vanilla card is classified as VANILLA', () => {
  const vanillaCard = {
    cardNumber: 'BS01-002',
    name: 'Vanilla Lizard',
    type: 'Spirit',
    abilities: []
  };

  const tier = classifyCardSupport(vanillaCard, []);
  assert.equal(tier, EVIDENCE_TIERS.VANILLA, 'Card with 0 abilities must be VANILLA');
});
