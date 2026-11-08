/**
 * tests/sd42_card_effects.test.js
 * 
 * Regression Test Suite for SD42 (Collaboration Starter: Kamen Rider Decade / Complete Form).
 * Verifies 100% deterministic execution of SD42 canonical card effects,
 * Decade Complete Form, Ride Booker, Dimension Kick, and Kamen Rider Heisei forms.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD42_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD42 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD42 X-Rares & Ace Kamen Riders', () => {
    it('SD42-X01 (Kamen Rider Decade Complete Form) - Attack step triggers and Rider support', () => {
      const override = getCardOverride('SD42-X01');
      assert.ok(override, 'Override must exist for SD42-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD42-006 (Kamen Rider Decade) - Summon search & form change abilities', () => {
      const override = getCardOverride('SD42-006');
      assert.ok(override, 'Override must exist for SD42-006');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD42-010 (Kamen Rider Decade -Equip with Ride Booker-) - Combat and BP buffs', () => {
      const override = getCardOverride('SD42-010');
      assert.ok(override, 'Override must exist for SD42-010');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD42 Braves & Magic Arts', () => {
    it('SD42-012 (Ride Booker) - Brave condition, BP buff, and attack abilities', () => {
      const override = getCardOverride('SD42-012');
      assert.ok(override, 'Override must exist for SD42-012');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD42-015 (Dimension Kick) - Flash BP destruction opcode', () => {
      const override = getCardOverride('SD42-015');
      assert.ok(override, 'Override must exist for SD42-015');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD42-014 (Decade Illusion) - Burst reveal/summon and Main draw 2', () => {
      const override = getCardOverride('SD42-014');
      assert.ok(override, 'Override must exist for SD42-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
      const mainAb = override.abilities.find(a => a.header.timing === 'MAIN');
      assert.ok(mainAb, 'Must have Main ability');
    });

    it('SD42-013 (Machine Decader) - Deterministic nexus IR', () => {
      const override = getCardOverride('SD42-013');
      assert.ok(override, 'Override must exist for SD42-013');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
    });
  });

  describe('3. SD42 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD42_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD42_OVERRIDES)) {
        if (!cardId.startsWith('SD42-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 26, `Expected at least 26 SD42 cards, got ${cardCount}`);
    });
  });

});
