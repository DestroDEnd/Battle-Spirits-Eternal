import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, createFieldStack, createCardInstance } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import {
  computeLevel,
  computeSymbols,
  computeColors,
  computeFamilies,
  isImmune,
  canAttack,
  canBlock
} from '../engine/continuous.js';
import { calculateEffectiveCost } from '../engine/payment.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { createGame } from '../engine/index.js';

function createCard(id, overrides = {}, owner = 'player') {
  return createCardInstance({
    id,
    card_number: id,
    cardNumber: id,
    name: `Card_${id}`,
    type: 'Spirit',
    colors: ['Red'],
    symbols: ['Red'],
    cost: 5,
    reduction: { Red: 2 },
    family: 'Terra Dragon',
    levels: {
      1: { cost: 1, bp: 3000 },
      2: { cost: 3, bp: 5000 },
      3: { cost: 5, bp: 8000 }
    },
    ...overrides
  }, owner);
}

test('Milestone 3 Ops: ADD_SYMBOL, SET_SYMBOL, GRANT_BRAVE_SYMBOLS', async () => {
  const state = createGameState();
  const c1 = createCard('BS01-001', { symbols: ['Red'] }, 'player');
  const stack = createFieldStack(c1, { normal: 2, soul: 0 });
  state.players.player.field.push(stack);

  // 1. ADD_SYMBOL adds symbols to stack
  await executeOp(state, { op: 'ADD_SYMBOL', color: 'Purple', count: 2 }, {
    controller: 'player',
    sourceCard: c1,
    sourceStack: stack
  });
  let syms = computeSymbols(state, stack);
  assert.ok(syms.includes('Red'));
  assert.equal(syms.filter(s => s === 'Purple').length, 2);

  // 2. GRANT_BRAVE_SYMBOLS adds symbols when Braved
  const braveCard = createCard('BS10-060', { type: 'Brave', symbols: [] }, 'player');
  stack.braves.push(braveCard);
  await executeOp(state, { op: 'GRANT_BRAVE_SYMBOLS', color: 'White', count: 1 }, {
    controller: 'player',
    sourceCard: braveCard,
    sourceStack: stack
  });
  syms = computeSymbols(state, stack);
  assert.ok(syms.includes('White'));

  // 3. SET_SYMBOL overrides symbols to specific value (including 0)
  await executeOp(state, { op: 'SET_SYMBOL', color: 'Red', count: 0 }, {
    controller: 'player',
    sourceCard: c1,
    sourceStack: stack
  });
  syms = computeSymbols(state, stack);
  assert.equal(syms.length, 0);
});

test('Milestone 3 Ops: IMMUNITY and PROTECTION with moveCard & executeOp integration', async () => {
  const state = createGameState();
  const targetCard = createCard('BS01-010', { colors: ['White'] }, 'player');
  const targetStack = createFieldStack(targetCard, { normal: 2, soul: 0 });
  state.players.player.field.push(targetStack);

  const oppSource = createCard('BS01-020', { colors: ['Red'], type: 'Spirit' }, 'opponent');

  // Register IMMUNITY vs Red
  await executeOp(state, { op: 'IMMUNITY', colors: ['red'] }, {
    controller: 'player',
    sourceCard: targetCard,
    sourceStack: targetStack
  });

  assert.equal(isImmune(state, targetStack, oppSource), true);

  // Attempt to DESTROY with Red sourceCard -> blocked by immunity
  const destroyRes = await executeOp(state, {
    op: 'DESTROY',
    target: { side: 'opp', types: ['Spirit'] },
    count: 1
  }, {
    controller: 'opponent',
    sourceCard: oppSource
  });
  assert.equal(state.players.player.field.length, 1);

  // Clear modifiers and test PROTECTION (cannotBeDestroyed / cannotBeBounced)
  state.modifiers = [];
  await executeOp(state, {
    op: 'PROTECTION',
    cannotBeDestroyed: true,
    cannotBeBounced: true
  }, {
    controller: 'player',
    sourceCard: targetCard,
    sourceStack: targetStack
  });

  // Direct moveCard with cause='effect' to grave or hand is blocked by PROTECTION
  const moveGrave = await moveCard(state, targetCard, 'grave', 'player', {
    cause: 'effect',
    by: 'opponent',
    sourceCard: oppSource
  });
  assert.equal(moveGrave, false);
  assert.equal(state.players.player.field.length, 1);

  const moveHand = await moveCard(state, targetCard, 'hand', 'player', {
    cause: 'bounce',
    by: 'opponent',
    sourceCard: oppSource
  });
  assert.equal(moveHand, false);
  assert.equal(state.players.player.field.length, 1);
});

