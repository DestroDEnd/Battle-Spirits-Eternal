# Phase 4C.2.1 — Relative Comparison Audit Reconciliation Report

**Date:** November 15, 2026  
**Phase:** 4C.2.1  
**Target:** Defect Reconciliation & Source-Level Verification of Phase 4C.2 (`DEF-REL-TARGET-01`)  
**Status:** COMPLETE & VERIFIED  

---

## Executive Summary

Phase 4C.2 implemented compiler and runtime support for **`DEF-REL-TARGET-01`** (relative comparison target filters across BP, cost, core, level, and symbol metrics). An independent audit of Phase 4C.2 deliverables identified four key areas requiring reconciliation:
1. Discrepancies between the preliminary narrative summary in `phase4c2_completion_report.md` and the verified ability-level ledger in `phase4c2_affected_card_validation.csv`.
2. Seven abilities whose corrected IR contained `UNSUPPORTED` operations resulting from coexisting clauses.
3. An empty `phase4c2_unsupported_patterns.csv` table that tracked "unsupported comparison patterns" rather than tracking all unsupported operations present across the 235 corrected IR records.
4. Test accounting that double-counted `tests/golden_compiler.test.js` alongside the 154 git-tracked baseline suites.

This phase performed an exhaustive, evidence-based audit and reconciliation without modifying the production relative comparison architecture. All discrepancies have been resolved, verified, and independently documented in machine-readable ledgers.

---

## 1. Classification & Distribution Reconciliation (All 235 Records)

Using `phase4c2_affected_card_validation.csv` as the canonical ability-level ledger, all metric distributions have been re-tallied, reconciled against `phase4c2_comparison_pattern_inventory.csv`, and corrected against the previous narrative report.

### 1.1 Comparison Property Reconciled Counts

The preliminary narrative report in Phase 4C.2 included early draft counts (BP: 147, COST: 79, SYMBOLS: 1). Re-aggregating the 235 verified ability records establishes the true distribution:

| Comparison Property | Verified Ability Ledger | Old Report Narrative | Pattern Inventory | Reconciled Delta & Status |
| :--- | :---: | :---: | :---: | :--- |
| **BP** | **146** | 147 | 146 | **-1** in old report (Draft estimate corrected to 146) |
| **COST** | **78** | 79 | 78 | **-1** in old report (Draft estimate corrected to 78) |
| **CORES** | **6** | 6 | 6 | **0** (Exact agreement) |
| **SYMBOLS** | **3** | 1 | 3 | **+2** in ledger (`BS66-X01#a2`, `BSC50-005#a2`, `CB27-X01#a1`) |
| **LEVEL** | **2** | 2 | 2 | **0** (Exact agreement: `SD02-012#a1`, `SD23-X01#a1`) |
| **TOTAL** | **235** | **235** | **235** | **100.0% Reconciled** |

### 1.2 Comparison Operator Reconciled Counts

| Comparison Operator | Verified Ability Ledger | Old Report Narrative | Pattern Inventory | Status |
| :--- | :---: | :---: | :---: | :--- |
| **LTE** (Inclusive $\le$) | **231** | 231 | 231 | Exact agreement (98.3%) |
| **LT** (Strictly $<$) | **4** | 4 | 4 | Exact agreement (`STRIKE-SIEGWURM#a1`, `BS26-008#a1`, `CB20-CP04#a4`, `SD23-X01#a1`) |
| **TOTAL** | **235** | **235** | **235** | **100.0% Reconciled** |

### 1.3 Reference Entity Reconciled Counts

The preliminary narrative report undercounted `self` by 1 and overcounted `allied_spirit` by 1:

| Reference Entity | Verified Ability Ledger | Old Report Narrative | Pattern Inventory | Reconciled Status |
| :--- | :---: | :---: | :---: | :--- |
| **self** | **189** | 188 | 189 | Reconciled (+1 in ledger vs draft narrative) |
| **target** | **33** | 33 | 33 | Exact agreement |
| **effect_card** | **11** | 11 | 11 | Exact agreement (discarded or revealed card reference) |
| **allied_spirit** | **1** | 2 | 1 | Reconciled (`CB33-075#a1` is sole confirmed allied reference) |
| **battling** | **1** | 1 | 1 | Exact agreement (`BS34-056#a0`) |
| **TOTAL** | **235** | **235** | **235** | **100.0% Reconciled** |

### 1.4 Target Operation Distribution (Holding Comparison)

Across all 235 abilities, relative comparisons are embedded into target filters across 9 distinct operations:

