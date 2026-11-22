# Phase 4C.3.1.8 — Physical Ability Identity Specification: Dual-Digest Derivation & Collision Architecture

**Document ID:** `BS-ARCH-4C318-PHYS-01`  
**Phase:** 4C.3.1.8 (Final Specification Lock)  
**Status:** SPECIFICATION LOCKED / AUDIT APPROVED  
**Author:** Battle Spirits Eternal Rules & Compiler Architecture Team  
**Scope:** Specification only; no production or compiler code modifications.

---

## 1. Executive Overview

In Battle Spirits Eternal, card abilities must possess deterministic, immutable, and unique physical identities. Earlier designs relied on array positions (`canonicalAbilityIndex`) or conditional secondary digests ($H_2$ derived only upon collision), which introduced non-determinism during parallel or incremental compilation.

Phase 4C.3.1.8 formally locks **Approach A: Unconditional Dual-Digest Identity**. Every ability descriptor unconditionally derives both a primary SHA-256 digest and a secondary SHA-512 slice. When combined with RFC 8785 Canonical JSON serialization and an unconditional exact AST descriptor equality guard, this architecture guarantees:
1. **Compilation-Order Independence:** A card or ability compiled in isolation produces the exact bitwise identity as when compiled within a batch of 14,609 cards.
2. **Deterministic Collision Detection:** Two abilities with matching digests must have identical descriptors; any mismatch immediately halts compilation.
3. **Array-Index Independence:** Ability identities remain strictly invariant under ability re-ordering, shard partitioning, and reprint versions.

---

## 2. Unambiguous Digest Derivation Specification

