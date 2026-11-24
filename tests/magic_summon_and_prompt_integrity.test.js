import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { resolveLegacyAbility } from '../engine/legacy_bridge.js';
import { createGameState, createCardInstance } from '../engine/state.js';
import { executeOp, unwrapPromptSelection } from '../engine/ops/index.js';
import { EventBus } from '../engine/events.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function createArenaEnv() {
  const elements = {};
  const storage = {};
  const toasts = [];
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
    console: { log() {}, warn() {}, error() {} },
    setTimeout() { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    showToast(msg, level) { toasts.push({ msg, level }); },
    AudioFX: {
      init() {}, coreChime() {}, playTone() {}, click() {},
      lifeDamage() {}, coreMove() {}, spiritSummon() {}, summon() {},
      slash() {}, soulCoreIgnite() {}, magic() {}, destroy() {}, draw() {}
    },
    fetch: async () => ({ ok: false, json: async () => ({}) })
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);
  return { arena: sandbox.window.BattleArena, sandbox, elements, toasts };
}

function makeFloodStream(uid = 'c_magic_1') {
  return {
    uid,
    card_number: 'SD24-014',
    cardNumber: 'SD24-014',
    name: 'Flood Stream',
    type: 'Magic',
    color: 'Blue',
    colors: ['Blue'],
    cost: 4,
    levels: {},
    effect: "[Burst: After your Life is reduced]\nDestroy any number of opposing Spirits up to a total cost of 5. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, give a Spirit/Ultimate +4000 BP."
  };
}

