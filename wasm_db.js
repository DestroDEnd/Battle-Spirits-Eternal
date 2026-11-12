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
  let jsonFallbackPromise = null;
  let isJsonReady = false;
  let jsonCardsDetailed = null;
  let jsonCardsByName = null;
  let jsonCardsByNumber = null;
  let readyCallbacks = [];

  const DB_NAME = 'BSEternal_Wasm_Storage';
  const STORE_NAME = 'db_binary';
  const DB_KEY = 'battle_spirits.db_v3';

  const isServerBackend = typeof window !== 'undefined' && window.location && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000'
  );

  function getBaseDir() {
    if (typeof window === 'undefined' || !window.location) return './';
    const loc = window.location;
    if (loc.hostname && loc.hostname.includes('github.io')) {
      return loc.origin + '/Battle-Spirits-Eternal/';
    }
    const pathname = loc.pathname || '';
    const dir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return loc.origin + (dir || '/');
  }

  function getDbUrl() {
    return getBaseDir() + 'battle_spirits.db';
  }

  // ── 0. FAST JSON METADATA FALLBACK (INSTANT 100ms CACHE) ──
  async function loadJsonFallback() {
    if (isJsonReady) return true;
    try {
      const candidates = [
        getBaseDir() + 'data/cards_detailed.json',
        './data/cards_detailed.json',
        'data/cards_detailed.json',
        '/data/cards_detailed.json'
      ];
      let res = null;
      for (const u of candidates) {
        try {
          const testRes = await (window._originalFetch || window.fetch)(u);
          if (testRes.ok) {
            res = testRes;
            break;
          }
        } catch(e) {}
      }
      if (res) {
        const raw = await res.json();
        jsonCardsDetailed = raw;
        jsonCardsByName = {};
        jsonCardsByNumber = {};
        for (const [cNum, entry] of Object.entries(raw)) {
          if (!entry) continue;
          if (entry.name) {
            const low = entry.name.toLowerCase().trim();
            jsonCardsByName[low] = entry;
            const norm = low.replace(/［/g, '[').replace(/］/g, ']');
            if (norm !== low) jsonCardsByName[norm] = entry;
          }
          const num = entry.card_number || cNum;
          if (num) {
            jsonCardsByNumber[String(num).toLowerCase().trim()] = entry;
          }
        }
        isJsonReady = true;
        // Trigger callbacks to unblock UI immediately
        if (!isReady) {
          readyCallbacks.forEach(cb => { try { cb(); } catch(e) {} });
          readyCallbacks = [];
        }
        return true;
      }
    } catch(err) {
      console.warn('[WasmDB] Fast JSON fallback load failed:', err);
    }
    return false;
  }

  function searchCardsFromJson(params = {}) {
    if (!jsonCardsDetailed) return { cards: [], total: 0, page: 1, pages: 1 };
    const allCards = Object.values(jsonCardsDetailed);
    const q = (params.q || '').toLowerCase().trim();
    const color = (params.color || 'all').toLowerCase().trim();
    const cardType = (params.type || 'all').toLowerCase().trim();
    const rarity = (params.rarity || 'all').toLowerCase().trim();
    const family = (params.family || 'all').toLowerCase().trim();
    const setFilter = (params.set || '').toLowerCase().trim();
    const sort = params.sort || 'cost_asc';
    const page = parseInt(params.page || 1, 10);
    const limit = parseInt(params.limit || 18, 10);
    const offset = parseInt(params.offset || (page - 1) * limit, 10);

    let filtered = allCards.filter(c => {
      if (!c) return false;

      if (q) {
        const qNorm = q.replace(/［/g, '[').replace(/］/g, ']');
        const name = (c.name || '').toLowerCase();
        const nameNorm = name.replace(/［/g, '[').replace(/］/g, ']');
        const effect = (c.effect || '').toLowerCase();
        const num = (c.card_number || '').toLowerCase();
        const fam = (c.family || '').toLowerCase();
        const match = name.includes(q) || nameNorm.includes(qNorm) || effect.includes(q) || num.includes(q) || fam.includes(q);
        if (!match) return false;
      }

      if (color && color !== 'all') {
        const colors = (c.colors || [c.color || '']).map(x => (x || '').toLowerCase());
        if (!colors.some(col => col.includes(color))) return false;
      }

      if (cardType && cardType !== 'all') {
        const t = (c.type || '').toLowerCase();
        if (!t.includes(cardType)) return false;
      }

      if (rarity && rarity !== 'all') {
        const r = (c.rarity || '').toLowerCase();
        if (rarity === 'cxr' || rarity.includes('contract x')) {
          if (!r.includes('contract') && !r.includes('cx')) return false;
        } else if (!r.includes(rarity)) {
          return false;
        }
      }

      if (family && family !== 'all') {
        const fams = (c.families || [c.family || '']).map(f => (f || '').toLowerCase());
        if (!fams.some(f => f.includes(family))) return false;
      }

      if (setFilter) {
        const sets = (c.sets || []).map(s => (s || '').toLowerCase());
        if (!sets.some(s => s.includes(setFilter))) return false;
      }

      return true;
    });

    if (sort === 'cost_asc') {
      filtered.sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0));
    } else if (sort === 'cost_desc') {
      filtered.sort((a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0));
    } else if (sort === 'name_asc') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const total = filtered.length;
    const cards = filtered.slice(offset, offset + limit);
    const pages = Math.max(1, Math.ceil(total / limit));
    return { cards, total, page, pages };
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
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    try {
      if (typeof window.initSqlJs !== 'function') {
        console.warn('[WasmDB] sql.js not loaded. Falling back to server API.');
        return false;
      }

      SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
      });

      // Proactively purge old v1 and v2 cache if present
      try {
        const idb = await openIndexedDB();
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete('battle_spirits.db_v1');
        tx.objectStore(STORE_NAME).delete('battle_spirits.db_v2');
      } catch (e) {}

      let dbBuffer = await getCachedDbBuffer();
      let needsFreshFetch = !dbBuffer;

      if (dbBuffer) {
        try {
          dbInstance = new SQL.Database(new Uint8Array(dbBuffer));
          const testStmt = dbInstance.prepare("SELECT COUNT(*) as cnt FROM cards WHERE name = 'The PartnerDemonLord Javad'");
          if (testStmt.step()) {
            const count = testStmt.getAsObject().cnt;
            if (!count || count < 1) {
              console.warn('[WasmDB] Cached database is missing latest updates (e.g. Javad). Refreshing...');
              needsFreshFetch = true;
            }
          } else {
            needsFreshFetch = true;
          }
          testStmt.free();
        } catch (e) {
          console.warn('[WasmDB] Cache validation error, re-fetching:', e);
          needsFreshFetch = true;
        }
      }

      if (needsFreshFetch) {
        if (dbInstance) {
          try { dbInstance.close(); } catch (e) {}
          dbInstance = null;
        }
        showLoadingBanner("Updating Battle Spirits Card Database (23 MB)...");
        let res = null;
        const candidateUrls = [
          getDbUrl() + '?v=2.2',
          './battle_spirits.db?v=2.2',
          'battle_spirits.db?v=2.2',
          '/battle_spirits.db?v=2.2'
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
        dbInstance = new SQL.Database(new Uint8Array(dbBuffer));
      }

      isReady = true;

      const dur = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - startTime);
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
  function cleanFandomImageUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('static.wikia.nocookie.net') && url.includes('/revision/latest')) {
      return url.split('/revision/latest')[0];
    }
    return url;
  }

  function rowToObject(columns, values) {
    const obj = {};
    for (let i = 0; i < columns.length; i++) {
      let val = values[i];
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[columns[i]] = val;
    }
    if (obj.image_url) {
      obj.image_url = cleanFandomImageUrl(obj.image_url);
    }
    return obj;
  }

  // ── 4. CANONICAL SAGA CATALOG & CLIENT-SIDE QUERY METHODS ──
  const SAGA_DEFINITIONS = [
    {
      id: 'saga_01',
      name: '01 - Booster Set Saga',
      shortName: 'Booster Set Saga',
      era: '2008–2010',
      prefixes: ['BS01', 'BS02', 'BS03', 'BS04', 'BS05', 'BS06', 'BS07', 'BS08', 'BS09', 'SD01', 'SD02']
    },
    {
      id: 'saga_02',
      name: '02 - Constellation Saga',
      shortName: 'Constellation Saga',
      era: '2010–2011',
      prefixes: ['BS10', 'BS11', 'BS12', 'BS13', 'SD03', 'SD04', 'SD05', 'BSC05']
    },
    {
      id: 'saga_03',
      name: '03 - Heroes Saga',
      shortName: 'Heroes Saga',
      era: '2011–2012',
      prefixes: ['BS14', 'BS15', 'BS16', 'BS17', 'BS18', 'SD06', 'SD07', 'SD08', 'SD09', 'SD10', 'SD11', 'BSC06', 'BSC07', 'BSC08', 'BSC09', 'BSC10', 'BSC11', 'BSC12']
    },
    {
      id: 'saga_04',
      name: '04 - Sword Blade Saga',
      shortName: 'Sword Blade Saga',
      era: '2012–2013',
      prefixes: ['BS19', 'BS20', 'BS21', 'BS22', 'BS23', 'SD12', 'SD13', 'SD14', 'SD15', 'SD16', 'SD17', 'BSC13', 'BSC14', 'BSC15', 'BSC16']
    },
    {
      id: 'saga_05',
      name: '05 - Ultimate Saga',
      shortName: 'Ultimate Saga',
      era: '2013–2015',
      prefixes: ['BS24', 'BS25', 'BS26', 'BS27', 'BS28', 'BS29', 'SD18', 'SD19', 'SD20', 'SD21', 'SD22', 'SD23', 'SD24', 'SD25', 'SD26', 'SD27', 'BSC17', 'BSC18', 'BSC19']
    },
    {
      id: 'saga_06',
      name: '06 - Soul Saga (Burning Legend)',
      shortName: 'Soul Saga',
      era: '2015–2016',
      prefixes: ['BS30', 'BS31', 'BS32', 'BS33', 'BS34', 'SD28', 'SD29', 'SD30', 'SD31', 'SD32', 'BSC20', 'BSC21', 'BSC22']
    },
    {
      id: 'saga_07',
      name: '07 - God King Saga',
      shortName: 'God King Saga',
      era: '2016–2017',
      prefixes: ['BS35', 'BS36', 'BS37', 'BS38', 'BS39', 'SD33', 'SD34', 'SD35', 'SD36', 'BSC23', 'BSC24', 'BSC25', 'BSC26', 'BSC27']
    },
    {
      id: 'saga_08',
      name: '08 - Advent Saga',
      shortName: 'Advent Saga',
      era: '2017–2018',
      prefixes: ['BS40', 'BS41', 'BS42', 'BS43', 'SD37', 'SD38', 'SD39', 'SD40', 'BSC28', 'BSC29', 'BSC30']
    },
    {
      id: 'saga_09',
      name: '09 - God Advent / Dual Era',
      shortName: 'God Advent Saga',
      era: '2018–2019',
      prefixes: ['BS44', 'BS45', 'BS46', 'BS47', 'SD41', 'SD42', 'SD43', 'SD44', 'BSC31', 'BSC32', 'BSC33']
    },
    {
      id: 'saga_10',
      name: '10 - Ultra Advent Saga',
      shortName: 'Ultra Advent Saga',
      era: '2019–2020',
      prefixes: ['BS48', 'BS49', 'BS50', 'BS51', 'SD45', 'SD46', 'SD47', 'SD48', 'SD49', 'SD50', 'BSC34', 'BSC35']
    },
    {
      id: 'saga_11',
      name: '11 - Rebirth Saga',
      shortName: 'Rebirth Saga',
      era: '2020–2021',
      prefixes: ['BS52', 'BS53', 'BS54', 'BS55', 'SD51', 'SD52', 'SD53', 'SD54', 'SD55', 'SD56', 'SD57', 'BSC36', 'BSC37']
    },
    {
      id: 'saga_12',
      name: '12 - True Rebirth Saga',
      shortName: 'True Rebirth Saga',
      era: '2021–2022',
      prefixes: ['BS56', 'BS57', 'BS58', 'BS59', 'SD58', 'SD59', 'SD60', 'SD61', 'SD62', 'SD63', 'BSC38', 'BSC39']
    },
    {
      id: 'saga_13',
      name: '13 - Contract Saga',
      shortName: 'Contract Saga',
      era: '2022–2023',
      prefixes: ['BS60', 'BS61', 'BS62', 'BS63', 'SD64', 'SD65', 'BSC40', 'BSC41']
    },
    {
      id: 'saga_14',
      name: '14 - Contract Saga: Realm',
      shortName: 'Contract Realm',
      era: '2023–2024',
      prefixes: ['BS64', 'BS65', 'BS66', 'BS67', 'SD66', 'SD67', 'BSC42', 'BSC43']
    },
    {
      id: 'saga_15',
      name: '15 - Contract Saga: True',
      shortName: 'Contract True',
      era: '2024+',
      prefixes: ['BS68', 'BS69', 'BS70', 'BS71', 'SD68', 'SD69', 'SD70']
    },
    {
      id: 'saga_16',
      name: '16 - Collaboration Sets',
      shortName: 'Collaboration',
      era: 'All',
      prefixes: ['CB01', 'CB02', 'CB03', 'CB04', 'CB05', 'CB06', 'CB07', 'CB08', 'CB09', 'CB10', 'CB11', 'CB12', 'CB13', 'CB14', 'CB15', 'CB16', 'CB17', 'CB18', 'CB19', 'CB20', 'CB21', 'CB22', 'CB23', 'CB24', 'CB25', 'CB26', 'CB27', 'CB28', 'CB29', 'CB30', 'PB']
    },
    {
      id: 'saga_17',
      name: '17 - Special / Promotional',
      shortName: 'Promo & Extra',
      era: 'All',
      prefixes: ['CP', 'P', 'LM', 'EX', 'PX', 'SJ', 'PR']
    }
  ];

  function resolveSaga(idOrName) {
    if (!idOrName) return null;
    const raw = String(idOrName).trim();
    const target = raw.toLowerCase();
    if (target === 'all') return null;

    const norm = target.replace(/[·_]/g, '-').replace(/\s+/g, ' ');

    return SAGA_DEFINITIONS.find(s => {
      const sNameNorm = s.name.toLowerCase().replace(/[·_]/g, '-').replace(/\s+/g, ' ');
      const sShortNorm = s.shortName.toLowerCase().replace(/[·_]/g, '-').replace(/\s+/g, ' ');
      const num = s.id.replace('saga_', '');
      const numInt = parseInt(num, 10);
      return s.id === target ||
        num === target ||
        String(numInt) === target ||
        sShortNorm === norm ||
        sNameNorm === norm ||
        sNameNorm.includes(norm) ||
        norm.includes(sShortNorm) ||
        s.id === `saga_${target.padStart(2, '0')}`;
    }) || null;
  }

  function resolveCardSagaInfo(card) {
    if (!card) return null;
    const num = String(card.card_number || card.id || '').toUpperCase().trim();
    const setsJson = String(card.sets_json || card.set_name || '');
    const m = num.match(/^([A-Z0-9]+)[-_]/);
    const prefix = m ? m[1] : '';

    for (const saga of SAGA_DEFINITIONS) {
      if (prefix && saga.prefixes.some(p => p.toUpperCase() === prefix)) {
        return saga;
      }
      if (setsJson) {
        for (const p of saga.prefixes) {
          if (setsJson.includes(`"${p}"`) || setsJson.includes(`[${p}]`) || setsJson.includes(p)) {
            return saga;
          }
        }
      }
    }
    if (num.startsWith('P') || num.startsWith('CP') || num.startsWith('EX') || num.startsWith('PX') || num.startsWith('LM') || num.startsWith('BATTLE-SPIRITS')) {
      return SAGA_DEFINITIONS.find(s => s.id === 'saga_17') || null;
    }
    return null;
  }

  const WasmDB = {
    isReady: () => isReady,
    getSagas: () => SAGA_DEFINITIONS,
    getSagaById: (id) => resolveSaga(id),

    onReady(callback) {
      if (isReady) callback();
      else readyCallbacks.push(callback);
    },

    getCardByName(name) {
      if (!name) return null;
      const cleanName = String(name).trim();
      const lower = cleanName.toLowerCase();
      const norm = lower.replace(/［/g, '[').replace(/］/g, ']');

      if (dbInstance) {
        try {
          const stmt = dbInstance.prepare("SELECT * FROM cards WHERE LOWER(name) = LOWER(?) OR LOWER(REPLACE(REPLACE(name, '［', '['), '］', ']')) = LOWER(?) LIMIT 1");
          stmt.bind([cleanName, norm]);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            if (row.image_url) {
              row.image_url = cleanFandomImageUrl(row.image_url);
            }
            if (row.colors_json) {
              try { row.colors = JSON.parse(row.colors_json); } catch(e) {}
            }
            if (row.families_json) {
              try { row.families = JSON.parse(row.families_json); } catch(e) {}
            }
            if (row.sets_json) {
              try { row.sets = JSON.parse(row.sets_json); } catch(e) {}
            }
            if (row.levels && typeof row.levels === 'string') {
              try { row.levels = JSON.parse(row.levels); } catch(e) {}
            }
            return row;
          }
          stmt.free();
        } catch (e) {
          console.error('[WasmDB] getCardByName SQL error:', e);
        }
      }

      // Fast JSON fallback
      if (jsonCardsByName) {
        const found = jsonCardsByName[lower] || jsonCardsByName[norm] || (jsonCardsByNumber ? jsonCardsByNumber[lower] : null);
        if (found) return found;
      }

      return null;
    },

    getCardsBatch(names) {
      if (!names || !names.length) return [];
      const cleanNames = names.map(n => String(n).trim()).filter(Boolean);
      if (!cleanNames.length) return [];

      const results = [];
      const foundSet = new Set();

      if (dbInstance) {
        try {
          const placeholders = cleanNames.map(() => 'LOWER(?)').join(',');
          const stmt = dbInstance.prepare(`SELECT * FROM cards WHERE LOWER(name) IN (${placeholders})`);
          stmt.bind(cleanNames.map(n => n.toLowerCase()));
          while (stmt.step()) {
            const row = stmt.getAsObject();
            if (row.image_url) {
              row.image_url = cleanFandomImageUrl(row.image_url);
            }
            if (row.colors_json) {
              try { row.colors = JSON.parse(row.colors_json); } catch(e) {}
            }
            if (row.families_json) {
              try { row.families = JSON.parse(row.families_json); } catch(e) {}
            }
            if (row.sets_json) {
              try { row.sets = JSON.parse(row.sets_json); } catch(e) {}
            }
            if (row.levels && typeof row.levels === 'string') {
              try { row.levels = JSON.parse(row.levels); } catch(e) {}
            }
            results.push(row);
            if (row.name) foundSet.add(row.name.toLowerCase());
          }
          stmt.free();
        } catch (e) {
          console.error('[WasmDB] getCardsBatch SQL error:', e);
        }
      }

      // Fill missing from fast JSON fallback
      if (jsonCardsByName && results.length < cleanNames.length) {
        for (const n of cleanNames) {
          const low = n.toLowerCase();
          const norm = low.replace(/［/g, '[').replace(/］/g, ']');
          if (!foundSet.has(low) && !foundSet.has(norm)) {
            const c = jsonCardsByName[low] || jsonCardsByName[norm] || (jsonCardsByNumber ? jsonCardsByNumber[low] : null);
            if (c) {
              results.push(c);
              foundSet.add(low);
            }
          }
        }
      }

      return results;
    },

    getFeaturedXRares(color = '') {
      if (!dbInstance) return [];
      try {
        const colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
        let targetColors = colors;
        let perColor = 4;
        if (color && colors.map(c => c.toLowerCase()).includes(color.toLowerCase())) {
          targetColors = [color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()];
          perColor = 14;
        }
        const cards = [];
        for (const col of targetColors) {
          const stmt = dbInstance.prepare(`
            SELECT name, cost, color, type, family, rarity, image_url, card_number, effect, levels
            FROM cards
            WHERE color = ?
              AND LOWER(type) = 'spirit'
              AND cost >= 8
              AND image_url IS NOT NULL AND image_url != ''
            ORDER BY RANDOM() LIMIT ?
          `);
          stmt.bind([col, perColor]);
          while (stmt.step()) {
            const row = stmt.getAsObject();
            if (row.image_url) {
              row.image_url = cleanFandomImageUrl(row.image_url);
            }
            if (row.levels && typeof row.levels === 'string') {
              try { row.levels = JSON.parse(row.levels); } catch(e) {}
            }
            cards.push(row);
          }
          stmt.free();
        }
        return cards.sort(() => Math.random() - 0.5);
      } catch (e) {
        console.error('[WasmDB] getFeaturedXRares error:', e);
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
      if (!dbInstance) {
        if (jsonCardsDetailed) {
          return searchCardsFromJson(params);
        }
        return { cards: [], total: 0, page: 1, pages: 1 };
      }

      const conditions = [];
      const sqlParams = [];

      const query = params.q || params.query || '';
      const scope = params.scope || 'all';
      const generation = (params.generation || params.saga || '').trim();
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
        const ql = qRaw.toLowerCase();

        // Keyword query alias expansions
        let searchTerms = [qRaw];
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
        const rl = rarity.toLowerCase().trim();
        if (rl === 'contract x-rare' || rl === 'cxr' || rl === 'cx') {
          conditions.push("(LOWER(rarity) LIKE '%contract%x%' OR LOWER(rarity) IN ('contract x-rare', 'cxr', 'cx') OR card_number LIKE '%-CX%')");
        } else if (rl === 'nx-rare' || rl === 'nx') {
          conditions.push("(LOWER(rarity) LIKE '%nx%' OR card_number LIKE '%-NX%')");
        } else if (rl === 'xx-rare' || rl === 'xx' || rl === 'xx rare') {
          conditions.push("(LOWER(rarity) LIKE '%xx%' OR card_number LIKE '%-XX%')");
        } else if (rl === 'xv-rare' || rl === 'xv') {
          conditions.push("(LOWER(rarity) LIKE '%xv%' OR card_number LIKE '%-XV%')");
        } else if (rl === 'campaign promo' || rl === 'cp') {
          conditions.push("(LOWER(rarity) LIKE '%campaign%' OR LOWER(rarity) = 'cp' OR card_number LIKE '%-CP%')");
        } else if (rl === 'x-rare' || rl === 'x') {
          conditions.push("(LOWER(rarity) IN ('x-rare', 'x') OR (card_number LIKE '%-X%' AND card_number NOT LIKE '%-XX%' AND card_number NOT LIKE '%-CX%' AND card_number NOT LIKE '%-NX%' AND card_number NOT LIKE '%-XV%'))");
        } else {
          conditions.push("LOWER(rarity) = LOWER(?)");
          sqlParams.push(rarity.trim());
        }
      }

      if (family && family !== 'all') {
        const famRaw = family.trim();
        const famDash = famRaw.replace(/[–—]/g, '-');
        const famEn = famRaw.replace(/-/g, '–');
        conditions.push("(families_json LIKE ? OR family LIKE ? OR families_json LIKE ? OR family LIKE ? OR families_json LIKE ? OR family LIKE ?)");
        sqlParams.push(`%${famRaw}%`, `%${famRaw}%`, `%${famDash}%`, `%${famDash}%`, `%${famEn}%`, `%${famEn}%`);
      }

      if (setName && setName !== 'all') {
        const cleanSet = setName.trim().replace(/"/g, '');
        // Exact element match in JSON array or direct card_number prefix match
        // Prevents substring bleed (e.g. 26RSD01 cards leaking into SD01 filter)
        conditions.push("(sets_json LIKE ? OR card_number LIKE ?)");
        sqlParams.push(`%"${cleanSet}"%`, `${cleanSet}-%`);
      }

      if (generation && generation.toLowerCase() !== 'all') {
        const matchedSaga = resolveSaga(generation);
        if (matchedSaga && matchedSaga.prefixes && matchedSaga.prefixes.length > 0) {
          const sagaClauses = [];
          for (const p of matchedSaga.prefixes) {
            sagaClauses.push('(card_number LIKE ? OR sets_json LIKE ?)');
            sqlParams.push(`${p}-%`, `%"${p}"%`);
          }
          conditions.push(`(${sagaClauses.join(' OR ')})`);
        }
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
          const row = selectStmt.getAsObject();
          if (row.image_url) {
            row.image_url = cleanFandomImageUrl(row.image_url);
          }
          if (row.colors_json) {
            try { row.colors = JSON.parse(row.colors_json); } catch(e) { row.colors = [row.color]; }
          }
          if (row.families_json) {
            try { row.families = JSON.parse(row.families_json); } catch(e) { row.families = row.family ? [row.family] : []; }
          }
          const saga = resolveCardSagaInfo(row);
          if (saga) {
            row.generation = saga.id;
            row.generation_name = saga.shortName;
          }
          cards.push(row);
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
    
    // When running with live backend (e.g. Node server on localhost:3000), let the server handle all API routes natively!
    if (isServerBackend) {
      return window._originalFetch.apply(this, arguments);
    }

    // Only intercept /api/ requests if WasmDB is active on static hosting
    if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
      const url = new URL(urlStr, window.location.origin);
      const path = url.pathname;
      const params = Object.fromEntries(url.searchParams.entries());

      // Immediate static JSON route interception (does not need SQLite WASM engine)
      if (path.endsWith('/api/filters')) {
        try {
          const rawRes = await window._originalFetch(getBaseDir() + 'filters_data.json');
          if (rawRes.ok) return rawRes;
        } catch (e) {}
      }

      if (path.endsWith('/api/standard-decks')) {
        try {
          const rawRes = await window._originalFetch(getBaseDir() + 'standard_decks_data.json');
          if (rawRes.ok) return rawRes;
        } catch (e) {}
      }

      if (path.endsWith('/api/sagas') || path.endsWith('/api/generations')) {
        return new Response(JSON.stringify({ sagas: SAGA_DEFINITIONS }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path.endsWith('/api/keywords')) {
        try {
          const rawRes = await window._originalFetch(getBaseDir() + 'keywords_data.json');
          if (rawRes.ok) return rawRes;
        } catch (e) {}
      }

      // If database is currently initializing, wait for fast JSON fallback or WASM!
      if (!isReady && !isJsonReady) {
        if (jsonFallbackPromise) {
          try {
            await Promise.race([
              jsonFallbackPromise,
              new Promise(r => setTimeout(r, 2500))
            ]);
          } catch(e) {}
        }
        if (!isReady && !isJsonReady && initPromise) {
          try {
            await Promise.race([
              initPromise,
              new Promise(r => setTimeout(r, 2500))
            ]);
          } catch(e) {}
        }
      }

      if (isReady || isJsonReady) {
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

        if (path.endsWith('/api/featured-x-rares')) {
          const color = params.color || '';
          let cards = [];
          if (isReady && dbInstance) {
            cards = WasmDB.getFeaturedXRares(color);
          }
          if (!cards || !cards.length) {
            try {
              const rawRes = await window._originalFetch(getBaseDir() + 'featured_x_rares.json');
              if (rawRes.ok) {
                const staticData = await rawRes.json();
                if (color && staticData.by_color) {
                  const capColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
                  if (staticData.by_color[capColor]) {
                    cards = [...staticData.by_color[capColor]].sort(() => Math.random() - 0.5).slice(0, 20);
                  }
                } else if (staticData.by_color) {
                  const colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
                  colors.forEach(col => {
                    const pool = staticData.by_color[col] || [];
                    const sample = [...pool].sort(() => Math.random() - 0.5).slice(0, 4);
                    cards.push(...sample);
                  });
                  cards = cards.sort(() => Math.random() - 0.5);
                }
                if (!cards || !cards.length) {
                  cards = [...(staticData.cards || [])].sort(() => Math.random() - 0.5).slice(0, 24);
                }
              }
            } catch(e) {}
          }
          return new Response(JSON.stringify({ cards }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/api/cards-batch')) {
          let names = [];
          if (init && init.body) {
            try {
              const parsed = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
              if (Array.isArray(parsed.names)) names = parsed.names;
            } catch(e) {}
          }
          if (!names.length && params.names) {
            names = params.names.split('|').filter(Boolean);
          }
          const batchMap = { cards: [] };
          if (names.length) {
            const list = WasmDB.getCardsBatch(names);
            list.forEach(c => {
              if (c && c.name) {
                batchMap[c.name] = c;
                batchMap[c.name.toLowerCase()] = c;
                batchMap.cards.push(c);
              }
            });
          }
          return new Response(JSON.stringify(batchMap), {
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
        console.warn(`[WasmDB] Intercepted static API call to ${path} before DB ready.`);
        if (path.endsWith('/api/cards')) {
          return new Response(JSON.stringify({ total: 0, cards: [], page: 1, pages: 1 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (path.endsWith('/api/card')) {
          return new Response(JSON.stringify({ error: 'Card not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (path.endsWith('/api/cards-batch')) {
          return new Response(JSON.stringify({ cards: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ total: 0, cards: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Default fallback to native fetch
    return window._originalFetch.apply(this, arguments);
  };

  // Expose globally
  window.WasmDB = WasmDB;

  function startInit() {
    // If running on local Node dev server, the server is already active with native SQLite!
    if (isServerBackend) {
      isReady = true;
      readyCallbacks.forEach(cb => { try { cb(); } catch(e) {} });
      readyCallbacks = [];
      return Promise.resolve(true);
    }
    if (!jsonFallbackPromise) {
      jsonFallbackPromise = loadJsonFallback();
    }
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
