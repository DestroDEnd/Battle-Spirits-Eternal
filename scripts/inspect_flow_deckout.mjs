import fs from 'fs';
const flow = fs.readFileSync('engine/flow.js', 'utf8').split('\n');
flow.forEach((l, i) => {
  if (l.includes('DECK_OUT')) console.log(`${i+1}: ${l}`);
});
