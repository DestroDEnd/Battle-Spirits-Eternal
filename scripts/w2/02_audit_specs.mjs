import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('data/keyword_specs').filter(f => f.endsWith('.json'));
let genericResolutionCount = 0;
const genericList = [];
const nonGenericList = [];

for (const file of files) {
  const spec = JSON.parse(fs.readFileSync(path.join('data/keyword_specs', file), 'utf8'));
  const res = typeof spec.resolution === 'string' ? spec.resolution : JSON.stringify(spec.resolution || '');
  if (/mutates game state as specified/i.test(res)) {
    genericResolutionCount++;
    genericList.push({ file, id: spec.canonical_id, name: spec.canonical_name, resolution: res });
  } else {
    nonGenericList.push({ file, id: spec.canonical_id, name: spec.canonical_name, resolution: res });
  }
}

console.log('Total files checked:', files.length);
console.log('Generic resolution count:', genericResolutionCount);
console.log('Non-generic resolution count:', nonGenericList.length);
console.log('Sample generic:', genericList.slice(0, 3));
console.log('Sample non-generic:', nonGenericList.slice(0, 3));
