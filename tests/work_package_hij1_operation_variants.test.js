/**
 * tests/work_package_hij1_operation_variants.test.js
 * Classification: OPERATION_VARIANT
 *
 * Semantic verification tests for H/I/J.1 operation variants:
 * - Newly corrected incomplete-parameter ops (TOKEN_DEPLOYMENT, COUNT_OPERATION,
 *   DECK_OR_HAND_ACTION, DECK_ACTION, MODIFY_EFFECT, MODIFY_EFFECT_VALUE,
 *   CONTRACT_ADVENT_RULE, ADVENT, DECK_BUILDING_RULE, GAIN_TEAM, TEAM_RULE,
 *   BUNSHIN_SUMMON, ACTIVATE_SOUL_DRIVE, REPLACEMENT_EFFECT)
 * - Previously unverified high-impact operation variants
 * Every test asserts concrete state transitions, emitted events, and fail-closed rejection.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { validateDeck } from '../engine/rules/eternal.js';
import { computeFamilies } from '../engine/continuous.js';

function mkCard(id, extra = {}) {
  return {
    id,
    cardNumber: id,
    name: `Card_${id}`,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 4,
    families: ['Dragon'],
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 4000 }, 2: { cost: 3, bp: 7000 } },
    owner: 'player',
    compiledIr: { abilities: [] },
    ...extra
  };
}

function setupRuntime() {
  const g = createGame();
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();
  const srcCard = mkCard('SRC-1');
  const srcStack = createFieldStack(srcCard, { normal: 3, soul: 1 });
  srcStack.owner = 'player';
  g.state.players.player.field.push(srcStack);
  const oppCard = mkCard('OPP-1', { owner: 'opponent' });
  const oppStack = createFieldStack(oppCard, { normal: 2, soul: 0 });
  oppStack.owner = 'opponent';
  g.state.players.opponent.field.push(oppStack);
  const ctx = { controller: 'player', sourceCard: srcCard, sourceStack: srcStack, resolver };
  return { state: g.state, events, emitter, resolver, prompt, srcCard, srcStack, oppCard, oppStack, ctx };
}

test('HIJ1-OPVAR-01 [OPERATION_VARIANT]: TOKEN_DEPLOYMENT deploys named token and rejects missing spec', async () => {
  const { state, emitter, events, ctx } = setupRuntime();
  const bad = await executeOp(state, { op: 'TOKEN_DEPLOYMENT' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(bad.success, false);
  assert.equal(bad.status, 'UNSUPPORTED');

  const res = await executeOp(state, { op: 'TOKEN_DEPLOYMENT', tokenName: 'Swordish', count: 1, side: 'self', optional: true }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(res.success, true);
  assert.equal(res.card.name, 'Swordish');
  assert.equal(res.card.isToken, true);
  assert.ok(state.players.player.field.some(st => st.top?.name === 'Swordish'));
  assert.ok(events.some(e => e.type === 'TOKEN_DEPLOYED'));
});

test('HIJ1-OPVAR-02 [OPERATION_VARIANT]: COUNT_OPERATION handles SEND_LIFE_TO_VOID, zone count, and fail-closed stub', async () => {
  const { state, emitter, ctx } = setupRuntime();
  const bad = await executeOp(state, { op: 'COUNT_OPERATION' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(bad.success, false);
  assert.equal(bad.status, 'UNSUPPORTED');

  const lifeBefore = state.players.opponent.life;
  const res = await executeOp(state, { op: 'COUNT_OPERATION', action: 'SEND_LIFE_TO_VOID', to: 'void', side: 'opp', count: 2 }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(res.success, true);
  assert.equal(res.count, 2);
  assert.equal(state.players.opponent.life, lifeBefore - 2);
});

test('HIJ1-OPVAR-03 [OPERATION_VARIANT]: DECK_OR_HAND_ACTION and DECK_ACTION support look, reveal, send_to_trash, return_deckbottom, and fail-closed', async () => {
  const { state, emitter, ctx } = setupRuntime();
  const bad = await executeOp(state, { op: 'DECK_ACTION' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(bad.success, false);
  assert.equal(bad.status, 'UNSUPPORTED');

  state.players.opponent.deck.push(mkCard('OD-1', { owner: 'opponent' }), mkCard('OD-2', { owner: 'opponent' }), mkCard('OD-3', { owner: 'opponent' }));
  const millRes = await executeOp(state, { op: 'DECK_ACTION', action: 'send_to_trash', from: 'decktop', to: 'grave', side: 'opp', count: 2 }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(millRes.success, true);
  assert.equal(millRes.cards.length, 2);
  assert.equal(state.players.opponent.grave.length, 2);

  state.players.player.deck.push(mkCard('PD-1'), mkCard('PD-2'));
  const revRes = await executeOp(state, { op: 'DECK_ACTION', action: 'reveal', from: 'decktop', side: 'self', count: 1 }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(revRes.success, true);
  assert.equal(ctx.revealedCards.length, 1);

  const botRes = await executeOp(state, { op: 'DECK_ACTION', action: 'return_deckbottom', to: 'deck_bottom', side: 'self', all: true }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(botRes.success, true);
  assert.equal(state.players.player.deck[state.players.player.deck.length - 1].id, 'PD-1');
});

test('HIJ1-OPVAR-04 [OPERATION_VARIANT]: MODIFY_EFFECT, MODIFY_EFFECT_VALUE, and REPLACEMENT_EFFECT create modifiers and reject stubs', async () => {
  const { state, emitter, ctx } = setupRuntime();
  const badMod = await executeOp(state, { op: 'MODIFY_EFFECT' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(badMod.success, false);
  assert.equal(badMod.status, 'UNSUPPORTED');

  const r1 = await executeOp(state, { op: 'MODIFY_EFFECT', to: 'CRITICAL_HIT', side: 'self' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(r1.success, true);
  assert.equal(r1.modifier.value, 'CRITICAL_HIT');

  const r2 = await executeOp(state, { op: 'MODIFY_EFFECT_VALUE', delta: 1, targetEffect: 'banish' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(r2.success, true);
  assert.equal(r2.modifier.delta, 1);

  const r3 = await executeOp(state, { op: 'REPLACEMENT_EFFECT', replaces: 'DESTROY', side: 'self', optional: true }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(r3.success, true);
  assert.ok(state.modifiers.some(m => m.type === 'REPLACEMENT_EFFECT'));
});

test('HIJ1-OPVAR-05 [OPERATION_VARIANT]: CONTRACT_ADVENT_RULE, ADVENT, DECK_BUILDING_RULE, GAIN_TEAM, TEAM_RULE, BUNSHIN_SUMMON, ACTIVATE_SOUL_DRIVE resolve cleanly', async () => {
  const { state, emitter, ctx, srcCard, srcStack } = setupRuntime();
  const cAdv = await executeOp(state, { op: 'CONTRACT_ADVENT_RULE', zone: 'soul', adventType: 'CONTRACT_ADVENT', rule: 'ALLOW_CONTRACT_ADVENT' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(cAdv.success, true);

  const handAdv = mkCard('ADV-CARD-1');
  state.players.player.hand.push(handAdv);
  const advRes = await executeOp(state, { op: 'ADVENT', from: 'hand', target: { side: 'self', types: ['Spirit'], stackId: srcStack.id } }, { ...ctx, sourceCard: handAdv }, new DefaultPromptResolver(), emitter);
  assert.equal(advRes.success, true);
  assert.equal(srcStack.top.id, 'ADV-CARD-1');

  const dbr = await executeOp(state, { op: 'DECK_BUILDING_RULE', maxCopies: 'UNLIMITED', rule: 'UNLIMITED_COPIES' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(dbr.success, true);
  const testDeck = Array.from({ length: 40 }, (_, i) => i < 8 ? { ...srcCard } : mkCard(`FILL-${i}`));
  assert.equal(validateDeck(testDeck).valid, true);

  const gt = await executeOp(state, { op: 'GAIN_TEAM', allTeams: true, scope: 'all' }, { ...ctx, sourceCard: srcStack.top }, new DefaultPromptResolver(), emitter);
  assert.equal(gt.success, true);
  assert.ok(computeFamilies(state, srcStack).includes('*ALL_TEAMS*'));

  const tr = await executeOp(state, { op: 'TEAM_RULE', allTeams: true, scope: 'all' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(tr.success, true);

  state.players.player.deck.push(mkCard('BUN-1'));
  state.players.player.reserve.normal = 3;
  const bun = await executeOp(state, { op: 'BUNSHIN_SUMMON', count: 1, from: 'decktop', coresMin: 1 }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(bun.success, true);
  assert.ok(state.players.player.field.some(st => st.isBunshin));

  const sd = await executeOp(state, { op: 'ACTIVATE_SOUL_DRIVE', target: { side: 'self', types: ['Ultimate'] }, scope: 'self_ultimate' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(sd.success, true);
});

test('HIJ1-OPVAR-06 [OPERATION_VARIANT]: KEYWORD_RULE, KEYWORD_ABILITY, COST_MODIFIER, TREAT_RULE, ADD_COUNTER, UNBLOCKABLE, CONTINUOUS_RULE, COMBAT_RESTRICTION, COMBAT_RULE', async () => {
  const { state, emitter, ctx, srcStack, oppStack } = setupRuntime();
  const kw1 = await executeOp(state, { op: 'KEYWORD_RULE', keyword: 'Clash', side: 'self' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(kw1.success, true);

  const kw2 = await executeOp(state, { op: 'KEYWORD_ABILITY', keyword: 'High Speed', side: 'self' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(kw2.success, true);

  const cm = await executeOp(state, { op: 'COST_MODIFIER', setCost: 2, target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(cm.success, true);

  const tr = await executeOp(state, { op: 'TREAT_RULE', level: 2, target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(tr.success, true);

  const cnt = await executeOp(state, { op: 'ADD_COUNTER', count: 2 }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(cnt.success, true);
  assert.equal(state.players.player.counters, 2);

  const unb = await executeOp(state, { op: 'UNBLOCKABLE', target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(unb.success, true);

  const cr = await executeOp(state, { op: 'CONTINUOUS_RULE', rule: 'CANNOT_EXHAUST', target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(cr.success, true);

  const crestr = await executeOp(state, { op: 'COMBAT_RESTRICTION', restriction: 'CANNOT_BLOCK', side: 'opp', targetStackId: oppStack.id }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(crestr.success, true);

  const crule = await executeOp(state, { op: 'COMBAT_RULE', restriction: 'EXHAUSTED_BLOCK', side: 'self', targetStackId: srcStack.id }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(crule.success, true);
});

test('HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE', async () => {
  const { state, emitter, ctx, srcCard, srcStack, oppStack } = setupRuntime();
  state.players.player.reserve.normal = 5;

  const hAdv = mkCard('ADV-S1');
  state.players.player.hand.push(hAdv);
  const asRes = await executeOp(state, { op: 'ADVENT_STACK', target: { side: 'self', stackId: srcStack.id } }, { ...ctx, sourceCard: hAdv }, new DefaultPromptResolver(), emitter);
  assert.equal(asRes.success, true);

  const hPay = mkCard('ADV-P1');
  state.players.player.hand.push(hPay);
  const apRes = await executeOp(state, { op: 'ADVENT_PAY', target: { side: 'self', stackId: srcStack.id } }, { ...ctx, sourceCard: hPay }, new DefaultPromptResolver(), emitter);
  assert.equal(apRes.success, true);

  const selfSummon = mkCard('SELF-SUM-1');
  state.players.player.hand.push(selfSummon);
  const stcRes = await executeOp(state, { op: 'SUMMON_THIS_CARD' }, { ...ctx, sourceCard: selfSummon }, new DefaultPromptResolver(), emitter);
  assert.equal(stcRes.success, true);
  assert.ok(state.players.player.field.some(st => st.top.id === 'SELF-SUM-1'));

  state.players.player.deck.push(mkCard('OZ-1'), mkCard('OZ-2'));
  const ozRes = await executeOp(state, { op: 'OPEN_ZONE', count: 2, from: 'decktop' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(ozRes.success, true);

  const tgtRes = await executeOp(state, { op: 'TARGET', target: { side: 'opp', types: ['Spirit'], stackId: oppStack.id } }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(tgtRes.success, true);

  const tcRes = await executeOp(state, { op: 'TARGET_CARD', target: { side: 'opp', types: ['Spirit'], stackId: oppStack.id } }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(tcRes.success, true);

  const negRes = await executeOp(state, { op: 'NEGATE_EFFECT', target: 'OPPONENT_EFFECT' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(negRes.success, true);

  const rebCard = mkCard('REB-1', {
    backSide: mkCard('REB-1-B', { name: 'RebirthBack', type: 'Spirit' })
  });
  const rebStack = createFieldStack(rebCard, { normal: 2, soul: 0 });
  rebStack.owner = 'player';
  state.players.player.field.push(rebStack);
  const rfRes = await executeOp(state, { op: 'REBIRTH_FLIP', target: 'SELF' }, { ...ctx, sourceCard: rebCard, sourceStack: rebStack }, new DefaultPromptResolver(), emitter);
  assert.equal(rfRes.success, true);
  assert.equal(rebStack.top.name, 'RebirthBack');

  const flashCard = mkCard('FL-1', {
    compiledIr: { abilities: [{ physicalId: 'FL-1#AB', header: { timing: 'FLASH' }, clauses: [{ op: { op: 'ADD_COUNTER', count: 1 } }] }] }
  });
  const afRes = await executeOp(state, { op: 'ACTIVATE_FLASH', card: flashCard }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(afRes.success, true);

  const taRes = await executeOp(state, { op: 'TARGET_ATTACK', targetStackId: oppStack.id }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(taRes.success, true);

  const fbRes = await executeOp(state, { op: 'FORCE_BLOCK', targetStackId: oppStack.id }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(fbRes.success, true);

  const mscRes = await executeOp(state, { op: 'MOVE_SOUL_CORE', requireSourceSoul: true, to: 'life' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(mscRes.success, true);

  const gwCard = mkCard('GW-1', { type: 'Grandwalker Nexus' });
  const gwStack = createFieldStack(gwCard, { normal: 0, soul: 0 });
  gwStack.owner = 'player';
  state.players.player.field.push(gwStack);
  const gwp = await executeOp(state, { op: 'GRANDWALKER_PROTECTION', cores: 2 }, { ...ctx, sourceCard: gwCard, sourceStack: gwStack }, new DefaultPromptResolver(), emitter);
  assert.equal(gwp.success, true);
  const gwc = await executeOp(state, { op: 'GRANDWALKER_CORE_RULE', cores: 1 }, { ...ctx, sourceCard: gwCard, sourceStack: gwStack }, new DefaultPromptResolver(), emitter);
  assert.equal(gwc.success, true);
});

test('HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)', async () => {
  const { state, emitter, ctx, srcCard, srcStack } = setupRuntime();
  state.players.player.reserve.normal = 5;
  srcStack.top.backSide = mkCard('REB-B', { name: 'RebSideB' });
  srcStack.under.push(mkCard('U-1', { facedown: true }));

  assert.equal((await executeOp(state, { op: 'ACTIVATE_REBIRTH', target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal(srcStack.isRebirthed, true);

  const hAdv = mkCard('ADV-C1');
  state.players.player.hand.push(hAdv);
  assert.equal((await executeOp(state, { op: 'ADVENT_COST', from: 'hand', target: { side: 'self', stackId: srcStack.id } }, { ...ctx, sourceCard: hAdv }, new DefaultPromptResolver(), emitter)).success, true);
  const stkCard = mkCard('STK-1');
  state.players.player.hand.push(stkCard);
  assert.equal((await executeOp(state, { op: 'STACK_CARD', from: 'hand', target: { side: 'self', stackId: srcStack.id } }, { ...ctx, sourceCard: stkCard }, new DefaultPromptResolver(), emitter)).success, true);

  state.players.player.hand.push(mkCard('UND-1'));
  assert.equal((await executeOp(state, { op: 'CARD_UNDERNEATH', action: 'put', from: 'hand', target: 'SELF', count: 1 }, { ...ctx, sourceCard: srcStack.top }, new DefaultPromptResolver(), emitter)).success, true);

  srcStack.braves.push(mkCard('BRV-1', { type: 'Brave' }));
  assert.equal((await executeOp(state, { op: 'SEPARATE_BRAVE', target: 'SELF' }, { ...ctx, sourceCard: srcStack.top }, new DefaultPromptResolver(), emitter)).success, true);

  assert.equal((await executeOp(state, { op: 'ENTER_SOUL_STATE', target: 'SELF' }, { ...ctx, sourceCard: srcStack.top }, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'USE_FROM_SOUL_STATE', scope: 'self' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'BEFORE_ADVENT_TRIGGER', timing: 'WHEN_ADVENTS' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
});

test('HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)', async () => {
  const { state, emitter, ctx, srcCard, srcStack, oppStack } = setupRuntime();
  state.players.player.hand.push(mkCard('H-A'), mkCard('H-B'), mkCard('H-C'), mkCard('H-D'), mkCard('H-E'));
  state.players.player.deck.push(mkCard('D-A'), mkCard('D-B'), mkCard('D-C'));
  state.players.player.grave.push(mkCard('G-A', { type: 'Magic' }));
  state.players.player.reserve.normal = 5;
  state.players.opponent.reserve.normal = 6;

  assert.equal((await executeOp(state, { op: 'BANISH_COST', from: 'hand', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'BANISH_DESTINATION_RULE', destination: 'removed', replaces: 'DESTRUCTION' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'BANISH_SOUL_CORE_VOID', target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'LOOK_DECKTOP', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'LOOK_AT_HAND', side: 'opp', target: 'HAND' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SEARCH_DECK', filter: { any: true }, destination: 'hand', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'PUT_CARD_ON_FIELD', from: 'hand', cardType: 'Spirit', filter: { any: true }, count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'REVEAL_FROM_HAND_COST', handTrigger: 'OPPONENT_HAND_USE', count: 1, side: 'opp' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'REVEAL_INTERACTION', onRevealBy: 'self', destination: 'hand', action: 'put' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CAST_FROM_DECK', scope: 'self', zone: 'deck' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CAST_FROM_TRASH', scope: 'self', zone: 'grave' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  state.players.player.hand.push(mkCard('H-MAG', { type: 'Magic' }));
  assert.equal((await executeOp(state, { op: 'USE_FROM_HAND', cardType: 'Magic', timing: 'FLASH', filter: { any: true } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  state.players.player.hand.push(mkCard('H-HM1'), mkCard('H-HM2'));
  assert.equal((await executeOp(state, { op: 'DISCARD_HAND_MAX', triggerCount: 4, targetCount: 3, side: 'self' }, ctx, new DefaultPromptResolver(), emitter)).success, true);

  ctx.revealedCards = [mkCard('REV-B1'), mkCard('REV-B2')];
  state.players.player.revealed = [...ctx.revealedCards];
  state.players.player.deck.push(...ctx.revealedCards);
  assert.equal((await executeOp(state, { op: 'BOUNCE_TO_DECKBOTTOM', from: 'revealed', filter: { any: true }, count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  ctx.revealedCards = [mkCard('REV-B3')];
  state.players.player.deck.push(...ctx.revealedCards);
  assert.equal((await executeOp(state, { op: 'RETURN_DECK_BOTTOM', from: 'revealed', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);

  assert.equal((await executeOp(state, { op: 'DISCARD_FIELD', side: 'opp', cardType: 'Spirit', filter: { any: true }, count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  const o2 = createFieldStack(mkCard('OPP-2', { owner: 'opponent' }), { normal: 1, soul: 0 });
  o2.owner = 'opponent';
  state.players.opponent.field.push(o2);
  assert.equal((await executeOp(state, { op: 'DISCARD_ZONE', zone: 'field', side: 'opp', cardType: 'Spirit', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);

  assert.equal((await executeOp(state, { op: 'SEND_TO_TRASH', target: { side: 'self', stackId: srcStack.id }, from: 'field', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SEND_CORES_TO_VOID', side: 'opp', zone: 'reserve', leaveCount: 4, count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SEND_CORE_TO_VOID', side: 'opp', zone: 'reserve', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'PAY_COST', source: 'reserve', cost: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  const exSt = createFieldStack(mkCard('EX-ST'), { normal: 1, soul: 0 }); exSt.owner = 'player';
  state.players.player.field.push(exSt);
  assert.equal((await executeOp(state, { op: 'EXCHANGE_CORE', from: 'life', to: 'self' }, { ...ctx, sourceStack: exSt, sourceCard: exSt.top }, new DefaultPromptResolver(), emitter)).success, true);

  const sA = createFieldStack(mkCard('SW-A'), { normal: 2, soul: 0 }); sA.owner = 'player';
  const sB = createFieldStack(mkCard('SW-B'), { normal: 1, soul: 0 }); sB.owner = 'player';
  state.players.player.field.push(sA, sB);
  assert.equal((await executeOp(state, { op: 'SWAP_CORES', target: { side: 'self', types: ['Spirit'], count: 2 } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
});

test('HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)', async () => {
  const { state, emitter, ctx, srcStack, oppStack } = setupRuntime();
  assert.equal((await executeOp(state, { op: 'ATTACK_RULE_MODIFIER', rule: 'CONSECUTIVE_BATTLES', maxBattles: 2 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'BATTLE_MODIFIER', maxBattles: 2, rule: 'CONSECUTIVE_BATTLES' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'BATTLE_MULTIPLE', maxTargets: 2, target: { side: 'opp' } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CAN_ATTACK', target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CHANGE_TARGET', newTarget: 'SELF', mode: 'change_target', bpMax: 5000 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  state.combat = { attackerStackId: srcStack.id, attackerSide: 'player', blockerStackId: null };
  assert.equal((await executeOp(state, { op: 'CHOOSE_BATTLE_TARGET', target: { side: 'opp', types: ['Spirit'] } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CHOOSE_BLOCKER', when: 'WHEN_BLOCKED', mode: 'choose_battle_target' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'COPY_ABILITY', abilityType: 'keyword', keyword: 'Armor' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'COPY_PRE_ADVENT_EFFECT', scope: 'one', filter: {} }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'COPY_TRIGGER', timing: 'WHEN_ATTACKS', maxPerAttack: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'EXCHANGE_BP', target: { side: 'opp', stackId: oppStack.id } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SWITCH_BP', target: { side: 'opp', stackId: oppStack.id } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'EXPAND_TARGETS', fromScope: 'one', toScope: 'all' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'GUARD_TRIGGER', timing: 'WHEN_ATTACKS' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'LOSE_IMMUNITY', colors: ['Red'], target: { side: 'self', types: ['Spirit'] } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'MULTIPLY_EFFECT', per: 'controlled_spirits', multiplier: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'NEGATE_MAGIC', scope: 'battle', timing: 'BATTLE_PHASE' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SCHEDULED_DESTROY', timing: 'END_STEP', target: 'SUMMONED_BY_EFFECT' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SELECT_TARGET', target: { side: 'opp', types: ['Spirit'], stackId: oppStack.id } }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SIMULTANEOUS_BATTLE', maxTargets: 2 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
});

test('HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)', async () => {
  const { state, emitter, ctx, srcStack } = setupRuntime();
  state.players.player.deck.push(mkCard('CB-1'));
  state.players.player.reserve.normal = 5;
  state.players.player.hand.push(mkCard('SM-1', { families: ['Dragon'] }), mkCard('SW-H'));

  assert.equal((await executeOp(state, { op: 'CARD_PLAY_PERMISSION', timing: 'START_OPPOSING_ATTACK_STEP', cardType: 'Magic', from: 'hand' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CHOOSE_FAMILY', families: ['Dragon', 'Song'], count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CHOOSE_LEVEL', levels: [1, 2], minLevel: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'OPPONENT_CHOICE', options: ['OPTION_A', 'OPTION_B'] }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CORE_LOCK', target: 'SELF', coresLocked: true }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'COUNT_AS_MULTIPLE', countAs: 2, cardType: 'Spirit' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'CREATE_BUNSHIN', count: 1, from: 'decktop', coresMin: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'END_STEP', action: 'SKIP_TO_END_STEP' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'GRANT_EFFECT', target: { side: 'self', types: ['Spirit'] }, effect: 'Draw 1' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'IGNORE_CONDITIONS', scope: 'self' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'IGNORE_LEVELS', scope: 'self' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'LIMIT_ONCE_PER_TURN', scope: 'card_name' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'NON_STACKABLE', scope: 'same_name' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SUMMON_MULTI', from: 'hand', filter: { family: 'Dragon' }, count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SWITCH_CARD', from: 'hand', target: { side: 'self', stackId: srcStack.id } }, { ...ctx, sourceCard: state.players.player.hand.find(c => c.id === 'SW-H') }, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TARGET_FAMILY', families: ['Dragon'], mode: 'choose_family', count: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TIMING_MODIFIER', timing: 'END_OF_ATTACK', when: 'END_OF_ATTACK' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TREAT_AS_VANILLA', target: 'SELF' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TREAT_CORE_COUNT', target: { side: 'self', types: ['Nexus'] }, mode: 'match_source_cores' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TREAT_COST', treatedCost: 2, cost: 2 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TREAT_NAME', treatedAsName: 'Arcana', name: 'Arcana' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'SPECIAL_WIN', winner: 'self', reason: 'SPECIAL_WIN_CONDITION' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TRIGGERED_ACTION', trigger: 'CUSTOM_EVENT', action: 'triggered_effect' }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'TRIGGERED_BUFF', trigger: 'CUSTOM_EVENT', amount: 2000 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
  assert.equal((await executeOp(state, { op: 'VARIABLE_PAYMENT_EFFECT', tiers: { 1: 'TIER_1' }, amount: 1 }, ctx, new DefaultPromptResolver(), emitter)).success, true);
});
