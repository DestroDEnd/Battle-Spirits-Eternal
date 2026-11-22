# Battle Spirits Eternal — Phase M.1 Connection Lease Report

**Document:** `PHASE_M1_CONNECTION_LEASE_REPORT.md`  
**Phase:** Phase M.1 (Persistent Multiplayer Integrity & Reconnection Remediation)  
**Authoritative Location:** `c:\Users\namis\Downloads\BSP\reports\phase_m1\PHASE_M1_CONNECTION_LEASE_REPORT.md`  
**Classification:** WORK PACKAGE E IMPLEMENTATION REPORT  
**Date:** November 2026  

---

## 1. Problem Definition & Known Defect

In Phase M, player disconnection relied exclusively on voluntary calls to `POST /api/sessions/:matchId/leave` triggered by UI button clicks or window `beforeunload` events.
However, in real browser environments:
- Tab termination, browser force-close, power loss, or network dropouts rarely guarantee that `beforeunload` executes.
- Consequently, when a player unexpectedly dropped off, the server continued treating them as actively connected.
- If it was that player's turn, their turn clock continued ticking down to 00:00, leading to an unfair timeout loss rather than suspending or recognizing a disconnect.

---

## 2. Technical Remediation

### 2.1 Connection Lease Architecture
Implemented a server-authoritative connection lease subsystem in [`engine/session_manager.js`](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js#L425-L555):
- **Heartbeat Protocol:** Clients transmit periodic heartbeats every 5,000ms via `POST /api/sessions/:matchId/heartbeat` or WebSocket messages.
- **Lease Expiration Threshold:** 15,000ms. If no heartbeat is received within 15 seconds, the player's lease is deemed expired.
- **Suspected Timeout Threshold:** 8,000ms.
- **Connection Lifecycle States:**
  - `CONNECTED`: Active heartbeats received within lease duration.
  - `SUSPECTED_DISCONNECTED`: 8-15s elapsed without heartbeat.
  - `DISCONNECTED`: > 15s elapsed without heartbeat.
  - `RECONNECTED`: Successful authentication via `reconnectToMatch()`.

### 2.2 Dual-Disconnect Clock Pause Policy
- When a single human player disconnects:
  - Match status becomes `PLAYER_DISCONNECTED`.
  - The active player's clock continues running (preventing deliberate disconnect stalling).
- When **both** players disconnect:
  - Match status transitions to `SUSPENDED`.
  - The turn clock is paused with `pauseReason = 'BOTH_PLAYERS_DISCONNECTED'`.
  - When either player reconnects, the clock resumes with the exact remaining time preserved.

### 2.3 Server Restart Reconciliation
In [`engine/session_manager.js`](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js#L540-L565):
Added `reconcileStaleConnections()`:
- Executed on server startup.
- Inspects all active sessions and resets human player `connected` flags to `false`.
- Prevents phantom "connected" players after an unexpected server crash or restart.

---

## 3. Automated Verification Evidence

Suite: [`tests/phase_m1_connection_lease.test.js`](file:///c:/Users/namis/Downloads/BSP/tests/phase_m1_connection_lease.test.js)  
Execution command: `node --test tests/phase_m1_connection_lease.test.js`  
Result: **6/6 Tests Passed (100.00%)**

| Test Case | Scenario | Verified Invariant | Status |
|---|---|---|---|
| **Test 1** | Periodic heartbeats | Active heartbeats maintain `connected = true` and valid lease | `PASS` |
| **Test 2** | Lease expiration | Absence of heartbeat for 16s transitions player to `DISCONNECTED` | `PASS` |
| **Test 3** | Dual disconnect pause | When both drop, match status becomes `SUSPENDED` and clock pauses | `PASS` |
| **Test 4** | Clean reconnection | Reconnecting participants restore original slot; clock resumes | `PASS` |
| **Test 5** | Server restart reconciliation | Stale connected flags reset to false upon restart | `PASS` |
| **Test 6** | Heartbeat idempotency | Frequent rapid heartbeats are completely harmless and idempotent | `PASS` |

---

## 4. Acceptance Status

**WORK PACKAGE E: FULLY ACCEPTED.**  
Browser and tab closures are reliably detected through server-authoritative connection leases without relying on fragile client-side unload hooks.
