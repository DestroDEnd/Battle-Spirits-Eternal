# Coverage Evidence Methodology Report

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** 2.2.1 Corrective Closure & Audit Integrity  
**Date:** 2026-11-21  

---

## 1. Methodology Principles

The Phase 2.2.1 closure evidence system uses a strictly validated, AST-checked evidence model:

1. **AST Source Verification:** Every evidence record is programmatically verified against the AST of the referenced test file via `scripts/verify_evidence_model.mjs`.
2. **Exact Test Identifier Matching:** Prefix and partial test name matching is strictly forbidden. The exact identifier as registered in `test('...', ...)` is required.
3. **Master Runner Membership:** Test suites must be members of the authoritative 37-suite master runner.
4. **Variant Isolation:** Support is evaluated strictly per opcode variant (`OP::variant`). A verified variant never upgrades other variants of the same opcode.
5. **Zero Inferred Support:** An existing handler without concrete before/after state assertions is classified strictly as `HANDLER_PRESENT`.
6. **5 Strict Evidence Tiers:**
   - `FULLY_SUPPORTED`: Strong production-path execution, before/after state assertions, event emissions, real-card coverage, and complete-match verification.
   - `SEMANTICALLY_VERIFIED`: Verified production execution and state transitions, but broader complete-match scope is missing.
   - `RUNTIME_TESTED`: Production execution verified with basic assertions, but full state/event or boundary checks are incomplete.
   - `HANDLER_PRESENT`: Implemented handler exists in `engine/ops/index.js`, but lacks granular test assertions.
   - `PARSED_ONLY`: Recognized by the compiler/AST, but executable engine support is absent.

---

## 2. Reconciled Evidence Summary

- **Total Unique Opcodes:** 288
- **Total Operational Variants:** 316
- **Total Compiled Clauses:** 51734 (100% of corpus verified)

| Tier | Unique Variants | Affected Clauses | % of Corpus | Description |
|---|---|---|---|---|
| **FULLY_SUPPORTED** | 7 | 15794 | 30.53% | Core actions with comprehensive assertions, real cards, and complete-match evidence |
| **SEMANTICALLY_VERIFIED** | 14 | 2492 | 4.82% | Semantically asserted state transitions, events, and fail-closed validation |
| **RUNTIME_TESTED** | 2 | 2 | 0.00% | Runtime executed with basic assertions |
| **HANDLER_PRESENT** | 293 | 33446 | 64.65% | Production handler present in `engine/ops/index.js` awaiting granular assertions |
| **PARSED_ONLY** | 0 | 0 | 0.00% | Compiler recognizes AST; no executable handler |
| **Total Corpus** | **316** | **51734** | **100.00%** | Full 514-shard canonical universe |
