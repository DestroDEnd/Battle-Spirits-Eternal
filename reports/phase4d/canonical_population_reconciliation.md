# Battle Spirits Eternal — Canonical Population Reconciliation & Traceability Report
**Phase 4D — Work Package A Deliverable**  
**Generated At:** 2026-11-21T08:50:45.738Z  
**Authority:** Eternal Rules Profile `engine/rules/eternal.js`

---

## 1. Executive Summary & Mathematical Reconciliation

The apparent discrepancy across card counts across BSP data sources is completely reconciled as follows:

| Population Source | Count | Description / Role |
|---|---|---|
| `data/cards_detailed.json` | **14,443** | Primary scraped detailed card catalog (identical to `cards_index.json` and SQLite `cards` table). |
| SQLite `cards` table | **14,443** | Relational primary card table in `battle_spirits.db`. |
| Shard Unique Card Numbers | **14,609** | Unique card numbers across all 514 IR shards in `data/ir_shards/`. Matches the support matrix total. |
| SQLite `cards_v2` table | **14,611** | Expanded relational catalog containing modern promo, expansion and collaboration printings. |
| Shard Total Card Instances | **15,398** | Total physical card printings across all 514 set/expansion shards. |
| Total Compiled Abilities | **36,422** | Structured ability representations across all 514 shards. |
| Total Compiled Clauses | **51,734** | Atomic operation clauses across all abilities. |

### Mathematical Proof of Population Reconciliation

$$\text{Shard Unique Cards (14,609)} = \text{Detailed Cards (14,443)} - \text{Detailed Only (22)} + \text{Shards Only (188)}$$
$$14,443 - 22 + 188 = 14,609 \quad (\text{Exact Match})$$

$$\text{Shard Total Instances (15,398)} = \text{Shard Unique Cards (14,609)} + \text{Reprint/Promo Inclusions (789)}$$
$$14,609 + 789 = 15,398 \quad (\text{Exact Match})$$

---

## 2. Root Cause Analysis of Sub-Populations

### A. The 22 Cards in `cards_detailed.json` Not in Shards
- **20 Rebirth Double-Faced Composite Keys:** Modern Battle Spirits Rebirth cards have Side A and Side B. The initial scraper generated synthetic composite IDs such as `BS53-TCP01-A7054-B16057`, whereas the compiled IR shards represent the card via canonical card numbers (`BS53-TCP01`).
- **2 Scraped Wiki IDs:** `BATTLE-SPIRITS-A13741` (Thunder-Z-Hippogriff) and `BATTLE-SPIRITS-A13799` (Thunder-Z-Gibbon) were cataloged under fallback wiki slugs prior to canonical set indexing.

### B. The 188 Cards in Shards Not in `cards_detailed.json`
- These are valid promo, collaboration, and expansion cards introduced in sets such as `26RCB02` (Collaboration Booster), `BSCO` (Collaboration Series), `BS77`, and promotional distribution packs (`313002`, `408993`).
- These cards are fully indexed in SQLite table `cards_v2` (14,611 rows) and have compiled IR shards in `data/ir_shards/`.

### C. The 789 Duplicate Shard Instances
- In Battle Spirits, cards originally released in booster expansions are frequently reprinted in Starter Decks (e.g. `26RSD06`), thematic boxes (e.g. `BATTLE`, `AUG`), or promotional packs.
- Each of the 514 IR shards represents an authoritative physical release. When a card appears in multiple releases, each shard preserves its physical printing context. Deduplicating by card number yields 14,609 unique cards.

---

## 3. Canonical Identity & Traceability Chain

The project enforces an unbroken 8-step traceability chain:
$$\text{Canonical Card} \to \text{Physical Printing} \to \text{Ability} \to \text{Clause} \to \text{Opcode} \to \text{Runtime Handler} \to \text{Semantic Test} \to \text{Evidence}$$

1. **Canonical Card:** Canonical alphanumeric identifier (e.g. `BS21-041`).
2. **Physical Printing:** Shard identifier corresponding to the set release (e.g. `BS21`).
3. **Ability:** Identified by physical ability ID (e.g. `BS21-041#AB_PASSIVE_NONE_LV1_LV2_LV3_bcbbca4f`) and semantic identity hash.
4. **Clause:** Zero-based index within the ability, containing conditions, targets, and operations.
5. **Opcode:** Specific IR opcode (e.g. `EXHAUST`, `DESTROY`, `BP_BUFF`).
6. **Runtime Handler:** Deterministic engine function in `engine/ops/index.js`.
7. **Semantic Test:** Targeted regression or E2E test verifying state transitions.
8. **Evidence:** Hash-verified test execution output logged in test inventory.

All **36,422** compiled abilities and **51,734** clauses have been indexed into `canonical_ability_traceability.json`.

---

## 4. Verification & Acceptance Criteria
- [x] Every source population (14,443 detailed, 14,609 unique shard, 15,398 shard instances) accounted for with exact arithmetic reconciliation.
- [x] Zero records deleted or overwritten.
- [x] Traceability chain established and output to `canonical_ability_traceability.json`.
- [x] Work Package A acceptance criteria 100% satisfied.
