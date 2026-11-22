/**
 * tests/random_matchmaking.test.js
 * Classification: INTEGRATION / MULTIPLAYER
 * 
 * Verifies Random Battle Assorting & Matchmaking Subsystem (Showdown-style Quick Match).
 * Validates:
 * 1. Queue entrance and ticket issuance.
 * 2. Status polling and queue pruning.
 * 3. Self-pairing prevention.
 * 4. Atomic pairing of two waiting players into a persistent HUMAN_VS_HUMAN session.
 * 5. Distinct token distribution (Player 1 vs Player 2).
 * 6. Cancellation of active searches.
 * 7. End-to-end REST API communication over server endpoints.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { Matchmaker, MATCHMAKER_STATUS } from '../engine/matchmaker.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { launchRealBrowser } from './helpers/real_browser.js';

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

test('MATCHMAKER-01: Unit Tests - Queue Entrance, Pairing & Cancellation', async () => {
  const store = new SessionStore({ inMemory: true });
  let virtualTime = 1000000;
  const timeProvider = () => virtualTime;
  const sessionManager = new BattleSessionManager({ store, timeProvider });
  const matchmaker = new Matchmaker({ sessionManager, timeProvider, leaseMs: 15000 });

  // 1. Player 1 enters queue
  const res1 = await matchmaker.enterQueue({
    playerId: 'user_alice',
    playerName: 'Alice',
    deckId: 'deck_std_red'
  });
  assert.equal(res1.status, MATCHMAKER_STATUS.SEARCHING);
  assert.ok(res1.ticketId, 'Ticket ID must be issued');
  assert.equal(matchmaker.getQueueStats().queueSize, 1);

  // 2. Alice polls queue
  const poll1 = matchmaker.pollQueue(res1.ticketId);
  assert.equal(poll1.status, MATCHMAKER_STATUS.SEARCHING);
  assert.ok(poll1.queueSize >= 1);

  // 3. Self-pairing prevention: Alice enters again with same playerId
  const res1Again = await matchmaker.enterQueue({
    playerId: 'user_alice',
    playerName: 'Alice Updated',
    deckId: 'deck_std_red'
  });
  assert.equal(res1Again.status, MATCHMAKER_STATUS.SEARCHING);
  assert.equal(res1Again.ticketId, res1.ticketId, 'Must reuse active ticket for same playerId');
  assert.equal(matchmaker.getQueueStats().queueSize, 1, 'Queue must not duplicate self');

  // 4. Player 2 enters queue -> triggers immediate atomic pairing!
  const res2 = await matchmaker.enterQueue({
    playerId: 'user_bob',
    playerName: 'Bob',
    deckId: 'deck_std_purple'
  });
  assert.equal(res2.status, MATCHMAKER_STATUS.MATCHED);
  assert.ok(res2.matchId, 'Must produce matchId');
  assert.ok(res2.authToken, 'Bob must receive authToken');
  assert.equal(res2.playerSide, 'opponent', 'Bob joined as Player 2 / opponent');
  assert.equal(res2.opponentName, 'Alice Updated');

  // 5. Alice polls queue -> now receives MATCHED result
  const poll1Matched = matchmaker.pollQueue(res1.ticketId);
  assert.equal(poll1Matched.status, MATCHMAKER_STATUS.MATCHED);
  assert.equal(poll1Matched.matchId, res2.matchId, 'Both players share the same match');
  assert.ok(poll1Matched.authToken, 'Alice must receive authToken');
  assert.notEqual(poll1Matched.authToken, res2.authToken, 'Alice and Bob must receive distinct authTokens');
  assert.equal(poll1Matched.playerSide, 'player', 'Alice is Player 1');
  assert.equal(poll1Matched.opponentName, 'Bob');

  // 6. Verify created session is active and persisted in SessionManager
  const session = sessionManager.store.loadSession(res2.matchId);
  assert.ok(session, 'Session must exist in store');
  assert.equal(session.status, 'ACTIVE', 'Paired match must be immediately ACTIVE');
  assert.equal(session.mode, 'HUMAN_VS_HUMAN');
  assert.equal(session.player1.name, 'Alice Updated');
  assert.equal(session.player2.name, 'Bob');
  assert.equal(session.player2.connected, true);

  // 7. Cancellation test
  const res3 = await matchmaker.enterQueue({
    playerId: 'user_charlie',
    playerName: 'Charlie'
  });
  assert.equal(res3.status, MATCHMAKER_STATUS.SEARCHING);
  assert.equal(matchmaker.getQueueStats().queueSize, 1);

  const cancelRes = matchmaker.leaveQueue(res3.ticketId);
  assert.equal(cancelRes.success, true);
  assert.equal(matchmaker.getQueueStats().queueSize, 0);

  const pollAfterCancel = matchmaker.pollQueue(res3.ticketId);
  assert.equal(pollAfterCancel.status, MATCHMAKER_STATUS.EXPIRED);

  // 8. Stale searcher pruning test
  const res4 = await matchmaker.enterQueue({
    playerId: 'user_david',
    playerName: 'David'
  });
  assert.equal(res4.status, MATCHMAKER_STATUS.SEARCHING);
  // Advance virtual time beyond lease (16 seconds)
  virtualTime += 16000;
  matchmaker.pruneStaleTickets();
  assert.equal(matchmaker.getQueueStats().queueSize, 0, 'Stale ticket must be pruned');
});

test('MATCHMAKER-02: REST API End-to-End Simulation over Server', async () => {
  const dynamicPort = 4820 + Math.floor(Math.random() * 100);
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(dynamicPort) },
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

  const baseUrl = `http://127.0.0.1:${dynamicPort}`;

  try {
    // 1. Initial matchmaking stats
    const stats0 = await requestJson(`${baseUrl}/api/matchmaking/stats`);
    assert.equal(stats0.statusCode, 200);
    assert.equal(typeof stats0.body.queueSize, 'number');

    // 2. Player 1 (Kai) searches for random battle
    const find1 = await requestJson(`${baseUrl}/api/matchmaking/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        playerId: 'duelist_kai_01',
        playerName: 'Kai',
        deckId: 'red'
      }
    });
    assert.equal(find1.statusCode, 200);
    assert.equal(find1.body.status, 'SEARCHING');
    const ticket1 = find1.body.ticketId;
    assert.ok(ticket1, 'Ticket 1 must be issued');

    // 3. Poll Kai's status
    const pollKai = await requestJson(`${baseUrl}/api/matchmaking/status?ticketId=${encodeURIComponent(ticket1)}`);
    assert.equal(pollKai.statusCode, 200);
    assert.equal(pollKai.body.status, 'SEARCHING');

    // 4. Player 2 (Ren) searches for random battle -> immediate match!
    const find2 = await requestJson(`${baseUrl}/api/matchmaking/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        playerId: 'duelist_ren_02',
        playerName: 'Ren',
        deckId: 'purple'
      }
    });
    assert.equal(find2.statusCode, 200);
    assert.equal(find2.body.status, 'MATCHED');
    const matchId = find2.body.matchId;
    const renToken = find2.body.authToken;
    assert.ok(matchId, 'Match must be created');
    assert.ok(renToken, 'Ren receives auth token');
    assert.equal(find2.body.opponentName, 'Kai');

    // 5. Kai polls again -> receives match result
    const pollKaiMatched = await requestJson(`${baseUrl}/api/matchmaking/status?ticketId=${encodeURIComponent(ticket1)}`);
    assert.equal(pollKaiMatched.statusCode, 200);
    assert.equal(pollKaiMatched.body.status, 'MATCHED');
    assert.equal(pollKaiMatched.body.matchId, matchId);
    const kaiToken = pollKaiMatched.body.authToken;
    assert.ok(kaiToken, 'Kai receives auth token');
    assert.notEqual(kaiToken, renToken, 'Tokens must differ');
    assert.equal(pollKaiMatched.body.opponentName, 'Ren');

    // 6. Verify both players can access match state via authenticated API
    const kaiState = await requestJson(`${baseUrl}/api/sessions/${encodeURIComponent(matchId)}`, {
      headers: { 'Authorization': `Bearer ${kaiToken}` }
    });
    assert.equal(kaiState.statusCode, 200);
    assert.equal(kaiState.body.status, 'ACTIVE');

    const renState = await requestJson(`${baseUrl}/api/sessions/${encodeURIComponent(matchId)}`, {
      headers: { 'Authorization': `Bearer ${renToken}` }
    });
    assert.equal(renState.statusCode, 200);
    assert.equal(renState.body.status, 'ACTIVE');

    // 7. Test search cancellation
    const findCancel = await requestJson(`${baseUrl}/api/matchmaking/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { playerId: 'duelist_solo_03', playerName: 'Solo' }
    });
    assert.equal(findCancel.body.status, 'SEARCHING');
    const soloTicket = findCancel.body.ticketId;

    const cancelRes = await requestJson(`${baseUrl}/api/matchmaking/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { ticketId: soloTicket }
    });
    assert.equal(cancelRes.statusCode, 200);
    assert.equal(cancelRes.body.success, true);

    const checkCancelled = await requestJson(`${baseUrl}/api/matchmaking/status?ticketId=${encodeURIComponent(soloTicket)}`);
    assert.equal(checkCancelled.body.status, 'EXPIRED');

  } finally {
    try {
      if (process.platform === 'win32' && serverProc.pid) {
        spawn('taskkill', ['/pid', String(serverProc.pid), '/T', '/F']);
      } else {
        serverProc.kill();
      }
    } catch (_) {}
  }
});

test('MATCHMAKER-03: Real Browser Arena UI Integration & Matchmaking Flow', async () => {
  const dynamicPort = 4950 + Math.floor(Math.random() * 80);
  let harness = null;

  try {
    harness = await launchRealBrowser({ serverPort: dynamicPort });
    await harness.navigate('/arena.html');
    await harness.waitForFunction('window.BattleArena && typeof window.BattleArena.startRandomMatchmaking === "function"', 20000);

    // 1. Verify UI elements exist in DOM
    const hasSelect = await harness.evaluate('Boolean(document.getElementById("pvpRandomDeckSelect"))');
    const hasFindBtn = await harness.evaluate('Boolean(document.getElementById("btnStartRandomMatchmake"))');
    const hasLobbyBtn = await harness.evaluate('Boolean(document.getElementById("btnLobbyRandomDuel"))');
    const hasModal = await harness.evaluate('Boolean(document.getElementById("randomMatchmakingModal"))');

    assert.equal(hasSelect, true, '#pvpRandomDeckSelect must exist');
    assert.equal(hasFindBtn, true, '#btnStartRandomMatchmake must exist');
    assert.equal(hasLobbyBtn, true, '#btnLobbyRandomDuel must exist');
    assert.equal(hasModal, true, '#randomMatchmakingModal must exist');

    // 2. Verify pvpRandomDeckSelect contains the random showdown option
    await harness.waitForFunction('document.getElementById("pvpRandomDeckSelect") && document.getElementById("pvpRandomDeckSelect").options.length > 0', 10000);
    const optionsText = await harness.evaluate(`
      Array.from(document.getElementById('pvpRandomDeckSelect').options).map(o => ({ value: o.value, text: o.text }))
    `);
    assert.ok(optionsText.length > 0, 'Must have deck options populated');
    const randomOpt = optionsText.find(o => o.value === 'random');
    assert.ok(randomOpt, 'Must have "random" option');
    assert.ok(randomOpt.text.includes('Random Realm Deck'), 'Must be titled Random Realm Deck');

    // 3. Trigger startRandomMatchmaking from the browser
    await harness.evaluate('window.BattleArena.startRandomMatchmaking()');
    await new Promise(r => setTimeout(r, 600));

    // 4. Verify modal is shown and timer is counting
    const modalDisplay = await harness.evaluate('document.getElementById("randomMatchmakingModal").style.display');
    assert.equal(modalDisplay, 'flex', 'Modal must be open (display: flex)');

    const timerVal = await harness.evaluate('document.getElementById("matchmakingTimerDisplay").textContent');
    assert.ok(timerVal.includes(':'), 'Timer display must show mm:ss');

    // 5. Test cancellation
    await harness.evaluate('window.BattleArena.cancelRandomMatchmaking()');
    await new Promise(r => setTimeout(r, 400));
    const modalAfterCancel = await harness.evaluate('document.getElementById("randomMatchmakingModal").style.display');
    assert.equal(modalAfterCancel, 'none', 'Modal must be hidden after cancel');

    // 6. Test full matchmaking pairing: Browser starts searching again
    await harness.evaluate('window.BattleArena.startRandomMatchmaking()');
    await new Promise(r => setTimeout(r, 500));

    // Opponent duelist enters queue via REST API
    const oppRes = await requestJson(`http://127.0.0.1:${dynamicPort}/api/matchmaking/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        playerId: 'rival_yuto_99',
        playerName: 'Yuto (Rival)',
        deckId: 'deck_std_white'
      }
    });
    assert.equal(oppRes.statusCode, 200);
    assert.equal(oppRes.body.status, 'MATCHED');

    // Wait for browser to poll and receive match
    await new Promise(r => setTimeout(r, 2600));

    // 7. Verify browser entered duel
    const inDuel = await harness.evaluate('window.BattleArena.getState().inDuel');
    assert.equal(inDuel, true, 'Browser must automatically enter the duel arena upon match found');

    const activeMatchId = await harness.evaluate('window.BattleArena.currentSessionInfo.matchId');
    assert.equal(activeMatchId, oppRes.body.matchId, 'Browser matchId must match server session');

  } finally {
    if (harness) {
      await harness.close();
    }
  }
});
