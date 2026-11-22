/**
 * scripts/migrate_hij1_shards.mjs
 *
 * Work Package H/I/J.1 Targeted, Equivalence-Class-Safe Shard Migration.
 * Enriches bare incomplete-parameter clauses using wording-grounded extractors
 * (enrichHijClauseOp) while strictly preserving:
 * - 514 shards, 15,398 card records, 14,609 unique canonical cards
 * - 36,422 abilities, 51,734 clauses, 4,940 conditions
 * - 34,855 unique physicalIds and 18,477 unique semanticIds (0 collisions)
 * - C.3 protected cards untouched
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { enrichHijClauseOp } from '../compiler/clause_patterns.js';
import {
  createAbilityDescriptor,
  canonicalizeRFC8785,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId
} from '../compiler/identity.js';
import { inferOpVariant, OPERATION_CONTRACTS } from './evidence_registry.mjs';

const SHARD_DIR = path.resolve('data/ir_shards');
const INVENTORY_PATH = path.resolve('data/per_shard_validation_inventory.json');
const DIFF_REPORT_PATH = path.resolve('reports/work_package_hij1/shard_migration_diff_hij1.json');

const C3_PROTECTED_CARDS = new Set(['BS69-036', 'BS64-X04', 'BS20-X01', 'BS42-052', 'BS24-013', 'SD42-011']);
const LEGACY_SKIPPED_OPS = new Set(['REPLACEMENT_EFFECT', 'REVEAL_CARDS', 'BOUNCE', 'SUMMON', 'SUMMON_FREE', 'DRAW', 'DESTROY']);

function sha256File(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function main() {
  const shardFiles = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.json')).sort();
  const shards = new Map();
  const allPhysicalIds = new Set();
  const allSemanticIds = new Set();
  const semanticGroups = new Map(); // semanticId -> Array<{ file, cardKey, cNum, baseNum, abIdx, ab, cardCanonicals }>

  for (const file of shardFiles) {
    const rawBuf = fs.readFileSync(path.join(SHARD_DIR, file));
    const json = JSON.parse(rawBuf.toString('utf8'));
    shards.set(file, { json, beforeSha: sha256File(rawBuf), beforeSize: rawBuf.length });

    for (const [cardKey, card] of Object.entries(json)) {
      if (!card || typeof card !== 'object') continue;
      const cNum = String(card.cardNumber || card.card_number || cardKey).trim();
      const baseNum = cNum.replace(/_[A-Z0-9]+$/, '');
      const abilities = card.abilities || [];
      const cardCanonicals = abilities.map(a => canonicalizeRFC8785(createAbilityDescriptor(a)));

      for (let abIdx = 0; abIdx < abilities.length; abIdx++) {
        const ab = abilities[abIdx];
        if (!ab.physicalId || !ab.semanticId) continue;
        allPhysicalIds.add(ab.physicalId);
        allSemanticIds.add(ab.semanticId);
        if (!semanticGroups.has(ab.semanticId)) semanticGroups.set(ab.semanticId, []);
        semanticGroups.get(ab.semanticId).push({ file, cardKey, cNum, baseNum, abIdx, ab, cardCanonicals });
      }
    }
  }

  const reservedPhysicalIds = new Set(allPhysicalIds);
  const reservedSemanticIds = new Set(allSemanticIds);
  const dirtyShards = new Set();
  const diffRecords = [];
  let migratedAbilitiesCount = 0;
  let migratedClausesCount = 0;

  for (const [oldSemanticId, members] of semanticGroups.entries()) {
    // Never touch any semantic group containing a protected C.3 card
    if (members.some(m => C3_PROTECTED_CARDS.has(m.cNum) || C3_PROTECTED_CARDS.has(m.baseNum))) continue;

    // Propose enrichment per member; require ALL members of the semantic group to produce the exact same newSemanticId
    const proposals = [];
    let groupValid = true;
    const groupNewPhysicals = new Set();
    let expectedNewSemanticId = null;

    for (const m of members) {
      const clauses = m.ab.clauses || [];
      const nextClauses = clauses.map(cl => ({ ...cl }));
      let changed = false;

      for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
        const cl = clauses[cIdx];
        if (!cl?.op?.op || LEGACY_SKIPPED_OPS.has(cl.op.op)) continue;
        const contract = OPERATION_CONTRACTS[cl.op.op];
        const curVariant = inferOpVariant(cl.op);
        const isIncomplete = curVariant.endsWith(':bare_stub') || (contract && Object.keys(cl.op).length <= 1);
        if (!isIncomplete) continue;

        const text = String(cl.cleanText || cl.rawText || '').trim();
        if (!text) continue;

        const enriched = enrichHijClauseOp({ ...cl.op }, text);
        if (!enriched || enriched.op !== cl.op.op) continue;
        if (Boolean(enriched.condition) !== Boolean(cl.op.condition)) delete enriched.condition;
        if (Object.keys(enriched).length <= Object.keys(cl.op).length) continue;
        if (inferOpVariant(enriched).endsWith(':bare_stub')) continue;

        nextClauses[cIdx] = { ...cl, op: enriched };
        changed = true;
      }

      if (!changed) {
        groupValid = false;
        break;
      }

      const candidateAb = { ...m.ab, clauses: nextClauses };
      let newDesc, newCanon;
      try {
        newDesc = createAbilityDescriptor(candidateAb);
        newCanon = canonicalizeRFC8785(newDesc);
      } catch {
        groupValid = false;
        break;
      }

      // Check sibling collision on same card
      if (m.cardCanonicals.some((c, i) => i !== m.abIdx && c === newCanon)) {
        groupValid = false;
        break;
      }

      const newSemanticId = deriveSemanticAbilityId(newDesc);
      const newPhysicalId = derivePhysicalAbilityId(m.cNum, newDesc, 1);

      if (newSemanticId === oldSemanticId || newPhysicalId === m.ab.physicalId) {
        groupValid = false;
        break;
      }
      if (reservedSemanticIds.has(newSemanticId) || reservedPhysicalIds.has(newPhysicalId)) {
        groupValid = false;
        break;
      }
      if (expectedNewSemanticId === null) expectedNewSemanticId = newSemanticId;
      else if (expectedNewSemanticId !== newSemanticId) {
        groupValid = false;
        break;
      }
      if (groupNewPhysicals.has(newPhysicalId)) {
        // Only allow duplicate newPhysicalId if those exact members shared the same old physicalId
        const sameOldPhys = members.filter(x => x.cNum === m.cNum && x.ab.physicalId === m.ab.physicalId);
        if (sameOldPhys.length < 2) {
          groupValid = false;
          break;
        }
      }
      groupNewPhysicals.add(newPhysicalId);
      proposals.push({ m, nextClauses, newCanon, newPhysicalId, newSemanticId });
    }

    if (!groupValid || proposals.length === 0 || !expectedNewSemanticId) continue;

    // Commit atomic group migration
    reservedSemanticIds.add(expectedNewSemanticId);
    for (const p of proposals) {
      reservedPhysicalIds.add(p.newPhysicalId);
      const oldPhys = p.m.ab.physicalId;
      const oldClauses = p.m.ab.clauses.map(c => c.op);
      p.m.ab.clauses = p.nextClauses;
      p.m.ab.id = p.newPhysicalId;
      p.m.ab.physicalId = p.newPhysicalId;
      p.m.ab.semanticId = p.newSemanticId;
      if (Array.isArray(p.m.ab.keywords)) {
        for (const kw of p.m.ab.keywords) kw.abilityId = p.newPhysicalId;
      }
      p.m.cardCanonicals[p.m.abIdx] = p.newCanon;
      dirtyShards.add(p.m.file);
      migratedAbilitiesCount++;
      migratedClausesCount += p.nextClauses.filter((c, i) => JSON.stringify(c.op) !== JSON.stringify(oldClauses[i])).length;
      diffRecords.push({
        shard: p.m.file,
        cardKey: p.m.cardKey,
        cardNumber: p.m.cNum,
        abilityIndex: p.m.abIdx,
        reason: 'Work Package H/I/J.1 wording-grounded incomplete parameter enrichment',
        before: { physicalId: oldPhys, semanticId: oldSemanticId, clauses: oldClauses },
        after: { physicalId: p.newPhysicalId, semanticId: p.newSemanticId, clauses: p.nextClauses.map(c => c.op) }
      });
    }
  }

  // Write modified shards & refresh per_shard_validation_inventory.json
  const inventory = fs.existsSync(INVENTORY_PATH) ? JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8')) : [];
  const invArray = Array.isArray(inventory) ? inventory : (Array.isArray(inventory.shards) ? inventory.shards : []);
  const invShardMap = new Map();
  for (const row of invArray) invShardMap.set(row.file, row);
  const modifiedShards = [];

  for (const file of [...dirtyShards].sort()) {
    const entry = shards.get(file);
    const outPath = path.join(SHARD_DIR, file);
    const serialized = JSON.stringify(entry.json, null, 2) + '\n';
    fs.writeFileSync(outPath, serialized, 'utf8');
    const afterBuf = fs.readFileSync(outPath);
    const afterSha = sha256File(afterBuf);
    modifiedShards.push({
      file,
      beforeSha256: entry.beforeSha,
      beforeSizeBytes: entry.beforeSize,
      afterSha256: afterSha,
      afterSizeBytes: afterBuf.length
    });
    if (invShardMap.has(file)) {
      const row = invShardMap.get(file);
      row.sha256 = afterSha;
      row.sizeBytes = afterBuf.length;
    }
  }

  if (dirtyShards.size > 0) {
    fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
  }

  fs.mkdirSync(path.dirname(DIFF_REPORT_PATH), { recursive: true });
  fs.writeFileSync(DIFF_REPORT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    modifiedShardsCount: modifiedShards.length,
    migratedAbilitiesCount,
    migratedClausesCount,
    protectedC3CardsUntouched: [...C3_PROTECTED_CARDS],
    modifiedShards,
    diffRecords
  }, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    modifiedShardsCount: modifiedShards.length,
    migratedAbilitiesCount,
    migratedClausesCount
  }, null, 2));
}

main();
