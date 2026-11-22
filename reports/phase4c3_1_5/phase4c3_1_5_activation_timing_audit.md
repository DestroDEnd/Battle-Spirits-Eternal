# Phase 4C.3.1.5 — Activation, Negation & Consumption Timing Specification

## 1. Executive Summary & Defect Correction

In Phase 4C.3.1.4, the clause consumption model treated all "negation" as occurring after limit consumption.
Independent review correctly noted that:
> A negation effect that **prevents activation** must be distinguished from one that **negates an already activated effect**.

This document defines the exact execution stages, governing rules, and counter-consumption outcomes across all 7 operational cases.

---

## 2. The 7 Operational Cases

```text
[Stage 0: Legality & Prohibition Check] ──(Case A: Cannot Activate)──> ABORT (Limit NOT Consumed)
       │
[Stage 1: Declaration]
       │
[Stage 2: Cost Payment] ──────────────(Case C: Cost Unpaid)─────────> REWIND (Limit NOT Consumed)
       │
[Stage 3: Cost Deducted]
       │
[Stage 4: ATOMIC COMMIT] ─────────────> LIMIT CONSUMED ATOMICALLY!
       │
[Stage 5: Resolution & Effect Timing]
       ├──(Case E: Negated in Resolution) ──> Effect Skipped; Limit REMAINS CONSUMED!
       ├──(Case F: Zero Targets Affected) ──> Effect Fizzles; Limit REMAINS CONSUMED!
       └──(Case G: Interrupted Resolution) ──> Partial Effect; Limit REMAINS CONSUMED!
```

### Case A — Negation / Prohibition Before Activation
- **Condition**: Continuous effect or active modifier specifies *"Player cannot activate Flash effects"* or *"This Spirit's effects cannot be activated"*.
- **Execution Stage**: **Stage 0 (Pre-Activation Check)**.
- **Rules Citation**: Comprehensive Rules Ver. 17.0, Sec 8-1-2.
- **Engine Behavior**: Legality check fails immediately with `CANNOT_ACTIVATE`.
- **Restriction Consumed**: **NO**.
- **Cost Deducted / Retained**: **Retained (No cost paid)**.
- **Status**: `OFFICIALLY_VERIFIED`.

### Case B — Activation Declared, Cost Not Yet Paid
- **Condition**: Effect is declared, target costs or core transfers are being selected.
- **Execution Stage**: **Stage 1 (Declaration)**.
- **Rules Citation**: Comprehensive Rules Ver. 17.0, Sec 8-1-3-1.
- **Engine Behavior**: Provisional declaration; counter is NOT yet incremented.
- **Restriction Consumed**: **NO**.
- **Cost Deducted / Retained**: In flight.
- **Status**: `OFFICIALLY_VERIFIED`.

### Case C — Cost Payment Fails
- **Condition**: Player cannot pay the required cores, discard required cards, or fulfill cost condition.
- **Execution Stage**: **Stage 2 (Cost Payment Failure)**.
- **Rules Citation**: Comprehensive Rules Ver. 17.0, Sec 8-1-3-2.
- **Engine Behavior**: Activation is illegal. The state rewinds to prior to declaration.
- **Restriction Consumed**: **NO**.
- **Cost Deducted / Retained**: **Retained (All payments rewound)**.
- **Status**: `OFFICIALLY_VERIFIED`.

### Case D — Activation and Cost Payment Completed
- **Condition**: Required costs paid; activation is legally established.
- **Execution Stage**: **Stage 4 (Atomic Commit)**.
- **Rules Citation**: Comprehensive Rules Ver. 17.0, Sec 8-1-3-4 & Sec 8-1-6.
- **Engine Behavior**: Usage counter is incremented in `state.restrictions.counters`.
- **Restriction Consumed**: **YES (COMMITTED)**.
- **Cost Deducted / Retained**: **Deducted (Paid)**.
- **Status**: `OFFICIALLY_VERIFIED`.

### Case E — Effect is Negated After Activation
- **Condition**: Opponent activates a counter-magic or trigger that states *"Negate that effect"* during the resolution window.
- **Execution Stage**: **Stage 5 (Resolution Negation)**.
- **Rules Citation**: Comprehensive Rules Ver. 17.0, Sec 8-1-6 & Official Q&A.
- **Engine Behavior**: Effect operations are aborted, but the activation occurred.
- **Restriction Consumed**: **YES (REMAINS CONSUMED)**.
- **Cost Deducted / Retained**: **Deducted (NO REFUND)**.
- **Status**: `OFFICIALLY_VERIFIED`.

### Case F — Effect Resolves But Affects Zero Targets
- **Condition**: All designated targets were removed, protected by immunity, or 0 valid targets exist at resolution.
- **Execution Stage**: **Stage 5 (Resolution Fizzle)**.
- **Rules Citation**: Comprehensive Rules Ver. 17.0, Sec 8-1-6.
- **Engine Behavior**: Operation completes with 0 affected targets.
- **Restriction Consumed**: **YES (REMAINS CONSUMED)**.
- **Cost Deducted / Retained**: **Deducted (NO REFUND)**.
- **Status**: `OFFICIALLY_VERIFIED`.

### Case G — Effect is Interrupted During Resolution
- **Condition**: Card destruction or mandatory replacement effect interrupts operation sequence.
- **Execution Stage**: **Stage 5 (Interruption)**.
- **Rules Citation**: Comprehensive Rules Ver. 17.0, Sec 8-1-6.
- **Engine Behavior**: Unresolved sub-clauses abort; restriction remains consumed.
- **Restriction Consumed**: **YES (REMAINS CONSUMED)**.
- **Cost Deducted / Retained**: **Deducted (NO REFUND)**.
- **Status**: `OFFICIALLY_VERIFIED`.

---

## 3. Rewrite of Test Specification TC-CLS-06

To strictly enforce this distinction, `TC-CLS-06` is divided into two distinct tests:
1. **`TC-CLS-06A` (Negation Before Activation)**:
   - *Setup*: Opposing continuous effect prevents activations.
   - *Action*: Player attempts activation.
   - *Expected*: Call returns `CANNOT_ACTIVATE`; counter remains `0/1`; zero cores deducted.
2. **`TC-CLS-06B` (Negation After Activation)**:
   - *Setup*: Ability declared and cost paid; opposing counter negates effect during resolution.
   - *Action*: Resolve ability.
   - *Expected*: Effect operations skipped; counter remains `1/1` (CONSUMED); cost is NOT refunded.
