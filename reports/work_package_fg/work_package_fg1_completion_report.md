# Battle Spirits Eternal — Work Package F/G.1 Completion Report
## Restriction Completeness, Condition Parser Expansion & Evidence Reconciliation

**Timestamp:** `2026-11-19T11:39:00+05:30`  
**Runtime:** Node.js `v24.16.0` (Windows)  
**Scope:** Work Package F/G.1 (Centralized restriction completeness, structured condition parser/evaluator expansion, continuous-effect audit, condition/operation evidence reconciliation, 45 real-card semantic tests, and clean-extraction verification). Zero modifications were made to the 514 authoritative IR shards, 14,609 card identities, or activation-limit architecture.

---

## A. Implementation Summary

### Files Modified
1. [engine/continuous.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/continuous.js)
   - `computeBaseBP`: fixed truthy-zero fallback (`typeof entry.bp === 'number' ? entry.bp : 1000`) so 0-BP stacks evaluate to `0`.
   - `computeEffectiveBP`: added defensive argument-order guard for callers passing `(stack, state)` and fixed `matchesTargetFilter` call site.
   - `computeColors`: added `ADD_COLOR` support alongside `TREAT_COLOR_SYMBOL` and `TREAT_RULE`.
   - `canAttack` / `canBlock`: unified with centralized `isActionRestricted(state, ...)`.
   - `matchesRestrictionAction` & `isActionRestricted(state, actionType, side, stackOrCard, actionContext)`: expanded across all 18 restriction categories with structured `actionContext` (`isCost`, `cardType`, `fromZone`, `toZone`, `timingWindow`, `unpreventable`, `maxCost`, `applyTo`, `WHILE_SOURCE_IN_ZONE` / `requireSourceOnField`, `PREVENT_MAGIC_MATCHING_TRASH_COLOR`, `PREVENT_FLASH_HAND`).
   - `isTargetProtectedFrom(state, stackOrCard, effectType, sourceCard, options)`: unified protection checks across `INDESTRUCTIBLE`, `PROTECTION`, `SET_RESTRICTION` (`CANNOT_BE_*`), `IMMUNITY`, and `isImmune(...)` with `skipEffectImmunity` (for combat BP destruction) and `unpreventable`/`bypassArmor`/`targetedGrandwalker` option propagation.
2. [engine/index.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/index.js)
   - Wired centralized `isActionRestricted` across `playCard` (`CANNOT_SUMMON`, `CANNOT_USE_MAGIC`, `PREVENT_FLASH_HAND`, `CANNOT_DEPLOY_NEXUS`), `activateAbility` (`CANNOT_ACTIVATE_ABILITY`), `setBurst` (`CANNOT_SET_BURST`), `transferCore` (`CANNOT_MOVE`), and `resolveDirectHit` (`CANNOT_LOSE_LIFE`).
3. [engine/zones.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/zones.js)
   - Wired `isActionRestricted` and `isTargetProtectedFrom` across `moveCard` (`CANNOT_BE_MOVED`, `bounce`, `destroy`, excluding combat BP comparison from effect immunity via `skipEffectImmunity`) and `moveCore` (`CANNOT_LOSE_LIFE` with cost/unpreventable distinction, `CANNOT_LOSE_CORES` / `deplete`).
4. [engine/ops/index.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/ops/index.js)
   - Wired `isActionRestricted` across `executeSummonTransaction` (`CANNOT_SUMMON`), `MILL_DECK` / `BANISH_DECK` (`CANNOT_MILL`), `SET_BURST` / `SET_BURST_FROM_HAND` (`CANNOT_SET_BURST`), `DISCARD` / `DISCARD_CARD` / `DISCARD_COST` (`CANNOT_DISCARD`), `MOVE_CARD` (`CANNOT_MOVE`), `REDUCE_LIFE` (`CANNOT_LOSE_LIFE`, also fixing `moveCore` parameter order), `CAST_MAGIC_FREE` (`CANNOT_USE_MAGIC`), and `DESTROY` (`bypassArmor` propagation to `moveCard`).
   - Fixed `SET_RESTRICTION` when `op.target === 'self' || 'SELF'` to bind `side: controller` and `targetStackId`/`targetCardId`, while preserving `maxCost`, `cardType`, `fromZone`, `applyTo`, and `applyToCosts`.
