/**
 * scripts/audit_release_readiness_architecture.mjs
 * 
 * Deep architectural and subsystem audit script for Release Readiness Program (Phase A & B).
 */

import fs from 'fs';
import path from 'path';

console.log('=== Battle Spirits Eternal — Architectural & Subsystem Deep Audit ===\n');

// 1. Analyze Engine Modules
const engineDir = path.resolve('engine');
const engineFiles = fs.readdirSync(engineDir).filter(f => f.endsWith('.js'));

console.log(`Found ${engineFiles.length} top-level engine modules:`);
const moduleAnalysis = {};

for (const file of engineFiles) {
  const content = fs.readFileSync(path.join(engineDir, file), 'utf8');
  const lines = content.split('\n');
  const importLines = lines.filter(l => l.startsWith('import '));
  const exportLines = lines.filter(l => l.startsWith('export '));
  
  // Extract imported modules
  const imports = [];
  const impRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = impRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Extract exported names
  const exports = [];
  const expRegex = /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z0-9_]+)/g;
  while ((match = expRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  moduleAnalysis[file] = {
    lineCount: lines.length,
    imports,
    exports,
    hasStateMutation: /state\.players|state\.turn|state\.step|state\.battle|state\.combat/.test(content),
    hasAsync: /async\s+function|await\s+/.test(content)
  };
}

// 2. Extract All Opcodes from 514 IR Shards
const shardDir = path.resolve('data/ir_shards');
const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json'));

const corpusOpcodes = new Map(); // opcode -> { count, cardNumbers: Set, clauses: [] }
let totalAbilities = 0;
let totalClauses = 0;
let totalCardsInShards = 0;
const uniqueShardCardNumbers = new Set();

for (const sf of shardFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
  for (const [cardNum, cardData] of Object.entries(data)) {
    totalCardsInShards++;
    uniqueShardCardNumbers.add(cardNum);
    for (const ab of cardData.abilities || []) {
      totalAbilities++;
      for (const cl of ab.clauses || []) {
        totalClauses++;
        const opName = cl?.op?.op;
        if (opName) {
          if (!corpusOpcodes.has(opName)) {
            corpusOpcodes.set(opName, { count: 0, cards: new Set(), samples: [] });
          }
          const entry = corpusOpcodes.get(opName);
          entry.count++;
          entry.cards.add(cardNum);
          if (entry.samples.length < 3) {
            entry.samples.push({
              cardNumber: cardNum,
              op: cl.op,
              cleanText: cl.cleanText || cl.rawText
            });
          }
        }
      }
    }
  }
}

console.log(`Corpus Shards Analysis:`);
console.log(`- Shard Files: ${shardFiles.length}`);
console.log(`- Shard Card Entries: ${totalCardsInShards}`);
console.log(`- Unique Shard Cards: ${uniqueShardCardNumbers.size}`);
console.log(`- Total Abilities: ${totalAbilities}`);
console.log(`- Total Clauses: ${totalClauses}`);
console.log(`- Unique Opcodes: ${corpusOpcodes.size}`);

// 3. Inspect Opcodes Handled in engine/ops/index.js
const opsIndexContent = fs.readFileSync('engine/ops/index.js', 'utf8');
const handledOpCases = new Set();
const caseRegex = /case\s+['"]([A-Z0-9_]+)['"]\s*:/g;
let cm;
while ((cm = caseRegex.exec(opsIndexContent)) !== null) {
  handledOpCases.add(cm[1]);
}

// Check other handlers
const selectorsContent = fs.readFileSync('engine/selectors.js', 'utf8');
const targetingOps = ['TARGET', 'TARGET_CARD', 'TARGET_SELECT', 'SELECT_TARGET', 'TARGET_CARDS', 'CHOOSE_TARGETS'];
for (const t of targetingOps) {
  if (selectorsContent.includes(t)) handledOpCases.add(t);
}

console.log(`\nOpcode Handlers in engine/ops/index.js + selectors.js: ${handledOpCases.size}`);

// Compare corpus opcodes vs handled opcodes
const supportedCorpusOps = [];
const missingCorpusOps = [];

for (const [op, info] of corpusOpcodes.entries()) {
  if (handledOpCases.has(op)) {
    supportedCorpusOps.push({ op, count: info.count, cardCount: info.cards.size });
  } else {
    missingCorpusOps.push({ op, count: info.count, cardCount: info.cards.size, sample: info.samples[0] });
  }
}

// Sort missing opcodes by affected card count descending
missingCorpusOps.sort((a, b) => b.cardCount - a.cardCount);
supportedCorpusOps.sort((a, b) => b.cardCount - a.cardCount);

console.log(`- Handled Opcodes in Corpus: ${supportedCorpusOps.length}`);
console.log(`- Missing / Unhandled Opcodes in Corpus: ${missingCorpusOps.length}`);
console.log('\nTop 15 Missing Opcodes by Card Impact:');
missingCorpusOps.slice(0, 15).forEach((m, idx) => {
  console.log(`  ${idx + 1}. ${m.op}: ${m.cardCount} cards (${m.count} clauses) - sample: "${m.sample?.cleanText?.slice(0, 60)}..."`);
});

// Save intermediate architecture audit data
const auditData = {
  timestamp: new Date().toISOString(),
  modules: moduleAnalysis,
  corpus: {
    shardFilesCount: shardFiles.length,
    shardCardEntries: totalCardsInShards,
    uniqueShardCardsCount: uniqueShardCardNumbers.size,
    totalAbilities,
    totalClauses,
    uniqueOpcodesCount: corpusOpcodes.size,
    handledOpcodesCount: supportedCorpusOps.length,
    missingOpcodesCount: missingCorpusOps.length
  },
  missingOpcodes: missingCorpusOps.map(m => ({
    op: m.op,
    cardCount: m.cardCount,
    clauseCount: m.count,
    sampleCard: m.sample?.cardNumber,
    sampleText: m.sample?.cleanText
  })),
  handledOpcodes: supportedCorpusOps.map(s => ({
    op: s.op,
    cardCount: s.cardCount,
    clauseCount: s.count
  }))
};

fs.writeFileSync('reports/release_readiness/architecture_audit_data.json', JSON.stringify(auditData, null, 2));
console.log('\nSaved reports/release_readiness/architecture_audit_data.json');
