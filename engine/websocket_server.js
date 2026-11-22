/**
 * engine/websocket_server.js
 * 
 * Lightweight RFC 6455 WebSocket Server for Battle Spirits Eternal (Phase M.1).
 * Built with pure Node.js built-ins (node:crypto, node:http) with zero third-party dependencies.
 * Provides authenticated real-time bidirectional synchronization, heartbeats,
 * monotonic event sequence delivery, and player action submission.
 */

import crypto from 'node:crypto';
import { hashToken } from './session_store.js';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/**
 * Sends an RFC 6455 text frame over a raw net.Socket.
 */
export function sendWsFrame(socket, payload) {
  if (!socket || socket.destroyed || !socket.writable) return;
  const payloadBuf = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8');
  let headerBuf;

  if (payloadBuf.length < 126) {
    headerBuf = Buffer.alloc(2);
    headerBuf[0] = 0x81; // FIN + text opcode
    headerBuf[1] = payloadBuf.length;
  } else if (payloadBuf.length <= 0xffff) {
    headerBuf = Buffer.alloc(4);
    headerBuf[0] = 0x81;
    headerBuf[1] = 126;
    headerBuf.writeUInt16BE(payloadBuf.length, 2);
  } else {
    headerBuf = Buffer.alloc(10);
    headerBuf[0] = 0x81;
    headerBuf[1] = 127;
    headerBuf.writeBigUInt64BE(BigInt(payloadBuf.length), 2);
  }

  socket.write(Buffer.concat([headerBuf, payloadBuf]));
}

/**
 * Sends a WebSocket close frame.
 */
export function sendWsClose(socket, code = 1000, reason = '') {
  if (!socket || socket.destroyed || !socket.writable) return;
  const reasonBuf = Buffer.from(reason, 'utf8');
  const payloadBuf = Buffer.alloc(2 + reasonBuf.length);
  payloadBuf.writeUInt16BE(code, 0);
  reasonBuf.copy(payloadBuf, 2);

  const headerBuf = Buffer.alloc(2);
  headerBuf[0] = 0x88; // FIN + Close opcode
  headerBuf[1] = payloadBuf.length;

  try {
    socket.write(Buffer.concat([headerBuf, payloadBuf]));
    socket.end();
  } catch (_) {}
}

/**
 * Attaches the WebSocket server handler to an existing http.Server instance.
 */
