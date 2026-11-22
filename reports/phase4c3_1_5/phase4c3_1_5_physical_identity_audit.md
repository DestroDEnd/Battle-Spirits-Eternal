# Phase 4C.3.1.5 — Physical Ability Identity & Collision Handling Audit

## 1. Executive Summary & Problem Analysis

In Phase 4C.3.1.4, a 16-character hexadecimal digest (64 bits) was proposed for physical ability identity:
`physicalAbilityId = ${cardNumber}#AB_${timing}_${trigger}_${levels}_${astDigest}`

Independent review identified two critical flaws:
1. **Entropy & Collision Risk**: A 64-bit digest has a non-negligible Birthday Paradox collision probability over large card sets and long-term expansion. Claiming zero-collision probability on 64 bits is mathematically unsound.
2. **Clause Ordering vs Object Key Ordering**: The earlier proposal asserted that shuffling clauses would preserve identity. In card game semantics, execution order of clauses is **strictly sequential and non-commutative**. Sorting execution clauses destroys semantic fidelity!

---

## 2. Empirical Verification Across All 514 IR Shards

An exhaustive scan across all 514 compiled card shards (`data/ir_shards/*.json`) verified:
- **Total Cards Scanned**: 15,398
- **Total Abilities Scanned**: 36,422
- **Ability Pairs Sharing Timing & Level Requirements**: 3,937
- **Ability Pairs Sharing Timing, Levels, AND Primary Operation**: 88

### 2.1. Verification of Canonical Collision Examples

