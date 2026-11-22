/**
 * scripts/validate_514_shards_exhaustive.mjs
 *
 * Phase 4C.3.2.5.2 — Exhaustive 514-Shard Identity Dataset Validation & Provenance Script
 *
 * Validates:
 * 1. Authoritative dataset provenance against data/per_shard_validation_inventory.json (514 shards)
 *    - Requires exact 514 expected entries
 *    - Requires exact expected shard filenames (rejects missing, additional, modified, or renamed shards)
 *    - Compares SHA-256 and byte size before parsing each shard
 * 2. Complete JSON structure and per-shard card/ability counts
 * 3. Exhaustive identity contract enforcement across all 36,422 abilities:
 *    - physicalId format, id === physicalId, and exact RFC 8785 + dual-digest re-derivation
 *    - semanticId format and exact RFC 8785 + dual-digest re-derivation
 *    - legacyId presence, string type, and intra-card ambiguity detection
 * 4. Descriptor-level duplicate classification:
 *    - Collects all repeated physicalId and semanticId occurrences
 *    - Compares canonical RFC 8785 descriptors to classify legitimate repeated records vs collisions
 * 5. Emits complete machine-readable validation results and collision analysis.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  createAbilityDescriptor,
  canonicalizeRFC8785,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId
} from '../compiler/identity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const DEFAULT_SHARDS_DIR = path.join(ROOT, 'data', 'ir_shards');
const DEFAULT_INVENTORY_PATH = path.join(ROOT, 'data', 'per_shard_validation_inventory.json');

const PHYSICAL_ID_REGEX = /^.+?#AB_[A-Z0-9_]+_[A-Z0-9_]+_(?:ALL|LV\d+(?:_LV\d+)*)_[0-9a-f]{64}_[0-9a-f]{32}(?:_inst[2-9]\d*)?$/;
const SEMANTIC_ID_REGEX = /^SEM#AB_[A-Z0-9_]+_[A-Z0-9_]+_(?:ALL|LV\d+(?:_LV\d+)*)_[0-9a-f]{64}_[0-9a-f]{32}$/;

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Runs exhaustive provenance, contract, and descriptor-level collision validation
 * across the sharded IR dataset.
 *
 * @param {object} [options]
 * @param {string} [options.shardsDir]
 * @param {string} [options.expectedInventoryPath]
 * @param {boolean} [options.strictBaseline=true] Enforce 15398/14609/36422/34855/18476 baseline
 * @returns {object} Machine-readable validation report
 */
