# BATTLE SPIRITS ETERNAL — PHASE 3D
## Effect Family Implementation Report: Deck and Hand Operations

**Family Key:** `DECK_AND_HAND_OPERATIONS`  
**Implementation Wave:** Batch 2  
**Status:** **ACCEPTED**

---

### 1. Functional Scope & Summary
Manages drawing, milling, revealing, and searching cards with strict zone conservation.

### 2. Implemented & Verified Operation Variants
- `✔ DRAW::count`
- `✔ DRAW::conditional`
- `✔ MILL::self`
- `✔ MILL::opponent`
- `✔ MILL::heavy_mill`
- `✔ REVEAL_DECKTOP::single`
- `✔ REVEAL_DECKTOP::multiple`
- `✔ LOOK_AT_DECK::default`
- `✔ LOOK_DECKTOP::default`
- `✔ DISCARD::hand`
- `✔ DISCARD_ZONE::field`
- `✔ SALVAGE::trash_to_hand`
- `✔ SEARCH_DECK::filtered_to_hand`
- `✔ RETURN_DECK_BOTTOM::default`

### 3. Unsupported Variants & Fail-Closed Boundaries
- `✖ REORDER_ENTIRE_DECK_INTERACTIVE` (Rejects safely with fail-closed diagnostics)

### 4. Primary Test Evidence
- **Suites:** `tests/work_package_hij_real_cards_e2e.test.js, tests/effect_execution_targeting_conditions.test.js`
- **Execution Result:** Verified 100% passing across automated regression test runners.
