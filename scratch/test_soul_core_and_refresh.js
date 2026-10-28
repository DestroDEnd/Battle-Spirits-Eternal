const fs = require('fs');
const assert = require('assert');

// Mock browser globals
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelectorAll: () => [],
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = {
        id,
        style: {},
        classList: {
          _classes: new Set(),
          add: function(c) { this._classes.add(c); },
          remove: function(c) { this._classes.delete(c); },
          toggle: function(c, v) { if (v) this._classes.add(c); else this._classes.delete(c); },
          contains: function(c) { return this._classes.has(c); }
        },
        innerHTML: '',
        textContent: '',
        value: '',
        offsetWidth: 100
      };
    }
    return mockElements[id];
  }
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.AudioContext = class {
  createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
  createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
  resume() {}
};

const mockElements = {};
const elementIds = [
  'battleZoneModal', 'zoneModalTitle', 'zoneModalSubtitle', 'zoneModalBody',
  'tabPlayerTrash', 'tabOpponentTrash', 'tabVoid',
  'tabCountPlayerTrash', 'tabCountOpponentTrash', 'tabCountVoid',
  'playerTrashCores', 'opponentTrashCores', 'playerTrashPill', 'opponentTrashPill',
  'playerSoulCorePill', 'opponentSoulCorePill', 'playerSoulCoreLabel', 'opponentSoulCoreLabel',
  'playerField', 'opponentField', 'playerHand', 'opponentHandBacks',
  'playerLifeContainer', 'opponentLifeContainer', 'playerReserveCores', 'opponentReserveCores',
  'playerDeckCount', 'opponentDeckCount', 'cardInspectorTray', 'duelActionBtns',
  'playerBurstZone', 'opponentBurstZone', 'playerBurstSlot', 'opponentBurstSlot',
  'btnNextPhase', 'navTurnTitle', 'navStepSubtitle',
  'stepCard_START', 'stepStatus_START', 'btnStep_START',
  'stepCard_CORE', 'stepStatus_CORE', 'btnStep_CORE',
  'stepCard_DRAW', 'stepStatus_DRAW', 'btnStep_DRAW',
  'stepCard_REFRESH', 'stepStatus_REFRESH', 'btnStep_REFRESH',
  'stepCard_MAIN', 'stepStatus_MAIN', 'btnStep_MAIN',
  'stepCard_ATTACK', 'stepStatus_ATTACK', 'btnStep_ATTACK',
  'stepCard_END', 'stepStatus_END', 'btnStep_END'
];
elementIds.forEach(id => {
  mockElements[id] = {
    id,
    style: {},
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      toggle: function(c, v) { if (v) this._classes.add(c); else this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); }
    },
    innerHTML: '',
    textContent: '',
    value: '',
    title: ''
  };
});

global.openCardDetail = () => {};
global.showToast = () => {};

// Load code
const code = fs.readFileSync('battle_arena.js', 'utf8');
eval(code);

console.log('--- TESTING REFRESH STEP & SOUL CORE MECHANICS ---');

// Test 1: Exact scenario from user screenshot (Reserve: 2, Trash: 6)
console.log('1. Testing Refresh Step Core Return (User Scenario: Reserve 2, Trash 6)...');
const state = BattleArena.getState();
state.inDuel = true;
state.activePlayer = 'player';
state.phaseIndex = 3; // REFRESH step
state.player.reserve = 2;
state.player.trash = 6;
state.player.field = [
  { uid: 'sp_1', name: 'Axemoth', currentCores: 1, currentBp: 7000, currentLevel: 1, levels: [{ level: 1, cores: 1, bp: 7000 }, { level: 2, cores: 2, bp: 9000 }], isExhausted: true },
  { uid: 'sp_2', name: 'Beatbeetle', currentCores: 1, currentBp: 4000, currentLevel: 1, levels: [{ level: 1, cores: 1, bp: 4000 }], isExhausted: false },
  { uid: 'sp_3', name: 'The Singing Maki...', currentCores: 1, currentBp: 4000, currentLevel: 1, levels: [{ level: 1, cores: 1, bp: 4000 }], isExhausted: true }
];

