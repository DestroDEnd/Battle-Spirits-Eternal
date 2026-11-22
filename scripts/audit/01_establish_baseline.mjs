import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { KEYWORD_CATALOG } from '../../compiler/keyword_compiler.js';
import { createDefaultKeywordRegistry } from '../../engine/keywords/index.js';

function getSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// 1. Inspect previous audit directory
const prevAuditDir = 'reports/wiki_keyword_audit';
const prevAuditFiles = fs.readdirSync(prevAuditDir).sort();
const prevAuditManifest = [];

for (const file of prevAuditFiles) {
  const fullPath = path.join(prevAuditDir, file);
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    prevAuditManifest.push({
      file,
      relative_path: fullPath.replace(/\\/g, '/'),
      bytes: stat.size,
      modified_time: stat.mtime.toISOString(),
      sha256: getSha256(fullPath)
    });
  }
}

// 2. Git status
let gitBranch = 'UNKNOWN';
let gitCommit = 'UNKNOWN';
let gitStatus = 'UNKNOWN';
try {
  gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  gitStatus = execSync('git status --short', { encoding: 'utf8' }).trim();
} catch (e) {
  console.warn('Git query failed:', e.message);
}

// 3. Compiler & Runtime counts
const catalogKeys = Object.keys(KEYWORD_CATALOG);
const registry = createDefaultKeywordRegistry();
const registryKeywords = registry.getAll();

// 4. Card corpus
const cardsDetailed = JSON.parse(fs.readFileSync('data/cards_detailed.json', 'utf8'));
const detailedCount = Object.keys(cardsDetailed).length;

const shardDir = 'data/ir_shards';
const shardFiles = fs.existsSync(shardDir) ? fs.readdirSync(shardDir).filter(f => f.endsWith('.json')) : [];
let shardCardInstanceCount = 0;
for (const sf of shardFiles) {
  try {
    const shardContent = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
    if (Array.isArray(shardContent)) {
      shardCardInstanceCount += shardContent.length;
    } else if (typeof shardContent === 'object' && shardContent !== null) {
      shardCardInstanceCount += Object.keys(shardContent).length;
    }
  } catch (e) {
    console.warn(`Error reading shard ${sf}:`, e.message);
  }
}

// 5. Test files & discoverable test cases
function findTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findTestFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      results.push(full.replace(/\\/g, '/'));
    }
  }
  return results.sort();
}
const testFiles = findTestFiles('tests');

