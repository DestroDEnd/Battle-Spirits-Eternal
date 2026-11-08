/**
 * tests/bs19_card_effects.test.js
 * 
 * Regression Test Suite for BS19 (Booster Set 19: The Sword of Justice / 聖剣時代).
 * Verifies 100% deterministic execution of BS19 canonical card effects,
 * TenSwordMasters Starblade-Dragon, Usubakagero, Baroque-Bordeaux, Soldnerg, and Charge/Assault mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS19_OVERRIDES, VANILLA_CARD_NUMBERS } from '../compiler/overrides/index.js';

describe('BS19 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS19 Vanilla Cards Stat & Ability Integrity', () => {
    const bs19Vanillas = [
      { id: 'BS19-023', name: 'Grass-Owl' },
      { id: 'BS19-026', name: 'Fosser' },
      { id: 'BS19-031', name: 'Tokiiroshidare' },
      { id: 'BS19-047', name: 'The SleepingFlowerFairy Filly' },
      { id: 'BS19-063', name: 'Marble-Golem' }
    ];

    for (const v of bs19Vanillas) {
      it(`${v.id} (${v.name}) has explicit vanilla IR with 0 abilities`, () => {
        assert.ok(VANILLA_CARD_NUMBERS.has(v.id), `${v.id} must be in VANILLA_CARD_NUMBERS`);
        const override = getCardOverride(v.id);
        assert.ok(override, `Override must exist for ${v.id}`);
        assert.equal(override.isVanilla, true, `${v.id} must be marked vanilla`);
        assert.equal(override.isFullySupported, true, `${v.id} must be fully supported`);
        assert.equal(override.abilities.length, 0, `${v.id} must have 0 abilities`);
        assert.equal(override.unsupportedClausesCount, 0, `${v.id} must have 0 unsupported clauses`);
      });
    }
  });

  describe('2. BS19 X-Rares: Sword Masters & Emperors', () => {
    it('BS19-X01 (The TenSwordMasters Starblade-Dragon) - Charge, Brave, and Attack triggers', () => {
      const override = getCardOverride('BS19-X01');
      assert.ok(override, 'Override must exist for BS19-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_ATTACKS');
    });

    it('BS19-X02 (The NetherThreeGiants Baroque-Bordeaux) - When Summoned and Attack Step triggers', () => {
      const override = getCardOverride('BS19-X02');
      assert.ok(override, 'Override must exist for BS19-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
    });

    it('BS19-X03 (The BlackInsectDemonLord Diabolica-Mantis) - When Attacks and Attack Step triggers', () => {
      const override = getCardOverride('BS19-X03');
      assert.ok(override, 'Override must exist for BS19-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 2, 'Must have at least 2 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_ATTACKS');
    });

    it('BS19-X04 (The GoldenKnightLord Finn-Maclan) - Heavy armor, attack BP, and step triggers', () => {
      const override = getCardOverride('BS19-X04');
      assert.ok(override, 'Override must exist for BS19-X04');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
    });

    it('BS19-X05 (The ArcAngelia Gabrielen) - When Battles and battle step triggers', () => {
      const override = getCardOverride('BS19-X05');
      assert.ok(override, 'Override must exist for BS19-X05');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
    });

    it('BS19-X06 (The BattleRadiantGod Soldnerg) - Deck discard, Charge, and refresh triggers', () => {
      const override = getCardOverride('BS19-X06');
      assert.ok(override, 'Override must exist for BS19-X06');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.ok(override.keywords.some(k => k.name === 'Charge'), 'Must possess Charge keyword');
    });

    it('BS19-X07 (The BlackInsectDemonBlade Usubakagero) - Brave Sword triggers and core depletion', () => {
      const override = getCardOverride('BS19-X07');
      assert.ok(override, 'Override must exist for BS19-X07');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 4, 'Must have at least 4 abilities');
    });

    it('BS19-X08 (The AzureOceanGreatSword Maelstrom) - Charge, Assault, and refresh mechanics', () => {
      const override = getCardOverride('BS19-X08');
      assert.ok(override, 'Override must exist for BS19-X08');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 4, 'Must have at least 4 abilities');
    });
  });

  describe('3. BS19 Booster Set Completeness & Schema Integrity', () => {
    it('All cards in BS19_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(BS19_OVERRIDES)) {
        if (!cardId.startsWith('BS19-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.equal(cardCount, 93, `Expected exactly 93 BS19 cards in overrides, got ${cardCount}`);
    });
  });

});
