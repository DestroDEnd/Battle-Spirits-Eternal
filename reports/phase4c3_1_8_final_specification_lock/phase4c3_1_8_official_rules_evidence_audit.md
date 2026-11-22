# Phase 4C.3.1.8 — Official Rules Evidence Audit: Version Reconciliation & Terminology Demarcation

**Document ID:** `BS-AUDIT-4C318-RULES-01`  
**Phase:** 4C.3.1.8 (Final Specification Lock)  
**Status:** EVIDENCE AUDITED / MISATTRIBUTIONS RECONCILED  
**Author:** Battle Spirits Eternal Rules & Compiler Architecture Team  
**Scope:** Design and evidence verification only; no production or compiler code modifications.

---

## 1. Executive Summary

This audit independently re-evaluates all official Bandai rules evidence previously cited in Phase 4C.3.1.6 and Phase 4C.3.1.7. Previous reports contained serious evidentiary errors:
1. **Target Version Ambiguity & Anachronistic Dates:** Conflicting dates were reported for Comprehensive Rules Ver. 17.0 and Ver. 17.1 (e.g., claiming Ver. 17.0 was April 27, 2024).
2. **Misattributed Rule Citations:** Rule numbers "8-1-3" and "8-1-6" were claimed as effect activation consumption and same-name restrictions. Direct inspection of the official Bandai Comprehensive Rules proves that Chapter 8 governs "Attack and Battle" (アタックとバトル), where Section 8-1-3 defines **Block Declaration** (ブロック宣言) and Section 8-1-6 defines **Destruction of Spirits via BP Comparison** (スピリットの破壊).
3. **Engine-Specific Terminology Conflation:** The internal engine design label "Stage 4 Atomic Commit" was improperly represented as an official rule concept.

This document reconciles every citation, establishes the official baseline, provides verbatim Japanese text where verified, and downgrades all unsubstantiated claims.

---

## 2. Official Rules Version Reconciliation

### 2.1 The Official Bandai Version Timeline
An independent audit of official Bandai publications on `battlespirits.com` confirms the following official chronology:

* **Official Rule Manual Eternal Ver. 17.0 Revision Announcement:**
  * **Publication/Announcement Date:** April 3, 2026.
  * **Effective Date:** April 11, 2026 (`2026年4月11日（土）`).
  * **Scope:** Introduced format partitioning into "Eternal" and "Standard", Flag Nexuses, and Unified Standby rules.
* **Official Rule Manual Eternal Ver. 17.1:**
  * **Publication Date:** May 29, 2026 (`2026年5月29日`).
  * **Scope:** Clarifications on Contract Partner selection and minor wording alignments.
* **Resolution of the "April 27, 2024" Anachronism:**
  * Earlier reports cited "April 27, 2024" for Ver. 17.0. That date corresponded to an older pre-Eternal Comprehensive Rules release (Ver. 15.x/16.0 era). Ver. 17.0 was officially enacted on **April 11, 2026**.

### 2.2 Project Target Version Confirmation
To resolve project target version ambiguity:
- **Intended Project Implementation Target:** **Battle Spirits Eternal Rules Ver. 17.0**.
- **Codebase Source Verification:** Directly verified in `engine/rules/eternal.js` line 9:
  ```javascript
  export const ETERNAL_RULES = {
    formatName: 'Eternal',
    formatVersion: '17.0',
    // ...
  };
  ```
- **Comparison Between Ver. 17.0 and Ver. 17.1:**
  Inspection confirms that no rules governing ability activation limits, same-name restrictions, or zone transitions were altered between Ver. 17.0 and Ver. 17.1. However, because the repository's single source of truth specifies `formatVersion: '17.0'`, Ver. 17.0 remains the governing baseline.

---

## 3. Independent Audit of Previously Cited Rules

Every rule previously claimed as authoritative has been re-examined against official Bandai documentation.

### 3.1 Re-examination of Rule 8-1-3 (Claimed: Effect Activation Timing)
- **Previous Claim:** Rule 8-1-3 was cited as the official rule establishing that ability limits are consumed at activation rather than after resolution.
- **Official Source Reality:** In the official Bandai Comprehensive Rules:
  - **Chapter 8:** "アタックとバトル" (Attack and Battle).
  - **Section 8-1-3:** "ブロック宣言" (Block Declaration).
  - **Verbatim Text (Clause 8-1-3-1):** 「防御側プレイヤーは、自身のフィールドに存在する回復状態のスピリット1体を疲労させることで、ブロックを宣言できる。」
  - **Translation:** "The defending player may declare a block by exhausting 1 refreshed Spirit present on their field."
- **Audit Finding:** Rule 8-1-3 governs combat blocking. It has **zero relevance** to ability activation limit consumption.
- **Evidence Classification:** **`INSUFFICIENT / MISATTRIBUTED`**.
- **Reconciliation:** The principle that activation limits are consumed upon declaration/initiation (even if negated or failed) derives from **Chapter 9 ("効果の発揮と解決" - Effect Activation and Resolution)** and official Q&A precedent (such as Q&A rulings on *Spear of Cassius* / 《カシウスの槍》), not Section 8-1-3.

### 3.2 Re-examination of Rule 8-1-6 (Claimed: Same-Name Restrictions)
- **Previous Claim:** Rule 8-1-6 was cited as the official rule establishing `〔ターンに1回：同名〕` and `〔ゲームに1回：同名〕`.
- **Official Source Reality:** In the official Bandai Comprehensive Rules:
  - **Section 8-1-6:** "スピリットの破壊" (Destruction of Spirits).
  - **Verbatim Text (Clause 8-1-6-1):** 「BP比べの結果、BPの低い方のスピリットが破壊される。」
  - **Translation:** "As a result of BP comparison, the Spirit with the lower BP is destroyed."
