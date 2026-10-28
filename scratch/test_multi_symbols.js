const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Battle Spirits Multi-Symbol & Symbol-Granting Engine Test Suite...\n');

// Mock Browser Environment
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
      toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    style: {},
    innerHTML: '',
    textContent: '',
    value: '',
    offsetWidth: 100,
    offsetHeight: 100,
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
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  BattleArena: {},
  esc: (s) => s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
};

const toastLog = [];
const mockToast = (msg, type) => {
  toastLog.push({ msg, type });
};

const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  console: console,
  setTimeout: mockWindow.setTimeout,
  clearTimeout: mockWindow.clearTimeout,
  showToast: mockToast,
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

// Load battle_arena.js
const code = fs.readFileSync('battle_arena.js', 'utf-8');
vm.runInContext(code, context);

const BA = mockWindow.BattleArena;
assert(BA, 'window.BattleArena failed to initialize');
const duelState = mockWindow.DuelState;

// --- Test 1: Base Symbol Extraction ---
console.log('--- Test 1: Base Symbol Extraction ---');
const singleSpirit = { name: 'Single Spirit', symbol: '20px', currentLevel: 1 };
assert.strictEqual(BA.getAttackSymbols(singleSpirit), 1, 'Single 20px symbol should equal 1');
console.log('  ✅ Single symbol correctly evaluated to 1');

const doubleSpirit = { name: 'Double Dragon', symbol: '20px20px', currentLevel: 1 };
assert.strictEqual(BA.getAttackSymbols(doubleSpirit), 2, '20px20px symbol should equal 2');
console.log('  ✅ Double symbol (20px20px) correctly evaluated to 2');

const tripleSpirit = { name: 'Triple Titan', symbol: '20px20px20px', currentLevel: 1 };
assert.strictEqual(BA.getAttackSymbols(tripleSpirit), 3, '20px20px20px symbol should equal 3');
console.log('  ✅ Triple symbol (20px20px20px) correctly evaluated to 3');

// --- Test 2: Self-Granted Symbol (Sengoku Siegfried) ---
console.log('\n--- Test 2: Self-Granted Additional Symbols from Effects ---');
const sengoku = {
  uid: 'sengoku_1',
  name: 'Sengoku Siegfried',
  symbol: '20px',
  currentLevel: 1,
  hasSoulCore: true,
  effect: '[LV1][LV2][LV3] Flash- Awaken\n[LV2][LV3] While this Spirit has [Soul Core] on it, this Spirit gains an extra Red symbol.'
};

// At LV1 with Soul Core: condition requires LV2, so 1 symbol
assert.strictEqual(BA.getAttackSymbols(sengoku), 1, 'LV1 should not meet [LV2][LV3] requirement');
console.log('  ✅ Sengoku Siegfried at LV1 has 1 symbol (level requirement unmet)');

// At LV2 without Soul Core: condition requires Soul Core, so 1 symbol
sengoku.currentLevel = 2;
sengoku.hasSoulCore = false;
assert.strictEqual(BA.getAttackSymbols(sengoku), 1, 'LV2 without Soul Core should not meet condition');
console.log('  ✅ Sengoku Siegfried at LV2 without Soul Core has 1 symbol');

// At LV2 with Soul Core: meets both conditions! 2 symbols!
sengoku.hasSoulCore = true;
assert.strictEqual(BA.getAttackSymbols(sengoku), 2, 'LV2 with Soul Core should gain +1 extra symbol = 2');
console.log('  ✅ Sengoku Siegfried at LV2 with Soul Core gains an extra Red symbol (2 symbols)!');

// --- Test 3: Field Aura Granting Additional Symbols ---
console.log('\n--- Test 3: Field Aura Granting Additional Symbols to Allies ---');
const auraNexus = {
  uid: 'aura_nexus_1',
  name: 'Ancient Dragon Shrine',
  currentLevel: 1,
  effect: 'All your "Ancient Dragon" family Spirits gain an extra Red symbol.'
};

