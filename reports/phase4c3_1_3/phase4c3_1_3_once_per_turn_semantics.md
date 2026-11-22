# Phase 4C.3.1.3 — Ordinary Once per Turn vs. Same Name Semantics Specification

## 1. Executive Summary & Critical Distinction

The most vital architectural correction in this phase is the rigorous separation of two fundamentally distinct restriction types in Battle Spirits:
1. **Ordinary `[Once per turn]` (Individual Card Instance Restriction)**: Restricts only that specific physical permanent on the battlefield. If a player controls two identical copies of a card with an ordinary once-per-turn ability, **both cards may legally activate their abilities in the same turn**.
2. **`[Once per turn: Same Name]` (Shared Same-Name Restriction)**: Restricts all cards controlled by the same player that share the canonical card name from activating that specific restricted effect again during that turn.

Collapsing these two forms into a single shared counter causes catastrophic gameplay defects (e.g. summoning a second copy of a Spirit and finding its ordinary effect illegally locked out). Conversely, treating Same Name restrictions as ordinary instance limits allows illegal multiple activations per turn.

---

## 2. Text Pattern Taxonomy & Compiler Ingest Analysis

### 2.1. Distinct Canonical Text Patterns
The two forms are distinguished in official card text by explicit syntax:

| Restriction Type | Canonical English Phrasing | Japanese Card Text | Scope Classification |
|---|---|---|---|
| **Ordinary OPT** | `[Once per turn]`, `(Once per turn)`, `Once per turn, you can...` | ターンに1回 | `INSTANCE` |
| **Same Name OPT** | `[Once per turn: Same Name]`, `(Once per turn: Same Name)` | 同名ターンに1回 | `SAME_NAME` |
| **Ordinary OPG** | `[Once per game]`, `can only be used once per game` | ゲームに1回 | `INSTANCE` (Game) |
| **Same Name OPG** | `[Once per game: Same Name]`, `(Once per game: Same Name)` | 同名ゲームに1回 | `SAME_NAME` (Game) |

### 2.2. Current Compiler Behavior vs. Required IR
In `compiler/header_parser.js:329-334`:
```javascript
const limitMatch = body.match(/^\((Once per (?:Turn|Game|Battle)(?::\s*Same Name)?)\)\s*/i) ||
                   body.match(/^(Once per (?:turn|game|battle)(?::\s*same name)?),?\s*/i);
if (limitMatch) {
  result.limit = limitMatch[1].toUpperCase().replace(/\s+/g, '_').replace(':', '');
}
```
- **Current Behavior**: The compiler sets `result.limit = 'ONCE_PER_TURN'` or `'ONCE_PER_TURN_SAME_NAME'`. However, `engine/index.js:229` checks *only* `ONCE_PER_TURN`, completely ignoring `ONCE_PER_TURN_SAME_NAME`! Furthermore, sentence-based limits are stripped entirely by `compiler/clause_splitter.js:31-32`.
- **Required Structured IR Representation**:
  Instead of loose string tags, the compiler must emit structured restriction objects:

#### A. Ordinary Once per Turn IR:
```json
{
  "restriction": {
    "scope": "INSTANCE",
    "type": "COUNT_PER_TURN",
    "count": 1,
    "resetInterval": "TURN"
  }
}
```

#### B. Same Name Once per Turn IR:
```json
{
  "restriction": {
    "scope": "SAME_NAME",
    "type": "COUNT_PER_TURN",
    "count": 1,
    "resetInterval": "TURN"
  }
}
```

---

## 3. Runtime Key Derivation & Reset Semantics

### 3.1. Ordinary Once per Turn Key Derivation
To correctly restrict the individual physical card on the field without leaking across duplicate cards or zone changes, the key anchors to the **field placement instance** (`placementId` or `stack.id`):

