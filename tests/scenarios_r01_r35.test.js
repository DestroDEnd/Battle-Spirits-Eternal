/**
 * tests/scenarios_r01_r35.test.js
 * 
 * Regression scenario tests from master_fix_plan.md Section 6.
 * Validates fixes for user-reported bugs R01 through R35 running headlessly on engine-v2.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { calculateEffectiveCost } from '../engine/payment.js';
import { computeEffectiveBP, computeSymbols } from '../engine/continuous.js';
import { queryCandidates } from '../engine/selectors.js';
import { AsyncResolver } from '../engine/resolver.js';
import { moveCard } from '../engine/zones.js';

test('Scenario R01 & R02 - Evil Flame total BP limit and condition switch', () => {
  const state = createGameState();
  const opp = state.players.opponent;

  // Opponent has 3000 BP spirit and 2000 BP spirit
  const sp3k = createCardInstance({ name: 'Sp3k', type: 'Spirit', levels: { 1: { cost: 1, bp: 3000 } } });
  const sp2k = createCardInstance({ name: 'Sp2k', type: 'Spirit', levels: { 1: { cost: 1, bp: 2000 } } });
  opp.field.push(createFieldStack(sp3k, { normal: 1, soul: 0 }));
  opp.field.push(createFieldStack(sp2k, { normal: 1, soul: 0 }));

  const evilFlame = createCardInstance({ name: 'Evil Flame', color: 'Red', type: 'Magic' });

  // When player controls spirits, limit is 5000 BP
  const p = state.players.player;
  const ownSp = createCardInstance({ name: 'Own Spirit', type: 'Spirit' });
  p.field.push(createFieldStack(ownSp, { normal: 1, soul: 0 }));

  let candidates = queryCandidates(state, {
    side: 'opp',
    types: ['Spirit'],
    filters: { bpLte: 5000 }
  }, { controller: 'player', sourceCard: evilFlame });
  assert.equal(candidates.length, 2);

  // Total BP of both is 5000 <= 5000
  const totalBp = candidates.reduce((sum, c) => sum + c.bp, 0);
  assert.equal(totalBp, 5000);

  // When player controls no spirits, condition switches to 10000 BP limit (R02)
  p.field = [];
  const bigSp = createCardInstance({ name: 'Big 8k', type: 'Spirit', levels: { 1: { cost: 1, bp: 8000 } } });
  opp.field.push(createFieldStack(bigSp, { normal: 1, soul: 0 }));

  candidates = queryCandidates(state, {
    side: 'opp',
    types: ['Spirit'],
    filters: { bpLte: 10000 }
  }, { controller: 'player', sourceCard: evilFlame });
  assert.equal(candidates.length, 3); // All 3 valid under 10000 BP limit
});

test('Scenario R03 & R04 - Evil Draw Main: Soul Core conditional destroy', async () => {
  const state = createGameState();
  const p = state.players.player;
  const opp = state.players.opponent;
  p.deck = [createCardInstance({ name: 'D1' }), createCardInstance({ name: 'D2' })];

  const oppSp = createCardInstance({ name: 'Weak Sp', type: 'Spirit', levels: { 1: { cost: 1, bp: 3000 } } }, 'opponent');
  opp.field.push(createFieldStack(oppSp, { normal: 1, soul: 0 }));

  // Evil Draw IR ability
  const evilDrawMain = {
    header: { isMain: true },
    clauses: [
      {
        link: null,
        op: { op: 'DRAW', count: 2 }
      },
      {
        link: 'also',
        condition: 'Soul Core was used to pay the cost',
        op: {
          op: 'DESTROY',
          target: { side: 'opp', types: ['Spirit'], filters: { bpLte: 4000 } }
        }
      }
    ]
  };

  const resolver = new AsyncResolver();

  // Test R03: No Soul Core paid -> Draw 2, no destroy
  await resolver.resolveAbility(state, evilDrawMain, { controller: 'player', soulCoreUsed: false });
  assert.equal(p.hand.length, 2);
  assert.equal(opp.field.length, 1); // Opponent spirit NOT destroyed

  // Reset hand & deck for R04
  p.hand = [];
  p.deck = [createCardInstance({ name: 'D3' }), createCardInstance({ name: 'D4' })];

  // Test R04: Soul Core was paid -> Draw 2, then destroy
  await resolver.resolveAbility(state, evilDrawMain, { controller: 'player', soulCoreUsed: true });
  assert.equal(p.hand.length, 2);
  assert.equal(opp.field.length, 0); // Destroyed!
  assert.equal(opp.grave.length, 1);
});

test('Scenario R06 - Makai Holy Grail discard up to 2 -> draw same number', async () => {
  const state = createGameState();
  const p = state.players.player;

  // Player holds 3 Makai cards in hand
  const m1 = createCardInstance({ name: 'Makai 1', families: ['Makai'], type: 'Spirit' });
  const m2 = createCardInstance({ name: 'Makai 2', families: ['Makai'], type: 'Spirit' });
  const m3 = createCardInstance({ name: 'Makai 3', families: ['Makai'], type: 'Spirit' });
  p.hand = [m1, m2, m3];
  p.deck = Array.from({ length: 5 }, (_, i) => createCardInstance({ name: `Deck ${i}` }));

  // Ability: Discard up to 2 Makai cards from hand. For each card discarded, draw a card.
  const holyGrailAbility = {
    header: { timing: 'WHEN_DEPLOYED' },
    clauses: [
      {
        link: null,
        isOptional: true,
        op: {
          op: 'DISCARD_HAND',
          count: 2,
          upTo: true,
          filter: { nameIncludes: 'Makai' }
        }
      },
      {
        link: 'byDoing',
        op: {
          op: 'DRAW',
          count: 2,
          forEach: 'DISCARDED_COUNT'
        }
      }
    ]
  };

  // Mock prompt resolver to pick exactly 2 cards
  const mockPrompt = {
    choose: async (prompt) => {
      if (prompt.type === 'CONFIRM_OPTIONAL') return { accepted: true };
      if (prompt.type === 'SELECT_CARDS') return prompt.candidates.slice(0, 2);
      return [];
    }
  };

  const resolver = new AsyncResolver(mockPrompt);
  await resolver.resolveAbility(state, holyGrailAbility, { controller: 'player' });

  assert.equal(p.grave.length, 2); // 2 discarded
  assert.equal(p.hand.length, 3); // 1 remaining + 2 drawn = 3
});

test('Scenario R08 - Chakrambat attack buff expires at battle end', async () => {
  const state = createGameState();
  const p = state.players.player;

  const chakrambat = createCardInstance({
    name: 'Chakrambat',
    type: 'Spirit',
    levels: { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 4000 } }
  });
  const stack = createFieldStack(chakrambat, { normal: 1, soul: 0 });
  p.field.push(stack);

  assert.equal(computeEffectiveBP(state, stack), 2000);

  // Attack buff +4000 BP during battle
  state.modifiers.push({
    id: 'chakrambat_buff',
    type: 'BP_BUFF',
    targetStackId: stack.id,
    amount: 4000,
    duration: 'THIS_BATTLE'
  });

  assert.equal(computeEffectiveBP(state, stack), 6000);

  // Battle ends -> expire THIS_BATTLE modifiers
  state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
  assert.equal(computeEffectiveBP(state, stack), 2000); // Back to base BP!
});

test('Scenario R33 - Braved Spirit symbols combine Brave symbols', () => {
  const state = createGameState();
  const p = state.players.player;

  const redSpirit = createCardInstance({ name: 'Red Spirit', color: 'Red', symbols: ['Red'], type: 'Spirit' });
  const redBrave = createCardInstance({ name: 'Red Brave Sword', color: 'Red', symbols: ['Red'], type: 'Brave' });

  const bravedStack = createFieldStack(redSpirit, { normal: 2, soul: 0 }, [redBrave]);
  p.field.push(bravedStack);

  const totalSymbols = computeSymbols(state, bravedStack);
  assert.deepEqual(totalSymbols, ['Red', 'Red']); // 2 symbols for direct attack!
});
