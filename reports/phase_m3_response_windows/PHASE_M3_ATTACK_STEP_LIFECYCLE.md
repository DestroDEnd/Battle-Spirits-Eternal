# Phase M.3 — Attack Step Lifecycle Specification

## 1. Executive Summary

This document specifies the authoritative, rules-driven Attack Step lifecycle implemented in Battle Spirits Eternal (BSP) under Phase M.3, adhering strictly to the **Official Rule Manual [Eternal] Ver. 17.0**.

Under Phase M.3, the attack step is no longer handled through instantaneous resolution or UI-driven timing hacks. Instead, every transition between combat sub-steps (Declaration, Flash 1, Block Declaration, Flash 2, and Battle Resolution) is governed by the engine-level `ResponseWindowManager` (and its unified alias `TimingWindowManager`).

---

## 2. Formal Attack Step Sequence & State Machine

```mermaid
flowchart TD
    A["1. Attack Declaration\n- Verify eligible attacker\n- Exhaust spirit/ultimate\n- Emit CARD_EXHAUSTED & ATTACK_DECLARED"] --> B["2. 'When Attacks' Ability Trigger Resolution\n- Resolve all pending triggers\n- Evaluate field departures"]
    B --> C["3. First Flash Timing (FLASH_1)\n- Defender receives Priority 1\n- Consecutive pass counter = 0\n- Alternate priority on Pass\n- Reset counter on Flash Action"]
    C -->|2 Consecutive Passes| D{"4. Block Declaration Step\n- Defender receives Priority"}
    D -->|DECLARE_BLOCK (Refreshed Spirit)| E["5. Block Declared\n- Blocker exhausted\n- Resolve 'When Blocks' triggers\n- Open Second Flash Timing (FLASH_2)"]
    D -->|PASS_BLOCK (Unblocked)| F["6. Unblocked Direct Hit\n- FLASH_2 is SKIPPED\n- Symbol damage applied to Defender Life\n- Burst check on Life reduction"]
    E --> G["7. Second Flash Timing (FLASH_2)\n- Defender receives Priority 1\n- Alternate priority on Pass\n- Reset counter on Flash Action"]
    G -->|2 Consecutive Passes| H["8. BP Comparison (BP_COMPARE)\n- Compare Attacker BP vs Blocker BP\n- Lower BP destroyed to Trash\n- Equal BP: both destroyed\n- Survival abilities checked"]
```

---

## 3. Attack Step Lifecycle Rules & Edge Cases

### 3.1 Step Progression & Action Locking
- When an attack is declared, the match state enters `state.step = 'ATTACK'` with `state.combat` instantiated.
- **Progression Lock**: As long as any response window (`FLASH_1`, `BLOCK_DECLARATION`, `FLASH_2`) remains active:
  - Step advancement (`STEP_ADVANCE`) is rejected by the engine with HTTP 403 `RESPONSE_WINDOW_ACTIVE`.
  - Secondary attack declarations (`ATTACK`) are rejected with HTTP 403 `RESPONSE_WINDOW_ACTIVE` / `COMBAT_ALREADY_IN_PROGRESS`.

### 3.2 Attacker Field Departure During Attack Triggers
- In according with Official Rules: If the attacking Spirit is removed from the field (e.g. destroyed, bounced, depleted) during the resolution of `WHEN_ATTACKS` triggers before Flash 1:
  - Combat remains active.
  - Flash 1 window opens normally with Defender priority 1.
  - Block declaration window opens normally.
  - If unblocked, because the attacker is no longer present on the field, zero damage is dealt to Life.
  - If blocked, battle resolution does not destroy the departed attacker.

### 3.3 First Flash Timing (`FLASH_1`)
- **First Priority**: The defending player ALWAYS receives priority 1.
- **Actions Permitted**:
  - `PASS`: Passes priority to opponent, incrementing `consecutivePasses`.
  - `CAST_FLASH_MAGIC`: Plays a Magic card with Flash timing.
  - `ACTIVATE_FLASH_ABILITY`: Activates a Flash ability on a permanent.
  - `HIGH_SPEED_SUMMON`: Summons a Spirit using the High Speed keyword during Flash.
  - `USE_ACCEL`: Activates an Accel effect with Flash timing.
- **Closure Condition**: Exactly two consecutive passes (`consecutivePasses == 2`). When closed, the engine automatically transitions to the Block Declaration window.

### 3.4 Block Declaration Step (`BLOCK_DECLARATION`)
- The defending player is presented with authoritative blocker candidates (refreshed Spirits/Ultimates capable of blocking).
- The defending player must submit either:
  1. `DECLARE_BLOCK` with `blockerStackId`: Validates blocker, exhausts blocker stack, emits `CARD_EXHAUSTED` and `BLOCK_DECLARED`, resolves `WHEN_BLOCKS` abilities, and opens `FLASH_2`.
  2. `PASS_BLOCK`: Declines blocking. This unconditionally **SKIPS** `FLASH_2` and transitions immediately to unblocked direct hit resolution.

### 3.5 Second Flash Timing (`FLASH_2`)
- **Precondition**: Opened ONLY if a legal block was declared in the Block Declaration Step.
- **First Priority**: The defending player ALWAYS receives priority 1.
- **Closure Condition**: Exactly two consecutive passes (`consecutivePasses == 2`). When closed, the engine transitions immediately to BP comparison.

### 3.6 Battle Resolution (`BP_COMPARE`)
- Authoritative BP comparison:
  - Attacker BP > Blocker BP: Blocker is destroyed and sent to Trash.
  - Blocker BP > Attacker BP: Attacker is destroyed and sent to Trash.
  - Attacker BP == Blocker BP: Both Spirits are destroyed and sent to Trash.
- Indestructibility and destruction-replacement effects are evaluated deterministically.
- End-of-combat cleans up `state.combat`, resets combat flags, and returns to the Main/Attack step flow.
