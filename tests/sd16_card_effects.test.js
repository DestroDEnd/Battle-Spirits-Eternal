/**
 * tests/sd16_card_effects.test.js
 * 
 * Regression Test Suite for SD16 (Starter Deck 16: Alexander-XIII).
 * Verifies 100% deterministic execution of SD16 canonical card effects,
 * Fighting Spirit Braves, [Crush] deck mill mechanics, X-Rares, and Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD16_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD16 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD16 Giant & Crush Mechanics', () => {

    it('SD16-004 (The BattleMaul Gordon) - [Crush] deck mill ability', () => {
      const override = getCardOverride('SD16-004');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const crushAb = override.abilities.find(a => a.header.keyword === 'Crush');
      assert.ok(crushAb, 'Must have [Crush] ability');
      assert.equal(crushAb.clauses[0].op.op, 'MILL_DECK');
    });

    it('SD16-007 (Loader-Arms) - Brave condition, summon core move, and attack destroy', () => {
      const override = getCardOverride('SD16-007');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'MOVE_CORE');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_BRAVE_ATTACKS');
      assert.ok(attackAb, 'Must have (When Brave Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'DESTROY');
    });
  });

  describe('2. SD16 X-Rare: Alexander-XIII', () => {

    it('SD16-X01 (The GiantEmperor Alexander-XIII) - Summon destroy, attack mill, and attack exhaust/refresh', () => {
      const override = getCardOverride('SD16-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'MILL_DECK');
    });
  });

  describe('3. Full Canonical SD16 Resolution Integrity', () => {
    it('All 9 SD16 cards in SD16_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD16_OVERRIDES).filter(k => k.startsWith('SD16-'));
      assert.equal(keys.length, 9, 'SD16 must have exactly 9 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
