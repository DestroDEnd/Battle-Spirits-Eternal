const fs = require('fs');

// Mock DOM
const domElements = {};
function createMockElement(id, tagName = 'div') {
  return {
    id,
    tagName,
    style: {},
    classList: {
      classes: new Set(),
      add(cls) { this.classes.add(cls); },
      remove(cls) { this.classes.delete(cls); },
      contains(cls) { return this.classes.has(cls); }
    },
    textContent: '',
    innerHTML: '',
    src: '',
    href: '',
    disabled: false,
    appendChild: () => {},
    removeChild: () => {},
    remove: () => {},
    addEventListener: () => {},
    querySelectorAll: () => []
  };
}

const ids = [
  'cardModal', 'modalTitle', 'modalJpName', 'modalArt', 'modalBadges',
  'modalLevels', 'modalEffect', 'modalFlavor', 'modalSets', 'modalDownload',
  'modalWikiLink', 'modalWikiLinkBottom', 'modalDuelSummonBtn', 'modalDeckBtn',
  'cardInspectorTray', 'playerHand', 'playerField', 'opponentField',
  'playerBurstZone', 'opponentBurstZone', 'playerBurstSlot', 'opponentBurstSlot',
  'duelTurnLabel', 'battleClashCenter',
  'playerReserveCores', 'playerTrashCores', 'playerDeckCount',
  'opponentReserveCores', 'opponentTrashCores', 'opponentDeckCount',
  'opponentHandBacks', 'opponentLifeContainer', 'playerLifeContainer',
  'battleSacrificeModal', 'sacrificeCardName', 'sacrificeCardCost',
  'sacrificeCoresNeeded', 'sacrificeCoresSelected', 'sacrificeSpiritsList',
  'btnConfirmSacrifice'
];

ids.forEach(id => { domElements[id] = createMockElement(id); });