| Target Operation | Ability Count | Percentage | Primary Function |
| :--- | :---: | :---: | :--- |
| **DESTROY** | 161 | 68.51% | Direct destruction with comparison filter |
| **BOUNCE** | 49 | 20.85% | Hand bounce or deckbottom bounce with comparison filter |
| **UNBLOCKABLE** | 16 | 6.81% | Combat blocking restriction on opposing blocker eligibility |
| **CONDITION** | 3 | 1.28% | Gating / trigger condition checking relative metrics |
| **EXHAUST** | 2 | 0.85% | Exhaustion target selection with comparison filter |
| **TARGET** | 1 | 0.43% | Explicit intermediate target selection (`26RBS02-X16#a1`) |
| **GRANT_ABILITY:DESTROY** | 1 | 0.43% | Granted destruction ability with comparison (`BS10-X06#a2`) |
| **EXHAUSTED_BLOCK** | 1 | 0.43% | Block while exhausted conditional on comparison |
| **TRIGGER_CONDITION** | 1 | 0.43% | Ultimate Trigger hit condition with comparison |
| **TOTAL** | **235** | **100.0%** | All 235 operations fully accounted for |

### 1.5 Candidate Card Type & Ownership Distributions

- **Candidate Ownership:** 235 / 235 (100.0%) target opposing cards (`side: 'opp'`).
- **Candidate Card Types:**
  - Spirit only: **146** (62.13%)
  - Spirit or Ultimate: **87** (37.02%)
  - Spirit or Nexus: **2** (0.85% — `CB15-X03#a1`, `SD63-TX01#a1`)
  - Total: **235** (100.0%)

All distributions are fully reconciled in [phase4c2_1_classification_reconciliation.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_classification_reconciliation.csv).

---

## 2. Investigation of Seven Unsupported IR Records

Seven cards among the 235 confirmed affected abilities contain an `UNSUPPORTED` operation in their corrected IR. Each record was inspected individually to determine whether the unsupported operation stems from the relative comparison or from a coexisting clause.

### Card-by-Card Clause Breakdown

#### 1. `BSC51-CP01#a2` (［Monochrome Fantasia］Rei-Ohba)
- **Canonical Printed Text:**  
  *"You can destroy an opposing Spirit with a BP equal or inferior to this Spirit's. This effect can't be prevented by opposing effects."*
- **Clause 1 (Relative Comparison):** *"You can destroy an opposing Spirit with a BP equal or inferior to this Spirit's"* $\rightarrow$ Compiled to `DESTROY` with `filters.comparison: { property: 'BP', operator: 'LTE', reference: 'self' }`.
- **Clause 2 (Coexisting):** *"This effect can't be prevented by opposing effects"* $\rightarrow$ Compiled to `UNSUPPORTED` (`UNSUPPORTED_EFFECT_PROTECTION: effect cannot be prevented by opposing effects`).
- **Comparison Support:** **CORRECTED**
- **Full Ability Support:** **PARTIAL_SUPPORT** (Pending unpreventable effect engine support)

#### 2. `CB17-X05#a1` (Kamen Rider OOO Super Tatoba Combo［2］)
- **Canonical Printed Text:**  
  *"Destroy an opposing Spirit with a cost equal or inferior to this Spirit's. This effect can't be prevented by opposing effects."*
- **Clause 1 (Relative Comparison):** *"Destroy an opposing Spirit with a cost equal or inferior to this Spirit's"* $\rightarrow$ Compiled to `DESTROY` with `filters.comparison: { property: 'COST', operator: 'LTE', reference: 'self' }`.
- **Clause 2 (Coexisting):** *"This effect can't be prevented by opposing effects"* $\rightarrow$ Compiled to `UNSUPPORTED` (`UNSUPPORTED_EFFECT_PROTECTION`).
- **Comparison Support:** **CORRECTED**
- **Full Ability Support:** **PARTIAL_SUPPORT**

#### 3. `CB25-CX01#a2` (Nu Gundam)
- **Canonical Printed Text:**  
  *"Destroy an opposing Spirit with BP equal or inferior to this Spirit's. While braved to "Amuro", this effect can't be prevented by opposing effects."*
- **Clause 1 (Relative Comparison):** *"Destroy an opposing Spirit with BP equal or inferior to this Spirit's"* $\rightarrow$ Compiled to `DESTROY` with `filters.comparison: { property: 'BP', operator: 'LTE', reference: 'self' }`.
- **Clause 2 (Coexisting):** *"While braved to "Amuro", this effect can't be prevented by opposing effects"* $\rightarrow$ Compiled to `UNSUPPORTED` (`UNSUPPORTED_EFFECT_PROTECTION`).
- **Comparison Support:** **CORRECTED**
- **Full Ability Support:** **PARTIAL_SUPPORT**