BattleArena.manualStep('REFRESH');

assert.strictEqual(state.player.trash, 0, 'Trash cores should be 0 after Refresh step');
assert.strictEqual(state.player.reserve, 8, 'Reserve should now have 2 + 6 = 8 cores!');
assert.strictEqual(state.player.field[0].isExhausted, false, 'Axemoth should be refreshed to Ready');
assert.strictEqual(state.player.field[2].isExhausted, false, 'The Singing Maki should be refreshed to Ready');
assert.strictEqual(state.phaseIndex, 4, 'Phase should advance to MAIN step');
console.log('✓ Used cores (6) successfully returned from Trash to Reserve (now 8)! Spirits refreshed to Ready.');

// Test 2: Soul Core Initial State
console.log('2. Verifying Soul Core initialization...');
assert.strictEqual(state.player.soulCoreLocation, 'reserve', 'Soul Core should start in Reserve');
assert.strictEqual(state.player.soulCoreSpiritUid, null, 'No spirit should hold Soul Core initially');
console.log('✓ Soul Core correctly initialized in Reserve');

// Test 3: Attaching Soul Core to a Spirit during MAIN Step
console.log('3. Testing placing Soul Core on a field Spirit...');
state.phaseIndex = 4; // MAIN step
const targetSpirit = state.player.field[0]; // Axemoth
const initialBp = targetSpirit.currentBp;
BattleArena.placeSoulCoreOnSpirit(targetSpirit.uid);

assert.strictEqual(targetSpirit.hasSoulCore, true, 'Spirit should now have hasSoulCore true');
assert.strictEqual(targetSpirit.currentCores, 2, 'Cores on spirit increased by 1 (regular + Soul Core)');
assert.strictEqual(state.player.soulCoreLocation, 'field');
assert.strictEqual(state.player.soulCoreSpiritUid, targetSpirit.uid);
assert.strictEqual(state.player.reserve, 7, 'Reserve reduced by 1 to place Soul Core');
assert.ok(targetSpirit.currentBp > initialBp, 'Spirit BP boosted by Soul Core resonance');
console.log(`✓ Soul Core successfully placed on "${targetSpirit.name}"! Cores: ${targetSpirit.currentCores}, BP: ${targetSpirit.currentBp}`);

// Test 4: Removing Soul Core back to Reserve
console.log('4. Testing returning Soul Core from Spirit to Reserve...');
BattleArena.removeSoulCoreFromSpirit(targetSpirit.uid);
assert.strictEqual(targetSpirit.hasSoulCore, false);
assert.strictEqual(targetSpirit.currentCores, 1);
assert.strictEqual(state.player.soulCoreLocation, 'reserve');
assert.strictEqual(state.player.soulCoreSpiritUid, null);
assert.strictEqual(state.player.reserve, 8, 'Reserve restored to 8');
console.log('✓ Soul Core successfully returned to Reserve');

// Test 5: Soul Core in Trash returns during Refresh Step
console.log('5. Testing Soul Core return from Trash during Refresh Step...');
state.player.soulCoreLocation = 'trash';
state.player.trash = 3;
state.phaseIndex = 3; // REFRESH step
BattleArena.manualStep('REFRESH');

assert.strictEqual(state.player.soulCoreLocation, 'reserve', 'Soul Core in Trash must return to Reserve');
assert.strictEqual(state.player.trash, 0);
assert.strictEqual(state.player.reserve, 11, '8 + 3 = 11 Cores in Reserve');
console.log('✓ Soul Core returned from Trash to Reserve during Refresh Step!');

console.log('ALL REFRESH STEP & SOUL CORE TESTS PASSED WITH 100% SUCCESS!');
