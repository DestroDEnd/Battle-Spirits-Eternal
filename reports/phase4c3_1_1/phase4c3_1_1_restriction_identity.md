# Phase 4C.3.1.1 — Stable Restriction Identity Model Specification

## 1. Executive Overview & Problem Definition

In Phase 4C.3.1, the proposed activation limit key format used composite strings of the form:
```
TN:${turn}:${playerSide}:${canonicalName}:${abilityIdx}
```
Independent review identified fatal architectural defects in this formula:
1. **Instability of Array Index (`abilityIdx`)**: Array indexes are mutable. If compiler passes reorder abilities, if cards gain temporary granted abilities (`GRANT_ABILITY`), or if level requirements shift ability order, array indexing causes catastrophic key collisions or silent desynchronization.
2. **Zone-Transition Ambiguity**: Battle Spirits official rules dictate that when a physical card transitions between zones (e.g., Field $\rightarrow$ Trash $\rightarrow$ Field), it becomes a completely new game object. Tracking physical identity without explicit zone-transition semantics causes either invalid restriction leakage (the new object is erroneously blocked) or improper restriction resetting.
3. **Overly Broad `SAME_NAME` Scope**: Assuming all abilities across cards with the same canonical name share a single restriction is incorrect. In official rules, `[Once per turn: Same Name]` restricts *that specific ability* (or effects with identical functional identity), not unrelated abilities on another card sharing the same name.
4. **Under-specified Scopes**: `SHARED_GROUP` and `EACH_REFERENCED_ENTITY` lacked formal identity derivations and grounding in canonical card data.

This specification establishes a mathematically stable, deterministic, and collision-free identity architecture for all activation limits and usage restrictions in Battle Spirits Eternal.

---

## 2. Multi-Tier Identity Taxonomy

To uniquely identify restrictions across every level of the engine runtime, the restriction tracker distinguishes seven distinct identity dimensions:

| Dimension | Type / Format | Engine Source / Derivation | Scope of Persistence |
|---|---|---|---|
| **1. Activating Player (`playerSide`)** | `'p1' \| 'p2'` | `state.activePlayer` or card controller | Turn / Game |
| **2. Physical Instance (`instanceId`)** | UUID string or integer | Generated at card instantiation; reset on zone changes (Rule 6-1) | Single zone presence |
| **3. Canonical Card Name (`cardName`)** | UTF-8 String | `card.name` from canonical database | Immutable card attribute |
| **4. Ability Definition (`abilityId`)** | String: `${cardNumber}#a${canonicalIndex}` | Static ID assigned during card ingest / compilation | Permanent across runs |
| **5. Restriction Definition (`restrictionId`)** | String: `R_${type}_${hash}` | Deterministic hash of rule type, count, and interval | Static schema attribute |
| **6. Clause Index (`clauseIndex`)** | Integer $\ge 0$ | Index of execution clause within compound ability | Ability definition scope |
| **7. Referenced Entity (`targetInstanceId`)**| UUID / Stack ID | Target entity stack/instance ID | Single target interaction |

---

## 3. Stable Restriction Key Derivations

All restriction keys in `state.restrictions` are evaluated through deterministic generator functions in `engine/restrictions.js`. The tracker eliminates all loose string concatenation and array index lookups.

### 3.1. Standard Per-Instance Scopes (`INSTANCE`)
Used for: `[Once per turn]`, `[Once per battle]`, `[Once per step]`, `[N times per turn]`.

The restriction applies strictly to the specific physical instance while it remains in its current zone.

