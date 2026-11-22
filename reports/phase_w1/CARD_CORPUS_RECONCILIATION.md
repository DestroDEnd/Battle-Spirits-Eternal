# CARD CORPUS AND IR RECONCILIATION REPORT
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:30:29.808Z
**Corpus Scope:** 14,443 Unique Cards | 15,398 Physical Shard Instances across 514 Shards

---

## 1. Executive Summary

A comprehensive reconciliation was conducted matching all 348 Wiki keywords across raw card effects in `data/cards_detailed.json` and compiled physical records in `data/ir_shards/`.

| Corpus Dimension | Metric Value | Notes |
| :--- | :--- | :--- |
| **Total Canonical Keywords** | **348** | Complete Wiki inventory |
| **Keywords Represented in Card Corpus** | **264** | Possessing $\ge 1$ raw card instance in database |
| **Keywords with Zero Card Records** | **84** | Modern anime/promo/special format keywords |
| **Total Unique Card Records Reconciled** | **14,443** | Distinct card keys in `cards_detailed.json` |
| **Total Physical Shard Instances** | **15,398** | Records across 514 `.json` shard files |

---

## 2. Distinction: Unique Cards vs Physical Card Instances

A core methodological rule of Phase W.1 is strictly distinguishing **unique canonical cards** (e.g. `BS33-X01`) from **physical shard card-instances** (reprints, alternate artworks, promotional printings, and sharded distribution slices).
- The 14,443 unique cards expand to **15,398 physical card instances** across 514 shards.
- Card occurrence matrices must never conflate these two values.

---

## 3. Top 20 Most Frequent Keywords in Card Corpus

| Canonical Name | Category | Unique Raw Cards | Physical Shard Instances | Compiled Cards |
| :--- | :--- | :--- | :--- | :--- |
| **Burst** | All | 846 | 855 | 0 |
| **Contract Advent** | All | 565 | 581 | 0 |
| **Advent** | All | 557 | 569 | 0 |
| **Team** | Diva | 499 | 503 | 0 |
| **Mirage** | All | 488 | 493 | 0 |
| **Accel** | All | 412 | 421 | 0 |
| **Core Charge** | All | 288 | 299 | 0 |
| **Heavy Armor** | White | 265 | 272 | 0 |
| **Armor** | White | 258 | 265 | 0 |
| **Rush** | All | 252 | 255 | 0 |
| **Grand Skill** | All | 240 | 246 | 0 |
| **Change** | All | 232 | 236 | 0 |
| **Grand Field** | All | 231 | 234 | 0 |
| **Ultimate Trigger** | All | 209 | 221 | 0 |
| **Soul Burst** | All | 178 | 191 | 0 |
| **High Speed** | Green | 171 | 173 | 0 |
| **Manifest** | All | 161 | 172 | 0 |
| **Unleash** | All | 104 | 110 | 0 |
| **Tribute** | All | 102 | 103 | 0 |
| **A.T. Field** | Collaboration | 87 | 87 | 0 |

---

## 4. Verification Sample: Representative Card Bindings

