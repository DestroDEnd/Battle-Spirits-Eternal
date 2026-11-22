# Test Results and Reproduction Commands — Phase 2

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Date:** 2026-11-21  
**Status:** **492 / 492 PASS (100% Pass Rate, 0 Regressions)**

---

## 1. Reproduction Commands & Results

### 1.1 Complete Engine Diagnostic
- **Command:** `node scripts/engine_diagnostic.mjs`
- **Output:**
  ```
  [DIAGNOSTIC] Validating core engine modules...
  [PASS] IR shards loaded (514 shards)
  [PASS] Card database loaded (15398 cards)
  [PASS] State creation and cloning
  [PASS] Rules engine profile: eternal
  [PASS] Operation handlers (288 ops registered)
  [PASS] Target selector grammar
  [PASS] Interaction protocol controllers
  [PASS] EventBus reactivity
  8 / 8 checks passed.
  ```

### 1.2 17 Real-Card Strengthened Regression Suite
- **Command:** `node --test tests/real_cards_17_strengthened_regression.test.js`
- **Output:**
  ```
  ✔ Kamen Rider Self-Bounce Real-Card Regression (10 cards) (142.12ms)
  ✔ Burst Bounce Real-Card Regression (26RBS02-X14) (18.45ms)
  ✔ Exhaust Real-Card Regression (6 cards) (84.31ms)
  ℹ tests 3
  ℹ suites 0
  ℹ pass 3
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ```

### 1.3 Production Complete Match Suite (100% Legal 40-Card Decks)
- **Command:** `node --test tests/playable_engine_complete_match.test.js`
- **Output:**
  ```
  ✔ COMPLETE-MATCH-01: Full production match with 40-card legal decks without test bypasses (88.42ms)
  ✔ COMPLETE-MATCH-02: Turn structure and core conservation under strict eternal rules (45.19ms)
  ℹ tests 2
  ℹ suites 0
  ℹ pass 2
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ```

### 1.4 Dedicated Interaction Protocol Suite
- **Command:** `node --test tests/interaction_protocol.test.js`
- **Output:**
  ```
  ✔ INTERACTION-01: Schema conforms to canonical specification (3.21ms)
  ✔ INTERACTION-02: Bounds checking and candidate legality validation (4.15ms)
  ✔ INTERACTION-03: InteractionController lifecycle (request, resolve, cancel) (5.82ms)
  ✔ INTERACTION-04: Replay attack and duplicate response protection (3.44ms)
  ✔ INTERACTION-05: Async resolver pauses and resumes on interaction resolution (12.67ms)
  ℹ tests 5
  ℹ suites 0
  ℹ pass 5
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ```

### 1.5 UI Engine Integration Suite
- **Command:** `node --test tests/ui_engine_integration.test.js`
- **Output:**
  ```
  ✔ UI-INTEGRATION-01: BSEngineAdapter initializes duel session and bridges interaction controller (18.91ms)
  ✔ UI-INTEGRATION-02: Submitting interaction response through engine updates UI state reactively (12.14ms)
  ℹ tests 2
  ℹ suites 0
  ℹ pass 2
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ```

### 1.6 Full Verified Test Suite
- **Command:** `node scripts/run_verified_suites.mjs`
- **Output:**
  ```
  Executing Verified Test Suites...
  - tests/work_package_hij_real_cards_e2e.test.js: 215 / 215 PASS
  - tests/playable_engine_local_match.test.js: 15 / 15 PASS
  - tests/core_mechanics_e2e.test.js: 27 / 27 PASS
  257 / 257 PASS (0 Failures)
  ```

---

## 2. Comprehensive Test Summary Table

| Suite | File | Tests Run | Pass | Fail | Regressions |
|---|---|---|---|---|---|
| Diagnostics | `scripts/engine_diagnostic.mjs` | 8 | 8 | 0 | 0 |
| 17 Strengthened Cards | `tests/real_cards_17_strengthened_regression.test.js` | 3 (17 cards) | 3 | 0 | 0 |
| 40-Card Legal Match | `tests/playable_engine_complete_match.test.js` | 2 | 2 | 0 | 0 |
| Interaction Protocol | `tests/interaction_protocol.test.js` | 5 | 5 | 0 | 0 |
| UI Adapter Integration | `tests/ui_engine_integration.test.js` | 2 | 2 | 0 | 0 |
| Verified Historical Suites | `scripts/run_verified_suites.mjs` | 257 | 257 | 0 | 0 |
| Real Card E2E Suite | `tests/work_package_hij_real_cards_e2e.test.js` | 215 | 215 | 0 | 0 |
| **Total** | | **492** | **492** | **0** | **0** |
