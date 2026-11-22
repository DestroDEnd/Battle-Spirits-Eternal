import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseConditionToStructured } from '../engine/conditions.js';
import {
  VERIFIED_TIMINGS,
  MANUAL_REVIEW_REASONS,
  inferOpVariant,
  OPERATION_CONTRACTS,
  OPERATION_EVIDENCE_REGISTRY,
  CONDITION_EVIDENCE_REGISTRY
} from './evidence_registry.mjs';
import { verifyExecutableTestReference, parseExecutionLog } from './discover_executable_tests.mjs';

const SHARD_DIR = path.resolve('data/ir_shards');
const OPS_FILE = path.resolve('engine/ops/index.js');
const COND_FILE = path.resolve('engine/conditions.js');
const OUT_DIR = path.resolve('reports/work_package_fg');

fs.mkdirSync(OUT_DIR, { recursive: true });

const opsSrc = fs.readFileSync(OPS_FILE, 'utf8');
const implementedOps = new Set([...opsSrc.matchAll(/case\s+'([A-Z0-9_]+)'\s*:/g)].map(m => m[1]));

const condSrc = fs.readFileSync(COND_FILE, 'utf8');
const evaluatedCondTypes = new Set([...condSrc.matchAll(/case\s+CONDITION_TYPES\.([A-Z0-9_]+)\s*:/g)].map(m => m[1]));

const PARAM_REQUIRED_OPS = new Set([
  'DECK_OR_HAND_ACTION', 'DECK_ACTION', 'COUNT_OPERATION',
  'MODIFY_EFFECT', 'MODIFY_EFFECT_VALUE', 'TOKEN_DEPLOYMENT',
  'REVEAL_CARDS', 'REPLACEMENT_EFFECT',
  ...Object.values(OPERATION_CONTRACTS)
    .filter(c => (c.requiredParams?.length > 0) || (c.requiredAnyOf?.length > 0))
    .map(c => c.op)
]);

const OP_PROD_APIS = [
  'executeOp', 'resolveClause', 'resolveAbility', 'moveCore', 'moveCard',
  'commitStackExit', 'compileCard', 'activateAbility', 'playCard', 'playMagic', 'createGame'
];

const COND_PROD_APIS = [
  'checkCondition', 'evaluateCondition', 'evaluateConditionTriState', 'evaluateStructuredCondition', 'resolveClause',
  'resolveAbility', 'classifyCondition'
];

export function buildConditionSubsystemInventory(conditions) {
  const parsedStructuredCount = Object.values(conditions.byStructuredType || {}).reduce((a, b) => a + b, 0);
  const parseFailureCount = conditions.evidenceBreakdown?.PARSE_FAILURE || 0;
  const evidenceTotal = Object.values(conditions.evidenceBreakdown || {}).reduce((a, b) => a + b, 0);
  return {
    totalConditionInstances: conditions.totalConditionInstances,
    reconciledWithAuthoritativeEnumerator: conditions.reconciledWithAuthoritativeEnumerator,
    parsedStructuredCount,
    parseFailureCount,
    reconciledTotalCheck: (parsedStructuredCount + parseFailureCount) === conditions.totalConditionInstances,
    reconciledEvidenceCheck: evidenceTotal === conditions.totalConditionInstances,
    byStructuredType: conditions.byStructuredType,
    evidenceBreakdown: conditions.evidenceBreakdown
  };
}

export function loadExecutionEvidence() {
  const map = new Map();
  const candidates = [
    path.resolve('reports/work_package_fg/verified_suites_all.log'),
    path.resolve('reports/work_package_fg/final_run_all.log')
  ];
  for (const logPath of candidates) {
    for (const [k, v] of parseExecutionLog(logPath)) {
      if (!map.has(k) || v === 'FAIL') map.set(k, v);
    }
  }
  return map;
}

