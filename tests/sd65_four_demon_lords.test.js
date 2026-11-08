/**
 * tests/sd65_four_demon_lords.test.js
 * 
 * Regression Test Suite for SD65: Contract Starter Deck: Four Demon Lords.
 * Verifies 100% deterministic per-card execution keyed strictly by canonical card_number:
 * - SD65-CX01 The PartnerDemonLord Javad (Contract Partner, counter boost, flash core drain)
 * - SD65-001 The HellflameCount Zan-Zival (Destruction of <=15k BP spirit or nexus)
 * - SD65-002 The HellsoilCount Grey-Tude (Counter +1, draw 1)
 * - SD65-003 The Ruler of FourDemonLords Lord-Javad (Hand discard to draw 2, core drain, battle refresh)
 * - SD65-004 The HellwindCount Nouvelle-Vague (Void ramp & opposing exhaustion)
 * - SD65-005 The HellseaCount Ila-Riva (Burst draw 2 & discard 1)
 * - SD65-006 The Four Towers of Limbo (Counter +1 & ramp/draw on Evil God attack)
 * - SD65-X01 The Hellflame FourDemonLord Bram-Zahfag (Opposing field wipe)
 * - SD65-X02 The Hellsoil FourDemonLord Magnazappah (Count Trigger core drain)
 * - SD65-X03 The Hellwind FourDemonLord Van-Tous (Attack ramp 2 cores from void)
 * - SD65-X04 The Hellsea FourDemonLord Ill-Dezal (Burst destroy highest cost opposing spirit)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/index.js';

describe('SD65 Contract Starter Deck: Four Demon Lords Suite', () => {

  describe('1. SD65 Card Handler Registration Integrity', () => {
    const sd65Cards = [
      'SD65-CX01', 'SD65-001', 'SD65-002', 'SD65-003',
      'SD65-004', 'SD65-005', 'SD65-006', 'SD65-X01',
      'SD65-X02', 'SD65-X03', 'SD65-X04'
    ];

    for (const cardNum of sd65Cards) {
      it(`${cardNum} is registered in PerCardRegistry`, () => {
        const handler = PerCardRegistry.get(cardNum);
        assert.ok(handler, `${cardNum} must have an explicit handler in PerCardRegistry`);
        assert.ok(handler.triggers, `${cardNum} must define triggers`);
      });
    }
  });

  describe('2. Javad Partner & Contract Advent Triggers', () => {

    it('SD65-CX01 (The PartnerDemonLord Javad) FLASH removes 1 core from self to drain 2 opposing cores', () => {
      const handler = PerCardRegistry.get('SD65-CX01');
      assert.ok(handler && handler.triggers.FLASH);

      const javadSpirit = { id: 'javad', name: 'Javad', currentCores: 2, currentLevel: 3 };
      const oppSpirit = { id: 'opp1', name: 'Target Spirit', currentCores: 3 };
      const ctx = {
        card: javadSpirit,
        side: 'player',
        duelState: {
          player: { reserve: 2, trash: 0, field: [javadSpirit] },
          opponent: { reserve: 0, field: [oppSpirit] }
        }
      };

      handler.triggers.FLASH(ctx);
      assert.equal(ctx.duelState.player.reserve, 1, 'Friendly reserve should decrease by 1');
      assert.equal(ctx.duelState.player.trash, 1, 'Friendly trash should increase by 1');
      assert.equal(oppSpirit.currentCores, 1, 'Opposing spirit should lose 2 cores');
      assert.equal(ctx.duelState.opponent.reserve, 2, 'Opponent reserve should receive drained cores');
    });

    it('SD65-002 (The HellsoilCount Grey-Tude) WHEN_SUMMONED increments counter and draws 1 card', () => {
      const handler = PerCardRegistry.get('SD65-002');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      const card = { id: 'sd65_002', name: 'Grey-Tude', currentLevel: 3 };
      const ctx = {
        card,
        side: 'player',
        duelState: {
          player: {
            counters: 2,
            deck: [{ id: 'card1', name: 'Draw Card' }],
            hand: []
          }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctx);
      assert.equal(ctx.duelState.player.counters, 3, 'Counters should increment by 1');
      assert.equal(ctx.duelState.player.hand.length, 1, 'Should draw 1 card');
      assert.equal(ctx.duelState.player.deck.length, 0);
    });

    it('SD65-003 (The Ruler of FourDemonLords Lord-Javad) WHEN_SUMMONED discards 1 to draw 2 and drains 2 cores on Evil God', () => {
      const handler = PerCardRegistry.get('SD65-003');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      const evilGodCard = { id: 'eg1', name: 'Evil Card', family: 'Evil God' };
      const oppSpirit = { id: 'opp1', name: 'Opp Spirit', currentCores: 4 };
      const card = { id: 'sd65_003', name: 'Lord-Javad', currentLevel: 3 };
      const ctx = {
        card,
        side: 'player',
        duelState: {
          player: {
            hand: [evilGodCard],
            deck: [{ id: 'd1', name: 'Card 1' }, { id: 'd2', name: 'Card 2' }],
            trashCards: []
          },
          opponent: {
            field: [oppSpirit],
            reserve: 0
          }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctx);
      assert.equal(ctx.duelState.player.hand.length, 2, 'Hand should have 2 new cards');
      assert.equal(ctx.duelState.player.trashCards.length, 1, 'Discarded Evil God card should be in trash');
      assert.equal(oppSpirit.currentCores, 2, 'Opponent spirit should lose 2 cores');
      assert.equal(ctx.duelState.opponent.reserve, 2, 'Opponent reserve receives 2 cores');
    });
  });

  describe('3. Four Demon Lords Boss Powers', () => {

    it('SD65-X01 (Bram-Zahfag) WHEN_SUMMONED wipes all opposing spirits', () => {
      const handler = PerCardRegistry.get('SD65-X01');
      assert.ok(handler && handler.triggers.WHEN_SUMMONED);

      const s1 = { id: 's1', name: 'Small Spirit', type: 'Spirit' };
      const s2 = { id: 's2', name: 'Big Spirit', type: 'Spirit' };
      const card = { id: 'bram', name: 'Bram-Zahfag', type: 'Ultimate', currentLevel: 3 };
      const ctx = {
        card,
        side: 'player',
        duelState: {
          player: { life: 3, reserve: 0, field: [card] },
          opponent: {
            field: [s1, s2],
            trashCards: []
          }
        }
      };

      handler.triggers.WHEN_SUMMONED(ctx);
      assert.equal(ctx.duelState.opponent.field.length, 0, 'Opposing field should be wiped');
      assert.equal(ctx.duelState.opponent.trashCards.length, 2, 'Destroyed spirits sent to trash');
    });

    it('SD65-X03 (Van-Tous) WHEN_ATTACKS ramps 2 cores from void to friendly ultimate', () => {
      const handler = PerCardRegistry.get('SD65-X03');
      assert.ok(handler && handler.triggers.WHEN_ATTACKS);

      const vantous = { id: 'vantous', name: 'Van-Tous', type: 'Ultimate', currentLevel: 3, currentCores: 3 };
      const cardToTop = { id: 'topcard', name: 'Card to Top' };
      const ctx = {
        card: vantous,
        attacker: vantous,
        side: 'player',
        duelState: {
          player: {
            field: [vantous],
            hand: [cardToTop],
            deck: []
          },
          opponent: {}
        }
      };

      handler.triggers.WHEN_ATTACKS(ctx);
      assert.equal(vantous.currentCores, 5, 'Van-Tous should receive 2 cores from void');
    });

    it('SD65-X04 (Ill-Dezal) BURST destroys the opposing spirit with the highest cost', () => {
      const handler = PerCardRegistry.get('SD65-X04');
      assert.ok(handler && handler.triggers.BURST);

      const s1 = { id: 's1', name: 'Cheap Spirit', cost: 2 };
      const s2 = { id: 's2', name: 'Boss Spirit', cost: 8 };
      const s3 = { id: 's3', name: 'Mid Spirit', cost: 5 };
      const ctx = {
        side: 'player',
        duelState: {
          opponent: {
            field: [s1, s2, s3],
            trashCards: []
          }
        }
      };

      handler.triggers.BURST(ctx);
      assert.equal(ctx.duelState.opponent.field.length, 2);
      assert.ok(!ctx.duelState.opponent.field.includes(s2), 'Highest cost spirit (cost 8) must be destroyed');
      assert.equal(ctx.duelState.opponent.trashCards[0].id, 's2');
    });
  });

  describe('3. SD65-003 Contract Advent & Timing Invariants', () => {
    // Load battle_arena script functions in sandboxed test context
    const arenaCode = fs.readFileSync(path.resolve('./battle_arena.js'), 'utf8');

    const mockDoc = {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, innerHTML: '', querySelectorAll: () => [], querySelector: () => null }),
      addEventListener: () => {},
      removeEventListener: () => {},
      body: { appendChild() {} }
    };

    const globalObj = {
      console, Math, parseInt, Date, Array, Object, String, Number, Boolean, RegExp,
      setTimeout: (fn) => fn(), clearTimeout: () => {},
      document: mockDoc,
      window: { location: { origin: 'http://localhost' }, addEventListener: () => {} }
    };
    globalObj.window.document = mockDoc;

    const fn = new Function('window', 'document', 'DuelState', arenaCode + '\nreturn window.BattleArena;');
    const sandboxDuelState = {
      phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
      phaseIndex: 5, // ATTACK step
      activePlayer: 'player',
      player: { count: 0, field: [], soulCoreLocation: 'field' }
    };
    const BattleArena = fn(globalObj.window, mockDoc, sandboxDuelState);
    const { getCardAdventRequirement, getEligibleAdventTargets, hasFlashTiming } = BattleArena;

    const lordJavad = {
      uid: 'sd65_003_test',
      name: 'The Ruler of FourDemonLords Lord-Javad',
      card_number: 'SD65-003',
      type: 'Ultimate',
      cost: 6,
      family: 'Hell Contract',
      effect: 'Flash - [Contract Advent: Hell Contract & C3 or more, (Either Attack Step)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Ultimate.'
    };

    const partnerJavad = {
      uid: 'javad_partner',
      name: 'The PartnerDemonLord Javad',
      card_number: 'SD65-CX01',
      type: 'Contract Ultimate',
      family: 'Hell Contract',
      families: ['Hell Contract', 'Evil God']
    };

    it('SD65-003 parses Contract Advent requirement correctly without treating timing as family', () => {
      const req = getCardAdventRequirement(lordJavad);
      assert.ok(req, 'Requirement must be parsed');
      assert.equal(req.isContractAdvent, true);
      assert.equal(req.minCount, 3, 'Requires Count 3 or more');
      assert.equal(req.timing, 'either_attack_step');
      assert.deepEqual(req.families, ['Hell Contract'], 'Families should only contain Hell Contract, not timing string');
    });

    it('SD65-003 is recognized as having Flash timing during Attack Step', () => {
      assert.equal(hasFlashTiming(lordJavad), true, 'Contract Advent card has Flash timing');
    });

    it('SD65-003 fails advent target check when player Count is 0 (below C3)', () => {
      globalObj.window.DuelState.player.count = 0;
      const req = getCardAdventRequirement(lordJavad);
      const targets = getEligibleAdventTargets(req, [partnerJavad], 'player');
      assert.equal(targets.length, 0, 'Cannot advent when Count < 3');
    });

    it('SD65-003 successfully targets PartnerDemonLord Javad when player Count is 3 or more', () => {
      globalObj.window.DuelState.player.count = 3;
      const req = getCardAdventRequirement(lordJavad);
      const targets = getEligibleAdventTargets(req, [partnerJavad], 'player');
      assert.equal(targets.length, 1, 'Partner Javad is an eligible target at Count 3');
      assert.equal(targets[0].uid, partnerJavad.uid);
    });
  });

});
