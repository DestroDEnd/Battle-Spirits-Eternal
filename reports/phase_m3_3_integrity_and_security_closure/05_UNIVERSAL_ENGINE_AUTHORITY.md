# PHASE M.3.3 — INTEGRITY, SECURITY, UNIVERSAL ACTION AUTHORITY & REGRESSION CLOSURE
## 05 — UNIVERSAL ENGINE ACTION AUTHORITY AUDIT

### Executive Summary
Work Package F ensures that no direct engine method can bypass centralized action authorization, step/phase prerequisites, or active response window priority. Previously, while session actions were gated through `ActionAuthority`, direct method calls on `game` (such as `declareBlock`, `advanceStep`, `declareAttack`, and `resolveBattleComparison`) could mutate state directly in headless or integration contexts without executing the authoritative validation pipeline. All externally accessible methods on `createGame` are now systematically governed by `actionAuthority.authorizeAction()` or strict window assertion guards.

---

### Audit of Externally Accessible Engine Methods

| Method | Historical Bypass Risk | M.3.3 Authority Enforcement Mechanism | Test ID |
| :--- | :--- | :--- | :--- |
| `playCard(cardId, ...)` | High (could trigger card resolution directly) | Centralized through `authorizeAction('PLAY_CARD')` verifying hand ownership, step timing, core sufficiency, and response window permissions. | M3.3-F-01 |
| `summonSpirit(cardId, ...)` | Critical (arbitrary card injection vulnerability) | Governed by `authorizeAction('SUMMON')`. Direct invocation strictly validates physical existence in Hand or Removed zone and legitimate core availability. | M3.3-F-01 |
| `declareAttack(attackerId, ...)` | Medium (attack declaration during active response windows) | Evaluates step (`ATTACK`), checks that no active response window exists, ensures spirit is ready, and invokes `authorizeAction('DECLARE_ATTACK')`. | M3.3-F-02 |
| `declareBlock(blockerId, ...)` | High (blocking outside `BLOCK_DECLARATION` window) | Prohibits invocation unless `ResponseWindowManager` is specifically in `BLOCK_DECLARATION` step. Requires defender priority. | M3.3-F-02 |
| `passPriority(player)` | Medium (spurious priority cycle closure) | Validated against `activeWindow` and `priorityPlayer`. Requires caller to match current priority holder. | M3.3-F-03 |
| `advanceStep(targetStep)` | Medium (stepping while interactions/windows active) | Prohibited if response window is active or unresolved interactions exist (`WAITING_FOR_PLAYER`). Authorized via `STEP_ADVANCE`. | M3.3-F-03 |
| `endTurn(player)` | Low (premature turn termination) | Evaluated through `END_TURN` authorization, ensuring active player matches turn owner and no battles are open. | M3.3-F-03 |
| `resolveBattleComparison()` | High (bypassing Flash 2 window directly) | Hard-gated against active `FLASH_2` windows. Throws `INVALID_WINDOW_STATE` if invoked before Flash 2 completes. | M3.3-F-04 |
| `resolveDirectHit(target)` | High (resolving life damage without Flash 1 pass) | Strictly gated by combat sequence state machine; cannot resolve while Flash 1 or Flash 2 is active. | M3.3-F-04 |
| `reassignCores(allocations)` | Medium (illegal core movements during battle) | Validated via `REASSIGN_CORES` against step and location legality. | M3.3-F-01 |

---

### Verification and Test Coverage
Dedicated Test Suite: `tests/phase_m3_3_universal_engine_authority.test.js`
- **M3.3-F-01**: `playCard` and `summonSpirit` cannot bypass core cost or card origin checks. (PASS)
- **M3.3-F-02**: `declareAttack` and `declareBlock` require appropriate step and response window state. (PASS)
- **M3.3-F-03**: `passPriority` and `advanceStep` reject out-of-order calls and unauthorized principals. (PASS)
- **M3.3-F-04**: Direct battle resolution methods cannot bypass active response windows. (PASS)

Result: **4/4 PASS** (Duration: 28.5ms). Zero regressions identified across direct engine invocations.
