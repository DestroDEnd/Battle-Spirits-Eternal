# Battle Spirits Eternal — Combined Work Packages H / I / J Completion Report

**Project:** Battle Spirits Eternal  
**Scope:** Work Packages H (Remaining Operation Semantics & Runtime Execution), I (Compiler/IR Fidelity & Targeted Shard Migration), and J (Full Runtime Integration, Fail-Closed Audits & Final Stabilization)  
**Runtime Environment:** Node.js `v24.16.0` (Windows)  
**Deliverables Directory:** `reports/work_package_hij/`  
- `reports/work_package_hij/work_package_hij_completion_report.md`  
- `reports/work_package_hij/work_package_hij_handoff.zip` (containing root `MANIFEST.txt` with SHA-256 and byte counts)

---

## 1. Executive Summary

Combined Work Packages **H, I, and J** were executed as one continuous implementation and verification pass preserving all accepted baselines from Work Packages C.3, D/E, F/G, F/G.1, and F/G.2 while adhering to `AGENTS.md` architectural rules (no card-name conditionals in engine flow, test-first verification, Eternal Format single source of truth, card identity by canonical card number, Promise-based prompts without rule timers).

All **288 unique operations** observed across the **514 IR shards** (`51,734` total clauses across `36,422` abilities and `15,398` compiled card records / `14,609` unique canonical cards) now have concrete runtime handlers in `engine/ops/index.js` (`HANDLER_MISSING` unique operations reduced from **144 -> 0**, and missing-handler clause instances reduced from **1,007 -> 0**). Operation contracts (`OPERATION_CONTRACTS` in `scripts/evidence_registry.mjs` and runtime `HIJ_REQUIRED_ANY_OF` checks in `engine/ops/index.js`) enforce parameter completeness fail-closed rather than silently succeeding on stub parameters.

Targeted Work Package I compiler enhancements (`compiler/index.js`, `compiler/clause_patterns.js`) and targeted shard migration (`scripts/migrate_hij_shards.mjs`) updated **127 IR shards** (**362 isolated abilities**, **373 clauses**) while leaving all C.3 protected cards (`BS69-036`, `BS64-X04`, `BS20-X01`, `BS42-052`, `BS24-013`, `SD42-011`) untouched and maintaining **0** physical/semantic ID collisions across all **34,855** unique `physicalId`s and **18,477** unique `semanticId`s. Condition parsing and tri-state evaluation enhancements (`engine/conditions.js`) reduced condition `PARSE_FAILURE` instances from **1,204 -> 1,147**.

---

## 2. Authoritative Audit Metrics: F/G.2 Baseline vs. H/I/J Final

| Audit Metric | F/G.2 Baseline | H/I/J Final | Delta |
|---|---:|---:|---:|
| IR Shards (`data/ir_shards/*.json`) | 514 | 514 | 0 |
| Compiled Card Records | 15,398 | 15,398 | 0 |
| Unique Canonical Card Numbers | 14,609 | 14,609 | 0 |
| Total Abilities (`physicalId` / `semanticId` valid) | 36,422 | 36,422 | 0 |
| Unique Physical IDs / Unique Semantic IDs | 34,855 / 18,477 | 34,855 / 18,477 | 0 collisions |
| Total Clauses | 51,734 | 51,734 | 0 |
| Unique Operations in Shards | 288 | 288 | 0 |
| Implemented Unique Operations | 144 | **288** | **+144** |
| Missing-Handler Unique Operations | 144 | **0** | **-144** |
| `HANDLER_MISSING` Clause Instances | 1,007 | **0** | **-1,007** |
| `SEMANTICALLY_VERIFIED` Operation Instances | 18,969 | **19,525** | **+556** |
| `PARAMETERS_INCOMPLETE` Operation Instances | — | **979** | Enforced fail-closed |
| Verified Operation Variants (`variantTotals`) | — | **164** / 349 | +129 registry entries |
| Total Conditions (`clause.condition` + `clause.op.condition`) | 4,940 (4,534 + 406) | 4,940 (4,534 + 406) | Reconciled (`true`) |
| Condition `PARSE_FAILURE` Instances | 1,204 | **1,147** | **-57** |
| Condition `SEMANTICALLY_VERIFIED` Instances | — | **3,696** | Reconciled |
| `node scripts/run_verified_suites.mjs --all` | 677 / 677 | **818 / 818** | **+141 tests** |
| `npm test` (`node tests/run_all.js`) | 2,071 / 2,071 | **2,212 / 2,212** | **+141 tests** |

