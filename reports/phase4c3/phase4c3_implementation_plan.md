# Phase 4C.3 Implementation Plan: Activation Limits & Usage Restrictions

**Target Defect Family:** `DEF-LIMIT-OPT-01` & Related Usage Restrictions  
**Scope:** Compiler Parsing & Header Normalization, Runtime Tracking & Lifecycle Enforcement  
**Audit Baseline:** 845 Affected Abilities across 778 Unique Cards  
**Status:** Audit & Architecture Phase (Implementation Pending Authorization)  

---

## 1. Executive Implementation Strategy

The audit in Phase 4C.3.0 identified that 826 of 841 activation-limited abilities (98.2%) currently have `header.limit === null` in the compiled IR. Furthermore, the engine runtime currently only tracks manual `activateAbility` calls with instance-scoped `ONCE_PER_TURN`, leaving automatic event triggers, same-name restrictions, once-per-game effects, and shared limits completely unenforced.

To address these architectural deficiencies without causing regressions, implementation should follow a two-tier model:
1. **Tier 1 (Compiler Normalization):** Capture all 21 identified restriction patterns in `compiler/header_parser.js` and `compiler/clause_splitter.js`, producing normalized, structured `header.limit` metadata and clause-scoped limits.
2. **Tier 2 (Runtime Enforcement Engine):** Upgrade `engine/index.js`, `engine/events.js`, `engine/resolver.js`, and `engine/flow.js` with unified limit evaluation that tracks card instance, same-name, and game-level scopes with clean lifecycle reset hooks.

