import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchRealBrowser } from './helpers/real_browser.js';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports', 'aeroshards_integration');
fs.mkdirSync(REPORT_DIR, { recursive: true });

test('AeroShards Homescreen Integration Suite', async t => {
  await t.test('A. Component files, vgpu bundle, and index.html wiring', () => {
    assert.equal(fs.existsSync(path.join(ROOT, 'components', 'AeroShards', 'AeroShards.jsx')), true);
    assert.equal(fs.existsSync(path.join(ROOT, 'components', 'AeroShards', 'AeroShards.css')), true);
    assert.equal(fs.existsSync(path.join(ROOT, 'components', 'AeroShards', 'index.js')), true);
    assert.equal(fs.existsSync(path.join(ROOT, 'assets', 'vgpu.esm.js')), true);
    assert.equal(fs.existsSync(path.join(ROOT, 'assets', 'aero_shards.js')), true);

    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies && pkg.dependencies.vgpu, 'vgpu dependency must be listed in package.json');

    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.match(indexHtml, /id="heroAeroShards"/, 'index.html must include #heroAeroShards container');
    assert.match(indexHtml, /aero_shards\.js/, 'index.html must load assets/aero_shards.js');
    assert.match(indexHtml, /AeroShards\.css/, 'index.html must load AeroShards.css');
  });

  await t.test('B. Real Browser Homescreen Mount, Zero Exceptions & Screenshot', async () => {
    const browser = await launchRealBrowser({ headless: true });
    try {
      await browser.navigate('http://127.0.0.1:3000/index.html');
      const state = await browser.evaluate(`(async () => {
        const deadline = Date.now() + 20000;
        let el = null;
        while (Date.now() < deadline) {
          el = document.getElementById('heroAeroShards');
          if (el && el.dataset.aeroShardsMounted === 'true') break;
          await new Promise(r => setTimeout(r, 100));
        }
        await new Promise(r => setTimeout(r, 600));
        const hasCanvas = Boolean(el && el.querySelector('canvas.aero-shards-canvas'));
        const hasFallback = Boolean(el && el.dataset.aeroShardsFallback === 'true');
        const searchInput = document.getElementById('heroSearchInput');
        const battleBtn = document.querySelector('.btn-hero-battle');
        const rect = el ? el.getBoundingClientRect() : { width: 0, height: 0 };
        const heroStyle = el ? getComputedStyle(el) : null;
        return {
          mounted: el?.dataset.aeroShardsMounted === 'true',
          hasCanvas,
          hasFallback,
          hasWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
          width: rect.width,
          height: rect.height,
          pointerEvents: heroStyle?.pointerEvents || '',
          searchInteractive: Boolean(searchInput && !searchInput.disabled),
          battleBtnHref: battleBtn?.getAttribute('href') || ''
        };
      })()`);

      assert.equal(state.mounted, true, '#heroAeroShards must mount on index.html');
      assert.ok(state.width > 200 && state.height > 200, 'Hero AeroShards container must fill hero');
      assert.equal(state.pointerEvents, 'none', 'Overlay container must not block hero buttons/inputs');
      assert.ok(state.hasCanvas || state.hasFallback, 'Must either mount WebGPU canvas or trigger clean fallback');
      assert.equal(state.searchInteractive, true, 'Hero search input must remain interactive');
      assert.equal(state.battleBtnHref, './arena.html', 'Hero Battle Arena button must remain intact');

      await browser.captureScreenshot(path.join(REPORT_DIR, 'homescreen.png'));
      const aeroErrors = browser.exceptions.filter(
        ex => !String(ex?.exceptionDetails?.exception?.description || '').includes('FALLBACK_CARD_ART')
      );
      assert.equal(aeroErrors.length, 0, `Unexpected browser exceptions: ${JSON.stringify(aeroErrors)}`);
    } finally {
      await browser.close();
    }
  });
});
