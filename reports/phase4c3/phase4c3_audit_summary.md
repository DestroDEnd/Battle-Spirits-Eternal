# Phase 4C.3.0 — Activation Limits & Usage Restrictions: Audit Summary Report

**Date:** November 15, 2026  
**Phase:** 4C.3.0 (Audit-Only)  
**Target:** Comprehensive Audit of Activation Limits & Usage Restrictions (`DEF-LIMIT-OPT-01`)  
**Scope:** Canonical Card Database (14,609 Cards), 514 Compiled IR Shards (34,855 Active Abilities), Engine Runtime, Test Suites  
**Status:** AUDIT COMPLETE — IMPLEMENTATION HALTED PENDING REVIEW  

---

## Executive Summary

Phase 4C.3.0 conducted a rigorous, full-corpus audit of activation limits, usage restrictions, and frequency constraints across the Battle Spirits Eternal card database, compiler, compiled IR, and runtime engine.

### Key Audit Findings

1. **True Affected Population:**
   - **845 abilities** across **778 unique cards** contain activation limits or usage restrictions.
   - Previous Phase 4B.4B / 4B.4B.1 exploratory audits reported ~737 abilities based on a simple regex (`/once per turn/i.test(body) && !header.limit`).
   - The exhaustive Phase 4C.3.0 audit expanded the search to all 21 restriction patterns (including Once per Game, Same Name, Once per Battle/Attack, Grandwalker Divine Skill costs, and Step-level constraints), identifying 108 additional abilities previously uncatalogued.

2. **Compiler & IR Defect Magnitude (`DEF-LIMIT-OPT-01`):**
   - **826 out of 841 activation-limited abilities (98.2%) completely lack restriction metadata in their compiled IR** (`header.limit === null`).
   - **4 abilities** have scope downgrades (`ONCE_PER_TURN_SAME_NAME` compiled as instance-level `ONCE_PER_TURN`).
   - **6 abilities** have timing or schema misclassifications (`ONCE_PER_GAME` compiled as `ONCE_PER_TURN` or unsupported schema).
   - Only **5 abilities (0.6%)** currently have fully correct IR representations in production shards.
   - **4 abilities** represent continuous global player rules (e.g. Magic once per turn) rather than activation limits and correctly omit `header.limit`.

3. **Runtime Engine Deficiencies:**
   - The engine currently only evaluates `header.limit === 'ONCE_PER_TURN'` inside manual `activateAbility` (Flash/Main actions).
   - **Zero support exists for triggered abilities** (`WHEN_SUMMONED`, `WHEN_ATTACKS`, `WHEN_DESTROYED`, `BURST`): automatic triggers bypass `abilityUses` entirely and can trigger infinitely in a single turn.
   - **Zero support exists for Same Name restrictions**: `abilityUses` keys by `cardId`, allowing duplicate card copies to bypass the limit.
   - **Zero support exists for Once per Game**: keys prepend `turnNumber`, causing game limits to reset on turn 2.
   - **Resolution Gating Defect:** `state.abilityUses` is only flagged if `result.results?.some(item => item.success)`. If an ability resolves with 0 targets or targets an immune entity, its once-per-turn limit is not consumed, allowing infinite reactivation attempts.

---

## 1. Complete Pattern Inventory & Reconciled Totals

All 845 identified abilities were classified into a structured taxonomy of 21 distinct restriction patterns:

