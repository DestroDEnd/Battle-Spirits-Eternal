import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('.');
const MANIFEST_PATH = path.join(ROOT, 'reports/work_package_fg/MANIFEST.txt');
const rows = fs.readFileSync(MANIFEST_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
const files = new Set();

for (const row of rows) {
  const match = row.match(/^([a-f0-9]{64})\s+(\d+)\s+(.+)$/);
  if (!match) throw new Error(`Invalid F/G manifest row: ${row}`);
  files.add(match[3]);
}

// Include files added since the previous package manifest was generated.
for (const file of ['tests/work_package_fg_inventory.test.js', 'scripts/generate_work_package_fg_manifest.mjs']) {
  files.add(file);
}

const updatedRows = [];
for (const relativePath of [...files].sort()) {
  const content = fs.readFileSync(path.join(ROOT, relativePath));
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');
  updatedRows.push(`${sha256}  ${content.length}  ${relativePath}`);
}

fs.writeFileSync(MANIFEST_PATH, `${updatedRows.join('\n')}\n`, 'utf8');
console.log(`Generated F/G manifest with ${updatedRows.length} files.`);
