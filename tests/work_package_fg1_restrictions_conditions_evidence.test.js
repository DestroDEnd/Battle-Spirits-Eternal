import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createGame } from '../engine/index.js';
import { createGameState, createFieldStack, getTotalPlayerCores } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';
import { FlowController } from '../engine/flow.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { resolveTargets } from '../engine/selectors.js';
import {
  CONDITION_RESULT,
  CONDITION_TYPES,
  evaluateStructuredCondition,
  parseConditionToStructured
} from '../engine/conditions.js';
import {
  computeEffectiveBP,
  computeLevel,
  computeColors,
  computeFamilies,
  computeSymbols,
  canAttack,
  canBlock,
  pruneExpiredModifiers,
  isActionRestricted,
  isTargetProtectedFrom
} from '../engine/continuous.js';
import { runExhaustiveAudit } from '../scripts/audit_514_cards_exhaustive.mjs';

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
    colors: overrides.colors || [overrides.color || 'Red'],
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
      const count = typeof prompt.count === 'number' ? prompt.count : 1;
      return prompt.candidates.slice(0, count);
    }
    return { index: 0 };
  }
}

// ============================================================================
// WORKSTREAM E1: COMPLETE CENTRALIZED RESTRICTION & IMMUNITY MATRIX (ALL 18)
// ============================================================================

test('WPFG1-RESTR-01: Combat, burst, draw, exhaust, refresh, and summon restrictions enforce legal/prohibited/side/duration/departure boundaries', async () => {
  const game = createGame({
    playerDeck: Array.from({ length: 40 }, (_, i) => makeUnit(`pd_${i}`)),
    opponentDeck: Array.from({ length: 40 }, (_, i) => makeUnit(`od_${i}`, { owner: 'opponent' })),
    strictRules: true,
    unsafeTestBypassDeckValidation: true
  });
  const state = game.state;
  const pSpirit = createFieldStack(makeUnit('r1_ps', { owner: 'player', bp: 5000, cost: 3 }), { normal: 2 });
  const oSpirit = createFieldStack(makeUnit('r1_os', { owner: 'opponent', bp: 4000, cost: 2 }), { normal: 2 });
  const srcLock = createFieldStack(makeUnit('r1_src', { owner: 'opponent', bp: 3000 }), { normal: 1 });
  state.players.player.field.push(pSpirit);
  state.players.opponent.field.push(oSpirit, srcLock);
  state.step = 'ATTACK';
  state.activePlayer = 'player';
  state.turnOwner = 'player';

  // 1. CANNOT_ATTACK + 2. CANNOT_BLOCK
  state.modifiers.push(
    { id: 'm_atk', type: 'SET_RESTRICTION', restriction: 'CANNOT_ATTACK', side: 'player', targetStackId: pSpirit.id, duration: 'WHILE_SOURCE_IN_ZONE', sourceCardId: srcLock.top.id, sourceZone: 'field' },
    { id: 'm_blk', type: 'SET_RESTRICTION', restriction: 'CANNOT_BLOCK', side: 'opponent', targetStackId: oSpirit.id, duration: 'THIS_TURN' }
  );
  assert.equal(canAttack(state, pSpirit), false);
  assert.equal(canAttack(state, oSpirit), true);
  assert.equal(canBlock(state, oSpirit), false);
  assert.equal((await game.declareAttack(pSpirit.id, 'player')).success, false);

  // Removing source clears WHILE_SOURCE_IN_ZONE attack lock cleanly
  state.players.opponent.field = [oSpirit];
  assert.equal(canAttack(state, pSpirit), true);
  assert.equal((await game.declareAttack(pSpirit.id, 'player')).success, true);
  assert.equal((await game.declareBlock(oSpirit.id, 'opponent')).reason, 'CANNOT_BLOCK');
  state.combat = null;

  // Expiration restores block permission
  pruneExpiredModifiers(state, 'TURN');
  assert.equal(canBlock(state, oSpirit), true);

  // 3. CANNOT_EXHAUST & 4. CANNOT_REFRESH & 5. CANNOT_DRAW & 6. CANNOT_ACTIVATE_BURST
  state.modifiers.push(
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_EXHAUST', side: 'player', targetStackId: pSpirit.id, duration: 'THIS_STEP' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_REFRESH', side: 'player', targetStackId: pSpirit.id, duration: 'THIS_STEP' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_DRAW', side: 'player', duration: 'THIS_STEP' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_ACTIVATE_BURST', side: 'player', duration: 'THIS_STEP' }
  );
  pSpirit.state = 'REFRESHED';
  assert.equal((await executeOp(state, { op: 'EXHAUST', target: 'self' }, { controller: 'player', sourceStack: pSpirit, sourceCard: pSpirit.top })).reason, 'EXHAUST_RESTRICTED');
  pSpirit.state = 'EXHAUSTED';
  assert.equal((await executeOp(state, { op: 'REFRESH', target: 'self' }, { controller: 'player', sourceStack: pSpirit, sourceCard: pSpirit.top })).reason, 'REFRESH_RESTRICTED');
  assert.equal((await executeOp(state, { op: 'DRAW', count: 1 }, { controller: 'player' })).reason, 'DRAW_RESTRICTED');
  assert.equal((await executeOp(state, { op: 'DRAW', count: 1, side: 'opp' }, { controller: 'player' })).success, true, 'Restriction on player does not block opponent draw');
  assert.equal((await executeOp(state, { op: 'ACTIVATE_BURST' }, { controller: 'player' })).reason, 'BURST_LOCKED');

  // 7. CANNOT_SUMMON blocks both game.playCard and free summons (SUMMON_FREE / executeSummonTransaction)
  pruneExpiredModifiers(state, 'STEP');
  state.step = 'MAIN';
  const hSpirit = makeUnit('r1_hs', { owner: 'player', cost: 1 });
  state.players.player.hand.push(hSpirit);
  state.players.player.reserve.normal = 5;
  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_SUMMON', side: 'player', duration: 'THIS_TURN' });
  assert.equal((await game.playCard(hSpirit.id, [], 'player')).reason, 'SUMMON_RESTRICTED');
  assert.equal((await executeOp(state, { op: 'SUMMON_FREE', from: 'HAND' }, { controller: 'player' }, new DeterministicPromptResolver())).reason, 'SUMMON_RESTRICTED');
  pruneExpiredModifiers(state, 'TURN');
  assert.equal((await game.playCard(hSpirit.id, [], 'player')).success, true);
});

