import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const SHARDS_DIR = path.join(ROOT_DIR, 'data', 'ir_shards');
const CARDS_FILE = path.join(ROOT_DIR, 'data', 'cards_detailed.json');
const INDEX_FILE = path.join(ROOT_DIR, 'data', 'cards_index.json');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports', 'playable_engine_phase_2_2');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function computeHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

console.log('Calculating baseline cryptographic hashes...');

const cardsHash = computeHash(CARDS_FILE);
const indexHash = computeHash(INDEX_FILE);
const shardFiles = fs.readdirSync(SHARDS_DIR).filter(f => f.endsWith('.json')).sort();

let totalShardCards = 0;
let totalAbilities = 0;
let totalClauses = 0;
const shardHashes = {};

for (const shardFile of shardFiles) {
  const filePath = path.join(SHARDS_DIR, shardFile);
  const hash = computeHash(filePath);
  shardHashes[shardFile] = hash;

  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  for (const card of Object.values(content)) {
    totalShardCards++;
    if (Array.isArray(card.abilities)) {
      totalAbilities += card.abilities.length;
      for (const ab of card.abilities) {
        if (Array.isArray(ab.clauses)) {
          totalClauses += ab.clauses.length;
        }
      }
    }
  }
}

// Canonical detailed cards
const detailedCards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
const detailedCardsCount = Array.isArray(detailedCards) ? detailedCards.length : Object.keys(detailedCards).length;

const integrityData = {
  timestamp: new Date().toISOString(),
  canonicalCards: {
    path: 'data/cards_detailed.json',
    count: detailedCardsCount,
    sha256: cardsHash
  },
  cardsIndex: {
    path: 'data/cards_index.json',
    sha256: indexHash
  },
  shards: {
    totalFiles: shardFiles.length,
    totalShardCards,
    totalAbilities,
    totalClauses,
    fileHashes: shardHashes
  }
};

fs.writeFileSync(path.join(REPORTS_DIR, 'integrity_verification.json'), JSON.stringify(integrityData, null, 2));

console.log(`Verified ${shardFiles.length} shards.`);
console.log(`Cards: ${totalShardCards}, Abilities: ${totalAbilities}, Clauses: ${totalClauses}`);
console.log('Integrity verification saved to reports/playable_engine_phase_2_2/integrity_verification.json');
