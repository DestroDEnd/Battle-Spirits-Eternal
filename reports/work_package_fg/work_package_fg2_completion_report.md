# Battle Spirits Eternal — Work Package F/G.2 Completion Report
## Semantic Corrections, Tri-State Integrity, Restriction Precision & Evidence Hardening

**Work Package:** F/G.2  
**Predecessor:** F/G.1 (Conditionally Accepted)  
**Runtime:** Node.js `v24.16.0` (Windows)  
**Final Handoff Archive:** `reports/work_package_fg/work_package_fg2_handoff.zip`

---

## 1. Executive Summary & Preservation Compliance

Work Package F/G.2 closes every semantic defect, tri-state context leak, restriction category conflation, shallow real-card assertion, and continuous-effect cache invalidation gap identified in the F/G.1 review, without modifying any compiled IR shard or breaking backwards compatibility across the existing Battle Spirits Eternal suite:

- **Strict Tri-State Condition Integrity (`Workstream A`):** Updated all F/G & F/G.1 structured condition evaluators (`CARD_ZONE_STATE`, `PREVIOUS_OP_SUCCESS`, `TURN_HISTORY`, `CARD_RESULT`, `BRAVE_STACK_STATE`, `FIELD_COMPOSITION`, `ATTACKING_OR_BLOCKING_SPIRIT`, `ZONE_CARD_COUNT`, `SPIRIT_STAT_THRESHOLD`, `SOUL_CORE_LOCATION`, `RESERVE_CORE_THRESHOLD`, `STACK_STATE`) plus `resolveSourceStackFromState` fallback/contradiction detection so missing or contradictory context always returns `CONDITION_RESULT.UNSUPPORTED` rather than silently collapsing into `CONDITION_RESULT.FALSE`.
- **Restriction Specification & De-Conflation (`Workstream B`):** Exported `RESTRICTION_SPECIFICATIONS` across all `23` canonical restriction categories and strictly separated `CANNOT_ACTIVATE_ABILITY` vs `CANNOT_USE_ABILITY` and `CANNOT_MOVE` vs `CANNOT_BE_MOVED` vs `CANNOT_BE_DESTROYED` vs `CANNOT_BE_RETURNED`.
- **Real-Card Semantic Assertion Hardening (`Workstream C`):** Strengthened all `45` `REAL_FG1_CASES` in `tests/work_package_fg1_restrictions_conditions_evidence.test.js` (`53/53` passing) to assert exact `computeEffectiveBP` before/after deltas, exact modifier properties, exact card counts/IDs drawn, exact `computeSymbols` symbol deltas, exact core deltas, and active restriction/immunity enforcement.
- **Deterministic Condition Parser Expansion (`Workstream D`):** Reduced condition `PARSE_FAILURE` instances across the `514` shards from `1,290` to **`1,204`** (`-86` failures; **`3,736 / 4,940` = `75.63%`** parsed deterministically; `3,639` `SEMANTICALLY_VERIFIED` + `97` `PARSED_EVALUABLE_UNVERIFIED` = `3,736`; `3,736 + 1,204 = 4,940` reconciled).
- **Continuous Cache & Lifecycle Integrity (`Workstream E`):** Added `isSourceInRequiredZone(state, m)` and stack attachments (`braves`, `under`) into `computeEffectiveCharacteristics` cache fingerprints and guarded `isModifierApplicable` against stale `WHILE_SOURCE_IN_ZONE` modifiers when the source card has moved to another zone.
- **Full Sequential Regression (`Workstream G`):** `677 / 677` verified tests passed (`scripts/run_verified_suites.mjs --all`), `2,071 / 2,071` full suite tests passed (`tests/run_all.js`), and `514 / 514` IR shards passed exhaustive audit (`scripts/audit_514_cards_exhaustive.mjs`).

---

## 2. Scope & Non-Negotiable Architecture Preservation Verification

