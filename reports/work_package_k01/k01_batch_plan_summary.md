# PHASE K.1 — PRIORITIZED BATCH IMPLEMENTATION SUMMARY

Based on full-corpus discovery (`514` shards, `14,609` canonical cards, `36,422` abilities, `9,276` unique semantic patterns):

1. **`K1-BATCH-01` (Priority 1):** Core verified ops (`DRAW`, `BP_BUFF`, `BP_DEBUFF`, `DESTROY`, `BOUNCE`, `EXHAUST`, `REFRESH`, `MOVE_CORE`) — highest coverage, lowest risk.
2. **`K1-BATCH-02` (Priority 2):** Condition Evaluator Expansion — resolves top normalized parse-failure patterns (`While braved to ...`, counters, life, named-control).
3. **`K1-BATCH-03` (Priority 3):** High-Frequency Keyword Mechanics (`Burst`, `Accel`, `Advent`, `Contract Advent`, `Rebirth`, `Mirage`).
4. **`K1-BATCH-04` (Priority 4):** Incomplete-Parameter Closure (`582` clauses: `DECK_OR_HAND_ACTION`, `MODIFY_EFFECT`, `COUNT_OPERATION`, `DECK_ACTION`, `TOKEN_DEPLOYMENT`).
5. **`K1-BATCH-05` (Priority 5):** Replacement, Prevention, Unverified/Unsupported Variants (`118` + `17`) & Complex Multi-Clause Cards (`26RBS02-083`, `26RDB01-024`, `26RSD07-001`).
