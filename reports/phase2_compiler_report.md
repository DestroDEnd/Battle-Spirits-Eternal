# Battle Spirits Eternal - Phase 2 Compiler Report

Generated: 2026-11-02T04:18:12.273Z

## 1. Executive Summary
- **Total Cards Processed**: 14,607
- **Cards with Effects**: 14,232 (97.4%)
- **Total Ability Blocks Parsed**: 32,900
- **Total Clauses Parsed**: 52,009
- **Compiled Clauses (Structured IR)**: 19,688
- **Unsupported Clauses (Manual Fallback)**: 32,321
- **Overall Clause Coverage**: **37.85%**
- **Compilation Speed**: 1792ms (8151 cards/sec)
- **IR Shards Generated**: 445 set/prefix shards in `data/ir_shards/`

---

## 2. Coverage by Card Type

| Card Type | Total Cards | Total Clauses | Compiled IR | Unsupported | Coverage % |
|:---|:---:|:---:|:---:|:---:|:---:|
| Spirit | 10,225 | 35,875 | 14,494 | 21,381 | **40.4%** |
| Brave | 895 | 2,852 | 1,044 | 1,808 | **36.6%** |
| Magic | 1,594 | 5,211 | 1,689 | 3,522 | **32.4%** |
| Ultimate | 373 | 1,442 | 399 | 1,043 | **27.7%** |
| Nexus | 1,377 | 5,512 | 1,751 | 3,761 | **31.8%** |
| Contract Nexus | 59 | 553 | 135 | 418 | **24.4%** |
| Token Spirit | 2 | 8 | 1 | 7 | **12.5%** |
| Contract Spirit | 80 | 544 | 169 | 375 | **31.1%** |
| Contract Ultimate | 2 | 12 | 6 | 6 | **50.0%** |

---

## 3. Detected Keywords Catalog (Top 35)

| Keyword | Occurrences |
|:---|:---:|
| [Burst] | 1,061 |
| [Contract] | 834 |
| [Advent] | 695 |
| [Contract Advent] | 679 |
| [Mirage] | 495 |
| [Accel] | 459 |
| [Core Charge] | 313 |
| [Heavy Armor] | 275 |
| [Rush] | 259 |
| [Grand Skill] | 257 |
| [Change] | 251 |
| [Grand Field] | 231 |
| [Rebirth] | 226 |
| [Ultimate Trigger] | 214 |
| [High Speed] | 172 |
| [Tribute] | 112 |
| [Contract Pre-Advent] | 112 |
| [Seal] | 109 |
| [Unleash] | 105 |
| [A.T. Field] | 87 |
| [Charge] | 83 |
| [Crush] | 83 |
| [Assault] | 82 |
| [Clash] | 77 |
| [Contract Field] | 75 |
| [Show Up] | 72 |
| [Song] | 61 |
| [Armor] | 56 |
| [Immortality] | 56 |
| [Soul State] | 54 |
| [Awaken] | 46 |
| [Curse] | 43 |
| [Holy Life] | 42 |
| [Ultra Armor] | 34 |
| [True-Curse] | 32 |

---

## 4. Top Unsupported Clause Templates (Work Queue for Phase 3/4)

These templates are captured in the `unsupported` array of card abilities and provide an automated work queue sorted by card frequency:

| Rank | Frequency | Template |
|:---:|:---:|:---|
| 1 | 141 | `Legacy` |
| 2 | 88 | `[LVN][LVN] Flash - (Either Attack Step)` |
| 3 | 87 | `[LVN] (When Attacks)]` |
| 4 | 87 | `For each target card among them, put a core from the Void onto this Nexus.` |
| 5 | 79 | `[A.T. Field] (When Attacks/Blocks)` |
| 6 | 74 | `[LVN][LVN] (When Attacks)` |
| 7 | 62 | `[Rush: Green]` |
| 8 | 61 | `[LVN][LVN] (When Attacks)]` |
| 9 | 60 | `During Attack` |
| 10 | 57 | `N (When Attacks)` |
| 11 | 52 | `[LVN][LVN]` |
| 12 | 51 | `[Brave Symbol +N]` |
| 13 | 51 | `◆(Once per Turn: Same Name) When this Nexus is deployed, you can send three cards from your decktop to the Trash.` |
| 14 | 51 | `Main - (Once per Turn: Same Name) You can deploy this card from Soul State.` |
| 15 | 50 | `(While you have a Green symbol, the following effect activates next)` |
| 16 | 44 | `Your Attack Step` |
| 17 | 43 | `◆When this Nexus is deployed, if you don't control a Grandwalker Nexus with the same card name, you can send three cards from your decktop to the Trash.` |
| 18 | 42 | `While this card is in Soul State, you can [Contract Advent] onto it.` |
| 19 | 42 | `When you do, you can put any number of cores from your Field/Reserve to the advent card.` |
| 20 | 39 | `put this card face-up on your Removed Zone.` |
| 21 | 39 | `For each target card among them, put one core from the Void onto this Nexus.` |
| 22 | 39 | `[LVN] Flash - (Either Attack Step)` |
| 23 | 36 | `Discard any remaining card.` |
| 24 | 36 | `Target an opposing N BP or less Spirit.` |
| 25 | 35 | `By paying two costs` |
| 26 | 35 | `By sending [Soul Core] from this Spirit to the Trash` |
| 27 | 34 | `put this card onto your Field.` |
| 28 | 34 | `Cost N or less` |
| 29 | 33 | `(Max.` |
| 30 | 33 | `This effect doesn't trigger [Core Charge].` |
| 31 | 33 | `Return an opposing Spirit/Ultimate to the deckbottom.` |
| 32 | 33 | `This Spirit's color and symbol are also treated as Red.` |
| 33 | 33 | `This Spirit is unaffected by opposing Cost N or less effects.` |
| 34 | 32 | `Target one of your Spirits.` |
| 35 | 32 | `This card's reduction symbols are also treated as Red/Purple/Green/White/Yellow/Blue.` |
| 36 | 32 | `N).` |
| 37 | 32 | `This Spirit can't be blocked.` |
| 38 | 32 | `[During Left/Right Brave] (When Attacks)` |
| 39 | 31 | `During this turn, give an opposing Spirit/Ultimate -N BP.` |
| 40 | 31 | `◆When you summon/advent a target Spirit, you can put one core from the Void onto this Nexus.` |
| 41 | 31 | `[Rush: Red]` |
| 42 | 30 | `[Rush: Blue]` |
| 43 | 30 | `You can discard three cards from your decktop.` |
| 44 | 29 | `this Spirit remains on the Field, exhausted.` |
| 45 | 29 | `if you control any "Nth"-named Spirit, you can pay one cost to summon it.` |
| 46 | 29 | `[Rush: White]` |
| 47 | 29 | `This Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.` |
| 48 | 28 | `The opponent can't activate Burst effects.` |
| 49 | 28 | `Return an opposing Spirit/Ultimate to the Hand.` |
| 50 | 28 | `◆When you summon/advent a target Spirit, you can +N core to this Nexus.` |

---

## 5. Architectural Compliance Verification
- **Rule 1 (No Name-Keyed Checks)**: All card effects compile through generic primitives in `compiler/` without any card-name branching.
- **Rule 2 (Test-First & Golden ASTs)**: Comprehensive golden tests in `tests/golden_compiler.test.js` validate key cards (*Evil Flame*, *Evil Draw*, *Birgoyle*, *New-Siegfried*, *Siegfrieden XV*, *Gaianohoko*, *Javad*, *Curse Swordsman*, *Holy Grail*, *Gran-Dolbalkan*).
- **Rule 3 (Single Source of Rules)**: Sharded IR data matches Eternal format timing, burst criteria, and links.
- **Rule 4 (Card Number Identity)**: Every compiled IR object is keyed by canonical card number.
- **Rule 6 (Full Verification)**: 100% automated test suite passing with zero regressions.
