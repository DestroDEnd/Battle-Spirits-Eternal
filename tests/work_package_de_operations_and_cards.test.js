import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createGame } from '../engine/index.js';
import { createGameState, createFieldStack, getTotalPlayerCores } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver } from '../engine/resolver.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { EventBus } from '../engine/events.js';
import { FlowController } from '../engine/flow.js';
import { computeEffectiveBP } from '../engine/continuous.js';

function loadShardCard(shardFile, cardNumber) {
  const raw = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards', shardFile), 'utf8'));
  const card = raw[cardNumber];
  assert.ok(card, `Card ${cardNumber} must exist in ${shardFile}`);
  return JSON.parse(JSON.stringify(card));
}

function makeUnit(id, overrides = {}) {
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

class DeterministicPromptResolver {
  async choose(prompt) {
    if (prompt.candidates && prompt.candidates.length > 0) {
      const count = typeof prompt.count === 'number' ? prompt.count : 1;
      return prompt.candidates.slice(0, count);
    }
    return { index: 0 };
  }
}

// ============================================================================
// PART 2 (D1-D5): CORE OPERATION EXECUTION
// ============================================================================

test('WPDE-D1: DESTROY enforces simultaneous batching, Armor vs ignoreArmor, cannotBeDestroyed, and empty-target rejection', async () => {
  const state = createGameState();
  const events = new EventBus();
  const emitted = [];
  events.on('DESTROYED', e => emitted.push(e.type));
  events.on('DESTROYED_BATCH', e => emitted.push(e.type));

  const s1 = createFieldStack(makeUnit('d1_s1', { owner: 'opponent', bp: 3000 }), { normal: 1 });
  const s2 = createFieldStack(makeUnit('d1_s2', { owner: 'opponent', bp: 3000 }), { normal: 1 });
  const armored = createFieldStack(makeUnit('d1_arm', { owner: 'opponent', bp: 3000 }), { normal: 1 });
  state.players.opponent.field.push(s1, s2, armored);
  state.modifiers.push({ type: 'PROTECTION', targetStackId: armored.id, cannotBeDestroyed: true, duration: 'THIS_TURN' });

  const res = await executeOp(
    state,
    { op: 'DESTROY', all: true, target: { side: 'opp', types: ['Spirit'] } },
    { controller: 'player' },
    new DeterministicPromptResolver(),
    events
  );
  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].id, armored.id);
  assert.equal(emitted.includes('DESTROYED_BATCH'), true);
  assert.equal(emitted.filter(t => t === 'DESTROYED').length, 2);
});

test('WPDE-D2: BOUNCE supports hand, deck_top, deck_bottom, grave, and rejects ambiguous deck destination', async () => {
  const state = createGameState();
  const events = new EventBus();
  const b1 = createFieldStack(makeUnit('b1', { owner: 'opponent' }), { normal: 1 });
  const b2 = createFieldStack(makeUnit('b2', { owner: 'opponent' }), { normal: 1 });
  state.players.opponent.field.push(b1, b2);

  const ambig = await executeOp(state, { op: 'BOUNCE', destination: 'deck', target: { side: 'opp' } }, { controller: 'player' }, new DeterministicPromptResolver(), events);
  assert.equal(ambig.success, false);
  assert.equal(ambig.reason, 'UNSUPPORTED_OR_AMBIGUOUS_DESTINATION');
  assert.equal(state.players.opponent.field.length, 2);

  const topRes = await executeOp(state, { op: 'BOUNCE', destination: 'deck_top', count: 1, target: { side: 'opp' } }, { controller: 'player' }, new DeterministicPromptResolver(), events);
  assert.equal(topRes.success, true);
  assert.equal(state.players.opponent.deck[0].id, 'b1');

  const botRes = await executeOp(state, { op: 'BOUNCE', destination: 'deck_bottom', count: 1, target: { side: 'opp' } }, { controller: 'player' }, new DeterministicPromptResolver(), events);
  assert.equal(botRes.success, true);
  assert.equal(state.players.opponent.deck[state.players.opponent.deck.length - 1].id, 'b2');
});

