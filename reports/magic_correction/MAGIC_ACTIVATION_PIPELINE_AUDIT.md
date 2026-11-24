# Phase 3 & 6 — Magic Activation Pipeline & Destination Integrity Audit

## 1. Authoritative 16-Step Magic Execution Pipeline

Implemented across `engine/index.js` (`activateMagic` / `playCard` / `resumeExecution`), `engine/action_authority.js`, `engine/session_manager.js`, and `engine/response_window.js`:

1. Identify exact Magic card instance in `hand` or eligible `removed` zone.
2. Validate canonical type (`classifyCardType(card).isMagic === true`) via `ACTION_PATHWAYS.ACTIVATE_MAGIC`.
3. Validate controller, active player (for Main Step), or priority owner (for Flash response windows).
4. Validate game phase and timing (`MAIN` / `MAIN_STEP` vs `FLASH` / `ATTACK_STEP`) including card-specific Attack Step qualifiers via `validateFlashTiming()`.
5. Validate activation restrictions (`CANNOT_USE_MAGIC`, `PREVENT_FLASH_HAND`).
6. Compute effective cost with symbol reductions via `calculateEffectiveCost()`.
7. Validate available normal + Soul Cores via `canAffordCost()`.
8. Pay cost transactionally via `payCost()` (recording `soulCoreUsed`).
9. Move Magic card atomically out of `hand`/`removed` into `state.resolvingCards` (single-zone conservation enforced by `validateGameState()`).
10. Evaluate `NEGATE_EFFECT` modifiers.
11. Retrieve compiled IR abilities matching `MAIN`/`MAIN_STEP` or `FLASH`/`ATTACK_STEP`.
12. Execute clauses sequentially through `AsyncResolver.resolveAbility()`.
13. When a player decision is required (`SELECT_TARGET`, `SELECT_DESTROY`, `CONFIRM_OPTIONAL`, `CHOOSE_OR_BRANCH`, etc.) in interactive session mode, suspend cleanly (`InteractionSuspendedError`), persist `state.pendingExecutions` + `state.pendingInteractions`, and return `status: 'AWAITING_INTERACTION'` without blocking HTTP.
14. Upon `INTERACTION_RESPONSE`, validate against original request candidates/counts, resume `AsyncResolver` at the exact suspended clause (`resumeExecution()`), and execute remaining clauses/abilities.
15. Move the Magic card from `state.resolvingCards` to its authoritative final destination (`removed` if banished after resolving, `grave` by default, or skip if already moved by an effect).
16. Stabilize state (`checkStateBasedActions` / `stabilizeGameState`) and commit transactionally to SQLite.
