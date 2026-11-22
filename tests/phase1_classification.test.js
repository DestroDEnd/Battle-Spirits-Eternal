import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const STATUS_PATH = path.join(ROOT, 'data', 'card_implementation_status.json');
const REPORT_PATH = path.join(ROOT, 'reports', 'phase1_honest_effect_classification.md');
const IR_SHARDS_DIR = path.join(ROOT, 'data', 'ir_shards');

const ALLOWED_STATUSES = new Set([
  'VERIFIED',
  'PARTIAL',
  'UNIMPLEMENTED',
  'NEEDS_MANUAL_REVIEW'
]);

test('Phase 1 honest classification covers all IR shard cards with valid statuses', () => {
  assert.ok(fs.existsSync(STATUS_PATH), 'data/card_implementation_status.json must exist');
  assert.ok(fs.existsSync(REPORT_PATH), 'reports/phase1_honest_effect_classification.md must exist');

  const statusData = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
  const cards = statusData.cards || {};

  const shardFiles = fs.readdirSync(IR_SHARDS_DIR).filter(f => f.endsWith('.json'));
  const expectedCardNumbers = new Set();
  for (const file of shardFiles) {
    const shard = JSON.parse(fs.readFileSync(path.join(IR_SHARDS_DIR, file), 'utf8'));
    for (const [key, card] of Object.entries(shard)) {
      expectedCardNumbers.add(String(card.cardNumber || card.card_number || key).trim());
    }
  }

  assert.equal(Object.keys(cards).length, expectedCardNumbers.size, 'All canonical card numbers must be classified');

  const computedCounts = {
    VERIFIED: 0,
    PARTIAL: 0,
    UNIMPLEMENTED: 0,
    NEEDS_MANUAL_REVIEW: 0
  };

  for (const cardNumber of expectedCardNumbers) {
    const entry = cards[cardNumber];
    assert.ok(entry, `Missing classification for ${cardNumber}`);
    assert.equal(entry.cardNumber, cardNumber, `Canonical cardNumber mismatch for ${cardNumber}`);
    assert.ok(ALLOWED_STATUSES.has(entry.status), `Invalid status ${entry.status} for ${cardNumber}`);
    computedCounts[entry.status]++;

    if (entry.status === 'VERIFIED' && !entry.hasPerCardRegistry) {
      assert.equal(entry.unsupportedOps.length, 0, `${cardNumber} cannot be VERIFIED with unsupported ops`);
      assert.equal(entry.noopOrDummyOps.length, 0, `${cardNumber} cannot be VERIFIED with no-op/stub ops`);
      assert.equal(entry.unparsedConditions.length, 0, `${cardNumber} cannot be VERIFIED with unparsed conditions`);
    }
  }

  assert.deepEqual(statusData.statusCounts, computedCounts, 'statusCounts must match card entries');
});
