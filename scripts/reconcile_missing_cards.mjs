import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = process.cwd();
const backupDir = path.join(ROOT, 'backups', 'card_database_pre_recovery_20261124');
const dbPath = path.join(ROOT, 'battle_spirits.db');

const preDetailed = JSON.parse(fs.readFileSync(path.join(backupDir, 'pre_deletion_cards_detailed.json'), 'utf8'));
const preIndex = JSON.parse(fs.readFileSync(path.join(backupDir, 'pre_deletion_cards_index.json'), 'utf8'));
const curDetailed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));
const curIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_index.json'), 'utf8'));

const db = new DatabaseSync(dbPath);

console.log('=== FORENSIC DATABASE RECONCILIATION ===');
console.log(`Pre-deletion cards detailed count: ${Object.keys(preDetailed).length}`);
console.log(`Pre-deletion cards index count: ${Object.keys(preIndex).length}`);
console.log(`Current cards detailed count: ${Object.keys(curDetailed).length}`);
console.log(`Current cards index count: ${Object.keys(curIndex).length}`);

const sqliteCardsCount = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
const sqliteCardsV2Count = db.prepare('SELECT COUNT(*) as c FROM cards_v2').get().c;
console.log(`Current SQLite cards count: ${sqliteCardsCount}`);
console.log(`Current SQLite cards_v2 count: ${sqliteCardsV2Count}`);

// Find all missing keys from current detailed
const missingInCurDetailed = Object.keys(preDetailed).filter(k => !curDetailed[k]);
console.log(`Missing in curDetailed: ${missingInCurDetailed.length}`);

// Find all missing keys from current index
const missingInCurIndex = Object.keys(preIndex).filter(k => !curIndex[k]);
console.log(`Missing in curIndex: ${missingInCurIndex.length}`);

// Find all missing from SQLite cards
const sqliteCardsNumbers = new Set(db.prepare('SELECT card_number FROM cards').all().map(r => r.card_number));
const missingInSqliteCards = Object.keys(preDetailed).filter(k => !sqliteCardsNumbers.has(k));
console.log(`Missing in SQLite cards: ${missingInSqliteCards.length}`);

// Check which of these missing cards are present in cards_v2
const sqliteV2Numbers = new Set(db.prepare('SELECT card_number FROM cards_v2').all().map(r => r.card_number));
const presentInV2 = missingInCurDetailed.filter(k => sqliteV2Numbers.has(k));
console.log(`Of ${missingInCurDetailed.length} missing in curDetailed, present in cards_v2: ${presentInV2.length}`);

// Check IR shards for missing cards
let presentInShards = 0;
const shardAvailability = {};
for (const k of missingInCurDetailed) {
  const setPrefix = k.split('-')[0];
  const shardPath = path.join(ROOT, 'data', 'ir_shards', `${setPrefix}.json`);
  if (fs.existsSync(shardPath)) {
    try {
      const shard = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
      if (shard[k]) {
        presentInShards++;
        shardAvailability[k] = true;
      } else {
        shardAvailability[k] = false;
      }
    } catch (e) {
      shardAvailability[k] = false;
    }
  } else {
    shardAvailability[k] = false;
  }
}
console.log(`Of ${missingInCurDetailed.length} missing in curDetailed, present in data/ir_shards: ${presentInShards}`);

// Group missing cards by set code
const bySet = {};
for (const k of missingInCurDetailed) {
  const card = preDetailed[k];
  const sets = card.sets && card.sets.length > 0 ? card.sets : [k.split('-')[0]];
  const primarySet = sets[0];
  bySet[primarySet] = (bySet[primarySet] || 0) + 1;
}
console.log('Missing cards by primary set:', bySet);

// Analyze BS-77 specifically
const bs77Expected = Object.keys(preDetailed).filter(k => k.startsWith('BS77'));
const bs77Cur = Object.keys(curDetailed).filter(k => k.startsWith('BS77'));
console.log(`BS-77 expected: ${bs77Expected.length}, currently in curDetailed: ${bs77Cur.length}`);

// Output summary
fs.writeFileSync(path.join(ROOT, 'reports', 'card_database_recovery', 'missing_keys.json'), JSON.stringify(missingInCurDetailed, null, 2));
console.log('Saved missing_keys.json');
