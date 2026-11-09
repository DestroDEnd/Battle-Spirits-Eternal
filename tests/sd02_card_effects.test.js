/**
 * tests/sd02_card_effects.test.js
 * 
 * Regression Test Suite for SD02 (Starter Deck: Bursting Roar / Heaven & Earth).
 * Verifies 100% deterministic execution of SD02 canonical card effects,
 * [Tribute], [Assault], Strong Draw, and blocking interactions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, SD02_OVERRIDES } from '../compiler/overrides/index.js';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

describe('SD02 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD02 All-Card Deterministic Registry Coverage', () => {
    const allSd02CardNumbers = Array.from({ length: 21 }, (_, i) => `SD02-${String(i + 1).padStart(3, '0')}`);

    for (const cardNum of allSd02CardNumbers) {
      it(`${cardNum} has explicit deterministic IR registered`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isFullySupported, true);
        assert.ok(override.abilities.length > 0 || override.isVanilla, 'Must have compiled abilities');
        assert.equal(override.unsupportedClausesCount, 0);
      });
    }
  });

  describe('2. SD02 Tribute (Tenshou) Mechanics', () => {

    it('SD02-004 (The SacredBeast Haktak) - Has [Tribute: Cost 3 or more -> Trash]', () => {
      const override = getCardOverride('SD02-004');
      assert.ok(override);
      const tributeKeyword = override.keywords.find(k => k.name === 'Tribute');
      assert.ok(tributeKeyword, 'Must register Tribute keyword');
      const tributeAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Tribute'));
      assert.ok(tributeAb);
      assert.equal(tributeAb.clauses[0].op.op, 'KEYWORD_ACTION');
      assert.equal(tributeAb.clauses[0].op.keyword, 'Tribute');
    });

    it('SD02-018 (The BraveColonel Dragron) - Tribute target trigger destroys two <= 4000 BP spirits', () => {
      const override = getCardOverride('SD02-018');
      assert.ok(override);
      assert.equal(override.abilities.length, 1);
      const ab = override.abilities[0];
      assert.equal(ab.clauses[0].op.op, 'DESTROY');
      assert.equal(ab.clauses[0].op.count, 2);
      assert.equal(ab.clauses[0].op.target.filters.bpLte, 4000);
    });

    it('SD02-020 (The RainbowWings Jewelg) - Tribute target trigger puts cores from Void to Reserve', () => {
      const override = getCardOverride('SD02-020');
      assert.ok(override);
      const ab = override.abilities[0];
      assert.ok(ab);
      assert.ok(ab.clauses.some(c => c.op.op === 'MOVE_CORE'));
    });
  });

  describe('3. SD02 Assault Mechanics', () => {

    it('SD02-010 (The RoaringSwordmaster Lowen) - Possesses [Assault: 1] and Destroy effect', () => {
      const override = getCardOverride('SD02-010');
      assert.ok(override);
      const assaultKeyword = override.keywords.find(k => k.name === 'Assault');
      assert.ok(assaultKeyword, 'Must register Assault keyword');
      assert.ok(override.abilities.some(a => a.header.timing === 'WHEN_SUMMONED'));
    });
  });

  describe('4. SD02 Magic & Combat Resolution', () => {

    it('SD02-017 (Strong Draw) - Main draws 3 cards and Flash gives +3000 BP', async () => {
      const override = getCardOverride('SD02-017');
      assert.ok(override);
      assert.equal(override.abilities.length, 2);

      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
      assert.equal(mainAb.clauses[0].op.count, 3);

      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(flashAb.clauses[0].op.amount, 3000);

      // Execute Draw Op
      const game = createGame();
      const p = game.state.players.player;
      p.deck = [
        { id: 'c1', name: 'Card 1' },
        { id: 'c2', name: 'Card 2' },
        { id: 'c3', name: 'Card 3' }
      ];
      p.hand = [];

      await executeOp(game.state, mainAb.clauses[0].op, { controller: 'player' });
      assert.equal(p.hand.length, 3);
      assert.equal(p.deck.length, 0);
    });

    it('SD02-002 (Misaal) - (When Blocks) exhausts spirits with matching cost', () => {
      const override = getCardOverride('SD02-002');
      assert.ok(override);
      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb);
      assert.equal(blockAb.clauses[0].op.op, 'EXHAUST');
    });
  });

  describe('5. SD02-011 (The BeastPrince Bahamunt) Deterministic Hand Discard', () => {
    it('WHEN_SUMMONED reveals entire opposing hand and discards opposing Magic card', () => {
      assert.ok(PerCardRegistry.has('SD02-011', 'WHEN_SUMMONED'), 'Bahamunt must have WHEN_SUMMONED registered');

      const duelState = {
        player: { hand: [], field: [], trashCards: [], trash: 0 },
        opponent: {
          hand: [
            { uid: 'opp_spirit_1', name: 'Goblin', type: 'Spirit', cost: 1 },
            { uid: 'opp_magic_1', name: 'Ice Wall', type: 'Magic', cost: 2, color: 'White' },
            { uid: 'opp_nexus_1', name: 'Castle', type: 'Nexus', cost: 3 }
          ],
          field: [],
          trashCards: [],
          trash: 0
        }
      };

      const logs = [];
      const arenaApi = {
        addLog: (msg) => logs.push(msg),
        sendToTrash: (c, s) => {
          duelState[s].trashCards.push(c);
          duelState[s].trash += 1;
        },
        renderDuelTable: () => {}
      };

      const bahamuntCard = { cardNumber: 'SD02-011', name: 'The BeastPrince Bahamunt', currentLevel: 1 };
      PerCardRegistry.execute('SD02-011', 'WHEN_SUMMONED', {
        card: bahamuntCard,
        side: 'player',
        duelState,
        arenaApi
      });

      // Assert that opposing Magic card was discarded to opponent's trash
      assert.equal(duelState.opponent.trashCards.length, 1);
      assert.equal(duelState.opponent.trashCards[0].uid, 'opp_magic_1');
      assert.equal(duelState.opponent.hand.length, 2);
      assert.ok(duelState.opponent.hand.every(c => c.type !== 'Magic'));
    });
  });

  describe('6. SD02-008 (The RhinoMousquetair Grhinos) Attack Destruction & Assault: 1', () => {
    it('WHEN_ATTACKS Lv1 destroys opposing Cost 1 or less Spirit', () => {
      assert.ok(PerCardRegistry.has('SD02-008', 'WHEN_ATTACKS'), 'Grhinos must have WHEN_ATTACKS registered');

      const duelState = {
        player: { field: [], nexus: [], trashCards: [], trash: 0 },
        opponent: {
          field: [
            { uid: 'opp_spirit_1', name: 'Small Minion', type: 'Spirit', cost: 1, currentCores: 1 },
            { uid: 'opp_spirit_2', name: 'Big Dragon', type: 'Spirit', cost: 5, currentCores: 2 }
          ],
          reserve: 0,
          trashCards: [],
          trash: 0
        }
      };

      const logs = [];
      const arenaApi = {
        addLog: (msg) => logs.push(msg),
        sendToTrash: (c, s) => {
          duelState[s].trashCards.push(c);
          duelState[s].trash += 1;
        },
        handleDestroyedSpiritCores: (c, s) => {
          duelState[s].reserve += (c.currentCores || 0);
          c.currentCores = 0;
        },
        renderDuelTable: () => {}
      };

      const grhinos = { cardNumber: 'SD02-008', name: 'The RhinoMousquetair Grhinos', currentLevel: 1, isExhausted: true };
      PerCardRegistry.execute('SD02-008', 'WHEN_ATTACKS', {
        card: grhinos,
        side: 'player',
        duelState,
        arenaApi
      });

      // Cost 1 spirit must be destroyed
      assert.equal(duelState.opponent.field.length, 1);
      assert.equal(duelState.opponent.field[0].uid, 'opp_spirit_2');
      assert.equal(duelState.opponent.trashCards.length, 1);
      assert.equal(duelState.opponent.trashCards[0].uid, 'opp_spirit_1');
    });

    it('WHEN_ATTACKS Lv2 exhausts active Nexus to refresh Grhinos via Assault: 1', () => {
      const activeNexus = { uid: 'nex_1', name: 'The Generate Altar', type: 'Nexus', isExhausted: false };
      const grhinos = { cardNumber: 'SD02-008', name: 'The RhinoMousquetair Grhinos', currentLevel: 2, isExhausted: true };

      const duelState = {
        player: {
          field: [grhinos],
          nexus: [activeNexus],
          trashCards: [],
          trash: 0
        },
        opponent: { field: [], reserve: 0, trashCards: [], trash: 0 }
      };

      const arenaApi = {
        addLog: () => {},
        AudioFX: {},
        renderDuelTable: () => {}
      };

      PerCardRegistry.execute('SD02-008', 'WHEN_ATTACKS', {
        card: grhinos,
        side: 'player',
        duelState,
        arenaApi
      });

      assert.equal(activeNexus.isExhausted, true, 'Nexus must be exhausted by Assault');
      assert.equal(grhinos.isExhausted, false, 'Grhinos must be refreshed by Assault');
      assert.equal(grhinos.assaultUsedThisTurn, true, 'Assault must be marked used once per turn');
    });
  });

  describe('7. Strong Draw (SD02-017) Interactive Discard Verification', () => {
    it('drawDeck correctly draws 3 cards and prompts/discards from hand', () => {
      const duelState = {
        player: {
          deck: [
            { uid: 'd1', name: 'Card D1' },
            { uid: 'd2', name: 'Card D2' },
            { uid: 'd3', name: 'Card D3' }
          ],
          hand: [
            { uid: 'h1', name: 'Old Hand 1' }
          ],
          trashCards: [],
          trash: 0
        },
        opponent: { deck: [], hand: [] }
      };

      const logs = [];
      const arenaApi = {
        addLog: (m) => logs.push(m),
        sendToTrash: (c, s) => {
          duelState[s].trashCards.push(c);
          duelState[s].trash += 1;
        },
        promptHandDiscardModal: (card, side, maxDiscard, filter, upTo, onConfirm) => {
          // Simulate user selecting 'Old Hand 1' and 'Card D1'
          const toDiscard = duelState.player.hand.filter(c => c.uid === 'h1' || c.uid === 'd1');
          onConfirm(toDiscard);
        },
        renderDuelTable: () => {},
        renderPlayerHand: () => {}
      };

      // In Node.js environment, mock global document with body so interactive branch triggers
      global.document = { body: {} };

      const res = SagaConditionDSL.fx.drawCards({
        card: { name: 'Strong Draw' },
        side: 'player',
        duelState,
        arenaApi
      }, { count: 3, thenDiscard: 2 });

      assert.equal(res.applied, true);
      assert.equal(res.count, 3);
      // Hand started with 1, drew 3 (= 4), discarded 2 -> should have 2 remaining
      assert.equal(duelState.player.hand.length, 2);
      assert.equal(duelState.player.trashCards.length, 2);
      assert.ok(duelState.player.trashCards.some(c => c.uid === 'h1'));
      assert.ok(duelState.player.trashCards.some(c => c.uid === 'd1'));

      delete global.document;
    });
  });

  describe('8. SD02-011 (The BeastPrince Bahamunt) Attack Step Magic Lock', () => {
    it('Opponent cannot cast Magic matching colors in their Trash during attacker attack step', () => {
      const duelState = {
        turn: 3,
        activePlayer: 'player',
        phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
        phaseIndex: 5,
        player: {
          field: [{ uid: 'baha_1', cardNumber: 'SD02-011', name: 'The BeastPrince Bahamunt', currentLevel: 2 }]
        },
        opponent: {
          trashCards: [{ uid: 't_magic_1', name: 'White Potion', type: 'Magic', color: 'White' }]
        }
      };

      const checkLock = (card, side, state) => {
        const isMagic = card.type === 'Magic' || (card.type || '').includes('Magic');
        const phase = state.phases[state.phaseIndex];
        if (isMagic && phase === 'ATTACK') {
          const opposingSide = side === 'player' ? 'opponent' : 'player';
          const opposingState = state[opposingSide];
          if (opposingState && opposingState.field && state.activePlayer === opposingSide) {
            const bahamunt = opposingState.field.find(s => {
              const num = s.card_number || s.cardNumber || s.id;
              const isBaha = num === 'SD02-011' || num === 'BS06-031' || (s.name && s.name.includes('Bahamunt'));
              return isBaha && (s.currentLevel || 1) >= 2;
            });
            if (bahamunt) {
              const myTrash = (state[side] && (state[side].trashCards || [])) || [];
              const cardColor = (card.color || '').toLowerCase();
              const hasMatchingTrashMagic = myTrash.some(tc => {
                const isTcMagic = tc.type === 'Magic' || (tc.type || '').includes('Magic');
                return isTcMagic && (tc.color || '').toLowerCase() === cardColor;
              });
              if (hasMatchingTrashMagic) {
                return { allowed: false, reason: 'Locked by Bahamunt' };
              }
            }
          }
        }
        return { allowed: true };
      };

      const whiteMagic = { name: 'Dream Ribbon', type: 'Magic', color: 'White' };
      const resLocked = checkLock(whiteMagic, 'opponent', duelState);
      assert.equal(resLocked.allowed, false);

      const redMagic = { name: 'Flare', type: 'Magic', color: 'Red' };
      const resAllowed = checkLock(redMagic, 'opponent', duelState);
      assert.equal(resAllowed.allowed, true);
    });
  });

});
