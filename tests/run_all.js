import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function findTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      results.push(path.relative(rootDir, fullPath));
    }
  }
  return results.sort();
}

const testFiles = findTestFiles(__dirname);

console.log('Running Battle Spirits Eternal Test Suite...\n');
console.log(`Found ${testFiles.length} test suites:`, testFiles.join(', '));

const proc = spawn('node', ['--test', ...testFiles], {
  cwd: rootDir,
  stdio: 'inherit'
});

proc.on('close', (code) => {
  if (code === 0) {
    console.log('\nAll test suites passed successfully.');
  } else {
    console.error(`\nTest run failed with exit code ${code}`);
  }
  process.exit(code);
});
