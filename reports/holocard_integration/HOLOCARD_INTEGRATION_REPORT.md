# HoloCard Integration & Precise Hover Activation Report

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Date:** 2026-11-24  

---

## 1. Executive Summary

Replaced the previous silver/`ReflectiveCard` hover effect across the Battle Spirits Eternal card collection, deck builder, modal inspector, and arena interfaces with the supplied React Bits **`<HoloCard />`** WebGL2 holographic component (`components/HoloCard/HoloCard.jsx`, `components/HoloCard/HoloCard.css`) and its vanilla browser runtime (`holo_card.js`).

Hover activation is strictly scoped to **individual card artwork boundaries** (`<img>` rect inside card artwork containers) and never triggers on card metadata, cost badges, deck action buttons, empty grid space, or neighbouring cards.

---

## 2. Old Silver Effect Removal

- **Deleted files:**
  - `reflective_card.js`
  - `components/ReflectiveCard/`
  - `tests/reflective_card_integration.test.js`
- **Removed CSS:**
  - `.card-foil-sheen`, `.modal-foil-sheen`, `.rc-hover-overlay`, `.rc-hover-*`, `.reflective-card*`, and parent `:hover` artwork zoom/scale rules in `styles.css`.
- **Removed DOM & JS:**
  - `<div class="card-foil-sheen"></div>` from `index.html`.
  - Orphaned `.modal-foil-sheen` / `#modalArt` tilt handler from `app.js`; `initCardFoilTilt()` now delegates cleanly to `window.HoloCard.initCollectionHolo()`.
- **Updated HTML pages:**
  - `arena.html`, `browse.html`, `deck.html`, `deck_view.html`, `index.html`, `sets.html`, `family.html`, `keywords.html` now load `./holo_card.js?v=8.0`.

---

## 3. HoloCard Component & Runtime Architecture

- **React Component (`components/HoloCard/`):**
  - Integrated the full supplied `HoloCard.jsx`, `HoloCard.css`, and `index.js`.
  - Set `idle = false` by default and added `uniform float uActive;` to the fragment shader so foil intensity, edge sparkle, border sheen, and glare are strictly `0.0` when inactive.
- **Browser Runtime (`holo_card.js`):**
  - Attaches independent per-artwork instances (`WeakMap`) to `.tile-art, .tile-img-box, .card-art-wrap, .sample-card-art-wrap, .hc-img-wrap, .fsc-img-wrap, .inspector-art-wrap, #modalArtStage`.
  - Excludes interactive/metadata sub-elements (`.tile-cost`, `.tile-deck-count-pill`, `.tile-colors`, `.tile-hover-actions`, `.hc-cost-badge`, `.hc-zoom-btn`, `.hc-partner-badge`, `.hc-advent-badge`, `.fsc-zoom-btn`, `.fsc-drag-handle`, `.modal-art-nav-btn`, `.modal-art-indicator`, `button`, `a`).
  - Default hover tuning: `preset: 'stars'`, `idle: false`, `intensity: 0.48`, `edgeSparkle: 0.42`, `glare: 0.28`, `tiltMax: 7`, `hoverScale: 1.02`, `frame: 3`, `foilColor: '#d8dee9'`.
  - Cross-origin artwork support: when `texImage2D` fails due to CORS on external card images, switches to `uOverlayOnly = 1.0` (`mix-blend-mode: screen`) so original card artwork remains 100% visible underneath the holographic overlay.
  - Respects `prefers-reduced-motion: reduce` (disables 3D tilt/scale while retaining subtle non-motion highlight) and falls back gracefully when WebGL2 is unavailable.

---

## 4. 12-Scenario Hover Isolation Verification

Verified in real headless Chromium (`tests/holocard_integration.test.js`):

1. **Page load (unhovered):** Zero active HoloCard instances, zero WebGL canvases mounted.
2. **Artwork center hover (Card A):** Only Card A mounts a lazy WebGL2 canvas (`isActive() === true`); Card B remains unmounted/inactive.
3. **Artwork inner edge hover:** Remains active inside `<img>` bounds.
4. **Metadata area (`.tile-info`) hover:** `HoloCard.getActiveCount() === 0` (no activation).
5. **Cost badge (`.tile-cost`) & Add to Deck (`.btn-add-deck`) hover + click:** Zero HoloCard activation; clicking `Add to Deck` adds the card to the deck normally.
6. **Card A -> Card B -> Card C transition:** Only the currently hovered card is active; previous cards deactivate cleanly.
7. **Pointer exit to empty space:** Active count drops to `0` and all WebGL2 canvases are disposed after settling.
8. **Functional Add/Remove Deck controls:** Verified intact on tile and in modal.
9. **Search & filter (`Dragon`):** Grid filtering renders matching cards without errors.
10. **Dynamic card attachment:** Newly rendered filtered cards attach HoloCard automatically via `MutationObserver` and activate on artwork hover.
11. **WebGL2 unavailable fallback:** Gracefully marks `webglUnavailable: true` without throwing exceptions or hiding card artwork.
12. **Modal stage (`#modalArtStage`) hover:** Clicking a card opens the detail modal; hovering `#modalArtStage` activates HoloCard cleanly.

---

## 5. Performance Observations

- **Lazy WebGL2 creation:** Zero WebGL contexts or canvases exist on initial load or for unhovered cards.
- **Stationary RAF pause:** While the pointer is stationary inside artwork (`calm > 0.35 && state.active === 1`), `requestAnimationFrame` pauses until the next `pointermove` or `pointerleave`.
- **Full disposal on settle:** After `pointerleave` and spring settle, `loseContext` / buffer / texture / program cleanup runs and removes the `.holo-card__canvas-overlay` node from the DOM.

---

## 6. Test & Regression Results

Command executed after final edits:
```powershell
cd C:\Users\namis\Downloads\BSP; node --test tests/holocard_integration.test.js tests/arena_ui_and_timer.test.js tests/phase_m3_3_static_asset_security.test.js
```

| Suite | Result |
|---|---|
| `tests/arena_ui_and_timer.test.js` | 6/6 PASS |
| `tests/holocard_integration.test.js` | 2/2 PASS (Subtests A & B, 12 scenarios) |
| `tests/phase_m3_3_static_asset_security.test.js` | 1/1 PASS |
| **Total** | **11/11 tests & subtests PASS (0 failures)** |

---

## 7. Visual Evidence (Screenshots)

- `reports/holocard_integration/01_collection_normal.png` — Normal unhovered collection grid (original artwork, zero silver wash).
- `reports/holocard_integration/02_collection_artwork_hovered.png` — Card A artwork hovered (holographic stars & sheen on Card A only; Card B & C untouched).
- `reports/holocard_integration/03_collection_info_not_hovered.png` — Hovering `.tile-info` / `.btn-add-deck` (no HoloCard activation; deck add toast confirmed).
- `reports/holocard_integration/04_modal_holo_hovered.png` — Card detail modal `#modalArtStage` hovered with HoloCard active.
