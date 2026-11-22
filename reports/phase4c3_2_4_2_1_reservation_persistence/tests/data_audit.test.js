import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'data', 'cards_index.json');
const DETAILED_PATH = path.join(ROOT, 'data', 'cards_detailed.json');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

test('Phase 1 Data Integrity - cards_index.json validation', () => {
  assert.ok(fs.existsSync(INDEX_PATH), 'cards_index.json must exist');
  const raw = fs.readFileSync(INDEX_PATH, 'utf8');
  const index = JSON.parse(raw);
  const count = Object.keys(index).length;
  assert.ok(count >= 14420, `Expected at least 14420 cards in index, found ${count}`);

  for (const [cardNo, c] of Object.entries(index)) {
    assert.ok(cardNo && cardNo.trim().length > 0, 'Card number must be non-empty');
    assert.strictEqual(c.card_number, cardNo, 'Key must match card_number property');
    assert.ok(c.name && c.name.trim().length > 0, `Card ${cardNo} must have a name`);
    assert.ok(c.type && c.type.trim().length > 0, `Card ${cardNo} must have a type`);
    assert.ok(Array.isArray(c.colors) && c.colors.length > 0, `Card ${cardNo} must have colors`);
    assert.ok(Array.isArray(c.symbols), `Card ${cardNo} must have symbols array`);
    assert.ok(typeof c.reduction === 'number' && c.reduction >= 0, `Card ${cardNo} reduction must be >= 0`);
  }
});

test('Phase 1 Data Integrity - cards_detailed.json validation', () => {
  assert.ok(fs.existsSync(DETAILED_PATH), 'cards_detailed.json must exist');
  const raw = fs.readFileSync(DETAILED_PATH, 'utf8');
  const detailed = JSON.parse(raw);
  const count = Object.keys(detailed).length;
  assert.ok(count >= 14420, `Expected at least 14420 cards in detailed, found ${count}`);

  // Test Javad contract partner card specifically
  const javad = detailed['SD65-CX01'];
  assert.ok(javad, 'The PartnerDemonLord Javad (SD65-CX01) must exist');
  assert.strictEqual(javad.name, 'The PartnerDemonLord Javad');
  assert.strictEqual(javad.is_contract_partner, true, 'Javad must be flagged as contract partner');
  assert.strictEqual(javad.type, 'Contract Ultimate');
});

test('Phase 1 Data Integrity - Sharded effects directory validation', () => {
  assert.ok(fs.existsSync(EFFECTS_DIR), 'data/effects/ directory must exist');
  const files = fs.readdirSync(EFFECTS_DIR).filter(f => f.endsWith('.json'));
  assert.ok(files.length > 50, `Expected at least 50 set shards, found ${files.length}`);

  let totalCards = 0;
  for (const f of files) {
    const raw = fs.readFileSync(path.join(EFFECTS_DIR, f), 'utf8');
    const shard = JSON.parse(raw);
    totalCards += Object.keys(shard).length;
  }
  assert.ok(totalCards >= 14607, `Expected at least 14607 total cards across all shards, found ${totalCards}`);
});
