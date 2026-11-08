# Sequential Card Implementation Report: Phase 8 (BS09, SD15 & SD16)
## Battle Spirits Eternal: Deterministic Per-Card Logic Expansion

**Document Version**: 2.7.0 (Publication Grade)  
**Date**: November 7, 2026  
**Format Specification**: Battle Spirits Eternal Format Profile (`engine/rules/eternal.js`)  
**Target Sets**: BS09 (Booster Set 09: Super Battle of Transcendence), SD15 (Starter Deck 15: BattleAngelia Excel), SD16 (Starter Deck 16: Alexander-XIII)  
**Working Repository**: `c:\Users\namis\OneDrive\Documents\BSP`  

---

## 1. Executive Summary & Headline Metrics

Phase 8 of the Battle Spirits Eternal sequential deterministic card rollout has successfully compiled, tested, and verified deterministic per-card game logic for **Booster Set 09 (BS09)**, **Starter Deck 15 (SD15)**, and **Starter Deck 16 (SD16)**.

All implementations strictly adhere to Requirements **R1** (Sequential Deterministic Implementation), **R2** (Cataloging Ambiguous Cards Without Guessing), and **R3** (Comprehensive Reporting), as well as the core rules of `AGENTS.md` (zero `card.name ===` branches, canonical card number routing, structured IR compilation, and full regression test verification).

### Cumulative & Phase 8 Technical Metrics

| Metric Dimension | Phases 1–7 Total | Phase 8 (`BS09` + `SD15` + `SD16`) | Cumulative Total |
|---|:---:|:---:|:---:|
| **Canonical Cards in Scope** | 628 cards | **68 cards** | **696 cards** |
| ├── *Booster Set 09 (`BS09`)* | — | 50 cards | 50 cards |
| ├── *Starter Deck 15 (`SD15`)* | — | 9 cards | 9 cards |
| └── *Starter Deck 16 (`SD16`)* | — | 9 cards | 9 cards |
| **Total Cards Implemented** | 609 cards (97.0%) | **67 cards (98.5%)** | **676 cards (97.1%)** |
| ├── *Deterministic Effect Cards* | 558 cards | **67 cards** | **625 cards** |
| └── *Vanilla Base Cards (Pure Stats)* | 51 cards | **0 cards** | **51 cards** |
| **Total Cards Skipped (Requirement R2)** | 20 cards (3.2%) | **1 card (1.5%)** | **21 cards (3.0%)** |
| **Unsupported Clauses** | 0 clauses | **0 clauses** | **0 clauses** |
| **Automated Test Suites** | 60 suites | **+3 suites** | **63 suites** (103 run groups) |
| **Total Automated Tests Executed** | 448 tests | **+14 tests** | **462 passed, 0 failed (100%)** |
| **Empirical Adversarial Assertions** | 3,100 assertions | **+11 assertions** | **3,111 passed (100%)** |
| **Database & Shard Integrity Audit** | 14,611 cards | 14,611 cards | **14,611 audited, 0 errors** |
| **Rule 1 Compliance (`card.name ===`)** | 0 occurrences | 0 occurrences | **0 occurrences** |

---

## 2. Phase 8 Sets Detailed Breakdown

### 2.1 Booster Set 09 (BS09: Super Battle of Transcendence)
* **Total Canonical Cards**: 50 cards.
* **Deterministic Effect Cards Implemented**: 49 cards.
* **Vanilla Cards Implemented**: 0 cards.
* **Skipped Cards Cataloged (Requirement R2)**: 1 card:
  * `BS09-X39 The MagicalEmpress Ambrocius`: Non-standard legacy *"Removed Zone"* (除外空間) dependency without standardized modern exclusion tracking and cast-from-removed semantics.
* **Key Mechanics Implemented**:
  * Siegwurm-Nova: `BS09-X35 The SupernovaDragon Siegwurm-Nova` (`[Tribute: Cost 6 or more → Void]`, `RECOVER_LIFE` to 5 on summon, attack destruction, and `[Clash]`).
  * Beldegaulle: `BS09-X36 The SevenShogun Beldegaulle` (`[Immortality: Cost 4/5]` graveyard summoning and summon destruction).
  * Ragna-Rock: `BS09-X37 The DoomKnightLord Ragna-Rock` (`[Tribute: Cost 6 or more → Void]`, summon exhaust, and battle refresh).
  * Odin Type-X: `BS09-X38 The ImpregnableKnightLord Odin Type-X` (summon bounce and `[Armor: All Colors]`).
  * JungleEmperor Volza: `BS09-027 The JungleEmperor Volza` (`[Tribute]`, battle refresh, and blocker core removal restriction).

### 2.2 Starter Deck 15 (SD15: BattleAngelia Excel)
* **Total Canonical Cards**: 9 cards.
* **Deterministic Effect Cards Implemented**: 9 cards.
* **Vanilla Cards Implemented**: 0 cards.
* **Skipped Cards**: 0 cards.
* **Key Mechanics Implemented**:
  * Divine Spirit Braves: `SD15-006 Angeloid` (Divine Spirit Brave condition and summon effect).
  * Attack Debuff & Hand Bounce: `SD15-X01 The BattleAngelia Excel` (attack BP debuff, passive bounce/draw on opposing destruction, and high-level destruction).
  * Draw & Debuff Spells: `SD15-008 Magical Draw` (main draw/deck reveal, flash BP debuff).

### 2.3 Starter Deck 16 (SD16: Alexander-XIII)
* **Total Canonical Cards**: 9 cards.
* **Deterministic Effect Cards Implemented**: 9 cards.
* **Vanilla Cards Implemented**: 0 cards.
* **Skipped Cards**: 0 cards.
* **Key Mechanics Implemented**:
  * Fighting Spirit Braves: `SD16-007 Loader-Arms` (Fighting Spirit Brave condition, summon core move, attack destroy).
  * Giant & Mill Synergies:
    * `SD16-X01 The GiantEmperor Alexander-XIII` (summon destroy, attack mill deck, attack exhaust/refresh).
    * `SD16-004 The BattleMaul Gordon` (`[Crush]` mill ability).
    * `SD16-001 The Giant Platoon` (passive mill deck).

---

## 3. Verification & Compliance Evidence

```
$ npm.cmd test
Found 63 test suites:
✔ BS09 Card Effects & Mechanics Regression Suite: 6 passed
✔ SD15 Card Effects & Mechanics Regression Suite: 4 passed
✔ SD16 Card Effects & Mechanics Regression Suite: 4 passed
ℹ tests 462
ℹ suites 103
ℹ pass 462
ℹ fail 0
ℹ duration_ms 12944.0953
All test suites passed successfully.

$ node scripts/adversarial_m3_probe.mjs
ALL ADVERSARIAL CHECKS PASSED SUCCESSFULLY (3111 assertions verified)

$ npm.cmd run audit:data
Phase 1 Data Integrity: 14,611 cards validated with 0 errors.
```

---

## 4. Next Chronological Sets (Phase 9 Roadmap)

1. **`BS10` (Booster Set 10: The Eight Stars' Vanguard)** — 66 canonical cards.
2. **`SD17`** — canonical starter set (9 canonical cards).
