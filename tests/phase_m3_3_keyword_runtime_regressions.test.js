/**
 * tests/phase_m3_3_keyword_runtime_regressions.test.js
 * 
 * Phase M.3.3 Work Package J: Keyword Runtime Regression Verification
 * 
 * Asserts runtime behavior of combat-linked keyword mechanics:
 * 1. Holy Life (Life gain from Void on direct damage)
 * 2. True-Curse (Opposing destruction on block/battle when destroyed)
 * 3. Clash (Forced blocking)
 * 4. Windstorm (Exhaustion of opponent field on block)
 * 5. Ice Wall (Magic negation at Flash timing)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';

test('M3.3-J-01: Holy Life puts 1 core from Void to Life on direct hit', async () => {
  const holySpirit = {
    name: 'Angel Sophia',
    type: 'Spirit',
    effect: '[Holy Life]'
  };

  const game = createGame();
  const p = game.state.players.player;
  p.life = 3;
  p.voidCores.normal = 1;

  const stack = createFieldStack(createCardInstance(holySpirit, 'player'), { normal: 1, soul: 0 });
  p.field.push(stack);

  await game.declareAttack(stack.id, 'player');
  await game.resolveDirectHit('player');

  assert.equal(p.life, 4, 'Holy Life must increase player life from 3 to 4');
});

test('M3.3-J-02: True-Curse destroys opposing blocker when destroyed in battle', async () => {
  const trueCurseSpirit = {
    name: 'Cursed Phantom',
    type: 'Spirit',
    bp: 2000,
    effect: '[True-Curse]'
  };

  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const stack = createFieldStack(createCardInstance(trueCurseSpirit, 'player'), { normal: 1, soul: 0 });
  p.field.push(stack);

  // Blocker has 5000 BP (higher than 2000 BP, so attacker is destroyed)
  const blocker = createFieldStack(createCardInstance({ name: 'Opp Blocker', type: 'Spirit', bp: 5000 }, 'opponent'), { normal: 1, soul: 0 });
  opp.field.push(blocker);

  await game.declareAttack(stack.id, 'player');
  await game.declareBlock(blocker.id, 'opponent');

  // Attacker destroyed into grave
  assert.equal(p.field.length, 0, 'Attacker destroyed');
  assert.equal(p.grave.length, 1, 'Attacker in grave');

  // True-Curse destroys blocker into opponent grave
  assert.equal(opp.field.length, 0, 'Opponent blocker destroyed by True-Curse');
  assert.equal(opp.grave.length, 1, 'Opponent blocker moved to grave');
});

test('M3.3-J-03: Clash forces eligible opposing Spirits to block', async () => {
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

test('M3.3-J-04: Windstorm exhausts other spirits on block', async () => {
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
  assert.equal(otherStack.state, 'EXHAUSTED', 'Bench spirit must be exhausted by Windstorm');
});
