/**
 * tests/work_package_k1_batch_02_conditions.test.js
 *
 * K1-BATCH-02 — Conditions: AST Parsing, Evaluation (TRUE / FALSE / UNSUPPORTED / INVALID_CONTEXT),
 * Compiler op.condition Integration, Resolver Wiring, and Real-Card End-to-End Verification.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { compileCard } from '../compiler/index.js';
import {
  CONDITION_RESULT,
  CONDITION_TYPES,
  parseConditionToStructured,
  evaluateStructuredCondition
} from '../engine/conditions.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createGame } from '../engine/index.js';
import { createGameState, createFieldStack, createCardInstance } from '../engine/state.js';

function loadShardCard(shardFile, cardNumber) {
  const sh = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards', shardFile), 'utf8'));
  const card = sh[cardNumber];
  assert.ok(card, `Card ${cardNumber} not found in ${shardFile}`);
  return JSON.parse(JSON.stringify(card));
}

function makeFillerDeck(prefix, count = 40, owner = 'player') {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_${i}`,
    cardNumber: `${prefix.toUpperCase()}-${i}`,
    name: `${prefix}_${i}`,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 1,
    bp: 1000,
    levels: { 1: { cost: 1, bp: 1000 } },
    owner
  }));
}

test('K1B2-01: Parser produces structured ASTs across Batch 2 families without losing UNSUPPORTED safety contracts', () => {
  const preAdv = parseConditionToStructured('If there is any "Wanderer Dan\'s Bladra" among this Spirit\'s pre-advent cards');
  assert.equal(preAdv?.type, CONDITION_TYPES.PRE_ADVENT_CARD);
  assert.equal(preAdv.expected, "Wanderer Dan's Bladra");

  const orig = parseConditionToStructured('if summoned from the deck');
  assert.equal(orig?.type, CONDITION_TYPES.ACTIVATION_ORIGIN);
  assert.equal(orig.expectedZone, 'deck');

  const bothCtrl = parseConditionToStructured('If you control both "FIRE EMBLEM" and "SKY HIGH"');
  assert.equal(bothCtrl?.type, CONDITION_TYPES.COMPOUND);
  assert.equal(bothCtrl.combinator, 'AND');
  assert.equal(bothCtrl.conditions.length, 2);

  const counterSet = parseConditionToStructured('While you have 1/3/5/7 counters');
  assert.equal(counterSet?.type, CONDITION_TYPES.COUNTER_THRESHOLD);
  assert.deepEqual(counterSet.allowedValues, [1, 3, 5, 7]);

  const oppHandRem = parseConditionToStructured('if the opponent has five cards or more in their Hand + Removed Zone');
  assert.equal(oppHandRem?.type, CONDITION_TYPES.HAND_SIZE_THRESHOLD);
  assert.equal(oppHandRem.side, 'opponent');
  assert.deepEqual(oppHandRem.zones, ['hand', 'removed']);

  const soulTrash = parseConditionToStructured('If you have Soul Core in your Trash');
  assert.equal(soulTrash?.type, CONDITION_TYPES.SOUL_CORE_LOCATION);
  assert.equal(soulTrash.zone, 'trash');

  // Action cost remains strictly unparsed (UNSUPPORTED) per COND-TRISTATE-01 / WPC-4C5-COND
  assert.equal(parseConditionToStructured('If you banish the [Soul Core] on this Ultimate from the game'), null);
});

test('K1B2-02: Evaluator distinguishes TRUE, FALSE, INVALID_CONTEXT, and UNSUPPORTED cleanly', () => {
  const state = createGameState();

  // PRE_ADVENT_CARD: INVALID_CONTEXT when sourceStack is absent, FALSE when absent in under, TRUE when present
  const preCond = 'If there is any "Wanderer Dan\'s Bladra" among this Spirit\'s pre-advent cards';
  assert.equal(evaluateStructuredCondition(state, preCond, { controller: 'player' }).result, CONDITION_RESULT.INVALID_CONTEXT);

  const host = createFieldStack({ id: 'h_pre', cardNumber: 'BS63-CP03', name: 'Bladra X', type: 'Spirit', owner: 'player' }, { normal: 1 });
  state.players.player.field.push(host);
  assert.equal(evaluateStructuredCondition(state, preCond, { controller: 'player', sourceStack: host }).result, CONDITION_RESULT.FALSE);

  host.under.push({ id: 'u1', name: "Wanderer Dan's Bladra", type: 'Spirit', owner: 'player' });
  assert.equal(evaluateStructuredCondition(state, preCond, { controller: 'player', sourceStack: host }).result, CONDITION_RESULT.TRUE);

  // ACTIVATION_ORIGIN: INVALID_CONTEXT when origin missing, TRUE/FALSE when supplied
  const magCond = 'if this card was used via [Magirrate]';
  assert.equal(evaluateStructuredCondition(state, magCond, { controller: 'player' }).result, CONDITION_RESULT.INVALID_CONTEXT);
  assert.equal(evaluateStructuredCondition(state, magCond, { controller: 'player', usedViaKeyword: 'Flash' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, magCond, { controller: 'player', usedViaKeyword: 'Magirrate' }).result, CONDITION_RESULT.TRUE);

  // OP_RULE_CONDITION: LEVEL_LTE returns INVALID_CONTEXT without combat stack levels
  assert.equal(evaluateStructuredCondition(state, 'LEVEL_LTE', { controller: 'player' }).result, CONDITION_RESULT.INVALID_CONTEXT);
  assert.equal(evaluateStructuredCondition(state, 'LEVEL_LTE', { controller: 'player', attackerLevel: 2, blockerLevel: 3 }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, 'LEVEL_LTE', { controller: 'player', attackerLevel: 2, blockerLevel: 2 }).result, CONDITION_RESULT.TRUE);

  // Compound propagates INVALID_CONTEXT when paired with TRUE
  const andWithMissingOrigin = {
    kind: 'STRUCTURED_CONDITION',
    type: CONDITION_TYPES.COMPOUND,
    combinator: 'AND',
    conditions: ['LEVEL_LTE', magCond]
  };
  assert.equal(
    evaluateStructuredCondition(state, andWithMissingOrigin, { controller: 'player', attackerLevel: 2, blockerLevel: 1 }).result,
    CONDITION_RESULT.INVALID_CONTEXT
  );

  // Explicit UNSUPPORTED never leaks as TRUE or FALSE
  assert.equal(
    evaluateStructuredCondition(state, 'If you banish the [Soul Core] on this Ultimate from the game', { controller: 'player', sourceStack: host }).result,
    CONDITION_RESULT.UNSUPPORTED
  );
});

test('K1B2-03: Extended Batch 2 grammar rules evaluate accurately across field, brave, hand, removed, and team states', () => {
  const state = createGameState();
  const s1 = createFieldStack({ id: 's1', name: 'Kamen Rider 50th A', type: 'Spirit', cost: 3, families: ['Idol'], teams: ['Shiny Hearts'], owner: 'player' }, { normal: 1 });
  const s2 = createFieldStack({ id: 's2', name: 'Kamen Rider 50th B', type: 'Spirit', cost: 4, families: ['Rouse Emperor'], owner: 'player' }, { normal: 1 });
  state.players.player.field.push(s1, s2);

  assert.equal(evaluateStructuredCondition(state, 'While all Spirits you control are "50th"-named', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // Brave family / Imagine / hostFamily
  const br = { id: 'br1', name: 'Imagine Sword', type: 'Brave', subType: 'Imagine Brave', cost: 2, families: ['Sword'], owner: 'player' };
  s1.braves.push(br);
  assert.equal(evaluateStructuredCondition(state, 'While braved to an Imagine Brave', { controller: 'player', sourceStack: s1 }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While braved to an originally Cost 3 or less Spirit', { controller: 'player', sourceStack: s1 }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If the Spirit it braved to is originally in the "Idol" family', { controller: 'player', sourceStack: s1 }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'If you control any "Kamen Rider" that is braved to 1 or more Braves', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // Attacking with Team & self-or-family (both self-attacking and family-attacking + negative)
  state.combat = { attackerStackId: s1.id, attackerSide: 'player' };
  assert.equal(evaluateStructuredCondition(state, 'While your "Idol" family Spirit with a Team is attacking', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, 'While this Spirit or your "Rouse Emperor" family Spirit is attacking', { controller: 'player', sourceStack: s1 }).result, CONDITION_RESULT.TRUE);
  state.combat = { attackerStackId: s2.id, attackerSide: 'player' };
  assert.equal(evaluateStructuredCondition(state, 'While this Spirit or your "Rouse Emperor" family Spirit is attacking', { controller: 'player', sourceStack: s1 }).result, CONDITION_RESULT.TRUE);
  const s3 = createFieldStack({ id: 's3', name: 'Other Spirit', type: 'Spirit', cost: 2, families: ['Dragon'], owner: 'player' }, { normal: 1 });
  state.players.player.field.push(s3);
  state.combat = { attackerStackId: s3.id, attackerSide: 'player' };
  assert.equal(evaluateStructuredCondition(state, 'While this Spirit or your "Rouse Emperor" family Spirit is attacking', { controller: 'player', sourceStack: s1 }).result, CONDITION_RESULT.FALSE);

  // Hand + Removed comparisons & Soul Core in trash
  state.players.player.hand.push({ id: 'ph1' }, { id: 'ph2' });
  state.players.player.removed.push({ id: 'pr1' });
  state.players.opponent.hand.push({ id: 'oh1' }, { id: 'oh2' }, { id: 'oh3' });
  state.players.opponent.removed.push({ id: 'or1' }, { id: 'or2' });
  assert.equal(evaluateStructuredCondition(state, 'if the opponent has five cards or more in their Hand + Removed Zone', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, "if the total number of cards in your Hand and Removed Zone is equal to or less than the opponent's", { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.players.player.trash.soul = 1;
  assert.equal(evaluateStructuredCondition(state, 'If you have Soul Core in your Trash', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
});

test('K1B2-04: Compiler integrates typed op.condition on [Rush: Color] and preserves real-card op.condition runtime evaluation', async () => {
  const det = JSON.parse(fs.readFileSync(path.resolve('data/cards_detailed.json'), 'utf8'));
  const compiledRush = compileCard({ ...det['BS41-040'], cardNumber: 'BS41-040' });
  const rushClause = compiledRush.abilities[0].clauses.find(c => c.op?.op === 'KEYWORD_ABILITY' && c.op?.keyword === 'Rush');
  assert.ok(rushClause, 'Compiled BS41-040 Rush must emit KEYWORD_ABILITY');
  assert.equal(rushClause.op.condition.type, CONDITION_TYPES.COLOR_SYMBOL);
  assert.equal(rushClause.op.condition.colorSymbol, 'Purple');

  // Real shard card BS19-X03 executes KEYWORD_ABILITY Rush: Blue ONLY when Blue symbol is controlled
  const bs19x03 = loadShardCard('BS19.json', 'BS19-X03');
  const resolver = new AsyncResolver(new DefaultPromptResolver());
  const stateNoBlue = createGameState();
  const oppS = createFieldStack({ id: 'opp_s', type: 'Spirit', color: 'Red', cost: 2, owner: 'opponent' }, { normal: 1 });
  stateNoBlue.players.opponent.field.push(oppS);
  stateNoBlue.players.player.deck.push({ id: 'd1', name: 'D1' }, { id: 'd2', name: 'D2' });

  const rushClauseOnly = {
    header: bs19x03.abilities[0].header,
    clauses: [bs19x03.abilities[0].clauses[1]]
  };
  const noBlueRes = await resolver.resolveAbility(stateNoBlue, rushClauseOnly, { controller: 'player', sourceCard: bs19x03 });
  assert.equal(noBlueRes.results[0].skipped, true);
  assert.equal(noBlueRes.results[0].conditionResult, CONDITION_RESULT.FALSE);

  stateNoBlue.players.player.field.push(createFieldStack({ id: 'b_nex', type: 'Nexus', color: 'Blue', colors: ['Blue'], owner: 'player' }, { normal: 0 }));
  const hasBlueRes = await resolver.resolveAbility(stateNoBlue, rushClauseOnly, { controller: 'player', sourceCard: bs19x03 });
  assert.equal(hasBlueRes.success, true);
  assert.equal(hasBlueRes.results[0].keyword, 'Rush');
});

test('K1B2-05: Real shard cards execute Batch 2 conditions end-to-end through createGame and AsyncResolver', async () => {
  const resolver = new AsyncResolver(new DefaultPromptResolver());

  // 1. BS02-088 (BOTH_PLAYERS_CONTROL_NEXUS op.condition on PLAY_CONDITION)
  const bs02 = loadShardCard('BS02.json', 'BS02-088');
  const st02 = createGameState();
  st02.players.player.nexus.push(createCardInstance({ id: 'pnx', type: 'Nexus', owner: 'player' }, 'player'));
  const failPlayCond = await resolver.resolveAbility(st02, { header: bs02.abilities[0].header, clauses: [bs02.abilities[0].clauses[1]] }, { controller: 'player', sourceCard: bs02 });
  assert.equal(failPlayCond.results[0].conditionResult, CONDITION_RESULT.FALSE);

  st02.players.opponent.nexus.push(createCardInstance({ id: 'onx', type: 'Nexus', owner: 'opponent' }, 'opponent'));
  const passPlayCond = await resolver.resolveAbility(st02, { header: bs02.abilities[0].header, clauses: [bs02.abilities[0].clauses[1]] }, { controller: 'player', sourceCard: bs02 });
  assert.equal(passPlayCond.success, true);

  // 2. BS53-050 ("While you have 1/3/5/7 counters") through full AsyncResolver
  const bs53 = loadShardCard('BS53.json', 'BS53-050');
  const st53 = createGameState();
  const oppTarget53 = createFieldStack({ id: 'ot53', type: 'Spirit', owner: 'opponent' }, { normal: 1 });
  st53.players.opponent.field.push(oppTarget53);
  st53.players.player.counters = 2; // Not in {1,3,5,7} -> FALSE
  const res53False = await resolver.resolveAbility(st53, bs53.abilities[1], { controller: 'player', sourceCard: bs53 });
  assert.equal(res53False.results[0].conditionResult, CONDITION_RESULT.FALSE);
  st53.players.player.counters = 5; // In {1,3,5,7} -> TRUE
  const res53True = await resolver.resolveAbility(st53, bs53.abilities[1], { controller: 'player', sourceCard: bs53 });
  assert.equal(res53True.success, true);
  assert.equal(res53True.results[0].exhaustedCount, 1);

  // 3. CB26-069 ("If you control both \"FIRE EMBLEM\" and \"SKY HIGH\"")
  const cb26 = loadShardCard('CB26.json', 'CB26-069');
  const st26 = createGameState();
  st26.players.player.field.push(createFieldStack({ id: 'fe', name: 'FIRE EMBLEM', type: 'Spirit', owner: 'player' }, { normal: 1 }));
  const secondClauseAb = { header: cb26.abilities[1].header, clauses: [cb26.abilities[1].clauses[1]] };
  const missSky = await resolver.resolveAbility(st26, secondClauseAb, { controller: 'player', sourceCard: cb26 });
  assert.equal(missSky.results[0].conditionResult, CONDITION_RESULT.FALSE);
  st26.players.player.field.push(createFieldStack({ id: 'sh', name: 'SKY HIGH', type: 'Spirit', owner: 'player' }, { normal: 1 }));
  const refTarget = st26.players.player.field[0];
  refTarget.exhausted = true;
  refTarget.state = 'EXHAUSTED';
  const bothPresent = await resolver.resolveAbility(st26, secondClauseAb, { controller: 'player', sourceCard: cb26 });
  assert.equal(bothPresent.success, true);

  // 4. BS60-041 ("if summoned from the deck") via createGame.playCard vs AsyncResolver INVALID_CONTEXT
  const g = createGame({
    playerDeck: makeFillerDeck('p', 40, 'player'),
    opponentDeck: makeFillerDeck('o', 40, 'opponent'),
    firstPlayer: 'player',
    promptResolver: new DefaultPromptResolver()
  });
  g.state.step = 'MAIN';
  const bs60 = loadShardCard('BS60.json', 'BS60-041');
  const deckSummonAb = { header: bs60.abilities[0].header, clauses: [bs60.abilities[0].clauses[1]] };
  const missingOriginRes = await resolver.resolveAbility(g.state, deckSummonAb, { controller: 'player', sourceCard: bs60 });
  assert.equal(missingOriginRes.results[0].conditionResult, CONDITION_RESULT.INVALID_CONTEXT);
  assert.equal(missingOriginRes.results[0].reason, 'MISSING_SUMMON_ORIGIN_CONTEXT');

  const armed = createFieldStack({ id: 'arm_1', type: 'Spirit', families: ['Proximate', 'Armed Machine'], owner: 'player' }, { normal: 1 });
  armed.state = 'EXHAUSTED';
  armed.exhausted = true;
  g.state.players.player.field.push(armed);
  const deckOriginOk = await resolver.resolveAbility(g.state, deckSummonAb, { controller: 'player', sourceCard: bs60, summonOrigin: 'deck' });
  assert.equal(deckOriginOk.success, true);
  assert.equal(armed.state, 'REFRESHED');
});
