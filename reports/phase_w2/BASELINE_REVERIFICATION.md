# BASELINE REVERIFICATION REPORT
**Project:** Battle Spirits Eternal (BSP)  
**Phase:** W.2 — Keyword Reconciliation Integrity & Runtime Verification  
**Generated:** 2026-11-22T11:11:24.208Z  
**Git Branch:** `main`  
**Git Commit:** `0e3524a30738009e1e233d8ab9e6c7b562e07074`  

---

## 1. Executive Summary & Verification Matrix

The baseline for Phase W.2 was established through automated, reproducible queries inspecting the filesystem, compiler definitions, runtime registry instances, card corpus shards, and test directory tree.

| Measurement Dimension | Baseline Claim | Reverified Measurement | Discrepancy / Analysis |
| :--- | :---: | :---: | :--- |
| **Unique Canonical Cards** | 14,443 | **14443** | Exact match in `data/cards_detailed.json`. |
| **Physical Card Instances** | 15,398 | **15398** | Exact match across 514 shards in `data/ir_shards/`. |
| **Canonical Wiki Keywords** | 348 | **348** | Exact match in `WIKI_MASTER_INVENTORY.json`. |
| **Compiler Catalog Entries** | 354 | **354** | Exact match in `compiler/keyword_compiler.js` (`KEYWORD_CATALOG`). |
| **Runtime Registry Entries** | 364 | **364** | Exact match in `KeywordRegistry` (`createDefaultKeywordRegistry()`). |
| **Executable Action / Hook Handlers** | ~237 | **237** | 89 event bus hooks + 148 direct execution functions. |
| **Passive / Delegated Handlers** | ~28 | **28** | 17 Armor family continuous rules + 11 Brave/Zone/Core systems. |
| **Placeholder / Recognition Handlers**| ~83 | **83** | Pure format legality / card-IR identification definitions. |
| **Keyword Specification Files** | 348 | **348** | Exact match of JSON files in `data/keyword_specs/`. |
| **Dedicated Keyword Test Suites** | 15 | **15** | Test suites dedicated to keyword mechanics and binding. |
| **Total Test Suites Discovered** | 254 | **254** | Recursive count of `*.test.js` in `tests/` (matches runner). |

---

## 2. Core Source Code Artifacts Inspected

The following authoritative files were verified as the source of truth for baseline counts:
- **Compiler:** `compiler/keyword_compiler.js` (defines `KEYWORD_CATALOG` with 354 entries) and `compiler/header_parser.js`.
- **Runtime:** `engine/keywords/index.js`, `engine/keywords/registry.js`, and wave files (`wave1.js` through `wave6.js`).
- **Continuous / Zones:** `engine/continuous.js` (continuous color immunity and level calculation), `engine/zones.js` (core movements).
- **Specifications:** `data/keyword_specs/*.json` (348 canonical specifications).
- **Corpus:** `data/cards_detailed.json` and 514 JSON shards in `data/ir_shards/`.

---

## 3. Dedicated Keyword Test Suites Discovered (15)

1. `tests\accel_mechanics.test.js`
2. `tests\advent_mechanics_and_cards.test.js`
3. `tests\advent_saga_handlers.test.js`
4. `tests\contract_advent_modal_and_timing.test.js`
5. `tests\eternal_17_soulcore_keywords.test.js`
6. `tests\god_advent_saga_handlers.test.js`
7. `tests\keyword_condition_and_face_bindings.test.js`
8. `tests\keyword_ownership_and_infinite_blade.test.js`
9. `tests\keyword_reconciled_mechanics.test.js`
10. `tests\keyword_registry.test.js`
11. `tests\keywords_comprehensive_audit.test.js`
12. `tests\keywords_waves4_5_6.test.js`
13. `tests\terra_dragon_and_keywords.test.js`
14. `tests\ultra_advent_saga_handlers.test.js`
15. `tests\work_package_k1_batch_03_keywords_prerequisites.test.js`

---

## 4. Work Package A Verdict

**VERIFIED.** All project counts have been independently recalculated, verified against live disk state, and reconciled without discrepancies.
