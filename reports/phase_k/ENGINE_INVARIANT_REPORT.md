# Battle Spirits Eternal — Engine Rules & State Invariants Report
**Phase:** Phase K — Comprehensive Engine Correction & Release Readiness  
**Work Package:** F — Rules Engine & State Invariants  
**Test Suite:** `tests/phase_k_engine_invariants.test.js`  
**Execution Timestamp:** 2026-11-21  
**Status:** COMPLETE (6/6 Invariant Test Batteries Passed — 100.00%)

---

## 1. Executive Summary

In Work Package F (*Verify Rules Engine & State Invariants*), the fundamental mathematical, structural, and game-flow invariants of Battle Spirits Eternal were audited, codified, and verified. 

A production engine must guarantee that game state transitions never leak cards between zones, corrupt core totals, mismanage activation limits, violate timing windows, or allow state clone mutations to contaminate active match flow.

All six core invariants were codified into automated regression tests in [phase_k_engine_invariants.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_k_engine_invariants.test.js) and passed with 100% reliability.

---

## 2. Invariant Verification Analysis

### Invariant 1: Card Zone Conservation & Disjointness
- **Rule**: Every card in the game must occupy exactly one authoritative zone (`deck`, `hand`, `field`, `grave`, `voidCores`, `burst`, `mirage`, or `removed`) at any point in time. No card instance ID can be duplicated or exist in multiple zones simultaneously.
- **Engine Enforcement**: Implemented in `engine/state.js` via `validateGameState(state)`. The validator scans every zone, maintains a global card ID occurrence map, and validates owner assignments.
- **Test Verification (`INV-01`)**: Verified that valid card movements preserve disjointness. Adversarial injection of duplicate cards into a second zone is immediately flagged with `Duplicate card instance <id>` error.

### Invariant 2: Total Core Conservation ($\Delta C = 0$)
- **Rule**: Cores are strictly conserved within each player's sphere. The sum of normal and soul cores across `reserve`, `field` stacks, `life`, `trash`, and `voidCores` must never change unless cores are explicitly transferred to or from the external Void pool, and within any closed interaction, the total delta is exactly zero:
  $$\Delta C = \Delta C_{\text{reserve}} + \Delta C_{\text{field}} + \Delta C_{\text{life}} + \Delta C_{\text{trash}} + \Delta C_{\text{void}} = 0$$
- **Engine Enforcement**: Tracked by `getTotalPlayerCores(state, side)`.
- **Test Verification (`INV-02`)**: Verified that:
  - Summoning a Spirit deducting cores from reserve to pay cost and field placement preserves total cores ($\Delta C = 0$).
  - Manual core transfer between reserve and field stack preserves total cores ($\Delta C = 0$).
  - Paying God Cores from a Grandwalker Nexus stack directly to Void decrements field cores and increments Void cores by the exact same amount ($\Delta C = 0$).

### Invariant 3: Restriction Commitment & Rollback
- **Rule**: Activation restrictions (such as `ONCE_PER_TURN`, `ONCE_PER_STEP`, `ONCE_PER_GAME`) must operate atomically. When an ability begins evaluation, a temporary reservation is created. If resolution fails, is rejected, or is cancelled prior to commit, the reservation must roll back cleanly. Once committed, the activation counter is permanently incremented for that generation.
- **Engine Enforcement**: Implemented in `engine/restrictions.js` via `reserveRestriction`, `releaseReservation`, and `commitRestriction`.
- **Test Verification (`INV-03`)**: Verified that:
  - An initial `ONCE_PER_TURN` check returns `ALLOWED`.
  - Creating a reservation and calling `release()` cleanly rolls back state; subsequent evaluation remains `ALLOWED`.
  - Calling `commit()` permanently commits the reservation; subsequent evaluation immediately returns `LIMIT_REACHED`.

### Invariant 4: Timing Window Integrity
- **Rule**: Actions must strictly obey step and phase timing restrictions. Non-flash card plays and standard summons are restricted to the Main Step. The Attack Step permits only Flash-timed effects and attacks.
- **Engine Enforcement**: Enforced by `engine/index.js` `playCard()` and `engine/flow.js`.
- **Test Verification (`INV-04`)**:
  - Playing a non-flash Spirit during `ATTACK` step is rejected with `CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP`.
  - Playing a compiled Flash Magic card during `ATTACK` step succeeds.

