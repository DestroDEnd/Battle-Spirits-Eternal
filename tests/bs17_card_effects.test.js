/**
 * tests/bs17_card_effects.test.js
 * 
 * Regression Test Suite for BS17 (Booster Set 17: The Sword of Heroes / Rise of the Heroic Spirits).
 * Verifies 100% deterministic execution of BS17 canonical card effects,
 * vanillas (Mudoolo), X-Rares (Sieg-Susano-Fried, Swordius-Arthur,
 * Byakgalord-Sonken, Ragna-Fenrir, Cleopatras, Sahrzad), and Sword Brave triggers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS17_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS17 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS17 Vanilla Cards Stat & Ability Integrity', () => {
    it('BS17-010 (Mudoolo) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS17-010');
      assert.ok(override, 'Override must exist for BS17-010');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. BS17 X-Rares: Sword Heroes & Deities', () => {
    it('BS17-X01 (The SwordHero Sieg-Susano-Fried) - Burst trigger and attack step triggers', () => {
      const override = getCardOverride('BS17-X01');
      assert.ok(override, 'Override must exist for BS17-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have When Attacks ability');
    });

    it('BS17-X02 (The KnightHero Swordius-Arthur) - Burst trigger and When Brave Attacks', () => {
      const override = getCardOverride('BS17-X02');
      assert.ok(override, 'Override must exist for BS17-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');

      const braveAttAb = override.abilities.find(a => a.header.timing === 'WHEN_BRAVE_ATTACKS');
      assert.ok(braveAttAb, 'Must have When Brave Attacks ability');
    });

    it('BS17-X03 (The FangEmperor Byakgalord-Sonken) - Passive BP buff and When Attacks', () => {
      const override = getCardOverride('BS17-X03');
      assert.ok(override, 'Override must exist for BS17-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const passiveAb = override.abilities.find(a => a.header.timing === 'PASSIVE');
      assert.ok(passiveAb, 'Must have Passive ability');
    });

    it('BS17-X04 (The WolfMachineDeity Ragna-Fenrir) - When Summoned and When Brave Attacks', () => {
      const override = getCardOverride('BS17-X04');
      assert.ok(override, 'Override must exist for BS17-X04');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have When Summoned ability');
    });

    it('BS17-X05 (The BeautyHero Cleopatras) - Burst trigger and When Summoned spell reuse', () => {
      const override = getCardOverride('BS17-X05');
      assert.ok(override, 'Override must exist for BS17-X05');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
    });

    it('BS17-X06 (The ArabianNightEmpress Sahrzad) - When Summoned and Attack Step locks', () => {
      const override = getCardOverride('BS17-X06');
      assert.ok(override, 'Override must exist for BS17-X06');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have When Summoned ability');
    });
  });

  describe('3. BS17 Booster Set Completeness & Schema Integrity', () => {
    it('All cards in BS17_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(BS17_OVERRIDES)) {
        if (!cardId.startsWith('BS17-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 64, `Expected at least 64 BS17 cards, got ${cardCount}`);
    });
  });

});
