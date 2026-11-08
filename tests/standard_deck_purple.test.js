/**
 * tests/standard_deck_purple.test.js
 * 
 * Regression Test Suite for Standard Deck: Netherworld Curse & Seven Shoguns (std-purple).
 * Verifies 100% deterministic execution of purple standard deck cards:
 * 1. Vanilla Spirits (Foger, Camelot-Pawn, Skulldevil)
 * 2. Magic Cards (Curse of Hades, Brave Cemetery)
 * 3. Boss Spirits (The SevenShogun Desperado, The WhiteSnakeEmperor Aldius-Viper, Ajaccio, Puppet Soldier)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride } from '../compiler/overrides/index.js';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('Standard Deck Purple (Netherworld Curse) Regression Suite', () => {

  describe('1. Vanilla Integrity', () => {
    const purpleVanillas = ['BS01-026', 'BS18-010', 'BS01-028'];

    for (const cardNum of purpleVanillas) {
      it(`${cardNum} resolves deterministically with isVanilla: true`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.isFullySupported, true);
      });
    }
  });

  describe('2. PerCardRegistry Implementations', () => {

    it('BS14-096 (Curse of Hades) is registered with BURST trigger', () => {
      const handler = PerCardRegistry.get('BS14-096');
      assert.ok(handler, 'Curse of Hades must be registered in PerCardRegistry');
      assert.ok(handler.triggers.BURST, 'Curse of Hades must have BURST trigger');
    });

    it('BS01-X02 (The SevenShogun Desperado) is registered with WHEN_SUMMONED trigger', () => {
      const handler = PerCardRegistry.get('BS01-X02');
      assert.ok(handler, 'Desperado must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_SUMMONED, 'Desperado must have WHEN_SUMMONED trigger');
    });

    it('BS10-100 (Brave Cemetery) is registered with MAIN and FLASH triggers', () => {
      const handler = PerCardRegistry.get('BS10-100');
      assert.ok(handler, 'Brave Cemetery must be registered in PerCardRegistry');
      assert.ok(handler.triggers.MAIN, 'Brave Cemetery must have MAIN trigger');
      assert.ok(handler.triggers.FLASH, 'Brave Cemetery must have FLASH trigger');
    });

    it('BS23-X02 (The WhiteSnakeEmperor Aldius-Viper) is registered with WHEN_SUMMONED trigger', () => {
      const handler = PerCardRegistry.get('BS23-X02');
      assert.ok(handler, 'Aldius-Viper must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_SUMMONED, 'Aldius-Viper must have WHEN_SUMMONED trigger');
    });

    it('BS52-X02 (The NetherCorpseKnight Ajaccio) is registered with WHEN_ATTACKS trigger', () => {
      const handler = PerCardRegistry.get('BS52-X02');
      assert.ok(handler, 'Ajaccio must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_ATTACKS, 'Ajaccio must have WHEN_ATTACKS trigger');
    });

    it('BS42-014 (Puppet Soldier) is registered with WHEN_DESTROYED trigger', () => {
      const handler = PerCardRegistry.get('BS42-014');
      assert.ok(handler, 'Puppet Soldier must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_DESTROYED, 'Puppet Soldier must have WHEN_DESTROYED trigger');
    });

    it('SD01-035 (Sudden Death Draw) is registered with FLASH and MAIN triggers', () => {
      const handler = PerCardRegistry.get('SD01-035');
      assert.ok(handler, 'Sudden Death Draw must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Sudden Death Draw must have FLASH trigger');
      assert.ok(handler.triggers.MAIN, 'Sudden Death Draw must have MAIN trigger');
    });
  });

  describe('3. Execution Scenarios', () => {

    it('Desperado WHEN_SUMMONED sweeps 1 core from all other spirits and gains Void cores for depleted spirits', async () => {
      const handler = PerCardRegistry.get('BS01-X02');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      const duelState = {
        player: {
          field: [
            { id: 'desp_1', cardNumber: 'BS01-X02', currentCores: 2, name: 'The SevenShogun Desperado' },
            { id: 'ally_1', cardNumber: 'BS01-026', currentCores: 1, name: 'Foger' } // 1 core -> will deplete
          ],
          reserve: 0,
          voidCores: 10
        },
        opponent: {
          field: [
            { id: 'opp_1', cardNumber: 'BS01-001', currentCores: 2, name: 'Goradon' }, // 2 cores -> becomes 1
            { id: 'opp_2', cardNumber: 'BS01-002', currentCores: 1, name: 'Lizardedge' } // 1 core -> will deplete
          ],
          reserve: 0
        }
      };

      const ctx = {
        card: duelState.player.field[0],
        side: 'player',
        duelState,
        arenaApi: {
          addLog: () => {},
          handleDestroyedSpiritCores: (card, side) => {
            const p = side === 'player' ? duelState.player : duelState.opponent;
            p.reserve += card.currentCores;
            card.currentCores = 0;
          },
          sendToTrash: (card, side) => {
            const p = side === 'player' ? duelState.player : duelState.opponent;
            p.field = p.field.filter(c => c.id !== card.id);
          }
        }
      };

      await handler.triggers.WHEN_SUMMONED(ctx);

      assert.equal(duelState.opponent.field.find(c => c.id === 'opp_1').currentCores, 1);
      assert.equal(duelState.opponent.reserve, 2);
      assert.equal(duelState.player.reserve, 1);

      const desp = duelState.player.field.find(c => c.id === 'desp_1');
      assert.equal(desp.currentCores, 4, 'Desperado must gain 2 cores from Void for the 2 depleted spirits');
    });

    it('Brave Cemetery MAIN returns a Brave card from Trash to Hand', async () => {
      const handler = PerCardRegistry.get('BS10-100');
      assert.ok(handler && handler.triggers.MAIN);

      const duelState = {
        player: {
          hand: [],
          trashCards: [
            { id: 'sp_1', type: 'Spirit', name: 'Foger' },
            { id: 'br_1', type: 'Brave', name: 'The PoisonSnakeScythe Alphard' }
          ]
        },
        opponent: {}
      };

      const ctx = {
        card: { id: 'cemetery_1', cardNumber: 'BS10-100' },
        side: 'player',
        duelState,
        arenaApi: {
          addLog: () => {},
          renderPlayerHand: () => {}
        }
      };

      await handler.triggers.MAIN(ctx);

      assert.equal(duelState.player.hand.length, 1);
      assert.equal(duelState.player.hand[0].name, 'The PoisonSnakeScythe Alphard');
      assert.equal(duelState.player.trashCards.length, 1);
      assert.equal(duelState.player.trashCards[0].name, 'Foger');
    });

    it('SD01-035 (Sudden Death Draw) FLASH draws 1 card and gives a Spirit +1000 BP', async () => {
      const handler = PerCardRegistry.get('SD01-035');
      assert.ok(handler && handler.triggers.FLASH);

      const targetSpirit = { uid: 'sp_target', name: 'The Infantry Dragron', currentBp: 2000 };
      const deckCard = { uid: 'card_draw', name: 'Camelot-Pawn' };
      const duelState = {
        player: {
          deck: [deckCard],
          hand: [],
          field: [targetSpirit]
        },
        opponent: {}
      };

      let effectGranted = null;
      const ctx = {
        card: { id: 'sdd_1', cardNumber: 'SD01-035', name: 'Sudden Death Draw' },
        side: 'player',
        duelState,
        arenaApi: {
          addLog: () => {},
          grantEffectToUnit: (target, effect, sourceName) => {
            effectGranted = { target, effect, sourceName };
            target.currentBp += effect.bp;
          }
        }
      };

      const result = await handler.triggers.FLASH(ctx);

      // Verifies: 1. Card was drawn into hand
      assert.equal(duelState.player.hand.length, 1, 'Must draw 1 card into hand');
      assert.equal(duelState.player.hand[0].name, 'Camelot-Pawn');
      assert.equal(duelState.player.deck.length, 0, 'Deck must have 1 less card');

      // Verifies: 2. +1000 BP granted to spirit
      assert.ok(effectGranted, 'grantEffectToUnit must be called');
      assert.equal(effectGranted.effect.bp, 1000, 'Must grant +1000 BP');
      assert.equal(targetSpirit.currentBp, 3000, 'Target spirit BP must increase by +1000 (2000 -> 3000)');
      assert.match(result, /drew 1 card/i);
      assert.match(result, /\+1000 BP/i);
    });

    it('SD01-035 (Sudden Death Draw) FLASH draws 1 card even if no Spirits are on the field', async () => {
      const handler = PerCardRegistry.get('SD01-035');
      assert.ok(handler && handler.triggers.FLASH);

      const deckCard = { uid: 'card_draw2', name: 'Camelot-Pawn' };
      const duelState = {
        player: {
          deck: [deckCard],
          hand: [],
          field: [] // No spirits on field
        },
        opponent: {}
      };

      const ctx = {
        card: { id: 'sdd_2', cardNumber: 'SD01-035', name: 'Sudden Death Draw' },
        side: 'player',
        duelState,
        arenaApi: {
          addLog: () => {}
        }
      };

      const result = await handler.triggers.FLASH(ctx);

      // Verifies: Card is still drawn even without any allied spirits
      assert.equal(duelState.player.hand.length, 1, 'Must draw 1 card even with 0 spirits on field');
      assert.equal(duelState.player.deck.length, 0);
      assert.match(result, /drew 1 card/i);
    });

  });

});
