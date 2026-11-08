import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const bundleSource = fs.readFileSync(path.join(rootDir, 'engine/cards/bundle.js'), 'utf8');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');
const cardsDetailed = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/cards_detailed.json'), 'utf8'));

function createArenaTestEnvironment() {
  const storage = {};
  const localStorage = {
    getItem(k) { return storage[k] !== undefined ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    clear() { Object.keys(storage).forEach(k => delete storage[k]); }
  };

  function createElement(tag) {
    return {
      tagName: String(tag).toUpperCase(),
      style: {},
      innerHTML: '',
      textContent: '',
      value: '',
      disabled: false,
      children: [],
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); }
      },
      appendChild(c) { this.children.push(c); },
      addEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; }
    };
  }

  const doc = {
    readyState: 'complete',
    getElementById(id) { return createElement('div'); },
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
    console: { log() {}, warn() {}, error() {} },
    setTimeout: (fn, ms) => {
      if (typeof fn === 'function' && ms !== undefined && ms < 1000) fn();
      return 1;
    },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    AudioFX: {
      init() {}, coreChime() {}, playTone() {}, click() {},
      lifeDamage() {}, coreMove() {}, spiritSummon() {}, summon() {},
      slash() {}, soulCoreIgnite() {}, refresh() {}, magic() {}, shield() {}, burstIgnite() {}
    },
    fetch: async () => ({ ok: false, json: async () => ({}) })
  };
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(bundleSource, sandbox);
  vm.runInContext(battleArenaSource, sandbox);

  return { arena: sandbox.window.BattleArena, sandbox };
}

