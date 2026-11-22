# Condition Family Inventory (Phase 4C.5)

**Scope**: All **514 IR shards** (`data/ir_shards/*.json`), **4,940 condition instances** (**2,553 unique conditions**).

## Coverage Summary

| Metric | Count / Pct |
| --- | ---: |
| Total Condition Instances | 4,940 |
| Unique Condition Strings / ASTs | 2,553 |
| **Supported Condition Instances** | **2,407 (48.72%)** |
| Unsupported Condition Instances (Fail-Closed `UNSUPPORTED`) | 2,533 (51.28%) |

## Supported Structured Condition Types (`engine/conditions.js`)

| Condition Type | Shard Instances | Description |
| --- | ---: | --- |
| `CONTROL_CARD` | 601 | Controlled Spirits/Nexuses/Braves/Ultimates by color/family/name/count |
| `COLOR_SYMBOL` | 404 | Structured `{ colorSymbol }` symbol presence on field/nexus |
| `COUNTER_THRESHOLD` | 372 | Player counter thresholds (`GTE`, `LTE`, `GT`, `LT`, `EQ`) |
| `SOUL_CORE_ON_SPIRIT` | 225 | `[Soul Core]` presence on self stack or controlled field stack |
| `BURST_OR_MIRAGE_SET` | 178 | Set Burst/Mirage presence and color checks |
| `LIFE_THRESHOLD` | 151 | Player/opponent Life threshold comparisons |
| `BATTLING_STATE` | 101 | Spirit currently battling or active battle window |
| `LEGACY_CONTEXT_CONDITION` | 97 | `destroyed_by_opponent`, `summoned_from_removed`, `soul_core_used` |
| `TURN_STEP_STATE` | 67 | Turn owner & step (`Attack Step`, `Main Step`, opposing turn) |
| `HAND_SIZE_THRESHOLD` | 62 | Hand size comparisons (`five or less`, etc.) |
| `BP_ZERO` | 55 | Effective BP === 0 check |
| `SOUL_STATE` | 43 | Card in Soul State / `under` stack |
| `CARD_ZONE_STATE` | 27 | Card in Trash (`grave`), Removed Zone, or Hand |
| `PREVIOUS_OP_SUCCESS` | 24 | `"if you've done so"` / `"if you did"` / `"by doing so"` |
| `COMPOUND` | (AST/split) | `AND` / `OR` combinator; fails closed (`UNSUPPORTED`) if any sub-condition is unsupported |

## Tri-State Evaluation Guarantee

`evaluateStructuredCondition()` strictly returns `CONDITION_RESULT.TRUE`, `CONDITION_RESULT.FALSE`, or `CONDITION_RESULT.UNSUPPORTED`. Unrecognized conditions never silently evaluate to `TRUE` or `FALSE`.
