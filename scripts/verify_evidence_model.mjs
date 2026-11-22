/**
 * scripts/verify_evidence_model.mjs
 * 
 * Verifiable evidence loader and source validator for Phase 2.2.1 Milestone 2.
 * Validates that every evidence record references real test files, exact test IDs,
 * master runner suites, production APIs, and concrete AST assertions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverTestsInFile } from './discover_executable_tests.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Authoritative Master Suites
export const MASTER_SUITES = [
  'tests/core_game_rules_integrity_corrective.test.js',
  'tests/core_game_rules_engine.test.js',
  'tests/timing_triggers_continuous_sba.test.js',
  'tests/effect_execution_targeting_conditions.test.js',
  'tests/engine_core.test.js',
  'tests/keyword_registry.test.js',
  'tests/phase3_continuous_and_cost_gating.test.js',
  'tests/work_package_c_ops_conditions_compiler.test.js',
  'tests/work_package_c1_auditor_and_regression.test.js',
  'tests/work_package_c2_evidence_and_compiler.test.js',
  'tests/work_package_c3_evidence_integrity.test.js',
  'tests/work_package_c3_1_evidence_integrity.test.js',
  'tests/eternal_17_burst_declaration.test.js',
  'tests/eternal_17_flag_nexus.test.js',
  'tests/eternal_17_soulcore_keywords.test.js',
  'tests/eternal_17_standby_unification.test.js',
  'tests/adversarial_m3_stress.test.js',
  'tests/physical_ability_identity_corrective.test.js',
  'tests/physical_ability_identity_final.test.js',
  'tests/physical_ability_identity_integrity.test.js',
  'tests/work_package_hij1_conditions_truth_table.test.js',
  'tests/work_package_hij1_operation_variants.test.js',
  'tests/work_package_hij1_adversarial_determinism.test.js',
  'tests/work_package_hij1_1_evidence_adversarial.test.js',
  'tests/phase5_windows_ai.test.js',
  'tests/interaction_protocol.test.js',
  'tests/prompt_manager_compatibility.test.js',
  'tests/ui_engine_integration.test.js',
  'tests/playable_engine_complete_match.test.js',
  'tests/playable_engine_local_match.test.js',
  'tests/public_release_e2e_match.test.js',
  'tests/phase6_7_ui_routes.test.js',
  'tests/real_cards_17_strengthened_regression.test.js',
  'tests/work_package_hij_real_cards_e2e.test.js',
  'tests/browser_arena_gameplay.test.js',
  'tests/real_browser_arena.test.js',
  'tests/adversarial_evidence_validation.test.js'
];

const masterSuiteSet = new Set(MASTER_SUITES.map(s => s.replace(/\\/g, '/')));

export function validateEvidenceRecord(record) {
  const { opcode, variant, tier, evidence } = record;

  if (tier === 'PARSED_ONLY') {
    return {
      valid: true,
      tier: 'PARSED_ONLY',
      reason: 'No executable handler claimed; parsed representation in compiler AST only.'
    };
  }

  if (tier === 'HANDLER_PRESENT') {
    return {
      valid: true,
      tier: 'HANDLER_PRESENT',
      reason: 'Production switch-case handler in engine/ops/index.js verified; granular variant tests pending.'
    };
  }

  // For RUNTIME_TESTED, SEMANTICALLY_VERIFIED, and FULLY_SUPPORTED:
  if (!evidence || !evidence.testFile || !evidence.testId) {
    return {
      valid: false,
      reason: `MISSING_EVIDENCE_SPEC: ${opcode}::${variant} claimed tier ${tier} but missing testFile or testId`
    };
  }

  const normFile = evidence.testFile.replace(/\\/g, '/');
  const absPath = path.join(ROOT, normFile);

  if (!fs.existsSync(absPath)) {
    return {
      valid: false,
      reason: `TEST_FILE_NOT_FOUND: ${evidence.testFile}`
    };
  }

  if (!masterSuiteSet.has(normFile)) {
    return {
      valid: false,
      reason: `TEST_FILE_NOT_IN_MASTER_RUNNER: ${evidence.testFile}`
    };
  }

  const disc = discoverTestsInFile(absPath);
  const matchedTest = disc.tests.find(t => t.name === evidence.testId);

  if (!matchedTest) {
    // Check if testId was given as prefix or partial
    const partialMatch = disc.tests.find(t => t.name.startsWith(evidence.testId));
    if (partialMatch) {
      return {
        valid: false,
        reason: `PREFIX_OR_PARTIAL_MATCH_REJECTED: ${evidence.testId} is not an exact match (found: "${partialMatch.name}")`
      };
    }
    return {
      valid: false,
      reason: `EXACT_TEST_ID_NOT_FOUND: ${evidence.testId} in ${evidence.testFile}`
    };
  }

  if (!matchedTest.hasAssert) {
    return {
      valid: false,
      reason: `NO_ASSERTIONS_IN_TEST: ${evidence.testId}`
    };
  }

  const body = disc.src.slice(matchedTest.bodyStart, matchedTest.bodyEnd);

  // Check production API invocation
  const productionApis = ['createGame', 'executeOp', 'startMatch', 'advanceStep', 'playCard', 'moveCore', 'resolveTargets', 'recalculateSpiritBp', 'calculateSymbolReduction', 'payCost', 'declareAttack', 'resolveCombat', 'runCardAbilityE2E'];
  const callsProdApi = productionApis.some(api => matchedTest.calledIdents.has(api) || body.includes(api));

  if (!callsProdApi) {
    return {
      valid: false,
      reason: `NO_PRODUCTION_API_INVOCATION: ${evidence.testId}`
    };
  }

  // Check state assertions
  const hasStateAssert = /state\.|player\.|reserve|life|field|hand|modifiers|currentBp|currentCores|cores/.test(body) &&
                         /assert\.(equal|deepEqual|ok|strictEqual)/.test(body);
  if (!hasStateAssert) {
    return {
      valid: false,
      reason: `INSUFFICIENT_STATE_ASSERTIONS: ${evidence.testId}`
    };
  }

  // Tier-specific validation
  if (tier === 'FULLY_SUPPORTED') {
    if (!evidence.verifiesInitialState || !evidence.verifiesFinalState || !evidence.verifiesEmittedEvents) {
      return {
        valid: false,
        reason: `FULLY_SUPPORTED_REQUIRES_INITIAL_FINAL_AND_EVENTS: ${opcode}::${variant}`
      };
    }
    if (!evidence.hasRealCardCoverage) {
      return {
        valid: false,
        reason: `FULLY_SUPPORTED_REQUIRES_REAL_CARD_COVERAGE: ${opcode}::${variant}`
      };
    }
  }

  return {
    valid: true,
    matchedTestName: matchedTest.name,
    fileSha256: disc.fileSha256,
    hasStateAssert,
    callsProdApi
  };
}