test('WPFG1-RESTR-02: Ability, magic, move, discard, mill, life-loss, and core-loss restrictions enforce cost-vs-effect and unpreventable boundaries', async () => {
  const game = createGame({
    playerDeck: Array.from({ length: 40 }, (_, i) => makeUnit(`p2_${i}`)),
    opponentDeck: Array.from({ length: 40 }, (_, i) => makeUnit(`o2_${i}`, { owner: 'opponent' })),
    strictRules: false,
    unsafeTestBypassDeckValidation: true
  });
  const state = game.state;
  const pStack = createFieldStack(makeUnit('r2_ps', {
    owner: 'player',
    compiledIr: {
      abilities: [{ id: 'ab_main', header: { timing: 'MAIN', levels: [1] }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }]
    }
  }), { normal: 2 });
  state.players.player.field.push(pStack);
  state.step = 'MAIN';
  state.activePlayer = 'player';

  // 8 & 9. CANNOT_ACTIVATE_ABILITY / CANNOT_USE_ABILITY
  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_ACTIVATE_ABILITY', side: 'player', duration: 'THIS_STEP' });
  const abLocked = await game.activateAbility(pStack.top.id, 'ab_main', 'player');
  assert.equal(abLocked.success, false);
  assert.equal(abLocked.reason, 'ABILITY_ACTIVATION_RESTRICTED');

  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_USE_ABILITY', side: 'player', duration: 'THIS_STEP' });
  const resLocked = await game.resolver.resolveAbility(state, pStack.top.compiledIr.abilities[0], { controller: 'player', sourceCard: pStack.top, sourceStack: pStack });
  assert.equal(resLocked.reason, 'ABILITY_RESTRICTED');
  pruneExpiredModifiers(state, 'STEP');
  assert.equal((await game.activateAbility(pStack.top.id, 'ab_main', 'player')).success, true);

  // 10 & 11. CANNOT_MOVE & CANNOT_BE_MOVED
  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_MOVE', side: 'player', applyTo: 'EFFECT_ONLY', duration: 'THIS_STEP' });
  assert.equal((await game.transferCore(1, { zone: 'field', side: 'player', stackId: pStack.id }, { zone: 'reserve', side: 'player' }, 'player')).reason, 'CORE_MOVE_RESTRICTED');
  const hCard = makeUnit('r2_hc', { owner: 'player' });
  state.players.player.hand.push(hCard);
  assert.equal((await executeOp(state, { op: 'MOVE_CARD', from: 'hand', to: 'grave', isCost: true }, { controller: 'player' })).success, true, 'EFFECT_ONLY restriction must not block cost movement');

  state.modifiers.push({ type: 'SET_RESTRICTION', restriction: 'CANNOT_BE_MOVED', side: 'player', targetStackId: pStack.id, duration: 'THIS_STEP' });
  assert.equal(await moveCard(state, pStack.top, 'hand', 'player', { cause: 'effect', by: 'opponent' }), false);

  // 12 & 13. CANNOT_DISCARD & CANNOT_MILL
  state.players.player.hand.push(makeUnit('r2_d1'));
  state.modifiers.push(
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_DISCARD', side: 'player', applyTo: 'EFFECT_ONLY', duration: 'THIS_STEP' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_MILL', side: 'player', duration: 'THIS_STEP' }
  );
  assert.equal((await executeOp(state, { op: 'DISCARD', side: 'self', count: 1 }, { controller: 'player' })).reason, 'DISCARD_RESTRICTED');
  assert.equal((await executeOp(state, { op: 'DISCARD_COST', side: 'self', count: 1 }, { controller: 'player' })).success, true, 'EFFECT_ONLY discard lock permits cost discard');
  assert.equal((await executeOp(state, { op: 'MILL_DECK', side: 'self', count: 2 }, { controller: 'player' })).reason, 'MILL_RESTRICTED');

  // 14 & 15. CANNOT_LOSE_LIFE & CANNOT_LOSE_CORES (+ unpreventable bypass & cost permission)
  state.players.player.life = 5;
  state.modifiers.push(
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_LOSE_LIFE', side: 'player', duration: 'THIS_STEP' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_LOSE_CORES', side: 'player', targetStackId: pStack.id, duration: 'THIS_STEP' }
  );
  assert.equal(await moveCore(state, 1, { zone: 'life', side: 'player' }, { zone: 'reserve', side: 'player' }, { cause: 'effect_damage', by: 'opponent' }), false);
  assert.equal(await moveCore(state, 1, { zone: 'life', side: 'player' }, { zone: 'reserve', side: 'player' }, { cause: 'cost', by: 'player' }), true, 'Life pay cost bypasses opposing life-loss prevention');
  assert.equal(await moveCore(state, 1, { zone: 'life', side: 'player' }, { zone: 'reserve', side: 'player' }, { cause: 'effect_damage', by: 'opponent', unpreventable: true }), true, 'Unpreventable effect bypasses preventable CANNOT_LOSE_LIFE');
  assert.equal(await moveCore(state, 1, { zone: 'field', side: 'player', stackId: pStack.id }, { zone: 'trash', side: 'player' }, { cause: 'effect', by: 'opponent' }), false);
  assert.equal(await moveCore(state, 1, { zone: 'field', side: 'player', stackId: pStack.id }, { zone: 'trash', side: 'player' }, { cause: 'cost', by: 'player' }), true);
});