test('Milestone 3 Ops: PREVENT_DAMAGE and NEGATE_EFFECT', async () => {
  const state = createGameState();
  state.players.player.life = 5;

  await executeOp(state, { op: 'PREVENT_DAMAGE', side: 'self', duration: 'THIS_TURN' }, {
    controller: 'player'
  });

  // Attempting to reduce life from player should be prevented
  const coreMoved = await moveCore(
    state,
    2,
    { zone: 'life', side: 'player' },
    { zone: 'reserve', side: 'player' },
    { cause: 'battle', by: 'opponent' }
  );
  assert.equal(coreMoved, false);
  assert.equal(state.players.player.life, 5);

  // Test NEGATE_EFFECT during Magic playCard
  const game = createGame();
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  const magicCard = createCard('BS01-144', {
    type: 'Magic',
    cost: 0,
    reduction: {},
    compiledIr: {
      abilities: [
        {
          id: 'BS01-144#a0',
          type: 'ABILITY',
          header: { timing: 'MAIN', isMain: true, levels: [] },
          clauses: [
            { op: { op: 'DRAW', count: 2 } }
          ]
        }
      ]
    }
  }, 'player');
  game.state.players.player.hand.push(magicCard);
  game.state.players.player.deck.push(createCard('D1'), createCard('D2'));

  // Register NEGATE_EFFECT against player
  await executeOp(game.state, { op: 'NEGATE_EFFECT', side: 'opp' }, {
    controller: 'opponent'
  });

  const initialHandCount = game.state.players.player.hand.length;
  const playRes = await game.playCard(magicCard.id, [], 'player');
  assert.equal(playRes.success, true);
  assert.equal(playRes.negated, true);
  assert.equal(game.state.players.player.hand.length, initialHandCount - 1);
});

test('Milestone 3 Ops: UNBLOCKABLE, COMBAT_RESTRICTION, FORCE_BLOCK, TARGET_ATTACK', async () => {
  const state = createGameState();
  const attackerCard = createCard('BS02-001', { colors: ['Red'], cost: 6 }, 'player');
  const attackerStack = createFieldStack(attackerCard, { normal: 2, soul: 0 });
  state.players.player.field.push(attackerStack);

  const blocker1Card = createCard('BS02-002', { colors: ['White'], cost: 3 }, 'opponent');
  const blocker1Stack = createFieldStack(blocker1Card, { normal: 2, soul: 0 });
  const blocker2Card = createCard('BS02-003', { colors: ['Purple'], cost: 7 }, 'opponent');
  const blocker2Stack = createFieldStack(blocker2Card, { normal: 2, soul: 0 });
  state.players.opponent.field.push(blocker1Stack, blocker2Stack);

  state.combat = {
    attackerStackId: attackerStack.id,
    blockerStackId: null,
    step: 'BLOCK'
  };

  // 1. UNBLOCKABLE unless cost >= 5
  await executeOp(state, {
    op: 'UNBLOCKABLE',
    blockedOnlyByFilter: { minCost: 5 }
  }, {
    controller: 'player',
    sourceCard: attackerCard,
    sourceStack: attackerStack
  });

  assert.equal(canBlock(state, blocker1Stack), false); // cost 3 < 5
  assert.equal(canBlock(state, blocker2Stack), true);  // cost 7 >= 5

  // 2. COMBAT_RESTRICTION: cannotAttack & canBlockWhileExhausted
  state.modifiers = [];
  blocker1Stack.state = 'EXHAUSTED';
  assert.equal(canBlock(state, blocker1Stack), false);

  await executeOp(state, {
    op: 'COMBAT_RESTRICTION',
    targetStackId: blocker1Stack.id,
    side: 'self',
    canBlockWhileExhausted: true,
    cannotAttack: true
  }, {
    controller: 'opponent',
    sourceCard: blocker1Card,
    sourceStack: blocker1Stack
  });

  assert.equal(canBlock(state, blocker1Stack), true);
  blocker1Stack.state = 'REFRESHED';
  assert.equal(canAttack(state, blocker1Stack), false);

  // 3. FORCE_BLOCK / TARGET_ATTACK restricts valid blocker to forced target
  state.modifiers = [];
  await executeOp(state, {
    op: 'TARGET_ATTACK',
    targetStackId: blocker2Stack.id
  }, {
    controller: 'player',
    sourceCard: attackerCard,
    sourceStack: attackerStack
  });

  assert.equal(state.combat.forcedBlockerStackId, blocker2Stack.id);
  assert.equal(canBlock(state, blocker1Stack), false);
  assert.equal(canBlock(state, blocker2Stack), true);
});

