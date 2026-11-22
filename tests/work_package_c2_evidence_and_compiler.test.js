import test from 'node:test';
import assert from 'node:assert/strict';

import { compileCard } from '../compiler/index.js';
import { createGameState, createFieldStack, getTotalPlayerCores } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { moveCore } from '../engine/zones.js';
import { EventBus } from '../engine/events.js';
import {
  buildVerifiedOperationRegistry,
  buildVerifiedConditionRegistry,
  classifyOperation,
  classifyCondition
} from '../scripts/audit_514_cards_exhaustive.mjs';

function makeCard(id, overrides = {}) {
  return {
    id,
    cardNumber: overrides.cardNumber || id.toUpperCase(),
    name: overrides.name || id,
    type: overrides.type || 'Spirit',
    color: overrides.color || 'Red',
    cost: overrides.cost ?? 2,
    bp: overrides.bp ?? 4000,
    levels: overrides.levels || { 1: { cost: 1, bp: 4000 }, 2: { cost: 3, bp: 6000 } },
    owner: overrides.owner || 'player',
    controller: overrides.controller || overrides.owner || 'player',
    ...overrides
  };
}

class AutoChooseFirst {
  async choose(prompt) {
    if (prompt.candidates && prompt.candidates.length > 0) return [prompt.candidates[0]];
    return { index: 0 };
  }
}

// ============================================================================
// 1. REVEAL_CARDS (Compiler-sourced & Structured Contract)
// ============================================================================

test('WPC2-REV-01: BS69-036 (Medis) compiles structured REVEAL_CARDS and reveals exact 3 decktop cards', async () => {
  const compiled = compileCard({
    cardNumber: 'BS69-036',
    name: 'Medis',
    type: 'Spirit',
    effect: '(When Summoned) Look at the top three cards of your deck, and return them to the decktop or deckbottom one by one.'
  });
  const revealOp = compiled.abilities[0].clauses[0].op;
  assert.equal(revealOp.op, 'REVEAL_CARDS');
  assert.equal(revealOp.count, 3);
  assert.equal(revealOp.from, 'DECK');
  assert.equal(revealOp.side, 'self');

  const state = createGameState();
  const events = new EventBus();
  const revealedEvents = [];
  events.on('CARDS_REVEALED', ev => revealedEvents.push(ev));

  for (let i = 1; i <= 5; i++) state.players.player.deck.push(makeCard(`medis_d_${i}`));

  const res = await executeOp(state, revealOp, { controller: 'player', sourceCard: compiled }, new AutoChooseFirst(), events);
  assert.equal(res.success, true);
  assert.equal(res.count, 3);
  assert.equal(state.players.player.deck.length, 2);
  assert.equal(state.players.player.revealed.length, 3);
  assert.equal(revealedEvents.length, 1);
  assert.equal(revealedEvents[0].count, 3);
});

test('WPC2-REV-02: BS64-X04 (Gefan-Gnis) compiles structured REVEAL_CARDS for both players', async () => {
  const compiled = compileCard({
    cardNumber: 'BS64-X04',
    name: 'Gefan-Gnis',
    type: 'Spirit',
    effect: "(When Advents) You can reveal three cards from each player's decktop."
  });
  const revealOp = compiled.abilities[0].clauses[0].op;
  assert.equal(revealOp.op, 'REVEAL_CARDS');
  assert.equal(revealOp.count, 3);
  assert.equal(revealOp.from, 'DECK');
  assert.equal(revealOp.side, 'both');
  assert.equal(revealOp.isOptional, true);

  const state = createGameState();
  for (let i = 1; i <= 4; i++) {
    state.players.player.deck.push(makeCard(`p_${i}`));
    state.players.opponent.deck.push(makeCard(`o_${i}`));
  }

  const res = await executeOp(state, revealOp, { controller: 'player', sourceCard: compiled }, new AutoChooseFirst());
  assert.equal(res.success, true);
  assert.equal(state.players.player.deck.length, 1);
  assert.equal(state.players.opponent.deck.length, 1);
  assert.equal(state.players.player.revealed.length, 3);
  assert.equal(state.players.opponent.revealed.length, 3);
});