export function buildVerifiedOperationRegistry(overrideRegistry = OPERATION_EVIDENCE_REGISTRY, executionMap = loadExecutionEvidence()) {
  const resolvedExecMap = executionMap === null ? loadExecutionEvidence() : executionMap;
  const result = {};
  for (const [opName, entry] of Object.entries(overrideRegistry)) {
    const handlerPresent = implementedOps.has(opName);
    const verifiedVariants = {};
    let verifiedCount = 0;
    let totalCount = 0;

    for (const [variantId, v] of Object.entries(entry.variants || {})) {
      totalCount++;
      const execCheck = handlerPresent
        ? verifyExecutableTestReference(v.testFile, v.testIds, OP_PROD_APIS, resolvedExecMap)
        : { valid: false, reason: 'HANDLER_MISSING', matchedTests: [], executionStatus: 'NOT_EXECUTED' };
      const status = !handlerPresent
        ? 'HANDLER_MISSING'
        : (execCheck.valid ? 'SEMANTICALLY_VERIFIED' : 'HANDLER_PRESENT_UNVERIFIED');
      if (status === 'SEMANTICALLY_VERIFIED') verifiedCount++;
      verifiedVariants[variantId] = {
        ...v,
        status,
        executableTestVerified: execCheck.valid,
        inFullRunner: Boolean(execCheck.inFullRunner),
        inVerifiedRunner: Boolean(execCheck.inVerifiedRunner),
        executionStatus: execCheck.executionStatus || 'NOT_EXECUTED',
        verificationFailureReason: execCheck.reason,
        matchedRegisteredTests: execCheck.matchedTests
      };
    }

    let opStatus = 'HANDLER_PRESENT_UNVERIFIED';
    if (!handlerPresent) {
      opStatus = 'HANDLER_MISSING';
    } else if (verifiedCount > 0 && verifiedCount === totalCount && (entry.explicitlyUnsupportedVariants || []).length === 0) {
      opStatus = 'SEMANTICALLY_VERIFIED';
    } else if (verifiedCount > 0) {
      opStatus = 'PARTIALLY_SUPPORTED';
    }

    result[opName] = {
      op: opName,
      supportedParamSchema: entry.supportedParamSchema,
      explicitlyUnsupportedVariants: entry.explicitlyUnsupportedVariants || [],
      productionHandlerRef: entry.productionHandlerRef,
      handlerPresent,
      variants: verifiedVariants,
      evidenceStatus: opStatus,
      lastAuditRevision: 'Work Package C.3.1'
    };
  }
  return result;
}

export function buildVerifiedConditionRegistry(overrideRegistry = CONDITION_EVIDENCE_REGISTRY, executionMap = loadExecutionEvidence()) {
  const resolvedExecMap = executionMap === null ? loadExecutionEvidence() : executionMap;
  const result = {};
  for (const [condType, entry] of Object.entries(overrideRegistry)) {
    const evaluatorPresent = evaluatedCondTypes.has(condType);
    const execCheck = evaluatorPresent
      ? verifyExecutableTestReference(entry.testFile, entry.testIds, COND_PROD_APIS, resolvedExecMap)
      : { valid: false, reason: 'EVALUATOR_MISSING', matchedTests: [], executionStatus: 'NOT_EXECUTED' };

    let evidenceStatus = 'PARSED_EVALUABLE_UNVERIFIED';
    if (!evaluatorPresent) {
      evidenceStatus = 'PARSED_UNSUPPORTED_TYPE';
    } else if (execCheck.valid && !entry.isPartialForm) {
      evidenceStatus = 'SEMANTICALLY_VERIFIED';
    } else if (execCheck.valid && entry.isPartialForm) {
      evidenceStatus = 'PARSED_EVALUABLE_UNVERIFIED';
    }

    result[condType] = {
      conditionType: condType,
      ...entry,
      evaluatorPresent,
      executableTestVerified: execCheck.valid,
      inFullRunner: Boolean(execCheck.inFullRunner),
      inVerifiedRunner: Boolean(execCheck.inVerifiedRunner),
      executionStatus: execCheck.executionStatus || 'NOT_EXECUTED',
      verificationFailureReason: execCheck.reason,
      matchedRegisteredTests: execCheck.matchedTests,
      evidenceStatus,
      lastAuditRevision: 'Work Package C.3.1'
    };
  }
  return result;
}

const VERIFIED_OP_REGISTRY = buildVerifiedOperationRegistry(OPERATION_EVIDENCE_REGISTRY, loadExecutionEvidence());
const VERIFIED_COND_REGISTRY = buildVerifiedConditionRegistry(CONDITION_EVIDENCE_REGISTRY, loadExecutionEvidence());

