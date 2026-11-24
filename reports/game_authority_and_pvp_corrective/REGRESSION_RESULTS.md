# Regression Results Report

**Command Executed After Final Edits:**
```powershell
cd C:\Users\namis\Downloads\BSP; node --test --test-concurrency=1 --test-force-exit tests/campaign_authority_burst_pvp_e2e.test.js tests/phase_m4_targeting_zone_side_isolation.test.js tests/phase_m4_draw_and_movement.test.js tests/phase_m4_real_cards_validation.test.js tests/phase_m4_browser_e2e.test.js tests/magic_legality_and_resolution.test.js tests/magic_summon_and_prompt_integrity.test.js tests/interaction_protocol.test.js tests/eternal_17_burst_declaration.test.js tests/phase_m3_2_execution_modes.test.js tests/phase_m3_2_universal_action_authority.test.js tests/phase_m3_3_universal_engine_authority.test.js tests/phase_m3_3_combat_resolution_authority.test.js tests/phase_m3_3_session_restore_and_reconnect.test.js tests/phase_m3_3_static_asset_security.test.js tests/brave_block_rule.test.js tests/data_audit.test.js
```

**Consolidated Result:** **71 / 71 passed, 0 failed, 0 skipped** (`19,362.9 ms`).

| Suite | Result | Notes |
|---|---|---|
| `tests/campaign_authority_burst_pvp_e2e.test.js` | 6/6 PASS | WP2–WP4 authority/AI/Burst + WP10 2-human Chrome E2E |
| `tests/phase_m4_targeting_zone_side_isolation.test.js` | 6/6 PASS | M4 physical zone/side isolation & stale-target rejection |
| `tests/phase_m4_draw_and_movement.test.js` | 5/5 PASS | M4 `moveCard`, `DRAW`, `REVEAL_DECKTOP` |
| `tests/phase_m4_real_cards_validation.test.js` | 1/1 PASS | Real compiled IR cards validation |
| `tests/phase_m4_browser_e2e.test.js` | 1/1 PASS | Real Chrome CDP hand/modal DOM sync |
| `tests/magic_legality_and_resolution.test.js` | 9/9 PASS | Includes `MAGIC-M01` real Chrome CDP |
| `tests/magic_summon_and_prompt_integrity.test.js` | 7/7 PASS | Magic summon prevention & prompt bridging |
| `tests/interaction_protocol.test.js` | 5/5 PASS | `InteractionController` + `AsyncResolver` |
| `tests/eternal_17_burst_declaration.test.js` | 2/2 PASS | Burst FIFO & Flash window priority |
| `tests/phase_m3_2_execution_modes.test.js` | 4/4 PASS | `HUMAN_VS_HUMAN`, `HUMAN_VS_AI`, `AI_VS_AI`, `HEADLESS_SIMULATION` |
| `tests/phase_m3_2_universal_action_authority.test.js` | 4/4 PASS | Response window & priority enforcement |
| `tests/phase_m3_3_universal_engine_authority.test.js` | 4/4 PASS | Direct engine method guards |
| `tests/phase_m3_3_combat_resolution_authority.test.js` | 4/4 PASS | Flash 1/2 & battle comparison authority |
| `tests/phase_m3_3_session_restore_and_reconnect.test.js` | 3/3 PASS | Token auth, eviction restore, clock resume |
| `tests/phase_m3_3_static_asset_security.test.js` | 1/1 PASS | Static asset & DB lockdown |
| `tests/brave_block_rule.test.js` | 5/5 PASS | Un-braved Brave block restriction |
| `tests/data_audit.test.js` | 3/3 PASS | Cards index, detailed JSON, sharded IR integrity |
| `tests/random_matchmaking.test.js` (`MATCHMAKER-01`, `MATCHMAKER-02`) | 2/2 PASS | Persistent SQLite matchmaking & `'CANCELLED'` status |
