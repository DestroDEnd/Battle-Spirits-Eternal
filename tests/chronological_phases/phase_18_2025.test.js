import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2025 = [
  'BS71', 'BS72', 'BS73', 'BS74', 'BS75',
  'BSC46', 'BSC47', 'BSC48', 'BSC49', 'BSC50',
  'CB33', 'CB34',
  'PB39', 'PB41', 'PB42', 'PB44', 'PB46', 'PB48'
];

test('Phase 18 (2025) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2025) {
    const p = path.join(EFFECTS_DIR, `${setCode}.json`);
    if (!fs.existsSync(p)) continue;
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 18 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 1107, 'Phase 18 must cover exactly 1107 effect cards');
  assert.strictEqual(totalClauses, 4894, 'Phase 18 must compile exactly 4894 clauses');
});
