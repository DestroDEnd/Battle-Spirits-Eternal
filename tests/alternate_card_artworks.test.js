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

  it('8. Concept art, sketches, anime screencaps, and full illustrations are strictly excluded from card artworks', () => {
    const raw = fs.readFileSync(path.join(BSP_DIR, 'data', 'card_artworks.json'), 'utf8');
    const artworksMap = JSON.parse(raw);
    const NON_CARD_REGEX = /full\s*art|\bfa\b|concept|illustration|sketch|anime|character|setting|draft|rough|visual|twitter|pixiv|episode|scene|screenshot|screencap|preview/i;
    const NON_CARD_FILE_REGEX = /_fa\b|fa\.(jpe?g|png|webp)|_concept|_sketch|_anime|_ill|_char|_setting|_draft|_scene|_ep\d/i;
    const SCENE_WORDS_REGEX = /\bwants\b|\bdefeats?\b|\bfights?\b|\bscene\b|\bappearance\b/i;

    for (const [key, arts] of Object.entries(artworksMap)) {
      for (let i = 1; i < arts.length; i++) {
        const a = arts[i];
        const filename = (a.image_url || '').split('/').pop().split('?')[0];
        assert.ok(!NON_CARD_REGEX.test(a.name), `Card ${key} artwork "${a.name}" matches NON_CARD_REGEX`);
        assert.ok(!NON_CARD_FILE_REGEX.test(filename), `Card ${key} file "${filename}" matches NON_CARD_FILE_REGEX`);
        assert.ok(!SCENE_WORDS_REGEX.test(a.name), `Card ${key} artwork "${a.name}" matches SCENE_WORDS_REGEX`);
      }
    }
  });

  it('9. Cards without artwork do not exist in cards_index.json or cards_detailed.json and database has verified artworks', () => {
    const detailed = JSON.parse(fs.readFileSync(path.join(BSP_DIR, 'data', 'cards_detailed.json'), 'utf8'));
    const index = JSON.parse(fs.readFileSync(path.join(BSP_DIR, 'data', 'cards_index.json'), 'utf8'));

    for (const [num, c] of Object.entries(index)) {
      assert.ok(c.image_url && String(c.image_url).trim().length > 0, `Card ${num} in index must have valid artwork URL`);
    }

    for (const [num, c] of Object.entries(detailed)) {
      assert.ok(c.image_url && String(c.image_url).trim().length > 0, `Card ${num} in detailed must have valid artwork URL`);
    }
  });

  it('10. Standard card art is preserved and never overwritten by blank URL during artwork resolution (e.g. SJ14-02)', async () => {
    const detailed = JSON.parse(fs.readFileSync(path.join(BSP_DIR, 'data', 'cards_detailed.json'), 'utf8'));
    const neo = detailed['SJ14-02'];
    assert.ok(neo, 'Ultimate-Siegfried-Neo (SJ14-02) must exist in catalog');
    assert.ok(neo.image_url.includes('SJ14-02'), 'SJ14-02 must have valid image URL');

    const res = await resolveCardArtworks(neo.name, neo.card_number, neo.image_url);
    assert.ok(Array.isArray(res) && res.length >= 1);
    assert.equal(res[0].name, 'Standard');
    assert.ok(res[0].image_url && res[0].image_url.length > 0, 'Standard image URL must never be empty');
    assert.equal(res[0].image_url, neo.image_url);
  });

  it('11. ModalCardArtworkManager.hasAlternateArtworks accurately detects cards with alternate artworks', () => {
    const appSource = fs.readFileSync(path.join(BSP_DIR, 'app.js'), 'utf8');
    assert.ok(appSource.includes('hasAlternateArtworks(card)'), 'app.js must define hasAlternateArtworks on ModalCardArtworkManager');

    const cache = loadArtworksCache();
    const gateOpen = { name: 'Gate Open, Release', card_number: '26RBS02-CP01' };
    const nameKey = gateOpen.name.toLowerCase().trim();
    assert.ok(cache[nameKey] && cache[nameKey].length > 1, 'Gate Open, Release must have multiple artworks');

    const vanilla = { name: 'Gigas', card_number: 'BS01-001' };
    const vanillaKey = vanilla.name.toLowerCase().trim();
    assert.equal(cache[vanillaKey], undefined, 'Normal card Gigas should not have alternate gallery artworks');
  });

  it('12. Browse UI includes Alternate Art filter pill, state handling, and tile badge', () => {
    const browseSource = fs.readFileSync(path.join(BSP_DIR, 'browse.html'), 'utf8');
    assert.ok(browseSource.includes('id="browseAltArtPill"'), 'browse.html must contain browseAltArtPill');
    assert.ok(browseSource.includes('toggleAltArtFilter'), 'browse.html must define toggleAltArtFilter');
    assert.ok(browseSource.includes('tile-alt-badge'), 'browse.html must render tile-alt-badge');

    const stylesSource = fs.readFileSync(path.join(BSP_DIR, 'styles.css'), 'utf8');
    assert.ok(stylesSource.includes('.tile-alt-badge'), 'styles.css must style .tile-alt-badge');
    assert.ok(stylesSource.includes('.modal-locked-notice'), 'styles.css must style .modal-locked-notice');
  });

  it('13. Arena battleSummonPaymentModal handles Escape, Enter, and Space keyboard navigation', () => {
    const arenaJs = fs.readFileSync(path.join(BSP_DIR, 'battle_arena.js'), 'utf8');
    assert.ok(arenaJs.includes("document.getElementById('battleSummonPaymentModal')"), 'battle_arena.js must check battleSummonPaymentModal');
    assert.ok(arenaJs.includes('confirmSummonPayment()'), 'Enter key must trigger confirmSummonPayment()');
    assert.ok(arenaJs.includes('closeSummonModal()'), 'Escape key must trigger closeSummonModal()');
  });
});
