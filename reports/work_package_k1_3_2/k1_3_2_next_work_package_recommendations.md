# K.1.3.2 Next Work Package Recommendations (Implementation Readiness)

## 1. Readiness Summary
- **`6,509` abilities in `K1-BATCH-01`** have zero timing, `cleanBody`, exclusion, or dependency blockers.
- **`101` abilities in `K1-BATCH-01`** are blocked by `timingLabel` discrepancies (e.g. `"When Destroyed by the Opponent"`, `"During Your Battle Phase"`, `"When summoned by paying the original cost"`) and must NOT be rolled out until compiler timing qualifiers are added.
- **`312` timing discrepancies** (`299` `GAMEPLAY_TIMING_MISSING`, `6` `ACTIVATION_RESTRICTION_MISSING`, `7` `EXECUTABLE_EFFECT_TEXT_MISSING`) require compiler remediation (`compiler/header_parser.js`, `compiler/index.js`).
- **`104` `cleanBody` zero-clause records** (`101` truncated `Brave Condition: [Right` headers, `3` zero-clause `ABILITY` records) require parser/compiler remediation.
- **`1,818` prerequisite/keyword nodes** (`3,632` edges) currently have **`0` confirmed runtime consumers** in `engine/` (`CONFIRMED_COMPILER_CONSUMER_ONLY` or `EXPECTED_CONSUMER_NOT_FOUND` / `UNRESOLVED_DATA_FLOW`) and require runtime validation hooks in `engine/` before prerequisite-gated cards can be verified end-to-end.
- **`221` unresolved exclusions** require manual rules/source audit before batch assignment.

## 2. Recommended Next Work Package Sequence
1. **Compiler & Timing Remediation Package (Pre-`K1-BATCH-01` or Parallel Gate):**
   - Fix multi-line `timingLabel` header/body split (`7` records).
   - Add structured `timingCause`, `timingTriggers`, `timingOwner`, and `activationRestrictions` fields (`305` records).
   - Fix `Brave Condition: [Right` / `[Left]` bracket parsing (`101` records).
2. **Engine Prerequisite Runtime Consumer Package:**
   - Wire runtime validation in `engine/` for `Brave Condition`, `Summon Condition`, `SuAdcon`, and `Mirage` / `Release` header declarations with E2E tests.
3. **`K1-BATCH-01` Safe Subset (`6,509` clean abilities):**
   - After explicit user approval, begin `K1-BATCH-01` verification strictly excluding the `101` timing-blocked abilities until Step 1 lands.
