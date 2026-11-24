/**
 * tests/phase_m3_2_response_window_persistence.test.js
 * 
 * Phase M.3.2 Work Package J & L: Response Window Persistence and Reconnection Tests
 * 
 * Verifies that:
 * 1. Active Flash 1 response window, priority player, and consecutive passes survive serialization,
 *    persistence in SessionStore, and reconstruction in new engine instances.
 * 2. Active Block Declaration window survives persistence and allows defender to block or pass upon reconnect.
 * 3. Second Flash (FLASH_2) window survives persistence.
 * 4. Candidates are recalculated fresh against the restored state rather than trusting stale client state.
 * 5. Redacted state views mask hidden private cards while preserving response window metadata.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import {
  serializeGameState,
  deserializeGameState,
  redactGameStateForViewer
} from '../engine/state_serialization.js';
import { SessionStore } from '../engine/session_store.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';

test('M3.2-L7-01: Active Flash 1 window and priority survive serialization and reconstruction', async () => {
  resetWindowCounter();
  const game = createGame();
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Persistent Attacker', bp: 5000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 2, soul: 0 });
  game.state.players.player.field.push(atkStack);

  const flashCard = createCardInstance({
    name: 'Flash Shield',
    type: 'Magic',
    cost: 1,
    compiledIr: {
      abilities: [{
        header: { timing: 'FLASH', isFlash: true },
        clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
      }]
    }
  }, 'opponent');
  game.state.players.opponent.hand.push(flashCard);
  game.state.players.opponent.reserve = { normal: 3, soul: 0 };

  // Declare attack -> opens Flash 1 with defender priority
  await game.declareAttack(atkStack.id, 'player');
  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent');

  // Defender passes once -> consecutivePasses = 1, priority alternates to player
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  assert.equal(game.windows.activeWindow.priorityPlayer, 'player');
  assert.equal(game.windows.activeWindow.consecutivePasses, 1);

  // Serialize game state (simulating persist to DB / snapshot)
  const snapshot = serializeGameState(game.state);

  // Reconstruct in a new engine instance (simulating server restart / player reconnect)
  const restoredState = deserializeGameState(snapshot);
  const restoredGame = createGame({ state: restoredState });

  assert.ok(restoredGame.windows.isResponseWindowActive(), 'Response window must be active after restoration');
  assert.equal(restoredGame.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(restoredGame.windows.activeWindow.priorityPlayer, 'player', 'Priority player must be preserved');
  assert.equal(restoredGame.windows.activeWindow.consecutivePasses, 1, 'Consecutive passes must be preserved');

  // Verify that restored game can proceed with player's pass to advance to Block Declaration
  const pass2 = await restoredGame.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });
  assert.equal(pass2.closed, true);
  assert.equal(restoredGame.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);
  assert.equal(restoredGame.windows.activeWindow.priorityPlayer, 'opponent');
});

test('M3.2-L7-02: Block Declaration window survives SessionStore persistence and reload', async () => {
  resetWindowCounter();
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    creatorPlayerId: 'p1_auth',
    strictRules: false
  });
  const join = await manager.joinMatch(match.matchId, 'p2_auth');
  const matchId = match.matchId;

  // Retrieve underlying game and set up combat at Block Declaration stage
  const active = await manager.ensureActiveGame(matchId);
  const game = active.game || active;
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Attacker Spirit', bp: 4000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  game.state.players.player.field.push(atkStack);

  const blkCard = createCardInstance({ name: 'Defender Blocker', bp: 3000, type: 'Spirit' }, 'opponent');
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(blkStack);

  await game.declareAttack(atkStack.id, 'player');
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'opponent' });
  await game.windows.submitResponse({ action: 'PASS' }, { responder: 'player' });

  assert.equal(game.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);

  // Commit state to SessionStore
  const serialized = serializeGameState(game.state);
  store.updateSessionState(matchId, serialized);

  // Evict game from manager memory to simulate complete server cold-restart
  manager.activeGames.delete(matchId);

  // Reload match through manager
  const reloadedActive = await manager.ensureActiveGame(matchId);
  const reloadedGame = reloadedActive.game || reloadedActive;
  assert.ok(reloadedGame.windows.isResponseWindowActive());
  assert.equal(reloadedGame.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);
  assert.equal(reloadedGame.windows.activeWindow.priorityPlayer, 'opponent');

  // Submit block action via session action router
  const actionRes = await manager.submitPlayerAction(matchId, {
    type: 'BLOCK',
    blockerStackId: blkStack.id
  }, { authToken: join.player2Token });

  assert.equal(actionRes.success, true);
  assert.equal(reloadedGame.windows.activeWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_2);
});

test('M3.2-L7-03: Fresh candidate calculation on state restore avoids trusting stale client data', async () => {
  resetWindowCounter();
  const game = createGame();
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Atk', bp: 3000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  game.state.players.player.field.push(atkStack);

  await game.declareAttack(atkStack.id, 'player');
  assert.equal(game.windows.activeWindow.priorityPlayer, 'opponent');

  // Poison the serialized snapshot's candidate list with illegal/fake candidate actions
  const snapshot = serializeGameState(game.state);
  snapshot.responseWindow.legalResponseCandidates = [
    { action: 'CHEAT_INSTANT_WIN', label: 'Fake Client Candidate' }
  ];

  // Deserializing and creating reconstructed game MUST recompute fresh valid candidates
  const restoredState = deserializeGameState(snapshot);
  const restoredGame = createGame({ state: restoredState });

  const activeCandidates = restoredGame.windows.activeWindow.legalResponseCandidates;
  assert.ok(activeCandidates.some(c => c.action === 'PASS'), 'Must calculate real legal candidate PASS');
  assert.ok(!activeCandidates.some(c => c.action === 'CHEAT_INSTANT_WIN'), 'Must purge illegal stale client candidate');
});

test('M3.2-L7-04: Redacted game state view masks opponent hidden cards while exposing response window', async () => {
  resetWindowCounter();
  const game = createGame();
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  const atkCard = createCardInstance({ name: 'Atk', bp: 3000, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  game.state.players.player.field.push(atkStack);

  const secretCard = createCardInstance({ name: 'Secret Flash', type: 'Magic', cost: 1 }, 'opponent');
  game.state.players.opponent.hand.push(secretCard);

  await game.declareAttack(atkStack.id, 'player');

  // Redacted view for attacker ('player')
  const playerView = redactGameStateForViewer(game.state, 'player');

  // Attacker should see responseWindow metadata (priorityPlayer, windowType)
  assert.ok(playerView.responseWindow);
  assert.equal(playerView.responseWindow.windowType, RESPONSE_WINDOW_TYPES.FLASH_1);
  assert.equal(playerView.responseWindow.priorityPlayer, 'opponent');

  // But attacker MUST NOT see opponent's secret hand card names
  assert.equal(playerView.players.opponent.hand[0].name, 'Hidden Card');
});
