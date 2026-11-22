/**
 * tests/phase_l1_player_authority_adversarial.test.js
 * 
 * Battle Spirits Eternal — Phase L.1 Comprehensive Verification Battery:
 * - Part I1: Execution Modes (HUMAN_VS_HUMAN, HUMAN_VS_AI, AI_VS_AI, HEADLESS_SIMULATION, Invalid/Missing)
 * - Part I2: Human PvP Autonomy & AI Isolation (Zero AI in PvP, Player A & B ownership, Blocker, Core, Branch)
 * - Part I3: Trusted Responder Authentication & Security (Anti-impersonation, anti-replay, match isolation)
 * - Part I4: Candidate Validation & State Revalidation (Pool membership, empty pool, duplicates, stale target)
 * - Part I5: Resolver Suspension, Nested Decisions & Lifecycle Integrity
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXECUTION_MODES,
  PLAYER_CONTROL_TYPES,
  MatchContext,
  createMatchContext
} from '../engine/session_mode.js';
import {
  createInteractionRequest,
  validateInteractionResponse,
  InteractionController,
  INTERACTION_TYPES,
  INTERACTION_STATUS
} from '../engine/interaction.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { AsyncResolver } from '../engine/resolver.js';

// ============================================================================
// PART I1: EXECUTION MODES
// ============================================================================

test('TC-L1-M01: Validates all 4 standard execution modes with explicit configurations', () => {
  const hvh = createMatchContext({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });
  assert.equal(hvh.mode, EXECUTION_MODES.HUMAN_VS_HUMAN);
  assert.equal(hvh.isHuman('player'), true);
  assert.equal(hvh.isHuman('opponent'), true);
  assert.equal(hvh.canAiDecide('player'), false);
  assert.equal(hvh.canAiDecide('opponent'), false);

  const hvai = createMatchContext({ mode: EXECUTION_MODES.HUMAN_VS_AI });
  assert.equal(hvai.mode, EXECUTION_MODES.HUMAN_VS_AI);
  assert.equal(hvai.isHuman('player'), true);
  assert.equal(hvai.isAi('opponent'), true);
  assert.equal(hvai.canAiDecide('player'), false);
  assert.equal(hvai.canAiDecide('opponent'), true);

  const aivai = createMatchContext({ mode: EXECUTION_MODES.AI_VS_AI });
  assert.equal(aivai.mode, EXECUTION_MODES.AI_VS_AI);
  assert.equal(aivai.isAi('player'), true);
  assert.equal(aivai.isAi('opponent'), true);
  assert.equal(aivai.canAiDecide('player'), true);
  assert.equal(aivai.canAiDecide('opponent'), true);

  const sim = createMatchContext({ mode: EXECUTION_MODES.HEADLESS_SIMULATION });
  assert.equal(sim.mode, EXECUTION_MODES.HEADLESS_SIMULATION);
  assert.equal(sim.isSimulation('player'), true);
  assert.equal(sim.isSimulation('opponent'), true);
  assert.equal(sim.canSimulate('player'), true);
  assert.equal(sim.canSimulate('opponent'), true);
});

test('TC-L1-M02: Rejects invalid execution mode strings safely', () => {
  assert.throws(
    () => createMatchContext({ mode: 'SUPER_AI_MODE' }),
    /INVALID_EXECUTION_MODE/
  );
  assert.throws(
    () => createMatchContext({ mode: 'UNCONFIGURED_PVP' }),
    /INVALID_EXECUTION_MODE/
  );
});

test('TC-L1-M03: Missing execution mode safely defaults to HEADLESS_SIMULATION without AI privilege', () => {
  const ctx = createMatchContext();
  assert.equal(ctx.mode, EXECUTION_MODES.HEADLESS_SIMULATION);
  assert.equal(ctx.canAiDecide('player'), false);
  assert.equal(ctx.canAiDecide('opponent'), false);
});

test('TC-L1-M04: Rejects invalid player control types', () => {
  assert.throws(
    () => createMatchContext({
      mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
      players: { player: { controlType: 'GOD_MODE' } }
    }),
    /INVALID_PLAYER_CONTROL_TYPE/
  );
});

// ============================================================================
// PART I2: HUMAN PvP AUTONOMY & AI DECISION ISOLATION
// ============================================================================

test('TC-L1-P01: In HUMAN_VS_HUMAN, AI provider is NEVER invoked for either player', async () => {
  let aiCalled = false;
  const matchCtx = createMatchContext({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });
  const state = createGameState([], [], 'player', { matchContext: matchCtx });

  const controller = new InteractionController(state, null, {
    aiDecisionProvider: () => {
      aiCalled = true;
      return { accepted: true };
    }
  });

  // Player A prompt
  let resolvedP1 = false;
  controller.request({
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'cand_1' }]
  }).then(() => { resolvedP1 = true; });

  // Player B prompt
  let resolvedP2 = false;
  controller.request({
    decisionOwner: 'opponent',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'cand_2' }]
  }).then(() => { resolvedP2 = true; });

  await new Promise(r => setTimeout(r, 40));
  assert.equal(aiCalled, false, 'AI decision provider must NEVER be invoked in HUMAN_VS_HUMAN mode');
  assert.equal(resolvedP1, false, 'Player 1 interaction must remain suspended');
  assert.equal(resolvedP2, false, 'Player 2 interaction must remain suspended');
});

test('TC-L1-P02: In HUMAN_VS_AI, AI provider is ONLY invoked for AI decisions, never for Human decisions', async () => {
  let aiInvocationCount = 0;
  let aiInvokedFor = null;

  const matchCtx = createMatchContext({ mode: EXECUTION_MODES.HUMAN_VS_AI });
  const state = createGameState([], [], 'player', { matchContext: matchCtx });

  const controller = new InteractionController(state, null, {
    aiDecisionProvider: (req) => {
      aiInvocationCount++;
      aiInvokedFor = req.decisionOwner;
      return { accepted: true, selected: ['c_ai_1'] };
    }
  });

  // Human decision request (Player A)
  let humanResolved = false;
  const humanPromise = controller.request({
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'c_human_1' }]
  }).then(() => { humanResolved = true; });

  await new Promise(r => setTimeout(r, 30));
  assert.equal(humanResolved, false, 'Human decision must remain suspended waiting for player');
  assert.equal(aiInvocationCount, 0, 'AI must not be invoked for human player decision');

  // AI decision request (Player B / Opponent)
  const aiResult = await controller.request({
    decisionOwner: 'opponent',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'c_ai_1' }]
  });

  assert.equal(aiInvocationCount, 1, 'AI must be invoked for AI-controlled decision');
  assert.equal(aiInvokedFor, 'opponent', 'AI must only decide for opponent');
  assert.deepEqual(aiResult.selected, ['c_ai_1']);
});

test('TC-L1-P03: Opponent-owned decision routes to opponent, effect controller cannot answer for opponent', () => {
  const matchCtx = createMatchContext({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    requireAuth: true
  });
  const state = createGameState([], [], 'player', { matchContext: matchCtx });

  // Player A casts effect that instructs Player B (opponent) to discard 1 card
  const prompt = createInteractionRequest({
    matchId: matchCtx.matchId,
    requestingPlayer: 'player', // Effect activated by Player A
    decisionOwner: 'opponent',   // Decision owned by Player B!
    requestType: 'SELECT_CARDS',
    candidates: [{ candidateId: 'card_b1', zone: 'hand' }],
    minSelections: 1,
    maxSelections: 1,
    optional: false
  });

  // Attempt 1: Player A (effect controller) tries to answer Player B's decision
  const illegalResp = validateInteractionResponse(prompt, {
    player: 'player',
    selected: ['card_b1']
  }, state, {
    matchId: matchCtx.matchId,
    responder: 'player',
    authToken: matchCtx.players.player.authToken
  });

  assert.equal(illegalResp.valid, false);
  assert.match(illegalResp.reason, /UNAUTHORIZED_RESPONDER/);

  // Attempt 2: Player B (authorized decision owner) answers their own prompt
  const legalResp = validateInteractionResponse(prompt, {
    player: 'opponent',
    selected: ['card_b1']
  }, state, {
    matchId: matchCtx.matchId,
    responder: 'opponent',
    authToken: matchCtx.players.opponent.authToken
  });

  assert.equal(legalResp.valid, true);
  assert.deepEqual(legalResp.value.selected, ['card_b1']);
});

// ============================================================================
// PART I3: TRUSTED RESPONDER AUTHENTICATION & SECURITY
// ============================================================================

test('TC-L1-A01: Rejects response when claimed player identity attempts to spoof different from authenticated token', () => {
  const matchCtx = createMatchContext({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    requireAuth: true
  });
  const state = createGameState([], [], 'player', { matchContext: matchCtx });

  const prompt = createInteractionRequest({
    matchId: matchCtx.matchId,
    decisionOwner: 'player',
    requestType: 'CONFIRM_ACTION',
    optional: true
  });

  // Malicious submission: claims to be 'player' in body, but authenticated as 'opponent'
  const spoofed = validateInteractionResponse(prompt, {
    player: 'player',
    accepted: true
  }, state, {
    matchId: matchCtx.matchId,
    responder: 'opponent',
    authToken: matchCtx.players.opponent.authToken
  });

  assert.equal(spoofed.valid, false);
  assert.match(spoofed.reason, /IMPERSONATION_ATTEMPT_DETECTED|UNAUTHORIZED_RESPONDER/);
});

test('TC-L1-A02: Rejects response when matchId does not match active match context', () => {
  const matchCtx = createMatchContext({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });
  const state = createGameState([], [], 'player', { matchContext: matchCtx });

  const prompt = createInteractionRequest({
    matchId: matchCtx.matchId,
    decisionOwner: 'player',
    requestType: 'CONFIRM_ACTION',
    optional: true
  });

  const wrongMatch = validateInteractionResponse(prompt, {
    accepted: true
  }, state, {
    matchId: 'DIFFERENT_MATCH_999',
    responder: 'player',
    authToken: matchCtx.players.player.authToken
  });

  assert.equal(wrongMatch.valid, false);
  assert.match(wrongMatch.reason, /MATCH_MISMATCH/);
});

test('TC-L1-A03: Anti-replay protection prevents duplicate or concurrent responses to same interaction', () => {
  const controller = new InteractionController(null, null);

  let p1Done = false;
  controller.request({
    id: 'irq-replay-01',
    decisionOwner: 'player',
    requestType: 'CONFIRM_ACTION',
    optional: true
  }).then(() => { p1Done = true; });

  // First resolution succeeds
  const res1 = controller.respond('irq-replay-01', { accepted: true, declined: false });
  assert.equal(res1.success, true);
  assert.equal(res1.status, INTERACTION_STATUS.RESOLVED);

  // Duplicate resolution attempt is rejected
  const res2 = controller.respond('irq-replay-01', { accepted: false, declined: true });
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ALREADY_RESOLVED_OR_STALE');
});

// ============================================================================
// PART I4: CANDIDATE VALIDATION & CURRENT STATE REVALIDATION
// ============================================================================

test('TC-L1-C01: Rejects candidate not issued by engine in candidate pool', () => {
  const prompt = createInteractionRequest({
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'legit_spirit_1' }, { candidateId: 'legit_spirit_2' }],
    minSelections: 1,
    maxSelections: 1,
    optional: false
  });

  const res = validateInteractionResponse(prompt, {
    selected: ['fabricated_card_999']
  });

  assert.equal(res.valid, false);
  assert.match(res.reason, /ILLEGAL_CANDIDATE_SELECTED/);
});

test('TC-L1-C02: Rejects candidate selection attempted from an empty candidate pool', () => {
  const prompt = createInteractionRequest({
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [], // empty pool
    minSelections: 0,
    maxSelections: 1,
    optional: true
  });

  const res = validateInteractionResponse(prompt, {
    selected: ['phantom_target']
  });

  assert.equal(res.valid, false);
  assert.match(res.reason, /Cannot select candidates from an empty candidate pool/);
});

test('TC-L1-C03: Rejects duplicate candidate selection when exact/multiple distinct targets required', () => {
  const prompt = createInteractionRequest({
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'unit_a' }, { candidateId: 'unit_b' }],
    minSelections: 2,
    maxSelections: 2,
    optional: false
  });

  const res = validateInteractionResponse(prompt, {
    selected: ['unit_a', 'unit_a'] // Duplicate selection of unit_a
  });

  assert.equal(res.valid, false);
  assert.match(res.reason, /DUPLICATE_CANDIDATE_SELECTED/);
});

test('TC-L1-C04: Revalidates candidate against current state; rejects if target destroyed before response', () => {
  const state = createGameState([], [], 'player');

  // Place a spirit on field stack
  const card = createCardInstance({ id: 'card_target', name: 'Field Dragon' }, 'opponent');
  const stack = createFieldStack(card);
  state.players.opponent.field.push(stack);

  const prompt = createInteractionRequest({
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: stack.id, cardId: card.id, zone: 'field', side: 'opponent' }],
    minSelections: 1,
    maxSelections: 1,
    optional: false
  });

  // State mutation occurs while prompt was pending: Target is destroyed and moved to trash!
  state.players.opponent.field = [];
  state.players.opponent.trashCards = [card];

  // Player now submits old selection for the destroyed target
  const res = validateInteractionResponse(prompt, {
    selected: [stack.id]
  }, state);

  assert.equal(res.valid, false);
  assert.match(res.reason, /CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE/);
  assert.match(res.reason, /no longer in expected zone "field"/);
});

// ============================================================================
// PART I5: RESOLVER INTEGRITY & NESTED INTERACTIONS
// ============================================================================

test('TC-L1-R01: Nested interactions suspend and resolve in correct stack order without context loss', async () => {
  const controller = new InteractionController(null, null);

  let outerResolved = false;
  let innerResolved = false;
  let resolutionTrace = [];

  // Outer effect starts: Choose Mode
  const outerPromise = controller.request({
    id: 'irq-outer-01',
    decisionOwner: 'player',
    requestType: 'SELECT_MODE',
    options: ['DESTROY_SPIRIT', 'DRAW_CARDS']
  }).then(async (modeChoice) => {
    resolutionTrace.push(`outer_mode_${modeChoice.option}`);
    
    // Nested effect triggered by chosen mode: Select Target for Destruction
    const innerPromise = controller.request({
      id: 'irq-inner-02',
      decisionOwner: 'player',
      requestType: 'SELECT_TARGET',
      candidates: [{ candidateId: 'opp_dragon_1' }]
    }).then((tgtChoice) => {
      resolutionTrace.push(`inner_target_${tgtChoice.selected[0]}`);
      innerResolved = true;
      return tgtChoice;
    });

    await innerPromise;
    outerResolved = true;
    return modeChoice;
  });

  await new Promise(r => setTimeout(r, 20));
  assert.equal(outerResolved, false);
  assert.equal(innerResolved, false);

  // 1. Resolve Outer interaction with chosen mode 'DESTROY_SPIRIT'
  controller.respond('irq-outer-01', { option: 'DESTROY_SPIRIT' });
  await new Promise(r => setTimeout(r, 20));

  assert.equal(resolutionTrace[0], 'outer_mode_DESTROY_SPIRIT');
  assert.equal(innerResolved, false, 'Inner interaction must now be pending');

  // 2. Resolve Inner interaction with chosen target
  controller.respond('irq-inner-02', { selected: ['opp_dragon_1'] });
  await outerPromise;

  assert.equal(innerResolved, true);
  assert.equal(outerResolved, true);
  assert.deepEqual(resolutionTrace, [
    'outer_mode_DESTROY_SPIRIT',
    'inner_target_opp_dragon_1'
  ]);
});

test('TC-L1-R02: Mandatory interaction cannot be declined or cancelled', () => {
  const controller = new InteractionController(null, null);

  controller.request({
    id: 'irq-mandatory-01',
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'must_kill_this' }],
    minSelections: 1,
    maxSelections: 1,
    optional: false // Mandatory!
  });

  // Attempting to cancel fails
  const cancelRes = controller.cancel('irq-mandatory-01');
  assert.equal(cancelRes.success, false);
  assert.equal(cancelRes.reason, 'CANNOT_CANCEL_MANDATORY_INTERACTION');

  // Attempting to decline fails
  const declineRes = controller.respond('irq-mandatory-01', { declined: true });
  assert.equal(declineRes.success, false);
  assert.equal(declineRes.reason, 'CANNOT_CANCEL_MANDATORY_INTERACTION');
});
