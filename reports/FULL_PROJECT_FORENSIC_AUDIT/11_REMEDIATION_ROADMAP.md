# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 11. REMEDIATION ROADMAP

This document outlines the prioritized, step-by-step remediation plan to resolve all 21 confirmed audit defects.

---

### Phase R.1 — Immediate Security & Participant Authority Remediation (P0)

**Goal:** Close critical security holes, prevent unauthorized actions, and secure production assets.

1. **Remediate Response Window Authority Bypass ([BSP-AUD-001](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-001)):**
   - In [engine/session_manager.js](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js), reorder checks so that when `isWinActive` is `true`, all actions outside `responseWindowActions` and `INTERACTION_RESPONSE` are immediately rejected with `RESPONSE_WINDOW_ACTIVE`.
2. **Eliminate Arbitrary Unit Injection & Core Minting ([BSP-AUD-006](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-006)):**
   - Remove or restrict `action.type === 'SUMMON'` in `session_manager.js`. Require all summons to go through `PLAY_CARD` validating hand membership and reserve cores.
3. **Secure Web Root & Restrict Static File Serving ([BSP-AUD-008](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-008)):**
   - In [server.js](file:///c:/Users/namis/Downloads/BSP/server.js), restrict static file delivery to public assets (`.html`, `.css`, `.js`, `.png`, `.svg`). Explicitly reject `.db`, `.git`, `.env`, and hidden dotfiles.
4. **Remediate SSRF Forward Proxy ([BSP-AUD-007](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-007)):**
   - In [server.js](file:///c:/Users/namis/Downloads/BSP/server.js), enforce a strict domain allowlist for `/api/proxy-image` and reject private IP addresses.
5. **Prevent Failed Actions from Committing ([BSP-AUD-021](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-021)):**
   - In `session_manager.js`, check `res.success` on `PLAY_CARD` and throw on failure to prevent committing failed actions.

---

### Phase R.2 — Timing Windows & Reconnection Integrity (P1)

**Goal:** Fix combat response window progression, reconnection restoration, and WebSocket action delivery.

1. **Reconstruct Response Windows Upon Match Restore ([BSP-AUD-009](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-009)):**
   - In [engine/response_window.js](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js), rehydrate `windowStack` from `game.state.responseWindow` on startup if status is `OPEN` or `SUSPENDED`.
2. **Align BLOCK_DECLARATION with passPriority ([BSP-AUD-011](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-011)):**
   - Allow `PASS` in `BLOCK_DECLARATION` or map `game.passPriority()` to `PASS_BLOCK`.
3. **Ensure Mandatory Flash 2 Timing ([BSP-AUD-002](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-002), [BSP-AUD-012](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-012)):**
   - Ensure `handlePassBlock()` and `declareBlock()` transition to `FLASH_2` before resolving direct hit or BP compare.
4. **Fix Transport Ticket WebSocket Action Submissions ([BSP-AUD-010](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-010)):**
   - Preserve authenticated player context on WebSocket socket so actions can be submitted without raw tokens.
5. **Unify Candidate Calculation with Validator ([BSP-AUD-003](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-003)):**
   - Replace regex in `calculateFlashCandidates` with `validateFlashTiming()`.

---

### Phase R.3 — Keyword Engine Wiring & Test Remediation (P2)

**Goal:** Wire orphaned keywords into game execution and resolve failing tests on main.

1. **Wire Custom Keyword Methods into Resolver ([BSP-AUD-015](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-015), [BSP-AUD-016](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-016)):**
   - Connect the 40 orphaned methods into [engine/resolver.js](file:///c:/Users/namis/Downloads/BSP/engine/resolver.js) and combat lifecycle hooks.
2. **Fix Failing Tests on Main ([BSP-AUD-017](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-017)):**
   - Update tests in `keyword_registry.test.js` and `keywords_waves4_5_6.test.js` to properly handle response window progression before asserting block outcomes.
3. **Accurately Reclassify Keyword Support Matrix ([BSP-AUD-013](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-013), [BSP-AUD-014](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-014)):**
   - Formally document the 110 data stubs and 265 unhooked keywords in official documentation.

---

### Phase R.4 — Test Battery Modernization & CI Preservation (P3)

**Goal:** Full test corpus execution without overwriting audit history.

1. **Expand Master Test Runner to All 261 Test Suites ([BSP-AUD-018](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-018)):**
   - Upgrade runner to discover and run all 261 test files using isolated temporary SQLite databases.
2. **Prevent Overwriting Historical Phase Reports ([BSP-AUD-019](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-019)):**
   - Point runner output exclusively to `reports/latest/`.
3. **Deprecate DefaultPromptResolver Auto-Decisions in Integration Tests ([BSP-AUD-020](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/02_FINDINGS_REGISTER.md#bsp-aud-020)):**
   - Require explicit mock interaction providers in tests to verify genuine decision paths.
