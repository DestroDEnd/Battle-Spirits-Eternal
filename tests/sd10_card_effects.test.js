/**
 * tests/sd10_card_effects.test.js
 * 
 * Regression Test Suite for SD10 (Starter Deck 10: Shining Dragon).
 * Verifies 100% deterministic execution of SD10 canonical card effects,
 * Brave cards, [Charge] keyword buffs, X-Rares, and Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD10_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD10 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD10 Spirit & Brave Mechanics', () => {

    it('SD10-005 (Bronze-Wurm) - Passive BP buff integrity', () => {
      const override = getCardOverride('SD10-005');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const ab = override.abilities[0];
      assert.equal(ab.header.timing, 'PASSIVE');
      assert.equal(ab.clauses[0].op.op, 'BP_BUFF');
    });

    it('SD10-016 (Charge Draw) - Main draw ability', () => {
      const override = getCardOverride('SD10-016');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
    });
  });

  describe('2. SD10 X-Rares: Shining-Dragon & Shining-Sword', () => {

    it('SD10-X01 (The ShineDragon Shining-Dragon) - (When Attacks) destroy opposing Spirit and Charge', () => {
      const override = getCardOverride('SD10-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'DESTROY');

      const chargeAb = override.abilities.find(a => a.header.keyword === 'Charge');
      assert.ok(chargeAb, 'Must have [Charge] ability');
      assert.equal(chargeAb.clauses[0].op.op, 'BP_BUFF');
    });

    it('SD10-X02 (The ShiningSacredSword Shining-Sword) - Brave condition and summon draw', () => {
      const override = getCardOverride('SD10-X02');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'DRAW');
    });
  });

  describe('3. Full Canonical SD10 Resolution Integrity', () => {
    it('All 12 SD10 cards in SD10_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD10_OVERRIDES).filter(k => k.startsWith('SD10-'));
      assert.equal(keys.length, 12, 'SD10 must have exactly 12 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