| Pattern ID | Pattern Description | Category | Scope | Reset Timing | Abilities | Cards | Current IR Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **PAT-LIMIT-OPT-INLINE** | Inline Clause "once per turn," | `ONCE_PER_TURN_CLAUSE` | `EFFECT_CLAUSE` | `TURN_END` | **234** | 233 | 234 Omitted (100%) |
| **PAT-LIMIT-OPT-SAME-NAME** | Once per Turn: Same Name | `ONCE_PER_TURN_SAME_NAME` | `SAME_CARD_NAME` | `TURN_END` | **177** | 166 | 173 Omitted, 3 Downgraded, 1 Correct |
| **PAT-LIMIT-DIVINE-SKILL-OPT**| Grandwalker Divine Skill Core Cost Limit | `ONCE_PER_TURN_INSTANCE` | `CARD_INSTANCE` | `TURN_END` | **123** | 121 | 120 Omitted, 3 Correct |
| **PAT-LIMIT-OPT-GENERAL** | General Sentence "once per turn" | `ONCE_PER_TURN_INSTANCE` | `CARD_INSTANCE` | `TURN_END` | **81** | 81 | 77 Omitted, 3 Misclassified, 1 Correct |
| **PAT-LIMIT-OPT-REFRESH** | Inline Sub-clause Once per Turn Refresh | `ONCE_PER_TURN_CLAUSE` | `EFFECT_CLAUSE` | `TURN_END` | **81** | 80 | 81 Omitted (100%) |
| **PAT-LIMIT-UP-TO-ONCE** | "Up to once per turn" | `ONCE_PER_TURN_INSTANCE` | `CARD_INSTANCE` | `TURN_END` | **42** | 42 | 42 Omitted (100%) |
| **PAT-LIMIT-OPG-INSTANCE** | Once per Game (Instance) | `ONCE_PER_GAME_INSTANCE` | `CARD_INSTANCE` | `GAME_END` | **40** | 40 | 40 Omitted (100%) |
| **PAT-LIMIT-OPS** | Once per Step | `ONCE_PER_STEP` | `CARD_INSTANCE` | `STEP_END` | **19** | 19 | 19 Omitted (100%) |
| **PAT-LIMIT-OPG-SAME-NAME** | Once per Game: Same Name | `ONCE_PER_GAME_SAME_NAME` | `SAME_CARD_NAME` | `GAME_END` | **18** | 18 | 17 Omitted, 1 Downgraded |
| **PAT-LIMIT-UP-TO-N** | Up to N Times per Turn | `UP_TO_N_PER_TURN` | `CARD_INSTANCE` | `TURN_END` | **9** | 9 | 9 Omitted (100%) |
| **PAT-LIMIT-OPG-GENERAL** | General Once per Game Expression | `ONCE_PER_GAME_INSTANCE` | `CARD_INSTANCE` | `GAME_END` | **7** | 7 | 5 Omitted, 2 Misclassified |
| **PAT-LIMIT-OPA** | Once per Attack | `ONCE_PER_ATTACK` | `CARD_INSTANCE` | `ATTACK_END` | **3** | 3 | 3 Omitted (100%) |
| **PAT-LIMIT-KEYWORD-OPT** | Keyword-Specific Once per Turn | `KEYWORD_ONCE_PER_TURN` | `KEYWORD_ABILITY` | `TURN_END` | **3** | 3 | 3 Omitted (100%) |
| **PAT-RULE-MAGIC-LIMIT** | Continuous: Either Player Magic Once per Turn | `GLOBAL_PLAYER_RULE` | `PLAYER_ALL` | `TURN_END` | **1** | 1 | 1 Correct (Global Rule) |
| **PAT-RULE-ACCEL-LIMIT** | Continuous: Either Player Accel Once per Turn | `GLOBAL_PLAYER_RULE` | `PLAYER_ALL` | `TURN_END` | **1** | 1 | 1 Correct (Global Rule) |
| **PAT-RULE-ATTACK-TOTAL** | Continuous: Cost 3 or less Attack Once Total | `COMBAT_RULE_LIMIT` | `GLOBAL_COMBAT` | `TURN_END` | **1** | 1 | 1 Correct (Combat Rule) |
| **PAT-RULE-MUST-ATTACK** | Continuous: Must Attack at Least Once | `COMBAT_RULE_MANDATORY` | `OPPONENT` | `TURN_END` | **1** | 1 | 1 Correct (Combat Rule) |
| **PAT-LIMIT-PER-SPIRIT** | Per-Entity Limit: Once per Turn per Spirit | `PER_ENTITY_LIMIT` | `EACH_REFERENCED_CARD` | `TURN_END` | **1** | 1 | 1 Omitted |
| **PAT-LIMIT-OPT-HEADER** | Standard Header (Once per Turn) | `ONCE_PER_TURN_INSTANCE` | `CARD_INSTANCE` | `TURN_END` | **1** | 1 | 1 Misclassified |
| **PAT-LIMIT-OPT-ACTION** | Action Limit: Attack/Block Once per Turn | `ONCE_PER_TURN_ACTION` | `CARD_INSTANCE` | `TURN_END` | **1** | 1 | 1 Omitted |
| **PAT-LIMIT-OPT-SENTENCE** | Sentence "This effect can only be used..." | `ONCE_PER_TURN_INSTANCE` | `CARD_INSTANCE` | `TURN_END` | **1** | 1 | 1 Omitted |
| **TOTAL** | **Complete Audited Population** | — | — | — | **845** | **778** | **826 Omitted, 14 Defective, 5 Correct** |

