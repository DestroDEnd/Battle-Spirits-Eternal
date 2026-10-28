const fs = require('fs');

const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

global.window = {
  localStorage: global.localStorage,
  location: { pathname: '/', origin: 'http://localhost:8000' }
};

const domElements = {};
global.document = {
  readyState: 'complete',
  fullscreenElement: null,
  addEventListener: () => {},
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        style: {},
        innerHTML: '',
        textContent: '',
        value: '',
        disabled: false
      };
    }
    return domElements[id];
  },
  querySelector: () => ({ classList: { add:()=>{}, remove:()=>{} }, style: {} }),
  querySelectorAll: () => []
};

// Polyfill fetch to local server BEFORE requiring battle_arena
const nativeFetch = global.fetch;
global.fetch = async (url, opts) => {
  if (typeof url === 'string' && url.startsWith('/')) {
    url = 'http://127.0.0.1:8000' + url;
  }
  return nativeFetch(url, opts);
};

require('../app.js');
require('../battle_arena.js');

const BA = window.BattleArena;

async function testOpponentTurn() {
  console.log('Testing startDuel with red vs purple...');
  await new Promise(r => setTimeout(r, 500)); // wait for initBattleArena async fetch to complete
  await BA.startDuel('deck_std_red', 'purple', 'player');
  const state = BA.getState();

  console.log('Active player:', state.activePlayer);
  console.log('Opponent deck count:', state.opponent.deck.length);
  console.log('Opponent hand count:', state.opponent.hand.length);

  // Advance player through phases to END
  BA.nextPhase(); // CORE
  BA.nextPhase(); // DRAW
  BA.nextPhase(); // REFRESH
  BA.nextPhase(); // MAIN
  BA.nextPhase(); // ATTACK
  BA.nextPhase(); // END -> Passes to opponent

  console.log('Turn passed. Now active player:', state.activePlayer);
  console.log('Current phase index:', state.phaseIndex, state.phases[state.phaseIndex]);

  // Let advanceOpponentStep run over 10 seconds
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 600));
    console.log(`t=${(i+1)*600}ms: activePlayer=${state.activePlayer}, phase=${state.phases[state.phaseIndex]}, field=${state.opponent.field.length}, reserve=${state.opponent.reserve}`);
  }
}

testOpponentTurn().catch(err => {
  console.error('CRASHED WITH ERROR:', err);
});
