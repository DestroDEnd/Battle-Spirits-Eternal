/**
 * scripts/k1_batches_ledger_builder.mjs
 *
 * Master Work Package K1 (Batches 02-05) — Baseline Inventory & Central Unresolved-Work Ledger Builder.
 * Re-calculates live database counts across all 514 shards and creates / updates the canonical
 * unresolved-work ledger without deleting resolved records.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { parseConditionToStructured } from '../engine/conditions.js';
import { classifyClauseSixDimensions } from './discover_k1_1_mechanics.mjs';
import { auditConditionValue } from './discover_k1_2_mechanics.mjs';
import { buildVerifiedOperationRegistry } from './audit_514_cards_exhaustive.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');
export const OUT_ROOT = path.join(ROOT, 'reports', 'work_package_k1_batches_02_to_05');
export const CLOSURE_DIR = path.join(OUT_ROOT, 'final_closure');
export const LEDGER_PATH = path.join(CLOSURE_DIR, 'k1_central_unresolved_ledger.json');
export const BASELINE_INVENTORY_PATH = path.join(CLOSURE_DIR, 'k1_baseline_inventory.json');
export const INITIAL_STATE_PATH = path.join(CLOSURE_DIR, 'k1_initial_workspace_state.json');

export function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

export function writeJsonNoBom(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

export function writeTextNoBom(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, 'utf8');
}

export function readJsonNoBom(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function walkFiles(dir, relPrefix = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, rel));
    } else if (entry.isFile()) {
      out.push({ full, rel: rel.replace(/\\/g, '/') });
    }
  }
  return out;
}

export function collectLiveEngineCapabilities() {
  const condSrc = fs.readFileSync(path.join(ROOT, 'engine', 'conditions.js'), 'utf8');
  const evalCondTypes = new Set([...condSrc.matchAll(/case\s+CONDITION_TYPES\.([A-Z0-9_]+)\s*:/g)].map(m => m[1]));
  const opsSrc = fs.readFileSync(path.join(ROOT, 'engine', 'ops', 'index.js'), 'utf8');
  const implOps = new Set([...opsSrc.matchAll(/case\s+'([A-Z0-9_]+)'\s*:/g)].map(m => m[1]));
  const verifiedOps = buildVerifiedOperationRegistry();
  return { evalCondTypes, implOps, verifiedOps };
}

export function captureInitialWorkspaceState() {
  if (fs.existsSync(INITIAL_STATE_PATH)) {
    return readJsonNoBom(INITIAL_STATE_PATH);
  }
  const gitHead = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  const gitStatusLines = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);

  const codeRoots = ['engine', 'compiler', 'scripts', 'tests'];
  const codeHashes = {};
  for (const dir of codeRoots) {
    for (const f of walkFiles(path.join(ROOT, dir), dir)) {
      if (/\.(js|mjs|json|py)$/i.test(f.rel)) {
        codeHashes[f.rel] = sha256File(f.full);
      }
    }
  }

  const historicalReportHashes = {};
  if (fs.existsSync(path.join(ROOT, 'reports'))) {
    for (const d of fs.readdirSync(path.join(ROOT, 'reports'), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!d.isDirectory() || d.name === 'work_package_k1_batches_02_to_05') continue;
      for (const f of walkFiles(path.join(ROOT, 'reports', d.name), `reports/${d.name}`)) {
        historicalReportHashes[f.rel] = sha256File(f.full);
      }
    }
  }

  const snapshot = {
    package: 'K1_BATCHES_02_TO_05',
    capturedAt: new Date().toISOString(),
    gitHead,
    gitStatusCount: gitStatusLines.length,
    gitStatus: gitStatusLines,
    codeFileCount: Object.keys(codeHashes).length,
    codeHashes,
    historicalReportCount: Object.keys(historicalReportHashes).length,
    historicalReportHashes
  };
  writeJsonNoBom(INITIAL_STATE_PATH, snapshot);
  return snapshot;
}

const BATCH1_OPS = new Set(['DRAW', 'BP_BUFF', 'BP_DEBUFF', 'DESTROY', 'BOUNCE', 'EXHAUST', 'REFRESH', 'MOVE_CORE']);
const BATCH3_PREFIX_KW = /\b(Mirage|Release|True Release|During Advent|During Brave|When Braved|During OC|During Seal|Soul State|SuAdcon|Brave Condition|Summon Condition|Advent|Contract Advent)\b/i;

export function scanDatabaseInventoryAndSeedLedger() {
  const { evalCondTypes, implOps, verifiedOps } = collectLiveEngineCapabilities();
  const shardDir = path.join(ROOT, 'data', 'ir_shards');
  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json')).sort();
  const detCards = readJsonNoBom(path.join(ROOT, 'data', 'cards_detailed.json'));
  const k134Excl = readJsonNoBom(path.join(ROOT, 'reports', 'work_package_k1_3_4', 'k1_3_4_exclusion_independent_audit.json'));
  const k15Excl = readJsonNoBom(path.join(ROOT, 'reports', 'work_package_k1_5', 'k1_5_exclusion_reconciliation.json'));

  const canonicalCards = new Set();
  const abilityIds = new Set();
  let totalCardRecords = 0;
  let totalAbilities = 0;
  let totalClauses = 0;

  let clauseCondTotal = 0;
  let clauseCondEvaluable = 0;
  let clauseCondFailures = 0;
  let opCondTotal = 0;
  let opCondEvaluable = 0;
  let opCondFailures = 0;
  const affectedConditionAbilities = new Set();

  let incompleteParamClauses = 0;
  let batch1TotalClauses = 0;
  let batch1VerifiedClauses = 0;
  let batch1UnverifiedClauses = 0;
  let batch1PartialBounceClauses = 0;
  let totalVerifiedClauses = 0;
  let totalPartialClauses = 0;
  let totalUnverifiedClauses = 0;
  let suadconAbilitiesCount = 0;

  const ledgerEntries = [];
  const seenLedgerKeys = new Set();
  const addLedger = (entry) => {
    const key = `${entry.clauseId}::${entry.failureCategory}`;
    if (seenLedgerKeys.has(key)) return;
    seenLedgerKeys.add(key);
    ledgerEntries.push(entry);
  };

  for (const sf of shardFiles) {
    const sh = readJsonNoBom(path.join(shardDir, sf));
    for (const [cardNum, card] of Object.entries(sh)) {
      totalCardRecords++;
      canonicalCards.add(cardNum);
      const det = detCards[cardNum] || null;
      const physCardId = `${sf}::${cardNum}`;

      for (const ab of card.abilities || []) {
        totalAbilities++;
        const abId = ab.physicalId || ab.id || `${sf}::${ab.legacyId}`;
        abilityIds.add(abId);

        const rawHeaderText = ab.rawText || (ab.header?.keyword ? `[${ab.header.keyword}]` : '') || ab.header?.cleanBody || '';
        const isSuAdcon = /suadcon/i.test(rawHeaderText);
        if (isSuAdcon) {
          suadconAbilitiesCount++;
          addLedger({
            physicalCardId: physCardId,
            canonicalCardId: cardNum,
            abilityId: abId,
            clauseId: `${abId}#suadcon`,
            sourceShard: sf,
            originalSourceText: rawHeaderText || det?.effect || cardNum,
            normalizedOpOrCondition: 'CONDITION:SUADCON',
            batchAssignment: 'K1-BATCH-03',
            failureCategory: 'COMPLEX_ADVENT_PREREQUISITE',
            implementationStatus: 'UNVERIFIED',
            unresolvedReason: 'Super Advent condition [SuAdcon] explicitly isolated in K.1.5 pending Advent step integration.',
            codeLocation: 'engine/prerequisites.js; engine/ops/index.js:ADVENT_STACK',
            evidenceReferences: ['reports/work_package_k1_5/k1_5_runtime_prerequisite_integration.json'],
            requiredFutureAction: 'Implement parseSuAdconCondition and enforce evaluateAdventCondition on summon/Advent paths.'
          });
        }

        const clauses = ab.clauses || [];
        for (let ci = 0; ci < clauses.length; ci++) {
          totalClauses++;
          const cl = clauses[ci];
          const clauseId = `${abId}#c${ci}`;
          const opName = cl.op?.op || 'NONE';

          // Condition checks
          if (cl.condition != null) {
            clauseCondTotal++;
            const cAudit = auditConditionValue(cl.condition, evalCondTypes);
            if (!cAudit.hasFailure) {
              clauseCondEvaluable++;
            } else {
              clauseCondFailures++;
              affectedConditionAbilities.add(abId);
              addLedger({
                physicalCardId: physCardId,
                canonicalCardId: cardNum,
                abilityId: abId,
                clauseId,
                sourceShard: sf,
                originalSourceText: typeof cl.condition === 'string' ? cl.condition : JSON.stringify(cl.condition),
                normalizedOpOrCondition: `CONDITION_FAILURE:${cAudit.status}`,
                batchAssignment: 'K1-BATCH-02',
                failureCategory: 'CONDITION_PARSE_FAILURE',
                implementationStatus: 'PARSED_FAILURE',
                unresolvedReason: `Clause condition (${cAudit.status}) cannot be parsed/evaluated in engine/conditions.js.`,
                codeLocation: 'engine/conditions.js:parseConditionToStructured',
                evidenceReferences: ['reports/work_package_k1_5/k1_5_condition_remediation.json'],
                requiredFutureAction: 'Add structured condition AST rule and evaluator with real-card tests or classify UNSUPPORTED/INVALID_CONTEXT.'
              });
            }
          }

          if (cl.op && cl.op.condition != null) {
            opCondTotal++;
            const opCondAudit = auditConditionValue(cl.op.condition, evalCondTypes);
            if (!opCondAudit.hasFailure) {
              opCondEvaluable++;
            } else {
              opCondFailures++;
              affectedConditionAbilities.add(abId);
              addLedger({
                physicalCardId: physCardId,
                canonicalCardId: cardNum,
                abilityId: abId,
                clauseId: `${clauseId}.opcond`,
                sourceShard: sf,
                originalSourceText: cl.rawText || JSON.stringify(cl.op.condition),
                normalizedOpOrCondition: `OP_CONDITION:${typeof cl.op.condition === 'string' ? cl.op.condition : Object.keys(cl.op.condition).join(',')}`,
                batchAssignment: 'K1-BATCH-02',
                failureCategory: 'OP_LEVEL_CONDITION_UNRESOLVED',
                implementationStatus: 'UNVERIFIED',
                unresolvedReason: `Operation-level condition (${opCondAudit.status}) requires structured normalization and runtime evaluation.`,
                codeLocation: 'engine/conditions.js; engine/resolver.js; engine/ops/index.js',
                evidenceReferences: ['reports/work_package_k1_2/condition_location_audit.json'],
                requiredFutureAction: 'Normalize op.condition cleanly and verify evaluation via resolver/handler runtime.'
              });
            }
          }

          const cls = classifyClauseSixDimensions(cl, card, implOps, evalCondTypes, verifiedOps);
          if (cls.semanticVerificationStatus === 'VERIFIED') totalVerifiedClauses++;
          else if (cls.semanticVerificationStatus === 'PARTIALLY_VERIFIED') totalPartialClauses++;
          else totalUnverifiedClauses++;

          if (BATCH1_OPS.has(opName)) {
            batch1TotalClauses++;
            if (cls.semanticVerificationStatus === 'VERIFIED') {
              batch1VerifiedClauses++;
            } else {
              batch1UnverifiedClauses++;
              if (opName === 'BOUNCE' && cls.runtimeSupportStatus === 'PARTIALLY_SUPPORTED') {
                batch1PartialBounceClauses++;
              }
              addLedger({
                physicalCardId: physCardId,
                canonicalCardId: cardNum,
                abilityId: abId,
                clauseId: `${clauseId}.op`,
                sourceShard: sf,
                originalSourceText: cl.rawText || '',
                normalizedOpOrCondition: `${opName}:${cls.variant || 'default'}`,
                batchAssignment: 'K1-BATCH-01_CARRY_FORWARD',
                failureCategory: cls.runtimeSupportStatus === 'PARTIALLY_SUPPORTED' ? 'BATCH1_PARTIAL_VARIANT' : 'BATCH1_UNVERIFIED_VARIANT',
                implementationStatus: cls.runtimeSupportStatus === 'PARTIALLY_SUPPORTED' ? 'PARTIALLY_VERIFIED' : 'UNVERIFIED',
                unresolvedReason: cls.reviewReason || `Batch 1 op variant ${cls.variant || opName} lacks exact verified variant/targeting proof.`,
                codeLocation: 'engine/ops/index.js; scripts/evidence_registry.mjs',
                evidenceReferences: ['reports/work_package_k1_5/k1_5_operation_variant_coverage.json'],
                requiredFutureAction: 'Reconcile non-default variant (e.g., side:either/deck destination/replacement wording) with real-card tests or preserve explicit isolation.'
              });
            }
          } else if (cls.parameterStatus === 'INCOMPLETE') {
            incompleteParamClauses++;
            addLedger({
              physicalCardId: physCardId,
              canonicalCardId: cardNum,
              abilityId: abId,
              clauseId: `${clauseId}.param`,
              sourceShard: sf,
              originalSourceText: cl.rawText || '',
              normalizedOpOrCondition: `${opName}:bare_stub`,
              batchAssignment: 'K1-BATCH-04',
              failureCategory: 'INCOMPLETE_PARAMETERS',
              implementationStatus: 'PARAMETERS_INCOMPLETE',
              unresolvedReason: `Bare-stub or parameterless ${opName} IR object requires explicit source recovery or contextual diagnosis.`,
              codeLocation: 'engine/parameter_recovery.js; compiler/clause_patterns.js; engine/ops/index.js',
              evidenceReferences: ['reports/work_package_k1_5/k1_5_parameter_remediation.json'],
              requiredFutureAction: 'Recover explicit unambiguous parameters via engine/parameter_recovery.js or classify BLOCKED/AMBIGUOUS.'
            });
          } else if (cls.semanticVerificationStatus !== 'VERIFIED') {
            const headerStr = [ab.header?.keyword || '', ...(ab.header?.prefixes || [])].join(' ');
            const isB3 = BATCH3_PREFIX_KW.test(headerStr) || BATCH3_PREFIX_KW.test(opName);
            addLedger({
              physicalCardId: physCardId,
              canonicalCardId: cardNum,
              abilityId: abId,
              clauseId: `${clauseId}.op`,
              sourceShard: sf,
              originalSourceText: cl.rawText || '',
              normalizedOpOrCondition: `${opName}:${cls.variant || 'default'}`,
              batchAssignment: isB3 ? 'K1-BATCH-03' : 'K1-BATCH-05',
              failureCategory: /REPLACE|PREVENT|IMMUN|INDESTRUCT|REDIRECT|NEGATE|REMAIN_ON_FIELD|UNPREVENTABLE/i.test(opName)
                ? 'REPLACEMENT_OR_PREVENTION_UNVERIFIED'
                : 'COMPLEX_OP_UNVERIFIED_VARIANT',
              implementationStatus: cls.runtimeSupportStatus === 'PARTIALLY_SUPPORTED' ? 'PARTIALLY_VERIFIED' : 'HANDLER_PRESENT',
              unresolvedReason: cls.reviewReason || `Operation ${opName} (${cls.variant || 'default'}) present in engine/ops/index.js without verified variant evidence.`,
              codeLocation: 'engine/ops/index.js; engine/zones.js; scripts/evidence_registry.mjs',
              evidenceReferences: ['reports/work_package_k1_5/k1_5_operation_variant_coverage.json'],
              requiredFutureAction: 'Implement missing semantics where applicable and add real-card end-to-end production tests.'
            });
          }
        }
      }
    }
  }

  // Carry forward K.1.5 remaining non-implemented exclusions (13 SuAdcon already added above; add 14 source correction + 228 manual/missing)
  for (const r of k134Excl.records) {
    if (r.disposition === 'REQUIRES_SOURCE_CORRECTION' || r.disposition === 'REQUIRES_MANUAL_INTERPRETATION' || r.disposition === 'AMBIGUOUS') {
      addLedger({
        physicalCardId: `${r.abilityRecordId.split('::')[0]}::${r.cardNumber}`,
        canonicalCardId: r.cardNumber,
        abilityId: r.abilityRecordId,
        clauseId: `${r.abilityRecordId}#excl`,
        sourceShard: r.abilityRecordId.split('::')[0],
        originalSourceText: r.sourceText || '',
        normalizedOpOrCondition: `EXCLUSION:${r.originalExclusionReason}`,
        batchAssignment: r.disposition === 'REQUIRES_SOURCE_CORRECTION' ? 'K1-BATCH-05_EXCLUSION' : 'MANUAL_REVIEW_QUEUE',
        failureCategory: r.disposition,
        implementationStatus: r.disposition === 'REQUIRES_SOURCE_CORRECTION' ? 'SOURCE_CORRECTION_REQUIRED' : 'MANUAL_REVIEW_REQUIRED',
        unresolvedReason: r.missingRepresentation || 'Historical zero-clause exclusion carried from K.1.5 ledger.',
        codeLocation: 'compiler/header_parser.js; data/ir_shards',
        evidenceReferences: ['reports/work_package_k1_5/k1_5_exclusion_reconciliation.json'],
        requiredFutureAction: r.disposition === 'REQUIRES_SOURCE_CORRECTION'
          ? 'Verify header_parser fixes handle source text on fresh compileCard while keeping frozen shards immutable.'
          : 'Retain in manual review ledger pending domain disambiguation or missing cards_detailed entry.'
      });
    }
  }

  const baselineInventory = {
    generatedAt: new Date().toISOString(),
    baselineSource: 'Recalculated live from 514 shards in data/ir_shards + engine/conditions.js + engine/ops/index.js',
    shards: shardFiles.length,
    cardRecords: totalCardRecords,
    canonicalCards: canonicalCards.size,
    abilityRecords: totalAbilities,
    uniquePhysicalAbilityIds: abilityIds.size,
    clauses: totalClauses,
    conditions: {
      clauseConditionTotal: clauseCondTotal,
      clauseConditionEvaluable: clauseCondEvaluable,
      clauseConditionFailures: clauseCondFailures,
      opConditionTotal: opCondTotal,
      opConditionEvaluable: opCondEvaluable,
      opConditionFailures: opCondFailures,
      affectedConditionAbilities: affectedConditionAbilities.size
    },
    incompleteParameters: incompleteParamClauses,
    batch1CarryForward: {
      totalClauses: batch1TotalClauses,
      verifiedClauses: batch1VerifiedClauses,
      unverifiedClauses: batch1UnverifiedClauses,
      partialBounceClauses: batch1PartialBounceClauses
    },
    suadconAbilitiesCount,
    exclusionsSummaryFromK15: k15Excl.k15Dispositions,
    overallClauseVerification: {
      verified: totalVerifiedClauses,
      partial: totalPartialClauses,
      unverified: totalUnverifiedClauses
    },
    ledgerSeededEntryCount: ledgerEntries.length
  };

  writeJsonNoBom(BASELINE_INVENTORY_PATH, baselineInventory);
  writeJsonNoBom(LEDGER_PATH, {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    lastUpdatedBatch: 'K1-BASELINE-SEED',
    totalRecords: ledgerEntries.length,
    summaryByBatchAndStatus: summarizeLedger(ledgerEntries),
    entries: ledgerEntries
  });

  return { baselineInventory, ledgerCount: ledgerEntries.length };
}

export function summarizeLedger(entries) {
  const byBatch = {};
  const byStatus = {};
  const byBatchAndStatus = {};
  for (const e of entries) {
    byBatch[e.batchAssignment] = (byBatch[e.batchAssignment] || 0) + 1;
    byStatus[e.implementationStatus] = (byStatus[e.implementationStatus] || 0) + 1;
    const key = `${e.batchAssignment}::${e.implementationStatus}`;
    byBatchAndStatus[key] = (byBatchAndStatus[key] || 0) + 1;
  }
  return { byBatch, byStatus, byBatchAndStatus };
}

/**
 * Updates matching records in the central ledger in-place (NEVER deleting entries)
 * and rewrites summary counts atomically.
 */
export function updateCentralLedger(batchLabel, updaterFn) {
  const ledger = readJsonNoBom(LEDGER_PATH);
  let updatedCount = 0;
  for (const entry of ledger.entries) {
    const didUpdate = updaterFn(entry);
    if (didUpdate) updatedCount++;
  }
  ledger.generatedAt = new Date().toISOString();
  ledger.lastUpdatedBatch = batchLabel;
  ledger.totalRecords = ledger.entries.length;
  ledger.summaryByBatchAndStatus = summarizeLedger(ledger.entries);
  writeJsonNoBom(LEDGER_PATH, ledger);
  return { updatedCount, totalRecords: ledger.entries.length, summary: ledger.summaryByBatchAndStatus };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain && process.argv.includes('--init')) {
  const snap = captureInitialWorkspaceState();
  const res = scanDatabaseInventoryAndSeedLedger();
  console.log(JSON.stringify({
    gitHead: snap.gitHead,
    gitStatusCount: snap.gitStatusCount,
    codeFiles: snap.codeFileCount,
    historicalReports: snap.historicalReportCount,
    ...res
  }, null, 2));
}
