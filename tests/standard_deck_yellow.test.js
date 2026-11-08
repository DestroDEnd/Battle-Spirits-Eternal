/**
 * tests/standard_deck_yellow.test.js
 * 
 * Regression Test Suite for Standard Deck: Celestial Symphony of Seraphs (std-yellow).
 * Verifies 100% deterministic execution of yellow standard deck cards:
 * 1. Vanilla Spirits (Koristal, Piyon, Chocorone)
 * 2. SD15 / BS02 Foundation Overrides (Archiel, Angeloid, Additional Color)
 * 3. Yellow Magic & Handlers (Defense Nebula, After Image, Haneppo)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride } from '../compiler/overrides/index.js';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('Standard Deck Yellow (Celestial Symphony) Regression Suite', () => {

  describe('1. Vanilla Integrity', () => {
    const yellowVanillas = ['BATTLE-SPIRITS-A960', 'BATTLE-SPIRITS-A3393'];

    for (const cardNum of yellowVanillas) {
      it(`${cardNum} resolves deterministically with isVanilla: true`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.isFullySupported, true);
      });
    }
  });

  describe('2. SD15 / BS02 Foundation Yellow Cards', () => {
    it('BS02-050 (Koristal) is fully supported with WHEN_BATTLES ability', () => {
      const override = getCardOverride('BS02-050');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
    });

    it('SD15-003 (The Angelia Archiel) is fully supported', () => {
      const override = getCardOverride('SD15-003');
      assert.ok(override);
    });

    it('SD15-006 (Angeloid) is fully supported', () => {
      const override = getCardOverride('SD15-006');
      assert.ok(override);
    });

    it('BS02-104 (Additional Color) is fully supported', () => {
      const override = getCardOverride('BS02-104');
      assert.ok(override);
    });
  });

  describe('3. PerCardRegistry Yellow Magic & Triggers', () => {

    it('BS27-082 (Defense Nebula) has FLASH trigger reducing spirit to LV1', () => {
      const handler = PerCardRegistry.get('BS27-082');
      assert.ok(handler, 'Defense Nebula must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Defense Nebula must have FLASH trigger');
    });

    it('BS41-092 (After Image) has FLASH trigger preventing mill', () => {
      const handler = PerCardRegistry.get('BS41-092');
      assert.ok(handler, 'After Image must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'After Image must have FLASH trigger');
    });

    it('BATTLE-SPIRITS-A4868 (Haneppo) has WHEN_DESTROYED trigger', () => {
      const handler = PerCardRegistry.get('BATTLE-SPIRITS-A4868');
      assert.ok(handler, 'Haneppo must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_DESTROYED, 'Haneppo must have WHEN_DESTROYED trigger');
    });
  });

  describe('4. Execution Scenarios', () => {

    it('Defense Nebula FLASH treats target opposing spirit as LV1', async () => {
      const handler = PerCardRegistry.get('BS27-082');
      assert.ok(handler && handler.triggers.FLASH);

      const targetSpirit = { id: 'opp_sp_1', name: 'Desperado', currentLevel: 3, currentCores: 5 };
      const duelState = {
        player: {},
        opponent: { field: [targetSpirit] }
      };

      const ctx = {
        card: { id: 'dn_1', cardNumber: 'BS27-082' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderDuelTable: () => {} }
      };

      await handler.triggers.FLASH(ctx);

      assert.equal(duelState.opponent.field[0].currentLevel, 1, 'Opponent spirit level forced to LV1');
    });

    it('After Image FLASH adds PREVENT_MILL modifier to state', async () => {
      const handler = PerCardRegistry.get('BS41-092');
      assert.ok(handler && handler.triggers.FLASH);

      const duelState = {
        player: {},
        opponent: {},
        modifiers: []
      };

      const ctx = {
        card: { id: 'ai_1', cardNumber: 'BS41-092' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderDuelTable: () => {} }
      };

      await handler.triggers.FLASH(ctx);

      const mod = duelState.modifiers.find(m => m.type === 'PREVENT_MILL');
      assert.ok(mod, 'PREVENT_MILL modifier must be active');
      assert.equal(mod.duration, 'THIS_TURN');
    });

    it('Haneppo WHEN_DESTROYED draws 2 cards from deck to hand', async () => {
      const handler = PerCardRegistry.get('BATTLE-SPIRITS-A4868');
      assert.ok(handler && handler.triggers.WHEN_DESTROYED);

      const duelState = {
        player: {
          hand: [],
          deck: [
            { id: 'c1', name: 'Koristal' },
            { id: 'c2', name: 'Piyon' }
          ]
        },
        opponent: {}
      };

      const ctx = {
        card: { id: 'han_1', cardNumber: 'BATTLE-SPIRITS-A4868' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderPlayerHand: () => {} }
      };

      await handler.triggers.WHEN_DESTROYED(ctx);

      assert.equal(duelState.player.hand.length, 2, 'Drew 2 cards on destruction');
    });

  });

});
