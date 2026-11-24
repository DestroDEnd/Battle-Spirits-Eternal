# PHASE M4 — DRAW & MOVEMENT REGRESSION RESULTS

## Command Executed
```powershell
node --test --test-force-exit tests/phase_m4_draw_and_movement.test.js tests/phase_m4_real_cards_validation.test.js tests/phase_m3_2_response_window_persistence.test.js tests/phase_m3_3_session_restore_and_reconnect.test.js
```

## Summary
- **All draw, card-movement, real-card matrix, and persistence/reconnect tests passed (included in the 73/73 exit-0 verification run).**
- Verified behaviors:
  - `M4-DRAW-01`: `DRAW` and `DRAW_CARDS` (both `count` and `amount`) move top cards from `deck` to `hand`, verify deck removal and single-instance hand placement, and emit `CARD_DRAWN`.
  - `M4-DRAW-02`: `CANNOT_DRAW` restriction, `maxDraw` modifier, and empty-deck handling behave deterministically.
  - `M4-DRAW-03`: `REVEAL_DECKTOP` -> `ADD_TO_HAND` -> `DISCARD_REMAINING` moves cards cleanly through `deck` -> `revealed` -> `hand` / `grave` without `p.open` ghosting.
  - `M4-MOVE-04`: `moveCard` rejects mismatched `expectedFromZone` / `expectedFromSide` without mutating state.
  - `M4-SYNC-05`: `createEngineStateFromLegacy`, `syncEngineStateToLegacy`, and `serializeGameState` / `deserializeGameState` preserve `revealed` and `openCards` without duplicating Nexuses across `player.field` and `player.nexus`.
  - `M4-REAL-CARDS-01`: Validated real compiled cards from `data/ir_shards/` across `DRAW`, `DISCARD_HAND`, `SALVAGE`, `REVEAL_DECKTOP`, and `DESTROY` with zero cross-zone instance duplication (`reports/phase_m4/REAL_CARD_VALIDATION_MATRIX.json`).
