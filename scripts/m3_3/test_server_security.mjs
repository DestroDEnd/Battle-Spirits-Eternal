import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

async function testServerSecurity() {
  const port = 4920 + Math.floor(Math.random() * 50);
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

  function get(path) {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${path}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
      }).on('error', reject);
    });
  }

  try {
    console.log('--- Testing Defect A5: Static File Disclosure ---');
    // 1. Database file access
    const dbRes = await get('/battle_spirits.db');
    console.log('  GET /battle_spirits.db -> status:', dbRes.status);
    assert.equal(dbRes.status, 403, 'Direct .db access must return 403');

    // 2. Git metadata
    const gitRes = await get('/.git/config');
    console.log('  GET /.git/config -> status:', gitRes.status);
    assert.equal(gitRes.status, 403, 'Git config access must return 403');

    // 3. Engine source code
    const engineRes = await get('/engine/index.js');
    console.log('  GET /engine/index.js -> status:', engineRes.status);
    assert.equal(engineRes.status, 403, 'Engine source access must return 403');

    // 4. Directory traversal
    const travRes = await get('/%2e%2e/battle_spirits.db');
    console.log('  GET /%2e%2e/battle_spirits.db -> status:', travRes.status);
    assert.equal(travRes.status, 403, 'Traversal must return 403');

    // 5. Legitimate public files must still work
    const indexRes = await get('/index.html');
    console.log('  GET /index.html -> status:', indexRes.status);
    assert.equal(indexRes.status, 200, 'Legitimate public page must return 200');

    console.log('Defect A5 (Static File Disclosure): FIXED');

    console.log('\n--- Testing Defect A6: Image Proxy SSRF ---');
    // 1. Localhost via proxy (non-standard port: rejected with 400 or 403)
    const localProxy = await get(`/api/proxy-image?url=${encodeURIComponent(`http://127.0.0.1:${port}/`)}`);
    console.log('  Proxy to localhost (127.0.0.1:port) -> status:', localProxy.status);
    assert.ok(localProxy.status === 400 || localProxy.status === 403, 'Proxy to localhost must be rejected');

    // 2. Localhost standard port: rejected with 403
    const localStd = await get(`/api/proxy-image?url=${encodeURIComponent('http://localhost/secret')}`);
    console.log('  Proxy to localhost -> status:', localStd.status);
    assert.equal(localStd.status, 403, 'Proxy to localhost must return 403');

    // 3. Cloud metadata IP
    const metaProxy = await get(`/api/proxy-image?url=${encodeURIComponent('http://169.254.169.254/latest/meta-data')}`);
    console.log('  Proxy to 169.254.169.254 -> status:', metaProxy.status);
    assert.equal(metaProxy.status, 403, 'Proxy to cloud metadata must return 403');

    // 4. Arbitrary unauthorized external domain
    const evilProxy = await get(`/api/proxy-image?url=${encodeURIComponent('https://evil-attacker-site.com/exploit.jpg')}`);
    console.log('  Proxy to unauthorized external host -> status:', evilProxy.status);
    assert.equal(evilProxy.status, 403, 'Proxy to non-allowlisted host must return 403');

    console.log('Defect A6 (Image Proxy SSRF): FIXED');

  } finally {
    serverProc.kill();
  }
}

testServerSecurity().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
