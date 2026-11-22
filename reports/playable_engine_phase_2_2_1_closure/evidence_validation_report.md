# Evidence Validation Report

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** 2.2.1 Corrective Closure  
**Date:** 2026-11-21  

---

## 1. Automated Evidence Audit Log
Every evidence record in the registry was passed through `validateEvidenceRecord` to confirm exact test identifiers, file existence, master runner membership, and AST state assertions.

| Opcode / Variant | Assigned Tier | Verified Test File | Exact Registered Test Name | Status |
|---|---|---|---|---|
| `DESTROY::default` | `FULLY_SUPPORTED` | `tests/effect_execution_targeting_conditions.test.js` | `OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports g...` | **VALIDATED** |
| `BOUNCE::to_grave` | `SEMANTICALLY_VERIFIED` | `tests/effect_execution_targeting_conditions.test.js` | `OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports g...` | **VALIDATED** |
| `BOUNCE::to_deck_bottom` | `SEMANTICALLY_VERIFIED` | `tests/effect_execution_targeting_conditions.test.js` | `OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports g...` | **VALIDATED** |
| `BOUNCE::to_hand` | `FULLY_SUPPORTED` | `tests/real_cards_17_strengthened_regression.test.js` | `STRENGTHENED-REGRESSION: Kamen Rider Self-Bounce (10 cards) verifies e...` | **VALIDATED** |
| `DRAW::default` | `FULLY_SUPPORTED` | `tests/effect_execution_targeting_conditions.test.js` | `OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports g...` | **VALIDATED** |
| `BP_BUFF::default` | `FULLY_SUPPORTED` | `tests/timing_triggers_continuous_sba.test.js` | `CONT-01: Deterministic modifier layering, cycle protection, versioned ...` | **VALIDATED** |
| `BP_DEBUFF::default` | `FULLY_SUPPORTED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Co...` | **VALIDATED** |
| `EXHAUST::default` | `FULLY_SUPPORTED` | `tests/real_cards_17_strengthened_regression.test.js` | `STRENGTHENED-REGRESSION: Exhaust Cards (6 cards) verify state transiti...` | **VALIDATED** |
| `REFRESH::default` | `FULLY_SUPPORTED` | `tests/core_game_rules_engine.test.js` | `CORE-TURN-01: Complete Eternal turn lifecycle with Turn 1 skips, playe...` | **VALIDATED** |
| `SUMMON::default` | `FULLY_SUPPORTED` | `tests/core_game_rules_engine.test.js` | `CORE-PLAY-02: Strict card play enforces timing, cost reduction, Spirit...` | **VALIDATED** |
| `REPLACEMENT_EFFECT::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_c1_auditor_and_regression.test.js` | `C1-REG-06: REPLACEMENT_EFFECT registers explicit replacement spec, rej...` | **VALIDATED** |
| `TOKEN_DEPLOYMENT::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-01 [OPERATION_VARIANT]: TOKEN_DEPLOYMENT deploys named toke...` | **VALIDATED** |
| `COUNT_OPERATION::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-02 [OPERATION_VARIANT]: COUNT_OPERATION handles SEND_LIFE_T...` | **VALIDATED** |
| `DECK_ACTION::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-03 [OPERATION_VARIANT]: DECK_OR_HAND_ACTION and DECK_ACTION...` | **VALIDATED** |
| `MODIFY_EFFECT::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-04 [OPERATION_VARIANT]: MODIFY_EFFECT, MODIFY_EFFECT_VALUE,...` | **VALIDATED** |
| `ADVENT::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-05 [OPERATION_VARIANT]: CONTRACT_ADVENT_RULE, ADVENT, DECK_...` | **VALIDATED** |
| `COST_MODIFIER::default` | `SEMANTICALLY_VERIFIED` | `tests/phase3_continuous_and_cost_gating.test.js` | `Phase 3 - Arena Cost Reduction: Active COST_MODIFIER in DuelState.modi...` | **VALIDATED** |
| `TARGET::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_TH...` | **VALIDATED** |
| `REBIRTH_FLIP::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_TH...` | **VALIDATED** |
| `MOVE_SOUL_CORE::default` | `SEMANTICALLY_VERIFIED` | `tests/core_game_rules_engine.test.js` | `CORE-MGMT-01: moveCore rejects invalid counts, missing target stacks, ...` | **VALIDATED** |
| `ENTER_SOUL_STATE::default` | `SEMANTICALLY_VERIFIED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack,...` | **VALIDATED** |
| `PAY_COST::default` | `SEMANTICALLY_VERIFIED` | `tests/core_game_rules_engine.test.js` | `CORE-PLAY-01: payCost is strictly atomic and failed card play never co...` | **VALIDATED** |
| `SELECT_TARGET::default` | `SEMANTICALLY_VERIFIED` | `tests/effect_execution_targeting_conditions.test.js` | `RESOLVE-TARGETS-01: supports typed refs, tie-handling, strict validati...` | **VALIDATED** |
| `CAN_ATTACK::default` | `RUNTIME_TESTED` | `tests/core_game_rules_engine.test.js` | `CORE-COMBAT-01: Strict combat validation, Pursuit heavy-exhaustion, ba...` | **VALIDATED** |
| `CORE_LOCK::default` | `RUNTIME_TESTED` | `tests/work_package_hij1_operation_variants.test.js` | `HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribu...` | **VALIDATED** |

All 25 evidence records were verified with 0 discrepancies.
