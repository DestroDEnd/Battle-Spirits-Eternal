# KEYWORD DEFECTS AND FIXES LOG
**Project:** Battle Spirits Eternal (BSP)
**Subsystem:** Keyword Reconciliation & Rules Enforcement
**Generated:** 2026-11-22T07:04:49.386Z

---

### Defect 1: Universal Keyword Misclassification in Ability Compiler
- **File:** `compiler/keyword_compiler.js` (former line 385)
- **Symptom:** Cards searching, referencing, or granting a keyword were classified as having native ownership of that keyword.
- **Root Cause:** `bindKeywordsToAbilities` called `extractKeywords(blockText)` over the entire ability body (`ability.rawText || header.cleanBody`) and pushed every extracted keyword into `ability.keywords` and `card.keywords`.
- **Architectural Fix:**
  - Segregated native keyword extraction strictly to ability headers (`header.keywords`, `header.keyword`, `header.prefixes`, and initial unbracketed armor).
  - Processed body text keywords into `ability.referencedKeywords`, `ability.grantedKeywords`, `ability.supportedKeywords`, and `ability.counteredKeywords`.
  - Excluded all non-header keywords from `ability.keywords` and `card.keywords`.
- **Verification:** `tests/keyword_ownership_and_infinite_blade.test.js` (Test 1).

---

### Defect 2: 73 Missing Wiki Keywords in Catalog and Runtime Registry
- **Files:** `compiler/keyword_compiler.js` and `engine/keywords/wave1.js` through `wave5.js`
- **Symptom:** 73 valid Battle Spirits Wiki keywords were completely unrecognized by the compiler and absent from the runtime keyword registry.
- **Root Cause:** Incomplete historical wave migration omitted keywords from anime spinoffs, collaboration sets, modern era sets, and signature cards (including `Infinite Blade`, `Count Break`, `Manifest`, `Twinkle Trace`, `Dark Esoterica`, etc.).
- **Architectural Fix:** Added all 73 missing keywords to `KEYWORD_CATALOG` and registered definitions/handlers across `wave1.js`, `wave2.js`, `wave3.js`, `wave4.js`, and `wave5.js`.
- **Verification:** Automated catalog and registry coverage audit verified 100% of 348 Wiki keywords.

---

### Defect 3: Colon-Containing Keyword Truncation
- **Files:** `compiler/keyword_compiler.js` and `compiler/header_parser.js`
- **Symptom:** Keywords with internal colons (e.g. `[Type: Driver]`, `[Type: Song]`, `[Type: Field]`) were split at the first colon, producing `rawName: 'Type'`, which failed catalog lookup.
- **Root Cause:** Non-greedy regex `/[([A-Za-z0-9.-s]+?)(?:::s*([^]]+)|:s*([^]]+))?]/g` split at the first colon before checking the full catalog key.
- **Architectural Fix:** Updated bracket pattern to capture full bracket content and check against `SORTED_CATALOG_KEYS` (sorted by length descending), correctly matching `Type: Driver` before attempting parameter split.
- **Verification:** `tests/keyword_ownership_and_infinite_blade.test.js` (Test 2).

---

### Defect 4: Malformed Multi-Level Bracket Mangling
- **File:** `compiler/header_parser.js` (former line 102)
- **Symptom:** Ability headers starting with ranges like `[LV1-LV3]` were mangled into `[LV1-[LV3]`, causing level parsing, timing extraction, and keyword extraction to abort.
- **Root Cause:** Single-bracket normalization `.replace(/(?<![)LV(d+)]/gi, '[LV$1]')` matched the `LV3]` inside `[LV1-LV3]` because the character before `LV3` was `-`, not `[`.
- **Architectural Fix:** Inserted range bracket expansion `[LV(\d+)-LV?(\d+)]` (e.g. expanding `[LV1-LV3]` to `[LV1][LV2][LV3]`) before the single-bracket negative lookbehind replacement.
- **Verification:** `tests/keyword_ownership_and_infinite_blade.test.js` (Test 3).

---

