# Interaction Controller Audit — Phase 2.2

**Project:** Battle Spirits Eternal (BSP)  
**Module:** `engine/interaction.js`  
**Date:** 2026-11-21T05:13:35.183Z  

---

## 1. Unified Architecture
The interaction lifecycle is governed by a single authoritative `InteractionController`:
1. Requests registered in `state.pendingInteractions` and `state.pendingPrompts`.
2. Emits `INTERACTION_REQUESTED` on the global EventBus.
3. Pauses effect resolution via awaiting Promise.
4. Resumes upon `game.submitInteractionResponse()` or `promptManager.resolve()`.
5. Emits `INTERACTION_RESOLVED` and removes interaction from pending lists.

## 2. Replay & Duplicate Submission Protection
- Tested in `tests/prompt_manager_compatibility.test.js` (COMPAT-06).
- Secondary submissions for an already resolved interaction return `ALREADY_RESOLVED_OR_STALE`.
- Prevents double-resolution race conditions and state corruption.
