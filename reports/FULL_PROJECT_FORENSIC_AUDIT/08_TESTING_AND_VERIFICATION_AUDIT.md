# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 08. TESTING AND VERIFICATION AUDIT

**Subsystem:** Test Corpus, Master Verification Battery, Headless Browser E2E, and Regression Suites  
**Audit Status:** **TEST RUNNER DEFICIENCIES & FAILING TESTS ON MAIN IDENTIFIED**

---

### 1. Test Corpus Inventory & Taxonomy

The BSP test corpus consists of **261 test files** directly in `tests/`, totaling **1,846 declared test cases**:

| Test Category | File Count | Description | Primary Examples |
| :--- | :---: | :--- | :--- |
| **Unit Tests** | 209 | Core engine logic, card abilities, zone rules | `engine_core.test.js`, `zones.test.js` |
| **Security & Adversarial** | 13 | Token isolation, authority bypass, tamper tests | `phase_m1_token_security.test.js` |
| **Data & Semantic Audits** | 13 | Card corpus verification, keyword extraction | `data_audit.test.js`, `keyword_specs_audit.test.js` |
| **Real Browser E2E** | 11 | Headless Chrome CDP two-browser gameplay | `phase_m3_two_human_browser_e2e.test.js` |
| **Regression Suites** | 8 | Historic bug reproductions & invariants | `core_game_rules_engine.test.js` |
| **Session Integration** | 4 | Persistence, SQLite store, reconnection | `phase_m_session_persistence.test.js` |
| **Simulation / Bot** | 3 | AI self-play, random game simulation | `simulation_arena.test.js` |
| **TOTAL** | **261** | **1,846 declared test cases** | |

---

### 2. Testing Deficiencies & Audit Findings

#### A. [BSP-AUD-018] Master Verification Runner Omits 71.6% of Test Corpus (MEDIUM)
- **Location:** [scripts/run_master_verification.mjs](file:///c:/Users/namis/Downloads/BSP/scripts/run_master_verification.mjs)
- **Deficiency:** The "Master Verification Runner" hardcodes only 74 test suites, completely omitting **187 test files** (71.6% of the test suite) and over 1,100 test cases.
- **Consequence:** Regressions in omitted test suites (such as `accel_mechanics.test.js`, `advent_saga_handlers.test.js`, `arena_ui_and_timer.test.js`) go completely unnoticed.

#### B. [BSP-AUD-017] Failing Tests on Main Branch (HIGH)
- **Failing Suites:**
  1. [tests/keyword_registry.test.js](file:///c:/Users/namis/Downloads/BSP/tests/keyword_registry.test.js): **4 tests fail**
     - Line 75: *Keyword Wave 1 - Windstorm exhausts other spirits on block*
     - Line 266: *Upgraded Keyword - Ultra Holy Life draws from bottom on block*
     - Line 298: *Upgraded Keyword - True-Curse destroys opposing Spirit/Ultimate*
     - Line 329: *Upgraded Keyword - Fierce Windstorm exhausts opposing Spirit/Ultimate*
  2. [tests/keywords_waves4_5_6.test.js](file:///c:/Users/namis/Downloads/BSP/tests/keywords_waves4_5_6.test.js): **1 test fails**
     - Line 413: *Wave 1 - Ultra Awaken refreshes on BP comparison*
  3. [tests/phase_m3_action_progression_lock.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_m3_action_progression_lock.test.js): **2 tests fail**
     - Line 25: *PHASE-M3-LOCK-01: Engine rejects STEP_ADVANCE while response window is active* (Expected error `RESPONSE_WINDOW_ACTIVE`, got `NOT_PRIORITY_PLAYER`)
     - Line 69: *PHASE-M3-LOCK-02: Engine rejects ATTACK while response window is active*
  4. [tests/phase_m3_flash_priority.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_m3_flash_priority.test.js): **1 test fails**
     - Line 103: *PHASE-M3-FLASH-04: Flash action resets consecutive passes to 0 and passes priority back*
- **Root Cause:** Subsequent changes to combat response window locking broke older test suites that called `declareBlock()` during Flash 1, but these failures were never fixed on `main`.

#### C. [BSP-AUD-019] Master Runner Overwrites Historical Phase Reports (MEDIUM)
- **Location:** [scripts/run_master_verification.mjs#L30-L45](file:///c:/Users/namis/Downloads/BSP/scripts/run_master_verification.mjs#L30-L45)
- **Deficiency:** The runner hardcodes output directories pointing to historical phase folders (`reports/phase_m3_response_windows`, `reports/phase_m1`, `reports/phase4d`) and overwrites them on every run, destroying audit history.

#### D. SQLite Concurrency Conflicts During Parallel Test Execution
- When multiple test suites launch concurrent Node.js servers, they default to opening `battle_spirits.db`.
- This triggers `SQLITE_BUSY: database is locked` errors.
- Tests must always set `DB_PATH: ':memory:'` or unique per-suite temporary database paths.
