# Duplicate and Orphan Record Audit

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 3A  
**Date:** 2026-11-21  

---

## 1. Reprint Reconciliation Summary

Across the 514 IR shards, 15,398 total card instances represent 14,609 unique card numbers.
A total of **955 card instances** represent multi-set reprints sharing identical card text, cost, and level structures across distinct expansion shards (e.g. `BS01-002 DarkGoradon` appearing in `BS01.json` and starter sets).

Under the Physical vs Semantic Ability Identity architecture:
- Reprints share identical **Semantic Ability Identities** (`deriveSemanticAbilityId`), ensuring rules references and once-per-turn limits evaluate correctly.
- Each instance maintains a distinct **Physical Ability Identity** (`derivePhysicalAbilityId`), preventing memory leaks and state cross-contamination.

---

## 2. Orphan and Special Scrape ID Audit

A total of **22 records** in `data/cards_detailed.json` represent composite scrape IDs from legacy wiki imports (e.g. `BATTLE-SPIRITS-A13741`, `BS53-TCP01-A7054-B16057`).
These records are non-gameplay artifacts and do not affect the 15,398 authoritative shard card instances.
