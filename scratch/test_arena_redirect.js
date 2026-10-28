const fs = require('fs');
const http = require('http');
const assert = require('assert');

console.log('🧪 Starting Battle Arena Dedicated Redirect Test Suite...\n');

// 1. Check index.html
const indexHtml = fs.readFileSync('index.html', 'utf-8');
assert(!indexHtml.includes('id="battleArena"'), 'index.html MUST NOT contain embedded #battleArena');
assert(indexHtml.includes('href="/arena"'), 'index.html must link to /arena in navbar and hero');
assert(indexHtml.includes('href="/arena?duel=quick"'), 'index.html hero must link to /arena?duel=quick for Quick Duel');
console.log('  ✅ index.html is clean of battle elements and links directly to /arena & /arena?duel=quick');

// 2. Check arena.html
const arenaHtml = fs.readFileSync('arena.html', 'utf-8');
assert(arenaHtml.includes('id="battleArena"'), 'arena.html must contain #battleArena');
assert(arenaHtml.includes('id="battleLobby"'), 'arena.html must contain #battleLobby');
assert(arenaHtml.includes('id="battleDuelTable"'), 'arena.html must contain #battleDuelTable');
assert(arenaHtml.includes('id="duelStepNavigator"'), 'arena.html must contain #duelStepNavigator');
assert(arenaHtml.includes('id="burstCenterTurnSlot"'), 'arena.html must contain #burstCenterTurnSlot');
assert(arenaHtml.includes('tab-btn-battle active'), 'arena.html navbar must mark Battle Arena tab as active');
console.log('  ✅ arena.html contains complete Battle Arena, Turn badge slot, Step Navigator, and active navbar tab');

// 3. Test HTTP server endpoints
function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:8000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runHttpTests() {
  const rArena = await testEndpoint('/arena');
  assert.strictEqual(rArena.status, 200, '/arena must return 200 OK');
  assert(rArena.body.includes('Destro\'s Colosseum Battle Arena'), '/arena must serve Colosseum Battle Arena title');
  console.log('  ✅ GET /arena returned HTTP 200 OK with dedicated Battle Arena page');

  const rBattle = await testEndpoint('/battle');
  assert.strictEqual(rBattle.status, 200, '/battle must return 200 OK');
  assert(rBattle.body.includes('id="battleArena"'), '/battle alias must serve arena');
  console.log('  ✅ GET /battle alias returned HTTP 200 OK');

  const rHome = await testEndpoint('/');
  assert.strictEqual(rHome.status, 200, '/ must return 200 OK');
  assert(rHome.body.includes('href="/arena"'), 'Home page must have redirect link to /arena');
  assert(!rHome.body.includes('id="battleArena"'), 'Home page must not contain #battleArena section');
  console.log('  ✅ GET / home page returned HTTP 200 OK without in-page battle elements');

  console.log('\n🎉 ALL DEDICATED BATTLE ARENA REDIRECT TESTS PASSED WITH 100% SUCCESS!');
}

runHttpTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