test('WPC2-REV-03: Structured REVEAL_CARDS handles undersized/empty deck and bare stub fails closed', async () => {
  const state = createGameState();
  state.players.player.deck.push(makeCard('u1'), makeCard('u2'));

  const resUnder = await executeOp(
    state,
    { op: 'REVEAL_CARDS', count: 3, from: 'DECK', side: 'self' },
    { controller: 'player' },
    new AutoChooseFirst()
  );
  assert.equal(resUnder.success, true);
  assert.equal(resUnder.count, 2);
  assert.equal(state.players.player.deck.length, 0);
  assert.equal(state.players.player.revealed.length, 2);

  const resEmpty = await executeOp(
    state,
    { op: 'REVEAL_CARDS', count: 3, from: 'DECK', side: 'self' },
    { controller: 'player' },
    new AutoChooseFirst()
  );
  assert.equal(resEmpty.success, false);
  assert.equal(resEmpty.count, 0);

  const bareStubRes = await executeOp(state, { op: 'REVEAL_CARDS' }, { controller: 'player' }, new AutoChooseFirst());
  assert.equal(bareStubRes.success, false);
  assert.equal(bareStubRes.status, 'UNSUPPORTED');
});

test('WPC2-REV-04: Structured REVEAL_CARDS from HAND preserves hand membership and populates context', async () => {
  const state = createGameState();
  state.players.player.hand.push(makeCard('h1'), makeCard('h2'), makeCard('h3'));
  const ctx = { controller: 'player' };

  const res = await executeOp(
    state,
    { op: 'REVEAL_CARDS', count: 3, from: 'HAND', side: 'self' },
    ctx,
    new AutoChooseFirst()
  );
  assert.equal(res.success, true);
  assert.equal(res.count, 3);
  assert.equal(state.players.player.hand.length, 3);
  assert.equal(ctx.revealedCards.length, 3);
});

// ============================================================================
// 2. REPLACEMENT_EFFECT (Compiler-sourced & Void-Conservation Contract)
// ============================================================================

test('WPC2-REP-01: BS42-052 compiles CORE_ADDITION->life replacement, redirects with Void core conservation & LIFE_RECOVERED', async () => {
  const compiled = compileCard({
    cardNumber: 'BS42-052',
    name: 'Yamane',
    type: 'Spirit',
    effect: '(Main Step) When the opponent would increase cores from the Void by effects, put those cores to your Life instead.'
  });
  const repOp = compiled.abilities[0].clauses[0].op;
  assert.equal(repOp.op, 'REPLACEMENT_EFFECT');
  assert.equal(repOp.replaces, 'CORE_ADDITION');
  assert.equal(repOp.replacementZone, 'life');
  assert.equal(repOp.side, 'self');

  const state = createGameState();
  state.players.player.life = 3;
  state.players.player.voidCores.normal = 1;
  state.players.opponent.reserve.normal = 1;

  const events = new EventBus();
  const lifeEvents = [];
  events.on('LIFE_RECOVERED', ev => lifeEvents.push(ev));

  const reg = await executeOp(state, repOp, { controller: 'player', sourceCard: compiled }, new AutoChooseFirst(), events);
  assert.equal(reg.success, true);

  const totalBefore = getTotalPlayerCores(state, 'player').total + getTotalPlayerCores(state, 'opponent').total;
  const moved = await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);
  assert.equal(moved, true);
  assert.equal(state.players.player.life, 4);
  assert.equal(state.players.opponent.reserve.normal, 1);
  assert.equal(getTotalPlayerCores(state, 'player').total + getTotalPlayerCores(state, 'opponent').total, totalBefore);
  assert.equal(lifeEvents.length, 1);
  assert.equal(lifeEvents[0].player, 'player');
  assert.equal(lifeEvents[0].currentLife, 4);
});

