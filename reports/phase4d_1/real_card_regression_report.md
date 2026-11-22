# Real-Card Semantic Regression & Validation Report (Phase 4D.1 — Work Package G)

**Generated At:** 2026-11-21T10:27:51.475Z  
**Total Real-Card Tests Executed:** 260  
**Passed:** 260 / 260 (100.00% PASS)  
**Failed:** 0  
**Flakiness Rate:** 0.00%  

---

## 1. Executive Summary

Work Package G establishes an independently reproducible, data-driven regression battery executing **260 distinct real-card test cases** drawn directly from the authoritative 514-shard database (`data/ir_shards/`) and canonical card details (`data/cards_detailed.json`).

All test assertions operate strictly against production runtime state structures, verifying:
1. **Initial-to-Final State Mutation:** Exact core decrements/increments, void/reserve transitions, hand count delta, and graveyard tracking.
2. **Effective BP & Level Calculation:** Dynamic level computation via `computeLevel()` and `computeEffectiveBP()` honoring passive abilities, braved equipment, and turn state.
3. **Zone Transitions:** Verified movement across Hand, Field, Trash, Deck-Bottom, Open Zone, and Void through production `moveCard()` and `moveCore()`.
4. **Physical & Semantic Identity Preservation:** Ensuring card instances retain canonical `cardNumber`, `physicalId`, and `semanticId` throughout effect chains.

---

## 2. Test Battery Breakdown by Suite

| Test Suite File | Test Cases | Execution Result | Focus Area |
|---|:---:|:---:|---|
| `tests/real_card_semantic_validation.test.js` | 42 | **42/42 PASS** | Core semantic operations across all 6 colors and diverse timings |
| `tests/work_package_hij_real_cards_e2e.test.js` | 215 | **215/215 PASS** | Broad canonical card battery across Spirits, Nexuses, Magics, and Rules |
| `tests/real_cards_17_strengthened_regression.test.js` | 3 | **3/3 PASS** | Strengthened self-bounce, burst-bounce, and exhaust assertions |
| **Total Combined Real-Card Battery** | **260** | **260/260 PASS (100.00%)** | Full end-to-end multi-card regression protection |

---

## 3. Sample Real-Card Executions (First 50 Cases)

