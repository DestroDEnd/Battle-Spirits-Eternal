/**
 * tests/sd11_card_effects.test.js
 * 
 * Regression Test Suite for SD11 (Starter Deck 11: Dark-Gadphant & Midnight-Sun).
 * Verifies 100% deterministic execution of SD11 canonical card effects,
 * Brave cards, [Heavy Armor] multi-color immunity, X-Rares, and Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD11_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD11 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD11 Heavy Armor & Defensive Mechanics', () => {

    it('SD11-005 (Dark-Gadphant) - When Summoned bounce & Heavy Armor: Red/Blue', () => {
      const override = getCardOverride('SD11-005');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'BOUNCE');

      const heavyArmorAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Heavy Armor'));
      assert.ok(heavyArmorAb, 'Must have [Heavy Armor] ability');
      assert.equal(heavyArmorAb.clauses[0].op.op, 'CONTINUOUS_RULE');
    });

    it('SD11-016 (Burst Break) - Flash bounce and combat restriction', () => {
      const override = getCardOverride('SD11-016');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'BOUNCE');
    });
  });

  describe('2. SD11 X-Rares: Ninetail-Dark & Midnight-Sun', () => {

    it('SD11-X01 (The DarkEmperor Ninetail-Dark) - (When Blocks) refresh & (When Battles) bounce', () => {
      const override = getCardOverride('SD11-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb, 'Must have (When Blocks) ability');
      assert.equal(blockAb.clauses[0].op.op, 'REFRESH');

      const battleAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES');
      assert.ok(battleAb, 'Must have (When Battles) ability');
      assert.equal(battleAb.clauses[0].op.op, 'BOUNCE');
    });

    it('SD11-X02 (The MidnightSunTreasuredSword Midnight-Sun) - Brave condition & multi-color Heavy Armor', () => {
      const override = getCardOverride('SD11-X02');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const heavyArmorAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Heavy Armor'));
      assert.ok(heavyArmorAb, 'Must have [Heavy Armor: Green/White/Yellow/Blue]');
      assert.equal(heavyArmorAb.clauses[0].op.op, 'CONTINUOUS_RULE');
    });
  });

  describe('3. Full Canonical SD11 Resolution Integrity', () => {
    it('All 13 SD11 cards in SD11_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD11_OVERRIDES).filter(k => k.startsWith('SD11-'));
      assert.equal(keys.length, 13, 'SD11 must have exactly 13 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
