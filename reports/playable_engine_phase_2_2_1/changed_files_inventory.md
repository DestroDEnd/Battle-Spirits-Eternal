# Changed Files Inventory — Phase 2.2.1

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** 2.2.1 Evidence Integrity, Real Browser Verification & Final Stabilization  
**Date:** 2026-11-21  

---

## 1. Summary of Repository Modifications

In strict adherence to the preservation directive, no canonical card data, 514 IR shards, or historical phase reports were deleted, overwritten, or modified.

All changes were strictly focused on:
1. Genuine real browser test harness implementation.
2. Adversarial evidence validation and variant coverage auditing.
3. Master test reconciliation and verification runner.
4. Comprehensive audit and delivery documentation.

---

## 2. Granular Inventory of Modified & Created Files

| File Path | Action | Role / Purpose | Invariants Maintained |
|---|---|---|---|
| \`tests/helpers/real_browser.js\` | **Created** | Genuine Chrome DevTools Protocol (CDP) test harness | Zero NPM dependencies; native Node.js 24 WebSocket |
| \`tests/real_browser_arena.test.js\` | **Created** | Genuine end-to-end real browser gameplay test | 0 state tampering; 40-card legal decks; real UI actions |
| \`tests/adversarial_evidence_validation.test.js\` | **Created** | Adversarial validation suite (7 tests) | Rejects fake references, bad counts, unexecuted suites |
| \`tests/browser_arena_gameplay.test.js\` | **Modified** | Updated header to \`Classification: MOCK_DOM_INTEGRATION\` | Test preserved intact; no regression |
| \`scripts/record_phase_2_2_1_baseline.mjs\` | **Created** | Milestone 1 baseline and cryptographic preservation audit | Shard SHA-256 verification and git environment audit |
| \`scripts/generate_variant_coverage_inventory.mjs\` | **Created** | Generates variant-level evidence coverage inventory | Reconciles 51,734 clauses across 288 opcodes |
| \`scripts/run_master_verification.mjs\` | **Created** | Master verification runner across 37 suites | Dedupes test cases; outputs reconciled metrics |
| \`reports/playable_engine_phase_2_2_1/*\` | **Created** | 20 authoritative reports and JSON data files | 100% derived from live verifiable evidence |

---

## 3. Preserved Unchanged Core Assets
- All 514 IR shards in \`data/ir_shards/*.json\` (Cryptographically verified).
- Canonical card database \`data/cards_detailed.json\` and index \`data/cards_index.json\`.
- All historical reports in \`reports/playable_engine_phase_1/\`, \`phase_2/\`, \`phase_2_2/\`.
- Core engine modules in \`engine/\`, \`compiler/\`, and \`battle_arena.js\`.
