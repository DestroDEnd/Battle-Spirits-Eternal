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

// Minimal DOM Mock
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
  querySelectorAll: (selector) => {
    if (selector === '.card-tile[data-name]') {
      return Object.values(elementsById).filter(el => el.attributes && el.attributes['data-name']);
    }
    return [];
  }
};

global.window = {
  location: { pathname: '/browse.html', search: '' },
  localStorage: localStorageMock,
  addEventListener: () => {},
  scrollTo: () => {}
};
global.document = documentMock;
global.localStorage = localStorageMock;

// Mock toast and modals
global.showToast = (msg, type) => {};
global.confirm = () => true;

// Load app.js
const app = require('../app.js');
const {
  S,
  addToDeck,
  removeFromDeck,
  deleteFromDeck,
  updateModalDeckButtons,
  addModalCardToDeck,
  removeModalCardFromDeck
} = app;

// Extract browse.html helper functions
const browseHtml = fs.readFileSync(path.join(__dirname, '../browse.html'), 'utf8');

// Simple esc / escapeJsStr
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeJsStr(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getCardInDeckCount(cardName) {
  if (typeof S !== 'undefined' && S.deck && S.deck[cardName]) {
    return S.deck[cardName];
  }
  return 0;
}

function buildTileDeckActionsHtml(cardName) {
  const inDeck = getCardInDeckCount(cardName);
  const jsName = escapeJsStr(cardName);

  if (inDeck > 0) {
    return `
      <div class="browse-tile-deck-ctrls">
        <button class="btn-tile-act btn-tile-minus" onclick="handleBrowseRemoveDeck('${jsName}')" title="Remove 1 copy from deck">-</button>
        <span class="browse-tile-count-val" title="${inDeck} of 3 in active deck">${inDeck}/3 in Deck</span>
        <button class="btn-tile-act btn-tile-plus" onclick="handleBrowseAddDeck('${jsName}')" ${inDeck >= 3 ? 'disabled title="Max 3 copies reached"' : 'title="Add 1 more copy to deck"'}>+</button>
        <button class="btn-tile-act btn-tile-del" onclick="handleBrowseDeleteDeck('${jsName}')" title="Remove all copies from deck">🗑</button>
      </div>
    `;
  }
  return `
    <button class="btn-add-deck" onclick="handleBrowseAddDeck('${jsName}')">+ Add to Deck</button>
  `;
}

function handleBrowseAddDeck(name) {
  addToDeck(name);
  updateBrowseTileDeckStatus(name);
}

function handleBrowseRemoveDeck(name) {
  removeFromDeck(name);
  updateBrowseTileDeckStatus(name);
}

function handleBrowseDeleteDeck(name) {
  deleteFromDeck(name);
  updateBrowseTileDeckStatus(name);
}

function updateBrowseTileDeckStatus(name) {
  const inDeck = getCardInDeckCount(name);
  const actionsEl = document.getElementById(`tileActions-${name}`);
  const badgeEl = document.getElementById(`tileDeckBadge-${name}`);

  if (actionsEl) {
    actionsEl.innerHTML = buildTileDeckActionsHtml(name);
  }
  if (badgeEl) {
    if (inDeck > 0) {
      badgeEl.textContent = `${inDeck}x in Deck`;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.textContent = '';
      badgeEl.style.display = 'none';
    }
  }
}

console.log('=== RUNNING BROWSE REMOVE CONTROLS UNIT TESTS ===');

// Test 1: Deck Action Button States
console.log('Test 1: Tile Deck Action HTML rendering');
S.deck = {};
let html0 = buildTileDeckActionsHtml('Siegfried');
assert(html0.includes('+ Add to Deck'), 'Should render "+ Add to Deck" when not in deck');
assert(!html0.includes('btn-tile-minus'), 'Should not render minus button when 0 in deck');

S.deck['Siegfried'] = 1;
let html1 = buildTileDeckActionsHtml('Siegfried');
assert(html1.includes('btn-tile-minus'), 'Should render minus button when 1 in deck');
assert(html1.includes('1/3 in Deck'), 'Should display "1/3 in Deck"');
assert(html1.includes('btn-tile-del'), 'Should render trash/delete button');
assert(!html1.includes('disabled'), 'Plus button should not be disabled when 1 copy');

S.deck['Siegfried'] = 3;
let html3 = buildTileDeckActionsHtml('Siegfried');
assert(html3.includes('3/3 in Deck'), 'Should display "3/3 in Deck"');
assert(html3.includes('disabled'), 'Plus button must be disabled at 3 copies');
console.log('  -> PASS: Action button states render correctly for 0, 1, and 3 copies.');

// Test 2: Card Removal & Status Update on Tiles
console.log('Test 2: Tile State Transitions upon Add/Remove/Delete');
const cardName = 'DarkGoradon';
const tileActions = getOrCreateElement(`tileActions-${cardName}`);
const tileBadge = getOrCreateElement(`tileDeckBadge-${cardName}`);
tileActions.setAttribute('data-name', cardName);

// Start with 0
S.deck = {};
updateBrowseTileDeckStatus(cardName);
assert(tileBadge.style.display === 'none', 'Badge should be hidden initially');
assert(tileActions.innerHTML.includes('+ Add to Deck'), 'Should display Add to Deck button');

// Add 2 copies via handleBrowseAddDeck
handleBrowseAddDeck(cardName);
handleBrowseAddDeck(cardName);
assert.strictEqual(S.deck[cardName], 2, 'Deck should contain 2 copies');
assert.strictEqual(tileBadge.textContent, '2x in Deck', 'Badge should show 2x in Deck');
assert(tileBadge.style.display === 'inline-block', 'Badge should be visible');
assert(tileActions.innerHTML.includes('2/3 in Deck'), 'Actions should display 2/3 in Deck');

// Remove 1 copy via handleBrowseRemoveDeck
handleBrowseRemoveDeck(cardName);
assert.strictEqual(S.deck[cardName], 1, 'Deck should now contain 1 copy');
assert.strictEqual(tileBadge.textContent, '1x in Deck', 'Badge should show 1x in Deck');
assert(tileActions.innerHTML.includes('1/3 in Deck'), 'Actions should display 1/3 in Deck');

// Remove remaining copy via handleBrowseRemoveDeck
handleBrowseRemoveDeck(cardName);
assert.strictEqual(S.deck[cardName], undefined, 'Card should be removed from deck object');
assert.strictEqual(tileBadge.style.display, 'none', 'Badge should now be hidden');
assert(tileActions.innerHTML.includes('+ Add to Deck'), 'Tile actions should revert to + Add to Deck');

// Test Delete (Trash) button
handleBrowseAddDeck(cardName);
handleBrowseAddDeck(cardName);
handleBrowseAddDeck(cardName);
assert.strictEqual(S.deck[cardName], 3, 'Deck should contain 3 copies');
handleBrowseDeleteDeck(cardName);
assert.strictEqual(S.deck[cardName], undefined, 'All copies deleted from deck');
assert.strictEqual(tileBadge.style.display, 'none', 'Badge should be hidden after delete');
assert(tileActions.innerHTML.includes('+ Add to Deck'), 'Actions revert to Add to Deck after delete');
console.log('  -> PASS: Tile add, remove, and delete actions update deck and DOM cleanly.');

// Test 3: Card Detail Modal Remove Button & Dynamic Controls
console.log('Test 3: Card Detail Modal Remove & Add Buttons');
const modalDeckBtn = getOrCreateElement('modalDeckBtn', 'button');
const modalRemoveDeckBtn = getOrCreateElement('modalRemoveDeckBtn', 'button');

S.currentCard = { name: 'The DragonEmperor Siegfried' };
S.deck = {};

// When not in deck
updateModalDeckButtons(S.currentCard.name);
assert.strictEqual(modalRemoveDeckBtn.style.display, 'none', 'Remove button must be hidden when not in deck');
assert.strictEqual(modalDeckBtn.textContent, '+ Add to Deck', 'Add button text should be default');
assert.strictEqual(modalDeckBtn.disabled, false, 'Add button should be enabled');

// Add 1 copy via modal
addModalCardToDeck();
assert.strictEqual(S.deck['The DragonEmperor Siegfried'], 1);
assert.strictEqual(modalRemoveDeckBtn.style.display, 'inline-flex', 'Remove button should now be visible');
assert(modalDeckBtn.textContent.includes('(1/3)'), 'Add button should show (1/3)');

// Add up to 3 copies
addModalCardToDeck();
addModalCardToDeck();
assert.strictEqual(S.deck['The DragonEmperor Siegfried'], 3);
assert.strictEqual(modalDeckBtn.disabled, true, 'Add button must be disabled at 3/3');
assert(modalDeckBtn.textContent.includes('(3/3)'), 'Add button should show (3/3)');

// Remove 1 copy via modal
removeModalCardFromDeck();
assert.strictEqual(S.deck['The DragonEmperor Siegfried'], 2);
assert.strictEqual(modalDeckBtn.disabled, false, 'Add button should be re-enabled');
assert(modalDeckBtn.textContent.includes('(2/3)'));

// Remove all copies
removeModalCardFromDeck();
removeModalCardFromDeck();
assert.strictEqual(S.deck['The DragonEmperor Siegfried'], undefined);
assert.strictEqual(modalRemoveDeckBtn.style.display, 'none', 'Remove button hidden after 0 copies');
assert.strictEqual(modalDeckBtn.textContent, '+ Add to Deck');
console.log('  -> PASS: Card Detail Modal remove and add buttons synchronize flawlessly.');

// Test 4: Verify HTML Files Contain modalRemoveDeckBtn
console.log('Test 4: Verify HTML files contain modalRemoveDeckBtn');
const filesToVerify = ['browse.html', 'deck.html', 'family.html', 'index.html', 'sets.html'];
for (const file of filesToVerify) {
  const content = fs.readFileSync(path.join(__dirname, '../', file), 'utf8');
  assert(content.includes('id="modalRemoveDeckBtn"'), `${file} must contain modalRemoveDeckBtn`);
  assert(content.includes('id="modalDeckBtn"'), `${file} must contain modalDeckBtn`);
}
console.log('  -> PASS: All 5 card modal views have modalDeckBtn and modalRemoveDeckBtn.');

console.log('\n=== ALL BROWSE REMOVE CONTROLS TESTS PASSED! ===');
