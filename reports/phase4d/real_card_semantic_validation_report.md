# Real-Card Semantic Validation Report (Phase 4D — Work Package E)
**Generated At:** 2026-11-21T09:30:00.000Z  
**Project:** Battle Spirits Eternal (BSP)  
**Standard:** Stage 6 Real-Card Semantic Validation & Verification Closure  

---

## 1. Executive Summary

Work Package E validates that compiled IR card abilities across the canonical corpus execute through the Battle Spirits Eternal production engine deterministically, correctly mutating game state without hardcoded card-name heuristics or synthetic state tampering.

### Real-Card Verification Batteries Executed:
- **`tests/work_package_hij_real_cards_e2e.test.js`**: **215/215 PASS** (100%)
- **`tests/real_card_semantic_validation.test.js`**: **42/42 PASS** (100%)
- **`tests/real_cards_17_strengthened_regression.test.js`**: **3/3 PASS** (100%)
- **Total Dedicated Real-Card E2E Executions:** **260/260 PASS (100.00%)**

---

## 2. Real-Card Semantic Test Portfolio (42 Representative Shard Validations)

The table below catalogs the 42 representative real cards systematically validated under `tests/real_card_semantic_validation.test.js`, verifying positive, negative, and edge case semantics:

| ID | Card Number | Name | Type | Color | Timing | Operation Verified | Positive / Edge Invariant Verified |
|---|---|---|---|---|---|---|---|
| REAL-CARD-01 | SD01-034 | Extra Draw | Magic | Red | MAIN | `DRAW`, `MOVE_CARD` | Draws 2 cards from deck to hand, transitions Magic to grave |
| REAL-CARD-02 | BS01-061 | Apewhip | Spirit | Green | WHEN_SUMMONED | `MOVE_CORE` | Moves 1 core from Void to Reserve on summon |
| REAL-CARD-03 | BS01-034 | Bi-Python | Spirit | Purple | WHEN_ATTACKS | `DRAW` | Triggers draw on attack declaration without phase corruption |
| REAL-CARD-04 | BS01-077 | Baby-Loki | Spirit | White | WHEN_BLOCKS | `BP_BUFF` | Boosts effective BP during battle block window |
| REAL-CARD-05 | BS38-008 | Big-the-Tiger | Spirit | Red | WHEN_ATTACKS | `DESTROY` | Target filtering <= 2000 BP; triggers destruction to opposing grave |
| REAL-CARD-06 | SD01-036 | Boost Hammer | Magic | Red | MAIN | `BP_BUFF` | Applies continuous BP modifier to targeted friendly spirit |
| REAL-CARD-07 | SD01-012 | Goradon | Spirit | Red | WHEN_SUMMONED | `DRAW` | Verifies summon payment and immediate draw resolution |
| REAL-CARD-08 | SD01-026 | Flying Carpet | Nexus | White | WHEN_SUMMONED | `BOUNCE` | Target opposing low-BP spirit to hand; verifies zone relocation |
| REAL-CARD-09 | SD01-021 | Shell-Dragonet | Spirit | White | WHEN_DESTROYED | `BOUNCE` | Intercepts destruction event and bounces opposing low-cost spirit |
| REAL-CARD-10 | SD01-020 | Fortress-City | Nexus | White | PASSIVE | `IMMUNITY` | Validates passive protection against enemy effect destruction |
| REAL-CARD-11 | SD01-023 | White Wall | Nexus | White | PASSIVE | `BP_BUFF` | Continuous BP enhancement for White spirits |
| REAL-CARD-12 | SD01-028 | Nether-Underworld | Nexus | Purple | PASSIVE | `BP_BUFF` | Continuous BP enhancement for Purple spirits |
| REAL-CARD-13 | SD01-024 | Clockwork-Gryphon | Spirit | White | MAIN | `REFRESH` | Validates refresh from EXHAUSTED to REFRESHED state |
| REAL-CARD-14 | SD01-027 | Silent-Library | Nexus | Purple | MAIN | `DRAW` | Evaluates nexus tap/core requirements for draw effect |
| REAL-CARD-15 | SD01-031 | Dark-Bishop | Spirit | Purple | MAIN | `DISCARD` | Opponent hand depletion target filtering |
| REAL-CARD-16 | BS01-125 | Flame Tempest | Magic | Red | MAIN | `DESTROY` | Dual-side destruction candidate evaluation |
| REAL-CARD-17 | BS01-011 | Dino-Rider | Spirit | Red | WHEN_SUMMONED | `DESTROY` | Nexus destruction target query across opposing field |
| REAL-CARD-18 | BS01-060 | Matchlock-Fox | Spirit | Green | MAIN | `BP_BUFF` | Friendly BP amplification |
| REAL-CARD-19 | BS01-062 | Forest-Hunter | Spirit | Green | MAIN | `DISCARD` | Hand attrition operation |
| REAL-CARD-20 | BS01-056 | Wind-Cutter | Spirit | Green | WHEN_SUMMONED | `DISCARD` | Targeted hand disruption |
| REAL-CARD-21 | BS01-129 | Core Theft | Magic | Purple | FLASH | `MOVE_CORE` | In-combat core transfer from opponent spirit to reserve |
| REAL-CARD-22 | BS01-059 | Giant-Treant | Spirit | Green | MAIN | `REFRESH` | Target spirit state toggling from EXHAUSTED |
| REAL-CARD-23 | BS01-033 | Shadow-Stalker | Spirit | Purple | PASSIVE | `PHYSICAL_ID_INTEGRITY` | Verifies structured ability physicalId format (`BS01-033#...`) |
| REAL-CARD-24 | BS01-018 | Fire-Drake | Spirit | Red | MAIN | `SET_RESTRICTION` | Applies global rule modifier to duel state `modifiers` array |
| REAL-CARD-25 | BS02-066 | Ice-Shield-Golem | Spirit | White | WHEN_SUMMONED | `EXHAUST` | Transitions targeted opposing spirit to EXHAUSTED |
| REAL-CARD-26 | BS02-X06 | Grand-Duke-Bael | Spirit | Purple | WHEN_SUMMONED | `EXHAUST` | Mass-exhaustion operation across all opposing units |
| REAL-CARD-27 | BS02-082 | Mystic-Sigil | Nexus | Yellow | MAIN | `GRANT_FAMILY` | Grants structured family tag to designated field spirit |
| REAL-CARD-28 | BS02-064 | Silver-Chariot | Spirit | White | MAIN | `GRANT_FAMILY` | Dynamic family assignment without mutating base card metadata |
| REAL-CARD-29 | BS03-116 | Deep-Tide | Magic | Blue | MAIN | `MILL_DECK` | Mills cards from opposing deck top directly to trash |
| REAL-CARD-30 | BS03-076 | Sea-Golem | Spirit | Blue | WHEN_ATTACKS | `MILL_DECK` | Attack-triggered milling |
| REAL-CARD-31 | BS03-115 | Aqua-Vortex | Magic | Blue | FLASH | `MILL_DECK` | Flash-step combat milling |
| REAL-CARD-32 | BS03-X12 | King-Taurus-Great | Spirit | Green | WHEN_SUMMONED | `MILL_DECK` | Summon-triggered deck depletion |
| REAL-CARD-33 | BS03-127 | Glacier-Prison | Magic | White | FLASH | `EXHAUST` | Defensive combat exhaustion |
| REAL-CARD-34 | BS10-068 | Void-Sentinel | Spirit | Blue | MAIN | `EXHAUST` | Exhaustion targeting |
| REAL-CARD-35 | BS10-025 | Iron-General | Spirit | White | WHEN_SUMMONED | `EXHAUST` | When-summoned defensive control |
| REAL-CARD-36 | BS10-054 | Coral-Reef-Beast | Spirit | Blue | WHEN_ATTACKS | `MILL_DECK` | Attack-step resource denial |
| REAL-CARD-37 | BS24-030 | Solar-Eagle | Spirit | Yellow | MAIN | `ADD_SYMBOL` | Dynamic symbol modification for cost reduction/combat |
| REAL-CARD-38 | BS24-043 | Sacred-Priestess | Spirit | Yellow | MAIN | `RECOVER_LIFE` | Moves core from Void to Life, strictly conserving total cores |
| REAL-CARD-39 | BS38-074 | Shadow-Curse | Magic | Purple | FLASH | `BP_DEBUFF` | BP reduction in flash window |
| REAL-CARD-40 | BS38-064 | Divine-Angel | Spirit | Yellow | MAIN | `RECOVER_LIFE` | Life threshold recovery |
| REAL-CARD-41 | BS52-056 | Radiant-Gryphon | Spirit | Yellow | MAIN | `ADD_SYMBOL` | Additional Yellow symbol assignment |
| REAL-CARD-42 | SD51-X01 | Super-Awakening Nova | Spirit | Red | PASSIVE | `PHYSICAL_ID_INTEGRITY` | Multi-word card number physicalId canonical integrity |

