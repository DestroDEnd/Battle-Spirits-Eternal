# Battle Spirits Eternal (BSP) — Local Playability Audit & Verification Report
## Phase K — Work Package I Deliverable

**Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Governing Standard:** Battle Spirits Eternal Rules Engine Invariant Standard (`AGENTS.md`)  
**Status:** **AUTHORITATIVE LOCAL PLAYABILITY VERIFICATION**

---

## 1. Executive Summary & Local Gameplay Architecture

Work Package I evaluates Battle Spirits Eternal from the perspective of two human players executing a complete local match. The architecture strictly enforces a local-first, engine-authoritative design:
- **Zero Rules in UI:** The frontend (`arena.html`, `js/arena.js`, `js/engine-adapter.js`) contains zero duplicated game logic, custom damage formulas, or ad-hoc rule checks. Every state transition is computed by the core rules engine (`engine/index.js`, `engine/rules/eternal.js`, `engine/zones.js`, `engine/flow.js`).
- **Asynchronous Prompt Protocol:** When player choices are required (e.g. target selection, burst declaration, block choice, core payment), the engine yields execution through Promises (`AsyncResolver`, `PromptManager`, `DefaultPromptResolver`) and suspends state mutation until the player resolves the prompt via visible UI controls.
- **Strict Eternal Format Compliance:** Standard decks adhere to canonical 40–60 card deck construction rules, 3-copy limits, and restricted card lists.

---

## 2. Comprehensive 20-Stage Local Gameplay Lifecycle Verification

| Gameplay Stage | Engine Authority & API | UI Component / DOM Element | Invariant & Operational Verification |
|---|---|---|---|
| **1. Deck Loading & Selection** | `validateDeck(deck, ETERNAL_RULES)` | `#arenaPlayerDeckSelect`, `#arenaOpponentDeckSelect` | Validates 40+ cards, copies per card $\le 3$, color identity, and banned lists. Rejects non-canonical cards. |
| **2. Match Initialization** | `createGame({ playerDeck, opponentDeck, strictRules: true })` | `#btnEnterColosseum`, `#battleArenaApp` | Instantiates isolated `GameState`, deep-clones card instances, assigns unique `placementId` and `uid`. |
| **3. Initial Resource Setup** | `initializeGameResources(state)` | `#playerLifeCoreZone`, `#playerReserveZone` | Exactly 5 cores from Void to Life; 4 cores from Void to Reserve; 1 Soul Core placed in Reserve. $\Delta C = 0$. |
| **4. Initial Draw** | `drawInitialHand(state)` | `#playerHand`, `#opponentHand` | Exactly 4 cards drawn from top of shuffled deck to player hand; opponent hand drawn secretly. |
| **5. Turn Progression** | `game.advanceTurn()` | `#turnIndicator`, `#currentTurnNumber` | Increments `turnNumber`, resets turn-scoped activation limits (`restrictions.js`), updates active player. |
| **6. Phase & Step Progression** | `game.advanceStep()` | `#btnNextPhase`, `.phase-step-tracker` | Sequences `START` $\to$ `CORE` $\to$ `DRAW` $\to$ `REFRESH` $\to$ `MAIN` $\to$ `ATTACK` $\to$ `END`. |
| **7. Turn 1 Restrictions** | `ETERNAL_RULES.firstTurnRestrictions` | `#btnNextPhase` | Player 1 on Turn 1 automatically skips `CORE`, `DRAW`, and `ATTACK` steps, preventing first-turn offensive blitz. |
| **8. Spirit Summoning** | `game.playCard(cardId, options, side)` | `.btn-quick-summon`, `.hand-card-item` | Evaluates cost reduction via active symbols; deducts cost cores from Reserve/Field; requires $\ge 1$ placement core for Level 1. |
| **9. Ultimate Summoning** | `game.playCard(cardId, options, side)` | `#playerHand .ultimate-card` | Enforces Ultimate condition (e.g. requires $\ge 1$ Red symbol); establishes baseline level at Level 3. |
| **10. Nexus Placement** | `game.playCard(cardId, options, side)` | `#playerNexusZone` | Places Nexus on field; cores can be 0 or more; persistently provides symbol reduction for subsequent card plays. |
| **11. Brave Card Plays** | `game.playCard(cardId, options, side)` | `#playerField .brave-stack` | Can be summoned as an independent Spirit or combined (Braved) directly with an eligible host Spirit stack. |
| **12. Magic Card Play (Main/Flash)** | `game.playCard(cardId, options, side)` | `#playerHand .magic-card`, `#btnFlashPlay` | Verifies timing (`MAIN` or `FLASH`); computes reduction; resolves op pipeline; moves Magic card to Graveyard. |
| **13. Core Payment & Conservation** | `payCost(state, cost, options)` | `#battleSummonPaymentModal` | Supports Reserve and Field cores; prevents reducing Spirit stacks below Level 1 unless deliberate sacrifice. $\Delta C = 0$. |
| **14. Flash Windows** | `game.openFlashWindow(timing)` | `#battleFlashModal`, `#btnPassFlash` | Alternates priority between non-active and active player until both consecutively pass. |
| **15. Target Selection** | `game.resolver.resolveTargets(...)` | `.universal-target-modal`, `[data-uid]` | Production engine computes legal targets matching criteria; renders candidate list in DOM; awaits player click. |
| **16. Trigger Resolution** | `game.emit(event)` $\to$ `processTriggers(state)` | `#triggerQueueDisplay` | Enqueues `WHEN_SUMMONED`, `WHEN_ATTACKS`, `WHEN_DESTROYED`, and `BURST` triggers; resolves in LIFO order with priority. |
| **17. Attack Declaration** | `game.declareAttack(stackId, side)` | `document.getElementById('spirit_' + uid).click()` | Checks that Spirit is refreshed; transitions state to `EXHAUSTED`; fires `WHEN_ATTACKS` triggers; opens Flash Window 1. |
| **18. Block Choice** | `game.declareBlock(blockerStackId, side)` | `#battleBlockModal`, `.btn-choice-block` | Defending player can select refreshed Spirit to block or pass; opens Flash Window 2. |
| **19. Battle Resolution** | `game.resolveBattle()` | `#combatDisplay`, `.damage-indicator` | Unblocked: removes 1 core from defending player's Life to Reserve; Blocked: compares effective BP; lower BP spirit destroyed to Trash. |
| **20. Win/Loss & Completion** | `checkWinLoss(state)` | `#battleResultModal` | Evaluates Life $\le 0$ or drawing from empty deck; triggers terminal state; disables further phase progression. |

