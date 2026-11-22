import test from 'node:test';
import assert from 'node:assert/strict';

import { createGameState, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { computeLevel } from '../engine/continuous.js';
import { moveCore } from '../engine/zones.js';
import { EventBus } from '../engine/events.js';
import { classifyOperation, classifyCondition } from '../scripts/audit_514_cards_exhaustive.mjs';

function makeSpirit(id, overrides = {}) {
  return {
    id,
    cardNumber: overrides.cardNumber || id.toUpperCase(),
    name: overrides.name || id,
    type: overrides.type || 'Spirit',
    color: overrides.color || 'Red',
    cost: overrides.cost ?? 3,
    bp: overrides.bp ?? 4000,
    levelThreshold: overrides.levelThreshold || { 1: 1, 2: 3, 3: 5 },
    levelBp: overrides.levelBp || { 1: 4000, 2: 6000, 3: 9000 },
    levels: overrides.levels || {
      1: { cost: 1, bp: 4000 },
      2: { cost: 3, bp: 6000 },
      3: { cost: 5, bp: 9000 }
    },
    owner: overrides.owner || 'player',
    controller: overrides.controller || overrides.owner || 'player',
    ...overrides
  };
}

class AutoChooseFirst {
  async choose(prompt) {
    if (prompt.candidates && prompt.candidates.length > 0) {
      return [prompt.candidates[0]];
    }
    return { index: 0 };
  }
}

test('C1-REG-01: SET_LEVEL creates SET_LEVEL modifier and computeLevel reflects effective level', async () => {
  const state = createGameState();
  const spirit = makeSpirit('c1_set_lv_1');
  const stack = createFieldStack(spirit, { normal: 1 });
  state.players.player.field.push(stack);

  assert.equal(computeLevel(stack, state), 1);

  const res = await executeOp(
    state,
    { op: 'SET_LEVEL', targetStackId: stack.id, value: 3 },
    { controller: 'player', sourceCard: spirit, sourceStack: stack },
    new AutoChooseFirst()
  );

  assert.equal(res.success, true);
  assert.equal(res.modifier.type, 'SET_LEVEL');
  assert.equal(computeLevel(stack, state), 3);
});

test('C1-REG-02: COMPARE_LEVELS destroys opposing Spirit with strictly lower effective level', async () => {
  const state = createGameState();
  const events = new EventBus();
  const mySpirit = makeSpirit('my_lv_spirit');
  const myStack = createFieldStack(mySpirit, { normal: 3 }); // Lv2
  const oppWeak = makeSpirit('opp_lv1_spirit', { owner: 'opponent', controller: 'opponent' });
  const oppWeakStack = createFieldStack(oppWeak, { normal: 1 }); // Lv1

  state.players.player.field.push(myStack);
  state.players.opponent.field.push(oppWeakStack);

  const res = await executeOp(
    state,
    { op: 'COMPARE_LEVELS', target: { side: 'opp', types: ['Spirit'] } },
    { controller: 'player', sourceCard: mySpirit, sourceStack: myStack },
    new AutoChooseFirst(),
    events
  );

  assert.equal(res.success, true);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.some(c => c.id === oppWeak.id), true);
});

test('C1-REG-03: SUMMON rejects invalid initialCores (0, negative, non-integer) before mutating card id', async () => {
  for (const badCores of [0, -1, 1.5]) {
    const state = createGameState();
    state.players.player.reserve.normal = 5;
    const card = makeSpirit('unmutated_card', { cost: 0 });
    delete card.id;
    card.cardNumber = 'BS99-001';
    state.players.player.hand.push(card);

    const res = await executeOp(
      state,
      { op: 'SUMMON', initialCores: badCores, from: 'HAND' },
      { controller: 'player', sourceCard: card },
      new AutoChooseFirst()
    );

    assert.equal(res.success, false);
    assert.equal(res.status, 'REJECTED');
    assert.equal(card.id, undefined, `card.id must not be mutated on rejected initialCores=${badCores}`);
    assert.equal(state.players.player.field.length, 0);
    assert.equal(state.players.player.hand.length, 1);
  }
});

test('C1-REG-04: SUMMON_FREE rejects CARD_ALREADY_ON_FIELD, DUPLICATE_CARD_OCCURRENCE, and INVALID_SOURCE_ZONE (from BURST)', async () => {
  // CARD_ALREADY_ON_FIELD
  {
    const state = createGameState();
    state.players.player.reserve.normal = 2;
    const card = makeSpirit('field_dup');
    state.players.player.field.push(createFieldStack(card, { normal: 1 }));
    const res = await executeOp(
      state,
      { op: 'SUMMON_FREE', target: 'this_card', initialCores: 1 },
      { controller: 'player', sourceCard: card },
      new AutoChooseFirst()
    );
    assert.equal(res.success, false);
    assert.equal(res.reason, 'CARD_ALREADY_ON_FIELD');
  }

  // DUPLICATE_CARD_OCCURRENCE (card in both hand and grave)
  {
    const state = createGameState();
    state.players.player.reserve.normal = 2;
    const card = makeSpirit('zone_dup');
    state.players.player.hand.push(card);
    state.players.player.grave.push(card);
    const res = await executeOp(
      state,
      { op: 'SUMMON_FREE', target: 'this_card', initialCores: 1 },
      { controller: 'player', sourceCard: card },
      new AutoChooseFirst()
    );
    assert.equal(res.success, false);
    assert.equal(res.reason, 'DUPLICATE_CARD_OCCURRENCE');
  }

  // INVALID_SOURCE_ZONE (from BURST when card is not in burst)
  {
    const state = createGameState();
    state.players.player.reserve.normal = 2;
    const card = makeSpirit('not_in_burst');
    state.players.player.hand.push(card);
    const res = await executeOp(
      state,
      { op: 'SUMMON_FREE', from: 'BURST', initialCores: 1 },
      { controller: 'player', sourceCard: card },
      new AutoChooseFirst()
    );
    assert.equal(res.success, false);
    assert.equal(res.reason, 'INVALID_SOURCE_ZONE');
  }
});

