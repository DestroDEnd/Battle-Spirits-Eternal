# Phase 1 — Forensic Audit: Magic Card Legality & Effect Resolution

## 1. Executive Summary

This forensic audit inspects the complete Battle Spirits Eternal (BSP) codebase—including `battle_spirits.db`, `compiler/`, `engine/index.js`, `engine/action_authority.js`, `engine/session_manager.js`, `engine/resolver.js`, `engine/interaction.js`, `engine/response_window.js`, `server.js`, and `battle_arena.js`—to identify the root causes of two reported gameplay defects:

1. **Defect 1**: Magic cards can enter the normal Spirit summoning pathway.
2. **Defect 2**: Magic cards generate interaction prompts, but their effects do not consistently resolve or complete correctly.

Both defects are **confirmed** at multiple architectural layers, not merely cosmetic UI issues.

---

## 2. Canonical Card-Type Representation

Querying `battle_spirits.db` (`SELECT type, COUNT(*) FROM cards GROUP BY type`) yields 9 canonical card types:

| Canonical Type | Count | Intended Pathway |
|---|---:|---|
| `Spirit` | 10,132 | Spirit Summoning |
| `Magic` | 1,577 | Magic Activation (Main / Flash / Burst) |
| `Nexus` | 1,345 | Nexus Deployment |
| `Brave` | 884 | Brave Summoning / Combine |
| `Ultimate` | 368 | Ultimate Summoning |
| `Contract Spirit` | 80 | Spirit Summoning |
| `Contract Nexus` | 53 | Nexus Deployment |
| `Contract Ultimate` | 2 | Ultimate Summoning |
| `Token Spirit` | 2 | Token Spirit Placement |

---

## 3. Root Causes of Defect 1 (Magic Entering Spirit Summoning Pathway)

### 3.1 Frontend / Browser Arena (`battle_arena.js`)
1. **`summonCard(uid, ...)` (line 11304)**:
   - Performs zero card-type validation. Calling `summonCard(magicUid)` on any `Magic` or `Nexus` card in hand opens `openSummonModal(uid)` or places the card directly onto `DuelState.player.field` as a Spirit.
2. **`openSummonModal(uid)` (line 10881)**:
   - Performs zero card-type validation. Allows opening the Spirit Summon Payment modal for Magic cards.
3. **`checkCardFreeSummonEligibility(card, side)` (line 10431)**:
   - Scans raw `card.effect` text without checking `card.type`. Any Magic card whose effect text contains matching phrases (e.g., `"one or more counters"` + `"without paying the cost"` or `"by sending your [soul core] to the trash"`) is flagged as `isFreeSummon = true` in `renderPlayerHand()`, rendering a `⚡ Free Summon (0)` button on the Magic card and routing it into `executeFreeSummon()`, which places the Magic card onto `friendly.field` as a Spirit!
4. **`openSacrificeModal(uid, castMode)` (line 14156)**:
   - Line 14167 references `isUltimate` before `const isUltimate` is declared on line 14172 (Temporal Dead Zone `ReferenceError`).
   - Treats any non-unit (including `Nexus` if routed here) identically to Magic in `executeSacrificeSummon()`.

### 3.2 Authoritative Engine (`engine/index.js`, `engine/action_authority.js`, `engine/session_manager.js`)
1. **`engine/index.js` `playCard` (line 377)**:
   - Uses a single monolithic `playCard(cardId, payment, playerSide, options)` entry point for all card types without rejecting mismatched intent options (e.g., `options.braveTargetStackId`, `options.cores` summon options passed with a `Magic` card).
   - Uses exact equality `card.type === 'Spirit' || card.type === 'Ultimate' || card.type === 'Brave'` (line 580) and `card.type && card.type.includes('Nexus')` (line 670), which fails to classify `Contract Spirit` (80 cards), `Contract Ultimate` (2 cards), and `Token Spirit` (2 cards) as unit types!
