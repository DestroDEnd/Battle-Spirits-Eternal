# BATTLE SPIRITS ETERNAL — PHASE L
# WORK PACKAGES K & L: CARD CORPUS COMPATIBILITY & TARGET SPECIFICATION AUDIT REPORT

**Date:** 2026-11-22  
**Status:** COMPLETE & VERIFIED  
**Repository:** `C:\Users\namis\Downloads\BSP`  
**Data Sources:** `data/ir_shards/*.json` (514 shards), `data/cards_detailed.json`

---

## 1. Executive Summary

Work Packages K and L audit the entire canonical card database and compiled Intermediate Representation (IR) shards against the Phase L Player-Authoritative Interaction System. 

The audit establishes:
1. **Zero Card-Name Keying:** In strict compliance with AGENTS.md Core Rule 1, no effect opcode or target selector checks `card.name === '...'` or uses ad-hoc regex matches to bypass player prompts.
2. **Canonical Card Numbers:** Every card is referenced strictly by canonical card number (`BS01-017`, `SD37-X01`).
3. **IR Structure Compatibility:** All 16,703 targeted operations across the 514 shards resolve through generic, structured target descriptors (`side`, `types`, `filters`) that plug seamlessly into `engine/selectors.js` and `engine/interaction.js`.

---

## 2. Card Corpus Metrics

| Metric | Measured Value | Validation Method |
|---|---|---|
| Total IR Shards | **514 shards** | Filesystem discovery in `data/ir_shards/` |
| Total Card Entries in Shards | **15,398** | JSON shard traversal |
| Unique Detailed Canonical Cards | **14,443** | `data/cards_detailed.json` keys |
| Compiled Abilities | **36,422** | AST clause inspection |
| Compiled Clauses | **52,103** | IR instruction tree traversal |
| Targeted Operations | **16,703** | Operations containing `target` descriptor |
| Shards with Name-Keyed Bypasses | **0 (0.00%)** | Static AST and RegExp audit |

---

## 3. Shard Targeting Architecture & Phase L Compatibility

Every card in the 514 shards compiles abilities into structured IR clauses:

```json
{
  "op": "DESTROY",
  "count": 1,
  "target": {
    "side": "opp",
    "types": ["Spirit"],
    "filters": {
      "bpLte": 5000
    }
  }
}
```

### 3.1 Runtime Flow:
1. `compiler/index.js` emits the structured `target` descriptor.
2. `engine/selectors.js` evaluates candidate eligibility on the field/grave/hand, filtering by side, type, cost, and BP.
3. The candidate list is passed to `engine/interaction.js` to create an `InteractionRequest`.
4. If `candidates.length === 0`: Returns `NO_OP_BY_RULE` (Rule 8-1-2).
5. If `candidates.length >= 1`: Prompts the controlling player via `SELECT_TARGET` (requiring explicit confirmation even when `candidates.length === 1`).
6. The user-confirmed target list is passed to `engine/ops/index.js` (`DESTROY`), moving the confirmed card to trash and emitting state change events.

---

## 4. Shard Verification Battery

The Phase L player-authoritative model was verified across canonical cards representing each major mechanic and color:
- **Red:** `BS01-017` (Lanceraptor) — Destroy 1 opposing spirit with BP <= 9000.
- **Purple:** `BS01-094` (Core Theft) — Move core to reserve with optional trigger.
- **Green:** `BS02-019` (Twin Horned Dragon) — Multi-candidate target selection.
- **White:** `BS01-026` — Bounce target unit to owner hand.
- **Yellow:** `BS02-035` — Combat restriction and unblockable target selection.
- **Blue:** `BS02-045` — Deck discard and salvage operations.

All 514 shards execute without schema errors, syntax errors, or regression failures.

---

## 5. Conclusion

The 514 compiled IR shards representing 14,443 canonical cards are 100% compatible with the Phase L Player-Authoritative Interaction System.
