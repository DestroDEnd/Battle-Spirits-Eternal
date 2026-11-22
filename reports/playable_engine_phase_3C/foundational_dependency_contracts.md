# BATTLE SPIRITS ETERNAL — PHASE 3C
## Foundational Dependency Contracts

---

### Core Infrastructure Contracts

#### [DEP-CORE-CONSERV] Total Core Conservation & Soul Core Tracking
- **Module:** `engine/zones.js, engine/state.js`
- **Priority Tier:** Priority 1
- **Scope:** 51,734 clauses across 14,443 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/core_game_rules_integrity_corrective.test.js::CORR-CORE-01`
- **Architectural Contract:** System-wide core invariant: sum of cores across all zones (reserve, field, trash, void, life) is strictly conserved. Soul Core location is unique and strictly tracked.

#### [DEP-ATOMIC-PAY] Transactional Cost Payment & Preflight Validation
- **Module:** `engine/payment.js`
- **Priority Tier:** Priority 2
- **Scope:** 12,840 clauses across 4,210 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/core_game_rules_integrity_corrective.test.js::CORR-PAY-01, CORR-PAY-03`
- **Architectural Contract:** Two-phase transactional payment: preflight validation prevents partial mutation; committed payments block duplicate commits and cannot be rolled back by downstream handler failure.

#### [DEP-STAGE4-COMMIT] Stage 4 Atomic Activation Commitment
- **Module:** `engine/restrictions.js, engine/resolver.js`
- **Priority Tier:** Priority 3
- **Scope:** 36,422 clauses across 14,443 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/work_package_hij2_runtime_atomicity.test.js::HIJ2-ATOM-01`
- **Architectural Contract:** Activation budget (Once per turn, Once per game, Same Name) is reserved pre-flight and atomically consumed only upon successful cost payment or target selection.

#### [DEP-STRUCTURED-COND] Structured Condition Evaluator (4-State Logic)
- **Module:** `engine/conditions.js`
- **Priority Tier:** Priority 4
- **Scope:** 24,891 clauses across 8,120 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/effect_execution_targeting_conditions.test.js::COND-TRISTATE-01`
- **Architectural Contract:** Deterministic 4-state condition evaluation (TRUE, FALSE, UNSUPPORTED, INVALID_CONTEXT). Fail-closed on unmet predicates with zero resource consumption.

#### [DEP-TARGET-IMMUNITY] Unified Target Selection & Armor/Heavy Armor Protection
- **Module:** `engine/selectors.js, engine/continuous.js`
- **Priority Tier:** Priority 5
- **Scope:** 18,450 clauses across 6,200 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/effect_execution_targeting_conditions.test.js::TARGET-FILTER-01, OPS-PRIORITY-01`
- **Architectural Contract:** Target candidate generation evaluates zone, card type, BP/Cost/Level comparisons, and strictly excludes targets protected by Armor, Heavy Armor, or effect immunities.

#### [DEP-SBA-STABILIZE] State-Based Actions & Infinite Loop Prevention
- **Module:** `engine/sba.js`
- **Priority Tier:** Priority 6
- **Scope:** 51,734 clauses across 14,443 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/timing_triggers_continuous_sba.test.js::SBA-01, SBA-02`
- **Architectural Contract:** Automatic rules execution: 0-core spirits sent to trash, 0-BP spirits destroyed, 0-life defeat. Stabilization loop settles chained triggers; StabilizationLoopError prevents infinite loops.

#### [DEP-TRIGGER-ORDERING] Deterministic Trigger Ordering & Queue Lifecycle
- **Module:** `engine/triggers.js`
- **Priority Tier:** Priority 7
- **Scope:** 15,320 clauses across 5,100 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/timing_triggers_continuous_sba.test.js::TRIG-01, TRIG-02`
- **Architectural Contract:** Active player triggers ordered before non-turn player; within each player ordered by zone, stack, and ability index. Source departure automatically cancels pending field triggers.

#### [DEP-CONTINUOUS-LAYER] Continuous Layer & Dynamic Modifier Pruning
- **Module:** `engine/continuous.js`
- **Priority Tier:** Priority 8
- **Scope:** 22,100 clauses across 7,800 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/timing_triggers_continuous_sba.test.js::CONT-01, tests/phase3_continuous_and_cost_gating.test.js`
- **Architectural Contract:** Derived BP, levels, symbols, and keywords recomputed dynamically without mutating base card structures. Modifiers pruned cleanly at scope boundaries (BATTLE, ATTACK, TURN).

#### [DEP-ZONE-ROUTING] Ownership vs Controller Zone Routing
- **Module:** `engine/zones.js`
- **Priority Tier:** Priority 9
- **Scope:** 14,100 clauses across 4,900 cards
- **Implementation Status:** `VERIFIED_COMPLETE`
- **Verification Test:** `tests/work_package_hij2_runtime_atomicity.test.js::HIJ2-ATOM-02`
- **Architectural Contract:** When cards leave the field (destroyed, bounced, banished), they always return to their canonical owner's zone (hand, trash, deck), even if controlled by the opponent.

#### [DEP-REPLACE-PIPELINE] Replacement Effect Interception Pipeline
- **Module:** `engine/continuous.js, engine/ops/index.js`
- **Priority Tier:** Priority 10
- **Scope:** 3,420 clauses across 1,150 cards
- **Implementation Status:** `PARTIAL_SUPPORTED`
- **Verification Test:** `tests/core_game_rules_integrity_corrective.test.js::CORR-CORE-02`
- **Architectural Contract:** Intercepts destruction, life loss, and card departure events. Single-stage replacement verified; multi-replacement arbitration active.

