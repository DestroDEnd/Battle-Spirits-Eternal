# Unresolved Limitations & Deferred Scope — Phase 4C.3.2.2 Corrective

## 1. Deferred Shard Recompilation (TC-COL-06)
- **Status:** BLOCKED / DEFERRED.
- **Reason:** In accordance with the strict constraints of Phase 4C.3.2.1 and Phase 4C.3.2.2, batch recompilation and modification of the 514 pre-compiled card IR shards are explicitly out of scope.
- **Resolution Plan:** Full batch regeneration of the 514 card IR shards with physical and semantic ability identities and canonical limit metadata is scheduled for Phase 4C.3.2.3.

## 2. In-Memory Engine State & Replay Durability
- **Status:** BY DESIGN / DOCUMENTED.
- **Description:** Activation-limit counters and restriction metadata reside in `state.restrictions` on the in-memory engine state. They are fully serializable via `JSON.stringify()` / `JSON.parse()`, validated by `validateRestrictionState()`, and bidirectional-synced with legacy `state.abilityUses` via `legacy_bridge.js`. External persistence across database sessions is governed by caller-level game serialization.

## 3. Advanced Burst Timing Window Interactions
- **Status:** COMPATIBLE / MONITORED.
- **Description:** Burst card activations are evaluated and committed through the standard `resolver.resolveAbility` and `commitRestriction` pipeline upon burst window resolution. As burst triggers interact with multi-step priority windows, all burst effects honor `ONCE_PER_TURN` and `ONCE_PER_GAME` limits identically to main-timing activations.
