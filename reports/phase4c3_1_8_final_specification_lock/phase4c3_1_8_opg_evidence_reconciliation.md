# Phase 4C.3.1.8 — Once per Game (OPG) Evidence Reconciliation & Ledger Audit

**Document ID:** `BS-AUDIT-4C318-OPG-01`  
**Phase:** 4C.3.1.8 (Final Specification Lock)  
**Status:** EVIDENCE RECONCILED / DOWNGRADES EXECUTED  
**Author:** Battle Spirits Eternal Rules & Compiler Architecture Team  
**Scope:** Design and evidence audit only; no production or compiler code modifications.

---

## 1. Executive Summary

This report performs a comprehensive, independent evidence reconciliation across all 65 canonical abilities identified in the Battle Spirits Eternal card corpus that carry Once per Game (OPG) restrictions.

In previous phases:
- 18 entries were classified as `OFFICIALLY_VERIFIED` under "Rule 8-1-6 & Official Q&A".
- 13 entries were classified as `SUPPORTED_BY_OFFICIAL_CARD_RULING` under generic labels such as `Official Bandai Card Q&A (P21-G03 Q&A)`.
- 34 entries were classified as `ENGINE_CONVENTION`.

This phase eliminates all unverified claims, applies rigorous evidentiary standards, and resolves the ledger into exactly 65 verified or explicitly designated convention entries.

---

## 2. Re-Audit of the 18 Same Name OPG Entries

The 18 canonical abilities bearing the prefix `(Once per Game: Same Name)` (`〔ゲームに1回：同名〕`) have been independently audited.

### 2.1 Inventory of the 18 Same Name OPG Abilities

| # | Card Number | Card Name | IR Ability ID | Restriction Wording | Activation Zone |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **11** | `BS52-053` | The HornedMaskGiant Dugald | `BS52-053#a0` | Once per Game: Same Name | Hand |
| **20** | `BS63-025` | The DevilMarshal Zavi-Baphorogue | `BS63-025#a0` | Once per Game: Same Name | Trash |
| **21** | `BS64-CX02` | The Flower Partner, Frau | `BS64-CX02#a1` | Once per Game: Same Name | Hand |
| **22** | `BS69-NX03` | The ViolentAzureLimitedExpress Uxmal | `BS69-NX03#a0` | Once per Game: Same Name | Field |
| **23** | `BS70-XV01` | The SupernovaDragon Siegwurm-Nova XV | `BS70-XV01#a0` | Once per Game: Same Name | Field |
| **24** | `BS70-027` | The TreeDragon Woodedragone | `BS70-027#a0` | Once per Game: Same Name | Field |
| **26** | `BS73-TX04B` | The JewelEmpress Bijour-Joyaux | `BS73-TX04B#a2` | Once per Game: Same Name | Field |
| **33** | `BSC44-003` | Xochiquetzal | `BSC44-003#a1` | Once per Game: Same Name | Field |
| **34** | `BSC45-099` | Blizzard Wall LT | `BSC45-099#a0` | Once per Game: Same Name | Hand/Magic |
| **35** | `BSC46-041` | ［10th Diva - Next］Frau | `BSC46-041#a2` | Once per Game: Same Name | Field |
| **36** | `BSC49-042` | The ClownPrincess Trickster LT | `BSC49-042#a1` | Once per Game: Same Name | Field |
| **48** | `CB27-014` | Athrun Zala ［DESTINY］ | `CB27-014#a2` | Once per Game: Same Name | Field |
| **49** | `CB29-XX01` | ELS Qan［T］ | `CB29-XX01#a1` | Once per Game: Same Name | Field |
| **50** | `CB29-X06` | Gundam Calibarn ［Final Battle］ | `CB29-X06#a1` | Once per Game: Same Name | Field |
| **51** | `CB33-X05` | ［Blade of Execution］ Kirijo Mitsuru & Artemisia | `CB33-X05#a2` | Once per Game: Same Name | Field |
| **52** | `CB33-X03` | ［Blaze of Life］ Iori Junpei & Trismegistus | `CB33-X03#a1` | Once per Game: Same Name | Field |
| **62** | `PB39-XX01` | The ThreeFoolishBirds Larpentandad | `PB39-XX01#a0` | Once per Game: Same Name | Hand |
| **65** | `SD65-X01` | The Hellflame FourDemonLord Bram-Zahfag | `SD65-X01#a1` | Once per Game: Same Name | Field |

### 2.2 Evidentiary Basis and Limitations
1. **Official Source Authority:**
   - **Document:** Bandai Official Rule Revision Announcement (Ver. 16.0 / Ver. 17.0 update) and Bandai Official Glossary (`https://www.battlespirits.com/rule/`).
   - **Verbatim Japanese Definition:**
     > 「従来「この効果はゲーム中に1回しか使えない」等と表記されていた効果は、〔ゲームに1回：同名〕という記述に統一・変更されています。〔ゲームに1回：同名〕：同一のカード名を持つカード全体で、ゲーム中を通してプレイヤーにつき1回のみ発揮できる効果。」
   - **Faithful Translation:**
     > "Effects previously written as 'This effect can only be used once per game' are unified and changed to the notation [Once per Game: Same Name]. [Once per Game: Same Name]: An effect that, across all cards sharing the identical card name, can only be activated once per player throughout the entire game."
2. **What the Evidence Establishes:**
   - Establishes that the restriction applies **per player across all physical card copies bearing the same canonical name for the entire game**.
   - Proves that once activated, playing or summoning another physical copy of that card name cannot activate that ability again.
