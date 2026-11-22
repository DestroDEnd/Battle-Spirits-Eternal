# PACKAGE K.1.1 — DISCOVERY METHODOLOGY

1. **Corpus Traversal:** Iterates all `514` sorted IR shard files in `data/ir_shards/`, iterating sorted `cardKey` entries (`15,398` card records, `14,609` unique canonical `cardNumber`s, `36,422` abilities, `51,734` clauses).
2. **Dual Pattern Identity:**
   - Structural Pattern (`STR-<16hex>`): groups abilities by `[timing, op, link, isCost, isOptional, hasCondition, targetSide]`.
   - Exact Semantic Pattern (`SEM-<16hex>`): groups abilities by full canonicalized AST (`header` + ordered `clauses` + complete `op` parameters).
3. **Six-Dimensional Clause Classification:** Evaluates Parsing, Parameter Completeness, Runtime Implementation (`engine/ops/index.js`), Runtime Support, Semantic Verification (`audit_514_cards_exhaustive.mjs` strict variant verification), and Manual Review independently. Handler existence is never treated as semantic verification.
4. **Partitioned Export & Integrity Manifests:** Exports 100% of structural patterns, semantic patterns, card->ability->clause mappings, and manual-review records in 2,000-record chunks with SHA-256 + byte-size `manifest.json` files.
5. **Deduplicated Batch Calculation:** Tracks unique `abilityId` and `cardNumber` sets per batch with zero overlap across batches.
