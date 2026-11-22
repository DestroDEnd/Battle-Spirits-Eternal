# NEWLY DISCOVERED DEFECTS REPORT (DEF-W1-15 THROUGH DEF-W1-20)
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:33:23.739Z

---

## 1. Executive Summary

Beyond the 14 defects cited in the historical audit, independent static analysis and runtime tracing during Phase W.1 identified **6 additional critical-to-medium architectural defects** in the BSP compiler and engine.

| Defect ID | Title | Subsystem | Severity | Remediation Status |
| :--- | :--- | :--- | :---: | :--- |
| **DEF-W1-15** | **Universal Keyword Misclassification: Prose Mentions Treated as Native Ownership** | `compiler/keyword_compiler.js -> bindKeywordsToAbilities` | **CRITICAL** | `REMEDIED_AND_VERIFIED` |
| **DEF-W1-16** | **73 Canonical Wiki Keywords Missing from Catalog and Runtime Registry** | `compiler/keyword_compiler.js and engine/keywords/` | **HIGH** | `REMEDIED_AND_VERIFIED` |
| **DEF-W1-17** | **Multi-Level Range Bracket Mangling [LV1-LV3] -> [LV1-[LV3]** | `compiler/header_parser.js` | **HIGH** | `REMEDIED_AND_VERIFIED` |
| **DEF-W1-18** | **Unbracketed Armor Headers Dropped from Ability Header Keyword** | `compiler/header_parser.js` | **MEDIUM** | `REMEDIED_AND_VERIFIED` |
| **DEF-W1-19** | **Infinite Blade Attacker Unconditionally Exhausted on Attack Declaration** | `engine/index.js -> declareAttack` | **HIGH** | `REMEDIED_AND_VERIFIED` |
| **DEF-W1-20** | **11 Armor Family Variants Omitted from isArmorFamily Continuous Immunity** | `engine/continuous.js` | **HIGH** | `REMEDIED_AND_VERIFIED` |

---

## 2. In-Depth Technical Defect Analysis

### DEF-W1-15: `Universal Keyword Misclassification: Prose Mentions Treated as Native Ownership`
- **Subsystem:** `compiler/keyword_compiler.js -> bindKeywordsToAbilities`
- **Severity:** `CRITICAL`
- **Detailed Description:** bindKeywordsToAbilities ran extractKeywords across raw block text (ability.rawText || header.cleanBody). Cards searching, referencing, or granting a keyword were falsely classified as natively possessing that keyword (e.g. BS33-072 and BS33-003 falsely given native Awaken, True-Clash, Showdown, Consecutive Blade).
- **Root Cause:** Failure to restrict native keyword binding strictly to ability headers (header.keyword, header.keywords, header.prefixes, unbracketed armor).
- **Architectural Impact:** Compromised card identity and game engine deck validation across thousands of cards.
- **Remediation Status:** `REMEDIED_AND_VERIFIED`

### DEF-W1-16: `73 Canonical Wiki Keywords Missing from Catalog and Runtime Registry`
- **Subsystem:** `compiler/keyword_compiler.js and engine/keywords/`
- **Severity:** `HIGH`
- **Detailed Description:** 73 legitimate Battle Spirits Wiki keywords were completely omitted from KEYWORD_CATALOG and KeywordRegistry (including Infinite Blade, Count Break, Manifest, Furious Charge, Twinkle Trace, Dark Esoterica, Pyroxene Esoterica, Return to Prime, Super Boost, etc.).
- **Root Cause:** Incomplete historical keyword cataloging from legacy wave sets.
- **Architectural Impact:** Cards with these keywords failed compilation or had abilities dropped.
- **Remediation Status:** `REMEDIED_AND_VERIFIED`

### DEF-W1-17: `Multi-Level Range Bracket Mangling [LV1-LV3] -> [LV1-[LV3]`
- **Subsystem:** `compiler/header_parser.js`
- **Severity:** `HIGH`
- **Detailed Description:** Regex .replace(/(?<!\[)LV(\d+)\]/gi, "[LV$1]") matched LV3] inside [LV1-LV3] because the preceding character was a hyphen. This produced malformed bracket syntax [LV1-[LV3], causing subsequent timing and keyword parsing to abort.
- **Root Cause:** Negative lookbehind did not account for hyphenated range brackets.
- **Architectural Impact:** Header parser aborted level and keyword extraction on all cards with range headers.
- **Remediation Status:** `REMEDIED_AND_VERIFIED`

### DEF-W1-18: `Unbracketed Armor Headers Dropped from Ability Header Keyword`
- **Subsystem:** `compiler/header_parser.js`
- **Severity:** `MEDIUM`
- **Detailed Description:** Cards formatted with unbracketed armor headers like [LV1][LV2] Heavy Armor: Red failed to match bracketed keyword regex in header while-loop, leaving header.keyword as null.
- **Root Cause:** While loop in parseAbilityHeaders only evaluated bracketed patterns [A-Za-z...].
- **Architectural Impact:** Required cards to rely on raw string fallbacks rather than structured keyword IR.
- **Remediation Status:** `REMEDIED_AND_VERIFIED`

### DEF-W1-19: `Infinite Blade Attacker Unconditionally Exhausted on Attack Declaration`
- **Subsystem:** `engine/index.js -> declareAttack`
- **Severity:** `HIGH`
- **Detailed Description:** declareAttack unconditionally transitioned attacking stack state to EXHAUSTED, ignoring Infinite Blade official ruling that the spirit does not exhaust when target-attacking while holding Soul Core.
- **Root Cause:** Combat declaration flow lacked target attack non-exhaustion exception hooks.
- **Architectural Impact:** Infinite Blade spirits were unable to execute consecutive target attacks as intended.
- **Remediation Status:** `REMEDIED_AND_VERIFIED`

### DEF-W1-20: `11 Armor Family Variants Omitted from isArmorFamily Continuous Immunity`
- **Subsystem:** `engine/continuous.js`
- **Severity:** `HIGH`
- **Detailed Description:** isArmorFamily only checked ["Armor", "Heavy Armor", "Ultra Armor", "Silver Wheel", "Barrage"]. Modern variants (Knight Armor, Contract Armor, Count Armor, Aurora Armor, PS Armor, VPS Armor, TP Armor, MD Armor, G.A.T. Field, Illusive Armor, Illusive Ultra Heavy Armor) were omitted, giving 0 color immunity.
- **Root Cause:** Hardcoded keyword array omitted modern armor variants.
- **Architectural Impact:** Cards with modern armor mechanics received zero continuous effect immunity.
- **Remediation Status:** `REMEDIED_AND_VERIFIED`

