/**
 * tests/standard_deck_blue.test.js
 * 
 * Regression Test Suite for Standard Deck: Colosseum Titans & Golem Mill (std-blue).
 * Verifies 100% deterministic execution of blue standard deck cards:
 * 1. Vanilla Spirits (Bulltop, Rammer-Golem, Drian, Mechanic-Corgi, GreenBird Douji, Chacopecca, Dolphino)
 * 2. BS03 Foundation (The GiantHero Titus with Crush)
 * 3. Blue Mill Magic (Spinning Sword, Lead Wall)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride } from '../compiler/overrides/index.js';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('Standard Deck Blue (Colosseum Titans) Regression Suite', () => {

  describe('1. Vanilla Integrity', () => {
    const blueVanillas = [
      'BS03-071',
      'BS15-046',
      'BS24-049',
      'BATTLE-SPIRITS-A3369',
      'BATTLE-SPIRITS-A3835'
    ];

    for (const cardNum of blueVanillas) {
      it(`${cardNum} resolves deterministically with isVanilla: true`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.isFullySupported, true);
      });
    }
  });

  describe('2. BS03 Foundation Blue Cards', () => {
    it('BS03-X12 (The GiantHero Titus) has deterministic deck mill abilities', () => {
      const override = getCardOverride('BS03-X12');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Titus must have When Summoned mill ability');
      assert.ok(summonAb.clauses.some(c => c.op.op === 'MILL_DECK'));

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Titus must have When Attacks mill ability');
      assert.ok(attackAb.clauses.some(c => c.op.op === 'MILL_DECK'));
    });
  });

  describe('3. PerCardRegistry Blue Magic & Triggers', () => {

    it('BS23-083 (Spinning Sword) has FLASH mill trigger', () => {
      const handler = PerCardRegistry.get('BS23-083');
      assert.ok(handler, 'Spinning Sword must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Spinning Sword must have FLASH trigger');
    });

    it('BATTLE-SPIRITS-A6236 (Lead Wall) has FLASH defensive trigger', () => {
      const handler = PerCardRegistry.get('BATTLE-SPIRITS-A6236');
      assert.ok(handler, 'Lead Wall must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Lead Wall must have FLASH trigger');
    });
  });

  describe('4. Execution Scenarios', () => {

    it('Spinning Sword FLASH discards cards from opposing decktop', async () => {
      const handler = PerCardRegistry.get('BS23-083');
      assert.ok(handler && handler.triggers.FLASH);

      const duelState = {
        player: {},
        opponent: {
          deck: [
            { id: 'c1', name: 'Card 1' },
            { id: 'c2', name: 'Card 2' },
            { id: 'c3', name: 'Card 3' }
          ],
          trashCards: []
        }
      };

      const ctx = {
        card: { id: 'ss_1', cardNumber: 'BS23-083' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderDuelTable: () => {} }
      };

      await handler.triggers.FLASH(ctx);

      assert.equal(duelState.opponent.deck.length, 1, 'Discarded 2 cards from opposing deck');
      assert.equal(duelState.opponent.trashCards.length, 2);
    });

  });

});
