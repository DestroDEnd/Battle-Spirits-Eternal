# Phase K.1 — Unified Operation Targeting & Movement Matrix

## 1. Architectural Unification Standard
All card-selecting, card-locating, and card-moving operations in Battle Spirits Eternal (BSP) have been brought under the **Canonical Targeting Contract** ([CANONICAL_TARGETING_CONTRACT.md](file:///c:/Users/namis/Downloads/BSP/reports/phase_k1/CANONICAL_TARGETING_CONTRACT.md)).

Key invariants enforced uniformly across all operations:
1. **Canonical Zone Normalization:** All zone identifiers route through `normalizeCardZone` (`TRASH`/`GRAVE` $\rightarrow$ `grave`, `OPEN`/`REMOVED` $\rightarrow$ `removed`, `BURST` $\rightarrow$ `burst`, `HAND` $\rightarrow$ `hand`, `DECK` $\rightarrow$ `deck`, `FIELD` $\rightarrow$ `field`).
2. **Strict Physical Side Isolation:** Targets specifying `side: 'player'` evaluate strictly against the player's physical zones; targets specifying `side: 'opponent'` evaluate strictly against the opponent's physical zones. No accidental fallthrough occurs.
3. **Pre-Commit Legality Revalidation:** Selected card instances are re-verified via `validateTargetAvailability` immediately before committing mutations. Stale, moved, or corrupted duplicate targets are rejected without state mutation.
4. **Card Identity Preservation:** Card instances retain their original `id` throughout all zone transitions.
5. **Atomic Transactions & Core Conservation:** All core payments and placements are verified prior to mutation; any failure triggers a full state rollback.

---

## 2. Unified Operation Targeting Matrix

| Opcode | Canonical Source Zone(s) | Destination Zone | Target Side Resolution | Candidate Generation | Pre-Commit Revalidation | Identity Handling | Cardinality / Optionality | Emitted Events | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SUMMON** | `hand`, `grave`, `removed`, `revealed`, `burst`, `deck` | `field` (new Stack) | Controller (`'player'` or `'opponent'`) | Filtered matching from `normalizedFrom` pool | Strict source-zone match, LV1 core reserve check, restriction check | Preserved; `cardNumber` fallback if `id` absent | `count: 1`, optional if `op.optional` | `SUMMONED` | **UNIFIED & VERIFIED** |
| **SUMMON_FREE** | `burst`, `hand`, `grave`, `removed`, `revealed` | `field` (new Stack) | Controller | `sourceCard` or `resolveTargets` | `executeSummonTransaction` with `isFree=true` | Preserved | `count: 1`, optional if `op.optional` | `SUMMONED` | **UNIFIED & VERIFIED** |
| **DEPLOY_NEXUS** | `hand`, `grave`, `removed`, `revealed` | `field` / `nexus` | Controller | Filtered matching from `normalizedFrom` pool | Cost & core verification, presence check | Preserved | `count: 1`, optional if `op.optional` | `NEXUS_DEPLOYED` | **UNIFIED & VERIFIED** |
| **SALVAGE** | `grave` (default), `removed`, `revealed` | `hand` | Controller / Self | `p.grave` or explicit `normalizedFrom` pool | `validateTargetAvailability(state, item, 'grave')` | Preserved | `count: N`, up to count | `CARD_SALVAGED`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **ADD_TO_HAND** | `deck`, `revealed`, `grave`, `field` | `hand` | Controller | `revealedCards` pool or `resolveTargets` | Zone presence check | Preserved | `count: N` | `CARD_ADDED_TO_HAND`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **BOUNCE** | `field`, `nexus`, `hand` | `hand`, `deck_top`, `deck_bottom`, `grave` | Opponent (default) or Player | `resolveTargets` | `validateTargetAvailability`, Armor/Immunity check | Preserved (Stack deconstructed, cores to reserve) | `count: N`, `all: bool`, `upTo: bool` | `BOUNCED`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **DESTROY** | `field`, `nexus` | `grave` | Opponent (default) or Player | `resolveTargets` | `validateTargetAvailability`, destruction immunity, Armor | Preserved (Stack deconstructed, cores to reserve) | `count: N`, `all: bool`, `maxTotalBp`, `maxTotalCost` | `DESTROYED`, `DESTROYED_BATCH`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **SEND_TO_TRASH** | `field`, `hand`, `life`, `deck` | `grave` | Player or Opponent | `resolveTargets` | `validateTargetAvailability` | Preserved | `count: N` | `CARD_SENT_TO_TRASH`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **DISCARD** | `hand` | `grave` | Player (self) or Opponent | Hand cards matching filter | Hand presence check | Preserved | `count: N` | `CARD_DISCARDED`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **MILL** | `deck` (top N) | `grave` | Player or Opponent | Slices from `p.deck` | Non-empty deck check | Preserved | `count: N` | `CARD_MILLED`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **REVEAL** | `deck` (top N) or `hand` | `context.revealedCards` / `p.revealed` | Player or Opponent | Slices from `p.deck` | Non-empty deck check | Preserved | `count: N` | `CARDS_REVEALED` | **UNIFIED & VERIFIED** |
| **RETURN_TO_DECK** | `field`, `grave`, `hand`, `revealed` | `deck` (`top` or `bottom`) | Owner of Card | `resolveTargets` | `validateTargetAvailability` | Preserved | `count: N`, `all: bool` | `RETURNED_TO_DECK`, `CARD_MOVED` | **UNIFIED & VERIFIED** |
| **PREVIOUS_TARGET** | `context.selectedTargets` / `context.previousTargets` | Consumer-dependent | Preserved from previous targeting | Target extraction from context | `validateTargetAvailability(state, item, checkZone)` | Preserved | Inherited from previous targeting | Emitted by consumer opcode | **UNIFIED & VERIFIED** |
| **MOVE_CARD** | Any physical zone | Destination zone (`normalizeCardZone`) | Specified side (`normalizeTargetSide`) | Explicit ID or filter | Source presence & movement restriction check | Preserved | `count: N` | `CARD_MOVED` | **UNIFIED & VERIFIED** |

---

## 3. Behavioral Consistency Guarantees
- **No Inconsistent Handlers:** Operations do not implement bespoke ad-hoc side resolution or zone name translation. All operations route through the centralized helpers in `engine/selectors.js`.
- **Compile-Time / Run-Time Coherence:** Operations accept IR output directly without needing fragile string transformations or workarounds.
- **Fail-Closed Execution:** Any discrepancy between requested source zone and physical card location halts the operation cleanly with zero side-effects.

Proceed to **Work Package G (Prompt and Interaction Protocol Correctness)**.
