/**
 * tests/petit_stark_completion.test.js
 * 
 * Regression Test Suite for Remaining Petit Stark Custom Deck Cards:
 * - BS69-035 The GlassWings Sylvia (Void to trash, Counter +1)
 * - BS69-073 Winglass Airport (Flash summon White Brave)
 * - BS69-086 Take Aim (Life burn on leave field)
 * - BS67-XV03 The IceBeast Mam-Morl XV (Summon on life loss prevention)
 * - BS67-032 Stark & Celestoul (Brave summon & bounce to deckbottom)
 * - BATTLE-SPIRITS-A1586 Shieldtank (When blocks +5000 BP)
 * - BS67-074 Ancient Temple of Ice (Prevent <=5000 BP life loss)
 * - BS67-075 Winglass PMC HQ (Deploy search Machine Contract spirit)
 * - BATTLE-SPIRITS-A12405 Silver Guardian Blade (Flash Accel end attack step)
 * - BS67-083 Beam Blast (Flash force attack next)
 * - SD61-009 Romancia Dream (Flash bounce to hand)
 * - BS25-X06 Ultimate-Grand-Woden (When attacks bounce to deckbottom)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/index.js';

describe('Petit Stark Deck Completion Suite', () => {

  describe('1. Handler Registration Integrity', () => {
    const cards = [
      'BS69-035', 'BS69-073', 'BS69-086', 'BS67-XV03',
      'BS67-032', 'BATTLE-SPIRITS-A1586', 'BS67-074',
      'BS67-075', 'BATTLE-SPIRITS-A12405', 'BS67-083',
      'SD61-009', 'BS25-X06'
    ];

    for (const cardNum of cards) {
      it(`${cardNum} is registered in PerCardRegistry`, () => {
        const handler = PerCardRegistry.get(cardNum);
        assert.ok(handler, `${cardNum} must be registered in PerCardRegistry`);
        assert.ok(handler.triggers, `${cardNum} must define triggers`);
      });
    }
  });

  describe('2. Tactical Execution Scenarios', () => {

    it('BS69-035 (Sylvia) WHEN_SUMMONED puts 1 core to trash and adds 1 counter with Stark', () => {
      const handler = PerCardRegistry.get('BS69-035');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      const ctx = {
        side: 'player',
        duelState: {
          player: {
            trash: 0,
            counters: 2,
            field: [{ id: 'stark', name: 'Petit Stark' }]
          }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctx);
      assert.equal(ctx.duelState.player.trash, 1, 'Trash should receive 1 core from void');
      assert.equal(ctx.duelState.player.counters, 3, 'Counters should increment by 1');
    });

    it('BS67-075 (PMC HQ) WHEN_DEPLOYED reveals cards and adds Machine Contract spirit to hand', () => {
      const handler = PerCardRegistry.get('BS67-075');
      assert.ok(handler && handler.triggers.WHEN_DEPLOYED);

      const machineSpirit = { id: 'm1', name: 'Sylvia', family: 'Machine Contract' };
      const otherCard = { id: 'o1', name: 'Other' };
      const ctx = {
        side: 'player',
        duelState: {
          player: {
            deck: [machineSpirit, otherCard],
            hand: []
          }
        }
      };

      handler.triggers.WHEN_DEPLOYED(ctx);
      assert.equal(ctx.duelState.player.hand.length, 1);
      assert.equal(ctx.duelState.player.hand[0].id, 'm1');
    });

    it('BATTLE-SPIRITS-A12405 (Silver Guardian Blade) FLASH ends attack step', () => {
      const handler = PerCardRegistry.get('BATTLE-SPIRITS-A12405');
      assert.ok(handler && handler.triggers.FLASH);

      const ctx = {
        side: 'player',
        duelState: {}
      };

      handler.triggers.FLASH(ctx);
      assert.ok(ctx.duelState.modifiers && ctx.duelState.modifiers.some(m => m.type === 'END_ATTACK_STEP'));
    });

    it('SD61-009 (Romancia Dream) FLASH bounces opposing spirit to hand', () => {
      const handler = PerCardRegistry.get('SD61-009');
      assert.ok(handler && handler.triggers.FLASH);

      const oppSpirit = { id: 'opp', name: 'Opp Spirit' };
      const ctx = {
        side: 'player',
        duelState: {
          opponent: {
            field: [oppSpirit],
            hand: []
          }
        }
      };

      handler.triggers.FLASH(ctx);
      assert.equal(ctx.duelState.opponent.field.length, 0);
      assert.equal(ctx.duelState.opponent.hand.length, 1);
      assert.equal(ctx.duelState.opponent.hand[0].id, 'opp');
    });

    it('BS67-083 (Beam Blast) FLASH forces target opposing spirit to attack next', () => {
      const handler = PerCardRegistry.get('BS67-083');
      assert.ok(handler && handler.triggers.FLASH);

      const oppSpirit = { id: 'opp2', name: 'Forced Attacker' };
      const ctx = {
        side: 'player',
        duelState: {
          opponent: {
            field: [oppSpirit]
          }
        }
      };

      handler.triggers.FLASH(ctx);
      assert.ok(oppSpirit.mustAttackNext, 'Opposing spirit should be flagged to attack next');
    });

  });

});
