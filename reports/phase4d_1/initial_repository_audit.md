# Phase 4D.1 Initial Repository Audit & Baseline Verification Report
**Generated At:** 2026-11-21T09:55:00.000Z  
**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Execution Environment:** Antigravity / Node.js 24 / Windows_NT  
**Standard:** Independent Inspection, Zero Assumptions, Strict Defect Validation  

---

## 1. Executive Summary

This independent repository audit fulfills Section 0 of the Phase 4D.1 directive. Every claim, finding, metric, and implementation file from previous phases has been inspected in the active codebase before making source code modifications.

### Audit Verdict Summary:
- **Finding A (Browser Test Shortcuts):** **CONFIRMED DEFECT.** `tests/real_browser_arena.test.js` lines 282–355 manually insert opponent spirits into state (`s.opponent.field = [...]`), manually filter legal candidates, bypass engine targeting by calling `promptStructuredDecision` directly, and manually mutate field and trash counts.
- **Finding B (Opcode Semantic Evidence Methodology):** **CONFIRMED DEFECT.** `scripts/generate_phase4d_work_package_d.mjs` lines 171–183 classify opcodes as `SEMANTICALLY_VERIFIED` merely if `opsFile.includes(...)` is true and a test file contains the opcode name string, without runtime execution telemetry.
- **Finding C (Master Test Runner Disposition Flaw):** **CONFIRMED DEFECT.** `scripts/run_master_verification.mjs` lines 350–356 automatically assign `STANDALONE_VERIFIED` to unexecuted test files based on filename heuristics rather than actual execution evidence.
- **Finding D (Card Support Matrix Derivation):** **CONFIRMED DEFECT.** Card support classifications in previous reports inherited handler-presence checks rather than empirical execution telemetry.
- **Finding E (Corpus Population Reconciliation):** **CONFIRMED & MATHEMATICALLY REPRODUCED.** All population discrepancies between detailed cards (14,443), unique shard cards (14,609), physical shard instances (15,398), and SQLite `cards_v2` (14,611) have been reconciled down to the individual card.

---

## 2. Independent Corpus Reconciliation Metrics

| Dataset / Table | Record Count | Scope / Source File | Discrepancy Explanation |
|---|---:|---|---|
| **Detailed Cards** | **14,443** | `data/cards_detailed.json` & SQLite `cards` | Canonical detailed metadata scraped from official card database. |
| **Card Index** | **14,443** | `data/cards_index.json` | 1-to-1 index matching detailed cards. |
| **Unique Shard Cards** | **14,609** | `data/ir_shards/*.json` (514 shards) | Unique card numbers compiled across set shards. |
| **Total Shard Instances** | **15,398** | `data/ir_shards/*.json` (514 shards) | Total physical card instances including set reprints. |
| **SQLite `cards_v2`** | **14,611** | `battle_spirits.db` (`cards_v2` table) | Exactly 14,609 unique shard cards + 2 legacy composite scraping IDs (`BATTLE-SPIRITS-A13741`, `BATTLE-SPIRITS-A13799`). |
| **Compiled Abilities** | **36,422** | Across all 514 shards | Total ability objects in corpus. |
| **Compiled Clauses** | **51,734** | Across all 36,422 abilities | Total atomic rule clauses in corpus. |
| **Unique Opcodes** | **288** | Across all 51,734 clauses | Distinct IR opcode primitives. |

### Mathematical Formulas Verified:
1. $\text{Shard Unique (14,609)} = \text{Detailed (14,443)} - \text{Detailed-only (22)} + \text{Shards-only (188)}$
2. $\text{Total Shard Instances (15,398)} = \text{Shard Unique (14,609)} + \text{Set Reprints (789)}$
3. $\text{SQLite cards\_v2 (14,611)} = \text{Shard Unique (14,609)} + \text{Composite IDs (2)}$

---

## 3. Deep-Dive Audit of Specific Defect Findings

### 3.1 Finding A — Browser Gameplay Test (`tests/real_browser_arena.test.js`)
Inspection of lines 282–355 reveals:
1. `s.opponent.field = [oppTargetSpirit, oppIllegalSpirit];` directly injects mock spirit objects into the active duel state.
2. `const legalCandidates = s.opponent.field.filter(sp => sp.currentBp <= 2000);` performs target candidate filtering manually in test JavaScript rather than executing the engine's `resolveTargets` selector.
3. `window.BattleArena.promptStructuredDecision(...)` directly invokes the prompt manager, bypassing the production ability resolver.
4. `s.opponent.field = s.opponent.field.filter(...)` and `s.opponent.trash++` manually simulate destruction rather than letting the engine process zone movement and State-Based Actions (SBA).

