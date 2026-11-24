# PHASE M4 — DRAW EXECUTION AUDIT

## 1. Root Causes Found (Defect B)

1. **`engine/zones.js` (`moveCard`):**
   - `moveCard` did not recognize `'revealed'` or `p.openCards` as source zones or `'revealed'` as a destination zone.
   - Zone removal used `.filter(c => c.id !== card.id)` instead of single-instance `splice`, and destination placement had no duplicate guard or `expectedFromZone` / `expectedFromSide` pre-check.
2. **`engine/ops/index.js` (`DRAW`, `REVEAL_DECKTOP`, `DISCARD_REMAINING`, `DISCARD`):**
   - `DRAW` only handled `op.op === 'DRAW'` (not `DRAW_CARDS`) and `op.count` (not `op.amount`), did not enforce `expectedFromZone: 'deck'` / `expectedFromSide: targetSide`, and did not verify post-move that the card left `p.deck` and landed in `p.hand` exactly once before reporting `CARD_DRAWN`.
   - `REVEAL_DECKTOP` spliced `p.deck` directly instead of calling `moveCard(..., 'revealed', ...)`.
   - `DISCARD_REMAINING` referenced a nonexistent `p.open` array and pushed directly to `p.grave` without `moveCard`.
3. **`engine/cards/condition_dsl.js` (`drawCards`):**
   - Did not check `st.drawRestricted` / `st.cannotDraw` or prevent duplicate card insertion into `st.hand`.
4. **`battle_arena.js` (`resolveStructuredCardAbility`, `applyMagicEffect`):**
   - Both called `renderDuelTable()` after structured effect resolution without calling `renderPlayerHand()`, leaving drawn/salvaged cards invisible in the player's DOM hand until a separate action triggered a hand re-render.

## 2. Corrections Implemented

- **`engine/zones.js`:**
  - Added `'revealed'` and `'openCards'` detection, `options.expectedFromZone` / `options.expectedFromSide` enforcement, single-instance `splice` removal, `'revealed'` destination placement, and duplicate-ID guards in `moveCard`.
- **`engine/ops/index.js`:**
  - Added `case 'DRAW_CARDS'` alongside `case 'DRAW'`, supported `op.count ?? op.amount ?? 1`, passed `expectedFromZone: 'deck'` & `expectedFromSide: targetSide`, and verified `leftDeck && handMatches === 1` before recording drawn cards and emitting `CARD_DRAWN`.
  - Updated `REVEAL_DECKTOP` and `DISCARD_REMAINING` / `DISCARD` / `DISCARD_CARD` / `DISCARD_COST` to route through `moveCard`.
- **`engine/cards/condition_dsl.js` & `engine/cards/bundle.js`:**
  - Added restriction check and duplicate-hand-entry guard in `drawCards`, and rebuilt `engine/cards/bundle.js` via `scripts/build_card_bundle.mjs`.
- **`battle_arena.js`:**
  - Added `renderPlayerHand()` calls after `renderDuelTable()` in `resolveStructuredCardAbility` and `applyMagicEffect`.