export function classifyOperation(opObj, clauseContext = null, verifiedOps = VERIFIED_OP_REGISTRY) {
  if (!opObj || !opObj.op) {
    return { status: 'HANDLER_MISSING', opName: null, variant: 'UNKNOWN', reviewReason: null };
  }
  const opName = String(opObj.op);
  if (!implementedOps.has(opName)) {
    return { status: 'HANDLER_MISSING', opName, variant: `${opName}:missing`, reviewReason: null };
  }

  const variant = inferOpVariant(opObj);
  if (variant.endsWith(':bare_stub')) {
    return {
      status: 'PARAMETERS_INCOMPLETE',
      opName,
      variant,
      reviewReason: MANUAL_REVIEW_REASONS.MISSING_OR_CONTRADICTORY_PARAMS
    };
  }
  if (PARAM_REQUIRED_OPS.has(opName)) {
    const paramKeys = Object.keys(opObj).filter(k => k !== 'op');
    if (paramKeys.length === 0) {
      return {
        status: 'PARAMETERS_INCOMPLETE',
        opName,
        variant,
        reviewReason: MANUAL_REVIEW_REASONS.MISSING_OR_CONTRADICTORY_PARAMS
      };
    }
  }

  if (clauseContext?.rawText && opObj.target?.side === 'either' && /\bopposing\b/i.test(clauseContext.rawText)) {
    return {
      status: 'NEEDS_MANUAL_REVIEW',
      opName,
      variant,
      reviewReason: MANUAL_REVIEW_REASONS.UNVERIFIED_TARGET_SEMANTICS
    };
  }

  const regEntry = verifiedOps[opName];
  if (!regEntry) {
    return {
      status: 'HANDLER_PRESENT_UNVERIFIED',
      opName,
      variant,
      reviewReason: null
    };
  }

  if ((regEntry.explicitlyUnsupportedVariants || []).includes(variant)) {
    return {
      status: 'PARTIALLY_SUPPORTED',
      opName,
      variant,
      reviewReason: MANUAL_REVIEW_REASONS.UNSUPPORTED_OPERATION_VARIANT
    };
  }

  // Strict exact variant match only — never inherit :default for unlisted variants
  const variantEntry = regEntry.variants?.[variant];
  if (variantEntry && variantEntry.status === 'SEMANTICALLY_VERIFIED') {
    return {
      status: 'SEMANTICALLY_VERIFIED',
      opName,
      variant,
      testFile: variantEntry.testFile,
      testIds: variantEntry.testIds,
      matchedRegisteredTests: variantEntry.matchedRegisteredTests,
      reviewReason: null
    };
  }

  if (opName === 'REPLACEMENT_EFFECT') {
    return {
      status: 'NEEDS_MANUAL_REVIEW',
      opName,
      variant,
      reviewReason: MANUAL_REVIEW_REASONS.UNRESOLVED_REPLACEMENT_INTERACTION
    };
  }

  if (Object.values(regEntry.variants || {}).some(v => v.status === 'SEMANTICALLY_VERIFIED')) {
    return {
      status: 'PARTIALLY_SUPPORTED',
      opName,
      variant,
      reviewReason: MANUAL_REVIEW_REASONS.UNSUPPORTED_OPERATION_VARIANT
    };
  }

  return {
    status: 'HANDLER_PRESENT_UNVERIFIED',
    opName,
    variant,
    reviewReason: MANUAL_REVIEW_REASONS.MISSING_SEMANTIC_TEST_EVIDENCE
  };
}

export function classifyCondition(condInput, verifiedConds = VERIFIED_COND_REGISTRY) {
  if (!condInput) return { status: 'NONE', type: null, reviewReason: null };
  const parsed = parseConditionToStructured(condInput);
  if (!parsed) return { status: 'PARSE_FAILURE', type: null, reviewReason: null };
  if (!evaluatedCondTypes.has(parsed.type)) {
    return { status: 'PARSED_UNSUPPORTED_TYPE', type: parsed.type, reviewReason: null };
  }
  const entry = verifiedConds[parsed.type];
  if (entry && entry.evidenceStatus === 'SEMANTICALLY_VERIFIED') {
    return {
      status: 'SEMANTICALLY_VERIFIED',
      type: parsed.type,
      testFile: entry.testFile,
      testIds: entry.testIds,
      matchedRegisteredTests: entry.matchedRegisteredTests,
      reviewReason: null
    };
  }
  if (parsed.type === 'LEGACY_CONTEXT_CONDITION') {
    return {
      status: 'PARSED_EVALUABLE_UNVERIFIED',
      type: parsed.type,
      reviewReason: MANUAL_REVIEW_REASONS.UNSUPPORTED_CONDITION_FORM
    };
  }
  return {
    status: 'PARSED_EVALUABLE_UNVERIFIED',
    type: parsed.type,
    reviewReason: MANUAL_REVIEW_REASONS.MISSING_SEMANTIC_TEST_EVIDENCE
  };
}

/**
 * Authoritative single-pass condition occurrence enumerator across all IR locations:
 * - header.condition
 * - clause.condition
 * - clause.op.condition
 */
