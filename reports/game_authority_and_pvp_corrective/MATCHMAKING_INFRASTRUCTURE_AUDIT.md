# MATCHMAKING INFRASTRUCTURE AUDIT

## Inspected Modules
- `engine/matchmaker.js`
- `engine/session_store.js`
- `engine/session_manager.js`
- `server.js` (`/api/matchmaking/*`)
- `battle_arena.js` (`startRandomMatchmaking`, `handleMatchFound`, `cancelRandomMatchmaking`)

## Root Causes
1. **Process-local In-Memory Queue (`engine/matchmaker.js:32-33`):**
   - `this.queue = new Map()` and `this.matches = new Map()` are isolated to a single Node.js process. Any multi-process/multi-instance deployment or server restart causes players to never see each other.
2. **Missing Cancellation Tracking & Atomic DB Pairing:**
   - `leaveQueue(ticketId)` deletes from `this.queue` without persisting `CANCELLED` state, and `enterQueue` / `pollQueue` are not backed by an atomic SQLite `BEGIN IMMEDIATE` transaction.
3. **Shared Browser Profile `bse_duelist_id` Collision Risk:**
   - Two tabs in the same browser profile share `localStorage['bse_duelist_id']`, causing `candidate.playerId !== playerId` to treat both tabs as the same player.
