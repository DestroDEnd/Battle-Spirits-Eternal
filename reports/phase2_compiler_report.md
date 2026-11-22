# Battle Spirits Eternal - Phase 2 Compiler Report

Generated: 2026-11-21T11:46:39.848Z

## 1. Executive Summary
- **Total Cards Processed**: 14,443
- **Cards with Effects**: 14,074 (97.4%)
- **Total Ability Blocks Parsed**: 34,440
- **Total Clauses Parsed**: 49,331
- **Compiled Clauses (Structured IR)**: 48,251
- **Unsupported Clauses (Manual Fallback)**: 1,080
- **Overall Clause Coverage**: **97.81%**
- **Compilation Speed**: 192963ms (75 cards/sec)
- **IR Shards Generated**: 420 set/prefix shards in `data/ir_shards/`

---

## 2. Coverage by Card Type

| Card Type | Total Cards | Total Clauses | Compiled IR | Unsupported | Coverage % |
|:---|:---:|:---:|:---:|:---:|:---:|
| Spirit | 10,132 | 34,416 | 33,567 | 849 | **97.5%** |
| Brave | 884 | 2,795 | 2,765 | 30 | **98.9%** |
| Magic | 1,577 | 5,188 | 5,091 | 97 | **98.1%** |
| Ultimate | 368 | 1,152 | 1,136 | 16 | **98.6%** |
| Nexus | 1,345 | 4,951 | 4,872 | 79 | **98.4%** |
| Contract Nexus | 53 | 407 | 403 | 4 | **99.0%** |
| Token Spirit | 2 | 7 | 7 | 0 | **100.0%** |
| Contract Spirit | 80 | 407 | 402 | 5 | **98.8%** |
| Contract Ultimate | 2 | 8 | 8 | 0 | **100.0%** |

---

## 3. Detected Keywords Catalog (Top 35)

| Keyword | Occurrences |
|:---|:---:|
| [Brave Condition] | 867 |
| [Brave] | 867 |
| [Advent] | 779 |
| [Team] | 739 |
| [Contract Advent] | 701 |
| [Mirage] | 489 |
| [Grand Skill] | 325 |
| [Core Charge] | 309 |
| [Heavy Armor] | 266 |
| [Rush] | 261 |
| [Change] | 261 |
| [Grand Field] | 246 |
| [Accel] | 214 |
| [Ultimate Trigger] | 210 |
| [Contract Pre-Advent] | 189 |
| [High Speed] | 184 |
| [Soul Burst] | 169 |
| [Manifest] | 161 |
| [Tribute] | 131 |
| [Rebirth3] | 118 |
| [Seal] | 111 |
| [Crush] | 107 |
| [Unleash] | 105 |
| [Charge] | 99 |
| [Type] | 94 |
| [Show Up] | 93 |
| [Clash] | 92 |
| [During Nexus Brave] | 91 |
| [A.T. Field] | 89 |
| [Rebirth5] | 85 |
| [Assault] | 82 |
| [Friend] | 80 |
| [During Spirit Brave] | 75 |
| [On Stage] | 63 |
| [Warp Digivolve] | 59 |

---

## 4. Top Unsupported Clause Templates (Work Queue for Phase 3/4)

These templates are captured in the `unsupported` array of card abilities and provide an automated work queue sorted by card frequency:

