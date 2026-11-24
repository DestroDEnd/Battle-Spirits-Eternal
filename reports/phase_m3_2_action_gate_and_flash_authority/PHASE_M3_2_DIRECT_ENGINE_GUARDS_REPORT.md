# PHASE M.3.2 DIRECT ENGINE GUARDS REPORT
## Protection of Direct Engine Methods Against Response Window Bypass

- **Target Module**: `engine/index.js`, `engine/response_window.js`, `engine/windows.js`
- **Test Suite**: `tests/phase_m3_2_direct_engine_method_guards.test.js`
- **Date**: 2026-11-23

---

### 1. Objective

Work Package C ensures that callers cannot bypass response-window rules by directly invoking methods on the game instance (`game.declareAttack()`, `game.declareBlock()`, `game.resolveDirectHit()`, `game.resolveBattleComparison()`, `game.endAttack()`, `game.playCard()`, `game.activateAbility()`).

Every state-mutating method must inspect the response window manager state and enforce legitimate combat progression.

---

### 2. Method Guard Implementations

#### C1. `declareBlock(blockerStackId, blockerSide)` Guard
- **Problem**: Calling `game.declareBlock()` while `FLASH_1` was active prematurely closed the Flash window.
- **Guard Added**:
  ```javascript
  if (windows && typeof windows.isResponseWindowActive === 'function' && windows.isResponseWindowActive()) {
    const curWin = windows.getCurrentWindow();
    if (curWin && curWin.windowType !== RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION) {
      return {
        success: false,
        reason: 'FLASH_TIMING_NOT_CLOSED',
        code: 'FLASH_TIMING_NOT_CLOSED'
      };
    }
  }
  ```
- **Result**: Callers cannot declare blocks until both players have passed in Flash 1.

#### C2. `resolveDirectHit(attackerSide)` Guard
- **Problem**: Calling `game.resolveDirectHit()` while `BLOCK_DECLARATION` or `FLASH_1` was open directly damaged player life without giving the defender a chance to block.
- **Guard Added**:
  ```javascript
  if (windows && typeof windows.isResponseWindowActive === 'function' && windows.isResponseWindowActive()) {
    const curWin = windows.getCurrentWindow();
    if (curWin && (curWin.windowType === 'BLOCK_DECLARATION' || curWin.type === 'BLOCK_DECLARATION' || curWin.windowType === 'FLASH_1' || curWin.windowType === 'FLASH_2')) {
      return {
        success: false,
        reason: 'BLOCK_DECISION_REQUIRED',
        code: 'BLOCK_DECISION_REQUIRED'
      };
    }
  }
  ```
- **Result**: Direct hit can only resolve after the Block Declaration window has closed via `PASS_BLOCK`.

#### C3. `resolveBattleComparison()` Guard
- **Problem**: Calling BP comparison while `FLASH_2` was active skipped second Flash timing.
- **Guard Added**:
  In `ResponseWindowManager.resolveBattleComparison()`, comparison only proceeds after Flash 2 closes normally with 2 consecutive passes. Direct calls outside resolved Flash 2 return `{ success: false, reason: 'FLASH_TIMING_NOT_CLOSED' }`.

#### C4. `declareAttack(stackId, playerSide)` Guard
- **Problem**: Calling `declareAttack()` while another combat or response window was in progress.
- **Guard Added**:
  Enforces `authorizeAction` check returning `COMBAT_ALREADY_IN_PROGRESS` or `RESPONSE_WINDOW_ACTIVE`.

#### C5. Direct `playCard()` and `activateAbility()` Guards
- **Problem**: Non-active player calling `playCard()` or `activateAbility()` directly during Attack Step without an active response window or without holding priority.
- **Guard Added**:
  Integrated `validateFlashTiming()` and `authorizeAction()`, rejecting calls with `NOT_PRIORITY_PLAYER` or `CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP`.

---

### 3. Verification Evidence

All 6 guards are validated in `tests/phase_m3_2_direct_engine_method_guards.test.js`:
- `M3.2-L2-01`: `declareBlock()` cannot close Flash 1 or skip Flash timing (PASS).
- `M3.2-L2-02`: `resolveDirectHit()` cannot bypass block declaration while block window is active (PASS).
- `M3.2-L2-03`: `resolveBattleComparison()` cannot bypass Flash 2 window (PASS).
- `M3.2-L2-04`: `declareAttack()` cannot interrupt an active combat response window (PASS).
- `M3.2-L2-05`: Direct `playCard()` cannot use Flash during Attack Step without an active Flash window (PASS).
- `M3.2-L2-06`: Direct `activateAbility()` cannot activate Flash without valid timing and priority (PASS).
