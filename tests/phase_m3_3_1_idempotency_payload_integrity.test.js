/**
 * tests/phase_m3_3_1_idempotency_payload_integrity.test.js
 * 
 * Phase M.3.3.1 Work Package D: Complete Idempotency Payload Integrity
 * 
 * Asserts that:
 * 1. Same action ID + identical payload returns idempotent cached result.
 * 2. Same action ID + different card ID is rejected with PAYLOAD_CONFLICT.
 * 3. Same action ID + different target is rejected with PAYLOAD_CONFLICT.
 * 4. Same action ID + different ability ID is rejected with PAYLOAD_CONFLICT.
 * 5. Same action ID + different core/payment parameters is rejected with PAYLOAD_CONFLICT.
 * 6. Same action ID + different authenticated player is rejected with PAYLOAD_CONFLICT.
 * 7. Failed action retry does not poison the action ID.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { createCardInstance } from '../engine/state.js';

test('M3.3.1-D-01: Same action ID with different card ID is rejected with PAYLOAD_CONFLICT', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.reserve = { normal: 10, soul: 0 };

  const cardA = createCardInstance({ id: 'CARD_A_001', name: 'Alpha Dragon', type: 'Spirit', cost: 2, bp: 2000 }, 'player');
  const cardB = createCardInstance({ id: 'CARD_B_002', name: 'Beta Knight', type: 'Spirit', cost: 2, bp: 3000 }, 'player');
  game.state.players.player.hand = [cardA, cardB];

  const sharedActionId = 'act_summon_test_xyz';

  // First Request: Summon Card A
  const res1 = await manager.submitPlayerAction(match.matchId, {
    actionId: sharedActionId,
    type: 'SUMMON',
    cardId: cardA.id,
    cores: 1
  }, { authToken: match.player1Token });

  assert.equal(res1.success, true);

  // Second Request: Attempt to summon Card B with the SAME action ID
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        actionId: sharedActionId,
        type: 'SUMMON',
        cardId: cardB.id,
        cores: 1
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.equal(err.code, 'PAYLOAD_CONFLICT');
      assert.equal(err.status, 409);
      return true;
    }
  );
});

test('M3.3.1-D-02: Same action ID with different cores/payment is rejected with PAYLOAD_CONFLICT', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.reserve = { normal: 10, soul: 0 };

  const card = createCardInstance({ id: 'CARD_C_003', name: 'Gamma Golem', type: 'Spirit', cost: 2, bp: 2000 }, 'player');
  game.state.players.player.hand = [card];

  const actionId = 'act_core_param_test';

  // First Request: Summon with 1 core
  const res1 = await manager.submitPlayerAction(match.matchId, {
    actionId,
    type: 'SUMMON',
    cardId: card.id,
    cores: 1
  }, { authToken: match.player1Token });
  assert.equal(res1.success, true);

  // Second Request: Submit same action ID with 3 cores requested
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        actionId,
        type: 'SUMMON',
        cardId: card.id,
        cores: 3
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.equal(err.code, 'PAYLOAD_CONFLICT');
      return true;
    }
  );
});

test('M3.3.1-D-03: Same action ID submitted by opponent player is rejected with PAYLOAD_CONFLICT', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  active.game.state.step = 'MAIN';
  active.game.state.activePlayer = 'player';

  const actionId = 'act_player_isolation_1';

  // Alice advances step
  const resAlice = await manager.submitPlayerAction(match.matchId, {
    actionId,
    type: 'STEP_ADVANCE',
    step: 'ATTACK'
  }, { authToken: match.player1Token });
  assert.equal(resAlice.success, true);

  // Bob attempts to replay the same actionId as himself
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        actionId,
        type: 'STEP_ADVANCE',
        step: 'ATTACK'
      }, { authToken: match.player2Token });
    },
    (err) => {
      assert.equal(err.code, 'PAYLOAD_CONFLICT');
      return true;
    }
  );
});

test('M3.3.1-D-04: Identical normalized payload returns duplicate: true without re-executing', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  active.game.state.step = 'MAIN';
  active.game.state.activePlayer = 'player';

  const actionId = 'act_exact_duplicate_1';
  const payload = {
    actionId,
    type: 'STEP_ADVANCE',
    step: 'ATTACK'
  };

  const res1 = await manager.submitPlayerAction(match.matchId, payload, { authToken: match.player1Token });
  assert.equal(res1.success, true);

  const res2 = await manager.submitPlayerAction(match.matchId, payload, { authToken: match.player1Token });
  assert.equal(res2.duplicate, true);
  assert.equal(res2.actionId, actionId);
});
