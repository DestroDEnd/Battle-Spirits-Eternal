# Phase M.3 — Priority Alternation Specification

## 1. Scope & Objective

This specification details the formal priority alternation mechanics implemented across Battle Spirits Eternal (BSP) in Phase M.3. Under Official Rule Manual [Eternal] Ver. 17.0, response windows (particularly Flash Timing windows) require strict alternating priority between the active and defending players.

---

## 2. Priority Rules & Finite State Machine

### 2.1 Initial Priority Assignment
1. **Flash 1 (`FLASH_1`)**: Defending player receives priority 1.
2. **Block Declaration (`BLOCK_DECLARATION`)**: Defending player holds exclusive decision priority.
3. **Flash 2 (`FLASH_2`)**: Defending player receives priority 1.
4. **Burst Window (`BURST`)**: Inactive player receives declaration priority first, followed by active player.
5. **General Response**: Defaults to the active player or the affected player as dictated by the triggering game event.

### 2.2 Alternation Transitions

```mermaid
sequenceDiagram
    autonumber
    participant Def as Defending Player
    participant Eng as Engine (ResponseWindowManager)
    participant Atk as Attacking Player

    Note over Def, Atk: FLASH_1 Window Opened (Defender Priority 1, Passes = 0)
    Def->>Eng: Submit PASS
    Eng-->>Def: Priority Transferred (Passes = 1)
    Eng-->>Atk: Priority Assigned to Attacker
    
    Atk->>Eng: Submit CAST_FLASH_MAGIC
    Note over Eng: Magic Resolves Atomically; Passes reset to 0
    Eng-->>Atk: Action Resolved (Passes = 0)
    Eng-->>Def: Priority Transferred to Defender

    Def->>Eng: Submit PASS
    Eng-->>Def: Priority Transferred (Passes = 1)
    Eng-->>Atk: Priority Assigned to Attacker

    Atk->>Eng: Submit PASS
    Note over Eng: Passes == 2 -> FLASH_1 Window Closes!
    Eng-->>Def: Open BLOCK_DECLARATION Window
```

---

## 3. Strict Invariants

### 3.1 Consecutive Pass Counter Invariant
- A counter `win.consecutivePasses` is maintained on the active window.
- Whenever a player submits a `PASS`:
  - `win.consecutivePasses` is incremented by 1.
  - If `win.consecutivePasses < 2`: Priority transfers to the opponent.
  - If `win.consecutivePasses == 2`: The window closes immediately and triggers the post-closure step.
- Whenever a player executes any legal Flash action:
  - `win.consecutivePasses` is reset to 0.
  - Priority transfers to the opposing player.
  - Passing earlier does NOT forfeit a player's ability to respond later in the same window.

### 3.2 Out-of-Priority Rejection Invariant
- Every action submission undergoes engine-level priority verification against `curWin.priorityPlayer`:
  ```javascript
  if (curWin.priorityPlayer !== playerSide) {
    return {
      allowed: false,
      reason: 'NOT_PRIORITY_PLAYER',
      currentPriority: curWin.priorityPlayer,
      attemptedPlayer: playerSide
    };
  }
  ```
- Submissions from non-priority players are rejected with HTTP 403 `NOT_PRIORITY_PLAYER`.
- No state mutation occurs; event sequence numbers are strictly incremented only on valid state changes.
