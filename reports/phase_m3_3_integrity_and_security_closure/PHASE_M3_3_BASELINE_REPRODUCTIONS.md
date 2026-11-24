# PHASE M.3.3 BASELINE REPRODUCTIONS
## Forensic Defect Reproduction and Initial State Assessment

- **Project**: Battle Spirits Eternal (BSP)
- **Target Working Directory**: `C:\Users\namis\Downloads\BSP`
- **Starting Git Commit**: `4e9ffa1 fix(session_manager): ensure scrubCredentials wraps match snapshot responses`
- **Reproduction Harness**: `scripts/m3_3/reproduce_m3_3_defects.mjs`
- **Date**: 2026-11-23

---

### Executive Summary

Prior to implementing corrective Phase M.3.3 work packages, all eight reported defect classes were independently reproduced in isolated harnesses. Every defect was confirmed present in the current engine, session manager, server, and keyword modules.

---

### Defect Inventory and Baseline Reproduction Evidence

#### Defect A1: Arbitrary Card and Core Injection via SUMMON
- **Location**: `engine/session_manager.js` (lines 920–928)
- **Reproduction**:
  - Authenticated Alice submitted `{ type: 'SUMMON', card: { name: 'Arbitrary Super Spirit', bp: 99999, cost: 0, type: 'Spirit' }, cores: 100 }` with an empty hand and 0 reserve cores.
- **Observed Defect**:
  - The session router directly created the client-supplied card and assigned 100 non-existent cores, pushing the stack onto Alice's field and returning `{ success: true, stackId: 'stack_inst_1' }`.
- **Verdict**: **CONFIRMED VULNERABLE (CRITICAL)**.

#### Defect A2: Direct BP Comparison Bypass during Active Flash 2
- **Location**: `engine/response_window.js` (`resolveBattleComparison`)
- **Reproduction**:
  - `FLASH_2` response window was opened with defender holding priority.
  - A direct call was made to `game.windows.resolveBattleComparison(win)`.
- **Observed Defect**:
  - BP comparison executed immediately, destroying the blocker and terminating combat without checking whether the active `FLASH_2` window had closed.
- **Verdict**: **CONFIRMED VULNERABLE (CRITICAL)**.

#### Defect A3: Failed PLAY_CARD Actions Reported as Success
- **Location**: `engine/session_manager.js` (lines 914–919)
- **Reproduction**:
  - Player with 0 reserve cores submitted `PLAY_CARD` for a card requiring 5 cores.
- **Observed Defect**:
  - `game.playCard()` failed with `{ success: false, reason: 'INSUFFICIENT_CORES' }`.
  - However, `session_manager.js` wrapped the failure in `{ success: true, played: cardId, result: res }`, incrementing match version and committing an action record.
- **Verdict**: **CONFIRMED VULNERABLE (CRITICAL)**.

#### Defect A4: Unknown Action Types Accepted as Successful No-Ops
- **Location**: `engine/session_manager.js` (line 944) and `engine/action_authority.js`
- **Reproduction**:
  - Submitted action `{ type: 'UNRECOGNIZED_AUDIT_ACTION', bogus: true }`.
- **Observed Defect**:
  - Router fell through to `else { actionResult = { success: true, action: action.type }; }`, incrementing match version and treating an unknown action as successful.
- **Verdict**: **CONFIRMED VULNERABLE (HIGH)**.

#### Defect A5: Unrestricted Static File Disclosure
- **Location**: `server.js` (lines 1350–1365)
- **Reproduction**:
  - Static file handler serves any path relative to `__dirname` using `path.join(__dirname, safePath)`.
- **Observed Defect**:
  - Direct HTTP GET requests to `/battle_spirits.db`, `/.git/config`, `/engine/session_manager.js`, and `/reports/` are served with 200 OK without restriction.
- **Verdict**: **CONFIRMED VULNERABLE (CRITICAL)**.

#### Defect A6: Image Proxy SSRF
- **Location**: `server.js` (lines 527–565, `/api/proxy-image`)
- **Reproduction**:
  - Accepts arbitrary `url` query parameters (`http://` and `https://`) and makes outbound HTTP requests without hostname or IP allowlists.
- **Observed Defect**:
  - Allows requesting `http://localhost:...`, loopback addresses, private IP ranges (`10.0.0.0/8`, `192.168.0.0/16`), and internal metadata addresses. Redirects are followed without revalidation.
- **Verdict**: **CONFIRMED VULNERABLE (CRITICAL)**.

#### Defect A7: WebSocket Ticket Authentication Context Drop
- **Location**: `engine/websocket_server.js` (lines 105–140, 238–250)
- **Reproduction**:
  - Client connects via `?ticket=<transport_ticket>`. Ticket is redeemed, establishing `viewerSide`.
- **Observed Defect**:
  - Subsequent messages (`heartbeat`, `action`, `sync`) explicitly call `sessionManager.submitPlayerAction(matchId, msg.action, { authToken })` where `authToken` is empty. The operations fail with `AUTHENTICATION_REQUIRED`.
- **Verdict**: **CONFIRMED VULNERABLE (HIGH)**.

#### Defect A8: Keyword Regressions Baseline
- **Location**: `engine/keywords/wave1.js`, `engine/keywords/registry.js`, `engine/index.js`
- **Reproduction**: Executed `node --test tests/keyword_registry.test.js tests/keywords_waves4_5_6.test.js`.
- **Observed Failures**:
  1. Holy Life: direct hit failed to increment Life from Void (expected 4, got 3).
  2. Windstorm: opposing spirits failed to exhaust on block (expected EXHAUSTED, got REFRESHED).
  3. Ultra Holy Life: draw from deckbottom on block failed (drew 0, expected 1).
  4. True-Curse: destruction after battle failed to destroy opposing unit.
  5. Fierce Windstorm: bystanders failed to exhaust and freeze refresh on block.
  6. Ultra Awaken: unit with 4+ cores failed to refresh on BP comparison.
- **Verdict**: **CONFIRMED DEFECTIVE (HIGH)** (6 failing tests).
