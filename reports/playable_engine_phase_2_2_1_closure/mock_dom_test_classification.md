# Mock DOM Test Classification Report (Phase 2.2.1 Closure)

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 2.2.1 Corrective Closure  
**Date:** 2026-11-21  

---

## 1. Background & Defect Resolution

In previous phases, `tests/browser_arena_gameplay.test.js` was described as a "browser gameplay test", but an independent audit revealed that it executed inside a simulated Node.js environment with a mock DOM object and directly manipulated engine properties (e.g., direct splicing of player hands, core values, and life scores).

To ensure complete evidence integrity and avoid misleading classification, the test suite has been strictly bifurcated and accurately classified:

1. **`tests/browser_arena_gameplay.test.js`:**
   - **Classification:** `MOCK_DOM_UNIT`
   - **Environment:** Node.js simulated DOM environment (`global.document` mock).
   - **Scope:** Fast regression testing of UI controller callbacks and DOM manipulation helpers under synthetic conditions.
   - **Status:** Retained for unit-level UI adapter regression.

2. **`tests/real_browser_arena.test.js`:**
   - **Classification:** `REAL_BROWSER_E2E`
   - **Environment:** Genuine Google Chrome process controlled via native Chrome DevTools Protocol (CDP) WebSocket, connected to `server.js` over HTTP.
   - **Scope:** Complete end-to-end match execution, authentic DOM rendering, UI modals, user click interactions, multi-turn progression, and combat life reduction without any state tampering.
   - **Status:** Production E2E browser verification standard.

---

## 2. Comparison Matrix

| Property | `tests/browser_arena_gameplay.test.js` | `tests/real_browser_arena.test.js` |
|---|---|---|
| **Classification** | `MOCK_DOM_UNIT` | `REAL_BROWSER_E2E` |
| **Execution Environment** | Node.js process with mock objects | Real Google Chrome / Edge Chromium |
| **Network Transport** | None (in-memory) | HTTP via `server.js` + WebSocket CDP |
| **DOM Engine** | Handwritten mock DOM dictionary | Blink / V8 (Genuine Chromium) |
| **CSS Layout & Styling** | None (unrendered) | Full CSS rendering & active layout |
| **Modal Interaction** | Synthetic function dispatch | Real DOM element click (`.click()`) |
| **State Tampering Allowed** | Synthetic setups only | **STRICTLY FORBIDDEN (0 tampering)** |
| **Visual Artifacts** | None | Full screenshot PNG capture |
| **Match Progression** | Single-step mocks | Multi-turn (Turn 1 -> Turn 2 -> Turn 3) |
| **Combat Verification** | Mock callback | Production damage resolution (Life 5 -> 4) |
