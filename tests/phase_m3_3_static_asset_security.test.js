/**
 * tests/phase_m3_3_static_asset_security.test.js
 * 
 * Phase M.3.3 Work Package G: Static File & Database Security Lockdown
 * 
 * Asserts that:
 * 1. Path traversal attacks (.., %2e%2e, null bytes) are rejected with 403 Forbidden.
 * 2. SQLite databases (.db, .sqlite, etc.) are protected with 403 Forbidden.
 * 3. Git configuration and dotfiles (.git, .env, .gitignore) are blocked with 403 Forbidden.
 * 4. Internal engine, compiler, scripts, and reports directories are blocked with 403 Forbidden.
 * 5. Legitimate public assets (CSS, JS, HTML) are served with 200 OK.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function requestGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('M3.3-G: Static Asset Security & Database Lockdown', async () => {
  const serverPort = 4850 + Math.floor(Math.random() * 80);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-sec-static-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(serverPort), DB_PATH: dbPath },
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
    serverProc.error = reject;
  });

  const baseUrl = `http://127.0.0.1:${serverPort}`;

  try {
    // 1. Path traversal attacks
    const traversalPaths = [
      '/..%2fpackage.json',
      '/%2e%2e/server.js',
      '/scripts/../engine/index.js',
      '/style.css%00.html'
    ];
    for (const p of traversalPaths) {
      const res = await requestGet(`${baseUrl}${p}`);
      assert.ok([400, 403, 404].includes(res.statusCode), `Traversal "${p}" must be blocked, got ${res.statusCode}`);
    }

    // 2. Database files
    const dbPaths = [
      '/battle_spirits.db',
      '/data/battle_spirits.db',
      '/test.db',
      '/custom.sqlite',
      '/database.db-wal'
    ];
    for (const p of dbPaths) {
      const res = await requestGet(`${baseUrl}${p}`);
      assert.equal(res.statusCode, 403, `DB path "${p}" must return 403 Forbidden`);
    }

    // 3. Dotfiles and secret files
    const secretPaths = [
      '/.git/config',
      '/.env',
      '/.gitignore',
      '/.git/HEAD'
    ];
    for (const p of secretPaths) {
      const res = await requestGet(`${baseUrl}${p}`);
      assert.equal(res.statusCode, 403, `Secret path "${p}" must return 403 Forbidden`);
    }

    // 4. Internal non-public code directories
    const internalPaths = [
      '/engine/index.js',
      '/compiler/ir.js',
      '/scripts/m3_3/test_ws_ticket.mjs',
      '/package.json',
      '/server.js'
    ];
    for (const p of internalPaths) {
      const res = await requestGet(`${baseUrl}${p}`);
      assert.equal(res.statusCode, 403, `Internal code path "${p}" must return 403 Forbidden`);
    }

    // 5. Legitimate public static assets
    const legitAssets = [
      '/style.css',
      '/battle_arena.js',
      '/arena.html'
    ];
    for (const p of legitAssets) {
      const res = await requestGet(`${baseUrl}${p}`);
      assert.equal(res.statusCode, 200, `Public asset "${p}" must return 200 OK`);
    }
  } finally {
    serverProc.kill('SIGKILL');
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
