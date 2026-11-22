import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { computeEffectiveBP, computeLevel } from '../engine/continuous.js';
import { FlowController } from '../engine/flow.js';
import { moveCard } from '../engine/zones.js';
import { checkStateBasedActions } from '../engine/sba.js';
import { createEngineStateFromLegacy, syncEngineStateToLegacy } from '../engine/legacy_bridge.js';

function makeLegacyDuelBase() {
  return {
    turn: 2,
    phaseIndex: 4,
    phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
    activePlayer: 'player',
    modifiers: [],
    combat: null,
    abilityUses: {},
    usedStructuredAbilities: [],
    winner: null,
    winReason: null,
    player: {
      life: 5,
      reserve: 4,
      trash: 0,
      counters: 0,
      extraTurns: 0,
      burstSetThisTurn: false,
      mirageSetThisTurn: false,
      deck: [],
      hand: [],
      field: [],
      nexus: [],
      trashCards: [],
      voidCards: [],
      openCards: [],
      revealed: []
    },
    opponent: {
      life: 5,
      reserve: 4,
      trash: 0,
      counters: 0,
      extraTurns: 0,
      burstSetThisTurn: false,
      mirageSetThisTurn: false,
      deck: [],
      hand: [],
      field: [],
      nexus: [],
      trashCards: [],
      voidCards: [],
      openCards: [],
      revealed: []
    }
  };
}

// 1. Two identical card copies in the same player's hand
test('1. Legacy bridge keeps two identical card copies in same hand distinct and addressable', () => {
  const duel = makeLegacyDuelBase();
  const c1 = { card_number: 'BS01-001', name: 'Goradon', type: 'Spirit', cost: 2 };
  const c2 = { card_number: 'BS01-001', name: 'Goradon', type: 'Spirit', cost: 2 };
  duel.player.hand = [c1, c2];

  const { state, mapper } = createEngineStateFromLegacy(duel);
  assert.equal(state.players.player.hand.length, 2);
  assert.notEqual(state.players.player.hand[0], state.players.player.hand[1]);
  assert.notEqual(state.players.player.hand[0].id, state.players.player.hand[1].id);
  assert.notEqual(state.players.player.hand[0].uid, state.players.player.hand[1].uid);

  syncEngineStateToLegacy(state, duel, mapper);
  assert.equal(duel.player.hand.length, 2);
  assert.equal(duel.player.hand[0], c1);
  assert.equal(duel.player.hand[1], c2);
});

// 2. Identical cards owned by opposing players
test('2. Legacy bridge keeps identical cards owned by opposing players distinct even with matching uid', () => {
  const duel = makeLegacyDuelBase();
  const pCard = { uid: 'shared_uid', card_number: 'BS01-001', name: 'Goradon', type: 'Spirit', currentCores: 1 };
  const oCard = { uid: 'shared_uid', card_number: 'BS01-001', name: 'Goradon', type: 'Spirit', currentCores: 2 };
  duel.player.field = [pCard];
  duel.opponent.field = [oCard];

  const { state, mapper } = createEngineStateFromLegacy(duel);
  const pStack = state.players.player.field[0];
  const oStack = state.players.opponent.field[0];

  assert.notEqual(pStack.top, oStack.top);
  assert.notEqual(pStack.top.id, oStack.top.id);
  assert.notEqual(pStack.id, oStack.id);
  assert.equal(pStack.top.owner, 'player');
  assert.equal(oStack.top.owner, 'opponent');

  syncEngineStateToLegacy(state, duel, mapper);
  assert.equal(duel.player.field[0], pCard);
  assert.equal(duel.opponent.field[0], oCard);
  assert.equal(duel.player.field[0].currentCores, 1);
  assert.equal(duel.opponent.field[0].currentCores, 2);
});

// 3. Cards moving between zones & open/void separation
test('3. Legacy bridge preserves card identity across zone moves and keeps openCards separate from voidCards', async () => {
  const duel = makeLegacyDuelBase();
  const handCard = { card_number: 'BS01-004', name: 'Lizard', type: 'Spirit' };
  const voidCard = { card_number: 'BS01-010', name: 'Voided', type: 'Spirit' };
  const openCard = { card_number: 'BS01-011', name: 'Opened', type: 'Spirit' };
  duel.player.hand = [handCard];
  duel.player.voidCards = [voidCard];
  duel.player.openCards = [openCard];

  const { state, mapper } = createEngineStateFromLegacy(duel);
  assert.equal(state.players.player.removed.length, 1);
  assert.equal(state.players.player.openCards.length, 1);

  await moveCard(state, state.players.player.hand[0], 'grave', 'player');
  syncEngineStateToLegacy(state, duel, mapper);

  assert.equal(duel.player.hand.length, 0);
  assert.equal(duel.player.trashCards.length, 1);
  assert.equal(duel.player.trashCards[0], handCard);
  assert.equal(duel.player.voidCards.length, 1);
  assert.equal(duel.player.voidCards[0], voidCard);
  assert.equal(duel.player.openCards.length, 1);
  assert.equal(duel.player.openCards[0], openCard);
});

