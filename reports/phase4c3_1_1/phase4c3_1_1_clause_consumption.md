# Phase 4C.3.1.1 — Clause-Level Consumption & Nested Execution Specification

## 1. Context & Architectural Challenge

A major defect in the Phase 4C.3.1 draft was its failure to formalize how clause-level restrictions interact with ability-level triggers. In many canonical Battle Spirits cards, an ability triggers on a common event (such as `When this Spirit attacks`), contains a primary effect that triggers unconditionally every time, and contains a secondary clause restricted by *"Also, once per turn..."*.

If the restriction tracker treats the entire ability as once-per-turn, the primary effect is erroneously locked out on subsequent attacks. Conversely, if the restriction is ignored because the outer ability is unrestricted, the secondary clause illegally fires on every attack.

This specification details the dual-tier evaluation engine that isolates clause-level limits while preserving full parent ability execution.

---

## 2. Dual-Tier Evaluation Architecture

The engine implements two distinct gating checkpoints:

```
┌────────────────────────────────────────────────────────┐
│ CHECKPOINT A: Ability-Level Gate (resolver.js)         │
│ - Evaluates ability.restriction (if present)           │
│ - If consumed -> Abort entire ability activation       │
│ - If allowed -> Proceed to Clause Pipeline             │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ EXECUTION PIPELINE: Clause Iterator                    │
│ For each clause in ability.clauses:                    │
│                                                        │
│   ┌──────────────────────────────────────────────────┐ │
│   │ CHECKPOINT B: Clause-Level Gate (resolveClause)  │ │
│   │ - Evaluates clause.restriction (if present)      │ │
│   │ - If consumed:                                   │ │
│   │     Log: { skipped: true, reason: 'CLAUSE_LIMIT' } │
│   │     Continue to next clause (DO NOT ABORT)       │ │
│   │ - If allowed:                                    │ │
│   │     Atomic consume clause restriction key        │ │
│   │     Execute operations in clause                 │ │
│   └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 2.1. Structural IR Representation
In compiled IR, compound abilities with inline restrictions store restriction metadata directly on the target clause object:

```json
{
  "id": "BSCO-003#a1",
  "trigger": "ON_ATTACK",
  "level": 1,
  "restriction": null,
  "clauses": [
    {
      "index": 0,
      "text": "Destroy 1 opposing Spirit with 5000 BP or less.",
      "restriction": null,
      "operations": [
        { "op": "TARGET_CARD", "filter": { "types": ["Spirit"], "bp": { "lte": 5000 }, "side": "opp" } },
        { "op": "DESTROY" }
      ]
    },
    {
      "index": 1,
      "text": "Also, once per turn, refresh this Spirit.",
      "restriction": {
        "scope": "CLAUSE",
        "type": "COUNT_PER_TURN",
        "count": 1,
        "resetInterval": "TURN"
      },
      "operations": [
        { "op": "REFRESH", "target": "SELF" }
      ]
    }
  ]
}
```

---

## 3. Concrete Execution Trace: `BSCO-003#a1` Across Two Consecutive Attacks

Consider a battle scenario where player controls `BSCO-003` (Instance ID: `inst_9012`, Stack ID: `stack_34`).

### 3.1. Turn Context
- Turn Number: `5`
- Active Player: `'p1'`
- Board State: Opponent controls Spirit $O_1$ (4000 BP) and Spirit $O_2$ (3000 BP).

---

### 3.2. Attack 1 Execution Trace

1. **Player 1 declares attack with `BSCO-003`**:
   - `stack_34` transitions to `exhausted: true`.
   - Event `ATTACK_DECLARED` emitted.

2. **Trigger Queue & Ability Checkpoint A**:
   - Ability `BSCO-003#a1` matched on `ON_ATTACK`.
   - Ability-level restriction: `null` $\rightarrow$ Checkpoint A **passes**.

3. **Stage 4 Atomic Ability Consumption**:
   - No outer limit to consume.

4. **Clause 0 Execution (Destroy)**:
   - Clause 0 restriction: `null` $\rightarrow$ Checkpoint B **passes**.
   - `TARGET_CARD` selects $O_1$ (4000 BP $\le$ 5000 BP).
   - `DESTROY` executes on $O_1$. $O_1$ moves to Opponent Trash.
   - Clause 0 result: `{ success: true, targetsDestroyed: 1 }`.

