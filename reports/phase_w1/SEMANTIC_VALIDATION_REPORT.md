# SEMANTIC VALIDATION REPORT
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:32:05.096Z
**Source of Truth:** [Battle Spirits Wiki Keyword Index](https://battle-spirits.fandom.com/wiki/Keyword)

---

## 1. Executive Summary

Every one of the 348 Wiki keywords was analyzed against its official rules text and Bandai rulings to establish semantic accuracy.

| Semantic Classification | Keyword Count | Description |
| :--- | :--- | :--- |
| **Semantically Authentic** | **106** | Active lifecycle hooks or continuous operations authentically implementing Wiki rules. |
| **Spec-Defined Registry Placeholder** | **242** | Complete JSON specification in `data/keyword_specs/` with format recognition in `KeywordRegistry`. |
| **Partial Semantic Match** | **0** | Implements core behavior but omits documented rule exceptions. |
| **Ambiguous / Unresolved** | **0** | Rule text incomplete or official Bandai ruling unavailable. |
| **Total Evaluated** | **348** | 100% of canonical Wiki keywords accounted for. |

---

## 2. Semantic Alignment Spotlights

### 1. `Wave Crush` (Banish to Removed Zone, Cost Formula, Symbol 0 Lock)
- **Official Definition:** "Banish a card from the opposing decktop. For each 4 cost this Spirit has, this effect banishes +1 card. Also, this Spirit's symbol is fixed as zero."
- **Engine Implementation:** `1 + Math.floor(cost / 4)` cards moved to `opp.removed` via `moveCard`, and `state.combat.fixedSymbolZero = true` forces symbol damage to 0 in `resolveDirectHit`.
- **Verdict:** `SEMANTICALLY_AUTHENTIC`.

### 2. `XV Crush` (10 Card Mill & Conditional Cost 15 Destroy)
- **Official Definition:** "(Once per Turn: Same Name) You can discard ten cards from the opposing decktop. Then, if there is any opposing cards being banished, destroy any number of opposing Spirits/Ultimates up to a total cost of 15."
- **Engine Implementation:** Mills 10 cards to grave, verifies `opp.removed` / `opp.open`, and prompts user to destroy targets up to total cost 15.
- **Verdict:** `SEMANTICALLY_AUTHENTIC`.

### 3. `Infinite Blade` (Target Attack Without Exhaustion)
- **Official Definition:** "(Your Attack Step) While there is (Soul Core) on this Spirit, this Spirit can target and attack an opposing Spirit/Ultimate. When you do, this Spirit doesn't exhaust."
- **Engine Implementation:** Checks Soul Core presence, locks chosen opposing spirit into `state.combat.blockerStackId`, and restores `attackerStack.state = 'REFRESHED'`.
- **Verdict:** `SEMANTICALLY_AUTHENTIC`.

### 4. `Chaotic Holy Life` vs `Heaven Holy Life`
- **Chaotic Holy Life:** Triggers on block and at battle end: 1 core from Void to Life.
- **Heaven Holy Life:** Triggers on life damage from any friendly spirit: 1 core from Void to Life.
- **Verdict:** Both independently modeled with accurate triggers.

---

## 3. Sample Semantic Alignment Matrix

| Canonical Name | Timing | Target Eligibility | Semantic Status | Semantic Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Absolute Unleash** | `YOUR_ATTACK_STEP` | `OPPOSING_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-001.json; registered in engine without dedicated event hooks. |
| **Accel** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-002.json; registered in engine without dedicated event hooks. |
| **Advent** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-003.json; registered in engine without dedicated event hooks. |
| **Astral Unleash** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-004.json; registered in engine without dedicated event hooks. |
| **Astromulet** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-005.json; registered in engine without dedicated event hooks. |
| **Celestial Unleash** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-006.json; registered in engine without dedicated event hooks. |
| **Change** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-007.json; registered in engine without dedicated event hooks. |
| **Charge** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-008.json; registered in engine without dedicated event hooks. |
| **Contract Advent** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-009.json; registered in engine without dedicated event hooks. |
| **Count Break** | `WHEN_ATTACKS` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-010.json; registered in engine without dedicated event hooks. |
| **Contract Unleash** | `PASSIVE` | `OPPOSING_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-011.json; registered in engine without dedicated event hooks. |
| **Creator Unleash** | `YOUR_ATTACK_STEP` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-012.json; registered in engine without dedicated event hooks. |
| **Dark Esoterica** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-013.json; registered in engine without dedicated event hooks. |
| **Extreme Drive** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-014.json; registered in engine without dedicated event hooks. |
| **Flag Contract Advent** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-015.json; registered in engine without dedicated event hooks. |
| **Grand Advent** | `FLASH` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-016.json; registered in engine without dedicated event hooks. |
| **Horoscoping** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-017.json; registered in engine without dedicated event hooks. |
| **Illusive Rebirth** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-018.json; registered in engine without dedicated event hooks. |
| **Manifest** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-019.json; registered in engine without dedicated event hooks. |
| **Minor Unleash** | `GRAND_SKILL` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-020.json; registered in engine without dedicated event hooks. |
| **Primordial Unleash** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-021.json; registered in engine without dedicated event hooks. |
| **Pyroxene Esoterica** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-022.json; registered in engine without dedicated event hooks. |
| **Pyroxene Seal** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-023.json; registered in engine without dedicated event hooks. |
| **Rebirth** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-024.json; registered in engine without dedicated event hooks. |
| **Return to Prime** | `PASSIVE` | `OPPOSING_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-025.json; registered in engine without dedicated event hooks. |
| **Reverse Contract Advent** | `PASSIVE` | `OPPOSING_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-026.json; registered in engine without dedicated event hooks. |
| **Rush** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-027.json; registered in engine without dedicated event hooks. |
| **Seal** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-028.json; registered in engine without dedicated event hooks. |
| **Seal Flag Contract Advent** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-029.json; registered in engine without dedicated event hooks. |
| **Seal Manifest** | `PASSIVE` | `FRIENDLY_FIELD` | `SPEC_DEFINED_REGISTRY_PLACEHOLDER` | Official rules specified in data/keyword_specs/WIKI-030.json; registered in engine without dedicated event hooks. |
*(Showing 30 of 348 records; full matrix saved in `reports/phase_w1/semantic_validation.json`)*
