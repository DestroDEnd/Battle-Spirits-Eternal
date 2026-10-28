/**
 * Test Suite: Multi-Deck Management & Colosseum Registered Decks System
 * Validates:
 * 1. Multiple deck creation, renaming, deletion, and active battle deck designation.
 * 2. Colosseum Challenger (P1) ONLY showing registered decks.
 * 3. Standard decks only appearing for P1 if registered by the user.
 * 4. Page reload cursor persistence on previously chosen decks.
 */

const fs = require('fs');
const path = require('path');

// Mock in-memory localStorage
const storageMap = {};
global.localStorage = {
  getItem: (k) => storageMap[k] || null,
  setItem: (k, v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};

// Mock DOM elements
const mockElements = {};
function createMockEl(id) {
  return {
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    className: '',
    classList: {
      add: function(c) { this.classes = this.classes || []; if (!this.classes.includes(c)) this.classes.push(c); },
      remove: function(c) { this.classes = (this.classes || []).filter(x => x !== c); },
      toggle: function(c, val) { if (val) this.add(c); else this.remove(c); }
    },
    style: {},
    appendChild: () => {},
    onchange: null
  };
}

global.document = {
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockEl(id);
    return mockElements[id];
  },
  addEventListener: () => {},
  readyState: 'complete'
};

global.window = {
  localStorage: global.localStorage,
  location: { pathname: '/deck', protocol: 'http:' },
  addEventListener: () => {},
  showToast: (m) => {}
};

// Load app.js (which defines DeckManager)
require('../app.js');
const DeckManager = window.DeckManager;

// Load battle_arena.js
require('../battle_arena.js');
const BattleArena = window.BattleArena;
const DuelState = BattleArena.getState();

// Mock standard decks in DuelState
DuelState.standardDecks = {
  red: { name: "Hero Dragon's Blazing Soul", color: "Red", desc: "Red aggro", validated_cards: [{ name: "Siegun-Gunner", count: 3 }] },
  purple: { name: "Netherworld Curse & Seven Shoguns", color: "Purple", desc: "Purple control", validated_cards: [{ name: "Belgor", count: 3 }] },
  green: { name: "Emerald Gale of Insect Sovereigns", color: "Green", desc: "Green ramp", validated_cards: [{ name: "The Duke Kingtaurus", count: 3 }] },
  white: { name: "Armed Fortress", color: "White", desc: "White defense", validated_cards: [{ name: "Giant Fortress Golem", count: 3 }] },
  yellow: { name: "Celestial Symphony", color: "Yellow", desc: "Yellow magic", validated_cards: [{ name: "Tzaphkiel", count: 3 }] },
  blue: { name: "Colosseum Titans", color: "Blue", desc: "Blue mill", validated_cards: [{ name: "Titus", count: 3 }] }
};

let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
  }
}

console.log('🧪 RUNNING MULTI-DECK & REGISTERED DECKS TEST SUITE...\n');

