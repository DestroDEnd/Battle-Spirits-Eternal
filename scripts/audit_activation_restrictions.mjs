import fs from 'node:fs';
import path from 'node:path';

const shardsDir = path.resolve('data/ir_shards');
const files = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json'));

let totalAbilities = 0;
let totalLimits = 0;
const limitTypeCounts = {};
const scopeCounts = {};
const sampleCardsByLimit = {};

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(shardsDir, f), 'utf8'));
  const cards = Array.isArray(data) ? data : (data.cards || Object.values(data));
  for (const card of cards) {
    if (!card || typeof card !== 'object') continue;
    const abs = card.abilities || [];
    for (const ab of abs) {
      totalAbilities++;
      if (ab.header && ab.header.limit) {
        totalLimits++;
        const lim = ab.header.limit;
        const type = typeof lim === 'string' ? lim : (lim.type || 'UNKNOWN');
        const scope = typeof lim === 'object' ? (lim.scope || 'INSTANCE') : 'INSTANCE';
        limitTypeCounts[type] = (limitTypeCounts[type] || 0) + 1;
        scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
        if (!sampleCardsByLimit[type]) sampleCardsByLimit[type] = [];
        const cid = card.cardNumber || card.id;
        if (cid && sampleCardsByLimit[type].length < 5 && !sampleCardsByLimit[type].includes(cid)) {
          sampleCardsByLimit[type].push(cid);
        }
      }
    }
  }
}

console.log(`Audited ${files.length} shards.`);
console.log(`Total Abilities: ${totalAbilities}`);
console.log(`Total Abilities with Activation Limit: ${totalLimits} (${((totalLimits / totalAbilities) * 100).toFixed(2)}%)`);
console.log('Limit Types:', limitTypeCounts);
console.log('Scope Counts:', scopeCounts);
console.log('Sample Cards:', sampleCardsByLimit);

const reportData = {
  totalShards: files.length,
  totalAbilities,
  totalLimits,
  limitTypeCounts,
  scopeCounts,
  sampleCardsByLimit
};

fs.writeFileSync('scratch/activation_limit_audit.json', JSON.stringify(reportData, null, 2));
