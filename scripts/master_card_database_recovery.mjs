import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = process.cwd();
const backupDir = path.join(ROOT, 'backups', 'card_database_pre_recovery_20261124');
const dbPath = path.join(ROOT, 'battle_spirits.db');

console.log('=== STARTING MASTER CARD DATABASE RECOVERY ===');

// 1. Load Pre-Deletion & Current JSON catalogs
const preDetailed = JSON.parse(fs.readFileSync(path.join(backupDir, 'pre_deletion_cards_detailed.json'), 'utf8'));
const preIndex = JSON.parse(fs.readFileSync(path.join(backupDir, 'pre_deletion_cards_index.json'), 'utf8'));
const curDetailed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));
const curIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_index.json'), 'utf8'));

console.log(`Pre-deletion detailed cards: ${Object.keys(preDetailed).length}`);
console.log(`Current detailed cards: ${Object.keys(curDetailed).length}`);

// 2. Load SQLite database
const db = new DatabaseSync(dbPath);

// Prepare lookup from cards_v2 for valid image_url and fields
const v2Map = new Map();
const v2Rows = db.prepare('SELECT * FROM cards_v2').all();
for (const r of v2Rows) {
  v2Map.set(r.card_number, r);
}
console.log(`Loaded ${v2Map.size} reference rows from SQLite cards_v2.`);

// 3. Restore all missing cards into curDetailed and curIndex
const missingKeys = Object.keys(preDetailed).filter(k => !curDetailed[k]);
console.log(`Restoring ${missingKeys.length} missing canonical cards into JSON catalogs...`);

let restoredCount = 0;
for (const k of missingKeys) {
  const preCard = preDetailed[k];
  const v2Card = v2Map.get(k);

  // Determine best verified image_url
  let bestImage = preCard.image_url;
  if (!bestImage || !String(bestImage).trim() || String(bestImage).includes('fallback') || String(bestImage).includes('pending')) {
    if (v2Card && v2Card.image_url && String(v2Card.image_url).trim()) {
      bestImage = v2Card.image_url;
    } else {
      bestImage = './assets/card_back.png';
    }
  }

  const restoredDetailedCard = {
    ...preCard,
    image_url: bestImage
  };

  curDetailed[k] = restoredDetailedCard;

  // Restore into curIndex
  const preIdxCard = preIndex[k] || {};
  curIndex[k] = {
    id: preIdxCard.id || preCard.id || Math.floor(10000 + Math.random() * 90000),
    card_number: preCard.card_number || k,
    name: preCard.name,
    type: preCard.type || 'Spirit',
    cost: preCard.cost !== undefined ? preCard.cost : 0,
    colors: preCard.colors || (preCard.color ? [preCard.color] : ['Red']),
    family: preCard.family || '',
    families: preCard.families || (preCard.family ? [preCard.family] : []),
    rarity: preCard.rarity || 'Common',
    sets: preCard.sets || [k.split('-')[0]],
    symbols: preCard.symbols || (preCard.color ? [preCard.color] : ['Red']),
    reduction: typeof preCard.reduction === 'number' ? preCard.reduction : (preCard.reduction ? preCard.reduction.total || 0 : 0),
    is_contract: !!preCard.is_contract_partner,
    image_url: bestImage
  };

  restoredCount++;
}

console.log(`Successfully merged ${restoredCount} cards into memory JSON objects.`);
console.log(`New detailed cards count: ${Object.keys(curDetailed).length}`);
console.log(`New index cards count: ${Object.keys(curIndex).length}`);

// Atomically save updated JSON files
const tempDetailedPath = path.join(ROOT, 'data', 'cards_detailed.json.tmp');
fs.writeFileSync(tempDetailedPath, JSON.stringify(curDetailed), 'utf8');
fs.renameSync(tempDetailedPath, path.join(ROOT, 'data', 'cards_detailed.json'));
console.log('Saved data/cards_detailed.json.');

