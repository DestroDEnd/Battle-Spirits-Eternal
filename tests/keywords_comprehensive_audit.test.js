import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { isImmune } from '../engine/continuous.js';

test('Bandai Official Rulings - Consecutive Blade & True-Consecutive Blade', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  // Consecutive Blade: pays Soul Core from Spirit to Trash, forces 2 blockers
  const cbSpirit = createCardInstance({
    cardNumber: 'BS31-012',
    name: 'SengokuDragon Souldragon',
    effect: '[Consecutive Blade]'
  }, 'player');
  const attacker = createFieldStack(cbSpirit, { normal: 2, soul: 1 });
  p.field.push(attacker);

  await game.declareAttack(attacker.id, 'player');

  assert.equal(attacker.cores.soul, 0, 'Soul Core paid from Spirit');
  assert.equal(p.trash.soul, 1, 'Soul Core sent to Trash');
  assert.equal(game.state.combat.mustBlockIfAble, true, 'Forces block');
  assert.equal(game.state.combat.requiredBlockerCount, 2, 'Requires 2 blockers');
  assert.equal(game.state.combat.simultaneousBattle, true, 'Simultaneous battle enabled');

  // True-Consecutive Blade: pays Soul Core, battles up to 2 units, burns 1 life core per unit destroyed
  resetInstanceIdCounter();
  const game2 = createGame();
  const p2 = game2.state.players.player;
  const tcbSpirit = createCardInstance({
    cardNumber: 'BS32-X01',
    name: 'Burning-Souldragon',
    effect: '[True-Consecutive Blade]'
  }, 'player');
  const attacker2 = createFieldStack(tcbSpirit, { normal: 2, soul: 1 });
  p2.field.push(attacker2);

  await game2.declareAttack(attacker2.id, 'player');
  assert.equal(attacker2.cores.soul, 0);
  assert.equal(p2.trash.soul, 1);
  assert.equal(game2.state.combat.simultaneousBattle, true);
  assert.equal(game2.state.combat.maxTargetCount, 2);
  assert.equal(game2.state.combat.destroyLifeBurn, 1);
});

test('Bandai Official Rulings - Whirlwind heavy-exhausts opposing Spirits/Ultimates', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const whirlwindUser = createFieldStack(createCardInstance({ name: 'Kirikage', effect: '[Whirlwind: 2]' }, 'player'), { normal: 2, soul: 0 });
  const oppSpirit1 = createFieldStack(createCardInstance({ name: 'Opp Guard 1' }, 'opponent'), { normal: 1, soul: 0 });
  const oppSpirit2 = createFieldStack(createCardInstance({ name: 'Opp Guard 2' }, 'opponent'), { normal: 1, soul: 0 });
  p.field.push(whirlwindUser);
  opp.field.push(oppSpirit1, oppSpirit2);

  const whirlwindHandler = game.keywords.get('Whirlwind');
  assert.ok(whirlwindHandler);

  const res = await whirlwindHandler.executeWhirlwind(game, whirlwindUser, [oppSpirit1, oppSpirit2], 2);
  assert.equal(res.success, true);
  assert.equal(oppSpirit1.state, 'HEAVY_EXHAUSTED');
  assert.equal(oppSpirit1.heavyExhausted, true);
  assert.equal(oppSpirit2.state, 'HEAVY_EXHAUSTED');
  assert.equal(oppSpirit2.heavyExhausted, true);
});

test('Bandai Official Rulings - True-Awaken & Toppa Awaken', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  // True-Awaken: moves core to ultimate/spirit and grants +3000 BP
  const ultimateStack = createFieldStack(createCardInstance({ name: 'Ultimate-Siegfried', bp: 10000 }, 'player'), { normal: 1, soul: 0 });
  const donorStack = createFieldStack(createCardInstance({ name: 'Donor Spirit' }, 'player'), { normal: 2, soul: 0 });
  p.field.push(ultimateStack, donorStack);

  const trueAwakenHandler = game.keywords.get('True-Awaken');
  const res = await trueAwakenHandler.executeTrueAwaken(game, ultimateStack, donorStack, 1);
  assert.equal(res.success, true);
  assert.equal(donorStack.cores.normal, 1);
  assert.equal(ultimateStack.cores.normal, 2);
  assert.equal(ultimateStack.tempBP, 3000);

  // Toppa Awaken: puts core to target and increments counter (+1 or +2 during Attack Step)
  p.reserve.normal = 3;
  p.counters = 0;
  game.flow.state.currentStep = 'ATTACK';
  const toppaHandler = game.keywords.get('Toppa Awaken');
  const tRes = await toppaHandler.executeToppaAwaken(game, ultimateStack, 'player', 1);
  assert.equal(tRes.success, true);
  assert.equal(p.reserve.normal, 2);
  assert.equal(ultimateStack.cores.normal, 3);
  assert.equal(p.counters, 2, 'Counter incremented by 2 during Attack Step');
});

