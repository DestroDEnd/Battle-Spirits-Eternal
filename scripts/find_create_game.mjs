import fs from 'fs';
const lines = fs.readFileSync('engine/index.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('function createGame')) console.log(`${i+1}: ${l}`);
});
