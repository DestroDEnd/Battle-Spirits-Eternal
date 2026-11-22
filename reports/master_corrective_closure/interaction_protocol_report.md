# Work Package F — Interaction Protocol & Prompt Manager Report

**Project:** Battle Spirits Eternal (BSP)  
**Deliverable:** `reports/master_corrective_closure/interaction_protocol_report.md`  
**Target:** `engine/interaction.js`, `engine/prompt_manager.js`, `arena/adapter.js`  
**Date:** 2026-11-21  
**Status:** Unified, Integrated & Formally Verified (16/16 Passing Tests)  

---

## 1. Executive Summary

Work Package F evaluates and hardens the asynchronous interaction subsystem governing player decisions during card effect resolution, targeting, optional triggers, attack/block declarations, and flash timing windows. All 16 tests across the interaction protocol, prompt compatibility, and UI adapter suites pass with 100% compliance.

---

## 2. Architecture of the Interaction Protocol

### 2.1 State-Driven Lifecycle
All interactive decisions follow an authoritative, deterministic four-phase lifecycle:
$$\text{CREATED} \longrightarrow \text{PRESENTED} \longrightarrow \text{RESPONDED} \longrightarrow \text{RESOLVED / CANCELLED}$$
1. **Creation:** An operation (e.g., `SELECT_TARGET`, `CHOOSE_OPTION`, `CONFIRM_OPTIONAL`) requests a structured interaction via `interactionController.requestInteraction()`.
2. **Presentation:** The request is serialized and placed into `state.pendingInteraction`. A unique `interactionId` nonce is minted. The engine emits an `INTERACTION_REQUIRED` event for UI consumers.
3. **Promise Barrier:** The engine execution thread yields by returning a Promise. Progression through subsequent rules steps is completely suspended. Zero `setTimeout` or timer-based progression is permitted in game logic.
4. **Validation & Resolution:** When the player responds via `interactionController.resolveInteraction(id, response)`:
   - Candidate pool legality is checked (selected items must exist in candidate array).
   - Bounds are enforced ($N_{\text{selected}} \in [\text{min}, \text{max}]$).
   - Optionality is enforced (mandatory prompts reject cancellation).
   - Replay protection rejects duplicate, cancelled, or stale `interactionId` tokens.
   - The pending Promise resolves with the validated selection, resuming engine resolution.

### 2.2 Replay Protection & Stale Handling
- If a client attempts to submit a response for an interaction that has already been resolved, the controller immediately returns `ALREADY_RESOLVED_OR_STALE` with zero state mutation.
- If a source card leaves the field while an interaction is pending, the interaction is marked `CANCELLED` with reason `SOURCE_LEFT_FIELD`, immediately unblocking the engine.

### 2.3 Compatibility Layer (`PromptManager`)
To preserve backward compatibility with legacy scripts and existing UI components:
- `PromptManager` wraps the modern `InteractionController`.
- Legacy methods (`promptChooseCard`, `promptConfirm`, `promptChooseTarget`) translate directly into normalized interaction requests without data loss.

---

## 3. Test Verification Evidence

The interaction subsystem executed across three integration suites with 100% pass rate:
- `tests/interaction_protocol.test.js`: 5/5 PASS
- `tests/prompt_manager_compatibility.test.js`: 9/9 PASS
- `tests/ui_engine_integration.test.js`: 2/2 PASS
- **Total:** **16/16 PASS (100%)**
