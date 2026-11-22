import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { classifyExcludedRecord, runK1_3Audit } from '../scripts/audit_k1_3_exclusions.mjs';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const outDir = path.resolve('reports/work_package_k1_3');
const k12ExclPath = path.resolve('reports/work_package_k1_2/explicit_exclusion_inventory.json');

test('1. Every exclusion receives exactly one classification and no excluded record disappears', () => {
  const k12Excl = JSON.parse(fs.readFileSync(k12ExclPath, 'utf8'));
  const k13Class = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_exclusion_classification.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_exclusion_classification_manifest.json'), 'utf8'));

  const validClasses = new Set([
    'EXECUTABLE_EFFECT',
    'GAMEPLAY_PREREQUISITE',
    'CONTINUOUS_OR_PASSIVE_RULE',
    'KEYWORD_DEFINITION',
    'DISPLAY_ONLY_METADATA',
    'UNRESOLVED_REQUIRES_REVIEW',
  ]);

  assert.equal(k13Class.totalExcludedRecordsAudited, k12Excl.records.length);
  assert.equal(k13Class.records.length, k12Excl.records.length);
  assert.equal(manifest.totalRecords, k12Excl.records.length);

  const seenIds = new Set();
  const actualCounts = {};
  for (const r of k13Class.records) {
    assert.ok(!seenIds.has(r.abilityRecordId), `Duplicate abilityRecordId: ${r.abilityRecordId}`);
    seenIds.add(r.abilityRecordId);
    assert.ok(validClasses.has(r.classification), `Invalid classification ${r.classification}`);
    assert.ok(r.reason && r.reason.length > 0, `Missing reason on ${r.abilityRecordId}`);
    actualCounts[r.classification] = (actualCounts[r.classification] || 0) + 1;
  }

  for (const orig of k12Excl.records) {
    assert.ok(seenIds.has(orig.abilityRecordId), `Missing excluded record: ${orig.abilityRecordId}`);
  }

  for (const [cls, cnt] of Object.entries(k13Class.classificationCounts)) {
    assert.equal(actualCounts[cls] || 0, cnt, `Count mismatch for ${cls}`);
  }

  // Verify every partition SHA-256 hash and record count
  let partRecordSum = 0;
  for (const part of manifest.partitions) {
    const pPath = path.join(outDir, part.file);
    assert.equal(fs.existsSync(pPath), true, `Missing partition ${part.file}`);
    const content = fs.readFileSync(pPath, 'utf8');
    const sha = crypto.createHash('sha256').update(content).digest('hex');
    assert.equal(sha, part.sha256, `Partition SHA-256 mismatch for ${part.file}`);
    const arr = JSON.parse(content);
    assert.equal(arr.length, part.recordCount);
    partRecordSum += arr.length;
  }
  assert.equal(partRecordSum, manifest.totalRecords);
});

test('2. Header-only Brave Condition & keyword records remain discoverable and prerequisites with consumers are never DISPLAY_ONLY_METADATA', () => {
  const k13Class = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_exclusion_classification.json'), 'utf8'));
  const depGraph = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_prerequisite_dependency_graph.json'), 'utf8'));

  const braveRecords = k13Class.records.filter(r => r.headerProperties?.keyword && /^Brave Condition\b/i.test(r.headerProperties.keyword));
  assert.ok(braveRecords.length > 0, 'Expected Brave Condition records in exclusion audit');
  for (const b of braveRecords) {
    assert.equal(b.classification, 'GAMEPLAY_PREREQUISITE');
    assert.ok(b.dependencyReferences.length > 0);
  }

  const kwDefs = k13Class.records.filter(r => r.classification === 'KEYWORD_DEFINITION');
  assert.ok(kwDefs.length > 0, 'Expected KEYWORD_DEFINITION records');
  assert.ok(depGraph.nodesWithKnownConsumers > 0, 'Expected prerequisite/keyword nodes with known consumers');

  // Prerequisite with consumers must NEVER be DISPLAY_ONLY_METADATA
  for (const r of k13Class.records) {
    if (r.dependencyReferences && r.dependencyReferences.length > 0) {
      assert.notEqual(r.classification, 'DISPLAY_ONLY_METADATA', `Record ${r.abilityRecordId} has dependencies but was marked DISPLAY_ONLY_METADATA`);
    }
  }

  // Synthetic adversarial check on classifyExcludedRecord
  const synth = classifyExcludedRecord(
    { abilityRecordId: 'SYNTH::C-01#a0', cardNumber: 'C-01', shard: 'SYNTH.json', exclusionReason: 'CONDITION_HEADER_ONLY_NO_CLAUSES' },
    { type: 'CONDITION', header: { keyword: 'Brave Condition: Cost 4 or more', timing: 'PASSIVE', prefixes: [], cleanBody: '' }, rawText: '[Brave Condition: Cost 4 or more]' },
    { cardNumber: 'C-01' },
    [{ abilityRecordId: 'SYNTH::C-01#a1', kind: 'BRAVE_CONSUMER', relation: 'CONSUMES_BRAVE_CONDITION' }]
  );
  assert.equal(synth.classification, 'GAMEPLAY_PREREQUISITE');
  assert.equal(synth.dependencyReferences.length, 2);
});

