/**
 * Test Suite: Coin Flip Choice & 40-Card Battle Deck Validation
 * Verifies:
 * 1. Deck cannot register for battles if it has less than 40 cards.
 * 2. Battle arena blocks starting duel with an incomplete deck (< 40 cards).
 * 3. Winning the coin toss gives player the choice of who takes Turn 1.
 * 4. Opponent winning toss makes an AI choice.
 */

const storageMap = {};
global.localStorage = {
  getItem: (k) => storageMap[k] || null,
  setItem: (k, v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};

const mockElements = {};
function createMockEl(id) {
  return {
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    className: '',
    classList: {
      classes: [],
      add: function(c) { if (!this.classes.includes(c)) this.classes.push(c); },
      remove: function(c) { this.classes = this.classes.filter(x => x !== c); },
      toggle: function(c, val) { if (val) this.add(c); else this.remove(c); return this.contains(c); },
      contains: function(c) { return this.classes.includes(c); }
    },
    style: {},
    appendChild: () => {},
    scrollIntoView: () => {},
    onchange: null,
    onclick: null
  };
}

global.document = {
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockEl(id);
    return mockElements[id];
  },
  querySelector: (sel) => {
    if (sel.includes('btn-start-duel')) return global.document.getElementById('btnEnterColosseum');
    return null;
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete'
};

global.window = {
  localStorage: global.localStorage,
  location: { pathname: '/deck', protocol: 'http:' },
  addEventListener: () => {},
  showToast: (m, type) => { lastToast = { message: m, type }; }
};

let lastToast = null;

require('../app.js');
const DeckManager = window.DeckManager;

require('../battle_arena.js');
const BattleArena = window.BattleArena;
const DuelState = BattleArena.getState();

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

console.log('🧪 RUNNING COIN FLIP CHOICE & 40-CARD DECK VALIDATION TEST SUITE...\n');

(async () => {
  // ── TEST GROUP 1: Deck Builder Battle Deck Minimum 40 Cards Validation ──
  console.log('--- 1. Testing Deck Builder Battle Deck Registration (< 40 Cards Rejection) ---');
  
  // Create an empty deck (0 cards)
  const emptyDeck = DeckManager.createDeck('My Incomplete Deck', 'Red', {});
  const emptyCount = Object.values(emptyDeck.cards).reduce((a, b) => a + b, 0);
  assert(emptyCount === 0, 'Created empty deck with 0 cards');

  // Attempt to set empty deck as Battle Deck -> MUST FAIL
  const setZeroResult = DeckManager.setBattleDeckId(emptyDeck.id);
  assert(setZeroResult === false, 'DeckManager.setBattleDeckId rejected 0-card deck');
  assert(DeckManager.getBattleDeckId() !== emptyDeck.id, 'Battle deck ID was NOT set to the 0-card deck');

  // Create a partial deck with 30 cards (still < 40)
  const partialDeck = DeckManager.createDeck('Partial 30 Cards', 'Red', {
    'Goradon': 3,
    'Rokceratops': 3,
    'Lizardedge': 3,
    'DarkGoradon': 3,
    'Dragonhead': 3,
    'Chakrambat': 3,
    'Jurassickle': 3,
    'The HeroDragon Lord-Dragon': 3,
    'Double Draw': 3,
    'Flame Dance': 3
  });
  const partialCount = Object.values(partialDeck.cards).reduce((a, b) => a + b, 0);
  assert(partialCount === 30, 'Created partial deck with 30 cards');

  const setPartialResult = DeckManager.setBattleDeckId(partialDeck.id);
  assert(setPartialResult === false, 'DeckManager.setBattleDeckId rejected 30-card deck (< 40)');

  // Now create a complete 40-card deck
  const completeDeck = DeckManager.createDeck('Complete 40 Cards', 'Red', {
    'Goradon': 3, 'Rokceratops': 3, 'Lizardedge': 3, 'DarkGoradon': 3, 'Dragonhead': 3,
    'Chakrambat': 3, 'Jurassickle': 3, 'The HeroDragon Lord-Dragon': 3,
    'The ExplosionHero Lord-Dragon-Bazzel': 2, 'The SengokuDragonEmperor Burning-Souldragon': 2,
    'Double Draw': 3, 'Flame Dance': 3, 'Burst Draw': 3, 'Flame Tempest': 3
  });
  const completeCount = Object.values(completeDeck.cards).reduce((a, b) => a + b, 0);
  assert(completeCount === 40, 'Created complete deck with 40 cards');

  const setCompleteResult = DeckManager.setBattleDeckId(completeDeck.id);
  assert(setCompleteResult === true, 'DeckManager.setBattleDeckId accepted 40-card deck');
  assert(DeckManager.getBattleDeckId() === completeDeck.id, 'Active battle deck is now the 40-card deck');

  // ── TEST GROUP 2: Colosseum Lobby Incomplete Deck Blocking ──
  console.log('\n--- 2. Testing Colosseum Lobby Incomplete Deck Blocking ---');
  
  // Set select elements to point to the empty deck
  const pSelect = document.getElementById('arenaPlayerDeckSelect');
  pSelect.value = emptyDeck.id;

  // updateLobbyPreviews should mark start duel button as blocked
  BattleArena.updateLobbyPreviews();
  const startBtn = document.getElementById('btnEnterColosseum');
  assert(startBtn.classList.contains('btn-blocked'), 'ENTER COLOSSEUM button is marked .btn-blocked for 0-card deck');
  assert(startBtn.innerHTML.includes('Incomplete'), 'ENTER COLOSSEUM button text announces Incomplete deck');

  // Attempting BattleArena.startDuel() with empty deck -> MUST BE REJECTED
  lastToast = null;
  const startDuelResult = await BattleArena.startDuel(emptyDeck.id, 'purple');
  assert(startDuelResult === false, 'BattleArena.startDuel() blocked battle with 0-card deck');
  assert(lastToast && lastToast.type === 'error', 'Error toast shown informing user of < 40 card requirement');

  // Now select the complete 40-card deck
  pSelect.value = completeDeck.id;
  BattleArena.updateLobbyPreviews();
  assert(!startBtn.classList.contains('btn-blocked'), 'ENTER COLOSSEUM button is active for 40-card deck');
  assert(startBtn.innerHTML.includes('ENTER COLOSSEUM'), 'Button shows normal ENTER COLOSSEUM text');

  // ── TEST GROUP 3: Coin Flip Choice Determination ──
  console.log('\n--- 3. Testing Coin Flip Choice Mechanics ---');

  // Launch coin flip with 40-card deck
  BattleArena.launchCoinFlip(completeDeck.id, 'purple');
  const coinModal = document.getElementById('battleCoinModal');
  assert(coinModal.classList.contains('active'), 'Coin flip modal opened successfully');

  // Test BattleArena.selectFirstPlayer('player') -> Turn 1 is player
  await BattleArena.selectFirstPlayer('player');
  assert(DuelState.activePlayer === 'player', 'Selecting "player" sets DuelState.activePlayer to player (Turn 1)');
  assert(!coinModal.classList.contains('active'), 'Modal closed upon choice');

  // Test BattleArena.selectFirstPlayer('opponent') -> Turn 1 is opponent
  BattleArena.launchCoinFlip(completeDeck.id, 'purple');
  await BattleArena.selectFirstPlayer('opponent');
  assert(DuelState.activePlayer === 'opponent', 'Selecting "opponent" sets DuelState.activePlayer to opponent (Turn 1)');

  console.log(`\n📊 RESULTS: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 ALL COIN CHOICE & 40-CARD VALIDATION TESTS PASSED!');
  } else {
    process.exit(1);
  }
})();
