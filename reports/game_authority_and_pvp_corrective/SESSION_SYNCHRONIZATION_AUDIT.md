# SESSION SYNCHRONIZATION AUDIT

## Inspected Modules
- `battle_arena.js` (`resumeBattle`, `handleRealtimeMatchEvent`, `connectSessionStream`, `currentSessionInfo`)
- `server.js` (`/api/sessions/*`)
- `engine/session_manager.js`

## Root Causes
1. **`resumeBattle(matchId, authToken)` does not hydrate `DuelState` (`battle_arena.js:4333-4345`):**
   - Sets `DuelState.inDuel = true`, `DuelState.turn`, and `DuelState.activePlayer`, then calls `renderDuelTable()` and `renderPlayerHand()` without copying `data.state.players` into `DuelState.player` / `DuelState.opponent` (perspective-mapped by `currentSessionInfo.playerSide`) or setting `DuelState.isOnline = true` and `DuelState.mode = 'HUMAN_VS_HUMAN'`.
2. **`handleRealtimeMatchEvent` ignores gameplay state events (`battle_arena.js:4179`):**
   - Only handles `PLAYER_JOINED`, `PLAYER_RECONNECTED`, and `CONNECTION_STATE_CHANGED`. `STATE_UPDATED`, `ACTION_APPLIED`, `INTERACTION_REQUESTED`, and `RESPONSE_WINDOW_UPDATED` are ignored, so Player B never sees Player A's actions in real time.
3. **Storage key consistency:**
   - `resumeBattle` saves `bse_active_match_id` and `handleMatchFound` saves `bse_active_match_id`, `bse_active_auth_token`, `bse_player_side`, but `resumeBattle` should also persist `bse_active_auth_token` and `bse_player_side` and expose a clean `syncDuelStateFromServerSnapshot` helper.
