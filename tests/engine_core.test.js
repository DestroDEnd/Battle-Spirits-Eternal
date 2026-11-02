import test from 'node:test';
import assert from 'node:assert/strict';
import { ETERNAL_RULES } from '../engine/rules/eternal.js';
import { createGameState, createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { EventBus } from '../engine/events.js';
import { FlowController } from '../engine/flow.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { calculateEffectiveCost, payCost } from '../engine/payment.js';
import { computeLevel, computeEffectiveBP, isImmune } from '../engine/continuous.js';
import { queryCandidates } from '../engine/selectors.js';
import { checkStateBasedActions } from '../engine/sba.js';
import { AsyncResolver } from '../engine/resolver.js';
import { createGame } from '../engine/index.js';

test('Engine Core - Eternal Rules Profile specifications', () => {
  assert.equal(ETERNAL_RULES.deck.minSize, 40);
  assert.equal(ETERNAL_RULES.deck.maxSize, Infinity);
  assert.equal(ETERNAL_RULES.setup.initialLife, 5);
  assert.equal(ETERNAL_RULES.setup.initialReserveCores, 4);
  assert.equal(ETERNAL_RULES.setup.initialHandSize, 4);
  assert.equal(ETERNAL_RULES.turn.firstPlayerSkipsCoreStep, true);
  assert.equal(ETERNAL_RULES.turn.firstPlayerSkipsAttackStep, true);
  assert.equal(ETERNAL_RULES.turn.secondPlayerSkipsSteps, false);
});

test('Engine Core - Flow Controller Turn 1 step skips for Player 1', async () => {
  resetInstanceIdCounter();
  const dummyDeck = Array.from({ length: 40 }, (_, i) => ({
    cardNumber: `BS01-${String(i + 1).padStart(3, '0')}`,
    name: `Card ${i + 1}`,
    cost: 2,
    type: 'Spirit'
  }));

  const game = createGame({ playerDeck: dummyDeck, opponentDeck: dummyDeck, firstPlayer: 'player' });

  assert.equal(game.state.turnNumber, 1);
  assert.equal(game.state.activePlayer, 'player');
  assert.equal(game.state.step, 'START');

  // Advance from START -> DRAW (CORE step skipped on T1)
  let nextStep = await game.advanceStep();
  assert.equal(nextStep, 'DRAW');
  assert.equal(game.state.players.player.hand.length, 5); // 4 initial + 1 drawn

  // Advance from DRAW -> REFRESH
  nextStep = await game.advanceStep();
  assert.equal(nextStep, 'REFRESH');

  // Advance from REFRESH -> MAIN
  nextStep = await game.advanceStep();
  assert.equal(nextStep, 'MAIN');

  // Advance from MAIN -> END (ATTACK step skipped on T1 for first player)
  nextStep = await game.advanceStep();
  assert.equal(nextStep, 'END');

  // Advance from END -> Turn 2 START for Opponent (Second player does NOT skip)
  nextStep = await game.advanceStep();
  assert.equal(nextStep, 'START');
  assert.equal(game.state.turnNumber, 2);
  assert.equal(game.state.activePlayer, 'opponent');

  // Opponent Turn 2: START -> CORE (not skipped!)
  nextStep = await game.advanceStep();
  assert.equal(nextStep, 'CORE');
  assert.equal(game.state.players.opponent.reserve.normal, 4); // 3 initial + 1 from core step
});

test('Engine Core - Cost Reduction calculation and mandatory application', () => {
  const state = createGameState();
  const p = state.players.player;

  // Put 2 Red spirits on field
  const redCard1 = createCardInstance({ cost: 3, color: 'Red', type: 'Spirit' });
  const redCard2 = createCardInstance({ cost: 3, color: 'Red', type: 'Spirit' });
  p.field.push(createFieldStack(redCard1, { normal: 1, soul: 0 }));
  p.field.push(createFieldStack(redCard2, { normal: 1, soul: 0 }));

  // Card with printed cost 5 and 3 Red reductions
  const cardToPlay = createCardInstance({
    cost: 5,
    color: 'Red',
    reduction: { Red: 3 },
    type: 'Spirit'
  });

  // Effective cost = 5 - min(3, 2) = 3
  const effectiveCost = calculateEffectiveCost(state, cardToPlay, 'player');
  assert.equal(effectiveCost, 3);
});

test('Engine Core - Cost payment sends cores to Core Trash', async () => {
  const state = createGameState();
  const p = state.players.player;
  p.reserve.normal = 4;
  p.trash.normal = 0;

  const payRes = await payCost(state, 3, [{ zone: 'reserve', isSoulCore: false, count: 3 }], 'player');
  assert.ok(payRes.success);
  assert.equal(p.reserve.normal, 1);
  assert.equal(p.trash.normal, 3); // Cores in Core Trash
});

test('Engine Core - Refresh Step moves Core Trash back to Reserve', async () => {
  const state = createGameState();
  const p = state.players.player;
  p.reserve.normal = 1;
  p.trash.normal = 3;
  p.trash.soul = 1;

  const flow = new FlowController(state);
  await flow.executeStepActions('REFRESH');

  assert.equal(p.trash.normal, 0);
  assert.equal(p.trash.soul, 0);
  assert.equal(p.reserve.normal, 4);
  assert.equal(p.reserve.soul, 2);
});

test('Engine Core - Depletion State-Based Action (cores < LV1 cost)', async () => {
  const state = createGameState();
  const p = state.players.player;

  // Spirit requiring 1 core for LV1
  const spiritCard = createCardInstance({
    cost: 3,
    type: 'Spirit',
    levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 5000 } }
  });

  const stack = createFieldStack(spiritCard, { normal: 1, soul: 0 });
  p.field.push(stack);

  // Manually remove the only core to reserve -> 0 cores on stack
  stack.cores.normal = 0;

  // Run SBA
  const sbaRes = await checkStateBasedActions(state);
  assert.ok(sbaRes.changed);
  assert.equal(p.field.length, 0); // Removed from field
  assert.equal(p.grave.length, 1); // Depleted into grave
  assert.equal(p.grave[0].id, spiritCard.id);
});