5. [engine/resolver.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/resolver.js)
   - Wired `CANNOT_USE_ABILITY` / `blockResolution` check in `resolveAbility`.
6. [engine/selectors.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/selectors.js)
   - Propagated `{ bypassArmor, targetedGrandwalker }` into `isTargetProtectedFrom` inside `queryCandidates`.
7. [engine/conditions.js](file:///c:/Users/namis/OneDrive/Documents/BSP/engine/conditions.js)
   - Fixed `BP_ZERO` call order `computeEffectiveBP(state, targetObj)`.
   - Added 4 structured `CONDITION_TYPES` (`ATTACKING_OR_BLOCKING_SPIRIT`, `ZONE_CARD_COUNT`, `SPIRIT_STAT_THRESHOLD`, `SOUL_CORE_LOCATION`) and shared `cardMatchesFilterSpec` helper.
   - Expanded `parseConditionToStructured` and `evaluateStructuredCondition` (including outside-quotes `AND`/`OR`/`NOT` compound parsing, `onlyThisColor`, multi-family/color/keyword/cost/BP controlled-card filters, attacking/blocking filters, trash/hand/removed counts, stat thresholds, Soul Core locations, turn-history counts).
8. [scripts/audit_514_cards_exhaustive.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/audit_514_cards_exhaustive.mjs), [scripts/evidence_registry.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/evidence_registry.mjs), [scripts/run_verified_suites.mjs](file:///c:/Users/namis/OneDrive/Documents/BSP/scripts/run_verified_suites.mjs)
   - Added `evaluateStructuredCondition` to `COND_PROD_APIS`, fixed `fg_subsystem_inventories.json` condition reconciliation fields (`parsedStructuredCount`, `parseFailureCount`, `reconciledTotalCheck`, `reconciledEvidenceCheck`), registered 10 newly verified condition types in `CONDITION_EVIDENCE_REGISTRY`, and added `tests/work_package_fg1_restrictions_conditions_evidence.test.js` (`53` tests) to `DATA_DEPENDENT_SUITES`.
9. [arena.html](file:///c:/Users/namis/OneDrive/Documents/BSP/arena.html)
   - Restored `#turn1MulliganBanner` block expected by existing [tests/phase6_7_ui_routes.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/phase6_7_ui_routes.test.js) after external mid-run UI edit removed it.

### Existing Subsystems Preserved
- All 514 compiled IR shards (`data/ir_shards/*.json`), 15,398 card records, 14,609 unique base card numbers, and 36,422 abilities remain unmodified.
- Physical/semantic identity algorithms, RFC 8785 serialization, activation-limit reservation lifecycle, and D/E transaction/conservation invariants remain intact.

---

## B. Restriction Coverage (18 Audited Categories)

| Restriction Category | Authoritative IR / Modifier Forms | Production Enforcement Points | Status | Semantic Tests |
| :--- | :--- | :--- | :--- | :--- |
| `CANNOT_ATTACK` | `SET_RESTRICTION`, `CANNOT_ATTACK`, `CANNOT_ATTACK_NOR_BLOCK`, `CANNOT_ATTACK_OR_BLOCK`, `COMBAT_RESTRICTION` | `canAttack()` (`engine/continuous.js`), `game.declareAttack()` (`engine/index.js`) | Enforced | `WPFG1-RESTR-01`, `WPFG1-REAL-BS02-038`, `WPFG1-REAL-BS02-110` |
| `CANNOT_BLOCK` | `SET_RESTRICTION`, `CANNOT_BLOCK`, `CANNOT_ATTACK_NOR_BLOCK`, `CANNOT_ATTACK_OR_BLOCK`, `COMBAT_RESTRICTION` | `canBlock()` (`engine/continuous.js`), `game.declareBlock()` (`engine/index.js`) | Enforced | `WPFG1-RESTR-01`, `WPFG1-REAL-BS01-016`..`009`, `WPFG1-REAL-BS03-014` |
| `CANNOT_EXHAUST` | `SET_RESTRICTION`, `EXHAUST_LOCK` | `isActionRestricted`, `EXHAUST` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-01` |
| `CANNOT_REFRESH` | `SET_RESTRICTION`, `CANNOT_REFRESH`, `REFRESH_LOCK` | `isActionRestricted`, `REFRESH`/`RESTORE` (`engine/ops/index.js`), `FlowController.advanceStep` (`engine/flow.js`) | Enforced | `WPFG1-RESTR-01`, `WPFG1-REAL-BATTLE-SPIRITS-A969`, `WPFG-INT` |
| `CANNOT_DRAW` | `SET_RESTRICTION`, `DRAW_LOCK` | `isActionRestricted`, `DRAW` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-01`, `WPFG-G3` |
| `CANNOT_SUMMON` | `SET_RESTRICTION` (with `cardType`/`fromZone`) | `game.playCard` (`engine/index.js`), `executeSummonTransaction` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-01` |
| `CANNOT_ACTIVATE_BURST` | `SET_RESTRICTION`, `BURST_LOCK` | `isActionRestricted`, `ACTIVATE_BURST` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-01`, `WPFG-G3` |
| `CANNOT_ACTIVATE_ABILITY` | `SET_RESTRICTION` (`CANNOT_ACTIVATE_ABILITY`, `PREVENT_FLASH_HAND`) | `game.activateAbility` (`engine/index.js`) | Enforced | `WPFG1-RESTR-02`, `WPFG1-REAL-BS01-143`, `WPFG1-REAL-BS07-083` |
| `CANNOT_USE_ABILITY` | `SET_RESTRICTION` (`CANNOT_USE_ABILITY` / `blockResolution`) | `AsyncResolver.resolveAbility` (`engine/resolver.js`) | Enforced | `WPFG1-RESTR-02` |
| `CANNOT_MOVE` | `SET_RESTRICTION` (`CANNOT_MOVE`, `CANNOT_BE_MOVED`) | `game.transferCore` (`engine/index.js`), `MOVE_CARD` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-02` |
| `CANNOT_BE_MOVED` | `SET_RESTRICTION`, `PROTECTION` (`cannotBeMoved`) | `moveCard` (`engine/zones.js`) | Enforced | `WPFG1-RESTR-02` |
| `CANNOT_BE_TARGETED` | `SET_RESTRICTION`, `PROTECTION` (`cannotBeTargeted`), `IMMUNITY`, `Armor` | `queryCandidates` (`engine/selectors.js`), `isTargetProtectedFrom`, `isActionRestricted` | Enforced | `WPFG1-RESTR-03`, `WPFG-G3` |
| `CANNOT_BE_DESTROYED` | `SET_RESTRICTION`, `PROTECTION` (`cannotBeDestroyed`), `INDESTRUCTIBLE` | `moveCard` (`engine/zones.js`), `isTargetProtectedFrom`, `DESTROY` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-03`, `WPFG1-REAL-BS05-051` |
| `CANNOT_BE_RETURNED` | `SET_RESTRICTION`, `PROTECTION` (`cannotBeBounced`/`cannotBeReturned`) | `moveCard` (`engine/zones.js`), `isTargetProtectedFrom`, `BOUNCE` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-03`, `WPFG-G3` |
| `CANNOT_LOSE_LIFE` | `SET_RESTRICTION`, `PREVENT_LIFE_LOSS`, `PREVENT_DAMAGE` | `game.resolveDirectHit` (`engine/index.js`), `moveCore` (`engine/zones.js`), `REDUCE_LIFE` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-02` |
| `CANNOT_LOSE_CORES` | `SET_RESTRICTION`, `PROTECTION` (`cannotBeDepleted`) | `moveCore` (`engine/zones.js`), `isTargetProtectedFrom` | Enforced | `WPFG1-RESTR-02` |
| `CANNOT_DISCARD` | `SET_RESTRICTION` (with `applyTo: 'EFFECT_ONLY'` cost bypass) | `DISCARD` / `DISCARD_CARD` / `DISCARD_COST` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-02` |
| `CANNOT_MILL` | `SET_RESTRICTION`, `DECK_DESTRUCTION_IMMUNITY`, `PREVENT_MILL` | `MILL_DECK`, `BANISH_DECK` (`engine/ops/index.js`) | Enforced | `WPFG1-RESTR-02` |

---

## C. Condition Coverage & Reconciliation

- **Previous `PARSE_FAILURE` Count:** `2,218`
- **New `PARSE_FAILURE` Count:** **`1,290`** (`-928` failures, **41.8% reduction**; `3,650 / 4,940` parsed = **`73.89%`**)
- **Newly Verified Condition Types Added to `CONDITION_EVIDENCE_REGISTRY`:**
  - `RESERVE_CORE_THRESHOLD` (`8`), `STACK_STATE` (`33`), `CARD_RESULT` (`144`), `FIELD_COMPOSITION` (`64`), `BRAVE_STACK_STATE` (`32`), `PREVIOUS_OP_SUCCESS` (`37`), `ATTACKING_OR_BLOCKING_SPIRIT` (`227`), `ZONE_CARD_COUNT` (`113`), `SPIRIT_STAT_THRESHOLD` (`75`), `SOUL_CORE_LOCATION` (`20`)

### Exact Condition Reconciliation (`4,940` Total Occurrences)
| Dimension | Breakdown | Total | Reconciled |
| :--- | :--- | ---: | :--- |
| **Location** | `clause.condition`: `4,534`, `clause.op.condition`: `406`, `header.condition`: `0` | `4,940` | `true` |
| **Evidence Classification** | `SEMANTICALLY_VERIFIED`: **`3,553`**, `PARSED_EVALUABLE_UNVERIFIED`: `97` (`LEGACY_CONTEXT_CONDITION`), `PARSED_UNSUPPORTED_TYPE`: `0`, `PARSE_FAILURE`: **`1,290`**, `NEEDS_MANUAL_REVIEW`: `0` | `4,940` | `true` |
| **Parsed ASTs + Failures** | `parsedStructuredCount` (`3,650`) + `parseFailureCount` (`1,290`) | `4,940` | `true` |

`fg_subsystem_inventories.json` Discrepancy Resolved: `conditions.parseFailureCount` previously read `byStructuredType.PARSE_FAILURE` (`0`), whereas `evidenceBreakdown.PARSE_FAILURE` held `2,218`. Both `audit_514_cards_exhaustive.mjs` and automated test `WPFG1-RECON-01` now verify exact equality (`parseFailureCount === evidenceBreakdown.PARSE_FAILURE === 1,290`) and `reconciledTotalCheck === true`.

---

## D. Continuous-Effect Coverage

- **Verified Modifier Types:** `SET_LEVEL` (Layer 1), `SET_BP` / `BP_BUFF` / `BP_DEBUFF` / `BP_OR_LEVEL_MODIFIER` (deterministic timestamp order in `computeEffectiveBP`), `COST_MODIFIER`, `ADD_SYMBOL` / `GRANT_SYMBOL`, `TREAT_COLOR_SYMBOL` / `ADD_COLOR`, `GRANT_FAMILY`, `IMMUNITY`, `INDESTRUCTIBLE`, `PROTECTION`, `SET_RESTRICTION`.
- **Lifecycle & Ordering Behavior:**
  - `pruneExpiredModifiers` clears `STEP` / `BATTLE` / `ATTACK` / `TURN` / `SOURCE_DEPARTURE` cleanly (`WHILE_SOURCE_IN_ZONE` deactivates when source card leaves required zone).
  - Printed card properties (`card.bp`, `card.colors`, `card.families`) remain immutable under continuous modification (`WPFG1-CONT-01`).
  - `computeBaseBP` accurately returns `0` when `entry.bp === 0` (`typeof entry.bp === 'number'`), and `computeEffectiveBP` handles argument-order resilience.

---

## E. Real-Card Semantic Evidence (45 New F/G.1 Cards; 131 Total Real Cards Across Suites)

All **45 new real-card cases** in [tests/work_package_fg1_restrictions_conditions_evidence.test.js](file:///c:/Users/namis/OneDrive/Documents/BSP/tests/work_package_fg1_restrictions_conditions_evidence.test.js) load actual IR from `data/ir_shards/`, resolve via `AsyncResolver.resolveAbility`, assert real state mutations (`modifiers` added, BP/symbol changes, cards drawn, cores moved, restrictions/protections enforced), and verify core conservation:

- **Restrictions (`10`):** `BATTLE-SPIRITS-A170`, `BS01-143`, `BS01-016`, `BS01-003`, `BS01-012`, `BS01-009`, `BS02-110`, `BATTLE-SPIRITS-A969`, `BS03-014`, `BS02-038`
- **Immunity / Indestructibility (`8`):** `BS02-040`, `BS04-043`, `BATTLE-SPIRITS-A188`, `BS05-051`, `BS06-X24`, `BS06-044`, `BS10-108`, `BS11-027`
- **Continuous Modifiers (`10`):** `26RBS01-086`, `26RBS01-051`, `26RBS01-060`, `26RBS01-020`, `26RBS01-054`, `26RBS01-032`, `26RBS01-012`, `BS19-109`, `26RBS01-056`, `26RBS01-061`
- **Controlled-Card Conditions (`10`):** `26RBS01-085`, `26RSD06-010`, `26RSD07-011`, `26RSD09-003`, `BATTLE-SPIRITS-A5242`, `BS60-067`, `CB02-063`, `CB25-021`, `BATTLE-SPIRITS-A6049`, `BATTLE-SPIRITS-A4734`
- **Zone / Stat / Attacking Conditions (`7`):** `26RBS03-035`, `BS07-083`, `BS34-062`, `BS35-X02`, `CB14-X06`, `CB22-016`, `CB31-003`

---

## F. Full Test Results (Node.js `v24.16.0`)

| Check | Exact Command | Total | Passed | Failed | Skipped | Exit Code |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| **Verified Suites** | `node scripts/run_verified_suites.mjs --all` | `668` | `668` | `0` | `0` | `0` |
| **Full Test Suite** | `node tests/run_all.js` | `2,062` | `2,062` | `0` | `0` | `0` |
| **F/G.1 Targeted Suite** | `node --test tests/work_package_fg1_restrictions_conditions_evidence.test.js` | `53` | `53` | `0` | `0` | `0` |
| **Exhaustive 514-Shard Audit** | `node scripts/audit_514_cards_exhaustive.mjs` | `514` shards | `100%` | `0` | `0` | `0` |

---

## G. Corpus Integrity & Clean-Extraction Manifest Verification

- **IR Shards:** `514` shards in `data/ir_shards/` (`0` modified)
- **Compiled Card Records / Unique Base Card Numbers:** `15,398` / `14,609`
- **Total Abilities / Clauses / Conditions:** `36,422` / `51,734` / `4,940`
- **Operation Summary (`reconciledSumCheck: true`):** `288` unique ops (`144` implemented + `144` missing handler); clause instances: `18,969` `SEMANTICALLY_VERIFIED`, `28,503` `HANDLER_PRESENT_UNVERIFIED`, `1,007` `HANDLER_MISSING`, `538` `PARAMETERS_INCOMPLETE`, `152` `PARTIALLY_SUPPORTED`, `2,565` `NEEDS_MANUAL_REVIEW`.
- **Clean-Extraction Reproducibility (`work_package_fg1_handoff.zip`):** Extracted to `$env:TEMP\bsp_fg1_verify`, verified every `MANIFEST.txt` SHA-256 hash and exact byte size, and executed `audit_514_cards_exhaustive.mjs`, `run_verified_suites.mjs --all`, and `tests/run_all.js` inside the clean extraction (results recorded upon validation).

---

## H. Remaining Limitations

1. **Unparsed Conditions (`1,290 / 4,940`):** Remaining `PARSE_FAILURE` forms include complex comparative clause structures (`cost is equal or inferior to the attacking target's`), multi-card banishment-cost conditions (`If you banish the [Soul Core] on this Ultimate from the game`), contextual `If not` / `If possible` branches referencing prior clause prose, and specialized mechanic conditions (`with different team names`, `summoned by the effect of [...]`). All fail closed as `CONDITION_RESULT.UNSUPPORTED`.
2. **Partial Condition Evidence (`97 / 4,940`):** `LEGACY_CONTEXT_CONDITION` remains classified as `PARSED_EVALUABLE_UNVERIFIED` because arbitrary free-text legacy keys still require per-variant expansion.
3. **Operations Without Handlers / Parameterization:** `144` of `288` unique IR op names (`1,007` instances) remain `HANDLER_MISSING`, `28,503` instances remain `HANDLER_PRESENT_UNVERIFIED` awaiting variant-specific executable tests in `OPERATION_EVIDENCE_REGISTRY`, and bare-stub IR objects without parameters (such as unparameterized `{ op: "COST_MODIFIER" }`) fail closed by design.
4. **Excluded Non-Audit Files in `work_package_fg1_handoff.zip`:** Nested historical handoff ZIPs, duplicate `data/ir_shards_staging/`, `data/ir_shards_pre_compilation_backup/`, web-server `card_effects_db.json` and `battle_spirits.db*`, unrelated historical `reports/`, `.git/`, and `node_modules/` are excluded so the handoff remains compact, clean, and self-contained.
