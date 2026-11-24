# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 02. FORMAL FINDINGS REGISTER

This document establishes the official findings register for the Battle Spirits Eternal forensic audit.
All 21 findings are cataloged below with full 18-field forensic evidence, root causes, reproduction steps, and remediation criteria.

---

### Summary Table

| Finding ID | Title | Subsystem | Severity | Confidence | Reproducibility |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **BSP-AUD-001** | Response Window Action Authorization Bypass in Combat | `engine/session_manager.js` | **CRITICAL** | CONFIRMED | ALWAYS |
| **BSP-AUD-002** | Combat Lifecycle Response Window Premature Closure & Flash 2 Bypass | `engine/index.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-003** | Candidate Generation Divergence from Validation Rules | `engine/response_window.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-004** | Direct Engine Public API Surface Bypasses Participant Authority | `engine/index.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-005** | PromptManager Validation Error Reason Discarded | `engine/index.js` | **MEDIUM** | CONFIRMED | ALWAYS |
| **BSP-AUD-006** | Arbitrary Unit Injection and Core Minting via SUMMON Action | `engine/session_manager.js` | **CRITICAL** | CONFIRMED | ALWAYS |
| **BSP-AUD-007** | Unauthenticated Arbitrary Forward Proxy / Server-Side Request Forgery | `server.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-008** | Sensitive File and Database Disclosure via Web Root Static Handler | `server.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-009** | Complete Response Window Loss Upon Session Restoration / Reconnect | `engine/response_window.js, engine/session_manager.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-010** | WebSocket Single-Use Transport Ticket Action Submission Failure | `engine/websocket_server.js` | **MEDIUM** | CONFIRMED | ALWAYS |
| **BSP-AUD-011** | BLOCK_DECLARATION Window Rejection of game.passPriority | `engine/response_window.js, engine/index.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-012** | Unconditional Flash 2 Step Skip on No-Block | `engine/response_window.js` | **MEDIUM** | CONFIRMED | ALWAYS |
| **BSP-AUD-013** | 265 of 364 Registered Runtime Keywords Are Inactive Stubs | `engine/keywords/wave1.js - wave6.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-014** | 110 Keywords Completely Lack Executable Code | `engine/keywords/wave1.js - wave6.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-015** | 40 Keyword Custom Methods Disconnected and Orphaned from Engine Flow | `engine/keywords/wave1.js - wave6.js, engine/flow.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-016** | Game Keywords Registry Object Disconnected from Engine Execution | `engine/index.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-017** | Failing Keyword Unit Tests on Main Branch | `tests/keyword_registry.test.js, tests/keywords_waves4_5_6.test.js` | **HIGH** | CONFIRMED | ALWAYS |
| **BSP-AUD-018** | Master Verification Runner Omits 71.6% of Test Corpus | `scripts/run_master_verification.mjs` | **MEDIUM** | CONFIRMED | ALWAYS |
| **BSP-AUD-019** | Master Runner Overwrites Historical Report Directories | `scripts/run_master_verification.mjs` | **MEDIUM** | CONFIRMED | ALWAYS |
| **BSP-AUD-020** | DefaultPromptResolver Silently Auto-Decides Critical Combat Choices | `engine/resolver.js, engine/index.js` | **MEDIUM** | CONFIRMED | ALWAYS |
| **BSP-AUD-021** | Failed PLAY_CARD Actions Committing to Database Ledger | `engine/session_manager.js` | **MEDIUM** | CONFIRMED | ALWAYS |

---

### [BSP-AUD-001] Response Window Action Authorization Bypass in Combat

- **Finding ID:** `BSP-AUD-001`
- **Subsystem:** `engine/session_manager.js`
- **Severity:** **CRITICAL**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/session_manager.js](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js)
- **Line Numbers:** `831-842`
- **Historical Claim Status:** **CONTRADICTED (Phase M.2 & M.3 claimed strict action authority)**
- **Automated Test Status:** **REPRODUCED (No existing regression test prevented this)**

#### Vulnerability / Defect Description
During active combat response windows (FLASH_1, BLOCK_DECLARATION, FLASH_2), turnControlledTypes authorization checks are gated behind if (!isWinActive), allowing unauthenticated or non-priority players to execute PLAY_CARD, SUMMON, SET_BURST, and USE_CORE while combat is in progress.

#### Root Cause Analysis
SessionManager conditions turn-controlled action enforcement on !isWinActive without adding PLAY_CARD, SUMMON, SET_BURST, and USE_CORE to responseWindowActions or checking active player priority during active windows.

#### Attack Vector or Failure Trigger
Submitting a SUMMON, PLAY_CARD, or USE_CORE action via submitPlayerAction while another player has priority in FLASH_1 or BLOCK_DECLARATION.

#### Reproduction Steps
1. Alice declares attack, opening FLASH_1 with Bob holding priority. 2. Alice immediately submits PLAY_CARD or SUMMON. 3. Action succeeds and executes onto field.

#### Impact Assessment
Complete breakdown of combat step progression; unauthorized out-of-turn summoning and card casting during opponent response windows.

#### Proposed Remediation
Reorder authorization logic in session_manager.js so that during active response windows, all actions outside responseWindowActions and INTERACTION_RESPONSE are strictly rejected with RESPONSE_WINDOW_ACTIVE.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW (Protects engine turn and window progression)
- **Acceptance Criteria:** Submitting non-window actions during active response windows must fail with 403 / RESPONSE_WINDOW_ACTIVE regardless of caller.

---

### [BSP-AUD-002] Combat Lifecycle Response Window Premature Closure & Flash 2 Bypass

- **Finding ID:** `BSP-AUD-002`
- **Subsystem:** `engine/index.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
- **Line Numbers:** `1083-1091, 1232-1237`
- **Historical Claim Status:** **CONTRADICTED (Phase M.3 claimed mandatory Flash 2 timing)**
- **Automated Test Status:** **REPRODUCED (Causes 4 test failures in keyword_registry.test.js)**