| Card Number | Test Description | Test Suite File | Status | Duration |
|---|---|---|:---:|:---:|
| `REAL-CARD` | REAL-CARD-01: SD01-034 Extra Draw | `tests/real_card_semantic_validation.test.js` | **PASS** | 31.3821ms |
| `REAL-CARD` | REAL-CARD-02: BS01-061 Apewhip | `tests/real_card_semantic_validation.test.js` | **PASS** | 2.3942ms |
| `REAL-CARD` | REAL-CARD-03: BS01-034 Bi-Python | `tests/real_card_semantic_validation.test.js` | **PASS** | 1.728ms |
| `REAL-CARD` | REAL-CARD-04: BS01-077 Baby-Loki | `tests/real_card_semantic_validation.test.js` | **PASS** | 6.0782ms |
| `REAL-CARD` | REAL-CARD-05: BS38-008 Big-the-Tiger | `tests/real_card_semantic_validation.test.js` | **PASS** | 2.6808ms |
| `REAL-CARD` | REAL-CARD-06: SD01-036 | `tests/real_card_semantic_validation.test.js` | **PASS** | 1.0913ms |
| `REAL-CARD` | REAL-CARD-07: SD01-012 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.9223ms |
| `REAL-CARD` | REAL-CARD-08: SD01-026 | `tests/real_card_semantic_validation.test.js` | **PASS** | 1.2778ms |
| `REAL-CARD` | REAL-CARD-09: SD01-021 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.7669ms |
| `REAL-CARD` | REAL-CARD-10: SD01-020 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.6095ms |
| `REAL-CARD` | REAL-CARD-11: SD01-023 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.8505ms |
| `REAL-CARD` | REAL-CARD-12: SD01-028 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.6104ms |
| `REAL-CARD` | REAL-CARD-13: SD01-024 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.6663ms |
| `REAL-CARD` | REAL-CARD-14: SD01-027 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.6742ms |
| `REAL-CARD` | REAL-CARD-15: SD01-031 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.403ms |
| `REAL-CARD` | REAL-CARD-16: BS01-125 | `tests/real_card_semantic_validation.test.js` | **PASS** | 2.7869ms |
| `REAL-CARD` | REAL-CARD-17: BS01-011 | `tests/real_card_semantic_validation.test.js` | **PASS** | 1.7665ms |
| `REAL-CARD` | REAL-CARD-18: BS01-060 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.4072ms |
| `REAL-CARD` | REAL-CARD-19: BS01-062 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.4494ms |
| `REAL-CARD` | REAL-CARD-20: BS01-056 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.8126ms |
| `REAL-CARD` | REAL-CARD-21: BS01-129 | `tests/real_card_semantic_validation.test.js` | **PASS** | 1.2983ms |
| `REAL-CARD` | REAL-CARD-22: BS01-059 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.5578ms |
| `REAL-CARD` | REAL-CARD-23: BS01-033 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.4084ms |
| `REAL-CARD` | REAL-CARD-24: BS01-018 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.5164ms |
| `REAL-CARD` | REAL-CARD-25: BS02-066 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.9445ms |
| `REAL-CARD` | REAL-CARD-26: BS02-X06 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.524ms |
| `REAL-CARD` | REAL-CARD-27: BS02-082 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.3485ms |
| `REAL-CARD` | REAL-CARD-28: BS02-064 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.3082ms |
| `REAL-CARD` | REAL-CARD-29: BS03-116 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.3535ms |
| `REAL-CARD` | REAL-CARD-30: BS03-076 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.7247ms |
| `REAL-CARD` | REAL-CARD-31: BS03-115 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.3661ms |
| `REAL-CARD` | REAL-CARD-32: BS03-X12 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.453ms |
| `REAL-CARD` | REAL-CARD-33: BS03-127 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.5756ms |
| `REAL-CARD` | REAL-CARD-34: BS10-068 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.4576ms |
| `REAL-CARD` | REAL-CARD-35: BS10-025 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.4646ms |
| `REAL-CARD` | REAL-CARD-36: BS10-054 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.6002ms |
| `REAL-CARD` | REAL-CARD-37: BS24-030 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.4593ms |
| `REAL-CARD` | REAL-CARD-38: BS24-043 | `tests/real_card_semantic_validation.test.js` | **PASS** | 1.0281ms |
| `REAL-CARD` | REAL-CARD-39: BS38-074 | `tests/real_card_semantic_validation.test.js` | **PASS** | 2.0976ms |
| `REAL-CARD` | REAL-CARD-40: BS38-064 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.434ms |
| `REAL-CARD` | REAL-CARD-41: BS52-056 | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.3837ms |
| `REAL-CARD` | REAL-CARD-42: SIEGWURM-NOVA | `tests/real_card_semantic_validation.test.js` | **PASS** | 0.2337ms |
| `HIJ1-E2E` | HIJ1-E2E-001 [CARD_ABILITY_E2E]: CP14-X01R | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 231.7753ms |
| `HIJ1-E2E` | HIJ1-E2E-002 [CARD_ABILITY_E2E]: CP14-X14R | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 5.3029ms |
| `HIJ1-E2E` | HIJ1-E2E-003 [CARD_ABILITY_E2E]: 18-1 | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 5.1485ms |
| `HIJ1-E2E` | HIJ1-E2E-004 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A7434 | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 7.4815ms |
| `HIJ1-E2E` | HIJ1-E2E-005 [CARD_ABILITY_E2E]: P14-24 | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 2.2848ms |
| `HIJ1-E2E` | HIJ1-E2E-006 [CARD_ABILITY_E2E]: P16-02 | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 8.4065ms |
| `HIJ1-E2E` | HIJ1-E2E-007 [CARD_ABILITY_E2E]: P19-05 | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 2.2421ms |
| `HIJ1-E2E` | HIJ1-E2E-008 [CARD_ABILITY_E2E]: 26RBS01-062 | `tests/work_package_hij_real_cards_e2e.test.js` | **PASS** | 3.4912ms |
| ... | *(210 additional test cases verified — see complete inventory JSON)* | ... | **PASS** | ... |

---

## 4. Deliverable References

- **Full Semantic Test Inventory:** [real_card_semantic_test_inventory.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/real_card_semantic_test_inventory.json)
- **Detailed Execution Results:** [real_card_semantic_results.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/real_card_semantic_results.json)
