# Phase 4C.1.1 — Coexisting Effects and Target Restrictions Correction Report

**Phase:** 4C.1.1 (Corrective Phase for DEF-IMMUNITY-ABS-01)  
**Date:** November 14, 2026  
**Auditor & Implementer:** Antigravity Engine Architecture Team  
**Scope:** Reconcile dropped coexisting operations and collapsed target restrictions across all 73 conditional destruction immunity abilities identified in Phase 4B.4B / Phase 4B.4B.1.

---

## 1. Executive Summary & Root Cause Analysis

During the independent review of Phase 4C.1, two critical issues were highlighted regarding the conditional destruction-immunity correction:
1. **Apparent dropping of coexisting operations**: The Phase 4C.1 diff and validation exports appeared to drop other effects in abilities containing multiple operations (e.g. `IMMUNITY`, `ADD_SYMBOL`, `GLOBAL_RESTRICTION`), leaving only `INDESTRUCTIBLE`.
2. **Loss of target restrictions**: Abilities protecting named cards (e.g. Contractor Grandwalker Nexuses), specific families, or allied groups were collapsed to `target: "self"`.

### Root Cause Analysis

1. **Deliverable Export Script Filtering (Reporting Artifact)**:
   In Phase 4C.1's deliverable generation script (`scratch/generate_phase4c1_deliverables.mjs`), `newIRStr` was constructed by filtering clauses with:
   ```javascript
   matchingOps = ab.clauses.filter(c => c.op?.op === 'INDESTRUCTIBLE').map(c => c.op);
   ```
   While `oldIRStr` contained all operations from the legacy IR, the newly generated IR column only included `INDESTRUCTIBLE` operations. In the compiler itself, most coexisting operations (`IMMUNITY`, `BP_BUFF`, `GLOBAL_RESTRICTION`, `SUMMON`, `GRANT_FAMILY`, `EXHAUST`) were already being compiled.
2. **Genuine Compiler Clause-Splitting Defect (`BATTLE-SPIRITS-A319#a2`)**:
   `BATTLE-SPIRITS-A319#a2` contains:
   `"This Spirit can't be destroyed by BP comparison. Also, by putting two cores from your six-colored Grandwalker Nexuses to any Spirits, this Spirit gains one symbol for each "Galaxian"/"Avatar" family Spirit you control ."`
   In sentence 2, `compiler/clause_splitter.js` previously only recognized `"By [action]ing ..., [effect]"` at the beginning of an entire line, failing to split compound sentences starting with `"Also, by putting ..., this Spirit gains ..."`. Consequently, only `MOVE_CORE` was generated, dropping `ADD_SYMBOL`.
3. **Target Determination Defaulting to `"self"` (`compiler/clause_patterns.js`)**:
   The initial Phase 4C.1 target regexes only looked for `"all your spirits"`, `"all your nexuses"`, and basic family spirits, falling back to `target: 'self'` for named Grandwalker Nexuses (Contractor Nuadha, Indra, Brigit, Zeus), multi-family groups, and named spirits.

### Summary of Corrections Delivered in Phase 4C.1.1

- **Clause Splitter Enhancement**: `compiler/clause_splitter.js` now splits `"By ..., ..."` within sentences, restoring `ADD_SYMBOL` for `BATTLE-SPIRITS-A319#a2` without breaking standard flash activations.
- **Full Ability-Level IR Preservation**: Export deliverables now report full ability-level IR, documenting every coexisting operation in both legacy and new IR.
- **Structured Target Filter Compiler Implementation**: `compiler/clause_patterns.js` now extracts structured target filters (`types`, `name`/`names`, `family`/`families`, `color`, `includeSelf`, `excludeNames`).
- **Engine Filter Evaluation**: `engine/continuous.js` and `engine/zones.js` evaluate `matchesTargetFilter` across field stacks and dynamic modifiers for both battle and effect destruction.
- **Zero Regressions**: 13/13 new verification tests pass, 21/21 Phase 4C.1 tests pass, and all 154 tracked test suites pass.

---

## 2. Detailed Investigation of All 12 Multi-Operation Cards

Every multi-operation card identified in the Phase 4C.1 exports was independently investigated:

