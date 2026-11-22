import fs from 'fs';
import path from 'path';

const opsContent = fs.readFileSync('engine/ops/index.js', 'utf8');
const selectorsContent = fs.readFileSync('engine/selectors.js', 'utf8');

const handled = new Set();
const caseRegex = /case\s+['"]([A-Z0-9_]+)['"]\s*:/g;
let m;
while ((m = caseRegex.exec(opsContent)) !== null) handled.add(m[1]);
['TARGET', 'TARGET_CARD', 'TARGET_SELECT', 'SELECT_TARGET', 'TARGET_CARDS', 'CHOOSE_TARGETS'].forEach(o => handled.add(o));

// Read all shard opcodes
const shardDir = 'data/ir_shards';
const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json'));
const corpusOps = new Set();
for (const f of shardFiles) {
  const d = JSON.parse(fs.readFileSync(path.join(shardDir, f), 'utf8'));
  for (const c of Object.values(d)) {
    for (const ab of c.abilities || []) {
      for (const cl of ab.clauses || []) {
        if (cl?.op?.op) corpusOps.add(cl.op.op);
      }
    }
  }
}

const unhandled = [];
for (const op of corpusOps) {
  if (!handled.has(op)) unhandled.push(op);
}

console.log('Corpus unique opcodes:', corpusOps.size);
console.log('Handled in code:', handled.size);
console.log('Unhandled corpus opcodes count:', unhandled.length);
if (unhandled.length > 0) {
  console.log('Unhandled list:', unhandled);
}
