# Compiler-to-Runtime Fidelity Report (Phase 4C.4 – 4C.5)

## 1. Preserved Invariants
- All **514 IR shards**, **15,398 cards**, **36,422 abilities**, and `compiler/identity.js` were preserved untouched.
- Physical (`cardNumber#AB_...`), semantic (`SEM#...`), and legacy (`cardNumber#aN`) ability IDs remain intact across runtime execution and `game.activateAbility()`.

## 2. Compiler-to-Runtime Alignment Fixes
1. **Timing & Burst Metadata (`engine/windows.js`)**:
   - `getAvailableFlashActions()` now prefers structured `header.turnRestriction` / `header.timingStep` over `timingLabel` fallback for both `Magic` cards and field `FLASH` abilities (`ACTIVATE_FLASH_ABILITY`).
   - `matchesBurstCondition()` evaluates structured `header.condition` via `evaluateStructuredCondition()` and handles `AFTER_YOUR_SPIRIT_DEPLETED`.
2. **Target Filter Fidelity (`engine/continuous.js`, `engine/selectors.js`)**:
   - `matchesTargetFilter()` enforces `sourceSt` for `'self'`, `context` for `'target'`, rejects unknown string references, composes `includeSelf` with all attribute filters, and evaluates effective BP/level when `context.state` is present.
   - `resolveTargets()` unifies typed target references, tie-handling, strict candidate validation, and context propagation.
3. **Structured Condition Fidelity (`engine/conditions.js`)**:
   - Added `BATTLING_STATE`, `BP_ZERO`, `SOUL_STATE`, `TURN_STEP_STATE`, `COLOR_SYMBOL` (`{ colorSymbol }`), `HAND_SIZE_THRESHOLD`, `CARD_ZONE_STATE`, `PREVIOUS_OP_SUCCESS`, and `COMPOUND` (`AND`/`OR`).
   - Coverage across the 514-shard corpus rose to **2,407 / 4,940 (48.72%)** condition instances, while preserving strict fail-closed `UNSUPPORTED` for the remaining **2,533 (51.28%)**.

## 3. Rules Provenance
- `ETERNAL_RULES.formatVersion` remains `'17.0'` (`NEEDS_MANUAL_REVIEW` for official Bandai Ver. 17.0 vs Ver. 17.1 PDF citations, as no local Bandai PDF exists in the repository).
