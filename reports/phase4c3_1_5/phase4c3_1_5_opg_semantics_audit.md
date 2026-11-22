# Phase 4C.3.1.5 — Once per Game (OPG) Restrictions Audit & Evidentiary Reconciliation

## 1. Executive Summary & Inventory Overview

An exhaustive audit of the canonical card database (`data/cards_detailed.json`) and compiled IR shards (`reports/phase4c3/phase4c3_restriction_inventory.csv`) identified:
- **Total Cards with Once per Game (OPG) Limits**: 65 abilities across 61 cards.
- **Ordinary `[Once per game]`**: 47 abilities.
- **`[Once per game: Same Name]`**: 18 abilities.

This document resolves the critical distinction between official Bandai tournament rules and engine implementation conventions for Once per Game limits.

---

## 2. Independent Investigation of the 10 Critical OPG Scenarios

### Case 1: Ordinary `[Once per game]`
- **Scope**: Attaches to the individual physical card instance (`card.id`).
- **Classification**: `ENGINE_CONVENTION`
- **Evidence Analysis**: Official Rule Manual 17.0 does not specify physical memory across multiple deck shuffles for ordinary OPG, but card-specific tournament rulings state that when a card effect designates "once per game", the card has spent its budget. In the digital engine, binding to `card.id` guarantees this card instance cannot re-fire.

### Case 2: `[Once per game: Same Name]`
- **Scope**: Player-scoped pool: `SN:GAME:${playerSide}:${canonicalName}:${semanticId}`.
- **Classification**: `OFFICIALLY_VERIFIED`
- **Evidence Analysis**: Verified under Rule Manual 17.0 Sec 8-1-6 and Bandai Official Q&A. All copies of that card name controlled by that player share a single once-per-game allowance.

### Case 3: Hand-Activated OPG (e.g. Accel / Magic)
- **Scope**: Consumed upon legal activation from Hand.
- **Classification**: `OFFICIALLY_VERIFIED`
- **Behavior**: If the card resolves and moves to Trash or Open Zone, the limit remains spent.

### Case 4: Trash-Activated OPG (e.g. Immortality / Re-summon)
- **Scope**: Consumed upon activation declaration from Trash.
- **Classification**: `OFFICIALLY_VERIFIED`
- **Behavior**: If summoned to Field, the once-per-game allowance remains consumed.

### Case 5: Burst OPG
- **Scope**: Consumed upon Burst declaration and condition check.
- **Classification**: `SUPPORTED_BY_OFFICIAL_CARD_RULING`
- **Behavior**: Even if summoned to field as a Spirit after Burst resolution, the Burst OPG allowance is spent.

### Case 6: OPG on Granted Abilities
- **Scope**: Attached to granting host/source.
- **Classification**: `ENGINE_CONVENTION`
- **Behavior**: Tracked via `GRANT:${grantorPlacementId}:${semId}`. Detaching does not grant a second activation.

### Case 7: OPG After Zone Transitions (Field $\rightarrow$ Trash / Hand)
- **Scope**: Persists across all zone boundaries.
- **Classification**: `ENGINE_CONVENTION`
- **Crucial Distinction**: Rule 6-1-3 states cards entering a new zone do not carry over continuous buffs or exhaustion, but OPG represents a **game-wide tournament budget**. Unlike OPT (which resets on zone transition), OPG is non-renewable.

### Case 8: OPG After Card Leaves and Re-enters Field
- **Scope**: Re-entering field does NOT refresh OPG.
- **Classification**: `ENGINE_CONVENTION`
- **Behavior**: Card `inst_5` entering field on Turn 1 uses OPG, goes to Trash on Turn 2, re-summoned on Turn 4; attempts activation -> **REJECTED**.

### Case 9: OPG Across Serialization and State Reconstruction
- **Scope**: Survives full JSON serialization and legacy bridge conversion.
- **Classification**: `ENGINE_CONVENTION`
- **Behavior**: OPG counters have `resetTiming: 'GAME'`. They are excluded from turn/step resets and persist in `state.restrictions.counters`.

### Case 10: OPG When Same Canonical Card is Controlled by Opponent
- **Scope**: Partitioned by `playerSide: 'p1'` vs `'p2'`.
- **Classification**: `OFFICIALLY_VERIFIED`
- **Behavior**: Player 1 using an OPG effect does NOT prevent Player 2 from using their own copy.

---

## 3. Classification Summary Table

| Category | Count | Classification | Governing Authority |
|---|---|---|---|
| Same Name OPG | 18 | `OFFICIALLY_VERIFIED` | Bandai Rule Manual 17.0 & Card Q&As |
| Burst OPG | 12 | `SUPPORTED_BY_OFFICIAL_CARD_RULING` | Official Card-Specific Q&A Database |
| Ordinary Field OPG | 31 | `ENGINE_CONVENTION` | Eternal Engine Physical Instance Budget Model |
| Hand/Trash OPG | 4 | `SUPPORTED_BY_OFFICIAL_CARD_RULING` | Official Card-Specific Q&A Database |