| Invariant / Subsystem | Expected Value | F/G.2 Verified Result | Status |
| :--- | ---: | ---: | :--- |
| Compiled IR Shards (`data/ir_shards/*.json`) | `514` shards (`0` modified) | `514 / 514` SHA-256 & byte-size identical to F/G.1 `MANIFEST.txt` | Preserved |
| Compiled Card Records | `15,398` | `15,398` | Preserved |
| Unique Base Card Numbers | `14,609` | `14,609` | Preserved |
| Total Compiled Abilities | `36,422` | `36,422` | Preserved |
| Total Compiled Clauses | `51,734` | `51,734` | Preserved |
| Total Condition Instances | `4,940` | `4,940` (`4,534` `clause.condition` + `406` `clause.op.condition`) | Preserved |
| Physical vs. Semantic Ability Identity | Strict separation + RFC 8785 | All physical/semantic & identity tests pass (`0` failures) | Preserved |
| Activation-Limit Reservation Lifecycle | Synchronous reservation/commit | All activation-limit suites pass (`0` failures) | Preserved |

---

## 3. Workstream A — Tri-State Condition Integrity & Evaluator Fixes

### 3.1 Root Causes Resolved in `engine/conditions.js`
1. **Silent `FALSE` on Missing Context:** Previously, F/G and F/G.1 evaluators (`STACK_STATE`, `BRAVE_STACK_STATE`, `SPIRIT_STAT_THRESHOLD`, `SOUL_CORE_LOCATION`, `RESERVE_CORE_THRESHOLD`, `ZONE_CARD_COUNT`, `FIELD_COMPOSITION`, `CARD_RESULT`, `PREVIOUS_OP_SUCCESS`, `CARD_ZONE_STATE`, `TURN_HISTORY`) returned `CONDITION_RESULT.FALSE` when required runtime inputs (`sourceStack`, `sourceCard`, `previousTarget`, `previousOpResult`, `state.players`, `reserve`, `trash`, zone arrays, or `st.state`) were missing. Every such path now returns `CONDITION_RESULT.UNSUPPORTED` with an explicit diagnostic reason (`MISSING_STACK_CONTEXT`, `MISSING_SOURCE_STACK_CONTEXT`, `MISSING_BP_CONTEXT`, `MISSING_COST_CONTEXT`, `MISSING_PREVIOUS_OP_RESULT`, etc.).
2. **Authoritative Fallback & Contradiction Detection:** Added `resolveSourceStackFromState(state, ctx)` which resolves the active field stack from `state.players` when `ctx.sourceStack` is omitted but `ctx.sourceCard?.id`, `ctx.sourceStackId`, or `ctx.targetStackId` is supplied, and returns `{ conflict: true }` (`UNSUPPORTED` / `CONTRADICTORY_SOURCE_STACK_AND_CARD`) when `ctx.sourceStack` and `ctx.sourceCard` refer to unrelated cards.
3. **New Stack States Evaluated:** Implemented `STACK_STATE` branches for `DURING_ADVENT` (`Boolean(st.isAdvent || st.under?.length > 0)`) and `BRAVE_SPIRIT_FORM` (`Boolean(st.top && cardMatchesType(st.top, 'Brave'))`).
4. **Legitimate Empty Zone/Field Semantics Preserved:** Valid initialized empty arrays (`p.field = []`, `p.grave = []`) still evaluate deterministically to `CONDITION_RESULT.FALSE`, never `UNSUPPORTED`.
5. **Phase 4A Backward Compatibility Preserved:** Legacy Phase 4A tests (`tests/phase4a_structured_conditions.test.js`, `8/8` passing) remain green; `tests/work_package_fg1_restrictions_conditions_evidence.test.js` line 256 (`If this Spirit is in refreshed state` with missing `sourceStack`) was updated from `FALSE` to `UNSUPPORTED`.

### 3.2 Kleene 3-Valued Compound Truth Tables & Resolver Gating
Verified in `WPFG2-TRISTATE-02` and `WPFG2-TRISTATE-03` (`tests/work_package_fg2_semantics_tristate_restrictions.test.js`):
- Full `3x3` `AND`, `3x3` `OR`, and `3`-row `NOT` truth tables plus nested compound trees follow Kleene strong three-valued logic.
- `AsyncResolver.resolveAbility` executes dependent clauses only on `TRUE`, skips cleanly on `FALSE` (`skipped: true`, `hasUnsupported: false`, `0` mutations), and halts execution on `UNSUPPORTED` (`success: false`, `hasUnsupported: true`, `conditionResult: 'UNSUPPORTED'`, `0` state mutations).

---

## 4. Workstream B — Restriction Specification Table & Category De-Conflation