#### 4. `CB33-075#a1` (Megidolaon)
- **Canonical Printed Text:**  
  *"Destroy four opposing Spirits/Ultimates with a cost equal or inferior to that of one of your "Persona"/"Navigator" family Spirits. This effect can't be prevented by opposing effects."*
- **Clause 1 (Relative Comparison):** *"Destroy four opposing Spirits/Ultimates with a cost equal or inferior to that of one of your "Persona"/"Navigator" family Spirits"* $\rightarrow$ Compiled to `DESTROY` (count: 4, types: `['Spirit', 'Ultimate']`) with `filters.comparison: { property: 'COST', operator: 'LTE', reference: 'allied_spirit' }`.
- **Clause 2 (Coexisting):** *"This effect can't be prevented by opposing effects"* $\rightarrow$ Compiled to `UNSUPPORTED` (`UNSUPPORTED_EFFECT_PROTECTION`).
- **Comparison Support:** **CORRECTED**
- **Full Ability Support:** **PARTIAL_SUPPORT**

#### 5. `PB41-X01#a0` (Special Aircraft No. 1 Sevenger ［2］)
- **Canonical Printed Text:**  
  *"You can reveal three cards from your decktop. Among them, besides any "Sevenger", add White "Zett"/ "Zero"/ "Geed"/ "Special Aircraft"/ "STORAGE"/ "Zestium", one of each, to the Hand. Discard any remaining cards. You can return to the deckbottom an opposing Spirit with a cost equal or inferior to that of one of the cards added to the Hand via this effect."*
- **Clause 1:** *"You can reveal three cards from your decktop"* $\rightarrow$ `REVEAL_DECKTOP` (count: 3).
- **Clause 2 (Coexisting Complex Filter):** *"Among them, besides any "Sevenger", add White "Zett"/ "Zero"/ "Geed"/ "Special Aircraft"/ "STORAGE"/ "Zestium", one of each, to the Hand"* $\rightarrow$ Compiled to `UNSUPPORTED` (multi-name card search with exception).
- **Clause 3:** *"Discard any remaining cards"* $\rightarrow$ `DISCARD_REVEALED`.
- **Clause 4 (Relative Comparison):** *"You can return to the deckbottom an opposing Spirit with a cost equal or inferior to that of one of the cards added to the Hand via this effect"* $\rightarrow$ Compiled to `BOUNCE` to `DECK_BOTTOM` with `filters.comparison: { property: 'COST', operator: 'LTE', reference: 'effect_card' }`.
- **Comparison Support:** **CORRECTED**
- **Full Ability Support:** **PARTIAL_SUPPORT** (Pending multi-name decktop search compiler pattern)

#### 6. `SD63-TX01#a1` (The ShiningHeavenRideEmperor Dragonic-Arthur)
- **Canonical Printed Text:**  
  *"During this turn, an opposing Spirit/Nexus can't activate its effects, and destroy an opposing Spirit with a BP equal or inferior to this Spirits', or an opposing Nexus. By sending a core from your Red-White dual color Grandwalker Nexus to this Spirit, this effect can't be prevented by opposing effects."*
- **Clause 1:** *"During this turn, an opposing Spirit/Nexus can't activate its effects"* $\rightarrow$ `NEGATE_EFFECT`.
- **Clause 2 (Relative Comparison):** *"and destroy an opposing Spirit with a BP equal or inferior to this Spirits', or an opposing Nexus"* $\rightarrow$ `DESTROY` with `filters.comparison: { property: 'BP', operator: 'LTE', reference: 'self' }`.
- **Clause 3:** *"By sending a core from your Red-White dual color Grandwalker Nexus to this Spirit"* $\rightarrow$ `MOVE_CORE` count 1.
- **Clause 4 (Coexisting):** *"this effect can't be prevented by opposing effects"* $\rightarrow$ Compiled to `UNSUPPORTED` (`UNSUPPORTED_EFFECT_PROTECTION`).
- **Comparison Support:** **CORRECTED**
- **Full Ability Support:** **PARTIAL_SUPPORT**

#### 7. `SD69-X02#a1` (The LotusDivineMace Atharva-Veda)
- **Canonical Printed Text:**  
  *"You can destroy an opposing Spirit/Ultimate with a BP equal or inferior to this Spirit's. By destroying one of your "Creation" family Spirits, this effect can't be prevented by opposing effects."*