3. **What the Evidence Does NOT Establish:**
   - **Rejection of Official Q&A Q9:** Bandai Official Q&A Q9 explicitly addresses `〔ターンに1回：同名〕` (Once per Turn: Same Name), **NOT** Once per Game. Q9 must never be cited as direct proof of OPG semantics.
   - **Rejection of Generalization from CB10-029:** Q&A rulings Q13878 and Q13879 govern card `CB10-029` (Kamen Rider Necrom), which is an *Ordinary OPG* trigger from Trash. It does not establish Same Name OPG rules for other cards.
   - **Individual Card Rulings:** None of these 18 cards have an individual card Q&A entry in Bandai's database. Their verification rests entirely on the **general keyword definition** in the official glossary.
4. **Final Classification:** All 18 entries are classified as **`OFFICIALLY_VERIFIED`** at the keyword definition level.

---

## 3. Audit of the 13 Card-Specific Ruling Claims

In Phase 4C.3.1.7, 13 Ordinary OPG abilities were categorized as `SUPPORTED_BY_OFFICIAL_CARD_RULING` with citations such as `Official Bandai Card Q&A (P21-G03 Q&A)`.

### 3.1 Detailed Inspection of the 13 Claims

| Entry Index | Card Number | Card Name | IR Ability ID | Previous Citation | Audit Finding | Reclassified Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `P21-G03` | The IceRideDeity Vibryndi | `P21-G03#a1` | `(P21-G03 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **9** | `BATTLE-SPIRITS-A4318` | Future Aphrodite | `BATTLE-SPIRITS-A4318#a6` | `(BATTLE-SPIRITS-A4318 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **10** | `BS52-045` | The DruidPrincess Fidelma | `BS52-045#a0` | `(BS52-045 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **13** | `BS54-X03` | The SnakeEmperorDragon Garmeshard | `BS54-X03#a2` | `(BS54-X03 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **18** | `BS59-X07` | The ChrownosSupremeDeity Shin-Chronos | `BS59-X07#a1` | `(BS59-X07 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **43** | `BATTLE-SPIRITS-A3722` | Diaboromon Strikes Back | `BATTLE-SPIRITS-A3722#a1` | `(BATTLE-SPIRITS-A3722 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **47** | `CB21-029` | The 3rd Apsotle | `CB21-029#a0` | `(CB21-029 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **54** | `P17-EXG03` | The ExtremeKingTiger Jiu-Dian | `P17-EXG03#a1` | `(P17-EXG03 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **55** | `P17-EXG04` | The ExtremeMachineDeity Cry-Notis | `P17-EXG04#a1` | `(P17-EXG04 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **56** | `P17-EXG02` | The ExtremeCount Plenus | `P17-EXG02#a1` | `(P17-EXG02 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **57** | `P17-EXG01` | The ExtremeDragonDeity Extreme Dragon | `P17-EXG01#a1` | `(P17-EXG01 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **58** | `P17-EXG06` | The ExtremeGiant Exdremon | `P17-EXG06#a1` | `(P17-EXG06 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |
| **59** | `P17-EXG05` | The ExtremeHolySpirit Arkleo | `P17-EXG05#a1` | `(P17-EXG05 Q&A)` | No official Q&A ID or direct URL exists. | **`ENGINE_CONVENTION`** |

### 3.2 Justification for Downgrade
Under Section 1 (Constraint 6 & 7) and Section 4.2 of the audit mandate:
> *"A generic label such as 'Official Bandai Card Q&A (P21-G03 Q&A)' is not an adequate reference. If the exact Q&A cannot be located, downgrade the claim and explain the evidence gap."*

Because no specific Q&A IDs (e.g. Q12345) and direct URLs could be independently verified for these cards, claiming they are supported by official card rulings was an evidentiary overstatement. All 13 entries are formally downgraded to **`ENGINE_CONVENTION`**.

---

## 4. Preservation of the 47 Ordinary OPG Entries

With the 13 unverified card ruling claims downgraded, all **47 Ordinary OPG abilities** are now uniformly classified as **`ENGINE_CONVENTION`**.

### 4.1 Digital Engine Rationale
In physical Battle Spirits card play:
- Ordinary OPG text reads: "This effect can only be used once per game."
- In physical play, players track that a specific card copy has used its once-per-game effect during the game.
- If the card moves zones (e.g., from Field to Hand/Trash), paper game rules treat it as a new object without memory. However, cards that trigger from Hand or Trash (e.g., *CB10-029* Kamen Rider Necrom) have specific rulings stating that once used from Trash, re-entering Trash does not allow a second activation in that duel.
- To prevent infinite loops and maintain physical card tracking, the digital engine models Ordinary OPG via a **persistent `card.id` budget counter** stored in `state.restrictions.counters[player:opg_card_instance:cardId:abilityId]`.

This behavior is necessary for digital game fidelity, but it is an **engine convention**, not an explicit general clause in the Comprehensive Rules.

---

## 5. Final OPG Evidence Accounting

| Classification Category | Count | Percentage | Evidentiary Basis |
| :--- | :---: | :---: | :--- |
| **`OFFICIALLY_VERIFIED`** | **18** | 27.69% | Bandai Official Rule Revision Announcement & Glossary for `〔ゲームに1回：同名〕` |
| **`SUPPORTED_BY_OFFICIAL_CARD_RULING`** | **0** | 0.00% | 0 entries (all 13 unverified claims downgraded to engine conventions) |
| **`ENGINE_CONVENTION`** | **47** | 72.31% | Persistent `card.id` budget counter in `state.restrictions` |
| **`UNVERIFIED`** | **0** | 0.00% | 0 entries |
| **TOTAL** | **65** | **100.00%** | Exactly 65 canonical OPG abilities |

This accounting reconciles every single OPG ability in the Battle Spirits Eternal card database.
