# PREVIOUS 14 DEFECT REPRODUCTION REPORT
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:32:55.568Z
**Audit Target:** 14 Defect Claims from Historical Wiki Keyword Audit

---

## 1. Executive Summary

Each of the 14 mechanical defects cited in the historical audit report was independently investigated by analyzing source code, inspecting execution traces, and executing targeted automated tests.

| Defect # | Mechanic Claimed Defective | Historical Defect Confirmed | Current Status | Verification Outcome |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Curse blocker target never destroyed at battle end** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | onBlockDeclared tags target: true; onBattleEnd moves blocker to grave: true. |
| **2** | **True-Curse timing mismatch and silent target fallback** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | Silent fallback (|| oppField[0]) removed: true. Player autonomy strictly respected. |
| **3** | **Ultra Heavy Armor omitted from armor-family immunity** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | isImmune returns true for matching White effect: true. |
| **4** | **Wave Crush mechanics inherited incorrectly from Crush** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | Cost 8 banishes 3 cards to removed zone (actual: 3); fixes symbol to zero: true. |
| **5** | **XV Crush mechanics inherited incorrectly from Great Crush** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | 10 cards milled to grave plus conditional destruction of target (actual grave: 11). |
| **6** | **Heaven Holy Life incorrect scope** | **CONFIRMED** | `DEFECT_REPRODUCED_STILL_BROKEN` | Heaven Holy Life triggered by another friendly attacking spirit: life went from 3 to 3. |
| **7** | **Chaotic Holy Life incorrect trigger timing** | **CONFIRMED** | `DEFECT_REPRODUCED_STILL_BROKEN` | Triggered on block (life: 4) and battle end (life: 5). Verified authentic timing. |
| **8** | **Dark Assault incorrect refresh cost and effect** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | Discarded 3 cards from hand/decktop and refreshed attacker (actual grave: 3, state: REFRESHED). |
| **9** | **Clash defending player choice not enforced** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | resolveDirectHit strictly rejects with MUST_BLOCK_IF_ABLE when blockers exist: true. |
| **10** | **Type: Driver compiler extraction failure** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | extractKeywords('[Type: Driver]') extracted name: "Type: Driver", parameter: null. |
| **11** | **Type: Song compiler extraction failure** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | extractKeywords('[Type: Song]') extracted name: "Type: Song", parameter: null. |
| **12** | **Type: Field compiler extraction failure** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | extractKeywords('[Type: Field]') extracted name: "Type: Field", parameter: null. |
| **13** | **Type: Flower compiler extraction failure** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | extractKeywords('[Type: Flower]') extracted name: "Type: Flower", parameter: null. |
| **14** | **Type: Vision compiler extraction failure** | **CONFIRMED** | `DEFECT_REMEDIED_AND_VERIFIED` | extractKeywords('[Type: Vision]') extracted name: "Type: Vision", parameter: null. |

---

## 2. Detailed Defect Investigations