- **Clause 1 (Relative Comparison):** *"You can destroy an opposing Spirit/Ultimate with a BP equal or inferior to this Spirit's"* $\rightarrow$ `DESTROY` with `filters.comparison: { property: 'BP', operator: 'LTE', reference: 'self' }`.
- **Clause 2:** *"By destroying one of your "Creation" family Spirits"* $\rightarrow$ `DESTROY` (self cost).
- **Clause 3 (Coexisting):** *"this effect can't be prevented by opposing effects"* $\rightarrow$ Compiled to `UNSUPPORTED` (`UNSUPPORTED_EFFECT_PROTECTION`).
- **Comparison Support:** **CORRECTED**
- **Full Ability Support:** **PARTIAL_SUPPORT**

### Key Finding on Unsupported Operations
1. In **100% of these 7 records**, the relative comparison clause itself is **fully recognized, properly structured, and correctly compiled**.
2. **0 of the 7 unsupported operations** belong to `DEF-REL-TARGET-01`.
3. 6 of the 7 are caused by unpreventable effect protections (`DEF-EFFECT-PROTECTION-01`), and 1 is caused by a multi-name selective search pattern (`DEF-SEARCH-EXCLUDE-01`).
4. These unsupported operations were preserved honestly to avoid emitting no-op pseudo-operations like `UNPREVENTABLE` that lack engine execution semantics.

The complete accounting is recorded in [phase4c2_1_unsupported_operations.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_unsupported_operations.csv).

---

## 3. Reconciled Unsupported Patterns Ledger

In the previous Phase 4C.2 deliverable, `phase4c2_unsupported_patterns.csv` was written as an empty table because it specifically addressed "unsupported comparison patterns" (of which there were zero). However, this created ambiguity because 7 abilities did contain `UNSUPPORTED` operations in their complete IR.

The reconciled ledger [phase4c2_1_unsupported_operations.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_unsupported_operations.csv) provides complete clarity:
- **Unsupported Comparison Patterns:** **0** (All 32 comparison patterns across all 235 cards are fully supported).
- **Unsupported Coexisting Operations in 235 Corrected Cards:** **7** operations across 7 cards (6 unpreventable effect protections, 1 multi-name search/add).
- **Status Classification:** All 7 abilities retain `PARTIAL_SUPPORT` status for the overall card, while their relative comparison filter is verified as `CORRECTED`.

---

## 4. Test Suite Accounting & Deduplication

An audit of the test-results reporting identified that `tests/golden_compiler.test.js` was previously counted twice:
1. `tests/golden_compiler.test.js` is tracked in git and is executed as one of the 154 git-tracked baseline test suites in `tests/`. Its 11 assertions are an integral part of the 1,119 tracked baseline assertions.
2. In the Phase 4C.2 test results table, it was listed both under `SUITE-TRACKED-BASELINE` (154 suites, 1,119 tests) and as a separate entry `SUITE-GOLDEN-COMPILER` (1 suite, 11 tests).

### Reconciled Deduplicated Accounting Table

| Suite Category | Suite Identifier / Path | Unique Suites | Subtests / Assertions | Git Tracked | Double-Counted Previously? | Failures | Skipped | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Tracked Baseline** | `tests/` (154 git-tracked suites) | **154** | **1,119** | YES | NO (Baseline) | 0 | 0 | PASSED |
| *Subset Audit* | `tests/golden_compiler.test.js` | *(1)* | *(11)* | YES | **YES** (Included in 154) | 0 | 0 | PASSED |
| **Phase 4C.1** | `tests/phase4c1_conditional_destruction_immunity.test.js` | **1** | **21** | NO | NO | 0 | 0 | PASSED |
| **Phase 4C.1.1** | `tests/phase4c1_1_coexisting_effects_and_targets.test.js` | **1** | **13** | NO | NO | 0 | 0 | PASSED |
| **Phase 4C.1.2** | `tests/phase4c1_2_final_verification.test.js` | **1** | **4** | NO | NO | 0 | 0 | PASSED |
| **Phase 4C.2** | `tests/phase4c2_relative_comparison_target_filters.test.js` | **1** | **21** | NO | NO | 0 | 0 | PASSED |
| **Subtotal 4C** | Dedicated Phase 4C Suites | **4** | **59** | NO | NO | 0 | 0 | PASSED |
| **TOTAL (DEDUP)**| **All Unique Suites & Assertions** | **158** | **1,178** | **COMBINED** | **0 Double-Count** | **0** | **0** | **100% PASS (Exit 0)** |

