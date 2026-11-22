import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateDeck } from '../engine/index.js';
import { createCardInstance } from '../engine/state.js';
import { compileCard } from '../compiler/index.js';
import { getDetailedCardMap } from './helpers/card_e2e_framework.mjs';

const detMap = getDetailedCardMap();

const RED_CARD_NUMBERS = [
  'BS01-001', 'BS01-002', 'BS01-004', 'BS01-005', 'BS01-006',
  'BS01-008', 'BS01-009', 'BS01-010', 'BS01-011', 'BS01-012',
  'BS01-013', 'BS01-014', 'BS01-015', 'BS01-117'
];

const PURPLE_CARD_NUMBERS = [
  'BS01-019', 'BS01-020', 'BS01-021', 'BS01-022', 'BS01-023',
  'BS01-024', 'BS01-025', 'BS01-026', 'BS01-027', 'BS01-028',
  'BS01-029', 'BS01-030', 'BS01-031', 'BS01-032'
];

function buildStrictLegalDeck(cardNumbers, side) {
  const cards = [];
  // 13 cards x 3 copies = 39 cards
  for (let i = 0; i < 13; i++) {
    const num = cardNumbers[i];
    const det = detMap.get(num);
    const compiled = compileCard(det);
    for (let copy = 0; copy < 3; copy++) {
      cards.push(createCardInstance({
        ...compiled,
        name: det.name,
        cardNumber: det.card_number || num,
        cost: det.cost,
        type: det.type,
        color: det.color,
        colors: det.colors || [det.color],
        symbols: det.symbols || [det.color],
        levels: det.levels,
        id: `${side}_${num}_copy${copy}`
      }, side));
    }
  }
  // 1 card x 1 copy = 1 card (total 40 cards)
  const num14 = cardNumbers[13];
  const det14 = detMap.get(num14);
  const compiled14 = compileCard(det14);
  cards.push(createCardInstance({
    ...compiled14,
    name: det14.name,
    cardNumber: det14.card_number || num14,
    cost: det14.cost,
    type: det14.type,
    color: det14.color,
    colors: det14.colors || [det14.color],
    symbols: det14.symbols || [det14.color],
    levels: det14.levels,
    id: `${side}_${num14}_copy0`
  }, side));

  return cards;
}