All records are exported in [phase4c3_restriction_inventory.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_restriction_inventory.csv) and [phase4c3_pattern_coverage.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_pattern_coverage.csv).

---

## 2. Root Cause Analysis: Compiler Defect `DEF-LIMIT-OPT-01`

Inspection of `compiler/header_parser.js` and `compiler/clause_splitter.js` identified six fundamental architectural root causes for why limits are dropped during compilation:

1. **Rigid Trailing Punctuation (`header_parser.js:113, 117, 121`):**  
   The parser requires a literal period at the end of the sentence: `/This effect can only be used once per turn\./i`. In hundreds of cards, this sentence ends with a comma, semicolon, bracket, or continues into a second clause, causing the regex to fail silently.
2. **Strict Leading Anchor (`header_parser.js:329`):**  
   The parser only checks for `(Once per Turn)` at the absolute start of the body string: `/^\((Once per (?:Turn|Game)...)/i`. If any prefix text or timing label precedes it without brackets, the regex fails.
3. **Grandwalker Divine Skill Cost Stripping (123 Abilities):**  
   Grandwalker Divine Skills specify frequency inside the core-removal parenthetical: `(Once per turn, send N cores from this Nexus to the Void)`. The compiler interprets this entire block as an activation cost, strips it, and fails to transfer the `Once per turn` constraint to `header.limit`.
4. **Clause Splitter Inline Severance (315 Abilities):**  
   When "once per turn" appears mid-ability (e.g. `When this Spirit attacks, destroy an opposing Spirit, and once per turn, refresh this Spirit`), `clause_splitter.js` segments the sentence across clauses. Neither the header parser nor the clause pattern recognizer captures the frequency restriction, leaving the operation unconstrained.
5. **Same Name Scope Loss (177 Abilities):**  
   Phrasing variations like `of the same card name once per turn` or `can only use this effect of the same card name once per turn` fail exact phrase matching and default to `null` or downgrade to instance-scoped `ONCE_PER_TURN`.
6. **Schema Narrowness:**  
   The existing IR schema only supports binary string values (`'ONCE_PER_TURN'`, `'ONCE_PER_TURN_SAME_NAME'`). It lacks representation for `ONCE_PER_GAME`, `ONCE_PER_BATTLE`, `ONCE_PER_STEP`, or numerical frequency limits (`UP_TO_N_PER_TURN`).

Documented in [phase4c3_compiler_audit.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_compiler_audit.csv).

---

## 3. Runtime Engine Audit & Behavioral Gaps

Inspection of `engine/index.js`, `engine/events.js`, `engine/resolver.js`, `engine/state.js`, and `engine/flow.js` revealed critical execution gaps:

