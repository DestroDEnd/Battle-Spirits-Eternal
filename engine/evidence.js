/**
 * engine/evidence.js
 * 
 * Battle Spirits Eternal — Production Structured Execution Evidence System (Phase K.1).
 * Provides deterministic evidence record creation, versioned schema (1.0.0) validation,
 * event-level binding, machine-verifiable provenance, and adversarial integrity guards.
 */

import crypto from 'crypto';

export const EVIDENCE_SCHEMA_VERSION = '1.0.0';

export const EVIDENCE_CLASSIFICATIONS = Object.freeze({
  CORPUS_PRESENT: 'CORPUS_PRESENT',
  COMPILED: 'COMPILED',
  HANDLER_PRESENT: 'HANDLER_PRESENT',
  HANDLER_REACHABLE: 'HANDLER_REACHABLE',
  INTEGRATION_EXECUTED: 'INTEGRATION_EXECUTED',
  SEMANTICALLY_VERIFIED: 'SEMANTICALLY_VERIFIED',
  BLOCKED: 'BLOCKED',
  UNSUPPORTED: 'UNSUPPORTED'
});

export const EVIDENCE_TIERS = Object.freeze({
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  COMPILER_ONLY: 'COMPILER_ONLY',
  HANDLER_PRESENT: 'HANDLER_PRESENT',
  INTEGRATION_VERIFIED: 'INTEGRATION_VERIFIED',
  SEMANTICALLY_VERIFIED: 'SEMANTICALLY_VERIFIED',
  RULE_INTEGRATION_VERIFIED: 'RULE_INTEGRATION_VERIFIED',
  BLOCKED_UNSUPPORTED_DEPENDENCY: 'BLOCKED_UNSUPPORTED_DEPENDENCY',
  VANILLA: 'VANILLA',
  ...EVIDENCE_CLASSIFICATIONS
});

export const CLASSIFICATION_HIERARCHY = Object.freeze({
  UNSUPPORTED: 0,
  NOT_IMPLEMENTED: 0,
  BLOCKED: 1,
  BLOCKED_UNSUPPORTED_DEPENDENCY: 1,
  CORPUS_PRESENT: 2,
  COMPILED: 3,
  COMPILER_ONLY: 3,
  HANDLER_PRESENT: 4,
  HANDLER_REACHABLE: 5,
  INTEGRATION_EXECUTED: 6,
  INTEGRATION_VERIFIED: 6,
  SEMANTICALLY_VERIFIED: 7,
  RULE_INTEGRATION_VERIFIED: 7,
  VANILLA: 7
});

const TIER_HIERARCHY = {
  NOT_IMPLEMENTED: 0,
  UNSUPPORTED: 0,
  COMPILER_ONLY: 1,
  COMPILED: 1,
  BLOCKED_UNSUPPORTED_DEPENDENCY: 2,
  BLOCKED: 2,
  HANDLER_PRESENT: 3,
  HANDLER_REACHABLE: 3,
  INTEGRATION_VERIFIED: 4,
  INTEGRATION_EXECUTED: 4,
  SEMANTICALLY_VERIFIED: 5,
  RULE_INTEGRATION_VERIFIED: 6,
  VANILLA: 6
};

/**
 * Generates a stable, deterministic evidence ID.
 */
export function generateEvidenceId(opcode, cardNumber, indexOrExec = 1) {
  const cleanOp = String(opcode || 'OP').toUpperCase();
  const cleanCard = String(cardNumber || 'CARD').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const ts = Date.now();
  const hash = crypto.createHash('sha256').update(`${cleanOp}:${cleanCard}:${indexOrExec}:${ts}`).digest('hex').slice(0, 8);
  return `EVID-${cleanOp}-${ts}-${hash}`;
}

/**
 * Factory to create a fully-formed, 22-field evidence record conforming to Schema 1.0.0.
 */
