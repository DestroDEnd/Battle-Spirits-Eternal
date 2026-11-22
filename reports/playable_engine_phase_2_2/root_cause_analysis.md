# Root Cause Analysis — Phase 2.2

**Project:** Battle Spirits Eternal (BSP)  
**Date:** 2026-11-21T05:13:35.166Z  

---

## 1. Defect 1: Coverage Metric Inconsistency
- **Observation:** Phase 2 completion report claimed 26,843 FULLY_SUPPORTED clauses while the JSON inventory reported 26,777 clauses.
- **Root Cause:** `generate_phase_2_deliverables.mjs` calculated metrics in a JavaScript object, but hardcoded estimated string literals into several Markdown templates.
- **Resolution:** Replaced all hardcoded markdown literals with dynamic variables interpolated directly from the single-source-of-truth inventory object (`tierTotals`). Added automated consistency assertions enforcing that tier sums equal exactly 51,734 clauses.

## 2. Defect 2: PromptManager Asynchronous Contract Regression
- **Observation:** `node --test tests/phase5_windows_ai.test.js` failed on PromptManager resolution: Expected `{ accepted: true }`, received `{ accepted: true, declined: false, selected: [] }`.
- **Root Cause:** When the formal Interaction Protocol was added in Phase 2, `PromptManager.resolve` began returning the synthesized structured interaction payload (`validation.value`) to the awaiting Promise, breaking legacy callers that assert strict deep equality on simple response shapes.
- **Resolution:** Established a deliberate compatibility boundary in `engine/interaction.js` and `engine/prompt_manager.js`. When a prompt is requested via `PromptManager.request`, it is flagged with `isLegacyPrompt: true`. Resolving it provides the exact caller response to the Promise while saving the structured normalized interaction payload internally.

## 3. Defect 3: Split-Brain Interaction Controllers
- **Observation:** `PromptManager` maintained an independent `pendingQueue`, while `InteractionController` maintained `pendingResolvers`, causing event and state synchronization failures when UI and engine interacted.
- **Root Cause:** Separate controller instantiation in `BSEngineAdapter.initDuelSession`.
- **Resolution:** Unified controller ownership: `PromptManager` now wraps and delegates directly to `InteractionController`, sharing the same `state.pendingInteractions` and `state.pendingPrompts`.
