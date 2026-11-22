# K1-BATCH-02 — Conditions Checkpoint Report

Generated: 2026-11-20T13:20:50.509Z
Status: **PASSED**

## 1. Summary Metrics (Live 514-Shard Scan)

| Metric | Baseline (K1.5) | After Batch 02 | Delta |
|---|---:|---:|---:|
| `clause.condition` Total | 4534 | 4534 | 0 |
| `clause.condition` Evaluable | 3537 | 3672 | +135 |
| `clause.condition` Unparsed / Unresolved | 997 | 862 | -135 |
| `clause.op.condition` Total | 406 | 406 | 0 |
| `clause.op.condition` Standard AST Evaluable (`auditConditionValue`) | 0 | 2 | +2 |
| `clause.op.condition` Runtime Evaluable (incl. frozen `{ colorSymbol }`) | 0 | 406 | +406 |
| Affected Condition Abilities | 1193 | 830 | -363 |

## 2. Architecture & Fixes Implemented
- Added `CONDITION_RESULT.INVALID_CONTEXT` and Batch 2 condition types `PRE_ADVENT_CARD`, `ACTIVATION_ORIGIN`, and `OP_RULE_CONDITION` in [conditions.js](file:///c:/Users/namis/Downloads/BSP/engine/conditions.js) while preserving existing `UNSUPPORTED` contracts for action-cost conditions and missing legacy context.
- Fixed compound `and`/`or` premature `null` return so noun-phrase conjunctions (`both "A" and "B"`, `Hand and Removed Zone`, `this Spirit or your X family Spirit`) fall through and parse cleanly.
- Updated [clause_patterns.js](file:///c:/Users/namis/Downloads/BSP/compiler/clause_patterns.js) to emit typed `{ kind: 'STRUCTURED_CONDITION', type: 'COLOR_SYMBOL', side: 'self', color, colorSymbol }` on `[Rush: Color]`.
- Wired `INVALID_CONTEXT` handling and `clause.op.condition` evaluation in [resolver.js](file:///c:/Users/namis/Downloads/BSP/engine/resolver.js) and [index.js](file:///c:/Users/namis/Downloads/BSP/engine/ops/index.js) (`KEYWORD_ABILITY`, `PLAY_CONDITION`, `UNBLOCKABLE`).

## 3. Verification Results
- Gate run (`10` test files): **109 passed, 0 failed**
- Real cards verified: `BS41-040`, `BS19-X03`, `BS02-088`, `SD02-012`, `BS53-050`, `CB26-069`, `BS60-041`, `BS63-CP03`.
- Remaining `862` unparsed `clause.condition` strings are preserved fail-closed (`CONDITION_RESULT.UNSUPPORTED`) and itemized by category in [batch_02_unresolved_conditions.json](file:///c:/Users/namis/Downloads/BSP/reports/work_package_k1_batches_02_to_05/batch_02_conditions/batch_02_unresolved_conditions.json).
- Central ledger updated in-place: `1380` entries updated, total records preserved: `18031`.
