# Battle Spirits Eternal — Database Integrity Test Results Report
**Test Execution Date:** 2026-11-24  
**Test Suite:** \`tests/database_recovery_regression.test.js\`  
**Target Program:** Master Card Database Integrity Audit & Missing-Card Recovery  
**Total Tests:** 15  
**Passed:** 15 (100%)  
**Failed:** 0 (0%)  
**Status:** **ALL INTEGRITY AND REGRESSION ASSERTIONS VERIFIED**

---

## 1. Test Suite Execution Summary

The dedicated test suite \`tests/database_recovery_regression.test.js\` enforces all 15 mandatory integrity invariants specified in the recovery audit mandate:

| Test ID | Test Specification / Requirement | Status | Execution Duration |
|---|---|---|---:|
| **REC-01** | Removing alternate-art printings does not remove canonical cards | ✅ PASS | 46.5 ms |
| **REC-02** | Removing one alternate-art printing does not remove other valid printings | ✅ PASS | 0.5 ms |
| **REC-03** | Cards with multiple set appearances retain all valid set memberships | ✅ PASS | 0.4 ms |
| **REC-04** | Complete BS-77 inventory is present (all 46 cards) | ✅ PASS | 26.6 ms |
| **REC-05** | Ubataman exists and is retrievable (\`BS30-015\`) | ✅ PASS | 1.9 ms |
| **REC-06** | Ultimate-Saviour exists and is retrievable (\`BS27-X03\`) | ✅ PASS | 0.8 ms |
| **REC-07** | Repeated recovery imports do not create duplicates (Strict Idempotency) | ✅ PASS | 10.8 ms |
| **REC-08** | Card IDs remain stable | ✅ PASS | 0.6 ms |
| **REC-09** | Card images and printing relationships remain valid | ✅ PASS | 0.5 ms |
| **REC-10** | Search and filtering return recovered cards | ✅ PASS | 93.7 ms |
| **REC-11** | Deck builder can retrieve recovered cards | ✅ PASS | 0.8 ms |
| **REC-12** | Database counts reconcile with verified source inventories (14,631 cards) | ✅ PASS | 17.4 ms |
| **REC-13** | Missing or conflicting records are reported instead of silently discarded | ✅ PASS | 8.1 ms |
| **REC-14** | A future alternate-art cleanup dry run cannot remove canonical cards | ✅ PASS | 46.5 ms |
| **REC-15** | Recovery rollback verification (complete timestamped backups on disk) | ✅ PASS | 2.6 ms |

---

## 2. Invariant Verification Ledger

### Invariant 1: Total Canonical Cardinality Floor
\`MIN_CARD_CARDINALITY_FLOOR = 14631\`
- SQLite \`cards\` table: **14,631** (PASSED)
- SQLite \`cards_v2\` table: **14,631** (PASSED)
- \`data/cards_detailed.json\`: **14,631** (PASSED)
- \`data/cards_index.json\`: **14,631** (PASSED)

### Invariant 2: High-Profile Missing Cards Re-Established
- **Ubataman (\`BS30-015\`):**
  - Found in \`cards\`, \`cards_v2\`, \`cards_detailed.json\`, \`cards_index.json\`, and \`cards_fts\`.
  - Color: Green, Cost: 2, Family: Shellman, Image URL: \`https://static.wikia.nocookie.net/battle-spirits/images/BS30-015_official.png\`.
- **The HolyDragonEmperor Ultimate-Saviour (\`BS27-X03\`):**
  - Found in \`cards\`, \`cards_v2\`, \`cards_detailed.json\`, \`cards_index.json\`, and \`cards_fts\`.
  - Color: Red, Type: Ultimate, Cost: 7, Family: Tri-Dragon Deity, Image URL: \`https://static.wikia.nocookie.net/battle-spirits/images/BS27_X_X03.png\`.
- **BS-77 Expansion Set:**
  - Exactly 46 cards present across all database tiers.

### Invariant 3: Idempotency
- Running the master recovery process repeatedly produces zero duplicate rows and zero modified counts.

---

## 3. Related Regression Suites

In addition to \`tests/database_recovery_regression.test.js\`, all existing core test suites were re-executed:
- \`tests/data_audit.test.js\`: 3/3 passed.
- \`tests/site_audit.test.js\`: 7/7 passed.
- \`tests/relative_paths_audit.test.js\`: 6/6 passed.
- \`tests/cloud_deck_sync.test.js\`: 6/6 passed.
- **Combined Passed:** **37 / 37 tests (0 failures)**.
