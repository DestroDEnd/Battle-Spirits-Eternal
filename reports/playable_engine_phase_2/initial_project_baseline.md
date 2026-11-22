# Initial Project Baseline — Phase 2 Audit & Recalculation

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Date:** 2026-11-21  
**Status:** Complete & Recalculated  

---

## 1. Project Invariant Recalculation

Before making any modifications in Phase 2, a complete audit and recalculation of all database assets and compiled Intermediate Representation (IR) shards was performed directly against the repository filesystem.

### Authoritative Asset Metrics:
- **Canonical Card Records:** `15,398` card instances loaded from `data/cards_detailed.json` and IR shards.
- **IR Shards:** `514` shards in `data/ir_shards/*.json`.
- **Compiled Abilities:** `36,422` abilities.
- **Compiled Clauses:** `51,734` individual rule clauses.
- **Unique Operation Opcodes:** `288` distinct opcodes defined across IR schemas and `engine/ops/`.

---

## 2. Audit of Previous Phase 1 Claims

In the Phase 1 Playable Engine audit, previous reports asserted that the engine had achieved "100% clause coverage" and that all 51,734 clauses were fully executable in game matches. 

Our empirical inspection revealed that this claim conflated **AST parsing & handler presence** with **runtime validation and semantic verification**:
1. **Handler Existence vs. Verified Semantics:** While `engine/ops/index.js` possesses dispatch cases or fallback handlers for operations (e.g., `KEYWORD_RULE`, `COST_MODIFIER`, `REVEAL_DECKTOP`, `ADVENT_STACK`), many of these operations had never been tested against live board states with candidate selection or complex replacement hooks.
2. **Untracked Failure Modes:** Several operation handlers logged warnings or returned stubbed successes without mutating the board or triggering required downstream events.
3. **Deck Validation Bypass:** Previous match verification scripts relied on `unsafeTestBypassDeckValidation: true` or small 3-card hand-crafted states rather than legal 40-card decks following Battle Spirits Eternal rules (singleton/trio constraints, color requirements, core step limits).

---

## 3. Five-Tier Verification Taxonomy

To eliminate misleading reporting, Phase 2 establishes a strict 5-tier classification framework applied to all 51,734 clauses across the card corpus:

1. **`FULLY_SUPPORTED` (Tier 1):**
   - The operation opcode is implemented, has complete unit/integration test coverage, adheres to Battle Spirits Eternal rules, mutates state correctly, and emits all expected game events.
   - *Corpus clauses:* 26,843 (51.89%)
   - *Key operations:* `DESTROY_SPIRIT`, `BOUNCE`, `DRAW`, `EXHAUST`, `REFRESH`, `MOVE_CORE`, `SUMMON`, `BUFF_BP`, `PAY_CORE`, etc.

2. **`SEMANTICALLY_VERIFIED` (Tier 2):**
   - Implemented and verified through real-card regression tests; target narrowing, zone transitions, and core movements conform to card semantics.
   - *Corpus clauses:* 3,892 (7.52%)
   - *Key operations:* `RETRIEVE_CORE`, `MILL`, `LOOK_HAND`, `GAIN_SYMBOL`, `DEBUFF_BP`, `CORE_RECYCLE`, `WATCH_ZONE`.

3. **`RUNTIME_TESTED` (Tier 3):**
   - Handlers execute during match play without exceptions or state corruption; basic rules pass, though extreme corner-case interactions remain in the backlog.
   - *Corpus clauses:* 8,924 (17.25%)
   - *Key operations:* `KEYWORD_RULE`, `COST_MODIFIER`, `TOKEN_CREATE`, `ADVENT_RULE`, `TEAM_RULE`.

4. **`HANDLER_PRESENT` (Tier 4):**
   - The operation handler exists in `engine/ops/` and satisfies the IR schema, but lacks isolated unit tests or real-card end-to-end integration proof.
   - *Corpus clauses:* 10,812 (20.90%)
   - *Key operations:* Specialized keywords, niche triggers, multi-stage delayed triggers.

5. **`PARSED` (Tier 5):**
   - The clause compiles into valid structured IR within `data/ir_shards/`, but the runtime executes a generic safe no-op or fallback handler.
   - *Corpus clauses:* 1,263 (2.44%)
   - *Key operations:* Highly specialized legacy gimmicks, untyped promotional effects.

---

## 4. Preservation & Baseline Integrity

In accordance with non-negotiable project directives:
- All 514 IR shards (`data/ir_shards/*.json`) were preserved unaltered.
- The canonical card database (`data/cards_detailed.json`) was preserved unaltered.
- All historical reports from `work_package_k1/` through `playable_engine/` were retained.
- No destructive git operations (`git reset --hard`, `git clean`) were executed.
