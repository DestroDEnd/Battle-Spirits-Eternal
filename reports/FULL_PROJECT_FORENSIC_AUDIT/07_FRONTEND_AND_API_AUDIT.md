# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 07. FRONTEND AND API AUDIT

**Subsystem:** HTTP REST Endpoints, Static File Delivery, and Web Arena UI  
**Audit Status:** **SECURITY VULNERABILITIES IDENTIFIED IN SERVER API**

---

### 1. HTTP Server & Route Architecture

[server.js](file:///c:/Users/namis/Downloads/BSP/server.js) implements a native Node.js HTTP server (zero external frameworks):
- **Matchmaking API:** `/api/matchmaking/find`, `/api/matchmaking/status`, `/api/matchmaking/cancel`.
- **Session API:** `/api/sessions/create`, `/api/sessions/join`, `/api/sessions/active`, `/api/sessions/history`, `/api/sessions/:matchId`.
- **Stream API:** `/api/sessions/:matchId/stream` (Server-Sent Events).
- **Card Library API:** `/api/cards`, `/api/card`, `/api/card-effects-db`, `/api/cards-batch`, `/api/sagas`.
- **Image Proxy API:** `/api/proxy-image?url=...`.
- **Static Assets:** Serves HTML/JS/CSS from root directory.

---

### 2. Frontend & API Security Vulnerabilities

#### A. [BSP-AUD-007] Unauthenticated Arbitrary Forward Proxy / SSRF (HIGH)
- **Location:** [server.js#L525-L585](file:///c:/Users/namis/Downloads/BSP/server.js#L525-L585)
- **Inspection:**
  The `/api/proxy-image` route takes any user-supplied URL and makes an outbound GET request with no domain restrictions:
  ```javascript
  const client = parsedTarget.protocol === 'https:' ? https : http;
  const proxyReq = client.get(targetUrl, { ... }, (proxyRes) => {
    proxyRes.pipe(res);
  });
  ```
- **Risk:**
  External attackers can use the server to scan private network ranges (`10.0.0.0/8`, `192.168.0.0/16`), access localhost admin endpoints, or query cloud metadata services (`http://169.254.169.254`).

#### B. [BSP-AUD-008] Sensitive File and Database Disclosure via Static Handler (HIGH)
- **Location:** [server.js#L1340-L1375](file:///c:/Users/namis/Downloads/BSP/server.js#L1340-L1375)
- **Inspection:**
  The static handler normalizes paths but does not restrict served files to a public assets folder:
  ```javascript
  let safePath = path.normalize(pathname).replace(/^(..[/\\])+/, '');
  let filePath = path.join(__dirname, safePath);
  ```
  Because `battle_spirits.db` (45.1 MB) and `.git/config` reside in `__dirname`, an unauthenticated GET request for `/battle_spirits.db` or `/.git/config` directly downloads the production database and Git repository configuration.

---

### 3. Web Arena UI Inspection

- [ui/arena.html](file:///c:/Users/namis/Downloads/BSP/ui/arena.html): Implements the Battle Spirits visual arena. Renders field stacks, life counters, core reserves, trash, and hand cards.
- **Client State Hydration:** Subscribes to SSE stream at `/api/sessions/:matchId/stream` and updates DOM reactively.
- **DOM Interaction Integrity:** In headless Chrome CDP tests, arena clicks cleanly map to button controls and modal prompts.
