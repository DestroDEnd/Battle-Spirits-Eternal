# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 12. TEST EXECUTION LOG

**Audit Date:** November 2026  
**Node.js Version:** v24.16.0  
**Operating System:** Windows 11 (win32 10.0.26100)  
**Execution Mode:** Strictly Non-Destructive Probe Execution

---

### 1. Test Execution Benchmark Summary

| Test Battery / Suite | Files Executed | Tests Passed | Tests Failed | Exit Code | Wall Clock Time |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **8-Suite Baseline Sample** | 8 | 40 | 4 | 1 | 0.75 s |
| **keyword_registry.test.js** | 1 | 13 | 4 | 1 | 0.29 s |
| **keywords_waves4_5_6.test.js** | 1 | 18 | 1 | 1 | 0.31 s |
| **keywords_comprehensive_audit.test.js** | 1 | 7 | 0 | 0 | 0.16 s |
| **keyword_reconciled_mechanics.test.js** | 1 | 6 | 0 | 0 | 0.17 s |
| **phase_m3_response_window suites** | 4 | 14 | 3 | 1 | 0.35 s |
| **phase_m3_1_flash_timing suites** | 4 | 24 | 0 | 0 | 0.44 s |

---

### 2. Detailed Failure Transcripts on Main Branch

#### A. `tests/keyword_registry.test.js` (4 Failures):
1. **Keyword Wave 1 - Windstorm exhausts other spirits on block (Line 75):**
   ```
   AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
   + actual - expected
   + 'REFRESHED'
   - 'EXHAUSTED'
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/keyword_registry.test.js:98:10)
   ```
2. **Upgraded Keyword - Ultra Holy Life draws from bottom on block (Line 266):**
   ```
   AssertionError [ERR_ASSERTION]: Drew 1 card on block
   0 !== 1
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/keyword_registry.test.js:293:10)
   ```
3. **Upgraded Keyword - True-Curse destroys opposing Spirit/Ultimate (Line 298):**
   ```
   AssertionError [ERR_ASSERTION]: Attacker destroyed
   1 !== 0
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/keyword_registry.test.js:321:10)
   ```
4. **Upgraded Keyword - Fierce Windstorm exhausts opposing Spirit/Ultimate (Line 329):**
   ```
   AssertionError [ERR_ASSERTION]: Bystander exhausted by Fierce Windstorm
   + actual - expected
   + 'REFRESHED'
   - 'EXHAUSTED'
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/keyword_registry.test.js:350:10)
   ```

#### B. `tests/keywords_waves4_5_6.test.js` (1 Failure):
1. **Wave 1 - Ultra Awaken refreshes on BP comparison (Line 413):**
   ```
   AssertionError [ERR_ASSERTION]: Ultra Awaken refreshed unit with 4 cores during battle
   + actual - expected
   + 'EXHAUSTED'
   - 'REFRESHED'
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/keywords_waves4_5_6.test.js:436:10)
   ```

#### C. `tests/phase_m3_action_progression_lock.test.js` (2 Failures):
1. **PHASE-M3-LOCK-01: Engine rejects STEP_ADVANCE while response window is active (Line 25):**
   ```
   AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
   + actual: 'NOT_PRIORITY_PLAYER'
   - expected: 'RESPONSE_WINDOW_ACTIVE'
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/phase_m3_action_progression_lock.test.js:62:14)
   ```
2. **PHASE-M3-LOCK-02: Engine rejects ATTACK while response window is active (Line 69):**
   ```
   AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
   + actual: 'NOT_PRIORITY_PLAYER'
   - expected: 'RESPONSE_WINDOW_ACTIVE'
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/phase_m3_action_progression_lock.test.js:109:14)
   ```

#### D. `tests/phase_m3_flash_priority.test.js` (1 Failure):
1. **PHASE-M3-FLASH-04: Flash action resets consecutive passes to 0 and passes priority back (Line 103):**
   ```
   AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
   false !== true
   at TestContext.<anonymous> (file:///c:/Users/namis/Downloads/BSP/tests/phase_m3_flash_priority.test.js:143:10)
   ```
