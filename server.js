import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
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
  '/login': '/login.html',
  '/register': '/register.html'
};

let cachedStandardDecks = null;
let cachedCardsIndex = null;
let cachedCardsByName = null;
let cachedCardsByNumber = null;
let cachedFilters = null;
let cachedFeaturedXRares = null;
let cachedAiWeights = null;
let serverDb = null;
try {
  const dbPath = path.join(__dirname, 'battle_spirits.db');
  if (fs.existsSync(dbPath)) {
    serverDb = new DatabaseSync(dbPath);
  }
} catch (e) {
  console.warn('[Server] Could not initialize SQLite DatabaseSync:', e.message);
}

function ensureCardsIndexLoaded() {
  if (!cachedCardsIndex) {
    try {
      const idxRaw = fs.readFileSync(path.join(__dirname, 'data', 'cards_index.json'), 'utf8');
      cachedCardsIndex = JSON.parse(idxRaw);
      cachedCardsByName = {};
      cachedCardsByNumber = {};
      for (const [cNum, entry] of Object.entries(cachedCardsIndex)) {
        if (entry && entry.name) {
          cachedCardsByName[entry.name.toLowerCase()] = entry;
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

const server = http.createServer((req, res) => {
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

  // Image proxy endpoint to bypass CORS and referer hotlinking blocks
  if (pathname.toLowerCase() === '/api/proxy-image') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing or invalid url param' }));
      return;
    }

    try {
      const parsedTarget = new URL(targetUrl);
      const client = parsedTarget.protocol === 'https:' ? https : http;
      const proxyReq = client.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': parsedTarget.origin,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        timeout: 8000
      }, (proxyRes) => {
        if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
          res.writeHead(302, { 'Location': `/api/proxy-image?url=${encodeURIComponent(proxyRes.headers.location)}` });
          res.end();
          return;
        }
        if (proxyRes.statusCode !== 200) {
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Upstream returned status ${proxyRes.statusCode}` }));
          return;
        }
        const contentType = proxyRes.headers['content-type'] || 'image/jpeg';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        if (!res.headersSent) {
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy request timed out' }));
        }
      });

      proxyReq.on('error', (err) => {
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    }
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
    try {
      const raw = fs.readFileSync(path.join(__dirname, 'featured_x_rares.json'), 'utf8');
      cachedFeaturedXRares = JSON.parse(raw);
    } catch (e) {
      if (!cachedFeaturedXRares) cachedFeaturedXRares = { cards: [], by_color: {} };
    }
    const color = parsedUrl.searchParams.get('color');
    let cards = [];
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
        const conditions = [];
        const sqlParams = [];

        const query = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '').trim();
        const scope = parsedUrl.searchParams.get('scope') || 'all';
        const color = (parsedUrl.searchParams.get('color') || '').trim();
        const cardType = (parsedUrl.searchParams.get('type') || parsedUrl.searchParams.get('card_type') || '').trim();
        const rarity = (parsedUrl.searchParams.get('rarity') || '').trim();
        const family = (parsedUrl.searchParams.get('family') || '').trim();
        const setName = (parsedUrl.searchParams.get('set') || parsedUrl.searchParams.get('set_name') || '').trim();
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
          conditions.push('LOWER(type) = LOWER(?)');
          sqlParams.push(cardType);
        }

        if (rarity && rarity.toLowerCase() !== 'all') {
          conditions.push('LOWER(rarity) = LOWER(?)');
          sqlParams.push(rarity);
        }

        if (family && family.toLowerCase() !== 'all') {
          conditions.push('(family LIKE ? OR families_json LIKE ?)');
          sqlParams.push(`%${family}%`, `%"${family}"%`);
        }

        if (setName) {
          conditions.push('sets_json LIKE ?');
          sqlParams.push(`%"${setName}"%`);
        }

        if (cost && cost.toLowerCase() !== 'all') {
          if (cost === '8+') {
            conditions.push('cost >= 8');
          } else {
            conditions.push('cost = ?');
            sqlParams.push(parseInt(cost, 10));
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

  // /api/card
  if (pathname.toLowerCase() === '/api/card') {
    ensureCardsIndexLoaded();
    const name = (parsedUrl.searchParams.get('name') || '').toLowerCase().trim();
    const num = (parsedUrl.searchParams.get('card_number') || parsedUrl.searchParams.get('id') || '').trim();
    let found = null;
    if (name) found = cachedCardsByName[name];
    if (!found && num) found = cachedCardsByNumber[num.toLowerCase()] || cachedCardsIndex[num];
    if (found) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(found));
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

  if (pathname.toLowerCase() === '/api/decks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Check route map
  if (ROUTE_MAP[pathname.toLowerCase()]) {
    pathname = ROUTE_MAP[pathname.toLowerCase()];
  }

  // Normalize path safely within root
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

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

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n⚔️ Battle Spirits Eternal Local Server running at:`);
  console.log(`   ➜ Local:   http://${HOST}:${PORT}/`);
  console.log(`   ➜ Arena:   http://${HOST}:${PORT}/arena`);
  console.log(`   ➜ Browse:  http://${HOST}:${PORT}/browse`);
  console.log(`   ➜ Decks:   http://${HOST}:${PORT}/deck\n`);
});