$$\text{Key}_{\text{Ordinary}} = \text{`TI:\$\{turn\}:\$\{playerSide\}:\$\{placementId\}:\$\{physicalAbilityId\}'}$$

- **Independent Multiple Card Activation**:
  - Player controls Spirit copy 1 (`placementId: p_101`). Activates ability $\rightarrow$ `TI:1:p1:p_101:BS01-002#ab1` is consumed.
  - Player controls Spirit copy 2 (`placementId: p_102`). Query `TI:1:p1:p_102:BS01-002#ab1` $\rightarrow$ fresh ($0/1$) $\rightarrow$ **activation succeeds!**
- **Reset Trigger**: Cleared on turn transition (`advanceTurn()`).
- **Zone Re-entry (Rule 6-1.3)**: If Spirit copy 1 is destroyed to Trash and re-summoned from Trash in the same turn, entering the field generates a fresh `placementId: p_103`. The key `TI:1:p1:p_103:BS01-002#ab1` is unconsumed, correctly allowing reactivation under Rule 6-1.3.

### 3.2. Same Name Once per Turn Key Derivation
For `[Once per turn: Same Name]`, the restriction binds across all cards sharing `card.name` controlled by that player:

$$\text{Key}_{\text{SameName}} = \text{`SN:\$\{turn\}:\$\{playerSide\}:\$\{normalizeName(cardName)\}:\$\{semanticAbilityId\}'}$$

- **Shared Enforcement**:
  - Player controls Spirit copy 1 (`cardName: "The Lizardman"`). Activates ability $\rightarrow$ `SN:1:p1:thelizardman:sem_44a` is consumed.
  - Player controls Spirit copy 2 (`cardName: "The Lizardman"`). Query `SN:1:p1:thelizardman:sem_44a` $\rightarrow$ count is $1/1$ $\rightarrow$ **BLOCKED with `RESTRICTION_EXHAUSTED`!**
- **Opponent Card Isolation**:
  - Opponent controls Spirit copy 3 (`playerSide: 'p2'`). Query `SN:1:p2:thelizardman:sem_44a` $\rightarrow$ count is $0/1$ $\rightarrow$ **Opponent is unaffected!**
- **Ability Independence on Same Card**:
  - If "The Lizardman" also has Ability 2 (`semanticAbilityId: sem_98b`), `SN:1:p1:thelizardman:sem_98b` remains fresh and is **not blocked**.
- **Cross-Printing Unification**:
  - Card A is original printing `BS01-002`; Card B is reprint `SD01-002`. Both have `cardName = "The Lizardman"` and identical semantic ability definition $\rightarrow$ shared key correctly blocks Card B after Card A activates.

---

## 4. Phase 4C.3.0 Inventory Distribution

From the verified Phase 4C.3.0 audit ledger (`phase4c3_pattern_coverage.csv`):

| Category | Audited Pattern | Abilities | Cards | Scope Required |
|---|---|---|---|---|
| **Ordinary OPT** | `PAT-LIMIT-OPT-GENERAL` | 81 | 81 | `INSTANCE` |
| **Ordinary OPT** | `PAT-LIMIT-UP-TO-ONCE` | 42 | 42 | `INSTANCE` |
| **Ordinary OPT** | `PAT-LIMIT-DIVINE-SKILL-OPT` | 123 | 121 | `INSTANCE` |
| **Same Name OPT** | `PAT-LIMIT-OPT-SAME-NAME` | 177 | 166 | `SAME_NAME` |
| **Ordinary OPG** | `PAT-LIMIT-OPG-INSTANCE` | 40 | 40 | `INSTANCE` (Game) |
| **Same Name OPG** | `PAT-LIMIT-OPG-SAME-NAME` | 18 | 18 | `SAME_NAME` (Game) |

Total Ordinary OPT/OPG: **286 abilities** across individual physical instances.  
Total Same Name OPT/OPG: **195 abilities** across shared same-name pools.

---

## 5. Concrete Real-Card Examples & Test Scenarios

### 5.1. Real-Card Example: Ordinary OPT (`BS01-002` The Lizardman)
- Canonical Text: `[LV1][LV2] (When Attacks) Once per turn, draw 1 card.`
- Scenario: Player controls two Lizardmen ($L_1$ and $L_2$).
- Step 1: $L_1$ attacks $\rightarrow$ Draws 1 card. Counter for $L_1$ reaches $1/1$.
- Step 2: $L_2$ attacks $\rightarrow$ Draws 1 card. Counter for $L_2$ reaches $1/1$.
- **Validation**: Both draws succeed. An engine that collapsed Ordinary OPT into Same Name would erroneously block $L_2$.

### 5.2. Real-Card Example: Same Name OPT (`BS52-X01` The RebirthDragon Siegwurm)
- Canonical Text: `[LV1][LV2] (When Attacks) [Once per turn: Same Name] Send 1 core from an opposing Spirit to Trash.`
- Scenario: Player controls two copies of Siegwurm ($S_1$ and $S_2$).
- Step 1: $S_1$ attacks $\rightarrow$ Activates effect $\rightarrow$ opponent loses 1 core. `SN:1:p1:therebirthdragonsiegwurm:...` is consumed.
- Step 2: $S_2$ attacks $\rightarrow$ Attempts effect activation $\rightarrow$ Rejected with `RESTRICTION_EXHAUSTED`.
- Step 3: Turn passes to Opponent. Opponent controls a Siegwurm ($S_3$). $S_3$ attacks $\rightarrow$ Key is `SN:2:p2:therebirthdragonsiegwurm:...` $\rightarrow$ Activation succeeds.
- **Validation**: Strict same-name player-scoped enforcement.
