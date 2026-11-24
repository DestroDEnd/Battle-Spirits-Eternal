# PHASE M.3 — RESPONSE WINDOW DESIGN & SPECIFICATION

**Subsystem**: Centralized Priority & Response Window Engine (`ResponseWindowManager`)  
**Specification Version**: 1.0.0 (Eternal Format Ver. 17.0 Compliant)  
**Location**: `engine/response_window.js` & `engine/windows.js`

---

## 1. Architectural Architecture & Principles

1. **Engine Authoritative**:
   - The game engine alone calculates when a window opens, who holds priority, which cards/abilities are legal responses, when priority alternates, and when a window closes.
   - The UI and API are purely projection and input layers.
2. **State-Level First-Class Citizen**:
   - The active window is preserved on `state.responseWindow` and tracked in `responseWindowManager.windowStack`.
   - Serialized into `sessions.state` in SQLite so it survives disconnects, page refreshes, and server restarts.
3. **Universal Decision Integration**:
   - Every priority turn creates/updates an authoritative interaction in `InteractionController` (`state.pendingInteractions`).
   - Ensures seamless compatibility with `session_manager.js`, SSE event streams, and existing anti-impersonation security.

---

## 2. Response Window Data Model

```typescript
interface ResponseWindow {
  windowId: string;                    // Unique identifier (e.g. "win_m3_101")
  windowType: ResponseWindowType;      // FLASH_1 | BLOCK_DECLARATION | FLASH_2 | BURST | GENERAL_RESPONSE
  timing: string;                      // FIRST_FLASH_TIMING | BLOCK_TIMING | SECOND_FLASH_TIMING | etc.
  originatingAction: any;              // Context of the action opening this window
  activePlayer: 'player' | 'opponent'; // Turn player
  opposingPlayer: 'player' | 'opponent'; // Non-turn player
  attackerStackId: string | null;      // Attacking unit stack ID
  attackerSide: 'player' | 'opponent'; // Attacking player
  defenderSide: 'player' | 'opponent'; // Defending player
  priorityPlayer: 'player' | 'opponent'; // Current player with priority
  eligiblePlayers: string[];           // Players permitted to respond in this window
  legalActions: string[];              // ['PASS', 'CAST_FLASH_MAGIC', 'ACTIVATE_FLASH_ABILITY', ...]
  legalResponseCandidates: any[];      // Array of valid cards / abilities with effective costs
  consecutivePasses: number;           // Track passes to close alternating windows (>= 2)
  responseHistory: any[];              // Sequence of executed responses in this window
  resolutionStatus: 'OPEN' | 'RESOLVING' | 'CLOSED';
  originatingInteractionId: string;    // Bridges to InteractionController
  createdAt: number;
  version: number;
}
```

---

## 3. Typed Window Policies

### Policy A: `FLASH_1` (First Flash Timing)
- **Trigger**: Declared attack after `WHEN_ATTACKS` triggers resolve.
- **Initial Priority**: **Defender (non-turn player)**.
- **Pass Semantics**: `consecutivePasses++`. Priority alternates to attacker. Does **NOT** forfeit future priority if attacker uses a Flash.
- **Flash Semantics**: Flash action resolves completely -> triggers resolve -> `consecutivePasses = 0` -> priority alternates to opponent.
- **Closing Condition**: `consecutivePasses >= 2`.
- **Post-Close Action**: Automatically transitions to `BLOCK_DECLARATION`.

### Policy B: `BLOCK_DECLARATION` (Block Step)
- **Trigger**: Closure of `FLASH_1`.
- **Initial Priority**: **Defender**.
- **Eligible Actions**: `['DECLARE_BLOCK', 'PASS_BLOCK']`.
- **Candidates**: Refreshed Spirits/Ultimates controlled by defender with `canBlock = true`.
- **Branching**:
  - **Block Declared**: Blocker exhausts -> `BLOCK_DECLARED` event -> `WHEN_BLOCKS` triggers resolve -> **Opens `FLASH_2`**.
  - **No Block / Pass**: **Skips `FLASH_2`** -> Proceeds to **Direct Hit / Unblocked Damage**.

### Policy C: `FLASH_2` (Second Flash Timing)
- **Trigger**: Valid block declared and `WHEN_BLOCKS` triggers resolved.
- **Initial Priority**: **Defender (non-turn player)**.
- **Alternating Priority**: Same alternating pass/play rules as `FLASH_1`.
- **Closing Condition**: `consecutivePasses >= 2`.
- **Post-Close Action**: Proceeds to **BP Comparison Battle Resolution**.

---

## 4. Action Authority & Concurrency Defense

1. **Non-Priority Rejection**: If `player !== window.priorityPlayer`, any response submission throws `NOT_PRIORITY_PLAYER` with HTTP 403.
2. **Progression Freezing**: `STEP_ADVANCE` is blocked with `RESPONSE_WINDOW_OPEN` while any window is active.
3. **Stale Candidate Rejection**: If game state changes (e.g. reserve cores decrease or card leaves hand), submitted responses are re-validated against current authoritative state and rejected if no longer legal.
4. **Idempotent Token Security**: Leverages Phase M.2 SHA-256 token verification and single-flight execution locks.
