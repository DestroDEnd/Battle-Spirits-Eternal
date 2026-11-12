import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('=== Battle Spirits Eternal: Live Website Static Audit ===\n');

const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
const jsFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.js'));

const findings = [];

// 1. Audit Absolute Paths in HTML that break on GitHub Pages
console.log('1. Auditing HTML files for broken absolute root paths...');
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');

  // Script src
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = scriptRegex.exec(content)) !== null) {
    const src = m[1];
    if (src.startsWith('/') && !src.startsWith('//') && !src.startsWith('/Battle-Spirits-Eternal')) {
      findings.push({ file, type: 'BAD_SCRIPT_SRC', path: src });
    }
  }

  // Link href
  const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;
  while ((m = linkRegex.exec(content)) !== null) {
    const href = m[1];
    if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/Battle-Spirits-Eternal')) {
      findings.push({ file, type: 'BAD_LINK_HREF', path: href });
    }
  }

  // Image src
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((m = imgRegex.exec(content)) !== null) {
    const src = m[1];
    if (src.startsWith('/') && !src.startsWith('//') && !src.startsWith('/Battle-Spirits-Eternal')) {
      findings.push({ file, type: 'BAD_IMG_SRC', path: src });
    }
  }

  // Anchor href
  const aRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  while ((m = aRegex.exec(content)) !== null) {
    const href = m[1];
    if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/Battle-Spirits-Eternal') && !href.startsWith('/#')) {
      findings.push({ file, type: 'BAD_A_HREF', path: href });
    }
  }
});

// 2. Audit fetch calls in frontend code
console.log('2. Auditing all fetch() calls in frontend JS and HTML...');
const targetFiles = [...htmlFiles, ...jsFiles.filter(f => !['server.js', 'package.json', 'package-lock.json'].includes(f))];
const fetchCalls = [];

targetFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const fetchRegex = /fetch\(\s*([`'"][^`'"]+[`'"])/g;
  let m;
  while ((m = fetchRegex.exec(content)) !== null) {
    const rawUrl = m[1].replace(/[`'"]/g, '');
    fetchCalls.push({ file, url: rawUrl });
  }
});

// Check if any fetch call points to a root slash path like fetch('/api/...') or fetch('/filters_data.json')
// without being handled by wasm_db or being a bad path on static hosting
console.log(`Found ${fetchCalls.length} static string fetch calls.`);

const uniqueFetches = {};
fetchCalls.forEach(({ file, url }) => {
  const cleanUrl = url.split('?')[0];
  if (!uniqueFetches[cleanUrl]) uniqueFetches[cleanUrl] = [];
  if (!uniqueFetches[cleanUrl].includes(file)) uniqueFetches[cleanUrl].push(file);
});
console.log('Unique fetch endpoints called from client-side code:');
Object.entries(uniqueFetches).forEach(([url, files]) => {
  console.log(` - ${url} (used in: ${files.join(', ')})`);
});

// 3. Audit all local script tags to make sure the target file exists on disk
console.log('3. Verifying all local script and link tag targets exist on disk...');
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const tagRegex = /<(?:script[^>]+src|link[^>]+href)=["']([^"']+)["']/gi;
  let m;
  while ((m = tagRegex.exec(content)) !== null) {
    const target = m[1].split('?')[0].split('#')[0];
    if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('//') && !target.startsWith('data:') && !target.startsWith('javascript:')) {
      let cleanTarget = target.startsWith('./') ? target.slice(2) : target;
      if (cleanTarget.startsWith('/Battle-Spirits-Eternal/')) {
        cleanTarget = cleanTarget.replace('/Battle-Spirits-Eternal/', '');
      }
      if (!fs.existsSync(path.join(rootDir, cleanTarget))) {
        findings.push({ file, type: 'MISSING_LOCAL_FILE', target });
      }
    }
  }
});

console.log('\nAudit complete.');
if (findings.length === 0) {
  console.log('✅ ZERO critical path/asset errors found in HTML files!');
} else {
  console.log(`⚠️ Found ${findings.length} findings:`);
  console.log(JSON.stringify(findings, null, 2));
}

export { findings, fetchCalls };
