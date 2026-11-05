import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');

const SETS_PROMOS = [
  '10','1000','24TH','7','AUG','AUGUST','BATTLE','BATTLERS','BOX','CBX01',
  'COST','DEC','DOUBLE','DS','EXTREME','FEB','FRIENDLY','GLADIATOR','GOD','GODZILLA',
  'HIGH','JAN','KEROKERO','KERORO','KFC','LIMITED','LORD','MANGA','MARCH','MAY',
  'MISC','NOV','OCT','REVIVE','SAIKYO','SAIKYOU','SEP','SHOP','SIX','SJ',
  'STRONGEST','STRUCTURE','SUN','TWELVE','ULTIMATE','V','X005','ZOMBIE',
  '2011','2014','2015','2016','EX13','LM14','LM15','SJ12','SJ13','SJ14','SJ17','X13'
];

test('Phase 20 (Promos & Special Sets) - 100% Zero-Unsupported Gate across All Sets', () => {
  let totalCards = 0;
  let effectCards = 0;
  let totalClauses = 0;
  let unsupportedClauses = 0;

  for (const setCode of SETS_PROMOS) {
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

  assert.strictEqual(unsupportedClauses, 0, 'Phase 20 must have 0 unsupported clauses');
  assert.strictEqual(effectCards, 1621, 'Phase 20 must cover exactly 1621 effect cards');
  assert.strictEqual(totalClauses, 4630, 'Phase 20 must compile exactly 4630 clauses');
});
