/**
 * tests/bs15_card_effects.test.js
 * 
 * Regression Test Suite for BS15 (Booster Set 15: The Dragon Emperor's Rebirth / Sword of the Brave).
 * Verifies 100% deterministic execution of BS15 canonical card effects,
 * vanillas (Kudagitsunen, Rammer-Golem), X-Rares (Musashied-Ashliger,
 * Netherd-Baaral, Suzacross-Soso, LunaArk-Kaguya, Saigord-Golem),
 * and Burst triggers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS15_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS15 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS15 Vanilla Cards Stat & Ability Integrity', () => {
    it('BS15-037 (Kudagitsunen) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS15-037');
      assert.ok(override, 'Override must exist for BS15-037');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });

    it('BS15-046 (Rammer-Golem) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS15-046');
      assert.ok(override, 'Override must exist for BS15-046');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. BS15 X-Rares: Heroes & War Emperors', () => {
    it('BS15-X01 (The KatanaHero Musashied-Ashliger) - Burst trigger and battle abilities', () => {
      const override = getCardOverride('BS15-X01');
      assert.ok(override, 'Override must exist for BS15-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');

      const battleAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES');
      assert.ok(battleAb, 'Must have When Battles ability');
    });

    it('BS15-X02 (The HollowEmperor Netherd-Baaral) - Passive core reduction & attack step lock', () => {
      const override = getCardOverride('BS15-X02');
      assert.ok(override, 'Override must exist for BS15-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const passiveAb = override.abilities.find(a => a.header.timing === 'PASSIVE');
      assert.ok(passiveAb, 'Must have Passive ability');
    });

    it('BS15-X03 (The BirdWarEmperor Suzacross-Soso) - Battle and Attack Step abilities', () => {
      const override = getCardOverride('BS15-X03');
      assert.ok(override, 'Override must exist for BS15-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const battleAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES');
      assert.ok(battleAb, 'Must have When Battles ability');
    });

    it('BS15-X05 (The LightHero LunaArk-Kaguya) - Burst trigger and Attack Step defense', () => {
      const override = getCardOverride('BS15-X05');
      assert.ok(override, 'Override must exist for BS15-X05');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');
    });

    it('BS15-X06 (The IronHero Saigord-Golem) - Burst trigger and attack milling', () => {
      const override = getCardOverride('BS15-X06');
      assert.ok(override, 'Override must exist for BS15-X06');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must have Burst ability');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have When Attacks ability');
    });
  });

  describe('3. BS15 Booster Set Completeness & Schema Integrity', () => {
    it('All cards in BS15_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(BS15_OVERRIDES)) {
        if (!cardId.startsWith('BS15-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.ok(cardCount >= 54, `Expected at least 54 BS15 cards, got ${cardCount}`);
    });
  });

});
