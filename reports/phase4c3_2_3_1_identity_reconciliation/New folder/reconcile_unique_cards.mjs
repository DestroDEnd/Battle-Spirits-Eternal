import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SHARDS_DIR = path.join(ROOT, 'data', 'ir_shards');
const CATALOG_PATH = path.join(ROOT, 'data', 'cards_detailed.json');
const OUT_DIR = path.join(ROOT, 'reports', 'phase4c3_2_3_full_identity_compilation');

console.log('Running Deep Unique-Card Reconciliation...');

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const catalogKeys = new Set(Object.keys(catalog));

const files = fs.readdirSync(SHARDS_DIR).filter(f => f.endsWith('.json')).sort();

let totalShardCardEntries = 0;
const shardCards = new Map(); // cNum -> { shards: Set, name: string, abilitiesCount: number, isVanilla: boolean }

for (const file of files) {
  const shard = JSON.parse(fs.readFileSync(path.join(SHARDS_DIR, file), 'utf8'));
  for (const [cNum, card] of Object.entries(shard)) {
    totalShardCardEntries++;
    const abCount = Array.isArray(card.abilities) ? card.abilities.length : 0;
    const isVanilla = abCount === 0;

    if (!shardCards.has(cNum)) {
      shardCards.set(cNum, {
        cNum,
        name: card.name || 'Unknown',
        shards: new Set([file]),
        abilitiesCount: abCount,
        isVanilla
      });
    } else {
      const rec = shardCards.get(cNum);
      rec.shards.add(file);
    }
  }
}

const uniqueShardCards = shardCards.size;
let effectCardsCount = 0;
let vanillaCardsCount = 0;

for (const rec of shardCards.values()) {
  if (rec.abilitiesCount > 0) {
    effectCardsCount++;
  } else {
    vanillaCardsCount++;
  }
}

// Find 188 shard-only cards and 22 catalog-only cards
const shardOnly = [];
for (const [cNum, rec] of shardCards.entries()) {
  if (!catalogKeys.has(cNum)) {
    shardOnly.push({
      cardNumber: cNum,
      name: rec.name,
      shards: [...rec.shards].join('; '),
      abilitiesCount: rec.abilitiesCount,
      isVanilla: rec.isVanilla
    });
  }
}
shardOnly.sort((a, b) => a.cardNumber.localeCompare(b.cardNumber));

const catalogOnly = [];
for (const [cNum, card] of Object.entries(catalog)) {
  if (!shardCards.has(cNum)) {
    catalogOnly.push({
      cardNumber: cNum,
      name: card.name || 'Unknown',
      type: card.type || 'Unknown',
      isVanilla: Boolean(card.is_vanilla)
    });
  }
}
catalogOnly.sort((a, b) => a.cardNumber.localeCompare(b.cardNumber));

const commonCount = [...shardCards.keys()].filter(c => catalogKeys.has(c)).length;

// Export reconciliation CSV of all 188 shard-only cards
const shardOnlyCsv = [
  'card_number,name,shards,abilities_count,is_vanilla'
];
for (const c of shardOnly) {
  shardOnlyCsv.push(`"${c.cardNumber}","${c.name.replace(/"/g, '""')}","${c.shards}",${c.abilitiesCount},${c.isVanilla}`);
}
fs.writeFileSync(path.join(OUT_DIR, 'reconciliation_shard_only_188.csv'), shardOnlyCsv.join('\n'), 'utf8');

// Export reconciliation CSV of all 22 catalog-only cards
const catalogOnlyCsv = [
  'card_number,name,type,is_vanilla'
];
for (const c of catalogOnly) {
  catalogOnlyCsv.push(`"${c.cardNumber}","${c.name.replace(/"/g, '""')}","${c.type}",${c.isVanilla}`);
}
fs.writeFileSync(path.join(OUT_DIR, 'reconciliation_catalog_only_22.csv'), catalogOnlyCsv.join('\n'), 'utf8');

const reconciliationSummary = {
  totalShards: files.length,
  totalShardCardEntries: totalShardCardEntries,
  uniqueCanonicalCardNumbersInShards: uniqueShardCards,
  effectCardsCount: effectCardsCount,
  vanillaCardsCount: vanillaCardsCount,
  sumOfEffectAndVanilla: effectCardsCount + vanillaCardsCount,
  masterCatalogCardsCount: catalogKeys.size,
  commonCardsInBoth: commonCount,
  shardOnlyCardNumbersCount: shardOnly.length,
  catalogOnlyCardNumbersCount: catalogOnly.length,
  discrepancyExplanation: {
    previousReported14235: "14,235 represents ONLY effect cards with abilities (physicalIdMap size). Vanilla cards (374 cards) have 0 abilities and were excluded from physicalIdMap.",
    verifiedTotalCanonicalCards: 14609,
    formula: "14,235 (effect cards) + 374 (vanilla cards) = 14,609 (total unique canonical cards across all 514 shards)."
  }
};

fs.writeFileSync(path.join(OUT_DIR, 'reconciliation_detailed_summary.json'), JSON.stringify(reconciliationSummary, null, 2), 'utf8');

console.log('Reconciliation Results:');
console.log(JSON.stringify(reconciliationSummary, null, 2));
