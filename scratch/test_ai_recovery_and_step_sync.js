const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function run() {
  console.log('🧪 Starting AI Recovery & Step Sync Test Suite...\n');

  const res = await fetch('http://127.0.0.1:8000/api/standard-decks');
  const data = await res.json();
  const standardDecks = {};
  data.decks.forEach(d => {
    standardDecks[d.color.toLowerCase()] = d;
  });

  const elements = {};
  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        innerHTML: '',
        textContent: '',
        style: {},
        disabled: false
      };
    }
    return elements[id];
  }

  global.document = {
    getElementById: (id) => getOrCreateElement(id),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  global.window = {
    addEventListener: () => {},
    showToast: (m) => {}
  };

  const baCode = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf8');
  const vm = require('vm');
  let currentTimers = [];
  const context = {
    document: global.document,
    window: global.window,
    console: console,
    setTimeout: (fn, delay) => {
      const id = currentTimers.length + 1;
      currentTimers.push({ id, fn, delay });
      return id;
    },
    clearTimeout: (id) => {
      currentTimers = currentTimers.filter(t => t.id !== id);
    },
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

  // 1. AudioFX Tests
  console.log('Test 1: AudioFX.exhaust exists and does not crash');
  assert.doesNotThrow(() => {
    // Calling exhaust
    BA.AudioFX.exhaust();
  }, 'AudioFX.exhaust threw an error!');
  console.log('✅ Test 1 Passed: AudioFX.exhaust executes cleanly.');

  console.log('\nTest 2: AudioFX safe proxy handles non-existent methods');
  assert.doesNotThrow(() => {
    BA.AudioFX.nonExistentSoundMethod();
  }, 'AudioFX proxy failed to handle nonExistentSoundMethod!');
  console.log('✅ Test 2 Passed: Safe proxy prevents audio crash.');

  // 2. Step Navigator Button Sync during Opponent Turn
  console.log('\nTest 3: Step Navigator labels update properly during opponent turn');
  DuelState.inDuel = true;
  DuelState.activePlayer = 'opponent';
  DuelState.turn = 2;
  DuelState.phaseIndex = 4; // MAIN
  DuelState.opponent = {
    color: 'purple',
    life: 5,
    reserve: 5,
    trash: 0,
    deck: [],
    hand: [],
    field: [],
    burst: null
  };
  DuelState.player = {
    life: 5,
    reserve: 4,
    trash: 0,
    deck: [],
    hand: [],
    field: [],
    burst: null
  };

  // Setup DOM elements for steps
  const steps = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  steps.forEach(p => {
    getOrCreateElement(`sc_${p}`);
    getOrCreateElement(`btnStep_${p}`);
    getOrCreateElement(`statusStep_${p}`);
  });

  BA.renderDuelTable();

  // Assert step 1 (START) button text is 'Step Complete ✓'
  const btnStart = getOrCreateElement('btnStep_START');
  assert.strictEqual(btnStart.textContent, 'Step Complete ✓');
  assert.strictEqual(btnStart.disabled, true);

  // Assert step 5 (MAIN) button text is '⏳ Opponent AI Thinking...'
  const btnMain = getOrCreateElement('btnStep_MAIN');
  assert.strictEqual(btnMain.textContent, '⏳ Opponent AI Thinking...');
  assert.strictEqual(btnMain.disabled, true);
  assert(btnMain.className.includes('btn-step-ai-thinking'));

  // Assert step 6 (ATTACK) button text is 'Awaiting Phase...'
  const btnAttack = getOrCreateElement('btnStep_ATTACK');
  assert.strictEqual(btnAttack.textContent, 'Awaiting Phase...');
  assert.strictEqual(btnAttack.disabled, true);
  console.log('✅ Test 3 Passed: Step navigator button texts and classes correctly reflect AI phase states.');

  // 3. AI Burst placement does not hang and uses exhaust sound
  console.log('\nTest 4: AI correctly sets Burst card and advances to ATTACK');
  DuelState.phaseIndex = 4; // MAIN
  DuelState.opponent.hand = [
    { uid: 'burst_card_1', name: 'Flame Dance', type: 'Magic', effect: '[Burst: After your Life is decreased]', cost: 5 }
  ];
  DuelState.opponent.burst = null;
  DuelState.opponent.reserve = 5;

  BA.advanceOpponentStep();
  assert.strictEqual(DuelState.opponent.burst?.name, 'Flame Dance', 'Burst card was not set!');
  assert.strictEqual(DuelState.phaseIndex, 5, 'Phase did not advance to ATTACK (5)!');
  console.log('✅ Test 4 Passed: AI set burst card and smoothly advanced phase to ATTACK.');

  // 4. Attack Step turn 1 rule test
  console.log('\nTest 5: Turn 1 attack restrictions correctly enforce official rule');
  // Case A: First player was opponent, turn is 1 -> attacks forbidden
  DuelState.turn = 1;
  DuelState.firstPlayer = 'opponent';
  DuelState.activePlayer = 'opponent';
  DuelState.phaseIndex = 5; // ATTACK
  DuelState.opponent.field = [
    { uid: 'att1', name: 'Dragon', type: 'Spirit', currentBp: 3000, isExhausted: false, hasAttacked: false }
  ];

  let endTurnCalled = false;
  currentTimers = [];
  BA.advanceOpponentStep();
  // Timer scheduled to end turn
  assert(currentTimers.length > 0, 'No timer scheduled to pass turn on turn 1 first player!');
  console.log('✅ Test 5 Passed: Turn 1 attacks forbidden for first player.');

  // Case B: Opponent went second (turn 2) -> opponent CAN attack!
  DuelState.turn = 2;
  DuelState.firstPlayer = 'player';
  DuelState.activePlayer = 'opponent';
  DuelState.phaseIndex = 5; // ATTACK
  DuelState.opponent.field = [
    { uid: 'att2', name: 'Dragon', type: 'Spirit', currentBp: 3000, isExhausted: false, hasAttacked: false }
  ];
  currentTimers = [];
  BA.advanceOpponentStep();
  // Opponent declared attack!
  assert(DuelState.opponent.field[0].hasAttacked, 'Opponent going second was not allowed to attack!');
  console.log('✅ Test 5 Passed: Opponent going second properly permitted to attack.');

  console.log('\n🎉 ALL AI RECOVERY & STEP SYNC TESTS PASSED SUCCESSFULLY! (100% assertions satisfied)');
}

run();
