import fs from 'node:fs';

const opsFile = fs.readFileSync('engine/ops/index.js', 'utf8');
const lines = opsFile.split(/\r?\n/);

const cases = [];
lines.forEach((l, idx) => {
  const m = l.match(/case\s+['"]([A-Z0-9_]+)['"]\s*:/);
  if (m) {
    cases.push({ line: idx + 1, opcode: m[1] });
  }
});

console.log('Total case statements:', cases.length);

const targetKeywords = [
  'REVEAL', 'DECK', 'PREV', 'BRAVE', 'BOUNCE', 'SALVAGE', 'TRASH', 'HAND',
  'NEXUS', 'MOVE', 'SUMMON', 'DESTROY', 'DISCARD', 'MILL', 'FLIP', 'SELECT'
];

const matches = cases.filter(c => targetKeywords.some(k => c.opcode.includes(k)));
console.log('Targeting/Movement opcodes found:');
matches.forEach(m => console.log(`${m.line}: ${m.opcode}`));
