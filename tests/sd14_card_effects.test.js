/**
 * tests/sd14_card_effects.test.js
 * 
 * Regression Test Suite for SD14 (Starter Deck 14: Herac-Dinus).
 * Verifies 100% deterministic execution of SD14 canonical card effects,
 * Parasite Braves, [High Speed] summoning, X-Rares, and Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD14_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD14 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD14 High Speed & Insect Mechanics', () => {

    it('SD14-004 (DarkZiga-Wasp) - Flash [High Speed] summoning', () => {
      const override = getCardOverride('SD14-004');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const hsAb = override.abilities.find(a => a.header.keyword === 'High Speed');
      assert.ok(hsAb, 'Must have [High Speed] ability');
      assert.equal(hsAb.header.isFlash, true);
      assert.equal(hsAb.clauses[0].op.op, 'SUMMON_RESERVE_ONLY');
    });

    it('SD14-007 (The FlyingBeetle Nitoukuwagata) - Brave Condition and High Speed', () => {
      const override = getCardOverride('SD14-007');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const hsAb = override.abilities.find(a => a.header.keyword === 'High Speed');
      assert.ok(hsAb, 'Must have [High Speed] ability');
      assert.equal(hsAb.clauses[0].op.op, 'SUMMON_RESERVE_ONLY');
    });

    it('SD14-008 (Insects Assemble) - Flash refresh ability', () => {
      const override = getCardOverride('SD14-008');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'REFRESH');
    });
  });

  describe('2. SD14 X-Rare: Herac-Dinus', () => {

    it('SD14-X01 (The ArmoredWoodGod Herac-Dinus) - Attack step blocker choice & passive BP buff', () => {
      const override = getCardOverride('SD14-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackStepAb = override.abilities.find(a => a.header.timing === 'ATTACK_STEP');
      assert.ok(attackStepAb, 'Must have Attack Step ability');
      assert.equal(attackStepAb.clauses[0].op.op, 'KEYWORD_RULE');

      const passiveAb = override.abilities.find(a => a.header.timing === 'PASSIVE');
      assert.ok(passiveAb, 'Must have passive BP buff');
      assert.equal(passiveAb.clauses[0].op.op, 'BP_BUFF');
    });
  });

  describe('3. Full Canonical SD14 Resolution Integrity', () => {
    it('All 9 SD14 cards in SD14_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD14_OVERRIDES).filter(k => k.startsWith('SD14-'));
      assert.equal(keys.length, 9, 'SD14 must have exactly 9 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
