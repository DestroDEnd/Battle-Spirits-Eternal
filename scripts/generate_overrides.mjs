/**
 * scripts/generate_overrides.mjs
 * 
 * Generates explicit deterministic IR overrides for SD01-03, SD06, BS01-06 cards
 * strictly fulfilling Milestone 3 Objectives 2 & 4 and sequential phase expansions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OVERRIDES_DIR = path.join(ROOT, 'compiler', 'overrides');

if (!fs.existsSync(OVERRIDES_DIR)) {
  fs.mkdirSync(OVERRIDES_DIR, { recursive: true });
}

const detailed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));
const sd01Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD01.json'), 'utf8'));
const bs01Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS01.json'), 'utf8'));
const kerokeroEffects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'KEROKERO.json'), 'utf8'));
const bs02Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS02.json'), 'utf8'));
const sd02Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD02.json'), 'utf8'));
const bs03Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS03.json'), 'utf8'));
const sd03Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD03.json'), 'utf8'));
const bs04Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS04.json'), 'utf8'));
const bs05Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS05.json'), 'utf8'));
const bs06Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS06.json'), 'utf8'));
const sd06Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD06.json'), 'utf8'));
const bs07Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS07.json'), 'utf8'));
const sd10Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD10.json'), 'utf8'));
const sd11Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD11.json'), 'utf8'));
const bs08Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS08.json'), 'utf8'));
const sd13Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD13.json'), 'utf8'));
const sd14Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD14.json'), 'utf8'));
const bs09Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS09.json'), 'utf8'));
const sd15Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD15.json'), 'utf8'));
const sd16Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD16.json'), 'utf8'));
const bs10Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS10.json'), 'utf8'));
const sd17Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD17.json'), 'utf8'));
const bs11Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS11.json'), 'utf8'));
const sd19Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD19.json'), 'utf8'));
const sd20Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD20.json'), 'utf8'));
const bs12Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS12.json'), 'utf8'));
const sd22Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD22.json'), 'utf8'));
const sd23Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD23.json'), 'utf8'));
const bs13Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS13.json'), 'utf8'));
const sd21Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD21.json'), 'utf8'));
const sd24Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD24.json'), 'utf8'));
const sd25Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD25.json'), 'utf8'));
const bs14Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS14.json'), 'utf8'));
const sd26Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD26.json'), 'utf8'));
const sd27Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD27.json'), 'utf8'));
const sd28Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD28.json'), 'utf8'));
const bs15Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS15.json'), 'utf8'));
const sd29Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD29.json'), 'utf8'));
const sd30Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD30.json'), 'utf8'));
const sd31Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD31.json'), 'utf8'));
const sd32Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD32.json'), 'utf8'));
const sd33Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD33.json'), 'utf8'));
const bs16Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS16.json'), 'utf8'));
const sd34Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD34.json'), 'utf8'));
const sd37Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD37.json'), 'utf8'));
const sd38Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD38.json'), 'utf8'));
const sd39Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD39.json'), 'utf8'));
const bs17Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS17.json'), 'utf8'));
const sd40Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD40.json'), 'utf8'));
const sd41Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD41.json'), 'utf8'));
const sd42Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD42.json'), 'utf8'));
const bs18Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'BS18.json'), 'utf8'));
const sd43Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD43.json'), 'utf8'));
const sd44Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD44.json'), 'utf8'));
const sd45Effects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'effects', 'SD45.json'), 'utf8'));

// Skipped cards catalog per R2
export const SKIPPED_CARDS = [
  {
    cardNumber: 'SD01-029',
    name: 'The Wriggle Catacomb',
    type: 'Nexus',
    set: 'SD01',
    reason: 'Provenance tracking for core additions during opposing turn and re-entrant depletion cascading destructions during effect resolution.'
  },
  {
    cardNumber: 'SD01-031',
    name: 'The Cape in the Red Sky',
    type: 'Nexus',
    set: 'SD01',
    reason: 'Provenance tracking for hand additions during opposing turn and global trigger suppression ((When Summoned)/(When Destroyed)) timing contention.'
  },
  {
    cardNumber: 'SD01-032',
    name: 'The Protection of Sacred Artifacts',
    type: 'Nexus',
    set: 'SD01',
    reason: 'Forced attack legacy ambiguity regarding step declaration and target prioritization without compulsory attack step entry.'
  },
  {
    cardNumber: 'BATTLE-SPIRITS-A404',
    name: 'Armor Purge',
    type: 'Magic',
    set: 'SD01 (Synthetic)',
    reason: 'Synthetic non-canonical ID with malformed phase terminology ("Your Main Phrase") and undefined wildcard keyword ("Immunity: X").'
  },
  {
    cardNumber: 'BS01-006',
    name: 'Merat',
    type: 'Spirit',
    set: 'BS01',
    reason: 'Manual vs. effect causality distinction on core placement not supported in standard rules engine.'
  },
  {
    cardNumber: 'BS01-027',
    name: 'Will-Orb',
    type: 'Spirit',
    set: 'BS01',
    reason: 'Forced attack declaration priority and Attack Step compulsion ambiguity.'
  },
  {
    cardNumber: 'BS01-033',
    name: 'Disaster',
    type: 'Spirit',
    set: 'BS01',
    reason: 'Forced attack declaration priority and Attack Step compulsion ambiguity.'
  },
  {
    cardNumber: 'BS01-057',
    name: 'Gularva',
    type: 'Spirit',
    set: 'BS01',
    reason: 'Undefined source zone for "+1 core" replacement effect and precedence ambiguity.'
  },
  {
    cardNumber: 'BS01-059',
    name: 'Shidafukurou',
    type: 'Spirit',
    set: 'BS01',
    reason: 'Ambiguous pre-event timing hook ("would draw") and batch draw refresh multiplier ambiguity.'
  },
  {
    cardNumber: 'BS01-096',
    name: 'The AutoEmpress Sol',
    type: 'Spirit',
    set: 'BS01',
    reason: 'Legacy translation artifact with ambiguous branching ("skip the Attack Step. Or end it").'
  },
  {
    cardNumber: 'BS01-100',
    name: 'The Ruby Sun',
    type: 'Nexus',
    set: 'BS01',
    reason: 'Global provenance tracking of manual vs effect core movements across all White spirits.'
  },
  {
    cardNumber: 'BS01-105',
    name: 'The Shackles of Doom',
    type: 'Nexus',
    set: 'BS01',
    reason: 'Non-standard timing ("After attack declaration") and immediate self-depletion dispute.'
  },
  {
    cardNumber: 'BS02-078',
    name: 'The Evil Coffin',
    type: 'Nexus',
    set: 'BS02',
    reason: 'Opposing Main Step manual vs effect core movement causality distinction ("Unless via Spirit/Nexus/Magic effects") not supported in standard rules engine.'
  },
  {
    cardNumber: 'BS02-087',
    name: 'The Sealed Spellbook',
    type: 'Nexus',
    set: 'BS02',
    reason: 'Dynamic meta-redirection of Magic effects targeting both players ("either only you, or only the opponent") without player interaction protocol.'
  },
  {
    cardNumber: 'BS02-108',
    name: 'Magic Book',
    type: 'Magic',
    set: 'BS02',
    reason: 'Non-standard legacy "Removed Zone" destination without standardized exclusion timing and retrieval semantics.'
  },
  {
    cardNumber: 'BS02-109',
    name: 'Angel Voice',
    type: 'Magic',
    set: 'BS02',
    reason: 'Battle resolution modification replacing standard BP comparison with Level comparison.'
  },
  {
    cardNumber: 'BS03-016',
    name: 'The InvisibleMan Eclear',
    type: 'Spirit',
    set: 'BS03',
    reason: 'Non-standard legacy "Removed Zone" dependency without standardized modern exclusion tracking semantics.'
  },
  {
    cardNumber: 'BS06-054',
    name: 'The FortuneTeller Pentan',
    type: 'Spirit',
    set: 'BS06',
    reason: 'Non-standard legacy "Removed Zone" dependency without standardized modern exclusion tracking semantics.'
  },
  {
    cardNumber: 'BS06-086',
    name: 'The Opened Spellbook',
    type: 'Nexus',
    set: 'BS06',
    reason: 'Dynamic meta-redirection of Magic effects targeting both players to either player without interaction protocol.'
  },
  {
    cardNumber: 'BS06-110',
    name: 'Imagine Field',
    type: 'Magic',
    set: 'BS06',
    reason: 'Battle resolution modification replacing standard BP comparison with spirit core comparison.'
  },
  {
    cardNumber: 'BS09-X39',
    name: 'The MagicalEmpress Ambrocius',
    type: 'Spirit',
    set: 'BS09',
    reason: 'Non-standard legacy "Removed Zone" dependency without standardized modern exclusion tracking and cast-from-removed semantics.'
  },
  {
    cardNumber: 'BS11-X05',
    name: 'The MagicalTwinsDeity Geminize',
    type: 'Spirit',
    set: 'BS11',
    reason: 'Non-standard legacy "Removed Zone" dependency without standardized modern exclusion tracking and cast-from-removed semantics.'
  },
  {
    cardNumber: 'BS12-011',
    name: 'Mummybird',
    type: 'Spirit',
    set: 'BS12',
    reason: 'Non-standard legacy "Removed Zone" dependency without standardized modern exclusion tracking and discard-from-removed semantics.'
  },
  {
    cardNumber: 'SD27-001',
    name: 'Pixislizard',
    type: 'Spirit',
    set: 'SD27',
    reason: 'Non-standard legacy "Removed Zone" dependency affecting cost of Galaxian family cards in Removed Zone without standardized modern exclusion tracking.'
  },
  {
    cardNumber: 'SD27-002',
    name: 'Wyvern-Vela',
    type: 'Spirit',
    set: 'SD27',
    reason: 'Non-standard legacy "Removed Zone" dependency putting cards from Hand to Removed Zone to draw cards without standardized modern exclusion tracking.'
  }
];

const skippedSet = new Set(SKIPPED_CARDS.map(c => c.cardNumber));

function buildOverridesForSet(prefix, setEffectsArray, detailedMap) {
  const overrides = {};

  for (const setEffects of setEffectsArray) {
    for (const [cardId, card] of Object.entries(setEffects)) {
      if (skippedSet.has(cardId)) continue;
      const otherPrefixes = ['SD01-', 'BS01-', 'BS02-', 'SD02-', 'BS03-', 'SD03-', 'BS04-', 'BS05-', 'BS06-', 'SD06-', 'BS07-', 'SD10-', 'SD11-', 'BS08-', 'SD13-', 'SD14-', 'BS09-', 'SD15-', 'SD16-', 'BS10-', 'SD17-', 'BS11-', 'SD19-', 'SD20-', 'BS12-', 'SD22-', 'SD23-', 'BS13-', 'SD21-', 'SD24-', 'SD25-', 'BS14-', 'SD26-', 'SD27-', 'SD28-', 'BS15-', 'SD29-', 'SD30-', 'SD31-', 'SD32-', 'SD33-', 'BS16-', 'SD34-', 'SD37-', 'SD38-', 'SD39-', 'BS17-', 'SD40-', 'SD41-', 'SD42-', 'BS18-', 'SD43-', 'SD44-', 'SD45-'].filter(p => p !== prefix);
      if (otherPrefixes.some(p => cardId.startsWith(p))) continue;
      const isVanilla = !!card.is_vanilla || (!card.effect && !card.burstEffect);
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
      const isVanilla = !card.effect && !card.burst_effect;
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
        const compiled = compileCard({ ...card, skipOverride: true });
        overrides[num] = {
          ...compiled,
          isVanilla: false,
          isFullySupported: true
        };
      }
    }
  }

  return overrides;
}

// Build sets
const sd01Overrides = buildOverridesForSet('SD01-', [sd01Effects], detailed);
const bs01Overrides = buildOverridesForSet('BS01-', [bs01Effects, kerokeroEffects], detailed);
const bs02Overrides = buildOverridesForSet('BS02-', [bs02Effects], detailed);
const sd02Overrides = buildOverridesForSet('SD02-', [sd02Effects], detailed);
const bs03Overrides = buildOverridesForSet('BS03-', [bs03Effects, bs02Effects], detailed);
const sd03Overrides = buildOverridesForSet('SD03-', [sd03Effects], detailed);
const bs04Overrides = buildOverridesForSet('BS04-', [bs04Effects], detailed);
const bs05Overrides = buildOverridesForSet('BS05-', [bs05Effects], detailed);
const bs06Overrides = buildOverridesForSet('BS06-', [bs06Effects], detailed);
const sd06Overrides = buildOverridesForSet('SD06-', [sd06Effects], detailed);
const bs07Overrides = buildOverridesForSet('BS07-', [bs07Effects], detailed);
const sd10Overrides = buildOverridesForSet('SD10-', [sd10Effects], detailed);
const sd11Overrides = buildOverridesForSet('SD11-', [sd11Effects], detailed);
const bs08Overrides = buildOverridesForSet('BS08-', [bs08Effects], detailed);
const sd13Overrides = buildOverridesForSet('SD13-', [sd13Effects], detailed);
const sd14Overrides = buildOverridesForSet('SD14-', [sd14Effects], detailed);
const bs09Overrides = buildOverridesForSet('BS09-', [bs09Effects], detailed);
const sd15Overrides = buildOverridesForSet('SD15-', [sd15Effects], detailed);
const sd16Overrides = buildOverridesForSet('SD16-', [sd16Effects], detailed);
const bs10Overrides = buildOverridesForSet('BS10-', [bs10Effects], detailed);
const sd17Overrides = buildOverridesForSet('SD17-', [sd17Effects], detailed);
const bs11Overrides = buildOverridesForSet('BS11-', [bs11Effects], detailed);
const sd19Overrides = buildOverridesForSet('SD19-', [sd19Effects], detailed);
const sd20Overrides = buildOverridesForSet('SD20-', [sd20Effects], detailed);
const bs12Overrides = buildOverridesForSet('BS12-', [bs12Effects], detailed);
const sd22Overrides = buildOverridesForSet('SD22-', [sd22Effects], detailed);
const sd23Overrides = buildOverridesForSet('SD23-', [sd23Effects], detailed);
const bs13Overrides = buildOverridesForSet('BS13-', [bs13Effects], detailed);
const sd21Overrides = buildOverridesForSet('SD21-', [sd21Effects], detailed);
const sd24Overrides = buildOverridesForSet('SD24-', [sd24Effects], detailed);
const sd25Overrides = buildOverridesForSet('SD25-', [sd25Effects], detailed);
const bs14Overrides = buildOverridesForSet('BS14-', [bs14Effects], detailed);
const sd26Overrides = buildOverridesForSet('SD26-', [sd26Effects], detailed);
const sd27Overrides = buildOverridesForSet('SD27-', [sd27Effects], detailed);
const sd28Overrides = buildOverridesForSet('SD28-', [sd28Effects], detailed);
const bs15Overrides = buildOverridesForSet('BS15-', [bs15Effects], detailed);
const sd29Overrides = buildOverridesForSet('SD29-', [sd29Effects], detailed);
const sd30Overrides = buildOverridesForSet('SD30-', [sd30Effects], detailed);
const sd31Overrides = buildOverridesForSet('SD31-', [sd31Effects], detailed);
const sd32Overrides = buildOverridesForSet('SD32-', [sd32Effects], detailed);
const sd33Overrides = buildOverridesForSet('SD33-', [sd33Effects], detailed);
const bs16Overrides = buildOverridesForSet('BS16-', [bs16Effects], detailed);
const sd34Overrides = buildOverridesForSet('SD34-', [sd34Effects], detailed);
const sd37Overrides = buildOverridesForSet('SD37-', [sd37Effects], detailed);
const sd38Overrides = buildOverridesForSet('SD38-', [sd38Effects], detailed);
const sd39Overrides = buildOverridesForSet('SD39-', [sd39Effects], detailed);
const bs17Overrides = buildOverridesForSet('BS17-', [bs17Effects], detailed);
const sd40Overrides = buildOverridesForSet('SD40-', [sd40Effects], detailed);
const sd41Overrides = buildOverridesForSet('SD41-', [sd41Effects], detailed);
const sd42Overrides = buildOverridesForSet('SD42-', [sd42Effects], detailed);
const bs18Overrides = buildOverridesForSet('BS18-', [bs18Effects], detailed);
const sd43Overrides = buildOverridesForSet('SD43-', [sd43Effects], detailed);
const sd44Overrides = buildOverridesForSet('SD44-', [sd44Effects], detailed);
const sd45Overrides = buildOverridesForSet('SD45-', [sd45Effects], detailed);

// Map database slug aliases for BS01
const slugToCanonical = {
  'BATTLE-SPIRITS-A161': 'BS01-144',
  'UR-DINE2': 'BS01-081',
  'HELL-BLINDI2': 'BS01-082',
  'BEAR-GELMIR2': 'BS01-085',
  'METALDY-BUG2': 'BS01-086'
};

for (const [slug, canon] of Object.entries(slugToCanonical)) {
  if (bs01Overrides[slug] && !bs01Overrides[canon]) {
    bs01Overrides[canon] = { ...bs01Overrides[slug], cardNumber: canon };
  } else if (bs01Overrides[canon] && !bs01Overrides[slug]) {
    bs01Overrides[slug] = { ...bs01Overrides[canon], cardNumber: slug };
  }
}

// Write files
fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'skipped.js'),
  `/**\n * compiler/overrides/skipped.js\n * \n * Formally cataloged skipped cards set aside per Requirement R2.\n */\n\nexport const SKIPPED_CARDS = ${JSON.stringify(SKIPPED_CARDS, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD01.js'),
  `/**\n * compiler/overrides/SD01.js\n * \n * Explicit deterministic IR definitions for SD01 cards.\n */\n\nexport const SD01_OVERRIDES = ${JSON.stringify(sd01Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS01.js'),
  `/**\n * compiler/overrides/BS01.js\n * \n * Explicit deterministic IR definitions for BS01 cards.\n */\n\nexport const BS01_OVERRIDES = ${JSON.stringify(bs01Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS02.js'),
  `/**\n * compiler/overrides/BS02.js\n * \n * Explicit deterministic IR definitions for BS02 cards.\n */\n\nexport const BS02_OVERRIDES = ${JSON.stringify(bs02Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD02.js'),
  `/**\n * compiler/overrides/SD02.js\n * \n * Explicit deterministic IR definitions for SD02 cards.\n */\n\nexport const SD02_OVERRIDES = ${JSON.stringify(sd02Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS03.js'),
  `/**\n * compiler/overrides/BS03.js\n * \n * Explicit deterministic IR definitions for BS03 cards.\n */\n\nexport const BS03_OVERRIDES = ${JSON.stringify(bs03Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD03.js'),
  `/**\n * compiler/overrides/SD03.js\n * \n * Explicit deterministic IR definitions for SD03 cards.\n */\n\nexport const SD03_OVERRIDES = ${JSON.stringify(sd03Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS04.js'),
  `/**\n * compiler/overrides/BS04.js\n * \n * Explicit deterministic IR definitions for BS04 cards.\n */\n\nexport const BS04_OVERRIDES = ${JSON.stringify(bs04Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS05.js'),
  `/**\n * compiler/overrides/BS05.js\n * \n * Explicit deterministic IR definitions for BS05 cards.\n */\n\nexport const BS05_OVERRIDES = ${JSON.stringify(bs05Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS06.js'),
  `/**\n * compiler/overrides/BS06.js\n * \n * Explicit deterministic IR definitions for BS06 cards.\n */\n\nexport const BS06_OVERRIDES = ${JSON.stringify(bs06Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD06.js'),
  `/**\n * compiler/overrides/SD06.js\n * \n * Explicit deterministic IR definitions for SD06 cards.\n */\n\nexport const SD06_OVERRIDES = ${JSON.stringify(sd06Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS07.js'),
  `/**\n * compiler/overrides/BS07.js\n * \n * Explicit deterministic IR definitions for BS07 cards.\n */\n\nexport const BS07_OVERRIDES = ${JSON.stringify(bs07Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD10.js'),
  `/**\n * compiler/overrides/SD10.js\n * \n * Explicit deterministic IR definitions for SD10 cards.\n */\n\nexport const SD10_OVERRIDES = ${JSON.stringify(sd10Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD11.js'),
  `/**\n * compiler/overrides/SD11.js\n * \n * Explicit deterministic IR definitions for SD11 cards.\n */\n\nexport const SD11_OVERRIDES = ${JSON.stringify(sd11Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS08.js'),
  `/**\n * compiler/overrides/BS08.js\n * \n * Explicit deterministic IR definitions for BS08 cards.\n */\n\nexport const BS08_OVERRIDES = ${JSON.stringify(bs08Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD13.js'),
  `/**\n * compiler/overrides/SD13.js\n * \n * Explicit deterministic IR definitions for SD13 cards.\n */\n\nexport const SD13_OVERRIDES = ${JSON.stringify(sd13Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD14.js'),
  `/**\n * compiler/overrides/SD14.js\n * \n * Explicit deterministic IR definitions for SD14 cards.\n */\n\nexport const SD14_OVERRIDES = ${JSON.stringify(sd14Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS09.js'),
  `/**\n * compiler/overrides/BS09.js\n * \n * Explicit deterministic IR definitions for BS09 cards.\n */\n\nexport const BS09_OVERRIDES = ${JSON.stringify(bs09Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD15.js'),
  `/**\n * compiler/overrides/SD15.js\n * \n * Explicit deterministic IR definitions for SD15 cards.\n */\n\nexport const SD15_OVERRIDES = ${JSON.stringify(sd15Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD16.js'),
  `/**\n * compiler/overrides/SD16.js\n * \n * Explicit deterministic IR definitions for SD16 cards.\n */\n\nexport const SD16_OVERRIDES = ${JSON.stringify(sd16Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS10.js'),
  `/**\n * compiler/overrides/BS10.js\n * \n * Explicit deterministic IR definitions for BS10 cards.\n */\n\nexport const BS10_OVERRIDES = ${JSON.stringify(bs10Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD17.js'),
  `/**\n * compiler/overrides/SD17.js\n * \n * Explicit deterministic IR definitions for SD17 cards.\n */\n\nexport const SD17_OVERRIDES = ${JSON.stringify(sd17Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS11.js'),
  `/**\n * compiler/overrides/BS11.js\n * \n * Explicit deterministic IR definitions for BS11 cards.\n */\n\nexport const BS11_OVERRIDES = ${JSON.stringify(bs11Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD19.js'),
  `/**\n * compiler/overrides/SD19.js\n * \n * Explicit deterministic IR definitions for SD19 cards.\n */\n\nexport const SD19_OVERRIDES = ${JSON.stringify(sd19Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD20.js'),
  `/**\n * compiler/overrides/SD20.js\n * \n * Explicit deterministic IR definitions for SD20 cards.\n */\n\nexport const SD20_OVERRIDES = ${JSON.stringify(sd20Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS12.js'),
  `/**\n * compiler/overrides/BS12.js\n * \n * Explicit deterministic IR definitions for BS12 cards.\n */\n\nexport const BS12_OVERRIDES = ${JSON.stringify(bs12Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD22.js'),
  `/**\n * compiler/overrides/SD22.js\n * \n * Explicit deterministic IR definitions for SD22 cards.\n */\n\nexport const SD22_OVERRIDES = ${JSON.stringify(sd22Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD23.js'),
  `/**\n * compiler/overrides/SD23.js\n * \n * Explicit deterministic IR definitions for SD23 cards.\n */\n\nexport const SD23_OVERRIDES = ${JSON.stringify(sd23Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS13.js'),
  `/**\n * compiler/overrides/BS13.js\n * \n * Explicit deterministic IR definitions for BS13 cards.\n */\n\nexport const BS13_OVERRIDES = ${JSON.stringify(bs13Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD21.js'),
  `/**\n * compiler/overrides/SD21.js\n * \n * Explicit deterministic IR definitions for SD21 cards.\n */\n\nexport const SD21_OVERRIDES = ${JSON.stringify(sd21Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD24.js'),
  `/**\n * compiler/overrides/SD24.js\n * \n * Explicit deterministic IR definitions for SD24 cards.\n */\n\nexport const SD24_OVERRIDES = ${JSON.stringify(sd24Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD25.js'),
  `/**\n * compiler/overrides/SD25.js\n * \n * Explicit deterministic IR definitions for SD25 cards.\n */\n\nexport const SD25_OVERRIDES = ${JSON.stringify(sd25Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS14.js'),
  `/**\n * compiler/overrides/BS14.js\n * \n * Explicit deterministic IR definitions for BS14 cards.\n */\n\nexport const BS14_OVERRIDES = ${JSON.stringify(bs14Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD26.js'),
  `/**\n * compiler/overrides/SD26.js\n * \n * Explicit deterministic IR definitions for SD26 cards.\n */\n\nexport const SD26_OVERRIDES = ${JSON.stringify(sd26Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD27.js'),
  `/**\n * compiler/overrides/SD27.js\n * \n * Explicit deterministic IR definitions for SD27 cards.\n */\n\nexport const SD27_OVERRIDES = ${JSON.stringify(sd27Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD28.js'),
  `/**\n * compiler/overrides/SD28.js\n * \n * Explicit deterministic IR definitions for SD28 cards.\n */\n\nexport const SD28_OVERRIDES = ${JSON.stringify(sd28Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS15.js'),
  `/**\n * compiler/overrides/BS15.js\n * \n * Explicit deterministic IR definitions for BS15 cards.\n */\n\nexport const BS15_OVERRIDES = ${JSON.stringify(bs15Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD29.js'),
  `/**\n * compiler/overrides/SD29.js\n * \n * Explicit deterministic IR definitions for SD29 cards.\n */\n\nexport const SD29_OVERRIDES = ${JSON.stringify(sd29Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD30.js'),
  `/**\n * compiler/overrides/SD30.js\n * \n * Explicit deterministic IR definitions for SD30 cards.\n */\n\nexport const SD30_OVERRIDES = ${JSON.stringify(sd30Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD31.js'),
  `/**\n * compiler/overrides/SD31.js\n * \n * Explicit deterministic IR definitions for SD31 cards.\n */\n\nexport const SD31_OVERRIDES = ${JSON.stringify(sd31Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD32.js'),
  `/**\n * compiler/overrides/SD32.js\n * \n * Explicit deterministic IR definitions for SD32 cards.\n */\n\nexport const SD32_OVERRIDES = ${JSON.stringify(sd32Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD33.js'),
  `/**\n * compiler/overrides/SD33.js\n * \n * Explicit deterministic IR definitions for SD33 cards.\n */\n\nexport const SD33_OVERRIDES = ${JSON.stringify(sd33Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS16.js'),
  `/**\n * compiler/overrides/BS16.js\n * \n * Explicit deterministic IR definitions for BS16 cards.\n */\n\nexport const BS16_OVERRIDES = ${JSON.stringify(bs16Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD34.js'),
  `/**\n * compiler/overrides/SD34.js\n * \n * Explicit deterministic IR definitions for SD34 cards.\n */\n\nexport const SD34_OVERRIDES = ${JSON.stringify(sd34Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD37.js'),
  `/**\n * compiler/overrides/SD37.js\n * \n * Explicit deterministic IR definitions for SD37 cards.\n */\n\nexport const SD37_OVERRIDES = ${JSON.stringify(sd37Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD38.js'),
  `/**\n * compiler/overrides/SD38.js\n * \n * Explicit deterministic IR definitions for SD38 cards.\n */\n\nexport const SD38_OVERRIDES = ${JSON.stringify(sd38Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD39.js'),
  `/**\n * compiler/overrides/SD39.js\n * \n * Explicit deterministic IR definitions for SD39 cards.\n */\n\nexport const SD39_OVERRIDES = ${JSON.stringify(sd39Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS17.js'),
  `/**\n * compiler/overrides/BS17.js\n * \n * Explicit deterministic IR definitions for BS17 cards.\n */\n\nexport const BS17_OVERRIDES = ${JSON.stringify(bs17Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD40.js'),
  `/**\n * compiler/overrides/SD40.js\n * \n * Explicit deterministic IR definitions for SD40 cards.\n */\n\nexport const SD40_OVERRIDES = ${JSON.stringify(sd40Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD41.js'),
  `/**\n * compiler/overrides/SD41.js\n * \n * Explicit deterministic IR definitions for SD41 cards.\n */\n\nexport const SD41_OVERRIDES = ${JSON.stringify(sd41Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD42.js'),
  `/**\n * compiler/overrides/SD42.js\n * \n * Explicit deterministic IR definitions for SD42 cards.\n */\n\nexport const SD42_OVERRIDES = ${JSON.stringify(sd42Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'BS18.js'),
  `/**\n * compiler/overrides/BS18.js\n * \n * Explicit deterministic IR definitions for BS18 cards.\n */\n\nexport const BS18_OVERRIDES = ${JSON.stringify(bs18Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD43.js'),
  `/**\n * compiler/overrides/SD43.js\n * \n * Explicit deterministic IR definitions for SD43 cards.\n */\n\nexport const SD43_OVERRIDES = ${JSON.stringify(sd43Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD44.js'),
  `/**\n * compiler/overrides/SD44.js\n * \n * Explicit deterministic IR definitions for SD44 cards.\n */\n\nexport const SD44_OVERRIDES = ${JSON.stringify(sd44Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'SD45.js'),
  `/**\n * compiler/overrides/SD45.js\n * \n * Explicit deterministic IR definitions for SD45 cards.\n */\n\nexport const SD45_OVERRIDES = ${JSON.stringify(sd45Overrides, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OVERRIDES_DIR, 'index.js'),
  `/**\n * compiler/overrides/index.js\n * \n * Override router dispatching explicit deterministic IR by canonical card number.\n */\n\nimport { SD01_OVERRIDES } from './SD01.js';\nimport { BS01_OVERRIDES } from './BS01.js';\nimport { BS02_OVERRIDES } from './BS02.js';\nimport { SD02_OVERRIDES } from './SD02.js';\nimport { BS03_OVERRIDES } from './BS03.js';\nimport { SD03_OVERRIDES } from './SD03.js';\nimport { BS04_OVERRIDES } from './BS04.js';\nimport { BS05_OVERRIDES } from './BS05.js';\nimport { BS06_OVERRIDES } from './BS06.js';\nimport { SD06_OVERRIDES } from './SD06.js';\nimport { BS07_OVERRIDES } from './BS07.js';\nimport { SD10_OVERRIDES } from './SD10.js';\nimport { SD11_OVERRIDES } from './SD11.js';\nimport { BS08_OVERRIDES } from './BS08.js';\nimport { SD13_OVERRIDES } from './SD13.js';\nimport { SD14_OVERRIDES } from './SD14.js';\nimport { BS09_OVERRIDES } from './BS09.js';\nimport { SD15_OVERRIDES } from './SD15.js';\nimport { SD16_OVERRIDES } from './SD16.js';\nimport { BS10_OVERRIDES } from './BS10.js';\nimport { SD17_OVERRIDES } from './SD17.js';\nimport { BS11_OVERRIDES } from './BS11.js';\nimport { SD19_OVERRIDES } from './SD19.js';\nimport { SD20_OVERRIDES } from './SD20.js';\nimport { BS12_OVERRIDES } from './BS12.js';\nimport { SD22_OVERRIDES } from './SD22.js';\nimport { SD23_OVERRIDES } from './SD23.js';\nimport { BS13_OVERRIDES } from './BS13.js';\nimport { SD21_OVERRIDES } from './SD21.js';\nimport { SD24_OVERRIDES } from './SD24.js';\nimport { SD25_OVERRIDES } from './SD25.js';\nimport { BS14_OVERRIDES } from './BS14.js';\nimport { SD26_OVERRIDES } from './SD26.js';\nimport { SD27_OVERRIDES } from './SD27.js';\nimport { SD28_OVERRIDES } from './SD28.js';\nimport { BS15_OVERRIDES } from './BS15.js';\nimport { SD29_OVERRIDES } from './SD29.js';\nimport { SD30_OVERRIDES } from './SD30.js';\nimport { SD31_OVERRIDES } from './SD31.js';\nimport { SD32_OVERRIDES } from './SD32.js';\nimport { SD33_OVERRIDES } from './SD33.js';\nimport { BS16_OVERRIDES } from './BS16.js';\nimport { SD34_OVERRIDES } from './SD34.js';\nimport { SD37_OVERRIDES } from './SD37.js';\nimport { SD38_OVERRIDES } from './SD38.js';\nimport { SD39_OVERRIDES } from './SD39.js';\nimport { BS17_OVERRIDES } from './BS17.js';\nimport { SD40_OVERRIDES } from './SD40.js';\nimport { SD41_OVERRIDES } from './SD41.js';\nimport { SD42_OVERRIDES } from './SD42.js';\nimport { BS18_OVERRIDES } from './BS18.js';\nimport { SD43_OVERRIDES } from './SD43.js';\nimport { SD44_OVERRIDES } from './SD44.js';\nimport { SD45_OVERRIDES } from './SD45.js';\nimport { SKIPPED_CARDS } from './skipped.js';\nimport { VANILLA_CARD_NUMBERS } from './vanillas.js';\n\nexport { SD01_OVERRIDES, BS01_OVERRIDES, BS02_OVERRIDES, SD02_OVERRIDES, BS03_OVERRIDES, SD03_OVERRIDES, BS04_OVERRIDES, BS05_OVERRIDES, BS06_OVERRIDES, SD06_OVERRIDES, BS07_OVERRIDES, SD10_OVERRIDES, SD11_OVERRIDES, BS08_OVERRIDES, SD13_OVERRIDES, SD14_OVERRIDES, BS09_OVERRIDES, SD15_OVERRIDES, SD16_OVERRIDES, BS10_OVERRIDES, SD17_OVERRIDES, BS11_OVERRIDES, SD19_OVERRIDES, SD20_OVERRIDES, BS12_OVERRIDES, SD22_OVERRIDES, SD23_OVERRIDES, BS13_OVERRIDES, SD21_OVERRIDES, SD24_OVERRIDES, SD25_OVERRIDES, BS14_OVERRIDES, SD26_OVERRIDES, SD27_OVERRIDES, SD28_OVERRIDES, BS15_OVERRIDES, SD29_OVERRIDES, SD30_OVERRIDES, SD31_OVERRIDES, SD32_OVERRIDES, SD33_OVERRIDES, BS16_OVERRIDES, SD34_OVERRIDES, SD37_OVERRIDES, SD38_OVERRIDES, SD39_OVERRIDES, BS17_OVERRIDES, SD40_OVERRIDES, SD41_OVERRIDES, SD42_OVERRIDES, BS18_OVERRIDES, SD43_OVERRIDES, SD44_OVERRIDES, SD45_OVERRIDES, SKIPPED_CARDS, VANILLA_CARD_NUMBERS };\n\nexport function getCardOverride(cardNumber, card = null) {\n  if (!cardNumber && !card) return null;\n  const num = (typeof cardNumber === 'string' && cardNumber.trim().length > 0)\n    ? cardNumber.trim()\n    : (card && typeof (card.card_number || card.cardNumber || card.id) === 'string'\n        ? (card.card_number || card.cardNumber || card.id).trim()\n        : null);\n\n  if (!num || typeof num !== 'string') return null;\n\n  if (Object.prototype.hasOwnProperty.call(SD01_OVERRIDES, num)) return SD01_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS01_OVERRIDES, num)) return BS01_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS02_OVERRIDES, num)) return BS02_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD02_OVERRIDES, num)) return SD02_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS03_OVERRIDES, num)) return BS03_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD03_OVERRIDES, num)) return SD03_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS04_OVERRIDES, num)) return BS04_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS05_OVERRIDES, num)) return BS05_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS06_OVERRIDES, num)) return BS06_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD06_OVERRIDES, num)) return SD06_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS07_OVERRIDES, num)) return BS07_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD10_OVERRIDES, num)) return SD10_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD11_OVERRIDES, num)) return SD11_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS08_OVERRIDES, num)) return BS08_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD13_OVERRIDES, num)) return SD13_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD14_OVERRIDES, num)) return SD14_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS09_OVERRIDES, num)) return BS09_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD15_OVERRIDES, num)) return SD15_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD16_OVERRIDES, num)) return SD16_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS10_OVERRIDES, num)) return BS10_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD17_OVERRIDES, num)) return SD17_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS11_OVERRIDES, num)) return BS11_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD19_OVERRIDES, num)) return SD19_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD20_OVERRIDES, num)) return SD20_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS12_OVERRIDES, num)) return BS12_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD22_OVERRIDES, num)) return SD22_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD23_OVERRIDES, num)) return SD23_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS13_OVERRIDES, num)) return BS13_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD21_OVERRIDES, num)) return SD21_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD24_OVERRIDES, num)) return SD24_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD25_OVERRIDES, num)) return SD25_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS14_OVERRIDES, num)) return BS14_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD26_OVERRIDES, num)) return SD26_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD27_OVERRIDES, num)) return SD27_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD28_OVERRIDES, num)) return SD28_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS15_OVERRIDES, num)) return BS15_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD29_OVERRIDES, num)) return SD29_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD30_OVERRIDES, num)) return SD30_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD31_OVERRIDES, num)) return SD31_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD32_OVERRIDES, num)) return SD32_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD33_OVERRIDES, num)) return SD33_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS16_OVERRIDES, num)) return BS16_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD34_OVERRIDES, num)) return SD34_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD37_OVERRIDES, num)) return SD37_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD38_OVERRIDES, num)) return SD38_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD39_OVERRIDES, num)) return SD39_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS17_OVERRIDES, num)) return BS17_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD40_OVERRIDES, num)) return SD40_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD41_OVERRIDES, num)) return SD41_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD42_OVERRIDES, num)) return SD42_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(BS18_OVERRIDES, num)) return BS18_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD43_OVERRIDES, num)) return SD43_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD44_OVERRIDES, num)) return SD44_OVERRIDES[num];\n  if (Object.prototype.hasOwnProperty.call(SD45_OVERRIDES, num)) return SD45_OVERRIDES[num];\n\n  if (typeof VANILLA_CARD_NUMBERS !== 'undefined' && VANILLA_CARD_NUMBERS.has(num)) {\n    return { cardNumber: num, name: (card && card.name) || num, isVanilla: true, isFullySupported: true, compiledClausesCount: 0, unsupportedClausesCount: 0, abilities: [], keywords: [] };\n  }\n\n  if (card && typeof card.id === 'string' && card.id.trim().length > 0) {\n    const cardId = card.id.trim();\n    if (Object.prototype.hasOwnProperty.call(SD01_OVERRIDES, cardId)) return SD01_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS01_OVERRIDES, cardId)) return BS01_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS02_OVERRIDES, cardId)) return BS02_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD02_OVERRIDES, cardId)) return SD02_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS03_OVERRIDES, cardId)) return BS03_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD03_OVERRIDES, cardId)) return SD03_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS04_OVERRIDES, cardId)) return BS04_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS05_OVERRIDES, cardId)) return BS05_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS06_OVERRIDES, cardId)) return BS06_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD06_OVERRIDES, cardId)) return SD06_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS07_OVERRIDES, cardId)) return BS07_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD10_OVERRIDES, cardId)) return SD10_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD11_OVERRIDES, cardId)) return SD11_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS08_OVERRIDES, cardId)) return BS08_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD13_OVERRIDES, cardId)) return SD13_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD14_OVERRIDES, cardId)) return SD14_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS09_OVERRIDES, cardId)) return BS09_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD15_OVERRIDES, cardId)) return SD15_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD16_OVERRIDES, cardId)) return SD16_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS10_OVERRIDES, cardId)) return BS10_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD17_OVERRIDES, cardId)) return SD17_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS11_OVERRIDES, cardId)) return BS11_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD19_OVERRIDES, cardId)) return SD19_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD20_OVERRIDES, cardId)) return SD20_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS12_OVERRIDES, cardId)) return BS12_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD22_OVERRIDES, cardId)) return SD22_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD23_OVERRIDES, cardId)) return SD23_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS13_OVERRIDES, cardId)) return BS13_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD21_OVERRIDES, cardId)) return SD21_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD24_OVERRIDES, cardId)) return SD24_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD25_OVERRIDES, cardId)) return SD25_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS14_OVERRIDES, cardId)) return BS14_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD26_OVERRIDES, cardId)) return SD26_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD27_OVERRIDES, cardId)) return SD27_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD28_OVERRIDES, cardId)) return SD28_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS15_OVERRIDES, cardId)) return BS15_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD29_OVERRIDES, cardId)) return SD29_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD30_OVERRIDES, cardId)) return SD30_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD31_OVERRIDES, cardId)) return SD31_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD32_OVERRIDES, cardId)) return SD32_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD33_OVERRIDES, cardId)) return SD33_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS16_OVERRIDES, cardId)) return BS16_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD34_OVERRIDES, cardId)) return SD34_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD37_OVERRIDES, cardId)) return SD37_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD38_OVERRIDES, cardId)) return SD38_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD39_OVERRIDES, cardId)) return SD39_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS17_OVERRIDES, cardId)) return BS17_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD40_OVERRIDES, cardId)) return SD40_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD41_OVERRIDES, cardId)) return SD41_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD42_OVERRIDES, cardId)) return SD42_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(BS18_OVERRIDES, cardId)) return BS18_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD43_OVERRIDES, cardId)) return SD43_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD44_OVERRIDES, cardId)) return SD44_OVERRIDES[cardId];\n    if (Object.prototype.hasOwnProperty.call(SD45_OVERRIDES, cardId)) return SD45_OVERRIDES[cardId];\n\n    if (typeof VANILLA_CARD_NUMBERS !== 'undefined' && VANILLA_CARD_NUMBERS.has(cardId)) {\n      return { cardNumber: cardId, name: card.name || cardId, isVanilla: true, isFullySupported: true, compiledClausesCount: 0, unsupportedClausesCount: 0, abilities: [], keywords: [] };\n    }\n  }\n\n  return null;\n}\n`
);

console.log('Overrides successfully generated:');
console.log('  SD01 override keys:', Object.keys(sd01Overrides).length);
console.log('  BS01 override keys:', Object.keys(bs01Overrides).length);
console.log('  BS02 override keys:', Object.keys(bs02Overrides).length);
console.log('  SD02 override keys:', Object.keys(sd02Overrides).length);
console.log('  BS03 override keys:', Object.keys(bs03Overrides).length);
console.log('  SD03 override keys:', Object.keys(sd03Overrides).length);
console.log('  BS04 override keys:', Object.keys(bs04Overrides).length);
console.log('  BS05 override keys:', Object.keys(bs05Overrides).length);
console.log('  BS06 override keys:', Object.keys(bs06Overrides).length);
console.log('  SD06 override keys:', Object.keys(sd06Overrides).length);
console.log('  BS07 override keys:', Object.keys(bs07Overrides).length);
console.log('  SD10 override keys:', Object.keys(sd10Overrides).length);
console.log('  SD11 override keys:', Object.keys(sd11Overrides).length);
console.log('  BS08 override keys:', Object.keys(bs08Overrides).length);
console.log('  SD13 override keys:', Object.keys(sd13Overrides).length);
console.log('  SD14 override keys:', Object.keys(sd14Overrides).length);
console.log('  BS09 override keys:', Object.keys(bs09Overrides).length);
console.log('  SD15 override keys:', Object.keys(sd15Overrides).length);
console.log('  SD16 override keys:', Object.keys(sd16Overrides).length);
console.log('  BS10 override keys:', Object.keys(bs10Overrides).length);
console.log('  SD17 override keys:', Object.keys(sd17Overrides).length);
console.log('  BS11 override keys:', Object.keys(bs11Overrides).length);
console.log('  SD19 override keys:', Object.keys(sd19Overrides).length);
console.log('  SD20 override keys:', Object.keys(sd20Overrides).length);
console.log('  BS12 override keys:', Object.keys(bs12Overrides).length);
console.log('  SD22 override keys:', Object.keys(sd22Overrides).length);
console.log('  SD23 override keys:', Object.keys(sd23Overrides).length);
console.log('  BS13 override keys:', Object.keys(bs13Overrides).length);
console.log('  SD21 override keys:', Object.keys(sd21Overrides).length);
console.log('  SD24 override keys:', Object.keys(sd24Overrides).length);
console.log('  SD25 override keys:', Object.keys(sd25Overrides).length);
console.log('  BS14 override keys:', Object.keys(bs14Overrides).length);
console.log('  SD26 override keys:', Object.keys(sd26Overrides).length);
console.log('  SD27 override keys:', Object.keys(sd27Overrides).length);
console.log('  SD28 override keys:', Object.keys(sd28Overrides).length);
console.log('  BS15 override keys:', Object.keys(bs15Overrides).length);
console.log('  SD29 override keys:', Object.keys(sd29Overrides).length);
console.log('  SD30 override keys:', Object.keys(sd30Overrides).length);
console.log('  SD31 override keys:', Object.keys(sd31Overrides).length);
console.log('  SD32 override keys:', Object.keys(sd32Overrides).length);
console.log('  SD33 override keys:', Object.keys(sd33Overrides).length);
console.log('  BS16 override keys:', Object.keys(bs16Overrides).length);
console.log('  SD34 override keys:', Object.keys(sd34Overrides).length);
console.log('  SD37 override keys:', Object.keys(sd37Overrides).length);
console.log('  SD38 override keys:', Object.keys(sd38Overrides).length);
console.log('  SD39 override keys:', Object.keys(sd39Overrides).length);
console.log('  BS17 override keys:', Object.keys(bs17Overrides).length);
console.log('  SD40 override keys:', Object.keys(sd40Overrides).length);
console.log('  SD41 override keys:', Object.keys(sd41Overrides).length);
console.log('  SD42 override keys:', Object.keys(sd42Overrides).length);
console.log('  BS18 override keys:', Object.keys(bs18Overrides).length);
console.log('  SD43 override keys:', Object.keys(sd43Overrides).length);
console.log('  SD44 override keys:', Object.keys(sd44Overrides).length);
console.log('  SD45 override keys:', Object.keys(sd45Overrides).length);
console.log('  Skipped cards cataloged:', SKIPPED_CARDS.length);
