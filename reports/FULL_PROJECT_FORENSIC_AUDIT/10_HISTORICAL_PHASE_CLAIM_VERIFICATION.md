# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 10. HISTORICAL PHASE CLAIM VERIFICATION

**Objective:** Audit and independently verify all major implementation claims made in historical phase reports against actual source code, database contents, and test outcomes.

---

### 1. Comprehensive Phase Claim Verification Matrix

| Phase Identifier | Historical Milestone Claim | Current Code & Execution Reality | Forensic Verdict | Discrepancy Details |
| :--- | :--- | :--- | :---: | :--- |
| **Phase M.1** | Persistent multiplayer sessions with zero token leakage and robust reconnect | Snapshots scrub tokens, but restoring a match from SQLite wipes active response windows, permanently freezing combat | **PARTIALLY VERIFIED** | Reconnection during combat deadlocks match ([BSP-AUD-009](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-009)) |
| **Phase M.2** | Strict server-authenticated participant authority by phase and action type | Bypassed during combat windows; `SUMMON` allows arbitrary unit creation and core minting | **CONTRADICTED** | Critical authorization bypass in [engine/session_manager.js#L831](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js#L831) ([BSP-AUD-001](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-001), [BSP-AUD-006](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-006)) |
| **Phase M.3** | Authoritative response windows with mandatory Flash 2 timing and action progression lock | `declareBlock` and `resolveDirectHit` bypass Flash 2; `game.passPriority` fails in Block Declaration | **CONTRADICTED** | Direct transitions skip windows; Block Declaration rejects standard pass ([BSP-AUD-002](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-002), [BSP-AUD-011](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-011)) |
| **Phase M.3.1** | Unified Flash timing rules and candidate offering | Candidate generator re-implements ad-hoc regex and ignores Japanese timing qualifiers | **PARTIALLY VERIFIED** | `calculateFlashCandidates` diverges from `validateFlashTiming` ([BSP-AUD-003](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-003)) |
| **Phase W.1 & W.2** | 348 Wiki keywords reconciled, 364 runtime keywords verified with passing tests | 265 keywords have empty hooks; 40 custom methods are completely disconnected from the engine | **CONTRADICTED** | 72.8% of keywords are inactive stubs; methods tested only via synthetic calls ([BSP-AUD-013](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-013) - [BSP-AUD-016](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-016)) |
| **Phase 4D** | 40 Authoritative Master Test Suites passing with zero regressions | `keyword_registry.test.js` and `phase_m3` suites currently fail on `main` (at least 9 test failures) | **CONTRADICTED** | Multiple test failures currently present on `main` branch ([BSP-AUD-017](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-017)) |
| **Core Architecture** | Pure Node.js zero-external-dependency architecture | Verified. Zero third-party dependencies in `package.json`; all modules use Node built-ins | **VERIFIED** | Clean, dependency-free architecture confirmed across all tiers |
| **Card Database** | Complete 14,443 card corpus with compiled IR database | Verified. 14,443 cards detailed, 14,443 index keys, 514 IR shards, 530 rebirth pairs present | **VERIFIED** | Full card database corpus verified intact |

---

### 2. Forensic Analysis of Progress Inflation

The audit establishes that previous milestone reports suffered from **systematic progress inflation**:
1. **Keyword Metrics Inflation:** Counting registered keywords in [engine/keywords/registry.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/registry.js) as "implemented mechanics", even though 265 of them possess empty hooks objects and 40 methods are never called by the engine.
2. **Synthetic Test Masking:** Creating unit tests that call isolated keyword methods directly (e.g. `await WhirlwindKeyword.executeWhirlwind(...)`), claiming the keyword is "verified", while the actual game engine never executes that method when resolving card abilities.
3. **Master Runner Curation:** Omitting 187 test suites from the master runner, reporting "100% test pass rates" while excluding suites that contained failing tests.
