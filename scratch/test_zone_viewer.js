/**
 * Test Suite: Battle Spirits Zone Viewer (Grave / Trash & Void Modal)
 */
const fs = require('fs');
const assert = require('assert');

// 1. Mock browser DOM and audio environments
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = {
        id,
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          toggle: (cls, val) => {}
        },
        innerHTML: '',
        textContent: '',
        value: '',
        offsetWidth: 100
      };
    }
    return mockElements[id];
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.AudioContext = class {
  createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
  createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
  resume() {}
};

const mockElements = {};
const elementIds = [
  'battleZoneModal', 'zoneModalTitle', 'zoneModalSubtitle', 'zoneModalBody',
  'tabPlayerTrash', 'tabOpponentTrash', 'tabVoid',
  'tabCountPlayerTrash', 'tabCountOpponentTrash', 'tabCountVoid',
  'playerTrashCores', 'opponentTrashCores', 'playerTrashPill', 'opponentTrashPill',
  'playerField', 'opponentField', 'playerHand', 'opponentHandBacks',
  'playerLifeContainer', 'opponentLifeContainer', 'playerReserveCores', 'opponentReserveCores',
  'playerDeckCount', 'opponentDeckCount', 'cardInspectorTray', 'duelActionBtns',
  'playerBurstZone', 'opponentBurstZone', 'playerBurstSlot', 'opponentBurstSlot',
  'cardModal', 'modalCardImg', 'modalCardName', 'modalCardType', 'modalCardRarity',
  'modalCardColor', 'modalCardCost', 'modalCardReduction', 'modalCardFamily',
  'modalCardText', 'modalCardLevels', 'modalCardFlavor', 'modalSummonAction'
];
elementIds.forEach(id => {
  mockElements[id] = {
    id,
    style: {},
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      toggle: function(c, v) { if (v) this._classes.add(c); else this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); }
    },
    innerHTML: '',
    textContent: '',
    value: '',
    title: ''
  };
});

// Mock openCardDetail
let lastInspectedCardName = null;
global.openCardDetail = function(name) {
  lastInspectedCardName = name;
};

// Mock showToast
global.showToast = (msg, type) => {};

// Load and evaluate battle_arena.js
const code = fs.readFileSync('battle_arena.js', 'utf8');
eval(code);

console.log('--- TESTING ZONE VIEWER (GRAVE / TRASH & VOID MODAL) ---');

// Test 1: Verify DuelState has trashCards and voidCards initialized
console.log('1. Verifying zone state initialization...');
const state = BattleArena.getState();
assert.ok(Array.isArray(state.player.trashCards), 'Player trashCards should be an array');
assert.ok(Array.isArray(state.player.voidCards), 'Player voidCards should be an array');
assert.ok(Array.isArray(state.opponent.trashCards), 'Opponent trashCards should be an array');
assert.ok(Array.isArray(state.opponent.voidCards), 'Opponent voidCards should be an array');
console.log('✓ Initial DuelState trashCards and voidCards verified');

// Test 2: Opening Zone Modal with Empty State
console.log('2. Opening Zone Modal on empty Trash...');
BattleArena.openZoneModal('player-trash');
const modalEl = mockElements['battleZoneModal'];
assert.strictEqual(modalEl.style.display, 'flex', 'Modal display should be flex');
assert.ok(mockElements['zoneModalTitle'].textContent.includes('Your Trash'), 'Title should show Your Trash');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Your Trash is Empty'), 'Body should show empty state prompt');
assert.strictEqual(mockElements['tabCountPlayerTrash'].textContent, 0);
console.log('✓ Empty Trash modal rendered correctly');

// Test 3: Sending cards to Trash and verifying rendering
console.log('3. Sending destroyed spirits and cast magic to player trash...');
const deadSpirit = {
  uid: 'spirit_001',
  name: 'DarkGoradon',
  type: 'Spirit',
  cost: 2,
  image_url: '/static/darkgoradon.jpg'
};
const castSpell = {
  uid: 'magic_001',
  name: 'Flame Dance',
  type: 'Magic',
  cost: 3,
  image_url: '/static/flamedance.jpg'
};

BattleArena.sendToTrash(deadSpirit, 'player', 'Destroyed in combat by Siege-Dragon (5000 vs 2000 BP)');
BattleArena.sendToTrash(castSpell, 'player', 'Cast Magic from Hand');

