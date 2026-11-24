# PHASE M.3.2 INITIAL DEFECT REPRODUCTIONS
## Independent Forensic Defect Reproduction and Remediation Verification

- **Harness**: `scripts/m3_2/reproduce_m3_2_defects.mjs`
- **Executed In**: `C:\Users\namis\Downloads\BSP`
- **Date**: 2026-11-23

---

### Defect A1: Ordinary Action Bypass During Response Windows

- **Description**: While `FLASH_1` was open with the defending player holding priority, the attacker submitted `PLAY_CARD` (or `SUMMON`, `ATTACK`, `STEP_ADVANCE`) using a valid card in hand.
- **Original Behavior (Defective)**: The attacker's action succeeded despite the defender holding priority. The card was placed onto the field/graveyard and its effect resolved while the defender's priority window remained suspended or ignored.
- **Remediation**: Integrated `authorizeAction()` in `BattleSessionManager.submitPlayerAction()` and direct engine action methods (`playCard`, `declareAttack`, `advanceStep`).
- **Remediated Behavior**: Action is strictly rejected with `code: 'RESPONSE_WINDOW_ACTIVE'` / `code: 'NOT_PRIORITY_PLAYER'` (HTTP 403). State is completely preserved.
- **Verification**: Verified in `reproduce_m3_2_defects.mjs` (Defect 1) and `tests/phase_m3_2_universal_action_authority.test.js`.

---

### Defect A2: Direct Block Declaration Bypasses Flash 1

- **Description**: While `FLASH_1` was open, a direct call was made to `game.declareBlock(blockerStackId, 'opponent')`.
- **Original Behavior (Defective)**: Bypassed remaining Flash Timing, closed the window prematurely without allowing attacker/defender Flash responses, and immediately resolved combat comparison.
- **Remediation**: Added guard check in `declareBlock()`:
  ```js
  if (windows && typeof windows.isResponseWindowActive === 'function' && windows.isResponseWindowActive()) {
    const curWin = windows.getCurrentWindow();
    if (curWin && curWin.windowType !== RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION) {
      return { success: false, reason: 'FLASH_TIMING_NOT_CLOSED', code: 'FLASH_TIMING_NOT_CLOSED' };
    }
  }
  ```
- **Remediated Behavior**: Direct block call returns `{ success: false, reason: 'FLASH_TIMING_NOT_CLOSED' }`. Flash 1 remains open with priority intact.
- **Verification**: Verified in `reproduce_m3_2_defects.mjs` (Defect 2) and `tests/phase_m3_2_direct_engine_method_guards.test.js`.

---

### Defect A3: Generic Flash Field Ability Rejected in Main Step

- **Description**: In controller's Main Step, an active Spirit/Nexus on the field with a generic Flash ability attempted activation via `game.activateAbility(cardId, abilityId, 'player')`.
- **Original Behavior (Defective)**: Failed with `FLASH_ONLY_DURING_ATTACK_STEP` due to legacy line 745 in `engine/index.js` checking `if (state.step !== 'ATTACK') return { success: false, reason: 'FLASH_ONLY_DURING_ATTACK_STEP' }`.
- **Remediation**: Removed the outdated line 745 in `engine/index.js`. Delegated timing checks to `validateFlashTiming(card, state, playerSide, { ability, timing: 'FLASH' })`, which permits generic Flash in the controller's Main Step per Official Rules v17.0.
- **Remediated Behavior**: Generic Flash field abilities activate successfully in the controller's Main Step without requiring combat context.
- **Verification**: Verified in `reproduce_m3_2_defects.mjs` (Defect 3) and `tests/phase_m3_2_flash_timing_validation.test.js`.

---

### Defect A4: Misclassification of `(When Attacks) Flash`

- **Description**: An event-triggered ability with header `[LV1] (When Attacks) Flash:` was classified as a voluntary manual Flash action and rejected during manual activation checks.
- **Original Behavior (Defective)**: Rejected with generic timing errors or misrouted to the manual Flash queue instead of triggering automatically on attack.
- **Remediation**: Updated `compiler/header_parser.js` and `engine/flash_timing.js` to parse `(When Attacks)` triggers alongside `Flash` headers, setting:
  ```js
  flashTimingSpec = {
    isTriggered: true,
    timingQualifier: 'WHEN_ATTACKS',
    triggerCondition: 'WHEN_ATTACKS',
    additionalRestrictions: { requiresBattle: true }
  };
  ```
- **Remediated Behavior**: Manual activation of `(When Attacks) Flash` is rejected with `FLASH_TRIGGERED_ABILITY_NOT_MANUAL`, while the engine's attack declaration automatically executes it as a triggered combat ability.
- **Verification**: Verified in `reproduce_m3_2_defects.mjs` (Defect 4), `tests/phase_m3_2_flash_compiler_reconciliation.test.js`, and `tests/phase_m3_2_flash_timing_validation.test.js`.

---

### Defect A5: Flash Timing Validator Response Window Priority Enforcement

- **Description**: During Attack Step, `validateFlashTiming()` verified step availability and card-specific qualifiers, but did not verify whether a combat response window was open and whether the caller held priority.
- **Original Behavior (Defective)**: Allowed Flash card/ability execution outside active response windows or while opponent held priority.
- **Remediation**: Enhanced `validateFlashTiming()` in `engine/flash_timing.js` to verify:
  1. If `state.step === 'ATTACK'` and combat is active, a response window (`FLASH_1` or `FLASH_2`) MUST be active.
  2. The caller MUST be the designated `priorityPlayer` of the active response window.
- **Remediated Behavior**: Rejects unprivileged or untimely activations with `NOT_PRIORITY_PLAYER` or `NO_ACTIVE_FLASH_WINDOW`.
- **Verification**: Verified in `reproduce_m3_2_defects.mjs` (Defect 5) and `tests/phase_m3_2_flash_timing_validation.test.js`.
