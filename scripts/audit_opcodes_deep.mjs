import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const shardDir = path.join(ROOT, 'data', 'ir_shards');
const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json')).sort();

const opClauseCounts = {};
const opCardCounts = {};
const opCardSet = {};

let totalClauses = 0;
let totalAbilities = 0;
let totalCards = 0;

for (const sf of shardFiles) {
  const content = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
  for (const [cardId, card] of Object.entries(content)) {
    totalCards++;
    if (Array.isArray(card.abilities)) {
      totalAbilities += card.abilities.length;
      for (const ab of card.abilities) {
        if (Array.isArray(ab.clauses)) {
          for (const cl of ab.clauses) {
            totalClauses++;
            const op = cl.op?.op || 'NO_OP';
            opClauseCounts[op] = (opClauseCounts[op] || 0) + 1;
            if (!opCardSet[op]) opCardSet[op] = new Set();
            opCardSet[op].add(cardId);
          }
        }
      }
    }
  }
}

for (const [op, set] of Object.entries(opCardSet)) {
  opCardCounts[op] = set.size;
}

// 2. Scan engine/ops/index.js for explicit opcode handlers
const opsFile = path.join(ROOT, 'engine', 'ops', 'index.js');
const opsCode = fs.readFileSync(opsFile, 'utf8');

const explicitHandlerRegex = /case\s+['"]([A-Z0-9_]+)['"]\s*:/g;
const explicitHandlers = new Set();
let match;
while ((match = explicitHandlerRegex.exec(opsCode)) !== null) {
  explicitHandlers.add(match[1]);
}

// 3. Scan tests/ for opcode references in tests
const testsDir = path.join(ROOT, 'tests');
const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') || f.endsWith('.mjs'));

const opTestReferences = {};

for (const tf of testFiles) {
  const content = fs.readFileSync(path.join(testsDir, tf), 'utf8');
  for (const op of Object.keys(opClauseCounts)) {
    // Check if test mentions the opcode specifically
    const pattern = new RegExp(`['"\`]${op}['"\`]|op:\\s*['"\`]${op}['"\`]|resolves\\s+${op}\\b`, 'i');
    if (pattern.test(content)) {
      if (!opTestReferences[op]) opTestReferences[op] = [];
      opTestReferences[op].push(tf);
    }
  }
}

console.log(`Total Opcodes in Corpus: ${Object.keys(opClauseCounts).length}`);
console.log(`Explicit Handlers in engine/ops/index.js: ${explicitHandlers.size}`);
console.log(`Opcodes with direct test references: ${Object.keys(opTestReferences).length}`);

// Print top 20 opcodes
const sortedOps = Object.entries(opClauseCounts).sort((a, b) => b[1] - a[1]);
console.log('\nTop 20 Opcodes:');
for (const [op, cnt] of sortedOps.slice(0, 20)) {
  const hasH = explicitHandlers.has(op);
  const tests = opTestReferences[op] || [];
  console.log(`- ${op}: ${cnt} clauses, ${opCardCounts[op]} cards, handler: ${hasH}, tests: ${tests.length}`);
}

// Opcodes without explicit handler
const missingHandlers = sortedOps.filter(([op]) => !explicitHandlers.has(op));
console.log(`\nOpcodes without explicit case in engine/ops/index.js (${missingHandlers.length}):`);
for (const [op, cnt] of missingHandlers) {
  console.log(`- ${op}: ${cnt} clauses, ${opCardCounts[op]} cards`);
}
