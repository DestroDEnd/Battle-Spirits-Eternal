# Battle Spirits Eternal — Work Package C.2 Completion Report
**Semantic Evidence Audit & Full-Suite Regression Closure**

**Environment**: Windows, Node.js `v24.16.0`  
**Date**: 2026-11-18  

---

## 1. Executive Summary & Verification Delta

Work Package C.2 replaced the manual semantic allowlists in the exhaustive 514-shard auditor with an executable, test-traceable Operation, Variant, and Condition Evidence Registry (`scripts/evidence_registry.mjs`), fixed the compiler extraction defects for `REVEAL_CARDS` and `REPLACEMENT_EFFECT`, resolved genuine runtime bugs (`SUMMON_FREE` reason code, post-cost reserve depletion guard in `executeSummonTransaction`, `REPLACEMENT_EFFECT` `side: 'self'` resolution, and fail-closed bare `REVEAL_CARDS` handling), and established genuine `NEEDS_MANUAL_REVIEW` classification.

| Verification Metric | C.1 Baseline | C.2 Final | Delta |
|---|---:|---:|---:|
| Full Suite (`node tests/run_all.js`) Total Tests | 1,935 | 1,949 | +14 (`work_package_c2_evidence_and_compiler.test.js`) |
| Full Suite Passed | 1,918 | 1,933 | +15 |
| Full Suite Failed | 17 | 16 | -1 (`5.9` resolved) |
| Verified Suites (`node scripts/run_verified_suites.mjs --all`) | 25 suites (542/542) | 26 suites (556/556) | +1 suite, 0 failures |
| `tests/work_package_c1_auditor_and_regression.test.js` | 8 / 8 pass | 8 / 8 pass | Preserved |
| `tests/work_package_c2_evidence_and_compiler.test.js` | N/A | 14 / 14 pass | +14 |

---

## 2. Resolution of the 17 Previous Full-Suite Failures

All 17 baseline failures in `reports/work_package_c1/final_failure_inventory.json` (all in `tests/phase4b3_reveal_burst_replace_summon.test.js`) were individually investigated:

1. **`REVEAL_CARDS` (4 failures: `2.1` BS69-036, `2.2` BS64-X04, `2.3`, `2.4`)**:
   - **Root Cause**: `compiler/clause_patterns.js` emitted bare `{ op: 'REVEAL_CARDS' }` without `count`, `from`, or `side`. The 514 IR shards (`data/ir_shards/BS69.json`, `BS64.json`) still hold those bare stubs and were intentionally NOT modified; `2.3`/`2.4` also passed bare `{ op: 'REVEAL_CARDS' }` expecting runtime English-text guessing.
   - **Outcome**: Fixed `compiler/clause_patterns.js` via `extractRevealCardParams(text)` and enforced fail-closed `MISSING_REVEAL_SPEC` on bare `{ op: 'REVEAL_CARDS' }` in `engine/ops/index.js`. Historical failure records for `2.1`–`2.4` are preserved; replacement semantic tests `WPC2-REV-01`..`04` pass.
2. **`REPLACEMENT_EFFECT` (5 failures: `4.1` BS24-X02, `4.2` SD02-014, `4.5` BS20-X01, `4.6` BS42-052, `4.7` BS24-013)**:
   - **Root Cause**: `compiler/clause_patterns.js` emitted bare `{ op: 'REPLACEMENT_EFFECT' }` (or `{ op: 'REPLACEMENT_EFFECT', trigger: 'NEXUS_DESTROYED' }` for `SD02-014`) without `replaces` / `replacementZone`. Bare stubs fail closed with `MISSING_REPLACEMENT_SPEC`.
   - **Outcome**: Fixed `compiler/clause_patterns.js` to emit structured `replaces`, `replacementZone`, `side`, `target`, and `cost`, and fixed `op.side === 'self'` resolution in `engine/ops/index.js`. Historical failure records for `4.1`, `4.2`, `4.5`, `4.6`, `4.7` are preserved (since `data/ir_shards/` is unmodified); replacement semantic tests `WPC2-REP-01`..`03` pass.
3. **Summon & Transaction Failures (8 failures: `5.9`, `6.2`, `6.3`, `7.1`, `8.2`, `8.3`, `10.3`, `13.6`)**:
   - **`5.9` — RESOLVED (now passing)**: `executeSummonTransaction()` returned `INSUFFICIENT_CORES_FOR_BURST_SUMMON` instead of `INSUFFICIENT_LV1_CORES` for `SUMMON_FREE` from `HAND`.
   - **`6.2`, `6.3`, `7.1`, `13.6` — Obsolete Rollback Fixtures + Genuine Placement Guard Fixed**: Found and fixed a real bug in `executeSummonTransaction()` where post-cost reserve depletion left `placementOk = true` and summoned a 0-core Spirit, and passed `events` to `summon_rollback` `moveCore`. The 4 old tests remain failing because their `CORE_MOVED` listeners externally delete reserve cores (`= 0`) and assert that rollback invents missing cores out of thin air (violating core conservation). Preserved historical records; replacement tests `WPC2-TXN-01` and `WPC2-TXN-02` pass.
   - **`8.2`, `8.3`, `10.3` — Obsolete Void-Source Fixtures**: All 3 call `moveCore(..., { zone: 'void' }, ...)` with `0` cores in `voidCores`, violating `CORR-CORE-01` Void-source conservation. Preserved historical records; replacement tests `WPC2-REP-01`, `WPC2-REP-02`, and `WPC2-TXN-03` pass.

