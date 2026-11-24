import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function makeEl(initial = {}) {
  const set = new Set();
  return {
    innerHTML: '',
    value: '',
    style: {},
    children: [],
    scrollTop: 0,
    scrollHeight: 0,
    ...initial,
    classList: {
      _set: set,
      add(c) { set.add(c); },
      remove(c) { set.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (set.has(c)) set.delete(c);
          else set.add(c);
        } else if (force) set.add(c);
        else set.delete(c);
      },
      contains(c) { return set.has(c); }
    }
  };
}

describe('Secondary Tabletop Mat Arena View', () => {
  it('1. arena.html wires Classic/Tabletop toggle, Home exit menu, Chat & Log drawer, CSS, and JS', () => {
    const html = fs.readFileSync(path.join(rootDir, 'arena.html'), 'utf8');
    assert.ok(html.includes('assets/tabletop_mat.css?v=1.6'), 'arena.html must link tabletop_mat.css?v=1.6');
    assert.ok(html.includes('assets/tabletop_mat.js?v=1.6'), 'arena.html must load tabletop_mat.js?v=1.6');
    assert.ok(html.includes('id="btnArenaPeekBoard"'), 'arena.html must include universal View Board peek button');
    assert.ok(html.includes('id="tabletopMatArena"'), 'arena.html must include #tabletopMatArena section');
    assert.ok(html.includes('id="btnArenaViewClassic"'), 'arena.html must include Classic View toggle button');
    assert.ok(html.includes('id="btnArenaViewTabletop"'), 'arena.html must include Tabletop Mat toggle button');
    assert.ok(html.includes('id="btnArenaHome"'), 'arena.html must include Home exit/surrender button');
    assert.ok(html.includes('id="arenaHomeMenu"'), 'arena.html must include Home dropdown menu');
    assert.ok(html.includes('id="btnArenaChatLogToggle"'), 'arena.html must include Chat & Log toggle button');
    assert.ok(html.includes('id="arenaChatLogDrawer"'), 'arena.html must include Chat & Log slide-over drawer');
  });

  it('2. TabletopMat wires full Classic gameplay mechanics (Mulligan, Core Steppers, Soul Core, Attack, Sacrifice, Hover Inspector, Chat/Log)', () => {
    const matSrc = fs.readFileSync(path.join(rootDir, 'assets/tabletop_mat.js'), 'utf8');
    const storage = {};
    const bodyEl = makeEl();
    const elements = {
      battleDuelTable: makeEl(),
      tabletopMatArena: makeEl(),
      btnArenaViewClassic: makeEl(),
      btnArenaViewTabletop: makeEl(),
      arenaHomeMenu: makeEl(),
      btnArenaChatLogToggle: makeEl(),
      arenaChatLogDrawer: makeEl(),
      acdTabChat: makeEl(),
      acdTabLog: makeEl(),
      arenaChatDrawerBody: makeEl(),
      arenaChatForm: makeEl(),
      arenaChatInput: makeEl(),
      tmHoverInspector: makeEl(),
      battleLogList: makeEl({
        children: [
          { innerHTML: '<span class="log-time">00:05</span> Turn 2 begins!' },
          { innerHTML: '<span class="log-time">00:12</span> Summoned Siegfried.' }
        ]
      })
    };

    const mockState = {
      inDuel: true,
      turn: 1,
      firstPlayer: 'opponent',
      activePlayer: 'opponent',
      phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
      phaseIndex: 0,
      player: {
        hasConfirmedHand: false,
        hasMulliganed: false,
        contractCard: { uid: 'h2', name: 'Top Buddy, Aibou' },
        life: 5,
        reserve: 4,
        trash: 0,
        soulCoreLocation: 'reserve',
        deck: new Array(40).fill({}),
        trashCards: [],
        hand: [
          { uid: 'h1', name: 'Flood Stream', type: 'Magic', cost: 4, color: 'Blue', effect: '[Flash]\n+4000 BP' },
          { uid: 'h2', name: 'Top Buddy, Aibou', type: 'Contract Spirit', cost: 1, color: 'Red', effect: '[When Summoned] Draw 1.' },
          { uid: 'h3', name: 'Expensive Dragon', type: 'Spirit', cost: 6, color: 'Red', effect: '' }
        ],
        field: [],
        nexus: [],
        burst: null,
        count: 0,
        openCards: []
      },
      opponent: {
        life: 5,
        reserve: 4,
        trash: 0,
        soulCoreLocation: 'reserve',
        deck: new Array(36).fill({}),
        trashCards: [],
        hand: [{}, {}, {}, {}],
        field: [],
        nexus: [],
        burst: null,
        count: 0,
        openCards: []
      }
    };

    const sandbox = {
      localStorage: {
        getItem: k => (k in storage ? storage[k] : null),
        setItem: (k, v) => { storage[k] = String(v); }
      },
      document: {
        readyState: 'complete',
        body: bodyEl,
        getElementById: id => elements[id] || null,
        addEventListener() {}
      },
      window: {
        BattleArena: {
          getState: () => mockState,
          getCardEffectiveCost: c => c.cost || 0,
          canUnitAttack: () => true
        }
      }
    };
    sandbox.window.window = sandbox.window;
    vm.createContext(sandbox);
    vm.runInContext(matSrc, sandbox);

    // Turn 1 before hand confirmation
    sandbox.window.TabletopMat.setMode('tabletop');
    assert.equal(bodyEl.classList.contains('in-battle-mode'), true);
    const turn1Html = elements.tabletopMatArena.innerHTML;
    assert.ok(turn1Html.includes('id="tmStartingHandCard"'), 'Turn 1 must show Starting Hand & Mulligan card');
    assert.ok(turn1Html.includes('BattleArena.performMulligan'), 'Mulligan button must call performMulligan');
    assert.ok(turn1Html.includes('BattleArena.keepStartingHand'), 'Keep Hand button must call keepStartingHand');
    assert.ok(turn1Html.includes('BattleArena.openPartnerSelectionModal'), 'Choose Partner must call openPartnerSelectionModal');

    // Turn 2 MAIN Step: verify inline Core Steppers, Soul Core toggle, Nexus controls, and Sacrifice-to-Pay
    mockState.turn = 2;
    mockState.activePlayer = 'player';
    mockState.phaseIndex = 4; // MAIN
    mockState.player.hasConfirmedHand = true;
    mockState.player.hasMulliganed = true;
    mockState.player.life = 3;
    mockState.player.reserve = 3;
    mockState.player.field = [
      { uid: 'f1', name: 'Siegfried', type: 'Spirit', color: 'Red', currentLevel: 2, currentBp: 7000, currentCores: 4, hasSoulCore: false, isExhausted: false }
    ];
    mockState.player.nexus = [
      { uid: 'n1', name: 'Mandala Ceiling', type: 'Nexus', currentLevel: 1, currentCores: 1 }
    ];
    sandbox.window.TabletopMat.render();
    const mainHtml = elements.tabletopMatArena.innerHTML;
    assert.ok(mainHtml.includes('BattleArena.addCoreToSpirit'), 'Main Step must wire inline + core button on Spirits');
    assert.ok(mainHtml.includes('BattleArena.removeCoreFromSpirit'), 'Main Step must wire inline - core button on Spirits');
    assert.ok(mainHtml.includes('BattleArena.placeSoulCoreOnSpirit'), 'Main Step must wire Soul Core placement on Spirits');
    assert.ok(mainHtml.includes('BattleArena.addCoreToNexus'), 'Main Step must wire Nexus core controls');
    assert.ok(mainHtml.includes('BattleArena.openSacrificeModal'), 'Hand must wire Sacrifice-to-Pay when reserve + field cores cover cost');

    // Turn 2 ATTACK Step: verify click-to-attack + Attack button + Flash Magic
    mockState.phaseIndex = 5; // ATTACK
    mockState.player.reserve = 4;
    sandbox.window.TabletopMat.render();
    const atkHtml = elements.tabletopMatArena.innerHTML;
    assert.ok(atkHtml.includes('BattleArena.handleSpiritClick'), 'Field Spirits must wire BattleArena.handleSpiritClick for attacks');
    assert.ok(atkHtml.includes('⚔️ Attack'), 'Ready Spirits in Attack Step must show explicit Attack button');
    assert.ok(atkHtml.includes('⚡ Flash (4)'), 'Attack Step hand must expose Flash Magic cast button');
    assert.ok(atkHtml.includes('hex-life-active') && atkHtml.includes('hex-life-empty'), 'Life panel must render classic yellow SVG crystals');

    // Live Hover Card Inspector
    sandbox.window.TabletopMat.showHoverPreview('hand', 'h2');
    assert.equal(elements.tmHoverInspector.classList.contains('visible'), true);
    assert.ok(elements.tmHoverInspector.innerHTML.includes('Top Buddy, Aibou'), 'Hover inspector must display hovered card details');
    sandbox.window.TabletopMat.hideHoverPreview();
    assert.equal(elements.tmHoverInspector.classList.contains('visible'), false);

    // Home menu & Chat/Log drawer
    sandbox.window.TabletopMat.toggleHomeMenu();
    assert.equal(elements.arenaHomeMenu.classList.contains('open'), true);
    sandbox.window.TabletopMat.closeHomeMenu();
    sandbox.window.TabletopMat.toggleChatDrawer(true);
    sandbox.window.TabletopMat.sendChatMessage('GG!');
    assert.ok(elements.arenaChatDrawerBody.innerHTML.includes('GG!'));
    sandbox.window.TabletopMat.setChatTab('log');
    assert.ok(elements.arenaChatDrawerBody.innerHTML.includes('Summoned Siegfried.'));

    // Exit duel clears in-battle-mode
    sandbox.window.TabletopMat.syncBattleModeBodyClass(false);
    assert.equal(bodyEl.classList.contains('in-battle-mode'), false);
  });

  it('3. battle_arena.js blocks AI watchdog & advanceOpponentStep while Turn-1 Mulligan / Starting Hand is unconfirmed', () => {
    const baSrc = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');
    const watchdogStart = baSrc.indexOf('function resetAiWatchdog()');
    assert.ok(watchdogStart !== -1, 'resetAiWatchdog must exist');
    const watchdogSlice = baSrc.slice(watchdogStart, watchdogStart + 900);
    assert.ok(
      watchdogSlice.includes('!DuelState.player.hasConfirmedHand'),
      'resetAiWatchdog must not auto-advance opponent before player confirms starting hand / mulligan'
    );

    const stepStart = baSrc.indexOf('function advanceOpponentStep()');
    assert.ok(stepStart !== -1, 'advanceOpponentStep must exist');
    const stepSlice = baSrc.slice(stepStart, stepStart + 400);
    assert.ok(
      stepSlice.includes('!DuelState.player.hasConfirmedHand'),
      'advanceOpponentStep must guard against running Turn 1 before player confirms starting hand / mulligan'
    );
  });

  it('4. TabletopMat supports 1-click Core Transference, inline deployed Nexuses, Count, Open, Trash Cores, and Graveyard', () => {
    const matSrc = fs.readFileSync(path.join(rootDir, 'assets/tabletop_mat.js'), 'utf8');
    const calls = [];
    const elements = {
      battleDuelTable: makeEl(),
      tabletopMatArena: makeEl(),
      btnArenaViewClassic: makeEl(),
      btnArenaViewTabletop: makeEl()
    };
    const mockState = {
      inDuel: true,
      turn: 2,
      activePlayer: 'player',
      phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
      phaseIndex: 4, // MAIN
      player: {
        hasConfirmedHand: true,
        life: 5,
        reserve: 2,
        trash: 3,
        count: 4,
        openCards: [{ name: 'Open Card' }],
        soulCoreLocation: 'reserve',
        deck: new Array(34).fill({}),
        trashCards: [{ name: 'Strong Draw' }, { name: 'Red Voice' }],
        hand: [],
        field: [{ uid: 'sp1', name: 'Siegfried', type: 'Spirit', currentLevel: 2, currentBp: 7000, currentCores: 3, hasSoulCore: false }],
        nexus: [{ uid: 'nx1', name: 'Mandala Ceiling', type: 'Nexus', currentLevel: 1, currentCores: 1 }],
        burst: { name: 'Flood Stream' }
      },
      opponent: {
        life: 5, reserve: 4, trash: 0, count: 0, openCards: [], soulCoreLocation: 'reserve',
        deck: new Array(36).fill({}), trashCards: [], hand: [], field: [], nexus: [], burst: null
      }
    };

    const sandbox = {
      localStorage: { getItem: () => 'tabletop', setItem() {} },
      document: { readyState: 'complete', body: makeEl(), getElementById: id => elements[id] || null, addEventListener() {} },
      window: {
        BattleArena: {
          getState: () => mockState,
          removeCoreFromSpirit: uid => calls.push(['removeSpirit', uid]),
          addCoreToNexus: uid => calls.push(['addNexus', uid])
        }
      }
    };
    sandbox.window.window = sandbox.window;
    vm.createContext(sandbox);
    vm.runInContext(matSrc, sandbox);

    const html = elements.tabletopMatArena.innerHTML;
    assert.ok(html.includes('🏛️ NEXUS'), 'Deployed Nexus must render inline on the battle line');
    assert.ok(html.includes('Mandala Ceil'), 'Deployed Nexus name must be visible');
    assert.ok(html.includes('Graveyard') && html.includes('Trash Cores'), 'Both Graveyard and Trash Cores must be clearly labeled');
    assert.ok(html.includes('🔹 Count') && html.includes('📖 Open'), 'Count and Open Zone chips must be rendered');
    assert.ok(html.includes("BattleArena.openZoneModal('player-nexus')"), 'Nexuses button must open player-nexus tab');
    assert.ok(html.includes('BattleArena.inspectBurst'), 'Burst slot must call BattleArena.inspectBurst()');

    // Start Core Transfer from Spirit sp1 -> Nexus nx1
    assert.equal(sandbox.window.TabletopMat.startCoreTransfer('spirit', 'sp1', 'Siegfried'), true);
    assert.ok(elements.tabletopMatArena.innerHTML.includes('id="tmCoreTransferBanner"'), 'Transfer banner must appear');
    assert.ok(elements.tabletopMatArena.innerHTML.includes('+1 Receive Core'), 'Target Nexus must expose Receive Core button');

    sandbox.window.TabletopMat.completeCoreTransfer('nexus', 'nx1');
    assert.deepEqual(calls, [['removeSpirit', 'sp1'], ['addNexus', 'nx1']]);
  });

  it('5. battle_arena.js resets attackStepEnded/endAttackStepAtEndOfBattle/_pendingMagicInteraction on endTurn & startDuel, and engine/ops handles MODIFY_EFFECT_LIMIT & COST_RULE', () => {
    const baSrc = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');
    const endIdx = baSrc.indexOf('function endTurn()');
    const endBody = baSrc.slice(endIdx, endIdx + 3600);
    assert.ok(endBody.includes('DuelState.attackStepEnded = false'), 'endTurn must reset DuelState.attackStepEnded');
    assert.ok(endBody.includes('DuelState.endAttackStepAtEndOfBattle = false'), 'endTurn must reset DuelState.endAttackStepAtEndOfBattle');
    assert.ok(endBody.includes('DuelState._pendingMagicInteraction = null'), 'endTurn must reset DuelState._pendingMagicInteraction');

    const startIdx = baSrc.indexOf('async function startDuel(');
    const startBody = baSrc.slice(startIdx, startIdx + 16500);
    assert.ok(startBody.includes('DuelState.attackStepEnded = false'), 'startDuel must reset DuelState.attackStepEnded');
    assert.ok(startBody.includes('DuelState.endAttackStepAtEndOfBattle = false'), 'startDuel must reset DuelState.endAttackStepAtEndOfBattle');

    const opsSrc = fs.readFileSync(path.join(rootDir, 'engine/ops/index.js'), 'utf8');
    assert.ok(opsSrc.includes("case 'MODIFY_EFFECT_LIMIT':"), 'engine/ops must handle MODIFY_EFFECT_LIMIT');
    assert.ok(opsSrc.includes("case 'COST_RULE':"), 'engine/ops must handle COST_RULE');
  });

  it('6. TabletopMat renders Soul State Contract Partner on field and provides universal View Board peek toggle for open choice modals', () => {
    const matSrc = fs.readFileSync(path.join(rootDir, 'assets/tabletop_mat.js'), 'utf8');
    const bodyEl = makeEl();
    const peekBtn = makeEl({ textContent: '👁️ View Board' });
    const activeModal = makeEl({ id: 'battleTargetModal', style: { display: 'flex' } });
    activeModal.classList.add('active');

    const elements = {
      battleDuelTable: makeEl(),
      tabletopMatArena: makeEl(),
      btnArenaViewClassic: makeEl(),
      btnArenaViewTabletop: makeEl(),
      btnArenaPeekBoard: peekBtn
    };
    const mockState = {
      inDuel: true,
      turn: 4,
      activePlayer: 'player',
      phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
      phaseIndex: 5,
      player: {
        hasConfirmedHand: true, life: 3, reserve: 4, trash: 2, count: 0, openCards: [],
        soulCoreLocation: 'reserve', deck: new Array(35).fill({}), trashCards: [], hand: [],
        field: [], nexus: [], burst: null,
        soulStateCards: [{ uid: 'partner_1', name: 'Top Buddy, Aibou', isSoulState: true, type: 'Contract Spirit' }]
      },
      opponent: {
        life: 3, reserve: 1, trash: 1, count: 0, openCards: [],
        soulCoreLocation: 'reserve', deck: new Array(34).fill({}), trashCards: [], hand: [],
        field: [], nexus: [], burst: null, soulStateCards: []
      }
    };

    const sandbox = {
      localStorage: { getItem: () => 'tabletop', setItem() {} },
      document: {
        readyState: 'complete',
        body: bodyEl,
        getElementById: id => elements[id] || null,
        querySelectorAll: () => [activeModal],
        addEventListener() {}
      },
      window: { BattleArena: { getState: () => mockState } }
    };
    sandbox.window.window = sandbox.window;
    vm.createContext(sandbox);
    vm.runInContext(matSrc, sandbox);

    const html = elements.tabletopMatArena.innerHTML;
    assert.ok(html.includes('👻 SOUL STATE'), 'Soul State Contract Partner must render on Tabletop Mat battle line');
    assert.ok(html.includes('Top Buddy, Aibou'), 'Soul State Partner name must be displayed');

    // Universal View Board peek toggle
    assert.equal(peekBtn.classList.contains('visible'), true, 'View Board button must show when a choice modal is active');
    sandbox.window.TabletopMat.toggleBoardPeek();
    assert.equal(bodyEl.classList.contains('arena-peeking-board'), true, 'Peeking must add arena-peeking-board class to body');
    assert.equal(peekBtn.textContent, '↩️ Return to Choice', 'Button label must flip to Return to Choice while peeking');
    sandbox.window.TabletopMat.toggleBoardPeek();
    assert.equal(bodyEl.classList.contains('arena-peeking-board'), false, 'Toggling again must restore the modal');
  });
});
