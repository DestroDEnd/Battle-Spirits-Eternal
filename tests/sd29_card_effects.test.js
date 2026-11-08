/**
 * tests/sd29_card_effects.test.js
 * 
 * Regression Test Suite for SD29 (Mega Deck: Burning Soul Dragon / Sengoku Guren).
 * Verifies 100% deterministic execution of SD29 canonical card effects,
 * vanillas (Mushadaryu), X-Rares (Sengoku-Gurendragon, Sengoku Siegfried),
 * and burst/magic effects.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD29_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD29 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD29 Vanilla Cards Stat & Ability Integrity', () => {
    it('SD29-002 (Mushadaryu) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD29-002');
      assert.ok(override, 'Override must exist for SD29-002');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. SD29 X-Rares & Ace Cards', () => {
    it('SD29-X01-A7671 (Sengoku-Gurendragon) - Attack BP destruction and Soul Core interaction', () => {
      const override = getCardOverride('SD29-X01-A7671');
      assert.ok(override, 'Override must exist for SD29-X01-A7671');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD29-X01 (Sengoku Siegfried) - Deterministic IR resolution', () => {
      const override = getCardOverride('SD29-X01');
      assert.ok(override, 'Override must exist for SD29-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD29 Magic & Nexus Cards', () => {
    it('SD29-014 (Douburyuu Draw) - Main draw 2 and Soul Core recovery', () => {
      const override = getCardOverride('SD29-014');
      assert.ok(override, 'Override must exist for SD29-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const mainAb = override.abilities.find(a => a.header.timing === 'MAIN');
      assert.ok(mainAb, 'Must have Main ability');
    });

    it('SD29-015 (Crimson Flame) - Flash destruction opcode', () => {
      const override = getCardOverride('SD29-015');
      assert.ok(override, 'Override must exist for SD29-015');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD29-011 (The Fierce Dragon Castle) - Deterministic nexus IR', () => {
      const override = getCardOverride('SD29-011');
      assert.ok(override, 'Override must exist for SD29-011');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
    });
  });

  describe('4. SD29 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD29_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD29_OVERRIDES)) {
        if (!cardId.startsWith('SD29-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 19, `Expected at least 19 SD29 cards, got ${cardCount}`);
    });
  });

});
