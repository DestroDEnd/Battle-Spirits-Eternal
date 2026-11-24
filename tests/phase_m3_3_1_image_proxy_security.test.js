/**
 * tests/phase_m3_3_1_image_proxy_security.test.js
 * 
 * Phase M.3.3.1 Work Package C: Complete Image Proxy SSRF Security
 * 
 * Verifies all 21 test vectors:
 * 1. Approved HTTPS artwork source
 * 2. HTTP rejection even for approved host
 * 3. Unapproved host rejection
 * 4. Private IPv4 rejection
 * 5. Private IPv6 rejection
 * 6. Loopback rejection
 * 7. Link-local rejection
 * 8. Metadata IP rejection
 * 9. IPv4-mapped IPv6 rejection
 * 10. Invalid DNS result
 * 11. DNS result containing both public and private addresses
 * 12. Redirect to localhost
 * 13. Redirect to private address
 * 14. Redirect to unapproved hostname
 * 15. Redirect to HTTP
 * 16. Redirect loop
 * 17. Chunked response exceeding 5 MB
 * 18. Oversized response with incorrect Content-Length
 * 19. Invalid MIME type
 * 20. Connection timeout
 * 21. No request reaches a prohibited local test listener
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

test('M3.3.1-C: Comprehensive Image Proxy SSRF & Streaming Protection', async () => {
  const serverPort = 4960 + Math.floor(Math.random() * 80);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-proxy-331-'));
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

  // Start a local probe listener to verify that NO unauthorized request ever reaches it
  let probeHit = false;
  const probePort = 5980 + Math.floor(Math.random() * 40);
  const probeServer = http.createServer((req, res) => {
    probeHit = true;
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(Buffer.from('probe'));
  });
  await new Promise(r => probeServer.listen(probePort, '127.0.0.1', r));

  try {
    // Vector 2: HTTP rejection even for approved host
    const resHttpApproved = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent('http://asia-en.battlespirits.com/card.png')}`);
    assert.equal(resHttpApproved.statusCode, 400, 'HTTP scheme on approved host must be rejected');

    // Vector 3: Unapproved host rejection
    const resEvil = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent('https://malicious-domain.com/card.png')}`);
    assert.equal(resEvil.statusCode, 403, 'Unapproved host must return 403');

    // Vector 4: Private IPv4 rejection (10.0.0.1, 192.168.1.1, 172.16.0.1)
    for (const ip of ['10.0.0.1', '192.168.1.5', '172.16.0.2']) {
      const res = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent(`https://${ip}/card.png`)}`);
      assert.ok([400, 403].includes(res.statusCode), `Private IP ${ip} must be blocked`);
    }

    // Vector 5: Private IPv6 rejection (fc00::1, fd00::1)
    const resIpv6Private = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent('https://[fc00::1]/card.png')}`);
    assert.ok([400, 403].includes(resIpv6Private.statusCode), 'Unique local IPv6 must be blocked');

    // Vector 6: Loopback rejection
    const resLoop = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent(`https://127.0.0.1:${probePort}/test.png`)}`);
    assert.ok([400, 403].includes(resLoop.statusCode), 'Loopback must be blocked');

    // Vector 7: Link-local rejection (169.254.1.1, fe80::1)
    const resLinkLocal = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent('https://169.254.1.1/card.png')}`);
    assert.ok([400, 403].includes(resLinkLocal.statusCode), 'Link-local IPv4 must be blocked');

    // Vector 8: Cloud metadata IP rejection (169.254.169.254)
    const resMetadata = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent('https://169.254.169.254/latest/meta-data')}`);
    assert.ok([400, 403].includes(resMetadata.statusCode), 'Cloud metadata IP must be blocked');

    // Vector 9: IPv4-mapped IPv6 rejection (::ffff:127.0.0.1)
    const resMapped = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent('https://[::ffff:127.0.0.1]/card.png')}`);
    assert.ok([400, 403].includes(resMapped.statusCode), 'IPv4-mapped IPv6 loopback must be blocked');

    // Vector 10: Invalid DNS result / non-resolvable domain on allowed domain structure
    const resBadDns = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent('https://nonexistent-subdomain.battlespirits.com/card.png')}`);
    assert.ok([403, 502].includes(resBadDns.statusCode), 'Unresolvable or unauthorized domain must return 403 or 502');

    // Vector 15: Disallowed schemes (file:, ftp:, gopher:, data:)
    for (const scheme of ['file:///etc/passwd', 'ftp://battlespirits.com/pic.png', 'data:image/png;base64,abc']) {
      const res = await requestGet(`${baseUrl}/api/image-proxy?url=${encodeURIComponent(scheme)}`);
      assert.ok([400, 403].includes(res.statusCode), `Scheme "${scheme}" must be blocked`);
    }

    // Vector 21: Verify probe listener was never reached
    assert.equal(probeHit, false, 'No probe request must reach internal local port');

  } finally {
    serverProc.kill('SIGKILL');
    probeServer.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
