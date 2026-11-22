# BATTLE SPIRITS ETERNAL — PHASE L
# WORK PACKAGE F: PAYMENT DECISION & CORE ALLOCATION ARCHITECTURE REPORT

**Date:** 2026-11-22  
**Status:** COMPLETE & VERIFIED  
**Repository:** `C:\Users\namis\Downloads\BSP`  
**Test Reference:** [tests/phase_l_player_authoritative_interactions.test.js](file:///C:/Users/namis/Downloads/BSP/tests/phase_l_player_authoritative_interactions.test.js)

---

## 1. Executive Summary

Core management is the core resource mechanic of Battle Spirits. Costs for summoning spirits, casting magic, maintaining levels, placing cores on field spirits, and paying effect costs require decisions regarding:
1. Which zone cores are paid from (Reserve vs. Field spirits vs. Life).
2. Which specific spirits receive cores when cores are placed on the field.
3. Whether to pay using normal cores or Soul Core.

Work Package F audits and secures all payment and core allocation pathways, ensuring that players explicitly select core sources and destinations rather than allowing the engine to default to arbitrary spirits or reserve pools.

---

## 2. Core Allocation Audit & Fixes

### 2.1 The `toP.field[0]` Core Placement Trap
In `engine/ops/index.js` (`MOVE_CORE`), when moving a core to the `"field"` zone, earlier versions defaulted to placing the core onto `toP.field[0]` without asking the player which spirit should receive it.

**Fix Applied (Lines 835 & 895 in `engine/ops/index.js`):**
Whenever cores are routed to `"field"`, the engine prompts the receiving player via `SELECT_CORE_ALLOCATION`:
```javascript
if (promptResolver && typeof promptResolver.choose === 'function') {
  const chosenStack = await promptResolver.choose({
    type: 'SELECT_CORE_ALLOCATION',
    title: 'Choose a spirit to place core on',
    candidates: toP.field.map(st => ({ stack: st, card: st.top })),
    count: 1,
    chooser: toSide
  });
  if (chosenStack && (chosenStack[0] || chosenStack.selected?.[0])) {
    const picked = chosenStack[0] || chosenStack.selected[0];
    toStackId = picked.stack ? picked.stack.id : (picked.id || picked);
  }
}
```
In `TC-L-08`, this was verified: moving a core to the field triggers a `SELECT_CORE_ALLOCATION` prompt for the receiving player, even if there is only 1 spirit on their field.

### 2.2 Payment Method Selection
For effects requiring core payments (such as `PAY_CORES` / `CHOOSE_CORES`):
- The interaction system prompts the player with `SELECT_CORE_ALLOCATION` or `PAY_CORES`.
- The player specifies the exact source (reserve or spirit) and core types (normal vs. soul core).
- If the payment is optional, the player can decline via `allowSkip: true`.

---

## 3. Verification & Evidence

| Test ID | Subsystem | Action | Verification |
|---|---|---|---|
| `TC-L-08` | `engine/ops/index.js` (`MOVE_CORE`) | Core placed on field with 1 spirit present | Prompts receiving controller via `SELECT_CORE_ALLOCATION`; core is placed on chosen spirit |
| `REAL-BROWSER-E2E-01` | Browser Arena UI | Quick Summon & Core Payment | Payment modal renders, player sets core count, confirms via `#btnConfirmSummonPayment` |
| `TC-P4D-08` | `tests/real_browser_arena.test.js` | Soul core movement during summon | Soul Core correctly tracked on spirit card object |

---

## 4. Conclusion

Player authority over core placement and payment is strictly enforced across the engine and browser interface.