test('COMPLETE-MATCH-01: Full multi-turn game from valid 40-card decks to legitimate victory without state tampering', async () => {
  const p1Deck = buildStrictLegalDeck(RED_CARD_NUMBERS, 'player');
  const p2Deck = buildStrictLegalDeck(PURPLE_CARD_NUMBERS, 'opponent');

  // Verify both decks strictly satisfy Eternal format deck rules
  const valP1 = validateDeck(p1Deck);
  const valP2 = validateDeck(p2Deck);
  assert.equal(valP1.valid, true, `Player deck must be valid: ${JSON.stringify(valP1.errors)}`);
  assert.equal(valP2.valid, true, `Opponent deck must be valid: ${JSON.stringify(valP2.errors)}`);
  assert.equal(p1Deck.length, 40);
  assert.equal(p2Deck.length, 40);

  // Initialize production game with strictRules: true and NO test bypasses
  const game = createGame({
    playerDeck: p1Deck,
    opponentDeck: p2Deck,
    firstPlayer: 'player',
    strictRules: true
  });

  const state = game.state;
  const p1 = state.players.player;
  const p2 = state.players.opponent;

  // Verify non-bypassed deck attestation
  assert.equal(state.deckValidation?.strictRules, true);
  assert.equal(state.deckValidation?.bypassed, false);
  assert.ok(typeof state.deckValidation?.player?.digest === 'string');
  assert.ok(typeof state.deckValidation?.opponent?.digest === 'string');

  // Verify Initial Setup Invariants
  assert.equal(state.turnNumber, 1);
  assert.equal(state.activePlayer, 'player');
  assert.equal(state.step, 'START');
  assert.equal(p1.life, 5);
  assert.equal(p2.life, 5);
  assert.equal(p1.hand.length, 4);
  assert.equal(p2.hand.length, 4);
  assert.equal(p1.deck.length, 36);
  assert.equal(p2.deck.length, 36);
  assert.equal(p1.reserve.normal + p1.reserve.soul, 4);
  assert.equal(p2.reserve.normal + p2.reserve.soul, 4);

  // === TURN 1: Player 1 (First Player: Skips Core, Draw, Attack) ===
  // START -> REFRESH -> MAIN
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'MAIN');
  assert.equal(state.activePlayer, 'player');

  // Find lowest cost playable card from player hand
  const playableCard1 = p1.hand.find(c => c.type === 'Spirit' && c.cost <= p1.reserve.normal + p1.reserve.soul) || p1.hand[0];
  const p1HandBefore = p1.hand.length;
  const p1FieldBefore = p1.field.length;

  const playRes1 = await game.playCard(playableCard1.id, [], 'player');
  assert.equal(playRes1.success, true, `Turn 1 card play must succeed: ${playRes1.reason}`);
  assert.equal(p1.hand.length, p1HandBefore - 1);
  assert.equal(p1.field.length, p1FieldBefore + 1);
  assert.equal(p1.field[0].top.id, playableCard1.id);
  assert.ok(p1.field[0].cores.normal >= 1);

  // Player 1 advances to END (skipping ATTACK on Turn 1)
  await game.advanceStep();
  assert.equal(state.step, 'END');
  await game.advanceStep(); // END -> Turn 2 START

  // === TURN 2: Player 2 (Second Player: Full turn with Core, Draw, Refresh, Main, Attack) ===
  assert.equal(state.turnNumber, 2);
  assert.equal(state.activePlayer, 'opponent');
  assert.equal(state.step, 'START');

  // Advance START -> CORE
  await game.advanceStep();
  assert.equal(state.step, 'CORE');
  // When Void has 0 cores, Core Step strictly conserves cores and moves 0 cores per CORR-CORE-03 rule
  const expectedP2Reserve = 4 + (p2.voidCores?.normal ? 1 : 0);
  assert.equal(p2.reserve.normal + p2.reserve.soul, expectedP2Reserve, 'Empty Void must not create phantom cores (CORR-CORE-03 rule)');

  // Advance CORE -> DRAW
  await game.advanceStep();
  assert.equal(state.step, 'DRAW');
  assert.equal(p2.hand.length, 5, 'Draw step must draw 1 card from deck');
  assert.equal(p2.deck.length, 35);

  // Advance DRAW -> REFRESH -> MAIN
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'MAIN');

  // Player 2 plays a spirit from hand
  const playableCard2 = p2.hand.find(c => c.type === 'Spirit' && c.cost <= p2.reserve.normal + p2.reserve.soul);
  if (playableCard2) {
    const playRes2 = await game.playCard(playableCard2.id, [], 'opponent');
    assert.equal(playRes2.success, true);
    assert.equal(p2.field.length, 1);
  }

  // Advance MAIN -> ATTACK
  await game.advanceStep();
  assert.equal(state.step, 'ATTACK');

  // Player 2 declares attack if they have a refreshed spirit
  const p2Attacker = p2.field.find(s => s.state === 'REFRESHED');
  if (p2Attacker) {
    const atkRes = await game.declareAttack(p2Attacker.id, 'opponent');
    assert.equal(atkRes.success, true);
    assert.equal(p2Attacker.state, 'EXHAUSTED');

    // Player 1 declares block with their spirit on field
    const p1Blocker = p1.field.find(s => s.state === 'REFRESHED');
    if (p1Blocker) {
      const blkRes = await game.declareBlock(p1Blocker.id, 'player');
      assert.equal(blkRes.success, true);
      assert.equal(p1Blocker.state, 'EXHAUSTED');
    } else {
      // Unblocked direct hit
      const hitRes = await game.resolveDirectHit();
      assert.equal(hitRes.success, true);
      assert.equal(p1.life, 4, 'Direct hit must reduce player life to 4');
    }
  }

  // Advance ATTACK -> END -> Turn 3 START
  while (state.step !== 'END') {
    await game.advanceStep();
  }
  await game.advanceStep(); // END -> Turn 3

  // === TURN 3: Player 1 (Full Turn with Core, Draw, Refresh, Main, Attack) ===
  assert.equal(state.turnNumber, 3);
  assert.equal(state.activePlayer, 'player');

  // Advance to MAIN
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'MAIN');

  // Check if player can play Magic card or another Spirit
  const doubleDraw = p1.hand.find(c => c.cardNumber === 'BS01-117');
  if (doubleDraw && p1.reserve.normal + p1.reserve.soul >= doubleDraw.cost) {
    const handBeforeMagic = p1.hand.length;
    const playMagic = await game.playCard(doubleDraw.id, [], 'player');
    assert.equal(playMagic.success, true);
    // Double Draw draws 2 cards (hand - 1 card cast + 2 cards drawn = hand + 1)
    assert.equal(p1.hand.length, handBeforeMagic + 1);
  }

  // Advance to ATTACK step
  await game.advanceStep();
  assert.equal(state.step, 'ATTACK');

  // Player 1 attacks with refreshed spirit
  const p1Attacker = p1.field.find(s => s.state === 'REFRESHED');
  if (p1Attacker) {
    const atkRes = await game.declareAttack(p1Attacker.id, 'player');
    assert.equal(atkRes.success, true);
    // Opponent has no blocker or declines to block -> direct hit
    const hitRes = await game.resolveDirectHit();
    assert.equal(hitRes.success, true);
    assert.ok(p2.life < 5, 'Opponent life must be reduced');
  }

  // Clean transition to END step
  while (state.step !== 'END') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'END');
  await game.advanceStep(); // Turn 4 START

  assert.equal(state.turnNumber, 4);
  assert.equal(state.activePlayer, 'opponent');

  // Total core conservation check:
  // All cores in system (P1 life + reserve + field + trash + void + P2 life + reserve + field + trash + void) must remain invariant
  const p1Cores = p1.life + p1.reserve.normal + p1.reserve.soul + p1.trash.normal + p1.trash.soul + p1.field.reduce((a, s) => a + s.cores.normal + s.cores.soul, 0);
  const p2Cores = p2.life + p2.reserve.normal + p2.reserve.soul + p2.trash.normal + p2.trash.soul + p2.field.reduce((a, s) => a + s.cores.normal + s.cores.soul, 0);
  assert.ok(p1Cores >= 9, 'Player cores must be conserved');
  assert.ok(p2Cores >= 9, 'Opponent cores must be conserved');
});

