import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { runTimingAdversarialChecks, runK1_3_2Audit } from '../scripts/audit_k1_3_2_reconciliation.mjs';
import { assertApprovedFileHash } from '../scripts/versioned_baseline_registry.mjs';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const outDir = path.resolve('reports/work_package_k1_3_2');

function sha256File(fp) {
  return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
}

test('1. Timing: all 312 records accounted for, 0 duplicates/missing, all 12 adversarial distinctions pass, no false FULLY_REPRESENTED', () => {
  const tAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_timing_semantic_audit.json'), 'utf8'));
  const tSummary = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_timing_classification_summary.json'), 'utf8'));
  const tAdv = runTimingAdversarialChecks();

  assert.equal(tAudit.totalRecords, 312);
  assert.equal(tAudit.records.length, 312);
  assert.equal(tSummary.classificationCounts.FULLY_REPRESENTED, 0);

  const seen = new Set();
  for (const r of tAudit.records) {
    assert.ok(!seen.has(r.abilityRecordId), `Duplicate timing ID: ${r.abilityRecordId}`);
    seen.add(r.abilityRecordId);
    assert.notEqual(r.primaryClassification, 'FULLY_REPRESENTED');
    assert.equal(r.includedInSemanticIdentity, false);
  }
  assert.equal(tAdv.totalChecks, 12);
  assert.equal(tAdv.allPassed, true);
});

test('2. cleanBody (104) & display-only (750): zero unrepresented records marked safe, zero hidden gameplay text in DISPLAY_ONLY', () => {
  const cb = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_cleanbody_semantic_audit.json'), 'utf8'));
  const disp = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_display_only_revalidation.json'), 'utf8'));

  assert.equal(cb.totalRecords, 104);
  assert.equal(cb.records.length, 104);
  for (const r of cb.records) {
    if (!r.meaningRepresentedElsewhere) {
      assert.equal(r.safeToExcludeFromSemanticIdentity, false, `Unrepresented cleanBody marked safe: ${r.abilityRecordId}`);
    }
  }

  assert.equal(disp.totalRecords, 750);
  assert.equal(disp.records.length, 750);
  assert.equal(disp.classificationCounts.DISPLAY_ONLY, 750);
  assert.equal(disp.classificationCounts.REQUIRES_REVIEW, 0);
});

test('3. Exclusions (2,808): all accounted for with valid disjoint dispositions and no unsupported SAFE_EXCLUSION', () => {
  const ex = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_exclusion_reconciliation.json'), 'utf8'));
  assert.equal(ex.totalRecords, 2808);
  assert.equal(ex.records.length, 2808);
  const seen = new Set();
  for (const r of ex.records) {
    assert.ok(!seen.has(r.abilityRecordId));
    seen.add(r.abilityRecordId);
    if (r.disposition === 'SAFE_EXCLUSION') {
      assert.equal(r.k1_3Classification, 'DISPLAY_ONLY_METADATA');
    }
  }
});

test('4. Dependencies (1,818 nodes, 3,632 edges): 0 confirmed runtime consumers without proof; compiler-only & same-card properly separated', () => {
  const depSummary = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_dependency_summary.json'), 'utf8'));
  const depAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_dependency_dataflow_audit.json'), 'utf8'));
  const confirmed = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_confirmed_runtime_consumers.json'), 'utf8'));

  assert.equal(depSummary.totalNodes, 1818);
  assert.equal(depSummary.totalEdges, 3632);
  assert.equal(depSummary.edgeCounts.CONFIRMED_RUNTIME_CONSUMER, 0);
  assert.equal(confirmed.totalConfirmedRuntimeConsumers, 0);

  for (const n of depAudit.nodes) {
    for (const e of n.edges) {
      assert.notEqual(e.classification, 'CONFIRMED_RUNTIME_CONSUMER');
      if (e.destinationNode.startsWith('same_card') || e.destinationNode.includes('#a')) {
        assert.equal(e.classification, 'UNRESOLVED_DATA_FLOW');
      }
    }
  }
});

test('5. Master inventory: exactly 36,422 unique ability IDs, 51,734 clauses, valid partition hashes & cross-audit equations', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_master_inventory_manifest.json'), 'utf8'));
  const cross = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_cross_audit_reconciliation.json'), 'utf8'));

  assert.equal(manifest.totalAbilityRecords, 36422);
  assert.equal(manifest.totalClauses, 51734);
  for (const eq of Object.values(cross.reconciliationEquations)) {
    assert.equal(eq, true);
  }

  const seenIds = new Set();
  let clauseSum = 0;
  for (const p of manifest.partitions) {
    const fp = path.join(outDir, 'k1_3_2_master_ability_inventory', p.file);
    assert.equal(fs.existsSync(fp), true);
    const content = fs.readFileSync(fp, 'utf8');
    const sha = crypto.createHash('sha256').update(content).digest('hex');
    assert.equal(sha, p.sha256);
    const arr = JSON.parse(content);
    assert.equal(arr.length, p.recordCount);
    for (const item of arr) {
      assert.ok(!seenIds.has(item.abilityRecordId), `Duplicate master ability ID: ${item.abilityRecordId}`);
      seenIds.add(item.abilityRecordId);
      clauseSum += item.clauseIds.length;
    }
  }
  assert.equal(seenIds.size, 36422);
  assert.equal(clauseSum, 51734);
});

test('6. Preservation: engine/compiler/test hashes match historical baseline or approved K.1.4/K.1.5 versioned baseline', () => {
  const initState = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_2_initial_git_state.json'), 'utf8'));
  for (const [rel, expectedSha] of Object.entries(initState.relevantFileHashes || {})) {
    assertApprovedFileHash(rel, sha256File(rel), expectedSha);
  }
});

test('7. Determinism: fresh K.1.3.2 run into temp dir yields byte-identical JSON outputs', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k132-det-'));
  try {
    await runK1_3_2Audit(tmpDir);
    const filesToCheck = [
      'k1_3_2_timing_semantic_audit.json',
      'k1_3_2_timing_classification_summary.json',
      'k1_3_2_cleanbody_semantic_audit.json',
      'k1_3_2_display_only_revalidation.json',
      'k1_3_2_exclusion_reconciliation.json',
      'k1_3_2_dependency_summary.json',
      'k1_3_2_cross_audit_reconciliation.json',
      'k1_3_2_implementation_readiness.json',
      'k1_3_2_master_inventory_manifest.json',
    ];
    for (const f of filesToCheck) {
      const a = fs.readFileSync(path.join(outDir, f), 'utf8');
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      assert.equal(b, a, `Non-deterministic output detected in ${f}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
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
console.log(`\nWork Package K.1.3.2 Semantic Hardening Tests: ${passed}/${tests.length} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
