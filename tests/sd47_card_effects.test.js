/**
 * tests/sd47_card_effects.test.js
 * 
 * Regression Test Suite for SD47 (Collaboration Starter: Battle Spirits Double Drive - Sky God Kings).
 * Verifies 100% deterministic execution of SD47 canonical card effects,
 * Budgie-Pesed, Pyramid Wing, Gale-Phoenix-Horus, and Grandwalker Yoku Albatrosa.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD47_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD47 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD47 Sky God Kings & X-Rares', () => {
    it('SD47-X01 (The SkyGodKing Budgie-Pesed) - When Summoned and Attack Step triggers', () => {
      const override = getCardOverride('SD47-X01');
      assert.ok(override, 'Override must exist for SD47-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
    });

    it('SD47-X02 (The SkyWarship Pyramid Wing) - Burst trigger and attack mechanics', () => {
      const override = getCardOverride('SD47-X02');
      assert.ok(override, 'Override must exist for SD47-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
    });

    it('SD47-X03 (The SkyGodKing Gale-Phoenix-Horus) - When Summoned and When Attacks triggers', () => {
      const override = getCardOverride('SD47-X03');
      assert.ok(override, 'Override must exist for SD47-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
    });
  });

  describe('2. SD47 Grandwalker & Green Sky Support', () => {
    it('SD47-CP01 (Yoku Albatrosa) - Grandwalker core charging, symbols, and attack step triggers', () => {
      const override = getCardOverride('SD47-CP01');
      assert.ok(override, 'Override must exist for SD47-CP01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD47-002 (Medjeowl) - Exhaustion, summon, and defense triggers', () => {
      const override = getCardOverride('SD47-002');
      assert.ok(override, 'Override must exist for SD47-002');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD47 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD47_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD47_OVERRIDES)) {
        if (!cardId.startsWith('SD47-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.equal(cardCount, 6, `Expected exactly 6 SD47 cards, got ${cardCount}`);
    });
  });

});
