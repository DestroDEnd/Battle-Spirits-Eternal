# INITIAL FORENSIC AUDIT — GAME AUTHORITY, INTERACTION & PVP MATCHMAKING

## Baseline Git State
- **HEAD Commit:** `4e9ffa1728486bb9f8bb4b4a83287873c3d36d3a`
- **Working Tree Entries:** 264 entries (`git status --short | Measure-Object -Line`), including prior Phase K.1, L, L.1, M, M.1–M.4, magic correction, and ShapeGrid assets — all preserved.

## Executive Findings
1. **Decision Authority Leaks (`engine/index.js`, `engine/ai.js`, `engine/resolver.js`, `battle_arena.js`):**
   - `engine/index.js:307` routes `prompt.chooser === 'opponent'` directly to `options.ai.decide()` without consulting `state.matchContext.canAiDecide(chooser)`, and falls through to `DefaultPromptResolver` (`engine/resolver.js:881`) which auto-returns `{ activate: true }` for `BURST_TRIGGER` and `{ accepted: true }` for `CONFIRM_OPTIONAL`.
   - `AIDecider.decide()` (`engine/ai.js:25, 136`) never verifies `prompt.chooser === this.side` and unconditionally returns `{ activate: true }` for `BURST_TRIGGER`.
   - `battle_arena.js:15051` auto-activates human Burst if `#battleBurstPromptModal` is missing.
2. **Burst & Lord Dragon Bazzel Asynchronous Race (`battle_arena.js`, `engine/response_window.js`):**
   - `battle_arena.js:10003` calls `checkBurstTrigger(enemySide, "AFTER_OPPONENT_SUMMON_EFFECT", { spirit })` without passing an `onResume` continuation, and `runAiMainStep()` (`battle_arena.js:16352-16477`) runs synchronously without suspending when `DuelState.activeBurstTrigger` opens.
   - Subsequent `runAiAttackStep()` executes direct Life damage (`DuelState.player.life -= 1`) and calls `checkBurstTrigger('player', 'AFTER_LIFE_DECREASED', ...)`, overwriting `DuelState.activeBurstTrigger` and closing/replacing the pending Burst modal while the player has not yet responded.
   - `engine/response_window.js:490` passes `this.game.events` as the 4th positional argument (`promptResolver`) to `resolver.resolveAbility(state, ab, context, promptResolver)`.
3. **PvP Random Matchmaking & Session Sync (`engine/matchmaker.js`, `battle_arena.js`):**
   - `Matchmaker` (`engine/matchmaker.js:32-33`) uses process-local `Map`s (`this.queue`, `this.matches`) instead of shared SQLite persistence in `SessionStore`, and `leaveQueue()` does not record `CANCELLED` status.
   - `battle_arena.js:4333-4345` (`resumeBattle`) sets `DuelState.inDuel = true` without hydrating `DuelState.player` / `DuelState.opponent` from `data.state.players` or setting `DuelState.isOnline = true` / `DuelState.mySide`.
   - `battle_arena.js:4179` (`handleRealtimeMatchEvent`) ignores `STATE_UPDATED`, `ACTION_APPLIED`, `INTERACTION_REQUESTED`, and `RESPONSE_WINDOW_UPDATED` SSE events.