test('Milestone 3 Ops: TREAT_RULE, GRANT_FAMILY, CHOOSE_COLOR, COST_MODIFIER, SET_RESTRICTION', async () => {
  const state = createGameState();
  const card = createCard('BS03-001', {
    colors: ['Red'],
    cost: 6,
    family: 'Terra Dragon',
    levels: {
      1: { cost: 1, bp: 3000 },
      2: { cost: 3, bp: 5000 },
      3: { cost: 5, bp: 9000 }
    }
  }, 'player');
  const stack = createFieldStack(card, { normal: 1, soul: 0 });
  state.players.player.field.push(stack);

  // Base level with 1 core is 1
  assert.equal(computeLevel(stack, state), 1);

  // 1. TREAT_RULE: treatAsMaxLevel
  await executeOp(state, {
    op: 'TREAT_RULE',
    target: 'SELF',
    treatAsMaxLevel: true
  }, {
    controller: 'player',
    sourceCard: card,
    sourceStack: stack
  });
  assert.equal(computeLevel(stack, state), 3);

  // 2. GRANT_FAMILY
  await executeOp(state, {
    op: 'GRANT_FAMILY',
    family: 'Machine Beast'
  }, {
    controller: 'player',
    sourceCard: card,
    sourceStack: stack
  });
  const fams = computeFamilies(state, stack);
  assert.ok(fams.includes('Terra Dragon'));
  assert.ok(fams.includes('Machine Beast'));

  // 3. CHOOSE_COLOR with promptResolver
  await executeOp(state, {
    op: 'CHOOSE_COLOR',
    addSymbol: true
  }, {
    controller: 'player',
    sourceCard: card,
    sourceStack: stack,
    promptResolver: {
      choose: async () => [{ color: 'Blue' }]
    }
  });
  const cols = computeColors(state, stack);
  assert.ok(cols.includes('Red'));
  assert.ok(cols.includes('Blue'));
  const syms = computeSymbols(state, stack);
  assert.ok(syms.includes('Blue'));

  // 4. COST_MODIFIER reduces hand card cost
  const handCard = createCard('BS03-010', { cost: 7, reduction: {} }, 'player');
  state.players.player.hand.push(handCard);
  await executeOp(state, {
    op: 'COST_MODIFIER',
    side: 'self',
    delta: -3
  }, {
    controller: 'player'
  });
  assert.equal(calculateEffectiveCost(state, handCard, 'player'), 4);

  // 5. SET_RESTRICTION blocks summon and burst activation
  const game = createGame();
  game.state.step = 'MAIN';
  game.state.activePlayer = 'opponent';
  const p2Spirit = createCard('BS03-099', { type: 'Spirit', cost: 0 }, 'opponent');
  const p2Burst = createCard('BS03-100', {
    type: 'Magic',
    compiledIr: {
      abilities: [
        {
          id: 'BS03-100#a0',
          type: 'ABILITY',
          header: { timing: 'BURST', burstCondition: 'AFTER_YOUR_LIFE_REDUCED' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'opponent');
  game.state.players.opponent.hand.push(p2Spirit);
  game.state.players.opponent.burst = p2Burst;

  await executeOp(game.state, {
    op: 'SET_RESTRICTION',
    side: 'opp',
    restriction: 'CANNOT_SUMMON',
    filter: { types: ['Spirit'] }
  }, { controller: 'player' });

  await executeOp(game.state, {
    op: 'SET_RESTRICTION',
    side: 'opp',
    restriction: 'CANNOT_ACTIVATE_BURST'
  }, { controller: 'player' });

  const summonAttempt = await game.playCard(p2Spirit.id, [], 'opponent');
  assert.equal(summonAttempt.success, false);
  assert.equal(summonAttempt.reason, 'SUMMON_RESTRICTED');

  await game.windows.openBurstWindow({ type: 'LIFE_REDUCED', player: 'opponent' });
  assert.equal(game.state.players.opponent.burst, p2Burst);
});

test('M2 Challenger Hardening Regression: DEPLOY_NEXUS & SUMMON atomic core validation', async () => {
  const state = createGameState();
  state.players.player.reserve.normal = 1;
  state.players.player.reserve.soul = 0;

  const nexusCard = createCard('BS01-120', { type: 'Nexus' }, 'player');
  state.players.player.hand.push(nexusCard);

  // VULN-M2-01: DEPLOY_NEXUS requesting 3 cores when reserve only has 1 must fail without inflating cores
  const deployFail = await executeOp(state, { op: 'DEPLOY_NEXUS', cores: 3 }, { controller: 'player' });
  assert.equal(deployFail.success, false);
  assert.equal(deployFail.reason, 'INSUFFICIENT_NEXUS_CORES');
  assert.equal(state.players.player.reserve.normal, 1);

  // VULN-M2-02: Negative cores clamped to 0
  const deployOk = await executeOp(state, { op: 'DEPLOY_NEXUS', cores: -5 }, { controller: 'player' });
  assert.equal(deployOk.success, true);
  assert.equal(deployOk.stack.cores.normal, 0);

  // VULN-M2-03: Paid SUMMON where player has exact cost cores (2) but 0 extra core for LV1 maintenance
  state.players.player.reserve.normal = 2;
  const spiritCard = createCard('BS01-050', { type: 'Spirit', cost: 2, reduction: {} }, 'player');
  state.players.player.hand.push(spiritCard);

  const summonFail = await executeOp(state, { op: 'SUMMON', free: false }, { controller: 'player' });
  assert.equal(summonFail.success, false);
  assert.equal(summonFail.reason, 'INSUFFICIENT_LV1_CORES');
  // Reserve cores must NOT be burned
  assert.equal(state.players.player.reserve.normal, 2);

  // VULN-M2-04: executeOp with omitted context parameter should not throw
  const noCtxRes = await executeOp(state, { op: 'ADD_COUNTER', count: 1 });
  assert.equal(noCtxRes.success, true);
});
