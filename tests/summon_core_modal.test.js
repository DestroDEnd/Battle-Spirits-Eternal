/**
 * tests/summon_core_modal.test.js
 *
 * Comprehensive Automated Regression Test Suite for:
 * 1. Summon Cost Payment & Core Allocation Modal (BattleArena.openSummonModal, renderSummonModal, confirmSummonPayment)
 * 2. Player-controlled Soul Core selection:
 *    - Option A: Pay summon cost with Normal Cores Only (preserving Soul Core safe from Trash)
 *    - Option A Sub: Place [Soul Core] on newly summoned Spirit (enters field with Soul Core active)
 *    - Option B: Pay summon cost with [Soul Core] (sends Soul Core to Trash as 1 cost core)
 * 3. Interactive core steppers for higher Spirit levels and field core reallocation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function createModalTestEnvironment() {
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
      summon() {},
      slash() {},
      soulCoreIgnite() {}
    },
    fetch: async () => ({ ok: false, json: async () => ({}) })
  };
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);

  return { arena: sandbox.window.BattleArena, sandbox, elements };
}

describe('Summon Cost Payment & Core Allocation Modal Suite', () => {

  it('1. Golza Scenario: User pays 3 normal cores for cost and places Soul Core on Golza', () => {
    const { arena, sandbox, elements } = createModalTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 4; // MAIN step

    state.player.reserve = 3;
    state.player.trash = 0;
    state.player.soulCoreLocation = 'reserve';
    state.player.soulCoreSpiritUid = null;

    // Field: Top Buddy Aibou (Red symbol)
    const aibou = {
      uid: 'p-aibou-1',
      cardNumber: 'BS60-CX01',
      name: 'Top Buddy, Aibou',
      cost: 1,
      color: 'Red',
      type: 'Contract Spirit',
      symbol: 'Red',
      currentCores: 1,
      currentLevel: 1,
      currentBp: 3000,
      isExhausted: false,
      hasAttacked: false,
      hasSoulCore: false,
      levels: [{ level: 1, cores: 1, bp: 3000 }]
    };
    state.player.field = [aibou];

    // Hand: The SuperAncient Kaiju Golza (Cost 4, reduced to 3 via Aibou's Red symbol)
    const golza = {
      uid: 'p-golza-1',
      cardNumber: 'SD01-004',
      name: 'The SuperAncient Kaiju Golza',
      cost: 4,
      color: 'Red',
      type: 'Spirit',
      symbol: 'Red',
      levels: [
        { level: 1, cost: 1, bp: 4000 },
        { level: 2, cost: 3, bp: 7000 },
        { level: 3, cost: 5, bp: 9000 }
      ],
      effect: '[LV1][LV2][LV3] Clash'
    };
    state.player.hand = [golza];

    // Player clicks summon on Golza -> opens modal
    arena.openSummonModal(golza.uid);

    const pending = arena.getPendingSummon();
    assert.ok(pending, 'pendingSummon state must be initialized');
    assert.equal(pending.card.name, 'The SuperAncient Kaiju Golza');
    assert.equal(pending.cost, 3, 'Effective cost should be reduced from 4 to 3 via Aibou symbol');
    assert.equal(pending.payWithSoulCore, false, 'Default should preserve Soul Core');
    assert.equal(pending.placeSoulCoreOnSpirit, true, 'Default should place Soul Core onto the summoned unit');
    assert.equal(pending.normalCoresToPlace, 0, 'Normal cores placed can be 0 because Soul Core sustains the unit');

    // Confirm summon
    arena.confirmSummonPayment();

    // Verify Golza on field
    assert.equal(state.player.field.length, 2, 'Both Aibou and Golza must be on field');
    const fieldGolza = state.player.field.find(s => s.uid === golza.uid);
    assert.ok(fieldGolza, 'Golza must be on field');
    assert.equal(fieldGolza.hasSoulCore, true, 'Golza must have Soul Core placed on him');
    assert.equal(fieldGolza.currentCores, 1, 'Golza must have 1 core (the Soul Core)');
    assert.equal(fieldGolza.currentLevel, 1, 'Golza must be Level 1');
    assert.equal(fieldGolza.currentBp, 5000, 'Golza BP must be 4000 base + 1000 Soul Core bonus = 5000');

    // Verify Soul Core location
    assert.equal(state.player.soulCoreLocation, 'field', 'Soul Core must be located on the field');
    assert.equal(state.player.soulCoreSpiritUid, golza.uid, 'Soul Core must belong to Golza');

    // Verify Reserve & Trash
    assert.equal(state.player.reserve, 0, '3 normal cores from Reserve were spent for summon cost');
    assert.equal(state.player.trash, 3, 'Trash must contain exactly 3 normal cores');
    assert.equal(state.player.hand.length, 0, 'Golza must be removed from hand');
  });

  it('2. Option B: User explicitly chooses to pay summon cost with [Soul Core]', () => {
    const { arena } = createModalTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 4;

    state.player.reserve = 3;
    state.player.trash = 0;
    state.player.soulCoreLocation = 'reserve';
    state.player.soulCoreSpiritUid = null;

    const golza = {
      uid: 'p-golza-2',
      cardNumber: 'SD01-004',
      name: 'The SuperAncient Kaiju Golza',
      cost: 3,
      color: 'Red',
      type: 'Spirit',
      levels: [
        { level: 1, cores: 1, bp: 4000 },
        { level: 2, cores: 3, bp: 7000 }
      ]
    };
    state.player.hand = [golza];
    state.player.field = [];

    arena.openSummonModal(golza.uid);

    // User chooses Option B: Pay 1 cost with Soul Core
    arena.setSummonSoulCorePayment(true);
    const pending = arena.getPendingSummon();
    assert.equal(pending.payWithSoulCore, true);
    assert.equal(pending.placeSoulCoreOnSpirit, false, 'Cannot place Soul Core on spirit if paid as cost to trash');
    assert.equal(pending.normalCoresToPlace, 1, 'Normal cores placed must be at least 1');

    arena.confirmSummonPayment();

    const fieldGolza = state.player.field.find(s => s.uid === golza.uid);
    assert.ok(fieldGolza);
    assert.equal(fieldGolza.hasSoulCore, false, 'Golza must NOT have Soul Core because it was spent as cost');
    assert.equal(fieldGolza.currentCores, 1, 'Golza has 1 normal core');
    assert.equal(state.player.soulCoreLocation, 'trash', 'Soul Core must be in Trash');
    assert.equal(state.player.reserve, 0, 'Reserve has 0 normal cores left (3 initial - 2 cost - 1 placed on spirit)');
    assert.equal(state.player.trash, 2, 'Trash has 2 normal cores (Soul Core tracked in soulCoreLocation)');
  });

  it('3. Multi-Core Placement: Summoning Golza at Level 2 with Soul Core + 2 Normal Cores', () => {
    const { arena } = createModalTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 4;

    state.player.reserve = 6;
    state.player.trash = 0;
    state.player.soulCoreLocation = 'reserve';

    const golza = {
      uid: 'p-golza-3',
      cardNumber: 'SD01-004',
      name: 'The SuperAncient Kaiju Golza',
      cost: 3,
      color: 'Red',
      type: 'Spirit',
      levels: [
        { level: 1, cores: 1, bp: 4000 },
        { level: 2, cores: 3, bp: 7000 },
        { level: 3, cores: 5, bp: 9000 }
      ]
    };
    state.player.hand = [golza];
    state.player.field = [];

    arena.openSummonModal(golza.uid);

    // Keep Soul Core on Golza and increase stepper to 2 normal cores (total = 1 Soul Core + 2 normal = 3 cores)
    arena.setSummonSoulCorePayment(false);
    arena.setSummonSoulCorePlacement(true);
    arena.adjustSummonPlacement(2);

    const pending = arena.getPendingSummon();
    assert.equal(pending.normalCoresToPlace, 2);

    arena.confirmSummonPayment();

    const fieldGolza = state.player.field.find(s => s.uid === golza.uid);
    assert.ok(fieldGolza);
    assert.equal(fieldGolza.hasSoulCore, true);
    assert.equal(fieldGolza.currentCores, 3, 'Golza must have 3 cores (1 Soul Core + 2 Normal)');
    assert.equal(fieldGolza.currentLevel, 2, 'Golza must reach Level 2');
    assert.equal(fieldGolza.currentBp, 8000, 'Golza BP must be 7000 base + 1000 Soul Core bonus = 8000');

    // Reserve had 6 cores: 3 paid for cost + 2 placed on Golza = 5 cores used.
    assert.equal(state.player.reserve, 1, '1 normal core remains in Reserve');
    assert.equal(state.player.soulCoreLocation, 'field');
  });

  it('4. Field Cores Reallocation: Move cores from field spirit to pay summon cost', () => {
    const { arena } = createModalTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 4;

    // Player only has 1 normal core and 1 Soul Core in Reserve
    state.player.reserve = 1;
    state.player.trash = 0;
    state.player.soulCoreLocation = 'reserve';

    const supporter = {
      uid: 'p-supporter-1',
      name: 'The Infantry Dragron',
      cost: 1,
      symbol: 'None',
      currentCores: 3,
      currentLevel: 2,
      currentBp: 2000,
      levels: [
        { level: 1, cores: 1, bp: 1000 },
        { level: 2, cores: 2, bp: 2000 }
      ]
    };
    state.player.field = [supporter];

    const golza = {
      uid: 'p-golza-4',
      name: 'The SuperAncient Kaiju Golza',
      cost: 3,
      levels: [
        { level: 1, cores: 1, bp: 4000 }
      ]
    };
    state.player.hand = [golza];

    arena.openSummonModal(golza.uid);

    // Preallocation already allocated 2 cores from supporter to cover deficit (3 cost - 1 reserve = 2 needed)
    const pending = arena.getPendingSummon();
    assert.equal(pending.fieldAllocations[supporter.uid], 2, 'Deficit of 2 cores must be auto-preallocated from supporter');

    arena.confirmSummonPayment();

    // Supporter had 3 cores, gave up 2, survives with 1
    assert.equal(supporter.currentCores, 1);
    assert.equal(supporter.currentLevel, 1);

    // Golza on field with Soul Core
    const fieldGolza = state.player.field.find(s => s.uid === golza.uid);
    assert.ok(fieldGolza);
    assert.equal(fieldGolza.hasSoulCore, true);
    assert.equal(fieldGolza.currentCores, 1);

    // Reserve is 0, Trash is 3
    assert.equal(state.player.reserve, 0);
    assert.equal(state.player.trash, 3);
  });

  it('5. Field Spirit Depletion: Taking all cores from field spirit depletes it to Trash', () => {
    const { arena } = createModalTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 4;

    state.player.reserve = 2;
    state.player.trash = 0;
    state.player.soulCoreLocation = 'reserve';

    const sacrificialSpirit = {
      uid: 'p-sac-1',
      name: 'Weak Soldier',
      currentCores: 1,
      currentLevel: 1,
      currentBp: 1000,
      levels: [{ level: 1, cost: 1, bp: 1000 }]
    };
    state.player.field = [sacrificialSpirit];

    const golza = {
      uid: 'p-golza-5',
      name: 'The SuperAncient Kaiju Golza',
      cost: 3,
      levels: [{ level: 1, cost: 1, bp: 4000 }]
    };
    state.player.hand = [golza];

    arena.openSummonModal(golza.uid);
    arena.adjustSummonFieldCore(sacrificialSpirit.uid, 1);
    arena.confirmSummonPayment();

    // Sacrificial spirit reached 0 cores and must be removed from field
    const remainingSac = state.player.field.find(s => s.uid === sacrificialSpirit.uid);
    assert.equal(remainingSac, undefined, 'Depleted spirit must be removed from field');
  });

});
