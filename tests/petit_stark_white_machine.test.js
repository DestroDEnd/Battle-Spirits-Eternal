/**
 * tests/petit_stark_white_machine.test.js
 * 
 * Regression Test Suite for Petit Stark & White Machine Contract Staples:
 * - BS67-CX02 Petit Stark (Can block while exhausted, end step counter boost and draw)
 * - BS67-X11 The DawnLightContractGun Celestoul (Summon burst discard / void ramp)
 * - BS67-025 Pata Bird (When Blocks counter +2)
 * - BS67-029 The BattleMobile Red Impulse (When Blocks bounce opposing nexus to deckbottom)
 * - BS67-033 Jet Nodon (When Summoned counter +1 and bounce opposing spirit if C4+)
 * - BS60-092 Clear Wall (Burst life recovery & Flash end attack step)
 * - BSC45-098 Diamond Strike LT (Flash refresh Armed Machine spirit)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/index.js';

describe('Petit Stark White Machine Contract Suite', () => {

  describe('1. Handler Registration Integrity', () => {
    const cards = [
      'BS67-CX02', 'BS67-X11', 'BS67-025', 'BS67-029',
      'BS67-033', 'BS60-092', 'BSC45-098'
    ];

    for (const cardNum of cards) {
      it(`${cardNum} is registered in PerCardRegistry`, () => {
        const handler = PerCardRegistry.get(cardNum);
        assert.ok(handler, `${cardNum} must be registered in PerCardRegistry`);
        assert.ok(handler.triggers, `${cardNum} must define triggers`);
      });
    }
  });

  describe('2. Combat & Defensive Execution Scenarios', () => {

    it('BS67-CX02 (Petit Stark) END_STEP increments counter by 2 and draws 1 if no life lost', () => {
      const handler = PerCardRegistry.get('BS67-CX02');
      assert.ok(handler && handler.triggers.END_STEP);

      const ctx = {
        side: 'player',
        duelState: {
          player: {
            counters: 2,
            deck: [{ id: 'c1', name: 'Card 1' }],
            hand: [],
            lifeLostThisTurn: false
          }
        }
      };

      handler.triggers.END_STEP(ctx);
      assert.equal(ctx.duelState.player.counters, 4, 'Counters should increment by 2');
      assert.equal(ctx.duelState.player.hand.length, 1, 'Should draw 1 card');
      assert.equal(ctx.duelState.player.deck.length, 0);
    });

    it('BS67-X11 (Celestoul) WHEN_SUMMONED discards opposing burst or ramps 1 core from void', () => {
      const handler = PerCardRegistry.get('BS67-X11');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      // Scenario A: Opponent has burst -> discarded
      const burstCard = { id: 'burst1', name: 'Opp Burst' };
      const friendlySpirit = { id: 's1', name: 'Stark', currentCores: 1 };
      const ctxWithBurst = {
        side: 'player',
        duelState: {
          player: { field: [friendlySpirit] },
          opponent: { burst: burstCard, trashCards: [] }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctxWithBurst);
      assert.equal(ctxWithBurst.duelState.opponent.burst, null, 'Burst should be discarded');
      assert.equal(ctxWithBurst.duelState.opponent.trashCards.length, 1);

      // Scenario B: Opponent has NO burst -> friendly spirit gets 1 core from void
      const ctxNoBurst = {
        side: 'player',
        duelState: {
          player: { field: [friendlySpirit] },
          opponent: { burst: null }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctxNoBurst);
      assert.equal(friendlySpirit.currentCores, 2, 'Should ramp 1 core from void');
    });

    it('BS67-025 (Pata Bird) WHEN_BLOCKS grants +2 counters', () => {
      const handler = PerCardRegistry.get('BS67-025');
      assert.ok(handler && handler.triggers.WHEN_BLOCKS);

      const ctx = {
        side: 'player',
        duelState: {
          player: { counters: 1 }
        }
      };

      handler.triggers.WHEN_BLOCKS(ctx);
      assert.equal(ctx.duelState.player.counters, 3, 'Should add 2 counters on block');
    });

    it('BS67-029 (Red Impulse) WHEN_BLOCKS bounces opposing nexus to deckbottom', () => {
      const handler = PerCardRegistry.get('BS67-029');
      assert.ok(handler && handler.triggers.WHEN_BLOCKS);

      const oppNexus = { id: 'n1', name: 'Opp Nexus', type: 'Nexus' };
      const ctx = {
        side: 'player',
        duelState: {
          opponent: {
            field: [oppNexus],
            deck: [{ id: 'd1', name: 'Deck Card' }]
          }
        }
      };

      handler.triggers.WHEN_BLOCKS(ctx);
      assert.equal(ctx.duelState.opponent.field.length, 0, 'Nexus should be removed from field');
      assert.equal(ctx.duelState.opponent.deck[ctx.duelState.opponent.deck.length - 1].id, 'n1', 'Nexus sent to deckbottom');
    });

    it('BS67-033 (Jet Nodon) WHEN_SUMMONED increments counter and bounces opposing spirit if C4+', () => {
      const handler = PerCardRegistry.get('BS67-033');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      const oppSpirit = { id: 's1', name: 'Big Monster', type: 'Spirit' };
      const ctx = {
        side: 'player',
        duelState: {
          player: { counters: 3 },
          opponent: {
            field: [oppSpirit],
            deck: []
          }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctx);
      assert.equal(ctx.duelState.player.counters, 4, 'Counters should increment to 4');
      assert.equal(ctx.duelState.opponent.field.length, 0, 'Opposing spirit bounced to deckbottom');
      assert.equal(ctx.duelState.opponent.deck.length, 1);
    });

    it('BS60-092 (Clear Wall) BURST adds 2 counters and ramps 1 core to Life, FLASH ends attack step', () => {
      const handler = PerCardRegistry.get('BS60-092');
      assert.ok(handler && handler.triggers.BURST);
      assert.ok(handler && handler.triggers.FLASH);

      const ctxBurst = {
        side: 'player',
        duelState: {
          player: { counters: 1, life: 3 }
        }
      };

      handler.triggers.BURST(ctxBurst);
      assert.equal(ctxBurst.duelState.player.counters, 3, 'Counters should increment by 2');
      assert.equal(ctxBurst.duelState.player.life, 4, 'Life should increase by 1');

      const ctxFlash = {
        side: 'player',
        duelState: {}
      };

      handler.triggers.FLASH(ctxFlash);
      assert.ok(ctxFlash.duelState.modifiers && ctxFlash.duelState.modifiers.some(m => m.type === 'END_ATTACK_STEP'));
    });

    it('BSC45-098 (Diamond Strike LT) FLASH refreshes an Armed Machine spirit', () => {
      const handler = PerCardRegistry.get('BSC45-098');
      assert.ok(handler && handler.triggers.FLASH);

      const machineSpirit = { id: 'm1', name: 'Armed Mech', family: 'Armed Machine', exhausted: true };
      const ctx = {
        side: 'player',
        duelState: {
          player: { field: [machineSpirit] }
        }
      };

      handler.triggers.FLASH(ctx);
      assert.equal(machineSpirit.exhausted, false, 'Armed Machine spirit should be refreshed');
    });

  });

});
