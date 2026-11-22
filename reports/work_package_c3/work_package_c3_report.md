# Battle Spirits Eternal — Work Package C.3 Completion Report
**Evidence Registry Integrity, Shard Compatibility & Complete Regression Reproduction**

**Operating System**: Windows  
**Runtime**: Node.js `v24.16.0` (zero external npm dependencies; pure ESM per `package.json`)  
**Date**: 2026-11-18  

---

## 1. C.2 vs C.3 Test-Result Comparison

| Metric | C.2 Final | C.3 Final | Delta |
|---|---:|---:|---:|
| Full Suite (`node tests/run_all.js`) Suites | 188 | 189 | +1 (`work_package_c3_evidence_integrity.test.js`) |
| Full Suite Total Tests | 1,949 | 1,958 | +9 |
| Full Suite Passed | 1,933 | 1,945 | +12 (+3 migrated shards, +9 new C.3 tests) |
| Full Suite Failed | 16 | 13 | -3 (`2.1`, `2.2`, `4.5` now pass) |
| Verified Suites (`node scripts/run_verified_suites.mjs --all`) | 26 suites (556/556) | 27 suites (565/565) | +1 suite, +9 tests, 0 failures |
| `tests/identity_subsystem_e2e_acceptance.test.js` | 14 / 14 | 14 / 14 | 0 collisions; 514 shards verified |

---

## 2. Executable Evidence Registry Design & Limitations

- **Executable Test Discovery (`scripts/discover_executable_tests.mjs`)**:
  - Replaced `content.includes(id)` with `stripJsComments()` (JS-lexer comment stripping preserving string/template literals) + `extractRegisteredTests()` (matching non-skipped `test(...)` / `it(...)` registrations, rejecting `test.skip` / `test.todo` and commented-out tests).
  - Enforces runner inclusion via `isTestFileInRunner()` against `tests/run_all.js` and `scripts/run_verified_suites.mjs`.
  - Verifies that matched test bodies contain `assert.` checks and invoke declared production APIs (`OP_PROD_APIS` / `COND_PROD_APIS`).
  - **Limitation**: Static body inspection cannot prove that every runtime branch inside a loop-generated test (e.g. `tests/real_card_semantic_validation.test.js` `for`-loop specs) covers all edge cases; therefore loop-generated tests are excluded from automatic `SEMANTICALLY_VERIFIED` credit, keeping the proposal conservative.
- **Zero Default-Variant Leakage**:
  - Removed the `regEntry.variants?.[\`${opName}:default\`]` fallback in `scripts/audit_514_cards_exhaustive.mjs`. Only exact variant matches (`regEntry.variants?.[variant]`) receive `SEMANTICALLY_VERIFIED` (`WPC3-04`).

---

## 3. Variant-Level Operation & Condition Evidence Totals

### 3.1 Operations & Variants (`node scripts/audit_514_cards_exhaustive.mjs`)
- **Shards**: `514` | **Compiled Card Records**: `15,398` (`14,609` unique base card numbers)
- **Unique Operation Names**: `288` = `144` implemented + `144` missing (`reconciledSumCheck: true`)
- **Unique Parameterized Variants**: `297` (`30` verified, `1` partial, `113` unverified, `152` unsupported, `1` manual review)
- **Operation Instance Breakdown (`51,734` total)**:
  - `SEMANTICALLY_VERIFIED`: `22,893`
  - `HANDLER_PRESENT_UNVERIFIED`: `24,579`
  - `NEEDS_MANUAL_REVIEW`: `2,565`
  - `HANDLER_MISSING`: `1,007`
  - `PARAMETERS_INCOMPLETE`: `538`
  - `PARTIALLY_SUPPORTED`: `152`

### 3.2 Condition Occurrence Reconciliation (`4,940` vs `4,534`)
- `enumerateConditionOccurrences()` reconciles **100% (`4,940 === 4,534 + 406`)**:
  - `header.condition`: `0`
  - `clause.condition`: `4,534`
  - `clause.op.condition`: `406` (omitted in C.2; itemized in `reports/work_package_c3/condition_reconciliation_diff.json`)
