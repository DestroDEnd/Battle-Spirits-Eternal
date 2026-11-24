# PHASE M.3.2 COMPILER AND DATABASE AUDIT
## Compiler Reconciliation, Structured AST Timing Specifications & Complete Database Inventory

- **Modules**: `compiler/header_parser.js`, `engine/flash_timing.js`
- **Audit Script**: `scripts/m3_2/generate_m3_2_database_audit.mjs`
- **Output Artifact**: `reports/phase_m3_2_action_gate_and_flash_authority/PHASE_M3_2_DATABASE_TIMING_AUDIT.csv`
- **Date**: 2026-11-23

---

### 1. Structured Compiler AST Representation

In `compiler/header_parser.js`, `parseAbilityHeaders` now attaches a deterministic `flashTimingSpec` object to any parsed ability that contains the `Flash` keyword (English `[Flash]`, `Flash:`, `(Flash)` or Japanese `【フラッシュ】`):

```javascript
result.flashTimingSpec = {
  effectType: 'FLASH',
  isFlash: true,
  isGenericFlash: (timingQualifier === 'GENERIC'),
  isTriggered: (timingQualifier === 'WHEN_ATTACKS'),
  timingQualifier,
  generalAvailability: (timingQualifier === 'GENERIC')
    ? ['CONTROLLER_MAIN_STEP', 'EITHER_PLAYER_BATTLE_FLASH_TIMING']
    : (allowedTurnOwners.includes('SELF') && !allowedTurnOwners.includes('OPPONENT')
      ? ['CONTROLLER_ATTACK_STEP']
      : ['EITHER_PLAYER_BATTLE_FLASH_TIMING']),
  additionalRestrictions: {
    allowedSteps,
    allowedTurnOwners,
    requiresBattle,
    requiresFlashWindow,
    triggerCondition: (timingQualifier === 'WHEN_ATTACKS') ? 'WHEN_ATTACKS' : null
  }
};
```

---

### 2. Database Audit Summary (29,218 Cards)

The entire project card database (`card_effects_db.json`, 29,218 card records) was audited using `scripts/m3_2/generate_m3_2_database_audit.mjs`.

| Category | Count | Percentage of Flash Cards | Notes |
|---|---|---|---|
| **Total Cards Audited** | **29,218** | — | Entire project database |
| **Total Flash Cards** | **8,379** | **100.00%** | Cards with Flash keyword |
| **Generic Flash** | **5,979** | **71.36%** | Legal in Main Step (controller) & battle Flash Timing |
| **Either Attack Step** | **1,615** | **19.27%** | `(Either Attack Step)` / `お互いのアタックステップ` |
| **Your Attack Step** | **398** | **4.75%** | `(Your Attack Step)` / `自分のアタックステップ` |
| **Opponent's Attack Step** | **242** | **2.89%** | `(Opponent's Attack Step)` / `相手のアタックステップ` |
| **When Attacks Triggered** | **145** | **1.73%** | `[LV1] (When Attacks) Flash` event-triggered abilities |
| **During Attack** | **0** | **0.00%** | Classified under battle clash rules |
| **Flash Timing Only** | **0** | **0.00%** | Represented in general Attack Step rules |
| **Ambiguous / Unresolved** | **0** | **0.00%** | 100% deterministic classification |
| **Non-Flash Cards** | **20,839** | — | Spirits, Nexuses, Magics without Flash |

---

### 3. Verification Tests

Validated in `tests/phase_m3_2_flash_compiler_reconciliation.test.js`:
- `M3.2-G-01`: Header parser attaches structured `flashTimingSpec` to Flash headers (PASS).
- `M3.2-G-02`: Header parser extracts English card-specific Attack Step qualifiers (PASS).
- `M3.2-G-03`: Header parser classifies `(When Attacks) Flash` as triggered (PASS).
- `M3.2-G-04`: Header parser extracts Japanese Flash timing syntax correctly (`【フラッシュ】`, `自分のアタックステップ`, `相手のアタックステップ`, `お互いのアタックステップ`) (PASS).
- `M3.2-G-05`: Runtime `classifyFlashTiming` handles cards with and without pre-compiled headers (PASS).