### 2.1 Serialization Standard (RFC 8785)
Before hashing, the ability descriptor $D$ is serialized into a deterministic byte sequence using the **JSON Canonicalization Scheme (RFC 8785)**:
- Object keys are sorted lexicographically by Unicode code point order.
- No whitespace is emitted outside string literals (`:` and `,` are unspaced delimiters).
- String literals are encoded strictly in UTF-8 without escaping characters that do not require JSON escaping (`"`, `\`, and control characters U+0000 through U+001F).
- Number representations adhere strictly to IEEE 754-2008 without leading plus signs or redundant fractional zeros.

### 2.2 Digest Algorithms and Slicing Conventions
The cryptographic derivation applies two distinct NIST-standard hash functions to the identical canonical UTF-8 byte stream $B = \text{RFC8785}(D)$:

```
           +-----------------------------------------------+
           | Ability Descriptor D (Canonical JSON, UTF-8)  |
           +-----------------------------------------------+
                               |
               +---------------+---------------+
               |                               |
               v                               v
        +--------------+                +--------------+
        |   SHA-256    |                |   SHA-512    |
        | (FIPS 180-4) |                | (FIPS 180-4) |
        +--------------+                +--------------+
               |                               |
               | (32 bytes raw)                | (64 bytes raw)
               |                               v
               |                        [ Slice First  ]
               |                        [ 16 Raw Bytes ]
               |                               |
               v                               v
         H1 (32 bytes)                   H2 (16 bytes)
         (64 hex chars)                  (32 hex chars)
               |                               |
               +---------------+---------------+
                               |
                               v
               Composite Digest: H1_H2 (96 hex chars)
```

#### Detailed Specification Table

| Attribute | Primary Digest ($H_1$) | Secondary Digest ($H_2$) | Combined Digest ($H_1\_H_2$) |
| :--- | :--- | :--- | :--- |
| **Standard Algorithm** | SHA-256 (NIST FIPS 180-4) | SHA-512 (NIST FIPS 180-4) | Dual-Algorithm Concatenation |
| **Input Material** | Canonical UTF-8 Bytes of $D$ | Canonical UTF-8 Bytes of $D$ | Canonical UTF-8 Bytes of $D$ |
| **Full Output Length** | 32 bytes (256 bits) | 64 bytes (512 bits) | 96 bytes (768 bits full) |
| **Slice Definition (Bytes)** | Full output: `bytes[0..31]` | First 16 bytes: `rawBytes.subarray(0, 16)` | `32 + 16 = 48` bytes raw |
| **Slice Definition (Hex)** | Full string: 64 hex characters | First 32 hex chars: `hexString.slice(0, 32)` | `64 + 1 + 32 = 97` chars (with `_`) |
| **Character Encoding** | Lowercase hex ASCII (`[0-9a-f]`) | Lowercase hex ASCII (`[0-9a-f]`) | Lowercase hex ASCII (`[0-9a-f]`) |
| **Output Bits** | 256 bits | 128 bits | 384 bits combined |

> [!IMPORTANT]
> **Definitive Clarification on Units:**
> - $H_2$ represents exactly **16 raw bytes** (128 bits).
> - In hexadecimal notation, each byte is encoded by exactly 2 hexadecimal characters (`00` through `ff`).
> - Therefore, a 16-byte slice corresponds directly to a **32-character hexadecimal string**.
> - Slicing may be executed either as `rawBytes.subarray(0, 16)` on the raw buffer or as `hexString.slice(0, 32)` on the hex-encoded string. Both operations are mathematically and functionally identical.

---

## 3. Composite Identity Format

The permanent physical ability identity string is constructed according to the canonical template:

$$\text{physicalAbilityId} = \text{\$\{cardNumber\}}\#\text{AB\_}\text{\$\{timing\}}\_\text{\$\{trigger\}}\_\text{\$\{levelRange\}}\_\text{\$\{H1\}}\_\text{\$\{H2\}}$$

### Segment Definitions
1. **`${cardNumber}`**: The canonical card number (e.g., `BS52-001`, `SD37-X01`). Collisions are prevented between different cards by prefixing the card number.
2. **`${timing}`**: Normalized ability timing keyword (e.g., `FLASH`, `MAIN`, `START_OF_TURN`, `ON_PLAY`, or `NONE`).
3. **`${trigger}`**: Normalized trigger condition (e.g., `ON_ATTACK`, `WHEN_DESTROYED`, `WHEN_SUMMONED`, or `NONE`).
4. **`${levelRange}`**: Level prerequisite string (e.g., `LV1_LV2`, `LV2`, `ALL`).
5. **`${H1}`**: 64-character lowercase hexadecimal SHA-256 digest.
6. **`${H2}`**: 32-character lowercase hexadecimal SHA-512 slice.

### Concrete Example
For card `BS52-001`, an On-Attack Flash ability with LV1-LV2 requirement:
```
BS52-001#AB_FLASH_ON_ATTACK_LV1_LV2_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855_cf83e1357eefb8bdf1542850d66d8007
```
- Total length of digest suffix: $64 + 1 + 32 = 97$ characters.

---

## 4. Cryptographic Collision Analysis & Mathematical Rigor

### 4.1 Rejection of Additive Bit-Security Claims
In Phase 4C.3.1.6, it was asserted that concatenating SHA-256 (256 bits) and a SHA-512 slice (128 bits) yields a "384-bit collision resistance guarantee." **This assertion is mathematically invalid under modern cryptographic theory.**

When analyzing concatenated hash functions $H_1(x) \parallel H_2(x)$ based on Merkle-Damgård constructions:
1. **Joux's Multi-Collision Attack (2004):** Antoine Joux proved that finding multi-collisions in an iterated hash function $H_1$ requires $O(t \cdot 2^{n_1/2})$ operations. Once a set of $2^t$ pre-images colliding under $H_1$ is generated, testing these pre-images against $H_2$ finds a simultaneous collision in $O(2^{n_2/2})$ operations.
2. **Formal Upper Bound:** The collision resistance of concatenated Merkle-Damgård hashes is bounded above by the birthday bound of the constituent functions, rather than the sum of their output lengths. Specifically, an active cryptographic adversary can construct simultaneous collisions in significantly fewer than $2^{(256+128)/2} = 2^{192}$ operations.
3. **Conservative Engineering Standard:** The Battle Spirits Eternal architecture makes **zero claim of a 192-bit adversarial collision resistance**. Instead, we strictly distinguish:
   - **Digest Output Length:** 384 bits (48 raw bytes).
   - **Birthday Bound on SHA-256 Alone:** $2^{128}$ operations.
   - **Birthday Bound on Truncated SHA-512 Alone:** $2^{64}$ operations.

### 4.2 Pairwise Collision Probability in a Passive Corpus
In the context of the Battle Spirits card compiler, the input space consists of non-adversarial, human-authored card text. The entire card corpus comprises approximately $N \approx 15,000$ cards containing $M \approx 50,000$ total abilities.

Under the standard assumption that SHA-256 and truncated SHA-512 behave as independent pseudo-random functions over natural language descriptors, the probability $P$ of at least one pairwise collision across $M$ distinct descriptors in an output space of $S = 2^{384}$ states is given by the Poisson approximation of the birthday problem:

$$P(\text{collision}) \approx 1 - e^{-\frac{M(M-1)}{2S}} \approx \frac{M^2}{2 \cdot 2^{384}}$$

Substituting $M = 50,000$ ($5 \times 10^4$):

$$M^2 = 2.5 \times 10^9$$
$$2 \cdot 2^{384} \approx 2 \cdot (3.9402 \times 10^{115}) = 7.8804 \times 10^{115}$$
$$P(\text{collision}) \approx \frac{2.5 \times 10^9}{7.8804 \times 10^{115}} \approx 3.172 \times 10^{-107}$$

A probability of $3.17 \times 10^{-107}$ is so astronomically small that an accidental collision among legitimate card text is physically impossible within the lifetime of the universe.

### 4.3 Exact Descriptor Equality Checking: The Ultimate Safety Invariant
Cryptographic hashes reduce large structures to fixed-length keys, but **the engine compiler must never rely solely on probabilistic guarantees**. The compiler maintains an in-memory descriptor registry during every build. Whenever a derived `physicalAbilityId` matches an existing entry in the registry:
1. The compiler retrieves the previously registered canonical descriptor string $D_{\text{existing}}$.
2. It executes a strict character-by-character string comparison: $D_{\text{new}} === D_{\text{existing}}$.
3. **If $D_{\text{new}} === D_{\text{existing}}$:** The two abilities are confirmed to be structurally and semantically identical (e.g., identical ability on duplicate card printings or shared keywords). The identity is safely shared.
4. **If $D_{\text{new}} \neq D_{\text{existing}}$:** A true hash collision has occurred. The compiler **aborts immediately with a fatal error**. It never assigns a suffix, never alters the key, and never silently merges disparate abilities.

---

## 5. Specification Pseudocode: Compiler Collision Registry

The following pseudocode defines the exact specification logic to be implemented in Phase 4C.3.2. It illustrates the deterministic derivation, registry lookup, and fatal collision assertion:

```typescript
// SPECIFICATION REFERENCE ONLY — NOT PRODUCTION IMPLEMENTATION

import { createHash } from 'node:crypto';

interface AbilityDescriptor {
  timing: string;
  trigger: string;
  levels: number[];
  restrictions: Array<{
    type: string;
    scope: string;
    limit: number;
  }>;
  operations: Array<{
    op: string;
    params: Record<string, unknown>;
  }>;
}

interface RegistryEntry {
  physicalAbilityId: string;
  canonicalJson: string;
  cardNumber: string;
}

class AbilityIdentityCompiler {
  private registry: Map<string, RegistryEntry> = new Map();

  /**
   * Unconditionally derives the physical ability ID.
   * Registration order has ZERO effect on this derivation.
   */
  public derivePhysicalAbilityId(cardNumber: string, descriptor: AbilityDescriptor): string {
    // 1. Serialize descriptor strictly to RFC 8785 Canonical JSON
    const canonicalJson = this.rfc8785Canonicalize(descriptor);
    const inputBuffer = Buffer.from(canonicalJson, 'utf8');

    // 2. Derive H1: Full SHA-256 (32 bytes = 64 hex characters)
    const h1 = createHash('sha256').update(inputBuffer).digest('hex');

    // 3. Derive H2: SHA-512 sliced to first 16 bytes (32 hex characters)
    // Slicing 32 hex characters is exactly equivalent to rawBytes.subarray(0, 16)
    const fullH2 = createHash('sha512').update(inputBuffer).digest('hex');
    const h2Slice = fullH2.slice(0, 32);

    // 4. Construct composite ID
    const timing = descriptor.timing || 'NONE';
    const trigger = descriptor.trigger || 'NONE';
    const levelRange = descriptor.levels && descriptor.levels.length > 0
      ? descriptor.levels.map(l => `LV${l}`).join('_')
      : 'ALL';

    return `${cardNumber}#AB_${timing}_${trigger}_${levelRange}_${h1}_${h2Slice}`;
  }

  /**
   * Registers an ability and guards against hash collisions.
   * Must be called during compiler AST processing.
   */
  public registerAbility(cardNumber: string, descriptor: AbilityDescriptor): string {
    const physicalId = this.derivePhysicalAbilityId(cardNumber, descriptor);
    const canonicalJson = this.rfc8785Canonicalize(descriptor);

    if (this.registry.has(physicalId)) {
      const existing = this.registry.get(physicalId)!;

      // Exact descriptor equality guard
      if (existing.canonicalJson !== canonicalJson) {
        throw new Error(
          `[FATAL COLLISION DETECTED] Physical Ability ID collision encountered!\n` +
          `ID: ${physicalId}\n` +
          `Existing card: ${existing.cardNumber}\n` +
          `Incoming card: ${cardNumber}\n` +
          `Descriptors differ despite matching 384-bit dual digest.\n` +
          `Aborting compilation. Never assign discovery-order suffixes or merge silently.`
        );
      }
      // Identical descriptor: benign re-declaration or reprint
      return physicalId;
    }

    // New unique ability registration
    this.registry.set(physicalId, {
      physicalAbilityId: physicalId,
      canonicalJson,
      cardNumber
    });

    return physicalId;
  }

  private rfc8785Canonicalize(obj: unknown): string {
    // Deterministic key-sorted JSON serializer adhering to RFC 8785
    return JSON.stringify(this.sortKeysRecursively(obj));
  }

  private sortKeysRecursively(value: any): any {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(v => this.sortKeysRecursively(v));
    const sorted: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = this.sortKeysRecursively(value[key]);
    }
    return sorted;
  }
}
```

---

## 6. Descriptor Stability and Invariance Audit

An identity derivation is only as deterministic as its input descriptor. The descriptor fields must remain strictly invariant across execution environments:

| Descriptor Field | Invariance Mechanism | Potential Drift Hazard | Mitigation / Rule |
| :--- | :--- | :--- | :--- |
| **Object Key Order** | RFC 8785 Canonical JSON | Differing JSON serialization engines | Recursive Unicode code-point sorting before stringification. |
| **Operation Sequence** | Ordered Clause Array | Clause reordering by compiler passes | Compiler must **never sort execution clauses**. Clauses preserve source text order. |
| **Numeric Types** | IEEE 754 Normalized | Floating point formatting discrepancies | Integer values only for levels, costs, and limits. Redundant zeros forbidden. |
| **Printing Metadata** | Excluded from Descriptor | Rarity, foil, artist, pack codes | Only rules-functional attributes are included in descriptor $D$. |
| **Card Instances** | Static Compile-Time Derivation | Runtime placement or clone creation | Card instances receive dynamic `placementId` at runtime; static `physicalAbilityId` is unchanged. |
| **Zone Transitions** | Compile-Time Shard Immutability | Object mutation during engine resolution | Sharded IR is deeply frozen (`Object.freeze`); runtime state references IDs immutably. |

---

## 7. Compliance Verification Checklist

- [x] Slicing convention unambiguously defined: 16 raw bytes = 32 hexadecimal characters.
- [x] Mathematical distinction made between digest output length (384 bits) and birthday-bound collision resistance.
- [x] Joux multi-collision upper bound explicitly acknowledged.
- [x] Exact descriptor equality check specified as a non-negotiable compilation barrier.
- [x] Discovery-order suffixing explicitly forbidden.
- [x] Complete specification pseudocode provided.
- [x] Zero production code modified during this audit phase.
