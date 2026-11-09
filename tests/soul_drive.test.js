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
      document: doc,
      __headlessTest: true
    },
    document: doc,
    localStorage,
    sessionStorage: localStorage,
    console: { log() {}, warn() {}, error() {} },
    setTimeout: (fn, ms) => {
      // Don't synchronously recurse watchdogs (12000ms)
      if (typeof fn === 'function' && (ms === undefined || ms < 5000)) {
        fn();
      }
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

describe('Soul Drive Rules & Mechanics Suite', () => {

  it('1. Condition Check: hasSoulDrive requires Ultimate type, Soul Drive keyword, Soul Core on card, and not previously used', () => {
    const { arena } = createArenaTestEnvironment();
    const mudouCard = Object.values(cardsDetailed).find(c => c.name === 'The SengokuSixGeneral Mudou');
    assert.ok(mudouCard, 'Mudou found in cards database');

    const mudouInstance = Object.assign({}, mudouCard, {
      uid: 'mudou-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'mudou-01';

    // Must be eligible when holding soul core
    assert.equal(arena.hasSoulDrive(mudouInstance, 'player'), true);

    // Ineligible without Soul Core
    mudouInstance.hasSoulCore = false;
    assert.equal(arena.hasSoulDrive(mudouInstance, 'player'), false);

    // Ineligible if already used this game (Once per Game rule!)
    mudouInstance.hasSoulCore = true;
    state.player.soulDriveUsed = true;
    assert.equal(arena.hasSoulDrive(mudouInstance, 'player'), false);
  });

  it('2. Mudou Execution: Banishes Soul Core to Void and strips Level x 2 cores from opposing units/trash to Void', () => {
    const { arena } = createArenaTestEnvironment();
    const mudouCard = Object.values(cardsDetailed).find(c => c.name === 'The SengokuSixGeneral Mudou');
    const mudouInstance = Object.assign({}, mudouCard, {
      uid: 'mudou-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'mudou-01';

    // Opponent field has 2 spirits with 2 cores each (4 field cores total), and 5 in trash
    state.opponent.field = [
      { uid: 'opp-1', name: 'Opp Spirit 1', currentCores: 2, currentBp: 3000 },
      { uid: 'opp-2', name: 'Opp Spirit 2', currentCores: 2, currentBp: 4000 }
    ];
    state.opponent.trash = 5;

    // Lv3 Mudou Soul Drive targets 3 * 2 = 6 cores to Void
    arena.executeSoulDriveAction(mudouInstance, 'player');

    // 1. Player Soul Core permanently banished to Void
    assert.equal(state.player.soulDriveUsed, true, 'soulDriveUsed marked true');
    assert.equal(state.player.soulCoreLocation, 'void', 'Soul Core location set to void');
    assert.equal(mudouInstance.hasSoulCore, false, 'hasSoulCore removed from Mudou');

    // 2. Opponent field cores depleted (4 taken from field, depleted units sent to trash)
    assert.equal(state.opponent.field.length, 0, 'Both opposing spirits depleted to 0 cores and removed');

    // 3. Remaining 2 cores (6 - 4) taken from opponent trash to Void
    assert.equal(state.opponent.trash, 3, '5 - 2 = 3 cores left in opponent trash');
  });

  it('3. Bram-Zand Execution: Destroys opposing units up to 100k BP and banishes 2 Life to Void', () => {
    const { arena } = createArenaTestEnvironment();
    const bramCard = Object.values(cardsDetailed).find(c => c.name === 'The Hellflame FourDemonLord Bram-Zand');
    assert.ok(bramCard, 'Bram-Zand card found');
    const bramInstance = Object.assign({}, bramCard, {
      uid: 'bram-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'bram-01';

    state.opponent.field = [
      { uid: 'opp-1', name: 'Big Dragon', currentCores: 3, currentBp: 15000 },
      { uid: 'opp-2', name: 'Medium Golem', currentCores: 2, currentBp: 8000 }
    ];
    state.opponent.life = 4;

    arena.executeSoulDriveAction(bramInstance, 'player');

    // Soul Core banished
    assert.equal(state.player.soulDriveUsed, true);
    assert.equal(state.player.soulCoreLocation, 'void');

    // Field units destroyed
    assert.equal(state.opponent.field.length, 0, 'Opposing units destroyed up to 100k BP');

    // Opposing Life burned by 2 to Void
    assert.equal(state.opponent.life, 2, 'Opposing Life reduced from 4 to 2');
  });

  it('4. Refresh Step Protection: Soul Core in Void NEVER returns to Reserve during Refresh Step', () => {
    const { arena } = createArenaTestEnvironment();
    const state = arena.getState();
    state.inDuel = true;

    // Player previously used Soul Drive
    state.player.soulDriveUsed = true;
    state.player.soulCoreLocation = 'void';
    state.player.soulCoreSpiritUid = null;
    state.player.reserve = 2;
    state.player.trash = 3;
    state.player.field = [];
    state.phaseIndex = 3; // REFRESH step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.activePlayer = 'player';

    arena.manualStep();

    // 3 normal cores return to Reserve (2 + 3 = 5)
    assert.equal(state.player.reserve, 5, 'Trash cores returned to reserve');
    // Soul Core remains in Void!
    assert.equal(state.player.soulCoreLocation, 'void', 'Soul Core remains in void');
  });

  it('5. Interactive Soul Drive Button: getCardManualActions presents button and activateSoulDrive triggers it', () => {
    const { arena } = createArenaTestEnvironment();
    const mudouCard = Object.values(cardsDetailed).find(c => c.name === 'The SengokuSixGeneral Mudou');
    const mudouInstance = Object.assign({}, mudouCard, {
      uid: 'mudou-interactive-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [mudouInstance];
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'mudou-interactive-01';

    // 1. Initial check: can activate Soul Drive
    const check = arena.canActivateSoulDrive(mudouInstance, 'player');
    assert.equal(check.allowed, true, 'canActivateSoulDrive allowed');

    // 2. getCardManualActions should include the Soul Drive button
    const actions = arena.getCardManualActions(mudouInstance, 'field', mudouInstance, 'player');
    const sdAction = actions.find(a => a.id === 'soul_drive');
    assert.ok(sdAction, 'Soul Drive action button present in getCardManualActions');
    assert.equal(sdAction.disabled, false, 'Soul Drive action button is not disabled');
    assert.match(sdAction.label, /Soul Drive/i);

    // 3. Trigger activation via interactive function
    arena.activateSoulDrive('mudou-interactive-01', 'player');

    // 4. State updated: Soul Core in void, soulDriveUsed true
    assert.equal(state.player.soulDriveUsed, true, 'soulDriveUsed is true');
    assert.equal(state.player.soulCoreLocation, 'void', 'Soul Core is in void');
    assert.equal(mudouInstance.hasSoulCore, false, 'hasSoulCore removed from Mudou');

    // 5. Subsequent check: can no longer activate (Once per Game!)
    const checkAfter = arena.canActivateSoulDrive(mudouInstance, 'player');
    assert.equal(checkAfter.allowed, false, 'canActivateSoulDrive false after use');
    assert.match(checkAfter.reason, /Once per Game/i);

    // 6. Manual action button is now disabled
    const actionsAfter = arena.getCardManualActions(mudouInstance, 'field', mudouInstance, 'player');
    const sdActionAfter = actionsAfter.find(a => a.id === 'soul_drive');
    assert.ok(sdActionAfter, 'Soul Drive action still visible');
    assert.equal(sdActionAfter.disabled, true, 'Soul Drive action disabled after use');
  });

  it('6. Wall Cards: Clear Wall (BS60-092) Burst activation terminates the Attack Step', () => {
    const { arena } = createArenaTestEnvironment();
    const clearWall = Object.values(cardsDetailed).find(c => c.card_number === 'BS60-092' || c.name === 'Clear Wall');
    assert.ok(clearWall, 'Clear Wall found in database');

    const state = arena.getState();
    state.inDuel = true;
    state.turn = 2;
    state.activePlayer = 'opponent';
    state.phaseIndex = 5; // ATTACK step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.player.life = 4;
    state.player.reserve = 5;
    state.player.trash = 0;
    state.player.burst = Object.assign({}, clearWall, { uid: 'clear-wall-01' });

    let attackStepFinished = false;
    const resume = () => {
      attackStepFinished = true;
    };

    // Life reduced triggers burst check
    state.pendingBurstResume = resume;
    const triggered = arena.checkBurstTrigger('player', 'AFTER_LIFE_DECREASED', {}, resume);
    assert.equal(triggered, true, 'Burst trigger detected condition');

    // Player confirms Burst trigger
    arena.confirmBurstTrigger();

    // 4 cores paid for Flash effect
    assert.equal(state.player.reserve, 1, '5 - 4 = 1 core remaining in reserve');
    assert.equal(state.player.trash, 4, '4 cores sent to trash for Flash cost');

    // Attack step terminated and phase moved to END step or passed to next turn
    assert.equal(state.attackStepEnded, true, 'attackStepEnded is true');
    assert.ok(state.phaseIndex === 6 || state.activePlayer === 'player', 'Transitioned through END step to player turn');
  });

  it('7. Wall Cards: Clear Wall (BS60-092) Flash in battle terminates Attack Step at end of combat', () => {
    const { arena } = createArenaTestEnvironment();
    const clearWall = Object.values(cardsDetailed).find(c => c.card_number === 'BS60-092' || c.name === 'Clear Wall');

    const state = arena.getState();
    state.inDuel = true;
    state.turn = 2;
    state.activePlayer = 'opponent';
    state.phaseIndex = 5; // ATTACK step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.player.reserve = 6;
    state.player.hand = [Object.assign({}, clearWall, { uid: 'cw-hand-01' })];

    const attacker = {
      uid: 'enemy-att-01',
      name: 'Enemy Attacker',
      type: 'Spirit',
      color: 'Red',
      currentBp: 5000,
      currentCores: 2
    };
    state.opponent.field = [attacker];
    state.combatEvent = { attacker, targetType: 'player', result: '' };

    // Cast Clear Wall during combat Flash timing
    arena.castFlashInBattle(state.player.hand[0], 'enemy-att-01');

    // Flash cost (4) paid
    assert.equal(state.player.reserve, 2, '6 - 4 = 2 cores remaining in reserve');
    assert.equal(state.endAttackStepAtEndOfBattle, true, 'endAttackStepAtEndOfBattle queued');

    // Conclude battle: trigger checkAndTriggerAttackStepEnd
    const ended = arena.checkAndTriggerAttackStepEnd(800);
    assert.equal(ended, true, 'checkAndTriggerAttackStepEnd successfully ended attack step');
    assert.equal(state.attackStepEnded, true, 'attackStepEnded is true');
    assert.ok(state.phaseIndex === 6 || state.activePlayer === 'player', 'Transitioned through END step to player turn');
  });

  it('8. User Report: Declaring attack with Mudou holding Soul Core must prompt/trigger Soul Drive activation, banish Soul Core to Void, and execute Mudou effect', () => {
    const { arena } = createArenaTestEnvironment();
    const mudouCard = Object.values(cardsDetailed).find(c => c.name === 'The SengokuSixGeneral Mudou');
    assert.ok(mudouCard, 'Mudou found');

    const mudouInstance = Object.assign({}, mudouCard, {
      uid: 'mudou-battle-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2,
      isExhausted: false,
      hasAttacked: false
    });

    const state = arena.getState();
    state.inDuel = true;
    state.turn = 7;
    state.activePlayer = 'player';
    state.phaseIndex = 5; // ATTACK step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.player.field = [mudouInstance];
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'mudou-battle-01';

    // Opponent has 8 cores in trash (matching user screenshot!)
    state.opponent.field = [];
    state.opponent.trash = 8;
    state.opponent.life = 4;

    // Declaring attack with Mudou
    arena.executePlayerAttack(mudouInstance);

    // 1. Soul Drive was activated!
    assert.equal(state.player.soulDriveUsed, true, 'soulDriveUsed must be true');
    assert.equal(state.player.soulCoreLocation, 'void', 'Soul Core must be permanently in Void');
    assert.equal(mudouInstance.hasSoulCore, false, 'Mudou no longer has Soul Core');

    // 2. Lv3 Mudou stripped 6 cores (3 * 2) from Opponent trash to Void!
    assert.equal(state.opponent.trash, 2, '8 - 6 = 2 cores remaining in opponent trash');

    // 3. Mudou is now exhausted and declared attack
    assert.equal(mudouInstance.isExhausted, true, 'Mudou is exhausted from attacking');
  });

  it('9. Opponent AI: Declaring attack with Soul Drive Ultimate activates Soul Drive, banishing Soul Core to Void', () => {
    const { arena } = createArenaTestEnvironment();
    const bramCard = Object.values(cardsDetailed).find(c => c.name === 'The Hellflame FourDemonLord Bram-Zand');
    const bramInstance = Object.assign({}, bramCard, {
      uid: 'ai-bram-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2,
      isExhausted: false,
      hasAttacked: false
    });

    const state = arena.getState();
    state.inDuel = true;
    state.turn = 6;
    state.activePlayer = 'opponent';
    state.firstPlayer = 'player';
    state.phaseIndex = 5; // ATTACK step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.opponent.field = [bramInstance];
    state.opponent.soulDriveUsed = false;
    state.opponent.soulCoreLocation = 'field';
    state.opponent.soulCoreSpiritUid = 'ai-bram-01';

    state.player.field = [
      { uid: 'p-spirit-01', name: 'Defender', currentBp: 5000, currentCores: 2 }
    ];
    state.player.life = 4;

    arena.runAiAttackStep();

    // AI Soul Drive was activated!
    assert.equal(state.opponent.soulDriveUsed, true, 'Opponent soulDriveUsed must be true');
    assert.equal(state.opponent.soulCoreLocation, 'void', 'Opponent Soul Core in Void');
    assert.equal(bramInstance.hasSoulCore, false);

    // Player unit destroyed, 2 Life burned to Void by Soul Drive, and 1 unblocked combat damage dealt (4 - 2 - 1 = 1)
    assert.equal(state.player.field.length, 0, 'Defender destroyed by Bram-Zand');
    assert.equal(state.player.life, 1, 'Player life reduced from 4 to 1 (2 via Soul Drive burn + 1 via unblocked attack)');
  });

  it('10. Messenger Genet (BS33-021): Resolving Soul Drive with Genet Lv2 on field puts 3 cores from Void to Reserve', () => {
    const { arena } = createArenaTestEnvironment();
    const mudouCard = Object.values(cardsDetailed).find(c => c.name === 'The SengokuSixGeneral Mudou');
    const genetCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS33-021' || c.name === 'The Messenger Genet');
    assert.ok(genetCard, 'Genet found');

    const mudouInstance = Object.assign({}, mudouCard, {
      uid: 'mudou-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });
    const genetInstance = Object.assign({}, genetCard, {
      uid: 'genet-01',
      currentLevel: 2,
      currentCores: 3
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [mudouInstance, genetInstance];
    state.player.reserve = 1;
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'mudou-01';
    state.opponent.trash = 8;

    arena.executeSoulDriveAction(mudouInstance, 'player');

    // 1. Soul Drive banished Soul Core to Void
    assert.equal(state.player.soulDriveUsed, true);
    assert.equal(state.player.soulCoreLocation, 'void');

    // 2. Genet triggered and added 3 cores from Void to Reserve (1 + 3 = 4)
    assert.equal(state.player.reserve, 4, 'Reserve gained 3 cores from Genet');
  });

  it('11. When Summoned Soul Drive (Denial BS38-051): Summoning Denial activates Soul Drive using Soul Core from Reserve', () => {
    const { arena } = createArenaTestEnvironment();
    const denialCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS38-051' || c.name === 'The HellsoilSorcerer Denial');
    assert.ok(denialCard, 'Denial found');

    const denialInstance = Object.assign({}, denialCard, {
      uid: 'denial-01',
      hasSoulCore: false,
      currentLevel: 3,
      currentCores: 1
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.reserve = 3;
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'reserve';

    state.opponent.field = [
      { uid: 'opp-t-01', name: 'Opp Target', currentCores: 3, currentBp: 5000 }
    ];
    state.opponent.reserve = 0;

    arena.executeWhenSummonedEffects(denialInstance, 'player');

    // Denial Soul Drive banished Soul Core from Reserve to Void
    assert.equal(state.player.soulDriveUsed, true);
    assert.equal(state.player.soulCoreLocation, 'void');

    // Cores moved from opponent field to opponent reserve
    assert.equal(state.opponent.field.length, 0);
    assert.equal(state.opponent.reserve, 3);
  });

  it('12. Void Banishing Enforcement: Cannot place or move Soul Core from Void, and Refresh never restores it', () => {
    const { arena } = createArenaTestEnvironment();
    const state = arena.getState();
    state.inDuel = true;
    state.player.soulDriveUsed = true;
    state.player.soulCoreLocation = 'void';
    state.player.reserve = 2;
    state.player.trash = 4;

    const testSpirit = {
      uid: 'test-sp-01',
      name: 'Test Spirit',
      currentCores: 2,
      currentLevel: 1,
      currentBp: 3000,
      hasSoulCore: false,
      levels: [{ level: 1, cores: 1, bp: 3000 }, { level: 2, cores: 3, bp: 6000 }]
    };
    state.player.field = [testSpirit];

    // Attempt to place Soul Core onto spirit when in Void
    arena.placeSoulCoreOnSpirit('test-sp-01');
    assert.equal(testSpirit.hasSoulCore, false, 'Cannot place Soul Core when in Void');
    assert.equal(state.player.soulCoreLocation, 'void');

    // Step to Refresh Step
    state.phaseIndex = 3; // REFRESH
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.activePlayer = 'player';
    arena.manualStep();

    // Normal cores refreshed from trash to reserve (2 + 4 = 6)
    assert.equal(state.player.reserve, 6);
    // Soul Core remains strictly in Void!
    assert.equal(state.player.soulCoreLocation, 'void', 'Soul Core strictly remains in Void');
  });

});
