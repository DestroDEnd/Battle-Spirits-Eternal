# Work Package C — Activation Restriction & IR Reconciliation Audit

**Project:** Battle Spirits Eternal (BSP)  
**Deliverable:** `reports/master_corrective_closure/activation_restriction_audit.md`  
**Target:** `engine/restrictions.js`, `compiler/header_parser.js`, and `data/ir_shards/`  
**Date:** 2026-11-21  
**Status:** 100% Reconciled & Verified (166/166 Passing Tests)  

---

## 1. Executive Summary

Work Package C verifies the semantic integrity, compilation accuracy, and runtime execution of activation restrictions across the entire 514-shard database and the core rules engine. All 36,422 abilities compiled across the 514 shards were audited for activation limits, confirming zero unparsed limit text and 100% alignment between IR header metadata and Stage 4 atomic commitment.

---

## 2. Exhaustive IR Shard Inventory & Compiler Audit

### 2.1 Shard Distribution
- **Total IR Shard Files Audited:** 514
- **Total Compiled Abilities:** 36,422
- **Abilities with Formal Activation Limits:** 2,522

### 2.2 Activation Limit Breakdown
| Limit Key | Scope | Count | Description |
|---|---|:---:|---|
| `ONCE_PER_TURN` | Turn (Physical) | 1,551 | Scoped to physical card placement and ability identity |
| `ONCE_PER_TURN_SAME_NAME` | Turn (Player/Name) | 878 | Scoped to player, canonical card name, and semantic ability |
| `ONCE_PER_BATTLE` | Battle | 39 | Resets at the conclusion of each battle sequence |
| `ONCE_PER_GAME_SAME_NAME` | Game (Match) | 53 | Once per match across all copies of the card name |
| `ONCE_PER_GAME` | Game (Physical) | 1 | Persistent across turns for that card instance |
| **Total** | | **2,522** | **100% Reconciled** |

### 2.3 Text-to-AST Compilation Reconciled
- **Audited Heuristic:** Checked all abilities containing `[Once per turn]`, `[Once per game]`, `[Once per battle]`, `Turn: X`, `Game: X`, or Japanese equivalents (`ターンに1回`, `ゲームに1回`, `バトルに1回`) in `cleanBody`.
- **Abilities with Unparsed Text in `cleanBody`:** **0**
- **Reconciliation Verdict:** 100% of all limited abilities have clean, structured `header.limit` fields.

---

## 3. Stage 4 Atomic Commitment & Runtime Lifecycle

### 3.1 Five-Stage Ability Execution Lifecycle
1. **Declaration & Evaluation:** `evaluateRestriction(state, identity, controller)` checks whether the limit has been reached (`RESTRICTION_STATUS.ALLOWED` vs `LIMIT_REACHED`).
2. **Reservation:** `reserveRestriction(state, identity, controller)` places a transient lock to prevent race conditions during asynchronous decision prompts.
3. **Prerequisite & Cost Settlement:** Conditions are evaluated and costs are paid.
   - If cost payment fails or optional activation is declined: `releaseReservation(state, handle)` immediately unlocks the counter with zero mutations.
4. **Stage 4 Atomic Commitment:** `commitRestriction(state, handle, context)` transitions the reservation into an immutable consumed usage counter.
5. **Operation Resolution:** Effect clauses execute. Even if an effect clause fails or is negated post-commitment (`EFFECT_NEGATED`), the activation limit remains consumed.

### 3.2 Scoped Lifecycle Resets
- **ATTACK Scope:** Cleared by `endAttack()` calling `resetRestrictions(state, 'ATTACK')` and `pruneExpiredModifiers(state, 'ATTACK')`.
- **BATTLE Scope:** Cleared by `endBattle()` calling `resetRestrictions(state, 'BATTLE')` and `pruneExpiredModifiers(state, 'BATTLE')`.
- **TURN Scope:** Cleared at Turn end / Start step calling `resetRestrictions(state, 'TURN')`.
- **STEP Scope:** Cleared when transitioning phase steps.

---

## 4. Test Verification Evidence

The entire activation restriction test battery (`tests/runtime_activation_limits.test.js`) executed with zero failures:
- **Total Test Cases:** 166
- **Passed:** 166
- **Failed:** 0
- **Duration:** 611 ms
- **Subsystems Covered:**
  - Ordinary [Once per turn] physical placement isolation (TC-ACT-01 .. TC-ACT-05).
  - [Once per turn: Same Name] cross-card synchronization (TC-ACT-06 .. TC-ACT-10).
  - Commitment timing, unpayable costs, and cancelled targeting (TC-ACT-11 .. TC-ACT-17).
  - Optionality and condition gating (TC-ACT-18 .. TC-ACT-21).
  - Scoped lifecycle resets for attack, battle, step, and turn (TC-ACT-22 .. TC-ACT-27).
  - Serialization, restoration, and defensive context validation (TC-ACT-28 .. TC-RES-PROXY-ORDER-05).
