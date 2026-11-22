# Interaction Protocol Hardening & Replay Protection Report (Phase 4D — Work Package H)
**Generated At:** 2026-11-21T09:37:00.000Z  
**Project:** Battle Spirits Eternal (BSP)  
**Standard:** Stage 5 Interaction Protocol & Asynchronous Decision Safety  

---

## 1. Executive Summary

Work Package H audits the player interaction protocol (`engine/interaction.js`) and UI adapter bridge (`engine/ui_adapter.js`, `battle_arena.js`) to guarantee candidate legality, perspective validation, asynchronous engine pauses, and replay protection.

### Verified Test Suites:
- `tests/interaction_protocol.test.js`: **5/5 PASS (100%)**
- `tests/prompt_manager_compatibility.test.js`: **9/9 PASS (100%)**
- `tests/ui_engine_integration.test.js`: **2/2 PASS (100%)**
- **Total Interaction Protocol Tests:** **16/16 PASS (100.00%)**

---

## 2. Interaction Contract & Protocol Lifecycle

```
[Engine Operation Requires Decision]
                │
                ▼
  [createInteractionRequest()]
  - Generates unique ID: interaction_...
  - Candidate Pool: [{ id, name, zone, cost, bp, ... }]
  - Selection Bounds: [minSelections, maxSelections]
  - Target Perspective: player | opponent
  - Status: WAITING_FOR_PLAYER
                │
                ▼
  [Engine Awaits Promise Resolution] (Game thread safely suspended)
                │
                ▼
  [Player Submits Response via UI Modal / CDP]
                │
                ▼
  [validateInteractionResponse()]
  ├── 1. Perspective Check (Does response player match request player?)
  ├── 2. Replay Check (Has request ID already been resolved?)
  ├── 3. Candidate Legality (Are all selected IDs in candidate pool?)
  └── 4. Bounds Check (Does count satisfy [min, max]?)
                │
          ┌─────┴─────┐
      (Valid)     (Invalid)
          │           │
          ▼           ▼
  [Commit Choice] [Reject with Error]
  - Status: RESOLVED
  - Engine Resumes
```

---

## 3. Core Hardening Invariants

### 3.1 Candidate Legality & Anti-Injection
- Target selection prompts (`SELECT_CARDS`, `SELECT_TARGET`) compute candidates strictly from current game state (`queryCandidates`).
- Responses containing candidate IDs outside the authorized candidate pool are rejected immediately with `ILLEGAL_CANDIDATE_SELECTED`.
- Players cannot target cards across zones or opposite sides unless explicitly queried by the effect.

### 3.2 Replay Protection
- Every interaction request generates a cryptographically random or monotonically incremented interaction token (`interaction_${timestamp}_${uid}`).
- Once `InteractionController.resolveInteraction(reqId, response)` succeeds, the request transitions to `RESOLVED` or `CANCELLED`.
- Any subsequent attempt to re-submit or replay choices with that `reqId` returns `{ success: false, reason: 'INTERACTION_ALREADY_RESOLVED' }`, preventing double-trigger or desynchronization exploits.

### 3.3 PromptManager Dual-Engine Compatibility
- `engine/ui_adapter.js` seamlessly converts internal `InteractionRequest` objects into `PromptManager` modals for legacy and browser environments.
- Supports both async modal promise resolution and event-driven browser DOM handlers.

---

## 4. Audit Evidence

All 16 interaction protocol and PromptManager tests execute deterministically and pass with zero failures. Real browser verification (Work Package C) demonstrated this protocol in action through real Chrome CDP clicks on `#playerHand`, `.universal-target-modal`, and `#btnConfirmSummonPayment`.
