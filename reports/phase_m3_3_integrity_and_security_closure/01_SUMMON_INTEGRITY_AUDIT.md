# PHASE M.3.3 — INTEGRITY, SECURITY, UNIVERSAL ACTION AUTHORITY & REGRESSION CLOSURE
## 01 — SUMMON INTEGRITY AUDIT

### 1. Forensic Vulnerability (Defect A1)
During independent audit of Phase M.3.2, it was confirmed that the REST/WebSocket gateway permitted arbitrary card construction and core injection via the `SUMMON` session action:
```json
{
  "type": "SUMMON",
  "card": { "name": "Arbitrary Titan", "bp": 99999, "type": "Spirit" },
  "cores": 10
}
```
The session router in `session_manager.js` directly instantiated this payload and pushed it onto the player's field without verifying whether the card existed in the player's hand or eligible zone, or whether the player possessed sufficient reserve cores.

### 2. Remediation Architecture (Work Package B)
1. **Centralized Zone Authority (`engine/action_authority.js`)**:
   - Every `SUMMON` action must identify a card that authoritatively exists in the player's `hand` or eligible `removed` zone (e.g. Accel cards).
   - If a client supplies a card object, card name, or card ID, it is looked up strictly against the server's authoritative state. If absent, the request is rejected immediately with HTTP 400 and code `CARD_NOT_IN_HAND`.
   - Card types are validated: only `Spirit`, `Ultimate`, and `Brave` may be summoned; any other type yields `INVALID_CARD_TYPE`.
2. **Authoritative Core Allocation (`engine/index.js` & `engine/payment.js`)**:
   - Cores placed on the newly summoned spirit are authoritatively transferred from the player's reserve.
   - If requested cores exceed available reserve cores, the summon is rejected with `INSUFFICIENT_RESERVE_CORES`.
3. **Turn and Timing Lockdown**:
   - `SUMMON` is categorized as `TURN_CONTROLLED`. Ordinary summons during response windows (e.g. `FLASH_1`) or during an opponent's turn are authoritatively blocked with `RESPONSE_WINDOW_ACTIVE` or `NOT_ACTIVE_PLAYER`.

### 3. Verification Evidence
Verified by `tests/phase_m3_3_summon_integrity.test.js`:
- `M3.3-B-01`: Rejects forged card data and arbitrary core injection from client payload (PASS).
- `M3.3-B-02`: Rejects summon of card not in player hand or eligible removed zone (PASS).
- `M3.3-B-03`: Rejects summon when reserve cores are insufficient for additional requested cores (PASS).
- `M3.3-B-04`: Valid summon allocates cores authoritatively from reserve and resolves triggers (PASS).
- `M3.3-B-05`: Rejects ordinary summon during active response window and by non-turn player (PASS).
