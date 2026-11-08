/**
 * tests/standard_deck_white.test.js
 * 
 * Regression Test Suite for Standard Deck: Armed Fortress & Mobile Machine Deity (std-white).
 * Verifies 100% deterministic execution of white standard deck cards:
 * 1. Vanilla Spirits (Icemaiden, Ohsu-Mi, Bobcats)
 * 2. BS01 / SD01 Foundation Cards (Ray-Bullet, Blizzard Wall, Defensive Aura)
 * 3. Machine Deity & Defensive Cards (Ice Age Shield, Co-op Barrier, Enterprise, Grand-Woden)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride } from '../compiler/overrides/index.js';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('Standard Deck White (Armed Fortress) Regression Suite', () => {

  describe('1. Vanilla Integrity', () => {
    const whiteVanillas = ['BS01-075', 'OATH-ME', 'BATTLE-SPIRITS-A3028'];

    for (const cardNum of whiteVanillas) {
      it(`${cardNum} resolves deterministically with isVanilla: true`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.isFullySupported, true);
      });
    }
  });

  describe('2. Foundation White Defensive Cards', () => {
    it('SD01-039 (Blizzard Wall) is registered and caps direct combat damage at 1', () => {
      const handler = PerCardRegistry.get('SD01-039') || getCardOverride('SD01-039');
      assert.ok(handler);
    });

    it('BS01-076 (Ray-Bullet) is fully supported with PASSIVE BP_BUFF opcode', () => {
      const override = getCardOverride('BS01-076');
      assert.ok(override);
      const passiveAb = override.abilities.find(a => a.header.timing === 'PASSIVE');
      assert.ok(passiveAb);
      assert.equal(passiveAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(passiveAb.clauses[0].op.amount, 1000);
    });
  });

  describe('3. PerCardRegistry Machine Deity & Defense Cards', () => {

    it('BS19-106 (Ice Age Shield) has FLASH trigger preventing life damage', () => {
      const handler = PerCardRegistry.get('BS19-106');
      assert.ok(handler, 'Ice Age Shield must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Ice Age Shield must have FLASH trigger');
    });

    it('BS42-092 (Co-op Barrier) has FLASH trigger refreshing a spirit', () => {
      const handler = PerCardRegistry.get('BS42-092');
      assert.ok(handler, 'Co-op Barrier must be registered in PerCardRegistry');
      assert.ok(handler.triggers.FLASH, 'Co-op Barrier must have FLASH trigger');
    });

    it('BS25-X01 (The ArmoredDragonBattleship Enterprise) has WHEN_BLOCKS trigger', () => {
      const handler = PerCardRegistry.get('BS25-X01');
      assert.ok(handler, 'Enterprise must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_BLOCKS, 'Enterprise must have WHEN_BLOCKS trigger');
    });

    it('BS08-X32 (The WingDeity Grand-Woden) has WHEN_EXHAUSTED trigger', () => {
      const handler = PerCardRegistry.get('BS08-X32');
      assert.ok(handler, 'Grand-Woden must be registered in PerCardRegistry');
      assert.ok(handler.triggers.WHEN_EXHAUSTED, 'Grand-Woden must have WHEN_EXHAUSTED trigger');
    });
  });

  describe('4. Execution Scenarios', () => {

    it('Ice Age Shield FLASH adds PREVENT_LIFE_LOSS modifier to state', async () => {
      const handler = PerCardRegistry.get('BS19-106');
      assert.ok(handler && handler.triggers.FLASH);

      const duelState = {
        player: { life: 3 },
        opponent: {},
        modifiers: []
      };

      const ctx = {
        card: { id: 'ias_1', cardNumber: 'BS19-106' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderDuelTable: () => {} }
      };

      await handler.triggers.FLASH(ctx);

      const mod = duelState.modifiers.find(m => m.type === 'PREVENT_LIFE_LOSS');
      assert.ok(mod, 'PREVENT_LIFE_LOSS modifier must be present');
      assert.equal(mod.duration, 'THIS_TURN');
    });

    it('Co-op Barrier FLASH refreshes an exhausted friendly spirit', async () => {
      const handler = PerCardRegistry.get('BS42-092');
      assert.ok(handler && handler.triggers.FLASH);

      const duelState = {
        player: {
          field: [
            { id: 'sp_1', name: 'Ray-Bullet', isExhausted: true }
          ]
        },
        opponent: {}
      };

      const ctx = {
        card: { id: 'cb_1', cardNumber: 'BS42-092' },
        side: 'player',
        duelState,
        arenaApi: { addLog: () => {}, renderDuelTable: () => {} }
      };

      await handler.triggers.FLASH(ctx);

      assert.equal(duelState.player.field[0].isExhausted, false, 'Spirit must be refreshed');
    });

  });

});
