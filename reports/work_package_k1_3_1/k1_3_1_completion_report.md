# Work Package K.1.3.1 — Dependency Evidence Verification, Timing Semantic Reconciliation & Discovery Acceptance Hardening

**Overall Decision:** **ACCEPTED WITH CONDITIONS** (STOPPED prior to `K1-BATCH-01`; awaiting explicit user approval)

## 1. Evidence Provenance & Distinctions

- **Independently Verified Facts:**
  - `514` IR shards (`15,398` card records, `14,609` unique canonical cards, `36,422` ability records) validated with `0` collisions (`scripts/validate_514_shards_exhaustive.mjs`).
  - `reports/work_package_k1_2/MANIFEST.txt` (`42` files) and `reports/work_package_k1_3/MANIFEST.txt` (`16` files) verified byte-for-byte via SHA-256 (`k1_3_1_git_change_audit.json`).
  - `node tests/run_all.js` passed `2,364 / 2,364` (`210` test files, `335` suites, `0` failed, `0` skipped).
- **Static Code Evidence (`engine/` & `compiler/`):**
  - Inspected `engine/index.js`, `engine/zones.js`, `engine/conditions.js`, `engine/restrictions.js`, `engine/continuous.js`, `engine/state.js` (SHA-256 hashes recorded in `k1_3_1_dependency_evidence_audit.json`).
  - Confirmed `engine/` has `0` code paths reading `ab.type === 'CONDITION'`, `Brave Condition`, `Summon Condition`, `SuAdcon`, or `Mirage: Cost ...` header prefixes directly, even though `engine/zones.js` (`599-604`) and `engine/conditions.js` (`1657-1674`) support the `mirage` zone/state and `compiler/index.js` (`130`) compiles `[Brave/Summon Condition: ...]`.
- **Script-Derived Classifications (`scripts/audit_k1_3_1_hardening.mjs`):**
  - **Dependency Graph (`1,818` nodes, `3,632` edges):** `0` `CONFIRMED_CONSUMER` edges, `3,632` `EXPECTED_CONSUMER` edges, `0` `UNRESOLVED_CONSUMER`, `0` `CONFLICTING_OR_AMBIGUOUS_CONSUMER`. All `1,818` nodes remain in `k1_3_1_unresolved_dependencies.json` until runtime consumers are wired in `engine/`.
  - **TimingLabel Discrepancies (`312 / 312`):** `299` `GAMEPLAY_TIMING_QUALIFIER_MISSING`, `6` `ADDITIONAL_ACTIVATION_RESTRICTION_MISSING`, `7` `EXECUTABLE_EFFECT_TEXT_LEAK`. All `312` are missing from current structured timing identity and queued in `k1_3_1_missing_timing_semantics.json`.
  - **Executable & Unresolved Exclusions (`240 / 240`):** `14` `CONFIRMED_EXECUTABLE_EFFECT`, `5` `PARTIALLY_STRUCTURED_EFFECT` (Burst headers with `0` clauses), `221` `UNRESOLVED_REQUIRES_MANUAL_REVIEW`.
  - **CleanBody & Display-Only Safety:** All `104` zero-clause abilities with non-empty `cleanBody` flagged for remediation (`KEEP_EXCLUDED_WITH_FALLBACK_REMEDIATION_FLAG`), and all `750` `DISPLAY_ONLY_METADATA` records verified to have `0` hidden gameplay text.
  - **Source Reconciliation:** 1-to-1 `<shard>::<cardKey>#a<index>` joins verified (`2,808`, `312`, `104`, `240`) with `0` missing and `0` duplicates.
- **Runtime-Tested Evidence & Regression (`k1_3_1_test_results.json`):**
  - `node tests/work_package_k1_3_1_semantic_audit.test.js`: `6 / 6` passed
  - `node tests/work_package_k1_3_audit.test.js`: `6 / 6` passed
  - `node tests/work_package_k1_2_discovery_integrity.test.js`: `6 / 6` passed
  - `node tests/work_package_k1_1_discovery_integrity.test.js`: `3 / 3` passed
  - `node tests/work_package_k0_1_remediation.test.js`: `9 / 9` passed
  - `node tests/work_package_k0_engine_health.test.js`: `10 / 10` passed
  - `node tests/data_audit.test.js`: `3 / 3` passed
  - `node scripts/validate_514_shards_exhaustive.mjs`: `514 / 514` passed (`0` collisions)
  - `node scripts/run_verified_suites.mjs --all`: **`931 / 932`** passed, **`1` failed** (`WPDE-PERF-01`: `Expected < 500ms, got 553.13ms`, exit code `1`)
  - `node tests/run_all.js`: **`2,364 / 2,364`** passed (`335` suites, `0` failed, `0` skipped)
- **Preservation Limitation (Indeterminate Baseline):**
  - The `674` pre-existing dirty paths present prior to K.1.2 lack baseline SHA-256 hashes in `k1_2_initial_git_state.json`, so their content preservation is honestly marked `INDETERMINATE_NO_PRE_K1_2_BASELINE_HASHES`.

## 2. Remaining Blockers Before `K1-BATCH-01`
1. `312` `timingLabel` discrepancies (`299` missing timing qualifiers, `6` missing original-cost restrictions, `7` leaked multi-line effects) require the additive compiler schema in `k1_3_1_timing_schema_recommendations.md`.
2. `240` executable/unresolved exclusions (`14` `CONFIRMED_EXECUTABLE_EFFECT`, `5` `PARTIALLY_STRUCTURED_EFFECT`, `221` `UNRESOLVED_REQUIRES_MANUAL_REVIEW`) and `104` zero-clause `cleanBody` mismatches require compiler/manual remediation.
3. `1,818` prerequisite/keyword nodes have `0` confirmed runtime consumers in `engine/` (`3,632` `EXPECTED_CONSUMER` edges).
4. `WPDE-PERF-01` exceeded its `500ms` latency threshold (`553.13ms`) under `run_verified_suites.mjs --all`.