test('WPFG1-RESTR-03: Target protection (CANNOT_BE_TARGETED, CANNOT_BE_DESTROYED, CANNOT_BE_RETURNED), Armor, Immunity, and Replacement interactions', async () => {
  const state = createGameState();
  const srcRed = makeUnit('r3_src', { owner: 'player', color: 'Red' });
  const tgtProtected = createFieldStack(makeUnit('r3_prot', { owner: 'opponent', bp: 3000 }), { normal: 1 });
  const indest = createFieldStack(makeUnit('r3_ind', { owner: 'opponent', bp: 3000 }), { normal: 1 });
  const armored = createFieldStack(makeUnit('r3_arm', { owner: 'opponent', bp: 3000, keywords: [{ name: 'Armor', parameter: 'Red' }] }), { normal: 1 });
  const replaced = createFieldStack(makeUnit('r3_rep', { owner: 'opponent', bp: 3000 }), { normal: 1 });
  state.players.opponent.field.push(tgtProtected, indest, armored, replaced);

  state.modifiers.push(
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_BE_TARGETED', side: 'opponent', targetStackId: tgtProtected.id, duration: 'THIS_TURN' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_BE_DESTROYED', side: 'opponent', targetStackId: indest.id, duration: 'THIS_TURN' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_BE_RETURNED', side: 'opponent', targetStackId: indest.id, duration: 'THIS_TURN' },
    { type: 'REPLACEMENT_EFFECT', replaces: 'DESTRUCTION', side: 'opponent', targetFilter: { name: 'r3_rep' }, replacementZone: 'hand', duration: 'THIS_TURN' }
  );

  // Target selection excludes CANNOT_BE_TARGETED & Armor: Red against Red source
  const tgtRes = await resolveTargets(state, { side: 'opp', zone: 'field', types: ['Spirit'], all: true }, { controller: 'player', sourceCard: srcRed });
  const ids = tgtRes.cards.map(c => c.id);
  assert.equal(ids.includes('r3_prot'), false, 'CANNOT_BE_TARGETED excluded from candidates');
  assert.equal(ids.includes('r3_arm'), false, 'Armor: Red excluded against Red source');
  assert.equal(ids.includes('r3_ind'), true);

  // Even ignoreArmor does not bypass explicit CANNOT_BE_DESTROYED or CANNOT_BE_RETURNED
  assert.equal(await moveCard(state, indest.top, 'grave', 'opponent', { cause: 'destroy', by: 'player', sourceCard: srcRed, bypassArmor: true }), false);
  assert.equal(await moveCard(state, indest.top, 'hand', 'opponent', { cause: 'bounce', by: 'player', sourceCard: srcRed }), false);
  assert.equal(isActionRestricted(state, 'CANNOT_BE_TARGETED', 'opponent', tgtProtected, { sourceCard: srcRed }), true);
  assert.equal(isActionRestricted(state, 'CANNOT_BE_DESTROYED', 'opponent', indest, { sourceCard: srcRed }), true);
  assert.equal(isActionRestricted(state, 'CANNOT_BE_RETURNED', 'opponent', indest, { sourceCard: srcRed }), true);

  // Unpreventable cannot bypass explicit targeting/legality when target lacks legality
  assert.equal(isTargetProtectedFrom(state, armored, 'destroy', srcRed), true);
  assert.equal(isTargetProtectedFrom(state, armored, 'destroy', srcRed, { bypassArmor: true }), false);
});

// ============================================================================
// WORKSTREAM E2: CONDITION PARSER, EVALUATOR & COMPOUND TRUTH TABLE TESTS
// ============================================================================

