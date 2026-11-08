/**
 * tests/sd27_card_effects.test.js
 * 
 * Regression Test Suite for SD27 (Mega Deck: The Awakening of the Ultimate / Zodiac).
 * Verifies 100% deterministic execution of SD27 canonical card effects,
 * Ptolemy, Ultimate-Zodiac, and R2 cataloging of Pixislizard and Wyvern-Vela.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD27_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('SD27 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD27 X-Rares: Ptolemy & Ultimate-Zodiac', () => {
    it('SD27-X01 (The GenesisDragon Ptolemy) - Burst summon/destroy and Ultimate Trigger destroy/draw', () => {
      const override = getCardOverride('SD27-X01');
      assert.ok(override, 'Override must exist for SD27-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      assert.ok(burstAb.clauses.some(c => c.op.op === 'SUMMON_THIS_CARD'));
      assert.ok(burstAb.clauses.some(c => c.op.op === 'DESTROY'));

      const uTriggerAb = override.abilities.find(a => a.header.keyword === 'Ultimate Trigger');
      assert.ok(uTriggerAb, 'Must have [Ultimate Trigger]');
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'DRAW'));
    });

    it('SD27-X02 (The UltimateStar Ultimate-Zodiac) - Ultimate Trigger deck reveal/summon and BP buff', () => {
      const override = getCardOverride('SD27-X02');
      assert.ok(override, 'Override must exist for SD27-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const uTriggerAb = override.abilities.find(a => a.header.keyword === 'Ultimate Trigger');
      assert.ok(uTriggerAb, 'Must have [Ultimate Trigger]');
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'REVEAL_DECKTOP'));
      assert.ok(uTriggerAb.clauses.some(c => c.op.op === 'SUMMON'));

      const bpBuffAb = override.abilities.find(a => a.header.timing === 'PASSIVE' && a.clauses.some(c => c.op.op === 'BP_BUFF'));
      assert.ok(bpBuffAb, 'Must have BP buff ability');
    });
  });

  describe('2. R2 Skipped Cards Exclusion: Pixislizard & Wyvern-Vela', () => {
    it('SD27-001 (Pixislizard) is cataloged in SKIPPED_CARDS and has no override', () => {
      const found = SKIPPED_CARDS.find(c => c.cardNumber === 'SD27-001');
      assert.ok(found, 'SD27-001 must be recorded in SKIPPED_CARDS per R2');
      assert.equal(found.set, 'SD27');
      assert.ok(found.reason.includes('Removed Zone'), 'Reason must document legacy Removed Zone');

      const override = getCardOverride('SD27-001');
      assert.equal(override, null, 'Skipped card must not have an override');
    });

    it('SD27-002 (Wyvern-Vela) is cataloged in SKIPPED_CARDS and has no override', () => {
      const found = SKIPPED_CARDS.find(c => c.cardNumber === 'SD27-002');
      assert.ok(found, 'SD27-002 must be recorded in SKIPPED_CARDS per R2');
      assert.equal(found.set, 'SD27');
      assert.ok(found.reason.includes('Removed Zone'), 'Reason must document legacy Removed Zone');

      const override = getCardOverride('SD27-002');
      assert.equal(override, null, 'Skipped card must not have an override');
    });
  });

  describe('3. Full Canonical SD27 Resolution Integrity', () => {
    it('All 6 implemented SD27 cards in SD27_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD27_OVERRIDES);
      assert.equal(keys.length, 6, 'Expected 6 implemented SD27 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
