import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const phase4dDir = path.resolve('reports/phase4d');
const files = fs.readdirSync(phase4dDir)
  .filter(f => f !== 'MANIFEST.txt')
  .sort();

let manifestContent = `# Battle Spirits Eternal (BSP) — Phase 4D Deliverables Manifest\n`;
manifestContent += `# Generated At: ${new Date().toISOString()}\n`;
manifestContent += `# Standard: SHA-256 Cryptographic File Integrity Verification\n\n`;

for (const file of files) {
  const filePath = path.join(phase4dDir, file);
  const data = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  const size = data.length;
  manifestContent += `${hash}  ${size.toString().padStart(10, ' ')} bytes  ${file}\n`;
}

fs.writeFileSync(path.join(phase4dDir, 'MANIFEST.txt'), manifestContent, 'utf8');
console.log('Saved reports/phase4d/MANIFEST.txt');
console.log(manifestContent);
