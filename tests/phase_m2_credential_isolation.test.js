/**
 * tests/phase_m2_credential_isolation.test.js
 * 
 * Phase M.2 Work Package A: Credential Isolation & Information Boundary Hardening
 * Verifies that authentication credentials (tokens, secrets, hashes) never appear
 * in serialized state, SQLite database snapshots, API responses, WebSocket/SSE payloads,
 * or reconstructed engine contexts.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore, hashToken } from '../engine/session_store.js';
import { serializeGameState, deserializeGameState, redactGameStateForViewer, scrubCredentials } from '../engine/state_serialization.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES, createMatchContext } from '../engine/session_mode.js';
import { createGame } from '../engine/index.js';
import { migrateDatabase } from '../scripts/m2/02_migrate_db_credentials.mjs';

/**
 * Recursively asserts that no sensitive tokens, hashes, or secrets exist anywhere in an object tree.
 */
function assertNoCredentialsRecursive(obj, label = 'Object', forbiddenTokens = []) {
  const sensitiveKeys = new Set([
    'authToken',
    'player1Token',
    'player2Token',
    'tokenHash',
    'player1_token_hash',
    'player2_token_hash',
    'secret',
    'password',
    'recoveryToken'
  ]);

  const visited = new Set();

  function scan(current, path) {
    if (!current || typeof current !== 'object') {
      if (typeof current === 'string') {
        for (const token of forbiddenTokens) {
          if (token && current.includes(token)) {
            assert.fail(`[${label}] Secret token detected in string value at ${path}: "${current}"`);
          }
        }
      }
      return;
    }

    if (visited.has(current)) return;
    visited.add(current);

    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        scan(current[i], `${path}[${i}]`);
      }
    } else {
      for (const [key, val] of Object.entries(current)) {
        if (sensitiveKeys.has(key)) {
          assert.fail(`[${label}] Forbidden credential key "${key}" detected at ${path}.${key}`);
        }
        scan(val, `${path}.${key}`);
      }
    }
  }

  scan(obj, '$');
}

test('WP-A Scenario 1 & 2: Player 1 and Player 2 tokens never appear in serialized game state', () => {
  const game = createGame({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    matchId: 'test_m2_a1',
    players: {
      player: { id: 'p1_alice', name: 'Alice', controlType: PLAYER_CONTROL_TYPES.HUMAN },
      opponent: { id: 'p2_bob', name: 'Bob', controlType: PLAYER_CONTROL_TYPES.HUMAN }
    }
  });

  const serialized = serializeGameState(game.state);
  assertNoCredentialsRecursive(serialized, 'serializeGameState');
  assert.equal(serialized.matchContext.players.player.authToken, undefined);
  assert.equal(serialized.matchContext.players.opponent.authToken, undefined);
  assert.equal(serialized.matchContext.players.player.name, 'Alice');
  assert.equal(serialized.matchContext.players.opponent.name, 'Bob');
});

test('WP-A Scenario 3: Neither token appears in SQLite state_json', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const row = store.db.prepare('SELECT state_json FROM match_sessions WHERE id = ?').get(match.matchId);
  assert.ok(row.state_json);
  assert.equal(row.state_json.includes(match.player1Token), false, 'state_json must not contain player1Token');
  assert.equal(row.state_json.includes(match.player2Token), false, 'state_json must not contain player2Token');

  const parsed = JSON.parse(row.state_json);
  assertNoCredentialsRecursive(parsed, 'state_json', [match.player1Token, match.player2Token]);
});

test('WP-A Scenario 4: Anonymous state responses contain no credentials', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const spectatorState = await manager.getPlayerMatchState(match.matchId, null);
  assertNoCredentialsRecursive(spectatorState, 'Spectator State', [match.player1Token, match.player2Token]);
});

test('WP-A Scenario 5: Player 1 responses contain no Player 2 credential', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const p1State = await manager.getPlayerMatchState(match.matchId, match.player1Token);
  assertNoCredentialsRecursive(p1State, 'Player 1 State', [match.player1Token, match.player2Token]);
  assert.equal(JSON.stringify(p1State).includes(match.player2Token), false);
});