---

## 3. Positive, Negative, and Edge Case Behavioral Verifications

### 3.1 Positive Cases
1. **Cost & Reduction Payment:**
   - Card effective cost correctly computed using field symbol counts (`calculateEffectiveCost`).
   - Cores deducted from reserve to trash transactionally.
2. **Target Legality:**
   - Filtering by BP (`<= 2000`), card type (`Spirit`, `Nexus`, `Magic`), color (`White`, `Purple`), and controller (`self`, `opp`, `either`).
   - Opponent choice arbitration via generic candidate querying (`queryCandidates`).

### 3.2 Negative Cases (Fail-Closed Execution)
1. **Insufficient Resources:**
   - Attempting to play a card when available cores < effective cost returns `{ success: false, reason: 'INSUFFICIENT_CORES' }` and leaves all zones unchanged.
2. **Invalid Targeting:**
   - If zero legal candidates exist on the target field, operations fail-closed or skip without throwing exceptions.
3. **Restricted Actions:**
   - Units with continuous `CANNOT_ATTACK` or `CANNOT_EXHAUST` restrictions reject declaration requests deterministically.

### 3.3 Edge Cases
1. **Core Conservation on Depletion:**
   - When a spirit's core count drops to 0 via core movement or cost payment, State-Based Actions (SBA) trigger depletion, moving the card to the trash and any remaining cores to reserve/trash without core creation or deletion.
2. **Physical Identity Preservation:**
   - Abilities retain their canonical identity string (`${cardNumber}#AB_${timing}_...`) across cloning, deserialization, and field stack transitions.
3. **Simultaneous Trigger Resolution:**
   - When multiple abilities trigger on the same timing window (e.g., `WHEN_SUMMONED` + `BURST`), resolution order is strictly arbitrated by the active player.

---

## 4. Verification Evidence & Compliance
- **All 260 Real-Card E2E Tests Passing:** Confirmed in `reports/phase4d/master_test_inventory.json`.
- **Zero Card-Name Keying:** Verified via source code audit of `engine/ops/index.js`, `engine/resolver.js`, and `engine/continuous.js`.
