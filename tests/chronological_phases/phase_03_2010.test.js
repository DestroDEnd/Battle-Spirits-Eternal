import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2010 = ['BS07', 'BS08', 'BS09', 'BS10', 'SD04', 'BSC01'];

test('Phase 3 (2010) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2010) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 3 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 256, 'Phase 3 must cover exactly 256 effect cards');
  assert.strictEqual(totalClauses, 552, 'Phase 3 must compile exactly 552 clauses');
});

test('Phase 3 (2010) - Mechanics: Gai-Asura (BS10-X01) Core lock & Ultra Awaken', () => {
  const p = path.join(EFFECTS_DIR, 'BS10.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS10-X01'];
  assert.ok(card, 'BS10-X01 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS10-X01', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.keywords.some(k => k.name === 'Ultra Awaken'), true, 'Must have Ultra Awaken');
  assert.strictEqual(ir.abilities.length, 3, 'Must have 3 abilities');

  // Ability 0: Neither player can remove cores from this Spirit
  const a0 = ir.abilities[0];
  assert.strictEqual(a0.clauses[0].op.op, 'MOVE_CORE');

  // Ability 1: Ultra Awaken (cores put -> refresh)
  const a1 = ir.abilities[1];
  assert.strictEqual(a1.header.isFlash, true);
  assert.strictEqual(a1.clauses[0].op.op, 'MOVE_CORE');

  // Ability 2: LV4 When Attacks cores sent to Void
  const a2 = ir.abilities[2];
  assert.deepStrictEqual(a2.header.levels, [4]);
  assert.strictEqual(a2.header.timing, 'WHEN_ATTACKS');
  assert.strictEqual(a2.clauses[0].op.op, 'MOVE_CORE');
});

test('Phase 3 (2010) - Mechanics: Blacktaurus (BS08-X31) Tribute & Multi-Attack', () => {
  const p = path.join(EFFECTS_DIR, 'BS08.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS08-X31'];
  assert.ok(card, 'BS08-X31 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS08-X31', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.keywords.some(k => k.name === 'Tribute'), true, 'Must recognize Tribute keyword');
});
