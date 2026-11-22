/**
 * scripts/generate_phase_k_manifest.mjs
 * 
 * Computes cryptographic SHA-256 checksums and file sizes for all authoritative
 * deliverables in reports/phase_k/ and outputs reports/phase_k/FINAL_SHA256_MANIFEST.txt.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'reports', 'phase_k');
const MANIFEST_PATH = path.join(DIR, 'FINAL_SHA256_MANIFEST.txt');

function computeSha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const allFiles = fs.readdirSync(DIR).filter(f => f !== 'FINAL_SHA256_MANIFEST.txt').sort();

const lines = [
  '# Battle Spirits Eternal (BSP) — Phase K Deliverables Manifest',
  `# Generated At: ${new Date().toISOString()}`,
  '# Standard: SHA-256 Cryptographic File Integrity Verification',
  `# Total Artifacts Verified: ${allFiles.length}`,
  ''
];

console.log(`Generating Phase K SHA-256 manifest for ${allFiles.length} files...`);

for (const file of allFiles) {
  const fullPath = path.join(DIR, file);
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) continue;
  const hash = computeSha256(fullPath);
  const sizeStr = `${stat.size} bytes`.padStart(16, ' ');
  lines.push(`${hash}  ${sizeStr}  ${file}`);
  console.log(`  ✓ ${file} (${stat.size} bytes)`);
}

lines.push('');
fs.writeFileSync(MANIFEST_PATH, lines.join('\n'), 'utf8');
console.log(`\nManifest successfully written to ${path.relative(ROOT, MANIFEST_PATH)}.`);
