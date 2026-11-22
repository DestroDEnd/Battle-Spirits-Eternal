# Phase 4C.2 — Relative Comparison Target Filter Compiler Correction
## Mandatory Pre-Implementation Audit Report

**Phase:** Phase 4C.2  
**Target Defect:** `DEF-REL-TARGET-01` (Relative BP/Cost/Core Comparison Filter Omitted in Target Selection)  
**Timestamp:** 2026-11-14T22:52:00+05:30  
**Scope:** 235 confirmed affected abilities across 235 unique cards  
**Status:** Pre-Implementation Completed & Reconciled  

---

## 1. Executive Summary & Defect Definition

During the Phase 4B.4B and Phase 4B.4B.1 semantic audits, `DEF-REL-TARGET-01` was identified as a critical `SEMANTIC_OMISSION` compiler defect. Specifically, when original card text specifies relative comparison constraints during target selection or removal—such as:
- *"destroy an opposing Spirit with BP equal or inferior to this Spirit's"*
- *"destroy an opposing Spirit with a cost equal or inferior to that Spirit's"*
- *"return an opposing Spirit with a cost equal or inferior to this Spirit's to the Hand"*
- *"exhaust all opposing Spirits/Nexuses with a number of cores on them equal or inferior to this Spirit's"*
- *"can't be blocked by opposing Spirits with a number of cores on them equal or inferior to this Spirit's"*

the compiler regexes matched broad keywords (e.g. `destroy an opposing spirit`, `return opposing spirit to the hand`, `this spirit can't be blocked`) prematurely, omitting the entire comparative qualification. Consequently, the compiled IR emitted unconditional selectors (`target: { side: 'opp', types: ['Spirit'] }`), enabling illegal targeting of any opposing card regardless of BP, cost, cores, level, or symbols.

Phase 4C.2 systematically rectifies this defect by:
1. Auditing all 235 affected abilities and classifying their printed comparison patterns.
2. Formulating a standard structured IR representation (`target.filters.comparison: { property, operator, reference }`).
3. Enhancing `compiler/clause_patterns.js` to preserve relative comparisons across all affected operations (`DESTROY`, `BOUNCE`, `TARGET`, `EXHAUST`, `UNBLOCKABLE`, and gating conditions).
4. Integrating dynamic relative comparison evaluation into `engine/selectors.js` and `engine/continuous.js`.
5. Authoring comprehensive regression tests covering compiler, runtime engine, and real-card validation.

---

## 2. Candidate Set Reconciliation: 235 Confirmed Defects vs Broader Candidate Counts

The audit investigates and clarifies the relationship between the **235 confirmed defective abilities** and the broader candidate numbers (**522 candidate cards / 245 abilities**) cited in audit inventories:

| Dataset / Triage Stage | Cards | Abilities | Criteria & Semantic Scope |
| :--- | :---: | :---: | :--- |
| **Initial Keyword Regex Scan** (*Phase 4B.4B Case C*) | 513 | 522 | Broad text regex searching for any comparative wording (`equal or inferior`, `inferior to`, `compare`, `superior to`) across the entire card database. Included reminder text, combat comparison overrides, blocking rules, and extreme selectors. |
| **DEF-FALLBACK-RULE-01 Triage** | 246 | 247 | Comparative phrasing altering battle resolution mechanics (e.g., *"instead of comparing bp, compare lv"*, *"must block with"*, *"can target and attack"*). Partitioned into dedicated defect `DEF-FALLBACK-RULE-01`. |
| **DEF-SEL-EXTREME-01 Triage** | 41 | 41 | Extremum target selection (e.g., *"with the highest BP"*, *"with the lowest cost"*). Partitioned into dedicated defect `DEF-SEL-EXTREME-01`. |
| **DEF-REL-BP-01 Triage** | 2 | 2 | Blocking restriction on source spirit omitting relative BP filter (*"Spirits with BP inferior to this Spirit's can't block"*). Partitioned into dedicated defect `DEF-REL-BP-01`. |
| **Confirmed DEF-REL-TARGET-01 Inventory** | **235** | **235** | **Strictly target-selection and removal operations (`DESTROY`, `BOUNCE`, `TARGET`, `EXHAUST`, `UNBLOCKABLE`, and gating conditions) omitting relative comparison constraints.** |

### Mathematical and Semantic Reconciliation
$$\text{Initial Broad Candidates (522)} = 235\,(\text{DEF-REL-TARGET-01}) + 247\,(\text{DEF-FALLBACK-RULE-01}) + 41\,(\text{DEF-SEL-EXTREME-01}) + 2\,(\text{DEF-REL-BP-01}) - 3\,(\text{Non-defective/Duplicates}) = 522$$
Every candidate from the initial broad scan is accounted for. The 235 abilities targeted in Phase 4C.2 represent 100% of confirmed `DEF-REL-TARGET-01` instances.