### 4.1 `RESTRICTION_SPECIFICATIONS` Registry (`engine/continuous.js`)
Exported `RESTRICTION_SPECIFICATIONS` covering all `23` canonical restriction categories (`CANNOT_ATTACK`, `CANNOT_BLOCK`, `CANNOT_ATTACK_OR_BLOCK`, `CANNOT_EXHAUST`, `CANNOT_REFRESH`, `CANNOT_SUMMON`, `CANNOT_DEPLOY_NEXUS`, `CANNOT_USE_MAGIC`, `PREVENT_FLASH_HAND`, `CANNOT_ACTIVATE_ABILITY`, `CANNOT_USE_ABILITY`, `CANNOT_ACTIVATE_BURST`, `CANNOT_SET_BURST`, `CANNOT_MOVE`, `CANNOT_BE_MOVED`, `CANNOT_BE_TARGETED`, `CANNOT_BE_DESTROYED`, `CANNOT_BE_RETURNED`, `CANNOT_DRAW`, `CANNOT_DISCARD`, `CANNOT_MILL`, `CANNOT_LOSE_LIFE`, `CANNOT_LOSE_CORES`) with typed metadata (`category`, `prohibitedAction`, `scope`, `appliesToCosts`, `appliesToEffects`, `voluntaryVsForced`, `affectedSide`, `timingWindows`, `requiresSourceInZone`, `bypassableByUnpreventable`).

### 4.2 De-Conflated Semantics & Enforcement Boundaries
| Restriction Category | Isolated Enforcement Boundary | Non-Conflation Verified | Test IDs |
| :--- | :--- | :--- | :--- |
| `CANNOT_ACTIVATE_ABILITY` | Blocks initiating voluntary activations in `game.activateAbility` (`ABILITY_ACTIVATION_RESTRICTED`), passing `isVoluntaryActivation: true`. | Does **not** block already-triggered non-voluntary ability resolution (`AsyncResolver.resolveAbility`). | `WPFG2-RESTR-02` |
| `CANNOT_USE_ABILITY` | Blocks resolving/executing ability effects in `AsyncResolver.resolveAbility` (`ABILITY_RESTRICTED`). | Does **not** match voluntary initiation checks (`isActionRestricted(..., 'CANNOT_ACTIVATE_ABILITY')`) unless explicitly flagged. | `WPFG2-RESTR-02` |
| `CANNOT_MOVE` | Blocks controller/actor-initiated core transfers (`game.transferCore`) and `MOVE_CARD` execution (`MOVE_RESTRICTED`). | Does **not** act as target `CANNOT_BE_MOVED` protection (`isTargetProtectedFrom(..., 'move') === false`). | `WPFG2-RESTR-03` |
| `CANNOT_BE_MOVED` | Protects target stacks/Nexuses from non-destroy, non-bounce relocations (`moveCard(..., 'removed', { cause: 'effect' })`, `MOVE_CARD` target check, `isTargetProtectedFrom(..., 'move')`). | Does **not** block voluntary `game.transferCore`, `DESTROY` (`cause: 'destroy'`, governed by `CANNOT_BE_DESTROYED`), or `BOUNCE` (`cause: 'bounce'`, governed by `CANNOT_BE_RETURNED`). | `WPFG2-RESTR-03` |

---

## 5. Workstream C — Real-Card Semantic Assertion Hardening

Updated all `45` real shard cards in `REAL_FG1_CASES` ([tests/work_package_fg1_restrictions_conditions_evidence.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/work_package_fg1_restrictions_conditions_evidence.test.js)):
- **Restrictions (`10` cards):** Verified exact modifier properties (`type: 'SET_RESTRICTION'`, `restriction`, `side`, `maxCost`, `duration`, `targetStackId`, `sourceCardId`) plus negative/positive boundary calls (`canBlock`, `canAttack`, `isActionRestricted`).
- **Immunity / Indestructibility (`8` cards):** Verified exact modifier target binding (`targetStackId`, `sourceCardId`) and asymmetric protection (`isTargetProtectedFrom(..., opponent)` `true` vs self `false`; `BS05-051` protects `destroy` `true` while permitting `bounce` `false`).
- **Continuous Modifiers (`10` cards):** Asserted exact `BP_BUFF` / `BP_DEBUFF` `amount`, `duration`, `targetStackId`, `sourceCardId`, and exact `computeEffectiveBP` delta (`+1000`, `+2000`, `+3000`, `-3000`).
- **Controlled-Card Conditions (`10` cards):** Asserted exact symbol deltas (`computeSymbols(...).length === symBefore + 1`), exact deck-to-hand drawn card IDs, exact `BP_BUFF` deltas, exact core movement counts (`BS60-067` `coresMoved === 1`), and `results[0].skipped !== true`.
- **Zone / Stat / Attacking Conditions (`7` cards):** Asserted exact BP deltas (`26RBS03-035`, `CB22-016`), exact restriction enforcement (`BS07-083`), exact drawn card ID (`BS34-062`), exact core transfer on `BS35-X02` and `CB14-X06` (`cores.normal: 2 -> 4`, `voidCores.normal: 3 -> 1`), exact immunity on `CB31-003`, plus full core conservation across all `45` cards.