test('WPFG1-COND-01: Extended condition types evaluate TRUE, FALSE, UNSUPPORTED, missing context, and boundaries', () => {
  const state = createGameState();
  const srcStack = createFieldStack(makeUnit('c1_src', { owner: 'player', family: ['Galaxian'], color: 'White', cost: 4 }), { normal: 1 });
  srcStack.state = 'REFRESHED';
  srcStack.braves.push(makeUnit('c1_brv', { owner: 'player', type: 'Brave' }));
  state.players.player.field.push(srcStack);
  state.players.player.counterArea = { soul: 1 };
  state.players.opponent.reserve = { normal: 2, soul: 0 };

  // RESERVE_CORE_THRESHOLD
  assert.equal(evaluateStructuredCondition(state, 'If there are two or more cores in the opposing Reserve', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If there are three or more cores in the opposing Reserve', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // STACK_STATE
  assert.equal(evaluateStructuredCondition(state, 'If this Spirit is in refreshed state', { controller: 'player', sourceStack: srcStack }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If this Spirit is in exhausted state', { controller: 'player', sourceStack: srcStack }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, 'If this Spirit is in refreshed state', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);

  // CARD_RESULT
  const resCard = makeUnit('c1_rc', { color: 'Yellow', type: 'Magic', family: 'Song', cost: 4 });
  assert.equal(evaluateStructuredCondition(state, 'If that card is a Magic card', { previousTarget: resCard }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If that card is a Magic card', { previousTarget: makeUnit('not_magic', { type: 'Spirit' }) }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, "If that card's cost is an even number", { previousTarget: resCard }).result, CONDITION_RESULT.TRUE);

  // FIELD_COMPOSITION
  assert.equal(evaluateStructuredCondition(state, 'While all your Spirits are the "Galaxian" family', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.players.player.field.push(createFieldStack(makeUnit('c1_other', { owner: 'player', family: ['Dragon'] }), { normal: 1 }));
  assert.equal(evaluateStructuredCondition(state, 'While all your Spirits are the "Galaxian" family', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // BRAVE_STACK_STATE
  assert.equal(evaluateStructuredCondition(state, 'While this Spirit is braved', { controller: 'player', sourceStack: srcStack }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If [Soul Core] is in your Counter Area', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // PREVIOUS_OP_SUCCESS
  assert.equal(evaluateStructuredCondition(state, 'If a Spirit is returned', { previousOpResult: { bouncedCount: 1 } }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If a Spirit is returned', { previousOpResult: { bouncedCount: 0 } }).result, CONDITION_RESULT.FALSE);

  // Ambiguous / unsupported string always fails closed as UNSUPPORTED
  assert.equal(evaluateStructuredCondition(state, 'If you control any hypothetical unknown mechanic', { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
});

test('WPFG1-COND-02: Attacking/Blocking, Zone Count, Stat Threshold, and Soul Core Location conditions evaluate accurately', () => {
  const state = createGameState();
  const atk = createFieldStack(makeUnit('c2_atk', { owner: 'player', family: ['Soldier'], color: 'Red', bp: 10000, cost: 6 }), { normal: 1 });
  state.players.player.field.push(atk);
  state.players.player.grave.push(
    makeUnit('g1', { family: ['Kamen'], color: 'Purple' }),
    makeUnit('g2', { family: ['Kamen'], color: 'Purple' }),
    makeUnit('g3', { family: ['Kamen'], color: 'Purple' })
  );
  state.players.player.reserve = { normal: 0, soul: 0 };
  state.players.player.trash = { normal: 1, soul: 1 };
  state.battle = { attacker: atk, blocker: null };

  // ATTACKING_OR_BLOCKING_SPIRIT
  assert.equal(evaluateStructuredCondition(state, 'While your "Soldier" family Spirit is attacking', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While your Green Spirit is attacking', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, 'If it is blocked', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // ZONE_CARD_COUNT
  assert.equal(evaluateStructuredCondition(state, 'If there are three or more "Kamen" family cards in your Trash', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If every card in your Trash has "Kamen" family', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If there are four or more "Kamen" family cards in your Trash', { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // SPIRIT_STAT_THRESHOLD (respects continuous BP buffs)
  assert.equal(evaluateStructuredCondition(state, 'If this Spirit has 10000 BP or more', { controller: 'player', sourceStack: atk }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If this Spirit has 3000 BP or less', { controller: 'player', sourceStack: atk }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, "If it's Cost 2/4/6/8", { previousTarget: atk }).result, CONDITION_RESULT.TRUE);

  // SOUL_CORE_LOCATION
  assert.equal(evaluateStructuredCondition(state, 'If the [Soul Core] is in your Trash', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If [Soul Core] is in your Reserve', { controller: 'player' }).result, CONDITION_RESULT.FALSE);
});

test('WPFG1-COND-03: Compound AND / OR / NOT tri-state truth table strictly follows Kleene logic', () => {
  const state = createGameState();
  state.players.player.life = 3;
  const ctx = { controller: 'player' };
  const T = 'If your life is 3 or less';
  const F = 'If your life is 2 or less';
  const U = 'If you control any completely unknown condition';

  const tAst = parseConditionToStructured(T);
  const fAst = parseConditionToStructured(F);
  const uAst = { kind: 'STRUCTURED_CONDITION', type: 'UNKNOWN_COND_FOR_TRISTATE' };

  assert.equal(evaluateStructuredCondition(state, `${T} and ${T}`, ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, `${T} and ${F}`, ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, `${T} and ${U}`, ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(state, `${F} and ${U}`, ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(state, { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'AND', conditions: [fAst, uAst] }, ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'AND', conditions: [tAst, uAst] }, ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(state, { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'OR', conditions: [tAst, uAst] }, ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'OR', conditions: [fAst, uAst] }, ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(state, `${F} or ${F}`, ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, `not ${T}`, ctx).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, `not ${F}`, ctx).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, `not ${U}`, ctx).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(state, { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.COMPOUND, combinator: 'NOT', conditions: [uAst] }, ctx).result, CONDITION_RESULT.UNSUPPORTED);
});

// ============================================================================
// WORKSTREAM E3: CONTINUOUS EFFECTS & LIFECYCLE TESTS
// ============================================================================

test('WPFG1-CONT-01: Continuous modifiers preserve printed card data, recalculate deterministically, and prune cleanly on departure/expiration', () => {
  const state = createGameState();
  const card = makeUnit('cont_u', {
    owner: 'player',
    color: 'Red',
    colors: ['Red'],
    family: 'Dragon',
    families: ['Dragon'],
    bp: 4000,
    levels: { 1: { cost: 1, bp: 4000 }, 2: { cost: 3, bp: 7000 } }
  });
  const stack = createFieldStack(card, { normal: 1, soul: 0 });
  const src = createFieldStack(makeUnit('cont_src', { owner: 'player' }), { normal: 1 });
  state.players.player.field.push(stack, src);

  state.modifiers.push(
    { id: 'm1', type: 'SET_LEVEL', targetStackId: stack.id, setLevel: 2, duration: 'THIS_STEP' },
    { id: 'm2', type: 'BP_BUFF', targetStackId: stack.id, amount: 2500, duration: 'WHILE_SOURCE_IN_ZONE', sourceCardId: src.top.id, sourceZone: 'field' },
    { id: 'm3', type: 'ADD_COLOR', targetStackId: stack.id, color: 'Blue', duration: 'THIS_TURN' },
    { id: 'm4', type: 'GRANT_FAMILY', targetStackId: stack.id, family: 'Astral', duration: 'THIS_TURN' }
  );

  assert.equal(computeLevel(stack, state), 2);
  assert.equal(computeEffectiveBP(state, stack), 9500);
  assert.equal(computeEffectiveBP(stack, state), 9500, 'Argument-order tolerant computeEffectiveBP');
  assert.ok(computeColors(state, stack).includes('Blue'));
  assert.ok(computeFamilies(state, stack).includes('Astral'));

  // Printed card fields never mutated
  assert.deepEqual(card.colors, ['Red']);
  assert.deepEqual(card.families, ['Dragon']);
  assert.equal(card.bp, 4000);

  // Source departure drops m2, STEP clears m1, TURN clears m3 & m4
  state.players.player.field = [stack];
  pruneExpiredModifiers(state, 'SOURCE_DEPARTURE');
  assert.equal(computeEffectiveBP(state, stack), 7000);
  pruneExpiredModifiers(state, 'STEP');
  assert.equal(computeEffectiveBP(state, stack), 4000);
  pruneExpiredModifiers(state, 'TURN');
  assert.deepEqual(computeColors(state, stack), ['Red']);
});

// ============================================================================
// WORKSTREAM D1: AUTOMATED CONDITION INVENTORY RECONCILIATION TEST
// ============================================================================

test('WPFG1-RECON-01: Condition inventories reconcile strictly across enumerator, locations, AST types, and evidence breakdown', () => {
  const summary = runExhaustiveAudit();
  const invPath = path.resolve('reports/work_package_fg/fg_subsystem_inventories.json');
  const fgInv = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  assert.equal(summary.shards, 514);
  assert.equal(summary.uniqueBaseCardNumbers, 14609);
  assert.equal(summary.totalAbilities, 36422);
  assert.equal(summary.conditions.totalConditionInstances, 4940);
  assert.equal(summary.conditions.reconciledWithAuthoritativeEnumerator, true);

  const locSum = summary.conditions.byLocation['header.condition'] +
    summary.conditions.byLocation['clause.condition'] +
    summary.conditions.byLocation['clause.op.condition'];
  assert.equal(locSum, 4940, 'Location totals must reconcile to 4940');

  const evSum = Object.values(summary.conditions.evidenceBreakdown).reduce((a, b) => a + b, 0);
  assert.equal(evSum, 4940, 'Evidence breakdown totals must reconcile to 4940');

  const astSum = Object.values(summary.conditions.byStructuredType).reduce((a, b) => a + b, 0);
  assert.equal(astSum + summary.conditions.evidenceBreakdown.PARSE_FAILURE, 4940, 'Parsed AST types + PARSE_FAILURE must reconcile to 4940');

  assert.equal(fgInv.conditions.parseFailureCount, summary.conditions.evidenceBreakdown.PARSE_FAILURE, 'fg_subsystem_inventories parseFailureCount must equal PARSE_FAILURE');
  assert.equal(fgInv.conditions.reconciledTotalCheck, true);
  assert.equal(fgInv.conditions.reconciledEvidenceCheck, true);
  assert.ok(summary.conditions.evidenceBreakdown.PARSE_FAILURE <= 1290, `Expected PARSE_FAILURE <= 1290, got ${summary.conditions.evidenceBreakdown.PARSE_FAILURE}`);
});

// ============================================================================
// WORKSTREAM E4: 45 REAL-CARD END-TO-END SEMANTIC CASES FROM IR SHARDS
// ============================================================================

const REAL_FG1_CASES = [
  // Restrictions (10)
  { sf: 'BS01.json', cn: 'BATTLE-SPIRITS-A170', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.restriction === 'CANNOT_BLOCK' && m.sourceCardId === src.top.id);
    assert.ok(mod, 'CANNOT_BLOCK modifier must exist with sourceCardId');
    assert.equal(mod.type, 'SET_RESTRICTION');
    assert.equal(mod.side, 'opponent');
    const oppStack = createFieldStack(makeUnit('opp_blk', { owner: 'opponent' }), { normal: 1 });
    assert.equal(canBlock(state, oppStack), false);
    assert.equal(canAttack(state, oppStack), true, 'CANNOT_BLOCK must not block attacks');
    assert.equal(canBlock(state, src), true, 'opponent CANNOT_BLOCK must not restrict player');
  } },
  { sf: 'BS01.json', cn: 'BS01-143', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.restriction === 'PREVENT_FLASH_HAND' && m.sourceCardId === src.top.id);
    assert.ok(mod);
    assert.equal(mod.side, 'opponent');
    assert.equal(mod.duration, 'THIS_BATTLE');
    assert.equal(isActionRestricted(state, 'PREVENT_FLASH_HAND', 'opponent'), true);
    assert.equal(isActionRestricted(state, 'PREVENT_FLASH_HAND', 'player'), false);
  } },
  { sf: 'BS01.json', cn: 'BS01-016', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.restriction === 'CANNOT_BLOCK' && m.targetStackId === src.id);
    assert.ok(mod);
    assert.equal(canBlock(state, src), false);
    assert.equal(canAttack(state, src), true);
  } },
  { sf: 'BS01.json', cn: 'BS01-003', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    assert.ok(state.modifiers.some(m => m.restriction === 'CANNOT_BLOCK' && m.targetStackId === src.id));
    assert.equal(canBlock(state, src), false);
    assert.equal(canAttack(state, src), true);
  } },
  { sf: 'BS01.json', cn: 'BS01-012', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    assert.ok(state.modifiers.some(m => m.restriction === 'CANNOT_BLOCK' && m.targetStackId === src.id));
    assert.equal(canBlock(state, src), false);
    assert.equal(canAttack(state, src), true);
  } },
  { sf: 'BS01.json', cn: 'BS01-009', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    assert.ok(state.modifiers.some(m => m.restriction === 'CANNOT_BLOCK' && m.targetStackId === src.id));
    assert.equal(canBlock(state, src), false);
    assert.equal(canAttack(state, src), true);
  } },
  { sf: 'BS02.json', cn: 'BS02-110', kind: 'restr', setup: () => {}, verify: (state, res) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.restriction === 'CANNOT_ATTACK_NOR_BLOCK');
    assert.ok(mod);
    assert.equal(mod.maxCost, 1);
    assert.equal(mod.duration, 'DURING_THIS_TURN');
    const lowCost = createFieldStack(makeUnit('lc', { owner: 'opponent', cost: 1 }), { normal: 1 });
    const highCost = createFieldStack(makeUnit('hc', { owner: 'opponent', cost: 4 }), { normal: 1 });
    assert.equal(canAttack(state, lowCost), false);
    assert.equal(canBlock(state, lowCost), false);
    assert.equal(canAttack(state, highCost), true);
    assert.equal(canBlock(state, highCost), true);
  } },
  { sf: 'BS02.json', cn: 'BATTLE-SPIRITS-A969', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.restriction === 'CANNOT_REFRESH' && m.targetStackId === src.id);
    assert.ok(mod);
    assert.equal(isActionRestricted(state, 'CANNOT_REFRESH', 'player', src), true);
    assert.equal(canAttack(state, src), true);
  } },
  { sf: 'BS02.json', cn: 'BS03-014', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    assert.ok(state.modifiers.some(m => m.restriction === 'CANNOT_BLOCK' && m.targetStackId === src.id));
    assert.equal(canBlock(state, src), false);
    assert.equal(canAttack(state, src), true);
  } },
  { sf: 'BS02.json', cn: 'BS02-038', kind: 'restr', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    assert.ok(state.modifiers.some(m => m.restriction === 'CANNOT_ATTACK' && m.targetStackId === src.id));
    assert.equal(canAttack(state, src), false);
    assert.equal(canBlock(state, src), true);
  } },

  // Immunity / Protection (8)
  { sf: 'BS02.json', cn: 'BS02-040', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'IMMUNITY' && m.targetStackId === src.id);
    assert.ok(mod && mod.side === 'player' && mod.sourceCardId === src.top.id);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } },
  { sf: 'BS04.json', cn: 'BS04-043', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'IMMUNITY' && m.targetStackId === src.id);
    assert.ok(mod && mod.side === 'player' && mod.sourceCardId === src.top.id);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } },
  { sf: 'BS05.json', cn: 'BATTLE-SPIRITS-A188', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'IMMUNITY' && m.targetStackId === src.id);
    assert.ok(mod && mod.side === 'player' && mod.sourceCardId === src.top.id);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } },
  { sf: 'BS05.json', cn: 'BS05-051', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'INDESTRUCTIBLE' && m.sourceCardId === src.top.id);
    assert.ok(mod);
    assert.equal(isTargetProtectedFrom(state, src, 'destroy', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'bounce', makeUnit('o', { owner: 'opponent' })), false);
  } },
  { sf: 'BS06.json', cn: 'BS06-X24', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'IMMUNITY' && m.targetStackId === src.id);
    assert.ok(mod && mod.side === 'player' && mod.sourceCardId === src.top.id);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } },
  { sf: 'BS06.json', cn: 'BS06-044', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'IMMUNITY' && m.targetStackId === src.id);
    assert.ok(mod && mod.side === 'player' && mod.sourceCardId === src.top.id);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } },
  { sf: 'BS10.json', cn: 'BS10-108', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'IMMUNITY' && m.targetStackId === src.id);
    assert.ok(mod && mod.side === 'player' && mod.sourceCardId === src.top.id);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } },
  { sf: 'BS11.json', cn: 'BS11-027', kind: 'imm', setup: () => {}, verify: (state, res, src) => {
    assert.equal(res.success, true);
    const mod = state.modifiers.find(m => m.type === 'IMMUNITY' && m.targetStackId === src.id);
    assert.ok(mod && mod.side === 'player' && mod.sourceCardId === src.top.id);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(state, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } },

  // Continuous Modifiers (10)
  { sf: '26RBS01.json', cn: '26RBS01-086', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 1000);
    assert.equal(mod.duration, 'THIS_TURN');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 1000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-051', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 1000);
    assert.equal(mod.duration, 'DURING_THIS_BATTLE');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 1000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-060', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 1000);
    assert.equal(mod.duration, 'DURING_THIS_BATTLE');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 1000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-020', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 2000);
    assert.equal(mod.duration, 'THIS_TURN');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 2000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-054', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 1000);
    assert.equal(mod.duration, 'DURING_THIS_BATTLE');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 1000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-032', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 2000);
    assert.equal(mod.duration, 'THIS_TURN');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 2000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-012', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 3000);
    assert.equal(mod.duration, 'DURING_THIS_BATTLE');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 3000);
  } },
  { sf: 'BS19.json', cn: 'BS19-109', kind: 'mod', setup: (s, src, ctx) => {
    const opp = createFieldStack(makeUnit('opp19', { owner: 'opponent', bp: 5000 }), { normal: 1 });
    s.players.opponent.field.push(opp);
    ctx.previousTarget = opp.top;
  }, verify: (s, res, src) => {
    assert.equal(res.success, true);
    const opp = s.players.opponent.field[0];
    const mod = s.modifiers.find(m => m.type === 'BP_DEBUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 3000);
    assert.equal(mod.duration, 'DURING_THIS_TURN');
    assert.equal(mod.targetStackId, opp.id);
    assert.equal(computeEffectiveBP(s, opp), 2000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-056', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 1000);
    assert.equal(mod.duration, 'DURING_THIS_BATTLE');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 1000);
  } },
  { sf: '26RBS01.json', cn: '26RBS01-061', kind: 'mod', setup: (s, src, ctx) => { ctx.previousTarget = src; ctx._bpBefore = computeEffectiveBP(s, src); }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 2000);
    assert.equal(mod.duration, 'DURING_THIS_BATTLE');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 2000);
  } },

  // Controlled-Card Conditions (10)
  { sf: '26RBS01.json', cn: '26RBS01-085', kind: 'cond_ctrl', setup: (s, src, ctx) => {
    for (let i = 0; i < 3; i++) s.players.player.field.push(createFieldStack(makeUnit(`bn_${i}`, { owner: 'player', type: 'Nexus', color: 'Blue' }), { normal: 1 }));
    ctx.previousTarget = src;
    ctx._bpBefore = computeEffectiveBP(s, src);
  }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 3000);
    assert.equal(mod.duration, 'THIS_TURN');
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 3000);
  } },
  { sf: '26RSD06.json', cn: '26RSD06-010', kind: 'cond_ctrl', setup: (s, src, ctx) => {
    for (let i = 0; i < 3; i++) s.players.player.field.push(createFieldStack(makeUnit(`bn6_${i}`, { owner: 'player', type: 'Nexus', color: 'Blue' }), { normal: 1 }));
    ctx._symBefore = computeSymbols(s, src).length;
  }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'ADD_SYMBOL' && m.sourceCardId === src.top.id);
    assert.equal(mod.count, 1);
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeSymbols(s, src).length, ctx._symBefore + 1);
  } },
  { sf: '26RSD07.json', cn: '26RSD07-011', kind: 'cond_ctrl', setup: (s, src, ctx) => {
    const z = createFieldStack(makeUnit('zeztz', { owner: 'player', family: 'ZEZTZ', families: ['ZEZTZ'] }), { normal: 1 });
    z.state = 'EXHAUSTED';
    s.players.player.field.push(z);
    ctx._symBefore = computeSymbols(s, src).length;
  }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'ADD_SYMBOL' && m.sourceCardId === src.top.id);
    assert.equal(mod.count, 1);
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeSymbols(s, src).length, ctx._symBefore + 1);
  } },
  { sf: '26RSD09.json', cn: '26RSD09-003', kind: 'cond_ctrl', setup: (s) => {
    s.players.player.field.push(createFieldStack(makeUnit('pw', { owner: 'player', family: 'Purgatory Wings', families: ['Purgatory Wings'] }), { normal: 1 }));
    s.players.player.deck.push(makeUnit('d_pw'));
  }, verify: (s, res) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(s.players.player.deck.length, 0);
    assert.equal(s.players.player.hand.length, 1);
    assert.equal(s.players.player.hand[0].id, 'd_pw');
  } },
  { sf: 'BS03.json', cn: 'BATTLE-SPIRITS-A5242', kind: 'cond_ctrl', setup: (s) => {
    s.players.player.field.push(createFieldStack(makeUnit('purp', { owner: 'player', color: 'Purple' }), { normal: 1 }));
    s.players.player.deck.push(makeUnit('d_a5242'));
  }, verify: (s, res) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(s.players.player.deck.length, 0);
    assert.equal(s.players.player.hand.length, 1);
    assert.equal(s.players.player.hand[0].id, 'd_a5242');
  } },
  { sf: 'BS60.json', cn: 'BS60-067', kind: 'cond_ctrl', setup: (s) => {
    s.players.player.field.push(createFieldStack(makeUnit('bn60', { owner: 'player', type: 'Nexus', color: 'Blue' }), { normal: 1 }));
    s.players.player.voidCores = { normal: 3, soul: 0 };
  }, verify: (s, res) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(res.results[0].coresMoved, 1);
    assert.equal(s.players.player.reserve.normal, 3);
    assert.equal(s.players.player.reserve.soul, 1);
  } },
  { sf: 'CB02.json', cn: 'CB02-063', kind: 'cond_ctrl', setup: (s) => {
    s.players.player.field.push(createFieldStack(makeUnit('rk', { owner: 'player', family: 'Rookie', families: ['Rookie'] }), { normal: 1 }));
    s.players.player.deck.push(makeUnit('d_cb02'));
  }, verify: (s, res) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(s.players.player.deck.length, 0);
    assert.equal(s.players.player.hand.length, 1);
    assert.equal(s.players.player.hand[0].id, 'd_cb02');
  } },
  { sf: 'CB25.json', cn: 'CB25-021', kind: 'cond_ctrl', setup: (s) => {
    for (let i = 0; i < 3; i++) s.players.player.field.push(createFieldStack(makeUnit(`fl_${i}`, { owner: 'player', family: 'Flash', families: ['Flash'] }), { normal: 1 }));
    s.players.player.deck.push(makeUnit('d_cb25'));
  }, verify: (s, res) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(s.players.player.deck.length, 0);
    assert.equal(s.players.player.hand.length, 1);
    assert.equal(s.players.player.hand[0].id, 'd_cb25');
  } },
  { sf: 'KERORO.json', cn: 'BATTLE-SPIRITS-A6049', kind: 'cond_ctrl', setup: (s, src, ctx) => {
    const wd1 = createFieldStack(makeUnit('wd1', { owner: 'player', family: 'Winged Dragon', families: ['Winged Dragon'] }), { normal: 1 });
    const wd2 = createFieldStack(makeUnit('wd2', { owner: 'player', family: 'Winged Dragon', families: ['Winged Dragon'] }), { normal: 1 });
    s.players.player.field.push(wd1, wd2);
    ctx.previousTarget = src;
    ctx._bpById = { [src.id]: computeEffectiveBP(s, src), [wd1.id]: computeEffectiveBP(s, wd1), [wd2.id]: computeEffectiveBP(s, wd2) };
  }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 1000);
    assert.equal(mod.duration, 'THIS_TURN');
    const buffed = s.players.player.field.find(st => st.id === mod.targetStackId);
    assert.ok(buffed);
    assert.equal(computeEffectiveBP(s, buffed), ctx._bpById[buffed.id] + 1000);
  } },
  { sf: 'MISC.json', cn: 'BATTLE-SPIRITS-A4734', kind: 'cond_ctrl', setup: (s, src, ctx) => {
    const sb1 = createFieldStack(makeUnit('sb1', { owner: 'player', family: 'Song Bird', families: ['Song Bird'] }), { normal: 1 });
    s.players.player.field.push(sb1);
    ctx.previousTarget = src;
    ctx._bpById = { [src.id]: computeEffectiveBP(s, src), [sb1.id]: computeEffectiveBP(s, sb1) };
  }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 2000);
    assert.equal(mod.duration, 'THIS_TURN');
    const buffed = s.players.player.field.find(st => st.id === mod.targetStackId);
    assert.ok(buffed);
    assert.equal(computeEffectiveBP(s, buffed), ctx._bpById[buffed.id] + 2000);
  } },

  // Zone / Stat / Attacking Conditions (7)
  { sf: '26RBS03.json', cn: '26RBS03-035', kind: 'cond_stat', setup: (s, src, ctx) => {
    src.state = 'REFRESHED';
    ctx._bpBefore = computeEffectiveBP(s, src);
  }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 2000);
    assert.equal(mod.targetStackId, src.id);
    assert.equal(computeEffectiveBP(s, src), ctx._bpBefore + 2000);
  } },
  { sf: 'BS07.json', cn: 'BS07-083', kind: 'cond_atk', setup: (s) => {
    const sol = createFieldStack(makeUnit('sol', { owner: 'player', family: 'Soldier', families: ['Soldier'] }), { normal: 1 });
    s.players.player.field.push(sol);
    s.battle = { attacker: sol, blocker: null };
  }, verify: (s, res, src) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.restriction === 'PREVENT_FLASH_HAND' && m.sourceCardId === src.top.id);
    assert.ok(mod);
    assert.equal(mod.side, 'opponent');
    assert.equal(mod.duration, 'DURING_THIS_TURN');
    assert.equal(isActionRestricted(s, 'PREVENT_FLASH_HAND', 'opponent'), true);
    assert.equal(isActionRestricted(s, 'PREVENT_FLASH_HAND', 'player'), false);
  } },
  { sf: 'BS34.json', cn: 'BS34-062', kind: 'cond_zone', setup: (s) => {
    for (let i = 0; i < 10; i++) s.players.player.grave.push(makeUnit(`t34_${i}`));
    s.players.player.deck.push(makeUnit('d34'));
  }, verify: (s, res) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(s.players.player.deck.length, 0);
    assert.equal(s.players.player.hand.length, 1);
    assert.equal(s.players.player.hand[0].id, 'd34');
  } },
  { sf: 'BS35.json', cn: 'BS35-X02', kind: 'cond_atk', setup: (s) => {
    const brv = createFieldStack(makeUnit('bs', { owner: 'player' }), { normal: 1 });
    brv.braves.push(makeUnit('br35', { type: 'Brave' }));
    s.players.player.field.push(brv);
    s.battle = { attacker: brv, blocker: null };
    s.players.player.voidCores = { normal: 2, soul: 0 };
  }, verify: (s, res) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(res.results[0].coresMoved, 1);
    assert.equal(s.players.player.reserve.normal, 3);
    assert.equal(s.players.player.reserve.soul, 1);
  } },
  { sf: 'CB14.json', cn: 'CB14-X06', kind: 'cond_zone', setup: (s) => {
    for (let i = 0; i < 3; i++) s.players.player.grave.push(makeUnit(`ss_${i}`, { family: 'Stage Style', families: ['Stage Style'] }));
    s.players.player.voidCores = { normal: 3, soul: 0 };
  }, verify: (s, res, src) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    assert.equal(res.results[0].coresMoved, 2);
    assert.equal(src.cores.normal, 4);
    assert.equal(s.players.player.voidCores.normal, 1);
  } },
  { sf: 'CB22.json', cn: 'CB22-016', kind: 'cond_atk', setup: (s, src, ctx) => {
    const en = createFieldStack(makeUnit('en22', { owner: 'player', family: 'Enemy', families: ['Enemy'], bp: 2000 }), { normal: 1 });
    s.players.player.field.push(en);
    s.battle = { attacker: en, blocker: null };
    ctx._bpBeforeSrc = computeEffectiveBP(s, src);
    ctx._bpBeforeEn = computeEffectiveBP(s, en);
  }, verify: (s, res, src, ctx) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'BP_BUFF' && m.sourceCardId === src.top.id);
    assert.equal(mod.amount, 3000);
    assert.equal(mod.duration, 'THIS_TURN');
    const buffed = s.players.player.field.find(st => st.id === mod.targetStackId);
    assert.ok(buffed);
    const expectedBefore = buffed.id === src.id ? ctx._bpBeforeSrc : ctx._bpBeforeEn;
    assert.equal(computeEffectiveBP(s, buffed), expectedBefore + 3000);
  } },
  { sf: 'CB31.json', cn: 'CB31-003', kind: 'cond_zone', setup: (s) => {
    for (let i = 0; i < 3; i++) s.players.player.grave.push(makeUnit(`km_${i}`, { family: 'Kamen', families: ['Kamen'] }));
  }, verify: (s, res, src) => {
    assert.equal(res.success, true);
    assert.notEqual(res.results[0].skipped, true);
    const mod = s.modifiers.find(m => m.type === 'IMMUNITY' && m.sourceCardId === src.top.id);
    assert.ok(mod && mod.targetStackId === src.id && mod.side === 'player');
    assert.equal(isTargetProtectedFrom(s, src, 'effect', makeUnit('o', { owner: 'opponent' })), true);
    assert.equal(isTargetProtectedFrom(s, src, 'effect', makeUnit('p', { owner: 'player' })), false);
  } }
];

