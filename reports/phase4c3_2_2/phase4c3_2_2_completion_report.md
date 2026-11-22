# Phase 4C.3.2.2 — Runtime Activation-Limit Enforcement Completion Report

## 1. Executive Summary

This report documents the implementation and verification of **Phase 4C.3.2.2: Runtime Activation-Limit Enforcement** for the Battle Spirits Eternal engine.

Following the formal approval of the deterministic ability identity architecture in Phase 4C.3.2.1, this phase implements the runtime activation-limit enforcement engine. The system binds the physical ability identifier (`physicalAbilityId`) and semantic ability identifier (`semanticAbilityId`) directly to authoritative runtime state counters, enforces deterministic atomic commitment timing, handles lifecycle boundary resets (`TURN`, `STEP`, `BATTLE`, `ATTACK`), and ensures seamless bidirectional synchronization with the legacy engine interface.

### Verification Key Metrics
- **New Runtime Enforcement Tests**: 35 of 35 PASSED (100%) (`TC-ACT-01` through `TC-ACT-35`).
- **Preserved Identity & Compiler Tests**: 124 of 125 PASSED (99.2%), 1 BLOCKED (`TC-COL-06`, full 514-shard batch recompilation authorized for Phase 4C.3.2.3).
- **Total Test Battery Execution**: 159 PASSED, 1 BLOCKED, 0 FAILED across 160 tests.
- **Production Data Audit**: 3 of 3 PASSED (`tests/data_audit.test.js`).
- **Regression Profile**: 0 regressions across existing compiler and engine operations.
- **Deliverables Organization**: 100% compliance with storage rules. Exactly two primary deliverable files situated inside `reports/phase4c3_2_2/` and mirrored to `C:\Users\namis\Downloads\BSP\reports\phase4c3_2_2\`, with ZERO loose files in `reports/` root.

---

## 2. Core Architectural Components

### 2.1 Restriction Module (`engine/restrictions.js`)

A dedicated runtime restriction engine was created to manage all activation limit calculations, key generation, evaluation, atomic consumption, lifecycle resets, and legacy compatibility.

#### Supported Restriction Types
```javascript
export const RESTRICTION_TYPE = Object.freeze({
  NONE: 'NONE',
  ONCE_PER_TURN: 'ONCE_PER_TURN',
  ONCE_PER_TURN_SAME_NAME: 'ONCE_PER_TURN_SAME_NAME',
  ONCE_PER_GAME: 'ONCE_PER_GAME',
  ONCE_PER_GAME_SAME_NAME: 'ONCE_PER_GAME_SAME_NAME',
  ONCE_PER_STEP: 'ONCE_PER_STEP',
  ONCE_PER_BATTLE: 'ONCE_PER_BATTLE',
  ONCE_PER_ATTACK: 'ONCE_PER_ATTACK',
  UNKNOWN: 'UNKNOWN'
});
```

#### Restriction Scopes & Lifecycle Lifespans
```javascript
export const RESTRICTION_SCOPE = Object.freeze({
  PERMANENT: 'PERMANENT',
  GAME: 'GAME',
  TURN: 'TURN',
  STEP: 'STEP',
  BATTLE: 'BATTLE',
  ATTACK: 'ATTACK'
});
```

#### Deterministic Restriction Key Generation
Each restriction produces an unambiguous, collision-resistant string key formatted per official Battle Spirits Eternal rules:
- **Ordinary `[Once per turn]`**: `turn:{turnNumber}:{player}:{placementId}:{physicalAbilityId}`
  *Scoped to the physical placement instance (`p_N`) and ability instance (`#AB_...`).*
- **`[Once per turn: Same Name]`**: `turn:{turnNumber}:{player}:same_name:{cardName}:{semanticAbilityId}`
  *Scoped to the player, canonical card name, and semantic ability identity (`#SEM_...`).*
- **Ordinary `[Once per game]`**: `game:{player}:card:{cardId}:{physicalAbilityId}`
  *Scoped to the card and ability across all turns of the game.*
- **`[Once per game: Same Name]`**: `game:{player}:same_name:{cardName}:{semanticAbilityId}`
  *Scoped across all physical copies of the card for that player across all turns of the game.*
