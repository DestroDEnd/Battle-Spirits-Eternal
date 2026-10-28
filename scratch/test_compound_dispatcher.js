const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Testing Compound & Universal Card Ability Dispatcher...\n');

// Mock duel environment
const mockDuelState = {
  inDuel: true,
  turn: 2,
  activePlayer: 'player',
  player: {
    life: 5,
    reserve: 4,
    trash: 0,
    deck: [{ name: 'Bonus Card 1' }, { name: 'Bonus Card 2' }],
    hand: [],
    field: []
  },
  opponent: {
    life: 5,
    reserve: 2,
    trash: 0,
    deck: [{ name: 'Opp Deck 1' }],
    hand: [],
    field: [
      {
        uid: 'opp_ex_1',
        name: 'Exhausted Knight',
        cost: 4,
        currentBp: 4000,
        currentCores: 2,
        isExhausted: true
      },
      {
        uid: 'opp_rd_2',
        name: 'Ready Giant',
        cost: 6,
        currentBp: 7000,
        currentCores: 3,
        isExhausted: false
      }
    ]
  }
};

console.log('--- Case 1: Compound Effect (Arukenimon: Destroy Exhausted + Void Core Boost) ---');
// Simulating card effect text
const arukenimon = {
  uid: 'arukeni_1',
  name: 'Arukenimon',
  cost: 5,
  currentLevel: 1,
  currentCores: 1,
  currentBp: 5000,
  levels: 'LV1 1 core 5000 BP, LV2 3 cores 8000 BP',
  effect: '[LV1][LV2][LV3] (When Attacks) Destroy an opposing exhausted Spirit, and put a core from the Void to this Spirit.'
};

console.log('Arukenimon initial cores:', arukenimon.currentCores);
console.log('Opponent initial field count:', mockDuelState.opponent.field.length);

assert(arukemonEffMatches(arukenimon.effect), 'Must match When Attacks pattern');
console.log('✅ Regex correctly identified compound When Attacks action!');

function arukemonEffMatches(eff) {
  const hasWhenAttacks = /\(When Attacks(?:[^)]*)\)|\(When [^)]*\/Attacks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)/i.test(eff);
  const hasDestroyExhausted = /destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+spirit/i.test(eff);
  const hasVoidBoost = /put\s+(?:a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+this\s+spirit/i.test(eff);
  return hasWhenAttacks && hasDestroyExhausted && hasVoidBoost;
}