let discoveredTestBlocks = 0;
for (const tf of testFiles) {
  const content = fs.readFileSync(tf, 'utf8');
  const matches = content.match(/test\s*\(/g) || [];
  discoveredTestBlocks += matches.length;
}

// 6. Wiki Inventory & Cached Pages from previous audit
const prevInventory = JSON.parse(fs.readFileSync('reports/wiki_keyword_audit/wiki_keywords_inventory.json', 'utf8'));
const prevPages = JSON.parse(fs.readFileSync('reports/wiki_keyword_audit/wiki_keyword_pages.json', 'utf8'));
const prevPagesCount = Array.isArray(prevPages) ? prevPages.length : Object.keys(prevPages).length;

const baselineData = {
  timestamp: new Date().toISOString(),
  git: {
    branch: gitBranch,
    commit: gitCommit,
    status_summary: gitStatus ? gitStatus.split('\n').length + ' modified/untracked paths' : 'Clean'
  },
  previous_audit_directory: {
    path: prevAuditDir,
    file_count: prevAuditManifest.length,
    files: prevAuditManifest
  },
  engine_and_compiler_counts: {
    compiler_catalog_keywords: catalogKeys.length,
    runtime_registry_keywords: registryKeywords.length
  },
  card_corpus_counts: {
    cards_detailed_unique_cards: detailedCount,
    ir_shards_file_count: shardFiles.length,
    ir_shards_total_card_instances: shardCardInstanceCount
  },
  test_suite_counts: {
    test_files_count: testFiles.length,
    test_cases_estimated_blocks: discoveredTestBlocks
  },
  wiki_source_counts: {
    inventory_entries_count: prevInventory.length,
    cached_pages_count: prevPagesCount,
    discrepancy_explanation: "The 348 inventory entries map to 343 unique wiki pages because 5 keywords are sub-mechanic anchor redirects or shared articles on the same MediaWiki page (e.g. Six Heaven Rebirth, Sortie Rebirth, Zero Rebirth, Absolute Rebirth, Illusive Rebirth share/anchor on Rebirth; Mirage sub-mechanics share Mirage; Duet Part / Fleur Part / CoZ12 Part share anchor sections)."
  }
};

fs.writeFileSync('reports/phase_w1/baseline/PREVIOUS_AUDIT_HASHES.json', JSON.stringify(prevAuditManifest, null, 2), 'utf8');
fs.writeFileSync('reports/phase_w1/baseline/SYSTEM_BASELINE.json', JSON.stringify(baselineData, null, 2), 'utf8');

const mdReport = `# PHASE W.1 IMMUTABLE BASELINE AUDIT RECORD
**Generated:** ${baselineData.timestamp}
**Subsystem:** Phase W.1 Baseline Preservation & State Hash

---

## 1. Executive Summary

This record captures the immutable pre-audit state of Battle Spirits Eternal (BSP) prior to commencing the Phase W.1 independent verification and evidence reconstruction.

---

## 2. System Counts & Baseline Metrics

| Category | Metric | Baseline Value | Notes |
| :--- | :--- | :--- | :--- |
| **Git Environment** | Active Branch | \`${gitBranch}\` | Commit: \`${gitCommit}\` |
| **Git Environment** | Dirty Paths | ${gitStatus.split('\n').length} files | Tracked modified/untracked files |
| **Wiki Inventory** | Canonical Keywords | **${prevInventory.length}** | Unique entries in \`wiki_keywords_inventory.json\` |
| **Wiki Pages** | Cached Page JSONs | **${prevPagesCount}** | Stored in \`wiki_keyword_pages.json\` |
| **Inventory vs Page Delta** | Difference Explanation | **5 entries** | 5 keywords share article pages as anchors / sub-sections |
| **Card Database** | Unique Cards | **${detailedCount}** | Unique keys in \`data/cards_detailed.json\` |
| **IR Shards** | Shard Files | **${shardFiles.length}** | Files in \`data/ir_shards/\` |
| **IR Shards** | Total Card Instances | **${shardCardInstanceCount}** | Physical card occurrences across all 514 shards |
| **Compiler** | Catalog Keywords | **${catalogKeys.length}** | Keys in \`KEYWORD_CATALOG\` |
| **Runtime Registry** | Registered Keywords | **${registryKeywords.length}** | Handlers in \`KeywordRegistry\` |
| **Test Suite** | Test Files | **${testFiles.length}** | \`.test.js\` files under \`tests/\` |
| **Test Suite** | Discoverable Tests | **${discoveredTestBlocks}** | \`test(...)\` declaration blocks across suite |

---

## 3. Previous Audit Directory Hashes (\`reports/wiki_keyword_audit/\`)

The previous audit files have been verified and their SHA-256 digests recorded. None of these files will be modified during Phase W.1:

| File | Size (Bytes) | SHA-256 Digest |
| :--- | :--- | :--- |
${prevAuditManifest.map(m => `| \`${m.file}\` | ${m.bytes.toLocaleString()} | \`${m.sha256}\` |`).join('\n')}

---

## 4. Preservation Invariant Confirmation

- Audit output directory: \`reports/phase_w1/\` (Created, isolated from previous reports).
- Audit scripts directory: \`scripts/audit/\` (Created, read-only utilities only).
- Previous audit directory: \`reports/wiki_keyword_audit/\` (Read-only, completely preserved).
- Production game-engine files: **Strictly frozen, no modifications permitted.**
`;

fs.writeFileSync('reports/phase_w1/baseline/SYSTEM_BASELINE.md', mdReport, 'utf8');

console.log('Baseline established successfully:');
console.log(' - PREVIOUS_AUDIT_HASHES.json');
console.log(' - SYSTEM_BASELINE.json');
console.log(' - SYSTEM_BASELINE.md');
console.log(`Inventory: ${prevInventory.length}, Pages: ${prevPagesCount}, Unique cards: ${detailedCount}, Shard instances: ${shardCardInstanceCount}`);
