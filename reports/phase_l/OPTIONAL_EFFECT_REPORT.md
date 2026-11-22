# BATTLE SPIRITS ETERNAL — PHASE L
# WORK PACKAGE E: OPTIONAL EFFECT CONFIRMATION & EXPLICIT DECLINE PIPELINE REPORT

**Date:** 2026-11-22  
**Status:** COMPLETE & VERIFIED  
**Repository:** `C:\Users\namis\Downloads\BSP`  
**Test Reference:** [tests/phase_l_player_authoritative_interactions.test.js](file:///C:/Users/namis/Downloads/BSP/tests/phase_l_player_authoritative_interactions.test.js)

---

## 1. Executive Summary

In Battle Spirits Eternal, numerous cards feature optional effects identified by clauses such as "You may...", "By doing X, you can...", or optional activation conditions.

Work Package E establishes a universal, explicit optional effect confirmation pipeline. The engine never assumes an optional effect should activate (even if beneficial) nor assumes it should be skipped. The player is presented with a binary decision modal (`CONFIRM_ACTION` / `SELECT_OPTIONAL_ACTION`) and must explicitly choose to **CONFIRM** (accept) or **DECLINE** (skip).

---

## 2. Interaction Specification

### 2.1 Request Structure
An optional effect prompt contains:
- `requestType`: `"SELECT_OPTIONAL_ACTION"` (or legacy `"CONFIRM_OPTIONAL"`)
- `isOptional`: `true`
- `legalOptions`: `["CONFIRM", "DECLINE"]`
- `description`: The effect description and costs
- `player`: The player controlling the effect

### 2.2 Response Processing
When the player submits a response:
- **Acceptance:** `{ accepted: true, declined: false }` -> The resolver proceeds to execute the effect clauses.
- **Decline:** `{ accepted: false, declined: true }` -> The resolver terminates execution of the optional branch cleanly, recording `DECLINED_BY_PLAYER`, and proceeds without error.

### 2.3 Rejection of Illegal Empty Submissions on Mandatory Effects
If an effect is **mandatory** (`optional: false`), submitting `{ accepted: false }`, `{ declined: true }`, or `{ selected: [] }` when legal targets exist is strictly rejected with `MANDATORY_SELECTION_REQUIRED` (verified in `TC-L-05`).

---

## 3. UI Implementation in Browser Arena

In `battle_arena.js`:
- `askOptionalEffect` renders an interactive popup `.optional-effect-popup`.
- The popup presents two explicit buttons:
  - `button[data-opt="yes"]`: Dispatches `{ accepted: true, declined: false }`.
  - `button[data-opt="no"]`: Dispatches `{ accepted: false, declined: true }`.
- Verified in real headless Chrome (`tests/phase_l_browser_e2e.test.js`) where clicking "No" resolved the decision with `declined: true` and closed the popup.

---

## 4. Verification Table

| Test Case | Scenario | Expected Result | Actual Result |
|---|---|---|---|
| `TC-L-04` | Optional effect triggered | Creates `SELECT_OPTIONAL_ACTION`; CONFIRM activates, DECLINE skips cleanly | **PASS** |
| `TC-L-05` | Mandatory effect with 1 candidate | Declining or submitting empty array throws `MANDATORY_SELECTION_REQUIRED` | **PASS** |
| `PHASE-L-BROWSER-E2E` (Case 2) | Optional prompt in real Chrome | Clicking `data-opt="no"` button resolves with `declined: true, accepted: false` | **PASS** |

---

## 5. Summary

The optional effect confirmation pipeline guarantees that every "You may" clause requires deliberate player intent, eliminating silent auto-accepts and auto-skips.