---

## 3. Test Suite & Baseline Assertion Count Reconciliation (1,140 vs 1,119)

Previous phase reports exhibited an apparent discrepancy in the reported baseline assertion/subtest counts (**1,140** versus **1,119**). This audit investigated the underlying test execution logs and harness configuration:

### Audit Findings
1. **Git-Tracked Test Suites**:
   - `git ls-files tests/` lists **155** entries.
   - 1 entry is `tests/run_all.js` (the orchestration test harness).
   - Filtering for test suite files (`*.test.js`) yields exactly **154** executable suites.
2. **Subtest / Assertion Count Baseline**:
   - Running the 154 tracked suites strictly produces exactly **1,119 subtests** (1,119 passing, 0 failing, 0 skipped, exit code 0).
3. **Source of the 1,140 Figure**:
   - In Phase 4C.1, a dedicated test suite `tests/phase4c1_conditional_destruction_immunity.test.js` was introduced containing exactly **21 tests**.
   - $1,119 \text{ (baseline)} + 21 \text{ (Phase 4C.1 suite)} = 1,140 \text{ tests}$.
   - Certain reports cited 1,140 as the total active tests including Phase 4C.1, while others cited 1,119 as the clean tracked baseline prior to Phase 4C.
4. **Current Cumulative Phase 4C Dedicated Tests**:
   - `tests/phase4c1_conditional_destruction_immunity.test.js`: **21 tests**
   - `tests/phase4c1_1_coexisting_effects_and_targets.test.js`: **13 tests**
   - `tests/phase4c1_2_final_verification.test.js`: **4 tests**
   - Pre-4C.2 Cumulative Total: $1,119 + 21 + 13 + 4 = 1,157 \text{ tests}$ (100% PASS).

---

## 4. Comprehensive Pattern Classification of the 235 Confirmed Abilities

All 235 confirmed abilities in `scratch/def_rel_target_235.json` were parsed and classified across property, operator, reference entity, candidate type, and operational context:

### A. Distribution by Compared Property
| Property | Count | Description / Printed Wording Examples |
| :--- | :---: | :--- |
| **BP** | **147** | *"with BP equal or inferior to this Spirit's"*, *"with BP inferior to that Spirit's"* |
| **COST** | **79** | *"with a cost equal or inferior to that Spirit's"*, *"cost equal or inferior to this Spirit's"* |
| **CORES** | **6** | *"number of cores on each of them equal or inferior to this Spirit's"*, *"with fewer cores than..."* |
| **LEVEL** | **2** | *"with a LV inferior to that Spirit's"*, *"with LV inferior to this Ultimate's"* |
| **SYMBOLS** | **1** | *"with a number of symbols equal or inferior to this Spirit's"* |
| **TOTAL** | **235** | **100% Accounted For** |

### B. Distribution by Comparison Operator
| Operator | Count | Semantics & Strictness | Example Printed Phrasing |
| :--- | :---: | :--- | :--- |
| **LTE** | **231** | Inclusive (Less than or equal, $\le$) | *"equal or inferior"*, *"inferior or equal"*, *"less than or equal"*, *"equal or less"* |
| **LT** | **4** | Strict (Strictly less than, $<$) | *"inferior to"*, *"less than"*, *"fewer cores than"*, *"LV inferior"* |
| **TOTAL** | **235** | **100% Accounted For** | |

### C. Distribution by Reference Entity
| Reference Entity | Count | Resolution Context in Engine | Example Cards |
| :--- | :---: | :--- | :--- |
| **Source Self** (`self`) | **188** | Dynamic effective value of the card/stack activating the ability (`context.sourceStack`) | `26RBS02-X16`, `BSCO-003`, `BSCO-023`, `BRAVE-TIGER` |
| **Selected Target** (`target`) | **33** | Dynamic effective value of the entity targeted in a prior clause (`context.previousTarget`) | `BS74-043`, `BS76-057`, `BS42-094`, `BATTLE-SPIRITS-A4528` |
| **Effect Card** (`effect_card`) | **11** | Entity manipulated by prior clause (discarded, returned from trash, revealed, burst) | `BS41-068`, `BS62-059`, `BSC31-047`, `CB01-039`, `PB41-X01` |
| **Allied Spirit** (`allied_spirit`) | **2** | Highest matching value among controller's field satisfying family/name condition | `CB33-075` (Persona/Navigator family) |
| **Battling Spirit** (`battling`) | **1** | Controller's active battling Spirit (`state.combat.attacker` / `blocker`) | `BS34-056` |
| **TOTAL** | **235** | **100% Accounted For** | |

