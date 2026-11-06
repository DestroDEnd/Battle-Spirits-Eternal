# Battle Spirits Eternal - Phase 2 Compiler Report

Generated: 2026-11-06T04:48:52.445Z

## 1. Executive Summary
- **Total Cards Processed**: 14,611
- **Cards with Effects**: 14,237 (97.4%)
- **Total Ability Blocks Parsed**: 34,860
- **Total Clauses Parsed**: 49,326
- **Compiled Clauses (Structured IR)**: 49,326
- **Unsupported Clauses (Manual Fallback)**: 0
- **Overall Clause Coverage**: **100.00%**
- **Compilation Speed**: 41841ms (349 cards/sec)
- **IR Shards Generated**: 446 set/prefix shards in `data/ir_shards/`

---

## 2. Coverage by Card Type

| Card Type | Total Cards | Total Clauses | Compiled IR | Unsupported | Coverage % |
|:---|:---:|:---:|:---:|:---:|:---:|
| Spirit | 10,229 | 34,306 | 34,306 | 0 | **100.0%** |
| Brave | 895 | 2,819 | 2,819 | 0 | **100.0%** |
| Magic | 1,594 | 5,156 | 5,156 | 0 | **100.0%** |
| Ultimate | 373 | 1,156 | 1,156 | 0 | **100.0%** |
| Nexus | 1,377 | 5,034 | 5,034 | 0 | **100.0%** |
| Contract Nexus | 59 | 437 | 437 | 0 | **100.0%** |
| Token Spirit | 2 | 7 | 7 | 0 | **100.0%** |
| Contract Spirit | 80 | 403 | 403 | 0 | **100.0%** |
| Contract Ultimate | 2 | 8 | 8 | 0 | **100.0%** |

---

## 3. Detected Keywords Catalog (Top 35)

| Keyword | Occurrences |
|:---|:---:|
| [Burst] | 1,063 |
| [Brave] | 876 |
| [Advent] | 786 |
| [Team] | 755 |
| [Contract Advent] | 702 |
| [Mirage] | 494 |
| [Accel] | 476 |
| [Core Charge] | 315 |
| [Heavy Armor] | 280 |
| [Rush] | 264 |
| [Change] | 264 |
| [Grand Skill] | 259 |
| [Grand Field] | 249 |
| [Rebirth] | 234 |
| [Ultimate Trigger] | 214 |
| [Contract Pre-Advent] | 197 |
| [High Speed] | 185 |
| [Tribute] | 131 |
| [Seal] | 119 |
| [Crush] | 107 |
| [Unleash] | 105 |
| [Charge] | 100 |
| [Clash] | 93 |
| [Show Up] | 93 |
| [A.T. Field] | 89 |
| [Assault] | 82 |
| [Friend] | 82 |
| [Contract Field] | 80 |
| [On Stage] | 63 |
| [Armor] | 58 |
| [Immortality] | 58 |
| [Awaken] | 57 |
| [Soul State] | 55 |
| [Neo-Core Charge] | 53 |
| [Holy Life] | 51 |

---

## 4. Top Unsupported Clause Templates (Work Queue for Phase 3/4)

These templates are captured in the `unsupported` array of card abilities and provide an automated work queue sorted by card frequency:

| Rank | Frequency | Template |
|:---:|:---:|:---|

---

## 5. Architectural Compliance Verification
- **Rule 1 (No Name-Keyed Checks)**: All card effects compile through generic primitives in `compiler/` without any card-name branching.
- **Rule 2 (Test-First & Golden ASTs)**: Comprehensive golden tests in `tests/golden_compiler.test.js` validate key cards (*Evil Flame*, *Evil Draw*, *Birgoyle*, *New-Siegfried*, *Siegfrieden XV*, *Gaianohoko*, *Javad*, *Curse Swordsman*, *Holy Grail*, *Gran-Dolbalkan*).
- **Rule 3 (Single Source of Rules)**: Sharded IR data matches Eternal format timing, burst criteria, and links.
- **Rule 4 (Card Number Identity)**: Every compiled IR object is keyed by canonical card number.
- **Rule 6 (Full Verification)**: 100% automated test suite passing with zero regressions.
