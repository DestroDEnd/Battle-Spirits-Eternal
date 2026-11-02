# Battle Spirits Eternal - Phase 2 Compiler Report

Generated: 2026-11-02T06:27:55.817Z

## 1. Executive Summary
- **Total Cards Processed**: 14,607
- **Cards with Effects**: 14,232 (97.4%)
- **Total Ability Blocks Parsed**: 32,456
- **Total Clauses Parsed**: 51,705
- **Compiled Clauses (Structured IR)**: 20,348
- **Unsupported Clauses (Manual Fallback)**: 31,357
- **Overall Clause Coverage**: **39.35%**
- **Compilation Speed**: 2087ms (6999 cards/sec)
- **IR Shards Generated**: 445 set/prefix shards in `data/ir_shards/`

---

## 2. Coverage by Card Type

| Card Type | Total Cards | Total Clauses | Compiled IR | Unsupported | Coverage % |
|:---|:---:|:---:|:---:|:---:|:---:|
| Spirit | 10,225 | 35,778 | 14,829 | 20,949 | **41.4%** |
| Brave | 895 | 2,859 | 1,058 | 1,801 | **37.0%** |
| Magic | 1,594 | 5,239 | 1,737 | 3,502 | **33.2%** |
| Ultimate | 373 | 1,044 | 329 | 715 | **31.5%** |
| Nexus | 1,377 | 5,668 | 1,990 | 3,678 | **35.1%** |
| Contract Nexus | 59 | 553 | 187 | 366 | **33.8%** |
| Token Spirit | 2 | 8 | 1 | 7 | **12.5%** |
| Contract Spirit | 80 | 544 | 211 | 333 | **38.8%** |
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
| 1 | 87 | `[LVN][LVN] Flash - (Either Attack Step)` |
| 2 | 70 | `During Attack` |
| 3 | 57 | `N (When Attacks)` |
| 4 | 52 | `[Ultimate Trigger: [LVN][LVN] (When Attacks)]` |
| 5 | 51 | `[Revive] Main - (Once per Turn: Same Name) You can deploy this card from Soul State.` |
| 6 | 51 | `[LVN][LVN] (When Attacks)` |
| 7 | 50 | `(While you have a Green symbol, the following effect activates next)` |
| 8 | 48 | `[LVN][LVN]` |
| 9 | 47 | `Your Attack Step` |
| 10 | 42 | `While this card is in Soul State, you can [Contract Advent] onto it.` |
| 11 | 39 | `put this card face-up on your Removed Zone.` |
| 12 | 39 | `[LVN] Flash - (Either Attack Step)` |
| 13 | 36 | `Discard any remaining card.` |
| 14 | 36 | `Target an opposing N BP or less Spirit.` |
| 15 | 35 | `By paying two costs` |
| 16 | 35 | `By sending [Soul Core] from this Spirit to the Trash` |
| 17 | 34 | `put this card onto your Field.` |
| 18 | 34 | `Cost N or less` |
| 19 | 33 | `(Max.` |
| 20 | 33 | `This effect doesn't trigger [Core Charge].` |
| 21 | 33 | `Return an opposing Spirit/Ultimate to the deckbottom.` |
| 22 | 33 | `This Spirit's color and symbol are also treated as Red.` |
| 23 | 33 | `This Spirit is unaffected by opposing Cost N or less effects.` |
| 24 | 32 | `Target one of your Spirits.` |
| 25 | 32 | `This card's reduction symbols are also treated as Red/Purple/Green/White/Yellow/Blue.` |
| 26 | 32 | `N).` |
| 27 | 32 | `This Spirit can't be blocked.` |
| 28 | 32 | `[During Left/Right Brave] (When Attacks)` |
| 29 | 31 | `During this turn, give an opposing Spirit/Ultimate -N BP.` |
| 30 | 31 | `◆When you summon/advent a target Spirit, you can put one core from the Void onto this Nexus.` |
| 31 | 30 | `You can discard three cards from your decktop.` |
| 32 | 29 | `this Spirit remains on the Field, exhausted.` |
| 33 | 29 | `if you control any "Nth"-named Spirit, you can pay one cost to summon it.` |
| 34 | 29 | `This Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.` |
| 35 | 28 | `The opponent can't activate Burst effects.` |
| 36 | 28 | `Return an opposing Spirit/Ultimate to the Hand.` |
| 37 | 28 | `◆When you summon/advent a target Spirit, you can +N core to this Nexus.` |
| 38 | 27 | `Send a core from any opposing Spirits to their Reserve.` |
| 39 | 27 | `(Your Start Step)` |
| 40 | 27 | `immediately activate one of your Soul Bursts.` |
| 41 | 27 | `[LVN]` |
| 42 | 27 | `This Spirit can't be destroyed by opposing effects.` |
| 43 | 27 | `This effect can only be used once per game.` |
| 44 | 27 | `True ReleaseDuring Attack` |
| 45 | 26 | `N)` |
| 46 | 26 | `(While you have a Blue symbol, the following effect activates next)` |
| 47 | 26 | `This Spirit is unaffected by opposing originally Cost N or less effects.` |
| 48 | 26 | `you can put this card onto your Field.` |
| 49 | 25 | `summon this Spirit card.` |
| 50 | 25 | `(When Summoned/Blocks)` |

---

## 5. Architectural Compliance Verification
- **Rule 1 (No Name-Keyed Checks)**: All card effects compile through generic primitives in `compiler/` without any card-name branching.
- **Rule 2 (Test-First & Golden ASTs)**: Comprehensive golden tests in `tests/golden_compiler.test.js` validate key cards (*Evil Flame*, *Evil Draw*, *Birgoyle*, *New-Siegfried*, *Siegfrieden XV*, *Gaianohoko*, *Javad*, *Curse Swordsman*, *Holy Grail*, *Gran-Dolbalkan*).
- **Rule 3 (Single Source of Rules)**: Sharded IR data matches Eternal format timing, burst criteria, and links.
- **Rule 4 (Card Number Identity)**: Every compiled IR object is keyed by canonical card number.
- **Rule 6 (Full Verification)**: 100% automated test suite passing with zero regressions.
