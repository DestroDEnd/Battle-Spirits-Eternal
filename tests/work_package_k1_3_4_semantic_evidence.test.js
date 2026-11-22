import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { runK1_3_4Audit } from '../scripts/audit_k1_3_4_evidence.mjs';
import { assertApprovedFileHash } from '../scripts/versioned_baseline_registry.mjs';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const outDir = path.resolve('reports/work_package_k1_3_4');

function sha256File(fp) {
  return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
}

test('1 & 2. Timing source-to-signature & real collision reconciliation', () => {
  const tSig = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_timing_source_signature_audit.json'), 'utf8'));
  const tCol = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_timing_collision_reconciliation.json'), 'utf8'));

  assert.equal(tSig.totalRecords, 312);
  assert.equal(tSig.representedInExactSemanticIdentityTrueCount, 0);
  assert.equal(tSig.representedInExactSemanticIdentityFalseCount, 312);
  for (const r of tSig.records) {
    assert.ok(r.propertyComparisonMatrix.triggerEvent);
    const hasMissing = Object.values(r.propertyComparisonMatrix).some(p => p.source === 'SOURCE_PRESENT' && p.signature === 'MISSING');
    assert.equal(hasMissing, true);
  }

  assert.equal(tCol.totalTrueSemanticCollisions, 34);
  assert.equal(tCol.falseDistinctionsCount, 0);
  for (const c of tCol.collisions) {
    assert.equal(c.signaturePreservesProperty, false);
    assert.ok(c.collidingTimingLabels.length >= 2);
  }
});

test('3. Runtime dependency trace evidence & compiler line verification', () => {
  const dep = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_dependency_runtime_trace.json'), 'utf8'));
  assert.equal(dep.totalNodes, 1818);
  assert.equal(dep.totalEdges, 3632);
  assert.equal(dep.edgeCounts.CONFIRMED_RUNTIME_CONSUMER, 0);

  for (const n of dep.nodes) {
    for (const e of n.edges) {
      assert.notEqual(e.classification, 'CONFIRMED_RUNTIME_CONSUMER');
      if (e.sourceFile) {
        assert.equal(fs.existsSync(e.sourceFile), true, `Missing sourceFile ${e.sourceFile}`);
        assert.ok(e.lineRange && /^\d+-\d+$/.test(e.lineRange), `Invalid lineRange ${e.lineRange}`);
      }
    }
  }
});

test('4 & 5. Display-only component audit (750) & Independent exclusion audit (2,808)', () => {
  const disp = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_display_only_component_audit.json'), 'utf8'));
  const excl = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_exclusion_independent_audit.json'), 'utf8'));

  assert.equal(disp.totalRecords, 750);
  assert.equal(disp.confirmedDisplayOnlyCount, 0);
  assert.ok(disp.withTeamRestrictionCount > 0);
  assert.ok(disp.withExecutableEffectElsewhereOnCardCount > 0);

  assert.equal(excl.totalRecords, 2808);
  assert.equal(excl.dispositionCounts.SAFE_EXCLUSION_CONFIRMED, 0);
  const seen = new Set();
  for (const r of excl.records) {
    assert.ok(!seen.has(r.abilityRecordId));
    seen.add(r.abilityRecordId);
    assert.ok(r.missingRepresentation);
  }
});