#### Vulnerability / Defect Description
Direct calls to game.declareBlock() and game.resolveDirectHit() close active response windows and set combat stage directly to BP_COMPARE or END without proper window lifecycle transitions, completely skipping Flash 2 and defender interaction.

#### Root Cause Analysis
engine/index.js contains legacy direct combat transition code that closes active windows and overrides stage rather than driving through TimingWindowManager.

#### Attack Vector or Failure Trigger
Calling game.declareBlock() or game.resolveDirectHit() directly on the engine instance.

#### Reproduction Steps
1. Initiate combat. 2. Call game.declareBlock(blockerId). 3. Notice stage becomes BP_COMPARE and window is closed without opening FLASH_2.

#### Impact Assessment
Flash 2 is completely bypassed during programmatic or direct block declarations; defensive cards cannot be played after block declaration.

#### Proposed Remediation
Route all combat state transitions through TimingWindowManager.handleBlockDeclaration() and open FLASH_2 before BP comparison.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** MEDIUM (Requires updating tests that call declareBlock directly during FLASH_1)
- **Acceptance Criteria:** Declaring a block must always transition combat stage to FLASH_2 and grant Defender priority 1 before BP comparison.

---

### [BSP-AUD-003] Candidate Generation Divergence from Validation Rules

- **Finding ID:** `BSP-AUD-003`
- **Subsystem:** `engine/response_window.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/response_window.js](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js), [engine/flash_timing.js](file:///c:/Users/namis/Downloads/BSP/engine/flash_timing.js)
- **Line Numbers:** `1015-1100`
- **Historical Claim Status:** **CONTRADICTED (Phase M.3.1 claimed unified Flash candidate generation)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
ResponseWindowManager.calculateFlashCandidates duplicates timing checks using an ad-hoc English regex instead of calling flash_timing.js:validateFlashTiming(). Japanese-script cards restricted to opponent attack step are offered as legal candidates to the attacking player, but subsequently rejected upon execution.

#### Root Cause Analysis
Failure to use the single source of truth (validateFlashTiming) in candidate generation.

#### Attack Vector or Failure Trigger
Player inspecting legalResponseCandidates during FLASH_1 sees cards that cannot be legally played.

#### Reproduction Steps
1. Give attacker a card with effect "フラッシュ (相手のアタックステップ)". 2. Inspect candidates in FLASH_1; card is offered. 3. Submitting card fails with OPPONENT_ATTACK_STEP_ONLY.

#### Impact Assessment
Desynchronization between UI candidate offering and engine execution validation; player confusion and rejected action errors.

#### Proposed Remediation
Replace calculateFlashCandidates ad-hoc logic with calls to validateFlashTiming().

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW (Ensures candidate generation strictly matches validation rules)
- **Acceptance Criteria:** All candidates returned by calculateFlashCandidates must pass validateFlashTiming without exception.

---

### [BSP-AUD-004] Direct Engine Public API Surface Bypasses Participant Authority

- **Finding ID:** `BSP-AUD-004`
- **Subsystem:** `engine/index.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
- **Line Numbers:** `344-350, 1000-1150`
- **Historical Claim Status:** **PARTIALLY VERIFIED (Enforced in SessionManager, absent in engine core)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
Public methods on game (declareAttack, declareBlock, resolveDirectHit, playCard, advanceStep) perform zero caller authorization checks. Authority is enforced solely at the SessionManager boundary. Any direct internal caller, test, or engine consumer completely bypasses participant identity and turn authority.