describe('Magic Summon Prevention & Structured Prompt Integrity', () => {
  it('1. BattleArena.openSummonModal and summonCard reject Magic and Nexus cards', () => {
    const { arena, toasts } = createArenaEnv();
    const state = arena.getState();
    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 4; // MAIN
    state.player.reserve = 6;
    state.player.trash = 0;
    state.player.soulCoreLocation = 'reserve';
    state.player.field = [];

    const magic = makeFloodStream('c_flood_1');
    const nexus = {
      uid: 'c_nexus_1',
      card_number: 'BS74-075',
      name: 'The Great Mandala Ceiling',
      type: 'Nexus',
      color: 'Blue',
      cost: 3,
      effect: '[LV1][LV2] Sample Nexus'
    };
    state.player.hand = [magic, nexus];

    // 1a. openSummonModal must refuse Magic
    arena.openSummonModal(magic.uid);
    assert.equal(arena.getPendingSummon(), null, 'openSummonModal must not open for Magic cards');
    assert.equal(state.player.field.length, 0);

    // 1b. Direct confirmed summonCard must refuse Magic
    arena.summonCard(magic.uid, 1, false, { confirmed: true, placeSoulCore: true, normalCoresToPlace: 0 });
    assert.equal(state.player.field.length, 0, 'Magic card must never enter player.field');
    assert.equal(state.player.hand.some(c => c.uid === magic.uid), true, 'Magic card must remain in hand');
    assert.equal(state.player.soulCoreLocation, 'reserve', 'Soul Core must not be moved onto a Magic card');
    assert.equal(state.player.reserve, 6, 'Reserve cores must remain untouched');

    // 1c. Headless / bypassModal summonCard must also refuse Magic
    arena.summonCard(magic.uid, 1, false, { bypassModal: true });
    assert.equal(state.player.field.length, 0, 'bypassModal summonCard must reject Magic cards');

    // 1d. summonCard must also refuse Nexus
    arena.summonCard(nexus.uid, 1, false, { confirmed: true, normalCoresToPlace: 1 });
    assert.equal(state.player.field.length, 0, 'Nexus card must not be summoned via summonCard');
    assert.ok(toasts.length > 0, 'Should show a warning toast explaining why Magic/Nexus cannot be summoned');
  });

  it('2. Engine executeOp(SUMMON / SUMMON_FREE) rejects Magic and Nexus cards', async () => {
    const state = createGameState();
    state.step = 'MAIN';
    state.activePlayer = 'player';
    state.players.player.reserve.normal = 6;
    const magicCard = createCardInstance({
      card_number: 'SD24-014',
      name: 'Flood Stream',
      type: 'Magic',
      cost: 4,
      colors: ['Blue']
    }, 'player');
    state.players.player.hand.push(magicCard);

    const events = new EventBus();
    const resHand = await executeOp(state, { op: 'SUMMON_FREE', from: 'HAND' }, {
      controller: 'player',
      sourceCard: magicCard
    }, null, events);
    assert.equal(resHand.success, false, 'Engine SUMMON_FREE from HAND must reject Magic cards');
    assert.equal(state.players.player.field.length, 0, 'Magic card must not be placed on engine field');
    assert.equal(state.players.player.hand.length, 1, 'Magic card must remain in hand');

    // Direct burst-self summon path must hit executeSummonTransaction type guard
    state.players.player.hand = [];
    state.players.player.burst = magicCard;
    const resBurst = await executeOp(state, { op: 'SUMMON_FREE', from: 'BURST', target: 'this_card' }, {
      controller: 'player',
      sourceCard: magicCard,
      activeBurstCard: magicCard
    }, null, events);
    assert.equal(resBurst.success, false, 'Engine SUMMON_FREE from BURST must reject Magic cards');
    assert.equal(resBurst.reason, 'INVALID_SUMMON_CARD_TYPE', `Expected INVALID_SUMMON_CARD_TYPE, got: ${resBurst.reason}`);
    assert.equal(state.players.player.field.length, 0, 'Burst Magic card must never be placed on engine field');
  });

  it('3. legacy_bridge bridgePrompt maps { accepted: true, selected: [legacyUid] } objects back to engine candidates', async () => {
    const floodStream = makeFloodStream('c_flood_burst');
    const oppSpirit1 = {
      uid: 'c_opp_1',
      card_number: 'BS01-001',
      name: 'Drache',
      type: 'Spirit',
      color: 'Red',
      colors: ['Red'],
      cost: 3,
      levels: [{ level: 1, cores: 1, bp: 2000 }],
      currentCores: 1,
      currentLevel: 1,
      currentBp: 2000,
      isExhausted: false,
      effect: ''
    };
    const oppSpirit2 = {
      uid: 'c_opp_2',
      card_number: 'BS01-002',
      name: 'Rokceratops',
      type: 'Spirit',
      color: 'Red',
      colors: ['Red'],
      cost: 4,
      levels: [{ level: 1, cores: 1, bp: 3000 }],
      currentCores: 1,
      currentLevel: 1,
      currentBp: 3000,
      isExhausted: false,
      effect: ''
    };
    const duel = {
      turn: 2,
      phaseIndex: 5,
      phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
      activePlayer: 'opponent',
      modifiers: [],
      player: {
        life: 4, reserve: 4, trash: 0, trashCards: [], voidCards: [],
        deck: [], hand: [], field: [], nexus: [], soulCoreLocation: 'reserve', burst: null, mirage: null
      },
      opponent: {
        life: 5, reserve: 2, trash: 0, trashCards: [], voidCards: [],
        deck: [], hand: [], field: [oppSpirit1, oppSpirit2], nexus: [], soulCoreLocation: 'reserve', burst: null, mirage: null
      }
    };

    const compiled = compileCard(floodStream);
    floodStream.compiledIr = compiled;
    const burstAbility = compiled.abilities.find(a => a.header.timing === 'BURST');
    assert.ok(burstAbility, 'Flood Stream must compile a BURST ability');

    let promptSeen = false;
    const result = await resolveLegacyAbility(duel, floodStream, burstAbility, 'player', {
      async choose(prompt) {
        promptSeen = true;
        // Exact shape returned by battle_arena.js promptStructuredDecision()
        const picked = prompt.candidates.find(c => (c.card?.uid || c.uid) === oppSpirit1.uid);
        assert.ok(picked, 'Prompt must expose legacy candidate with uid');
        return {
          accepted: true,
          selected: [picked.card.uid]
        };
      }
    });

    assert.equal(promptSeen, true, 'Prompt must be invoked for target selection');
    assert.equal(result.results[0].success, true, `Destroy clause must succeed, got: ${JSON.stringify(result.results[0])}`);
    assert.equal(duel.opponent.field.length, 1, 'Selected opposing Spirit must be destroyed and removed from field');
    assert.equal(duel.opponent.field[0].uid, oppSpirit2.uid, 'Unselected Spirit must remain on field');
    assert.equal(duel.opponent.trashCards.some(c => c.uid === oppSpirit1.uid), true, 'Destroyed Spirit must move to opponent trashCards');
  });

  it('4. legacy_bridge bridgePrompt works for Magic [Flash] BP buff via { accepted: true, selected: [uid] }', async () => {
    const floodStream = makeFloodStream('c_flood_flash');
    const alliedSpirit1 = {
      uid: 'c_ally_1', card_number: 'SD02-001', name: 'Ally Spirit 1', type: 'Spirit',
      color: 'Blue', colors: ['Blue'], cost: 2, levels: [{ level: 1, cores: 1, bp: 2000 }],
      currentCores: 1, currentLevel: 1, currentBp: 2000, isExhausted: false, effect: ''
    };
    const alliedSpirit2 = {
      uid: 'c_ally_2', card_number: 'SD02-002', name: 'Ally Spirit 2', type: 'Spirit',
      color: 'Blue', colors: ['Blue'], cost: 3, levels: [{ level: 1, cores: 1, bp: 3000 }],
      currentCores: 1, currentLevel: 1, currentBp: 3000, isExhausted: false, effect: ''
    };
    const duel = {
      turn: 1,
      phaseIndex: 5,
      phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
      activePlayer: 'player',
      modifiers: [],
      player: {
        life: 5, reserve: 4, trash: 0, trashCards: [floodStream], voidCards: [],
        deck: [], hand: [], field: [alliedSpirit1, alliedSpirit2], nexus: [], soulCoreLocation: 'reserve', burst: null, mirage: null
      },
      opponent: {
        life: 5, reserve: 4, trash: 0, trashCards: [], voidCards: [],
        deck: [], hand: [], field: [], nexus: [], soulCoreLocation: 'reserve', burst: null, mirage: null
      }
    };

    const compiled = compileCard(floodStream);
    floodStream.compiledIr = compiled;
    const flashAbility = compiled.abilities.find(a => a.header.isFlash || a.header.timing === 'FLASH');
    assert.ok(flashAbility, 'Flood Stream must compile a FLASH ability');

    let targetPrompted = false;
    const result = await resolveLegacyAbility(duel, floodStream, flashAbility, 'player', {
      async choose(prompt) {
        targetPrompted = true;
        const pick = prompt.candidates.find(c => (c.card?.uid || c.uid) === alliedSpirit2.uid);
        assert.ok(pick, 'Prompt must include alliedSpirit2');
        return { accepted: true, selected: [pick.card.uid] };
      }
    });

    assert.equal(targetPrompted, true, 'Flash BP buff must prompt player to choose a Spirit');
    assert.equal(result.success, true, `Flash BP buff must resolve cleanly, got: ${JSON.stringify(result)}`);
    assert.equal(alliedSpirit2.currentBp, 7000, 'Selected Spirit must receive +4000 BP (3000 -> 7000)');
    assert.equal(alliedSpirit1.currentBp, 2000, 'Unselected Spirit BP must remain unchanged');
  });

  it('5. BattleArena.openSacrificeModal does not throw ReferenceError in ATTACK step for Flash Magic', () => {
    const { arena } = createArenaEnv();
    const state = arena.getState();
    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 5; // ATTACK step
    state.player.reserve = 1;
    state.player.soulCoreLocation = 'trash';
    state.player.field = [{
      uid: 'c_sp_1', name: 'Test Spirit', type: 'Spirit', color: 'Blue', cost: 2,
      currentCores: 4, currentLevel: 1, currentBp: 3000, levels: [{ level: 1, cores: 1, bp: 3000 }]
    }];
    const magic = makeFloodStream('c_flood_attack');
    state.player.hand = [magic];

    assert.doesNotThrow(() => {
      arena.openSacrificeModal(magic.uid, 'flash');
    }, 'openSacrificeModal must not throw TDZ ReferenceError on isUltimate during ATTACK step');
  });

  it('6. unwrapPromptSelection normalizes arrays, { selected }, and declined prompt payloads', () => {
    assert.deepEqual(unwrapPromptSelection(['a', 'b']), ['a', 'b']);
    assert.deepEqual(unwrapPromptSelection({ accepted: true, selected: ['c_1'] }), ['c_1']);
    assert.deepEqual(unwrapPromptSelection({ accepted: false, declined: true, selected: ['c_1'] }), []);
    assert.deepEqual(unwrapPromptSelection(null), []);
  });

  it('7. Compiler splits ", then discard..." compound clauses and preserves DISCARD_HAND in overrides and shards', () => {
    const strongDraw = compileCard({
      card_number: 'SD02-017',
      name: 'Strong Draw',
      type: 'Magic',
      effect: '[Main]\nDraw three cards, then discard two cards from your Hand.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.'
    });
    const mainOps = strongDraw.abilities[0].clauses.map(c => c.op?.op);
    assert.deepEqual(mainOps, ['DRAW', 'DISCARD_HAND'], `Expected DRAW + DISCARD_HAND, got ${JSON.stringify(mainOps)}`);
    assert.equal(strongDraw.abilities[0].clauses[1].op.count, 2);

    const bakuonDraw = compileCard({
      card_number: 'BS69-089',
      name: 'Bakuon Draw',
      type: 'Magic',
      effect: '[Main]\nDraw two cards, then discard a card from your Hand.'
    });
    const bakuonOps = bakuonDraw.abilities[0].clauses.map(c => c.op?.op);
    assert.deepEqual(bakuonOps, ['DRAW', 'DISCARD_HAND']);
  });
});
