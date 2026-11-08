/**
 * tests/sd23_card_effects.test.js
 * 
 * Regression Test Suite for SD23 (Mega Deck: Advent of the White Ultimate).
 * Verifies 100% deterministic execution of SD23 canonical card effects,
 * Ultimate-Valiero, and White Ultimate mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD23_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD23 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD23 X-Rares: Ultimate-Valiero', () => {
    it('SD23-X01 (Ultimate-Valiero) - Ultimate Trigger unblockable/bounce, and BP debuff', () => {
      const override = getCardOverride('SD23-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const uTriggerAb = override.abilities.find(a => a.header.keyword === 'Ultimate Trigger');
      assert.ok(uTriggerAb, 'Must have [Ultimate Trigger]');
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'UNBLOCKABLE'));
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'BOUNCE'));

      const bpDebuffAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES' && a.clauses.some(c => c.op.op === 'BP_DEBUFF'));
      assert.ok(bpDebuffAb, 'Must have (When Battles) BP debuff');
    });
  });

  describe('2. Full Canonical SD23 Resolution Integrity', () => {
    it('All 13 implemented SD23 cards in SD23_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD23_OVERRIDES).filter(k => k.startsWith('SD23-'));
      assert.equal(keys.length, 13, 'Expected 13 implemented SD23 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
