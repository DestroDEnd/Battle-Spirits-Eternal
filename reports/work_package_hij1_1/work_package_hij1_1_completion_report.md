# Battle Spirits Eternal — Work Package H/I/J.1.1 Completion Report

**Project:** Battle Spirits Eternal  
**Active Directory:** `C:\Users\namis\Downloads\BSP`  
**Base Git Revision:** `0e3524a30738009e1e233d8ab9e6c7b562e07074`  
**Runtime Environment:** Node.js `v24.16.0` (Windows)  
**Scope:** Genuine Card-Level End-to-End Validation, Semantic Assertions & Evidence Integrity Correction  
**Deliverables:**  
- `reports/work_package_hij1_1/work_package_hij1_1_completion_report.md`  
- `reports/work_package_hij1_1/work_package_hij1_1_handoff.zip` (with root `MANIFEST.txt` SHA-256 + byte size manifest)

---

## 1. Executive Summary

Work Package **H/I/J.1.1** audited and replaced the generic H/I/J.1 real-card test helper with a strict provenance, semantic comparison, and exact-assertion E2E framework (`tests/helpers/card_e2e_framework.mjs`) without mass-recompiling shards or mass-promoting card statuses.

Key results:
1. **Audit of All 215 Previous E2E Tests (`reports/work_package_hij1_1/test_classification_migration.json`):**
   - **208 / 215** tests had semantic compiler-to-stored-IR alignment (`compileCard(det)` vs stored shard IR) and were upgraded from generic snapshot assertions (`snapBefore !== snapAfter || events.length > 0`) to exact semantic + negative assertions (`158` `[CARD_ABILITY_E2E]` + `50` `[CARD_RULES_E2E]`).
   - **7 / 215** tests (`HIJ1-E2E-035`, `HIJ1-E2E-156`, `HIJ1-RULE-028`, `HIJ1-RULE-032`, `HIJ1-RULE-033`, `HIJ1-RULE-034`, `HIJ1-RULE-043`) exhibited compiler-to-IR bracket mismatches (`KEYWORD_RULE` swallowing `[Shamanism]`, `[Accel]`, `[Advent]`, `[Shiny Hearts]`, etc.) and were honestly reclassified to **`[CARD_IR_EXECUTION]`** (`compiler_to_ir_fidelity.json`).
   - **22** previously passing cards failed exact semantic assertions under strict provenance/targeting checks (`16` `BP_DEBUFF` 1-clause abilities with dangling `PREVIOUS_TARGET`/missing `target`, `4` Trash-to-Hand `BOUNCE` abilities missing `from: 'grave'`, `1` `MILL` ability `BS32-XX02` missing `side: 'self'` & condition, `1` `REFRESH` ability `BS02-106` ignoring `target.cost: 2`). Rather than faking `ctx.previousTarget` or weakening assertions, those **22** cards were recorded as `BLOCKED_SOURCE_DATA` and replaced with **22** verified compiler-faithful `CARD_ABILITY_E2E` cards.
2. **Real Engine Defect Found & Fixed (`engine/ops/index.js`):**
   - Exact semantic testing of `BS04-082` (`HIJ1-RULE-022`) and `BS05-076` (`HIJ1-RULE-023`) exposed that `LIMIT_DECK_DISCARD` stored the literal `'self'` in `mod.targetSide` instead of resolving `'self' -> controller`, causing `MILL` to bypass the cap. Fixed `resolvedTargetSide` in `engine/ops/index.js`.
3. **Evidence Registry & Adversarial Hardening (`scripts/discover_executable_tests.mjs`, `tests/work_package_hij1_1_evidence_adversarial.test.js`):**
   - `verifyExecutableTestReference` now enforces test classification checks, rejects `executeOp()` bypasses and generic fallback assertions (`snapBefore !== snapAfter`, `events.length > 0 ||`) inside `CARD_ABILITY_E2E` / `CARD_RULES_E2E`, and verifies `card_e2e_framework.mjs` assertion calls.
   - Added `HIJ1_1-EVD-01` and `HIJ1_1-EVD-02` proving weak, prefix-only, null-map, stale, or bypassing evidence fails closed.

---

## 2. Test Classifications & Coverage Metrics (Antigravity-Executed Results)

*Note: All results below were executed by Antigravity in the local workspace; independent external audit will be performed separately.*

