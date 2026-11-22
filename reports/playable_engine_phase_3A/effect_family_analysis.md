# Effect Family Analysis Report

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 3A  
**Date:** 2026-11-21  

---

## 1. Overview of Effect Families

The 51,734 compiled clauses in the Battle Spirits Eternal corpus are categorized into 10 cohesive effect families:

### Summoning & Play
- **Description:** Mechanics governing card playing, cost calculation, symbol reduction, and alternative summoning.
- **Total Clauses in Family:** **3717**
- **Verified Clauses:** **3612** (97.18% verified)
- **Primary Opcodes:** `SUMMON`, `COST_MODIFIER`, `FREE_SUMMON`, `REVEAL_SUMMON`, `SWAP_HAND`, `SUMMON_FROM_TRASH`

### Destruction & Depletion
- **Description:** Mechanics governing destruction of spirits/ultimates/nexuses, core depletion, and graveyard transitions.
- **Total Clauses in Family:** **4318**
- **Verified Clauses:** **4294** (99.44% verified)
- **Primary Opcodes:** `DESTROY`, `SEND_TO_TRASH`, `DESTROY_TARGET`, `SCHEDULED_DESTROY`, `DEPLETE`, `SEND_TO_VOID`

### Bounce & Zone Relocation
- **Description:** Mechanics moving cards between battlefield, hand, and deck.
- **Total Clauses in Family:** **4023**
- **Verified Clauses:** **1** (0.02% verified)
- **Primary Opcodes:** `BOUNCE`, `RETURN_TO_HAND`, `SEND_TO_DECK_BOTTOM`, `SEND_TO_DECK_TOP`, `MOVE_ZONE`, `OPEN_ZONE`

### Hand & Deck Manipulation
- **Description:** Card draw, deck searching, top deck revealing, discard, and milling effects.
- **Total Clauses in Family:** **3007**
- **Verified Clauses:** **2981** (99.14% verified)
- **Primary Opcodes:** `DRAW`, `REVEAL`, `DISCARD`, `MILL`, `DECK_SEARCH`, `REARRANGE_DECK`

### Core & Resource Management
- **Description:** Core placement, core transfer, Void/Reserve/Field flow, and Soul Core management.
- **Total Clauses in Family:** **7084**
- **Verified Clauses:** **164** (2.32% verified)
- **Primary Opcodes:** `ADD_CORE`, `MOVE_CORE`, `MOVE_SOUL_CORE`, `PAY_COST`, `CORE_LOCK`, `RESERVE_REDUCTION`

### BP Buff & Modification
- **Description:** Continuous and instant modifications to Battle Points (BP).
- **Total Clauses in Family:** **2453**
- **Verified Clauses:** **2446** (99.71% verified)
- **Primary Opcodes:** `BP_BUFF`, `BP_DEBUFF`, `SET_BP`, `SWITCH_BP`, `EXCHANGE_BP`, `BP_COMPARISON`

### Combat & Defense
- **Description:** Attack eligibility, block interception, combat clash, and attack step flow.
- **Total Clauses in Family:** **426**
- **Verified Clauses:** **0** (0.00% verified)
- **Primary Opcodes:** `CAN_ATTACK`, `CANNOT_ATTACK`, `CAN_BLOCK`, `CANNOT_BLOCK`, `UNBLOCKABLE`, `CLASH`

### Targeting & Condition Gating
- **Description:** Interactive and automated target selection and relative comparison filtering.
- **Total Clauses in Family:** **15**
- **Verified Clauses:** **3** (20.00% verified)
- **Primary Opcodes:** `SELECT_TARGET`, `EXPAND_TARGETS`, `CHANGE_TARGET`, `CHOOSE_BATTLE_TARGET`, `OPPONENT_CHOICE`, `TARGET_FAMILY`

### Burst, Triggers & Reactions
- **Description:** Burst card activation, WhenAttacks, WhenSummoned, and defensive trigger conditions.
- **Total Clauses in Family:** **5**
- **Verified Clauses:** **0** (0.00% verified)
- **Primary Opcodes:** `BURST_EFFECT`, `TRIGGERED_ACTION`, `GUARD_TRIGGER`, `CHECK_BURST`, `COPY_TRIGGER`, `U_TRIGGER`

### Continuous Immunity & Keywords
- **Description:** Passive protections, continuous rules modifiers, and activation limit gating.
- **Total Clauses in Family:** **865**
- **Verified Clauses:** **0** (0.00% verified)
- **Primary Opcodes:** `GRANT_KEYWORD`, `GRANT_EFFECT`, `CANNOT_BE_DESTROYED`, `IMMUNITY`, `LOSE_IMMUNITY`, `NON_STACKABLE`