---

## 6. Workstream D — Deterministic Condition Parser Expansion & Inventory Reconciliation

Added non-guessing deterministic grammar rules in [engine/conditions.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/conditions.js) (evaluated with `TRUE`, `FALSE`, and `UNSUPPORTED` assertions in `WPFG2-PARSER-01`):
- **Brave Requirement Specifiers (`BRAVE_STACK_STATE`):** `while braved to a Saga Brave`, `"<Family>" family Brave`, `exactly-named "<Name>"`, `brave named "<Name>"`, `<Color> Brave`.
- **Turn Attack History (`TURN_HISTORY`):** `If your Spirits attacked this turn`, `If you've made <N> or more attacks this turn`, `If this is the second or subsequent attack of the turn` (also fixing the compound `OR` splitter lookahead so `"second or subsequent"` is not split on `" or "`).
- **Field Composition & Symbols (`FIELD_COMPOSITION` / `COLOR_SYMBOL`):** `While you have only <Color> Spirits/Nexuses/Ultimates on your field`, multi-family `If all your Spirits(/Nexuses) have "<F1>"/"<F2>" family`, `cost <N> or more/less`, `there are <N> or more <Color> symbols on your Field`.
- **Zone Counts, Named Control & Card Results (`ZONE_CARD_COUNT`, `CONTROL_CARD`, `CARD_RESULT`, `ATTACKING_OR_BLOCKING_SPIRIT`):** Deck size thresholds (`ten or less cards in deck`), bare quoted control (`If you control "Ur-Dine"`), `While you control any Saga Brave`, `If you control no Spirits other than Braves`, plural `are battling`, and `discarded/revealed/destroyed/returned card` family, color, and cost checks.

### Exact Reconciled 514-Shard Condition Metrics (`4,940` Total Occurrences)
| Metric | F/G Baseline | F/G.1 Baseline | F/G.2 Current | Delta (F/G.2 vs F/G.1) |
| :--- | ---: | ---: | ---: | ---: |
| `totalConditionInstances` | `4,940` | `4,940` | **`4,940`** | `0` |
| `reconciledWithAuthoritativeEnumerator` | `true` | `true` | **`true`** | Reconciled |
| `parsedStructuredCount` | `2,722` (`55.10%`) | `3,650` (`73.89%`) | **`3,736` (`75.63%`)** | **`+86`** |
| `SEMANTICALLY_VERIFIED` | `2,625` | `3,553` | **`3,639`** | **`+86`** |
| `PARSED_EVALUABLE_UNVERIFIED` | `97` | `97` | **`97`** | `0` |
| `PARSED_UNSUPPORTED_TYPE` | `0` | `0` | **`0`** | `0` |
| `PARSE_FAILURE` | `2,218` | `1,290` | **`1,204`** | **`-86`** |
| `NEEDS_MANUAL_REVIEW` | `0` | `0` | **`0`** | `0` |
| `reconciledTotalCheck` (`parsed + failure === 4,940`) | `true` | `true` | **`true`** | Verified |
| `reconciledEvidenceCheck` (`sum(evidence) === 4,940`) | `true` | `true` | **`true`** | Verified |

---

## 7. Workstream E — Continuous-Effect Cache Invalidation & Physical/Semantic Isolation

- Updated `computeEffectiveCharacteristics` in [engine/continuous.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/continuous.js) so its deterministic cache fingerprint includes `:1`/`:0` from `isSourceInRequiredZone(state, m)` plus `braveSig` (`stack.braves` IDs) and `underSig` (`stack.under` IDs).
- Added `isSourceInOtherZone(state, mod)` and wired it into `isModifierApplicable` for `WHILE_SOURCE_IN_ZONE` modifiers so that as soon as a source card leaves the field for another zone (`grave`, `hand`, `removed`, `deck`, `burst`, `mirage`), its buff immediately drops out of `computeEffectiveBP` and `computeEffectiveCharacteristics` before `pruneExpiredModifiers` runs — while preserving legacy synthetic tests (`CONT-01` using `sourceCardId: 'missing_src'` prior to `pruneExpiredModifiers('SOURCE_DEPARTURE')`).
- Verified in `WPFG2-CONT-01` alongside physical card clone isolation (`targetA` vs `targetB` sharing `cardNumber: 'SAME-01'`).

