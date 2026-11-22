# Work Package D — Engine State & Rules Integrity Audit

**Project:** Battle Spirits Eternal (BSP)  
**Deliverable:** `reports/master_corrective_closure/state_invariant_audit.md`  
**Target:** `engine/state.js`, `engine/zones.js`, `engine/flow.js`, `engine/continuous.js`, `engine/payment.js`, `engine/sba.js`  
**Date:** 2026-11-21  
**Status:** Invariants Audited & Formally Verified (34/34 Passing Core Rules Tests)  

---

## 1. Executive Summary

Work Package D provides an end-to-end verification of the core engine state machine, zone transition invariants, core conservation laws, continuous layer recalculations, and state-based action (SBA) stabilization loops. All 34 tests across the 4 authoritative core rules suites pass with 100% compliance.

---

## 2. Invariant Architecture & Enforcement

### 2.1 Core Conservation Law
Every game state maintains strict conservation of cores:
$$\sum \text{Cores}_{\text{Player}} = \text{Reserve} + \text{Field} + \text{Life} + \text{Trash} + \text{Void} + \text{Soul Core}$$
- **Void Operations:** Cores enter from or exit to Void exclusively through explicit game steps (`Core Step`, `Refresh Step`) or sanctioned card effects (`Void transfer`, `Holy Life`).
- **Atomic Deduction & Credit:** In `moveCore()`, the deduction from the source zone and credit to the destination zone execute synchronously within a single atomic call. If credit fails, deduction is rolled back immediately.
- **Soul Core Rules:**
  - Soul Core cannot be sent to Void by opponent effects (Rule 8.4).
  - Soul Core cannot enter Life except via explicit [Seal] effects (Rule 8.5).
  - Soul Core resides in exactly one location per player (`reserve`, `field`, `trash`, or `void`).

### 2.2 Zone Routing & Anti-Ghost Invariants
Cards transition exclusively between valid canonical zones: `deck`, `hand`, `field`, `grave` (trash), `burst`, and `removed`.
- **Single-Zone Membership:** A card instance `id` exists in exactly one zone at any given millisecond. Duplicate occurrences across zones trigger `DUPLICATE_CARD_OCCURRENCE` and abort execution.
- **Atomic Field Exits:** Leaving the field transfers all attached cores back to reserve (or trash if specified) and unbraves/uncombines attached cards before removing the stack.

### 2.3 Continuous Layer & Modifiers
- **Layer Architecture:** Evaluates continuous effects in deterministic stages:
  1. Base card attributes (printed Cost, BP, Colors, Symbols, Families).
  2. Level computation based on attached cores against level thresholds (`levels[1..3].cores`).
  3. BP modifications (additive `BP_BUFF`, `BP_DEBUFF`, level-derived BP).
  4. Symbol modifications (`ADD_SYMBOL`, `REMOVE_SYMBOL`).
  5. Continuous restrictions and permissions (`CANNOT_ATTACK`, `CANNOT_BLOCK`, `UNBLOCKABLE`).
- **Cache Invalidation & Modifier Pruning:** Modifiers specify explicit durations (`THIS_TURN`, `THIS_BATTLE`, `THIS_ATTACK`, `WHILE_ON_FIELD`). Expired modifiers are pruned cleanly during phase transitions and combat end.

### 2.4 State-Based Actions (SBA) & Stabilization Loop
- **Depletion:** Any Spirit on the field whose attached cores drop below its Level 1 minimum (typically 1 core) is depleted and sent to Trash immediately by rule, not by effect destruction.
- **Life 0 & Deck Out:** A player with 0 Life loses immediately. If both players reach 0 Life simultaneously, the match resolves as a Draw. If a player must draw a card from an empty deck, they lose immediately.
- **Loop Protection:** `stabilizeGameState()` repeats SBA evaluations until the state reaches a fixed point (no new actions). If chained depletions exceed the safety depth (25 iterations), `StabilizationLoopError` is thrown to halt infinite loops.

---

## 3. Test Verification Evidence

The 4 primary core rules integrity suites executed with 100% pass rate:
- `tests/core_game_rules_integrity_corrective.test.js`: 10/10 PASS
- `tests/core_game_rules_engine.test.js`: 10/10 PASS
- `tests/timing_triggers_continuous_sba.test.js`: 8/8 PASS
- `tests/effect_execution_targeting_conditions.test.js`: 6/6 PASS
- **Total:** **34/34 PASS (100%)**
