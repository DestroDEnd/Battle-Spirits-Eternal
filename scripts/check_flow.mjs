import fs from 'fs';
const flowJs = fs.readFileSync('engine/flow.js', 'utf8');
const lines = flowJs.split('\n');
lines.slice(0, 60).forEach((l, i) => console.log(`${i+1}: ${l}`));
