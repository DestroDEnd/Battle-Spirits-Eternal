import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assignDeterministicAbilityIdentities } from '../compiler/index.js';
import { globalCollisionRegistry } from '../compiler/identity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'ir_shards');
const STAGING_DIR = path.join(ROOT, 'data', 'ir_shards_staging');
const REPORT_DIR = path.join(ROOT, 'reports', 'phase4c3_2_3_full_identity_compilation');

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function compileAllShards(srcDir = SOURCE_DIR, targetDir = STAGING_DIR, clearRegistry = true) {
  if (clearRegistry) {
    globalCollisionRegistry.clear();
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json')).sort();
  console.log(`Starting compilation of ${files.length} shards from ${srcDir} to ${targetDir}...`);

  const metrics = {
    totalShards: files.length,
    totalCards: 0,
    uniqueCards: new Set(),
    totalAbilities: 0,
    totalConditions: 0,
    totalKeywords: 0,
    physicalIdsAssigned: 0,
    semanticIdsAssigned: 0,
    legacyIdsPreserved: 0,
    compilationErrors: 0,
    skippedRecords: 0,
    malformedRecords: 0,
    reprintRegistrations: 0,
    uniquePhysicalDescriptors: 0,
    startTime: Date.now(),
    fileManifest: {}
  };

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(targetDir, file);

    let raw;
    try {
      raw = fs.readFileSync(srcPath, 'utf8');
    } catch (err) {
      metrics.compilationErrors++;
      throw new Error(`Failed to read shard ${file}: ${err.message}`);
    }

    let shardData;
    try {
      shardData = JSON.parse(raw);
    } catch (err) {
      metrics.malformedRecords++;
      metrics.compilationErrors++;
      throw new Error(`Malformed JSON in shard ${file}: ${err.message}`);
    }

    const compiledShard = {};
    let shardAbilities = 0;
    let shardCards = 0;

    for (const [key, card] of Object.entries(shardData)) {
      metrics.totalCards++;
      shardCards++;
      const cNum = card.cardNumber || key;
      metrics.uniqueCards.add(cNum);

      if (!card || typeof card !== 'object') {
        metrics.malformedRecords++;
        compiledShard[key] = card;
        continue;
      }

      // Clone card for deterministic compilation
      const compiledCard = JSON.parse(JSON.stringify(card));
      compiledCard.cardNumber = cNum;

      if (Array.isArray(compiledCard.keywords)) {
        metrics.totalKeywords += compiledCard.keywords.length;
      }

      if (Array.isArray(compiledCard.abilities) && compiledCard.abilities.length > 0) {
        shardAbilities += compiledCard.abilities.length;
        metrics.totalAbilities += compiledCard.abilities.length;

        // Count conditions
        for (const ab of compiledCard.abilities) {
          if (ab.type === 'CONDITION' || ab.rawText) {
            metrics.totalConditions++;
          }
        }

        // Production identity derivation pipeline
        try {
          assignDeterministicAbilityIdentities(cNum, compiledCard.abilities);
        } catch (err) {
          metrics.compilationErrors++;
          console.error(`Compilation error on card ${cNum} in ${file}:`, err);
          throw err;
        }

        // Validate post-identity invariant
        for (let i = 0; i < compiledCard.abilities.length; i++) {
          const ab = compiledCard.abilities[i];
          if (!ab.physicalId) throw new Error(`Missing physicalId on ${cNum} ab ${i}`);
          if (!ab.semanticId) throw new Error(`Missing semanticId on ${cNum} ab ${i}`);
          if (!ab.legacyId) throw new Error(`Missing legacyId on ${cNum} ab ${i}`);
          if (ab.id !== ab.physicalId) throw new Error(`id does not match physicalId on ${cNum} ab ${i}`);

          metrics.physicalIdsAssigned++;
          metrics.semanticIdsAssigned++;
          metrics.legacyIdsPreserved++;
        }

        // Sync card-level keywords referencing previous legacy IDs
        if (Array.isArray(compiledCard.keywords)) {
          for (const kw of compiledCard.keywords) {
            if (kw.abilityId) {
              const matchedAb = compiledCard.abilities.find(a => a.legacyId === kw.abilityId || a.id === kw.abilityId);
              if (matchedAb) {
                kw.legacyAbilityId = kw.abilityId;
                kw.abilityId = matchedAb.physicalId;
              }
            }
          }
        }
      }

      compiledShard[key] = compiledCard;
    }

    // Write formatted deterministic JSON
    const outputContent = JSON.stringify(compiledShard, null, 2);
    const buf = Buffer.from(outputContent, 'utf8');
    fs.writeFileSync(destPath, buf);

    const hash = sha256Buffer(buf);
    metrics.fileManifest[file] = {
      file,
      sha256: hash,
      cardCount: shardCards,
      abilityCount: shardAbilities,
      byteSize: buf.length
    };
  }

  metrics.endTime = Date.now();
  metrics.durationMs = metrics.endTime - metrics.startTime;
  metrics.uniquePhysicalDescriptors = globalCollisionRegistry.size;

  return metrics;
}