### Current Ability & Card Status Proposals (`reports/work_package_fg/shard_audit_summary.json`)

- **Abilities (`36,422` total):** `FULLY_SUPPORTED: 7,693` | `PARTIAL: 13,062` | `UNIMPLEMENTED: 0` | `NEEDS_MANUAL_REVIEW: 15,667`
- **Card Status Proposal (`15,398` total):** `VANILLA_NO_EFFECT: 414` | `FULLY_SUPPORTED: 937` | `PARTIAL: 2,919` | `UNIMPLEMENTED: 0` | `NEEDS_MANUAL_REVIEW: 11,128`
- **Condition Evidence Breakdown (`4,940` total):** `SEMANTICALLY_VERIFIED: 3,696` | `PARSED_EVALUABLE_UNVERIFIED: 97` | `PARSE_FAILURE: 1,147` | `PARSED_UNSUPPORTED_TYPE: 0` | `NEEDS_MANUAL_REVIEW: 0`
- **Operation Variant Breakdown (`349` unique parameterized variants):** `verifiedVariants: 164` | `partialVariants: 1` | `unverifiedVariants: 128` | `unsupportedVariants: 55` | `manualReviewVariants: 1`

---

## 3. Work Package H: Operation Inventory, Contracts & Semantics

### 3.1 Complete 514-Shard Operation Classification

`scripts/audit_514_cards_exhaustive.mjs` enumerates all 288 unique operations into `reports/work_package_fg/complete_operation_inventory.json` (total clause occurrences = `51,734`, missing handler operations = `0`):

| Operation Kind (`operationKind`) | Unique Operations |
|---|---:|
| `runtime_action` | 238 |
| `modifier` | 23 |
| `trigger_registration` | 9 |
| `persistent_rule` | 7 |
| `cost_payment` | 6 |
| `compiler_metadata` | 3 |
| `timing_instruction` | 2 |
| **Total** | **288** |

Registry-level unique operation status counts in `complete_operation_inventory.json`: `SEMANTICALLY_VERIFIED: 141`, `PARTIALLY_SUPPORTED: 4`, `HANDLER_PRESENT_UNVERIFIED: 143` (note: unique registry entries require explicit semantic evidence tests per parameterized variant; unverified/bare-stub ops are never auto-promoted).

### 3.2 Contract Schema & Fail-Closed Validation

- `scripts/evidence_registry.mjs`: Added `OPERATION_CONTRACTS` defining `requiredParams`, `requiredAnyOf`, `optionalParams`, `operationKind`, `targeting`, `atomicRollback`, and `events` across implemented operations. Updated `inferOpVariant` so operations missing contract-required parameters resolve to `${op}:bare_stub` (`PARAMETERS_INCOMPLETE`). Added 129 verified entries in `OPERATION_EVIDENCE_REGISTRY` backed by executable H/I/J assertions while intentionally keeping `MODIFY_LIFE` unregistered so `C1-AUD-01` and `WPC3-05` manual-review invariants remain enforced.
- `engine/ops/index.js`: Added `HIJ_REQUIRED_ANY_OF` runtime pre-execution contract validation returning fail-closed `{ status: 'UNSUPPORTED', reason: 'MISSING_IR_PARAMETERS' }` when required parameters are omitted (verified adversarially by `HIJ-ADV-01`). Fixed `DefaultPromptResolver` constructor normalization, `under` / `underCards` synchronization, `DISCARD_HAND_MAX` array-aliasing infinite loop, `SEND_CORES_TO_VOID` `stackId` / count clamping, `LIFE_OR_CORE_MODIFICATION` / `REDIRECT_CORE_DESTINATION` `'grave' -> 'trash'` and `'opp' -> oppSide` zone normalization, `RETRIEVE_CORES` `p.trash.normal`, `DESTROY_ON_BP_ZERO` `sourceSide`, and `LIMIT_DECK_DISCARD` enforcement inside `MILL_DECK` / `MILL`.

### 3.3 Priority H2 Operation Families (77 Listed Operations)

All 77 operations itemized in Work Package H2 Groups A–G exist in the 514 IR shards and now have concrete handlers in `engine/ops/index.js`:

