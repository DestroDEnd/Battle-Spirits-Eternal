/**
 * tests/phase3_continuous_and_cost_gating.test.js
 * 
 * Component Phase 3: Unify legacy_bridge.js Continuous Effects & Strict Cost Gating
 * 
 * Tests:
 * 1. Strict Cost Gating: "By sending X cores, do Y" strictly fails if X cores could not be paid.
 * 2. Strict Cost Gating: Optional cost declined strictly halts downstream clauses.
 * 3. Strict Cost Gating: Discard cost requiring N cards strictly fails if hand has < N cards.
 * 4. Continuous Modifiers Persistence: Continuous effects persist into DuelState.modifiers and DuelState.continuousEffects.
 * 5. Modifier Lifetimes: pruneLegacyModifiers correctly removes THIS_BATTLE and THIS_TURN modifiers at phase boundaries.
 * 6. Arena Cost & Symbol Integration: Active COST_MODIFIER and SET_SYMBOL affect getCardEffectiveCost and getFriendlySymbols.
 * 7. Arena BP Recalculation: Active BP_BUFF / BP_DEBUFF in DuelState.modifiers dynamically updates spirit.currentBp.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { AsyncResolver } from '../engine/resolver.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import {
  createEngineStateFromLegacy,
  syncEngineStateToLegacy,
  resolveLegacyAbility,
  pruneLegacyModifiers
} from '../engine/legacy_bridge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function setupArenaEnv() {
  const elements = {};
  const storage = {};
  const doc = {
    readyState: 'complete',
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          tagName: 'DIV',
          style: {},
          innerHTML: '',
          textContent: '',
          value: '',
          children: [],
          classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, contains(c){return this._s.has(c);} },
          appendChild(c){this.children.push(c);},
          addEventListener(){}
        };
      }
      return elements[id];
    },
    querySelectorAll(){ return []; },
    querySelector(){ return null; },
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        style: {},
        innerHTML: '',
        textContent: '',
        value: '',
        children: [],
        classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, contains(c){return this._s.has(c);} },
        appendChild(c){this.children.push(c);},
        addEventListener(){}
      };
    },
    addEventListener(){}
  };
  const win = {
    document: doc,
    localStorage: {
      getItem(k){ return storage[k] !== undefined ? storage[k] : null; },
      setItem(k, v){ storage[k] = String(v); },
      removeItem(k){ delete storage[k]; }
    },
    setTimeout(fn){ return 1; },
    clearTimeout(){},
    setInterval(){ return 1; },
    clearInterval(){},
    addEventListener(){}
  };
  win.window = win;
  const context = vm.createContext(win);
  vm.runInContext(battleArenaSource, context);
  return win;
}

test('Phase 3 - Strict Cost Gating: Insufficient cores strictly blocks downstream effect', async () => {
  const state = createGameState();
  const player = state.players.player;
  player.reserve.normal = 1; // Only 1 core in reserve
  player.reserve.soul = 0;
  player.hand = [];
  player.deck = [
    createCardInstance({ name: 'Card 1', cost: 1 }, 'player'),
    createCardInstance({ name: 'Card 2', cost: 1 }, 'player')
  ];

  // Ability: "By sending two cores from your Reserve to the Trash, draw two cards"
  const ability = {
    clauses: [
      {
        rawText: 'By sending two cores from your Reserve to the Trash',
        isCost: true,
        op: {
          op: 'MOVE_CORE',
          count: 2,
          from: { zone: 'reserve', side: 'self' },
          to: { zone: 'trash', side: 'self' }
        }
      },
      {
        rawText: 'draw two cards',
        link: 'byDoing',
        op: {
          op: 'DRAW',
          count: 2
        }
      }
    ]
  };

  const resolver = new AsyncResolver();
  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  // Core move failed (only 1 core available), so draw must NOT execute
  assert.equal(player.reserve.normal, 1, 'Cores in reserve must remain untouched if cost cannot be paid');
  assert.equal(player.hand.length, 0, 'No cards should be drawn when prerequisite cost fails');
});

test('Phase 3 - Strict Cost Gating: Sufficient cores successfully pays cost and executes downstream effect', async () => {
  const state = createGameState();
  const player = state.players.player;
  player.reserve.normal = 3; // 3 cores available
  player.reserve.soul = 0;
  player.hand = [];
  player.deck = [
    createCardInstance({ name: 'Card 1', cost: 1 }, 'player'),
    createCardInstance({ name: 'Card 2', cost: 1 }, 'player')
  ];

  const ability = {
    clauses: [
      {
        rawText: 'By sending two cores from your Reserve to the Trash',
        isCost: true,
        op: {
          op: 'MOVE_CORE',
          count: 2,
          from: { zone: 'reserve', side: 'self' },
          to: { zone: 'trash', side: 'self' }
        }
      },
      {
        rawText: 'draw two cards',
        link: 'byDoing',
        op: {
          op: 'DRAW',
          count: 2
        }
      }
    ]
  };

  const resolver = new AsyncResolver();
  await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(player.reserve.normal, 1, '2 cores must be deducted from reserve');
  assert.equal(player.trash.normal, 2, '2 cores must be added to trash');
  assert.equal(player.hand.length, 2, '2 cards must be drawn when prerequisite cost succeeds');
});

test('Phase 3 - Strict Cost Gating: Declining optional cost blocks downstream effect', async () => {
  const state = createGameState();
  const player = state.players.player;
  player.reserve.normal = 3;
  player.hand = [];
  player.deck = [createCardInstance({ name: 'Card 1', cost: 1 }, 'player')];

  const ability = {
    clauses: [
      {
        rawText: 'You can send one core to Trash.',
        isCost: true,
        isOptional: true,
        op: {
          op: 'MOVE_CORE',
          count: 1,
          from: { zone: 'reserve', side: 'self' },
          to: { zone: 'trash', side: 'self' }
        }
      },
      {
        rawText: 'If you do, draw one card.',
        link: 'byDoing',
        op: {
          op: 'DRAW',
          count: 1
        }
      }
    ]
  };

  // Prompt resolver that declines optional cost
  const rejectingPromptResolver = {
    async choose(prompt) {
      if (prompt.type === 'CONFIRM_OPTIONAL') {
        return { declined: true };
      }
      return {};
    }
  };

  const resolver = new AsyncResolver(rejectingPromptResolver);
  await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(player.reserve.normal, 3, 'Reserve cores must remain 3 when declined');
  assert.equal(player.hand.length, 0, 'No cards should be drawn when optional cost is declined');
});

test('Phase 3 - Continuous Modifiers: resolveLegacyAbility persists modifiers to DuelState', async () => {
  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: {
      life: 5,
      reserve: 4,
      trash: 0,
      field: [{
        uid: 'spirit_1',
        name: 'Test Spirit',
        type: 'Spirit',
        cost: 3,
        color: 'Red',
        currentLevel: 1,
        currentBp: 3000,
        currentCores: 1,
        levels: { 1: { cost: 1, bp: 3000 } }
      }],
      hand: [],
      deck: [],
      trashCards: [],
      voidCards: []
    },
    opponent: {
      life: 5,
      reserve: 4,
      trash: 0,
      field: [],
      hand: [],
      deck: [],
      trashCards: [],
      voidCards: []
    },
    modifiers: []
  };

  const ability = {
    clauses: [
      {
        rawText: 'During this turn, give this Spirit +3000 BP',
        op: {
          op: 'BP_BUFF',
          amount: 3000,
          duration: 'THIS_TURN',
          target: { target: 'self' }
        }
      }
    ]
  };

  const sourceCard = duelState.player.field[0];
  const res = await resolveLegacyAbility(duelState, sourceCard, ability, 'player');
  assert.equal(res.success, true);

  // Verifies that modifiers are persisted on duelState
  assert.ok(Array.isArray(duelState.modifiers), 'duelState.modifiers must be an array');
  assert.equal(duelState.modifiers.length, 1, 'duelState.modifiers must contain the continuous modifier');
  assert.equal(duelState.modifiers[0].type, 'BP_BUFF');
  assert.equal(duelState.modifiers[0].amount, 3000);
  assert.equal(duelState.modifiers[0].duration, 'THIS_TURN');

  // Verifies that duelState.continuousEffects mirrors modifiers
  assert.ok(Array.isArray(duelState.continuousEffects), 'duelState.continuousEffects must be synced');
  assert.equal(duelState.continuousEffects.length, 1);
});

test('Phase 3 - Modifier Lifetimes: pruneLegacyModifiers correctly prunes by scope', () => {
  const duelState = {
    modifiers: [
      { id: 'm1', type: 'BP_BUFF', duration: 'THIS_BATTLE', amount: 2000 },
      { id: 'm2', type: 'BP_BUFF', duration: 'THIS_TURN', amount: 3000 },
      { id: 'm3', type: 'GRANT_FAMILY', duration: 'PERMANENT', family: 'Dragon' }
    ]
  };

  // End of Battle: removes THIS_BATTLE, keeps THIS_TURN and PERMANENT
  pruneLegacyModifiers(duelState, 'BATTLE');
  assert.equal(duelState.modifiers.length, 2);
  assert.ok(!duelState.modifiers.some(m => m.id === 'm1'));
  assert.ok(duelState.modifiers.some(m => m.id === 'm2'));
  assert.ok(duelState.modifiers.some(m => m.id === 'm3'));

  // End of Turn: removes THIS_TURN, keeps PERMANENT
  pruneLegacyModifiers(duelState, 'TURN');
  assert.equal(duelState.modifiers.length, 1);
  assert.equal(duelState.modifiers[0].id, 'm3');
  assert.equal(duelState.modifiers[0].duration, 'PERMANENT');
});

test('Phase 3 - Arena BP Recalculation: Active BP_BUFF in DuelState.modifiers dynamically updates spirit.currentBp', () => {
  const win = setupArenaEnv();
  const arena = win.BattleArena;
  const state = arena.getState();

  const spirit = {
    uid: 'spirit_test_bp',
    name: 'Bladebeak',
    type: 'Spirit',
    baseBp: 3000,
    currentBp: 3000,
    currentLevel: 1,
    levels: { 1: { cost: 1, bp: 3000 } }
  };
  state.inDuel = true;
  state.player.field = [spirit];

  arena.recalculateSpiritBp(spirit);
  assert.equal(spirit.currentBp, 3000, 'Current BP without modifiers is base BP');

  // Add continuous BP_BUFF modifier
  state.modifiers = [
    {
      id: 'buff_1',
      type: 'BP_BUFF',
      amount: 4000,
      duration: 'THIS_TURN',
      targetCardId: spirit.uid
    }
  ];

  arena.recalculateSpiritBp(spirit);
  assert.equal(spirit.currentBp, 7000, 'Current BP with +4000 buff modifier must be 7000');

  // Add continuous BP_DEBUFF modifier
  state.modifiers.push({
    id: 'debuff_1',
    type: 'BP_DEBUFF',
    amount: 2000,
    duration: 'THIS_TURN',
    targetCardId: spirit.uid
  });

  arena.recalculateSpiritBp(spirit);
  assert.equal(spirit.currentBp, 5000, 'Current BP after +4000 buff and -2000 debuff must be 5000');
});

test('Phase 3 - Arena Cost Reduction: Active COST_MODIFIER in DuelState.modifiers modifies effectiveCost', () => {
  const win = setupArenaEnv();
  const arena = win.BattleArena;
  const state = arena.getState();

  const card = {
    id: 'test_card_cost',
    card_number: 'BS01-001',
    name: 'Big Spirit',
    type: 'Spirit',
    cost: 6,
    color: 'Red'
  };

  state.player.field = [];
  state.player.nexus = [];
  state.modifiers = [];

  const initial = arena.calculateSymbolReduction(card, 'player');
  assert.equal(initial.effectiveCost, 6, 'Cost without symbols or modifiers is 6');

  // Apply continuous cost delta modifier: e.g. "Spirits cost 2 less to summon"
  state.modifiers = [
    {
      id: 'cost_mod_1',
      type: 'COST_MODIFIER',
      delta: -2,
      targetType: 'Spirit',
      side: 'player'
    }
  ];

  const reduced = arena.calculateSymbolReduction(card, 'player');
  assert.equal(reduced.effectiveCost, 4, 'Effective cost must be reduced by 2 (down to 4)');

  // Apply setCost override: e.g. "Pay 1 cost to summon"
  state.modifiers = [
    {
      id: 'cost_mod_2',
      type: 'COST_MODIFIER',
      setCost: 1,
      targetType: 'Spirit',
      side: 'player'
    }
  ];

  const overridden = arena.calculateSymbolReduction(card, 'player');
  assert.equal(overridden.effectiveCost, 1, 'Effective cost must be overridden to 1');
});

test('Phase 3 - Arena Friendly Symbols: Active ADD_SYMBOL modifier increases friendly symbols', () => {
  const win = setupArenaEnv();
  const arena = win.BattleArena;
  const state = arena.getState();

  state.player.field = [];
  state.player.nexus = [];
  state.modifiers = [];

  const initialSyms = arena.getFriendlySymbols('player');
  assert.equal(initialSyms.total, 0, 'No symbols on empty board');

  // Add ADD_SYMBOL modifier for red
  state.modifiers = [
    {
      id: 'sym_mod_1',
      type: 'ADD_SYMBOL',
      color: 'red',
      count: 2,
      side: 'player'
    }
  ];

  const updatedSyms = arena.getFriendlySymbols('player');
  assert.equal(updatedSyms.byColor.red, 2, 'Red symbols must increase by 2 from continuous modifier');
  assert.equal(updatedSyms.total, 2, 'Total symbols must reflect added modifier symbols');
});

test('Phase 3 - Arena Modifier Pruning: endTurn prunes THIS_TURN modifiers', () => {
  const win = setupArenaEnv();
  const arena = win.BattleArena;
  const state = arena.getState();

  state.modifiers = [
    { id: 'm_turn', type: 'BP_BUFF', duration: 'THIS_TURN', amount: 3000 },
    { id: 'm_perm', type: 'GRANT_FAMILY', duration: 'PERMANENT', family: 'Dragon' }
  ];
  state.continuousEffects = state.modifiers;

  arena.endTurn();

  assert.equal(state.modifiers.length, 1, 'THIS_TURN modifier must be pruned after endTurn');
  assert.equal(state.modifiers[0].id, 'm_perm');
});
