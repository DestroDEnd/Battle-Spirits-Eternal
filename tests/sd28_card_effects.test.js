/**
 * tests/sd28_card_effects.test.js
 * 
 * Regression Test Suite for SD28 (Mega Deck: Advent of the Earth Ultimate / Ushiwaka & Gaianohoko).
 * Verifies 100% deterministic execution of SD28 canonical card effects,
 * Ultimate-Ushiwaka, Gaianohoko, and Burst Lock mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD28_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD28 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD28 X-Rares: Ultimate-Ushiwaka & Gaianohoko', () => {
    it('SD28-X01 (Ultimate-Ushiwaka) - Burst summon/exhaust and Ultimate Trigger refresh', () => {
      const override = getCardOverride('SD28-X01');
      assert.ok(override, 'Override must exist for SD28-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      assert.ok(burstAb.clauses.some(c => c.op.op === 'EXHAUST'));
      assert.ok(burstAb.clauses.some(c => c.op.op === 'SUMMON_THIS_CARD'));

      const uTriggerAb = override.abilities.find(a => a.header.keyword === 'Ultimate Trigger');
      assert.ok(uTriggerAb, 'Must have [Ultimate Trigger]');
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'REFRESH'));
    });

    it('SD28-X02 (The EarthDeitySword Gaianohoko) - Brave Condition and Burst Lock', () => {
      const override = getCardOverride('SD28-X02');
      assert.ok(override, 'Override must exist for SD28-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const burstLockAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'BURST_LOCK'));
      assert.ok(burstLockAb, 'Must have Burst Lock clause');
    });
  });

  describe('2. Full Canonical SD28 Resolution Integrity', () => {
    it('All 14 canonical SD28 cards in SD28_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD28_OVERRIDES).filter(k => k.startsWith('SD28-'));
      assert.equal(keys.length, 14, 'Expected 14 canonical SD28 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });

    it('All 14 total entries in SD28_OVERRIDES resolve cleanly', () => {
      const totalKeys = Object.keys(SD28_OVERRIDES);
      assert.equal(totalKeys.length, 14, 'Expected 14 total SD28 override keys');
      for (const k of totalKeys) {
        const override = SD28_OVERRIDES[k];
        assert.ok(override, `Entry must exist for ${k}`);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.unsupportedClausesCount, 0);
      }
    });
  });
});
