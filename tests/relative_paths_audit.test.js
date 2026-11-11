/**
 * tests/relative_paths_audit.test.js
 * 
 * Verifies that all HTML navigation links, post-login redirects,
 * and page transitions use relative paths (e.g. ./arena.html, ./deck.html)
 * to ensure 100% compatibility when hosted in GitHub Pages repository subpaths
 * (e.g. https://destrodend.github.io/Battle-Spirits-Eternal/).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

test('Auth Redirects: login.html redirects to relative ./arena.html', () => {
  const loginHtml = fs.readFileSync(path.join(rootDir, 'login.html'), 'utf8');
  assert.ok(
    loginHtml.includes("window.location.href = './arena.html'"),
    "login.html must redirect to relative './arena.html' after login"
  );
  assert.ok(
    !loginHtml.includes("window.location.href = '/arena'"),
    "login.html must NOT redirect to root '/arena'"
  );
});

test('Auth Redirects: register.html redirects to relative ./arena.html', () => {
  const registerHtml = fs.readFileSync(path.join(rootDir, 'register.html'), 'utf8');
  assert.ok(
    registerHtml.includes("window.location.href = './arena.html'"),
    "register.html must redirect to relative './arena.html' after registration"
  );
  assert.ok(
    !registerHtml.includes("window.location.href = '/arena'"),
    "register.html must NOT redirect to root '/arena'"
  );
});

test('Navigation Links: No HTML files contain root-domain navigation links', () => {
  const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html') && f !== '404.html');
  const forbiddenTargets = ['/arena', '/browse', '/deck', '/family', '/sets', '/keywords', '/login', '/register'];

  for (const file of files) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const target of forbiddenTargets) {
        const hrefRegex = new RegExp(`href=["']${target}(?:["'\\?])`);
        assert.ok(
          !hrefRegex.test(line),
          `File ${file}:${index + 1} contains root path ${target}: ${line.trim()}`
        );
      }
    });
  }
});

test('Battle Arena: Relative paths used for duel redirects and room sharing', () => {
  const battleArena = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');
  assert.ok(
    battleArena.includes("window.location.href = `./arena.html?start=1"),
    "battle_arena.js must use relative path ./arena.html for match redirects"
  );
  assert.ok(
    !battleArena.includes("window.location.href = `/arena?start=1"),
    "battle_arena.js must NOT use root path /arena for match redirects"
  );
});

test('Browse & Keywords: Back and search links use relative paths', () => {
  const browseHtml = fs.readFileSync(path.join(rootDir, 'browse.html'), 'utf8');
  assert.ok(browseHtml.includes("backBtn.href = './family.html'"), "browse.html back button must use ./family.html");
  assert.ok(browseHtml.includes("backBtn.href = './sets.html'"), "browse.html back button must use ./sets.html");
  assert.ok(!browseHtml.includes("backBtn.href = '/family'"), "browse.html back button must not use /family");
  assert.ok(!browseHtml.includes("backBtn.href = '/sets'"), "browse.html back button must not use /sets");

  const keywordsHtml = fs.readFileSync(path.join(rootDir, 'keywords.html'), 'utf8');
  assert.ok(keywordsHtml.includes("openBrowseLink.href = `./browse.html?"), "keywords.html openBrowseLink must use ./browse.html?");
  assert.ok(!keywordsHtml.includes("openBrowseLink.href = `/browse?"), "keywords.html openBrowseLink must not use /browse?");

  assert.ok(fs.existsSync(path.join(rootDir, 'keywords_data.json')), "keywords_data.json must exist for static hosting");
  const kwData = JSON.parse(fs.readFileSync(path.join(rootDir, 'keywords_data.json'), 'utf8'));
  assert.ok(Array.isArray(kwData.keywords) && kwData.keywords.length > 50, "keywords_data.json must contain catalog");
});

test('Card Art: cleanCardImageUrl does not route to /api/proxy-image', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
  assert.ok(!appJs.includes("return '/api/proxy-image?url='"), "cleanCardImageUrl must not route images through /api/proxy-image");
});
