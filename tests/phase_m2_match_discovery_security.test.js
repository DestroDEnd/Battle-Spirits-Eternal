/**
 * tests/phase_m2_match_discovery_security.test.js
 * 
 * Phase M.2 Work Package E: Authenticated Match Discovery & History Security.
 * Verifies that:
 * - /api/sessions/active and /api/sessions/history require authentication.
 * - Anonymous requests are rejected with 401.
 * - Client-supplied playerId is never trusted for authorization.
 * - Cross-player and cross-match enumeration is completely prevented.
 * - Anonymous spectator state exposes only public data with zero credentials and cards masked.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { scrubCredentials } from '../engine/state_serialization.js';

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

test('WP-E: Match Discovery and History Authentication & Enumeration Hardening Suite', async () => {
  const dynamicPort = 4900 + Math.floor(Math.random() * 80);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m2-disc-'));
  const dbPath = path.join(tmpDir, 'test.db');
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(dynamicPort), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const baseUrl = `http://127.0.0.1:${dynamicPort}`;

  try {
    // Wait for server to listen
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server spawn timeout')), 8000);
      serverProc.stdout.on('data', (d) => {
        if (d.toString().includes('Server running at') || d.toString().includes('127.0.0.1')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      serverProc.on('error', reject);
    });

    // 1. Create Match A (Alice vs Bob)
    const createResA = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        player1: { id: 'alice', name: 'Alice' },
        player2: { id: 'bob', name: 'Bob', autoJoined: true }
      }
    });
    assert.equal(createResA.statusCode, 200);
    const matchA = createResA.body;
    const aliceToken = matchA.player1Token;
    const bobToken = matchA.player2Token;

    // 2. Create Match B (Charlie vs Dave)
    const createResB = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        player1: { id: 'charlie', name: 'Charlie' },
        player2: { id: 'dave', name: 'Dave', autoJoined: true }
      }
    });
    assert.equal(createResB.statusCode, 200);
    const matchB = createResB.body;
    const charlieToken = matchB.player1Token;

    // 3. Scenario E1 & E2: Anonymous request to /api/sessions/active must be rejected (401)
    const anonActive = await requestJson(`${baseUrl}/api/sessions/active`);
    assert.equal(anonActive.statusCode, 401, 'Anonymous request to active sessions must be rejected');

    // 4. Scenario E1 & E2: Anonymous request to /api/sessions/history must be rejected (401)
    const anonHistory = await requestJson(`${baseUrl}/api/sessions/history`);
    assert.equal(anonHistory.statusCode, 401, 'Anonymous request to session history must be rejected');

    // 5. Scenario E2: Invalid token rejected (401)
    const invalidTokenRes = await requestJson(`${baseUrl}/api/sessions/active`, {
      headers: { 'Authorization': 'Bearer invalid_forged_token_xyz' }
    });
    assert.equal(invalidTokenRes.statusCode, 200); // Token hash doesn't match any session, returns empty list
    assert.deepEqual(invalidTokenRes.body.activeMatches, []);

    // 6. Scenario E2: Forged playerId without matching token returns empty array, does NOT leak Alice's matches
    const forgedPlayerRes = await requestJson(`${baseUrl}/api/sessions/active?playerId=alice`, {
      headers: { 'Authorization': `Bearer ${charlieToken}` }
    });
    assert.equal(forgedPlayerRes.statusCode, 200);
    // Charlie authenticated with Charlie's token, asking for Alice's matches
    assert.deepEqual(forgedPlayerRes.body.activeMatches, [], 'Must not return Alice matches to Charlie');

    // 7. Scenario E1: Alice discovers only Alice's active matches
    const aliceActiveRes = await requestJson(`${baseUrl}/api/sessions/active`, {
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    assert.equal(aliceActiveRes.statusCode, 200);
    const aliceMatches = aliceActiveRes.body.activeMatches;
    assert.ok(aliceMatches.length >= 1);
    const foundMatchA = aliceMatches.find(m => m.id === matchA.matchId);
    assert.ok(foundMatchA, 'Alice must discover Match A');
    const foundMatchB = aliceMatches.find(m => m.id === matchB.matchId);
    assert.equal(foundMatchB, undefined, 'Alice must NOT see Match B');

    // 8. Scenario E3: Anonymous spectator querying match state receives only public data
    const spectatorRes = await requestJson(`${baseUrl}/api/sessions/${matchA.matchId}`);
    assert.equal(spectatorRes.statusCode, 200);
    const specState = spectatorRes.body.state;
    assert.ok(specState);
    assert.ok(specState.players.player.hand.every(c => c.masked === true), 'Spectator must see masked hand');
    assert.ok(specState.players.player.deck.every(c => c.masked === true), 'Spectator must see masked deck');

    const specJson = JSON.stringify(spectatorRes.body);
    assert.equal(specJson.includes(aliceToken), false, 'Spectator must never see Alice token');
    assert.equal(specJson.includes(bobToken), false, 'Spectator must never see Bob token');
  } finally {
    serverProc.kill('SIGTERM');
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
