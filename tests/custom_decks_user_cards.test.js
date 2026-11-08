/**
 * tests/custom_decks_user_cards.test.js
 * 
 * Regression Test Suite for Custom User Deck Cards in local-decks/:
 * 1. BS68-041 (Railgunner-Foresight) - Machine Contract Spirit with WHEN_BLOCKS draw trigger
 * 2. SD01-029 (The Wriggle Catacomb) - Anti-ramp and exhaustion control Nexus
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('Custom User Deck Cards Regression Suite', () => {

  describe('1. BS68-041 Railgunner-Foresight', () => {
    it('is registered in PerCardRegistry with WHEN_BLOCKS trigger', () => {
      const handler = PerCardRegistry.get('BS68-041');
      assert.ok(handler, 'Railgunner-Foresight must be registered');
      assert.equal(handler.cardType, 'Spirit');
      assert.ok(handler.triggers.WHEN_BLOCKS, 'Must have WHEN_BLOCKS trigger');
    });

    it('WHEN_BLOCKS draws 1 card at end of battle if count condition met', () => {
      const handler = PerCardRegistry.get('BS68-041');
      const playerDeck = [{ id: 'card1', name: 'Deck Top' }];
      const playerHand = [];
      const ctx = {
        side: 'player',
        duelState: {
          player: {
            deck: playerDeck,
            hand: playerHand,
            count: 3
          },
          opponent: {
            field: []
          }
        }
      };

      handler.triggers.WHEN_BLOCKS(ctx);
      assert.equal(playerHand.length, 1, 'Should draw 1 card into hand');
      assert.equal(playerHand[0].id, 'card1');
      assert.equal(playerDeck.length, 0);
    });
  });

  describe('2. SD01-029 The Wriggle Catacomb', () => {
    it('is registered in PerCardRegistry with WHEN_EXHAUSTS trigger', () => {
      const handler = PerCardRegistry.get('SD01-029');
      assert.ok(handler, 'The Wriggle Catacomb must be registered');
      assert.equal(handler.cardType, 'Nexus');
      assert.ok(handler.triggers.WHEN_OPPOSING_ATTACKS, 'Must have WHEN_OPPOSING_ATTACKS trigger');
    });

    it('WHEN_OPPOSING_ATTACKS exhausts an opposing spirit if attacker is Green', () => {
      const handler = PerCardRegistry.get('SD01-029');
      const oppSpirit1 = { id: 's1', name: 'Green Insect', color: 'Green', exhausted: false };
      const oppSpirit2 = { id: 's2', name: 'Other Spirit', color: 'White', exhausted: false };
      const ctx = {
        side: 'player',
        duelState: {
          player: { field: [] },
          opponent: {
            field: [oppSpirit1, oppSpirit2]
          }
        },
        attacker: oppSpirit1
      };

      handler.triggers.WHEN_OPPOSING_ATTACKS(ctx);
      assert.equal(oppSpirit2.exhausted, true, 'Opposing spirit should be exhausted');
    });
  });

});