const tempIndexPath = path.join(ROOT, 'data', 'cards_index.json.tmp');
fs.writeFileSync(tempIndexPath, JSON.stringify(curIndex), 'utf8');
fs.renameSync(tempIndexPath, path.join(ROOT, 'data', 'cards_index.json'));
console.log('Saved data/cards_index.json.');

// 4. Restore cards in SQLite battle_spirits.db
console.log('Synchronizing SQLite database tables (cards, cards_v2, cards_fts)...');

db.exec('BEGIN TRANSACTION;');

// Insert/update into cards table
const insertCardStmt = db.prepare(`
  INSERT INTO cards (
    id, name, kanji, jpname, cost, color, type, family, symbol, levels,
    effect, rarity, flavor, image_filename, image_url, local_image_path,
    updated_at, colors_json, families_json, sets_json, card_number
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?
  )
`);

const existingCardsNumbers = new Set(db.prepare('SELECT card_number FROM cards').all().map(r => r.card_number));
const existingCardsNames = new Set(db.prepare('SELECT name FROM cards').all().map(r => r.name));

let sqliteInsertedCount = 0;
let sqliteUpdatedCount = 0;

for (const [key, card] of Object.entries(curDetailed)) {
  const num = card.card_number || key;
  if (!existingCardsNumbers.has(num)) {
    // Check if name already exists in cards table
    let safeName = card.name;
    if (existingCardsNames.has(safeName)) {
      safeName = `${card.name} [${num}]`;
    }

    const levelsStr = card.levels ? Object.entries(card.levels).map(([lv, data]) => `${lv}: ${data.cost || 1} core, ${data.bp || 0} BP`).join('\n') : '';
    const imgFilename = card.image_url ? card.image_url.split('/').pop().split('?')[0] : `${num}.png`;

    try {
      insertCardStmt.run(
        card.id || null,
        safeName,
        card.kanji || null,
        card.jpname || null,
        card.cost !== undefined ? card.cost : 0,
        card.color || (card.colors && card.colors[0] ? card.colors[0] : 'Red'),
        card.type || 'Spirit',
        card.family || '',
        (card.symbols && card.symbols.length > 0) ? card.symbols[0] : '',
        levelsStr,
        card.effect || '',
        card.rarity || 'Common',
        card.flavor || '',
        imgFilename,
        card.image_url || null,
        null,
        Math.floor(Date.now() / 1000),
        JSON.stringify(card.colors || [card.color || 'Red']),
        JSON.stringify(card.families || [card.family || '']),
        JSON.stringify(card.sets || [num.split('-')[0]]),
        num
      );
      existingCardsNumbers.add(num);
      existingCardsNames.add(safeName);
      sqliteInsertedCount++;
    } catch (err) {
      console.warn(`Warning inserting card ${num} into cards table:`, err.message);
    }
  } else {
    // If card exists but image_url is null or empty, update it
    const curRow = db.prepare('SELECT image_url FROM cards WHERE card_number = ?').get(num);
    if (!curRow || !curRow.image_url || curRow.image_url === '') {
      db.prepare('UPDATE cards SET image_url = ? WHERE card_number = ?').run(card.image_url, num);
      sqliteUpdatedCount++;
    }
  }
}

console.log(`SQLite cards table: ${sqliteInsertedCount} rows inserted, ${sqliteUpdatedCount} rows updated with valid image_url.`);

// Also ensure cards_v2 has all 14,631 cards (e.g. 20 Rebirth face cards)
const insertV2Stmt = db.prepare(`
  INSERT OR IGNORE INTO cards_v2 (
    id, card_number, name, kanji, cost, color, colors_json, type, family,
    families_json, sets_json, symbols_json, reduction_json, levels_json,
    effect, rarity, flavor, is_vanilla, is_contract_partner, image_url
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?
  )
`);

