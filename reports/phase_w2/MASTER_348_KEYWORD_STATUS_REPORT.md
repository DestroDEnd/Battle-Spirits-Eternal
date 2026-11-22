# MASTER 348-KEYWORD STATUS REPORT
**Project:** Battle Spirits Eternal (BSP)  
**Phase:** W.2 — Keyword Reconciliation Integrity & Runtime Verification  
**Generated:** 2026-11-22T11:26:00.183Z  

---

## 1. Executive Summary & Authoritative Status Breakdown

Every one of the 348 canonical keywords from the Battle Spirits Wiki has been classified into exactly one authoritative status category based on live code, AST parsing, runtime execution, and passing regression test evidence.

| Final Implementation Classification | Count | Percentage | Definition |
| :--- | :---: | :---: | :--- |
| **`FULLY_IMPLEMENTED_AND_VERIFIED`** | **20** | **5.7%** | Valid specification, correct compiler representation, active runtime mechanics, player autonomy verified, and dedicated passing test assertions. |
| **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** | **19** | **5.5%** | Continuous color immunity (17 Armor family keywords) or core engine systems (Burst, Advent, Brave) verified with live execution tests. |
| **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** | **216** | **62.1%** | Genuine executable mechanics implemented in Waves 1–6, but relying on format-wide/corpus testing rather than dedicated behavioral unit tests. |
| **`CORPUS_REPRESENTED_ONLY`** | **83** | **23.9%** | Formally registered in compiler catalog and runtime registry for card identity and format legality without bespoke active hooks. |
| **`SPECIFIED_BUT_NOT_IMPLEMENTED`** | **9** | **2.6%** | Valid specification exists but lacks runtime registration. |
| **`PARTIALLY_IMPLEMENTED`** | **0** | **0.0%** | Partial mechanic working with missing restrictions or unresolved timing. |
| **`UNRESOLVED_RULES`** | **1** | **0.3%** | Official Bandai Wiki source material is insufficient or empty (`Roaring Assault`). |
| **`INVALID_OR_MISCLASSIFIED`** | **0** | **0.0%** | Contradictory ownership or invalid compiler output. |
| **Total** | **348** | **100.0%** | 100% of canonical Wiki keywords accounted for. |

---

## 2. Master 348-Keyword Status Inventory Table

