# Battle Spirits Eternal — Work Package C.3.1 Completion Report
**Evidence Registry Trustworthiness, Full-Suite Reconciliation & Scope-Controlled Handoff**

**Operating System**: Windows  
**Verified Runtime**: Node.js `v24.16.0` (zero external npm dependencies; pure ESM per `package.json`)  
**Completion Timestamp**: 2026-11-18T17:54:00+05:30  

---

## 1. Executive Summary & C.3 vs C.3.1 Verification Comparison

| Metric | C.3 | C.3.1 | Delta |
|---|---:|---:|---:|
| Full Suite (`node tests/run_all.js`) Suites | 189 | 190 | +1 (`work_package_c3_1_evidence_integrity.test.js`) |
| Full Suite Total Tests | 1,958 | 1,967 | +9 |
| Full Suite Passed | 1,945 | 1,954 | +9 |
| Full Suite Failed | 13 | 13 | 0 (all 13 preserved in `phase4b3_reveal_burst_replace_summon.test.js`) |
| Verified Suites (`node scripts/run_verified_suites.mjs --all`) | 27 suites (565/565) | 28 suites (574/574) | +1 suite, +9 tests, 0 failures |
| `tests/work_package_c3_1_evidence_integrity.test.js` | N/A | 9 / 9 pass | +9 |
| `tests/identity_subsystem_e2e_acceptance.test.js` | 14 / 14 pass | 14 / 14 pass | 0 collisions; 514 shards verified |

---

## 2. Source Changes Actually Made in C.3.1

1. **[scripts/discover_executable_tests.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/discover_executable_tests.mjs)**:
   - Replaced regex-over-comment-stripped-text with a character-by-character JavaScript tokenizer (`tokenizeJs`) handling string literals, template literals (`${...}` brace depth), regex literals, and `//`/`/*...*/` comments.
   - Added brace-balanced callback extraction (`extractRegisteredTests`) rejecting string/template/regex/comment decoys, `test.skip`/`test.todo`, helper-scoped declarations, loop-generated tests, and callbacks without explicit `{ ... }` block bodies.
   - Separated runner membership (`getRunnerMembership`: `inFullRunner` vs `inVerifiedRunner`).
   - Added execution-log verification (`parseExecutionLog` + `verifyExecutableTestReference(..., executionMap)`) rejecting `FAIL`, `SKIP`, and `NOT_EXECUTED` tests.
2. **[scripts/audit_514_cards_exhaustive.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/audit_514_cards_exhaustive.mjs)**:
   - Bound `runExhaustiveAudit()` to `loadExecutionEvidence()` (`reports/work_package_c3_1/verified_suites_all.log` + `final_run_all.log`) and emitted `reports/work_package_c3_1/execution_evidence.json`.
   - Updated `enumerateConditionOccurrences()` to detect unexpected condition locations (`ability.condition`, `clause.op.branch.condition`) and compute `reconciledExactMatch` dynamically without hardcoding `4940`.
3. **[tests/work_package_c3_1_evidence_integrity.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/work_package_c3_1_evidence_integrity.test.js)** & **[scripts/run_verified_suites.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/run_verified_suites.mjs)**:
   - Added 9 adversarial & regression tests (`WPC31-ADV-01..04`, `WPC31-RUN-01`, `WPC31-EXEC-01`, `WPC31-VAR-01`, `WPC31-COND-01`, `WPC31-SHARD-01`).
   - Updated `WPC3-04` and `WPC3-06` in `tests/work_package_c3_evidence_integrity.test.js` for the tokenizer's `calledIdents` API and explicit `null` executionMap isolation.

---

## 3. Reconciliation of the 5 Additional Failures & All 13 Preserved Failures

### 3.1 Root Cause of the 5 Additional Failures in the C.3 Independent Run
The C.3 ZIP omitted five `data/*.json` files (`data/card_artworks.json`, `data/card_implementation_status.json`, `data/shard_manifest.json`, `data/rebirth_catalog.json`, `data/wiki_family_members.json`):
1. **Three `tests/alternate_card_artworks.test.js` failures (`Gate Open, Release` etc.)**: Caused by missing `data/card_artworks.json` in the C.3 ZIP. Verified `13 / 13` passing when present.
2. **RC2 synchronous `getLoadedCardIr` lookup**: Caused by missing `data/shard_manifest.json` in the C.3 ZIP.
3. **Phase 1 classification (`tests/phase1_classification.test.js`)**: Caused by missing `data/card_implementation_status.json` in the C.3 ZIP. Verified `1 / 1` passing when present.

