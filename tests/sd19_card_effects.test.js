/**
 * tests/sd19_card_effects.test.js
 * 
 * Regression Test Suite for SD19 (Starter Deck 19: Ultimate-Siegfried).
 * Verifies 100% deterministic execution of SD19 canonical card effects,
 * vanillas, Ultimate Trigger mechanics, [True-Awaken], and Spells.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD19_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD19 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD19 Vanilla Cards Stat & Ability Integrity', () => {
    it('SD19-001 (Fizard) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD19-001');
      assert.ok(override, 'Override must exist for SD19-001');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. SD19 Ultimate-Siegfried Mechanics', () => {

    it('SD19-X01 (Ultimate-Siegfried) - Ultimate Trigger and True-Awaken', () => {
      const override = getCardOverride('SD19-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const uTriggerAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Ultimate Trigger'));
      assert.ok(uTriggerAb, 'Must have Ultimate Trigger ability');
      assert.equal(uTriggerAb.clauses[0].op.op, 'FORCE_BLOCK');

      const trueAwakenAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('True-Awaken'));
      assert.ok(trueAwakenAb, 'Must have [True-Awaken] ability');
      assert.equal(trueAwakenAb.clauses[0].op.op, 'MOVE_CORE');
      assert.equal(trueAwakenAb.clauses[1].op.op, 'BP_BUFF');
    });

    it('SD19-013 (Neo-Double Draw) - Main draw ability', () => {
      const override = getCardOverride('SD19-013');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
    });
  });

  describe('3. Full Canonical SD19 Resolution Integrity', () => {
    it('All 11 SD19 cards in SD19_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD19_OVERRIDES).filter(k => k.startsWith('SD19-'));
      assert.equal(keys.length, 11, 'SD19 must have exactly 11 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
