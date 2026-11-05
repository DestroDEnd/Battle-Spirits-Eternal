import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2019 = [
  'BS47', 'BS48', 'BS49', 'BS50',
  'SD48', 'SD49', 'SD50', 'SD51', 'SD52',
  'BSC33', 'BSC34', 'BSC35',
  'CB08', 'CB09', 'CB10', 'CB11',
  'PB01', 'PB02',
  '2019', 'LM19', 'LM19U', 'P19', 'PX19', 'SJ19'
];

test('Phase 12 (2019) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2019) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 12 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 968, 'Phase 12 must cover exactly 968 effect cards');
  assert.strictEqual(totalClauses, 3947, 'Phase 12 must compile exactly 3947 clauses');
});

test('Phase 12 (2019) - Mechanics: Death-Sire (BS47-X02)', () => {
  const p = path.join(EFFECTS_DIR, 'BS47.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS47-X02'];
  assert.ok(card, 'BS47-X02 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS47-X02', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.ok(ir.abilities.length >= 2, 'Must have at least 2 abilities');
});