test('WPC2-REP-02: BS24-013 compiles CORE_ADDITION->field replacement and validates targetStackId', async () => {
  const compiled = compileCard({
    cardNumber: 'BS24-013',
    name: 'ThirdEyes-Snake',
    type: 'Spirit',
    effect: '[LV1][LV2] When the opponent would increase cores from the Void via an effect, change where those cores are put to this Spirit instead.'
  });
  const repOp = compiled.abilities[0].clauses[0].op;
  assert.equal(repOp.op, 'REPLACEMENT_EFFECT');
  assert.equal(repOp.replaces, 'CORE_ADDITION');
  assert.equal(repOp.replacementZone, 'field');
  assert.equal(repOp.target, 'SELF');

  const state = createGameState();
  const selfCard = makeCard('snake_1');
  const selfStack = createFieldStack(selfCard, { normal: 1 });
  state.players.player.field.push(selfStack);
  state.players.player.voidCores.normal = 1;
  state.players.opponent.reserve.normal = 1;

  const events = new EventBus();
  const repEvents = [];
  events.on('REPLACEMENT_EFFECT_APPLIED', ev => repEvents.push(ev));

  const reg = await executeOp(state, repOp, { controller: 'player', sourceCard: selfCard, sourceStack: selfStack }, new AutoChooseFirst(), events);
  assert.equal(reg.success, true);

  const moved = await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);
  assert.equal(moved, true);
  assert.equal(selfStack.cores.normal, 2);
  assert.equal(state.players.opponent.reserve.normal, 1);
  assert.equal(repEvents.length, 1);
  assert.equal(repEvents[0].targetStackId, selfStack.id);
});

test('WPC2-REP-03: BS20-X01 compiles DESTROYED_SPIRIT_CORES->field replacement spec deterministically', () => {
  const cardDef = {
    cardNumber: 'BS20-X01',
    name: 'TheEnd-Dragonis',
    type: 'Spirit',
    effect: '[LV1][LV2][LV3][LV4] Cores on your destroyed Spirits are sent to this Spirit, instead of your Reserve.'
  };
  const c1 = compileCard(cardDef);
  const c2 = compileCard(cardDef);
  const op1 = c1.abilities[0].clauses[0].op;
  assert.equal(op1.op, 'REPLACEMENT_EFFECT');
  assert.equal(op1.replaces, 'DESTROYED_SPIRIT_CORES');
  assert.equal(op1.replacementZone, 'field');
  assert.equal(op1.target, 'SELF');
  assert.equal(c1.abilities[0].physicalId, c2.abilities[0].physicalId);
  assert.equal(c1.abilities[0].semanticId, c2.abilities[0].semanticId);
});

// ============================================================================
// 3. TRANSACTION BOUNDARY & VOID CONSERVATION REPLACEMENT TESTS
// ============================================================================

test('WPC2-TXN-01: SUMMON preflight failure emits 0 events and leaves full state snapshot unchanged', async () => {
  const state = createGameState();
  const spirit = makeCard('sp_preflight', { cost: 5 });
  state.players.player.hand = [spirit];
  state.players.player.reserve = { normal: 2, soul: 0 };

  const events = new EventBus();
  const emitted = [];
  events.on('CORE_MOVED', ev => emitted.push(ev));
  events.on('SUMMONED', ev => emitted.push(ev));

  const res = await executeOp(state, { op: 'SUMMON' }, { controller: 'player', sourceCard: spirit }, new AutoChooseFirst(), events);
  assert.equal(res.success, false);
  assert.equal(res.reason, 'INSUFFICIENT_COST_CORES');
  assert.equal(emitted.length, 0);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.reserve.normal, 2);
});

test('WPC2-TXN-02: SUMMON post-cost placement failure rolls back cost cores, emits summon_rollback, and never emits SUMMONED', async () => {
  const state = createGameState();
  const spirit = makeCard('sp_rollback_txn', { cost: 2 });
  state.players.player.hand = [spirit];
  state.players.player.reserve = { normal: 3, soul: 0 };
  state.players.player.trash = { normal: 0, soul: 0 };

  const events = new EventBus();
  const emitted = [];
  events.on('CORE_MOVED', ev => {
    emitted.push(ev);
    if (ev.cause === 'summon_cost') state.players.player.reserve.normal = 0;
  });
  events.on('SUMMONED', ev => emitted.push(ev));

  const res = await executeOp(state, { op: 'SUMMON' }, { controller: 'player', sourceCard: spirit }, new AutoChooseFirst(), events);
  assert.equal(res.success, false);
  assert.equal(res.reason, 'CORE_PLACEMENT_FAILED');
  assert.equal(emitted.some(e => e.type === 'SUMMONED'), false);
  assert.equal(emitted.some(e => e.type === 'CORE_MOVED' && e.cause === 'summon_cost'), true);
  assert.equal(emitted.some(e => e.type === 'CORE_MOVED' && e.cause === 'summon_rollback'), true);
  assert.equal(state.players.player.reserve.normal, 2);
  assert.equal(state.players.player.trash.normal, 0);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.field.length, 0);
});