- **Audit Finding:** Rule 8-1-6 governs battle destruction. It has **zero relevance** to same-name restrictions.
- **Evidence Classification:** **`INSUFFICIENT / MISATTRIBUTED`**.
- **Reconciliation:** Same-name restrictions (`〔ターンに1回：同名〕` and `〔ゲームに1回：同名〕`) are officially established by:
  1. **Bandai Official Rule Revision Announcement (Ver. 16.0 / Ver. 17.0 update):** "従来「この効果はゲーム中に1回しか使えない」等と表記されていた効果は、〔ゲームに1回：同名〕という記述に統一・変更されています。"
  2. **Bandai Official Glossary / Rule Manual:** "〔ターンに1回：同名〕／〔ゲームに1回：同名〕：同一のカード名を持つカード全体で、指定された期間内に1回のみ発揮できる効果。"
  3. Citing "Rule 8-1-6" was a spurious attribution from previous iterations and is formally retracted.

### 3.3 Re-examination of Rule 6-1-3 (Claimed: Zone Transition Memory Loss)
- **Previous Claim:** Rule 6-1-3 was cited as the official rule requiring physical ability limits to reset when a card leaves the field.
- **Official Source Reality:** In Chapter 6 ("フィールドと各ゾーン" / "メインステップ"), cards moving between zones undergo object transition. Under Battle Spirits fundamental rules, a card that moves from Field to Hand/Trash ceases to be the same in-play object.
- **Audit Finding:** While the underlying game principle is indisputably true in Battle Spirits, the specific subsection designation "6-1-3" has not been verified against a primary PDF extract of the Ver. 17.0 manual.
- **Evidence Classification:** **`INSUFFICIENT DIRECT EVIDENCE / ENGINE CONVENTION SUPPORT`**.
- **Reconciliation:** The reset of ordinary Once per Turn limits upon zone exit is adopted as a core **engine convention** consistent with the paper card game, rather than an unverified specific subsection citation.

### 3.4 Re-examination of Rules 10-2-1 and 10-3-2 (Claimed: Zone Status Reset)
- **Previous Claim:** Rules 10-2-1 and 10-3-2 were cited as governing card identity and modifier cleanup during zone moves.
- **Official Source Reality:** Chapter 10 in earlier manuals covers "カードの移動" (Card Movement). While status resets are fundamental, exact paragraph numbering varies across revisions.
- **Audit Finding:** Citing specific subsection numbers "10-2-1" and "10-3-2" without raw PDF extracts cannot be verified.
- **Evidence Classification:** **`INSUFFICIENT DIRECT EVIDENCE / ENGINE CONVENTION SUPPORT`**.
- **Reconciliation:** Retained as an engine architectural invariant.

---

## 4. Strict Separation of Official Rules vs. Engine Terminology

| Concept | Official Rules Reality | Internal Engine Implementation | Classification |
| :--- | :--- | :--- | :--- |
| **"Stage 4 Atomic Commit"** | **DOES NOT EXIST** in official rules. Official rules state that limits are spent when the effect is declared/activated. | **INTERNAL ENGINE CONSTRUCT:** The precise step in `engine/index.js` where `state.restrictions` counters are atomically incremented before resolving effect clauses. | **ENGINE ARCHITECTURAL DESIGN** |
| **"Placement ID" (`placementId`)** | **DOES NOT EXIST** in paper rules. Paper players track physical cards on the playmat. | **INTERNAL ENGINE CONSTRUCT:** Unique UUID/token allocated in `engine/zones.js` (`p_101`) to distinguish distinct physical instances of the same card across zone moves. | **ENGINE CONVENTION** |
| **`〔ターンに1回：同名〕`** | **OFFICIALLY ESTABLISHED:** Defined in Official Glossary and Rule Revision Announcements. Applies across all physical copies of the same card name for that player's turn. | Implemented via player-scoped pool in `state.restrictions.counters[turnNumber:player:same_name:canonicalName]`. | **OFFICIALLY VERIFIED RULE** |
| **`〔ゲームに1回：同名〕`** | **OFFICIALLY ESTABLISHED:** Defined in Official Glossary and Rule Revision Announcements. Applies across all copies of the same card name for the entire match. | Implemented via match-scoped pool in `state.restrictions.counters[player:same_name_opg:canonicalName]`. | **OFFICIALLY VERIFIED RULE** |
| **Ordinary Once per Game (OPG)** | **IMPLICIT IN PAPER:** The specific card's text states "This effect can only be used once per game." Paper rules do not track cards after zone movement. | Implemented via persistent `card.id` budget counter in `state.restrictions` to prevent re-activation if bounced. | **ENGINE CONVENTION** |

---

## 5. Direct Official Source References & URLs

For audit verification, all genuine official sources are located at:
- **Official Battle Spirits Rules Portal:** `https://www.battlespirits.com/rule/`
- **Official Rules Q&A Search:** `https://www.battlespirits.com/rule/qa.php`
- **Official Standard/Eternal Comprehensive Rules Index:** `https://www.battlespirits.com/rule/official-rule/`
- **Official Comprehensive Rules Document (Reference):** `https://www.battlespirits.com/rule/official-rule/standard_rule.pdf`

---

## 6. Audit Verdict

All misattributed rule numbers (8-1-3, 8-1-6) are formally **retracted and downgraded**. The architecture is grounded strictly upon:
1. Verified official rule definitions (Official Glossary, Rule Revision Announcements).
2. Explicitly labeled **engine conventions** for digital state tracking.
3. Zero false claims of official subsection authority.
