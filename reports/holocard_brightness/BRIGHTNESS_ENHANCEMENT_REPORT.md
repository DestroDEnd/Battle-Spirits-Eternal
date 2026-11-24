# HoloCard Subtle Brightness & Vibrancy Enhancement Report

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Date:** 2026-11-24  

---

## 1. Objective

Enhance the holographic overlay brightness (~15–20%), colour saturation, star glints, rainbow/prism reflections, and edge highlights in `<HoloCard />` while keeping original card artwork untouched, avoiding any global CSS brightness filter or silver/chrome wash, preserving readable card text/stats/costs, and maintaining exact-hover-only activation.

---

## 2. Exact Shader & Rendering Parameters Changed

Modified files:
- `holo_card.js`
- `components/HoloCard/HoloCard.jsx`

### 2.1 `DEFAULT_HOVER_OPTIONS` (`holo_card.js`)
| Parameter | Before | After | Change | Purpose |
|---|---:|---:|---:|---|
| `intensity` | `0.48` | `0.57` | +18.8% | Brighter holographic foil reflections |
| `edgeSparkle` | `0.42` | `0.50` | +19.0% | More visible border edge sparkles |
| `glare` | `0.28` | `0.33` | +17.9% | Clearer specular highlight without washing out artwork |

### 2.2 GLSL Fragment Shader (`holo_card.js` & `components/HoloCard/HoloCard.jsx`)
| Shader Expression | Before | After | Purpose |
|---|---|---|---|
| `tint` saturation boost | Raw `hue(phase)` | `tintLum = dot(tint, vec3(0.2126, 0.7152, 0.0722)); tint = clamp(mix(vec3(tintLum), tint, 1.18), 0.0, 1.0);` | +18% holographic colour saturation |
| Non-layered `foil` white mix | `mix(tint, vec3(1.0), 0.12)` | `mix(tint, vec3(1.0), 0.06)` | Richer rainbow/prism colour instead of white wash |
| `foil` multiplier | `1.15 + 0.3 * sheen` | `1.28 + 0.36 * sheen` | Brighter coloured foil response |
| Star `glint` exponent & scale | `pow(..., 24.0)` & `1.2` | `pow(..., 20.0)` & `1.48` | More visible star glints and facet highlights |
| `frameSheen` | `uFoil * sheen * 0.12 * frame * uActive` | `uFoil * sheen * 0.16 * frame * uActive` | Subtle edge highlight enhancement |
| `glareTerm` | `vec3(sheen * 0.07 + shine * 0.3) * uGlare * uActive` | `vec3(sheen * 0.08 + shine * 0.36) * uGlare * uActive` | Stronger specular sheen & pinpoint shine |
| `uOverlayOnly` `holoLight` (`holo_card.js`) | `foil * ... * 0.75 + sparkleTerm * 0.85` | `foil * ... * 0.88 + sparkleTerm * 1.0` | ~17% brighter overlay on cross-origin card images |
| `uOverlayOnly` `outAlpha` (`holo_card.js`) | `clamp(lum * 0.92, 0.0, 0.72) * alpha * uActive` | `clamp(lum * 1.02, 0.0, 0.78) * alpha * uActive` | Improved overlay visibility while preserving artwork |

### 2.3 Preserved Invariants
- `uActive` continues to multiply `strength`, `sparkleTerm`, `frameSheen`, `glareTerm`, and `outAlpha`, guaranteeing zero holographic output when unhovered (`idle = false`).
- Zero CSS `filter: brightness(...)` applied to cards or artwork.
- Pointer tracking, spring physics (`tiltMax: 7`, `hoverScale: 1.02`), and card layout/dimensions remain unchanged.

---

## 3. Verification Across Card Colours & Regression Suite

- **Test Command:**
  ```powershell
  cd C:\Users\namis\Downloads\BSP; node --check holo_card.js; node --test tests/holocard_integration.test.js tests/arena_ui_and_timer.test.js tests/phase_m3_3_static_asset_security.test.js
  ```
- **Results:** `11/11` passed (`0` failures):
  - `tests/arena_ui_and_timer.test.js`: 6/6 PASS
  - `tests/holocard_integration.test.js`: 2/2 PASS (12-scenario hover isolation, dynamic filtering, deck add/remove, modal hover, WebGL disposal)
  - `tests/phase_m3_3_static_asset_security.test.js`: 1/1 PASS

---

## 4. Before & After Screenshots

- **Collection & Modal (Before/After):**
  - `reports/holocard_integration/02_collection_artwork_hovered.png`
  - `reports/holocard_integration/04_modal_holo_hovered.png`
- **6 Card Colours Tested (After Enhancement):**
  - Red: `reports/holocard_brightness/after_red.png`
  - Blue: `reports/holocard_brightness/after_blue.png`
  - Green: `reports/holocard_brightness/after_green.png`
  - Purple: `reports/holocard_brightness/after_purple.png`
  - Yellow: `reports/holocard_brightness/after_yellow.png`
  - White: `reports/holocard_brightness/after_white.png`
