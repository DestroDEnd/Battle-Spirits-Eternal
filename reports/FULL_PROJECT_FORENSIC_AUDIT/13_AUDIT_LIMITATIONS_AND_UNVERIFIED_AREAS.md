# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 13. AUDIT LIMITATIONS AND UNVERIFIED AREAS

**Execution Mode:** STRICTLY READ-ONLY AUDIT  
**Integrity Guarantee:** Zero project files altered, zero code modified, zero database records mutated.

---

### 1. Verified Subsystems & Certainty Baseline

The following areas have been rigorously verified via code analysis, static inspection, and targeted probe execution:
1. **Card Corpus & Database:** Verified. Exact card counts (14,443 cards), IR shard counts (514 shards), index keys (14,443), and rebirth pairs (530) are independently confirmed.
2. **Compiler & Shards:** Verified. Regex dictionaries in [compiler/clause_patterns.js](file:///c:/Users/namis/Downloads/BSP/compiler/clause_patterns.js) compile clauses into structured IR.
3. **Keyword Registry Counts & Hook Breakdown:** Verified. The exact distribution of 364 keywords (99 hooked, 265 unhooked, 110 data-only, 40 orphaned methods) has been proven.
4. **Session Persistence & SQLite Schema:** Verified. Table schemas, transaction commits, and serialization scrubbing verified.
5. **Security Vulnerabilities:** Verified. All 5 security defects (BSP-AUD-001, 006, 007, 008, 010) have been reproduced.

---

### 2. Audit Limitations & Unverified Areas

Due to the strictly read-only execution constraint and environment boundaries, the following areas remain **UNVERIFIED**:

1. **Full 14,443 Card Individual Runtime Simulation:**
   - While all 14,443 cards exist in the database and have compiled IR records, individual end-to-end combat simulation was not executed for every single card in the database.
   - Status: **UNVERIFIED**.
2. **Distributed Multi-Node Network Latency & Packet Loss:**
   - Multi-client WebSocket testing was performed locally over loopback (`127.0.0.1`). Real-world WAN latency, packet drops, mobile reconnect jitter, and cross-datacenter SQLite synchronization were not simulated.
   - Status: **UNVERIFIED**.
3. **WebGL / Canvas Hardware Acceleration in Headless Chrome:**
   - Headless Chrome CDP tests run with `--disable-gpu`. Hardware-accelerated GPU rendering, WebGL animations, and client display fps in real user browsers were not profiled.
   - Status: **UNVERIFIED**.
4. **High-Concurrency SQLite Stress (1,000+ Concurrent Matches):**
   - Stress testing was bounded to local concurrent test processes. Massive concurrency (>1,000 active database writers) was not benchmarked.
   - Status: **UNVERIFIED**.

---

### 3. Non-Modification Certification

The auditor certifies under non-negotiable audit guidelines:
- **No production code was edited, refactored, or optimized.**
- **No card data files, index files, or IR shards were modified.**
- **No database records or migration scripts were executed against `battle_spirits.db`.**
- **No historical reports under `reports/phase_*` or `reports/work_package_*` were altered or overwritten.**
- **All deliverables are strictly isolated within `reports/FULL_PROJECT_FORENSIC_AUDIT/`.**
