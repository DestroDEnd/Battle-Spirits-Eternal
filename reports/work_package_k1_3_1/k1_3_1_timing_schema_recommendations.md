# K.1.3.1 Timing Schema Recommendations (Proposed Additive Remediation Specification)

> **Scope Notice:** This document is a proposed additive schema specification for a future compiler/discovery remediation phase. Per K.1.3.1 preservation rules, no compiler, engine, or IR shard files were modified in this package.

## 1. Findings from the 312 `timingLabel` Discrepancies

| Classification | Count | Root Cause |
|---|---:|---|
| `GAMEPLAY_TIMING_QUALIFIER_MISSING` | 299 | Broad `timing` (`WHEN_DESTROYED`, `STEP_RESTRICTED`, `ATTACK_STEP`) omits owner, cause, or dual-trigger qualifiers present in `timingLabel`. |
| `ADDITIONAL_ACTIVATION_RESTRICTION_MISSING` | 6 | `timingLabel` includes `"When summoned by paying the original cost"`, which is absent from `timing` (`WHEN_SUMMONED`) and `prefixes`. |
| `EXECUTABLE_EFFECT_TEXT_LEAK` | 7 | Multi-line `timingLabel` absorbed uncompiled effect/condition text after `\n` (6 of 7 have `clauses.length === 0`). |
| **Total** | **312** | **100% reconciled** |

## 2. Proposed Additive IR Header Fields (Future Compiler Pass)

1. **`timingCause` (`string | null`):**
   - Distinguish `"OPPONENT"` (`When Destroyed by the Opponent`, `When Depleted/Destroyed by the Opponent`, `When Depleted by the Opponent`), `"OPPOSING_SPIRIT_EFFECT"` (`When destroyed by an opposing Spirit effect`), vs `null` (either player).
2. **`timingTriggers` (`string[]`):**
   - Represent dual-trigger headers cleanly (e.g. `["WHEN_DEPLETED", "WHEN_DESTROYED"]` instead of collapsing to `STEP_RESTRICTED` with `timingStep: "ANY"`).
3. **`timingOwner` (`"SELF" | "OPPONENT" | "ANY"`):**
   - Distinguish `"During Your Battle Phase"` (`timingOwner: "SELF"`, `timing: "ATTACK_STEP"`) from `"During Either Player's Battle Phase"` (`"ANY"`).
4. **`activationRestrictions` (`string[]`):**
   - Capture `"PAID_ORIGINAL_COST"` for `"When summoned by paying the original cost"`.
5. **Compiler Header/Body Split Fix:**
   - Stop `timingLabel` extraction at `\n` so trailing effect/condition text stays in `cleanBody` and compiles into `clauses`.

## 3. Semantic Signature Integration Rule

Once the compiler populates `timingCause`, `timingTriggers`, `timingOwner`, and `activationRestrictions`, include those structured fields in `buildExactSemanticSignature` while keeping raw `timingLabel` excluded. Until then, abilities with `timingLabel` discrepancies flagged in `k1_3_1_missing_timing_semantics.json` must NOT be assumed semantically identical solely on `header.timing`.
