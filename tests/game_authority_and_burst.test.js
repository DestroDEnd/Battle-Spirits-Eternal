import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { AIDecider } from '../engine/ai.js';
import { createMatchContext, EXECUTION_MODES, PLAYER_CONTROL_TYPES } from '../engine/session_mode.js';

test('AUTH-01: AIDecider refuses to answer human-owned prompts and evaluates AI Burst strategically', async () => {
  const ai = new AIDecider({ side: 'opponent' });
  const matchContext = createMatchContext({
    mode: EXECUTION_MODES.HUMAN_VS_AI,
    player1: { id: 'h1', name: 'Human', controlType: PLAYER_CONTROL_TYPES.HUMAN },
    player2: { id: 'ai1', name: 'AI', controlType: PLAYER_CONTROL_TYPES.AI }
  });
  const game = createGame({ interactive: true, matchContext, ai, strictRules: false, unsafeTestBypassDeckValidation: true });

  // AI must return null if asked to decide for 'player' (human)
  const humanLeak = await ai.decide({ type: 'BURST_TRIGGER', chooser: 'player', decisionOwner: 'player' }, game.state);
  assert.equal(humanLeak, null, 'AI must never answer a human-owned prompt');

  // In HUMAN_VS_HUMAN, AI must return null even for 'opponent'
  const pvpCtx = createMatchContext({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'P1', controlType: PLAYER_CONTROL_TYPES.HUMAN },
    player2: { id: 'p2', name: 'P2', controlType: PLAYER_CONTROL_TYPES.HUMAN }
  });
  const pvpGame = createGame({ interactive: true, matchContext: pvpCtx, ai, strictRules: false, unsafeTestBypassDeckValidation: true });
  const pvpLeak = await ai.decide({ type: 'BURST_TRIGGER', chooser: 'opponent', decisionOwner: 'opponent' }, pvpGame.state);
  assert.equal(pvpLeak, null, 'AI must never answer in HUMAN_VS_HUMAN');

  // AI can activate or hold its own Burst in HUMAN_VS_AI
  const aiActivate = await ai.decide({
    type: 'BURST_TRIGGER',
    chooser: 'opponent',
    burstCard: { name: 'Burst Dragon', effect: '[Burst: After your Life is reduced] Draw 2 cards.' }
  }, game.state);
  assert.equal(aiActivate.activate, true);

  const aiHold = await ai.decide({
    type: 'BURST_TRIGGER',
    chooser: 'opponent',
    strategy: 'hold',
    burstCard: { name: 'Burst Dragon', effect: '[Burst: After your Life is reduced] Draw 2 cards.' }
  }, game.state);
  assert.equal(aiHold.activate, false);
});

test('AUTH-02: Human Burst on opponent summon pauses resolution until human responds (Lord Dragon Bazzel / Burst window)', async () => {
  const matchContext = createMatchContext({
    mode: EXECUTION_MODES.HUMAN_VS_AI,
    player1: { id: 'h1', name: 'Human', controlType: PLAYER_CONTROL_TYPES.HUMAN },
    player2: { id: 'ai1', name: 'AI', controlType: PLAYER_CONTROL_TYPES.AI }
  });
  const ai = new AIDecider({ side: 'opponent' });
  const game = createGame({ interactive: true, matchContext, ai, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;

  // Set a human Burst that triggers on opponent summon/life
  const humanBurst = createCardInstance({
    id: 'hb_1',
    card_number: 'BS01-B1',
    name: 'Human Counter Burst',
    type: 'Magic',
    effect: '[Burst: After an opposing Spirit is summoned] Draw 1 card.'
  }, 'player');
  humanBurst.compiledIr = {
    abilities: [{
      header: { timing: 'BURST', burstCondition: 'AFTER_OPPONENT_SUMMON' },
      clauses: [{ op: { op: 'DRAW', count: 1 } }]
    }]
  };
  state.players.player.burst = humanBurst;
  state.players.player.deck.push(createCardInstance({ id: 'd_draw', card_number: 'D1', name: 'Drawn Card', type: 'Spirit' }, 'player'));
  state.activePlayer = 'opponent';

  const oppSpirit = createCardInstance({ id: 'opp_s1', card_number: 'OP-1', name: 'Summoned Dragon', type: 'Spirit' }, 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit, { normal: 1, soul: 0 }));

  let dependentLifeDamageApplied = false;
  const summonPromise = game.events.emit({
    type: 'SUMMONED',
    player: 'opponent',
    card: oppSpirit
  }).then(() => {
    // Dependent subsequent action after summon event completes
    dependentLifeDamageApplied = true;
  });

  await new Promise(r => setImmediate(r));
  assert.equal(dependentLifeDamageApplied, false, 'Dependent action must pause while human Burst prompt is pending');
  assert.ok(game.state.pendingInteractions.length >= 1, 'Pending Burst interaction must exist');
  const burstInter = game.state.pendingInteractions.find(i => i.decisionOwner === 'player');
  assert.ok(burstInter, 'Pending Burst interaction must be owned by player');

  // Opponent AI must NOT be able to answer human's pending Burst
  const hijack = game.interactionController.respond(
    burstInter.id,
    { declined: true, player: 'opponent' },
    { playerId: 'ai1', responder: 'opponent' }
  );
  assert.equal(hijack.success, false, 'Opponent cannot answer player Burst');
  assert.equal(dependentLifeDamageApplied, false);

  // Human declines Burst -> resolution resumes cleanly without activating Burst
  const humanDecline = game.interactionController.respond(
    burstInter.id,
    { declined: true, player: 'player' },
    { playerId: 'h1', responder: 'player' }
  );
  assert.equal(humanDecline.success, true);

  await summonPromise;
  assert.equal(dependentLifeDamageApplied, true, 'Resolution must resume after human responds');
  assert.ok(state.players.player.burst !== null, 'Declined Burst must remain set');
});

test('AUTH-03: HUMAN_VS_HUMAN routes prompts exclusively to each owner with zero AI fallback', async () => {
  const matchContext = createMatchContext({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Alice', controlType: PLAYER_CONTROL_TYPES.HUMAN },
    player2: { id: 'p2', name: 'Bob', controlType: PLAYER_CONTROL_TYPES.HUMAN }
  });
  // Even if an AI instance is passed in options, HUMAN_VS_HUMAN must NEVER invoke it
  const ai = new AIDecider({ side: 'opponent' });
  const game = createGame({ interactive: true, matchContext, ai, strictRules: false, unsafeTestBypassDeckValidation: true });

  const p2PromptPromise = game.resolver.promptResolver.choose({
    type: 'CONFIRM_OPTIONAL',
    title: 'Bob Optional Effect',
    chooser: 'opponent',
    optional: true
  });

  await new Promise(r => setImmediate(r));
  assert.equal(game.state.pendingInteractions.length, 1);
  assert.equal(game.state.pendingInteractions[0].decisionOwner, 'opponent');

  // Player 1 cannot answer Player 2's prompt
  const p1Hijack = game.interactionController.respond(
    game.state.pendingInteractions[0].id,
    { accepted: true, player: 'player' },
    { playerId: 'p1', responder: 'player' }
  );
  assert.equal(p1Hijack.success, false);

  // Player 2 answers their own prompt
  const p2Accept = game.interactionController.respond(
    game.state.pendingInteractions[0].id,
    { accepted: true, player: 'opponent' },
    { playerId: 'p2', responder: 'opponent' }
  );
  assert.equal(p2Accept.success, true, `Expected p2Accept success, got: ${JSON.stringify(p2Accept)}`);
  const res = await p2PromptPromise;
  assert.equal(res.accepted, true);
});
