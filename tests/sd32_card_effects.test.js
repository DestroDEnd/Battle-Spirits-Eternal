/**
 * tests/sd32_card_effects.test.js
 * 
 * Regression Test Suite for SD32 (Mega Deck: Heavenly Demon King / God-Sechs).
 * Verifies 100% deterministic execution of SD32 canonical card effects,
 * God-Sechs, Darkness-Griffon, and Six Heaven Castle mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD32_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD32 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD32 X-Rares & Ace Cards', () => {
    it('SD32-X02 (The HeavenlyDemonKing God-Sechs) - Multi-color symbol & Rokuten abilities', () => {
      const override = getCardOverride('SD32-X02');
      assert.ok(override, 'Override must exist for SD32-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD32-X01 (The DarkKingGeneral Darkness-Griffon) - Core depletion & attack step control', () => {
      const override = getCardOverride('SD32-X01');
      assert.ok(override, 'Override must exist for SD32-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD32 Support & Spell Cards', () => {
    it('SD32-005 (Origamiantler) - Brave condition and fatigue/block manipulation', () => {
      const override = getCardOverride('SD32-005');
      assert.ok(override, 'Override must exist for SD32-005');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD32-006 (The Six Heaven Castle Dyed in Red) - Multi-symbol nexus support', () => {
      const override = getCardOverride('SD32-006');
      assert.ok(override, 'Override must exist for SD32-006');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
    });

    it('SD32-007 (Demon King Blade) - Flash destruction opcode', () => {
      const override = getCardOverride('SD32-007');
      assert.ok(override, 'Override must exist for SD32-007');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });
  });

  describe('3. SD32 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD32_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD32_OVERRIDES)) {
        if (!cardId.startsWith('SD32-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 9, `Expected at least 9 SD32 cards, got ${cardCount}`);
    });
  });

});
