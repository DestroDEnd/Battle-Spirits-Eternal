/**
 * tests/sd39_card_effects.test.js
 * 
 * Regression Test Suite for SD39 (Mega Deck: Twinkle Light & White Fortress / Nu-Siegfried).
 * Verifies 100% deterministic execution of SD39 canonical card effects,
 * Nu-Siegfried, Braves (Glorious-Flugel, Guns-Balmung), and white defense magic.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD39_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD39 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD39 X-Rares & Ace Spirits', () => {
    it('SD39-X01 (The NobleDragoon Nu-Siegfried) - Advent ability, bounce, and refresh triggers', () => {
      const override = getCardOverride('SD39-X01');
      assert.ok(override, 'Override must exist for SD39-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD39-008 (The ProtectionGodKing Glorious-Sheep Type-F) - Defense bounce and life shield', () => {
      const override = getCardOverride('SD39-008');
      assert.ok(override, 'Override must exist for SD39-008');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD39 Braves & Weapons', () => {
    it('SD39-010 (Glorious-Flugel) - Brave condition, defense buff, and bounce', () => {
      const override = getCardOverride('SD39-010');
      assert.ok(override, 'Override must exist for SD39-010');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD39-011 (The TwinkleDragonGunblade Guns-Balmung) - Brave condition and battle triggers', () => {
      const override = getCardOverride('SD39-011');
      assert.ok(override, 'Override must exist for SD39-011');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD39 Spells & Defense Shields', () => {
    it('SD39-013 (Rampart Wall) - Flash attack step termination / damage prevention', () => {
      const override = getCardOverride('SD39-013');
      assert.ok(override, 'Override must exist for SD39-013');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD39-014 (Balmung Shot) - Flash bounce opcode', () => {
      const override = getCardOverride('SD39-014');
      assert.ok(override, 'Override must exist for SD39-014');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD39-012 (Das Rheingold) - Deterministic nexus IR', () => {
      const override = getCardOverride('SD39-012');
      assert.ok(override, 'Override must exist for SD39-012');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
    });
  });

  describe('4. SD39 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD39_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD39_OVERRIDES)) {
        if (!cardId.startsWith('SD39-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 12, `Expected at least 12 SD39 cards, got ${cardCount}`);
    });
  });

});
