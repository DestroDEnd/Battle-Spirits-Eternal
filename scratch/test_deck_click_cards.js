/**
 * Test Suite: Deck Builder Card Loading & Dropdown Selection Inspection
 * Verifies that clicking/selecting any deck in the Deck Builder immediately
 * loads and shows all cards inside it.
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
      add: function(c) { this.classes = this.classes || []; if (!this.classes.includes(c)) this.classes.push(c); },
      remove: function(c) { this.classes = (this.classes || []).filter(x => x !== c); },
      toggle: function(c, val) { if (val) this.add(c); else this.remove(c); }
    },
    style: {},
    appendChild: () => {},
    onchange: null,
    onclick: null
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
  showToast: () => {}
};

require('../app.js');
const DeckManager = window.DeckManager;

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

console.log('🧪 RUNNING DECK SELECTION & CARD VISIBILITY TEST SUITE...\n');

(async () => {
  // 1. Initial State: Red Standard Deck MUST have 40 cards
  const activeDeck = DeckManager.getActiveDeck();
  const redCards = activeDeck.cards;
  const redCount = Object.values(redCards).reduce((a, b) => a + b, 0);
  assert(activeDeck.name.includes("Hero Dragon"), 'Active deck is Hero Dragon (Standard Red)');
  assert(redCount === 40, `Active standard red deck has exactly 40 cards (got ${redCount})`);
  assert(Object.keys(redCards).length === 14, `Active standard red deck has 14 unique cards (got ${Object.keys(redCards).length})`);
  assert(redCards['Goradon'] === 3, 'Contains 3x Goradon');
  assert(redCards['The HeroDragon Lord-Dragon'] === 3, 'Contains 3x The HeroDragon Lord-Dragon');
  assert(redCards['The SengokuDragonEmperor Burning-Souldragon'] === 2, 'Contains 2x Burning-Souldragon');

  // 2. Simulate User having corrupted/empty localStorage from previous session
  console.log('\n--- Testing Auto-Repair of Empty Standard Decks in localStorage ---');
  const corruptedData = {
    activeDeckId: 'deck_std_red',
    battleDeckId: 'deck_std_red',
    decks: [
      {
        id: 'deck_std_red',
        name: "Hero Dragon's Blazing Soul (Standard Red)",
        color: 'Red',
        isStandard: true,
        standardKey: 'red',
        cards: {}, // empty!
        updatedAt: Date.now()
      },
      {
        id: 'deck_custom_grantz',
        name: 'Grantz',
        color: 'Red',
        isStandard: false,
        cards: {},
        updatedAt: Date.now()
      }
    ]
  };
  localStorage.setItem('bs_user_decks_v2', JSON.stringify(corruptedData));

  // Call getAllData() -> should repair deck_std_red!
  const repairedData = DeckManager.getAllData();
  const repairedRed = repairedData.decks.find(d => d.id === 'deck_std_red');
  const repairedCount = Object.values(repairedRed.cards || {}).reduce((a, b) => a + b, 0);
  assert(repairedCount === 40, `Empty deck_std_red in localStorage was auto-repaired to 40 cards (got ${repairedCount})`);

  // 3. Switching to Custom Empty Deck ("Grantz")
  console.log('\n--- Testing Deck Switching & Card Display ---');
  DeckManager.setActiveDeckId('deck_custom_grantz');
  const grantzDeck = DeckManager.getActiveDeck();
  assert(grantzDeck.name === 'Grantz', 'Active deck successfully switched to Grantz');
  const grantzCount = Object.values(grantzDeck.cards || {}).reduce((a, b) => a + b, 0);
  assert(grantzCount === 0, 'Grantz initially has 0 cards');

  // 4. Switching BACK to "Hero Dragon's Blazing Soul"
  DeckManager.setActiveDeckId('deck_std_red');
  const switchedRed = DeckManager.getActiveDeck();
  const switchedCount = Object.values(switchedRed.cards || {}).reduce((a, b) => a + b, 0);
  assert(switchedRed.name.includes("Hero Dragon"), 'Switched back to Hero Dragon');
  assert(switchedCount === 40, `Switched deck instantly provides all 40 cards (got ${switchedCount})`);

  // 5. Registering Green Standard Deck
  console.log('\n--- Testing Registering Green Standard Deck ---');
  const greenDeck = await DeckManager.registerStandardDeck('green');
  const greenCount = Object.values(greenDeck.cards || {}).reduce((a, b) => a + b, 0);
  assert(greenCount === 40, `Green standard deck registered with all 40 cards (got ${greenCount})`);
  assert(greenDeck.cards['The Duke Kingtaurus'] === 3, 'Contains 3x The Duke Kingtaurus');

  // 6. Test All 6 Standard Presets
  console.log('\n--- Verifying All 6 Canonical Presets ---');
  const colors = ['red', 'purple', 'green', 'white', 'yellow', 'blue'];
  for (const c of colors) {
    const preset = DeckManager.CANONICAL_STANDARD_DECKS[c];
    assert(preset !== undefined, `Preset for ${c} exists`);
    const cCount = Object.values(preset.cards).reduce((a, b) => a + b, 0);
    assert(cCount === 40, `Preset ${c} has exactly 40 cards`);
    assert(Object.keys(preset.cards).length === 14, `Preset ${c} has exactly 14 unique cards`);
  }

  console.log(`\n📊 RESULTS: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 ALL DECK CLICK & CARD VISIBILITY TESTS PASSED!');
  } else {
    process.exit(1);
  }
})();
