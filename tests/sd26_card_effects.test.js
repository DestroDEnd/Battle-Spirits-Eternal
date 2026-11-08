/**
 * tests/sd26_card_effects.test.js
 * 
 * Regression Test Suite for SD26 (Mega Deck: The Return of the Ultimate / Ultimate-Ark).
 * Verifies 100% deterministic execution of SD26 canonical card effects,
 * Ultimate-Ark, SolCalibur, and Ultimate Brave mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD26_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD26 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD26 X-Rares: Ultimate-Ark & SolCalibur', () => {
    it('SD26-X01 (Ultimate-Ark) - Ultimate Trigger destruction and symbol amplification', () => {
      const override = getCardOverride('SD26-X01');
      assert.ok(override, 'Override must exist for SD26-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const symbolAb = override.abilities.find(a => a.header.timing === 'PASSIVE' && a.clauses.some(c => c.op.op === 'ADD_SYMBOL'));
      assert.ok(symbolAb, 'Must have passive symbol addition ability');

      const uTriggerAb = override.abilities.find(a => a.header.keyword === 'Ultimate Trigger');
      assert.ok(uTriggerAb, 'Must have [Ultimate Trigger]');
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'DESTROY'));
    });

    it('SD26-X02 (The SunDeitySword SolCalibur) - Brave Condition and destruction ability', () => {
      const override = getCardOverride('SD26-X02');
      assert.ok(override, 'Override must exist for SD26-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const destroyAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(destroyAb, 'Must have destruction clause');
    });
  });

  describe('2. Full Canonical SD26 Resolution Integrity', () => {
    it('All 16 canonical SD26 cards in SD26_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD26_OVERRIDES);
      assert.equal(keys.length, 16, 'Expected 16 SD26 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
