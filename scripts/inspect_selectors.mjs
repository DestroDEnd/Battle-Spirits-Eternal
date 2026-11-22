import fs from 'fs';
const lines = fs.readFileSync('engine/selectors.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('resolveTargets') || line.includes('narrowEitherSideFromClause') || line.includes('either')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