2. **`engine/action_authority.js` (line 179) & `engine/session_manager.js` (line 1161)**:
   - `SUMMON` checks `targetCard.type !== 'Spirit' && targetCard.type !== 'Ultimate' && targetCard.type !== 'Brave'`, which blocks `Magic` and `Nexus` (good), but erroneously blocks `Contract Spirit`, `Contract Ultimate`, and `Token Spirit`.
   - `PLAY_CARD` in `session_manager.js` (line 1118) accepts any card type without canonical pathway separation.

---

## 4. Root Causes of Defect 2 (Prompts Generated Without Completing Effect Resolution)

### 4.1 Critical Engine / Session-Manager / Resolver Async Deadlock & Lost Continuation
Tracing `POST /api/sessions/:matchId/action` -> `BattleSessionManager.submitPlayerAction()` -> `game.playCard()` -> `resolver.resolveAbility()` -> `promptResolver.choose()` -> `interactionController.request()`:

1. **Blocking `await` on Player Decision Promise**:
   - `session_manager.js` creates games with `interactive: true` (lines 274, 1416).
   - When `submitPlayerAction` executes `PLAY_CARD` or `CAST_FLASH_MAGIC` for a Magic card whose effect requires a decision (e.g. target selection via `SELECT_TARGET`/`SELECT_DESTROY`/`SELECT_BOUNCE`/`SELECT_EXHAUST`/`SELECT_BP_BUFF`, optional confirmation `CONFIRM_OPTIONAL`, or `CHOOSE_OR_BRANCH`), `game.playCard()` awaits `resolver.resolveAbility()`, which awaits `interactionController.request(prompt)`.
   - `interactionController.request(prompt)` pushes the interaction into `state.pendingInteractions` and returns a `Promise` that **never resolves until `interactionController.respond()` is called**.
   - **Result**: `await game.playCard(...)` **hangs indefinitely** inside `submitPlayerAction()`. The HTTP request never returns, `store.commitAction()` never runs, and the client never even receives the `pendingInteractions` prompt!
2. **Broken Post-Restore / Post-Response Continuation**:
   - Even when `state.pendingInteractions` is persisted and `INTERACTION_RESPONSE` is submitted via `session_manager.js:1004`, `game.interactionController.respond(action.interactionId, action.response, ...)` only marks the interaction `RESOLVED` and attempts to invoke `this.pendingResolvers.get(interactionId)`.
   - After `restoreMatch()` (which reconstructs the game from SQLite JSON on every server restart or stateless restore), `this.pendingResolvers` is empty! There is **no serializable continuation/resume state** for `AsyncResolver`, so responding to an interaction marks it resolved and **executes zero remaining Magic operations**.
3. **Premature Card Movement to Trash (`engine/index.js:698`)**:
   - `playCard()` moves the Magic card to `grave` (Trash) **before** `resolver.resolveAbility()` runs. If the Magic effect fails, is cancelled, or has a custom post-resolution destination (e.g. `"banished from the game after its effect resolves"` or `"return to hand"`), the card is already prematurely placed in `grave`.

### 4.2 Compiler & Engine Timing Mismatch
Auditing all **1,577 Magic cards** in `battle_spirits.db` via `compiler/index.js`:
- All 1,577 Magic cards compile (`compiledOk: 1577`), producing `FLASH` (1,456), `PASSIVE` (862), `MAIN` (365), `BURST` (194), `MAIN_STEP` (72), `ATTACK_STEP` (49), etc.
- `engine/index.js:724-730` only executes abilities where `ab.header.isMain` or `ab.header.isFlash` is true, which misses `MAIN_STEP` (72) and `ATTACK_STEP` (49) when `isMain`/`isFlash` is unset.
- 97 clauses across Magic cards still compile to `UNSUPPORTED`.

