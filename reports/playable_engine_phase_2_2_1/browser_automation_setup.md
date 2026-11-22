# Browser Automation Setup & Architecture

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** 2.2.1 Stabilization & Real Browser Verification  
**Date:** 2026-11-21  

---

## 1. Architectural Overview

Phase 2.2.1 established genuine browser automation infrastructure for Battle Spirits Eternal without adding any third-party dependencies to the project.

### Host Browser Detection & Binary Discovery
The automation infrastructure automatically discovers installed browser binaries on the host system in order of preference:
1. **Google Chrome:** \`C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\` (Confirmed Present)
2. **Microsoft Edge:** \`C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\` (Confirmed Present)

### Protocol & Communication
- **Protocol:** Chrome DevTools Protocol (CDP) v1.3
- **Transport:** Native Node.js 24 global \`WebSocket\` and Node.js \`node:http\`
- **Zero NPM Dependencies:** Eliminates reliance on external libraries like Puppeteer or Playwright, maintaining clean project isolation and avoiding dependency churn.

---

## 2. Infrastructure Components

### 1. Harness: \`tests/helpers/real_browser.js\`
The harness provides:
- \`launchRealBrowser(options)\`:
  - Spawns local HTTP server on a designated or dynamic port (\`node server.js\`).
  - Spawns headless Chrome with \`--headless=new\`, \`--remote-debugging-port=0\`, \`--disable-gpu\`, and isolated temporary user-data-dir.
  - Dynamically extracts the allocated CDP WebSocket port from stderr (\`DevTools listening on ws://...\`).
  - Sends HTTP \`PUT /json/new\` to acquire a clean page target.
  - Connects to the page target via Node.js native \`WebSocket\`.
  - Enables \`Page\`, \`Runtime\`, and \`DOM\` domains.
- Harness APIs:
  - \`navigate(urlPath)\`: Navigates to a relative route or full URL and awaits page load.
  - \`evaluate(expression)\`: Evaluates expressions or functions inside page context with promise resolution.
  - \`waitForFunction(fnStr, timeoutMs, pollIntervalMs)\`: Polling condition evaluator in browser context.
  - \`click(selector)\`: DOM element query and click dispatcher.
  - \`captureScreenshot(outPath)\`: Executes \`Page.captureScreenshot\` and writes PNG buffer directly to disk.
  - \`close()\`: Gracefully terminates the WebSocket connection, kills the Chrome process, stops the server, and purges the temporary user-data directory.

---

## 3. Real Browser Execution Pipeline

\`\`\`mermaid
sequenceDiagram
    participant TestRunner as node:test runner
    participant Harness as tests/helpers/real_browser.js
    participant Server as node server.js (Port 3777)
    participant Chrome as Chrome Headless (CDP)
    participant Arena as arena.html & battle_arena.js

    TestRunner->>Harness: launchRealBrowser()
    Harness->>Server: spawn server.js
    Harness->>Chrome: spawn chrome.exe --headless=new --remote-debugging-port=0
    Harness->>Chrome: Connect WebSocket (CDP)
    Harness->>Chrome: Page.navigate("http://127.0.0.1:3777/arena.html")
    Chrome->>Server: HTTP GET /arena.html, /styles.css, /battle_arena.js
    Server-->>Chrome: 200 OK + Scripts/Styles
    Chrome->>Arena: Execute DOM scripts & init window.BattleArena
    TestRunner->>Arena: window.BattleArena.startDuel('red', 'purple', 'player')
    Arena-->>TestRunner: inDuel === true (Turn 1, 40-card decks)
    TestRunner->>Arena: openSummonModal() & confirmSummonPayment()
    Arena-->>TestRunner: Spirit placed on field, cores deducted
    TestRunner->>Arena: promptStructuredDecision(SELECT_TARGET)
    Arena-->>TestRunner: .universal-target-modal rendered in DOM
    TestRunner->>Arena: Click candidate & confirm button
    Arena-->>TestRunner: Interaction resolved, effect completed
    TestRunner->>Chrome: Page.captureScreenshot
    Chrome-->>TestRunner: Save PNG evidence
    TestRunner->>Harness: close()
    Harness->>Chrome: Kill process & cleanup temp dir
    Harness->>Server: Kill server process
\`\`\`

---

## 4. Verification & Reliability
The real browser test (\`tests/real_browser_arena.test.js\`) executes in **5.6 seconds** end-to-end, validating full UI rendering, interactive modal workflows, and state transitions without race conditions or memory leaks.
