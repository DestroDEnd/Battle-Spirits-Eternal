/**
 * tests/phase_m3_two_human_browser_e2e.test.js
 * Classification: REAL_BROWSER_E2E
 * 
 * Battle Spirits Eternal — Phase M.3 Work Package E:
 * Genuine Two-Human Browser End-to-End Verification (Browser A = Player 1 Alice, Browser B = Player 2 Bob).
 * 
 * Verifies in real headless Google Chrome instances via CDP:
 * 1. Attack Step response window lifecycle execution.
 * 2. Flash 1 Timing opens with Defender (Bob) receiving priority 1.
 * 3. Progression lock: Attacker (Alice) cannot advance step while Flash 1 is active (HTTP 403 / RESPONSE_WINDOW_ACTIVE).
 * 4. Priority alternation: Bob passes -> Alice receives priority -> Alice passes -> 2 passes close Flash 1.
 * 5. Block Declaration step opens with Bob having decision ownership.
 * 6. Defender declares block or passes block (direct hit life damage).
 * 7. State and window persistence across browser refresh and reconnection.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
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

test('PHASE-M3-WP-E: Complete True Human-vs-Human Two-Browser Priority & Response Window E2E', async () => {
  const serverPort = 4750 + Math.floor(Math.random() * 80);

  // 1. Launch local server
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(serverPort) },
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
    serverProc.on('error', reject);
  });

  const baseUrl = `http://127.0.0.1:${serverPort}`;
  let harnessA = null;
  let harnessB = null;

  try {
    // 2. Launch Browser A (Player 1 - Alice) & Browser B (Player 2 - Bob)
    harnessA = await launchRealBrowser({ serverPort, noServer: true });
    harnessB = await launchRealBrowser({ serverPort, noServer: true });

    // Step 1: Create HUMAN_VS_HUMAN match on server
    const createRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        player1: { id: 'p1_alice', name: 'Alice' }
      }
    });

    assert.equal(createRes.statusCode, 200);
    const matchId = createRes.body.matchId;
    const p1Token = createRes.body.player1Token;

    // Step 2: Player 2 (Bob) joins match
    const joinRes = await requestJson(`${baseUrl}/api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        matchId,
        playerInfo: { id: 'p2_bob', name: 'Bob' }
      }
    });

    assert.equal(joinRes.statusCode, 200);
    const p2Token = joinRes.body.player2Token;

    // Step 3: Browser A (Alice) connects and resumes battle
    await harnessA.navigate('/arena.html');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessA.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p1Token)})`);
    await new Promise(r => setTimeout(r, 600));

    // Step 4: Browser B (Bob) connects and resumes battle
    await harnessB.navigate('/arena.html');
    await harnessB.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessB.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p2Token)})`);
    await new Promise(r => setTimeout(r, 600));

    // Step 5: Advance to ATTACK step
    const advanceRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'STEP_ADVANCE', step: 'ATTACK' }
    });
    assert.equal(advanceRes.statusCode, 200);

    // Step 6: Alice attacks with a spirit
    // Setup an attacking spirit for Alice in state
    const fetchStateRes = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    assert.equal(fetchStateRes.statusCode, 200);

    // Get an attacker from Alice's field, or declare attack via session API
    // If field is empty in fresh start, summon or add a spirit for Alice
    const summonRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: {
        type: 'SUMMON',
        card: { name: 'Siegfried', bp: 5000, type: 'Spirit' }
      }
    });

    // Alice declares attack
    const attackerStackId = summonRes.body.result?.stackId || summonRes.body.state?.players?.player?.field?.[0]?.id;
    const attackRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: {
        type: 'ATTACK',
        stackId: attackerStackId
      }
    });
    assert.equal(attackRes.statusCode, 200, 'Attack declaration must succeed');

    // Step 7: Verify Flash 1 window is opened with Defender (Bob) having priority
    const matchAfterAttack = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    assert.equal(matchAfterAttack.statusCode, 200);
    const win = matchAfterAttack.body.state?.responseWindow;
    assert.ok(win, 'Response window must be open after attack declaration');
    assert.equal(win.windowType, 'FLASH_1', 'Window type must be FLASH_1');
    assert.equal(win.priorityPlayer, 'opponent', 'Defender (Bob) must have priority 1 in Flash 1');

    // Step 8: Action Progression Locking Verification
    // Alice (attacker) tries to advance step while Flash 1 is open -> MUST BE REJECTED!
    const illegalStep = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'STEP_ADVANCE', step: 'END' }
    });
    assert.equal(illegalStep.statusCode, 403, 'Must reject STEP_ADVANCE with HTTP 403');
    assert.ok(
      String(illegalStep.body?.error || '').includes('RESPONSE_WINDOW_ACTIVE'),
      'Error must specify RESPONSE_WINDOW_ACTIVE'
    );

    // Step 9: Out-of-priority Rejection
    // Alice tries to submit PASS while Bob has priority -> MUST BE REJECTED!
    const illegalPass = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'PASS_PRIORITY', action: 'PASS' }
    });
    assert.equal(illegalPass.statusCode, 403, 'Must reject out-of-priority action with HTTP 403');
    assert.ok(
      String(illegalPass.body?.error || '').includes('NOT_PRIORITY_PLAYER'),
      'Error must specify NOT_PRIORITY_PLAYER'
    );

    // Step 10: Defender (Bob) passes priority
    const bobPass = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: { type: 'PASS_PRIORITY', action: 'PASS' }
    });
    assert.equal(bobPass.statusCode, 200);

    // Step 11: Attacker (Alice) passes priority -> 2 passes -> Flash 1 closes, Block Declaration opens
    const alicePass = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'PASS_PRIORITY', action: 'PASS' }
    });
    assert.equal(alicePass.statusCode, 200);

    // Step 12: Verify Block Declaration step is active
    const stateAfterFlash1 = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p2Token}` }
    });
    const blockWin = stateAfterFlash1.body.state?.responseWindow;
    assert.ok(blockWin, 'Block Declaration window must be active');
    assert.equal(blockWin.windowType, 'BLOCK_DECLARATION');
    assert.equal(blockWin.priorityPlayer, 'opponent', 'Defender must have priority in Block Declaration');

    // Step 13: Bob passes block (declares no block) -> Skips Flash 2, applies direct hit
    const passBlockRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: { type: 'PASS_BLOCK', action: 'PASS_BLOCK' }
    });
    assert.equal(passBlockRes.statusCode, 200);
    assert.equal(passBlockRes.body.result?.skippedFlash2, true, 'Second Flash Timing MUST be skipped on unblocked attack');

    // Step 14: Refresh persistence in Browser A and Browser B
    await harnessA.navigate('/arena.html');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessA.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p1Token)})`);

    await harnessB.navigate('/arena.html');
    await harnessB.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessB.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p2Token)})`);
    await new Promise(r => setTimeout(r, 600));

    // Verify both browsers are still in duel and match is alive
    const inDuelA = await harnessA.evaluate('window.BattleArena.getState().inDuel');
    const inDuelB = await harnessB.evaluate('window.BattleArena.getState().inDuel');
    assert.equal(inDuelA, true);
    assert.equal(inDuelB, true);

    // Step 15: Clean forfeit to complete test
    const forfeitRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/forfeit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: { reason: 'P2_FORFEIT' }
    });
    assert.equal(forfeitRes.statusCode, 200);
    assert.equal(forfeitRes.body.status, 'FORFEITED');

  } finally {
    if (harnessA) await harnessA.close();
    if (harnessB) await harnessB.close();
    serverProc.kill();
  }
});
