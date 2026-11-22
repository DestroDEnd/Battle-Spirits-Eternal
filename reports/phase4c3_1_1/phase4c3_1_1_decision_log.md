# Phase 4C.3.1.1 — Architectural Decision Log & Defect Reconciliation

## 1. Overview

This document records all architectural decisions, trade-offs, and resolutions established during **Phase 4C.3.1.1 (Activation Limit Architecture Reconciliation)**. It directly addresses every defect, critique, and ambiguity identified during the independent review of Phase 4C.3.1.

---

## 2. Reconciled Architectural Decisions

### Decision 1: Elimination of Mutable Array Indexes
- **Critique**: Phase 4C.3.1 used `${abilityIdx}` in key derivations, which is brittle across compiler reordering, level shifts, and granted abilities.
- **Decision**: All keys will derive from immutable canonical identifiers: `${ability.id}` (e.g. `BS01-002#a0`) and deterministic ability signatures (`hash(timing + trigger + text)`).
- **Rationale**: Guarantees zero key drift, enables independent compiler passes without invalidating saved state, and prevents collisions when cards gain external abilities (`GRANT_ABILITY`).

### Decision 2: Rule 6-1 Integration via Stack ID Lifecycle
- **Critique**: The tracking of physical card identity did not define how cards behave when changing zones.
- **Decision**: Align instance tracking directly with `stack.id` generated during field entry. When a card leaves the field to Trash/Hand and is re-summoned, a new `stack.id` is allocated.
- **Rationale**: Under Official Battle Spirits Rule 6-1, an entity leaving the field becomes a completely new game object. By keying on `stack.id`, the newly summoned card is automatically granted a fresh activation limit without manual cache-invalidation scripts.

### Decision 3: Merging `EACH_TURN` into Canonical `TURN`
- **Critique**: Phase 4C.3.1 created an unnecessary split between `TURN` and `EACH_TURN`.
- **Decision**: Collapse `EACH_TURN` into the single canonical reset interval `TURN`. Phrasing such as *"During each turn, once"* will be handled via timing permissions (`timingStep: 'ANY_TURN'`).
- **Rationale**: In Battle Spirits, every turn transition (Player turn $\leftrightarrow$ Opponent turn) is a distinct turn boundary where `state.turnNumber` increments. There is no separate "each turn" clock in the official rules.

### Decision 4: Precise Granularity for `STEP`, `BATTLE`, and `ATTACK`
- **Critique**: Phase 4C.3.1 left the boundaries and cleanup hooks for step, battle, and attack limits ambiguous.
- **Decision**: Explicitly bind each interval to its engine lifecycle event:
  - `STEP`: Reset on `STEP_END` event in `engine/flow.js:27`.
  - `BATTLE`: Reset on `pruneBattleModifiers` in `engine/index.js:22, 358, 406`.
  - `ATTACK`: Reset on `ATTACK_END` in `engine/flow.js`.
- **Rationale**: Prevents flash window leaks and ensures effects limited to "this battle" or "this attack" reset even if combat terminates abnormally (e.g. battle ends before BP comparison).

### Decision 5: Non-Aborting Clause-Level Gating (BSCO-003 Model)
- **Critique**: Phase 4C.3.1 did not specify how inline clause limits evaluate within compound abilities.
- **Decision**: Implement a two-tier evaluation system: Checkpoint A (Ability-level) in `resolveAbility`, and Checkpoint B (Clause-level) in `resolveClause`. When an inline clause limit is reached, `resolveClause` returns `{ success: true, skipped: true, reason: 'CLAUSE_LIMIT_REACHED' }`, allowing sibling clauses to execute.
- **Rationale**: Directly solves cards like `BSCO-003#a1`, ensuring the primary effect (destroy) executes on every attack while the secondary effect (refresh) executes only once per turn.

### Decision 6: Clarification of `SHARED_GROUP` Scope
- **Critique**: Phase 4C.3.1 proposed `SHARED_GROUP` without demonstrating need in canonical cards.
- **Decision**: The audit verified 0 cards in the current set require runtime dynamic shared groups. `SHARED_GROUP` is formally documented as an extensible schema construct for future modal cards, but will not complicate the baseline runtime tracker.
- **Rationale**: Prevents architectural bloat while preserving clean extensibility for modal card archetypes.

### Decision 7: Grounding of `EACH_REFERENCED_ENTITY`
- **Critique**: `EACH_REFERENCED_ENTITY` was incomplete and lacked grounding.
- **Decision**: Grounded in 16 audited cards (e.g. `BS62-X04`, `CB30-069`, `IMAGE-7`) with text *"once per turn per Spirit..."*. Key format established as `TE:${turn}:${player}:${sourceStackId}:${abilityId}:${targetStackId}`.
- **Rationale**: Accurately models abilities that can affect multiple individual allied or opposing Spirits once per turn each.

### Decision 8: Pure Plain-JSON State Architecture
- **Critique**: Phase 4C.3.1 proposed using JavaScript `Set` objects, breaking `JSON.stringify` state serialization.
- **Decision**: Forbid all `Set` and non-plain objects in engine state. All counters are stored as plain JavaScript dictionaries mapping stable strings to `UsageRecord` objects.
- **Rationale**: Guarantees full compatibility with `JSON.stringify`, structural cloning, state saving, network transmission, and AI tree search rollouts.

### Decision 9: Single Authoritative Tracker with Legacy Dual-Write Mirror
- **Critique**: Ambiguity between `state.abilityUses` and `state.restrictions` threatened double-enforcement bugs.
- **Decision**: `state.restrictions` is the sole decision engine for activation legality. `state.abilityUses` receives synchronous mirrored writes purely for backwards compatibility with external UI tools and legacy test assertions.
- **Rationale**: Eliminates race conditions, prevents duplicate rejections, and guarantees seamless backward compatibility.

### Decision 10: Routing Continuous Rules to Modifiers Pipeline
- **Critique**: Four continuous global/combat rules (`BS04-074`, `BS40-064`, `26RBS02-085`, `BS18-029`) were misclassified as activation limits.
- **Decision**: Formally remove continuous rules from the activation limit engine and route them to `state.modifiers` as `RULE_RESTRICTION` / `COMBAT_RESTRICTION`.
- **Rationale**: Continuous rules do not activate, do not pay costs, and do not track declaration usage. They are checked in `canAttack` and `canPlayCard`.

### Decision 11: Rules Grounding & Transparent Verification
- **Critique**: Claims regarding Rule 8-5 lacked citations and verification status.
- **Decision**: Ground all rules in Bandai Official Rule Manual 17.0 (Rules 8-5.1, 8-5.2, 6-1.3). Explicitly mark every assertion as `[VERIFIED - OFFICIAL RULE MANUAL]`, `[VERIFIED - TOURNAMENT RULING / FAQ]`, or `[UNVERIFIED - ENGINE CONVENTION]`.
- **Rationale**: Ensures complete regulatory integrity and transparency.

### Decision 12: Source Code Verification
- **Critique**: Previous documents contained unverified line ranges.
- **Decision**: Conducted line-by-line inspection across 8 core engine and compiler files, documenting exact lines, functions, and existing behaviors in `phase4c3_1_1_source_verification.csv`.
- **Rationale**: Provides verified foundation for Phase 4C.3.2 implementation without guessing or regressions.
