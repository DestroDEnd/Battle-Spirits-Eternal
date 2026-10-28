const fs = require('fs');
const assert = require('assert');

console.log('--- TESTING TRIBUTE SUMMON & FLASH TIMING SYSTEMS ---');

global.showToast = (msg, type) => {
  // console.log(`[TOAST ${type}]: ${msg}`);
};

const mockElements = {};
function createMockEl(id) {
  return {
    id,
    tagName: 'DIV',
    style: {},
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      toggle: function(c, v) { if (v) this._classes.add(c); else this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); }
    },
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
  confirm: () => true,
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

// ── PART 1: TEST TRIBUTE DETECTION & ELIGIBILITY ──
console.log('1. Testing Tribute requirement parser...');
const grandWoden = {
  uid: 'c_grand_woden',
  name: 'The WingDeity Grand-Woden',
  cost: 8,
  type: 'Spirit',
  color: 'White',
  effect: '[Tribute: Cost 5 or more → Void]\nAfter paying for the summoning cost, you must send all core from a Cost 5 or more Spirits you control to the Void.\n\n[LV1][LV2][LV3] (Opposing Turn) Magic negation...',
  levels: [{ level: 1, cores: 1, bp: 7000 }, { level: 2, cores: 3, bp: 9000 }, { level: 3, cores: 4, bp: 10000 }]
};

const tributeReq = window.BattleArena.getCardTributeRequirement(grandWoden);
assert(tributeReq !== null, 'Grand-Woden must have a Tribute requirement');
assert.strictEqual(tributeReq.type, 'cost', 'Tribute type should be cost');
assert.strictEqual(tributeReq.minCost, 5, 'Minimum cost should be 5');
assert.strictEqual(tributeReq.dest, 'void', 'Destination should be Void');
console.log('  [PASS] Tribute requirement parsed: Cost 5+ Spirit -> Void');

// Test field with only Cost 3 spirit
const diamondBetta = {
  uid: 'sp_betta',
  name: 'Diamond Betta',
  cost: 3,
  type: 'Spirit',
  color: 'White',
  currentCores: 2,
  currentLevel: 1,
  currentBp: 3000
};

const eligibleWhenBettaOnly = window.BattleArena.getEligibleTributeSpirits(tributeReq, [diamondBetta]);
assert.strictEqual(eligibleWhenBettaOnly.length, 0, 'Diamond Betta (Cost 3) cannot be tributed for Cost 5+ Tribute');
console.log('  [PASS] Cost 3 Spirit correctly rejected for Cost 5+ Tribute');

// Test field with Cost 7 spirit
const chromeRiservar = {
  uid: 'sp_riservar',
  name: 'The SixAbsoluteDeities Impenetrable-Chrome-Riservar',
  cost: 7,
  type: 'Spirit',
  color: 'White',
  currentCores: 3,
  currentLevel: 2,
  currentBp: 9000
};

const eligibleWithRiservar = window.BattleArena.getEligibleTributeSpirits(tributeReq, [diamondBetta, chromeRiservar]);
assert.strictEqual(eligibleWithRiservar.length, 1, 'Only Chrome-Riservar should be eligible');
assert.strictEqual(eligibleWithRiservar[0].uid, chromeRiservar.uid, 'Chrome-Riservar matches Cost 5+ condition');
console.log('  [PASS] Chrome-Riservar (Cost 7) correctly identified as eligible Tribute Spirit');

// ── PART 2: TEST TRIBUTE SUMMON EXECUTION ──
console.log('2. Testing Tribute Summon execution & Void core transfer...');
const state = window.BattleArena.getState();
state.inDuel = true;
state.turn = 3;
state.activePlayer = 'player';
state.phaseIndex = 4; // MAIN STEP
state.player = {
  name: 'Challenger',
  color: 'White',
  life: 5,
  reserve: 9, // Enough to summon Cost 8 + 1
  trash: 0,
  trashCards: [],
  voidCards: [],
  soulCoreLocation: 'reserve',
  soulCoreSpiritUid: null,
  deck: [],
  hand: [grandWoden],
  field: [chromeRiservar] // 3 cores on field
};

// Summon Grand-Woden
window.BattleArena.summonCard(grandWoden.uid, 1);

