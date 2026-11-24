# Battle Spirits Eternal — Initial Database Forensic Audit
**Audit Date:** 2026-11-24  
**Auditor:** Master Database Integrity & Recovery Taskforce  
**Target:** `c:/Users/namis/Downloads/BSP`  
**Status:** FORENSIC BASELINE RECORDED — 188 CANONICAL CARDS CONFIRMED MISSING

---

## 1. Executive Summary

A critical data corruption event was detected following an automated alternate-art removal and database optimization script (`scripts/clean_and_optimize_db.js` committed in `352b919`). 

Forensic analysis confirms:
1. **188 valid canonical card records** were purged from `data/cards_detailed.json`, `data/cards_index.json`, and the SQLite `cards` table.
2. The deleted records include prominent community cornerstones:
   - **`BS30-015` Ubataman**
   - **`BS27-X03` The HolyDragonEmperor Ultimate-Saviour**
   - **The ENTIRE BS-77 Set (46 cards: BS77-001 through BS77-081)**
   - **140 additional canonical cards** across sets BS27, BS30, BS37, BS39, BS40, BS42, BS53, CB18, SD52, LM14, and BSCO.
3. **163 of the 188 deleted cards possessed valid, functional image URLs** in `cards_v2` and pre-deletion catalog. They were erroneously purged because the `cards` table had a `NULL` in `image_url` (while retaining the valid `image_filename`), which triggered an unvalidated SQL `DELETE` that was cascaded by card name.
4. Fortunately, the secondary extended table **`cards_v2`** (14,611 rows), the physical **IR shards** in `data/ir_shards/` (514 files), and git-tracked commit `352b919~1` survived intact, providing 100% complete, uncorrupted recovery sources.
5. In addition, 20 Rebirth card faces (e.g. `Future Apollon`, `The Owari World`) were legitimately created in current working files, bringing the true target canonical catalog to **14,631 cards**.

---

## 2. Current Pre-Recovery Database Inventory Baseline

| Storage Artifact | Baseline Record Count | Verified Canonical Cards | Missing Images | Status |
|---|---:|---:|---:|---|
| SQLite `cards` table | **14,443** | 14,443 | 0 | ❌ Compromised (188 missing) |
| SQLite `cards_v2` table | **14,611** | 14,611 | 24 | ✅ Intact (holds all 188 missing cards) |
| `data/cards_detailed.json` | **14,443** | 14,443 | 0 | ❌ Compromised (188 missing) |
| `data/cards_index.json` | **14,443** | 14,443 | 0 | ❌ Compromised (188 missing) |
| `data/card_artworks.json` | **550 cards** | — | — | 550 cards with alternate artworks |
| `data/ir_shards/*.json` | **514 files** | 14,609 unique cards | — | ✅ Intact (holds BS77, BS30, BS27 shards) |

### 2.1 Cards Distribution by Card Type (Current Compromised Baseline)
- **Spirit:** 10,132 cards
- **Brave:** 884 cards
- **Magic:** 1,577 cards
- **Ultimate:** 368 cards
- **Nexus:** 1,345 cards
- **Contract Nexus:** 53 cards
- **Token Spirit:** 2 cards
- **Contract Spirit:** 80 cards
- **Contract Ultimate:** 2 cards

### 2.2 Alternate-Art Printings
- **Cards with Alternate Artworks:** 550 cards
- **Total Alternate-Art Variant Printings:** 691 printings

### 2.3 Orphaned Records & Discrepancies
- **Discrepancy Between `cards_v2` and `cards`:** Exactly 168 rows ($14,611 - 14,443 = 168$).
- **Net Missing Cards from Detailed JSON:** Exactly 188 canonical records missing compared to pre-deletion baseline.
- **Added Rebirth Form Entries in Current:** Exactly 20 Rebirth card face records added in current branch.
- **Mathematical Union Formula:**
  $$\text{Pre-Deletion Baseline (14,611)} - \text{Purged Records (188)} + \text{New Rebirth Faces (20)} = \text{Current State (14,443)}$$
  $$\text{Target Recovered Catalog} = 14,443 + 188 = 14,631 \text{ cards}$$

---

## 3. Preservation & Backup Verification

A complete, immutable timestamped snapshot of all database files and source catalogs was preserved in:
`backups/card_database_pre_recovery_20261124/`
- `battle_spirits.db` (45,756,416 bytes)
- `cards_detailed.json` (19,076,592 bytes)
- `cards_index.json` (7,951,069 bytes)
- `card_artworks.json` (277,778 bytes)
- `filters_data.json` (219,505 bytes)
- `pre_deletion_battle_spirits.db` (binary stream from commit `352b919~1`, 52,379,648 bytes)
- `pre_deletion_cards_detailed.json` (20,032,544 bytes)
- `pre_deletion_cards_index.json` (6,997,408 bytes)
- `pre_deletion_card_artworks.json` (278,704 bytes)

All existing uncommitted work in the repository has been preserved with zero discards.