### Invariant 5: Combat Flow & Battle State Transitions
- **Rule**: Combat follows a strict state-machine progression:
  1. `START` $\rightarrow$ `CORE` $\rightarrow$ `DRAW` $\rightarrow$ `REFRESH` $\rightarrow$ `MAIN` $\rightarrow$ `ATTACK` $\rightarrow$ `END`.
  2. Within `ATTACK` step: Attack Declaration $\rightarrow$ Flash Window (Opponent First) $\rightarrow$ Block Choice $\rightarrow$ Flash Window $\rightarrow$ BP Comparison / Life Damage $\rightarrow$ Battle End.
  3. `state.combat` is populated during active battle and must be cleaned up to `null` upon battle resolution.
- **Engine Enforcement**: Implemented in `engine/flow.js` and `engine/index.js` (`declareAttack`, `declareBlock`, `endBattle`).
- **Test Verification (`INV-05`)**:
  - Premature attack declaration in `MAIN` step is rejected with `ATTACK_ONLY_IN_ATTACK_STEP`.
  - In `ATTACK` step, `declareAttack` initializes `state.combat` and marks attacker `EXHAUSTED`.
  - `declareBlock` exhaustively resolves BP comparison, destroys the weaker Spirit via SBA, and flushes combat state cleanly.

### Invariant 6: State Clone Purity & Detachment
- **Rule**: Simulation engines, AI planning, and preview renders must be able to clone game state without mutating the production game. Mutations to a cloned state must have zero shared-reference contamination or prototype leaks back into the source state.
- **Engine Enforcement**: Implemented in `engine/state.js` via `cloneGameState(state)` using native `structuredClone`.
- **Test Verification (`INV-06`)**:
  - A cloned game state was subjected to hostile mutations (setting player life to 0, clearing field stacks, altering activePlayer).
  - Production game state was verified to be 100% pristine and unaltered.

---

## 3. Test Suite Results

Running `node --test tests/phase_k_engine_invariants.test.js`:

```
✔ INV-01: Every card exists in exactly one zone; validateGameState catches duplicates (6.593ms)
✔ INV-02: Core conservation holds across playCard, transfer, and payGodCores (Delta C = 0) (4.1316ms)
✔ INV-03: Restriction reservation rolls back on release, commits only on success (2.3049ms)
✔ INV-04: Non-flash cards are rejected during ATTACK step; flash cards permitted (21.9659ms)
✔ INV-05: Combat lifecycle enforces step boundaries and cleans up battle state (4.0338ms)
✔ INV-06: cloneGameState creates detached deep copy with zero shared reference mutation (2.5199ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 248.4447
```

---

## 4. Invariant Matrix Summary

| Invariant Code | Name | Primary Enforcement Function | Status |
|---|---|---|---|
| **INV-01** | Card Zone Disjointness | `engine/state.js` `validateGameState` | VERIFIED |
| **INV-02** | Core Conservation ($\Delta C = 0$) | `engine/state.js` `getTotalPlayerCores` | VERIFIED |
| **INV-03** | Restriction Atomicity & Rollback | `engine/restrictions.js` `reserveRestriction` | VERIFIED |
| **INV-04** | Timing Window Boundaries | `engine/index.js` `playCard` & `engine/flow.js` | VERIFIED |
| **INV-05** | Combat State Lifecycle | `engine/flow.js` & `engine/index.js` | VERIFIED |
| **INV-06** | State Clone Detachment | `engine/state.js` `cloneGameState` | VERIFIED |

---

## 5. Artifact Links

- Invariant Test Battery: [phase_k_engine_invariants.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_k_engine_invariants.test.js)
- State Module: [state.js](file:///c:/Users/namis/Downloads/BSP/engine/state.js)
- Restriction Module: [restrictions.js](file:///c:/Users/namis/Downloads/BSP/engine/restrictions.js)
- Flow Module: [flow.js](file:///c:/Users/namis/Downloads/BSP/engine/flow.js)
- Payment Module: [payment.js](file:///c:/Users/namis/Downloads/BSP/engine/payment.js)