---

## 8. Workstream F — Consolidated Integration & Debugging Resolution Log

Three integration issues surfaced during strict automated verification and were cleanly fixed inside engine/test scope:
1. **Compounded `" or "` Split on Atomic Phrasing:** `'If this is the second or subsequent attack of the turn'` was prematurely split by `parseConditionToStructured` on `" or "`. Fixed by extending the negative lookahead in [engine/conditions.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/conditions.js) (`subsequent\b|higher\b`).
2. **Continuous Aura Departure vs. Synthetic `CONT-01` Compatibility:** Directly gating `isModifierApplicable` on `!isSourceInRequiredZone` broke existing `CONT-01` (`tests/timing_triggers_continuous_sba.test.js:198`) which places a dummy nonexistent `'missing_src'` modifier and expects `8500` BP prior to `pruneExpiredModifiers('SOURCE_DEPARTURE')`. Fixed by `isSourceInOtherZone(state, mod)`, which immediately deactivates real departed sources (`auraSource` moved to `grave`) while keeping `CONT-01` passing unchanged.
3. **Real-Card Modifier Property Checks:** Strict hardening in `REAL_FG1_CASES` surfaced exact runtime modifier fields (`BATTLE-SPIRITS-A170` sets `side: 'opponent'`, `IMMUNITY` ops omit `immuneTo` property and default scope in `isTargetProtectedFrom`, `A6049`/`A4734` target the chosen field candidate); aligned assertions directly against computed runtime effects and exact stack IDs.

---

## 9. Workstream G — Full Sequential Test Suite Execution & Log Verification

All checks ran sequentially after final edits, with `0` failures and `0` skipped tests:

