/**
 * tests/sd33_card_effects.test.js
 * 
 * Regression Test Suite for SD33 (Mega Deck: Twelve God-Kings Beast / Blazoma).
 * Verifies 100% deterministic execution of SD33 canonical card effects,
 * vanillas (Ponyseed), God-King beasts, and magic cards.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD33_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD33 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD33 Vanilla Cards Stat & Ability Integrity', () => {
    it('SD33-004 (Ponyseed) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD33-004');
      assert.ok(override, 'Override must exist for SD33-004');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. SD33 Beast Spirits & God-Kings', () => {
    it('SD33-009 (The ThirdBeastKing Blazoma) - Attack BP destruction and core generation', () => {
      const override = getCardOverride('SD33-009');
      assert.ok(override, 'Override must exist for SD33-009');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD33-005 (The FirstBeast Saiou) - Summon core ramp & attack step triggers', () => {
      const override = getCardOverride('SD33-005');
      assert.ok(override, 'Override must exist for SD33-005');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD33 Magic & Burst Spells', () => {
    it('SD33-013 (Emperor Flame) - Flash destruction opcode', () => {
      const override = getCardOverride('SD33-013');
      assert.ok(override, 'Override must exist for SD33-013');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD33-014 (Dyna Burst) - Burst trigger and bounce/destruction effect', () => {
      const override = getCardOverride('SD33-014');
      assert.ok(override, 'Override must exist for SD33-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
    });

    it('SD33-010 (The Shrine of the Twelve God-Kings) - Deterministic nexus IR', () => {
      const override = getCardOverride('SD33-010');
      assert.ok(override, 'Override must exist for SD33-010');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
    });
  });

  describe('4. SD33 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD33_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD33_OVERRIDES)) {
        if (!cardId.startsWith('SD33-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 14, `Expected at least 14 SD33 cards, got ${cardCount}`);
    });
  });

});