### 2.1 Distinct Test Classification Counts
| Classification | Count | Suite / Source |
|---|---:|---|
| `CARD_ABILITY_E2E` | **158** | `tests/work_package_hij_real_cards_e2e.test.js` |
| `CARD_RULES_E2E` | **50** | `tests/work_package_hij_real_cards_e2e.test.js` |
| `CARD_IR_EXECUTION` | **7** | `tests/work_package_hij_real_cards_e2e.test.js` |
| `OPERATION_VARIANT` | **11** | `tests/work_package_hij1_operation_variants.test.js` |
| `CONDITION_SEMANTICS` | **4** | `tests/work_package_hij1_conditions_truth_table.test.js` |
| `ADVERSARIAL` (`H/I/J.1` + `H/I/J.1.1`) | **4** | `tests/work_package_hij1_adversarial_determinism.test.js`, `tests/work_package_hij1_1_evidence_adversarial.test.js` |
| `INVARIANT` | **1** | `tests/work_package_hij1_adversarial_determinism.test.js` |
| `INTEGRATION` (`H/I/J` compiler/op) | **9** | `tests/work_package_hij_operations_compiler_integration.test.js` |

### 2.2 Suite Execution Totals (Before vs. After H/I/J.1.1)
| Check | H/I/J.1 Baseline | H/I/J.1.1 Final | Result |
|---|---:|---:|---|
| `node scripts/run_verified_suites.mjs --all` | 919 / 919 | **921 / 921** | **PASS (0 fail, 0 skipped)** |
| `npm test` (`node tests/run_all.js`, 335 suites) | 2,313 / 2,313 | **2,315 / 2,315** | **PASS (0 fail, 0 skipped)** |
| `node --test tests/data_audit.test.js` | 3 / 3 | **3 / 3** | **PASS (0 fail, 0 skipped)** |
| `node scripts/validate_514_shards_exhaustive.mjs` | 514 / 514 (0 collisions) | **514 / 514 (0 collisions)** | **PASS** |

### 2.3 Preserved Operation, Condition & Card Audit Totals (`reports/work_package_fg/shard_audit_summary.json`)
- **Operations (`288` unique, `337` variants):** `183` verified, `16` partial, `117` unverified, `20` unsupported, `1` manual review; `28,655` `SEMANTICALLY_VERIFIED`, `19,695` `HANDLER_PRESENT_UNVERIFIED`, `629` `PARAMETERS_INCOMPLETE`, `190` `PARTIALLY_SUPPORTED`, `2,565` `NEEDS_MANUAL_REVIEW`, `0` `HANDLER_MISSING`.
- **Conditions (`4,940` reconciled):** `3,728` `SEMANTICALLY_VERIFIED`, `97` `PARSED_EVALUABLE_UNVERIFIED`, `1,115` `PARSE_FAILURE`, `25 / 25` `CONDITION_EVIDENCE_REGISTRY` entries verified.
- **Abilities (`36,422`):** `FULLY_SUPPORTED: 13,415`, `PARTIAL: 5,520`, `UNIMPLEMENTED: 0`, `NEEDS_MANUAL_REVIEW: 17,487`.
- **Cards (`15,398`):** `VANILLA_NO_EFFECT: 414`, `FULLY_SUPPORTED: 1,929`, `PARTIAL: 1,218`, `UNIMPLEMENTED: 0`, `NEEDS_MANUAL_REVIEW: 11,837`.

---

## 3. Remaining Unsupported / Unverified Scope & Known Limitations

1. **Reclassified `[CARD_IR_EXECUTION]` (`7` cards):** Compiler bracket-keyword fallback still overrides `ACTIVATE_EFFECT_ACTION`, `TRIGGERED_WATCHER`, `DECK_BUILDING_RULE`, `ADVENT_RULE`, and `ADD_FAMILY` on those 7 cards; stored IR is valid and tested, while fresh compiler alignment remains unfixed.
2. **Blocked Source/IR Cases (`22` cards):** Documented in `reports/work_package_hij1_1/test_classification_migration.json` (`16` single-clause `BP_DEBUFF` abilities with `PREVIOUS_TARGET`/missing `target`, `4` Trash-to-Hand `BOUNCE` abilities missing `from: 'grave'`, `BS32-XX02` `MILL` missing `side: 'self'`/condition, `BS02-106` `REFRESH` cost filter).
3. **Evidence Registry Unverified Entries (`19 / 221`):** Explicitly unverified/manual-review variants (including `MODIFY_LIFE`) remain unpromoted.
4. **Incomplete Parameters & Unparsed Conditions:** `629` incomplete-parameter clauses and `1,115` condition parse failures remain fail-closed.

---

## 4. Reproduction Commands (Clean Extraction)

```powershell
node -v
# v24.16.0

node scripts/validate_514_shards_exhaustive.mjs
node scripts/audit_514_cards_exhaustive.mjs
node --test tests/data_audit.test.js
node scripts/run_verified_suites.mjs --all
npm test
```
