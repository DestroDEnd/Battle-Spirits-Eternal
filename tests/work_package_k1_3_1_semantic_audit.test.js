import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  classifyTimingDiscrepancy,
  classifyUnresolvedExclusionFollowup,
  runK1_3_1Audit,
} from '../scripts/audit_k1_3_1_hardening.mjs';
import { assertApprovedFileHash } from '../scripts/versioned_baseline_registry.mjs';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const outDir = path.resolve('reports/work_package_k1_3_1');

test('1. Dependency evidence: static subsystem & same-card references are EXPECTED_CONSUMER without runtime code proof', () => {
  const depAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_dependency_evidence_audit.json'), 'utf8'));
  const depSummary = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_dependency_summary.json'), 'utf8'));
  const unresDeps = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_unresolved_dependencies.json'), 'utf8'));

  assert.equal(depSummary.reconcilesExactlyWithK1_3Nodes, true);
  assert.equal(depAudit.totalNodesAudited, depSummary.totalNodes);
  assert.equal(depSummary.edgeCounts.CONFIRMED_CONSUMER, 0);
  assert.ok(depSummary.edgeCounts.EXPECTED_CONSUMER > 0);
  assert.equal(unresDeps.totalNodesWithoutConfirmedConsumer, depSummary.totalNodes);

  for (const node of depAudit.nodes) {
    for (const edge of node.edges) {
      assert.notEqual(edge.evidenceClassification, 'CONFIRMED_CONSUMER', `Unexpected CONFIRMED_CONSUMER on ${node.abilityRecordId}`);
      if (edge.evidenceClassification === 'EXPECTED_CONSUMER') {
        assert.ok(edge.proposedSubsystem && edge.missingEvidence, 'EXPECTED_CONSUMER must record proposedSubsystem and missingEvidence');
      }
    }
  }
});

test('2. Timing semantics: opponent/owner/dual-trigger/original-cost/multiline qualifiers are distinguished and preserved', () => {
  const tSummary = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_timing_classification_summary.json'), 'utf8'));
  const tMissing = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_missing_timing_semantics.json'), 'utf8'));

  assert.equal(tSummary.reconcilesExactlyWithK1_3, true);
  assert.equal(tMissing.totalMissingTimingSemantics, tSummary.missingSemanticCount);

  // Synthetic adversarial timing checks
  const oppDestroyed = classifyTimingDiscrepancy(
    { abilityRecordId: 'S::C1#a0', cardNumber: 'C1' },
    { header: { timing: 'WHEN_DESTROYED', timingStep: 'ANY', timingLabel: 'When Destroyed by the Opponent' }, clauses: [{}] }
  );
  assert.equal(oppDestroyed.classification, 'GAMEPLAY_TIMING_QUALIFIER_MISSING');
  assert.equal(oppDestroyed.normalizedSemanticTiming.isByOpponent, true);
  assert.equal(oppDestroyed.semanticSignaturePreservesMeaning, false);

  const yourBattle = classifyTimingDiscrepancy(
    { abilityRecordId: 'S::C2#a0', cardNumber: 'C2' },
    { header: { timing: 'ATTACK_STEP', timingStep: 'ANY', timingLabel: 'During Your Battle Phase' }, clauses: [{}] }
  );
  assert.equal(yourBattle.classification, 'GAMEPLAY_TIMING_QUALIFIER_MISSING');
  assert.equal(yourBattle.normalizedSemanticTiming.isYourBattlePhase, true);

  const depOrDest = classifyTimingDiscrepancy(
    { abilityRecordId: 'S::C3#a0', cardNumber: 'C3' },
    { header: { timing: 'STEP_RESTRICTED', timingStep: 'ANY', timingLabel: 'When Depleted/Destroyed by the Opponent' }, clauses: [{}] }
  );
  const depOnly = classifyTimingDiscrepancy(
    { abilityRecordId: 'S::C4#a0', cardNumber: 'C4' },
    { header: { timing: 'STEP_RESTRICTED', timingStep: 'ANY', timingLabel: 'When Depleted by the Opponent' }, clauses: [{}] }
  );
  assert.notEqual(
    JSON.stringify(depOrDest.normalizedSemanticTiming),
    JSON.stringify(depOnly.normalizedSemanticTiming)
  );

  const origCost = classifyTimingDiscrepancy(
    { abilityRecordId: 'S::C5#a0', cardNumber: 'C5' },
    { header: { timing: 'WHEN_SUMMONED', timingStep: 'ANY', timingLabel: 'When summoned by paying the original cost' }, clauses: [{}] }
  );
  assert.equal(origCost.classification, 'ADDITIONAL_ACTIVATION_RESTRICTION_MISSING');
  assert.equal(origCost.normalizedSemanticTiming.activationRestriction, 'PAID_ORIGINAL_COST');

  const multiLine = classifyTimingDiscrepancy(
    { abilityRecordId: 'S::C6#a0', cardNumber: 'C6' },
    { header: { timing: 'WHEN_DESTROYED', timingStep: 'ANY', timingLabel: 'When Destroyed by the Opponent\nDraw 1 card.' }, clauses: [] }
  );
  assert.equal(multiLine.classification, 'EXECUTABLE_EFFECT_TEXT_LEAK');
  assert.equal(multiLine.normalizedSemanticTiming.leakedEffectText, 'Draw 1 card.');
});