// 4. Cards underneath another card
test('4. Legacy bridge retains under-card identities and syncs stack.under & bonusLevel', () => {
  const duel = makeLegacyDuelBase();
  const under1 = { card_number: 'BS40-001', name: 'PreAdvent A', type: 'Spirit' };
  const under2 = { card_number: 'BS40-001', name: 'PreAdvent A', type: 'Spirit' };
  const top = {
    card_number: 'BS40-X01',
    name: 'Advent Boss',
    type: 'Spirit',
    currentCores: 1,
    bonusLevel: 1,
    levels: { 1: { cost: 1, bp: 5000 }, 2: { cost: 3, bp: 9000 } },
    under: [under1, under2]
  };
  duel.player.field = [top];

  const { state, mapper } = createEngineStateFromLegacy(duel);
  const stack = state.players.player.field[0];
  assert.equal(stack.under.length, 2);
  assert.notEqual(stack.under[0], stack.under[1]);
  assert.notEqual(stack.under[0].id, stack.under[1].id);
  assert.equal(stack.bonusLevel, 1);
  assert.equal(computeLevel(stack, state), 2);

  syncEngineStateToLegacy(state, duel, mapper);
  assert.equal(duel.player.field[0].under.length, 2);
  assert.equal(duel.player.field[0].under[0], under1);
  assert.equal(duel.player.field[0].under[1], under2);
  assert.equal(duel.player.field[0].bonusLevel, 1);
  assert.equal(duel.player.field[0].currentLevel, 2);
});

// 5. Combat state synchronization
test('5. Legacy bridge bidirectionally synchronizes combat state', () => {
  const duel = makeLegacyDuelBase();
  duel.combat = { attackerStackId: 'stack_1', blockerStackId: null, stage: 'FLASH' };

  const { state, mapper } = createEngineStateFromLegacy(duel);
  assert.deepEqual(state.combat, { attackerStackId: 'stack_1', blockerStackId: null, stage: 'FLASH' });

  state.combat.blockerStackId = 'stack_2';
  state.combat.stage = 'BP_COMPARE';
  syncEngineStateToLegacy(state, duel, mapper);
  assert.deepEqual(duel.combat, { attackerStackId: 'stack_1', blockerStackId: 'stack_2', stage: 'BP_COMPARE' });
});

// 6. Ability usage synchronization
test('6. Legacy bridge bidirectionally synchronizes abilityUses and usedStructuredAbilities', () => {
  const duel = makeLegacyDuelBase();
  duel.abilityUses = { 'c1_a0': 1 };
  duel.usedStructuredAbilities = ['c1#a0'];

  const { state, mapper } = createEngineStateFromLegacy(duel);
  assert.equal(state.abilityUses['c1_a0'], 1);
  assert.deepEqual(state.usedStructuredAbilities, ['c1#a0']);

  state.abilityUses['c2_a1'] = 1;
  state.usedStructuredAbilities.push('c2#a1');
  syncEngineStateToLegacy(state, duel, mapper);

  assert.equal(duel.abilityUses['c2_a1'], 1);
  assert.deepEqual(duel.usedStructuredAbilities, ['c1#a0', 'c2#a1']);
});

// 7. Counter, revealed, extraTurns, winner/winReason, burst/mirageSetThisTurn synchronization
test('7. Legacy bridge bidirectionally synchronizes counters, revealed, extraTurns, winner, burst/mirage flags', () => {
  const duel = makeLegacyDuelBase();
  const revCard = { card_number: 'BS01-020', name: 'Revealed', type: 'Magic' };
  duel.player.counters = 3;
  duel.player.extraTurns = 1;
  duel.player.burstSetThisTurn = true;
  duel.player.mirageSetThisTurn = true;
  duel.player.revealed = [revCard];

  const { state, mapper } = createEngineStateFromLegacy(duel);
  assert.equal(state.players.player.counters, 3);
  assert.equal(state.players.player.extraTurns, 1);
  assert.equal(state.players.player.burstSetThisTurn, true);
  assert.equal(state.players.player.mirageSetThisTurn, true);
  assert.equal(state.players.player.revealed.length, 1);

  state.players.player.counters = 5;
  state.players.player.extraTurns = 2;
  state.players.player.burstSetThisTurn = false;
  state.winner = 'player';
  state.winReason = 'LIFE_0';
  syncEngineStateToLegacy(state, duel, mapper);

  assert.equal(duel.player.counters, 5);
  assert.equal(duel.player.extraTurns, 2);
  assert.equal(duel.player.burstSetThisTurn, false);
  assert.equal(duel.player.mirageSetThisTurn, true);
  assert.equal(duel.player.revealed[0], revCard);
  assert.equal(duel.winner, 'player');
  assert.equal(duel.winReason, 'LIFE_0');
});

