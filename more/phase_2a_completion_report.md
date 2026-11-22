# Phase 2A Completion Report: Execution Correctness

**Date:** 2026-11-13  
**Project:** Battle Spirits Eternal (`c:\Users\namis\OneDrive\Documents\BSP`)  
**Scope:** Repair fundamental execution correctness defects in the effect engine (`engine/resolver.js`, `engine/ops/index.js`, `engine/index.js`) and document/test legacy bridge defects (`engine/legacy_bridge.js`) without rewriting the engine, mass-recompiling cards, or breaking existing working functionality.

---

## 1. Files Modified
- [`engine/resolver.js`](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/resolver.js)
- [`engine/ops/index.js`](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/ops/index.js)
- [`engine/index.js`](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/index.js)

## 2. Files Created
- [`tests/phase2a_execution_correctness.test.js`](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/phase2a_execution_correctness.test.js)

---

## 3. Tests Before and After

| Suite / Command | Before (Baseline) | After Phase 2A |
| :--- | :--- | :--- |
| Full Suite (`node tests/run_all.js`) | 158 files, 335 suites, **1140 passed**, 0 failed, 0 skipped | 159 files, 335 suites, **1152 passed**, 0 failed, 0 cancelled, 0 skipped |
| Data Audit (`node --test tests/data_audit.test.js`) | **3 passed**, 0 failed | **3 passed**, 0 failed |
| Phase 2A Targeted (`node --test tests/phase2a_execution_correctness.test.js`) | — | **12 passed**, 0 failed |

The 12 new tests in `tests/phase2a_execution_correctness.test.js` cover:
1. Unsupported conditions
2. False conditions
3. Successful conditions
4. Unsupported operations
5. Failed operations
6. `afterResolves` conditions
7. Optional effects
8. Failed costs
9. Multiple connected clauses
10. Ability-level result propagation
11. Once-per-turn limits
12. Legacy card identity & state mapping defects

---

## 4. Operations Repaired (`engine/ops/index.js`)

- **Entry & Parameter Validation**: Added explicit validation returning `INVALID_STATE`, `INVALID_OPERATION`, `INVALID_CONTROLLER`, and `INVALID_PARAMETERS` (for negative or non-finite `count`).
- **Prompt Guards & Accurate Result Reporting**:
  - Added `MISSING_PROMPT_RESOLVER` guards before `promptResolver.choose` in `DESTROY`, `BOUNCE`, and `EXHAUST`.
  - Fixed `DESTROY` prompt to include `count: op.count || 1`.
  - Fixed `BOUNCE` to return `{ success: bounced.length > 0, bouncedCount: bounced.length, cards: bounced }`.
  - Fixed `EXHAUST` to return `{ success: exhaustedCount > 0, exhaustedCount }`.
  - Fixed `TARGET_CARD` / `TARGET` / `TARGET_SELECT` / `TARGET_CARDS` / `CHOOSE_TARGETS` to return `success: selected.length > 0`.
  - Fixed `DECK_OR_HAND_ACTION` / `DECK_ACTION` (`DRAW` / `MILL`) to return `success: drawn.length > 0` / `milled.length > 0`, and to return `UNSUPPORTED_OPERATION` for unhandled sub-actions.
- **Removed False-Success No-Ops (27 Operations)**:
  Converted silent no-op and unread dummy-modifier ops to return `{ success: false, supported: false, reason: 'UNSUPPORTED_OPERATION', op: op.op }`:
  - `CONTINUOUS_RULE`, `CARD_RULE_MODIFIER`, `RULE_OR_TEXT_MODIFIER`, `MAGIC_RESTRICTION`, `PLAY_CONDITION`
  - `INDESTRUCTIBLE`, `UNPREVENTABLE`, `CANNOT_REFRESH`, `PREVENT_WHEN_SUMMONED`, `RUSH_CONDITION`
  - `CONTINUE_BATTLE`, `SYMBOL_RULE`, `COST_RULE`, `TARGET_CONSTRAINT`, `MODIFY_EFFECT`, `MODIFY_EFFECT_VALUE`
  - `FORMAT_MARKER`, `ACTIVATE_FLASH`, `CAST_MAGIC_FREE`, `ACTIVATE_BURST`, `SET_BURST`, `ACTIVATE_EFFECT_ACTION`
  - `CHANGE`, `MIRAGE_OPERATION`, `TOKEN_DEPLOYMENT`, `ADVENT_PAY`, `PAY_COST`
- **Preserved Working Operations**: Kept `RESTRICTION` / `OPPONENT_RESTRICTION` (`SET_RESTRICTION`) and `COUNT_OPERATION` (`p.counters`).

---

## 5. Conditions Supported (`engine/resolver.js`)

