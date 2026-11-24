# PHASE M.3.3 — INTEGRITY, SECURITY, UNIVERSAL ACTION AUTHORITY & REGRESSION CLOSURE
## 07 — IMAGE PROXY SERVER-SIDE REQUEST FORGERY (SSRF) PROTECTION

### Executive Summary
Work Package H eliminates Server-Side Request Forgery (SSRF) vulnerabilities discovered in the image caching and proxy endpoints (`/api/proxy-image` and `/api/image-proxy`). In previous iterations, the proxy endpoint forwarded arbitrary URLs provided by client requests without protocol, host, IP, or port restrictions. This created severe exposure to internal network reconnaissance, loopback port scanning, and cloud metadata theft (such as AWS/GCP instance credentials at `169.254.169.254`). A defense-in-depth SSRF filter has been implemented.

---

### Threat Model & Defense-in-Depth Implementation

#### 1. Host and Domain Whitelist
Outbound fetching is restricted exclusively to authorized card art CDN domains:
- `static.wikia.nocookie.net`
- `images.wikia.com`
- `battle-spirits.fandom.com`
- `asia-en.battlespirits.com`
- `battlespirits.com`

Any host outside the whitelist is rejected immediately with HTTP 403 Forbidden without initiating network connections.

#### 2. Protocol and Port Constraints
- **Protocol**: Strictly `https:`. Plaintext `http:`, `file:`, `ftp:`, `data:`, `gopher:`, and all other protocols are unconditionally rejected.
- **Port**: Strictly standard HTTPS port `443` (implicit or explicit). Requests specifying non-standard ports (such as `:8080`, `:6379`, `:22`) are rejected.

#### 3. Private IP & Cloud Metadata Range Blocking
Before making network requests, target hostnames and resolved IP addresses are evaluated against RFC 1918 and special-use address spaces:
- Loopback addresses (`127.0.0.0/8`, `localhost`, `::1`)
- Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
- Link-local and Cloud Metadata (`169.254.0.0/16`, specifically AWS/GCP metadata endpoints)
- Multicast, broadcast, and reserved blocks.

#### 4. Response Header and Content Validation
- Validates upstream response `content-type` header to ensure it matches recognized image formats (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`).
- Enforces an absolute maximum streaming payload limit (5 MB) to defend against memory exhaustion attacks (Decompression Bombs).

---

### Verification and Test Coverage
Dedicated Test Suite: `tests/phase_m3_3_image_proxy_security.test.js`
- **M3.3-H-01**: Loopback requests (`http://127.0.0.1`, `http://localhost`) are blocked with HTTP 403. (PASS)
- **M3.3-H-02**: Cloud metadata requests (`http://169.254.169.254/latest/meta-data/`) are blocked. (PASS)
- **M3.3-H-03**: Non-HTTPS protocols (`file:///etc/passwd`, `ftp://...`) are rejected. (PASS)
- **M3.3-H-04**: Arbitrary external domains not on the CDN allowlist are blocked. (PASS)
- **M3.3-H-05**: Legitimate card art URLs from approved CDNs are successfully proxied. (PASS)

Result: **1/1 Suite PASS (5 assertion vectors)**. Outbound proxying is securely restricted to authorized static card media.
