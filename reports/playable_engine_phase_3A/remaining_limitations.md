# Phase 3A Remaining Limitations

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 3A  
**Date:** 2026-11-21  

---

## 1. Identified Technical Boundaries

1. **Test Assertion Depth:** While 293 opcode variants possess executable handlers in `engine/ops/`, they require dedicated before/after state assertion tests to graduate to `FULLY_SUPPORTED`.
2. **Multi-Target Interactive Modals:** Multi-slider core distribution across 5+ entities simultaneously is resolved sequentially in UI rather than via a single composite slider modal.
3. **Real Browser Suite Execution Time:** The real browser E2E test requires ~13 seconds due to headless Chrome process spawning, HTTP server initialization, and multi-turn combat animation timers.
