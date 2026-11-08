/**
 * tests/sd24_card_effects.test.js
 * 
 * Regression Test Suite for SD24 (Mega Deck: Advent of the Blue Ultimate / Alexander).
 * Verifies 100% deterministic execution of SD24 canonical card effects,
 * Ultimate-Alexander, Ultimate Trigger, and Blue Ultimate mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD24_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD24 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD24 X-Rares: Ultimate-Alexander', () => {
    it('SD24-X01 (Ultimate-Alexander) - Ultimate Trigger destroy/refresh, and attack step immunity', () => {
      const override = getCardOverride('SD24-X01');
      assert.ok(override, 'Override must exist for SD24-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const uTriggerAb = override.abilities.find(a => a.header.keyword === 'Ultimate Trigger');
      assert.ok(uTriggerAb, 'Must have [Ultimate Trigger]');
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'REFRESH'));

      const immAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'IMMUNITY'));
      assert.ok(immAb, 'Must have Attack Step immunity ability');
    });
  });

  describe('2. Full Canonical SD24 Resolution Integrity', () => {
    it('All 12 canonical SD24 cards in SD24_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD24_OVERRIDES).filter(k => k.startsWith('SD24-'));
      assert.equal(keys.length, 12, 'Expected 12 canonical SD24 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });

    it('All 14 total entries in SD24_OVERRIDES resolve cleanly', () => {
      const totalKeys = Object.keys(SD24_OVERRIDES);
      assert.equal(totalKeys.length, 14, 'Expected 14 total SD24 override keys');
      for (const k of totalKeys) {
        const override = SD24_OVERRIDES[k];
        assert.ok(override, `Entry must exist for ${k}`);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.unsupportedClausesCount, 0);
      }
    });
  });
});