| Ability ID | Card Name | Canonical Effect Clauses | Old IR Operations | Corrected New IR Operations | Status & Semantic Fidelity Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`BATTLE-SPIRITS-A12084#a2`** | The SandseaPrince Namirnes | 1. Can't be destroyed by opposing effects.<br>2. While hand <= 4, hand unaffected. | `[INDESTRUCTIBLE, IMMUNITY]` | `[INDESTRUCTIBLE, IMMUNITY]` | **PRESERVED**: `IMMUNITY` (`immuneTo: 'OPPOSING_EFFECTS'`) retained in full. |
| **`BATTLE-SPIRITS-A319#a2`** | The BullDragonDeity Dragonic-Taurus X | 1. Can't be destroyed by BP comparison.<br>2. Put 2 cores: gains 1 symbol per Galaxian/Avatar. | `[INDESTRUCTIBLE, ADD_SYMBOL]` | `[INDESTRUCTIBLE, MOVE_CORE, ADD_SYMBOL]` | **CORRECTED & RESTORED**: Fixed clause splitter; both `MOVE_CORE` (cost) and `ADD_SYMBOL` (effect) emitted. |
| **`BATTLE-SPIRITS-A13512#a1`** | The WavespearGrandseaPirate Carmille | 1. Has zero symbols.<br>2. Can't be destroyed by BP comparison. | `[ADD_SYMBOL, INDESTRUCTIBLE]` | `[SET_SYMBOL, INDESTRUCTIBLE]` | **PRESERVED**: `SET_SYMBOL` (count 0) properly replaces legacy miscompiled `ADD_SYMBOL`. |
| **`BS58-029#a3`** | The PanzerBuild Wiesel | 1. Neither deck can be discarded.<br>2. Can't be destroyed by opposing effects. | `[GLOBAL_RESTRICTION, INDESTRUCTIBLE]` | `[GLOBAL_RESTRICTION, INDESTRUCTIBLE]` | **PRESERVED**: Deck-discard protection (`GLOBAL_RESTRICTION`) retained in full. |
| **`BS59-030#a1`** | The PanzerBuild Fennek | 1. Can't be destroyed by opposing effects.<br>2. Mirage set: +3000 BP. | `[INDESTRUCTIBLE, BP_BUFF]` | `[INDESTRUCTIBLE, BP_BUFF]` | **PRESERVED**: `BP_BUFF` (3000 BP, THIS_TURN) retained in full. |
| **`BS61-X05#a2`** | The GiantArmorSacredBeast Tepeyollotl | 1. Can't be destroyed by BP comparison.<br>2. Move 2 cores from White Grandwalker.<br>3. Activate [Grand Skill]. | `[INDESTRUCTIBLE, MOVE_CORE, TREAT_RULE]` | `[INDESTRUCTIBLE, MOVE_CORE, KEYWORD_RULE]` | **PRESERVED**: `KEYWORD_RULE` ("Grand Skill") + `MOVE_CORE` correctly emitted. |
| **`BS74-064#a2`** | The Dana Sniper | 1. Contractor Nuadha Grandwalker Nexuses can't be destroyed.<br>2. Destruction effects unpreventable. | `[INDESTRUCTIBLE, COST_MODIFIER]` | `[INDESTRUCTIBLE, COMBAT_RESTRICTION]` | **CORRECTED**: Target corrected to Contractor Nuadha; `COMBAT_RESTRICTION` retained. |
| **`BS75-042#a1`** | The BabyElectricDragon Bilijvern | 1. Contractor Indra Grandwalker Nexuses can't be destroyed.<br>2. Void cores: summon this Mirage. | `[INDESTRUCTIBLE, SUMMON]` | `[INDESTRUCTIBLE, SUMMON]` | **CORRECTED**: Target corrected to Contractor Indra; Mirage `SUMMON` retained. |
| **`BS76-064#a2`** | Lotus Bow | 1. Can't be destroyed by opposing effects.<br>2. Gains Hunter Beast family. | `[INDESTRUCTIBLE, GRANT_FAMILY]` | `[INDESTRUCTIBLE, GRANT_FAMILY]` | **PRESERVED**: `GRANT_FAMILY` ("Hunter Beast") retained in full. |
| **`BS76-063#a2`** | The SilverRingBlade Twinwheel | 1. Exhaust this Nexus.<br>2. Contractor Brigit Grandwalker Nexuses can't be destroyed. | `[EXHAUST, INDESTRUCTIBLE]` | `[EXHAUST, INDESTRUCTIBLE]` | **CORRECTED**: Target corrected to Contractor Brigit; `EXHAUST` cost retained. |
| **`CB21-X05#a3`** | Nagisa Kaworu -Unit-13 Plugsuit- | 1. Can't be destroyed by opposing effects.<br>2. While braved: unaffected by opposing effects. | `[INDESTRUCTIBLE, IMMUNITY]` | `[INDESTRUCTIBLE, IMMUNITY]` | **PRESERVED**: Brave-conditional `IMMUNITY` retained in full. |
| **`26RBS02-X13#a0`** | The Puppeteer Marinel | 1. Target 1 Cost <= 6 Spirit.<br>2. During this turn, can't be destroyed by BP comparison. | `[COST_MODIFIER, INDESTRUCTIBLE]` | `[TARGET_CARD, INDESTRUCTIBLE]` | **PRESERVED**: `TARGET_CARD` correctly replaces legacy spurious `COST_MODIFIER`. |