```
┌─────────────────────────────────────────────────────────────┐
│                 Printed Card Text / Shard                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                compiler/header_parser.js
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Structured IR Header                     │
│  header.limit: {                                            │
│    type: 'ONCE_PER_TURN' | 'ONCE_PER_GAME' | ...            │
│    scope: 'CARD_INSTANCE' | 'SAME_CARD_NAME' | 'SHARED'     │
│    count: 1 | N                                             │
│    reset: 'TURN_END' | 'GAME_END' | 'STEP_END'              │
│  }                                                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                   Runtime Engine Execution
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            engine/resolver.js & engine/events.js            │
│  Check limit tracker before activation / event resolution:  │
│  - Instance Key: `${turn}:${cardId}:${abilityId}`           │
│  - Name Key:     `${turn}:${playerSide}:${cardName}`        │
│  - Game Key:     `${playerSide}:${cardName}:${abilityId}`   │
│  - Shared Key:   `${turn}:${cardId}:SHARED_GROUP`           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Exact Compiler Changes Required

### 2.1 Enhancements to `compiler/header_parser.js`

1. **Relax Punctuation Requirements in Sentence Limits (Lines 112–125):**
   - *Current issue:* Requires literal trailing period `\.`.
   - *Fix:* Update regexes to permit optional punctuation or sentence end:
     ```javascript
     // Match sentence-level once per turn with flexible trailing punctuation
     const optSentenceRegex = /(?:this effect can only be used once per turn|you can only use this effect once per turn|can only activate this effect once per turn)(?:\.|\b)/i;
     const optSameNameRegex = /(?:you can only use (?:this effect of )?the same card name once per turn|this effect of the same card name can only be used once per turn)(?:\.|\b)/i;
     const opgSentenceRegex = /(?:this effect can only be used once per game|you can only use this effect once per game)(?:\.|\b)/i;
     const opgSameNameRegex = /(?:you can only use (?:this effect of )?the same card name once per game|this effect of the same card name can only be used once per game)(?:\.|\b)/i;
     ```

2. **Relax Leading Anchors on Header Limits (Line 329):**
   - *Current issue:* `^\(Once per (?:Turn|Game)...` only matches if at the absolute start of body.
   - *Fix:* Search for parenthesized limit tags anywhere in the leading prefix before clause text:
     ```javascript
     const leadingLimitMatch = body.match(/^\s*(?:\[[^\]]+\]\s*)*\((Once per (?:Turn|Game|Battle)(?::\s*Same Name)?)\)\s*/i)
       || body.match(/^(Once per (?:turn|game|battle)(?::\s*same name)?),?\s*/i);
     ```

3. **Extract Grandwalker Divine Skill Limits (123 Abilities):**
   - *Current issue:* `(Once per turn, send N cores from this Nexus to the Void)` is parsed solely as payment cost.
   - *Fix:* Extract `limit: 'ONCE_PER_TURN'` before stripping the core-cost clause:
     ```javascript
     if (/\(once\s+per\s+turn,\s*send\s+[a-z\d]+\s+cores?\s+from\s+this\s+nexus/i.test(body)) {
       result.limit = 'ONCE_PER_TURN';
     }
     ```

4. **Extract Keyword-Specific and Multi-Count Limits:**
   - Add recognition for `You can only use [Keyword] once per turn` $\rightarrow$ `limit: 'ONCE_PER_TURN'`.
   - Add recognition for `Up to twice per turn` $\rightarrow$ `{ type: 'N_TIMES_PER_TURN', count: 2 }`.

### 2.2 Enhancements to `compiler/clause_splitter.js`

1. **Preserve Inline Clauses (`PAT-LIMIT-OPT-REFRESH` & `PAT-LIMIT-OPT-INLINE`):**
   - *Current issue:* Clause splitter splits on `, and once per turn,` or leaves `once per turn` attached to a single sub-clause.
   - *Fix:* When a sub-clause contains `once per turn, this Spirit can refresh`, tag the generated operation with `op.limit = 'ONCE_PER_TURN'` or promote to `header.limit = 'ONCE_PER_TURN'` if the entire ability is gated by that condition.

---

## 3. Exact Runtime Changes Required

### 3.1 State Representation & Field Architecture

In `engine/state.js`, modernize the single `abilityUses: {}` dictionary into structured tracking partitions:

```javascript
// engine/state.js initial state
abilityUses: {
  turnInstance: {},  // Key: `${cardId}:${abilityId}` -> boolean (cleared each turn)
  turnSameName: {},  // Key: `${playerSide}:${cardName}` -> boolean (cleared each turn)
  gameInstance: {},  // Key: `${cardId}:${abilityId}` -> boolean (persists all game)
  gameSameName: {},  // Key: `${playerSide}:${cardName}` -> boolean (persists all game)
  stepBattle: {},    // Key: `${cardId}:${abilityId}` -> boolean (cleared each step/battle)
  sharedCard: {}     // Key: `${cardId}:SHARED` -> boolean (cleared each turn)
}
```

*Backward-Compatibility Guarantee:*  
Maintain `state.abilityUses[`${state.turnNumber}:${cardId}:${abilityId}`] = true` simultaneously so that existing tests or legacy bridge code reading the flat dictionary continue to function without disruption.

### 3.2 Unified Limit Checking & Consumption

Implement helper functions in `engine/limits.js`:

```javascript
export function canActivateAbility(state, card, ability, playerSide) {
  const limit = ability.header?.limit;
  if (!limit) return true;

  const cardId = card.id || card.cardNumber;
  const cardName = card.name;
  const abilityId = ability.id;

  const limitType = typeof limit === 'object' ? limit.type : limit;
  const scope = typeof limit === 'object' ? limit.scope : (limitType.includes('SAME_NAME') ? 'SAME_CARD_NAME' : 'CARD_INSTANCE');

  // 1. Same Name Check (Turn)
  if (limitType === 'ONCE_PER_TURN_SAME_NAME' || (limitType === 'ONCE_PER_TURN' && scope === 'SAME_CARD_NAME')) {
    if (state.abilityUses.turnSameName[`${playerSide}:${cardName}`]) return false;
  }

  // 2. Same Name Check (Game)
  if (limitType === 'ONCE_PER_GAME_SAME_NAME') {
    if (state.abilityUses.gameSameName[`${playerSide}:${cardName}`]) return false;
  }

  // 3. Instance Check (Game)
  if (limitType === 'ONCE_PER_GAME' || limitType === 'ONCE_PER_GAME_INSTANCE') {
    if (state.abilityUses.gameInstance[`${cardId}:${abilityId}`]) return false;
  }

  // 4. Instance Check (Turn)
  if (limitType === 'ONCE_PER_TURN' || limitType === 'ONCE_PER_TURN_INSTANCE') {
    if (state.abilityUses.turnInstance[`${cardId}:${abilityId}`]) return false;
  }

  // 5. Shared Card Effects
  if (limitType === 'SHARED_ONCE_PER_TURN') {
    if (state.abilityUses.sharedCard[`${cardId}:SHARED`]) return false;
  }

  return true;
}

export function recordAbilityUsage(state, card, ability, playerSide) {
  const limit = ability.header?.limit;
  if (!limit) return;

  const cardId = card.id || card.cardNumber;
  const cardName = card.name;
  const abilityId = ability.id;
  const limitType = typeof limit === 'object' ? limit.type : limit;

  // Set specific partition
  if (limitType === 'ONCE_PER_TURN_SAME_NAME') state.abilityUses.turnSameName[`${playerSide}:${cardName}`] = true;
  if (limitType === 'ONCE_PER_GAME_SAME_NAME') state.abilityUses.gameSameName[`${playerSide}:${cardName}`] = true;
  if (limitType === 'ONCE_PER_GAME' || limitType === 'ONCE_PER_GAME_INSTANCE') state.abilityUses.gameInstance[`${cardId}:${abilityId}`] = true;
  if (limitType === 'ONCE_PER_TURN' || limitType === 'ONCE_PER_TURN_INSTANCE') state.abilityUses.turnInstance[`${cardId}:${abilityId}`] = true;
  if (limitType === 'SHARED_ONCE_PER_TURN') state.abilityUses.sharedCard[`${cardId}:SHARED` ] = true;

  // Backward-compatible flat key
  const legacyKey = `${state.turnNumber}:${cardId}:${abilityId}`;
  state.abilityUses[legacyKey] = true;
}
```

### 3.3 Event Trigger Enforcement (`engine/events.js`)

Before executing any triggered ability matching an event in `engine/events.js`, evaluate `canActivateAbility(state, card, ability, playerSide)`. If `false`, discard the trigger and emit no action.

### 3.4 Lifecycle & Reset Automation (`engine/flow.js`)

In `engine/flow.js`:
- On `turnNumber++` (Start of Turn):
  - Reset `state.abilityUses.turnInstance = {}`
  - Reset `state.abilityUses.turnSameName = {}`
  - Reset `state.abilityUses.sharedCard = {}`
- On `step` transition to `ATTACK` or end of battle:
  - Reset `state.abilityUses.stepBattle = {}`
- `gameInstance` and `gameSameName` are **never** cleared.

---

## 4. Migration & Backward-Compatibility Considerations

1. **Existing String Schema Compatibility:**
   - Any engine consumer checking `ability.header?.limit === 'ONCE_PER_TURN'` must continue to see `'ONCE_PER_TURN'`.
   - String literals `'ONCE_PER_TURN'`, `'ONCE_PER_TURN_SAME_NAME'`, and `'ONCE_PER_GAME'` remain valid.
2. **Legacy Bridge Synchronization:**
   - Update `engine/legacy_bridge.js` to serialize both the flat map and the partitioned state without breaking client UI payloads.
3. **Graceful Shard Rollout:**
   - The compiler changes can be implemented and unit-tested in isolation.
   - Individual shards do NOT need bulk recompilation until Phase 4C.3.1 is formally authorized.

---

## 5. Risks & Unresolved Questions

1. **Effect-Scoped vs Ability-Scoped Ambiguity:**
   - *Example:* *"When this Spirit attacks, destroy an opposing Spirit, and once per turn, refresh this Spirit."*
   - *Question:* If the Spirit attacks a second time, does the destruction trigger, while only the refresh is suppressed?
   - *Ruling:* Official Battle Spirits Ruling specifies that only the refresh action is limited; the attack trigger itself triggers every time.
   - *Resolution:* Requires clause-level `op.limit` execution in `engine/resolver.js`.
2. **Negation of Activation vs Negation of Effect:**
   - Under Battle Spirits Official Rule 8-5, negating an effect's *activation* still consumes the once-per-turn limit unless the card text explicitly states otherwise ("When negated, this does not count as a use").
   - *Resolution:* Consume limit upon activation declaration, prior to resolver completion.

---

## 6. Recommended Implementation Milestones

- **Milestone 1 (Compiler Hardening):** Implement regex and punctuation fixes in `compiler/header_parser.js` and `compiler/clause_splitter.js`. Author compiler golden tests proving all 21 restriction patterns generate correct `header.limit`.
- **Milestone 2 (Runtime Architecture):** Implement `engine/limits.js` with partitioned state, reset hooks in `engine/flow.js`, and integration into `activateAbility`.
- **Milestone 3 (Event Trigger Integration):** Wire `canActivateAbility` into `engine/events.js` and `engine/resolver.js` for automatic triggered abilities.
- **Milestone 4 (Targeted Card Verification):** Compile and verify representative cards from each pattern group (e.g. `26RBS03-X03`, `26RCB02-X10`, `BS04-074`, `BS44-082`).
- **Milestone 5 (Regression & Audit Ledger):** Run full 158-suite test suite to ensure 0 regressions.
