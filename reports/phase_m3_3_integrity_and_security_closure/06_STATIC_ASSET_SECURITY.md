# PHASE M.3.3 — INTEGRITY, SECURITY, UNIVERSAL ACTION AUTHORITY & REGRESSION CLOSURE
## 06 — STATIC ASSET SERVING SECURITY & DIRECTORY TRAVERSAL LOCKDOWN

### Executive Summary
Work Package G resolves critical security vulnerabilities in static asset serving discovered during the forensic audit. Previously, unconstrained file resolution in `server.js` could allow malicious actors to perform directory traversal and inspect sensitive backend files, including SQLite session databases, Git repository internals (`.git/HEAD`, `.git/config`), environment files, and engine logs. A strict path canonicalization and extension allowlist has been implemented, completely locking down static file serving.

---

### Vulnerability Analysis and Remediation

#### 1. Directory Traversal and Path Manipulation
- **Vulnerabilities**: Attackers could submit URL patterns such as `../../battle_spirits.sqlite`, `..%2f..%2f.git/config`, or null byte poisons like `style.css%00.html`.
- **Remediation**:
  - Implemented URL decode sanitization and explicit rejection of `%00`, `\0`, and unnormalized `..` path segments prior to path resolution.
  - Resolved requested paths against the designated static root (`path.resolve(STATIC_ROOT, safePath)`) and asserted `filePath.startsWith(STATIC_ROOT)`.
  - Rejection with `403 Forbidden` for any attempt to navigate outside the boundary.

#### 2. Sensitive Asset and File Extension Lockdown
- **Vulnerabilities**: Direct queries to database files (`.sqlite`, `.db`), source metadata (`package.json`), or configuration files in the public root.
- **Remediation**:
  - Implemented an explicit extension whitelist: `.html`, `.css`, `.js`, `.mjs`, `.json` (client manifests only), `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`, `.woff`, `.woff2`.
  - Blanket ban on `.sqlite`, `.sqlite3`, `.db`, `.env`, `.git`, `.log`, `.jsonl`, `.sh`, `.bat`.
  - Requests for dotfiles (`^\/\..*`) or unapproved extensions return `403 Forbidden` or `404 Not Found`.

---

### Verification and Test Coverage
Dedicated Test Suite: `tests/phase_m3_3_static_asset_security.test.js`
- **M3.3-G-01**: Path traversal with relative dots (`../`) is blocked with HTTP 403. (PASS)
- **M3.3-G-02**: Access to SQLite database files (`.sqlite`, `.sqlite-wal`) is blocked. (PASS)
- **M3.3-G-03**: Access to `.git` directory and metadata is blocked. (PASS)
- **M3.3-G-04**: Encoded traversals (`%2e%2e%2f`) and null byte poisoning (`%00`) are rejected. (PASS)
- **M3.3-G-05**: Whitelisted static assets (`.html`, `.css`, `.js`, `.png`) serve normally with correct MIME headers. (PASS)

Result: **1/1 Suite PASS (5 assertion vectors)**. The server boundary is hardened against unauthorized file disclosure.