test('WPC2-TXN-03: Void-source replacement fails closed when Void is empty (0 events)', async () => {
  const state = createGameState();
  state.players.player.voidCores.normal = 0;
  state.modifiers = [{ type: 'REPLACEMENT_EFFECT', replaces: 'CORE_ADDITION', replacementZone: 'life', side: 'player' }];
  const events = new EventBus();
  const emitted = [];
  events.on('LIFE_RECOVERED', ev => emitted.push(ev));
  events.on('CORE_MOVED', ev => emitted.push(ev));

  const moved = await moveCore(state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'opponent' }, { cause: 'effect' }, events);
  assert.equal(moved, false);
  assert.equal(emitted.length, 0);
});

// ============================================================================
// 4. EVIDENCE-BACKED AUDITOR TESTS (NO MANUAL ALLOWLISTS)
// ============================================================================

test('WPC2-AUD-01: Missing/fake test references automatically downgrade operation status from SEMANTICALLY_VERIFIED', () => {
  const fakeReg = buildVerifiedOperationRegistry({
    DRAW: {
      supportedParamSchema: { required: [], optional: ['count'] },
      explicitlyUnsupportedVariants: [],
      productionHandlerRef: 'engine/ops/index.js',
      variants: {
        'DRAW:default': {
          testFile: 'tests/non_existent_fake_test.test.js',
          testIds: ['FAKE-01']
        }
      }
    }
  });
  assert.equal(fakeReg.DRAW.evidenceStatus, 'HANDLER_PRESENT_UNVERIFIED');
  const res = classifyOperation({ op: 'DRAW', count: 1 }, null, fakeReg);
  assert.equal(res.status, 'HANDLER_PRESENT_UNVERIFIED');
});

test('WPC2-AUD-02: Missing/fake test references automatically downgrade condition status from SEMANTICALLY_VERIFIED', () => {
  const fakeCondReg = buildVerifiedConditionRegistry({
    SOUL_CORE_ON_SPIRIT: {
      testFile: 'tests/non_existent_fake_test.test.js',
      testIds: ['FAKE-COND-01']
    }
  });
  assert.equal(fakeCondReg.SOUL_CORE_ON_SPIRIT.evidenceStatus, 'PARSED_EVALUABLE_UNVERIFIED');
  const res = classifyCondition({ type: 'SOUL_CORE_ON_SPIRIT' }, fakeCondReg);
  assert.notEqual(res.status, 'SEMANTICALLY_VERIFIED');
});

test('WPC2-AUD-03: Variant isolation separates verified BOUNCE:hand from unsupported BOUNCE:deck_ambiguous', () => {
  const handRes = classifyOperation({ op: 'BOUNCE', destination: 'hand', target: { side: 'opp' } });
  assert.equal(handRes.status, 'SEMANTICALLY_VERIFIED');

  const ambigRes = classifyOperation({ op: 'BOUNCE', destination: 'deck', target: { side: 'opp' } });
  assert.equal(ambigRes.status, 'PARTIALLY_SUPPORTED');
  assert.equal(ambigRes.variant, 'BOUNCE:deck_ambiguous');
});

test('WPC2-AUD-04: LEGACY_CONTEXT_CONDITION is never SEMANTICALLY_VERIFIED and opposing/either mismatch triggers NEEDS_MANUAL_REVIEW', () => {
  const legRes = classifyCondition({ type: 'LEGACY_CONTEXT_CONDITION', raw: 'unknown legacy text' });
  assert.notEqual(legRes.status, 'SEMANTICALLY_VERIFIED');

  const targetMismatch = classifyOperation(
    { op: 'DESTROY', count: 1, target: { side: 'either' } },
    { rawText: 'Destroy an opposing 3000 BP or less Spirit.' }
  );
  assert.equal(targetMismatch.status, 'NEEDS_MANUAL_REVIEW');
});
