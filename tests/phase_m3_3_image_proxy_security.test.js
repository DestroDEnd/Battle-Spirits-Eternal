/**
 * tests/phase_m3_3_image_proxy_security.test.js
 * 
 * Phase M.3.3 Work Package H: Image Proxy Security & SSRF Protection
 * 
 * Asserts that:
 * 1. Missing or empty url parameter is rejected with 400 Bad Request.
 * 2. Unapproved domains outside ALLOWED_IMAGE_DOMAINS are rejected with 403 Forbidden.
 * 3. Localhost, loopback, and private IPv4/IPv6 addresses are rejected.
 * 4. Cloud metadata addresses (169.254.169.254) are rejected.
 * 5. Non-standard ports (ports other than 80, 443) are rejected.
 * 6. Non-HTTP protocols (file:, ftp:) are rejected.
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

test('M3.3-H: Image Proxy Security and SSRF Prevention', async () => {
  const serverPort = 4950 + Math.floor(Math.random() * 80);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-sec-proxy-'));
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
    // 1. Missing target URL
    const resNoUrl = await requestGet(`${baseUrl}/api/image-proxy`);
    assert.equal(resNoUrl.statusCode, 400, 'Missing URL must return 400');

    // 2. Disallowed external domain
    const resDisallowed = await requestGet(`${baseUrl}/api/image-proxy?url=http://example.com/evil.png`);
    assert.equal(resDisallowed.statusCode, 403, 'Disallowed domain must return 403');

    // 3. Localhost and loopback
    const localTargets = [
      'http://127.0.0.1/admin',
      'http://localhost/secret',
      'http://[::1]/internal'
    ];
    for (const t of localTargets) {
      const res = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent(t)}`);
      assert.ok([400, 403].includes(res.statusCode), `Localhost target "${t}" must return 400 or 403, got ${res.statusCode}`);
    }

    // 4. Cloud metadata endpoint
    const resCloud = await requestGet(`${baseUrl}/api/image-proxy?url=http://169.254.169.254/latest/meta-data`);
    assert.ok([400, 403].includes(resCloud.statusCode), 'Cloud metadata target must be blocked');

    // 5. Non-standard ports
    const resBadPort = await requestGet(`${baseUrl}/api/image-proxy?url=http://asia-en.battlespirits.com:22/card.png`);
    assert.equal(resBadPort.statusCode, 400, 'Non-standard port must return 400');

    // 6. Non-HTTP protocols
    const badProtocols = [
      'file:///etc/passwd',
      'ftp://ftp.example.com/image.png',
      'javascript:alert(1)'
    ];
    for (const p of badProtocols) {
      const res = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent(p)}`);
      assert.ok([400, 403].includes(res.statusCode), `Protocol "${p}" must be blocked, got ${res.statusCode}`);
    }
  } finally {
    serverProc.kill('SIGKILL');
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