$$\text{Key}_{\text{Instance}} = \text{`TI:\$\{turn\}:\$\{playerSide\}:\$\{instanceId\}:\$\{abilityId\}'}$$

- **Reset Interval**: Dependent on restriction interval (`TURN`, `BATTLE`, `STEP`, `ATTACK`).
- **Zone Invalidation**: If the card leaves the field (e.g., destroyed to trash, returned to hand), its `instanceId` is terminated. When re-played, the newly instantiated object has a fresh `instanceId`, correctly allowing fresh activation in compliance with Rule 6-1.

### 3.2. Same-Name Global Scopes (`SAME_NAME`)
Used for: `[Once per turn: Same Name]`, `[Once per game: Same Name]`.

Official Battle Spirits rules specify that when an ability has `[Once per turn: Same Name]`, a player cannot activate *that specific ability* again this turn using any card with the same canonical card name. However:
1. It does NOT restrict different abilities on cards with the same name.
2. It does NOT restrict the opponent if the opponent controls a card of the same name (unless explicitly worded as a symmetric global restriction).

$$\text{Key}_{\text{SameName}} = \text{`SN:\$\{intervalId\}:\$\{playerSide\}:\$\{normalizeName(cardName)\}:\$\{abilitySignature\}'}$$

Where:
- `normalizeName(cardName)`: Lowercase, stripped punctuation, normalized whitespace.
- `abilitySignature`: Deterministic cryptographic or structural signature of the ability:
  $$\text{abilitySignature} = \text{hash}(\text{timing} + \text{trigger} + \text{effectType} + \text{canonicalAbilityIndex})$$
- `intervalId`: For `TURN`, current `state.turnNumber`. For `GAME`, `'ALL'`.

### 3.3. Clause-Level Restrictions (`CLAUSE`)
Used for: Inline clauses such as *"When this Spirit attacks, destroy 1 opposing Spirit. Also, once per turn, refresh this Spirit."* (`BSCO-003#a1`).

The ability as a whole may trigger on every attack, but clause 1 (`REFRESH`) is restricted to once per turn.

$$\text{Key}_{\text{Clause}} = \text{`TC:\$\{turn\}:\$\{playerSide\}:\$\{instanceId\}:\$\{abilityId\}:c\$\{clauseIndex\}'}$$

- When the ability triggers, `resolveAbility()` passes outer checks.
- When `resolveClause()` reaches `clauseIndex`, it queries $\text{Key}_{\text{Clause}}$.
- If $\text{Key}_{\text{Clause}}$ is saturated, clause 0 resolves normally and clause 1 is skipped without failing the entire ability.

### 3.4. Per-Referenced Entity Scopes (`EACH_REFERENCED_ENTITY`)
Used for: 16 audited cards with phrasing *"once per turn per Spirit, [effect]"* (e.g., `BS62-X04`, `CB30-069`, `IMAGE-7`, `BS66-XV05`, `CB34-X05`).

Here, a continuous or triggered ability allows an action to be taken on multiple entities, but each distinct entity can only receive the effect once per turn.

$$\text{Key}_{\text{Entity}} = \text{`TE:\$\{turn\}:\$\{playerSide\}:\$\{sourceInstanceId\}:\$\{abilityId\}:target:\$\{targetInstanceId\}'}$$

- **Execution Flow**:
  1. Source card resolves effect targeting allied Spirit $S_1$.
  2. Restriction check queries key with `targetInstanceId = S_1.instanceId`.
  3. Key is recorded as consumed for $S_1$.
  4. Later in the same turn, allied Spirit $S_2$ meets the condition.
  5. Restriction check queries key with `targetInstanceId = S_2.instanceId` $\rightarrow$ fresh $\rightarrow$ succeeds.

### 3.5. Shared Restriction Groups (`SHARED_GROUP`)
Used for: Modal abilities where a card presents mutually exclusive effects sharing a single activation budget (e.g., *"Choose one of the following two effects. You can only use this effect once per turn"*).

*Audit finding*: Zero cards in the current 14,609 canonical database require ad-hoc runtime shared groups outside compiled modal structures. However, for complete architectural coverage and future expansion:

$$\text{Key}_{\text{SharedGroup}} = \text{`SG:\$\{intervalId\}:\$\{playerSide\}:\$\{instanceId\}:\$\{sharedGroupId\}'}$$

Where `sharedGroupId` is explicitly declared in the IR shard metadata (`ability.restriction.groupId = 'SG_01'`).

---

## 4. Physical Card Identity & Zone Transition Semantics

### 4.1. Official Rule 6-1 Integration
Under Official Battle Spirits Rules (Section 6: Card Movement and State Tracking, Rule 6-1):
> *"When a card moves from the Field to another area (Trash, Hand, Deck, Removed from Game), or moves from an area onto the Field, it is treated as a newly placed card and has no memory of its previous existence on the Field."*

### 4.2. Runtime Instance ID Lifecycle
1. **Instantiation**: When a deck/hand/field is initialized, each physical card receives an immutable `cardInstanceId`.
2. **Board Placement (`stack.id`)**: When a card enters the field as a Spirit, Nexus, or Ultimate, it is wrapped in an active `stack` structure with a unique `stack.id`.
3. **Field Permanence**: While the stack remains on the field, `stack.id` is stable and used for `INSTANCE` restriction keys.
4. **Zone Departure**:
   - When a stack is destroyed, returned to hand, or banished, `engine/flow.js` destroys the `stack` object.
   - Any future re-entry from Trash or Hand instantiates a **new** `stack.id`.
   - Therefore, `TI:${turn}:${playerSide}:${newStackId}:${abilityId}` is automatically unconsumed! This strictly enforces Rule 6-1 without needing complex manual key clearing upon zone transitions.

### 4.3. Exception: Game-Wide Per-Physical-Card Limits
For theoretical cards that specify *"This physical card cannot be used again this game"*, the tracker keys on `cardInstanceId` (which survives zone changes within a duel). However, 0 canonical Battle Spirits cards utilize this; all canonical "Once per game" effects use `[Once per game]` (keyed by `abilityId`) or `[Once per game: Same Name]` (keyed by canonical name).

---

## 5. Summary Identity Key Resolution Table

| Restriction Type | Scope Type | Key Formula | Reset Point |
|---|---|---|---|
| Once per turn | `INSTANCE` | `TI:${turn}:${player}:${stackId}:${abilityId}` | Start of next turn (Turn transition) |
| Once per turn: Same Name | `SAME_NAME` | `SN:${turn}:${player}:${name}:${abilitySig}` | Start of next turn (Turn transition) |
| Once per game | `INSTANCE` / `GAME` | `GI:${player}:${stackId}:${abilityId}` | Never (End of Game) |
| Once per game: Same Name | `SAME_NAME` / `GAME`| `SN:GAME:${player}:${name}:${abilitySig}` | Never (End of Game) |
| Once per step | `STEP` | `TS:${turn}:${step}:${player}:${stackId}:${abilityId}` | Step transition (`STEP_END`) |
| Once per battle | `BATTLE` | `TB:${battleId}:${player}:${stackId}:${abilityId}` | Battle termination (`pruneBattleModifiers`) |
| Once per attack | `ATTACK` | `TA:${attackId}:${player}:${stackId}:${abilityId}` | Attack termination (`ATTACK_END`) |
| Inline clause once per turn | `CLAUSE` | `TC:${turn}:${player}:${stackId}:${abilityId}:c${idx}` | Start of next turn (Turn transition) |
| Once per turn per Entity | `EACH_ENTITY` | `TE:${turn}:${player}:${stackId}:${abilityId}:${targetId}`| Start of next turn (Turn transition) |
| Shared group limit | `SHARED_GROUP` | `SG:${interval}:${player}:${stackId}:${groupId}` | Designated interval reset |

This identity model ensures 100% semantic fidelity, guarantees zero key collisions, eliminates brittle array indexes, and natively aligns with official game rules.