| Check | Exact Command | Total | Passed | Failed | Skipped | Exit Code | Log Artifact |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| **Phase 4A Structured Conditions** | `node tests/phase4a_structured_conditions.test.js` | `8` | `8` | `0` | `0` | `0` | — |
| **Continuous & SBA Suite** | `node tests/timing_triggers_continuous_sba.test.js` | `7` | `7` | `0` | `0` | `0` | — |
| **F/G.1 Suite (45 Hardened Real Cards)** | `node tests/work_package_fg1_restrictions_conditions_evidence.test.js` | `53` | `53` | `0` | `0` | `0` | — |
| **F/G.2 Suite (Tri-State, Restrictions, Cache)** | `node tests/work_package_fg2_semantics_tristate_restrictions.test.js` | `9` | `9` | `0` | `0` | `0` | — |
| **Verified Suites Runner (`32` Suites)** | `node scripts/run_verified_suites.mjs --all` | **`677`** | **`677`** | **`0`** | **`0`** | **`0`** | [verified_suites_all.log](file:///c:/Users/namis/OneDrive/Documents/BSP/reports/work_package_fg/verified_suites_all.log) |
| **Full Project Suite (`195` Files / `335` Suites)** | `node tests/run_all.js` | **`2,071`** | **`2,071`** | **`0`** | **`0`** | **`0`** | [final_run_all.log](file:///c:/Users/namis/OneDrive/Documents/BSP/reports/work_package_fg/final_run_all.log) |
| **514-Shard Exhaustive Audit** | `node scripts/audit_514_cards_exhaustive.mjs` | `514` shards | `100%` | `0` | `0` | `0` | [shard_audit_summary.json](file:///c:/Users/namis/OneDrive/Documents/BSP/reports/work_package_fg/shard_audit_summary.json) |

---

## 10. Modified & Added Files Map

- [engine/conditions.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/conditions.js) — `resolveSourceStackFromState`, `matchesBraveRequirement`, strict tri-state `UNSUPPORTED` returns on missing/contradictory context, `DURING_ADVENT`/`BRAVE_SPIRIT_FORM` evaluation, Workstream D deterministic parser expansion, `OR` lookahead fix.
- [engine/continuous.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/continuous.js) — `RESTRICTION_SPECIFICATIONS` (23 categories), `CANNOT_ACTIVATE_ABILITY` vs `CANNOT_USE_ABILITY` & `CANNOT_MOVE` vs `CANNOT_BE_MOVED` de-conflation in `matchesRestrictionAction` / `isActionRestricted` / `isTargetProtectedFrom`, cache fingerprint updates in `computeEffectiveCharacteristics`, `isSourceInOtherZone` departure check in `isModifierApplicable`.
- [engine/index.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/index.js) — `isVoluntaryActivation: true` propagation in `activateAbility`.
- [engine/resolver.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/resolver.js) — De-conflated `CANNOT_USE_ABILITY` check in `resolveAbility` respecting `isVoluntaryActivation`.
- [engine/zones.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/zones.js) — Restricted `CANNOT_BE_MOVED` enforcement in `moveCard` to non-destroy, non-bounce, non-battle, non-depletion relocations.
- [engine/ops/index.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/ops/index.js) — Checked both actor `CANNOT_MOVE` and target `CANNOT_BE_MOVED` in `MOVE_CARD` (`MOVE_RESTRICTED` vs `MOVE_PROTECTED`).
- [scripts/evidence_registry.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/evidence_registry.mjs) — Updated `CONDITION_EVIDENCE_REGISTRY` references to F/G.2 tri-state & parser tests (`unsupportedTest` documented across all 10 extended condition entries).
- [scripts/run_verified_suites.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/run_verified_suites.mjs) — Registered `tests/work_package_fg2_semantics_tristate_restrictions.test.js` in `DATA_DEPENDENT_SUITES`.
- [tests/work_package_fg1_restrictions_conditions_evidence.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/work_package_fg1_restrictions_conditions_evidence.test.js) — Updated missing-context `STACK_STATE` expectation to `UNSUPPORTED` and strengthened all 45 `REAL_FG1_CASES`.
- [tests/work_package_fg2_semantics_tristate_restrictions.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/work_package_fg2_semantics_tristate_restrictions.test.js) — Created `9` new automated suites (`WPFG2-TRISTATE-01..03`, `WPFG2-RESTR-01..03`, `WPFG2-PARSER-01`, `WPFG2-CONT-01`, `WPFG2-RECON-01`).

---

## 11. Condition & Operation Evidence Reconciliation Summary

- **Conditions (`4,940` Total):** `24` structured condition types (`CONTROL_CARD`, `COLOR_SYMBOL`, `COUNTER_THRESHOLD`, `ATTACKING_OR_BLOCKING_SPIRIT`, `SOUL_CORE_ON_SPIRIT`, `BURST_OR_MIRAGE_SET`, `LIFE_THRESHOLD`, `CARD_RESULT`, `ZONE_CARD_COUNT`, `HAND_SIZE_THRESHOLD`, `TURN_HISTORY`, `BATTLING_STATE`, `TURN_STEP_STATE`, `SPIRIT_STAT_THRESHOLD`, `FIELD_COMPOSITION`, `BP_ZERO`, `BRAVE_STACK_STATE`, `SOUL_STATE`, `CARD_ZONE_STATE`, `PREVIOUS_OP_SUCCESS`, `STACK_STATE`, `SOUL_CORE_LOCATION`, `RESERVE_CORE_THRESHOLD`, plus `COMPOUND`) hold `SEMANTICALLY_VERIFIED` executable test status covering `3,639` instances; `LEGACY_CONTEXT_CONDITION` covers `97` instances (`PARSED_EVALUABLE_UNVERIFIED`); `1,204` remain `PARSE_FAILURE` (`0` `NEEDS_MANUAL_REVIEW`).
- **Operations (`288` Unique Ops, `51,734` Clauses):** `144` implemented + `144` unimplemented (`reconciledSumCheck: true`); clause instances: `18,969` `SEMANTICALLY_VERIFIED`, `28,503` `HANDLER_PRESENT_UNVERIFIED`, `1,007` `HANDLER_MISSING`, `538` `PARAMETERS_INCOMPLETE`, `152` `PARTIALLY_SUPPORTED`, `2,565` `NEEDS_MANUAL_REVIEW`.
- **Card / Ability Status Totals:** `414` `VANILLA_NO_EFFECT`, `892` `FULLY_SUPPORTED`, `3,180` `PARTIAL`, `65` `UNIMPLEMENTED`, `10,847` `NEEDS_MANUAL_REVIEW` across `15,398` compiled card records (`36,422` abilities).

---

## 12. Remaining Limitations & Explicitly Bounded Gaps

1. **Unparsed Condition Strings (`1,204 / 4,940`):** Remaining unparsed strings represent complex comparative target clauses (`If that card's cost is equal or inferior to the attacking target's`), banish/cost-sacrifice conditions (`If you banish the [Soul Core] on this Ultimate from the game`), contextual anaphora (`If not`, `If possible`), and specialized named/team rules. All fail closed deterministically as `CONDITION_RESULT.UNSUPPORTED` and prevent dependent clause execution (`hasUnsupported: true`).
2. **Legacy Context Conditions (`97 / 4,940`):** `LEGACY_CONTEXT_CONDITION` remains classified as `PARSED_EVALUABLE_UNVERIFIED` pending per-key semantic decomposition in future milestones.
3. **Unparameterized IR Stubs / Unverified Op Variants:** `144` unique operation names (`1,007` clauses) remain unimplemented and `28,503` handler-present clauses await variant-level semantic test entries in `OPERATION_EVIDENCE_REGISTRY`; incomplete stub objects fail closed by design.

---

## 13. Clean-Extraction Handoff Package (`work_package_fg2_handoff.zip`) Verification

- **Archive path:** `reports/work_package_fg/work_package_fg2_handoff.zip` (`2,021` entries = `2,020` tracked project files + root `MANIFEST.txt`)
- **Archive contents:** Complete standalone runtime (`engine/`, `compiler/`, `scripts/`, `tests/`, `data/cards_index.json`, `data/cards_detailed.json`, `data/effects/`, all `514` `data/ir_shards/*.json`, UI files, and F/G–F/G.2 audit reports/logs) plus root `MANIFEST.txt` (`<sha256>  <bytes>  <rel_path>`). Excludes `.git/`, `node_modules/`, SQLite `battle_spirits.db*`, `card_effects_db.json`, `data/ir_shards_staging/`, `data/ir_shards_pre_compilation_backup/`, and nested historical `.zip` archives.
- **Clean-Extraction Verification (`$env:TEMP\bsp_fg2_verify`):**
  1. `MANIFEST.txt` cryptographic check: `MANIFEST_VERIFIED: 2020/2020` (`0` mismatches, `0` missing files).
  2. Shard preservation check: `514 / 514` `data/ir_shards/*.json` SHA-256 hashes match F/G.1 (`0` modified).
  3. Clean-extraction `node scripts/audit_514_cards_exhaustive.mjs`: exit `0` (`514` shards, `14,609` unique base cards, `36,422` abilities, `51,734` clauses, `4,940` reconciled conditions, `1,204` `PARSE_FAILURE`).
  4. Clean-extraction `node scripts/run_verified_suites.mjs --all`: exit `0` (`677 / 677` pass, `0` fail, `0` skipped).
  5. Clean-extraction `node tests/run_all.js`: exit `0` (`2,071 / 2,071` pass across `335` suites, `0` fail, `0` skipped).

---

## 14. Final Sign-Off Checklist

- [x] `514 / 514` IR shards preserved byte-for-byte (`514 / 514` SHA-256 matched)
- [x] Strict tri-state (`TRUE | FALSE | UNSUPPORTED`) enforced on missing and contradictory contexts
- [x] `RESTRICTION_SPECIFICATIONS` exported (`23` categories) with `CANNOT_ACTIVATE_ABILITY` / `CANNOT_USE_ABILITY` and `CANNOT_MOVE` / `CANNOT_BE_MOVED` de-conflated
- [x] All `45` real-card cases in `REAL_FG1_CASES` upgraded to exact semantic assertions (`53 / 53` pass)
- [x] `9 / 9` new F/G.2 tests in `tests/work_package_fg2_semantics_tristate_restrictions.test.js` pass
- [x] `677 / 677` verified suites pass (`0` fail, `0` skip)
- [x] `2,071 / 2,071` full project suite pass (`0` fail, `0` skip)
- [x] `4,940 / 4,940` conditions strictly reconciled (`PARSE_FAILURE` reduced to `1,204`)
- [x] Clean-extraction ZIP verification passed (`MANIFEST_VERIFIED: 2020/2020`, `677/677` + `2,071/2,071` + `514`-shard audit from `$env:TEMP\bsp_fg2_verify`)
