# KEYWORD TEST EVIDENCE REPORT
**Project:** Battle Spirits Eternal (BSP)
**Subsystem:** Keyword Engine & Compiler Reconciliation
**Generated:** 2026-11-22T07:04:49.375Z
**Test Harness:** Node.js native test runner (`node --test`)
**Status:** ALL 57 KEYWORD TESTS PASSING (100% SUCCESS RATE)

---

## 1. Executive Summary

A comprehensive automated test suite consisting of 57 dedicated keyword unit, integration, and end-to-end regression tests was executed against the reconciled codebase. Every test passed without warnings, timeouts, or failures.

| Metric | Result |
| :--- | :--- |
| **Total Test Suites** | 6 Suites |
| **Total Individual Tests** | 57 Tests |
| **Pass Count** | 57 (100.0%) |
| **Fail Count** | 0 (0.0%) |
| **Cancelled / Skipped** | 0 |
| **Total Execution Duration** | ~708 ms |
| **Regression Status** | ZERO REGRESSIONS |

---

## 2. Test Suite Breakdown

### Suite 1: `tests/keyword_ownership_and_infinite_blade.test.js` (3 Tests)
- **Test 1: Strict Keyword Ownership - Infinite Blade Regression Proof (BS33-X01 vs BS33-072 vs BS33-003)**
  - *Assertions:*
    - Asserts `BS33-X01` possesses native `Infinite Blade` (`card.keywords` length 1, includes `Infinite Blade`).
    - Asserts `BS33-X01` lists granted `Awaken` in `referencedKeywords`.
    - Asserts `BS33-072` has 0 native keywords (`card.keywords` length 0).
    - Asserts `BS33-072` lists `Infinite Blade`, `Awaken`, `True-Clash`, `Showdown`, `Consecutive Blade` in `referencedKeywords`.
    - Asserts `BS33-003` has 0 native keywords (`card.keywords` length 0).
    - Asserts `BS33-003` lists `Infinite Blade` in `referencedKeywords`.
- **Test 2: Compiler Catalog & Extraction - Colon Keywords & Parameters**
  - *Assertions:*
    - Validates `[Type: Driver]` extracts as `Type: Driver` with `parameter: null`.
    - Validates `[Type: Song]` extracts as `Type: Song`.
    - Validates `[Advent: Cost 6 or more]` extracts as `Advent` with `parameter: 'Cost 6 or more'`.
    - Validates `[Heavy Armor: Red/White]` extracts as `Heavy Armor` with `parameter: 'Red/White'`.
    - Validates unbracketed `Heavy Armor: Red/Blue` extracts with `bracketed: false`.
- **Test 3: Header Parser - Multi-Level Range Normalization and Keywords**
  - *Assertions:*
    - Asserts `[LV1-LV3]` normalizes to levels `[1, 2, 3]` without mangling subsequent header keyword `[Infinite Blade]`.
    - Asserts unbracketed header armor `[LV1][LV2] Heavy Armor: Red` assigns `Heavy Armor: Red` to `header.keyword` and strips it from `cleanBody`.

### Suite 2: `tests/keyword_reconciled_mechanics.test.js` (6 Tests)
- **Test 1: Reconciled Mechanic - Wave Crush**
  - *Assertions:*
    - Cost 8 spirit mills (1 + \lfloor 8/4 \rfloor = 3) cards directly to opposing `removed` zone.
    - Asserts opposing deck is reduced by exactly 3.
    - Asserts `state.combat.fixedSymbolZero === true`.
- **Test 2: Reconciled Mechanic - XV Crush**
  - *Assertions:*
    - Mills 10 cards to opposing `grave`.
    - Detects presence of opposing cards in `removed` zone.
    - Invokes authoritative `promptResolver.choose` for target selection up to total cost 15.
    - Destroys chosen target spirit without falling back silently.
- **Test 3: Reconciled Mechanic - Curse Blocker Destruction at Battle End**
  - *Assertions:*
    - Tags blocker stack id into `state.combat.curseTargetStackId` on block.
    - `onBattleEnd` hook checks `curseTargetStackId` and moves surviving blocker to grave.
- **Test 4: Reconciled Mechanic - Ultra Heavy Armor Color Immunity**
  - *Assertions:*
    - `isImmune` returns `true` for Red magic on spirit with `Ultra Heavy Armor: Red/White`.
    - `isImmune` returns `true` for White spirit effect.
    - `isImmune` returns `false` for Purple magic effect.
- **Test 5: Reconciled Mechanic - Clash mustBlockIfAble Enforced in Flow**
  - *Assertions:*
    - `game.resolveDirectHit('player')` returns `{ success: false, reason: 'MUST_BLOCK_IF_ABLE' }` when defender has refreshed spirits and `mustBlockIfAble` is true.
- **Test 6: Reconciled Mechanic - Infinite Blade Target Attack Without Exhaustion**
  - *Assertions:*
    - Attacker holding Soul Core declares target attack against opposing spirit.
    - `attacker.state` remains `REFRESHED` (attacker does not exhaust).
    - Opposing spirit is locked as `state.combat.blockerStackId`.

### Suite 3: `tests/keyword_registry.test.js` (25 Tests)
- Tests Clash, True-Clash, Crush, Great Crush, Holy Life, Ultra Holy Life, Windstorm, Fierce Windstorm, Accel, Mirage, Change, High Speed, Seal, Ultimate Trigger, True-Curse, Soul Drive, Brilliance, Consecutive Blade, True-Consecutive Blade, Whirlwind, True-Awaken, Toppa Awaken, Fortress, True Fortress, Rush, Six Heaven Rush, Catalyze, Leap, and keyword stacking extraction.

### Suite 4: `tests/keywords_waves4_5_6.test.js` (10 Tests)
- Tests Pursuit, Soar, Bunshin, Ice Wall, Load, Clock Up, On Stage, Rumble, Supreme Clash, Grand Assault, Ultra Awaken, Violent High Speed, Unleash, Immortality, Tribute, Unsheathe, Showdown, Spellbind, Spell Blight, Kagemusha, My Unit, Solo Part, Duet Part, Funnel, Flag Contract Advent, Soul Magic, Amplify, Level Up, Plunder, Draw Lock, God-Army, God Strike, Mealtiply, and Barrier.

### Suite 5: `tests/keywords_comprehensive_audit.test.js` (8 Tests)
- Comprehensive regression validations across multi-era combat mechanics.

### Suite 6: `tests/keyword_condition_and_face_bindings.test.js` (5 Tests)
- Tests level gating, face gating on Rebirth double-sided cards, Soul State restriction, and Advent condition enforcement.
