# Card Support Classification Methodology (Phase 4D.1 — Work Package H)

**Document Version:** 1.0.0  
**Effective Date:** 2026-11-21  
**Audited Corpus:** 14,609 Unique Cards, 514 IR Shards, 36,422 Abilities, 51,734 Compiled Clauses  

---

## 1. Principles of Evidence-Driven Support Classification

Prior development phases relied on handler-presence checks in `engine/ops/index.js` and regex filename matching to classify cards. This created an audit discrepancy (Finding D) where cards with unhandled secondary abilities were prematurely labeled `FULLY_SUPPORTED`.

In **Phase 4D.1**, classification is governed by mathematical proof:

$$\text{Classification}(C) = \begin{cases}
\text{VANILLA} & \text{if } |\text{Abilities}(C)| = 0 \\
\text{FULLY\_SUPPORTED} & \text{if } |\text{Abilities}(C)| > 0 \land \forall A \in \text{Abilities}(C), \text{IsSupported}(A) \\
\text{PARTIALLY\_SUPPORTED} & \text{if } \exists A_1, A_2 \in \text{Abilities}(C) : \text{IsSupported}(A_1) \land \neg \text{IsSupported}(A_2) \\
\text{UNSUPPORTED} & \text{if } |\text{Abilities}(C)| > 0 \land \forall A \in \text{Abilities}(C), \neg \text{IsSupported}(A)
\end{cases}$$

Where an ability $A$ is supported if and only if:
1. It contains at least one compiled clause ($|\text{Clauses}(A)| \ge 1$).
2. Every clause $cl \in \text{Clauses}(A)$ has an executable primitive opcode in the supported runtime set.
3. The ability's trigger timing window is handled by `TimingWindowManager`.

---

## 2. Reconciliation with Historical Baselines

| Classification | Phase 3F / Phase 4D Claim | Phase 4D.1 Strict Evidence | Delta | Audit Rationale |
|---|---:|---:|---:|---|
| **FULLY_SUPPORTED** | 4,139 | 3329 | -810 | Reclassified 810 cards that had 1 or more unhandled secondary abilities. |
| **PARTIALLY_SUPPORTED** | 6,996 | 7797 | +801 | Absorbed cards with working primary abilities but incomplete secondary abilities. |
| **VANILLA** | 374 | 374 | 0 | Unchanged. Inherent 100% rules compliance. |
| **UNSUPPORTED** | 3,100 | 3109 | +9 | 9 edge-case cards with empty clauses reclassified to unsupported. |
| **Total** | **14,609** | **14609** | **0** | **100% Population Conservation** |

---

## 3. Tier Upgrade Protocol

A card transitions between tiers exclusively through code implementation:
1. **UNSUPPORTED $\rightarrow$ PARTIALLY_SUPPORTED:** Implement the primitive handler for the card's primary ability opcode.
2. **PARTIALLY_SUPPORTED $\rightarrow$ FULLY_SUPPORTED:** Implement all remaining blocking opcodes listed in `partial_card_diagnostics.json`.
3. **Verification Requirement:** Add automated regression test to `tests/real_card_semantic_validation.test.js` confirming end-to-end execution.

---

## 4. Deliverable References

- **Card Effect Support Matrix:** [card_effect_support_matrix.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/card_effect_support_matrix.json)
- **Card Support Summary:** [card_support_summary.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/card_support_summary.json)
- **Card Support Trend:** [card_support_trend.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/card_support_trend.json)
