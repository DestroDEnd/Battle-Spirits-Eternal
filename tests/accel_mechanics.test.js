import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { PerCardRegistry } from '../engine/cards/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');
const cardsDetailed = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/cards_detailed.json'), 'utf8'));

// Create sandbox for Arena UI
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
      addEventListener() {}
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
      document: doc,
      PerCardRegistry
    },
    PerCardRegistry,
    document: doc,
    localStorage,
    sessionStorage: localStorage,
    console: { log() {}, warn() {}, error() {} },
    setTimeout(fn) { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    AudioFX: {
      init() {}, coreChime() {}, playTone() {}, click() {},
      lifeDamage() {}, coreMove() {}, spiritSummon() {}, summon() {},
      slash() {}, soulCoreIgnite() {}, refresh() {}, magic() {}
    },
    fetch: async () => ({ ok: false, json: async () => ({}) })
  };
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);

  return { arena: sandbox.window.BattleArena, sandbox };
}

describe('Accel Mechanics & Highlighting Suite', () => {

  it('1. App.js Highlighting: The Silver Guardian Blade formats Accel with kw-accel and kw-flash pills', () => {
    // Extract formatEffectKeywordsInModal from app.js
    const sandbox = {
      window: {},
      esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
    };
    vm.createContext(sandbox);
    // Extract the function declaration from app.js
    const funcMatch = appSource.match(/function formatEffectKeywordsInModal\([\s\S]*?\n\}/);
    assert.ok(funcMatch, 'formatEffectKeywordsInModal found in app.js');
    vm.runInContext(funcMatch[0], sandbox);

    const silverCard = Object.values(cardsDetailed).find(c => c.name === 'The Silver Guardian Blade');
    assert.ok(silverCard, 'The Silver Guardian Blade found in cards database');

    const formatted = sandbox.formatEffectKeywordsInModal(silverCard.effect);

    // Accel must be highlighted with kw-accel
    assert.ok(formatted.includes('kw-accel'), 'Contains kw-accel class');
    assert.ok(formatted.includes('[Accel: Cost 0]'), 'Contains [Accel: Cost 0] pill content');
    // Flash must be highlighted with kw-flash
    assert.ok(formatted.includes('kw-flash'), 'Contains kw-flash class');
    // No raw <sub> or &lt;sub&gt; tags visible
    assert.ok(!formatted.includes('&lt;sub&gt;'), 'No escaped sub tags');
    assert.ok(!formatted.includes('<sub>'), 'No raw sub tags');
    assert.ok(formatted.includes('effect-reminder-box'), 'Reminder box for Extreme Zone present');
  });

  it('2. Database Coverage: Over 425 Accel cards format with kw-accel pill', () => {
    const sandbox = {
      window: {},
      esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
    };
    vm.createContext(sandbox);
    const funcMatch = appSource.match(/function formatEffectKeywordsInModal\([\s\S]*?\n\}/);
    vm.runInContext(funcMatch[0], sandbox);

    const cards = Object.values(cardsDetailed);
    let matched = 0;
    let total = 0;

    for (const c of cards) {
      const eff = c.effect || '';
      if (/accel|アクセル/i.test(eff)) {
        total++;
        const res = sandbox.formatEffectKeywordsInModal(eff);
        if (res.includes('kw-accel')) {
          matched++;
        }
      }
    }

    assert.ok(matched >= 428, `Expected at least 428 cards to format with kw-accel pill, got ${matched}/${total}`);
  });

  it('3. Cost Calculation: The Silver Guardian Blade has Cost 0 Accel and can be cast with 0 Reserve cores', () => {
    const { arena } = createArenaTestEnvironment();
    const silverCard = Object.values(cardsDetailed).find(c => c.name === 'The Silver Guardian Blade');

    const state = arena.getState();
    state.player.reserve = 0; // 0 cores in reserve
    state.activePlayer = 'player';

    const check = arena.canCastAccel(silverCard, 'player');
    assert.equal(check.baseCost, 0, 'Base cost must be 0');
    assert.equal(check.cost, 0, 'Effective cost must be 0');
    assert.equal(check.allowed, true, 'Must be allowed to cast with 0 reserve cores');
  });

  it('4. Flash Timing: Accel cards with Flash timing return true in hasFlashTiming', () => {
    const { arena } = createArenaTestEnvironment();
    const silverCard = Object.values(cardsDetailed).find(c => c.name === 'The Silver Guardian Blade');

    const hasFlash = arena.hasFlashTiming(silverCard);
    assert.equal(hasFlash, true, 'The Silver Guardian Blade must have Flash timing');
  });

  it('5. Execution: Casting Accel ends Attack Step and moves card to Open Zone', () => {
    const { arena } = createArenaTestEnvironment();
    const silverCard = Object.values(cardsDetailed).find(c => c.name === 'The Silver Guardian Blade');
    const silverInstance = Object.assign({}, silverCard, { uid: 'test-silver-blade-01' });

    const state = arena.getState();
    state.player.hand = [silverInstance];
    state.player.openCards = [];
    state.player.reserve = 0;
    state.player.trash = 0;
    state.phaseIndex = 5; // ATTACK step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.activePlayer = 'opponent'; // Opponent is attacking

    arena.castAccel('test-silver-blade-01', 'player');

    // 1. Hand removed
    assert.equal(state.player.hand.length, 0, 'Card removed from hand');
    // 2. Open zone has card
    assert.equal(state.player.openCards.length, 1, 'Card moved to openCards zone');
    assert.equal(state.player.openCards[0].name, 'The Silver Guardian Blade');
    // 3. Attack step ended (transitioned to End step)
    assert.equal(state.phaseIndex, 6, 'Phase transitioned to END step immediately');
  });

  it('6. Summon from Open Zone: Cards in Open Zone can be summoned during Main Step', () => {
    const { arena } = createArenaTestEnvironment();
    const testSpirit = {
      uid: 'test-open-spirit-01',
      id: 'BS43-010',
      name: 'Test Accel Spirit',
      cost: 3,
      color: 'Red',
      type: 'Spirit',
      levels: { LV1: { level: 1, cost: 1, bp: 3000 } }
    };

    const state = arena.getState();
    state.player.openCards = [testSpirit];
    state.player.field = [];
    state.player.reserve = 5;
    state.player.trash = 0;
    state.phaseIndex = 4; // MAIN step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.activePlayer = 'player';

    arena.summonCardFromOpen('test-open-spirit-01', 'player');

    assert.equal(state.player.openCards.length, 0, 'Card removed from Open Zone');
    assert.equal(state.player.field.length, 1, 'Card placed onto Field');
    assert.equal(state.player.field[0].name, 'Test Accel Spirit');
  });

});
