# Phase K.1 — Baseline, Repository Preservation & Architecture Audit Report

## 1. Executive Summary & Verification Context
This report documents the baseline audit of the **Battle Spirits Eternal (BSP)** repository prior to executing the Phase K.1 work packages. The repository state has been verified independently without relying on unvalidated assumptions from prior phases.

- **Project Root:** `c:\Users\namis\Downloads\BSP`
- **Git Commit Baseline:** `0e3524a30738009e1e233d8ab9e6c7b562e07074` (`main` branch)
- **Node.js Environment:** v24.16.0 (win32-x64)
- **Audit Date:** 2026-11-22

---

## 2. Git Status & Repository Preservation
- **Active Branch:** `main`
- **Head Commit:** `0e3524a30738009e1e233d8ab9e6c7b562e07074`
- **Uncommitted Modifications:** Verified strictly additive development artifacts and reports from previous stabilization phases. Zero destructive operations (`git reset --hard`, `git clean`) have been or will be executed.
- **Repository Integrity:** All 345 IR shard files, `data/cards_detailed.json`, `data/cards_index.json`, SQLite `battle_spirits.db`, and previous milestone reports are preserved.

---

## 3. Test Runner Baseline & Execution Population
- **Total Discovered Test Files:** 236 test files across `tests/`
- **Master Battery Test Suites Executed:** 42 authoritative suites
- **Master Battery Test Count:** 563 executed test cases
- **Master Battery Result:** 563 passed, 0 failed, 0 skipped (100.00% pass rate)
- **Duplicate Test Executions in Master Runner:** 0
- **Historical / Non-Master Test Files:** 194 test files (retained with documented dispositions in `reports/phase_k/test_disposition_audit.md`)

---

## 4. Card Database & Corpus Reconciliation
- **Detailed Card Database (`data/cards_detailed.json`):** 14,443 cards
- **Card Index (`data/cards_index.json`):** 14,443 cards
- **SQLite Database (`battle_spirits.db` `cards_v2`):** 14,611 cards
- **Set IR Shard Files (`data/effects/*.json`):** 345 shard files
- **Unique Shard Cards:** 14,609 cards
- **Physical Shard Card Instances (including Set Reprints):** 15,398 card instances
- **Compiled Abilities:** 34,855 abilities (36,422 across all physical instances)
- **Compiled Clauses:** 49,318 clauses (51,734 across all physical instances)
- **Unique Compiled Opcodes:** 288 distinct opcodes

### Population Discrepancy Reconciliation
1. **Detailed vs Shards (14,443 vs 14,609):**
   - 22 cards exist only in detailed cards (scraped legacy entries missing physical set numbers or unparseable raw placeholders).
   - 188 cards exist only in IR shards (official promotional releases, collaboration sets, tournament promos).
   - Reconciliation formula: `14,443 - 22 + 188 = 14,609 unique shard cards`.
2. **Shards vs Shard Instances (14,609 vs 15,398):**
   - 789 reprint duplicates sharing the same canonical card number across multiple release sets.
   - Reconciliation formula: `14,609 + 789 = 15,398 physical shard instances`.
3. **Unique Shards vs SQLite cards_v2 (14,609 vs 14,611):**
   - 2 synthetic composite migration IDs (`BATTLE-SPIRITS-A13741`, `BATTLE-SPIRITS-A13799`).
   - Reconciliation formula: `14,609 + 2 = 14,611`.

---

## 5. Support Classification Baseline (from Phase K)
- **FULLY_SUPPORTED:** 4,139 cards (28.33%)
- **PARTIALLY_SUPPORTED:** 6,996 cards (47.89%)
- **VANILLA:** 374 cards (2.56%)
- **UNSUPPORTED:** 3,100 cards (21.22%)
- **Total Classified Cards:** 14,609 cards

---

## 6. Architecture & Defect Identification

### Defect 1: Target-Side Validation Flaw in `engine/selectors.js`
In `validateTargetAvailability(state, target, expectedZone)`:
```javascript
const sides = (target.side === 'opponent' || target.side === 'opp')
  ? ['opponent', 'player']
  : ['player', 'opponent'];
for (const s of sides) { ... }
```
- **Issue:** If `target.side` is explicitly `'player'`, the loop searches `'player'` first, but if not found on `'player'`, it falls through to `'opponent'`. Conversely, an explicit `'opponent'` target falls through to `'player'`. This causes opponent cards to be validated as legal targets when targeting player cards, violating side isolation.

### Defect 2: Source-Zone Precedence Flaw in `engine/ops/index.js`
1. In `case 'SUMMON':`:
   ```javascript
   if (op.target === 'this_card' || op.from === 'this_card') {
     pool = sourceCard ? [sourceCard] : [];
   } else if (context.revealedCards && context.revealedCards.length > 0) {
     pool = context.revealedCards;
     isRevealed = true;
   } else if (p.revealed && p.revealed.length > 0) {
     pool = p.revealed;
     isRevealed = true;
   } else if (op.from === 'grave' || op.from === 'trash') {
     pool = p.grave;
   ```
   - **Issue:** Incidental `context.revealedCards` or `p.revealed` takes precedence over an explicit `op.from === 'grave'` or `op.from === 'trash'`. Additionally, `op.from` checks were case-sensitive (`'grave'`, `'trash'`), causing uppercase values like `'GRAVE'` to fall through to `p.hand`.
2. In `executeSummonTransaction`:
   - If `op.from` is not `'BURST'`, the function failed to check whether the card matched in the requested `op.from` zone, checking `p.hand` first, then `p.grave`, etc.
   - On commit, it unconditionally filtered all zones rather than removing specifically from the validated source zone.

### Defect 3: Non-Unified Card Movement & Targeting Across Operations
- Operations such as `BOUNCE`, `DESTROY`, `SALVAGE`, `DEPLOY_NEXUS`, `ADD_TO_HAND`, `SEND_TO_TRASH`, `DISCARD`, `MILL`, `REVEAL`, `RETURN_TO_DECK`, and `MOVE_CARD` have fragmented target resolution and zone normalization logic rather than adhering to a single canonical targeting contract.

### Defect 4: Evidence Integrity & Event-Level Binding
- Prior evidence generation could combine disparate events (e.g., matching opcode telemetry with state deltas from different turns or actions). Phase K.1 requires RFC 8785 JSON canonicalization, SHA-256 event fingerprints, and strict event-level binding between target, source zone, before-state, after-state, and test assertion.

### Defect 5: Browser Automation Authenticity
- `tests/real_browser_arena.test.js` successfully executed in real headless Chrome via native CDP in Phase K, but audit identified historical test suites and helpers that manipulated state or invoked prompt resolvers directly. Phase K.1 mandates genuine user actions through the browser UI without synthetic state injection.

---

## 7. Baseline Verification Verdict
The baseline is fully audited and reproduced. All source code, data assets, and tests are preserved. Proceed to **Work Package B (Complete Targeting Architecture Audit)**.