---

## 3. Target Restriction Audit Across All 73 Abilities

The target phrasing of all 73 abilities was audited against canonical card text:

| Target Category | Count | Example Cards | Structured Filter Schema |
| :--- | :---: | :--- | :--- |
| **Source Self** | 56 | `BS25-028`, `BS40-CP01`, `CB01-047`, `SD28-004` | `target: 'self'` |
| **Named Grandwalker Nexuses** | 4 | `BS55-003` (Zeus), `BS74-064` (Nuadha), `BS75-042` (Indra), `BS76-063` (Brigit) | `{ side: 'self', types: ['Grandwalker Nexus', 'Nexus'], name: '<Name>' }` |
| **Family / Multi-Family Spirits** | 7 | `CB05-039` (Ultimate/Mega/Armor), `BS46-076` (Winged Beast Spirits/Ultimates), `BS52-TX03` (Primal), `CB04-038` (Kamen), `CB05-037` (Champion), `CB26-036` (NEXT), `A15001` (Luminas) | `{ side: 'self', types: ['Spirit' / 'Ultimate'], family/families: [...] }` |
| **Named Spirits / Allied Groups** | 3 | `CB10-061` ("Arms"-named), `CB10-014` (Self + Zonjis/Barlckxs), `CB13-008` (Self + Mothership Nexuses) | `{ side: 'self', types: [...], name/names: [...], includeSelf: true }` |
| **Targeted Individual** | 1 | `26RBS02-X13#a0` (Target one of your Cost 6 or less Spirits) | `target: 'target'` |
| **Complex Set Exclusions** | 1 | `CB17-069-A7541#a1` (Besides "Sai, Gorilla, Zou", all "Core Medal" Nexuses and "OOO") | `{ side: 'self', names: [...], excludeNames: ['Sai, Gorilla, Zou Core Medal'] }` |
| **Total** | **73** | | |

### Structured Target Schema Conventions

The compiler strictly adheres to the engine's structured target filter convention:
- `side`: `'self'` | `'opp'` | `'both'`
- `types`: array of applicable types (e.g. `['Grandwalker Nexus', 'Nexus']` or `['Spirit', 'Ultimate']`)
- `name` / `names`: substring match against `card.name`
- `family` / `families`: checks against card families
- `color`: checks against card colors
- `includeSelf`: boolean indicating the source card is included in addition to filtered cards
- `excludeNames`: array of explicitly excluded card names

---

## 4. Engine Enforcement Architecture

The engine was updated to enforce destruction immunity target filters across all destruction entrypoints:

1. **`engine/continuous.js:matchesTargetFilter(tf, stack, sourceSt, controller)`**:
   Evaluates target filters against candidate stacks, checking `types`, `color`, `family`/`families`, `name`/`names`, `excludeNames`, and `includeSelf`.
2. **`engine/continuous.js:isImmune(state, stack, sourceCard, effectType, options)`**:
   Evaluates dynamic passive abilities on all controller field stacks. When evaluating an `INDESTRUCTIBLE` ability, it ensures `matchesTargetFilter` passes before granting immunity, preventing cards from protecting themselves with third-party abilities (e.g., Bilijvern is not protected by its own Contractor Indra ability).
