const fs = require('fs');
const http = require('http');
const assert = require('assert');

console.log('--- TESTING ANIME & GAME ACCURATE HEXAGONAL CORES SYSTEM ---');

// 1. Setup mock environment for battle_arena.js
const mockElements = {};
function createMockEl(id) {
  return {
    id,
    tagName: 'DIV',
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    dataset: {},
    innerHTML: '',
    textContent: '',
    title: '',
    disabled: false,
    scrollIntoView: () => {}
  };
}

global.window = {
  esc: (s) => s,
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {},
  DuelState: null
};

global.document = {
  readyState: 'complete',
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockEl(id);
    return mockElements[id];
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

eval(fs.readFileSync('battle_arena.js', 'utf8'));

// 2. Test SVG Generation
console.log('1. Verifying getHexCoreSvg generation...');
const blueSvg = window.BattleArena.getHexCoreSvg('blue', 18);
assert(blueSvg.includes('class="hex-core-svg hex-blue-core"'), 'Blue core must have hex-blue-core class');
assert(blueSvg.includes('polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5"'), 'Blue core must have authentic 6-point hexagon geometry');
assert(blueSvg.includes('hexBlueGrad_18'), 'Blue core must include radiant cyan gradient');
console.log('  [PASS] Blue hexagonal crystal generated accurately');

const soulSvg = window.BattleArena.getHexCoreSvg('soul', 20);
assert(soulSvg.includes('class="hex-core-svg hex-soul-core"'), 'Soul core must have hex-soul-core class');
assert(soulSvg.includes('hexSoulGrad_20'), 'Soul core must include ruby-flame imperial gradient');
assert(soulSvg.includes('hexSoulCenter_20'), 'Soul core must include central blazing star flame');
console.log('  [PASS] Soul Core flaming hexagonal crystal generated accurately');

const lifeActiveSvg = window.BattleArena.getHexCoreSvg('life-active', 22);
assert(lifeActiveSvg.includes('class="hex-core-svg hex-life-active"'), 'Active Life core must have hex-life-active class');
assert(lifeActiveSvg.includes('hexLifeGrad_22'), 'Active Life core must include golden-amber gradient');
console.log('  [PASS] Life Core active amber hexagon generated accurately');

const lifeEmptySvg = window.BattleArena.getHexCoreSvg('life-empty', 22);
assert(lifeEmptySvg.includes('class="hex-core-svg hex-life-empty"'), 'Empty Life core must have hex-life-empty class');
assert(lifeEmptySvg.includes('stroke-dasharray="2,2"'), 'Empty Life core must have dashed shattered socket');
console.log('  [PASS] Life Core shattered empty socket generated accurately');

// 3. Test index.html markup
console.log('2. Verifying index.html hexagonal core integration...');
const html = fs.readFileSync('index.html', 'utf8');

assert(html.includes('id="opponentSoulCorePill"'), 'Opponent Soul Core pill must exist');
assert(html.includes('id="playerSoulCorePill"'), 'Player Soul Core pill must exist');
assert(html.includes('id="voidCoresVisual"'), 'Void cores visual reservoir must exist');
assert(html.includes('voidCore1Grad'), 'Void cores must use hexagonal SVG gradients');
assert(html.includes('voidCore5Grad'), 'All 5 Void cores must have faceted crystal definitions');
assert(html.includes('oppScGrad'), 'Opponent Soul Core must have dedicated SVG gradient');
assert(html.includes('playerScGrad'), 'Player Soul Core must have dedicated SVG gradient');
assert(html.includes('oppResGrad'), 'Opponent Reserve must have hexagonal blue core SVG');
assert(html.includes('playerResGrad'), 'Player Reserve must have hexagonal blue core SVG');
assert(html.includes('btnCoreGrad'), 'Step 2 CORE button must feature a hexagonal core');
console.log('  [PASS] index.html contains authentic hexagonal SVGs in all HUDs & Void Zone');

// 4. Test styles.css definitions
console.log('3. Verifying styles.css animations and lighting...');
const css = fs.readFileSync('styles.css', 'utf8');

assert(css.includes('.hex-core-svg'), '.hex-core-svg rule must exist');
assert(css.includes('.hex-blue-core'), '.hex-blue-core rule must exist');
assert(css.includes('.hex-life-active'), '.hex-life-active rule must exist');
assert(css.includes('.hex-life-empty'), '.hex-life-empty rule must exist');
assert(css.includes('.hex-soul-core'), '.hex-soul-core rule must exist');
assert(css.includes('.void-hex-core'), '.void-hex-core floating rule must exist');
assert(css.includes('@keyframes hexLifePulse'), '@keyframes hexLifePulse must exist');
assert(css.includes('@keyframes hexSoulGlow'), '@keyframes hexSoulGlow must exist');
assert(css.includes('@keyframes void-hex-float'), '@keyframes void-hex-float must exist');
console.log('  [PASS] styles.css contains glowing drop shadows, pulse and floating keyframes');

// 5. Test Live Server Response
console.log('4. Checking live server responses at http://localhost:8000/ ...');
function testUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, length: data.length });
      });
    }).on('error', reject);
  });
}

async function runLiveChecks() {
  try {
    const rootRes = await testUrl('/');
    assert.strictEqual(rootRes.statusCode, 200, 'Root must return HTTP 200');
    console.log(`  [PASS] GET / -> HTTP 200 (${rootRes.length} bytes)`);

    const jsRes = await testUrl('/battle_arena.js?v=2.4');
    assert.strictEqual(jsRes.statusCode, 200, 'battle_arena.js must return HTTP 200');
    console.log(`  [PASS] GET /battle_arena.js?v=2.4 -> HTTP 200 (${jsRes.length} bytes)`);

    const cssRes = await testUrl('/styles.css?v=2.4');
    assert.strictEqual(cssRes.statusCode, 200, 'styles.css must return HTTP 200');
    console.log(`  [PASS] GET /styles.css?v=2.4 -> HTTP 200 (${cssRes.length} bytes)`);

    console.log('\n======================================================');
    console.log('ALL HEXAGONAL CORE & SOUL CORE TESTS PASSED WITH 100%!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Live check error:', err);
    process.exit(1);
  }
}

runLiveChecks();