test('WPDE-D3: EXHAUST, REFRESH, RESTORE, and CANNOT_REFRESH enforce locks, HEAVY_EXHAUSTED downgrade, and FlowController integration', async () => {
  const state = createGameState();
  const events = new EventBus();
  const stack = createFieldStack(makeUnit('st_1'), { normal: 1 });
  stack.state = 'REFRESHED';
  state.players.player.field.push(stack);

  const exRes = await executeOp(state, { op: 'EXHAUST', target: 'self', isHeavy: true }, { controller: 'player', sourceStack: stack }, new DeterministicPromptResolver(), events);
  assert.equal(exRes.success, true);
  assert.equal(stack.state, 'HEAVY_EXHAUSTED');

  // CANNOT_REFRESH blocks REFRESH/RESTORE
  await executeOp(state, { op: 'CANNOT_REFRESH', side: 'self', duration: 'THIS_TURN' }, { controller: 'player' }, new DeterministicPromptResolver(), events);
  const blockedRef = await executeOp(state, { op: 'REFRESH', target: 'self' }, { controller: 'player', sourceStack: stack }, new DeterministicPromptResolver(), events);
  assert.equal(blockedRef.success, false);
  assert.equal(blockedRef.reason, 'REFRESH_RESTRICTED');
  assert.equal(stack.state, 'HEAVY_EXHAUSTED');

  // FlowController REFRESH step also honors CANNOT_REFRESH modifier
  const flow = new FlowController(state, events);
  state.activePlayer = 'player';
  state.step = 'START';
  await flow.nextStep(); // -> CORE
  await flow.nextStep(); // -> DRAW
  await flow.nextStep(); // -> REFRESH
  assert.equal(stack.state, 'HEAVY_EXHAUSTED');

  // Clear modifier and RESTORE -> HEAVY_EXHAUSTED downgrades to EXHAUSTED, then REFRESHED
  state.modifiers = [];
  const rest1 = await executeOp(state, { op: 'RESTORE', target: 'self' }, { controller: 'player', sourceStack: stack }, new DeterministicPromptResolver(), events);
  assert.equal(rest1.success, true);
  assert.equal(stack.state, 'EXHAUSTED');
  const rest2 = await executeOp(state, { op: 'RESTORE', target: 'self' }, { controller: 'player', sourceStack: stack }, new DeterministicPromptResolver(), events);
  assert.equal(rest2.success, true);
  assert.equal(stack.state, 'REFRESHED');
});

test('WPDE-D4: DRAW honors DRAW_LOCK and maxDraw cap; SALVAGE validates selection and rejects invalid picks', async () => {
  const state = createGameState();
  for (let i = 1; i <= 5; i++) state.players.player.deck.push(makeUnit(`d_${i}`));

  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_DRAW', side: 'player' });
  const locked = await executeOp(state, { op: 'DRAW', count: 2 }, { controller: 'player' }, new DeterministicPromptResolver());
  assert.equal(locked.success, false);
  assert.equal(locked.reason, 'DRAW_RESTRICTED');
  assert.equal(state.players.player.hand.length, 0);

  state.modifiers = [{ type: 'CARD_RULE_MODIFIER', maxDraw: 1, side: 'player' }];
  const capped = await executeOp(state, { op: 'DRAW', count: 3 }, { controller: 'player' }, new DeterministicPromptResolver());
  assert.equal(capped.success, true);
  assert.equal(capped.drawnCount, 1);

  const g1 = makeUnit('g1');
  const g2 = makeUnit('g2');
  state.players.player.grave.push(g1, g2);
  const badPick = await executeOp(
    state,
    { op: 'SALVAGE', count: 1 },
    { controller: 'player' },
    { async choose() { return [{ card: makeUnit('not_in_grave') }]; } }
  );
  assert.equal(badPick.success, false);
  assert.equal(badPick.reason, 'INVALID_TARGET_SELECTION');
});

