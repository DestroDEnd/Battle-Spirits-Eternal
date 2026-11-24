# PHASE M4 — BROWSER END-TO-END RESULTS

## Command Executed
```powershell
node --test --test-force-exit tests/phase_m4_browser_e2e.test.js
```

## Results
- **`M4-BROWSER-E2E` PASSED (3422.98ms in full verification run, 0 failures).**
- Executed in real headless Chrome via CDP (`tests/helpers/real_browser.js`) against `arena.html`:
  1. **Canonical Target Modal Identity (`promptStructuredDecision`):**
     - Verified `SELECT_CARDS` for `zone: 'hand'`, `side: 'player'` renders `data-cand-key="hand:player:h_2"`, displays `[player:hand]` context, suspends without auto-selecting (`autoSelected: false`), and returns canonical `['hand:player:h_2']` on user click + Confirm.
  2. **Draw-to-Hand DOM Synchronization (`SagaConditionDSL.fx.drawCards` + `renderPlayerHand` + `renderDuelTable`):**
     - Verified `DuelState.player.deck.length` decremented from `2` to `0`, `DuelState.player.hand.length` incremented from `1` to `3`, and `#playerHand` DOM children increased by `2` immediately after draw execution.

## Additional Finding Recorded
- `arena.html` includes `<script type="module" src="./engine_adapter.js?v=8.0"></script>`, which transitively imports `node:crypto` and `node:util` via `engine/rules/eternal.js`, `engine/session_mode.js`, and `engine/restrictions.js` (pre-existing browser ESM incompatibility). Browser-side compiled card execution in `arena.html` runs via `engine/cards/bundle.js` (`window.SagaConditionDSL`) and `battle_arena.js` (`window.BattleArena`).
