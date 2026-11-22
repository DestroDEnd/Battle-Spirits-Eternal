# PACKAGE K.1.1 — SEMANTIC CANONICALIZATION SPECIFICATION

## 1. Exact Semantic Signature (`SEM-<sha256_16>`)

Canonical JSON is derived by:
1. Sorting all object keys lexicographically at every depth (`canonicalizeIrValue`).
2. Stripping `undefined` properties while preserving `null`, booleans, numbers, arrays, and strings.
3. Normalizing only internal whitespace runs (`\s+ -> ' '`) and leading/trailing whitespace on strings.
4. Preserving ALL behaviorally relevant properties:
   - **Header:** `timing`, `timings`, `timingStep`, `levels`, `limit`, `limitCount`, `cantStack`, `isOptional`, `burstCondition`, `condition`, `keyword`.
   - **Ordered Clauses:** `link`, `isOptional`, `isCost`, `condition`, `duration`, and complete `op` object (all parameters, numbers, ranges, thresholds, target filters, zones, types, colors, families, card names, and restrictions).

## 2. Structural Signature (`STR-<sha256_16>`)

Retained solely for coarse structural grouping (`timing` + `[op, link, isCost, isOptional, hasCondition, targetSide]`). Structural equivalence NEVER implies semantic equivalence.
