/**
 * scripts/generate_phase4d_1_manifest.mjs
 * 
 * Computes SHA-256 hashes for all deliverables in reports/phase4d_1/
 * and generates reports/phase4d_1/MANIFEST.txt
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dir = path.resolve('reports/phase4d_1');
const manifestPath = path.join(dir, 'MANIFEST.txt');

const files = fs.readdirSync(dir)
  .filter(f => f !== 'MANIFEST.txt')
  .sort((a, b) => a.localeCompare(b));

const lines = [
  '# Battle Spirits Eternal (BSP) — Phase 4D.1 Deliverable Manifest',
  `# Generated: ${new Date().toISOString()}`,
  `# Total Deliverables: ${files.length}`,
  '# Format: <SHA-256>  <Filename>',
  '# ------------------------------------------------------------------------------------------------'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  lines.push(`${hash}  ${file}`);
}

const content = lines.join('\n') + '\n';
fs.writeFileSync(manifestPath, content, 'utf8');

console.log(`Generated ${manifestPath} with ${files.length} deliverable hashes.`);