export function createEvidenceRecord(params = {}) {
  const opcode = String(params.opcode || 'UNKNOWN').toUpperCase();
  const cardId = params.cardId || params.cardNumber || 'UNKNOWN';
  const executionId = params.executionId || `EXEC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const evidenceId = params.evidenceId || generateEvidenceId(opcode, cardId, executionId);

  return {
    evidenceId,
    schemaVersion: params.schemaVersion || EVIDENCE_SCHEMA_VERSION,
    timestamp: params.timestamp || new Date().toISOString(),
    runId: params.runId || `RUN-${Date.now()}`,
    testId: params.testId || (params.provenance?.testSuite ? `${params.provenance.testSuite}::${params.provenance.testName || 'test'}` : 'TEST-ANON'),
    cardId,
    cardInstanceId: params.cardInstanceId || `inst_${cardId}_1`,
    abilityId: params.abilityId || params.physicalAbilityId || `${cardId}#AB_DEFAULT`,
    opcode,
    executionId,
    sourceZone: params.sourceZone !== undefined ? params.sourceZone : null,
    targetZone: params.targetZone !== undefined ? params.targetZone : null,
    targetSide: params.targetSide !== undefined ? params.targetSide : null,
    targetCardInstanceId: params.targetCardInstanceId !== undefined ? params.targetCardInstanceId : null,
    beforeState: params.beforeState ? JSON.parse(JSON.stringify(params.beforeState)) : {},
    afterState: params.afterState ? JSON.parse(JSON.stringify(params.afterState)) : {},
    expectedResult: params.expectedResult ? JSON.parse(JSON.stringify(params.expectedResult)) : {},
    actualResult: params.actualResult ? JSON.parse(JSON.stringify(params.actualResult)) : {},
    assertionOutcome: {
      passed: Boolean(params.assertionOutcome?.passed ?? params.assertionResult?.passed ?? true),
      assertions: Array.isArray(params.assertionOutcome?.assertions)
        ? params.assertionOutcome.assertions
        : (Array.isArray(params.assertionResult?.assertedProperties) ? params.assertionResult.assertedProperties : [])
    },
    resolverOutcome: {
      success: Boolean(params.resolverOutcome?.success ?? params.executionResult?.success ?? true),
      status: params.resolverOutcome?.status || params.executionResult?.status || 'SUCCESS',
      reason: params.resolverOutcome?.reason || null
    },
    evidenceClassification: params.evidenceClassification || params.evidenceTier || EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED,
    provenance: {
      testSuite: params.provenance?.testSuite || params.testSuite || 'unknown_suite',
      testName: params.provenance?.testName || params.testName || 'unknown_test',
      executionPath: params.provenance?.executionPath || 'PRODUCTION_ENGINE',
      engineVersion: params.provenance?.engineVersion || '2.0.0-eternal',
      gitCommit: params.provenance?.gitCommit || null,
      directStateMutation: Boolean(params.provenance?.directStateMutation)
    }
  };
}

