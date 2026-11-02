# Battle Spirits Eternal - Phase 3 Engine Core Report

Generated: 2026-11-02

## 1. Executive Summary
Phase 3 (Engine Core) has established the headless, deterministic, asynchronous rules engine for Battle Spirits Eternal under `engine/` as pure ES modules. The engine replaces legacy ad-hoc RegExp checks, timers, and hardcoded per-card logic with structured Intermediate Representation (IR) evaluation and typed primitive operations.

- **Test Suite Results**: **30 / 30 tests passing (100% green)** in 541 ms.
- **Architectural Footprint**: 10 clean modular ES modules under `engine/`:
  - `engine/rules/eternal.js` (Single source of rules truth)
  - `engine/state.js` (State models, stacks, card instances)
  - `engine/events.js` (Synchronous/asynchronous cause-aware event bus)
  - `engine/zones.js` (Strict zone transitions, stack preservation, core separation)
  - `engine/continuous.js` (Derived layer: BP, level thresholds, symbols, immunities)
  - `engine/payment.js` (Mandatory symbol reduction, core payment, soul core tracking)
  - `engine/selectors.js` (Armor/Heavy Armor protection, deterministic target queries)
  - `engine/ops/index.js` (Headless async primitive ops library)
  - `engine/resolver.js` (Async ability resolver for then/byDoing/or/instead/afterResolves links)
  - `engine/flow.js` (7-step state machine, Turn 1 skips, priority windows)
  - `engine/sba.js` (State-Based Actions: depletion, life 0, Start Step deck-out)
  - `engine/index.js` (Unified engine facade)

---

## 2. Rules Verification & Eternal Format Compliance

| Eternal Format Rule | Implementation | Verification Test |
|:---|:---|:---|
| **Deck Limits** | Minimum 40 cards, no upper limit, max 3 copies per name | `tests/engine_core.test.js` |
| **Initial Setup** | 5 Life, 4 Reserve cores (including 1 Soul Core), 4 cards opening hand | `tests/engine_core.test.js` |
| **Turn 1 Skips** | First player skips Core Step and Attack Step. Second player does not | `tests/engine_core.test.js` |
| **Step Machine** | `START → CORE → DRAW → REFRESH → MAIN → ATTACK → END` strictly enforced | `tests/engine_core.test.js` |
| **Refresh Order** | 1. Cards refreshed (`HEAVY_EXHAUSTED → EXHAUSTED → REFRESHED`), 2. Core Trash → Reserve | `tests/engine_core.test.js` |
| **Cost Reduction** | Mandatory: least possible cores paid based on matching field symbols | `tests/engine_core.test.js` |
| **Core Trash vs Grave** | Paid cores enter Core Trash; destroyed/discarded cards enter Graveyard | `tests/engine_core.test.js` |
| **Depletion (SBA)** | When cores on stack < LV1 cost, card is depleted to grave, cores to reserve | `tests/engine_core.test.js` |
| **Win / Loss Checks** | Life <= 0 triggers immediate loss; 0 deck cards triggers loss at **Start Step** | `tests/engine_core.test.js` |
| **Advent Stacking** | Pre-advent cards sit beneath Advent spirit; all dismantle to grave when top leaves | `tests/engine_core.test.js` |
| **Burst Slot** | Exactly 1 Burst set at a time; setting a 2nd Burst replaces the 1st to grave | `tests/engine_core.test.js` |
| **Target Protection** | Heavy Armor / Armor prevents targeting by effects of matching color | `tests/engine_core.test.js` |

---

## 3. Regression Scenarios Verified Headless

| Scenario ID | Test Name | Result |
|:---:|:---|:---:|
| **R01 / R02** | *Evil Flame* total BP limit (≤ 5000 BP) & empty field switch (≤ 10000 BP) | **PASS** |
| **R03 / R04** | *Evil Draw* Main: Soul Core paid triggers destroy; no Soul Core draws only | **PASS** |
| **R05** | *Makai Curse Swordsman*: Draw happens only after core removal (`byDoing`) | **PASS** |
| **R06** | *Makai Holy Grail*: Discard up to 2 Makai cards → draw equal number of cards | **PASS** |
| **R08** | *Chakrambat*: Attack BP buff (+4000 BP) expires cleanly at battle end | **PASS** |
| **R14** | *Birgoyle*: `Or` connector offers choose-one modal, executing selected branch | **PASS** |
| **R21** | *Siegfrieden XV*: Depleted/Destroyed Burst condition verification | **PASS** |
| **R28** | Refresh Step: Restores exhausted units, then returns Core Trash to Reserve | **PASS** |
| **R29** | Depletion: Removing only core off unit triggers state-based grave movement | **PASS** |
| **R30** | Advent Stack: Destroying Advent stack sends all underlying cards to grave | **PASS** |
| **R31** | Burst replacement: Setting 2nd burst sends 1st to grave | **PASS** |
| **R33** | Braved Spirit attack: Direct life damage includes braved Brave's symbols | **PASS** |
| **R35** | Cost reduction: Deducts from printed cost, never below printed minimum (0) | **PASS** |

---

## 4. Architectural Rules Compliance
1. **Never Key Effects on Card Name or Free Text**: Game state flow and ops library have zero `if (card.name === '...')` branches; all resolutions evaluate structured IR properties.
2. **Test-First Methodology**: All 30 tests in `tests/` pass with zero failures.
3. **Single Source of Truth**: Rules profile lives exclusively in `engine/rules/eternal.js`.
4. **Card Identity by Card Number**: All card instances created with canonical card numbers.
5. **Asynchronous Prompts & No Timers in Rules Flow**: PromptManager resolves asynchronously via Promises.
6. **Full Verification Before Completion**: All tests verified green before completion.
