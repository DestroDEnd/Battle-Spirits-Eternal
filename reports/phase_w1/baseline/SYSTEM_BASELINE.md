# PHASE W.1 IMMUTABLE BASELINE AUDIT RECORD
**Generated:** 2026-11-22T07:28:05.485Z
**Subsystem:** Phase W.1 Baseline Preservation & State Hash

---

## 1. Executive Summary

This record captures the immutable pre-audit state of Battle Spirits Eternal (BSP) prior to commencing the Phase W.1 independent verification and evidence reconstruction.

---

## 2. System Counts & Baseline Metrics

| Category | Metric | Baseline Value | Notes |
| :--- | :--- | :--- | :--- |
| **Git Environment** | Active Branch | `main` | Commit: `0e3524a30738009e1e233d8ab9e6c7b562e07074` |
| **Git Environment** | Dirty Paths | 1118 files | Tracked modified/untracked files |
| **Wiki Inventory** | Canonical Keywords | **348** | Unique entries in `wiki_keywords_inventory.json` |
| **Wiki Pages** | Cached Page JSONs | **343** | Stored in `wiki_keyword_pages.json` |
| **Inventory vs Page Delta** | Difference Explanation | **5 entries** | 5 keywords share article pages as anchors / sub-sections |
| **Card Database** | Unique Cards | **14443** | Unique keys in `data/cards_detailed.json` |
| **IR Shards** | Shard Files | **514** | Files in `data/ir_shards/` |
| **IR Shards** | Total Card Instances | **15398** | Physical card occurrences across all 514 shards |
| **Compiler** | Catalog Keywords | **354** | Keys in `KEYWORD_CATALOG` |
| **Runtime Registry** | Registered Keywords | **364** | Handlers in `KeywordRegistry` |
| **Test Suite** | Test Files | **250** | `.test.js` files under `tests/` |
| **Test Suite** | Discoverable Tests | **1719** | `test(...)` declaration blocks across suite |

---

## 3. Previous Audit Directory Hashes (`reports/wiki_keyword_audit/`)

The previous audit files have been verified and their SHA-256 digests recorded. None of these files will be modified during Phase W.1:

| File | Size (Bytes) | SHA-256 Digest |
| :--- | :--- | :--- |
| `AUDIT_METHODOLOGY_AND_LIMITATIONS.md` | 2,274 | `827c13c63eb05f4695ed83e93fa17b234a966a40c421930d1e881e186f0c7349` |
| `AUDIT_SUMMARY.md` | 5,692 | `505244714abf69d7e7f3a05f15df798e838097f181fb27e9ba47132e76769594` |
| `BSP_ONLY_KEYWORDS_REPORT.md` | 2,195 | `2abdb86e4155b4c102374fee230971cf95c9c9125024000b8e49845b2547615d` |
| `KEYWORD_DECISION_AUTONOMY_REPORT.md` | 1,906 | `a4ad300b1f768f3e4630d03f44f1a05cb0bd1c2df5f87438c9094b7d7dbd2c9a` |
| `KEYWORD_IMPLEMENTATION_MATRIX.md` | 37,291 | `c871d1140706675c835bbb61783901338accc632f034d50b8413731d278f8cbf` |
| `KEYWORD_INTERACTION_GAPS_REPORT.md` | 2,232 | `9d24f60d574f0c05395997a0934c015fc8a7332cb8e1a6202d496038566366ea` |
| `KEYWORD_RECONCILIATION_MASTER.csv` | 1,17,839 | `91a6071c9f95ae019d9c6f6e641c66ae88c6db8429f02e1ee6b1889680e4615c` |
| `KEYWORD_SEMANTIC_DEFECTS_REPORT.md` | 7,605 | `221787fcd3d13cfe8075ae4b6c4f9d9471409fdba805d5eff4b837ad7bf422eb` |
| `KEYWORD_TEST_EVIDENCE_REPORT.md` | 16,385 | `6b1872d66cadc6284ef6f0d9c23ba73527a53f4f1baa8e8dcd61a88f9a1f9a76` |
| `MISSING_KEYWORDS_REPORT.md` | 13,131 | `b07dabb4e490e57805c988fb552a7b5da5816027d5e788cee9ea9f43a58fb084` |
| `PARTIAL_IMPLEMENTATIONS_REPORT.md` | 18,571 | `ed1233652e8537853a5d89d4159b3545ce6e7f84b14c9782d0f5c4403b04851b` |
| `WIKI_KEYWORD_MASTER_INVENTORY.md` | 51,868 | `69d1284366d70844313eb0b7e87f8aaf3bda097dfe4780c8b8460717084c4db5` |
| `keyword_audit_evidence.json` | 4,32,079 | `a15237ea44f299509192d1eb59ab0b995ba2cf05bc8f337fe0d26352c247c310` |
| `keyword_audit_run.log` | 2,217 | `6841ff3709c3673d7572a2b554f15bbe5697df8f59fcb3fde685c07d638c220c` |
| `wiki_keyword_pages.json` | 8,98,211 | `20d41cd57a1f20d328bd34490e06ca1377bf3be2abcdb0010e3985d6693ce424` |
| `wiki_keywords_inventory.json` | 80,068 | `3b84d204471b4fef838be9b8f87d5fc0f61272f7ec0109e07f5973889ee60c88` |
| `wiki_keywords_nav_raw.txt` | 13,012 | `9cc060f11484c593c3a4e4859b1f5124a24c7e8e513863003062d1164fb04d9e` |

---

## 4. Preservation Invariant Confirmation

- Audit output directory: `reports/phase_w1/` (Created, isolated from previous reports).
- Audit scripts directory: `scripts/audit/` (Created, read-only utilities only).
- Previous audit directory: `reports/wiki_keyword_audit/` (Read-only, completely preserved).
- Production game-engine files: **Strictly frozen, no modifications permitted.**
