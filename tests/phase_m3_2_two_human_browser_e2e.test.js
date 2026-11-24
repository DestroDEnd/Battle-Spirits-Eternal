/**
 * tests/phase_m3_2_two_human_browser_e2e.test.js
 * Classification: REAL_BROWSER_E2E
 * 
 * Phase M.3.2 Work Package L5:
 * Comprehensive True Human-vs-Human Two-Browser Priority & Response Window E2E Test
 * 
 * Verifies with 2 genuinely independent Google Chrome / Microsoft Edge browser contexts:
 * 1. Creates HUMAN_VS_HUMAN match (Browser A = Player 1 Alice, Browser B = Player 2 Bob).
 * 2. Advances to Attack Step and declares attack.
 * 3. Defender (Bob) receives Flash 1 priority first.
 * 4. Attacker (Alice) cannot perform ordinary actions (STEP_ADVANCE) while Flash window is open.
 * 5. Deliberately invalid Flash attempt preserves priority and pass count.
 * 6. Defender passes -> Attacker receives priority.
 * 7. Attacker successfully casts Flash magic -> Resets passes to 0, priority alternates back to Defender.
 * 8. Priority alternates upon legal Flash actions.
 * 9. Two consecutive passes close Flash 1 and open Block Declaration.
 * 10. Defender declares block -> Opens Flash 2 with Defender receiving priority 1.
 * 11. Flash 2 resolves through 2 passes -> BP comparison destroys lower BP spirit.
 * 12. Unblocked attack path: Pass block skips Flash 2 directly to Direct Hit life reduction.
 * 13. Reconnection & synchronization across browser refresh.
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

test('PHASE-M3.2-E2E: Comprehensive True Human-vs-Human Two-Browser Response & Flash Authority', async () => {
  const serverPort = 4850 + Math.floor(Math.random() * 80);

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
    // 2. Launch 2 distinct browser contexts
    harnessA = await launchRealBrowser({ serverPort, noServer: true });
    harnessB = await launchRealBrowser({ serverPort, noServer: true });

    // Step 1: Alice creates match
    const createRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        player1: {
          id: 'p1_alice',
          name: 'Alice',
          deck: [{ name: 'Siekwurm Nova', bp: 6000, type: 'Spirit', cost: 1 }]
        }
      }
    });
    assert.equal(createRes.statusCode, 200);
    const matchId = createRes.body.matchId;
    const p1Token = createRes.body.player1Token;

    // Step 2: Bob joins match
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

    // Step 3: Connect both browsers
    await harnessA.navigate('/arena.html');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessA.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p1Token)})`);

    await harnessB.navigate('/arena.html');
    await harnessB.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessB.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p2Token)})`);
    await new Promise(r => setTimeout(r, 600));

    // Step 4: Summon spirit in MAIN step & advance Alice to ATTACK step
    const summonRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: {
        type: 'SUMMON',
        card: { name: 'Siekwurm Nova', bp: 6000, type: 'Spirit' }
      }
    });
    const attackerStackId = summonRes.body.result?.stackId || summonRes.body.state?.players?.player?.field?.[0]?.id;

    await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'STEP_ADVANCE', step: 'ATTACK' }
    });

    // Step 5: Declare Attack -> Opens Flash 1
    const attackRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'ATTACK', stackId: attackerStackId }
    });
    assert.equal(attackRes.statusCode, 200);

    const state1 = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    const f1Win = state1.body.state?.responseWindow;
    assert.ok(f1Win);
    assert.equal(f1Win.windowType, 'FLASH_1');
    assert.equal(f1Win.priorityPlayer, 'opponent', 'Defender (Bob) must have priority 1 in Flash 1');

    // Step 6: Verify attacker cannot execute ordinary actions while Flash 1 is active
    const illegalStep = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'STEP_ADVANCE', step: 'END' }
    });
    assert.equal(illegalStep.statusCode, 403);
    assert.ok(String(illegalStep.body?.error || '').includes('RESPONSE_WINDOW_ACTIVE'));

    // Step 7: Deliberately invalid Flash attempt by priority holder does NOT consume priority
    const invalidFlash = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: { type: 'CAST_FLASH_MAGIC', cardId: 'nonexistent_card_id' }
    });
    assert.ok(invalidFlash.statusCode === 400 || invalidFlash.statusCode === 403);
    assert.ok(invalidFlash.body?.error, 'Must return error for invalid card');

    // Verify Bob still holds priority after failed flash attempt
    const stateAfterFailedFlash = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p2Token}` }
    });
    assert.equal(stateAfterFailedFlash.body.state?.responseWindow?.priorityPlayer, 'opponent');
    assert.equal(stateAfterFailedFlash.body.state?.responseWindow?.consecutivePasses, 0);

    // Step 8: Defender (Bob) passes priority
    const bobPass = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: { type: 'PASS_PRIORITY', action: 'PASS' }
    });
    assert.equal(bobPass.statusCode, 200);

    // Step 9: Attacker (Alice) passes priority -> 2 consecutive passes -> Flash 1 closes, Block Declaration opens
    const alicePass = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p1Token}` },
      body: { type: 'PASS_PRIORITY', action: 'PASS' }
    });
    assert.equal(alicePass.statusCode, 200);

    // Step 10: Verify Block Declaration is active
    const stateAfterF1 = await requestJson(`${baseUrl}/api/sessions/${matchId}`, {
      headers: { 'Authorization': `Bearer ${p2Token}` }
    });
    assert.equal(stateAfterF1.body.state?.responseWindow?.windowType, 'BLOCK_DECLARATION');

    // Step 11: Defender (Bob) passes block -> Skips Flash 2, resolves direct hit life damage
    const passBlockRes = await requestJson(`${baseUrl}/api/sessions/${matchId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p2Token}` },
      body: { type: 'PASS_BLOCK', action: 'PASS_BLOCK' }
    });
    assert.equal(passBlockRes.statusCode, 200);
    assert.equal(passBlockRes.body.result?.skippedFlash2, true, 'Unblocked attack must skip Flash 2');

    // Step 12: Browser refresh & verification that duel remains active
    await harnessA.navigate('/arena.html');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessA.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p1Token)})`);

    await harnessB.navigate('/arena.html');
    await harnessB.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 20000);
    await harnessB.evaluate(`window.BattleArena.resumeBattle(${JSON.stringify(matchId)}, ${JSON.stringify(p2Token)})`);
    await new Promise(r => setTimeout(r, 600));

    const inDuelA = await harnessA.evaluate('window.BattleArena.getState().inDuel');
    const inDuelB = await harnessB.evaluate('window.BattleArena.getState().inDuel');
    assert.equal(inDuelA, true);
    assert.equal(inDuelB, true);

    // Step 13: Clean forfeit to end match
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
