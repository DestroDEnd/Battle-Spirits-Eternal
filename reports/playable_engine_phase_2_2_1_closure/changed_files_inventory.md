# Changed Files Inventory (Phase 2.2.1 Closure)

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 2.2.1 Corrective Closure  
**Date:** 2026-11-21  

---

## 1. Summary of Repository Modifications

In strict adherence to the preservation directive, no canonical card data, 514 IR shards, or historical phase reports were deleted, overwritten, or modified.

All changes were strictly focused on:
1. Genuine real browser test harness implementation and multi-turn gameplay verification.
2. Adversarial evidence validation with 13 comprehensive failure scenarios.
3. Master test reconciliation and unified verification runner across all 37 suites.
4. Comprehensive audit and delivery documentation.

---

## 2. Granular Inventory of Modified & Created Files

| File Path | Action | Role / Purpose | Invariants Maintained |
|---|---|---|---|
| [tests/helpers/real_browser.js](file:///C:/Users/namis/Downloads/BSP/tests/helpers/real_browser.js) | **Created** | Genuine Chrome DevTools Protocol (CDP) test harness | Zero NPM dependencies; native Node.js 24 WebSocket |
| [tests/real_browser_arena.test.js](file:///C:/Users/namis/Downloads/BSP/tests/real_browser_arena.test.js) | **Created** | Genuine end-to-end real browser gameplay test | 0 state tampering; 40-card legal decks; real UI actions |
| [tests/adversarial_evidence_validation.test.js](file:///C:/Users/namis/Downloads/BSP/tests/adversarial_evidence_validation.test.js) | **Created** | Adversarial validation suite (13 tests) | Rejects fake references, bad counts, unexecuted suites |
| [tests/browser_arena_gameplay.test.js](file:///C:/Users/namis/Downloads/BSP/tests/browser_arena_gameplay.test.js) | **Modified** | Updated header to `Classification: MOCK_DOM_UNIT` | Test preserved intact; no regression |
| [scripts/verify_evidence_model.mjs](file:///C:/Users/namis/Downloads/BSP/scripts/verify_evidence_model.mjs) | **Created** | Programmatic AST-level evidence verifier | Validates exact test names, files, APIs, assertions |
| [scripts/record_phase_2_2_1_closure_baseline.mjs](file:///C:/Users/namis/Downloads/BSP/scripts/record_phase_2_2_1_closure_baseline.mjs) | **Created** | Milestone 1 baseline and cryptographic preservation audit | Shard SHA-256 verification and git environment audit |
| [scripts/generate_variant_coverage_inventory.mjs](file:///C:/Users/namis/Downloads/BSP/scripts/generate_variant_coverage_inventory.mjs) | **Created** | Generates variant-level evidence coverage inventory | Reconciles 51,734 clauses across 288 opcodes |
| [scripts/run_master_verification.mjs](file:///C:/Users/namis/Downloads/BSP/scripts/run_master_verification.mjs) | **Created** | Master verification runner across 37 suites | Dedupes test cases; outputs reconciled metrics |
| [reports/playable_engine_phase_2_2_1_closure/*](file:///C:/Users/namis/Downloads/BSP/reports/playable_engine_phase_2_2_1_closure/) | **Created** | 19 authoritative reports and JSON data files | 100% derived from live verifiable evidence |

---

## 3. Preserved Unchanged Core Assets
- All 514 IR shards in `data/ir_shards/*.json` (Cryptographically verified).
- Canonical card database `data/cards_detailed.json` and index `data/cards_index.json`.
- All historical reports in `reports/playable_engine_phase_1/`, `phase_2/`, `phase_2_2/`, `phase_2_2_1/`.
- Core engine modules in `engine/`, `compiler/`, and `battle_arena.js`.
