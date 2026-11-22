# Battle Spirits Eternal (BSP) — Local Release Candidate Checklist
## Release Readiness Program — Phase I Local Packaging, Startup & Deployment Verification

**Evaluation Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Target Environment:** Local Workstation / Desktop (Zero Cloud / Zero Online Dependencies)  
**Status:** **READY FOR LOCAL RELEASE CANDIDATE DEPLOYMENT**

---

## 1. Executive Summary

Battle Spirits Eternal is designed exclusively as a local workstation application. It requires zero cloud infrastructure, zero database servers (utilizing an embedded zero-configuration SQLite engine and local JSON shards), and zero third-party authentication services.

This checklist provides the exact verification sequence required for a fresh local deployment.

---

## 2. Release Checklist Ledger

| Verification Domain | Milestone Criteria | Evidence / Verification Method | Status |
|---|---|---|:---:|
| **1. Engine Core** | Pure state transitions, core conservation, async interaction protocol | 747/747 master regression tests pass | **VERIFIED** |
| **2. Compiler Pipeline** | Natural text $\rightarrow$ AST $\rightarrow$ RFC 8785 deterministic IR | 137 compiler & identity tests pass | **VERIFIED** |
| **3. Card Data Integrity** | Exact reconciliation across 14,443 detailed cards & 514 shards | `canonical_population_audit.json` | **VERIFIED** |
| **4. Automated Tests** | 40 active master battery suites passing synchronously | `master_test_results.md` (100% PASS) | **VERIFIED** |
| **5. Local Server Startup** | HTTP server binds to `127.0.0.1:3000`, serves all routes | `server.js` startup test passed | **VERIFIED** |
| **6. Browser Arena UI** | Live DOM click-to-summon, payment, targeting, attack | `scripts/verify_browser_10_runs.mjs` (10/10 PASS) | **VERIFIED** |
| **7. Human Gameplay** | Manual full-match testing, tactile feel, visual Polish | Human developer testing domain | **PENDING SIGN-OFF** |

---

## 3. Local Installation & Startup Instructions

### 3.1 System Prerequisites
- **Operating System:** Windows 10/11, macOS 12+, or Ubuntu Linux 20.04+.
- **Node.js Runtime:** Node.js v18.x, v20.x, or v24.x (uses native ES Modules and `node:sqlite`).
- **Dependencies:** Embedded in repository. Run `npm install` if installing optional dev dependencies.

### 3.2 Starting the Local Application
Execute the standard start script from the project root:

```bash
# Option A: Standard npm startup
npm start

# Option B: Direct Node startup
node server.js
```

Expected startup terminal output:
```
[Server] Initializing Battle Spirits Eternal...
[Server] Loaded 14,443 detailed cards into memory index.
[Server] SQLite database connection established (battle_spirits.db).
[Server] HTTP server listening on http://127.0.0.1:3000
```

### 3.3 Accessing the Game Interface
Open any modern browser (Chrome, Edge, Firefox, Brave) and navigate to:
- **Battle Arena:** `http://127.0.0.1:3000/arena` (or `/battle`, `/duel`)
- **Card Database Browser:** `http://127.0.0.1:3000/browse`
- **Deck Builder:** `http://127.0.0.1:3000/deck`
- **Keywords Reference:** `http://127.0.0.1:3000/keywords`

### 3.4 Custom Port Configuration
If port 3000 is occupied by another local service, launch with a custom port:
```bash
PORT=8080 node server.js
# On Windows PowerShell:
$env:PORT="8080"; node server.js
```

---

## 4. Local Data Persistence & Error Recovery

### 4.1 User Deck Storage
- User decks are persisted locally in browser `localStorage` under `bs_user_decks_v2`.
- Decks can be exported and imported as JSON or plain text decklists.
- Six standard canonical starter decks (Red, Purple, Green, White, Yellow, Blue) are pre-loaded in memory and immediately available for instant play.

### 4.2 Recovery from Corrupted Shards or Database
1. If SQLite database is missing:
   - `server.js` automatically falls back to in-memory index loaded from `data/cards_detailed.json`.
2. To rebuild the SQLite database from canonical JSON:
   ```bash
   node scripts/clean_and_optimize_db.js
   ```
3. To re-compile all 514 IR shards:
   ```bash
   node scripts/compile_514_shards.mjs
   ```

---

## 5. Local Release Readiness Conclusion

Battle Spirits Eternal is completely packaged and ready for local workstation execution. Startup is instant, requires zero external services, and provides a fully functional local arena.
