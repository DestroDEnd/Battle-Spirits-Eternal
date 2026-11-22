# Phase 4C.3.1.6 — Once per Game (OPG) Reconciliation & 12-Scenario Audit

## 1. Executive Summary

An audit of all 65 canonical Once per Game abilities was performed across `data/cards_detailed.json` and `reports/phase4c3/phase4c3_restriction_inventory.csv`.
The audit verified:
- **Total OPG Abilities**: 65
- **Ordinary `[Once per game]`**: 47
- **`[Once per game: Same Name]`**: 18
- **Evidence Classifications**:
  - `OFFICIALLY_VERIFIED`: 18 abilities (100% of Same Name OPG).
  - `SUPPORTED_BY_OFFICIAL_CARD_RULING`: 13 abilities (Burst, Hand, Trash OPG).
  - `ENGINE_CONVENTION`: 34 abilities (Ordinary Field OPG instance tracking).

---

## 2. Independent Analysis of the 12 Specific OPG Scenarios

### 1. Ordinary Field OPG (e.g. BS50-025, BS52-X01)
- **Scope**: Bound to physical card instance (`card.id`).
- **Classification**: `ENGINE_CONVENTION`.
- **Reasoning**: Unlike OPT (which resets under Rule 6-1-3), OPG represents a **match-long card budget**. Digital engine enforces this by persisting `GI:${player}:${card.id}:${physId}` for the entire game.

### 2. Same Name OPG (e.g. BS64-CX02, BS75-X03)
- **Scope**: Player-scoped game pool: `SN:GAME:${player}:${canonicalName}:${semId}`.
- **Classification**: `OFFICIALLY_VERIFIED`.
- **Reasoning**: Official Comprehensive Rules Sec 8-1-6 and card Q&A confirm that all copies sharing that card name controlled by that player share a single once-per-game allowance.

### 3. Hand-Activated OPG (e.g. Accel / Magic)
- **Scope**: Consumed upon activation from Hand; card moves to Trash or Open Zone.
- **Classification**: `SUPPORTED_BY_OFFICIAL_CARD_RULING`.
- **Reasoning**: Card Q&A confirms that casting a Magic or Accel marked Once per Game spends that card's allowance for the duel.

### 4. Trash-Activated OPG (e.g. BS35-X01 Immortality)
- **Scope**: Consumed upon activation declaration from Trash.
- **Classification**: `SUPPORTED_BY_OFFICIAL_CARD_RULING`.
- **Reasoning**: Summons to field, but its Once per Game allowance remains spent.

### 5. Burst OPG (e.g. BS14-X01, BS64-CX02)
- **Scope**: Consumed upon Burst declaration and condition validation.
- **Classification**: `SUPPORTED_BY_OFFICIAL_CARD_RULING`.
- **Reasoning**: When the Burst resolves and the card enters the field as a Spirit, its Burst OPG allowance is spent.

### 6. Granted Ability OPG
- **Scope**: Tracked via `GRANT:${grantorPlacementId}:${semId}`.
- **Classification**: `ENGINE_CONVENTION`.
- **Reasoning**: Prevents granted OPG abilities from permanently remaining on the host Spirit if the Brave detaches.

### 7. Field-to-Trash Movement
- **Scope**: Does NOT reset OPG.
- **Classification**: `ENGINE_CONVENTION`.
- **Reasoning**: Card destroyed to Trash retains its consumed OPG record in `state.restrictions.counters`.

### 8. Trash-to-Field Re-entry
- **Scope**: Re-entering the Field does NOT refresh OPG.
- **Classification**: `ENGINE_CONVENTION`.
- **Reasoning**: A card re-summoned from Trash 3 turns later has already spent its match budget and cannot re-activate OPG.

### 9. Hand-to-Field Movement
- **Scope**: Does NOT reset OPG.
- **Classification**: `ENGINE_CONVENTION`.
- **Reasoning**: Bouncing a card to Hand and re-summoning does not renew an ordinary Once per Game effect.

### 10. Opponent-Controlled Copies
- **Scope**: Partitioned by `playerSide: 'p1'` vs `'p2'`.
- **Classification**: `OFFICIALLY_VERIFIED`.
- **Reasoning**: Player 1 spending their OPG allowance does not prevent Player 2 from activating their own copy.

### 11. Reprints and Errata
- **Scope**: Cross-set reprints and errata cards share identical Same Name OPG pools.
- **Classification**: `SUPPORTED_BY_OFFICIAL_CARD_RULING`.

### 12. State Serialization & Reconstruction
- **Scope**: OPG counters have `resetTiming: 'GAME'`.
- **Classification**: `ENGINE_CONVENTION`.
- **Reasoning**: Excluded from turn, step, and battle resets; serialized across legacy bridge.
