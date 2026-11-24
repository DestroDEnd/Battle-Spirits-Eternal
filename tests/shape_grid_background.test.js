import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const INCLUDED_PAGES = [
  'index.html',
  'browse.html',
  'family.html',
  'sets.html',
  'keywords.html',
  'deck.html',
  'deck_view.html',
  'login.html',
  'register.html'
];

test('ShapeGrid background assets exist and expose expected symbols', () => {
  const cssPath = path.join(ROOT, 'assets', 'shape_grid.css');
  const jsPath = path.join(ROOT, 'assets', 'shape_grid.js');

  assert.ok(fs.existsSync(cssPath), 'assets/shape_grid.css should exist');
  assert.ok(fs.existsSync(jsPath), 'assets/shape_grid.js should exist');

  const css = fs.readFileSync(cssPath, 'utf8');
  assert.ok(css.includes('.shape-grid'), 'CSS should define .shape-grid');
  assert.ok(css.includes('.shape-grid-canvas'), 'CSS should define .shape-grid-canvas');
  assert.ok(css.includes('.site-bg-grid'), 'CSS should define .site-bg-grid');

  const js = fs.readFileSync(jsPath, 'utf8');
  assert.ok(js.includes('window.ShapeGrid'), 'JS should assign window.ShapeGrid');
  assert.ok(js.includes('bgShapeGrid'), 'JS should mount #bgShapeGrid container');
});

test('Site HTML pages include ShapeGrid assets while arena.html excludes them', () => {
  for (const page of INCLUDED_PAGES) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    assert.ok(html.includes('assets/shape_grid.css'), `${page} should include assets/shape_grid.css`);
    assert.ok(html.includes('assets/shape_grid.js'), `${page} should include assets/shape_grid.js`);
  }

  const arenaHtml = fs.readFileSync(path.join(ROOT, 'arena.html'), 'utf8');
  assert.equal(arenaHtml.includes('assets/shape_grid.css'), false, 'arena.html must not include assets/shape_grid.css');
  assert.equal(arenaHtml.includes('assets/shape_grid.js'), false, 'arena.html must not include assets/shape_grid.js');
});

test('assets/shape_grid.js loads cleanly in a minimal DOM vm context and defines window.ShapeGrid', () => {
  const jsPath = path.join(ROOT, 'assets', 'shape_grid.js');
  const source = fs.readFileSync(jsPath, 'utf8');

  let domContentLoadedRegistered = false;
  const fakeWindow = {};
  const fakeDocument = {
    readyState: 'loading',
    addEventListener(type, fn) {
      if (type === 'DOMContentLoaded' && typeof fn === 'function') {
        domContentLoadedRegistered = true;
      }
    }
  };
  fakeWindow.window = fakeWindow;
  fakeWindow.document = fakeDocument;

  const context = vm.createContext({
    window: fakeWindow,
    document: fakeDocument,
    globalThis: fakeWindow,
    Math
  });

  assert.doesNotThrow(() => {
    vm.runInContext(source, context, { filename: 'assets/shape_grid.js' });
  });

  assert.equal(typeof fakeWindow.ShapeGrid, 'function', 'window.ShapeGrid should be defined as a constructor/function');
  assert.equal(domContentLoadedRegistered, true, 'should register DOMContentLoaded listener when readyState is loading');
});
