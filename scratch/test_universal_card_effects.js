const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Setup mock browser DOM environment
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => {
    return {
      id,
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      innerHTML: '',
      textContent: '',
      scrollIntoView: () => {}
    };
  },
  querySelectorAll: () => []
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

global.AudioFX = {
  playTone: () => {},
  coreChime: () => {},
  slash: () => {},
  summon: () => {},
  burstSet: () => {},
  burstTrigger: () => {},
  burstIgnite: () => {},
  lifeDamage: () => {},
  shield: () => {},
  coinFlip: () => {}
};

global.showToast = (msg, type) => {
  // console.log(`[TOAST ${type}]: ${msg}`);
};

// Load battle_arena.js
const code = fs.readFileSync('battle_arena.js', 'utf8');
vm.runInThisContext(code);

const BA = window.BattleArena;
const state = BA.getState();

console.log('===============================================================');
console.log('TESTING UNIVERSAL CARD EFFECT ENGINE (THE DUKE KINGTAURUS & ALL CARDS)');
console.log('===============================================================\n');

// ── TEST 1: The Duke Kingtaurus When Summoned Void Core Ramp ──
console.log('1. Testing The Duke Kingtaurus (When Summoned) Void Core Ramp...');
state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
state.phaseIndex = 4; // MAIN step
state.activePlayer = 'player';
state.player.reserve = 15;
state.player.trash = 0;
state.player.field = [
  { uid: 'blade_g', name: 'BladeG', currentBp: 1000, currentLevel: 1, currentCores: 1, isExhausted: false },
  { uid: 'axemoth', name: 'Axemoth', currentBp: 1000, currentLevel: 1, currentCores: 1, isExhausted: false }
];

const kingtaurus = {
  uid: 'kingtaurus_1',
  name: 'The Duke Kingtaurus',
  cost: 8,
  type: 'Spirit',
  color: 'Green',
  levels: [
    { level: 1, cores: 1, bp: 4000 },
    { level: 2, cores: 3, bp: 6000 },
    { level: 3, cores: 9, bp: 12000 }
  ],
  currentCores: 1,
  currentLevel: 1,
  currentBp: 4000,
  effect: '[LV1][LV2][LV3] (When Summoned)\nFor each other Spirit you control, put a core from the Void to this Spirit.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve.'
};

state.player.hand = [kingtaurus];

// Manual summon Kingtaurus (cost 8 + 1 core placed)
BA.summonCard('kingtaurus_1', 1);

// Verify Kingtaurus is on field
const summonedKt = state.player.field.find(s => s.uid === 'kingtaurus_1');
assert(summonedKt, 'Kingtaurus should be on field');

// There were 2 other spirits on field (BladeG and Axemoth).
// Kingtaurus started with 1 core. +2 cores from the Void should bring it to 3 cores!
assert.strictEqual(summonedKt.currentCores, 3, `Expected 3 cores on Kingtaurus, got ${summonedKt.currentCores}`);
// At 3 cores, Kingtaurus must automatically be LV2 with 6000 BP!
assert.strictEqual(summonedKt.currentLevel, 2, `Expected Kingtaurus to be LV2, got LV${summonedKt.currentLevel}`);
assert.strictEqual(summonedKt.currentBp, 6000, `Expected Kingtaurus to have 6000 BP, got ${summonedKt.currentBp}`);
console.log('  [PASS] Kingtaurus summoned! Channeled 2 other Spirits -> +2 Cores from Void -> elevated to LV2, 6000 BP!');


// ── TEST 2: The Duke Kingtaurus (When Attacks) BP Comparison Life Burn at LV2 ──
console.log('2. Testing The Duke Kingtaurus (When Attacks) BP Comparison Life Burn at LV2...');
state.opponent.life = 5;
state.opponent.reserve = 0;
const oppBlocker = {
  uid: 'opp_guard',
  name: 'Dark Knight',
  cost: 3,
  currentCores: 1,
  currentLevel: 1,
  currentBp: 4000,
  isExhausted: false
};
state.opponent.field = [oppBlocker];

// Kingtaurus (6000 BP) vs Dark Knight (4000 BP)
// BP Comparison: Kingtaurus wins, Dark Knight is destroyed!
// Kingtaurus is LV2, so [LV2][LV3] BP comparison triggers Life Burn!
BA.executeBpComparisonEffects(summonedKt, oppBlocker, 'player', 'opponent');

