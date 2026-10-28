global.showToast = () => {};
const fs = require('fs');
const assert = require('assert');

console.log('--- TESTING SPIRIT CORE STEPPER (+ / -) SYSTEM ---');

// Setup mock DOM and window environment
const mockElements = {};
function createMockEl(id) {
  return {
    id,
    tagName: 'DIV',
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    dataset: {},
    innerHTML: '',
    textContent: '',
    title: '',
    disabled: false,
    scrollIntoView: () => {}
  };
}

global.window = {
  esc: (s) => s,
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {},
  confirm: () => true, // Auto-confirm in test
  DuelState: null
};

global.document = {
  readyState: 'complete',
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockEl(id);
    return mockElements[id];
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

eval(fs.readFileSync('battle_arena.js', 'utf8'));

// Setup test duel state matching user scenario:
// Player has 3 Cores in Reserve, 1 Spirit on field with Soul Core + 1 Core (Total 2 Cores)
const testSpirit = {
  uid: 'sp_chrome_riservar',
  name: 'The SixAbsoluteDeities Impenetrable-Chrome-Riservar',
  color: 'White',
  cost: 7,
  type: 'Spirit',
  image_url: '/assets/card_back.png',
  levels: [
    { level: 1, cores: 1, bp: 6000 },
    { level: 2, cores: 3, bp: 9000 },
    { level: 3, cores: 5, bp: 12000 }
  ],
  currentCores: 2, // 1 normal + 1 Soul Core
  hasSoulCore: true,
  currentLevel: 1,
  currentBp: 7000, // 6000 base + 1000 Soul Core resonance
  isExhausted: false,
  hasAttacked: false
};

const state = window.BattleArena.getState();
state.inDuel = true;
state.turn = 2;
state.activePlayer = 'player';
state.phaseIndex = 4; // MAIN STEP
state.player = {
  name: 'Challenger',
  color: 'White',
  life: 5,
  reserve: 3, // Exactly as in user screenshot!
  trash: 0,
  trashCards: [],
  voidCards: [],
  soulCoreLocation: 'field',
  soulCoreSpiritUid: testSpirit.uid,
  deck: [],
  hand: [],
  field: [testSpirit]
};

console.log('1. Verifying initial state from user screenshot...');
assert.strictEqual(state.player.reserve, 3, 'Player reserve should be 3');
assert.strictEqual(testSpirit.currentCores, 2, 'Spirit should have 2 total cores (1 normal + 1 Soul Core)');
assert.strictEqual(testSpirit.hasSoulCore, true, 'Spirit should hold Soul Core');
console.log('  [PASS] Initial state verified: Reserve 3, Spirit cores 2 (1 normal + 1 SC)');

// 2. Test renderFieldSpirit HTML output
console.log('2. Verifying renderFieldSpirit stepper markup...');
const html = state.player.field.map(s => {
  // Call internal or verify via regex on rendered card
  return document.getElementById('playerField');
});
window.BattleArena.renderDuelTable();
const fieldEl = document.getElementById('playerField');
assert(fieldEl.innerHTML.includes('fsc-core-stepper'), 'Must render core stepper');
assert(fieldEl.innerHTML.includes('class="fsc-step-btn minus"'), 'Must render minus button');
assert(fieldEl.innerHTML.includes('class="fsc-step-btn plus"'), 'Must render plus button');
assert(fieldEl.innerHTML.includes('fsc-header-row'), 'Must render clean header row with LV and BP');
assert(fieldEl.innerHTML.includes('SOUL CORE'), 'Must render Soul Core badge');
console.log('  [PASS] Spirit card HTML renders stepper row with [+] and [-] buttons');

// 3. Test adding a core from Reserve to Spirit
console.log('3. Testing adding 1 core from Reserve to Spirit (+)...');
window.BattleArena.addCoreToSpirit(testSpirit.uid);
assert.strictEqual(state.player.reserve, 2, 'Reserve should decrease from 3 to 2');
assert.strictEqual(testSpirit.currentCores, 3, 'Spirit should now have 3 total cores');
assert.strictEqual(testSpirit.currentLevel, 2, 'Spirit should have ascended to LV2 (needs 3 cores)');
assert.strictEqual(testSpirit.currentBp, 10000, 'Spirit BP should be 9000 (LV2) + 1000 (SC) = 10000 BP');
console.log('  [PASS] Added 1 core! Reserve: 2, Spirit Cores: 3, Level: LV2, BP: 10000');

// 4. Test adding another core
console.log('4. Testing adding a second core (+)...');
window.BattleArena.addCoreToSpirit(testSpirit.uid);
assert.strictEqual(state.player.reserve, 1, 'Reserve should decrease from 2 to 1');
assert.strictEqual(testSpirit.currentCores, 4, 'Spirit should now have 4 total cores');
console.log('  [PASS] Added second core! Reserve: 1, Spirit Cores: 4');

// 5. Test removing a core from Spirit back to Reserve (-)
console.log('5. Testing removing a core from Spirit (-)...');
window.BattleArena.removeCoreFromSpirit(testSpirit.uid);
assert.strictEqual(state.player.reserve, 2, 'Reserve should increase from 1 to 2');
assert.strictEqual(testSpirit.currentCores, 3, 'Spirit should now have 3 total cores');
assert.strictEqual(testSpirit.currentLevel, 2, 'Spirit should remain LV2 at 3 cores');
console.log('  [PASS] Removed 1 core! Reserve: 2, Spirit Cores: 3');

// 6. Test removing another core down to 2 cores (1 normal + 1 SC)
console.log('6. Testing removing down to 2 cores (drops to LV1)...');
window.BattleArena.removeCoreFromSpirit(testSpirit.uid);
assert.strictEqual(state.player.reserve, 3, 'Reserve should return to 3');
assert.strictEqual(testSpirit.currentCores, 2, 'Spirit should now have 2 total cores (1 normal + 1 SC)');
assert.strictEqual(testSpirit.currentLevel, 1, 'Spirit should drop to LV1');
assert.strictEqual(testSpirit.currentBp, 7000, 'BP drops to 6000 + 1000 = 7000');
console.log('  [PASS] Removed down to 2 cores! Reserve: 3, Spirit Cores: 2, Level: LV1, BP: 7000');

// 7. Test removing normal core leaving ONLY Soul Core (1 total core)
console.log('7. Testing removing normal core leaving ONLY Soul Core (1 core total)...');
window.BattleArena.removeCoreFromSpirit(testSpirit.uid);
assert.strictEqual(state.player.reserve, 4, 'Reserve should increase from 3 to 4');
assert.strictEqual(testSpirit.currentCores, 1, 'Spirit should have 1 total core (the Soul Core)');
assert.strictEqual(testSpirit.hasSoulCore, true, 'Soul core still attached');
assert.strictEqual(state.player.field.length, 1, 'Spirit is still alive on field with Soul Core');
console.log('  [PASS] Spirit safely retains Soul Core as its 1 core! Reserve: 4, Cores: 1');

// 8. Test attempting to remove normal core when 0 normal cores remain
console.log('8. Testing removal when 0 normal cores remain...');
window.BattleArena.removeCoreFromSpirit(testSpirit.uid);
assert.strictEqual(state.player.reserve, 4, 'Reserve should remain 4 (no normal cores to remove)');
assert.strictEqual(testSpirit.currentCores, 1, 'Spirit cores remain 1');
console.log('  [PASS] Correctly blocked removal of normal core when only Soul Core is present');

// 9. Test adding cores back up to reserve 0
console.log('9. Testing adding cores until Reserve is empty...');
window.BattleArena.addCoreToSpirit(testSpirit.uid); // reserve 3, cores 2
window.BattleArena.addCoreToSpirit(testSpirit.uid); // reserve 2, cores 3
window.BattleArena.addCoreToSpirit(testSpirit.uid); // reserve 1, cores 4
window.BattleArena.addCoreToSpirit(testSpirit.uid); // reserve 0, cores 5
assert.strictEqual(state.player.reserve, 0, 'Reserve should be 0');
assert.strictEqual(testSpirit.currentCores, 5, 'Spirit should have 5 cores');
assert.strictEqual(testSpirit.currentLevel, 3, 'Spirit reached LV3 (needs 5 cores)');

// Attempt to add when reserve is 0
window.BattleArena.addCoreToSpirit(testSpirit.uid);
assert.strictEqual(state.player.reserve, 0, 'Reserve cannot go negative');
assert.strictEqual(testSpirit.currentCores, 5, 'Spirit cannot exceed available cores');
console.log('  [PASS] Correctly blocked adding core when Reserve is 0');

console.log('\n=============================================================');
console.log('ALL SPIRIT CORE STEPPER (+ / -) TESTS PASSED WITH 100% SUCCESS!');
console.log('=============================================================\n');
