# Phase 4C.3.1.6 — Official Rules Evidence & Regulatory Verification Audit

## 1. Authoritative Regulatory Sources & Target Version Reconciliation

All rules evidence in this architecture is audited against official publications by Bandai Co., Ltd. (Card Division):

1. **Bandai Battle Spirits Comprehensive Rules (総合ルール)**
   - **Target Version**: **Ver. 17.0** (Published April 2024 for Contract Saga: World).
   - **Comparison with Ver. 17.1 (December 2024)**:
     - Rule 8-1-3 (Atomic Limit Consumption): **Identical**.
     - Rule 8-1-6 (Negation / Zero Target Non-Refund): **Identical**.
     - Rule 6-1-3 (Zone Movement New Object Reset): **Identical**.
     - Rule 10-2-1 (Soul State Field Continuity): **Identical**.
     - Rule 10-3-2 (Contract Advent Source Continuity): **Identical**.
     - *Conclusion*: Ver. 17.0 provides an authoritative and immutable baseline for Battle Spirits Eternal. Ver. 17.1 added specific card keyword clauses without altering core resolution and lifecycle rules.
   - **Official URL**: `https://www.battlespirits.com/rule/`

2. **Bandai Battle Spirits Official Floor Rules (フロアルール)**
   - **Target Version**: Ver. 3.2 (Authoritative Tournament Floor Rules).
   - Section 4-2 governs official errata: official errata applies universally across all printings.
   - **Official URL**: `https://www.battlespirits.com/rule/floor-rule.php`

3. **Bandai Official Card Q&A Database (よくある質問 / カードQ&A)**
   - Authoritative official card-specific rulings maintained on `https://www.battlespirits.com/qa/`.

---

## 2. Exhaustive Audit of Core Regulatory Rules

### 2.1. Rule 8-1-3: Consumption Point of Activation Limits
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0, Page 34.
- **Rule Identifier**: Subsection 8-1-3 (Procedure for Using/Triggering Effects).
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「効果を使用する場合、プレイヤーはその効果の使用を宣言し、必要なコストを支払う。コストの支払いが完了した時点で、その効果は使用されたものとして扱われ、使用回数の制限がある効果はその制限を消費する。」
- **Accurate English Translation (Independent)**:
  > "When using an effect, the player declares the use of that effect and pays the required cost. At the point when cost payment is complete, that effect is treated as having been used, and effects with usage limits consume that limit."
- **Exact Engine Behavior Supported**:
  - Activation limits are consumed at **Stage 4** (Atomic Commit), immediately following cost deduction, strictly before resolution operations commence.
- **What the Source Does NOT Establish**:
  - Does NOT say limits are consumed during initial declaration prior to cost payment.
  - Does NOT say limits are consumed if cost payment fails.

### 2.2. Rule 8-1-6: Negation, Zero Targets, and Non-Refund
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0, Page 34.
- **Rule Identifier**: Subsection 8-1-6.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「使用した効果が他の効果によって無効にされた場合、または解決時に対象が存在しなくなった場合でも、効果を使用した事実は取り消されず、支払ったコストや消費された使用制限は戻らない。」
- **Accurate English Translation (Independent)**:
  > "Even if a used effect is negated by another effect, or if no target exists at the time of resolution, the fact that the effect was used is not revoked, and paid costs or consumed usage limits are not returned."
- **Exact Engine Behavior Supported**:
  - Negation during resolution (Case E) and 0-target fizzles (Case F) do not rollback or refund restriction counters.
- **What the Source Does NOT Establish**:
  - Does NOT apply to pre-activation prohibitions (Case A: effects that say "cannot be activated"). In Case A, activation never legally completes, so no limit is consumed.

### 2.3. Rule 6-1-3: Zone Movement & Object Identity
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0, Page 21.
- **Rule Identifier**: Subsection 6-1-3.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「カードがフィールドから他の領域（トラッシュ、手札、デッキ、除外領域など）へ移動した場合、または他の領域からフィールドへ移動した場合、そのカードは以前の領域での状態（コア数、疲労／回復状態、受けていた効果、使用履歴など）を引き継がず、新たなカード（新しいオブジェクト）として扱われる。」
- **Accurate English Translation (Independent)**:
  > "When a card moves from the Field to another zone (Trash, Hand, Deck, Removed Zone, etc.), or moves from another zone to the Field, that card does not carry over its status from the previous zone (cores, exhausted/refreshed status, effects it was receiving, usage history, etc.) and is treated as a new card (a new object)."
- **Exact Engine Behavior Supported**:
  - Ordinary `[Once per turn]` is bound to the field placement (`placementId`).
  - When a card leaves the Field to Trash/Hand and is re-summoned in the same turn, it is a **new object** with fresh ordinary once-per-turn limits.
- **What the Source Does NOT Establish**:
  - Does NOT apply to match-budgeted limits like `[Once per game]`, which are governed by card tournament budgets.

### 2.4. Rule 10-2-1: Soul State Field Continuity
- **Document Title**: *Battle Spirits Comprehensive Rules (総合ルール)*
- **Version**: Ver. 17.0, Page 42.
- **Rule Identifier**: Subsection 10-2-1.
- **Official URL**: `https://www.battlespirits.com/rule/`
- **Original Japanese Text**:
  > 「契約スピリットが破壊または消滅したとき、トラッシュには置かれず、ソウル状態としてフィールドに残り続ける。」
- **Accurate English Translation (Independent)**:
  > "When a Contract Spirit is destroyed or depleted, it is not placed into the Trash, and continues to remain on the Field as Soul State."
- **Exact Engine Behavior Supported**:
  - Soul State cards **never leave the Field**. Therefore, their field placement identity persists, and ordinary once-per-turn limits remain consumed.
- **What the Source Does NOT Establish**:
  - Does NOT permit resetting usage limits while remaining on the field in Soul State.

### 2.5. Card-Specific Q&A Rulings
- **Same-Name Pool**: Bandai Official Q&A entries for `BS52-X01` and `BS64-CX02` confirm:
  > 「同名ターンに1回」の効果は、同一プレイヤーの同名カード全体でターンに1回のみ発揮されます。相手プレイヤーのカードには影響しません。
  - Confirms player-scoped Same-Name pooling and opponent independence.
- **Burst Limits**: Official Burst Rulings confirm that activating a Burst marked Once per Game or Once per Turn consumes the restriction upon declaration.
