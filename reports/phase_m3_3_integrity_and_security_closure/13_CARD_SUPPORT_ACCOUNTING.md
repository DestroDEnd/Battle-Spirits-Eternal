# PHASE M.3.3 — INTEGRITY, SECURITY, UNIVERSAL ACTION AUTHORITY & REGRESSION CLOSURE
## 13 — CARD SUPPORT & KEYWORD RUNTIME ACCOUNTING

### Executive Summary
This report provides an authoritative accounting of supported card archetypes, keyword mechanics, and card database validation for Battle Spirits Eternal. Historical phases occasionally reported card support based solely on compiler IR emission rather than validated engine execution. In Phase M.3.3, runtime support is strictly accounted for based on verified test harnesses, event hooks, and rules-compliant engine execution.

---

### Canonical Card Validation Inventory

| Card ID | Card Name | Color | Type | Cost / Reduction | Verified Abilities / Keywords | Runtime Execution Status | Test Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BS01-001` | Lizard Man | Red | Spirit | 1 / 0 | Vanilla attacker (1000/2000 BP) | Fully Supported | `phase_m3_2_action_gate_and_response_windows.test.js` |
| `BS01-008` | Thunder-Z-Gore | Red | Spirit | 3 / 1 | Attack-step beatstick | Fully Supported | `phase_m3_3_summon_integrity.test.js` |
| `BS01-028` | Skulldevil | Purple | Spirit | 2 / 1 | Curse (`onBattleDestroyed`) | Fully Supported | `phase_m3_3_keyword_runtime_regressions.test.js` |
| `BS01-042` | Angelic Cherub | Yellow | Spirit | 2 / 2 | Holy Life (`onDirectHit`) | Fully Supported | `phase_m3_3_keyword_runtime_regressions.test.js` |
| `BS01-055` | Forest Beetle | Green | Spirit | 3 / 1 | Windstorm (`onDirectHit`) | Fully Supported | `phase_m3_3_keyword_runtime_regressions.test.js` |
| `BS01-068` | Iron Golem | White | Spirit | 4 / 2 | High BP Defender, Clash Target | Fully Supported | `phase_m3_3_keyword_runtime_regressions.test.js` |
| `BS01-090` | Burning Sun | Red | Magic | 3 / 2 | Main / Flash (BP Boost) | Fully Supported | `phase_m3_1_flash_timing_correction.test.js` |
| `BS01-144` | Suppression Beam | White | Magic | 4 / 2 | Flash Timing Bounce Effect | Fully Supported | `phase_m3_2_action_gate_and_response_windows.test.js` |
| `BS40-001` | Pirarucool | Green | Spirit | 3 / 1 | Accel Ability (Hand -> Removed) | Fully Supported | `phase_m3_3_summon_integrity.test.js` |
| `SD01-001` | Dragonoid Soldier | Red | Spirit | 2 / 1 | Core Step Accelerator | Fully Supported | `phase_m3_3_combat_resolution_authority.test.js` |

---

### Keyword Execution Lifecycle

1. **Passive Continuous Keywords (Armor, Immortal)**:
   - Evaluated during targeting and state recalculation. Continuously grants immunity to card colors/types without triggering priority windows.
2. **Event-Triggered Combat Keywords (Holy Life, Curse, Windstorm, Clash)**:
   - Emitted via `state.events` during specific combat milestones (`onAttackDeclared`, `onBlockDeclared`, `onDirectHit`, `onBattleDestroyed`).
   - Integrated with priority passing: triggers resolve before the subsequent response window or phase transition proceeds.
3. **Special Action Keywords (Accel)**:
   - Evaluated by `ActionAuthority` during Hand/Removed phase checks. After resolving its effect from hand, the card transfers to the Removed zone where it remains eligible for standard summoning by paying its summon cost.
