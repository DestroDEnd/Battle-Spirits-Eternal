# PHASE M.3.3 — INTEGRITY, SECURITY, UNIVERSAL ACTION AUTHORITY & REGRESSION CLOSURE
## 02 — COMBAT RESOLUTION AUTHORITY

### 1. Forensic Vulnerability (Defect A2)
Direct invocation of `resolveBattleComparison()` on `ResponseWindowManager` was previously able to bypass active Flash 2 response windows. If an attacker or script called `resolveBattleComparison(win)` while Flash 2 remained open, the engine would compare BP and destroy spirits before both players had the opportunity to pass or play Flash magic.

Similarly, direct calls to `declareBlock()` or `resolveDirectHit()` could bypass active response windows if called improperly.

### 2. Remediation Architecture (Work Package C)
1. **Flash Timing Closure Enforcement (`engine/response_window.js`)**:
   - `resolveBattleComparison(win)` now strictly checks window state:
     ```javascript
     if (this.isResponseWindowActive()) {
       const cur = this.getCurrentWindow();
       if (cur && (cur.windowType === RESPONSE_WINDOW_TYPES.FLASH_2 || cur.windowType === RESPONSE_WINDOW_TYPES.FLASH_1)) {
         if (!cur._closedViaTwoPasses) {
           return { success: false, reason: 'FLASH_TIMING_NOT_CLOSED', code: 'FLASH_TIMING_NOT_CLOSED' };
         }
       }
     }
     ```
   - Only when both players have passed consecutively (`consecutivePasses >= 2`) does `_closedViaTwoPasses` become `true`, permitting comparison resolution.
2. **Idempotent Battle Comparison**:
   - `_comparisonResolved` flag prevents duplicate BP comparisons from executing more than once per combat encounter.
3. **Guard on `declareBlock()` and `resolveDirectHit()`**:
   - Direct block declaration during Flash 1 returns `FLASH_TIMING_NOT_CLOSED`.
   - Direct hit resolution during Flash 1 or Block Declaration returns `FLASH_TIMING_NOT_CLOSED` or `BLOCK_DECISION_REQUIRED`.

### 3. Verification Evidence
Verified by `tests/phase_m3_3_combat_resolution_authority.test.js`:
- `M3.3-C-01`: Direct `resolveBattleComparison()` fails while Flash 2 is active and preserves state (PASS).
- `M3.3-C-02`: Legitimate 2-pass closure executes BP comparison exactly once (PASS).
- `M3.3-C-03`: `declareBlock` cannot bypass active Flash 1 window (PASS).
- `M3.3-C-04`: `resolveDirectHit` cannot bypass active Flash 1 or Block Declaration window (PASS).
