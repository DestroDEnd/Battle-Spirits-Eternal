# BSP — ReflectiveCard Visual Correction Report

**Date:** 2026-11-24  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Status:** Verified & Complete  

---

## 1. Original Integration Defect Analysis

The initial `<ReflectiveCard />` hover integration rendered Battle Spirits cards as predominantly grey/silver metallic surfaces on hover due to five compounding defects:

1. **Opaque Monochrome Plate Shader (`PLATE`):**
   - `PLATE` rendered `fragColor = vec4(color * coverage, coverage)` with `alpha = 1.0` across the entire card surface.
   - When cross-origin card artwork (Fandom/Wikia) could not be uploaded to WebGL2 (`uCapture == 0`), `scene` fell back to `room(q, sigma)` — a monochrome studio grey gradient (`0.85` to `0.12`), which after sRGB gamma encoding (`pow(0.0475, 1/2.2) ≈ 0.25`) painted a 25%–63% opaque grey/silver sheet over the card even under `mix-blend-mode: screen`.
2. **Aggressive Metallic Defaults:**
   - `grayscale: 0.35`, `metalness: 1`, `roughness: 0.28`, `blurStrength: 6`, `shine: 1.05`, `glare: 0.65`, `warp: 0.6`, `bevel: 3`, and `tiltStrength: 12` produced a heavy metallic wash and aggressive 12° tilt rather than a subtle trading-card foil reflection.
3. **Washed-Out Near-White Tints:**
   - `REALM_TINTS` used near-white pastels (`#ffe4e6`, `#f3e8ff`, `#dcfce7`, `#fef9c3`, `#e0f2fe`), stripping almost all colour identity from the reflection.
4. **Missing Multi-Colour & Browse Colour Resolution:**
   - `browse.html` renders card colours via `<span class="color-dot color-dot-<Color>">` children rather than container class names, so `resolveCardTint` missed card colours in the card browser and failed to represent multi-colour cards.

---

## 2. Changed-File Inventory

