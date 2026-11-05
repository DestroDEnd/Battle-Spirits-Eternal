import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2009 = ['BS03', 'BS04', 'BS05', 'BS06', 'SD03'];

test('Phase 2 (2009) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2009) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 2 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 293, 'Phase 2 must cover exactly 293 effect cards');
  assert.strictEqual(totalClauses, 568, 'Phase 2 must compile exactly 568 clauses');
});

test('Phase 2 (2009) - Mechanics: Hercules (BS03-X09) High Speed + When Summoned', () => {
  const p = path.join(EFFECTS_DIR, 'BS03.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS03-X09'];
  assert.ok(card, 'BS03-X09 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS03-X09', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.keywords.some(k => k.name === 'High Speed'), true, 'Must have High Speed');
  assert.strictEqual(ir.abilities.length, 2, 'Must have 2 abilities');

  // Ability 1: (When Summoned) Refresh all Spirits with [High Speed]
  const a1 = ir.abilities[1];
  assert.strictEqual(a1.header.timing, 'WHEN_SUMMONED');
  assert.strictEqual(a1.clauses[0].op.op, 'REFRESH');
});

test('Phase 2 (2009) - Mechanics: Catastrophedragon (BS06-X21) Ancient Dragon scaling + Clash', () => {
  const p = path.join(EFFECTS_DIR, 'BS06.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS06-X21'];
  assert.ok(card, 'BS06-X21 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS06-X21', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.keywords.some(k => k.name === 'Clash'), true, 'Must recognize Clash keyword');
  assert.strictEqual(ir.abilities.length, 3, 'Must have 3 abilities');

  // Ability 0: For each Ancient Dragon, draw
  const a0 = ir.abilities[0];
  assert.strictEqual(a0.clauses[0].op.op, 'DRAW');
  assert.strictEqual(a0.clauses[0].op.forEach, 'DISCARDED_COUNT' || a0.clauses[0].op.forEach != null, true);

  // Ability 1: [LV2][LV3] [Clash] (When Attacks)
  const a1 = ir.abilities[1];
  assert.strictEqual(a1.header.timing, 'WHEN_ATTACKS');
  assert.strictEqual(a1.header.keyword, 'Clash');

  // Ability 2: [LV3] (When Attacks) When blocked by Cost 5 or less Spirit, refresh this Spirit
  const a2 = ir.abilities[2];
  assert.deepStrictEqual(a2.header.levels, [3]);
  assert.strictEqual(a2.clauses[0].op.op, 'REFRESH');
});