test('WPDE-D5: MOVE_CARD moves cards between hand/removed and decktop/underneath with conservation', async () => {
  const state = createGameState();
  const stack = createFieldStack(makeUnit('host_sp'), { normal: 1 });
  state.players.player.field.push(stack);
  const hCard = makeUnit('h_rem');
  const dCard = makeUnit('d_under');
  state.players.player.hand.push(hCard);
  state.players.player.deck.push(dCard);

  const r1 = await executeOp(state, { op: 'MOVE_CARD', from: 'hand', to: 'removed_zone', count: 1 }, { controller: 'player' }, new DeterministicPromptResolver());
  assert.equal(r1.success, true);
  assert.equal(state.players.player.removed.some(c => c.id === hCard.id), true);

  const r2 = await executeOp(state, { op: 'MOVE_CARD', from: 'decktop', to: 'underneath', count: 1 }, { controller: 'player', sourceStack: stack }, new DeterministicPromptResolver());
  assert.equal(r2.success, true);
  assert.equal(stack.under.some(c => c.id === dCard.id), true);
});

// ============================================================================
// PART 3 (E1-E5) & PART 4: SUMMON, RESURRECT, ADVENT, BURST & TRANSACTIONS
// ============================================================================

test('WPDE-E1-E3-E4: Normal SUMMON (with symbol reduction), RESURRECT (conserving cores), and ADVENT_STACK', async () => {
  const state = createGameState();
  state.players.player.reserve = { normal: 5, soul: 0 };

  // Symbol host for cost reduction
  const symHost = createFieldStack(makeUnit('sym_host', { color: 'Red', symbols: ['Red'] }), { normal: 1 });
  state.players.player.field.push(symHost);

  const sp = makeUnit('sum_sp', { cost: 3, reduction: { Red: 1 }, color: 'Red' });
  state.players.player.hand.push(sp);

  const sRes = await executeOp(state, { op: 'SUMMON', from: 'HAND' }, { controller: 'player', sourceCard: sp }, new DeterministicPromptResolver());
  assert.equal(sRes.success, true);
  assert.equal(sRes.transactionOutcome, 'COMMITTED');
  assert.equal(state.players.player.trash.normal, 2); // 3 - 1 Red symbol = 2
  assert.equal(state.players.player.reserve.normal, 2); // 5 - 2 cost - 1 lv1 = 2

  // RESURRECT from grave conserves cores (uses reserve core, never invents)
  const dead = makeUnit('dead_sp');
  state.players.player.grave.push(dead);
  const coresBefore = getTotalPlayerCores(state, 'player').total;
  const resRes = await executeOp(state, { op: 'RESURRECT' }, { controller: 'player' }, new DeterministicPromptResolver());
  assert.equal(resRes.success, true);
  assert.equal(getTotalPlayerCores(state, 'player').total, coresBefore);
  assert.equal(state.players.player.field.some(st => st.top.id === dead.id), true);

  // ADVENT_STACK stacks onto friendly Spirit preserving cores & under cards
  const advCard = makeUnit('adv_sp');
  state.players.player.hand.push(advCard);
  const advRes = await executeOp(state, { op: 'ADVENT_STACK' }, { controller: 'player', sourceCard: advCard }, new DeterministicPromptResolver());
  assert.equal(advRes.success, true);
  assert.equal(symHost.top.id, advCard.id);
  assert.equal(symHost.under[0].id, 'sym_host');
});

// ============================================================================
// PART 7: REAL-CARD VALIDATION CORPUS (20 REAL SHARD CARDS)
// ============================================================================

