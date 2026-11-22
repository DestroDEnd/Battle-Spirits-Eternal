import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { ETERNAL_RULES } from '../engine/rules/eternal.js';
import { compileCard } from '../compiler/index.js';
import { getDetailedCardMap } from './helpers/card_e2e_framework.mjs';

test('PLAYABLE-MATCH-01: End-to-end multi-turn match through production APIs with real card actions', async () => {
  const detMap = getDetailedCardMap();
  
  // Real card BS01-002 Rokceratops: Cost 1, LV1 BP 1000
  const rokceratopsDet = detMap.get('BS01-002');
  const rokceratopsCompiled = compileCard(rokceratopsDet);

  // Real card BS01-006 Merat: Cost 2, LV1 BP 3000
  const meratDet = detMap.get('BS01-006');
  const meratCompiled = compileCard(meratDet);

  // Real card BS01-117 Double Draw: Cost 4, Draw 2
  const doubleDrawDet = detMap.get('BS01-117');
  const doubleDrawCompiled = compileCard(doubleDrawDet);

  // Build 40-card test decks
  const buildDeck = (side) => {
    const cards = [];
    for (let i = 0; i < 40; i++) {
      const template = side === 'player'
        ? (i < 10 ? rokceratopsCompiled : (i < 20 ? doubleDrawCompiled : meratCompiled))
        : (i < 10 ? meratCompiled : (i < 20 ? rokceratopsCompiled : doubleDrawCompiled));
      cards.push(createCardInstance({
        ...template,
        cardNumber: template.card_number || template.cardNumber,
        id: `${side}_c_${i}`
      }, side));
    }
    return cards;
  };

  const p1Deck = buildDeck('player');
  const p2Deck = buildDeck('opponent');

  const game = createGame({
    playerDeck: p1Deck,
    opponentDeck: p2Deck,
    firstPlayer: 'player',
    unsafeTestBypassDeckValidation: true
  });

  const state = game.state;
  const p1 = state.players.player;
  const p2 = state.players.opponent;

  // Verify Initial Setup
  assert.equal(state.turnNumber, 1);
  assert.equal(state.activePlayer, 'player');
  assert.equal(state.step, 'START');
  assert.equal(p1.life, 5);
  assert.equal(p2.life, 5);
  assert.equal(p1.hand.length, 4);
  assert.equal(p2.hand.length, 4);
  assert.equal(p1.reserve.normal + p1.reserve.soul, 4);
  assert.equal(p2.reserve.normal + p2.reserve.soul, 4);

  // === TURN 1: Player 1 (Skips Core, Draw, Attack) ===
  // START -> REFRESH -> MAIN
  await game.advanceStep();
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'MAIN');
  assert.equal(state.activePlayer, 'player');

  // Player 1 summons Rokceratops from hand (Cost 1)
  const rokceratopsCard = p1.hand.find(c => c.cardNumber === 'BS01-002') || p1.hand[0];
  const playRes1 = await game.playCard(rokceratopsCard.id, [], 'player');
  assert.equal(playRes1.success, true);
  assert.equal(p1.field.length, 1);
  assert.equal(p1.field[0].top.id, rokceratopsCard.id);
  assert.equal(p1.field[0].cores.normal, 1); // Placed with 1 core for LV1

  // Player 1 advances to END (skips ATTACK on Turn 1)
  await game.advanceStep();
  assert.equal(state.step, 'END');
  await game.advanceStep(); // END -> Turn 2 START

  // === TURN 2: Player 2 (Normal turn: Core, Draw, Refresh, Main, Attack) ===
  assert.equal(state.turnNumber, 2);
  assert.equal(state.activePlayer, 'opponent');
  assert.equal(state.step, 'START');

  // Advance to MAIN step
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'MAIN');

  // Player 2 summons Merat (Cost 2, BP 3000)
  const meratCard = p2.hand.find(c => c.cardNumber === 'BS01-006') || p2.hand[0];
  const playRes2 = await game.playCard(meratCard.id, [], 'opponent');
  assert.equal(playRes2.success, true);
  assert.equal(p2.field.length, 1);
  assert.equal(p2.field[0].cores.normal, 1);
  assert.equal(p2.field[0].state, 'REFRESHED');

  // Player 2 keeps Merat refreshed to defend and advances to END step
  await game.advanceStep(); // MAIN -> ATTACK
  assert.equal(state.step, 'ATTACK');
  await game.advanceStep(); // ATTACK -> END
  assert.equal(state.step, 'END');
  await game.advanceStep(); // END -> Turn 3 START

  // === TURN 3: Player 1 (Full sequence with combat and BP comparison) ===
  assert.equal(state.turnNumber, 3);
  assert.equal(state.activePlayer, 'player');

  // Advance to MAIN step
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'MAIN');

  // Player 1 plays Double Draw Magic (draw 2 cards)
  const doubleDrawCard = p1.hand.find(c => c.type === 'Magic') || p1.hand[0];
  const magicRes = await game.playCard(doubleDrawCard.id, [], 'player');
  assert.equal(magicRes.success, true);

  // Player 1 advances to ATTACK step
  await game.advanceStep(); // MAIN -> ATTACK
  assert.equal(state.step, 'ATTACK');

  // Player 1 attacks with Rokceratops (BP 1000)
  const p1AtkRes = await game.declareAttack(p1.field[0].id, 'player');
  assert.equal(p1AtkRes.success, true);
  assert.equal(p1.field[0].state, 'EXHAUSTED');

  // Player 2 BLOCKS with refreshed Merat (BP 3000)
  // Merat (3000 BP) beats Rokceratops (1000 BP)
  const p1FieldBeforeCombat = p1.field.length;
  const p1GraveBeforeCombat = p1.grave.length;
  const blockRes = await game.declareBlock(p2.field[0].id, 'opponent');
  assert.equal(blockRes.success, true);
  assert.equal(blockRes.attackerBp, 1000);
  assert.equal(blockRes.blockerBp, 3000);

  // Rokceratops is destroyed! Merat survives!
  assert.equal(p1.field.length, p1FieldBeforeCombat - 1, 'Destroyed attacker must leave field');
  assert.equal(p1.grave.length, p1GraveBeforeCombat + 1, 'Destroyed card must go to grave');
  assert.equal(p2.field.length, 1, 'Winning blocker must survive on field');
  assert.equal(state.combat, null, 'Combat must be cleaned up');

  // Verify core conservation
  let totalCores = 0;
  for (const s of ['player', 'opponent']) {
    const pl = state.players[s];
    totalCores += pl.life;
    totalCores += pl.reserve.normal + pl.reserve.soul;
    totalCores += (pl.trash?.normal || 0) + (pl.trash?.soul || 0);
    totalCores += (pl.coreTrash?.normal || 0) + (pl.coreTrash?.soul || 0);
    for (const st of pl.field) {
      totalCores += st.cores.normal + st.cores.soul;
    }
  }
  totalCores += (state.void?.normal || 0) + (state.void?.soul || 0);
  assert.equal(totalCores, 18, 'Total system cores must be strictly conserved at 18');
});

