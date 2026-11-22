# Remaining Priorities & Development Roadmap

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Date:** 2026-11-21  

---

## 1. Priority Tiers

Following the project directives, all future work is classified into three priority tiers:

### P0 — Release Blocking (100% COMPLETE in Phase 2)
- [x] Engine stability and crash-free execution.
- [x] Correct game-state mutations (destruction, summoning, bouncing, drawing, exhausting, refreshing).
- [x] Core, life, and resource management with strict core conservation.
- [x] Target legality and perspective disambiguation (`player` vs `opponent`).
- [x] 100% legal 40-card production matches without test bypasses (`unsafeTestBypassDeckValidation`).
- [x] Formal Interaction Protocol with replay attack protection.
- [x] Zero regressions across existing test suites (492/492 passing).

### P1 — High-Priority Post-Initialization Roadmap
1. **Expand Unit Tests for `HANDLER_PRESENT` Opcodes:**
   - Write targeted test suites for remaining Tier 4 operations (targeting 80%+ clause promotion to `RUNTIME_TESTED` and `FULLY_SUPPORTED`).
2. **Advanced Flash Timing Windows:**
   - Expand flash step window arbitration during battle resolution to allow multi-chain flash spell interactions.
3. **UI Visual Polish for Modals:**
   - Enhance the DOM rendering in `battle_arena.js` for complex multi-card selection grids during search/burst activations.

### P2 — Post-Release Backlog
1. **Collaboration & Promotional Mechanics:**
   - Implement handlers for the remaining 1,263 Tier 5 (`PARSED`) promo card clauses.
2. **Tournament Log Exporter:**
   - Format engine match traces into standardized tournament replay files for client replay viewing.