describe('Free Summon Mechanics & Hand Reactions Suite', () => {

  it('1. Ultimate-Seiryubi (BS28-X05): Violent High Speed free summon with 5+ Trash Cores and Green Ultimate on field', () => {
    const { arena } = createArenaTestEnvironment();
    const seiryubiCard = Object.values(cardsDetailed).find(c => c.name === 'Ultimate-Seiryubi');
    const vandielCard = Object.values(cardsDetailed).find(c => c.name === 'The Hellwind FourDemonLord Vandiel');
    assert.ok(seiryubiCard, 'Seiryubi found');
    assert.ok(vandielCard, 'Vandiel found');

    const state = arena.getState();
    state.inDuel = true;
    state.phaseIndex = 5; // ATTACK step
    state.player.trash = 5;
    state.player.reserve = 2;
    state.player.field = [Object.assign({}, vandielCard, { uid: 'vandiel-01', currentCores: 2, currentLevel: 3 })];
    state.player.hand = [Object.assign({}, seiryubiCard, { uid: 'seiryubi-01' })];

    // Check eligibility
    const elig = arena.checkCardFreeSummonEligibility(state.player.hand[0], 'player');
    assert.equal(elig.eligible, true, 'Seiryubi is eligible for Violent High Speed free summon');
    assert.equal(elig.type, 'VIOLENT_HIGH_SPEED');

    // Execute free summon
    arena.executeFreeSummon('seiryubi-01', 'player');

    // Unit summoned on field with 1 core
    const summoned = state.player.field.find(s => s.uid === 'seiryubi-01');
    assert.ok(summoned, 'Seiryubi successfully summoned to field');
    assert.equal(summoned.currentCores, 1, 'Placed 1 core on Seiryubi for LV3');

    // Cores: 5 in trash -> 1 on Seiryubi + 4 to reserve (2 + 4 = 6)
    assert.equal(state.player.trash, 0, 'Trash emptied');
    assert.equal(state.player.reserve, 6, 'Remaining 4 cores returned to Reserve');
  });

  it('2. Siegfried XV (BS65-XV01): Flash Count 7+ & Red Contract Spirit allows free summon', () => {
    const { arena } = createArenaTestEnvironment();
    const siegCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS65-XV01');
    assert.ok(siegCard, 'Siegfried XV found');

    const state = arena.getState();
    state.inDuel = true;
    state.phaseIndex = 5; // ATTACK step
    state.player.count = 7;
    state.player.reserve = 3;
    state.player.field = [
      { uid: 'contract-red-01', name: 'The PartnerDragon Aibow', color: 'Red', isContract: true, currentCores: 2 }
    ];
    state.player.hand = [Object.assign({}, siegCard, { uid: 'sieg-xv-01' })];

    const elig = arena.checkCardFreeSummonEligibility(state.player.hand[0], 'player');
    assert.equal(elig.eligible, true, 'Siegfried XV is eligible for Count-gated free summon');

    arena.executeFreeSummon('sieg-xv-01', 'player');
    const summoned = state.player.field.find(s => s.uid === 'sieg-xv-01');
    assert.ok(summoned, 'Siegfried XV summoned to field');
    assert.equal(state.player.reserve, 2, 'Placed 1 core from Reserve onto Siegfried XV without paying cost');
  });

  it('3. Mercurius-Serpent (BS10-058): Main Step free summon by returning Blue Nexus to deckbottom', () => {
    const { arena } = createArenaTestEnvironment();
    const mercCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS10-058');
    assert.ok(mercCard, 'Mercurius-Serpent found');

    const state = arena.getState();
    state.inDuel = true;
    state.phaseIndex = 4; // MAIN step
    state.player.reserve = 3;
    state.player.nexus = [
      { uid: 'blue-nex-01', name: 'The Colosseum of Blue', color: 'Blue', cost: 3 }
    ];
    state.player.deck = [];
    state.player.hand = [Object.assign({}, mercCard, { uid: 'merc-01' })];

    const elig = arena.checkCardFreeSummonEligibility(state.player.hand[0], 'player');
    assert.equal(elig.eligible, true, 'Mercurius-Serpent eligible to return Blue Nexus');
    assert.equal(elig.type, 'MAIN_NEXUS_RETURN_FREE');

    arena.executeFreeSummon('merc-01', 'player');

    // Nexus returned to deck
    assert.equal(state.player.nexus.length, 0, 'Blue Nexus removed from field');
    assert.equal(state.player.deck.length, 1, 'Blue Nexus returned to deck');
    assert.equal(state.player.deck[0].uid, 'blue-nex-01');

    // Mercurius-Serpent on field
    const summoned = state.player.field.find(s => s.uid === 'merc-01');
    assert.ok(summoned, 'Mercurius-Serpent summoned to field for 0 cost');
  });

  it('4. Ultimate-Siegfried-Neo (SJ14-02): Hand reaction triggers free summon when Siegfried is destroyed', () => {
    const { arena } = createArenaTestEnvironment();
    const neoCard = Object.values(cardsDetailed).find(c => c.card_number === 'SJ14-02');
    assert.ok(neoCard, 'Ultimate-Siegfried-Neo found');

    const state = arena.getState();
    state.inDuel = true;
    state.player.reserve = 2;
    state.player.field = [];
    state.player.hand = [Object.assign({}, neoCard, { uid: 'neo-01' })];

    const destroyedSiegfried = {
      uid: 'sieg-destroyed-01',
      name: 'The DragonEmperor Siegfried',
      type: 'Spirit',
      color: 'Red',
      cost: 6
    };

    arena.checkHandReactionsOnDestruction(destroyedSiegfried, 'player');

    const summoned = state.player.field.find(s => s.uid === 'neo-01');
    assert.ok(summoned, 'Ultimate-Siegfried-Neo reaction summoned to field without paying cost');
  });

  it('5. The BlackHeavenFox Nega-Ninetail (BS20-X04): Hand reaction triggers free summon when White Cost 6+ Spirit is destroyed', () => {
    const { arena } = createArenaTestEnvironment();
    const foxCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS20-X04');
    assert.ok(foxCard, 'Nega-Ninetail found');

    const state = arena.getState();
    state.inDuel = true;
    state.player.reserve = 2;
    state.player.field = [];
    state.player.hand = [Object.assign({}, foxCard, { uid: 'fox-01' })];

    const destroyedWhiteSpirit = {
      uid: 'white-6-destroyed',
      name: 'The ArmoredDragon Diamond-Dragon',
      type: 'Spirit',
      color: 'White',
      cost: 6
    };

    arena.checkHandReactionsOnDestruction(destroyedWhiteSpirit, 'player');

    const summoned = state.player.field.find(s => s.uid === 'fox-01');
    assert.ok(summoned, 'Nega-Ninetail reaction summoned to field without paying cost');
  });

  it('6. The JulyYoungEmperor Julyre-Kid (LM17-02): Hand reaction triggers free summon when Red Advent Spirit is summoned', () => {
    const { arena } = createArenaTestEnvironment();
    const kidCard = Object.values(cardsDetailed).find(c => c.card_number === 'LM17-02');
    assert.ok(kidCard, 'Julyre-Kid found');

    const state = arena.getState();
    state.inDuel = true;
    state.player.reserve = 2;
    state.player.field = [];
    state.player.hand = [Object.assign({}, kidCard, { uid: 'kid-01' })];

    const redAdventSpirit = {
      uid: 'advent-red-01',
      name: 'The AdventDragon King-Siegfried',
      type: 'Spirit',
      color: 'Red'
    };

    arena.checkHandReactionsOnAdvent(redAdventSpirit, 'player');

    const summoned = state.player.field.find(s => s.uid === 'kid-01');
    assert.ok(summoned, 'Julyre-Kid summoned to field for free in reaction to Red Advent');
  });

  it('7. Genseiryu (BS57-003): Hand reaction triggers free summon when Red/White Mirage is set by paying cost', () => {
    const { arena } = createArenaTestEnvironment();
    const genseiCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS57-003');
    assert.ok(genseiCard, 'Genseiryu found');

    const state = arena.getState();
    state.inDuel = true;
    state.player.reserve = 2;
    state.player.field = [];
    state.player.hand = [Object.assign({}, genseiCard, { uid: 'gensei-01' })];

    const redMirage = {
      uid: 'mirage-red-01',
      name: 'Flame Mirage',
      color: 'Red'
    };

    arena.checkHandReactionsOnMirageSet(redMirage, 2, 'player');

    const summoned = state.player.field.find(s => s.uid === 'gensei-01');
    assert.ok(summoned, 'Genseiryu summoned to field for free in reaction to Red Mirage set');
  });

});
