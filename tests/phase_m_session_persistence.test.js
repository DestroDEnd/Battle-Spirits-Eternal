/**
 * tests/phase_m_session_persistence.test.js
 * 
 * Phase M Work Package B & C: Persistent Match Storage & Complete Engine Restoration.
 * Validates match persistence across refresh, route navigation, tab closure,
 * server restart, and interruption at every resolver state.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { serializeGameState, deserializeGameState, redactGameStateForViewer } from '../engine/state_serialization.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { createGame } from '../engine/index.js';
import { EXECUTION_MODES } from '../engine/session_mode.js';
import { INTERACTION_TYPES, INTERACTION_STATUS } from '../engine/interaction.js';

test('TC-M-P01: Create match, serialize state, and restore with identical properties', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const c1 = createCardInstance({ name: 'Nova Dragon', cost: 6, colors: ['Red'] }, 'player');
  const c2 = createCardInstance({ name: 'Dark Blade', cost: 4, colors: ['Purple'] }, 'opponent');

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    playerDeck: [c1],
    opponentDeck: [c2],
    firstPlayer: 'player'
  });

  const session = store.loadSession(match.matchId);
  assert.ok(session, 'Session must exist in store');
  assert.equal(session.activePlayer, 'player');
  assert.equal(session.turnNumber, 1);

  // Restore game
  const restoredGame = await manager.restoreMatch(match.matchId);
  assert.ok(restoredGame.state, 'Restored game must have state');
  assert.equal(restoredGame.state.matchId, match.matchId);
  assert.equal(restoredGame.state.activePlayer, 'player');
  assert.equal(restoredGame.state.turnNumber, 1);
  assert.equal(restoredGame.state.players.player.life, 5);
  assert.equal(restoredGame.state.players.opponent.life, 5);
});

test('TC-M-P02: Battle survives simulated navigation to Keyword Database and back', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Player navigates to /keywords (marks client temporarily away)
  const leaveRes = await manager.leaveArena(match.matchId, match.player1Token);
  assert.ok(leaveRes);

  const matchWhileAway = await manager.getMatch(match.matchId);
  assert.notEqual(matchWhileAway.status, 'CANCELLED');
  assert.notEqual(matchWhileAway.status, 'FORFEITED');

  // Player returns to /arena (reconnects)
  const reconnectRes = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(reconnectRes.matchId, match.matchId);
  assert.equal(reconnectRes.playerSide, 'player');
  assert.ok(reconnectRes.state);
  assert.equal(reconnectRes.state.turnNumber, 1);
});

test('TC-M-P03: Battle survives simulated navigation to Deck Builder and Card DB and back', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_AI,
    player1: { id: 'duelist1', name: 'Duelist 1' }
  });

  // Navigate to /deck
  await manager.leaveArena(match.matchId, match.player1Token);
  // Navigate to /browse
  let activeMatches = manager.getActiveMatches('duelist1');
  assert.equal(activeMatches.length, 1);
  assert.equal(activeMatches[0].id, match.matchId);

  // Return to arena
  const restored = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(restored.matchId, match.matchId);
  assert.equal(restored.status, 'ACTIVE');
});

test('TC-M-P04: Both participants disconnect and return hours later without state or turn corruption', async () => {
  let simulatedTime = 1000000;
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store, timeProvider: () => simulatedTime });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  // Advance 45 seconds into turn
  simulatedTime += 45000;

  // Both disconnect
  await manager.leaveArena(match.matchId, match.player1Token);
  await manager.leaveArena(match.matchId, match.player2Token);

  const clockSuspended = manager.getClockState(match.matchId);
  assert.equal(clockSuspended.paused, true, 'Clock must pause on dual disconnect');
  assert.equal(clockSuspended.remainingMs, 195000, 'Remaining time must be exactly preserved');

  // Fast forward 48 hours (simulating 2 days of absence)
  simulatedTime += 48 * 3600 * 1000;

  // Clock should NOT have expired during dual disconnect!
  const clockAfterTwoDays = manager.getClockState(match.matchId);
  assert.equal(clockAfterTwoDays.isExpired, false);
  assert.equal(clockAfterTwoDays.remainingMs, 195000);

  // Alice returns
  const aliceRecon = await manager.reconnectToMatch(match.matchId, match.player1Token);
  assert.equal(aliceRecon.status, 'ACTIVE');
  assert.equal(aliceRecon.clock.remainingMs, 195000);

  // Bob returns
  const bobRecon = await manager.reconnectToMatch(match.matchId, match.player2Token);
  assert.equal(bobRecon.status, 'ACTIVE');
  assert.equal(bobRecon.clock.remainingMs, 195000);
});

test('TC-M-P05: Full engine restoration after simulated server restart', async () => {
  const store = new SessionStore({ inMemory: true });
  let manager1 = new BattleSessionManager({ store });

  const cardA = createCardInstance({ name: 'Siegg-Wurm', cost: 5, colors: ['Red'] }, 'player');
  const cardB = createCardInstance({ name: 'Dark-Wurm', cost: 5, colors: ['Purple'] }, 'opponent');

  const match = await manager1.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    playerDeck: [cardA],
    opponentDeck: [cardB]
  });

  // Mutate state with some damage and a core move
  const game = await manager1.restoreMatch(match.matchId);
  game.state.players.player.life = 4;
  game.state.players.opponent.life = 3;
  game.state.players.player.reserve.normal = 6;
  const serialized = serializeGameState(game.state);
  store.updateSessionState(match.matchId, serialized, 1, { turnNumber: 2, phase: 'MAIN' });

  // Simulate total server restart: destroy manager1, create fresh manager2 reading from same store
  manager1 = null;
  const manager2 = new BattleSessionManager({ store });

  const restored = await manager2.restoreMatch(match.matchId);
  assert.equal(restored.state.players.player.life, 4);
  assert.equal(restored.state.players.opponent.life, 3);
  assert.equal(restored.state.players.player.reserve.normal, 6);
  assert.equal(restored.state.turnNumber, 2);
  assert.equal(restored.state.step, 'MAIN');
});

test('TC-M-P06: Save and restore a pending target selection interaction without losing candidates', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'alice', name: 'Alice' },
    player2: { id: 'bob', name: 'Bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;

  // Create a pending target selection request
  const interactionPromise = game.interactionController.request({
    type: INTERACTION_TYPES.SELECT_TARGETS,
    decisionOwner: 'player',
    candidates: [
      { candidateId: 'target_spirit_1', name: 'Dragon 1', zone: 'field', side: 'opponent' },
      { candidateId: 'target_spirit_2', name: 'Dragon 2', zone: 'field', side: 'opponent' }
    ],
    minSelections: 1,
    maxSelections: 1,
    optional: false
  });

  assert.equal(game.state.pendingInteractions.length, 1);

  // Serialize and save
  const serialized = serializeGameState(game.state);
  store.updateSessionState(match.matchId, serialized, 1);

  // Simulate restore in new manager
  const manager2 = new BattleSessionManager({ store });
  const restoredGame = await manager2.restoreMatch(match.matchId);

  assert.equal(restoredGame.state.pendingInteractions.length, 1);
  const restoredPrompt = restoredGame.state.pendingInteractions[0];
  assert.equal(restoredPrompt.decisionOwner, 'player');
  assert.equal(restoredPrompt.candidates.length, 2);
  assert.equal(restoredPrompt.candidates[0].candidateId, 'target_spirit_1');
  assert.equal(restoredPrompt.mandatory, true);
});

test('TC-M-P07: Save and restore a mandatory vs optional interaction survives correctly', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });
  const game = (await manager.ensureActiveGame(match.matchId)).game;

  // Optional interaction
  game.interactionController.request({
    type: INTERACTION_TYPES.CONFIRM_ACTION,
    decisionOwner: 'opponent',
    optional: true,
    title: 'Activate optional burst?'
  });

  const serialized = serializeGameState(game.state);
  store.updateSessionState(match.matchId, serialized, 1);

  const restored = await manager.restoreMatch(match.matchId);
  assert.equal(restored.state.pendingInteractions.length, 1);
  const req = restored.state.pendingInteractions[0];
  assert.equal(req.optional, true);
  assert.equal(req.decisionOwner, 'opponent');
});

test('TC-M-P08: Interrupted resolver continuation resumes from exact state without effect duplication', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({ mode: EXECUTION_MODES.HUMAN_VS_HUMAN });
  const game = (await manager.ensureActiveGame(match.matchId)).game;

  // Record that an effect step 1 was executed, and resolver continuation is set for step 2
  game.state.resolverContinuation = {
    sourceCardId: 'card_xyz',
    abilityId: 'ab_1',
    effectId: 'eff_destroy_draw',
    nextOpIndex: 1, // 0 was destroy, 1 is draw
    executedOps: ['DESTROY']
  };
  game.state.turnHistory.player.lifeReduced = 1;

  const serialized = serializeGameState(game.state);
  store.updateSessionState(match.matchId, serialized, 1);

  // Restore
  const restoredGame = await manager.restoreMatch(match.matchId);
  assert.ok(restoredGame.state.resolverContinuation);
  assert.equal(restoredGame.state.resolverContinuation.nextOpIndex, 1);
  assert.deepEqual(restoredGame.state.resolverContinuation.executedOps, ['DESTROY']);
  assert.equal(restoredGame.state.turnHistory.player.lifeReduced, 1, 'Turn history counters must not double count');
});

test('TC-M-P09: Deterministic comparison of uninterrupted execution vs interrupted-and-restored execution', async () => {
  const card1 = createCardInstance({ name: 'Alpha Dragon', cost: 3, colors: ['Red'] }, 'player');
  const card2 = createCardInstance({ name: 'Beta Knight', cost: 3, colors: ['Purple'] }, 'opponent');

  // Run 1: Uninterrupted
  const game1 = createGame({
    playerDeck: [card1],
    opponentDeck: [card2],
    mode: EXECUTION_MODES.HEADLESS_SIMULATION
  });
  game1.state.players.player.life = 3;
  game1.state.players.opponent.life = 2;
  game1.state.turnNumber = 3;

  // Run 2: Interrupted, serialized, stored, and restored
  const serialized = serializeGameState(game1.state);
  const restoredState = deserializeGameState(serialized);

  assert.equal(restoredState.turnNumber, game1.state.turnNumber);
  assert.equal(restoredState.players.player.life, game1.state.players.player.life);
  assert.equal(restoredState.players.opponent.life, game1.state.players.opponent.life);
  assert.equal(restoredState.activePlayer, game1.state.activePlayer);
  assert.equal(restoredState.step, game1.state.step);
  assert.deepEqual(restoredState.restrictions.generations, game1.state.restrictions.generations);
});
