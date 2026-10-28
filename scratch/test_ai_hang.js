const fs = require('fs');
const path = require('path');

async function run() {
  const res = await fetch('http://127.0.0.1:8000/api/standard-decks');
  const data = await res.json();
  const standardDecks = {};
  data.decks.forEach(d => {
    standardDecks[d.color.toLowerCase()] = d;
  });

  const dom = {
    getElementById: (id) => ({
      classList: { add: () => {}, remove: () => {} },
      innerHTML: '',
      textContent: '',
      style: {},
      disabled: false
    }),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  global.document = dom;
  global.window = {
    addEventListener: () => {},
    showToast: (m) => console.log('Toast:', m)
  };

  const baCode = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf8');
  const vm = require('vm');
  let currentTimers = [];
  const context = {
    document: global.document,
    window: global.window,
    console: console,
    setTimeout: (fn, delay) => {
      currentTimers.push(fn);
      return currentTimers.length;
    },
    clearTimeout: () => {},
    AudioContext: class {
      createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
      createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    }
  };

  vm.createContext(context);
  vm.runInContext(baCode, context);

  const BA = context.window.BattleArena;
  const DuelState = context.window.DuelState;
  DuelState.standardDecks = standardDecks;

  const colors = ['red', 'purple', 'green', 'white', 'yellow', 'blue'];

  for (const color of colors) {
    const std = standardDecks[color];
    const cards = [];
    std.validated_cards.forEach(c => {
      for (let i = 0; i < c.count; i++) {
        cards.push({
          uid: 'c_' + Math.random(),
          name: c.name,
          cost: c.cost !== undefined ? c.cost : 2,
          type: c.type || 'Spirit',
          color: c.color || color,
          levels: c.parsed_levels || [{ level: 1, cores: 1, bp: 2000 }],
          raw_levels: c.levels || '',
          effect: c.effect || '',
          currentCores: 0,
          currentLevel: 1,
          currentBp: 2000,
          isExhausted: false,
          hasAttacked: false
        });
      }
    });

    console.log(`\n================ Full Turn Simulation for ${color.toUpperCase()} ================`);
    for (let sim = 0; sim < 5; sim++) {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      const hand = shuffled.slice(0, 5);
      const deck = shuffled.slice(5);

      DuelState.activePlayer = 'opponent';
      DuelState.turn = 2;
      DuelState.firstPlayer = 'player';
      DuelState.phaseIndex = 0; // START
      DuelState.opponent = {
        color: color,
        life: 5,
        reserve: 4,
        trash: 0,
        deck: deck,
        hand: hand,
        field: [],
        burst: null,
        soulCoreLocation: 'reserve',
        soulCoreSpiritUid: null
      };
      DuelState.player = {
        life: 5,
        reserve: 4,
        trash: 0,
        deck: new Array(35).fill({ name: 'Card', type: 'Spirit' }),
        hand: [],
        field: [
          { uid: 's1', name: 'The MakaiBraveShin...', type: 'Spirit', currentBp: 1000, currentLevel: 1, currentCores: 1, isExhausted: false, hasAttacked: false },
          { uid: 's2', name: 'Puppet Soldier', type: 'Spirit', currentBp: 1000, currentLevel: 1, currentCores: 1, isExhausted: false, hasAttacked: false }
        ],
        burst: null,
        soulCoreLocation: 'reserve',
        soulCoreSpiritUid: null
      };

      try {
        let maxSteps = 20;
        while (DuelState.activePlayer === 'opponent' && maxSteps > 0) {
          maxSteps--;
          currentTimers = [];
          BA.advanceOpponentStep();
          // drain scheduled timers
          while (currentTimers.length > 0) {
            const nextFn = currentTimers.shift();
            if (typeof nextFn === 'function') nextFn();
          }
        }
        if (DuelState.activePlayer !== 'player') {
          console.error(`AI did not end turn after steps! Active player is still ${DuelState.activePlayer}, phase is ${DuelState.phases[DuelState.phaseIndex]}`);
        } else {
          console.log(`Sim ${sim} completed cleanly. Turn passed to player.`);
        }
      } catch (err) {
        console.error(`CRASH in sim ${sim} for ${color}:`, err.message);
      }
    }
  }
}

run();