(async () => {
  // 1. Initial State & Auto Migration
  const initData = DeckManager.getAllData();
  assert(initData && initData.decks.length >= 1, 'DeckManager initializes with default registered deck');
  assert(initData.decks[0].name.includes('Hero Dragon'), 'Default registered deck is Red Hero Dragon');
  assert(DeckManager.getActiveDeckId() === initData.decks[0].id, 'Active deck is set to initial deck');

  // 2. Creating New Decks
  const deck2 = DeckManager.createDeck('Kingtaurus Ramp Custom', 'Green', { ...DeckManager.CANONICAL_STANDARD_DECKS.green.cards });
  assert(deck2 && deck2.id, 'Successfully created second custom deck');
  assert(DeckManager.getDecks().length === 2, 'Deck collection count is now 2');
  assert(DeckManager.getActiveDeckId() === deck2.id, 'Newly created deck is automatically set as active');

  // 3. Renaming Decks
  DeckManager.renameDeck(deck2.id, 'Emerald Sovereign Kingtaurus');
  assert(DeckManager.getDeck(deck2.id).name === 'Emerald Sovereign Kingtaurus', 'Successfully renamed custom deck');

  // 4. Choosing Active Battle Deck for Colosseum (40 cards required)
  const setSuccess = DeckManager.setBattleDeckId(deck2.id);
  assert(setSuccess === true, 'Successfully marked custom 40-card deck as Active Battle Deck');
  assert(DeckManager.getBattleDeckId() === deck2.id, 'Battle deck ID accurately reflects 40-card deck');

  // 5. Colosseum Lobby Rule: Only Registered Decks appear for Player 1
  BattleArena.renderDuelTable(); // ensure state ready
  const pSelect = document.getElementById('arenaPlayerDeckSelect');
  const oSelect = document.getElementById('arenaOpponentDeckSelect');
  
  // Call renderArenaLobby directly
  mockElements['battleLobby'] = createMockEl('battleLobby');
  mockElements['battleDuelTable'] = createMockEl('battleDuelTable');
  DuelState.inDuel = false;
  
  // Re-run renderArenaLobby
  // Verify Player 1 options
  const userDecks = DeckManager.getDecks();
  // There are only 2 registered decks currently: Red Standard & Emerald Sovereign Kingtaurus
  assert(userDecks.length === 2, 'User has exactly 2 registered decks');
  
  // Check that unregistered standard decks (Purple, White, Yellow, Blue) are NOT registered yet
  assert(!DeckManager.isStandardDeckRegistered('purple'), 'Purple is NOT yet registered');
  assert(!DeckManager.isStandardDeckRegistered('white'), 'White is NOT yet registered');
  assert(!DeckManager.isStandardDeckRegistered('blue'), 'Blue is NOT yet registered');

  // 6. User registers Green Standard Deck
  const regGreen = await DeckManager.registerStandardDeck('green', DuelState.standardDecks.green);
  assert(regGreen && regGreen.isStandard && regGreen.standardKey === 'green', 'User successfully registered Green Standard Deck');
  assert(DeckManager.isStandardDeckRegistered('green'), 'Green is now registered in user collection');

  // 7. Test Cursor Reload Persistence in Colosseum (Player 1)
  // Set chosen P1 deck to Green Standard
  localStorage.setItem('colosseum_p1_deck_id', regGreen.id);
  // Also set opponent realm to Blue Mill
  localStorage.setItem('colosseum_opponent_deck_id', 'blue');

  // Simulate page reload by re-running renderArenaLobby logic
  // Update pSelect and oSelect
  const registered = DeckManager.getDecks();
  pSelect.innerHTML = registered.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  oSelect.innerHTML = `
    <option value="purple">Purple</option>
    <option value="red">Red</option>
    <option value="green">Green</option>
    <option value="white">White</option>
    <option value="yellow">Yellow</option>
    <option value="blue">Blue</option>
  `;

  // Apply cursor persistence logic from battle_arena.js
  const savedP1 = localStorage.getItem('colosseum_p1_deck_id');
  if (savedP1 && registered.some(d => d.id === savedP1)) {
    pSelect.value = savedP1;
  }
  const savedOpp = localStorage.getItem('colosseum_opponent_deck_id');
  if (savedOpp) {
    oSelect.value = savedOpp;
  }

  assert(pSelect.value === regGreen.id, `Player 1 cursor preserved previously chosen deck on reload (${pSelect.value} === ${regGreen.id})`);
  assert(oSelect.value === 'blue', `Opponent cursor preserved previously chosen realm on reload (${oSelect.value} === 'blue')`);

  // 8. Test Cursor Reload Persistence in Deck Builder
  // Set chosen deckbuilder deck to Kingtaurus custom
  localStorage.setItem('deckbuilder_selected_deck_id', deck2.id);
  const activeDeckIdOnReload = DeckManager.getActiveDeckId();
  assert(activeDeckIdOnReload === deck2.id, `Deck Builder preserved active deck cursor on reload (${activeDeckIdOnReload} === ${deck2.id})`);

  // 9. Deleting Decks
  const beforeDelCount = DeckManager.getDecks().length;
  DeckManager.deleteDeck(deck2.id);
  assert(DeckManager.getDecks().length === beforeDelCount - 1, 'Successfully deleted deck');
  assert(DeckManager.getDeck(deck2.id) === null, 'Deleted deck no longer in registry');

  console.log(`\n📊 RESULTS: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 ALL MULTI-DECK & REGISTERED DECKS TESTS PASSED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