test('WP-A Scenario 6: Player 2 responses contain no Player 1 credential', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const p2State = await manager.getPlayerMatchState(match.matchId, match.player2Token);
  assertNoCredentialsRecursive(p2State, 'Player 2 State', [match.player1Token, match.player2Token]);
  assert.equal(JSON.stringify(p2State).includes(match.player1Token), false);
});

test('WP-A Scenario 7: WebSocket initial-state messages contain no credentials', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // Simulate what WebSocket server transmits on connection:
  const wsP1State = await manager.getPlayerMatchState(match.matchId, match.player1Token);
  const wsMsg = {
    type: 'MATCH_SYNC',
    matchId: match.matchId,
    state: wsP1State
  };

  assertNoCredentialsRecursive(wsMsg, 'WebSocket initial sync', [match.player1Token, match.player2Token]);
});

test('WP-A Scenario 8: WebSocket events contain no credentials', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const receivedEvents = [];
  manager.subscribe(match.matchId, 'player', (evt) => {
    receivedEvents.push(evt);
  });

  await manager.recordHeartbeat(match.matchId, match.player1Token);
  await manager.reconnectToMatch(match.matchId, match.player1Token);

  assert.ok(receivedEvents.length > 0);
  for (const evt of receivedEvents) {
    assertNoCredentialsRecursive(evt, 'WebSocket broadcasted event', [match.player1Token, match.player2Token]);
  }
});

test('WP-A Scenario 9: SSE events contain no credentials', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const events = await manager.getEvents(match.matchId, 0, match.player1Token);
  assert.ok(events.length > 0);
  for (const evt of events) {
    assertNoCredentialsRecursive(evt, 'SSE Event payload', [match.player1Token, match.player2Token]);
  }
});

test('WP-A Scenario 10: Pending interactions contain no credentials', async () => {
  const game = createGame({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    matchId: 'test_m2_pending',
    players: {
      player: { id: 'p1', name: 'Alice' },
      opponent: { id: 'p2', name: 'Bob' }
    }
  });

  game.interactionController.request({
    matchId: 'test_m2_pending',
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'c1', name: 'Test Target' }]
  });

  const serialized = serializeGameState(game.state);
  assert.ok(serialized.pendingInteractions.length > 0);
  assertNoCredentialsRecursive(serialized.pendingInteractions, 'Pending Interactions');
});

test('WP-A Scenario 11: Reconstructed MatchContext preserves player identities and control types', () => {
  const game = createGame({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    matchId: 'test_m2_context',
    players: {
      player: { id: 'alice_id', name: 'Alice Wonder', controlType: PLAYER_CONTROL_TYPES.HUMAN },
      opponent: { id: 'bob_id', name: 'Bob Builder', controlType: PLAYER_CONTROL_TYPES.HUMAN }
    }
  });

  const serialized = serializeGameState(game.state);
  const deserialized = deserializeGameState(serialized);

  const ctx = deserialized.matchContext;
  assert.ok(ctx);
  assert.equal(ctx.mode, EXECUTION_MODES.HUMAN_VS_HUMAN);
  assert.equal(ctx.matchId, 'test_m2_context');
  assert.equal(ctx.players.player.id, 'alice_id');
  assert.equal(ctx.players.player.name, 'Alice Wonder');
  assert.equal(ctx.players.player.controlType, PLAYER_CONTROL_TYPES.HUMAN);
  assert.equal(ctx.players.opponent.id, 'bob_id');
  assert.equal(ctx.players.opponent.name, 'Bob Builder');
  assert.equal(ctx.players.opponent.controlType, PLAYER_CONTROL_TYPES.HUMAN);
  assert.equal(ctx.players.player.authToken, undefined);
  assert.equal(ctx.players.opponent.authToken, undefined);
});

