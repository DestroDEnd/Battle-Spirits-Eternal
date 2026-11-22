/**
 * tests/work_package_c_ops_conditions_compiler.test.js
 *
 * Work Package C (Phases 4C.4 – 4C.7):
 * - Section 2: evaluateComparisonStrict fail-closed, applyExtremeTieFilter effective stats, isModifierApplicable state
 * - Section 3 & 4: Phase 4C.4 Operation Handlers + Operation Execution Contract (SUCCESS, NO_OP_BY_RULE, REJECTED, UNSUPPORTED, FAILED)
 * - Section 5: Turn-history tracking + save/load preservation + tri-state compound AND/OR/NOT
 * - Section 6: Compiler semantic fidelity (no undefined AST properties under RFC 8785)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter, resetPlacementIdCounter } from '../engine/state.js';
import { evaluateComparison, evaluateComparisonStrict, resolveTargets } from '../engine/selectors.js';
import { executeOp } from '../engine/ops/index.js';
import { CONDITION_RESULT, evaluateStructuredCondition } from '../engine/conditions.js';
import { compileCard } from '../compiler/index.js';

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
// Section 2.1: evaluateComparisonStrict negative tests
// ---------------------------------------------------------------------------

test('WPC-2.1: evaluateComparisonStrict fails closed on unknown op/prop/ref, missing ref, and invalid numbers', () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const src = makeCard('C-SRC', 'Source', { bp: 3000 });
  const candCard = makeCard('C-CAND', 'Candidate', { bp: 2000, owner: 'opponent' });
  const srcSt = createFieldStack(src, { normal: 1, soul: 0 });
  const candSt = createFieldStack(candCard, { normal: 1, soul: 0 });
  const cand = { stack: candSt, card: candCard, side: 'opponent' };
  const ctx = { controller: 'player', sourceStack: srcSt, sourceCard: src };

  // Unknown operator -> UNSUPPORTED, boolean evaluateComparison -> false (never true!)
  assert.equal(evaluateComparisonStrict(game.state, { property: 'BP', operator: 'UNKNOWN_OP', reference: 'self' }, cand, ctx), 'UNSUPPORTED');
  assert.equal(evaluateComparison(game.state, { property: 'BP', operator: 'UNKNOWN_OP', reference: 'self' }, cand, ctx), false);

  // Unknown property & unknown reference -> UNSUPPORTED
  assert.equal(evaluateComparisonStrict(game.state, { property: 'SPEED', operator: 'LTE', reference: 'self' }, cand, ctx), 'UNSUPPORTED');
  assert.equal(evaluateComparisonStrict(game.state, { property: 'BP', operator: 'LTE', reference: 'unknown_ref' }, cand, ctx), 'UNSUPPORTED');

  // Missing reference object (target with no previousTarget) -> FALSE
  assert.equal(evaluateComparisonStrict(game.state, { property: 'BP', operator: 'LTE', reference: 'target' }, cand, ctx), 'FALSE');

  // Invalid / NaN / null / undefined values -> FALSE
  assert.equal(evaluateComparisonStrict(game.state, { property: 'BP', operator: 'LTE', reference: 'self' }, { card: { bp: NaN } }, ctx), 'FALSE');
  assert.equal(evaluateComparisonStrict(game.state, { property: 'BP', operator: 'LTE', reference: 'self' }, { card: { bp: undefined } }, ctx), 'FALSE');
  assert.equal(evaluateComparisonStrict(game.state, { property: 'BP', operator: 'LTE', reference: 'self' }, null, ctx), 'FALSE');

  // Valid comparison -> TRUE
  assert.equal(evaluateComparisonStrict(game.state, { property: 'BP', operator: 'LTE', reference: 'self' }, cand, ctx), 'TRUE');
});

// ---------------------------------------------------------------------------
// Section 2.2: Effective-value extreme tie selector (printed vs effective BP)
// ---------------------------------------------------------------------------

test('WPC-2.2: resolveTargets highest/lowest BP uses effective BP (dynamic modifiers), not printed BP', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const printedLow = makeCard('EFF-1', 'Printed Low', { bp: 2000, owner: 'opponent' });
  const printedHigh = makeCard('EFF-2', 'Printed High', { bp: 5000, owner: 'opponent' });
  const stLow = createFieldStack(printedLow, { normal: 1, soul: 0 }); stLow.owner = 'opponent';
  const stHigh = createFieldStack(printedHigh, { normal: 1, soul: 0 }); stHigh.owner = 'opponent';
  game.state.players.opponent.field.push(stLow, stHigh);

  // Buff stLow by +4000 -> effective BP 6000 > stHigh 5000
  game.state.modifiers.push({ id: 'eff-buff', type: 'BP_BUFF', targetStackId: stLow.id, side: 'opponent', amount: 4000 });

  const res = await resolveTargets(game.state, { side: 'opp', types: ['Spirit'], highest: 'bp', count: 1 }, { controller: 'player' });
  assert.equal(res.status, 'SUCCESS');
  assert.equal(res.cards[0].id, printedLow.id, 'Effective BP 6000 beats printed 5000');
});

// ---------------------------------------------------------------------------
// Section 3 & 4: Phase 4C.4 Operations & Execution Contract
// ---------------------------------------------------------------------------

test('WPC-4C4-OPS: implements UNPREVENTABLE, CONTINUE_BATTLE, CHANGE, COUNT_OPERATION, TOKEN_DEPLOYMENT, FORMAT_MARKER, CAST_MAGIC_FREE, and fails closed on bare stubs', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const p = game.state.players.player;

  // Bare ambiguous stubs must return UNSUPPORTED (never guess)
  for (const bare of ['DECK_OR_HAND_ACTION', 'COUNT_OPERATION', 'MODIFY_EFFECT', 'TOKEN_DEPLOYMENT']) {
    const r = await executeOp(game.state, { op: bare }, { controller: 'player' });
    assert.equal(r.status, 'UNSUPPORTED', `${bare} bare stub must be UNSUPPORTED`);
    assert.equal(r.success, false);
  }

  // FORMAT_MARKER
  const srcCard = makeCard('OP-SRC', 'Source Spirit', { cost: 4 });
  const fmtRes = await executeOp(game.state, { op: 'FORMAT_MARKER', marker: 'LEGACY' }, { controller: 'player', sourceCard: srcCard });
  assert.equal(fmtRes.status, 'SUCCESS');
  assert.deepEqual(srcCard.formatMarkers, ['LEGACY']);

  // UNPREVENTABLE
  const unpRes = await executeOp(game.state, { op: 'UNPREVENTABLE', scope: 'EFFECT' }, { controller: 'player', sourceCard: srcCard });
  assert.equal(unpRes.status, 'SUCCESS');
  assert.equal(game.state.modifiers.some(m => m.type === 'UNPREVENTABLE'), true);

  // CONTINUE_BATTLE (no battle -> NO_OP_BY_RULE; active battle -> SUCCESS)
  assert.equal((await executeOp(game.state, { op: 'CONTINUE_BATTLE' }, { controller: 'player' })).status, 'NO_OP_BY_RULE');
  game.state.battle = { attacker: null, blocker: null };
  assert.equal((await executeOp(game.state, { op: 'CONTINUE_BATTLE' }, { controller: 'player' })).status, 'SUCCESS');

  // COUNT_OPERATION (structured)
  p.life = 4;
  const ctxCount = { controller: 'player' };
  const cntRes = await executeOp(game.state, { op: 'COUNT_OPERATION', object: 'LIFE' }, ctxCount);
  assert.equal(cntRes.status, 'SUCCESS');
  assert.equal(cntRes.count, 4);
  assert.equal(ctxCount.lastCount, 4);

  // TOKEN_DEPLOYMENT (structured)
  const tokRes = await executeOp(game.state, { op: 'TOKEN_DEPLOYMENT', name: 'Swordish Token', bp: 2000 }, { controller: 'player' }, game.promptResolver, game.events);
  assert.equal(tokRes.status, 'SUCCESS');
  assert.equal(p.field.some(st => st.top.isToken && st.top.name === 'Swordish Token'), true);

  // CHANGE
  const changeCard = makeCard('CHG-1', 'Kamen Rider Change', { cost: 5, families: ['Kamen'] });
  p.hand.push(changeCard);
  const targetSp = makeCard('CHG-TGT', 'Small Kamen', { cost: 3, families: ['Kamen'] });
  const targetSt = createFieldStack(targetSp, { normal: 2, soul: 0 });
  targetSt.state = 'EXHAUSTED';
  p.field.push(targetSt);
  const chgRes = await executeOp(game.state, { op: 'CHANGE', maxCost: 6, family: 'Kamen' }, { controller: 'player', sourceCard: changeCard }, { choose: async ({ candidates }) => [candidates[0]] }, game.events);
  assert.equal(chgRes.status, 'SUCCESS');
  assert.equal(targetSt.top.id, changeCard.id);
  assert.equal(targetSt.state, 'REFRESHED');
  assert.equal(p.hand.some(c => c.id === targetSp.id), true);

  // CAST_MAGIC_FREE
  const freeMagic = makeCard('MAG-1', 'Free Draw Magic', {
    type: 'Magic',
    cost: 4,
    compiledIr: { abilities: [{ header: { timing: 'MAIN' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }] }
  });
  p.hand.push(freeMagic);
  const handBefore = p.hand.length;
  const castRes = await executeOp(game.state, { op: 'CAST_MAGIC_FREE' }, { controller: 'player', resolver: game.resolver }, game.promptResolver, game.events);
  assert.equal(castRes.status, 'SUCCESS');
  assert.equal(p.grave.some(c => c.id === freeMagic.id), true);
  assert.equal(p.hand.length, handBefore); // -1 magic +1 drawn
});

// ---------------------------------------------------------------------------
// Section 5: Turn-History Tracking, Save/Load, & Tri-State Compound Logic
// ---------------------------------------------------------------------------

test('WPC-4C5-COND: turnHistory tracks events, resets on END->START, and compound tri-state AND/OR/NOT is sound', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  await game.events.emit({ type: 'LIFE_REDUCED', player: 'player', amount: 1 });
  await game.events.emit({ type: 'ATTACK_DECLARED', player: 'player' });
  await game.events.emit({ type: 'ADVENTS', player: 'player' });

  const ctx = { controller: 'player' };
  assert.equal(evaluateStructuredCondition(game.state, 'If your Life was reduced this turn', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(game.state, 'If this is the first attack of your turn', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(game.state, 'If you [advented] during this turn', ctx).result, CONDITION_RESULT.TRUE);

  // Save/load preservation
  const saved = JSON.parse(JSON.stringify(game.state));
  const restored = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), state: saved });
  assert.equal(evaluateStructuredCondition(restored.state, 'If your Life was reduced this turn', ctx).result, CONDITION_RESULT.TRUE);

  // Reset on END -> START
  restored.state.step = 'END';
  await restored.flow.nextStep();
  assert.equal(evaluateStructuredCondition(restored.state, 'If your Life was reduced this turn', ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(restored.state, "If your Life wasn't reduced this turn", ctx).result, CONDITION_RESULT.TRUE);

  // Sound tri-state compound evaluation
  const trueCond = { kind: 'STRUCTURED_CONDITION', type: 'LIFE_THRESHOLD', side: 'self', operator: 'GTE', expected: 1 };
  const falseCond = { kind: 'STRUCTURED_CONDITION', type: 'LIFE_THRESHOLD', side: 'self', operator: 'GTE', expected: 99 };
  const unsupCond = 'If you banish the [Soul Core] on this Ultimate from the game';

  assert.equal(evaluateStructuredCondition(restored.state, { kind: 'STRUCTURED_CONDITION', type: 'COMPOUND', combinator: 'OR', conditions: [trueCond, unsupCond] }, ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(restored.state, { kind: 'STRUCTURED_CONDITION', type: 'COMPOUND', combinator: 'AND', conditions: [falseCond, unsupCond] }, ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(restored.state, { kind: 'STRUCTURED_CONDITION', type: 'COMPOUND', combinator: 'AND', conditions: [trueCond, unsupCond] }, ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(restored.state, { kind: 'STRUCTURED_CONDITION', type: 'COMPOUND', combinator: 'NOT', conditions: [unsupCond] }, ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(restored.state, { kind: 'STRUCTURED_CONDITION', type: 'COMPOUND', combinator: 'NOT', conditions: [falseCond] }, ctx).result, CONDITION_RESULT.TRUE);
});

// ---------------------------------------------------------------------------
// Section 6: Compiler Semantic Fidelity (no undefined AST properties)
// ---------------------------------------------------------------------------

test('WPC-4C6-COMP: compileCard produces RFC-8785-valid ASTs with zero undefined properties on DESTROY/EXHAUST', () => {
  const ir = compileCard({
    cardNumber: 'COMP-TEST-1',
    name: 'Compiler Fidelity Test',
    type: 'Spirit',
    cost: 4,
    color: 'Red',
    effect: '[When Summoned]\nDestroy 1 opposing Spirit with 3000 BP or less.\n[When Attacks]\nExhaust 1 opposing Spirit.'
  });
  assert.ok(ir.abilities.length >= 1);
  for (const ab of ir.abilities) {
    assert.ok(ab.physicalId.startsWith('COMP-TEST-1#'));
    for (const cl of ab.clauses) {
      if (cl.op && typeof cl.op === 'object') {
        for (const [k, v] of Object.entries(cl.op)) {
          assert.notEqual(v, undefined, `AST op property '${k}' must not be undefined`);
        }
      }
    }
  }
});
