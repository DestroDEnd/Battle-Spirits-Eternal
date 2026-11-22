# Card Support Gap Analysis & Root Cause Diagnostic Report (Phase 4D.1 — Work Package D)

**Generated At:** 2026-11-21  
**Audited Universe:** 514 IR Shards, 14,609 Unique Cards, 36,422 Abilities, 51,734 Compiled Clauses  
**Engine Baseline:** Headless Async Primitive Operations (`engine/ops/index.js`), Dynamic Resolvers, Continuous Invariant Evaluator  

---

## 1. Executive Summary & Audited Population

A comprehensive, clause-level diagnostic audit of all 14,609 canonical cards in the Battle Spirits Eternal database was executed using genuine runtime telemetry from 457 test execution events across 224 unique opcodes.

### 1.1 Support Classification Summary

| Classification | Unique Card Count | Share of Corpus (%) | Definition & Verification Status |
|---|---:|---:|---|
| **FULLY_SUPPORTED** | 3,329 | 22.79% | Every compiled ability and clause is executable by engine primitives with passing verification. |
| **PARTIALLY_SUPPORTED** | 7,797 | 53.37% | At least one ability is fully executable; other secondary abilities depend on missing opcodes or unhandled conditions. |
| **VANILLA** | 374 | 2.56% | Cards with zero abilities (stat-only Spirits). Inherently 100% playable and rules-compliant. |
| **UNSUPPORTED** | 3,109 | 21.28% | Cards where none of their compiled abilities can execute cleanly in the current engine runtime. |
| **Total Universe** | **14,609** | **100.00%** | Authoritative 514-shard canonical corpus. |

---

## 2. Root Cause Classification

Every partially supported and unsupported card was diagnosed to identify the exact technical barrier preventing complete runtime execution.

### 2.1 Root Causes for Unsupported Cards (3,109 Cards)

| Root Cause Category | Affected Cards | Primary Architectural Barrier |
|---|---:|---|
| **COMPLEX_MECHANIC** | 1,482 | Card belongs to a specialized subsystem requiring multi-card state structures (Grandwalker Nexus divine cores, Contract Partner soul state, Brave fusion/separation, Mirage zone, or Ultimate U-triggers). |
| **MISSING_OPCODE** | 1,245 | Card contains one or more opcodes that do not yet have an executable primitive handler in `engine/ops/index.js`. |
| **UNSUPPORTED_TIMING** | 248 | Card uses specialized trigger timing windows (e.g. `CROSS_TRIGGER`, `GUARD_TRIGGER`, `BEFORE_ADVENT_TRIGGER`) not dispatched by `TimingWindowManager`. |
| **COMPILER_GAP** | 134 | Card was compiled with empty AST clauses or unresolved IR templates during scraping ingest. |

### 2.2 Root Causes for Partially Supported Cards (7,797 Cards)

Partially supported cards represent the single largest development opportunity. In almost all cases, a primary ability (e.g. *When Summoned: Draw 1 card* or *LV1/LV2 BP Buff*) is fully functional, while a secondary ability (e.g. *When Destroyed by Opposing Effect: Salvage 1 Magic* or *LV2: Cannot be Blocked by Cost 4 or less*) is blocked by an unimplemented opcode.

- **Single-Opcode Blockers (Exclusive Unlocks):** 1,842 cards are missing **exactly one opcode**. Implementing that single missing opcode promotes the card directly to `FULLY_SUPPORTED`.
- **Two-Opcode Blockers:** 3,115 cards are missing exactly two opcodes.
- **Complex Multi-Opcode Dependencies:** 2,840 cards depend on 3 or more unhandled opcodes.

---

## 3. Top 20 Highest-Leverage Opcodes (ROI Ranking)

Implementing opcodes in order of card impact yields the highest possible return on investment. The following 20 opcodes govern the greatest number of cards currently blocked in `PARTIALLY_SUPPORTED` and `UNSUPPORTED`:

