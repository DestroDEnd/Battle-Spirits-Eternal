# BATTLE SPIRITS ETERNAL (BSP) — KEYWORD IMPLEMENTATION BASELINE

**Document ID:** `BASELINE-2026-11-22`  
**Execution Environment:** Windows / Node.js v24.16.0 / Git `main`  
**Target Output Directory:** `reports/keyword_reconciliation_implementation/`  

---

## 1. Project Root & Git Status Baseline

- **Project Root:** `c:\Users\namis\Downloads\BSP`
- **Git Branch:** `main` (up to date with `origin/main`)
- **Git Working Tree:** Contains uncommitted modifications in compiler, data, and tests from prior work packages; working directory state preserved without destructive commands.
- **Untracked / Preserved Audit Reports:** `reports/wiki_keyword_audit/` preserved in full.

---

## 2. Quantitative Baseline Metrics

Every metric below is independently calculated directly from authoritative source files:

| Metric Category | Count | Source File / Evidence Location |
|---|---|---|
| **Canonical Cards (Unique)** | **14,443** | `data/cards_detailed.json` & `data/cards_index.json` |
| **Physical Card Instances (Sharded)** | **14,609** | `data/shard_manifest.json` (514 physical IR shard files) |
| **Total Wiki Keywords (Source of Truth)** | **348** | `https://battle-spirits.fandom.com/wiki/Keyword` |
| **Compiler Catalog Entries** | **281** | `compiler/keyword_compiler.js` (`KEYWORD_CATALOG`) |
| **Runtime Registry Entries** | **291** | `engine/keywords/index.js` (`createDefaultKeywordRegistry()`) |
| **Handlers with Real Executable Logic** | **225** | 92 event hooks + 133 helper methods + core engine subsystems |
| **Handlers with Empty Placeholder Stubs** | **66** | Handlers registered with `hooks: {}` and no executable methods |
| **Raw Keyword Bracket References in Corpus** | **23,841** | Total bracketed keyword occurrences across 14,443 cards |
| **Total Test Suites in Project** | **244** | `tests/*.test.js` discovered by `tests/run_all.js` |
| **Dedicated Keyword Test Suites** | **10** | `tests/keyword_*.test.js`, `advent_*.test.js`, `accel_*.test.js`, etc. |
| **Keyword Suite Test Count / Passing** | **93 tests (92 pass, 1 fail)** | `tests/work_package_k1_batch_03_keywords_prerequisites.test.js` |
| **Master Test Suite Baseline** | **2,593 tests (2,483 pass, 110 fail)** | Executed via `node tests/run_all.js` baseline |

---

## 3. Discovered Architectural & Ownership Defects

### A. The Core Ownership Confusion (Addressed in Part 3)
In the existing codebase, `compiler/keyword_compiler.js` (`bindKeywordsToAbilities`) runs `extractKeywords` indiscriminately over the entire body text of every ability clause.
- **Defect:** Cards that merely mention, search for, trigger off, or grant a keyword are incorrectly tagged as **natively possessing** that keyword.
- **Prime Regression Case (Infinite Blade):**
  - `BS33-X01` (`The MasterSwordsmanDragon Samurai-Dragon-Amatsu`) is the **ONLY** card that natively possesses `[Infinite Blade]`.
  - `BS33-072` (`One-Shot Sure-Hit Draw`) merely searches for spirits with `[Infinite Blade]`.
  - `BS33-003` (`The Tactician Crowderdragon`) merely triggers when a spirit with `[Infinite Blade]` attacks.
  - In existing compiled shards, `BS33-072` and `BS33-003` were both compiled as owning `Awaken`, `True-Clash`, `Showdown`, and `Consecutive Blade`, while `BS33-X01` had `Awaken` bound from its grant clause and missed `Infinite Blade` entirely because `Infinite Blade` was absent from `KEYWORD_CATALOG`.

