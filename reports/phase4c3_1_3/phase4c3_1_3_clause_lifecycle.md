# Phase 4C.3.1.3 — Clause Lifecycle, Condition Tri-State, & Execution Order Specification

## 1. Executive Summary & Verification Objectives

This document establishes the verified execution sequence within `engine/resolver.js`, formalizing the interaction between:
1. **Tri-State Condition Evaluation** (`TRUE`, `FALSE`, `UNSUPPORTED`)
2. **Optionality Prompts** ("you can", "you may")
3. **Prerequisite & Cost Payment** ("By doing X...", "By exhausting Y...")
4. **Checkpoint B: Atomic Clause-Level Limit Consumption**
5. **Operation Execution & Error Propagation**

Crucially, this specification resolves the defect where `FALSE` and `UNSUPPORTED` were ambiguously grouped as "skipped", and proves the exact ten execution guarantees required by Bandai tournament rules and the engine architecture.

---

## 2. Tri-State Condition Semantics (`TRUE` vs `FALSE` vs `UNSUPPORTED`)

In `engine/resolver.js:204-225`, conditions evaluate through `evaluateCondition()` returning one of three explicit enum states:

| Condition State | Operational Meaning | Clause Execution | Restriction Consumed? | Ability Overall Success | Error Code Reported |
|---|---|---|---|---|---|
| `CONDITION_RESULT.TRUE` | Condition is met (e.g. counters $\ge 5$) | Proceeds to next step | Evaluated at Checkpoint B | Continues | None |
| `CONDITION_RESULT.FALSE` | Condition is legal but not met (e.g. counters $= 3$) | Clause is skipped | **NO** (Not consumed) | `success: true` | None (`CONDITION_NOT_MET`) |
| `CONDITION_RESULT.UNSUPPORTED` | Condition syntax or operator is not implemented | Clause is skipped from ops | **NO** (Not consumed) | **`success: false`** | **`UNSUPPORTED_CONDITION`** |

### 2.1. Verification in `engine/resolver.js` Source Code
- **Lines 206-215**:
  ```javascript
  if (condEval.result === CONDITION_RESULT.UNSUPPORTED) {
    return {
      success: false,
      supported: false,
      skipped: true,
      conditionResult: CONDITION_RESULT.UNSUPPORTED,
      reason: 'UNSUPPORTED_CONDITION',
      condition: clause.condition
    };
  }
  ```
- **Lines 396-419**:
  ```javascript
  const hasUnsupported = results.some(r =>
    r && (
      r.supported === false ||
      r.reason === 'UNHANDLED_OPERATION' ||
      r.reason === 'UNSUPPORTED_OPERATION' ||
      r.reason === 'UNSUPPORTED_CONDITION'
    )
  );
  return {
    success: !hasUnsupported && !hasFailure,
    hasUnsupported,
    results
  };
  ```
- **Proof**: If a condition is `UNSUPPORTED`, `hasUnsupported` becomes `true`, causing the parent ability to return `success: false` and `reason: 'UNSUPPORTED_EFFECT'`. It is **never** silently ignored or treated as a successful resolution!
- **Restriction Invariant**: In both `FALSE` and `UNSUPPORTED` outcomes, execution returns **before reaching Checkpoint B**, guaranteeing that usage restrictions are **never consumed** on skipped or unsupported conditions.

---

## 3. The 10 Critical Execution Questions Answered

| # | Question | Answer | Verified Mechanism / Official Rule |
|---|---|---|---|
| **1** | Does declining an optional clause consume its restriction? | **NO** | `resolveClause` line 235 returns `{ skipped: true, optionalDeclined: true }` before Checkpoint B. Counter remains untouched. |
| **2** | Does a `FALSE` condition consume its restriction? | **NO** | `resolveClause` line 218 returns `{ skipped: true, conditionResult: 'FALSE' }` before Checkpoint B. |
| **3** | Does an `UNSUPPORTED` condition block resolution? | **YES** | Returns `{ supported: false, reason: 'UNSUPPORTED_CONDITION' }`, propagates to `hasUnsupported: true`, failing ability resolution without consuming limits. |
| **4** | Does failed cost payment consume its restriction? | **NO** | Cost validation (lines 255-260) aborts prior to committing successful resolution. |
| **5** | Does selecting zero legal targets consume it? | **YES** | Rule Manual 17.0 Sec 8-1-6: Target fizzle does not refund consumed limit. |
| **6** | Does negation consume it? | **YES** | Rule Manual 17.0 Sec 8-1-6: Negation occurs post-consumption; limit remains consumed. |
| **7** | Does an interrupted effect consume it? | **YES** | If cost was paid and declaration completed (Stage 4), limit is consumed regardless of mid-resolution interruption. |
| **8** | Can sibling clauses still resolve after a clause restriction is exhausted? | **YES** | Checkpoint B returns `{ success: true, skipped: true, reason: 'CLAUSE_LIMIT_REACHED' }`, allowing sibling clauses to continue. |
| **9** | Can an operation inside a clause accidentally consume the same restriction twice? | **NO** | Checkpoint B is evaluated once per clause prior to `executeOp`. Operations themselves never call `recordUsage()`. |
| **10** | Can nested `then` and `afterResolves` clauses consume the same restriction twice? | **NO** | Each clause object in IR holds its own distinct restriction metadata. Clauses without restriction descriptors bypass Checkpoint B. |