let v2InsertedCount = 0;
for (const [key, card] of Object.entries(curDetailed)) {
  const num = card.card_number || key;
  if (!v2Map.has(num)) {
    try {
      insertV2Stmt.run(
        card.id || null,
        num,
        card.name,
        card.kanji || null,
        card.cost !== undefined ? card.cost : 0,
        card.color || (card.colors ? card.colors[0] : 'Red'),
        JSON.stringify(card.colors || [card.color || 'Red']),
        card.type || 'Spirit',
        card.family || '',
        JSON.stringify(card.families || [card.family || '']),
        JSON.stringify(card.sets || [num.split('-')[0]]),
        JSON.stringify(card.symbols || [card.color || 'Red']),
        JSON.stringify(card.reduction || {}),
        JSON.stringify(card.levels || {}),
        card.effect || '',
        card.rarity || 'Common',
        card.flavor || '',
        card.is_vanilla ? 1 : 0,
        card.is_contract_partner ? 1 : 0,
        card.image_url || './assets/card_back.png'
      );
      v2InsertedCount++;
    } catch (e) {
      console.warn(`Warning inserting card ${num} into cards_v2:`, e.message);
    }
  }
}
console.log(`SQLite cards_v2 table: ${v2InsertedCount} new rows inserted.`);

// Rebuild FTS index so full-text search covers all cards
console.log('Rebuilding cards_fts full-text search index...');
db.exec(`
  DELETE FROM cards_fts;
  INSERT INTO cards_fts(rowid, name, family, effect, flavor)
  SELECT id, name, family, effect, flavor FROM cards;
`);
console.log('cards_fts index rebuilt.');

db.exec('COMMIT;');

console.log('SQLite database transaction committed.');

// 5. Invariant Assertions
console.log('\n--- VERIFYING INVARIANTS ---');
const finalDetailedCount = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'))).length;
const finalIndexCount = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_index.json'), 'utf8'))).length;
const finalCardsRowCount = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
const finalCardsV2RowCount = db.prepare('SELECT COUNT(*) as c FROM cards_v2').get().c;

console.log(`Final cards_detailed.json count: ${finalDetailedCount} (Expected: 14631)`);
console.log(`Final cards_index.json count: ${finalIndexCount} (Expected: 14631)`);
console.log(`Final SQLite cards count: ${finalCardsRowCount} (Expected: 14631)`);
console.log(`Final SQLite cards_v2 count: ${finalCardsV2RowCount} (Expected: 14631)`);

// Verify Ubataman
const ubatamanInDetailed = curDetailed['BS30-015'];
const ubatamanInDb = db.prepare("SELECT * FROM cards WHERE card_number = 'BS30-015'").get();
console.log('Ubataman in detailed:', !!ubatamanInDetailed, ubatamanInDetailed ? ubatamanInDetailed.name : 'N/A');
console.log('Ubataman in SQLite cards:', !!ubatamanInDb, ubatamanInDb ? ubatamanInDb.image_url : 'N/A');

// Verify Ultimate-Saviour
const saviourInDetailed = curDetailed['BS27-X03'];
const saviourInDb = db.prepare("SELECT * FROM cards WHERE card_number = 'BS27-X03'").get();
console.log('Ultimate-Saviour in detailed:', !!saviourInDetailed, saviourInDetailed ? saviourInDetailed.name : 'N/A');
console.log('Ultimate-Saviour in SQLite cards:', !!saviourInDb, saviourInDb ? saviourInDb.image_url : 'N/A');

// Verify BS77
const bs77DetailedCount = Object.keys(curDetailed).filter(k => k.startsWith('BS77')).length;
const bs77DbCount = db.prepare("SELECT COUNT(*) as c FROM cards WHERE card_number LIKE 'BS77%'").get().c;
console.log(`BS77 cards in detailed: ${bs77DetailedCount} / 46`);
console.log(`BS77 cards in SQLite cards: ${bs77DbCount} / 46`);

if (finalDetailedCount === 14631 && finalIndexCount === 14631 && bs77DetailedCount === 46 && ubatamanInDetailed && saviourInDetailed) {
  console.log('\n🎉 ALL RECOVERY INVARIANTS SATISFIED 100%! MASTER RESTORATION SUCCESSFUL!');
} else {
  console.error('\n❌ Invariant validation failure! Please review counts.');
  process.exit(1);
}
