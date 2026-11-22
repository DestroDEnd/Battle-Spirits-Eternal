# BATTLE SPIRITS ETERNAL — PHASE 3C
## State and Resource Invariants

---

### Authoritative Invariant Ledger

#### INV-CORE-01: Total System Core Conservation
- **Mathematical Formula / Invariant:** `Reserve(P1) + Field(P1) + Trash(P1) + Life(P1) + Reserve(P2) + Field(P2) + Trash(P2) + Life(P2) + Void === TotalCores`
- **Enforcement Mechanism:** Verified on every moveCore call and in engine diagnostic.

#### INV-CORE-02: Soul Core Singularity & Zone Legality
- **Mathematical Formula / Invariant:** `Exactly 1 Soul Core exists per player deck setup; resides in reserve, on a field stack, in trash, or void.`
- **Enforcement Mechanism:** isSoulCore flag tracked throughout zones.js and payment.js.

#### INV-ZONE-01: Ownership Integrity
- **Mathematical Formula / Invariant:** `card.owner is immutable; cards departing field route strictly to owner.trash, owner.hand, owner.deck.`
- **Enforcement Mechanism:** Enforced by moveCard in engine/zones.js.

#### INV-STACK-01: Field Stack Core Minimum
- **Mathematical Formula / Invariant:** `A field stack on field must maintain >= 1 core (normal or soul), else SBA immediately moves stack to trash.`
- **Enforcement Mechanism:** Enforced by checkStateBasedActions in engine/sba.js.

#### INV-DECK-01: Eternal Deck Profile Bounds
- **Mathematical Formula / Invariant:** `minSize >= 40, max 3 copies per card number, max 1 contract partner.`
- **Enforcement Mechanism:** Enforced by validateDeck in engine/rules/eternal.js.

#### INV-RESTRICT-01: Stage 4 Two-Phase Reservation
- **Mathematical Formula / Invariant:** `reservation.reserve() -> success -> execution -> commit() -> COMMITTED; aborted executions release reservation.`
- **Enforcement Mechanism:** Enforced by reserveRestriction and commitRestriction in engine/restrictions.js.


---

### Verification Summary
- **Core Conservation:** Verified across 18 total system cores.
- **Soul Core Singularity:** Verified in reserve, field stacks, and trash.
- **Deck Integrity:** 100% verified against Eternal format profile (min 40, max 3 copies).
- **Zone Conservation:** Cards never duplicated or orphaned across zone transitions.