#### Root Cause Analysis
Engine core was originally designed for single-process local play; multi-tenant authority was layered externally in SessionManager rather than inside the engine boundary.

#### Attack Vector or Failure Trigger
Direct invocation of game.* methods in integration tests or internal scripts.

#### Reproduction Steps
1. Call game.declareAttack(stackId, "opponent") during player turn. 2. Attack succeeds without validating caller authorization.

#### Impact Assessment
Lack of defense-in-depth; potential for server components or plugins to trigger state changes bypassing session locks.

#### Proposed Remediation
Accept optional authContext in engine core methods or validate authenticated player identity against game.state.activePlayer.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** MEDIUM (Requires updating internal test harnesses)
- **Acceptance Criteria:** Engine core methods must reject actions when caller is not the authorized participant.

---

### [BSP-AUD-005] PromptManager Validation Error Reason Discarded

- **Finding ID:** `BSP-AUD-005`
- **Subsystem:** `engine/index.js`
- **Severity:** **MEDIUM**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
- **Line Numbers:** `344-350`
- **Historical Claim Status:** **PARTIALLY VERIFIED**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
In submitInteractionResponse(), when usePromptManager is true, promptManager.resolve() returns a boolean, discarding result.reason and result.code from interactionController.respond().

#### Root Cause Analysis
submitInteractionResponse returns { success: Boolean(res), interactionId } without preserving detailed error reasons.

#### Attack Vector or Failure Trigger
Submitting an invalid interaction response in PromptManager mode.

#### Reproduction Steps
1. Submit invalid interaction response with usePromptManager: true. 2. Result lacks failure reason.

#### Impact Assessment
Clients receive generic false without explanation for why an interaction was rejected.

#### Proposed Remediation
Preserve promptManager resolution details and error reasons in return object.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** submitInteractionResponse must return detailed error codes on failure.

---

### [BSP-AUD-006] Arbitrary Unit Injection and Core Minting via SUMMON Action

- **Finding ID:** `BSP-AUD-006`
- **Subsystem:** `engine/session_manager.js`
- **Severity:** **CRITICAL**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/session_manager.js](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js)
- **Line Numbers:** `954-962`
- **Historical Claim Status:** **CONTRADICTED (Phase M.2 claimed strict action validation)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
Any authenticated player can submit an action of type SUMMON with arbitrary card payload and core count. SessionManager directly instantiates the card onto the field refreshed and mints cores out of nowhere, completely bypassing hand zone checks, cost payment, and core conservation laws.

#### Root Cause Analysis
SUMMON action branch in session_manager.js directly constructs a new card instance from client-supplied JSON and pushes it to p.field with client-specified cores.

#### Attack Vector or Failure Trigger
Client sending { type: "SUMMON", card: { name: "Hacked", bp: 999999 }, cores: 100 } over WebSocket or HTTP.

#### Reproduction Steps
1. Connect to match. 2. Submit action { type: "SUMMON", card: { name: "Cheat" }, cores: 50 }. 3. Unit is spawned on field with 50 newly minted cores.

#### Impact Assessment
Catastrophic game integrity failure; arbitrary card creation and unlimited core generation in persistent multiplayer matches.

#### Proposed Remediation
Remove the client-facing SUMMON action type or restrict it exclusively to internal engine effect resolution; player summons must use PLAY_CARD referencing existing cards in hand.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW (Legitimate players use PLAY_CARD)
- **Acceptance Criteria:** External SUMMON actions must be rejected; card summons must strictly originate from hand and consume reserve cores.

---

### [BSP-AUD-007] Unauthenticated Arbitrary Forward Proxy / Server-Side Request Forgery

