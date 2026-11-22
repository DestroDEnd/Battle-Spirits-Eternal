# Phase 4C.3.1.1 — Activation Lifecycle & Consumption Timing Specification

## 1. Executive Summary

A critical ambiguity in Phase 4C.3.1 was the exact moment an activation limit is "consumed". If an activation counter is incremented too late (e.g., after resolution), an interrupted or negated effect might fail to consume its limit, allowing improper reactivation. Conversely, if an activation counter is incremented too early (e.g., during legality checks), an illegal or aborted declaration could permanently burn a player's once-per-turn limit.

This document establishes the formal 7-stage activation lifecycle for Battle Spirits Eternal, defines the exact atomic consumption point, and maps out all eight resolution outcomes with strict adherence to Official Battle Spirits Rules (Rule 8-5).

---

## 2. The 7-Stage Activation Lifecycle

Every card effect, whether triggered (`ON_ATTACK`, `WHEN_DESTROYED`), optional flash window, or manual ignition (`MAIN`, `FLASH`), progresses through seven discrete phases:

```
┌────────────────────────────────────────────────────────┐
│ Stage 1: Trigger Detection & Candidate Queueing        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Stage 2: Legality & Precondition Verification           │
│         - Verify Timing, Costs, and Restrictions       │
└──────────────────────────┬─────────────────────────────┘
                           │ (If Legal)
┌──────────────────────────▼─────────────────────────────┐
│ Stage 3: Declaration & Cost Payment                    │
│         - Core/Soul Core depletion, card exhaust       │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ ★ Stage 4: ATOMIC LIMIT CONSUMPTION POINT ★             │
│   - Increment state.restrictions tracker               │
│   - Mirror to legacy abilityUses for compatibility     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Stage 5: Effect Resolution Pipeline                    │
│         - Execute operations, target selection         │
│         - Evaluate clause-level restrictions           │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Stage 6: Post-Resolution & Interruption Handling        │
│         - Check negation, source zone status           │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Stage 7: Event Emission & Trigger Propagation           │
│         - Emit resolution events, check chain triggers │
└────────────────────────────────────────────────────────┘
```

### Detailed Stage Breakdown:

1. **Stage 1: Trigger Detection & Queueing**:
   - The game flow emits an event (e.g., `ATTACK_DECLARED`, `CORE_REMOVED`, `FLASH_WINDOW_OPEN`).
   - The engine checks registered abilities matching the trigger. Candidate abilities are pushed to the pending activation queue.

2. **Stage 2: Legality & Precondition Verification**:
   - `canActivateAbility(state, stack, ability)` evaluates:
     a. Level requirement (`stack.level >= ability.level`).
     b. Active status / Silencing effects (`SILENCE`, `CANNOT_ACTIVATE`).
     c. Cost affordability (e.g., sufficient cores to pay cost, ability to exhaust).
     d. **Usage Restriction Query**: Checks `state.restrictions` using the derived stable key. If current count $\ge$ max count, activation is rejected immediately with `{ legal: false, reason: 'RESTRICTION_EXHAUSTED' }`.

3. **Stage 3: Declaration & Cost Payment**:
   - The player declares the activation.
   - Immediate activation costs are deducted from the game state (e.g., cores moved to trash, Spirit exhausted).

4. **Stage 4: Atomic Limit Consumption**:
   - **Immediately following successful cost payment and prior to operation execution**, the restriction tracker commits the usage increment:
     ```javascript
     state.restrictions.recordUsage(restrictionKey, {
       turn: state.turnNumber,
       step: state.step,
       battleId: state.combat?.id,
       timestamp: Date.now()
     });
     ```
   - *Rule Justification*: Under Official Rule 8-5.1, declaring an ability and paying its cost constitutes an activation. Even if the effect is subsequently negated, target-less, or interrupted, the activation has occurred.

5. **Stage 5: Effect Resolution Pipeline**:
   - `engine/resolver.js:resolveAbility` iterates through compiled clauses.
   - For compound abilities with clause-level limits (`CLAUSE` scope), each clause checks its own restriction key prior to executing operations.

6. **Stage 6: Post-Resolution & Interruption Handling**:
   - Check if an opponent's continuous negation effect (e.g., "Negate all opposing Spirit effects") or response card intercepted the resolution.
   - Clean up temporary target locks.