export function attachWebSocketServer(server, sessionManager) {
  server.on('upgrade', async (req, socket, head) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      // Handle routes: /ws/sessions/:matchId or /api/sessions/:matchId/ws
      let matchId = null;
      if (pathname.startsWith('/ws/sessions/')) {
        matchId = pathname.slice('/ws/sessions/'.length).replace(/\/$/, '');
      } else if (pathname.startsWith('/api/sessions/') && pathname.endsWith('/ws')) {
        const parts = pathname.split('/').filter(Boolean);
        matchId = parts[2];
      }

      if (!matchId) {
        socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      // Check Sec-WebSocket-Key
      const secKey = req.headers['sec-websocket-key'];
      if (!secKey) {
        socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      // Extract Auth Token
      const authHeader = req.headers['authorization'] || '';
      const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const queryToken = url.searchParams.get('token') || '';
      const authToken = headerToken || queryToken;

      if (!authToken) {
        socket.write('HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n{"error":"AUTHENTICATION_REQUIRED"}');
        socket.destroy();
        return;
      }

      // Verify Session and Authentication
      const session = sessionManager.store.loadSession(matchId);
      if (!session) {
        socket.write('HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{"error":"MATCH_NOT_FOUND"}');
        socket.destroy();
        return;
      }

      const tokenH = hashToken(authToken);
      let viewerSide = null;
      if (session.player1.tokenHash === tokenH) viewerSide = 'player';
      else if (session.player2.tokenHash === tokenH) viewerSide = 'opponent';

      if (!viewerSide) {
        socket.write('HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n{"error":"INVALID_AUTH_TOKEN"}');
        socket.destroy();
        return;
      }

      // Complete RFC 6455 Handshake
      const acceptKey = crypto.createHash('sha1').update(secKey + WS_GUID).digest('base64');
      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`
      ];
      socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');

      // Record immediate connection & heartbeat
      await sessionManager.recordHeartbeat(matchId, authToken);

      // Subscribe to real-time events for this match
      const unsubscribe = sessionManager.subscribe(matchId, viewerSide, (event) => {
        sendWsFrame(socket, JSON.stringify({ type: 'event', event }));
      });

      // Send initial connection welcome & current state snapshot
      try {
        const stateSnapshot = await sessionManager.getPlayerMatchState(matchId, authToken);
        sendWsFrame(socket, JSON.stringify({
          type: 'connected',
          matchId,
          playerSide: viewerSide,
          status: stateSnapshot.status,
          state: stateSnapshot.state,
          clock: stateSnapshot.clock
        }));
      } catch (e) {
        console.error('[WebSocket] Failed to send initial state:', e.message);
      }

      // Incoming frame processing buffer
      let buffer = Buffer.alloc(0);

      socket.on('data', async (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        while (buffer.length >= 2) {
          const firstByte = buffer[0];
          const secondByte = buffer[1];
          const opcode = firstByte & 0x0f;
          const isMasked = (secondByte & 0x80) !== 0;
          let payloadLength = secondByte & 0x7f;
          let offset = 2;

          if (payloadLength === 126) {
            if (buffer.length < 4) break;
            payloadLength = buffer.readUInt16BE(2);
            offset = 4;
          } else if (payloadLength === 127) {
            if (buffer.length < 10) break;
            payloadLength = Number(buffer.readBigUInt64BE(2));
            offset = 10;
          }

          let maskKey = null;
          if (isMasked) {
            if (buffer.length < offset + 4) break;
            maskKey = buffer.subarray(offset, offset + 4);
            offset += 4;
          }

          if (buffer.length < offset + payloadLength) break;

          const rawPayload = buffer.subarray(offset, offset + payloadLength);
          buffer = buffer.subarray(offset + payloadLength);

          let unmasked = Buffer.alloc(payloadLength);
          if (isMasked && maskKey) {
            for (let i = 0; i < payloadLength; i++) {
              unmasked[i] = rawPayload[i] ^ maskKey[i % 4];
            }
          } else {
            rawPayload.copy(unmasked);
          }

          // Handle opcode
          if (opcode === 0x8) {
            // Close frame
            unsubscribe();
            sendWsClose(socket, 1000);
            return;
          } else if (opcode === 0x9) {
            // Ping -> Pong
            const pongBuf = Buffer.alloc(2);
            pongBuf[0] = 0x8a;
            pongBuf[1] = 0;
            socket.write(pongBuf);
          } else if (opcode === 0x1) {
            // Text frame
            try {
              const text = unmasked.toString('utf8');
              const msg = JSON.parse(text);

              if (msg.type === 'heartbeat') {
                const hbRes = await sessionManager.recordHeartbeat(matchId, authToken);
                sendWsFrame(socket, JSON.stringify({ type: 'heartbeat_ack', timestamp: hbRes.heartbeatMs }));
              } else if (msg.type === 'action') {
                const actionResult = await sessionManager.submitPlayerAction(matchId, msg.action, { authToken });
                sendWsFrame(socket, JSON.stringify({ type: 'action_result', actionId: msg.actionId, result: actionResult }));
              } else if (msg.type === 'sync') {
                const sinceSeq = parseInt(msg.sinceSeq || '0', 10);
                const events = await sessionManager.getEvents(matchId, sinceSeq, authToken);
                sendWsFrame(socket, JSON.stringify({ type: 'sync_events', events }));
              }
            } catch (msgErr) {
              sendWsFrame(socket, JSON.stringify({ type: 'error', error: msgErr.message, code: msgErr.code }));
            }
          }
        }
      });

      socket.on('close', () => {
        unsubscribe();
      });

      socket.on('error', (err) => {
        unsubscribe();
      });

    } catch (err) {
      try {
        socket.write('HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n');
        socket.destroy();
      } catch (_) {}
    }
  });
}
