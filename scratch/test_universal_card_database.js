const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Universal Card Database Comprehensive Implementation Test Suite...\n');

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
DS.turn = 2;
DS.activePlayer = 'player';
DS.phaseIndex = 5; // ATTACK
DS.player.life = 5;
DS.player.reserve = 5;
DS.player.trash = 0;
DS.player.trashCards = [];
DS.player.hand = [];
DS.player.deck = [{ name: 'Draw Bonus 1' }, { name: 'Draw Bonus 2' }];
DS.player.field = [];
DS.opponent.life = 5;
DS.opponent.reserve = 5;
DS.opponent.trash = 0;
DS.opponent.trashCards = [];
DS.opponent.hand = [];
DS.opponent.deck = [{ name: 'Opp Deck 1' }];
DS.opponent.field = [];

console.log('--- Test 1: Compound Multi-Action Resolution (Arukenimon) ---');
// Arukenimon: (When Attacks) Destroy an opposing exhausted Spirit, and put a core from the Void to this Spirit.
const arukenimon = {
  uid: 'sp_arukeni',
  name: 'Arukenimon',
  cost: 5,
  currentLevel: 1,
  currentCores: 1,
  currentBp: 5000,
  levels: 'LV1 1 core 5000 BP, LV2 3 cores 8000 BP',
  effect: '[LV1][LV2][LV3] (When Attacks) Destroy an opposing exhausted Spirit, and put a core from the Void to this Spirit.'
};
DS.player.field.push(arukenimon);

const oppExhausted = {
  uid: 'sp_opp_ex',
  name: 'Gargoyle Defiler',
  cost: 4,
  currentLevel: 1,
  currentCores: 2,
  currentBp: 4000,
  isExhausted: true
};
DS.opponent.field.push(oppExhausted);

BA.executeWhenAttacksEffects(arukenimon, 'player');

assert.strictEqual(DS.opponent.field.length, 0, 'Opponent exhausted spirit must be destroyed');
assert.strictEqual(arukenimon.currentCores, 2, 'Arukenimon must receive +1 Core from Void (Compound effect executed)');
console.log('  ✅ Arukenimon successfully destroyed exhausted enemy AND gained +1 Core from Void!');

console.log('\n--- Test 2: (When Attacks/Blocks) and (When Battles) Block Trigger ---');
// Defender with When Attacks/Blocks gaining BP and exhausting attacker
const blockGuardian = {
  uid: 'sp_guardian',
  name: 'Aegis Sentinel',
  cost: 5,
  currentLevel: 2,
  currentCores: 3,
  currentBp: 6000,
  levels: 'LV1 1 core 4000 BP, LV2 3 cores 6000 BP',
  effect: '[LV1][LV2] (When Attacks/Blocks) This Spirit gets +3000 BP, and exhaust an opposing Spirit.'
};
DS.player.field = [blockGuardian];
const oppAttacker = {
  uid: 'sp_attacker',
  name: 'Savage Behemoth',
  cost: 6,
  currentLevel: 1,
  currentCores: 2,
  currentBp: 7000,
  isExhausted: false
};
DS.opponent.field = [oppAttacker];

BA.executeWhenBlocksEffects(blockGuardian, 'player', oppAttacker);

assert.strictEqual(blockGuardian.currentBp, 9000, 'Blocker must gain +3000 BP from (When Attacks/Blocks) on defending');
assert.strictEqual(oppAttacker.isExhausted, true, 'Attacker must be exhausted by blocker ability');
console.log('  ✅ (When Attacks/Blocks) triggered properly during defense (BP boosted to 9000 and enemy exhausted)!');

console.log('\n--- Test 3: When Destroyed Revenge & Life Recovery (The DragonEmperor Siegfried) ---');
// Siegfried LV3: (When Destroyed) Put a core from the Void to your Life.
DS.player.life = 4; // reduced life
const siegfried = {
  uid: 'sp_siegfried',
  name: 'The DragonEmperor Siegfried',
  cost: 6,
  currentLevel: 3,
  currentCores: 5,
  currentBp: 10000,
  levels: 'LV1 1 core 5000 BP, LV2 3 cores 7000 BP, LV3 5 cores 10000 BP',
  effect: '[LV1][LV2][LV3] Flash - [Awaken] [LV3] (When Destroyed) Put a core from the Void to your Life.'
};

