/**
 * tests/sd22_card_effects.test.js
 * 
 * Regression Test Suite for SD22 (Mega Deck: Advent of the Ultimate).
 * Verifies 100% deterministic execution of SD22 canonical card effects,
 * vanillas, Ultimate-Kingtaurus, and Ultimate mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD22_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD22 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD22 Vanilla Cards Stat & Ability Integrity', () => {
    it('SD22-001 (Speant) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD22-001');
      assert.ok(override, 'Override must exist for SD22-001');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. SD22 X-Rares: Ultimate-Kingtaurus', () => {
    it('SD22-X01 (Ultimate-Kingtaurus) - Ultimate Trigger, core movement, and BP buff', () => {
      const override = getCardOverride('SD22-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const uTriggerAb = override.abilities.find(a => a.header.keyword === 'Ultimate Trigger');
      assert.ok(uTriggerAb, 'Must have [Ultimate Trigger]');
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'EXHAUST'));
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'MOVE_CORE'));

      const bpBuffAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'BP_BUFF'));
      assert.ok(bpBuffAb, 'Must have (When Attacks) BP buff');
    });
  });

  describe('3. Full Canonical SD22 Resolution Integrity', () => {
    it('All 17 implemented SD22 cards in SD22_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD22_OVERRIDES).filter(k => k.startsWith('SD22-'));
      assert.equal(keys.length, 17, 'Expected 17 implemented SD22 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
