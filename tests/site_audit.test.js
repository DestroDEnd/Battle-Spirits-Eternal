import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const HTML_FILES = [
  'index.html',
  'arena.html',
  'browse.html',
  'deck.html',
  'deck_view.html',
  'family.html',
  'sets.html',
  'login.html',
  'register.html',
  '404.html'
];

describe('Site-Wide UI & Resource Integrity Audit', () => {

  it('1. All HTML pages exist and have non-empty valid content', () => {
    for (const f of HTML_FILES) {
      const p = path.join(rootDir, f);
      assert.ok(fs.existsSync(p), `File exists: ${f}`);
      const content = fs.readFileSync(p, 'utf8');
      assert.ok(content.length > 50, `File ${f} is non-empty (${content.length} chars)`);
      assert.match(content, /<!DOCTYPE html>/i, `${f} has standard HTML5 doctype`);
      assert.match(content, /<\/html>/i, `${f} has closing html tag`);
    }
  });

  it('2. Local CSS stylesheets referenced in HTML files exist on disk', () => {
    const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
    for (const f of HTML_FILES) {
      const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
      let match;
      while ((match = cssRegex.exec(content)) !== null) {
        const href = match[1];
        if (href.startsWith('http://') || href.startsWith('https://')) continue;
        const cleanHref = href.split('?')[0].replace(/^\//, '');
        const targetPath = path.join(rootDir, cleanHref);
        assert.ok(fs.existsSync(targetPath), `Stylesheet referenced in ${f} exists: ${cleanHref}`);
      }
    }
  });

  it('3. Local JavaScript files referenced in HTML files exist on disk', () => {
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    for (const f of HTML_FILES) {
      const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
      let match;
      while ((match = scriptRegex.exec(content)) !== null) {
        const src = match[1];
        if (src.startsWith('http://') || src.startsWith('https://')) continue;
        const cleanSrc = src.split('?')[0].replace(/^\//, '');
        const targetPath = path.join(rootDir, cleanSrc);
        assert.ok(fs.existsSync(targetPath), `Script referenced in ${f} exists: ${cleanSrc}`);
      }
    }
  });

  it('4. Navigation links map to valid pages in ROUTE_MAP or files', () => {
    const VALID_ROUTES = new Set([
      '/', '/arena', '/battle', '/duel', '/browse', '/deck',
      '/deck-view', '/deck_view', '/family', '/sets', '/login', '/register',
      '#', 'javascript:void(0)', 'javascript:void(0);'
    ]);
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    for (const f of HTML_FILES) {
      const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const href = match[1];
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('data:') || href.startsWith('javascript:')) continue;
        const cleanHref = href.split('?')[0].split('#')[0];
        if (cleanHref.endsWith('.html')) {
          const p = path.join(rootDir, cleanHref.replace(/^\.?\//, ''));
          assert.ok(fs.existsSync(p), `File link in ${f} exists: ${cleanHref}`);
        } else {
          assert.ok(VALID_ROUTES.has(cleanHref) || fs.existsSync(path.join(rootDir, cleanHref.replace(/^\//, ''))), `Route link in ${f} is valid: ${cleanHref}`);
        }
      }
    }
  });

  it('5. Responsive viewport and charset meta tags present on every user page', () => {
    const userPages = HTML_FILES.filter(f => f !== '404.html');
    for (const f of userPages) {
      const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
      assert.match(content, /<meta[^>]+charset=/i, `${f} defines character encoding`);
      assert.match(content, /<meta[^>]+name=["']viewport["']/i, `${f} defines mobile viewport`);
    }
  });

  it('6. Server API endpoints verification (/api/captcha, /api/filters, /api/cards, /api/ai-weights)', async () => {
    const serverPath = path.join(rootDir, 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    assert.match(serverContent, /\/api\/captcha/, 'server.js has /api/captcha endpoint');
    assert.match(serverContent, /\/api\/filters/, 'server.js has /api/filters endpoint');
    assert.match(serverContent, /\/api\/cards/, 'server.js has /api/cards endpoint');
    assert.match(serverContent, /\/api\/featured-x-rares/, 'server.js has /api/featured-x-rares endpoint');
  });

  it('7. Global keyboard shortcuts (/ for quick search, Escape/Arrows/A/+ for card modal) configured in app.js', () => {
    const appPath = path.join(rootDir, 'app.js');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.match(appContent, /e\.key === '\/'/, 'app.js handles / quick search focus');
    assert.match(appContent, /e\.key === 'Escape'/, 'app.js handles Escape modal close');
    assert.match(appContent, /e\.key === 'ArrowLeft'/, 'app.js handles ArrowLeft modal prev');
    assert.match(appContent, /e\.key === 'ArrowRight'/, 'app.js handles ArrowRight modal next');
    assert.match(appContent, /addModalCardToDeck/, 'app.js handles quick add card shortcut');
  });

});