BA.executeWhenDestroyedEffects(siegfried, 'player');

assert.strictEqual(DS.player.life, 5, 'Player Life must be recovered to 5 from Void');
console.log('  ✅ Siegfried LV3 When Destroyed successfully restored +1 Life from Void!');

console.log('\n--- Test 4: When Destroyed by Opponent Refresh Ally (Piyocuit) ---');
const alliedDamaged = {
  uid: 'sp_ally_tired',
  name: 'Exhausted Wyvern',
  cost: 4,
  currentBp: 4000,
  currentCores: 2,
  isExhausted: true
};
DS.player.field = [alliedDamaged];

const piyocuit = {
  uid: 'sp_piyocuit',
  name: 'Piyocuit',
  cost: 2,
  currentLevel: 2,
  currentCores: 3,
  currentBp: 3000,
  levels: 'LV1 1 core 1000 BP, LV2 3 cores 3000 BP',
  effect: '[LV2][LV3] (When Destroyed by the Opponent) Refresh a Spirit you control.'
};

BA.executeWhenDestroyedEffects(piyocuit, 'player');

assert.strictEqual(alliedDamaged.isExhausted, false, 'Allied Wyvern must be refreshed to Ready on Piyocuit destruction');
console.log('  ✅ Piyocuit When Destroyed by Opponent successfully refreshed allied Spirit!');

console.log('\n--- Test 5: Universal Magic Spell Execution (Dream Ribbon Bounce) ---');
// Dream Ribbon: Flash - Return an opposing Spirit to the Hand.
const oppTitan = {
  uid: 'sp_opp_titan',
  name: 'Titan Golem',
  cost: 7,
  currentBp: 8000,
  currentCores: 3,
  isExhausted: false
};
DS.opponent.field = [oppTitan];
DS.opponent.hand = [];
DS.opponent.reserve = 2;

const dreamRibbon = {
  uid: 'mag_dream_ribbon',
  name: 'Dream Ribbon',
  cost: 4,
  type: 'Magic',
  effect: 'Flash - Return an opposing Spirit to the Hand.'
};
DS.player.reserve = 6;
DS.player.hand = [dreamRibbon];

BA.castMagic(dreamRibbon.uid);

assert.strictEqual(DS.opponent.field.length, 0, 'Titan Golem must be bounced off the field');
assert.strictEqual(DS.opponent.hand.length, 1, 'Titan Golem must be in opponent Hand');
assert.strictEqual(DS.opponent.hand[0].name, 'Titan Golem', 'Bounced card must be Titan Golem');
assert.strictEqual(DS.opponent.reserve, 5, 'Bounced spirit cores (3) must return to opponent Reserve (2 + 3 = 5)');
console.log('  ✅ Dream Ribbon successfully bounced opposing Spirit to hand and returned cores to reserve!');

console.log('\n--- Test 6: Direct Life Burn Effect ---');
DS.opponent.life = 4;
DS.opponent.reserve = 2;
const lifeBurnCard = {
  uid: 'sp_burn',
  name: 'Infernal Phoenix',
  cost: 6,
  currentLevel: 1,
  currentCores: 2,
  currentBp: 6000,
  levels: 'LV1 1 core 6000 BP',
  effect: '[LV1] (When Attacks) Send a core from your opponent\'s Life to their Reserve.'
};

BA.executeWhenAttacksEffects(lifeBurnCard, 'player');

assert.strictEqual(DS.opponent.life, 3, 'Opponent life must be reduced from 4 to 3');
assert.strictEqual(DS.opponent.reserve, 3, 'Burned core must be moved to opponent reserve (2 + 1 = 3)');
console.log('  ✅ Direct Life Burn successfully inflicted direct Life damage and moved core to reserve!');

console.log('\n🎉 ALL 6 COMPREHENSIVE CARD IMPLEMENTATION TESTS PASSED WITH 100% SUCCESS!');
