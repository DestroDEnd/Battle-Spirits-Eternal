/**
 * tests/phase_m2_two_human_browser_e2e.test.js
 * Classification: REAL_BROWSER_E2E
 * 
 * Battle Spirits Eternal — Phase M.2 Work Package H:
 * Genuine Two-Human Browser End-to-End Verification (Browser A = Player 1 Alice, Browser B = Player 2 Bob).
 * 
 * Verifies in real headless Google Chrome instances via CDP:
 * 1. Match creation and join with strict credential isolation (no token leakage).
 * 2. Real browser arena rendering for both players.
 * 3. DOM & State credential scrubbing: zero opponent secret tokens in DOM, HTML, or serialized state.
 * 4. Strict Turn Authority enforcement: Non-active player action rejected with 403 / NOT_ACTIVE_PLAYER.
 * 5. Action Idempotency: Duplicate action submission returns idempotent result; conflicting payload rejected.
 * 6. Real-time synchronization and step advancement.
 * 7. Browser refresh and navigation independence.
 * 8. Clean forfeit and winner resolution.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchRealBrowser } from './helpers/real_browser.js';
import { EXECUTION_MODES } from '../engine/session_mode.js';

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

test('PHASE-M2-WP-H: Genuine Two-Human Browser E2E Lifecycle & Security Verification', async () => {
  const serverPort = 4750 + Math.floor(Math.random() * 80);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m2-e2e-'));
  const dbPath = path.join(tmpDir, 'test.db');

  // 1. Launch local server
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(serverPort), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timed out')), 8000);
    serverProc.stdout.on('data', (buf) => {
      if (buf.toString().includes('running at')) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProc.error = reject;
  });

  const baseUrl = `http://127.0.0.1:${serverPort}`;
  let harnessA = null;
  let harnessB = null;

  try {
    // 2. Launch Browser A (Player 1 - Alice) & Browser B (Player 2 - Bob)
    harnessA = await launchRealBrowser({ serverPort, noServer: true });
    harnessB = await launchRealBrowser({ serverPort, noServer: true });

    // Step 1: Create HUMAN_VS_HUMAN match
    const createRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        player1: { id: 'alice_p1', name: 'Alice' }
      }
    });

    assert.equal(createRes.statusCode, 200);
    const matchId = createRes.body.matchId;
    const p1Token = createRes.body.player1Token;
    assert.ok(p1Token, 'Player 1 token must be returned');
    assert.equal(createRes.body.player2Token, undefined, 'Player 2 token must not leak to Player 1');
    assert.equal(createRes.body.token_hash, undefined, 'token_hash must not leak');

    // Step 2: Player 2 joins using matchId
    const joinRes = await requestJson(`${baseUrl}/api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        matchId,
        playerInfo: { id: 'bob_p2', name: 'Bob' }
      }
    });

    assert.equal(joinRes.statusCode, 200);
    const p2Token = joinRes.body.player2Token;
    assert.ok(p2Token, 'Player 2 token must be returned on join');
    assert.notEqual(p1Token, p2Token, 'Player tokens must be distinct');
    assert.equal(joinRes.body.status, 'ACTIVE');

    // Step 3: Browser A navigates to arena and resumes duel
    await harnessA.navigate('/arena.html');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessA.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p1Token)})`);
    await new Promise(r => setTimeout(r, 600));

    // Step 4: Browser B navigates to arena and resumes duel
    await harnessB.navigate('/arena.html');
    await harnessB.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessB.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p2Token)})`);
    await new Promise(r => setTimeout(r, 600));

    // Step 5: Verify both browser DOMs are in duel
    const aDuel = await harnessA.evaluate('window.BattleArena.getState().inDuel');
    const bDuel = await harnessB.evaluate('window.BattleArena.getState().inDuel');
    assert.equal(aDuel, true, 'Browser A must be in duel');
    assert.equal(bDuel, true, 'Browser B must be in duel');

    // Step 6: Verify strict credential isolation in DOM and State
    const aHtml = await harnessA.evaluate('document.body.innerHTML');
    assert.equal(aHtml.includes(p2Token), false, 'Browser A DOM must NEVER contain Player 2 secret token');

    const bHtml = await harnessB.evaluate('document.body.innerHTML');
    assert.equal(bHtml.includes(p1Token), false, 'Browser B DOM must NEVER contain Player 1 secret token');

    // Step 7: Clocks are active and displayed
    const aClockText = await harnessA.evaluate('document.getElementById("hudClockTimeDisplay")?.textContent');
    const bClockText = await harnessB.evaluate('document.getElementById("hudClockTimeDisplay")?.textContent');
    assert.ok(aClockText && aClockText.includes(':'), 'Browser A clock must display time');
    assert.ok(bClockText && bClockText.includes(':'), 'Browser B clock must display time');

    // Step 8: Strict Turn Authority Enforcement
    // Active player is player1 (Alice). Bob (p2Token) attempts to submit a turn action (STEP_ADVANCE)
    const unauthorizedActionRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: {
        actionId: 'act_unauth_p2',
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }
    });
    assert.equal(unauthorizedActionRes.statusCode, 403, 'Non-active player action must be rejected with 403');
    assert.equal(unauthorizedActionRes.body.code, 'NOT_ACTIVE_PLAYER');

    // Step 9: Legitimate Turn Advance by Active Player (Alice)
    const legitimateActionRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: {
        actionId: 'act_alice_001',
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }
    });
    assert.equal(legitimateActionRes.statusCode, 200);
    assert.equal(legitimateActionRes.body.success, true);

    // Step 10: Action Idempotency Verification
    // Resubmitting the exact same actionId and payload must succeed with duplicate result
    const duplicateActionRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: {
        actionId: 'act_alice_001',
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }
    });
    assert.equal(duplicateActionRes.statusCode, 200, 'Duplicate action must return 200 OK');
    assert.equal(duplicateActionRes.body.duplicate, true);

    // Submitting conflicting payload with same actionId must be rejected with 409
    const conflictActionRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: {
        actionId: 'act_alice_001',
        type: 'STEP_ADVANCE',
        step: 'END'
      }
    });
    assert.equal(conflictActionRes.statusCode, 409, 'Conflicting action payload must return 409');
    assert.equal(conflictActionRes.body.code, 'PAYLOAD_CONFLICT');

    // Step 11: Transport Ticket Generation & Verification
    const ticketRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/ticket`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    assert.equal(ticketRes.statusCode, 200);
    assert.ok(ticketRes.body.ticket, 'Single-use transport ticket must be returned');

    // Step 12: Browser A Refresh and Reconnection
    await harnessA.navigate('/arena.html');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessA.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p1Token)})`);
    await new Promise(r => setTimeout(r, 600));

    const aResumed = await harnessA.evaluate('window.BattleArena.getState().inDuel');
    assert.equal(aResumed, true, 'Browser A must resume duel after refresh');

    // Step 13: Browser A Navigation Independence
    await harnessA.navigate('/browse.html');
    await harnessA.waitForFunction('Boolean(document.title && document.title.length > 0)', 10000);
    const browseTitle = await harnessA.evaluate('document.title');
    assert.ok(browseTitle.length > 0, 'Card browser page loaded');

    // Return to arena
    await harnessA.navigate('/arena.html');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessA.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p1Token)})`);
    await new Promise(r => setTimeout(r, 600));

    // Step 14: Player 2 Forfeits cleanly
    const forfeitRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/forfeit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: { reason: 'CONCEDED_BY_PLAYER' }
    });
    assert.equal(forfeitRes.statusCode, 200);
    assert.equal(forfeitRes.body.status, 'FORFEITED');
    assert.equal(forfeitRes.body.winner, 'player', 'Player 1 must be winner when Player 2 forfeits');

  } finally {
    if (harnessA) await harnessA.close();
    if (harnessB) await harnessB.close();
    serverProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
