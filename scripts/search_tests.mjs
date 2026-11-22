import fs from 'fs';
import path from 'path';

const testDir = 'tests';
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js') || f.endsWith('.js'));

console.log('Searching in tests directory...');

for (const file of files) {
  const fullPath = path.join(testDir, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('257') || content.includes('Kamen') || content.includes('26RCB') || content.includes('CB01') || content.includes('CB02') || content.includes('BOUNCE') || content.includes('EXHAUST')) {
      const lines = content.split('\n');
      const matches = [];
      lines.forEach((l, idx) => {
        if (l.includes('257') || l.includes('Kamen') || l.includes('26RCB') || l.includes('CB01') || l.includes('CB02')) {
          matches.push(`  Line ${idx+1}: ${l.trim().slice(0, 100)}`);
        }
      });
      if (matches.length > 0) {
        console.log('Match in:', file);
        matches.slice(0, 5).forEach(m => console.log(m));
      }
    }
  } catch (e) {}
}
