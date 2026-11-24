# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 06. SESSION PERSISTENCE AND NETWORK AUDIT

**Subsystem:** SQLite Storage, Session Management, Reconnection, WebSockets, and Networking  
**Audit Status:** **CRITICAL RESTORATION & WEBSOCKET ACTION DEFECTS IDENTIFIED**

---

### 1. Persistence Architecture & SQLite Schema

Session persistence is handled by [engine/session_store.js](file:///c:/Users/namis/Downloads/BSP/engine/session_store.js) using Node.js built-in `node:sqlite`:
- Default database file: `battle_spirits.db` (supports override via `DB_PATH` environment variable).
- Tables:
  1. `match_sessions`: Primary session record (`id`, `mode`, `status`, `player1_id`, `player1_token_hash`, `player2_id`, `player2_token_hash`, `state`, `version`, `active_player`, `turn_number`, `phase`).
  2. `match_clocks`: Turn timer state (`turn_duration_ms`, `deadline_ms`, `paused`).
  3. `match_actions`: Monotonic action ledger (`match_id`, `action_id`, `player_id`, `action_type`, `payload`).
  4. `match_events`: Sequenced event stream (`match_id`, `seq`, `type`, `payload`).

---

### 2. Forensic Findings in Persistence & Networking

#### A. [BSP-AUD-009] Complete Response Window Loss Upon Session Restoration / Reconnect (HIGH)
- **Files:** [engine/response_window.js#L55-L60](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js#L55-L60), [engine/session_manager.js#L1040-L1080](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js#L1040-L1080)
- **Vulnerability:**
  - While `state.responseWindow` is saved in SQLite snapshots, when a match is restored via `restoreMatch(matchId)`:
    ```javascript
    const restoredState = deserializeGameState(session.state);
    const game = createGame({ state: restoredState, ... });
    ```
  - `ResponseWindowManager` constructor initializes:
    ```javascript
    this.windowStack = [];
    ```
    It never re-populates `windowStack` from `restoredState.responseWindow`.
  - As a result, `game.windows.getCurrentWindow()` returns `null`.
  - Any subsequent call to `passPriority()` fails with `NO_ACTIVE_RESPONSE_WINDOW`.
  - Any subsequent call to `declareAttack()` fails with `COMBAT_ALREADY_IN_PROGRESS` (because `state.combat` is preserved).
- **Impact:** Reconnecting or reloading a match during combat causes permanent game deadlocks.

#### B. [BSP-AUD-010] WebSocket Single-Use Transport Ticket Action Submission Failure (MEDIUM)
- **Files:** [engine/websocket_server.js#L112-L130](file:///c:/Users/namis/Downloads/BSP/engine/websocket_server.js#L112-L130), [L238-L245](file:///c:/Users/namis/Downloads/BSP/engine/websocket_server.js#L238-L245)
- **Vulnerability:** When a player connects to the WebSocket via `?ticket=...`, `redeemTransportTicket` validates the ticket and establishes the connection. However, `authToken` remains `undefined`.
  When the client sends an action over WebSocket:
  ```javascript
  const actionResult = await sessionManager.submitPlayerAction(matchId, msg.action, { authToken });
  ```
  `submitPlayerAction` throws `AUTHENTICATION_REQUIRED: Missing mandatory authentication token`.
- **Impact:** Ticket-authenticated WebSocket connections cannot submit actions or record heartbeats.

#### C. [BSP-AUD-021] Failed PLAY_CARD Actions Committing to Database Ledger (MEDIUM)
- **Files:** [engine/session_manager.js#L946-L953](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js#L946-L953)
- **Vulnerability:** When `game.playCard` returns `{ success: false, reason: 'NOT_ENOUGH_CORES' }`, `session_manager.js` sets:
  ```javascript
  actionResult = { success: true, played: cardId, result: res };
  ```
  This treats the failed card play as a success, committing it to SQLite and appending `ACTION_PLAY_CARD` to the permanent event ledger.

---

### 3. Connection Leases and Turn Clock

- **Turn Clock:** Standard 240,000 ms (4 minutes) per turn, warning threshold at 60,000 ms.
- **Heartbeat & Lease Management:** 10,000 ms connection lease. If heartbeats cease for >10s, connection is flagged disconnected.
- **Durable Transactions:** `commitActionTransaction` runs inside an atomic SQLite transaction (`BEGIN IMMEDIATE ... COMMIT`), preventing concurrent version collisions.
