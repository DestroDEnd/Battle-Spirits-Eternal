import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Import engine keywords directly
import { ViolentHighSpeedKeyword } from '../engine/keywords/wave2.js';
import { ImmortalityKeyword } from '../engine/keywords/wave4.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function createArenaTestEnvironment() {
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
    console: { log() {}, warn() {}, error() {} },
    setTimeout(fn) { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    AudioFX: {
      init() {}, coreChime() {}, playTone() {}, click() {},
      lifeDamage() {}, coreMove() {}, spiritSummon() {}, summon() {},
      slash() {}, soulCoreIgnite() {}, refresh() {}
    },
    fetch: async () => ({ ok: false, json: async () => ({}) })
  };
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);

  return { arena: sandbox.window.BattleArena, sandbox, elements };
}

describe('Free Summon Without Paying Cost Suite', () => {

  it('1. Engine ViolentHighSpeedKeyword: Ultimate-Seiryubi summons for 0 cost with 5+ trash cores', async () => {
    const mockGame = {
      state: {
        players: {
          player: {
            hand: [{ id: 'BS28-X05', name: 'Ultimate-Seiryubi', cost: 8, color: 'Green', type: 'Ultimate' }],
            field: [{ top: { id: 'TEST-ULT', name: 'Test Green Ultimate', color: 'Green', type: 'Ultimate' }, cores: { normal: 2, soul: 0 } }],
            trash: { normal: 5, soul: 0 },
            reserve: { normal: 3, soul: 0 }
          }
        }
      },
      events: { emit: async () => {} }
    };

    const seiryubi = mockGame.state.players.player.hand[0];
    const res = await ViolentHighSpeedKeyword.executeViolentHighSpeedSummon(mockGame, seiryubi, 'player');

    assert.equal(res.success, true);
    const p = mockGame.state.players.player;
    assert.equal(p.hand.length, 0);
    assert.equal(p.field.length, 2);
    assert.equal(p.trash.normal, 0);
    assert.equal(p.reserve.normal, 7); // 3 + (5 - 1) = 7
    const summonedStack = p.field.find(st => st.top.id === 'BS28-X05');
    assert.ok(summonedStack);
    assert.equal(summonedStack.cores.normal, 1);
  });

  it('2. Engine ImmortalityKeyword: BS01-X02 Revives matching cost spirit from Trash without paying cost', async () => {
    const immortalityCard = {
      id: 'BS01-X02',
      name: 'The DemonKing Beelzebeat',
      cost: 8,
      type: 'Spirit',
      effect: '[LV1][LV2][LV3] [Immortality: Cost 6/7] (When Destroyed)'
    };
    const destroyedCost6 = { id: 'BS01-020', name: 'Hitodem', cost: 6, type: 'Spirit' };
    assert.equal(ImmortalityKeyword.canReviveOnDestruction(destroyedCost6, immortalityCard), true);

    const mockGame = {
      state: {
        players: {
          player: {
            grave: [immortalityCard],
            field: [],
            reserve: { normal: 3, soul: 0 }
          }
        }
      },
      events: { emit: async () => {} }
    };

    const reviveRes = await ImmortalityKeyword.executeRevival(mockGame, immortalityCard, 'player', 1);
    assert.equal(reviveRes.success, true);
    const p = mockGame.state.players.player;
    assert.equal(p.grave.length, 0);
    assert.equal(p.field.length, 1);
    assert.equal(p.reserve.normal, 2);
  });

  it('3. Arena UI: Ultimate-Seiryubi detects Violent High Speed in Attack Step and does NOT ask for 7 cores', () => {
    const { arena, elements } = createArenaTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 5; // ATTACK step

    state.player.reserve = 3;
    state.player.trash = 5;
    state.player.count = 0;
    state.player.life = 4;

    // Player field has a Green Ultimate to satisfy Seiryubi's summon condition:
    // [Summon Condition: You control one or more Green Ultimates]
    state.player.field = [
      {
        uid: 'unit_green_ult_1',
        card_number: 'SD65-004',
        name: 'The Hellwind FourDemonLord Metallifer',
        color: 'Green',
        type: 'Ultimate',
        currentCores: 3,
        currentLevel: 4,
        currentBp: 20000,
        symbols: ['Green']
      }
    ];

    const seiryubiCard = {
      uid: 'hand_seiryubi_1',
      card_number: 'BS28-X05',
      name: 'Ultimate-Seiryubi',
      color: 'Green',
      type: 'Ultimate',
      cost: 8,
      symbols: ['Green'],
      levels: {
        "3": { cores: 1, bp: 10000 },
        "4": { cores: 3, bp: 17000 }
      },
      effect: '[Summon Condition: You control one or more Green Ultimates]\nFlash - [Violent High Speed] (Either Attack Step)\nIf there are five or more cores in your Trash, by sending all the cores from your Trash to the Field/Reserve, summon this card from the Hand, without paying the cost.\n[Ultimate Trigger: [LV4] (When Attacks/Blocks)] When Ultimate Trigger hits, exhaust an opposing Spirit/Ultimate.'
    };

    state.player.hand = [seiryubiCard];

    // Check free summon eligibility
    assert.ok(typeof arena.checkCardFreeSummonEligibility === 'function', 'checkCardFreeSummonEligibility helper exists');
    const freeEligibility = arena.checkCardFreeSummonEligibility(seiryubiCard, 'player');
    assert.equal(freeEligibility.eligible, true, 'Ultimate-Seiryubi is eligible for free summon');
    assert.equal(freeEligibility.type, 'VIOLENT_HIGH_SPEED');

    // Render player hand and inspect rendered button
    arena.renderPlayerHand();
    const handContainer = elements['playerHand'];
    assert.ok(handContainer, 'playerHand element exists');
    const handHtml = handContainer.innerHTML;

    // Verify it does NOT demand sacrifice or show 7 cores
    assert.ok(!handHtml.includes('Sac &amp; Flash Summon (7)'), 'Does NOT ask for sacrifice of 7 cores');
    assert.ok(!handHtml.includes('Sac &amp; Summon (7)'), 'Does NOT ask for sacrifice');
    assert.ok(handHtml.includes('Free') || handHtml.includes('executeFreeSummon'), 'Renders Free summon button');

    // Execute the free summon
    arena.executeFreeSummon(seiryubiCard.uid, 'player');

    // Verify state after free summon
    assert.equal(state.player.hand.length, 0, 'Card removed from hand');
    assert.equal(state.player.field.length, 2, 'Card placed on field');
    assert.equal(state.player.trash, 0, 'Trash emptied');
    assert.equal(state.player.reserve, 7, '4 cores from trash added to reserve (3 + 4 = 7)');

    const summonedOnField = state.player.field.find(s => s.uid === seiryubiCard.uid);
    assert.ok(summonedOnField, 'Ultimate-Seiryubi is on field');
    assert.equal(summonedOnField.currentCores, 1, 'Has 1 core allocated from Trash to sustain LV3');
    assert.equal(summonedOnField.currentLevel, 3, 'Level 3 active');
    assert.equal(summonedOnField.currentBp, 10000, '10000 BP');
  });

  it('4. Arena UI: Flash Count Free Summon (SD65-004 Nouvelle-Vague) summons for 0 cost when count >= 1', () => {
    const { arena, elements } = createArenaTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 5; // ATTACK step
    state.player.count = 2; // Count >= 1
    state.player.reserve = 2;
    state.player.trash = 0;

    // Field has Green Ultimate to satisfy summon condition
    state.player.field = [
      {
        uid: 'green_ult_0',
        name: 'The Hellwind FourDemonLord',
        color: 'Green',
        type: 'Ultimate',
        currentCores: 2
      }
    ];

    const nouvelleVague = {
      uid: 'hand_nouvelle_1',
      card_number: 'SD65-004',
      name: 'The HellwindCount Nouvelle-Vague',
      color: 'Green',
      type: 'Ultimate',
      cost: 4,
      symbols: ['Green'],
      levels: {
        "3": { cores: 1, bp: 6000 },
        "4": { cores: 2, bp: 10000 }
      },
      effect: '[Summon Condition: You control one or more Green/Purple Ultimates]\nFlash - (Either Attack Step)\nWhen you have one or more counters, you can summon this Ultimate card from your Hand, without paying the cost.'
    };

    state.player.hand = [nouvelleVague];

    const freeEligibility = arena.checkCardFreeSummonEligibility(nouvelleVague, 'player');
    assert.equal(freeEligibility.eligible, true);
    assert.equal(freeEligibility.type, 'FLASH_COUNT_FREE');

    arena.executeFreeSummon(nouvelleVague.uid, 'player');
    assert.equal(state.player.hand.length, 0);
    assert.equal(state.player.field.length, 2);
    // 0 cost paid, 1 core allocated from reserve to sustain LV3
    assert.equal(state.player.reserve, 1);
  });

  it('5. Arena UI: Discard Hand Free Summon (SD41-002 Mistwurm) discards 2 cards and summons for 0 cost', () => {
    const { arena } = createArenaTestEnvironment();
    const state = arena.getState();

    state.inDuel = true;
    state.activePlayer = 'player';
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.phaseIndex = 5; // ATTACK step
    state.player.reserve = 2;

    const mistwurm = {
      uid: 'hand_mist_1',
      card_number: 'SD41-002',
      name: 'The MakaiFogDragon Mistwurm',
      color: 'Purple',
      type: 'Spirit',
      cost: 2,
      levels: { "1": { cores: 1, bp: 2000 } },
      effect: 'Flash - (Either Attack Step)\n(Once per Turn: Same Name) By discarding two cards from your Hand, summon this card from your Hand/Trash, without paying the cost.'
    };

    const fodder1 = { uid: 'fodder_1', name: 'Fodder 1', cost: 1 };
    const fodder2 = { uid: 'fodder_2', name: 'Fodder 2', cost: 1 };

    state.player.hand = [mistwurm, fodder1, fodder2];

    const freeEligibility = arena.checkCardFreeSummonEligibility(mistwurm, 'player');
    assert.equal(freeEligibility.eligible, true);
    assert.equal(freeEligibility.type, 'FLASH_DISCARD_FREE');

    arena.executeFreeSummon(mistwurm.uid, 'player');
    assert.equal(state.player.hand.length, 0, 'Mistwurm and 2 fodders removed from hand');
    assert.equal(state.player.grave.length, 2, '2 fodder cards discarded to grave');
    assert.equal(state.player.field.length, 1, 'Mistwurm on field');
  });

});