- **Finding ID:** `BSP-AUD-007`
- **Subsystem:** `server.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [server.js](file:///c:/Users/namis/Downloads/BSP/server.js)
- **Line Numbers:** `525-585`
- **Historical Claim Status:** **UNVERIFIED (Never audited in previous phases)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
Endpoint /api/proxy-image?url=... is an unauthenticated open forward proxy without domain allowlists, private IP filtering, or port restrictions. Any external caller can trigger requests to localhost, internal network services, and cloud metadata endpoints.

#### Root Cause Analysis
HTTP client blindly fetches targetUrl without validating protocol, hostname, or IP address against an allowlist.

#### Attack Vector or Failure Trigger
HTTP GET /api/proxy-image?url=http://169.254.169.254/latest/meta-data/ or http://localhost:8080/internal.

#### Reproduction Steps
1. Send GET request to /api/proxy-image?url=http://127.0.0.1:3000/api/sessions/health. 2. Server proxies the response.

#### Impact Assessment
Server-Side Request Forgery (SSRF); internal port scanning, access to cloud metadata, and internal network reconnaissance.

#### Proposed Remediation
Enforce strict domain allowlist (e.g. battle-spirits.fandom.com, official bandai domains) and reject private/loopback/link-local IP addresses.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW (Only legitimate card artwork domains need to be proxied)
- **Acceptance Criteria:** Requests to localhost, private IPs, or non-whitelisted domains must return 403 Forbidden.

---

### [BSP-AUD-008] Sensitive File and Database Disclosure via Web Root Static Handler

- **Finding ID:** `BSP-AUD-008`
- **Subsystem:** `server.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [server.js](file:///c:/Users/namis/Downloads/BSP/server.js)
- **Line Numbers:** `1340-1375`
- **Historical Claim Status:** **CONTRADICTED (Phase M.2 claimed full credential isolation)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
Static file handler in server.js serves files from __dirname without blocking sensitive file extensions, dotfiles, or database files. Unauthenticated callers can directly download battle_spirits.db (45MB database containing session tokens and player states) and .git/config.

#### Root Cause Analysis
No blacklist or whitelist for served file extensions; dotfiles and database files are served as application/octet-stream.

#### Attack Vector or Failure Trigger
HTTP GET /battle_spirits.db or HTTP GET /.git/config.

#### Reproduction Steps
1. Send GET request to http://localhost:3000/battle_spirits.db. 2. Server streams the complete 45MB SQLite database.

#### Impact Assessment
Complete exposure of all active matches, player authentication tokens, session history, and version control metadata.

#### Proposed Remediation
Restrict static file serving strictly to a dedicated public/ or ui/ directory, or explicitly reject requests for .db, .git, .env, and hidden dotfiles.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** Requests for battle_spirits.db, .git, or files outside public assets must return 404/403.

---

### [BSP-AUD-009] Complete Response Window Loss Upon Session Restoration / Reconnect

- **Finding ID:** `BSP-AUD-009`
- **Subsystem:** `engine/response_window.js, engine/session_manager.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/response_window.js](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js), [engine/session_manager.js](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js)
- **Line Numbers:** `55-60, 1040-1080`
- **Historical Claim Status:** **CONTRADICTED (Phase M.1 & M.3 claimed seamless reconnection during active windows)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
ResponseWindowManager initializes this.windowStack = [] in its constructor and never re-populates it from restoredState.responseWindow. Restoring a match from SQLite (or reconnecting after memory eviction) wipes active combat windows, soft-locking the match in COMBAT_ALREADY_IN_PROGRESS while passPriority fails with NO_ACTIVE_RESPONSE_WINDOW.

#### Root Cause Analysis
ResponseWindowManager lacks state rehydration logic to reconstruct windowStack from deserialized state.responseWindow.

#### Attack Vector or Failure Trigger
Server restart or match reload from database while FLASH_1, BLOCK_DECLARATION, or FLASH_2 is active.

#### Reproduction Steps
1. Declare attack opening FLASH_1. 2. Save snapshot and clear memory cache. 3. Call restoreMatch(). 4. getCurrentWindow() returns null; combat is deadlocked.

#### Impact Assessment
Any reconnection during combat breaks response window progression and permanently freezes the match.

#### Proposed Remediation
In ResponseWindowManager constructor or game initialization, inspect game.state.responseWindow and push it onto this.windowStack if status is OPEN or SUSPENDED.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW (Restores intended persistent window behavior)
- **Acceptance Criteria:** Restored matches must preserve getCurrentWindow(), windowType, and priority player exactly as before serialization.

---

### [BSP-AUD-010] WebSocket Single-Use Transport Ticket Action Submission Failure

- **Finding ID:** `BSP-AUD-010`
- **Subsystem:** `engine/websocket_server.js`
- **Severity:** **MEDIUM**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/websocket_server.js](file:///c:/Users/namis/Downloads/BSP/engine/websocket_server.js)
- **Line Numbers:** `238-245`
- **Historical Claim Status:** **CONTRADICTED (Phase M.2 claimed ticket-based WS connectivity)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
When a client connects over WebSocket using a single-use transport ticket (ticketParam), authToken is undefined. Subsequent WebSocket heartbeats and action submissions fail with AUTHENTICATION_REQUIRED because submitPlayerAction requires authToken.

#### Root Cause Analysis
WebSocket connection handler redeems ticket to determine viewerSide, but does not associate or pass the ticket credentials to submitPlayerAction or recordHeartbeat.

#### Attack Vector or Failure Trigger
Client connecting via short-lived ticket and attempting to submit actions over WS.

#### Reproduction Steps
1. Issue transport ticket. 2. Connect WS with ?ticket=... 3. Send action message. 4. WS returns AUTHENTICATION_REQUIRED error.

#### Impact Assessment
Transport ticket flow cannot be used for bidirectional WebSocket gameplay; clients are forced to pass raw auth tokens in connection URLs.

#### Proposed Remediation
Store authenticated playerId and session credentials on the WebSocket connection context and pass them to submitPlayerAction.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** WebSocket clients authenticated via transport tickets must be able to submit actions and heartbeats without raw auth tokens.

---

### [BSP-AUD-011] BLOCK_DECLARATION Window Rejection of game.passPriority

- **Finding ID:** `BSP-AUD-011`
- **Subsystem:** `engine/response_window.js, engine/index.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/response_window.js](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js), [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
- **Line Numbers:** `220-225, 1072-1080`
- **Historical Claim Status:** **CONTRADICTED (Phase M.3 claimed unified passPriority handling across all windows)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
BLOCK_DECLARATION response window only registers DECLARE_BLOCK and PASS_BLOCK as legal actions. game.passPriority() hardcodes { action: "PASS" }, which is rejected with ACTION_NOT_ELIGIBLE_IN_WINDOW. The engine provides no passBlock() or declineBlock() public method.

#### Root Cause Analysis
Mismatch between game.passPriority action payload and BLOCK_DECLARATION legal action definitions.

#### Attack Vector or Failure Trigger
Calling game.passPriority() during BLOCK_DECLARATION window.

#### Reproduction Steps
1. Advance combat past Flash 1 to BLOCK_DECLARATION. 2. Call game.passPriority("opponent"). 3. Action rejected with ACTION_NOT_ELIGIBLE_IN_WINDOW.

#### Impact Assessment
Defending player cannot decline block via standard passPriority API; combat becomes stuck unless client submits undocumented PASS_BLOCK payload.

#### Proposed Remediation
Update game.passPriority to map to PASS_BLOCK when the active window is BLOCK_DECLARATION, or add PASS to BLOCK_DECLARATION eligible actions.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** Calling game.passPriority during BLOCK_DECLARATION must cleanly decline block and transition to direct hit / Flash 2.

---

### [BSP-AUD-012] Unconditional Flash 2 Step Skip on No-Block

- **Finding ID:** `BSP-AUD-012`
- **Subsystem:** `engine/response_window.js`
- **Severity:** **MEDIUM**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/response_window.js](file:///c:/Users/namis/Downloads/BSP/engine/response_window.js)
- **Line Numbers:** `724`
- **Historical Claim Status:** **PARTIALLY VERIFIED (Implemented by design but violates official rules format)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
In handlePassBlock(), declining to block unconditionally calls resolveDirectHit(), skipping Flash 2 entirely. Official Battle Spirits rules grant both players Flash Timing 2 after block declaration regardless of whether a block was declared.

#### Root Cause Analysis
Hardcoded direct hit execution in handlePassBlock() with comment "SKIPS FLASH 2! Proceeds directly to Direct Hit!".

#### Attack Vector or Failure Trigger
Defender declines block; attacker or defender cannot activate combat-ending or damage-modifying Flash magic in Flash 2.

#### Reproduction Steps
1. Defender passes block. 2. Direct hit resolves immediately without opening FLASH_2.

#### Impact Assessment
Rule deviation from official Battle Spirits rules; players denied opportunity to respond before life reduction.

#### Proposed Remediation
Open FLASH_2 window after PASS_BLOCK and resolve direct hit only after FLASH_2 closes.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** MEDIUM (Changes combat window sequence for unblocked attacks)
- **Acceptance Criteria:** Declining block must transition to FLASH_2 before resolving direct hit.

---

### [BSP-AUD-013] 265 of 364 Registered Runtime Keywords Are Inactive Stubs

- **Finding ID:** `BSP-AUD-013`
- **Subsystem:** `engine/keywords/wave1.js - wave6.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/keywords/wave1.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave1.js), [engine/keywords/wave2.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave2.js), [engine/keywords/wave3.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave3.js), [engine/keywords/wave4.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave4.js), [engine/keywords/wave5.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave5.js), [engine/keywords/wave6.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave6.js)
- **Line Numbers:** `All wave registration files`
- **Historical Claim Status:** **CONTRADICTED (Phase W.1 & W.2 claimed 364 implemented runtime keywords)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
Out of 364 registered runtime keywords, 265 (72.8%) possess completely empty hooks objects (hooks: {}). Only 99 keywords have any registered lifecycle hooks.

#### Root Cause Analysis
Mass generation of keyword stub definitions to satisfy registry count metrics without implementing lifecycle mechanics.

#### Attack Vector or Failure Trigger
Cards possessing any of these 265 keywords triggering in battle.

#### Reproduction Steps
1. Register all keywords. 2. Filter registry entries with Object.keys(k.hooks).length === 0. 3. Count is 265.

#### Impact Assessment
Keywords appear in registry and card text but do nothing during gameplay.

#### Proposed Remediation
Implement real lifecycle hooks or classify unhooked keywords as Stubs / Unimplemented.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW (Accurate classification)
- **Acceptance Criteria:** Keyword support matrix must accurately reflect 265 keywords as lacking active hooks.

---

### [BSP-AUD-014] 110 Keywords Completely Lack Executable Code

- **Finding ID:** `BSP-AUD-014`
- **Subsystem:** `engine/keywords/wave1.js - wave6.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/keywords/wave1.js - wave6.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave1.js - wave6.js)
- **Line Numbers:** `Various`
- **Historical Claim Status:** **CONTRADICTED**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
110 keywords in the runtime registry have neither hooks nor any executable methods. They are pure data objects containing only id, name, and wave properties.

