import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';

const game = createGame({
  firstPlayer: 'player',
  unsafeTestBypassDeckValidation: true
});

const state = game.state;
const p1 = state.players.player;
const p2 = state.players.opponent;

// Add attacker to P1
const atkCard = createCardInstance({ id: 'ATK', type: 'Spirit', levels: { 1: { cost: 1, bp: 2000 } } }, 'player');
const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
p1.field.push(atkStack);

// Add blocker to P2
const blkCard = createCardInstance({ id: 'BLK', type: 'Spirit', levels: { 1: { cost: 1, bp: 3000 } } }, 'opponent');
const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
p2.field.push(blkStack);

state.step = 'ATTACK';
state.turnNumber = 3;
state.activePlayer = 'player';

await game.declareAttack(atkStack.id, 'player');
console.log('Combat state:', state.combat);
const blockRes = await game.declareBlock(blkStack.id, 'opponent');
console.log('Block result:', blockRes);
