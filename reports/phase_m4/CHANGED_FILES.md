# PHASE M4 — CHANGED FILES

## Engine & UI Corrections
- `engine/selectors.js`: Added `CANONICAL_ZONES`, `buildCandidateDescriptor`, `normalizeCardZone`, `matchesCommonCardFilters`, `cardExistsOutsideZone`, `findMatchingCandidate`; updated `queryCandidates`, `validateTargetAvailability`, `executeTargeting`, and `resolveTargets` for strict physical zone/side isolation and resolution-time revalidation.
- `engine/ops/index.js`: Updated `DISCARD_HAND`, `ADD_TO_HAND`, `SALVAGE`, `DRAW`, `DRAW_CARDS`, `REVEAL_DECKTOP`, and `DISCARD_REMAINING`/`DISCARD` to use canonical candidate validation, `moveCard`, `expectedFromZone`/`expectedFromSide`, and post-move hand/deck verification.
- `engine/interaction.js`: Normalized `zone`, preserved physical `side` (without `cardObj.owner` fallback), and added `zone`/`side` mismatch checks plus canonical `validateTargetAvailability` revalidation across all 11 zones.
- `engine/resolver.js`: Isolated `abilityContext` per `resolveAbility` invocation (cloning `selectedTargets`, `previousTargets`, `revealedCards`) while preserving explicit clearing of `previousTarget` on declined optional targeting.
- `engine/zones.js`: Updated `moveCard` to support `revealed` and `openCards`, `expectedFromZone`/`expectedFromSide` enforcement, single-instance `splice` removal, `'revealed'` destination placement, and duplicate-ID guards.
- `engine/legacy_bridge.js`: Prioritized `candidateId` in `selectionKey`/`candidateMatchesKey` and preserved `candidateId`/`zone`/`side` in `bridgePrompt`; eliminated duplicate Nexus placement between `player.field` and `player.nexus` in `createEngineStateFromLegacy` and synced `enginePlayer.nexus` in `syncEngineStateToLegacy`.
- `engine/state_serialization.js`: Added `revealed` and `openCards` serialization and revival in `serializePlayerState` and `revivePlayer`.
- `engine/cards/condition_dsl.js` & `engine/cards/bundle.js`: Added draw-restriction check and duplicate-hand-entry guard in `drawCards`, and rebuilt `engine/cards/bundle.js`.
- `battle_arena.js`: Preserved `candidateId`/`zone`/`side` in `promptStructuredDecision` and `resolveStructuredCardAbility`, keyed `promptUniversalTargetModal` rows by `data-cand-key`, displayed physical `[side:zone]` labels, and added `renderPlayerHand()` calls after `renderDuelTable()` in `resolveStructuredCardAbility` and `applyMagicEffect`.

## New Phase M4 Tests
- `tests/phase_m4_targeting_zone_side_isolation.test.js`
- `tests/phase_m4_draw_and_movement.test.js`
- `tests/phase_m4_real_cards_validation.test.js`
- `tests/phase_m4_browser_e2e.test.js`

## Phase M4 Reports (`reports/phase_m4/`)
- `BASELINE_AND_PRESERVATION.md`
- `TARGETING_ARCHITECTURE_AUDIT.md`
- `PHYSICAL_ZONE_CONTRACT.md`
- `TARGET_CANDIDATE_CORRECTION.md`
- `PROMPT_AND_IDENTITY_AUDIT.md`
- `DRAW_EXECUTION_AUDIT.md`
- `LEGACY_ENGINE_SYNCHRONIZATION.md`
- `REAL_CARD_VALIDATION_MATRIX.json`
- `TARGETING_REGRESSION_RESULTS.md`
- `DRAW_REGRESSION_RESULTS.md`
- `BROWSER_END_TO_END_RESULTS.md`
- `CHANGED_FILES.md`
- `FINAL_COMPLETION_REPORT.md`
