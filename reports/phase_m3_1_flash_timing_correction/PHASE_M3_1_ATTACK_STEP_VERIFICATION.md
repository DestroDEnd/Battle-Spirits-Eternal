# PHASE M.3.1 — ATTACK STEP VERIFICATION REPORT
## Validation of Battle Flash Timing, Window Lifecycles, and Alternating Priority

**Report ID:** `PHASE-M3.1-ATK-005`  
**Test Suite:** `tests/phase_m3_1_flash_response_and_priority.test.js`, `tests/phase_m3_flash_priority.test.js`, `tests/phase_m3_block_and_second_flash.test.js`  

---

## 1. Objectives & Scope

While expanding generic Flash availability to the Main Step, Phase M.3.1 strictly preserves the battle Flash Timing rules established in Phase M.3 and official Version 17.0 rules:
1. Flash Timing 1 opens immediately following Attack Declaration.
2. The defending player receives first priority in Flash Timing 1.
3. Priority strictly alternates between defender and attacker.
4. Consecutive passes: A Flash window closes strictly upon two consecutive passes.
5. Non-forfeiture: A player who passed priority is offered priority again if their opponent performs an action.
6. Flash Timing 2 opens conditionally **only** if a block is declared.
7. Unblocked attacks skip Flash Timing 2 and transition directly to Life Damage.
8. Cards without Flash timing cannot be played during the Attack Step.

---

## 2. Test Execution & Evidence

### 2.1 Defender Priority 1 in Flash 1
- **Test Case:** `PHASE-M3.1-RESP-01`, `PHASE-M3-FLASH-01`
- **Result:** **PASSED** (7.4ms, 9.7ms)
- **Behavior:** Upon `declareAttack(atkStack.id, 'player')`, combat enters `stage = 'FLASH_1'`, and `flashPriority` is assigned to `'opponent'` (the defending player). The active response window holds `priorityPlayer = 'opponent'`.

### 2.2 Strict Priority Alternation
- **Test Case:** `PHASE-M3.1-RESP-02`, `PHASE-M3-FLASH-02`
- **Result:** **PASSED** (0.9ms, 1.5ms)
- **Behavior:**
  - Defender passes (`game.passPriority('opponent')`) -> `nextPriority = 'player'`, `consecutivePasses = 1`.
  - Attacking player now holds priority. An attempt by the defender to act out of turn is rejected with `NOT_PRIORITY_PLAYER`.

### 2.3 Two Consecutive Passes Close Window
- **Test Case:** `PHASE-M3.1-RESP-03`, `PHASE-M3-FLASH-03`
- **Result:** **PASSED** (1.7ms, 1.7ms)
- **Behavior:**
  - Defender passes -> `consecutivePasses = 1`.
  - Attacker passes -> `consecutivePasses = 2`, `windowClosed = true`.
  - Window closes, and the battle transitions to `BLOCK_DECLARATION`.

### 2.4 Non-Forfeiture of Flash Opportunity
- **Test Case:** `PHASE-M3.1-RESP-04`, `PHASE-M3-FLASH-04`
- **Result:** **PASSED** (21.1ms, 7.9ms)
- **Behavior:**
  - Defender passes (`consecutivePasses = 1`).
  - Attacker casts a Flash Magic card instead of passing.
  - `consecutivePasses` resets to `0`. Priority returns to defender (`priorityPlayer = 'opponent'`).
  - Defender is granted the opportunity to respond.

### 2.5 Conditional Flash Timing 2 Execution
- **Test Case:** `PHASE-M3.1-RESP-06`, `PHASE-M3-BLOCK-01`, `PHASE-M3-BLOCK-03`
- **Result:** **PASSED** (1.8ms, 49.8ms, 3.6ms)
- **Behavior:**
  - **When Block is Declared:** Blocker exhausts, `WHEN_BLOCKS` triggers resolve, and `FLASH_2` window opens with `priorityPlayer = 'opponent'` (Defender Priority 1).
  - **When Block is Passed (`PASS_BLOCK`):** Flash 2 is skipped entirely (`skippedFlash2 = true`), and the attack resolves as an unblocked direct hit dealing life damage.

### 2.6 Rejection of Non-Flash Cards in Attack Step
- **Test Case:** `PHASE-M3.1-REG-02`
- **Result:** **PASSED** (1.0ms)
- **Behavior:** Magic card with only `[Main]` timing attempted during Attack Step is rejected with `CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP`.

---

## 3. Summary Matrix

```
┌──────────────────────────────────────┬───────────────────────┬─────────────────────────────────┐
│ Timing Check                         │ Expected Rule         │ Observed Engine Behavior        │
├──────────────────────────────────────┼───────────────────────┼─────────────────────────────────┤
│ Flash 1 Opening Priority             │ Defender First        │ Defender Priority 1 Verified    │
│ Priority Alternation                 │ Alternates after Act  │ Alternates accurately           │
│ Pass Reset on Action                 │ consecutivePasses = 0 │ Resets to 0 verified            │
│ Window Closure                       │ 2 Consecutive Passes  │ Closes on 2nd pass verified     │
│ Flash 2 Opening                      │ Block Declared Only   │ Block declared opens Flash 2    │
│ Flash 2 on Unblocked                 │ Skipped               │ Skipped verified                │
│ Non-Flash Card Play                  │ Strictly Forbidden    │ Rejected with exact error code  │
└──────────────────────────────────────┴───────────────────────┴─────────────────────────────────┘
```
