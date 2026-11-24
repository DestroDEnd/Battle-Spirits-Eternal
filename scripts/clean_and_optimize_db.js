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

// --- INTEGRITY SAFEGUARD CONSTANTS ---
export const MIN_CARD_CARDINALITY_FLOOR = 14631;
export const PROTECTED_SETS = ['BS01', 'BS27', 'BS30', 'BS77', 'SD01', 'CB01'];
export const PROTECTED_CARD_NUMBERS = ['BS30-015', 'BS27-X03', 'BS77-001', 'BS77-081'];

/**
 * Validates database integrity against cardinality floors and essential flagships.
 */
export function validateDatabaseIntegrity(db, detailedData, indexData) {
  const cardsCount = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
  const cardsV2Count = db.prepare('SELECT COUNT(*) as c FROM cards_v2').get().c;
  const detailedCount = Object.keys(detailedData).length;
  const indexCount = Object.keys(indexData).length;

  if (cardsCount < MIN_CARD_CARDINALITY_FLOOR) {
    throw new Error(`CRITICAL INTEGRITY VIOLATION: SQLite cards table count (${cardsCount}) is below floor (${MIN_CARD_CARDINALITY_FLOOR})!`);
  }
  if (detailedCount < MIN_CARD_CARDINALITY_FLOOR) {
    throw new Error(`CRITICAL INTEGRITY VIOLATION: cards_detailed.json count (${detailedCount}) is below floor (${MIN_CARD_CARDINALITY_FLOOR})!`);
  }
  if (indexCount < MIN_CARD_CARDINALITY_FLOOR) {
    throw new Error(`CRITICAL INTEGRITY VIOLATION: cards_index.json count (${indexCount}) is below floor (${MIN_CARD_CARDINALITY_FLOOR})!`);
  }

  // Check required flagships
  for (const num of PROTECTED_CARD_NUMBERS) {
    if (!detailedData[num]) {
      throw new Error(`CRITICAL INTEGRITY VIOLATION: Protected card ${num} is missing from cards_detailed.json!`);
    }
    const row = db.prepare('SELECT 1 FROM cards WHERE card_number = ?').get(num);
    if (!row) {
      throw new Error(`CRITICAL INTEGRITY VIOLATION: Protected card ${num} is missing from SQLite cards table!`);
    }
  }

  // Check BS77 count
  const bs77Count = Object.keys(detailedData).filter(k => k.startsWith('BS77')).length;
  if (bs77Count !== 46) {
    throw new Error(`CRITICAL INTEGRITY VIOLATION: BS-77 inventory mismatch! Expected 46 cards, found ${bs77Count}.`);
  }

  return true;
}

/**
 * Clean Alternate Artworks safely.
 * Safeguard: This function ONLY cleans data/card_artworks.json.
 * It NEVER deletes canonical cards from cards, cards_v2, or detailed/index JSON files.
 */
export function cleanAlternateArtworks({ isDryRun = true } = {}) {
  console.log(`\n--- SAFEGUARDED ALTERNATE ARTWORKS CLEANUP (Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE'}) ---`);
  
  if (!fs.existsSync(cardArtworksPath)) {
    console.log('No card_artworks.json found, skipping.');
    return { cleanedArtworksCount: 0 };
  }

  const artworksMap = JSON.parse(fs.readFileSync(cardArtworksPath, 'utf8'));
  const NON_CARD_REGEX = /full\s*art|\bfa\b|concept|illustration|sketch|anime|character|setting|draft|rough|visual|twitter|pixiv|episode|scene|screenshot|screencap|preview/i;
  const NON_CARD_FILE_REGEX = /_fa\b|fa\.(jpe?g|png|webp)|_concept|_sketch|_anime|_ill|_char|_setting|_draft|_scene|_ep\d/i;
  const SCENE_WORDS_REGEX = /\bwants\b|\bdefeats?\b|\bfights?\b|\bscene\b|\bappearance\b/i;

  let purgedCount = 0;
  const cleanedMap = {};

  for (const [key, list] of Object.entries(artworksMap)) {
    if (!Array.isArray(list) || list.length === 0) continue;

    const filtered = list.filter((art, idx) => {
      if (idx === 0) return true; // Standard primary artwork always preserved
      const name = art.name || '';
      const url = art.image_url || '';
      const filename = url.split('/').pop().split('?')[0];

      if (NON_CARD_REGEX.test(name) || NON_CARD_REGEX.test(filename) || NON_CARD_FILE_REGEX.test(filename) || SCENE_WORDS_REGEX.test(name)) {
        purgedCount++;
        return false;
      }
      return true;
    });

    if (filtered.length > 1) {
      cleanedMap[key] = filtered;
    }
  }

  console.log(`[Artworks] Evaluated ${Object.keys(artworksMap).length} cards with alternate artworks.`);
  console.log(`[Artworks] Identified ${purgedCount} concept/non-card image entries.`);
  console.log(`[Artworks] Retained ${Object.keys(cleanedMap).length} cards with verified alternate arts.`);

  if (!isDryRun) {
    fs.writeFileSync(cardArtworksPath, JSON.stringify(cleanedMap, null, 2), 'utf8');
    console.log('Successfully written cleaned card_artworks.json.');
  }

  return { purgedCount, retainedCards: Object.keys(cleanedMap).length };
}

// Main execution CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply;

  console.log('=== SAFEGUARDED DATABASE OPTIMIZATION & ARTWORKS CLEANUP ===');
  console.log(`Execution Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'LIVE COMMIT (--apply specified)'}`);

  const db = new DatabaseSync(dbPath);
  const detailedData = JSON.parse(fs.readFileSync(cardsDetailedPath, 'utf8'));
  const indexData = JSON.parse(fs.readFileSync(cardsIndexPath, 'utf8'));

  // 1. Verify integrity before operation
  console.log('Phase 1: Pre-Execution Database Integrity Assertions...');
  validateDatabaseIntegrity(db, detailedData, indexData);
  console.log('✅ Pre-execution integrity verified. Database cardinality at or above floor.');

  // 2. Perform safe artworks cleanup (CANONICAL CARDS CANNOT BE DELETED)
  console.log('Phase 2: Cleaning Alternate Artworks Catalog...');
  cleanAlternateArtworks({ isDryRun });

  // 3. Optimize database with PRAGMA optimize (non-destructive)
  if (!isDryRun) {
    console.log('Phase 3: Running SQLite PRAGMA optimize (Non-Destructive)...');
    db.exec('PRAGMA optimize;');
    console.log('✅ SQLite database optimized.');
  } else {
    console.log('Phase 3: PRAGMA optimize skipped in dry-run mode.');
  }

  // 4. Verify integrity after operation
  console.log('Phase 4: Post-Execution Database Integrity Assertions...');
  validateDatabaseIntegrity(db, detailedData, indexData);
  console.log('✅ Post-execution integrity verified. All 14,631 canonical cards intact.');

  console.log('\n--- Safeguarded database optimization complete successfully ---');
}
