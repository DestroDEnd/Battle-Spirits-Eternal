# Battle Spirits Eternal (BSP) — Final Known Limitations & Dependency Register
## Phase K Deliverable

**Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Governing Standard:** Battle Spirits Eternal Rules Engine Invariant Standard (`AGENTS.md`)  
**Status:** **AUTHORITATIVE KNOWN LIMITATIONS & FUTURE ROADMAP**

---

## 1. Executive Statement of Limitations

Battle Spirits Eternal establishes a solid, deterministic, and evidence-verified baseline for 4,139 fully supported cards, 6,996 partially supported cards, and 374 vanilla cards across all 514 canonical IR shards.

To maintain absolute technical integrity, no unsupported ability is masked, approximated, or falsely claimed as working. This register enumerates the exact architectural boundaries, deferred mechanics, and card dependency clusters that remain unsupported.

---

## 2. Unimplemented Mechanics & Dependency Clusters

### 2.1 Mirage / Standby Legacy Syntax
- **Description:** Early-generation Standby effects and certain Mirage cards with legacy wording lacking explicit trigger step markers (`MAIN`, `WHEN_ATTACKS`, `BURST`).
- **Impacted Cards:** Approximately 420 cards across early BS sets.
- **Dependency:** Requires natural language timing normalization pass in `compiler/passes/timing.js` to map legacy trigger syntax to structured IR timing enums.

### 2.2 Cross-Zone Multi-Hop Chain Targeting
- **Description:** Complex effect chains requiring simultaneous multi-zone card filtering across non-standard zones (e.g., "Reveal 3 cards from Deck, send 1 to Trash, 1 to Hand, and 1 to Removed from Game based on dynamic level comparison").
- **Impacted Cards:** Approximately 280 cards in modern collaboration boosters.
- **Dependency:** Requires higher-order combinator opcodes (`MULTI_ZONE_DISPATCH`, `PARTITION_SELECTION`) in `engine/ops/index.js`.

### 2.3 Advanced Modern Wave Keywords
- **Description:** Modern era keywords with complex state hooks:
  - **Accel:** Playable from hand as Magic then placed to Open Zone/Trash.
  - **Soul Drive:** Ultimate-specific permanent banish of Soul Core from field to Void with game-ending continuous rule alteration.
  - **Contract Advent:** Multi-card stacking onto Partner contract spirits with counter condition checks.
- **Impacted Cards:** Modern booster cards (BS60–BS68, CB sets).
- **Status:** Explicitly classified as `UNSUPPORTED` in `card_support_matrix.json` rather than superficial approximations.

### 2.4 Unsupported Opcode Clusters (from `opcode_variant_support_matrix.json`)
- **Total Unique Opcodes in Canonical Database:** 288
  - Verified Active Production Opcodes: **142**
  - Partially Supported / Common Variant Opcodes: **84**
  - Unsupported / Unimplemented Opcodes: **62**
- Key unsupported opcodes: `ACCEL_PLAY`, `SOUL_DRIVE_DISPATCH`, `EXCHANGE_FIELD_ZONES`, `MIRAGE_TRIGGER_OVERRIDE`, `SEAL_CANCEL`.

---

## 3. Deliberate Architectural Boundaries

1. **Local-First Gameplay:** The engine and UI are strictly designed for local human vs human or human vs AI gameplay. Zero network multiplayer, WebSockets, or cloud databases are included by design.
2. **Determinism Over Animations:** Game engine progression pauses strictly on player interaction Promises. No UI animation timers (`setTimeout`) drive game logic or rules validation.
3. **Strict Core Conservation:** The engine enforces $\Delta C = 0$ at all times; operations attempting to fabricate cores from non-Void sources are hard-rejected.
