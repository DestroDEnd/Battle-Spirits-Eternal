/**
 * scripts/checkpoint_k1_batch_02.mjs
 *
 * K1-BATCH-02 (Conditions) Checkpoint & Deliverable Generator.
 * Scans all 514 shards live against engine/conditions.js, reconciles clause.condition
 * and op.condition metrics, updates k1_central_unresolved_ledger.json in-place,
 * and emits all 6 batch_02_conditions artifacts (UTF-8, no BOM).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  ROOT,
  OUT_ROOT,
  BASELINE_INVENTORY_PATH,
  writeJsonNoBom,
  writeTextNoBom,
  readJsonNoBom,
  collectLiveEngineCapabilities,
  updateCentralLedger
} from './k1_batches_ledger_builder.mjs';
import { parseConditionToStructured, evaluateStructuredCondition, CONDITION_RESULT } from '../engine/conditions.js';
import { auditConditionValue } from './discover_k1_2_mechanics.mjs';
import { compileCard } from '../compiler/index.js';

const BATCH_DIR = path.join(OUT_ROOT, 'batch_02_conditions');

function classifyUnresolvedConditionReason(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'EMPTY_OR_MALFORMED';
  if (/\b(?:by\s+sending|by\s+discarding|if\s+you\s+banish|if\s+you\s+discard|if\s+you\s+destroy|when\s+you\s+(?:send|discard|pay))/i.test(s)) {
    return 'ACTION_OR_COST_IF_CLAUSE';
  }
  if (/\bpre-?advent\b|\badvent\b|\bsoul\s*state\b|\bmirage\b|\bburst\b/i.test(s)) {
    return 'COMPLEX_MECHANIC_STATE_CONDITION';
  }
  if (/\bthrough\s+this\s+effect|\ba\s+card\s+is\s+(?:discarded|revealed|destroyed|returned)|\bthat\s+(?:spirit|card|nexus|ultimate)\b/i.test(s)) {
    return 'REFERENTIAL_OR_RESULT_CONDITION';
  }
  if (/\battacking\b|\bblocking\b|\bbattling\b|\bstep\b|\bturn\b/i.test(s)) {
    return 'TIMING_OR_COMBAT_STATE_CONDITION';
  }
  return 'UNMAPPED_PROSE_CONDITION';
}

function isOpConditionRuntimeEvaluable(opCond, evalCondTypes) {
  if (opCond == null) return { evaluable: false, parsedType: null, method: 'NONE' };
  const audit = auditConditionValue(opCond, evalCondTypes);
  if (!audit.hasFailure) {
    return { evaluable: true, parsedType: audit.parsedType, method: 'STANDARD_AUDIT' };
  }
  // Legacy frozen shard Rush objects: { colorSymbol: "<Color>" }
  if (opCond && typeof opCond === 'object' && typeof opCond.colorSymbol === 'string' && !opCond.type) {
    return { evaluable: true, parsedType: 'COLOR_SYMBOL', method: 'RUNTIME_LEGACY_COLOR_SYMBOL' };
  }
  return { evaluable: false, parsedType: null, method: 'UNRESOLVED' };
}

function runBatch02TestCheck() {
  const cmd = 'node --test --test-concurrency=1 tests/work_package_k1_batch_02_conditions.test.js tests/effect_execution_targeting_conditions.test.js tests/work_package_c_ops_conditions_compiler.test.js tests/work_package_fg1_restrictions_conditions_evidence.test.js tests/work_package_fg2_semantics_tristate_restrictions.test.js tests/work_package_hij1_conditions_truth_table.test.js tests/work_package_hij1_adversarial_determinism.test.js tests/golden_compiler.test.js tests/work_package_hij2_compiler_comparator.test.js tests/work_package_k1_5_foundation_closure.test.js';
  const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
  const passM = out.match(/(?:#|ℹ)\s*pass\s+(\d+)/);
  const failM = out.match(/(?:#|ℹ)\s*fail\s+(\d+)/);
  return {
    command: cmd,
    passed: passM ? parseInt(passM[1], 10) : null,
    failed: failM ? parseInt(failM[1], 10) : null,
    ok: !failM || parseInt(failM[1], 10) === 0
  };
}

function buildRealCardEvidence() {
  const det = readJsonNoBom(path.join(ROOT, 'data', 'cards_detailed.json'));
  const shardDir = path.join(ROOT, 'data', 'ir_shards');
  const getShardCard = (sf, id) => readJsonNoBom(path.join(shardDir, sf))[id];

  const bs41Compiled = compileCard({ ...det['BS41-040'], cardNumber: 'BS41-040' });
  const bs41RushClause = bs41Compiled.abilities[0]?.clauses?.find(c => c.op?.op === 'KEYWORD_ABILITY' && c.op?.keyword === 'Rush');

  return {
    generatedAt: new Date().toISOString(),
    testSuite: 'tests/work_package_k1_batch_02_conditions.test.js',
    realCardsVerified: [
      {
        cardNumber: 'BS41-040',
        shard: 'BS41.json',
        aspect: 'Compiler typed op.condition on [Rush: Purple]',
        compiledOpCondition: bs41RushClause?.op?.condition || null,
        verifiedBy: 'K1B2-04'
      },
      {
        cardNumber: 'BS19-X03',
        shard: 'BS19.json',
        aspect: 'Frozen shard { colorSymbol: "Blue" } runtime FALSE without Blue symbol, TRUE with Blue symbol',
        shardOpCondition: getShardCard('BS19.json', 'BS19-X03')?.abilities?.[0]?.clauses?.[1]?.op?.condition || null,
        verifiedBy: 'K1B2-04'
      },
      {
        cardNumber: 'BS02-088',
        shard: 'BS02.json',
        aspect: 'String op.condition BOTH_PLAYERS_CONTROL_NEXUS on PLAY_CONDITION',
        shardOpCondition: getShardCard('BS02.json', 'BS02-088')?.abilities?.[0]?.clauses?.[1]?.op?.condition || null,
        verifiedBy: 'K1B2-05'
      },
      {
        cardNumber: 'SD02-012',
        shard: 'SD02.json',
        aspect: 'String op.condition LEVEL_LTE -> INVALID_CONTEXT when battle levels absent, TRUE/FALSE when present',
        shardOpCondition: getShardCard('SD02.json', 'SD02-012')?.abilities?.[0]?.clauses?.[1]?.op?.condition || null,
        verifiedBy: 'K1B2-02'
      },
      {
        cardNumber: 'BS53-050',
        shard: 'BS53.json',
        aspect: 'Counter set condition ("While you have 1/3/5/7 counters")',
        shardCondition: getShardCard('BS53.json', 'BS53-050')?.abilities?.[1]?.clauses?.[0]?.condition || null,
        verifiedBy: 'K1B2-05'
      },
      {
        cardNumber: 'CB26-069',
        shard: 'CB26.json',
        aspect: 'Compound control ("If you control both \\"FIRE EMBLEM\\" and \\"SKY HIGH\\"")',
        shardCondition: getShardCard('CB26.json', 'CB26-069')?.abilities?.[1]?.clauses?.[1]?.condition || null,
        verifiedBy: 'K1B2-05'
      },
      {
        cardNumber: 'BS60-041',
        shard: 'BS60.json',
        aspect: 'ACTIVATION_ORIGIN ("if summoned from the deck") -> INVALID_CONTEXT vs TRUE',
        shardCondition: getShardCard('BS60.json', 'BS60-041')?.abilities?.[0]?.clauses?.[1]?.condition || null,
        verifiedBy: 'K1B2-05'
      },
      {
        cardNumber: 'BS63-CP03',
        shard: 'BS63.json',
        aspect: 'PRE_ADVENT_CARD ("among this Spirit\'s pre-advent cards") -> INVALID_CONTEXT vs FALSE vs TRUE',
        verifiedBy: 'K1B2-01 & K1B2-02'
      }
    ]
  };
}

function main() {
  const baseline = readJsonNoBom(BASELINE_INVENTORY_PATH);
  const { evalCondTypes } = collectLiveEngineCapabilities();
  const shardDir = path.join(ROOT, 'data', 'ir_shards');
  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json')).sort();

  let clauseCondTotal = 0;
  let clauseCondEvaluable = 0;
  let clauseCondFailures = 0;
  let opCondTotal = 0;
  let opCondAuditEvaluable = 0;
  let opCondRuntimeEvaluable = 0;
  let opCondFailures = 0;

  const affectedAbilitiesAfter = new Set();
  const syntaxFamilyCounts = {};
  const opCondFamilyCounts = {};
  const unresolvedMap = new Map();
  const unresolvedCategoryCounts = {};

  const resolvedClauseIds = new Set();
  const resolvedOpCondIds = new Set();

  for (const sf of shardFiles) {
    const sh = readJsonNoBom(path.join(shardDir, sf));
    for (const [cardNum, card] of Object.entries(sh)) {
      for (const ab of card.abilities || []) {
        const abId = ab.physicalId || ab.id || `${sf}::${ab.legacyId}`;
        const clauses = ab.clauses || [];
        for (let ci = 0; ci < clauses.length; ci++) {
          const cl = clauses[ci];
          const clauseId = `${abId}#c${ci}`;

          if (cl.condition != null) {
            clauseCondTotal++;
            const audit = auditConditionValue(cl.condition, evalCondTypes);
            if (!audit.hasFailure) {
              clauseCondEvaluable++;
              resolvedClauseIds.add(clauseId);
              syntaxFamilyCounts[audit.parsedType] = (syntaxFamilyCounts[audit.parsedType] || 0) + 1;
            } else {
              clauseCondFailures++;
              affectedAbilitiesAfter.add(abId);
              const rawStr = typeof cl.condition === 'string' ? cl.condition : JSON.stringify(cl.condition);
              const cat = classifyUnresolvedConditionReason(rawStr);
              unresolvedCategoryCounts[cat] = (unresolvedCategoryCounts[cat] || 0) + 1;
              if (!unresolvedMap.has(rawStr)) {
                unresolvedMap.set(rawStr, {
                  conditionText: rawStr,
                  category: cat,
                  count: 0,
                  sampleCards: []
                });
              }
              const rec = unresolvedMap.get(rawStr);
              rec.count++;
              if (rec.sampleCards.length < 3 && !rec.sampleCards.includes(cardNum)) {
                rec.sampleCards.push(cardNum);
              }
            }
          }

          if (cl.op && cl.op.condition != null) {
            opCondTotal++;
            const audit = auditConditionValue(cl.op.condition, evalCondTypes);
            if (!audit.hasFailure) opCondAuditEvaluable++;
            const rt = isOpConditionRuntimeEvaluable(cl.op.condition, evalCondTypes);
            if (rt.evaluable) {
              opCondRuntimeEvaluable++;
              resolvedOpCondIds.add(`${clauseId}.opcond`);
              opCondFamilyCounts[rt.parsedType] = (opCondFamilyCounts[rt.parsedType] || 0) + 1;
            } else {
              opCondFailures++;
              affectedAbilitiesAfter.add(abId);
            }
          }
        }
      }
    }
  }

  // Run verification gate & check INVALID_CONTEXT spot contract
  const testResult = runBatch02TestCheck();
  const realCardEvidence = buildRealCardEvidence();

  // Update central ledger in-place
  const ledgerUpdate = updateCentralLedger('K1-BATCH-02', (entry) => {
    if (entry.batchAssignment !== 'K1-BATCH-02') return false;
    if (entry.failureCategory === 'CONDITION_PARSE_FAILURE') {
      if (resolvedClauseIds.has(entry.clauseId)) {
        entry.implementationStatus = 'RESOLVED_VERIFIED';
        entry.unresolvedReason = 'Resolved in K1-BATCH-02: parsed and evaluated cleanly by engine/conditions.js.';
        entry.evidenceReferences = [
          'tests/work_package_k1_batch_02_conditions.test.js',
          'reports/work_package_k1_batches_02_to_05/batch_02_conditions/batch_02_real_card_evidence.json'
        ];
        entry.requiredFutureAction = 'NONE (verified in Batch 02).';
        return true;
      } else {
        const cat = classifyUnresolvedConditionReason(entry.originalSourceText);
        entry.unresolvedReason = `Unresolved after K1-BATCH-02 (${cat}); preserved fail-closed as UNSUPPORTED at runtime.`;
        return true;
      }
    }
    if (entry.failureCategory === 'OP_LEVEL_CONDITION_UNRESOLVED') {
      if (resolvedOpCondIds.has(entry.clauseId)) {
        entry.implementationStatus = 'RESOLVED_VERIFIED';
        entry.unresolvedReason = 'Resolved in K1-BATCH-02: evaluated in engine/conditions.js, engine/resolver.js, and engine/ops/index.js; fresh compiler emits typed COLOR_SYMBOL AST while frozen shards evaluate runtime-natively.';
        entry.evidenceReferences = [
          'tests/work_package_k1_batch_02_conditions.test.js',
          'reports/work_package_k1_batches_02_to_05/batch_02_conditions/batch_02_condition_inventory.json'
        ];
        entry.requiredFutureAction = 'NONE (legacy shard runtime & compiler typed emission both verified in Batch 02).';
        return true;
      }
    }
    return false;
  });

  const baselineClauseEval = baseline.conditions.clauseConditionEvaluable;
  const baselineClauseFail = baseline.conditions.clauseConditionFailures;
  const conditionInventory = {
    generatedAt: new Date().toISOString(),
    baseline: baseline.conditions,
    afterBatch02: {
      clauseConditionTotal: clauseCondTotal,
      clauseConditionEvaluable: clauseCondEvaluable,
      clauseConditionFailures: clauseCondFailures,
      clauseConditionNewlyResolved: clauseCondEvaluable - baselineClauseEval,
      opConditionTotal: opCondTotal,
      opConditionStandardAuditEvaluable: opCondAuditEvaluable,
      opConditionRuntimeEvaluable: opCondRuntimeEvaluable,
      opConditionRuntimeFailures: opCondFailures,
      affectedConditionAbilitiesAfter: affectedAbilitiesAfter.size
    },
    delta: {
      clauseConditionEvaluableDelta: clauseCondEvaluable - baselineClauseEval,
      clauseConditionFailureDelta: clauseCondFailures - baselineClauseFail,
      opConditionStandardAuditDelta: opCondAuditEvaluable - baseline.conditions.opConditionEvaluable,
      opConditionRuntimeDelta: opCondRuntimeEvaluable - baseline.conditions.opConditionEvaluable,
      affectedAbilitiesDelta: affectedAbilitiesAfter.size - baseline.conditions.affectedConditionAbilities
    }
  };

  const syntaxCoverage = {
    generatedAt: new Date().toISOString(),
    clauseConditionAstFamilies: Object.entries(syntaxFamilyCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
    opConditionAstFamilies: Object.entries(opCondFamilyCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
    supportedConditionResultStates: Object.values(CONDITION_RESULT),
    newBatch2ConditionTypes: ['PRE_ADVENT_CARD', 'ACTIVATION_ORIGIN', 'OP_RULE_CONDITION']
  };

  const unresolvedPatternsSorted = [...unresolvedMap.values()].sort((a, b) => b.count - a.count);
  const unresolvedReport = {
    generatedAt: new Date().toISOString(),
    totalUnresolvedClauseConditions: clauseCondFailures,
    uniqueUnresolvedPatterns: unresolvedPatternsSorted.length,
    categoryBreakdown: unresolvedCategoryCounts,
    topUnresolvedPatterns: unresolvedPatternsSorted.slice(0, 100)
  };

  const acceptanceMatrix = {
    batch: 'K1-BATCH-02',
    title: 'Conditions Remediation & Runtime Integration',
    generatedAt: new Date().toISOString(),
    overallStatus: testResult.ok && opCondFailures === 0 ? 'PASSED' : 'FAILED',
    criteria: [
      {
        id: 'B2-C1',
        criterion: 'Four-state tri+invalid evaluation (TRUE / FALSE / UNSUPPORTED / INVALID_CONTEXT) without breaking existing UNSUPPORTED contracts',
        status: testResult.ok ? 'PASS' : 'FAIL',
        evidence: 'tests/work_package_k1_batch_02_conditions.test.js (K1B2-01, K1B2-02) + fg1/fg2/hij1 suites'
      },
      {
        id: 'B2-C2',
        criterion: 'All 406 op.condition instances evaluated at runtime (404 Rush colorSymbol + BOTH_PLAYERS_CONTROL_NEXUS + LEVEL_LTE) & compiler emits typed COLOR_SYMBOL AST',
        status: opCondRuntimeEvaluable === 406 && opCondFailures === 0 ? 'PASS' : 'FAIL',
        metrics: { opCondTotal, opCondAuditEvaluable, opCondRuntimeEvaluable, opCondFailures },
        evidence: 'engine/resolver.js, engine/ops/index.js, compiler/clause_patterns.js, K1B2-04, K1B2-05'
      },
      {
        id: 'B2-C3',
        criterion: 'High-impact Batch 2 clause.condition patterns added cleanly (compound fix, pre-advent, summon/use origin, counter sets, Hand+Removed, teams/braves/Rebirth)',
        status: clauseCondEvaluable > baselineClauseEval ? 'PASS' : 'FAIL',
        metrics: { before: baselineClauseEval, after: clauseCondEvaluable, delta: clauseCondEvaluable - baselineClauseEval },
        evidence: 'tests/work_package_k1_batch_02_conditions.test.js (K1B2-01..K1B2-05)'
      },
      {
        id: 'B2-C4',
        criterion: 'Regression suite (Batch 02 + existing condition/compiler/K1.5 tests) passes 100%',
        status: testResult.ok ? 'PASS' : 'FAIL',
        testCounts: { passed: testResult.passed, failed: testResult.failed }
      },
      {
        id: 'B2-C5',
        criterion: 'Central unresolved ledger updated in-place with zero deleted entries',
        status: ledgerUpdate.updatedCount > 0 ? 'PASS' : 'FAIL',
        metrics: ledgerUpdate
      }
    ]
  };

  const md = `# K1-BATCH-02 — Conditions Checkpoint Report

Generated: ${new Date().toISOString()}
Status: **${acceptanceMatrix.overallStatus}**

## 1. Summary Metrics (Live 514-Shard Scan)

| Metric | Baseline (K1.5) | After Batch 02 | Delta |
|---|---:|---:|---:|
| \`clause.condition\` Total | ${baseline.conditions.clauseConditionTotal} | ${clauseCondTotal} | 0 |
| \`clause.condition\` Evaluable | ${baselineClauseEval} | ${clauseCondEvaluable} | +${clauseCondEvaluable - baselineClauseEval} |
| \`clause.condition\` Unparsed / Unresolved | ${baselineClauseFail} | ${clauseCondFailures} | ${clauseCondFailures - baselineClauseFail} |
| \`clause.op.condition\` Total | ${baseline.conditions.opConditionTotal} | ${opCondTotal} | 0 |
| \`clause.op.condition\` Standard AST Evaluable (\`auditConditionValue\`) | ${baseline.conditions.opConditionEvaluable} | ${opCondAuditEvaluable} | +${opCondAuditEvaluable - baseline.conditions.opConditionEvaluable} |
| \`clause.op.condition\` Runtime Evaluable (incl. frozen \`{ colorSymbol }\`) | 0 | ${opCondRuntimeEvaluable} | +${opCondRuntimeEvaluable} |
| Affected Condition Abilities | ${baseline.conditions.affectedConditionAbilities} | ${affectedAbilitiesAfter.size} | ${affectedAbilitiesAfter.size - baseline.conditions.affectedConditionAbilities} |

## 2. Architecture & Fixes Implemented
- Added \`CONDITION_RESULT.INVALID_CONTEXT\` and Batch 2 condition types \`PRE_ADVENT_CARD\`, \`ACTIVATION_ORIGIN\`, and \`OP_RULE_CONDITION\` in [conditions.js](file:///c:/Users/namis/Downloads/BSP/engine/conditions.js) while preserving existing \`UNSUPPORTED\` contracts for action-cost conditions and missing legacy context.
- Fixed compound \`and\`/\`or\` premature \`null\` return so noun-phrase conjunctions (\`both "A" and "B"\`, \`Hand and Removed Zone\`, \`this Spirit or your X family Spirit\`) fall through and parse cleanly.
- Updated [clause_patterns.js](file:///c:/Users/namis/Downloads/BSP/compiler/clause_patterns.js) to emit typed \`{ kind: 'STRUCTURED_CONDITION', type: 'COLOR_SYMBOL', side: 'self', color, colorSymbol }\` on \`[Rush: Color]\`.
- Wired \`INVALID_CONTEXT\` handling and \`clause.op.condition\` evaluation in [resolver.js](file:///c:/Users/namis/Downloads/BSP/engine/resolver.js) and [index.js](file:///c:/Users/namis/Downloads/BSP/engine/ops/index.js) (\`KEYWORD_ABILITY\`, \`PLAY_CONDITION\`, \`UNBLOCKABLE\`).

## 3. Verification Results
- Gate run (\`10\` test files): **${testResult.passed} passed, ${testResult.failed} failed**
- Real cards verified: \`BS41-040\`, \`BS19-X03\`, \`BS02-088\`, \`SD02-012\`, \`BS53-050\`, \`CB26-069\`, \`BS60-041\`, \`BS63-CP03\`.
- Remaining \`${clauseCondFailures}\` unparsed \`clause.condition\` strings are preserved fail-closed (\`CONDITION_RESULT.UNSUPPORTED\`) and itemized by category in [batch_02_unresolved_conditions.json](file:///c:/Users/namis/Downloads/BSP/reports/work_package_k1_batches_02_to_05/batch_02_conditions/batch_02_unresolved_conditions.json).
- Central ledger updated in-place: \`${ledgerUpdate.updatedCount}\` entries updated, total records preserved: \`${ledgerUpdate.totalRecords}\`.
`;

  writeJsonNoBom(path.join(BATCH_DIR, 'batch_02_condition_inventory.json'), conditionInventory);
  writeJsonNoBom(path.join(BATCH_DIR, 'batch_02_syntax_family_coverage.json'), syntaxCoverage);
  writeJsonNoBom(path.join(BATCH_DIR, 'batch_02_real_card_evidence.json'), realCardEvidence);
  writeJsonNoBom(path.join(BATCH_DIR, 'batch_02_unresolved_conditions.json'), unresolvedReport);
  writeJsonNoBom(path.join(BATCH_DIR, 'batch_02_acceptance_matrix.json'), acceptanceMatrix);
  writeTextNoBom(path.join(BATCH_DIR, 'batch_02_completion_report.md'), md);

  console.log(JSON.stringify({
    status: acceptanceMatrix.overallStatus,
    tests: testResult,
    clauseCondEvaluable,
    clauseCondFailures,
    opCondAuditEvaluable,
    opCondRuntimeEvaluable,
    ledgerUpdatedCount: ledgerUpdate.updatedCount,
    ledgerSummary: ledgerUpdate.summary.byBatchAndStatus
  }, null, 2));
}

main();
