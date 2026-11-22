# Phase K.1 — Canonical Targeting Contract

## 1. Architectural Purpose
This contract establishes a single, authoritative standard for card targeting, identification, source-zone validation, and atomic state mutation across the Battle Spirits Eternal (BSP) engine.

It eliminates ambiguity by decoupling:
- **Card Identity:** Unique instance ID (`card.id` or fallback canonical card number `card.cardNumber`).
- **Card Owner:** The player whose deck originally contained the card (`card.owner`).
- **Card Controller:** The player currently exercising authority over the card (`card.controller` or stack owner).
- **Physical Side:** The specific game board side (`'player'` vs `'opponent'`) where the card currently resides.
- **Physical Zone:** The physical array/slot (`'field'`, `'nexus'`, `'hand'`, `'deck'`, `'grave'`, `'removed'`, `'revealed'`, `'burst'`).
- **Logical Target Category:** Target archetype requested by card text (`Spirit`, `Ultimate`, `Brave`, `Nexus`, `Magic`, `Any`).
- **Source Zone:** Where the operation legally draws the candidate card from.
- **Destination Zone:** Where the operation moves the card upon successful resolution.
- **Cardinality & Optionality:** Exact target counts (`count`, `upTo`, `optional`, `all`).

---

## 2. Canonical Zone Normalization
All operations, resolvers, compilers, and UI adapters must normalize zone representations through the canonical boundary:

| Raw Input Representation | Canonical Zone | Physical Structure | Notes |
| :--- | :--- | :--- | :--- |
| `'field'`, `'battlefield'`, `'arena'` | `'field'` | `p.field` (Array of Stacks) | Holds Spirits, Ultimates, Braves, field Nexuses |
| `'nexus'`, `'nexuses'` | `'nexus'` | `p.nexus` & `p.field` | Grandwalker and standard nexuses |
| `'hand'`, `'hands'` | `'hand'` | `p.hand` (Array of Cards) | Private player hand |
| `'grave'`, `'trash'`, `'graveyard'` | `'grave'` | `p.grave` (Array of Cards) | **Card Grave.** Distinct from `p.trash` (core storage)! |
| `'removed'`, `'open'`, `'banished'` | `'removed'` | `p.removed` (Array of Cards) | Cards removed from game / Open zone |
| `'revealed'`, `'revealedcards'` | `'revealed'` | `p.revealed` / `state.revealedCards` | Temporary public reveal buffer |
| `'burst'`, `'burst_slot'` | `'burst'` | `p.burst` (Card or null) | Set burst card slot |
| `'deck'`, `'deck_top'`, `'deck_bottom'`| `'deck'` | `p.deck` (Array of Cards) | Draw pile |

> [!IMPORTANT]
> **Core Trash vs Card Grave Distinction:**
> - `p.grave` is an array of card objects (`Card[]`).
> - `p.trash` is a core storage object (`{ normal: number, soul: number }`).
> Operations selecting cards must NEVER access `p.trash` as a card array, and core movements must NEVER target `p.grave`.

---

## 3. Physical Side Resolution Contract
When validating or querying candidates:

1. **Explicit Player (`'player'`, `'self'`, `'friendly'`):**
   - Must evaluate **ONLY** against `state.players.player` (or the acting controller).
   - Under no circumstances may an opponent card satisfy this specification.
2. **Explicit Opponent (`'opponent'`, `'opp'`, `'opposing'`):**
   - Must evaluate **ONLY** against `state.players.opponent`.
   - Under no circumstances may a friendly player card satisfy this specification.
3. **Explicit Both / Either (`'both'`, `'either'`, `'all'`):**
   - Evaluates against `['player', 'opponent']`.
4. **Unspecified Side:**
   - For offensive/removal opcodes (`DESTROY`, `BOUNCE`, `EXHAUST`): Defaults strictly to `'opponent'`.
   - For beneficial/retrieval opcodes (`SALVAGE`, `SUMMON`, `REFRESH`): Defaults strictly to `'player'`.

---

## 4. Legality Validation & Revalidation Contract
Target validation occurs in two distinct phases:
1. **Candidate Query Phase:**
   - Filters cards by zone, side, type, cost, BP, and protection (Armor, Heavy Armor, target immunity).
   - Emits structured candidates to UI or prompt resolver with exact physical IDs.
2. **Commit / Resolution Revalidation Phase:**
   - Immediately prior to state mutation, the engine executes `validateTargetAvailability(state, target, expectedZone)`.
   - Confirms:
     a) Card instance still exists at `target.id`.
     b) Card instance is located on the requested physical `side`.
     c) Card instance is located in the requested `zone`.
     d) If targeted as a stack, card must still be the current top card of that stack.
     e) If targeted as an attached Brave, card must still be present in `stack.braves`.
   - If revalidation fails, the target is rejected (`INVALID_TARGET_SELECTION` or `STALE_TARGET_SELECTION`) and no state mutation occurs.

---

## 5. Transaction Atomicity & State Conservation
All card movement operations must follow transactional semantics:
1. **Preflight Legality:** Verify all requirements (costs, targets, restrictions, core availability) before any state mutation.
2. **Core Conservation:** Any cores detached during movement (e.g. spirit destruction or bounce) must be returned to the reserve or appropriate zone before completing the card transfer.
3. **Atomic Commit:** Remove card from source zone $\rightarrow$ place card into destination zone $\rightarrow$ emit single authoritative event.
4. **Full Rollback on Failure:** If any sub-step fails (e.g. core placement failure), rollback all modified structures to their exact pre-transaction state.
