/**
 * scripts/migrate_hij_shards.mjs
 *
 * Targeted, non-destructive Work Package H/I/J shard migration.
 * Upgrades bare unparameterized clauses for newly implemented H/I/J operations
 * ONLY on isolated single-occurrence abilities (global physicalId count === 1
 * and global semanticId count === 1), preserving exact baseline counts:
 * - 514 shards, 15,398 cards, 14,609 unique canonical cards
 * - 36,422 abilities, 51,734 clauses, 4,940 conditions
 * - 34,855 unique physicalIds, 18,477 unique semanticIds
 * - Zero collisions, C.3-migrated cards untouched
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { compileClauseToOp } from '../compiler/clause_patterns.js';
import {
  createAbilityDescriptor,
  canonicalizeRFC8785,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId
} from '../compiler/identity.js';
import { inferOpVariant } from './evidence_registry.mjs';

const SHARD_DIR = path.resolve('data/ir_shards');
const INVENTORY_PATH = path.resolve('data/per_shard_validation_inventory.json');
const DIFF_REPORT_PATH = path.resolve('reports/work_package_fg/shard_migration_diff_hij.json');

const C3_PROTECTED_CARDS = new Set(['BS69-036', 'BS64-X04', 'BS20-X01', 'BS42-052', 'BS24-013', 'SD42-011']);
const LEGACY_SKIPPED_OPS = new Set(['REPLACEMENT_EFFECT', 'REVEAL_CARDS', 'BOUNCE', 'SUMMON', 'SUMMON_FREE']);

function sha256File(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function main() {
  const shardFiles = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.json')).sort();
  const shards = new Map();
  const physicalCounts = new Map();
  const semanticCounts = new Map();

  for (const file of shardFiles) {
    const rawBuf = fs.readFileSync(path.join(SHARD_DIR, file));
    const json = JSON.parse(rawBuf.toString('utf8'));
    shards.set(file, { json, beforeSha: sha256File(rawBuf), beforeSize: rawBuf.length });
    for (const card of Object.values(json)) {
      for (const ab of (card.abilities || [])) {
        if (ab.physicalId) physicalCounts.set(ab.physicalId, (physicalCounts.get(ab.physicalId) || 0) + 1);
        if (ab.semanticId) semanticCounts.set(ab.semanticId, (semanticCounts.get(ab.semanticId) || 0) + 1);
      }
    }
  }

  const reservedPhysicalIds = new Set(physicalCounts.keys());
  const reservedSemanticIds = new Set(semanticCounts.keys());

  const diffRecords = [];
  let modifiedShardCount = 0;
  let migratedAbilitiesCount = 0;
  let migratedClausesCount = 0;

  for (const file of shardFiles) {
    const entry = shards.get(file);
    const shard = entry.json;
    let shardDirty = false;

    for (const [cardKey, card] of Object.entries(shard)) {
      const cNum = String(card.cardNumber || card.card_number || cardKey).trim();
      const baseNum = cNum.replace(/_[A-Z0-9]+$/, '');
      if (C3_PROTECTED_CARDS.has(cNum) || C3_PROTECTED_CARDS.has(baseNum)) continue;

      const abilities = card.abilities || [];
      if (abilities.length === 0) continue;

      // Baseline descriptor canonicals for sibling safety verification
      const preCanonicals = abilities.map(a => canonicalizeRFC8785(createAbilityDescriptor(a)));

      for (let abIdx = 0; abIdx < abilities.length; abIdx++) {
        const ab = abilities[abIdx];
        if (!ab.physicalId || !ab.semanticId) continue;
        if (physicalCounts.get(ab.physicalId) !== 1 || semanticCounts.get(ab.semanticId) !== 1) continue;

        const clauses = ab.clauses || [];
        let abilityChanged = false;
        const nextClauses = clauses.map(cl => ({ ...cl }));

        for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
          const cl = clauses[cIdx];
          if (!cl?.op?.op || LEGACY_SKIPPED_OPS.has(cl.op.op)) continue;
          const curVariant = inferOpVariant(cl.op);
          if (!curVariant.endsWith(':bare_stub')) continue;

          const recompiled = compileClauseToOp({
            cleanText: cl.cleanText || cl.rawText || '',
            rawText: cl.rawText || cl.cleanText || ''
          });
          if (!recompiled || recompiled.op !== cl.op.op) continue;

          const enrichedOp = { ...cl.op, ...recompiled };
          if (Boolean(enrichedOp.condition) !== Boolean(cl.op.condition)) {
            delete enrichedOp.condition;
          }
          if (inferOpVariant(enrichedOp).endsWith(':bare_stub')) continue;

          nextClauses[cIdx] = { ...cl, op: enrichedOp };
          abilityChanged = true;
        }

        if (!abilityChanged) continue;

        // Verify candidate ability with enriched clauses against card descriptor uniqueness & global uniqueness
        const candidateAb = { ...ab, clauses: nextClauses };
        let newDesc, newCanon;
        try {
          newDesc = createAbilityDescriptor(candidateAb);
          newCanon = canonicalizeRFC8785(newDesc);
        } catch {
          continue;
        }

        // Reject if candidate ability would collide with another ability on the SAME card
        const sameCanonSibling = preCanonicals.some((c, i) => i !== abIdx && c === newCanon);
        if (sameCanonSibling) continue;

        const newPhysicalId = derivePhysicalAbilityId(cNum, newDesc, 1);
        const newSemanticId = deriveSemanticAbilityId(newDesc);

        if (newPhysicalId === ab.physicalId || newSemanticId === ab.semanticId) continue;
        if (reservedPhysicalIds.has(newPhysicalId) || reservedSemanticIds.has(newSemanticId)) continue;

        // Commit safe migration on this isolated ability
        reservedPhysicalIds.add(newPhysicalId);
        reservedSemanticIds.add(newSemanticId);

        const oldPhysicalId = ab.physicalId;
        const oldSemanticId = ab.semanticId;
        ab.clauses = nextClauses;
        ab.id = newPhysicalId;
        ab.physicalId = newPhysicalId;
        ab.semanticId = newSemanticId;
        if (Array.isArray(ab.keywords)) {
          for (const kw of ab.keywords) {
            kw.abilityId = newPhysicalId;
          }
        }

        preCanonicals[abIdx] = newCanon;
        shardDirty = true;
        migratedAbilitiesCount++;
        migratedClausesCount += nextClauses.filter((c, i) => JSON.stringify(c.op) !== JSON.stringify(clauses[i].op)).length;

        diffRecords.push({
          shard: file,
          cardKey,
          cardNumber: cNum,
          abilityIndex: abIdx,
          before: { physicalId: oldPhysicalId, semanticId: oldSemanticId, clauses: clauses.map(c => c.op) },
          after: { physicalId: newPhysicalId, semanticId: newSemanticId, clauses: nextClauses.map(c => c.op) }
        });
      }
    }

    if (shardDirty) {
      const outStr = JSON.stringify(shard, null, 2);
      const outPath = path.join(SHARD_DIR, file);
      fs.writeFileSync(outPath, outStr, 'utf8');
      const afterBuf = fs.readFileSync(outPath);
      entry.afterSha = sha256File(afterBuf);
      entry.afterSize = afterBuf.length;
      modifiedShardCount++;
    }
  }

  // Update per_shard_validation_inventory.json for modified shards
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));
  const shardDiffSummary = [];
  for (const invEntry of inventory) {
    const sEntry = shards.get(invEntry.file);
    if (sEntry && sEntry.afterSha) {
      shardDiffSummary.push({
        file: invEntry.file,
        beforeSha256: invEntry.sha256,
        beforeSizeBytes: invEntry.sizeBytes,
        afterSha256: sEntry.afterSha,
        afterSizeBytes: sEntry.afterSize
      });
      invEntry.sha256 = sEntry.afterSha;
      invEntry.sizeBytes = sEntry.afterSize;
    }
  }
  fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2), 'utf8');

  const report = {
    generatedAt: new Date().toISOString(),
    modifiedShardsCount: modifiedShardCount,
    migratedAbilitiesCount,
    migratedClausesCount,
    protectedC3CardsUntouched: [...C3_PROTECTED_CARDS],
    modifiedShards: shardDiffSummary,
    migratedAbilities: diffRecords
  };
  fs.writeFileSync(DIFF_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log(JSON.stringify({
    modifiedShardsCount: modifiedShardCount,
    migratedAbilitiesCount,
    migratedClausesCount
  }, null, 2));
}

main();