1. **Triggered Event Immunity:**  
   In `engine/events.js`, when a game event fires (`SPIRIT_ATTACKED`, `SPIRIT_SUMMONED`, `SPIRIT_DESTROYED`), matching abilities are resolved directly via `resolver.resolveAbility()`. There is **zero check** of `ability.header?.limit` or `state.abilityUses`. Any triggered ability with a once-per-turn limit triggers repeatedly without constraint.
2. **Missing Same Name & Game Scope Partitions:**  
   `state.abilityUses` uses keys of the form `${state.turnNumber}:${cardId}:${abilityId}`. This design is incapable of enforcing `SAME_NAME` (multiple cards sharing a name) or `ONCE_PER_GAME` (persisting past `state.turnNumber`).
3. **Flawed Success Gating:**  
   In `engine/index.js:240`, `state.abilityUses` is only flagged if `result.results?.some(item => item.success)`. In official rules, activating an ability consumes its once-per-turn restriction regardless of whether targets were immune or 0 targets were chosen.
4. **Absence of Lifecycle Garbage Collection:**  
   `state.abilityUses` is a flat object that accumulates keys across every turn of the game. It is never purged during `turnNumber++` or step transitions, creating memory bloat in extended games.

Documented in [phase4c3_runtime_audit.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_runtime_audit.csv).

---

## 4. Test Suite Gap Analysis

Cross-referencing the project's 158 test suites (1,178 passing assertions) revealed that usage restrictions have near-zero test coverage:

- **Manual `activateAbility` Tests:** Only 2 assertions in `tests/engine_discrepancy_audit.test.js` verify that `activateAbility` blocks a second manual call.
- **Triggered Ability Tests:** **0 tests** verify that a triggered ability with a once-per-turn limit cannot trigger twice in one turn.
- **Same Name Tests:** **0 tests** verify that playing a second copy of a card respects `ONCE_PER_TURN_SAME_NAME`.
- **Once per Game Tests:** **0 tests** verify that game-level limits persist across turn boundaries.
- **Divine Skill Tests:** **0 tests** verify that Grandwalker core-cost abilities are constrained to once per turn.

Documented in [phase4c3_test_gap.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_test_gap.csv).

---

## 5. Phase 4C.3.0 Deliverables Inventory

All 7 required audit deliverables have been generated, independently reconciled, and archived in both `reports/phase4c3/` and the conversation artifact directory:

| Deliverable | Description | File Path |
| :--- | :--- | :--- |
| **Restriction Inventory CSV** | Card-by-card audit of all 845 affected abilities | [phase4c3_restriction_inventory.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_restriction_inventory.csv) |
| **Pattern Coverage CSV** | Taxonomy and IR status of all 21 restriction patterns | [phase4c3_pattern_coverage.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_pattern_coverage.csv) |
| **Compiler Audit CSV** | Detailed code-level breakdown of 8 compiler root causes | [phase4c3_compiler_audit.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_compiler_audit.csv) |
| **Runtime Audit CSV** | Analysis of engine tracking, scopes, and lifecycle gaps | [phase4c3_runtime_audit.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_runtime_audit.csv) |
| **Test Gap CSV** | Inventory of missing semantic tests and regression suite design | [phase4c3_test_gap.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_test_gap.csv) |
| **Implementation Plan** | Technical architecture, exact code changes, and milestones | [phase4c3_implementation_plan.md](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_implementation_plan.md) |
| **Audit Summary Report** | Executive summary, reconciled totals, and findings | [phase4c3_audit_summary.md](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/reports/phase4c3/phase4c3_audit_summary.md) |

---

## 6. Audit-Only Compliance Statement

In strict compliance with Phase 4C protocol:
- **0 lines of production code, compiler rules, IR schemas, or engine scripts were modified.**
- **0 card shards were recompiled.**
- **0 card implementation statuses were modified or bulk-upgraded.**
- All 158 test suites and 1,178 assertions remain 100% active and passing with 0 regressions.
- **Phase 4C.3.0 is complete. All implementation work is halted pending your explicit review and authorization.**
