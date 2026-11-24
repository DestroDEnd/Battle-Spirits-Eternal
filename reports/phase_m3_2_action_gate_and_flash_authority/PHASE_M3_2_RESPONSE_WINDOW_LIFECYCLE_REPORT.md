# PHASE M.3.2 RESPONSE WINDOW LIFECYCLE REPORT
## Combat Response Window Lifecycle, Alternating Priority & Battle Resolution

- **Module**: `engine/response_window.js`, `engine/windows.js`
- **Test Suite**: `tests/phase_m3_2_response_window_lifecycle.test.js`
- **Date**: 2026-11-23

---

### 1. The Strict Combat State Machine

Battle Spirits Eternal 17.0 rules define a strict sequence for combat progression:

```
[Attack Declared]
       │
       ▼
 ┌───────────┐
 │  FLASH_1  │ <── Priority: Defender first -> Alternating -> 2 consecutive passes closes
 └─────┬─────┘
       │
       ▼
 ┌───────────────────┐
 │ BLOCK_DECLARATION │ <── Priority: Defender declares blocker or passes block
 └─────┬─────────────┘
       │
       ├──[Block Declared]──> ┌───────────┐
       │                      │  FLASH_2  │ <── Priority: Defender first -> 2 passes closes
       │                      └─────┬─────┘
       │                            │
       │                            ▼
       │                      ┌────────────┐
       │                      │ BP_COMPARE │ <── Lower BP spirit destroyed to grave
       │                      └────────────┘
       │
       └──[Pass Block]──────> ┌────────────┐
                              │ DIRECT_HIT │ <── 1 core moved from Life to Reserve
                              └────────────┘     (FLASH_2 is completely skipped)
```

---

### 2. Verified Lifecycle Behaviors

1. **Non-Forfeiture Rule**:
   Passing priority in `FLASH_1` or `FLASH_2` **does not forfeit** the opportunity to act later in that same window. If Player A passes, and Player B uses a Flash action, Player A receives priority again and may legally activate a Flash effect (`tests/phase_m3_2_response_window_lifecycle.test.js:M3.2-L6-03`).

2. **Consecutive Passes Rule**:
   Exactly two **consecutive** passes are required to close `FLASH_1` or `FLASH_2`. Any successful Flash action resets the consecutive pass counter to 0 (`tests/phase_m3_2_response_window_lifecycle.test.js:M3.2-L6-05`).

3. **Block Declaration & Second Flash Timing**:
   When the defending player declares a block, the blocker exhausts, `BLOCK_DECLARED` and `WHEN_BLOCKS` resolve, and `FLASH_2` opens automatically with Defender priority 1 (`tests/phase_m3_2_response_window_lifecycle.test.js:M3.2-L6-01`).

4. **Unblocked Attack Path**:
   When the defending player passes block (`PASS_BLOCK` / `NO_BLOCK`), `FLASH_2` is skipped entirely. The direct hit applies 1 life damage, moving a core from defender life to reserve, and combat terminates cleanly (`tests/phase_m3_2_response_window_lifecycle.test.js:M3.2-L6-02`).

5. **State Machine Integrity**:
   No out-of-order transitions are possible. Direct method calls cannot skip intermediate windows (`tests/phase_m3_2_response_window_lifecycle.test.js:M3.2-L6-04`).
