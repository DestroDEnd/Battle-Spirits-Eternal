import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      searchDir(full);
    } else if (item.name.endsWith('.md') || item.name.endsWith('.json') || item.name.endsWith('.test.js')) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('257') && (content.includes('fail') || content.includes('pass') || content.includes('test') || content.includes('17'))) {
          console.log('Match in:', full);
          const lines = content.split('\n');
          lines.forEach((l, idx) => {
            if (l.includes('257')) {
              console.log('  L' + (idx+1) + ': ' + l.trim().slice(0, 120));
            }
          });
        }
      } catch (e) {}
    }
  }
}
searchDir('reports');
searchDir('tests');
