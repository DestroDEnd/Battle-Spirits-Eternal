# K.1.3.3 Performance Recommendations — `WPDE-PERF-01`

## 1. Resolution of Warmed vs Fresh-Process Discrepancy
- **Fresh Node Process (`node --test --test-name-pattern=WPDE-PERF-01`):** Highly sensitive to OS scheduling and cold V8 JIT jitter: failed at `837.25ms` (`exitCode: 1`) on initial isolated run, and passed at `251.24ms`, `280.14ms`, `98.19ms` across 3 subsequent fresh runs (`k1_3_3_performance_investigation.json`). Previously observed at `553.13ms` in K.1.3.1 and `8,553ms` under heavy load.
- **Warmed Direct Loop (after 10 JIT warm-ups, 20 measured):** Mean `25.91ms`, median `24.36ms`, min `20.69ms`, max `51.41ms`, P95 `32.63ms`, `0 / 20` violations.
- **Status:** **INTERMITTENT_COLD_START_VARIANCE_UNRESOLVED** (cold fresh-process execution is not reliably `< 500ms` under load without engine `DESTROY` batch optimization).

## 2. Recommended Future Engine Optimization
- Batch field removal and zone indexing in `executeOp(DESTROY)` (`engine/ops/index.js` / `engine/zones.js`) instead of 200 sequential `moveCard` array scans, so cold-JIT execution also completes comfortably under `500ms`.
