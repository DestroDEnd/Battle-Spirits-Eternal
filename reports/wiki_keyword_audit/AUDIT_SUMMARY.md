# BATTLE SPIRITS ETERNAL (BSP) — COMPLETE WIKI KEYWORD AUDIT SUMMARY

## Executive Summary

A comprehensive, evidence-based audit of every keyword cataloged on the official Battle Spirits Wiki against the current Battle Spirits Eternal (BSP) codebase has been completed.

This audit evaluated all **348** Wiki keywords across compiler extraction, card corpus presence, runtime registration, semantic correctness, player decision autonomy, and test evidence.

### High-Level Metrics
- **Total Wiki Keywords Identified**: **348**
- **Compiler-Recognized Keywords**: **275** (79.0%)
- **Runtime-Registered Keywords**: **275** (79.0%)
- **Keywords with Actual Executable Handlers**: **218** (62.6%)
- **Keywords Represented in Current Card Corpus**: **267** (76.7%)

### Primary Implementation Status Breakdown
| Status Classification | Keyword Count | Percentage |
|---|---|---|
| **FULLY_VERIFIED** | **27** | **7.8%** |
| **PARTIALLY_IMPLEMENTED** | **75** | **21.6%** |
| **HANDLER_ONLY** | **171** | **49.1%** |
| **COMPILER_ONLY** | **0** | **0.0%** |
| **CARD_DATA_ONLY** | **37** | **10.6%** |
| **MISSING** | **36** | **10.3%** |
| **UNVERIFIED** | **2** | **0.6%** |
| **Total** | **348** | **100.0%** |

### Test Evidence Quality Breakdown
- **T4 (Real-Card End-to-End)**: **32** keywords
- **T3 (Integration Synthetic)**: **69** keywords
- **T2 (Direct Handler Test)**: **0** keywords
- **T1 (Recognition Only)**: **13** keywords
- **T0 (No Test Evidence)**: **234** keywords

---

## Top 20 Highest-Priority Keyword Gaps
The following 20 keywords represent the largest functional gaps based on card database frequency and complete lack of compiler/runtime support:

| Rank | Keyword | Category | Unique Cards in DB | Current Status | Impact |
|---|---|---|---|---|---|
| 1 | **Manifest** | All (General) | 161 | CARD_DATA_ONLY | Affects 161 physical cards in current database |
| 2 | **Pyroxene Esoterica** | All (General) | 12 | CARD_DATA_ONLY | Affects 12 physical cards in current database |
| 3 | **Extreme Drive** | All (General) | 6 | CARD_DATA_ONLY | Affects 6 physical cards in current database |
| 4 | **Horoscoping** | All (General) | 6 | CARD_DATA_ONLY | Affects 6 physical cards in current database |
| 5 | **Supremacy** | All (Magic) | 6 | CARD_DATA_ONLY | Affects 6 physical cards in current database |
| 6 | **Count Break** | All (General) | 5 | CARD_DATA_ONLY | Affects 5 physical cards in current database |
| 7 | **Resonance** | Diva (General) | 4 | CARD_DATA_ONLY | Affects 4 physical cards in current database |
| 8 | **Resonance Blast** | Diva (General) | 4 | CARD_DATA_ONLY | Affects 4 physical cards in current database |
| 9 | **Infinite Blade** | Red (General) | 3 | CARD_DATA_ONLY | Affects 3 physical cards in current database |
| 10 | **Love Me Zone** | Collaboration (Aikatsu) | 2 | CARD_DATA_ONLY | Affects 2 physical cards in current database |
| 11 | **Astromulet** | All (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 12 | **Dark Esoterica** | All (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 13 | **Return to Prime** | All (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 14 | **Twinkle Dragonpulse** | All (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 15 | **Ultimate Energy** | All (Ultimate) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 16 | **Consecutive Dominance** | Red (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 17 | **Dragonshot** | Red (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 18 | **Emperor Road** | Red (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 19 | **Furious Charge** | Red (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |
| 20 | **Genesis** | Red (General) | 1 | CARD_DATA_ONLY | Affects 1 physical cards in current database |

---

## Confirmed Mechanical Defects
A total of **14** confirmed defects were identified in existing keyword handlers:
1. **Curse Target Stack Never Destroyed**: `curseTargetStackId` is set on block but never checked anywhere in the engine.
2. **True-Curse Timing Gating Failure**: `registry.getActiveKeywords` checks `WHEN_DESTROYED`, discarding attack-timed True-Curse.
3. **Ultra Heavy Armor Omission**: Omitted from `isArmorFamily` array in `engine/continuous.js`, granting zero immunity.
4. **Wave Crush Mechanics Mismatch**: Cloned from Crush; mills level instead of cost, to grave instead of removed zone, and omits symbol zero lock.
5. **XV Crush Mechanics Mismatch**: Cloned from Great Crush; uses attack timing instead of summon timing, with incorrect discard numbers.
6. **Heaven Holy Life Scope Mismatch**: Cloned from Holy Life; only checks attacker stack instead of all friendly spirits.
7. **Chaotic Holy Life Trigger Mismatch**: Cloned from Holy Life; triggers on damage instead of on block and at battle end.
8. **Dark Assault Cost Mismatch**: Cloned from Assault; expects Nexus exhaustion instead of sending 3 cards from hand/decktop to trash.
9. **Clash Defending Player Choice Unenforced**: `mustBlockIfAble` is only an AI heuristic, completely unenforced in human flow.
10. **Type: Bracket Regex Collision**: Colons in `[Type: Driver]`, `[Type: Song]`, `[Type: Field]`, `[Type: Flower]`, `[Type: Vision]` break compiler extraction.

---

## Verification & Project Safety Confirmation
- **Project safety**: No project source code, card data, tests, or existing reports were modified.
- **All reports and evidence** are archived under: `reports/wiki_keyword_audit/`.
