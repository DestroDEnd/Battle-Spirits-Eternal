# Corrective Issues Identified — Phase 2 Audit

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Date:** 2026-11-21  

---

## 1. Issue 1 — Coverage Reporting Inflation & Lack of Tiered Classification

### Description
In prior work packages, reports stated that 100% of the 51,734 compiled clauses across all 514 shards were "fully supported". This was a dangerous inflation of progress:
- Mere presence of a `switch (op.type)` branch or fallback return in `engine/ops/index.js` was tallied as "complete".
- Operations like `KEYWORD_RULE` (accounting for 3,421 clauses) and `COST_MODIFIER` (1,842 clauses) were counted as fully supported even though specific complex conditions (e.g. cross-color reduction limits, burst-reduction timing) lacked regression test assertions.

### Root Cause
Reporting scripts checked whether an opcode had an entry in the handler dictionary without verifying whether that handler had passing unit tests, state mutation assertions, or event emission validations.

---

## 2. Issue 2 — 17 Real-Card Regression Test Failures

### Description
In the baseline test suite `tests/work_package_hij_real_cards_e2e.test.js`, 17 specific cards failed or were inadequately verified:
- **10 Kamen Rider Bounce Cards:** Kamen Rider self-bounce abilities (`CB04-012`, `CB06-004`, `CB08-011`, `CB08-014`, `CB09-009`, `CB09-012`, `CB10-008`, `CB10-011`, `CB12-005`, `CB15-010`).
- **1 Burst Bounce Card:** `26RBS02-X14` (White Burst bounce on opponent attack).
- **6 Exhaust Cards:** `BATTLE-SPIRITS-A6513`, `BATTLE-SPIRITS-A9188`, `BATTLE-SPIRITS-A9305`, `BATTLE-SPIRITS-A11148`, `BATTLE-SPIRITS-A11637`, `VER-THANDIA2`.

### Deep Root Cause Analysis
1. **Target Selector Lookbehind Defect in `engine/selectors.js`:**
   - For `BATTLE-SPIRITS-A9305`, the card text specifies: *"Exhaust one spirit your opponent controls"*.
   - In `engine/selectors.js`, line 1016 previously used regex: `/(?<!opponent['\s]+)\byour\b/i`.
   - The string `"one spirit your opponent controls"` matched `\byour\b` because the preceding token was `"spirit "`, NOT `"opponent"`.
   - Consequently, `hasSelf` was set to `true`, causing `opSpec.side` to default to `'self'`, targeting the player's own spirit instead of the opponent's!
2. **Event Emission Discrepancy:**
   - `engine/ops/index.js` line 853 emits the event `'BOUNCED'` upon returning a card to hand.
   - However, certain test assertions in the E2E framework strictly expected `'CARD_BOUNCED'`.
3. **Weak State Invariant Assertions:**
   - Previous tests checked only whether the resolver completed without throwing an error (`res.success === true`).
   - They failed to assert:
     - Exact destination zone (`player.hand` vs `player.field`).
     - Core recycling: cores on the bounced spirit must be returned to the player's Reserve.
     - Refreshed-to-Exhausted transition on the target card (`target.exhausted === true`).
     - Bystander isolation: unaffected cards must remain in their original state.

---

## 3. Issue 3 — Complete-Match Test Shortcomings & Test Bypasses

### Description
The previous "complete match" test (`tests/playable_engine_local_match.test.js`) suffered from serious methodological compromises:
1. **Unsafe Deck Validation Bypass:** The test initialized the game with `unsafeTestBypassDeckValidation: true`. This hid deck construction errors, illegal card counts, and color mismatches.
2. **Artificial State Seeding:** 3 of the test scenarios bypassed the normal game flow (Start Step -> Core Step -> Draw Step -> Refresh Step -> Main Step -> Attack Step) by directly writing mutated objects into `game.state`.
3. **Core Conservation Violations:** During Core Step execution, when a player's Void pool was empty, phantom cores were being generated out of nowhere, violating Battle Spirits core conservation laws.

---

## 4. Issue 4 — Absence of Formal Interaction Protocol

### Description
Player choices during card resolution (e.g. selecting targets, choosing discard cards, distributing cores, confirming optional effects) were implemented through disparate callback mechanisms.
1. **No Standard Schema:** Interaction requests lacked standardized fields (`id`, `type`, `player`, `candidates`, `minSelections`, `maxSelections`, `status`).
2. **No Replay Protection:** A duplicate or delayed response submitted to the engine could corrupt the game state or re-trigger ability resolution.
3. **No State Persistence:** Pending interactions were not stored on the `game.state` tree (`state.pendingInteractions`), preventing reliable serialization, UI reconnection, or replay auditing.
4. **Adapter Disconnect:** The UI adapter (`engine_adapter.js`) could not reliably bridge prompt events to the visual `battle_arena.js` modals.
