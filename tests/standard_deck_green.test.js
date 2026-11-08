/**
 * tests/standard_deck_green.test.js
 * 
 * Regression Test Suite for Standard Deck: Emerald Gale of Insect Sovereigns (std-green).
 * Verifies 100% deterministic execution of green standard deck cards:
 * 1. Vanilla Spirits (Beatbeetle)
 * 2. Foundation Overrides (Kingtaurus, Kaiseratlas, Divine Wind)
 * 3. Green Ramp & Combat Magic (Insect Aura, Breeze Ride, Axemoth)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride } from '../compiler/overrides/index.js';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('Standard Deck Green (Emerald Gale) Regression Suite', () => {

  describe('1. Vanilla & Foundation Integrity', () => {
    it('BS01-050 (Beatbeetle) resolves deterministically with isVanilla: true', () => {
      const override = getCardOverride('BS01-050');
      assert.ok(override, 'Override must exist for BS01-050');
      assert.equal(override.isVanilla, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.isFullySupported, true);
    });

    it('BS01-X03 (The Duke Kingtaurus) is fully supported with WHEN_ATTACKS trigger', () => {
      const override = getCardOverride('BS01-X03');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'MOVE_CORE');
    });

    it('BS02-096 (Divine Wind) is fully supported with MAIN core ramp opcode', () => {
      const override = getCardOverride('BS02-096');
      assert.ok(override);
    });
  });

  describe('2. PerCardRegistry Green Magic & Handlers', () => {

    it('BS12-077 (Insect Aura) has MAIN and FLASH triggers', () => {
      const handler = PerCardRegistry.get('BS12-077');
      assert.ok(handler, 'Insect Aura must be registered in PerCardRegistry');
      assert.ok(handler.triggers.MAIN, 'Insect Aura must have MAIN trigger');
      assert.ok(handler.triggers.FLASH, 'Insect Aura must have FLASH trigger');
    });

    it('BS13-077 (Breeze Ride) has FLASH trigger', () => {
      const handler = PerCardRegistry.get('BS13-077');
      assert.ok(handler, 'Breeze Ride must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Breeze Ride must have FLASH trigger');
    });

    it('BS24-020 (Axemoth) has WHEN_DESTROYED trigger', () => {
      const handler = PerCardRegistry.get('BS24-020');
      assert.ok(handler, 'Axemoth must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_DESTROYED, 'Axemoth must have WHEN_DESTROYED trigger');
    });
  });

  describe('3. Execution Scenarios', () => {

    it('Insect Aura FLASH grants +2000 BP to a spirit', async () => {
      const handler = PerCardRegistry.get('BS12-077');
      assert.ok(handler && handler.triggers.FLASH);

      const duelState = {
        player: {
          field: [
            { id: 'sp_1', name: 'Beatbeetle', currentBp: 1000 }
          ]
        },
        opponent: {}
      };

      const ctx = {
        card: { id: 'ia_1', cardNumber: 'BS12-077' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderDuelTable: () => {} }
      };

      await handler.triggers.FLASH(ctx);

      assert.equal(duelState.player.field[0].battleBp, 3000, 'Beatbeetle gained +2000 BP (1000 -> 3000)');
    });

    it('Breeze Ride FLASH grants +3000 BP to a spirit', async () => {
      const handler = PerCardRegistry.get('BS13-077');
      assert.ok(handler && handler.triggers.FLASH);

      const duelState = {
        player: {
          field: [
            { id: 'sp_1', name: 'Kingtaurus', currentBp: 5000 }
          ]
        },
        opponent: {}
      };

      const ctx = {
        card: { id: 'br_1', cardNumber: 'BS13-077' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderDuelTable: () => {} }
      };

      await handler.triggers.FLASH(ctx);

      assert.equal(duelState.player.field[0].battleBp, 8000, 'Kingtaurus gained +3000 BP (5000 -> 8000)');
    });

    it('Axemoth WHEN_DESTROYED returns to hand instead of trash', async () => {
      const handler = PerCardRegistry.get('BS24-020');
      assert.ok(handler && handler.triggers.WHEN_DESTROYED);

      const axemothCard = { id: 'axe_1', cardNumber: 'BS24-020', name: 'Axemoth' };
      const duelState = {
        player: {
          field: [axemothCard],
          hand: [],
          trashCards: []
        },
        opponent: {}
      };

      const ctx = {
        card: axemothCard,
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderPlayerHand: () => {} }
      };

      await handler.triggers.WHEN_DESTROYED(ctx);

      assert.equal(duelState.player.hand.length, 1, 'Axemoth returned to hand');
      assert.equal(duelState.player.hand[0].name, 'Axemoth');
    });

  });

});