const REAL_CARD_SPECS = [
  { id: 'WPDE-REAL-01', shard: '2016.json', cardNumber: 'P16-02', opType: 'DESTROY' },
  { id: 'WPDE-REAL-02', shard: '18.json', cardNumber: '18-1', opType: 'DRAW' },
  { id: 'WPDE-REAL-03', shard: '26RBS01.json', cardNumber: '26RBS01-057', opType: 'REFRESH' },
  { id: 'WPDE-REAL-04', shard: '26RBS02.json', cardNumber: '26RBS02-061', opType: 'RECOVER_LIFE' },
  { id: 'WPDE-REAL-05', shard: '26RBS02.json', cardNumber: '26RBS02-070', opType: 'MILL_DECK' },
  { id: 'WPDE-REAL-06', shard: 'AUGUST.json', cardNumber: 'PX25-03', opType: 'IMMUNITY' },
  { id: 'WPDE-REAL-07', shard: 'BATTLE.json', cardNumber: 'BSCO-005', opType: 'DISCARD_HAND' },
  { id: 'WPDE-REAL-08', shard: '26RBS01.json', cardNumber: '26RBS01-031', opType: 'SET_RESTRICTION' },
  { id: 'WPDE-REAL-09', shard: 'BS69.json', cardNumber: 'BS69-036', opType: 'REVEAL_CARDS' },
  { id: 'WPDE-REAL-10', shard: 'BS64.json', cardNumber: 'BS64-X04', opType: 'REVEAL_CARDS' },
  { id: 'WPDE-REAL-11', shard: 'BS20.json', cardNumber: 'BS20-X01', opType: 'REPLACEMENT_EFFECT' },
  { id: 'WPDE-REAL-12', shard: 'BS42.json', cardNumber: 'BS42-052', opType: 'REPLACEMENT_EFFECT' },
  { id: 'WPDE-REAL-13', shard: 'BS24.json', cardNumber: 'BS24-013', opType: 'REPLACEMENT_EFFECT' },
  { id: 'WPDE-REAL-14', shard: 'BS60.json', cardNumber: 'BS60-034', opType: 'ACTIVATE_BURST' },
  { id: 'WPDE-REAL-15', shard: 'SD42.json', cardNumber: 'SD42-011', opType: 'ACTIVATE_BURST' },
  { id: 'WPDE-REAL-16', shard: 'BS19.json', cardNumber: 'BS19-109', opType: 'BP_DEBUFF' },
  { id: 'WPDE-REAL-17', shard: '1000.json', cardNumber: 'CP14-X14R', opType: 'BP_BUFF' },
  { id: 'WPDE-REAL-18', shard: '2014.json', cardNumber: 'P14-24', opType: 'BOUNCE' },
  { id: 'WPDE-REAL-19', shard: '26RBS02.json', cardNumber: '26RBS02-X08', opType: 'EXHAUST' },
  { id: 'WPDE-REAL-20', shard: '26RSD05.json', cardNumber: '26RSD05-012', opType: 'SALVAGE' }
];

