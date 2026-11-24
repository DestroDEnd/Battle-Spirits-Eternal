# PHASE M.3.2 ACTION AUTHORITY REPORT
## Centralized Action Authorization Architecture & Response Window Enforcement

- **Module**: `engine/action_authority.js`
- **Integration**: `engine/session_manager.js`, `engine/index.js`, `engine/response_window.js`
- **Date**: 2026-11-23

---

### 1. Purpose and Design Principle

The core objective of Work Package B is to ensure that **the engine is the sole authority for every action, timing window, priority decision, and legal Flash activation**.

Previously, action validation was bifurcated:
- `BattleSessionManager.submitPlayerAction()` evaluated HTTP session tokens and some phase checks.
- Direct engine methods (`declareAttack`, `declareBlock`, `playCard`, `activateAbility`) had independent, partial checks.

This allowed direct engine methods or misclassified actions to bypass active response windows.

`engine/action_authority.js` creates a unified `authorizeAction(game, playerSide, actionType, actionPayload, options)` gate that is called by BOTH the session action router and direct engine methods.

---

### 2. Action Categories & Classification

All state-changing actions are categorized into strictly defined sets:

```javascript
export const ACTION_CATEGORIES = Object.freeze({
  TURN_CONTROLLED: 'TURN_CONTROLLED',         // STEP_ADVANCE, ATTACK, SUMMON, SET_BURST, etc.
  RESPONSE_WINDOW: 'RESPONSE_WINDOW',         // FLASH_ACTION, CAST_FLASH_MAGIC, DECLARE_BLOCK, PASS, etc.
  DECISION_CONTROLLED: 'DECISION_CONTROLLED', // INTERACTION_RESPONSE
  ADMINISTRATIVE: 'ADMINISTRATIVE'             // FORFEIT, SURRENDER
});
```

#### Turn-Controlled Actions
- `STEP_ADVANCE`, `ADVANCE_STEP`
- `ATTACK`, `DECLARE_ATTACK`
- `PLAY_CARD`, `SUMMON`
- `SET_BURST`, `SET_MIRAGE`
- `TRANSFER_CORE`, `MOVE_CORE`
- `END_TURN`

#### Response Window Actions
- `FLASH_ACTION`, `CAST_FLASH_MAGIC`, `ACTIVATE_FLASH_ABILITY`, `HIGH_SPEED_SUMMON`, `USE_ACCEL`
- `DECLARE_BLOCK`, `BLOCK`, `PASS_BLOCK`, `NO_BLOCK`
- `PASS_PRIORITY`, `PASS`
- `ACTIVATE_BURST`

---

### 3. Execution Rules Enforced by the Gate

When an action is submitted, `authorizeAction` enforces the following priority hierarchy:

1. **Game Over Check**: If `state.winner` is set, all non-administrative actions are rejected with `GAME_ALREADY_OVER`.
2. **Active Response Window Authority**:
   - If a response window is active (`OPEN` or `RESOLVING`):
     - **Rule 1 (Ordinary Actions Locked)**: If `actionType` is in `TURN_CONTROLLED_ACTIONS` (and not a legal Flash action), it is immediately rejected with `code: 'RESPONSE_WINDOW_ACTIVE'` (HTTP 403).
     - **Rule 2 (Priority Ownership)**: If `curWin.priorityPlayer !== playerSide`, the action is rejected with `code: 'NOT_PRIORITY_PLAYER'` (HTTP 403).
     - **Rule 3 (Window Eligibility)**:
       - In `FLASH_1` or `FLASH_2`: block actions (`DECLARE_BLOCK`, `PASS_BLOCK`) are rejected with `FLASH_TIMING_NOT_CLOSED`.
       - In `BLOCK_DECLARATION`: non-block actions are rejected with `ACTION_NOT_ELIGIBLE_IN_WINDOW`.
       - In `BURST`: non-burst actions are rejected.
3. **No Active Response Window (Turn-Controlled Actions)**:
   - Block actions outside block windows are rejected with `NOT_BLOCK_DECLARATION_WINDOW`.
   - If `TURN_CONTROLLED_ACTIONS.has(actionType)`:
     - If not a Flash action and `playerSide !== state.activePlayer`, rejected with `NOT_ACTIVE_PLAYER`.
     - If `STEP_ADVANCE` is attempted while `state.pendingInteractions.length > 0`, rejected with `PENDING_INTERACTION_ACTIVE`.
     - If `ATTACK` is attempted while `state.combat` is active, rejected with `COMBAT_ALREADY_IN_PROGRESS`.
     - In `ATTACK` step, non-Flash cards are rejected with `CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP`.

---

### 4. Integration Verification

All requirements of Work Package B are validated in `tests/phase_m3_2_universal_action_authority.test.js`:
- `M3.2-L1-01`: Session API rejects `PLAY_CARD`, `ATTACK`, `STEP_ADVANCE` when caller lacks priority in `FLASH_1`.
- `M3.2-L1-02`: Direct engine methods reject ordinary turn actions during active response window.
- `M3.2-L1-03`: Priority holder in response window cannot execute ordinary turn actions (Summon, Normal Magic).
- `M3.2-L1-04`: Authorized priority holder can successfully perform legal response actions.