global.document = {
  getElementById: (id) => domElements[id] || createMockElement(id),
  createElement: (tag) => createMockElement('el_' + Math.random(), tag),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.fetch = async () => ({ json: async () => ({}) });
global.window = {
  esc: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  addEventListener: () => {},
  localStorage: global.localStorage
};
global.esc = global.window.esc;
global.showToast = (msg, type) => { console.log(`[TOAST ${type || 'info'}]: ${msg}`); };
global.AudioFX = {
  init: () => {},
  playTone: () => {},
  buttonTick: () => {},
  coreChime: () => {},
  summon: () => {},
  slash: () => {},
  shield: () => {},
  lifeDamage: () => {},
  victory: () => {},
  defeat: () => {},
  step: () => {},
  burstIgnite: () => {},
  heavyImpact: () => {},
  directHit: () => {}
};
global.FALLBACK_CARD_ART = '/assets/card_back.png';
global.S = { currentCard: null };

// Load battle_arena.js
const arenaCode = fs.readFileSync('battle_arena.js', 'utf8');
eval(arenaCode);
global.DuelState = window.DuelState;
global.BattleArena = window.BattleArena;

// Load app.js
const appCode = fs.readFileSync('app.js', 'utf8');
eval(appCode);

console.log('--- TESTING BURST ZONE & ANTI-DUPLICATION ---');

// Setup mock state
DuelState.inDuel = true;
DuelState.activePlayer = 'player';
DuelState.phaseIndex = 4; // MAIN step
DuelState.player.reserve = 4;
DuelState.player.trash = 0;
DuelState.player.field = [];
DuelState.player.burst = null;
DuelState.player.deck = [
  { uid: 'd_1', name: 'Card One', cost: 1, type: 'Spirit', color: 'Red', levels: [{ level: 1, cores: 1, bp: 1000 }] },
  { uid: 'd_2', name: 'Card Two', cost: 2, type: 'Spirit', color: 'Red', levels: [{ level: 1, cores: 1, bp: 2000 }] }
];
DuelState.player.hand = [
  {
    uid: 'burst_spirit_1',
    name: 'Siegfried Dragon Burst',
    cost: 6,
    type: 'Spirit',
    color: 'Red',
    levels: [{ level: 1, cores: 1, bp: 5000 }],
    effect: '[Burst: After your Life is reduced] Summon this spirit for free.'
  },
  {
    uid: 'burst_magic_1',
    name: 'Burst Draw',
    cost: 4,
    type: 'Magic',
    color: 'Red',
    effect: '[Burst: After your Life is reduced] Draw two cards.'
  }
];

console.log('1. Verify initial empty Burst Zone...');
BattleArena.renderBurstZones();
const initialZoneHtml = domElements['playerBurstZone'].innerHTML;
if (!initialZoneHtml.includes('Empty (Set [Burst:] here)')) {
  throw new Error('Expected empty placeholder in playerBurstZone');
}
console.log('✓ Initial playerBurstZone is properly displayed as empty');

console.log('2. Testing setBurst for Spirit Burst...');
BattleArena.setBurst('burst_spirit_1');

if (DuelState.player.hand.length !== 1) throw new Error('Expected card to be spliced from hand');
if (!DuelState.player.burst || DuelState.player.burst.name !== 'Siegfried Dragon Burst') {
  throw new Error('Expected burst to be set');
}

const activeZoneHtml = domElements['playerBurstZone'].innerHTML;
if (!activeZoneHtml.includes('BURST READY')) throw new Error('playerBurstZone missing BURST READY');
if (!activeZoneHtml.includes('Siegfried Dragon Burst')) throw new Error('playerBurstZone missing card name');
if (!activeZoneHtml.includes('👁️ View')) throw new Error('playerBurstZone missing View button');
if (!activeZoneHtml.includes('⚡ Trigger')) throw new Error('playerBurstZone missing Trigger button');
console.log('✓ Burst Zone rendered with BURST READY, name, view and trigger buttons');

console.log('3. Testing inspectBurst...');
BattleArena.inspectBurst();
if (!DuelState.selectedPlayerCard || DuelState.selectedPlayerCard.name !== 'Siegfried Dragon Burst') {
  throw new Error('Expected inspected card to be Siegfried Dragon Burst');
}
BattleArena.renderCardInspector();
const inspHtml = domElements['cardInspectorTray'].innerHTML;
if (!inspHtml.includes('⚡ Trigger Burst Now')) {
  throw new Error('Expected "Trigger Burst Now" button in cardInspectorTray');
}
if (inspHtml.includes('⚡ Summon Spirit')) {
  throw new Error('Should NOT allow normal summon while set as burst (duplicate prevention)');
}
console.log('✓ Card inspector correctly displays "Trigger Burst Now" and prevents duplicate summon');

console.log('4. Testing activateBurst for Spirit (Anti-Duplication)...');
BattleArena.activateBurst('player');

if (DuelState.player.burst !== null) throw new Error('Burst slot must be null after activation');
if (DuelState.player.field.length !== 1) throw new Error('Spirit should be on field now');
if (DuelState.player.field[0].name !== 'Siegfried Dragon Burst') throw new Error('Wrong spirit on field');
if (DuelState.player.hand.length !== 1) throw new Error('Hand should still have 1 card');

// Verify calling activateBurst again does NOT create duplicate
BattleArena.activateBurst('player');
if (DuelState.player.field.length !== 1) throw new Error('Spirit duplicated on second activateBurst!');

console.log('✓ Spirit Burst activated, summoned to battle line, and burst zone cleared with zero duplicates');

console.log('5. Testing setBurst and activateBurst for Magic Burst (Burst Draw)...');
BattleArena.setBurst('burst_magic_1');
if (DuelState.player.hand.length !== 0) throw new Error('Magic card not spliced from hand');
if (!DuelState.player.burst || DuelState.player.burst.name !== 'Burst Draw') throw new Error('Magic burst not set');

BattleArena.activateBurst('player');
if (DuelState.player.burst !== null) throw new Error('Burst slot must be null after magic burst activation');
if (DuelState.player.hand.length !== 2) throw new Error('Burst Draw should have drawn 2 cards into hand');
if (DuelState.player.trash !== 1) throw new Error('Magic card must be moved to Trash count (1)');
if (DuelState.player.field.length !== 1) throw new Error('Field should still only have 1 spirit');

console.log('✓ Magic Burst Draw activated, drew 2 cards, incremented trash, with zero duplicates');

console.log('6. Verify Burst Zone is clean and empty again...');
BattleArena.renderBurstZones();
const finalZoneHtml = domElements['playerBurstZone'].innerHTML;
if (!finalZoneHtml.includes('Empty (Set [Burst:] here)')) {
  throw new Error('Expected empty placeholder after burst activation');
}
console.log('✓ Burst Zone safely reset to empty state');

console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
