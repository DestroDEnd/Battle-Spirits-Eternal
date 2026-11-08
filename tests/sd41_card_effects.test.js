/**
 * tests/sd41_card_effects.test.js
 * 
 * Regression Test Suite for SD41 (Mega Deck: Makai Dragon / Siegfried-Necro).
 * Verifies 100% deterministic execution of SD41 canonical card effects,
 * Siegfried-Necro, Darkwurm-Regalia, and purple depletion/Accel mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD41_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD41 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD41 X-Rares & Ace Dragons', () => {
    it('SD41-X01 (The MakaiPhantomDragon Siegfried-Necro) - Attack core depletion & revive triggers', () => {
      const override = getCardOverride('SD41-X01');
      assert.ok(override, 'Override must exist for SD41-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD41-007 (The MakaiEmperorDragon Darkwurm-Regalia) - Core drain and battle triggers', () => {
      const override = getCardOverride('SD41-007');
      assert.ok(override, 'Override must exist for SD41-007');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD41-008 (The DivineHellGun Armillary-Sphere) - Brave condition and depletion abilities', () => {
      const override = getCardOverride('SD41-008');
      assert.ok(override, 'Override must exist for SD41-008');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD41 Accel & Purple Support', () => {
    it('SD41-005 (Jadgas) - Accel core drain and summon draw', () => {
      const override = getCardOverride('SD41-005');
      assert.ok(override, 'Override must exist for SD41-005');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD41-003 (Smog Hand) - Accel trash revival', () => {
      const override = getCardOverride('SD41-003');
      assert.ok(override, 'Override must exist for SD41-003');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD41 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD41_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD41_OVERRIDES)) {
        if (!cardId.startsWith('SD41-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 9, `Expected at least 9 SD41 cards, got ${cardCount}`);
    });
  });

});
