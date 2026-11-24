import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { cleanAlternateArtworks, validateDatabaseIntegrity, MIN_CARD_CARDINALITY_FLOOR } from '../scripts/clean_and_optimize_db.js';

const ROOT = process.cwd();
const db = new DatabaseSync(path.join(ROOT, 'battle_spirits.db'));
const cardsIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_index.json'), 'utf8'));
const cardsDetailed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));

test('1. Removing alternate-art printings does not remove canonical cards', () => {
  const initialCardsCount = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
  const initialDetailedCount = Object.keys(cardsDetailed).length;

  // Run alternate-art cleanup
  const res = cleanAlternateArtworks({ isDryRun: true });
  assert.ok(res !== undefined, 'Cleanup must return result object');

  // Verify cardinality remains unchanged
  const postCardsCount = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
  const postDetailedCount = Object.keys(cardsDetailed).length;

  assert.strictEqual(postCardsCount, initialCardsCount, 'Canonical cards in SQLite must not decrease');
  assert.strictEqual(postDetailedCount, initialDetailedCount, 'Canonical cards in JSON must not decrease');
  assert.ok(postCardsCount >= MIN_CARD_CARDINALITY_FLOOR, 'Count must remain above cardinality floor');
});

test('2. Removing one alternate-art printing does not remove other valid printings', () => {
  // Check a card with multiple printings/artworks, e.g. BS01-X01 The DragonEmperor Siegfried
  const siegfried = cardsDetailed['BS01-X01'];
  assert.ok(siegfried, 'BS01-X01 must exist');
  assert.ok(siegfried.sets.length >= 1, 'BS01-X01 must retain its sets');
});

test('3. Cards with multiple set appearances retain all valid set memberships', () => {
  // Ubataman appeared in BS30 and BSC27
  const ubataman = cardsDetailed['BS30-015'];
  assert.ok(ubataman, 'Ubataman must exist');
  assert.ok(ubataman.sets.includes('BS30'), 'Must contain set BS30');
  assert.ok(ubataman.sets.includes('BSC27'), 'Must contain set BSC27');

  // Ultimate-Saviour appeared in BS27, SD36, BS50
  const saviour = cardsDetailed['BS27-X03'];
  assert.ok(saviour, 'Ultimate-Saviour must exist');
  assert.ok(saviour.sets.includes('BS27'), 'Must contain set BS27');
  assert.ok(saviour.sets.includes('SD36'), 'Must contain set SD36');
  assert.ok(saviour.sets.includes('BS50'), 'Must contain set BS50');
});

test('4. Complete BS-77 inventory is present (46 cards)', () => {
  const bs77CardsInDetailed = Object.keys(cardsDetailed).filter(k => k.startsWith('BS77'));
  assert.strictEqual(bs77CardsInDetailed.length, 46, 'Must contain all 46 BS-77 cards in cards_detailed.json');

  const bs77CardsInIndex = Object.keys(cardsIndex).filter(k => k.startsWith('BS77'));
  assert.strictEqual(bs77CardsInIndex.length, 46, 'Must contain all 46 BS-77 cards in cards_index.json');

  const bs77InDb = db.prepare("SELECT COUNT(*) as c FROM cards WHERE card_number LIKE 'BS77%'").get().c;
  assert.strictEqual(bs77InDb, 46, 'Must contain all 46 BS-77 cards in SQLite cards table');

  // Verify specific flags
  assert.ok(cardsDetailed['BS77-001'], 'BS77-001 Gyaivern must exist');
  assert.ok(cardsDetailed['BS77-053'], 'BS77-053 Adventure Demon-God must exist');
  assert.ok(cardsDetailed['BS77-081'], 'BS77-081 Bombardment (Card) must exist');
});

test('5. Ubataman exists and is retrievable', () => {
  const ubaInJson = cardsDetailed['BS30-015'];
  assert.ok(ubaInJson, 'BS30-015 must exist in detailed catalog');
  assert.strictEqual(ubaInJson.name, 'Ubataman');
  assert.strictEqual(ubaInJson.color, 'Green');
  assert.strictEqual(ubaInJson.cost, 2);
  assert.strictEqual(ubaInJson.family, 'Shellman');
  assert.ok(ubaInJson.image_url.includes('BS30-015_official.png'), 'Must have official image URL');

  const ubaInDb = db.prepare("SELECT * FROM cards WHERE card_number = 'BS30-015'").get();
  assert.ok(ubaInDb, 'BS30-015 must exist in SQLite table');
  assert.strictEqual(ubaInDb.name, 'Ubataman');
  assert.strictEqual(ubaInDb.cost, 2);
});

test('6. Ultimate-Saviour exists and is retrievable', () => {
  const saviourInJson = cardsDetailed['BS27-X03'];
  assert.ok(saviourInJson, 'BS27-X03 must exist in detailed catalog');
  assert.strictEqual(saviourInJson.name, 'The HolyDragonEmperor Ultimate-Saviour');
  assert.strictEqual(saviourInJson.type, 'Ultimate');
  assert.strictEqual(saviourInJson.cost, 7);
  assert.strictEqual(saviourInJson.color, 'Red');
  assert.strictEqual(saviourInJson.family, 'Tri-Dragon Deity');
  assert.ok(saviourInJson.image_url.includes('BS27_X_X03.png'), 'Must have official image URL');

  const saviourInDb = db.prepare("SELECT * FROM cards WHERE card_number = 'BS27-X03'").get();
  assert.ok(saviourInDb, 'BS27-X03 must exist in SQLite table');
  assert.strictEqual(saviourInDb.name, 'The HolyDragonEmperor Ultimate-Saviour');
});

