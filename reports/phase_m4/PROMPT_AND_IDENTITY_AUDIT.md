# PHASE M4 — PROMPT AND IDENTITY AUDIT

## 1. Root Causes Found

1. **`engine/interaction.js` (`createInteractionRequest`, `validateInteractionResponse`):**
   - `side` previously fell back to `cardObj.owner`, which misattributed physical location on stolen/borrowed cards or cross-side zones.
   - `zone` was not normalized via `normalizeCardZone` (so `'trash'` vs `'grave'` or `'open'` vs `'revealed'` could drift).
   - State revalidation in `validateInteractionResponse` only checked `'field'` and `'trash'/'grave'`, leaving `hand`, `deck`, `revealed`, `removed`, `burst`, `mirage`, `under`, `braves`, and `nexus` unvalidated at response time.
   - Selections were not checked for `zone`/`side` mismatches against `origCand`.

2. **`engine/legacy_bridge.js` (`selectionKey`, `candidateMatchesKey`, `bridgePrompt`):**
   - `selectionKey` prioritized `card.uid || card.id` ahead of `candidateId`, collapsing cross-zone identity when the same card id appeared in multiple contexts.
   - `bridgePrompt` did not consistently attach `candidateId`, `zone`, `side`, `stackId`, and `cardId` onto `exposed.candidates`.
   - `candidateMatchesKey` fell back to `card.id`/`uid` even when the caller returned canonical `candidateId`s.

3. **`battle_arena.js` (`promptUniversalTargetModal`, `promptStructuredDecision`, `resolveStructuredCardAbility`, `renderEngineInteractionPrompt`):**
   - `promptStructuredDecision` and `resolveStructuredCardAbility` unwrapped `item.card || item.stack?.top || item`, stripping `candidateId`, `zone`, `side`, `stackId`, and `cardId`.
   - `promptUniversalTargetModal` keyed DOM rows only by `item.uid`, risking collisions when `uid` was missing or duplicated.
   - `renderEngineInteractionPrompt` omitted zone/side tags and `data-candidate-id` attributes.

4. **`engine/resolver.js` (`resolveAbility`):**
   - `abilityContext` aliased the caller's `context` object directly, allowing `selectedTargets`, `previousTargets`, `previousTarget`, and `revealedCards` to leak into subsequent or parent ability invocations.

## 2. Corrections Implemented

- **`engine/interaction.js`:**
  - Imported `normalizeCardZone` and `validateTargetAvailability` from `./selectors.js`.
  - Normalized `zone` and preserved `cardType`, `owner`, `controller`, and physical `side` (`c.side || stackObj?.owner || decisionOwner`, never `cardObj.owner`) in `createInteractionRequest`.
  - Enforced exact `candidateId` lookup first, `zone`/`side` mismatch rejection, and canonical `validateTargetAvailability` revalidation across all 11 canonical zones in `validateInteractionResponse`.
- **`engine/legacy_bridge.js`:**
  - Prioritized `candidateId` in `selectionKey` and `candidateMatchesKey` (with strict `allCandidateIds` guard).
  - Preserved `candidateId`, `zone`, `side`, `stackId`, and `cardId` on `exposed.candidates` in `bridgePrompt`.
- **`battle_arena.js`:**
  - Preserved `candidateId`, `zone`, `side`, `stackId`, and `cardId` in `promptStructuredDecision` and `resolveStructuredCardAbility`.
  - Keyed `promptUniversalTargetModal` rows by `data-cand-key` (`candidateId || uid || id || cand_${idx}`) and displayed physical `[side:zone]` context in both modals.
- **`engine/resolver.js`:**
  - Cloned non-resuming `context` and copied `selectedTargets`, `previousTargets`, and `revealedCards` arrays in `resolveAbility` so target/revealed pools never bleed across abilities.