5. **Clause 1 Execution (Refresh - Inline Once per Turn)**:
   - Clause 1 restriction: `{ type: 'COUNT_PER_TURN', count: 1, scope: 'CLAUSE' }`.
   - Key derivation:
     $$\text{Key} = \text{`TC:5:p1:stack_34:BSCO-003#a1:c1'}$$
   - Query `state.restrictions.get('TC:5:p1:stack_34:BSCO-003#a1:c1')`:
     - Current count: `0` (Max: `1`).
     - Checkpoint B **passes**.
   - **Atomic Consumption**:
     - `state.restrictions.recordUsage('TC:5:p1:stack_34:BSCO-003#a1:c1')` $\rightarrow$ count becomes `1`.
   - Operations execute: `REFRESH` on `SELF`.
   - `stack_34` transitions to `exhausted: false`.
   - Clause 1 result: `{ success: true, refreshed: true }`.

6. **Post-Attack 1 State**:
   - `stack_34` is refreshed.
   - Opponent lost $O_1$.
   - Restriction Table:
     `'TC:5:p1:stack_34:BSCO-003#a1:c1'` = `1/1` (EXHAUSTED).

---

### 3.3. Attack 2 Execution Trace (Same Turn)

Because `stack_34` was refreshed, Player 1 legally declares a second attack with `BSCO-003` during the same Attack Step.

1. **Player 1 declares second attack with `BSCO-003`**:
   - `stack_34` transitions to `exhausted: true`.
   - Event `ATTACK_DECLARED` emitted.

2. **Trigger Queue & Ability Checkpoint A**:
   - Ability `BSCO-003#a1` matched on `ON_ATTACK`.
   - Ability-level restriction: `null` $\rightarrow$ Checkpoint A **passes**.

3. **Clause 0 Execution (Destroy)**:
   - Clause 0 restriction: `null` $\rightarrow$ Checkpoint B **passes**.
   - `TARGET_CARD` selects $O_2$ (3000 BP $\le$ 5000 BP).
   - `DESTROY` executes on $O_2$. $O_2$ moves to Opponent Trash.
   - Clause 0 result: `{ success: true, targetsDestroyed: 1 }`.
   - **Crucial Result**: The destruction effect fires successfully for the second time!

4. **Clause 1 Execution (Refresh - Inline Once per Turn)**:
   - Clause 1 restriction: `{ type: 'COUNT_PER_TURN', count: 1, scope: 'CLAUSE' }`.
   - Key derivation:
     $$\text{Key} = \text{`TC:5:p1:stack_34:BSCO-003#a1:c1'}$$
   - Query `state.restrictions.get('TC:5:p1:stack_34:BSCO-003#a1:c1')`:
     - Current count: `1` (Max: `1`).
     - Checkpoint B evaluates: `count >= maxCount` $\rightarrow$ **BLOCKED**.
   - Handler action:
     - Operation `REFRESH` is **bypassed**.
     - Clause returns: `{ success: true, skipped: true, reason: 'CLAUSE_LIMIT_REACHED' }`.
   - Ability resolution completes without throwing errors or rolling back Clause 0.

5. **Post-Attack 2 State**:
   - `stack_34` remains exhausted (`exhausted: true`).
   - Opponent lost $O_2$.
   - Restriction Table:
     `'TC:5:p1:stack_34:BSCO-003#a1:c1'` = `1/1` (EXHAUSTED).

---

## 4. Error Isolation & Partial Resolution Guarantees

1. **Non-Terminal Skipping**: Skipping an exhausted inline clause must never throw an unhandled exception or trigger engine rollback. It is treated as an optional sub-effect whose condition was not met.
2. **Atomic Invariance**: Splicing or modifying the active clause list dynamically at runtime is strictly prohibited. The compiler defines fixed clause indexes, and the resolver steps through them deterministically.
3. **Compound Preconditions**: If a clause specifies *"When you've done so, once per turn..."*, the clause evaluates the prerequisite resolution first (e.g., target destroyed > 0) before querying and consuming the restriction key.
