# PHASE M4 — TARGET CANDIDATE CORRECTION

## Root Causes Corrected in [engine/selectors.js](file:///c:/Users/namis/Downloads/BSP/engine/selectors.js) & [engine/ops/index.js](file:///c:/Users/namis/Downloads/BSP/engine/ops/index.js)

1. **Revealed Zone Contextual Leak Fixed:**
   - Previously, `queryCandidates()` for `zone === 'revealed'` fell back to `context.revealedCards` whenever `p.revealed` was empty, without checking if those cards belonged to `s` or had already moved to `hand`/`grave`/`deck`/`field`.
   - Fixed: `zone === 'revealed'` reads strictly from `p.revealed`, and only allows `context.revealedCards` entries when `s === (context.controller || 'player')` AND `!cardExistsOutsideZone(state, c.id, 'revealed', s)`.
2. **Removed / Open Zone Merge & Filtering:**
   - Previously, `p.openCards` was ignored whenever `p.removed` was non-empty, and `color`/`name` filters were missing.
   - Fixed: `zone === 'removed'` merges `p.removed` and `p.openCards` deduplicated by `card.id` and applies `matchesCommonCardFilters()` uniformly.
3. **Complete Zone & Alias Coverage in `queryCandidates()`:**
   - Added physical-zone branches for `deck`, `burst`, `mirage`, `under`, and `braves`.
   - Default `targetTypes` now defaults to `['Any']` for non-field zones (`hand`, `grave`, `deck`, `revealed`, `removed`, `burst`, `mirage`, `under`) instead of `['Spirit']`.
   - Deduplicated results by `(side, zone, cardId || uid)` so Nexuses never appear twice.
4. **Unified `SALVAGE`, `ADD_TO_HAND`, and `DISCARD_HAND`:**
   - `SALVAGE` defaults strictly to `grave` (no fallback to `context.revealedCards` when `from` is omitted/grave).
   - `ADD_TO_HAND` uses `queryCandidates()` / `validateTargetAvailability()` and passes `buildCandidateDescriptor()` candidates to prompts.
   - `DISCARD_HAND` unwraps `{ selected }` objects (fixing `TypeError` on object prompt responses) and validates selections via `validateSelection()` + `validateTargetAvailability()`.
