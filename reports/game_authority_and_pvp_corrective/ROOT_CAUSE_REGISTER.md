# ROOT CAUSE REGISTER

| ID | Category | Location | Root Cause | Fix Plan |
|---|---|---|---|---|
| RC-01 | Decision Authority | `engine/index.js:303-318` | Routes `chooser === 'opponent'` to AI without `MatchContext`; falls back to `DefaultPromptResolver` for humans | Route strictly via `MatchContext.canAiDecide(chooser)` / `canSimulate(chooser)`; pause via `InteractionController` for humans |
| RC-02 | Decision Authority | `engine/ai.js:25,136` | `AIDecider` ignores `prompt.chooser !== this.side` and always activates `BURST_TRIGGER` | Enforce `chooser === this.side` + `canAiDecide`; add strategic Burst evaluation |
| RC-03 | Decision Authority | `engine/resolver.js:865-888` | `DefaultPromptResolver` auto-accepts `BURST_TRIGGER` / `CONFIRM_OPTIONAL` regardless of mode | Keep `DefaultPromptResolver` strictly for explicit `HEADLESS_SIMULATION` / test mode; reject human auto-accept |
| RC-04 | Interaction Protocol | `engine/interaction.js:546` | `respond()` lacks `authContext` owner verification against `interaction.decisionOwner` | Enforce owner match when `authContext` is supplied |
| RC-05 | Burst / Bazzel | `battle_arena.js:10003,15051,16352-16641` | Synchronous `runAiMainStep` / missing `onResume` lets AI attack & reduce Life while Burst modal is open | Gate AI step/attack progression on `DuelState.activeBurstTrigger` & `pendingInteractions`, chain `onResume`, remove missing-modal auto-activate |
| RC-06 | Burst Engine | `engine/response_window.js:490` | Passes `this.game.events` as `promptResolver` arg to `resolveAbility` | Pass `resolver.promptResolver` (4th arg) cleanly |
| RC-07 | Matchmaking | `engine/matchmaker.js`, `engine/session_store.js` | In-memory `Map` queue/matches not shared across processes/restarts; `leaveQueue` lacks `CANCELLED` record | Back `Matchmaker` with atomic SQLite `matchmaking_tickets` table in `SessionStore` |
| RC-08 | PvP Session Sync | `battle_arena.js:4179,4333` | `resumeBattle` omits `DuelState` player/hand/field hydration; SSE handler ignores state/action updates | Add `syncDuelStateFromServerSnapshot()`, hydrate in `resumeBattle`, handle `STATE_UPDATED`/`ACTION_APPLIED`/`INTERACTION_REQUESTED` in SSE |