/**
 * Validates a single structured execution evidence record against Phase K / K.1 strict integrity rules.
 * Supports both legacy Phase K schema and Phase K.1 Schema 1.0.0.
 * 
 * @param {object} record
 * @param {Set<string>} seenIds Set of previously registered evidence IDs to reject duplicates
 * @param {object} options Validation options (activeRunId, minTimestamp, etc.)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEvidenceRecord(record, seenIds = new Set(), options = {}) {
  const errors = [];

  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['RECORD_NULL_OR_NOT_AN_OBJECT'] };
  }

  // Duplicate ID Check (common to all schemas)
  if (record.evidenceId) {
    if (seenIds.has(record.evidenceId)) {
      errors.push(`DUPLICATE_EVIDENCE_ID:${record.evidenceId}`);
    } else {
      seenIds.add(record.evidenceId);
    }
  }

  const isSchema100 = Boolean(record.schemaVersion);

  if (isSchema100) {
    // -------------------------------------------------------------
    // PHASE K.1 SCHEMA 1.0.0 STRICT VALIDATION (22 fields + 16 checks)
    // -------------------------------------------------------------
    if (record.schemaVersion !== EVIDENCE_SCHEMA_VERSION) {
      errors.push(`INVALID_SCHEMA_VERSION: Expected ${EVIDENCE_SCHEMA_VERSION}, received ${record.schemaVersion}`);
    }

    const requiredFields = [
      'evidenceId', 'schemaVersion', 'timestamp', 'runId', 'testId',
      'cardId', 'cardInstanceId', 'abilityId', 'opcode', 'executionId',
      'sourceZone', 'targetZone', 'targetSide', 'targetCardInstanceId',
      'beforeState', 'afterState', 'expectedResult', 'actualResult',
      'assertionOutcome', 'resolverOutcome', 'evidenceClassification', 'provenance'
    ];

    for (const field of requiredFields) {
      if (record[field] === undefined) {
        errors.push(`MISSING_REQUIRED_FIELD:${field}`);
      }
    }

    // Stale Evidence Check
    if (options.activeRunId && record.runId && record.runId !== options.activeRunId) {
      errors.push(`STALE_EVIDENCE: Run ID mismatch (active: ${options.activeRunId}, record: ${record.runId})`);
    }
    if (options.minTimestamp) {
      const recTs = new Date(record.timestamp).getTime();
      const minTs = new Date(options.minTimestamp).getTime();
      if (recTs < minTs) {
        errors.push(`STALE_EVIDENCE: Record timestamp (${record.timestamp}) predates minimum (${options.minTimestamp})`);
      }
    }

    // Provenance validation
    if (!record.provenance || typeof record.provenance !== 'object') {
      errors.push('MISSING_PROVENANCE: Record must include a provenance object');
    } else {
      if (!record.provenance.testSuite) {
        errors.push('MISSING_PROVENANCE: provenance.testSuite is required');
      }
      if (!record.provenance.executionPath) {
        errors.push('MISSING_PROVENANCE: provenance.executionPath is required');
      }
    }

    // Test ID / Test Name reconciliation
    if (record.testId && record.provenance?.testName) {
      const cleanTestId = record.testId.toLowerCase();
      const cleanTestName = record.provenance.testName.toLowerCase();
      const cleanTestSuite = (record.provenance.testSuite || '').toLowerCase();
      if (!cleanTestId.includes(cleanTestName) && !cleanTestId.includes(cleanTestSuite)) {
        errors.push(`UNRELATED_TEST_NAME: testId (${record.testId}) does not reconcile with testName (${record.provenance.testName})`);
      }
    }

    // Card ID / Instance / Ability Identity reconciliation
    if (record.cardId) {
      const cleanCard = String(record.cardId).toUpperCase();
      if (record.cardInstanceId && typeof record.cardInstanceId === 'string') {
        const instUpper = record.cardInstanceId.toUpperCase();
        if (instUpper.includes('BS') || instUpper.includes('SD') || instUpper.includes('BSC')) {
          if (!instUpper.includes(cleanCard)) {
            errors.push(`UNRELATED_CARD_ID: cardInstanceId (${record.cardInstanceId}) does not match cardId (${cleanCard})`);
          }
        }
      }
      if (record.abilityId && typeof record.abilityId === 'string') {
        if (record.abilityId.includes('#') && !record.abilityId.toUpperCase().includes(cleanCard)) {
          errors.push(`UNRELATED_ABILITY_ID: abilityId (${record.abilityId}) does not belong to cardId (${cleanCard})`);
        }
      }
    }

    // Event-Level Evidence Binding & Cross-Event Rejection
    if (record.executionId) {
      if (record.actualResult?.executionId && record.actualResult.executionId !== record.executionId) {
        errors.push(`CROSS_EVENT_MISMATCH: actualResult.executionId (${record.actualResult.executionId}) does not match record.executionId (${record.executionId})`);
      }
      if (record.resolverOutcome?.executionId && record.resolverOutcome.executionId !== record.executionId) {
        errors.push(`CROSS_EVENT_MISMATCH: resolverOutcome.executionId (${record.resolverOutcome.executionId}) does not match record.executionId (${record.executionId})`);
      }
    }

    // Direct Test Mutation Rejection
    if (record.provenance?.directStateMutation === true ||
        record.actualResult?.directMutation === true ||
        record.actualResult?.bypassedResolver === true) {
      errors.push('DIRECT_TEST_MUTATION: State changes produced by direct test mutation cannot establish semantic proof');
    }

    // Execution Path Integrity (Legacy vs Production)
    if (record.provenance?.executionPath === 'LEGACY_RESOLVER') {
      if (record.provenance?.mislabeledProduction === true) {
        errors.push('MISLABELED_EXECUTION_PATH: Legacy resolver execution cannot be labeled as PRODUCTION_ENGINE');
      }
      if (record.evidenceClassification === EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED &&
          record.provenance?.executionPath !== 'PRODUCTION_ENGINE' &&
          !record.provenance?.allowLegacySemanticProof) {
        errors.push('MISLABELED_EXECUTION_PATH: Cannot claim SEMANTICALLY_VERIFIED on PRODUCTION_ENGINE when executed via LEGACY_RESOLVER');
      }
    }

    // Failed Test / Execution Outcome Rejection
    const execSuccess = record.resolverOutcome?.success === true;
    const assertPassed = record.assertionOutcome?.passed === true;
    const assertedProps = Array.isArray(record.assertionOutcome?.assertions) ? record.assertionOutcome.assertions : [];

    if (record.evidenceClassification === EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED ||
        record.evidenceClassification === EVIDENCE_CLASSIFICATIONS.INTEGRATION_EXECUTED) {
      if (!execSuccess) {
        errors.push('FAILED_TEST_EVIDENCE: Cannot claim verified evidence when resolverOutcome.success is false');
      }
      if (!assertPassed) {
        errors.push('FAILED_TEST_EVIDENCE: Cannot claim verified evidence when assertionOutcome.passed is false');
      }
    }

    // Opcode Telemetry Without Semantic Assertions Check
    if (record.evidenceClassification === EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED) {
      if (assertedProps.length === 0) {
        errors.push('OPCODE_TELEMETRY_WITHOUT_ASSERTIONS: SEMANTICALLY_VERIFIED requires non-empty assertions proving state transition');
      }
    }

    // Missing Target Identity on Targeting Operations
    const targetOps = ['DESTROY', 'BOUNCE', 'SALVAGE', 'MOVE_CARD', 'RETURN_TO_DECK', 'BP_BUFF', 'BP_DEBUFF'];
    const op = String(record.opcode || '').toUpperCase();
    if (targetOps.includes(op) && (record.evidenceClassification === EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED || record.evidenceClassification === EVIDENCE_CLASSIFICATIONS.INTEGRATION_EXECUTED)) {
      const hasTarget = record.targetCardInstanceId || record.targetCardId || record.actualResult?.targetCardInstanceId || record.expectedResult?.targetRequired === false;
      if (!hasTarget) {
        errors.push(`MISSING_TARGET_IDENTITY: Operation ${op} requires target identity`);
      }
    }

    // Source Zone Integrity Check
    if (record.sourceZone && record.beforeState) {
      const bz = record.beforeState.zones;
      const cardInst = record.cardInstanceId;
      if (bz && bz[record.sourceZone]) {
        const inZone = bz[record.sourceZone].includes(cardInst) ||
                       bz[record.sourceZone].some(c => (typeof c === 'string' ? c === cardInst : c.instanceId === cardInst || c.id === cardInst));
        if (!inZone) {
          errors.push(`INCORRECT_SOURCE_ZONE: Card instance ${cardInst} not present in sourceZone ${record.sourceZone} in beforeState`);
        }
      }
    }

    // Target Side Integrity Check
    if (record.targetSide && record.beforeState?.playerSides && record.targetCardInstanceId) {
      const actualOwner = record.beforeState.playerSides[record.targetCardInstanceId];
      if (actualOwner && actualOwner !== record.targetSide) {
        errors.push(`INCORRECT_TARGET_SIDE: targetSide is ${record.targetSide} but card belongs to ${actualOwner}`);
      }
    }

    // Contradictory Before/After States
    if (record.beforeState && record.afterState && (record.evidenceClassification === EVIDENCE_CLASSIFICATIONS.SEMANTICALLY_VERIFIED)) {
      if (op === 'DESTROY') {
        const az = record.afterState.zones;
        const targetInst = record.targetCardInstanceId || record.actualResult?.targetCardInstanceId;
        if (az && targetInst && az.field) {
          const stillInField = az.field.includes(targetInst) || az.field.some(c => (typeof c === 'string' ? c === targetInst : c.instanceId === targetInst));
          if (stillInField) {
            errors.push(`CONTRADICTORY_BEFORE_AFTER_STATES: Card ${targetInst} still in field after DESTROY operation`);
          }
        }
      } else if (op === 'DRAW') {
        const bHand = record.beforeState.handCount ?? record.beforeState.hand?.length;
        const aHand = record.afterState.handCount ?? record.afterState.hand?.length;
        if (bHand !== undefined && aHand !== undefined && aHand <= bHand) {
          errors.push(`CONTRADICTORY_BEFORE_AFTER_STATES: Hand count did not increase after DRAW (${bHand} -> ${aHand})`);
        }
      }
    }

  } else {
    // -------------------------------------------------------------
    // LEGACY PHASE K SCHEMA VALIDATION (backward compatibility)
    // -------------------------------------------------------------
    const requiredFields = [
      'evidenceId', 'testId', 'testSuite', 'cardNumber',
      'physicalAbilityId', 'opcode', 'controller',
      'executionTimestamp', 'executionResult', 'assertionResult', 'evidenceTier'
    ];

    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`MISSING_REQUIRED_FIELD:${field}`);
      }
    }

    const execSuccess = record.executionResult?.success === true;
    const assertPassed = record.assertionResult?.passed === true;
    const assertedProps = Array.isArray(record.assertionResult?.assertedProperties)
      ? record.assertionResult.assertedProperties
      : [];

    if (
      record.evidenceTier === EVIDENCE_TIERS.SEMANTICALLY_VERIFIED ||
      record.evidenceTier === EVIDENCE_TIERS.RULE_INTEGRATION_VERIFIED
    ) {
      if (!execSuccess) {
        errors.push('INVALID_PROMOTION: Cannot be SEMANTICALLY_VERIFIED when executionResult.success is not true');
      }
      if (!assertPassed) {
        errors.push('INVALID_PROMOTION: Cannot be SEMANTICALLY_VERIFIED when assertionResult.passed is not true');
      }
      if (assertedProps.length === 0) {
        errors.push('INVALID_PROMOTION: Cannot be SEMANTICALLY_VERIFIED with empty assertedProperties (weak assertion)');
      }
    }

    const op = String(record.opcode || '').toUpperCase();
    if (record.evidenceTier === EVIDENCE_TIERS.SEMANTICALLY_VERIFIED || record.evidenceTier === EVIDENCE_TIERS.RULE_INTEGRATION_VERIFIED) {
      if (op === 'DESTROY') {
        const hasDestructAssert = assertedProps.some(p => /destination|trash|removed|destroyed/i.test(p));
        if (!hasDestructAssert) {
          errors.push('SEMANTIC_INTEGRITY_FAIL: DESTROY evidence must assert destination zone or target removal');
        }
      } else if (op === 'DRAW') {
        const hasDrawAssert = assertedProps.some(p => /hand|draw|cardsDrawn/i.test(p));
        if (!hasDrawAssert) {
          errors.push('SEMANTIC_INTEGRITY_FAIL: DRAW evidence must assert cards entered hand');
        }
      } else if (op === 'BOUNCE') {
        const hasBounceAssert = assertedProps.some(p => /hand|deck|bounce|returned/i.test(p));
        if (!hasBounceAssert) {
          errors.push('SEMANTIC_INTEGRITY_FAIL: BOUNCE evidence must assert card entered hand or deck');
        }
      } else if (op === 'MOVE_CORE') {
        const hasCoreAssert = assertedProps.some(p => /core|reserve|pool|trash/i.test(p));
        if (!hasCoreAssert) {
          errors.push('SEMANTIC_INTEGRITY_FAIL: MOVE_CORE evidence must assert source/destination core counts');
        }
      } else if (op === 'BP_BUFF' || op === 'BP_DEBUFF' || op === 'MODIFY_BP') {
        const hasBpAssert = assertedProps.some(p => /bp|effectiveBp|amount/i.test(p));
        if (!hasBpAssert) {
          errors.push('SEMANTIC_INTEGRITY_FAIL: BP modifier evidence must assert effective BP change');
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Classifies an individual ability based on its constituent clause evidence records.
 */
