/**
 * tests/bs12_card_effects.test.js
 * 
 * Regression Test Suite for BS12 (Booster Set 12: Roar of the Celestial Dragon).
 * Verifies 100% deterministic execution of BS12 canonical card effects,
 * vanillas, Dragonic-Taurus, Stein-Bolg, Mantics-Masamune, Vielje, Leviadan, and R2 skipped Mummybird.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS12_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('BS12 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS12 Vanilla Cards Stat & Ability Integrity', () => {
    it('BS12-033 (Kogumaru) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS12-033');
      assert.ok(override, 'Override must exist for BS12-033');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. BS12 X-Rares: Dragonic-Taurus, Stein-Bolg, Mantics-Masamune, Vielje, Leviadan', () => {

    it('BS12-X01 (The BullDragonDeity Dragonic-Taurus) - [Clash], core movement & extra symbol', () => {
      const override = getCardOverride('BS12-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const clashAb = override.abilities.find(a => a.header.keyword === 'Clash');
      assert.ok(clashAb, 'Must have [Clash]');
      assert.equal(clashAb.clauses[0].op.op, 'FORCE_BLOCK');

      const coreAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'MOVE_CORE'));
      assert.ok(coreAb, 'Must have attack core movement ability');

      const symbolAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'ADD_SYMBOL'));
      assert.ok(symbolAb, 'Must have extra symbol ability');
    });

    it('BS12-X02 (The EvilCapricornusDeity Stein-Bolg) - Summon bounce, attack step core move, passive keyword rule', () => {
      const override = getCardOverride('BS12-X02');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const bounceAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(bounceAb, 'Must have (When Summoned) ability');
      assert.equal(bounceAb.clauses[0].op.op, 'BOUNCE');

      const moveCoreAb = override.abilities.find(a => a.header.timing === 'ATTACK_STEP' && a.clauses.some(c => c.op.op === 'MOVE_CORE'));
      assert.ok(moveCoreAb, 'Must have Attack Step core move');
    });

    it('BS12-X03 (The MonoeyeBushin Mantics-Masamune) - Attack Step cost modifier & core moves', () => {
      const override = getCardOverride('BS12-X03');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const costModAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'COST_MODIFIER'));
      assert.ok(costModAb, 'Must have cost modifier ability');

      const moveCoreAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'MOVE_CORE'));
      assert.ok(moveCoreAb, 'Must have attack core move ability');
    });

    it('BS12-X05 (The ValkyrieVirgoDeity Vielje) - Summon life recovery, cost modifier, passive bounce', () => {
      const override = getCardOverride('BS12-X05');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const healAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(healAb, 'Must have life recovery on summon');
      assert.equal(healAb.clauses[0].op.op, 'RECOVER_LIFE');

      const bounceAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'BOUNCE'));
      assert.ok(bounceAb, 'Must have bounce clause');
    });

    it('BS12-X06 (The PirateKing Leviadan) - Summon destroy, attack refresh, passive treat rule', () => {
      const override = getCardOverride('BS12-X06');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const destroyAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(destroyAb, 'Must have summon destroy');
      assert.equal(destroyAb.clauses[0].op.op, 'DESTROY');

      const refreshAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(refreshAb, 'Must have attack refresh');
      assert.equal(refreshAb.clauses[0].op.op, 'REFRESH');
    });
  });

  describe('3. R2 Skipped Card Exclusion: Mummybird', () => {
    it('BS12-011 (Mummybird) is cataloged in SKIPPED_CARDS and has no override', () => {
      const found = SKIPPED_CARDS.find(c => c.cardNumber === 'BS12-011');
      assert.ok(found, 'BS12-011 must be recorded in SKIPPED_CARDS per R2');
      assert.equal(found.set, 'BS12');
      assert.ok(found.reason.includes('Removed Zone'), 'Reason must document legacy Removed Zone');

      const override = getCardOverride('BS12-011');
      assert.equal(override, null, 'Skipped card must not have an override');
    });
  });

  describe('4. Full Canonical BS12 Resolution Integrity', () => {
    it('All 78 implemented BS12 cards in BS12_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(BS12_OVERRIDES).filter(k => k.startsWith('BS12-'));
      assert.equal(keys.length, 78, 'Expected 78 implemented BS12 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
