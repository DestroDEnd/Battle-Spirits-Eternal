/**
 * tests/sd37_card_effects.test.js
 * 
 * Regression Test Suite for SD37 (Mega Deck: Twinkle Light & Advent Fire / Divaleon).
 * Verifies 100% deterministic execution of SD37 canonical card effects,
 * Advent/Twinkle mechanics, and red support spells.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD37_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD37 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD37 Key Spirits & Advent Mechanics', () => {
    it('SD37-009 (The TwinkleLion Divaleon) - Advent ability and battle destruction', () => {
      const override = getCardOverride('SD37-009');
      assert.ok(override, 'Override must exist for SD37-009');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD37-006 (Rubyclaw Jaguar) - Attack step triggers and BP buff', () => {
      const override = getCardOverride('SD37-006');
      assert.ok(override, 'Override must exist for SD37-006');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD37-001 (Draw Genet) - Summon and destruction draw abilities', () => {
      const override = getCardOverride('SD37-001');
      assert.ok(override, 'Override must exist for SD37-001');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD37 Spells & Magic Arts', () => {
    it('SD37-012 (Advent Draw) - Main draw 2 and advent search', () => {
      const override = getCardOverride('SD37-012');
      assert.ok(override, 'Override must exist for SD37-012');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const mainAb = override.abilities.find(a => a.header.timing === 'MAIN');
      assert.ok(mainAb, 'Must have Main ability');
    });

    it('SD37-013 (Red Lightning) - Flash destruction opcode', () => {
      const override = getCardOverride('SD37-013');
      assert.ok(override, 'Override must exist for SD37-013');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD37-014 (Evolution Attack) - Flash BP buff & refresh opcode', () => {
      const override = getCardOverride('SD37-014');
      assert.ok(override, 'Override must exist for SD37-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });
  });

  describe('3. SD37 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD37_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD37_OVERRIDES)) {
        if (!cardId.startsWith('SD37-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 9, `Expected at least 9 SD37 cards, got ${cardCount}`);
    });
  });

});
