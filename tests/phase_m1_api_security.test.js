/**
 * tests/phase_m1_api_security.test.js
 * 
 * Battle Spirits Eternal — Phase M.1 Work Package C:
 * Access Control, Participant Authentication, and Viewer-Specific Redaction across Match APIs.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { SessionStore } from '../engine/session_store.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES } from '../engine/session_mode.js';

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) { json = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

test('PHASE-M1-WP-C: Complete API Access Control and Information Leakage Adversarial Suite', async () => {
  const dynamicPort = 4850 + Math.floor(Math.random() * 80);
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(dynamicPort) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server start timed out')), 8000);
      serverProc.stdout.on('data', (d) => {
        if (d.toString().includes('running at')) {
          clearTimeout(timer);
          resolve();
        }
      });
      serverProc.on('error', reject);
    });

    const baseUrl = `http://127.0.0.1:${dynamicPort}`;

    // 1. Create a match
    const createRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        player1: { id: 'alice_1', name: 'Alice' }
      }
    });

    assert.equal(createRes.statusCode, 200);
    const matchId = createRes.body.matchId;
    const p1Token = createRes.body.player1Token;
    assert.ok(p1Token, 'Player 1 token must be provided');
    assert.equal(createRes.body.player2Token, undefined, 'Player 2 token must not leak on creation');

    // Join match as Bob
    const joinRes = await requestJson(`${baseUrl}/api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        matchId,
        playerInfo: { id: 'bob_2', name: 'Bob' }
      }
    });

    assert.equal(joinRes.statusCode, 200);
    const p2Token = joinRes.body.player2Token;
    assert.ok(p2Token, 'Player 2 token must be returned on join');

    // 2. Anonymous request to /api/sessions/:matchId/events must be rejected with 401
    const anonEvents = await requestJson(`${baseUrl}/api/sessions/${matchId}/events`);
    assert.equal(anonEvents.statusCode, 401, 'Anonymous event request must be 401');
    assert.ok(anonEvents.body.error.includes('AUTHENTICATION_REQUIRED'));

    // 3. Request with invalid token to /api/sessions/:matchId/events must be rejected with 401
    const invalidEvents = await requestJson(`${baseUrl}/api/sessions/${matchId}/events`, {
      headers: { 'Authorization': 'Bearer bogus_token_xyz' }
    });
    assert.equal(invalidEvents.statusCode, 401, 'Invalid token must be 401');
    assert.ok(invalidEvents.body.error.includes('INVALID_AUTH_TOKEN'));

    // 4. Token belonging to a different match must be rejected with 401
    const otherMatchRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { mode: EXECUTION_MODES.HUMAN_VS_HUMAN }
    });
    const foreignToken = otherMatchRes.body.player1Token;

    const foreignEvents = await requestJson(`${baseUrl}/api/sessions/${matchId}/events`, {
      headers: { 'Authorization': `Bearer ${foreignToken}` }
    });
    assert.equal(foreignEvents.statusCode, 401, 'Foreign token must be rejected with 401');

    // 5. Authenticated player 1 query to events succeeds
    const p1Events = await requestJson(`${baseUrl}/api/sessions/${matchId}/events`, {
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    assert.equal(p1Events.statusCode, 200);
    assert.ok(Array.isArray(p1Events.body.events));

    // Verify tokens are never exposed in event payloads
    for (const evt of p1Events.body.events) {
      assert.equal(evt.payload?.authToken, undefined, 'Raw auth token must never appear in events');
      assert.equal(evt.payload?.player1Token, undefined, 'Raw p1Token must never appear in events');
      assert.equal(evt.payload?.player2Token, undefined, 'Raw p2Token must never appear in events');
      assert.equal(evt.payload?.tokenHash, undefined, 'Token hash must never appear in events');
    }

    // 6. Anonymous request to /api/sessions/:matchId (spectator state) returns fully redacted view
    const anonState = await requestJson(`${baseUrl}/api/sessions/${matchId}`);
    assert.equal(anonState.statusCode, 200, 'Anonymous spectator state query returns 200');
    assert.ok(anonState.body.state.players.player.hand.every(c => c.masked === true), 'Player 1 hand masked for spectator');
    assert.ok(anonState.body.state.players.opponent.hand.every(c => c.masked === true), 'Opponent hand masked for spectator');

    // 6b. Request with invalid auth token must be rejected with 401
    const invalidState = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': 'Bearer invalid_bogus_token' }
    });
    assert.equal(invalidState.statusCode, 401, 'Invalid token state query must be 401');

    // 7. Player 1 query to /api/sessions/:matchId returns redacted opponent private information
    const p1State = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    assert.equal(p1State.statusCode, 200);
    const opponentHand = p1State.body.state.players.opponent.hand;
    for (const c of opponentHand) {
      assert.equal(c.masked, true, 'Opponent hand cards must be masked for Player 1');
      assert.equal(c.cardNumber, 'HIDDEN', 'Opponent card number must be HIDDEN');
    }

    // 8. Player 2 query to /api/sessions/:matchId returns redacted player 1 private information
    const p2State = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p2Token}` }
    });
    assert.equal(p2State.statusCode, 200);
    const player1Hand = p2State.body.state.players.player.hand;
    for (const c of player1Hand) {
      assert.equal(c.masked, true, 'Player 1 hand cards must be masked for Player 2');
      assert.equal(c.cardNumber, 'HIDDEN', 'Player 1 card number must be HIDDEN');
    }

    // 9. Storage health endpoint responds with 200
    const healthRes = await requestJson(`${baseUrl}/api/sessions/health`);
    assert.equal(healthRes.statusCode, 200);
    assert.equal(healthRes.body.healthy, true);

  } finally {
    serverProc.kill();
  }
});