### Defect 5: Unbracketed Header Armor Ignored
- **File:** `compiler/header_parser.js`
- **Symptom:** Cards with `[LV1][LV2] Heavy Armor: Red` did not capture `Heavy Armor: Red` into `header.keyword`.
- **Root Cause:** The while loop in `parseAbilityHeaders` only checked bracketed keywords `[...]`, ignoring unbracketed armor headers.
- **Architectural Fix:** Added unbracketed armor matching in the while loop to extract armor into `result.keyword` and `result.keywords` and strip it from `cleanBody`.
- **Verification:** `tests/keyword_ownership_and_infinite_blade.test.js` (Test 3).

---

### Defect 6: Curse Blocker Destruction Never Executed
- **Files:** `engine/keywords/wave1.js` and `engine/index.js`
- **Symptom:** Curse tagged `curseTargetStackId` on block declaration, but the blocker was never destroyed at end of battle.
- **Root Cause:** No hook or resolution logic inspected `curseTargetStackId` during end of battle.
- **Architectural Fix:** Added `onBattleEnd` hook in `CurseKeyword` and integrated `curseTargetStackId` resolution in `engine/index.js` battle comparison.
- **Verification:** `tests/keyword_reconciled_mechanics.test.js` (Test 3).

---

### Defect 7: True-Curse Timing Rejection and Silent Fallback
- **Files:** `engine/keywords/registry.js` and `engine/keywords/wave1.js`
- **Symptom:** Attack-timed True-Curse cards were filtered out on destruction events, and fallback `|| oppField[0]` violated player autonomy.
- **Root Cause:** Registry passed `{ timing: 'WHEN_DESTROYED' }` which excluded `WHEN_ATTACKS` triggers, and code silently fell back to the first opposing spirit.
- **Architectural Fix:** Supported attack-timed destruction triggers in registry during combat, and eliminated `|| oppField[0]` fallback.
- **Verification:** `tests/keyword_reconciled_mechanics.test.js`.

---

### Defect 8: Wave Crush and XV Crush Cloned Placeholders
- **File:** `engine/keywords/wave1.js`
- **Symptom:** Wave Crush milled by LV to grave; XV Crush milled by LV and checked Bursts.
- **Root Cause:** Shallow cloned copies of Crush and Great Crush were registered instead of genuine mechanics.
- **Architectural Fix:** Implemented authentic `WaveCrushKeyword` (banish to removed zone by cost formula, fixed symbol 0) and authentic `XVCrushKeyword` (mill 10, conditional destroy up to cost 15).
- **Verification:** `tests/keyword_reconciled_mechanics.test.js` (Tests 1 & 2).

---

### Defect 9: Ultra Heavy Armor Omitted from isArmorFamily
- **File:** `engine/continuous.js`
- **Symptom:** Spirits with `Ultra Heavy Armor` received 0 immunity against matching colors.
- **Root Cause:** `isArmorFamily` array omitted `Ultra Heavy Armor` and related modern armor variants.
- **Architectural Fix:** Added `Ultra Heavy Armor`, `Knight Armor`, `Contract Armor`, `Count Armor`, `Aurora Armor`, `PS Armor`, `VPS Armor`, `TP Armor`, `MD Armor`, `G.A.T. Field`, `Illusive Armor`, `Illusive Ultra Heavy Armor` to `isArmorFamily`.
- **Verification:** `tests/keyword_reconciled_mechanics.test.js` (Test 4).

---

### Defect 10: Clash mustBlockIfAble Unenforced in Flow
- **File:** `engine/index.js`
- **Symptom:** Human player or simulated flow could resolve direct life hit even when `mustBlockIfAble` was active.
- **Root Cause:** `resolveDirectHit` did not verify whether refreshed eligible blockers existed when `mustBlockIfAble` was true.
- **Architectural Fix:** Added strict check rejecting direct hit with `MUST_BLOCK_IF_ABLE` if eligible blockers exist.
- **Verification:** `tests/keyword_reconciled_mechanics.test.js` (Test 5).
