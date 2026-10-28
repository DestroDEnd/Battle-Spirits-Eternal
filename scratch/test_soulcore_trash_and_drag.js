const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 RUNNING TEST SUITE: SOUL CORE RESERVE, 0-CORE DEPLETION, TRASH/GRAVE SEPARATION & FIELD REORDERING\n');

// Mock DOM & Storage environment
global.window = global;
global._mockElements = {};
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => {
    if (!global._mockElements[id]) {
      global._mockElements[id] = {
        id,
        innerHTML: '',
        textContent: '',
        value: '',
        style: { display: 'none' },
        dataset: {},
        addEventListener: () => {},
        classList: {
          _classes: [],
          add: function(cls) { if (!this._classes.includes(cls)) this._classes.push(cls); },
          remove: function(cls) { this._classes = this._classes.filter(c => c !== cls); },
          contains: function(cls) { return this._classes.includes(cls); },
          toggle: function(cls, force) { if (force) this.add(cls); else this.remove(cls); }
        },
        appendChild: () => {},
        focus: () => {},
        select: () => {},
        scrollIntoView: () => {}
      };
    }
    return global._mockElements[id];
  }
};

global.showToast = (msg, type) => console.log(`   [Toast - ${type || 'info'}]: ${msg}`);
global.AudioFX = {
  summon: () => {},
  slash: () => {},
  coreChime: () => {},
  lifeDamage: () => {},
  shield: () => {},
  magic: () => {},
  destroy: () => {},
  burstIgnite: () => {},
  soulCoreIgnite: () => {}
};

// Evaluate battle_arena.js
const baCode = fs.readFileSync(path.join(__dirname, '..', 'battle_arena.js'), 'utf-8');
eval(baCode);

const BA = window.BattleArena;
assert(BA, "BattleArena must be initialized");

// Helper to reset duel state
function resetTestDuel() {
  DuelState.turn = 2;
  DuelState.phaseIndex = 4; // MAIN step
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.activePlayer = 'player';
  DuelState.inDuel = true;
  DuelState.combatEvent = null;
  DuelState.logs = [];

  DuelState.player = {
    deck: [],
    hand: [],
    field: [],
    nexus: [],
    nexusCards: [],
    trash: 0,
    trashCards: [],
    reserve: 4,
    life: 5,
    soulCoreLocation: 'reserve',
    soulCoreSpiritUid: null
  };

  DuelState.opponent = {
    deck: [],
    hand: [],
    field: [],
    nexus: [],
    nexusCards: [],
    trash: 0,
    trashCards: [],
    reserve: 5,
    life: 5,
    soulCoreLocation: 'reserve',
    soulCoreSpiritUid: null
  };
}

// =========================================================================
// TEST 1: getPlayerAvailableCores includes Soul Core in Reserve
// =========================================================================
console.log('Test 1: getPlayerAvailableCores identifies Soul Core in Reserve...');
resetTestDuel();
DuelState.player.reserve = 3;
DuelState.player.soulCoreLocation = 'reserve';
DuelState.player.field = [
  { uid: 's1', name: 'Field Spirit 1', currentCores: 2 }
];

let coresInfo = BA.getPlayerAvailableCores();
assert.strictEqual(coresInfo.regularReserve, 3, "regularReserve should be 3");
assert.strictEqual(coresInfo.hasSoulCoreInReserve, true, "hasSoulCoreInReserve should be true");
assert.strictEqual(coresInfo.reserve, 4, "Total reserve (regular + soul core) should be 4");
assert.strictEqual(coresInfo.fieldCores, 2, "Field cores should be 2");
assert.strictEqual(coresInfo.total, 6, "Total available cores should be 4 + 2 = 6");
console.log('  ✓ getPlayerAvailableCores correctly identifies Soul Core in Reserve!\n');

// =========================================================================
// TEST 2: Summoning spirit using Soul Core in Reserve without field sacrifice
// =========================================================================
console.log('Test 2: Summoning spirit using Soul Core in Reserve when regular reserve is 1 core short...');
resetTestDuel();
// Card costs 3. Needs 4 cores (3 cost + 1 to stay alive).
const testSpiritCard = {
  uid: 'beast-lord',
  name: 'Beast Lord',
  type: 'Spirit',
  cost: 3,
  levels: [
    { level: 1, cores: 1, bp: 4000 },
    { level: 2, cores: 3, bp: 7000 }
  ]
};
DuelState.player.hand = [testSpiritCard];
DuelState.player.reserve = 3; // Regular reserve is 3 (short by 1 for 4 total needed)
DuelState.player.soulCoreLocation = 'reserve'; // Soul Core in reserve provides the 4th core!

