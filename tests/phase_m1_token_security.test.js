/**
 * tests/phase_m1_token_security.test.js
 * 
 * Battle Spirits Eternal — Phase M.1 Work Package D:
 * Cryptographic Token Generation, Storage Hashing & Token Security Invariants.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSecureToken } from '../engine/session_mode.js';
import { hashToken, SessionStore } from '../engine/session_store.js';
import { BattleSessionManager } from '../engine/session_manager.js';

test('PHASE-M1-WP-D: Test 1 - Token generation is cryptographically secure with high entropy', () => {
  const tokens = new Set();
  const count = 1000;

  for (let i = 0; i < count; i++) {
    const tok = generateSecureToken('sec');
    assert.ok(tok.startsWith('sec_'), 'Token should have proper prefix');
    // Prefix 'sec_' + 48 hex chars (24 bytes) = 52 characters
    assert.equal(tok.length, 52, 'Token should contain 48 hex characters from 24 random bytes');
    assert.match(tok, /^sec_[0-9a-f]{48}$/, 'Token must be pure cryptographic hex format');
    tokens.add(tok);
  }

  assert.equal(tokens.size, count, 'All 1,000 generated tokens must be completely unique');
});

test('PHASE-M1-WP-D: Test 2 - SQLite database stores only cryptographic SHA-256 token hashes, never plaintext tokens', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'p1_secure', name: 'Alice' },
    player2: { id: 'p2_secure', name: 'Bob', autoJoined: true }
  });

  const p1Token = match.player1Token;
  const p2Token = match.player2Token;

  assert.ok(p1Token);
  assert.ok(p2Token);

  // Directly query the raw SQLite database row
  const rawRow = store.db.prepare('SELECT player1_token_hash, player2_token_hash FROM match_sessions WHERE id = ?').get(match.matchId);

  assert.notEqual(rawRow.player1_token_hash, p1Token, 'Raw token must never be stored in database');
  assert.notEqual(rawRow.player2_token_hash, p2Token, 'Raw token must never be stored in database');

  assert.equal(rawRow.player1_token_hash, hashToken(p1Token), 'Stored value must be exact SHA-256 hash of token 1');
  assert.equal(rawRow.player2_token_hash, hashToken(p2Token), 'Stored value must be exact SHA-256 hash of token 2');
});

test('PHASE-M1-WP-D: Test 3 - Tokens are bound strictly to specific match and participant', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const m1 = await manager.createMatch({
    player1: { id: 'p1_match1' },
    player2: { id: 'p2_match1', autoJoined: true }
  });

  const m2 = await manager.createMatch({
    player1: { id: 'p1_match2' },
    player2: { id: 'p2_match2', autoJoined: true }
  });

  // Reconnect with m1 token into m2 must be rejected
  await assert.rejects(
    async () => await manager.reconnectToMatch(m2.matchId, m1.player1Token),
    (err) => err.message.includes('INVALID_AUTH_TOKEN'),
    'Token from match 1 must be rejected for match 2'
  );

  // Reconnect with m2 token into m1 must be rejected
  await assert.rejects(
    async () => await manager.reconnectToMatch(m1.matchId, m2.player1Token),
    (err) => err.message.includes('INVALID_AUTH_TOKEN'),
    'Token from match 2 must be rejected for match 1'
  );
});
