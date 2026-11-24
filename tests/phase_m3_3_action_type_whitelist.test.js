/**
 * tests/phase_m3_3_action_type_whitelist.test.js
 * 
 * Phase M.3.3 Work Package E: Action-Type Whitelist and Request Normalization
 * 
 * Asserts that:
 * 1. Unrecognized action types are rejected with HTTP 400 and code INVALID_ACTION_TYPE.
 * 2. Missing, empty, or whitespace action types are rejected with INVALID_ACTION_TYPE.
 * 3. Prototype pollution action types (__proto__, constructor) are rejected with INVALID_ACTION_TYPE.
 * 4. Rejected unknown actions do not advance session version or persist events.
 * 5. Valid actions across all 4 whitelisted categories are permitted through the gateway.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import {
  authorizeAction,
  TURN_CONTROLLED_ACTIONS,
  RESPONSE_WINDOW_ACTIONS,
  INTERACTION_ACTIONS,
  ADMINISTRATIVE_ACTIONS
} from '../engine/action_authority.js';

test('M3.3-E-01: Unknown or unauthorized action types are rejected with HTTP 400 INVALID_ACTION_TYPE', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const versionBefore = (await manager.getPlayerMatchState(match.matchId, match.player1Token)).version;
  const eventsBefore = store.getEvents(match.matchId, 0).length;

  const maliciousActions = [
    'DEBUG_SET_LIFE',
    'FORCE_WIN',
    'ADMIN_OVERRIDE',
    'ARBITRARY_MUTATE',
    'UNKNOWN_ACTION_XYZ'
  ];

  for (const badType of maliciousActions) {
    await assert.rejects(
      async () => {
        await manager.submitPlayerAction(match.matchId, {
          type: badType
        }, { authToken: match.player1Token });
      },
      (err) => {
        assert.equal(err.code, 'INVALID_ACTION_TYPE');
        assert.equal(err.status, 400);
        return true;
      }
    );
  }

  // Version and event count must be unaffected
  const versionAfter = (await manager.getPlayerMatchState(match.matchId, match.player1Token)).version;
  const eventsAfter = store.getEvents(match.matchId, 0).length;
  assert.equal(versionAfter, versionBefore, 'Version must not advance on rejected unknown actions');
  assert.equal(eventsAfter, eventsBefore, 'No events should be committed on rejected unknown actions');
});

test('M3.3-E-02: Missing, empty, or prototype-polluting action types are safely rejected', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const invalidTypes = [
    undefined,
    null,
    '',
    '   ',
    '__proto__',
    'constructor',
    'toString',
    'valueOf'
  ];

  for (const badType of invalidTypes) {
    await assert.rejects(
      async () => {
        await manager.submitPlayerAction(match.matchId, {
          type: badType
        }, { authToken: match.player1Token });
      },
      (err) => {
        assert.equal(err.code, 'INVALID_ACTION_TYPE');
        assert.equal(err.status, 400);
        return true;
      }
    );
  }
});

test('M3.3-E-03: Whitelist covers all canonical actions across four architectural categories', async () => {
  // 1. Turn Controlled
  assert.ok(TURN_CONTROLLED_ACTIONS.has('STEP_ADVANCE'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('ADVANCE_STEP'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('PLAY_CARD'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('SUMMON'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('ATTACK'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('DECLARE_ATTACK'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('SET_BURST'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('SET_MIRAGE'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('TRANSFER_CORE'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('CORE_TRANSFER'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('SEPARATE_BRAVE'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('PERFORM_ADVENT'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('EXECUTE_ACCEL'));
  assert.ok(TURN_CONTROLLED_ACTIONS.has('EXECUTE_CHANGE'));

  // 2. Response Window
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('PASS'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('FLASH_PASS'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('PASS_FLASH'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('FLASH_ACTION'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('PLAY_FLASH'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('ACTIVATE_FLASH_ABILITY'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('DECLARE_BLOCK'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('BLOCK'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('RESOLVE_BURST'));
  assert.ok(RESPONSE_WINDOW_ACTIONS.has('SELECT_TARGET'));

  // 3. Interaction
  assert.ok(INTERACTION_ACTIONS.has('INTERACTION_RESPONSE'));

  // 4. Administrative
  assert.ok(ADMINISTRATIVE_ACTIONS.has('FORFEIT'));
  assert.ok(ADMINISTRATIVE_ACTIONS.has('HEARTBEAT'));
});

test('M3.3-E-04: Valid action types proceed past the whitelist gateway', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  active.game.state.activePlayer = 'player';
  active.game.state.step = 'MAIN';

  // STEP_ADVANCE is whitelisted and succeeds
  const res1 = await manager.submitPlayerAction(match.matchId, {
    type: 'STEP_ADVANCE',
    step: 'ATTACK'
  }, { authToken: match.player1Token });

  assert.equal(res1.success, true);
  assert.equal(res1.state.step, 'ATTACK');
  assert.equal(res1.result.step, 'ATTACK');
});
