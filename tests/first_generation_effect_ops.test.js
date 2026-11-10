import test from 'node:test';
import assert from 'node:assert/strict';
import { createCardInstance, createFieldStack, createGameState } from '../engine/state.js';
import { computeColors } from '../engine/continuous.js';
import { calculateEffectiveCost } from '../engine/payment.js';
import { executeOp } from '../engine/ops/index.js';
import { compileCard } from '../compiler/index.js';

function createState() {
  const state = createGameState();
  state.players.player.reserve.normal = 8;
  return state;
}

test('BS02-104 Additional Color selects an allied Spirit and an additional color', async () => {
  const state = createState();
  const spirit = createCardInstance({
    card_number: 'BS01-001',
    name: 'Test Spirit',
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 2
  });
  const stack = createFieldStack(spirit);
  state.players.player.field.push(stack);

  const prompts = [];
  const promptResolver = {
    async choose(prompt) {
      prompts.push(prompt);
      if (prompt.type === 'SELECT_STACK') return [prompt.candidates[0]];
      if (prompt.type === 'CHOOSE_COLOR') {
        return [prompt.candidates.find(candidate => candidate.color === 'Blue')];
      }
      return [];
    }
  };

  const result = await executeOp(
    state,
    { op: 'ADD_COLOR' },
    { controller: 'player', sourceCard: { id: 'magic-add-color', cardNumber: 'BS02-104' } },
    promptResolver
  );

  assert.equal(result.success, true);
  assert.deepEqual(prompts.map(prompt => prompt.type), ['SELECT_STACK', 'CHOOSE_COLOR']);
  assert.equal(prompts[1].candidates.some(candidate => candidate.color === 'Red'), false);
  assert.deepEqual(computeColors(state, stack), ['Red', 'Blue']);
});

test('BS03-053 Flatface gains its printed additional colors without asking for a target or color', async () => {
  const state = createState();
  const flatface = createCardInstance({
    card_number: 'BS03-053', name: 'The HundredFaces Flatface', type: 'Spirit',
    color: 'Yellow', colors: ['Yellow'], cost: 2
  });
  const stack = createFieldStack(flatface);
  state.players.player.field.push(stack);
  const promptResolver = { async choose() { assert.fail('Printed self-color effects must not prompt'); } };

  for (const color of ['White', 'Purple']) {
    const result = await executeOp(
      state,
      { op: 'ADD_COLOR', color },
      { controller: 'player', sourceCard: flatface, sourceStack: stack },
      promptResolver
    );
    assert.equal(result.success, true);
  }

  assert.deepEqual(computeColors(state, stack), ['Yellow', 'White', 'Purple']);
});

test('BS06-046 hand cost modifier applies to matching cards in the hand', async () => {
  const state = createState();
  const vanityDeity = createCardInstance({
    card_number: 'BS06-001', name: 'Deity', type: 'Spirit', family: 'Vanity Deity',
    cost: 4, color: 'Purple'
  });
  const otherSpirit = createCardInstance({
    card_number: 'BS06-002', name: 'Other Spirit', type: 'Spirit', family: 'Demon',
    cost: 4, color: 'Purple'
  });
  state.players.player.hand.push(vanityDeity, otherSpirit);

  const result = await executeOp(
    state,
    { op: 'SET_HAND_COST', family: 'Vanity Deity', cost: 6 },
    { controller: 'player', sourceCard: { id: 'valgrind', cardNumber: 'BS06-046' } }
  );

  assert.equal(result.success, true);
  assert.equal(calculateEffectiveCost(state, vanityDeity), 6);
  assert.equal(calculateEffectiveCost(state, otherSpirit), 4);
});

test('BS02-111 Spirit Illusion restricts color choice to field Spirits and treats matching Spirits as max level', async () => {
  const compiled = compileCard({
    card_number: 'BS02-111',
    name: 'Spirit Illusion',
    type: 'Magic',
    effect: "Main- Choose a color among the colors of either player's Spirits. During this turn, every Spirit of the chosen color is treated as being at its highest Level."
  });
  assert.equal(compiled.abilities[0].clauses[0].op.colorsFromField, true);

  const state = createState();
  const red = createCardInstance({
    card_number: 'BS01-001', name: 'Red Spirit', type: 'Spirit', color: 'Red',
    colors: ['Red'], cost: 2, levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 3, bp: 3000 } }
  });
  const blue = createCardInstance({
    card_number: 'BS01-002', name: 'Blue Spirit', type: 'Spirit', color: 'Blue',
    colors: ['Blue'], cost: 2, levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 3, bp: 3000 } }
  });
  const redStack = createFieldStack(red, { normal: 1, soul: 0 });
  const blueStack = createFieldStack(blue, { normal: 1, soul: 0 });
  state.players.player.field.push(redStack);
  state.players.opponent.field.push(blueStack);

  let colorPrompt;
  const promptResolver = {
    async choose(prompt) {
      colorPrompt = prompt;
      return [prompt.candidates.find(candidate => candidate.color === 'Blue')];
    }
  };
  const context = { controller: 'player', sourceCard: { id: 'spirit-illusion', cardNumber: 'BS02-111' } };

  const choice = await executeOp(
    state,
    { op: 'CHOOSE_COLOR', colorsFromField: true, chooser: 'both' },
    context,
    promptResolver
  );
  const effect = await executeOp(state, { op: 'TREAT_AS_MAX_LEVEL', duration: 'THIS_TURN' }, context, promptResolver);

  assert.deepEqual(colorPrompt.candidates.map(candidate => candidate.color), ['Red', 'Blue']);
  assert.equal(choice.chosenColor, 'Blue');
  assert.equal(effect.success, true);
  assert.equal(effect.modifier.targetFilter.color, 'Blue');
  assert.equal((await import('../engine/continuous.js')).computeLevel(redStack, state), 1);
  assert.equal((await import('../engine/continuous.js')).computeLevel(blueStack, state), 2);
});

test('unknown operations fail instead of reporting a successful no-op', async () => {
  const state = createState();
  const result = await executeOp(state, { op: 'FIRST_GENERATION_OP_NOT_IMPLEMENTED' });
  assert.equal(result.success, false);
  assert.equal(result.reason, 'UNHANDLED_OPERATION');
});