#### Root Cause Analysis
Placeholder registration of keywords without executable implementation.

#### Attack Vector or Failure Trigger
Attempting to resolve or query mechanics for any of the 110 stub keywords.

#### Reproduction Steps
1. Inspect all keyword objects in registry. 2. 110 objects contain zero functions.

#### Impact Assessment
False claims of keyword implementation; 110 keywords are purely declarative placeholders.

#### Proposed Remediation
Document 110 keywords as Data-Only Stubs in support matrix.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** Report accurately separates executable keywords from data-only placeholders.

---

### [BSP-AUD-015] 40 Keyword Custom Methods Disconnected and Orphaned from Engine Flow

- **Finding ID:** `BSP-AUD-015`
- **Subsystem:** `engine/keywords/wave1.js - wave6.js, engine/flow.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/keywords/wave1.js - wave6.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/wave1.js - wave6.js), [engine/flow.js](file:///c:/Users/namis/Downloads/BSP/engine/flow.js), [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
- **Line Numbers:** `Various`
- **Historical Claim Status:** **CONTRADICTED (Phase W.2 claimed verified runtime mechanics)**
- **Automated Test Status:** **REPRODUCED (Tests mock invocations directly)**

#### Vulnerability / Defect Description
40 out of 46 custom methods defined on keywords (executeWhirlwind, executeTrueAwaken, executeSoulDrive, executeUTrigger, executeBunshin, executeSeal, etc.) are never invoked anywhere in engine/index.js, flow.js, or resolver.js. They exist solely to be called by isolated synthetic unit tests.

#### Root Cause Analysis
Methods were implemented on keyword objects but never wired into the engine's ability resolution pipeline or timing windows.

#### Attack Vector or Failure Trigger
Playing real cards with Whirlwind, Soul Drive, U-Trigger, or Bunshin in an actual game.

#### Reproduction Steps
1. Grep entire engine/ directory for calls to executeWhirlwind or executeSoulDrive. 2. Zero callers found outside tests.

#### Impact Assessment
Orphaned implementations: tests pass because tests call the functions directly, but in an actual match the cards do nothing.

#### Proposed Remediation
Wire keyword execution methods into resolver.js and TimingWindowManager so abilities invoke them during real gameplay.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** MEDIUM
- **Acceptance Criteria:** Playing a card with Soul Drive or Whirlwind during an actual match must execute the keyword method.

---

### [BSP-AUD-016] Game Keywords Registry Object Disconnected from Engine Execution

- **Finding ID:** `BSP-AUD-016`
- **Subsystem:** `engine/index.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
- **Line Numbers:** `316, 340`
- **Historical Claim Status:** **CONTRADICTED**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
game.keywords is instantiated at game creation (line 316) and attached to game (line 340), but is never referenced anywhere in engine/. Keywords like Clash, Curse, and Burst are resolved via hardcoded ad-hoc branches in engine/index.js rather than the registry.

