# Unresolved Limitations & Explicit Scope Boundaries — Phase 4C.3.2.1 Final

## 1. Explicit Scope Restrictions & Phase Boundaries

1. **Phase 4C.3.2.2 Has NOT Started**:
   - `state.restrictions` was NOT implemented in `engine/state.js`.
   - Activation counters, once-per-turn restriction consumption, and pre-resolution atomic commits remain unimplemented.
   - Runtime restriction handlers and phase transition resets remain strictly reserved for Phase 4C.3.2.2.

2. **514 IR Shards Intact (Zero Modifications / Zero Recompilation)**:
   - `TC-COL-06` remains explicitly marked `BLOCKED`.
   - No card shards under `data/ir_shards/` were modified or recompiled.
   - Batch database recompilation is reserved for Phase 4C.3.2.3.

3. **Reserved Test IDs**:
   - `TC-COL-09` (Legacy Bridge serialization across restriction boundaries) remains reserved for Phase 4C.3.2.2.

## 2. Documented Technical Limitations

1. **Condition Normalization Boundaries**:
   - Precondition blocks (Summon/Brave/Super-Advent conditions) are classified as `CONDITION_TEXT_FALLBACK`.
   - Normalization safely removes cosmetic brackets and whitespace runs, but preserves all punctuation, thresholds, card types, and connectors.
   - True semantic equivalence across disparate prose conditions is intentionally not claimed without an AST compiler for conditions.

2. **Dual-Digest Collision Ceiling**:
   - Primary digest: 256 bits (SHA-256).
   - Secondary digest: 128 bits (SHA-512 slice).
   - Combined security: 384 bits. Probability of unintended collision across the 10,000+ card database is $< 10^{-50}$, backed by exact canonical AST equality guards.
