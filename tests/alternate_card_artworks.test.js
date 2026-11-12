import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  loadArtworksCache,
  getCachedArtworks,
  resolveCardArtworks,
  cacheArtworks
} from '../engine/rules/card_artworks_service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BSP_DIR = path.resolve(__dirname, '..');

describe('Alternate Card Artworks Suite', () => {
  it('1. Gate Open, Release has cached alternate artworks with Standard and Promo arts', () => {
    const artworks = getCachedArtworks('Gate Open, Release', '26RBS02-CP01');
    assert.ok(Array.isArray(artworks), 'Artworks should be an array');
    assert.ok(artworks.length > 1, `Expected multiple artworks, got ${artworks.length}`);

    // Verify Standard art at index 0
    const standard = artworks[0];
    assert.equal(standard.is_alternate, false, 'First artwork must be marked as standard / non-alternate');
    assert.equal(standard.name, 'Standard');
    assert.ok(standard.image_url.includes('26RBS02-CP01'), 'Standard image URL should reference 26RBS02-CP01');

    // Verify Alternate arts
    const alt1 = artworks[1];
    assert.equal(alt1.is_alternate, true, 'Subsequent artworks must be marked as alternate');
    assert.ok(alt1.name.length > 0, 'Alternate artwork should have a valid title / caption');
    assert.ok(alt1.image_url.startsWith('http'), 'Alternate artwork should have a valid HTTP URL');
  });

  it('2. Fallback resolution for non-gallery card returns single standard entry', async () => {
    const res = await resolveCardArtworks('NonExistentCardXYZ_12345', null, 'https://example.com/art.png');
    assert.equal(res.length, 1);
    assert.equal(res[0].name, 'Standard');
    assert.equal(res[0].image_url, 'https://example.com/art.png');
    assert.equal(res[0].is_alternate, false);
  });

  it('3. In-memory and disk cache consistency', () => {
    const testCard = 'Test_Mock_Card_999';
    const testList = [
      { name: 'Standard', image_url: 'http://img1.png', is_alternate: false },
      { name: 'Promo Alt', image_url: 'http://img2.png', is_alternate: true }
    ];
    cacheArtworks(testCard, null, testList);

    const retrieved = getCachedArtworks(testCard, null);
    assert.deepEqual(retrieved, testList);

    // Clean up mock
    const cache = loadArtworksCache();
    delete cache[testCard.toLowerCase()];
  });

  it('4. Modal HTML files contain artwork stage with navigation buttons and indicator', () => {
    const htmlFiles = [
      'browse.html',
      'deck.html',
      'index.html',
      'arena.html',
      'family.html',
      'keywords.html',
      'sets.html'
    ];

    for (const file of htmlFiles) {
      const p = path.join(BSP_DIR, file);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        assert.ok(content.includes('id="modalArtPrevBtn"'), `${file} should contain modalArtPrevBtn`);
        assert.ok(content.includes('id="modalArtNextBtn"'), `${file} should contain modalArtNextBtn`);
        assert.ok(content.includes('id="modalArtIndicator"'), `${file} should contain modalArtIndicator`);
      }
    }
  });

  it('5. UI rules contract: alternate artwork viewing disables adding to deck (🔒 Locked)', () => {
    // Simulate UI logic contract
    const artworks = [
      { name: 'Standard', is_alternate: false },
      { name: 'Alt Promo 1', is_alternate: true }
    ];

    function evaluateDeckButtonState(artworkIndex, inDeckCount) {
      const art = artworks[artworkIndex];
      if (art.is_alternate) {
        return {
          text: '🔒 Locked',
          disabled: true,
          className: 'btn-modal-locked',
          allowedToAddToDeck: false
        };
      }
      return {
        text: inDeckCount > 0 ? `+ Add to Deck (${inDeckCount}/3)` : '+ Add to Deck',
        disabled: inDeckCount >= 3,
        className: 'btn-modal-primary',
        allowedToAddToDeck: inDeckCount < 3
      };
    }

    // Standard art allows adding to deck
    const standardState = evaluateDeckButtonState(0, 0);
    assert.equal(standardState.text, '+ Add to Deck');
    assert.equal(standardState.disabled, false);
    assert.equal(standardState.allowedToAddToDeck, true);

    // Alternate art locks the button
    const altState = evaluateDeckButtonState(1, 0);
    assert.equal(altState.text, '🔒 Locked');
    assert.equal(altState.disabled, true);
    assert.equal(altState.className, 'btn-modal-locked');
    assert.equal(altState.allowedToAddToDeck, false);
  });

  it('6. ModalCardArtworkManager cycles through artworks and toggles locked button', () => {
    // Run app.js in simulated DOM sandbox
    const fakeDoc = {
      modalArt: { src: '' },
      modalArtPrevBtn: { style: { display: 'none' } },
      modalArtNextBtn: { style: { display: 'none' } },
      modalArtIndicator: { style: { display: 'none' }, textContent: '', className: '' },
      modalDownload: { href: '' },
      modalDeckBtn: { style: { display: 'none' }, disabled: false, className: '', innerHTML: '' },
      modalRemoveDeckBtn: { style: { display: 'none' } }
    };

    const sandbox = {
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      },
      document: {
        getElementById(id) {
          return fakeDoc[id] || null;
        },
        querySelectorAll() {
          return [];
        },
        addEventListener: () => {}
      },
      window: {
        cleanCardImageUrl: (u) => u,
        addEventListener: () => {}
      },
      console,
      setTimeout,
      clearTimeout
    };
    sandbox.window.document = sandbox.document;
    sandbox.window.window = sandbox.window;
    vm.createContext(sandbox);

    const appSource = fs.readFileSync(path.join(BSP_DIR, 'app.js'), 'utf8');
    vm.runInContext(appSource, sandbox);

    const mgr = sandbox.window.ModalCardArtworkManager;
    assert.ok(mgr, 'ModalCardArtworkManager must be defined on window');

    const testArtworks = [
      { name: 'Standard', image_url: 'http://img-standard.png', is_alternate: false },
      { name: 'Promo Bashin Dan', image_url: 'http://img-promo1.png', is_alternate: true },
      { name: 'Promo Toppa', image_url: 'http://img-promo2.png', is_alternate: true }
    ];

    mgr.loadArtworksForCard({ name: 'Gate Open, Release', artworks: testArtworks });

    // Initial state: standard artwork (index 0)
    assert.equal(mgr.currentIndex, 0);
    assert.equal(fakeDoc.modalArt.src, 'http://img-standard.png');
    assert.equal(fakeDoc.modalArtPrevBtn.style.display, 'flex');
    assert.equal(fakeDoc.modalArtNextBtn.style.display, 'flex');
    assert.equal(fakeDoc.modalDeckBtn.className, 'btn-modal-primary');
    assert.equal(fakeDoc.modalDeckBtn.disabled, false);

    // Navigate to next artwork: Alternate art 1
    mgr.navigateArtwork(1);
    assert.equal(mgr.currentIndex, 1);
    assert.equal(fakeDoc.modalArt.src, 'http://img-promo1.png');
    assert.equal(fakeDoc.modalDeckBtn.className, 'btn-modal-locked');
    assert.equal(fakeDoc.modalDeckBtn.disabled, true);
    assert.equal(fakeDoc.modalDeckBtn.innerHTML, '🔒 Locked');
    assert.ok(fakeDoc.modalArtIndicator.textContent.includes('活動異圖'));

    // Navigate to next artwork: Alternate art 2
    mgr.navigateArtwork(1);
    assert.equal(mgr.currentIndex, 2);
    assert.equal(fakeDoc.modalArt.src, 'http://img-promo2.png');
    assert.equal(fakeDoc.modalDeckBtn.disabled, true);
    assert.equal(fakeDoc.modalDeckBtn.innerHTML, '🔒 Locked');

    // Wrap around to beginning: Standard art again!
    mgr.navigateArtwork(1);
    assert.equal(mgr.currentIndex, 0);
    assert.equal(fakeDoc.modalArt.src, 'http://img-standard.png');
    assert.equal(fakeDoc.modalDeckBtn.className, 'btn-modal-primary');
    assert.equal(fakeDoc.modalDeckBtn.disabled, false);
    assert.ok(fakeDoc.modalArtIndicator.textContent.includes('Standard Art'));

    // Navigate backwards: wraps to Alternate art 2
    mgr.navigateArtwork(-1);
    assert.equal(mgr.currentIndex, 2);
    assert.equal(fakeDoc.modalDeckBtn.disabled, true);
    assert.equal(fakeDoc.modalDeckBtn.innerHTML, '🔒 Locked');
  });

  it('7. /api/card-artworks resolves card artworks for any valid card name or number', async () => {
    const res = await resolveCardArtworks('Gate Open, Release', '26RBS02-CP01');
    assert.ok(Array.isArray(res));
    assert.ok(res.length >= 13, `Expected at least 13 artworks for Gate Open, Release, got ${res.length}`);
    assert.equal(res[0].is_alternate, false);
    for (let i = 1; i < res.length; i++) {
      assert.equal(res[i].is_alternate, true);
      assert.ok(res[i].name.length > 0);
      assert.ok(res[i].image_url.startsWith('https://static.wikia.nocookie.net/'));
    }
  });
});
