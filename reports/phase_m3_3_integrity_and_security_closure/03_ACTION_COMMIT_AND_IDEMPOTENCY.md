# PHASE M.3.3 — INTEGRITY, SECURITY, UNIVERSAL ACTION AUTHORITY & REGRESSION CLOSURE
## 03 — ACTION RESULT, ATOMICITY & IDEMPOTENCY

### 1. Forensic Vulnerability (Defect A3)
Previously, in `session_manager.js`, when a card play failed (e.g. `game.playCard()` returned `{ success: false, reason: 'INSUFFICIENT_CORES' }`), the session manager did not inspect the `success` field. As a result, the action was treated as successful:
- A new event record was committed to SQLite.
- The session version incremented.
- The failed action ID was permanently recorded as "committed", poisoning retries.
- The client was falsely told the card play succeeded.

### 2. Remediation Architecture (Work Package D)
1. **Strict Success Verification**:
   - In `submitPlayerAction()`, all action execution paths explicitly assert `res && res.success === true`.
   - On any failure, a typed error is thrown, aborting the transaction before any database commit or event broadcast.
2. **Atomic In-Memory Rollback**:
   - A deep serialization backup (`stateBackup`) is taken prior to executing any action.
   - If execution fails, the state is rolled back:
     ```javascript
     game.state = deserializeGameState(stateBackup);
     if (game.interactionController) game.interactionController.state = game.state;
     if (game.windows) game.windows.windowStack = [...];
     ```
   - Card instances preserve their unique IDs across serialization cycles (`reviveCard` preserves `c.id`), allowing clean subsequent retries.
   - Session version does NOT increment on failed actions.
3. **Idempotency & Retry Safety**:
   - Failed actions do not populate the action cache, allowing the user to retry with corrected parameters using the same `actionId`.
   - Successfully committed actions cache their result and return `{ success: false, duplicate: true }` on duplicate submission without double execution.
   - Submissions with conflicting payloads on an existing `actionId` are rejected with HTTP 409 `PAYLOAD_CONFLICT`.

### 3. Verification Evidence
Verified by `tests/phase_m3_3_action_commit_integrity.test.js`:
- `M3.3-D-01`: Failed PLAY_CARD throws error, rolls back state, and does not commit version (PASS).
- `M3.3-D-02`: Failed action does not poison subsequent retry with corrected parameters (PASS).
- `M3.3-D-03`: Duplicate successful action returns idempotent cached result without re-execution (PASS).
- `M3.3-D-04`: Conflicting payload on previously committed actionId is rejected (PASS).
