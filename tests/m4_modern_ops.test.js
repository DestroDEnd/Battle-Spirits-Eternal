/**
 * tests/m4_modern_ops.test.js
 *
 * Milestone 4 Verification Suite:
 * - Grandwalker Nexus operations (CORE_CHARGE_TRIGGER, CORE_CHARGE_ADD, GRANDWALKER_CORE_RULE, GRANDWALKER_ACTION)
 * - Rebirth / Dual-Side operations (REBIRTH_FLIP, REBIRTH_CORE_PLACEMENT)
 * - Generic Keyword Dispatchers (KEYWORD_RULE, KEYWORD_ABILITY, KEYWORD_ACTION: Crush, Windstorm, Holy Life, Clash, Armor, Accel, Mirage)
 * - Tribute & Awaken & Seal Mechanics (TRIBUTE_COST, AWAKEN_CORE_MOVE, SEAL_MOVE)
 * - Modern Companion Ops (MOVE_SOUL_CORE, REFRESH_BY_EXHAUSTING_NEXUS, REMAIN_ON_FIELD_EXHAUSTED, BANISH_TRASH, EXTRA_TURN, COMPARE_BP)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { FlowController } from '../engine/flow.js';

function makeTestState() {
  const state = createGameState();
  state.players.player.reserve.normal = 5;
  state.players.player.reserve.soul = 1;
  state.players.player.life = 5;
  state.players.opponent.reserve.normal = 5;
  state.players.opponent.reserve.soul = 1;
  state.players.opponent.life = 5;
  return state;
}

test('M4-1: Grandwalker Core Charge Trigger, Core Charge Add, Core Rule, and Grandwalker Action', async () => {
  const state = makeTestState();
  const gwCard = { id: 'gw_alex', cardNumber: 'BS47-X08', name: 'Grandwalker Alex', type: 'Grandwalker Nexus', cost: 2, colors: ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'] };
  const gwStack = createFieldStack(gwCard, { normal: 0, soul: 0 });
  state.players.player.field.push(gwStack);

  state.players.player.deck = [
    { id: 'd1', cardNumber: 'BS47-001', name: 'Red Dragon', type: 'Spirit', colors: ['Red'], cost: 4 },
    { id: 'd2', cardNumber: 'BS47-020', name: 'Blue Golem', type: 'Spirit', colors: ['Blue'], cost: 3 },
    { id: 'd3', cardNumber: 'BS47-002', name: 'Red Wyvern', type: 'Spirit', colors: ['Red'], cost: 6 }
  ];

  // 1. GRANDWALKER_CORE_RULE
  const ruleRes = await executeOp(state, { op: 'GRANDWALKER_CORE_RULE', cores: 1 }, { controller: 'player', sourceCard: gwCard, sourceStack: gwStack });
  assert.equal(ruleRes.success, true);
  assert.equal(gwStack.cores.normal, 1);
  assert.equal(state.modifiers.some(m => m.type === 'GRANDWALKER_CORE_RULE' && m.coreChargeOnly === true), true);

  // 2. CORE_CHARGE_TRIGGER (mill 3, match Red -> 2 matches -> +2 cores)
  const ccTrigRes = await executeOp(state, { op: 'CORE_CHARGE_TRIGGER', millCount: 3, filter: { color: 'Red' } }, { controller: 'player', sourceCard: gwCard, sourceStack: gwStack });
  assert.equal(ccTrigRes.success, true);
  assert.equal(ccTrigRes.milledCount, 3);
  assert.equal(ccTrigRes.addedCores, 2);
  assert.equal(gwStack.cores.normal, 3);
  assert.equal(state.players.player.grave.length, 3);

  // 3. CORE_CHARGE_ADD (+2 cores directly)
  const ccAddRes = await executeOp(state, { op: 'CORE_CHARGE_ADD', count: 2 }, { controller: 'player', sourceCard: gwCard, sourceStack: gwStack });
  assert.equal(ccAddRes.success, true);
  assert.equal(gwStack.cores.normal, 5);

  // 4. GRANDWALKER_ACTION (pay 4 cores for skill)
  const gwActRes = await executeOp(state, { op: 'GRANDWALKER_ACTION', costCores: 4, action: 'GRANDWALKER_SKILL' }, { controller: 'player', sourceCard: gwCard, sourceStack: gwStack });
  assert.equal(gwActRes.success, true);
  assert.equal(gwActRes.costPaid, 4);
  assert.equal(gwStack.cores.normal, 1);

  // 5. GRANDWALKER_ACTION fails when insufficient cores
  const gwFailRes = await executeOp(state, { op: 'GRANDWALKER_ACTION', costCores: 3 }, { controller: 'player', sourceCard: gwCard, sourceStack: gwStack });
  assert.equal(gwFailRes.success, false);
  assert.equal(gwFailRes.reason, 'INSUFFICIENT_GRANDWALKER_CORES');
  assert.equal(gwStack.cores.normal, 1);
});

test('M4-2: Rebirth Flip and Rebirth Core Placement', async () => {
  const state = makeTestState();
  const aSideCard = {
    id: 'rebirth_1',
    cardNumber: 'BS52-TX01',
    name: 'Chronodragon A-Side',
    type: 'Spirit',
    cost: 4,
    levels: { 1: { cost: 1, bp: 4000 } },
    backSide: {
      name: 'Chronodragon B-Side Sovereign',
      cost: 7,
      levels: { 1: { cost: 1, bp: 12000 } }
    }
  };
  const stack = createFieldStack(aSideCard, { normal: 1, soul: 0 });
  stack.exhausted = true;
  state.players.player.field.push(stack);

  const flipRes = await executeOp(state, {
    op: 'REBIRTH_FLIP',
    placeSoulCore: true,
    addCount: 1
  }, { controller: 'player', sourceCard: aSideCard, sourceStack: stack });

  assert.equal(flipRes.success, true);
  assert.equal(stack.isReborn, true);
  assert.equal(stack.top.name, 'Chronodragon B-Side Sovereign');
  assert.equal(stack.exhausted, false, 'Rebirth flip refreshes the stack by default');
  assert.equal(stack.cores.soul, 1, 'Soul Core placed onto Reborn Spirit');
  assert.equal(state.players.player.count, 1, 'Player count incremented on Rebirth');

  const corePlaceRes = await executeOp(state, {
    op: 'REBIRTH_CORE_PLACEMENT',
    count: 2,
    from: 'void'
  }, { controller: 'player', sourceCard: stack.top, sourceStack: stack });

  assert.equal(corePlaceRes.success, true);
  assert.equal(corePlaceRes.movedCores, 2);
  assert.equal(stack.cores.normal, 3);
});

test('M4-3: Generic Keyword Dispatchers (Crush, Windstorm, Holy Life, Clash, Armor, Mirage, Accel)', async () => {
  const state = makeTestState();
  const spCard = { id: 'kw_sp', cardNumber: 'BS04-X16', name: 'Keyword Titan', type: 'Spirit', cost: 6, levels: { 1: { cost: 1, bp: 5000 }, 2: { cost: 3, bp: 8000 } } };
  const spStack = createFieldStack(spCard, { normal: 3, soul: 0 }); // Level 2
  state.players.player.field.push(spStack);

  const oppStack1 = createFieldStack({ id: 'opp_1', cardNumber: 'BS01-001', name: 'Opp 1', type: 'Spirit' }, { normal: 1, soul: 0 });
  const oppStack2 = createFieldStack({ id: 'opp_2', cardNumber: 'BS01-002', name: 'Opp 2', type: 'Spirit' }, { normal: 1, soul: 0 });
  state.players.opponent.field.push(oppStack1, oppStack2);
  state.players.opponent.deck = [{ id: 'od1' }, { id: 'od2' }, { id: 'od3' }];

  // 1. Crush (mills opponent deck equal to Level = 2)
  const crushRes = await executeOp(state, { op: 'KEYWORD_ACTION', keyword: 'Crush' }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(crushRes.success, true);
  assert.equal(crushRes.milledCount, 2);
  assert.equal(state.players.opponent.grave.length, 2);

  // 2. Windstorm (exhausts opposing spirits)
  const windRes = await executeOp(state, { op: 'KEYWORD_ACTION', keyword: 'Windstorm', count: 2 }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(windRes.success, true);
  assert.equal(windRes.exhaustedCount, 2);
  assert.equal(oppStack1.exhausted, true);
  assert.equal(oppStack2.exhausted, true);

  // 3. Holy Life (+1 Life)
  const holyRes = await executeOp(state, { op: 'KEYWORD_ACTION', keyword: 'Holy Life' }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(holyRes.success, true);
  assert.equal(state.players.player.life, 6);

  // 4. Clash (registers FORCE_BLOCK on opponent)
  const clashRes = await executeOp(state, { op: 'KEYWORD_RULE', keyword: 'Clash' }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(clashRes.success, true);
  assert.equal(state.modifiers.some(m => m.type === 'FORCE_BLOCK' && m.side === 'opponent'), true);

  // 5. Armor (registers IMMUNITY modifier)
  const armorRes = await executeOp(state, { op: 'KEYWORD_ABILITY', keyword: 'Heavy Armor', colors: ['Red', 'White'] }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(armorRes.success, true);
  assert.deepEqual(armorRes.armorColors, ['Red', 'White']);

  // 6. Mirage & Accel
  const mirageCard = { id: 'mir_1', cardNumber: 'BS56-001', name: 'Mirage Card', type: 'Spirit' };
  const mirRes = await executeOp(state, { op: 'KEYWORD_ACTION', keyword: 'Mirage' }, { controller: 'player', sourceCard: mirageCard });
  assert.equal(mirRes.success, true);
  assert.equal(state.players.player.mirage.id, 'mir_1');

  const accelCard = { id: 'acc_1', cardNumber: 'BS35-001', name: 'Accel Card', type: 'Spirit' };
  state.players.player.hand.push(accelCard);
  const accRes = await executeOp(state, { op: 'KEYWORD_ACTION', keyword: 'Accel' }, { controller: 'player', sourceCard: accelCard });
  assert.equal(accRes.success, true);
  assert.equal(state.players.player.removed.some(c => c.id === 'acc_1'), true);
});

test('M4-4: Tribute Cost, Awaken Core Move, and Seal Move', async () => {
  const state = makeTestState();
  const fodderCard = { id: 'fodder_1', cardNumber: 'BS06-001', name: 'Fodder Spirit', type: 'Spirit', cost: 4, family: ['Dragon'] };
  const fodderStack = createFieldStack(fodderCard, { normal: 2, soul: 0 });
  const bossCard = { id: 'boss_1', cardNumber: 'BS06-X01', name: 'Emperor Dragon', type: 'Spirit', cost: 8 };
  const bossStack = createFieldStack(bossCard, { normal: 1, soul: 1 }); // has Soul Core
  state.players.player.field.push(fodderStack, bossStack);

  // 1. AWAKEN_CORE_MOVE (moves 2 cores from fodderStack onto bossStack)
  const awakenRes = await executeOp(state, { op: 'AWAKEN_CORE_MOVE', count: 2, allowReserve: false }, { controller: 'player', sourceCard: bossCard, sourceStack: bossStack });
  assert.equal(awakenRes.success, true);
  assert.equal(awakenRes.movedCores, 2);
  assert.equal(bossStack.cores.normal, 3);
  assert.equal(fodderStack.cores.normal, 0);

  // Put 1 core back on fodder so it can be tributed
  fodderStack.cores.normal = 1;

  // 2. TRIBUTE_COST (tributes fodderStack -> Void, moves fodderCard to grave)
  const tribRes = await executeOp(state, { op: 'TRIBUTE_COST', minCost: 3, destination: 'VOID' }, { controller: 'player', sourceCard: bossCard, sourceStack: bossStack });
  assert.equal(tribRes.success, true);
  assert.equal(tribRes.tributedCard.id, 'fodder_1');
  assert.equal(state.players.player.field.some(s => s.top.id === 'fodder_1'), false);
  assert.equal(state.players.player.grave.some(c => c.id === 'fodder_1'), true);

  // 3. SEAL_MOVE (moves Soul Core from bossStack to Life -> isDuringSeal = true, life +1)
  const sealRes = await executeOp(state, { op: 'SEAL_MOVE' }, { controller: 'player', sourceCard: bossCard, sourceStack: bossStack });
  assert.equal(sealRes.success, true);
  assert.equal(bossStack.cores.soul, 0);
  assert.equal(state.players.player.life, 6);
  assert.equal(state.players.player.isDuringSeal, true);
});

test('M4-5: Companion Modern Ops (REFRESH_BY_EXHAUSTING_NEXUS, REMAIN_ON_FIELD_EXHAUSTED, BANISH_TRASH, EXTRA_TURN, COMPARE_BP)', async () => {
  const state = makeTestState();
  const spCard = { id: 'sp_main', owner: 'player', cardNumber: 'BS40-X01', name: 'Hero Spirit', type: 'Spirit', cost: 6, bp: 10000, levels: { 1: { cost: 1, bp: 10000 } } };
  const spStack = createFieldStack(spCard, { normal: 2, soul: 0 });
  spStack.exhausted = true;
  const nexCard = { id: 'nex_1', owner: 'player', cardNumber: 'BS40-060', name: 'Shrine Nexus', type: 'Nexus', cost: 3, levels: { 1: { cost: 0, bp: 0 } } };
  const nexStack = createFieldStack(nexCard, { normal: 0, soul: 0 });
  state.players.player.field.push(spStack, nexStack);

  // 1. REFRESH_BY_EXHAUSTING_NEXUS
  const refNexRes = await executeOp(state, { op: 'REFRESH_BY_EXHAUSTING_NEXUS' }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(refNexRes.success, true);
  assert.equal(nexStack.exhausted, true);
  assert.equal(spStack.exhausted, false);

  // 2. REMAIN_ON_FIELD_EXHAUSTED
  const remRes = await executeOp(state, { op: 'REMAIN_ON_FIELD_EXHAUSTED' }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(remRes.success, true);
  assert.equal(spStack.exhausted, true);

  // 3. BANISH_TRASH
  state.players.opponent.grave.push({ id: 'opp_g1', cardNumber: 'BS01-010', name: 'Grave Card' });
  const banRes = await executeOp(state, { op: 'BANISH_TRASH', side: 'opponent', count: 1 }, { controller: 'player', sourceCard: spCard });
  assert.equal(banRes.success, true);
  assert.equal(banRes.banishedCount, 1);
  assert.equal(state.players.opponent.grave.length, 0);
  assert.equal(state.players.opponent.removed.length, 1);

  // 4. COMPARE_BP (10000 BP vs 4000 BP opponent -> destroys opponent)
  const weakOpp = createFieldStack({ id: 'opp_weak', cardNumber: 'BS01-005', name: 'Weak Spirit', type: 'Spirit', bp: 4000, levels: { 1: { cost: 1, bp: 4000 } } }, { normal: 1, soul: 0 });
  state.players.opponent.field.push(weakOpp);
  const cmpRes = await executeOp(state, { op: 'COMPARE_BP' }, { controller: 'player', sourceCard: spCard, sourceStack: spStack });
  assert.equal(cmpRes.success, true);
  assert.equal(cmpRes.winner, 'player');
  assert.equal(state.players.opponent.field.length, 0);

  // 5. EXTRA_TURN + FlowController integration
  state.activePlayer = 'player';
  state.step = 'END';
  const extRes = await executeOp(state, { op: 'EXTRA_TURN', count: 1 }, { controller: 'player', sourceCard: spCard });
  assert.equal(extRes.success, true);
  assert.equal(state.players.player.extraTurns, 1);

  const flow = new FlowController(state);
  await flow.advanceStep();
  assert.equal(state.activePlayer, 'player', 'Player retains active turn when extraTurns > 0');
  assert.equal(state.players.player.extraTurns, 0, 'Extra turn counter decremented');
  assert.equal(state.step, 'START');
});