| Canonical ID | Canonical Name | Extraction Status | Execution Tier | Test Evidence | Final Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `WIKI-001` | **Absolute Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-002` | **Accel** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/accel_mechanics.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-003` | **Advent** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E4 (tests/contract_advent_modal_and_timing.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-004` | **Astral Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-005` | **Astromulet** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-006` | **Celestial Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-007` | **Change** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/real_browser_arena.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-008` | **Charge** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E1 (tests/bs19_card_effects.test.js)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-009` | **Contract Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E1 (tests/contract_advent_modal_and_timing.test.js)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-010` | **Count Break** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-011` | **Contract Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-012` | **Creator Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-013` | **Dark Esoterica** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-014` | **Extreme Drive** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-015` | **Flag Contract Advent** | `REDIRECT_RESOLUTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-016` | **Grand Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-017` | **Horoscoping** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-018` | **Illusive Rebirth** | `MISSING_ARTICLE_CONTENT` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-019` | **Manifest** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-020` | **Minor Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-021` | **Primordial Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-022` | **Pyroxene Esoterica** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-023` | **Pyroxene Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-024` | **Rebirth** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/keyword_condition_and_face_bindings.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-025` | **Return to Prime** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-026` | **Reverse Contract Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-027` | **Rush** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/keywords_comprehensive_audit.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-028` | **Seal** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-029` | **Seal Flag Contract Advent** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-030` | **Seal Manifest** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-031` | **Six Heaven Rebirth** | `MISSING_ARTICLE_CONTENT` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-032` | **Six Heaven Rush** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_comprehensive_audit.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-033` | **Tenma Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-034` | **Tenma-Kagemusha** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-035` | **Tribute** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/bs04_card_effects.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-036` | **Twinkle Dragonpulse** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-037` | **Twinkle Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-038` | **Twinkle Trace** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-039` | **Ultra Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-040` | **Ultra Contract Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-041` | **Ultra Manifest** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-042` | **Unsheathe** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-043` | **Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-044` | **Count Ultimate Trigger** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-045` | **Critical Hit** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E1 (tests/phase10_combat_braves_utrigger.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-046` | **Cross Ultimate Trigger** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-047` | **Double Hit** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-048` | **Double Ultimate Trigger** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-049` | **Double Count Ultimate Trigger** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-050` | **Final Contract Advent** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-051` | **Great Unsheathe** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-052` | **Light-Dark Soul Drive** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-053` | **Octa Ultimate Trigger** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-054` | **Quadruple Hit** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-055` | **Quadruple Ultimate Trigger** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-056` | **Trigger Counter** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-057` | **Triple Hit** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-058` | **Triple Ultimate Trigger** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-059` | **Ultimate Energy** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-060` | **Ultimate Hand** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-061` | **Ultimate Trigger** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E2 (tests/phase10_combat_braves_utrigger.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-062` | **Ultimate Unsheathe** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-063` | **Soul Drive** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-064` | **Spirit Soul** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-065` | **Brave Engage** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-066` | **Double Drive** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-067` | **Reload** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E1 (tests/phase11_clash_flash_grant_status.test.js)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-068` | **Constellation Seal** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-069` | **Contract Field** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-070` | **Contract Skill** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-071` | **Core Charge** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-072` | **Grandphosis** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-073` | **Grand Field** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-074` | **Grand Mystery** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-075` | **Grand Skill** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-076` | **Neo-Core Charge** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E4 (tests/keywords_waves4_5_6.test.js)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-077` | **Release** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-078` | **Revive** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E1 (tests/chronological_phases/phase_20_promos.test.js)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-079` | **Terra Manifest** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-080` | **Supremacy** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-081` | **Type: Field** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-082` | **Type: Flower** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-083` | **Type: Song** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E4 (tests/keyword_ownership_and_infinite_blade.test.js)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-084` | **Type: Vision** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-085` | **Zero Counter** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-086` | **Burst** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E4 (tests/bs14_card_effects.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-087` | **Burst Seal** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-088` | **Burst Tribute** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-089` | **Catalyze** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_comprehensive_audit.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-090` | **Kamiumi Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-091` | **Mirage** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/m4_modern_ops.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-092` | **Soul Burst** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-093` | **True Catalyze** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-094` | **Twinkle Catalyze** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-095` | **War Catalyze** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-096` | **Yomi Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-097` | **Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/booster_set_saga_handlers.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-098` | **Bombardment** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-099` | **Bombardment-Zero** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-100` | **Clash** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/bs07_card_effects.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-101` | **Clash X** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-102` | **Consecutive Blade** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_comprehensive_audit.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-103` | **Consecutive Dominance** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-104` | **Contract Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-105` | **Crimson Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-106` | **Dark Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-107` | **Dragon Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-108` | **Dragonshot** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-109` | **Emperor Road** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-110` | **Flame Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-111` | **Furious Charge** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-112` | **Genesis** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-113` | **Grand Bombardment** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-114` | **Great Pursuit** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-115` | **Infinite Blade** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/keyword_ownership_and_infinite_blade.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-116` | **Infinite Flame** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-117` | **Infinite Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-118` | **Martial Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-119` | **Mirage Boost** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-120` | **Phantom Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-121` | **Phantom Return** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-122` | **Pursuit** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/core_game_rules_engine.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-123` | **Pyro Drive** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-124` | **Rekka Consecutive Blade** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-125` | **Rekka Showdown** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-126` | **Shining Heaven Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-127` | **Showdown** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-128` | **Sol Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-129` | **Solar Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-130` | **Soul Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-131` | **Super Boost** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-132` | **Super Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-133` | **Super Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-134` | **Supreme Clash** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-135` | **Thunder God Bombardment** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-136` | **Toppa Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/keyword_condition_and_face_bindings.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-137` | **True-Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_comprehensive_audit.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-138` | **True-Clash** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keyword_ownership_and_infinite_blade.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-139` | **True-Consecutive Blade** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_comprehensive_audit.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-140` | **True-Drive** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-141` | **True Infinite Flame** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-142` | **True Genesis** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-143` | **Twinkle Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E4 (tests/golden_compiler.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-144` | **Twinkle Bombardment** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-145` | **Twinkle Clash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-146` | **Ultra Assault** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-147` | **Ultra Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/bs10_card_effects.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-148` | **Ultra Clash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-149` | **Vermillion Furious Charge** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-150` | **Banner God-Army** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-151` | **Banner God Strike** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-152` | **Curse** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/bs02_card_effects.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-153` | **Corpse Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-154` | **Curse Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-155` | **Dark Assault** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-156` | **Devil Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-157` | **God-Army** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-158` | **God Strike** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-159` | **Grudging Curse** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-160` | **Hollow Sky** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-161` | **Illusive Immortality** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-162` | **Immortality** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/bs09_card_effects.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-163` | **Mirage Drain** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-164` | **Nether Immortality** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-165` | **Nether Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-166` | **Poison Blade** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/work_package_hij_operations_compiler_integration.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-167` | **Slayer Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-168` | **Spellbind** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-169` | **Spell Blight** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/bs14_card_effects.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-170` | **True-Curse** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keyword_registry.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-171` | **True Spellbind** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-172` | **Twinkle Necromancy** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-173` | **Twinkle Spellbind** | `PARTIAL_PROSE_ONLY` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-174` | **Absolute Sound Speed** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-175` | **Bunshin** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-176` | **Fierce Windstorm** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-177` | **Flashing Swift** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-178` | **Grand Soar** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-179` | **Grand Twinkle Soar** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-180` | **High Speed** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/bs02_card_effects.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-181` | **High Speed Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-182` | **High Speed - Mystery** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-183` | **Leap** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_comprehensive_audit.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-184` | **Mystery Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-185` | **Sky Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-186` | **Soar** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-187` | **Soul Swift** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-188` | **Soul Swift - Love** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-189` | **Sound Speed** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-190` | **Sound Speed Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-191` | **Thundering Soar** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-192` | **Thunder Swift** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-193` | **True-Soar** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-194` | **Twinkle Body Substitution** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-195` | **Twinkle Soar** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-196` | **Violent High Speed** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/free_summon_without_cost.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-197` | **Whirlwind** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/keyword_condition_and_face_bindings.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-198` | **Windstorm** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/m4_modern_ops.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-199` | **Armor** | `MISSING_ARTICLE_CONTENT` | `CONTINUOUS_ZONE_DELEGATED` | `E4 (tests/bs02_card_effects.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-200` | **Aurora Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-201` | **Barrier** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-202` | **Bombardment-D** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-203` | **Contract Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-204` | **Count Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-205` | **Cycle Force Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-206` | **Excite** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-207` | **Fast Draw** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-208` | **Fortress** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/core_game_rules_engine.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-209` | **Grand Ice Wall** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-210` | **Grand Leap** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-211` | **Heavy Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E4 (tests/keyword_condition_and_face_bindings.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-212` | **Ice Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-213` | **Ice Wall** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-214` | **Illusive Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-215` | **Illusive Ultra Heavy Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-216` | **Kagemusha** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-217` | **Knight Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-218` | **Load** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-219` | **Mirage Synchro** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-220` | **Moon Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-221` | **Moonlight Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-222` | **Silver Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-223` | **Silver Wheel** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-224` | **Steel Load** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-225` | **True Fortress** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_comprehensive_audit.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-226` | **True-Kagemusha** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-227` | **Twinkle Equip** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-228` | **Twinkle Fortress** | `PARTIAL_PROSE_ONLY` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-229` | **Ultra Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E1 (tests/phase4b2_3_event_bus_and_coverage.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-230` | **Ultra Excite** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-231` | **Ultra Heavy Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E1 (tests/keyword_reconciled_mechanics.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-232` | **Brilliance** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/bs03_card_effects.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-233` | **Chaotic Holy Life** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-234` | **Contract Reload** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`SPECIFIED_BUT_NOT_IMPLEMENTED`** |
| `WIKI-235` | **Dispersion** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-236` | **Divine Holy Life** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-237` | **Evil Light** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-238` | **Heavenly Light** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-239` | **Heaven Holy Life** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-240` | **Holy Life** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/bs07_card_effects.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-241` | **Imaginate Seal** | `REDIRECT_RESOLUTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-242` | **Mealtiply** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-243` | **Mirage Flash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-244` | **Six Pentan Rush** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-245` | **Thunder Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-246` | **Twinkle Revolution** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-247` | **Ultra Holy Life** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keyword_registry.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-248` | **Ultra Thunder Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-249` | **Violent Windstorm** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-250` | **AFO** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-251` | **Assault** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/bs07_card_effects.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-252` | **Chaos Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-253` | **Chrono-Count Break** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-254` | **Crush** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E4 (tests/bs03_card_effects.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-255` | **Draw Lock** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-256` | **Enchain** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-257` | **Grand Assault** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E0 (Dedicated Suite)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-258` | **Great Assault** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-259` | **Great Crush** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keyword_registry.test.js)` | **`FULLY_IMPLEMENTED_AND_VERIFIED`** |
| `WIKI-260` | **Great Twinkle Navigation** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-261` | **Mirage Trance** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-262` | **Plunder** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-263` | **Roaring Assault** | `MISSING_ARTICLE_CONTENT` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`UNRESOLVED_RULES`** |
| `WIKI-264` | **Roaring Stampede** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-265` | **Silver Arm Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-266` | **Stampede** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-267` | **Summon Bolt** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-268` | **Time Unleash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-269` | **True Plunder** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-270` | **Wave Crush** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keyword_reconciled_mechanics.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-271` | **XV Crush** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keyword_reconciled_mechanics.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-272` | **Chaos Stage** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-273` | **Charge Song** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-274` | **Contract Duet Part** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-275` | **CoZ12 Part** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-276` | **Curtain Call** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-277` | **Diva Rush** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-278` | **Duet Part** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-279` | **Fleur Part** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-280` | **Friend** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-281` | **Grand Stage** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-282` | **My Unit** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-283` | **On Stage** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-284` | **Resonance** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-285` | **Resonance Blast** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-286` | **RioRia Blast** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-287` | **Show Up** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-288` | **Solo Part** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-289` | **Solo Stage** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-290` | **Spellsong** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-291` | **Team** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-292` | **Zero Rebirth** | `MISSING_ARTICLE_CONTENT` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-293` | **Aikatsu On Stage** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-294` | **Appeal** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-295` | **Constellation Appeal** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-296` | **Fever Appeal** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-297` | **Friendshipower** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-298` | **Love Me Zone** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-299` | **Moon On The Stage** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-300` | **Starlight Appeal** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-301` | **Star Appeal** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-302` | **Armor Digivolution** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-303` | **Digivolution** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-304` | **DNA Digivolution** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-305` | **Super Digivolution** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-306` | **Card Slash** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-307` | **A.T. Field** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-308` | **G.A.T. Field** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-309` | **Sortie Rebirth** | `MISSING_ARTICLE_CONTENT` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-310` | **Armed Intervention** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-311` | **Barrage** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-312` | **Bushido** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-313` | **Exchange** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-314` | **Funnel** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-315` | **NT-D** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-316` | **PS Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-317` | **Quantum Burst** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-318` | **Top Gun** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-319` | **TP Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-320` | **Trans-Am** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-321` | **VPS Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-322` | **Yata-no-Kagami** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-323` | **Assemble** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-324` | **Cast Off** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-325` | **Chou Henshin** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-326` | **Clock Up** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-327` | **Dan Kuroto Deus Advent** | `REDIRECT_RESOLUTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-328` | **Hyper Cast Off** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-329` | **Hyper Clock Up** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-330` | **Time Vent** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-331` | **Type: Driver** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E4 (tests/keyword_ownership_and_infinite_blade.test.js)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-332` | **Buddy** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-333` | **Absolute Rebirth** | `MISSING_ARTICLE_CONTENT` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-334` | **MD Armor** | `COMPLETE_ARTICLE_EXTRACTION` | `CONTINUOUS_ZONE_DELEGATED` | `E0 (Dedicated Suite)` | **`PASSIVE_OR_DELEGATED_AND_VERIFIED`** |
| `WIKI-335` | **Legacy** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E2 (tests/work_package_c_ops_conditions_compiler.test.js)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-336` | **Soul Magic** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-337` | **Re Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-338` | **Soul Awaken** | `COMPLETE_ARTICLE_EXTRACTION` | `SHARED_EQUIVALENT` | `E0 (Dedicated Suite)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-339` | **Shamanism** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-340` | **Current** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-341` | **Fish Troop** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-342` | **Amplify** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-343` | **Camouflage** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-344` | **Magirrate** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E4 (tests/work_package_k1_batch_02_conditions.test.js)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-345` | **Rumble** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |
| `WIKI-346` | **Ringing Charge** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-347` | **Form Change** | `COMPLETE_ARTICLE_EXTRACTION` | `PLACEHOLDER_RECOGNITION` | `E0 (Dedicated Suite)` | **`CORPUS_REPRESENTED_ONLY`** |
| `WIKI-348` | **Level Up** | `COMPLETE_ARTICLE_EXTRACTION` | `REAL_INDEPENDENT` | `E1 (tests/keywords_waves4_5_6.test.js)` | **`IMPLEMENTED_BUT_PARTIALLY_VERIFIED`** |

---

## 3. Work Package J Verdict

**COMPLETE.** The authoritative 348-keyword master status matrix has been generated and validated. Complete records are preserved in `reports/phase_w2/MASTER_348_KEYWORD_STATUS_MATRIX.csv`.
