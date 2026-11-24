/**
 * tests/phase_m3_3_action_commit_integrity.test.js
 * 
 * Phase M.3.3 Work Package D: Action Result, Atomicity, and Idempotency
 * 
 * Asserts that:
 * 1. Failed card play is never reported as successful and does not advance session version.
 * 2. Failed actions trigger clean rollback of state, response windows, and interaction controllers.
 * 3. Failed action ID does not poison subsequent retry with valid parameters.
 * 4. Duplicate successful action returns idempotent cached response without duplicate execution.
 * 5. Re-submission with conflicting payload on same action ID is rejected.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCardInstance } from '../engine/state.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';

test('M3.3-D-01: Failed PLAY_CARD throws error, rolls back state, and does not commit version', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game || active;

  game.state.activePlayer = 'player';
  game.state.step = 'MAIN';

  const card = createCardInstance({ name: 'Costly Spell', type: 'Magic', cost: 4 }, 'player');
  game.state.players.player.hand = [card];
  game.state.players.player.reserve = { normal: 0, soul: 0 }; // Cannot afford

  const versionBefore = (await manager.getPlayerMatchState(match.matchId, match.player1Token)).version;

  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'PLAY_CARD',
        cardId: card.id
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.equal(err.code, 'INSUFFICIENT_CORES');
      return true;
    }
  );

  const stateAfter = await manager.getPlayerMatchState(match.matchId, match.player1Token);
  assert.equal(stateAfter.version, versionBefore, 'Session version must NOT increment on failed action');
  assert.equal(stateAfter.state.players.player.hand.length, 1, 'Card must remain in hand');
  assert.equal(stateAfter.state.players.player.grave.length, 0, 'No card in graveyard');
});

test('M3.3-D-02: Failed action does not poison subsequent retry with corrected parameters', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game || active;

  game.state.activePlayer = 'player';
  game.state.step = 'MAIN';

  const card = createCardInstance({ name: 'Affordable Spell', type: 'Magic', cost: 1 }, 'player');
  game.state.players.player.hand = [card];
  game.state.players.player.reserve = { normal: 0, soul: 0 }; // Initial failure

  const retryActionId = 'act_retry_test_1';

  // Attempt 1: Fails due to 0 cores
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        actionId: retryActionId,
        type: 'PLAY_CARD',
        cardId: card.id
      }, { authToken: match.player1Token });
    }
  );

  // Provide core in reserve
  game.state.players.player.reserve.normal = 1;

  // Attempt 2: Re-submitting with same actionId now succeeds because failed action was not committed
  const res = await manager.submitPlayerAction(match.matchId, {
    actionId: retryActionId,
    type: 'PLAY_CARD',
    cardId: card.id
  }, { authToken: match.player1Token });

  assert.equal(res.success, true);
  assert.equal(game.state.players.player.hand.length, 0);
  assert.equal(game.state.players.player.grave.length, 1);
});

test('M3.3-D-03: Duplicate successful action returns idempotent cached result without re-execution', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game || active;

  game.state.activePlayer = 'player';
  game.state.step = 'MAIN';

  const actionId = 'act_idempotent_test_1';
  const actionPayload = {
    actionId,
    type: 'STEP_ADVANCE',
    step: 'ATTACK'
  };

  const res1 = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(res1.success, true);
  const v1 = (await manager.getPlayerMatchState(match.matchId, match.player1Token)).version;

  // Duplicate submission
  const res2 = await manager.submitPlayerAction(match.matchId, actionPayload, { authToken: match.player1Token });
  assert.equal(res2.duplicate, true);

  const v2 = (await manager.getPlayerMatchState(match.matchId, match.player1Token)).version;
  assert.equal(v1, v2, 'Version must not increment on duplicate replay');
});

test('M3.3-D-04: Conflicting payload on previously committed actionId is rejected', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const actionId = 'act_conflict_test_1';
  await manager.submitPlayerAction(match.matchId, {
    actionId,
    type: 'STEP_ADVANCE',
    step: 'MAIN'
  }, { authToken: match.player1Token });

  // Conflicting payload on same actionId
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        actionId,
        type: 'STEP_ADVANCE',
        step: 'ATTACK'
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.ok(err.message.includes('CONFLICT') || err.code === 'IDEMPOTENCY_CONFLICT');
      return true;
    }
  );
});
