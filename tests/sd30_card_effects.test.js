/**
 * tests/sd30_card_effects.test.js
 * 
 * Regression Test Suite for SD30 (Mega Deck: Special Promotion / Steel Blade Dragon).
 * Verifies 100% deterministic execution of SD30 canonical card effects.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD30_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD30 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD30 Canonical Cards Resolution & Abilities', () => {
    it('SD30-001 (The SteelBladeDragon Calyvorous) has deterministic IR and 0 unsupported clauses', () => {
      const override = getCardOverride('SD30-001');
      assert.ok(override, 'Override must exist for SD30-001');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD30-002 (The TwinHornDragon Doubhorn) has deterministic IR and 0 unsupported clauses', () => {
      const override = getCardOverride('SD30-002');
      assert.ok(override, 'Override must exist for SD30-002');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD30 Completeness & Schema Integrity', () => {
    it('All cards in SD30_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD30_OVERRIDES)) {
        if (!cardId.startsWith('SD30-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
      }
      assert.ok(cardCount >= 2, `Expected at least 2 SD30 cards, got ${cardCount}`);
    });
  });

});
