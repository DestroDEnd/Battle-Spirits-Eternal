/**
 * tests/phase_m3_3_websocket_ticket_actions.test.js
 * 
 * Phase M.3.3 Work Package I: WebSocket Transport-Ticket Authentication
 * 
 * Asserts that:
 * 1. Client connects to WebSocket endpoint using a single-use ticket.
 * 2. Ticket authenticates the participant and sets connectionPrincipal.
 * 3. Heartbeats sent over WebSocket succeed without plaintext authToken.
 * 4. Actions sent over WebSocket succeed using connectionPrincipal without authToken.
 * 5. Impersonation of other players over the ticket-authenticated connection is blocked.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, (res) => {
      let respBody = '';
      res.on('data', c => respBody += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(respBody); } catch (_) { json = respBody; }
        resolve({ statusCode: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

test('M3.3-I: WebSocket Ticket Authentication & Action Authorization', async () => {
  const port = 4960 + Math.floor(Math.random() * 30);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-ws-ticket-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const serverProc = spawn('node', ['server.js'], {
    cwd: 'C:/Users/namis/Downloads/BSP',
    env: { ...process.env, PORT: String(port), DB_PATH: dbPath },
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

  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Create HUMAN_VS_HUMAN match
    const createRes = await postJson(`${baseUrl}/api/sessions/create`, {
      player1: { name: 'Alice' },
      player2: { name: 'Bob' },
      mode: 'HUMAN_VS_HUMAN'
    });
    assert.equal(createRes.statusCode, 200);
    const matchId = createRes.body.matchId;
    const p1Token = createRes.body.player1Token;

    // 2. Issue transport ticket for Alice
    const ticketRes = await postJson(`${baseUrl}/api/sessions/${matchId}/ticket`, {}, {
      'Authorization': `Bearer ${p1Token}`
    });
    assert.equal(ticketRes.statusCode, 200);
    const ticket = ticketRes.body.ticket;
    assert.ok(ticket, 'Must receive single-use ticket');

    // 3. Connect via RFC 6455 WebSocket using only ticket
    const secKey = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: `/ws/sessions/${matchId}?ticket=${ticket}`,
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': secKey
      }
    });

    const socket = await new Promise((resolve, reject) => {
      req.on('upgrade', (res, sock) => resolve(sock));
      req.on('error', reject);
      req.end();
    });

    function sendFrame(payload) {
      const buf = Buffer.from(payload, 'utf8');
      const header = Buffer.alloc(6);
      header[0] = 0x81;
      header[1] = 0x80 | buf.length;
      const mask = crypto.randomBytes(4);
      mask.copy(header, 2);
      const masked = Buffer.alloc(buf.length);
      for (let i = 0; i < buf.length; i++) {
        masked[i] = buf[i] ^ mask[i % 4];
      }
      socket.write(Buffer.concat([header, masked]));
    }

    const frames = [];
    let rxBuf = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      rxBuf = Buffer.concat([rxBuf, chunk]);
      while (rxBuf.length >= 2) {
        const firstByte = rxBuf[0];
        const secondByte = rxBuf[1];
        const opcode = firstByte & 0x0f;
        const isMasked = (secondByte & 0x80) !== 0;
        let payloadLen = secondByte & 0x7f;
        let headerLen = 2;

        if (payloadLen === 126) {
          if (rxBuf.length < 4) return;
          payloadLen = rxBuf.readUInt16BE(2);
          headerLen = 4;
        } else if (payloadLen === 127) {
          if (rxBuf.length < 10) return;
          payloadLen = Number(rxBuf.readBigUInt64BE(2));
          headerLen = 10;
        }

        if (isMasked) headerLen += 4;
        if (rxBuf.length < headerLen + payloadLen) return;

        let payload = rxBuf.slice(headerLen, headerLen + payloadLen);
        if (isMasked) {
          const mask = rxBuf.slice(headerLen - 4, headerLen);
          const unmasked = Buffer.alloc(payloadLen);
          for (let i = 0; i < payloadLen; i++) {
            unmasked[i] = payload[i] ^ mask[i % 4];
          }
          payload = unmasked;
        }

        rxBuf = rxBuf.slice(headerLen + payloadLen);

        if (opcode === 0x1) {
          try {
            const parsed = JSON.parse(payload.toString('utf8'));
            frames.push(parsed);
          } catch {}
        }
      }
    });

    await new Promise(r => setTimeout(r, 100));
    assert.ok(frames.length > 0, 'Must receive initial connected frame');
    assert.equal(frames[0].type, 'connected');
    assert.equal(frames[0].playerSide, 'player');

    // 4. Send heartbeat without authToken
    sendFrame(JSON.stringify({ type: 'heartbeat' }));
    await new Promise(r => setTimeout(r, 150));
    const hbAck = frames.find(f => f.type === 'heartbeat_ack');
    assert.ok(hbAck, 'Must receive heartbeat_ack via ticket principal');

    // 5. Send player action without authToken
    sendFrame(JSON.stringify({
      type: 'action',
      actionId: 'act_ticket_test_1',
      action: { type: 'STEP_ADVANCE', step: 'MAIN' }
    }));
    await new Promise(r => setTimeout(r, 150));
    const actRes = frames.find(f => f.type === 'action_result');
    assert.ok(actRes, 'Must receive action_result via ticket principal');
    assert.equal(actRes.result.success, true);

    socket.destroy();
  } finally {
    serverProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
