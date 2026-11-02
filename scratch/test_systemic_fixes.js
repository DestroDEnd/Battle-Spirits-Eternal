const fs = require('fs');
const path = require('path');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  addEventListener: () => {}
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.AudioContext = function() {};

const dbJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'card_effects_db.json'), 'utf8'));
const arenaCode = fs.readFileSync(path.join(__dirname, '..', 'battle_arena.js'), 'utf8');
eval(arenaCode);

const cardsMap = dbJson.cards || dbJson;
const h = global.BattleArena;
Object.assign(h.getCardEffectsDB(), cardsMap);

console.log('=== 1. Inspect Compiled JSON for Curse Swordsman, Makai Holy Grail, Mausoleum ===');
console.log('Curse Swordsman:', JSON.stringify(cardsMap['The MakaiSoldier Curse Swordsman'].triggers, null, 2));
console.log('Makai Holy Grail:', JSON.stringify(cardsMap['The Makai Holy Grail'].triggers, null, 2));
console.log('Mausoleum:', JSON.stringify(cardsMap['The SevenShogun Resting Mausoleum'].triggers, null, 2));

const ds = h.getState();
ds.inDuel = true;
ds.turn = 1;
ds.activePlayer = 'player';
ds.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
ds.phaseIndex = 4;

// Test A: Curse Swordsman at LV1 (should NOT draw or drain!)
ds.player.deck = [{ uid: 'd1', name: 'Deck Card 1', type: 'Spirit', cost: 3 }];
ds.player.hand = [];
ds.player.field = [];
ds.opponent.field = [{ uid: 'opp1', name: 'Enemy Spirit', type: 'Spirit', cost: 3, currentCores: 2, currentLevel: 1, currentBp: 3000, levels: [{ level: 1, cores: 1, bp: 3000 }] }];
ds.opponent.reserve = 0;

const swordsman = {
  uid: 'cs1',
  name: 'The MakaiSoldier Curse Swordsman',
  type: 'Spirit',
  color: 'Purple',
  cost: 3,
  currentCores: 1,
  currentLevel: 1,
  currentBp: 1000,
  effect: cardsMap['The MakaiSoldier Curse Swordsman'].raw_effect
};
ds.player.field.push(swordsman);

h.executeWhenAttacksEffects(swordsman, 'player');
console.log('\n[Test A1] Curse Swordsman Attacks at LV1 -> Hand count (expected 0):', ds.player.hand.length, 'Enemy cores (expected 2):', ds.opponent.field[0].currentCores);
if (ds.player.hand.length !== 0 || ds.opponent.field[0].currentCores !== 2) {
  throw new Error('FAIL Test A1: Curse Swordsman triggered at LV1!');
}

// Test A2: Curse Swordsman at LV2 with 0 opposing spirits (should NOT draw because "By sending..." fails!)
swordsman.currentCores = 2;
swordsman.currentLevel = 2;
ds.opponent.field = [];
h.executeWhenAttacksEffects(swordsman, 'player');
console.log('[Test A2] Curse Swordsman Attacks at LV2 with 0 enemy spirits -> Hand count (expected 0):', ds.player.hand.length);
if (ds.player.hand.length !== 0) {
  throw new Error('FAIL Test A2: Curse Swordsman drew a card without paying "By sending a core" cost!');
}

// Test A3: Curse Swordsman at LV2 with 1 opposing spirit (should drain 1 core to enemy reserve AND draw 1 card!)
ds.opponent.field = [{ uid: 'opp2', name: 'Enemy Spirit', type: 'Spirit', cost: 3, currentCores: 2, currentLevel: 1, currentBp: 3000, levels: [{ level: 1, cores: 1, bp: 3000 }] }];
ds.opponent.reserve = 0;
h.executeWhenAttacksEffects(swordsman, 'player');
console.log('[Test A3] Curse Swordsman Attacks at LV2 with 1 enemy spirit -> Hand count (expected 1):', ds.player.hand.length, 'Enemy cores (expected 1):', ds.opponent.field[0].currentCores, 'Enemy reserve (expected 1):', ds.opponent.reserve);
if (ds.player.hand.length !== 1 || ds.opponent.field[0].currentCores !== 1 || ds.opponent.reserve !== 1) {
  throw new Error('FAIL Test A3: Curse Swordsman did not properly drain 1 core and draw 1 card at LV2!');
}

// Test B: The Makai Holy Grail When Deployed
ds.player.deck = [
  { uid: 'gd1', name: 'Drawn 1', type: 'Spirit', cost: 3 },
  { uid: 'gd2', name: 'Drawn 2', type: 'Spirit', cost: 3 },
  { uid: 'gd3', name: 'Drawn 3', type: 'Spirit', cost: 3 }
];
ds.player.hand = [
  { uid: 'mh1', name: 'The MakaiSoldier Curse Swordsman', type: 'Spirit', family: 'Ogre Wizard', cost: 3 },
  { uid: 'mh2', name: 'The MakaiHeirloom Geno-Legacy', type: 'Spirit', family: 'Ogre Wizard', cost: 4 },
  { uid: 'nh1', name: 'Flame Dragon', type: 'Spirit', family: 'Terra Dragon', cost: 4 }
];
ds.player.trashCards = [];
const grail = {
  uid: 'gr1',
  name: 'The Makai Holy Grail',
  type: 'Nexus',
  color: 'Purple',
  cost: 4,
  currentCores: 0,
  currentLevel: 1,
  effect: cardsMap['The Makai Holy Grail'].raw_effect
};
h.executeUniversalCardEffect(grail, 'player', 'WHEN_DEPLOYED');
console.log('\n[Test B] Makai Holy Grail When Deployed -> Trash count (expected 2):', ds.player.trashCards.length, 'Hand count (expected 3: 1 remaining non-Makai + 2 drawn):', ds.player.hand.length);
if (ds.player.trashCards.length !== 2 || ds.player.hand.length !== 3) {
  throw new Error('FAIL Test B: Makai Holy Grail did not discard 2 Makai cards to draw 2 cards!');
}

console.log('\nALL SYSTEMIC VERIFICATION TESTS PASSED!');
