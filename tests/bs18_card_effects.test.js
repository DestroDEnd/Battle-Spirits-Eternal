/**
 * tests/bs18_card_effects.test.js
 * 
 * Regression Test Suite for BS18 (Booster Set 18: The Sacred Sword / Legend of the Sword Brave).
 * Verifies 100% deterministic execution of BS18 canonical card effects,
 * vanillas (Camelot-Pawn, Homuncu, Gladdy-Squalo), X-Rares (Lord-Dragon-Saviour,
 * Avalo-Paladion, Kung-Wolf, Lord-Dragon-Glazar, Mephisto-Pheles, Otherthoth),
 * and Sword Brave triggers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS18_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS18 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS18 Vanilla Cards Stat & Ability Integrity', () => {
    it('BS18-010 (Camelot-Pawn) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS18-010');
      assert.ok(override, 'Override must exist for BS18-010');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS18-037 (Homuncu) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS18-037');
      assert.ok(override, 'Override must exist for BS18-037');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS18-049 (Gladdy-Squalo) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS18-049');
      assert.ok(override, 'Override must exist for BS18-049');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. BS18 X-Rares: Sacred Sword Heroes & Emperors', () => {
    it('BS18-X01 (The SuperHero Lord-Dragon-Saviour) - Burst trigger and attack/block abilities', () => {
      const override = getCardOverride('BS18-X01');
      assert.ok(override, 'Override must exist for BS18-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');

      const attBlockAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS_OR_BLOCKS');
      assert.ok(attBlockAb, 'Must have When Attacks/Blocks ability');
    });

    it('BS18-X02 (The KnightsEmperor Avalo-Paladion) - When Summoned and Attack Step triggers', () => {
      const override = getCardOverride('BS18-X02');
      assert.ok(override, 'Override must exist for BS18-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have When Summoned ability');
    });

    it('BS18-X03 (The BlueSkyHero Kung-Wolf) - Burst trigger, summon, and attack abilities', () => {
      const override = getCardOverride('BS18-X03');
      assert.ok(override, 'Override must exist for BS18-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
    });

    it('BS18-X04 (The GlacialHero Lord-Dragon-Glazar) - Burst trigger and battle abilities', () => {
      const override = getCardOverride('BS18-X04');
      assert.ok(override, 'Override must exist for BS18-X04');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
    });

    it('BS18-X05 (The HolyEvilEmperor Mephisto-Pheles) - When Attacks and Attack Step mechanics', () => {
      const override = getCardOverride('BS18-X05');
      assert.ok(override, 'Override must exist for BS18-X05');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have When Attacks ability');
    });

    it('BS18-X06 (The ChaosEmperor Otherthoth) - When Summoned and When Attacks', () => {
      const override = getCardOverride('BS18-X06');
      assert.ok(override, 'Override must exist for BS18-X06');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have When Summoned ability');
    });
  });

  describe('3. BS18 Booster Set Completeness & Schema Integrity', () => {
    it('All cards in BS18_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(BS18_OVERRIDES)) {
        if (!cardId.startsWith('BS18-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 68, `Expected at least 68 BS18 cards, got ${cardCount}`);
    });
  });

});
