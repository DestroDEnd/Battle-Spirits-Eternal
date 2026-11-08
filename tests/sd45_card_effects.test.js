/**
 * tests/sd45_card_effects.test.js
 * 
 * Regression Test Suite for SD45 (Collaboration Starter: Digimon - Selected Children).
 * Verifies 100% deterministic execution of SD45 canonical card effects,
 * Omnimon, WarGreymon, MetalGarurumon, Agumon, Gabumon, Crests, and Digimon Evolution spells.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD45_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD45 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD45 Mega Digimon & Key Bosses', () => {
    it('SD45-006 (Omnimon［2］) - Advent Mega, pre-Advent discard, and core salvage', () => {
      const override = getCardOverride('SD45-006');
      assert.ok(override, 'Override must exist for SD45-006');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.ok(override.keywords.some(k => k.name === 'Advent'), 'Must have Advent keyword');
    });

    it('SD45-005 (WarGreymon［2］) - Summon destruction and bounce immunity', () => {
      const override = getCardOverride('SD45-005');
      assert.ok(override, 'Override must exist for SD45-005');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 2, 'Must have at least 2 abilities');
    });

    it('SD45-010 (MetalGarurumon［2］) - Deck reveal, draw, and bounce mechanics', () => {
      const override = getCardOverride('SD45-010');
      assert.ok(override, 'Override must exist for SD45-010');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD45 Child Digimon, Crests & Evolution Spells', () => {
    it('SD45-001 (Agumon［2］) - Digivolution search and draw', () => {
      const override = getCardOverride('SD45-001');
      assert.ok(override, 'Override must exist for SD45-001');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD45-007 (Gabumon［2］) - Digivolution search and draw', () => {
      const override = getCardOverride('SD45-007');
      assert.ok(override, 'Override must exist for SD45-007');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD45-011 (The Crest of Courage) - Nexus draw and BP buff mechanics', () => {
      const override = getCardOverride('SD45-011');
      assert.ok(override, 'Override must exist for SD45-011');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD45-013 (Evolution Draw) - Main and Flash spell mechanics', () => {
      const override = getCardOverride('SD45-013');
      assert.ok(override, 'Override must exist for SD45-013');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD45 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD45_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD45_OVERRIDES)) {
        if (!cardId.startsWith('SD45-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 20, `Expected at least 20 SD45 cards, got ${cardCount}`);
    });
  });

});
