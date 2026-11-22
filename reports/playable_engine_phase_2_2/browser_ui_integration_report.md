# Real Browser UI Integration Report — Phase 2.2

**Project:** Battle Spirits Eternal (BSP)  
**Components:** `battle_arena.js`, `arena.html`, `engine_adapter.js`  
**Date:** 2026-11-21T05:13:35.191Z  

---

## 1. UI Integration Overview
The browser arena UI (`battle_arena.js`) connects to the production rules engine through `BSEngineAdapter`:
- **Board Rendering:** Renders Player and Opponent field stacks, life zones, reserve cores, trash, hand, and turn navigator.
- **Card Actions:** Inspect, play from hand, pay cores, exhaust/refresh, declare attacks, resolve combat.
- **Interaction Modals:** `promptStructuredDecision` renders structured UI overlays for:
  - `SELECT_CARDS` / `SELECT_TARGET` (via `promptUniversalTargetModal`)
  - `CHOOSE_OPTION` (via `promptChoiceModal`)
  - `CONFIRM_ACTION` (via `askOptionalEffect`)
  - `PAY_CORES` / `CHOOSE_CORES` (via core choice modal)

## 2. Presentation Boundary Enforcement
The UI remains strictly an input and presentation layer:
- Never computes costs independently (calls `BSEngineAdapter.calculateEffectiveCost`).
- Never decides attack legality (calls `BSEngineAdapter.canAttack`).
- Never mutates board state directly (dispatches actions through engine APIs).
