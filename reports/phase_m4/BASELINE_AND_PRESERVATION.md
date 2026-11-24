# PHASE M4 — BASELINE AND PRESERVATION

**Phase:** M4 — Universal Targeting, Physical Zone Integrity & Draw-to-Hand Execution Correction  
**Workspace Root:** [c:/Users/namis/Downloads/BSP](file:///c:/Users/namis/Downloads/BSP)  
**Git Branch:** `main`  
**Git HEAD:** `4e9ffa1` (`fix(session_manager): ensure scrubCredentials wraps match snapshot responses`)

---

## 1. Existing Uncommitted Modifications & Untracked Assets Preserved

At audit baseline, the repository contained 170 uncommitted entries in `git status --short` from prior completed phases and recent website work. All existing changes, generated assets, database files, and tests are preserved untouched:

- **Core Engine & Persistence (`M` / `??`):** `engine/ai.js`, `engine/flow.js`, `engine/index.js`, `engine/interaction.js`, `engine/legacy_bridge.js`, `engine/ops/index.js`, `engine/resolver.js`, `engine/session_manager.js`, `engine/session_mode.js`, `engine/session_store.js`, `engine/state.js`, `engine/state_serialization.js`, `engine/websocket_server.js`, `engine/windows.js`, `engine/action_authority.js`, `engine/card_types.js`, `engine/flash_timing.js`, `engine/response_window.js`.
- **Frontend & Server (`M` / `??`):** `app.js`, `arena.html`, `battle_arena.js`, `browse.html`, `deck.html`, `deck_view.html`, `family.html`, `index.html`, `keywords.html`, `login.html`, `register.html`, `sets.html`, `server.js`, `styles.css`, `assets/shape_grid.css`, `assets/shape_grid.js`, `reflective_card.js`.
- **Reports & Audit Artifacts Preserved:**
  - `reports/magic_correction/` (`MAGIC_ACTIVATION_PIPELINE_AUDIT.md`, `MAGIC_CLASSIFICATION_AUDIT.md`, `MAGIC_EFFECT_COVERAGE_MATRIX.json`, `PHASE_1_FORENSIC_AUDIT.md`)
  - `reports/phase_k1/`, `reports/phase_l/`, `reports/phase_l1/`
  - `reports/phase_m/`, `reports/phase_m1/`, `reports/phase_m2/`
  - `reports/phase_m3_response_windows/`, `reports/phase_m3_1_flash_timing_correction/`, `reports/phase_m3_2_action_gate_and_flash_authority/`, `reports/phase_m3_3_integrity_and_security_closure/`
  - `reports/FULL_PROJECT_FORENSIC_AUDIT/`
- **Existing Test Suites:** Preserved intact, including `tests/magic_*.test.js`, `tests/phase_k1_*.test.js`, `tests/phase_l*.test.js`, `tests/phase_m*.test.js`, and `tests/shape_grid_background.test.js`.

---

## 2. Prior Implementations Present & Incomplete Gaps Identified

1. **Prior Targeting & Identity Hardening (Phase K1 / L / L1 / FG):**
   - `engine/selectors.js` already provides `validateTargetAvailability()` with duplicate-instance detection across zones, `evaluateComparisonStrict()`, and `resolveTargets()` / `executeTargeting()`.
   - `engine/interaction.js` provides `createInteractionRequest()` and `validateInteractionResponse()`.
   - `engine/resolver.js` provides `synchronizeTargetingContext()` and `InteractionSuspendedError` persistence.
2. **Incomplete Corrective Work Identified for Phase M4:**
   - `queryCandidates()` in [engine/selectors.js](file:///c:/Users/namis/Downloads/BSP/engine/selectors.js) lacks canonical coverage for `deck`, `burst`, `mirage`, `under`, and `braves`, does not normalize `selector.zone` via `normalizeCardZone()`, defaults non-field `types` to `['Spirit']`, uses an unvalidated `context.revealedCards` fallback (line 442), and omits canonical identity metadata (`candidateId`, `cardId`, `cardNumber`, `owner`, `controller`).
   - `executeTargeting()` and `resolveTargets()` do not revalidate chosen candidates against live `state` after `await promptResolver.choose()`.
   - `validateInteractionResponse()` in [engine/interaction.js](file:///c:/Users/namis/Downloads/BSP/engine/interaction.js) only revalidates `field` and `grave/trash`, skipping `hand`, `deck`, `revealed`, `removed`, `nexus`, `burst`, `mirage`, `under`, and `braves`.
   - `createEngineStateFromLegacy()` in [engine/legacy_bridge.js](file:///c:/Users/namis/Downloads/BSP/engine/legacy_bridge.js) places Nexuses in both `player.nexus` and `player.field`, triggering duplicate-instance rejections and double candidate enumeration.
   - `moveCard()` in [engine/zones.js](file:///c:/Users/namis/Downloads/BSP/engine/zones.js) omits `revealed` and `openCards` in source/destination handling and removes cards by `.filter(c => c.id !== card.id)` without `expectedFromZone` / `expectedFromSide` anchoring.
   - `DRAW` in [engine/ops/index.js](file:///c:/Users/namis/Downloads/BSP/engine/ops/index.js) lacks post-move physical placement verification and `DRAW_CARDS` / `op.amount` support; `DISCARD_HAND` fails to unwrap `{ selected }` prompt responses; `DISCARD` / `DISCARD_REMAINING` mutate arrays directly (including nonexistent `p.open`).
   - `battle_arena.js` omits `renderPlayerHand()` after structured ability resolution (`resolveStructuredCardAbility` and `applyMagicEffect` async `.then()`), and `promptUniversalTargetModal` strips `candidateId`/`zone`/`side` when unwrapping candidates.
   - `engine/state_serialization.js` omits `revealed` and `openCards` during player state serialization and restoration.
