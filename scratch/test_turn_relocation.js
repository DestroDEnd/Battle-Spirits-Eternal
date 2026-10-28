const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Turn Relocation & Dedicated Arena Page Test Suite...\n');

// 1. Verify index.html & arena.html structure
const indexHtml = fs.readFileSync('index.html', 'utf-8');
const arenaHtml = fs.readFileSync('arena.html', 'utf-8');

assert(!indexHtml.includes('class="phase-track-bar"'), 'phase-track-bar should be completely removed from index.html');
assert(!arenaHtml.includes('class="phase-track-bar"'), 'phase-track-bar should be completely removed from arena.html');
console.log('  ✅ phase-track-bar is successfully removed from top of main battlefield');

assert(arenaHtml.includes('id="burstCenterTurnSlot"'), '#burstCenterTurnSlot must be present in arena.html');
assert(arenaHtml.includes('id="duelTurnLabel"'), '#duelTurnLabel must be present in arena.html');
console.log('  ✅ #burstCenterTurnSlot and #duelTurnLabel are positioned in arena.html');

// Check that burstCenterTurnSlot is between opponent and player burst zones in arena.html
const oppBurstIdx = arenaHtml.indexOf('id="opponentBurstZone"');
const turnSlotIdx = arenaHtml.indexOf('id="burstCenterTurnSlot"');
const playerBurstIdx = arenaHtml.indexOf('id="playerBurstZone"');

assert(oppBurstIdx !== -1 && turnSlotIdx !== -1 && playerBurstIdx !== -1);
assert(oppBurstIdx < turnSlotIdx, 'Opponent Burst Zone must come before Turn Slot');
assert(turnSlotIdx < playerBurstIdx, 'Turn Slot must come before Player Burst Zone');
console.log('  ✅ Turn Slot is positioned exactly between Opponent Burst Zone and Player Burst Zone');

// 2. Verify styles.css
const css = fs.readFileSync('styles.css', 'utf-8');
assert(css.includes('.burst-center-turn-slot'), 'styles.css must contain .burst-center-turn-slot');
assert(css.includes('.turn-badge-label'), 'styles.css must contain .turn-badge-label');
console.log('  ✅ styles.css has full styling for .burst-center-turn-slot and turn badges');

// 3. Verify battle_arena.js rendering
const domElements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    className: '',
    style: {},
    innerHTML: '',
    textContent: '',
    value: '',
    offsetWidth: 148,
    offsetHeight: 84,
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
  location: { pathname: '/arena', search: '', reload: () => {} },
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

const js = fs.readFileSync('battle_arena.js', 'utf-8');
vm.runInContext(js, context);

const BA = context.window.BattleArena;
const DS = BA.getState();

// Mock duel state
DS.inDuel = true;
DS.turn = 3;
DS.activePlayer = 'player';
DS.phaseIndex = 4; // MAIN

BA.renderDuelTable();

const turnLabelEl = domElements['duelTurnLabel'];
assert(turnLabelEl, '#duelTurnLabel must be rendered');
assert(turnLabelEl.innerHTML.includes('TURN 3'), 'Turn label must display TURN 3');
assert(turnLabelEl.innerHTML.includes("Player's Turn"), 'Turn label must display Player\'s Turn');
assert(turnLabelEl.innerHTML.includes('[MAIN STEP]'), 'Turn label must display [MAIN STEP]');
assert(turnLabelEl.className.includes('turn-player'), 'Turn label must have turn-player class');
console.log('  ✅ Turn label rendered correctly for Player Turn 3 [MAIN STEP]');

// Switch to opponent turn
DS.turn = 4;
DS.activePlayer = 'opponent';
DS.phaseIndex = 5; // ATTACK

BA.renderDuelTable();
assert(turnLabelEl.innerHTML.includes('TURN 4'), 'Turn label must display TURN 4');
assert(turnLabelEl.innerHTML.includes("Opponent's Turn"), 'Turn label must display Opponent\'s Turn');
assert(turnLabelEl.innerHTML.includes('[ATTACK STEP]'), 'Turn label must display [ATTACK STEP]');
assert(turnLabelEl.className.includes('turn-opponent'), 'Turn label must have turn-opponent class');
console.log('  ✅ Turn label rendered correctly for Opponent Turn 4 [ATTACK STEP]');

console.log('\n🎉 ALL TURN RELOCATION & ARENA STRUCTURE TESTS PASSED (100% SUCCESS)!');