| File | Change Summary |
|---|---|
| [reflective_card.js](file:///C:/Users/namis/Downloads/BSP/reflective_card.js) | Added transparent `HOVER_PLATE` WebGL2 shader (`renderHoverPlate`), replaced `REALM_TINTS`/`resolveCardTint` with `REALM_ACCENTS`/`resolveCardColors` (supporting mono and multi-colour cards across all views), updated `initCardHover` to card-oriented material parameters, and synced `--rc-tint-rgb` / `--rc-tint2-rgb` onto `.rc-hover-overlay`. |
| [styles.css](file:///C:/Users/namis/Downloads/BSP/styles.css#L13792-L13817) | Updated `.rc-hover-overlay[data-rc-fallback="1"]::before` and `.rc-hover-overlay > .reflective-card__rim` to use card-specific `--rc-tint-rgb` / `--rc-tint2-rgb` accents instead of stark white/grey. |
| [tests/reflective_card_integration.test.js](file:///C:/Users/namis/Downloads/BSP/tests/reflective_card_integration.test.js) | Added assertions for `HOVER_PLATE` and `resolveCardColors`, and tightened `pointerout` detach verification under headless Chrome. |
| `reports/reflective_card_correction/` | Added verification screenshots (`01_browse_normal.png` – `05_arena_hand_hovered.png`), `verification_results.json`, and this report. |

*(Canonical React component files under [components/ReflectiveCard/](file:///C:/Users/namis/Downloads/BSP/components/ReflectiveCard/ReflectiveCard.jsx) and authoritative game engine / card-effect resolution files were left untouched.)*

---

## 3. Final Reflective Parameter Configuration

`ReflectiveCard.initCardHover()` now uses the card-oriented configuration:

| Parameter | Previous Value | Corrected Value | Purpose |
|---|---|---|---|
| `grayscale` | `0.35` | **`0.15`** | Preserves rich card-specific and subtle prismatic hue |
| `metalness` | `1` | **`0.4`** | Restrains metallic wash while retaining crisp specular response |
| `roughness` | `0.28` | **`0.5`** | Soft, brushed trading-card foil grain |
| `blurStrength` | `6` | **`3`** | Tighter, cleaner specular highlight |
| `shine` | `1.05` | **`0.65`** | Restrained diagonal holographic sheen |
| `glare` | `0.65` | **`0.3`** | Soft cursor-following coloured light |
| `warp` | `0.6` | **`0.2`** | Subtle surface undulation |
| `warpScale` | `1` | **`1`** | Natural bend frequency |
| `bevel` | `3` | **`2`** | Fine edge catchlight along card border |
| `tiltStrength` | `12` | **`5`** | Gentle 5° max 3D hover tilt |

### Card-Specific Accent Palette (`REALM_ACCENTS`)
- **Red:** `#ef4444` (subtle crimson)
- **Blue:** `#38bdf8` (subtle azure)
- **White:** `#dbeafe` (subtle silver-white with cool tint)
- **Purple:** `#a855f7` (subtle violet)
- **Yellow:** `#facc15` (subtle golden)
- **Green:** `#22c55e` (subtle emerald)
- **Multi-Colour:** Extracts all canonical colours from `.color-dot` elements, `.card-color-tag` / `.hc-type`, `#modalBadges`, container classes, or global card caches, blending `uTint` and `uTint2` across the card surface.

---

## 4. Rendering & Compositing Explanation

- `HOVER_PLATE` eliminates `room(q, sigma)` studio reflections and opaque background fills completely.
- Unlit regions compute `intensity = 0.0` and output `fragColor = vec4(0.0, 0.0, 0.0, 0.0)` (100% transparent), keeping the underlying `<img>` artwork, frame, typography, cost, BP, and level badges completely unaltered.
- Only active specular terms (`holoSheen`, cursor `glare`, and `chamfer` bevel) contribute alpha (`clamp(intensity * 1.15, 0.0, 0.55) * coverage`), composited over the card via `mix-blend-mode: screen` and smoothly faded in/out with `--rc-hover-opacity`.
- When WebGL2 is unavailable, `.rc-hover-overlay[data-rc-fallback="1"]::before` renders a lightweight CSS radial-gradient coloured glare using `--rc-tint-rgb` and `--rc-tint2-rgb`.

---

## 5. Card-Type & Colour Verification Results

Verified in live headless Chrome against `/api/cards` and rendered DOM tiles (`verification_results.json`):

| Card Name | Card Colour(s) | Card Type | Resolved Primary / Secondary |
|---|---|---|---|
| `Lalyre` | Red | Spirit | `#ef4444` / `#ef4444` |
| `The MedicineSeller Cursor` | Blue | Spirit | `#38bdf8` / `#38bdf8` |
| `The Silver Guardian Blade` | White | Brave | `#dbeafe` / `#dbeafe` |
| `Onigumon` | Purple | Spirit | `#a855f7` / `#a855f7` |
| `Caron Pawn` | Yellow | Spirit | `#facc15` / `#facc15` |
| `ChickenKnight` | Green | Spirit | `#22c55e` / `#22c55e` |
| `The EvilGodKing Deathpeers` | Red/Purple/Green/White/Yellow | Ultimate | `#ef4444` / `#a855f7` (multi-colour) |
| `Flame Tempest` *(Arena hand)* | Red | Magic | `#ef4444` / `#ef4444` |

---

## 6. Performance Observations

- **Single Pooled WebGL2 Context:** On `browse.html` (18 visible card tiles) and `arena.html`, `ReflectiveCard.initCardHover()` maintains exactly **1** pooled overlay `<canvas>` / WebGL2 context (moved onto the hovered card on demand; `canvasCount = 1` on `arena.html`, `2` on `browse.html` including the background `shape_grid` canvas).
- **Zero Idle Render Loops:** `requestAnimationFrame` runs exclusively during active hover movement and pointer-exit settling (`raf = 0` when idle).
- **Zero Exceptions:** `browser.exceptions` remained empty (`[]`) across all browse, modal, and arena interactions.

---

## 7. Visual Verification Screenshots

Captured in `reports/reflective_card_correction/`:
- [01_browse_normal.png](file:///C:/Users/namis/Downloads/BSP/reports/reflective_card_correction/01_browse_normal.png) — Card browser normal state (full artwork intact, no grey sheet).
- [02_browse_hovered.png](file:///C:/Users/namis/Downloads/BSP/reports/reflective_card_correction/02_browse_hovered.png) — Card browser hovered on `The EvilGodKing Deathpeers` (`-1.033deg` / `-1.099deg` gentle tilt, subtle coloured holographic reflection).
- [03_modal_hovered.png](file:///C:/Users/namis/Downloads/BSP/reports/reflective_card_correction/03_modal_hovered.png) — Card inspection modal `#modalArtStage` hovered (crisp artwork & Japanese/English card text).
- [04_arena_normal.png](file:///C:/Users/namis/Downloads/BSP/reports/reflective_card_correction/04_arena_normal.png) — Battle arena hand cards in normal state.
- [05_arena_hand_hovered.png](file:///C:/Users/namis/Downloads/BSP/reports/reflective_card_correction/05_arena_hand_hovered.png) — Battle arena hand card `Flame Tempest` hovered (`-1.708deg` / `-2.579deg` tilt, subtle crimson sheen, badges & cost readable).

---

## 8. Regression Test Results

Executed `node --test tests/reflective_card_integration.test.js tests/arena_ui_and_timer.test.js tests/phase_m3_3_static_asset_security.test.js`:
- `tests/arena_ui_and_timer.test.js`: **6/6 PASS**
- `tests/phase_m3_3_static_asset_security.test.js`: **1/1 PASS**
- `tests/reflective_card_integration.test.js`: **3/3 PASS** (including headless Chrome E2E across `browse.html` and `arena.html`)
- **Total:** **12/12 PASS (100%)**, 0 failures.

---

## 9. Remaining Limitations

1. **Multi-Colour >2 Accents:** Cards with 3–5 colours (e.g., `Red/Purple/Green/White/Yellow`) blend their first two canonical colours (`uTint` and `uTint2`) across the diagonal gradient rather than rendering a 5-stop gradient; this keeps the shader lightweight and restrained.
2. **External Image CORS:** Cross-origin card images served without CORS headers cannot be sampled into a WebGL2 `uEnv` environment texture; the `HOVER_PLATE` shader intentionally avoids sampling external textures and relies on procedural specular/holographic lighting over the DOM `<img>` instead.
