# Phase 4C.3.1.7 — Engine & Compiler Source Code Compatibility Report

## 1. Executive Summary & Verification Scope

An independent source-level code audit was conducted on all 9 active production modules in the repository:
1. `engine/state.js` (117 lines)
2. `engine/resolver.js` (451 lines)
3. `engine/index.js` (629 lines)
4. `engine/legacy_bridge.js` (400 lines)
5. `engine/flow.js` (261 lines)
6. `engine/conditions.js` (542 lines)
7. `engine/zones.js` (853 lines)
8. `compiler/header_parser.js` (483 lines)
9. `compiler/clause_splitter.js` (304 lines)

---

## 2. Preservation of Known Implementation Gaps

To maintain strict audit integrity, this report explicitly documents the current production implementation gaps:
1. **`state.restrictions` is ABSENT**: `engine/state.js:114` defines only `abilityUses: {}`. The structured restriction store is strictly an architectural design to be implemented in Phase 4C.3.2.
2. **Defective Consumption Timing**: `engine/index.js:241` consumes limits only **after** successful resolution (`if (result.results?.some(...))`), in direct violation of Comprehensive Rules Rule 8-1-6.
3. **No Field Placement Identity**: `engine/zones.js` and `engine/state.js` identify cards solely by `card.id` (`inst_X`), meaning cards re-entering the field cannot receive a fresh OPT limit under Rule 6-1-3 without adding `placementId`.
4. **No Reset Execution in Flow Machine**: `engine/flow.js:44-70` increments `turnNumber` but never clears or prunes `abilityUses`.
5. **Bridge Data Loss**: `engine/legacy_bridge.js:154, 302` drops any structured restriction data because it only copies `abilityUses`.
6. **Compiler Limit Drop Defect**: `compiler/header_parser.js:113-124` checks only 3 hardcoded sentences, dropping 826 restrictions identified in Phase 4C.3.0.

These verified source gaps establish the exact scope of engineering required for Phase 4C.3.2.