`evaluateCondition(state, conditionStr, context)` now returns explicit `CONDITION_RESULT` values (`TRUE`, `FALSE`, `UNSUPPORTED`):

- **Missing Context**: Explicitly returns `FALSE` with `MISSING_CONTEXT_*` reasons rather than silently passing.
- **Recognized Conditions**:
  1. `destroyed_by_opponent`
  2. `summoned_from_removed`
  3. `soul core` + `pay` / `used` / `cost`
  4. `no spirits` / `control no spirits`
  5. `life is at two or more`
- **Unknown Conditions**: Return `{ result: 'UNSUPPORTED', reason: 'UNSUPPORTED_CONDITION', condition }` instead of `true`, preventing dependent clauses from executing.

---

## 6. Unsupported Operations Remaining

- **27 explicitly unsupported operations** in `engine/ops/index.js` listed in Section 4 (returning `UNSUPPORTED_OPERATION`).
- **149 unhandled operation types** present in `data/ir_shards/*.json` (`UNHANDLED_OPERATION`).
- **8 modifier-pushing operations** that still push unread modifiers:
  - `SKIP_STEP`, `STEP_MODIFIER`, `COMPARE_LEVELS`, `COMPARE_LV_INSTEAD_OF_BP`, `BP_OR_LEVEL_MODIFIER`, `SET_BP`, `SET_LEVEL`, `PREVENT_LOSS`.

---

## 7. Known Limitations

### Resolver & Engine Result Schema Changes
- **`AsyncResolver.resolveAbility()` (`engine/resolver.js`)**:
  - Returns `{ success: !hasUnsupported && !hasFailure, hasUnsupported, hasFailure, results }`.
  - Both `mainClauses` and `followUpClauses` (`afterResolves`) enforce conditions, optionality (`CONFIRM_OPTIONAL`), `clause.duration` propagation (without mutating IR), cost validation (`isCost`), `or` branch reset (`chosenBranch` reset after consuming `clause.link === 'or'`), `byDoing` / `ifYouDo` / `whenYouveDoneSo` prerequisite failure tracking (`PREREQUISITE_FAILED`), and `previousResult` propagation.
- **`Engine.playCard()` (`engine/index.js`)**:
  - Returns `{ success: true, card, costPaid: cost, effectResolved, hasUnsupported, hasFailure, abilityResults }` (and `negated: true, effectResolved: false` when negated).
- **`Engine.activateAbility()` (`engine/index.js`)**:
  - Returns `{ success: Boolean(result.success), activated: true, hasUnsupported: Boolean(result.hasUnsupported), hasFailure: Boolean(result.hasFailure), ...(reason), result }` (and `activated: false` on early guard failures), preserving `ONCE_PER_TURN` and `checkStateBasedActions`.

### Legacy Bridge Defects Documented (`engine/legacy_bridge.js` — Not Rewritten in Phase 2A)
- **Physical Card Identity Collisions**:
  - `makeCardMapper()` keys `byUid` by `raw.uid || raw.card_number || raw.cardNumber`, collapsing duplicate copies without `uid` to a single instance and colliding cross-side copies in the shared `byUid` map.
  - `createEngineStateFromLegacy()`'s `seen` `Set` drops duplicate field cards without `uid`.
- **Unmapped / Unsynced State Fields**:
  - Not mapped or synced: `duelState.combat`, `duelState.abilityUses` / `usedStructuredAbilities`, `legacy.counters`, `player.revealed`, `player.extraTurns`, `state.winner` / `winReason`, `stack.bonusLevel`.
  - Mapped in, not synced back: `legacy.burstSetThisTurn` / `mirageSetThisTurn`, `stack.under`.
  - Asymmetric mapping: `legacy.openCards` merges into `player.removed` on input and syncs back solely to `legacy.voidCards`.

---

## 8. Regression Failures
- **None** (0 failed, 0 skipped across 1152 tests in `node tests/run_all.js` and 3 tests in `node --test tests/data_audit.test.js`).

---

## 9. Recommended Next Steps (Phase 2B)
1. **Legacy Bridge Identity & State Sync Repair**: Assign unique instance IDs per physical card copy (separating per-player namespaces) and complete bidirectional mapping for `counters`, `combat`, `abilityUses`, `revealed`, `extraTurns`, `burstSetThisTurn` / `mirageSetThisTurn`, and `stack.under`.
2. **Modifier Consumption & Core Mechanics**: Implement consumers for the 8 unread modifier ops (`SET_BP`, `SET_LEVEL`, `BP_OR_LEVEL_MODIFIER`, `SKIP_STEP`, etc.) and prioritize high-frequency unsupported operations and conditions identified in the Phase 1 classification report.
3. **Incremental Card Verification**: Promote cards from `UNIMPLEMENTED` / `PARTIAL` to `VERIFIED` with dedicated regression tests per card/mechanic.
