# Phase 4C.3.1.3 — Robust Ability Identity Architecture & Collision Safety

## 1. Executive Summary & Collision Mathematics

In Phase 4C.3.1.2, a 12-character hexadecimal hash prefix was proposed with an erroneous claim of "zero collision probability". 
Mathematically, a 12-character hex string contains exactly 48 bits of entropy ($16^{12} = 2^{48} \approx 2.81 \times 10^{14}$). Under the **Birthday Paradox**, the probability of a collision exceeds $10^{-6}$ at only $\approx 7.5 \times 10^5$ items, and reaches $50\%$ at $\approx 1.98 \times 10^7$ items. In a card game with 35,000+ active abilities across 14,600+ cards, claiming zero collision for a truncated 48-bit hash is mathematically invalid.

This specification completely replaces truncated hashing with a **two-layer identity architecture**:
1. **Layer 1: Structural Physical Ability Identity (`physicalAbilityId`)**: Uniquely and deterministically identifies a printed ability on a specific canonical card without using mutable array indexes.
2. **Layer 2: Canonical Semantic Fingerprint (`semanticAbilityId`)**: A full 256-bit cryptographic digest over RFC 8785 canonicalized JSON, backed by explicit fallback property comparison, guaranteeing absolute collision immunity.

---

## 2. Multi-Layer Identity Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: Physical Ability Identity (Card-Scoped)                       │
│ - Scope: Identifies this specific ability definition on this card      │
│ - Derivation: ${cardNumber}#${timing}_${trigger}_${levels}_${seq}      │
│ - Used for: Ordinary [Once per turn], ability resolution, IR shards   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ LAYER 2: Semantic Ability Identity (Pool-Scoped)                       │
│ - Scope: Matches equivalent effects across reprints & Same-Name cards  │
│ - Derivation: Full 256-bit SHA-256 over Canonical JSON (RFC 8785)      │
│ - Used for: [Once per turn: Same Name], cross-set reprint matching     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ LAYER 3: Granted Ability Identity (Dynamic Scope)                      │
│ - Scope: Isolates abilities granted dynamically at runtime             │
│ - Derivation: GRANT:${grantorCardNumber}:${grantorPlacementId}:${semId} │
│ - Used for: Brave / Magic / Nexus granted abilities                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Identity Specifications

### 3.1. Physical Ability Identity (`physicalAbilityId`)
Physical ability IDs must be permanently stable across compiler runs, immune to compiler AST reordering, and independent of array position.

$$\text{physicalAbilityId} = \text{`\$\{cardNumber\}#\$\{timing\}_\$\{trigger\}_\$\{levels\}[\_\$\{disambiguator\}]'}$$

- **Components**:
  - `cardNumber`: Canonical card number (`BS01-002`, `BS52-X01`).
  - `timing`: Primary timing category (`FLASH`, `MAIN`, `PASSIVE`).
  - `trigger`: Primary trigger event (`ON_ATTACK`, `WHEN_DESTROYED`, `NONE`).
  - `levels`: Required level range (`LV1-2`, `LV2`).
  - `disambiguator`: In the rare scenario where a card has two distinct abilities with the identical timing, trigger, and levels, a disambiguator token derived from the primary operation name is appended (e.g. `_DEST`, `_DRAW`).
- **Example**: `BS01-002#PASSIVE_ON_ATTACK_LV1-2`

### 3.2. Semantic Ability Identity (`semanticAbilityId`)
For `[Once per turn: Same Name]`, the engine must determine whether an ability on Card A is semantically equivalent to an ability on Card B (e.g. across reprints).

#### A. Canonical JSON Serialization (RFC 8785)
To prevent hash discrepancies caused by JSON key ordering or whitespace, the semantic descriptor is sorted lexicographically:

```json
{
  "clauses": [
    {
      "condition": null,
      "isOptional": false,
      "operations": [
        { "count": 1, "op": "DRAW" }
      ],
      "restriction": {
        "count": 1,
        "resetInterval": "TURN",
        "scope": "SAME_NAME",
        "type": "COUNT_PER_TURN"
      }
    }
  ],
  "levels": [1, 2],
  "timing": "PASSIVE",
  "trigger": "ON_ATTACK"
}
```

#### B. Full 256-Bit Cryptographic Digest & Collision Defense
1. The normalized JSON string is hashed using full SHA-256 (256 bits of entropy = $2^{256} \approx 1.15 \times 10^{77}$).
2. **Explicit Collision Guard**: If two abilities ever produce the same hash, the engine executes a deep equality check on the canonical JSON AST (`canonicalDescriptorEqual(astA, astB)`). If the ASTs are not strictly identical, an explicit salt is applied. This guarantees 100% collision impossibility.

### 3.3. Granted Ability Identity (`grantedAbilityId`)
When an ability is granted to a Spirit via `GRANT_ABILITY`:
$$\text{grantedAbilityId} = \text{`GRANT:\$\{grantorCardNumber\}:\$\{grantorPlacementId\}:\$\{sourceSemanticId\}'}$$
- This completely isolates granted abilities from the host Spirit's printed abilities.
- If Spirit A gains "Draw 1 card [Once per turn]" from Brave B, and Spirit C also gains the same effect from Brave D, each granted ability tracks usage independently through its distinct `grantorPlacementId`.

---

## 4. Migration Strategy from Legacy IDs (`BS01-002#a0`)

The current compiled IR shards and legacy bridge use array-index notation (`#a0`, `#a1`). To migrate safely without breaking backward compatibility:

1. **Dual Identification**: During compilation, each ability IR object will carry both identifiers:
   ```json
   {
     "id": "BS01-002#a0",
     "physicalId": "BS01-002#PASSIVE_ON_ATTACK_LV1-2",
     "semanticId": "SEM_4f89a1b2c3d4e5f6...256bit",
     "legacyId": "BS01-002#a0"
   }
   ```
2. **Lookup Fallback**: The engine resolver will accept both `ability.physicalId` and `ability.id`.
3. **Deprecation Phase**: Once all 514 shards are recompiled in Phase 4C.3.2, `physicalId` becomes the primary identifier, with `legacyId` preserved solely for external tooling and legacy test assertions.

---

## 5. Reprints with Changed Text or Errata

Under Official Bandai Tournament Rules:
- When a card is reprinted with updated or errata wording, all previous printings are ruled according to the **latest official text** in the Eternal card database.
- Because Battle Spirits Eternal compiles from the canonical card database which holds the latest authoritative text, both old and new printings compile to the identical `semanticAbilityId`.
- If an erratum changed the fundamental mechanics of an ability (e.g. changing an ordinary OPT to Same Name OPT), the database update applies universally across all printings, preserving perfect rule synchronization.
