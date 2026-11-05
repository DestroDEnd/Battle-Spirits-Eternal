import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_2008 = ['BS01', 'BS02', 'SD01', 'SD02'];

test('Phase 1 (2008) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_2008) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 1 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 262, 'Phase 1 must cover exactly 262 effect cards');
  assert.strictEqual(totalClauses, 449, 'Phase 1 must compile exactly 449 clauses');
});

test('Phase 1 (2008) - Mechanics: Siegfried (BS01-X01) Awaken + When Destroyed', () => {
  const p = path.join(EFFECTS_DIR, 'BS01.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS01-X01'];
  assert.ok(card, 'BS01-X01 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS01-X01', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.keywords.some(k => k.name === 'Awaken'), true, 'Must have Awaken keyword');
  assert.strictEqual(ir.abilities.length, 2, 'Must have 2 ability blocks');

  // Ability 0: Flash - Awaken
  const a0 = ir.abilities[0];
  assert.strictEqual(a0.header.isFlash, true);
  assert.strictEqual(a0.clauses[0].op.op, 'AWAKEN_CORE_MOVE');

  // Ability 1: [LV3] (When Destroyed) Put core from Void to Life
  const a1 = ir.abilities[1];
  assert.deepStrictEqual(a1.header.levels, [3]);
  assert.strictEqual(a1.header.timing, 'WHEN_DESTROYED');
  assert.strictEqual(a1.clauses[0].op.op, 'RECOVER_LIFE');
  assert.strictEqual(a1.clauses[0].op.count, 1);
});

test('Phase 1 (2008) - Mechanics: Buster Spear (BS01-114) Multi-Clause Destroy + Draw', () => {
  const p = path.join(EFFECTS_DIR, 'BS01.json');
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  const card = cards['BS01-114'];
  assert.ok(card, 'BS01-114 must exist');

  const ir = card.compiledIr || compileCard({ id: 'BS01-114', ...card });
  assert.strictEqual(ir.isFullySupported, true);
  assert.strictEqual(ir.abilities[0].clauses.length, 2, 'Buster Spear must have 2 chained clauses');

  // Clause 0: Destroy a Nexus
  const cl0 = ir.abilities[0].clauses[0];
  assert.strictEqual(cl0.op.op, 'DESTROY');
  assert.strictEqual(cl0.link, null);

  // Clause 1: If an opposing Nexus is destroyed, draw a card
  const cl1 = ir.abilities[0].clauses[1];
  assert.strictEqual(cl1.op.op, 'DRAW');
  assert.strictEqual(cl1.op.count, 1);
  assert.ok(cl1.condition.includes('opposing Nexus is destroyed'));
});
