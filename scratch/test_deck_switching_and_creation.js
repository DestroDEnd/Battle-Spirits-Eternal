const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// DOM Mock
class ElementMock {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c) => {
        if (this.classList._classes.has(c)) this.classList._classes.delete(c);
        else this.classList._classes.add(c);
      }
    };
    this.style = {};
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.children = [];
    this.attributes = {};
    this.disabled = false;
  }

  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    child.parentNode = null;
    return child;
  }
  remove() {
    if (this.parentNode && typeof this.parentNode.removeChild === 'function') {
      this.parentNode.removeChild(this);
    }
  }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
  addEventListener(event, handler) {}
}

const elementsById = {};
function getOrCreateElement(id, tag = 'div') {
  if (!elementsById[id]) {
    elementsById[id] = new ElementMock(tag, id);
  }
  return elementsById[id];
}

const documentMock = {
  getElementById: (id) => getOrCreateElement(id),
  createElement: (tag) => new ElementMock(tag),
  body: new ElementMock('body'),
  addEventListener: () => {},
  querySelectorAll: () => []
};

global.window = {
  location: { pathname: '/browse.html', search: '' },
  localStorage: localStorageMock,
  addEventListener: () => {},
  scrollTo: () => {}
};
global.document = documentMock;
global.localStorage = localStorageMock;
global.showToast = () => {};
global.confirm = () => true;

// Mock prompt for new deck creation and renaming
let promptReturnValue = 'My Brand New Deck';
global.prompt = () => promptReturnValue;

// Load app.js
const app = require('../app.js');
const {
  S,
  DeckManager,
  DeckQuickView,
  addToDeck,
  removeFromDeck,
  deleteFromDeck
} = app;

console.log('=== RUNNING DECK SWITCHING & CREATION UNIT TESTS ===');

// Test 1: DOM Elements Injected
console.log('Test 1: Verify Quick View DOM structure includes Deck Switcher & Creation Bar');
DeckQuickView.init();
const flyout = documentMock.getElementById('deckQuickFlyout');
assert(flyout, 'Flyout must exist in DOM');
const quickDeckSelect = documentMock.getElementById('quickDeckSelect');
assert(quickDeckSelect, '#quickDeckSelect must be injected');
const btnNewDeck = documentMock.getElementById('btnQuickNewDeck');
assert(btnNewDeck, '#btnQuickNewDeck must be injected');
console.log('  -> PASS: Switcher bar, select, and new deck button injected.');

// Test 2: Deck Selector Options populated with existing decks
console.log('Test 2: Verify deck selector lists all decks');
DeckQuickView.update();
assert(quickDeckSelect.innerHTML.includes('<option'), 'Dropdown must contain option tags for decks');
const decks = DeckManager.getDecks();
assert(decks.length >= 1, 'Should have at least 1 deck');
const initialActive = DeckManager.getActiveDeck();
assert.strictEqual(quickDeckSelect.value, initialActive.id, 'Dropdown value should match activeDeckId');
console.log(`  -> PASS: Dropdown populated with ${decks.length} deck(s). Active deck: "${initialActive.name}".`);

// Test 3: Create New Deck
console.log('Test 3: Create a new custom deck via DeckQuickView.createNewDeckPrompt()');
promptReturnValue = 'Shadow Abyss Deck';
DeckQuickView.createNewDeckPrompt();

const newActive = DeckManager.getActiveDeck();
assert.strictEqual(newActive.name, 'Shadow Abyss Deck', 'Active deck should now be Shadow Abyss Deck');
assert.deepStrictEqual(S.deck, {}, 'New deck should start empty with 0 cards');

const flyoutCount = documentMock.getElementById('quickDeckFlyoutCount');
assert.strictEqual(flyoutCount.textContent, '0 / 40 cards', 'Flyout count must show 0 / 40 cards');

const quickDeckName = documentMock.getElementById('quickDeckName');
assert.strictEqual(quickDeckName.textContent, 'Shadow Abyss Deck', 'Header must show new deck name');
assert.strictEqual(quickDeckSelect.value, newActive.id, 'Dropdown value must be selected to new deck ID');
console.log('  -> PASS: New deck created with 0 cards and set as active.');

// Test 4: Add Cards to the Newly Created Deck
console.log('Test 4: Add cards to the new deck and verify persistence');
addToDeck('Puppet Soldier');
addToDeck('Puppet Soldier');
addToDeck('Curse of Hades');

assert.strictEqual(S.deck['Puppet Soldier'], 2);
assert.strictEqual(S.deck['Curse of Hades'], 1);

const updatedNewDeck = DeckManager.getDeck(newActive.id);
assert.strictEqual(updatedNewDeck.cards['Puppet Soldier'], 2, 'Cards must persist in DeckManager for new deck');
assert.strictEqual(updatedNewDeck.cards['Curse of Hades'], 1);
console.log('  -> PASS: Cards added to new deck persist properly in DeckManager.');

// Test 5: Switch Back to Previous Deck
console.log('Test 5: Switch back to first deck via onDeckSelectChange()');
const firstDeck = decks[0];
DeckQuickView.onDeckSelectChange(firstDeck.id);

assert.strictEqual(DeckManager.getActiveDeckId(), firstDeck.id, 'Active deck should be firstDeck.id');
assert.strictEqual(quickDeckSelect.value, firstDeck.id, 'Dropdown selection should be firstDeck.id');
const firstDeckCount = Object.values(firstDeck.cards || {}).reduce((a, b) => a + b, 0);
const sCount = Object.values(S.deck).reduce((a, b) => a + b, 0);
assert.strictEqual(sCount, firstDeckCount, 'S.deck should now reflect first deck cards');

// Verify that Shadow Abyss Deck cards were not leaked into first deck
assert.strictEqual(S.deck['Puppet Soldier'] || 0, firstDeck.cards['Puppet Soldier'] || 0);
console.log('  -> PASS: Switched back to previous deck cleanly without cross-deck card pollution.');

// Test 6: Switch back to newly created deck
console.log('Test 6: Switch back to newly created deck and verify cards restored');
DeckQuickView.onDeckSelectChange(newActive.id);
assert.strictEqual(S.deck['Puppet Soldier'], 2, 'Should still have 2x Puppet Soldier');
assert.strictEqual(S.deck['Curse of Hades'], 1, 'Should still have 1x Curse of Hades');
console.log('  -> PASS: Switched back to new deck, all cards intact.');

// Test 7: Rename Deck
console.log('Test 7: Rename active deck');
promptReturnValue = 'Netherworld Dominance';
DeckQuickView.renameCurrentDeckPrompt();
assert.strictEqual(DeckManager.getActiveDeck().name, 'Netherworld Dominance', 'Deck should be renamed');
assert.strictEqual(quickDeckName.textContent, 'Netherworld Dominance', 'Header title updated');
console.log('  -> PASS: Deck renamed successfully.');

// Test 8: Delete Deck
console.log('Test 8: Delete deck');
const countBeforeDelete = DeckManager.getDecks().length;
DeckQuickView.deleteCurrentDeckPrompt();
const countAfterDelete = DeckManager.getDecks().length;
assert.strictEqual(countAfterDelete, countBeforeDelete - 1, 'Deck count should decrease by 1');
assert.notStrictEqual(DeckManager.getActiveDeckId(), newActive.id, 'Active deck should switch away from deleted deck');
console.log('  -> PASS: Deck deleted and switched to next active deck.');

console.log('\n=== ALL DECK SWITCHING & CREATION TESTS PASSED! ===');
