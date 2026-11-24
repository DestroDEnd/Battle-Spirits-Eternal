# Burst Resolution & Lord Dragon Bazzel Verification

1. **Missing Modal Safety (`battle_arena.js:openBurstPromptModal`):**
   - Verified `if (!modal)` no longer calls `activateBurst('player', true)`; `DuelState.player.burst` remains set and `DuelState.activeBurstTrigger` remains pending.
2. **Asynchronous Continuation (`battle_arena.js:executeWhenSummonedEffects`, `runAiMainStep`, `advanceOpponentStep`):**
   - `executeWhenSummonedEffects(spirit, side, onResume)` forwards `onResume` to `checkBurstTrigger`.
   - `advanceOpponentStep` no longer advances to `ATTACK` (`phaseIndex = 5`) when `runAiMainStep()` returns `false` due to a pending Burst or Magic interaction; `pendingBurstResume` resumes AI Main Step and transitions to Attack Step only after resolution.
3. **Multiple Queued Burst Triggers (`battle_arena.js:checkBurstTrigger`, `processNextQueuedBurst`):**
   - Secondary triggers while `DuelState.activeBurstTrigger` is active are queued onto `DuelState.pendingBurstQueue` without overwriting the active trigger, deduplicated by `card.uid` + `eventType`, and drained FIFO after confirm/decline.
4. **Engine Burst `EventBus` Argument (`engine/response_window.js`):**
   - Fixed `resolveAbility` 4th argument to pass `this.game.events` / `this.events || this.game.events` cleanly.
   - Verified via `tests/eternal_17_burst_declaration.test.js` (2/2 PASS) and `tests/campaign_authority_burst_pvp_e2e.test.js`.