- **Group A — Effect Activation & Triggers (`10` ops):** `ACTIVATE_EFFECT_ACTION` (59), `TRIGGERED_WATCHER` (29), `ACTIVATE_EFFECT_SPECIAL` (24), `ACTIVATE_TRIGGER` (18), `TRIGGER_CONDITION` (17), `BRAVE_EFFECT_ACTIVATION` (15), `TRIGGER_COUNTER` (13), `CROSS_TRIGGER` (10), `ON_BP_DESTROY` (7), `ACTIVATE_KEYWORD` (3) — all 10 `SEMANTICALLY_VERIFIED`.
- **Group B — Advent, Stack & Underneath Systems (`13` ops):** `ADVENT_RULE_MODIFIER` (28), `PUT_UNDERNEATH` (24), `ATTACH_CARD_UNDERNEATH` (19), `ADVENT_RULE` (16), `ADVENT_COST` (14), `DISCARD_UNDERNEATH_COST` (12), `STACK_CARD` (10), `SWAP_CARD` (10), `ATTACH_PRE_ADVENT_CARD` (9), `CARD_UNDERNEATH` (8), `SWAP_CARDS` (5) are `SEMANTICALLY_VERIFIED`; `CONTRACT_ADVENT_RULE` (42) and `ADVENT` (24) have runtime handlers implemented while shard instances remain `:bare_stub` (`HANDLER_PRESENT_UNVERIFIED` / `PARAMETERS_INCOMPLETE` in audit).
- **Group C — Mirage Systems (`2` ops):** `MIRAGE_OPERATION` (30), `DISCARD_MIRAGE_COST` (18) — both `SEMANTICALLY_VERIFIED` including Mirage registration, discard cost payment, return-to-hand, and stale modifier cleanup.
- **Group D — Effect Copying & Redirection (`8` ops):** `COPY_EFFECT` (29), `MODIFY_DESTINATION` (21), `REDIRECT_TARGET` (21), `REDIRECT_CORE_DESTINATION` (14), `LIFE_OR_CORE_MODIFICATION` (10), `COPY_PRE_ADVENT_EFFECT` (7), `COPY_ABILITY` (4), `MULTIPLY_EFFECT` (3) — all 8 `SEMANTICALLY_VERIFIED` with IR immutability and recursion bounds.
- **Group E — Hand, Deck, Reveal, Discard & Zone Operations (`16` ops):** `LOOK_HAND` (21), `DISCARD_ZONE` (18), `DISCARD_AMONG` (9), `REVEAL_HAND` (8), `USE_FROM_HAND` (7), `DISCARD_FIELD_MAGIC` (7), `DISCARD_FIELD` (6), `PUT_CARD_ON_FIELD` (6), `PUT_FACEDOWN_FIELD` (6), `CAST_FROM_TRASH` (6), `MILL` (6), `LOOK_AT_DECK` (4), `REVEAL_INTERACTION` (4), `SEND_TO_TRASH` (4), `SHUFFLE_DECK` (4), `LIMIT_DECK_DISCARD` (3) — all 16 `SEMANTICALLY_VERIFIED`.
- **Group F — Combat & Battle Operations (`8` ops):** `PIERCING_RULE` (23), `CHOOSE_BLOCKER` (17), `RESTRICT_MAIN_STEP` (11), `FORCE_ATTACK` (9), `BATTLE_RULE_MODIFIER` (8), `FLASH_PRIORITY` (6), `BATTLE_MODIFIER` (3), `DESTROY_ON_BP_ZERO` (3) — all 8 `SEMANTICALLY_VERIFIED` with continuous/combat engine hooks.
- **Group G — Other High-Impact Operations (`20` ops):** `GLOBAL_RESTRICTION` (13), `LOSE_EFFECTS` (9), `TARGET_FAMILY` (8), `ACTIVATE_REBIRTH` (7), `DECK_CONSTRUCTION_RULE` (6), `ENTER_SOUL_STATE` (6), `RETRIEVE_CORES` (5), `DECK_IMMUNITY` (5), `SYMBOL_MODIFIER` (4), `COUNT_MODIFIER` (4), `USE_FROM_SOUL_STATE` (3), `BP_FORMULA` (3), `END_STEP` (3), `ADD_FAMILY` (3), `SPECIAL_WIN` (3) are `SEMANTICALLY_VERIFIED`; `DECK_BUILDING_RULE` (24), `GAIN_TEAM` (12), `BUNSHIN_SUMMON` (11), `TEAM_RULE` (8), and `ACTIVATE_SOUL_DRIVE` (4) have runtime handlers exercised in unit/real-card tests while shard instances currently remain `:bare_stub` (`PARAMETERS_INCOMPLETE`).

---

