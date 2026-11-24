# Battle Spirits Eternal (BSP) — Phase M.2 Idempotency and Recovery Report

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `c:\Users\namis\Downloads\BSP`  
**Phase:** Phase M.2 Work Package C  
**Status:** COMPLETE & FULLY VERIFIED  
**Date:** November 23, 2026  

---

## 1. Overview & Threat Analysis

An independent audit reproduced a critical action poisoning defect:
- When a player submitted an action that failed validation or execution (for instance, an unauthorized step advance or invalid target), the action ID was written into the action ledger before execution succeeded.
- When the client subsequently corrected the payload and retried using the same `actionId`, the request was rejected as a duplicate, permanently blocking the player.
- Conversely, legitimate network retries of already-committed actions could trigger duplicate execution if not tracked with atomic idempotency semantics.

---

## 2. Fixed Idempotency Semantics

### A. Non-Poisoning of Idempotency Keys on Failure
Under the Phase M.2 architecture:
- Action validation and engine simulation occur in memory before any database write is initiated.
- If validation fails (e.g. `NOT_ACTIVE_PLAYER`, `INVALID_CANDIDATE`) or engine execution throws an error:
  - No record is inserted into `match_actions`.
  - The transaction is aborted immediately.
  - The `actionId` remains completely unused and available for a corrected retry.

### B. Committed Action Idempotency
When an action succeeds and commits:
- An immutable record is created in `match_actions` with `action_id`, `match_id`, `player_id`, `action_type`, `payload`, and `created_at`.
- When a client retries the exact same `actionId`:
  1. The server detects the existing record in `match_actions` via `SessionStore.getAction(actionId)`.
  2. The server compares the submitted payload with the committed payload.
  3. If the payloads match: the server returns the previously committed outcome with `duplicate: true`, without incrementing the state version or appending duplicate events.
  4. If the payload differs materially: the server rejects the request with HTTP 409 / `PAYLOAD_CONFLICT`.

### C. Concurrency Control
- If two identical requests with the same `actionId` are submitted concurrently, SQLite's unique constraint on `(match_id, action_id)` in `match_actions` ensures that exactly one transaction succeeds in committing. The second transaction catches `DUPLICATE_ACTION_ID` and returns the committed outcome idempotently.

---

## 3. Verification Evidence

Verification was conducted via [tests/phase_m2_action_idempotency.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_m2_action_idempotency.test.js) (9 comprehensive scenarios, 100% pass):

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **WP-C 1 & 2** | Failed validation does not consume action ID; corrected retry succeeds | **PASS** |
| **WP-C 3 & 4** | Duplicate submission of committed action does not re-execute and creates no additional events | **PASS** |
| **WP-C 5** | Reused action ID with conflicting payload is rejected with HTTP 409 (`PAYLOAD_CONFLICT`) | **PASS** |
| **WP-C 6** | Concurrent duplicate submissions commit exactly once | **PASS** |
| **WP-C 7** | Two conflicting actions cannot both commit against the same state version | **PASS** |
| **WP-C 8 & 9** | Failed engine execution leaves match in last committed state without event sequence jump | **PASS** |
| **WP-C 10** | Server restart preserves successful idempotency records | **PASS** |
| **WP-C 11** | Client retry after a lost network response receives original committed outcome | **PASS** |
| **WP-C 12** | Invalid or unauthorized actions do not create committed action records | **PASS** |

**Conclusion:** Action idempotency and failed-action recovery operate with full transactional consistency.