### 4.3 Browser UI (`battle_arena.js`) Disconnection & Prompt Bugs
1. **Zero Integration with Engine `pendingInteractions`**:
   - Searching `battle_arena.js` for `pendingInteractions` or `INTERACTION_RESPONSE` returns **0 matches**. The Battle Arena UI never renders engine-generated `pendingInteractions` prompts nor submits `INTERACTION_RESPONSE` to `/api/sessions/:matchId/action`.
2. **Local `castMagic()` & `applyMagicEffect()` Bypass**:
   - `castMagic()` (line 14046) mutates `DuelState` locally in the browser without dispatching to `/api/sessions/:matchId/action` during online sessions.
   - `applyMagicEffect()` (line 13712) uses hardcoded card-name branches (`name.includes('Evil Draw')`, `name.includes('Blizzard Wall')`, etc.) and synchronous `PerCardRegistry` / `executeAbilityActions()`, returning before asynchronous UI modals (`openTargetModal`, `promptChoiceModal`) complete.
   - `executeSacrificeSummon()` (line 14445) passes `targetUid = null` to `applyMagicEffect()` with no target selection flow.

---

## 5. Remediation Plan (Phases 2–9)

1. **Phase 2 (Card-Type Classification & Action Legality)**:
   - Establish a canonical `classifyCardType(cardOrType)` helper shared across `engine/` and `battle_arena.js` covering all 9 DB types (`Spirit`, `Contract Spirit`, `Token Spirit`, `Ultimate`, `Contract Ultimate`, `Brave`, `Magic`, `Nexus`, `Contract Nexus`).
   - Enforce strict pathway separation in `engine/index.js` (`summonUnit`, `deployNexus`, `activateMagic`, `playCard`), `engine/action_authority.js`, `engine/session_manager.js`, and `battle_arena.js` (`summonCard`, `openSummonModal`, `checkCardFreeSummonEligibility`, `deployNexus`, `castMagic`).
2. **Phase 3 & 4 (Non-Blocking Magic Activation Pipeline & Resumable Prompt/Continuation Engine)**:
   - Implement a non-blocking, serializable **Suspended Execution / Continuation Protocol** in `AsyncResolver` + `InteractionController` + `BattleSessionManager` so that:
     - When `activateMagic` / `playCard` hits an interaction prompt in an interactive session (`session_manager.js`), it cleanly suspends the ability execution context (card instance, ability index, clause index, partial results, chosen targets, target destination), saves the pending interaction + serialized continuation in `state.pendingInteractions` / `state.pendingExecution`, commits the state to SQLite, and returns `{ success: true, status: 'AWAITING_INTERACTION', pendingInteractions }` immediately without hanging!
     - When `INTERACTION_RESPONSE` arrives (even after DB reload / server restart), `BattleSessionManager` validates the response against the original request's candidates, resumes `AsyncResolver` at the exact suspended clause, completes all remaining operations, and moves the Magic card to its authoritative final destination!
3. **Phase 5 & 6 (Magic Corpus Semantics & Card Destination Integrity)**:
   - Fix `MAIN_STEP` / `ATTACK_STEP` timing recognition for Magic cards, audit unsupported/defective Magic operations, and ensure Magic cards move to `grave` / `removed` / `hand` / `deck` **after** resolution (or rollback cleanly on pre-commit failure).
4. **Phase 7 (Battle UI Correction)**:
   - Block Magic cards from Spirit summoning UI & modals; render Magic-specific `Cast`/`Main`/`Flash` actions; render engine-generated `pendingInteractions` prompts in `battle_arena.js` and submit `INTERACTION_RESPONSE`; prevent duplicate activations while a resolution is pending.
5. **Phase 8 & 9 (Comprehensive Magic Regression Suite & Final Reports)**:
   - Create `tests/magic_legality_and_resolution.test.js` covering A–M requirements with real Magic cards from `battle_spirits.db`, run master verification, and produce all Phase 9 reports in `reports/magic_correction/`.
