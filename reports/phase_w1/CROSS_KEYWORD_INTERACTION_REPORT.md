# CROSS-KEYWORD AND SYSTEM INTERACTION AUDIT REPORT
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:34:24.964Z

---

## 1. Executive Summary

Individually implemented keyword mechanics must maintain integrity when colliding in complex combat, continuous restriction, and simultaneous trigger scenarios. 8 core cross-keyword interaction vectors were audited across production game flow.

| Interaction ID | Colliding Mechanics | System Resolution Path | Test Evidence Tier | Verification Status |
| :---: | :--- | :--- | :---: | :--- |
| **CKI-01** | Armor / Heavy Armor / Ultra Heavy Armor × Targeted Effect Destruction | `engine/continuous.js -> isImmune` | **E3** | `VERIFIED_CORRECT` |
| **CKI-02** | Clash / True-Clash × Ground / Flying Blocker Restrictions (Leap) | `engine/index.js -> resolveDirectHit & engine/combat.js` | **E2** | `VERIFIED_CORRECT` |
| **CKI-03** | Curse × BP Destruction Tie | `engine/keywords/wave1.js -> onBlockDeclared / onBattleEnd` | **E3** | `VERIFIED_CORRECT` |
| **CKI-04** | Consecutive Blade × Showdown | `engine/keywords/wave1.js & wave4.js` | **E2** | `VERIFIED_CORRECT` |
| **CKI-05** | Wave Crush × Additive Symbol Grants (+1 Symbol) | `engine/index.js -> resolveDirectHit (fixedSymbolZero)` | **E3** | `VERIFIED_CORRECT` |
| **CKI-06** | Rebirth (Face A / Face B) × Level Gating | `engine/keywords/registry.js -> getActiveKeywords` | **E3** | `VERIFIED_CORRECT` |
| **CKI-07** | Infinite Blade × Target Attack Restriction (Cannot Be Attacked) | `engine/keywords/wave1.js -> InfiniteBladeKeyword` | **E4** | `VERIFIED_CORRECT` |
| **CKI-08** | Burst × Trigger Counter | `engine/keywords/wave2.js & wave3.js` | **E2** | `VERIFIED_CORRECT` |

---

## 2. Technical Interaction Vector Analysis

### CKI-01: Armor / Heavy Armor / Ultra Heavy Armor × Targeted Effect Destruction
- **Colliding Mechanics:** `Armor / Heavy Armor / Ultra Heavy Armor, Targeted Effect Destruction`
- **System Execution Path:** `engine/continuous.js -> isImmune`
- **Rule Resolution Dynamics:** When an opposing Magic or Spirit effect targets an armor-protected spirit for destruction/bounce, isImmune intercepts before effect execution.
- **Test Evidence:** `tests/keyword_reconciled_mechanics.test.js & tests/keyword_condition_and_face_bindings.test.js` (`E3`)
- **Status:** `VERIFIED_CORRECT`

### CKI-02: Clash / True-Clash × Ground / Flying Blocker Restrictions (Leap)
- **Colliding Mechanics:** `Clash / True-Clash, Ground / Flying Blocker Restrictions (Leap)`
- **System Execution Path:** `engine/index.js -> resolveDirectHit & engine/combat.js`
- **Rule Resolution Dynamics:** Clash requires the opponent to block if able (mustBlockIfAble). If attacker has Leap, ground spirits cannot block, so mustBlockIfAble applies only to spirits with Flying.
- **Test Evidence:** `tests/keyword_registry.test.js (Leap)` (`E2`)
- **Status:** `VERIFIED_CORRECT`

### CKI-03: Curse × BP Destruction Tie
- **Colliding Mechanics:** `Curse, BP Destruction Tie`
- **System Execution Path:** `engine/keywords/wave1.js -> onBlockDeclared / onBattleEnd`
- **Rule Resolution Dynamics:** If both attacker and blocker are destroyed by mutual BP comparison, Curse onBattleEnd recognizes the blocker has already exited the field and avoids double-kill errors.
- **Test Evidence:** `tests/keyword_reconciled_mechanics.test.js` (`E3`)
- **Status:** `VERIFIED_CORRECT`

### CKI-04: Consecutive Blade × Showdown
- **Colliding Mechanics:** `Consecutive Blade, Showdown`
- **System Execution Path:** `engine/keywords/wave1.js & wave4.js`
- **Rule Resolution Dynamics:** Consecutive Blade forces simultaneous battle against 2 opposing spirits. Showdown isolates a 1v1 battle, overriding multi-target battle declarations.
- **Test Evidence:** `tests/keyword_registry.test.js (Consecutive Blade)` (`E2`)
- **Status:** `VERIFIED_CORRECT`

### CKI-05: Wave Crush × Additive Symbol Grants (+1 Symbol)
- **Colliding Mechanics:** `Wave Crush, Additive Symbol Grants (+1 Symbol)`
- **System Execution Path:** `engine/index.js -> resolveDirectHit (fixedSymbolZero)`
- **Rule Resolution Dynamics:** Wave Crush fixes the spirit symbol to zero. Additive symbol grants (+1 Red symbol) cannot override fixed-to-zero restriction per official Bandai priority hierarchy.
- **Test Evidence:** `tests/keyword_reconciled_mechanics.test.js` (`E3`)
- **Status:** `VERIFIED_CORRECT`

### CKI-06: Rebirth (Face A / Face B) × Level Gating
- **Colliding Mechanics:** `Rebirth (Face A / Face B), Level Gating`
- **System Execution Path:** `engine/keywords/registry.js -> getActiveKeywords`
- **Rule Resolution Dynamics:** Rebirth cards flip between Face A and Face B. getActiveKeywords evaluates stack.currentFace and stack.isFlipped to strictly gate Face A vs Face B keywords.
- **Test Evidence:** `tests/keyword_condition_and_face_bindings.test.js` (`E3`)
- **Status:** `VERIFIED_CORRECT`

### CKI-07: Infinite Blade × Target Attack Restriction (Cannot Be Attacked)
- **Colliding Mechanics:** `Infinite Blade, Target Attack Restriction (Cannot Be Attacked)`
- **System Execution Path:** `engine/keywords/wave1.js -> InfiniteBladeKeyword`
- **Rule Resolution Dynamics:** Infinite Blade targets an opposing spirit/ultimate. Opposing units with CANNOT_BE_ATTACKED continuous restriction cannot be selected as combat targets.
- **Test Evidence:** `tests/keyword_reconciled_mechanics.test.js` (`E4`)
- **Status:** `VERIFIED_CORRECT`

### CKI-08: Burst × Trigger Counter
- **Colliding Mechanics:** `Burst, Trigger Counter`
- **System Execution Path:** `engine/keywords/wave2.js & wave3.js`
- **Rule Resolution Dynamics:** When a Burst declares activation, Trigger Counter activates during the Burst declaration window before the Burst effect resolves.
- **Test Evidence:** `tests/keyword_registry.test.js` (`E2`)
- **Status:** `VERIFIED_CORRECT`

