# PHASE M.3.1 — COMPILER AND IR CHANGES
## Structured Timing Specifications & Compilation Pipeline Updates

**Report ID:** `PHASE-M3.1-COMP-003`  
**Compiler Module:** `compiler/header_parser.js`  
**Classification Engine:** `engine/flash_timing.js`  

---

## 1. Overview & Objectives

Under Phase M.3.1, the Battle Spirits Eternal compiler pipeline was enhanced to parse and attach deterministic, structured Flash timing metadata to all ability headers. Previously, the engine relied on ad-hoc regex heuristics or assumed all Flash abilities belonged solely to the Attack Step.

The updated compiler attaches a standardized `flashTimingSpec` object directly to the ability header during compilation, while maintaining 100% backward compatibility with existing compiled IR shards.

---

## 2. Structured `flashTimingSpec` Schema

Whenever `result.isFlash` is true, `finalizeTimingSemantics` in `compiler/header_parser.js` invokes `classifyFlashTiming(result)` to populate:

```json
{
  "effectType": "FLASH",
  "isFlash": true,
  "isGenericFlash": true,
  "isTriggered": false,
  "isContinuous": false,
  "timingQualifier": "GENERIC",
  "generalAvailability": [
    "CONTROLLER_MAIN_STEP",
    "EITHER_PLAYER_BATTLE_FLASH_TIMING"
  ],
  "additionalRestrictions": {
    "allowedSteps": ["MAIN", "ATTACK"],
    "allowedTurnOwners": ["SELF", "OPPONENT"],
    "requiresBattle": false,
    "requiresFlashWindow": false,
    "triggerCondition": null
  }
}
```

### 2.1 For Qualified Flash Abilities (e.g., `(Your Attack Step)`)
```json
{
  "effectType": "FLASH",
  "isFlash": true,
  "isGenericFlash": false,
  "isTriggered": false,
  "isContinuous": false,
  "timingQualifier": "YOUR_ATTACK_STEP",
  "generalAvailability": [
    "CONTROLLER_ATTACK_STEP"
  ],
  "additionalRestrictions": {
    "allowedSteps": ["ATTACK"],
    "allowedTurnOwners": ["SELF"],
    "requiresBattle": false,
    "requiresFlashWindow": true,
    "triggerCondition": null
  }
}
```

---

## 3. Compiler Pipeline Modifications

### 3.1 `compiler/header_parser.js`
In `finalizeTimingSemantics(result)`:
```javascript
  if (result.isFlash) {
    result.flashTimingSpec = classifyFlashTiming({
      header: result,
      text: result.cleanBody || ''
    });
  }
```
Exported `finalizeTimingSemantics` so unit and integration tests can evaluate timing specs in isolation.

### 3.2 Dynamic Classification Fallback
For runtime card instances that may have been loaded from legacy shards without precomputed `flashTimingSpec`, `engine/flash_timing.js` provides `classifyFlashTiming(cardOrAbility)`:
1. Inspects `cardOrAbility.flashTimingSpec` (if present).
2. Inspects `cardOrAbility.header.flashTimingSpec` (if present).
3. If absent, derives the specification dynamically from the compiled abilities or raw effect text.

This ensures zero runtime failures and zero data migration requirements for existing database cards.

---

## 4. Verification

Verified in `tests/phase_m3_1_flash_regression.test.js`:
- `PHASE-M3.1-REG-05`: Compiler attaches `flashTimingSpec` to compiled ability headers.
- `PHASE-M3.1-REG-06`: Classification supports Japanese keywords (`【フラッシュ】`, `お互いのアタックステップ`, `自分のアタックステップ`).
Both tests pass deterministically.
