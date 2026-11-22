/**
 * tests/phase_m_security_and_authority.test.js
 * 
 * Phase M Work Package D: Player Authority, Authentication & Adversarial Security.
 * Verifies mandatory token enforcement, anti-impersonation, anti-replay,
 * cross-match isolation, and private information protection.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { redactGameStateForViewer } from '../engine/state_serialization.js';
import { createCardInstance, createGameState } from '../engine/state.js';
import { EXECUTION_MODES } from '../engine/session_mode.js';
import { INTERACTION_TYPES } from '../engine/interaction.js';

test('TC-M-S01: Missing authentication token is strictly rejected with AUTHENTICATION_REQUIRED', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Action without authToken
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }, {}); // Empty auth context
    },
    /AUTHENTICATION_REQUIRED/
  );

  // Reconnect without authToken
  await assert.rejects(
    async () => {
      await manager.reconnectToMatch(match.matchId, null);
    },
    /AUTHENTICATION_REQUIRED/
  );
});

test('TC-M-S02: Invalid or forged authentication token is rejected with INVALID_AUTH_TOKEN', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Action with invalid token
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }, { authToken: 'forged_fake_token_123' });
    },
    /INVALID_AUTH_TOKEN/
  );

  // Reconnect with invalid token
  await assert.rejects(
    async () => {
      await manager.reconnectToMatch(match.matchId, 'forged_fake_token_123');
    },
    /INVALID_AUTH_TOKEN/
  );
});

test('TC-M-S03: Attempted opponent impersonation is detected and blocked', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Alice attempts to submit an action claiming to be Bob
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'STEP_ADVANCE',
        step: 'MAIN',
        responder: 'opponent', // Claiming opponent side
        player: 'bob'          // Claiming bob's id
      }, { authToken: match.player1Token }); // But using Alice's token!
    },
    /IMPERSONATION_ATTEMPT_DETECTED/
  );
});

test('TC-M-S04: Cross-match action rejection: Token from Match A cannot act in Match B', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const matchA = await manager.createMatch({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });
  const matchB = await manager.createMatch({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });

  // Use Match A's player1 token against Match B
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(matchB.matchId, {
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }, { authToken: matchA.player1Token });
    },
    /INVALID_AUTH_TOKEN/
  );
});

test('TC-M-S05: Replayed action ID is rejected as duplicate without executing twice', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  const fixedActionId = 'act_unique_12345';
  const action = {
    actionId: fixedActionId,
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  };

  // First execution: Success
  const res1 = await manager.submitPlayerAction(match.matchId, action, { authToken: match.player1Token });
  assert.equal(res1.success, true);

  // Second execution with same actionId: Rejected as duplicate
  const res2 = await manager.submitPlayerAction(match.matchId, action, { authToken: match.player1Token });
  assert.equal(res2.success, false);
  assert.equal(res2.duplicate, true);
});

test('TC-M-S06: Stale match version rejected with optimistic concurrency conflict', async () => {
  const store = new SessionStore({ inMemory: true });

  const matchData = {
    id: 'stale_test_match',
    mode: 'HUMAN_VS_HUMAN',
    status: 'ACTIVE',
    player1: { id: 'p1', name: 'P1', controlType: 'HUMAN', authToken: 'tok1' },
    player2: { id: 'p2', name: 'P2', controlType: 'HUMAN', authToken: 'tok2' },
    state: { turn: 1 },
    version: 1
  };

  store.saveSession(matchData);

  // Update version 1 -> 2
  store.updateSessionState('stale_test_match', { turn: 2 }, 1);

  // Attempt to update again claiming expected version was 1 (stale state!)
  assert.throws(
    () => {
      store.updateSessionState('stale_test_match', { turn: 3 }, 1);
    },
    /STALE_VERSION_CONFLICT/
  );
});

test('TC-M-S07: Private state redaction: Opponent hand, deck order, and face-down burst are masked', async () => {
  const card1 = createCardInstance({ name: 'Secret Dragon', cost: 7, colors: ['Red'] }, 'player');
  const card2 = createCardInstance({ name: 'Hidden Assassin', cost: 3, colors: ['Purple'] }, 'opponent');
  const burstCard = createCardInstance({ name: 'Surprise Trap', isBurst: true }, 'opponent');

  const state = createGameState([card1], [card2], 'player', { mode: 'HUMAN_VS_HUMAN' });
  state.players.player.hand.push(card1);
  state.players.opponent.hand.push(card2);
  state.players.opponent.burst = burstCard;

  // View for Player 1
  const player1View = redactGameStateForViewer(state, 'player');

  // Player 1's hand is visible to Player 1
  assert.equal(player1View.players.player.hand[0].name, 'Secret Dragon');

  // Opponent's hand is MASKED to Player 1
  assert.equal(player1View.players.opponent.hand[0].masked, true);
  assert.equal(player1View.players.opponent.hand[0].name, 'Hidden Card');
  assert.equal(player1View.players.opponent.hand[0].cardNumber, 'HIDDEN');

  // Opponent's burst is MASKED to Player 1
  assert.equal(player1View.players.opponent.burst.masked, true);
  assert.equal(player1View.players.opponent.burst.isSet, true);
  assert.equal(player1View.players.opponent.burst.name, undefined);

  // Opponent's deck is MASKED
  assert.equal(player1View.players.opponent.deck[0].masked, true);
});

test('TC-M-S08: Spectator view masks private information for BOTH players', async () => {
  const card1 = createCardInstance({ name: 'Red Dragon', cost: 4 }, 'player');
  const card2 = createCardInstance({ name: 'Purple Spirit', cost: 4 }, 'opponent');

  const state = createGameState([card1], [card2], 'player', { mode: 'HUMAN_VS_HUMAN' });
  state.players.player.hand.push(card1);
  state.players.opponent.hand.push(card2);

  // Spectator view (viewerSide = null or 'spectator')
  const spectatorView = redactGameStateForViewer(state, 'spectator');

  assert.equal(spectatorView.players.player.hand[0].masked, true);
  assert.equal(spectatorView.players.opponent.hand[0].masked, true);
});

test('TC-M-S09: Client cannot manipulate or extend the server turn clock', async () => {
  let simTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  simTime += 50000; // 190s left on server

  // Client attempts to pass a fake deadline or remainingMs in action payload
  await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    step: 'MAIN',
    remainingMs: 9999999,
    deadlineMs: 999999999
  }, { authToken: match.player1Token });

  // Server clock must NOT have been changed by client values!
  const clock = manager.getClockState(match.matchId);
  assert.equal(clock.remainingMs, 190000, 'Server clock must remain authoritative');
});

test('TC-M-S10: Unauthorized player cannot trigger forfeit for opponent', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Alice calls forfeit: she forfeits herself, making Bob the winner!
  const res = await manager.forfeitMatch(match.matchId, match.player1Token);
  assert.equal(res.status, 'FORFEITED');
  assert.equal(res.winner, 'opponent');
  assert.equal(res.winnerId, 'bob');
});
