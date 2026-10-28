// Test Card Details Feature in Battle Arena and Card Modal
const fs = require('fs');

// Create mock DOM environment
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
    addEventListener: () => {},
    querySelectorAll: () => []
  };
}

const elementIds = [
  'cardModal', 'modalTitle', 'modalJpName', 'modalArt', 'modalBadges',
  'modalLevels', 'modalEffect', 'modalFlavor', 'modalSets', 'modalDownload',
  'modalWikiLink', 'modalWikiLinkBottom', 'modalDuelSummonBtn', 'modalDeckBtn',
  'cardInspectorTray', 'playerHand', 'playerField', 'opponentField',
  'playerBurstSlot', 'opponentBurstSlot', 'duelTurnLabel', 'battleClashCenter',
  'playerReserveCores', 'playerTrashCores', 'playerDeckCount',
  'opponentReserveCores', 'opponentTrashCores', 'opponentDeckCount',
  'opponentHandBacks', 'opponentLifeContainer', 'playerLifeContainer',
  'battleSacrificeModal', 'sacrificeCardName', 'sacrificeCardCost',
  'sacrificeCoresNeeded', 'sacrificeCoresSelected', 'sacrificeSpiritsList',
  'btnConfirmSacrifice'
];

elementIds.forEach(id => {
  domElements[id] = createMockElement(id);
});