export function validateAllShards(options = {}) {
  const startTime = Date.now();
  const shardsDir = options.shardsDir || DEFAULT_SHARDS_DIR;
  const expectedInventoryPath = options.expectedInventoryPath || DEFAULT_INVENTORY_PATH;
  const strictBaseline = options.strictBaseline !== false;

  const report = {
    status: 'FAIL',
    datasetSource: path.relative(ROOT, shardsDir).replace(/\\/g, '/') || shardsDir,
    expectedInventorySource: path.relative(ROOT, expectedInventoryPath).replace(/\\/g, '/') || expectedInventoryPath,
    provenancePinnedBy: 'per-shard SHA-256 and byte-size manifest (data/per_shard_validation_inventory.json)',
    expectedShards: 0,
    discoveredShards: 0,
    verifiedShards: 0,
    missingShards: [],
    unexpectedShards: [],
    hashMismatches: [],
    totalCards: 0,
    uniqueCanonicalCards: 0,
    totalAbilities: 0,
    validPhysicalIds: 0,
    validSemanticIds: 0,
    validLegacyIds: 0,
    uniquePhysicalIds: 0,
    uniqueSemanticIds: 0,
    physicalCollisions: 0,
    semanticCollisions: 0,
    legitimateRepeatedIdentityGroups: 0,
    legitimateRepeatedPhysicalGroups: 0,
    legitimateRepeatedSemanticGroups: 0,
    unresolvedDuplicateGroups: 0,
    malformedRecords: 0,
    ambiguousLegacyCards: 0,
    errors: [],
    perShardResults: [],
    collisionAnalysis: {
      physicalCollisions: [],
      semanticCollisions: [],
      unresolvedDuplicateGroups: [],
      ambiguousLegacyCards: [],
      legitimateRepeatedPhysicalGroupCount: 0,
      legitimateRepeatedSemanticGroupCount: 0,
      sampleRepeatedPhysicalGroups: [],
      sampleRepeatedSemanticGroups: []
    },
    durationMs: 0
  };

  // 1. Load expected per-shard inventory
  if (!fs.existsSync(expectedInventoryPath)) {
    report.errors.push(`Expected inventory manifest not found: ${expectedInventoryPath}`);
    report.durationMs = Date.now() - startTime;
    return report;
  }

  let expectedInventory;
  try {
    expectedInventory = JSON.parse(fs.readFileSync(expectedInventoryPath, 'utf8'));
  } catch (err) {
    report.errors.push(`Failed to parse expected inventory manifest: ${err.message}`);
    report.durationMs = Date.now() - startTime;
    return report;
  }

  if (!Array.isArray(expectedInventory) || expectedInventory.length !== 514) {
    report.errors.push(`Expected exactly 514 entries in inventory manifest, found ${Array.isArray(expectedInventory) ? expectedInventory.length : 'non-array'}`);
    report.durationMs = Date.now() - startTime;
    return report;
  }

  report.expectedShards = expectedInventory.length;
  const expectedByFile = new Map();
  for (const entry of expectedInventory) {
    if (!entry.file || !entry.relativePath || !entry.sha256 || typeof entry.sizeBytes !== 'number') {
      report.errors.push(`Malformed inventory entry: ${JSON.stringify(entry)}`);
      report.durationMs = Date.now() - startTime;
      return report;
    }
    expectedByFile.set(entry.file, entry);
  }

  // 2. Locate actual shards directory
  if (!fs.existsSync(shardsDir)) {
    report.errors.push(`Shards directory does not exist: ${shardsDir}`);
    report.durationMs = Date.now() - startTime;
    return report;
  }

  const actualFiles = fs.readdirSync(shardsDir).sort();
  report.discoveredShards = actualFiles.length;

  const actualFileSet = new Set(actualFiles);
  for (const expectedFile of expectedByFile.keys()) {
    if (!actualFileSet.has(expectedFile)) {
      report.missingShards.push(expectedFile);
    }
  }
  for (const actualFile of actualFiles) {
    if (!expectedByFile.has(actualFile)) {
      report.unexpectedShards.push(actualFile);
    }
  }

  if (report.missingShards.length > 0 || report.unexpectedShards.length > 0) {
    report.errors.push(
      `Shard filename set mismatch: ${report.missingShards.length} missing, ${report.unexpectedShards.length} unexpected`
    );
    report.durationMs = Date.now() - startTime;
    return report;
  }

  // 3. Verify SHA-256 and byte size for every shard BEFORE parsing
  const shardBuffers = new Map();
  for (const entry of expectedInventory) {
    const fullPath = path.join(shardsDir, entry.file);
    const buf = fs.readFileSync(fullPath);
    const actualSha256 = sha256Buffer(buf);
    const actualSize = buf.length;

    if (actualSha256 !== entry.sha256 || actualSize !== entry.sizeBytes) {
      report.hashMismatches.push({
        file: entry.file,
        relativePath: entry.relativePath,
        expectedSha256: entry.sha256,
        actualSha256,
        expectedSizeBytes: entry.sizeBytes,
        actualSizeBytes: actualSize
      });
    } else {
      shardBuffers.set(entry.file, buf);
    }
  }

  if (report.hashMismatches.length > 0) {
    report.errors.push(`Provenance check failed: ${report.hashMismatches.length} shard hash/size mismatches detected before parsing`);
    report.durationMs = Date.now() - startTime;
    return report;
  }

  // 4. Parse and exhaustively validate every shard and ability
  const uniqueCardNumbers = new Set();
  const physicalIdOccurrences = new Map();
  const semanticIdOccurrences = new Map();

  for (const entry of expectedInventory) {
    const buf = shardBuffers.get(entry.file);
    let data;
    try {
      data = JSON.parse(buf.toString('utf8'));
    } catch (err) {
      report.malformedRecords++;
      report.errors.push(`Malformed JSON in ${entry.file}: ${err.message}`);
      report.perShardResults.push({
        relativePath: entry.relativePath,
        file: entry.file,
        sha256: entry.sha256,
        sizeBytes: entry.sizeBytes,
        expectedCardCount: entry.cardCount,
        actualCardCount: 0,
        expectedAbilityCount: entry.abilityCount,
        actualAbilityCount: 0,
        status: 'MALFORMED'
      });
      continue;
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      report.malformedRecords++;
      report.errors.push(`Shard ${entry.file} root is not an object`);
      continue;
    }

    let shardCards = 0;
    let shardAbilities = 0;
    let shardInvalid = false;

    for (const [key, card] of Object.entries(data)) {
      shardCards++;
      report.totalCards++;

      if (!card || typeof card !== 'object') {
        report.malformedRecords++;
        shardInvalid = true;
        report.errors.push(`Malformed card record in ${entry.file} key ${key}`);
        continue;
      }

      const cNum = card.cardNumber || card.card_number || key;
      if (!cNum || typeof cNum !== 'string') {
        report.malformedRecords++;
        shardInvalid = true;
        report.errors.push(`Missing canonical card number in ${entry.file} key ${key}`);
        continue;
      }
      uniqueCardNumbers.add(cNum);

      if (card.abilities !== undefined && !Array.isArray(card.abilities)) {
        report.malformedRecords++;
        shardInvalid = true;
        report.errors.push(`Malformed abilities field on ${cNum} in ${entry.file}`);
        continue;
      }

      if (Array.isArray(card.abilities)) {
        const descriptorCounts = new Map();
        const cardLegacyIds = new Map();

        for (let i = 0; i < card.abilities.length; i++) {
          const ab = card.abilities[i];
          shardAbilities++;
          report.totalAbilities++;

          if (!ab || typeof ab !== 'object') {
            report.malformedRecords++;
            shardInvalid = true;
            report.errors.push(`Malformed ability object at ${entry.file} ${cNum}[${i}]`);
            continue;
          }

          let descriptor;
          let canonicalJson;
          let instanceIndex;
          let expectedPhysicalId;
          let expectedSemanticId;
          try {
            descriptor = createAbilityDescriptor(ab);
            canonicalJson = canonicalizeRFC8785(descriptor);
            instanceIndex = (descriptorCounts.get(canonicalJson) || 0) + 1;
            descriptorCounts.set(canonicalJson, instanceIndex);
            expectedPhysicalId = derivePhysicalAbilityId(cNum, descriptor, instanceIndex);
            expectedSemanticId = deriveSemanticAbilityId(descriptor);
          } catch (err) {
            report.malformedRecords++;
            shardInvalid = true;
            report.errors.push(`Descriptor canonicalization failed for ${entry.file} ${cNum}[${i}]: ${err.message}`);
            continue;
          }

          // Physical ID contract
          const physValid =
            typeof ab.physicalId === 'string' &&
            ab.physicalId.length > 0 &&
            PHYSICAL_ID_REGEX.test(ab.physicalId) &&
            ab.physicalId.startsWith(`${cNum}#AB_`) &&
            ab.id === ab.physicalId &&
            ab.physicalId === expectedPhysicalId;

          if (physValid) {
            report.validPhysicalIds++;
          } else {
            shardInvalid = true;
            report.errors.push(
              `Physical ID contract failure on ${entry.file} ${cNum}[${i}]: actual=${ab.physicalId}, id=${ab.id}, expected=${expectedPhysicalId}`
            );
          }

          // Semantic ID contract
          const semValid =
            typeof ab.semanticId === 'string' &&
            ab.semanticId.length > 0 &&
            SEMANTIC_ID_REGEX.test(ab.semanticId) &&
            ab.semanticId === expectedSemanticId;

          if (semValid) {
            report.validSemanticIds++;
          } else {
            shardInvalid = true;
            report.errors.push(
              `Semantic ID contract failure on ${entry.file} ${cNum}[${i}]: actual=${ab.semanticId}, expected=${expectedSemanticId}`
            );
          }

          // Legacy ID contract + intra-card ambiguity check
          const legValid = typeof ab.legacyId === 'string' && ab.legacyId.trim().length > 0;
          if (legValid) {
            report.validLegacyIds++;
            if (!cardLegacyIds.has(ab.legacyId)) {
              cardLegacyIds.set(ab.legacyId, []);
            }
            cardLegacyIds.get(ab.legacyId).push(i);
          } else {
            shardInvalid = true;
            report.errors.push(`Legacy ID contract failure on ${entry.file} ${cNum}[${i}]: ${String(ab.legacyId)}`);
          }

          if (!physicalIdOccurrences.has(ab.physicalId)) {
            physicalIdOccurrences.set(ab.physicalId, []);
          }
          physicalIdOccurrences.get(ab.physicalId).push({
            file: entry.file,
            relativePath: entry.relativePath,
            cardNumber: cNum,
            abilityIndex: i,
            instanceIndex,
            canonicalJson
          });

          if (!semanticIdOccurrences.has(ab.semanticId)) {
            semanticIdOccurrences.set(ab.semanticId, []);
          }
          semanticIdOccurrences.get(ab.semanticId).push({
            file: entry.file,
            relativePath: entry.relativePath,
            cardNumber: cNum,
            abilityIndex: i,
            canonicalJson
          });
        }

        for (const [legId, indices] of cardLegacyIds.entries()) {
          if (indices.length > 1) {
            report.ambiguousLegacyCards++;
            report.collisionAnalysis.ambiguousLegacyCards.push({
              file: entry.file,
              cardNumber: cNum,
              legacyId: legId,
              abilityIndices: indices
            });
          }
        }
      }
    }

    if (shardCards !== entry.cardCount || shardAbilities !== entry.abilityCount) {
      shardInvalid = true;
      report.errors.push(
        `Count mismatch in ${entry.file}: expected (${entry.cardCount} cards, ${entry.abilityCount} abilities), actual (${shardCards} cards, ${shardAbilities} abilities)`
      );
    }

    if (!shardInvalid) {
      report.verifiedShards++;
    }

    report.perShardResults.push({
      relativePath: entry.relativePath,
      file: entry.file,
      sha256: entry.sha256,
      sizeBytes: entry.sizeBytes,
      cardCount: shardCards,
      abilityCount: shardAbilities,
      status: shardInvalid ? 'INVALID' : 'VALID'
    });
  }

  report.uniqueCanonicalCards = uniqueCardNumbers.size;
  report.uniquePhysicalIds = physicalIdOccurrences.size;
  report.uniqueSemanticIds = semanticIdOccurrences.size;

  // 5. Descriptor-level duplicate & collision classification
  for (const [physicalId, occs] of physicalIdOccurrences.entries()) {
    if (occs.length <= 1) continue;

    const first = occs[0];
    const descriptorMismatch = occs.some(
      o => o.canonicalJson !== first.canonicalJson || o.cardNumber !== first.cardNumber || o.instanceIndex !== first.instanceIndex
    );

    const shardSet = new Set(occs.map(o => o.file));
    const sameShardDuplicate = shardSet.size !== occs.length;

    if (descriptorMismatch) {
      report.physicalCollisions++;
      report.collisionAnalysis.physicalCollisions.push({
        physicalId,
        occurrences: occs.map(({ file, cardNumber, abilityIndex, instanceIndex }) => ({
          file,
          cardNumber,
          abilityIndex,
          instanceIndex
        }))
      });
    } else if (sameShardDuplicate) {
      report.unresolvedDuplicateGroups++;
      report.collisionAnalysis.unresolvedDuplicateGroups.push({
        type: 'PHYSICAL_SAME_SHARD_DUPLICATE',
        physicalId,
        occurrences: occs.map(({ file, cardNumber, abilityIndex, instanceIndex }) => ({
          file,
          cardNumber,
          abilityIndex,
          instanceIndex
        }))
      });
    } else {
      report.legitimateRepeatedPhysicalGroups++;
      if (report.collisionAnalysis.sampleRepeatedPhysicalGroups.length < 15) {
        report.collisionAnalysis.sampleRepeatedPhysicalGroups.push({
          physicalId,
          cardNumber: first.cardNumber,
          instanceIndex: first.instanceIndex,
          occurrenceCount: occs.length,
          shards: occs.map(o => o.file),
          classification: 'LEGITIMATE_CROSS_SHARD_CANONICAL_RECORD'
        });
      }
    }
  }

  for (const [semanticId, occs] of semanticIdOccurrences.entries()) {
    if (occs.length <= 1) continue;

    const first = occs[0];
    const descriptorMismatch = occs.some(o => o.canonicalJson !== first.canonicalJson);

    if (descriptorMismatch) {
      report.semanticCollisions++;
      report.collisionAnalysis.semanticCollisions.push({
        semanticId,
        occurrences: occs.map(({ file, cardNumber, abilityIndex }) => ({
          file,
          cardNumber,
          abilityIndex
        }))
      });
    } else {
      report.legitimateRepeatedSemanticGroups++;
      if (report.collisionAnalysis.sampleRepeatedSemanticGroups.length < 15) {
        report.collisionAnalysis.sampleRepeatedSemanticGroups.push({
          semanticId,
          occurrenceCount: occs.length,
          sampleCards: [...new Set(occs.map(o => o.cardNumber))].slice(0, 5),
          classification: 'LEGITIMATE_SEMANTIC_EQUIVALENCE'
        });
      }
    }
  }

  report.legitimateRepeatedIdentityGroups =
    report.legitimateRepeatedPhysicalGroups + report.legitimateRepeatedSemanticGroups;
  report.collisionAnalysis.legitimateRepeatedPhysicalGroupCount = report.legitimateRepeatedPhysicalGroups;
  report.collisionAnalysis.legitimateRepeatedSemanticGroupCount = report.legitimateRepeatedSemanticGroups;

  if (strictBaseline) {
    if (
      report.totalCards !== 15398 ||
      report.uniqueCanonicalCards !== 14609 ||
      report.totalAbilities !== 36422 ||
      report.uniquePhysicalIds !== 34855 ||
      report.uniqueSemanticIds !== 18496
    ) {
      report.errors.push(
        `Baseline reconciliation mismatch: cards=${report.totalCards}/15398, uniqueCards=${report.uniqueCanonicalCards}/14609, abilities=${report.totalAbilities}/36422, uniquePhysical=${report.uniquePhysicalIds}/34855, uniqueSemantic=${report.uniqueSemanticIds}/18496`
      );
    }
  }

  const passed =
    report.errors.length === 0 &&
    report.verifiedShards === report.expectedShards &&
    report.missingShards.length === 0 &&
    report.unexpectedShards.length === 0 &&
    report.hashMismatches.length === 0 &&
    report.validPhysicalIds === report.totalAbilities &&
    report.validSemanticIds === report.totalAbilities &&
    report.validLegacyIds === report.totalAbilities &&
    report.physicalCollisions === 0 &&
    report.semanticCollisions === 0 &&
    report.unresolvedDuplicateGroups === 0 &&
    report.malformedRecords === 0 &&
    report.ambiguousLegacyCards === 0;

  report.status = passed ? 'PASS' : 'FAIL';
  report.durationMs = Date.now() - startTime;
  return report;
}

