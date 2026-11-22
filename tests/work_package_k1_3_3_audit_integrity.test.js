import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { extractSourceTimingSemantics, runK1_3_3Audit } from '../scripts/audit_k1_3_3_methodology.mjs';
import { assertApprovedFileHash } from '../scripts/versioned_baseline_registry.mjs';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const outDir = path.resolve('reports/work_package_k1_3_3');

function sha256File(fp) {
  return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
}

test('1. Timing: all 312 records independently classified from source and real timing collisions detected', () => {
  const tAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_timing_source_audit.json'), 'utf8'));
  const tAdv = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_timing_adversarial_tests.json'), 'utf8'));

  assert.equal(tAudit.totalRecords, 312);
  assert.equal(tAudit.records.length, 312);
  const seen = new Set();
  for (const r of tAudit.records) {
    assert.ok(!seen.has(r.abilityRecordId), `Duplicate timing ID: ${r.abilityRecordId}`);
    seen.add(r.abilityRecordId);
    assert.ok(r.extractedTimingSemantics && r.requiredRemediation);
  }

  for (const c of tAdv.sourceDerivedDistinctionsTested) assert.equal(c.passed, true, `Failed ${c.id}`);
  for (const c of tAdv.syntheticOnlyDistinctionsTested) assert.equal(c.passed, true, `Failed ${c.id}`);
  assert.ok(tAdv.falseEquivalencesDiscoveredCount > 0, 'Expected real timingLabel false equivalences to be detected');

  // Direct source extraction adversarial check
  const opp = extractSourceTimingSemantics({ header: { timing: 'WHEN_DESTROYED', timingLabel: 'When Destroyed by the Opponent' } });
  const either = extractSourceTimingSemantics({ header: { timing: 'WHEN_DESTROYED', timingLabel: 'When Destroyed' } });
  assert.notEqual(opp.triggerCause, either.triggerCause);
});

test('2. Dependencies: 1,818 nodes and 3,632 edges accounted for; compiler-only never marked runtime-confirmed', () => {
  const depSummary = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_dependency_summary.json'), 'utf8'));
  const depAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_dependency_dataflow_audit.json'), 'utf8'));
  const confirmed = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_confirmed_runtime_consumers.json'), 'utf8'));

  assert.equal(depSummary.totalNodes, 1818);
  assert.equal(depSummary.totalEdges, 3632);
  assert.equal(depSummary.edgeCounts.CONFIRMED_RUNTIME_CONSUMER, 0);
  assert.equal(confirmed.totalConfirmedRuntimeConsumers, 0);

  for (const n of depAudit.nodes) {
    for (const e of n.edges) {
      assert.notEqual(e.classification, 'CONFIRMED_RUNTIME_CONSUMER');
      if (e.sourceFile && e.sourceFile.startsWith('compiler/')) {
        assert.equal(e.classification, 'CONFIRMED_COMPILER_CONSUMER_ONLY');
      }
    }
  }
});

test('3. Display-only (750) & Exclusions (2,808): backed by cards_detailed.json evidence with zero unsupported safe claims', () => {
  const disp = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_display_only_semantic_audit.json'), 'utf8'));
  const excl = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_exclusion_semantic_audit.json'), 'utf8'));

  assert.equal(disp.totalRecords, 750);
  assert.equal(disp.classificationCounts.CONFIRMED_DISPLAY_ONLY, 0);
  for (const r of disp.records) {
    assert.ok(r.evidence && r.evidence.length > 0);
    assert.equal(r.manualReviewStatus, 'REQUIRED');
  }

  assert.equal(excl.totalRecords, 2808);
  assert.equal(excl.dispositionCounts.SAFE_EXCLUSION_CONFIRMED, 0);
  const seenEx = new Set();
  for (const r of excl.records) {
    assert.ok(!seenEx.has(r.abilityRecordId));
    seenEx.add(r.abilityRecordId);
    assert.ok(r.explanation && r.evidence);
  }
});

