import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2013 = [
  'BS21', 'BS22', 'BS23', 'BS24', 'BS25',
  'SD19', 'SD20', 'SD21', 'SD22', 'SD23',
  'BSC14', 'BSC15', 'EX13', 'P13', 'PX13', 'SJ13', 'X13'
];

test('Phase 6 (2013) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2013) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 6 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 500, 'Phase 6 must cover exactly 500 effect cards');
  assert.strictEqual(totalClauses, 1408, 'Phase 6 must compile exactly 1408 clauses');
});

test('Phase 6 (2013) - Mechanics: Judgment-Dragonis (BS24-X01) Extra Turn & Clash', () => {
  const p = path.join(EFFECTS_DIR, 'BS24.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS24-X01'];
  assert.ok(card, 'BS24-X01 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS24-X01', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.abilities.length, 3, 'Must have 3 abilities');

  // Ability 1: [Clash]
  const a1 = ir.abilities[1];
  assert.strictEqual(a1.header.keyword, 'Clash');
  assert.strictEqual(a1.clauses[0].op.op, 'FORCE_BLOCK');

  // Ability 2: Extra Turn
  const a2 = ir.abilities[2];
  assert.strictEqual(a2.header.limit, 'ONCE_PER_GAME_SAME_NAME');
  assert.strictEqual(a2.clauses[0].op.op, 'EXTRA_TURN');
});
