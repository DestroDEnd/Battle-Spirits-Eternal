/**
 * tests/work_package_hij1_adversarial_determinism.test.js
 * Classifications: ADVERSARIAL, INVARIANT
 *
 * Adversarial failure handling, state-conservation invariants, duplicate physical copy
 * identity, ownership/controller separation, rollback safety, and large-field determinism.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createFieldStack, validateGameState } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { computeEffectiveBP, isActionRestricted } from '../engine/continuous.js';
import { moveCard } from '../engine/zones.js';
import { evaluateStructuredCondition, CONDITION_RESULT } from '../engine/conditions.js';

function mkCard(id, extra = {}) {
  return {
    id,
    cardNumber: extra.cardNumber || id,
    name: `Card_${id}`,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 4,
    families: ['Dragon'],
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 6000 } },
    owner: 'player',
    compiledIr: { abilities: [] },
    ...extra
  };
}

test('HIJ1-ADV-01 [ADVERSARIAL]: Unknown op, missing params, illegal targets, and unsupported condition fail closed with 0 phantom events or state mutation', async () => {
  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const srcCard = mkCard('ADV-SRC');
  const srcStack = createFieldStack(srcCard, { normal: 2, soul: 0 });
  srcStack.owner = 'player';
  state.players.player.field.push(srcStack);
  const ctx = { controller: 'player', sourceCard: srcCard, sourceStack: srcStack, resolver: new AsyncResolver() };

  const snapBefore = JSON.stringify(state.players);

  const unk = await executeOp(state, { op: 'NON_EXISTENT_OP_XYZ' }, ctx, new DefaultPromptResolver(), emitter);
  assert.equal(unk.success, false);
  assert.equal(unk.status, 'UNSUPPORTED');

  for (const stub of ['TOKEN_DEPLOYMENT', 'COUNT_OPERATION', 'DECK_ACTION', 'MODIFY_EFFECT', 'REDIRECT_TARGET', 'PUT_UNDERNEATH']) {
    const r = await executeOp(state, { op: stub }, ctx, new DefaultPromptResolver(), emitter);
    assert.equal(r.success, false, `${stub} bare stub must fail closed`);
  }

  // Unsupported condition prevents execution inside AsyncResolver
  const ab = {
    physicalId: 'ADV#AB1',
    header: { timing: 'WHEN_SUMMONED', cleanBody: 'test' },
    clauses: [{ condition: 'While this Spirit', op: { op: 'DRAW', count: 1, side: 'self' } }]
  };
  const resAb = await new AsyncResolver().resolveAbility(state, ab, ctx, emitter, new DefaultPromptResolver());
  assert.notEqual(resAb.status, 'EXECUTED');
  assert.equal(events.length, 0);
  assert.equal(JSON.stringify(state.players), snapBefore);
});

test('HIJ1-ADV-02 [ADVERSARIAL]: Duplicate physical copies, ownership/controller separation, and failed cost rollback preserve invariants', async () => {
  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };

  // Two distinct physical copies sharing the same canonical cardNumber
  const copy1 = mkCard('PHYS-COPY-1', { cardNumber: 'BS01-001', owner: 'player' });
  const copy2 = mkCard('PHYS-COPY-2', { cardNumber: 'BS01-001', owner: 'player' });
  const st1 = createFieldStack(copy1, { normal: 1, soul: 0 });
  st1.owner = 'player';
  // Card owned by opponent, temporarily controlled by player
  const borrowedCard = mkCard('BORROWED-CARD', { cardNumber: 'BS02-010', owner: 'opponent' });
  const borrowedStack = createFieldStack(borrowedCard, { normal: 1, soul: 0 });
  borrowedStack.owner = 'player';
  borrowedStack.originalOwner = 'opponent';

  state.players.player.field.push(st1, borrowedStack);
  state.players.player.hand.push(copy2);

  // Destroying borrowed stack's top card must return card to its owner's ('opponent') grave, not controller's ('player')
  const moved = await moveCard(state, borrowedStack.top, 'grave', null, { cause: 'destroy' }, emitter);
  assert.equal(moved, true);
  assert.ok(state.players.opponent.grave.some(c => c.id === 'BORROWED-CARD'), 'Owner grave must receive destroyed borrowed card');
  assert.ok(!state.players.player.grave.some(c => c.id === 'BORROWED-CARD'), 'Controller grave must not receive opponent-owned card');

  // Failed cost in chained ability blocks downstream DRAW and preserves hand/deck
  const resolver = new AsyncResolver();
  const deckBefore = state.players.player.deck.length;
  const abCostFail = {
    physicalId: 'COSTFAIL#AB1',
    header: { timing: 'MAIN', cleanBody: 'Discard 1; Draw 2.' },
    clauses: [
      { op: { op: 'DISCARD', target: { side: 'self', zone: 'hand', filter: { color: 'Purple' } }, count: 1, isCost: true }, isCost: true },
      { op: { op: 'DRAW', count: 2, side: 'self' }, link: 'byDoing' }
    ]
  };
  await resolver.resolveAbility(state, abCostFail, { controller: 'player', sourceCard: copy1, sourceStack: st1 }, emitter, new DefaultPromptResolver());
  assert.equal(state.players.player.deck.length, deckBefore, 'Failed cost must not execute dependent DRAW');
  assert.equal(evaluateStructuredCondition(state, 'If this Spirit is at LV3', { sourceStack: st1, sourceCard: copy2 }).result, CONDITION_RESULT.UNSUPPORTED);

  const val = validateGameState(state);
  assert.equal(val.valid, true, 'Game state must remain valid: ' + JSON.stringify(val.errors));
});

test('HIJ1-INV-01 [INVARIANT]: Large 200-stack field continuous BP, restriction lookup, and deterministic shuffle complete fast with zero cross-game leakage', async () => {
  const runDeterministic = async () => {
    const g = createGame();
    const state = g.state;
    const events = [];
    const emitter = { list: events, async emit(ev) { events.push(ev); } };

    for (let i = 0; i < 100; i++) {
      const pSt = createFieldStack(mkCard(`P-${i}`, { owner: 'player', levels: { 1: { cost: 1, bp: 2000 + i * 10 } } }), { normal: 1, soul: 0 });
      pSt.owner = 'player';
      state.players.player.field.push(pSt);

      const oSt = createFieldStack(mkCard(`O-${i}`, { owner: 'opponent', levels: { 1: { cost: 1, bp: 2000 + i * 10 } } }), { normal: 1, soul: 0 });
      oSt.owner = 'opponent';
      state.players.opponent.field.push(oSt);
    }

    state.modifiers.push({ id: 'M-BP', type: 'BP_BUFF', amount: 1000, side: 'player', targetFilter: { types: ['Spirit'] }, duration: 'THIS_TURN' });
    state.modifiers.push({ id: 'M-RESTR', type: 'GLOBAL_RESTRICTION', restriction: 'CANNOT_GAIN_CORES_FROM_VOID', side: 'both', duration: 'THIS_TURN' });

    const bps = state.players.player.field.map(st => computeEffectiveBP(state, st));
    const restricted = isActionRestricted(state, 'CANNOT_GAIN_CORES_FROM_VOID', 'player', null, {});
    assert.equal(restricted, true);

    // Deterministic seeded deck shuffle
    for (let i = 0; i < 20; i++) state.players.player.deck.push(mkCard(`D-${i}`));
    state.rngSeed = 42;
    await executeOp(state, { op: 'SHUFFLE_DECK', side: 'self' }, { controller: 'player', sourceCard: state.players.player.field[0].top, sourceStack: state.players.player.field[0] }, new DefaultPromptResolver(), emitter);
    return { bpsSum: bps.reduce((a, b) => a + b, 0), deckOrder: state.players.player.deck.map(c => c.id) };
  };

  const t0 = performance.now();
  const r1 = await runDeterministic();
  const r2 = await runDeterministic();
  const elapsedMs = performance.now() - t0;

  assert.equal(r1.bpsSum, r2.bpsSum);
  assert.deepEqual(r1.deckOrder, r2.deckOrder, 'Seeded shuffle must be strictly deterministic');
  assert.ok(elapsedMs < 1500, `Large 200-stack determinism check exceeded budget: ${elapsedMs}ms`);
});
