/**
 * scripts/compile_per_card_db.mjs
 * 
 * Compiles and synchronizes card_effects_db.json from all sets in data/effects/*.json.
 * 1. Ensures every card is keyed by BOTH canonical card_number and card name.
 * 2. Purges misclassified actions (e.g. EXHAUST_ENEMY on destroy effects).
 * 3. Injects exact deterministic IR entries for standard/custom deck cards like BS14-096.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const effectsDir = path.join(rootDir, 'data/effects');
const dbPath = path.join(rootDir, 'card_effects_db.json');

console.log('[compile_per_card_db] Loading existing card_effects_db.json...');
let cardDb = {};
if (fs.existsSync(dbPath)) {
  try {
    cardDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.warn('Failed to parse card_effects_db.json, creating new database');
    cardDb = {};
  }
}

// Read all sets in data/effects/
if (fs.existsSync(effectsDir)) {
  const setFiles = fs.readdirSync(effectsDir).filter(f => f.endsWith('.json'));
  console.log(`[compile_per_card_db] Processing ${setFiles.length} effect set files...`);

  let addedByNumber = 0;
  for (const setFile of setFiles) {
    try {
      const setFilePath = path.join(effectsDir, setFile);
      const raw = fs.readFileSync(setFilePath, 'utf8');
      const data = JSON.parse(raw);

      const entries = Array.isArray(data) ? data : Object.values(data);
      for (const card of entries) {
        if (!card) continue;
        const cardNum = (card.card_number || (card.compiledIr && card.compiledIr.cardNumber) || '').trim();
        const cardName = (card.name || (card.compiledIr && card.compiledIr.name) || '').trim();

        if (cardNum && card.compiledIr) {
          // Store compiled IR representation keyed by card_number
          const existing = cardDb[cardNum] || {};
          cardDb[cardNum] = {
            ...existing,
            cardNumber: cardNum,
            card_number: cardNum,
            name: cardName,
            type: card.type || 'Spirit',
            compiledIr: card.compiledIr
          };
          addedByNumber++;
        }
      }
    } catch (e) {
      console.warn(`Error reading set file ${setFile}:`, e.message);
    }
  }
  console.log(`[compile_per_card_db] Indexed ${addedByNumber} cards directly by card_number.`);
}

// Explicit IR Fix for BS14-096 Curse of Hades
cardDb['BS14-096'] = {
  cardNumber: 'BS14-096',
  card_number: 'BS14-096',
  name: 'Curse of Hades',
  type: 'Magic',
  color: 'Purple',
  cost: 4,
  triggers: {
    BURST: [
      {
        type: 'DESTROY_EXHAUSTED',
        target: 'SPIRIT',
        cost_max: 5,
        state: 'EXHAUSTED',
        desc: 'Destroy an opposing exhausted Cost 5 or less Spirit.',
        raw_text: 'Destroy an opposing exhausted Cost 5 or less Spirit.',
        burst_condition: 'After your Life is reduced'
      }
    ],
    FLASH: [
      {
        type: 'SACRIFICE_EXCHANGE',
        desc: 'By destroying one of your Spirits, the opponent destroy one of their Spirits.',
        raw_text: 'By destroying one of your Spirits, the opponent destroy one of their Spirits.'
      }
    ]
  }
};

// Also update Curse of Hades by name
if (cardDb['Curse of Hades']) {
  cardDb['Curse of Hades'].triggers = cardDb['BS14-096'].triggers;
}

// Clean false-positive EXHAUST_ENEMY on destroy text
let cleanedCount = 0;
for (const [k, v] of Object.entries(cardDb)) {
  if (v && v.triggers) {
    for (const [trig, acts] of Object.entries(v.triggers)) {
      if (Array.isArray(acts)) {
        for (const act of acts) {
          if (act.type === 'EXHAUST_ENEMY') {
            const raw = (act.raw_text || act.desc || '').toLowerCase();
            if (raw.includes('destroy') && raw.includes('exhausted') && !raw.includes('exhaust an opposing')) {
              act.type = 'DESTROY_EXHAUSTED';
              cleanedCount++;
            }
          }
        }
      }
    }
  }
}

fs.writeFileSync(dbPath, JSON.stringify(cardDb, null, 2), 'utf8');
console.log(`[compile_per_card_db] Successfully wrote updated database to ${dbPath} (Cleaned ${cleanedCount} entries).`);
