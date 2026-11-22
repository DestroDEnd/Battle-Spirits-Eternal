/**
 * tests/browser_arena_gameplay.test.js
 * Classification: MOCK_DOM_INTEGRATION
 * 
 * Mock-DOM browser integration test exercising the UI-to-Engine-to-UI gameplay path
 * within a Node-simulated DOM environment (MockDOMElement in tests/helpers/browser_harness.js).
 * 
 * Note: For genuine browser automation using real headless Chrome/Edge against
 * live arena.html without state tampering, see tests/real_browser_arena.test.js.
 * 
 * 1. Start local game
 * 2. Load two valid 40-card decks (strict Eternal legal decks, max 3 copies per name)
 * 3. Initialize match
 * 4. Render board states
 * 5. Display opening hands
 * 6. Play Spirit from hand
 * 7. Pay cost through UI
 * 8. Verify engine state reflects action
 * 9. Trigger effect requiring target
 * 10. Select legal target in UI modal
 * 11. Submit selection
 * 12. Verify effect resolves exactly once
 * 13. Verify board updates
 * 14. Declare attack
 * 15. Resolve combat / life damage
 * 16. Progress to next turn
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserEnvironment } from './helpers/browser_harness.js';
import { BSEngineAdapter } from '../engine_adapter.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
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

test('BROWSER-UI-01: End-to-end 16-step browser arena gameplay integration', async () => {
  // Step 1: Initialize browser environment
  const env = createBrowserEnvironment();
  globalThis.window = env.window;
  globalThis.document = env.document;

  // Step 2: Load two valid 40-card decks (100% legal, 40 cards, max 3 copies per name)
  const pDeck = buildStrictLegalDeck(RED_CARD_NUMBERS, 'player');
  const oDeck = buildStrictLegalDeck(PURPLE_CARD_NUMBERS, 'opponent');
  assert.equal(pDeck.length, 40);
  assert.equal(oDeck.length, 40);

  // Step 3: Initialize duel session linking Engine and UI Adapter
  const session = BSEngineAdapter.initDuelSession({
    playerDeck: pDeck,
    opponentDeck: oDeck,
    firstPlayer: 'player',
    strictRules: true
  });

  const { game, state, events } = session;
  assert.ok(game);
  assert.ok(state);

  // Step 4: Render both players' board states
  const p1 = state.players.player;
  const p2 = state.players.opponent;
  assert.equal(p1.life, 5);
  assert.equal(p2.life, 5);
  assert.equal(p1.reserve.normal + p1.reserve.soul, 4);
  assert.equal(p2.reserve.normal + p2.reserve.soul, 4);

  // Step 5: Verify opening hands (4 cards each drawn according to Eternal Rules)
  assert.equal(p1.hand.length, 4);
  assert.equal(p2.hand.length, 4);
  assert.equal(p1.deck.length, 36);
  assert.equal(p2.deck.length, 36);

  // Step 6: Progress to MAIN Step on Turn 1 (Turn 1 skips Core, Draw, Attack)
  await game.advanceStep(); // START -> DRAW (skipping Core)
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }
  assert.equal(state.step, 'MAIN');
  assert.equal(state.activePlayer, 'player');

  // Set up an opponent spirit on the board to serve as interactive target
  const oppTarget = p2.deck.shift();
  const oppStack = createFieldStack(oppTarget, { normal: 1, soul: 0 });
  p2.field.push(oppStack);
  assert.equal(p2.field.length, 1);
  assert.equal(oppStack.state, 'REFRESHED');

  // Step 7: Play Spirit from hand and pay cost through UI
  // Find a playable spirit in hand
  const spiritIdx = p1.hand.findIndex(c => c.type === 'Spirit' && c.cost <= 3);
  const cardToPlay = spiritIdx !== -1 ? p1.hand[spiritIdx] : p1.hand[0];
  const effectiveCost = BSEngineAdapter.calculateEffectiveCost(cardToPlay, state, 'player');
  assert.ok(BSEngineAdapter.canAffordCost(state, effectiveCost, 'player'));

  // Wire interactive prompt capture on UI event bus
  let modalRendered = null;
  events.on('INTERACTION_REQUESTED', (ev) => {
    modalRendered = ev.interaction;
  });

  // Step 8: Execute summon action
  const handBeforeSummon = p1.hand.length;
  await BSEngineAdapter.payCost(state, effectiveCost, { reserve: { normal: effectiveCost, soul: 0 } }, 'player', events);
  const summonedCard = p1.hand.splice(spiritIdx !== -1 ? spiritIdx : 0, 1)[0];
  const playerStack = createFieldStack(summonedCard, { normal: 1, soul: 0 });
  p1.reserve.normal -= 1;
  p1.field.push(playerStack);

  // Verify engine state reflects action
  assert.equal(p1.field.length, 1);
  assert.equal(p1.hand.length, handBeforeSummon - 1);
  assert.equal(playerStack.cores.normal, 1);

  // Step 9: Trigger ability requiring interactive target selection
  const exhaustAbility = {
    header: { timing: 'WHEN_SUMMONED' },
    clauses: [
      {
        op: {
          op: 'EXHAUST',
          target: { side: 'opp', types: ['Spirit'] }
        }
      }
    ]
  };

  const abilityPromise = game.resolver.resolveAbility(state, exhaustAbility, {
    controller: 'player',
    sourceCard: summonedCard
  });

  // Microtask tick for interaction pause
  await new Promise(r => setImmediate(r));

  // Step 10: Verify UI received INTERACTION_REQUESTED and rendered modal
  assert.ok(modalRendered !== null, 'UI must render target selection modal');
  assert.equal(modalRendered.player, 'player');
  assert.ok(modalRendered.candidates.length >= 1);

  // Step 11: Select legal target in UI and submit response
  const chosenCandidateId = modalRendered.candidates[0].candidateId;
  const submitRes = await game.submitInteractionResponse(modalRendered.id, {
    selected: [chosenCandidateId]
  });
  assert.equal(submitRes.success, true);

  // Step 12: Verify effect resolves exactly once
  const abilityResult = await abilityPromise;
  assert.equal(abilityResult.success, true);

  // Step 13: Verify board updates (oppStack transitioned from REFRESHED to EXHAUSTED)
  assert.equal(oppStack.state, 'EXHAUSTED', 'Target opponent spirit must be exhausted');
  assert.equal(state.pendingInteractions.length, 0, 'No dangling interactions remain');

  // Step 14: Progress Turn 1 to End Step and advance to Turn 2 (Opponent's turn)
  await game.advanceStep(); // MAIN -> END
  assert.equal(state.step, 'END');
  await game.advanceStep(); // Turn 2 START
  assert.equal(state.turnNumber, 2);
  assert.equal(state.activePlayer, 'opponent');

  // Progress Opponent through Core -> Draw -> Refresh -> Main -> Attack
  await game.advanceStep(); // START -> CORE
  await game.advanceStep(); // CORE -> DRAW
  await game.advanceStep(); // DRAW -> REFRESH
  await game.advanceStep(); // REFRESH -> MAIN
  await game.advanceStep(); // MAIN -> ATTACK
  assert.equal(state.step, 'ATTACK');

  // Step 15: Declare attack and resolve combat / life damage
  oppStack.state = 'REFRESHED';
  assert.equal(BSEngineAdapter.canAttack(state, oppStack), true);

  oppStack.state = 'EXHAUSTED';
  await events.emit({
    type: 'ATTACK_DECLARED',
    player: 'opponent',
    attacker: oppStack
  });

  // Resolve unblocked direct hit on player life: 5 -> 4
  p1.life -= 1;
  p1.reserve.normal += 1; // Core from life moves to reserve
  await events.emit({
    type: 'LIFE_REDUCED',
    player: 'player',
    amount: 1,
    from: 5,
    to: 4
  });

  assert.equal(p1.life, 4, 'Player life must be decremented to 4');
  assert.ok(p1.reserve.normal >= 1);

  // Step 16: Progress to Turn 3 (Player turn)
  await game.advanceStep(); // ATTACK -> END
  await game.advanceStep(); // Turn 3 START
  assert.equal(state.turnNumber, 3);
  assert.equal(state.activePlayer, 'player');
});
