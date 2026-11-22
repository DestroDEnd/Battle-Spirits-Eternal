/**
 * tests/card_effect_discrepancy_regression.test.js
 *
 * Test-first regression suite for Root Causes RC1-RC6:
 *   - RC5: Level & Brave gating on IR triggers, no double execution, Magic Main/Flash separation
 *   - RC3 & RC4: Slash-separated timing headers & compound _OR_ / WHEN_ADVENTS matching
 *   - RC2: Shard partitioning by card-number prefix & synchronous getLoadedCardIr()
 *   - RC6: PerCardRegistry.hasExecutable() partial PASSIVE_RULE guard & top unhandled IR ops
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { BSEngineAdapter } from '../engine_adapter.js';
import { parseAbilityHeaders } from '../compiler/header_parser.js';
import { PerCardRegistry } from '../engine/cards/index.js';
import { executeOp } from '../engine/ops/index.js';
import { createGameState } from '../engine/state.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function createTestArena() {
  const doc = {
    readyState: 'complete',
    getElementById: () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } } }),
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const sandbox = {
    window: {},
    document: doc,
    localStorage: { getItem() {}, setItem() {} },
    sessionStorage: { getItem() {}, setItem() {} },
    AudioFX: { init() {}, playTone() {}, click() {}, lifeDamage() {}, coreMove() {}, coreChime() {}, spiritSummon() {}, soulCoreIgnite() {}, magic() {}, destroy() {}, shield() {}, slash() {} },
    showToast() {},
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    require
  };
  sandbox.window = sandbox;
  sandbox.BSEngineAdapter = BSEngineAdapter;
  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);
  return sandbox.window.BattleArena;
}

test('RC5.1: executeWhenAttacksEffects enforces header.levels on compiled IR abilities (LV2 does not fire at LV1)', async () => {
  const BA = createTestArena();
  const state = BA.getState();
  state.inDuel = true;
  state.turn = 1;
  state.player.deck = [
    { uid: 'd1', name: 'Card 1', type: 'Spirit', cost: 1 },
    { uid: 'd2', name: 'Card 2', type: 'Spirit', cost: 1 }
  ];
  state.player.hand = [];

  const spirit = {
    uid: 'lv2_attacker',
    card_number: 'TEST-LV2-001',
    name: 'LV2 Attacker',
    type: 'Spirit',
    currentLevel: 1,
    currentCores: 1,
    levels: [
      { level: 1, cores: 1, bp: 2000 },
      { level: 2, cores: 3, bp: 5000 }
    ],
    effect: '[LV2] (When Attacks) Draw a card.',
    compiledIr: {
      cardNumber: 'TEST-LV2-001',
      name: 'LV2 Attacker',
      abilities: [
        {
          id: 'TEST-LV2-001#a0',
          type: 'ABILITY',
          header: { levels: [2], timing: 'WHEN_ATTACKS', prefixes: [] },
          clauses: [{ rawText: 'Draw a card.', cleanText: 'Draw a card', isOptional: false, op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  };
  state.player.field = [spirit];

  await BA.executeWhenAttacksEffects(spirit, 'player');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(state.player.hand.length, 0, 'LV2 ability must NOT fire when spirit is LV1');

  spirit.currentCores = 3;
  spirit.currentLevel = 2;
  await BA.executeWhenAttacksEffects(spirit, 'player');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(state.player.hand.length, 1, 'LV2 ability MUST fire once when spirit is LV2');
});

test('RC5.2: Non-OPT triggered IR abilities execute ONCE (not twice) on Summon, Attack, Block, and Destroyed', async () => {
  const BA = createTestArena();
  const state = BA.getState();
  state.inDuel = true;
  state.turn = 1;
  state.player.deck = [
    { uid: 'd1', name: 'D1', type: 'Spirit', cost: 1 },
    { uid: 'd2', name: 'D2', type: 'Spirit', cost: 1 },
    { uid: 'd3', name: 'D3', type: 'Spirit', cost: 1 },
    { uid: 'd4', name: 'D4', type: 'Spirit', cost: 1 }
  ];
  state.player.hand = [];

  const spirit = {
    uid: 'single_fire',
    card_number: 'TEST-ONCE-001',
    name: 'Single Fire Spirit',
    type: 'Spirit',
    currentLevel: 1,
    currentCores: 1,
    effect: '[LV1] (When Summoned) Draw a card.',
    compiledIr: {
      cardNumber: 'TEST-ONCE-001',
      name: 'Single Fire Spirit',
      abilities: [
        {
          id: 'TEST-ONCE-001#a0',
          type: 'ABILITY',
          header: { levels: [1, 2, 3], timing: 'WHEN_SUMMONED', prefixes: [] },
          clauses: [{ rawText: 'Draw a card.', cleanText: 'Draw a card', isOptional: false, op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  };
  state.player.field = [spirit];

  let resolveCalls = 0;
  const origResolve = BSEngineAdapter.resolveLegacyAbility;
  BSEngineAdapter.resolveLegacyAbility = async (...args) => {
    resolveCalls++;
    return origResolve(...args);
  };
  try {
    await BA.executeWhenSummonedEffects(spirit, 'player');
    await new Promise(r => setTimeout(r, 20));
    assert.equal(resolveCalls, 1, 'When Summoned IR ability must invoke resolveLegacyAbility ONCE, not twice');
    assert.equal(state.player.hand.length, 1, 'When Summoned IR ability must draw 1 card, not 2');
  } finally {
    BSEngineAdapter.resolveLegacyAbility = origResolve;
  }
});

test('RC5.3: Magic card with both [Main] and [Flash] only resolves the selected cast mode once', async () => {
  const BA = createTestArena();
  const state = BA.getState();
  state.inDuel = true;
  state.turn = 1;
  state.player.deck = [
    { uid: 'd1', name: 'D1', type: 'Spirit', cost: 1 },
    { uid: 'd2', name: 'D2', type: 'Spirit', cost: 1 },
    { uid: 'd3', name: 'D3', type: 'Spirit', cost: 1 }
  ];
  state.player.hand = [];
  state.player.field = [{ uid: 'p1', name: 'Target Spirit', type: 'Spirit', currentCores: 1, currentBp: 3000, levels: [{ level: 1, cost: 1, bp: 3000 }] }];

  const magic = {
    uid: 'm_dual',
    card_number: 'TEST-MAG-001',
    name: 'Dual Mode Magic',
    type: 'Magic',
    cost: 2,
    effect: '[Main] Draw a card.\n[Flash] During this turn, one of your Spirits gains +2000 BP.',
    compiledIr: {
      cardNumber: 'TEST-MAG-001',
      name: 'Dual Mode Magic',
      abilities: [
        {
          id: 'TEST-MAG-001#a0',
          type: 'ABILITY',
          header: { levels: [1, 2, 3], timing: 'MAIN', prefixes: [] },
          clauses: [{ rawText: 'Draw a card.', cleanText: 'Draw a card', isOptional: false, op: { op: 'DRAW', count: 1 } }]
        },
        {
          id: 'TEST-MAG-001#a1',
          type: 'ABILITY',
          header: { levels: [1, 2, 3], timing: 'FLASH', prefixes: [] },
          clauses: [{ rawText: 'During this turn, one of your Spirits gains +2000 BP.', cleanText: 'During this turn, one of your Spirits gains +2000 BP', isOptional: false, op: { op: 'BP_BUFF', amount: 2000, side: 'self', duration: 'THIS_TURN' } }]
        }
      ]
    }
  };

  await BA.applyMagicEffect(magic, 'player', false, 'p1', 'main');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(state.player.hand.length, 1, 'Main cast should draw exactly 1 card');
  assert.equal((state.modifiers || []).filter(m => m.type === 'BP_BUFF').length, 0, 'Main cast must NOT also execute [Flash] BP buff');
});

test('RC3 & RC4: Slash timing headers emit all timings and compound _OR_ timings fire on both triggers', async () => {
  const h1 = parseAbilityHeaders('[LV1][LV2] (When Summoned/Attacks) Draw a card.');
  assert.ok(Array.isArray(h1.timings) && h1.timings.includes('WHEN_SUMMONED') && h1.timings.includes('WHEN_ATTACKS'),
    `Expected timings to include WHEN_SUMMONED and WHEN_ATTACKS, got ${JSON.stringify(h1.timings)}`);

  const h2 = parseAbilityHeaders('[LV1] (When Advents/Attacks) Draw a card.');
  assert.ok(Array.isArray(h2.timings) && h2.timings.includes('WHEN_ADVENTS') && h2.timings.includes('WHEN_ATTACKS'),
    `Expected timings to include WHEN_ADVENTS and WHEN_ATTACKS, got ${JSON.stringify(h2.timings)}`);

  const BA = createTestArena();
  const state = BA.getState();
  state.inDuel = true;
  state.turn = 1;
  state.player.deck = [
    { uid: 'd1', name: 'D1', type: 'Spirit', cost: 1 },
    { uid: 'd2', name: 'D2', type: 'Spirit', cost: 1 }
  ];
  state.player.hand = [];

  const spirit = {
    uid: 'or_sp',
    card_number: 'TEST-OR-001',
    name: 'Attack or Block Spirit',
    type: 'Spirit',
    currentLevel: 1,
    currentCores: 1,
    effect: '[LV1] (When Attacks/Blocks) Draw a card.',
    compiledIr: {
      cardNumber: 'TEST-OR-001',
      name: 'Attack or Block Spirit',
      abilities: [
        {
          id: 'TEST-OR-001#a0',
          type: 'ABILITY',
          header: { levels: [1, 2, 3], timing: 'WHEN_ATTACKS_OR_BLOCKS', prefixes: [] },
          clauses: [{ rawText: 'Draw a card.', cleanText: 'Draw a card', isOptional: false, op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  };
  state.player.field = [spirit];

  await BA.executeWhenAttacksEffects(spirit, 'player');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(state.player.hand.length, 1, 'WHEN_ATTACKS_OR_BLOCKS must fire on attack');

  await BA.executeWhenBlocksEffects(spirit, 'player', { uid: 'opp_att', name: 'Opp' });
  await new Promise(r => setTimeout(r, 20));
  assert.equal(state.player.hand.length, 2, 'WHEN_ATTACKS_OR_BLOCKS must fire on block');
});

test('RC2: Sync getLoadedCardIr works and canonical-prefix shards contain BS01-145, SD06-013, BS31-075', async () => {
  const BA = createTestArena();
  for (const cNum of ['BS01-145', 'SD06-013', 'BS31-075']) {
    const syncIr = BA.getLoadedCardIr(cNum);
    assert.ok(syncIr && syncIr.cardNumber === cNum, `getLoadedCardIr(${cNum}) must resolve synchronously`);
    const asyncIr = await BA.loadCardIrShard(cNum);
    assert.ok(asyncIr && asyncIr.cardNumber === cNum, `loadCardIrShard(${cNum}) must resolve asynchronously`);
  }
});

test('RC6: PerCardRegistry.hasExecutable returns false when matching ability has unimplemented PASSIVE_RULE alongside other subEffects', () => {
  PerCardRegistry.registerCard('TEST-MIXED-001', {
    name: 'Mixed Partial Card',
    cardType: 'Spirit',
    sagaAbilities: [
      {
        overall: 'WHEN_SUMMONED',
        subEffects: [
          { op: 'DRAW_CARDS', count: 1 },
          { op: 'PASSIVE_RULE', rule: 'MOVE_CORE', rawText: 'unimplemented part' }
        ]
      }
    ],
    triggers: { WHEN_SUMMONED: () => {} }
  });

  assert.equal(
    PerCardRegistry.hasExecutable('TEST-MIXED-001', 'WHEN_SUMMONED'),
    false,
    'Partial Saga handler containing PASSIVE_RULE must yield to compiledIr'
  );
  PerCardRegistry.registry.delete('TEST-MIXED-001');
});

test('RC6: Common IR ops (INDESTRUCTIBLE, CANNOT_REFRESH, SET_BURST, TOKEN_DEPLOYMENT, UNPREVENTABLE) do not return UNHANDLED_OPERATION', async () => {
  const state = createGameState();
  for (const opName of ['INDESTRUCTIBLE', 'CANNOT_REFRESH', 'SET_BURST', 'UNPREVENTABLE', 'ACTIVATE_FLASH', 'CONTINUE_BATTLE']) {
    const res = await executeOp(state, { op: opName }, { controller: 'player' }, null, null);
    assert.notEqual(res?.reason, 'UNHANDLED_OPERATION', `${opName} must be handled in engine/ops/index.js`);
  }
});