test('C1-REG-05: SUMMON rollback atomicity restores card to hand and preserves core total on CORE_PLACEMENT_FAILED', async () => {
  const state = createGameState();
  state.players.player.reserve.normal = 1; // Enough for cost 0, NOT enough for initialCores: 3
  const card = makeSpirit('rollback_card', { cost: 0 });
  state.players.player.hand.push(card);

  const res = await executeOp(
    state,
    { op: 'SUMMON', from: 'HAND', initialCores: 3 },
    { controller: 'player', sourceCard: card },
    new AutoChooseFirst()
  );

  assert.equal(res.success, false);
  assert.equal(['INSUFFICIENT_LV1_CORES', 'CORE_PLACEMENT_FAILED'].includes(res.reason), true);
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.hand.some(c => c.id === card.id), true);
  assert.equal(state.players.player.reserve.normal, 1);
});

test('C1-REG-06: REPLACEMENT_EFFECT registers explicit replacement spec, rejects missing spec, and conserves cores on LIFE_CORE redirect', async () => {
  const state = createGameState();
  state.players.opponent.life = 5;

  const missingRes = await executeOp(
    state,
    { op: 'REPLACEMENT_EFFECT' },
    { controller: 'player' },
    new AutoChooseFirst()
  );
  assert.equal(missingRes.success, false);
  assert.equal(missingRes.status, 'UNSUPPORTED');
  assert.equal(missingRes.reason, 'MISSING_REPLACEMENT_SPEC');

  const validRes = await executeOp(
    state,
    { op: 'REPLACEMENT_EFFECT', replaces: 'LIFE_CORE', replacementZone: 'void', side: 'opponent', duration: 'THIS_TURN' },
    { controller: 'player' },
    new AutoChooseFirst()
  );
  assert.equal(validRes.success, true);

  const lifeBefore = state.players.opponent.life;
  const reserveBefore = state.players.opponent.reserve.normal;
  const voidBefore = state.players.opponent.voidCores.normal;

  const moveRes = await moveCore(
    state,
    1,
    { side: 'opponent', zone: 'life' },
    { side: 'opponent', zone: 'reserve' },
    { cause: 'DAMAGE' }
  );
  assert.equal(moveRes, true);
  assert.equal(state.players.opponent.life, lifeBefore - 1);
  assert.equal(state.players.opponent.reserve.normal, reserveBefore, 'Life core redirected away from reserve');
  assert.equal(state.players.opponent.voidCores.normal, voidBefore + 1, 'Life core conserved in void');
});

test('C1-AUD-01: Auditor never marks missing, unverified, or incomplete operations as SEMANTICALLY_VERIFIED', () => {
  const missing = classifyOperation({ op: 'TOTALLY_UNKNOWN_OP_XYZ' });
  assert.equal(missing.status, 'HANDLER_MISSING');
  assert.notEqual(missing.status, 'SEMANTICALLY_VERIFIED');

  const incomplete = classifyOperation({ op: 'REPLACEMENT_EFFECT' });
  assert.equal(incomplete.status, 'PARAMETERS_INCOMPLETE');
  assert.notEqual(incomplete.status, 'SEMANTICALLY_VERIFIED');

  const unverified = classifyOperation({ op: 'MODIFY_LIFE', amount: -1 });
  assert.equal(unverified.status, 'HANDLER_PRESENT_UNVERIFIED');
  assert.notEqual(unverified.status, 'SEMANTICALLY_VERIFIED');

  const verified = classifyOperation({ op: 'DRAW', count: 1 });
  assert.equal(verified.status, 'SEMANTICALLY_VERIFIED');
});

test('C1-AUD-02: Auditor never marks parsed conditions without evaluator support as SEMANTICALLY_VERIFIED', () => {
  const unparseable = classifyCondition('totally unparseable condition text xyz');
  assert.equal(unparseable.status, 'PARSE_FAILURE');
  assert.notEqual(unparseable.status, 'SEMANTICALLY_VERIFIED');

  const verifiedCond = classifyCondition('your life is 3 or less');
  assert.equal(verifiedCond.status, 'SEMANTICALLY_VERIFIED');
});
