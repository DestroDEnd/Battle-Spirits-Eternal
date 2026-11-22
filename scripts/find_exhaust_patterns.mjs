import fs from 'fs';
const content = fs.readFileSync('compiler/clause_patterns.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes("op: 'EXHAUST'") || l.includes('op: "EXHAUST"')) {
    console.log(`${i+1}: ${l}`);
  }
});