test('3. Dependency references resolve or are explicitly marked unresolved', () => {
  const unresolved = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_unresolved_dependency_inventory.json'), 'utf8'));
  const k13Class = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_exclusion_classification.json'), 'utf8'));

  const expectedUnresolvedOrExec = k13Class.records.filter(
    r => r.classification === 'UNRESOLVED_REQUIRES_REVIEW' || r.classification === 'EXECUTABLE_EFFECT'
  );
  assert.equal(unresolved.totalUnresolvedOrExecutableExclusions, expectedUnresolvedOrExec.length);
  for (const u of unresolved.records) {
    assert.ok(u.reason && u.evidence);
  }
});

test('4. cleanBody mismatches and timingLabel discrepancies are detected', () => {
  const cbAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_cleanbody_semantic_audit.json'), 'utf8'));
  const tlAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_timinglabel_semantic_audit.json'), 'utf8'));

  assert.equal(cbAudit.totalAbilitiesAudited, 36422);
  assert.ok(cbAudit.cleanBodyZeroClauseNonEmpty > 0, 'Expected zero-clause abilities with non-empty cleanBody');
  assert.equal(cbAudit.recommendation, 'KEEP_EXCLUDED');

  assert.equal(tlAudit.totalAbilitiesAudited, 36422);
  assert.ok(tlAudit.timingLabelMultiLineCount > 0, 'Expected multi-line timingLabel discrepancies');
  assert.ok(tlAudit.timingLabelWithQualifierCount > 0, 'Expected qualifier timingLabel discrepancies');
  assert.equal(tlAudit.recommendation, 'REQUIRES_REVIEW');

  // Synthetic check: timingLabel with leaked effect text classifies as EXECUTABLE_EFFECT
  const leaked = classifyExcludedRecord(
    { abilityRecordId: 'SYNTH::C-02#a0', cardNumber: 'C-02', shard: 'SYNTH.json', exclusionReason: 'ZERO_CLAUSE_ABILITY_NO_OP' },
    { type: 'ABILITY', header: { timing: 'WHEN_DESTROYED', timingLabel: 'When Destroyed\nDraw 1 card.', prefixes: [], cleanBody: '.' } },
    { cardNumber: 'C-02' },
    []
  );
  assert.equal(leaked.classification, 'EXECUTABLE_EFFECT');
});

test('5. Git preservation audit distinguishes pre-existing dirty files honestly, marks indeterminate, and confirms K.1.2 outputs unchanged', () => {
  const gitCmp = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_git_path_comparison.json'), 'utf8'));
  const pres = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_preservation_audit.json'), 'utf8'));

  assert.ok(gitCmp.summaryCounts.PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT > 0);
  assert.equal(pres.unexpectedEngineCompilerIrChangesDuringK1_2_or_K1_3, 0);
  assert.equal(pres.k1_2OutputsByteVerifiedViaManifest, true);
  assert.equal(pres.preservationStatus, 'PASS_WITH_INDETERMINATE_PREEXISTING_DIRTY');

  // Verify pre-existing dirty paths are labeled PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT, not confirmed unchanged
  const enginePaths = gitCmp.paths.filter(p => p.path.startsWith('engine/'));
  assert.ok(enginePaths.length > 0);
  for (const ep of enginePaths) {
    assert.equal(ep.attribution, 'PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT');
  }
});

test('6. Determinism: re-running K.1.3 audit into temp dir yields byte-identical JSON outputs', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k13-det-'));
  try {
    await runK1_3Audit(tmpDir);
    const filesToCheck = [
      'k1_3_exclusion_classification.json',
      'k1_3_exclusion_classification_manifest.json',
      'k1_3_prerequisite_dependency_graph.json',
      'k1_3_unresolved_dependency_inventory.json',
      'k1_3_cleanbody_semantic_audit.json',
      'k1_3_timinglabel_semantic_audit.json',
    ];
    for (const f of filesToCheck) {
      const a = fs.readFileSync(path.join(outDir, f), 'utf8');
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      assert.equal(b, a, `Non-deterministic output in ${f}`);
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
console.log(`\nWork Package K.1.3 Audit Tests: ${passed}/${tests.length} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
