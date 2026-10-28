const assert = require('assert');

console.log('🧪 RUNNING DECK QUICK-VIEW POPUP TEST SUITE...\n');

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
  }
}

// ── MOCK DOM ENVIRONMENT ──
const elements = {};
function createMockElement(id, tag = 'div') {
  if (!elements[id]) {
    elements[id] = {
      id,
      tagName: tag.toUpperCase(),
      style: {},
      textContent: '',
      innerHTML: '',
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      appendChild(child) {
        if (child.id) elements[child.id] = child;
      }
    };
  }
  return elements[id];
}

const mockBody = {
  appendChild: (child) => {
    if (child.id) elements[child.id] = child;
    const matchIds = (child.innerHTML || '').matchAll(/id="([^"]+)"/g);
    for (const m of matchIds) {
      createMockElement(m[1]);
    }
  }
};

global.document = {
  body: mockBody,
  getElementById: (id) => elements[id] || null,
  createElement: (tag) => {
    return {
      tagName: tag.toUpperCase(),
      style: {},
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      set innerHTML(html) {
        this._html = html;
        const matchIds = html.matchAll(/id="([^"]+)"/g);
        for (const m of matchIds) {
          createMockElement(m[1]);
        }
      },
      get innerHTML() { return this._html || ''; }
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.window = {
  location: { pathname: '/browse' },
  addEventListener: () => {}
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

const app = require('../app.js');
const S = app.S;
const DeckQuickView = app.DeckQuickView;
const addToDeck = app.addToDeck;
const removeFromDeck = app.removeFromDeck;
const deleteFromDeck = app.deleteFromDeck;

it('DeckQuickView is defined with all required methods', () => {
  assert.ok(DeckQuickView, 'DeckQuickView must be defined');
  assert.strictEqual(typeof DeckQuickView.init, 'function');
  assert.strictEqual(typeof DeckQuickView.injectDOM, 'function');
  assert.strictEqual(typeof DeckQuickView.toggle, 'function');
  assert.strictEqual(typeof DeckQuickView.update, 'function');
  assert.strictEqual(typeof DeckQuickView.renderCardList, 'function');
});

it('DeckQuickView.init() successfully injects widget into DOM', () => {
  DeckQuickView.init();
  assert.ok(elements['deckQuickWidgetWrap'], 'deckQuickWidgetWrap must be injected');
  assert.ok(elements['deckQuickTrigger'], 'deckQuickTrigger must be injected');
  assert.ok(elements['deckQuickFlyout'], 'deckQuickFlyout must be injected');
  assert.ok(elements['quickDeckCardList'], 'quickDeckCardList must be injected');
});

it('DeckQuickView.toggle() toggles flyout visibility', () => {
  assert.strictEqual(DeckQuickView.isOpen, false);
  DeckQuickView.toggle(true);
  assert.strictEqual(DeckQuickView.isOpen, true);
  assert.strictEqual(elements['deckQuickFlyout'].style.display, 'flex');

  DeckQuickView.toggle(false);
  assert.strictEqual(DeckQuickView.isOpen, false);
  assert.strictEqual(elements['deckQuickFlyout'].style.display, 'none');
});

it('Adding and removing cards updates quick view count and list', () => {
  // Clear any existing cards in S.deck
  S.deck = {};

  addToDeck('The MakaiDeity Desfermion');
  addToDeck('The MakaiDeity Desfermion');
  addToDeck('The SevenShogun Asmodios');

  assert.strictEqual(S.deck['The MakaiDeity Desfermion'], 2);
  assert.strictEqual(S.deck['The SevenShogun Asmodios'], 1);

  DeckQuickView.update();
  assert.strictEqual(elements['quickTriggerBadge'].textContent, 3);
  assert.strictEqual(elements['quickDeckFlyoutCount'].textContent, '3 / 40 cards');

  // Open and verify rendered items
  DeckQuickView.toggle(true);
  assert.ok(elements['quickDeckCardList'].innerHTML.includes('The MakaiDeity Desfermion'));
  assert.ok(elements['quickDeckCardList'].innerHTML.includes('2x'));
  assert.ok(elements['quickDeckCardList'].innerHTML.includes('The SevenShogun Asmodios'));
  assert.ok(elements['quickDeckCardList'].innerHTML.includes('1x'));
});

it('deleteFromDeck completely removes card copies and updates quick view', () => {
  deleteFromDeck('The MakaiDeity Desfermion');
  assert.strictEqual(S.deck['The MakaiDeity Desfermion'], undefined);
  assert.strictEqual(S.deck['The SevenShogun Asmodios'], 1);

  DeckQuickView.update();
  assert.strictEqual(elements['quickTriggerBadge'].textContent, 1);
  assert.strictEqual(elements['quickDeckFlyoutCount'].textContent, '1 / 40 cards');
  assert.strictEqual(elements['quickDeckCardList'].innerHTML.includes('The MakaiDeity Desfermion'), false);
  assert.ok(elements['quickDeckCardList'].innerHTML.includes('The SevenShogun Asmodios'));
});

console.log(`\n📊 RESULTS: ${passed} / ${total} tests passed.`);
if (passed === total) {
  console.log('🎉 ALL DECK QUICK-VIEW POPUP TESTS PASSED!\n');
} else {
  console.error(`⚠️ ${total - passed} test(s) failed.`);
  process.exit(1);
}
