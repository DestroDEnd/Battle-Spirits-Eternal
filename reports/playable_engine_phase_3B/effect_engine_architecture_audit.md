# BATTLE SPIRITS ETERNAL — PHASE 3B
## Effect Engine Architecture Audit

**Audit Date:** 2026-11-21  
**Project:** Battle Spirits Eternal (BSP)  
**Status:** COMPLETED  
**Scope:** Architectural boundaries, subsystem couplings, and contract enforcement across the 14 core engine modules.

---

### 1. Executive Summary

The Battle Spirits Eternal engine follows a strict **Authoritative Microkernel** architecture. All rules, legality checks, resource mutations, continuous effect recalculations, and state-based actions execute inside the deterministic JavaScript engine (`engine/`). The UI (`arena.html`, `battle_arena.js`) and automated agents act purely as client presentation and interaction layers, communicating via asynchronous Promise-based interaction requests without directly mutating game state.

---

### 2. Subsystem Architectural Boundaries

| Subsystem | Primary Module | Responsibility | Invariant Guarantees |
| :--- | :--- | :--- | :--- |
| **Engine Facade** | `engine/index.js` | Master orchestrator, match initialization, action dispatch. | Single point of entry; strict Eternal format compliance. |
| **Turn Flow** | `engine/flow.js` | Step sequencing (START, CORE, DRAW, REFRESH, MAIN, ATTACK, END). | Enforces Turn 1 step skips (Core, Draw, Attack). |
| **State & Zones** | `engine/state.js`, `engine/zones.js` | Physical card placements, core conservation, zone arrays. | Total core sum conserved; Soul Core location verified. |
| **Cost & Payment** | `engine/payment.js` | Symbol reduction calculus, payment plans, core deduction. | Never allows underpayment; atomic payment validation. |
| **Continuous Layer** | `engine/continuous.js` | Dynamic BP calculation, levels, symbols, keywords, restrictions. | Synchronous recalculation; duration-scoped modifier pruning. |
| **State-Based Actions** | `engine/sba.js` | Depleted core destruction, 0-BP destruction, win/loss checks. | Iterates until complete state stabilization. |
| **Event Dispatch** | `engine/events.js` | Asynchronous event bus, turn history telemetry. | Deterministic event payloads; zero event memory leaks. |
| **Selection & Targets** | `engine/selectors.js` | Candidate gathering, comparison filters, Armor protection. | Armor/Heavy Armor strictly immunizes against effect targets. |
| **Conditions** | `engine/conditions.js` | Structured 4-state predicate evaluation. | Returns TRUE, FALSE, UNSUPPORTED, or INVALID_CONTEXT. |
| **Restrictions** | `engine/restrictions.js` | Once-per-turn, once-per-game, same-name budget enforcement. | Stage 4 Atomic Commitment; two-phase reservations. |
| **Windows & Triggers** | `engine/windows.js`, `engine/triggers.js` | Timing window verification, event trigger queueing. | Active-player priority; FIFO resolution within player. |
| **Ability Resolver** | `engine/resolver.js` | Asynchronous clause chaining, grammar link resolution. | Stack depth limit <= 32; targeting context propagation. |
| **Operation Registry** | `engine/ops/index.js` | 296 operation case handlers implementing 288 IR opcodes. | Fail-closed on missing parameters or illegal targets. |
| **Interaction** | `engine/interaction.js`, `engine/prompt_manager.js` | UI/AI interaction protocol, prompt resolution. | Strict candidate validation; rejects stale/duplicate answers. |

---

### 3. Identified Architectural Boundaries & Inconsistencies

1. **Targeting Consistency (Resolved in Phase 3B):**
   - Direct execution of `SELECT_TARGET` in `engine/ops/index.js` previously omitted the `isTargetingResult: true` flag, creating a minor divergence from `executeTargeting`.
   - **Resolution:** Updated `SELECT_TARGET` in `engine/ops/index.js` line 5360 to return `isTargetingResult: true` on both success and rejection paths.

2. **Replacement Effect Arbitration (Planned for Phase 3C):**
   - Single-stage replacement effects (e.g. `PREVENT_DESTRUCTION`, `PREVENT_LIFE_LOSS`) execute cleanly.
   - When multiple competing replacement effects target the same destruction event, a formal arbitration queue is required to let the controller pick the applied replacement.

3. **Continuous Modifier Timestamps:**
   - Layered modifiers currently evaluate in registration order. Comprehensive timestamping is supported in `makeModId`, and dependency ordering ensures BP modifiers apply before zero-BP SBA checks.

---

### 4. Architectural Verdict
The effect engine architecture possesses complete structural integrity, robust separation of concerns, and full serialization safety. It is fully prepared for Phase 3C foundational dependency enhancements and Phase 3D effect family implementations.