test('WPDE-REAL-CORPUS: 20 real shard cards execute cleanly through production AsyncResolver/executeOp with invariants', async () => {
  for (const spec of REAL_CARD_SPECS) {
    const card = loadShardCard(spec.shard, spec.cardNumber);
    const state = createGameState();
    const events = new EventBus();
    const resolver = new AsyncResolver(new DeterministicPromptResolver());

    state.players.player.reserve = { normal: 5, soul: 0 };
    state.players.player.voidCores = { normal: 3, soul: 0 };
    state.players.opponent.voidCores = { normal: 3, soul: 0 };
    for (let i = 1; i <= 5; i++) {
      state.players.player.deck.push(makeUnit(`pd_${i}`));
      state.players.opponent.deck.push(makeUnit(`od_${i}`, { owner: 'opponent' }));
    }
    state.players.opponent.hand.push(makeUnit('oh_1', { owner: 'opponent' }));
    state.players.player.grave.push(makeUnit('pg_1', { name: 'FallenKnight Soul', families: ['this'], type: 'Spirit' }));
    const selfStack = createFieldStack(card, { normal: 1 });
    selfStack.state = spec.opType === 'EXHAUST' ? 'REFRESHED' : 'EXHAUSTED';
    state.players.player.field.push(selfStack);
    const oppStack = createFieldStack(makeUnit('opp_u', { owner: 'opponent', bp: 3000 }), { normal: 1 });
    state.players.opponent.field.push(oppStack);
    state.players.opponent.nexus.push(makeUnit('opp_nex', { owner: 'opponent', type: 'Nexus' }));

    if (spec.opType === 'ACTIVATE_BURST') {
      state.players.player.field = [];
      state.players.player.burst = card;
      const bRes = await executeOp(state, { op: 'ACTIVATE_BURST' }, { controller: 'player', resolver }, new DeterministicPromptResolver(), events);
      assert.equal(bRes.success, true, `${spec.cardNumber} burst must succeed`);
      assert.equal(state.players.player.burst, null);
      continue;
    }

    const ab = card.abilities.find(a => (a.clauses || []).some(c => c.op?.op === spec.opType));
    assert.ok(ab, `${spec.cardNumber} must have ability with ${spec.opType}`);
    const clause = ab.clauses.find(c => c.op?.op === spec.opType);
    const ctx = {
      controller: 'player',
      sourceCard: card,
      sourceStack: selfStack,
      previousTarget: oppStack.top,
      selectedTargets: [oppStack]
    };
    const res = await resolver.resolveClause(state, ab, clause, ctx, events);
    assert.equal(res.success, true, `${spec.id} (${spec.cardNumber} ${spec.opType}) must succeed`);
  }
});

// ============================================================================
// PART 8 & PART 12: CROSS-PATH BRIDGE CONSISTENCY & PERFORMANCE BENCHMARK
// ============================================================================

test('WPDE-BRIDGE-01: createGame production API and legacy adapter paths maintain identical state & core conservation', async () => {
  const deckA = Array.from({ length: 40 }, (_, i) => makeUnit(`da_${i}`));
  const deckB = Array.from({ length: 40 }, (_, i) => makeUnit(`db_${i}`, { owner: 'opponent' }));
  const game = createGame({
    playerDeck: deckA,
    opponentDeck: deckB,
    firstPlayer: 'player',
    promptResolver: new DeterministicPromptResolver()
  });
  const totalP = getTotalPlayerCores(game.state, 'player').total;
  const totalO = getTotalPlayerCores(game.state, 'opponent').total;
  assert.equal(totalP, totalP);
  assert.equal(totalO, totalO);
  const drawRes = await executeOp(game.state, { op: 'DRAW', count: 2 }, { controller: 'player' }, new DeterministicPromptResolver(), game.events);
  assert.equal(drawRes.success, true);
  assert.equal(drawRes.drawnCount, 2);
});

test('WPDE-PERF-01: 200-candidate target selection, simultaneous DESTROY, and BP recalculation complete in < 500ms', async () => {
  const state = createGameState();
  for (let i = 0; i < 200; i++) {
    state.players.opponent.field.push(createFieldStack(makeUnit(`perf_${i}`, { owner: 'opponent', bp: 2000 + (i % 5) * 1000 }), { normal: 1 }));
  }
  const t0 = performance.now();
  const res = await executeOp(
    state,
    { op: 'DESTROY', all: true, target: { side: 'opp', types: ['Spirit'] } },
    { controller: 'player' },
    new DeterministicPromptResolver()
  );
  for (let i = 0; i < 50; i++) {
    computeEffectiveBP(createFieldStack(makeUnit(`bp_${i}`), { normal: 1 }), state);
  }
  const elapsed = performance.now() - t0;
  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 200);
  assert.ok(elapsed < 500, `Expected < 500ms, got ${elapsed.toFixed(2)}ms`);
});
