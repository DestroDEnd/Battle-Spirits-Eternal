# Phase 2.2.1 Closure Initial Baseline & Environment Audit

## 1. System & Environment Baseline
- **Audit Timestamp:** 2026-11-21T06:22:38.599Z
- **Node.js Runtime:** v24.16.0 (Native WebSocket, ECMAScript modules, node:test support)
- **Host OS:** win32 (x64)
- **Active Working Directory:** `C:\Users\namis\Downloads\BSP`
- **Git Commit:** `0e3524a30738009e1e233d8ab9e6c7b562e07074` on branch `main`
- **Working Tree State:** Non-destructively preserved with 769 modified/untracked files

## 2. Canonical Data Assets & Counts
- **Canonical Cards Database:** `data/cards_detailed.json`
  - Record Count: **14443** detailed cards
  - SHA-256 Hash: `9a991fe182a3b20457a7cbb51b2444cfd2cc9cf3d65f3cbecee20e6f9cc41ace`
- **Card Index:** `data/cards_index.json`
  - Record Count: **14443** indexed cards
  - SHA-256 Hash: `9abd6a3168e60edd37130a560fce4aee6c6f7ee04e0660403a2bdf58f1b5a3b9`
- **IR Shards:** `data/ir_shards/`
  - Shard Count: **514** shards (100% of 514 shards intact)
  - Total Shard Card Instances: **15398**
  - Total Compiled Abilities: **36422**
  - Total Compiled Clauses: **51734**
  - Unique Opcodes: **288**
  - Unique Operational Variants: **316**

## 3. Reconciliation of Card Entity Types
- **Detailed Canonical Cards:** **14,443** (unique canonical records in `data/cards_detailed.json`)
- **Card Index Records:** **14,443** (unique canonical index entries in `data/cards_index.json`)
- **Shard Card Instances:** **15,398** (card instances across 514 shards, accounting for reprints/alt-arts in multiple set shards)
- **Compiled Clauses:** **51,734** across **36,422** abilities

## 4. Browser Automation Infrastructure Assessment
- **Google Chrome Binary:** `C:\Program Files\Google\Chrome\Application\chrome.exe` (Available: **true**)
- **Microsoft Edge Binary:** `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` (Available: **true**)
- **Integration Approach:** Headless Chrome DevTools Protocol (CDP) via native Node.js 24 `WebSocket` and local server. Zero third-party dependencies.

## 5. Preservation Invariants Confirmed
1. No `git reset --hard` or `git clean` executed.
2. Canonical card database, cards index, and all 514 IR shards intact without loss.
3. Historical work packages and reports preserved.
