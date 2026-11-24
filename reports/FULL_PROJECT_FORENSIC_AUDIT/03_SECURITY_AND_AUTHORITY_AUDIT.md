# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 03. SECURITY AND AUTHORITY AUDIT

**Subsystem:** Participant Authority, Session Isolation, Input Sanitization, and Network Security  
**Audit Status:** **CRITICAL DEFECTS IDENTIFIED**

---

### 1. Executive Security Assessment

The multiplayer and session persistence architecture was audited for token isolation, participant authority, transaction integrity, and server attack surface.

The audit verified that Phase M.2 successfully implemented credential scrubbing on snapshots (`scrubCredentials`) and token hashing using SHA-256 (`hashToken`), which prevents raw tokens from appearing in stored database snapshots.

However, **two critical vulnerabilities and three high-severity security defects** were uncovered that allow full bypass of turn authority, arbitrary game-state forgery, remote information disclosure, and Server-Side Request Forgery.

---

### 2. Detailed Security Findings

#### A. [BSP-AUD-001] Response Window Action Authorization Bypass (CRITICAL)
- **Location:** [engine/session_manager.js#L831-L842](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js#L831-L842)
- **Vulnerability:** In `session_manager.js`, lines 831-842 enforce turn-controlled action ownership (`STEP_ADVANCE`, `ATTACK`, `PLAY_CARD`, `SUMMON`, `SET_BURST`, `USE_CORE`, `END_TURN`). This check is guarded by:
  ```javascript
  if (!isWinActive && (turnControlledTypes.has(action.type) || ...))
  ```
  When a combat response window (`FLASH_1`, `BLOCK_DECLARATION`, or `FLASH_2`) is open, `isWinActive` is `true`. Therefore, `!isWinActive` evaluates to `false`, and the entire turn check is skipped.
  Furthermore, lines 806-825 only validate `STEP_ADVANCE`, `ATTACK`, and `responseWindowActions`. Actions like `PLAY_CARD`, `SUMMON`, and `USE_CORE` are **not** in `responseWindowActions` and are **not** guarded during active windows.
- **Exploitation:** While Defender holds priority in Flash 1, the Attacker (or an unauthenticated client) can submit `PLAY_CARD` or `SUMMON` actions. The server commits the action to the database, mints units, and mutates the game state during opponent priority.
- **Evidence:** Dynamically reproduced. During Bob's priority in Flash 1, Alice successfully summoned units and moved cores.

#### B. [BSP-AUD-006] Arbitrary Unit Injection and Core Minting via SUMMON (CRITICAL)
- **Location:** [engine/session_manager.js#L954-L962](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js#L954-L962)
- **Vulnerability:** The `SUMMON` action handler in `session_manager.js` directly parses client payload:
  ```javascript
  } else if (action.type === 'SUMMON') {
    const p = game.state.players[authenticatedSide];
    const cardData = action.card || { name: 'Summoned Spirit', bp: 3000, type: 'Spirit' };
    const card = createCardInstance(cardData, authenticatedSide);
    const stack = createFieldStack(card, { normal: action.cores || 1, soul: 0 });
    stack.state = 'REFRESHED';
    p.field.push(stack);
    actionResult = { success: true, stackId: stack.id };
  }
  ```
- **Exploitation:** Any authenticated player can send `{ type: 'SUMMON', card: { name: 'Titan', bp: 999999 }, cores: 100 }`. The server spawns the unit refreshed and creates 100 cores out of thin air, without verifying hand ownership, card costs, or available reserve cores.
- **Evidence:** Dynamically reproduced. An arbitrary 100-core unit was spawned on the field and persisted to SQLite.

#### C. [BSP-AUD-007] Unauthenticated Arbitrary Forward Proxy / SSRF (HIGH)
- **Location:** [server.js#L525-L585](file:///c:/Users/namis/Downloads/BSP/server.js#L525-L585)
- **Vulnerability:** `/api/proxy-image?url=...` accepts arbitrary URLs and fetches them over HTTP/HTTPS with no validation of hostnames, protocols, or private IP spaces.
- **Exploitation:** External attackers can use the server as an open forward proxy to probe internal microservices, scan local host ports (`http://localhost:8080`), or read cloud instance metadata (`http://169.254.169.254/latest/meta-data/`).
- **Evidence:** Confirmed via code analysis and local curl probe.

#### D. [BSP-AUD-008] Sensitive File & Database Disclosure via Web Root (HIGH)
- **Location:** [server.js#L1340-L1375](file:///c:/Users/namis/Downloads/BSP/server.js#L1340-L1375)
- **Vulnerability:** The static asset router in `server.js` resolves files directly from `__dirname` without blacklisting sensitive extensions or hidden dotfiles.
- **Exploitation:** Any unauthenticated caller can download `GET /battle_spirits.db` (the entire 45MB SQLite database containing player tokens, hashes, and session records) or `GET /.git/config`.
- **Evidence:** `battle_spirits.db` is 45.1 MB and sits directly in `__dirname`, accessible over HTTP.

#### E. [BSP-AUD-010] WebSocket Single-Use Transport Ticket Action Failure (MEDIUM)
- **Location:** [engine/websocket_server.js#L238-L245](file:///c:/Users/namis/Downloads/BSP/engine/websocket_server.js#L238-L245)
- **Vulnerability:** When clients upgrade via `?ticket=...`, `authToken` is undefined. `submitPlayerAction` requires `authToken`, causing all subsequent WebSocket actions to fail with `AUTHENTICATION_REQUIRED`.

---

### 3. Credential Isolation & Token Lifecycle Audit

1. **Token Generation:** Uses `crypto.randomBytes(24).toString('hex')` prefixed with role identifier (`p1_`, `p2_`, `match_`). High entropy, cryptographically secure.
2. **Token Storage:** `session_store.js` stores `player1_token_hash` and `player2_token_hash` using SHA-256 (`hashToken`). Raw tokens are not stored in table columns.
3. **Snapshot Scrubbing:** `state_serialization.js` and `session_manager.js` call `scrubCredentials()` before saving snapshots or emitting events, redacting `authToken` and token hashes.
4. **Spectator Isolation:** Verified. Spectators querying `getPlayerMatchState` receive redacted states without private hands or player credentials.
