# Phase 4C.3.2.2 — Unresolved Limitations and Architectural Scope

## 1. Executive Summary

Phase 4C.3.2.2 implements the runtime activation-limit enforcement engine for Battle Spirits Eternal, connecting the deterministic physical and semantic identity subsystem (delivered and verified in Phase 4C.3.2.1) to state-based restriction counters, lifecycle reset transitions, and legacy bridge synchronization.

All 35 newly specified runtime enforcement tests (`TC-ACT-01` through `TC-ACT-35`) pass without regressions, and 124 of 125 identity and golden compiler tests pass (with exactly 1 test blocked according to explicit specification).

This document details all technical limitations, deferred tasks, and non-scope items to provide full audit transparency.

---

## 2. Inventory of Known Limitations and Deferred Items

### Limitation 1: Full 514-Shard IR Batch Recompilation (`TC-COL-06`)
- **Status**: `BLOCKED` (as explicitly mandated by Phase 4C.3.2.2 specification).
- **Reason**: The user instructions and architectural boundary specify:
  > *"Do not recompile or modify the 514 IR shards (`TC-COL-06` remains BLOCKED). Authorized for Phase 4C.3.2.3."*
- **Impact**: While individual cards compile deterministically and derive valid physical and semantic IDs in isolation and incremental tests (`TC-COL-01` through `TC-COL-05`, `TC-COL-07`, `TC-ACT-35`), the full persistent batch re-generation of all 514 shards on disk is reserved for Phase 4C.3.2.3.
- **Resolution Plan**: Execute batch recompilation script in Phase 4C.3.2.3 once runtime activation-limit enforcement is formally approved.

### Limitation 2: Static IR Shard Limit Field Hydration
- **Status**: Deferred to Phase 4C.3.2.3.
- **Reason**: The current 514 IR shards on disk do not yet contain pre-compiled `limit` AST fields (`ONCE_PER_TURN`, `ONCE_PER_TURN_SAME_NAME`, `ONCE_PER_GAME`, `ONCE_PER_GAME_SAME_NAME`, etc.).
- **Impact**: In runtime play with legacy un-recompiled shards, abilities without `header.limit` fall back to `RESTRICTION_TYPE.NONE` (unrestricted), ensuring zero breaking changes to existing vanilla play. When cards are compiled through `compileCard()` or defined with modern IR schemas, runtime activation limits are enforced unconditionally.
- **Resolution Plan**: Shard re-emission in Phase 4C.3.2.3 will stamp `header.limit` across all canonical shards.

### Limitation 3: Legacy Global Test Suite Baseline (`npm.cmd test`)
- **Status**: Documented workspace condition.
- **Reason**: The repository contains pre-existing test files from Phase 4B (e.g. `tests/phase4b2_1_corrective_audit.test.js`) that reference legacy exports (such as `getBouncePromptTitle`) that were altered or refactored prior to Phase 4C.
- **Verification Integrity**: To guarantee absolute verification integrity, all Phase 4C test suites (`tests/runtime_activation_limits.test.js`, `tests/physical_ability_identity.test.js`, `tests/physical_ability_identity_corrective.test.js`, `tests/physical_ability_identity_final.test.js`, `tests/physical_ability_identity_integrity.test.js`, and `tests/golden_compiler.test.js`) were executed concurrently in a unified test process, yielding 159 passed and 1 blocked out of 160 tests (100% of runnable tests). Furthermore, the production data audit (`tests/data_audit.test.js`) passed 3 of 3 checks.

---

## 3. Strict Boundary Compliance

During Phase 4C.3.2.2:
- ZERO compiler source files or parser regular expressions were modified.
- ZERO IR schemas or card shards were altered or recompiled.
- ZERO card implementation statuses were modified.
- Phase 4C.3.2.3 functionality was NOT commenced.
- Deliverables were created strictly in `reports/phase4c3_2_2/` with zero loose files in `reports/` root.