assert.strictEqual(state.opponent.life, 4, `Opponent life should be reduced from 5 to 4, got ${state.opponent.life}`);
assert.strictEqual(state.opponent.reserve, 1, `Opponent reserve should increase by 1, got ${state.opponent.reserve}`);
console.log('  [PASS] Kingtaurus won BP comparison at LV2! Pierced defense and sent 1 Opposing Life to Reserve!');


// ── TEST 3: Level Requirement Gate (Kingtaurus at LV1 does NOT trigger Life Burn) ──
console.log('3. Testing Level Requirement Gate (Kingtaurus at LV1 must NOT trigger Life Burn)...');
const lv1Kt = {
  uid: 'kt_lv1',
  name: 'The Duke Kingtaurus',
  currentCores: 1,
  currentLevel: 1, // Only LV1!
  currentBp: 4000,
  effect: kingtaurus.effect
};
state.opponent.life = 4;
state.opponent.reserve = 1;

// Kingtaurus wins combat, but is only LV1
BA.executeBpComparisonEffects(lv1Kt, oppBlocker, 'player', 'opponent');
assert.strictEqual(state.opponent.life, 4, 'Opponent life should NOT change because Kingtaurus is only LV1');
assert.strictEqual(state.opponent.reserve, 1, 'Opponent reserve should NOT change');
console.log('  [PASS] Kingtaurus at LV1 correctly blocked from triggering [LV2][LV3] Life Burn!');


// ── TEST 4: When Summoned Draw Cards Effect ──
console.log('4. Testing (When Summoned) Draw Card(s) Engine...');
const drawSpirit = {
  uid: 'draw_sp',
  name: 'Dragon Orphnoch Devil Form',
  currentCores: 1,
  currentLevel: 1,
  currentBp: 3000,
  effect: '[LV1][LV2][LV3] (When Summoned) Draw two cards.'
};
state.player.deck = [{ name: 'Card 1', color: 'Red' }, { name: 'Card 2', color: 'Red' }, { name: 'Card 3', color: 'Red' }];
state.player.hand = [];
BA.executeWhenSummonedEffects(drawSpirit, 'player');
assert.strictEqual(state.player.hand.length, 2, 'Player should draw exactly 2 cards');
assert.strictEqual(state.player.deck.length, 1, 'Player deck should have 1 card remaining');
console.log('  [PASS] Drew 2 cards on summon successfully!');


// ── TEST 5: When Summoned Destroy Opposing BP-based Spirit ──
console.log('5. Testing (When Summoned) Destroy Opposing Spirit Engine...');
const destroySpirit = {
  uid: 'dest_sp',
  name: 'Crystal-Siegfriedragon',
  currentCores: 1,
  currentLevel: 1,
  currentBp: 7000,
  effect: '[LV1][LV2][LV3] (When Summoned) Destroy an opposing 5000 BP or less Spirit.'
};
state.opponent.field = [
  { uid: 'weak_foe', name: 'Goblin Scout', currentBp: 3000, currentCores: 2, levels: [] },
  { uid: 'strong_foe', name: 'Iron Golem', currentBp: 8000, currentCores: 3, levels: [] }
];
BA.executeWhenSummonedEffects(destroySpirit, 'player');
assert.strictEqual(state.opponent.field.length, 1, 'Opponent field should now have 1 spirit');
assert.strictEqual(state.opponent.field[0].name, 'Iron Golem', 'Iron Golem (8000 BP) should survive, Goblin Scout (3000 BP) destroyed');
console.log('  [PASS] Destroyed opposing 3000 BP spirit on summon (within 5000 BP limit)!');


// ── TEST 6: When Attacks BP Boost Level Validation ──
console.log('6. Testing (When Attacks) BP Boost Level Checking...');
const boostSpirit = {
  uid: 'boost_sp',
  name: 'Jurassickle',
  currentCores: 1,
  currentLevel: 1,
  currentBp: 2000,
  effect: '[LV2] (When Attacks) This Spirit gains +4000 BP.'
};
// At LV1:
assert.strictEqual(BA.getWhenAttacksBpBoost(boostSpirit), 0, 'LV1 Jurassickle should NOT gain +4000 BP because effect requires [LV2]');
// Level up to LV2:
boostSpirit.currentLevel = 2;
assert.strictEqual(BA.getWhenAttacksBpBoost(boostSpirit), 4000, 'LV2 Jurassickle SHOULD gain +4000 BP');
console.log('  [PASS] BP Boost on attack accurately adheres to Level requirements!');

console.log('\n===============================================================');
console.log('ALL UNIVERSAL CARD EFFECT ENGINE TESTS PASSED (100%)! 🚀');
console.log('===============================================================');
