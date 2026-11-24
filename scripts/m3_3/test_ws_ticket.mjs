import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

async function testWebSocketTicket() {
  const port = 4960 + Math.floor(Math.random() * 30);
  console.log(`Starting server on port ${port}...`);

  const serverProc = spawn('node', ['server.js'], {
    cwd: 'C:/Users/namis/Downloads/BSP',
    env: { ...process.env, PORT: String(port) },
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

  function post(path, body, headers = {}) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      }, (res) => {
        let respBody = '';
        res.on('data', c => respBody += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(respBody) }));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  try {
    console.log('--- Testing Defect A7: WebSocket Ticket Authentication ---');
    // 1. Create match
    const createRes = await post('/api/sessions/create', {
      player1: { name: 'Alice' },
      player2: { name: 'Bob' },
      mode: 'HUMAN_VS_HUMAN'
    });
    assert.ok(createRes.status === 200 || createRes.status === 201);
    const matchId = createRes.body.matchId;
    const p1Token = createRes.body.player1Token || createRes.body.player1?.token;

    // 2. Issue transport ticket for Alice
    const ticketRes = await post(`/api/sessions/${matchId}/ticket`, {}, {
      'Authorization': `Bearer ${p1Token}`
    });
    assert.ok(ticketRes.status === 200 || ticketRes.status === 201, 'Ticket issue status');
    const ticket = ticketRes.body.ticket;
    console.log('  Issued ticket:', ticket);

    // 3. Connect via WebSocket using only the ticket (no Bearer token)
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

    const wsPromise = new Promise((resolve, reject) => {
      req.on('upgrade', (res, socket, head) => {
        resolve(socket);
      });
      req.on('error', reject);
    });
    req.end();

    const socket = await wsPromise;
    console.log('  WebSocket upgrade successful!');

    // Helper to send WS text frame
    function sendFrame(payload) {
      const buf = Buffer.from(payload, 'utf8');
      const header = Buffer.alloc(6);
      header[0] = 0x81; // FIN + text
      header[1] = 0x80 | buf.length; // Masked
      const mask = crypto.randomBytes(4);
      mask.copy(header, 2);
      const masked = Buffer.alloc(buf.length);
      for (let i = 0; i < buf.length; i++) {
        masked[i] = buf[i] ^ mask[i % 4];
      }
      socket.write(Buffer.concat([header, masked]));
    }

    // Helper to read WS frames properly
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
    console.log('  Initial frames received count:', frames.length);
    assert.ok(frames.length > 0, 'Must receive initial connected frame');
    assert.equal(frames[0].type, 'connected');
    assert.equal(frames[0].playerSide, 'player');

    // 4. Send heartbeat message without authToken
    sendFrame(JSON.stringify({ type: 'heartbeat' }));
    await new Promise(r => setTimeout(r, 150));
    const hbAck = frames.find(f => f.type === 'heartbeat_ack');
    console.log('  Heartbeat ACK received:', Boolean(hbAck));
    assert.ok(hbAck, 'Must receive heartbeat_ack via ticket principal');

    // 5. Send player action without authToken
    sendFrame(JSON.stringify({
      type: 'action',
      actionId: 'act_ticket_test_1',
      action: { type: 'STEP_ADVANCE', step: 'MAIN' }
    }));
    await new Promise(r => setTimeout(r, 150));
    const actRes = frames.find(f => f.type === 'action_result');
    console.log('  Action result received:', actRes);
    assert.ok(actRes, 'Must receive action_result via ticket principal');
    assert.equal(actRes.result.success, true);

    socket.destroy();
    console.log('Defect A7 (WebSocket Ticket Authentication): FIXED');

  } finally {
    serverProc.kill();
  }
}

testWebSocketTicket().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
