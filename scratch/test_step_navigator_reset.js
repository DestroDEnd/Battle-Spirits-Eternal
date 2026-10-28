const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Step Navigator Turn & Step Reset Test Suite...\n');

const domElements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, f) { if (f === undefined) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); } else if (f) this._classes.add(c); else this._classes.delete(c); }
    },
    className: '',
    style: {},
    innerHTML: '',
    textContent: '',
    disabled: false,
    value: '',
    offsetWidth: 148,
    offsetHeight: 84,
    dataset: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  createElement: (tag) => createMockElement('', tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: createMockElement('body'),
  addEventListener: () => {}
};

const mockWindow = {
  document: mockDoc,
  location: { reload: () => {} },
  setTimeout: (fn, delay) => { if (delay === 0 || !delay) fn(); return 1; },
  clearTimeout: () => {},
  BattleArena: {},
  esc: (s) => s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
};

const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  console: console,
  setTimeout: mockWindow.setTimeout,
  clearTimeout: mockWindow.clearTimeout,
  showToast: () => {},
  Math: Math,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Date: Date,
  String: String,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Set: Set,
  JSON: JSON,
  AudioContext: class {
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
  }
});

const code = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf-8');
vm.runInContext(code, context);

const BA = context.window.BattleArena;
const DS = BA.getState();

// Initialize duel state
DS.inDuel = true;
DS.turn = 1;
DS.activePlayer = 'player';
DS.phaseIndex = 0; // START
DS.player.life = 5;
DS.player.reserve = 4;
DS.player.trash = 0;
DS.player.hand = [];
DS.player.deck = [{ name: 'Test Dragon' }];
DS.player.field = [];
DS.opponent.life = 5;
DS.opponent.reserve = 4;
DS.opponent.trash = 0;
DS.opponent.hand = [];
DS.opponent.deck = [{ name: 'Test Goblin' }];
DS.opponent.field = [];

console.log('--- Test 1: Player Turn 1 Start Step Initial State ---');
BA.renderDuelTable();

const btnStart = domElements['btnStep_START'];
const statusStart = domElements['stepStatus_START'];
const btnCore = domElements['btnStep_CORE'];
const statusCore = domElements['stepStatus_CORE'];
const btnDraw = domElements['btnStep_DRAW'];

assert.strictEqual(statusStart.textContent, 'Active', 'START step status must be Active');
assert.strictEqual(btnStart.disabled, false, 'START step button must be enabled');
assert(btnStart.textContent.includes('Begin Turn'), 'START button text must be "Begin Turn"');
assert(!btnStart.textContent.includes('Step Complete'), 'START button MUST NOT say "Step Complete"');
console.log('  ✅ START step is Active and enabled with "Begin Turn"');

assert.strictEqual(statusCore.textContent, 'Pending', 'CORE step status must be Pending');
assert.strictEqual(btnCore.disabled, true, 'CORE step button must be disabled');
assert(btnCore.textContent.includes('Take +1 Core from Void'), 'CORE button must show "Take +1 Core from Void"');
assert(!btnCore.textContent.includes('Step Complete'), 'CORE button MUST NOT say "Step Complete"');
console.log('  ✅ Pending steps show prospective action and are NOT marked "Step Complete"');

console.log('\n--- Test 2: Transition through Opponent Turn with AI Step Mutating Texts ---');
// Switch to opponent turn at MAIN step
DS.activePlayer = 'opponent';
DS.turn = 1;
DS.phaseIndex = 4; // MAIN

BA.renderDuelTable();

const btnMain = domElements['btnStep_MAIN'];
const btnAttack = domElements['btnStep_ATTACK'];

assert.strictEqual(btnStart.textContent, 'Step Complete ✓', 'Opponent finished step should say Step Complete');
assert.strictEqual(btnStart.disabled, true, 'Opponent finished step button should be disabled');
assert(btnMain.textContent.includes('Opponent AI Thinking'), 'Active AI step says Opponent AI Thinking');
assert.strictEqual(btnAttack.textContent, 'Awaiting Phase...', 'Future opponent step says Awaiting Phase...');
console.log('  ✅ Opponent turn properly sets AI thinking and completed flags');

console.log('\n--- Test 3: CRITICAL BUG REPRO - Pass to Player Turn 2 at Start Step ---');
// Switch back to player for Turn 2 at START step
DS.activePlayer = 'player';
DS.turn = 2;
DS.phaseIndex = 0; // START

BA.renderDuelTable();

// Verify START step: MUST be "Begin Turn", Active, enabled
assert.strictEqual(statusStart.textContent, 'Active', 'Turn 2 START step must be Active');
assert.strictEqual(btnStart.disabled, false, 'Turn 2 START button must be enabled');
assert.strictEqual(btnStart.textContent, '✨ Begin Turn', `Turn 2 START button must say "✨ Begin Turn", got: "${btnStart.textContent}"`);
assert(!btnStart.textContent.includes('Step Complete'), 'Turn 2 START button MUST NOT say "Step Complete"');
console.log('  ✅ Turn 2 START step successfully reset from opponent text to "✨ Begin Turn"');

// Verify all pending steps: CORE, DRAW, REFRESH, MAIN, ATTACK, END MUST NOT say "Step Complete" or "Opponent AI Thinking"
const steps = ['CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
steps.forEach(p => {
  const btn = domElements[`btnStep_${p}`];
  const st = domElements[`stepStatus_${p}`];
  assert.strictEqual(st.textContent, 'Pending', `${p} step status must be Pending`);
  assert.strictEqual(btn.disabled, true, `${p} step button must be disabled`);
  assert(!btn.textContent.includes('Step Complete'), `${p} button MUST NOT say "Step Complete" when pending on Turn 2`);
  assert(!btn.textContent.includes('Opponent AI Thinking'), `${p} button MUST NOT say "Opponent AI Thinking" on player turn`);
  assert(!btn.textContent.includes('Awaiting Phase'), `${p} button MUST NOT say "Awaiting Phase" on player turn`);
});
console.log('  ✅ All pending steps on Turn 2 (CORE, DRAW, REFRESH, MAIN, ATTACK, END) cleanly reset and NOT showing "Step Complete"');

console.log('\n--- Test 4: Player Advances through Steps on Turn 2 ---');
// Player executes START step
BA.manualStep('START');
assert.strictEqual(DS.phaseIndex, 1, 'Phase index should be 1 (CORE)');
assert.strictEqual(btnStart.textContent, 'Step Complete ✓', 'Completed START step now properly says Step Complete');
assert.strictEqual(btnStart.disabled, true, 'Completed START step button is now disabled');
assert.strictEqual(statusCore.textContent, 'Active', 'CORE step is now Active');
assert.strictEqual(btnCore.disabled, false, 'CORE step button is now enabled');
assert(btnCore.textContent.includes('Take +1 Core from Void'), 'CORE step button is active with Take +1 Core');
console.log('  ✅ Player advancing to CORE properly updates START to "Step Complete ✓" and CORE to Active');

console.log('\n🎉 ALL STEP NAVIGATOR RESET TESTS PASSED WITH 100% SUCCESS!');
