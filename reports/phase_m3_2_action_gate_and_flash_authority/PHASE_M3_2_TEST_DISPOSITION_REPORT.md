# PHASE M.3.2 TEST DISPOSITION REPORT
## Classification, Audit, and Preservation of Project Test Suites

- **Date**: 2026-11-23
- **Preservation Policy**: Zero tests deleted, zero assertions weakened, zero fabricated results.

---

### 1. Test Disposition Inventory

| Suite File | Scope | Disposition | Rationale |
|---|---|---|---|
| `tests/phase_m3_2_universal_action_authority.test.js` | Universal action gating | **NEW (M.3.2)** | Verifies centralized authority across session & direct calls |
| `tests/phase_m3_2_direct_engine_method_guards.test.js` | Direct method protection | **NEW (M.3.2)** | Verifies `declareBlock`, `resolveDirectHit`, `playCard` guards |
| `tests/phase_m3_2_flash_execution_integrity.test.js` | Execution failure rollback | **NEW (M.3.2)** | Verifies failed Flash actions preserve priority & passes |
| `tests/phase_m3_2_flash_timing_validation.test.js` | Timing rules & qualifiers | **NEW (M.3.2)** | Validates generic vs card-specific restrictions |
| `tests/phase_m3_2_flash_compiler_reconciliation.test.js`| AST & Parser specs | **NEW (M.3.2)** | Validates Japanese/English parser specs & triggered Flash |
| `tests/phase_m3_2_response_window_lifecycle.test.js` | Combat state machine | **NEW (M.3.2)** | Verifies full combat lifecycle & non-forfeiture rule |
| `tests/phase_m3_2_response_window_persistence.test.js` | SQLite serialization | **NEW (M.3.2)** | Verifies window persistence, fresh candidates, redaction |
| `tests/phase_m3_2_two_human_browser_e2e.test.js` | Real browser E2E | **NEW (M.3.2)** | 2 independent Chrome instances via CDP |
| `tests/phase_m3_2_execution_modes.test.js` | 4 execution modes | **NEW (M.3.2)** | Verifies PvP, PvE, EvE, and Headless simulation |
| `tests/phase_m3_1_*.test.js` (4 files) | Flash timing correction | **PRESERVED (M.3.1)** | All 24 tests preserved and passing |
| `tests/phase_m3_*.test.js` (4 files) | Response windows | **PRESERVED (M.3)** | All 17 tests preserved and passing |
| `tests/phase_m2_*.test.js` (6 files) | Session security | **PRESERVED (M.2)** | All 48 tests preserved and passing |
| `tests/accel_mechanics.test.js` | Accel keyword mechanics | **PRESERVED** | All 17 tests preserved and passing |
| `tests/arena_ui_and_timer.test.js` | Arena UI and timer | **PRESERVED** | All 7 tests preserved and passing |

---

### 2. Resolution of Contradictory Test Expectations

During implementation, one minor discrepancy between legacy assertions and authoritative timing was addressed:
- In `tests/phase_m3_1_flash_card_specific_restrictions.test.js`, testing a card with `(Opponent's Attack Step)` during an opponent's attack step previously failed because `action_authority.js` checked `playerSide !== state.activePlayer` before recognizing that the card had the Flash keyword.
- Resolved by recognizing Flash actions within `action_authority.js` and permitting non-active players to submit legal Flash cards during the opponent's attack step per Official Rule Manual v17.0.
