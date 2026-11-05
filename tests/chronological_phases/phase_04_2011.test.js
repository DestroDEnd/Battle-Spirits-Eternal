import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2011 = ['BS11', 'BS12', 'BS13', 'BS14', 'BS15', 'SD06', 'SD09', 'BSC05', 'BSC09', 'BSC10', '2011'];

test('Phase 4 (2011) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2011) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 4 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 404, 'Phase 4 must cover exactly 404 effect cards');
  assert.strictEqual(totalClauses, 1003, 'Phase 4 must compile exactly 1003 clauses');
});

test('Phase 4 (2011) - Mechanics: Sieg-Yamato-Fried (BS14-X01) Burst & Target Attack', () => {
  const p = path.join(EFFECTS_DIR, 'BS14.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS14-X01'];
  assert.ok(card, 'BS14-X01 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS14-X01', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.abilities.length, 3, 'Must have 3 ability blocks');

  // Ability 0: Burst - After Life is reduced
  const a0 = ir.abilities[0];
  assert.strictEqual(a0.header.timing, 'BURST');
  assert.strictEqual(a0.header.burstCondition, 'AFTER_YOUR_LIFE_REDUCED');
  assert.strictEqual(a0.clauses.length, 2, 'Burst must have 2 chained clauses');
  assert.strictEqual(a0.clauses[0].op.op, 'DESTROY');
  assert.strictEqual(a0.clauses[1].op.op, 'SUMMON_FREE');

  // Ability 1: Target attack
  const a1 = ir.abilities[1];
  assert.strictEqual(a1.header.timing, 'WHEN_ATTACKS');
  assert.strictEqual(a1.clauses[0].op.op, 'TARGET_ATTACK');
});
