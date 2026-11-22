import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createGameState, createFieldStack, getTotalPlayerCores } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';
import { moveCard } from '../engine/zones.js';
import {
  CONDITION_RESULT,
  CONDITION_TYPES,
  evaluateStructuredCondition,
  parseConditionToStructured
} from '../engine/conditions.js';
import {
  RESTRICTION_SPECIFICATIONS,
  computeEffectiveCharacteristics,
  computeEffectiveBP,
  isActionRestricted,
  isTargetProtectedFrom
} from '../engine/continuous.js';
import { runExhaustiveAudit } from '../scripts/audit_514_cards_exhaustive.mjs';

function makeCard(id, overrides = {}) {
  return {
    id,
    cardNumber: overrides.cardNumber || id.toUpperCase(),
    name: overrides.name || id,
    type: overrides.type || 'Spirit',
    color: overrides.color || 'Red',
    colors: overrides.colors || [overrides.color || 'Red'],
    symbols: overrides.symbols || [overrides.color || 'Red'],
    cost: overrides.cost ?? 3,
    bp: overrides.bp ?? 4000,
    levels: overrides.levels || { 1: { cost: 1, bp: overrides.bp ?? 4000 }, 2: { cost: 3, bp: (overrides.bp ?? 4000) + 3000 } },
    owner: overrides.owner || 'player',
    controller: overrides.controller || overrides.owner || 'player',
    ...overrides
  };
}

class DeterministicPromptResolver {
  async choose(prompt) {
    if (prompt.candidates && prompt.candidates.length > 0) {
      return [prompt.candidates[0]];
    }
    return [];
  }
}

// ============================================================================
// WORKSTREAM A5: TRI-STATE CONDITION INTEGRITY, FALLBACKS, TRUTH TABLES
// ============================================================================

