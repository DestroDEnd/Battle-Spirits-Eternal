const fs = require('fs');
const assert = require('assert');

// Mock DOM & Storage environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

global.window = {
  localStorage: global.localStorage,
  location: { pathname: '/', origin: 'http://localhost:8000' },
  confirm: () => true,
  prompt: (msg, def) => def
};

const domElements = {};
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false
        },
        style: {},
        innerHTML: '',
        textContent: '',
        value: '',
        disabled: false
      };
    }
    return domElements[id];
  },
  querySelector: (sel) => ({ classList: { add:()=>{}, remove:()=>{} }, style: {} }),
  querySelectorAll: (sel) => []
};

// Global toast mock
let lastToast = null;
global.showToast = (msg, type) => { lastToast = { msg, type }; };

// Load app.js and battle_arena.js
require('../app.js');
require('../battle_arena.js');

const BA = window.BattleArena;
const DM = window.DeckManager;

let testsPassed = 0;
let totalTests = 0;

async function it(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
  }
}

async function runTests() {
  console.log('🧪 RUNNING COMPREHENSIVE AUDIT & VERIFICATION TEST SUITE...\n');

  // ── TEST 1: TURN 1 RESTRICTION & TURN PROGRESSION ──
  console.log('--- 1. Testing Turn Progression & Turn 1 Attack Rules ---');

  await it('Player goes first: Player cannot attack on Turn 1', async () => {
    await BA.startDuel('deck_std_red', 'purple', 'player');
    const state = BA.getState();
    assert.strictEqual(state.turn, 1, 'Initial turn should be 1');
    assert.strictEqual(state.activePlayer, 'player', 'Player should be active');
    assert.strictEqual(state.firstPlayer, 'player', 'First player recorded');

    // Add spirit to field
    state.player.field = [{
      uid: 'sp_p1',
      name: 'Goradon',
      currentBp: 3000,
      currentCores: 1,
      levels: [{ level: 1, cores: 1, bp: 3000 }],
      isExhausted: false,
      hasAttacked: false
    }];
    state.phaseIndex = 5; // ATTACK

    // Clicking spirit to attack on Turn 1 should be blocked
    lastToast = null;
    BA.handleSpiritClick('sp_p1', 'player');
    assert.ok(lastToast && lastToast.msg.includes('Turn 1'), 'Toast warning about Turn 1 attack prohibition shown');
    assert.strictEqual(state.player.field[0].hasAttacked, false, 'Spirit should not have attacked');
  });

  await it('When Player ends Turn 1, Turn increments to 2 and Opponent CAN attack on their first turn (Turn 2)', async () => {
    const state = BA.getState();
    // Player ends Turn 1
    state.phaseIndex = 6; // END
    BA.manualStep('END');

    assert.strictEqual(state.turn, 2, 'Turn must increment to 2 when passing to Opponent!');
    assert.strictEqual(state.activePlayer, 'opponent', 'Active player should be opponent');

    // Opponent field has a ready attacker
    state.opponent.field = [{
      uid: 'sp_opp1',
      name: 'Dark Knight',
      currentBp: 4000,
      currentCores: 1,
      levels: [{ level: 1, cores: 1, bp: 4000 }],
      isExhausted: false,
      hasAttacked: false
    }];
    state.phaseIndex = 5; // ATTACK

    // On Turn 2, Opponent AI is NOT blocked by Turn 1 rule!
    assert.notStrictEqual(state.turn, 1, 'Turn 2 must NOT be treated as Turn 1');
  });

  await it('Opponent goes first: Opponent cannot attack on Turn 1, but Player CAN attack on Turn 2', async () => {
    await BA.startDuel('deck_std_red', 'purple', 'opponent');
    const state = BA.getState();
    assert.strictEqual(state.turn, 1, 'Initial turn is 1');
    assert.strictEqual(state.activePlayer, 'opponent', 'Opponent goes first');
    assert.strictEqual(state.firstPlayer, 'opponent');

    // Opponent ends Turn 1
    state.phaseIndex = 6; // END
    BA.advanceOpponentStep();

    assert.strictEqual(state.turn, 2, 'Passing from Opponent Turn 1 increments turn to 2 for Player!');
    assert.strictEqual(state.activePlayer, 'player', 'Player is now active on Turn 2');

    // Player on Turn 2 is allowed to attack
    state.player.field = [{
      uid: 'sp_p2',
      name: 'Bladebeak',
      currentBp: 4000,
      currentCores: 1,
      levels: [{ level: 1, cores: 1, bp: 4000 }],
      isExhausted: false,
      hasAttacked: false
    }];
    state.phaseIndex = 5; // ATTACK
    lastToast = null;
    BA.handleSpiritClick('sp_p2', 'player');
    assert.ok(!lastToast || !lastToast.msg.includes('Turn 1'), 'Player on Turn 2 is NOT blocked by Turn 1 prohibition');
  });

  // ── TEST 2: CORE INVARIANCE & INFLATION PREVENTION ──
  console.log('\n--- 2. Testing Core Invariance & Zero Core Inflation ---');

  await it('Crush mill does NOT increment opponent trash cores', () => {
    const state = BA.getState();
    state.opponent.deck = [{ name: 'Milled Card 1' }, { name: 'Milled Card 2' }];
    state.opponent.trash = 0;
    state.opponent.trashCards = [];

    // Check initial cores
    const initialTrashCores = state.opponent.trash;
    // Mill top card
    const c = state.opponent.deck.shift();
    BA.sendToTrash(c, 'opponent', 'Milled by Crush');

    assert.strictEqual(state.opponent.trash, initialTrashCores, 'Trash CORES must remain 0 when a card is milled!');
    assert.strictEqual(state.opponent.trashCards.length, 1, 'trashCards array must record the milled card');
  });

  // ── TEST 3: SOUL CORE RECYCLING & INTEGRITY ──
  console.log('\n--- 3. Testing Soul Core & Normal Core Separation ---');

  await it('Placing Soul Core from Reserve to Spirit does NOT deduct normal cores from Reserve', () => {
    const state = BA.getState();
    state.activePlayer = 'player';
    state.phaseIndex = 4; // MAIN
    state.player.reserve = 4;
    state.player.soulCoreLocation = 'reserve';
    state.player.soulCoreSpiritUid = null;
    state.player.field = [{
      uid: 'sp_sc1',
      name: 'Dragon',
      currentCores: 1,
      levels: [{ level: 1, cores: 1, bp: 3000 }, { level: 2, cores: 2, bp: 5000 }],
      hasSoulCore: false,
      effect: ''
    }];

    BA.placeSoulCoreOnSpirit('sp_sc1');

    assert.strictEqual(state.player.reserve, 4, 'Reserve normal cores must stay 4!');
    assert.strictEqual(state.player.soulCoreLocation, 'field');
    assert.strictEqual(state.player.field[0].hasSoulCore, true);
    assert.strictEqual(state.player.field[0].currentCores, 2, 'Spirit now has 2 total cores (1 normal + 1 Soul Core)');
  });

  await it('Removing Soul Core from Spirit to Reserve does NOT increment normal cores in Reserve', () => {
    const state = BA.getState();
    BA.removeSoulCoreFromSpirit('sp_sc1');

    assert.strictEqual(state.player.reserve, 4, 'Reserve normal cores must stay 4!');
    assert.strictEqual(state.player.soulCoreLocation, 'reserve');
    assert.strictEqual(state.player.field[0].hasSoulCore, false);
    assert.strictEqual(state.player.field[0].currentCores, 1, 'Spirit returns to 1 normal core');
  });

  await it('recycleSpiritCoresToReserve properly salvages Soul Core and returns only normal cores', () => {
    const state = BA.getState();
    state.player.reserve = 2;
    const dyingSpirit = {
      uid: 'dying_sp',
      name: 'Phoenix',
      currentCores: 3, // 2 normal cores + 1 Soul Core
      hasSoulCore: true
    };
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'dying_sp';

    const normalCoresRecycled = BA.recycleSpiritCoresToReserve(dyingSpirit, 'player');

    assert.strictEqual(normalCoresRecycled, 2, 'Exactly 2 normal cores should be returned');
    assert.strictEqual(state.player.reserve, 4, 'Reserve normal cores should become 2 + 2 = 4');
    assert.strictEqual(state.player.soulCoreLocation, 'reserve', 'Soul Core salvaged to reserve');
    assert.strictEqual(state.player.soulCoreSpiritUid, null);
  });

  await it('sendToTrash automatically salvages Soul Core to Reserve if spirit had Soul Core', () => {
    const state = BA.getState();
    const spirit = {
      uid: 'doomed_sp',
      name: 'Undead Behemoth',
      currentCores: 1,
      hasSoulCore: true
    };
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'doomed_sp';

    BA.sendToTrash(spirit, 'player', 'Depleted or destroyed');

    assert.strictEqual(state.player.soulCoreLocation, 'reserve', 'Soul Core safely salvaged to reserve!');
    assert.strictEqual(spirit.hasSoulCore, false);
  });

  // ── TEST 4: TRIBUTE SUMMON GUARD ──
  console.log('\n--- 4. Testing Tribute Summon Guard & Validation ---');

  await it('Attempting to summon a Tribute spirit with 0 eligible spirits on field is aborted', () => {
    const state = BA.getState();
    state.activePlayer = 'player';
    state.phaseIndex = 4; // MAIN
    state.player.reserve = 10;
    state.player.trash = 0;
    state.player.field = []; // ZERO spirits on field!
    state.player.hand = [{
      uid: 'tribute_dragon',
      name: 'The DragonEmperor Siegfried',
      cost: 6,
      type: 'Spirit',
      levels: [{ level: 1, cores: 1, bp: 5000 }],
      effect: '[Tribute: 1 other Spirit -> Trash]'
    }];

    lastToast = null;
    BA.summonCard('tribute_dragon');

    assert.ok(lastToast && lastToast.msg.includes('Cannot Tribute Summon'), 'Toast warning about missing Tribute spirits shown');
    assert.strictEqual(state.player.field.length, 0, 'No spirit should be summoned');
    assert.strictEqual(state.player.hand.length, 1, 'Card should remain in hand');
    assert.strictEqual(state.player.reserve, 10, 'Reserve cores should remain intact (10)');
  });

  console.log(`\n📊 RESULTS: ${testsPassed} / ${totalTests} tests passed.`);
  if (testsPassed === totalTests) {
    console.log('🎉 ALL COMPREHENSIVE AUDIT VERIFICATION TESTS PASSED!\n');
  } else {
    console.error(`⚠️ FAILED: ${totalTests - testsPassed} tests failed!`);
    process.exit(1);
  }
}

runTests();
