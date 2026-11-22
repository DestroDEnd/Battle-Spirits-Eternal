import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { compileCard } from '../compiler/index.js';

const SHARD_DIR = path.resolve('data/ir_shards');
const INVENTORY_PATH = path.resolve('data/per_shard_validation_inventory.json');
const DETAILED_PATH = path.resolve('data/cards_detailed.json');
const OUT_DIR = path.resolve('reports/work_package_c3');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TARGET_CARDS = [
  { shard: 'BS69.json', cardNumber: 'BS69-036', reason: 'Reconstruct structured REVEAL_CARDS (count:3, from:DECK, side:self)' },
  { shard: 'BS64.json', cardNumber: 'BS64-X04', reason: 'Reconstruct structured REVEAL_CARDS (count:3, from:DECK, side:both, isOptional:true)' },
  { shard: 'BS20.json', cardNumber: 'BS20-X01', reason: 'Reconstruct structured REPLACEMENT_EFFECT (DESTROYED_SPIRIT_CORES -> field, SELF)' },
  { shard: 'BS42.json', cardNumber: 'BS42-052', reason: 'Reconstruct structured REPLACEMENT_EFFECT (CORE_ADDITION -> life, self)' },
  { shard: 'BS24.json', cardNumber: 'BS24-013', reason: 'Reconstruct structured REPLACEMENT_EFFECT (CORE_ADDITION -> field, SELF)' }
];

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const detailed = JSON.parse(fs.readFileSync(DETAILED_PATH, 'utf8'));
const allDetailed = Array.isArray(detailed) ? detailed : Object.values(detailed);
const detailedByNumber = new Map();
for (const c of allDetailed) {
  const cn = c.cardNumber || c.card_number || c.id;
  if (cn) detailedByNumber.set(cn, c);
}

const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));
const invEntries = Array.isArray(inventory) ? inventory : (Array.isArray(inventory.shards) ? inventory.shards : Object.values(inventory));
const diffs = [];

for (const item of TARGET_CARDS) {
  const shardPath = path.join(SHARD_DIR, item.shard);
  const beforeBuf = fs.readFileSync(shardPath);
  const beforeSha = sha256Buffer(beforeBuf);
  const shardObj = JSON.parse(beforeBuf.toString('utf8'));
  const beforeCard = shardObj[item.cardNumber];
  if (!beforeCard) throw new Error(`Card ${item.cardNumber} not found in ${item.shard}`);

  const rawCard = detailedByNumber.get(item.cardNumber);
  if (!rawCard) throw new Error(`Raw card ${item.cardNumber} not found in cards_detailed.json`);

  const compiled1 = compileCard(rawCard);
  const compiled2 = compileCard(rawCard);
  if (JSON.stringify(compiled1.abilities) !== JSON.stringify(compiled2.abilities)) {
    throw new Error(`Non-deterministic compilation for ${item.cardNumber}`);
  }

  const afterCard = {
    ...beforeCard,
    abilities: compiled1.abilities,
    compiledClausesCount: compiled1.compiledClausesCount ?? beforeCard.compiledClausesCount,
    unsupportedClausesCount: compiled1.unsupportedClausesCount ?? beforeCard.unsupportedClausesCount,
    isFullySupported: compiled1.isFullySupported ?? beforeCard.isFullySupported
  };

  shardObj[item.cardNumber] = afterCard;
  const afterContent = JSON.stringify(shardObj, null, 2) + '\n';
  fs.writeFileSync(shardPath, afterContent, 'utf8');
  const afterBuf = fs.readFileSync(shardPath);
  const afterSha = sha256Buffer(afterBuf);

  const invEntry = invEntries.find(e => e.file === item.shard);
  if (invEntry) {
    invEntry.sha256 = afterSha;
    invEntry.sizeBytes = afterBuf.length;
  }

  diffs.push({
    shard: item.shard,
    cardNumber: item.cardNumber,
    reason: item.reason,
    beforeSha256: beforeSha,
    afterSha256: afterSha,
    beforeSizeBytes: beforeBuf.length,
    afterSizeBytes: afterBuf.length,
    beforeAbilityIds: (beforeCard.abilities || []).map(a => ({ id: a.id, physicalId: a.physicalId, semanticId: a.semanticId })),
    afterAbilityIds: (afterCard.abilities || []).map(a => ({ id: a.id, physicalId: a.physicalId, semanticId: a.semanticId })),
    beforeClauses: (beforeCard.abilities || []).map(a => a.clauses.map(cl => cl.op)),
    afterClauses: (afterCard.abilities || []).map(a => a.clauses.map(cl => cl.op)),
    deterministicVerified: true
  });
}

fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'shard_migration_diff.json'), JSON.stringify({ migratedCount: diffs.length, diffs }, null, 2));
console.log(JSON.stringify({ migratedCount: diffs.length, cards: diffs.map(d => d.cardNumber) }, null, 2));
