# Two-Human Real Browser PvP Verification

Verified in `tests/campaign_authority_burst_pvp_e2e.test.js` using two independent headless Chromium instances (`browserA`, `browserB`) connected to a dedicated BSP server backed by SQLite:

1. **Matchmaking & Credentials:** Player A and Player B entered `/api/matchmaking/find` from separate browser instances, received the same `matchId`, opposite sides (`player` vs `opponent`), and distinct `authToken` values.
2. **Session Hydration:** Both browsers hydrated via `BattleArena.resumeBattle(matchId, authToken)`, entering `DuelState.inDuel = true`, `DuelState.isOnline = true` with each player's own private hand.
3. **Authority & Idempotency:** Inactive player's unauthorized `STEP_ADVANCE` was rejected; active player's `STEP_ADVANCE` succeeded; duplicate `actionId` returned idempotent replay without re-executing.
4. **Realtime Sync & Reconnect:** Passive browser synchronized `DuelState.step` via SSE; `resumeBattle` reconnected cleanly to the existing `matchId`.