test('6, 7, 8 & 9. ALL 36,422 master records validated for fields, consistency, clause integrity & evidence refs', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_master_inventory_manifest.json'), 'utf8'));
  const fieldCov = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_inventory_field_coverage.json'), 'utf8'));
  const statusRec = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_inventory_status_reconciliation.json'), 'utf8'));
  const evRef = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_evidence_reference_validation.json'), 'utf8'));

  assert.equal(manifest.totalAbilities, 36422);
  assert.equal(manifest.totalClauses, 51734);
  assert.equal(fieldCov.allFieldsPresentOnAll36422Records, true);
  assert.equal(statusRec.reconciliationExact, true);
  assert.equal(evRef.allReferencesValid, true);

  // Independently validate EVERY SINGLE ONE of the 36,422 records across all partitions
  const seenAbilities = new Set();
  const seenClauses = new Set();
  let actualVerified = 0;
  let actualManual = 0;

  for (const p of manifest.partitions) {
    const fp = path.join(outDir, 'k1_3_4_master_ability_inventory', p.file);
    const content = fs.readFileSync(fp, 'utf8');
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), p.sha256);
    const arr = JSON.parse(content);
    assert.equal(arr.length, p.recordCount);
    for (const r of arr) {
      assert.ok(!seenAbilities.has(r.abilityRecordId));
      seenAbilities.add(r.abilityRecordId);
      if (r.clauseIds.length === 0) assert.notEqual(r.semanticVerificationStatus, 'VERIFIED');
      if (r.semanticVerificationStatus === 'VERIFIED') actualVerified++;
      if (r.manualReviewStatus === 'REQUIRED') actualManual++;
      for (const cid of r.clauseIds) {
        assert.ok(!seenClauses.has(cid));
        seenClauses.add(cid);
      }
    }
  }
  assert.equal(seenAbilities.size, 36422);
  assert.equal(seenClauses.size, 51734);
  assert.equal(actualVerified, statusRec.verifiedAbilitiesAggregate);
  assert.equal(actualManual, statusRec.manualReviewAbilitiesAggregate);
});

test('10, 11 & 12. Performance reproducibility, preservation hashes & byte-identical determinism', async () => {
  const perf = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_performance_investigation.json'), 'utf8'));
  assert.equal(perf.isolatedFreshProcessRuns.length, 5);
  assert.equal(perf.warmedDirectRuns.measuredCount, 20);
  assert.equal(perf.thresholdMs, 500);

  const init = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_initial_git_state.json'), 'utf8'));
  for (const [rel, expected] of Object.entries(init.relevantFileHashes || {})) {
    assertApprovedFileHash(rel, sha256File(rel), expected);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k134-det-'));
  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k134-det2-'));
  try {
    await runK1_3_4Audit(tmpDir);
    await runK1_3_4Audit(tmpDir2);
    const fixedFiles = [
      'k1_3_4_timing_source_signature_audit.json',
      'k1_3_4_timing_collision_reconciliation.json',
      'k1_3_4_display_only_component_audit.json',
      'k1_3_4_inventory_field_coverage.json',
      'k1_3_4_evidence_reference_validation.json',
    ];
    for (const f of fixedFiles) {
      const a = fs.readFileSync(path.join(outDir, f), 'utf8');
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      assert.equal(b, a, `Non-deterministic output in ${f}`);
    }
    const versionedFiles = [
      'k1_3_4_dependency_runtime_trace.json',
      'k1_3_4_exclusion_independent_audit.json',
      'k1_3_4_inventory_status_reconciliation.json',
      'k1_3_4_master_inventory_manifest.json',
      'k1_3_4_cross_audit_reconciliation.json',
    ];
    for (const f of versionedFiles) {
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      const c = fs.readFileSync(path.join(tmpDir2, f), 'utf8');
      assert.equal(b, c, `Non-deterministic output across fresh runs in ${f}`);
    }
    const liveCross = JSON.parse(fs.readFileSync(path.join(tmpDir, 'k1_3_4_cross_audit_reconciliation.json'), 'utf8'));
    assert.equal(liveCross.abilityRecords, 36422);
    assert.equal(liveCross.clauses, 51734);
    assert.equal(liveCross.canonicalCards, 14609);
    assert.equal(liveCross.cardRecords, 15398);
    const liveMim = JSON.parse(fs.readFileSync(path.join(tmpDir, 'k1_3_4_master_inventory_manifest.json'), 'utf8'));
    assert.equal(liveMim.totalAbilities, 36422);
    assert.equal(liveMim.totalClauses, 51734);
    const histRec = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_4_inventory_status_reconciliation.json'), 'utf8'));
    const liveRec = JSON.parse(fs.readFileSync(path.join(tmpDir, 'k1_3_4_inventory_status_reconciliation.json'), 'utf8'));
    assert.equal(liveRec.reconciliationExact, true);
    assert.ok(liveRec.verifiedAbilitiesAggregate >= histRec.verifiedAbilitiesAggregate);
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
console.log(`\nWork Package K.1.3.4 Semantic Evidence Tests: ${passed}/${tests.length} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
