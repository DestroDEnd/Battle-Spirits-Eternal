import fs from 'node:fs';
import path from 'node:path';

const SHARD_DIR = path.resolve('data/ir_shards');
const PROTECTED_C3 = new Set(['BS69-036', 'BS64-X04', 'BS20-X01', 'BS42-052', 'BS24-013', 'SD42-011']);

const WORD_NUMS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

function parseNum(tok) {
  if (!tok) return null;
  const low = String(tok).toLowerCase().trim();
  if (/^\d+$/.test(low)) return parseInt(low, 10);
  return WORD_NUMS[low] ?? null;
}

function parseTypesFromText(typeStr) {
  const out = [];
  if (/spirit/i.test(typeStr)) out.push('Spirit');
  if (/ultimate/i.test(typeStr)) out.push('Ultimate');
  if (/nexus/i.test(typeStr)) out.push('Nexus');
  if (/brave/i.test(typeStr)) out.push('Brave');
  return out.length > 0 ? out : ['Spirit'];
}

const diffs = [];
const touchedShards = new Set();

for (const sf of fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.json')).sort()) {
  const shardPath = path.join(SHARD_DIR, sf);
  const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  let shardModified = false;

  for (const [cardKey, card] of Object.entries(shardData)) {
    if (!card || !card.cardNumber || PROTECTED_C3.has(card.cardNumber)) continue;

    for (let abIdx = 0; abIdx < (card.abilities || []).length; abIdx++) {
      const ab = card.abilities[abIdx];
      for (let clIdx = 0; clIdx < (ab.clauses || []).length; clIdx++) {
        const cl = ab.clauses[clIdx];
        const op = cl.op;
        const raw = cl.rawText || '';
        if (!op || !op.op) continue;

        const before = JSON.stringify(op);
        let rule = null;

        // 1. BP_DEBUFF: single-clause or explicit opposing target where PREVIOUS_TARGET/missing target was emitted
        if (op.op === 'BP_DEBUFF' && (op.target === 'PREVIOUS_TARGET' || !op.target) && !/\b(?:it|them)\b/i.test(raw)) {
          const m = raw.match(/(?:give\s+(?:(all|every|an?|one|two|three|\d+)\s+(?:battling\s+)?opposing\s+(spirits?(?:\/ultimates?)?|ultimates?))|(all\s+)?(?:battling\s+)?opposing\s+(spirits?(?:\/ultimates?)?|ultimates?)\s+gets?)/i);
          if (m) {
            const qtyWord = m[1] || (m[3] ? 'all' : null);
            const typeStr = m[2] || m[4] || 'Spirit';
            const isAll = Boolean(qtyWord && /^(all|every)$/i.test(qtyWord));
            const count = (!isAll && qtyWord) ? parseNum(qtyWord) : undefined;
            op.target = {
              side: 'opp',
              types: parseTypesFromText(typeStr),
              ...(/\bbattling\b/i.test(raw) ? { state: 'BATTLING' } : {})
            };
            if (isAll) op.all = true;
            else if (count && count > 1) op.count = count;
            if (!op.duration && /during\s+this\s+battle/i.test(raw)) op.duration = 'DURING_THIS_BATTLE';
            if (!op.duration && /during\s+this\s+turn/i.test(raw)) op.duration = 'DURING_THIS_TURN';
            rule = 'BP_DEBUFF_EXPLICIT_OPPOSING_TARGET';
          }
        }

        // 2. MILL: missing side or count when explicitly in rawText
        if (op.op === 'MILL' && (!op.side || op.count === undefined)) {
          const hasSelfDeck = /(?:from\s+your\s+decktop|top\s+of\s+your\s+deck)/i.test(raw);
          const hasOppDeck = /(?:from\s+(?:the\s+)?opposing\s+decktop|top\s+of\s+(?:the\s+)?(?:opposing|opponent's)\s+deck)/i.test(raw);
          if (!op.side && (hasSelfDeck || hasOppDeck)) {
            op.side = hasOppDeck ? 'opp' : 'self';
            rule = 'MILL_EXPLICIT_SIDE';
          }
          if (op.count === undefined) {
            const mc = raw.match(/(?:send|discard)\s+(\d+|[a-z]+)\s+cards?/i);
            const n = mc ? parseNum(mc[1]) : null;
            if (n !== null) {
              op.count = n;
              rule = rule ? `${rule}+COUNT` : 'MILL_EXPLICIT_COUNT';
            }
          }
        }

        // 3. BOUNCE: "return this card from your Trash to the Hand"
        if (op.op === 'BOUNCE' && op.target?.side === 'either' && /return\s+this\s+card\s+from\s+your\s+trash\s+to\s+(?:the|your)\s+hand/i.test(raw)) {
          op.from = 'grave';
          op.destination = 'HAND';
          op.target = 'self';
          rule = 'BOUNCE_SELF_TRASH_TO_HAND';
        }

        // 4. Bare-stub / parameter-incomplete closures grounded in rawText
        const paramKeys = Object.keys(op).filter(k => k !== 'op');
        if (paramKeys.length === 0) {
          if (op.op === 'DECK_ACTION') {
            const m = raw.match(/reveal\s+(?:the\s+top\s+(?:(\d+|[a-z]+)\s+)?cards?|top\s+(\d+|[a-z]+)\s+cards?)\s+of\s+(your|the\s+opposing|your\s+opponent's)\s+deck/i);
            if (m) {
              const cnt = parseNum(m[1] || m[2]) || 1;
              op.action = 'REVEAL_TOP';
              op.count = cnt;
              op.side = /opp/i.test(m[3]) ? 'opp' : 'self';
              rule = 'DECK_ACTION_REVEAL_TOP';
            }
          } else if (op.op === 'REVEAL_CARDS') {
            const m = raw.match(/look\s+at\s+(?:the\s+)?top\s+(\d+|[a-z]+)?\s*cards?\s+of\s+(your|the\s+opposing|your\s+opponent's)\s+deck/i);
            if (m) {
              op.count = parseNum(m[1]) || 1;
              op.side = /opp/i.test(m[2]) ? 'opp' : 'self';
              op.from = 'decktop';
              rule = 'REVEAL_CARDS_LOOK_TOP';
            }
          } else if (op.op === 'TOKEN_DEPLOYMENT') {
            const nameM = raw.match(/"([^"]+)"\s*Tokens?/i);
            const cntM = raw.match(/(?:send\s+out|deploy|summon)\s+(\d+|one|two|three|four|five|a|an)\s+/i);
            if (nameM) {
              op.tokenName = nameM[1];
              op.count = parseNum(cntM?.[1]) || 1;
              op.side = 'self';
              rule = 'TOKEN_DEPLOYMENT_EXPLICIT';
            }
          } else if (op.op === 'DECK_RULE' && /any\s+(?:number|amount)\s+of\s+copies/i.test(raw)) {
            op.maxCopies = 'UNLIMITED';
            op.rule = 'UNLIMITED_COPIES';
            rule = 'DECK_RULE_UNLIMITED_COPIES';
          } else if (op.op === 'ADVENT_RULE' && /\[advent\]/i.test(raw)) {
            op.when = 'WHEN_ELIGIBLE';
            op.fromZone = /trash/i.test(raw) ? 'grave' : 'hand';
            op.adventType = 'ADVENT';
            rule = 'ADVENT_RULE_EXPLICIT';
          }
        }

        const after = JSON.stringify(op);
        if (before !== after) {
          shardModified = true;
          touchedShards.add(sf);
          diffs.push({
            shard: sf,
            cardNumber: card.cardNumber,
            cardKey,
            abilityIndex: abIdx,
            clauseIndex: clIdx,
            rule,
            rawText: raw,
            before: JSON.parse(before),
            after: JSON.parse(after),
          });
        }
      }
    }
  }

  if (shardModified) {
    fs.writeFileSync(shardPath, JSON.stringify(shardData, null, 2));
  }
}

const byRule = {};
for (const d of diffs) byRule[d.rule] = (byRule[d.rule] || 0) + 1;

const out = {
  generatedAt: new Date().toISOString(),
  touchedShardsCount: touchedShards.size,
  touchedShards: [...touchedShards].sort(),
  totalMigratedClauses: diffs.length,
  byRule,
  diffs,
};
fs.writeFileSync('reports/work_package_hij2/shard_migration_diff_hij2.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  touchedShardsCount: out.touchedShardsCount,
  totalMigratedClauses: out.totalMigratedClauses,
  byRule: out.byRule,
}, null, 2));
