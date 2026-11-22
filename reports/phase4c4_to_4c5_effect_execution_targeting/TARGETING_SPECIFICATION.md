# Unified Targeting & Filter Specification (Phase 4C.5)

## 1. `matchesTargetFilter()` (`engine/continuous.js`)

Fixed all four previously identified filter defects:
- `'self'` requires `sourceSt`; returns `false` if `sourceSt` is null/missing.
- `'target'` / `'PREVIOUS_TARGET'` / `'previous_target'` resolves `context.previousTarget` or `context.target`; returns `false` if absent.
- Unknown string references (e.g. `''`, `'unknown_ref'`) return `false` instead of matching.
- `includeSelf` no longer returns early before checking `type`, `color`, `family`, `costLte`/`costGte`, `bpLte`/`bpGte`, `levelLte`/`levelGte`, `exhausted`, and `hasSoulCore`; it only bypasses the `side` restriction for the source stack itself while enforcing all attribute filters.
- `bpLte`/`bpGte` and `levelLte`/`levelGte` compute effective BP (`computeEffectiveBP`) and effective level (`computeLevel`) when `context.state` is provided.

## 2. `resolveTargets()` (`engine/selectors.js`)

Single unified targeting entry point used by `DESTROY`, `BOUNCE`, `ADVENT_STACK`, `SUMMON_FREE`, and `executeTargeting`:
- **Typed String References**:
  - `'self'` -> `context.sourceStack` / `context.sourceCard`
  - `'effect_card'` -> `context.triggeringCard` / `context.effectCard` / `context.sourceCard`
  - `'battling'` -> `state.battle.attacker` / `state.battle.blocker` (with optional `side` filtering)
  - `'PREVIOUS_TARGET'` / `'previous'` / `'target'` / `'selected'` -> validates availability of `context.selectedTargets` / `context.previousTarget`
  - `'all'` -> simultaneous non-prompt selection of all legal candidates
  - Unknown strings -> `{ status: 'UNSUPPORTED', success: false, reason: 'UNKNOWN_TARGET_REFERENCE' }`
- **Tie-Handling**: Supports `highest` / `lowest` on `bp`, `cost`, and `level` (`applyExtremeTieFilter`), restricting candidates to tied extremes and prompting only when `tied.length > count`.
- **Strict Selection Validation (`validateSelection()`)**:
  - Rejects any chosen item not present in `candidates`.
  - Rejects duplicate selections of the same card/stack identity.
  - Enforces `TOTAL_BP_LTE`, `TOTAL_COST_LTE`, exact `count`, and `upTo`/`optional` bounds.
- **Explicit Statuses & Context Propagation**:
  - Returns explicit `status`: `'SUCCESS' | 'NO_OP_BY_RULE' | 'REJECTED' | 'UNSUPPORTED'`.
  - Updates `context.selectedTargets`, `context.previousTargets`, and `context.previousTarget` consistently.