**Action Required in Phase 4D.1:** Replace Step 9 with a genuine gameplay sequence where opponent spirits are summoned legitimately during turn progression, player casts/summons a real card via UI controls, and the production engine triggers `resolveTargets` and moves the destroyed card through `engine/zones.js:moveCard`.

### 3.2 Finding B — Opcode Semantic Evidence Methodology
Inspection of `scripts/generate_phase4d_work_package_d.mjs` lines 171–183 reveals:
```javascript
const inOps = opsFile.includes(`case '${code}':`) || opsFile.includes(`"${code}"`) || opsFile.includes(`'${code}'`);
const inBundle = bundleFile.includes(`'${code}'`) || bundleFile.includes(`"${code}"`);
const inResolver = resolverFile.includes(`'${code}'`) || resolverFile.includes(`"${code}"`);
const handlerPresent = inOps || inBundle || inResolver;

let status = 'COMPILER_ONLY';
if (handlerPresent) {
  if (tests.length > 0) {
    status = 'SEMANTICALLY_VERIFIED';
  } else {
    status = 'HANDLER_PRESENT';
  }
}
```
This is static regex string-matching. If a test file mentions `'TREAT_RULE'`, the opcode was marked `SEMANTICALLY_VERIFIED` even if the test never executed the operation or asserted resulting state mutations.

**Action Required in Phase 4D.1:** Implement runtime execution telemetry that hooks into `executeOp` and records actual opcode executions, input parameters, resulting state changes, and asserting test suites.

### 3.3 Finding C — Master Test Runner Disposition Flaw
Inspection of `scripts/run_master_verification.mjs` lines 350–356 reveals:
```javascript
let disposition = 'STANDALONE_VERIFIED';
let rationale = 'Verified in independent standalone suite execution';

if (file.includes('work_package_k1_3_') || file.includes('master_runner_reconciliation') || file.includes('phase4b3_')) {
  disposition = 'HISTORICAL_PHASE_BASELINE';
  rationale = 'Historical phase-specific audit fixture or frozen milestone verification baseline';
}
```
Non-master suites were categorized as `STANDALONE_VERIFIED` without executing them during the verification run.

**Action Required in Phase 4D.1:** Strictly conform to the required disposition schema:
- `MASTER_EXECUTED_PASS`
- `MASTER_EXECUTED_FAIL`
- `STANDALONE_EXECUTED_PASS`
- `STANDALONE_EXECUTED_FAIL`
- `HISTORICAL_NOT_CURRENTLY_EXECUTED`
- `EXCLUDED_WITH_EXPLICIT_REASON`
- `BLOCKED`

Every `_PASS` status must be backed by an actual process execution exit code 0.

---

## 4. Immediate Phase 4D.1 Implementation Roadmap

With Section 0 complete and all findings verified, work proceeds directly into implementation:
- **Work Package A:** Canonical Card Corpus Reconciliation (`canonical_population_audit.json`, `canonical_identity_mapping.json`, `card_ability_clause_traceability.json`, `corpus_integrity_report.md`).
- **Work Package B:** Rebuild Semantic Evidence from Actual Runtime Execution (`runtime_opcode_telemetry.json`, `opcode_variant_semantic_evidence.json`, `evidence_schema.json`, `evidence_integrity_report.md`).
- **Work Package C:** Genuine Browser Gameplay without Synthetic State Manipulation (`genuine_browser_gameplay_test.md`, `browser_runtime_event_trace.json`, `browser_acceptance_report.md`).
- **Work Package D:** Diagnostic Breakdown of all 6,996 Partial and 3,100 Unsupported Cards.
- **Work Package E & F:** Shared Mechanics Prioritization and Implementation.
- **Work Package G:** Expanded Real-Card Semantic Validation Battery.
- **Work Package H:** Evidence-Derived Support Matrix Recalculation.
- **Work Package I:** Master Test Runner Repair & Comprehensive Execution.
- **Work Packages J, K, L:** Gameplay Integration, Performance Benchmarks, and Final Handoff.
