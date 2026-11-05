import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { setupOpeningHands } from '../engine/mulligan.js';
import { stageStackStandby, commitStackExit } from '../engine/zones.js';
import { ETERNAL_RULES } from '../engine/rules/eternal.js';

test('Eternal 17.0 Flag Nexus - Recognized as Contract Partner and guaranteed in opening hand', async () => {
  resetInstanceIdCounter();
  const flagNexus = createCardInstance({
    cardNumber: 'BS76-CX01',
    name: 'The SacredFlag Nexus of the Eternal King',
    type: 'Contract Nexus',
    family: 'Flag',
    cost: 2,
    levels: { 1: { cost: 0, bp: 0 }, 2: { cost: 2, bp: 0 } },
    effect: '[Soul State] (Your Turn) Nexuses gain +1 symbol.'
  }, 'player');

  assert.equal(flagNexus.isContractPartner, true, 'Flag Nexus must be recognized as Contract Partner');

  // Deck of 40 cards with Flag Nexus at the very bottom
  const deck = Array.from({ length: 39 }, (_, i) => createCardInstance({ name: `Spirit ${i + 1}` }, 'player'));
  deck.push(flagNexus);

  const game = createGame({
    playerDeck: deck,
    opponentDeck: deck
  });

  await setupOpeningHands(game);

  const p = game.state.players.player;
  assert.equal(p.hand.length, 4);
  assert.ok(p.hand.some(c => c.cardNumber === 'BS76-CX01'), 'Flag Nexus must be guaranteed in opening hand');
});

test('Eternal 17.0 Flag Nexus - Enters Soul State when removed by opponent', async () => {
  resetInstanceIdCounter();
  const state = (createGame()).state;

  const flagNexus = createCardInstance({
    cardNumber: 'BS76-CX01',
    name: 'The SacredFlag Nexus of the Eternal King',
    type: 'Contract Nexus',
    family: 'Flag',
    cost: 2
  }, 'player');

  const stack = createFieldStack(flagNexus, { normal: 1, soul: 1 });
  state.players.player.field.push(stack);

  // Opponent destroys the Flag Nexus
  await stageStackStandby(state, stack, 'destruction', { by: 'opponent', cause: 'destroy' });
  await commitStackExit(state, stack);

  // Instead of leaving the field to grave, it enters Soul State with Soul Core preserved!
  assert.equal(stack.isSoulState, true, 'Flag Nexus enters Soul State on opponent removal');
  assert.equal(stack.cores.soul, 1, 'Soul Core stays on Flag Nexus in Soul State');
  assert.equal(state.players.player.field.length, 1, 'Still on field in Soul State');
  assert.equal(state.players.player.grave.length, 0, 'Did not enter grave');
});

test('Eternal 17.0 Rules Profile - Flag Advent Targets include Spirit, Nexus, SoulState', () => {
  assert.equal(ETERNAL_RULES.types.flagNexusesCanEnterSoulState, true);
  assert.deepEqual(ETERNAL_RULES.types.flagContractAdventTargets, ['Spirit', 'Nexus', 'SoulState']);
});
