/**
 * tests/phase_m1_realtime_sync.test.js
 * 
 * Battle Spirits Eternal — Phase M.1 Work Package F:
 * Real-Time Bidirectional Synchronization, WebSocket Transport, Event Replay & Monotonic Ordering.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
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

test('PHASE-M1-WP-F: Real-Time Synchronization Suite via SSE and WebSocket', async () => {
  const dynamicPort = 4750 + Math.floor(Math.random() * 80);
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(dynamicPort) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timeout')), 8000);
      serverProc.stdout.on('data', (buf) => {
        if (buf.toString().includes('running at')) {
          clearTimeout(timer);
          resolve();
        }
      });
      serverProc.on('error', reject);
    });

    const baseUrl = `http://127.0.0.1:${dynamicPort}`;

    // 1. Create match
    const createRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        player1: { id: 'p1_realtime', name: 'Realtime Alice' }
      }
    });

    assert.equal(createRes.statusCode, 200);
    const matchId = createRes.body.matchId;
    const p1Token = createRes.body.player1Token;

    // Join match as Player 2
    const joinRes = await requestJson(`${baseUrl}/api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        matchId,
        playerInfo: { id: 'p2_realtime', name: 'Realtime Bob' }
      }
    });

    assert.equal(joinRes.statusCode, 200);
    const p2Token = joinRes.body.player2Token;

    // 2. Connect Player 1 to Real-Time WebSocket stream
    const p1Ws = new WebSocket(`ws://127.0.0.1:${dynamicPort}/ws/sessions/${matchId}?token=${p1Token}`);
    const p1Messages = [];

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('P1 WebSocket connection timed out')), 5000);
      p1Ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      p1Ws.onerror = reject;
    });

    p1Ws.onmessage = (evt) => {
      try {
        p1Messages.push(JSON.parse(evt.data));
      } catch (_) {}
    };

    // Wait for initial connection message
    await new Promise(r => setTimeout(r, 100));
    assert.ok(p1Messages.length >= 1, 'Should receive initial connection message');
    assert.equal(p1Messages[0].type, 'connected');
    assert.equal(p1Messages[0].playerSide, 'player');

    // 3. Connect Player 2 to Real-Time WebSocket stream
    const p2Ws = new WebSocket(`ws://127.0.0.1:${dynamicPort}/ws/sessions/${matchId}?token=${p2Token}`);
    const p2Messages = [];

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('P2 WebSocket connection timed out')), 5000);
      p2Ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      p2Ws.onerror = reject;
    });

    p2Ws.onmessage = (evt) => {
      try {
        p2Messages.push(JSON.parse(evt.data));
      } catch (_) {}
    };

    await new Promise(r => setTimeout(r, 100));
    assert.ok(p2Messages.length >= 1);
    assert.equal(p2Messages[0].type, 'connected');
    assert.equal(p2Messages[0].playerSide, 'opponent');

    // 4. Player 1 sends a heartbeat over WebSocket
    p1Ws.send(JSON.stringify({ type: 'heartbeat' }));
    await new Promise(r => setTimeout(r, 150));
    const hbAck = p1Messages.find(m => m.type === 'heartbeat_ack');
    assert.ok(hbAck, 'Must receive heartbeat_ack over WebSocket');

    // 5. Player 1 submits an action over WebSocket
    const beforeActionCount = p2Messages.filter(m => m.type === 'event').length;
    p1Ws.send(JSON.stringify({
      type: 'action',
      actionId: `ws_act_${Date.now()}`,
      action: {
        type: 'STEP_ADVANCE',
        step: 'MAIN'
      }
    }));

    // Wait for action resolution and broadcast
    await new Promise(r => setTimeout(r, 250));

    // Player 1 should receive action_result
    const p1ActionResult = p1Messages.find(m => m.type === 'action_result');
    assert.ok(p1ActionResult, 'Player 1 must receive action_result');
    assert.equal(p1ActionResult.result?.success, true);

    // Player 2 must receive the broadcasted ACTION_STEP_ADVANCE event in real-time!
    const p2Events = p2Messages.filter(m => m.type === 'event');
    assert.ok(p2Events.length > beforeActionCount, 'Player 2 must receive live event broadcast');
    const stepEvent = p2Events.find(e => e.event.type === 'ACTION_STEP_ADVANCE');
    assert.ok(stepEvent, 'Player 2 must receive ACTION_STEP_ADVANCE event');
    assert.ok(stepEvent.event.seq > 0, 'Event must have monotonic sequence number');

    // 6. Test sequence recovery / replay (WP F requirement 5)
    p2Ws.send(JSON.stringify({ type: 'sync', sinceSeq: 0 }));
    await new Promise(r => setTimeout(r, 200));

    const syncMsg = p2Messages.find(m => m.type === 'sync_events');
    assert.ok(syncMsg, 'Must receive sync_events replay');
    assert.ok(Array.isArray(syncMsg.events));
    assert.ok(syncMsg.events.length >= 2, 'Replay should contain all recorded events');

    // Verify monotonic ordering
    for (let i = 1; i < syncMsg.events.length; i++) {
      assert.ok(syncMsg.events[i].seq > syncMsg.events[i - 1].seq, 'Event sequence numbers must be monotonically increasing');
    }

    // 7. Cleanup WebSockets
    p1Ws.close();
    p2Ws.close();

  } finally {
    serverProc.kill();
  }
});