---

## 3. Evidence-Backed Semantic Auditor & Reconciled 514-Shard Totals

Manual allowlists (`SEMANTICALLY_VERIFIED_OPS`, `PARTIALLY_SUPPORTED_OPS`, `SEMANTICALLY_VERIFIED_COND_TYPES`) were removed from `scripts/audit_514_cards_exhaustive.mjs` and replaced by `scripts/evidence_registry.mjs`, which dynamically checks `implementedOps`, `evaluatedCondTypes`, variant schemas, and **on-disk existence of every referenced test file and test identifier**.

### 3.1 Operation & Variant Evidence (`node scripts/audit_514_cards_exhaustive.mjs`)
- **Shards**: `514` | **Compiled Card Records**: `15,398` (`14,609` unique base card numbers)
- **Unique Ops in Shards**: `288` = `144` implemented + `144` missing (`reconciledSumCheck: true`)
- **Operation Instance Breakdown (`51,734` total)**:
  - `SEMANTICALLY_VERIFIED`: `32,963`
  - `HANDLER_PRESENT_UNVERIFIED`: `14,505`
  - `NEEDS_MANUAL_REVIEW`: `2,564`
  - `HANDLER_MISSING`: `1,007`
  - `PARAMETERS_INCOMPLETE`: `543`
  - `PARTIALLY_SUPPORTED`: `152`

### 3.2 Condition Evidence (`4,534` total instances)
- `SEMANTICALLY_VERIFIED`: `1,995`
- `PARSED_EVALUABLE_UNVERIFIED`: `274` (including `97` `LEGACY_CONTEXT_CONDITION` instances)
- `PARSE_FAILURE`: `2,265`
- `PARSED_UNSUPPORTED_TYPE`: `0`

### 3.3 Ability, Card & Manual-Review Inventory Totals
- **Abilities (`36,422` total)**: `FULLY_SUPPORTED: 14,552`, `PARTIAL: 15,345`, `NEEDS_MANUAL_REVIEW: 5,555`, `UNIMPLEMENTED: 970`.
- **Card Status Proposal (`15,398` total)**: `VANILLA_NO_EFFECT: 414`, `FULLY_SUPPORTED: 2,620`, `PARTIAL: 7,369`, `NEEDS_MANUAL_REVIEW: 4,930`, `UNIMPLEMENTED: 65`.
- **Manual-Review Breakdown (`5,555` abilities across `4,930` cards)**:
  - `Unverified trigger timing`: `2,561`
  - `Unverified target semantics`: `2,191`
  - `Missing or contradictory IR parameters`: `447`
  - `Missing semantic test evidence`: `147`
  - `Unsupported operation variant`: `124`
  - `Unsupported condition form`: `85`

---

## 4. Compiler Fidelity, Shard Integrity & Identity Stability

- **Modified Compiler File**: `compiler/clause_patterns.js` (`extractRevealCardParams`, structured `REPLACEMENT_EFFECT` patterns for `NEXUS_DESTROYED`, `DESTROYED_SPIRIT_CORES`, `LIFE_CORE`, and `CORE_ADDITION`).
- **Affected Cards Verified via `compileCard`**: `BS69-036`, `BS64-X04`, `BS20-X01`, `BS42-052`, `BS24-013`.
- **Shard Integrity**: All 514 files in `data/ir_shards/` and `compiler/identity.js` were preserved **unmodified**. Deterministic `physicalId` and `semanticId` generation verified in `WPC2-REP-03`.

---

## 5. Verification Commands & Clean-Extraction Reproduction

1. `node scripts/audit_514_cards_exhaustive.mjs` -> Exit `0`
2. `node scripts/run_verified_suites.mjs --all` -> Exit `0` (`26` suites, `556` tests, `556` pass, `0` fail)
3. `node --test tests/work_package_c2_evidence_and_compiler.test.js tests/work_package_c1_auditor_and_regression.test.js` -> Exit `0` (`22` tests, `22` pass, `0` fail)
4. `node tests/run_all.js` -> Exit `1` (`188` suites, `1,949` tests, `1,933` pass, `16` fail — all 16 preserved obsolete/bare-shard-stub tests in `tests/phase4b3_reveal_burst_replace_summon.test.js`)

To reproduce from a clean extraction of `work_package_c2_handoff.zip`, extract into an empty directory and run sequentially:
```powershell
node scripts/run_verified_suites.mjs --all
node scripts/audit_514_cards_exhaustive.mjs
node tests/run_all.js
```

## 6. Remaining Limitations
- `144` unique op types in the 514 shards still lack runtime handlers (`1,007` instances).
- `14,505` op instances belong to implemented handlers without variant-level semantic test evidence yet.
- `2,265` condition strings fail structured parsing (`PARSE_FAILURE`), and `97` `LEGACY_CONTEXT_CONDITION` instances require structured migration.
- `5,555` abilities (`4,930` cards) require manual review for unverified trigger timings, `side: 'either'` opposing-target mismatches, incomplete parameters, or unverified variants.
