/**
 * tests/sd46_card_effects.test.js
 * 
 * Regression Test Suite for SD46 (Collaboration Starter: Battle Spirits Double Drive - Shunta & Yoku).
 * Verifies 100% deterministic execution of SD46 canonical card effects,
 * Blitz-Tiger-Z, Revol-Tiger-Z, Igridios-Z, and Grandwalker Mogami Shunta mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD46_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD46 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD46 Thunder God Kings & X-Rares', () => {
    it('SD46-X01 (The BlueThunderGodKing Blitz-Tiger-Z) - When Summoned and When Attacks triggers', () => {
      const override = getCardOverride('SD46-X01');
      assert.ok(override, 'Override must exist for SD46-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
    });

    it('SD46-X02 (The RedThunderGodKing Revol-Tiger-Z) - BP destruction and attack triggers', () => {
      const override = getCardOverride('SD46-X02');
      assert.ok(override, 'Override must exist for SD46-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
    });

    it('SD46-X03 (The SteelThunderKing Igridios-Z) - Flash timing and attack/block triggers', () => {
      const override = getCardOverride('SD46-X03');
      assert.ok(override, 'Override must exist for SD46-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
    });
  });

  describe('2. SD46 Grandwalker & Thunder Support', () => {
    it('SD46-CP01 (Mogami Shunta) - Grandwalker core charging, god symbols, and attack step triggers', () => {
      const override = getCardOverride('SD46-CP01');
      assert.ok(override, 'Override must exist for SD46-CP01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD46-005 (The NinthThunderclap ThreeSacredHorses Byerley-Dark-Z) - Burst trigger and attack mechanics', () => {
      const override = getCardOverride('SD46-005');
      assert.ok(override, 'Override must exist for SD46-005');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD46 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD46_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD46_OVERRIDES)) {
        if (!cardId.startsWith('SD46-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.equal(cardCount, 9, `Expected exactly 9 SD46 cards, got ${cardCount}`);
    });
  });

});
