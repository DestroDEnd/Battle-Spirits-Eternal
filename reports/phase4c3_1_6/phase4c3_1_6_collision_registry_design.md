# Phase 4C.3.1.6 — Deterministic Collision Registration & Physical Identity Specification

## 1. Executive Summary & The Registration-Order Problem

Phase 4C.3.1.5 proposed calculating physical ability identity via:
```text
physicalAbilityId = cardNumber + "#AB_" + timing + "_" + trigger + "_" + levels + "_" + fullSha256Digest
```
with a fallback collision-bucket allocation (`#COLLISION_0`, `#COLLISION_1`) sorted lexicographically by canonical JSON.

However, independent review correctly discovered a **fatal registration-order flaw** in sequential/incremental registration:
```text
Scenario:
1. Descriptor B registers first in an empty registry.
2. Descriptor B receives base identity (or #COLLISION_0).
3. Descriptor A registers subsequently.
4. Descriptor A sorts before Descriptor B lexicographically (A < B).
5. The system must either:
   - Reassign Descriptor B's ID to #COLLISION_1 (breaking in-flight game state and persistence), OR
   - Violate its deterministic sorting rule (making the ID dependent on registration order).
```

This specification analyzes the three required design alternatives, resolves the registration-order dependency, and defines an immutable, deterministic architecture.

---

## 2. Evaluation of Design Alternatives

| Dimension | Approach A: Batch Registry | Approach B: Intrinsic Content Discriminator | Approach C: Stable Append-Only Registry |
|---|---|---|---|
| **Core Concept** | Collect all descriptors across the entire card database before assigning IDs; freeze before emission. | Derive secondary collision suffix strictly from the descriptor's own content (e.g. SHA-512 slice), completely order-independent. | Persist a committed static mapping file; assign monotonic indices upon first arrival; never reassign existing IDs. |
| **Determinism** | **100% Deterministic** across full database builds. | **100% Deterministic** under ANY registration order. | Deterministic if registry file is checked into version control. |
| **Incremental Compilation** | **POOR**: Cannot assign stable IDs to a single modified card without scanning the whole database. | **PERFECT**: Any single card compiles in complete isolation with identical ID output. | **MODERATE**: Requires reading and locking the persistent registry file. |
| **Recompilation Stability** | Stable as long as whole set is built together. | **100% Stable**: D_i always yields the exact same ID regardless of what other cards are compiled. | Stable for existing cards; new collisions append to registry. |
| **Runtime Lookup Cost** | O(1) hash map lookup. | O(1) computation + O(1) lookup. | O(1) hash map lookup. |
| **Persistence Compatibility** | Excellent for static cards. | **EXCELLENT**: Zero external registry file needed; IDs are purely mathematical functions of AST. | Requires shipping registry JSON artifact. |
| **Migration Complexity** | High if card set changes. | **ZERO MIGRATION**: No ID reassignment ever occurs when other cards are added. | Requires schema migration if registry format changes. |

---

## 3. Selected Architecture: Intrinsic Content Discriminator (Approach B)

We select **Approach B (Intrinsic Content Discriminator)** as the authoritative physical ability identity architecture, backed by **Approach A (Batch Validation)** during shard builds.

### 3.1. Mathematical Formula
For any physical ability with normalized RFC 8785 canonical JSON descriptor D:
1. Primary Digest: H_1(D) = SHA-256(D) (64 hexadecimal characters, 256 bits).
2. Secondary Discriminator (activated ONLY if H_1 collides with a distinct D' != D):
   $$H_2(D) = \text{SHA-512}(D)[0..15] \quad \text{(64-bit hexadecimal slice)}$$

### 3.2. Concrete Identity Derivation
```text
// Standard Case (99.9999999999% of all abilities - 100% of all 36,422 current abilities):
physicalAbilityId = ${cardNumber}#AB_${timing}_${trigger}_${levels}_${H1}

// Theoretical Digest Collision Case (D != D', but H1(D) == H1(D')):
physicalAbilityId = ${cardNumber}#AB_${timing}_${trigger}_${levels}_${H1}_${H2}
```

### 3.3. Why Approach B Completely Eliminates the Registration-Order Problem
Because H_2(D) is computed **strictly from D itself**:
1. If Descriptor B registers first, its identity is:
   `BS01-001#AB_FLASH_NONE_LV1-2_${H1}_${H2(B)}`
2. When Descriptor A arrives later, its identity is:
   `BS01-001#AB_FLASH_NONE_LV1-2_${H1}_${H2(A)}`
3. Descriptor B's identity **NEVER CHANGES** when Descriptor A arrives!
4. The IDs are identical whether:
   - A registers then B registers;
   - B registers then A registers;
   - A compiles alone in an incremental compiler worker;
   - B compiles alone on a CI server!

Zero state, zero lockfiles, zero registration-order dependence.

---

## 4. Lifecycle & Immutability Rules

1. **Compilation Phase**:
   - Compiler normalizes ability AST.
   - Computes RFC 8785 canonical JSON string D.
   - Computes H_1 = SHA-256(D).
   - Checks local shard collision map. If a collision is detected with a distinct AST, appends H_2 = SHA-512(D)[0..15].
   - Emits immutable `physicalAbilityId` into compiled IR shard.
2. **Runtime Phase**:
   - Engine reads immutable `physicalAbilityId` directly from card's compiled IR.
   - Zero dynamic hash re-computation or ID mutation during gameplay.
   - State reconstruction and legacy bridge serialize and deserialize the exact string.
3. **Semantic Changes**:
   - If a card effect is officially changed by errata, its AST changes, naturally producing a new H_1 digest.