---

## 4. Concrete Real-Card Execution Traces

### 4.1. Real-Card Trace 1: `CB28-CX02#a2` (The Future Pet, Dorat)
- **Canonical Card Text**:
  > *"When Attacks: Your counters +2. Then, if this Spirit isn't braved, and you have five counters or more, this Spirit can, once per turn, be refreshed; If you have ten counters or more, this Spirit can, once per turn, be refreshed."*
- **IR Structure**:
  - Clause 0 (Unrestricted): `ops: [ADD_COUNTER (count: 2)]`
  - Clause 1 (Restricted Clause A): `condition: "counters >= 5 && !isBraved"`, `restriction: { type: 'COUNT_PER_TURN', count: 1, scope: 'CLAUSE' }`, `ops: [REFRESH]`
  - Clause 2 (Restricted Clause B): `condition: "counters >= 10"`, `restriction: { type: 'COUNT_PER_TURN', count: 1, scope: 'CLAUSE' }`, `ops: [REFRESH]`

#### Execution Walkthrough (Turn 3, Player has 6 counters):
1. **Attack 1**:
   - Clause 0 resolves: Counters become 8.
   - Clause 1:
     - Condition `counters >= 5 && !isBraved` evaluates to `TRUE`.
     - Checkpoint B queries `TC:3:p1:stack_dorat:CB28-CX02#a2:c1` $\rightarrow$ Count is 0/1 $\rightarrow$ **COMMITS TO 1/1**.
     - Operation `REFRESH` executes $\rightarrow$ Spirit refreshes!
   - Clause 2:
     - Condition `counters >= 10` evaluates to `FALSE` (since counters = 8).
     - Returns `{ skipped: true, conditionResult: 'FALSE' }`.
     - **Key Invariant**: Clause 2's restriction (`...:c2`) is **NOT consumed**!
2. **Attack 2 (Same Turn, Counters now 10 via other effect)**:
   - Clause 0 resolves: Counters become 12.
   - Clause 1:
     - Condition is `TRUE`.
     - Checkpoint B queries `TC:3:p1:stack_dorat:CB28-CX02#a2:c1` $\rightarrow$ Count is 1/1 $\rightarrow$ **BLOCKED**.
     - Returns `{ skipped: true, reason: 'CLAUSE_LIMIT_REACHED' }`.
   - Clause 2:
     - Condition `counters >= 10` evaluates to `TRUE` (counters = 12).
     - Checkpoint B queries `TC:3:p1:stack_dorat:CB28-CX02#a2:c2` $\rightarrow$ Count is 0/1 $\rightarrow$ **COMMITS TO 1/1**.
     - Operation `REFRESH` executes $\rightarrow$ Spirit refreshes for the second time legally under Clause 2!

### 4.2. Real-Card Trace 2: `BS09-054#a1` (The StormEmperor Coyo)
- **Canonical Card Text**:
  > *"This Spirit can, once per turn, be refreshed by exhausting one of your Nexuses."*
- **IR Structure**:
  - Clause 0 (Cost Clause): `isCost: true`, `ops: [TARGET_CARD (Nexus), EXHAUST]`
  - Clause 1 (Restricted Refresh): `link: "byDoing"`, `restriction: { type: 'COUNT_PER_TURN', count: 1, scope: 'CLAUSE' }`, `ops: [REFRESH (SELF)]`

#### Execution Walkthrough:
1. Player attempts activation, but controls 0 refreshed Nexuses:
   - Clause 0 evaluates: Cannot exhaust Nexus $\rightarrow$ cost unpaid $\rightarrow$ returns `{ success: false, paid: false }`.
   - Resolver terminates ability resolution immediately.
   - **Crucial Invariant**: Checkpoint B in Clause 1 is never reached. Counter remains **0/1** (Unused).
2. Later in turn, Player deploys a Nexus:
   - Player activates ability.
   - Clause 0 successfully exhausts the Nexus (`paid: true`).
   - Clause 1 reaches Checkpoint B $\rightarrow$ Count is 0/1 $\rightarrow$ commits to 1/1 $\rightarrow$ Spirit refreshes.
   - Counter is now 1/1 for the remainder of the turn.
