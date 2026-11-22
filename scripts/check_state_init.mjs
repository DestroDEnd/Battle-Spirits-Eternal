import fs from 'fs';
const stateJs = fs.readFileSync('engine/state.js', 'utf8');
const lines = stateJs.split('\n');
lines.slice(0, 70).forEach((l, i) => console.log(`${i+1}: ${l}`));
