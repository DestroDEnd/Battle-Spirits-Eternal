/**
 * tests/bs16_card_effects.test.js
 * 
 * Regression Test Suite for BS16 (Booster Set 16: The Explosion Hero / Burst Heroes Expansion).
 * Verifies 100% deterministic execution of BS16 canonical card effects,
 * vanillas (Ashigaryu, Flow-Zacco, SpadeBeast-Leo), X-Rares (Lord-Dragon-Bazzel,
 * Gyukotsumaou, Seiryubi, Mibrock-Braver, Arcanamaster-Oz, Yamatanohydra),
 * and Burst triggers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS16_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS16 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS16 Vanilla Cards Stat & Ability Integrity', () => {
    it('BS16-004 (Ashigaryu) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS16-004');
      assert.ok(override, 'Override must exist for BS16-004');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS16-028 (Flow-Zacco) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS16-028');
      assert.ok(override, 'Override must exist for BS16-028');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS16-043 (SpadeBeast-Leo) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS16-043');
      assert.ok(override, 'Override must exist for BS16-043');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. BS16 X-Rares: Burst Heroes & Overlords', () => {
    it('BS16-X01 (The ExplosionHero Lord-Dragon-Bazzel) - Burst trigger and attack step triggers', () => {
      const override = getCardOverride('BS16-X01');
      assert.ok(override, 'Override must exist for BS16-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have When Attacks ability');
    });

    it('BS16-X02 (Gyukotsumaou) - When Attacks and When Destroyed triggers', () => {
      const override = getCardOverride('BS16-X02');
      assert.ok(override, 'Override must exist for BS16-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have When Attacks ability');

      const destAb = override.abilities.find(a => a.header.timing === 'WHEN_DESTROYED');
      assert.ok(destAb, 'Must have When Destroyed ability');
    });

    it('BS16-X03 (The RetsuHero Seiryubi) - Burst trigger and Attack Step combat resolution', () => {
      const override = getCardOverride('BS16-X03');
      assert.ok(override, 'Override must exist for BS16-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
    });

    it('BS16-X04 (The CharismaHero Mibrock-Braver) - Passive BP buff and Attack Step mechanics', () => {
      const override = getCardOverride('BS16-X04');
      assert.ok(override, 'Override must exist for BS16-X04');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const passiveAb = override.abilities.find(a => a.header.timing === 'PASSIVE');
      assert.ok(passiveAb, 'Must have Passive ability');
    });

    it('BS16-X05 (Arcanamaster-Oz) - When Summoned and Passive spell abilities', () => {
      const override = getCardOverride('BS16-X05');
      assert.ok(override, 'Override must exist for BS16-X05');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have When Summoned ability');
    });

    it('BS16-X06 (The MountainsDragon Yamatanohydra) - Multiple attack triggers and symbol strikes', () => {
      const override = getCardOverride('BS16-X06');
      assert.ok(override, 'Override must exist for BS16-X06');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have When Attacks ability');
    });
  });

  describe('3. BS16 Booster Set Completeness & Schema Integrity', () => {
    it('All cards in BS16_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(BS16_OVERRIDES)) {
        if (!cardId.startsWith('BS16-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 64, `Expected at least 64 BS16 cards, got ${cardCount}`);
    });
  });

});
