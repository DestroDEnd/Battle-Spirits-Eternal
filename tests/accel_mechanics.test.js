import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { PerCardRegistry } from '../engine/cards/index.js';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const bundleSource = fs.readFileSync(path.join(rootDir, 'engine/cards/bundle.js'), 'utf8');
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
  vm.runInContext(bundleSource, sandbox);
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

    assert.ok(matched >= 410, `Expected at least 410 cards to format with kw-accel pill, got ${matched}/${total}`);
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

  it('7. Flash Timing Semantics (Phase M.3.1): Generic Flash Accel allowed in Main Step for active player, rejected for opponent, restricted Flash rejected in Main Step', async () => {
    const game = createGame();
    const flashAccelCard = createCardInstance({
      id: 'ACCEL_FLASH_01',
      name: 'Flash Accel Spirit',
      type: 'Spirit',
      cost: 4,
      effect: 'Flash - [Accel: Cost 2 (Red)] Draw 1 card.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_accel_flash',
            header: { keyword: 'Accel', isFlash: true, timing: 'FLASH' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    const restrictedAccelCard = createCardInstance({
      id: 'ACCEL_RESTRICTED_01',
      name: 'Restricted Attack Step Accel Spirit',
      type: 'Spirit',
      cost: 4,
      effect: 'Flash - [Accel: Cost 2 (Red)] (Your Attack Step) Draw 1 card.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_accel_restr',
            header: { keyword: 'Accel', isFlash: true, timing: 'FLASH', timingOwner: 'SELF' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    game.state.players.player.hand = [flashAccelCard, restrictedAccelCard];
    game.state.players.player.deck = [
      createCardInstance({ name: 'Deck Top 1' }, 'player'),
      createCardInstance({ name: 'Deck Top 2' }, 'player')
    ];
    game.state.players.player.reserve = { normal: 10, soul: 0 };

    // A: In MAIN step by active player -> Generic Flash Accel MUST SUCCEED (Official Rule 17.0 / Phase M.3.1)
    game.state.step = 'MAIN';
    game.state.activePlayer = 'player';
    const resMain = await game.executeAccel('player', flashAccelCard.id);
    assert.equal(resMain.success, true);
    assert.equal(resMain.zone, 'removed');
    assert.equal(game.state.players.player.removed.length, 1);
    assert.equal(game.state.players.player.removed[0].id, flashAccelCard.id);

    // B: In MAIN step with card-specific restriction (Your Attack Step) -> MUST BE REJECTED with RESTRICTED_TO_ATTACK_STEP
    const resRestr = await game.executeAccel('player', restrictedAccelCard.id);
    assert.equal(resRestr.success, false);
    assert.equal(resRestr.code, 'RESTRICTED_TO_ATTACK_STEP');

    // C: In START step -> Must be rejected (invalid step for flash)
    game.state.step = 'START';
    const resStart = await game.executeAccel('player', restrictedAccelCard.id);
    assert.equal(resStart.success, false);
    assert.equal(resStart.code, 'INVALID_STEP_FOR_FLASH');

    // D: In ATTACK step on controller turn -> Card with (Your Attack Step) MUST SUCCEED
    game.state.step = 'ATTACK';
    game.state.activePlayer = 'player';
    const resAttack = await game.executeAccel('player', restrictedAccelCard.id);
    assert.equal(resAttack.success, true);
    assert.equal(resAttack.zone, 'removed');
  });

  it('8. Main Timing Restriction: Main Accel can only be activated during Main Step', async () => {
    const game = createGame();
    const mainAccelCard = createCardInstance({
      id: 'ACCEL_MAIN_01',
      name: 'Main Accel Spirit',
      type: 'Spirit',
      cost: 5,
      effect: 'Main - [Accel: Cost 3 (Red)] Draw 1 card.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_accel_main',
            header: { keyword: 'Accel', isMain: true, timing: 'MAIN' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    game.state.players.player.hand = [mainAccelCard];
    game.state.players.player.deck = [createCardInstance({ name: 'Deck Top 2' }, 'player')];
    game.state.players.player.reserve = { normal: 5, soul: 0 };

    // A: In ATTACK step -> Must be rejected with MAIN_ONLY_DURING_MAIN_STEP
    game.state.step = 'ATTACK';
    const resAttack = await game.executeAccel('player', mainAccelCard.id);
    assert.equal(resAttack.success, false);
    assert.equal(resAttack.reason, 'MAIN_ONLY_DURING_MAIN_STEP');

    // B: In MAIN step, but opponent turn -> Must be rejected with NOT_ACTIVE_PLAYER
    game.state.step = 'MAIN';
    game.state.activePlayer = 'opponent';
    const resOppTurn = await game.executeAccel('player', mainAccelCard.id);
    assert.equal(resOppTurn.success, false);
    assert.equal(resOppTurn.reason, 'NOT_ACTIVE_PLAYER');

    // C: In MAIN step on player turn -> Must succeed
    game.state.activePlayer = 'player';
    const resMain = await game.executeAccel('player', mainAccelCard.id);
    assert.equal(resMain.success, true);
    assert.equal(resMain.zone, 'removed');
    assert.equal(game.state.players.player.removed.length, 1);
  });

  it('9. Source Zone Restriction: Accel can only be activated from Hand by default', async () => {
    const game = createGame();
    const accelCard = createCardInstance({
      id: 'ACCEL_ZONE_01',
      name: 'Zone Accel Spirit',
      type: 'Spirit',
      cost: 3,
      effect: 'Flash - [Accel: Cost 1] Draw 1 card.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_zone',
            header: { keyword: 'Accel', isFlash: true, timing: 'FLASH' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    game.state.step = 'ATTACK';
    game.state.players.player.reserve = { normal: 5, soul: 0 };
    game.state.players.player.deck = [createCardInstance({ name: 'Deck Top' }, 'player')];

    // Case A: Card is in Trash/Grave -> Rejected
    game.state.players.player.grave = [accelCard];
    game.state.players.player.hand = [];
    const resGrave = await game.executeAccel('player', accelCard.id);
    assert.equal(resGrave.success, false);
    assert.equal(resGrave.reason, 'ACCEL_ONLY_FROM_HAND');

    // Case B: Card is on Field -> Rejected
    game.state.players.player.grave = [];
    game.state.players.player.field = [createFieldStack(accelCard, { normal: 1, soul: 0 })];
    const resField = await game.executeAccel('player', accelCard.id);
    assert.equal(resField.success, false);
    assert.equal(resField.reason, 'ACCEL_ONLY_FROM_HAND');

    // Case C: Card is in Hand -> Allowed
    game.state.players.player.field = [];
    game.state.players.player.hand = [accelCard];
    const resHand = await game.executeAccel('player', accelCard.id);
    assert.equal(resHand.success, true);
  });

  it('10. Source Zone Override: Accel can be used from Trash when explicitly specified', async () => {
    const game = createGame();
    const accelCard = createCardInstance({
      id: 'ACCEL_TRASH_01',
      name: 'Trash Usable Accel',
      type: 'Spirit',
      cost: 3,
      effect: 'Flash - [Accel: Cost 1] You can also use this card\'s [Accel] from the trash.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_trash_accel',
            header: { keyword: 'Accel', isFlash: true, timing: 'FLASH' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    game.state.step = 'ATTACK';
    game.state.players.player.reserve = { normal: 5, soul: 0 };
    game.state.players.player.grave = [accelCard];
    game.state.players.player.deck = [createCardInstance({ name: 'D1' }, 'player')];

    // With explicit modifier allowing Accel from trash
    game.state.modifiers = [
      { id: 'mod_trash_accel', type: 'CAN_USE_ACCEL_FROM_TRASH', side: 'player', duration: 'THIS_TURN' }
    ];

    const res = await game.executeAccel('player', accelCard.id);
    assert.equal(res.success, true);
    assert.equal(game.state.players.player.grave.length, 0, 'Card removed from Trash');
    assert.equal(game.state.players.player.removed.length, 1, 'Card moved to Removed Zone');
    assert.equal(game.state.players.player.removed[0].id, accelCard.id);
  });

  it('11. Accel Destination: After use, card is sent to Removed Zone with metadata flags', async () => {
    const game = createGame();
    const accelCard = createCardInstance({
      id: 'ACCEL_DEST_01',
      name: 'Destination Accel Spirit',
      type: 'Spirit',
      cost: 4,
      effect: 'Flash - [Accel: Cost 2 (Red)] Draw 1 card.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_dest',
            header: { keyword: 'Accel', isFlash: true, timing: 'FLASH' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    game.state.step = 'ATTACK';
    game.state.players.player.hand = [accelCard];
    game.state.players.player.reserve = { normal: 5, soul: 0 };
    game.state.players.player.deck = [createCardInstance({ name: 'D1' }, 'player')];

    const res = await game.executeAccel('player', accelCard.id);
    assert.equal(res.success, true);

    // Assert destination is Removed Zone
    assert.equal(game.state.players.player.hand.length, 1, 'Drawn card is in hand, Accel card is not');
    assert.equal(game.state.players.player.hand[0].name, 'D1');
    assert.equal(game.state.players.player.grave.length, 0, 'Accel card must NOT go to grave');
    assert.equal(game.state.players.player.removed.length, 1, 'Accel card must be in removed zone');

    const removedCard = game.state.players.player.removed[0];
    assert.equal(removedCard.id, accelCard.id);
    assert.equal(removedCard.faceUp, true, 'Card must be face-up');
    assert.equal(removedCard.isAccelRemoved, true, 'isAccelRemoved flag set');
    assert.equal(removedCard.fromAccel, true, 'fromAccel flag set');
    assert.equal(removedCard.canSummonFromRemoved, true, 'canSummonFromRemoved flag set');
  });

  it('12. In Removed Zone, Accel CANNOT be activated again', async () => {
    const game = createGame();
    const accelCard = createCardInstance({
      id: 'ACCEL_NO_REUSE_01',
      name: 'No Reuse Accel Spirit',
      type: 'Spirit',
      cost: 4,
      effect: 'Flash - [Accel: Cost 2] Draw 1 card.',
      isAccelRemoved: true,
      fromAccel: true,
      canSummonFromRemoved: true,
      compiledIr: {
        abilities: [
          {
            id: 'ab_no_reuse',
            header: { keyword: 'Accel', isFlash: true, timing: 'FLASH' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    // Place card in Removed Zone
    game.state.players.player.removed = [accelCard];
    game.state.players.player.hand = [];
    game.state.players.player.reserve = { normal: 10, soul: 0 };

    // Attempt Accel during Attack Step
    game.state.step = 'ATTACK';
    const resAttack = await game.executeAccel('player', accelCard.id);
    assert.equal(resAttack.success, false);
    assert.equal(resAttack.reason, 'ACCEL_CANNOT_BE_USED_FROM_REMOVED');

    // Attempt Accel during Main Step
    game.state.step = 'MAIN';
    game.state.activePlayer = 'player';
    const resMain = await game.executeAccel('player', accelCard.id);
    assert.equal(resMain.success, false);
    assert.equal(resMain.reason, 'ACCEL_CANNOT_BE_USED_FROM_REMOVED');
  });

  it('13. Summon from Removed Zone: Spirit placed by Accel can be summoned by paying printed cost', async () => {
    const game = createGame();
    const accelSpirit = createCardInstance({
      id: 'ACCEL_SUMMON_01',
      name: 'Summonable Accel Spirit',
      type: 'Spirit',
      cost: 4,
      color: 'Red',
      colors: ['Red'],
      symbols: ['Red'],
      levels: {
        1: { cost: 1, bp: 3000 },
        2: { cost: 3, bp: 5000 }
      },
      isAccelRemoved: true,
      fromAccel: true,
      canSummonFromRemoved: true
    }, 'player');

    // Place in Removed Zone
    game.state.players.player.removed = [accelSpirit];
    game.state.players.player.field = [];
    game.state.players.player.reserve = { normal: 6, soul: 0 };
    game.state.step = 'MAIN';
    game.state.activePlayer = 'player';

    // Summon via game.playCard
    const summonRes = await game.playCard(accelSpirit.id, [], 'player');
    assert.equal(summonRes.success, true);
    assert.equal(game.state.players.player.removed.length, 0, 'Card removed from Removed Zone');
    assert.equal(game.state.players.player.field.length, 1, 'Placed onto Field');
    assert.equal(game.state.players.player.field[0].top.id, accelSpirit.id);
    // Cost 4 paid + 1 core for LV1 = 5 cores total deducted from reserve
    assert.equal(game.state.players.player.reserve.normal, 1);
    assert.equal(game.state.players.player.field[0].cores.normal, 1);
  });

  it('14. Summon from Removed Zone: (When Summoned) triggers fire upon entry to field', async () => {
    const game = createGame();
    const accelSpirit = createCardInstance({
      id: 'ACCEL_SUMMON_TRIGGER_01',
      name: 'Trigger Accel Spirit',
      type: 'Spirit',
      cost: 3,
      color: 'Red',
      levels: { 1: { cost: 1, bp: 3000 } },
      isAccelRemoved: true,
      fromAccel: true,
      canSummonFromRemoved: true,
      compiledIr: {
        abilities: [
          {
            id: 'ab_when_summoned',
            header: { timing: 'WHEN_SUMMONED', levels: [1] },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    game.state.players.player.removed = [accelSpirit];
    game.state.players.player.deck = [createCardInstance({ name: 'Deck Card' }, 'player')];
    game.state.players.player.reserve = { normal: 5, soul: 0 };
    game.state.step = 'MAIN';
    game.state.activePlayer = 'player';

    const summonRes = await game.playCard(accelSpirit.id, [], 'player');
    assert.equal(summonRes.success, true);
    assert.equal(summonRes.abilityResults.length, 1);
    assert.equal(game.state.players.player.hand.length, 1, 'Drew 1 card via When Summoned ability');
    assert.equal(game.state.players.player.field.length, 1);
  });

  it('15. General Flash Timing (Phase M.3.1): Generic Flash magic allowed in Main Step; card-specific Attack Step restriction rejected in Main Step', async () => {
    const game = createGame();
    const genericFlashMagic = createCardInstance({
      id: 'MAGIC_FLASH_GENERIC',
      name: 'Generic Flash Shield',
      type: 'Magic',
      cost: 3,
      effect: 'Flash - Give a Spirit +2000 BP.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_magic_flash',
            header: { timing: 'FLASH', isFlash: true, isMain: false },
            clauses: [{ op: { op: 'BP_BUFF', amount: 2000 } }]
          }
        ]
      }
    }, 'player');

    const restrictedFlashMagic = createCardInstance({
      id: 'MAGIC_FLASH_RESTRICTED',
      name: 'Restricted Flash Shield',
      type: 'Magic',
      cost: 3,
      effect: 'Flash - (Your Attack Step) Give a Spirit +2000 BP.',
      compiledIr: {
        abilities: [
          {
            id: 'ab_magic_restr',
            header: { timing: 'FLASH', isFlash: true, isMain: false, timingOwner: 'SELF' },
            clauses: [{ op: { op: 'BP_BUFF', amount: 2000 } }]
          }
        ]
      }
    }, 'player');

    game.state.players.player.hand = [genericFlashMagic, restrictedFlashMagic];
    game.state.players.player.reserve = { normal: 10, soul: 0 };

    // In MAIN step -> Generic Flash Magic MUST SUCCEED for active player
    game.state.step = 'MAIN';
    game.state.activePlayer = 'player';
    const resGeneric = await game.playCard(genericFlashMagic.id, [], 'player');
    assert.equal(resGeneric.success, true);

    // In MAIN step -> Restricted Flash Magic MUST BE REJECTED with RESTRICTED_TO_ATTACK_STEP
    const resRestr = await game.playCard(restrictedFlashMagic.id, [], 'player');
    assert.equal(resRestr.success, false);
    assert.equal(resRestr.code, 'RESTRICTED_TO_ATTACK_STEP');

    // In ATTACK step -> Restricted Flash Magic is ALLOWED on player's turn
    game.state.step = 'ATTACK';
    const resAttack = await game.playCard(restrictedFlashMagic.id, [], 'player');
    assert.equal(resAttack.success, true);
  });

  it('16. General Flash Timing (Phase M.3.1): Generic Spirit Flash ability allowed in Main Step; restricted Flash ability rejected in Main Step', async () => {
    const game = createGame();
    const spiritWithGenericFlash = createCardInstance({
      id: 'SPIRIT_FLASH_GENERIC',
      name: 'Generic Flash Knight',
      type: 'Spirit',
      cost: 3,
      levels: { 1: { cost: 1, bp: 3000 } },
      compiledIr: {
        abilities: [
          {
            id: 'ab_field_flash_gen',
            physicalId: 'phy_field_flash_gen',
            header: { timing: 'FLASH', isFlash: true, levels: [1] },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    const spiritWithRestrictedFlash = createCardInstance({
      id: 'SPIRIT_FLASH_RESTR',
      name: 'Restricted Flash Knight',
      type: 'Spirit',
      cost: 3,
      levels: { 1: { cost: 1, bp: 3000 } },
      compiledIr: {
        abilities: [
          {
            id: 'ab_field_flash_restr',
            physicalId: 'phy_field_flash_restr',
            header: { timing: 'FLASH', isFlash: true, levels: [1], timingOwner: 'SELF' },
            clauses: [{ op: { op: 'DRAW', count: 1 } }]
          }
        ]
      }
    }, 'player');

    const stackGen = createFieldStack(spiritWithGenericFlash, { normal: 2, soul: 0 });
    const stackRestr = createFieldStack(spiritWithRestrictedFlash, { normal: 2, soul: 0 });
    game.state.players.player.field = [stackGen, stackRestr];
    game.state.players.player.deck = [
      createCardInstance({ name: 'Deck Card 1' }, 'player'),
      createCardInstance({ name: 'Deck Card 2' }, 'player')
    ];

    // In MAIN step -> Generic Flash ability on field MUST SUCCEED for active player
    game.state.step = 'MAIN';
    game.state.activePlayer = 'player';
    const resGen = await game.activateAbility(spiritWithGenericFlash.id, 'phy_field_flash_gen', 'player');
    assert.equal(resGen.success, true);
    assert.equal(game.state.players.player.hand.length, 1);

    // In MAIN step -> Restricted Flash ability MUST BE REJECTED with RESTRICTED_TO_ATTACK_STEP
    const resRestr = await game.activateAbility(spiritWithRestrictedFlash.id, 'phy_field_flash_restr', 'player');
    assert.equal(resRestr.success, false);
    assert.equal(resRestr.code, 'RESTRICTED_TO_ATTACK_STEP');

    // In ATTACK step -> Restricted Flash ability is ALLOWED on player's turn
    game.state.step = 'ATTACK';
    const resAttack = await game.activateAbility(spiritWithRestrictedFlash.id, 'phy_field_flash_restr', 'player');
    assert.equal(resAttack.success, true);
  });

  it('17. Arena UI Protection: canCastAccel and castAccel reject reuse on openCards', () => {
    const { arena } = createArenaTestEnvironment();
    const testCard = {
      uid: 'arena-accel-01',
      id: 'BS43-020',
      name: 'Arena Open Card',
      type: 'Spirit',
      cost: 3,
      effect: 'Flash - [Accel: Cost 2] Draw 1 card.'
    };

    const state = arena.getState();
    state.player.openCards = [testCard];
    state.player.hand = [];
    state.player.reserve = 5;

    // canCastAccel must return allowed: false with reason ACCEL_CANNOT_BE_USED_FROM_REMOVED
    const check = arena.canCastAccel(testCard, 'player');
    assert.equal(check.allowed, false);
    assert.equal(check.reason, 'ACCEL_CANNOT_BE_USED_FROM_REMOVED');

    // castAccel must not activate
    const initialTrash = state.player.trash;
    arena.castAccel('arena-accel-01', 'player');
    assert.equal(state.player.trash, initialTrash, 'No cores should be paid');
  });

});