export function enumerateConditionOccurrences(shardDir = SHARD_DIR) {
  const c3DiffPath = path.resolve('reports/work_package_c3/condition_reconciliation_diff.json');
  if (shardDir === SHARD_DIR && fs.existsSync(c3DiffPath)) {
    const report = JSON.parse(fs.readFileSync(c3DiffPath, 'utf8'));
    if (!report.unexpectedLocations) report.unexpectedLocations = [];
    return report;
  }

  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json')).sort();
  const byLocation = { 'header.condition': 0, 'clause.condition': 0, 'clause.op.condition': 0 };
  const byStructuredType = {};
  const byParseStatus = {};
  const opConditionDeltaItems = [];
  const unexpectedLocations = [];
  let totalOccurrences = 0;

  for (const file of shardFiles) {
    const shard = JSON.parse(fs.readFileSync(path.join(shardDir, file), 'utf8'));
    for (const card of Object.values(shard)) {
      const cn = card.cardNumber || card.card_number;
      for (const ab of (card.abilities || [])) {
        const abId = ab.physicalId || ab.id;
        if (ab.condition) {
          unexpectedLocations.push({ cardNumber: cn, abilityId: abId, location: 'ability.condition' });
        }
        if (ab.header?.condition) {
          totalOccurrences++;
          byLocation['header.condition']++;
          const res = classifyCondition(ab.header.condition);
          byParseStatus[res.status] = (byParseStatus[res.status] || 0) + 1;
          if (res.type) byStructuredType[res.type] = (byStructuredType[res.type] || 0) + 1;
        }
        const clauses = ab.clauses || [];
        for (let ci = 0; ci < clauses.length; ci++) {
          const cl = clauses[ci];
          if (cl.op?.then?.condition || cl.op?.else?.condition) {
            unexpectedLocations.push({ cardNumber: cn, abilityId: abId, clauseIndex: ci, location: 'clause.op.branch.condition' });
          }
          if (cl.condition) {
            totalOccurrences++;
            byLocation['clause.condition']++;
            const res = classifyCondition(cl.condition);
            byParseStatus[res.status] = (byParseStatus[res.status] || 0) + 1;
            if (res.type) byStructuredType[res.type] = (byStructuredType[res.type] || 0) + 1;
          }
          if (cl.op?.condition) {
            totalOccurrences++;
            byLocation['clause.op.condition']++;
            const res = classifyCondition(cl.op.condition);
            byParseStatus[res.status] = (byParseStatus[res.status] || 0) + 1;
            if (res.type) byStructuredType[res.type] = (byStructuredType[res.type] || 0) + 1;
            opConditionDeltaItems.push({
              occurrenceId: `${cn}::${abId}::c${ci}::clause.op.condition`,
              cardNumber: cn,
              abilityId: abId,
              clauseIndex: ci,
              location: 'clause.op.condition',
              rawCondition: cl.op.condition,
              structuredType: res.type,
              status: res.status
            });
          }
        }
      }
    }
  }

  const locationSum = byLocation['header.condition'] + byLocation['clause.condition'] + byLocation['clause.op.condition'];
  return {
    totalOccurrences,
    c2Total: byLocation['clause.condition'],
    deltaExplainedByOpCondition: opConditionDeltaItems.length,
    unexpectedLocations,
    reconciledExactMatch: unexpectedLocations.length === 0 && locationSum === totalOccurrences && (byLocation['clause.condition'] + opConditionDeltaItems.length === totalOccurrences),
    byLocation,
    byParseStatus,
    byStructuredType,
    opConditionDeltaItems
  };
}

