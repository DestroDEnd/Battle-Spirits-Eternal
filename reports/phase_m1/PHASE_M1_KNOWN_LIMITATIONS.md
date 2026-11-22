# Phase M.1 Known Limitations & Architectural Boundaries
**Project:** Battle Spirits Eternal (BSP)  
**Milestone:** Phase M.1 Deliverable  
**Date:** 2026-11-22  
**Status:** **DOCUMENTED ARCHITECTURAL BOUNDARIES**  

---

## 1. Purpose

This document outlines the documented technical boundaries, intentional architectural constraints, and recovery thresholds of the Battle Spirits Eternal persistent session and multiplayer subsystem as of Phase M.1.

Documenting these boundaries ensures that future development milestones (such as Phase N match matchmaking and ladder systems) operate with full transparency regarding system invariants.

---

## 2. Documented Boundaries & Limits

### 2.1 Connection Lease Thresholds
- **Heartbeat Interval:** Clients are expected to send heartbeats every 5 seconds.
- **Lease Timeout:** Set strictly at **15,000 ms (15 seconds)** (`CONNECTION_LEASE_MS = 15000`).
- **Single Disconnect Play-Through:** When one player drops, the opponent's turn clock continues running up to their 4-minute turn limit. This prevents deliberate disconnection stall exploits.
- **Dual Disconnect Grace Pause:** When both players drop, the match enters `SUSPENDED` and the clock is paused.
- **Maximum Reconnection Window:** A disconnected player has **120 seconds** (`DISCONNECT_GRACE_PERIOD_MS = 120000`) to reconnect before the match is automatically marked `FORFEITED` in favor of the connected opponent.

### 2.2 Storage & Concurrency Boundaries
- **SQLite Concurrency Model:** Persistent state is backed by SQLite operating in Write-Ahead Logging (`WAL`) mode with `NORMAL` synchronous mode and 5000ms busy timeout.
- **Optimistic Concurrency:** State updates require monotonic version incrementation (`version = expected_version + 1`). If concurrent actions clash, the engine rejects with `STALE_VERSION_CONFLICT`.
- **In-Memory Cache Size:** Active in-memory session objects are maintained for active matches; matches inactive for > 24 hours are unloaded from RAM and hydrated on demand from SQLite via `restoreMatch()`.

### 2.3 Real-Time Network Boundaries
- **Native RFC 6455 WebSocket Framing:** The WebSocket layer natively supports single-frame text and binary payloads up to 16 MB. Multi-fragment streaming frames for massive bulk uploads are parsed sequentially; partial frames exceeding buffer limits are rejected.
- **Browser Origin & Security:** Auth tokens are passed via HTTP headers (`Authorization: Bearer <token>`) or query parameters for WebSocket upgrade. Tokens are stored in browser `sessionStorage` (scoped to browser tab) rather than `localStorage` to prevent token leakage across multi-account tabs on the same machine.
- **Spectator Mode:** Anonymous queries to `/api/sessions/:matchId` return 200 with fully redacted hands and facedown cards. Direct connection to the SSE event stream or WebSocket requires an authenticated player token.

### 2.4 Browser Platform Compatibility
- **Headless Chrome CDP Harness:** Verified against Chromium / Google Chrome v110+ on Windows and Linux via CDP WebSockets.
- **Touch & Mobile Browser Controls:** The desktop UI layout is optimized for minimum 1280x720 viewports; smaller mobile screens require responsive CSS viewport scaling.

---

## 3. Summary of Resolved Prior Defects

| Phase M Defect | Phase M.1 Status |
|---|:---:|
| 1. Player 2 credentials not persisted in `joinMatch()` | **RESOLVED & VERIFIED** |
| 2. Silent fallback to `:memory:` on SQLite error | **RESOLVED & VERIFIED** |
| 3. Match events unauthenticated / leaking hidden info | **RESOLVED & VERIFIED** |
| 4. Disconnects not reliably detected without drops | **RESOLVED & VERIFIED** |
| 5. Missing real-time multiplayer synchronization | **RESOLVED & VERIFIED** |
| 6. Insecure `Math.random()` token fallback | **RESOLVED & VERIFIED** |
| 7. LocalStorage token security & CSRF considerations | **RESOLVED & VERIFIED** |
| 8. Test disposition reporting contradiction | **RESOLVED & VERIFIED** |