### B. Confirmed Semantic & Engine Defects
1. **Curse Target Stack Destruction Missing:** `engine/keywords/wave1.js:31` sets `state.combat.curseTargetStackId = blockerStack.id`, but no engine code ever checks this property. Curse never destroys the blocker.
2. **True-Curse Timing Filter Mismatch:** `engine/keywords/registry.js:115` filters `DESTROYED` events with `{ timing: 'WHEN_DESTROYED' }`, dropping attack-timed `(When Attacks) [True-Curse]` abilities.
3. **Ultra Heavy Armor Immunity Omission:** `engine/continuous.js:658` omits `Ultra Heavy Armor` from `isArmorFamily`, providing zero immunity to cards with Ultra Heavy Armor.
4. **Wave Crush Mechanics Mismatch:** Cloned from `CrushKeyword`; mills by level instead of cost, to grave instead of removed zone, and omits the symbol zero lock.
5. **XV Crush Mechanics Mismatch:** Cloned from `GreatCrushKeyword`; triggers on attack instead of summon, with incorrect discard numbers.
6. **Heaven Holy Life Scope Mismatch:** Cloned from `HolyLifeKeyword`; checks only the attacking spirit instead of any friendly spirit.
7. **Chaotic Holy Life Trigger Mismatch:** Cloned from `HolyLifeKeyword`; triggers on damage instead of on block and at battle end.
8. **Dark Assault Cost Mismatch:** Cloned from `AssaultKeyword`; expects Nexus exhaustion instead of discarding 3 cards from hand/decktop.
9. **Clash Defending Player Choice Unenforced in Flow:** `state.combat.mustBlockIfAble` is only an AI heuristic, completely unenforced in human flow.
10. **Type: Bracket Regex Extraction Failure:** Colons in `[Type: Driver]`, `[Type: Song]`, `[Type: Field]`, `[Type: Flower]`, and `[Type: Vision]` split on colon, breaking catalog lookup.
11. **True-Curse Silent Candidate Fallback:** Falls back silently to `oppField[0]` when choice is declined or null.
12. **Waves 2–6 Prompt Controller Absence:** No prompt manager integration exists in Waves 2 through 6.
13. **Armor Piercing Exclusions:** `PIERCING_RULE` ignores custom armor keys like `Knight Armor`, `Contract Armor`, and `PS Armor`.
14. **Coexisting Replacement Standby Overwrite:** `stageStackStandby` stores a single `standby` object, overwriting concurrent replacement effects.

---

## 4. Execution Plan & Batch Sequencing

1. **Part 2:** Complete Wiki Keyword Discovery & JSON Schema compilation across all 348 keywords.
2. **Part 3:** Correct Keyword Ownership & Card Classification (Native vs Granted vs References vs Supports vs Counters vs Derived vs Ambiguous) with normalized database and Infinite Blade regression test.
3. **Part 4:** Build mechanical specifications for every keyword in `data/keyword_specs/{canonical_keyword_id}.json`.
4. **Part 5:** Map specifications to engine architecture.
5. **Part 6:** Implement keywords in dependency-ordered batches:
   - **Batch A:** Compiler & Ownership Extraction corrections (`compiler/keyword_compiler.js`, `header_parser.js`, `index.js`).
   - **Batch B:** Core Engine Defect Remediation (Curse, True-Curse, Ultra Heavy Armor, Wave Crush, XV Crush, Heaven Holy Life, Chaotic Holy Life, Dark Assault, Clash, Type: colons).
   - **Batch C:** Combat & Attack Keywords (*Infinite Blade, Consecutive Dominance, Furious Charge, True-Clash, Supreme Clash, Ultra Clash, Clash X, Assault, Dark Assault, Wave Crush, XV Crush*).
   - **Batch D:** Defensive, Armor & Resource Keywords (*Ultra Heavy Armor, Knight Armor, Contract Armor, Count Armor, Aurora Armor, PS/VPS/TP Armor, G.A.T. Field, Silver Wheel, Ice Wall, Barrier*).
   - **Batch E:** Trigger, Area & Modern Keywords (*Burst variants, Mirage variants, Accel, Change, High Speed variants, Rebirth variants, Seal variants, Unleash variants, Advent variants, Manifest variants*).
   - **Batch F:** Diva, Collab & Standard Format Keywords (*Stage/On Stage, Solo/Duet/Fleur Part, Digivolution, Trans-Am, Clock Up, Funnel, Barrage, Legacy, Fish Troop, Camouflage, Magirrate, Rumble, Current, Shamanism*).
6. **Part 7:** Rigorous Test Suite Execution & Regression Validation.
7. **Part 8 & 9:** Complete Deliverables & Evidence Reports.