### D. Distribution by Operation
| Target Operation | Count | Percentage |
| :--- | :---: | :---: |
| **DESTROY** | 164 | 69.8% |
| **BOUNCE** | 48 | 20.4% |
| **UNBLOCKABLE** | 16 | 6.8% |
| **EXHAUST** | 4 | 1.7% |
| **CONDITION / TRIGGER** | 2 | 0.9% |
| **TARGET** | 1 | 0.4% |
| **TOTAL** | **235** | **100.0%** |

---

## 5. Audit of Existing Compiler Rules & Root Cause

In `compiler/clause_patterns.js`:
1. **Premature Regex Matching:**
   Lines 462–475 matched `destroy\s+(an?|one|two|\d+)?\s*opposing\s+(spirit|nexus|brave|ultimate)` before any relative comparison regex was evaluated. Consequently, clauses like *"destroy an opposing Spirit with BP equal or inferior to this Spirit's"* were captured by the generic pattern, truncating the comparison condition and producing:
   ```json
   { "op": "DESTROY", "count": 1, "target": { "side": "opp", "types": ["Spirit"] } }
   ```
2. **Missing Bounce Relative Patterns:**
   Line 492 matched `return ... opposing spirit to the hand`, omitting the intermediate comparative phrase.
3. **Unblockable Target Filter Omission:**
   Line 844 matched `this spirit can't be blocked`, emitting `{ op: 'UNBLOCKABLE', target: 'self' }` without inspecting subsequent `by opposing spirits with cores equal or inferior...` conditions.

---

## 6. Structured IR Representation Design

The structured comparison representation is designed to be minimal, safe, and backwards-compatible:

```javascript
target: {
  side: 'opp', // 'opp' | 'self' | 'either'
  types: ['Spirit'], // ['Spirit'] | ['Spirit', 'Ultimate'] | ['Nexus'] | etc.
  filters: {
    state: 'EXHAUSTED', // optional static filter
    comparison: {
      property: 'BP', // 'BP' | 'COST' | 'CORES' | 'LEVEL' | 'SYMBOLS'
      operator: 'LTE', // 'LTE' | 'LT' | 'GTE' | 'GT' | 'EQ'
      reference: 'self' // 'self' | 'target' | 'battling' | 'effect_card' | 'allied_spirit'
    }
  }
}
```

### Distinction Between Printed and Effective Values
Card text refers to the active game-state value unless explicitly stating "base" or "printed":
- **BP**: Evaluated via `computeEffectiveBP(state, stack)`, taking into account level, core count, brave additions, and active BP modifiers.
- **Cost**: Evaluated via `calculateEffectiveCost(state, card, controller)`.
- **Cores**: Evaluated via active core count on the stack (`stack.cores`).
- **Level**: Evaluated via `computeLevel(stack, state)`.
- **Symbols**: Evaluated via `computeSymbols(state, stack).length`.

If reference value cannot be determined (e.g. source card missing from field when required, or no prior target selected), no candidates match, preventing arbitrary target selection.

---

## 7. Implementation & Verification Plan

1. **Compiler Enhancement (`compiler/clause_patterns.js`):**
   - Integrate `parseRelativeComparison(text)` to extract `{ property, operator, reference }`.
   - Update `DESTROY`, `BOUNCE`, `TARGET`, `EXHAUST`, `UNBLOCKABLE`, and condition handlers to attach `filters.comparison`.
   - Preserve existing candidate counts (`count`, `upTo`), types (`Spirit`, `Ultimate`, `Nexus`), and side (`opp`, `either`).
2. **Engine Selector Integration (`engine/selectors.js`):**
   - In `queryCandidates`, inspect `filters.comparison` for all candidate cards (field stacks, braves, nexuses, hand/trash cards).
   - Evaluate candidates against resolved `refValue` according to `operator`.
   - In `executeTargeting`, pass through comparison filters seamlessly.
3. **Engine Combat Integration (`engine/continuous.js`):**
   - In `canBlock`, evaluate `f.comparison` on `UNBLOCKABLE` modifiers against the attacking stack.
4. **Deliverables Generation:**
   - `phase4c2_comparison_pattern_inventory.csv`
   - `phase4c2_affected_card_validation.csv`
   - `phase4c2_ir_diff.csv`
   - `phase4c2_unsupported_patterns.csv`
   - `phase4c2_regression_test_results.csv`
   - `phase4c2_completion_report.md` (and companion PDF)
5. **Comprehensive Verification:**
   - Execute dedicated suite `tests/phase4c2_relative_comparison_target_filters.test.js`.
   - Execute full tracked test suite (154 suites, 1,119 baseline tests + Phase 4C tests) to guarantee 100% passing rate and 0 regressions.