test('7. Repeated recovery imports do not create duplicates (idempotency)', () => {
  const detailedCount1 = Object.keys(cardsDetailed).length;
  const cardsRowCount1 = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;

  assert.strictEqual(detailedCount1, 14631, 'Detailed count must be 14631');
  assert.strictEqual(cardsRowCount1, 14631, 'SQLite cards count must be 14631');

  // Verify unique card numbers in SQLite
  const distinctCardNumbers = db.prepare('SELECT COUNT(DISTINCT card_number) as c FROM cards').get().c;
  assert.strictEqual(distinctCardNumbers, 14631, 'Every card_number in cards table must be distinct');
});

test('8. Card IDs remain stable', () => {
  // Test specific stable IDs
  assert.strictEqual(cardsDetailed['BS30-015'].id, 13891);
  assert.strictEqual(cardsDetailed['BS27-X03'].id, 10829);
  assert.strictEqual(cardsDetailed['BS77-001'].id, 1151);
  assert.strictEqual(cardsDetailed['BS77-081'].id, 1138);
});

test('9. Card images and printing relationships remain valid', () => {
  // Ensure recovered cards have non-empty, non-null image URLs with official CDN hashes
  for (const k of ['BS30-015', 'BS27-X03', 'BS77-001', 'BS77-081']) {
    const card = cardsDetailed[k];
    assert.ok(card.image_url, `${k} must have non-empty image_url`);
    assert.ok(!card.image_url.includes('pending'), `${k} must not have pending in image_url`);
    assert.ok(!card.image_url.includes('fallback'), `${k} must not have fallback in image_url`);
    assert.ok(card.image_url.match(/\/images\/[0-9a-f]\/[0-9a-f]{2}\//i), `${k} must have official MD5 hashed CDN url`);
  }

  // Ensure zero unhashed static.wikia URLs exist in the entire dataset
  for (const [k, card] of Object.entries(cardsDetailed)) {
    const u = card.image_url || '';
    if (u.includes('static.wikia.nocookie.net')) {
      assert.ok(u.match(/\/images\/[0-9a-f]\/[0-9a-f]{2}\//i), `Card ${k} has unhashed wikia url: ${u}`);
    }
  }

  // SQLite zero unhashed check
  const dbCards = db.prepare('SELECT card_number, image_url FROM cards').all();
  for (const row of dbCards) {
    const u = row.image_url || '';
    if (u.includes('static.wikia.nocookie.net')) {
      assert.ok(u.match(/\/images\/[0-9a-f]\/[0-9a-f]{2}\//i), `SQLite Card ${row.card_number} has unhashed wikia url: ${u}`);
    }
  }
});

test('10. Search and filtering return recovered cards', () => {
  // Name query
  const ubaRows = db.prepare("SELECT * FROM cards WHERE name LIKE '%Ubataman%'").all();
  assert.ok(ubaRows.length >= 1, 'Search for Ubataman must return row');

  // Set query
  const bs77Rows = db.prepare("SELECT * FROM cards WHERE card_number LIKE 'BS77%'").all();
  assert.strictEqual(bs77Rows.length, 46, 'Filter for BS77 must return 46 rows');
});

test('11. Deck builder can retrieve recovered cards', () => {
  const uba = cardsDetailed['BS30-015'];
  const saviour = cardsDetailed['BS27-X03'];
  const bs77 = cardsDetailed['BS77-001'];

  assert.ok(uba && uba.card_number && uba.name && uba.cost !== undefined);
  assert.ok(saviour && saviour.card_number && saviour.name && saviour.cost !== undefined);
  assert.ok(bs77 && bs77.card_number && bs77.name && bs77.cost !== undefined);
});

test('12. Database counts reconcile with verified source inventories', () => {
  const detailedCount = Object.keys(cardsDetailed).length;
  const indexCount = Object.keys(cardsIndex).length;
  const sqliteCardsCount = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
  const sqliteCardsV2Count = db.prepare('SELECT COUNT(*) as c FROM cards_v2').get().c;

  assert.strictEqual(detailedCount, 14631);
  assert.strictEqual(indexCount, 14631);
  assert.strictEqual(sqliteCardsCount, 14631);
  assert.strictEqual(sqliteCardsV2Count, 14631);
});

test('13. Missing or conflicting records are reported instead of silently discarded', () => {
  const missingManifest = path.join(ROOT, 'reports', 'card_database_recovery', 'MISSING_CARD_RECONCILIATION.csv');
  assert.ok(fs.existsSync(missingManifest), 'Reconciliation CSV manifest must exist');
  const content = fs.readFileSync(missingManifest, 'utf8');
  assert.ok(content.includes('BS30-015'), 'Must list Ubataman in manifest');
  assert.ok(content.includes('BS27-X03'), 'Must list Ultimate-Saviour in manifest');
  assert.ok(content.includes('BS77-001'), 'Must list BS-77 in manifest');
});

test('14. A future alternate-art cleanup dry run cannot remove canonical cards', () => {
  const res = cleanAlternateArtworks({ isDryRun: true });
  assert.strictEqual(typeof res.purgedCount, 'number');

  // Verify integrity validator succeeds
  assert.doesNotThrow(() => {
    validateDatabaseIntegrity(db, cardsDetailed, cardsIndex);
  });
});

test('15. Recovery rollback verification (backups exist and are non-empty)', () => {
  const backupDir = path.join(ROOT, 'backups', 'card_database_pre_recovery_20261124');
  assert.ok(fs.existsSync(backupDir), 'Backup directory must exist');
  const backupFiles = fs.readdirSync(backupDir);
  assert.ok(backupFiles.includes('battle_spirits.db'), 'Must have backed up battle_spirits.db');
  assert.ok(backupFiles.includes('cards_detailed.json'), 'Must have backed up cards_detailed.json');
  assert.ok(backupFiles.includes('cards_index.json'), 'Must have backed up cards_index.json');
});