## 4. Work Package I: Compiler/IR Fidelity, Conditions & Targeted Shard Migration

- **Compiler Traceability (`compiler/index.js`):** Preserved non-destructive source traceability (`originalEffectText`, `originalAbilityText`, `abilityIndex`, `clauseIndex`, `originalClauseText`) without mutating canonical `physicalId` or `semanticId` hashes.
- **Structured Parameter Extraction (`compiler/clause_patterns.js`):** Added `enrichHijClauseOp` at `compileClauseToOp` exit to populate structured H/I/J operation parameters cleanly without injecting spurious `.condition` fields (`clause.op.condition` remains strictly reconciled at `406`).
- **Tri-State Condition Expansion (`engine/conditions.js`):** Added structured parsing and deterministic tri-state evaluation for banished `[Soul Core]`, `'If not'` / `'If you don\'t'` negation chains, relative attacking-target cost comparisons, `'brought to 0 BP'`, `'If it was in battle'`, matching Spirit LVs, `'5 or more symbol colors'` (`distinctColors`), `'no EX Symbols in Trash'`, hand-size comparisons (`N or more/fewer`), Brave family braved checks, turn destruction history, used-from-Trash, and attack-eligibility conditions—preserving `'If you banish the [Soul Core] on this Ultimate from the game'` as `UNSUPPORTED_CONDITION` for `phase2a`/`phase4a` parity.
- **Targeted Shard Migration (`scripts/migrate_hij_shards.mjs` & `data/per_shard_validation_inventory.json`):** Updated **127 IR shards** (**362 abilities**, **373 clauses**) recorded with before/after SHA-256 checksums and byte counts in `reports/work_package_fg/shard_migration_diff_hij.json`. Protected C.3/phase4b3 cards (`BS69-036`, `BS64-X04`, `BS20-X01`, `BS42-052`, `BS24-013`, `SD42-011`) were explicitly excluded and remain unchanged.

---

## 5. Work Package J: Runtime Engine Integration, Audit Hardening & Verification

### 5.1 Engine Module Integrations

- `engine/continuous.js`: Integrated `BP_FORMULA` (`computeEffectiveBP`), `ADD_FAMILY`/`GRANT_TEAM`/`GAIN_TEAM`/`TEAM_RULE` (`computeFamilies`), `TREAT_NAME`/`TREAT_COST` and effective families (`matchesTargetFilter`), hand/counter counts in cache fingerprint, `LOSE_IMMUNITY` and `PIERCING_RULE` bypass in both `isImmune` and `isTargetProtectedFrom`, and `CANNOT_GAIN_CORES_FROM_VOID`/`RESTRICT_MAIN_STEP` in `matchesRestrictionAction`.
- `engine/payment.js`: Applied `SYMBOL_MODIFIER` reduction symbols to Magic card costs inside `calculateEffectiveCost`.
- `engine/rules/eternal.js`: Honored `card.deckRule?.maxCopies` (`'UNLIMITED'` or numeric copy limit) in `validateDeck`.
- `engine/zones.js`: Fixed `commitStackExit` top-card typing (`topCard.type`), normalized `'banished' -> 'removed'`, wired `PIERCING_RULE` bypass in `moveCard`, supported `DEPLETED_CARD`/`DESTROYED_OR_DEPLETED`/`MODIFY_DESTINATION`, and enforced `CANNOT_GAIN_CORES_FROM_VOID`, `CORE_LOCK`/`CONTROL_RULE`, and `REDIRECT_CORE_DESTINATION`/`SEND_CORE_TO_VOID` in `moveCore`.
- `engine/resolver.js`: Gated non-passive resolution against active `LOSE_EFFECTS` / `TREAT_AS_VANILLA` modifiers inside `resolveAbility`.
- `engine/index.js`: Enforced `RESTRICT_MAIN_STEP` in `playCard` / `activateAbility`, `FLASH_PRIORITY` in `declareAttack`, and `BATTLE_RULE_MODIFIER` (`NO_BP_DESTRUCTION`, `INVERT_BP_COMPARISON`, `USE_LV1_BP`) + `EXCHANGE_BP`/`SWITCH_BP` in `declareBlock`.
- `engine/selectors.js`: Preserved `stackId` in `executeTargeting` and filtered field stacks by `stackId` in `queryCandidates`.

### 5.2 Audit & Evidence Fail-Closed Hardening

