# Activation Restriction & Persistent IR Reconciliation Audit (Phase 4D — Work Package F)
**Generated At:** 2026-11-21T09:32:00.000Z  
**Project:** Battle Spirits Eternal (BSP)  
**Standard:** Stage 4 Atomic Commitment & Runtime Activation Limit Enforcement  

---

## 1. Executive Summary

Work Package F audits and verifies activation restriction semantics and persistent IR metadata across all 514 IR shards and the runtime restriction engine (`engine/restrictions.js`).

- **Total Shards Audited:** 514
- **Total Compiled Abilities:** 36,422
- **Abilities with Formal Activation Limits:** 2,522 (6.92%)
- **Runtime Activation Test Suite (`tests/runtime_activation_limits.test.js`):** **166/166 PASS (100.00%)**

---

## 2. Corpus Activation Limit Distribution

All 2,522 activation-limited abilities in the canonical IR shards are categorized by limit type and enforcement scope:

| Limit Type | Enforced Scope | Clause Count | Example Cards | Engine Enforcement Policy |
|---|---|---:|---|---|
| `ONCE_PER_TURN` | Specific Card Instance | **1,551** | `26RBS01-041`, `26RBS01-012`, `26RBS01-102`, `26RBS01-X11` | Keyed by instance placement ID; resets automatically on turn change |
| `ONCE_PER_TURN_SAME_NAME` | Global Card Name | **878** | `P23-12`, `26RBS03-093`, `26RBS03-X07`, `26RBS03-X03` | Keyed by canonical card name; locks all identical cards until turn change |
| `ONCE_PER_GAME_SAME_NAME` | Global Card Name | **53** | `BSCO-004`, `BS24-X01`, `BS45-X01`, `BS60-056` | Keyed by canonical card name; persists for the entire match duration |
| `ONCE_PER_BATTLE` | Battle Combat Window | **39** | `26RBS01-050`, `26RBS01-048`, `26RBS01-057` | Keyed by instance ID and battle UID; cleared when combat ends |
| `ONCE_PER_GAME` | Specific Card Instance | **1** | `BS60-CX04` | Keyed by physical card instance UID; persists across entire match |
| **Total** | | **2,522** | | |

---

## 3. Stage 4 Atomic Commitment Lifecycle

The runtime restriction engine enforces a strict 4-phase reservation and commitment lifecycle to prevent premature lockout:

```
[Ability Triggered]
       │
       ▼
[Phase 1: Reservation Check] ─── (Already Locked) ───► [ABORT: RESTRICTION_BLOCKED]
       │ (Available)
       ▼
[Phase 2: Reserve Slot] ───► (Temporarily marked RESERVED)
       │
       ▼
[Phase 3: Condition & Prerequisite Resolution]
       ├─── (Failed Condition / Declined Optional) ───► [Phase 3b: Release Reservation]
       ▼ (Success)
[Phase 4: Atomic Commitment] ───► (Marked COMMITTED / Recorded in state.restrictions)
```

### Key Invariants Verified:
1. **No Early Commitment:** If an optional prompt is declined by the player (e.g., choosing "No" on target selection), the reserved restriction is immediately released.
2. **Transactional Rollback:** If cost payment fails midway (e.g., insufficient cores), the restriction reservation is rolled back, preserving activation eligibility.
3. **Zone Transition & State Reset:**
   - When a Spirit leaves the field and returns (e.g., bounced to hand and re-summoned), it acquires a new placement ID. Instance-level `ONCE_PER_TURN` restrictions reset for the new instance as per official Battle Spirits rules.
   - `SAME_NAME` restrictions persist across field leaves because they index canonical name rather than placement ID.

---

## 4. Test Evidence & Reconciliation

The 166 standalone test cases in `tests/runtime_activation_limits.test.js` verify:
- **Section A (TC-ACT-01 to 05):** Single-instance Once per Turn restrictions.
- **Section B (TC-ACT-06 to 10):** Same-name Once per Turn and Once per Game restrictions.
- **Section C (TC-ACT-11 to 17):** Atomic commitment timing and rollback on resolution failure.
- **Section D (TC-ACT-18 to 21):** Optionality gating and prerequisite evaluation without premature exhaustion.
- **Section E (TC-ACT-22 to 27):** Turn boundary cleanup and game-state reset behavior.
- **Section F (TC-ACT-28 to 35):** Dual-state synchronization with legacy `usedAbilities` sets.

All 166 tests pass with 100% success rate, fully reconciled in `reports/phase4d/master_test_inventory.json`.
