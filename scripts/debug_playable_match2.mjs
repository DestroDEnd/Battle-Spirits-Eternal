import { createGame } from '../engine/index.js';

const emptyDeckGame = createGame({
  firstPlayer: 'player',
  unsafeTestBypassDeckValidation: true
});
const state2 = emptyDeckGame.state;
state2.players.player.deck = [];
state2.turnNumber = 2;
state2.activePlayer = 'player';
state2.step = 'DRAW';
console.log('At DRAW:');
await emptyDeckGame.advanceStep();
console.log('After advance from DRAW: step =', state2.step, 'winner =', state2.winner, 'winReason =', state2.winReason);
