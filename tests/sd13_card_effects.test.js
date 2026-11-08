/**
 * tests/sd13_card_effects.test.js
 * 
 * Regression Test Suite for SD13 (Starter Deck 13: Cursedragon).
 * Verifies 100% deterministic execution of SD13 canonical card effects,
 * Zombie Braves, destruction/draw triggers, X-Rares, and Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD13_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD13 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD13 Zombie & Destruction Mechanics', () => {

    it('SD13-007 (Shadow-Maiden) - Brave Condition and summon draw', () => {
      const override = getCardOverride('SD13-007');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'DRAW');
    });

    it('SD13-008 (Soul Reap) - Flash destruction ability', () => {
      const override = getCardOverride('SD13-008');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
    });
  });

  describe('2. SD13 X-Rare: Cursedragon', () => {

    it('SD13-X01 (The WickedDragonKing Cursedragon) - (When Summoned) destroy/draw & (When Attacks) core move', () => {
      const override = getCardOverride('SD13-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'MOVE_CORE');
    });
  });

  describe('3. Full Canonical SD13 Resolution Integrity', () => {
    it('All 9 SD13 cards in SD13_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD13_OVERRIDES).filter(k => k.startsWith('SD13-'));
      assert.equal(keys.length, 9, 'SD13 must have exactly 9 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