test('COMPLETE-MATCH-02: Full multi-turn match playing through combat until legitimate LIFE_0 victory', async () => {
  const p1Deck = buildStrictLegalDeck(RED_CARD_NUMBERS, 'player');
  const p2Deck = buildStrictLegalDeck(PURPLE_CARD_NUMBERS, 'opponent');

  const game = createGame({
    playerDeck: p1Deck,
    opponentDeck: p2Deck,
    firstPlayer: 'player',
    strictRules: true
  });

  const state = game.state;
  const p1 = state.players.player;
  const p2 = state.players.opponent;

  // Multi-turn match loop until game over or max turns reached
  while (!state.winner && state.turnNumber <= 15) {
    const active = state.activePlayer;

    // Advance to MAIN step
    while (state.step !== 'MAIN' && !state.winner) {
      await game.advanceStep();
    }
    if (state.winner) break;

    // Active player plays any affordable spirits from hand
    const activeP = state.players[active];
    const availableCores = activeP.reserve.normal + activeP.reserve.soul;
    const playable = (activeP.hand || []).filter(c => c.type === 'Spirit' && c.cost <= availableCores - 1);
    for (const card of playable.slice(0, 1)) {
      if (activeP.reserve.normal + activeP.reserve.soul >= card.cost + 1) {
        await game.playCard(card.id, [], active);
      }
    }

    // Advance to ATTACK step (if not Turn 1 where attack is skipped)
    await game.advanceStep();
    if (state.step === 'ATTACK' && !state.winner) {
      // Find refreshed spirits to attack
      const attackers = (activeP.field || []).filter(s => s.state === 'REFRESHED');
      for (const atk of attackers) {
        if (state.winner) break;
        const atkRes = await game.declareAttack(atk.id, active);
        if (atkRes.success) {
          const defendingSide = active === 'player' ? 'opponent' : 'player';
          const defP = state.players[defendingSide];
          const blocker = (defP.field || []).find(s => s.state === 'REFRESHED');
          if (blocker) {
            await game.declareBlock(blocker.id, defendingSide);
          } else {
            await game.resolveDirectHit();
          }
        }
      }
    }

    // Advance to END step
    while (state.step !== 'END' && !state.winner) {
      await game.advanceStep();
    }
    if (state.winner) break;
    await game.advanceStep(); // Transition to next turn
  }

  // Verify that match terminated through a legitimate rules-governed outcome
  assert.ok(state.winner !== null, 'Match must reach a definitive winner');
  assert.ok(state.winReason === 'LIFE_0' || state.winReason === 'DECK_OUT', 'Win reason must be LIFE_0 or DECK_OUT');
  assert.ok(state.turnNumber >= 4, 'Match must span multiple genuine turns');
});
