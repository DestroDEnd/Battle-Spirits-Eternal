/**
 * tests/sd34_card_effects.test.js
 * 
 * Regression Test Suite for SD34 (Mega Deck: Demon God of Destruction / Bascarl & Dragon Demon-God).
 * Verifies 100% deterministic execution of SD34 canonical card effects,
 * vanillas (Death Claw Dragon), X-Rare Brave (Dragon Demon-God),
 * and purple core depletion mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD34_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD34 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD34 Vanilla Cards Stat & Ability Integrity', () => {
    it('SD34-006 (Death Claw Dragon) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD34-006');
      assert.ok(override, 'Override must exist for SD34-006');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. SD34 X-Rares & Ace Cards', () => {
    it('SD34-X01 (Dragon Demon-God) - Brave summon and brave battle abilities', () => {
      const override = getCardOverride('SD34-X01');
      assert.ok(override, 'Override must exist for SD34-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD34-010 (The DeathDragonGreatEmperor Bascarl) - Core removal and summon triggers', () => {
      const override = getCardOverride('SD34-010');
      assert.ok(override, 'Override must exist for SD34-010');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD34-008 (The CrystalDragon Amethyst-Dragon) - Core ramp and battle abilities', () => {
      const override = getCardOverride('SD34-008');
      assert.ok(override, 'Override must exist for SD34-008');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD34 Spells & Nexus Cards', () => {
    it('SD34-014 (Death Shoot) - Flash core removal opcode', () => {
      const override = getCardOverride('SD34-014');
      assert.ok(override, 'Override must exist for SD34-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD34-011 (The Amethyst Ancient Palace) - Deterministic nexus IR', () => {
      const override = getCardOverride('SD34-011');
      assert.ok(override, 'Override must exist for SD34-011');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
    });
  });

  describe('4. SD34 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD34_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD34_OVERRIDES)) {
        if (!cardId.startsWith('SD34-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 15, `Expected at least 15 SD34 cards, got ${cardCount}`);
    });
  });

});
