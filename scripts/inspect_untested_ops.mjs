import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const shardDir = path.join(ROOT, 'data', 'ir_shards');
const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json'));

const opCounts = {};
for (const sf of shardFiles) {
  const content = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
  for (const c of Object.values(content)) {
    for (const ab of (c.abilities || [])) {
      for (const cl of (ab.clauses || [])) {
        const op = cl.op?.op || 'NO_OP';
        opCounts[op] = (opCounts[op] || 0) + 1;
      }
    }
  }
}

const testsDir = path.join(ROOT, 'tests');
const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') || f.endsWith('.mjs'));
const allTestContent = testFiles.map(f => fs.readFileSync(path.join(testsDir, f), 'utf8')).join('\n');

const zeroTests = Object.entries(opCounts).filter(([op]) => !new RegExp(`['"\`]${op}['"\`]|op:\\s*['"\`]${op}['"\`]`).test(allTestContent));
console.log('Zero test opcodes count:', zeroTests.length);
let zeroClauses = 0;
for (const [op, cnt] of zeroTests) {
  zeroClauses += cnt;
  console.log(`  - ${op}: ${cnt} clauses`);
}
console.log('Total zero test clauses:', zeroClauses);
