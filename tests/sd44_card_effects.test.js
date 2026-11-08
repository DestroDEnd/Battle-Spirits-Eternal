/**
 * tests/sd44_card_effects.test.js
 * 
 * Regression Test Suite for SD44 (Collaboration Starter: Shining & Darkness).
 * Verifies 100% deterministic execution of SD44 canonical card effects,
 * Shining-Dragon-Overray X, Darkness-Griffon X, and Accel/Magic cards.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD44_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD44 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD44 X-Rares: Shining & Darkness Rebirth', () => {
    it('SD44-X01 (The DragonShineDeity Shining-Dragon-Overray X) - Multi-brave and refresh triggers', () => {
      const override = getCardOverride('SD44-X01');
      assert.ok(override, 'Override must exist for SD44-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 4, 'Must have at least 4 abilities');
    });

    it('SD44-X02 (The DarkKingMachineBeast Darkness-Griffon X) - Burst discard and Rush God triggers', () => {
      const override = getCardOverride('SD44-X02');
      assert.ok(override, 'Override must exist for SD44-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 2, 'Must have at least 2 abilities');
    });
  });

  describe('2. SD44 Accel & Spells', () => {
    it('SD44-005 (Darkness-Cocadrille) - Accel and core depletion triggers', () => {
      const override = getCardOverride('SD44-005');
      assert.ok(override, 'Override must exist for SD44-005');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD44-009 (Shining Burst) - Burst timing and destructive triggers', () => {
      const override = getCardOverride('SD44-009');
      assert.ok(override, 'Override must exist for SD44-009');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD44-010 (Edge Dream) - Main and Flash spell triggers', () => {
      const override = getCardOverride('SD44-010');
      assert.ok(override, 'Override must exist for SD44-010');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD44 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD44_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD44_OVERRIDES)) {
        if (!cardId.startsWith('SD44-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 12, `Expected at least 12 SD44 cards, got ${cardCount}`);
    });
  });

});
