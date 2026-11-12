import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const dbPath = path.join(ROOT, 'battle_spirits.db');
const cardsIndexPath = path.join(ROOT, 'data', 'cards_index.json');
const cardsDetailedPath = path.join(ROOT, 'data', 'cards_detailed.json');
const cardArtworksPath = path.join(ROOT, 'data', 'card_artworks.json');

console.log('--- Step 1: Purge cards without artwork from battle_spirits.db ---');
const db = new DatabaseSync(dbPath);

const cardsToDelete = db.prepare(`
  SELECT card_number, name FROM cards
  WHERE image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE '%fallback%' OR image_url LIKE '%pending%'
`).all();

console.log(`Found ${cardsToDelete.length} cards without artwork in battle_spirits.db.`);

const deletedNumbers = new Set(cardsToDelete.map(c => c.card_number));
const deletedNames = new Set(cardsToDelete.map(c => (c.name || '').toLowerCase().trim()));

const deleteStmt = db.prepare(`
  DELETE FROM cards
  WHERE image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE '%fallback%' OR image_url LIKE '%pending%'
`);
const result = deleteStmt.run();
console.log(`Deleted rows from cards: ${result.changes}`);

console.log('Optimizing SQLite database (VACUUM & ANALYZE)...');
db.exec('PRAGMA optimize;');
db.exec('VACUUM;');
db.exec('ANALYZE;');
console.log('SQLite database optimized.');

console.log('--- Step 2: Purge cards without artwork from cards_index.json & cards_detailed.json ---');
if (fs.existsSync(cardsIndexPath)) {
  const indexData = JSON.parse(fs.readFileSync(cardsIndexPath, 'utf8'));
  let indexRemoved = 0;
  for (const [key, card] of Object.entries(indexData)) {
    const num = card.card_number || key;
    const name = (card.name || '').toLowerCase().trim();
    const noArt = !card.image_url || !String(card.image_url).trim();
    if (deletedNumbers.has(num) || deletedNames.has(name) || noArt) {
      delete indexData[key];
      indexRemoved++;
    }
  }
  fs.writeFileSync(cardsIndexPath, JSON.stringify(indexData), 'utf8');
  console.log(`Removed ${indexRemoved} cards from cards_index.json. Remaining: ${Object.keys(indexData).length}`);
}

if (fs.existsSync(cardsDetailedPath)) {
  const detailedData = JSON.parse(fs.readFileSync(cardsDetailedPath, 'utf8'));
  let detailedRemoved = 0;
  for (const [key, card] of Object.entries(detailedData)) {
    const num = card.card_number || key;
    const name = (card.name || '').toLowerCase().trim();
    const noArt = !card.image_url || !String(card.image_url).trim();
    if (deletedNumbers.has(num) || deletedNames.has(name) || noArt) {
      delete detailedData[key];
      detailedRemoved++;
    }
  }
  fs.writeFileSync(cardsDetailedPath, JSON.stringify(detailedData), 'utf8');
  console.log(`Removed ${detailedRemoved} cards from cards_detailed.json. Remaining: ${Object.keys(detailedData).length}`);
}

console.log('--- Step 3: Purge Concept Art and Non-Cards from card_artworks.json ---');
if (fs.existsSync(cardArtworksPath)) {
  const artworksMap = JSON.parse(fs.readFileSync(cardArtworksPath, 'utf8'));
  const NON_CARD_REGEX = /full\s*art|\bfa\b|concept|illustration|sketch|anime|character|setting|draft|rough|visual|twitter|pixiv|episode|scene|screenshot|screencap|preview/i;
  const NON_CARD_FILE_REGEX = /_fa\b|fa\.(jpe?g|png|webp)|_concept|_sketch|_anime|_ill|_char|_setting|_draft|_scene|_ep\d/i;
  const SCENE_WORDS_REGEX = /\bwants\b|\bdefeats?\b|\bfights?\b|\bscene\b|\bappearance\b/i;

  let purgedArtworksCount = 0;
  let singleArtPurgedCount = 0;
  const cleanedMap = {};

  for (const [key, list] of Object.entries(artworksMap)) {
    if (!Array.isArray(list) || list.length === 0) continue;

    const filtered = list.filter((art, idx) => {
      if (idx === 0) return true; // Standard
      const name = art.name || '';
      const url = art.image_url || '';
      const filename = url.split('/').pop().split('?')[0];

      if (NON_CARD_REGEX.test(name) || NON_CARD_REGEX.test(filename) || NON_CARD_FILE_REGEX.test(filename) || SCENE_WORDS_REGEX.test(name)) {
        purgedArtworksCount++;
        return false;
      }
      return true;
    });

    if (filtered.length > 1) {
      cleanedMap[key] = filtered;
    } else {
      singleArtPurgedCount++;
    }
  }

  fs.writeFileSync(cardArtworksPath, JSON.stringify(cleanedMap, null, 2), 'utf8');
  console.log(`Purged ${purgedArtworksCount} concept/non-card artworks.`);
  console.log(`Removed ${singleArtPurgedCount} cards that only had 1 artwork left.`);
  console.log(`Remaining cards with verified alternate cards: ${Object.keys(cleanedMap).length}`);
}

console.log('--- Database cleanup and optimization complete ---');