3. **`engine/zones.js:moveCard`**:
   During physical card moves (destruction to grave), both active continuous modifiers and passive field abilities evaluate `matchesTargetFilter`. Destructions targeting non-matching cards succeed while destructions targeting matching cards are blocked.
4. **`engine/ops/index.js:executeOp('INDESTRUCTIBLE')`**:
   Propagates `targetFilter`, `sourceStackId`, and `side` onto dynamic modifiers created during effect resolution.

---

## 5. Verification Test Suite & Results

A dedicated test suite was implemented in `tests/phase4c1_1_coexisting_effects_and_targets.test.js`:
- **Test 1**: `BATTLE-SPIRITS-A12084#a2` hand immunity and destruction immunity preservation -> **PASS**
- **Test 2**: `BATTLE-SPIRITS-A319#a2` symbol addition and destruction immunity preservation -> **PASS**
- **Test 3**: `BS58-029#a3` deck-discard restriction and destruction immunity preservation -> **PASS**
- **Test 4**: `BS61-X05#a2` Grand Skill activation, core move, and destruction immunity preservation -> **PASS**
- **Test 5**: `BS75-042#a1` Mirage summon trigger and destruction immunity preservation -> **PASS**
- **Test 6**: `BS76-064#a2` Hunter Beast family grant and destruction immunity preservation -> **PASS**
- **Test 7**: `CB21-X05#a3` Brave-conditional effect immunity and destruction immunity preservation -> **PASS**
- **Test 8**: `BS74-064#a2` targets Contractor Nuadha Grandwalker Nexuses, NOT self -> **PASS**
- **Test 9**: `BS75-042#a1` targets Contractor Indra Grandwalker Nexuses, NOT self -> **PASS**
- **Test 10**: `BS76-063#a2` targets Contractor Brigit Grandwalker Nexuses, NOT self -> **PASS**
- **Test 11**: Target patterns for `BS55-003`, `CB05-039`, `CB10-061`, `CB10-014` -> **PASS**
- **Test 12**: Engine execution proving selective Grandwalker protection in live game state -> **PASS**
- **Test 13**: Engine execution proving dynamic activated target-filtered modifiers -> **PASS**

### Test Suite Execution Summary

- `tests/phase4c1_1_coexisting_effects_and_targets.test.js`: **13/13 PASS** (0 failures, 100%)
- `tests/phase4c1_conditional_destruction_immunity.test.js`: **21/21 PASS** (0 failures, 100%)
- Tracked Full Test Suite: **154/154 PASS** (0 failures, 100%)

---

## 6. Deliverable Index

All required Phase 4C.1.1 deliverables have been exported and verified:

1. **Validation Ledger**:
   [phase4c1_1_affected_card_validation.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/phase4c1_1_affected_card_validation.csv)  
   *(Local copy: [phase4c1_1_affected_card_validation.csv](file:///C:/Users/namis/Downloads/BSP/reports/phase4c1_1/phase4c1_1_affected_card_validation.csv))*
2. **IR Diff Ledger**:
   [phase4c1_1_ir_diff.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/phase4c1_1_ir_diff.csv)  
   *(Local copy: [phase4c1_1_ir_diff.csv](file:///C:/Users/namis/Downloads/BSP/reports/phase4c1_1/phase4c1_1_ir_diff.csv))*
3. **Regression Test Results**:
   [phase4c1_1_regression_test_results.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/phase4c1_1_regression_test_results.csv)  
   *(Local copy: [phase4c1_1_regression_test_results.csv](file:///C:/Users/namis/Downloads/BSP/reports/phase4c1_1/phase4c1_1_regression_test_results.csv))*
4. **Unsupported Patterns Ledger**:
   [phase4c1_1_unsupported_patterns.csv](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/phase4c1_1_unsupported_patterns.csv)  
   *(Local copy: [phase4c1_1_unsupported_patterns.csv](file:///C:/Users/namis/Downloads/BSP/reports/phase4c1_1/phase4c1_1_unsupported_patterns.csv))*
5. **Completion Report & PDF**:
   [phase4c1_1_correction_report.md](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/phase4c1_1_correction_report.md)  
   [phase4c1_1_correction_report.pdf](file:///C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/phase4c1_1_correction_report.pdf)
