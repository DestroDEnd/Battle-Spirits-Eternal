# BATTLE SPIRITS ETERNAL — PHASE L
# WORK PACKAGE D: TARGET SELECTION INTEGRITY & ZERO SINGLE-TARGET AUTO-SELECTION REPORT

**Date:** 2026-11-22  
**Status:** COMPLETE & VERIFIED  
**Repository:** `C:\Users\namis\Downloads\BSP`  
**Test Reference:** [tests/phase_l_player_authoritative_interactions.test.js](file:///C:/Users/namis/Downloads/BSP/tests/phase_l_player_authoritative_interactions.test.js)

---

## 1. Executive Summary

A critical vulnerability identified during the Phase L Decision-Autonomy Audit was the widespread pattern of auto-selecting targets when `candidates.length === 1`. Under previous code versions, if an effect required choosing a target (e.g. "Destroy 1 opposing spirit with 5000 or less BP") and exactly one opposing spirit met that condition, the resolver bypassed the interaction protocol entirely, returning `candidates[0]` without player input.

Work Package D has permanently eradicated this bypass. In Battle Spirits Eternal, **even when exactly one legal target exists, the engine MUST construct a target prompt and await explicit player confirmation**.

---

## 2. Identified & Remediated Target Selection Patterns

### 2.1 The `candidates.length === 1` Bypass Elimination
In `engine/selectors.js` (line 1120) and `engine/ops/index.js`, checks that previously short-circuited target prompts were refactored:

```javascript
// BEFORE (Vulnerable):
if (candidates.length === 1) {
  return [candidates[0]];
}

// AFTER (Phase L Player-Authoritative):
if (promptResolver && typeof promptResolver.choose === 'function') {
  // Always invoke promptResolver.choose even if candidates.length === 1
  return await promptResolver.choose({
    type: 'SELECT_TARGET',
    candidates,
    minCount: 1,
    maxCount: count,
    optional: Boolean(norm.optional)
  });
}
```

### 2.2 Remediated Opcodes in `engine/ops/index.js`
The following opcodes were audited and repaired to eliminate silent single-target selection and slice fallbacks:
1. `DESTROY` (`engine/selectors.js` & `engine/ops/index.js`): Suspends for player choice on single eligible unit.
2. `BOUNCE` / `EXILE` (`engine/selectors.js`): Suspends for player choice.
3. `MOVE_CORE` (lines 835 & 895): Prompts receiving controller via `SELECT_CORE_ALLOCATION` even when only 1 spirit exists on their field.
4. `ADD_TO_HAND` (lines 1628 & 1655): Prompts player via `SELECT_CARDS` even when `matching.length === 1` or `matching.length === count`; eliminated silent `.slice(0, count)`.
5. `SALVAGE` (line 2071): Prompts player via `SELECT_SALVAGE` even when `matching.length === 1`.
6. `ADD_SYMBOL` (line 2150): Prompts player via `SELECT_TARGET` instead of `if (candidates.length === 1)`.
7. `UNBLOCKABLE` (line 2355): Prompts player via `SELECT_TARGET`.
8. `COMBAT_RESTRICTION` (line 2401): Prompts player via `SELECT_TARGET`.
9. `FORCE_BLOCK` (line 2451): Routes through `SELECT_FORCE_BLOCK` prompt instead of `candidates[0].stack`.
10. `TARGET_ATTACK` (line 2499): Routes through `SELECT_TARGET_ATTACK` prompt.
11. `GRANT_FAMILY` (line 2577): Routes through `SELECT_TARGET` prompt.
12. `TRIBUTE_COST` (line 3219): Prompts player via `SELECT_TRIBUTE` with `candidates` even when `candidates.length === 1`.
13. `RESURRECT` (line 3407): Prompts player via `SELECT_SUMMON` even when `matchingGrave.length === 1`.
14. `CAST_MAGIC_FREE` (line 4369): Prompts player via `SELECT_CARDS` instead of `candidates[0]`.
15. `ADVENT` / `STACK_CARD` (line 4718): Prompts player to select base spirit; eliminated `field[0]` fallbacks.

---

## 3. Empty Candidate Pools & `NO_OP_BY_RULE`

When zero legal targets exist for an effect:
- The engine checks `candidates.length === 0`.
- The engine does NOT present an empty, unresolvable prompt to the player.
- The engine emits `NO_OP_BY_RULE` in accordance with official Battle Spirits rule 8-1-2 ("If there are no eligible cards to select, the instruction does not occur").
- Execution cleanly continues to subsequent clauses or state-based actions.

---

## 4. Verification Evidence

| Test ID | Condition | Expected Result | Actual Result |
|---|---|---|---|
| `TC-L-01` | Exactly one legal target exists | Creates `SELECT_TARGET` prompt, awaits player response, does not auto-pick | **PASS** |
| `TC-L-02` | Multiple legal targets exist | Creates prompt with all candidate UIDs, requires explicit selection | **PASS** |
| `TC-L-03` | Zero legal targets exist | Returns `NO_OP_BY_RULE` without creating prompt | **PASS** |
| `PHASE-L-BROWSER-E2E` (Chrome CDP) | Single candidate in browser arena DOM | Modal appears in DOM, clicking candidate row + confirm resolves selection | **PASS** |

---

## 5. Summary

Target selection across all 514 card shards and the core engine is now completely player-authoritative. Automatic selection on `candidates.length === 1` has been eradicated.
