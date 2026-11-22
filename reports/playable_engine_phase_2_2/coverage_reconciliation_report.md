# Coverage Reconciliation Report — Phase 2.2

**Project:** Battle Spirits Eternal (BSP)  
**Date:** 2026-11-21T05:13:35.181Z  

---

## 1. Authoritative 5-Tier Clause Classification

| Tier | Opcodes | Clause Count | Clause % | Evidence Criteria |
|---|---|---|---|---|
| **FULLY_SUPPORTED** | 9 | 26,777 | 51.76% | Verified in complete matches (40-card legal decks), real-card regressions, atomic state mutations, and event emissions. |
| **SEMANTICALLY_VERIFIED** | 15 | 5,947 | 11.50% | Verified with before/after state assertions in real-card E2E and semantic validation suites. |
| **RUNTIME_TESTED** | 23 | 9,725 | 18.80% | Verified via operation variant, condition, and keyword execution suites. |
| **HANDLER_PRESENT** | 198 | 8,472 | 16.38% | Explicit handler exists in `engine/ops/index.js`; awaiting deep regression test isolation. |
| **PARSED_ONLY** | 43 | 813 | 1.57% | Parsed into AST clause; generic safe fallback execution. |
| **Total** | **288** | **51,734** | **100.00%** | **Strictly Reconciled & Asserted** |

## 2. Automated Reconciliation Assertions
- Reconciled Total Clauses: **51,734** / **51,734** (Exact Match: PASS)
- Reconciled Total Opcodes: **288** / **288** (Exact Match: PASS)
- Discrepancy between JSON and Markdown: **0**
