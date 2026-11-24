import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { SAGA_DEFINITIONS, getSagaById, resolveCardSaga } from './engine/rules/saga_catalog.js';
import { resolveCardArtworks, getCachedArtworks, loadArtworksCache } from './engine/rules/card_artworks_service.js';
import { getDefaultSessionManager } from './engine/session_manager.js';
import { hashToken } from './engine/session_store.js';
import { attachWebSocketServer } from './engine/websocket_server.js';
import { getDefaultMatchmaker } from './engine/matchmaker.js';
import { scrubCredentials } from './engine/state_serialization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
// The development instance is intended for this computer only.
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

const ROUTE_MAP = {
  '/': '/index.html',
  '/arena': '/arena.html',
  '/battle': '/arena.html',
  '/duel': '/arena.html',
  '/browse': '/browse.html',
  '/deck': '/deck.html',
  '/deck-view': '/deck_view.html',
  '/deck_view': '/deck_view.html',
  '/family': '/family.html',
  '/sets': '/sets.html',
  '/keywords': '/keywords.html',
  '/login': '/login.html',
  '/register': '/register.html'
};

let cachedStandardDecks = null;
let cachedCardsIndex = null;
let cachedCardsByName = null;
let cachedCardsByNumber = null;
let cachedFilters = null;
let cachedKeywordsData = null;
let cachedFeaturedXRares = null;
let cachedAiWeights = null;
let cachedRebirthCatalog = null;
let serverDb = null;
try {
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'battle_spirits.db');
  if (fs.existsSync(dbPath)) {
    serverDb = new DatabaseSync(dbPath);
  }
} catch (e) {
  console.warn('[Server] Could not initialize SQLite DatabaseSync:', e.message);
}

function ensureRebirthCatalogLoaded() {
  if (!cachedRebirthCatalog) {
    try {
      const catalogPath = path.join(__dirname, 'data', 'rebirth_catalog.json');
      if (fs.existsSync(catalogPath)) {
        cachedRebirthCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      } else {
        cachedRebirthCatalog = {};
      }
    } catch (e) {
      cachedRebirthCatalog = {};
    }
  }
}

