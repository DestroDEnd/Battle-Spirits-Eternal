# Work Package K.1.3 — Exclusion Semantics, Prerequisite Traceability & Workspace Preservation Audit

**Status:** COMPLETE (STOPPED prior to `K1-BATCH-01`; awaiting explicit user approval)

## 1. Complete Audit of the 2,808 Exclusions
Audited all `2,808` records from `reports/work_package_k1_2/explicit_exclusion_inventory.json` joined to full IR records across all `514` shards in `scripts/audit_k1_3_exclusions.mjs`:

| Classification | Count | Summary |
|---|---:|---|
| `EXECUTABLE_EFFECT` | 14 | Uncompiled effect text leaked into `timingLabel` or Rebirth `prefixes` despite `clauses.length === 0`. |
| `GAMEPLAY_PREREQUISITE` | 1,302 | `903` `Brave Condition` + `386` `Summon Condition` + `13` `SuAdcon` prerequisites consumed by engine subsystems and card-level consumers. |
| `CONTINUOUS_OR_PASSIVE_RULE` | 0 | None among the 2,808 zero-clause exclusions. |
| `KEYWORD_DEFINITION` | 516 | `499` `Mirage` + `17` `Release` / `True Release` keyword headers consumed by keyword/set subsystems. |
| `DISPLAY_ONLY_METADATA` | 750 | Empty `PASSIVE` placeholders (`clauses: []`, `rawText: null`, `cleanBody: ""`, `keyword: null`, `prefixes: []`, `timingLabel: ""`). |
| `UNRESOLVED_REQUIRES_REVIEW` | 226 | `214` `[+1]`/`[+0]` markers, `6` `"rtp"` prefixes, `5` `BURST` headers with 0 clauses, and `1` `STEP_RESTRICTED` header with 0 clauses. |
| **Total** | **2,808** | **0 missing, 0 duplicates** |

## 2. Prerequisite & Dependency Traceability
- `k1_3_prerequisite_dependency_graph.json`: `1,818` prerequisite/keyword nodes traced (`1,818` with known engine-subsystem or same-card ability consumers, `0` orphaned prerequisites without known consumers).
- `k1_3_unresolved_dependency_inventory.json`: `240` records (`14` `EXECUTABLE_EFFECT` + `226` `UNRESOLVED_REQUIRES_REVIEW`) explicitly flagged for compiler/remediation review rather than assumed harmless.

## 3. `cleanBody` and `timingLabel` Semantic Review
- **`cleanBody` (`k1_3_cleanbody_semantic_audit.json`):** Recommendation = **`KEEP_EXCLUDED`** from exact semantic signature hashing (prevents false splits on wording/punctuation), while flagging `104` zero-clause abilities with non-empty `cleanBody` (mostly truncated `Brave Condition: [Right` headers) and `UNSUPPORTED` clauses with `cleanBody` text as required audit signals.
- **`timingLabel` (`k1_3_timinglabel_semantic_audit.json`):** Recommendation = **`REQUIRES_REVIEW`** — `312` discrepancies detected across `36,422` abilities (including multi-line effect text leaked into `timingLabel` and uncaptured timing qualifiers such as `"by the Opponent"` or `"paying the original cost"`).

## 4. Corrected Git Preservation Audit
- `k1_3_git_path_comparison.json` & `k1_3_preservation_audit.json`:
  - `674` pre-existing dirty paths present in `k1_2_initial_git_state.json` are honestly classified as `PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT` (because baseline SHA-256 hashes were not recorded in `k1_2_initial_git_state.json`).
  - `0` unexpected `engine/`, `compiler/`, or `data/ir_shards/` changes occurred during K.1.2 or K.1.3.
  - All `42` K.1.2 manifest files verified byte-for-byte via SHA-256 (`k1_2OutputsByteVerifiedViaManifest: true`).
  - Status: `PASS_WITH_INDETERMINATE_PREEXISTING_DIRTY`.

## 5. Verification Results
- `node tests/work_package_k1_3_audit.test.js`: `6 / 6` passed (`0` failed)
- `node tests/work_package_k1_2_discovery_integrity.test.js`: `6 / 6` passed (`0` failed)
- `node tests/work_package_k1_1_discovery_integrity.test.js`: `3 / 3` passed (`0` failed)
- `node tests/work_package_k0_1_remediation.test.js`: `9 / 9` passed (`0` failed)
- `node tests/work_package_k0_engine_health.test.js`: `10 / 10` passed (`0` failed)
- `node tests/data_audit.test.js`: `3 / 3` passed (`0` failed)
- `node scripts/validate_514_shards_exhaustive.mjs`: `514 / 514` shards passed (`0` collisions)
- `node scripts/run_verified_suites.mjs --all`: `932 / 932` passed (`0` failed, `0` skipped)
- `node tests/run_all.js`: `2,363 / 2,363` passed (`335` suites, `0` failed, `0` skipped)
- Determinism (`k1_3_determinism_report.json`): `allByteIdentical: true` across `6` core JSON outputs.
