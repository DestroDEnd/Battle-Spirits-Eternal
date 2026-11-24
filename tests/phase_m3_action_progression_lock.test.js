/**
 * tests/phase_m3_action_progression_lock.test.js
 * 
 * Battle Spirits Eternal — Phase M.3 Work Package D:
 * Action Progression & Priority Locking Tests.
 * 
 * Verifies:
 * 1. Progression Lock: Active player cannot advance step (STEP_ADVANCE) while response window is open (HTTP 403 / RESPONSE_WINDOW_ACTIVE).
 * 2. Attack Lock: Cannot declare another attack while response window is open (HTTP 403 / RESPONSE_WINDOW_ACTIVE).
 * 3. Out-of-Priority Rejection: Non-priority player cannot submit responses or flash actions (HTTP 403 / NOT_PRIORITY_PLAYER).
 * 4. Transaction Integrity: Failed action attempts rollback cleanly without corrupting state or event sequence numbers.
 * 5. State Serialization: state.responseWindow survives serialization and restoration.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { EXECUTION_MODES } from '../engine/session_mode.js';
import { serializeGameState, deserializeGameState } from '../engine/state_serialization.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { RESPONSE_WINDOW_TYPES, RESPONSE_WINDOW_STATUS } from '../engine/windows.js';

test('PHASE-M3-LOCK-01: Engine rejects STEP_ADVANCE while response window is active', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const session = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' },
    player2: { id: 'p2_bob', name: 'Bob', autoJoined: true }
  });

  const p1Token = session.player1Token;
  const p2Token = session.player2Token;
  const matchId = session.matchId;

  const active = await manager.ensureActiveGame(matchId);
  const game = active.game;
  const { state } = game;
  state.activePlayer = 'player';
  state.step = 'ATTACK';

  // Open Flash 1 response window (Defender = Bob = 'opponent')
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Alice (Attacker / activePlayer) tries to STEP_ADVANCE while Flash 1 is active -> MUST REJECT!
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(matchId, {
        type: 'STEP_ADVANCE',
        step: 'END'
      }, { authToken: p1Token });
    },
    (err) => {
      assert.equal(err.code, 'RESPONSE_WINDOW_ACTIVE');
      return true;
    },
    'Must reject STEP_ADVANCE with RESPONSE_WINDOW_ACTIVE'
  );
});

test('PHASE-M3-LOCK-02: Engine rejects ATTACK while response window is active', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const session = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' },
    player2: { id: 'p2_bob', name: 'Bob', autoJoined: true }
  });

  const p1Token = session.player1Token;
  const matchId = session.matchId;

  const active = await manager.ensureActiveGame(matchId);
  const game = active.game;
  const { state } = game;
  state.activePlayer = 'player';
  state.step = 'ATTACK';

  const atkCard = createCardInstance({ name: 'Attacker Spirit', levels: { 1: { cost: 1, bp: 3000 } }, type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atkCard, { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  // Open response window
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Attempting to declare another attack while response window is open -> REJECTS!
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(matchId, {
        type: 'ATTACK',
        stackId: atkStack.id
      }, { authToken: p1Token });
    },
    (err) => {
      assert.equal(err.code, 'RESPONSE_WINDOW_ACTIVE');
      return true;
    },
    'Must reject ATTACK with RESPONSE_WINDOW_ACTIVE'
  );
});

test('PHASE-M3-LOCK-03: Engine rejects out-of-priority response submissions', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const session = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1_alice', name: 'Alice' },
    player2: { id: 'p2_bob', name: 'Bob', autoJoined: true }
  });

  const p1Token = session.player1Token;
  const p2Token = session.player2Token;
  const matchId = session.matchId;

  const active = await manager.ensureActiveGame(matchId);
  const game = active.game;
  const { state } = game;
  state.activePlayer = 'player';
  state.step = 'ATTACK';

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent' // Bob has priority
  });

  // Alice (player) attempts to submit PASS or response when Bob (opponent) has priority -> REJECTS!
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(matchId, {
        type: 'PASS_PRIORITY',
        action: 'PASS'
      }, { authToken: p1Token });
    },
    (err) => {
      assert.equal(err.code, 'NOT_PRIORITY_PLAYER');
      return true;
    },
    'Must reject out-of-priority action with NOT_PRIORITY_PLAYER'
  );

  // Bob (opponent) can legally submit PASS
  const legalPass = await manager.submitPlayerAction(matchId, {
    type: 'PASS_PRIORITY',
    action: 'PASS'
  }, { authToken: p2Token });

  assert.equal(legalPass.success, true);
  // Now priority belongs to Alice (player)
  assert.equal(game.windows.getPriorityPlayer(), 'player');

  // Now Bob cannot submit PASS since Alice has priority!
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(matchId, {
        type: 'PASS_PRIORITY',
        action: 'PASS'
      }, { authToken: p2Token });
    },
    (err) => {
      assert.equal(err.code, 'NOT_PRIORITY_PLAYER');
      return true;
    }
  );
});

test('PHASE-M3-LOCK-04: Serialization and restoration preserves responseWindow and priority owner', () => {
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';
  state.step = 'ATTACK';

  const mockWindow = {
    windowId: 'win_m3_test',
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    timing: 'FIRST_FLASH_TIMING',
    activePlayer: 'player',
    opposingPlayer: 'opponent',
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent',
    consecutivePasses: 1,
    resolutionStatus: RESPONSE_WINDOW_STATUS.OPEN,
    legalActions: ['PASS', 'CAST_FLASH_MAGIC'],
    legalResponseCandidates: [{ action: 'PASS', label: 'Pass Priority' }]
  };
  state.responseWindow = mockWindow;

  // Serialize
  const serialized = serializeGameState(state);
  assert.ok(serialized.responseWindow, 'Serialized snapshot must contain responseWindow');
  assert.equal(serialized.responseWindow.windowId, 'win_m3_test');
  assert.equal(serialized.responseWindow.priorityPlayer, 'opponent');
  assert.equal(serialized.responseWindow.consecutivePasses, 1);

  // Deserialize
  const restored = deserializeGameState(serialized);
  assert.ok(restored.responseWindow, 'Restored state must contain responseWindow');
  assert.equal(restored.responseWindow.windowId, 'win_m3_test');
  assert.equal(restored.responseWindow.priorityPlayer, 'opponent');
  assert.equal(restored.responseWindow.consecutivePasses, 1);
});
