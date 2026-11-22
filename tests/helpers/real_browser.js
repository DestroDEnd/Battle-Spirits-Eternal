/**
 * tests/helpers/real_browser.js
 * 
 * Genuine Chrome DevTools Protocol (CDP) browser automation harness for BSP.
 * Launches headless Google Chrome and the local BSP server, connecting directly
 * via native Node.js 24 WebSocket without third-party dependencies.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export async function launchRealBrowser(options = {}) {
  const browserBin = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
  if (!fs.existsSync(browserBin)) {
    throw new Error('Neither Chrome nor Edge browser binary found on host system.');
  }

  const serverPort = options.serverPort || 3987;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-chrome-harness-'));

  // 1. Launch local server if not disabled
  let serverProc = options.existingServerProc || null;
  if (!options.noServer && !options.existingServerProc) {
    serverProc = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: String(serverPort) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server start timed out')), 8000);
      serverProc.stdout.on('data', (data) => {
        if (data.toString().includes('running at')) {
          clearTimeout(timer);
          resolve();
        }
      });
      serverProc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  // 2. Launch headless Chrome
  const chromeProc = spawn(browserBin, [
    '--headless=new',
    '--remote-debugging-port=0',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tmpDir}`
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const wsDebuggerUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome DevTools port acquisition timed out')), 10000);
    chromeProc.stderr.on('data', (buf) => {
      const line = buf.toString();
      const m = line.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    chromeProc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  // 3. Create target page via CDP HTTP PUT /json/new
  const cdpPort = new URL(wsDebuggerUrl).port;
  const pageInfo = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: cdpPort,
      path: '/json/new',
      method: 'PUT'
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });

  // 4. Connect page WebSocket
  const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);
  let msgId = 1;
  const pendingCallbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingCallbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const consoleLogs = [];
  const exceptions = [];

  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push(data.params);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        exceptions.push(data.params);
      }
      if (data.id && pendingCallbacks.has(data.id)) {
        const { resolve, reject } = pendingCallbacks.get(data.id);
        pendingCallbacks.delete(data.id);
        if (data.error) {
          reject(new Error(data.error.message || JSON.stringify(data.error)));
        } else {
          resolve(data.result);
        }
      }
    } catch (_) {}
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const harness = {
    serverPort,
    serverProc,
    chromeProc,
    ws,
    tmpDir,
    consoleLogs,
    exceptions,

    async navigate(urlPath) {
      const fullUrl = urlPath.startsWith('http') ? urlPath : `http://127.0.0.1:${serverPort}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
      await send('Page.navigate', { url: fullUrl });
      // Wait for load
      await new Promise(r => setTimeout(r, 1200));
    },

    async evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression: typeof expression === 'function' ? `(${expression.toString()})()` : expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(`Eval exception: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
      }
      return res.result?.value;
    },

    async waitForFunction(fnStr, timeoutMs = 15000, pollIntervalMs = 150) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          const res = await this.evaluate(fnStr);
          if (res) return res;
        } catch (_) {}
        await new Promise(r => setTimeout(r, pollIntervalMs));
      }
      throw new Error(`waitForFunction timed out after ${timeoutMs}ms: ${fnStr}`);
    },

    async click(selector) {
      const clicked = await this.evaluate(`(function() {
        const el = document.querySelector('${selector}');
        if (!el) return false;
        el.scrollIntoView?.();
        el.click();
        return true;
      })()`);
      if (!clicked) {
        throw new Error(`Element not found for click: ${selector}`);
      }
      await new Promise(r => setTimeout(r, 100));
      return true;
    },

    async captureScreenshot(outPath) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res && res.data) {
        const buffer = Buffer.from(res.data, 'base64');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, buffer);
        return outPath;
      }
      return null;
    },

    async close() {
      try { ws.close(); } catch (_) {}
      try {
        if (process.platform === 'win32' && chromeProc.pid) {
          spawn('taskkill', ['/pid', String(chromeProc.pid), '/T', '/F']);
        } else {
          chromeProc.kill();
        }
      } catch (_) {}
      if (serverProc && !options.noServer) {
        try { serverProc.kill(); } catch (_) {}
      }
      await new Promise(r => setTimeout(r, 600));
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
  };

  return harness;
}
