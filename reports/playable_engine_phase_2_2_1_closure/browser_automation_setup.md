# Browser Automation Setup (Phase 2.2.1 Closure)

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 2.2.1 Corrective Closure  
**Date:** 2026-11-21  
**Module:** [tests/helpers/real_browser.js](file:///C:/Users/namis/Downloads/BSP/tests/helpers/real_browser.js)

---

## 1. Zero-Dependency CDP Architecture

The browser automation harness utilizes the native WebSocket client built into Node.js (v24.16.0) to communicate directly with Google Chrome via the Chrome DevTools Protocol (CDP).

This eliminates heavy external dependencies (such as Puppeteer, Playwright, or Selenium) while providing native control over page lifecycle, DOM inspection, JavaScript evaluation, user interaction emulation, and screenshot capture.

### Key Features
1. **Dynamic Executable Discovery:**
   - Automatically probes standard system paths on Windows, macOS, and Linux:
     - Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`, `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`, `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
     - Linux: `/usr/bin/google-chrome`, `/usr/bin/chromium`, `/usr/bin/chromium-browser`.
     - macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
2. **Ephemeral Profile Isolation:**
   - Launches Chromium with a temporary profile directory in `os.tmpdir()` (`--user-data-dir=...`).
   - Cleans up and deletes temporary directories upon test completion.
3. **Dynamic Debugging Port:**
   - Uses `--remote-debugging-port=0` to allocate a random free port and avoid port collisions.
4. **WebSocket Protocol:**
   - Issues an HTTP `PUT /json/new` request to obtain a dedicated target page and WebSocket debugger URL (`webSocketDebuggerUrl`).
   - Directly encodes and decodes JSON-RPC 2.0 frames over `node:events` and native `WebSocket`.

---

## 2. API Reference

```javascript
import { launchRealBrowser } from './tests/helpers/real_browser.js';

const harness = await launchRealBrowser({
  serverPort: 3777,
  headless: true
});

try {
  // Navigate to local route
  await harness.navigate('/arena.html');

  // Evaluate JavaScript in browser context
  const title = await harness.evaluate('document.title');

  // Wait for predicate function to return truthy
  await harness.waitForFunction('window.BattleArena.getState().inDuel === true', 5000);

  // Capture viewport screenshot to file
  await harness.captureScreenshot('reports/browser_screenshot.png');
} finally {
  // Cleanly close browser and local server
  await harness.close();
}
```
