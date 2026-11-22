# Work Package K.1.4 — Foundation Semantics Remediation, Runtime Integration & Batch-1 Readiness

**Readiness Decision:** **READY WITH LIMITED CONDITIONS** (STOPPED prior to `K1-BATCH-02`; awaiting explicit user approval)

## 1. Source Files Changed & Why
- **`compiler/header_parser.js`**: Added structured `timingCause`, `timingOwner`, `timingTriggers`, and `activationRestrictions`, and fixed `unparenMatch` (`[^,\r\n]+`) so multi-line effect text never leaks into `timingLabel`.
- **`compiler/index.js`**: Compiled `[team: ...]` / `[teams: ...]` blocks into `card.teams` + `type: 'TEAM_RESTRICTION'` metadata while preserving ability indices aligned with IR shards.
- **`engine/prerequisites.js`** *(new)*: Implemented `parseBraveCondition`, `evaluateBraveCondition`, `parseSummonCondition`, `evaluateSummonCondition`, `parseMirageDeclaration`, `parseReleaseDeclaration`, `parseTeamTags`, and `hasTeam`.
- **`engine/index.js`**: Wired `evaluateSummonCondition`, `evaluateBraveCondition`, and `parseMirageDeclaration` (`options.setAsMirage`) into `playCard`, and enforced `timingCause` (`OPPONENT`/`OPPOSING_SPIRIT_EFFECT`) in `DESTROYED` and `PAID_ORIGINAL_COST` in `SUMMONED`.
- **`engine/ops/index.js` & `engine/zones.js`**: Added `knownFromZone`/`knownFromSide`/`knownFromStack` fast-path and `splice` stack removal in `DESTROY` + `moveCard` to eliminate `O(N^2)` zone scans and array allocations.
- **`scripts/k1_4_semantic_identity.mjs` & `scripts/generate_k1_4_reports.mjs`** *(new)*: Implemented `buildExactSemanticSignatureV3` and K.1.4 verification reports.

## 2. Status Separation (Implemented / Tested / Semantically Verified / Partially Supported / Unresolved)
- **Implemented & Semantically Verified:**
  - **Timing Identity V3:** All `34 / 34` K.1.3.4 opponent-only collisions resolved (`0` remaining corpus collisions, `k1_4_timing_identity_report.json`).
  - **Runtime Prerequisites (`1,800` exclusion records):** `Brave Condition` (`P14-41`) and `Summon Condition` (`CP14-X14R`) enforced pre-payment in `playCard` (`K1.4-B1 & B2` pass).
  - **Mirage Set Placement:** `playCard(..., { setAsMirage: true })` pays Mirage cost and places card into `mirage` zone (`K1.4-B3` pass).
  - **Team Restrictions (`691` records):** `[team: ...]` parsed into `card.teams` + `TEAM_RESTRICTION` + `hasTeam` (`K1.4-C2` pass).
  - **Batch 1 (8 Core Ops — `6,610` abilities):** `DRAW`, `BP_BUFF`, `BP_DEBUFF`, `DESTROY`, `BOUNCE`, `EXHAUST`, `REFRESH`, `MOVE_CORE` all real-card tested (`K1.4-D3` pass, `k1_4_operation_variant_coverage.json`).
- **Partially Supported:**
  - `Release` / `True Release` (`18` records): Descriptor parsed (`parseReleaseDeclaration`), awaiting full attack/step core-transfer trigger wiring.
- **Unresolved (Explicitly Isolated in `k1_4_unresolved_inventory.json`):**
  - `59` ambiguous display candidates, `228` manual-interpretation exclusions, `14` source-correction exclusions.
  - `WPDE-PERF-01`: Passed inside `tests/run_all.js`, but failed `3 / 5` fresh isolated cold-start runs (`929.02ms` max).

## 3. Regression Results (`k1_4_regression_results.json`)
- `node tests/work_package_k1_4_foundation_remediation.test.js`: **`6 / 6` passed** (`0` failed)
- `node tests/work_package_k1_3_audit.test.js`: `6 / 6` passed
- `node tests/work_package_k1_2_discovery_integrity.test.js`: `6 / 6` passed
- `node tests/work_package_k1_1_discovery_integrity.test.js`: `3 / 3` passed
- `node tests/work_package_k0_1_remediation.test.js`: `9 / 9` passed
- `node tests/work_package_k0_engine_health.test.js`: `10 / 10` passed
- `node tests/data_audit.test.js`: `3 / 3` passed
- `node scripts/validate_514_shards_exhaustive.mjs`: `514 / 514` passed (`0` collisions)
- `node tests/run_all.js`: **`2,369 / 2,373` passed, `4` failed** — the ONLY `4` failures are the historical `K.1.3.1`–`K.1.3.4` preservation hash checks asserting `engine/index.js` & `engine/zones.js` were unchanged prior to K.1.4. `WPDE-PERF-01` PASSED in `tests/run_all.js`.
