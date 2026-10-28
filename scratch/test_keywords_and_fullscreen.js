const fs = require('fs');
const assert = require('assert');

// Mock DOM & Storage environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

global.window = {
  localStorage: global.localStorage,
  location: { pathname: '/', origin: 'http://localhost:8000' },
  confirm: () => true,
  prompt: (msg, def) => def
};

const domElements = {};
global.document = {
  readyState: 'complete',
  fullscreenElement: null,
  addEventListener: () => {},
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false
        },
        style: {},
        innerHTML: '',
        textContent: '',
        value: '',
        disabled: false
      };
    }
    return domElements[id];
  },
  querySelector: (sel) => ({ classList: { add:()=>{}, remove:()=>{} }, style: {} }),
  querySelectorAll: (sel) => []
};

let lastToast = null;
global.showToast = (msg, type) => { lastToast = { msg, type }; };

require('../app.js');
require('../battle_arena.js');

const BA = window.BattleArena;

let testsPassed = 0;
let totalTests = 0;

async function it(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
  }
}

async function runTests() {
  console.log('🧪 RUNNING BATTLE SPIRITS KEYWORDS & FULLSCREEN TEST SUITE...\n');

  // ── 1. HOLY LIFE KEYWORD ──
  console.log('--- 1. Testing Holy Life (聖命) Keyword ---');

  await it('hasHolyLife correctly identifies Holy Life variants', () => {
    assert.strictEqual(BA.hasHolyLife({ effect: '[Holy Life] When Attacks' }), true);
    assert.strictEqual(BA.hasHolyLife({ effect: '【聖命】When Attacks' }), true);
    assert.strictEqual(BA.hasHolyLife({ effect: '[Ultra Holy Life] When attacks' }), true);
    assert.strictEqual(BA.hasHolyLife({ effect: '[Heavenly Light] When attacks' }), true);
    assert.strictEqual(BA.hasHolyLife({ effect: 'Standard Spirit' }), false);
  });

  await it('Holy Life attacker restores +1 Life from Void when damaging opponent Life', async () => {
    await BA.startDuel('deck_std_red', 'purple', 'player');
    const state = BA.getState();
    state.player.life = 3; // Damaged player life
    state.opponent.life = 4;
    state.opponent.reserve = 2;

    const holyAttacker = {
      uid: 'holy_sp_1',
      name: 'The HolyDragon Luminescence',
      currentBp: 5000,
      currentCores: 2,
      effect: '[Holy Life] When Attacks: When this Spirit\'s attack reduces opponent\'s Life, put 1 core from the Void to your Life.',
      isExhausted: false,
      hasAttacked: false
    };
    state.player.field = [holyAttacker];
    state.turn = 2; // Allow attack on Turn 2
    state.phaseIndex = 5; // ATTACK

    // Declare attack with no blockers -> direct life hit
    state.opponent.field = []; // No blockers
    BA.handleSpiritClick('holy_sp_1', 'player');

    // Wait for combat resolution timeout
    await new Promise(r => setTimeout(r, 1100));

    // Opponent life should be 3 (was 4), Player life should be 4 (healed from 3 via Holy Life!)
    assert.strictEqual(state.opponent.life, 3, 'Opponent life reduced by 1');
    assert.strictEqual(state.player.life, 4, 'Player Life restored +1 via [Holy Life] from Void!');
  });

  // ── 2. WINDSTORM KEYWORD ──
  console.log('\n--- 2. Testing Windstorm (暴風) Keyword ---');

  await it('hasWindstorm extracts windstorm tier', () => {
    assert.strictEqual(BA.hasWindstorm({ effect: '[Windstorm: 1] When attacks' }), 1);
    assert.strictEqual(BA.hasWindstorm({ effect: '[Windstorm: 2] When attacks' }), 2);
    assert.strictEqual(BA.hasWindstorm({ effect: '【暴風：3】' }), 3);
    assert.strictEqual(BA.hasWindstorm({ effect: 'No windstorm' }), 0);
  });

  await it('Windstorm exhausts opposing spirits on attack declaration', () => {
    const state = BA.getState();
    const windAttacker = {
      uid: 'wind_sp_1',
      name: 'Emerald Falcon',
      effect: '[Windstorm: 2] When Attacks'
    };
    state.opponent.field = [
      { uid: 'opp_s1', name: 'Defender 1', currentBp: 3000, isExhausted: false },
      { uid: 'opp_s2', name: 'Defender 2', currentBp: 5000, isExhausted: false },
      { uid: 'opp_s3', name: 'Defender 3', currentBp: 2000, isExhausted: false }
    ];

    BA.executeWhenAttacksEffects(windAttacker, 'player');

    // The top 2 BP opposing spirits (5000 and 3000) should now be exhausted!
    const opp2 = state.opponent.field.find(s => s.uid === 'opp_s2');
    const opp1 = state.opponent.field.find(s => s.uid === 'opp_s1');
    const opp3 = state.opponent.field.find(s => s.uid === 'opp_s3');
    assert.strictEqual(opp2.isExhausted, true, 'Top BP defender exhausted by Windstorm');
    assert.strictEqual(opp1.isExhausted, true, 'Second defender exhausted by Windstorm');
    assert.strictEqual(opp3.isExhausted, false, 'Third defender remains ready');
  });

  // ── 3. ASSAULT KEYWORD ──
  console.log('\n--- 3. Testing Assault (強襲) Keyword ---');

  await it('hasAssault detects tier and enables re-readying for attack', () => {
    assert.strictEqual(BA.hasAssault({ effect: '[Assault: 1] When Attacks' }), 1);
    assert.strictEqual(BA.hasAssault({ effect: '[Great Assault: 2]' }), 2);
    assert.strictEqual(BA.hasAssault({ effect: '【強襲：1】' }), 1);
  });

  await it('Assault exhausts an allied spirit to re-ready the attacker', () => {
    const state = BA.getState();
    const assaultAttacker = {
      uid: 'assault_colossus',
      name: 'Titan of the Deep',
      effect: '[Assault: 1] When attacks',
      isExhausted: true,
      hasAttacked: true,
      _assaultCount: 0
    };
    const ally = {
      uid: 'ally_sp',
      name: 'Sea Sprite',
      isExhausted: false
    };
    state.player.field = [assaultAttacker, ally];

    BA.executeWhenAttacksEffects(assaultAttacker, 'player');

    assert.strictEqual(ally.isExhausted, true, 'Allied spirit exhausted for Assault tribute');
    assert.strictEqual(assaultAttacker.isExhausted, false, 'Assault attacker refreshed to ready state!');
    assert.strictEqual(assaultAttacker.hasAttacked, false, 'Can declare another attack!');
  });

  // ── 4. EXPANDED CLASH, CURSE, CRUSH, ARMOR ──
  console.log('\n--- 4. Testing Expanded Clash, Curse, Crush & Armor Variants ---');

  await it('hasClash recognizes True-Clash & Supreme Clash', () => {
    assert.strictEqual(BA.hasClash({ effect: '[True-Clash] When attacks' }), true);
    assert.strictEqual(BA.hasClash({ effect: '[Supreme Clash] When attacks' }), true);
    assert.strictEqual(BA.hasClash({ effect: '【真・激突】' }), true);
  });

  await it('hasCurse recognizes True-Curse & Grudging Curse', () => {
    assert.strictEqual(BA.hasCurse({ effect: '[True-Curse]' }), true);
    assert.strictEqual(BA.hasCurse({ effect: '[Grudging Curse]' }), true);
  });

  await it('hasCrush recognizes Great Crush & Wave Crush', () => {
    assert.strictEqual(BA.hasCrush({ effect: '[Great Crush]' }), true);
    assert.strictEqual(BA.hasCrush({ effect: '[Wave Crush: 2]' }), true);
  });

  await it('hasArmor recognizes A.T. Field & PS Armor', () => {
    assert.strictEqual(BA.hasArmor({ effect: '[A.T. Field]' }, 'red'), true);
    assert.strictEqual(BA.hasArmor({ effect: '[PS Armor]' }, 'purple'), true);
    assert.strictEqual(BA.hasArmor({ effect: '[Armor: Red]' }, 'red'), true);
    assert.strictEqual(BA.hasArmor({ effect: '[Armor: Red]' }, 'blue'), false);
  });

  // ── 5. FULLSCREEN MODE ENGINE ──
  console.log('\n--- 5. Testing Fullscreen Arena Engine ---');

  await it('Fullscreen functions are exported and callable without throwing', () => {
    assert.strictEqual(typeof BA.enterFullscreen, 'function');
    assert.strictEqual(typeof BA.exitFullscreen, 'function');
    assert.strictEqual(typeof BA.toggleFullscreen, 'function');

    // Call safely (gracefully handles headless Node environment)
    assert.doesNotThrow(() => BA.enterFullscreen());
    assert.doesNotThrow(() => BA.exitFullscreen());
    assert.doesNotThrow(() => BA.toggleFullscreen());
  });

  await it('index.html contains Fullscreen toggle button', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    assert.ok(html.includes('btnDuelFullscreen'), 'Button #btnDuelFullscreen exists in index.html');
    assert.ok(html.includes('BattleArena.toggleFullscreen()'), 'Button triggers toggleFullscreen()');
  });

  await it('styles.css removes top arena header and moves Phase Control upwards in fullscreen', () => {
    const css = fs.readFileSync('styles.css', 'utf8');
    assert.ok(css.includes('.arena-header'), 'Contains arena-header styles');
    assert.ok(
      css.includes('#battleArena:fullscreen .arena-header') && css.includes('display: none !important;'),
      'Must hide .arena-header in fullscreen mode'
    );
    assert.ok(
      css.includes('#battleArena:fullscreen .duel-step-navigator') && css.includes('top: 0 !important;'),
      'Must move .duel-step-navigator upwards (top: 0) in fullscreen mode'
    );
  });

  // ── 6. KEYWORD PILL RENDERING ──
  console.log('\n--- 6. Testing Keyword Pill Formatting ---');

  await it('formatEffectKeywords produces corresponding .kw-* pills', () => {
    const raw = '[Holy Life] [Windstorm: 1] [Assault: 2] [High Speed] [Awaken] [Immortality] [Soul Drive]';
    const formatted = BA.formatEffectKeywords(raw);

    assert.ok(formatted.includes('kw-holylife'), 'Contains kw-holylife');
    assert.ok(formatted.includes('kw-windstorm'), 'Contains kw-windstorm');
    assert.ok(formatted.includes('kw-assault'), 'Contains kw-assault');
    assert.ok(formatted.includes('kw-highspeed'), 'Contains kw-highspeed');
    assert.ok(formatted.includes('kw-awaken'), 'Contains kw-awaken');
    assert.ok(formatted.includes('kw-immortality'), 'Contains kw-immortality');
    assert.ok(formatted.includes('kw-souldrive'), 'Contains kw-souldrive');
  });

  console.log(`\n📊 RESULTS: ${testsPassed} / ${totalTests} tests passed.`);
  if (testsPassed === totalTests) {
    console.log('🎉 ALL KEYWORDS & FULLSCREEN TESTS PASSED!\n');
  } else {
    console.error(`⚠️ FAILED: ${totalTests - testsPassed} tests failed!`);
    process.exit(1);
  }
}

runTests();