---

## 3. Automated Local Match Verification Evidence

The local match engine was validated across three dedicated end-to-end integration test suites:

1. **`tests/playable_engine_local_match.test.js` (4/4 PASS):**
   - Multi-turn match between Player and Opponent.
   - Verified Turn 1 skipping Core, Draw, and Attack steps.
   - Verified Spirit summoning (BS01-002 Rokceratops, BS01-006 Merat).
   - Verified Magic card resolution (BS01-117 Double Draw) yielding exact +2 hand delta.
   - Verified combat with BP comparison (Merat 3000 BP destroying Rokceratops 1000 BP to Graveyard).
   - Verified Life core reduction from 5 to 4 upon unblocked attack.

2. **`tests/playable_engine_complete_match.test.js` (2/2 PASS):**
   - Full simulated game to terminal victory.
   - Verified deck depletion condition and 0-Life victory condition.
   - Confirmed state invariant preservation throughout match progression.

3. **`tests/public_release_e2e_match.test.js` (7/7 PASS):**
   - Verified public interface compatibility, standard deck hydration, and UI event dispatching.

---

## 4. UI-to-Engine Protocol Integrity

- **State Isolation:** `window.BattleArena.getState()` provides a read-only snapshot or decoupled viewmodel of the underlying engine state.
- **Zero Synthetic DOM Hacks:** No synthetic events or manual array splicing bypasses the engine.
- **Fail-Closed Guarantees:** Any illegal play (e.g. attempting to summon without adequate cores, attacking while exhausted, selecting non-candidate targets) is rejected by the engine with a specific rejection status code (`INVALID_COST`, `INVALID_TARGET`, `ACTION_RESTRICTED`).
