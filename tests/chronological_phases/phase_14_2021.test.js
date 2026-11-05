import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2021 = [
  'BS55', 'BS56', 'BS57', 'BS58',
  'SD59', 'SD60', 'SD61', 'SD62',
  'BSC38', 'BSC39',
  'CB17', 'CB18', 'CB19', 'CB20', 'CB21',
  'PB12', 'PB13', 'PB14', 'PB15', 'PB16',
  'P21', 'PX21'
];

test('Phase 14 (2021) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2021) {
    const p = path.join(EFFECTS_DIR, `${setCode}.json`);
    assert.ok(fs.existsSync(p), `Set file ${setCode}.json must exist`);
    const cards = JSON.parse(fs.readFileSync(p, 'utf8'));

    for (const [id, card] of Object.entries(cards)) {
      totalCards++;
      if (card.is_vanilla || (!card.effect && !card.burstEffect)) continue;

      effectCards++;
      const ir = card.compiledIr || compileCard({ id, ...card });
      assert.ok(ir, `Card ${id} must compile to IR`);
      assert.strictEqual(ir.unsupportedClausesCount, 0, `Card ${id} (${card.name}) must have 0 unsupported clauses`);
      assert.strictEqual(ir.isFullySupported, true, `Card ${id} must be fully supported`);

      for (const ab of ir.abilities) {
        assert.strictEqual(ab.unsupported.length, 0, `Ability in ${id} must have no unsupported clauses`);
        for (const cl of ab.clauses) {
          totalClauses++;
          assert.ok(cl.op, `Clause in ${id} must have an op`);
          assert.notStrictEqual(cl.op.op, 'UNSUPPORTED', `Clause in ${id} must not have UNSUPPORTED op`);
          assert.notStrictEqual(cl.op.op, 'UNSUPPORTED_CLAUSE', `Clause in ${id} must not have UNSUPPORTED_CLAUSE op`);
        }
      }
    }
  }

  assert.strictEqual(unsupportedClauses, 0, 'Phase 14 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 1050, 'Phase 14 must cover exactly 1050 effect cards');
  assert.strictEqual(totalClauses, 3964, 'Phase 14 must compile exactly 3964 clauses');
});

test('Phase 14 (2021) - Mechanics: True Rebirth Dragon (BS55-TCP07) Supremacy & Rebirth', () => {
  const p = path.join(EFFECTS_DIR, 'BS55.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS55-TCP07'];
  assert.ok(card, 'BS55-TCP07 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS55-TCP07', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.ok(ir.abilities.length >= 2, 'Must have at least 2 abilities');
});
