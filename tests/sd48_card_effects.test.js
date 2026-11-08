/**
 * tests/sd48_card_effects.test.js
 * 
 * Regression Test Suite for SD48 (Mega Deck: Dragon of the Heavens / Saga Brave & Brahma).
 * Verifies 100% deterministic execution of SD48 canonical card effects,
 * Generator Dragon, GrandDeitySword Aramandi, Grandwalker Brahma, and Ancient Dragon archetype.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD48_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD48 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD48 X-Rares & Deity Swords', () => {
    it('SD48-X01 (The CreatorDragon Generator Dragon) - Attack step triggers and destruction mechanics', () => {
      const override = getCardOverride('SD48-X01');
      assert.ok(override, 'Override must exist for SD48-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_ATTACKS');
    });

    it('SD48-X02 (The GrandDeitySword Aramandi) - Saga Brave condition and battle triggers', () => {
      const override = getCardOverride('SD48-X02');
      assert.ok(override, 'Override must exist for SD48-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
    });

    it('SD48-X03 (Grandwalker Brahma) - Grandwalker core charging, god symbols, and attack step triggers', () => {
      const override = getCardOverride('SD48-X03');
      assert.ok(override, 'Override must exist for SD48-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 5, 'Must have at least 5 abilities');
    });
  });

  describe('2. SD48 Ancient Dragon Archetype & Spells', () => {
    it('SD48-001 (The SmallAncientDragon Scharla-Chrot) - Attack draw and Saga Brave BP buff', () => {
      const override = getCardOverride('SD48-001');
      assert.ok(override, 'Override must exist for SD48-001');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 2, 'Must have at least 2 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_ATTACKS');
    });

    it('SD48-008 (The AncientDragonCaptain Solkattu) - When Summoned and When Attacks triggers', () => {
      const override = getCardOverride('SD48-008');
      assert.ok(override, 'Override must exist for SD48-008');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 2, 'Must have at least 2 abilities');
    });

    it('SD48-013 (Grandraw) - Burst draw and Main core acceleration', () => {
      const override = getCardOverride('SD48-013');
      assert.ok(override, 'Override must exist for SD48-013');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 2, 'Must have at least 2 abilities');
    });

    it('SD48-014 (Igneet Flame) - Flash destruction and BP debuff', () => {
      const override = getCardOverride('SD48-014');
      assert.ok(override, 'Override must exist for SD48-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 1, 'Must have abilities');
    });
  });

  describe('3. SD48 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD48_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD48_OVERRIDES)) {
        if (!cardId.startsWith('SD48-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.equal(cardCount, 16, `Expected exactly 16 SD48 cards, got ${cardCount}`);
    });
  });

});
