# Battle Spirits Eternal (BSP) — Phase M.2 API Security Report

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `c:\Users\namis\Downloads\BSP`  
**Phase:** Phase M.2 Work Package E  
**Status:** COMPLETE & FULLY VERIFIED  
**Date:** November 23, 2026  

---

## 1. Overview & Threat Analysis

An independent audit identified a critical authorization flaw in match discovery:
- `GET /api/sessions/active` and `GET /api/sessions/history` allowed unauthenticated callers to query running matches.
- Callers could supply arbitrary `playerId` query parameters to discover matches belonging to other players.
- Responses exposed active match IDs, player identifiers, and turn states to unauthorized third parties.

---

## 2. API Hardening & Access Control

### A. Strict Authentication Requirement
In [server.js](file:///c:/Users/namis/Downloads/BSP/server.js):
- Both `GET /api/sessions/active` and `GET /api/sessions/history` now require a valid Bearer token (`Authorization: Bearer <token>`).
- If no token is provided: the server immediately returns HTTP 401 with `error: "AUTHENTICATION_REQUIRED: Caller authentication token required"`.

### B. Scoping by Token Hash
In [engine/session_store.js](file:///c:/Users/namis/Downloads/BSP/engine/session_store.js):
- Implemented `listActiveSessionsByTokenHash(tokenHash)` and `listSessionHistoryByTokenHash(limit, tokenHash)`.
- SQL queries filter by participant token hash:
  ```sql
  WHERE status IN ('ACTIVE', 'PLAYER_DISCONNECTED', 'SUSPENDED')
    AND (player1_token_hash = ? OR player2_token_hash = ?)
  ```
- Callers can ONLY see matches that their authenticated token participates in.
- If a caller supplies a `playerId` query parameter that differs from the player associated with their token hash, the query returns an empty list `[]`, completely defeating match enumeration and user tracking.

### C. Spectator Information Redaction
- Anonymous or unauthenticated spectator queries to `GET /api/sessions/:matchId` return only public match metadata.
- All hidden cards (opponent hands, face-down deck cards, facedown bursts) are scrubbed and replaced with `{ masked: true }` via `redactGameStateForViewer()`.
- Participant tokens and token hashes are completely scrubbed from all API responses via `scrubCredentials()`.

---

## 3. Verification Evidence

Verification was conducted via [tests/phase_m2_match_discovery_security.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_m2_match_discovery_security.test.js) (100% pass):

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **WP-E 1** | Anonymous request to `GET /api/sessions/active` is rejected with HTTP 401 | **PASS** |
| **WP-E 2** | Anonymous request to `GET /api/sessions/history` is rejected with HTTP 401 | **PASS** |
| **WP-E 3** | Invalid token returns empty matches list without revealing third-party sessions | **PASS** |
| **WP-E 4** | Forged `playerId` query parameter cannot leak another player's active matches | **PASS** |
| **WP-E 5** | Authenticated player discovers only matches they participate in | **PASS** |
| **WP-E 6** | Anonymous spectator querying match state receives only public data | **PASS** |
| **WP-E 7** | Spectator response contains zero authentication credentials | **PASS** |

**Conclusion:** Active match discovery and history endpoints are authenticated and enumeration-proof.