// CLI execution
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const args = process.argv.slice(2);
  let outPath = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outPath = path.resolve(args[i + 1]);
      i++;
    }
  }

  const result = validateAllShards();

  console.log('--- EXHAUSTIVE 514-SHARD IDENTITY VALIDATION ---');
  console.log(`Status:                              ${result.status}`);
  console.log(`Dataset Source:                      ${result.datasetSource}`);
  console.log(`Pinned Inventory:                    ${result.expectedInventorySource}`);
  console.log(`Expected / Discovered / Verified:    ${result.expectedShards} / ${result.discoveredShards} / ${result.verifiedShards}`);
  console.log(`Missing / Unexpected / HashMismatch: ${result.missingShards.length} / ${result.unexpectedShards.length} / ${result.hashMismatches.length}`);
  console.log(`Total Card Records:                  ${result.totalCards}`);
  console.log(`Unique Canonical Cards:              ${result.uniqueCanonicalCards}`);
  console.log(`Total Ability Records:               ${result.totalAbilities}`);
  console.log(`Valid Physical / Semantic / Legacy:  ${result.validPhysicalIds} / ${result.validSemanticIds} / ${result.validLegacyIds}`);
  console.log(`Unique Physical / Semantic IDs:      ${result.uniquePhysicalIds} / ${result.uniqueSemanticIds}`);
  console.log(`Physical / Semantic Collisions:      ${result.physicalCollisions} / ${result.semanticCollisions}`);
  console.log(`Legitimate Repeated Groups (P + S):  ${result.legitimateRepeatedPhysicalGroups} + ${result.legitimateRepeatedSemanticGroups} = ${result.legitimateRepeatedIdentityGroups}`);
  console.log(`Unresolved / Malformed / AmbigLeg:   ${result.unresolvedDuplicateGroups} / ${result.malformedRecords} / ${result.ambiguousLegacyCards}`);
  console.log(`Duration:                            ${result.durationMs} ms`);

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Wrote machine-readable validation report to ${outPath}`);
  }

  if (result.status !== 'PASS') {
    console.error('Validation errors:', result.errors);
    process.exit(1);
  }
}
