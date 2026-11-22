# BATTLE SPIRITS ETERNAL — PHASE 3D
## Unsupported Variant & Fail-Closed Report

---

### Non-Negotiable Fail-Closed Guarantee
In accordance with Core Rule 1 and the Phase 3D directives, unsupported effect variants are **never** silently routed through default fallbacks. They produce structured diagnostic outcomes (`UNSUPPORTED_OPERATION`, `UNSUPPORTED_CONDITION`, or `MISSING_IR_PARAMETERS`) and abort resolution without mutating game state.

### Explicitly Excluded Out-of-Scope Variants
1. `RESURRECT_OPPONENT_CARD`: Cross-player graveyard resurrection without explicit ownership transfer.
2. `REMOVE_FROM_GAME_FACE_DOWN`: Secret removed zone tracking.
3. `REORDER_ENTIRE_DECK_INTERACTIVE`: Manual 40-card full-deck sorting UI.
4. `MULTI_STAGE_VARIABLE_BP_SWAP`: Indeterminate recursive BP swap loops.
5. `RETROACTIVE_TURN_REWIND`: Historical game state rollback beyond current turn.
