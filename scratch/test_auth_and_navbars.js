const fs = require('fs');
const path = require('path');
const assert = require('assert');

const BASE_URL = 'http://localhost:8000';

async function runTests() {
  console.log('🧪 RUNNING AUTHENTICATION, CAPTCHA & NAVBAR TEST SUITE...\n');
  let passed = 0;
  let total = 0;

  function it(desc, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error(err);
    }
  }

  async function itAsync(desc, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error(err);
    }
  }

  // ── 1. NAVBAR AUDIT ACROSS ALL HTML PAGES ──
  console.log('--- 1. Testing Top Navbar Across All Pages ---');
  const pages = ['index.html', 'browse.html', 'family.html', 'sets.html', 'deck.html'];

  for (const page of pages) {
    const filePath = path.join(__dirname, '..', page);
    const content = fs.readFileSync(filePath, 'utf8');

    it(`${page} has removed the Home button (#tabHome)`, () => {
      assert.strictEqual(content.includes('id="tabHome"'), false, `${page} should not contain id="tabHome"`);
      assert.strictEqual(content.includes('🏠 Home'), false, `${page} should not contain "🏠 Home" text`);
    });

    it(`${page} has removed the Import Deck button (#tabImport) from top navbar`, () => {
      assert.strictEqual(content.includes('id="tabImport"'), false, `${page} should not contain id="tabImport"`);
    });

    it(`${page} contains the Login option (#tabAuth) in navbar slot (#navAuthSlot)`, () => {
      assert.ok(content.includes('id="navAuthSlot"'), `${page} must contain id="navAuthSlot"`);
      assert.ok(content.includes('id="tabAuth"'), `${page} must contain id="tabAuth"`);
      assert.ok(content.includes('href="/login"'), `${page} must link to /login`);
    });
  }

  // ── 2. LOGIN PAGE AUDIT ──
  console.log('\n--- 2. Testing Login Page Structure (login.html) ---');
  const loginHtml = fs.readFileSync(path.join(__dirname, '..', 'login.html'), 'utf8');

  it('login.html contains Login and Password input fields', () => {
    assert.ok(loginHtml.includes('id="loginInput"'), 'login.html must have #loginInput');
    assert.ok(loginHtml.includes('id="passwordInput"'), 'login.html must have #passwordInput');
  });

  it('login.html contains Security Captcha container and refresh button', () => {
    assert.ok(loginHtml.includes('id="captchaSvgContainer"'), 'login.html must have #captchaSvgContainer');
    assert.ok(loginHtml.includes('id="btnRefreshCaptcha"'), 'login.html must have #btnRefreshCaptcha');
    assert.ok(loginHtml.includes('id="captchaInput"'), 'login.html must have #captchaInput');
  });

  it('login.html contains prominent Register redirection option', () => {
    assert.ok(loginHtml.includes('href="/register"'), 'login.html must have a link to /register');
    assert.ok(loginHtml.includes('Register Here'), 'login.html must contain "Register Here" callout');
  });

  // ── 3. REGISTER PAGE AUDIT ──
  console.log('\n--- 3. Testing Register Page Structure (register.html) ---');
  const regHtml = fs.readFileSync(path.join(__dirname, '..', 'register.html'), 'utf8');

  it('register.html contains Username, Login, and Password inputs', () => {
    assert.ok(regHtml.includes('id="regUsername"'), 'register.html must have #regUsername');
    assert.ok(regHtml.includes('id="regLogin"'), 'register.html must have #regLogin');
    assert.ok(regHtml.includes('id="regPassword"'), 'register.html must have #regPassword');
    assert.ok(regHtml.includes('id="regConfirmPassword"'), 'register.html must have #regConfirmPassword');
  });

  it('register.html contains Security Captcha container and refresh button', () => {
    assert.ok(regHtml.includes('id="captchaSvgContainer"'), 'register.html must have #captchaSvgContainer');
    assert.ok(regHtml.includes('id="btnRefreshCaptcha"'), 'register.html must have #btnRefreshCaptcha');
    assert.ok(regHtml.includes('id="regCaptcha"'), 'register.html must have #regCaptcha');
  });

  it('register.html contains prominent Back to Login redirection option', () => {
    assert.ok(regHtml.includes('href="/login"'), 'register.html must have a link to /login');
    assert.ok(regHtml.includes('Log in here'), 'register.html must contain "Log in here" callout');
  });

  // ── 4. BACKEND API CAPTCHA & AUTH FLOW VERIFICATION ──
  console.log('\n--- 4. Testing Backend Captcha & Authentication APIs ---');

  let captchaToken = '';
  await itAsync('GET /api/captcha returns valid challenge token and SVG', async () => {
    const res = await fetch(`${BASE_URL}/api/captcha`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Token must be present');
    assert.ok(data.svg && data.svg.includes('<svg'), 'SVG challenge must be present');
    assert.strictEqual(data.length, 6);
    captchaToken = data.token;
  });

  await itAsync('POST /api/register with invalid captcha is rejected with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Test Dan',
        login: 'test_dan_unique',
        password: 'password123',
        captcha_token: captchaToken,
        captcha_code: 'WRONG'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('captcha'), 'Error message must mention captcha');
  });

  // Test registration and login with simulated valid captcha in python database
  await itAsync('Database directly registers and authenticates new duelist account', async () => {
    const { execFileSync } = require('child_process');
    const pyScript = `import database
login = 'dan_colosseum_${Date.now()}'
reg = database.create_user('Dan Bashin', login, 'danpass123')
assert reg['success'], 'Failed registration: ' + str(reg)
auth_ok = database.authenticate_user(login, 'danpass123')
assert auth_ok['success']
auth_fail = database.authenticate_user(login, 'wrongpass')
assert not auth_fail['success']
dup = database.create_user('Dan Copy', login, 'danpass123')
assert not dup['success']
print('DB_AUTH_SUCCESS')
`;
    const out = execFileSync('py', ['-3', '-c', pyScript], { encoding: 'utf8' });
    assert.ok(out.includes('DB_AUTH_SUCCESS'), 'Python database auth verification passed');
  });

  // ── 5. CLIENT AUTHMANGER VERIFICATION ──
  console.log('\n--- 5. Testing Client AuthManager UI State ---');
  it('AuthManager sets and clears user, rendering navbar states properly', () => {
    // Mock minimal DOM
    let storage = {};
    global.localStorage = {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; }
    };
    global.window = { location: { pathname: '/' } };

    const navSlot = {
      innerHTML: ''
    };
    global.document = {
      getElementById: (id) => (id === 'navAuthSlot' ? navSlot : null),
      addEventListener: () => {}
    };

    const app = require('../app.js');
    const AuthManager = app.AuthManager;
    assert.ok(AuthManager, 'AuthManager must be exported');

    // Initially no user
    AuthManager.logout();
    assert.strictEqual(AuthManager.getUser(), null);
    AuthManager.renderNavbar();
    assert.ok(navSlot.innerHTML.includes('id="tabAuth"'));
    assert.ok(navSlot.innerHTML.includes('👤 Login'));

    // Set user
    AuthManager.setUser({ username: 'KingTaurusDuelist', login: 'kingtaurus' });
    assert.strictEqual(AuthManager.getUser().username, 'KingTaurusDuelist');
    assert.ok(navSlot.innerHTML.includes('KingTaurusDuelist'));
    assert.ok(navSlot.innerHTML.includes('🛡️'));
    assert.ok(navSlot.innerHTML.includes('btnLogout'));
    assert.ok(navSlot.innerHTML.includes('🚪 Logout'));

    // Logout
    AuthManager.logout();
    assert.strictEqual(AuthManager.getUser(), null);
    assert.ok(navSlot.innerHTML.includes('id="tabAuth"'));
  });

  console.log(`\n📊 RESULTS: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 ALL AUTHENTICATION, CAPTCHA & NAVBAR TESTS PASSED!\n');
  } else {
    console.error(`⚠️ ${total - passed} test(s) failed.`);
    process.exit(1);
  }
}

runTests();
