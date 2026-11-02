const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Testing The SevenShogun Resting Mausoleum & Graveyard Mill...');

// 1. Verify card_effects_db.json entry for Mausoleum
const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../card_effects_db.json'), 'utf-8'));
const mau = db['The SevenShogun Resting Mausoleum'];
assert(mau, 'Mausoleum must exist in card_effects_db.json');
assert(mau.triggers.WHEN_DEPLOYED, 'Mausoleum must have WHEN_DEPLOYED triggers');

const discardAct = mau.triggers.WHEN_DEPLOYED.find(a => a.type === 'DECK_DISCARD');
assert(discardAct, 'Mausoleum must have DECK_DISCARD action');
assert.strictEqual(discardAct.count, 3, 'Must discard 3 cards');
assert.strictEqual(discardAct.target, 'self', 'Must target self deck');

const salvageAct = mau.triggers.WHEN_DEPLOYED.find(a => a.type === 'SALVAGE');
assert(salvageAct, 'Mausoleum must have SALVAGE action');
console.log('✅ TEST 1: Database entry for Mausoleum correctly has DECK_DISCARD (3, self) and SALVAGE.');

// 2. Setup mock environment for battle_arena.js
global.DuelState = {
  turn: 1,
  activePlayer: 'player',
  phaseIndex: 4, // MAIN
  phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
  selectedPlayerCard: null,
  player: {
    life: 5,
    reserve: 4,
    trash: 0,
    trashCards: [],
    hand: [],
    deck: [
      { name: 'Card 1', type: 'Magic' },
      { name: 'Advent Spirit', type: 'Spirit', effect: '[Advent: Cost 3 or more]' },
      { name: 'Card 3', type: 'Nexus' },
      { name: 'Card 4', type: 'Spirit' }
    ],
    field: [],
    nexus: []
  },
  opponent: {
    life: 5,
    reserve: 4,
    trash: 0,
    trashCards: [],
    hand: [],
    deck: [{ name: 'Opp 1' }, { name: 'Opp 2' }],
    field: [],
    nexus: []
  }
};

global.AudioFX = new Proxy({}, { get: () => () => {} });
global.addLog = (msg) => {
  // console.log('  LOG:', msg);
};
global.renderDuelTable = () => {};
global.renderPlayerHand = () => {};
global.showToast = () => {};

global.CardEffectsDB = db;

// Mock sendToTrash
global.sendToTrash = function(card, side, reason) {
  if (!card) return;
  const target = side === 'player' ? DuelState.player : DuelState.opponent;
  if (!target.trashCards) target.trashCards = [];
  card.graveyardReason = reason;
  target.trashCards.unshift(card);
};

// Load battle_arena.js functions
const code = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf-8');
const s = code.indexOf('function isOptionalEffectText');
const e = code.indexOf('async function initBattleArena');
eval(code.substring(s, e));

// Execute universal effect for Mausoleum
const nexusCard = {
  uid: 'mau-001',
  name: 'The SevenShogun Resting Mausoleum',
  type: 'Nexus',
  effect: mau.raw_effect,
  currentLevel: 1,
  currentCores: 0
};

// Test executeUniversalCardEffectCore directly with DECK_DISCARD & SALVAGE
executeUniversalCardEffectCore(nexusCard, 'player', 'WHEN_DEPLOYED', { __noPrompt: true });

console.log('Player Deck count remaining:', DuelState.player.deck.length);
console.log('Player TrashCards (Grave) count:', DuelState.player.trashCards.length);
console.log('Player Hand count:', DuelState.player.hand.length);

// 3 cards milled from deck (Card 1, Advent Spirit, Card 3).
// Card 4 remains in deck -> deck length 1.
assert.strictEqual(DuelState.player.deck.length, 1, 'Deck should have 1 card left');

// Salvage grabbed 'Advent Spirit' from trash to hand!
// So trash has 2 cards ('Card 3', 'Card 1'), hand has 1 card ('Advent Spirit')
assert.strictEqual(DuelState.player.hand.length, 1, 'Hand should have received salvaged Advent Spirit');
assert.strictEqual(DuelState.player.hand[0].name, 'Advent Spirit', 'Salvaged card must be Advent Spirit');
assert.strictEqual(DuelState.player.trashCards.length, 2, 'Grave should have 2 cards remaining after salvage');

console.log('✅ TEST 2: Mausoleum successfully mills 3 cards to Graveyard and salvages Advent Spirit to Hand!');
console.log('🎉 ALL MAUSOLEUM & GRAVEYARD TESTS PASSED!');
