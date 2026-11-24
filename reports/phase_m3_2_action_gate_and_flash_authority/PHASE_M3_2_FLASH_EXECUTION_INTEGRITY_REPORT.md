# PHASE M.3.2 FLASH EXECUTION INTEGRITY REPORT
## Safe Rollback, State Preservation, and Priority Gating on Failed Flash Attempts

- **Module**: `engine/response_window.js` (`handleFlashAction`)
- **Test Suite**: `tests/phase_m3_2_flash_execution_integrity.test.js`
- **Date**: 2026-11-23

---

### 1. Objective

Work Package D ensures that attempting an invalid or failing Flash action **never consumes the player's priority, never resets consecutive passes, never alters cores/cards, and never emits false resolution events**.

Previously, some execution paths in `ResponseWindowManager.handleFlashAction()` reset `win.consecutivePasses = 0` and alternated priority before validating whether the underlying card play or ability activation succeeded.

---

### 2. Execution Integrity Lifecycle

In `engine/response_window.js`, `handleFlashAction(response, playerSide)` enforces a two-phase commit:

```
[Window OPEN]
      │
      ▼
1. Mark Status = RESOLVING (nested authorizeAction checks recognize window is active)
      │
      ▼
2. Execute Candidate Action (playCard / activateAbility / executeAccel)
      │
      ├──> FAILED (insufficient cores / invalid target / card not in hand)
      │       ├── Restore Status = OPEN
      │       ├── DO NOT reset consecutivePasses
      │       ├── DO NOT alternate priorityPlayer
      │       ├── DO NOT emit FLASH_ACTION_RESOLVED
      │       └── Return { success: false, reason, code }
      │
      └──> SUCCESSFUL
              ├── Reset consecutivePasses = 0
              ├── Alternate priorityPlayer to Opponent
              ├── Restore Status = OPEN
              ├── Emit FLASH_ACTION_RESOLVED
              └── Return { success: true, actionExecuted, nextPriority }
```

---

### 3. Verification Scenarios Tested

In `tests/phase_m3_2_flash_execution_integrity.test.js`:

1. **`M3.2-L4-01: Successful Flash Resets Passes and Alternates Priority`**:
   - Initial `consecutivePasses = 1`.
   - Priority player successfully plays Flash magic.
   - `consecutivePasses` resets to 0.
   - `priorityPlayer` alternates to opponent.
   - `FLASH_ACTION_RESOLVED` event is emitted.
   - Test result: **PASS**.

2. **`M3.2-L4-02: Failed Flash (Insufficient Cost) Preserves Priority and State`**:
   - Initial `consecutivePasses = 1`, reserve cores = 0.
   - Player attempts to cast 3-cost Flash magic.
   - Execution fails with `INSUFFICIENT_CORES`.
   - `consecutivePasses` remains 1.
   - `priorityPlayer` remains unchanged.
   - Magic card remains in hand.
   - No `FLASH_ACTION_RESOLVED` event is emitted.
   - Test result: **PASS**.

3. **`M3.2-L4-03: Invalid Candidate ID Does Not Mutate Window`**:
   - Caller submits `cardId: 'nonexistent_card'`.
   - Execution fails safely without altering window state or history.
   - Test result: **PASS**.

4. **`M3.2-L4-04: Non-Priority Player Flash Attempt Blocked`**:
   - Non-priority caller submits Flash request.
   - Rejected by priority gate with `NOT_PRIORITY_PLAYER`.
   - Pass count and priority remain completely unchanged.
   - Test result: **PASS**.
