/**
 * tests/holocard_integration.test.js
 *
 * Verifies all 12 HoloCard Integration & Precise Hover Activation scenarios
 * in headless Chrome + file/shader invariants + captures before/after screenshots.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchRealBrowser } from './helpers/real_browser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'holocard_integration');

test('HoloCard Integration & 12-Scenario Hover Isolation Suite', async (t) => {
  await t.test('A. Component files, shader uniforms, and old silver removal invariants', () => {
    const jsxPath = path.join(ROOT, 'components', 'HoloCard', 'HoloCard.jsx');
    const cssPath = path.join(ROOT, 'components', 'HoloCard', 'HoloCard.css');
    const idxPath = path.join(ROOT, 'components', 'HoloCard', 'index.js');
    assert.ok(fs.existsSync(jsxPath), 'HoloCard.jsx must exist');
    assert.ok(fs.existsSync(cssPath), 'HoloCard.css must exist');
    assert.ok(fs.existsSync(idxPath), 'components/HoloCard/index.js must exist');

    const jsx = fs.readFileSync(jsxPath, 'utf8');
    assert.ok(jsx.includes('idle = false'), 'HoloCard.jsx must default idle to false');
    assert.ok(jsx.includes('uniform float uActive;'), 'HoloCard.jsx shader must support explicit uActive zeroing');

    const runtime = fs.readFileSync(path.join(ROOT, 'holo_card.js'), 'utf8');
    assert.ok(runtime.includes('uniform float uActive;'), 'holo_card.js must include uActive');
    assert.ok(runtime.includes('uniform float uOverlayOnly;'), 'holo_card.js must include uOverlayOnly for cross-origin artwork');
    assert.ok(runtime.includes('idle: false'), 'holo_card.js must disable idle');

    // Old silver ReflectiveCard files must be completely removed
    assert.equal(fs.existsSync(path.join(ROOT, 'reflective_card.js')), false, 'reflective_card.js must be removed');
    assert.equal(fs.existsSync(path.join(ROOT, 'components', 'ReflectiveCard')), false, 'ReflectiveCard directory must be removed');

    const styles = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    assert.equal(styles.includes('.rc-hover-overlay'), false, 'Old .rc-hover-overlay CSS must be removed');
    assert.equal(styles.includes('.card-foil-sheen'), false, 'Old .card-foil-sheen CSS must be removed');
    assert.equal(styles.includes('.modal-foil-sheen'), false, 'Old .modal-foil-sheen CSS must be removed');
  });

  await t.test('B. Real Browser 12-Scenario Hover Isolation, Regression & Screenshots', async () => {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const port = 4970 + Math.floor(Math.random() * 40);
    const browser = await launchRealBrowser({ serverPort: port });

    try {
      await browser.navigate(`http://127.0.0.1:${port}/browse.html`);
      await browser.evaluate(`new Promise((resolve, reject) => {
        const deadline = Date.now() + 25000;
        const timer = setInterval(() => {
          if (typeof window.HoloCard !== 'undefined' && document.querySelectorAll('.card-tile').length >= 6) {
            clearInterval(timer);
            resolve(true);
          } else if (Date.now() > deadline) {
            clearInterval(timer);
            reject(new Error('Timed out waiting for HoloCard and .card-tile on browse.html'));
          }
        }, 100);
      })`);

      // Scroll first row of cards into view and wait for images
      await browser.evaluate(`new Promise((resolve) => {
        const tile = document.querySelector('.card-tile');
        if (tile) tile.scrollIntoView({ block: 'center' });
        const deadline = Date.now() + 8000;
        const timer = setInterval(() => {
          const imgs = Array.from(document.querySelectorAll('.card-tile img')).slice(0, 3);
          if ((imgs.length > 0 && imgs.every(i => i.complete && i.naturalWidth > 0)) || Date.now() > deadline) {
            clearInterval(timer);
            resolve(true);
          }
        }, 150);
      })`);
      await new Promise(r => setTimeout(r, 200));

      // Scenario 1: Cursor outside every card -> zero active instances, zero canvases
      const s1 = await browser.evaluate(`({
        activeCount: HoloCard.getActiveCount(),
        activeNodes: document.querySelectorAll('.holo-card--active, [data-holo-active]').length,
        holoCanvases: document.querySelectorAll('.holo-card__canvas-overlay').length
      })`);
      assert.equal(s1.activeCount, 0, 'Scenario 1: No card active when cursor is outside');
      assert.equal(s1.activeNodes, 0, 'Scenario 1: No .holo-card--active nodes');
      assert.equal(s1.holoCanvases, 0, 'Scenario 1: No idle WebGL canvases');

      await browser.captureScreenshot(path.join(REPORT_DIR, '01_collection_normal.png'));

      // Scenario 2: Cursor over center of Card A's artwork (.tile-art)
      const s2 = await browser.evaluate(`(async () => {
        const tiles = document.querySelectorAll('.card-tile');
        const artA = tiles[0].querySelector('.tile-art');
        const artB = tiles[1].querySelector('.tile-art');
        const imgA = artA.querySelector('img');
        const r = imgA.getBoundingClientRect();
        const cx = r.left + r.width * 0.5;
        const cy = r.top + r.height * 0.5;
        artA.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false, clientX: cx, clientY: cy, pointerType: 'mouse' }));
        artA.dispatchEvent(new PointerEvent('pointermove', { bubbles: false, clientX: cx + 12, clientY: cy - 10, pointerType: 'mouse' }));
        await new Promise(res => setTimeout(res, 220));
        return {
          activeCount: HoloCard.getActiveCount(),
          aActive: HoloCard.getInstance(artA)?.isActive(),
          bActive: HoloCard.getInstance(artB)?.isActive(),
          aHasCanvas: Boolean(artA.querySelector('.holo-card__canvas-overlay')),
          bHasCanvas: Boolean(artB.querySelector('.holo-card__canvas-overlay')),
          rotX: artA.style.getPropertyValue('--holo-tilt-x'),
          rotY: artA.style.getPropertyValue('--holo-tilt-y')
        };
      })()`);
      assert.equal(s2.activeCount, 1, 'Scenario 2: Only 1 card active');
      assert.equal(s2.aActive, true, 'Scenario 2: Card A artwork is active');
      assert.equal(s2.bActive, false, 'Scenario 2: Neighbor Card B remains inactive');
      assert.equal(s2.aHasCanvas, true, 'Scenario 2: Card A mounts lazy HoloCard canvas');
      assert.equal(s2.bHasCanvas, false, 'Scenario 2: Card B has no canvas');

      await browser.captureScreenshot(path.join(REPORT_DIR, '02_collection_artwork_hovered.png'));

      // Scenario 3: Cursor over artwork inner edge
      const s3 = await browser.evaluate(`(async () => {
        const artA = document.querySelector('.card-tile .tile-art');
        const imgA = artA.querySelector('img');
        const r = imgA.getBoundingClientRect();
        const ex = r.left + 4;
        const ey = r.top + r.height - 4;
        artA.dispatchEvent(new PointerEvent('pointermove', { bubbles: false, clientX: ex, clientY: ey, pointerType: 'mouse' }));
        await new Promise(res => setTimeout(res, 120));
        return HoloCard.getInstance(artA)?.isActive();
      })()`);
      assert.equal(s3, true, 'Scenario 3: Artwork edge keeps HoloCard active');

      // Scenario 4 & 5: Cursor over .tile-info, .tile-cost, and .btn-add-deck MUST NOT activate
      const s45 = await browser.evaluate(`(async () => {
        const tile = document.querySelector('.card-tile');
        const artA = tile.querySelector('.tile-art');
        artA.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, pointerType: 'mouse' }));
        await new Promise(res => setTimeout(res, 450));

        const info = tile.querySelector('.tile-info');
        const infoRect = info.getBoundingClientRect();
        artA.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false, clientX: infoRect.left + 10, clientY: infoRect.top + 10, pointerType: 'mouse' }));
        const infoActive = HoloCard.getActiveCount();

        const costBadge = tile.querySelector('.tile-cost');
        const costRect = costBadge.getBoundingClientRect();
        costBadge.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, clientX: costRect.left + 4, clientY: costRect.top + 4, pointerType: 'mouse' }));
        const costActive = HoloCard.getActiveCount();

        const addBtn = tile.querySelector('.btn-add-deck');
        const btnRect = addBtn.getBoundingClientRect();
        addBtn.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, clientX: btnRect.left + 10, clientY: btnRect.top + 10, pointerType: 'mouse' }));
        const btnActive = HoloCard.getActiveCount();

        // Functional click check: clicking Add to Deck must still add the card!
        addBtn.click();
        await new Promise(res => setTimeout(res, 100));
        const hasRemoveCtrl = Boolean(tile.querySelector('.browse-tile-deck-ctrls'));

        return { infoActive, costActive, btnActive, hasRemoveCtrl };
      })()`);
      assert.equal(s45.infoActive, 0, 'Scenario 4: Hovering .tile-info must NOT activate HoloCard');
      assert.equal(s45.costActive, 0, 'Scenario 5: Hovering .tile-cost badge must NOT activate HoloCard');
      assert.equal(s45.btnActive, 0, 'Scenario 5: Hovering Add to Deck must NOT activate HoloCard');
      assert.equal(s45.hasRemoveCtrl, true, 'Scenario 5/8: Add to Deck click interaction must work normally');

      await browser.captureScreenshot(path.join(REPORT_DIR, '03_collection_info_not_hovered.png'));

      // Scenario 6 & 7: Move from Card A -> Card B -> Card C -> exit, verify isolation and full disposal
      const s67 = await browser.evaluate(`(async () => {
        const tiles = document.querySelectorAll('.card-tile');
        const arts = [tiles[0].querySelector('.tile-art'), tiles[1].querySelector('.tile-art'), tiles[2].querySelector('.tile-art')];
        for (let i = 0; i < arts.length; i++) {
          const r = arts[i].querySelector('img').getBoundingClientRect();
          arts[i].dispatchEvent(new PointerEvent('pointerenter', { bubbles: false, clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.5, pointerType: 'mouse' }));
          await new Promise(res => setTimeout(res, 60));
          if (i > 0) arts[i - 1].dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, pointerType: 'mouse' }));
        }
        await new Promise(res => setTimeout(res, 150));
        const midState = {
          cActive: HoloCard.getInstance(arts[2])?.isActive(),
          aActive: HoloCard.getInstance(arts[0])?.isActive(),
          bActive: HoloCard.getInstance(arts[1])?.isActive()
        };
        arts[2].dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, pointerType: 'mouse' }));
        const deadline = Date.now() + 2000;
        while (Date.now() < deadline && document.querySelectorAll('.holo-card__canvas-overlay').length > 0) {
          await new Promise(res => setTimeout(res, 60));
        }
        return {
          ...midState,
          settledActiveCount: HoloCard.getActiveCount(),
          settledCanvases: document.querySelectorAll('.holo-card__canvas-overlay').length
        };
      })()`);
      assert.equal(s67.cActive, true, 'Scenario 6: Card C is active');
      assert.equal(s67.aActive, false, 'Scenario 6: Card A deactivated');
      assert.equal(s67.bActive, false, 'Scenario 6: Card B deactivated');
      assert.equal(s67.settledActiveCount, 0, 'Scenario 7: Zero active instances after pointer leaves');
      assert.equal(s67.settledCanvases, 0, 'Scenario 7: All WebGL canvases disposed after settling');

      // Scenario 8, 9 & 10: Scroll + Filter while hovered -> dynamically rendered cards attach HoloCard cleanly
      const s8910 = await browser.evaluate(`(async () => {
        window.scrollBy(0, 120);
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = 'Dragon';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        await new Promise(res => setTimeout(res, 600));
        const filteredArt = document.querySelector('.card-tile .tile-art');
        if (!filteredArt) return { hasFiltered: false };
        filteredArt.scrollIntoView({ block: 'center' });
        await new Promise(res => setTimeout(res, 120));
        const r = (filteredArt.querySelector('img') || filteredArt).getBoundingClientRect();
        filteredArt.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false, clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.5, pointerType: 'mouse' }));
        await new Promise(res => setTimeout(res, 180));
        const activeOnFiltered = HoloCard.getInstance(filteredArt)?.isActive();
        filteredArt.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, pointerType: 'mouse' }));
        await new Promise(res => setTimeout(res, 450));
        return { hasFiltered: true, activeOnFiltered };
      })()`);
      assert.equal(s8910.hasFiltered, true, 'Scenario 9/10: Filtering renders cards');
      assert.equal(s8910.activeOnFiltered, true, 'Scenario 10: Dynamically filtered cards activate HoloCard on hover');

      // Scenario 11: WebGL unavailable graceful fallback
      const s11 = await browser.evaluate(`(async () => {
        const origGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function () { return null; };
        try {
          const freshDiv = document.createElement('div');
          freshDiv.className = 'tile-art';
          freshDiv.style.width = '180px';
          freshDiv.style.height = '250px';
          freshDiv.innerHTML = '<img src="./assets/card_back.png" alt="test" />';
          document.body.appendChild(freshDiv);
          await new Promise(res => setTimeout(res, 80));
          const r = freshDiv.getBoundingClientRect();
          freshDiv.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false, clientX: r.left + 40, clientY: r.top + 40, pointerType: 'mouse' }));
          await new Promise(res => setTimeout(res, 100));
          const st = HoloCard.getInstance(freshDiv)?.getState();
          freshDiv.remove();
          return st;
        } finally {
          HTMLCanvasElement.prototype.getContext = origGetContext;
        }
      })()`);
      assert.equal(s11.webglUnavailable, true, 'Scenario 11: Detects WebGL unavailable gracefully without crashing');
      assert.equal(s11.hasCanvas, false, 'Scenario 11: No broken canvas left in DOM when WebGL unavailable');

      // Scenario 12: Reduced-motion media query check in CSS & runtime
      const s12 = await browser.evaluate(`(() => {
        const rules = [];
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.conditionText && rule.conditionText.includes('prefers-reduced-motion')) {
                rules.push(rule.cssText);
              }
            }
          } catch {}
        }
        return rules.length > 0;
      })()`);
      assert.equal(s12, true, 'Scenario 12: prefers-reduced-motion CSS rule must be present');

      // Also capture Card Modal HoloCard hover screenshot
      await browser.evaluate(`(async () => {
        const tile = document.querySelector('.card-tile');
        if (tile && typeof openCardDetail === 'function') {
          await openCardDetail(tile.dataset.name);
          await new Promise(res => setTimeout(res, 400));
          const stage = document.getElementById('modalArtStage');
          const img = document.getElementById('modalArt');
          const r = img.getBoundingClientRect();
          stage.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false, clientX: r.left + r.width * 0.72, clientY: r.top + r.height * 0.28, pointerType: 'mouse' }));
          stage.dispatchEvent(new PointerEvent('pointermove', { bubbles: false, clientX: r.left + r.width * 0.72, clientY: r.top + r.height * 0.28, pointerType: 'mouse' }));
          await new Promise(res => setTimeout(res, 250));
        }
      })()`);
      await browser.captureScreenshot(path.join(REPORT_DIR, '04_modal_holo_hovered.png'));

      assert.equal(browser.exceptions.length, 0, `Expected zero browser exceptions, got: ${JSON.stringify(browser.exceptions)}`);
    } finally {
      await browser.close();
    }
  });
});
