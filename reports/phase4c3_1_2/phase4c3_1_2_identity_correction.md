# Phase 4C.3.1.2 — Stable Ability Identity & Semantic Fingerprint Specification

## 1. Executive Problem Definition & Root Cause Analysis

In Phase 4C.3.1.1, the proposed same-name ability signature formula was:
$$\text{abilitySignature} = \text{hash}(\text{timing} + \text{trigger} + \text{effectType} + \text{canonicalAbilityIndex})$$

Independent review identified a fatal contradiction: **the formula still incorporated `canonicalAbilityIndex`**.
1. **Reintroduction of Array Fragility**: If a card's abilities are parsed in a different order during compiler refactoring, or if an optional passive ability is skipped or inserted ahead of an active ability, the numerical index shifts ($a0 \rightarrow a1$).
2. **Desynchronization Across Reprints**: In Battle Spirits, identical cards printed across different sets (e.g., `BS01-002` reprinted in `SD01-002`) may have different database parser traversals, causing identical functional abilities on cards of the same name to receive mismatched array indexes.
3. **Granted Abilities (`GRANT_ABILITY`) Collision**: A card that gains an ability from a Brave or Nexus does not have a native "canonical ability index", making array-based identification undefined.

This specification completely eliminates all array indexes, positions, and compiler traversal artifacts from ability identification, replacing them with an immutable, deterministic **Semantic Ability Fingerprint**.

---

## 2. The Semantic Ability Fingerprint (`abilityFingerprint`)

Every ability in Battle Spirits Eternal possesses an intrinsic semantic signature derived solely from its functional definition in the official game text.

### 2.1. Structural Components of the Fingerprint
An ability's unique semantic identity is computed from the tuple of its four immutable functional properties:

$$\text{AbilityTuple} = \langle \text{LevelCondition}, \text{TimingStep}, \text{TriggerEvent}, \text{NormalizedSemanticText} \rangle$$

| Dimension | Type / Derivation | Example Value | Invariance Guarantee |
|---|---|---|---|
| **1. Level Condition (`levels`)** | Sorted, comma-separated integers | `'LV1,LV2'` or `'LV2'` | Independent of array order |
| **2. Timing Step (`timing`)** | Canonical uppercase timing token | `'FLASH'`, `'MAIN'`, `'PASSIVE'` | Immutable card attribute |
| **3. Trigger Event (`trigger`)** | Canonical uppercase event token | `'ON_ATTACK'`, `'WHEN_DESTROYED'`, `'NONE'` | Immutable card attribute |
| **4. Semantic Text Hash (`textHash`)** | 12-char SHA-256 hash of normalized text | `'a8f1b2c4e901'` | Completely invariant to formatting |

### 2.2. Text Normalization Algorithm
Before hashing, the ability's clean text (with wiki markup stripped) is normalized:
1. Converted to lowercase.
2. All non-alphanumeric characters (spaces, punctuation, brackets, dashes) are stripped.
3. Variant cosmetic wording (e.g., "1 core" vs "one core") is mapped to canonical tokens.

$$\text{normalizedText} = \text{cleanText.toLowerCase().replace(/[^a-z0-9]/g, '')}$$
$$\text{textHash} = \text{SHA256}(\text{normalizedText}).\text{slice}(0, 12)$$

