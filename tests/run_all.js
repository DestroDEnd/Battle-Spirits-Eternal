import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const testFiles = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.test.js'))
  .map(f => path.join('tests', f));

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
