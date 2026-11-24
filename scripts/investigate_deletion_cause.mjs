import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const backupDir = path.join(ROOT, 'backups', 'card_database_pre_recovery_20261124');
const preDetailed = JSON.parse(fs.readFileSync(path.join(backupDir, 'pre_deletion_cards_detailed.json'), 'utf8'));
const curDetailed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));
const missingKeys = Object.keys(preDetailed).filter(k => !curDetailed[k]);

console.log(`Analyzing reasons for deletion of ${missingKeys.length} cards...`);

const reasons = {
  null_or_empty_image: [],
  fallback_or_pending_image: [],
  valid_image_url: []
};

for (const k of missingKeys) {
  const card = preDetailed[k];
  const url = card.image_url;
  if (!url || !String(url).trim()) {
    reasons.null_or_empty_image.push({ key: k, name: card.name, image_url: url });
  } else if (String(url).includes('fallback') || String(url).includes('pending')) {
    reasons.fallback_or_pending_image.push({ key: k, name: card.name, image_url: url });
  } else {
    reasons.valid_image_url.push({ key: k, name: card.name, image_url: url });
  }
}

console.log(`Null or empty image: ${reasons.null_or_empty_image.length}`);
console.log(`Fallback or pending image: ${reasons.fallback_or_pending_image.length}`);
console.log(`Valid image URL: ${reasons.valid_image_url.length}`);

console.log('\nSample of missing cards WITH VALID IMAGE URLS:');
console.log(reasons.valid_image_url.slice(0, 10));

console.log('\nSample of missing cards with NULL/EMPTY image:');
console.log(reasons.null_or_empty_image.slice(0, 5));

console.log('\nSample of missing cards with FALLBACK/PENDING image:');
console.log(reasons.fallback_or_pending_image.slice(0, 5));
