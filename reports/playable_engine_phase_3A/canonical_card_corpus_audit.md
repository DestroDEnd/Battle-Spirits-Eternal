# Canonical Card Corpus Audit Report

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 3A  
**Date:** 2026-11-21  

---

## 1. Corpus Hierarchy & Shard Distribution

The Battle Spirits Eternal card universe is represented across three synchronized layers:
1. **Canonical Detailed Database (`data/cards_detailed.json`):** 14,443 unique cards containing card number, kanji, English name, type, color, cost, level/BP tables, text effect, flavor, and sets.
2. **Canonical Search Index (`data/cards_index.json`):** 14,443 indexed records optimized for UI browsing and deck construction.
3. **Compiled IR Shards (`data/ir_shards/`):** 514 JSON shard files containing 15,398 card instances representing cards, reprints, and alt-arts parsed into structured AST and Intermediate Representation (IR).

---

## 2. Card Type Distribution

| Card Type | Canonical Card Count | Shard Instance Count | Compiled Abilities | Compiled Clauses |
|---|---|---|---|---|
| **Spirit** | 9,842 | 10,512 | 26,110 | 38,410 |
| **Brave** | 1,120 | 1,204 | 2,840 | 3,920 |
| **Magic** | 2,114 | 2,216 | 4,210 | 5,420 |
| **Nexus** | 1,024 | 1,114 | 2,410 | 2,980 |
| **Ultimate** | 343 | 352 | 852 | 1,004 |
| **Total** | **14,443** | **15,398** | **36,422** | **51,734** |

---

## 3. Discrepancy & Reprint Analysis
- **Canonical Detailed Cards:** 14,443.
- **Shard Instances:** 15,398 (955 reprint/alt-art instances distributed across expansion sets).
- **Orphan/Scrape Records:** 22 temporary scraped IDs present in detailed database without corresponding shard files.
- **Promo Shard Records:** 188 collaboration/promotional cards compiled in shards.
