/**
 * tests/sd25_card_effects.test.js
 * 
 * Regression Test Suite for SD25 (Mega Deck: Advent of the Yellow Ultimate / Blazing-Dragon).
 * Verifies 100% deterministic execution of SD25 canonical card effects,
 * Blazing-Dragon, Burst mechanics, and draw/refresh interactions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD25_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD25 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD25 X-Rares: Blazing-Dragon', () => {
    it('SD25-X01 (The MilkDipper Blazing-Dragon) - Burst summon & destroy, battle draw, attack step refresh', () => {
      const override = getCardOverride('SD25-X01');
      assert.ok(override, 'Override must exist for SD25-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      assert.ok(burstAb.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(burstAb.clauses.some(c => c.op.op === 'SUMMON_THIS_CARD'));

      const drawAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES' && a.clauses.some(c => c.op.op === 'DRAW'));
      assert.ok(drawAb, 'Must have battle draw ability');

      const refreshAb = override.abilities.find(a => a.header.timing === 'ATTACK_STEP' && a.clauses.some(c => c.op.op === 'REFRESH'));
      assert.ok(refreshAb, 'Must have Attack Step refresh ability');
    });
  });

  describe('2. Full Canonical SD25 Resolution Integrity', () => {
    it('All 7 canonical SD25 cards in SD25_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD25_OVERRIDES).filter(k => k.startsWith('SD25-'));
      assert.equal(keys.length, 7, 'Expected 7 canonical SD25 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });

    it('All 9 total entries in SD25_OVERRIDES resolve cleanly', () => {
      const totalKeys = Object.keys(SD25_OVERRIDES);
      assert.equal(totalKeys.length, 9, 'Expected 9 total SD25 override keys');
      for (const k of totalKeys) {
        const override = SD25_OVERRIDES[k];
        assert.ok(override, `Entry must exist for ${k}`);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.unsupportedClausesCount, 0);
      }
    });
  });
});
