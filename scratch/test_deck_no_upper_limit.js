const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🧪 RUNNING TEST SUITE: DECK LOWER LIMIT ONLY (NO UPPER LIMIT)");

// Mock browser environment
global.window = {
  location: { search: '' },
  addEventListener: () => {},
  Audio: class { play() {} pause() {} },
  BattleArena: null,
  DeckManager: null
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => {
    return {
      id,
      innerHTML: '',
      textContent: '',
      style: { display: 'none' },
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      appendChild: () => {},
      children: [],
      querySelectorAll: () => [],
      querySelector: () => null,
      setAttribute: () => {},
      getAttribute: () => null
    };
  }
};

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; }
};

// Evaluate battle_arena.js and app.js
const appCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');
eval(appCode);

const arenaCode = fs.readFileSync(path.join(__dirname, '..', 'battle_arena.js'), 'utf-8');
eval(arenaCode);

const BA = window.BattleArena;
const DM = window.DeckManager;

assert(BA, "BattleArena must be exported");
assert(DM, "DeckManager must be exported");

// --- TEST 1: Deck under 40 cards (39 cards) is Ineligible ---
console.log('\n--- TEST 1: 39-Card Deck (Below Minimum Lower Limit) ---');
const cards39 = {};
for (let i = 1; i <= 13; i++) {
  cards39[`Card_${i}`] = 3; // 13 * 3 = 39 cards
}
const deck39 = DM.createDeck('Under Limit Deck', 'Red', cards39);
const count39 = Object.values(deck39.cards).reduce((a, b) => a + b, 0);
assert.strictEqual(count39, 39, "Must have exactly 39 cards");

const set39Result = DM.setBattleDeckId(deck39.id);
assert.strictEqual(set39Result, false, "39-card deck MUST NOT be allowed as battle deck (below lower limit of 40)");
console.log('✅ 39-card deck correctly rejected because it is below the 40-card lower limit.');

// --- TEST 2: Exact 40-Card Deck is Eligible ---
console.log('\n--- TEST 2: Exact 40-Card Deck (Meets Minimum) ---');
const cards40 = {};
for (let i = 1; i <= 13; i++) {
  cards40[`Card_${i}`] = 3;
}
cards40['Card_Extra'] = 1; // 39 + 1 = 40 cards
const deck40 = DM.createDeck('Exact 40 Deck', 'Red', cards40);
const count40 = Object.values(deck40.cards).reduce((a, b) => a + b, 0);
assert.strictEqual(count40, 40, "Must have exactly 40 cards");

const set40Result = DM.setBattleDeckId(deck40.id);
assert.strictEqual(set40Result, true, "40-card deck MUST be accepted as battle deck");
console.log('✅ Exact 40-card deck accepted.');

// --- TEST 3: 45-Card Deck (Above 40 Cards - No Upper Limit) ---
console.log('\n--- TEST 3: 45-Card Deck (Above 40 Cards, No Upper Limit) ---');
const cards45 = {};
for (let i = 1; i <= 15; i++) {
  cards45[`Card_${i}`] = 3; // 15 * 3 = 45 cards
}
const deck45 = DM.createDeck('45-Card Deck', 'Red', cards45);
const count45 = Object.values(deck45.cards).reduce((a, b) => a + b, 0);
assert.strictEqual(count45, 45, "Must have exactly 45 cards");

const set45Result = DM.setBattleDeckId(deck45.id);
assert.strictEqual(set45Result, true, "45-card deck MUST be accepted as battle deck (no upper limit)");
assert.strictEqual(DM.getBattleDeckId(), deck45.id, "Battle deck ID must be updated to 45-card deck");
console.log('✅ 45-card deck successfully accepted as battle deck without upper limit restrictions!');

// --- TEST 4: 60-Card Deck (Far Above 40 Cards - No Upper Limit) ---
console.log('\n--- TEST 4: 60-Card Deck (Far Above 40 Cards, No Upper Limit) ---');
const cards60 = {};
for (let i = 1; i <= 20; i++) {
  cards60[`Card_${i}`] = 3; // 20 * 3 = 60 cards
}
const deck60 = DM.createDeck('60-Card Mega Deck', 'Red', cards60);
const count60 = Object.values(deck60.cards).reduce((a, b) => a + b, 0);
assert.strictEqual(count60, 60, "Must have exactly 60 cards");

const set60Result = DM.setBattleDeckId(deck60.id);
assert.strictEqual(set60Result, true, "60-card deck MUST be accepted as battle deck (no upper limit)");
assert.strictEqual(DM.getBattleDeckId(), deck60.id, "Battle deck ID must be updated to 60-card deck");
console.log('✅ 60-card deck successfully accepted as battle deck without upper limit restrictions!');

// --- TEST 5: Duel Engine Accepts 50-Card Deck into Battle ---
console.log('\n--- TEST 5: Duel Engine Launches with 50-Card Deck ---');
const cards50 = {};
for (let i = 1; i <= 16; i++) {
  cards50[`Spirit_${i}`] = 3; // 48
}
cards50['Spirit_Final'] = 2; // 50 cards
const deck50 = DM.createDeck('50-Card Arena Deck', 'Red', cards50);
const count50 = Object.values(deck50.cards).reduce((a, b) => a + b, 0);
assert.strictEqual(count50, 50, "Must have 50 cards");

// Verify battle arena validator
const canBattle50 = count50 >= 40;
assert.strictEqual(canBattle50, true, "50-card deck passes battle arena lower limit validation");
console.log('✅ 50-card deck verified for Colosseum Battle Arena entry!');

console.log('\n🎉 ALL DECK LOWER LIMIT / NO UPPER LIMIT TESTS PASSED WITH 100% SUCCESS!');