#### Root Cause Analysis
Ad-hoc keyword handling was added directly into combat flow instead of querying game.keywords.

#### Attack Vector or Failure Trigger
Modifying keyword definitions in registry has zero effect on engine behavior.

#### Reproduction Steps
1. Grep engine/ for game.keywords. 2. Zero usages found.

#### Impact Assessment
Architectural fragmentation; keyword registry is largely a parallel data structure ignored by the core engine.

#### Proposed Remediation
Refactor engine/index.js combat hooks to query game.keywords dynamically.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** MEDIUM
- **Acceptance Criteria:** Combat flow must query game.keywords rather than hardcoded string checks.

---

### [BSP-AUD-017] Failing Keyword Unit Tests on Main Branch

- **Finding ID:** `BSP-AUD-017`
- **Subsystem:** `tests/keyword_registry.test.js, tests/keywords_waves4_5_6.test.js`
- **Severity:** **HIGH**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [tests/keyword_registry.test.js](file:///c:/Users/namis/Downloads/BSP/tests/keyword_registry.test.js), [tests/keywords_waves4_5_6.test.js](file:///c:/Users/namis/Downloads/BSP/tests/keywords_waves4_5_6.test.js)
- **Line Numbers:** `keyword_registry: 75, 266, 298, 329; waves4_5_6: 413`
- **Historical Claim Status:** **CONTRADICTED (Claimed 57/57 dedicated keyword tests passing)**
- **Automated Test Status:** **FAILING (5 tests failing on main)**

#### Vulnerability / Defect Description
4 tests in tests/keyword_registry.test.js (Windstorm, Ultra Holy Life, True-Curse, Fierce Windstorm) and 1 test in tests/keywords_waves4_5_6.test.js (Ultra Awaken) currently fail on main when executed with node --test.

#### Root Cause Analysis
Tests were written assuming synchronous block declarations without response windows, but subsequent changes added FLASH_TIMING_NOT_CLOSED guards, causing declareBlock() calls in tests to fail silently.

#### Attack Vector or Failure Trigger
Running node --test tests/keyword_registry.test.js.

#### Reproduction Steps
1. Run node --test tests/keyword_registry.test.js. 2. Observe 4 test failures.

#### Impact Assessment
Core regression suite has broken tests on main; keyword mechanics verification is compromised.

#### Proposed Remediation
Update test cases to pass priority before declaring block or update declareBlock to handle test window progression.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW (Fixes broken tests)
- **Acceptance Criteria:** All tests in keyword_registry.test.js and keywords_waves4_5_6.test.js must pass cleanly.

---

### [BSP-AUD-018] Master Verification Runner Omits 71.6% of Test Corpus

- **Finding ID:** `BSP-AUD-018`
- **Subsystem:** `scripts/run_master_verification.mjs`
- **Severity:** **MEDIUM**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [scripts/run_master_verification.mjs](file:///c:/Users/namis/Downloads/BSP/scripts/run_master_verification.mjs)
- **Line Numbers:** `Entire script`
- **Historical Claim Status:** **CONTRADICTED (Claimed comprehensive test coverage)**
- **Automated Test Status:** **VERIFIED**

#### Vulnerability / Defect Description
scripts/run_master_verification.mjs executes only 74 out of 261 test files in tests/ (omitting 187 test suites and over 1,100 test cases). Running this script leaves nearly three quarters of the project untested.

#### Root Cause Analysis
Runner hardcodes a curated list of suites and excludes the vast majority of domain tests.

#### Attack Vector or Failure Trigger
Relying on master runner as evidence of complete project health.

#### Reproduction Steps
1. Compare suites in run_master_verification.mjs (74) against fs.readdirSync("tests") (261). 2. 187 files omitted.

#### Impact Assessment
False sense of project verification; regressions in the 187 omitted test files go completely undetected.

#### Proposed Remediation
Expand runner to discover and run all test files using an isolated database environment.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** Master verification must cover all 261 test files.

---

### [BSP-AUD-019] Master Runner Overwrites Historical Report Directories

- **Finding ID:** `BSP-AUD-019`
- **Subsystem:** `scripts/run_master_verification.mjs`
- **Severity:** **MEDIUM**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [scripts/run_master_verification.mjs](file:///c:/Users/namis/Downloads/BSP/scripts/run_master_verification.mjs)
- **Line Numbers:** `30-45`
- **Historical Claim Status:** **CONTRADICTED**
- **Automated Test Status:** **VERIFIED BY CODE INSPECTION**

#### Vulnerability / Defect Description
scripts/run_master_verification.mjs defines OUT_DIRS containing historical phase directories (reports/phase_m3_response_windows, reports/phase_m1, reports/phase4d) and writes results into them, destroying historical audit records.

#### Root Cause Analysis
Runner was designed to update multiple legacy report folders simultaneously.

#### Attack Vector or Failure Trigger
Executing node scripts/run_master_verification.mjs.

#### Reproduction Steps
1. Inspect OUT_DIRS in script. 2. Observe paths to past phase report folders.

#### Impact Assessment
Violation of audit immutability and report preservation.

#### Proposed Remediation
Restrict runner outputs to a dedicated reports/latest/ or phase-specific directory.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** Running test runners must never modify historical report directories.

---

### [BSP-AUD-020] DefaultPromptResolver Silently Auto-Decides Critical Combat Choices

- **Finding ID:** `BSP-AUD-020`
- **Subsystem:** `engine/resolver.js, engine/index.js`
- **Severity:** **MEDIUM**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/resolver.js](file:///c:/Users/namis/Downloads/BSP/engine/resolver.js), [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
- **Line Numbers:** `298-312 (index.js), 759-800 (resolver.js)`
- **Historical Claim Status:** **PARTIALLY VERIFIED**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
Games initialized without interactive: true or automatedProvider fall back to DefaultPromptResolver, which automatically selects accepted: true, triggers bursts, passes Flash, and declines blocks without player agency.

#### Root Cause Analysis
DefaultPromptResolver provides artificial automatic choices to allow headless unit tests to run without interaction handlers.

#### Attack Vector or Failure Trigger
Running matches without explicit interactive: true flag.

#### Reproduction Steps
1. createGame() without interactive: true. 2. Observe all prompts resolve automatically without pausing.

#### Impact Assessment
Tests pass automatically because engine makes choices on behalf of players; hides missing player prompt handling.

#### Proposed Remediation
Require explicit interactive mode or mock interaction controller for all test executions.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** All interactive choices must require explicit interaction resolution.

---

### [BSP-AUD-021] Failed PLAY_CARD Actions Committing to Database Ledger

- **Finding ID:** `BSP-AUD-021`
- **Subsystem:** `engine/session_manager.js`
- **Severity:** **MEDIUM**
- **Confidence:** **CONFIRMED**
- **Reproducibility:** **ALWAYS**
- **File Paths:** [engine/session_manager.js](file:///c:/Users/namis/Downloads/BSP/engine/session_manager.js)
- **Line Numbers:** `946-953`
- **Historical Claim Status:** **CONTRADICTED (Phase M.2 claimed failed actions are never committed)**
- **Automated Test Status:** **REPRODUCED**

#### Vulnerability / Defect Description
When game.playCard() fails and returns { success: false, reason: ... }, session_manager.js marks actionResult = { success: true, played: cardId, result: res }, committing the failed action to the database transaction and ledger.

#### Root Cause Analysis
PLAY_CARD execution block wraps the return value in success: true without checking res.success.

#### Attack Vector or Failure Trigger
Player submitting PLAY_CARD with insufficient cores.

#### Reproduction Steps
1. Submit PLAY_CARD without enough cores. 2. actionResult is recorded as success: true in event ledger.

#### Impact Assessment
Event ledger and database record failed card plays as successful actions, corrupting audit history.

#### Proposed Remediation
Check res.success and throw an error if false, triggering in-memory rollback and preventing commit.

#### Regression Risk & Verification Acceptance Criteria
- **Regression Risk:** LOW
- **Acceptance Criteria:** Failed card plays must throw an error and never be recorded as successful in the ledger.

---