test('Engine Core - Advent stacking and stack destruction', async () => {
  const state = createGameState();
  const p = state.players.player;

  const baseSpirit = createCardInstance({ name: 'Base Spirit', cost: 3, type: 'Spirit' });
  const adventSpirit = createCardInstance({ name: 'Advent Siegfried', cost: 6, type: 'Spirit' });
  const braveCard = createCardInstance({ name: 'Brave Sword', cost: 4, type: 'Brave' });

  const stack = createFieldStack(adventSpirit, { normal: 2, soul: 1 }, [braveCard]);
  stack.under.push(baseSpirit);
  p.field.push(stack);

  assert.equal(stack.under.length, 1);
  assert.equal(stack.braves.length, 1);

  // Destroy the Advent Spirit
  await moveCard(state, adventSpirit, 'grave', 'player', { cause: 'destroy' });

  // When top leaves field: stack dismantles, under + braves go to grave, cores go to reserve
  assert.equal(p.field.length, 0);
  assert.equal(p.grave.length, 3); // top + under + brave all in grave
  assert.equal(p.reserve.normal, 5); // 3 initial + 2 returned
  assert.equal(p.reserve.soul, 2); // 1 initial + 1 returned
});

test('Engine Core - Burst Replacement Rule (setting 2nd burst sends 1st to grave)', async () => {
  const state = createGameState();
  const p = state.players.player;

  const burst1 = createCardInstance({ name: 'First Burst', cost: 3, type: 'Magic' });
  const burst2 = createCardInstance({ name: 'Second Burst', cost: 4, type: 'Magic' });

  await moveCard(state, burst1, 'burst', 'player');
  assert.equal(p.burst.id, burst1.id);
  assert.equal(p.grave.length, 0);

  // Set second burst
  await moveCard(state, burst2, 'burst', 'player');
  assert.equal(p.burst.id, burst2.id);
  assert.equal(p.grave.length, 1);
  assert.equal(p.grave[0].id, burst1.id); // 1st burst replaced to grave
});

test('Engine Core - Heavy Armor Immunity prevents opponent targeting', () => {
  const state = createGameState();
  const opp = state.players.opponent;

  // Opponent controls a White spirit with Heavy Armor: Red
  const whiteSpirit = createCardInstance({
    name: 'Shield Dragon',
    color: 'White',
    type: 'Spirit',
    effect: '[Heavy Armor: Red]'
  });
  opp.field.push(createFieldStack(whiteSpirit, { normal: 1, soul: 0 }));

  // Player wants to target with Red card effect
  const redSpell = createCardInstance({ name: 'Flame Blast', color: 'Red', type: 'Magic' });
  const candidates = queryCandidates(state, { side: 'opp', types: ['Spirit'] }, {
    controller: 'player',
    sourceCard: redSpell
  });

  // White spirit is immune to Red effects -> candidates must be empty!
  assert.equal(candidates.length, 0);
});

test('Engine Core - Async Resolver executes byDoing and or links', async () => {
  const state = createGameState();
  const p = state.players.player;
  const opp = state.players.opponent;

  // Opponent has a spirit with 1 core
  const oppSpirit = createCardInstance({ name: 'Enemy Spirit', type: 'Spirit' });
  opp.field.push(createFieldStack(oppSpirit, { normal: 1, soul: 0 }));
  opp.reserve.normal = 0;

  // Player's deck has 3 cards
  p.deck = Array.from({ length: 3 }, (_, i) => createCardInstance({ name: `Deck ${i}` }));

  // Simulate Makai Curse Swordsman:
  // By sending a core from opposing Spirit to Reserve, draw a card.
  const ability = {
    clauses: [
      {
        link: null,
        isCost: true,
        op: {
          op: 'MOVE_CORE',
          count: 1,
          from: { zone: 'field', side: 'opp' },
          to: { zone: 'reserve', side: 'opp' }
        }
      },
      {
        link: 'byDoing',
        op: {
          op: 'DRAW',
          count: 1
        }
      }
    ]
  };

  const resolver = new AsyncResolver();
  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.ok(res.success);
  assert.equal(opp.field[0].cores.normal, 0); // Core removed
  assert.equal(opp.reserve.normal, 1); // Core arrived in opponent reserve
  assert.equal(p.hand.length, 1); // Card drawn by doing so!
});

test('Engine Core - Deck-out loss at Start Step', async () => {
  const state = createGameState();
  const p = state.players.player;
  p.deck = []; // Empty deck!

  const flow = new FlowController(state);
  await flow.executeStepActions('START');

  assert.equal(state.winner, 'opponent');
  assert.equal(state.winReason, 'DECK_OUT');
});
