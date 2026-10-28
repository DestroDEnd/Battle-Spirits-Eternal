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

console.log('Testing Single-Target BP Boost (Insect Aura & Flash Magic)...');

// Initialize state
state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
state.phaseIndex = 5; // ATTACK step (Flash timing)
state.activePlayer = 'player';
state.player.reserve = 10;
state.player.trash = 0;
state.player.field = [
  { uid: 's1', name: 'Fortress Sentinel', currentBp: 4000, currentLevel: 1, currentCores: 1, isExhausted: false },
  { uid: 's2', name: 'Grand-Woden', currentBp: 12000, currentLevel: 2, currentCores: 2, isExhausted: false }
];
state.opponent.field = [
  { uid: 'opp1', name: 'Dark Knight', currentBp: 5000, currentLevel: 1, currentCores: 1, isExhausted: false }
];

// Test 1: Verify isSingleTargetBpBuff helper
const insectAura = {
  uid: 'm1',
  name: 'Insect Aura',
  type: 'Magic',
  cost: 3,
  effect: '[FLASH] During this turn, give a Spirit +2000 BP.'
};
assert.strictEqual(BA.isSingleTargetBpBuff(insectAura), true, 'Insect Aura should be recognized as single-target BP buff');
assert.strictEqual(BA.getMagicBpBoostAmount(insectAura), 2000, 'Insect Aura BP boost amount should be 2000');

const defensiveAura = {
  uid: 'm2',
  name: 'Defensive Aura',
  type: 'Magic',
  cost: 4,
  effect: '[FLASH] During this turn, give all your blocking Spirits +3000 BP.'
};
assert.strictEqual(BA.isSingleTargetBpBuff(defensiveAura), false, 'Defensive Aura should NOT be single-target (affects all blocking spirits)');

// Test 2: Apply Insect Aura to specific Spirit 1 (Fortress Sentinel)
const desc1 = BA.applyMagicEffect(insectAura, 'player', null, 's1');
assert.strictEqual(state.player.field[0].currentBp, 6000, 'Fortress Sentinel should gain +2000 BP (4000 -> 6000)');
assert.strictEqual(state.player.field[1].currentBp, 12000, 'Grand-Woden should NOT gain BP and remain 12000!');
assert(desc1.includes('Fortress Sentinel'), 'Effect description should name Fortress Sentinel');
assert(desc1.includes('6000 BP'), 'Effect description should state new BP');
console.log('✓ Test 1 passed: Target Spirit 1 receives +2000 BP, Spirit 2 remains unchanged!');

// Test 3: Apply Insect Aura to specific Spirit 2 (Grand-Woden)
const desc2 = BA.applyMagicEffect(insectAura, 'player', null, 's2');
assert.strictEqual(state.player.field[0].currentBp, 6000, 'Fortress Sentinel remains 6000 BP');
assert.strictEqual(state.player.field[1].currentBp, 14000, 'Grand-Woden gains +2000 BP (12000 -> 14000)');
assert(desc2.includes('Grand-Woden'), 'Effect description should name Grand-Woden');
console.log('✓ Test 2 passed: Target Spirit 2 receives +2000 BP, Spirit 1 remains unchanged!');

// Test 4: Defensive Aura applies to ALL allied spirits
BA.applyMagicEffect(defensiveAura, 'player');
assert.strictEqual(state.player.field[0].currentBp, 9000, 'Fortress Sentinel gains +3000 BP (6000 -> 9000)');
assert.strictEqual(state.player.field[1].currentBp, 17000, 'Grand-Woden gains +3000 BP (14000 -> 17000)');
console.log('✓ Test 3 passed: Defensive Aura properly buffs all defending spirits (+3000 each)!');

// Test 5: Single spirit on field auto-targets that single spirit
state.player.field = [
  { uid: 'lone_wolf', name: 'Lone Wolf', currentBp: 3000, currentLevel: 1, currentCores: 1, isExhausted: false }
];
const descLone = BA.applyMagicEffect(insectAura, 'player');
assert.strictEqual(state.player.field[0].currentBp, 5000, 'Lone spirit should automatically receive the +2000 BP');
assert(descLone.includes('Lone Wolf'), 'Effect description should name Lone Wolf');
console.log('✓ Test 4 passed: Auto-targeting single spirit works seamlessly!');

// Test 6: Target modal flow when player has multiple spirits
state.player.field = [
  { uid: 'sp_a', name: 'Alpha Dragon', currentBp: 5000, currentLevel: 1, currentCores: 1, isExhausted: false },
  { uid: 'sp_b', name: 'Beta Beast', currentBp: 4000, currentLevel: 1, currentCores: 1, isExhausted: false }
];
state.player.hand = [
  { uid: 'hand_magic', name: 'Insect Aura', type: 'Magic', cost: 3, effect: '[FLASH] During this turn, give a Spirit +2000 BP.' }
];

// Open target modal via castMagic (since field has 2 spirits and no target specified)
BA.castMagic('hand_magic'); // will call openTargetModal
// Select Alpha Dragon via target modal choice
BA.selectTargetSpirit('sp_a');

assert.strictEqual(state.player.field[0].currentBp, 7000, 'Alpha Dragon receives +2000 BP via modal target selection');
assert.strictEqual(state.player.field[1].currentBp, 4000, 'Beta Beast remains 4000 BP');
assert.strictEqual(state.player.hand.length, 0, 'Card was properly consumed from hand to trash');
console.log('✓ Test 5 passed: Target modal selection properly targets chosen spirit and spends card!');

console.log('ALL SINGLE-TARGET FLASH MAGIC TESTS PASSED SUCCESSFULLY! 🚀');
