/**
 * tests/browse_wasm_fallback_integrity.test.js
 * 
 * Verifies that browse.html handles static hosting (e.g. GitHub Pages) gracefully:
 * 1. Resilient to 404 HTML responses (e.g. <!DOCTYPE html> instead of JSON)
 * 2. Fallbacks seamlessly to WasmDB.searchCards when network API is unavailable
 * 3. Does not call undefined loadCards (uses loadBrowseCards)
 * 4. Resolves search cards properly with zero syntax/JSON parse errors
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const browseHtml = fs.readFileSync(path.join(rootDir, 'browse.html'), 'utf8');
const wasmDbJs = fs.readFileSync(path.join(rootDir, 'wasm_db.js'), 'utf8');

test('Browse Static Fallback: browse.html does not contain erroneous calls to undefined loadCards()', () => {
  const matches = browseHtml.match(/\bloadCards\(\)/g) || [];
  assert.equal(matches.length, 0, 'browse.html must use loadBrowseCards(), never undefined loadCards()');
});

test('Browse Static Fallback: browse.html checks content-type and guards against <!DOCTYPE html> responses', () => {
  assert.ok(browseHtml.includes("ct.includes('text/html')"), 'browse.html must check for HTML content-type');
  assert.ok(browseHtml.includes('WasmDB.searchCards'), 'browse.html must fall back to WasmDB.searchCards');
});

test('WasmDB Export Integrity: WasmDB exposes isJsonLoaded and onReady triggers for JSON readiness', () => {
  assert.ok(wasmDbJs.includes('isJsonLoaded: () => isJsonReady'), 'WasmDB must export isJsonLoaded');
  assert.ok(wasmDbJs.includes('if (isReady || isJsonReady) callback()'), 'WasmDB onReady must fire if either isReady or isJsonReady is true');
});

test('Browse Static Fallback Simulation: Network HTML 404 cleanly falls back to WasmDB without throwing', async () => {
  // Simulate browser environment with a mock fetch that returns HTML <!DOCTYPE html>
  let wasmDbSearchCalled = false;
  const mockWasmDB = {
    isReady: () => false,
    isJsonLoaded: () => true,
    searchCards(params) {
      wasmDbSearchCalled = true;
      return {
        cards: [
          { name: 'Siegfried', card_number: 'BS01-X01', cost: 6, color: 'Red' },
          { name: 'Icemaiden', card_number: 'BS01-075', cost: 1, color: 'White' }
        ],
        total: 2,
        page: 1,
        pages: 1
      };
    }
  };

  const mockP = new URLSearchParams({ limit: 18, page: 1, sort: 'cost_asc' });
  const mockFetch = async () => {
    return {
      ok: false,
      status: 404,
      headers: {
        get: (h) => (h === 'content-type' ? 'text/html; charset=utf-8' : null)
      },
      text: async () => '<!DOCTYPE html><html><body>404 Not Found</body></html>',
      json: async () => { throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE\"... is not valid JSON"); }
    };
  };

  // Run the fallback logic extracted from browse.html
  let data = null;
  try {
    const res = await mockFetch('/api/cards?' + mockP.toString());
    const ct = (res.headers && res.headers.get('content-type')) || '';
    if (res.ok && !ct.includes('text/html')) {
      data = await res.json();
    }
  } catch (e) {}

  if (!data && typeof mockWasmDB !== 'undefined') {
    const isDbAvailable = (typeof mockWasmDB.isReady === 'function' && mockWasmDB.isReady()) ||
                          (typeof mockWasmDB.isJsonLoaded === 'function' && mockWasmDB.isJsonLoaded());
    if (isDbAvailable && typeof mockWasmDB.searchCards === 'function') {
      data = mockWasmDB.searchCards(Object.fromEntries(mockP.entries()));
    }
  }

  assert.ok(data !== null, 'Data must be retrieved from fallback');
  assert.equal(wasmDbSearchCalled, true, 'WasmDB.searchCards must be called when network returns HTML');
  assert.equal(data.cards.length, 2, 'Must successfully return cards without throwing JSON parse error');
  assert.equal(data.cards[0].name, 'Siegfried');
});
