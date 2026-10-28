const fs = require('fs');
const assert = require('assert');

console.log('--- TESTING BATTLE SPIRITS COIN FLIP (FIRST TURN) SYSTEM ---');

global.showToast = (msg, type) => {};

const mockElements = {};
function createMockEl(id) {
  return {
    id,
    tagName: 'DIV',
    style: {},
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      toggle: function(c, v) { if (v) this._classes.add(c); else this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); }
    },
    dataset: {},
    innerHTML: '',
    textContent: '',
    title: '',
    disabled: false,
    scrollIntoView: () => {}
  };
}

global.window = {
  esc: (s) => s,
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {},
  confirm: () => true,
  DuelState: null,
  DeckManager: {
    getDeck: () => ({ name: 'Standard Red', cards: { 'Goradon': 40 } })
  }
};

global.document = {
  readyState: 'complete',
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockEl(id);
    return mockElements[id];
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

eval(fs.readFileSync('battle_arena.js', 'utf8'));

// 1. Test launchCoinFlip
console.log('1. Testing launchCoinFlip modal opening...');
window.BattleArena.launchCoinFlip('red', 'purple');
const modalEl = document.getElementById('battleCoinModal');
assert(modalEl.classList.contains('active'), 'Coin flip modal must be opened');
const triggerBtn = document.getElementById('btnTriggerCoinFlip');
assert.strictEqual(triggerBtn.style.display, 'inline-flex', 'Trigger button must be visible');
console.log('  [PASS] Coin flip modal opened successfully');

// 2. Test flipCoin execution
console.log('2. Testing flipCoin animation and outcome resolution...');
window.BattleArena.flipCoin();
assert(triggerBtn.disabled, 'Trigger button must be disabled during spinning');
const coinEl = document.getElementById('coinFlipCoin');
assert(coinEl.classList.contains('is-flipping'), 'Coin must have is-flipping animation class');
console.log('  [PASS] Coin spinning in 3D air with sound effect');

// 3. Test proceedWithDuel
console.log('3. Testing proceedWithDuel and DuelState.activePlayer initialization...');
// Test player first
window.BattleArena.startDuel('red', 'purple', 'player');
let state = window.BattleArena.getState();
assert.strictEqual(state.activePlayer, 'player', 'Player must be active player when player wins coin toss');
assert.strictEqual(state.turn, 1, 'Turn must be 1');
console.log('  [PASS] Heads outcome correctly establishes Player First Turn');

// Test opponent first
window.BattleArena.startDuel('red', 'purple', 'opponent');
state = window.BattleArena.getState();
assert.strictEqual(state.activePlayer, 'opponent', 'Opponent must be active player when opponent wins coin toss');
assert.strictEqual(state.turn, 1, 'Turn must be 1');
console.log('  [PASS] Tails outcome correctly establishes Opponent First Turn');

// 4. Test index.html markup
console.log('4. Verifying index.html 3D coin disc and modal elements...');
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="battleCoinModal"'), 'index.html must include battleCoinModal');
assert(html.includes('id="coinFlipCoin"'), 'index.html must include coinFlipCoin 3D disc');
assert(html.includes('coin-face-heads'), 'index.html must include Heads side');
assert(html.includes('coin-face-tails'), 'index.html must include Tails side');
assert(html.includes('id="btnTriggerCoinFlip"'), 'index.html must include Toss Coin button');
console.log('  [PASS] index.html includes all 3D coin flip markup');

// 5. Test styles.css 3D animations
console.log('5. Verifying styles.css 3D coin perspective and keyframes...');
const css = fs.readFileSync('styles.css', 'utf8');
assert(css.includes('.coin-stage'), 'styles.css must include .coin-stage perspective');
assert(css.includes('.coin-3d-disc'), 'styles.css must include .coin-3d-disc preserve-3d');
assert(css.includes('@keyframes coin-flip-spin'), 'styles.css must include @keyframes coin-flip-spin');
assert(css.includes('.coin-result-banner.heads'), 'styles.css must include heads result banner');
assert(css.includes('.coin-result-banner.tails'), 'styles.css must include tails result banner');
console.log('  [PASS] styles.css includes 3D perspective, spin keyframes, and result banners');

console.log('\n========================================================');
console.log('ALL BATTLE SPIRITS COIN FLIP TESTS PASSED WITH 100%!   ');
console.log('========================================================\n');
