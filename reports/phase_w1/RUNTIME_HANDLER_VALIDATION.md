# RUNTIME HANDLER VALIDATION REPORT
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:39:46.252Z
**Subsystem:** `engine/keywords/`, `engine/continuous.js`, `engine/zones.js`

---

## 1. Executive Summary

Every one of the 348 Wiki keywords was evaluated inside the runtime engine (`KeywordRegistry`) to distinguish genuine executable lifecycle hooks and action functions from shared handlers, continuous rule delegations, and recognition-only entries.

| Implementation Tier | Keyword Count | Description |
| :--- | :--- | :--- |
| **Real Independent Implementation** | **90** | Dedicated keyword hook implementations or dedicated action functions. |
| **Shared Verified Implementation** | **147** | Inherited implementation sharing verified semantic parity with a base mechanic. |
| **Continuous / Zone Delegated** | **28** | Handled continuously by `engine/continuous.js` (Armor family) or core zone systems (`engine/zones.js`, Burst, Advent). |
| **Registry Placeholder / Identity** | **83** | Registered in `KeywordRegistry` for format legality and card IR identity without custom mechanics. |
| **Unimplemented** | **0** | Completely absent from runtime registry. |
| **Total Evaluated** | **348** | 100% of canonical Wiki keywords accounted for. |

---

## 2. Event Hook & Action Distribution

Keywords with active lifecycle hooks connect to the following EventBus channels:
- `ATTACK_DECLARED`: Clash, Crush, Wave Crush, XV Crush, Assault, Grand Assault, Dark Assault, Infinite Blade, U-Trigger, Consecutive Blade, etc.
- `BLOCK_DECLARED`: Curse, Windstorm, Fierce Windstorm, Chaotic Holy Life.
- `LIFE_REDUCED`: Holy Life, Ultra Holy Life, Chaotic Holy Life, Heaven Holy Life.
- `DESTROYED` / `onBattleDestroyed`: Curse, True-Curse, Immortality, Stampede.
- `BATTLE_END`: Curse, Soar, Rumble, Brilliance, Chaotic Holy Life.
- `MAGIC_USED`: Ice Wall, Amplify, Dispersion.
- `BP_COMPARE`: Ultra Awaken, Rekka Consecutive Blade.
- `STEP_START` (Refresh): Spellbind.

Keywords with dedicated direct action functions include:
- Whirlwind (`executeWhirlwind`), Accel (`executeAccel`), Mirage (`setMirage`), Rebirth (`flipCard`), Change (`executeChange`), High Speed (`executeHighSpeedSummon`), Seal (`executeSeal`), Unleash (`executeUnleash`), Soul Drive (`executeSoulDrive`), Rush (`hasRushActive`), Catalyze (`executeCatalyze`), Ultimate Trigger (`executeUTrigger`), Bunshin (`executeBunshin`), Load (`executeLoad`), Tribute (`executeTribute`), Poison Blade (`executePoisonBlade`), etc.

---

## 3. Sample Runtime Classification Table

| Canonical Name | Category | Registered | Classification | Execution Path |
| :--- | :--- | :--- | :--- | :--- |
| **Absolute Unleash** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeUnleash` |
| **Accel** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:executeAccel` |
| **Advent** | All | YES | `CONTINUOUS_ZONE_DELEGATED` | `engine/zones.js, engine/state.js, engine/flow.js` |
| **Astral Unleash** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeUnleash` |
| **Astromulet** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Celestial Unleash** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeUnleash` |
| **Change** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:executeChange` |
| **Charge** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Contract Advent** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Count Break** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Contract Unleash** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeUnleash` |
| **Creator Unleash** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeUnleash` |
| **Dark Esoterica** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Extreme Drive** | All | YES | `CONTINUOUS_ZONE_DELEGATED` | `engine/zones.js, engine/state.js, engine/flow.js` |
| **Flag Contract Advent** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:executeFlagContractAdvent` |
| **Grand Advent** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Horoscoping** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Illusive Rebirth** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:flipCard` |
| **Manifest** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Minor Unleash** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeUnleash` |
| **Primordial Unleash** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeUnleash` |
| **Pyroxene Esoterica** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Pyroxene Seal** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeSeal` |
| **Rebirth** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:flipCard` |
| **Return to Prime** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Reverse Contract Advent** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Rush** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:hasRushActive` |
| **Seal** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:executeSeal` |
| **Seal Flag Contract Advent** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeFlagContractAdvent` |
| **Seal Manifest** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Six Heaven Rebirth** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:flipCard` |
| **Six Heaven Rush** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:hasSixHeavenRushActive` |
| **Tenma Advent** | All | YES | `PLACEHOLDER_RECOGNITION` | `engine/keywords/registry.js (No Active Hook/Function)` |
| **Tenma-Kagemusha** | All | YES | `SHARED_EQUIVALENT` | `engine/keywords/ -> fn:executeKagemusha` |
| **Tribute** | All | YES | `REAL_INDEPENDENT` | `engine/keywords/ -> fn:executeTribute` |
*(Showing 35 of 348 records; full matrix saved in `reports/phase_w1/runtime_handler_audit.json`)*