// 8. Temporary modifier expiration
test('8. Temporary modifiers expire at step and turn boundaries', async () => {
  const state = createGameState([], [], 'player');
  state.turnNumber = 2;
  state.step = 'MAIN';
  const flow = new FlowController(state);

  state.modifiers.push(
    { id: 'm_step', type: 'SET_BP', value: 0, duration: 'THIS_STEP' },
    { id: 'm_turn', type: 'SET_BP', value: 1000, duration: 'THIS_TURN' },
    { id: 'm_perm', type: 'SET_BP', value: 2000, duration: 'PERMANENT' }
  );

  // MAIN -> ATTACK prunes THIS_STEP
  await flow.advanceStep();
  assert.equal(state.step, 'ATTACK');
  assert.deepEqual(state.modifiers.map(m => m.id), ['m_turn', 'm_perm']);

  // ATTACK -> END -> START prunes THIS_TURN
  await flow.advanceStep();
  assert.equal(state.step, 'END');
  await flow.advanceStep();
  assert.equal(state.step, 'START');
  assert.deepEqual(state.modifiers.map(m => m.id), ['m_perm']);
});

// 9. BP and level modifications (SET_BP, SET_LEVEL, BP_OR_LEVEL_MODIFIER)
test('9. SET_BP, SET_LEVEL, and BP_OR_LEVEL_MODIFIER are consumed by computeEffectiveBP and computeLevel', async () => {
  const state = createGameState();
  const spirit = createCardInstance({
    card_number: 'BS32-TEST',
    name: 'Test Spirit',
    type: 'Spirit',
    levels: {
      1: { cost: 1, bp: 3000 },
      2: { cost: 3, bp: 6000 },
      3: { cost: 5, bp: 9000 }
    }
  }, 'opponent');
  const stack = createFieldStack(spirit, { normal: 5, soul: 0 });
  state.players.opponent.field.push(stack);

  assert.equal(computeLevel(stack, state), 3);
  assert.equal(computeEffectiveBP(state, stack), 9000);

  // SET_LEVEL -> opponent becomes LV1
  const lvRes = await executeOp(state, {
    op: 'SET_LEVEL',
    side: 'opponent',
    targetStackId: stack.id,
    value: 1,
    duration: 'THIS_TURN'
  }, { controller: 'player' });
  assert.equal(lvRes.success, true);
  assert.equal(computeLevel(stack, state), 1);
  assert.equal(computeEffectiveBP(state, stack), 3000);

  // BP_OR_LEVEL_MODIFIER (+2000 BP)
  const bpModRes = await executeOp(state, {
    op: 'BP_OR_LEVEL_MODIFIER',
    side: 'opponent',
    targetStackId: stack.id,
    stat: 'bp',
    value: 2000,
    duration: 'THIS_TURN'
  }, { controller: 'player' });
  assert.equal(bpModRes.success, true);
  assert.equal(computeEffectiveBP(state, stack), 5000);

  // SET_BP -> BP becomes 0
  const setBpRes = await executeOp(state, {
    op: 'SET_BP',
    side: 'opponent',
    targetStackId: stack.id,
    value: 0,
    duration: 'THIS_TURN'
  }, { controller: 'player' });
  assert.equal(setBpRes.success, true);
  assert.equal(computeEffectiveBP(state, stack), 0);
});

// 10. Step skipping and step modification (SKIP_STEP, STEP_MODIFIER)
test('10. SKIP_STEP and STEP_MODIFIER skip targeted steps for the affected player', async () => {
  const state = createGameState(
    [createCardInstance({ name: 'D1' }, 'player')],
    [createCardInstance({ name: 'D2' }, 'opponent')],
    'player'
  );
  state.turnNumber = 2;
  state.step = 'REFRESH';
  const flow = new FlowController(state);

  const skipRes = await executeOp(state, {
    op: 'SKIP_STEP',
    step: 'MAIN_STEP',
    duration: 'THIS_TURN'
  }, { controller: 'player' });
  assert.equal(skipRes.success, true);

  // REFRESH -> skips MAIN -> goes directly to ATTACK
  await flow.advanceStep();
  assert.equal(state.step, 'ATTACK');

  // STEP_MODIFIER with SKIP_END? Wait: ATTACK -> END is always allowed, let's test STEP_MODIFIER skipping DRAW on opponent's turn
  state.step = 'END';
  await flow.advanceStep(); // Now turn 3, opponent START
  assert.equal(state.activePlayer, 'opponent');

  const stepModRes = await executeOp(state, {
    op: 'STEP_MODIFIER',
    side: 'opponent',
    step: 'DRAW',
    restriction: 'SKIP_DRAW',
    duration: 'THIS_TURN'
  }, { controller: 'player' });
  assert.equal(stepModRes.success, true);

  await flow.advanceStep(); // START -> CORE
  assert.equal(state.step, 'CORE');
  await flow.advanceStep(); // CORE -> skips DRAW -> REFRESH
  assert.equal(state.step, 'REFRESH');
});

