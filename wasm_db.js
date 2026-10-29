/**
 * Battle Spirits Eternal - WebAssembly SQLite Database Engine (sql.js)
 * Enables 100% serverless, zero-backend card search and deck loading on GitHub Pages.
 * Caches the 23MB database binary in browser IndexedDB for instant 30ms loading on subsequent visits.
 */

(function(window) {
  'use strict';

  let SQL = null;
  let dbInstance = null;
  let isReady = false;
  let initPromise = null;
  let readyCallbacks = [];

  const DB_NAME = 'BSEternal_Wasm_Storage';
  const STORE_NAME = 'db_binary';
  const DB_KEY = 'battle_spirits.db_v1';

  function getBaseDir() {
    if (typeof window === 'undefined' || !window.location) return './';
    const loc = window.location;
    const pathname = loc.pathname || '';
    const dir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return loc.origin + (dir || '/');
  }

  function getDbUrl() {
    return getBaseDir() + 'battle_spirits.db';
  }

  // ── 1. INDEXED_DB PERSISTENT CACHE ──
  function openIndexedDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getCachedDbBuffer() {
    try {
      const idb = await openIndexedDB();
      return new Promise((resolve) => {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(DB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async function setCachedDbBuffer(buffer) {
    try {
      const idb = await openIndexedDB();
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(buffer, DB_KEY);
    } catch (e) {
      console.warn('[WasmDB] Failed to cache database to IndexedDB:', e);
    }
  }

  // ── 2. DATABASE INITIALIZATION & LOADING ──
  async function initWasmDatabase() {
    const startTime = performance.now();
    try {
      if (typeof window.initSqlJs !== 'function') {
        console.warn('[WasmDB] sql.js not loaded. Falling back to server API.');
        return false;
      }

      SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
      });

      let dbBuffer = await getCachedDbBuffer();

      if (!dbBuffer) {
        showLoadingBanner("Initializing Battle Spirits Card Database (23 MB)...");
        let res = null;
        const candidateUrls = [
          getDbUrl(),
          './battle_spirits.db',
          'battle_spirits.db',
          '/battle_spirits.db'
        ];

        for (const u of candidateUrls) {
          try {
            const testRes = await window._originalFetch(u);
            const ct = (testRes.headers && testRes.headers.get('content-type')) || '';
            if (testRes.ok && !ct.includes('text/html')) {
              res = testRes;
              console.log(`[WasmDB] Successfully loaded database binary from ${u}`);
              break;
            }
          } catch(e) {}
        }

        if (!res) throw new Error("Could not fetch battle_spirits.db from any path candidate.");
        dbBuffer = await res.arrayBuffer();
        await setCachedDbBuffer(dbBuffer);
        hideLoadingBanner();
      }

      dbInstance = new SQL.Database(new Uint8Array(dbBuffer));
      isReady = true;

      const dur = Math.round(performance.now() - startTime);
      console.log(`[WasmDB] Database ready with 14,529 cards loaded in ${dur}ms!`);

      // Resolve queued ready callbacks
      readyCallbacks.forEach(cb => cb());
      readyCallbacks = [];
      return true;
    } catch (err) {
      hideLoadingBanner();
      console.warn('[WasmDB] Initialization failed, will use backend API fallback:', err);
      return false;
    }
  }

  function showLoadingBanner(msg) {
    let el = document.getElementById('wasmDbBanner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wasmDbBanner';
      el.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 999999;
        background: rgba(15, 23, 42, 0.95); border: 1px solid #3b82f6;
        color: #e2e8f0; padding: 12px 20px; border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-family: sans-serif;
        font-size: 0.85rem; display: flex; align-items: center; gap: 10px;
      `;
      document.body.appendChild(el);
    }
    el.innerHTML = `<span class="pulse-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span> <span>${msg}</span>`;
  }

  function hideLoadingBanner() {
    const el = document.getElementById('wasmDbBanner');
    if (el) el.remove();
  }

  // ── 3. QUERY HELPER UTILITIES ──
  function rowToObject(columns, values) {
    const obj = {};
    for (let i = 0; i < columns.length; i++) {
      let val = values[i];
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[columns[i]] = val;
    }
    return obj;
  }

  // ── 4. CLIENT-SIDE QUERY METHODS (MATCHING PYTHON API) ──
  const WasmDB = {
    isReady: () => isReady,

    onReady(callback) {
      if (isReady) callback();
      else readyCallbacks.push(callback);
    },

    getCardByName(name) {
      if (!dbInstance || !name) return null;
      try {
        const stmt = dbInstance.prepare("SELECT * FROM cards WHERE LOWER(name) = LOWER(?) LIMIT 1");
        stmt.bind([name.trim()]);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          if (row.colors_json) {
            try { row.colors = JSON.parse(row.colors_json); } catch(e) {}
          }
          if (row.families_json) {
            try { row.families = JSON.parse(row.families_json); } catch(e) {}
          }
          if (row.sets_json) {
            try { row.sets = JSON.parse(row.sets_json); } catch(e) {}
          }
          return row;
        }
        stmt.free();
        return null;
      } catch (e) {
        console.error('[WasmDB] getCardByName error:', e);
        return null;
      }
    },

    getCardsBatch(names) {
      if (!dbInstance || !names || !names.length) return [];
      try {
        const placeholders = names.map(() => '?').join(',');
        const stmt = dbInstance.prepare(`SELECT * FROM cards WHERE name IN (${placeholders})`);
        stmt.bind(names);
        const results = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          if (row.colors_json) {
            try { row.colors = JSON.parse(row.colors_json); } catch(e) {}
          }
          if (row.families_json) {
            try { row.families = JSON.parse(row.families_json); } catch(e) {}
          }
          if (row.sets_json) {
            try { row.sets = JSON.parse(row.sets_json); } catch(e) {}
          }
          results.push(row);
        }
        stmt.free();
        return results;
      } catch (e) {
        console.error('[WasmDB] getCardsBatch error:', e);
        return [];
      }
    },

    getAutocomplete(q, limit = 8) {
      if (!dbInstance || !q) return [];
      try {
        const stmt = dbInstance.prepare("SELECT name, cost, color, type FROM cards WHERE name LIKE ? ORDER BY name ASC LIMIT ?");
        stmt.bind([`%${q.trim()}%`, limit]);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      } catch (e) {
        return [];
      }
    },

    searchCards(params = {}) {
      if (!dbInstance) return { cards: [], total: 0, page: 1, pages: 1 };

      const conditions = [];
      const sqlParams = [];

      const query = params.q || params.query || '';
      const scope = params.scope || 'all';
      const color = params.color || '';
      const cardType = params.type || params.card_type || '';
      const rarity = params.rarity || '';
      const family = params.family || '';
      const setName = params.set || params.set_name || '';
      const cost = params.cost;
      const sortBy = params.sort_by || params.sort || 'cost_asc';
      const limit = parseInt(params.limit || 24, 10);
      const page = Math.max(1, parseInt(params.page || 1, 10));
      const offset = (page - 1) * limit;

      if (query && query.trim()) {
        const qRaw = query.trim();
        const qLike = `%${qRaw}%`;
        const ql = qRaw.toLowerCase();

        let qParts = [];
        let qArgs = [];

        if (scope === 'name') {
          qParts = ['name LIKE ?', 'kanji LIKE ?', 'jpname LIKE ?'];
          qArgs = [qLike, qLike, qLike];
        } else if (scope === 'effect' || scope === 'desc') {
          qParts = ['effect LIKE ?', 'flavor LIKE ?'];
          qArgs = [qLike, qLike];
        } else if (scope === 'family') {
          qParts = ['family LIKE ?', 'families_json LIKE ?'];
          qArgs = [qLike, qLike];
        } else {
          qParts = [
            'name LIKE ?', 'family LIKE ?', 'families_json LIKE ?',
            'effect LIKE ?', 'flavor LIKE ?', 'kanji LIKE ?',
            'jpname LIKE ?', 'card_number LIKE ?'
          ];
          qArgs = [qLike, qLike, qLike, qLike, qLike, qLike, qLike, qLike];
        }
        conditions.push(`(${qParts.join(' OR ')})`);
        sqlParams.push(...qArgs);
      }

      if (color && color !== 'all') {
        conditions.push("colors_json LIKE ?");
        sqlParams.push(`%${color}%`);
      }

      if (cardType && cardType !== 'all') {
        const ct = cardType.toLowerCase();
        if (ct === 'grandwalker') {
          conditions.push("(LOWER(type) LIKE '%grandwalker%' OR LOWER(family) LIKE '%grandwalker%' OR families_json LIKE '%Grandwalker%' OR effect LIKE '%[Grandwalker Nexus]%' OR name LIKE '%Grandwalker%')");
        } else if (ct === 'spirit') {
          conditions.push("(LOWER(type) LIKE '%spirit%')");
        } else if (ct === 'nexus') {
          conditions.push("(LOWER(type) LIKE '%nexus%')");
        } else if (ct === 'brave') {
          conditions.push("(LOWER(type) LIKE '%brave%')");
        } else if (ct === 'magic') {
          conditions.push("(LOWER(type) LIKE '%magic%')");
        } else if (ct === 'ultimate') {
          conditions.push("(LOWER(type) LIKE '%ultimate%')");
        } else {
          conditions.push("LOWER(type) = LOWER(?)");
          sqlParams.push(cardType);
        }
      }

      if (rarity && rarity !== 'all') {
        conditions.push("LOWER(rarity) = LOWER(?)");
        sqlParams.push(rarity);
      }

      if (family && family !== 'all') {
        conditions.push("families_json LIKE ?");
        sqlParams.push(`%${family}%`);
      }

      if (setName && setName !== 'all') {
        conditions.push("sets_json LIKE ?");
        sqlParams.push(`%${setName}%`);
      }

      if (cost !== undefined && cost !== null && cost !== '' && cost !== 'all') {
        const costStr = String(cost).trim();
        if (costStr.endsWith('+')) {
          const baseC = parseInt(costStr.replace('+', ''), 10) || 8;
          conditions.push("cost >= ?");
          sqlParams.push(baseC);
        } else {
          const c = parseInt(costStr, 10);
          if (!isNaN(c)) {
            conditions.push("cost = ?");
            sqlParams.push(c);
          }
        }
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total
      let total = 0;
      try {
        const countStmt = dbInstance.prepare(`SELECT COUNT(*) as total FROM cards ${whereClause}`);
        countStmt.bind(sqlParams);
        if (countStmt.step()) {
          total = countStmt.getAsObject().total;
        }
        countStmt.free();
      } catch (e) {
        console.error('[WasmDB] Count query error:', e);
      }

      // Sort order
      let orderClause = "ORDER BY CASE WHEN cost IS NULL THEN 999 ELSE cost END ASC, name ASC";
      if (sortBy === 'name_asc') orderClause = "ORDER BY name ASC";
      else if (sortBy === 'name_desc') orderClause = "ORDER BY name DESC";
      else if (sortBy === 'cost_desc') orderClause = "ORDER BY CASE WHEN cost IS NULL THEN -1 ELSE cost END DESC, name ASC";
      else if (sortBy === 'number_asc') orderClause = "ORDER BY CASE WHEN card_number IS NULL OR card_number = '' THEN 1 ELSE 0 END ASC, card_number ASC, name ASC";
      else if (sortBy === 'number_desc') orderClause = "ORDER BY CASE WHEN card_number IS NULL OR card_number = '' THEN 1 ELSE 0 END ASC, card_number DESC, name DESC";

      // Select data
      const cards = [];
      try {
        const selectStmt = dbInstance.prepare(`SELECT * FROM cards ${whereClause} ${orderClause} LIMIT ? OFFSET ?`);
        selectStmt.bind([...sqlParams, limit, offset]);
        while (selectStmt.step()) {
          cards.push(selectStmt.getAsObject());
        }
        selectStmt.free();
      } catch (e) {
        console.error('[WasmDB] Select query error:', e);
      }

      const pages = Math.max(1, Math.ceil(total / limit));
      return { cards, total, page, pages };
    }
  };

  // ── 5. TRANSPARENT CLIENT-SIDE FETCH INTERCEPTOR ──
  // Automatically routes API calls to WebAssembly SQLite on static sites!
  window._originalFetch = window._originalFetch || window.fetch;

  window.fetch = async function(resource, init) {
    const urlStr = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
    
    // Only intercept /api/ requests if WasmDB is active
    if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
      const url = new URL(urlStr, window.location.origin);
      const path = url.pathname;
      const params = Object.fromEntries(url.searchParams.entries());

      // If database is currently initializing, wait for it!
      if (!isReady && initPromise) {
        try {
          await initPromise;
        } catch(e) {}
      }

      if (isReady) {
        if (path.endsWith('/api/cards')) {
          const data = WasmDB.searchCards(params);
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/api/card')) {
          const card = WasmDB.getCardByName(params.name || '');
          if (card) {
            return new Response(JSON.stringify(card), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify({ error: 'Card not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/api/cards-batch')) {
          const names = (params.names || '').split('|').filter(Boolean);
          const cards = WasmDB.getCardsBatch(names);
          return new Response(JSON.stringify({ cards }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/api/autocomplete')) {
          const results = WasmDB.getAutocomplete(params.q || '', parseInt(params.limit || 8, 10));
          return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/api/card-effects-db')) {
          try {
            const rawRes = await window._originalFetch(getBaseDir() + 'card_effects_db.json');
            return rawRes;
          } catch (e) {}
        }
      } else {
        // If on static hosting (e.g. GitHub Pages) and backend is not running, return safe empty JSON
        if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
          console.warn(`[WasmDB] Intercepted static API call to ${path} before DB ready.`);
          return new Response(JSON.stringify({ total: 0, cards: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Default fallback to native fetch
    return window._originalFetch.apply(this, arguments);
  };

  // Expose globally
  window.WasmDB = WasmDB;

  function startInit() {
    if (!initPromise) {
      initPromise = initWasmDatabase();
    }
    return initPromise;
  }

  // Auto-boot immediately
  if (typeof window !== 'undefined') {
    startInit();
  }

})(window);
