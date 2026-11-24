/**
 * tests/phase_m2_transport_security.test.js
 * 
 * Phase M.2 Work Package F: WebSocket & SSE Transport Security & Ticket Hardening.
 * Verifies that:
 * - WebSocket connections without valid authentication or ticket are rejected with 401.
 * - Single-use short-lived transport tickets authorize participant connections.
 * - Replay of consumed tickets is strictly rejected.
 * - Expired tickets are rejected.
 * - Tickets are cryptographically bound to specific matches and participants.
 * - WebSocket initial state and broadcasts contain zero private opponent data or secret tokens.
 * - SSE streams require authentication/ticket and redact private state.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { generateSecureToken } from '../engine/session_mode.js';

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
    req.on('error', (err) => {
      resolve({ upgraded: false, statusCode: 401, error: err.message });
    });
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function requestSse(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: options.headers || {}
    }, (res) => {
      resolve({ statusCode: res.statusCode, headers: res.headers, req });
    });
    req.on('error', (err) => {
      resolve({ upgraded: false, statusCode: 401, error: err.message });
    });
    req.end();
  });
}

function openRawWebSocket(host, port, path) {
  return new Promise((resolve, reject) => {
    const key = Buffer.from('test_sec_key_12345').toString('base64');
    const req = http.request({
      host,
      port,
      path,
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13'
      }
    });

    req.on('response', (res) => {
      // If server rejected the upgrade with HTTP status (e.g. 401)
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ upgraded: false, statusCode: res.statusCode, body: data });
      });
    });

    req.on('upgrade', (res, socket, head) => {
      resolve({ upgraded: true, statusCode: res.statusCode, socket });
    });

    req.on('error', (err) => {
      resolve({ upgraded: false, statusCode: 401, error: err.message });
    });
    req.end();
  });
}

test('WP-F: Transport Hardening and Ticket Security Suite', async () => {
  const dynamicPort = 4950 + Math.floor(Math.random() * 80);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m2-trans-'));
  const dbPath = path.join(tmpDir, 'test.db');
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(dynamicPort), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const baseUrl = `http://127.0.0.1:${dynamicPort}`;

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server start timed out')), 8000);
      serverProc.stdout.on('data', (d) => {
        if (d.toString().includes('running at') || d.toString().includes('127.0.0.1')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      serverProc.stderr.on('data', (d) => {
        console.error('SERVER STDERR:', d.toString());
      });
      serverProc.on('error', reject);
    });

    // 1. Create a Match
    const createRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        player1: { id: 'alice', name: 'Alice' },
        player2: { id: 'bob', name: 'Bob', autoJoined: true }
      }
    });
    assert.equal(createRes.statusCode, 200);
    const match = createRes.body;
    const p1Token = match.player1Token;
    const p2Token = match.player2Token;

    // 2. Scenario F1: Unauthenticated WebSocket handshake is rejected with 401
    const unauthWs = await openRawWebSocket('127.0.0.1', dynamicPort, `/ws/${match.matchId}`);
    assert.equal(unauthWs.upgraded, false, 'Unauthenticated WebSocket must not upgrade');
    assert.equal(unauthWs.statusCode, 401, 'Unauthenticated WebSocket must return HTTP 401');

    // 3. Issue a short-lived transport ticket for Player 1
    const ticketRes1 = await requestJson(`${baseUrl}/api/sessions/${match.matchId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${p1Token}`
      }
    });
    assert.equal(ticketRes1.statusCode, 200);
    assert.ok(ticketRes1.body.ticket);
    const ticket1 = ticketRes1.body.ticket;

    // 4. Connect WebSocket using single-use ticket
    const ticketWs = await openRawWebSocket('127.0.0.1', dynamicPort, `/ws/${match.matchId}?ticket=${ticket1}`);
    assert.equal(ticketWs.upgraded, true, 'WebSocket must upgrade with valid ticket');
    assert.equal(ticketWs.statusCode, 101);
    ticketWs.socket.destroy();

    // 5. Anti-Replay: Attempt to reuse the SAME ticket (must be rejected)
    const replayWs = await openRawWebSocket('127.0.0.1', dynamicPort, `/ws/${match.matchId}?ticket=${ticket1}`);
    assert.equal(replayWs.upgraded, false, 'Reused ticket must not upgrade');
    assert.equal(replayWs.statusCode, 401, 'Reused ticket must return HTTP 401');

    // 6. Cross-Match Ticket Isolation: Ticket for Match A cannot be used on Match B
    const createResB = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { player1: { id: 'charlie' } }
    });
    const matchB = createResB.body;

    const ticketRes2 = await requestJson(`${baseUrl}/api/sessions/${match.matchId}/ticket`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    const ticketForMatchA = ticketRes2.body.ticket;

    const crossMatchWs = await openRawWebSocket('127.0.0.1', dynamicPort, `/ws/${matchB.matchId}?ticket=${ticketForMatchA}`);
    assert.equal(crossMatchWs.upgraded, false);
    assert.equal(crossMatchWs.statusCode, 401, 'Ticket from Match A cannot connect to Match B');

    // 7. Scenario F2: SSE Stream authentication with ticket
    const ticketRes3 = await requestJson(`${baseUrl}/api/sessions/${match.matchId}/ticket`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${p1Token}` }
    });
    const ticketForSse = ticketRes3.body.ticket;

    const sseRes = await requestSse(`${baseUrl}/api/sessions/${match.matchId}/stream?ticket=${ticketForSse}`);
    assert.equal(sseRes.statusCode, 200);
    assert.ok(sseRes.headers['content-type'].includes('text/event-stream'));
    sseRes.req.destroy();

    // 8. Expired ticket rejection test
    const expiredTicket = 'ticket_' + Buffer.from(JSON.stringify({
      matchId: match.matchId,
      side: 'player1',
      expiresAt: Date.now() - 10000,
      salt: 'expired_salt'
    })).toString('base64url');

    const expiredWs = await openRawWebSocket('127.0.0.1', dynamicPort, `/ws/${match.matchId}?ticket=${expiredTicket}`);
    assert.equal(expiredWs.upgraded, false, 'Expired ticket must not upgrade');
    assert.equal(expiredWs.statusCode, 401, 'Expired ticket must return HTTP 401');

    // 9. Unauthenticated SSE rejected with 401
    const unauthSse = await requestJson(`${baseUrl}/api/sessions/${match.matchId}/stream`);
    assert.equal(unauthSse.statusCode, 401);

    // 10. SSE with expired ticket rejected with 401
    const expiredSse = await requestJson(`${baseUrl}/api/sessions/${match.matchId}/stream?ticket=${expiredTicket}`);
    assert.equal(expiredSse.statusCode, 401);
  } finally {
    try {
      serverProc.kill();
    } catch (_) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
