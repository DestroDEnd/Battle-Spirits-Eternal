# Phase K.1 Engine Invariants & Transaction Safety Report

**Document Version:** 1.0.0  
**Phase:** Phase K.1 Unified Targeting, Source-Zone Integrity & Evidence Verification Closure  
**Work Package:** Work Package N (Engine Invariants and Transaction Safety)  
**Test Suite:** `tests/phase_k1_engine_invariants.test.js` (15/15 PASS, 100%)  
**Verification Date:** 2026-11-22  
**Status:** COMPLETE & VERIFIED

---

## 1. Executive Summary

The integrity of Battle Spirits Eternal depends strictly on deterministic state conservation and atomic transaction boundaries. In previous audits, informal targeting logic and direct state manipulation allowed edge-case anomalies:
- Side fallthrough (player target filters accidentally accepting opponent cards).
- Source-zone precedence override (incidental revealed cards overriding explicit `from: 'trash'`).
- Fragmented card identity (losing Rebirth Face B properties on zone transitions).
- Stale target references producing ghost state mutations.

Under **Phase K.1 Work Package N**, all 15 foundational engine invariants were formally validated through an adversarial test battery (`tests/phase_k1_engine_invariants.test.js`). All 15 invariant tests passed with 100% compliance.

---

## 2. Invariant Verification Matrix (15 Core Invariants)

| Invariant ID | Requirement | Test Case | Status | Verification Evidence |
|---|---|---|:---:|---|
| **INV-01** | Card Zone Disjointness | `INV-K1-01` | **PASS** | Every card instance ID exists in exactly one physical zone across both players (80 unique cards, 0 duplicates). |
| **INV-02** | Zero Duplication During Movement | `INV-K1-02` | **PASS** | Card transfer between zones decrements source by 1, increments destination by 1, preserving exact instance identity. |
| **INV-03** | Failed Transaction Atomic Rollback | `INV-K1-03` | **PASS** | When a summon transaction fails mid-execution due to cost or target issues, state rolls back atomically; cards do not disappear. |
| **INV-04** | Core Conservation ($\Delta C = 0$) | `INV-K1-04` | **PASS** | Total player cores ($C_{\text{total}} = C_{\text{life}} + C_{\text{reserve}} + C_{\text{field}} + C_{\text{trash}}$) remain constant across all legal core movements. |
| **INV-05** | Invalid Selections Cannot Mutate State | `INV-K1-05` | **PASS** | Supplying non-existent or illegal target IDs produces a clean rejection and leaves state identical to pre-snapshot. |
| **INV-06** | Failed Costs Do Not Partially Commit | `INV-K1-06` | **PASS** | When cost cannot be fully satisfied, 0 cores are deducted from reserve and the source card remains untouched in hand. |
| **INV-07** | Invalid Target Sides Rejected | `INV-K1-07` | **PASS** | Friendly spirits supplied to an opponent-only target spec fail preflight side validation with zero mutations. |
| **INV-08** | Invalid Source Zones Rejected | `INV-K1-08` | **PASS** | Declaring `from: 'trash'` when the card is physically in `hand` is rejected during preflight zone presence check. |
| **INV-09** | Stale Target References Rejected | `INV-K1-09` | **PASS** | Targets destroyed or moved earlier in a chain cannot be re-targeted; subsequent clauses fail cleanly or return no-op. |
| **INV-10** | Nested Prompts Context Preservation | `INV-K1-10` | **PASS** | Secondary/nested decisions inherit parent ability ID and execution context without crosstalk. |
| **INV-11** | Pending Interaction Cannot Be Bypassed | `INV-K1-11` | **PASS** | Interactions place the engine in `WAITING_FOR_PLAYER`; flow pauses until an authoritative response promise resolves. |
| **INV-12** | Completed Interaction Cannot Be Reused | `INV-K1-12` | **PASS** | Attempting to submit a second response to an already resolved interaction is rejected with `NOT_PENDING`. |
| **INV-13** | Card Identity Survival Across Movements | `INV-K1-13` | **PASS** | Physical card instance ID (`card.id`) remains persistent across deck $\to$ hand $\to$ field $\to$ grave transitions. |
| **INV-14** | Resolver Failure Consistency | `INV-K1-14` | **PASS** | Corrupted or unhandled opcodes fail safely without leaving orphaned state objects or invalidating `validateGameState`. |
| **INV-15** | Activation Restriction Integrity | `INV-K1-15` | **PASS** | Second activation of `ONCE_PER_TURN` within the same turn is blocked with `LIMIT_REACHED`. |

---

## 3. Detailed Technical Analysis

### 3.1 Zone Conservation & Disjointness
The engine guarantees that a card instance cannot exist in more than one zone simultaneously:
$$\forall c \in \text{Cards}, \quad \sum_{z \in \text{Zones}} \mathbb{I}(c \in z) = 1$$
During `moveCard(state, card, toZone, toSide)`, the engine verifies source presence, removes the card from the source array, updates `card.currentOwner`, and prepends/appends to the destination array in a single synchronous turn tick.

### 3.2 Core Conservation
$$\Delta C_{\text{total}} = \Delta C_{\text{life}} + \Delta C_{\text{reserve}} + \Delta C_{\text{field}} + \Delta C_{\text{trash}} = 0$$
Except for explicit VOID creation (`MOVE_CORE` from `void`), no cores are created or destroyed. In `tests/phase_k1_engine_invariants.test.js`, core movements across all zones preserved the exact core inventory without drift.

### 3.3 Atomic Rollback & Preflight Validation
All operations in `engine/ops/index.js` perform preflight validation before committing state deltas. If target availability, core reserves, or source zone checks fail, the transaction returns `{ success: false, reason: '...' }` with zero state modifications.

---

## 4. Conclusion

Work Package N establishes that the core rules engine satisfies strict mathematical invariants: card uniqueness, core conservation, atomic rollback, and strict side/zone isolation.
