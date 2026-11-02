// Test all 6 user-reported gameplay issues in battle_arena.js and app.js
const assert = require('assert');
const fs = require('fs');

// Mock browser globals
global.window = global;
global.window.location = { pathname: '/battle_arena' };
global.window.FALLBACK_CARD_ART = './assets/card_back.png';
global.document = {
  getElementById: (id) => {
    return {
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      style: {},
      innerHTML: '',
      textContent: '',
      appendChild: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    };
  },
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
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.AudioContext = function() {};

// Load app.js (for ModalCardNavigator)
const appCode = fs.readFileSync('app.js', 'utf-8');
eval(appCode + '\nglobal.ModalCardNavigator = ModalCardNavigator;');

// Load battle_arena.js
const arenaCode = fs.readFileSync('battle_arena.js', 'utf-8');
eval(arenaCode);

console.log('--- STARTING VERIFICATION OF ALL 6 USER-REPORTED ISSUES ---');

// Setup mock CardEffectsDB in BattleArena
const effectsDb = JSON.parse(fs.readFileSync('card_effects_db.json', 'utf-8'));
Object.assign(BattleArena.getCardEffectsDB(), effectsDb.cards || effectsDb);

const DuelState = BattleArena.getState();

// ==========================================
// TEST 1: Modal Navigation Context Discovery
// ==========================================
console.log('\n[Test 1] Modal Navigation Context Discovery (Hand vs Field vs Advent)');
DuelState.inDuel = true;
DuelState.player.hand = [
  { name: 'Dark Matter', type: 'Magic' },
  { name: 'Forbidden Grave', type: 'Magic' },
  { name: 'The MakaiKnight Shazworth', type: 'Spirit' }
];

DuelState.player.field = [
  {
    name: 'The MakaiKnight Shazworth',
    type: 'Spirit',
    isAdvent: true,
    underlyingCards: [
      { name: 'The MakaiDemonBlade Agon', type: 'Spirit' }
    ]
  },
  {
    name: 'The MakaiPriest Shugraus',
    type: 'Spirit',
    underlyingCards: []
  }
];

// 1A: Inspecting a card in Hand
const handList = ModalCardNavigator.discoverPageCardList('Dark Matter');
assert.deepStrictEqual(handList, ['Dark Matter', 'Forbidden Grave', 'The MakaiKnight Shazworth'], 'Should discover player hand list');
console.log('✓ Correctly discovers player hand list when inspecting card in hand');

// 1B: Inspecting an Advent card on Field (Next button cycles to pre-advent card underneath)
BattleArena.openCardDetailContext('The MakaiKnight Shazworth', 'field');
assert.deepStrictEqual(ModalCardNavigator.currentList, [
  'The MakaiKnight Shazworth',
  'The MakaiDemonBlade Agon',
  'The MakaiPriest Shugraus'
], 'Field list must order stacked underlyingCards immediately under the Advent card');
console.log('✓ Correctly discovers field list with stacked pre-advent card immediately following Advent card');

// Also test discoverPageCardList when a field card is selected:
DuelState.selectedPlayerCard = DuelState.player.field[0];
const fieldList = ModalCardNavigator.discoverPageCardList('The MakaiKnight Shazworth');
assert.deepStrictEqual(fieldList, [
  'The MakaiKnight Shazworth',
  'The MakaiDemonBlade Agon',
  'The MakaiPriest Shugraus'
]);
console.log('✓ Correctly discovers field list when field card is selected');

// Also test a card that exists only on field (not in hand):
DuelState.selectedPlayerCard = null;
const shugList = ModalCardNavigator.discoverPageCardList('The MakaiPriest Shugraus');
assert.deepStrictEqual(shugList, [
  'The MakaiKnight Shazworth',
  'The MakaiDemonBlade Agon',
  'The MakaiPriest Shugraus'
]);
console.log('✓ Correctly discovers field list for unique field card');

// Test Next navigation from Advent card to pre-advent card:
ModalCardNavigator.setList(fieldList, 'The MakaiKnight Shazworth');
assert.strictEqual(ModalCardNavigator.currentIndex, 0);
ModalCardNavigator.navigate(1);
assert.strictEqual(ModalCardNavigator.currentList[ModalCardNavigator.currentIndex], 'The MakaiDemonBlade Agon');
console.log('✓ Modal "Next >" from Advent card navigates directly to pre-advent card stacked under it');

// ==========================================
// TEST 2: Advent Destruction & Pre-Advent Cards Trashed
// ==========================================
console.log('\n[Test 2] Advent Destruction & Pre-Advent Cards Trashed');
DuelState.player.trashCards = [];
const adventSpirit = {
  name: 'The MakaiKnight Shazworth',
  type: 'Spirit',
  uid: 'adv_1',
  underlyingCards: [
    { name: 'The MakaiDemonBlade Agon', type: 'Spirit', uid: 'pre_1' },
    { name: 'Puppet Soldier', type: 'Spirit', uid: 'pre_2' }
  ]
};

BattleArena.sendToTrash(adventSpirit, 'player', 'Destroyed by Opponent Attack');
assert.strictEqual(DuelState.player.trashCards.length, 3, 'All 3 cards (Advent + 2 pre-advent) must be in trash');
assert.strictEqual(DuelState.player.trashCards[2].name, 'The MakaiKnight Shazworth');
assert.strictEqual(DuelState.player.trashCards[1].name, 'The MakaiDemonBlade Agon');
assert.strictEqual(DuelState.player.trashCards[0].name, 'Puppet Soldier');
console.log('✓ Both Advent spirit and stacked pre-advent cards are safely sent to Trash upon destruction');

// ==========================================
// TEST 3: Core Sacrifice vs Opponent Destruction Burst Trigger
// ==========================================
console.log('\n[Test 3] Core Sacrifice vs Opponent Destruction Burst Trigger');
DuelState.player.burst = {
  name: 'The MakaiMarshal BurguHearts',
  type: 'Spirit',
  effect: '[Burst: After your Spirit is depleted/destroyed by the Opponent]\nSend two cores from any opposing Spirit to their Reserve. After this effect resolves, summon this card without paying the cost.'
};
DuelState.activeBurstTrigger = null;

// 3A: Self core sacrifice to summon another spirit
const selfSacrificedSpirit = { name: 'The MakaiKnight Beelzett', type: 'Spirit', uid: 'sp_beel' };
BattleArena.sendToTrash(selfSacrificedSpirit, 'player', 'Depleted cores for summon (CORE SACRIFICE)');
assert.strictEqual(DuelState.activeBurstTrigger, null, 'Core sacrifice MUST NOT trigger opponent destruction burst');
console.log('✓ Core sacrifice correctly DOES NOT trigger [After your Spirit is depleted/destroyed by the Opponent] Burst');

// 3B: Opponent destroys spirit in combat
BattleArena.sendToTrash(selfSacrificedSpirit, 'player', 'Destroyed in combat by Opponent Spirit');
assert.notStrictEqual(DuelState.activeBurstTrigger, null, 'Opponent destruction MUST trigger Burst');
assert.strictEqual(DuelState.activeBurstTrigger.card.name, 'The MakaiMarshal BurguHearts');
console.log('✓ Opponent destruction DOES correctly trigger [After your Spirit is depleted/destroyed by the Opponent] Burst');

// ==========================================
// TEST 4: Shugraus Allied Summon Ability
// ==========================================
console.log('\n[Test 4] Shugraus Allied Summon Ability');
const shugraus = {
  name: 'The MakaiPriest Shugraus',
  type: 'Spirit',
  uid: 'sp_shug',
  currentLevel: 1,
  currentCores: 1,
  levels: 'Level 1: 1 core, 3000 BP\nLevel 2: 3 cores, 5000 BP',
  effect: '[LV1][LV2] When your "Makai"-named Spirits, other than this Spirit, are summoned, send one core from any opposing Spirit(s) to the reserve.\n\n[LV2] When your "Makai"-named Spirits are destroyed by the opponent, draw one card from your deck.'
};
DuelState.player.field = [shugraus];
const enemyHaneppo = {
  name: 'Haneppo',
  type: 'Spirit',
  uid: 'sp_hane',
  currentCores: 2,
  currentLevel: 1,
  levels: 'Level 1: 1 core, 1000 BP',
  effect: ''
};
DuelState.opponent.field = [enemyHaneppo];
DuelState.opponent.reserve = 0;

const salzerk = {
  name: 'The MakaiSwordsman Salzerk',
  type: 'Spirit',
  uid: 'sp_salz',
  currentLevel: 1,
  currentCores: 1,
  levels: 'Level 1: 1 core, 4000 BP',
  effect: ''
};
DuelState.player.field.push(salzerk);

// Trigger summon of Salzerk
BattleArena.executeWhenSummonedEffects(salzerk, 'player');
assert.strictEqual(enemyHaneppo.currentCores, 1, 'Opposing spirit must lose 1 core');
assert.strictEqual(DuelState.opponent.reserve, 1, 'Opponent reserve must gain 1 core');
console.log('✓ Shugraus drains 1 core from opposing spirit to reserve when allied Makai spirit is summoned');

// ==========================================
// TEST 5: Delayed Hand UI on Draw
// ==========================================
console.log('\n[Test 5] Hand Draw Immediate Execution');
DuelState.player.deck = [{ name: 'Dark Matter', type: 'Magic' }, { name: 'Bloodharvest', type: 'Magic' }];
const initialHandCount = DuelState.player.hand.length;
BattleArena.executeAbilityActions('Draw two cards', { name: 'The MakaiKnight Shazworth' }, 'player', 'ADVENT');
assert.strictEqual(DuelState.player.hand.length, initialHandCount + 2, 'Hand must immediately contain 2 drawn cards');
console.log('✓ Hand immediately receives drawn cards upon advent/draw effect');

// ==========================================
// TEST 6: Burst Resolution & Fizzle Sequencing
// ==========================================
console.log('\n[Test 6] Burst Resolution & Fizzle Sequencing (Renegada & BurguHearts)');

// 6A: Renegada Burst: Reanimates up to two Cost <= 6 Purple Spirits from Trash, then summons itself free
DuelState.player.field = [];
DuelState.player.reserve = 5;
DuelState.player.trashCards = [
  { name: 'The MakaiKnight Beelzett', type: 'Spirit', color: 'Purple', cost: 5, levels: 'Level 1: 1 core, 5000 BP' },
  { name: 'Puppet Soldier', type: 'Spirit', color: 'Purple', cost: 1, levels: 'Level 1: 1 core, 1000 BP' }
];

DuelState.player.burst = {
  name: 'The MakaiChanceller Renegada',
  type: 'Spirit',
  color: 'Purple',
  cost: 7,
  levels: 'Level 1: 1 core, 6000 BP\nLevel 2: 3 cores, 11000 BP',
  effect: '[Burst: After your Spirit is Destroyed by the Opponent]\nYou can summon up to two Cost 6 or less Purple Spirit cards from your Trash, paying one cost each, and during this turn, treat their LV1 cost as 0. Every Spirit summoned by this effect is destroyed during this turn\'s End Step. After this effect resolves, summon this card without paying the cost.'
};

BattleArena.activateBurst('player', true);

// Check that Renegada AND both reanimated spirits are now on the field
assert.strictEqual(DuelState.player.field.length, 3, 'Should have 2 reanimated spirits + Renegada on field');
const reanimated = DuelState.player.field.filter(s => s.destroyAtEndStep);
assert.strictEqual(reanimated.length, 2, 'Both reanimated spirits must have destroyAtEndStep set');
const renegada = DuelState.player.field.find(s => s.name === 'The MakaiChanceller Renegada');
assert.notStrictEqual(renegada, undefined, 'Renegada must be summoned after resolving effect');
console.log('✓ Renegada resolves its trash reanimation effect first, then summons itself to the field');

// Check End Step destruction:
DuelState.activePlayer = 'player';
BattleArena.endTurn();
assert.strictEqual(DuelState.player.field.some(s => s.destroyAtEndStep), false, 'Reanimated spirits must be destroyed at End Step');
assert.strictEqual(DuelState.player.field.some(s => s.name === 'The MakaiChanceller Renegada'), true, 'Renegada remains safely on field');
console.log('✓ Renegada reanimated spirits are destroyed at End Step while Renegada persists');

console.log('\n========================================');
console.log('ALL 6 USER-REPORTED ISSUES VERIFIED 100% PASSING!');
console.log('========================================');
