const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 RUNNING CARD DETAIL MODAL NAVIGATION TEST SUITE...\n');

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

// ── 1. DOM HTML AUDIT ACROSS ALL HTML PAGES ──
console.log('--- 1. Testing Modal Navigation Elements in HTML Files ---');
const pages = ['index.html', 'browse.html', 'deck.html', 'family.html', 'sets.html'];

for (const page of pages) {
  const content = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');

  it(`${page} contains #modalPrevBtn floating left navigation arrow`, () => {
    assert.ok(content.includes('id="modalPrevBtn"'), `${page} must have #modalPrevBtn`);
    assert.ok(content.includes('navigateCardModal(-1)'), `${page} must call navigateCardModal(-1) on prev`);
  });

  it(`${page} contains #modalNextBtn floating right navigation arrow`, () => {
    assert.ok(content.includes('id="modalNextBtn"'), `${page} must have #modalNextBtn`);
    assert.ok(content.includes('navigateCardModal(1)'), `${page} must call navigateCardModal(1) on next`);
  });

  it(`${page} contains #modalNavCounter counter badge pill`, () => {
    assert.ok(content.includes('id="modalNavCounter"'), `${page} must have #modalNavCounter`);
  });

  it(`${page} contains #modalSubPrevBtn and #modalSubNextBtn in action bar`, () => {
    assert.ok(content.includes('id="modalSubPrevBtn"'), `${page} must have #modalSubPrevBtn`);
    assert.ok(content.includes('id="modalSubNextBtn"'), `${page} must have #modalSubNextBtn`);
  });
}

// ── 2. MODAL CARD NAVIGATOR ENGINE UNIT TESTS ──
console.log('\n--- 2. Testing ModalCardNavigator Core Mechanics ---');

// Setup mock window & document
let openedCards = [];
let elements = {};

function createMockElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      style: {},
      textContent: '',
      classList: {
        contains: (cls) => cls === 'open',
        add: () => {},
        remove: () => {}
      }
    };
  }
  return elements[id];
}

global.document = {
  getElementById: (id) => createMockElement(id),
  querySelectorAll: (selector) => {
    if (selector.includes('.card-tile')) {
      return [
        { getAttribute: () => 'The MakaiBraveShine Deathdoll' },
        { getAttribute: () => 'DarkGoradon' },
        { getAttribute: () => 'Lizardedge' },
        { getAttribute: () => 'Rokceratops' }
      ];
    }
    return [];
  },
  addEventListener: () => {}
};

global.window = {
  location: { pathname: '/browse' },
  addEventListener: () => {}
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Mock fetch for openCardDetail
global.fetch = async (url) => {
  return {
    json: async () => ({
      name: 'Card Mock',
      cost: 1,
      color: 'Red',
      type: 'Spirit'
    })
  };
};

const app = require('../app.js');
const ModalCardNavigator = app.ModalCardNavigator;
const navigateCardModal = app.navigateCardModal;

assert.ok(ModalCardNavigator, 'ModalCardNavigator must be exported in app.js');

it('ModalCardNavigator initializes and sets card list with correct index', () => {
  const cardList = ['Card Alpha', 'Card Beta', 'Card Gamma', 'Card Delta'];
  ModalCardNavigator.setList(cardList, 'Card Beta');

  assert.strictEqual(ModalCardNavigator.currentList.length, 4);
  assert.strictEqual(ModalCardNavigator.currentIndex, 1);
  assert.strictEqual(ModalCardNavigator.currentCardName, 'Card Beta');
  assert.strictEqual(elements['modalNavCounter'].textContent, 'Card 2 of 4');
  assert.strictEqual(elements['modalPrevBtn'].style.display, 'flex');
  assert.strictEqual(elements['modalNextBtn'].style.display, 'flex');
});

it('ModalCardNavigator handles case-insensitive name matching', () => {
  const cardList = ['Goradon', 'Rokceratops', 'DarkGoradon'];
  ModalCardNavigator.setList(cardList, 'darkgoradon');

  assert.strictEqual(ModalCardNavigator.currentIndex, 2);
  assert.strictEqual(elements['modalNavCounter'].textContent, 'Card 3 of 3');
});

it('ModalCardNavigator navigate(1) advances to next card and wraps around circularly', () => {
  const cardList = ['Card A', 'Card B', 'Card C'];
  ModalCardNavigator.setList(cardList, 'Card B');
  assert.strictEqual(ModalCardNavigator.currentIndex, 1);

  // Navigate forward to Card C
  ModalCardNavigator.navigate(1);
  assert.strictEqual(ModalCardNavigator.currentIndex, 2);
  assert.strictEqual(ModalCardNavigator.currentList[ModalCardNavigator.currentIndex], 'Card C');

  // Navigate forward past end wraps around to Card A
  ModalCardNavigator.navigate(1);
  assert.strictEqual(ModalCardNavigator.currentIndex, 0);
  assert.strictEqual(ModalCardNavigator.currentList[ModalCardNavigator.currentIndex], 'Card A');
});

it('ModalCardNavigator navigate(-1) moves to previous card and wraps around backwards', () => {
  const cardList = ['Card A', 'Card B', 'Card C'];
  ModalCardNavigator.setList(cardList, 'Card A');
  assert.strictEqual(ModalCardNavigator.currentIndex, 0);

  // Navigate backward wraps to Card C
  ModalCardNavigator.navigate(-1);
  assert.strictEqual(ModalCardNavigator.currentIndex, 2);
  assert.strictEqual(ModalCardNavigator.currentList[ModalCardNavigator.currentIndex], 'Card C');

  // Navigate backward again to Card B
  ModalCardNavigator.navigate(-1);
  assert.strictEqual(ModalCardNavigator.currentIndex, 1);
  assert.strictEqual(ModalCardNavigator.currentList[ModalCardNavigator.currentIndex], 'Card B');
});

it('ModalCardNavigator auto-discovers card tiles from page if no explicit list is passed', () => {
  // discoverPageCardList returns mock tiles: Deathdoll, DarkGoradon, Lizardedge, Rokceratops
  ModalCardNavigator.setList(null, 'DarkGoradon');
  assert.strictEqual(ModalCardNavigator.currentList.length, 4);
  assert.strictEqual(ModalCardNavigator.currentIndex, 1);
  assert.strictEqual(ModalCardNavigator.currentList[1], 'DarkGoradon');
  assert.strictEqual(elements['modalNavCounter'].textContent, 'Card 2 of 4');
});

it('ModalCardNavigator hides navigation buttons when list has only 1 card', () => {
  ModalCardNavigator.setList(['Solo Card'], 'Solo Card');
  assert.strictEqual(elements['modalPrevBtn'].style.display, 'none');
  assert.strictEqual(elements['modalNextBtn'].style.display, 'none');
  assert.strictEqual(elements['modalNavCounter'].style.display, 'none');
});

console.log(`\n📊 RESULTS: ${passed} / ${total} tests passed.`);
if (passed === total) {
  console.log('🎉 ALL CARD DETAIL MODAL NAVIGATION TESTS PASSED!\n');
} else {
  console.error(`⚠️ ${total - passed} test(s) failed.`);
  process.exit(1);
}
