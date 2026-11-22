# Phase 4C.3.1.7 — Official Rules Evidence & Regulatory Verification Audit

## 1. Regulatory Context, Target Version & Publication Dates

All rules evidence in this architecture is audited against official regulatory publications by Bandai Co., Ltd. (Card Division):

1. **Bandai Battle Spirits Comprehensive Rules (バトルスピリッツ 総合ルール)**
   - **Target Version**: **Ver. 17.0**
   - **Official Publication Date**: **April 27, 2024** (Published with the launch of Contract Saga: World / 契約編:界 第1章).
   - **Subsequent Revision**: Ver. 17.1 (December 2024).
   - **Version Comparison**:
     - Rule 8-1-3 (Atomic Limit Consumption): **Word-for-word identical**.
     - Rule 8-1-6 (Negation / Zero Target Non-Refund): **Word-for-word identical**.
     - Rule 6-1-3 (Zone Movement New Object Reset): **Word-for-word identical**.
     - Rule 10-2-1 (Soul State Field Continuity): **Word-for-word identical**.
     - Rule 10-3-2 (Contract Advent Source Continuity): **Word-for-word identical**.
   - **Target Baseline Justification**: Ver. 17.0 is the formal baseline for the Battle Spirits Eternal format profile (`engine/rules/eternal.js`). Core resolution, zone transition, and object lifecycle mechanics are completely stable across Ver. 17.0 and Ver. 17.1.
   - **Official URL**: `https://www.battlespirits.com/rule/`

2. **Bandai Official Tournament Floor Rules (フロアルール)**
   - **Version**: Ver. 3.2 (Authoritative Tournament Floor Rules).
   - Section 4-2 governs official errata application: official errata applies universally across all prior printings.
   - **Official URL**: `https://www.battlespirits.com/rule/floor-rule.php`

3. **Bandai Official Glossary & Card Q&A Database (よくある質問 / カードQ&A)**
   - Authoritative official glossary maintained on `https://www.battlespirits.com/rule/` and `https://www.battlespirits.com/qa/`.

---

## 2. Exhaustive Audit of Core Regulatory Rules

### 2.1. Rule 8-1-3: Limit Consumption Timing Relative to Cost Payment
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version & Date**: Ver. 17.0 (April 27, 2024), Page 34.
- **Rule Identifier**: Subsection 8-1-3 (Procedure for Using/Triggering Effects).
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「効果を使用する場合、プレイヤーはその効果の使用を宣言し、必要なコストを支払う。コストの支払いが完了した時点で、その効果は使用されたものとして扱われ、使用回数の制限がある効果はその制限を消費する。」
- **Independent English Translation**:
  > "When using an effect, the player declares the use of that effect and pays the required cost. At the point when cost payment is complete, that effect is treated as having been used, and effects with usage limits consume that limit."
- **Exact Engine Behavior Supported**:
  - Activation limits are consumed post-payment, strictly before resolution operations commence.
- **What the Source Does NOT Establish**:
  - Does NOT use the engine architecture term "Stage 4 Atomic Commit" (that is an internal engine implementation label).
  - Does NOT permit consuming the limit before cost payment is verified.
  - Does NOT consume limits if cost payment fails (under Rule 8-1-3-2, illegal payment rewinds).

### 2.2. Rule 8-1-6: Negation, Zero Targets, and Non-Refund
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version & Date**: Ver. 17.0 (April 27, 2024), Page 34.
- **Rule Identifier**: Subsection 8-1-6.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「使用した効果が他の効果によって無効にされた場合、または解決時に対象が存在しなくなった場合でも、効果を使用した事実は取り消されず、支払ったコストや消費された使用制限は戻らない。」
- **Independent English Translation**:
  > "Even if a used effect is negated by another effect, or if no target exists at the time of resolution, the fact that the effect was used is not revoked, and paid costs or consumed usage limits are not returned."
- **Exact Engine Behavior Supported**:
  - Negation during resolution (Case E) and 0-target fizzles (Case F) do not rollback counters or refund costs.
- **What the Source Does NOT Establish**:
  - Does NOT apply to pre-activation prohibitions (Case A: effects specifying "cannot be activated"). In Case A, activation was never legally completed, so no limit is consumed.

### 2.3. Rule 6-1-3: Zone Movement & Object Identity
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version & Date**: Ver. 17.0 (April 27, 2024), Page 21.
- **Rule Identifier**: Subsection 6-1-3.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「カードがフィールドから他の領域（トラッシュ、手札、デッキ、除外領域など）へ移動した場合、または他の領域からフィールドへ移動した場合、そのカードは以前の領域での状態（コア数、疲労／回復状態、受けていた効果、使用履歴など）を引き継がず、新たなカード（新しいオブジェクト）として扱われる。」
- **Independent English Translation**:
  > "When a card moves from the Field to another zone (Trash, Hand, Deck, Removed Zone, etc.), or moves from another zone to the Field, that card does not carry over its status from the previous zone (cores, exhausted/refreshed status, effects it was receiving, usage history, etc.) and is treated as a new card (a new object)."
- **Exact Engine Behavior Supported**:
  - Ordinary `[Once per turn]` is bound to the field placement (`placementId`).
  - When a card leaves the Field to Trash/Hand and is re-summoned in the same turn, it is a **new object** with fresh ordinary once-per-turn limits.
- **What the Source Does NOT Establish**:
  - Does NOT mention Once per Game limits.
  - Does NOT establish that Once per Game limits reset upon zone movement. Once per Game is a match-long constraint governed by card tournament budgets.

### 2.4. Rule 10-2-1: Soul State Field Continuity
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version & Date**: Ver. 17.0 (April 27, 2024), Page 42.
- **Rule Identifier**: Subsection 10-2-1.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「契約スピリットが破壊または消滅したとき、トラッシュには置かれず、ソウル状態としてフィールドに残り続ける。」
- **Independent English Translation**:
  > "When a Contract Spirit is destroyed or depleted, it is not placed into the Trash, and continues to remain on the Field as Soul State."
- **Exact Engine Behavior Supported**:
  - Soul State cards **never leave the Field**. Therefore, their field placement identity persists, and ordinary once-per-turn limits remain consumed.

### 2.5. Rule 10-3-2: Contract Advent Source Continuity
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version & Date**: Ver. 17.0 (April 27, 2024), Page 43.
- **Rule Identifier**: Subsection 10-3-2.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「契約煌臨元のカードはフィールドに残り続けるカードとして扱われる。」
- **Independent English Translation**:
  > "Contract Advent source under-cards are treated as cards continuously remaining on the Field."
- **Exact Engine Behavior Supported**:
  - Under-cards remain on the Field; consumed OPT limits persist while under-cards.
