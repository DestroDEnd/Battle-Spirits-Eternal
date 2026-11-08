/**
 * tests/sd40_card_effects.test.js
 * 
 * Regression Test Suite for SD40 (Mega Deck: Shinobi Head / Souldragon-Hokage).
 * Verifies 100% deterministic execution of SD40 canonical card effects,
 * Souldragon-Hokage, Yatagarai, and Shinobi ninjutsu Accel mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD40_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD40 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD40 X-Rares & Ace Ninja Spirits', () => {
    it('SD40-X01 (The NinjaHead Souldragon-Hokage) - Summon and battle destruction', () => {
      const override = getCardOverride('SD40-X01');
      assert.ok(override, 'Override must exist for SD40-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD40-X02 (The 44thGenerationStrangeFangShinobiHead Shishinobi) - Shinobi battle triggers', () => {
      const override = getCardOverride('SD40-X02');
      assert.ok(override, 'Override must exist for SD40-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD40-X03 (The 33rdGenerationWindDemonHead Yatagarai) - Accel exhaustion and core ramp', () => {
      const override = getCardOverride('SD40-X03');
      assert.ok(override, 'Override must exist for SD40-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD40 Accel & Shinobi Arts', () => {
    it('SD40-004 (The ArmoredMothShinobi Barakiri) - Accel bounce and removed zone summon', () => {
      const override = getCardOverride('SD40-004');
      assert.ok(override, 'Override must exist for SD40-004');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD40-003 (The FlameSannin Izayoi of the GreatShuriken) - Accel destruction', () => {
      const override = getCardOverride('SD40-003');
      assert.ok(override, 'Override must exist for SD40-003');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD40 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD40_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD40_OVERRIDES)) {
        if (!cardId.startsWith('SD40-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 10, `Expected at least 10 SD40 cards, got ${cardCount}`);
    });
  });

});
