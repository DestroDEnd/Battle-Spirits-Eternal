# Phase 4C.3.1.7 — Physical Ability Identity & Dual-Digest Collision Specification

## 1. Executive Summary & Defect in Previous Proposal

In Phase 4C.3.1.6, an intrinsic content discriminator was proposed:
- $H_1(D) = \text{SHA-256}(D)$
- $H_2(D) = \text{SHA-512}(D)[0..15]$
with the condition that $H_2$ was appended **only when a primary collision was detected**.

Independent review correctly identified a critical flaw in this conditional scheme:
```text
Flaw Scenario:
1. Descriptor B compiles in isolation (e.g. incremental compile of Shard 25).
2. It receives an ID containing H1 only: ${cardNumber}#AB_..._${H1}.
3. Descriptor A is compiled later in a different shard and collides with B's H1.
4. Under a conditional scheme, the compiler now attempts to append H2 to both A and B.
5. Descriptor B's ID mutates from H1 to H1_H2!
```
This mutation violates **immutable incremental identity**. An already-persisted or distributed ID must never change when an unseen card is compiled.

---

## 2. Evaluation of Architectural Approaches

| Architectural Approach | Mechanism | Incremental Invariance | Registration-Order Independence | Implementation Complexity |
|---|---|---|---|---|
| **Approach A: Unconditional Dual-Digest Identity** | Compute both $H_1$ (SHA-256) and $H_2$ (SHA-512 slice) unconditionally for EVERY ability. | **100% Invariant**: Descriptor B derives identical ID regardless of whether A exists or when it is compiled. | **100% Independent**: Order of compilation has zero effect on either ID. | **LOW**: Clean, stateless, pure mathematical function of AST. |
| **Approach B: Full Canonical Descriptor Identity** | Use the full RFC 8785 canonical JSON string as the primary identity material; use digests only as indexes. | Invariant, but string sizes (50-300 bytes) bloat state, memory, and logs. | Order-independent. | **HIGH**: Large state payload across network and MCTS rollouts. |
| **Approach C: Full Digest with Conditional Extension** | Append secondary token only upon collision detection. | **FAILS**: Recompilation or incremental discovery mutates previously emitted IDs. | Fails unless backed by global locking. | **HIGH & FRAGILE**: Requires global state sync. |

---

## 3. Selected Architecture: Approach A (Unconditional Dual-Digest Identity)

We select **Approach A (Unconditional Dual-Digest Identity)** combined with **Exact Descriptor Equality Verification**.

### 3.1. Mathematical Definitions & Bit-Length Clarifications
To correct the mathematical notations from prior drafts:
- **1 byte = 8 bits = 2 hexadecimal characters**.
- **8 bytes = 64 bits = 16 hexadecimal characters**.
- **16 bytes = 128 bits = 32 hexadecimal characters**.
- **32 bytes = 256 bits = 64 hexadecimal characters**.
- **64 bytes = 512 bits = 128 hexadecimal characters**.

### 3.2. Concrete Formula
For any normalized ability descriptor $D$ serialized via RFC 8785:
1. **Primary Digest ($H_1$)**:
   $$H_1(D) = \text{SHA-256}(D) \quad \text{(32 bytes = 256 bits = 64 hex characters)}$$
2. **Secondary Digest ($H_2$)**:
   $$H_2(D) = \text{SHA-512}(D)[0..31] \quad \text{(16 bytes = 128 bits = 32 hex characters)}$$

The authoritative `physicalAbilityId` is derived unconditionally for every ability:
```text
physicalAbilityId = cardNumber + "#AB_" + timing + "_" + trigger + "_" + levels + "_" + H1 + "_" + H2
```

### 3.3. Key Properties of Approach A
1. **Combined Entropy**: $256 + 128 = 384$ bits of cryptographic collision resistance across two independent hash functions (SHA-256 and SHA-512).
2. **Stateless & Immutable**: Deriving $H_2$ unconditionally means Descriptor B's identity is identical whether compiled alone, first, last, or in a parallel worker.
3. **Exact Equality Fallback**: In the theoretical event that two distinct descriptors $D_1 \ne D_2$ produce identical 384-bit $(H_1, H_2)$ pairs (a probability bounded below $2^{-192}$), the registry performs deep AST comparison on the canonical RFC 8785 descriptor. Unequal descriptors are never merged.
