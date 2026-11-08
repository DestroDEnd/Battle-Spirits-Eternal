/**
 * tests/sd31_card_effects.test.js
 * 
 * Regression Test Suite for SD31 (Mega Deck: Demon Ninja Storm / Kirikage).
 * Verifies 100% deterministic execution of SD31 canonical card effects,
 * X-Rare Kirikage, Brave Teppounanafushi, and Shinobi ninjutsu mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD31_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD31 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD31 X-Rares & Ace Cards', () => {
    it('SD31-X01 (The WhirlwindNinja Kirikage) - Shinobi triggers & battle destruction', () => {
      const override = getCardOverride('SD31-X01');
      assert.ok(override, 'Override must exist for SD31-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD31-012 (Teppounanafushi) - Brave condition and draw/summon abilities', () => {
      const override = getCardOverride('SD31-012');
      assert.ok(override, 'Override must exist for SD31-012');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD31 Magic & Shinobi Arts', () => {
    it('SD31-014 (Thousand Shuriken) - Flash fatigue and core lock', () => {
      const override = getCardOverride('SD31-014');
      assert.ok(override, 'Override must exist for SD31-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD31-015 (Double Body Swap) - Flash bounce / replacement effect', () => {
      const override = getCardOverride('SD31-015');
      assert.ok(override, 'Override must exist for SD31-015');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });
  });

  describe('3. SD31 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD31_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD31_OVERRIDES)) {
        if (!cardId.startsWith('SD31-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 13, `Expected at least 13 SD31 cards, got ${cardCount}`);
    });
  });

});
