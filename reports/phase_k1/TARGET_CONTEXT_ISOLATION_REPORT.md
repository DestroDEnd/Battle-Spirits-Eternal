# Phase K.1 — Targeting Context Isolation Report

## 1. Architectural Overview & Context Lifecycle
During ability resolution, intermediate target and zone references must propagate cleanly along connected clauses without leaking across unrelated effects or turns.

The monitored context variables include:
- `this_card`: Current ability host card instance.
- `target` / `selectedTargets`: Explicitly targeted and validated cards/stacks for the active operation.
- `previous_target` / `previousTargets`: Candidates selected by immediately preceding targeting clauses, retained only when downstream grammar requires them (e.g. `sameFamilyAsPrevious`, `PREVIOUS_TARGET`).
- `revealedCards`: Temporary public cards revealed by preceding scry/reveal opcodes.
- `sourceCard`: The physical card instigating the effect.
- `controller`: The player resolving the effect.

---

## 2. Implemented Isolation Invariants

1. **Source-Zone Precedence Over Revealed Context:**
   - Preceding `REVEAL` opcodes stage cards into `context.revealedCards`. Downstream operations specifying an explicit `op.from` (such as `from: 'TRASH'`, `from: 'GRAVE'`, `from: 'HAND'`) unconditionally query their specified physical zone and ignore incidental `revealedCards`.
2. **Strict Disconnect for Fresh Targets:**
   - Operations specifying a fresh selector or filter (without an explicit `PREVIOUS_TARGET` opcode) evaluate fresh candidate queries across the field. Stale `previousTarget` entries are never accidentally substituted for newly requested targets.
3. **Optional Decline Context Purge:**
   - If a player declines an optional targeting clause (`res.optionalDeclined === true` or `{ declined: true }`), `abilityContext.previousTarget`, `previousTargets`, and `selectedTargets` are explicitly set to `null` and `[]`. Subsequent clauses cannot execute upon an unchosen or declined target.
4. **Physical Location Recheck (Ghost Mutation Prevention):**
   - Before mutating game state in removal opcodes (`DESTROY`, `BOUNCE`), the engine re-verifies that the target stack remains on `p.field`. If an interleaved effect removed or banished the target prior to resolution, the operation halts safely with zero side-effects.

---

## 3. Verification Battery (`tests/phase_k1_target_context_isolation.test.js`)

| Invariant | Test Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- |
| **Zone Precedence** | Explicit `SALVAGE` from GRAVE with revealed cards staged in context | Salvages from GRAVE; ignores revealed pool | **PASS (13.59ms)** |
| **Target Isolation** | Fresh `DESTROY` with name filter while `previousTarget` exists in context | Destroys card matching new filter; ignores `previousTarget` | **PASS (3.06ms)** |
| **Decline Purge** | Optional `DESTROY` clause declined by player | Purges `previousTarget`, `previousTargets`, and `selectedTargets` | **PASS (5.89ms)** |
| **Pre-Mutation Recheck** | Target card moved to grave before prompt resolution completes | Rejects mutation; 0 cards destroyed | **PASS (0.49ms)** |

**Suite Result:** 4 passed, 0 failed, 0 skipped (100% pass rate).
Proceed to **Work Package I (Mechanic Implementation and Real-Card Regressions)**.
