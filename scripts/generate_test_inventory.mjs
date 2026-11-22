import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'reports', 'phase4c3_2_3_full_identity_compilation');

const logPath = path.join(OUT_DIR, 'test_execution_logs.txt');
const logContent = fs.readFileSync(logPath, 'utf8');

const lines = logContent.split(/\r?\n/);
const testRows = [
  'suite,test_id,description,status,duration_ms'
];

let currentSuite = 'general';

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('✔') || trimmed.startsWith('✖')) {
    const isPass = trimmed.startsWith('✔');
    const status = isPass ? 'PASS' : 'FAIL';
    const match = trimmed.match(/[✔✖]\s+([^:]+):\s+(.+?)\s+\(([\d.]+)ms\)/);
    if (match) {
      const testId = match[1].trim();
      const desc = match[2].trim().replace(/"/g, '""');
      const duration = match[3].trim();
      testRows.push(`"${currentSuite}","${testId}","${desc}","${status}",${duration}`);
    } else {
      // Non-colon format e.g. "✔ Phase 1 Data Integrity - cards_index.json validation (161.1182ms)"
      const match2 = trimmed.match(/[✔✖]\s+(.+?)\s+\(([\d.]+)ms\)/);
      if (match2) {
        const fullDesc = match2[1].trim();
        const duration = match2[2].trim();
        const parts = fullDesc.split(' - ');
        const testId = parts.length > 1 ? parts[0].trim() : 'TEST';
        const desc = (parts.length > 1 ? parts.slice(1).join(' - ') : fullDesc).replace(/"/g, '""');
        testRows.push(`"${currentSuite}","${testId}","${desc}","${status}",${duration}`);
      }
    }
  }
}

fs.writeFileSync(path.join(OUT_DIR, 'TEST_INVENTORY.csv'), testRows.join('\n'), 'utf8');
console.log(`Generated TEST_INVENTORY.csv with ${testRows.length - 1} tests.`);
