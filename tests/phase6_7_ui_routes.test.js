/**
 * tests/phase6_7_ui_routes.test.js
 * 
 * Automated regression test suite for Phase 6 (Battle Arena UI & Interactive Experience)
 * and Phase 7 (Website-Wide Overhaul & Route Architecture).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BSEngineAdapter } from '../engine_adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

test('Phase 6 & 7 - BSEngineAdapter provides full engine facade', () => {
  assert.ok(BSEngineAdapter.ETERNAL_RULES, 'ETERNAL_RULES profile must be exported');
  assert.equal(typeof BSEngineAdapter.createGame, 'function', 'createGame must be a function');
  assert.equal(typeof BSEngineAdapter.initDuelSession, 'function', 'initDuelSession must be a function');
  assert.equal(typeof BSEngineAdapter.PromptManager, 'function', 'PromptManager must be exported');
  assert.equal(typeof BSEngineAdapter.AIDecider, 'function', 'AIDecider must be exported');
  assert.equal(typeof BSEngineAdapter.TimingWindowManager, 'function', 'TimingWindowManager must be exported');
  assert.equal(typeof BSEngineAdapter.setupOpeningHands, 'function', 'setupOpeningHands must be exported');

  const session = BSEngineAdapter.initDuelSession({
    playerDeck: [{ name: 'TestCard', cost: 1 }],
    opponentDeck: [{ name: 'OppCard', cost: 1 }]
  });

  assert.ok(session.game, 'Session must have game instance');
  assert.ok(session.state, 'Session must have state');
  assert.ok(session.flow, 'Session must have flow controller');
  assert.ok(session.promptManager, 'Session must have promptManager');
  assert.ok(session.aiDecider, 'Session must have aiDecider');
  assert.ok(session.windows, 'Session must have timing windows manager');
});

test('Phase 6 - Non-blocking decision modals & backdrops in styles.css', () => {
  const cssPath = path.join(rootDir, 'styles.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Must have pointer-events: none on backdrop and pointer-events: auto on card
  assert.ok(css.includes('#battleBurstPromptModal') && css.includes('pointer-events: none'), 'Burst prompt modal must have non-blocking backdrop');
  assert.ok(css.includes('#battleTargetModal') && css.includes('pointer-events: none'), 'Target picker modal must have non-blocking backdrop');
  assert.ok(css.includes('#battleBlockModal') && css.includes('pointer-events: none'), 'Block choice modal must have non-blocking backdrop');
  assert.ok(css.includes('.battle-modal-card') && css.includes('pointer-events: auto'), 'Modal cards must retain pointer-events: auto');
});

test('Phase 6 - Step Navigator and embedded Turn Counter in arena.html', () => {
  const arenaPath = path.join(rootDir, 'arena.html');
  const html = fs.readFileSync(arenaPath, 'utf-8');

  // Verify 7 Steps
  assert.ok(html.includes('stepCard_START'), 'Step 1: START step card must exist');
  assert.ok(html.includes('stepCard_CORE'), 'Step 2: CORE step card must exist');
  assert.ok(html.includes('stepCard_DRAW'), 'Step 3: DRAW step card must exist');
  assert.ok(html.includes('stepCard_REFRESH'), 'Step 4: REFRESH step card must exist');
  assert.ok(html.includes('stepCard_MAIN'), 'Step 5: MAIN step card must exist');
  assert.ok(html.includes('stepCard_ATTACK'), 'Step 6: ATTACK step card must exist');
  assert.ok(html.includes('stepCard_END'), 'Step 7: END step card must exist');

  // Verify Turn counter slot between bursts
  assert.ok(html.includes('burst-center-turn-slot'), 'Turn counter must be embedded in burst center slot');
  assert.ok(html.includes('turn1MulliganBanner'), 'Turn 1 Mulligan banner must exist in arena.html');
  assert.ok(html.includes('btnViewBoardAsIs'), 'View Board As-Is button must exist');
});

test('Phase 6 - Pre-battle validation & Mulligan in battle_arena.js', () => {
  const arenaJsPath = path.join(rootDir, 'battle_arena.js');
  const js = fs.readFileSync(arenaJsPath, 'utf-8');

  // Verify >= 40 cards validation check
  assert.ok(js.includes('pCount < 40'), 'Must validate deck >= 40 cards before duel launch');
  assert.ok(js.includes('executeMulligan') || js.includes('performMulligan'), 'Mulligan execution handler must exist');
  assert.ok(js.includes('confirmOpeningHand') || js.includes('keepStartingHand'), 'Opening hand keep handler must exist');
  assert.ok(js.includes('toggleFullscreen'), 'Fullscreen toggle function must exist');
});

test('Phase 7 - Unified 404 client-side router for GitHub Pages', () => {
  const routerPath = path.join(rootDir, '404.html');
  const html = fs.readFileSync(routerPath, 'utf-8');

  const requiredRoutes = ['browse', 'deck', 'deck_view', 'arena', 'family', 'set', 'login', 'register'];
  for (const route of requiredRoutes) {
    assert.ok(html.includes(route), `404 router must handle /${route}/ route`);
  }
});

test('Phase 7 - Floating Deck Drawer in browse.html', () => {
  const browsePath = path.join(rootDir, 'browse.html');
  const html = fs.readFileSync(browsePath, 'utf-8');

  assert.ok(html.includes('floatingDeckDrawer'), 'browse.html must contain floatingDeckDrawer');
  assert.ok(html.includes('toggleFloatingDeckDrawer'), 'browse.html must have toggleFloatingDeckDrawer');
  assert.ok(html.includes('updateFloatingDeckDrawer'), 'browse.html must have updateFloatingDeckDrawer');
  assert.ok(html.includes('scope'), 'browse.html must have scope filter pills');
});

test('Phase 7 - Captcha verification in login.html and register.html', () => {
  const loginPath = path.join(rootDir, 'login.html');
  const loginHtml = fs.readFileSync(loginPath, 'utf-8');
  assert.ok(loginHtml.includes('captchaSvgContainer'), 'login.html must include captcha container');
  assert.ok(loginHtml.includes('verifyCaptchaLocal'), 'login.html must verify captcha on submit');

  const regPath = path.join(rootDir, 'register.html');
  const regHtml = fs.readFileSync(regPath, 'utf-8');
  assert.ok(regHtml.includes('captchaSvgContainer'), 'register.html must include captcha container');
  assert.ok(regHtml.includes('verifyCaptchaLocal'), 'register.html must verify captcha on submit');
});

test('Phase 7 - Landing Page (index.html) canonical metadata', () => {
  const indexPath = path.join(rootDir, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf-8');

  assert.ok(html.includes('14,607 Cards'), 'index.html must display 14,607 verified cards count');
  assert.ok(html.includes('featuredXRares'), 'index.html must display featured X-Rares showcase');
});