### Defect 1: `Curse blocker target never destroyed at battle end`
- **Rule Reference:** [Curse blocker target never destroyed at battle end](https://battle-spirits.fandom.com/wiki/Curse)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** state.combat.curseTargetStackId was set on block, but onBattleEnd hook was missing and engine/flow never resolved it.
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** onBlockDeclared tags target: true; onBattleEnd moves blocker to grave: true.

### Defect 2: `True-Curse timing mismatch and silent target fallback`
- **Rule Reference:** [True-Curse timing mismatch and silent target fallback](https://battle-spirits.fandom.com/wiki/True-Curse)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** True-Curse fell back silently to oppField[0] when prompt was declined, and WHEN_ATTACKS destruction timing was rejected.
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** Silent fallback (|| oppField[0]) removed: true. Player autonomy strictly respected.

### Defect 3: `Ultra Heavy Armor omitted from armor-family immunity`
- **Rule Reference:** [Ultra Heavy Armor omitted from armor-family immunity](https://battle-spirits.fandom.com/wiki/Ultra_Heavy_Armor)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Ultra Heavy Armor was missing from isArmorFamily array in engine/continuous.js line 659.
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** isImmune returns true for matching White effect: true.

### Defect 4: `Wave Crush mechanics inherited incorrectly from Crush`
- **Rule Reference:** [Wave Crush mechanics inherited incorrectly from Crush](https://battle-spirits.fandom.com/wiki/Wave_Crush)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Wave Crush was cloned from Crush (milled by LV to grave instead of banishing by cost to removed zone and fixing symbol 0).
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** Cost 8 banishes 3 cards to removed zone (actual: 3); fixes symbol to zero: true.

### Defect 5: `XV Crush mechanics inherited incorrectly from Great Crush`
- **Rule Reference:** [XV Crush mechanics inherited incorrectly from Great Crush](https://battle-spirits.fandom.com/wiki/XV_Crush)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** XV Crush was cloned from Great Crush (attack timing mill by LV instead of 10 mill and conditional cost 15 destruction).
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** 10 cards milled to grave plus conditional destruction of target (actual grave: 11).

### Defect 6: `Heaven Holy Life incorrect scope`
- **Rule Reference:** [Heaven Holy Life incorrect scope](https://battle-spirits.fandom.com/wiki/Heaven_Holy_Life)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Holy Life hook checked only attackerStack, failing when another friendly spirit dealt combat damage.
- **Current Verification Outcome:** `DEFECT_REPRODUCED_STILL_BROKEN`
- **Empirical Evidence:** Heaven Holy Life triggered by another friendly attacking spirit: life went from 3 to 3.

### Defect 7: `Chaotic Holy Life incorrect trigger timing`
- **Rule Reference:** [Chaotic Holy Life incorrect trigger timing](https://battle-spirits.fandom.com/wiki/Chaotic_Holy_Life)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Chaotic Holy Life was cloned from Holy Life (triggered on direct life damage instead of on block and at battle end).
- **Current Verification Outcome:** `DEFECT_REPRODUCED_STILL_BROKEN`
- **Empirical Evidence:** Triggered on block (life: 4) and battle end (life: 5). Verified authentic timing.

### Defect 8: `Dark Assault incorrect refresh cost and effect`
- **Rule Reference:** [Dark Assault incorrect refresh cost and effect](https://battle-spirits.fandom.com/wiki/Dark_Assault)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Dark Assault was cloned from Assault (expected Nexus exhaustion instead of discarding 3 cards from hand/decktop).
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** Discarded 3 cards from hand/decktop and refreshed attacker (actual grave: 3, state: REFRESHED).

### Defect 9: `Clash defending player choice not enforced`
- **Rule Reference:** [Clash defending player choice not enforced](https://battle-spirits.fandom.com/wiki/Clash)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** resolveDirectHit in engine/index.js did not verify mustBlockIfAble, permitting direct hits even when valid blockers existed.
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** resolveDirectHit strictly rejects with MUST_BLOCK_IF_ABLE when blockers exist: true.

### Defect 10: `Type: Driver compiler extraction failure`
- **Rule Reference:** [Type: Driver compiler extraction failure](https://battle-spirits.fandom.com/wiki/Type:_Driver)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Bracket parser regex /[([A-Za-z0-9.-s]+?):/ split on colon, reducing keyword name to "Type".
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** extractKeywords('[Type: Driver]') extracted name: "Type: Driver", parameter: null.

### Defect 11: `Type: Song compiler extraction failure`
- **Rule Reference:** [Type: Song compiler extraction failure](https://battle-spirits.fandom.com/wiki/Type:_Song)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Bracket parser regex /[([A-Za-z0-9.-s]+?):/ split on colon, reducing keyword name to "Type".
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** extractKeywords('[Type: Song]') extracted name: "Type: Song", parameter: null.

### Defect 12: `Type: Field compiler extraction failure`
- **Rule Reference:** [Type: Field compiler extraction failure](https://battle-spirits.fandom.com/wiki/Type:_Field)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Bracket parser regex /[([A-Za-z0-9.-s]+?):/ split on colon, reducing keyword name to "Type".
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** extractKeywords('[Type: Field]') extracted name: "Type: Field", parameter: null.

### Defect 13: `Type: Flower compiler extraction failure`
- **Rule Reference:** [Type: Flower compiler extraction failure](https://battle-spirits.fandom.com/wiki/Type:_Flower)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Bracket parser regex /[([A-Za-z0-9.-s]+?):/ split on colon, reducing keyword name to "Type".
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** extractKeywords('[Type: Flower]') extracted name: "Type: Flower", parameter: null.

### Defect 14: `Type: Vision compiler extraction failure`
- **Rule Reference:** [Type: Vision compiler extraction failure](https://battle-spirits.fandom.com/wiki/Type:_Vision)
- **Historical Defect Confirmed:** YES (Confirmed via source code inspection)
- **Historical Root Cause:** Bracket parser regex /[([A-Za-z0-9.-s]+?):/ split on colon, reducing keyword name to "Type".
- **Current Verification Outcome:** `DEFECT_REMEDIED_AND_VERIFIED`
- **Empirical Evidence:** extractKeywords('[Type: Vision]') extracted name: "Type: Vision", parameter: null.