for (const tc of REAL_FG1_CASES) {
  test(`WPFG1-REAL-${tc.cn}: real shard card (${tc.kind}) asserts state changes and invariants`, async () => {
    const card = loadShardCard(tc.sf, tc.cn);
    card.id = `real_fg1_${tc.cn}`;
    card.owner = 'player';
    card.controller = 'player';
    card.bp = card.bp || 2000;
    card.levels = card.levels || { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 4000 } };

    const state = createGameState();
    const events = new EventBus();
    const resolver = new AsyncResolver(new DeterministicPromptResolver(), events);
    const srcStack = createFieldStack(card, { normal: 2 });
    state.players.player.field.push(srcStack);
    const ctx = { controller: 'player', sourceCard: card, sourceStack: srcStack };
    tc.setup(state, srcStack, ctx);

    const coresBefore = getTotalPlayerCores(state, 'player') + getTotalPlayerCores(state, 'opponent');
    const ability = card.abilities[0];
    assert.ok(ability && Array.isArray(ability.clauses), `${tc.cn} must have compiled ability[0]`);

    const res = await resolver.resolveAbility(state, ability, ctx, events);
    assert.ok(res && typeof res === 'object', `${tc.cn} must return resolution object`);
    assert.notEqual(res.reason, 'UNHANDLED_OPERATION', `${tc.cn} must not hit unhandled operation`);
    tc.verify(state, res, srcStack, ctx);

    // Core conservation holds unless MOVE_CORE intentionally fetched from voidCores
    const coresAfter = getTotalPlayerCores(state, 'player') + getTotalPlayerCores(state, 'opponent');
    assert.equal(coresAfter, coresBefore, `${tc.cn} must conserve total cores across players/void`);
  });
}
