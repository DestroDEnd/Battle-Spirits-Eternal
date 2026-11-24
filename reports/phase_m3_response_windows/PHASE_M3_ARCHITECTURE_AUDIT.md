# PHASE M.3 — ARCHITECTURAL AUDIT & RESPONSE WINDOW INVENTORY

**Date**: 2026-11-22  
**Target Format**: Official Rule Manual [Eternal] Ver. 17.0  
**Repository**: `C:\Users\namis\Downloads\BSP`

---

## 1. Executive Summary

This architecture audit investigates the current Battle Spirits Eternal (BSP) engine across 12 inspection areas to identify existing capabilities, missing implementations, conflicting timing logic, and critical response-window progression defects before building the centralized **Rules-Driven Priority & Response Window Engine** (Phase M.3).

The primary critical defect identified:
**The active player can continuously advance attack actions while the defending player is completely deprived of their rules-mandated Flash 1, manual block declaration, and Flash 2 response opportunities.**

---

## 2. Investigation Across the 12 Architectural Dimensions

### 1. Current Attack Step & Battle-Resolution Implementation
- **Game Engine Core (`engine/index.js`)**:
  - `declareAttack(stackId, playerSide)`: Exhausts attacker, sets `state.combat = { stage: 'FLASH_1', flashPriority }`, resolves `WHEN_ATTACKS` triggers, but **does not pause** to run a Flash window. Returns immediately.
  - `declareBlock(blockerStackId, blockerSide)`: Exhausts blocker, resolves `WHEN_BLOCKS`, and **immediately executes BP comparison and destruction** without opening Flash 2!
  - `resolveDirectHit(attackerSide)`: Evaluates `mustBlockIfAble`, deducts Life cores, and clears combat.
- **Flow Controller (`engine/flow.js`)**:
  - Enforces `MAIN -> ATTACK -> END` step progression and turn boundaries, but treats the entire combat sub-lifecycle as internal to the Attack step.
- **Battle Arena UI (`battle_arena.js`)**:
  - `proceedWithPlayerAttack(attacker)`: Sets `attacker.isExhausted = true`, logs attack, checks burst triggers, then immediately evaluates defense outcome via heuristic without waiting for defender interaction, completely bypassing Flash 1 and Flash 2.

### 2. Attack Declaration Handling
- `engine/index.js`: Validates `canAttack`, exhausts attacker to `EXHAUSTED` (or `HEAVY_EXHAUSTED`), emits `ATTACK_DECLARED`.
- Defect: Does not freeze action progression for opponent response.

### 3. Block Declaration Handling
- `engine/index.js`: Validates `canBlock`, exhausts blocker, emits `BLOCK_DECLARED`.
- Defect: Directly proceeds to `BP_COMPARE`, skipping Flash 2 entirely.

### 4. Flash Effect Registration & Execution
- `engine/windows.js`: Contains `runFlashWindow`, `getAvailableFlashActions`, and `executeFlashAction`.
- Defect: `runFlashWindow` is disconnected from `declareAttack` in `engine/index.js` and `submitPlayerAction` in `session_manager.js`.
- In `battle_arena.js`: Flash effects are only invoked ad-hoc by the local client with no priority passing to the opponent.

### 5. Card Effect Compilation & Intermediate Representation (IR)
- Effects are compiled into structured IR in `compiledIr.abilities`:
  - `header.timing`: `'FLASH'`, `'WHEN_ATTACKS'`, `'WHEN_BLOCKS'`, `'BURST'`, etc.
  - `header.isFlash`: boolean.
  - `header.turnRestriction`: `'YOUR_ATTACK_STEP'`, `'OPPOSING_ATTACK_STEP'`.
  - `header.levels`: `[1, 2, 3]`.
- Operations are defined in structured AST nodes under generic primitives (`engine/ops/`).

### 6. Triggered Effects Queue & Resolution
- `engine/triggers.js` (`TriggerQueueManager`):
  - Detects triggers deterministically on events (`SUMMONED`, `ATTACK_DECLARED`, `BLOCK_DECLARED`, `DESTROYED`, `LIFE_REDUCED`).
  - Active player triggers are queued before inactive player triggers.
  - Resolves via `resolver.resolveAbility(state, ability, context, events)`.

### 7. Pending Interactions Lifecycle
- `engine/interaction.js` (`InteractionController`):
  - Normalized universal interaction request objects with unique IDs, candidates, constraints, and timeout policies.
  - Stored in `state.pendingInteractions` and persisted to SQLite `sessions.state`.
  - Resumed when response is submitted.

### 8. Player Ownership & Decision Authority
- `engine/session_mode.js` (`MatchContext`):
  - Enforces execution modes (`HUMAN_VS_HUMAN`, `HUMAN_VS_AI`, `AI_VS_AI`, `HEADLESS_SIMULATION`).
  - `validateAuth(decisionOwner, authContext)` validates responder authorization and prevents player impersonation.

### 9. AI Decision Routing
- Controlled by `canAiDecide(side)`:
  - In `HUMAN_VS_HUMAN`: strictly returns `false`.
  - In `HUMAN_VS_AI`: returns `true` only for AI side.
  - In `HEADLESS_SIMULATION`: simulation deciders submit through engine interface.

### 10. Battle UI State Reception
- Client receives state via `POST /api/sessions/:matchId/reconnect`, `GET /api/sessions/:matchId`, and Server-Sent Events `/api/sessions/:matchId/stream`.
- Sensitive information is redacted via `redactGameStateForViewer`.

### 11. Incorrect Automatic Progression
- **Critical Defect**: When an attack is declared, the attacker can keep advancing or clicking while the defender never receives priority.
- If a block is declared, the engine jumps straight to BP comparison without opening Flash 2.
- If no block is declared, the engine does not verify whether the defender deliberately chose to pass block or was never offered the choice.

### 12. Fragmented Priority Logic
- Multiple ad-hoc checks for `isFlashTiming` and `extractMagicTimingBlock` exist in UI code (`battle_arena.js`) rather than relying exclusively on the authoritative game engine.

---

## 3. Integration Points for Phase M.3

To resolve all deficiencies without breaking existing subsystems:

1. **Centralized `ResponseWindowManager` (`engine/response_window.js` & `engine/windows.js`)**:
   - Manages response windows as first-class authoritative state objects (`state.responseWindow`).
   - Implements typed policies for `FLASH_1`, `BLOCK_DECLARATION`, `FLASH_2`, and general response timings.
   - Computes legal candidates from current state and handles alternating priority (`consecutivePasses < 2`).
2. **Engine Flow Connection (`engine/index.js`)**:
   - `declareAttack`: After attack-triggered effects resolve, opens `FLASH_1` window with defender having priority 1.
   - `declareBlock`: Defending player chooses blocker or passes (`NO_BLOCK`). If block declared -> opens `FLASH_2`. If no block -> skips `FLASH_2` and proceeds to direct hit.
3. **Session Action Routing (`engine/session_manager.js`)**:
   - Rejects any action submission from the non-priority player while a response window is open.
   - Routes `FLASH_RESPONSE`, `BLOCK_RESPONSE`, `PASS_PRIORITY`, and `INTERACTION_RESPONSE` authoritatively.
4. **UI Adaptation (`battle_arena.js`)**:
   - Displays clear Flash window prompt with available Flash cards/abilities and a prominent `Pass Priority` button.
   - Renders blocking selection modal for defender.
   - Locks active player controls while opponent has priority.
