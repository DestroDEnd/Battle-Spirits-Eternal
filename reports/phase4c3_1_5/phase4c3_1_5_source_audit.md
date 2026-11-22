# Phase 4C.3.1.5 — Source-Level Code Verification Audit

## 1. Executive Summary

A comprehensive source-level audit of the Battle Spirits Eternal codebase was executed across:
- `engine/state.js`
- `engine/resolver.js`
- `engine/index.js`
- `engine/legacy_bridge.js`
- `engine/flow.js`
- `engine/conditions.js`
- `compiler/header_parser.js`
- `compiler/clause_splitter.js`

---

## 2. Answers to the 10 Key Architectural Questions

### 1. Does `state.restrictions` exist?
- **NO**. Verified in `engine/state.js:1-117`.
- `state` contains only `abilityUses: {}` at line 114.

### 2. Is `state.restrictions` authoritative or merely proposed?
- **MERELY PROPOSED**. It exists solely in design specifications (Phases 4C.3.1.1 - 4C.3.1.4) and has zero runtime implementation in production code.

### 3. Is `abilityUses` still the active legacy usage store?
- **YES**. Verified in:
  - `engine/index.js:229` (`if (String(ability.header?.limit || '').toUpperCase() === 'ONCE_PER_TURN' && state.abilityUses[useKey])`)
  - `engine/index.js:241` (`state.abilityUses[useKey] = true;`)
  - `engine/state.js:114` (`abilityUses: {}`)
  - `engine/legacy_bridge.js:154, 302`.

### 4. Does legacy bridge serialization preserve all required usage data?
- **NO**. Verified in `engine/legacy_bridge.js:154, 302`.
  The bridge only mirrors `duelState.abilityUses = state.abilityUses`. Any structured restriction state (`state.restrictions`) would be lost during bridge round-trips without a bidirectional adapter.

### 5. Are usage counters reset at the correct turn/step/battle boundaries?
- **NO**. Verified in `engine/flow.js:44-70`.
  `state.abilityUses` is never reset at turn/step/battle boundaries. It relies on embedding `${state.turnNumber}` into the key, causing memory to leak indefinitely across hundreds of turns, and has zero handling for step, battle, or game boundaries.

### 6. Do field placement IDs exist?
- **NO**. Verified in `engine/state.js` and `engine/index.js:224`.
  Cards on the field are identified only by `stack.top.id` (`inst_X`). No field placement ID is assigned or tracked upon entering the field.

### 7. Does the current card identity model distinguish physical copies?
- **PARTIALLY**. Each card in a deck receives an instance ID (`inst_X`). However, because `inst_X` persists when a card moves to Trash and is re-summoned to Field, ordinary once-per-turn restrictions mistakenly persist across zone movements!

### 8. Can non-field activations be represented without inventing field placement IDs?
- **YES**. Hand, Trash, and Burst activations can be tracked using zone-scoped instance keys (`HAND:${card.id}`, `TRASH:${card.id}`, `BURST:${card.id}`) without needing a fake field placement ID.

### 9. Does the compiler currently preserve once-per-turn and once-per-game restrictions?
- **PARTIALLY / SEVERELY DEFECTIVE**. Verified in `compiler/header_parser.js:113-124, 329-334`.
  Only 3 hardcoded sentence strings and leading `(Once per Turn...)` prefixes are parsed. 826 abilities across 778 cards with sentence-based, inline, or post-fixed restrictions have their limits completely dropped!

### 10. Is unsupported restriction wording currently dropped or preserved?
- **DROPPED**. Unrecognized limit phrases remain unparsed in `cleanBody` or are discarded, resulting in `header.limit = null`.
