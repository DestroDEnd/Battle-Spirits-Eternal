import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compileCard } from '../compiler/index.js';
import { createGameState, createCardInstance } from '../engine/state.js';
import { AsyncResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';
import { resolveLegacyAbility } from '../engine/legacy_bridge.js';

describe('Trash Targeting Effects Suite - Reanimate LT & Bat Evolution', () => {

  describe('1. Compilation Tests', () => {
    it('1.1 Reanimate LT (BSC42-082) compiles Main effect to SUMMON from trash with Cost <= 3 for free', () => {
      const card = {
        card_number: 'BSC42-082',
        name: 'Reanimate LT',
        type: 'Magic',
        effect: '[Main]\n(Once per Turn: Same Name) Summon a Cost 3 or less Spirit card from your Trash, without paying the cost.\n\n[Flash]\nDuring this turn, when your Spirits with [Curse] are destroyed by opposing Spirits via BP comparison, they can remain on the Field, exhausted.'
      };
      const ir = compileCard(card);
      assert.ok(ir, 'Compiled IR should exist');
      const mainAb = ir.abilities.find(a => a.header?.timing === 'MAIN' || a.header?.isMain);
      assert.ok(mainAb, 'Main ability should exist');
      const summonClause = mainAb.clauses.find(c => c.op?.op === 'SUMMON');
      assert.ok(summonClause, 'SUMMON clause should exist');
      assert.equal(summonClause.op.from, 'trash', 'Source zone must be trash');
      assert.equal(summonClause.op.free, true, 'Summon must be free');
      assert.equal(summonClause.op.filter?.costLte, 3, 'Filter costLte must be 3');
      assert.deepEqual(summonClause.op.filter?.types, ['Spirit'], 'Filter types must include Spirit');
    });

    it('1.2 Bat Evolution (BS71-075) compiles Flash effect to SUMMON from trash with "Bat" filter', () => {
      const card = {
        card_number: 'BS71-075',
        name: 'Bat Evolution',
        type: 'Magic',
        effect: '[Flash]\n(Once per Turn: Same Name) You can summon a "Bat" Spirit card from your Trash. Then, during this turn, when you activate [True-Curse], if you control any "Petit Bat", including being in Soul State/pre-advent condition, you can destroy an opposing Nexus.'
      };
      const ir = compileCard(card);
      assert.ok(ir, 'Compiled IR should exist');
      const flashAb = ir.abilities.find(a => a.header?.timing === 'FLASH' || a.header?.isFlash);
      assert.ok(flashAb, 'Flash ability should exist');
      const summonClause = flashAb.clauses.find(c => c.op?.op === 'SUMMON');
      assert.ok(summonClause, 'SUMMON clause should exist');
      assert.equal(summonClause.op.from, 'trash', 'Source zone must be trash');
      assert.equal(summonClause.op.filter?.nameIncludes, 'Bat', 'Filter nameIncludes must be Bat');
      assert.equal(summonClause.op.isOptional, true, 'Summon is optional (you can)');
    });

    it('1.3 Trash salvage effects compile to SALVAGE with from: trash (not BOUNCE)', () => {
      const card = {
        card_number: 'TEST-SALVAGE-01',
        name: 'Test Salvage',
        type: 'Magic',
        effect: '[Main]\nReturn a Cost 3 or less Spirit card from your Trash to your Hand.'
      };
      const ir = compileCard(card);
      const ab = ir.abilities[0];
      const cl = ab.clauses.find(c => c.op?.op === 'SALVAGE');
      assert.ok(cl, 'Should compile to SALVAGE op');
      assert.equal(cl.op.from, 'trash', 'Should be from trash');
      assert.equal(cl.op.destination, 'HAND', 'Should return to hand');
      assert.equal(cl.op.filter?.costLte, 3, 'Filter costLte must be 3');
    });
  });

  describe('2. Runtime Execution Tests', () => {
    it('2.1 Reanimate LT (BSC42-082) prompts and summons ONLY matching trash cards, NEVER hand cards', async () => {
      const duelState = {
        turn: 1,
        activePlayer: 'player',
        phaseIndex: 4,
        phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
        player: {
          reserve: 5,
          trash: 0,
          life: 5,
          soulCoreLocation: 'reserve',
          hand: [
            {
              uid: 'h_reanimate',
              card_number: 'BSC42-082',
              name: 'Reanimate LT',
              type: 'Magic',
              cost: 3,
              effect: '[Main]\n(Once per Turn: Same Name) Summon a Cost 3 or less Spirit card from your Trash, without paying the cost.'
            },
            { uid: 'h_hand_spirit', card_number: 'BS01-001', name: 'Hand Dragon', type: 'Spirit', cost: 6 }
          ],
          field: [],
          nexus: [],
          trashCards: [
            { uid: 't_bone_rabbit', card_number: 'BS01-032', name: 'Bone-Rabbit', type: 'Spirit', cost: 1, levels: { 1: { cost: 1, bp: 1000 } } },
            { uid: 't_big_boss', card_number: 'BS01-X01', name: 'Siegfried', type: 'Spirit', cost: 6, levels: { 1: { cost: 1, bp: 6000 } } }
          ],
          deck: []
        },
        opponent: {
          reserve: 5,
          trash: 0,
          life: 5,
          field: [],
          nexus: [],
          trashCards: [],
          deck: []
        }
      };

      const compiledIr = compileCard(duelState.player.hand[0]);
      const mainAbility = compiledIr.abilities.find(a => a.header?.isMain || a.header?.timing === 'MAIN');

      let candidateUidsSeen = [];
      const mockPromptResolver = {
        async choose(prompt) {
          if (prompt.type === 'SELECT_SUMMON') {
            candidateUidsSeen = (prompt.candidates || []).map(c => (c.card || c).uid);
            // Pick the valid trash target
            return prompt.candidates.filter(c => (c.card || c).uid === 't_bone_rabbit');
          }
          return prompt.candidates ? [prompt.candidates[0]] : [];
        }
      };

      const result = await resolveLegacyAbility(duelState, duelState.player.hand[0], mainAbility, 'player', {
        promptResolver: mockPromptResolver
      });

      assert.equal(result.success, true, 'Ability execution should succeed');

      // Crucial verification: Candidates MUST contain Bone-Rabbit (from Trash), and NEVER Hand Dragon (from Hand) or Siegfried (cost 6)
      assert.deepEqual(candidateUidsSeen, ['t_bone_rabbit'], 'Prompt candidates must only contain the valid Cost <= 3 Spirit from Trash');

      // Verify Bone-Rabbit is now on the field
      const summonedStack = duelState.player.field.find(s => (s.top || s).uid === 't_bone_rabbit');
      assert.ok(summonedStack, 'Bone-Rabbit should now be on the field');

      // Verify Bone-Rabbit was removed from trash
      assert.equal(duelState.player.trashCards.some(c => c.uid === 't_bone_rabbit'), false, 'Bone-Rabbit removed from trash');

      // Verify Hand Dragon is STILL in hand
      assert.equal(duelState.player.hand.some(c => c.uid === 'h_hand_spirit'), true, 'Hand Dragon must still be in hand');
    });

    it('2.2 Bat Evolution (BS71-075) prompts and summons ONLY "Bat" cards from trash', async () => {
      const duelState = {
        turn: 1,
        activePlayer: 'player',
        phaseIndex: 5,
        phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
        player: {
          reserve: 5,
          trash: 0,
          life: 5,
          soulCoreLocation: 'reserve',
          hand: [
            {
              uid: 'h_bat_evo',
              card_number: 'BS71-075',
              name: 'Bat Evolution',
              type: 'Magic',
              cost: 3,
              effect: '[Flash]\n(Once per Turn: Same Name) You can summon a "Bat" Spirit card from your Trash.'
            },
            { uid: 'h_hand_bat', card_number: 'BS67-CX01', name: 'Petit Bat', type: 'Spirit', cost: 1 }
          ],
          field: [],
          nexus: [],
          trashCards: [
            { uid: 't_trash_bat', card_number: 'BS67-010', name: 'Vampire Bat', type: 'Spirit', cost: 2, levels: { 1: { cost: 1, bp: 2000 } } },
            { uid: 't_trash_non_bat', card_number: 'BS01-032', name: 'Bone-Rabbit', type: 'Spirit', cost: 1, levels: { 1: { cost: 1, bp: 1000 } } }
          ],
          deck: []
        },
        opponent: {
          reserve: 5,
          trash: 0,
          life: 5,
          field: [],
          nexus: [],
          trashCards: [],
          deck: []
        }
      };

      const compiledIr = compileCard(duelState.player.hand[0]);
      const flashAbility = compiledIr.abilities.find(a => a.header?.isFlash || a.header?.timing === 'FLASH');

      let candidateUidsSeen = [];
      const mockPromptResolver = {
        async choose(prompt) {
          if (prompt.type === 'CONFIRM_OPTIONAL') {
            return { accepted: true };
          }
          if (prompt.type === 'SELECT_SUMMON') {
            candidateUidsSeen = (prompt.candidates || []).map(c => (c.card || c).uid);
            return prompt.candidates.filter(c => (c.card || c).uid === 't_trash_bat');
          }
          return prompt.candidates ? [prompt.candidates[0]] : [];
        }
      };

      const result = await resolveLegacyAbility(duelState, duelState.player.hand[0], flashAbility, 'player', {
        promptResolver: mockPromptResolver
      });

      assert.equal(result.success, true, 'Ability execution should succeed');

      // Candidates MUST contain Vampire Bat from Trash, and NOT Petit Bat in Hand or Bone-Rabbit in Trash
      assert.deepEqual(candidateUidsSeen, ['t_trash_bat'], 'Candidates must only contain Bat cards from Trash');

      // Verify Vampire Bat is on field and removed from trash
      assert.ok(duelState.player.field.some(s => (s.top || s).uid === 't_trash_bat'), 'Vampire Bat is now on field');
      assert.equal(duelState.player.trashCards.some(c => c.uid === 't_trash_bat'), false, 'Vampire Bat removed from trash');

      // Hand cards untouched
      assert.equal(duelState.player.hand.some(c => c.uid === 'h_hand_bat'), true, 'Hand Bat must still be in hand');
    });

    it('2.3 Reanimate LT fails gracefully when no valid targets exist in trash', async () => {
      const duelState = {
        turn: 1,
        activePlayer: 'player',
        phaseIndex: 4,
        phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
        player: {
          reserve: 5,
          trash: 0,
          life: 5,
          soulCoreLocation: 'reserve',
          hand: [
            {
              uid: 'h_reanimate',
              card_number: 'BSC42-082',
              name: 'Reanimate LT',
              type: 'Magic',
              cost: 3,
              effect: '[Main]\n(Once per Turn: Same Name) Summon a Cost 3 or less Spirit card from your Trash, without paying the cost.'
            },
            { uid: 'h_hand_spirit', card_number: 'BS01-032', name: 'Bone-Rabbit', type: 'Spirit', cost: 1 } // Cost 1 in hand!
          ],
          field: [],
          nexus: [],
          trashCards: [
            { uid: 't_big_boss', card_number: 'BS01-X01', name: 'Siegfried', type: 'Spirit', cost: 6 } // Cost 6 in trash
          ],
          deck: []
        },
        opponent: { reserve: 5, trash: 0, life: 5, field: [], nexus: [], trashCards: [], deck: [] }
      };

      const compiledIr = compileCard(duelState.player.hand[0]);
      const mainAbility = compiledIr.abilities.find(a => a.header?.isMain || a.header?.timing === 'MAIN');

      const result = await resolveLegacyAbility(duelState, duelState.player.hand[0], mainAbility, 'player');
      // Should not summon anything because trash has no Cost <= 3 spirits, even though hand has Bone-Rabbit!
      assert.equal(duelState.player.field.length, 0, 'Field must remain empty');
      assert.equal(duelState.player.hand.length, 2, 'Hand cards must remain in hand');
    });
  });
});