BA.summonCard('beast-lord');

assert.strictEqual(DuelState.player.field.length, 1, "Spirit should be summoned to field");
const summoned = DuelState.player.field[0];
assert.strictEqual(summoned.name, 'Beast Lord');
assert.strictEqual(summoned.hasSoulCore, true, "Summoned spirit should have received the Soul Core from Reserve");
assert.strictEqual(DuelState.player.soulCoreLocation, 'field', "Soul Core location should now be on field");
assert.strictEqual(DuelState.player.soulCoreSpiritUid, summoned.uid, "Soul Core spirit UID should match Beast Lord");
assert.strictEqual(DuelState.player.reserve, 0, "Regular reserve should be 0 (3 spent on cost)");
assert.strictEqual(DuelState.player.trash, 3, "3 cores sent to Trash for cost");
assert.strictEqual(DuelState.player.hand.length, 0, "Card removed from hand");
console.log('  ✓ Summoned directly using Soul Core from Reserve without sacrifice!\n');

// =========================================================================
// TEST 3: Transferring Soul Core from a 1-core spirit depletes that spirit to Trash
// =========================================================================
console.log('Test 3: Transferring Soul Core from a spirit with only 1 core (its Soul Core) depletes it to Trash...');
resetTestDuel();
const spiritA = {
  uid: 'solo-sc-spirit',
  name: 'Solo Soul Core Spirit',
  type: 'Spirit',
  currentCores: 1, // Only 1 core: the soul core itself!
  hasSoulCore: true,
  currentLevel: 1,
  currentBp: 2000,
  levels: [{ level: 1, cores: 1, bp: 2000 }]
};

const spiritB = {
  uid: 'receiver-spirit',
  name: 'Receiver Spirit',
  type: 'Spirit',
  currentCores: 2,
  hasSoulCore: false,
  currentLevel: 1,
  currentBp: 4000,
  levels: [{ level: 1, cores: 1, bp: 4000 }, { level: 2, cores: 3, bp: 7000 }]
};

DuelState.player.field = [spiritA, spiritB];
DuelState.player.soulCoreLocation = 'field';
DuelState.player.soulCoreSpiritUid = spiritA.uid;
DuelState.player.trashCards = [];

BA.placeSoulCoreOnSpirit('receiver-spirit');

// Spirit B should have received the Soul Core
assert.strictEqual(spiritB.hasSoulCore, true, "Receiver Spirit should now hold the Soul Core");
assert.strictEqual(spiritB.currentCores, 3, "Receiver Spirit should now have 3 cores");
assert.strictEqual(DuelState.player.soulCoreSpiritUid, 'receiver-spirit');

// Spirit A had 1 core, which was the Soul Core. Transferred away -> 0 cores left!
// A spirit with 0 cores CANNOT survive!
assert.strictEqual(DuelState.player.field.length, 1, "Spirit A must NOT survive on the field!");
assert.strictEqual(DuelState.player.field[0].uid, 'receiver-spirit');
assert.strictEqual(DuelState.player.trashCards.length, 1, "Spirit A must be depleted to Trash!");
assert.strictEqual(DuelState.player.trashCards[0].uid, 'solo-sc-spirit');
console.log('  ✓ Spirit with only 1 Soul Core correctly depleted to Trash when Soul Core transferred!\n');

// =========================================================================
// TEST 4: Removing Soul Core from a 1-core spirit back to Reserve depletes it to Trash
// =========================================================================
console.log('Test 4: Removing Soul Core from a spirit with only 1 core back to Reserve depletes it to Trash...');
resetTestDuel();
const spiritC = {
  uid: 'lone-sc-spirit',
  name: 'Lone SC Spirit',
  type: 'Spirit',
  currentCores: 1,
  hasSoulCore: true,
  currentLevel: 1,
  currentBp: 3000,
  levels: [{ level: 1, cores: 1, bp: 3000 }]
};

DuelState.player.field = [spiritC];
DuelState.player.soulCoreLocation = 'field';
DuelState.player.soulCoreSpiritUid = spiritC.uid;
DuelState.player.trashCards = [];

BA.removeSoulCoreFromSpirit('lone-sc-spirit');

