/**
 * tests/arena_lobby_deck_hydration.test.js
 * 
 * Verifies lobby deck selector population, active deck hydration from Deck Builder,
 * canonical Colosseum standard decks, and safe preview rendering without unhandled exceptions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function createMockLobbyContext(initialStorage = {}) {
  const elements = {};
  const storage = { ...initialStorage };

  const localStorage = {
    getItem(k) { return storage[k] !== undefined ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    clear() { Object.keys(storage).forEach(k => delete storage[k]); }
  };

  function createElement(tag) {
    return {
      tagName: tag.toUpperCase(),
      style: {},
      innerHTML: '',
      value: '',
      children: [],
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); }
      },
      appendChild(c) { this.children.push(c); },
      addEventListener() {}
    };
  }

  elements['battleLobby'] = createElement('div');
  elements['battleDuelTable'] = createElement('div');
  elements['arenaPlayerDeckSelect'] = createElement('select');
  elements['arenaOpponentDeckSelect'] = createElement('select');
  elements['lobbyPlayerDeckCard'] = createElement('div');
  elements['lobbyOpponentDeckCard'] = createElement('div');
  elements['btnEnterColosseum'] = createElement('button');

  const doc = {
    readyState: 'complete',
    getElementById(id) {
      if (!elements[id]) elements[id] = createElement('div');
      return elements[id];
    },
    querySelectorAll() { return []; },
    querySelector(sel) { return null; },
    createElement,
    addEventListener() {}
  };

  const sandbox = {
    window: {
      location: { href: 'http://localhost:8000/arena', pathname: '/arena', search: '', protocol: 'http:' },
      addEventListener() {},
      localStorage,
      document: doc
    },
    document: doc,
    localStorage,
    sessionStorage: localStorage,
    console: {
      log() {},
      warn() {},
      error() {}
    },
    setTimeout(fn) { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    AudioFX: {
      coinFlip() {},
      click() {},
      lifeDamage() {}
    },
    fetch: async () => ({ ok: false, json: async () => ({}) })
  };
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);

  return { sandbox, elements, storage };
}

test('Arena Lobby - Synchronously embeds all 6 canonical standard decks in DuelState', () => {
  assert.ok(battleArenaSource.includes('DEFAULT_REALM_PREVIEWS ='), 'Must have embedded DEFAULT_REALM_PREVIEWS');
  assert.ok(battleArenaSource.includes('purple: {'), 'Must embed purple realm preview');
  assert.ok(battleArenaSource.includes('red: {'), 'Must embed red realm preview');
  assert.ok(battleArenaSource.includes('green: {'), 'Must embed green realm preview');
  assert.ok(battleArenaSource.includes('white: {'), 'Must embed white realm preview');
  assert.ok(battleArenaSource.includes('yellow: {'), 'Must embed yellow realm preview');
  assert.ok(battleArenaSource.includes('blue: {'), 'Must embed blue realm preview');
});

test('Arena Lobby - Automatically detects and registers 46-card Deck Builder deck into Player 1 select', () => {
  // Build a 46-card deck
  const builderCards = {};
  for (let i = 1; i <= 15; i++) {
    builderCards['Card_' + i] = 3;
  }
  builderCards['Ace_16'] = 1; // 15*3 + 1 = 46 cards

  const { sandbox, elements } = createMockLobbyContext({
    'bs_deck': JSON.stringify(builderCards)
  });

  const BA = sandbox.window.BattleArena;
  assert.ok(BA, 'BattleArena global must exist in context');
  assert.equal(typeof BA.renderArenaLobby, 'function');

  // Trigger lobby render
  BA.renderArenaLobby();

  const pSelect = elements['arenaPlayerDeckSelect'];
  const oSelect = elements['arenaOpponentDeckSelect'];
  const pCard = elements['lobbyPlayerDeckCard'];
  const oCard = elements['lobbyOpponentDeckCard'];

  // Check Player 1 options
  assert.ok(pSelect.innerHTML.length > 0, 'Player deck select must have options');
  assert.ok(pSelect.innerHTML.includes('46 Cards'), 'Player deck select must show the 46 cards from deck builder');

  // Check Opponent options
  assert.ok(oSelect.innerHTML.length > 0, 'Opponent realm select must have options');
  assert.ok(oSelect.innerHTML.includes('Netherworld Curse'), 'Opponent realm must have purple realm');
  assert.ok(oSelect.innerHTML.includes('Hero Dragon'), 'Opponent realm must have red realm');

  // Check previews rendered without throwing
  assert.ok(pCard.innerHTML.length > 0, 'Player deck preview card must be populated');
  assert.ok(pCard.innerHTML.includes('46 CARDS'), 'Player preview must display 46 cards');
  assert.ok(oCard.innerHTML.length > 0, 'Opponent deck preview card must be populated');
  assert.ok(oCard.innerHTML.includes('deck-preview-badge'), 'Opponent preview must include realm badge');
});

test('Arena Lobby - Safely handles custom decks with undefined color without throwing toUpperCase error', () => {
  const { sandbox, elements } = createMockLobbyContext({});

  // Attach a DeckManager with a custom deck lacking color
  sandbox.window.DeckManager = {
    getAllData() {
      return {
        decks: [{
          id: 'custom_no_color',
          name: 'Colorless Rogue',
          cards: { 'Goradon': 40 }
        }],
        activeDeckId: 'custom_no_color',
        battleDeckId: 'custom_no_color'
      };
    },
    getDeck(id) {
      if (id === 'custom_no_color') {
        return { id: 'custom_no_color', name: 'Colorless Rogue', cards: { 'Goradon': 40 } };
      }
      return null;
    },
    getBattleDeckId() { return 'custom_no_color'; },
    setBattleDeckId() {}
  };

  const BA = sandbox.window.BattleArena;
  assert.doesNotThrow(() => {
    BA.renderArenaLobby();
    BA.updateLobbyPreviews();
  }, 'Must not throw when deck.color is undefined');

  const pCard = elements['lobbyPlayerDeckCard'];
  assert.ok(pCard.innerHTML.includes('Colorless Rogue'), 'Must render deck name');
  assert.ok(pCard.innerHTML.includes('40 CARDS'), 'Must render card count');
});

test('Arena Lobby - Enables Enter Battle button for standard decks selected by Player 1', () => {
  const { sandbox, elements } = createMockLobbyContext({});

  sandbox.window.DeckManager = {
    getAllData() { return { decks: [] }; },
    getDeck() { return null; },
    getBattleDeckId() { return null; },
    setBattleDeckId() {}
  };

  const BA = sandbox.window.BattleArena;
  BA.renderArenaLobby();

  // Switch Player 1 to purple standard deck and Opponent to red standard deck
  elements['arenaPlayerDeckSelect'].value = 'purple';
  elements['arenaOpponentDeckSelect'].value = 'red';
  BA.updateLobbyPreviews();

  const startBtn = elements['btnEnterColosseum'];
  assert.ok(!startBtn.innerHTML.includes('Incomplete'), 'Start button must not be blocked for standard deck');
  assert.ok(startBtn.innerHTML.includes('ENTER BATTLE'), 'Start button must display ENTER BATTLE');
});

test('Arena Lobby - Standard pre-made decks count all 40 cards when cards is an array of [name, count] tuples', async () => {
  const { sandbox, elements } = createMockLobbyContext({});
  const rawStdData = JSON.parse(fs.readFileSync(path.join(rootDir, 'standard_decks_data.json'), 'utf8'));

  // Ensure DuelState.standardDecks has the actual API JSON objects where cards is an array of [name, count]
  for (const deck of rawStdData.decks) {
    if (deck && deck.color) {
      sandbox.window.DuelState.standardDecks[deck.color.toLowerCase()] = deck;
    }
  }

  let toastErrors = [];
  sandbox.window.showToast = (msg, type) => {
    if (type === 'error' || (msg && msg.includes('Cannot battle'))) {
      toastErrors.push(msg);
    }
  };

  const BA = sandbox.window.BattleArena;
  // Test starting duel for each standard deck color
  for (const color of ['red', 'purple', 'green', 'white', 'yellow', 'blue']) {
    toastErrors = [];
    elements['arenaPlayerDeckSelect'].value = color;
    elements['arenaOpponentDeckSelect'].value = color === 'red' ? 'purple' : 'red';

    // Call startDuel without firstPlayer (which launches coin flip or starts duel)
    await BA.startDuel(color, color === 'red' ? 'purple' : 'red', 'player');

    assert.equal(toastErrors.length, 0, `Starting duel with standard deck "${color}" must not trigger any error toasts: ${toastErrors.join('; ')}`);
    assert.equal(sandbox.window.DuelState.inDuel, true, `Duel must be active for "${color}"`);
    assert.ok(sandbox.window.DuelState.player.deck.length >= 35, `Player deck after opening hand draw must have >= 35 cards`);
    assert.ok(sandbox.window.DuelState.opponent.deck.length >= 35, `Opponent deck after opening hand draw must have >= 35 cards`);
    assert.equal(sandbox.window.DuelState.player.hand.length, 4, `Player must draw opening hand of 4 cards`);
    assert.equal(sandbox.window.DuelState.opponent.hand.length, 4, `Opponent must draw opening hand of 4 cards`);
  }
});