All `data/*.json` files are now explicitly included in `work_package_c3_1_handoff.zip` and verified via clean extraction.

### 3.2 Runtime Version Audit (`v24.16.0` vs `v22.16.0`)
- Verified locally on **Node.js `v24.16.0`** (`C:\Program Files\nodejs\node.exe`). Node.js `v22.16.0` is not installed in this environment (`NO_NVM`), so `v22.16.0` was not re-executed here; however, all 5 additional failures observed on `v22.16.0` are accounted for by the 5 omitted `data/*.json` files in the C.3 ZIP rather than a `v22`/`v24` API incompatibility.

### 3.3 All 13 Remaining Failures (All in `tests/phase4b3_reveal_burst_replace_summon.test.js`)
Every remaining failure is an obsolete fixture or bare shard stub preserved intentionally without weakening:
1. `2.3 REVEAL_CARDS: Undersized and empty deck handling` — bare `{ op: 'REVEAL_CARDS' }` expecting English-text guessing; replaced by `WPC2-REV-03`.
2. `2.4 REVEAL_CARDS: Reveal from Hand preserves hand membership and populates context` — bare `{ op: 'REVEAL_CARDS' }` expecting English-text guessing; replaced by `WPC2-REV-04`.
3. `4.1 Real Shard IR: BS24-X02 (Queen-Merduk) redirects life reduction core to Void` — bare `{ op: 'REPLACEMENT_EFFECT' }` shard intentionally kept `UNSUPPORTED` (`MISSING_REPLACEMENT_SPEC`); replaced by `C1-REG-06`.
4. `4.2 Real Shard IR: SD02-014 (Magic Control Tower) Nexus destruction redirects to field` — `{ op: 'REPLACEMENT_EFFECT', trigger: 'NEXUS_DESTROYED' }` without `replaces`/`replacementZone`, kept `UNSUPPORTED`.
5. `4.6 Real Shard IR: BS42-052 (Yamane) redirects opponent void core addition to player Life` — fixture leaves `voidCores = 0`, failing `CORR-CORE-01` Void conservation; replaced by `WPC2-REP-01`.
6. `4.7 Real Shard IR: BS24-013 (ThirdEyes-Snake) redirects opponent void core to this spirit` — fixture leaves `voidCores = 0`, failing `CORR-CORE-01` Void conservation; replaced by `WPC2-REP-02`.
7. `6.2 Normal SUMMON: Cost payment success followed by failed LV1 placement restores exact core state` — `CORE_MOVED` listener deletes reserve cores and expects rollback to invent cores; replaced by `WPC2-TXN-02`.
8. `6.3 Normal SUMMON: Failed Soul Core placement restores exact core state` — expects legacy `SOUL_CORE_PLACEMENT_FAILED` after listener wipes `reserve.soul`; replaced by `WPC2-TXN-02`.
9. `7.1 SUMMON_FREE: Forced post-payment placement failure restores exact complete state` — listener deletes reserve cores and expects `5` instead of conserved `2`; replaced by `WPC2-TXN-02`.
10. `8.2 REPLACEMENT_EFFECT: Valid replacement target stack attaches core cleanly` — fixture leaves `voidCores = 0`; replaced by `WPC2-REP-02`.
11. `8.3 REPLACEMENT_EFFECT: Life redirection emits LIFE_RECOVERED with correct metadata` — fixture leaves `voidCores = 0`; replaced by `WPC2-REP-01`.
12. `10.3 Field replacement with a valid targetStackId transfers cores cleanly` — fixture leaves `voidCores = 0`; replaced by `WPC2-REP-02`.
13. `13.6 Transaction and event consistency: No false SUMMONED event and verified rollback causes` — expects `cause === 'rollback'` (engine emits `cause === 'summon_rollback'`) and core-inventing reserve `3`; replaced by `WPC2-TXN-02`.

