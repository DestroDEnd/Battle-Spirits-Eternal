import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const STAGING_DIR = path.join(ROOT, 'data', 'ir_shards_staging');
const PROD_DIR = path.join(ROOT, 'data', 'ir_shards');
const BACKUP_DIR = path.join(ROOT, 'data', 'ir_shards_pre_compilation_backup');
const OUT_DIR = path.join(ROOT, 'reports', 'phase4c3_2_3_full_identity_compilation');

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

console.log('Starting Atomic Promotion of 514 Shards...');

// 1. Verify staging directory has all 514 files
const stagingFiles = fs.readdirSync(STAGING_DIR).filter(f => f.endsWith('.json')).sort();
if (stagingFiles.length !== 514) {
  throw new Error(`Cannot promote: Staging directory contains ${stagingFiles.length} files, expected 514.`);
}

// 2. Load compiled manifest
const manifestRaw = fs.readFileSync(path.join(OUT_DIR, 'compiled_shard_manifest.json'), 'utf8');
const compiledManifest = JSON.parse(manifestRaw);

// 3. Backup original shards if backup does not already exist
if (!fs.existsSync(BACKUP_DIR)) {
  console.log(`Creating pre-compilation backup in ${BACKUP_DIR}...`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const prodFiles = fs.readdirSync(PROD_DIR).filter(f => f.endsWith('.json'));
  for (const file of prodFiles) {
    fs.copyFileSync(path.join(PROD_DIR, file), path.join(BACKUP_DIR, file));
  }
  console.log(`Backed up ${prodFiles.length} original files.`);
} else {
  console.log(`Backup directory ${BACKUP_DIR} already exists. Retaining original backup.`);
}

// 4. Promote all 514 files from staging to production
console.log(`Promoting 514 files to ${PROD_DIR}...`);
let promotedCount = 0;
for (const file of stagingFiles) {
  const src = path.join(STAGING_DIR, file);
  const dest = path.join(PROD_DIR, file);
  const buf = fs.readFileSync(src);
  const hash = sha256Buffer(buf);
  const expectedHash = compiledManifest[file]?.sha256;
  if (hash !== expectedHash) {
    throw new Error(`Staging hash mismatch on ${file}: got ${hash}, expected ${expectedHash}`);
  }
  fs.writeFileSync(dest, buf);
  promotedCount++;
}

// 5. Verify all production files
console.log('Verifying promoted files in production directory...');
let verifyMismatch = 0;
for (const file of stagingFiles) {
  const dest = path.join(PROD_DIR, file);
  const buf = fs.readFileSync(dest);
  const hash = sha256Buffer(buf);
  const expectedHash = compiledManifest[file]?.sha256;
  if (hash !== expectedHash) {
    verifyMismatch++;
    console.error(`Verification failure on ${file} after promotion!`);
  }
}

if (verifyMismatch > 0) {
  throw new Error(`Atomic promotion failed with ${verifyMismatch} verification errors!`);
}

const promotionRecord = {
  promotedAt: new Date().toISOString(),
  stagingSource: STAGING_DIR,
  productionDestination: PROD_DIR,
  backupLocation: BACKUP_DIR,
  totalFilesPromoted: promotedCount,
  verificationMismatches: verifyMismatch,
  status: 'SUCCESS'
};

fs.writeFileSync(
  path.join(OUT_DIR, 'promotion_record.json'),
  JSON.stringify(promotionRecord, null, 2),
  'utf8'
);

console.log('Atomic Promotion Completed Successfully:');
console.log(JSON.stringify(promotionRecord, null, 2));
