# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 04. GAME ENGINE AND RULES AUDIT

**Subsystem:** Core Rules Execution, Timing Windows, Combat Lifecycle, and SBA  
**Audit Status:** **HIGH SEVERITY RULES & WINDOW DEFECTS IDENTIFIED**

---

### 1. Rules Profile Compliance

Battle Spirits Eternal is governed by the Eternal Format rules profile defined in [engine/rules/eternal.js](file:///c:/Users/namis/Downloads/BSP/engine/rules/eternal.js):
- 5 Life starting total.
- 4 Card initial hand + Contract Partner guarantee.
- Turn Steps: Start -> Core -> Draw -> Refresh -> Main -> Attack -> End.
- Combat Steps: Attack Declaration -> First Flash Timing (Flash 1) -> Block Declaration -> Second Flash Timing (Flash 2) -> Battle Resolution (BP Compare or Direct Hit) -> Battle End.

---

### 2. Combat Lifecycle & Response Window Defects

#### A. [BSP-AUD-002] Premature Window Closure & Flash 2 Bypass in declareBlock & resolveDirectHit
- **Location:** [engine/index.js#L1083-L1091](file:///c:/Users/namis/Downloads/BSP/engine/index.js#L1083-L1091), [L1232-L1237](file:///c:/Users/namis/Downloads/BSP/engine/index.js#L1232-L1237)
- **Mechanics:**
  - Calling `game.declareBlock(blockerStackId)` directly executes lines 1088-1090:
    ```javascript
    if (windows) {
      const curWin = windows.getCurrentWindow();
      if (curWin) await windows.closeWindow(curWin.windowId);
    }
    state.combat.stage = 'BP_COMPARE';
    ```
    This abruptly destroys whatever window is active (even Flash 1) and jumps straight to `BP_COMPARE`, skipping Flash 2 entirely.
  - Calling `game.resolveDirectHit()` directly closes active windows and deals life damage, denying defender interaction.

#### B. [BSP-AUD-011] BLOCK_DECLARATION Window Rejection of game.passPriority
- **Location:** [engine/response_window.js#L220-L225](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js#L220-L225), [engine/index.js#L1072-L1080](file:///c:/Users/namis/Downloads/BSP/engine/index.js#L1072-L1080)
- **Mechanics:** In `engine/response_window.js`, `BLOCK_DECLARATION` defines:
  ```javascript
  const blockActions = ['DECLARE_BLOCK', 'PASS_BLOCK'];
  win.legalActions = Array.from(new Set([...(win.eligibleActions || []), ...blockActions]));
  ```
  `game.passPriority()` hardcodes `{ action: 'PASS' }`.
  When a player calls `game.passPriority()` during `BLOCK_DECLARATION`, it is rejected with:
  ```
  { success: false, reason: 'ACTION_NOT_ELIGIBLE_IN_WINDOW' }
  ```
  The engine provides no `game.passBlock()` method. Combat deadlocks unless the caller knows to send undocumented `PASS_BLOCK`.

#### C. [BSP-AUD-012] Unconditional Flash 2 Step Skip on No-Block
- **Location:** [engine/response_window.js#L724](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js#L724)
- **Mechanics:** In `handlePassBlock()`:
  ```javascript
  // SKIPS FLASH 2! Proceeds directly to Direct Hit!
  const directHitResult = await this.game.resolveDirectHit(closed.attackerSide);
  ```
  Official Battle Spirits rules dictate that both players receive Flash Timing 2 after block declaration regardless of whether a unit blocked.

#### D. [BSP-AUD-003] Candidate Generation Divergence in calculateFlashCandidates
- **Location:** [engine/response_window.js#L1015-L1100](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js#L1015-L1100)
- **Mechanics:** Instead of invoking [engine/flash_timing.js](file:///c:/Users/namis/Downloads/BSP/engine/flash_timing.js) (`validateFlashTiming`), candidate calculation re-implements an ad-hoc regex that only checks English strings. Cards with Japanese timing headers like `フラッシュ (相手のアタックステップ)` are incorrectly offered to the attacking player as legal candidates, but subsequent execution rejects them.

---

### 3. State-Based Actions (SBA) Audit

- **0-Core Spirit Destruction:** Implemented in [engine/sba.js#L75-L110](file:///c:/Users/namis/Downloads/BSP/engine/sba.js#L75-L110). Correctly checks field units with 0 cores and sends them to Trash before next action resolves.
- **BP Comparison Destruction:** Implemented in [engine/index.js#L1140-L1180](file:///c:/Users/namis/Downloads/BSP/engine/index.js#L1140-L1180). Compares effective BP (including levels and brave boost); lower BP unit is destroyed and sent to trash; equal BP destroys both.
- **Continuous Recalculation:** Handled in [engine/continuous.js](file:///c:/Users/namis/Downloads/BSP/engine/continuous.js). Level calculation strictly enforces level thresholds against cores on stack.

---

### 4. Decision Autonomy & PromptManager Defects

- **[BSP-AUD-020] DefaultPromptResolver Auto-Decider:** In [engine/index.js#L298-L312](file:///c:/Users/namis/Downloads/BSP/engine/index.js#L298-L312) and [engine/resolver.js#L759-L800](file:///c:/Users/namis/Downloads/BSP/engine/resolver.js#L759-L800), unmanaged games fall back to `DefaultPromptResolver`, which automatically passes Flash, triggers bursts, and declines blocks, masking missing prompt handlers in tests.
- **[BSP-AUD-005] Detail Loss in PromptManager:** [engine/index.js#L344-L350](file:///c:/Users/namis/Downloads/BSP/engine/index.js#L344-L350) returns `{ success: Boolean(res), interactionId }`, discarding rejection reasons from `interactionController`.