test('WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics', () => {
  const fullState = createGameState();
  const srcCard = makeCard('fg2_src', { owner: 'player', bp: 6000, cost: 4 });
  const srcStack = createFieldStack(srcCard, { normal: 1 });
  srcStack.state = 'REFRESHED';
  srcStack.braves.push(makeCard('fg2_brv', { type: 'Brave' }));
  fullState.players.player.field.push(srcStack);
  fullState.players.player.grave.push(srcCard);
  fullState.players.player.trash = { normal: 0, soul: 0 };
  fullState.players.player.reserve = { normal: 2, soul: 0 };
  fullState.players.player.counterArea = { soul: 0 };

  // 1. Missing contexts must strictly return UNSUPPORTED (never FALSE)
  assert.equal(evaluateStructuredCondition({}, 'If this Spirit is in refreshed state', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit is in refreshed state', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit is in refreshed state', { controller: 'player', sourceStack: { id: 'no_state_field', top: srcCard } }).result, CONDITION_RESULT.UNSUPPORTED);

  assert.equal(evaluateStructuredCondition(fullState, 'While this Spirit is braved', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, 'If [Soul Core] is in your Counter Area', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);

  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit has 5000 BP or more', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit has 5000 BP or more', { controller: 'player', sourceCard: makeCard('no_bp', { bp: undefined }) }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, "If it's Cost 4", { previousTarget: { id: 'no_cost' } }).result, CONDITION_RESULT.UNSUPPORTED);

  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, 'If the [Soul Core] is in your Trash', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, 'If [Soul Core] is in your Reserve', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, 'If there are two or more cores in your Reserve', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, 'While all your Spirits are the "Galaxian" family', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, 'If there are three or more "Kamen" family cards in your Trash', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);

  assert.equal(evaluateStructuredCondition(fullState, 'If a Spirit is returned', {}).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, "If you've done so", {}).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, 'If that card is a Magic card', {}).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, "If that card's cost is an even number", { previousTarget: { id: 'nc', cost: null } }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, 'This card is in the Trash', {}).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({ players: { player: {} } }, 'This card is in the Trash', { sourceCard: srcCard }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({}, 'If it is blocked', {}).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition({}, 'If your Spirits attacked this turn', {}).result, CONDITION_RESULT.UNSUPPORTED);

  // 2. Contradictory context (sourceStack vs unrelated sourceCard) returns UNSUPPORTED
  const otherCard = makeCard('other_card', { owner: 'player' });
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit is in refreshed state', { controller: 'player', sourceStack: srcStack, sourceCard: otherCard }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, 'While this Spirit is braved', { controller: 'player', sourceStack: srcStack, sourceCard: otherCard }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit has 5000 BP or more', { controller: 'player', sourceStack: srcStack, sourceCard: otherCard }).result, CONDITION_RESULT.UNSUPPORTED);

  // 3. Authoritative fallback from state.players using sourceCard when sourceStack is omitted
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit is in refreshed state', { controller: 'player', sourceCard: srcCard }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit is in exhausted state', { controller: 'player', sourceCard: srcCard }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(fullState, 'While this Spirit is braved', { controller: 'player', sourceCard: srcCard }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(fullState, 'If this Spirit has 4000 BP or more', { controller: 'player', sourceCard: srcCard }).result, CONDITION_RESULT.TRUE);

  // 4. Valid present context with unmet predicate returns FALSE (never UNSUPPORTED)
  const emptyState = createGameState();
  assert.equal(evaluateStructuredCondition(emptyState, 'While all your Spirits are the "Galaxian" family', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(emptyState, 'If a Spirit is returned', { previousOpResult: { bouncedCount: 0 } }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(emptyState, 'If [Soul Core] is in your Reserve', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  emptyState.players.player.reserve.soul = 0;
  assert.equal(evaluateStructuredCondition(emptyState, 'If [Soul Core] is in your Reserve', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
});

test('WPFG2-TRISTATE-02: Complete 3x3 AND/OR and 3-row NOT truth tables with nested compounds', () => {
  const state = createGameState();
  state.players.player.life = 3;
  const ctx = { controller: 'player' };

  const T = parseConditionToStructured('If your life is 3 or less');
  const F = parseConditionToStructured('If your life is 2 or less');
  const U = parseConditionToStructured('If this Spirit is in refreshed state'); // Missing sourceStack in ctx -> UNSUPPORTED
  const mk = (combinator, conditions) => ({ kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator, conditions });

  // Assert base atoms
  assert.equal(evaluateStructuredCondition(state, T, ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, F, ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, U, ctx).result, CONDITION_RESULT.UNSUPPORTED);

  // 3x3 AND
  const expectedAnd = [
    ['TRUE', 'TRUE', 'TRUE'], ['TRUE', 'FALSE', 'FALSE'], ['TRUE', 'UNSUPPORTED', 'UNSUPPORTED'],
    ['FALSE', 'TRUE', 'FALSE'], ['FALSE', 'FALSE', 'FALSE'], ['FALSE', 'UNSUPPORTED', 'FALSE'],
    ['UNSUPPORTED', 'TRUE', 'UNSUPPORTED'], ['UNSUPPORTED', 'FALSE', 'FALSE'], ['UNSUPPORTED', 'UNSUPPORTED', 'UNSUPPORTED']
  ];
  const mapVal = { TRUE: T, FALSE: F, UNSUPPORTED: U };
  for (const [a, b, exp] of expectedAnd) {
    assert.equal(evaluateStructuredCondition(state, mk('AND', [mapVal[a], mapVal[b]]), ctx).result, exp, `${a} AND ${b}`);
  }

  // 3x3 OR
  const expectedOr = [
    ['TRUE', 'TRUE', 'TRUE'], ['TRUE', 'FALSE', 'TRUE'], ['TRUE', 'UNSUPPORTED', 'TRUE'],
    ['FALSE', 'TRUE', 'TRUE'], ['FALSE', 'FALSE', 'FALSE'], ['FALSE', 'UNSUPPORTED', 'UNSUPPORTED'],
    ['UNSUPPORTED', 'TRUE', 'TRUE'], ['UNSUPPORTED', 'FALSE', 'UNSUPPORTED'], ['UNSUPPORTED', 'UNSUPPORTED', 'UNSUPPORTED']
  ];
  for (const [a, b, exp] of expectedOr) {
    assert.equal(evaluateStructuredCondition(state, mk('OR', [mapVal[a], mapVal[b]]), ctx).result, exp, `${a} OR ${b}`);
  }

  // 3-row NOT
  assert.equal(evaluateStructuredCondition(state, mk('NOT', [T]), ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, mk('NOT', [F]), ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, mk('NOT', [U]), ctx).result, CONDITION_RESULT.UNSUPPORTED);

  // Nested compounds: (T AND F) OR U => U, NOT (F AND U) => NOT FALSE => TRUE
  assert.equal(evaluateStructuredCondition(state, mk('OR', [mk('AND', [T, F]), U]), ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(state, mk('NOT', [mk('AND', [F, U])]), ctx).result, CONDITION_RESULT.TRUE);
});

test('WPFG2-TRISTATE-03: AsyncResolver handles TRUE vs FALSE vs UNSUPPORTED without false mutations', async () => {
  const mkState = () => {
    const s = createGameState();
    s.players.player.deck.push(makeCard('d_res1'), makeCard('d_res2'));
    return s;
  };
  const ability = {
    id: 'ab_tri',
    clauses: [{ condition: 'If this Spirit is in refreshed state', op: { op: 'DRAW', count: 1 } }]
  };
  const events = new EventBus();
  const resolver = new AsyncResolver(new DeterministicPromptResolver(), events);

  // TRUE -> executes DRAW
  const sT = mkState();
  const stT = createFieldStack(makeCard('src_t'), { normal: 1 });
  stT.state = 'REFRESHED';
  sT.players.player.field.push(stT);
  const resT = await resolver.resolveAbility(sT, ability, { controller: 'player', sourceStack: stT, sourceCard: stT.top }, events);
  assert.equal(resT.success, true);
  assert.equal(resT.hasUnsupported, false);
  assert.equal(sT.players.player.hand.length, 1);

  // FALSE -> cleanly skips, 0 mutations
  const sF = mkState();
  const stF = createFieldStack(makeCard('src_f'), { normal: 1 });
  stF.state = 'EXHAUSTED';
  sF.players.player.field.push(stF);
  const resF = await resolver.resolveAbility(sF, ability, { controller: 'player', sourceStack: stF, sourceCard: stF.top }, events);
  assert.equal(resF.hasUnsupported, false);
  assert.equal(resF.results[0].skipped, true);
  assert.equal(resF.results[0].conditionResult, CONDITION_RESULT.FALSE);
  assert.equal(sF.players.player.hand.length, 0);

  // UNSUPPORTED (missing sourceStack & sourceCard) -> blocks execution, sets hasUnsupported: true, 0 mutations
  const sU = mkState();
  const resU = await resolver.resolveAbility(sU, ability, { controller: 'player' }, events);
  assert.equal(resU.success, false);
  assert.equal(resU.hasUnsupported, true);
  assert.equal(resU.results[0].conditionResult, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(sU.players.player.hand.length, 0);
  assert.equal(sU.players.player.deck.length, 2);
});

// ============================================================================
// WORKSTREAM B: RESTRICTION SPECIFICATIONS & DE-CONFLATION
// ============================================================================

test('WPFG2-RESTR-01: RESTRICTION_SPECIFICATIONS documents all 23 canonical categories with typed metadata', () => {
  const expectedCategories = [
    'CANNOT_ATTACK', 'CANNOT_BLOCK', 'CANNOT_ATTACK_OR_BLOCK', 'CANNOT_EXHAUST', 'CANNOT_REFRESH',
    'CANNOT_SUMMON', 'CANNOT_DEPLOY_NEXUS', 'CANNOT_USE_MAGIC', 'PREVENT_FLASH_HAND',
    'CANNOT_ACTIVATE_ABILITY', 'CANNOT_USE_ABILITY', 'CANNOT_ACTIVATE_BURST', 'CANNOT_SET_BURST',
    'CANNOT_MOVE', 'CANNOT_BE_MOVED', 'CANNOT_BE_TARGETED', 'CANNOT_BE_DESTROYED', 'CANNOT_BE_RETURNED',
    'CANNOT_DRAW', 'CANNOT_DISCARD', 'CANNOT_MILL', 'CANNOT_LOSE_LIFE', 'CANNOT_LOSE_CORES'
  ];
  for (const cat of expectedCategories) {
    const spec = RESTRICTION_SPECIFICATIONS[cat];
    assert.ok(spec, `Missing RESTRICTION_SPECIFICATIONS entry for ${cat}`);
    assert.equal(spec.category, cat);
    assert.equal(typeof spec.prohibitedAction, 'string');
    assert.ok(['STACK', 'CARD', 'PLAYER', 'ZONE'].includes(spec.scope));
    assert.equal(typeof spec.appliesToCosts, 'boolean');
    assert.equal(typeof spec.appliesToEffects, 'boolean');
    assert.ok(['VOLUNTARY_ONLY', 'FORCED_ONLY', 'BOTH'].includes(spec.voluntaryVsForced));
    assert.ok(['SELF', 'OPPONENT', 'BOTH'].includes(spec.affectedSide));
    assert.ok(Array.isArray(spec.timingWindows) && spec.timingWindows.length > 0);
    assert.equal(typeof spec.requiresSourceInZone, 'boolean');
    assert.equal(typeof spec.bypassableByUnpreventable, 'boolean');
  }
  assert.equal(Object.keys(RESTRICTION_SPECIFICATIONS).length, 23);
});

test('WPFG2-RESTR-02: CANNOT_ACTIVATE_ABILITY vs CANNOT_USE_ABILITY are strictly de-conflated', async () => {
  const game = createGame({ playerDeck: [], opponentDeck: [], strictRules: false });
  const state = game.state;
  const srcCard = makeCard('ab_unit', {
    owner: 'player',
    compiledIr: {
      abilities: [
        {
          id: 'ab_main_voluntary',
          header: { timing: 'MAIN', levels: [1, 2] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        },
        {
          id: 'ab_auto_trigger',
          header: { timing: 'WHEN_SUMMONS', levels: [1, 2] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  });
  const srcStack = createFieldStack(srcCard, { normal: 1 });
  state.players.player.field.push(srcStack);
  state.players.player.deck.push(makeCard('d_1'), makeCard('d_2'), makeCard('d_3'));
  state.step = 'MAIN';
  state.activePlayer = 'player';

  // 1. CANNOT_ACTIVATE_ABILITY blocks voluntary game.activateAbility, NOT automatic resolution
  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_ACTIVATE_ABILITY', side: 'player', duration: 'THIS_STEP' });
  const volBlocked = await game.activateAbility(srcCard.id, 'ab_main_voluntary', 'player');
  assert.equal(volBlocked.success, false);
  assert.equal(volBlocked.reason, 'ABILITY_ACTIVATION_RESTRICTED');
  assert.equal(isActionRestricted(state, 'CANNOT_USE_ABILITY', 'player', srcStack, { isVoluntaryActivation: false }), false);

  const autoRes = await game.resolver.resolveAbility(state, srcCard.compiledIr.abilities[1], {
    controller: 'player', sourceCard: srcCard, sourceStack: srcStack
  });
  assert.equal(autoRes.success, true, 'CANNOT_ACTIVATE_ABILITY must NOT block non-voluntary triggered resolution');
  assert.equal(state.players.player.hand.length, 1);

  // 2. Replace with CANNOT_USE_ABILITY -> blocks resolution even for already-triggered abilities, while initiation predicate stays distinct
  state.modifiers = [{ type: 'SET_RESTRICTION', restriction: 'CANNOT_USE_ABILITY', side: 'player', duration: 'THIS_STEP' }];
  assert.equal(isActionRestricted(state, 'CANNOT_ACTIVATE_ABILITY', 'player', srcStack), false, 'CANNOT_USE_ABILITY does not alias CANNOT_ACTIVATE_ABILITY unless explicitly flagged');
  const autoBlocked = await game.resolver.resolveAbility(state, srcCard.compiledIr.abilities[1], {
    controller: 'player', sourceCard: srcCard, sourceStack: srcStack
  });
  assert.equal(autoBlocked.success, false);
  assert.equal(autoBlocked.reason, 'ABILITY_RESTRICTED');
  assert.equal(state.players.player.hand.length, 1, 'No card drawn when CANNOT_USE_ABILITY blocks resolution');
});

test('WPFG2-RESTR-03: CANNOT_MOVE vs CANNOT_BE_MOVED vs CANNOT_BE_DESTROYED vs CANNOT_BE_RETURNED do not conflate', async () => {
  const game = createGame({ playerDeck: [], opponentDeck: [], strictRules: false });
  const state = game.state;
  const s1Card = makeCard('mv_unit_1', { owner: 'player' });
  const s2Card = makeCard('mv_unit_2', { owner: 'player' });
  const s3Card = makeCard('mv_unit_3', { owner: 'player' });
  const st1 = createFieldStack(s1Card, { normal: 2 });
  const st2 = createFieldStack(s2Card, { normal: 2 });
  const st3 = createFieldStack(s3Card, { normal: 2 });
  state.players.player.field.push(st1, st2, st3);
  state.players.player.hand.push(makeCard('h_mv', { owner: 'player' }));
  state.step = 'MAIN';
  state.activePlayer = 'player';

  // 1. CANNOT_MOVE blocks controller transferCore and MOVE_CARD, but does NOT protect st1 from moveCard('removed') or isTargetProtectedFrom('move')
  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_MOVE', side: 'player', duration: 'THIS_STEP' });
  const tcBlocked = await game.transferCore(1, { zone: 'field', side: 'player', stackId: st1.id }, { zone: 'reserve', side: 'player' }, 'player');
  assert.equal(tcBlocked.success, false);
  assert.equal(tcBlocked.reason, 'CORE_MOVE_RESTRICTED');
  const opBlocked = await executeOp(state, { op: 'MOVE_CARD', from: 'hand', to: 'grave' }, { controller: 'player' });
  assert.equal(opBlocked.reason, 'MOVE_RESTRICTED');
  assert.equal(isTargetProtectedFrom(state, st1, 'move', makeCard('opp', { owner: 'opponent' })), false, 'CANNOT_MOVE must not act as target CANNOT_BE_MOVED protection');
  assert.equal(await moveCard(state, s1Card, 'removed', 'player', { cause: 'effect', by: 'opponent' }), true, 'Opposing moveCard succeeds when only controller CANNOT_MOVE is active');

  // 2. CANNOT_BE_MOVED protects st2 from non-destroy/non-bounce move ('removed'), does NOT block controller transferCore, destroy, or bounce
  state.modifiers = [{ type: 'SET_RESTRICTION', restriction: 'CANNOT_BE_MOVED', side: 'player', targetStackId: st2.id, duration: 'THIS_STEP' }];
  assert.equal(isTargetProtectedFrom(state, st2, 'move', makeCard('opp', { owner: 'opponent' })), true);
  assert.equal(isTargetProtectedFrom(state, st2, 'destroy', makeCard('opp', { owner: 'opponent' })), false, 'CANNOT_BE_MOVED must not protect against destroy');
  assert.equal(isTargetProtectedFrom(state, st2, 'bounce', makeCard('opp', { owner: 'opponent' })), false, 'CANNOT_BE_MOVED must not protect against bounce');
  assert.equal(await moveCard(state, s2Card, 'removed', 'player', { cause: 'effect', by: 'opponent' }), false, 'CANNOT_BE_MOVED blocks effect relocation to removed');
  assert.equal((await game.transferCore(1, { zone: 'field', side: 'player', stackId: st2.id }, { zone: 'reserve', side: 'player' }, 'player')).success, true, 'CANNOT_BE_MOVED does not block voluntary core transfer');
  assert.equal(await moveCard(state, s2Card, 'hand', 'player', { cause: 'bounce', by: 'opponent' }), true, 'CANNOT_BE_MOVED does not block bounce (CANNOT_BE_RETURNED)');
  assert.equal(await moveCard(state, s3Card, 'grave', 'player', { cause: 'destroy', by: 'opponent' }), true, 'Destroy works cleanly');
});

// ============================================================================
// WORKSTREAM D: NEW DETERMINISTIC PARSER RULES (TRUE / FALSE / UNSUPPORTED)
// ============================================================================

test('WPFG2-PARSER-01: Expanded deterministic condition parser patterns evaluate TRUE, FALSE, and UNSUPPORTED accurately', () => {
  const state = createGameState();
  const sagaBrave = makeCard('saga_brv', { type: 'Brave', isSaga: true });
  const msBrave = makeCard('ms_brv', { type: 'Brave', family: 'MS', families: ['MS'], name: 'Full Frontal' });
  const stBraved = createFieldStack(makeCard('pw_sp', { owner: 'player', color: 'Green', cost: 4, family: 'Purgatory Wings', families: ['Purgatory Wings'] }), { normal: 1 }, [sagaBrave, msBrave]);
  stBraved.isAdvent = true;
  const stBraveForm = createFieldStack(makeCard('br_form', { owner: 'player', type: 'Brave', color: 'Green', family: 'Bladessom', families: ['Bladessom'], cost: 4 }), { normal: 1 });
  state.players.player.field.push(stBraved, stBraveForm);
  state.players.player.turnAttackCount = undefined;
  state.turnHistory.player.attacksDeclared = 2;
  state.battle = { attacker: createFieldStack(makeCard('en_atk', { owner: 'player', family: 'Enemy', families: ['Enemy'] }), { normal: 1 }), blocker: null };
  state.players.player.field.push(state.battle.attacker, createFieldStack(makeCard('ur', { owner: 'player', name: 'Ur-Dine', color: 'Green' }), { normal: 1 }));
  state.players.player.deck = [makeCard('dk1'), makeCard('dk2')];

  const ctx = { controller: 'player', sourceStack: stBraved, sourceCard: stBraved.top };

  // Brave requirements & Advent / Brave-form states
  assert.equal(evaluateStructuredCondition(state, 'while braved to a Saga Brave', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While braved to a "MS" family Brave', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While braved to an exactly-named "Full Frontal"', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While braved to a "Kamen" family Brave', ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, 'while braved to a Saga Brave', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(state, 'While this Spirit is [During Advent]', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While this Brave is in Spirit condition', { controller: 'player', sourceStack: stBraveForm }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While this Brave is in Spirit condition', ctx).result, CONDITION_RESULT.FALSE);

  // Turn attacks, deck count, named/saga control
  assert.equal(evaluateStructuredCondition(state, 'If your Spirits attacked this turn', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, "If you've made two or more attacks this turn", ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If this is the second or subsequent attack of the turn', ctx).result, CONDITION_RESULT.TRUE);
  state.turnHistory.player.attacksDeclared = 0;
  assert.equal(evaluateStructuredCondition(state, 'If your Spirits attacked this turn', ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, 'If you have ten or less cards in deck', ctx).result, CONDITION_RESULT.TRUE);

  assert.equal(evaluateStructuredCondition(state, 'While your "Enemy" family Spirits are battling', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If you control "Ur-Dine"', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While you control any Saga Brave', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If you control no Spirits other than Braves', ctx).result, CONDITION_RESULT.FALSE);

  // Multi-family / only-color / symbol threshold / card result
  const greenOnlyState = createGameState();
  greenOnlyState.players.player.field.push(
    createFieldStack(makeCard('g1', { color: 'Green', symbols: ['Green', 'Green'], family: 'Purgatory Wings' }), { normal: 1 }),
    createFieldStack(makeCard('g2', { color: 'Green', symbols: ['Green', 'Green'], family: 'Bladessom' }), { normal: 1 })
  );
  assert.equal(evaluateStructuredCondition(greenOnlyState, 'If all your Spirits have the "Purgatory Wings"/"Bladessom" family', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(greenOnlyState, 'While you have only Green Spirits/Nexuses on your field', ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(greenOnlyState, 'While you have only Red Spirits/Nexuses on your field', ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(greenOnlyState, 'If there are four or more Green symbols on your Field', ctx).result, CONDITION_RESULT.TRUE);

  assert.equal(evaluateStructuredCondition(state, 'if the discarded card has the "Dark Puce" family', { previousTarget: makeCard('dp', { family: 'Dark Puce' }) }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'if the discarded card has the "Dark Puce" family', {}).result, CONDITION_RESULT.UNSUPPORTED);
});

// ============================================================================
// WORKSTREAM E: CACHE INVALIDATION & PHYSICAL/SEMANTIC ISOLATION
// ============================================================================

test('WPFG2-CONT-01: computeEffectiveCharacteristics cache invalidates on WHILE_SOURCE_IN_ZONE departure and preserves physical isolation', () => {
  const state = createGameState();
  const auraSource = createFieldStack(makeCard('aura_src', { owner: 'player', bp: 2000 }), { normal: 1 });
  const targetA = createFieldStack(makeCard('target_a', { cardNumber: 'SAME-01', owner: 'player', bp: 4000, levels: { 1: { cost: 1, bp: 4000 } } }), { normal: 1 });
  const targetB = createFieldStack(makeCard('target_b', { cardNumber: 'SAME-01', owner: 'player', bp: 4000, levels: { 1: { cost: 1, bp: 4000 } } }), { normal: 1 });
  state.players.player.field.push(auraSource, targetA, targetB);

  state.modifiers.push({
    id: 'aura_while_on_field',
    type: 'BP_BUFF',
    amount: 3000,
    targetStackId: targetA.id,
    duration: 'WHILE_SOURCE_IN_ZONE',
    sourceCardId: auraSource.top.id,
    sourceZone: 'field'
  });

  // targetA gets buff, physical clone targetB stays at base BP
  assert.equal(computeEffectiveCharacteristics(state, targetA).effectiveBP, 7000);
  assert.equal(computeEffectiveCharacteristics(state, targetB).effectiveBP, 4000);

  // Source leaves field WITHOUT calling pruneExpiredModifiers first -> cache fingerprint MUST miss and drop buff
  state.players.player.field = state.players.player.field.filter(st => st.id !== auraSource.id);
  state.players.player.grave.push(auraSource.top);

  const afterDeparture = computeEffectiveCharacteristics(state, targetA);
  assert.equal(afterDeparture.effectiveBP, 4000, 'Cache must immediately invalidate when WHILE_SOURCE_IN_ZONE source leaves field');
});

// ============================================================================
// WORKSTREAM D1/D4: FULL 514-SHARD CONDITION INVENTORY RECONCILIATION
// ============================================================================

test('WPFG2-RECON-01: Exhaustive 514-shard condition inventory reconciles 4,940 instances with reduced parse failures', () => {
  const audit = runExhaustiveAudit({ writeFiles: false });
  const condInv = audit.conditions;
  assert.equal(condInv.totalConditionInstances, 4940, 'Total condition instances across 514 shards must remain exactly 4,940');
  assert.equal(condInv.reconciledWithAuthoritativeEnumerator, true);

  const parsedSum = Object.values(condInv.byStructuredType || {}).reduce((a, b) => a + b, 0);
  const evSum = Object.values(condInv.evidenceBreakdown || {}).reduce((a, b) => a + b, 0);
  assert.equal(parsedSum + (condInv.evidenceBreakdown.PARSE_FAILURE || 0), 4940);
  assert.equal(evSum, 4940);
  assert.ok(condInv.evidenceBreakdown.PARSE_FAILURE < 1290, `Expected PARSE_FAILURE < 1290 (F/G.1 baseline), got ${condInv.evidenceBreakdown.PARSE_FAILURE}`);
  assert.equal(audit.uniqueBaseCardNumbers, 14609);
  assert.equal(audit.totalAbilities, 36422);
  assert.equal(audit.totalClauses, 51734);
});
