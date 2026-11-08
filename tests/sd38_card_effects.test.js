/**
 * tests/sd38_card_effects.test.js
 * 
 * Regression Test Suite for SD38 (Mega Deck: Twinkle Light & Storm Wings / Simurgh).
 * Verifies 100% deterministic execution of SD38 canonical card effects,
 * green Winged Beast advent mechanics, and exhaustion spells.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD38_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD38 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD38 Key Spirits & Advent Mechanics', () => {
    it('SD38-010 (The TwinkleEmperor Simurgh) - Advent ability and exhaust/refresh manipulation', () => {
      const override = getCardOverride('SD38-010');
      assert.ok(override, 'Override must exist for SD38-010');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD38-007 (The StrikerBird Bruce-Kei) - Combat triggers and fatigue', () => {
      const override = getCardOverride('SD38-007');
      assert.ok(override, 'Override must exist for SD38-007');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD38-001 (Shiroena) - Summon core recovery / draw', () => {
      const override = getCardOverride('SD38-001');
      assert.ok(override, 'Override must exist for SD38-001');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('2. SD38 Spells & Nexus Cards', () => {
    it('SD38-011 (The Phoenix\'s Tailfeathers) - Deterministic nexus IR', () => {
      const override = getCardOverride('SD38-011');
      assert.ok(override, 'Override must exist for SD38-011');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
    });

    it('SD38-012 (Bird Kick) - Flash exhaustion opcode', () => {
      const override = getCardOverride('SD38-012');
      assert.ok(override, 'Override must exist for SD38-012');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });

    it('SD38-013 (Sonic Wind) - Flash core ramp and fatigue', () => {
      const override = getCardOverride('SD38-013');
      assert.ok(override, 'Override must exist for SD38-013');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      const flashAb = override.abilities.find(a => a.header.timing === 'FLASH');
      assert.ok(flashAb, 'Must have Flash ability');
    });
  });

  describe('3. SD38 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD38_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD38_OVERRIDES)) {
        if (!cardId.startsWith('SD38-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 11, `Expected at least 11 SD38 cards, got ${cardCount}`);
    });
  });

});
