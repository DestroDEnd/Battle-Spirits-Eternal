# PHASE M4 — TARGETING ARCHITECTURE AUDIT

End-to-end forensic trace of the 17-stage targeting and card-movement lifecycle across the Battle Spirits Eternal engine, legacy bridge, and browser UI.

---

## 1. End-to-End 17-Stage Lifecycle Trace

| Stage | Subsystem & Location | Current Behavior & Identified Defects |
| :--- | :--- | :--- |
| 1. Ability Compilation | `compiler/` | Generates structured `op` objects with `zone`, `from`, `side`, `types`, `filter`, and `DRAW` / `DRAW_CARDS` / `SALVAGE` / `TARGET` ops. |
| 2. Target Spec Generation | [engine/ops/index.js](file:///c:/Users/namis/Downloads/BSP/engine/ops/index.js) | `TARGET*` delegates to `resolveTargets()`. However, `SALVAGE` (L2063), `ADD_TO_HAND` (L1602), and `DISCARD_HAND` (L751) bypass `resolveTargets()` / `queryCandidates()` with ad-hoc zone pools. |
| 3. Selector Normalization | [engine/selectors.js#L138-L161](file:///c:/Users/namis/Downloads/BSP/engine/selectors.js#L138-L161) | `queryCandidates()` manually checks only `trash`/`graveyard`/`open` instead of `normalizeCardZone()`, and defaults `types` to `['Spirit']` even for `hand`, `grave`, `deck`, `revealed`, `removed`. |
| 4. Candidate Enumeration | [engine/selectors.js#L164-L496](file:///c:/Users/namis/Downloads/BSP/engine/selectors.js#L164-L496) | Covers `field`, `nexus`, `hand`, `grave`, `revealed`, `removed`. Missing `deck`, `burst`, `mirage`, `under`, `braves`. Line 442 falls back to `context.revealedCards` without validating physical presence or side. Line 378 allows `filters.hand` to leak opponent hand. |
| 5. Candidate Filtering | [engine/selectors.js#L211-L493](file:///c:/Users/namis/Downloads/BSP/engine/selectors.js#L211-L493) | `removed` branch lacks `color` and `name` filters. `field` vs `nexus` enumerates Nexuses twice when `legacy_bridge.js` populates both `p.nexus` and `p.field`. |
| 6. Prompt Generation | [engine/interaction.js#L68-L185](file:///c:/Users/namis/Downloads/BSP/engine/interaction.js#L68-L185) | `createInteractionRequest()` infers `side` from `cardObj.owner` or `decisionOwner` (L105) instead of physical side; `SALVAGE` / `ADD_TO_HAND` emit bare `{ card }` without `zone`, `side`, or `candidateId`. |
| 7. Candidate Serialization | [engine/state_serialization.js#L85-L116](file:///c:/Users/namis/Downloads/BSP/engine/state_serialization.js#L85-L116) | `serializePlayerState()` and `revivePlayer()` omit `revealed` and `openCards`, dropping those zones across save/restore. |
| 8. Player Selection | [battle_arena.js#L1857-L2060](file:///c:/Users/namis/Downloads/BSP/battle_arena.js#L1857-L2060) | `promptStructuredDecision` (L2024) and `resolveStructuredCardAbility` (L3094) unwrap `item.card`, stripping `candidateId`, `zone`, `side`, `stackId`. `promptUniversalTargetModal` keys DOM rows by `item.uid` alone (L1922). |
| 9. Selection Mapping | [engine/legacy_bridge.js#L352-L405](file:///c:/Users/namis/Downloads/BSP/engine/legacy_bridge.js#L352-L405) | `bridgePrompt()` / `candidateMatchesKey()` checks loose IDs across `uid`, `id`, `card.id`, `stack.id` without prioritizing `candidateId` / exact `(side, zone, cardId)`. |
| 10. Selection Validation | [engine/interaction.js#L190-L358](file:///c:/Users/namis/Downloads/BSP/engine/interaction.js#L190-L358) | `validateInteractionResponse()` only revalidates `field` and `grave/trash` (L331-L352), silently accepting stale selections from `hand`, `deck`, `revealed`, `removed`, `nexus`, `burst`, `mirage`, `under`, `braves`. |
| 11. Resolver Resumption | [engine/resolver.js#L580-L612](file:///c:/Users/namis/Downloads/BSP/engine/resolver.js#L580-L612) | Resumes suspended frames, but new ability contexts must cleanly initialize targeting arrays to prevent stale target leakage across abilities. |
| 12. Resolution Revalidation | [engine/selectors.js#L883-L916](file:///c:/Users/namis/Downloads/BSP/engine/selectors.js#L883-L916) | Neither `executeTargeting()` nor tie-handling `resolveTargets()` revalidates selected candidates against live `state` after `await promptResolver.choose()`. |
| 13. Card Operation | [engine/ops/index.js#L709-L776](file:///c:/Users/namis/Downloads/BSP/engine/ops/index.js#L709-L776) | `DRAW` skips post-move placement check and `DRAW_CARDS`/`amount`. `DISCARD_HAND` fails on `{ selected: [...] }` objects. `DISCARD` mutates `p.hand`/`p.grave`/`p.open` directly. |
| 14. Zone Movement | [engine/zones.js#L332-L760](file:///c:/Users/namis/Downloads/BSP/engine/zones.js#L332-L760) | `moveCard()` omits `revealed` and `openCards` in source/destination handling, lacks `expectedFromZone`/`expectedFromSide` anchoring, and removes by `.filter(c => c.id !== card.id)`. |
| 15. Event Generation | [engine/zones.js#L732-L757](file:///c:/Users/namis/Downloads/BSP/engine/zones.js#L732-L757) | Direct array splices in `ops/index.js` (`DISCARD`, `REVEAL_DECKTOP`) bypass `CARD_MOVED` events. |
| 16. State Synchronization | [engine/legacy_bridge.js#L190-L323](file:///c:/Users/namis/Downloads/BSP/engine/legacy_bridge.js#L190-L323) | `createEngineStateFromLegacy()` duplicates Nexuses into both `player.nexus` and `player.field`. |
| 17. Browser Rendering | [battle_arena.js#L3116, L13817](file:///c:/Users/namis/Downloads/BSP/battle_arena.js#L3116) | `resolveStructuredCardAbility()` and `applyMagicEffect()` async `.then()` call `renderDuelTable()` without `renderPlayerHand()`, leaving the rendered hand stale after structured draws. |
