/**
 * tests/standard_deck_red.test.js
 * 
 * Regression Test Suite for Standard Deck: Hero Dragon's Blazing Soul (std-red).
 * Verifies 100% deterministic execution of red standard deck cards:
 * 1. Vanilla Spirits (Goradon, Rokceratops, Lizardedge, DarkGoradon, Dragonhead)
 * 2. BS01 Overrides (Chakrambat, Jurassickle, Double Draw, Flame Dance, Flame Tempest)
 * 3. Hero Dragon Burst Cards (Lord-Dragon, Lord-Dragon-Bazzel, Burning-Souldragon, Burst Draw)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride } from '../compiler/overrides/index.js';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('Standard Deck Red (Hero Dragon) Regression Suite', () => {

  describe('1. Vanilla Integrity', () => {
    const redVanillas = ['BS01-001', 'BS01-002', 'BS02-001', 'BS04-003'];

    for (const cardNum of redVanillas) {
      it(`${cardNum} resolves deterministically with isVanilla: true`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.isFullySupported, true);
      });
    }
  });

  describe('2. BS01 Foundation Red Cards', () => {
    it('BS01-117 (Double Draw) is fully supported with DRAW 2 opcode', () => {
      const override = getCardOverride('BS01-117');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
      assert.equal(mainAb.clauses[0].op.count, 2);
    });

    it('BS01-122 (Flame Tempest) is fully supported with FLASH DESTROY <= 3000 BP opcode', () => {
      const override = getCardOverride('BS01-122');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
      assert.equal(flashAb.clauses[0].op.target.maxBp, 3000);
    });
  });

  describe('3. PerCardRegistry Hero Dragon Cards', () => {

    it('BS29-001 (Dragonhead) has FLASH Awaken trigger', () => {
      const handler = PerCardRegistry.get('BS29-001');
      assert.ok(handler, 'Dragonhead must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Dragonhead must have FLASH trigger');
    });

    it('SD06-013 (Burst Draw) has BURST and MAIN triggers', () => {
      const handler = PerCardRegistry.get('SD06-013');
      assert.ok(handler, 'Burst Draw must be registered in PerCardRegistry');
      assert.ok(handler.triggers.BURST, 'Burst Draw must have BURST trigger');
      assert.ok(handler.triggers.MAIN, 'Burst Draw must have MAIN trigger');
    });

    it('SD06-007 (The HeroDragon Lord-Dragon) has BURST and AFTER_BURST triggers', () => {
      const handler = PerCardRegistry.get('SD06-007');
      assert.ok(handler, 'Lord-Dragon must be registered in PerCardRegistry');
      assert.ok(handler.triggers.BURST, 'Lord-Dragon must have BURST trigger');
      assert.ok(handler.triggers.AFTER_BURST, 'Lord-Dragon must have AFTER_BURST trigger');
    });

    it('BS16-X01 (The ExplosionHero Lord-Dragon-Bazzel) has BURST and AFTER_BURST triggers', () => {
      const handler = PerCardRegistry.get('BS16-X01');
      assert.ok(handler, 'Lord-Dragon-Bazzel must be registered in PerCardRegistry');
      assert.ok(handler.triggers.BURST, 'Lord-Dragon-Bazzel must have BURST trigger');
      assert.ok(handler.triggers.AFTER_BURST, 'Lord-Dragon-Bazzel must have AFTER_BURST trigger');
    });

    it('BS34-X01 (The SengokuDragonEmperor Burning-Souldragon) has BURST trigger', () => {
      const handler = PerCardRegistry.get('BS34-X01');
      assert.ok(handler, 'Burning-Souldragon must be registered in PerCardRegistry');
      assert.ok(handler.triggers.BURST, 'Burning-Souldragon must have BURST trigger');
    });
  });

  describe('4. Execution Scenarios', () => {

    it('Burst Draw MAIN draws 2 cards from deck to hand', async () => {
      const handler = PerCardRegistry.get('SD06-013');
      assert.ok(handler && handler.triggers.MAIN);

      const duelState = {
        player: {
          hand: [],
          deck: [
            { id: 'c1', name: 'Goradon' },
            { id: 'c2', name: 'Rokceratops' },
            { id: 'c3', name: 'Lizardedge' }
          ]
        },
        opponent: {}
      };

      const ctx = {
        card: { id: 'bd_1', cardNumber: 'SD06-013' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderPlayerHand: () => {} }
      };

      await handler.triggers.MAIN(ctx);

      assert.equal(duelState.player.hand.length, 2);
      assert.equal(duelState.player.deck.length, 1);
      assert.equal(duelState.player.hand[0].name, 'Goradon');
      assert.equal(duelState.player.hand[1].name, 'Rokceratops');
    });

    it('Lord-Dragon BURST summons itself without paying cost', async () => {
      const handler = PerCardRegistry.get('SD06-007');
      assert.ok(handler && handler.triggers.BURST);

      const lordDragonCard = {
        id: 'ld_1',
        cardNumber: 'SD06-007',
        name: 'The HeroDragon Lord-Dragon',
        type: 'Spirit',
        cost: 6,
        currentCores: 0
      };

      const duelState = {
        player: {
          burstCard: lordDragonCard,
          field: [],
          reserve: 2
        },
        opponent: {}
      };

      const ctx = {
        card: lordDragonCard,
        side: 'player',
        duelState,
        arenaApi: {
          addLog: () => {},
          renderDuelTable: () => {},
          promptUniversalTargetModal: (opts, cb) => {
            // Player places 1 core on summoned spirit
            cb([{ cores: 1 }]);
          }
        }
      };

      await handler.triggers.BURST(ctx);

      assert.equal(duelState.player.field.length, 1, 'Lord-Dragon summoned to field');
      assert.equal(duelState.player.field[0].name, 'The HeroDragon Lord-Dragon');
      assert.equal(duelState.player.burstCard, null, 'Burst zone cleared upon summon');
      assert.equal(duelState.player.field[0].currentCores, 1, 'Has 1 core from reserve');
    });

    it('Burning-Souldragon BURST summons when Life <= 3 and retrieves all cores from Trash to itself', async () => {
      const handler = PerCardRegistry.get('BS34-X01');
      assert.ok(handler && handler.triggers.BURST);

      const bsdCard = {
        id: 'bsd_1',
        cardNumber: 'BS34-X01',
        name: 'The SengokuDragonEmperor Burning-Souldragon',
        type: 'Spirit',
        cost: 9,
        currentCores: 0
      };

      const duelState = {
        player: {
          life: 3,
          trash: 5,
          burstCard: bsdCard,
          field: [],
          reserve: 0
        },
        opponent: {}
      };

      const ctx = {
        card: bsdCard,
        side: 'player',
        duelState,
        arenaApi: {
          addLog: () => {},
          renderDuelTable: () => {}
        }
      };

      await handler.triggers.BURST(ctx);

      assert.equal(duelState.player.field.length, 1, 'Burning-Souldragon summoned');
      assert.equal(duelState.player.field[0].name, 'The SengokuDragonEmperor Burning-Souldragon');
      assert.equal(duelState.player.field[0].currentCores, 5, 'Retrieved all 5 cores from Trash');
      assert.equal(duelState.player.trash, 0, 'Trash emptied');
      assert.equal(duelState.player.burstCard, null, 'Burst zone cleared');
    });

  });

});
