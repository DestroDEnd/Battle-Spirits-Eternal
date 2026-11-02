import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { AccelKeyword, MirageKeyword, ChangeKeyword, HighSpeedKeyword, SealKeyword } from '../engine/keywords/wave2.js';
import { UltimateTriggerKeyword } from '../engine/keywords/wave3.js';

test('Keyword Wave 1 - Clash sets mustBlockIfAble on attack declaration', async () => {
  const clashSpirit = {
    name: 'Blade Dragon',
    type: 'Spirit',
    effect: '[Clash]'
  };

  const game = createGame();
  const p = game.state.players.player;
  const stack = createFieldStack(createCardInstance(clashSpirit, 'player'), { normal: 1, soul: 0 });
  p.field.push(stack);

  await game.declareAttack(stack.id, 'player');

  assert.ok(game.state.combat, 'Combat initiated');
  assert.equal(game.state.combat.mustBlockIfAble, true, 'Clash forced block flag is set');
});

test('Keyword Wave 1 - Crush mills cards from opposing deck on attack', async () => {
  const crushSpirit = {
    name: 'Iron Golem',
    type: 'Spirit',
    levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 5000 } },
    effect: '[Crush]'
  };

  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  // Give opponent 10 cards in deck
  opp.deck = Array.from({ length: 10 }, (_, i) => createCardInstance({ name: `Opp Card ${i}` }, 'opponent'));

  // Crush spirit at LV2 (3 cores)
  const stack = createFieldStack(createCardInstance(crushSpirit, 'player'), { normal: 3, soul: 0 });
  p.field.push(stack);

  await game.declareAttack(stack.id, 'player');

  // LV2 Crush mills 2 cards
  assert.equal(opp.deck.length, 8);
  assert.equal(opp.grave.length, 2);
  assert.equal(opp.grave[0].currentOwner, 'opponent');
});

test('Keyword Wave 1 - Holy Life puts 1 core from Void to Life on direct hit', async () => {
  const holySpirit = {
    name: 'Angel Sophia',
    type: 'Spirit',
    effect: '[Holy Life]'
  };

  const game = createGame();
  const p = game.state.players.player;
  p.life = 3; // Below max 5

  const stack = createFieldStack(createCardInstance(holySpirit, 'player'), { normal: 1, soul: 0 });
  p.field.push(stack);

  await game.declareAttack(stack.id, 'player');
  await game.resolveDirectHit('player');

  // Holy Life triggered: Life increased from 3 -> 4
  assert.equal(p.life, 4);
});

test('Keyword Wave 1 - Windstorm exhausts other spirits on block', async () => {
  const windSpirit = {
    name: 'Storm Hawk',
    type: 'Spirit',
    effect: '[Windstorm: 1]'
  };

  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const attackerStack = createFieldStack(createCardInstance(windSpirit, 'player'), { normal: 1, soul: 0 });
  p.field.push(attackerStack);

  const blockerStack = createFieldStack(createCardInstance({ name: 'Blocker' }, 'opponent'), { normal: 1, soul: 0 });
  const otherStack = createFieldStack(createCardInstance({ name: 'Bench' }, 'opponent'), { normal: 1, soul: 0 });
  opp.field.push(blockerStack);
  opp.field.push(otherStack);

  await game.declareAttack(attackerStack.id, 'player');
  await game.declareBlock(blockerStack.id, 'opponent');

  // Windstorm exhausts other spirit
  assert.equal(otherStack.state, 'EXHAUSTED');
});