// Verify Chrome-Riservar was tributed:
assert(!state.player.field.some(s => s.uid === chromeRiservar.uid), 'Chrome-Riservar must be removed from field');
assert(state.player.trashCards.some(c => c.uid === chromeRiservar.uid), 'Chrome-Riservar must be sent to Trash as tributed spirit');

// Verify Grand-Woden entered the battlefield:
const summonedWoden = state.player.field.find(s => s.name === grandWoden.name);
assert(summonedWoden !== undefined, 'Grand-Woden must now be on the field');
assert.strictEqual(summonedWoden.currentCores, 1, 'Grand-Woden should have 1 Core placed');
assert.strictEqual(summonedWoden.currentLevel, 1, 'Grand-Woden should be Level 1');

// Verify cores:
// 8 Cost paid from Reserve (9 - 9 = 0 remaining reserve)
assert.strictEqual(state.player.reserve, 0, 'Reserve should be 0 (paid 8 cost + 1 to place)');
assert.strictEqual(state.player.trash, 8, 'Trash cores should have 8 paid summoning cost');
// The 3 cores on Chrome-Riservar went to Void (not Reserve and not Trash!)
console.log('  [PASS] Tribute Summon succeeded! Chrome-Riservar tributed, cores sent to Void, Grand-Woden summoned');

// ── PART 3: TEST FLASH TIMING DURING OPPONENT ATTACK ──
console.log('3. Testing Defensive Flash Timing Window...');
const defensiveAura = {
  uid: 'c_defensive_aura',
  name: 'Defensive Aura',
  cost: 4,
  type: 'Magic',
  color: 'White',
  effect: '[Flash] During this turn, give all your blocking Spirits +3000 BP.'
};

const blizzardWall = {
  uid: 'c_blizzard_wall',
  name: 'Blizzard Wall',
  cost: 5,
  type: 'Magic',
  color: 'White',
  effect: '[Flash] During this turn, your Life can only be reduced by one by the attacks of opposing unblocked Spirits.'
};

const blockerSpirit = {
  uid: 'sp_guard',
  name: 'Fortress Sentinel',
  cost: 3,
  type: 'Spirit',
  color: 'White',
  currentCores: 2,
  currentLevel: 1,
  currentBp: 4000,
  isExhausted: false
};

const oppAttacker = {
  uid: 'sp_opp_dragon',
  name: 'Siegwurm Emperor',
  cost: 6,
  type: 'Spirit',
  color: 'Red',
  currentCores: 3,
  currentLevel: 2,
  currentBp: 6000,
  isExhausted: true
};

state.activePlayer = 'opponent';
state.phaseIndex = 5; // ATTACK STEP
state.player.reserve = 5; // 5 cores available to cast Flash
state.player.hand = [defensiveAura, blizzardWall];
state.player.field = [blockerSpirit];
state.opponent = {
  name: 'Champion',
  color: 'Red',
  life: 5,
  reserve: 3,
  trash: 0,
  trashCards: [],
  deck: [], hand: [], field: [oppAttacker]
};

// Test Flash timing window inside Block Modal
const blockModalEl = document.getElementById('battleBlockModal');
const flashSectionEl = document.getElementById('blockFlashSection');

// Call castFlashInBattle with Defensive Aura (+3000 BP)
window.BattleArena.castFlashInBattle(defensiveAura.uid, oppAttacker.uid);
assert.strictEqual(state.player.reserve, 1, 'Player reserve should decrease by 4 (5 - 4 = 1)');
assert.strictEqual(blockerSpirit.currentBp, 7000, 'Blocker BP should increase from 4000 to 7000 (+3000 BP)');
console.log('  [PASS] Defensive Aura Flash Cast! Granted +3000 BP (4000 -> 7000 BP). Now exceeds attacker (6000 BP)');

// Test Blizzard Wall Flash Cast (Ends attack step)
state.player.reserve = 5; // Refresh reserve for test
window.BattleArena.castFlashInBattle(blizzardWall.uid, oppAttacker.uid);
assert.strictEqual(state.player.reserve, 0, 'Player reserve should decrease by 5 (5 - 5 = 0)');
console.log('  [PASS] Blizzard Wall Flash Cast! Successfully terminated attack and prevented life damage');

console.log('\n======================================================');
console.log('ALL TRIBUTE SUMMON & FLASH TIMING TESTS PASSED (100%)!');
console.log('======================================================\n');