- **Step-scoped (`ONCE_PER_STEP`)**: `step:{turnNumber}:{step}:{player}:{placementId}:{physicalAbilityId}`
- **Battle-scoped (`ONCE_PER_BATTLE`)**: `battle:{turnNumber}:{combatId}:{player}:{placementId}:{physicalAbilityId}`
- **Attack-scoped (`ONCE_PER_ATTACK`)**: `attack:{turnNumber}:{combatId}:{player}:{placementId}:{physicalAbilityId}`

#### Authoritative State Representation
State restrictions are stored strictly as serializable plain-JSON objects on `state.restrictions`:
```javascript
state.restrictions = {
  counters: {
    // key -> number (e.g. "turn:1:player:p_1:BS01-001#AB_...": 1)
  },
  meta: {
    // key -> { type, scope, limit, lastTurn, committedCount, ... }
  }
};
```

---

## 3. Atomic Commitment Timing & State Lifecycle

### 3.1 Stage 4 Atomic Commit Model
Activation limits are strictly evaluated and consumed in accordance with Battle Spirits Eternal Rule Manual 17.0 and official rulings:
1. **Pre-Flight Check (Stage 0)**:
   - When an ability is declared, `evaluateRestriction(state, ability, context)` is queried.
   - If the limit has already been reached, execution aborts with `RESTRICTION_STATUS.LIMIT_REACHED` (`success: false, activated: false, isCommitted: false`).
   - If physical or semantic identity is missing or malformed, execution aborts with `INVALID_IDENTITY`.
   - If the restriction type is unrecognized, execution aborts with `UNSUPPORTED_RESTRICTION`.
2. **Pre-Commit Invalidation / Decline (Stages 1–3)**:
   - If a timing window or level condition is unmet (`ABILITY_TIMING_MISMATCH`, `ABILITY_LEVEL_MISMATCH`), the declaration fails without committing (`isCommitted: false`, counter remains 0).
   - If a structured prerequisite condition evaluates to `FALSE` or `UNSUPPORTED`, the clause skips without committing (`isCommitted: false`).
   - If an optional effect prompt (`CONFIRM_OPTIONAL`) is declined by the player, the activation terminates cleanly without committing (`optionalDeclined: true, isCommitted: false`).
   - If a mandatory cost clause (`isCost: true`) cannot be fully paid (e.g. insufficient cores, unpayable discard), the activation terminates without committing (`costPaid: false, isCommitted: false`).
   - If target selection is cancelled or fails before cost payment/execution, no limit is consumed.
3. **Atomic Commitment (Stage 4)**:
   - Once all prerequisite conditions are met and any mandatory cost is successfully paid (or at the inception of the first non-cost clause), `commitActivation()` executes.
   - The authoritative counter in `state.restrictions.counters[key]` increments atomically.
   - An idempotency guard prevents double-consumption (`isCommitted` flag; `commitRestriction()` rejects duplicate commits with status `DUPLICATE_COMMIT`).
   - The legacy `state.abilityUses` dictionary is updated in lockstep.
   - The event bus emits `ACTIVATION_COMMITTED`.
4. **Post-Commit Failure & Negation (Stage 5)**:
   - If an effect is subsequently negated by a continuous modifier (`NEGATE_EFFECT`) or a post-commit operation fails (e.g. empty deck on draw, invalid destination), **the activation limit is NOT refunded**. `isCommitted` remains `true` and the counter remains incremented.

### 3.2 Lifecycle Reset Triggers
- **Turn Reset (`TURN`)**: Triggered at turn transition (`FlowController.advanceStep()` entering `END` step). Clears all `turn:*` keys while preserving all `game:*` OPG counters.
- **Step Reset (`STEP`)**: Triggered at every step change in `FlowController.advanceStep()`. Clears all `step:*` keys for the completed step.
- **Battle Reset (`BATTLE`)**: Triggered when a battle concludes in `engine/index.js` (`pruneBattleModifiers()`). Clears all `battle:*` keys.
- **Attack Reset (`ATTACK`)**: Triggered when an attack sequence ends. Clears all `attack:*` keys.

---

## 4. Production Integration Details