// Self-run when executed directly
if (process.argv[1] && process.argv[1].endsWith('compile_514_shards.mjs')) {
  console.log('Compiling all 514 shards into data/ir_shards_staging...');
  const result = compileAllShards();

  console.log('\n--- Compilation Run 1 Complete ---');
  console.log(`Total Shards: ${result.totalShards}`);
  console.log(`Total Card Entries: ${result.totalCards}`);
  console.log(`Unique Canonical Cards: ${result.uniqueCards.size}`);
  console.log(`Total Abilities: ${result.totalAbilities}`);
  console.log(`Total Conditions: ${result.totalConditions}`);
  console.log(`Total Keywords: ${result.totalKeywords}`);
  console.log(`Physical IDs Assigned: ${result.physicalIdsAssigned}`);
  console.log(`Semantic IDs Assigned: ${result.semanticIdsAssigned}`);
  console.log(`Legacy IDs Preserved: ${result.legacyIdsPreserved}`);
  console.log(`Unique Physical Descriptors in Registry: ${result.uniquePhysicalDescriptors}`);
  console.log(`Compilation Errors: ${result.compilationErrors}`);
  console.log(`Skipped Records: ${result.skippedRecords}`);
  console.log(`Malformed Records: ${result.malformedRecords}`);
  console.log(`Duration: ${result.durationMs}ms`);

  // Repeatability verification: Compile again and verify exact SHA-256 match
  console.log('\nRunning Repeatability Verification (Run 2)...');
  const STAGING_DIR_2 = path.join(ROOT, 'data', 'ir_shards_staging_verify');
  const result2 = compileAllShards(SOURCE_DIR, STAGING_DIR_2, true);

  let repeatabilityMismatch = 0;
  for (const [file, info1] of Object.entries(result.fileManifest)) {
    const info2 = result2.fileManifest[file];
    if (!info2 || info1.sha256 !== info2.sha256) {
      repeatabilityMismatch++;
      console.error(`Repeatability mismatch on ${file}: Run 1=${info1.sha256}, Run 2=${info2?.sha256}`);
    }
  }

  // Cleanup temporary verify directory
  fs.rmSync(STAGING_DIR_2, { recursive: true, force: true });

  if (repeatabilityMismatch === 0) {
    console.log('Repeatability Verification PASSED: 100% of 514 shards produced byte-for-byte identical output.');
  } else {
    console.error(`Repeatability Verification FAILED: ${repeatabilityMismatch} files mismatched!`);
    process.exit(1);
  }

  // Write compilation metrics & manifest to reports dir
  const reportData = {
    totalShards: result.totalShards,
    totalCardEntries: result.totalCards,
    uniqueCanonicalCards: result.uniqueCards.size,
    totalAbilities: result.totalAbilities,
    totalConditions: result.totalConditions,
    totalKeywords: result.totalKeywords,
    physicalIdsAssigned: result.physicalIdsAssigned,
    semanticIdsAssigned: result.semanticIdsAssigned,
    legacyIdsPreserved: result.legacyIdsPreserved,
    uniquePhysicalDescriptors: result.uniquePhysicalDescriptors,
    compilationErrors: result.compilationErrors,
    skippedRecords: result.skippedRecords,
    malformedRecords: result.malformedRecords,
    durationMs: result.durationMs,
    repeatabilityPassed: repeatabilityMismatch === 0
  };

  fs.writeFileSync(
    path.join(REPORT_DIR, 'compilation_summary.json'),
    JSON.stringify(reportData, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    path.join(REPORT_DIR, 'compiled_shard_manifest.json'),
    JSON.stringify(result.fileManifest, null, 2),
    'utf8'
  );

  // Write post compilation inventory CSV
  const postCsv = [
    'shard_file,sha256,byte_size,card_count,ability_count'
  ];
  for (const [file, info] of Object.entries(result.fileManifest)) {
    postCsv.push(`${file},${info.sha256},${info.byteSize},${info.cardCount},${info.abilityCount}`);
  }
  fs.writeFileSync(
    path.join(REPORT_DIR, 'post_compilation_inventory.csv'),
    postCsv.join('\n'),
    'utf8'
  );

  console.log('Saved compilation artifacts in reports/phase4c3_2_3_full_identity_compilation/');
}
