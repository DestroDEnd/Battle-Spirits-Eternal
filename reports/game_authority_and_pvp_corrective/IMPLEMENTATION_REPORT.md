# Implementation Report — M4 + Magic + Game Authority + Burst + PvP Campaign

**Project:** Battle Spirits Eternal (BSP)  
**Baseline Commit:** `4e9ffa1`  
**Date:** 2026-11-24  

## 1. Root Causes & Architectural Changes
1. **Universal Decision Authority (WP2 — `engine/index.js`, `engine/resolver.js`, `engine/interaction.js`):**
   - Replaced hardcoded `chooser === 'opponent'` fallback with strict `MatchContext.canAiDecide(chooser)`, `MatchContext.isHuman(chooser)`, and `MatchContext.canSimulate(chooser)` routing in `engine/index.js`, tagging prompts with `decisionOwner`, `executionMode`, and `controlType`.
   - Added explicit `HUMAN_INTERACTION_UNROUTABLE` errors in `engine/index.js` and `DefaultPromptResolver` (`engine/resolver.js`) when a human-owned decision lacks an interactive controller, listener, or suspend handler, and removed unconditional auto-acceptance for `BURST_TRIGGER`, `CONFIRM_OPTIONAL`, `CONFIRM_ACTION`, `OPTIONAL_TRIGGER`, and `ACTIVATE_EFFECT` outside authorized `HEADLESS_SIMULATION`.
2. **AI Decision Integrity (WP3 — `engine/ai.js`):**
   - Normalized `prompt.requestType || prompt.type`, enforced `owner === this.side` + `canAiDecide(this.side)`, filtered `BLOCK_CHOICE` via `canBlock(state, st)` and `prompt.candidates`, respected `responseWindow.priorityHolder` in `FLASH_ACTION`, and replaced unconditional `BURST_TRIGGER` activation with board-utility evaluation (mandatory check, low-life/field-presence check, removal-target check).
3. **Burst Resolution & Lord Dragon Bazzel (WP4 — `engine/response_window.js`, `battle_arena.js`):**
   - Restored `this.game.events` / `this.events || this.game.events` as the 4th (`events`) argument to `resolver.resolveAbility()` in `engine/response_window.js` (fixing `TypeError: events.emit is not a function` in `eternal_17_burst_declaration.test.js`).
   - Updated `executeWhenSummonedEffects`, `runAiMainStep`, and `advanceOpponentStep` in `battle_arena.js` so AI Main Step pauses and chains `pendingBurstResume` before Soul Core placement and Attack Step when a human Burst triggers.
   - Added `DuelState.pendingBurstQueue` + `processNextQueuedBurst()` so multiple Burst triggers queue FIFO without overwriting `DuelState.activeBurstTrigger`, while keeping missing-modal auto-activation disabled.
4. **Persistent PvP Matchmaking & Realtime Sync (WP5–WP6 — `engine/matchmaker.js`, `battle_arena.js`):**
   - Added stale `'PAIRING'` ticket cleanup in `Matchmaker.pruneStaleTickets()` alongside SQLite `BEGIN IMMEDIATE` atomic pairing and `'CANCELLED'` persistence.
   - Added `lastSeq` and `lastVersion` monotonicity guards in `handleRealtimeMatchEvent()` and `syncDuelStateFromServerSnapshot()`, plus `phaseIndex`, `responseWindow`, and pending-interaction restoration in `resumeBattle()`.

## 2. Files Modified
- `engine/index.js`
- `engine/resolver.js`
- `engine/ai.js`
- `engine/response_window.js`
- `engine/matchmaker.js`
- `battle_arena.js`
- `tests/helpers/real_browser.js` (20s server startup timeout for Windows load)
- `tests/random_matchmaking.test.js` (updated cancel expectation to `'CANCELLED'` and isolated `DB_PATH`)
- `tests/campaign_authority_burst_pvp_e2e.test.js` (new WP2–WP4 & WP10 two-human real browser E2E suite)
