# Battle Spirits Eternal (BSP) — Final Card Support Summary
## Phase K Deliverable

**Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Governing Standard:** Battle Spirits Eternal Rules Engine Invariant Standard (`AGENTS.md`)  
**Status:** **AUTHORITATIVE CARD, ABILITY & CLAUSE SUPPORT AUDIT**

---

## 1. Authoritative Card-Level Classification

All **14,609 cards** in the Battle Spirits Eternal database were systematically evaluated bottom-up from individual clause opcodes, condition ASTs, and verified runtime handler evidence (`engine/evidence.js`).

| Classification Tier | Card Count | Percentage (%) | Definition & Criteria |
|---|---:|---:|---|
| **FULLY_SUPPORTED** | **4,139** | **28.33%** | 100% of card abilities and clauses compile to verified IR opcodes with verified runtime execution handlers. |
| **PARTIALLY_SUPPORTED** | **6,996** | **47.89%** | At least one ability/clause is fully executable; other clauses require unsupported ops or complex deferred mechanics. |
| **VANILLA** | **374** | **2.56%** | Pure combat/stat spirits with no effect text, 100% playable via core rules. |
| **UNSUPPORTED** | **3,100** | **21.22%** | Card requires unimplemented opcodes, complex multi-hop targeting, or modern wave keyword mechanics. |
| **Total Evaluated Corpus** | **14,609** | **100.00%** | Comprehensive canonical database coverage without omission. |

---

## 2. Ability and Clause Granular Metrics

| Structural Level | Total Evaluated | Supported Count | Supported (%) | Unsupported Count | Unsupported (%) |
|---|---:|---:|---:|---:|---:|
| **Card Abilities** | 34,855 | 28,040 (inc. partial) | 80.45% | 6,815 | 19.55% |
| **Compiled Clauses** | 49,318 | 38,784 | 78.64% | 10,534 | 21.36% |
| **Opcode Variants** | 288 | 226 (active/partial) | 78.47% | 62 | 21.53% |

---

## 3. Card Population Reconciliation

An independent reconciliation audit resolved all population discrepancies across repository datasets:

| Dataset Artifact | Entry Count | Population Description & Delta Analysis |
|---|---:|---|
| `data/cards_detailed.json` | 14,443 | Canonical printed cards with detailed text and attributes. |
| `data/cards_index.json` | 14,609 | Canonical card number registry (includes 166 promo/alternate art cards). |
| `data/ir_shards/*.json` (514 files) | 15,398 | Shard card records (includes multi-side Rebirth card definitions 'A' and 'B'). |
| **Reconciliation Status** | **100% RECONCILED** | Exact 1-to-1 traceability established across all entries. |

---

## 4. Deliverable Matrix References

The complete card-by-card, ability-by-ability, and clause-by-clause evaluation datasets are preserved in:
- `reports/phase_k/card_support_matrix.json` (14,609 cards)
- `reports/phase_k/card_support_matrix.csv` (14,609 rows)
- `reports/phase_k/ability_support_matrix.json` (34,855 abilities)
- `reports/phase_k/clause_support_matrix.json` (49,318 clauses)
- `reports/phase_k/opcode_variant_support_matrix.json` (288 opcodes)
- `reports/phase_k/card_population_reconciliation.json`