function ensureCardsIndexLoaded() {
  if (!cachedCardsIndex) {
    try {
      const idxRaw = fs.readFileSync(path.join(__dirname, 'data', 'cards_index.json'), 'utf8');
      let detailed = null;
      const detailedPath = path.join(__dirname, 'data', 'cards_detailed.json');
      if (fs.existsSync(detailedPath)) {
        detailed = JSON.parse(fs.readFileSync(detailedPath, 'utf8'));
      }
      cachedCardsIndex = JSON.parse(idxRaw);
      cachedCardsByName = {};
      cachedCardsByNumber = {};
      const sourceDict = detailed || cachedCardsIndex;
      for (const [cNum, entry] of Object.entries(sourceDict)) {
        if (entry && entry.name) {
          const lowerName = entry.name.toLowerCase();
          cachedCardsByName[lowerName] = entry;
          const normalized = lowerName.replace(/［/g, '[').replace(/］/g, ']').trim();
          if (normalized !== lowerName) {
            cachedCardsByName[normalized] = entry;
          }
        }
        if (entry && (entry.card_number || cNum)) {
          const numKey = (entry.card_number || cNum).toLowerCase();
          cachedCardsByNumber[numKey] = entry;
        }
      }
    } catch (e) {
      cachedCardsIndex = {};
      cachedCardsByName = {};
      cachedCardsByNumber = {};
    }
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('INVALID_JSON_BODY'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  // CORS & caching headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // ── API ROUTES ──

  // ── RANDOM MATCHMAKING API (QUICK MATCH / BATTLE ASSORTING) ──
  if (pathname.toLowerCase().startsWith('/api/matchmaking')) {
    const matchmaker = getDefaultMatchmaker();
    const parts = pathname.split('/').filter(Boolean); // ['api', 'matchmaking', ...]
    const subRoute = parts[2] ? parts[2].toLowerCase() : '';

    // POST /api/matchmaking/find
    if (subRoute === 'find' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await matchmaker.enterQueue(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: err.code }));
      }
      return;
    }

    // GET /api/matchmaking/status?ticketId=...
    if (subRoute === 'status' && req.method === 'GET') {
      const ticketId = parsedUrl.searchParams.get('ticketId');
      if (!ticketId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing ticketId parameter' }));
        return;
      }
      const result = matchmaker.pollQueue(ticketId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // POST /api/matchmaking/cancel
    if (subRoute === 'cancel' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = matchmaker.leaveQueue(body.ticketId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: err.code }));
      }
      return;
    }

    // GET /api/matchmaking/stats
    if (subRoute === 'stats' && req.method === 'GET') {
      const stats = matchmaker.getQueueStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }
  }

  // ── SESSION MANAGEMENT API (PHASE M) ──
  if (pathname.toLowerCase().startsWith('/api/sessions')) {
    const sessionManager = getDefaultSessionManager();
    const parts = pathname.split('/').filter(Boolean); // ['api', 'sessions', ...]
    const subRoute = parts[2] ? parts[2].toLowerCase() : '';
    const subAction = parts[3] ? parts[3].toLowerCase() : '';

    // Extract Bearer token from headers or query
    const authHeader = req.headers['authorization'] || '';
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const queryToken = parsedUrl.searchParams.get('token') || '';
    const effectiveToken = headerToken || queryToken;

    // POST /api/sessions/create
    if (subRoute === 'create' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await sessionManager.createMatch(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: err.code }));
      }
      return;
    }

    // POST /api/sessions/join
    if (subRoute === 'join' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await sessionManager.joinMatch(body.matchId, body.playerInfo);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: err.code }));
      }
      return;
    }

    // GET /api/sessions/active
    if (subRoute === 'active' && req.method === 'GET') {
      try {
        if (!effectiveToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'AUTHENTICATION_REQUIRED: Caller authentication token required', code: 'AUTHENTICATION_REQUIRED' }));
          return;
        }
        const playerId = parsedUrl.searchParams.get('playerId');
        const activeMatches = sessionManager.getActiveMatches(effectiveToken, playerId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ activeMatches: scrubCredentials(activeMatches) }));
      } catch (err) {
        const statusCode = (err.code === 'AUTHENTICATION_REQUIRED' || err.code === 'INVALID_AUTH_TOKEN' || err.message.includes('AUTHENTICATION')) ? 401 : 400;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: err.code }));
      }
      return;
    }

    // GET /api/sessions/history
    if (subRoute === 'history' && req.method === 'GET') {
      try {
        if (!effectiveToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'AUTHENTICATION_REQUIRED: Caller authentication token required', code: 'AUTHENTICATION_REQUIRED' }));
          return;
        }
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10);
        const playerId = parsedUrl.searchParams.get('playerId');
        const history = sessionManager.getMatchHistory(limit, effectiveToken, playerId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ history: scrubCredentials(history) }));
      } catch (err) {
        const statusCode = (err.code === 'AUTHENTICATION_REQUIRED' || err.code === 'INVALID_AUTH_TOKEN' || err.message.includes('AUTHENTICATION')) ? 401 : 400;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: err.code }));
      }
      return;
    }

    // GET /api/sessions/health
    if (subRoute === 'health' && req.method === 'GET') {
      const health = sessionManager.store.validateStorageHealth();
      res.writeHead(health.healthy ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    // Match-specific routes: /api/sessions/:matchId or /api/sessions/:matchId/:action
    if (parts[2]) {
      const matchId = parts[2];

      // GET /api/sessions/:matchId/events
      if (subAction === 'events' && req.method === 'GET') {
        try {
          const sinceSeq = parseInt(parsedUrl.searchParams.get('sinceSeq') || '0', 10);
          const events = await sessionManager.getEvents(matchId, sinceSeq, effectiveToken);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ matchId, events }));
        } catch (err) {
          const statusCode = (err.code === 'AUTHENTICATION_REQUIRED' || err.code === 'INVALID_AUTH_TOKEN' || err.message.includes('AUTHENTICATION') || err.message.includes('INVALID_AUTH')) ? 401
            : (err.message.includes('NOT_FOUND') ? 404 : 400);
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }

      // POST /api/sessions/:matchId/heartbeat
      if (subAction === 'heartbeat' && req.method === 'POST') {
        try {
          const body = await readJsonBody(req).catch(() => ({}));
          const authToken = body.authToken || effectiveToken;
          const result = await sessionManager.recordHeartbeat(matchId, authToken);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          const statusCode = (err.code === 'AUTHENTICATION_REQUIRED' || err.code === 'INVALID_AUTH_TOKEN' || err.message.includes('AUTHENTICATION') || err.message.includes('INVALID_AUTH')) ? 401
            : (err.message.includes('NOT_FOUND') ? 404 : 400);
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }

      // POST /api/sessions/:matchId/ticket (Short-lived single-use transport ticket)
      if (subAction === 'ticket' && req.method === 'POST') {
        try {
          const body = await readJsonBody(req).catch(() => ({}));
          const authToken = body.authToken || effectiveToken;
          const ticketData = sessionManager.issueTransportTicket(matchId, authToken);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(ticketData));
        } catch (err) {
          const statusCode = (err.code === 'AUTHENTICATION_REQUIRED' || err.code === 'INVALID_AUTH_TOKEN' || err.message.includes('AUTHENTICATION')) ? 401
            : (err.message.includes('NOT_FOUND') ? 404 : 400);
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }

      // GET /api/sessions/:matchId/stream (Real-Time Server-Sent Events)
      if (subAction === 'stream' && req.method === 'GET') {
        try {
          const session = sessionManager.store.loadSession(matchId);
          if (!session) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Match "${matchId}" not found` }));
            return;
          }

          // Check for single-use transport ticket first
          const ticketParam = parsedUrl.searchParams.get('ticket');
          let viewerSide = null;
          if (ticketParam) {
            const redeemed = sessionManager.redeemTransportTicket(ticketParam, matchId);
            if (redeemed) {
              viewerSide = redeemed.viewerSide;
            }
          }

          if (!viewerSide) {
            if (!effectiveToken) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'AUTHENTICATION_REQUIRED: Missing auth token or ticket' }));
              return;
            }
            const tokenH = hashToken(effectiveToken);
            if (session.player1.tokenHash === tokenH) viewerSide = 'player';
            else if (session.player2.tokenHash === tokenH) viewerSide = 'opponent';

            if (!viewerSide) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'INVALID_AUTH_TOKEN: Unauthorized token or ticket' }));
              return;
            }
          }

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          // Replay missed events
          const sinceSeq = parseInt(req.headers['last-event-id'] || parsedUrl.searchParams.get('sinceSeq') || '0', 10);
          const initialEvents = await sessionManager.getEvents(matchId, sinceSeq, viewerSide);
          for (const evt of initialEvents) {
            res.write(`id: ${evt.seq}\nevent: match_event\ndata: ${JSON.stringify(evt)}\n\n`);
          }

          // Subscribe for real-time live events
          const unsubscribe = sessionManager.subscribe(matchId, viewerSide, (evt) => {
            res.write(`id: ${evt.seq}\nevent: match_event\ndata: ${JSON.stringify(evt)}\n\n`);
          });

          req.on('close', () => {
            unsubscribe();
          });
        } catch (err) {
          if (!res.headersSent) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          } else {
            res.end();
          }
        }
        return;
      }

      // POST /api/sessions/:matchId/action
      if (subAction === 'action' && req.method === 'POST') {
        try {
          const body = await readJsonBody(req);
          const authToken = body.authToken || body.authContext?.authToken || effectiveToken;
          const actionPayload = (body.action && typeof body.action === 'object') ? body.action : body;
          const result = await sessionManager.submitPlayerAction(matchId, actionPayload, { authToken });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          const statusCode = err.status || (
            (err.message.includes('AUTHENTICATION') || err.message.includes('INVALID_AUTH')) ? 401 :
            (err.message.includes('IMPERSONATION') || err.message.includes('NOT_ACTIVE_PLAYER') || err.message.includes('NOT_PRIORITY_PLAYER') || err.message.includes('RESPONSE_WINDOW_ACTIVE') || err.message.includes('UNAUTHORIZED_DECISION_OWNER')) ? 403 :
            (err.message.includes('PAYLOAD_CONFLICT') || err.code === 'PAYLOAD_CONFLICT') ? 409 : 400
          );
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }

      // POST /api/sessions/:matchId/reconnect
      if (subAction === 'reconnect' && req.method === 'POST') {
        try {
          const body = await readJsonBody(req);
          const authToken = body.authToken || effectiveToken;
          const result = await sessionManager.reconnectToMatch(matchId, authToken);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          const statusCode = (err.message.includes('AUTHENTICATION') || err.message.includes('INVALID_AUTH')) ? 401 : 400;
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }

      // POST /api/sessions/:matchId/leave
      if (subAction === 'leave' && req.method === 'POST') {
        try {
          const body = await readJsonBody(req);
          const authToken = body.authToken || effectiveToken;
          const result = await sessionManager.leaveArena(matchId, authToken);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, match: result }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }

      // POST /api/sessions/:matchId/forfeit
      if (subAction === 'forfeit' && req.method === 'POST') {
        try {
          const body = await readJsonBody(req);
          const authToken = body.authToken || effectiveToken;
          const result = await sessionManager.forfeitMatch(matchId, authToken, body.reason);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }

      // GET /api/sessions/:matchId (query state & clock)
      if (!subAction && req.method === 'GET') {
        try {
          const result = await sessionManager.getPlayerMatchState(matchId, effectiveToken || null);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          const statusCode = (err.code === 'AUTHENTICATION_REQUIRED' || err.code === 'INVALID_AUTH_TOKEN' || err.message.includes('AUTHENTICATION') || err.message.includes('INVALID_AUTH')) ? 401
            : (err.message.includes('NOT_FOUND') ? 404 : 400);
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message, code: err.code }));
        }
        return;
      }
    }
  }

const ALLOWED_IMAGE_DOMAINS = [
  'battlespirits.com',
  'asia-en.battlespirits.com',
  'battle-spirits.fandom.com',
  'static.wikia.nocookie.net',
  'images.wikia.com',
  'raw.githubusercontent.com'
];

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB strict limit

function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  let cleanIp = ip.toLowerCase().trim();

  if (cleanIp.startsWith('::ffff:')) {
    const rest = cleanIp.slice(7);
    if (net.isIPv4(rest)) return isPrivateOrReservedIp(rest);
    cleanIp = rest;
  }

  if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1' || cleanIp === '::') return true;
  if (/^fe[89ab][0-9a-f]:/i.test(cleanIp) || cleanIp.startsWith('fe80:')) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(cleanIp) || cleanIp.startsWith('fc00:') || cleanIp.startsWith('fd00:')) return true;
  if (cleanIp.startsWith('ff')) return true;

  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [b0, b1, b2, b3] = parts;

    if (b0 === 0) return true;
    if (b0 === 10) return true;
    if (b0 === 127) return true;
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    if (b0 === 169 && b1 === 254) return true;
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    if (b0 === 192 && b1 === 0 && (b2 === 0 || b2 === 2)) return true;
    if (b0 === 192 && b1 === 168) return true;
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;
    if (b0 === 198 && b1 === 51 && b2 === 100) return true;
    if (b0 === 203 && b1 === 0 && b2 === 113) return true;
    if (b0 >= 224) return true;
    if (b0 === 255 && b1 === 255 && b2 === 255 && b3 === 255) return true;

    return false;
  }

  return false;
}

function isAllowedHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase().trim();
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (net.isIP(host)) return false;
  return ALLOWED_IMAGE_DOMAINS.includes(host);
}

async function validateAndPinTarget(parsedTarget) {
  if (!isAllowedHost(parsedTarget.hostname)) {
    return { error: 'Destination host not permitted', status: 403 };
  }
  if (parsedTarget.protocol !== 'https:') {
    return { error: 'Disallowed protocol: HTTPS required', status: 400 };
  }
  if (parsedTarget.port && parsedTarget.port !== '443') {
    return { error: 'Disallowed port: Only port 443 permitted', status: 400 };
  }

  let addresses;
  try {
    addresses = await dns.promises.lookup(parsedTarget.hostname, { all: true });
  } catch (err) {
    return { error: 'DNS resolution error', status: 502 };
  }

  if (!addresses || addresses.length === 0) {
    return { error: 'DNS lookup failed: No addresses found', status: 502 };
  }

  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr.address)) {
      return { error: 'Access to private network address denied', status: 403 };
    }
  }

  return {
    pinnedIp: addresses[0].address,
    pinnedFamily: addresses[0].family
  };
}

async function fetchUpstreamImage(parsedTarget, clientRes, redirectCount = 0) {
  if (redirectCount > 3) {
    clientRes.writeHead(508, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: 'Too many redirects' }));
    return;
  }

  const pinResult = await validateAndPinTarget(parsedTarget);
  if (pinResult.error) {
    clientRes.writeHead(pinResult.status, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: pinResult.error }));
    return;
  }

  const { pinnedIp, pinnedFamily } = pinResult;

  const reqOptions = {
    hostname: parsedTarget.hostname,
    port: 443,
    path: parsedTarget.pathname + parsedTarget.search,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BattleSpiritsEternal/1.0',
      'Referer': parsedTarget.origin,
      'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.8'
    },
    lookup: (hostname, options, callback) => {
      callback(null, pinnedIp, pinnedFamily);
    },
    servername: parsedTarget.hostname,
    timeout: 6000
  };

  const proxyReq = https.get(reqOptions, (proxyRes) => {
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
      proxyRes.resume();
      let redirectUrl;
      try {
        redirectUrl = new URL(proxyRes.headers.location, parsedTarget.href);
      } catch {
        clientRes.writeHead(400, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: 'Invalid redirect location' }));
        return;
      }
      return fetchUpstreamImage(redirectUrl, clientRes, redirectCount + 1);
    }

    if (proxyRes.statusCode !== 200) {
      proxyRes.resume();
      clientRes.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: `Upstream returned status ${proxyRes.statusCode}` }));
      return;
    }

    const contentType = (proxyRes.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      proxyRes.resume();
      clientRes.writeHead(400, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Upstream returned non-image content-type' }));
      return;
    }

    const contentLength = parseInt(proxyRes.headers['content-length'] || '0', 10);
    if (contentLength > MAX_IMAGE_BYTES) {
      proxyRes.resume();
      clientRes.writeHead(413, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Upstream image exceeds 5MB limit' }));
      return;
    }

    const chunks = [];
    let totalBytes = 0;
    let limitExceeded = false;

    proxyRes.on('data', (chunk) => {
      if (limitExceeded) return;
      totalBytes += chunk.length;
      if (totalBytes > MAX_IMAGE_BYTES) {
        limitExceeded = true;
        proxyReq.destroy();
        proxyRes.destroy();
        if (!clientRes.headersSent) {
          clientRes.writeHead(413, { 'Content-Type': 'application/json' });
          clientRes.end(JSON.stringify({ error: 'Upstream image exceeds 5MB limit' }));
        }
        return;
      }
      chunks.push(chunk);
    });

    proxyRes.on('end', () => {
      if (limitExceeded || clientRes.headersSent) return;
      const body = Buffer.concat(chunks);
      clientRes.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*'
      });
      clientRes.end(body);
    });

    proxyRes.on('error', () => {
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: 'Upstream streaming error' }));
      }
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!clientRes.headersSent) {
      clientRes.writeHead(504, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Proxy request timed out' }));
    }
  });

  proxyReq.on('error', (err) => {
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Upstream connection error' }));
    }
  });
}

  // Image proxy endpoint to bypass CORS and referer hotlinking blocks (Protected against SSRF)
  if (pathname.toLowerCase() === '/api/proxy-image' || pathname.toLowerCase() === '/api/image-proxy') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing url param' }));
      return;
    }

    let parsedTarget;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid url format' }));
      return;
    }

    fetchUpstreamImage(parsedTarget, res, 0);
    return;
  }

  // /api/filters
  if (pathname.toLowerCase() === '/api/filters') {
    if (!cachedFilters) {
      try {
        const raw = fs.readFileSync(path.join(__dirname, 'filters_data.json'), 'utf8');
        cachedFilters = JSON.parse(raw);
      } catch (e) {
        cachedFilters = {};
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cachedFilters));
    return;
  }

  // /api/featured-x-rares
  if (pathname.toLowerCase() === '/api/featured-x-rares') {
    const color = parsedUrl.searchParams.get('color');
    let cards = [];
    if (serverDb) {
      try {
        const colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
        let targetColors = colors;
        let perColor = 4;
        if (color && colors.map(c => c.toLowerCase()).includes(color.toLowerCase())) {
          targetColors = [color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()];
          perColor = 18;
        }
        for (const col of targetColors) {
          const stmt = serverDb.prepare(`
            SELECT name, cost, color, type, family, rarity, image_url, card_number, effect, levels
            FROM cards
            WHERE color = ?
              AND LOWER(type) = 'spirit'
              AND cost >= 8
              AND image_url IS NOT NULL AND image_url != ''
            ORDER BY RANDOM() LIMIT ?
          `);
          const rows = stmt.all(col, perColor);
          for (const row of rows) {
            if (row.levels && typeof row.levels === 'string') {
              try { row.levels = JSON.parse(row.levels); } catch(e) {}
            }
            cards.push(row);
          }
        }
        cards = cards.sort(() => Math.random() - 0.5);
      } catch (e) {
        console.warn('[Server] Error querying live featured spirits:', e.message);
      }
    }

    if (!cards || !cards.length) {
      try {
        const raw = fs.readFileSync(path.join(__dirname, 'featured_x_rares.json'), 'utf8');
        cachedFeaturedXRares = JSON.parse(raw);
      } catch (e) {
        if (!cachedFeaturedXRares) cachedFeaturedXRares = { cards: [], by_color: {} };
      }
      if (color && cachedFeaturedXRares.by_color) {
        const capColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
        const pool = cachedFeaturedXRares.by_color[capColor] || [];
        cards = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);
      } else if (cachedFeaturedXRares.by_color) {
        // Pick a balanced, randomized mix across all 6 colors (4 per color = 24 cards)
        const colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
        colors.forEach(col => {
          const pool = cachedFeaturedXRares.by_color[col] || [];
          const sample = [...pool].sort(() => Math.random() - 0.5).slice(0, 4);
          cards.push(...sample);
        });
        cards = cards.sort(() => Math.random() - 0.5);
      } else {
        const pool = cachedFeaturedXRares.cards || [];
        cards = [...pool].sort(() => Math.random() - 0.5).slice(0, 24);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ cards }));
    return;
  }

  // /api/ai-weights
  if (pathname.toLowerCase() === '/api/ai-weights') {
    if (!cachedAiWeights) {
      try {
        const raw = fs.readFileSync(path.join(__dirname, 'ai_weights.json'), 'utf8');
        cachedAiWeights = JSON.parse(raw);
      } catch (e) {
        cachedAiWeights = {};
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cachedAiWeights));
    return;
  }

  // /api/keywords
  if (pathname.toLowerCase() === '/api/keywords') {
    if (!cachedKeywordsData) {
      const keywordCatalog = [
        // ── COMBAT & ATTACK ──
        { id: 'clash', name: 'Clash', jp: '激突', category: 'Combat & Attack', icon: '⚔️', query: 'Clash', desc: 'Forces the opponent to block if possible when attacking.' },
        { id: 'true-clash', name: 'True-Clash', jp: '真・激突', category: 'Combat & Attack', icon: '⚔️', query: 'True-Clash', desc: 'Enhanced clash forcing block and bypassing specific defensive abilities.' },
        { id: 'rush', name: 'Rush', jp: '連鎖', category: 'Combat & Attack', icon: '🔗', query: 'Rush', desc: 'Triggers additional effects if you control specific color symbols on your field.' },
        { id: 'consecutive-blade', name: 'Consecutive Blade', jp: '連刃', category: 'Combat & Attack', icon: '🗡️', query: 'Consecutive Blade', desc: 'Can battle two opposing spirits simultaneously, dealing damage to both.' },
        { id: 'assault', name: 'Assault', jp: '強襲', category: 'Combat & Attack', icon: '💥', query: 'Assault', desc: 'Can refresh itself by exhausting a Nexus you control after attacking.' },
        { id: 'crush', name: 'Crush', jp: '粉砕', category: 'Combat & Attack', icon: '🔨', query: 'Crush', desc: 'Discards cards from the top of the opponent\'s deck equal to this Spirit\'s Level.' },
        { id: 'great-crush', name: 'Great Crush', jp: '大粉砕', category: 'Combat & Attack', icon: '☄️', query: 'Great Crush', desc: 'Discards cards from the top of the opponent\'s deck equal to this Spirit\'s Level; burst cards discarded trigger heavy penalties.' },
        { id: 'windstorm', name: 'Windstorm', jp: '旋風', category: 'Combat & Attack', icon: '🌪️', query: 'Windstorm', desc: 'Exhausts target opposing Spirits/Ultimates when attacking or battling.' },
        { id: 'whirlwind', name: 'Whirlwind', jp: '大旋風', category: 'Combat & Attack', icon: '🌪️', query: 'Whirlwind', desc: 'Exhausts multiple opposing units and prevents them from refreshing on the next turn.' },
        { id: 'curse', name: 'Curse', jp: '呪撃', category: 'Combat & Attack', icon: '💀', query: 'Curse', desc: 'Destroys the opposing spirit at the end of battle if this spirit was blocked.' },
        { id: 'true-curse', name: 'True-Curse', jp: '真・呪撃', category: 'Combat & Attack', icon: '☠️', query: 'True-Curse', desc: 'Destroys blocking spirit and drains an opponent life core to Trash.' },
        { id: 'holy-life', name: 'Holy Life', jp: '聖命', category: 'Combat & Attack', icon: '✨', query: 'Holy Life', desc: 'Recovers a Life from the Void when this Spirit successfully reduces the opponent\'s life.' },
        { id: 'heavy-exhaust', name: 'Heavy Exhaust', jp: '重疲労', category: 'Combat & Attack', icon: '💤', query: 'Heavy Exhaust', desc: 'Puts opposing cards into upside-down Heavy Exhaustion; requires two refreshes to ready.' },
        { id: 'poison-blade', name: 'Poison Blade', jp: '毒刃', category: 'Combat & Attack', icon: '🧪', query: 'Poison Blade', desc: 'Places face-down cards beneath targeted spirits as poison tokens that weaken or destroy them.' },
        { id: 'showdown', name: 'Showdown', jp: '一騎打', category: 'Combat & Attack', icon: '🥋', query: 'Showdown', desc: 'Locks both spirits in honorable 1v1 combat where outside card effects cannot intervene.' },
        { id: 'soar', name: 'Soar', jp: '飛翔', category: 'Combat & Attack', icon: '🦅', query: 'Soar', desc: 'Cannot be blocked by opposing spirits without flying or matching aerial traits.' },
        { id: 'stampede', name: 'Stampede', jp: '突進', category: 'Combat & Attack', icon: '🦏', query: 'Stampede', desc: 'Tramples through blockers, dealing excess battle damage directly to opposing Life.' },
        { id: 'dispersion', name: 'Dispersion', jp: '分散', category: 'Combat & Attack', icon: '✨', query: 'Dispersion', desc: 'Splits incoming single-target combat damage and redistributes it across opposing units.' },

        // ── SUMMON & EVOLUTION ──
        { id: 'advent', name: 'Advent', jp: '煌臨', category: 'Summon & Evolution', icon: '🌟', query: 'Advent', desc: 'Stacks directly atop an eligible target Spirit on your field at Flash timing without paying cost.' },
        { id: 'contract-advent', name: 'Contract Advent', jp: '契約煌臨', category: 'Summon & Evolution', icon: '📜', query: 'Contract Advent', desc: 'Modern contract evolution: stacks atop Contract cards or partners when Count requirement is met.' },
        { id: 'grand-advent', name: 'Grand Advent', jp: '神煌臨', category: 'Summon & Evolution', icon: '👑', query: 'Grand Advent', desc: 'Divine Advent atop Grandstones or Divine Spirits, channeling Grandwalker core power.' },
        { id: 'manifest', name: 'Manifest', jp: '顕現', category: 'Summon & Evolution', icon: '💫', query: 'Manifest', desc: 'Summons Apparition and Contract Ultimates directly from hand by fulfilling count and condition.' },
        { id: 'accel', name: 'Accel', jp: 'アクセル', category: 'Summon & Evolution', icon: '⚡', query: 'Accel', desc: 'Magic-like effect cast directly from hand, placing the card face-up in the Open Zone to be summoned later.' },
        { id: 'rebirth', name: 'Rebirth', jp: '転醒', category: 'Summon & Evolution', icon: '🔄', query: 'Rebirth', desc: 'Flips a double-faced card to its awakened back face when specific battlefield conditions are triggered.' },
        { id: 'change', name: 'Change', jp: 'チェンジ', category: 'Summon & Evolution', icon: '🔀', query: 'Change', desc: 'Swaps this card from hand with an attacking or battling Spirit on your field during Flash timing.' },
        { id: 'awaken', name: 'Awaken', jp: '覚醒', category: 'Summon & Evolution', icon: '🔥', query: 'Awaken', desc: 'Moves cores from your other Spirits onto this Spirit at Flash timing.' },
        { id: 'high-speed', name: 'High Speed', jp: '神速', category: 'Summon & Evolution', icon: '💨', query: 'High Speed', desc: 'Can be summoned from your hand during Flash timing by paying costs using cores from your Reserve.' },
        { id: 'violent-high-speed', name: 'Violent High Speed', jp: '烈神速', category: 'Summon & Evolution', icon: '🌪️', query: 'Violent High Speed', desc: 'Flash timing summon using cores entirely from your Trash back to your field/reserve.' },
        { id: 'sound-speed', name: 'Sound Speed', jp: '音速', category: 'Summon & Evolution', icon: '🚀', query: 'Sound Speed', desc: 'Accelerated flash summon directly during battle steps at sound barrier speeds.' },
        { id: 'tribute', name: 'Tribute', jp: '転召', category: 'Summon & Evolution', icon: '👑', query: 'Tribute', desc: 'Sends all cores from a friendly Spirit of specified cost or higher to Void/Trash to complete summon.' },
        { id: 'unsheathe', name: 'Unsheathe', jp: '抜刀', category: 'Summon & Evolution', icon: '⚔️', query: 'Unsheathe', desc: 'Immediately summons a Brave from your hand without paying its cost upon summoning.' },
        { id: 'bunshin', name: 'Bunshin', jp: '分身', category: 'Summon & Evolution', icon: '👥', query: 'Bunshin', desc: 'Places decktop cards face-down onto the field as 0-cost green spirit duplicates.' },
        { id: 'summon-bolt', name: 'Summon Bolt', jp: '召雷', category: 'Summon & Evolution', icon: '⚡', query: 'Summon Bolt', desc: 'Discards this spirit at end of battle to summon higher-cost spirits from your deck or hand.' },

        // ── DEFENSE & BURST ──
        { id: 'burst', name: 'Burst', jp: 'バースト', category: 'Defense & Burst', icon: '🛡️', query: 'Burst', desc: 'Set face-down in the Burst slot; triggers freely when the opponent triggers the specified condition.' },
        { id: 'soul-burst', name: 'Soul Burst', jp: 'ソウルバースト', category: 'Defense & Burst', icon: '🔥', query: 'Soul Burst', desc: 'Set in the Burst slot; triggers powerful additional abilities if your Soul Core is in your Trash.' },
        { id: 'burst-seal', name: 'Burst Seal', jp: 'バースト封印', category: 'Defense & Burst', icon: '🔒', query: 'Burst Seal', desc: 'Seals an opposing Burst card face-up or prevents Bursts from triggering during this step.' },
        { id: 'armor', name: 'Armor', jp: '装甲', category: 'Defense & Burst', icon: '🔰', query: 'Armor', desc: 'Immune to opposing Spirits, Nexuses, and Magic of specified colors.' },
        { id: 'heavy-armor', name: 'Heavy Armor', jp: '重装甲', category: 'Defense & Burst', icon: '🛡️', query: 'Heavy Armor', desc: 'Immune to opposing Spirits, Braves, Nexuses, and Magic of specified colors.' },
        { id: 'ultra-armor', name: 'Ultra Armor', jp: '超装甲', category: 'Defense & Burst', icon: '👑', query: 'Ultra Armor', desc: 'Ultimate immunity: unaffected by opposing Spirits, Ultimates, Braves, Nexuses, and Magic of specified colors.' },
        { id: 'ultra-heavy-armor', name: 'Ultra Heavy Armor', jp: '超重装甲', category: 'Defense & Burst', icon: '💎', query: 'Ultra Heavy Armor', desc: 'Top tier absolute immunity unaffected by opposing Spirits, Braves, Nexuses, Magics, and Grandwalkers.' },
        { id: 'ice-wall', name: 'Ice Wall', jp: '氷壁', category: 'Defense & Burst', icon: '🧊', query: 'Ice Wall', desc: 'Exhausts this Spirit during opposing Flash timing to nullify opposing Magic of a specified color.' },
        { id: 'kagemusha', name: 'Kagemusha', jp: '影武者', category: 'Defense & Burst', icon: '🥷', query: 'Kagemusha', desc: 'Summons from hand during Flash timing to intercept and redirect targeting effects away from friendly cards.' },
        { id: 'barrier', name: 'Barrier', jp: '障壁', category: 'Defense & Burst', icon: '🚧', query: 'Barrier', desc: 'Negates effect damage or direct destruction by exhausting or discarding a card.' },
        { id: 'fortress', name: 'Fortress', jp: '城塞', category: 'Defense & Burst', icon: '🏰', query: 'Fortress', desc: 'Fortifies Nexuses and core fields, preventing opposing spirits from reducing life while active.' },
        { id: 'zero-counter', name: 'Zero Counter', jp: 'ゼロカウンター', category: 'Defense & Burst', icon: '⛔', query: 'Zero Counter', desc: 'Interrupt cast for 0 cost from hand whenever the opponent summons units without paying full cost.' },
        { id: 'at-field', name: 'A.T. Field', jp: 'A.T.フィールド', category: 'Defense & Burst', icon: '🔶', query: 'A.T. Field', desc: 'Evangelion absolute defense barrier: unaffected by opposing Spirits/Braves/Magic effects without designated breach abilities.' },
        { id: 'ps-armor', name: 'PS Armor', jp: 'PS装甲', category: 'Defense & Burst', icon: '🤖', query: 'PS Armor', desc: 'Phase Shift Armor: immune to damage and effects from opposing cards of specified costs.' },

        // ── TRIGGERS & RESOURCES ──
        { id: 'soul-drive', name: 'Soul Drive', jp: 'ソウルドライブ', category: 'Triggers & Resources', icon: '💥', query: 'Soul Drive', desc: 'Ultimate game-defining ability activated once per game by banishing the Soul Core from the duel to the Void.' },
        { id: 'u-trigger', name: 'Ultimate Trigger', jp: 'Uトリガー', category: 'Triggers & Resources', icon: '🎯', query: 'Ultimate Trigger', desc: 'Moves the top card of the opponent\'s deck to Trash; if its cost is lower than this Ultimate\'s, it Hits!' },
        { id: 'mirage', name: 'Mirage', jp: 'ミラージュ', category: 'Triggers & Resources', icon: '🔮', query: 'Mirage', desc: 'Deploys this card face-up into your Set slot, providing continuous passive and triggerable battlefield effects.' },
        { id: 'core-charge', name: 'Core Charge', jp: 'コアチャージ', category: 'Triggers & Resources', icon: '💠', query: 'Core Charge', desc: 'Places cores from the Void onto Grandstones or Nexuses when matching cards are summoned or deployed.' },
        { id: 'count-break', name: 'Count Break', jp: 'カウントブレイク', category: 'Triggers & Resources', icon: '🔢', query: 'Count Break', desc: 'Consumes count or triggers when count reaches a designated milestone.' },
        { id: 'grand-skill', name: 'Grand Skill', jp: '神技', category: 'Triggers & Resources', icon: '⚡', query: 'Grand Skill', desc: 'Spends cores accumulated on Grandstones to activate divine activated abilities.' },
        { id: 'grand-field', name: 'Grand Field', jp: '神域', category: 'Triggers & Resources', icon: '🏛️', query: 'Grand Field', desc: 'Passive divine field aura granted by Grandstones while controlling sufficient cores.' },
        { id: 'grandphosis', name: 'Grandphosis', jp: '神変登極', category: 'Triggers & Resources', icon: '🌌', query: 'Grandphosis', desc: 'Awakens a Grandstone Nexus directly into a colossal Divine Spirit entity.' },
        { id: 'contract-skill', name: 'Contract Skill', jp: '契約神技', category: 'Triggers & Resources', icon: '📜', query: 'Contract Skill', desc: 'Divine activated ability powered by Contract Grandwalker Nexus cores and Count milestones.' },
        { id: 'contract-field', name: 'Contract Field', jp: '契約神域', category: 'Triggers & Resources', icon: '⛩️', query: 'Contract Field', desc: 'Continuous divine domain of Contract Grandwalkers, scaling in power with field Count.' },
        { id: 'unleash', name: 'Unleash', jp: '界放', category: 'Triggers & Resources', icon: '🔓', query: 'Unleash', desc: 'Moves cores from your Grandstones onto this Spirit to unlock superior hidden effects.' },
        { id: 'contract-unleash', name: 'Contract Unleash', jp: '契約界放', category: 'Triggers & Resources', icon: '🌟', query: 'Contract Unleash', desc: 'Channels cores from Contract Grandstone Nexuses directly onto the battlefield.' },
        { id: 'seal', name: 'Seal', jp: '封印', category: 'Triggers & Resources', icon: '🔒', query: 'Seal', desc: 'Sends the Soul Core to your Life area as a sacred Seal core to awaken God-King powers.' },
        { id: 'spirit-soul', name: 'Spirit Soul', jp: 'スピリットソウル', category: 'Triggers & Resources', icon: '💎', query: 'Spirit Soul', desc: 'Grants extra symbols strictly used for paying the summoning cost of Ultimates.' },
        { id: 'double-drive', name: 'Double Drive', jp: 'ダブルドライブ', category: 'Triggers & Resources', icon: '⚡', query: 'Double Drive', desc: 'Combines two God-Kings with Sword Braves to unleash double game-ending finishers.' },
        { id: 'reload', name: 'Reload', jp: '装弾', category: 'Triggers & Resources', icon: '🔋', query: 'Reload', desc: 'Recharges brave and nexus cards beneath spirits to replenish resources mid-battle.' },

        // ── SPECIAL & TACTICS ──
        { id: 'spellbind', name: 'Spellbind', jp: '呪縛', category: 'Special & Tactics', icon: '🕸️', query: 'Spellbind', desc: 'Hexes opposing spirits and nexuses, preventing their cores from moving to Reserve or Trash.' },
        { id: 'spell-blight', name: 'Spell Blight', jp: '呪滅撃', category: 'Special & Tactics', icon: '☣️', query: 'Spell Blight', desc: 'When this spirit is destroyed, takes down opposing spirits and returns itself to hand or field.' },
        { id: 'immortality', name: 'Immortality', jp: '不死', category: 'Special & Tactics', icon: '🪦', query: 'Immortality', desc: 'Summons this Spirit from your Trash whenever a friendly Spirit of matching cost is destroyed.' },
        { id: 'draw-lock', name: 'Draw Lock', jp: 'ドローロック', category: 'Special & Tactics', icon: '🔏', query: 'Draw Lock', desc: 'Deprives the opponent of their standard Start/Draw Step draw on their next turn.' },
        { id: 'plunder', name: 'Plunder', jp: '強奪', category: 'Special & Tactics', icon: '💰', query: 'Plunder', desc: 'Steals cores or resources from opposing targets and claims them into your reserve.' },
        { id: 'enchain', name: 'Enchain', jp: '拘束', category: 'Special & Tactics', icon: '⛓️', query: 'Enchain', desc: 'Binds opposing targets, preventing attack declaration, blocking, or activation.' },
        { id: 'fast-draw', name: 'Fast Draw', jp: '早撃ち', category: 'Special & Tactics', icon: '🎯', query: 'Fast Draw', desc: 'Triggers instantaneous destruction or damage before the opponent\'s flash step opens.' },
        { id: 'god-strike', name: 'God Strike', jp: '神撃', category: 'Special & Tactics', icon: '🔱', query: 'God Strike', desc: 'Delivers unblockable holy damage scaling with active Grandstone divine cores.' },
        { id: 'god-army', name: 'God-Army', jp: '神軍', category: 'Special & Tactics', icon: '🛡️', query: 'God-Army', desc: 'Swarms the battlefield with holy army vanguard units from your deck or open zone.' },
        { id: 'legacy', name: 'Legacy', jp: '遺産', category: 'Special & Tactics', icon: '🏺', query: 'Legacy', desc: 'Passes down residual BP, symbols, and abilities to successor spirits when destroyed.' },
        { id: 'soul-magic', name: 'Soul Magic', jp: 'ソウルマジック', category: 'Special & Tactics', icon: '🔮', query: 'Soul Magic', desc: 'Specialized magic spells empowered when cast using Soul Cores.' },
        { id: 'amplify', name: 'Amplify', jp: '増幅', category: 'Special & Tactics', icon: '📢', query: 'Amplify', desc: 'Multiplies effect damage, BP boosts, or symbol gains by the number of matching allies.' },

        // ── COLLAB & DIVA ──
        { id: 'on-stage', name: 'On Stage', jp: 'オンステージ', category: 'Collab & Diva', icon: '🎤', query: 'On Stage', desc: 'Diva ability: returns this costume Spirit to hand/deck bottom to summon a stage-ready Diva Spirit without paying cost.' },
        { id: 'show-up', name: 'Show Up', jp: 'ショーアップ', category: 'Collab & Diva', icon: '💃', query: 'Show Up', desc: 'Diva costume change: swaps into a higher rarity dress from hand at Flash timing.' },
        { id: 'friend', name: 'Friend', jp: 'フレンド', category: 'Collab & Diva', icon: '👭', query: 'Friend', desc: 'Reveals top deck cards; if an idol card is found, summons it directly onto the stage for free.' },
        { id: 'appeal', name: 'Appeal', jp: 'アピール', category: 'Collab & Diva', icon: '💖', query: 'Appeal', desc: 'Stage performance: captivates audience to negate battle damage or recover life.' },
        { id: 'my-unit', name: 'My Unit', jp: 'マイユニット', category: 'Collab & Diva', icon: '🎶', query: 'My Unit', desc: 'Forms an idol unit by exhausting adjacent Diva spirits to trigger unique ensemble abilities.' },
        { id: 'solo-part', name: 'Solo Part', jp: 'ソロパート', category: 'Collab & Diva', icon: '🎙️', query: 'Solo Part', desc: 'Spotlight focus: triggers devastating single-unit performance when no other spirits attack.' },
        { id: 'duet-part', name: 'Duet Part', jp: 'デュエットパート', category: 'Collab & Diva', icon: '👯', query: 'Duet Part', desc: 'Harmonized two-idol melody combining stats and battle effects together.' },
        { id: 'diva-rush', name: 'Diva Rush', jp: 'ディーバ連鎖', category: 'Collab & Diva', icon: '🎀', query: 'Diva Rush', desc: 'Triggers encore performances if specific idol teams or costumes are assembled.' },
        { id: 'spellsong', name: 'Spellsong', jp: '歌声', category: 'Collab & Diva', icon: '🎵', query: 'Spellsong', desc: 'Chants melodic spells from hand without consuming core costs.' },
        { id: 'digivolution', name: 'Digivolution', jp: '進化', category: 'Collab & Diva', icon: '🦖', query: 'Digivolution', desc: 'Digimon collaboration: stacks higher-level forms atop Rookie/Champion digimon on the field.' },
        { id: 'card-slash', name: 'Card Slash', jp: 'スラッシュ', category: 'Collab & Diva', icon: '💳', query: 'Card Slash', desc: 'Digimon Tamers card modification granting rapid stat buffs and keyword skills.' },
        { id: 'trans-am', name: 'Trans-Am', jp: 'トランザム', category: 'Collab & Diva', icon: '🚀', query: 'Trans-Am', desc: 'Gundam 00 GN particle surge: multiplies BP, adds extra symbols, and exhausts opposing field.' },
        { id: 'clock-up', name: 'Clock Up', jp: 'クロックアップ', category: 'Collab & Diva', icon: '⏱️', query: 'Clock Up', desc: 'Kamen Rider Kabuto tachyon acceleration: acts at lightspeed before opponent can react.' },
        { id: 'cast-off', name: 'Cast Off', jp: 'キャストオフ', category: 'Collab & Diva', icon: '🛡️', query: 'Cast Off', desc: 'Kamen Rider mask shedding: purges heavy armor to reveal agile high-BP rider form.' },
        { id: 'chou-henshin', name: 'Chou Henshin', jp: '超変身', category: 'Collab & Diva', icon: '⚡', query: 'Chou Henshin', desc: 'Kamen Rider Kuuga form transition: transforms between Mighty, Dragon, Pegasus, and Titan forms.' },
        { id: 'funnel', name: 'Funnel', jp: 'ファネル', category: 'Collab & Diva', icon: '🛰️', query: 'Funnel', desc: 'Gundam remote all-range weapons: strikes multiple opposing targets simultaneously.' },
        { id: 'top-gun', name: 'Top Gun', jp: 'トップガン', category: 'Collab & Diva', icon: '✈️', query: 'Top Gun', desc: 'Elite ace pilot coordination: grants unblockable strikes and aerial dominance.' }
      ];

      // Calculate counts from SQLite matching /api/cards query logic exactly!
      if (serverDb) {
        try {
          const countStmt = serverDb.prepare(`
            SELECT count(*) as total FROM cards 
            WHERE name LIKE ? OR effect LIKE ? OR kanji LIKE ?
          `);
          for (const item of keywordCatalog) {
            const kwQuery = item.query || item.name;
            const term = `%${kwQuery}%`;
            const row = countStmt.get(term, term, term);
            item.cardCount = row ? row.total : 0;
          }
        } catch (e) {
          console.warn('[Keywords API] Failed to count keywords:', e);
        }
      }
      cachedKeywordsData = keywordCatalog;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ keywords: cachedKeywordsData }));
    return;
  }

  // /api/card-effects-db
  if (pathname.toLowerCase() === '/api/card-effects-db') {
    const dbPath = path.join(__dirname, 'card_effects_db.json');
    if (fs.existsSync(dbPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const stream = fs.createReadStream(dbPath);
      stream.pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'card_effects_db.json not found' }));
    return;
  }

  // /api/standard-decks
  if (pathname.toLowerCase() === '/api/standard-decks') {
    if (!cachedStandardDecks) {
      try {
        const stdRaw = fs.readFileSync(path.join(__dirname, 'standard_decks_data.json'), 'utf8');
        cachedStandardDecks = JSON.parse(stdRaw);
      } catch (e) {
        cachedStandardDecks = { decks: [] };
      }
    }
    const color = parsedUrl.searchParams.get('color');
    if (color) {
      const list = cachedStandardDecks.decks || [];
      const found = list.find(d => (d.color || '').toLowerCase() === color.toLowerCase());
      if (found) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(found));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Standard deck for color ${color} not found` }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cachedStandardDecks));
    return;
  }

  // /api/local-decks
  if (pathname.toLowerCase() === '/api/local-decks') {
    try {
      const localDir = path.join(__dirname, 'local-decks');
      if (fs.existsSync(localDir)) {
        const files = fs.readdirSync(localDir).filter(f => f.endsWith('.txt'));
        const decks = files.map(file => {
          const content = fs.readFileSync(path.join(localDir, file), 'utf8');
          const lines = content.split('\n');
          const cards = {};
          let totalCards = 0;
          lines.forEach(l => {
            l = l.trim();
            if (!l || l.startsWith('#')) return;
            const match = l.match(/^(\d+)x?\s+(.+)$/i);
            if (match) {
              const qty = parseInt(match[1], 10);
              const name = match[2].trim();
              cards[name] = (cards[name] || 0) + qty;
              totalCards += qty;
            }
          });
          const baseName = file.replace(/\.txt$/i, '');
          const cleanTitle = baseName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return {
            id: 'local_' + baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            filename: file,
            name: cleanTitle,
            totalCards,
            cards
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ decks }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ decks: [] }));
      return;
    } catch (err) {
      console.error('[API /api/local-decks Error]:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, decks: [] }));
      return;
    }
  }

  // /api/autocomplete
  if (pathname.toLowerCase() === '/api/autocomplete') {
    ensureCardsIndexLoaded();
    const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
    const limit = Math.min(20, Math.max(1, parseInt(parsedUrl.searchParams.get('limit') || '8', 10)));
    const results = [];
    if (q) {
      for (const [code, entry] of Object.entries(cachedCardsIndex)) {
        if (!entry || !entry.name) continue;
        const nameMatch = entry.name.toLowerCase().includes(q);
        const codeMatch = (entry.card_number || code).toLowerCase().includes(q);
        if (nameMatch || codeMatch) {
          results.push({
            name: entry.name,
            card_number: entry.card_number || code,
            type: entry.type || 'Spirit',
            cost: entry.cost !== undefined ? entry.cost : 0,
            color: (entry.colors && entry.colors[0]) || entry.color || 'Red',
            image_url: entry.image_url || ''
          });
          if (results.length >= limit) break;
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
    return;
  }

  // /api/cards (Full library search with SQLite & keyword alias support)
  if (pathname.toLowerCase() === '/api/cards') {
    if (serverDb) {
      try {
        const conditions = ["image_url IS NOT NULL AND TRIM(image_url) != ''"];
        const sqlParams = [];

        const query = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '').trim();
        const scope = parsedUrl.searchParams.get('scope') || 'all';
        const color = (parsedUrl.searchParams.get('color') || '').trim();
        const cardType = (parsedUrl.searchParams.get('type') || parsedUrl.searchParams.get('card_type') || '').trim();
        const rarity = (parsedUrl.searchParams.get('rarity') || '').trim();
        const family = (parsedUrl.searchParams.get('family') || '').trim();
        const setName = (parsedUrl.searchParams.get('set') || parsedUrl.searchParams.get('set_name') || '').trim();
        const generation = (parsedUrl.searchParams.get('generation') || parsedUrl.searchParams.get('saga') || '').trim();
        const cost = (parsedUrl.searchParams.get('cost') || '').trim();
        const sortBy = parsedUrl.searchParams.get('sort_by') || parsedUrl.searchParams.get('sort') || 'cost_asc';
        const limit = Math.min(100, Math.max(1, parseInt(parsedUrl.searchParams.get('limit') || '24', 10)));
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const offset = parsedUrl.searchParams.get('offset') !== null ? parseInt(parsedUrl.searchParams.get('offset'), 10) : (page - 1) * limit;

        if (query) {
          const ql = query.toLowerCase();
          let searchTerms = [query];
          if (ql === 'soul burst' || ql === 'soulburst' || ql === 'soul-burst' || ql === 'burst s' || ql === 'burst: s' || ql === 'burst:s' || ql === 'burst s:') {
            searchTerms = ['Soul Burst', '[Soul Burst]', 'ソウルバースト', 'Burst: s', 'Burst: S'];
          } else if (ql === 'burst' || ql === 'bursts') {
            searchTerms = ['Burst', '[Burst', 'バースト'];
          } else if (ql === 'manifest' || ql === 'mani' || ql === 'kengen') {
            searchTerms = ['Manifest', '[Manifest', '顕現'];
          } else if (ql === 'heavy exhaust' || ql === 'heb') {
            searchTerms = ['Heavy Exhaust', '重疲労'];
          } else if (ql === 'ultimate trigger' || ql === 'ut' || ql === 'u trigger' || ql === 'u-trigger') {
            searchTerms = ['Ultimate Trigger', 'U-Trigger', 'Uトリガー'];
          } else if (ql === 'contract advent' || ql === 'contractadvent' || ql === 'keiyaku kourin') {
            searchTerms = ['Contract Advent', '契約煌臨'];
          } else if (ql === 'advent' || ql === 'kourin') {
            searchTerms = ['Advent', '煌臨'];
          } else if (ql === 'violent high speed' || ql === 'vhs' || ql === 'retsujinsoku') {
            searchTerms = ['Violent High Speed', '烈神速'];
          } else if (ql === 'swift' || ql === 'high speed' || ql === 'jinsoku') {
            searchTerms = ['High Speed', 'Swift', '神速'];
          } else if (ql === 'over count' || ql === 'oc') {
            searchTerms = ['During OC', 'OC Condition', 'OC中'];
          } else if (ql === 'soul state') {
            searchTerms = ['Soul State', 'ソウル状態'];
          } else if (ql === 'suadcon' || ql === 'summon advent condition' || ql === 'summon condition') {
            searchTerms = ['Summon Condition', 'Summon/Advent Condition', 'SuAdcon', '召喚条件', '召喚/煌臨条件'];
          } else if (ql === 'spellbind' || ql === 'spell blight' || ql === 'spellblight') {
            searchTerms = ['Spellbind', 'Spell Blight', '呪縛'];
          } else if (ql === 'soul drive' || ql === 'souldrive' || ql === 'soul-drive' || ql === 'ソウルドライブ') {
            searchTerms = ['Soul Drive', '[Soul Drive]', 'ソウルドライブ', '【ソウルドライブ】'];
          } else if (ql === 'accel' || ql === 'accelerate' || ql === 'アクセル') {
            searchTerms = ['Accel', '[Accel', 'アクセル', '【アクセル'];
          } else if (ql === 'mirage' || ql === 'ミラージュ') {
            searchTerms = ['Mirage', '[Mirage', 'ミラージュ'];
          } else if (ql === 'contract' || ql === 'keiyaku') {
            searchTerms = ['Contract', '[Contract', '契約'];
          } else if (ql === 'rush' || ql === 'chain' || ql === '連鎖') {
            searchTerms = ['Rush', '[Rush', '連鎖', '【連鎖'];
          } else if (ql === 'clash' || ql === '激突') {
            searchTerms = ['Clash', '[Clash', '激突', '【激突'];
          } else if (ql === 'curse' || ql === '呪撃') {
            searchTerms = ['Curse', '[Curse', '呪撃', '【呪撃'];
          } else if (ql === 'crush' || ql === '粉砕') {
            searchTerms = ['Crush', '[Crush', '粉砕', '【粉砕'];
          } else if (ql === 'great crush' || ql === '大粉砕') {
            searchTerms = ['Great Crush', '[Great Crush', '大粉砕', '【大粉砕'];
          } else if (ql === 'assault' || ql === '強襲') {
            searchTerms = ['Assault', '[Assault', '強襲', '【強襲'];
          } else if (ql === 'windstorm' || ql === '旋風') {
            searchTerms = ['Windstorm', '[Windstorm', '旋風', '【旋風'];
          } else if (ql === 'holy life' || ql === '聖命') {
            searchTerms = ['Holy Life', '[Holy Life', '聖命', '【聖命'];
          } else if (ql === 'ultra armor' || ql === '超装甲') {
            searchTerms = ['Ultra Armor', '[Ultra Armor', '超装甲', '【超装甲'];
          } else if (ql === 'heavy armor' || ql === '重装甲') {
            searchTerms = ['Heavy Armor', '[Heavy Armor', '重装甲', '【重装甲'];
          } else if (ql === 'armor' || ql === '装甲') {
            searchTerms = ['Armor', '[Armor', '装甲', '【装甲'];
          } else if (ql === 'ice wall' || ql === '氷壁') {
            searchTerms = ['Ice Wall', '[Ice Wall', '氷壁', '【氷壁'];
          } else if (ql === 'consecutive blade' || ql === '連刃') {
            searchTerms = ['Consecutive Blade', '[Consecutive Blade', '連刃', '【連刃'];
          } else if (ql === 'awaken' || ql === '覚醒') {
            searchTerms = ['Awaken', '[Awaken', '覚醒', '【覚醒'];
          } else if (ql === 'rebirth' || ql === 'tensei' || ql === '転醒') {
            searchTerms = ['Rebirth', '[Rebirth', '転醒', '【転醒'];
          } else if (ql === 'kagemusha' || ql === '影武者') {
            searchTerms = ['Kagemusha', '影武者', '【影武者'];
          }

          const orClauses = [];
          for (const term of searchTerms) {
            const tLike = `%${term}%`;
            let qParts = [];
            if (scope === 'name') {
              qParts = ['name LIKE ?', 'kanji LIKE ?', 'jpname LIKE ?'];
              sqlParams.push(tLike, tLike, tLike);
            } else if (scope === 'effect' || scope === 'desc') {
              qParts = ['effect LIKE ?', 'flavor LIKE ?'];
              sqlParams.push(tLike, tLike);
            } else if (scope === 'family') {
              qParts = ['family LIKE ?', 'families_json LIKE ?'];
              sqlParams.push(tLike, tLike);
            } else {
              qParts = [
                'name LIKE ?', 'family LIKE ?', 'families_json LIKE ?',
                'effect LIKE ?', 'flavor LIKE ?', 'kanji LIKE ?',
                'jpname LIKE ?', 'card_number LIKE ?'
              ];
              sqlParams.push(tLike, tLike, tLike, tLike, tLike, tLike, tLike, tLike);
            }
            orClauses.push(`(${qParts.join(' OR ')})`);
          }
          conditions.push(`(${orClauses.join(' OR ')})`);
        }

        if (color && color.toLowerCase() !== 'all') {
          conditions.push('(color = ? OR colors_json LIKE ?)');
          sqlParams.push(color, `%"${color}"%`);
        }

        if (cardType && cardType.toLowerCase() !== 'all') {
          const ct = cardType.toLowerCase();
          if (ct === 'grandwalker') {
            conditions.push('(LOWER(type) LIKE ? OR family LIKE ? OR families_json LIKE ?)');
            sqlParams.push('%grandwalker%', '%Grandwalker%', '%"Grandwalker"%');
          } else {
            conditions.push('(LOWER(type) = ? OR LOWER(type) LIKE ?)');
            sqlParams.push(ct, `%${ct}%`);
          }
        }

        if (rarity && rarity.toLowerCase() !== 'all') {
          const ru = rarity.toLowerCase();
          if (ru === 'cxr' || ru.includes('contract x')) {
            conditions.push('(LOWER(rarity) LIKE ? OR LOWER(rarity) LIKE ?)');
            sqlParams.push('%contract x%', '%cx%');
          } else {
            conditions.push('LOWER(rarity) = LOWER(?)');
            sqlParams.push(rarity);
          }
        }

        if (family && family.toLowerCase() !== 'all') {
          conditions.push('(family = ? OR families_json LIKE ?)');
          sqlParams.push(family, `%"${family}"%`);
        }

        if (setName) {
          conditions.push('sets_json LIKE ?');
          sqlParams.push(`%"${setName}"%`);
        }

        if (generation && generation.toLowerCase() !== 'all') {
          const matchedSaga = getSagaById(generation);
          if (matchedSaga && matchedSaga.prefixes && matchedSaga.prefixes.length > 0) {
            const sagaClauses = [];
            for (const p of matchedSaga.prefixes) {
              sagaClauses.push('card_number LIKE ? OR sets_json LIKE ?');
              sqlParams.push(`${p}-%`, `%"${p}"%`);
            }
            conditions.push(`(${sagaClauses.join(' OR ')})`);
          }
        }

        if (cost && cost.toLowerCase() !== 'all') {
          if (cost === '8+') {
            conditions.push('cost >= 8');
          } else {
            conditions.push('cost = ?');
            sqlParams.push(parseInt(cost, 10));
          }
        }

        const isAltArtOnly = parsedUrl.searchParams.get('alt_art') === '1' || parsedUrl.searchParams.get('alt_art') === 'true';
        if (isAltArtOnly) {
          const cache = loadArtworksCache();
          const altKeys = Object.keys(cache || {});
          if (altKeys.length > 0) {
            const placeholders = altKeys.map(() => '?').join(',');
            conditions.push(`(LOWER(name) IN (${placeholders}) OR LOWER(card_number) IN (${placeholders}))`);
            sqlParams.push(...altKeys.map(k => k.toLowerCase()), ...altKeys.map(k => k.toLowerCase()));
          }
        }

        const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        let orderClause = 'ORDER BY cost ASC, card_number ASC';
        if (sortBy === 'cost_desc') orderClause = 'ORDER BY cost DESC, card_number ASC';
        else if (sortBy === 'number_asc') orderClause = 'ORDER BY card_number ASC';
        else if (sortBy === 'number_desc') orderClause = 'ORDER BY card_number DESC';
        else if (sortBy === 'name_asc') orderClause = 'ORDER BY name ASC';
        else if (sortBy === 'name_desc') orderClause = 'ORDER BY name DESC';

        const countSql = `SELECT COUNT(*) as total FROM cards ${whereClause}`;
        const total = serverDb.prepare(countSql).get(...sqlParams).total;

        const dataSql = `SELECT * FROM cards ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
        const rawCards = serverDb.prepare(dataSql).all(...sqlParams, limit, offset);

        const cards = rawCards.map(row => {
          const card = { ...row };
          if (card.colors_json) {
            try { card.colors = JSON.parse(card.colors_json); } catch(e) { card.colors = [card.color]; }
          }
          if (card.families_json) {
            try { card.families = JSON.parse(card.families_json); } catch(e) { card.families = card.family ? [card.family] : []; }
          }
          if (card.sets_json) {
            try { card.sets = JSON.parse(card.sets_json); } catch(e) { card.sets = []; }
          }
          if (card.levels && typeof card.levels === 'string' && (card.levels.startsWith('{') || card.levels.startsWith('['))) {
            try { card.levels = JSON.parse(card.levels); } catch(e) {}
          }
          const sagaInfo = resolveCardSaga(card);
          if (sagaInfo) {
            card.generation = sagaInfo.id;
            card.generation_name = sagaInfo.shortName;
          }
          return card;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ cards, total, page, pages: Math.ceil(total / limit) }));
        return;
      } catch (err) {
        console.error('[Server] /api/cards SQL error:', err);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ cards: [], total: 0, page: 1, pages: 1 }));
    return;
  }

  // /api/sagas (The 17 canonical Battle Spirits Sagas / Generations)
  if (pathname.toLowerCase() === '/api/sagas' || pathname.toLowerCase() === '/api/generations') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sagas: SAGA_DEFINITIONS }));
    return;
  }

  // /api/rebirth-catalog (Rebirth / Reborn mappings for all dual-faced cards)
  if (pathname.toLowerCase() === '/api/rebirth-catalog') {
    ensureRebirthCatalogLoaded();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cachedRebirthCatalog || {}));
    return;
  }

  // /api/card-artworks
  if (pathname.toLowerCase() === '/api/card-artworks') {
    ensureCardsIndexLoaded();
    const name = (parsedUrl.searchParams.get('name') || '').trim();
    const num = (parsedUrl.searchParams.get('card_number') || parsedUrl.searchParams.get('id') || '').trim();
    let found = null;
    if (name) found = cachedCardsByName[name.toLowerCase()];
    if (!found && num) found = cachedCardsByNumber[num.toLowerCase()] || cachedCardsIndex[num];

    const cardName = found ? found.name : name;
    const cardNum = found ? (found.card_number || num) : num;
    let defaultImg = found ? (found.image_url || '') : '';
    if (!defaultImg) {
      defaultImg = (parsedUrl.searchParams.get('image_url') || '').trim();
    }
    if (!defaultImg && serverDb) {
      try {
        const row = serverDb.prepare("SELECT image_url FROM cards WHERE LOWER(name) = LOWER(?) OR LOWER(card_number) = LOWER(?) LIMIT 1").get(name || cardName, num || cardNum);
        if (row && row.image_url) defaultImg = row.image_url;
      } catch (e) {}
    }

    resolveCardArtworks(cardName, cardNum, defaultImg).then(artworks => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: cardName,
        card_number: cardNum,
        artworks
      }));
    }).catch(err => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: cardName,
        card_number: cardNum,
        artworks: [{ name: 'Standard', image_url: defaultImg, is_alternate: false }]
      }));
    });
    return;
  }

  // /api/card
  if (pathname.toLowerCase() === '/api/card') {
    ensureCardsIndexLoaded();
    const name = (parsedUrl.searchParams.get('name') || '').toLowerCase().trim();
    const num = (parsedUrl.searchParams.get('card_number') || parsedUrl.searchParams.get('id') || '').trim();
    let found = null;
    if (name) found = cachedCardsByName[name] || cachedCardsByName[name.replace(/［/g, '[').replace(/］/g, ']')];
    if (!found && num) found = cachedCardsByNumber[num.toLowerCase()] || cachedCardsIndex[num];
    if (found) {
      const cachedArts = getCachedArtworks(found.name, found.card_number);
      const payload = cachedArts ? { ...found, artworks: cachedArts } : { ...found };
      if (!payload.rebirth) {
        ensureRebirthCatalogLoaded();
        if (cachedRebirthCatalog && cachedRebirthCatalog[found.name]) {
          payload.rebirth = cachedRebirthCatalog[found.name];
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Card not found' }));
    return;
  }

  // /api/cards-batch (handles GET and POST)
  if (pathname.toLowerCase() === '/api/cards-batch') {
    ensureCardsIndexLoaded();
    const handleBatch = (namesList) => {
      const result = { cards: [] };
      for (const name of namesList) {
        const match = cachedCardsByName[name.toLowerCase()] || cachedCardsByNumber[name.toLowerCase()] || cachedCardsIndex[name];
        if (match) {
          result[name] = match;
          result[match.name] = match;
          result.cards.push(match);
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    };

    if (req.method === 'POST') {
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(bodyData);
          const names = Array.isArray(parsed.names) ? parsed.names : [];
          handleBatch(names);
        } catch (e) {
          handleBatch([]);
        }
      });
      return;
    } else {
      const namesParam = parsedUrl.searchParams.get('names') || '';
      const names = namesParam.split('|').map(n => n.trim()).filter(Boolean);
      handleBatch(names);
      return;
    }
  }

  if (pathname.toLowerCase() === '/api/captcha') {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    const token = 'srv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#38bdf8'];
    let linesSvg = '';
    for (let i = 0; i < 5; i++) {
      const x1 = Math.floor(Math.random() * 180), y1 = Math.floor(Math.random() * 50);
      const x2 = Math.floor(Math.random() * 180), y2 = Math.floor(Math.random() * 50);
      linesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors[i % colors.length]}" stroke-width="1.5" stroke-opacity="0.35"/>`;
    }
    let textSvg = '';
    const xPos = [18, 44, 70, 96, 122, 148];
    for (let i = 0; i < 6; i++) {
      const rot = Math.floor(Math.random() * 26) - 13;
      const y = 35 + Math.floor(Math.random() * 6) - 3;
      textSvg += `<text x="${xPos[i]}" y="${y}" fill="${colors[i]}" font-family="JetBrains Mono, monospace" font-size="24" font-weight="bold" transform="rotate(${rot} ${xPos[i]} ${y})">${code[i]}</text>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50" viewBox="0 0 180 50"><rect width="180" height="50" fill="#0d1117" rx="6" stroke="#30363d" stroke-width="1"/>${linesSvg}${textSvg}</svg>`;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ svg, token, code }));
    return;
  }

  if (pathname.toLowerCase() === '/api/decks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Check dynamic battle routes
  const lowerPath = pathname.toLowerCase();

  // ── Phase G: Static File and Database Disclosure Security ──
  // 1. Directory traversal, encoded traversal, null bytes check
  if (
    req.url.includes('..') ||
    req.url.includes('%2e%2e') ||
    req.url.includes('%2E%2E') ||
    req.url.includes('%00') ||
    req.url.includes('\0') ||
    pathname.includes('\0') ||
    pathname.includes('..')
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // 2. Deny hidden files and directories (e.g. .git, .env)
  if (pathname.startsWith('/.') || pathname.includes('/.')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // 3. Block non-public directories
  const BLOCKED_DIR_PREFIXES = ['/engine/', '/compiler/', '/scripts/', '/tests/', '/reports/', '/data/', '/node_modules/', '/scratch/'];
  for (const prefix of BLOCKED_DIR_PREFIXES) {
    if (lowerPath.startsWith(prefix) || lowerPath === prefix.slice(0, -1)) {
      if (lowerPath === '/engine/cards/bundle.js' || lowerPath.startsWith('/engine/shims/')) {
        break;
      }
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }
  }

  // 4. Block sensitive file extensions (database, secrets, shell scripts, source repos)
  const BLOCKED_EXTENSIONS = ['.db', '.db-shm', '.db-wal', '.db-journal', '.sqlite', '.sqlite3', '.env', '.bat', '.sh', '.md', '.zip', '.pdf'];
  for (const blkExt of BLOCKED_EXTENSIONS) {
    if (lowerPath.endsWith(blkExt)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }
  }

  // 5. Block backend root files
  const BLOCKED_ROOT_FILES = ['/server.js', '/package.json', '/package-lock.json', '/battle_spirits.db', '/run.bat', '/readme.md', '/agents.md', '/unresolved_limitations.md'];
  if (BLOCKED_ROOT_FILES.includes(lowerPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  if (
    lowerPath.startsWith('/battle/') ||
    lowerPath.startsWith('/arena/') ||
    lowerPath.startsWith('/duel/')
  ) {
    pathname = '/arena.html';
  }

  // Check route map
  if (ROUTE_MAP[pathname.toLowerCase()]) {
    pathname = ROUTE_MAP[pathname.toLowerCase()];
  }

  // Normalize path safely within root
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  // Symlink escape check
  try {
    const realRootDir = fs.realpathSync(__dirname);
    if (fs.existsSync(filePath)) {
      const realFilePath = fs.realpathSync(filePath);
      if (!realFilePath.toLowerCase().startsWith(realRootDir.toLowerCase())) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
      }
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  // Check if target is directory
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      filePath = indexPath;
    }
  }

  // If file doesn't exist, check with .html extension
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Fallback to 404.html if still doesn't exist
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '404.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Set high-performance caching headers
    let cacheControl = 'no-cache, no-store, must-revalidate';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf'].includes(ext)) {
      cacheControl = 'public, max-age=86400, stale-while-revalidate=604800';
    }

    // Check gzip support for text-based and compressible binary resources
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const compressible = ['.html', '.css', '.js', '.mjs', '.json', '.svg', '.txt'].includes(ext);

    if (compressible && acceptEncoding.includes('gzip')) {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Encoding': 'gzip',
        'Cache-Control': cacheControl,
        'Vary': 'Accept-Encoding'
      });
      const stream = fs.createReadStream(filePath);
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': cacheControl
      });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  });
});

// Attach Phase M.1 Real-Time WebSocket Server
const defaultSessionMgr = getDefaultSessionManager();
attachWebSocketServer(server, defaultSessionMgr);

// Reconcile stale connections on startup
defaultSessionMgr.reconcileStaleConnections();

// Periodic Connection Lease Checker (every 5 seconds)
const leaseTimer = setInterval(() => {
  try {
    defaultSessionMgr.checkConnectionLeases();
  } catch (err) {
    console.error('[SessionLease] Background lease check error:', err.message);
  }
}, 5000);
leaseTimer.unref();

server.listen(PORT, HOST, () => {
  console.log(`\n⚔️ Battle Spirits Eternal Local Server running at:`);
  console.log(`   ➜ Local:   http://${HOST}:${PORT}/`);
  console.log(`   ➜ Arena:   http://${HOST}:${PORT}/arena`);
  console.log(`   ➜ Browse:  http://${HOST}:${PORT}/browse`);
  console.log(`   ➜ Decks:   http://${HOST}:${PORT}/deck\n`);
});
