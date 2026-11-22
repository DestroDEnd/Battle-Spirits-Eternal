# Battle Spirits Eternal (BSP) — Phase M: Known Limitations & Future Roadmap

**Date:** 2026-11-22  
**Milestone:** Phase M Work Package L: Regression, Integration & Known Limitations  
**Auditor:** Antigravity Autonomous Systems Engineering Team  
**Repository:** `C:\Users\namis\Downloads\BSP`

---

## 1. Document Scope

This document provides a candid, evidence-backed disclosure of architectural boundaries, operational constraints, and intentional design tradeoffs in the Battle Spirits Eternal Phase M persistent battle session and turn clock implementation.

---

## 2. Documented Operational Limitations

### 2.1 Turn Clock Presets
- **Current Behavior**: The server-authoritative turn clock defaults to the tournament standard of 240 seconds (4 minutes) per turn, with a 60-second warning banner.
- **Customizability**: The engine and `BattleSessionManager.createMatch({ turnDurationMs, warningThresholdMs })` fully accept custom clock configurations (e.g. 60s Blitz, 300s Extended). However, the default Arena UI lobby does not yet provide an end-user dropdown to customize this value, defaulting to 240s for all matches.
- **Impact**: Non-critical. Matches follow official tournament timing.

### 2.2 Spectator Mode Real-Time Streaming
- **Current Behavior**: Unauthenticated clients and spectators receive a fully redacted state (`redactGameStateForViewer(state, null)`), completely masking hidden opponent cards and private deck sequences.
- **Limitation**: Spectators query state via HTTP polling (`GET /api/sessions/:matchId/events?sinceSeq=N`) rather than a dedicated persistent WebSocket push broadcast channel.
- **Impact**: Zero security or game engine impact. Event polling latency is $\approx 500\text{ms}$ under standard local network conditions.

### 2.3 SQLite Storage Growth & Retention Policies
- **Current Behavior**: Completed, forfeited, and cancelled matches are retained indefinitely in `match_sessions`, `match_clocks`, and `match_actions` for historical auditability and match history lookup.
- **Limitation**: No automatic background TTL purge job currently prunes matches older than 90 days.
- **Workaround / Solution**: A simple SQLite pruning script (`DELETE FROM match_sessions WHERE status IN ('COMPLETED', 'FORFEITED', 'CANCELLED') AND updated_at < ?`) can be scheduled when database size exceeds maintenance thresholds.

### 2.4 Browser Local Storage for Token Caching
- **Current Behavior**: Reconnection tokens (`bse_active_auth_token` and `bse_active_match_id`) are cached in `sessionStorage` and `localStorage` so that refreshing the browser or opening another tab automatically restores the active duel.
- **Limitation**: If a user clears their browser cache or uses Incognito mode and closes the incognito window without noting their 8-digit match ID, reconnection must be done using the match ID provided in the Active Battles lobby list.

---

## 3. Preservation of Historical Engine Functionality

1. **Card Implementations**: Zero card effects, IR shards, or compiler grammar definitions were modified or bypassed.
2. **Deterministic Rules Engine**: All rules invariants (Eternal Format profile in `engine/rules/eternal.js`) remain authoritative and unchanged.
3. **Player Authority (Phase L/L.1)**: Strict human-v-human decision ownership remains fully preserved; AI is never invoked for human decisions.
4. **All 56 Master Battery Suites Pass**: 680 of 680 tests pass with zero failures and zero double-counting.