#### 1. `BS17-036` (The SacredKnight Arthur / King-Harald)
- **Ability 1 (BS17-036#a1)**: Timing: `PASSIVE`, Level: `2`, Op: `IMMUNITY`  
  *Text*: *"When braved with a Red/White Brave, all your Brave Spirits are unaffected by opposing Spirit effects."*
- **Ability 2 (BS17-036#a2)**: Timing: `PASSIVE`, Level: `2`, Op: `IMMUNITY`  
  *Text*: *"When braved with a Purple/Green/Yellow/Blue Brave, all your Brave Spirits are unaffected by opposing Magic effects."*
- **Resolution**: Conditions (Red/White Brave vs Purple/Green/Yellow/Blue Brave) and immunity target filters (Spirit vs Magic) are captured in the AST. Complete AST distinguishes them bit-for-bit.

#### 2. `BS25-063` (Ultimate-Lowen / The IronMachineDeity Saigord-Golem)
- **Ability 2 (BS25-063#a2)**: Timing: `WHEN_SUMMONED`, Level: `3-4-5`, Op: `DESTROY`  
  *Text*: *"Destroy opposing Cost 1/2/3/4 Spirits, one of each."*
- **Ability 3 (BS25-063#a3)**: Timing: `WHEN_SUMMONED`, Level: `3-4-5`, Op: `DESTROY`  
  *Text*: *"When Ultimate Trigger hits, destroy opposing Cost 5/6/7 Spirits, one of each."*
- **Resolution**: Target cost distribution filters (`[1,2,3,4]` vs `[5,6,7]`) and condition (`ULTIMATE_TRIGGER_HIT`) exist in the AST, producing completely different ASTs.

#### 3. `BS27-068` (The TwinsAstralArmored BraveGemini)
- **Ability 1 (BS27-068#a1)**: Timing: `ATTACK_STEP`, Level: `1-2-3`, Op: `DRAW`  
  *Text*: *"When your Life is reduced by the attack of opposing Spirits, draw a card."*
- **Ability 2 (BS27-068#a2)**: Timing: `ATTACK_STEP`, Level: `1-2-3`, Op: `DRAW`  
  *Text*: *"When your Life is reduced by the attack of opposing Ultimates, draw two cards."*
- **Resolution**: Trigger conditions (opposing Spirits vs Ultimates) and draw quantity (1 card vs 2 cards) are fully differentiated in the AST.

---

## 3. Full 256-Bit SHA-256 Physical Identity Architecture

### 3.1. Corrected Identity Formula
```text
physicalAbilityId = cardNumber + "#AB_" + timing + "_" + trigger + "_" + levels + "_" + fullSha256Digest
```
Where:
- `cardNumber`: Canonical card identifier (`BS25-063`, `BS01-002`).
- `timing`: Primary timing category (`WHEN_SUMMONED`, `FLASH`, `PASSIVE`).
- `trigger`: Trigger event or condition prefix (`NONE`, `ON_ATTACK`, `WHEN_DESTROYED`).
- `levels`: Normalized level string (`LV1-2`, `LV3-4-5`).
- `fullSha256Digest`: Full 64-hexadecimal-character (256-bit) SHA-256 digest computed over the RFC 8785 canonical JSON representation of the complete physical ability descriptor.

### 3.2. Retaining the Canonical Descriptor
Alongside the digest, the engine and compiler retain the normalized canonical descriptor:
```json
{
  "timing": "WHEN_SUMMONED",
  "trigger": "NONE",
  "levels": [3, 4, 5],
  "clauses": [
    {
      "op": "DESTROY",
      "target": { "type": "SPIRIT", "owner": "OPPOSING", "cost": [1, 2, 3, 4], "distribution": "ONE_OF_EACH" },
      "optional": false
    }
  ]
}
```

---

## 4. Deterministic Collision Handling

Rather than claiming zero collision probability, the architecture implements a deterministic collision bucket registry:

```text
┌────────────────────────────────────────────────────────┐
│ Incoming Normalized Physical Ability Descriptor        │
└───────────────────────────┬────────────────────────────┘
                            │ Compute SHA-256 Digest
                            ▼
┌────────────────────────────────────────────────────────┐
│ Lookup in Descriptor Registry: registry.get(digest)    │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        (No Match)                 (Match Found)
               │                          │
               ▼                          ▼
┌────────────────────────────┐ ┌─────────────────────────────────────────┐
│ Register new digest        │ │ Deep Canonical AST Equality Comparison  │
│ Return physicalAbilityId   │ └────────────┬────────────────────────────┘
└────────────────────────────┘              │
                         ┌──────────────────┴──────────────────┐
                         │                                     │
                    (ASTs Identical)                   (ASTs Differ: Collision!)
                         │                                     │
                         ▼                                     ▼
            ┌─────────────────────────┐           ┌─────────────────────────────┐
            │ Reuse existing          │           │ Deterministic Collision     │
            │ physicalAbilityId       │           │ Bucket Allocation:          │
            └─────────────────────────┘           │ Append "#COLLISION_${bucket}"│
                                                  │ Sorted by Lexicographical   │
                                                  │ Canonical JSON!             │
                                                  └─────────────────────────────┘
```

### 4.1. Rules for Collision Buckets
1. **Never merge unequal descriptors**: Two distinct descriptors that produce the same digest are never merged.
2. **Deterministic Salt**: When a collision is detected, descriptors are sorted lexicographically by their RFC 8785 canonical JSON string. The lowest string receives base ID; subsequent strings receive `#COLLISION_1`, `#COLLISION_2`.
3. **Compiler Invariance**: Because bucket assignment is governed by RFC 8785 string sort order, it is 100% independent of compiler traversal order or mutable array indices.
4. **Semantic Content Changes**: If an ability's actual semantic content changes, its descriptor changes, yielding a new digest.

---

## 5. Clause Ordering vs Object Key Ordering

### 5.1. The Principle of Semantic Execution Order
- In Battle Spirits, **execution clause order is semantically binding**.
  For example, *"Exhaust 1 opposing Spirit. Then, destroy 1 opposing exhausted Spirit."* cannot be executed in reverse order.
- Therefore, **execution clauses must NEVER be reordered or sorted** during descriptor normalization.

### 5.2. Test Specifications
- **Key Ordering Test**: Shuffling JSON object keys (e.g. `{"op": "DESTROY", "cost": 4}` vs `{"cost": 4, "op": "DESTROY"}`) MUST produce identical digests under RFC 8785.
- **Whitespace / Formatting Test**: Variations in formatting or whitespace MUST produce identical digests.
- **Clause Ordering Test**: Reordering execution clauses (Clause A followed by Clause B vs Clause B followed by Clause A) MUST change the digest and preserve original order.
- **Parameter Mutation Test**: Altering costs, conditions, target filters, or operations MUST change the digest.
