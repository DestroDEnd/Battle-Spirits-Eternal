# IMPLEMENTATION CHANGELOG

## Modified Files
1. **`engine/ai.js`**
   - Added strict decision-ownership guard in `AIDecider.decide()` (`owner !== this.side` or `!state.matchContext.canAiDecide(this.side)` returns `null`).
   - Replaced unconditional `BURST_TRIGGER` `{ activate: true }` with strategic Burst evaluation (`strategy === 'hold'`, life threshold, opponent field presence, or card value).
2. **`engine/index.js`**
   - Replaced hardcoded `prompt.chooser === 'opponent'` AI routing in `createGame` (`resolverDelegate.choose`) with `MatchContext`-driven routing (`canAiDecide(chooser)`, `aiProviders`, `isHuman(chooser)` -> `interactionController.request(prompt)`, and `DefaultPromptResolver` restricted to `HEADLESS_SIMULATION` / non-human fallback).
3. **`engine/interaction.js`**
   - Added `authContext.playerSide` support alongside `authContext.responder` / `authContext.player` in `validateInteractionResponse`.
4. **`engine/response_window.js`**
   - Added `skipInteractionSync: true` in `openBurstWindow()` when opening the parent Burst `RESPONSE_WINDOW` so `openWindow()` does not create an orphaned duplicate `ACTIVATE_EFFECT` interaction alongside the `BURST_TRIGGER` prompt.
   - Marked `BURST_TRIGGER` prompt `optional: true` so players can decline Bursts cleanly.
   - Accepted `'AFTER_OPPONENT_SUMMON'` as an alias of `'AFTER_OPPONENT_SUMMON_EFFECT'` in `matchesBurstCondition`.
   - Fixed `resolveAbility` 4th argument at line 490 from `this.game.events` to `resolver.promptResolver`.
5. **`engine/session_store.js`**
   - Added `matchmaking_tickets` SQLite table and indexes (`idx_mm_status_queued`, `idx_mm_player_status`) in `initSchema()`.
6. **`engine/matchmaker.js`**
   - Rewrote `Matchmaker` to persist and pair tickets atomically via SQLite `BEGIN IMMEDIATE` transactions in `SessionStore.db` (with in-memory fallback when no DB is attached).
   - Added `resolveDeckCards()` to load real 40-card decks from `standard_decks_data.json` + `data/cards_detailed.json` when matchmaking supplies a `deckId` string.
   - Enforced `CANCELLED` status persistence in `leaveQueue()` so cancelled tickets cannot be paired afterward.
7. **`battle_arena.js`**
   - Removed missing-modal auto-activation of human Bursts in `openBurstPromptModal`.
   - Preserved/chained `DuelState.pendingBurstResume` in `checkBurstTrigger` and prevented AI Burst auto-resolution in `HUMAN_VS_HUMAN` / `isOnline` mode.
   - Added Burst/interaction pause guards in `runAiMainStep` and `runAiAttackStep` so AI attacks and Life damage cannot proceed while a player Burst prompt is pending.
   - Added `syncDuelStateFromServerSnapshot()`, hydrated `DuelState` in `resumeBattle()`, and wired `STATE_UPDATED` / `ACTION_APPLIED` / `RESPONSE_WINDOW_UPDATED` / `INTERACTION_REQUESTED` / `MATCH_ENDED` in `handleRealtimeMatchEvent()`.
8. **`assets/tabletop_mat.js`**
   - Fixed an infinite `MutationObserver` loop in `syncBoardPeekButton()` caused by unconditional `btn.textContent` assignment and unguarded `document.body.classList.remove('arena-peeking-board')`, adding a `_syncingPeek` re-entrancy guard.

## New Tests Added
- `tests/game_authority_and_burst.test.js` (`AUTH-01`, `AUTH-02`, `AUTH-03`)
- `tests/pvp_matchmaking_and_browser_e2e.test.js` (`PVP-MM-01`, `PVP-BROWSER-02`)
