import fs from 'node:fs';

console.log('=== VALIDATING BATTLE SPIRITS UI ASSETS ===');

// 1. CSS Syntax & Brace Balance
const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split('\n');
let depth = 0;
let inComment = false;
let cssErrors = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (!inComment && line[j] === '/' && line[j+1] === '*') {
      inComment = true;
      j++;
      continue;
    }
    if (inComment && line[j] === '*' && line[j+1] === '/') {
      inComment = false;
      j++;
      continue;
    }
    if (inComment) continue;

    if (line[j] === '{') depth++;
    else if (line[j] === '}') {
      depth--;
      if (depth < 0) {
        console.error(`styles.css: Unexpected closing brace at line ${i + 1}`);
        cssErrors++;
        depth = 0;
      }
    }
  }
}
if (depth !== 0) {
  console.error(`styles.css: Unbalanced braces at end of file (depth: ${depth})`);
  cssErrors++;
} else {
  console.log(`✔ styles.css: syntax & brace balance verified (${lines.length} lines)`);
}

// 2. HTML Files & Assets
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let assetErrors = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/g;
  let m;
  while ((m = scriptRegex.exec(content)) !== null) {
    const s = m[1];
    if (s.startsWith('http://') || s.startsWith('https://')) continue;
    const cleanPath = s.split('?')[0].replace(/^\//, '');
    if (!fs.existsSync(cleanPath)) {
      console.error(`[${file}] Missing script: ${s}`);
      assetErrors++;
    }
  }
}
if (assetErrors === 0) {
  console.log(`✔ ${htmlFiles.length} HTML files: static asset references verified`);
}

if (cssErrors === 0 && assetErrors === 0) {
  console.log('All UI validations passed successfully!\n');
} else {
  process.exit(1);
}
