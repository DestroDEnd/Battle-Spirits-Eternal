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

console.log('--- TESTING ATTACK STEP TIMING & FLASH RULES ---');

DuelState.inDuel = true;
DuelState.activePlayer = 'player';
DuelState.player.reserve = 5;
DuelState.player.trash = 0;
DuelState.player.field = [];
DuelState.player.burst = null;

const darkGoradon = {
  uid: 'dg_1',
  name: 'DarkGoradon',
  cost: 2,
  type: 'Spirit',
  color: 'Red',
  levels: [{ level: 1, cores: 1, bp: 3000 }],
  effect: 'A brutal dragon warrior with high battle power.' // Vanilla - NO Flash
};

const flameDance = {
  uid: 'fd_1',
  name: 'Flame Dance',
  cost: 5,
  type: 'Magic',
  color: 'Red',
  effect: '[Flash]\nDestroy a 4000 BP or less Spirit.' // Flash Magic
};

DuelState.player.hand = [darkGoradon, flameDance];

console.log('1. MAIN Step: All cards should be playable...');
DuelState.phaseIndex = 4; // MAIN
BattleArena.renderPlayerHand();
let handHtml = domElements['playerHand'].innerHTML;

if (!handHtml.includes('⚡ Summon')) {
  throw new Error('DarkGoradon should have "⚡ Summon" in MAIN step');
}
if (!handHtml.includes('✨ Cast')) {
  throw new Error('Flame Dance should have "✨ Cast" in MAIN step');
}
console.log('✓ In MAIN step, both normal Spirit and Magic can be summoned/cast');

console.log('2. ATTACK Step: Normal Spirit (DarkGoradon) CANNOT be summoned...');
DuelState.phaseIndex = 5; // ATTACK
BattleArena.renderPlayerHand();
handHtml = domElements['playerHand'].innerHTML;

// Verify DarkGoradon does NOT have summon button
if (handHtml.includes('⚡ Summon') || handHtml.includes('Flash Summon')) {
  throw new Error('DarkGoradon (no Flash) MUST NOT have any Summon button in Attack Step!');
}
if (!handHtml.includes('cannot-play-step')) {
  throw new Error('DarkGoradon should have "cannot-play-step" class in Attack Step');
}

// Verify Flame Dance (with [Flash]) DOES have Flash Cast button!
if (!handHtml.includes('✨ Flash Cast')) {
  throw new Error('Flame Dance (with [Flash]) SHOULD have "✨ Flash Cast" button in Attack Step');
}
console.log('✓ In ATTACK step: DarkGoradon is blocked from summoning; Flame Dance with [Flash] is allowed');

console.log('3. ATTACK Step: Direct summon attempt of DarkGoradon is blocked...');
BattleArena.summonCard('dg_1');
if (DuelState.player.field.length !== 0) {
  throw new Error('summonCard should have rejected DarkGoradon in Attack Step!');
}
console.log('✓ summonCard blocked non-Flash spirit in Attack Step');

console.log('4. ATTACK Step: Inspector Tray and Card Modal for DarkGoradon show disabled Main Step Only...');
DuelState.selectedPlayerCard = darkGoradon;
BattleArena.renderCardInspector();
const inspHtml = domElements['cardInspectorTray'].innerHTML;
if (!inspHtml.includes('Main Step Only (No Flash)')) {
  throw new Error('Inspector tray should show "Main Step Only (No Flash)" button disabled');
}

openCardDetail('DarkGoradon');
const modalBtn = domElements['modalDuelSummonBtn'];
if (!modalBtn.disabled) {
  throw new Error('modalDuelSummonBtn must be disabled in Attack Step for non-flash spirit');
}
if (!modalBtn.textContent.includes('Main Step Only')) {
  throw new Error('modalDuelSummonBtn text should indicate Main Step Only');
}
console.log('✓ Inspector Tray and Card Modal properly disable summoning in Attack Step');

console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
