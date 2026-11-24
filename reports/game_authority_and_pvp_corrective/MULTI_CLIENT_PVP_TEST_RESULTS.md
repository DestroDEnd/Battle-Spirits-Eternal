# MULTI-CLIENT PVP TEST RESULTS

## Multi-Instance Shared SQLite Matchmaking (`PVP-MM-01`)
- **Result:** PASSED (`396.3377ms` in consolidated run)
- **Setup:** Two independent `SessionStore` + `BattleSessionManager` + `Matchmaker` instances sharing a single temporary SQLite `dbPath`.
- **Verified:**
  - Instance 1 queues `alice` -> `SEARCHING`.
  - Instance 2 queues `alice` again -> returns existing `ticketId` (`SEARCHING`), never self-pairs.
  - Instance 1 queues `charlie` -> atomically pairs with `alice` (`MATCHED`, `playerSide: 'opponent'`), while Instance 2's `pollQueue(aliceTicket)` returns `MATCHED` with the same `matchId`, `playerSide: 'player'`, and distinct `authToken`.
  - Instance 2 cancels `dave`'s ticket (`CANCELLED`); subsequent queue entry by `eve` on Instance 2 stays `SEARCHING` and never pairs with cancelled `dave`.

## Two-Browser Real Chrome PvP Matchmaking & Session Entry (`PVP-BROWSER-02`)
- **Result:** PASSED (`7015.4983ms` in consolidated run)
- **Verified:** Browser A and Browser B independently matchmake, receive identical `matchId` with opposite sides and distinct tokens, and hydrate live `DuelState` via `resumeBattle()`.