| Rank | Frequency | Template |
|:---:|:---:|:---|
| 1 | 161 | `(When Summoned/Advents)` |
| 2 | 80 | `This effect can't be prevented by opposing effects.` |
| 3 | 17 | `Add the revealed card to the Hand.` |
| 4 | 17 | `+N` |
| 5 | 11 | `this effect can't be prevented by opposing effects.` |
| 6 | 9 | `Add the revealed card to your Hand.` |
| 7 | 8 | `This effect can't be prevented by "Armor"-named effects.` |
| 8 | 8 | `By discarding this card` |
| 9 | 5 | `Add the revealed cards to the Hand.` |
| 10 | 4 | `Add an Ultimate card among them to your Hand.` |
| 11 | 4 | `If you have two counters or more, this effect can't be prevented by opposing effects.` |
| 12 | 4 | `This effect can't be prevented by opposing Ultimate effects.` |
| 13 | 4 | `GWrule` |
| 14 | 3 | `This effect can't be prevented by [Barrage].` |
| 15 | 3 | `If you have one counter or more, this effect can't be prevented by opposing effects.` |
| 16 | 3 | `this Spirit remains on the Field, in the same condition.` |
| 17 | 3 | `This effect can't be prevented by [A.T. Field].` |
| 18 | 3 | `Among them, add an "Ultraman"-named card to the Hand.` |
| 19 | 3 | `Add an Ultimate card among them to the Hand.` |
| 20 | 2 | `Add a "Champion"/"Ultimate" family Spirit card among them to the Hand.` |
| 21 | 2 | `Add a "MechaGodzilla"/"Type-N Kiryu"-named Spirit card among them to the Hand.` |
| 22 | 2 | `Among them, add "Champion"/"Armor" family Spirit cards, one of each, to the Hand.` |
| 23 | 2 | `This effect can't be prevented by opposing effects, and the effects of the Spirit/Ultimate destroyed by this effect can't activate.` |
| 24 | 2 | `Among them, add an exactly-named "Grandwalkers Izanagi & Izanami", and a "Spiritual Beast"/"Plant Spirit" family card, besides any "Godseeker"/"Pioneer", to the Hand.` |
| 25 | 2 | `Among them, add a White "Bannerace" family card to the Hand.` |
| 26 | 2 | `including those that are in Soul State/pre-advent condition, add the card to the Hand.` |
| 27 | 2 | `If you have six counters or more, this effect can't be prevented by opposing effects.` |
| 28 | 2 | `By discarding this card during your Main Step` |
| 29 | 2 | `By discarding one of your Red/White Mirage` |
| 30 | 2 | `Among them, add a "Ferobeast" family Nexus card to the Hand.` |
| 31 | 2 | `this Spirit remains on the Field in the same condition.` |
| 32 | 2 | `These effects can't be prevented by either player's effects.` |
| 33 | 2 | `Among them, add a "Rekka" family card to the Hand.` |
| 34 | 2 | `Add the revealed cards to your Hand.` |
| 35 | 2 | `This effect can't be prevented by [Grandphosis].` |
| 36 | 2 | `Among them, add an exactly-named "Grandwalker Amaterasu" and a Red/White "Celeste"/"Avatar" family card to the Hand.` |
| 37 | 2 | `Among them, add an exactly-named "Grandwalker Susanoo" and a Red/Blue "Celeste"/"Avatar" family card to the Hand.` |
| 38 | 2 | `Among them, add a "Windfang" family card to the Hand.` |
| 39 | 2 | `Among them, add a "Concluser" & "Martial" family Spirit card to the Hand.` |
| 40 | 2 | `Add a "Gamer"-named Spirit card among them to the Hand.` |
| 41 | 2 | `Add any remaining cards to the Hand.` |
| 42 | 2 | `If you have two counters or more, this effect adds +N card to your Hand.` |
| 43 | 2 | `This effect can't be prevented by either player's effects.` |
| 44 | 2 | `Among them, add a "Stark" to your Hand.` |
| 45 | 2 | `By not activating this Ultimate's Ultimate-Trigger` |
| 46 | 2 | `Among them, add a Yellow Magic card to the Hand.` |
| 47 | 2 | `Add every Nexus card among them to the Hand.` |
| 48 | 2 | `This "exhaustion effect" can't be prevented by opposing effects.` |
| 49 | 2 | `While [Soul Core] is on this Spirit, your "Riolu Tida" and "Rias Urovorun" can't be destroyed by opposing effects.` |
| 50 | 2 | `heb` |

---

## 5. Architectural Compliance Verification
- **Rule 1 (No Name-Keyed Checks)**: All card effects compile through generic primitives in `compiler/` without any card-name branching.
- **Rule 2 (Test-First & Golden ASTs)**: Comprehensive golden tests in `tests/golden_compiler.test.js` validate key cards (*Evil Flame*, *Evil Draw*, *Birgoyle*, *New-Siegfried*, *Siegfrieden XV*, *Gaianohoko*, *Javad*, *Curse Swordsman*, *Holy Grail*, *Gran-Dolbalkan*).
- **Rule 3 (Single Source of Rules)**: Sharded IR data matches Eternal format timing, burst criteria, and links.
- **Rule 4 (Card Number Identity)**: Every compiled IR object is keyed by canonical card number.
- **Rule 6 (Full Verification)**: 100% automated test suite passing with zero regressions.
