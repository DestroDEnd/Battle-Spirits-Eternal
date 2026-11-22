# Phase 4C.3.1.6 — Semantic Identity & Reprint Validation Audit

## 1. Executive Summary & Factual Audit of Target Cards

In Phase 4C.3.1.5, several specific cards were referenced as examples of reprint equivalence and ability differentiation.
A rigorous inspection of the actual canonical database (`data/cards_detailed.json`) and compiled IR shards (`data/ir_shards/*.json`) established the following factual findings:

### 1.1. Audit of BS01-002 vs SD01-002: Resolution of Historical Misclassification
- **Historical Claim**: Prior reports cited `BS01-002` and `SD01-002` as "The Lizardman" and its reprint.
- **Empirical Factual Finding**:
  - `BS01-002` is named **"Rokceratops"** (ロクケラトプス), a Cost 1 Red vanilla Spirit (`is_vanilla: true`, 0 abilities).
  - `SD01-002` is named **"Katanakasago"** (カタナカサゴ), a Cost 1 White vanilla Spirit (`is_vanilla: true`, 0 abilities).
  - "Lizardman" is actually **`BS01-018`**!
  - Therefore, `BS01-002` and `SD01-002` are **distinct cards with distinct names and zero abilities**.
  - **Correction**: The true canonical reprint model in Battle Spirits Eternal represents cross-set reprints via the card's `sets` array (e.g. `SD66-X01` printed in `SD66` and `PB34`, or `LM17-01` printed in `LM17` and `SD51`), where canonical descriptors match 100%.

### 1.2. Audit of BS52-X01 (The RouseDragonEmperor Reversal Dragon)
- **Canonical Card**: Cost 6 Red Dragon / Ancient Dragon Spirit.
- **Ability 0 (When Attacks LV1-3)**:
  - Destroys opposing Spirit with BP equal/inferior.
  - Life Decreasal: Send opposing Life to Void for each two counters (Max 4).
  - **Restriction**: *"This 'Life Decreasal' effect can only be used once per game."*
  - **Classification**: Ordinary Once per Game attached to this specific card's Life Decreasal effect.
- **Ability 1 (When Attacks LV2-3)**:
  - Extra Red symbol for each counter (Max 3).
  - Unrestricted ability.
- **Multi-Copy Behavior**: If Player 1 controls 2 physical copies (`inst_1` and `inst_2`), both copies have distinct physical IDs, but share canonical name.

### 1.3. Audit of BS25-063 (Ultimate-Lowen)
- **Ability #a2 (When Summoned LV3-5)**: Destroy opposing Cost 1/2/3/4 Spirits, one of each.
- **Ability #a3 (When Summoned LV3-5 [UT])**: Ultimate Trigger Hit $\rightarrow$ Destroy opposing Cost 5/6/7 Spirits, one of each.
- **Validation**: While both are `WHEN_SUMMONED`, `LV3-4-5`, and primary op `DESTROY`, they differ in target cost filter array (`[1,2,3,4]` vs `[5,6,7]`) and condition (`NONE` vs `ULTIMATE_TRIGGER_HIT`). Their semantic and physical descriptors are 100% distinct.

### 1.4. Audit of BS17-036 (King-Harald)
- **Ability #a1 (Passive LV2 When Braved)**: Red/White Brave $\rightarrow$ All Brave Spirits unaffected by opposing Spirit effects.
- **Ability #a2 (Passive LV2 When Braved)**: Purple/Green/Yellow/Blue Brave $\rightarrow$ All Brave Spirits unaffected by opposing Magic effects.
- **Validation**: Differentiated by condition (Brave color attributes) and immunity target type (Spirit vs Magic). Descriptors are 100% distinct.

### 1.5. Audit of BS27-068 (The TwinsAstralArmored BraveGemini)
- **Ability #a1 (Attack Step LV1-3 During Brave)**: Life reduced by opposing Spirits $\rightarrow$ Draw 1 card.
- **Ability #a2 (Attack Step LV1-3 During Brave)**: Life reduced by opposing Ultimates $\rightarrow$ Draw 2 cards.
- **Validation**: Differentiated by trigger condition (opposing Spirits vs Ultimates) and draw quantity parameter (1 vs 2). Descriptors are 100% distinct.

---

## 2. Reprint and Errata Equivalence Principles

1. **True Reprint Equivalence**:
   - Cards sharing canonical name, timing, trigger, levels, and clause sequence derive identical semantic descriptors:
     ```text
     semanticAbilityId = sha256(RFC8785(normalizeSemanticDescriptor(ability)))
     ```
   - Printing-specific metadata (`cardNumber`, set code, rarity, artwork) is strictly excluded before normalization.
2. **Official Errata Handling**:
   - Official errata updates canonical card text across all printings under Bandai Floor Rules Section 4-2.
   - The compiled IR shard reflects authoritative errata-applied text.
3. **Granted Abilities**:
   - Formulated as `GRANT:${grantorPlacementId}:${semId}`.
   - Prevents granted abilities from permanently binding to the host Spirit after Brave/Nexus removal.
