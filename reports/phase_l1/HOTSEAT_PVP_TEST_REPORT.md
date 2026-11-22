# BATTLE SPIRITS ETERNAL — PHASE L.1
# HOTSEAT TWO-PLAYER PvP VERIFICATION REPORT

**Feature:** Local Two-Player Hotseat (`HUMAN_VS_HUMAN`)  
**Components:** `battle_arena.js`, `engine/interaction.js`, `engine/session_mode.js`  
**Test Suite:** `tests/phase_l1_browser_e2e.test.js`, `tests/phase_l1_player_authority_adversarial.test.js`  
**Date:** 2026-11-22  

---

## 1. Hotseat Mode Objective

Local two-player hotseat allows two human participants to play on the same machine. Unlike single-player games against the bot, both players must have absolute decision authority:
- Player 1 controls the bottom player area (`player`).
- Player 2 controls the top opponent area (`opponent`).
- Defensive actions (blocker declarations, flash magic, burst triggers) belong authoritatively to the defending player.
- The engine must NEVER evaluate AI heuristics (`winBlocker`, `readyBlockers.sort()`) for player 2.

---

## 2. Test Execution & Evidence

### 2.1 Test Case TC-L1-P01 (Unit Adversarial Battery)
- **Scenario:** Initialized match context with `EXECUTION_MODES.HUMAN_VS_HUMAN`. Registered an active AI spy provider that records any call.
- **Actions:**
  - Player 1 issued interaction request.
  - Player 2 issued interaction request.
- **Assertions:**
  - `aiSpyCalls` was strictly 0.
  - Both interactions were suspended in status `WAITING_FOR_PLAYER`.
  - Resolution only occurred upon explicit player submission via `respond()`.
- **Outcome:** **PASSED** (0 ms).

### 2.2 Test Case TC-L1-P03 (Cross-Player Authority Isolation)
- **Scenario:** Player 1 casts an effect requiring Player 2 to choose which spirit to sacrifice.
- **Actions:**
  - Interaction issued with `decisionOwner: 'opponent'`.
  - Player 1 attempts to respond to Player 2's prompt.
- **Assertions:**
  - Engine rejects Player 1's response with `UNAUTHORIZED_RESPONDER`.
  - When Player 2 submits response, engine validates and resolves.
- **Outcome:** **PASSED** (0 ms).

### 2.3 Real-Browser Scenario 5 (Hotseat Blocker Declaration in Chrome CDP)
- **Scenario:** In `HUMAN_VS_HUMAN`, Player 1 declares attack with Lord-Dragon against Player 2.
- **Browser Actions:**
  - Player 1 clicks attack button.
  - Real Chrome modal `#universalTargetModal` opens with header `🛡️ Declare Blocker`.
  - Player 2 views ready blockers.
  - Player 2 explicitly clicks Blocker unit.
  - Combat resolution engages blocker without taking life damage.
- **Outcome:** **PASSED** in real Chrome.

---

## 3. Hotseat Verification Summary

| Decision Type | Player 1 Flow | Player 2 Flow | AI Bypass Verified |
|---|---|---|---|
| **Attack Declaration** | Human click on spirit | Human click on spirit | Yes |
| **Blocker Declaration** | N/A (Attacking) | Human modal prompt | Yes (AI Heuristic Bypassed) |
| **Optional Effects** | `#structuredDecisionModal` | `#structuredDecisionModal` | Yes (Zero auto-accept) |
| **Target Selection** | `#universalTargetModal` | `#universalTargetModal` | Yes (Zero auto-slice) |
| **Core Allocation** | Interactive core picker | Interactive core picker | Yes |

---

## 4. Acceptance Status

Hotseat PvP decision ownership is verified, symmetric, and 100% human-authoritative.