The verified deduplicated accounting is saved in [phase4c2_1_test_accounting.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_test_accounting.csv).

---

## 5. Source-Level Verification & Runtime Safety

A comprehensive verification script was executed in `scratch/test_source_level_verification.mjs` to test all runtime and engine paths directly against live engine objects.

### 5.1 Unresolved Reference Safety
A critical requirement of target selection is ensuring that if a reference entity cannot be resolved, candidate selection fails safely rather than selecting arbitrary cards.
- Line 77 of `engine/selectors.js`:
  ```javascript
  if (refValue === null || refValue === undefined) {
    return false;
  }
  ```
- **Empirical Verification:**
  - `ref === 'self'` with empty context $\rightarrow$ `refValue = null` $\rightarrow$ returns `false`.
  - `ref === 'target'` with no previous target $\rightarrow$ `refValue = null` $\rightarrow$ returns `false`.
  - `ref === 'effect_card'` with no discarded/revealed card $\rightarrow$ `refValue = null` $\rightarrow$ returns `false`.
  - `ref === 'allied_spirit'` with 0 spirits on field $\rightarrow$ `refValue = null` $\rightarrow$ returns `false`.
  - `ref === 'battling'` with no combat active $\rightarrow$ `refValue = null` $\rightarrow$ returns `false`.
- **Verdict:** Arbitrary candidates can **never** be selected when reference entities cannot be resolved.

### 5.2 Dynamic Effective Value Resolution
- **BP:** Evaluated via `computeEffectiveBP(state, stack)`, incorporating stack level BP, braved Braves BP, and continuous BP modifications.
- **Cost:** Evaluated via `calculateEffectiveCost(state, card, playerSide)`, reflecting cost reductions and field symbol reduction rules.
- **Cores:** Evaluated via active core tally (`cores.normal + (cores.soul ? 1 : 0)`).
- **Level:** Evaluated via `computeLevel(stack, state)`.
- **Symbols:** Evaluated via `computeSymbols(state, stack).length`.

### 5.3 Multi-Zone Coverage
Filtering via `evaluateComparison` was empirically verified across all supported candidate zones:
1. **Field Stacks** (Spirits / Ultimates): Dynamic BP comparison filtering verified.
2. **Field Braves**: Cost comparison filtering verified.
3. **Field Nexuses**: Cost comparison filtering verified.
4. **Hand Zone**: Cost comparison filtering verified (with hidden information authorization protection).
5. **Trash / Grave Zone**: Cost comparison filtering verified.
6. **Revealed Zone**: Cost comparison filtering verified.
7. **Combat Blocker (`canBlock`)**: Dynamic BP comparison preventing illegal blocks verified.

The source verification audit is recorded in [phase4c2_1_source_verification.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_source_verification.csv).

---

## 6. Phase 4C.2.1 Deliverables Summary

All requested reconciliation deliverables have been generated and validated:

| Deliverable | Description | File Location |
| :--- | :--- | :--- |
| **Reconciliation Report (Markdown)** | Comprehensive phase audit and reconciliation report | [phase4c2_1_reconciliation_report.md](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_reconciliation_report.md) |
| **Classification Reconciliation CSV** | Item-by-item reconciliation of all 235 records across metrics | [phase4c2_1_classification_reconciliation.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_classification_reconciliation.csv) |
| **Unsupported Operations CSV** | Full audit of all 7 unsupported operations in corrected IR | [phase4c2_1_unsupported_operations.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_unsupported_operations.csv) |
| **Test Accounting CSV** | Deduplicated suite and assertion counts (158 suites, 1,178 tests) | [phase4c2_1_test_accounting.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_test_accounting.csv) |
| **Source Verification CSV** | Audit of reference resolution, dynamic evaluation, and safety | [phase4c2_1_source_verification.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c2_1/phase4c2_1_source_verification.csv) |

---

## 7. Scope Boundaries & Next Steps

In strict compliance with the Phase 4C protocol:
- The Phase 4C.2 relative comparison implementation is preserved without alteration.
- No unrelated compiler defects were modified.
- No bulk recompilation of 514 shards was performed.
- No card support statuses were prematurely bulk-upgraded.
- All Phase 4C.1, 4C.1.1, and 4C.1.2 corrections remain 100% active and passing.
- Work is halted pending your explicit review and approval before proceeding to Phase 4C.3.
