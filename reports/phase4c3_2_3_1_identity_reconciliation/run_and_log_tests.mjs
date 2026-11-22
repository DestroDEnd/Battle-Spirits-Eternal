import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'reports', 'phase4c3_2_3_1_identity_reconciliation');

const testFiles = [
  'tests/physical_ability_identity.test.js',
  'tests/physical_ability_identity_corrective.test.js',
  'tests/physical_ability_identity_final.test.js',
  'tests/physical_ability_identity_integrity.test.js',
  'tests/runtime_activation_limits.test.js',
  'tests/golden_compiler.test.js',
  'tests/data_audit.test.js'
];

console.log('Running test suites directly with Node.js UTF-8 output...');
const res = spawnSync('node', ['--test', ...testFiles], {
  cwd: ROOT,
  encoding: 'utf8'
});

const output = (res.stdout || '') + (res.stderr || '');
fs.writeFileSync(path.join(OUT_DIR, 'test_execution_logs.txt'), output, 'utf8');

const lines = output.split(/\r?\n/);
const testRows = [
  'suite,test_id,description,status,duration_ms'
];

let passCount = 0;
let failCount = 0;

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('✔') || trimmed.startsWith('✖')) {
    const isPass = trimmed.startsWith('✔');
    if (isPass) passCount++; else failCount++;
    const status = isPass ? 'PASS' : 'FAIL';

    const matchWithColon = trimmed.match(/^[✔✖]\s+([^:]+):\s+(.+?)\s+\(([\d.]+)ms\)/);
    if (matchWithColon) {
      const testId = matchWithColon[1].trim();
      const desc = matchWithColon[2].trim().replace(/"/g, '""');
      const duration = matchWithColon[3].trim();
      const suite = testId.startsWith('TC-') ? testId.split('-').slice(0, 2).join('-') : 'Compiler/Data';
      testRows.push(`"${suite}","${testId}","${desc}","${status}",${duration}`);
    } else {
      const matchWithoutColon = trimmed.match(/^[✔✖]\s+(.+?)\s+\(([\d.]+)ms\)/);
      if (matchWithoutColon) {
        const fullDesc = matchWithoutColon[1].trim();
        const duration = matchWithoutColon[2].trim();
        const parts = fullDesc.split(' - ');
        const testId = parts.length > 1 ? parts[0].trim() : 'TEST';
        const desc = (parts.length > 1 ? parts.slice(1).join(' - ') : fullDesc).replace(/"/g, '""');
        testRows.push(`"Compiler/Data","${testId}","${desc}","${status}",${duration}`);
      }
    }
  }
}

fs.writeFileSync(path.join(OUT_DIR, 'TEST_INVENTORY.csv'), testRows.join('\n'), 'utf8');
console.log(`Executed: ${passCount + failCount} tests. Passed: ${passCount}, Failed: ${failCount}.`);
console.log(`Saved clean UTF-8 test_execution_logs.txt and TEST_INVENTORY.csv (${testRows.length - 1} entries).`);