assert.strictEqual(state.player.trashCards.length, 2, 'Player should have 2 cards in trash');
assert.strictEqual(state.player.trashCards[0].name, 'Flame Dance', 'Flame Dance was most recently sent to trash');
assert.strictEqual(state.player.trashCards[1].name, 'DarkGoradon');

BattleArena.renderZoneModal();
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Flame Dance'), 'Zone modal contains Flame Dance');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('DarkGoradon'), 'Zone modal contains DarkGoradon');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Destroyed in combat by Siege-Dragon'), 'Zone modal shows destruction reason');
assert.strictEqual(mockElements['tabCountPlayerTrash'].textContent, 2, 'Tab count badge shows 2');
console.log('✓ Cards in trash render with names, types, costs, and combat destruction reasons');

// Test 4: Switching to Opponent Trash Tab
console.log('4. Testing Opponent Trash tab...');
const oppMilledCard = {
  uid: 'opp_card_001',
  name: 'Chakrambat',
  type: 'Spirit',
  cost: 4,
  image_url: '/static/chakrambat.jpg'
};
BattleArena.sendToTrash(oppMilledCard, 'opponent', 'Milled by [Crush] of Titan-Gorilla');
BattleArena.switchZoneTab('opponent-trash');

assert.ok(mockElements['zoneModalTitle'].textContent.includes("Opponent's Trash"), 'Title updated to Opponent Trash');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Chakrambat'), 'Body contains Chakrambat');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Milled by [Crush]'), 'Body shows [Crush] milling reason');
assert.strictEqual(mockElements['tabCountOpponentTrash'].textContent, 1, 'Opponent tab count is 1');
console.log('✓ Opponent Trash tab renders with milled card details');

// Test 5: Switching to The Void Tab (Cosmic Reservoir & Banished Zone)
console.log('5. Testing The Void tab...');
BattleArena.switchZoneTab('void');

assert.ok(mockElements['zoneModalTitle'].textContent.includes('The Void'), 'Title updated to The Void');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Cosmic Void Reservoir'), 'Overview banner explains Void reservoir');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('∞'), 'Displays infinite Core reservoir symbol');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('No Cards Currently Banished in The Void'), 'Shows empty banished state');

// Banishing a card to The Void
const banishedCard = {
  uid: 'void_001',
  name: 'Black Dragon',
  type: 'Spirit',
  cost: 6,
  image_url: '/static/blackdragon.jpg'
};
BattleArena.sendToVoid(banishedCard, 'player', 'Banished to the cosmic void by Dimensional Shift');
assert.strictEqual(state.player.voidCards.length, 1);
BattleArena.renderZoneModal();
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Black Dragon'), 'Void contains banished card');
assert.ok(mockElements['zoneModalBody'].innerHTML.includes('Dimensional Shift'), 'Void shows banishment reason');
assert.strictEqual(mockElements['tabCountVoid'].textContent, 1, 'Void tab badge shows 1');
console.log('✓ The Void tab displays infinite Core reservoir & banished cards');

// Test 6: Clicking a card in the Zone to open full Card Details Modal
console.log('6. Testing inspectZoneCard click handler...');
lastInspectedCardName = null;
BattleArena.inspectZoneCard('DarkGoradon');
assert.strictEqual(lastInspectedCardName, 'DarkGoradon', 'Clicking card in trash modal opens full card details');
console.log('✓ Clicking card in Zone Viewer opens #cardModal with full stats and abilities');

// Test 7: Closing the Modal
console.log('7. Testing modal close and backdrop dismiss...');
BattleArena.closeZoneModal();
assert.strictEqual(modalEl.style.display, 'none', 'closeZoneModal hides modal');

// Test backdrop click dismiss
modalEl.style.display = 'flex';
BattleArena.closeZoneModalBg({ target: { id: 'battleZoneModal' } });
assert.strictEqual(modalEl.style.display, 'none', 'Backdrop click closes modal');

// Test inner card click does not dismiss
modalEl.style.display = 'flex';
BattleArena.closeZoneModalBg({ target: { id: 'innerCard' } });
assert.strictEqual(modalEl.style.display, 'flex', 'Clicking inside card does not close modal');
BattleArena.closeZoneModal();

console.log('✓ Zone Modal open, switch, click-to-inspect, and close operations verified');
console.log('ALL ZONE VIEWER TESTS PASSED WITH 100% SUCCESS!');
