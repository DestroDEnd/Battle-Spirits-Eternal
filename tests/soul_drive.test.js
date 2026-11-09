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

  it('13. Tensei (BS33-029) Regression: Banishing Soul Core claims cores from Void equal to total cores in Reserve + on Spirits/Ultimates', () => {
    const { arena } = createArenaTestEnvironment();
    const tenseiCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS33-029' || c.name === 'The SengokuSixGeneral Tensei');
    assert.ok(tenseiCard, 'Tensei found in database');

    const tenseiInstance = Object.assign({}, tenseiCard, {
      uid: 'tensei-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 1
    });

    const ally1 = { uid: 'shibadog-01', name: 'The Aide Shibadog', currentCores: 1, currentLevel: 1, currentBp: 2000, type: 'Spirit' };
    const ally2 = { uid: 'blade-01', name: 'The Silver Guardian Blade', currentCores: 1, currentLevel: 1, currentBp: 10000, type: 'Brave' };
    const ally3 = { uid: 'musha-01', name: 'Musha Lizard', currentCores: 1, currentLevel: 1, currentBp: 3000, type: 'Spirit' };
    const ally4 = { uid: 'usson-01', name: 'The Aide Usson', currentCores: 1, currentLevel: 1, currentBp: 2000, type: 'Spirit' };

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [ally1, ally2, ally3, ally4, tenseiInstance];
    state.player.reserve = 0;
    state.player.trash = 5;
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'field';
    state.player.soulCoreSpiritUid = 'tensei-01';

    // 5 units with 1 core each = 5 cores total on field, 0 in reserve. Total = 5 cores.
    arena.executeSoulDriveAction(tenseiInstance, 'player');

    // 1. Soul Core banished to Void
    assert.equal(state.player.soulDriveUsed, true);
    assert.equal(state.player.soulCoreLocation, 'void');
    assert.equal(tenseiInstance.hasSoulCore, false);

    // 2. Cores gained from Void: 5 new cores added to Spirits/Ultimates!
    const totalFieldCores = state.player.field.reduce((acc, u) => acc + (u.currentCores || 0), 0);
    assert.equal(totalFieldCores, 10, 'Field cores doubled from 5 to 10 (5 cores claimed from Void!)');
    assert.ok(tenseiInstance.currentCores >= 5, 'Tensei received cores to reach Lv5');
  });

  it('14. Senryuukaku (BS33-X04): Returns all opposing Spirits and Ultimates to top of opposing deck', () => {
    const { arena } = createArenaTestEnvironment();
    const senCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS33-X04' || c.name === 'The SengokuSixGeneral Senryuukaku');
    const senInstance = Object.assign({}, senCard, {
      uid: 'sen-01',
      hasSoulCore: true,
      currentLevel: 4,
      currentCores: 3
    });

    const oppSpirit1 = { uid: 'opp-sp-1', name: 'Opp Spirit 1', type: 'Spirit', currentCores: 2 };
    const oppUlt1 = { uid: 'opp-ult-1', name: 'Opp Ultimate 1', type: 'Ultimate', currentCores: 3 };

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [senInstance];
    state.opponent.field = [oppSpirit1, oppUlt1];
    state.opponent.reserve = 1;
    state.opponent.deck = [{ name: 'Existing Decktop Card' }];

    arena.executeSoulDriveAction(senInstance, 'player');

    // All opposing units removed from field
    assert.equal(state.opponent.field.length, 0, 'Opposing field emptied of Spirits/Ultimates');
    // Cores recycled to opponent reserve (1 + 2 + 3 = 6)
    assert.equal(state.opponent.reserve, 6, 'Opponent cores recycled to reserve');
    // Returned to decktop
    assert.equal(state.opponent.deck.length, 3, 'Deck contains the 2 returned units plus existing card');
    assert.equal(state.opponent.deck[0].uid, 'opp-sp-1', 'First bounced unit on decktop');
    assert.equal(state.opponent.deck[1].uid, 'opp-ult-1', 'Second bounced unit on decktop');
  });

  it('15. LeonLancer (BS34-CP07): Destroys every opposing Spirit/Ultimate with <= 20000 BP', () => {
    const { arena } = createArenaTestEnvironment();
    const leonCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS34-CP07' || c.name === 'The SengokuSixGeneral LeonLancer');
    const leonInstance = Object.assign({}, leonCard, {
      uid: 'leon-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [leonInstance];
    state.opponent.field = [
      { uid: 'small-1', name: 'Small Spirit', type: 'Spirit', currentBp: 5000, currentCores: 1 },
      { uid: 'mid-1', name: 'Mid Ultimate', type: 'Ultimate', currentBp: 18000, currentCores: 2 },
      { uid: 'boss-1', name: 'Colossal Boss', type: 'Spirit', currentBp: 25000, currentCores: 4 }
    ];
    state.opponent.reserve = 0;

    arena.executeSoulDriveAction(leonInstance, 'player');

    // Small and Mid destroyed, Boss survives (> 20000 BP)
    assert.equal(state.opponent.field.length, 1, 'Only Boss remains');
    assert.equal(state.opponent.field[0].uid, 'boss-1');
    assert.equal(state.opponent.reserve, 3, '1 + 2 = 3 cores from destroyed units recycled to opponent reserve');
  });

  it('16. LeonLancer X (BS74-X12): Destroys all opposing units and sends up to 3 Life to Reserve', () => {
    const { arena } = createArenaTestEnvironment();
    const leonXCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS74-X12' || c.name === 'The SengokuSixGeneral LeonLancer X');
    const leonXInstance = Object.assign({}, leonXCard, {
      uid: 'leonx-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.phaseIndex = 5; // ATTACK step
    state.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
    state.player.field = [leonXInstance];
    state.opponent.field = [
      { uid: 'opp-1', name: 'Opp 1', type: 'Spirit', currentCores: 1 },
      { uid: 'opp-2', name: 'Opp 2', type: 'Ultimate', currentCores: 2 },
      { uid: 'opp-3', name: 'Opp 3', type: 'Spirit', currentCores: 1 }
    ];
    state.opponent.life = 4;
    state.opponent.reserve = 0;

    arena.executeSoulDriveAction(leonXInstance, 'player');

    // All 3 destroyed
    assert.equal(state.opponent.field.length, 0);
    // 3 targets destroyed -> 3 Life sent to Reserve (4 - 3 = 1)
    assert.equal(state.opponent.life, 1, 'Opponent life reduced by 3');
    // Cores from destroyed units (4) + Life cores (3) = 7 in reserve
    assert.equal(state.opponent.reserve, 7);
  });

  it('17. Bakelkatze (BS33-049): Sets Life to 6 from Void', () => {
    const { arena } = createArenaTestEnvironment();
    const katzeCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS33-049' || c.name === 'The SengokuSixGeneral Bakelkatze');
    const katzeInstance = Object.assign({}, katzeCard, {
      uid: 'katze-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [katzeInstance];
    state.player.life = 2;

    arena.executeSoulDriveAction(katzeInstance, 'player');

    // Life increased from 2 to 6
    assert.equal(state.player.life, 6, 'Life restored up to 6');
  });

  it('18. Tidal-Blue (BS33-X06 / BATTLE-SPIRITS-A12187): Sets skipNextRefreshAndMain, skipping Opponent Refresh and Main step', () => {
    const { arena } = createArenaTestEnvironment();
    const tidalCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS33-X06' || c.name === 'The SengokuSixGeneral Tidal-Blue');
    const tidalInstance = Object.assign({}, tidalCard, {
      uid: 'tidal-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.activePlayer = 'player';
    state.player.field = [tidalInstance];
    state.opponent.skipNextRefreshAndMain = false;

    // Tidal-Blue marks opposing side to skip Refresh and Main
    arena.executeSoulDriveAction(tidalInstance, 'opponent');
    assert.equal(state.player.skipNextRefreshAndMain, true, 'Player marked to skip refresh and main');

    // On Player's turn: advancing DRAW step skips REFRESH (3) and MAIN (4), landing directly on ATTACK (5)
    state.activePlayer = 'player';
    state.phaseIndex = 2; // DRAW step
    state.player.deck = [{ name: 'Player Drawn Card' }];
    state.player.hand = [];

    arena.manualStep();
    assert.equal(state.phaseIndex, 5, 'Skipped directly to ATTACK step (phaseIndex 5)');
    assert.equal(state.player.skipNextRefreshAndMain, false, 'skipNextRefreshAndMain flag consumed');
  });

  it('19. Vandiel (SD36-X02 / BATTLE-SPIRITS-A10766): Reveals decktop until 3 Ultimates appear and summons them for free', () => {
    const { arena } = createArenaTestEnvironment();
    const vanCard = Object.values(cardsDetailed).find(c => c.card_number === 'SD36-X02' || c.name === 'The Hellwind FourDemonLord Vandiel');
    const vanInstance = Object.assign({}, vanCard, {
      uid: 'van-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [vanInstance];
    state.player.deck = [
      { name: 'Random Magic 1', type: 'Magic' },
      { name: 'Revealed Ult 1', type: 'Ultimate' },
      { name: 'Random Spirit 2', type: 'Spirit' },
      { name: 'Revealed Ult 2', type: 'Ultimate' },
      { name: 'Revealed Ult 3', type: 'Ultimate' },
      { name: 'Remaining Card in Deck', type: 'Spirit' }
    ];
    state.player.trashCards = [];

    arena.executeSoulDriveAction(vanInstance, 'player');

    // Friendly field now has Vandiel + 3 revealed Ultimates
    assert.equal(state.player.field.length, 4, 'Vandiel + 3 revealed Ultimates summoned to field');
    assert.ok(state.player.field.some(u => u.name === 'Revealed Ult 1'));
    assert.ok(state.player.field.some(u => u.name === 'Revealed Ult 2'));
    assert.ok(state.player.field.some(u => u.name === 'Revealed Ult 3'));

    // Remaining card in deck
    assert.equal(state.player.deck.length, 1);
    assert.equal(state.player.deck[0].name, 'Remaining Card in Deck');

    // 2 non-Ultimate cards sent to trash
    assert.equal(state.player.trashCards.length, 2);
  });

  it('20. Dusk Dragon (BATTLE-SPIRITS-A9226): Refreshes all allied Ultimates', () => {
    const { arena } = createArenaTestEnvironment();
    const duskCard = Object.values(cardsDetailed).find(c => c.name === 'The DarkKnight Dusk Dragon');
    const duskInstance = Object.assign({}, duskCard, {
      uid: 'dusk-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2,
      isExhausted: true
    });
    const alliedUlt = { uid: 'ally-ult-1', name: 'Allied Ultimate', type: 'Ultimate', isExhausted: true };
    const alliedSpirit = { uid: 'ally-sp-1', name: 'Allied Spirit', type: 'Spirit', isExhausted: true };

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [duskInstance, alliedUlt, alliedSpirit];

    arena.executeSoulDriveAction(duskInstance, 'player');

    assert.equal(duskInstance.isExhausted, false, 'Dusk Dragon refreshed');
    assert.equal(alliedUlt.isExhausted, false, 'Allied Ultimate refreshed');
    assert.equal(alliedSpirit.isExhausted, true, 'Spirit remains exhausted');
  });

  it('21. WarParamount Mudou (BS74-AX01): Banishes 2 opposing Life to Void and destroys opposing units per Level', () => {
    const { arena } = createArenaTestEnvironment();
    const axCard = Object.values(cardsDetailed).find(c => c.card_number === 'BS74-AX01');
    assert.ok(axCard, 'BS74-AX01 found in database');

    const axInstance = Object.assign({}, axCard, {
      uid: 'ax-01',
      hasSoulCore: true,
      currentLevel: 4,
      currentCores: 3
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [axInstance];
    state.opponent.field = [
      { uid: 'opp-1', name: 'Opp 1', currentCores: 2 },
      { uid: 'opp-2', name: 'Opp 2', currentCores: 2 },
      { uid: 'opp-3', name: 'Opp 3', currentCores: 2 }
    ];
    state.opponent.life = 5;
    state.opponent.void = 0;

    arena.executeSoulDriveAction(axInstance, 'player');

    // 2 Life to Void
    assert.equal(state.opponent.life, 3, '5 - 2 = 3 Life remaining');
    assert.equal(state.opponent.void, 2, '2 Life sent to Void');
    // Lv4 destroys up to 4 units -> all 3 destroyed
    assert.equal(state.opponent.field.length, 0, 'All 3 opposing units destroyed');
  });

  it('22. Bram-Zand-Noir (P16-21): Sends 2 cores from opposing units to Trash and locks core return on next Refresh', () => {
    const { arena } = createArenaTestEnvironment();
    const noirCard = Object.values(cardsDetailed).find(c => c.card_number === 'P16-21');
    const noirInstance = Object.assign({}, noirCard, {
      uid: 'noir-01',
      hasSoulCore: true,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [noirInstance];
    state.opponent.field = [
      { uid: 'opp-1', name: 'Opp 1', type: 'Spirit', currentCores: 4 }
    ];
    state.opponent.trash = 1;

    arena.executeSoulDriveAction(noirInstance, 'player');

    // 2 cores sent to Trash
    assert.equal(state.opponent.field[0].currentCores, 2);
    assert.equal(state.opponent.trash, 3, '1 + 2 = 3 cores in opponent trash');
    assert.equal(state.opponent.preventRefreshTrashCores, true, 'preventRefreshTrashCores is set');

    // Step opponent to Refresh Step
    state.activePlayer = 'opponent';
    state.phaseIndex = 3; // REFRESH step
    state.opponent.reserve = 2;
    arena.manualStep();

    // In refresh step, cores are NOT returned from trash to reserve due to Bram-Zand-Noir lock
    assert.equal(state.opponent.reserve, 2, 'Cores remained locked in trash, reserve unchanged');
    assert.equal(state.opponent.trash, 3, 'Trash cores remain in trash');
  });

  it('23. Deffert (BATTLE-SPIRITS-A10745): Summoning Deffert while Soul Core is in Void triggers Bram-Zand Soul Drive', () => {
    const { arena } = createArenaTestEnvironment();
    const deffertCard = Object.values(cardsDetailed).find(c => c.card_number === 'BATTLE-SPIRITS-A10745' || c.name === 'The HellflameCount Deffert');
    const bramCard = Object.values(cardsDetailed).find(c => c.card_number === 'SD36-X01' || c.name === 'The Hellflame FourDemonLord Bram-Zand');

    const deffertInstance = Object.assign({}, deffertCard, {
      uid: 'deffert-01',
      currentLevel: 1,
      currentCores: 1
    });
    const bramInstance = Object.assign({}, bramCard, {
      uid: 'bram-01',
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [bramInstance, deffertInstance];
    state.player.soulDriveUsed = true;
    state.player.soulCoreLocation = 'void';

    state.opponent.field = [
      { uid: 'opp-sp-1', name: 'Opp Spirit', type: 'Spirit', currentCores: 1 }
    ];
    state.opponent.life = 4;

    // Trigger Deffert's WHEN_SUMMONED
    arena.executeWhenSummonedEffects(deffertInstance, 'player');

    // Bram-Zand Soul Drive was triggered: opposing spirit destroyed, 2 Life burned to Void!
    assert.equal(state.opponent.field.length, 0, 'Opposing spirit destroyed by triggered Bram-Zand');
    assert.equal(state.opponent.life, 2, 'Opponent life reduced by 2');
    assert.equal(state.opponentCantSummonSpiritsUntilNextStart, true, 'Opponent locked from summoning spirits');
  });

  it('24. Taiga Kazuya (BATTLE-SPIRITS-A8150): LV2 Nexus sends cores to Void to activate Evil God Soul Drive without Soul Core', () => {
    const { arena } = createArenaTestEnvironment();
    const taigaCard = Object.values(cardsDetailed).find(c => c.card_number === 'BATTLE-SPIRITS-A8150' || c.name === 'Taiga Kazuya');
    const bramCard = Object.values(cardsDetailed).find(c => c.name === 'The Hellflame FourDemonLord Bram-Zand');

    const taigaInstance = Object.assign({}, taigaCard, {
      uid: 'taiga-01',
      currentLevel: 2,
      currentCores: 3
    });
    // Bram-Zand belongs to "Evil God" family and does NOT have Soul Core
    const bramInstance = Object.assign({}, bramCard, {
      uid: 'bram-01',
      family: ['Evil God', 'Demon Lord'],
      hasSoulCore: false,
      currentLevel: 3,
      currentCores: 2
    });

    const state = arena.getState();
    state.inDuel = true;
    state.player.field = [bramInstance];
    state.player.nexus = [taigaInstance];
    state.player.soulDriveUsed = false;
    state.player.soulCoreLocation = 'reserve';

    // Verify allowed via Taiga Kazuya
    const check = arena.canActivateSoulDrive(bramInstance, 'player');
    assert.equal(check.allowed, true, 'Allowed via Taiga Kazuya');

    // Execute Soul Drive
    arena.executeSoulDriveAction(bramInstance, 'player');

    // Taiga cores sent to Void, Bram-Zand effect triggered!
    assert.equal(taigaInstance.currentCores, 0, 'All cores on Taiga Kazuya sent to Void');
  });


});
