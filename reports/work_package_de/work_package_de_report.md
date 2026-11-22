# Battle Spirits Eternal — Major Work Package D/E Completion Report
**Core Operations, Summoning, Card Movement, Burst & Replacement Effects**

**Operating System**: Windows  
**Runtime**: Node.js `v24.16.0` (zero external npm dependencies; pure ESM per `package.json`)  
**Completion Timestamp**: 2026-11-18T20:08:19+05:30  

---

## 1. Architecture Audit & Dependency Graph

The Battle Spirits Eternal rules engine separates state representation (`engine/state.js`), zone & core conservation (`engine/zones.js`), continuous modifiers (`engine/continuous.js`), cost & symbol calculation (`engine/payment.js`), unified targeting (`engine/selectors.js`), tri-state condition evaluation (`engine/conditions.js`), turn/step lifecycle (`engine/flow.js`), async event dispatch (`engine/events.js`), ability resolution (`engine/resolver.js`), and IR operation execution (`engine/ops/index.js`).

```
  [IR Shards / Compiler] --> [AsyncResolver (engine/resolver.js)]
                                  |
         +------------------------+------------------------+
         |                        |                        |
         v                        v                        v
  [Conditions]            [Selectors / Targets]    [Ops (engine/ops/index.js)]
  (conditions.js)         (selectors.js)                   |
         |                        |          +-------------+-------------+
         |                        v          v             v             v
         +----------------> [Continuous]  [Payment]     [Zones]       [Flow]
                            (continuous)  (payment)     (zones.js)    (flow.js)
                                             |             |             |
                                             +------+------+-------------+
                                                    v
                                             [EventBus (events.js)]
```

---

## 2. Implementation Inventory

| Group | Operations | Status | Key Invariants & Shared Infrastructure |
|---|---|---|---|
| D1 Destruction | `DESTROY` | Implemented & Verified | Unified `resolveTargets`, simultaneous `DESTROYED_BATCH`, Armor/`ignoreArmor`, `PROTECTION`/`IMMUNITY` |
| D2 Bounce/Return | `BOUNCE`, `RETURN_*` | Implemented & Verified | `hand`, `deck_top` (reverse order), `deck_bottom`, `grave`, fail-closed ambiguous `deck` |
| D3 State Changes | `EXHAUST`, `REFRESH`, `RESTORE`, `CANNOT_REFRESH` | Implemented & Verified | Unified `resolveTargets`, `CANNOT_EXHAUST`/`CANNOT_REFRESH` locks, `HEAVY_EXHAUSTED -> EXHAUSTED`, `FlowController` sync |
| D4 Draw/Hand | `DRAW`, `DISCARD_HAND`, `DISCARD`, `SALVAGE` | Implemented & Verified | `DRAW_LOCK`/`maxDraw` cap, deck exhaustion, invalid selection rejection, card conservation |
| D5 Movement/Life | `MOVE_CORE`, `MOVE_CARD`, `RECOVER_LIFE` | Implemented & Verified | `hand/decktop/grave -> removed/underneath`, Void/Soul Core conservation |
| E1 Normal Summon | `SUMMON`, `SUMMON_THIS_CARD`, `SUMMON_RESERVE_ONLY` | Implemented & Verified | Symbol reductions, `initialCores` pre-validation, atomic rollback, `transactionOutcome` |
| E2 Free Summon | `SUMMON_FREE` | Implemented & Verified | `HAND`/`GRAVE`/`BURST` origins, duplicate/field checks, active burst self-summon |
| E3 Salvage/Resurrect | `SALVAGE`, `RESURRECT` | Implemented & Verified | Distinct trash-to-hand vs trash-to-field with reserve core deduction |
| E4 Advent/Stack | `ADVENT_STACK` | Implemented & Verified | Stack attachment preserving cores & `under` cards |
| E5 Reveal/Burst | `REVEAL_CARDS`, `ACTIVATE_BURST` | Implemented & Verified | Fail-closed bare `REVEAL_CARDS`, `BURST_LOCK`, `CONFIRM_OPTIONAL`, self-summon & grave routing |
| Part 4 Replacement | `REPLACEMENT_EFFECT` | Implemented & Verified | Fail-closed `MISSING_REPLACEMENT_SPEC`, `LIFE_CORE`, `CORE_ADDITION`, `NEXUS_DESTRUCTION`, `DESTROYED_SPIRIT_CORES` |

