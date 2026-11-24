# Magic Correction — Regression Results

## 1. Dedicated Magic Regression Suite (`tests/magic_legality_and_resolution.test.js`)

Command:
`node --test tests/magic_legality_and_resolution.test.js`
Exit code: `0` — **9/9 PASSED (0 failed, 0 skipped)**

| Test ID | Category | Real DB Card(s) | Result |
|---|---|---|---|
| `MAGIC-A01` | Canonical Card-Type Classification (9 DB types) | — | **PASS** |
| `MAGIC-B01` | Invalid Summon / Deploy / Magic Pathway Rejection | `SD06-013` | **PASS** |
| `MAGIC-C01` | Main Step Activation, Cost Payment & Trash Destination | `SD06-013` | **PASS** |
| `MAGIC-DE01` | Flash Timing, Symbol Reduction & Priority Alternation | `SD69-006` | **PASS** |
| `MAGIC-F01` | Targeted Magic Suspend, Forged-Target Reject & Resume | `BSC29-018` | **PASS** |
| `MAGIC-GHI01` | Multi-Prompt Magic Across SQLite Eviction & Restore | `TEST-SEQ-MAG` | **PASS** |
| `MAGIC-JK01` | Unsupported Clause Honesty & Banish Destination | `EXG4-006`, `CB05-059` | **PASS** |
| `MAGIC-L01` | `HUMAN_VS_AI` AI Magic Execution | `SD06-013` | **PASS** |
| `MAGIC-M01` | Real Chrome CDP UI Guard, Cast Button & Prompt Modal | `SD06-013` | **PASS** |

---

## 2. Combined Regression & Data Audit Verification

1. **Combined Regression Run**:
   `node --test tests/magic_legality_and_resolution.test.js tests/phase_m_session_persistence.test.js tests/phase_m_security_and_authority.test.js tests/phase_m1_concurrency_recovery.test.js tests/phase_m3_response_window_manager.test.js tests/phase_m3_flash_priority.test.js tests/phase_m3_block_and_second_flash.test.js tests/phase_m3_action_progression_lock.test.js`
   Exit code: `0` — **50/50 PASSED (0 failed, 0 skipped)**
2. **Data Integrity Audit**:
   `node --test tests/data_audit.test.js`
   Exit code: `0` — **3/3 PASSED (0 failed, 0 skipped)**

---

## 3. Pre-Existing / Unrelated Failures Observed in Separate Legacy Runs
- `tests/core_game_rules_engine.test.js` (`CORE-COMBAT-01`, `CORE-MATCH-01`) and `tests/core_game_rules_integrity_corrective.test.js` (`CORR-EVENT-01`): pre-existing failures from prior working-tree changes to `declareAttack` / `endBattle` (unrelated to Magic card handling).
- `tests/interaction_protocol.test.js` (`INTERACTION-05`) and `tests/phase_l1_player_authority_adversarial.test.js` (`TC-L1-P03`): failed on pre-existing `CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE` logic in `engine/interaction.js` (present in working tree prior to Magic correction).