- **Condition Evidence Breakdown (`4,940` total)**:
  - `SEMANTICALLY_VERIFIED`: `1,533`
  - `PARSED_EVALUABLE_UNVERIFIED`: `1,140` (including `97` `LEGACY_CONTEXT_CONDITION` instances)
  - `PARSE_FAILURE`: `2,267`
  - `PARSED_UNSUPPORTED_TYPE`: `0`

### 3.3 Conservative Ability, Card & Manual-Review Totals
- **Abilities (`36,422` total)**: `FULLY_SUPPORTED: 8,576`, `PARTIAL: 13,377`, `NEEDS_MANUAL_REVIEW: 13,499`, `UNIMPLEMENTED: 970`.
- **Card Status Proposal (`15,398` total)**: `VANILLA_NO_EFFECT: 414`, `FULLY_SUPPORTED: 1,035`, `PARTIAL: 3,711`, `NEEDS_MANUAL_REVIEW: 10,173`, `UNIMPLEMENTED: 65`.

---

## 4. Disposition of the 16 C.2 Failures & Shard Migration Diff

- **3 Resolved via Targeted Shard Migration (`scripts/migrate_c3_shards.mjs`, `reports/work_package_c3/shard_migration_diff.json`)**:
  - `2.1` (`BS69-036` in `BS69.json`), `2.2` (`BS64-X04` in `BS64.json`), `4.5` (`BS20-X01` in `BS20.json`) — plus `BS42-052` (`BS42.json`) and `BS24-013` (`BS24.json`) — were deterministically recompiled with `compileCard`, updating `data/per_shard_validation_inventory.json` SHA-256 hashes and pinned `uniqueSemanticIds` (`18,476 -> 18,477`, `0` collisions).
- **13 Preserved Historical Failures in `tests/phase4b3_reveal_burst_replace_summon.test.js`** (with passing replacement tests):
  - `2.3`, `2.4`: bare `{ op: 'REVEAL_CARDS' }` expecting runtime English-text guessing (replaced by `WPC2-REV-03`, `WPC2-REV-04`).
  - `4.1` (`BS24-X02`), `4.2` (`SD02-014`): bare/incomplete replacement shards kept explicitly unsupported (`MISSING_REPLACEMENT_SPEC`).
  - `4.6` (`BS42-052`), `4.7` (`BS24-013`), `8.2`, `8.3`, `10.3`: obsolete Void-source fixtures with `voidCores = 0` (replaced by `WPC2-REP-01`, `WPC2-REP-02`, `WPC2-TXN-03`).
  - `6.2`, `6.3`, `7.1`, `13.6`: obsolete rollback fixtures deleting reserve cores in `CORE_MOVED` listeners and expecting core-inventing restoration (replaced by `WPC2-TXN-01`, `WPC2-TXN-02`).

---

## 5. Clean-Extraction Reproduction & Commands

The C.3 ZIP (`work_package_c3_handoff.zip`) includes all application files (`app.js`, `server.js`, `battle_arena.js`, `engine_adapter.js`, `multiplayer_service.js`, `firebase_service.js`, `wasm_db.js`, HTML/CSS/UI directories, `standard_decks_data.json`, `card_effects_db.json`, `keywords_data.json`, `filters_data.json`, `featured_x_rares.json`, `ai_weights.json`, `scratch/`, `compiler/`, `engine/`, `scripts/`, `tests/`, `data/` including all 514 shards, `reports/work_package_c1..c3/`, and `MANIFEST.txt`).

Sequential verification commands (exit codes):
1. `node scripts/audit_514_cards_exhaustive.mjs` -> Exit `0`
2. `node scripts/run_verified_suites.mjs --all` -> Exit `0` (`27` suites, `565 / 565` passing)
3. `node tests/run_all.js` -> Exit `1` (`189` suites, `1,958` tests, `1,945` passing, `13` preserved historical failures in `tests/phase4b3_reveal_burst_replace_summon.test.js`)

## 6. Known Limitations
- `144` unique operation types (`1,007` instances) remain unimplemented.
- `113` implemented operation variants (`24,579` instances) lack executable variant-level semantic tests.
- `2,267` condition occurrences fail structured parsing (`PARSE_FAILURE`), and `97` `LEGACY_CONTEXT_CONDITION` occurrences remain unverified.
