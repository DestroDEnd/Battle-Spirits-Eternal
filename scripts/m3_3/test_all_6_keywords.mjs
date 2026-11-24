import { createGame } from '../../engine/index.js';
import { createFieldStack, createCardInstance } from '../../engine/state.js';
import assert from 'node:assert/strict';

async function testAll() {
  console.log('Testing 6 keywords with manual combat setup...');

  // 1. Holy Life
  {
    const game = createGame();
    const p = game.state.players.player;
    p.life = 3;
    p.voidCores.normal = 1;
    const stack = createFieldStack(createCardInstance({ name: 'Angel Sophia', type: 'Spirit', effect: '[Holy Life]' }, 'player'), { normal: 1, soul: 0 });
    p.field.push(stack);

    game.state.combat = { attackerStackId: stack.id, attackerSide: 'player', blockerStackId: null, stage: 'ATTACK' };
    await game.resolveDirectHit('player');
    console.log('1. Holy Life life:', p.life, 'expected: 4', p.life === 4 ? 'PASS' : 'FAIL');
  }

  // 2. Windstorm
  {
    const game = createGame();
    const p = game.state.players.player;
    const opp = game.state.players.opponent;
    const attackerStack = createFieldStack(createCardInstance({ name: 'Storm Hawk', type: 'Spirit', effect: '[Windstorm: 1]' }, 'player'), { normal: 1, soul: 0 });
    p.field.push(attackerStack);
    const blockerStack = createFieldStack(createCardInstance({ name: 'Blocker' }, 'opponent'), { normal: 1, soul: 0 });
    const otherStack = createFieldStack(createCardInstance({ name: 'Bench' }, 'opponent'), { normal: 1, soul: 0 });
    opp.field.push(blockerStack, otherStack);

    game.state.combat = { attackerStackId: attackerStack.id, attackerSide: 'player', blockerStackId: null, stage: 'ATTACK' };
    await game.declareBlock(blockerStack.id, 'opponent');
    console.log('2. Windstorm otherStack state:', otherStack.state, 'expected: EXHAUSTED', otherStack.state === 'EXHAUSTED' ? 'PASS' : 'FAIL');
  }

  // 3. Ultra Holy Life
  {
    const game = createGame();
    const p = game.state.players.player;
    const opp = game.state.players.opponent;
    const cardTop = createCardInstance({ name: 'Card Top' }, 'player');
    const cardMid = createCardInstance({ name: 'Card Mid' }, 'player');
    const cardBottom = createCardInstance({ name: 'Card Bottom' }, 'player');
    p.deck = [cardTop, cardMid, cardBottom];
    const stack = createFieldStack(createCardInstance({ name: 'The ToolcraftSacredBeast Chilam-Balam', type: 'Spirit', effect: '[Ultra Holy Life]' }, 'player'), { normal: 2, soul: 0 });
    p.field.push(stack);
    const blocker = createFieldStack(createCardInstance({ name: 'Blocker Spirit', type: 'Spirit', bp: 4000 }, 'opponent'), { normal: 1, soul: 0 });
    opp.field.push(blocker);

    game.state.combat = { attackerStackId: stack.id, attackerSide: 'player', blockerStackId: null, stage: 'ATTACK' };
    await game.declareBlock(blocker.id, 'opponent');
    console.log('3. Ultra Holy Life hand length:', p.hand.length, 'expected: 1', p.hand.length === 1 ? 'PASS' : 'FAIL');
  }

  // 4. True-Curse
  {
    const game = createGame();
    const p = game.state.players.player;
    const opp = game.state.players.opponent;
    const stack = createFieldStack(createCardInstance({ name: 'Cursed Phantom', type: 'Spirit', bp: 2000, effect: '[True-Curse]' }, 'player'), { normal: 1, soul: 0 });
    p.field.push(stack);
    const blocker = createFieldStack(createCardInstance({ name: 'Opp Blocker', type: 'Spirit', bp: 5000 }, 'opponent'), { normal: 1, soul: 0 });
    opp.field.push(blocker);

    game.state.combat = { attackerStackId: stack.id, attackerSide: 'player', blockerStackId: null, stage: 'ATTACK' };
    await game.declareBlock(blocker.id, 'opponent');
    console.log('4. True-Curse opp field length:', opp.field.length, 'expected: 0', opp.field.length === 0 ? 'PASS' : 'FAIL');
  }

  // 5. Fierce Windstorm
  {
    const game = createGame();
    const p = game.state.players.player;
    const opp = game.state.players.opponent;
    const attacker = createFieldStack(createCardInstance({ name: 'Mach G', type: 'Spirit', effect: '[Fierce Windstorm: 1]' }, 'player'), { normal: 1, soul: 0 });
    p.field.push(attacker);
    const blocker = createFieldStack(createCardInstance({ name: 'Blocker', type: 'Spirit', bp: 1000 }, 'opponent'), { normal: 1, soul: 0 });
    const bystander = createFieldStack(createCardInstance({ name: 'Bystander Ultimate', type: 'Ultimate', bp: 10000 }, 'opponent'), { normal: 1, soul: 0 });
    opp.field.push(blocker, bystander);

    game.state.combat = { attackerStackId: attacker.id, attackerSide: 'player', blockerStackId: null, stage: 'ATTACK' };
    await game.declareBlock(blocker.id, 'opponent');
    console.log('5. Fierce Windstorm bystander state:', bystander.state, 'expected: EXHAUSTED', bystander.state === 'EXHAUSTED' ? 'PASS' : 'FAIL');
  }

  // 6. Ultra Awaken
  {
    const game = createGame();
    const p = game.state.players.player;
    const opp = game.state.players.opponent;
    const ultraAwakenSpirit = createCardInstance({
      cardNumber: 'BS10-X01',
      name: 'The PhantomStarDragon Gai-Asura',
      levels: { 1: { cost: 1, bp: 5000 } },
      effect: '[Ultra Awaken]'
    }, 'player');
    const attacker = createFieldStack(ultraAwakenSpirit, { normal: 4, soul: 0 });
    attacker.state = 'EXHAUSTED';
    p.field.push(attacker);
    const blocker = createFieldStack(createCardInstance({ name: 'Opp Blocker', bp: 3000 }, 'opponent'), { normal: 1, soul: 0 });
    opp.field.push(blocker);

    game.state.combat = { attackerStackId: attacker.id, attackerSide: 'player', blockerStackId: null, stage: 'ATTACK' };
    await game.declareBlock(blocker.id, 'opponent');
    console.log('6. Ultra Awaken attacker state:', attacker.state, 'expected: REFRESHED', attacker.state === 'REFRESHED' ? 'PASS' : 'FAIL');
  }
}

testAll().catch(console.error);
