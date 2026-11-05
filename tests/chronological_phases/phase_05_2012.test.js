import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2012 = [
  'BS16', 'BS17', 'BS18', 'BS19', 'BS20',
  'SD10', 'SD11', 'SD13', 'SD14', 'SD15', 'SD16', 'SD17',
  'BSC12', 'SJ12'
];

test('Phase 5 (2012) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2012) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 5 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 410, 'Phase 5 must cover exactly 410 effect cards');
  assert.strictEqual(totalClauses, 1107, 'Phase 5 must compile exactly 1107 clauses');
});

test('Phase 5 (2012) - Mechanics: Starblade-Dragon (BS19-X01) Highest BP & During Brave', () => {
  const p = path.join(EFFECTS_DIR, 'BS19.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS19-X01'];
  assert.ok(card, 'BS19-X01 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS19-X01', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.abilities.length, 3, 'Must have 3 ability blocks');

  // Ability 0: Destroy highest BP
  const a0 = ir.abilities[0];
  assert.strictEqual(a0.header.timing, 'WHEN_ATTACKS');
  assert.strictEqual(a0.clauses[0].op.op, 'DESTROY');
  assert.strictEqual(a0.clauses[0].op.target.side, 'opp');

  // Ability 1: +5000 BP
  const a1 = ir.abilities[1];
  assert.strictEqual(a1.clauses[0].op.op, 'BP_BUFF');
  assert.strictEqual(a1.clauses[0].op.amount, 5000);

  // Ability 2: [During Brave] destroy + life damage
  const a2 = ir.abilities[2];
  assert.ok(a2.header.prefixes.includes('During Brave'));
  assert.strictEqual(a2.clauses[0].op.op, 'DESTROY');
  assert.strictEqual(a2.clauses[1].op.op, 'MOVE_CORE');
});
