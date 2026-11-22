# PHASE K.0 — DEFECT REMEDIATION REPORT

## Summary of Confirmed Foundational Defects

During Phase K.0 Stage A/B/C engine auditing, two foundational runtime defects (plus one case-sensitivity bug exposed by regression testing) were reproduced, fixed with minimal patches, and verified with dedicated regression tests:

### 1. `K0-DEF-01` — `resolveTargets('battling')` and relative battler condition ignored `state.combat`
- **Responsible Files & Functions:**
  - `engine/selectors.js`: `resolveTargets` (lines 914-942)
  - `engine/conditions.js`: `evaluateStructuredCondition` (`compareTo === 'ATTACK_TARGET' || 'OPPONENT_BATTLER'`)
- **Root Cause:** `game.declareAttack()` and `game.declareBlock()` (`engine/index.js`) store active combat state in `state.combat = { attackerStackId, attackerSide, blockerStackId }`, whereas `resolveTargets('battling')` and `conditions.js` only inspected `state.battle`.
- **Reproduction:** `K0-DEF-01` in `tests/work_package_k0_engine_health.test.js` failed with `NO_BATTLING_SPIRIT` during active `state.combat`.
- **Fix:** Added `state.combat` participant resolution (`attackerStackId` / `blockerStackId`) alongside `state.battle` in both `engine/selectors.js` and `engine/conditions.js`.
- **Verification:** `K0-DEF-01` passes; `2,349 / 2,349` full regression passes.

### 2. `K0-DEF-02` — `executeTargeting` / `queryCandidates` dropped `state` filter and mishandled `state: 'BATTLING'` and lowercase `'exhausted'`
- **Responsible Files & Functions:**
  - `engine/selectors.js`: `executeTargeting` and `queryCandidates`
  - `tests/helpers/card_e2e_framework.mjs`: `runCardAbilityE2E` (`eligStack.state`)
- **Root Cause:**
  1. `executeTargeting` did not propagate `op.state` / `op.selector?.state` / `op.target?.state` into `norm.filters.state`.
  2. `queryCandidates` checked `stack.state !== filters.state`, which always rejected `'BATTLING'` (because `stack.state` is `'REFRESHED' | 'EXHAUSTED' | 'HEAVY_EXHAUSTED'`) and failed case-sensitively on lowercase `'exhausted'` (`BATTLE-SPIRITS-A2148`, `BS01-040`).
- **Reproduction:** `K0-DEF-02` in `tests/work_package_k0_engine_health.test.js` selected `'OPP-BYSTANDER'` instead of `'OPP-BATTLER'`.
- **Fix:** Propagated `state` in `executeTargeting`, added active-combat participant matching when `filters.state` is `'BATTLING'` (case-insensitive), and made `stack.state` comparison case-insensitive.
- **Verification:** `K0-DEF-02` passes, `HIJ1-E2E-082` (`Dark Coffin`) & `HIJ1-E2E-083` (`Darkwitch`) pass, and `2,349 / 2,349` full regression passes.
