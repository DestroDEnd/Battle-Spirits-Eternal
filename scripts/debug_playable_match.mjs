import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';

// Test 2 debug:
const emptyDeckGame = createGame({
  firstPlayer: 'player',
  unsafeTestBypassDeckValidation: true
});
const state2 = emptyDeckGame.state;
state2.players.player.deck = [];
state2.turnNumber = 2;
state2.activePlayer = 'player';
state2.step = 'CORE';
console.log('Before advance: step =', state2.step, 'deck length =', state2.players.player.deck.length);
await emptyDeckGame.advanceStep();
console.log('After advance: step =', state2.step, 'winner =', state2.winner, 'winReason =', state2.winReason);