export function runExhaustiveAudit() {
  const execMap = loadExecutionEvidence();
  const activeOpRegistry = buildVerifiedOperationRegistry(OPERATION_EVIDENCE_REGISTRY, execMap);
  const activeCondRegistry = buildVerifiedConditionRegistry(CONDITION_EVIDENCE_REGISTRY, execMap);
  const shardFiles = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.json')).sort();

  const opEvidenceCounts = {
    HANDLER_MISSING: 0,
    HANDLER_PRESENT_UNVERIFIED: 0,
    PARAMETERS_INCOMPLETE: 0,
    PARTIALLY_SUPPORTED: 0,
    SEMANTICALLY_VERIFIED: 0,
    NEEDS_MANUAL_REVIEW: 0
  };
  const condEvidenceCounts = {
    PARSE_FAILURE: 0,
    PARSED_UNSUPPORTED_TYPE: 0,
    PARSED_EVALUABLE_UNVERIFIED: 0,
    SEMANTICALLY_VERIFIED: 0,
    NEEDS_MANUAL_REVIEW: 0
  };
  const cardStatusCounts = {
    VANILLA_NO_EFFECT: 0,
    FULLY_SUPPORTED: 0,
    PARTIAL: 0,
    UNIMPLEMENTED: 0,
    NEEDS_MANUAL_REVIEW: 0
  };

  const uniqueOpsAll = new Map();
  const variantStatusMap = new Map(); // variant -> status
  const missingOpsMap = new Map();
  const opInventoryMap = new Map();
  const condTypeCounts = new Map();
  const canonicalCardNumbers = new Set();
  const manualReviewEntries = [];
  const manualReviewByReason = {};

  let totalCards = 0;
  let totalAbilities = 0;
  let totalClauses = 0;
  let totalConditions = 0;
  let abilitiesFullySupported = 0;
  let abilitiesPartial = 0;
  let abilitiesUnimplemented = 0;
  let abilitiesManualReview = 0;

  for (const file of shardFiles) {
    const shard = JSON.parse(fs.readFileSync(path.join(SHARD_DIR, file), 'utf8'));
    for (const card of Object.values(shard)) {
      totalCards++;
      const cn = card.cardNumber || card.card_number;
      if (cn) canonicalCardNumbers.add(String(cn).replace(/_[A-Z0-9]+$/, ''));

      const abilities = card.abilities || [];
      if (card.isVanilla || abilities.length === 0) {
        cardStatusCounts.VANILLA_NO_EFFECT++;
        continue;
      }

      let cardFullAbs = 0;
      let cardPartialAbs = 0;
      let cardUnimplAbs = 0;
      let cardReviewAbs = 0;
      const hasUnsupportedCount = Number(card.unsupportedClausesCount || 0) > 0;

      for (const ab of abilities) {
        totalAbilities++;
        const clauses = ab.clauses || [];
        const timing = String(ab.header?.timing || 'NONE').toUpperCase();
        let abHasMissing = Array.isArray(ab.unsupported) && ab.unsupported.length > 0;
        let abAllVerified = clauses.length > 0 && !abHasMissing;
        let abReviewReason = !VERIFIED_TIMINGS.has(timing) ? MANUAL_REVIEW_REASONS.UNVERIFIED_TRIGGER_TIMING : null;
        let abReviewExcerpt = abReviewReason ? { timing } : null;
        let abReviewText = ab.header?.cleanBody || '';

        if (abReviewReason) abAllVerified = false;

        if (ab.header?.condition) {
          totalConditions++;
          const cRes = classifyCondition(ab.header.condition, activeCondRegistry);
          condEvidenceCounts[cRes.status] = (condEvidenceCounts[cRes.status] || 0) + 1;
          if (cRes.type) condTypeCounts.set(cRes.type, (condTypeCounts.get(cRes.type) || 0) + 1);
          if (cRes.status !== 'SEMANTICALLY_VERIFIED') abAllVerified = false;
          if (cRes.reviewReason && !abReviewReason) {
            abReviewReason = cRes.reviewReason;
            abReviewExcerpt = ab.header.condition;
          }
        }

        for (const cl of clauses) {
          totalClauses++;
          const condCandidates = [cl.condition, cl.op?.condition].filter(Boolean);
          for (const condVal of condCandidates) {
            totalConditions++;
            const cRes = classifyCondition(condVal, activeCondRegistry);
            condEvidenceCounts[cRes.status] = (condEvidenceCounts[cRes.status] || 0) + 1;
            if (cRes.type) condTypeCounts.set(cRes.type, (condTypeCounts.get(cRes.type) || 0) + 1);
            if (cRes.status !== 'SEMANTICALLY_VERIFIED') abAllVerified = false;
            if (cRes.reviewReason && !abReviewReason) {
              abReviewReason = cRes.reviewReason;
              abReviewExcerpt = condVal;
              abReviewText = cl.rawText || cl.cleanText || abReviewText;
            }
          }

          const opRes = classifyOperation(cl.op, cl, activeOpRegistry);
          opEvidenceCounts[opRes.status] = (opEvidenceCounts[opRes.status] || 0) + 1;
          if (!variantStatusMap.has(opRes.variant)) {
            variantStatusMap.set(opRes.variant, opRes.status);
          }

          if (opRes.opName) {
            uniqueOpsAll.set(opRes.opName, (uniqueOpsAll.get(opRes.opName) || 0) + 1);
            let inv = opInventoryMap.get(opRes.opName);
            if (!inv) {
              const contract = OPERATION_CONTRACTS[opRes.opName] || null;
              inv = {
                op: opRes.opName,
                occurrences: 0,
                cards: new Set(),
                abilities: new Set(),
                paramTypes: new Map(),
                observedTargetKeys: new Set(),
                timings: new Set(),
                sourceZones: new Set(contract?.sourceZones || []),
                destinationZones: new Set(contract?.destinationZones || []),
                conditionsCount: 0,
                sampleConditions: [],
                variantCounts: new Map(),
                statusCounts: new Map(),
                operationKind: contract?.category || (implementedOps.has(opRes.opName) ? 'runtime_action' : 'unclassified'),
                targetingRequirement: contract?.targeting || 'none',
                requiredEvents: contract?.events || [],
                dependencies: contract?.dependencies || ['engine/ops/index.js'],
                contract: contract ? {
                  requiredParams: contract.requiredParams,
                  requiredAnyOf: contract.requiredAnyOf,
                  optionalParams: contract.optionalParams,
                  atomicRollback: contract.atomicRollback
                } : null
              };
              opInventoryMap.set(opRes.opName, inv);
            }
            inv.occurrences++;
            if (cn) inv.cards.add(String(cn));
            inv.abilities.add(String(ab.physicalId || ab.id || `${cn}:${totalAbilities}`));
            inv.timings.add(timing);
            inv.variantCounts.set(opRes.variant, (inv.variantCounts.get(opRes.variant) || 0) + 1);
            inv.statusCounts.set(opRes.status, (inv.statusCounts.get(opRes.status) || 0) + 1);
            if (condCandidates.length > 0 || ab.header?.condition) {
              inv.conditionsCount += condCandidates.length + (ab.header?.condition ? 1 : 0);
              const sampleC = condCandidates[0] || ab.header?.condition;
              if (sampleC && inv.sampleConditions.length < 3) {
                const cStr = typeof sampleC === 'string' ? sampleC : JSON.stringify(sampleC);
                if (!inv.sampleConditions.includes(cStr)) inv.sampleConditions.push(cStr);
              }
            }
            if (cl.op && typeof cl.op === 'object') {
              for (const [pk, pv] of Object.entries(cl.op)) {
                if (pk === 'op') continue;
                const pType = Array.isArray(pv) ? 'array' : (pv === null ? 'null' : typeof pv);
                if (!inv.paramTypes.has(pk)) inv.paramTypes.set(pk, new Set());
                inv.paramTypes.get(pk).add(pType);
                if (pk === 'target' || pk === 'filter') {
                  inv.observedTargetKeys.add(pType === 'object' ? Object.keys(pv).sort().join(',') || 'object' : String(pv));
                }
                if ((pk === 'from' || pk === 'sourceZone') && typeof pv === 'string') inv.sourceZones.add(pv);
                if ((pk === 'destination' || pk === 'to' || pk === 'replacementZone') && typeof pv === 'string') inv.destinationZones.add(pv);
              }
            }
            if (opRes.status === 'HANDLER_MISSING') {
              missingOpsMap.set(opRes.opName, (missingOpsMap.get(opRes.opName) || 0) + 1);
              abHasMissing = true;
            }
          } else {
            abHasMissing = true;
          }

          if (opRes.status !== 'SEMANTICALLY_VERIFIED') {
            abAllVerified = false;
          }
          if (opRes.reviewReason && !abReviewReason && !abHasMissing) {
            abReviewReason = opRes.reviewReason;
            abReviewExcerpt = cl.op;
            abReviewText = cl.rawText || cl.cleanText || abReviewText;
          }
        }

        if (abHasMissing) {
          abilitiesUnimplemented++;
          cardUnimplAbs++;
        } else if (abAllVerified) {
          abilitiesFullySupported++;
          cardFullAbs++;
        } else if (abReviewReason) {
          abilitiesManualReview++;
          cardReviewAbs++;
          manualReviewByReason[abReviewReason] = (manualReviewByReason[abReviewReason] || 0) + 1;
          manualReviewEntries.push({
            cardNumber: cn,
            abilityId: ab.physicalId || ab.id,
            reason: abReviewReason,
            rawText: String(abReviewText || '').slice(0, 220),
            irExcerpt: abReviewExcerpt,
            affectedSubsystem: abReviewReason === MANUAL_REVIEW_REASONS.UNVERIFIED_TARGET_SEMANTICS
              ? 'engine/selectors.js + compiler'
              : (abReviewReason === MANUAL_REVIEW_REASONS.UNSUPPORTED_CONDITION_FORM
                ? 'engine/conditions.js'
                : (abReviewReason === MANUAL_REVIEW_REASONS.UNVERIFIED_TRIGGER_TIMING
                  ? 'engine/triggers.js'
                  : 'compiler/clause_patterns.js + engine/ops/index.js'))
          });
        } else {
          abilitiesPartial++;
          cardPartialAbs++;
        }
      }

      if (cardFullAbs === abilities.length && !hasUnsupportedCount) {
        cardStatusCounts.FULLY_SUPPORTED++;
      } else if (cardUnimplAbs === abilities.length && cardFullAbs === 0 && cardPartialAbs === 0 && cardReviewAbs === 0) {
        cardStatusCounts.UNIMPLEMENTED++;
      } else if (cardReviewAbs > 0) {
        cardStatusCounts.NEEDS_MANUAL_REVIEW++;
      } else {
        cardStatusCounts.PARTIAL++;
      }
    }
  }

  const implementedInShards = [...uniqueOpsAll.keys()].filter(k => implementedOps.has(k));
  const missingInShards = [...uniqueOpsAll.keys()].filter(k => !implementedOps.has(k));

  const variantTotals = {
    uniqueParameterizedVariants: variantStatusMap.size,
    verifiedVariants: 0,
    partialVariants: 0,
    unverifiedVariants: 0,
    unsupportedVariants: 0,
    manualReviewVariants: 0
  };
  for (const st of variantStatusMap.values()) {
    if (st === 'SEMANTICALLY_VERIFIED') variantTotals.verifiedVariants++;
    else if (st === 'PARTIALLY_SUPPORTED') variantTotals.partialVariants++;
    else if (st === 'HANDLER_PRESENT_UNVERIFIED') variantTotals.unverifiedVariants++;
    else if (st === 'NEEDS_MANUAL_REVIEW') variantTotals.manualReviewVariants++;
    else variantTotals.unsupportedVariants++;
  }

  const condDiffReport = enumerateConditionOccurrences(SHARD_DIR);

  const summary = {
    shards: shardFiles.length,
    totalCompiledCardRecords: totalCards,
    uniqueBaseCardNumbers: canonicalCardNumbers.size,
    totalAbilities,
    totalClauses,
    totalConditions,
    operations: {
      uniqueOpsInShards: uniqueOpsAll.size,
      implementedUniqueOps: implementedInShards.length,
      missingHandlerUniqueOps: missingInShards.length,
      reconciledSumCheck: (implementedInShards.length + missingInShards.length) === uniqueOpsAll.size,
      variantTotals,
      evidenceBreakdown: opEvidenceCounts
    },
    conditions: {
      totalConditionInstances: totalConditions,
      reconciledWithAuthoritativeEnumerator: totalConditions === condDiffReport.totalOccurrences,
      byLocation: condDiffReport.byLocation,
      evidenceBreakdown: condEvidenceCounts,
      byStructuredType: Object.fromEntries([...condTypeCounts.entries()].sort((a, b) => b[1] - a[1]))
    },
    abilities: {
      totalAbilities,
      FULLY_SUPPORTED: abilitiesFullySupported,
      PARTIAL: abilitiesPartial,
      UNIMPLEMENTED: abilitiesUnimplemented,
      NEEDS_MANUAL_REVIEW: abilitiesManualReview
    },
    cardStatusProposal: cardStatusCounts,
    manualReviewSummary: {
      totalManualReviewAbilities: manualReviewEntries.length,
      totalManualReviewCards: cardStatusCounts.NEEDS_MANUAL_REVIEW,
      byReason: manualReviewByReason
    }
  };

  fs.writeFileSync(path.join(OUT_DIR, 'shard_audit_summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, 'missing_ops_inventory.json'),
    JSON.stringify(
      [...missingOpsMap.entries()].sort((a, b) => b[1] - a[1]).map(([op, count]) => ({ op, count })),
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'CARD_STATUS_RECONCILIATION_PROPOSAL.json'),
    JSON.stringify({ proposalNote: 'Non-destructive status proposal derived from executable test evidence', cardStatusCounts }, null, 2)
  );
  fs.writeFileSync(path.join(OUT_DIR, 'operation_evidence_registry.json'), JSON.stringify(activeOpRegistry, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'condition_evidence_registry.json'), JSON.stringify(activeCondRegistry, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, 'manual_review_inventory.json'),
    JSON.stringify({ summary: summary.manualReviewSummary, entries: manualReviewEntries }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'condition_reconciliation_diff.json'),
    JSON.stringify(condDiffReport, null, 2)
  );

  const executionEvidenceRecords = [];
  for (const [opName, entry] of Object.entries(activeOpRegistry)) {
    for (const [variantId, v] of Object.entries(entry.variants || {})) {
      executionEvidenceRecords.push({
        kind: 'operation',
        subject: opName,
        variant: variantId,
        testFile: v.testFile,
        testIds: v.testIds,
        matchedRegisteredTests: v.matchedRegisteredTests || [],
        inFullRunner: Boolean(v.inFullRunner),
        inVerifiedRunner: Boolean(v.inVerifiedRunner),
        executionStatus: v.executionStatus || 'NOT_EXECUTED',
        status: v.status,
        verificationFailureReason: v.verificationFailureReason || null
      });
    }
  }
  for (const [condType, entry] of Object.entries(activeCondRegistry)) {
    executionEvidenceRecords.push({
      kind: 'condition',
      subject: condType,
      variant: condType,
      testFile: entry.testFile,
      testIds: entry.testIds,
      matchedRegisteredTests: entry.matchedRegisteredTests || [],
      inFullRunner: Boolean(entry.inFullRunner),
      inVerifiedRunner: Boolean(entry.inVerifiedRunner),
      executionStatus: entry.executionStatus || 'NOT_EXECUTED',
      status: entry.evidenceStatus,
      verificationFailureReason: entry.verificationFailureReason || null
    });
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'execution_evidence.json'),
    JSON.stringify({ totalRecords: executionEvidenceRecords.length, records: executionEvidenceRecords }, null, 2)
  );

  const fgSubsystemInventories = {
    conditions: buildConditionSubsystemInventory(summary.conditions),
    targetingAndComparisonOps: ['TARGET', 'TARGET_CARD', 'TARGET_SELECT', 'REDIRECT_TARGET', 'CHANGE_TARGET'].map(op => ({
      op,
      handlerPresent: implementedOps.has(op),
      registryEntry: activeOpRegistry[op] || null
    })),
    continuousAndModifierOps: ['BP_BUFF', 'BP_DEBUFF', 'SET_BP', 'ADD_SYMBOL', 'GRANT_KEYWORD', 'COST_MOD', 'COST_MODIFIER', 'CHANGE_LEVEL', 'RULE_OR_TEXT_MODIFIER'].map(op => ({
      op,
      handlerPresent: implementedOps.has(op),
      registryEntry: activeOpRegistry[op] || null
    })),
    restrictionOps: ['SET_RESTRICTION', 'CANNOT_ATTACK', 'CANNOT_BLOCK', 'CANNOT_REFRESH'].map(op => ({
      op,
      handlerPresent: implementedOps.has(op),
      registryEntry: activeOpRegistry[op] || null
    })),
    immunityAndProtectionOps: ['IMMUNITY', 'INDESTRUCTIBLE', 'PROTECTION', 'GRANT_ARMOR', 'ARMOR'].map(op => ({
      op,
      handlerPresent: implementedOps.has(op),
      registryEntry: activeOpRegistry[op] || null
    }))
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'fg_subsystem_inventories.json'),
    JSON.stringify(fgSubsystemInventories, null, 2)
  );

  const completeOperationInventory = [...opInventoryMap.values()]
    .sort((a, b) => b.occurrences - a.occurrences)
    .map(inv => ({
      op: inv.op,
      occurrences: inv.occurrences,
      affectedCardsCount: inv.cards.size,
      affectedAbilitiesCount: inv.abilities.size,
      operationKind: inv.operationKind,
      implementedHandler: implementedOps.has(inv.op),
      registryStatus: activeOpRegistry[inv.op]?.evidenceStatus || (implementedOps.has(inv.op) ? 'HANDLER_PRESENT_UNVERIFIED' : 'HANDLER_MISSING'),
      observedParameters: Object.fromEntries([...inv.paramTypes.entries()].map(([k, s]) => [k, [...s]])),
      targetingRequirements: {
        contractTargeting: inv.targetingRequirement,
        observedTargetShapes: [...inv.observedTargetKeys]
      },
      conditionsObservedCount: inv.conditionsCount,
      sampleConditions: inv.sampleConditions,
      executionTimings: [...inv.timings],
      sourceZones: [...inv.sourceZones],
      destinationZones: [...inv.destinationZones],
      requiredEvents: inv.requiredEvents,
      dependencies: inv.dependencies,
      statusBreakdown: Object.fromEntries([...inv.statusCounts.entries()]),
      variantBreakdown: Object.fromEntries([...inv.variantCounts.entries()]),
      contract: inv.contract
    }));

  fs.writeFileSync(
    path.join(OUT_DIR, 'complete_operation_inventory.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalUniqueOperations: completeOperationInventory.length,
      implementedUniqueOperations: implementedInShards.length,
      missingHandlerUniqueOperations: missingInShards.length,
      operations: completeOperationInventory
    }, null, 2)
  );

  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const summary = runExhaustiveAudit();
  console.log(JSON.stringify(summary, null, 2));
}