### 4.1 State Initialization & Physical Placement Tracking (`engine/state.js`)
- Added `nextPlacementId` counter and `resetPlacementIdCounter()` for test isolation.
- Modified `createFieldStack()` to accept `options.placementId` and automatically assign a deterministic placement ID (`p_1`, `p_2`, ...) to both the stack and `topCard`.
- Initialized `state.restrictions = { counters: {}, meta: {} }` in `createGameState()`.

### 4.2 Ability Resolver Integration (`engine/resolver.js`)
- Bound `evaluateRestriction()` pre-flight check at the start of `resolveAbility()`.
- Implemented `abilityContext.commitActivation()` callback passed down to `resolveClause()`.
- Gated non-cost clauses to trigger atomic commit upon successful entry.
- Gated cost clauses (`clause.isCost`) so commitment ONLY occurs after cost operations verify full payment (`coresMoved`, `discardedCount`, etc.).
- Maintained targeting context without cloning `context` reference, ensuring full backward compatibility with unified targeting.

### 4.3 Engine Facade & Timing Windows (`engine/index.js`)
- Updated `activateAbility(cardId, abilityId, playerSide)` to evaluate restriction pre-flight and supply `placementId`.
- Propagated `isCommitted: false` on timing or level check failures.
- Added lifecycle reset hooks in `pruneBattleModifiers()` for `BATTLE` and `ATTACK` scopes.

### 4.4 Flow Controller (`engine/flow.js`)
- In `FlowController.advanceStep()`, integrated `resetRestrictions(this.state, 'STEP')` on step transitions.
- Integrated `resetRestrictions(this.state, 'TURN')` when transitioning past `END` step into a new turn.

### 4.5 Legacy Bridge (`engine/legacy_bridge.js`)
- In `createEngineStateFromLegacy()`, restored `duelState.restrictions` or synced from legacy `abilityUses` via `syncLegacyToRestrictions()`.
- Preserved existing `placementId` across legacy card mappings.
- In `syncEngineStateToLegacy()`, cloned `state.restrictions` into `duelState.restrictions` and synced `abilityUses` bidirectionally.
- In `resolveLegacyAbility()`, passed `placementId` to enable runtime restriction enforcement on legacy calls.

---

## 5. Test Verification Matrix

All 35 newly implemented tests (`TC-ACT-01` through `TC-ACT-35`) were executed and verified:

| Test ID | Test Category | Description | Status |
| :--- | :--- | :--- | :--- |
| `TC-ACT-01` | Section A: Ordinary OPT | First activation succeeds and consumes physical limit | **PASSED** |
| `TC-ACT-02` | Section A: Ordinary OPT | Second activation of same physical ability is rejected | **PASSED** |
| `TC-ACT-03` | Section A: Ordinary OPT | Second physical copy independently activates ordinary OPT | **PASSED** |
| `TC-ACT-04` | Section A: Ordinary OPT | Two distinct abilities on same card maintain separate counters | **PASSED** |
| `TC-ACT-05` | Section A: Ordinary OPT | New physical placement receives correct new restriction identity | **PASSED** |
| `TC-ACT-06` | Section B: Same Name OPT | First qualifying Same Name activation succeeds | **PASSED** |
| `TC-ACT-07` | Section B: Same Name OPT | Another physical copy with same semantic ability is blocked | **PASSED** |
| `TC-ACT-08` | Section B: Same Name OPT | Different semantic ability on same card name is not blocked | **PASSED** |
| `TC-ACT-09` | Section B: Same Name OPT | Opponent has independent Same Name restriction scope | **PASSED** |
| `TC-ACT-10` | Section B: Same Name OPT | Equivalent abilities with different placement IDs share limit | **PASSED** |
| `TC-ACT-11` | Section C: Commitment Timing | Failed declaration before commitment does not consume limit | **PASSED** |
| `TC-ACT-12` | Section C: Commitment Timing | Unpayable cost before commitment does not consume limit | **PASSED** |
| `TC-ACT-13` | Section C: Commitment Timing | Cancelled target selection before commit does not consume limit | **PASSED** |
| `TC-ACT-14` | Section C: Commitment Timing | Successful commitment consumes limit exactly once | **PASSED** |
| `TC-ACT-15` | Section C: Commitment Timing | Negation after commitment does not refund limit | **PASSED** |
| `TC-ACT-16` | Section C: Commitment Timing | Resolution failure after commitment does not refund limit | **PASSED** |
| `TC-ACT-17` | Section C: Commitment Timing | Duplicate commitment callback does not double-consume | **PASSED** |
| `TC-ACT-18` | Section D: Optionality & Conditions | Declining optional ability does not consume limit | **PASSED** |
| `TC-ACT-19` | Section D: Optionality & Conditions | Accepting optional ability follows normal commitment process | **PASSED** |
| `TC-ACT-20` | Section D: Optionality & Conditions | FALSE prerequisite skips without consumption before commit | **PASSED** |
| `TC-ACT-21` | Section D: Optionality & Conditions | UNSUPPORTED prerequisite blocks safely and reports status | **PASSED** |
| `TC-ACT-22` | Section E: Reset Lifecycle | TURN restriction resets at correct turn boundary | **PASSED** |
| `TC-ACT-23` | Section E: Reset Lifecycle | STEP restriction resets only at correct step boundary | **PASSED** |
| `TC-ACT-24` | Section E: Reset Lifecycle | BATTLE restriction resets at battle end | **PASSED** |
| `TC-ACT-25` | Section E: Reset Lifecycle | ATTACK restriction resets at attack end | **PASSED** |
| `TC-ACT-26` | Section E: Reset Lifecycle | One player reset does not clear opponent independent counters | **PASSED** |
| `TC-ACT-27` | Section E: Reset Lifecycle | Duplicate lifecycle events do not corrupt counter state | **PASSED** |
| `TC-ACT-28` | Section F: Persistence & Bridge | JSON serialization/restoration preserves restriction state | **PASSED** |
| `TC-ACT-29` | Section F: Persistence & Bridge | Restored state still blocks already-used activation | **PASSED** |
| `TC-ACT-30` | Section F: Persistence & Bridge | Legacy abilityUses mirror remains synchronized | **PASSED** |
| `TC-ACT-31` | Section F: Persistence & Bridge | Legacy activation entry point enforces same restriction | **PASSED** |
| `TC-ACT-32` | Section F: Persistence & Bridge | Modern restriction state survives legacy conversion | **PASSED** |
| `TC-ACT-33` | Section F: Persistence & Bridge | Missing or malformed identity is rejected safely | **PASSED** |
| `TC-ACT-34` | Section F: Persistence & Bridge | Unknown restriction type is not treated as unrestricted | **PASSED** |
| `TC-ACT-35` | Section F: Persistence & Bridge | Golden compiler regression tests pass unchanged | **PASSED** |

---

## 6. Strict Scope and Boundary Compliance

1. **Compiler Preservation**: No compiler modules, parser regular expressions, or identity hashing routines were modified.
2. **IR Shard Preservation**: Zero card shards or IR schemas were altered or recompiled. `TC-COL-06` remains strictly `BLOCKED` as mandated, pending Phase 4C.3.2.3.
3. **Card Status Invariance**: Zero card implementation statuses were modified.
4. **Phase Isolation**: Phase 4C.3.2.3 was not commenced.
5. **Clean Repository Organization**: All deliverables are located in `reports/phase4c3_2_2/`, with zero loose files created in the `reports/` root.

---

## 7. Deliverable Archive Manifest

The accompanying archive `phase4c3_2_2_handoff.zip` contains:
- `engine/restrictions.js` (Runtime restriction module)
- `engine/state.js` (Placement tracking and state schema)
- `engine/resolver.js` (Pre-flight check and Stage 4 Atomic Commit hooks)
- `engine/index.js` (Engine facade and battle/attack prune hooks)
- `engine/flow.js` (Step and Turn lifecycle reset hooks)
- `engine/legacy_bridge.js` (Legacy bridge synchronization and placement preservation)
- `tests/runtime_activation_limits.test.js` (Full 35-test enforcement test suite)
- `test_execution_logs.txt` (Full 160-test execution transcript)
- `TEST_INVENTORY.csv` (Complete 160-test CSV inventory)
- `UNRESOLVED_LIMITATIONS.md` (Scope limitations and Phase 4C.3.2.3 readiness)
- `MANIFEST.txt` (Cryptographic SHA-256 verification manifest)
- `phase4c3_2_2_completion_report.md` (This document)
