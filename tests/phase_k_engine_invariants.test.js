/**
 * tests/phase_k_engine_invariants.test.js
 *
 * Phase K Work Package F: Rules Engine & State Invariants Test Battery
 *
 * Verifies the 6 foundational engine invariants:
 * - INV-01: Card Zone Conservation & Disjointness
 * - INV-02: Core Conservation (Delta C = 0)
 * - INV-03: Restriction Commitment & Rollback
 * - INV-04: Timing Window Integrity
 * - INV-05: Combat Flow & Battle Transitions
 * - INV-06: State Clone Purity & Detachment
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import {
  createCardInstance,
  createFieldStack,
  validateGameState,
  getTotalPlayerCores,
  cloneGameState,
  resetInstanceIdCounter,
  resetPlacementIdCounter
} from '../engine/state.js';
import {
  reserveRestriction,
  commitRestriction,
  releaseReservation,
  evaluateRestriction,
  RESTRICTION_TYPE,
  RESTRICTION_SCOPE,
  RESTRICTION_STATUS
} from '../engine/restrictions.js';

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

// ============================================================================
// INV-01: Card Zone Conservation & Disjointness
// ============================================================================

test('INV-01: Every card exists in exactly one zone; validateGameState catches duplicates', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const valInitial = validateGameState(game.state);
  assert.equal(valInitial.valid, true, `Initial game state is valid: ${valInitial.errors.join('; ')}`);

  // Move a card from deck to hand via playCard / draw
  const topCard = game.state.players.player.deck[0];
  game.state.players.player.hand.push(topCard);
  game.state.players.player.deck.shift();

  const valAfterMove = validateGameState(game.state);
  assert.equal(valAfterMove.valid, true, 'State remains valid after clean zone move');

  // Inject duplicate card into grave to verify invariant checker catches disjointness violation
  game.state.players.player.grave.push(topCard);
  const valCorrupted = validateGameState(game.state);
  assert.equal(valCorrupted.valid, false, 'State validator detected duplicate card instance');
  assert.ok(valCorrupted.errors.some(e => e.includes('Duplicate card instance')));
});

// ============================================================================
// INV-02: Core Conservation (Delta C = 0)
// ============================================================================

test('INV-02: Core conservation holds across playCard, transfer, and payGodCores (Delta C = 0)', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'MAIN';
  const p = game.state.players.player;
  p.reserve.normal = 10;
  p.reserve.soul = 1;
  p.voidCores.normal = 15;

  const initialCores = getTotalPlayerCores(game.state, 'player');
  const totalCoresExpected = initialCores.total;

  // 1. Summon card
  const spirit = createCardInstance({
    card_number: 'TEST-INV-SP',
    name: 'Invariant Spirit',
    type: 'Spirit',
    cost: 2,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 2000 } }
  }, 'player');
  p.hand.push(spirit);

  const summonRes = await game.playCard(spirit.id, [], 'player');
  assert.equal(summonRes.success, true);

  const afterSummonCores = getTotalPlayerCores(game.state, 'player');
  assert.equal(afterSummonCores.total, totalCoresExpected, 'Core total unchanged after summon (Delta C = 0)');

  // 2. Transfer core from reserve to field stack
  const stack = p.field.find(st => st.top.id === spirit.id);
  assert.ok(stack);
  const transferRes = await game.transferCore(1, { zone: 'reserve' }, { zone: 'field', stackId: stack.id }, 'player');
  assert.equal(transferRes.success, true);

  const afterTransferCores = getTotalPlayerCores(game.state, 'player');
  assert.equal(afterTransferCores.total, totalCoresExpected, 'Core total unchanged after transfer (Delta C = 0)');

  // 3. Pay God Core directly to Void
  const gwCard = createCardInstance({
    card_number: 'TEST-GW',
    name: 'Grandwalker Invariant',
    type: 'Grandwalker Nexus',
    cost: 2,
    color: 'Red'
  }, 'player');
  const gwStack = createFieldStack(gwCard, { normal: 4, soul: 0 });
  p.field.push(gwStack);
  // Recompute expected with new stack cores added
  const expectedWithGw = getTotalPlayerCores(game.state, 'player').total;

  const payRes = await game.payGodCores(gwStack.id, 2, 'player');
  assert.equal(payRes.success, true);

  const afterPayCores = getTotalPlayerCores(game.state, 'player');
  assert.equal(afterPayCores.total, expectedWithGw, 'Core total unchanged after payGodCores to Void (Delta C = 0)');
});

// ============================================================================
// INV-03: Restriction Commitment & Rollback
// ============================================================================

test('INV-03: Restriction reservation rolls back on release, commits only on success', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const ability = { header: { limit: 'ONCE_PER_TURN' }, physicalId: 'RESTRICT-TEST#AB1' };
  const ctx = { sourceCard: { id: 'c1', placementId: 'p_1' }, controller: 'player' };

  // 1. Initial evaluation
  const checkInitial = evaluateRestriction(game.state, ability, ctx);
  assert.equal(checkInitial.status, RESTRICTION_STATUS.ALLOWED);

  // 2. Reserve and release (Rollback)
  const reservation1 = reserveRestriction(game.state, ability, ctx);
  assert.equal(reservation1.success, true);
  reservation1.release();

  const checkAfterRelease = evaluateRestriction(game.state, ability, ctx);
  assert.equal(checkAfterRelease.status, RESTRICTION_STATUS.ALLOWED, 'Restriction rolled back cleanly after release');

  // 3. Reserve and commit
  const reservation2 = reserveRestriction(game.state, ability, ctx);
  reservation2.commit();

  const checkAfterCommit = evaluateRestriction(game.state, ability, ctx);
  assert.equal(checkAfterCommit.status, RESTRICTION_STATUS.LIMIT_REACHED, 'Restriction blocks subsequent activations after commit');
});

// ============================================================================
// INV-04: Timing Window Integrity
// ============================================================================

test('INV-04: Non-flash cards are rejected during ATTACK step; flash cards permitted', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'ATTACK';
  game.state.players.player.reserve.normal = 10;

  // Non-flash Spirit
  const normalSpirit = createCardInstance({
    card_number: 'NORMAL-SP',
    name: 'Normal Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red'
  }, 'player');
  game.state.players.player.hand.push(normalSpirit);

  const resNormal = await game.playCard(normalSpirit.id, [], 'player');
  assert.equal(resNormal.success, false);
  assert.equal(resNormal.reason, 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP');

  // Flash Magic
  const flashMagic = createCardInstance({
    card_number: 'FLASH-MG',
    name: 'Flash Magic',
    type: 'Magic',
    cost: 1,
    color: 'Red',
    effect: '[Flash] During this turn, give a Spirit +1000 BP.',
    compiledIr: {
      cardNumber: 'FLASH-MG',
      name: 'Flash Magic',
      abilities: [
        {
          id: 'FLASH-MG#a0',
          header: { isFlash: true, timing: 'FLASH' },
          clauses: [{ op: { op: 'BP_BUFF', amount: 1000, target: 'self' } }]
        }
      ]
    }
  }, 'player');
  game.state.players.player.hand.push(flashMagic);

  const resFlash = await game.playCard(flashMagic.id, [], 'player');
  assert.equal(resFlash.success, true, 'Flash magic successfully executed in ATTACK step');
});

// ============================================================================
// INV-05: Combat Flow & Battle Transitions
// ============================================================================

test('INV-05: Combat lifecycle enforces step boundaries and cleans up battle state', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'MAIN';

  const attacker = createCardInstance({ card_number: 'ATK-1', name: 'Attacker', type: 'Spirit', cost: 1, color: 'Red', levels: { 1: { cost: 1, bp: 3000 } } }, 'player');
  const atkStack = createFieldStack(attacker, { normal: 1, soul: 0 });
  game.state.players.player.field.push(atkStack);

  const blocker = createCardInstance({ card_number: 'BLK-1', name: 'Blocker', type: 'Spirit', cost: 1, color: 'White', levels: { 1: { cost: 1, bp: 2000 } } }, 'opponent');
  const blkStack = createFieldStack(blocker, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(blkStack);

  // Attack declaration in MAIN step must be rejected
  const prematureAtk = await game.declareAttack(atkStack.id, 'player');
  assert.equal(prematureAtk.success, false);
  assert.equal(prematureAtk.reason, 'ATTACK_ONLY_IN_ATTACK_STEP');

  // Advance to ATTACK step
  game.state.step = 'ATTACK';
  const atkRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkRes.success, true);
  assert.ok(game.state.combat, 'Combat object created');
  assert.equal(game.state.combat.attackerStackId, atkStack.id);
  assert.equal(atkStack.state, 'EXHAUSTED');

  // Blocker declares block
  const blkRes = await game.declareBlock(blkStack.id, 'opponent');
  assert.equal(blkRes.success, true);
  assert.equal(blkStack.state, 'EXHAUSTED');

  // Combat resolves: Blocker (2000 BP) vs Attacker (3000 BP) -> Blocker destroyed
  assert.equal(game.state.players.opponent.field.length, 0, 'Lower BP blocker destroyed');
  assert.equal(game.state.players.opponent.grave.some(c => c.id === blocker.id), true);
  assert.equal(game.state.players.player.field.length, 1, 'Attacker survived battle');
});

// ============================================================================
// INV-06: State Clone Purity & Detachment
// ============================================================================

test('INV-06: cloneGameState creates detached deep copy with zero shared reference mutation', () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const card = createCardInstance({ card_number: 'TEST-CLONE', name: 'Clone Card', type: 'Spirit', cost: 1, color: 'Red' }, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);
  game.state.players.player.life = 5;

  const cloned = cloneGameState(game.state);
  assert.ok(cloned);
  assert.notEqual(cloned, game.state);

  // Severe mutations to cloned state
  cloned.players.player.life = 0;
  cloned.players.player.field.length = 0;
  cloned.players.player.hand.push({ id: 'MUTANT-CARD' });
  cloned.activePlayer = 'MUTANT_SIDE';

  // Verify production state remains 100% pristine
  assert.equal(game.state.players.player.life, 5, 'Production life untouched');
  assert.equal(game.state.players.player.field.length, 1, 'Production field stack intact');
  assert.equal(game.state.players.player.field[0].top.name, 'Clone Card');
  assert.equal(game.state.activePlayer, 'player', 'Production activePlayer intact');
});
