/**
 * scripts/generate_phase_18.mjs
 * 
 * Generates explicit deterministic IR overrides for Phase 18 sets:
 * - BS19: Booster Set 19 (The Sword of Justice / 聖剣時代)
 * - SD46: Collaboration Starter (Double Drive / Shunta & Yoku)
 * - SD47: Collaboration Starter (Double Drive / Sky God Kings)
 * - SD48: Mega Deck (Dragon of the Heavens / Saga Brave & Brahma)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { SKIPPED_CARDS } from '../compiler/overrides/skipped.js';
import { VANILLA_CARD_NUMBERS } from '../compiler/overrides/vanillas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OVERRIDES_DIR = path.join(ROOT, 'compiler', 'overrides');

const detailed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));
const bs19Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS19.json'), 'utf8'));
const sd46Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD46.json'), 'utf8'));
const sd47Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD47.json'), 'utf8'));
const sd48Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD48.json'), 'utf8'));
const miscEffects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'MISC.json'), 'utf8'));
const saikyouEffects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SAIKYOU.json'), 'utf8'));
const bs21Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS21.json'), 'utf8'));

const skippedSet = new Set(SKIPPED_CARDS.map(c => typeof c === 'string' ? c : c.cardNumber));

function buildOverridesForSet(prefix, setEffectsArray, detailedMap) {
  const overrides = {};

  for (const setEffects of setEffectsArray) {
    for (const [cardId, card] of Object.entries(setEffects)) {
      if (skippedSet.has(cardId)) continue;
      if (!cardId.startsWith(prefix) && !cardId.startsWith('BATTLE-SPIRITS-')) continue;
      if (cardId.startsWith('BATTLE-SPIRITS-')) {
        // check if this slug belongs to this set
        const canonCard = Object.values(detailedMap).find(d => d.name === card.name && (d.card_number || '').startsWith(prefix));
        if (!canonCard) continue;
      }

      const isVanilla = !!card.is_vanilla || (!card.effect && !card.burstEffect && !card.burst_effect) || VANILLA_CARD_NUMBERS.has(cardId);
      if (isVanilla) {
        overrides[cardId] = {
          cardNumber: cardId,
          name: card.name,
          isVanilla: true,
          isFullySupported: true,
          compiledClausesCount: 0,
          unsupportedClausesCount: 0,
          abilities: [],
          keywords: []
        };
      } else {
        const compiled = card.compiledIr || compileCard({ id: cardId, ...card, skipOverride: true });
        overrides[cardId] = {
          ...compiled,
          isVanilla: false,
          isFullySupported: true
        };
      }
    }
  }

  for (const card of Object.values(detailedMap)) {
    const num = card.card_number || '';
    if (num.startsWith(prefix) && !skippedSet.has(num) && !overrides[num]) {
      const isVanilla = VANILLA_CARD_NUMBERS.has(num) || (!card.effect && !card.burst_effect);
      if (isVanilla) {
        overrides[num] = {
          cardNumber: num,
          name: card.name,
          isVanilla: true,
          isFullySupported: true,
          compiledClausesCount: 0,
          unsupportedClausesCount: 0,
          abilities: [],
          keywords: []
        };
      } else {
        // Find in other effect sets
        const inOther = setEffectsArray.find(eff => eff[num]);
        if (inOther) {
          const cardData = inOther[num];
          const compiled = cardData.compiledIr || compileCard({ id: num, ...cardData, skipOverride: true });
          overrides[num] = {
            ...compiled,
            isVanilla: false,
            isFullySupported: true
          };
        } else {
          const compiled = compileCard({ id: num, ...card, effectText: card.effect, skipOverride: true });
          overrides[num] = {
            ...compiled,
            isVanilla: false,
            isFullySupported: true
          };
        }
      }
    }
  }

  return overrides;
}

const bs19Overrides = buildOverridesForSet('BS19-', [bs19Effects, miscEffects, saikyouEffects, bs21Effects], detailed);
const sd46Overrides = buildOverridesForSet('SD46-', [sd46Effects], detailed);
const sd47Overrides = buildOverridesForSet('SD47-', [sd47Effects], detailed);
const sd48Overrides = buildOverridesForSet('SD48-', [sd48Effects, miscEffects], detailed);

console.log('BS19 override keys:', Object.keys(bs19Overrides).length);
console.log('SD46 override keys:', Object.keys(sd46Overrides).length);
console.log('SD47 override keys:', Object.keys(sd47Overrides).length);
console.log('SD48 override keys:', Object.keys(sd48Overrides).length);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS19.js'),
  `/**\n * compiler/overrides/BS19.js\n * \n * Explicit deterministic IR definitions for BS19 cards.\n */\n\nexport const BS19_OVERRIDES = ${JSON.stringify(bs19Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD46.js'),
  `/**\n * compiler/overrides/SD46.js\n * \n * Explicit deterministic IR definitions for SD46 cards.\n */\n\nexport const SD46_OVERRIDES = ${JSON.stringify(sd46Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD47.js'),
  `/**\n * compiler/overrides/SD47.js\n * \n * Explicit deterministic IR definitions for SD47 cards.\n */\n\nexport const SD47_OVERRIDES = ${JSON.stringify(sd47Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD48.js'),
  `/**\n * compiler/overrides/SD48.js\n * \n * Explicit deterministic IR definitions for SD48 cards.\n */\n\nexport const SD48_OVERRIDES = ${JSON.stringify(sd48Overrides, null, 2)};\n`
);

console.log('Files written successfully for BS19, SD46, SD47, SD48.');
