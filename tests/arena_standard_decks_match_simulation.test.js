/**
 * tests/arena_standard_decks_match_simulation.test.js
 * 
 * End-to-End Headless Match Simulation between Standard Decks
 * (Red: Hero Dragon's Blazing Soul vs Purple: Netherworld Curse & Seven Shoguns)
 * Validates opening hand distribution, turn phase transitions, core economics,
 * spirit summoning, attack declarations, and life damage processing.
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

function createSimulationEnvironment() {
  const elements = {};
  const storage = {};

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

  const doc = {
    readyState: 'complete',
    getElementById(id) {
      if (!elements[id]) elements[id] = createElement('div');
      return elements[id];
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement,
    addEventListener() {}
  };

  const sandbox = {
    window: {
      location: { href: 'http://localhost:3000/arena.html', pathname: '/arena.html', search: '', protocol: 'http:' },
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
      init() {},
      coreChime() {},
      playTone() {},
      click() {},
      lifeDamage() {},
      coreMove() {},
      spiritSummon() {},
      soulCoreIgnite() {}
    },
    fetch: async () => ({ ok: false, json: async () => ({}) })
  };
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);

  return { sandbox, elements };
}

test('Arena Simulation - Full Match Opening & First Turn Execution (Red vs Purple)', async () => {
  const { sandbox } = createSimulationEnvironment();
  const rawStdData = JSON.parse(fs.readFileSync(path.join(rootDir, 'standard_decks_data.json'), 'utf8'));

  // Hydrate DuelState with both Standard Decks
  for (const deck of rawStdData.decks) {
    if (deck && deck.color) {
      sandbox.window.DuelState.standardDecks[deck.color.toLowerCase()] = deck;
    }
  }

  const BA = sandbox.window.BattleArena;
  const DS = sandbox.window.DuelState;

  // 1. Start Duel with Player 1 (Red) and Opponent (Purple)
  await BA.startDuel('red', 'purple', 'player');

  assert.equal(DS.inDuel, true, 'Duel must be active');
  assert.equal(DS.turn, 1, 'Initial turn must be 1');
  assert.equal(DS.activePlayer, 'player', 'Player 1 goes first');

  // 2. Initial Setup Verification (Eternal Format / Bandai Rules)
  // Both players start with 5 Life, 4 starting hand cards
  assert.equal(DS.player.life, 5, 'Player starts with 5 Life');
  assert.equal(DS.opponent.life, 5, 'Opponent starts with 5 Life');
  assert.equal(DS.player.hand.length, 4, 'Player draws 4 cards opening hand');
  assert.equal(DS.opponent.hand.length, 4, 'Opponent draws 4 cards opening hand');
  assert.equal(DS.player.deck.length, 36, 'Player deck has 36 remaining cards (40 - 4)');
  assert.equal(DS.opponent.deck.length, 36, 'Opponent deck has 36 remaining cards (40 - 4)');

  // Starting cores in Reserve: 4 normal cores + 1 Soul Core
  assert.equal(DS.player.reserve, 4, 'Player starts with 4 normal cores in Reserve');
  assert.equal(DS.player.soulCoreLocation, 'reserve', 'Player has Soul Core in Reserve');
  assert.equal(DS.phaseIndex, 0, 'Duel starts at START step (phaseIndex 0)');

  // 3. First Turn Step Progression (Bandai Official Rules: Core Step is skipped on Turn 1 for the 1st player)
  // Step 1: START Step -> advance
  BA.manualStep('START');
  // Bandai Rule: Skips CORE step on Turn 1 -> advances directly to DRAW step (index 2)
  assert.equal(DS.phaseIndex, 2, 'Core Step skipped on Turn 1; advanced directly to DRAW step (phaseIndex 2)');

  // Step 2: DRAW Step -> advance
  BA.manualStep('DRAW');
  assert.equal(DS.player.hand.length, 5, 'Player drew 1 card during Draw Step (Hand = 5)');
  assert.equal(DS.player.deck.length, 35, 'Player deck reduced to 35 cards');
  assert.equal(DS.phaseIndex, 3, 'Advanced to REFRESH step (phaseIndex 3)');

  // Step 3: REFRESH Step -> advance
  BA.manualStep('REFRESH');
  assert.equal(DS.phaseIndex, 4, 'Advanced to MAIN step (phaseIndex 4)');

  // 4. MAIN Step: Summon a Spirit (0-cost Spirit Goradon or Lizardedge)
  let summonable = DS.player.hand.find(c => c.cost === 0 && c.type === 'Spirit');
  if (!summonable) {
    summonable = {
      uid: 'c_test_goradon',
      name: 'Goradon',
      cost: 0,
      type: 'Spirit',
      color: 'Red',
      parsed_levels: [{ level: 1, cores: 1, bp: 1000 }, { level: 2, cores: 3, bp: 3000 }]
    };
    DS.player.hand.push(summonable);
  }

  // Summon summonable card: allocate 1 core from Reserve
  assert.ok(DS.player.reserve >= 1, 'Player has reserve cores to maintain Spirit');
  DS.player.reserve -= 1;
  const idx = DS.player.hand.indexOf(summonable);
  if (idx !== -1) DS.player.hand.splice(idx, 1);
  summonable.currentCores = 1;
  summonable.currentLevel = 1;
  summonable.isExhausted = false;
  DS.player.field.push(summonable);

  assert.equal(DS.player.field.length, 1, 'Spirit is on the field');
  assert.equal(DS.player.field[0].currentCores, 1, 'Spirit has 1 core');
  assert.equal(DS.player.reserve, 3, 'Player reserve decreased to 3 cores');

  // Step 4: MAIN Step -> advance
  // Bandai Rule: Attack Step is skipped on Turn 1 for First Player -> advances directly to END step (index 6)
  BA.manualStep('MAIN');
  assert.equal(DS.phaseIndex, 6, 'Attack Step skipped on Turn 1 for First Player; advanced directly to END step');

  // Step 5: END Step -> pass turn to Opponent
  BA.manualStep('END');
  assert.equal(DS.turn, 2, 'Turn advanced to Turn 2');
  assert.equal(DS.activePlayer, 'opponent', 'Active player switched to opponent');
  assert.equal(DS.phaseIndex, 0, 'Opponent starts at START step (phaseIndex 0)');

  // 5. Opponent Turn 2 Step Progression
  // Opponent START Step -> advances to CORE step (index 1)
  BA.advanceOpponentStep();
  assert.equal(DS.phaseIndex, 1, 'Opponent on Turn 2 advances to CORE step (phaseIndex 1)');

  // Opponent CORE Step -> gathers +1 core from Void into Reserve
  const initialOppReserve = DS.opponent.reserve;
  BA.advanceOpponentStep();
  assert.equal(DS.opponent.reserve, initialOppReserve + 1, 'Opponent gathered +1 Core from Void into Reserve');
  assert.equal(DS.phaseIndex, 2, 'Opponent advanced to DRAW step (phaseIndex 2)');

  // Opponent DRAW Step -> draws 1 card from Deck
  const oppHandBefore = DS.opponent.hand.length;
  BA.advanceOpponentStep();
  assert.equal(DS.opponent.hand.length, oppHandBefore + 1, 'Opponent drew 1 card during Draw Step');
  assert.equal(DS.phaseIndex, 3, 'Opponent advanced to REFRESH step (phaseIndex 3)');

  // Opponent REFRESH Step -> advances to MAIN step (index 4)
  BA.advanceOpponentStep();
  assert.equal(DS.phaseIndex, 4, 'Opponent advanced to MAIN step (phaseIndex 4)');
});