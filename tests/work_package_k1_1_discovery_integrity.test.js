import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  buildStructuralSignature,
  buildExactSemanticSignature,
  classifyClauseSixDimensions,
} from '../scripts/discover_k1_1_mechanics.mjs';

function mkAb(clauses, headerExtra = {}) {
  return {
    header: { timing: 'WHEN_ATTACKS', levels: [1, 2], limit: null, ...headerExtra },
    clauses,
  };
}

test('K1.1-INT-01..06: Exact semantic signatures distinguish numeric params, targets, conditions, clause order, optionality, duration, and limits', () => {
  // 1. Numeric parameter difference (cost <= 3 vs cost <= 8)
  const abCost3 = mkAb([{ op: { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Spirit'], costLte: 3 } } }]);
  const abCost8 = mkAb([{ op: { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Spirit'], costLte: 8 } } }]);
  assert.equal(buildStructuralSignature(abCost3).structuralId, buildStructuralSignature(abCost8).structuralId, 'Structural ID may match');
  assert.notEqual(buildExactSemanticSignature(abCost3).semanticPatternId, buildExactSemanticSignature(abCost8).semanticPatternId, 'Semantic ID must differ on costLte');

  // 2. Target filter difference
  const abSpirit = mkAb([{ op: { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Spirit'] } } }]);
  const abNexus = mkAb([{ op: { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Nexus'] } } }]);
  assert.notEqual(buildExactSemanticSignature(abSpirit).semanticPatternId, buildExactSemanticSignature(abNexus).semanticPatternId);

  // 3. Condition difference
  const abCond1 = mkAb([{ condition: 'While your Life is 3 or less', op: { op: 'DRAW', count: 1, side: 'self' } }]);
  const abCond2 = mkAb([{ condition: 'While your Life is 2 or less', op: { op: 'DRAW', count: 1, side: 'self' } }]);
  assert.notEqual(buildExactSemanticSignature(abCond1).semanticPatternId, buildExactSemanticSignature(abCond2).semanticPatternId);

  // 4. Clause order difference
  const abOrd1 = mkAb([{ op: { op: 'DRAW', count: 1, side: 'self' } }, { op: { op: 'MILL', count: 1, side: 'self' } }]);
  const abOrd2 = mkAb([{ op: { op: 'MILL', count: 1, side: 'self' } }, { op: { op: 'DRAW', count: 1, side: 'self' } }]);
  assert.notEqual(buildExactSemanticSignature(abOrd1).semanticPatternId, buildExactSemanticSignature(abOrd2).semanticPatternId);

  // 5. Optionality difference
  const abMand = mkAb([{ isOptional: false, op: { op: 'DRAW', count: 1, side: 'self' } }]);
  const abOpt = mkAb([{ isOptional: true, op: { op: 'DRAW', count: 1, side: 'self' } }]);
  assert.notEqual(buildExactSemanticSignature(abMand).semanticPatternId, buildExactSemanticSignature(abOpt).semanticPatternId);

  // 6. Duration & usage restriction difference
  const abDur1 = mkAb([{ duration: 'THIS_TURN', op: { op: 'BP_BUFF', amount: 2000, target: 'self' } }], { limit: 'ONCE_PER_TURN' });
  const abDur2 = mkAb([{ duration: 'THIS_BATTLE', op: { op: 'BP_BUFF', amount: 2000, target: 'self' } }], { limit: 'ONCE_PER_GAME' });
  assert.notEqual(buildExactSemanticSignature(abDur1).semanticPatternId, buildExactSemanticSignature(abDur2).semanticPatternId);
});

test('K1.1-INT-07..09: Canonicalization is invariant to key order/whitespace and never treats handler presence as verification', () => {
  const a1 = mkAb([{ condition: 'While  you control  a Spirit', op: { op: 'DRAW', side: 'self', count: 1 } }]);
  const a2 = mkAb([{ condition: 'While you control a Spirit', op: { count: 1, side: 'self', op: 'DRAW' } }]);
  assert.equal(buildExactSemanticSignature(a1).semanticPatternId, buildExactSemanticSignature(a2).semanticPatternId);

  // Handler presence without verified variant must remain UNVERIFIED
  const cls = classifyClauseSixDimensions(
    { rawText: 'Custom op.', op: { op: 'NONEXISTENT_VERIFIED_VARIANT_OP', customParam: 42 } },
    { cardNumber: 'TEST-1' },
    new Set(['NONEXISTENT_VERIFIED_VARIANT_OP']),
    new Set()
  );
  assert.equal(cls.runtimeImplStatus, 'HANDLER_PRESENT');
  assert.equal(cls.semanticVerificationStatus, 'UNVERIFIED');
  assert.equal(cls.manualReviewStatus, 'REQUIRED');
});

test('K1.1-INT-10..18: Full corpus reconciliation, partitioned manifests, SHA-256 hashes, determinism, and batch sums verify', () => {
  const base = 'reports/work_package_k1_1';
  const rec = JSON.parse(fs.readFileSync(path.join(base, 'k1_1_reconciliation_report.json'), 'utf8'));
  assert.equal(rec.allReconciled, true);
  assert.equal(rec.shardsObserved, 514);
  assert.equal(rec.cardRecordsObserved, 15398);
  assert.equal(rec.canonicalCardsObserved, 14609);
  assert.equal(rec.abilitiesObserved, 36422);
  assert.equal(rec.clausesObserved, 51734);
  assert.equal(rec.structuralPatternAbilitySum, 36422);
  assert.equal(rec.semanticPatternAbilitySum, 36422);

  // Validate every partitioned dataset manifest SHA-256 & byte size + underlying counts
  for (const dirName of [
    'k1_1_structural_pattern_catalogue',
    'k1_1_semantic_pattern_catalogue',
    'k1_1_card_ability_clause_mapping',
    'k1_1_complete_manual_review_inventory',
  ]) {
    const dir = path.join(base, dirName);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    let sumRecords = 0;
    for (const part of manifest.parts) {
      const buf = fs.readFileSync(path.join(dir, part.file));
      const sha = crypto.createHash('sha256').update(buf).digest('hex');
      assert.equal(sha, part.sha256, `Hash mismatch on ${dirName}/${part.file}`);
      assert.equal(buf.length, part.sizeBytes, `Size mismatch on ${dirName}/${part.file}`);
      const parsed = JSON.parse(buf.toString('utf8'));
      assert.equal(parsed.length, part.count);
      sumRecords += parsed.length;

      if (dirName === 'k1_1_semantic_pattern_catalogue' || dirName === 'k1_1_structural_pattern_catalogue') {
        for (const p of parsed) {
          assert.equal(p.abilityCount, p.abilityRefs.length, `Pattern ${p.patternId || p.structuralId} count must equal abilityRefs.length`);
        }
      }
    }
    assert.equal(sumRecords, manifest.totalRecords);
  }

  // Batch coverage deduplication check (no batch exceeds 36,422 abilities or 14,609 canonical cards)
  const batchRep = JSON.parse(fs.readFileSync(path.join(base, 'k1_1_batch_coverage_recalculation.json'), 'utf8'));
  const totalUniqueBatchAbilities = batchRep.batches.reduce((s, b) => s + b.uniqueAbilities, 0);
  assert.ok(totalUniqueBatchAbilities <= 36422, 'Disjoint batch sum must not exceed 36,422 abilities');
  for (const b of batchRep.batches) {
    assert.ok(b.uniqueCanonicalCards <= 14609);
  }
});
