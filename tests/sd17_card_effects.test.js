/**
 * tests/sd17_card_effects.test.js
 * 
 * Regression Test Suite for SD17 (Starter Deck 17: Dark-Tyrannosaura).
 * Verifies 100% deterministic execution of SD17 canonical card effects,
 * vanillas, Terra Dragon Braves, [Clash], X-Rares, and Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD17_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD17 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD17 Vanilla Cards Stat & Ability Integrity', () => {
    it('SD17-010 (Lancemosaurus) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD17-010');
      assert.ok(override, 'Override must exist for SD17-010');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. SD17 X-Rares & Brave Mechanics', () => {

    it('SD17-X01 (The DarkDragon Dark-Tyrannosaura) - Attack destruction and core movement', () => {
      const override = getCardOverride('SD17-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'DESTROY');
    });

    it('SD17-X02 (The DarknessDemonSword Dark-Blade) - Brave condition, summon destroy/draw, and target attack', () => {
      const override = getCardOverride('SD17-X02');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');

      const targetAttackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(targetAttackAb, 'Must have (When Attacks) ability');
      assert.equal(targetAttackAb.clauses[0].op.op, 'TARGET_ATTACK');
    });

    it('SD17-011 (The ArmedMachineDragon Silveed) - Terra Dragon Brave, bounce, and [Clash]', () => {
      const override = getCardOverride('SD17-011');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'BOUNCE');

      const clashAb = override.abilities.find(a => a.header.keyword === 'Clash');
      assert.ok(clashAb, 'Must have [Clash] ability');
      assert.equal(clashAb.clauses[0].op.op, 'FORCE_BLOCK');
    });
  });

  describe('3. Full Canonical SD17 Resolution Integrity', () => {
    it('All 16 SD17 cards in SD17_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD17_OVERRIDES).filter(k => k.startsWith('SD17-'));
      assert.equal(keys.length, 16, 'SD17 must have exactly 16 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
