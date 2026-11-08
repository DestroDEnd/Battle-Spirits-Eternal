/**
 * tests/javad_support_cards.test.js
 * 
 * Regression Test Suite for Remaining Javad Custom Deck Staples:
 * - BS26-075 Forbidden Grave (Flash summon Ultimate from Trash)
 * - BSC17-X04 Ultimate-Trickster (Summon salvage Magic from Trash)
 * - BS28-X05 Ultimate-Seiryubi (Violent High Speed Flash summon)
 * - BATTLE-SPIRITS-A12408 The ShelledEarl Metallifer (Burst <=20000 BP destruction)
 * - BS28-X06 The NextGenerationMachineBeast Blizza-Liger (Burst bounce spirit to decktop)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/index.js';

describe('Javad Deck Support Cards Regression Suite', () => {

  describe('1. Handler Registration Integrity', () => {
    const cards = [
      'BS26-075', 'BSC17-X04', 'BS28-X05',
      'BATTLE-SPIRITS-A12408', 'BS28-X06'
    ];

    for (const cardNum of cards) {
      it(`${cardNum} is registered in PerCardRegistry`, () => {
        const handler = PerCardRegistry.get(cardNum);
        assert.ok(handler, `${cardNum} must be registered in PerCardRegistry`);
        assert.ok(handler.triggers, `${cardNum} must define triggers`);
      });
    }
  });

  describe('2. Execution Scenarios', () => {

    it('BS26-075 (Forbidden Grave) FLASH summons an Ultimate from trash', () => {
      const handler = PerCardRegistry.get('BS26-075');
      assert.ok(handler && handler.triggers.FLASH);

      const targetUltimate = { id: 'u1', name: 'Dead Ultimate', type: 'Ultimate' };
      const ctx = {
        side: 'player',
        duelState: {
          player: {
            trashCards: [targetUltimate],
            field: []
          }
        }
      };

      handler.triggers.FLASH(ctx);
      assert.equal(ctx.duelState.player.field.length, 1);
      assert.equal(ctx.duelState.player.field[0].id, 'u1');
      assert.equal(ctx.duelState.player.trashCards.length, 0);
    });

    it('BSC17-X04 (Ultimate-Trickster) WHEN_SUMMONED salvages Magic from trash', () => {
      const handler = PerCardRegistry.get('BSC17-X04');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      const magicCard = { id: 'm1', name: 'Burst Wall', type: 'Magic' };
      const card = { id: 'trickster', name: 'Ultimate-Trickster', currentLevel: 3 };
      const ctx = {
        card,
        side: 'player',
        duelState: {
          player: {
            trashCards: [magicCard],
            hand: []
          }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctx);
      assert.equal(ctx.duelState.player.hand.length, 1);
      assert.equal(ctx.duelState.player.hand[0].id, 'm1');
      assert.equal(ctx.duelState.player.trashCards.length, 0);
    });

    it('BS28-X05 (Ultimate-Seiryubi) FLASH summons from hand if 5+ cores in trash', () => {
      const handler = PerCardRegistry.get('BS28-X05');
      assert.ok(handler && handler.triggers.FLASH);

      const seiryubi = { id: 'seiryubi', name: 'Ultimate-Seiryubi', currentCores: 0 };
      const ctx = {
        card: seiryubi,
        side: 'player',
        duelState: {
          player: {
            hand: [seiryubi],
            field: [],
            trash: 5,
            reserve: 0
          }
        }
      };

      handler.triggers.FLASH(ctx);
      assert.equal(ctx.duelState.player.field.length, 1);
      assert.equal(ctx.duelState.player.field[0].id, 'seiryubi');
      assert.equal(ctx.duelState.player.trash, 0);
      assert.equal(ctx.duelState.player.reserve, 4);
      assert.equal(seiryubi.currentCores, 1);
    });

    it('BATTLE-SPIRITS-A12408 (The ShelledEarl Metallifer) BURST destroys opposing spirits up to 20000 BP', () => {
      const handler = PerCardRegistry.get('BATTLE-SPIRITS-A12408');
      assert.ok(handler && handler.triggers.BURST);

      const opp1 = { id: 'o1', name: 'Spirit 1', bp: 8000, type: 'Spirit' };
      const opp2 = { id: 'o2', name: 'Spirit 2', bp: 11000, type: 'Spirit' };
      const opp3 = { id: 'o3', name: 'Spirit 3', bp: 5000, type: 'Spirit' };
      const ctx = {
        side: 'player',
        duelState: {
          opponent: {
            field: [opp1, opp2, opp3],
            trashCards: []
          }
        }
      };

      handler.triggers.BURST(ctx);
      // opp3 (5k) + opp1 (8k) = 13k <= 20k -> destroyed, opp2 (11k) exceeds remaining cap (7k) and remains
      assert.equal(ctx.duelState.opponent.field.length, 1);
      assert.equal(ctx.duelState.opponent.field[0].id, 'o2');
      assert.equal(ctx.duelState.opponent.trashCards.length, 2);
    });

    it('BS28-X06 (Blizza-Liger) BURST returns opposing spirit to decktop if life <= 3', () => {
      const handler = PerCardRegistry.get('BS28-X06');
      assert.ok(handler && handler.triggers.BURST);

      const oppSpirit = { id: 'opp', name: 'Opp Spirit', type: 'Spirit' };
      const ctx = {
        side: 'player',
        duelState: {
          player: { life: 3 },
          opponent: {
            field: [oppSpirit],
            deck: []
          }
        }
      };

      handler.triggers.BURST(ctx);
      assert.equal(ctx.duelState.opponent.field.length, 0);
      assert.equal(ctx.duelState.opponent.deck.length, 1);
      assert.equal(ctx.duelState.opponent.deck[0].id, 'opp');
    });

  });

});
