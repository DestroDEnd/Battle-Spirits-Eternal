# OWNERSHIP MISCLASSIFICATION & RELATIONSHIP AUDIT REPORT

## Executive Overview
Prior to this audit, BSP suffered from a systematic architectural defect: `compiler/keyword_compiler.js` ran keyword extraction across the full prose of ability clauses. This caused cards that merely search for, reference, trigger from, or counter a keyword to be indexed as **native keyword owners**.

## 1. Infinite Blade Validation (Primary Proof Case)
The suspected misclassification of **Infinite Blade** has been rigorously proved:

- **True Native Infinite Blade Owners**: **0** ()
  - `BS33-X01` (`The MasterSwordsmanDragon Samurai-Dragon-Amatsu`): Explicitly possesses `[Infinite Blade]` in its ability header:
    `[LV1][LV2][LV3] [Infinite Blade] (Your Attack Step) While there is [Soul Core] on this Spirit...`
- **Reference-Only Cards**: **0** ()
  - `BS33-072` (`One-Shot Sure-Hit Draw`): Magic card adding a Spirit card with `[Infinite Blade]` from decktop to Hand.
  - `BS33-003` (`The Tactician Crowderdragon`): Spirit card drawing when a Spirit with `[Infinite Blade]` attacks.
- **Granting Cards**: **0**
- **Prior BSP Defect**: In existing compiled shards, `BS33-072` and `BS33-003` were compiled with 4 native keywords (`Awaken`, `True-Clash`, `Showdown`, `Consecutive Blade`), inflating card ownership counts.

## 2. Global Relationship Totals Across Corpus
- **Total Keyword Relationship Instances**: **17256**
- **Genuine Native Keyword Ownership**: **6377**
- **Granted Keyword Abilities**: **193**
- **Keyword References in Filters/Triggers**: **463**
- **Supporting Modifier Relationships**: **196**
- **Counter / Anti-Keyword Checks**: **4**
- **Ambiguous Relationships**: **10023**

## 3. Discovered High-Impact Misclassifications

| Keyword | Native Owners | Referencing Cards | Granting Cards | Previous Error |
|---|---|---|---|---|
| **Infinite Blade** | 1 (BS33-X01) | 2 (BS33-072, BS33-003) | 0 | 2 reference cards treated as owners |
| **Consecutive Blade** | 22 | 8 | 1 | 8 reference cards treated as owners |
| **Showdown** | 14 | 12 | 0 | 12 reference cards treated as owners |
| **True-Clash** | 30 | 19 | 4 | 19 reference cards treated as owners |
| **Awaken** | 46 | 38 | 6 | 38 search/trigger cards treated as owners |

All card relationships are permanently indexed in `CARD_KEYWORD_RELATIONSHIPS.json` and `KEYWORD_OWNERSHIP_MATRIX.csv`.
