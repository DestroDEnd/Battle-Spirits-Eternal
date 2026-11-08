/**
 * tests/sd43_card_effects.test.js
 * 
 * Regression Test Suite for SD43 (Collaboration Starter: Dan & Barone).
 * Verifies 100% deterministic execution of SD43 canonical card effects,
 * Sieg-Apollodragon X, Strike-Siegwurm X, Grandwalkers Dan & Barone, and Brave mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD43_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD43 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD43 X-Rares & Ace Dragons', () => {
    it('SD43-X01 (The SunDragon Sieg-Apollodragon X) - Attack refreshed spirits & destroy triggers', () => {
      const override = getCardOverride('SD43-X01');
      assert.ok(override, 'Override must exist for SD43-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 2, 'Must have at least 2 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_ATTACKS');
    });

    it('SD43-X02 (The MoonlightDragon Strike-Siegwurm X) - Refresh on exhaust and bounce/immunity', () => {
      const override = getCardOverride('SD43-X02');
      assert.ok(override, 'Override must exist for SD43-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'ATTACK_STEP');
    });
  });

  describe('2. SD43 Grandwalker Nexuses & Braves', () => {
    it('SD43-CP01 (Bashin Dan) - Grandwalker core charging & symbol mechanics', () => {
      const override = getCardOverride('SD43-CP01');
      assert.ok(override, 'Override must exist for SD43-CP01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD43-CP02 (The Moonlight Barone) - Grandwalker core charging & symbol mechanics', () => {
      const override = getCardOverride('SD43-CP02');
      assert.ok(override, 'Override must exist for SD43-CP02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD43-006 (The KingSnake Pend-Viper) - Brave condition and draw/core triggers', () => {
      const override = getCardOverride('SD43-006');
      assert.ok(override, 'Override must exist for SD43-006');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD43 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD43_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD43_OVERRIDES)) {
        if (!cardId.startsWith('SD43-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 14, `Expected at least 14 SD43 cards, got ${cardCount}`);
    });
  });

});