7. **Stage 7: Event Emission & Trigger Propagation**:
   - Emit `ABILITY_RESOLVED` or `ABILITY_NEGATED`.
   - Any follow-up triggers responding to this resolution are queued for the next resolution cycle.

---

## 3. Resolution Outcomes & Consumption State Matrix

The table below defines the exact system behavior, restriction state, and cost status across all eight possible execution paths:

| Outcome ID | Scenario Description | Declaration Occurred? | Costs Paid? | Operations Executed? | Restriction Consumed? | Refund Allowed? |
|---|---|---|---|---|---|---|
| **OUT-01** | **Complete Success**: All targets valid, all clauses resolve successfully. | YES | YES | YES (100%) | **YES** | NO |
| **OUT-02** | **Partial Success**: E.g., ability instructs "destroy up to 2 Spirits", but opponent controls only 1. 1 destroyed. | YES | YES | YES (Partial) | **YES** | NO |
| **OUT-03** | **Zero-Target / Fizzle**: E.g., target selected becomes invalid (protected by Heavy Armor or removed) before resolution. | YES | YES | NO (Fizzled) | **YES** | NO |
| **OUT-04** | **Interrupted Resolution**: Game state changes mid-resolution (e.g., simultaneous destruction rule). | YES | YES | Partial | **YES** | NO |
| **OUT-05** | **Effect Negated**: Opposing card negates effect during resolution (e.g., "Negate opposing Magic effect"). | YES | YES | NO (Negated) | **YES** (Rule 8-5.2) | NO |
| **OUT-06** | **Source Removed from Field**: Source Spirit destroyed by reaction effect before its queued ability resolves. | YES | YES | Clause-dependent | **YES** | NO |
| **OUT-07** | **Illegal Activation during Payment**: Player cannot pay declared cost (e.g. invalid core target). | NO | NO (Aborted) | NO | **NO** | N/A |
| **OUT-08** | **Rejected Precondition**: Limit was already reached in Stage 2. | NO | NO | NO | **NO** (Prior count unchanged) | N/A |

---

## 4. Analysis of Edge Cases & Official Rule Harmonization

### 4.1. Negation vs. Activation (Rule 8-5.2)
- **Question**: If an effect's resolution is negated (e.g., by a Magic card stating *"Negate that effect"*), does the once-per-turn limit reset or refund?
- **Official Rule 8-5.2**:
  > *"When the effect of an activated ability is negated, the activation itself remains valid. Any costs paid are not refunded, and any usage limits (such as 'Once per turn') associated with that activation are considered used."*
- **Engine Invariant**: The consumption in Stage 4 is never rolled back by an `OP_NEGATE` or `OP_CANCEL` event in Stage 6.

### 4.2. Zero-Target Resolution ("Do as much as possible")
- In Battle Spirits, an effect that fails to find valid targets still fully resolves. For example, if a player activates *"Once per turn: Destroy 1 opposing 4000 BP or lower Spirit"* while the opponent controls no valid targets, the ability is legally activated and resolves with 0 targets affected.
- **Engine Behavior**: Stage 4 consumes the limit; Stage 5 executes `TARGET_CARD` which returns 0 matches; the operation logs `{ success: true, targetsAffected: 0 }`. The once-per-turn limit remains **consumed**.

### 4.3. Source Removal Mid-Queue
- If Spirit $A$ attacks, queueing `ON_ATTACK`, but an opponent's burst destroys Spirit $A$ before its effect resolves:
  - If the ability was already declared and paid for in Stage 3, it proceeds to Stage 4 (consumed) and resolves using snapshot source data where permitted by rule.
  - If it was queued but not yet reached in the resolution loop when destroyed, Battle Spirits Rule 8-2 determines whether the effect persists. If it persists, limit is consumed upon execution. If it fizzles before declaration, Stage 3 is never reached and limit is **not** consumed.

---

## 5. Architectural Implementation Contract

1. `engine/restrictions.js` will expose:
   - `checkRestriction(state, key, limitDef): { allowed: boolean, remaining: number }`
   - `consumeRestriction(state, key, limitDef, metadata): void`
   - `resetRestrictions(state, intervalType): void`
2. `engine/resolver.js` will call `checkRestriction` exclusively during Stage 2 (`canActivateAbility`) and `consumeRestriction` exclusively during Stage 4 (`resolveAbility`), prior to invoking clause iterators.
3. No engine operation or event listener is permitted to decrement or delete an active counter outside official interval reset events.
