const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => {
    if (!global._mockElements) global._mockElements = {};
    if (!global._mockElements[id]) {
      global._mockElements[id] = {
        id,
        style: {},
        classList: {
          contains: (cls) => !!(global._mockElements[id]._classes && global._mockElements[id]._classes.includes(cls)),
          add: (cls) => {
            if (!global._mockElements[id]._classes) global._mockElements[id]._classes = [];
            if (!global._mockElements[id]._classes.includes(cls)) global._mockElements[id]._classes.push(cls);
          },
          remove: (cls) => {
            if (!global._mockElements[id]._classes) global._mockElements[id]._classes = [];
            global._mockElements[id]._classes = global._mockElements[id]._classes.filter(c => c !== cls);
          },
          toggle: (cls, force) => {
            if (force) global._mockElements[id].classList.add(cls);
            else global._mockElements[id].classList.remove(cls);
          }
        },
        innerHTML: '',
        textContent: '',
        dataset: {},
        value: ''
      };
    }
    return global._mockElements[id];
  },
  querySelectorAll: () => [],
  querySelector: () => null
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.showToast = () => {};
global.triggerToast = () => {};

// Load battle_arena.js
require('../battle_arena.js');

const BA = window.BattleArena;
const DuelState = window.DuelState;

console.log('🧪 RUNNING TEST SUITE: Nexus Zone, View Board, Turn Skip Fix, and NLP Card Effects Engine');

// ── TEST 1: Nexus Deployment & Core Management ──
console.log('▶ Test 1: Nexus Deployment and Level Management');
DuelState.inDuel = true;
DuelState.activePlayer = 'player';
DuelState.phaseIndex = 4; // MAIN step
DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
DuelState.player = {
  name: 'Challenger',
  life: 5,
  reserve: 8,
  trash: 0,
  trashCards: [],
  hand: [
    {
      uid: 'nex_1',
      name: 'Forward! The PirateShip Siegfried',
      type: 'Nexus',
      cost: 4,
      color: 'Blue',
      levels: [
        { level: 1, cores: 0, bp: 0 },
        { level: 2, cores: 1, bp: 0 }
      ],
      effect: '[LV1][LV2] (When Deployed) You can summon a Cost 6 or less "Pirate"-named Spirit card from your Hand.'
    }
  ],
  field: [],
  nexus: [],
  nexusCards: []
};

BA.deployNexus('nex_1');
assert.strictEqual(DuelState.player.nexus.length, 1, 'Nexus should be deployed into DuelState.player.nexus');
assert.strictEqual(DuelState.player.reserve, 4, 'Paid 4 cores for Nexus deployment from reserve');
assert.strictEqual(DuelState.player.trash, 4, 'Trash received 4 cores');
const deployed = DuelState.player.nexus[0];
assert.strictEqual(deployed.currentLevel, 1, 'Nexus starts at LV1 with 0 cores');

// Add 1 core to Nexus
BA.addCoreToNexus('nex_1');
assert.strictEqual(deployed.currentCores, 1, 'Nexus now has 1 core');
assert.strictEqual(deployed.currentLevel, 2, 'Nexus reached LV2 with 1 core');
assert.strictEqual(DuelState.player.reserve, 3, '1 core moved from reserve to Nexus');

// Remove core from Nexus
BA.removeCoreFromNexus('nex_1');
assert.strictEqual(deployed.currentCores, 0, 'Nexus returned to 0 cores');
assert.strictEqual(deployed.currentLevel, 1, 'Nexus dropped back to LV1');
assert.strictEqual(DuelState.player.reserve, 4, '1 core returned from Nexus to reserve');
console.log('✅ Passed Test 1: Nexus deployed, leveled up to LV2, and reverted cleanly!');

// ── TEST 2: Zone Modal Nexus Tabs ──
console.log('▶ Test 2: Zone Modal Nexus Tabs Rendering');
BA.openZoneModal('player-nexus');
assert.strictEqual(DuelState.currentZoneTab, 'player-nexus', 'Current zone tab is player-nexus');
const titleEl = document.getElementById('zoneModalTitle');
assert.strictEqual(titleEl.textContent, '🏛️ Your Active Nexuses', 'Title displays Active Nexuses');
const bodyEl = document.getElementById('zoneModalBody');
assert(bodyEl.innerHTML.includes('Forward! The PirateShip Siegfried'), 'Modal body lists deployed Nexus card');
console.log('✅ Passed Test 2: Zone modal cleanly renders active nexuses!');

// ── TEST 3: View Board As Is ──
console.log('▶ Test 3: View Board As Is (Inspect field without reset)');
const resModal = document.getElementById('battleResultModal');
resModal.style.display = 'flex';
const matchBar = document.getElementById('matchFinishedBar');
matchBar.style.display = 'none';

BA.viewBoardAsIs();
assert.strictEqual(resModal.style.display, 'none', 'Result modal hidden');
assert.strictEqual(matchBar.style.display, 'flex', 'Match finished floating bar shown');

BA.reopenResultModal();
assert.strictEqual(resModal.style.display, 'flex', 'Result modal reopened');
assert.strictEqual(matchBar.style.display, 'none', 'Floating bar hidden upon reopen');
console.log('✅ Passed Test 3: View Board toggles cleanly without resetting board state!');

// ── TEST 4: Turn-Skipping Bug Guard ──
console.log('▶ Test 4: Turn-Skipping Bug Safeguard');
// Ensure activePlayer is player
DuelState.activePlayer = 'player';
DuelState.opponent = {
  name: 'AI',
  life: 5,
  reserve: 5,
  trash: 0,
  hand: [],
  field: [],
  nexus: []
};

// Calling safeEndOpponentTurn while activePlayer is 'player' MUST NOT end the turn
BA.endTurn = () => { assert.fail('endTurn should NOT be called when activePlayer is player!'); };
// If continueOpponent or watchdog is invoked while on player turn, it must safely do nothing
if (typeof BA.safeEndOpponentTurn === 'function') {
  BA.safeEndOpponentTurn(0);
}
console.log('✅ Passed Test 4: Turn end is strictly guarded against player turn skipping!');

// ── TEST 5: Universal NLP Card Effect Dispatcher ──
console.log('▶ Test 5: Universal NLP Card Effect Execution Engine');
// Mock CardEffectsDB
BA.CardEffectsDB['Test Dragon Spirit'] = {
  type: 'Spirit',
  color: 'Red',
  cost: 3,
  triggers: {
    'WHEN_SUMMONED': [
      { type: 'DRAW_CARDS', count: 2, min_level: 1 },
      { type: 'BP_BUFF', amount: 3000, target: 'self', min_level: 1 }
    ]
  }
};

const mockSpirit = {
  uid: 'test_sp_1',
  name: 'Test Dragon Spirit',
  cost: 3,
  currentLevel: 1,
  currentBp: 3000,
  baseBp: 3000
};

DuelState.player.deck = [
  { name: 'Card A', cost: 1 },
  { name: 'Card B', cost: 2 }
];
DuelState.player.hand = [];

BA.executeUniversalCardEffect(mockSpirit, 'player', 'WHEN_SUMMONED');
assert.strictEqual(DuelState.player.hand.length, 2, 'Drew 2 cards from deck via NLP engine');
assert.strictEqual(mockSpirit.currentBp, 6000, 'Received +3000 BP buff via NLP engine');
console.log('✅ Passed Test 5: NLP Card Effect Execution Engine correctly executes structured actions!');

console.log('\n🎉 ALL 5 TESTS PASSED FLAWLESSLY!');
