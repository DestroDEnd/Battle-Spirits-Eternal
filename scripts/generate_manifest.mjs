import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'phase4c3_2_3_full_identity_compilation');

const files = fs.readdirSync(REPORT_DIR)
  .filter(f => f !== 'MANIFEST.txt' && !f.endsWith('.zip'))
  .sort();

const lines = ['# Phase 4C.3.2.3 — Full Identity Compilation Manifest', ''];
for (const file of files) {
  const filePath = path.join(REPORT_DIR, file);
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  lines.push(`${hash}  ${file}`);
}

fs.writeFileSync(path.join(REPORT_DIR, 'MANIFEST.txt'), lines.join('\n') + '\n', 'utf8');
console.log(`Generated MANIFEST.txt with ${files.length} entries.`);
