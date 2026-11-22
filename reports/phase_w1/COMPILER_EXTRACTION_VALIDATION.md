# COMPILER EXTRACTION VALIDATION REPORT
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:28:54.532Z
**Subsystem:** `compiler/keyword_compiler.js` and `compiler/header_parser.js`

---

## 1. Executive Summary

Every one of the 348 Wiki keywords was evaluated for compiler catalog registration, regex extraction, colon/parameter handling, timing/level preservation, and ability binding.

| Compiler Metric | Audit Result | Status |
| :--- | :--- | :--- |
| **Total Wiki Keywords Tested** | **348** | 100% Tested |
| **Catalog Membership** | **348 / 348 (100.0%)** | All 348 keywords present in `KEYWORD_CATALOG` |
| **Extraction Success Rate** | **348 / 348 (100.0%)** | Correctly extracted from representative syntax |
| **Colon-Keyword Preservation** | **5 / 5 (100.0%)** | `Type: Driver`, `Type: Song`, `Type: Field`, `Type: Flower`, `Type: Vision` exact match |
| **Parameter Preservation** | **VERIFIED** | Parameters in `[Keyword: Param]` preserved without truncation |
| **Native vs Prose Segregation** | **VERIFIED** | Prose mentions excluded from `card.keywords` |
| **Multi-Level Range Expansion** | **VERIFIED** | `[LV1-LV3]` correctly expands to `[1, 2, 3]` |

---

## 2. Edge Case & Challenging Syntax Validation Results

The 9 notorious syntax edge cases that previously failed or caused parser regressions were audited directly:

### Edge Case: `Type: Driver`
- **Input Text:** `[LV1-LV2] [Type: Driver] While this Spirit is on field...`
- **Extracted Keywords:** `[{"name":"Type: Driver","param":null}]`
- **Parsed Header Keyword:** `Type: Driver`
- **Parsed Levels:** `[1,2]`
- **Parsed Timing:** ``

### Edge Case: `Type: Song`
- **Input Text:** `[Type: Song] Put 1 core from Void to Life.`
- **Extracted Keywords:** `[{"name":"Type: Song","param":null}]`
- **Parsed Header Keyword:** `Type: Song`
- **Parsed Levels:** `[1,2,3]`
- **Parsed Timing:** ``

### Edge Case: `Type: Field`
- **Input Text:** `[Type: Field] All your Spirits get +2000 BP.`
- **Extracted Keywords:** `[{"name":"Type: Field","param":null}]`
- **Parsed Header Keyword:** `Type: Field`
- **Parsed Levels:** `[1,2,3]`
- **Parsed Timing:** ``

### Edge Case: `Type: Flower`
- **Input Text:** `[Type: Flower] Draw 1 card.`
- **Extracted Keywords:** `[{"name":"Type: Flower","param":null}]`
- **Parsed Header Keyword:** `Type: Flower`
- **Parsed Levels:** `[1,2,3]`
- **Parsed Timing:** ``

### Edge Case: `Type: Vision`
- **Input Text:** `[Type: Vision] Look at opponent hand.`
- **Extracted Keywords:** `[{"name":"Type: Vision","param":null}]`
- **Parsed Header Keyword:** `Type: Vision`
- **Parsed Levels:** `[1,2,3]`
- **Parsed Timing:** ``

### Edge Case: `Multi-Keyword Header`
- **Input Text:** `[LV1-LV3] [Flash] [Infinite Blade] Target attack without exhaust.`
- **Extracted Keywords:** `[{"name":"Infinite Blade","param":null}]`
- **Parsed Header Keyword:** `Infinite Blade`
- **Parsed Levels:** `[1,2,3]`
- **Parsed Timing:** `Flash`

### Edge Case: `Unbracketed Armor`
- **Input Text:** `[LV1][LV2] Heavy Armor: Red/White Immune to Red/White.`
- **Extracted Keywords:** `[{"name":"Heavy Armor","param":"Red/White"}]`
- **Parsed Header Keyword:** `Heavy Armor: Red/White`
- **Parsed Levels:** `[1,2]`
- **Parsed Timing:** ``

### Edge Case: `Parameter Advent`
- **Input Text:** `[Flash] [Advent: Cost 6 or more] (Either Attack Step) By sending Soul Core...`
- **Extracted Keywords:** `[{"name":"Advent","param":"Cost 6 or more"}]`
- **Parsed Header Keyword:** `Advent: Cost 6 or more`
- **Parsed Levels:** `[1,2,3]`
- **Parsed Timing:** `Either Attack Step`

### Edge Case: `Range Bracket [LV1-LV3]`
- **Input Text:** `[LV1-LV3] (Your Attack Step) [Clash] Opponent must block if able.`
- **Extracted Keywords:** `[{"name":"Clash","param":null}]`
- **Parsed Header Keyword:** `Clash`
- **Parsed Levels:** `[1,2,3]`
- **Parsed Timing:** `Your Attack Step`


---

## 3. Real Card Sample Extraction Verification

Out of 348 keywords, **264 keywords** have verified physical or raw occurrences in `data/cards_detailed.json`.
Each was verified to extract correctly from the actual card effect text without synthetic modification.

For example:
- `Infinite Blade`: Verified on `BS33-X01` (`The MasterSwordsmanDragon Samurai-Dragon-Amatsu`). Extracted: `Infinite Blade`. Native: YES.
- `Type: Driver`: Verified on `CB28-061` (`The Transform Driver`). Extracted: `Type: Driver`.
- `Heavy Armor`: Verified on `BS10-X04` (`The GiantHero Titus`). Extracted: `Heavy Armor`, param: `Purple/White/Blue`.
