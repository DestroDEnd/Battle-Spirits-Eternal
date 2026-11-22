/**
 * tests/core_game_rules_engine.test.js
 *
 * Phase 4C.3.3 — Consolidated Core Game Rules Engine Test Suite
 *
 * Covers:
 * 1. State Integrity & Validation (zone uniqueness, ownership, core & Soul Core conservation)
 * 2. Turn Lifecycle (Eternal 7-step sequence, Turn 1 skips, extra turns, TURN/STEP events & expiration)
 * 3. Core Management (atomic moveCore, Soul Core rules, transferCore gating, level transitions & depletion)
 * 4. Card Play & Costs (strict step/player gating, symbol reductions, atomic payCost, Spirit/Brave/Nexus/Magic)
 * 5. Combat & Battle System (Pursuit, Nexus attack block, battle by-attribution, symbol damage, direct hit -> LIFE_0)
 * 6. Event & Trigger Integration + Complete Multi-Turn Match Integration
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import {
  createCardInstance,
  createFieldStack,
  getTotalPlayerCores,
  validateGameState,
  resetInstanceIdCounter,
  resetPlacementIdCounter
} from '../engine/state.js';
import { moveCore, moveCard } from '../engine/zones.js';
import { payCost, calculateEffectiveCost } from '../engine/payment.js';
import { computeLevel, computeEffectiveBP } from '../engine/continuous.js';
import { assignDeterministicAbilityIdentities } from '../compiler/index.js';

function makeDeck(count = 30, prefix = 'D') {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `${prefix}-${i + 1}`,
    name: `Spirit ${prefix}-${i + 1}`,
    type: 'Spirit',
    cost: 2,
    color: 'Red',
    symbols: ['Red'],
    reduction: { Red: 1 },
    levels: { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 5000 } }
  }));
}

// ===========================================================================
// 1. State Integrity & Validation
// ===========================================================================
test('CORE-STATE-01: Fresh game state passes validateGameState and preserves initial core conservation', () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({
    playerDeck: makeDeck(40, 'P'),
    opponentDeck: makeDeck(40, 'O'),
    strictRules: true
  });

  const check = game.validateState();
  assert.equal(check.valid, true, `Validation errors: ${check.errors.join('; ')}`);

  const pCores = getTotalPlayerCores(game.state, 'player');
  const oCores = getTotalPlayerCores(game.state, 'opponent');
  assert.equal(pCores.normal, 8);
  assert.equal(pCores.soul, 1);
  assert.equal(pCores.total, 9); // 5 life + 3 reserve normal + 1 reserve soul + 0 void
  assert.equal(oCores.normal, 8);
  assert.equal(oCores.soul, 1);
  assert.equal(oCores.total, 9);
});

test('CORE-STATE-02: validateGameState detects duplicate card instance, invalid cores, and Soul Core violation', () => {
  const game = createGame({ playerDeck: makeDeck(10, 'P'), opponentDeck: makeDeck(10, 'O') });

  // Duplicate card instance across zones
  const card = game.state.players.player.hand[0];
  game.state.players.player.grave.push(card);
  let res = validateGameState(game.state);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('Duplicate card instance')));

  // Fix duplicate, introduce Soul Core conservation violation
  game.state.players.player.grave.pop();
  game.state.players.player.trash.soul = 1;
  res = validateGameState(game.state);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('Soul Core conservation violated')));

  // Fix Soul Core, introduce negative core count
  game.state.players.player.trash.soul = 0;
  game.state.players.player.reserve.normal = -1;
  res = validateGameState(game.state);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('Invalid core count')));
});

// ===========================================================================
// 2. Turn Lifecycle
// ===========================================================================
test('CORE-TURN-01: Complete Eternal turn lifecycle with Turn 1 skips, player switch, DRAW, REFRESH, and events', async () => {
  const game = createGame({
    playerDeck: makeDeck(40, 'P'),
    opponentDeck: makeDeck(40, 'O'),
    firstPlayer: 'player',
    strictRules: true
  });
  game.state.players.opponent.voidCores.normal = 5;

  const emitted = [];
  game.events.on('*', e => emitted.push(e));

  // Turn 1 (player): START -> DRAW -> REFRESH -> MAIN -> END (skips CORE and ATTACK)
  assert.equal(game.state.step, 'START');
  assert.equal(game.state.activePlayer, 'player');

  assert.equal(await game.advanceStep(), 'DRAW');
  assert.ok(emitted.some(e => e.type === 'CARD_DRAWN' && e.player === 'player'), 'CARD_DRAWN emitted');

  // Exhaust and heavy-exhaust two stacks to test REFRESH step
  const s1 = createFieldStack(createCardInstance({ card_number: 'T-1', name: 'S1', type: 'Spirit' }, 'player'), { normal: 1, soul: 0 });
  s1.state = 'EXHAUSTED';
  const s2 = createFieldStack(createCardInstance({ card_number: 'T-2', name: 'S2', type: 'Spirit' }, 'player'), { normal: 1, soul: 0 });
  s2.state = 'HEAVY_EXHAUSTED';
  game.state.players.player.field.push(s1, s2);
  game.state.players.player.trash.normal = 2;

  assert.equal(await game.advanceStep(), 'REFRESH');
  assert.equal(s1.state, 'REFRESHED');
  assert.equal(s2.state, 'EXHAUSTED');
  assert.equal(game.state.players.player.trash.normal, 0);
  assert.equal(game.state.players.player.reserve.normal, 5);
  assert.equal(emitted.filter(e => e.type === 'CARD_REFRESHED').length, 2);

  assert.equal(await game.advanceStep(), 'MAIN');
  assert.equal(await game.advanceStep(), 'END');

  // END -> Turn 2 START (opponent)
  assert.equal(await game.advanceStep(), 'START');
  assert.equal(game.state.turnNumber, 2);
  assert.equal(game.state.activePlayer, 'opponent');
  assert.ok(emitted.some(e => e.type === 'TURN_END' && e.player === 'player' && e.turnNumber === 1));
  assert.ok(emitted.some(e => e.type === 'TURN_START' && e.player === 'opponent' && e.turnNumber === 2));

  // Turn 2 (opponent) includes CORE and ATTACK
  assert.equal(await game.advanceStep(), 'CORE');
  assert.equal(game.state.players.opponent.reserve.normal, 4, 'Core Step added 1 core from Void to Reserve');
  assert.equal(await game.advanceStep(), 'DRAW');
  assert.equal(await game.advanceStep(), 'REFRESH');
  assert.equal(await game.advanceStep(), 'MAIN');
  assert.equal(await game.advanceStep(), 'ATTACK');
  assert.equal(await game.advanceStep(), 'END');
});

test('CORE-TURN-02: Extra turn grants consecutive turn to same player and expires turn modifiers', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O'), strictRules: true });
  game.state.step = 'END';
  game.state.players.player.extraTurns = 1;
  game.state.modifiers.push({ id: 'm1', type: 'BP_BUFF', amount: 1000, duration: 'THIS_TURN' });

  await game.advanceStep();
  assert.equal(game.state.turnNumber, 2);
  assert.equal(game.state.activePlayer, 'player', 'Extra turn keeps activePlayer as player');
  assert.equal(game.state.players.player.extraTurns, 0);
  assert.equal(game.state.modifiers.length, 0, 'THIS_TURN modifier expired at END->START');
});

// ===========================================================================
// 3. Core Management
// ===========================================================================
test('CORE-MGMT-01: moveCore rejects invalid counts, missing target stacks, and illegal Soul Core moves atomically', async () => {
  const game = createGame({ playerDeck: makeDeck(10, 'P'), opponentDeck: makeDeck(10, 'O') });
  const before = getTotalPlayerCores(game.state, 'player');

  // Negative, fractional, NaN counts
  assert.equal(await moveCore(game.state, -1, { zone: 'reserve', side: 'player' }, { zone: 'trash', side: 'player' }), false);
  assert.equal(await moveCore(game.state, 1.5, { zone: 'reserve', side: 'player' }, { zone: 'trash', side: 'player' }), false);
  assert.equal(await moveCore(game.state, NaN, { zone: 'reserve', side: 'player' }, { zone: 'trash', side: 'player' }), false);

  // Invalid zones
  assert.equal(await moveCore(game.state, 1, { zone: 'invalid', side: 'player' }, { zone: 'trash', side: 'player' }), false);

  // Missing target stack
  assert.equal(await moveCore(game.state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player', stackId: 'nonexistent' }), false);

  // Soul Core to Void by opponent rejected; Soul Core to Life without allowSeal rejected
  assert.equal(await moveCore(game.state, 1, { zone: 'reserve', side: 'player' }, { zone: 'void' }, { isSoulCore: true, by: 'opponent' }), false);
  assert.equal(await moveCore(game.state, 1, { zone: 'reserve', side: 'player' }, { zone: 'life', side: 'player' }, { isSoulCore: true }), false);

  assert.deepEqual(getTotalPlayerCores(game.state, 'player'), before, 'Failed moves caused zero core mutation');
});

test('CORE-MGMT-02: transferCore enforces Main Step, active player, own zones, level changes, and depletion SBA', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O'), strictRules: true });
  const spirit = createCardInstance({
    card_number: 'CORE-1',
    name: 'Level Spirit',
    type: 'Spirit',
    levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 3, bp: 4000 } }
  }, 'player');
  const stack = createFieldStack(spirit, { normal: 1, soul: 0 });
  game.state.players.player.field.push(stack);

  // Cannot transfer in START step
  let res = await game.transferCore(2, { zone: 'reserve' }, { zone: 'field', stackId: stack.id }, 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'TRANSFER_ONLY_IN_MAIN_STEP');

  game.state.step = 'MAIN';
  // Opponent cannot transfer during player's Main Step
  res = await game.transferCore(1, { zone: 'reserve' }, { zone: 'field', stackId: stack.id }, 'opponent');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'NOT_ACTIVE_PLAYER');

  // Cannot manually transfer from Life
  res = await game.transferCore(1, { zone: 'life' }, { zone: 'reserve' }, 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_MANUAL_TRANSFER_ZONE');

  // Legal transfer from reserve to field -> Level 2
  res = await game.transferCore(2, { zone: 'reserve' }, { zone: 'field', stackId: stack.id }, 'player');
  assert.equal(res.success, true);
  assert.equal(computeLevel(stack, game.state), 2);
  assert.equal(computeEffectiveBP(game.state, stack), 4000);

  // Remove all 3 cores -> Depletion SBA moves spirit to grave
  res = await game.transferCore(3, { zone: 'field', stackId: stack.id }, { zone: 'reserve' }, 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.field.length, 0);
  assert.equal(game.state.players.player.grave.some(c => c.id === spirit.id), true);
});

// ===========================================================================
// 4. Card Play & Costs
// ===========================================================================
test('CORE-PLAY-01: payCost is strictly atomic and failed card play never consumes cores or moves card', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O'), strictRules: true });
  game.state.step = 'MAIN';
  game.state.players.player.reserve = { normal: 2, soul: 1 };

  // Explicit partial payment that fails on second source must leave reserve untouched
  const payRes = await payCost(game.state, 4, [
    { zone: 'reserve', isSoulCore: false, count: 2 },
    { zone: 'reserve', isSoulCore: false, count: 2 } // Only 0 normal remaining!
  ], 'player', game.events);
  assert.equal(payRes.success, false);
  assert.equal(game.state.players.player.reserve.normal, 2, 'Reserve normal cores untouched on atomic failure');
  assert.equal(game.state.players.player.trash.normal, 0, 'Trash untouched on atomic failure');

  // Card play with insufficient cores leaves hand and cores untouched
  const expensive = createCardInstance({ card_number: 'EXP-1', name: 'Expensive', type: 'Spirit', cost: 10 }, 'player');
  game.state.players.player.hand.push(expensive);
  const playRes = await game.playCard(expensive.id, [], 'player');
  assert.equal(playRes.success, false);
  assert.equal(playRes.reason, 'INSUFFICIENT_CORES');
  assert.equal(game.state.players.player.hand.some(c => c.id === expensive.id), true);
  assert.equal(game.state.players.player.reserve.normal, 2);
});

test('CORE-PLAY-02: Strict card play enforces timing, cost reduction, Spirit/Brave/Nexus/Magic pipelines', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O'), strictRules: true });

  const spirit = createCardInstance({
    card_number: 'PLAY-S1', name: 'Red Dragon', type: 'Spirit', cost: 2, color: 'Red', symbols: ['Red'], reduction: { Red: 1 }
  }, 'player');
  const nexus = createCardInstance({
    card_number: 'PLAY-N1', name: 'Red Shrine', type: 'Nexus', cost: 1, color: 'Red', symbols: ['Red']
  }, 'player');
  const brave = createCardInstance({
    card_number: 'PLAY-B1', name: 'Flame Sword', type: 'Brave', cost: 1, color: 'Red', symbols: ['Red'], levels: { 1: { cost: 1, bp: 2000 } }
  }, 'player');
  const magic = createCardInstance({
    card_number: 'PLAY-M1', name: 'Main Draw', type: 'Magic', cost: 1, color: 'Red',
    compiledIr: {
      abilities: [{
        id: 'PLAY-M1#a0',
        header: { timing: 'MAIN', isMain: true },
        clauses: [{ op: { op: 'DRAW', count: 1 } }]
      }]
    }
  }, 'player');
  assignDeterministicAbilityIdentities('PLAY-M1', magic.compiledIr.abilities);

  game.state.players.player.hand.push(spirit, nexus, brave, magic);
  game.state.players.player.reserve = { normal: 6, soul: 1 };

  // Cannot play in START step under strictRules
  let res = await game.playCard(spirit.id, [], 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_TIMING_FOR_CARD_PLAY');

  game.state.step = 'MAIN';
  // 1. Deploy Nexus (cost 1) -> provides 1 Red symbol for reduction
  res = await game.playCard(nexus.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(res.costPaid, 1);

  // 2. Summon Spirit (cost 2 reduced by 1 Red symbol -> costPaid 1)
  assert.equal(calculateEffectiveCost(game.state, spirit, 'player'), 1);
  res = await game.playCard(spirit.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(res.costPaid, 1);

  // 3. Summon Brave in Spirit Form
  res = await game.playCard(brave.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.field.some(st => st.top.id === brave.id), true);

  // 4. Cast Main Magic -> moves to grave and draws 1 card
  const handBeforeMagic = game.state.players.player.hand.length;
  res = await game.playCard(magic.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.grave.some(c => c.id === magic.id), true);
  assert.equal(game.state.players.player.hand.length, handBeforeMagic); // -1 magic +1 draw
  assert.equal(game.validateState().valid, true);
});

// ===========================================================================
// 5. Combat & Battle System
// ===========================================================================
test('CORE-COMBAT-01: Strict combat validation, Pursuit heavy-exhaustion, battle protection, and symbol direct hit to LIFE_0', async () => {
  const game = createGame({ playerDeck: makeDeck(40, 'P'), opponentDeck: makeDeck(40, 'O'), strictRules: true });
  const eventsSeen = [];
  game.events.on('*', e => eventsSeen.push(e.type));

  const attackerCard = createCardInstance({
    card_number: 'ATK-1',
    name: 'Pursuit Wyvern',
    type: 'Spirit',
    symbols: ['Red', 'Red'], // Double symbol!
    effect: '[Pursuit]',
    keywords: [{ name: 'Pursuit' }],
    levels: { 1: { cost: 1, bp: 5000 } }
  }, 'player');
  const nexusCard = createCardInstance({ card_number: 'NEX-1', name: 'Fortress', type: 'Nexus' }, 'player');
  const blockerCard = createCardInstance({
    card_number: 'BLK-1',
    name: 'Shield Golem',
    type: 'Spirit',
    levels: { 1: { cost: 1, bp: 3000 } }
  }, 'opponent');

  const atkStack = createFieldStack(attackerCard, { normal: 1, soul: 0 });
  const nexStack = createFieldStack(nexusCard, { normal: 0, soul: 0 });
  const blkStack = createFieldStack(blockerCard, { normal: 1, soul: 0 });

  game.state.players.player.field.push(atkStack, nexStack);
  game.state.players.opponent.field.push(blkStack);

  // Grant opponent blocker INDESTRUCTIBLE by BP_COMPARISON to verify battle protection
  game.state.modifiers.push({
    id: 'ind_opp',
    type: 'INDESTRUCTIBLE',
    targetStackId: blkStack.id,
    side: 'opponent',
    by: 'BP_COMPARISON',
    duration: 'THIS_TURN'
  });

  // Cannot attack in MAIN step
  let atkRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkRes.success, false);
  assert.equal(atkRes.reason, 'ATTACK_ONLY_IN_ATTACK_STEP');

  game.state.step = 'ATTACK';
  // Nexus cannot attack
  atkRes = await game.declareAttack(nexStack.id, 'player');
  assert.equal(atkRes.success, false);
  assert.equal(atkRes.reason, 'CANNOT_ATTACK_WITH_NEXUS');

  // 1st Attack: Attacker 5000 BP vs Blocker 3000 BP (indestructible by opponent)
  atkRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkRes.success, true);
  assert.equal(atkStack.state, 'HEAVY_EXHAUSTED', 'PursuitKeyword heavy-exhausts on attack');

  // Cannot declare second attack while combat is active
  const secondAtk = await game.declareAttack(atkStack.id, 'player');
  assert.equal(secondAtk.success, false);
  assert.equal(secondAtk.reason, 'COMBAT_ALREADY_IN_PROGRESS');

  // Cannot direct hit after being blocked
  const blkRes = await game.declareBlock(blkStack.id, 'opponent');
  assert.equal(blkRes.success, true);
  assert.ok(eventsSeen.includes('CARD_EXHAUSTED'));
  assert.ok(eventsSeen.includes('BATTLE_STARTED'));
  assert.ok(eventsSeen.includes('BATTLE_ENDED'));
  assert.equal(game.state.players.opponent.field.some(st => st.id === blkStack.id), true, 'Blocker survived via OPPONENT indestructibility');

  // Heavy-exhausted Spirit cannot attack again
  const heavyAtk = await game.declareAttack(atkStack.id, 'player');
  assert.equal(heavyAtk.success, false);
  assert.equal(heavyAtk.reason, 'CANNOT_ATTACK');

  // 2nd Attacker (refreshed double-symbol Spirit) attacks unblocked -> direct hit to LIFE_0
  const atkStack2 = createFieldStack(createCardInstance({
    card_number: 'ATK-2',
    name: 'Double Strike Wyvern',
    type: 'Spirit',
    symbols: ['Red', 'Red'],
    levels: { 1: { cost: 1, bp: 5000 } }
  }, 'player'), { normal: 1, soul: 0 });
  game.state.players.player.field.push(atkStack2);

  game.state.players.opponent.life = 2;
  const atkRes2 = await game.declareAttack(atkStack2.id, 'player');
  assert.equal(atkRes2.success, true);
  assert.equal(atkStack2.state, 'EXHAUSTED');

  const hitRes = await game.resolveDirectHit('player');
  assert.equal(hitRes.success, true);
  assert.equal(game.state.players.opponent.life, 0, 'Double-symbol Spirit dealt 2 life damage');
  assert.equal(game.state.players.opponent.reserve.normal, 5, '2 Life cores moved to Reserve');
  assert.equal(game.state.winner, 'player', 'LIFE_0 SBA declared player as winner');
  assert.equal(game.state.winReason, 'LIFE_0');
  assert.equal(game.validateState().valid, true);
});

// ===========================================================================
// 6. Complete Multi-Turn Match Integration (Event & Trigger Pipeline)
// ===========================================================================
test('CORE-MATCH-01: End-to-end multi-turn match through production APIs with triggered abilities and state validation', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const summonDrawAb = {
    id: 'MATCH-S1#a0',
    type: 'ABILITY',
    header: { timing: 'WHEN_SUMMONED', trigger: 'ON_SUMMON', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  assignDeterministicAbilityIdentities('MATCH-S1', [summonDrawAb]);

  const pDeck = [
    {
      card_number: 'MATCH-S1',
      name: 'Scout Dragon',
      type: 'Spirit',
      cost: 1,
      color: 'Red',
      symbols: ['Red'],
      levels: { 1: { cost: 1, bp: 4000 } },
      compiledIr: { abilities: [summonDrawAb] }
    },
    ...makeDeck(39, 'MP')
  ];
  const oDeck = makeDeck(40, 'MO');

  const game = createGame({ playerDeck: pDeck, opponentDeck: oDeck, firstPlayer: 'player', strictRules: true });
  // Ensure MATCH-S1 is in opening hand
  if (!game.state.players.player.hand.some(c => c.cardNumber === 'MATCH-S1')) {
    const idx = game.state.players.player.deck.findIndex(c => c.cardNumber === 'MATCH-S1');
    game.state.players.player.hand[0] = game.state.players.player.deck.splice(idx, 1)[0];
  }

  // Turn 1 (player): START -> DRAW -> REFRESH -> MAIN
  await game.advanceStep(); // DRAW
  await game.advanceStep(); // REFRESH
  await game.advanceStep(); // MAIN
  assert.equal(game.state.step, 'MAIN');

  const scout = game.state.players.player.hand.find(c => c.cardNumber === 'MATCH-S1');
  const playRes = await game.playCard(scout.id, [], 'player');
  assert.equal(playRes.success, true);
  assert.equal(playRes.abilityResults.length, 1);
  assert.equal(playRes.abilityResults[0].isCommitted, true);
  assert.equal(game.validateState().valid, true);

  // Turn 1: MAIN -> END -> Turn 2 START (opponent)
  await game.advanceStep(); // END
  await game.advanceStep(); // Turn 2 START (opponent)
  assert.equal(game.state.activePlayer, 'opponent');

  // Opponent skips through Turn 2 without playing
  await game.advanceStep(); // CORE
  await game.advanceStep(); // DRAW
  await game.advanceStep(); // REFRESH
  await game.advanceStep(); // MAIN
  await game.advanceStep(); // ATTACK
  await game.advanceStep(); // END
  await game.advanceStep(); // Turn 3 START (player)

  assert.equal(game.state.turnNumber, 3);
  assert.equal(game.state.activePlayer, 'player');
  await game.advanceStep(); // CORE (+1 core)
  await game.advanceStep(); // DRAW
  await game.advanceStep(); // REFRESH (Core Trash returns to Reserve)
  await game.advanceStep(); // MAIN
  await game.advanceStep(); // ATTACK

  const scoutStack = game.state.players.player.field.find(st => st.top.cardNumber === 'MATCH-S1');
  const atkRes = await game.declareAttack(scoutStack.id, 'player');
  assert.equal(atkRes.success, true);
  const hitRes = await game.resolveDirectHit('player');
  assert.equal(hitRes.success, true);
  assert.equal(game.state.players.opponent.life, 4);
  assert.equal(game.validateState().valid, true);
});
