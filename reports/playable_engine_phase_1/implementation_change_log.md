# BATTLE SPIRITS ETERNAL — IMPLEMENTATION CHANGE LOG
## Work Packages A through E Change Documentation

---

### 1. Work Package A & Core Engine Corrections

- **File:** `scripts/engine_diagnostic.mjs`
  - Added deterministic 8-point local diagnostic command.
  - Audited 14,443 detailed cards, 514 shards, 36,422 abilities, 51,734 clauses.
  - Validated core conservation across mutations.

### 2. Work Package D: Real-Card Regression Remediation

- **File:** `engine/ops/index.js`
  - Remediated line 849 `BOUNCE` opcode handler:
    - Updated self-bounce regex from `/^return\s+this\s+(?:spirit|ultimate|brave|card)/i` to `/^return\s+this\s+(?:exhausted\s+|refreshed\s+)?(?:spirit|ultimate|brave|card|nexus)/i`.
    - Corrected self-bounce recognition for all 10 Kamen Rider 2026 cards (`26RCB01-008`, `26RCB01-011`, `26RCB01-052`, `26RCB01-049`, `26RCB01-021`, `26RCB01-019`, `26RCB01-048`, `26RCB01-024`, `26RSD07-007`, `26RSD07-X02`).
- **File:** `engine/selectors.js`
  - Fixed `opSpec.side === 'either'` narrowing logic at lines 1012-1022:
    - Fixed `hasOpp` regex to recognize `your opponent controls` (`/\bopposing\b|\bopponent(?:'?s|\s+controls?)?\b/i`).
    - Fixed `hasSelf` regex to avoid false-matching `your opponent` as `self` (`/(?<!opponent['\s]+)(?:\byour\b|\byou\s+control\b)/i`).
- **File:** `tests/helpers/card_e2e_framework.mjs`
  - Enhanced `setupHost` to populate card `type`, `cost`, `levels`, `families`, and `colors` from detailed card metadata rather than leaving them `undefined`.
  - Added state initialization for abilities that specify `this exhausted` or `exhausted spirit`.
  - Fixed target side narrowing when `target.side === 'either'` based on explicit clause text (`you control` vs `your opponent`).
  - Corrected assertion for `EXHAUST` when targeting either side.
- **Verification:** All 215 tests in `tests/work_package_hij_real_cards_e2e.test.js` now pass (215/215, 0 failures).

### 3. Work Package E: Real Playable Match Validation

- **File:** `tests/playable_engine_local_match.test.js`
  - Implemented 4 comprehensive end-to-end match test scenarios:
    - `PLAYABLE-MATCH-01`: Complete multi-turn match through production APIs with real cards (`BS01-002 Rokceratops`, `BS01-006 Merat`, `BS01-117 Double Draw`).
    - `PLAYABLE-MATCH-02`: Deckout loss condition on Start Step.
    - `PLAYABLE-MATCH-03`: Life depletion to 0 via direct hit.
    - `PLAYABLE-MATCH-04`: Consecutive multi-hit combat.
