# Magic Correction — Changed Files Inventory

| File | Purpose of Modification |
|---|---|
| `engine/card_types.js` | **New**: Canonical `classifyCardType()`, `validateCardPathway()`, `CARD_CATEGORIES`, `ACTION_PATHWAYS` covering all 9 database card types (`Spirit`, `Contract Spirit`, `Token Spirit`, `Ultimate`, `Contract Ultimate`, `Brave`, `Nexus`, `Contract Nexus`, `Magic`). |
| `engine/action_authority.js` | Enforce `validateCardPathway()` on `SUMMON`, `DEPLOY_NEXUS`, `ACTIVATE_MAGIC`, `CAST_MAGIC`, `CAST_FLASH_MAGIC`; add `DEPLOY_NEXUS`, `ACTIVATE_MAGIC`, `CAST_MAGIC` to `TURN_CONTROLLED_ACTIONS` and Flash checks. |
| `engine/state.js` | Add `pendingExecutions` and `resolvingCards` to `createGameState()`, and include `resolvingCards` in `validateGameState()` single-zone uniqueness checks. |
| `engine/state_serialization.js` | Serialize and deserialize `pendingExecutions` and `resolvingCards` across SQLite snapshots. |
| `engine/interaction.js` | Add `InteractionSuspendedError` and `suspendOnRequest` mode to `InteractionController`. |
| `engine/resolver.js` | Catch `InteractionSuspendedError` cleanly in `AsyncResolver.resolveAbility()`, save serializable `pendingExecutions` snapshot, and support deterministic `_resume` replay (`priorResponses`, `clauseIndex`, `phase`, `remainingAbilities`). |
| `engine/selectors.js` | Hoist `findMatchingCandidate()` from inside `validateSelection()` to module scope to fix `ReferenceError` on target selection resolution. |
| `engine/index.js` | Wire `suspendOnInteraction` and `card_types.js`; add `summonUnit()`, `deployNexus()`, `activateMagic()`, `resumeExecution()`; hold resolving Magic in `state.resolvingCards` and finalize destination (`grave` / `removed`) after resolution; recognize `MAIN_STEP` and `ATTACK_STEP` Magic timings. |
| `engine/response_window.js` | Route `CAST_FLASH_MAGIC` through `game.activateMagic()`, propagate `suspended: true` without premature priority switch, and add `finalizeSuspendedFlashAction()`. |
| `engine/session_manager.js` | Enable `suspendOnInteraction: true`; validate candidate IDs across `stackId`/`cardId`; resume suspended Magic/ability executions on `INTERACTION_RESPONSE`; route `SUMMON`, `DEPLOY_NEXUS`, `ACTIVATE_MAGIC`, `CAST_MAGIC` through canonical pathways. |
| `battle_arena.js` | Block Magic/Nexus cards in `summonCard()`, `openSummonModal()`, `checkCardFreeSummonEligibility()`; guard `deployNexus()` and `castMagic()`; fix `openSacrificeModal()` TDZ on `isUltimate`; add `renderEngineInteractionPrompt()`, `submitEngineInteractionResponse()`, online Magic dispatch, disabled button reasons, and duplicate-activation lock. |
| `tests/magic_legality_and_resolution.test.js` | **New**: 9-test comprehensive Magic regression suite covering Categories A–M including real `battle_spirits.db` cards and Chrome CDP E2E. |
| `reports/magic_correction/*` | **New**: Forensic audit, classification audit, pipeline audit, interaction audit, coverage matrix JSON, regression results, changed files, and final completion report. |
