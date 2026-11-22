import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {
  INCLUDED_HEADER_PROPERTIES,
  EXCLUDED_HEADER_PROPERTIES,
  buildExactSemanticSignatureV2,
  auditConditionValue,
  runK1_2Discovery,
} from '../scripts/discover_k1_2_mechanics.mjs';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function verifyPartitionedManifest(dirPath) {
  const manifestPath = path.join(dirPath, 'manifest.json');
  assert.equal(fs.existsSync(manifestPath), true, `Missing manifest: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let sumRecords = 0;
  for (const part of manifest.partitions) {
    const pPath = path.join(dirPath, part.file);
    assert.equal(fs.existsSync(pPath), true, `Missing partition file: ${pPath}`);
    const content = fs.readFileSync(pPath, 'utf8');
    const actualSha = crypto.createHash('sha256').update(content).digest('hex');
    assert.equal(actualSha, part.sha256, `SHA-256 mismatch in ${part.file}`);
    const parsed = JSON.parse(content);
    assert.equal(parsed.length, part.recordCount, `Record count mismatch in ${part.file}`);
    sumRecords += parsed.length;
  }
  assert.equal(sumRecords, manifest.totalRecords, `Total records mismatch in ${manifestPath}`);
  return manifest;
}

const outDir = path.resolve('reports/work_package_k1_2');

test('1. Exact 36,422 ability-level and 51,734 clause-level batch reconciliation', () => {
  const rec = JSON.parse(fs.readFileSync(path.join(outDir, 'batch_reconciliation_report.json'), 'utf8'));
  assert.equal(rec.totalShards, 514);
  assert.equal(rec.totalCardRecords, 15398);
  assert.equal(rec.uniqueCanonicalCards, 14609);
  assert.equal(rec.totalAbilityRecords, 36422);
  assert.equal(rec.uniquePhysicalIds, 34855);
  assert.equal(rec.totalClauses, 51734);
  assert.equal(rec.reconciledAbilitySum, 36422);
  assert.equal(rec.missingAbilityCount, 0);
  assert.equal(rec.duplicateAssignmentsCount, 0);
  assert.equal(rec.reconciliationExact, true);

  const batchSum = Object.values(rec.batches).reduce((s, b) => s + b.uniqueAbilityRecords, 0);
  assert.equal(batchSum, 36422);
  const clauseSum = Object.values(rec.batches).reduce((s, b) => s + b.totalClauses, 0);
  assert.equal(clauseSum, 51734);
});

test('2. Explicit exclusion inventory reconciles with EXPLICITLY_EXCLUDED batch', () => {
  const rec = JSON.parse(fs.readFileSync(path.join(outDir, 'batch_reconciliation_report.json'), 'utf8'));
  const excl = JSON.parse(fs.readFileSync(path.join(outDir, 'explicit_exclusion_inventory.json'), 'utf8'));
  assert.equal(excl.totalExplicitlyExcluded, rec.batches.EXPLICITLY_EXCLUDED.uniqueAbilityRecords);
  assert.equal(excl.records.length, excl.totalExplicitlyExcluded);
  for (const r of excl.records) {
    assert.ok(r.exclusionReason && r.exclusionReason.length > 0, `Missing exclusionReason for ${r.abilityRecordId}`);
  }
});

test('3. All 3 condition locations audited and failures propagated into K1-BATCH-02', () => {
  const evaluated = new Set(['ALWAYS', 'DURING_YOUR_TURN']);
  // header.condition / clause.condition / clause.op.condition failure detection
  assert.equal(auditConditionValue('unparseable custom condition', evaluated).hasFailure, true);
  assert.equal(auditConditionValue({ colorSymbol: 'Purple' }, evaluated).hasFailure, true);
  assert.equal(auditConditionValue({ type: 'UNKNOWN_COND_TYPE' }, evaluated).hasFailure, true);
  assert.equal(auditConditionValue({ type: 'DURING_YOUR_TURN' }, evaluated).hasFailure, false);
  assert.equal(auditConditionValue(null, evaluated).hasFailure, false);

  const condLoc = JSON.parse(fs.readFileSync(path.join(outDir, 'condition_location_audit.json'), 'utf8'));
  const rec = JSON.parse(fs.readFileSync(path.join(outDir, 'batch_reconciliation_report.json'), 'utf8'));
  assert.equal(condLoc.byLocation['clause.condition'].total, 4534);
  assert.equal(condLoc.byLocation['clause.op.condition'].total, 406);
  assert.equal(condLoc.abilitiesWithAnyCondFail, rec.batches['K1-BATCH-02'].uniqueAbilityRecords);
  assert.ok(condLoc.byLocation['clause.op.condition'].failures > 0);
});

test('4. Semantic header completeness audit covers 100% of header properties and distinguishes behavioral fields', () => {
  const hdrAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'semantic_header_completeness_audit.json'), 'utf8'));
  assert.deepEqual(hdrAudit.unaccountedHeaderProperties, []);
  assert.ok(hdrAudit.k1_2SemanticPatternCount > hdrAudit.k1_1SemanticPatternCount);

  const baseAb = {
    type: 'ABILITY',
    header: {
      timing: 'WHEN_ATTACKS',
      timings: [],
      timingStep: 'ATTACK_STEP',
      levels: [1, 2],
      levelExplicit: true,
      prefixes: [],
      limit: null,
      cantStack: false,
      isFlash: false,
      isMain: false,
      keyword: null,
      burstCondition: null,
      cleanBody: 'Draw 1 card.',
      timingLabel: 'When Attacks',
    },
    clauses: [{ op: { op: 'DRAW', count: 1 } }],
  };

  const baseSig = buildExactSemanticSignatureV2(baseAb).semanticPatternId;
  // Metadata-only changes must NOT alter semanticPatternId
  const metaChanged = structuredClone(baseAb);
  metaChanged.header.cleanBody = 'Draw a card.';
  metaChanged.header.timingLabel = 'When This Spirit Attacks';
  assert.equal(buildExactSemanticSignatureV2(metaChanged).semanticPatternId, baseSig);

  // Behavioral header changes MUST alter semanticPatternId
  for (const [key, val] of [
    ['prefixes', ['During OC']],
    ['isFlash', true],
    ['isMain', true],
    ['levelExplicit', false],
    ['limit', 'ONCE_PER_TURN'],
    ['cantStack', true],
    ['keyword', 'Awaken'],
    ['burstCondition', 'AFTER_YOUR_LIFE_REDUCED'],
  ]) {
    const mutated = structuredClone(baseAb);
    mutated.header[key] = val;
    assert.notEqual(
      buildExactSemanticSignatureV2(mutated).semanticPatternId,
      baseSig,
      `Mutating behavioral header property ${key} must change semanticPatternId`
    );
  }
});

test('5. Partitioned manifests and SHA-256 hashes verify cleanly', () => {
  const mAssign = verifyPartitionedManifest(path.join(outDir, 'k1_2_ability_batch_assignments'));
  assert.equal(mAssign.totalRecords, 36422);
  verifyPartitionedManifest(path.join(outDir, 'k1_2_structural_pattern_catalogue'));
  verifyPartitionedManifest(path.join(outDir, 'k1_2_semantic_pattern_catalogue'));
});

test('6. Determinism: fresh run produces byte-identical JSON outputs (with versioned engine baseline)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k12-det-'));
  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k12-det2-'));
  try {
    await runK1_2Discovery(tmpDir);
    await runK1_2Discovery(tmpDir2);
    const staticFiles = [
      'header_property_inventory.json',
      'semantic_header_completeness_audit.json',
      'explicit_exclusion_inventory.json',
    ];
    for (const f of staticFiles) {
      const a = fs.readFileSync(path.join(outDir, f), 'utf8');
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      assert.equal(b, a, `Non-deterministic output detected in ${f}`);
    }
    const versionedFiles = [
      'condition_location_audit.json',
      'updated_condition_classification.json',
      'batch_reconciliation_report.json',
      'updated_batch_coverage_calculations.json',
      'operation_and_dependency_summaries.json',
    ];
    for (const f of versionedFiles) {
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      const c = fs.readFileSync(path.join(tmpDir2, f), 'utf8');
      assert.equal(c, b, `Non-deterministic output across fresh runs in ${f}`);
    }
    const histCondLoc = JSON.parse(fs.readFileSync(path.join(outDir, 'condition_location_audit.json'), 'utf8'));
    const liveCondLoc = JSON.parse(fs.readFileSync(path.join(tmpDir, 'condition_location_audit.json'), 'utf8'));
    assert.ok(liveCondLoc.abilitiesWithAnyCondFail <= histCondLoc.abilitiesWithAnyCondFail);
    const liveRec = JSON.parse(fs.readFileSync(path.join(tmpDir, 'batch_reconciliation_report.json'), 'utf8'));
    assert.equal(liveRec.reconciledAbilitySum, 36422);
    assert.equal(liveRec.reconciliationExact, true);
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
console.log(`\nWork Package K.1.2 Discovery Integrity Tests: ${passed}/${tests.length} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