test('3. Exclusions and source reconciliation: executable/unresolved remain tracked and all joins resolve 1-to-1', () => {
  const unresAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_unresolved_exclusion_audit.json'), 'utf8'));
  const recon = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_source_reconciliation.json'), 'utf8'));

  assert.equal(unresAudit.reconcilesWithK1_3, true);
  assert.ok(unresAudit.statusCounts.CONFIRMED_EXECUTABLE_EFFECT > 0);
  for (const r of unresAudit.records) {
    assert.notEqual(r.status, 'DISPLAY_ONLY');
  }

  assert.equal(recon.excluded2808.exactOneToOne, true);
  assert.equal(recon.timing312.exactOneToOne, true);
  assert.equal(recon.cleanBody104.exactOneToOne, true);
  assert.equal(recon.unresolved240.exactOneToOne, true);

  // Synthetic no-clause ability with leaked effect text cannot be DISPLAY_ONLY
  const synthExec = classifyUnresolvedExclusionFollowup(
    { abilityRecordId: 'S::C7#a0', cardNumber: 'C7', classification: 'EXECUTABLE_EFFECT' },
    { type: 'ABILITY', header: { timing: 'WHEN_DESTROYED', timingLabel: 'When Destroyed\nDraw 1 card.', prefixes: [] }, clauses: [] }
  );
  assert.equal(synthExec.status, 'CONFIRMED_EXECUTABLE_EFFECT');
});

test('4. cleanBody safety: all 104 zero-clause non-empty cleanBody flagged and 750 DISPLAY_ONLY_METADATA have 0 hidden gameplay text', () => {
  const cbAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_cleanbody_followup_audit.json'), 'utf8'));
  assert.equal(cbAudit.totalZeroClauseNonEmptyCleanBodyAudited, 104);
  assert.equal(cbAudit.displayOnlyHiddenGameplayViolations, 0);
  assert.equal(cbAudit.totalDisplayOnlyMetadataChecked, 750);
  for (const r of cbAudit.records) {
    assert.equal(r.flaggedForRemediation, true);
    assert.ok(r.cleanBody && r.cleanBody.trim().length > 0);
  }
});

test('5. Preservation: K.1.2 and K.1.3 SHA-256 manifests remain 100% preserved', () => {
  const gitAudit = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_git_change_audit.json'), 'utf8'));
  assert.equal(gitAudit.k1_2ManifestPreserved.verified, true);
  assert.equal(gitAudit.k1_3ManifestPreserved.verified, true);
});

test('6. Determinism: fresh K.1.3.1 run produces byte-identical deterministic JSON datasets (with versioned engine baseline)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k131-det-'));
  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-k131-det2-'));
  try {
    await runK1_3_1Audit(tmpDir);
    await runK1_3_1Audit(tmpDir2);
    const filesToCheck = [
      'k1_3_1_dependency_summary.json',
      'k1_3_1_unresolved_dependencies.json',
      'k1_3_1_timing_semantic_audit.json',
      'k1_3_1_timing_classification_summary.json',
      'k1_3_1_missing_timing_semantics.json',
      'k1_3_1_unresolved_exclusion_audit.json',
      'k1_3_1_effect_remediation_candidates.json',
      'k1_3_1_cleanbody_followup_audit.json',
      'k1_3_1_source_reconciliation.json',
    ];
    for (const f of filesToCheck) {
      const a = fs.readFileSync(path.join(outDir, f), 'utf8');
      const b = fs.readFileSync(path.join(tmpDir, f), 'utf8');
      assert.equal(b, a, `Non-deterministic output detected in ${f}`);
    }
    const depRaw1 = fs.readFileSync(path.join(tmpDir, 'k1_3_1_dependency_evidence_audit.json'), 'utf8');
    const depRaw2 = fs.readFileSync(path.join(tmpDir2, 'k1_3_1_dependency_evidence_audit.json'), 'utf8');
    assert.equal(depRaw1, depRaw2, 'Live dependency audit must be deterministic across repeated runs');
    const depHist = JSON.parse(fs.readFileSync(path.join(outDir, 'k1_3_1_dependency_evidence_audit.json'), 'utf8'));
    const depFresh = JSON.parse(depRaw1);
    assert.equal(depFresh.totalNodesAudited, depHist.totalNodesAudited);
    assert.deepEqual(depFresh.edgeCounts, depHist.edgeCounts);
    assert.deepEqual(depFresh.nodes, depHist.nodes);
    for (const [relPath, entry] of Object.entries(depFresh.engineCodeInspection || {})) {
      assertApprovedFileHash(relPath, entry.sha256, depHist.engineCodeInspection?.[relPath]?.sha256);
    }
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
console.log(`\nWork Package K.1.3.1 Semantic Audit Tests: ${passed}/${tests.length} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