### Keyword: `Accel`
- **Sample Card ID:** `BATTLE-SPIRITS-A21` (`Avatar Dragon Green`)
- **Unique Card Occurrences:** 412 | **Physical Instances:** 421
- **Raw Effect Excerpt:** `While this card is in the Removed Zone, all "Creation" family cards in your Removed Zone are unaffected by opposing effects.  When this card is reveal...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Advent`
- **Sample Card ID:** `SD45-CP05` (`Magnadramon`)
- **Unique Card Occurrences:** 557 | **Physical Instances:** 569
- **Raw Effect Excerpt:** `Flash - [Advent: Cost 5 or more] ((Either Attack Step)) By sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.  [...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Astral Unleash`
- **Sample Card ID:** `BATTLE-SPIRITS-A14562` (`Zodiac Mirage`)
- **Unique Card Occurrences:** 1 | **Physical Instances:** 1
- **Raw Effect Excerpt:** `This card's reduction symbols are also treated as Purple/Green/White/Yellow/Blue.  [Mirage: Cost 1] [During Set] When you would activate [Astral Unlea...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Astromulet`
- **Sample Card ID:** `BS59-X08` (`The OracleTwentyOnePillars X The Wheel of Fortune`)
- **Unique Card Occurrences:** 1 | **Physical Instances:** 1
- **Raw Effect Excerpt:** `This card/Spirit has "Galaxian" family.  [LV1][LV2][LV3] (When Summoned) By returning up to four "Galaxian" family cards from the Removed Zone to your...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Celestial Unleash`
- **Sample Card ID:** `BATTLE-SPIRITS-A6052` (`Kamunabi-no-Mikoto`)
- **Unique Card Occurrences:** 3 | **Physical Instances:** 3
- **Raw Effect Excerpt:** `[Burst: After an opposing Spirit's (When Summoned/Advents) effect resolves] Destroy an opposing Cost 8 or less Spirit. When this effect destroys, put ...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Change`
- **Sample Card ID:** `CB04-056` (`4Koma Ninpoutou`)
- **Unique Card Occurrences:** 232 | **Physical Instances:** 236
- **Raw Effect Excerpt:** `[Brave Condition: Cost 4 or more]  [When Braved] When switching via your [Change], this Brave becomes Cost 0.  [When Braved] (When Destroyed by the Op...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Charge`
- **Sample Card ID:** `BS20-038` (`Cupid`)
- **Unique Card Occurrences:** 82 | **Physical Instances:** 85
- **Raw Effect Excerpt:** `[LV1][LV2][LV3] [Charge] Your “BP- effect” decreases 1000 further....`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Contract Advent`
- **Sample Card ID:** `CB28-X02` (`Burning Godzilla (1995)`)
- **Unique Card Occurrences:** 565 | **Physical Instances:** 581
- **Raw Effect Excerpt:** `Flash - [Contract Advent: "Godzilla" & C7 or more, (Your Turn)] By sending your [Soul Core] to the Trash, stack this from the Hand onto your target Sp...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Count Break`
- **Sample Card ID:** `BS56-X06` (`The GreatIceGiantBeast Yetika-Erakes`)
- **Unique Card Occurrences:** 5 | **Physical Instances:** 5
- **Raw Effect Excerpt:** `[LV1][LV2][LV3] 4 (When Attacks) (Once per Game: [Count Break]) You can -4 counters. When you've done so, return every opposing Nexus to the decktop, ...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Extreme Drive`
- **Sample Card ID:** `P17-EXG03` (`The ExtremeKingTiger Jiu-Dian`)
- **Unique Card Occurrences:** 6 | **Physical Instances:** 6
- **Raw Effect Excerpt:** `[LV1][LV2][LV3] (When Summoned) Exhaust three opposing Spirits/Ultimates.  [LV2][LV3] Flash - [Extreme Drive] (Opposing Attack Step) If you banish car...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Flag Contract Advent`
- **Sample Card ID:** `BS76-023` (`Airs-Cheetah`)
- **Unique Card Occurrences:** 18 | **Physical Instances:** 18
- **Raw Effect Excerpt:** `Flash - [Flag Contract Advent: Gale Contract, (Either Attack Step)] By sending your [Soul Core] to the Trash, stack this from the Hand onto your targe...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Grand Advent`
- **Sample Card ID:** `BATTLE-SPIRITS-A311` (`The AbsoluteDragonDeity Grand-Lolo-Dragoleon`)
- **Unique Card Occurrences:** 11 | **Physical Instances:** 11
- **Raw Effect Excerpt:** `Flash - [Grand Advent: During Advent, (Either Attack Step)] By either sending your [Soul Core] to the Trash, or putting a core from your Grandwalker N...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Horoscoping`
- **Sample Card ID:** `CANCER-DRAGON` (`The CrabShellDragon Cancer-Dragon`)
- **Unique Card Occurrences:** 6 | **Physical Instances:** 7
- **Raw Effect Excerpt:** `This card's reduction symbols are also treated as Red/Purple/Green/White/Yellow/Blue.  [LV1][LV2] [Horoscoping] (When Destroyed by the Opponent) You c...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Manifest`
- **Sample Card ID:** `BSC48-X02` (`The SengokuCommander Siegfried-Kai X`)
- **Unique Card Occurrences:** 161 | **Physical Instances:** 172
- **Raw Effect Excerpt:** `Flash - [Manifest: Grandwalker Nexus with 5 or more cores, (Either Attack Step)] By sending your [Soul Core] to the Trash, pay one cost from the targe...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`

### Keyword: `Rebirth`
- **Sample Card ID:** `BS58-007` (`Schwarzer Dragon`)
- **Unique Card Occurrences:** 14 | **Physical Instances:** 14
- **Raw Effect Excerpt:** `[LV1][LV2] (When Attacks) Neither player can use cards from Hand outside of Flash Timing.  [LV1][LV2] (When Attacks) Neither player can activate [Rebi...`
- **Binding Status:** `RAW_ONLY_OR_PROSE_FILTERED`


*(Full corpus data for all 348 keywords saved in `reports/phase_w1/card_corpus_reconciliation.json`)*
