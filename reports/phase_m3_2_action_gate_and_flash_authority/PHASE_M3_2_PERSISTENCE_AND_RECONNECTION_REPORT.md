# PHASE M.3.2 PERSISTENCE AND RECONNECTION REPORT
## Response Window State Serialization, SQLite Persistence & Client Reconnection

- **Modules**: `engine/state_serialization.js`, `engine/session_store.js`, `engine/session_manager.js`, `engine/response_window.js`
- **Test Suite**: `tests/phase_m3_2_response_window_persistence.test.js`
- **Date**: 2026-11-23

---

### 1. State Invariants Preserved Across Persistence

To support seamless reconnection across page refreshes, navigation away from the arena, network drops, and server cold-restarts, the serialized state includes full response window metadata:

- `responseWindow`: The active top-level window descriptor.
- `responseWindowStack`: Complete stack of active and suspended response windows.
- `priorityPlayer`: Current priority owner (`'player'` or `'opponent'`).
- `consecutivePasses`: Number of consecutive passes accumulated.
- `responseHistory`: Chronological log of responses and Flash actions in this window.
- `resolutionStatus`: Status of window (`'OPEN'`, `'RESOLVING'`, `'SUSPENDED'`).
- `combat`: Attacker and blocker stack IDs and sides.

---

### 2. Candidate Recalculation on Restoration

When a game is deserialized and reconstructed via `createGame({ state: restoredState })`:

1. `ResponseWindowManager` initializes its internal `windowStack` from `restoredState.responseWindowStack || [restoredState.responseWindow]`.
2. Rather than trusting stale client-provided candidate lists, `refreshWindowCandidates(activeWindow)` is automatically invoked.
3. Poisoned or tampered client candidate requests (e.g. injected actions) are wiped, recalculating authentic, legal response actions based solely on current board and reserve states (`tests/phase_m3_2_response_window_persistence.test.js:M3.2-L7-03`).

---

### 3. Redacted State Views for Opposing Viewers

In `engine/state_serialization.js`, `redactGameStateForViewer(state, viewerSide)` preserves response window metadata (so the opponent sees whose priority it is and what window is active) while strictly masking:
- Face-down burst cards.
- Hidden hand cards of the opposing player (named `'Hidden Card'`).
- Deck order and contents.

---

### 4. Verification Evidence

Validated in `tests/phase_m3_2_response_window_persistence.test.js`:
- `M3.2-L7-01`: Active Flash 1 window and priority survive serialization and reconstruction (PASS).
- `M3.2-L7-02`: Block Declaration window survives SessionStore persistence and reload (PASS).
- `M3.2-L7-03`: Fresh candidate calculation on state restore avoids trusting stale client data (PASS).
- `M3.2-L7-04`: Redacted game state view masks opponent hidden cards while exposing response window (PASS).
