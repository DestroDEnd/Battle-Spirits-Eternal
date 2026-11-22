import fs from 'fs';
const lines = fs.readFileSync('engine/ops/index.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes("case 'BOUNCE':") || line.includes("case 'EXHAUST':")) {
    console.log(`${idx + 1}: ${line}`);
  }
});
