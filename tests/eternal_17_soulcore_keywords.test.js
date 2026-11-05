import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { computeLevel } from '../engine/continuous.js';

test('Eternal 17.0 Keyword Stacking - Dual Crush mills deck twice on attack declaration', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  // Opponent has 10 cards in deck
  opp.deck = Array.from({ length: 10 }, (_, i) => createCardInstance({ name: `Opp Card ${i}` }, 'opponent'));

  // Player controls a LV2 Spirit with 2 instances of Crush
  const doubleCrushSpirit = createCardInstance({
    name: 'Dual Crusher',
    cost: 4,
    colors: ['Blue'],
    levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 2, bp: 5000 } },
    compiledIr: {
      keywords: [
        { name: 'Crush' },
        { name: 'Crush' }
      ]
    }
  }, 'player');

  const stack = createFieldStack(doubleCrushSpirit, { normal: 2, soul: 0 }); // LV2
  p.field.push(stack);

  assert.equal(computeLevel(stack), 2);
  assert.equal(opp.deck.length, 10);
  assert.equal(opp.grave.length, 0);

  // Trigger attack declaration
  await game.events.emit({
    type: 'ATTACK_DECLARED',
    attacker: stack,
    player: 'player'
  });

  // At LV2, 1 instance of Crush mills 2 cards.
  // With 2 instances stacked (Eternal 17.0 rule), it must mill 2 * 2 = 4 cards!
  assert.equal(opp.deck.length, 6);
  assert.equal(opp.grave.length, 4);
});

test('Eternal 17.0 Soul Core Depletion - Follow-up clause fails if Soul Core move depletes spirit', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  // Spirit with 1 Soul Core and 0 normal cores (LV1 requires 1 core)
  const spirit = createCardInstance({
    name: 'Catalyst Spirit',
    cost: 2,
    levels: { 1: { cost: 1, bp: 2000 } }
  }, 'player');

  const stack = createFieldStack(spirit, { normal: 0, soul: 1 });
  p.field.push(stack);

  // Ability: [LV1] Move Soul Core to Reserve, then byDoing, Draw 2 cards
  const ability = {
    header: { level: 1 },
    clauses: [
      {
        op: {
          op: 'MOVE_CORE',
          count: 1,
          isSoulCore: true,
          from: { zone: 'field', side: 'self' },
          to: { zone: 'reserve', side: 'self' }
        }
      },
      {
        link: 'byDoing',
        op: {
          op: 'DRAW',
          count: 2
        }
      }
    ]
  };

  // Deck has 5 cards
  p.deck = Array.from({ length: 5 }, (_, i) => createCardInstance({ name: `Deck Card ${i}` }, 'player'));

  const context = {
    controller: 'player',
    sourceCard: spirit
  };

  await game.resolver.resolveAbility(game.state, ability, context, game.events);

  // Soul core moved to reserve
  assert.equal(stack.cores.soul, 0);
  assert.equal(p.reserve.soul, 2); // 1 initial + 1 moved

  // But because moving the Soul Core depleted the spirit to 0 cores,
  // the follow-up 'byDoing' Draw 2 effect MUST FAIL!
  assert.equal(p.hand.length, 0, 'Draw 2 must fail because spirit was depleted by core movement');
  assert.equal(p.deck.length, 5);
});
