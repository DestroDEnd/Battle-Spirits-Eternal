# K.1.3.2 Performance Investigation & Recommendations — `WPDE-PERF-01`

## 1. Measurement Scope (`tests/work_package_de_operations_and_cards.test.js` lines 319-338)
- **Measured:** `executeOp(DESTROY, { all: true, target: { side: 'opp', types: ['Spirit'] } })` on 200 field stacks + 50 calls to `computeEffectiveBP`.
- **Excluded from timer:** Node startup, module imports, `createGameState()`, and the 200-unit field setup loop.

## 2. Reproducible Benchmark Results (10 Warm-up + 30 Measured Iterations)
- **Cold First Run:** `322.64ms` (`destroy200Ms: 322.29ms`, `bp50Ms: 0.34ms`)
- **30 Warmed Iterations:**
  - Min: `58.31ms`
  - Max: `205.12ms`
  - Mean: `109.84ms`
  - Median: `98.23ms`
  - StdDev: `35.44ms`
  - P95: `184.14ms`
  - Threshold (`< 500ms`) Violations: `0 / 30`

## 3. Root Cause & Optimization Candidates (For Future Engine Package)
1. **99.9% of execution time is inside `executeOp(DESTROY)`** iterating 200 field stacks sequentially with per-stack zone lookups, `moveCard`, and event emission.
2. **Why `553.13ms` occurred in K.1.3.1:** Single-shot cold-JIT execution inside `run_verified_suites.mjs --all` has ~3x higher latency than warmed runs (`322.6ms` vs `98.2ms` median) and is sensitive to GC pauses and OS scheduling jitter.
3. **Recommended future engine optimization (do NOT alter threshold or weaken test):**
   - Batch field removal / index lookup in `DESTROY` (`all: true`) instead of 200 sequential `Array.prototype.indexOf` + `splice` scans in `engine/zones.js` / `engine/ops/index.js`.
