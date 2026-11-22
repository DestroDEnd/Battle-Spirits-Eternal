# Phase 4C.3.1.6 — Engine & Compiler Source Compatibility Audit

## 1. Executive Summary

A comprehensive source inspection of the active codebase was conducted across:
- `engine/state.js`
- `engine/resolver.js`
- `engine/index.js`
- `engine/legacy_bridge.js`
- `engine/flow.js`
- `engine/conditions.js`
- `compiler/header_parser.js`
- `compiler/clause_splitter.js`

---

## 2. Answers to the 7 Source Compatibility Requirements

### 1. Restriction State
- `state.restrictions` **does not exist** in `engine/state.js:1-117`.
- `abilityUses: {}` at line 114 is currently the sole active store.
- **Required Change**: In Phase 4C.3.2, initialize `state.restrictions = { counters: {}, meta: {} }` in `createGameState()`.

### 2. Physical Card Identity
- Cards have a stable physical `card.id` (`inst_X`), but **lack a field placement ID**.
- **Required Change**: Allocate fresh `placementId` (e.g. `p_101`) upon field entry in `engine/zones.js` and `engine/index.js`. Soul State cards retain `placementId` under Rule 10-2-1.

### 3. Non-Field Activations
- Hand, Trash, and Burst abilities are currently blocked in `engine/index.js:224` (`if (!stack) return CARD_NOT_ON_FIELD`).
- **Required Change**: Support zone-scoped execution using zone instance keys (`HAND:${card.id}`, `TRASH:${card.id}`, `BURST:${card.id}`).

### 4. Consumption Timing
- `engine/index.js:228-242` records usage **only after resolution operations succeed** (`line 241`).
- **Defect Confirmed**: Violates Rule 8-1-6 (consumption occurs upon activation commitment, not upon operation success).
- **Required Change**: Implement Stage 4 Atomic Commit immediately post-payment, pre-resolution.

### 5. Reset Behavior
- `engine/flow.js:44-70` increments `turnNumber` but **never clears `abilityUses`**.
- Keys accumulate unbounded across turns.
- **Required Change**: Implement `resetRestrictions('TURN')`, `resetRestrictions('STEP')`, and `resetRestrictions('BATTLE')` in `flow.js`.

### 6. Legacy Bridge
- `engine/legacy_bridge.js:154, 302` mirrors only `duelState.abilityUses`.
- **Required Change**: Implement bidirectional adapter in `legacy_bridge.js` translating between structured `state.restrictions` and legacy `abilityUses`.

### 7. Compiler
- `compiler/header_parser.js:113-124, 329-334` extracts only 3 fixed sentences and leading `(Once per Turn...)` markers.
- Drops 826 restrictions identified in Phase 4C.3.0.
- **Required Change**: Integrate comprehensive restriction regex parser in Phase 4C.3.2.
