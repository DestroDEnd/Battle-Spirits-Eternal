import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dbPath = path.join(rootDir, 'card_effects_db.json');
const shardsDir = path.join(rootDir, 'data', 'ir_shards');

console.log('Reading card_effects_db.json...');
const cardDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Syncing from data/ir_shards/...');
const shardFiles = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json'));

let updated = 0;
for (const file of shardFiles) {
  const shardPath = path.join(shardsDir, file);
  const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  for (const [cNum, ir] of Object.entries(shardData)) {
    if (!cNum || !ir) continue;
    if (cardDb[cNum]) {
      cardDb[cNum].compiledIr = ir;
      updated++;
    }
    const name = ir.name;
    if (name && cardDb[name]) {
      cardDb[name].compiledIr = ir;
    }
  }
}

console.log(`Updated ${updated} entries in card_effects_db.json. Writing to disk...`);
fs.writeFileSync(dbPath, JSON.stringify(cardDb, null, 2), 'utf8');
console.log('Done!');