- `scripts/audit_514_cards_exhaustive.mjs`: Fixed module-level audit initialization (`null -> loadExecutionEvidence()`), preserved `executionMap === null ? loadExecutionEvidence() : executionMap` in registry builders, expanded `PARAM_REQUIRED_OPS` from `OPERATION_CONTRACTS`, and generated `reports/work_package_fg/complete_operation_inventory.json`.
- `scripts/discover_executable_tests.mjs`: Enforced fail-closed `MISSING_OR_EMPTY_EXECUTION_MAP` when `executionMap` is `null` or empty in `verifyExecutableTestReference`.

### 5.3 Test Suites Added (`scripts/run_verified_suites.mjs`)

- `tests/work_package_hij_operations_compiler_integration.test.js` (**9/9** passing tests: `HIJ-OPA-01`, `HIJ-OPB-01`, `HIJ-OPC-01`, `HIJ-OPD-01`, `HIJ-OPE-01`, `HIJ-OPF-01`, `HIJ-OPG-01`, `HIJ-COMP-01`, `HIJ-ADV-01`).
- `tests/work_package_hij_real_cards_e2e.test.js` (**132/132** static real-card end-to-end execution tests loaded from `data/ir_shards/`, `HIJ-REAL-001` through `HIJ-REAL-132`).
- Registered both suites in `DATA_DEPENDENT_SUITES` (now **13** data-dependent suites alongside **21** self-contained suites in `scripts/run_verified_suites.mjs`).

---

## 6. Remaining Unresolved Scope (Fail-Closed Accounting)

Per project rules, unsupported or unverified variants remain explicitly classified rather than hidden or promoted:

1. **Manual-Review Ability & Card Queue:** `15,667` abilities (`11,128` cards) remain `NEEDS_MANUAL_REVIEW` across:
   - `Missing semantic test evidence`: `10,067`
   - `Unverified trigger timing`: `2,642`
   - `Unverified target semantics`: `2,039`
   - `Missing or contradictory IR parameters`: `734`
   - `Unsupported operation variant`: `115`
   - `Unsupported condition form`: `69`
   - `Unresolved replacement interaction`: `1`
2. **Incomplete Shard Parameters (`979` instances):** Parameterless shard clauses checked against `OPERATION_CONTRACTS` stay `PARAMETERS_INCOMPLETE` (`:bare_stub`), including shard occurrences of `CONTRACT_ADVENT_RULE:bare_stub` (`42`), `ADVENT:bare_stub` (`24`), `DECK_BUILDING_RULE:bare_stub` (`24`), `GAIN_TEAM:bare_stub` (`12`), `BUNSHIN_SUMMON:bare_stub` (`11`), `TEAM_RULE:bare_stub` (`8`), and `ACTIVATE_SOUL_DRIVE:bare_stub` (`4`) until dedicated compiler parameter extraction and variant evidence are added for those shard patterns.
3. **Unparsed Conditions (`1,147` instances):** `1,147` / `4,940` condition instances remain `PARSE_FAILURE` and evaluate fail-closed to `'UNKNOWN'` at runtime.
4. **`MODIFY_LIFE`:** Intentionally excluded from `OPERATION_EVIDENCE_REGISTRY` (`NEEDS_MANUAL_REVIEW` invariant required by `C1-AUD-01` and `WPC3-05`).

---

## 7. Verification Summary & Reproduction Commands

All checks ran cleanly on `Node v24.16.0` after final code, shard, and registry updates with **0 failures, 0 cancellations, and 0 skips**:

```powershell
node -v
# v24.16.0

node scripts/validate_514_shards_exhaustive.mjs
# PASS | Shards: 514/514 | Cards: 15,398 (14,609 unique) | Abilities: 36,422
# Unique Physical IDs: 34,855 | Unique Semantic IDs: 18,477 | Collisions: 0

node scripts/audit_514_cards_exhaustive.mjs
# Unique ops: 288 | Implemented: 288 | Missing handlers: 0
# Conditions: 4,940 reconciled (3,696 SEMANTICALLY_VERIFIED, 97 unverified, 1,147 PARSE_FAILURE)

node --test tests/data_audit.test.js
# tests 3 | pass 3 | fail 0 | skipped 0

node scripts/run_verified_suites.mjs --all
# tests 818 | pass 818 | fail 0 | skipped 0 (logged in reports/work_package_fg/verified_suites_all.log)

npm test
# node tests/run_all.js -> tests 2,212 | suites 335 | pass 2,212 | fail 0 | skipped 0
# (logged in reports/work_package_fg/final_run_all.log)
```
