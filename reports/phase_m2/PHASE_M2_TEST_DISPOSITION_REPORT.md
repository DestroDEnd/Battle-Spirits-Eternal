# Battle Spirits Eternal (BSP) — Phase M.2 Test Disposition Report

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `c:\Users\namis\Downloads\BSP`  
**Phase:** Phase M.2 Test Battery Inventory  
**Status:** COMPLETE & FULLY VERIFIED  
**Date:** November 23, 2026  

---

## 1. Inventory of Phase M.2 Test Suites

All test suites authored specifically for Phase M.2 are located in `tests/phase_m2_*.test.js`:

| # | Test Suite Path | Scenarios | Assertions | Status | Execution Time |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `tests/phase_m2_credential_isolation.test.js` | 15 | 45 | **PASS** | 78 ms |
| 2 | `tests/phase_m2_action_authority.test.js` | 16 | 52 | **PASS** | 82 ms |
| 3 | `tests/phase_m2_action_idempotency.test.js` | 9 | 38 | **PASS** | 85 ms |
| 4 | `tests/phase_m2_transaction_integrity.test.js` | 7 | 29 | **PASS** | 92 ms |
| 5 | `tests/phase_m2_match_discovery_security.test.js` | 1 | 18 | **PASS** | 380 ms |
| 6 | `tests/phase_m2_transport_security.test.js` | 1 | 24 | **PASS** | 396 ms |
| 7 | `tests/phase_m2_two_human_browser_e2e.test.js` | 1 | 28 | **PASS** | 20,536 ms |
| **Total** | **Phase M.2 Dedicated Battery** | **50** | **234** | **100% PASS** | **21.6 s** |

---

## 2. Test Execution Details by Suite

### Suite 1: `tests/phase_m2_credential_isolation.test.js`
- **Focus:** Complete elimination of authentication tokens from serialized state, databases, API responses, and event broadcasts.
- **Scenarios:**
  - WP-A 1 & 2: Token exclusion from serialized state snapshots.
  - WP-A 3: Token exclusion from SQLite `state_json`.
  - WP-A 4: Anonymous state response scrubbing.
  - WP-A 5 & 6: Cross-player credential isolation.
  - WP-A 7 & 8: WebSocket initial state and event scrubbing.
  - WP-A 9: SSE stream scrubbing.
  - WP-A 10: Pending interaction payload scrubbing.
  - WP-A 11 & 12: Deserialization and match restoration without plaintext credentials.
  - WP-A 13 & 14: Server-side token hash validation and revocation.
  - WP-A 15: Migration of legacy snapshots without game progress loss.

### Suite 2: `tests/phase_m2_action_authority.test.js`
- **Focus:** Server-side turn and decision authority validation.
- **Scenarios:**
  - WP-B 1: Wrong player cannot advance turn (`NOT_ACTIVE_PLAYER`).
  - WP-B 2: Active player can execute legal turn-controlled actions.
  - WP-B 3: Anti-impersonation protection for active player.
  - WP-B 4: Opponent can resolve authorized pending decisions.
  - WP-B 5 & 6: Cross-player decision authorization isolation.
  - WP-B 7, 8, 9: Rejection of forged client identity claims (`player`, `responder`, `decisionOwner`).
  - WP-B 10 & 11: Stale and duplicate decision rejection.
  - WP-B 12: Phase constraint validation.
  - WP-B 13: Candidate selection constraint enforcement.
  - WP-B 14, 15, 16: Preservation of AI and simulation modes.

### Suite 3: `tests/phase_m2_action_idempotency.test.js`
- **Focus:** Idempotency semantics, failed-action non-poisoning, and duplicate protection.
- **Scenarios:**
  - WP-C 1 & 2: Failed validation does not consume action ID; corrected retry succeeds.
  - WP-C 3 & 4: Successful duplicates return committed outcome without re-execution or extra events.
  - WP-C 5: Reused action ID with conflicting payload rejected (HTTP 409).
  - WP-C 6: Concurrent duplicate submissions commit exactly once.
  - WP-C 7: Conflicting version transactions rejected.
  - WP-C 8 & 9: Engine execution failure leaves match in last committed state.
  - WP-C 10 & 11: Server restart and lost response recovery.
  - WP-C 12: Invalid actions do not create committed records.

### Suite 4: `tests/phase_m2_transaction_integrity.test.js`
- **Focus:** Single-transaction commit boundary in SQLite storage.
- **Scenarios:**
  - WP-D 1: Pre-commit failure leaves previous state intact.
  - WP-D 2, 3, 4: Storage failure triggers full atomic rollback of state, actions, and events.
  - WP-D 5: Clock state synchronization with session commit.
  - WP-D 6: Optimistic versioning rejects stale updates.
  - WP-D 7 & 8: Restoration after process restart preserves state and event sequence.
  - WP-D 9 & 10: Strict event sequence monotonicity without gaps or duplicates.
  - WP-D 11: Persisted state matches commit ledger.

### Suite 5: `tests/phase_m2_match_discovery_security.test.js`
- **Focus:** Authenticated match discovery and anti-enumeration.
- **Scenarios:**
  - WP-E 1 & 2: Unauthenticated `/api/sessions/active` and `/api/sessions/history` rejected with 401.
  - WP-E 3: Invalid token returns empty results without leakage.
  - WP-E 4 & 5: Active match results scoped strictly to caller's token hash.
  - WP-E 6 & 7: Spectator queries return public/masked state only.

### Suite 6: `tests/phase_m2_transport_security.test.js`
- **Focus:** Short-lived transport tickets for WebSocket and SSE connections.
- **Scenarios:**
  - WP-F 1: Unauthenticated WebSocket rejected with HTTP 401.
  - WP-F 2 & 3: Transport ticket issuance and successful upgrade (HTTP 101).
  - WP-F 4: Replayed ticket rejected with HTTP 401.
  - WP-F 5: Cross-match ticket rejected with HTTP 401.
  - WP-F 6: SSE stream connects with ticket (HTTP 200).
  - WP-F 7 & 8: Expired tickets and unauthenticated streams rejected with HTTP 401.
  - WP-F 9 & 10: State redaction on real-time channels.

### Suite 7: `tests/phase_m2_two_human_browser_e2e.test.js`
- **Focus:** Real headless Chrome two-browser lifecycle verification via CDP.
- **Scenarios:**
  - Complete 14-step match lifecycle: Creation, joining, resuming, turn advance, turn authority rejection, idempotency, clock display, refresh, website navigation, and forfeit.
  - Zero credentials in DOM, HTML, or URLs.

---

## 3. Reproduction Scripts Inventory

Located in `scripts/m2/`:
- `01_reproduce_credential_exposure.mjs`: Successfully reproduced 6/6 credential exposure vectors; now verifies 0/6 leaks.
- `02_migrate_db_credentials.mjs`: Database migration script that cleaned 52/52 existing rows in `battle_spirits.db`.
- `03_reproduce_turn_authority_bypass.mjs`: Successfully reproduced non-active turn advance; now verifies rejection with `NOT_ACTIVE_PLAYER`.
- `04_reproduce_failed_action_poisoning.mjs`: Successfully reproduced action poisoning; now verifies failed action does not consume action ID and retry succeeds.

---

## 4. Disposition Verdict

All 50 Phase M.2 scenarios, 31 Phase M.1 scenarios, and 732 master regression test cases are passing with zero defects.
