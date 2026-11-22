# Phase 4C.3.1.1 — Compatibility & State Serialization Design

## 1. Executive Summary & Design Principles

The Phase 4C.3.1 specification contained two critical architectural flaws regarding engine state management:
1. **Unserializable State Structures**: The specification proposed using JavaScript `Set` objects to track activated card instances. In Battle Spirits Eternal, engine state must be strictly JSON-serializable to support save-states, AI tree searches (MCTS rollouts), network duel synchronization, and compatibility with `engine/legacy_bridge.js`. Standard `JSON.stringify(new Set())` serializes to `{}` (losing all entries silently).
2. **Ambiguity in Dual Enforcement**: Running two independent restriction trackers (`state.abilityUses` and `state.restrictions`) creates potential race conditions, desynchronization, and double-blocking if both systems enforce checks independently.

This document establishes the definitive compatibility contract:
- **Pure Plain-JSON State Architecture**: All restriction counters are represented as primitive types and plain JSON dictionaries.
- **Single Authoritative Decision Engine**: `state.restrictions` is the sole authority for all legality checks. Legacy `state.abilityUses` acts strictly as an observational write mirror.

---

## 2. Serialization-Safe State Schema

In `engine/state.js`, the `restrictions` state slice is initialized as a plain JavaScript object:

```javascript
// engine/state.js
function createInitialState(options = {}) {
  return {
    turnNumber: 1,
    activePlayer: 'p1',
    step: 'START',
    // ... other core state slices ...
    
    // NEW: Structured, JSON-serializable restriction tracker
    restrictions: {
      counters: {}, // Dictionary: [stableKey: string] -> UsageRecord
      meta: {
        lastTurnReset: 1,
        lastStepReset: 'START',
        lastCombatReset: null
      }
    },
    
    // LEGACY: Flat dictionary retained strictly for backwards compatibility
    abilityUses: {} // Dictionary: [compositeKey: string] -> number
  };
}
```

### 2.1. The `UsageRecord` Plain Object
Each tracked restriction key maps to a plain JSON object:

```json
{
  "key": "TI:3:p1:stack_104:BS01-002#a0",
  "current": 1,
  "maxCount": 1,
  "resetInterval": "TURN",
  "scope": "INSTANCE",
  "lastUpdatedTurn": 3,
  "lastUpdatedStep": "ATTACK",
  "lastUpdatedCombatId": null,
  "history": [
    {
      "turn": 3,
      "step": "ATTACK",
      "timestamp": 1731664800000,
      "action": "CONSUME"
    }
  ]
}
```

### 2.2. Serialization Guarantees
- Zero `Set`, `Map`, `WeakMap`, or class instances with non-enumerable properties.
- Full compatibility with `JSON.stringify(state)` and `JSON.parse(json)`.
- Full compatibility with structural cloning algorithms (`structuredClone(state)`).
- Safe across worker threads and network serialization boundaries.

---

## 3. The Dual-Write & Single Authority Model

### 3.1. Single Authoritative Decision Point
When `engine/resolver.js:canActivateAbility` or `engine/index.js:canUseCardEffect` checks whether an ability is legally eligible to activate:
- **Query `state.restrictions.check(key)` exclusively**.
- **Do NOT query `state.abilityUses`**.
- This guarantees that legacy string formatting or incomplete keys cannot cause false positives or double-rejections.

### 3.2. Atomic Dual-Write on Consumption
When an activation passes Stage 3 (Declaration and Cost Payment) and reaches Stage 4 (Atomic Consumption):

```javascript
// engine/restrictions.js
function recordUsage(state, restrictionDef, context) {
  const stableKey = deriveStableKey(restrictionDef, context);
  
  // 1. Authoritative Write to Modern Tracker
  let record = state.restrictions.counters[stableKey];
  if (!record) {
    record = {
      key: stableKey,
      current: 0,
      maxCount: restrictionDef.count || 1,
      resetInterval: restrictionDef.resetInterval || 'TURN',
      scope: restrictionDef.scope || 'INSTANCE',
      lastUpdatedTurn: state.turnNumber,
      lastUpdatedStep: state.step,
      lastUpdatedCombatId: state.combat?.id || null,
      history: []
    };
    state.restrictions.counters[stableKey] = record;
  }
  record.current += 1;
  record.lastUpdatedTurn = state.turnNumber;
  record.lastUpdatedStep = state.step;
  record.lastUpdatedCombatId = state.combat?.id || null;
  record.history.push({
    turn: state.turnNumber,
    step: state.step,
    timestamp: Date.now()
  });

  // 2. Synchronous Mirror Write to Legacy abilityUses (for external tools & legacy tests)
  const legacyKey = `${context.cardId || context.stackId}:${context.abilityIndex || 0}`;
  state.abilityUses[legacyKey] = (state.abilityUses[legacyKey] || 0) + 1;
}
```

---

## 4. Reset & Synchronization Lifecycle

Whenever the game flow advances intervals, both structures are reset simultaneously in `engine/restrictions.js`:

```javascript
// engine/restrictions.js
function resetRestrictions(state, intervalType) {
  const counters = state.restrictions.counters;

  if (intervalType === 'TURN') {
    // Modern Tracker: remove or zero all TURN-scoped keys
    for (const key of Object.keys(counters)) {
      if (counters[key].resetInterval === 'TURN') {
        delete counters[key];
      }
    }
    // Legacy Mirror: clear all abilityUses on turn boundary
    state.abilityUses = {};
    state.restrictions.meta.lastTurnReset = state.turnNumber;
  }
  else if (intervalType === 'STEP') {
    for (const key of Object.keys(counters)) {
      if (counters[key].resetInterval === 'STEP') {
        delete counters[key];
      }
    }
    state.restrictions.meta.lastStepReset = state.step;
  }
  else if (intervalType === 'BATTLE') {
    for (const key of Object.keys(counters)) {
      if (counters[key].resetInterval === 'BATTLE') {
        delete counters[key];
      }
    }
    state.restrictions.meta.lastCombatReset = null;
  }
}
```

---

## 5. Verification & Testing Requirements

1. **State Snapshot Integrity**: Tests must assert that `JSON.parse(JSON.stringify(state))` perfectly preserves all active restrictions and yields identical behavior in subsequent simulation turns.
2. **Zero Drift Test**: Automated regression tests will verify that whenever `recordUsage` is called, `state.abilityUses` reflects the usage count, ensuring zero drift for external consumers while preventing any double-enforcement bugs.