test('Keyword Wave 2 - Accel resolves and moves to Removed/Open Zone', async () => {
  const game = createGame();
  const accelCard = createCardInstance({
    name: 'Fire Accel',
    type: 'Spirit',
    effect: '[Accel] Draw a card.',
    compiledIr: {
      abilities: [
        {
          header: { keyword: 'Accel', isFlash: true },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.players.player.deck = [createCardInstance({ name: 'Top Card' }, 'player')];
  game.state.players.player.hand = [accelCard];

  const res = await AccelKeyword.executeAccel(game, accelCard, 'player');
  assert.ok(res.success);
  assert.equal(game.state.players.player.removed.length, 1);
  assert.equal(game.state.players.player.removed[0].id, accelCard.id);
  assert.equal(game.state.players.player.hand.length, 1); // 1 drawn card in hand
});

test('Keyword Wave 2 - Mirage sets face-up into Mirage zone', async () => {
  const game = createGame();
  const mirageCard = createCardInstance({
    name: 'Mirage Castle',
    type: 'Nexus',
    effect: '[Mirage]'
  }, 'player');
  game.state.players.player.hand = [mirageCard];

  const res = await MirageKeyword.setMirage(game, mirageCard, 'player');
  assert.ok(res.success);
  assert.equal(game.state.players.player.mirage.id, mirageCard.id);
  assert.equal(game.state.players.player.mirageSetThisTurn, true);
});

test('Keyword Wave 2 - Change swaps hand card with field spirit in refreshed state', async () => {
  const game = createGame();
  const p = game.state.players.player;

  const fieldSpirit = createCardInstance({ name: 'Kamen Rider Base', type: 'Spirit' }, 'player');
  const fieldStack = createFieldStack(fieldSpirit, { normal: 2, soul: 0 });
  fieldStack.state = 'EXHAUSTED';
  p.field.push(fieldStack);

  const changeCard = createCardInstance({ name: 'Kamen Rider Form', type: 'Spirit' }, 'player');
  p.hand.push(changeCard);

  const res = await ChangeKeyword.executeChange(game, changeCard, fieldStack.id, 'player');
  assert.ok(res.success);
  assert.equal(fieldStack.top.id, changeCard.id);
  assert.equal(fieldStack.state, 'REFRESHED'); // Refreshed condition!
  assert.ok(p.hand.some(c => c.id === fieldSpirit.id), 'Old spirit returned to hand');
});

test('Keyword Wave 2 - High Speed summons at Flash timing using Reserve cores', async () => {
  const game = createGame();
  const p = game.state.players.player;
  p.reserve.normal = 4;

  const highSpeedCard = createCardInstance({
    name: 'Mach Wing',
    cost: 2,
    type: 'Spirit',
    effect: '[High Speed]'
  }, 'player');
  p.hand = [highSpeedCard];

  const res = await HighSpeedKeyword.executeHighSpeedSummon(game, highSpeedCard, 'player');
  assert.ok(res.success);
  assert.equal(p.field.length, 1);
  assert.equal(p.field[0].top.id, highSpeedCard.id);
  assert.equal(p.trash.normal, 2); // 2 cost paid to trash
  assert.equal(p.reserve.normal, 1); // 4 - 2 cost - 1 placed = 1
});

test('Keyword Wave 2 - Seal moves Soul Core from Reserve to Life', async () => {
  const game = createGame();
  const p = game.state.players.player;
  p.life = 4;
  p.reserve.soul = 1;

  const res = await SealKeyword.executeSeal(game, 'player');
  assert.ok(res.success);
  assert.equal(p.reserve.soul, 0);
  assert.equal(p.life, 5); // Increased to 5 with Soul Core
});

test('Keyword Wave 3 - Ultimate Trigger reveals opposing decktop and detects Hit', async () => {
  const game = createGame();
  const opp = game.state.players.opponent;

  // Ultimate of cost 7
  const uSpirit = createCardInstance({ name: 'U-Siegfried', cost: 7, type: 'Ultimate' }, 'player');
  const uStack = createFieldStack(uSpirit, { normal: 2, soul: 0 });

  // Opponent decktop has Cost 4 card (< 7 => HIT!)
  opp.deck = [createCardInstance({ name: 'Cost 4 Spirit', cost: 4 }, 'opponent')];

  const res = await UltimateTriggerKeyword.executeUTrigger(game, uStack, 1);
  assert.equal(res.isHit, true);
  assert.equal(res.hitCount, 1);
  assert.equal(opp.deck.length, 0);
  assert.equal(opp.grave.length, 1); // Revealed card sent to trash
});