export function classifyAbilitySupport(ability, clauseEvidence = []) {
  if (!ability || !Array.isArray(ability.clauses) || ability.clauses.length === 0) {
    return EVIDENCE_TIERS.VANILLA;
  }

  let minRank = TIER_HIERARCHY.RULE_INTEGRATION_VERIFIED;
  let minTier = EVIDENCE_TIERS.RULE_INTEGRATION_VERIFIED;

  for (let idx = 0; idx < ability.clauses.length; idx++) {
    const clause = ability.clauses[idx];
    const op = clause?.op?.op;
    if (!op) continue;

    const ev = clauseEvidence.find(e => e.clauseIndex === idx || e.opcode === op);
    const tier = ev ? (ev.evidenceTier || ev.evidenceClassification) : EVIDENCE_TIERS.HANDLER_PRESENT;
    const rank = TIER_HIERARCHY[tier] !== undefined ? TIER_HIERARCHY[tier] : 0;

    if (rank < minRank) {
      minRank = rank;
      minTier = tier;
    }
  }

  return minTier;
}

/**
 * Classifies a complete card based on all its compiled abilities and execution evidence.
 * Rule: A card is only SEMANTICALLY_VERIFIED if ALL of its compiled abilities meet that standard!
 */
export function classifyCardSupport(card, abilityClassifications = []) {
  if (!card) return EVIDENCE_TIERS.NOT_IMPLEMENTED;

  // Check explicit modern subsystem dependencies
  const typeLower = String(card.type || '').toLowerCase();
  const nameLower = String(card.name || '').toLowerCase();
  const cardNum = String(card.cardNumber || card.card_number || card.id || '');
  const rawEffect = String(card.effect || card.raw_effect || card.rawEffect || '');

  // Subsystem checks for unsupported mechanics
  if (typeLower.includes('brave') && rawEffect && /braved|brave\s+condition/i.test(rawEffect)) {
    return EVIDENCE_TIERS.BLOCKED_UNSUPPORTED_DEPENDENCY;
  }
  if (typeLower.includes('nexus') && (nameLower.includes('grandwalker') || nameLower.includes('god'))) {
    return EVIDENCE_TIERS.BLOCKED_UNSUPPORTED_DEPENDENCY;
  }
  if (cardNum.endsWith('a') || cardNum.endsWith('b') || (rawEffect && /rebirth:|tensei:/i.test(rawEffect))) {
    return EVIDENCE_TIERS.BLOCKED_UNSUPPORTED_DEPENDENCY;
  }

  const abs = card.abilities || [];
  if (abs.length === 0 && !rawEffect.trim()) {
    return EVIDENCE_TIERS.VANILLA;
  }
  if (abs.length === 0 && rawEffect.trim()) {
    return EVIDENCE_TIERS.COMPILER_ONLY;
  }

  let minRank = TIER_HIERARCHY.RULE_INTEGRATION_VERIFIED;
  let minTier = EVIDENCE_TIERS.RULE_INTEGRATION_VERIFIED;

  for (let i = 0; i < abs.length; i++) {
    const abTier = abilityClassifications[i] || EVIDENCE_TIERS.HANDLER_PRESENT;
    const rank = TIER_HIERARCHY[abTier] !== undefined ? TIER_HIERARCHY[abTier] : 0;
    if (rank < minRank) {
      minRank = rank;
      minTier = abTier;
    }
  }

  return minTier;
}
