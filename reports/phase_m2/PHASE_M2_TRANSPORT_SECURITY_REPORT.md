# Battle Spirits Eternal (BSP) — Phase M.2 Transport Security Report

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `c:\Users\namis\Downloads\BSP`  
**Phase:** Phase M.2 Work Package F  
**Status:** COMPLETE & FULLY VERIFIED  
**Date:** November 23, 2026  

---

## 1. Overview & Threat Model

In real-time web architectures, WebSocket upgrade requests and Server-Sent Events (SSE) connections frequently encounter browser limitations regarding custom HTTP request headers:
- Standard browser `WebSocket` API does not allow setting custom `Authorization: Bearer <token>` headers during the HTTP upgrade handshake.
- Similarly, browser `EventSource` API does not support custom authorization headers in standard configurations.

In legacy implementations, applications frequently passed long-lived bearer tokens in query parameters (e.g. `ws://.../stream?token=bsp_tok_...`). This creates severe security vulnerabilities:
- Query parameters are logged in plaintext by web servers, proxy caches, and reverse proxies (such as Nginx, Cloudflare, or AWS ALB).
- Tokens leak into browser history and referrer headers.
- Long-lived credentials remain vulnerable to interception if URLs are shared or exposed.

---

## 2. Short-Lived Transport Ticket Architecture

Phase M.2 implements a short-lived, single-use ticket mechanism for all streaming connections:

```
[Browser Client]                                              [BSP Server]
      |                                                            |
      | 1. POST /api/sessions/:matchId/ticket                      |
      |    Authorization: Bearer <long-lived-token>                |
      |----------------------------------------------------------->|
      |                                                            | (Validate Token)
      |                                                            | (Generate Ticket:
      |                                                            |  - single-use
      |                                                            |  - 60s TTL
      |                                                            |  - bound to match + side)
      | 2. HTTP 200 { ticket: "tkt_...", expiresIn: 60 }           |
      |<-----------------------------------------------------------|
      |                                                            |
      | 3. WebSocket Upgrade / SSE Stream                          |
      |    /ws/:matchId?ticket=tkt_...                             |
      |----------------------------------------------------------->|
      |                                                            | (Validate & Consume Ticket)
      | 4. HTTP 101 Switching Protocols / 200 text/event-stream   |
      |<-----------------------------------------------------------|
```

### Security Properties:
1. **Single-Use:** Once redeemed, the ticket is immediately deleted from memory. Any replay attempt is rejected with HTTP 401.
2. **Short-Lived:** Tickets expire 60 seconds after issuance. Expired tickets are rejected with HTTP 401.
3. **Bound Scope:** Tickets are cryptographically bound to a specific `matchId` and participant side (`player` or `opponent`). A ticket issued for Match A cannot be used on Match B.
4. **Header Compliance:** Unauthenticated upgrade attempts are rejected with standard HTTP 401 responses including `Content-Length: 0` and `Connection: close`, preventing client hangs.

---

## 3. Verification Evidence

Verification was conducted via [tests/phase_m2_transport_security.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_m2_transport_security.test.js) (10 scenarios, 100% pass):

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **WP-F 1** | Unauthenticated WebSocket handshake is rejected with HTTP 401 | **PASS** |
| **WP-F 2** | Short-lived transport ticket is issued via authenticated POST endpoint | **PASS** |
| **WP-F 3** | WebSocket upgrades successfully with valid ticket (HTTP 101) | **PASS** |
| **WP-F 4** | Reused ticket is rejected with HTTP 401 (Anti-Replay) | **PASS** |
| **WP-F 5** | Cross-match ticket isolation: Ticket for Match A rejected on Match B | **PASS** |
| **WP-F 6** | SSE stream authenticates and connects successfully with ticket (HTTP 200) | **PASS** |
| **WP-F 7** | Expired ticket is rejected on WebSocket upgrade with HTTP 401 | **PASS** |
| **WP-F 8** | Unauthenticated SSE stream is rejected with HTTP 401 | **PASS** |
| **WP-F 9** | SSE stream with expired ticket is rejected with HTTP 401 | **PASS** |
| **WP-F 10** | Initial WebSocket state and broadcasts contain zero private tokens | **PASS** |

**Conclusion:** Real-time transport security eliminates bearer token exposure in network URLs without disrupting WebSocket or SSE reliability.