test('PLAYABLE-MATCH-02: Deckout loss condition on Start Step triggers immediate victory', async () => {
  const emptyDeckGame = createGame({
    firstPlayer: 'player',
    unsafeTestBypassDeckValidation: true
  });

  const state = emptyDeckGame.state;

  // Empty opponent deck and transition to opponent's START step
  state.players.opponent.deck = [];
  state.step = 'END';
  state.activePlayer = 'player';
  state.turnNumber = 1;

  // Advancing from Turn 1 END transitions to Turn 2 START for opponent
  // With 0 cards in deck, START step triggers deckout loss!
  await emptyDeckGame.advanceStep();
  assert.equal(state.winner, 'player');
  assert.equal(state.winReason, 'DECK_OUT');
});

test('PLAYABLE-MATCH-03: Life depletion to 0 triggers immediate game over with LIFE_0 reason', async () => {
  const game = createGame({
    firstPlayer: 'player',
    unsafeTestBypassDeckValidation: true
  });

  const state = game.state;
  state.players.opponent.life = 1;

  // Setup an attacker on player's field
  const sieghug = createCardInstance({
    cardNumber: 'BS01-002',
    name: 'Rokceratops',
    type: 'Spirit',
    cost: 1,
    levels: { 1: { cost: 1, bp: 1000 } }
  }, 'player');
  const atkStack = createFieldStack(sieghug, { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  state.step = 'ATTACK';
  await game.declareAttack(atkStack.id, 'player');
  assert.ok(state.combat !== null);

  // Direct hit depletes opponent's remaining 1 life to 0
  const hitRes = await game.resolveDirectHit('player');
  assert.equal(hitRes.success, true);
  assert.equal(state.players.opponent.life, 0);
  assert.equal(state.winner, 'player');
  assert.equal(state.winReason, 'LIFE_0');
});

test('PLAYABLE-MATCH-04: Multi-hit combat reducing life to 0 across consecutive turns', async () => {
  const game = createGame({
    firstPlayer: 'player',
    unsafeTestBypassDeckValidation: true
  });
  const state = game.state;
  const p1 = state.players.player;
  const p2 = state.players.opponent;

  // Setup spirits on Player 1's field
  const sp1 = createCardInstance({ cardNumber: 'BS01-002', type: 'Spirit', symbols: ['Red', 'Red'], levels: { 1: { cost: 1, bp: 5000 } } }, 'player');
  const stack1 = createFieldStack(sp1, { normal: 2, soul: 0 });
  p1.field.push(stack1);

  // Turn 3 Attack step: Double symbol attacker attacks unblocked
  state.turnNumber = 3;
  state.activePlayer = 'player';
  state.step = 'ATTACK';

  await game.declareAttack(stack1.id, 'player');
  assert.equal(p2.life, 5);
  await game.resolveDirectHit('player');
  assert.equal(p2.life, 3, 'Double symbol direct hit reduces Life by 2');

  // Refresh stack1 for next attack
  stack1.state = 'REFRESHED';
  await game.declareAttack(stack1.id, 'player');
  await game.resolveDirectHit('player');
  assert.equal(p2.life, 1, 'Second double symbol attack reduces Life from 3 to 1');

  // Third attack reduces remaining life to 0 -> Victory
  stack1.state = 'REFRESHED';
  await game.declareAttack(stack1.id, 'player');
  await game.resolveDirectHit('player');
  assert.equal(p2.life, 0);
  assert.equal(state.winner, 'player');
  assert.equal(state.winReason, 'LIFE_0');
});
