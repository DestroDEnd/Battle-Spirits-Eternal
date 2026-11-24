# Battle Spirits Eternal (BSP) — Phase M.2 Action Authority Report

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `c:\Users\namis\Downloads\BSP`  
**Phase:** Phase M.2 Work Package B  
**Status:** COMPLETE & FULLY VERIFIED  
**Date:** November 23, 2026  

---

## 1. Overview & Threat Analysis

An independent audit reproduced a critical turn authority bypass:
- A player possessing a valid session token could submit game actions even when they were not the active player during the current phase.
- Specifically, Player 2 could submit `STEP_ADVANCE` while Player 1 was in their Main Step, forcing turn progression.
- Clients could inject fabricated fields (`action.player`, `action.responder`, `action.decisionOwner`) that the engine trusted over server-validated credentials.

---

## 2. Server-Enforced Authority Rules

All actions submitted to `POST /api/sessions/:matchId/action` are routed through `BattleSessionManager.submitPlayerAction()`, which enforces the following authority hierarchy:

### A. Turn-Controlled Actions
Actions that advance the turn or manipulate active player state:
- Action Types: `STEP_ADVANCE`, `ADVANCE_STEP`, `ATTACK`, `PLAY_CARD`, `SET_BURST`, `SUMMON`, `USE_CORE`, `END_TURN`
- Authority Rule: Must be submitted exclusively by `game.state.activePlayer`.
- Rejection: Throws HTTP 403 / `NOT_ACTIVE_PLAYER`.
- Phase Constraint: `STEP_ADVANCE` is rejected if pending interaction decisions are unresolved (HTTP 400 / `PENDING_INTERACTION_ACTIVE`).

### B. Decision-Controlled Actions
Actions that respond to interactive decisions (`INTERACTION_RESPONSE`):
- Authority Rule: Must be submitted by the player matching `interaction.decisionOwner`.
- Rejection:
  - If interaction does not exist or has already resolved: HTTP 400 / `INTERACTION_NOT_FOUND`.
  - If interaction is no longer pending: HTTP 400 / `INTERACTION_NOT_PENDING`.
  - If caller is not the decision owner: HTTP 403 / `UNAUTHORIZED_DECISION_OWNER`.
  - If response window priority is held by opponent: HTTP 403 / `NOT_PRIORITY_PLAYER`.

### C. Candidate Selection Constraints
- Selections submitted in an interaction response must exist within `interaction.candidates`.
- Selection counts must satisfy `minSelections <= count <= maxSelections`.
- Violations are rejected with HTTP 400 / `INVALID_CANDIDATE` or `SELECTION_COUNT_INVALID`.

### D. Anti-Spoofing & Claim Stripping
- Any caller-supplied identity claims (`action.player`, `action.responder`, `action.decisionOwner`, `action.authenticatedSide`) are verified against the server-authenticated participant side. If a client attempts to claim identity other than their authenticated side, the request is rejected with HTTP 403 / `IMPERSONATION_ATTEMPT_DETECTED`.

---

## 3. Verification Evidence

Verification was conducted via [tests/phase_m2_action_authority.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_m2_action_authority.test.js) (16 scenarios, 100% pass):

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **WP-B 1** | Non-active player cannot advance the current turn (`NOT_ACTIVE_PLAYER`) | **PASS** |
| **WP-B 2** | Active player can perform a legal turn-controlled action | **PASS** |
| **WP-B 3** | Opponent cannot impersonate active player via spoofed fields | **PASS** |
| **WP-B 4** | Opponent can make authorized pending interaction decision | **PASS** |
| **WP-B 5** | Player 1 cannot answer Player 2 interaction | **PASS** |
| **WP-B 6** | Player 2 cannot answer Player 1 interaction | **PASS** |
| **WP-B 7** | Forged `responder` claim is rejected or ignored | **PASS** |
| **WP-B 8** | Forged `decisionOwner` claim is rejected or ignored | **PASS** |
| **WP-B 9** | Forged `authenticatedSide` claim is rejected or ignored | **PASS** |
| **WP-B 10** | Stale interaction response is rejected (`INTERACTION_NOT_PENDING`) | **PASS** |
| **WP-B 11** | Duplicate interaction response does not resolve twice | **PASS** |
| **WP-B 12** | Player cannot act during an invalid match phase | **PASS** |
| **WP-B 13** | Player cannot bypass candidate selection constraints | **PASS** |
| **WP-B 14** | AI-controlled decisions remain restricted to AI provider | **PASS** |
| **WP-B 15** | Human-vs-human decisions never silently fall back to AI | **PASS** |
| **WP-B 16** | Headless simulation remains functional | **PASS** |

**Conclusion:** Strict server-authenticated participant authority is enforced across all game actions and timing windows.