assert.strictEqual(DuelState.player.soulCoreLocation, 'reserve', "Soul Core returned to Reserve");
assert.strictEqual(DuelState.player.soulCoreSpiritUid, null);
assert.strictEqual(DuelState.player.field.length, 0, "Spirit with 0 cores must NOT survive on field!");
assert.strictEqual(DuelState.player.trashCards.length, 1, "Spirit must be depleted to Trash!");
assert.strictEqual(DuelState.player.trashCards[0].uid, 'lone-sc-spirit');
console.log('  ✓ Removing Soul Core from 1-core spirit depleted it to Trash!\n');

// =========================================================================
// TEST 5: Separated Core Trash and Card Graveyard Displays
// =========================================================================
console.log('Test 5: Verifying separate Core Trash and Card Graveyard counters in renderDuelTable...');
resetTestDuel();
DuelState.player.trash = 7; // 7 Cores in Trash
DuelState.player.trashCards = [{ uid: 'tc1' }, { uid: 'tc2' }, { uid: 'tc3' }, { uid: 'tc4' }]; // 4 Cards in Grave
DuelState.opponent.trash = 3; // 3 Cores in Trash
DuelState.opponent.trashCards = [{ uid: 'oc1' }, { uid: 'oc2' }]; // 2 Cards in Grave

BA.renderDuelTable();

const pTrashEl = document.getElementById('playerTrashCores');
const pGraveEl = document.getElementById('playerGraveCount');
const oTrashEl = document.getElementById('opponentTrashCores');
const oGraveEl = document.getElementById('opponentGraveCount');

assert.strictEqual(Number(pTrashEl.textContent), 7, "Player Core Trash must show exactly 7 cores");
assert.strictEqual(Number(pGraveEl.textContent), 4, "Player Graveyard must show exactly 4 cards");
assert.strictEqual(Number(oTrashEl.textContent), 3, "Opponent Core Trash must show exactly 3 cores");
assert.strictEqual(Number(oGraveEl.textContent), 2, "Opponent Graveyard must show exactly 2 cards");
console.log('  ✓ Cores in Trash and Cards in Graveyard are completely separated!\n');

// =========================================================================
// TEST 6: Field Card Drag-and-Drop and Position Reordering
// =========================================================================
console.log('Test 6: Field Card Drag-and-Drop and Position Reordering...');
resetTestDuel();
const sp1 = { uid: 'sp-1', name: 'Alpha Dragon', currentCores: 2, levels: [{ level: 1, cores: 1, bp: 3000 }] };
const sp2 = { uid: 'sp-2', name: 'Beta Warrior', currentCores: 1, levels: [{ level: 1, cores: 1, bp: 2000 }] };
const sp3 = { uid: 'sp-3', name: 'Gamma Sorcerer', currentCores: 3, levels: [{ level: 1, cores: 1, bp: 5000 }] };
DuelState.player.field = [sp1, sp2, sp3];

// 6a. Move sp3 to sp1's slot via handleFieldDrop
BA.handleFieldDragStart({ dataTransfer: { setData: () => {}, effectAllowed: '' } }, 'sp-3');
BA.handleFieldDrop({ preventDefault: () => {}, dataTransfer: { getData: () => 'sp-3' } }, 'sp-1');

assert.strictEqual(DuelState.player.field[0].uid, 'sp-3', "Slot 0 should now be Gamma Sorcerer (sp-3)");
assert.strictEqual(DuelState.player.field[1].uid, 'sp-1', "Slot 1 should now be Alpha Dragon (sp-1)");
assert.strictEqual(DuelState.player.field[2].uid, 'sp-2', "Slot 2 should now be Beta Warrior (sp-2)");
console.log('  ✓ handleFieldDrop successfully reordered field spirits to custom positions!');

// 6b. Move sp2 left via moveFieldSpirit
BA.moveFieldSpirit('sp-2', -1);
assert.strictEqual(DuelState.player.field[1].uid, 'sp-2', "Beta Warrior (sp-2) moved left to slot 1");
assert.strictEqual(DuelState.player.field[2].uid, 'sp-1', "Alpha Dragon (sp-1) moved right to slot 2");
console.log('  ✓ moveFieldSpirit successfully nudged spirit position!');

console.log('\n🏆 ALL 6 SOUL CORE, DEPLETION, TRASH/GRAVE & REORDERING TESTS PASSED FLAWLESSLY!');
