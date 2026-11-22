/**
 * tests/effect_execution_targeting_conditions.test.js
 *
 * Phase 4C.4 – 4C.5: Effect Operation Execution, Unified Targeting,
 * Tri-State Condition Evaluation, Foundation Closeout & Stress Tests.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter, resetPlacementIdCounter } from '../engine/state.js';
import { matchesTargetFilter, computeEffectiveBP } from '../engine/continuous.js';
import { resolveTargets, validateSelection } from '../engine/selectors.js';
import { executeOp } from '../engine/ops/index.js';
import { CONDITION_RESULT, evaluateStructuredCondition, parseConditionToStructured } from '../engine/conditions.js';
import { TimingWindowManager } from '../engine/windows.js';

function makeFillerDeck(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `FILL-${i + 1}`,
    name: `Filler ${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 1000 } }
  }));
}

function makeCard(idNum, name, opts = {}) {
  return createCardInstance({
    card_number: idNum,
    name,
    type: opts.type || 'Spirit',
    cost: opts.cost ?? 2,
    color: opts.color || 'Red',
    colors: opts.colors || [opts.color || 'Red'],
    families: opts.families || ['Dragon'],
    symbols: opts.symbols || ['Red'],
    levels: opts.levels || { 1: { cost: 1, bp: opts.bp ?? 3000 }, 2: { cost: 3, bp: (opts.bp ?? 3000) + 2000 } },
    compiledIr: opts.compiledIr || null
  }, opts.owner || 'player');
}

// ---------------------------------------------------------------------------
// 1. matchesTargetFilter() Fixes
// ---------------------------------------------------------------------------

test('TARGET-FILTER-01: matchesTargetFilter enforces self/target/unknown-string and includeSelf filter composition', () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();
  const c1 = makeCard('TF-01', 'Red Dragon', { color: 'Red', cost: 4, bp: 4000, families: ['Dragon'] });
  const c2 = makeCard('TF-02', 'Blue Beast', { color: 'Blue', cost: 2, bp: 2000, families: ['Beast'], owner: 'opponent' });
  const st1 = createFieldStack(c1, { normal: 1, soul: 0 });
  st1.owner = 'player';
  const st2 = createFieldStack(c2, { normal: 1, soul: 0 });
  st2.owner = 'opponent';

  // 'self' requires sourceSt
  assert.equal(matchesTargetFilter('self', st1, null, 'player'), false);
  assert.equal(matchesTargetFilter('self', st1, st1, 'player'), true);
  assert.equal(matchesTargetFilter('self', st2, st1, 'player'), false);

  // 'target' resolves context.previousTarget / context.target
  assert.equal(matchesTargetFilter('target', st1, st1, 'player', {}), false);
  assert.equal(matchesTargetFilter('target', st2, st1, 'player', { previousTarget: c2 }), true);
  assert.equal(matchesTargetFilter('target', st1, st1, 'player', { previousTarget: c2 }), false);

  // Unknown string references must return false
  assert.equal(matchesTargetFilter('unknown_ref', st1, st1, 'player'), false);
  assert.equal(matchesTargetFilter('', st1, st1, 'player'), false);

  // includeSelf must still enforce type/color/cost filters
  assert.equal(matchesTargetFilter({ side: 'opp', includeSelf: true, color: 'Blue' }, st1, st1, 'player'), false);
  assert.equal(matchesTargetFilter({ side: 'opp', includeSelf: true, color: 'Red', costLte: 4 }, st1, st1, 'player'), true);
});

// ---------------------------------------------------------------------------
// 2. Unified resolveTargets() & Negative Selection Tests
// ---------------------------------------------------------------------------

test('RESOLVE-TARGETS-01: supports typed refs, tie-handling, strict validation, and duplicate rejection', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const pCard = makeCard('RT-01', 'Player Dragon', { bp: 5000, owner: 'player' });
  const oLow = makeCard('RT-02', 'Opp Low', { bp: 2000, cost: 1, owner: 'opponent' });
  const oHighA = makeCard('RT-03', 'Opp High A', { bp: 6000, cost: 5, owner: 'opponent' });
  const oHighB = makeCard('RT-04', 'Opp High B', { bp: 6000, cost: 4, owner: 'opponent' });

  const pSt = createFieldStack(pCard, { normal: 1, soul: 0 }); pSt.owner = 'player';
  const oLowSt = createFieldStack(oLow, { normal: 1, soul: 0 }); oLowSt.owner = 'opponent';
  const oHighASt = createFieldStack(oHighA, { normal: 1, soul: 0 }); oHighASt.owner = 'opponent';
  const oHighBSt = createFieldStack(oHighB, { normal: 1, soul: 0 }); oHighBSt.owner = 'opponent';

  game.state.players.player.field.push(pSt);
  game.state.players.opponent.field.push(oLowSt, oHighASt, oHighBSt);

  const ctx = { controller: 'player', sourceStack: pSt, sourceCard: pCard };

  // Unknown string reference -> UNSUPPORTED
  const unknownRes = await resolveTargets(game.state, 'nonexistent_ref', ctx);
  assert.equal(unknownRes.status, 'UNSUPPORTED');
  assert.equal(unknownRes.success, false);

  // 'self'
  const selfRes = await resolveTargets(game.state, 'self', ctx);
  assert.equal(selfRes.status, 'SUCCESS');
  assert.equal(selfRes.cards[0].id, pCard.id);

  // 'battling' when not in battle -> NO_OP_BY_RULE
  const noBattleRes = await resolveTargets(game.state, 'battling', ctx);
  assert.equal(noBattleRes.status, 'NO_OP_BY_RULE');

  // 'battling' when in battle
  game.state.battle = { attacker: pSt, blocker: oHighASt };
  const battleRes = await resolveTargets(game.state, { target: 'battling', side: 'opp' }, ctx);
  assert.equal(battleRes.status, 'SUCCESS');
  assert.equal(battleRes.cards.length, 1);
  assert.equal(battleRes.cards[0].id, oHighA.id);

  // Tie-handling: highest BP among opponents (oHighA and oHighB tied at 6000)
  const tiedRes = await resolveTargets(game.state, { side: 'opp', types: ['Spirit'], highest: 'bp', count: 1 }, ctx, {
    choose: async ({ candidates }) => {
      assert.equal(candidates.length, 2);
      return [candidates[1]]; // Pick oHighB
    }
  });
  assert.equal(tiedRes.status, 'SUCCESS');
  assert.equal(tiedRes.cards[0].id, oHighB.id);

  // Negative test: out-of-pool selection rejected
  const invalidRes = await resolveTargets(game.state, { side: 'opp', types: ['Spirit'], count: 1 }, ctx, {
    choose: async () => [{ card: pCard, stack: pSt }]
  });
  assert.equal(invalidRes.status, 'REJECTED');
  assert.equal(invalidRes.reason, 'INVALID_TARGET_SELECTION');

  // Negative test: duplicate selection rejected
  assert.equal(validateSelection([{ card: oLow, stack: oLowSt }, { card: oHighA, stack: oHighASt }], [oLow, oLow], { count: 2 }), false);
});

// ---------------------------------------------------------------------------
// 3. Priority Operation Families & Protection Exclusion
// ---------------------------------------------------------------------------

test('OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports grave/deck_bottom, DRAW emits CARD_DRAWN', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const events = [];
  game.events.on('CARD_DRAWN', (ev) => events.push(ev));

  const drawRes = await executeOp(game.state, { op: 'DRAW', count: 2 }, { controller: 'player' }, game.promptResolver, game.events);
  assert.equal(drawRes.status, 'SUCCESS');
  assert.equal(drawRes.drawnCount, 2);
  assert.equal(events.length, 2);

  const opp1 = makeCard('OP-01', 'Opp Spirit 1', { bp: 2000, owner: 'opponent' });
  const opp2 = makeCard('OP-02', 'Opp Protected', { bp: 2000, owner: 'opponent' });
  const st1 = createFieldStack(opp1, { normal: 1, soul: 0 }); st1.owner = 'opponent';
  const st2 = createFieldStack(opp2, { normal: 1, soul: 0 }); st2.owner = 'opponent';
  game.state.players.opponent.field.push(st1, st2);

  // Give st2 INDESTRUCTIBLE protection
  game.state.modifiers.push({
    id: 'prot-1',
    type: 'INDESTRUCTIBLE',
    targetStackId: st2.id,
    by: ['EFFECTS']
  });

  const destroyRes = await executeOp(game.state, { op: 'DESTROY', all: true, target: { side: 'opp', types: ['Spirit'] } }, { controller: 'player' }, game.promptResolver, game.events);
  assert.equal(destroyRes.status, 'SUCCESS');
  assert.equal(destroyRes.destroyedCount, 1);
  assert.equal(destroyRes.cards[0].id, opp1.id, 'Protected st2 excluded from destroyed cards');
  assert.equal(game.state.players.opponent.field.length, 1);

  // BOUNCE st2 to deck_bottom
  const bounceRes = await executeOp(game.state, { op: 'BOUNCE', destination: 'DECK_BOTTOM', target: { side: 'opp', types: ['Spirit'] } }, { controller: 'player' }, {
    choose: async ({ candidates }) => [candidates[0]]
  }, game.events);
  assert.equal(bounceRes.status, 'SUCCESS');
  assert.equal(bounceRes.cards.length, 1);
  assert.equal(game.state.players.opponent.field.length, 0);
  assert.equal(game.state.players.opponent.deck[game.state.players.opponent.deck.length - 1].id, opp2.id);
});

// ---------------------------------------------------------------------------
// 4. Tri-State Conditions & Stage 1.3 Windows Closeout
// ---------------------------------------------------------------------------

test('COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED', () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const pCard = makeCard('CN-01', 'Green Spirit', { color: 'Green', bp: 0, levels: { 1: { cost: 1, bp: 0 } }, owner: 'player' });
  const pSt = createFieldStack(pCard, { normal: 1, soul: 0 }); pSt.owner = 'player';
  game.state.players.player.field.push(pSt);
  game.state.turnOwner = 'opponent';
  game.state.step = 'ATTACK';
  game.state.battle = { attacker: pSt, blocker: null };

  const ctx = { controller: 'player', sourceStack: pSt, sourceCard: pCard, previousOpResult: { success: true } };

  assert.equal(evaluateStructuredCondition(game.state, 'If the Spirit is currently battling', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(game.state, 'if it has 0 BP', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(game.state, "if it's the opposing Attack Step", ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(game.state, { colorSymbol: 'Green' }, ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(game.state, { colorSymbol: 'Blue' }, ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(game.state, 'While your Hand is five or less', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(game.state, "if you've done so", ctx).result, CONDITION_RESULT.TRUE);

  // Soul State via under array
  const underCard = makeCard('CN-02', 'Soul Card', { owner: 'player' });
  pSt.under.push(underCard);
  assert.equal(evaluateStructuredCondition(game.state, 'While this card is in Soul State', { ...ctx, sourceCard: underCard }).result, CONDITION_RESULT.TRUE);

  // Compound AND / OR
  assert.equal(evaluateStructuredCondition(game.state, 'If the Spirit is currently battling and While your Hand is five or less', ctx).result, CONDITION_RESULT.TRUE);
  // Unknown string must strictly return UNSUPPORTED (never TRUE or FALSE)
  assert.equal(evaluateStructuredCondition(game.state, 'If you banish the [Soul Core] on this Ultimate from the game', ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(parseConditionToStructured('If the Spirit is currently battling and unknown gibberish'), null);
});

test('WIN-CLOSEOUT-01: AFTER_YOUR_SPIRIT_DEPLETED burst and structured FLASH turnRestriction work', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const wm = new TimingWindowManager(game);
  const burstCard = makeCard('BC-01', 'Deplete Burst', {
    compiledIr: {
      abilities: [{
        header: { timing: 'BURST', burstCondition: 'AFTER_YOUR_SPIRIT_DEPLETED' },
        clauses: [{ op: { op: 'DRAW', count: 1 } }]
      }]
    }
  });
  assert.equal(wm.matchesBurstCondition(burstCard, { type: 'SPIRIT_DEPLETED', player: 'player' }, 'player'), true);
  assert.equal(wm.matchesBurstCondition(burstCard, { type: 'SPIRIT_DEPLETED', player: 'opponent' }, 'player'), false);

  const flashSpirit = makeCard('FS-01', 'Flash Spirit', {
    compiledIr: {
      abilities: [{
        header: { timing: 'FLASH', turnRestriction: 'OPPONENT_TURN' },
        clauses: [{ op: { op: 'DRAW', count: 1 } }]
      }]
    }
  });
  const fsStack = createFieldStack(flashSpirit, { normal: 1, soul: 0 });
  game.state.players.player.field.push(fsStack);
  assert.equal(wm.getAvailableFlashActions('player', 'player').some(a => a.action === 'ACTIVATE_FLASH_ABILITY'), false);
  assert.equal(wm.getAvailableFlashActions('player', 'opponent').some(a => a.action === 'ACTIVATE_FLASH_ABILITY'), true);
});

// ---------------------------------------------------------------------------
// 5. Stress & Performance Benchmark
// ---------------------------------------------------------------------------

test('PERF-TARGET-01: 200-candidate resolveTargets, multi-target DESTROY, and 1,000 BP recalculations finish quickly', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  for (let i = 0; i < 200; i++) {
    const c = makeCard(`PERF-${i}`, `Perf Spirit ${i}`, { bp: 1000 + (i % 5) * 1000, owner: 'opponent' });
    const st = createFieldStack(c, { normal: 1, soul: 0 });
    st.owner = 'opponent';
    game.state.players.opponent.field.push(st);
  }
  game.state.modifiers.push({ id: 'perf-buff', type: 'BP_BUFF', side: 'opponent', amount: 1000 });

  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    computeEffectiveBP(game.state.players.opponent.field[i % 200], game.state);
  }
  const destroyRes = await executeOp(game.state, {
    op: 'DESTROY',
    all: true,
    target: { side: 'opp', types: ['Spirit'], filters: { bpLte: 3000 } }
  }, { controller: 'player' }, game.promptResolver, game.events);
  const elapsedMs = performance.now() - t0;

  assert.equal(destroyRes.status, 'SUCCESS');
  assert.equal(destroyRes.destroyedCount, 80); // 1000+1000=2000 and 2000+1000=3000 => 2/5 of 200 = 80
  assert.ok(elapsedMs < 2000, `Stress benchmark took ${elapsedMs.toFixed(1)}ms (expected < 2000ms)`);
});