// 11. Level comparison instead of BP comparison (COMPARE_LEVELS, COMPARE_LV_INSTEAD_OF_BP)
test('11. COMPARE_LV_INSTEAD_OF_BP and COMPARE_LEVELS compare levels instead of BP in battle and ops', async () => {
  const attackerCard = {
    card_number: 'ATK-1',
    name: 'High Level Low BP',
    type: 'Spirit',
    cost: 2,
    levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 2, bp: 2000 } }
  };
  const blockerCard = {
    card_number: 'BLK-1',
    name: 'Low Level High BP',
    type: 'Spirit',
    cost: 4,
    levels: { 1: { cost: 1, bp: 10000 }, 2: { cost: 5, bp: 15000 } }
  };

  const game = createGame({
    playerDeck: [createCardInstance({ name: 'Filler' }, 'player')],
    opponentDeck: [createCardInstance({ name: 'Filler' }, 'opponent')],
    firstPlayer: 'player'
  });
  game.state.turnNumber = 2;
  game.state.step = 'ATTACK';

  const atkInst = createCardInstance(attackerCard, 'player');
  const atkStack = createFieldStack(atkInst, { normal: 2, soul: 0 }); // LV2, 2000 BP
  game.state.players.player.field.push(atkStack);

  const blkInst = createCardInstance(blockerCard, 'opponent');
  const blkStack = createFieldStack(blkInst, { normal: 1, soul: 0 }); // LV1, 10000 BP
  game.state.players.opponent.field.push(blkStack);

  const modRes = await executeOp(game.state, {
    op: 'COMPARE_LV_INSTEAD_OF_BP',
    side: 'player',
    duration: 'THIS_BATTLE'
  }, { controller: 'player' });
  assert.equal(modRes.success, true);

  await game.declareAttack(atkStack.id, 'player');
  const battleRes = await game.declareBlock(blkStack.id, 'opponent');
  assert.equal(battleRes.success, true);
  // LV2 (2000 BP) beats LV1 (10000 BP) when comparing levels
  assert.equal(game.state.players.player.field.length, 1);
  assert.equal(game.state.players.opponent.field.length, 0);
  assert.equal(game.state.players.opponent.grave.length, 1);
  // THIS_BATTLE modifier expired after battle
  assert.equal(game.state.modifiers.length, 0);

  // Also test immediate COMPARE_LEVELS operation
  const blk2 = createFieldStack(createCardInstance(blockerCard, 'opponent'), { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(blk2);
  const cmpRes = await executeOp(game.state, {
    op: 'COMPARE_LEVELS',
    targetStackId: blk2.id
  }, { controller: 'player', sourceStack: atkStack, sourceCard: atkInst });
  assert.equal(cmpRes.success, true);
  assert.equal(cmpRes.winner, 'player');
  assert.equal(game.state.players.opponent.field.length, 0);
});

// 12. Life-loss / game-loss prevention (PREVENT_LOSS)
test('12. PREVENT_LOSS prevents game loss at 0 life and deck-out until modifier expires', async () => {
  const state = createGameState([], [createCardInstance({ name: 'OppDeck' }, 'opponent')], 'player');
  state.step = 'ATTACK';
  state.players.player.life = 0;

  const preventRes = await executeOp(state, {
    op: 'PREVENT_LOSS',
    side: 'player',
    duration: 'THIS_TURN'
  }, { controller: 'player' });
  assert.equal(preventRes.success, true);

  // SBA at 0 life must NOT end the game while PREVENT_LOSS is active
  const sba1 = await checkStateBasedActions(state);
  assert.equal(state.winner, null);
  assert.equal(sba1.winner, null);

  // Advance through END -> opponent START (THIS_TURN expires) -> SBA now declares opponent winner
  const flow = new FlowController(state);
  state.step = 'END';
  await flow.advanceStep();
  assert.equal(state.winner, 'opponent');
  assert.equal(state.winReason, 'LIFE_0');
});