test('WP-A Scenario 12: Match restoration still works without plaintext credentials', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // Restore the match from database
  const restoredGame = await manager.restoreMatch(match.matchId);
  assert.ok(restoredGame);
  assert.ok(restoredGame.state);
  assert.equal(restoredGame.state.matchId, match.matchId);
  assert.equal(restoredGame.state.activePlayer, 'player');
  assert.equal(restoredGame.state.matchContext.players.player.id, 'alice');
  assert.equal(restoredGame.state.matchContext.players.opponent.id, 'bob');
});

test('WP-A Scenario 13: Valid player authentication continues to work through the server-side session authority', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const res = await manager.recordHeartbeat(match.matchId, match.player1Token);
  assert.equal(res.success, true);
  assert.equal(res.side, 'player');

  const res2 = await manager.recordHeartbeat(match.matchId, match.player2Token);
  assert.equal(res2.success, true);
  assert.equal(res2.side, 'opponent');
});

test('WP-A Scenario 14: Invalid and revoked tokens are rejected', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  // Forged token rejected
  await assert.rejects(
    async () => await manager.recordHeartbeat(match.matchId, 'forged_token_xyz'),
    (err) => err.code === 'INVALID_AUTH_TOKEN' || err.message.includes('INVALID_AUTH_TOKEN')
  );

  // Missing token rejected
  await assert.rejects(
    async () => await manager.recordHeartbeat(match.matchId, null),
    (err) => err.code === 'AUTHENTICATION_REQUIRED' || err.message.includes('AUTHENTICATION_REQUIRED')
  );
});

test('WP-A Scenario 15: Legacy snapshots can be migrated without losing game progress', () => {
  // Create an in-memory database with legacy leaked tokens in state_json
  const store = new SessionStore({ inMemory: true });
  const p1Token = 'legacy_p1_tok_secret';
  const p2Token = 'legacy_p2_tok_secret';

  const legacyState = {
    version: 1,
    matchId: 'legacy_match_1',
    executionMode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    matchContext: {
      mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
      matchId: 'legacy_match_1',
      players: {
        player: { id: 'alice', name: 'Alice', authToken: p1Token, controlType: 'HUMAN' },
        opponent: { id: 'bob', name: 'Bob', authToken: p2Token, controlType: 'HUMAN' }
      }
    },
    turnNumber: 3,
    activePlayer: 'player',
    players: {
      player: { id: 'alice', life: 4, hand: [{ id: 'card1', name: 'Card 1' }] },
      opponent: { id: 'bob', life: 3, hand: [{ id: 'card2', name: 'Card 2' }] }
    }
  };

  store.saveSession({
    id: 'legacy_match_1',
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    status: 'ACTIVE',
    activePlayer: 'player',
    turnNumber: 3,
    player1: { id: 'alice', name: 'Alice', tokenHash: hashToken(p1Token), controlType: 'HUMAN', connected: true },
    player2: { id: 'bob', name: 'Bob', tokenHash: hashToken(p2Token), controlType: 'HUMAN', connected: true },
    state: legacyState,
    version: 1
  });

  // Verify legacy state has tokens before migration
  const beforeRow = store.db.prepare('SELECT state_json FROM match_sessions WHERE id = ?').get('legacy_match_1');
  assert.ok(beforeRow.state_json.includes(p1Token));
  assert.ok(beforeRow.state_json.includes(p2Token));

  // Run scrub on database row
  const parsed = JSON.parse(beforeRow.state_json);
  scrubCredentials(parsed);
  store.db.prepare('UPDATE match_sessions SET state_json = ? WHERE id = ?').run(JSON.stringify(parsed), 'legacy_match_1');

  // Verify post-migration
  const afterRow = store.db.prepare('SELECT state_json FROM match_sessions WHERE id = ?').get('legacy_match_1');
  assert.equal(afterRow.state_json.includes(p1Token), false);
  assert.equal(afterRow.state_json.includes(p2Token), false);

  const restored = deserializeGameState(JSON.parse(afterRow.state_json));
  assert.equal(restored.turnNumber, 3);
  assert.equal(restored.players.player.life, 4);
  assert.equal(restored.players.opponent.life, 3);
  assert.equal(restored.matchContext.players.player.id, 'alice');
  assert.equal(restored.matchContext.players.player.authToken, undefined);
});