test('Bandai Official Rulings - Fortress & True Fortress immunity when refreshed', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const bisonStack = createFieldStack(createCardInstance({
    cardNumber: 'BS76-X08',
    name: 'Avalanche-Bison X',
    effect: '[True Fortress]'
  }, 'player'), { normal: 2, soul: 0 });
  bisonStack.state = 'REFRESHED';
  p.field.push(bisonStack);

  const oppSpell = createCardInstance({ name: 'Dark Vortex', type: 'Magic', color: 'Purple' }, 'opponent');

  // Refreshed spirit is immune to opposing effects
  assert.equal(isImmune(game.state, bisonStack, oppSpell, 'effect'), true, 'Refreshed True Fortress is immune');

  // When exhausted, immunity does not apply
  bisonStack.state = 'EXHAUSTED';
  assert.equal(isImmune(game.state, bisonStack, oppSpell, 'effect'), false, 'Exhausted True Fortress is not immune');
});

test('Bandai Official Rulings - Rush & Six Heaven Rush conditions', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  const blueUnit = createFieldStack(createCardInstance({ name: 'Blue Knight', color: 'Blue' }, 'player'), { normal: 1, soul: 0 });
  const redUnit = createFieldStack(createCardInstance({ name: 'Red Dragon', color: 'Red' }, 'player'), { normal: 1, soul: 0 });
  p.field.push(blueUnit, redUnit);

  const rushHandler = game.keywords.get('Rush');
  assert.equal(rushHandler.hasRushActive(game.state, 'player', 'Blue'), true);
  assert.equal(rushHandler.hasRushActive(game.state, 'player', 'Green'), false);

  const sixRushHandler = game.keywords.get('Six Heaven Rush');
  assert.equal(sixRushHandler.hasSixHeavenRushActive(game.state, 'player', 2), true, 'Has Blue and Red');
  assert.equal(sixRushHandler.hasSixHeavenRushActive(game.state, 'player', 3), false, 'Does not have 3 colors');

  const greenUnit = createFieldStack(createCardInstance({ name: 'Green Insect', color: 'Green' }, 'player'), { normal: 1, soul: 0 });
  p.field.push(greenUnit);
  assert.equal(sixRushHandler.hasSixHeavenRushActive(game.state, 'player', 3), true, 'Now has 3 colors');
});

test('Bandai Official Rulings - Catalyze activates Soul Burst by paying Soul Core', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  const senjuStack = createFieldStack(createCardInstance({
    cardNumber: 'BS31-X04',
    name: 'LotusMonarch Senju',
    effect: '[Catalyze: All Color]'
  }, 'player'), { normal: 2, soul: 1 });
  p.field.push(senjuStack);

  const burstCard = createCardInstance({ name: 'Soul Burst Strike', isBurst: true }, 'player');
  p.burst = burstCard;

  const catHandler = game.keywords.get('Catalyze');
  const res = await catHandler.executeCatalyze(game, senjuStack, burstCard);

  assert.equal(res.success, true);
  assert.equal(senjuStack.cores.soul, 0);
  assert.equal(p.trash.soul, 1, 'Soul Core moved to Trash');
  assert.equal(res.burstCard.name, 'Soul Burst Strike');
});

test('Bandai Official Rulings - Leap prevents ground blocks', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  const rabbitStack = createFieldStack(createCardInstance({ name: 'Mistral-Bit', effect: '[Leap]' }, 'player'), { normal: 1, soul: 0 });
  p.field.push(rabbitStack);

  const leapHandler = game.keywords.get('Leap');
  const res = await leapHandler.executeLeap(game, rabbitStack);
  assert.equal(res.success, true);
  assert.equal(rabbitStack.cannotBeBlockedByGround, true);
});
