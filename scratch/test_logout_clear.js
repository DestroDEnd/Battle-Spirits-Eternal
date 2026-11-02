const assert = require('assert');

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.window = {
  location: { pathname: '/index.html' },
  addEventListener: () => {}
};
global.document = {
  getElementById: () => null,
  createElement: () => ({ innerHTML: '', appendChild: () => {}, querySelector: () => null, classList: { add: () => {} } }),
  body: { appendChild: () => {} },
  addEventListener: () => {}
};

const app = require('../app.js');
const AuthManager = app.AuthManager;

// Seed user data
localStorage.setItem('bsp_duelist_user', JSON.stringify({ name: 'Dan' }));
localStorage.setItem('bs_user_decks_v2', JSON.stringify({ decks: [{ id: 'personal_deck_xyz', name: 'My Secret Deck', cards: { 'Curse of Hades': 3 } }] }));
localStorage.setItem('bse_user_avatar', '🐉');
localStorage.setItem('bse_duelist_friends', JSON.stringify([{ id: '1234-5678' }]));
localStorage.setItem('colosseum_p1_deck_id', 'personal_deck_xyz');

// Seed system/database cache that should NOT be wiped
localStorage.setItem('battle_spirits.db_v1', 'binary_data_cache');
localStorage.setItem('theme_preference', 'dark');

console.log('🧪 Testing AuthManager.clearBrowserUserData()...');

AuthManager.clearBrowserUserData();

// Assert personal user data is wiped
assert.strictEqual(localStorage.getItem('bsp_duelist_user'), null, 'bsp_duelist_user should be deleted');
assert.strictEqual(localStorage.getItem('bse_user_avatar'), null, 'bse_user_avatar should be deleted');
assert.strictEqual(localStorage.getItem('bse_duelist_friends'), null, 'bse_duelist_friends should be deleted');
assert.strictEqual(localStorage.getItem('colosseum_p1_deck_id'), null, 'colosseum_p1_deck_id should be deleted');

// Assert personal deck with secret cards is GONE
const remainingDecksRaw = localStorage.getItem('bs_user_decks_v2');
assert(!remainingDecksRaw || !remainingDecksRaw.includes('personal_deck_xyz'), 'Personal deck must be cleared');
assert(!remainingDecksRaw || !remainingDecksRaw.includes('Curse of Hades'), 'Personal cards must be cleared');

// Assert system keys are preserved!
assert.strictEqual(localStorage.getItem('battle_spirits.db_v1'), 'binary_data_cache', 'Database cache must NOT be wiped');
assert.strictEqual(localStorage.getItem('theme_preference'), 'dark', 'Theme preference must NOT be wiped');

console.log('✅ AuthManager.clearBrowserUserData() tested successfully!');