---

## 3. Production Source Files Modified

1. **[engine/ops/index.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/ops/index.js)**:
   - Added explicit `transactionOutcome` (`COMMITTED`, `ROLLED_BACK`, `REJECTED`, `FAILED`, `UNSUPPORTED`) on `executeSummonTransaction()`, `DRAW`, and `REPLACEMENT_EFFECT`.
   - Upgraded `DRAW` to enforce `DRAW_LOCK` / `SET_RESTRICTION('CANNOT_DRAW')` and `CARD_RULE_MODIFIER.maxDraw`.
   - Upgraded `EXHAUST` to use `resolveTargets` (preserving string targets like `'PREVIOUS_TARGET'`), enforce `CANNOT_EXHAUST`, prevent false no-op success, and emit `EXHAUSTED`.
   - Upgraded `REFRESH` and added `RESTORE` to enforce `CANNOT_REFRESH` / `cannotRefreshNextStep` / `spellbound`, use `resolveTargets`, and emit `CARD_REFRESHED`.
   - Upgraded `RESURRECT` to deduct LV1 core from `reserve` via `executeSummonTransaction` (eliminating core invention).
   - Added `MOVE_CARD` (`hand`/`decktop`/`grave`/`removed` -> `removed`/`grave`/`hand`/`deck_top`/`deck_bottom`/`underneath`).
   - Enforced strict structured `REPLACEMENT_EFFECT` check (`!op.replaces && !op.replacementZone` -> `UNSUPPORTED` / `MISSING_REPLACEMENT_SPEC`, no `rawText` guessing) and added `continuous: true`.
2. **[engine/zones.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/zones.js)**:
   - Updated `moveCard` replacement filter to honor `replaces === 'NEXUS_DESTRUCTION'` for Nexus cards.
3. **[engine/flow.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/flow.js)**:
   - Updated `REFRESH` step to check `this.state.modifiers` for `CANNOT_REFRESH` and `SET_RESTRICTION('CANNOT_REFRESH')`.
4. **[scripts/discover_executable_tests.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/discover_executable_tests.mjs)** & **[scripts/evidence_registry.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/evidence_registry.mjs)**:
   - Part 9 safeguards: exact registered test name matching (no prefix matching), file+name execution map keys (`${normFile}::${found.name}`), call-site `(` token verification distinguishing declarations from invocations, and rejection of empty/missing `executionMap`.
5. **[scripts/audit_514_cards_exhaustive.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/audit_514_cards_exhaustive.mjs)**:
   - Updated `OUT_DIR` and `loadExecutionEvidence()` to `reports/work_package_de/`.
6. **[tests/phase4b3_reveal_burst_replace_summon.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/phase4b3_reveal_burst_replace_summon.test.js)** & **[tests/work_package_de_operations_and_cards.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/work_package_de_operations_and_cards.test.js)**:
   - Migrated the 13 legacy/obsolete fixtures in `phase4b3_reveal_burst_replace_summon.test.js` (`108 / 108` passing) while preserving their exact invariants, and added `work_package_de_operations_and_cards.test.js` (`9 / 9` tests including `WPDE-REAL-CORPUS` covering 20 real shard cards).

---

## 4. Compiler & IR Shard Changes

- **Compiler Changes**: None in Work Package D/E (preserved Work Package C.2/C.3 compiler fixes).
- **IR Shard Changes**: None in Work Package D/E (all 514 shards preserved from C.3/C.3.1).

---

## 5. Real-Card Test Results & Consolidated Debugging