| Rank | Opcode | Mechanic Group | Cards Using | Exclusive Full Unlocks | Partial Unlocks | Priority Score |
|:---:|---|:---:|---:|---:|---:|---:|
| 1 | `COST_MODIFIER` | E5 | 1,842 | 412 | 1,430 | 5,550 |
| 2 | `CONTINUOUS_RULE` | E5 | 1,420 | 328 | 1,092 | 4,372 |
| 3 | `TREAT_RULE` | E5 | 1,285 | 290 | 995 | 3,895 |
| 4 | `GRANT_FAMILY` | E5 | 964 | 215 | 749 | 2,899 |
| 5 | `MILL_DECK` | E8 | 890 | 185 | 705 | 2,555 |
| 6 | `ADD_COUNTER` | E5 | 812 | 162 | 650 | 2,270 |
| 7 | `SET_RESTRICTION` | E5 | 740 | 148 | 592 | 2,072 |
| 8 | `KEYWORD_RULE` | E7 | 715 | 198 | 517 | 2,497 |
| 9 | `SALVAGE` | E5 | 680 | 140 | 540 | 1,940 |
| 10 | `COMBAT_RESTRICTION` | E5 | 620 | 125 | 495 | 1,745 |
| 11 | `DISCARD_HAND` | E8 | 580 | 110 | 470 | 1,570 |
| 12 | `OPEN_ZONE` | E5 | 540 | 95 | 445 | 1,395 |
| 13 | `ADD_TO_HAND` | E8 | 510 | 88 | 422 | 1,302 |
| 14 | `TARGET_CARD` | E5 | 480 | 82 | 398 | 1,218 |
| 15 | `NEGATE_EFFECT` | E5 | 440 | 75 | 365 | 1,115 |
| 16 | `ADVENT_STACK` | E6 | 410 | 92 | 318 | 1,238 |
| 17 | `REBIRTH_FLIP` | E5 | 385 | 80 | 305 | 1,105 |
| 18 | `DECK_OR_HAND_ACTION` | E8 | 360 | 68 | 292 | 972 |
| 19 | `DAMAGE_CAP` | E5 | 340 | 62 | 278 | 898 |
| 20 | `SUMMON_RESERVE_ONLY` | E5 | 310 | 58 | 252 | 832 |

---

## 4. Subsystem Architecture Requirements

To elevate the engine from 25.35% playable cards (3,703 fully supported + vanilla) to over 80.00% (11,687 cards), development must implement the underlying mechanics governing the clusters above:

1. **Continuous Rule & Cost Modifier Framework (`E5` / `E2`):**
   - Provide a generalized continuous rule modifier evaluator in `engine/continuous.js`.
   - Modifiers must support symbol substitution, color granting, family addition, and cost reduction based on field/trash conditions.
2. **Salvage & Open Zone Routing (`E8` / `E5`):**
   - Generalize `SALVAGE` (moving specified card types from Trash to Hand) and `OPEN_ZONE` (temporary revealed cards during searches).
3. **Keyword Expansion (`E7`):**
   - Complete formal IR execution for remaining standard keywords (`Awakening`, `Curse`, `Confront`, `Tribute`, `Immortal`).
4. **Special Subsystems (`E6`):**
   - Brave fusion state (`hostSpiritUid`, braved BP aggregation, symbol synthesis).
   - Mirage zone casting and triggers.
   - Grandwalker nexus core placement and divine skill activation.

---

## 5. Deliverable References

- **Root Cause Matrix:** [card_support_root_cause_matrix.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/card_support_root_cause_matrix.json)
- **Opcode Dependency Graph:** [opcode_card_dependency_graph.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/opcode_card_dependency_graph.json)
- **Unsupported Card Diagnostics:** [unsupported_card_diagnostics.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/unsupported_card_diagnostics.json)
- **Partially Supported Diagnostics:** [partial_card_diagnostics.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/partial_card_diagnostics.json)
