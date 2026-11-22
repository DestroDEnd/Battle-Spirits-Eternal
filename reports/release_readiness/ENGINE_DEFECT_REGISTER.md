# Battle Spirits Eternal (BSP) — Master Engine Defect Register
## Release Readiness Program — Phase C Engine Defect Catalog & Repair Tracking

**Evaluation Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Standard:** Rigorous Bug Classification, Root Cause Diagnosis & Resolution Verification  
**Status:** **AUTHORITATIVE DEFECT REGISTER**

---

## 1. Executive Defect Summary

The Battle Spirits Eternal engine defect register tracks all architectural, rules, verification, and UI integration defects identified during development and independent audits.

Each defect is assigned a severity tier:
- **P0 — RELEASE BLOCKER:** Directly prevents rules-compliant gameplay or causes engine crashes/hangs.
- **P1 — HIGH PRIORITY:** Causes incorrect game-state mutation for common card mechanics.
- **P2 — MEDIUM PRIORITY:** Edge-case rules discrepancy affecting secondary abilities or specialized keywords.
- **P3 — LOW PRIORITY / KNOWN LIMITATION:** Minor visual or localized discrepancy documented for post-release.

### Defect Status Legend:
- `RESOLVED_AND_VERIFIED`: Defect fixed at source, with automated regression test passing.
- `KNOWN_LIMITATION_DOCUMENTED`: Explicitly out-of-scope for local release candidate, with safe fallback and boundary documented.

---

## 2. Complete Defect Inventory

| Defect ID | Severity | Affected Subsystem | Description & Root Cause | Resolution Status | Verification Evidence |
|---|:---:|---|---|:---:|---|
| **DEF-001** | **P0** | UI / Targeting | `queryCandidates` failed to find legal targets in Arena due to `state.players` vs `state.player/opponent` structure mismatch and controller perspective inversion | `RESOLVED_AND_VERIFIED` | `tests/real_browser_arena.test.js`<br>`tests/effect_execution_targeting_conditions.test.js` |
| **DEF-002** | **P0** | Continuous | `computeEffectiveBP` threw TypeError when evaluating UI spirit stacks lacking `stack.top.bp` structure | `RESOLVED_AND_VERIFIED` | `tests/real_browser_arena.test.js`<br>`scripts/benchmark_engine_performance.mjs` |
| **DEF-003** | **P0** | Browser Verification | `real_browser_arena.test.js` used synthetic DOM injections (`s.opponent.field = [...]`) bypassing core payment and target modals | `RESOLVED_AND_VERIFIED` | `scripts/verify_browser_10_runs.mjs` (10/10 PASS) |
| **DEF-004** | **P0** | Test Runner | `run_master_verification.mjs` heuristically assigned `STANDALONE_VERIFIED` to unexecuted test files | `RESOLVED_AND_VERIFIED` | `reports/phase4d_1/test_disposition_audit.md` |
| **DEF-005** | **P0** | Telemetry | Opcode evidence was statically generated from AST schemas rather than real runtime execution | `RESOLVED_AND_VERIFIED` | `reports/phase4d_1/runtime_opcode_telemetry.json` (457 traces) |
| **DEF-006** | **P1** | Support Matrix | 810 cards with unhandled secondary abilities were optimistically classified as `FULLY_SUPPORTED` | `RESOLVED_AND_VERIFIED` | `reports/phase4d_1/card_support_summary.json` |
| **DEF-007** | **P1** | Combat / AI | Opponent AI opening hand drew 0 affordable spirits in 1/10 games, causing browser test flakiness | `RESOLVED_AND_VERIFIED` | `tests/helpers/e2e_decks.js`<br>`scripts/verify_browser_10_runs.mjs` |
| **DEF-008** | **P1** | Resolver / Commit | Activation restrictions were not atomically reserved prior to cost payment, allowing re-entrancy | `RESOLVED_AND_VERIFIED` | `tests/runtime_activation_limits.test.js` (166 tests) |
| **DEF-009** | **P1** | Payment | Core movement during summon payment previously permitted negative reserve balances in edge cases | `RESOLVED_AND_VERIFIED` | `tests/core_game_rules_integrity_corrective.test.js` |
| **DEF-010** | **P2** | Targeting | Downstream clauses in compound abilities occasionally retained stale target context after targeting failure | `RESOLVED_AND_VERIFIED` | `tests/work_package_hij1_adversarial_determinism.test.js` |
| **DEF-011** | **P2** | Brave SBA | Destroyed braved spirit sends Brave directly to trash without offering player de-brave retention | `KNOWN_LIMITATION_DOCUMENTED` | Documented in `unresolved_limitations.md` |
| **DEF-012** | **P2** | Grandwalker | God Core counters on Grandwalker Nexuses are not routable through standard `buildPaymentPlan` | `KNOWN_LIMITATION_DOCUMENTED` | Documented in `unresolved_limitations.md` |
| **DEF-013** | **P3** | Rebirth | Dual-sided Rebirth cards lack runtime `FLIP_CARD` in-place field transition opcode | `KNOWN_LIMITATION_DOCUMENTED` | Documented in `unresolved_limitations.md` |
| **DEF-014** | **P3** | Visual UI | Arena displays stacked brave/nexus cards as flat representations rather than layered composites | `KNOWN_LIMITATION_DOCUMENTED` | Documented in `unresolved_limitations.md` |

---

## 3. Defect Resolution Summary

- **Total Defects Tracked:** 14
- **Resolved & Verified:** 10 (100% of P0 and P1 defects)
- **Known Limitations Documented:** 4 (P2/P3 post-release enhancements)
- **Active Release Blockers:** **0 (ZERO)**