const ancientDragon = {
  uid: 'ad_spirit_1',
  name: 'Crimson Dragon',
  symbol: '20px',
  family: 'Ancient Dragon',
  currentLevel: 1
};

duelState.player.field = [ancientDragon, auraNexus];
assert.strictEqual(BA.getAttackSymbols(ancientDragon, 'player'), 2, 'Ancient Dragon with allied aura should have 2 symbols');
console.log('  ✅ Ancient Dragon gained +1 extra symbol from allied aura (Total: 2 symbols)');

const nonDragon = {
  uid: 'nd_spirit_1',
  name: 'Forest Sprite',
  symbol: '20px',
  family: 'Plant',
  currentLevel: 1
};
duelState.player.field.push(nonDragon);
assert.strictEqual(BA.getAttackSymbols(nonDragon, 'player'), 1, 'Non-Ancient Dragon should not receive the family aura');
console.log('  ✅ Non-matching family Spirit correctly kept 1 symbol');

// --- Test 4: Targeted Dynamic Symbol Grant (grantExtraSymbols) ---
console.log('\n--- Test 4: Targeted Symbol Granting via grantExtraSymbols ---');
const normalSpirit = {
  uid: 'norm_1',
  name: 'Standard Soldier',
  symbol: '20px',
  currentLevel: 1
};
assert.strictEqual(BA.getAttackSymbols(normalSpirit), 1);
BA.grantExtraSymbols(normalSpirit, 2);
assert.strictEqual(BA.getAttackSymbols(normalSpirit), 3, 'After granting +2 extra symbols, should have 3 symbols');
console.log('  ✅ grantExtraSymbols(+2) increased attack symbols from 1 to 3!');

// --- Test 5: Life Damage Deduction for Multi-Symbol Attacks ---
console.log('\n--- Test 5: Life Damage Deduction for Multi-Symbol Attacks ---');
// Setup battlefield: Attacker has 2 symbols (Double Symbol)
const doubleAttacker = {
  uid: 'double_att',
  name: 'Dragonic-Taurus',
  symbol: '20px20px',
  currentLevel: 1,
  currentBp: 10000,
  levels: 'Level 1: 1 core, 10000 BP',
  effect: ''
};
duelState.turn = 2;
duelState.activePlayer = 'player';
duelState.player.field = [doubleAttacker];
duelState.opponent.field = []; // Unblocked
duelState.opponent.life = 5;
duelState.opponent.reserve = 0;

BA.executePlayerAttack(doubleAttacker);

// Opponent Life should decrease by 2 (from 5 to 3), and Opponent Reserve should get 2 cores
assert.strictEqual(duelState.opponent.life, 3, 'Opponent Life should decrease by 2 from Double Symbol attack');
assert.strictEqual(duelState.opponent.reserve, 2, 'Opponent Reserve should gain 2 cores from lost Life');
console.log('  ✅ Double Symbol attack reduced opponent Life by 2 (5 -> 3), cores moved to reserve (+2)');

// Setup battlefield: Attacker has 3 symbols (Triple Symbol)
const tripleAttacker = {
  uid: 'triple_att',
  name: 'Cosmic Overlord',
  symbol: '20px20px20px',
  currentLevel: 1,
  currentBp: 15000,
  levels: 'Level 1: 1 core, 15000 BP',
  effect: ''
};
duelState.player.field = [tripleAttacker];
duelState.opponent.life = 3;
duelState.opponent.reserve = 2;

BA.executePlayerAttack(tripleAttacker);

// Opponent Life should decrease by 3 (from 3 to 0), and Opponent Reserve should get 3 cores
assert.strictEqual(duelState.opponent.life, 0, 'Opponent Life should decrease by 3 from Triple Symbol attack');
assert.strictEqual(duelState.opponent.reserve, 5, 'Opponent Reserve should gain 3 more cores (total 5)');
console.log('  ✅ Triple Symbol attack reduced opponent Life by 3 (3 -> 0), inflicting exact lethal damage!');

console.log('\n🎉 ALL 5 MULTI-SYMBOL TESTS PASSED WITH 100% SUCCESS!');
