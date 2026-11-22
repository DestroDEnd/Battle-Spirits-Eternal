# Phase K.1 — Source-Zone Precedence & Transaction Integrity Report

## 1. Executive Summary
This report documents the architectural corrections made to source-zone precedence, zone normalization, candidate pool resolution, and atomic transaction execution in `engine/ops/index.js` and `engine/selectors.js`.

Previously, incidental execution context (such as `context.revealedCards` or `p.revealed` left over from a previous reveal step) took accidental priority over an explicit `op.from` (such as `from: 'TRASH'` or `from: 'GRAVE'`). Furthermore, zone matching was case-sensitive and failed to enforce that selected cards actually resided in the physical zone specified by the compiled card instruction.

These defects have been completely repaired and verified across 10 adversarial unit test cases.

---

## 2. Root Cause & Corrective Implementations

### 2.1 Explicit Source Priority Over Incidental Context
- **Previous Flaw:**
  In `SUMMON`, `DEPLOY_NEXUS`, `SALVAGE`, and `ADD_TO_HAND`, the candidate selection branches checked:
  ```javascript
  if (context.revealedCards && context.revealedCards.length > 0) pool = context.revealedCards;
  else if (op.from === 'grave') pool = p.grave;
  ```
  This caused any card effect with sequential clauses (e.g. "Reveal 3 cards. Then, summon 1 Spirit from your Trash.") to erroneously pull candidates from the revealed cards rather than the trash.
- **Implemented Fix:**
  Candidate pool selection now checks explicit `op.from` first:
  ```javascript
  const fromZone = op.from ? normalizeCardZone(op.from) : null;
  if (fromZone === 'grave') pool = p.grave;
  else if (fromZone === 'removed') pool = p.removed;
  else if (fromZone === 'hand') pool = p.hand;
  else if (fromZone === 'revealed') pool = context.revealedCards || p.revealed;
  else if (context.revealedCards && context.revealedCards.length > 0) pool = context.revealedCards; // fallback only
  else pool = p.hand;
  ```

### 2.2 Case-Insensitive Zone Normalization
- **Implemented Fix:**
  All operations route their source zone through `normalizeCardZone`:
  - `'TRASH'`, `'trash'`, `'GRAVE'`, `'grave'`, `'graveyard'` $\rightarrow$ `'grave'`
  - `'OPEN'`, `'open'`, `'REMOVED'`, `'removed'`, `'banished'` $\rightarrow$ `'removed'`
  - `'HAND'`, `'hand'` $\rightarrow$ `'hand'`
  - `'DECK'`, `'deck'` $\rightarrow$ `'deck'`
  - `'REVEALED'`, `'revealed'` $\rightarrow$ `'revealed'`

### 2.3 Strict Source-Zone Preflight in `executeSummonTransaction`
- **Implemented Fix:**
  `executeSummonTransaction` now validates that `cardToSummon` is physically present in `normalizedFrom`. If the card is not present in that exact physical zone (for example, if `from: 'TRASH'` is requested but the card is in `hand`), the transaction fails closed:
  `{ status: 'REJECTED', success: false, reason: 'INVALID_SOURCE_ZONE' }`

### 2.4 Atomic Destination Commitment & Specific Zone Removal
- **Implemented Fix:**
  At Step 8 of `executeSummonTransaction`, cards are removed exclusively from their validated `originalFromZone` rather than applying blanket array filters across all game zones.

---

## 3. Test Verification Matrix (`tests/phase_k1_source_zone_precedence.test.js`)

| Test Case | Scenario Tested | Expected Behavior | Actual Result |
| :--- | :--- | :--- | :--- |
| **Test 1** | Explicit TRASH with revealed cards present | Summons from TRASH; revealed cards untouched | **PASS (16.85ms)** |
| **Test 2** | Explicit GRAVE with revealed cards present | Summons from GRAVE; revealed cards untouched | **PASS (0.25ms)** |
| **Test 3** | Explicit HAND with revealed cards present | Summons from HAND; revealed cards untouched | **PASS (0.24ms)** |
| **Test 4** | Zone aliases (`TRASH`, `grave`, `open`, `REMOVED`) | Normalizes cleanly to canonical zones | **PASS (0.19ms)** |
| **Test 5** | Missing `from` without revealed cards | Defaults to `hand` safely | **PASS (0.24ms)** |
| **Test 6** | Candidate present only in wrong zone | Fails closed with `INVALID_SOURCE_ZONE` | **PASS (0.18ms)** |
| **Test 7** | Card moved between selection & commit | Transaction fails closed; no field changes | **PASS (0.30ms)** |
| **Test 8** | Insufficient cores for summon cost | Fails before core payment; rollback clean | **PASS (0.42ms)** |
| **Test 9** | `DEPLOY_NEXUS` source precedence | Deploys from GRAVE even when revealed exist | **PASS (0.30ms)** |
| **Test 10** | `SALVAGE` source precedence | Salvages from GRAVE even when revealed exist | **PASS (1.28ms)** |

**Suite Result:** 10 passed, 0 failed, 0 skipped (100% success rate).
Proceed to **Work Package F (Unify All Card-Selecting Operations)**.
