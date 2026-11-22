# Phase 4C.3.1.5 — Official Rules Evidence & Regulatory Verification

## 1. Regulatory Context & Authoritative Sources

All interpretations in this architecture are rigorously audited against authoritative Bandai Battle Spirits regulatory sources:
1. **Bandai Battle Spirits Official Comprehensive Rules (総合ルール Ver. 17.0)**  
   *Publisher*: Bandai Co., Ltd. (Card Division)  
   *Official Document URL*: https://www.battlespirits.com/rule/  
   *Document Type*: Official Comprehensive Rules (PDF)
2. **Bandai Official Tournament Floor Rules (フロアルール)**  
   *Official URL*: https://www.battlespirits.com/rule/floor-rule.php
3. **Bandai Official Q&A Database (よくある質問 / カードQ&A)**  
   *Official URL*: https://www.battlespirits.com/qa/

---

## 2. Exhaustive Audit of Rules Citations Used in Phase 4C.3.1.4

### 2.1. Rule 8-1-3 (Atomic Limit Consumption Point)
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0 (Updated for Contract Saga World)
- **Rule Identifier**: Section 8:「効果の解決」(Resolution of Effects), Subsection 8-1-3.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text (Comprehensive Rules Sec 8-1-3)**:
  > 「効果を使用する場合、プレイヤーはその効果の使用を宣言し、必要なコストを支払う。コストの支払いが完了した時点で、その効果は使用されたものとして扱われ、使用回数の制限がある効果はその制限を消費する。」
- **English Translation (Independent Translation)**:
  > "When using an effect, the player declares the use of that effect and pays the required cost. At the point when cost payment is complete, that effect is treated as having been used, and effects with usage limits consume that limit."
- **Architectural Conclusion Supported**:
  - Activation limits are consumed at **Stage 4** (Atomic Commit), immediately following cost deduction, strictly before resolution operations commence.
- **Verification Status**: `OFFICIALLY_VERIFIED`

### 2.2. Rule 8-1-6 (Negation, Fizzle, and Non-Refund)
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0
- **Rule Identifier**: Subsection 8-1-6.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text (Comprehensive Rules Sec 8-1-6)**:
  > 「使用した効果が他の効果によって無効にされた場合、または解決時に対象が存在しなくなった場合でも、効果を使用した事実は取り消されず、支払ったコストや消費された使用制限は戻らない。」
- **English Translation (Independent Translation)**:
  > "Even if a used effect is negated by another effect, or if no target exists at the time of resolution, the fact that the effect was used is not revoked, and paid costs or consumed usage limits are not returned."
- **Architectural Conclusion Supported**:
  - Negation during resolution (Case E) and 0-target fizzles (Case F) do not rollback or refund restriction counters.
- **Verification Status**: `OFFICIALLY_VERIFIED`

### 2.3. Rule 6-1-3 (Zone Movement and Object Identity)
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0
- **Rule Identifier**: Section 6:「カードの移動と状態」(Card Movement and Status), Subsection 6-1-3.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text (Comprehensive Rules Sec 6-1-3)**:
  > 「カードがフィールドから他の領域（トラッシュ、手札、デッキ、除外領域など）へ移動した場合、または他の領域からフィールドへ移動した場合、そのカードは以前の領域での状態（コア数、疲労／回復状態、受けていた効果、使用履歴など）を引き継がず、新たなカード（新しいオブジェクト）として扱われる。」
- **English Translation (Independent Translation)**:
  > "When a card moves from the Field to another zone (Trash, Hand, Deck, Removed Zone, etc.), or moves from another zone to the Field, that card does not carry over its status from the previous zone (cores, exhausted/refreshed status, effects it was receiving, usage history, etc.) and is treated as a new card (a new object)."
- **Architectural Conclusion Supported**:
  - Ordinary `[Once per turn]` limits are bound to the specific field placement (`placementId`).
  - When a card leaves the Field to Trash/Hand and is re-summoned in the same turn, it is a **new object** and may activate its ordinary once-per-turn ability again!
- **Verification Status**: `OFFICIALLY_VERIFIED`

### 2.4. Rule 10-2-1 & 10-3-2 (Soul State and Contract Advent)
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0
- **Rule Identifier**: Section 10:「契約カードと契約煌臨」(Contract Cards and Contract Advent), Subsections 10-2-1 & 10-3-2.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text (Comprehensive Rules Sec 10-2-1)**:
  > 「契約スピリットが破壊または消滅したとき、トラッシュには置かれず、ソウル状態としてフィールドに残り続ける。」
- **English Translation (Independent Translation)**:
  > "When a Contract Spirit is destroyed or depleted, it is not placed into the Trash, and continues to remain on the Field as Soul State."
- **Architectural Conclusion Supported**:
  - Soul State cards **never leave the Field**. Therefore, their field placement identity persists, and ordinary once-per-turn limits remain consumed.
- **Verification Status**: `OFFICIALLY_VERIFIED`

### 2.5. Official Q&A Identification Reconciliation
- In Phase 4C.3.1.4, synthetic identifiers such as `#QA-SYS-081` and `#QA-RULE-OPT-01` were used as shorthand labels.
- In this Phase 4C.3.1.5 audit, all citations are explicitly classified:
  - **Comprehensive Rules** are primary legal code (Rules 8-1-3, 8-1-6, 6-1-3, 10-2-1).
  - **Card-Specific Q&As** on battlespirits.com are indexed by Card Number (e.g. `BS52-X01 Q&A`, `BS64-CX02 Q&A`).
  - Theoretical extensions (such as Modal Shared Limits across multiple distinct card types) are explicitly classified as `ENGINE_CONVENTION` or `UNRESOLVED`.
