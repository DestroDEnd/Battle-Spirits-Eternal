# Phase K.1 — Complete Targeting Architecture Audit Report

## 1. Executive Overview
This audit inspects every subsystem, module, and opcode handler responsible for selecting, locating, validating, moving, and modifying cards in Battle Spirits Eternal (BSP).

The audited modules include:
- `engine/selectors.js` (Candidate querying, filtering, tie-breaking, target resolution, and legality validation)
- `engine/ops/index.js` (Opcode execution, card movement transactions, and context propagation)
- `engine/state.js` (State modeling, player zones, field stacks, and core tracking)
- `engine/legacy_bridge.js` (Legacy format compatibility adapters and zone mapping)
- `engine/interaction.js` & `engine/prompt_manager.js` (Decision prompts, candidate formatting, and player choices)
- `engine_adapter.js` (UI-to-engine command bridge and candidate queries)

---

## 2. Operation Targeting & Movement Inventory

| Opcode | Physical Source Zone(s) | Resulting Destination Zone | Target Side | Candidate Generation Path | Legality Validation | Identity Preserved? | Selection Prompt | Movement Transaction | Governing Tests | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SUMMON** | `HAND`, `GRAVE`, `TRASH`, `REMOVED`, `OPEN`, `REVEALED`, `BURST` | `FIELD` (new Stack) | Player / Controller | Pool generation by filter or `resolveTargets` | `isActionRestricted('CANNOT_SUMMON')`, effective cost, core placement | Yes (`id` or `cardNumber`) | `SELECT_SUMMON` if matching candidates > 1 | `executeSummonTransaction` (atomic core + stack move) | `work_package_hij1_operation_variants.test.js`, `core_game_rules_engine.test.js` | **INCOMPLETE (Source-zone precedence & fallthrough flaw)** |
| **SUMMON_FREE** | `BURST`, `HAND`, `GRAVE`, `TRASH`, `REMOVED`, `OPEN`, `REVEALED` | `FIELD` (new Stack) | Player / Controller | `sourceCard` (Burst) or `resolveTargets` | `isActionRestricted('CANNOT_SUMMON')`, 1+ core for LV1 | Yes | `SELECT_SUMMON` via `resolveTargets` | `executeSummonTransaction` with `isFree=true` | `eternal_17_burst_declaration.test.js`, `work_package_hij1_operation_variants.test.js` | **INCOMPLETE (Source-zone precedence flaw)** |
| **DEPLOY_NEXUS** | `HAND`, `GRAVE`, `TRASH`, `REVEALED` | `FIELD` / `NEXUS` | Player / Controller | `p.hand` or `resolveTargets` | Effective cost, restriction check | Yes | `SELECT_TARGET` if choice required | Atomic placement with initial core to nexus stack | `eternal_17_flag_nexus.test.js` | **VERIFIED** |
| **SALVAGE** | `GRAVE`, `TRASH` | `HAND` | Player / Self | `p.grave` filtered by card type, cost, family | `validateTargetAvailability` | Yes | `SELECT_SALVAGE` / `SELECT_TARGET` | Removes from grave array, pushes to hand array | `work_package_hij1_operation_variants.test.js` | **INCOMPLETE (Needs unified contract)** |
| **ADD_TO_HAND** | `DECK`, `REVEALED`, `GRAVE`, `FIELD` | `HAND` | Player / Controller | `context.revealedCards` or selector | Zone presence check | Yes | `SELECT_CARD` | Removes from source, pushes to `p.hand` | `work_package_hij1_operation_variants.test.js` | **VERIFIED** |
| **BOUNCE** | `FIELD`, `NEXUS` | `HAND` | Opponent (default) or Player | `resolveTargets` | `validateTargetAvailability`, Armor/Immunity checks | Yes | `SELECT_BOUNCE` / `SELECT_TARGET` | Stack disassembled, cores to reserve, card to hand | `phase4b2_destroy_bounce.test.js` | **INCOMPLETE (Target-side validation fallthrough)** |
| **DESTROY** | `FIELD`, `NEXUS` | `GRAVE` / `TRASH` | Opponent (default) or Player | `resolveTargets` | `validateTargetAvailability`, destruction immunity, Armor | Yes | `SELECT_TARGET` | Cores to reserve, cards to grave, emits `DESTROYED` | `phase4b2_destroy_bounce.test.js` | **INCOMPLETE (Target-side validation fallthrough)** |
| **SEND_TO_TRASH** | `FIELD`, `HAND`, `LIFE`, `DECK` | `GRAVE` / `TRASH` | Player or Opponent | Target selector | Zone presence check | Yes | Prompt if multiple | Atomic card/core movement | `trash_targeting_effects.test.js` | **VERIFIED** |
| **DISCARD** | `HAND` | `GRAVE` / `TRASH` | Player (self) or Opponent | `p.hand` filtered by target criteria | Hand membership | Yes | `DISCARD_SELECT` | Removes from hand, pushes to grave | `work_package_hij1_operation_variants.test.js` | **VERIFIED** |
| **MILL** | `DECK` (top) | `GRAVE` / `TRASH` | Player or Opponent | Top N cards of `player.deck` | Non-empty deck check | Yes | None (automatic top of deck) | Pops from deck, unshifts to grave | `work_package_c_ops_conditions_compiler.test.js` | **VERIFIED** |
| **REVEAL** | `DECK` (top) or `HAND` | `context.revealedCards` / `p.revealed` | Player or Opponent | Slices from top of deck | Deck count check | Yes | None (game announcement) | Pushes into revealed buffer | `work_package_hij1_operation_variants.test.js` | **INCOMPLETE (Context leak into SUMMON)** |
| **RETURN_TO_DECK** / **RETURN_DECK_BOTTOM** | `FIELD`, `GRAVE`, `HAND`, `REVEALED` | `DECK` (Top / Bottom) | Owner of Card | `resolveTargets` | `validateTargetAvailability` | Yes | `SELECT_TARGET` if prompt required | Pushes/unshifts into `owner.deck` | `work_package_hij1_operation_variants.test.js` | **VERIFIED** |
| **PREVIOUS_TARGET** | `context.selectedTargets` / `context.previousTargets` | Consumer-dependent | Preserved from source effect | Context extraction | `validateTargetAvailability` against target zone | Yes | None (re-uses selection) | Handled by downstream operation | `phase4c1_1_coexisting_effects_and_targets.test.js` | **INCOMPLETE (Target-side validation fallthrough)** |
| **MOVE_CARD** | Any physical zone | Specified destination zone | Specified player side | Explicit card ID or selector | Presence in source zone | Yes | Optional | Atomic transfer between zone arrays | `work_package_hij1_operation_variants.test.js` | **VERIFIED** |
| **SEPARATE_BRAVE** | `FIELD` (fused Stack) | `FIELD` (standalone Stack) or target zone | Owner of Brave | Stack brave array | Presence in `stack.braves` | Yes | None / Rules-mandated | Creates new field stack for brave, allocates cores | `phase_k_mechanics.test.js` | **VERIFIED** |
| **FLIP_CARD** / **REBIRTH_FLIP** | `FIELD`, `GRAVE`, etc. | Same physical zone (Face 'B') | Controller | `stack.top` or card instance | Presence of `backSide` metadata | Yes | None | Transforms card to Face 'B', copies back attributes | `phase_k_mechanics.test.js` | **VERIFIED** |

