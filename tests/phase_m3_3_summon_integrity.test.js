/**
 * tests/phase_m3_3_summon_integrity.test.js
 * 
 * Phase M.3.3 Work Package B: SUMMON Authority and Card-Zone Integrity
 * 
 * Asserts that:
 * 1. Arbitrary client-driven card construction and core injection are impossible.
 * 2. Summon actions must reference authoritative cards in valid source zones (hand/removed).
 * 3. Empty-hand, forged, or invalid card IDs are authoritatively rejected.
 * 4. Arbitrary core allocation beyond available reserve is rejected.
 * 5. Ordinary turn summon is locked during active response windows.
 * 6. Non-turn player cannot summon.
 * 7. Failed summon attempts produce no partial mutation and preserve transaction integrity.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';

test('M3.3-B-01: Rejects forged card data and arbitrary core injection from client payload', async () => {
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
  game.state.players.player.hand = [];
  game.state.players.player.reserve = { normal: 0, soul: 0 };
  game.state.players.player.field = [];

  // Attempt arbitrary 100-core injection on empty hand
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'SUMMON',
        card: { id: 'forged_spirit_999', name: 'Forged Spirit', bp: 99999, cost: 0, type: 'Spirit' },
        cores: 100
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.ok(err.code === 'INVALID_CARD_SOURCE' || err.code === 'CARD_NOT_IN_HAND');
      return true;
    }
  );

  // Assert field remains empty and no cores were created
  assert.equal(game.state.players.player.field.length, 0);
  assert.equal(game.state.players.player.reserve.normal, 0);
});

test('M3.3-B-02: Rejects summon of card not in player hand or eligible removed zone', async () => {
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

  // Opponent has a spirit in hand, player does not
  const oppCard = createCardInstance({ name: 'Opp Spirit', type: 'Spirit', cost: 1 }, 'opponent');
  game.state.players.opponent.hand = [oppCard];
  game.state.players.player.hand = [];

  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'SUMMON',
        cardId: oppCard.id
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.equal(err.code, 'CARD_NOT_IN_HAND');
      return true;
    }
  );

  assert.equal(game.state.players.player.field.length, 0);
});

test('M3.3-B-03: Rejects summon when reserve cores are insufficient for additional requested cores', async () => {
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

  const spirit = createCardInstance({ name: 'Soldier', type: 'Spirit', cost: 0 }, 'player');
  game.state.players.player.hand = [spirit];
  game.state.players.player.reserve = { normal: 2, soul: 0 }; // Only 2 cores available

  // Request 10 cores on the spirit (requires 10 from reserve, but player only has 2)
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'SUMMON',
        cardId: spirit.id,
        cores: 10
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.equal(err.code, 'INSUFFICIENT_CORES');
      return true;
    }
  );

  // Assert card is still in hand, no field stack created, and cores were not modified
  assert.equal(game.state.players.player.hand.length, 1);
  assert.equal(game.state.players.player.field.length, 0);
  assert.equal(game.state.players.player.reserve.normal, 2);
});

test('M3.3-B-04: Valid summon allocates cores authoritatively from reserve and resolves triggers', async () => {
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

  const spirit = createCardInstance({
    name: 'Blade Dino',
    type: 'Spirit',
    cost: 1
  }, 'player');
  game.state.players.player.hand = [spirit];
  // 1 core to pay cost, 2 cores to place on spirit = 3 cores total in reserve
  game.state.players.player.reserve = { normal: 3, soul: 0 };

  const res = await manager.submitPlayerAction(match.matchId, {
    type: 'SUMMON',
    cardId: spirit.id,
    cores: 2
  }, { authToken: match.player1Token });

  assert.equal(res.success, true);
  assert.equal(game.state.players.player.hand.length, 0);
  assert.equal(game.state.players.player.field.length, 1);
  const stack = game.state.players.player.field[0];
  assert.equal(stack.cores.normal, 2, 'Stack has exactly 2 cores allocated from reserve');
  assert.equal(game.state.players.player.reserve.normal, 0, 'Reserve reduced by 1 (cost) + 2 (placement) = 3');
  assert.equal(game.state.players.player.trash.normal, 1, 'Trash has 1 core from paid cost');
});

test('M3.3-B-05: Rejects ordinary summon during active response window and by non-turn player', async () => {
  resetWindowCounter();
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
  game.state.step = 'ATTACK';

  const spiritAlice = createCardInstance({ name: 'Alice Spirit', type: 'Spirit', cost: 0 }, 'player');
  const spiritBob = createCardInstance({ name: 'Bob Spirit', type: 'Spirit', cost: 0 }, 'opponent');
  game.state.players.player.hand = [spiritAlice];
  game.state.players.opponent.hand = [spiritBob];
  game.state.players.player.reserve = { normal: 5, soul: 0 };
  game.state.players.opponent.reserve = { normal: 5, soul: 0 };

  // Open FLASH_1 with Bob having priority
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerStackId: 'atk_1',
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Bob (priority holder) attempts ordinary summon (not flash): rejected with NOT_ELIGIBLE / RESPONSE_WINDOW_ACTIVE
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'SUMMON',
        cardId: spiritBob.id
      }, { authToken: match.player2Token });
    },
    (err) => {
      assert.ok(err.code === 'RESPONSE_WINDOW_ACTIVE' || err.code === 'ACTION_NOT_ELIGIBLE_IN_WINDOW' || err.status === 403);
      return true;
    }
  );

  // Alice (non-priority player) attempts summon: rejected
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match.matchId, {
        type: 'SUMMON',
        cardId: spiritAlice.id
      }, { authToken: match.player1Token });
    },
    (err) => {
      assert.ok(err.code === 'RESPONSE_WINDOW_ACTIVE' || err.code === 'NOT_PRIORITY_PLAYER' || err.status === 403);
      return true;
    }
  );

  // Both hands and fields must remain unmutated
  assert.equal(game.state.players.player.field.length, 0);
  assert.equal(game.state.players.opponent.field.length, 0);
});