global.document = {
  getElementById: (id) => domElements[id] || createMockElement(id),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.fetch = async () => ({
  json: async () => ({})
});

global.window = {
  esc: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  addEventListener: () => {},
  localStorage: global.localStorage
};
global.esc = global.window.esc;
global.showToast = (msg, type) => { console.log(`[TOAST ${type || 'info'}]: ${msg}`); };
global.AudioFX = {
  buttonTick: () => {},
  coreChime: () => {},
  playTone: () => {},
  flashWhoosh: () => {},
  burstIgnite: () => {},
  heavyImpact: () => {},
  directHit: () => {}
};
global.FALLBACK_CARD_ART = '/assets/card_back.png';
global.S = { currentCard: null };

// Load battle_arena.js first so window.DuelState is set
const arenaCode = fs.readFileSync('battle_arena.js', 'utf8');
eval(arenaCode);
global.DuelState = window.DuelState;
global.BattleArena = window.BattleArena;

// Load app.js
const appCode = fs.readFileSync('app.js', 'utf8');
eval(appCode);

console.log('--- Testing Battle Spirits Card Details ---');

// Mock DuelState
const mockPlayerCards = [
  {
    name: 'Dolphino',
    kanji: 'ドルフィーノ',
    cost: 0,
    type: 'Spirit',
    color: 'Blue',
    family: 'Beast Head',
    rarity: 'Common',
    flavor: 'Why cannot they see the seriousness of the situation?',
    card_number: 'BS01-073',
    image_url: 'https://example.com/dolphino.jpg',
    levels: 'Level 1: 1 core, 1000 BP\nLevel 2: 5 core, 5000 BP',
    effect: '[Clash] When attacking, opponent must block if able.'
  },
  {
    name: 'Meteor Dragon',
    kanji: 'メテオ・ドラゴン',
    cost: 6,
    type: 'Spirit',
    color: 'Red',
    family: 'Astral Dragon',
    rarity: 'Master Rare',
    flavor: 'A blazing star descends.',
    card_number: 'BS01-006',
    image_url: 'https://example.com/meteor.jpg',
    levels: 'Level 1: 1 core, 4000 BP\nLevel 2: 3 core, 6000 BP',
    effect: '[Curse] When this spirit is destroyed, destroy opponent blocker.'
  }
];

// Initialize duel manually for testing
DuelState.inDuel = true;
DuelState.activePlayer = 'player';
DuelState.phaseIndex = 4; // MAIN step
DuelState.player.reserve = 3;
DuelState.player.hand = mockPlayerCards.map((c, i) => ({
  uid: 'c_' + (i + 1),
  name: c.name,
  kanji: c.kanji,
  cost: c.cost,
  type: c.type,
  color: c.color,
  family: c.family,
  rarity: c.rarity,
  flavor: c.flavor,
  card_number: c.card_number,
  image_url: c.image_url,
  raw_levels: c.levels,
  levels: [
    { level: 1, cores: 1, bp: 1000 },
    { level: 2, cores: 5, bp: 5000 }
  ],
  effect: c.effect,
  currentCores: 0,
  currentLevel: 1,
  currentBp: 1000,
  isExhausted: false
}));

console.log('1. Testing initial renderCardInspector when no card is selected...');
BattleArena.renderCardInspector();
const initialInspectorHtml = domElements['cardInspectorTray'].innerHTML;
if (!initialInspectorHtml.includes('inspector-placeholder')) {
  throw new Error('Expected placeholder in card inspector tray when no card is selected');
}
console.log('✓ Initial inspector shows placeholder correctly');

console.log('2. Testing selectHandCard for Dolphino...');
BattleArena.selectHandCard('c_1');

if (!DuelState.selectedPlayerCard || DuelState.selectedPlayerCard.name !== 'Dolphino') {
  throw new Error('Expected Dolphino to be selected');
}

const inspectorHtml = domElements['cardInspectorTray'].innerHTML;
console.log('Inspector HTML generated length:', inspectorHtml.length);

if (!inspectorHtml.includes('Dolphino')) throw new Error('Inspector missing card name');
if (!inspectorHtml.includes('ドルフィーノ')) throw new Error('Inspector missing kanji name');
if (!inspectorHtml.includes('Beast Head')) throw new Error('Inspector missing family');
if (!inspectorHtml.includes('LV1')) throw new Error('Inspector missing LV1 breakdown');
if (!inspectorHtml.includes('1000 BP')) throw new Error('Inspector missing 1000 BP');
if (!inspectorHtml.includes('LV2')) throw new Error('Inspector missing LV2 breakdown');
if (!inspectorHtml.includes('5000 BP')) throw new Error('Inspector missing 5000 BP');
if (!inspectorHtml.includes('kw-clash')) throw new Error('Inspector missing kw-clash keyword badge');
if (!inspectorHtml.includes('⚡ Summon Spirit')) throw new Error('Inspector missing Summon Spirit button');

console.log('✓ In-Duel Card Details Inspector verified with all stats, levels, and keyword badges');

console.log('3. Testing #cardModal prefill and Duel Summon button state...');
if (!domElements['cardModal'].classList.contains('open')) {
  throw new Error('Expected #cardModal to be opened');
}
if (domElements['modalTitle'].textContent !== 'Dolphino') {
  throw new Error('Expected modalTitle to be Dolphino');
}
if (domElements['modalJpName'].textContent !== 'ドルフィーノ') {
  throw new Error('Expected modalJpName to be ドルフィーノ');
}
if (domElements['modalDuelSummonBtn'].style.display !== 'block') {
  throw new Error('Expected modalDuelSummonBtn to be visible during duel');
}
if (domElements['modalDeckBtn'].style.display !== 'none') {
  throw new Error('Expected modalDeckBtn to be hidden during duel');
}
console.log('✓ #cardModal opened instantly with card details and duel summon button');

console.log('4. Testing deselectCard...');
BattleArena.deselectCard();
if (DuelState.selectedPlayerCard !== null) throw new Error('Expected selectedPlayerCard to be null after deselect');
const resetHtml = domElements['cardInspectorTray'].innerHTML;
if (!resetHtml.includes('inspector-placeholder')) {
  throw new Error('Expected placeholder after deselect');
}
console.log('✓ deselectCard works properly');

console.log('5. Testing opponent spirit click inspection...');
DuelState.opponent.field = [
  {
    uid: 'opp_1',
    name: 'Dark Knight Lancelot',
    kanji: '暗黒騎士ランスロット',
    cost: 5,
    type: 'Spirit',
    color: 'Purple',
    family: 'Infernal Lord',
    rarity: 'Rare',
    flavor: 'A cursed warrior of shadows.',
    card_number: 'BS02-014',
    image_url: 'https://example.com/lancelot.jpg',
    levels: [{ level: 1, cores: 1, bp: 3000 }, { level: 2, cores: 3, bp: 6000 }],
    effect: '[Curse] Mutual destruction when defeated in battle.',
    currentCores: 2,
    currentLevel: 1,
    currentBp: 3000,
    isExhausted: false
  }
];

BattleArena.handleSpiritClick('opp_1', 'opponent');
if (!DuelState.selectedPlayerCard || DuelState.selectedPlayerCard.name !== 'Dark Knight Lancelot') {
  throw new Error('Expected opponent spirit to be inspected');
}
const oppInspectorHtml = domElements['cardInspectorTray'].innerHTML;
if (!oppInspectorHtml.includes('Dark Knight Lancelot')) throw new Error('Opponent name missing in inspector');
if (!oppInspectorHtml.includes('kw-curse')) throw new Error('Curse keyword pill missing in inspector');
if (!oppInspectorHtml.includes('Current BP: 3000')) throw new Error('Battlefield BP missing in inspector');

console.log('✓ Opponent spirit inspected successfully with battlefield BP and curse ability');

console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
