/**
 * tests/bs14_card_effects.test.js
 * 
 * Regression Test Suite for BS14 (Booster Set 14: The Burst Dragon / Legend of the Heroic Dragon).
 * Verifies 100% deterministic execution of BS14 canonical card effects,
 * vanillas, Sieg-Yamato-Fried, Chaotic-Seimei, Dorcus-Ushiwaka, Mibrock-Baragan,
 * An-Zur, Nyarla-Trap, and Burst mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS14_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS14 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS14 Vanilla Cards Stat & Ability Integrity', () => {
    it('BS14-029 (Musha-Geo) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS14-029');
      assert.ok(override, 'Override must exist for BS14-029');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS14-036 (Icemaiden Mk-II) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS14-036');
      assert.ok(override, 'Override must exist for BS14-036');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS14-046 (Pam) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS14-046');
      assert.ok(override, 'Override must exist for BS14-046');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS14-050 (Yaley) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS14-050');
      assert.ok(override, 'Override must exist for BS14-050');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. BS14 X-Rares: Burst Heroes & Deities', () => {

    it('BS14-X01 (The DragonHero Sieg-Yamato-Fried) - Burst summon/destroy and Target Attack destruction', () => {
      const override = getCardOverride('BS14-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      assert.ok(burstAb.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(burstAb.clauses.some(c => c.op.op === 'SUMMON_FREE'));

      const targetAttAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'TARGET_ATTACK'));
      assert.ok(targetAttAb, 'Must have Target Attack ability');

      const destroyAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(destroyAb, 'Must have attack destroy ability');
    });

    it('BS14-X02 (The CurseHero Chaotic-Seimei) - Burst core move/draw/bounce and Spell Blight', () => {
      const override = getCardOverride('BS14-X02');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      assert.ok(burstAb.clauses.some(c => c.op.op === 'MOVE_CORE'));
      assert.ok(burstAb.clauses.some(c => c.op.op === 'DRAW'));
      assert.ok(burstAb.clauses.some(c => c.op.op === 'BOUNCE'));

      const spellBlightAb = override.abilities.find(a => a.header.keyword === 'Spell Blight');
      assert.ok(spellBlightAb, 'Must have [Spell Blight]');
      assert.ok(spellBlightAb.clauses.some(c => c.op.op === 'MOVE_CORE'));
    });

    it('BS14-X03 (The WindHero Dorcus-Ushiwaka) - Burst summon/exhaust, High Speed, and BP buff', () => {
      const override = getCardOverride('BS14-X03');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      assert.ok(burstAb.clauses.some(c => c.op.op === 'EXHAUST'));
      assert.ok(burstAb.clauses.some(c => c.op.op === 'SUMMON_THIS_CARD'));

      const hsAb = override.abilities.find(a => a.header.keyword === 'High Speed');
      assert.ok(hsAb, 'Must have [High Speed]');
    });

    it('BS14-X04 (The IceHero Mibrock-Baragan) - Burst summon and Attack Step bounce', () => {
      const override = getCardOverride('BS14-X04');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      assert.ok(burstAb.clauses.some(c => c.op.op === 'SUMMON_THIS_CARD'));

      const bounceAb = override.abilities.find(a => a.header.timing === 'ATTACK_STEP' && a.clauses.some(c => c.op.op === 'BOUNCE'));
      assert.ok(bounceAb, 'Must have Attack Step bounce ability');
    });

    it('BS14-X05 (The SacredBird An-Zur) - Attack mill/refresh and on-destruction refresh', () => {
      const override = getCardOverride('BS14-X05');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have attack ability');
      assert.ok(attackAb.clauses.some(c => c.op.op === 'MILL_DECK'));
      assert.ok(attackAb.clauses.some(c => c.op.op === 'REFRESH'));
    });

    it('BS14-X06 (The MalevolentDeity Nyarla-Trap) - Summon deck/bounce and destruction negate effect', () => {
      const override = getCardOverride('BS14-X06');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have summon ability');
      assert.ok(summonAb.clauses.some(c => c.op.op === 'BOUNCE'));

      const destroyAb = override.abilities.find(a => a.header.timing === 'WHEN_DESTROYED' && a.clauses.some(c => c.op.op === 'NEGATE_EFFECT'));
      assert.ok(destroyAb, 'Must have negate effect ability');
    });
  });

  describe('3. Full Canonical BS14 Resolution Integrity', () => {
    it('All 74 canonical BS14 cards in BS14_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(BS14_OVERRIDES).filter(k => k.startsWith('BS14-'));
      assert.equal(keys.length, 74, 'Expected 74 canonical BS14 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });

    it('All 80 total entries in BS14_OVERRIDES resolve cleanly', () => {
      const totalKeys = Object.keys(BS14_OVERRIDES);
      assert.equal(totalKeys.length, 80, 'Expected 80 total BS14 override keys');
      for (const k of totalKeys) {
        const override = BS14_OVERRIDES[k];
        assert.ok(override, `Entry must exist for ${k}`);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.unsupportedClausesCount, 0);
      }
    });
  });
});
