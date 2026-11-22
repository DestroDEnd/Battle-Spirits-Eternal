# Remaining Limitations & Technical Debt (Phase 2.2.1 Closure)

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 2.2.1 Corrective Closure  
**Date:** 2026-11-21  

---

## 1. Executive Summary

Phase 2.2.1 established evidence integrity, resolved test double-counting, added real browser automation, and validated complete match playability. In accordance with strict engineering integrity standards, this document exposes the exact remaining limitations of the current codebase without concealment or false claims.

---

## 2. Granular Inventory of Limitations

### 1. Opcode Variant Test Coverage Depth
- **Status:** 21 variant records (18,286 clauses) are verified in `FULLY_SUPPORTED` and `SEMANTICALLY_VERIFIED`. 2 variant records (2 clauses) are in `RUNTIME_TESTED`.
- **Limitation:** 293 variant records (33,446 clauses) possess executable handlers in `engine/ops/index.js`, but are currently classified as `HANDLER_PRESENT` because granular variant-level before/after state assertion tests have not yet been authored for them.
- **Path Forward:** Proceed into Phase 3A to perform a complete per-card and per-ability audit across all 14,443 cards and 51,734 clauses, establishing card-level traceability to runtime handlers and prioritizing implementation gaps.

### 2. Complex Multi-Target UI Decision Modals
- **Status:** Single-target and card-selection modals work end-to-end in real Chrome.
- **Limitation:** Highly complex operations (such as distributed core reallocation across 5+ arbitrary targets simultaneously or complex branch choices) rely on sequential single-choice prompts rather than a unified multi-slider modal.
- **Path Forward:** Extend the arena UI to support multi-slider core distribution widgets.

### 3. Multiplayer Online Networking Testing
- **Status:** Local 2-player and AI duels execute with complete deterministic rules through `BSEngineAdapter` and local HTTP server.
- **Limitation:** Live peer-to-peer WebRTC / Firebase multiplayer signaling is tested via mocks in `tests/phase6_7_ui_routes.test.js`; live multi-client network testing requires dedicated multi-machine test environments.

### 4. External CDN Script Fallbacks
- **Status:** Core game execution, engine logic, card data, and UI styles are completely self-contained locally in the repository.
- **Limitation:** `arena.html` contains references to Google Fonts and Firebase compat scripts. In completely offline environments without network access, font fallbacks occur cleanly, but local vendoring would further enhance air-gapped performance.