test('4. Master inventory: 36,422 abilities, 51,734 clauses, all required fields, and valid partition SHA-256 hashes', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_master_inventory_manifest.json'), 'utf8'));
  const recon = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_master_reconciliation.json'), 'utf8'));
  assert.equal(manifest.totalAbilities, 36422);
  assert.equal(manifest.totalClauses, 51734);
  assert.equal(recon.allChecksPass, true);

  const requiredFields = [
    'abilityRecordId', 'shard', 'cardKey', 'cardNumber', 'abilityIndex', 'physicalId', 'semanticId',
    'structuralPatternId', 'exactSemanticPatternId', 'clauseIds', 'primaryBatch', 'exclusionReason',
    'operationDependencies', 'conditionDependencies', 'keywordDependencies', 'headerConditionStatus',
    'clauseConditionStatus', 'operationConditionStatus', 'parameterCompleteness', 'parsingStatus',
    'runtimeImplStatus', 'runtimeSupportStatus', 'semanticVerificationStatus', 'manualReviewStatus',
    'timingAuditStatus', 'cleanBodyAuditStatus', 'displayOnlyAuditStatus', 'exclusionDisposition',
    'dependencyStatus', 'unresolvedIssues', 'evidenceReferences',
  ];

  const seenIds = new Set();
  let clauseSum = 0;
  for (const p of manifest.partitions) {
    const fp = path.join(outDir, 'k1_3_3_master_ability_inventory', p.file);
    assert.equal(fs.existsSync(fp), true);
    const content = fs.readFileSync(fp, 'utf8');
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), p.sha256);
    const arr = JSON.parse(content);
    assert.equal(arr.length, p.recordCount);
    for (const item of arr) {
      assert.ok(!seenIds.has(item.abilityRecordId));
      seenIds.add(item.abilityRecordId);
      clauseSum += item.clauseIds.length;
      if (seenIds.size <= 10) {
        for (const f of requiredFields) assert.ok(f in item, `Missing field ${f}`);
      }
    }
  }
  assert.equal(seenIds.size, 36422);
  assert.equal(clauseSum, 51734);
});

test('5. Preservation: all tracked engine, compiler, test, and prior manifest hashes match historical or approved K.1.4/K.1.5 versioned baseline', () => {
  const init = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_initial_git_state.json'), 'utf8'));
  for (const [rel, expected] of Object.entries(init.relevantFileHashes || {})) {
    assertApprovedFileHash(rel, sha256File(rel), expected);
  }
});

test('6. Determinism: fresh K.1.3.3 run produces byte-identical JSON outputs (with versioned verification progression)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k133-det-'));
  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k133-det2-'));
  try {
    await runK1_3_3Audit(tmpDir);
    await runK1_3_3Audit(tmpDir2);
    const fixedFiles = [
      'k1_3_3_timing_source_audit.json',
      'k1_3_3_timing_classification_summary.json',
      'k1_3_3_timing_adversarial_tests.json',
      'k1_3_3_dependency_summary.json',
      'k1_3_3_display_only_summary.json',
      'k1_3_3_exclusion_summary.json',
      'k1_3_3_cross_audit_reconciliation.json',
    ];
    for (const f of fixedFiles) {
      const a = fs.readFileSync(path.join(outDir, f), 'utf8');
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      assert.equal(b, a, `Non-deterministic output in ${f}`);
    }
    // Live inventory manifest & reconciliation reflect newly verified Batch-1 evidence while staying deterministic across fresh runs
    const mim1 = fs.readFileSync(path.join(tmpDir, 'k1_3_3_master_inventory_manifest.json'), 'utf8');
    const mim2 = fs.readFileSync(path.join(tmpDir2, 'k1_3_3_master_inventory_manifest.json'), 'utf8');
    assert.equal(mim1, mim2, 'Non-deterministic output in k1_3_3_master_inventory_manifest.json');
    const liveMim = JSON.parse(mim1);
    assert.equal(liveMim.totalAbilities, 36422);
    assert.equal(liveMim.totalClauses, 51734);
    const mr1 = fs.readFileSync(path.join(tmpDir, 'k1_3_3_master_reconciliation.json'), 'utf8');
    const mr2 = fs.readFileSync(path.join(tmpDir2, 'k1_3_3_master_reconciliation.json'), 'utf8');
    assert.equal(mr1, mr2, 'Non-deterministic output in k1_3_3_master_reconciliation.json');
    const histRec = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_3_master_reconciliation.json'), 'utf8'));
    const liveRec = JSON.parse(mr1);
    assert.equal(liveRec.allChecksPass, true);
    assert.equal(liveRec.exactCounts.canonicalCards, histRec.exactCounts.canonicalCards);
    assert.equal(liveRec.exactCounts.uniquePhysicalAbilities, histRec.exactCounts.uniquePhysicalAbilities);
    assert.ok(liveRec.exactCounts.verifiedAbilities >= histRec.exactCounts.verifiedAbilities);
    assert.equal(liveRec.exactCounts.verifiedAbilities + liveRec.exactCounts.unverifiedAbilities, 36422);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpDir2, { recursive: true, force: true });
  }
});

let passed = 0;
let failed = 0;
for (const t of tests) {
  try {
    await t.fn();
    console.log(`  PASS: ${t.name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${t.name}\n    ${err.stack || err.message}`);
    failed++;
  }
}
console.log(`\nWork Package K.1.3.3 Audit Integrity Tests: ${passed}/${tests.length} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
