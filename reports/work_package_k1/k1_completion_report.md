# PHASE K.1 — FULL DATABASE MECHANIC DISCOVERY REPORT

**Project:** Battle Spirits Eternal (`C:\Users\namis\Downloads\BSP`)  
**Scope:** All `514` IR shards (`15,398` card records, `14,609` unique canonical cards, `36,422` ability records, `51,734` clauses)  
**Date:** 2026-11-19  

---

## 1. Full Database Discovery Totals

Generated deterministically by `scripts/discover_k1_mechanics.mjs` across all release families (`Main Booster`, `Starter / Build Deck`, `Collaboration Booster`, `Extra / Theme Booster`, `Premium Bandai / Box Set`, `Promotional / Special Release`):
- **Total Shards / Card Records / Canonical Cards:** `514` / `15,398` / `14,609`
- **Unique Operations:** `288` (`k1_operation_registry.json`)
- **Unique Trigger Timings:** `34` (`k1_trigger_registry.json`)
- **Unique Keywords Extracted:** `13` (`k1_keyword_registry.json`)
- **Unique Semantic Effect Patterns:** `9,276` (`k1_semantic_pattern_catalog.json`)
- **Condition Parse Failures:** `1,114` across `948` normalized patterns (`k1_condition_registry.json`)

## 2. Prioritized Batch Implementation Plan (`k1_batch_implementation_plan.json`)

1. **`K1-BATCH-01` (Priority 1, LOW risk):** Core Verified Single-Op & Draw/Destroy/Buff/Bounce/Core Patterns (`DRAW`, `BP_BUFF`, `BP_DEBUFF`, `DESTROY`, `BOUNCE`, `EXHAUST`, `REFRESH`, `MOVE_CORE`).
2. **`K1-BATCH-02` (Priority 2, LOW_MEDIUM risk):** Condition Evaluator Expansion for top parse-failure patterns (`While braved to ...`, counters, life, named-control).
3. **`K1-BATCH-03` (Priority 3, MEDIUM risk):** High-Frequency Keyword Mechanics (`Burst`, `Accel`, `Advent`, `Contract Advent`, `Rebirth`, `Mirage`).
4. **`K1-BATCH-04` (Priority 4, MEDIUM risk):** Incomplete-Parameter Closure & Bare-Stub Operations (`582` clauses across `DECK_OR_HAND_ACTION`, `MODIFY_EFFECT`, `COUNT_OPERATION`, `DECK_ACTION`, `TOKEN_DEPLOYMENT`).
5. **`K1-BATCH-05` (Priority 5, HIGH risk):** Replacement, Prevention, Unverified/Unsupported Variants (`118` + `17`) & Complex Multi-Clause Cards (`26RBS02-083`, `26RDB01-024`, `26RSD07-001`).
