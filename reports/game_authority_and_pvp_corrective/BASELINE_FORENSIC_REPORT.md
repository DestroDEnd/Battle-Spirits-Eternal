# Baseline Forensic Verification Report (WP1)

**Commit:** `4e9ffa1 fix(session_manager): ensure scrubCredentials wraps match snapshot responses`  
**Working Tree:** Preserved intact (existing modified files in `app.js`, `arena.html`, `battle_arena.js`, `battle_spirits.db`, `browse.html`, `compiler/*`, `data/ir_shards/*`, plus recent `HoloCard`, `AeroShards`, `brave_block_rule`, and PvP deck selector additions).  

## 1. Baseline Regression Results

| Suite / Group | Pass | Fail | Classification |
|---|---:|---:|---|
| M4 Targeting & Draw (`phase_m4_targeting_zone_side_isolation`, `phase_m4_draw_and_movement`, `phase_m4_real_cards_validation`) | 12 | 0 | Previously fixed — intact |
| Magic Legality & Resolution (`magic_legality_and_resolution` non-browser + `magic_summon_and_prompt_integrity`) | 15 | 0 | Previously fixed — intact |
| `MAGIC-M01` (`magic_legality_and_resolution.test.js:464`) | 0 | 1 | Environment / port conflict (`Server start timed out` while port 3000 daemon active) |
| Interaction Protocol (`interaction_protocol.test.js`) | 5 | 0 | Intact |
| M3.2 & M3.3 Authority (`phase_m3_2_universal_action_authority`, `phase_m3_3_universal_engine_authority`, `phase_m3_3_combat_resolution_authority`) | 12 | 0 | Intact |
| Brave Block Rule (`brave_block_rule.test.js`) | 5 | 0 | Intact |
| Data Audit (`data_audit.test.js`) | 3 | 0 | Intact |
| `MATCHMAKER-01` (`random_matchmaking.test.js:51`) | 0 | 1 | **Genuine implementation defect:** `TypeError: (options.playerDeck || []).map is not a function` in `Matchmaker.enterQueue -> createMatch -> createGame` |
| `MATCHMAKER-02` (`random_matchmaking.test.js:140`) | 0 | 1 | **Genuine implementation/API defect:** `400 !== 200` on `/api/matchmaking/find` |
| `MATCHMAKER-03` (`random_matchmaking.test.js:258`) | 0 | 1 | Environment / port conflict (`Server start timed out`) |

## 2. Confirmed Root Causes Requiring Implementation (WP2–WP8)
1. **RC-01 (`engine/index.js`):** Decision routing uses hardcoded `chooser === 'opponent'` instead of `MatchContext.canAiDecide(chooser)` / `canSimulate(chooser)`.
2. **RC-02 (`engine/ai.js`):** `AIDecider` does not enforce `prompt.chooser === this.side` and unconditionally activates `BURST_TRIGGER`.
3. **RC-03 (`engine/resolver.js`):** `DefaultPromptResolver` unconditionally auto-accepts `BURST_TRIGGER` / `CONFIRM_OPTIONAL` / `CONFIRM_ACTION` / `OPTIONAL_TRIGGER` / `ACTIVATE_EFFECT` even in human modes.
4. **RC-04 (`engine/interaction.js`):** `respond()` needs strict `authContext` owner verification against `interaction.decisionOwner` (`HUMAN_INTERACTION_UNROUTABLE` when unroutable).
5. **RC-05 (`battle_arena.js`):** Missing `onResume` continuation in `executeWhenSummonedEffects`, synchronous `runAiMainStep` / `runAiAttackStep` advancing past pending human Burst, and unsafe `if (!modal) activateBurst('player', true)` fallback.
6. **RC-06 (`engine/response_window.js`):** `resolveAbility()` receives `this.game.events` as its 4th (`promptResolver`) argument.
7. **RC-07 (`engine/matchmaker.js`, `engine/session_store.js`):** Process-local `Map` queue/matches; lacks atomic SQLite persistence, `CANCELLED` tracking, and multi-instance safety.
8. **RC-08 (`battle_arena.js`):** `resumeBattle()` lacks full `DuelState` hydration and `handleRealtimeMatchEvent()` ignores `STATE_UPDATED` / `ACTION_APPLIED` / `INTERACTION_REQUESTED` / `RESPONSE_WINDOW_UPDATED`.
