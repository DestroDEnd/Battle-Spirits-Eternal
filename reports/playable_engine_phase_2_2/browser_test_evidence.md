# Browser Test Evidence — Phase 2.2

**Project:** Battle Spirits Eternal (BSP)  
**Test File:** `tests/browser_arena_gameplay.test.js`  
**Date:** 2026-11-21T05:13:35.202Z  

---

## 1. 16-Step Verification Trace
```
[Step 1]  Initialize browser DOM environment (window, document, arenaBoard, life zones).
[Step 2]  Load valid 40-card Red and Purple decks (strict max 3 copies/name).
[Step 3]  Initialize duel session via BSEngineAdapter.initDuelSession().
[Step 4]  Render board states: Life 5/5, Reserves 4/4 cores.
[Step 5]  Draw 4-card opening hands.
[Step 6]  Progress to MAIN Step on Turn 1 (skipping Core, Draw, Attack).
[Step 7]  Calculate effective cost (3 cores) and verify canAffordCost.
[Step 8]  Pay cost from reserve to trash; summon Spirit to field.
[Step 9]  Trigger "WHEN_SUMMONED" ability requiring target spirit.
[Step 10] Catch INTERACTION_REQUESTED; verify UI modal rendered with candidates.
[Step 11] Select opponent spirit candidate in UI and submit response.
[Step 12] Verify ability resolves exactly once.
[Step 13] Verify target spirit transitioned from REFRESHED to EXHAUSTED.
[Step 14] Advance turn to Turn 2 (Opponent turn); traverse to ATTACK step.
[Step 15] Opponent declares attack; resolve unblocked direct hit; Player life 5 -> 4.
[Step 16] Advance turn to Turn 3 (Player turn); verify active player and step.
```
**Result:** **1 / 1 PASS** with zero mock state tampering.
