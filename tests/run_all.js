import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Running Battle Spirits Eternal Test Suite...\n');

const proc = spawn('node', ['--test', 'tests/**/*.test.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

proc.on('close', (code) => {
  if (code === 0) {
    console.log('\nAll test suites passed successfully.');
  } else {
    console.error(`\nTest run failed with exit code ${code}`);
  }
  process.exit(code);
});
