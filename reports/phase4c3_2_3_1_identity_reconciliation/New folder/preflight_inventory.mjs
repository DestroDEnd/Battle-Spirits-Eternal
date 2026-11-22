import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SHARDS_DIR = path.join(ROOT, 'data', 'ir_shards');
const OUT_DIR = path.join(ROOT, 'reports', 'phase4c3_2_3_full_identity_compilation');

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

console.log('Running Preflight Inventory on data/ir_shards...');

const files = fs.readdirSync(SHARDS_DIR).filter(f => f.endsWith('.json')).sort();
console.log(`Discovered ${files.length} shard files.`);

const shardRecords = [];
const preManifest = {};
let grandTotalCards = 0;
let grandTotalAbilities = 0;
let grandTotalConditions = 0;
let grandTotalKeywords = 0;
let malformedRecords = 0;
const uniqueCardNumbers = new Set();

const csvRows = [
  'shard_file,sha256,card_count,ability_count,condition_count,keyword_count,has_legacy_ids,has_physical_ids,has_semantic_ids,malformed_count'
];

for (const file of files) {
  const filePath = path.join(SHARDS_DIR, file);
  const hash = sha256File(filePath);
  preManifest[file] = {
    file,
    sha256: hash
  };

  let data;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    malformedRecords++;
    console.error(`Malformed JSON in ${file}:`, err.message);
    continue;
  }

  const cards = Object.entries(data);
  let shardCards = 0;
  let shardAbilities = 0;
  let shardConditions = 0;
  let shardKeywords = 0;
  let shardLegacyIds = 0;
  let shardPhysicalIds = 0;
  let shardSemanticIds = 0;
  let shardMalformed = 0;

  for (const [cNum, card] of cards) {
    shardCards++;
    uniqueCardNumbers.add(cNum);
    if (!card || typeof card !== 'object') {
      shardMalformed++;
      malformedRecords++;
      continue;
    }

    if (Array.isArray(card.keywords)) {
      shardKeywords += card.keywords.length;
    }

    if (Array.isArray(card.abilities)) {
      for (const ab of card.abilities) {
        shardAbilities++;
        if (ab.type === 'CONDITION' || ab.rawText) {
          shardConditions++;
        }
        if (ab.id) shardLegacyIds++;
        if (ab.physicalId) shardPhysicalIds++;
        if (ab.semanticId) shardSemanticIds++;
      }
    }
  }

  grandTotalCards += shardCards;
  grandTotalAbilities += shardAbilities;
  grandTotalConditions += shardConditions;
  grandTotalKeywords += shardKeywords;

  preManifest[file].cards = shardCards;
  preManifest[file].abilities = shardAbilities;
  preManifest[file].conditions = shardConditions;
  preManifest[file].keywords = shardKeywords;
  preManifest[file].hasLegacyIds = shardLegacyIds === shardAbilities;
  preManifest[file].hasPhysicalIds = shardPhysicalIds > 0;
  preManifest[file].hasSemanticIds = shardSemanticIds > 0;
  preManifest[file].malformedCount = shardMalformed;

  csvRows.push([
    file,
    hash,
    shardCards,
    shardAbilities,
    shardConditions,
    shardKeywords,
    shardLegacyIds > 0,
    shardPhysicalIds > 0,
    shardSemanticIds > 0,
    shardMalformed
  ].join(','));
}

fs.writeFileSync(path.join(OUT_DIR, 'pre_compilation_manifest.json'), JSON.stringify(preManifest, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'pre_compilation_inventory.csv'), csvRows.join('\n'), 'utf8');

const summary = {
  totalShardsDiscovered: files.length,
  totalCardEntries: grandTotalCards,
  uniqueCardNumbers: uniqueCardNumbers.size,
  totalAbilities: grandTotalAbilities,
  totalConditions: grandTotalConditions,
  totalKeywords: grandTotalKeywords,
  totalMalformedRecords: malformedRecords
};

fs.writeFileSync(path.join(OUT_DIR, 'preflight_summary.json'), JSON.stringify(summary, null, 2), 'utf8');

console.log('Preflight Inventory Complete:');
console.log(JSON.stringify(summary, null, 2));