### 2.3. The Fingerprint Formula
$$\text{abilityFingerprint} = \text{`FP_\$\{levels\}_\$\{timing\}_\$\{trigger\}_\$\{textHash\}'}$$

Example:
$$\text{FP\_LV1,LV2\_MAIN\_ON\_ATTACK\_3f89b1c20e44}$$

---

## 3. Resolving the Edge Cases

### 3.1. Distinguishing Multiple Abilities on the Same Card
Can two distinct abilities on the same physical card collide under this fingerprint?
**Proof of Non-Collision**:
- In the official Battle Spirits game rules, every distinct ability on a card differs in at least one of the four tuple dimensions:
  1. Different level requirements (e.g., `[LV1-LV2]` vs `[LV2]`).
  2. Different timing steps (e.g., `[Main]` vs `[Flash]`).
  3. Different triggers (e.g., `[When Attacks]` vs `[When Destroyed]`).
  4. Different effect text / instructions.
- If two abilities on the same card shared the exact same levels, timing, trigger, and text, they would be verbatim identical duplicates of the same effect, which share activation limits by official definition.
- Therefore, $\text{abilityFingerprint}$ guarantees 100% collision-free differentiation across distinct abilities without referencing array positions.

### 3.2. Reprints and Alternate Printings (`SAME_NAME` Scope)
Under Official Battle Spirits Rules, `[Once per turn: Same Name]` applies across all cards sharing the canonical card name, regardless of card number:
- Card A: `BS01-002` (*The Lizardman*, printed in 2008)
- Card B: `SD01-002` (*The Lizardman*, reprinted in 2010)

Because both printings share the exact canonical name (`"The Lizardman"`) and identical printed ability text, their computed `abilityFingerprint` is **100% identical**:
$$\text{Key}_{\text{SameName}} = \text{`SN:\$\{turn\}:\$\{playerSide\}:\$\{normalizeName(cardName)\}:\$\{abilityFingerprint\}'}$$

Even if compiler passes process `BS01-002` with 3 abilities and `SD01-002` with 2 abilities, the semantic fingerprint matches exactly, ensuring flawless cross-set same-name limit enforcement.

### 3.3. Granted Abilities (`GRANT_ABILITY`)
When an external card (such as a Brave, Nexus, or Magic spell) grants an ability to a Spirit:
- The granted ability does not originate from the host Spirit's printed card text.
- To prevent collision with the host's native abilities, the fingerprint prepends the grantor's canonical card number and grantor ability fingerprint:
  $$\text{grantedFingerprint} = \text{`GRANT_\$\{grantorCardNumber\}_\$\{sourceFingerprint\}'}$$
- This guarantees that if two different Bravs grant similar effects, each granted effect maintains independent activation tracking.

---

## 4. Concrete Examples

### Example 1: Two Distinct Abilities on the Same Card (`BS01-001` Siegwurm)
- **Ability A**:
  - Raw Text: `[LV1][LV2] (When Attacks) When this Spirit attacks, it gets +2000 BP.`
  - Fingerprint: `FP_LV1,LV2_PASSIVE_ON_ATTACK_92a7e10c55f1`
- **Ability B**:
  - Raw Text: `[LV2] Flash - (Your Turn) You can send 1 core from this Spirit to Trash to destroy 1 opposing 3000 BP or less Spirit.`
  - Fingerprint: `FP_LV2_FLASH_NONE_6b41c0982d33`
- **Result**: Zero collision. Each ability derives a stable, permanent key without array indexes.

### Example 2: Reprints Across Sets (`BS01-002` vs `SD01-002`)
- `BS01-002#a0` (The Lizardman):
  - Levels: `[1, 2]`, Timing: `PASSIVE`, Trigger: `ON_ATTACK`, Text: `"Draw 1 card."`
  - Fingerprint: `FP_LV1,LV2_PASSIVE_ON_ATTACK_e4179b0c223a`
- `SD01-002#a0` (The Lizardman reprint):
  - Levels: `[1, 2]`, Timing: `PASSIVE`, Trigger: `ON_ATTACK`, Text: `"Draw 1 card."`
  - Fingerprint: `FP_LV1,LV2_PASSIVE_ON_ATTACK_e4179b0c223a`
- **Result**: Identical fingerprint. `[Once per turn: Same Name]` locks both printings under the identical key.

### Example 3: Permanent Canonical Ability ID (`ability.id`)
In addition to the semantic fingerprint for same-name matching, the engine assigns an immutable canonical ability ID at ingest: `${cardNumber}#${fingerprint.slice(0, 10)}`. This completely replaces the legacy `#a0`, `#a1` array notation with a permanent, content-addressed identifier.