- **`tests/real_card_semantic_validation.test.js`**: `42` real-card cases passing.
- **`tests/work_package_de_operations_and_cards.test.js` (`WPDE-REAL-CORPUS`)**: `20` real shard cards (`P16-02`, `18-1`, `26RBS01-057`, `26RBS02-061`, `26RBS02-070`, `PX25-03`, `BSCO-005`, `26RBS01-031`, `BS69-036`, `BS64-X04`, `BS20-X01`, `BS42-052`, `BS24-013`, `BS60-034`, `SD42-011`, `BS19-109`, `CP14-X14R`, `P14-24`, `26RBS02-X08`, `26RSD05-012`) passing (`62+` total real-card end-to-end validations).
- **Consolidated Debugging Findings Fixed**:
  1. `EXHAUST` previously bypassed `resolveTargets` and dropped `'PREVIOUS_TARGET'` string targets (`TC-ACT-FIX-10` regression caught and fixed).
  2. `REPLACEMENT_EFFECT` previously allowed `rawText` fallback when `replaces` and `replacementZone` were absent (`SD42-011` / `BS24-X02` fail-closed fix).
  3. `moveCard` previously filtered out `replaces === 'NEXUS_DESTRUCTION'` (`SD02-014` fix).
  4. `FlowController` `REFRESH` step previously ignored `CANNOT_REFRESH` modifiers in `state.modifiers`.

---

## 6. Full Regression, Evidence Audit & Performance Results

All commands executed sequentially on Windows, Node.js `v24.16.0`:

1. **`node scripts/run_verified_suites.mjs --all`** -> **Exit `0`** (`29` suites, **583 / 583 passing**, `0` failed, `0` skipped)
2. **`node tests/run_all.js`** -> **Exit `0`** (`191` suites, **1,976 / 1,976 passing**, `0` failed, `0` skipped)
3. **`node scripts/audit_514_cards_exhaustive.mjs`** -> **Exit `0`**:
   - **288** unique op names (`144` implemented + `144` missing, `reconciledSumCheck: true`)
   - **297** unique parameterized variants (`21` verified, `1` partial, `122` unverified, `152` unsupported, `1` manual review)
   - Op instances (`51,734`): `SEMANTICALLY_VERIFIED: 18,969`, `HANDLER_PRESENT_UNVERIFIED: 28,503`, `NEEDS_MANUAL_REVIEW: 2,565`, `HANDLER_MISSING: 1,007`, `PARAMETERS_INCOMPLETE: 538`, `PARTIALLY_SUPPORTED: 152`
   - Conditions (`4,940`, `reconciledWithAuthoritativeEnumerator: true`): `SEMANTICALLY_VERIFIED: 1,533`, `PARSED_EVALUABLE_UNVERIFIED: 1,140`, `PARSE_FAILURE: 2,267`
   - Abilities (`36,422`): `FULLY_SUPPORTED: 7,274`, `PARTIAL: 12,884`, `NEEDS_MANUAL_REVIEW: 15,294`, `UNIMPLEMENTED: 970`
   - Card Status Proposal (`15,398`): `VANILLA_NO_EFFECT: 414`, `FULLY_SUPPORTED: 844`, `PARTIAL: 3,074`, `NEEDS_MANUAL_REVIEW: 11,001`, `UNIMPLEMENTED: 65`
4. **Performance (`WPDE-PERF-01` & `PERF-TARGET-01`)**: 200-candidate target selection + simultaneous `DESTROY` + 50 BP recalculations completed in **`49.86ms`** (`< 500ms` threshold).

---

## 7. Remaining Limitations
- `144` unique op names (`1,007` instances) remain unimplemented in `engine/ops/index.js`.
- `122` implemented op variants (`28,503` instances) lack variant-level semantic tests satisfying strict executable discovery.
- `2,267` condition occurrences remain `PARSE_FAILURE`, and `97` `LEGACY_CONTEXT_CONDITION` occurrences remain unverified.
