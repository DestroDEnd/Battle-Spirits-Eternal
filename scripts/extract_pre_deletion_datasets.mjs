import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const backupDir = path.join(ROOT, 'backups', 'card_database_pre_recovery_20261124');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log('Extracting pre-deletion datasets from commit 352b919~1 (c1093da)...');

// 1. cards_detailed.json
console.log('Extracting cards_detailed.json...');
const detailedBuffer = execSync('git show 352b919~1:data/cards_detailed.json', { maxBuffer: 100 * 1024 * 1024 });
fs.writeFileSync(path.join(backupDir, 'pre_deletion_cards_detailed.json'), detailedBuffer);
console.log(`Saved pre_deletion_cards_detailed.json (${detailedBuffer.length} bytes)`);

// 2. card_artworks.json
console.log('Extracting card_artworks.json...');
const artworksBuffer = execSync('git show 352b919~1:data/card_artworks.json', { maxBuffer: 50 * 1024 * 1024 });
fs.writeFileSync(path.join(backupDir, 'pre_deletion_card_artworks.json'), artworksBuffer);
console.log(`Saved pre_deletion_card_artworks.json (${artworksBuffer.length} bytes)`);

// 3. cards_index.json
console.log('Extracting cards_index.json...');
const indexBuffer = execSync('git show 352b919~1:data/cards_index.json', { maxBuffer: 50 * 1024 * 1024 });
fs.writeFileSync(path.join(backupDir, 'pre_deletion_cards_index.json'), indexBuffer);
console.log(`Saved pre_deletion_cards_index.json (${indexBuffer.length} bytes)`);


console.log('Pre-deletion extraction complete.');