---

## 4. Scope Audit of `WPC-4C4-OPS`, `WPC-4C5-COND`, `WPC-4C6-COMP`

`tests/work_package_c_ops_conditions_compiler.test.js` (containing `WPC-2.1`, `WPC-2.2`, `WPC-4C4-OPS`, `WPC-4C5-COND`, `WPC-4C6-COMP`) was authored during **Work Package C (Phases 4C.4–4C.6)** prior to C.1/C.2/C.3. It exercises `engine/selectors.js`, `engine/ops/index.js`, `engine/conditions.js`, `engine/flow.js`, and `compiler/index.js`, does not alter the 514 shards or identity algorithm, and executes and passes in both `tests/run_all.js` and `scripts/run_verified_suites.mjs --all`. No C.4 expansion was performed in C.3.1.

---

## 5. Evidence Totals, Condition Reconciliation & Shard Integrity

- **Operations (`node scripts/audit_514_cards_exhaustive.mjs`, exit `0`)**:
  - **288** unique op names (`144` implemented + `144` missing, `reconciledSumCheck: true`).
  - **297** unique parameterized variants: `21` verified, `1` partial, `122` unverified, `152` unsupported, `1` manual review.
  - **51,734** op instances: `SEMANTICALLY_VERIFIED: 18,969`, `HANDLER_PRESENT_UNVERIFIED: 28,503`, `NEEDS_MANUAL_REVIEW: 2,565`, `HANDLER_MISSING: 1,007`, `PARAMETERS_INCOMPLETE: 538`, `PARTIALLY_SUPPORTED: 152`.
- **Conditions (`4,940` total, `reconciledWithAuthoritativeEnumerator: true`, `unexpectedLocations: []`)**:
  - Locations: `header.condition: 0`, `clause.condition: 4,534`, `clause.op.condition: 406`.
  - Breakdown: `SEMANTICALLY_VERIFIED: 1,533`, `PARSED_EVALUABLE_UNVERIFIED: 1,140`, `PARSE_FAILURE: 2,267`, `PARSED_UNSUPPORTED_TYPE: 0`.
- **Abilities (`36,422`)**: `FULLY_SUPPORTED: 7,274`, `PARTIAL: 12,884`, `NEEDS_MANUAL_REVIEW: 15,294`, `UNIMPLEMENTED: 970`.
- **Card Status Proposal (`15,398`)**: `VANILLA_NO_EFFECT: 414`, `FULLY_SUPPORTED: 844`, `PARTIAL: 3,074`, `NEEDS_MANUAL_REVIEW: 11,001`, `UNIMPLEMENTED: 65`.
- **Shard Migration Integrity**: Preserved the 5 C.3 migrated records (`BS69-036`, `BS64-X04`, `BS20-X01`, `BS42-052`, `BS24-013`) with `0` changes to any other shards; `tests/identity_subsystem_e2e_acceptance.test.js` passed `14 / 14` (`0` collisions).

---

## 6. Verification Commands & Clean-Extraction Results

Sequential commands executed on Windows, Node.js `v24.16.0`:
1. `node scripts/run_verified_suites.mjs --all` -> Exit `0` (`28` suites, `574 / 574` passing)
2. `node tests/run_all.js` -> Exit `1` (`190` suites, `1,967` tests, `1,954` passing, `13` preserved failures in `phase4b3_reveal_burst_replace_summon.test.js`)
3. `node scripts/audit_514_cards_exhaustive.mjs` -> Exit `0`
4. `node --test tests/work_package_c3_1_evidence_integrity.test.js tests/identity_subsystem_e2e_acceptance.test.js` -> Exit `0` (`23 / 23` passing)

## 7. Remaining Limitations
- `144` unique operation types (`1,007` instances) remain unimplemented.
- `122` implemented operation variants (`28,503` instances) lack executable variant-level semantic tests passing strict tokenizer/API/execution checks.
- `2,267` condition occurrences fail structured parsing (`PARSE_FAILURE`), and `97` `LEGACY_CONTEXT_CONDITION` occurrences remain unverified.
- Node.js `v22.16.0` was not locally available for direct re-execution.