---

## 3. Detailed Root Cause Analysis of Specific Flaws

### 3.1 Target-Side Fallthrough Flaw (`engine/selectors.js`)
In `validateTargetAvailability(state, target, expectedZone)`:
- Lines 589-591 construct `sides` as:
  ```javascript
  const sides = (target.side === 'opponent' || target.side === 'opp')
    ? ['opponent', 'player']
    : ['player', 'opponent'];
  ```
- **Consequence:** If `target.side` is explicitly `'player'`, the loop searches the player's zones first, but if the card is not found there, it proceeds into `opponent`! Similarly, if `target.side` is explicitly `'opponent'`, it searches `opponent` first, then falls through to `player`.
- **Impact:** An opponent card is falsely validated as a legal target when the effect specifies `side: 'player'`. This causes opponent cards to be affected by friendly salvages, self-destructs, or friendly-only buffs.

### 3.2 Source-Zone Precedence & Fallthrough Flaw (`engine/ops/index.js`)
In `case 'SUMMON':`:
- Lines 1644-1657:
  ```javascript
  if (op.target === 'this_card' || op.from === 'this_card') {
    pool = sourceCard ? [sourceCard] : [];
  } else if (context.revealedCards && context.revealedCards.length > 0) {
    pool = context.revealedCards;
  } else if (p.revealed && p.revealed.length > 0) {
    pool = p.revealed;
  } else if (op.from === 'grave' || op.from === 'trash') {
    pool = p.grave;
  } else if (op.from === 'removed' || op.from === 'open') {
    pool = p.removed;
  } else {
    pool = p.hand;
  }
  ```
- **Consequence:** `context.revealedCards` took absolute precedence over an explicit `op.from === 'grave'`. If a card revealed 3 cards earlier in a turn and then triggered an effect to "Summon 1 Spirit card from your Trash", the engine attempted to summon from `revealedCards` rather than `p.grave`!
- Furthermore, `op.from` was checked against lowercase strings without case-insensitivity normalization (`op.from.toUpperCase()`), causing uppercase `'GRAVE'` or `'TRASH'` in compiled IR to fall through into `p.hand`.
- In `executeSummonTransaction(state, op, cardToSummon, ...)`:
  - Lines 144-150 did not enforce that `cardToSummon` resided in `op.from`; it only checked `reqFrom === 'BURST'`. For any other `op.from`, it checked `p.hand` first, then `p.grave`, etc.
  - At removal (lines 237-242), it performed blanket filtering across all zones rather than removing specifically from the validated source zone.

---

## 4. Architectural Corrective Plan
1. **Canonical Targeting Contract (WP C):** Define unified data structures and helper utilities in `engine/selectors.js` for zone normalization (`TRASH` $\rightarrow$ `grave`, `OPEN` $\rightarrow$ `removed`, `GRAVEYARD` $\rightarrow$ `grave`), side resolution, and validation.
2. **Strict Side Validation (WP D):** Rewrite `validateTargetAvailability` to enforce strict side isolation: explicit `'player'`/`'self'` checks ONLY `player`, explicit `'opponent'`/`'opp'` checks ONLY `opponent`, and only `'both'`/`'either'` searches both sides.
3. **Strict Source Precedence (WP E):** Rewrite `case 'SUMMON'` and `executeSummonTransaction` so that explicit `op.from` has strict priority over incidental context, normalize zone names with case insensitivity, reject cards not physically present in the requested source zone, and remove exclusively from that source zone.
4. **Operation Unification (WP F):** Refactor all card-selecting/moving operations to use the unified contract.

Proceed to **Work Package C (Canonical Targeting Contract)**.
