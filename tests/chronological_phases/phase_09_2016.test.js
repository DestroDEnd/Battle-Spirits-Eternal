import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2016 = [
  'BS34', 'BS35', 'BS36', 'BS37', 'BS38',
  'SD33', 'SD34', 'SD35', 'SD36', 'SD37',
  'BSC23', 'BSC24', 'BSC25', 'BSC26', 'BSC28',
  'CB02', '2016', 'LM16', 'P16'
];

test('Phase 9 (2016) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2016) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 9 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 887, 'Phase 9 must cover exactly 887 effect cards');
  assert.strictEqual(totalClauses, 2605, 'Phase 9 must compile exactly 2605 clauses');
});

test('Phase 9 (2016) - Mechanics: Diabolos-Zvei (BS35-X01) Seal & Soul Drive', () => {
  const p = path.join(EFFECTS_DIR, 'BS35.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS35-X01'];
  assert.ok(card, 'BS35-X01 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS35-X01', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.ok(ir.abilities.length >= 2, 'Must have at least 2 abilities');
});
